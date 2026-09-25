#include "threats.hpp"

#include <algorithm>
#include <array>
#include <stdexcept>

namespace six {
namespace {

/** Pairs are formed from at most this many cells that turn a three into a four. */
constexpr std::size_t kMaxThreeCells = 48;
/** A stone that makes a double threat on its own gets this many second stones, chosen to build new threes. */
constexpr std::size_t kFreePartners = 4;

/** A window about to hold four or five stones, and the empty cells it would still have (by dense index, -1 unused). */
struct Four {
  std::array<std::int32_t, 2> e{-1, -1};
};

std::uint64_t pairKey(std::int32_t x, std::int32_t y) {
  const auto lo = static_cast<std::uint64_t>(std::min(x, y));
  const auto hi = static_cast<std::uint64_t>(std::max(x, y));
  return (lo << 32) | hi;
}

bool hits(const Four& f, std::int32_t c) { return f.e[0] == c || f.e[1] == c; }

/** Fewest cells touching every four: 0 with no fours, 3 when two aren't enough. */
int coverOf(const Four* fours, std::size_t n) {
  if (n == 0) return 0;
  const Four* end = fours + n;
  // Every cover holds a cell of the first four.
  for (const std::int32_t x : fours[0].e) {
    if (x >= 0 && std::all_of(fours + 1, end, [&](const Four& f) { return hits(f, x); })) return 1;
  }
  for (const std::int32_t x : fours[0].e) {
    if (x < 0) continue;
    const Four* miss = std::find_if(fours + 1, end, [&](const Four& f) { return !hits(f, x); });
    for (const std::int32_t y : miss->e) {
      if (y >= 0 && std::all_of(miss + 1, end, [&](const Four& f) { return hits(f, x) || hits(f, y); })) return 2;
    }
  }
  return 3;
}

struct TwoPair {
  std::uint64_t key;
  Four rest;  // the window's other two empties once both cells of the pair are filled
};

struct Ranked {
  int cover;
  int fours;
  std::uint64_t key;
};

struct Scratch {
  std::vector<std::array<std::int32_t, 3>> threes;               // empties of each three window
  std::vector<std::pair<std::int32_t, std::int32_t>> cellThrees;  // (cell, three id), sorted
  std::vector<std::int32_t> threeCells;                           // distinct cells of the threes, sorted
  std::vector<TwoPair> twoPairs;                                  // sorted by key
  std::vector<std::int32_t> twoCells;                             // empties of two windows, with repeats
  std::vector<std::pair<int, std::int32_t>> partners;             // (-two windows, cell), best first
  std::vector<std::uint64_t> candidates;
  std::vector<Four> fours;
  std::vector<Ranked> ranked;
};

thread_local Scratch scratch;

/** Adds the fours made by `me`'s three windows through `cell`, with `other` also filled; skips windows through `skip`. */
void addThreeFours(Scratch& s, std::int32_t cell, std::int32_t other, std::int32_t skip) {
  auto it = std::lower_bound(s.cellThrees.begin(), s.cellThrees.end(), std::make_pair(cell, std::int32_t{-1}));
  for (; it != s.cellThrees.end() && it->first == cell; ++it) {
    const auto& empties = s.threes[static_cast<std::size_t>(it->second)];
    if (skip >= 0 && std::find(empties.begin(), empties.end(), skip) != empties.end()) continue;
    Four f;
    int n = 0;
    for (const std::int32_t e : empties) {
      if (e != cell && e != other) f.e[static_cast<std::size_t>(n++)] = e;
    }
    s.fours.push_back(f);
  }
}

}  // namespace

void doubleThreats(const Board& board, std::vector<ThreatTurn>& out) {
  out.clear();
  const Player me = board.current();
  if (board.winner() != Player::None || board.stonesLeft() != 2 || board.threatCount(me) > 0) return;
  Scratch& s = scratch;

  s.threes.clear();
  s.cellThrees.clear();
  board.forEachThreeIndex(me, [&](int axis, int start) {
    std::array<std::int32_t, 3> empties{};
    int n = 0;
    for (int i = 0; i < kWinLength; ++i) {
      const int idx = start + i * Board::kAxisStep[static_cast<std::size_t>(axis)];
      if (board.atIndex(idx) == Player::None) empties[static_cast<std::size_t>(n++)] = idx;
    }
    const auto id = static_cast<std::int32_t>(s.threes.size());
    s.threes.push_back(empties);
    for (const std::int32_t e : empties) s.cellThrees.push_back({e, id});
  });
  std::sort(s.cellThrees.begin(), s.cellThrees.end());
  s.threeCells.clear();
  for (const auto& [cell, id] : s.cellThrees) {
    if (s.threeCells.empty() || s.threeCells.back() != cell) s.threeCells.push_back(cell);
  }

  s.twoPairs.clear();
  s.twoCells.clear();
  board.forEachTwoIndex(me, [&](int axis, int start) {
    std::array<std::int32_t, 4> empties{};
    int n = 0;
    for (int i = 0; i < kWinLength; ++i) {
      const int idx = start + i * Board::kAxisStep[static_cast<std::size_t>(axis)];
      if (board.atIndex(idx) == Player::None) empties[static_cast<std::size_t>(n++)] = idx;
    }
    for (int i = 0; i < 4; ++i) {
      s.twoCells.push_back(empties[static_cast<std::size_t>(i)]);
      for (int j = i + 1; j < 4; ++j) {
        TwoPair p{pairKey(empties[static_cast<std::size_t>(i)], empties[static_cast<std::size_t>(j)]), {}};
        int r = 0;
        for (int k = 0; k < 4; ++k) {
          if (k != i && k != j) p.rest.e[static_cast<std::size_t>(r++)] = empties[static_cast<std::size_t>(k)];
        }
        s.twoPairs.push_back(p);
      }
    }
  });
  std::sort(s.twoPairs.begin(), s.twoPairs.end(), [](const TwoPair& x, const TwoPair& y) { return x.key < y.key; });

  const auto isThreeCell = [&](std::int32_t c) { return std::binary_search(s.threeCells.begin(), s.threeCells.end(), c); };

  // Candidates. Every new four either had three stones and gains one, or had two and gains both.
  s.candidates.clear();
  const std::size_t pairable = std::min(s.threeCells.size(), kMaxThreeCells);
  for (std::size_t i = 0; i < pairable; ++i) {
    for (std::size_t j = i + 1; j < pairable; ++j) s.candidates.push_back(pairKey(s.threeCells[i], s.threeCells[j]));
  }
  // A pair filling only two windows needs a second four: another such window, or a three through either cell.
  for (std::size_t i = 0; i < s.twoPairs.size();) {
    std::size_t j = i;
    while (j < s.twoPairs.size() && s.twoPairs[j].key == s.twoPairs[i].key) ++j;
    const auto lo = static_cast<std::int32_t>(s.twoPairs[i].key >> 32);
    const auto hi = static_cast<std::int32_t>(s.twoPairs[i].key & 0xFFFFFFFFu);
    if (j - i >= 2 || isThreeCell(lo) || isThreeCell(hi)) s.candidates.push_back(s.twoPairs[i].key);
    i = j;
  }
  // A stone whose own fours already need two blockers leaves the second stone free: use it to start new threes.
  if (!s.twoCells.empty()) {
    std::sort(s.twoCells.begin(), s.twoCells.end());
    s.partners.clear();
    for (std::size_t i = 0; i < s.twoCells.size();) {
      std::size_t j = i;
      while (j < s.twoCells.size() && s.twoCells[j] == s.twoCells[i]) ++j;
      if (!isThreeCell(s.twoCells[i])) s.partners.push_back({-static_cast<int>(j - i), s.twoCells[i]});
      i = j;
    }
    const auto best = s.partners.begin() + static_cast<std::ptrdiff_t>(std::min(kFreePartners, s.partners.size()));
    std::partial_sort(s.partners.begin(), best, s.partners.end());
    for (std::size_t i = 0; i < pairable; ++i) {
      const std::int32_t a = s.threeCells[i];
      s.fours.clear();
      addThreeFours(s, a, -1, -1);
      if (coverOf(s.fours.data(), s.fours.size()) < 2) continue;
      for (auto it = s.partners.begin(); it != best; ++it) s.candidates.push_back(pairKey(a, it->second));
    }
  }
  std::sort(s.candidates.begin(), s.candidates.end());
  s.candidates.erase(std::unique(s.candidates.begin(), s.candidates.end()), s.candidates.end());

  s.ranked.clear();
  for (const std::uint64_t key : s.candidates) {
    const auto a = static_cast<std::int32_t>(key >> 32);
    const auto b = static_cast<std::int32_t>(key & 0xFFFFFFFFu);
    s.fours.clear();
    addThreeFours(s, a, b, -1);
    addThreeFours(s, b, a, a);
    auto it = std::lower_bound(s.twoPairs.begin(), s.twoPairs.end(), key, [](const TwoPair& p, std::uint64_t k) { return p.key < k; });
    for (; it != s.twoPairs.end() && it->key == key; ++it) s.fours.push_back(it->rest);
    const int cover = coverOf(s.fours.data(), s.fours.size());
    if (cover < 2) continue;
    if (!board.isPlayable(board.cellAt(a)) || !board.isPlayable(board.cellAt(b))) continue;
    s.ranked.push_back({cover, static_cast<int>(s.fours.size()), key});
  }
  std::sort(s.ranked.begin(), s.ranked.end(), [](const Ranked& x, const Ranked& y) {
    if (x.cover != y.cover) return x.cover > y.cover;
    if (x.fours != y.fours) return x.fours > y.fours;
    return x.key < y.key;
  });
  for (const Ranked& r : s.ranked) {
    out.push_back({board.cellAt(static_cast<std::int32_t>(r.key >> 32)), board.cellAt(static_cast<std::int32_t>(r.key & 0xFFFFFFFFu)), r.cover});
  }
}

void coveringPairs(const Board& board, Player attacker, std::vector<std::pair<Hex, Hex>>& out) {
  out.clear();
  std::array<Four, 64> fours;
  std::size_t n = 0;
  std::array<std::int32_t, 128> cells;
  std::size_t cellCount = 0;
  board.forEachThreatIndex(attacker, [&](int axis, int start) {
    if (n == fours.size()) throw std::length_error("too many threat windows to cover");
    Four f;
    int k = 0;
    for (int i = 0; i < kWinLength; ++i) {
      const int idx = start + i * Board::kAxisStep[static_cast<std::size_t>(axis)];
      if (board.atIndex(idx) != Player::None) continue;
      f.e[static_cast<std::size_t>(k++)] = idx;
      const auto end = cells.begin() + static_cast<std::ptrdiff_t>(cellCount);
      if (std::find(cells.begin(), end, idx) == end) cells[cellCount++] = idx;
    }
    fours[n++] = f;
  });
  std::sort(cells.begin(), cells.begin() + static_cast<std::ptrdiff_t>(cellCount));
  for (std::size_t i = 0; i < cellCount; ++i) {
    for (std::size_t j = i + 1; j < cellCount; ++j) {
      const std::int32_t x = cells[i];
      const std::int32_t y = cells[j];
      if (std::all_of(fours.begin(), fours.begin() + static_cast<std::ptrdiff_t>(n), [&](const Four& f) { return hits(f, x) || hits(f, y); })) {
        out.push_back({board.cellAt(x), board.cellAt(y)});
      }
    }
  }
}

namespace {

/** Whether both stones of a turn can go down (cells at the board window's edge can be out of reach). */
bool placeable(Board& board, Hex a, Hex b) {
  if (board.place(a) != PlaceError::None) return false;
  const bool ok = board.canPlace(b) == PlaceError::None;
  board.undo();
  return ok;
}

}  // namespace

struct ThreatSolver::Impl {
  struct Entry {
    std::uint64_t key = 0;
    Hex a;
    Hex b;
    std::int8_t proven = 0;    // attacking turns to win, 0 if not proven
    std::int8_t searched = 0;  // turns searched without a proof
  };

