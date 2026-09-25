#pragma once
// Exact one-turn tactics built on the line windows.
#include <vector>

#include "board.hpp"

namespace six {

struct Window {
  Hex start;
  int axis = 0;
  int x = 0;
  int o = 0;
  int count(Player p) const { return p == Player::X ? x : o; }
  Hex cell(int i) const { return {start.q + kAxes[axis].q * i, start.r + kAxes[axis].r * i}; }
};

std::vector<Window> activeWindows(const Board& board);

// Four or more of p's stones and none of the opponent's.
std::vector<Window> threatWindows(const Board& board, Player p);

// Brute-force reference for tests.
std::vector<Window> scanThreatWindows(const Board& board, Player p);

// Distinct sets of at most `stones` empty cells that complete six for p.
int countWinningSets(const Board& board, Player p, int stones);

// Fewest stones hitting every window in `threats`, or budget + 1 if more are needed.
int minCover(const Board& board, const std::vector<Window>& threats, int budget);

}  // namespace six
