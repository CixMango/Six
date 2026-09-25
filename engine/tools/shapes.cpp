// Catalogs small shapes of one player's stones with the exact threat solver.
//
// For every shape of up to --stones stones (one per symmetry class: rotations, mirrors and translations), with
// nothing else on the board:
//   toMove     can the owner force a win if it's their turn (two stones)?
//   defenses   if the opponent moves first, which two-stone replies near the shape stop that (up to --defend stones)?
// A shape with a forced win whatever the opponent replies is unstoppable.
//
// Usage: sixshapes [--stones 4] [--defend 4] [--region 3] [--turns 12] [--nodes 2000000] [--threads 8] > shapes.jsonl
#include <algorithm>
#include <atomic>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <mutex>
#include <set>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "threats.hpp"

namespace {

using six::Board;
using six::Hex;
using six::Player;
using Shape = std::vector<Hex>;

Hex rotate(Hex h) { return {-h.r, h.q + h.r}; }
Hex mirror(Hex h) { return {h.r, h.q}; }

Shape normalized(Shape s) {
  std::sort(s.begin(), s.end(), [](Hex a, Hex b) { return a.q != b.q ? a.q < b.q : a.r < b.r; });
  const Hex o = s.front();
  for (Hex& h : s) h = {h.q - o.q, h.r - o.r};
  return s;
}

bool less(const Shape& a, const Shape& b) {
  for (std::size_t i = 0; i < a.size(); ++i) {
    if (a[i].q != b[i].q) return a[i].q < b[i].q;
    if (a[i].r != b[i].r) return a[i].r < b[i].r;
  }
  return false;
}

// The smallest of the 12 symmetric images, translated so its first cell is the origin.
Shape canonical(const Shape& s) {
  Shape best;
  Shape cur = s;
  for (int m = 0; m < 2; ++m) {
    for (int r = 0; r < 6; ++r) {
      const Shape n = normalized(cur);
      if (best.empty() || less(n, best)) best = n;
      for (Hex& h : cur) h = rotate(h);
    }
    for (Hex& h : cur) h = mirror(h);
  }
  return best;
}

bool onAxis(Hex a, Hex b) {
  const int dq = b.q - a.q, dr = b.r - a.r;
  return dq == 0 || dr == 0 || dq == -dr;
}

// Stones interact when they're close, or on one line close enough to share a six-cell window with room to spare.
bool related(Hex a, Hex b) {
  const int d = six::hexDistance(a, b);
  return d <= 2 || (onAxis(a, b) && d <= 4);
}

std::vector<Shape> enumerate(int maxStones) {
  std::vector<Shape> all;
  std::set<std::vector<int>> seen;
  auto key = [](const Shape& s) {
    std::vector<int> k;
    for (Hex h : s) {
      k.push_back(h.q);
      k.push_back(h.r);
    }
    return k;
  };
  std::vector<Shape> level{Shape{{0, 0}}};
  all.push_back(level.front());
  for (int n = 1; n < maxStones; ++n) {
    std::vector<Shape> next;
    for (const Shape& s : level) {
      std::set<std::pair<int, int>> tried;
      for (Hex a : s) {
        for (int dq = -4; dq <= 4; ++dq) {
          for (int dr = -4; dr <= 4; ++dr) {
            const Hex c{a.q + dq, a.r + dr};
            if (std::find(s.begin(), s.end(), c) != s.end() || !related(a, c) || !tried.insert({c.q, c.r}).second) continue;
            Shape grown = s;
            grown.push_back(c);
            Shape canon = canonical(grown);
            if (seen.insert(key(canon)).second) next.push_back(canon);
          }
        }
      }
    }
    all.insert(all.end(), next.begin(), next.end());
    level = std::move(next);
  }
  return all;
}

// Filler stones for the turn order: a compact grid 7 apart (so no two share a window) about 25 cells from the shape
// (so none shares a window with anything played near it). A long spread would push the shape to the board's edge.
Hex filler(int k) { return {25 + 7 * (k % 4), -25 + 7 * (k / 4)}; }

// The shape centred near the origin, with the owner (X) or the opponent (O) to move with two stones.
void setUp(Board& board, const Shape& shape, Player toMove) {
  const int n = static_cast<int>(shape.size());
  // A turn starts with X to move after 3 + 4k stones and O after 1 + 4k; X then has 1 + 2k of them.
  int total = toMove == Player::X ? 3 : 1;
  while (1 + 2 * ((total - 1) / 4) < n) total += 4;
  // Shape stones go in normally, nearest first, so the board records which cells are in reach; fillers go in with
  // search mode on (anywhere, but in reach of nothing).
  Shape order{shape.front()};
  while (order.size() < shape.size()) {
    for (Hex c : shape) {
      if (std::find(order.begin(), order.end(), c) != order.end()) continue;
      bool close = false;
      for (Hex o : order) close = close || six::hexDistance(o, c) <= board.radius();
      if (close) {
        order.push_back(c);
        break;
      }
    }
  }
  int nextShape = 0;
  int nextFiller = 0;
  for (int i = 0; i < total; ++i) {
    const bool shapeStone = six::playerForStone(i) == Player::X && nextShape < n;
    const Hex h = shapeStone ? order[static_cast<std::size_t>(nextShape++)] : filler(nextFiller++);
    board.setSearchMode(!shapeStone);
    if (board.place(h) != six::PlaceError::None) {
      std::cerr << "could not set up the shape\n";
      std::exit(1);
    }
  }
  board.setSearchMode(false);
}

struct Result {
  bool win = false;
  bool unknown = false;
  int turns = 0;
  Hex a, b;
};

Result solveX(Board& board, six::ThreatSolver& solver, int turns, std::int64_t nodes) {
  Result r;
  if (board.threatCount(Player::X) > 0) {  // a window X finishes this turn
    r.win = true;
    return r;
  }
  if (board.threatCount(Player::O) > 0) return r;
  const six::ThreatWin w = solver.solve(board, turns, nodes);
  r.win = w.found;
  r.unknown = !w.found && w.exhausted;
  r.turns = w.turns;
  r.a = w.a;
  r.b = w.b;
  return r;
}

std::string hexList(const std::vector<Hex>& cells) {
  std::ostringstream out;
  out << "[";
  for (std::size_t i = 0; i < cells.size(); ++i) out << (i ? "," : "") << "[" << cells[i].q << "," << cells[i].r << "]";
  out << "]";
  return out.str();
}

}  // namespace

