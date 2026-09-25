// sixmatch: paired games between two networks in one process (one CUDA context instead of one per engine).
//
//   sixmatch --net-a a.onnx --net-b b.onnx --openings pairs.txt [--movetime 300] [--radius 8] [--concurrency 2]
//            [--max-stones 400] [--set-a name=value]... [--set-b name=value]... [--cpu | --trt]
//            [--movetime-a ms] [--movetime-b ms] [--pause-file path]
//
// While `--pause-file` exists, no new game starts; games in progress finish, since their turns are timed.
//
// --movetime-a / --movetime-b give one side its own time per turn, for time-odds matches.
//
// `pairs.txt` holds one opening per line as "q r q r ...". Each opening is played twice, with A as X and as O.
// Every finished game is printed as a JSON line:
//
//   {"pair":0,"aIsX":true,"winner":"X"|"O"|null,"reason":"six"|"forfeit"|"length","detail":"...","moves":[[q,r],...],
//    "thinkA":12.3,"turnsA":40,"thinkB":12.1,"turnsB":40}
//
// Settings after --set-a / --set-b are MCTS settings as `setoption` takes them (e.g. reuseTree=0).
#include <atomic>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "mcts.hpp"

namespace {

struct Options {
  std::string netA;
  std::string netB;
  std::string openings;
  int moveTimeMs = 300;
  int moveTimeMsA = 0;  // 0: same as moveTimeMs
  int moveTimeMsB = 0;
  int radius = 8;
  int concurrency = 2;
  int maxStones = 400;
  std::string pauseFile;
  std::vector<std::pair<std::string, std::int64_t>> setA;
  std::vector<std::pair<std::string, std::int64_t>> setB;
  six::Device device = six::Device::Cuda;
};

std::pair<std::string, std::int64_t> setting(const std::string& text) {
  const auto eq = text.find('=');
  if (eq == std::string::npos) throw std::invalid_argument("settings look like name=value: " + text);
  return {text.substr(0, eq), std::stoll(text.substr(eq + 1))};
}

Options parse(int argc, char** argv) {
  Options o;
  for (int i = 1; i < argc; ++i) {
    const std::string a = argv[i];
    const auto next = [&]() -> std::string {
      if (i + 1 >= argc) throw std::invalid_argument("missing value after " + a);
      return argv[++i];
    };
    if (a == "--net-a") o.netA = next();
    else if (a == "--net-b") o.netB = next();
    else if (a == "--openings") o.openings = next();
    else if (a == "--movetime") o.moveTimeMs = std::stoi(next());
    else if (a == "--movetime-a") o.moveTimeMsA = std::stoi(next());
    else if (a == "--movetime-b") o.moveTimeMsB = std::stoi(next());
    else if (a == "--radius") o.radius = std::stoi(next());
    else if (a == "--concurrency") o.concurrency = std::max(1, std::stoi(next()));
    else if (a == "--max-stones") o.maxStones = std::stoi(next());
    else if (a == "--pause-file") o.pauseFile = next();
    else if (a == "--set-a") o.setA.push_back(setting(next()));
    else if (a == "--set-b") o.setB.push_back(setting(next()));
    else if (a == "--cpu") o.device = six::Device::Cpu;
    else if (a == "--trt") o.device = six::Device::TensorRt;
    else throw std::invalid_argument("unknown option " + a);
  }
  if (o.netA.empty() || o.netB.empty() || o.openings.empty()) throw std::invalid_argument("--net-a, --net-b and --openings are required");
  return o;
}

std::vector<std::vector<six::Hex>> readOpenings(const std::string& path) {
  std::ifstream in(path);
  if (!in) throw std::runtime_error("can't read " + path);
  std::vector<std::vector<six::Hex>> out;
  std::string line;
  while (std::getline(in, line)) {
    std::istringstream ss(line);
    std::vector<six::Hex> stones;
    int q = 0;
    int r = 0;
    while (ss >> q >> r) stones.push_back({q, r});
    out.push_back(std::move(stones));
  }
  return out;
}

struct Outcome {
  six::Player winner = six::Player::None;
  std::string reason = "length";
  std::string detail;
  double think[2] = {0.0, 0.0};  // A, B
  int turns[2] = {0, 0};
};

std::string escape(const std::string& s) {
  std::string out;
  for (const char c : s) {
    if (c == '"' || c == '\\') out += '\\';
    out += (c == '\n' ? ' ' : c);
  }
  return out;
}

}  // namespace

