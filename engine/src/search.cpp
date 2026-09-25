#include "search.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstring>
#include <limits>
#include <memory>
#include <stdexcept>

#include "nnue.hpp"
#include "tactics.hpp"
#include "threats.hpp"

namespace six {
namespace {

using Clock = std::chrono::steady_clock;

constexpr int kInfinity = 2 * kWinScore;
constexpr int kMaxPly = 60;
// Scores this close to kWinScore are proven and encode a distance.
constexpr int kProvenMargin = 10'000;
// Worse than any evaluation but not a proven loss: every reply tried lost, but not all were tried.
constexpr int kLikelyLost = 5'000;

// Evaluation: weight of each alive window by stones in it, for the side to move and the opponent.
// Tempo favors the side to move, so its partial lines count more.
constexpr int kOwn[7] = {0, 2, 14, 80, 420, 900, 0};
constexpr int kTheirs[7] = {0, 2, 11, 55, 320, 700, 0};
// Move ordering: gain for adding a stone to an own window, and for spoiling an opposing one.
constexpr int kGain[6] = {1, 6, 32, 160, 900, 5000};
constexpr int kSpoil[7] = {0, 2, 10, 45, 800, 3000, 0};

constexpr int kRootWidth = 16;
constexpr int kInnerWidth = 10;
constexpr int kSecondWidth = 7;
// Past the horizon, forced defenses are still followed, but only this far and this wide.
constexpr int kExtensionTurns = 4;
constexpr int kExtensionFreeWidth = 3;

std::int32_t pack(Hex h) {
  return static_cast<std::int32_t>((static_cast<std::uint32_t>(h.q + 32768) << 16) | static_cast<std::uint32_t>(h.r + 32768));
}

Hex unpack(std::int32_t v) {
  const auto u = static_cast<std::uint32_t>(v);
  return {static_cast<int>(u >> 16) - 32768, static_cast<int>(u & 0xFFFF) - 32768};
}

struct Turn {
  Hex a;
  Hex b;
  int count = 0;  // 1 or 2 stones
  int order = 0;  // move-ordering score, higher first
};

bool sameTurn(const Turn& x, std::int32_t a, std::int32_t b) {
  const std::int32_t xa = pack(x.a);
  const std::int32_t xb = x.count == 2 ? pack(x.b) : -1;
  return (xa == a && xb == b) || (x.count == 2 && xa == b && xb == a);
}

int evaluate(const Board& board) {
  const Player me = board.current();
  const Player opp = other(me);
  int score = 0;
  for (int k = 1; k <= 5; ++k) score += kOwn[k] * board.aliveWindows(me, k) - kTheirs[k] * board.aliveWindows(opp, k);
  return score;
}

// Ordering contributions of one window, indexed by side (X, O) and the window's packed counts.
struct OrderTables {
  std::array<std::array<int, 256>, 2> cell{};
  // Change once the side also holds another cell of the window.
  std::array<std::array<int, 256>, 2> pair{};

