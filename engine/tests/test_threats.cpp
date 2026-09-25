#include <algorithm>
#include <map>
#include <random>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "board.hpp"
#include "print.hpp"
#include "tactics.hpp"
#include "testing.hpp"
#include "threats.hpp"

using six::Board;
using six::Hex;
using six::PlaceError;
using six::Player;

namespace {

using PairKey = std::pair<std::pair<int, int>, std::pair<int, int>>;

PairKey keyOf(Hex a, Hex b) {
  std::pair<int, int> x{a.q, a.r};
  std::pair<int, int> y{b.q, b.r};
  if (y < x) std::swap(x, y);
  return {x, y};
}

std::string describe(Hex h) {
  std::ostringstream os;
  os << h;
  return os.str();
}

bool quiet(const Board& b) { return b.threatCount(Player::X) == 0 && b.threatCount(Player::O) == 0; }

/** A random position full of twos and threes but no threat windows, at the start of a two-stone turn. */
Board randomQuietPosition(std::mt19937& rng, int stones) {
  Board b(9);
  b.place({0, 0});
  for (int attempt = 0; attempt < 20000 && (b.stones() < stones || b.stonesLeft() != 2); ++attempt) {
    const Player p = b.current();
    std::vector<Hex> own;
    for (int i = 0; i < b.stones(); ++i) {
      if (six::playerForStone(i) == p) own.push_back(b.moves()[static_cast<std::size_t>(i)]);
    }
    const std::vector<Hex>& from = own.empty() ? b.moves() : own;
    const Hex base = from[rng() % from.size()];
    Hex c;
    if (rng() % 4 != 0) {
      // Extend a line: most stones go one to three steps along an axis from one of the player's own.
      const Hex d = six::kAxes[rng() % 3];
      const int step = static_cast<int>(rng() % 3 + 1) * (rng() % 2 == 0 ? 1 : -1);
      c = {base.q + d.q * step, base.r + d.r * step};
    } else {
      c = {base.q + static_cast<int>(rng() % 5) - 2, base.r + static_cast<int>(rng() % 5) - 2};
    }
    if (b.canPlace(c) != PlaceError::None) continue;
    b.place(c);
    if (!quiet(b)) b.undo();
  }
  return b;
}

std::vector<Hex> nearEmpties(const Board& b, int distance) {
  std::vector<Hex> cells;
  b.forEachNearEmpty(distance, [&](Hex c) { cells.push_back(c); });
  std::sort(cells.begin(), cells.end(), [](Hex x, Hex y) { return std::make_pair(x.q, x.r) < std::make_pair(y.q, y.r); });
  return cells;
}

bool windowHolds(const six::Window& w, Hex c) {
  for (int i = 0; i < six::kWinLength; ++i) {
    if (w.cell(i) == c) return true;
  }
  return false;
}

/** Pairs of cells after which `attacker` has no threat window left, found by trying every pair. */
std::vector<PairKey> bruteCoveringPairs(Board& b, Player attacker) {
  std::vector<PairKey> pairs;
  const auto cells = nearEmpties(b, 5);
  const int before = b.threatCount(attacker);
  for (std::size_t i = 0; i < cells.size(); ++i) {
    // Both stones of a two-stone block must touch a threat window.
    b.place(cells[i]);
    const bool touched = b.threatCount(attacker) < before;
    if (touched) {
      for (std::size_t j = i + 1; j < cells.size(); ++j) {
        b.place(cells[j]);
        if (b.threatCount(attacker) == 0) pairs.push_back(keyOf(cells[i], cells[j]));
        b.undo();
      }
    }
    b.undo();
  }
  std::sort(pairs.begin(), pairs.end());
  return pairs;
}

/**
 * True if the side to move provably wins within `turns` turns. Attacking turns come from a fresh
 * solver; every block is found by brute force, and a block that isn't complete loses on the spot.
 */
bool verifyWin(Board& b, int turns, std::string& why) {
  const Player me = b.current();
  const Player opp = six::other(me);
  if (b.threatCount(me) > 0) return true;  // two stones finish a window holding four
  if (b.threatCount(opp) > 0 || turns == 0) {
    why = "defender escaped with " + std::to_string(turns) + " turns left";
    return false;
  }
  six::ThreatSolver solver(1);
  const auto win = solver.solve(b, turns, 2'000'000);
  if (!win.found) {
    why = "solver found no win in a position it had proven";
    return false;
  }
  if (b.place(win.a) != PlaceError::None || b.place(win.b) != PlaceError::None) {
    why = "solver played an illegal stone";
    return false;
  }
  bool ok = true;
  const int cover = six::minCover(b, six::threatWindows(b, me), 2);
  if (cover < 2) {
    why = "attacking turn can be blocked with one stone";
    ok = false;
  }
  if (ok && cover == 2) {
    for (const auto& [x, y] : bruteCoveringPairs(b, me)) {
      b.place({x.first, x.second});
      b.place({y.first, y.second});
      ok = verifyWin(b, turns - 1, why);
      b.undo();
      b.undo();
      if (!ok) break;
    }
  }
  b.undo();
  b.undo();
  return ok;
}

}  // namespace

