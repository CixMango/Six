// sixselfplay: the network plays itself to make reinforcement-learning data.
//
//   sixselfplay --net model.onnx --out dir [--games N] [--threads T] [--full 200] [--fast 32]
//               [--full-share 25] [--sampled 16] [--fast-sampled 4] [--max-stones 300] [--seed S] [--cpu | --trt]
//
// Every stone gets a Gumbel search; a random `full-share` percent of them get the full budget and become
// training rows (playout cap randomization). Openings are random clustered positions of 1-11 stones with
// no side holding four, at radius 8 or 9. Each thread appends games to <dir>/games-<thread>.jsonl:
//
//   {"radius":9,"opening":5,"moves":[[q,r],...],"winner":"X"|"O"|null,
//    "rows":[{"at":12,"value":0.31,"policy":[[q,r,p],...]},...]}
//
// `at` is the number of stones before the searched stone; `value` is the search value for its mover.
#include <atomic>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <mutex>
#include <random>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "mcts.hpp"

namespace {

struct Options {
  std::string net;
  std::string out;
  int games = 1000;
  int threads = 16;
  int full = 200;
  int fast = 32;
  int fullShare = 25;
  int sampled = 16;
  int fastSampled = 4;
  int maxStones = 300;
  std::uint64_t seed = 0;
  bool cpu = false;
  bool tensorRt = false;
};

Options parse(int argc, char** argv) {
  Options o;
  o.seed = static_cast<std::uint64_t>(std::chrono::system_clock::now().time_since_epoch().count());
  for (int i = 1; i < argc; ++i) {
    const std::string a = argv[i];
    const auto next = [&]() -> std::string {
      if (i + 1 >= argc) throw std::invalid_argument("missing value after " + a);
      return argv[++i];
    };
    if (a == "--net") o.net = next();
    else if (a == "--out") o.out = next();
    else if (a == "--games") o.games = std::stoi(next());
    else if (a == "--threads") o.threads = std::stoi(next());
    else if (a == "--full") o.full = std::stoi(next());
    else if (a == "--fast") o.fast = std::stoi(next());
    else if (a == "--full-share") o.fullShare = std::stoi(next());
    else if (a == "--sampled") o.sampled = std::stoi(next());
    else if (a == "--fast-sampled") o.fastSampled = std::stoi(next());
    else if (a == "--max-stones") o.maxStones = std::stoi(next());
    else if (a == "--seed") o.seed = std::stoull(next());
    else if (a == "--cpu") o.cpu = true;
    else if (a == "--trt") o.tensorRt = true;
    else throw std::invalid_argument("unknown option " + a);
  }
  if (o.net.empty() || o.out.empty()) throw std::invalid_argument("--net and --out are required");
  return o;
}

/** A random opening: stones placed within two steps of earlier ones, redrawn whenever a side would hold four. */
six::Board randomOpening(std::mt19937_64& rng) {
  const int radius = rng() % 2 == 0 ? 8 : 9;
  const int stones = 1 + 2 * static_cast<int>(rng() % 6);
  while (true) {
    six::Board board(radius);
    board.place({0, 0});
    for (int attempt = 0; attempt < stones * 20 && board.stones() < stones; ++attempt) {
      const six::Hex base = board.moves()[rng() % board.moves().size()];
      const int dq = static_cast<int>(rng() % 5) - 2;
      const int dr = static_cast<int>(rng() % 5) - 2;
      if (std::abs(dq + dr) > 2) continue;
      if (board.place({base.q + dq, base.r + dr}) != six::PlaceError::None) continue;
      if (board.threatCount(six::Player::X) > 0 || board.threatCount(six::Player::O) > 0) break;
    }
    if (board.stones() == stones && board.threatCount(six::Player::X) == 0 && board.threatCount(six::Player::O) == 0) return board;
  }
}

std::string toJson(const six::Board& game, int opening, const std::vector<std::string>& rows) {
  std::ostringstream os;
  os << "{\"radius\":" << game.radius() << ",\"opening\":" << opening << ",\"moves\":[";
  for (std::size_t i = 0; i < game.moves().size(); ++i) os << (i ? "," : "") << '[' << game.moves()[i].q << ',' << game.moves()[i].r << ']';
  os << "],\"winner\":";
  if (game.winner() == six::Player::None) os << "null";
  else os << '"' << six::toChar(game.winner()) << '"';
  os << ",\"rows\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) os << (i ? "," : "") << rows[i];
  os << "]}";
  return os.str();
}

}  // namespace