  constexpr OrderTables() {
    for (int packed = 0; packed < 256; ++packed) {
      for (int side = 0; side < 2; ++side) {
        const int mine = side == 0 ? packed & 0xF : packed >> 4;
        const int theirs = side == 0 ? packed >> 4 : packed & 0xF;
        if (mine > kWinLength || theirs > kWinLength) continue;
        cell[side][packed] = (theirs == 0 && mine < 6 ? kGain[mine] : 0) + (mine == 0 ? kSpoil[theirs] : 0);
        pair[side][packed] = (theirs == 0 && mine + 1 < 6 ? kGain[mine + 1] - kGain[mine] : 0) - (mine == 0 ? kSpoil[theirs] : 0);
      }
    }
  }
};
constexpr OrderTables kOrder;

constexpr int sideOf(Player p) { return p == Player::X ? 0 : 1; }

int cellOrder(const Board& board, Hex c, Player p) {
  const auto& table = kOrder.cell[sideOf(p)];
  const int index = board.cellIndex(c);
  int score = 0;
  for (int a = 0; a < 3; ++a) {
    int start = index;
    for (int k = 0; k < kWinLength; ++k, start -= Board::kAxisStep[a]) score += table[board.packedWindow(a, start)];
  }
  return score;
}

// Change in cellOrder(c) once p also holds a. Only windows containing both cells change, which
// requires the cells to share a line within five steps.
int pairOrderDelta(const Board& board, Hex a, Hex c, Player p) {
  const int dq = c.q - a.q;
  const int dr = c.r - a.r;
  for (int axis = 0; axis < 3; ++axis) {
    const Hex d = kAxes[axis];
    int steps = 0;
    if (d.q != 0 && dq % d.q == 0) steps = dq / d.q;
    else if (d.q == 0 && dq == 0 && d.r != 0) steps = dr / d.r;
    else continue;
    if (steps == 0 || d.r * steps != dr || d.q * steps != dq || steps < -5 || steps > 5) continue;
    const auto& table = kOrder.pair[sideOf(p)];
    const int lo = std::min(0, steps);
    const int hi = std::max(0, steps);
    const int base = board.cellIndex(a);
    int delta = 0;
    // Windows along this axis containing both a (offset 0) and c (offset `steps`).
    for (int start = hi - 5; start <= lo; ++start) delta += table[board.packedWindow(axis, base + start * Board::kAxisStep[axis])];
    return delta;
  }
  return 0;
}

// Two stones turning me's threes into fours that two stones can't all block, from window counts only.
bool findDoubleFour(const Board& board, Player me, Hex* first, Hex* second) {
  const int meShift = me == Player::X ? 0 : 4;
  std::array<Hex, 32> cells;
  std::size_t cellCount = 0;
  board.forEachThree(me, [&](int axis, Hex start) {
    for (int i = 0; i < kWinLength; ++i) {
      const Hex c{start.q + kAxes[axis].q * i, start.r + kAxes[axis].r * i};
      const auto end = cells.begin() + static_cast<std::ptrdiff_t>(cellCount);
      if (board.at(c) == Player::None && cellCount < cells.size() && std::find(cells.begin(), end, c) == end) cells[cellCount++] = c;
    }
  });
  if (cellCount < 2) return false;
  std::sort(cells.begin(), cells.begin() + static_cast<std::ptrdiff_t>(cellCount), [](Hex x, Hex y) { return pack(x) < pack(y); });

  auto contains = [](Hex start, int axis, Hex c) {
    for (int i = 0; i < kWinLength; ++i) {
      if (start.q + kAxes[axis].q * i == c.q && start.r + kAxes[axis].r * i == c.r) return true;
    }
    return false;
  };

  // Empties left in each resulting four (unused slot = sentinel); at most 18 windows run through each stone.
  std::array<std::array<Hex, 2>, 36> fours;
  std::array<Hex, 72> blockers;
  const Hex none{std::numeric_limits<int>::min(), 0};
  for (std::size_t i = 0; i < cellCount; ++i) {
    for (std::size_t j = i + 1; j < cellCount; ++j) {
      const Hex a = cells[i];
      const Hex b = cells[j];
      std::size_t fourCount = 0;
      for (const Hex stone : {a, b}) {
        for (int axis = 0; axis < 3; ++axis) {
          for (int k = 0; k < kWinLength; ++k) {
            const Hex start{stone.q - kAxes[axis].q * k, stone.r - kAxes[axis].r * k};
            // Count each window once: when scanning from b, skip windows that also hold a.
            if (stone == b && contains(start, axis, a)) continue;
            const int packed = board.packedWindow(axis, board.cellIndex(start));
            if (((packed >> (4 - meShift)) & 0xF) != 0) continue;
            const int mine = ((packed >> meShift) & 0xF) + 1 + (stone == a && contains(start, axis, b) ? 1 : 0);
            if (mine < kWinLength - 2) continue;
            std::array<Hex, 2> left{none, none};
            int n = 0;
            for (int s = 0; s < kWinLength; ++s) {
              const Hex c{start.q + kAxes[axis].q * s, start.r + kAxes[axis].r * s};
              if (c == a || c == b || board.at(c) != Player::None) continue;
              if (n < 2) left[static_cast<std::size_t>(n)] = c;
              ++n;
            }
            fours[fourCount++] = left;
          }
        }
      }
      if (fourCount < 3) continue;  // one or two windows can always be covered with two stones
      const auto foursEnd = fours.begin() + static_cast<std::ptrdiff_t>(fourCount);
      auto hitsAll = [&](Hex x, Hex y) {
        return std::all_of(fours.begin(), foursEnd, [&](const auto& f) {
          return f[0] == x || f[1] == x || f[0] == y || f[1] == y;
        });
      };
      bool coverable = false;
      std::size_t blockerCount = 0;
      for (auto f = fours.begin(); f != foursEnd; ++f) {
        for (const Hex& c : *f) {
          const auto end = blockers.begin() + static_cast<std::ptrdiff_t>(blockerCount);
          if (c.q != none.q && std::find(blockers.begin(), end, c) == end) blockers[blockerCount++] = c;
        }
      }
      for (std::size_t x = 0; x < blockerCount && !coverable; ++x) {
        for (std::size_t y = x; y < blockerCount && !coverable; ++y) coverable = hitsAll(blockers[x], blockers[y]);
      }
      if (!coverable) {
        if (first) *first = a;
        if (second) *second = b;
        return true;
      }
    }
  }
  return false;
}

bool winInTurn(const Board& board, Player p, int stones) {
  bool found = false;
  board.forEachThreat(p, [&](int axis, Hex start) {
    if (!found && board.windowCount(axis, start, p) >= kWinLength - stones) found = true;
  });
  return found;
}

struct TTEntry {
  std::uint64_t key = 0;
  std::int32_t score = 0;
  std::int32_t a = -1;
  std::int32_t b = -1;
  std::int16_t depth = -1;
  std::uint8_t bound = 0;  // 1 exact, 2 lower, 3 upper
};

}  // namespace

bool hasDoubleFourWin(Board& board) {
  const Player me = board.current();
  if (board.winner() != Player::None || board.stonesLeft() != 2) return false;
  if (board.threatCount(other(me)) > 0 || board.threatCount(me) > 0) return false;
  return findDoubleFour(board, me, nullptr, nullptr);
}

struct Searcher::Impl {
  std::vector<TTEntry> table;
  Board board{9};
  std::int64_t nodes = 0;
  SearchLimits limits;
  Clock::time_point started;
  Clock::time_point deadline = Clock::time_point::max();
  // Deep threat checks after root turns stop here, leaving the rest of the turn to the main search.
  Clock::time_point replyDeadline = Clock::time_point::max();
  bool aborted = false;
  const std::atomic<bool>* stop = nullptr;
  SearchParams params;
  ThreatSolver threats{16};
  std::shared_ptr<const nnue::Weights> nnueWeights;
  // Kept in step with every stone the search plays and takes back.
  std::unique_ptr<nnue::Accumulator> acc;
  std::vector<std::vector<Turn>> turnStack = std::vector<std::vector<Turn>>(kMaxPly + 2);
  // Reused buffers for move generation, which never recurses.
  std::vector<std::pair<int, Hex>> rankedScratch;
  std::vector<std::pair<int, Hex>> poolScratch;
  std::vector<std::array<Hex, 2>> threatScratch;
  std::vector<Hex> coverScratch;
  std::vector<ThreatTurn> threatTurns;
  // Per-cell marks by dense index; a mark is current when it equals the latest nextMark().
  std::vector<std::uint32_t> mark = std::vector<std::uint32_t>(Board::kCells, 0);
  std::vector<std::uint32_t> firstMarks = std::vector<std::uint32_t>(Board::kCells, 0);
  std::uint32_t markEpoch = 0;

