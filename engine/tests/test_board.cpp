#include <stdexcept>
#include <utility>
#include <vector>

#include "board.hpp"
#include "print.hpp"
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

}  // namespace

TEST_CASE("turn structure: X places 1, then 2 each") {
  const Player expected[] = {Player::X, Player::O, Player::O, Player::X, Player::X, Player::O, Player::O};
  const int left[] = {1, 2, 1, 2, 1, 2, 1};
  for (int i = 0; i < 7; ++i) {
    CHECK_EQ(six::playerForStone(i), expected[i]);
    CHECK_EQ(six::stonesLeftBefore(i), left[i]);
  }
}

TEST_CASE("empty board: every cell within the radius of the center is playable") {
  CHECK_EQ(Board(9).playableCount(), 271);
  CHECK_EQ(Board(8).playableCount(), 217);
  Board b(9);
  CHECK(b.isPlayable({9, -9}));
  CHECK(!b.isPlayable({10, 0}));
}

TEST_CASE("after the opening stone: 270 playable at radius 9, 216 at radius 8") {
  Board b9(9);
  b9.place({0, 0});
  CHECK_EQ(b9.playableCount(), 270);
  Board b8(8);
  b8.place({0, 0});
  CHECK_EQ(b8.playableCount(), 216);
}

TEST_CASE("rejects taken and out-of-range cells without using a stone") {
  Board b(9);
  CHECK_EQ(b.place({10, 0}), PlaceError::OutOfRange);
  CHECK_EQ(b.place({0, 0}), PlaceError::None);
  CHECK_EQ(b.place({0, 0}), PlaceError::Occupied);
  CHECK_EQ(b.place({10, 0}), PlaceError::OutOfRange);
  CHECK_EQ(b.stonesLeft(), 2);
  CHECK_EQ(b.current(), Player::O);
  CHECK_EQ(b.place({9, 0}), PlaceError::None);
  CHECK(b.isPlayable({18, 0}));
  CHECK_EQ(b.place({18, 0}), PlaceError::None);
}

TEST_CASE("spec example: an O stone at one end does not stop six") {
  Board b = play({{-3, 0}, {3, 0}, {4, 4}, {-2, 0}, {-1, 0}, {5, 4}, {4, 5}, {1, 0}, {2, 0}, {-5, 6}, {-6, 6}});
  CHECK_EQ(b.current(), Player::X);
  CHECK_EQ(b.place({0, 0}), PlaceError::None);
  CHECK_EQ(b.winner(), Player::X);
  CHECK_EQ(b.place({6, 6}), PlaceError::GameOver);
}

TEST_CASE("a win freezes turn state at the winning stone") {
  Board b = play({{0, 0}, {0, 5}, {1, 5}, {-3, 0}, {-4, 2}, {2, 5}, {3, 5}, {-6, 1}, {4, -3}, {4, 5}});
  CHECK_EQ(b.current(), Player::O);
  CHECK_EQ(b.turn(), 6);
  CHECK_EQ(b.stonesLeft(), 1);
  CHECK_EQ(b.place({5, 5}), PlaceError::None);
  CHECK_EQ(b.winner(), Player::O);
  CHECK_EQ(b.current(), Player::O);
  CHECK_EQ(b.turn(), 6);
  CHECK_EQ(b.stonesLeft(), 0);
  b.undo();
  CHECK_EQ(b.winner(), Player::None);
  CHECK_EQ(b.stonesLeft(), 1);
}

TEST_CASE("undo restores playable area, hash and window counts exactly") {
  Board b(9);
  std::vector<std::uint64_t> hashes{b.hash()};
  std::vector<int> playable{b.playableCount()};
  const std::vector<std::pair<int, int>> moves = {{0, 0}, {1, 0}, {2, -1}, {-3, 4}, {7, -7}, {8, -7}, {0, 1}};
  for (auto [q, r] : moves) {
    b.place({q, r});
    hashes.push_back(b.hash());
    playable.push_back(b.playableCount());
  }
  for (int i = static_cast<int>(moves.size()); i > 0; --i) {
    b.undo();
    CHECK_EQ(b.hash(), hashes[i - 1]);
    CHECK_EQ(b.playableCount(), playable[i - 1]);
  }
  CHECK_EQ(b.windowCount(0, {-5, 0}, Player::X), 0);
}

TEST_CASE("the hash ignores the order of stones within a turn") {
  Board a = play({{0, 0}, {1, 0}, {2, 0}});
  Board b = play({{0, 0}, {2, 0}, {1, 0}});
  CHECK_EQ(a.hash(), b.hash());
  Board c = play({{0, 0}, {1, 0}});
  CHECK(c.hash() != a.hash());
}

