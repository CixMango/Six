// sixengine: the Six engine protocol over stdin/stdout, one command per line.
//
//   six                                  -> id name ..., id version ..., sixok
//   isready                              -> readyok
//   newgame                              forget earlier positions
//   position radius <r> [moves q r ...]  set the game from its stone sequence
//   setoption <name> <value>             change a search setting (see SearchParams and MctsParams)
//   options                              -> option <name> <value> lines for the search that plays, then optionsdone
//   go [depth d] [movetime ms] [nodes n] -> info ... lines, then bestmove q r [q r]
//   stop                                 end the current search early
//   quit
//
// With `--net model.onnx` (plus optional `--cpu` or `--trt`) it plays with MCTS instead of alpha-beta.
// GPU runs need the CUDA (and for --trt, TensorRT) DLLs on PATH; a SIX_DML build uses DirectML instead.
#include <algorithm>
#include <atomic>
#include <memory>
#include <iostream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "nnue.hpp"
#include "search.hpp"

#ifdef SIX_WITH_NET
#include "evaluator.hpp"
#include "mcts.hpp"
#endif

namespace {

std::mutex outputMutex;

void send(const std::string& line) {
  std::lock_guard<std::mutex> lock(outputMutex);
  std::cout << line << '\n' << std::flush;
}

// Fallback when a search fails (e.g. the game outgrew the board window), so the engine never goes silent.
std::vector<six::Hex> emergencyTurn(const std::vector<six::Hex>& moves, int stonesLeft) {
  std::vector<six::Hex> turn;
  if (moves.empty()) return {{0, 0}};
  const auto taken = [&](six::Hex h) {
    return std::find(moves.begin(), moves.end(), h) != moves.end() || std::find(turn.begin(), turn.end(), h) != turn.end();
  };
  const six::Hex around[] = {{1, 0}, {0, 1}, {-1, 1}, {-1, 0}, {0, -1}, {1, -1}};
  for (auto m = moves.rbegin(); m != moves.rend() && static_cast<int>(turn.size()) < stonesLeft; ++m) {
    for (const six::Hex& d : around) {
      const six::Hex h{m->q + d.q, m->r + d.r};
      if (static_cast<int>(turn.size()) < stonesLeft && !taken(h)) turn.push_back(h);
    }
  }
  return turn;
}

int stonesLeftAt(std::size_t stones) {
  if (stones == 0) return 1;
  return (stones - 1) % 2 == 0 ? 2 : 1;
}

}  // namespace