  explicit Impl(int megabytes) {
    std::size_t entries = 1;
    while (entries * 2 * sizeof(TTEntry) <= static_cast<std::size_t>(megabytes) * 1024 * 1024) entries *= 2;
    table.resize(entries);
  }

  void clear() {
    std::fill(table.begin(), table.end(), TTEntry{});
    threats.clear();
  }

  int staticEval() {
    if (!acc) return evaluate(board);
    if (params.nnueCheck) {
      nnue::Accumulator fresh(*nnueWeights);
      fresh.reset(board);
      for (const Player p : {Player::X, Player::O}) {
        for (int k = 0; k < nnueWeights->dim; ++k) {
          const float a = acc->sum(p)[k];
          if (std::fabs(a - fresh.sum(p)[k]) > 1e-3f * (1.0f + std::fabs(a))) throw std::runtime_error("NNUE running sums drifted");
        }
      }
    }
    return static_cast<int>(std::lround(acc->value(board) * static_cast<float>(params.nnueScale)));
  }

  int orderOf(Hex c, Player me) {
    if (acc && params.nnueOrdering) return static_cast<int>(std::lround(acc->policy(board, c) * 1000.0f));
    return cellOrder(board, c, me);
  }

  bool timeUp() {
    if (aborted) return true;
    if ((nodes & 63) != 0) return false;
    if (stop && stop->load()) aborted = true;
    if (limits.maxNodes >= 0 && nodes >= limits.maxNodes) aborted = true;
    if (limits.moveTimeMs >= 0 &&
        std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - started).count() >= limits.moveTimeMs) {
      aborted = true;
    }
    return aborted;
  }

