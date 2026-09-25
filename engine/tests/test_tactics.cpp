#include <utility>
#include <vector>

#include "board.hpp"
#include "print.hpp"
#include "tactics.hpp"
#include "testing.hpp"

using six::Board;
using six::Player;

namespace {

Board play(const std::vector<std::pair<int, int>>& moves) {
  Board b(9);
  for (auto [q, r] : moves) b.place({q, r});
  return b;
}

}  // namespace

TEST_CASE("threat windows: an open straight four makes three windows") {
  // O has 0..3 on row 0.
  Board b = play({{0, 2}, {0, 0}, {1, 0}, {5, 5}, {5, 6}, {2, 0}, {3, 0}});
  CHECK_EQ(six::threatWindows(b, Player::O).size(), std::size_t{3});
  CHECK_EQ(six::threatWindows(b, Player::X).size(), std::size_t{0});
  CHECK_EQ(six::minCover(b, six::threatWindows(b, Player::O), 2), 2);
}

TEST_CASE("winning sets are distinct and need at most the stones left") {
  // X has 0..3 on row 0 and two stones to play.
  Board b = play({{0, 0}, {3, 3}, {4, 3}, {1, 0}, {2, 0}, {-3, 3}, {-4, 3}, {3, 0}, {9, -9}, {-5, 3}, {-6, 4}});
  CHECK_EQ(b.current(), Player::X);
  CHECK_EQ(b.stonesLeft(), 2);
  CHECK_EQ(six::countWinningSets(b, Player::X, 2), 3);
  CHECK_EQ(six::countWinningSets(b, Player::X, 1), 0);
}

TEST_CASE("three separate fours cannot be covered with two stones") {
  Board b(9);
  // X plays far filler; O builds three disjoint fours.
  const std::vector<std::pair<int, int>> o = {{0, 0}, {1, 0}, {2, 0}, {3, 0}, {0, 4}, {1, 4},
                                              {2, 4}, {3, 4}, {-6, 0}, {-6, 1}, {-6, 2}, {-6, 3}};
  int filler = 0;
  std::size_t oi = 0;
  while (oi < o.size()) {
    if (b.current() == Player::X) {
      b.place({3 * filler++, -7});
    } else {
      b.place({o[oi].first, o[oi].second});
      ++oi;
    }
  }
  CHECK_EQ(six::minCover(b, six::threatWindows(b, Player::O), 2), 3);
}