int main(int argc, char** argv) {
  Options options;
  std::vector<std::vector<six::Hex>> openings;
  try {
    options = parse(argc, argv);
    openings = readOpenings(options.openings);
  } catch (const std::exception& e) {
    std::cerr << "sixmatch: " << e.what() << '\n';
    return 2;
  }
  six::Evaluator netA(options.netA, options.device);
  six::Evaluator netB(options.netB, options.device);

  std::atomic<int> nextJob{0};
  std::mutex printMutex;
  const int jobs = static_cast<int>(openings.size()) * 2;

  const auto worker = [&]() {
    six::Mcts searchA(netA);
    six::Mcts searchB(netB);
    for (const auto& [name, value] : options.setA) searchA.params().set(name, value);
    for (const auto& [name, value] : options.setB) searchB.params().set(name, value);
    for (int job = nextJob.fetch_add(1); job < jobs; job = nextJob.fetch_add(1)) {
      // Pause between games, never mid-turn.
      while (!options.pauseFile.empty() && std::filesystem::exists(options.pauseFile)) {
        std::this_thread::sleep_for(std::chrono::seconds(2));
      }
      const int pair = job / 2;
      const bool aIsX = job % 2 == 0;
      six::Board game(options.radius);
      Outcome outcome;
      for (const six::Hex& h : openings[static_cast<std::size_t>(pair)]) game.place(h);
      searchA.newGame();
      searchB.newGame();
      const auto forfeit = [&](six::Player loser, const std::string& why) {
        outcome.winner = six::other(loser);
        outcome.reason = "forfeit";
        outcome.detail = why;
      };
      while (game.winner() == six::Player::None && game.stones() < options.maxStones && outcome.reason != "forfeit") {
        const six::Player side = game.current();
        const bool aMoves = (side == six::Player::X) == aIsX;
        six::Mcts& search = aMoves ? searchA : searchB;
        six::SearchLimits limits;
        limits.moveTimeMs = aMoves ? (options.moveTimeMsA ? options.moveTimeMsA : options.moveTimeMs)
                                   : (options.moveTimeMsB ? options.moveTimeMsB : options.moveTimeMs);
        const auto began = std::chrono::steady_clock::now();
        six::SearchResult result;
        try {
          result = search.search(game, limits);
        } catch (const std::exception& e) {
          forfeit(side, std::string(aMoves ? "A" : "B") + " search failed: " + e.what());
          break;
        }
        outcome.think[aMoves ? 0 : 1] += std::chrono::duration<double>(std::chrono::steady_clock::now() - began).count();
        outcome.turns[aMoves ? 0 : 1] += 1;
        const int needed = game.stonesLeft();
        if (result.stones.empty() || static_cast<int>(result.stones.size()) > needed) {
          forfeit(side, "returned " + std::to_string(result.stones.size()) + " stones for a " + std::to_string(needed) + "-stone turn");
          break;
        }
        for (const six::Hex& h : result.stones) {
          if (game.place(h) != six::PlaceError::None) {
            forfeit(side, "played an illegal stone " + std::to_string(h.q) + "," + std::to_string(h.r));
            break;
          }
          if (game.winner() != six::Player::None) break;
        }
        if (outcome.reason != "forfeit" && game.winner() == six::Player::None && static_cast<int>(result.stones.size()) < needed) {
          forfeit(side, "stopped a turn early without winning");
        }
      }
      if (outcome.reason != "forfeit" && game.winner() != six::Player::None) {
        outcome.winner = game.winner();
        outcome.reason = "six";
      }
      std::ostringstream os;
      os << "{\"pair\":" << pair << ",\"aIsX\":" << (aIsX ? "true" : "false") << ",\"winner\":";
      if (outcome.winner == six::Player::None) os << "null";
      else os << '"' << six::toChar(outcome.winner) << '"';
      os << ",\"reason\":\"" << outcome.reason << "\",\"detail\":\"" << escape(outcome.detail) << "\",\"moves\":[";
      for (std::size_t i = 0; i < game.moves().size(); ++i) os << (i ? "," : "") << '[' << game.moves()[i].q << ',' << game.moves()[i].r << ']';
      os << "],\"thinkA\":" << outcome.think[0] << ",\"turnsA\":" << outcome.turns[0] << ",\"thinkB\":" << outcome.think[1]
         << ",\"turnsB\":" << outcome.turns[1] << "}";
      std::lock_guard<std::mutex> lock(printMutex);
      std::cout << os.str() << '\n' << std::flush;
    }
  };

  std::vector<std::thread> threads;
  for (int i = 0; i < options.concurrency; ++i) threads.emplace_back(worker);
  for (auto& t : threads) t.join();
  return 0;
}