  static int toTT(int score, int ply) {
    if (score > kWinScore - kProvenMargin) return score + ply;
    if (score < -kWinScore + kProvenMargin) return score - ply;
    return score;
  }
  static int fromTT(int score, int ply) {
    if (score > kWinScore - kProvenMargin) return score - ply;
    if (score < -kWinScore + kProvenMargin) return score + ply;
    return score;
  }

  // Only covers when the opponent threatens six.
  void generate(std::vector<Turn>& out, int width, int freeWidth = kInnerWidth) {
    out.clear();
    const Player me = board.current();
    const Player opp = other(me);
    const int stones = board.stonesLeft();

    if (board.stones() == 0) {
      out.push_back({{0, 0}, {}, 1, 0});
      return;
    }

    if (board.threatCount(opp) > 0) {
      generateCovers(out, me, opp, stones, freeWidth);
      return;
    }

    // A double four wins on the spot: nothing else needs searching.
    Hex winA;
    Hex winB;
    if (stones == 2 && board.threeCount(me) >= 2 && findDoubleFour(board, me, &winA, &winB)) {
      out.push_back({winA, winB, 2, kWinScore});
      return;
    }

    const auto& ranked = rankNear(me, static_cast<std::size_t>(std::max(width, kSecondWidth * 4 + 8)));
    const std::size_t firsts = std::min(ranked.size(), static_cast<std::size_t>(width));

    if (stones == 1) {
      for (std::size_t i = 0; i < firsts; ++i) out.push_back({ranked[i].second, {}, 1, ranked[i].first});
      return;
    }

    // A pair can repeat only as (b, a) after b's own turn as a first stone, so only then look for it.
    const std::uint32_t firstMark = nextMark();
    for (std::size_t i = 0; i < firsts; ++i) {
      const auto& [firstScore, a] = ranked[i];
      firstMarks[static_cast<std::size_t>(board.cellIndex(a))] = firstMark;
      for (const auto& [secondScore, b] : bestSeconds(ranked, a, me, kSecondWidth)) {
        if (firstMarks[static_cast<std::size_t>(board.cellIndex(b))] == firstMark) {
          const std::int32_t pa = pack(a);
          const std::int32_t pb = pack(b);
          if (std::any_of(out.begin(), out.end(), [&](const Turn& t) { return sameTurn(t, pa, pb); })) continue;
        }
        out.push_back({a, b, 2, firstScore + secondScore});
      }
    }
    if (params.genThreatTurns > 0) {
      // Turns that take both of the opponent's stones to answer go first.
      doubleThreats(board, threatTurns);
      const std::size_t count = std::min(threatTurns.size(), static_cast<std::size_t>(params.genThreatTurns));
      for (std::size_t i = 0; i < count; ++i) {
        const ThreatTurn& t = threatTurns[i];
        const int order = 1'000'000 - static_cast<int>(i);
        const std::int32_t pa = pack(t.a);
        const std::int32_t pb = pack(t.b);
        auto it = std::find_if(out.begin(), out.end(), [&](const Turn& x) { return sameTurn(x, pa, pb); });
        if (it != out.end()) it->order = order;
        else out.push_back({t.a, t.b, 2, order});
      }
    }
    std::stable_sort(out.begin(), out.end(), [](const Turn& x, const Turn& y) { return x.order > y.order; });
  }

  std::uint32_t nextMark() {
    if (++markEpoch == 0) {
      std::fill(mark.begin(), mark.end(), 0u);
      std::fill(firstMarks.begin(), firstMarks.end(), 0u);
      markEpoch = 1;
    }
    return markEpoch;
  }

  static bool betterCell(const std::pair<int, Hex>& x, const std::pair<int, Hex>& y) {
    return x.first != y.first ? x.first > y.first : pack(x.second) < pack(y.second);
  }

