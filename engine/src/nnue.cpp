#include "nnue.hpp"

#include <algorithm>
#include <cmath>
#include <cstring>
#include <fstream>
#include <random>
#include <stdexcept>

namespace six::nnue {
namespace {

constexpr std::array<int, kLineCells + 1> makePowers() {
  std::array<int, kLineCells + 1> p{};
  p[0] = 1;
  for (int i = 1; i <= kLineCells; ++i) p[static_cast<std::size_t>(i)] = p[static_cast<std::size_t>(i) - 1] * 3;
  return p;
}
constexpr auto kPow = makePowers();

/** Signed step of line digit i from the cell: -5..-1, then 1..5. */
constexpr int offsetOf(int digit) { return digit < kReach ? digit - kReach : digit - kReach + 1; }
/** Digit for a signed step (non-zero, |step| <= 5). */
constexpr int digitOf(int step) { return step < 0 ? step + kReach : step + kReach - 1; }

struct Tables {
  std::vector<int> reversed;
  std::vector<int> canonical;
  std::vector<int> swapped;  // the other viewer's code: every 1 digit becomes 2 and the other way round
  Tables() : reversed(kCodes), canonical(kCodes, -1), swapped(kCodes) {
    for (int code = 0; code < kCodes; ++code) {
      int rest = code;
      int out = 0;
      for (int i = 0; i < kLineCells; ++i, rest /= 3) {
        const int digit = rest % 3;
        out += (digit == 0 ? 0 : 3 - digit) * kPow[static_cast<std::size_t>(i)];
      }
      swapped[static_cast<std::size_t>(code)] = out;
    }
    for (int code = 0; code < kCodes; ++code) {
      int rest = code;
      int back = 0;
      for (int i = 0; i < kLineCells; ++i, rest /= 3) back += (rest % 3) * kPow[static_cast<std::size_t>(kLineCells - 1 - i)];
      reversed[static_cast<std::size_t>(code)] = back;
    }
    int next = 0;
    for (int code = 0; code < kCodes; ++code) {
      const int twin = reversed[static_cast<std::size_t>(code)];
      if (twin < code) canonical[static_cast<std::size_t>(code)] = canonical[static_cast<std::size_t>(twin)];
      else canonical[static_cast<std::size_t>(code)] = next++;
    }
  }
};

const Tables& tables() {
  static const Tables t;
  return t;
}

int stateFor(Player stone, Player viewer) {
  if (stone == Player::None) return 0;
  return stone == viewer ? 1 : 2;
}

float crelu(float x) { return std::clamp(x, 0.0f, 1.0f); }

}  // namespace

int reversed(int code) { return tables().reversed[static_cast<std::size_t>(code)]; }
int canonicalIndex(int code) { return tables().canonical[static_cast<std::size_t>(code)]; }

int lineCode(const Board& board, Hex cell, int axis, Player viewer) {
  // Fast path by dense index: the board keeps every stone 32 cells inside its window, so the cells a search asks
  // about (within a few steps of a stone) have their whole line inside it.
  const int index = board.cellIndex(cell);
  const int lq = index / Board::kSize;
  const int lr = index % Board::kSize;
  if (index >= 0 && lq >= kReach && lq < Board::kSize - kReach && lr >= kReach && lr < Board::kSize - kReach &&
      board.cellAt(index) == cell) {
    const int step = Board::kAxisStep[static_cast<std::size_t>(axis)];
    int code = 0;
    for (int i = 0; i < kLineCells; ++i) {
      code += stateFor(board.atIndex(index + offsetOf(i) * step), viewer) * kPow[static_cast<std::size_t>(i)];
    }
    return code;
  }
  const Hex d = kAxes[static_cast<std::size_t>(axis)];
  int code = 0;
  for (int i = 0; i < kLineCells; ++i) {
    const int step = offsetOf(i);
    code += stateFor(board.at({cell.q + d.q * step, cell.r + d.r * step}), viewer) * kPow[static_cast<std::size_t>(i)];
  }
  return code;
}

Weights Weights::random(std::uint32_t seed, int dim, int hidden, bool percell) {
  Weights w;
  w.percell = percell;
  w.dim = dim;
  w.hidden = hidden;
  std::mt19937 rng(seed);
  std::normal_distribution<float> n(0.0f, 0.1f);
  auto fill = [&](std::vector<float>& v, std::size_t size) {
    v.resize(size);
    for (float& x : v) x = n(rng);
  };
  fill(w.table, static_cast<std::size_t>(kCenters) * kCanonical * static_cast<std::size_t>(dim));
  fill(w.bias0, static_cast<std::size_t>(dim));
  for (float& x : w.bias0) x += 0.5f;  // keep the clipped ReLU in its sloped part
  fill(w.w1, static_cast<std::size_t>(hidden) * static_cast<std::size_t>(2 * dim + 1));
  fill(w.b1, static_cast<std::size_t>(hidden));
  fill(w.w2, static_cast<std::size_t>(hidden));
  w.b2 = n(rng);
  fill(w.policyWeight, static_cast<std::size_t>(dim));
  w.policyBias = n(rng);
  return w;
}

Weights Weights::load(const std::string& path) {
  std::ifstream in(path, std::ios::binary);
  if (!in) throw std::runtime_error("cannot open NNUE weights: " + path);
  char magic[8] = {};
  in.read(magic, 8);
  const bool v1 = std::memcmp(magic, "SIXNNUE1", 8) == 0;
  const bool v2 = std::memcmp(magic, "SIXNNUE2", 8) == 0;
  if (!v1 && !v2) throw std::runtime_error("not a Six NNUE weights file: " + path);
  std::int32_t header[3] = {};
  in.read(reinterpret_cast<char*>(header), sizeof header);
  if (header[0] != kCanonical) throw std::runtime_error("NNUE weights were made for another pattern table");
  if (header[1] < 1 || header[1] > kMaxDim || header[2] < 1) throw std::runtime_error("NNUE weights have an unsupported size");
  Weights w;
  w.percell = v2;
  w.dim = header[1];
  w.hidden = header[2];
  auto read = [&](std::vector<float>& v, std::size_t size) {
    v.resize(size);
    in.read(reinterpret_cast<char*>(v.data()), static_cast<std::streamsize>(size * sizeof(float)));
  };
  const auto dim = static_cast<std::size_t>(w.dim);
  const auto hidden = static_cast<std::size_t>(w.hidden);
  read(w.table, static_cast<std::size_t>(kCenters) * kCanonical * dim);
  read(w.bias0, dim);
  read(w.w1, hidden * (2 * dim + 1));
  read(w.b1, hidden);
  read(w.w2, hidden);
  in.read(reinterpret_cast<char*>(&w.b2), sizeof w.b2);
  read(w.policyWeight, dim);
  in.read(reinterpret_cast<char*>(&w.policyBias), sizeof w.policyBias);
  if (!in) throw std::runtime_error("NNUE weights file is truncated: " + path);
  return w;
}

Accumulator::Accumulator(const Weights& weights) : w_(weights) {
  for (auto& s : sums_) s.assign(static_cast<std::size_t>(w_.dim), 0.0f);
}

void Accumulator::addCell(const Board& board, Hex cell, Player viewer, float sign, std::vector<float>& into) const {
  const int center = stateFor(board.at(cell), viewer);
  const float* empty = w_.row(0, canonicalIndex(0));
  for (int axis = 0; axis < 3; ++axis) {
    const float* row = w_.row(center, canonicalIndex(lineCode(board, cell, axis, viewer)));
    for (int k = 0; k < w_.dim; ++k) into[static_cast<std::size_t>(k)] += sign * (row[k] - empty[k]);
  }
}

void Accumulator::reset(const Board& board) {
  for (auto& s : sums_) std::fill(s.begin(), s.end(), 0.0f);
  pendingReset_ = false;
  // Only cells on a line within 5 steps of some stone, or holding one, differ from the empty baseline.
  std::vector<Hex> cells;
  for (const Hex s : board.moves()) {
    cells.push_back(s);
    for (int axis = 0; axis < 3; ++axis) {
      const Hex d = kAxes[static_cast<std::size_t>(axis)];
      for (int step = -kReach; step <= kReach; ++step) {
        if (step != 0) cells.push_back({s.q + d.q * step, s.r + d.r * step});
      }
    }
  }
  std::sort(cells.begin(), cells.end(), [](Hex a, Hex b) { return a.q != b.q ? a.q < b.q : a.r < b.r; });
  cells.erase(std::unique(cells.begin(), cells.end()), cells.end());
  if (w_.percell && !cacheWanted_) {
    // A one-off count (no incremental state): each cell's features through the clipped ReLU into the sums.
    const float* empty = w_.row(0, canonicalIndex(0));
    std::array<float, kMaxDim> f{};
    for (const Hex c : cells) {
      for (int v = 0; v < 2; ++v) {
        const Player viewer = v == 0 ? Player::X : Player::O;
        const int center = stateFor(board.at(c), viewer);
        std::fill(f.begin(), f.end(), 0.0f);
        for (int axis = 0; axis < 3; ++axis) {
          const float* row = w_.row(center, canonicalIndex(lineCode(board, c, axis, viewer)));
          for (int k = 0; k < w_.dim; ++k) f[static_cast<std::size_t>(k)] += row[k];
        }
        float* sum = sums_[static_cast<std::size_t>(v)].data();
        for (int k = 0; k < w_.dim; ++k) {
          const float bias = w_.bias0[static_cast<std::size_t>(k)];
          sum[k] += crelu(f[static_cast<std::size_t>(k)] + bias) - crelu(3.0f * empty[k] + bias);
        }
      }
    }
    cacheValid_ = false;  // any update later means a recount at the next evaluation
    return;
  }
  if (w_.percell) {
    // Incremental state: every touched cell's features (rows for its own state), each through the clipped ReLU.
    if (stamp_.empty()) {
      stamp_.assign(static_cast<std::size_t>(Board::kCells), 0u);
      for (int v = 0; v < 2; ++v) {
        feature_[static_cast<std::size_t>(v)].assign(static_cast<std::size_t>(Board::kCells) * static_cast<std::size_t>(w_.dim), 0.0f);
        score_[static_cast<std::size_t>(v)].assign(static_cast<std::size_t>(Board::kCells), 0.0f);
      }
    }
    if (++epoch_ == 0) {
      std::fill(stamp_.begin(), stamp_.end(), 0u);
      epoch_ = 1;
    }
    cacheOrigin_ = board.windowOrigin();
    cacheValid_ = true;
    std::array<float, kMaxDim> delta{};
    const float* empty = w_.row(0, canonicalIndex(0));
    for (const Hex c : cells) {
      const int index = board.cellIndex(c);
      if (index < 0 || index >= Board::kCells || board.cellAt(index) != c) {
        throw std::runtime_error("NNUE: a cell near the stones is outside the board window");
      }
      touch(index);  // starts at the all-empty features, whose share of the sums is zero
      for (int v = 0; v < 2; ++v) {
        const Player viewer = v == 0 ? Player::X : Player::O;
        const int center = stateFor(board.at(c), viewer);
        for (int k = 0; k < w_.dim; ++k) delta[static_cast<std::size_t>(k)] = -3.0f * empty[k];
        for (int axis = 0; axis < 3; ++axis) {
          const float* row = w_.row(center, canonicalIndex(lineCode(board, c, axis, viewer)));
          for (int k = 0; k < w_.dim; ++k) delta[static_cast<std::size_t>(k)] += row[k];
        }
        shiftCell(index, v, delta.data(), +1.0f);
      }
    }
    return;
  }
  for (const Hex c : cells) {
    addCell(board, c, Player::X, +1.0f, sums_[0]);
    addCell(board, c, Player::O, +1.0f, sums_[1]);
  }
  cacheValid_ = false;
  if (!cacheWanted_) return;
  if (stamp_.empty()) {
    stamp_.assign(static_cast<std::size_t>(Board::kCells), 0u);
    for (int v = 0; v < 2; ++v) {
      feature_[static_cast<std::size_t>(v)].assign(static_cast<std::size_t>(Board::kCells) * static_cast<std::size_t>(w_.dim), 0.0f);
      score_[static_cast<std::size_t>(v)].assign(static_cast<std::size_t>(Board::kCells), 0.0f);
    }
  }
  if (++epoch_ == 0) {
    std::fill(stamp_.begin(), stamp_.end(), 0u);
    epoch_ = 1;
  }
  cacheOrigin_ = board.windowOrigin();
  cacheValid_ = true;
  for (const Hex c : cells) {
    const int index = board.cellIndex(c);
    if (index < 0 || index >= Board::kCells || board.cellAt(index) != c) {
      cacheValid_ = false;  // off the board window: the scores are computed directly instead
      return;
    }
    stamp_[static_cast<std::size_t>(index)] = epoch_;
    for (int v = 0; v < 2; ++v) {
      const Player viewer = v == 0 ? Player::X : Player::O;
      float* f = feature_[static_cast<std::size_t>(v)].data() + static_cast<std::size_t>(index) * static_cast<std::size_t>(w_.dim);
      std::fill(f, f + w_.dim, 0.0f);
      for (int axis = 0; axis < 3; ++axis) {
        const float* row = w_.row(0, canonicalIndex(lineCode(board, c, axis, viewer)));
        for (int k = 0; k < w_.dim; ++k) f[k] += row[k];
      }
      score_[static_cast<std::size_t>(v)][static_cast<std::size_t>(index)] = scoreOf(f);
    }
  }
}

void Accumulator::enablePolicyCache() { cacheWanted_ = true; }

float Accumulator::scoreOf(const float* feature) const {
  float score = w_.policyBias;
  for (int k = 0; k < w_.dim; ++k) {
    score += w_.policyWeight[static_cast<std::size_t>(k)] * crelu(feature[k] + w_.bias0[static_cast<std::size_t>(k)]);
  }
  return score;
}

void Accumulator::touch(int index) {
  if (stamp_[static_cast<std::size_t>(index)] == epoch_) return;
  stamp_[static_cast<std::size_t>(index)] = epoch_;
  const float* empty = w_.row(0, canonicalIndex(0));
  for (int v = 0; v < 2; ++v) {
    float* f = feature_[static_cast<std::size_t>(v)].data() + static_cast<std::size_t>(index) * static_cast<std::size_t>(w_.dim);
    for (int k = 0; k < w_.dim; ++k) f[k] = 3.0f * empty[k];
    score_[static_cast<std::size_t>(v)][static_cast<std::size_t>(index)] = scoreOf(f);
  }
}

void Accumulator::shiftCell(int index, int v, const float* delta, float sign) {
  float* f = feature_[static_cast<std::size_t>(v)].data() + static_cast<std::size_t>(index) * static_cast<std::size_t>(w_.dim);
  float* sum = sums_[static_cast<std::size_t>(v)].data();
  for (int k = 0; k < w_.dim; ++k) {
    const float bias = w_.bias0[static_cast<std::size_t>(k)];
    const float before = crelu(f[k] + bias);
    f[k] += sign * delta[k];
    sum[k] += crelu(f[k] + bias) - before;
  }
  score_[static_cast<std::size_t>(v)][static_cast<std::size_t>(index)] = scoreOf(f);
}

void Accumulator::refresh(const Board& board) const {
  if (pendingReset_) const_cast<Accumulator*>(this)->reset(board);
}

void Accumulator::applyPerCell(const Board& board, Hex cell, float sign) {
  if (pendingReset_ || !cacheValid_ || board.windowOrigin() != cacheOrigin_) {
    pendingReset_ = true;  // recount from the board when next asked
    return;
  }
  const auto& t = tables();
  const int dim = w_.dim;
  const int stoneX = stateFor(board.at(cell), Player::X);
  const int stoneStates[2] = {stoneX, stoneX == 0 ? 0 : 3 - stoneX};
  const int stoneIndex = board.cellIndex(cell);
  touch(stoneIndex);
  std::array<float, kMaxDim> delta{};
  for (int axis = 0; axis < 3; ++axis) {
    const Hex d = kAxes[static_cast<std::size_t>(axis)];
    // The stone's own cell: its rows change from the empty state to the stone's, with the same line codes.
    const int ownX = lineCode(board, cell, axis, Player::X);
    for (int v = 0; v < 2; ++v) {
      const int own = canonicalIndex(v == 0 ? ownX : t.swapped[static_cast<std::size_t>(ownX)]);
      const float* before = w_.row(0, own);
      const float* after = w_.row(stoneStates[v], own);
      for (int k = 0; k < dim; ++k) delta[static_cast<std::size_t>(k)] = after[k] - before[k];
      shiftCell(stoneIndex, v, delta.data(), sign);
    }
    for (int step = -kReach; step <= kReach; ++step) {
      if (step == 0) continue;
      const Hex c{cell.q + d.q * step, cell.r + d.r * step};
      const int index = board.cellIndex(c);
      if (index < 0 || index >= Board::kCells || board.cellAt(index) != c) {
        pendingReset_ = true;
        return;
      }
      touch(index);
      const int withX = lineCode(board, c, axis, Player::X);
      const int centerX = stateFor(board.at(c), Player::X);
      const int weight = kPow[static_cast<std::size_t>(digitOf(-step))];
      for (int v = 0; v < 2; ++v) {
        const int with = v == 0 ? withX : t.swapped[static_cast<std::size_t>(withX)];
        const int without = with - stoneStates[v] * weight;
        const int center = v == 0 ? centerX : (centerX == 0 ? 0 : 3 - centerX);
        const float* rowWith = w_.row(center, canonicalIndex(with));
        const float* rowWithout = w_.row(center, canonicalIndex(without));
        for (int k = 0; k < dim; ++k) delta[static_cast<std::size_t>(k)] = rowWith[k] - rowWithout[k];
        shiftCell(index, v, delta.data(), sign);
      }
    }
  }
}

void Accumulator::apply(const Board& board, Hex cell, float sign) {
  if (w_.percell) {
    applyPerCell(board, cell, sign);
    return;
  }
  // `board` holds the stone at `cell`. Every cell that stone touches loses what it contributed without it and gains
  // what it contributes with it (sign +1), or the other way round (sign -1). Each line is read once, from X's view;
  // O's view is the same code with the colours swapped.
  const auto& t = tables();
  const int dim = w_.dim;
  const int stoneX = stateFor(board.at(cell), Player::X);
  const int stoneStates[2] = {stoneX, stoneX == 0 ? 0 : 3 - stoneX};
  if (cacheValid_ && board.windowOrigin() != cacheOrigin_) cacheValid_ = false;  // renumbered: stop using it
  for (int axis = 0; axis < 3; ++axis) {
    const Hex d = kAxes[static_cast<std::size_t>(axis)];
    // The stone's own cell: from empty to the stone's state, with the same line codes.
    const int ownX = lineCode(board, cell, axis, Player::X);
    for (int v = 0; v < 2; ++v) {
      const int own = canonicalIndex(v == 0 ? ownX : t.swapped[static_cast<std::size_t>(ownX)]);
      const float* before = w_.row(0, own);
      const float* after = w_.row(stoneStates[v], own);
      float* sum = sums_[static_cast<std::size_t>(v)].data();
      for (int k = 0; k < dim; ++k) sum[k] += sign * (after[k] - before[k]);
    }
    // The ten cells on this line: one digit of this axis's code changes.
    for (int step = -kReach; step <= kReach; ++step) {
      if (step == 0) continue;
      const Hex c{cell.q + d.q * step, cell.r + d.r * step};
      const int withX = lineCode(board, c, axis, Player::X);
      const int centerX = stateFor(board.at(c), Player::X);
      const int weight = kPow[static_cast<std::size_t>(digitOf(-step))];
      int index = -1;
      if (cacheValid_) {
        index = board.cellIndex(c);
        if (index < 0 || index >= Board::kCells || board.cellAt(index) != c) {
          cacheValid_ = false;
          index = -1;
        } else {
          touch(index);
        }
      }
      for (int v = 0; v < 2; ++v) {
        const int with = v == 0 ? withX : t.swapped[static_cast<std::size_t>(withX)];
        const int without = with - stoneStates[v] * weight;
        const int center = v == 0 ? centerX : (centerX == 0 ? 0 : 3 - centerX);
        const int cWith = canonicalIndex(with);
        const int cWithout = canonicalIndex(without);
        const float* rowWith = w_.row(center, cWith);
        const float* rowWithout = w_.row(center, cWithout);
        float* sum = sums_[static_cast<std::size_t>(v)].data();
        for (int k = 0; k < dim; ++k) sum[k] += sign * (rowWith[k] - rowWithout[k]);
        if (index >= 0) {
          // The move score reads empty-cell rows: the same rows as above when the cell is empty.
          const float* emptyWith = center == 0 ? rowWith : w_.row(0, cWith);
          const float* emptyWithout = center == 0 ? rowWithout : w_.row(0, cWithout);
          float* f = feature_[static_cast<std::size_t>(v)].data() + static_cast<std::size_t>(index) * static_cast<std::size_t>(dim);
          for (int k = 0; k < dim; ++k) f[k] += sign * (emptyWith[k] - emptyWithout[k]);
          score_[static_cast<std::size_t>(v)][static_cast<std::size_t>(index)] = scoreOf(f);
        }
      }
    }
  }
}

void Accumulator::placed(const Board& board, Hex cell) { apply(board, cell, +1.0f); }
void Accumulator::removing(const Board& board, Hex cell) { apply(board, cell, -1.0f); }

float Accumulator::value(const Board& board) const {
  // Fixed-size scratch: no allocation per evaluation (weights are at most kMaxDim wide).
  refresh(board);
  const Player me = board.current();
  const float* mine = sum(me);
  const float* theirs = sum(other(me));
  const int dim = w_.dim;
  const int inputs = 2 * dim + 1;
  std::array<float, 2 * kMaxDim + 1> in{};
  for (int k = 0; k < dim; ++k) {
    if (w_.percell) {
      in[static_cast<std::size_t>(k)] = mine[k] * kPoolScale;
      in[static_cast<std::size_t>(dim + k)] = theirs[k] * kPoolScale;
    } else {
      in[static_cast<std::size_t>(k)] = crelu(mine[k] + w_.bias0[static_cast<std::size_t>(k)]);
      in[static_cast<std::size_t>(dim + k)] = crelu(theirs[k] + w_.bias0[static_cast<std::size_t>(k)]);
    }
  }
  in[static_cast<std::size_t>(2 * dim)] = board.stonesLeft() == 2 ? 1.0f : 0.0f;
  float out = w_.b2;
  for (int h = 0; h < w_.hidden; ++h) {
    const float* row = w_.w1.data() + static_cast<std::size_t>(h) * static_cast<std::size_t>(inputs);
    float x = w_.b1[static_cast<std::size_t>(h)];
    for (int k = 0; k < inputs; ++k) x += row[k] * in[static_cast<std::size_t>(k)];
    out += w_.w2[static_cast<std::size_t>(h)] * crelu(x);
  }
  return std::tanh(out);
}

float Accumulator::policy(const Board& board, Hex cell) const {
  refresh(board);
  const Player me = board.current();
  if (cacheValid_ && board.windowOrigin() == cacheOrigin_) {
    const int index = board.cellIndex(cell);
    if (index >= 0 && index < Board::kCells && board.cellAt(index) == cell) {
      if (stamp_[static_cast<std::size_t>(index)] == epoch_) return score_[me == Player::X ? 0 : 1][static_cast<std::size_t>(index)];
      return directPolicy(board, cell, me);  // untouched: far from every stone
    }
  }
  return directPolicy(board, cell, me);
}

float Accumulator::directPolicy(const Board& board, Hex cell, Player viewer) const {
  const int dim = w_.dim;
  std::array<float, kMaxDim> feature{};
  for (int axis = 0; axis < 3; ++axis) {
    const float* row = w_.row(0, canonicalIndex(lineCode(board, cell, axis, viewer)));
    for (int k = 0; k < dim; ++k) feature[static_cast<std::size_t>(k)] += row[k];
  }
  return scoreOf(feature.data());
}

}  // namespace six::nnue
