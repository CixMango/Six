#include "board.hpp"

#include <algorithm>
#include <stdexcept>

namespace six {
namespace {

// Stones stay at least this far from the window edge, so every cell a placement touches is inside.
constexpr int kRecenterMargin = 32;

std::uint64_t mix(std::uint64_t z) {
  z += 0x9e3779b97f4a7c15ull;
  z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ull;
  z = (z ^ (z >> 27)) * 0x94d049bb133111ebull;
  return z ^ (z >> 31);
}

// Keyed on game coordinates so hashes survive recentering.
std::uint64_t stoneKey(Hex h, Player p) {
  const auto uq = static_cast<std::uint64_t>(static_cast<std::uint32_t>(h.q));
  const auto ur = static_cast<std::uint64_t>(static_cast<std::uint32_t>(h.r));
  return mix((uq << 33) ^ (ur << 2) ^ static_cast<std::uint64_t>(p));
}

std::uint64_t stageKey(Player current, int stonesLeft) {
  return mix(0x51c0ffee00000000ull ^ (static_cast<std::uint64_t>(current) << 8) ^ static_cast<std::uint64_t>(stonesLeft));
}

constexpr int nibbleShift(Player p) { return p == Player::X ? 0 : 4; }

}  // namespace

Board::Board(int radius)
    : radius_(radius),
      cells_(kCells, Player::None),
      coverage_(kCells, 0),
      litPos_(kCells, -1),
      stamp_(kCells, 0) {
  if (radius < 1 || radius >= kRecenterMargin - kWinLength) throw std::invalid_argument("unsupported radius");
  for (auto& w : windows_) w.assign(kCells, 0);
  for (auto& pos : threatPos_) pos.assign(3 * kCells, -1);
  for (auto& pos : threePos_) pos.assign(3 * kCells, -1);
  for (auto& pos : twoPos_) pos.assign(3 * kCells, -1);
  lit_.reserve(4096);
}

Player Board::current() const {
  return winner_ != Player::None ? winner_ : playerForStone(stones());
}

int Board::turn() const {
  return turnForStone(winner_ != Player::None ? stones() - 1 : stones());
}

int Board::stonesLeft() const {
  return winner_ != Player::None ? stonesLeftBefore(stones() - 1) - 1 : stonesLeftBefore(stones());
}

bool Board::insideWindow(Hex h, int margin) const {
  const int lq = h.q - originQ_ + kSize / 2;
  const int lr = h.r - originR_ + kSize / 2;
  return lq >= margin && lq < kSize - margin && lr >= margin && lr < kSize - margin;
}

Player Board::at(Hex h) const {
  return insideWindow(h, 0) ? cells_[indexOf(h)] : Player::None;
}

bool Board::isPlayable(Hex h) const {
  if (moves_.empty()) return hexDistance(h, Hex{0, 0}) <= radius_;
  if (!insideWindow(h, 0)) return false;
  const int idx = indexOf(h);
  if (cells_[idx] != Player::None || !(searchMode_ || coverage_[idx] > 0)) return false;
  // Near the window's edge, a stone that would spread the game wider than the window can hold is out of reach.
  return insideWindow(h, kRecenterMargin) || fitsWindow(h);
}

bool Board::fitsWindow(Hex incoming) const {
  int minQ = incoming.q;
  int maxQ = incoming.q;
  int minR = incoming.r;
  int maxR = incoming.r;
  for (const Hex& m : moves_) {
    minQ = std::min(minQ, m.q);
    maxQ = std::max(maxQ, m.q);
    minR = std::min(minR, m.r);
    maxR = std::max(maxR, m.r);
  }
  return maxQ - minQ < kSize - 2 * kRecenterMargin && maxR - minR < kSize - 2 * kRecenterMargin;
}

PlaceError Board::canPlace(Hex h) const {
  if (winner_ != Player::None) return PlaceError::GameOver;
  if (at(h) != Player::None) return PlaceError::Occupied;
  if (!isPlayable(h)) return PlaceError::OutOfRange;
  return PlaceError::None;
}

PlaceError Board::place(Hex h) {
  const PlaceError error = canPlace(h);
  if (error != PlaceError::None) return error;
  if (!insideWindow(h, kRecenterMargin)) rebuildAround(h);
  const Player p = current();
  moves_.push_back(h);
  apply(h, p, +1);
  const int shift = nibbleShift(p);
  for (int a = 0; a < 3 && winner_ == Player::None; ++a) {
    for (int k = 0; k < kWinLength; ++k) {
      const Hex start{h.q - kAxes[a].q * k, h.r - kAxes[a].r * k};
      if (((windows_[a][indexOf(start)] >> shift) & 0xF) == kWinLength) {
        winner_ = p;
        break;
      }
    }
  }
  return PlaceError::None;
}

void Board::undo() {
  if (moves_.empty()) return;
  const Hex h = moves_.back();
  const Player p = cells_[indexOf(h)];
  moves_.pop_back();
  apply(h, p, -1);
  winner_ = Player::None;
}

void Board::apply(Hex h, Player p, int sign) {
  const int idx = indexOf(h);
  cells_[idx] = sign > 0 ? p : Player::None;
  stoneHash_ ^= stoneKey(h, p);

  for (int dq = -radius_; dq <= radius_ && !searchMode_; ++dq) {
    const int lo = std::max(-radius_, -dq - radius_);
    const int hi = std::min(radius_, -dq + radius_);
    for (int dr = lo; dr <= hi; ++dr) {
      const int ci = indexOf(Hex{h.q + dq, h.r + dr});
      if (sign > 0) {
        if (coverage_[ci]++ == 0) {
          litPos_[ci] = static_cast<std::int32_t>(lit_.size());
          lit_.push_back(ci);
        }
      } else if (--coverage_[ci] == 0) {
        const std::int32_t pos = litPos_[ci];
        const std::int32_t moved = lit_.back();
        lit_[pos] = moved;
        litPos_[moved] = pos;
        lit_.pop_back();
        litPos_[ci] = -1;
      }
    }
  }

  const std::uint8_t unit = static_cast<std::uint8_t>(1 << nibbleShift(p));
  for (int a = 0; a < 3; ++a) {
    for (int k = 0; k < kWinLength; ++k) {
      const int start = indexOf(Hex{h.q - kAxes[a].q * k, h.r - kAxes[a].r * k});
      auto& packed = windows_[a][start];
      const std::uint8_t before = packed;
      packed = static_cast<std::uint8_t>(sign > 0 ? packed + unit : packed - unit);
      updateWindow(a * kCells + start, before, packed);
    }
  }
}

void Board::updateWindow(int windowId, std::uint8_t before, std::uint8_t after) {
  const int x0 = before & 0xF;
  const int o0 = before >> 4;
  const int x1 = after & 0xF;
  const int o1 = after >> 4;
  if (o0 == 0 && x0 > 0) --alive_[0][x0];
  if (x0 == 0 && o0 > 0) --alive_[1][o0];
  if (o1 == 0 && x1 > 0) ++alive_[0][x1];
  if (x1 == 0 && o1 > 0) ++alive_[1][o1];
  const bool wasThreat[2] = {o0 == 0 && x0 >= kWinLength - 2, x0 == 0 && o0 >= kWinLength - 2};
  const bool isThreat[2] = {o1 == 0 && x1 >= kWinLength - 2, x1 == 0 && o1 >= kWinLength - 2};
  const bool wasThree[2] = {o0 == 0 && x0 == 3, x0 == 0 && o0 == 3};
  const bool isThree[2] = {o1 == 0 && x1 == 3, x1 == 0 && o1 == 3};
  const bool wasTwo[2] = {o0 == 0 && x0 == 2, x0 == 0 && o0 == 2};
  const bool isTwo[2] = {o1 == 0 && x1 == 2, x1 == 0 && o1 == 2};
  for (int s = 0; s < 2; ++s) {
    if (wasThreat[s] != isThreat[s]) toggleMembership(threats_[s], threatPos_[s], windowId, isThreat[s]);
    if (wasThree[s] != isThree[s]) toggleMembership(threes_[s], threePos_[s], windowId, isThree[s]);
    if (wasTwo[s] != isTwo[s]) toggleMembership(twos_[s], twoPos_[s], windowId, isTwo[s]);
  }
}

void Board::toggleMembership(std::vector<std::int32_t>& list, std::vector<std::int16_t>& pos, int windowId, bool add) {
  if (add) {
    // Positions are 16-bit to save memory; a list gains at most 18 windows per stone.
    if (list.size() >= 32767) throw std::length_error("too many windows of one kind");
    pos[windowId] = static_cast<std::int16_t>(list.size());
    list.push_back(windowId);
    return;
  }
  const std::int32_t at = pos[windowId];
  const std::int32_t moved = list.back();
  list[at] = moved;
  pos[moved] = static_cast<std::int16_t>(at);
  list.pop_back();
  pos[windowId] = -1;
}

void Board::rebuildAround(Hex incoming) {
  if (!fitsWindow(incoming)) throw std::length_error("stones spread wider than the board window");  // isPlayable rules it out
  int minQ = incoming.q;
  int maxQ = incoming.q;
  int minR = incoming.r;
  int maxR = incoming.r;
  for (const Hex& m : moves_) {
    minQ = std::min(minQ, m.q);
    maxQ = std::max(maxQ, m.q);
    minR = std::min(minR, m.r);
    maxR = std::max(maxR, m.r);
  }
  const std::vector<Hex> moves = moves_;
  originQ_ = (minQ + maxQ) / 2;
  originR_ = (minR + maxR) / 2;
  std::fill(cells_.begin(), cells_.end(), Player::None);
  std::fill(coverage_.begin(), coverage_.end(), std::uint16_t{0});
  std::fill(litPos_.begin(), litPos_.end(), -1);
  for (auto& w : windows_) std::fill(w.begin(), w.end(), std::uint8_t{0});
  for (int s = 0; s < 2; ++s) {
    for (const std::int32_t id : threats_[s]) threatPos_[s][id] = -1;
    for (const std::int32_t id : threes_[s]) threePos_[s][id] = -1;
    for (const std::int32_t id : twos_[s]) twoPos_[s][id] = -1;
    threats_[s].clear();
    threes_[s].clear();
    twos_[s].clear();
    alive_[s].fill(0);
  }
  lit_.clear();
  moves_.clear();
  stoneHash_ = 0;
  for (std::size_t i = 0; i < moves.size(); ++i) {
    moves_.push_back(moves[i]);
    apply(moves[i], playerForStone(static_cast<int>(i)), +1);
  }
}

std::uint64_t Board::hash() const {
  return stoneHash_ ^ stageKey(current(), stonesLeft());
}

int Board::windowCount(int axis, Hex start, Player p) const {
  if (!insideWindow(start, 0)) return 0;
  return (windows_[axis][indexOf(start)] >> nibbleShift(p)) & 0xF;
}

int Board::playableCount() const {
  if (moves_.empty()) return 3 * radius_ * (radius_ + 1) + 1;
  return static_cast<int>(lit_.size()) - stones();
}

}  // namespace six