  // Empty cells within two steps of a stone; only the first `keep` are sorted.
  const std::vector<std::pair<int, Hex>>& rankNear(Player me, std::size_t keep) {
    rankedScratch.clear();
    board.forEachNearEmpty(2, [&](Hex c) { rankedScratch.push_back({orderOf(c, me), c}); });
    const auto mid = rankedScratch.begin() + static_cast<std::ptrdiff_t>(std::min(keep, rankedScratch.size()));
    std::partial_sort(rankedScratch.begin(), mid, rankedScratch.end(), betterCell);
    return rankedScratch;
  }

  // Scored without replaying the board. Valid until the next call.
  const std::vector<std::pair<int, Hex>>& bestSeconds(const std::vector<std::pair<int, Hex>>& ranked, Hex a, Player me, int count) {
    auto& pool = poolScratch;
    pool.clear();
    const std::uint32_t inPool = nextMark();
    // Cells on a's lines change value; everything else keeps its ranked score.
    const std::size_t scan = std::min(ranked.size(), static_cast<std::size_t>(count * 4 + 8));
    for (std::size_t i = 0; i < scan; ++i) {
      const Hex c = ranked[i].second;
      if (c == a) continue;
      mark[static_cast<std::size_t>(board.cellIndex(c))] = inPool;
      pool.push_back({ranked[i].first + pairOrderDelta(board, a, c, me), c});
    }
    for (int axis = 0; axis < 3; ++axis) {
      for (int step = -5; step <= 5; ++step) {
        if (step == 0) continue;
        const Hex c{a.q + kAxes[axis].q * step, a.r + kAxes[axis].r * step};
        if (!board.isPlayable(c) || mark[static_cast<std::size_t>(board.cellIndex(c))] == inPool) continue;
        pool.push_back({cellOrder(board, c, me) + pairOrderDelta(board, a, c, me), c});
      }
    }
    if (acc && params.nnueOrdering && board.place(a) == PlaceError::None) {
      // Score the second stones with `a` down (the cached scores follow it in and out).
      acc->placed(board, a);
      if (board.winner() == Player::None) {
        for (auto& [score, c] : pool) score = static_cast<int>(std::lround(acc->policy(board, c) * 1000.0f));
      }
      acc->removing(board, a);
      board.undo();
    }
    const auto end = pool.begin() + static_cast<std::ptrdiff_t>(std::min(pool.size(), static_cast<std::size_t>(count)));
    std::partial_sort(pool.begin(), end, pool.end(), betterCell);
    pool.erase(end, pool.end());
    return pool;
  }

  // Turns hitting every opponent threat window; none means the opponent wins next turn.
  void generateCovers(std::vector<Turn>& out, Player me, Player opp, int stones, int freeWidth) {
    // A threat window holds at least four stones, so it has at most two empties (unused slot = sentinel).
    const Hex none{std::numeric_limits<int>::min(), 0};
    auto& threatEmpties = threatScratch;
    threatEmpties.clear();
    board.forEachThreat(opp, [&](int axis, Hex start) {
      std::array<Hex, 2> e{none, none};
      int n = 0;
      for (int i = 0; i < kWinLength; ++i) {
        const Hex c{start.q + kAxes[axis].q * i, start.r + kAxes[axis].r * i};
        if (board.at(c) == Player::None) e[static_cast<std::size_t>(n++)] = c;
      }
      threatEmpties.push_back(e);
    });
    auto& cells = coverScratch;
    cells.clear();
    for (const auto& e : threatEmpties) {
      for (const Hex& c : e) {
        if (c.q != none.q && std::find(cells.begin(), cells.end(), c) == cells.end()) cells.push_back(c);
      }
    }
    std::sort(cells.begin(), cells.end(), [](Hex x, Hex y) { return pack(x) < pack(y); });
    const std::vector<std::pair<int, Hex>>* ranked = nullptr;
    auto hits = [](Hex c, const std::array<Hex, 2>& e) { return e[0] == c || e[1] == c; };
    auto coversAll = [&](Hex a, const Hex* b) {
      return std::all_of(threatEmpties.begin(), threatEmpties.end(),
                         [&](const auto& e) { return hits(a, e) || (b && hits(*b, e)); });
    };

    for (const Hex& a : cells) {
      if (!coversAll(a, nullptr)) continue;
      if (stones == 1) {
        out.push_back({a, {}, 1, cellOrder(board, a, me)});
        continue;
      }
      // One stone suffices: the second is free, so choose it from the best nearby cells.
      if (!ranked) ranked = &rankNear(me, static_cast<std::size_t>(freeWidth * 4 + 8));
      const int orderA = cellOrder(board, a, me);
      for (const auto& [score, b] : bestSeconds(*ranked, a, me, freeWidth)) {
        const std::int32_t pa = pack(a);
        const std::int32_t pb = pack(b);
        if (std::any_of(out.begin(), out.end(), [&](const Turn& t) { return sameTurn(t, pa, pb); })) continue;
        out.push_back({a, b, 2, orderA + score + 1'000'000});
      }
    }
    if (stones == 2) {
      for (std::size_t i = 0; i < cells.size(); ++i) {
        for (std::size_t j = i + 1; j < cells.size(); ++j) {
          if (!coversAll(cells[i], &cells[j])) continue;
          const std::int32_t pa = pack(cells[i]);
          const std::int32_t pb = pack(cells[j]);
          if (std::any_of(out.begin(), out.end(), [&](const Turn& t) { return sameTurn(t, pa, pb); })) continue;
          out.push_back({cells[i], cells[j], 2, cellOrder(board, cells[i], me) + cellOrder(board, cells[j], me)});
        }
      }
    }
    std::stable_sort(out.begin(), out.end(), [](const Turn& x, const Turn& y) { return x.order > y.order; });
  }

