#include "planes.hpp"

#include <algorithm>

namespace six {
namespace {

int floorDiv(int a, int b) {
  const int q = a / b;
  return (a % b != 0 && ((a < 0) != (b < 0))) ? q - 1 : q;
}

}  // namespace

Hex cropCenter(const std::vector<Hex>& moves) {
  if (moves.empty()) return {0, 0};
  const int n = std::min(static_cast<int>(moves.size()), kRecentStones);
  int sq = 0;
  int sr = 0;
  for (auto it = moves.end() - n; it != moves.end(); ++it) {
    sq += it->q;
    sr += it->r;
  }
  return {floorDiv(2 * sq + n, 2 * n), floorDiv(2 * sr + n, 2 * n)};
}

int cropIndex(Hex cell, Hex center) {
  const int row = cell.r - center.r + kCropHalf;
  const int col = cell.q - center.q + kCropHalf;
  if (row < 0 || row >= kCrop || col < 0 || col >= kCrop) return -1;
  return row * kCrop + col;
}

Hex cropCell(int index, Hex center) {
  return {index % kCrop - kCropHalf + center.q, index / kCrop - kCropHalf + center.r};
}

Hex fillPlanes(const Board& board, float* out) {
  const std::vector<Hex>& moves = board.moves();
  const int n = board.stones();
  const Hex center = cropCenter(moves);
  std::fill(out, out + kPlaneCount * kCropCells, 0.0f);
  const auto plane = [out](int p) { return out + p * kCropCells; };

  std::fill(plane(0), plane(0) + kCropCells, 1.0f);
  const Player mover = playerForStone(n);
  const bool second = n > 0 && stonesLeftBefore(n) == 1;
  for (int i = 0; i < n; ++i) {
    const int index = cropIndex(moves[static_cast<std::size_t>(i)], center);
    if (index >= 0) plane(playerForStone(i) == mover ? 1 : 2)[index] = 1.0f;
  }
  for (int index = 0; index < kCropCells; ++index) {
    if (board.isPlayable(cropCell(index, center))) plane(3)[index] = 1.0f;
  }
  if (second) {
    const int index = cropIndex(moves[static_cast<std::size_t>(n - 1)], center);
    if (index >= 0) plane(4)[index] = 1.0f;
  }
  const int turnStart = second ? n - 1 : n;
  for (int i = turnStart - 2; i < turnStart; ++i) {
    if (i < 0 || playerForStone(i) == mover) continue;
    const int index = cropIndex(moves[static_cast<std::size_t>(i)], center);
    if (index >= 0) plane(5)[index] = 1.0f;
  }
  std::fill(plane(6), plane(6) + kCropCells, second ? 1.0f : 0.0f);
  std::fill(plane(7), plane(7) + kCropCells, board.radius() == 9 ? 1.0f : 0.0f);
  return center;
}

}  // namespace six
