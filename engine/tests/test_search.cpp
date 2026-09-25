#include <fstream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "board.hpp"
#include "print.hpp"
#include "search.hpp"
#include "tactics.hpp"
#include "testing.hpp"

using six::Board;
using six::Hex;
using six::PlaceError;
using six::Player;

namespace {

Board play(const std::vector<std::pair<int, int>>& moves, int radius = 9) {
  Board b(radius);
  for (auto [q, r] : moves) {
    if (b.place({q, r}) != PlaceError::None) six::testing::fail(__FILE__, __LINE__, "setup move was illegal");
  }
  return b;
}

six::SearchResult searchDepth(const Board& b, int depth) {
  six::Searcher searcher(16);
  six::SearchLimits limits;
  limits.maxDepth = depth;
  return searcher.search(b, limits);
}

/** Applies the searched stones to a copy and returns it. */
Board after(const Board& b, const six::SearchResult& r) {
  Board copy = b;
  for (const Hex& h : r.stones) {
    if (copy.place(h) != PlaceError::None) six::testing::fail(__FILE__, __LINE__, "search returned an illegal stone");
    if (copy.winner() != Player::None) break;
  }
  return copy;
}

}  // namespace

TEST_CASE("search: a game stretched to the edge of the board window still gets a legal turn") {
  Board b(9);
  int q = 0;
  b.place({q, 0});
  while (b.canPlace({q + 9, 0}) == PlaceError::None) {
    b.place({q + 9, 0});
    q += 9;
    b.place({q, -1});
  }
  for (int turn = 0; turn < 4 && b.winner() == Player::None; ++turn) {
    const auto result = searchDepth(b, 2);
    CHECK(!result.stones.empty());
    for (const Hex& h : result.stones) CHECK_EQ(b.place(h), PlaceError::None);
  }
}

TEST_CASE("search: takes a win that needs both stones") {
  Board b = play({{0, 0}, {3, 3}, {4, 3}, {1, 0}, {2, 0}, {-3, 3}, {-4, 3}, {3, 0}, {9, -9}, {-5, 3}, {-6, 4}});
  CHECK_EQ(b.current(), Player::X);
  const auto result = searchDepth(b, 2);
  CHECK_EQ(after(b, result).winner(), Player::X);
  CHECK(result.score >= six::kWinScore - 8);
}

TEST_CASE("search: blocks an open four so no threat is left standing") {
  Board b = play({{0, 2}, {0, 0}, {1, 0}, {5, 5}, {5, 6}, {2, 0}, {3, 0}});
  CHECK_EQ(b.current(), Player::X);
  CHECK_EQ(b.stonesLeft(), 2);
  const auto result = searchDepth(b, 2);
  CHECK_EQ(result.stones.size(), std::size_t{2});
  CHECK_EQ(after(b, result).threatCount(Player::O), 0);
}

TEST_CASE("search: finds the two-turn win from two open threes") {
  // X has open threes on rows 0 and 4; two more stones make fours that two stones can't cover.
  Board b = play({{0, 0}, {0, -7}, {3, -7}, {1, 0}, {2, 0}, {6, -7}, {9, -7}, {0, 4}, {1, 4},
                  {12, -7}, {15, -7}, {2, 4}, {-8, 8}, {18, -7}, {21, -7}});
  CHECK_EQ(b.current(), Player::X);
  CHECK_EQ(b.stonesLeft(), 2);
  const auto result = searchDepth(b, 2);
  const Board next = after(b, result);
  CHECK(result.score >= six::kWinScore - 8);
  CHECK(six::minCover(next, six::threatWindows(next, Player::X), 2) > 2);
}

TEST_CASE("double-four detection: two open threes win, one does not") {
  Board two = play({{0, 0}, {0, -7}, {3, -7}, {1, 0}, {2, 0}, {6, -7}, {9, -7}, {0, 4}, {1, 4},
                    {12, -7}, {15, -7}, {2, 4}, {-8, 8}, {18, -7}, {21, -7}});
  const auto before = two.hash();
  CHECK(six::hasDoubleFourWin(two));
  CHECK_EQ(two.hash(), before);

  // Only one open three (row 0); the second row has two stones.
  Board one = play({{0, 0}, {0, -7}, {3, -7}, {1, 0}, {2, 0}, {6, -7}, {9, -7}, {0, 4}, {-8, 8},
                    {12, -7}, {15, -7}, {-8, 10}, {-6, 9}, {18, -7}, {21, -7}});
  CHECK_EQ(one.current(), Player::X);
  CHECK(!six::hasDoubleFourWin(one));
}

TEST_CASE("search: knows a position with three open fours against it is lost") {
  Board b(9);
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
  while (!(b.current() == Player::X && b.stonesLeft() == 2)) b.place({3 * filler++, -7});
  const auto result = searchDepth(b, 2);
  CHECK(result.score <= -six::kWinScore + 8);
  CHECK(!result.stones.empty());
}

TEST_CASE("search: opens the game with one legal stone") {
  Board b(9);
  const auto result = searchDepth(b, 3);
  CHECK_EQ(result.stones.size(), std::size_t{1});
  CHECK(b.isPlayable(result.stones[0]));
}

TEST_CASE("search: always returns legal stones for the rest of the turn on fixture positions") {
  std::ifstream in(SIX_FIXTURES "/games.txt");
  std::string line;
  Board board(9);
  six::Searcher searcher(16);
  six::SearchLimits limits;
  limits.maxDepth = 2;
  limits.maxNodes = 4000;
  int checked = 0;
  int positions = 0;
  while (std::getline(in, line)) {
    std::istringstream ss(line);
    std::string kind;
    ss >> kind;
    if (kind == "game") {
      std::string id;
      int radius = 9;
      ss >> id >> radius;
      board = Board(radius);
      continue;
    }
    if (kind != "stone") continue;
    int q = 0;
    int r = 0;
    ss >> q >> r;
    board.place({q, r});
    if (board.winner() != Player::None || ++positions % 37 != 0) continue;
    const auto result = searcher.search(board, limits);
    Board copy = board;
    const int need = copy.stonesLeft();
    const Player mover = copy.current();
    std::string why;
    if (result.stones.empty() || static_cast<int>(result.stones.size()) > need) {
      why = "returned " + std::to_string(result.stones.size()) + " stones, turn needs " + std::to_string(need);
    }
    for (const Hex& h : result.stones) {
      if (!why.empty()) break;
      if (copy.winner() != Player::None) why = "kept placing after a win";
      else if (copy.place(h) != PlaceError::None) why = "illegal stone (" + std::to_string(h.q) + ", " + std::to_string(h.r) + ")";
    }
    if (why.empty() && static_cast<int>(result.stones.size()) < need && copy.winner() != mover) {
      why = "returned a short turn without winning";
    }
    if (!why.empty()) {
      std::ostringstream os;
      os << "position " << positions << " (" << board.stones() << " stones, " << six::toChar(mover) << " to place " << need
         << ", threats X=" << board.threatCount(Player::X) << " O=" << board.threatCount(Player::O) << "): " << why;
      six::testing::fail(__FILE__, __LINE__, os.str());
    }
    ++checked;
  }
  CHECK(checked > 400);
}

TEST_CASE("search: the same position and depth give the same answer") {
  Board b = play({{0, 0}, {1, -1}, {1, 0}, {-1, 1}, {0, 1}, {2, -1}, {2, -2}});
  const auto first = searchDepth(b, 3);
  const auto second = searchDepth(b, 3);
  CHECK(first.stones == second.stones);
  CHECK_EQ(first.score, second.score);
}