int main(int argc, char** argv) {
  int maxStones = 4, defend = 4, region = 3, turns = 12;
  std::int64_t nodes = 2'000'000;
  int threads = std::max(1u, std::thread::hardware_concurrency() / 2);
  for (int i = 1; i + 1 < argc; i += 2) {
    const std::string k = argv[i];
    const long long v = std::atoll(argv[i + 1]);
    if (k == "--stones") maxStones = static_cast<int>(v);
    else if (k == "--defend") defend = static_cast<int>(v);
    else if (k == "--region") region = static_cast<int>(v);
    else if (k == "--turns") turns = static_cast<int>(v);
    else if (k == "--nodes") nodes = v;
    else if (k == "--threads") threads = static_cast<int>(v);
    else if (k == "--only") continue;
  }
  if (argc > 1 && std::string(argv[1]) == "--probe") {
    six::ThreatSolver solver(64);
    Board real(8);
    for (Hex h : std::vector<Hex>{{0, 0}, {-8, 4}, {-8, 6}, {0, 1}, {1, 0}, {-6, 8}, {-4, 8}}) real.place(h);
    const six::ThreatWin a = solver.solve(real, 12, 2'000'000);
    std::cerr << "real game: found " << a.found << " turns " << a.turns << " nodes " << a.nodes << " exhausted " << a.exhausted << "\n";
    Board made(8);
    Shape probe{{0, 0}, {0, 1}, {1, 0}};
    if (argc > 2) {
      probe.clear();
      for (int i = 2; i + 1 < argc; i += 2) probe.push_back({std::atoi(argv[i]), std::atoi(argv[i + 1])});
    }
    setUp(made, probe, Player::X);
    for (Hex h : made.moves()) std::cerr << "(" << h.q << "," << h.r << ")" << six::toChar(made.at(h)) << " ";
    std::cerr << "\n";
    solver.clear();
    const six::ThreatWin b = solver.solve(made, 12, 2'000'000);
    std::cerr << "filler setup: found " << b.found << " turns " << b.turns << " nodes " << b.nodes << " exhausted " << b.exhausted
              << " stones " << made.stones() << " current " << six::toChar(made.current()) << " left " << made.stonesLeft() << "\n";
    return 0;
  }
  // --only FILE: check just the shapes listed in FILE (one per line: q r q r ...) instead of enumerating.
  std::vector<Shape> shapes;
  for (int i = 1; i + 1 < argc; ++i) {
    if (std::string(argv[i]) != "--only") continue;
    std::ifstream in(argv[i + 1]);
    for (std::string row; std::getline(in, row);) {
      std::istringstream cells(row);
      Shape s;
      for (int q, r; cells >> q >> r;) s.push_back({q, r});
      if (!s.empty()) shapes.push_back(s);
    }
  }
  if (shapes.empty()) shapes = enumerate(maxStones);
  std::cerr << shapes.size() << " shapes up to " << maxStones << " stones\n";

  std::atomic<std::size_t> next{0};
  std::mutex outMutex;
  auto work = [&]() {
    six::ThreatSolver solver(64);
    while (true) {
      const std::size_t i = next++;
      if (i >= shapes.size()) return;
      // Centre the shape near the origin so every reply cell is inside the placement radius.
      Shape shape = shapes[i];
      std::ostringstream line;
      line << "{\"stones\":" << shape.size() << ",\"shape\":" << hexList(shape);

      Board attack(8);
      setUp(attack, shape, Player::X);
      solver.clear();
      const Result toMove = solveX(attack, solver, turns, nodes);
      line << ",\"toMove\":{\"win\":" << (toMove.win ? "true" : "false") << ",\"unknown\":" << (toMove.unknown ? "true" : "false")
           << ",\"turns\":" << toMove.turns;
      if (toMove.win && toMove.turns > 0) line << ",\"first\":" << hexList({toMove.a, toMove.b});
      line << "}";

      if (toMove.win && static_cast<int>(shape.size()) <= defend) {
        Board defense(8);
        setUp(defense, shape, Player::O);
        std::vector<Hex> cells;
        for (Hex s : shape) {
          for (int dq = -region; dq <= region; ++dq) {
            for (int dr = -region; dr <= region; ++dr) {
              const Hex c{s.q + dq, s.r + dr};
              if (six::hexDistance(s, c) > region || defense.at(c) != Player::None) continue;
              if (std::find(cells.begin(), cells.end(), c) == cells.end()) cells.push_back(c);
            }
          }
        }
        std::vector<std::vector<Hex>> holding;
        int unknown = 0, tried = 0;
        for (std::size_t x = 0; x < cells.size(); ++x) {
          for (std::size_t y = x + 1; y < cells.size(); ++y) {
            if (defense.place(cells[x]) != six::PlaceError::None) continue;
            if (defense.place(cells[y]) == six::PlaceError::None) {
              ++tried;
              solver.clear();
              const Result after = solveX(defense, solver, turns, nodes);
              if (after.unknown) ++unknown;
              else if (!after.win) holding.push_back({cells[x], cells[y]});
              defense.undo();
            }
            defense.undo();
          }
        }
        line << ",\"defenses\":{\"tried\":" << tried << ",\"unknown\":" << unknown << ",\"holding\":[";
        for (std::size_t h = 0; h < holding.size(); ++h) line << (h ? "," : "") << hexList(holding[h]);
        line << "]}";
      }
      line << "}";
      std::lock_guard<std::mutex> lock(outMutex);
      std::cout << line.str() << "\n" << std::flush;
    }
  };
  std::vector<std::thread> pool;
  for (int t = 0; t < threads; ++t) pool.emplace_back(work);
  for (std::thread& t : pool) t.join();
  return 0;
}
