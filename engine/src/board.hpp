#pragma once
// Six on an unbounded hex board, with incremental window counts, Zobrist hashing and undo.
#include <algorithm>
#include <array>
#include <cstdint>
#include <vector>

namespace six {

enum class Player : std::uint8_t { None = 0, X = 1, O = 2 };

constexpr Player other(Player p) { return p == Player::X ? Player::O : Player::X; }
constexpr char toChar(Player p) { return p == Player::X ? 'X' : p == Player::O ? 'O' : '-'; }

// Axial coordinates, pointy-top.
struct Hex {
  int q = 0;
  int r = 0;
  friend constexpr bool operator==(Hex, Hex) = default;
};

constexpr int kWinLength = 6;
constexpr std::array<Hex, 3> kAxes{{{1, 0}, {0, 1}, {1, -1}}};

constexpr int hexDistance(Hex a, Hex b) {
  const int dq = a.q - b.q;
  const int dr = a.r - b.r;
  const int ds = dq + dr;
  const int aq = dq < 0 ? -dq : dq;
  const int ar = dr < 0 ? -dr : dr;
  const int as = ds < 0 ? -ds : ds;
  return aq > ar ? (aq > as ? aq : as) : (ar > as ? ar : as);
}

// X opens with one stone, then each side places two per turn.
constexpr int turnForStone(int i) { return i == 0 ? 1 : (i - 1) / 2 + 2; }
constexpr Player playerForStone(int i) { return turnForStone(i) % 2 == 1 ? Player::X : Player::O; }
constexpr int stonesLeftBefore(int i) { return i == 0 ? 1 : ((i - 1) % 2 == 0 ? 2 : 1); }

enum class PlaceError : std::uint8_t { None, GameOver, Occupied, OutOfRange };

class Board {
 public:
  // Dense window of cells kept in memory; it recenters as play drifts.
  static constexpr int kSize = 256;
  static constexpr int kCells = kSize * kSize;

  explicit Board(int radius = 8);

  // Skips playable-area upkeep: placement only checks the cell is empty, so callers must stay
  // within radius of a stone. Playable-area queries are meaningless in this mode.
  void setSearchMode(bool on) { searchMode_ = on; }

  int radius() const { return radius_; }
  int stones() const { return static_cast<int>(moves_.size()); }
  const std::vector<Hex>& moves() const { return moves_; }
  Player winner() const { return winner_; }

  // Frozen at the winner once the game ends.
  Player current() const;
  int turn() const;
  int stonesLeft() const;

  Player at(Hex h) const;
  bool isPlayable(Hex h) const;
  PlaceError canPlace(Hex h) const;
  PlaceError place(Hex h);
  void undo();

  // Stones plus side to move and stones left in the turn.
  std::uint64_t hash() const;

  // Stones of p in the six-cell window starting at `start` along kAxes[axis].
  int windowCount(int axis, Hex start, Player p) const;

  // Unchecked access for search. Valid for cells within a few steps of a stone, since stones
  // keep kRecenterMargin cells from the window edge.
  int cellIndex(Hex h) const { return indexOf(h); }
  static constexpr std::array<int, 3> kAxisStep{kSize, 1, kSize - 1};
  // X count in the low nibble, O in the high.
  std::uint8_t packedWindow(int axis, int startIndex) const { return windows_[static_cast<std::size_t>(axis)][static_cast<std::size_t>(startIndex)]; }
  Player atIndex(int index) const { return cells_[static_cast<std::size_t>(index)]; }
  Hex cellAt(int index) const { return hexAt(index); }
  // Changes on recenter, which renumbers every cell index.
  Hex windowOrigin() const { return {originQ_, originR_}; }

  // Threat: a window p could finish this turn (4+ of p's stones, none of the opponent's).
  int threatCount(Player p) const { return static_cast<int>(threats_[slot(p)].size()); }

  template <class F>
  void forEachThreat(Player p, F&& f) const {
    for (const std::int32_t id : threats_[slot(p)]) f(id / kCells, hexAt(id % kCells));
  }

  // Windows holding exactly k of p's stones (1..6) and none of the opponent's. Threes and twos
  // below use the same definition.
  int aliveWindows(Player p, int k) const { return alive_[slot(p)][k]; }

  int threeCount(Player p) const { return static_cast<int>(threes_[slot(p)].size()); }

