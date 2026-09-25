#include "tactics.hpp"

#include <algorithm>
#include <limits>
#include <set>
#include <unordered_set>
#include <utility>

namespace six {
namespace {

std::uint64_t packCell(Hex h) {
  return (static_cast<std::uint64_t>(static_cast<std::uint32_t>(h.q)) << 32) | static_cast<std::uint32_t>(h.r);
}

std::vector<Hex> empties(const Board& board, const Window& w) {
  std::vector<Hex> out;
  for (int i = 0; i < kWinLength; ++i) {
    const Hex c = w.cell(i);
    if (board.at(c) == Player::None) out.push_back(c);
  }
  return out;
}

}  // namespace

std::vector<Window> activeWindows(const Board& board) {
  std::vector<Window> out;
  std::unordered_set<std::uint64_t> seen;
  seen.reserve(static_cast<std::size_t>(board.stones()) * 36 + 16);
  for (const Hex& stone : board.moves()) {
    for (int a = 0; a < 3; ++a) {
      for (int k = 0; k < kWinLength; ++k) {
        const Hex start{stone.q - kAxes[a].q * k, stone.r - kAxes[a].r * k};
        if (!seen.insert(packCell(start) * 3 + static_cast<std::uint64_t>(a)).second) continue;
        out.push_back(Window{start, a, board.windowCount(a, start, Player::X), board.windowCount(a, start, Player::O)});
      }
    }
  }
  return out;
}

std::vector<Window> threatWindows(const Board& board, Player p) {
  std::vector<Window> out;
  out.reserve(static_cast<std::size_t>(board.threatCount(p)));
  board.forEachThreat(p, [&](int axis, Hex start) {
    out.push_back(Window{start, axis, board.windowCount(axis, start, Player::X), board.windowCount(axis, start, Player::O)});
  });
  return out;
}

std::vector<Window> scanThreatWindows(const Board& board, Player p) {
  std::vector<Window> out;
  const Player opp = other(p);
  for (const Window& w : activeWindows(board)) {
    if (w.count(p) >= kWinLength - 2 && w.count(opp) == 0) out.push_back(w);
  }
  return out;
}

int countWinningSets(const Board& board, Player p, int stones) {
  std::set<std::pair<std::uint64_t, std::uint64_t>> sets;
  // A winning set needs at least 4 stones already in the window, so only threat windows qualify.
  for (const Window& w : threatWindows(board, p)) {
    if (kWinLength - w.count(p) > stones) continue;
    const auto cells = empties(board, w);
    if (cells.empty()) continue;
    std::uint64_t first = packCell(cells[0]);
    std::uint64_t second = cells.size() > 1 ? packCell(cells[1]) : std::numeric_limits<std::uint64_t>::max();
    if (first > second) std::swap(first, second);
    sets.emplace(first, second);
  }
  return static_cast<int>(sets.size());
}

int minCover(const Board& board, const std::vector<Window>& threats, int budget) {
  if (threats.empty()) return 0;
  // Each candidate cell and the threat windows it lies in.
  std::vector<std::pair<Hex, std::vector<int>>> candidates;
  for (int t = 0; t < static_cast<int>(threats.size()); ++t) {
    for (const Hex& c : empties(board, threats[t])) {
      auto it = std::find_if(candidates.begin(), candidates.end(), [&](const auto& e) { return e.first == c; });
      if (it == candidates.end()) {
        candidates.push_back({c, {t}});
      } else {
        it->second.push_back(t);
      }
    }
  }
  const std::size_t all = threats.size();
  if (budget >= 1) {
    for (const auto& c : candidates) {
      if (c.second.size() == all) return 1;
    }
  }
  if (budget >= 2) {
    std::vector<char> hit(all);
    for (std::size_t i = 0; i < candidates.size(); ++i) {
      for (std::size_t j = i + 1; j < candidates.size(); ++j) {
        if (candidates[i].second.size() + candidates[j].second.size() < all) continue;
        std::fill(hit.begin(), hit.end(), char{0});
        for (int t : candidates[i].second) hit[t] = 1;
        for (int t : candidates[j].second) hit[t] = 1;
        if (std::all_of(hit.begin(), hit.end(), [](char h) { return h != 0; })) return 2;
      }
    }
  }
  return budget + 1;
}

}  // namespace six