TEST_CASE("play can drift far from the origin: the board recenters transparently") {
  Board b(9);
  // A chain of turns walking stones eastward one radius at a time, past the initial window edge.
  int q = 0;
  b.place({q, 0});
  for (int turn = 0; turn < 20; ++turn) {
    q += 9;
    CHECK_EQ(b.place({q, 0}), PlaceError::None);
    CHECK_EQ(b.place({q, -1}), PlaceError::None);
  }
  CHECK_EQ(b.stones(), 41);
  CHECK_EQ(b.at({q, 0}), b.current() == Player::X ? Player::O : Player::X);
  CHECK(b.isPlayable({q + 9, 0}));
  CHECK(!b.isPlayable({q + 13, 0}));
  const auto before = b.playableCount();
  const auto hash = b.hash();
  b.undo();
  b.place({q, -1});
  CHECK_EQ(b.playableCount(), before);
  CHECK_EQ(b.hash(), hash);
}

TEST_CASE("stones can't spread wider than the window: farther cells are out of range and the board stays intact") {
  Board b(9);
  int q = 0;
  b.place({q, 0});
  bool refused = false;
  for (int turn = 0; turn < 40 && !refused; ++turn) {
    refused = b.place({q + 9, 0}) != PlaceError::None;
    if (!refused) {
      q += 9;
      CHECK_EQ(b.place({q, -1}), PlaceError::None);
    }
  }
  CHECK(refused);
  CHECK(q > 150);
  CHECK(!b.isPlayable({q + 9, 0}));
  CHECK_EQ(b.canPlace({q + 9, 0}), PlaceError::OutOfRange);
  CHECK(b.isPlayable({q + 1, 0}));  // nearer cells keep working
  const auto hash = b.hash();
  CHECK_EQ(b.place({q + 1, 0}), PlaceError::None);
  b.undo();
  CHECK_EQ(b.hash(), hash);
}

TEST_CASE("setup: any stones, with the side to move and stones left chosen") {
  Board b(8);
  // Twelve X and three O can't come from play, but a set-up position allows it.
  std::vector<std::pair<Hex, Player>> stones;
  for (int q = 0; q < 12; ++q) stones.push_back({{q, 3 * (q % 2)}, Player::X});
  for (int q = 0; q < 3; ++q) stones.push_back({{q, 10}, Player::O});
  CHECK(b.setup(stones, Player::O, 1));
  CHECK_EQ(b.stones(), 15);
  CHECK_EQ(b.setupStones(), 15);
  CHECK_EQ(b.at({4, 0}), Player::X);
  CHECK_EQ(b.at({1, 10}), Player::O);
  CHECK_EQ(b.current(), Player::O);
  CHECK_EQ(b.stonesLeft(), 1);
  CHECK(b.secondStone());
  // Play goes on from there: O's last stone, then two for X.
  CHECK_EQ(b.place({5, 10}), PlaceError::None);
  CHECK_EQ(b.ownerOf(15), Player::O);
  CHECK_EQ(b.current(), Player::X);
  CHECK_EQ(b.stonesLeft(), 2);
  CHECK(!b.secondStone());
  b.undo();
  CHECK_EQ(b.current(), Player::O);
  // Setup stones can't be undone.
  b.undo();
  CHECK_EQ(b.stones(), 15);
}

TEST_CASE("setup: each side to move and stone count") {
  const std::vector<std::pair<Hex, Player>> stones{{{0, 0}, Player::X}, {{1, 0}, Player::O}};
  for (Player p : {Player::X, Player::O}) {
    for (int left : {1, 2}) {
      Board b(8);
      CHECK(b.setup(stones, p, left));
      CHECK_EQ(b.current(), p);
      CHECK_EQ(b.stonesLeft(), left);
      CHECK_EQ(b.secondStone(), left == 1);
    }
  }
  // No stones and X with one: the ordinary opening.
  Board empty(8);
  CHECK(empty.setup({}, Player::X, 1));
  CHECK_EQ(empty.current(), Player::X);
  CHECK(!empty.secondStone());
  CHECK(empty.isPlayable({8, 0}));
}

TEST_CASE("setup: a six already on the board ends the game, overlapping stones are refused") {
  std::vector<std::pair<Hex, Player>> six;
  for (int q = 0; q < 6; ++q) six.push_back({{q, 0}, Player::O});
  Board b(8);
  CHECK(b.setup(six, Player::X, 2));
  CHECK_EQ(b.winner(), Player::O);
  CHECK_EQ(b.place({0, 1}), PlaceError::GameOver);
  Board c(8);
  CHECK(!c.setup({{{0, 0}, Player::X}, {{0, 0}, Player::O}}, Player::X, 2));
}

TEST_CASE("setup: the hash tells positions apart by side to move") {
  Board a(8);
  Board b(8);
  const std::vector<std::pair<Hex, Player>> stones{{{0, 0}, Player::X}, {{2, 0}, Player::O}};
  a.setup(stones, Player::X, 2);
  b.setup(stones, Player::O, 2);
  CHECK(a.hash() != b.hash());
}

TEST_CASE("setup: stones far outside the window's first placement still fit") {
  Board b(8);
  CHECK(b.setup({{{500, -300}, Player::X}, {{510, -300}, Player::O}}, Player::X, 2));
  CHECK_EQ(b.at({510, -300}), Player::O);
  CHECK(b.isPlayable({505, -300}));
  CHECK(!b.isPlayable({0, 0}));
}