  std::vector<Entry> table;
  std::vector<std::vector<ThreatTurn>> attacks;
  std::vector<std::vector<std::pair<Hex, Hex>>> defenses;
  std::int64_t nodes = 0;
  std::int64_t budget = 0;
  std::chrono::steady_clock::time_point deadline;
  bool aborted = false;
  Hex rootA;
  Hex rootB;

  explicit Impl(int megabytes) {
    std::size_t entries = 1;
    while (entries * 2 * sizeof(Entry) <= static_cast<std::size_t>(megabytes) * 1024 * 1024) entries *= 2;
    table.resize(entries);
  }

  /** Attacking turns the side to move needs to win, within `turnsLeft`; 0 if none was found. */
  int attack(Board& board, int turnsLeft, int ply) {
    if (++nodes > budget || ((nodes & 31) == 0 && std::chrono::steady_clock::now() >= deadline)) {
      aborted = true;
      return 0;
    }
    const std::uint64_t key = board.hash();
    {
      const Entry& e = table[key & (table.size() - 1)];
      if (e.key == key && e.proven > 0 && e.proven <= turnsLeft) {
        if (ply == 0) {
          rootA = e.a;
          rootB = e.b;
        }
        return e.proven;
      }
      if (e.key == key && e.proven == 0 && e.searched >= turnsLeft) return 0;
    }

    const Player me = board.current();
    const Player opp = other(me);
    auto& turns = attacks[static_cast<std::size_t>(ply)];
    doubleThreats(board, turns);
    int proven = 0;
    Hex bestA;
    Hex bestB;
    for (const ThreatTurn& t : turns) {
      if (t.cover >= 3 && placeable(board, t.a, t.b)) {
        proven = 1;
        bestA = t.a;
        bestB = t.b;
        break;
      }
    }
    for (std::size_t i = 0; i < turns.size() && proven == 0 && turnsLeft > 1; ++i) {
      const ThreatTurn t = turns[i];
      // Only at the edge of the board window can a generated stone be out of reach: skip that attack.
      if (board.place(t.a) != PlaceError::None) continue;
      if (board.place(t.b) != PlaceError::None) {
        board.undo();
        continue;
      }
      auto& replies = defenses[static_cast<std::size_t>(ply)];
      coveringPairs(board, me, replies);
      // The defender must block every four; a block that leaves them a threat of their own breaks the attack.
      int slowest = replies.empty() ? -1 : 0;
      for (std::size_t r = 0; r < replies.size() && slowest >= 0; ++r) {
        const auto [x, y] = replies[r];
        // A block out of the window's reach is still a real block: count the attack as refuted (sound).
        if (board.place(x) != PlaceError::None) {
          slowest = -1;
          break;
        }
        if (board.place(y) != PlaceError::None) {
          board.undo();
          slowest = -1;
          break;
        }
        const int needed = board.threatCount(opp) == 0 ? attack(board, turnsLeft - 1, ply + 1) : 0;
        board.undo();
        board.undo();
        slowest = needed == 0 ? -1 : std::max(slowest, needed);
      }
      board.undo();
      board.undo();
      if (aborted) return 0;
      if (slowest > 0) {
        proven = 1 + slowest;
        bestA = t.a;
        bestB = t.b;
      }
    }

    Entry& slot = table[key & (table.size() - 1)];
    slot.key = key;
    slot.a = bestA;
    slot.b = bestB;
    slot.proven = static_cast<std::int8_t>(proven);
    slot.searched = static_cast<std::int8_t>(turnsLeft);
    if (ply == 0 && proven > 0) {
      rootA = bestA;
      rootB = bestB;
    }
    return proven;
  }
};

ThreatSolver::ThreatSolver(int ttMegabytes) : impl_(new Impl(ttMegabytes)) {}

ThreatSolver::~ThreatSolver() { delete impl_; }

void ThreatSolver::clear() { std::fill(impl_->table.begin(), impl_->table.end(), Impl::Entry{}); }

ThreatWin ThreatSolver::solve(Board& board, int maxTurns, std::int64_t nodeBudget, std::chrono::steady_clock::time_point deadline) {
  Impl& s = *impl_;
  ThreatWin result;
  const Player me = board.current();
  if (maxTurns < 1 || board.winner() != Player::None || board.stonesLeft() != 2 || board.threatCount(me) > 0 ||
      board.threatCount(other(me)) > 0) {
    return result;
  }
  s.nodes = 0;
  s.budget = nodeBudget;
  s.deadline = deadline;
  s.aborted = false;
  const auto depth = static_cast<std::size_t>(maxTurns) + 1;
  if (s.attacks.size() < depth) {
    s.attacks.resize(depth);
    s.defenses.resize(depth);
  }
  for (int turns = 1; turns <= maxTurns && !s.aborted; ++turns) {
    const int proven = s.attack(board, turns, 0);
    if (proven > 0) {
      result.found = true;
      result.turns = proven;
      result.a = s.rootA;
      result.b = s.rootB;
      break;
    }
  }
  result.nodes = s.nodes;
  result.exhausted = s.aborted;
  return result;
}

}  // namespace six