int main(int argc, char** argv) {
  std::ios::sync_with_stdio(false);
  six::Searcher searcher(256);
  // --nnue <weights>: alpha-beta evaluates with NNUE weights from trainer/nnue_train.py.
  for (int i = 1; i + 1 < argc; ++i) {
    if (std::string(argv[i]) == "--nnue") {
      try {
        searcher.setNnue(std::make_shared<const six::nnue::Weights>(six::nnue::Weights::load(argv[i + 1])));
      } catch (const std::exception& e) {
        std::cerr << "could not load the NNUE weights: " << e.what() << '\n';
        return 1;
      }
    }
  }
#ifdef SIX_WITH_NET
  std::unique_ptr<six::Evaluator> evaluator;
  std::unique_ptr<six::Mcts> mcts;
  for (int i = 1; i < argc; ++i) {
    if (std::string(argv[i]) == "--net" && i + 1 < argc) {
#ifdef SIX_DML
      six::Device device = six::Device::DirectMl;
#else
      six::Device device = six::Device::Cuda;
#endif
      for (int j = 1; j < argc; ++j) {
        if (std::string(argv[j]) == "--cpu") device = six::Device::Cpu;
        if (std::string(argv[j]) == "--trt") device = six::Device::TensorRt;
      }
      try {
        evaluator = std::make_unique<six::Evaluator>(argv[i + 1], device);
        mcts = std::make_unique<six::Mcts>(*evaluator);
      } catch (const std::exception& e) {
        std::cerr << "could not load the network: " << e.what() << '\n';
        return 1;
      }
    }
  }
  const auto stopSearch = [&]() {
    searcher.stop();
    if (mcts) mcts->stop();
  };
#else
  (void)argc;
  (void)argv;
  const auto stopSearch = [&]() { searcher.stop(); };
#endif
  six::Board board(9);
  std::vector<six::Hex> gameMoves;  // as the host sent them, even when the board couldn't take them all
  bool boardMatches = true;
  std::thread worker;

  auto finishSearch = [&]() {
    if (worker.joinable()) {
      stopSearch();
      worker.join();
    }
  };

  std::string line;
  while (std::getline(std::cin, line)) {
    // Some hosts prefix the stream with a UTF-8 byte order mark; drop it.
    if (line.rfind("\xEF\xBB\xBF", 0) == 0) line.erase(0, 3);
    if (!line.empty() && line.back() == '\r') line.pop_back();
    std::istringstream in(line);
    std::string command;
    in >> command;

    if (command == "six") {
#ifdef SIX_WITH_NET
      send(mcts ? "id name HexBot Net" : "id name HexBot Baseline");
#else
      send("id name HexBot Baseline");
#endif
      send("id version 0.1");
      send("sixok");
    } else if (command == "isready") {
      finishSearch();
      send("readyok");
    } else if (command == "newgame") {
      finishSearch();
      searcher.newGame();
#ifdef SIX_WITH_NET
      if (mcts) mcts->newGame();
#endif
    } else if (command == "position") {
      finishSearch();
      std::string word;
      int radius = 9;
      std::vector<six::Hex> moves;
      while (in >> word) {
        if (word == "radius") {
          in >> radius;
        } else if (word == "moves") {
          int q = 0;
          int r = 0;
          while (in >> q >> r) moves.push_back({q, r});
        }
      }
      gameMoves = moves;
      boardMatches = false;
      try {
        six::Board next(radius);
        bool legal = true;
        for (std::size_t i = 0; i < moves.size() && legal; ++i) {
          if (next.place(moves[i]) != six::PlaceError::None) {
            send("error illegal move " + std::to_string(i + 1));
            legal = false;
          }
        }
        board = std::move(next);
        boardMatches = legal;
      } catch (const std::exception& e) {
        send(std::string("error ") + e.what());
      }
    } else if (command == "setoption") {
      finishSearch();
      std::string name;
      std::int64_t value = 0;
      // Some names (rootThreatNodes) exist in both searches, so set it in each.
      bool known = static_cast<bool>(in >> name >> value) && searcher.params().set(name, value);
#ifdef SIX_WITH_NET
      if (mcts && !name.empty()) known = mcts->params().set(name, value) || known;
#endif
      if (!known) send("error bad option " + line.substr(line.find(command) + command.size()));
    } else if (command == "options") {
#ifdef SIX_WITH_NET
      if (mcts) {
        for (const auto& [name, value] : mcts->params().list()) send("option " + name + " " + std::to_string(value));
      }
#endif
      for (const auto& [name, value] : searcher.params().list()) {
#ifdef SIX_WITH_NET
        if (mcts && name == "rootThreatNodes") continue;  // the network search's own budget is the one that plays
#endif
        send("option " + name + " " + std::to_string(value));
      }
      send("optionsdone");
    } else if (command == "go") {
      finishSearch();
      six::SearchLimits limits;
      std::string word;
      while (in >> word) {
        if (word == "depth") in >> limits.maxDepth;
        else if (word == "movetime") in >> limits.moveTimeMs;
        else if (word == "nodes") in >> limits.maxNodes;
      }
      const six::Board position = board;
#ifdef SIX_WITH_NET
      six::Mcts* net = mcts.get();
#else
      const std::nullptr_t net = nullptr;
#endif
      const std::vector<six::Hex> movesSent = gameMoves;
      const bool searchable = boardMatches;
      worker = std::thread([&searcher, net, position, limits, movesSent, searchable]() {
        bool reported = false;
        const auto report = [&reported](const six::SearchInfo& info) {
          std::ostringstream os;
          os << "info depth " << info.depth << " score " << info.score << " nodes " << info.nodes << " time " << info.timeMs
             << " pv";
          for (const auto& h : info.pv) os << ' ' << h.q << ' ' << h.r;
          send(os.str());
          reported = true;
        };
        six::SearchResult result;
        try {
          if (!searchable) throw std::runtime_error("the engine's board couldn't take this position");
#ifdef SIX_WITH_NET
          result = net ? net->search(position, limits, report) : searcher.search(position, limits, report);
#else
          (void)net;
          result = searcher.search(position, limits, report);
#endif
        } catch (const std::exception& e) {
          send(std::string("info string search failed: ") + e.what() + "; playing next to the newest stones");
#ifdef SIX_WITH_NET
          if (net) net->newGame();
#endif
          result = six::SearchResult{};
          result.stones = emergencyTurn(movesSent, stonesLeftAt(movesSent.size()));
          reported = true;
        }
        if (!reported && !result.stones.empty()) {
          // Wins found before the main search (on the board or by threats) still get a score line.
          report({result.depth, result.score, result.nodes, result.timeMs, result.stones});
        }
        std::ostringstream os;
        os << "bestmove";
        for (const auto& h : result.stones) os << ' ' << h.q << ' ' << h.r;
        if (result.stones.empty()) os << " none";
        send(os.str());
      });
    } else if (command == "stop") {
      finishSearch();
    } else if (command == "quit") {
      break;
    } else if (!command.empty()) {
      send("error unknown command " + command);
    }
  }
  finishSearch();
  return 0;
}