int main(int argc, char** argv) {
  Options options;
  try {
    options = parse(argc, argv);
  } catch (const std::exception& e) {
    std::cerr << "sixselfplay: " << e.what() << '\n';
    return 2;
  }
  std::filesystem::create_directories(options.out);
  six::Evaluator network(options.net, options.cpu ? six::Device::Cpu : options.tensorRt ? six::Device::TensorRt : six::Device::Cuda);
  six::BatchingEvaluator batching(network, 1024, std::chrono::microseconds(1500));

  std::atomic<int> nextGame{0};
  std::atomic<int> finished{0};
  std::atomic<std::int64_t> rowsWritten{0};
  std::atomic<std::int64_t> stonesPlayed{0};
  std::mutex printMutex;
  const auto started = std::chrono::steady_clock::now();

  const auto worker = [&](int index) {
    std::mt19937_64 rng(options.seed * 1000003ULL + static_cast<std::uint64_t>(index));
    six::Mcts mcts(batching, 2);  // 2 MB solver table per thread: its searches are at most 2,000 nodes
    mcts.params().batch = 8;
    mcts.params().rootThreatNodes = 2'000;
    mcts.params().leafThreatNodes = 32;
    mcts.params().cacheEntries = 1 << 13;  // per thread; mostly transpositions within one stone's search
    std::ofstream sink(std::filesystem::path(options.out) / ("games-" + std::to_string(index) + ".jsonl"), std::ios::app);
    std::uniform_int_distribution<int> percent(0, 99);
    while (nextGame.fetch_add(1) < options.games) {
      six::Board game = randomOpening(rng);
      const int opening = game.stones();
      mcts.newGame();
      std::vector<std::string> rows;
      try {
      while (game.winner() == six::Player::None && game.stones() < options.maxStones) {
        const bool full = percent(rng) < options.fullShare;
        const six::StoneChoice choice = mcts.searchStone(game, full ? options.full : options.fast, full ? options.sampled : options.fastSampled, rng);
        if (full && !choice.decided) {
          std::ostringstream row;
          row << "{\"at\":" << game.stones() << ",\"value\":" << choice.value << ",\"kl\":" << choice.surprise << ",\"policy\":[";
          for (std::size_t i = 0; i < choice.policy.size(); ++i) {
            row << (i ? "," : "") << '[' << choice.policy[i].first.q << ',' << choice.policy[i].first.r << ',' << choice.policy[i].second << ']';
          }
          row << "]}";
          rows.push_back(row.str());
        }
        if (game.place(choice.move) != six::PlaceError::None) {
          std::lock_guard<std::mutex> lock(printMutex);
          std::cerr << "thread " << index << ": search chose an illegal stone; abandoning the game\n";
          break;
        }
      }
      } catch (const std::exception& e) {
        std::lock_guard<std::mutex> lock(printMutex);
        std::cerr << "thread " << index << ": " << e.what() << "; dropping the game\n";
        continue;
      }
      sink << toJson(game, opening, rows) << '\n' << std::flush;
      rowsWritten += static_cast<std::int64_t>(rows.size());
      stonesPlayed += game.stones() - opening;
      const int done = ++finished;
      if (done % 20 == 0) {
        const double hours = std::chrono::duration<double>(std::chrono::steady_clock::now() - started).count() / 3600.0;
        std::lock_guard<std::mutex> lock(printMutex);
        std::cout << done << " games, " << static_cast<int>(done / hours) << "/hour, " << rowsWritten.load() << " rows, "
                  << static_cast<int>(batching.positions() / (hours * 3600.0)) << " evals/s, average batch "
                  << (batching.batches() ? batching.positions() / batching.batches() : 0) << ", network busy "
                  << static_cast<int>(100.0 * batching.networkSeconds() / (hours * 3600.0)) << "%\n" << std::flush;
      }
    }
  };

  std::vector<std::thread> threads;
  for (int i = 0; i < options.threads; ++i) threads.emplace_back(worker, i);
  for (auto& t : threads) t.join();
  std::cout << "done: " << finished.load() << " games, " << rowsWritten.load() << " rows, " << stonesPlayed.load() << " stones\n";
  return 0;
}
