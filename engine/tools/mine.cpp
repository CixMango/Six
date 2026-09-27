// Replays self-play games and asks, before every two-stone turn, whether the side to move has a forced win: with the
// engine's turn list and with the complete one (wide). One JSON line per position with a win, for finding the wins
// Six missed and positions to train on.
//
// Usage: sixmine [--nodes 200000] [--turns 8] [--threads 4] games.jsonl ... > wins.jsonl
#include <algorithm>
#include <atomic>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "tactics.hpp"
#include "threats.hpp"

namespace {

using six::Board;
using six::Hex;
using six::Player;

struct Game {
  std::string file;
  int index = 0;
  int radius = 9;
  char winner = '-';
  std::vector<Hex> moves;
};

// The few fields needed, read straight from the record's text.
bool parse(const std::string& line, Game& g) {
  const auto radius = line.find("\"radius\":");
  if (radius != std::string::npos) g.radius = std::atoi(line.c_str() + radius + 9);
  const auto winner = line.find("\"winner\":\"");
  if (winner != std::string::npos) g.winner = line[winner + 10];
  auto at = line.find("\"moves\":[");
  if (at == std::string::npos) return false;
  at += 9;
  while (at < line.size() && line[at] == '[') {
    char* end = nullptr;
    const long q = std::strtol(line.c_str() + at + 1, &end, 10);
    const long r = std::strtol(end + 1, &end, 10);
    g.moves.push_back({static_cast<int>(q), static_cast<int>(r)});
    at = static_cast<std::size_t>(end - line.c_str()) + 1;  // past ']'
    if (at < line.size() && line[at] == ',') ++at;
  }
  return !g.moves.empty();
}

// The forced win played out from here: the solver's turns, and for the opponent the block that keeps the win longest,
// until six in a row. Empty if the line can't be completed.
std::vector<Hex> playOut(Board board, six::ThreatSolver& solver, int turns, std::int64_t nodes) {
  const Player me = board.current();
  std::vector<Hex> line;
  auto put = [&](Hex h) {
    if (board.place(h) != six::PlaceError::None) return false;
    line.push_back(h);
    return true;
  };
  for (int step = 0; step < 40 && board.winner() == Player::None; ++step) {
    if (board.current() == me) {
      const auto finish = six::threatWindows(board, me);
      if (!finish.empty()) {
        for (int i = 0; i < six::kWinLength && board.winner() == Player::None; ++i) {
          const Hex c = finish.front().cell(i);
          if (board.at(c) == Player::None && !put(c)) return {};
        }
        break;
      }
      solver.clear();
      const six::ThreatWin w = solver.solve(board, turns, nodes);
      if (!w.found || !put(w.a) || !put(w.b)) return {};
    } else {
      std::vector<std::pair<Hex, Hex>> pairs;
      six::coveringPairs(board, me, pairs);
      if (pairs.empty()) {
        // Three or more stones needed: block what two stones can, the win comes next turn.
        const auto fours = six::threatWindows(board, me);
        std::vector<Hex> cells;
        for (const auto& f : fours)
          for (int i = 0; i < six::kWinLength; ++i)
            if (board.at(f.cell(i)) == Player::None && std::find(cells.begin(), cells.end(), f.cell(i)) == cells.end())
              cells.push_back(f.cell(i));
        if (cells.size() < 2 || !put(cells[0]) || !put(cells[1])) return {};
        continue;
      }
      std::pair<Hex, Hex> best = pairs.front();
      int longest = -1;
      for (const auto& [a, b] : pairs) {
        if (board.place(a) != six::PlaceError::None) continue;
        if (board.place(b) != six::PlaceError::None) {
          board.undo();
          continue;
        }
        int left = 0;
        if (board.threatCount(six::other(me)) == 0) {
          solver.clear();
          const six::ThreatWin w = solver.solve(board, turns, nodes);
          left = w.found ? w.turns : 100;
        }
        board.undo();
        board.undo();
        if (left > longest) {
          longest = left;
          best = {a, b};
        }
      }
      if (longest >= 100) return {};  // a block the solver can't beat: the line isn't a proof
      if (!put(best.first) || !put(best.second)) return {};
    }
  }
  return board.winner() == me ? line : std::vector<Hex>{};
}

}  // namespace

int main(int argc, char** argv) {
  std::int64_t nodes = 200'000;
  int turns = 8, threads = 4;
  std::vector<std::string> files;
  for (int i = 1; i < argc; ++i) {
    const std::string a = argv[i];
    if (a == "--nodes" && i + 1 < argc) nodes = std::atoll(argv[++i]);
    else if (a == "--turns" && i + 1 < argc) turns = std::atoi(argv[++i]);
    else if (a == "--threads" && i + 1 < argc) threads = std::atoi(argv[++i]);
    else files.push_back(a);
  }
  std::vector<Game> games;
  for (const std::string& f : files) {
    std::ifstream in(f);
    int index = 0;
    for (std::string line; std::getline(in, line); ++index) {
      Game g;
      g.file = f;
      std::replace(g.file.begin(), g.file.end(), '\\', '/');  // written into JSON
      g.index = index;
      if (parse(line, g)) games.push_back(std::move(g));
    }
  }
  std::cerr << games.size() << " games\n";
  std::atomic<std::size_t> next{0};
  std::mutex outMutex;
  auto work = [&]() {
    six::ThreatSolver narrow(32), wide(32);
    wide.setWide(true);
    while (true) {
      const std::size_t i = next++;
      if (i >= games.size()) return;
      const Game& g = games[i];
      Board board(g.radius);
      std::ostringstream lines;
      for (std::size_t k = 0; k < g.moves.size(); ++k) {
        if (board.winner() == Player::None && board.stonesLeft() == 2) {
          const Player me = board.current();
          if (board.threatCount(me) == 0 && board.threatCount(six::other(me)) == 0) {
            narrow.clear();
            wide.clear();
            const six::ThreatWin n = narrow.solve(board, turns, nodes);
            const six::ThreatWin w = wide.solve(board, turns, nodes);
            if (n.found || w.found) {
              lines << "{\"file\":\"" << g.file << "\",\"game\":" << g.index << ",\"at\":" << k << ",\"mover\":\""
                    << six::toChar(me) << "\",\"winner\":\"" << g.winner << "\",\"narrow\":" << (n.found ? n.turns : 0)
                    << ",\"wide\":" << (w.found ? w.turns : 0) << ",\"wideExhausted\":" << (w.exhausted ? "true" : "false");
              if (w.found) {
                lines << ",\"first\":[[" << w.a.q << "," << w.a.r << "],[" << w.b.q << "," << w.b.r << "]]";
                const std::vector<Hex> line = playOut(board, wide, turns, nodes);
                lines << ",\"line\":[";
                for (std::size_t j = 0; j < line.size(); ++j) lines << (j ? "," : "") << "[" << line[j].q << "," << line[j].r << "]";
                lines << "]";
              }
              lines << ",\"played\":[[" << g.moves[k].q << "," << g.moves[k].r << "]";
              if (k + 1 < g.moves.size()) lines << ",[" << g.moves[k + 1].q << "," << g.moves[k + 1].r << "]";
              lines << "]}\n";
            }
          }
        }
        if (board.place(g.moves[k]) != six::PlaceError::None) break;
      }
      const std::string text = lines.str();
      if (!text.empty()) {
        std::lock_guard<std::mutex> lock(outMutex);
        std::cout << text << std::flush;
      }
    }
  };
  std::vector<std::thread> pool;
  for (int t = 0; t < threads; ++t) pool.emplace_back(work);
  for (std::thread& t : pool) t.join();
  return 0;
}
