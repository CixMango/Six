#pragma once
// Network input planes; must match trainer/planes.py (checked against fixtures).
#include <vector>

#include "board.hpp"

namespace six {

constexpr int kCrop = 25;
constexpr int kCropHalf = kCrop / 2;
constexpr int kCropCells = kCrop * kCrop;
constexpr int kPlaneCount = 8;  // ones, own, opponent, legal, first stone, opponent's last turn, second-stone flag, radius-9 flag
constexpr int kRecentStones = 4;

// floor(mean + 1/2) of the last kRecentStones stones on each axis, (0, 0) on an empty board.
Hex cropCenter(const std::vector<Hex>& moves);

// Row from r, column from q; -1 outside the crop.
int cropIndex(Hex cell, Hex center);

Hex cropCell(int index, Hex center);

// Returns the crop centre. The board must not be in search mode and must have no winner.
Hex fillPlanes(const Board& board, float* out);

}  // namespace six