  template <class F>
  void forEachThree(Player p, F&& f) const {
    for (const std::int32_t id : threes_[slot(p)]) f(id / kCells, hexAt(id % kCells));
  }

  int twoCount(Player p) const { return static_cast<int>(twos_[slot(p)].size()); }

  template <class F>
  void forEachTwoIndex(Player p, F&& f) const {
    for (const std::int32_t id : twos_[slot(p)]) f(id / kCells, id % kCells);
  }

  template <class F>
  void forEachThreeIndex(Player p, F&& f) const {
    for (const std::int32_t id : threes_[slot(p)]) f(id / kCells, id % kCells);
  }

  template <class F>
  void forEachThreatIndex(Player p, F&& f) const {
    for (const std::int32_t id : threats_[slot(p)]) f(id / kCells, id % kCells);
  }

  int playableCount() const;

  template <class F>
  void forEachNearEmpty(int distance, F&& f) const {
    if (++stampEpoch_ == 0) {
      std::fill(stamp_.begin(), stamp_.end(), 0u);
      stampEpoch_ = 1;
    }
    for (const Hex& s : moves_) {
      for (int dq = -distance; dq <= distance; ++dq) {
        const int lo = -distance > -dq - distance ? -distance : -dq - distance;
        const int hi = distance < -dq + distance ? distance : -dq + distance;
        for (int dr = lo; dr <= hi; ++dr) {
          const Hex c{s.q + dq, s.r + dr};
          const int idx = indexOf(c);
          if (stamp_[idx] == stampEpoch_) continue;
          stamp_[idx] = stampEpoch_;
          if (cells_[idx] == Player::None && (searchMode_ || coverage_[idx] > 0)) f(c);
        }
      }
    }
  }

  template <class F>
  void forEachPlayable(F&& f) const {
    if (moves_.empty()) {
      for (int dq = -radius_; dq <= radius_; ++dq) {
        const int lo = -radius_ > -dq - radius_ ? -radius_ : -dq - radius_;
        const int hi = radius_ < -dq + radius_ ? radius_ : -dq + radius_;
        for (int dr = lo; dr <= hi; ++dr) f(Hex{dq, dr});
      }
      return;
    }
    for (const std::int32_t idx : lit_) {
      if (cells_[idx] == Player::None) f(hexAt(idx));
    }
  }

 private:
  static constexpr int slot(Player p) { return p == Player::X ? 0 : 1; }
  int indexOf(Hex h) const { return (h.q - originQ_ + kSize / 2) * kSize + (h.r - originR_ + kSize / 2); }
  Hex hexAt(int idx) const { return {idx / kSize - kSize / 2 + originQ_, idx % kSize - kSize / 2 + originR_}; }
  bool insideWindow(Hex h, int margin) const;
  bool fitsWindow(Hex incoming) const;
  void apply(Hex h, Player p, int sign);
  void updateWindow(int windowId, std::uint8_t before, std::uint8_t after);
  static void toggleMembership(std::vector<std::int32_t>& list, std::vector<std::int16_t>& pos, int windowId, bool add);
  void rebuildAround(Hex center);

  int radius_;
  bool searchMode_ = false;
  int originQ_ = 0;
  int originR_ = 0;
  Player winner_ = Player::None;
  std::uint64_t stoneHash_ = 0;
  std::vector<Hex> moves_;
  std::vector<Player> cells_;
  std::vector<std::uint16_t> coverage_;
  // Cells with coverage > 0, and each cell's slot in that list (-1 if absent).
  std::vector<std::int32_t> lit_;
  std::vector<std::int32_t> litPos_;
  std::array<std::vector<std::uint8_t>, 3> windows_;
  // Window ids are axis * kCells + start index; *Pos_ holds each id's slot for O(1) removal.
  std::array<std::vector<std::int32_t>, 2> threats_;
  std::array<std::vector<std::int16_t>, 2> threatPos_;
  std::array<std::vector<std::int32_t>, 2> threes_;
  std::array<std::vector<std::int16_t>, 2> threePos_;
  std::array<std::vector<std::int32_t>, 2> twos_;
  std::array<std::vector<std::int16_t>, 2> twoPos_;
  std::array<std::array<int, 7>, 2> alive_{};
  // Epoch stamps for de-duplicating cell visits.
  mutable std::vector<std::uint32_t> stamp_;
  mutable std::uint32_t stampEpoch_ = 0;
};

}  // namespace six
