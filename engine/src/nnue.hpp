#pragma once
// NNUE-style pattern evaluation distilled from the MCTS network, cheap enough for alpha-beta leaves.
//
// A cell's line code on an axis is the base-3 pattern (empty/own/other) of the 5 cells on each side,
// digit i for offset i - 5 (i < 5) or i - 4 (i >= 5). A code and its reverse share a table row, and
// one table serves all three axes. Each cell adds row(own state, code) minus the all-empty row, so
// empty space far from stones contributes nothing. A stone changes one digit of 30 codes plus its own cell.
#include <array>
#include <cstdint>
#include <string>
#include <vector>

#include "board.hpp"

namespace six::nnue {

constexpr int kReach = 5;
constexpr int kLineCells = 2 * kReach;
constexpr int kCodes = 59049;  // 3^10
// Codes up to reversal: (3^10 + 3^5) / 2.
constexpr int kCanonical = (kCodes + 243) / 2;
// Empty, viewer's stone, other side's stone.
constexpr int kCenters = 3;
constexpr int kMaxDim = 128;

int lineCode(const Board& board, Hex cell, int axis, Player viewer);
// Dense index of a code's reversal class, in [0, kCanonical).
int canonicalIndex(int code);
int reversed(int code);

// Per-cell mode scales the pooled clipped features by this before the value MLP.
constexpr float kPoolScale = 1.0f / 32.0f;

struct Weights {
  int dim = 32;     // accumulator channels
  // v2 (per-cell): crelu(cell rows + bias0) per cell, then pooled. v1: crelu(sum of all rows + bias0).
  bool percell = false;
  int hidden = 32;  // value MLP width
  // [kCenters][kCanonical][dim]
  std::vector<float> table;
  std::vector<float> bias0;        // [dim], added to each viewer's accumulator before the clipped ReLU
  std::vector<float> w1;           // [hidden][2 * dim + 1]: both viewers (side to move first) and the stage
  std::vector<float> b1;           // [hidden]
  std::vector<float> w2;           // [hidden]
  float b2 = 0.0f;
  std::vector<float> policyWeight;  // [dim], applied to an empty cell's features from the mover's view
  float policyBias = 0.0f;

  static Weights random(std::uint32_t seed, int dim = 8, int hidden = 8, bool percell = false);
  // Format written by trainer/nnue_train.py.
  static Weights load(const std::string& path);

  const float* row(int center, int canonical) const {
    return table.data() + (static_cast<std::size_t>(center) * kCanonical + static_cast<std::size_t>(canonical)) * static_cast<std::size_t>(dim);
  }
};

class Accumulator {
 public:
  explicit Accumulator(const Weights& weights);

  void reset(const Board& board);
  void placed(const Board& board, Hex cell);
  // Call before board.undo(), while the stone is still on the board.
  void removing(const Board& board, Hex cell);

  const float* sum(Player viewer) const { return sums_[viewer == Player::X ? 0 : 1].data(); }

  float value(const Board& board) const;
  float policy(const Board& board, Hex cell) const;

  // Maintains every cell's move score incrementally for move ordering. About 17 MB; takes effect
  // at the next reset().
  void enablePolicyCache();

 private:
  void apply(const Board& board, Hex cell, float sign);
  void applyPerCell(const Board& board, Hex cell, float sign);
  void shiftCell(int index, int v, const float* delta, float sign);
  // Recounts if an update was skipped because the board window moved.
  void refresh(const Board& board) const;
  void addCell(const Board& board, Hex cell, Player viewer, float sign, std::vector<float>& into) const;
  float directPolicy(const Board& board, Hex cell, Player viewer) const;
  float scoreOf(const float* feature) const;
  void touch(int index);

  const Weights& w_;
  std::array<std::vector<float>, 2> sums_;

  // Policy cache by dense board index: each viewer's empty-cell features and score.
  bool cacheWanted_ = false;
  mutable bool pendingReset_ = false;
  bool cacheValid_ = false;
  Hex cacheOrigin_{};
  std::uint32_t epoch_ = 0;
  std::vector<std::uint32_t> stamp_;
  std::array<std::vector<float>, 2> feature_;
  std::array<std::vector<float>, 2> score_;
};

}  // namespace six::nnue
