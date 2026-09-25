#pragma once
// Strictly forcing threat-space search. Every attacking turn needs both defender stones to block,
// so the defender never gets a free stone and every win found is sound.
#include <chrono>
#include <cstdint>
#include <utility>
#include <vector>

#include "board.hpp"

namespace six {

// A two-stone turn and the fewest stones that block the fours it makes (3 means more than two).
struct ThreatTurn {
  Hex a;
  Hex b;
  int cover = 0;
};

// Turns whose fours need two (cover 2) or more (cover 3) blocking stones, read from window counts.
// Empty unless the mover has two stones left and no window it can already finish.
void doubleThreats(const Board& board, std::vector<ThreatTurn>& out);

// Every pair of cells that blocks all of attacker's threat windows, for threats no single cell blocks.
void coveringPairs(const Board& board, Player attacker, std::vector<std::pair<Hex, Hex>>& out);

struct ThreatWin {
  bool found = false;
  Hex a;                  // first turn of the win
  Hex b;
  int turns = 0;          // attacking turns, the last being the one that can't be blocked
  std::int64_t nodes = 0;
  bool exhausted = false; // stopped at the node budget or the deadline before finishing
};

class ThreatSolver {
 public:
  explicit ThreatSolver(int ttMegabytes = 8);
  ~ThreatSolver();
  ThreatSolver(const ThreatSolver&) = delete;
  ThreatSolver& operator=(const ThreatSolver&) = delete;

  void clear();

  // Iterative deepening up to maxTurns. The mover must have two stones left and neither side may
  // have a threat window. Leaves `board` unchanged.
  ThreatWin solve(Board& board, int maxTurns, std::int64_t nodeBudget,
                  std::chrono::steady_clock::time_point deadline = std::chrono::steady_clock::time_point::max());

 private:
  struct Impl;
  Impl* impl_;
};

}  // namespace six
