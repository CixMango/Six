// Catalogs small shapes of one player's stones with the exact threat solver.
//
// For every shape of up to --stones stones (one per symmetry class: rotations, mirrors and translations), with
// nothing else on the board:
//   toMove     can the owner force a win if it's their turn (two stones)?
//   defenses   if the opponent moves first, which two-stone replies near the shape stop that (up to --defend stones)?
// A shape with a forced win whatever the opponent replies is unstoppable.
//
// Usage: sixshapes [--stones 4] [--defend 4] [--region 3] [--turns 12] [--nodes 2000000] [--threads 8]
//                  [--first-hold 1] [--only shapes.txt] [--wide 1] > shapes.jsonl
// --wide 1 (the default) searches every double-threat turn, free stones included; 0 is the engine's shorter list.
#include <algorithm>
#include <atomic>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <mutex>
#include <optional>
#include <set>
#include <sstream>
#include <string>
#include <thread>
#include <tuple>
#include <vector>

#include "board.hpp"
#include "tactics.hpp"
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
// `theirs` are opponent stones placed near the shape (in reach, like the shape) before any fillers.
void setUp(Board& board, const Shape& shape, Player toMove, const Shape& theirs = {}) {
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
  auto theirTurns = [](int stones) {
    int o = 0;
    for (int i = 0; i < stones; ++i) o += six::playerForStone(i) == Player::O;
    return o;
  };
  while (theirTurns(total) < static_cast<int>(theirs.size())) total += 4;
  // Plan the order first: an opponent stone goes in on the first opponent turn where it's in reach of the stones
  // already down (fillers don't count); a later start gives the far ones more turns.
  std::vector<Hex> plan;
  std::vector<char> real;
  for (;; total += 4) {
    plan.clear();
    real.clear();
    std::vector<Hex> down;
    std::vector<bool> used(theirs.size(), false);
    std::size_t placed = 0, nextShape = 0;
    int nextFiller = 0;
    for (int i = 0; i < total; ++i) {
      std::optional<Hex> h;
      if (six::playerForStone(i) == Player::X) {
        if (nextShape < order.size()) h = order[nextShape++];
      } else {
        for (std::size_t t = 0; t < theirs.size() && !h; ++t) {
          if (used[t]) continue;
          for (Hex d : down) {
            if (six::hexDistance(d, theirs[t]) <= board.radius()) {
              h = theirs[t];
              used[t] = true;
              ++placed;
              break;
            }
          }
        }
      }
      plan.push_back(h ? *h : filler(nextFiller++));
      real.push_back(h ? 1 : 0);
      if (h) down.push_back(*h);
    }
    if (placed == theirs.size() && nextShape == order.size()) break;
    if (total > 400) {
      std::cerr << "not enough opponent turns for the extra stones\n";
      std::exit(1);
    }
  }
  for (std::size_t i = 0; i < plan.size(); ++i) {
    board.setSearchMode(!real[i]);
    if (board.place(plan[i]) != six::PlaceError::None) {
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

bool hexLess(Hex a, Hex b) { return a.q != b.q ? a.q < b.q : a.r < b.r; }

bool inZone(const std::vector<Hex>& zone, Hex c) { return std::binary_search(zone.begin(), zone.end(), c, hexLess); }

std::string proofJson(const six::ThreatSolver::Proof& p) {
  std::ostringstream out;
  out << "{\"a\":[" << p.a.q << "," << p.a.r << "],\"b\":[" << p.b.q << "," << p.b.r << "],\"last\":" << (p.last ? "true" : "false")
      << ",\"blocks\":[";
  for (std::size_t i = 0; i < p.blocks.size(); ++i) {
    const auto& [pair, child] = p.blocks[i];
    out << (i ? "," : "") << "{\"x\":[" << pair.first.q << "," << pair.first.r << "],\"y\":[" << pair.second.q << ","
        << pair.second.r << "],\"then\":" << proofJson(child) << "}";
  }
  out << "]}";
  return out.str();
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
  std::string dumpSkips;
  int maxStones = 4, defend = 4, region = 3, turns = 12, firstHold = 0, alwaysDefend = 0, useZones = 1, freshTable = 0, wide = 1;
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
    else if (k == "--first-hold") firstHold = static_cast<int>(v);
    else if (k == "--always-defend") alwaysDefend = static_cast<int>(v);
    else if (k == "--zones") useZones = static_cast<int>(v);
    else if (k == "--fresh-table") freshTable = static_cast<int>(v);
    else if (k == "--wide") wide = static_cast<int>(v);
    else if (k == "--only") continue;
    else if (k == "--dump-skips") dumpSkips = argv[i + 1];
  }
  // --line q r q r ...: play out the owner's forced win for one shape. The defender blocks with the covering pair
  // that makes the rest of the win longest, so the line shows the toughest defence.
  // --refute a b c d q r q r ...: the same, after the opponent first replies at (a,b) and (c,d).
  if (argc > 1 && (std::string(argv[1]) == "--line" || std::string(argv[1]) == "--refute")) {
    const bool refute = std::string(argv[1]) == "--refute";
    std::vector<Hex> cells;
    for (int i = 2; i + 1 < argc; i += 2) cells.push_back({std::atoi(argv[i]), std::atoi(argv[i + 1])});
    const std::vector<Hex> reply = refute ? std::vector<Hex>(cells.begin(), cells.begin() + 2) : std::vector<Hex>{};
    const Shape shape(cells.begin() + (refute ? 2 : 0), cells.end());
    six::ThreatSolver solver(64);
    solver.setWide(wide != 0);
    Board board(8);
    setUp(board, shape, refute ? Player::O : Player::X);
    std::ostringstream out;
    out << "{\"shape\":" << hexList(shape) << ",\"turns\":[";
    bool firstTurn = true;
    auto record = [&](char who, const std::vector<Hex>& stones) {
      out << (firstTurn ? "" : ",") << "{\"player\":\"" << who << "\",\"stones\":" << hexList(stones) << "}";
      firstTurn = false;
    };
    for (Hex h : reply) board.place(h);
    if (refute) record('O', reply);
    auto longest = [&](Board& b) {
      solver.clear();
      const six::ThreatWin w = solver.solve(b, turns, nodes);
      return w.found ? w.turns : 100;
    };
    std::vector<Hex> six;
    for (int step = 0; step < 30 && six.empty(); ++step) {
      if (board.current() == Player::X) {
        const auto finish = six::threatWindows(board, Player::X);
        if (!finish.empty()) {
          std::vector<Hex> cells;
          for (int i = 0; i < 6; ++i) {
            const Hex c = finish.front().cell(i);
            six.push_back(c);
            if (board.at(c) == Player::None) cells.push_back(c);
          }
          record('X', cells);
          break;
        }
        solver.clear();
        const six::ThreatWin w = solver.solve(board, turns, nodes);
        if (!w.found) {
          std::cerr << "no forced win from here\n";
          return 1;
        }
        board.place(w.a);
        board.place(w.b);
        record('X', {w.a, w.b});
      } else {
        std::vector<std::pair<Hex, Hex>> pairs;
        six::coveringPairs(board, Player::X, pairs);
        std::vector<Hex> reply;
        int best = -1;
        for (const auto& [a, b] : pairs) {
          board.place(a);
          board.place(b);
          const int score = board.threatCount(Player::O) == 0 ? longest(board) : -1;
          board.undo();
          board.undo();
          if (score > best) {
            best = score;
            reply = {a, b};
          }
        }
        if (reply.empty()) {  // more fours than two stones can block: block as many as it can
          const auto fours = six::threatWindows(board, Player::X);
          std::vector<Hex> cells;
          for (const auto& w : fours) {
            for (int i = 0; i < 6; ++i) {
              const Hex c = w.cell(i);
              if (board.at(c) == Player::None && std::find(cells.begin(), cells.end(), c) == cells.end()) cells.push_back(c);
            }
          }
          int bestBlocked = -1;
          for (std::size_t i = 0; i < cells.size(); ++i) {
            for (std::size_t j = i + 1; j < cells.size(); ++j) {
              int blocked = 0;
              for (const auto& w : fours) {
                bool hit = false;
                for (int k = 0; k < 6; ++k) hit = hit || w.cell(k) == cells[i] || w.cell(k) == cells[j];
                blocked += hit;
              }
              if (blocked > bestBlocked) {
                bestBlocked = blocked;
                reply = {cells[i], cells[j]};
              }
            }
          }
        }
        for (Hex h : reply) board.place(h);
        record('O', reply);
      }
    }
    out << "],\"six\":" << hexList(six) << "}";
    std::cout << out.str() << "\n";
    return 0;
  }
  if (argc > 1 && std::string(argv[1]) == "--probe") {
    six::ThreatSolver solver(64);
    solver.setWide(wide != 0);
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
  // A row may end with "| q r q r ...": opponent stones already next to the shape. A second "| q r q r q r q r ..."
  // lists the only replies to check, two cells each (a recheck of the replies an earlier run found holding).
  std::vector<Shape> shapes, extras, given;
  for (int i = 1; i + 1 < argc; ++i) {
    if (std::string(argv[i]) != "--only") continue;
    std::ifstream in(argv[i + 1]);
    for (std::string row; std::getline(in, row);) {
      const std::size_t bar = row.find('|');
      const std::size_t bar2 = bar == std::string::npos ? std::string::npos : row.find('|', bar + 1);
      std::istringstream cells(row.substr(0, bar)),
          other(bar == std::string::npos ? "" : row.substr(bar + 1, bar2 == std::string::npos ? std::string::npos : bar2 - bar - 1)),
          replies(bar2 == std::string::npos ? "" : row.substr(bar2 + 1));
      Shape s, o, g;
      for (int q, r; cells >> q >> r;) s.push_back({q, r});
      for (int q, r; other >> q >> r;) o.push_back({q, r});
      for (int q, r; replies >> q >> r;) g.push_back({q, r});
      if (!s.empty()) {
        shapes.push_back(s);
        extras.push_back(o);
        given.push_back(g);
      }
    }
  }
  if (shapes.empty()) shapes = enumerate(maxStones);
  std::cerr << shapes.size() << " shapes up to " << maxStones << " stones\n";

  std::atomic<std::size_t> next{0};
  std::mutex outMutex;
  auto work = [&]() {
    six::ThreatSolver solver(64);
    solver.setWide(wide != 0);
    while (true) {
      const std::size_t i = next++;
      if (i >= shapes.size()) return;
      // Centre the shape near the origin so every reply cell is inside the placement radius.
      Shape shape = shapes[i];
      const Shape theirs = i < extras.size() ? extras[i] : Shape{};
      std::ostringstream line;
      line << "{\"stones\":" << shape.size() << ",\"shape\":" << hexList(shape);
      if (!theirs.empty()) line << ",\"theirs\":" << hexList(theirs);

      Board attack(8);
      setUp(attack, shape, Player::X, theirs);
      solver.clear();
      const Result toMove = solveX(attack, solver, turns, nodes);
      line << ",\"toMove\":{\"win\":" << (toMove.win ? "true" : "false") << ",\"unknown\":" << (toMove.unknown ? "true" : "false")
           << ",\"turns\":" << toMove.turns;
      if (toMove.win && toMove.turns > 0) line << ",\"first\":" << hexList({toMove.a, toMove.b});
      line << "}";

      // --always-defend 1: list the holding replies even when the owner has no win to move, and look for replies
      // around the opponent's stones too (for positions that are part of a longer proof).
      if ((toMove.win || alwaysDefend) && static_cast<int>(shape.size()) <= defend) {
        Board defense(8);
        setUp(defense, shape, Player::O, theirs);
        std::vector<Hex> cells;
        Shape centres = shape;
        if (alwaysDefend) centres.insert(centres.end(), theirs.begin(), theirs.end());
        for (Hex s : centres) {
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
        std::vector<std::pair<std::size_t, std::size_t>> pairs;
        for (std::size_t x = 0; x < cells.size(); ++x)
          for (std::size_t y = x + 1; y < cells.size(); ++y) pairs.push_back({x, y});
        if (i < given.size() && given[i].size() >= 2) {
          cells.clear();
          pairs.clear();
          auto index = [&](Hex h) {
            const auto it = std::find(cells.begin(), cells.end(), h);
            if (it != cells.end()) return static_cast<std::size_t>(it - cells.begin());
            cells.push_back(h);
            return cells.size() - 1;
          };
          for (std::size_t g = 0; g + 1 < given[i].size(); g += 2) {
            const std::size_t x = index(given[i][g]);
            pairs.push_back({x, index(given[i][g + 1])});
          }
        }
        // One position's replies are split over the threads in --always-defend mode (the proof driver sends one at
        // a time); otherwise each thread takes whole shapes.
        std::atomic<std::size_t> nextPair{0};
        std::mutex found;
        // Proven wins after earlier replies. A reply with both stones outside one proof's cells is checked by replaying
        // that proof in the new position; if it still wins, the reply needs no search of its own.
        struct Known {
          std::vector<Hex> cells;
          six::ThreatSolver::Proof proof;
        };
        std::vector<std::shared_ptr<const Known>> zones;
        std::atomic<int> skipped{0};
        auto replies = [&](Board& board, six::ThreatSolver& own) {
          std::vector<std::shared_ptr<const Known>> known;
          while (!(firstHold && !holding.empty())) {
            const std::size_t k = nextPair++;
            if (k >= pairs.size()) return;
            const Hex a = cells[pairs[k].first], b = cells[pairs[k].second];
            if (board.place(a) != six::PlaceError::None) continue;
            if (board.place(b) == six::PlaceError::None) {
              if (useZones && alwaysDefend) {
                std::lock_guard<std::mutex> lock(found);
                if (known.size() != zones.size()) known = zones;
              }
              const Known* covered = nullptr;
              for (const auto& z : known) {
                if (!inZone(z->cells, a) && !inZone(z->cells, b) && six::ThreatSolver::replay(board, z->proof)) {
                  covered = z.get();
                  break;
                }
              }
              if (covered && !dumpSkips.empty()) {
                std::lock_guard<std::mutex> lock(found);
                std::ofstream(dumpSkips, std::ios::app) << "{\"shape\":" << hexList(shape) << ",\"theirs\":" << hexList(theirs)
                                                       << ",\"reply\":" << hexList({a, b}) << ",\"proof\":" << proofJson(covered->proof)
                                                       << "}\n";
              }
              if (covered) {
                ++skipped;
                std::lock_guard<std::mutex> lock(found);
                ++tried;
              } else {
                if (freshTable) own.clear();
                const Result after = solveX(board, own, turns, nodes);
                std::shared_ptr<Known> zone;
                if (useZones && alwaysDefend && after.win && after.turns > 0 && known.size() < 16) {
                  auto k = std::make_shared<Known>();
                  if (own.proofTree(board, turns, nodes, k->proof, k->cells)) zone = k;
                }
                std::lock_guard<std::mutex> lock(found);
                ++tried;
                // Undecided replies count as holding for a proof: they get checked further, never assumed lost.
                if (after.unknown) ++unknown;
                if ((after.unknown && alwaysDefend) || (!after.unknown && !after.win)) holding.push_back({a, b});
                if (zone && zones.size() < 16) zones.push_back(zone);
              }
              board.undo();
            }
            board.undo();
          }
        };
        if (alwaysDefend && threads > 1) {
          std::vector<std::thread> inner;
          for (int t = 0; t < threads; ++t) {
            inner.emplace_back([&]() {
              Board board(8);
              setUp(board, shape, Player::O, theirs);
              six::ThreatSolver own(64);
              own.setWide(wide != 0);
              replies(board, own);
            });
          }
          for (std::thread& t : inner) t.join();
        } else {
          replies(defense, solver);
        }
        std::sort(holding.begin(), holding.end(), [](const std::vector<Hex>& l, const std::vector<Hex>& r) {
          return std::tie(l[0].q, l[0].r, l[1].q, l[1].r) < std::tie(r[0].q, r[0].r, r[1].q, r[1].r);
        });
        line << ",\"defenses\":{\"tried\":" << tried << ",\"unknown\":" << unknown << ",\"skipped\":" << skipped.load()
             << ",\"holding\":[";
        for (std::size_t h = 0; h < holding.size(); ++h) line << (h ? "," : "") << hexList(holding[h]);
        line << "]}";
      }
      line << "}";
      std::lock_guard<std::mutex> lock(outMutex);
      std::cout << line.str() << "\n" << std::flush;
    }
  };
  std::vector<std::thread> pool;
  for (int t = 0; t < (alwaysDefend ? 1 : threads); ++t) pool.emplace_back(work);
  for (std::thread& t : pool) t.join();
  return 0;
}
