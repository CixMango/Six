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
// `wide` makes the list complete for turns whose stones both join a live window of the mover's: every pair of
// cells finishing threes, and every free second stone (one no four uses) beside a stone whose fours need two
// blockers. The default keeps the engine's shorter list: 48 three cells and 4 free stones at most.
void doubleThreats(const Board& board, std::vector<ThreatTurn>& out, bool wide = false);

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

  // Searches with the complete turn list (see doubleThreats). Slower; the shape tools use it, the engine doesn't.
  void setWide(bool on);

  // A proven double-threat win as a tree: the owner's turn, then one branch per block the defender can make.
  struct Proof {
    Hex a;
    Hex b;
    bool last = false;  // threats that no two stones block
    std::vector<std::pair<std::pair<Hex, Hex>, Proof>> blocks;
  };

  // For a position the owner wins by double threats: the proof tree, and every cell it depends on (the owner's
  // stones and every cell of every four the defender has to answer). False if no win is found.
  bool proofTree(Board& board, int maxTurns, std::int64_t nodeBudget, Proof& proof, std::vector<Hex>& cells);

  // Checks a proof tree move by move in this position: every block the defender has must be in the tree, no block
  // may give the defender a four, and the last turn must be unblockable. True means the owner wins here.
  static bool replay(Board& board, const Proof& proof);

  // Iterative deepening up to maxTurns. The mover must have two stones left and neither side may
  // have a threat window. Leaves `board` unchanged.
  ThreatWin solve(Board& board, int maxTurns, std::int64_t nodeBudget,
                  std::chrono::steady_clock::time_point deadline = std::chrono::steady_clock::time_point::max());

 private:
  struct Impl;
  Impl* impl_;
};

}  // namespace six