  // True if the turn wins. `placed` gets the stones placed, or -1 (with nothing left on the board)
  // when a stone is out of reach, which only happens at the window edge.
  bool play(const Turn& t, int& placed) {
    placed = 0;
    if (board.place(t.a) != PlaceError::None) {
      placed = -1;
      return false;
    }
    ++placed;
    if (acc) acc->placed(board, t.a);
    if (board.winner() != Player::None) return true;
    if (t.count == 2) {
      if (board.place(t.b) != PlaceError::None) {
        if (acc) acc->removing(board, t.a);
        board.undo();
        placed = -1;
        return false;
      }
      ++placed;
      if (acc) acc->placed(board, t.b);
      if (board.winner() != Player::None) return true;
    }
    return false;
  }

  void takeBack(int placed) {
    for (int i = 0; i < placed; ++i) {
      if (acc) acc->removing(board, board.moves().back());
      board.undo();
    }
  }

  int negamax(int depth, int alpha, int beta, int ply) {
    ++nodes;
    if (timeUp()) return 0;

    const Player me = board.current();
    const Player opp = other(me);
    if (winInTurn(board, me, board.stonesLeft())) return kWinScore - ply;

    const bool forced = board.threatCount(opp) > 0;
    if (!forced && board.stonesLeft() == 2) {
      // Threat-space search. The opponent's reply to each root turn gets the root's depth.
      const bool reply = ply == 1 && params.replyThreatNodes > 0 && Clock::now() < replyDeadline;
      const std::int64_t budget = reply ? params.replyThreatNodes : depth <= params.nodeThreatMaxDepth ? params.nodeThreatNodes : 0;
      const ThreatWin win = budget > 0 ? threats.solve(board, reply ? params.rootThreatTurns : params.nodeThreatTurns, budget, reply ? replyDeadline : deadline) : ThreatWin{};
      if (win.found) return kWinScore - (ply + 2 * win.turns);
    }
    if ((depth <= 0 && !forced) || depth < -kExtensionTurns || ply >= kMaxPly) return staticEval();

    const std::uint64_t key = board.hash();
    TTEntry& slot = table[key & (table.size() - 1)];
    std::int32_t ttA = -1;
    std::int32_t ttB = -1;
    if (slot.key == key) {
      ttA = slot.a;
      ttB = slot.b;
      if (slot.depth >= depth) {
        const int s = fromTT(slot.score, ply);
        if (slot.bound == 1) return s;
        if (slot.bound == 2 && s >= beta) return s;
        if (slot.bound == 3 && s <= alpha) return s;
      }
    }

    auto& turns = turnStack[static_cast<std::size_t>(ply)];
    generate(turns, kInnerWidth, depth > 0 ? kInnerWidth : kExtensionFreeWidth);
    if (turns.empty()) return forced ? -(kWinScore - ply - 1) : staticEval();
    if (ttA >= 0) {
      auto it = std::find_if(turns.begin(), turns.end(), [&](const Turn& t) { return sameTurn(t, ttA, ttB); });
      if (it != turns.end()) std::rotate(turns.begin(), it, it + 1);
    }

    const int alphaStart = alpha;
    int best = -kInfinity;
    Turn bestTurn = turns.front();
    for (std::size_t i = 0; i < turns.size(); ++i) {
      const Turn t = turns[i];
      int placed = 0;
      int score;
      if (play(t, placed)) {
        score = kWinScore - ply;
      } else if (placed < 0) {
        continue;
      } else {
        score = -negamax(depth - 1, -beta, -alpha, ply + 1);
      }
      takeBack(placed);
      if (aborted) return 0;
      if (score > best) {
        best = score;
        bestTurn = t;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }

    // A loss is proven only if every defence was tried. Quiet nodes with NNUE ordering search only the
    // best few moves, so there it is just very bad. Forced nodes try every cover, so the proof stands.
    if (acc && !forced && best < -(kWinScore - kProvenMargin)) best = -kLikelyLost;

    slot.key = key;
    slot.score = toTT(best, ply);
    slot.depth = static_cast<std::int16_t>(depth);
    slot.a = pack(bestTurn.a);
    slot.b = bestTurn.count == 2 ? pack(bestTurn.b) : -1;
    slot.bound = best <= alphaStart ? 3 : best >= beta ? 2 : 1;
    return best;
  }
};

Searcher::Searcher(int ttMegabytes) : impl_(new Impl(ttMegabytes)) {}

Searcher::~Searcher() { delete impl_; }

void Searcher::newGame() { impl_->clear(); }

SearchParams& Searcher::params() { return impl_->params; }

void Searcher::setNnue(std::shared_ptr<const nnue::Weights> weights) { impl_->nnueWeights = std::move(weights); }

bool SearchParams::set(const std::string& name, std::int64_t value) {
  const auto small = static_cast<int>(value);
  if (name == "rootThreatTurns") rootThreatTurns = small;
  else if (name == "rootThreatNodes") rootThreatNodes = value;
  else if (name == "replyThreatNodes") replyThreatNodes = value;
  else if (name == "nodeThreatTurns") nodeThreatTurns = small;
  else if (name == "nodeThreatNodes") nodeThreatNodes = value;
  else if (name == "nodeThreatMaxDepth") nodeThreatMaxDepth = small;
  else if (name == "genThreatTurns") genThreatTurns = small;
  else if (name == "nnueOrdering") nnueOrdering = small;
  else if (name == "nnueScale") nnueScale = small;
  else if (name == "nnueCheck") nnueCheck = small;
  else return false;
  return true;
}

std::vector<std::pair<std::string, std::int64_t>> SearchParams::list() const {
  return {{"rootThreatTurns", rootThreatTurns},
          {"rootThreatNodes", rootThreatNodes},
          {"replyThreatNodes", replyThreatNodes},
          {"nodeThreatTurns", nodeThreatTurns},
          {"nodeThreatNodes", nodeThreatNodes},
          {"nodeThreatMaxDepth", nodeThreatMaxDepth},
          {"genThreatTurns", genThreatTurns},
          {"nnueOrdering", nnueOrdering},
          {"nnueScale", nnueScale},
          {"nnueCheck", nnueCheck}};
}

SearchResult Searcher::search(const Board& position, const SearchLimits& limits,
                              const std::function<void(const SearchInfo&)>& onInfo) {
  Impl& s = *impl_;
  stopRequested_ = false;
  s.board = position;
  // Every cell the search considers lies within 7 steps of a stone, so with radius 7 or more
  // the playable area needn't be tracked while searching.
  s.board.setSearchMode(position.radius() >= 7);
  if (s.nnueWeights) {
    s.acc = std::make_unique<nnue::Accumulator>(*s.nnueWeights);
    s.acc->enablePolicyCache();
    s.acc->reset(s.board);
  } else {
    s.acc.reset();
  }
  s.limits = limits;
  s.nodes = 0;
  s.aborted = false;
  s.stop = &stopRequested_;
  s.started = Clock::now();
  s.deadline = limits.moveTimeMs >= 0 ? s.started + std::chrono::milliseconds(limits.moveTimeMs) : Clock::time_point::max();
  s.replyDeadline = limits.moveTimeMs >= 0 ? s.started + std::chrono::milliseconds(limits.moveTimeMs * 3 / 10) : Clock::time_point::max();

  SearchResult result;
  if (s.board.winner() != Player::None) return result;

  // A win on the board beats everything, including covering the opponent's threats.
  {
    const Player me = s.board.current();
    const int stones = s.board.stonesLeft();
    std::vector<Hex> bestWin;
    s.board.forEachThreat(me, [&](int axis, Hex start) {
      if (s.board.windowCount(axis, start, me) < kWinLength - stones) return;
      std::vector<Hex> empties;
      for (int i = 0; i < kWinLength; ++i) {
        const Hex c{start.q + kAxes[axis].q * i, start.r + kAxes[axis].r * i};
        if (s.board.at(c) == Player::None) empties.push_back(c);
      }
      std::sort(empties.begin(), empties.end(), [](Hex x, Hex y) { return pack(x) < pack(y); });
      const auto key = [](const std::vector<Hex>& v) { return std::make_pair(v.size(), v.empty() ? 0 : pack(v[0])); };
      if (bestWin.empty() || key(empties) < key(bestWin)) bestWin = empties;
    });
    if (!bestWin.empty()) {
      result.stones = bestWin;
      result.score = kWinScore;
      result.depth = 1;
      return result;
    }
  }

  if (s.board.stonesLeft() == 2 && s.board.threatCount(other(s.board.current())) == 0) {
    const ThreatWin win = s.threats.solve(s.board, s.params.rootThreatTurns, s.params.rootThreatNodes, s.deadline);
    if (win.found) {
      result.stones = {win.a, win.b};
      result.score = kWinScore - 2 * win.turns;
      result.depth = win.turns;
      result.nodes = win.nodes;
      result.timeMs = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - s.started).count());
      return result;
    }
  }

  std::vector<Turn> root;
  s.generate(root, kRootWidth);
  if (root.empty()) {
    // The opponent's threats can't all be covered: play the best-looking stones anyway.
    const Player me = s.board.current();
    std::vector<std::pair<int, Hex>> cells;
    s.board.forEachNearEmpty(2, [&](Hex c) { cells.push_back({cellOrder(s.board, c, me), c}); });
    std::sort(cells.begin(), cells.end(), [](const auto& x, const auto& y) {
      return x.first != y.first ? x.first > y.first : pack(x.second) < pack(y.second);
    });
    for (int i = 0; i < s.board.stonesLeft() && i < static_cast<int>(cells.size()); ++i) result.stones.push_back(cells[static_cast<std::size_t>(i)].second);
    result.score = -(kWinScore - 1);
    return result;
  }

  Turn best = root.front();
  int bestScore = 0;
  for (int depth = 1; depth <= limits.maxDepth; ++depth) {
    int alpha = -kInfinity;
    const int beta = kInfinity;
    Turn depthBest = root.front();
    int depthScore = -kInfinity;
    for (const Turn& t : root) {
      int placed = 0;
      int score;
      if (s.play(t, placed)) {
        score = kWinScore;
      } else if (placed < 0) {
        continue;
      } else {
        score = -s.negamax(depth - 1, -beta, -alpha, 1);
      }
      s.takeBack(placed);
      if (s.aborted) break;
      if (score > depthScore) {
        depthScore = score;
        depthBest = t;
      }
      alpha = std::max(alpha, score);
    }
    if (s.aborted && depthScore == -kInfinity) break;
    if (s.aborted) {
      // A partial depth still improves the answer when its best beat the previous best.
      if (depthBest.a == best.a && depthBest.b == best.b) bestScore = depthScore;
      break;
    }
    best = depthBest;
    bestScore = depthScore;
    result.depth = depth;
    auto it = std::find_if(root.begin(), root.end(), [&](const Turn& t) {
      return sameTurn(t, pack(best.a), best.count == 2 ? pack(best.b) : -1);
    });
    if (it != root.end()) std::rotate(root.begin(), it, it + 1);

    if (onInfo) {
      SearchInfo info;
      info.depth = depth;
      info.score = bestScore;
      info.nodes = s.nodes;
      info.timeMs = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - s.started).count());
      info.pv.push_back(best.a);
      if (best.count == 2) info.pv.push_back(best.b);
      onInfo(info);
    }
    // A proven result within the searched horizon won't change with more depth.
    if (bestScore >= kWinScore - depth || bestScore <= -kWinScore + depth) break;
  }

  result.stones.push_back(best.a);
  if (best.count == 2) {
    // If the first stone already makes six, the game ends there.
    Board check = s.board;
    check.place(best.a);
    if (check.winner() == Player::None) result.stones.push_back(best.b);
  }
  result.score = bestScore;
  result.nodes = s.nodes;
  result.timeMs = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - s.started).count());
  return result;
}

}  // namespace six