TEST_CASE("threats: double-threat turns match brute force on random positions") {
  std::mt19937 rng(914);
  int positions = 0;
  int found = 0;
  for (int round = 0; round < 40; ++round) {
    Board b = randomQuietPosition(rng, 12 + round % 14);
    if (b.stonesLeft() != 2 || !quiet(b)) continue;
    ++positions;
    const Player me = b.current();
    std::vector<six::ThreatTurn> turns;
    six::doubleThreats(b, turns);
    std::map<PairKey, int> generated;
    for (const auto& t : turns) {
      if (!generated.emplace(keyOf(t.a, t.b), t.cover).second) six::testing::fail(__FILE__, __LINE__, "turn generated twice");
    }
    found += static_cast<int>(turns.size());

    const auto cells = nearEmpties(b, 5);
    std::size_t matched = 0;
    for (std::size_t i = 0; i < cells.size(); ++i) {
      b.place(cells[i]);
      for (std::size_t j = i + 1; j < cells.size(); ++j) {
        b.place(cells[j]);
        const auto threats = six::threatWindows(b, me);
        const int cover = threats.empty() ? 0 : six::minCover(b, threats, 2);
        const bool bothInFours =
            std::any_of(threats.begin(), threats.end(), [&](const auto& w) { return windowHolds(w, cells[i]); }) &&
            std::any_of(threats.begin(), threats.end(), [&](const auto& w) { return windowHolds(w, cells[j]); });
        b.undo();
        const auto it = generated.find(keyOf(cells[i], cells[j]));
        if (it != generated.end()) {
          ++matched;
          if (it->second != cover) {
            six::testing::fail(__FILE__, __LINE__,
                               "cover " + std::to_string(it->second) + " generated, brute force says " + std::to_string(cover) +
                                   " for " + describe(cells[i]) + " " + describe(cells[j]));
          }
        } else if (cover >= 2 && bothInFours) {
          six::testing::fail(__FILE__, __LINE__,
                             "missed a double threat (cover " + std::to_string(cover) + ") at " +
                                 describe(cells[i]) + " " + describe(cells[j]));
        }
      }
      b.undo();
    }
    CHECK_EQ(matched, generated.size());
  }
  CHECK(positions >= 30);
  CHECK(found > 50);
}

TEST_CASE("threats: covering pairs match brute force") {
  std::mt19937 rng(1406);
  int checked = 0;
  for (int round = 0; round < 40; ++round) {
    Board b = randomQuietPosition(rng, 14 + round % 12);
    if (b.stonesLeft() != 2 || !quiet(b)) continue;
    const Player me = b.current();
    std::vector<six::ThreatTurn> turns;
    six::doubleThreats(b, turns);
    for (std::size_t t = 0; t < turns.size() && t < 3; ++t) {
      if (turns[t].cover != 2) continue;
      b.place(turns[t].a);
      b.place(turns[t].b);
      std::vector<std::pair<Hex, Hex>> pairs;
      six::coveringPairs(b, me, pairs);
      std::vector<PairKey> keys;
      for (const auto& [x, y] : pairs) keys.push_back(keyOf(x, y));
      std::sort(keys.begin(), keys.end());
      CHECK(keys == bruteCoveringPairs(b, me));
      CHECK(!keys.empty());
      ++checked;
      b.undo();
      b.undo();
    }
  }
  CHECK(checked > 20);
}

TEST_CASE("threats: every win the solver claims holds against every block") {
  std::mt19937 rng(2718);
  int wins = 0;
  int longWins = 0;
  for (int round = 0; round < 120; ++round) {
    Board b = randomQuietPosition(rng, 16 + round % 16);
    if (b.stonesLeft() != 2 || !quiet(b)) continue;
    const auto before = b.hash();
    six::ThreatSolver solver(4);
    const auto win = solver.solve(b, 4, 200'000);
    CHECK_EQ(b.hash(), before);
    if (!win.found) continue;
    ++wins;
    if (win.turns >= 2) ++longWins;
    std::string why;
    if (!verifyWin(b, win.turns, why)) {
      six::testing::fail(__FILE__, __LINE__, "claimed win in " + std::to_string(win.turns) + " failed: " + why);
    }
    CHECK_EQ(b.hash(), before);
  }
  CHECK(wins >= 10);
  CHECK(longWins >= 3);
}

TEST_CASE("threats: long wins found in real positions hold against every block") {
  const std::vector<std::vector<int>> games = {
      {0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 2, -1, 2, -2},
      {0, 0, -1, -1, 1, -2, 0, -1, 0, -2, 0, 2, 0, -4, 1, 1, -1, 1, -1, -3, -1, -4, 0, 1, -2, 1, 2, 1, -3, 1,
       -2, 2, -3, 3, -4, 4, 2, -2, -1, 0, -4, 3, -5, 4, -2, 3, 1, 0, 2, -1, -2, 0, 3, -2, -1, 4, -5, 3},
  };
  for (const auto& moves : games) {
    Board b(8);
    for (std::size_t i = 0; i + 1 < moves.size(); i += 2) b.place({moves[i], moves[i + 1]});
    six::ThreatSolver solver(16);
    const auto win = solver.solve(b, 8, 200'000);
    if (!win.found) continue;
    std::string why;
    std::cerr << "  (verifying a " << win.turns << "-turn win found in " << win.nodes << " nodes)\n";
    if (!verifyWin(b, win.turns, why)) six::testing::fail(__FILE__, __LINE__, "claimed win failed: " + why);
  }
}

TEST_CASE("threats: two open threes are a one-turn win") {
  Board b(9);
  for (auto [q, r] : std::vector<std::pair<int, int>>{{0, 0}, {0, -7}, {3, -7}, {1, 0}, {2, 0}, {6, -7}, {9, -7}, {0, 4},
                                                       {1, 4}, {12, -7}, {15, -7}, {2, 4}, {-8, 8}, {18, -7}, {21, -7}}) {
    b.place({q, r});
  }
  six::ThreatSolver solver(1);
  const auto win = solver.solve(b, 3, 10'000);
  CHECK(win.found);
  CHECK_EQ(win.turns, 1);
}
