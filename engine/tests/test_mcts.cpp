#include <cmath>
#include <fstream>
#include <random>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "mcts.hpp"
#include "print.hpp"
#include "testing.hpp"

using six::Board;
using six::Hex;
using six::PlaceError;
using six::Player;

namespace {

Board play(const std::vector<std::pair<int, int>>& moves) {
  Board b(9);
  for (auto [q, r] : moves) {
    if (b.place({q, r}) != PlaceError::None) six::testing::fail(__FILE__, __LINE__, "setup move was illegal");
  }
  return b;
}

six::Evaluator& tinyNet() {
  static six::Evaluator evaluator(SIX_FIXTURES "/tiny.onnx", six::Device::Cpu);
  return evaluator;
}

six::SearchResult searchVisits(const Board& b, int visits) {
  six::Mcts mcts(tinyNet());
  mcts.params().batch = 8;
  six::SearchLimits limits;
  limits.maxNodes = visits;
  return mcts.search(b, limits);
}

/** Why the result isn't a legal, complete turn, or empty if it is. */
std::string turnProblem(const Board& b, const six::SearchResult& r) {
  Board copy = b;
  const Player mover = copy.current();
  const int need = copy.stonesLeft();
  if (r.stones.empty() || static_cast<int>(r.stones.size()) > need) return "returned " + std::to_string(r.stones.size()) + " stones";
  for (const Hex& h : r.stones) {
    if (copy.winner() != Player::None) return "kept placing after a win";
    if (copy.place(h) != PlaceError::None) return "illegal stone";
  }
  if (static_cast<int>(r.stones.size()) < need && copy.winner() != mover) return "short turn without a win";
  return {};
}

}  // namespace

TEST_CASE("mcts: takes a win that needs both stones, even with a random network") {
  Board b = play({{0, 0}, {3, 3}, {4, 3}, {1, 0}, {2, 0}, {-3, 3}, {-4, 3}, {3, 0}, {9, -9}, {-5, 3}, {-6, 4}});
  const auto result = searchVisits(b, 64);
  Board copy = b;
  for (const Hex& h : result.stones) copy.place(h);
  CHECK_EQ(copy.winner(), Player::X);
}

TEST_CASE("mcts: blocks an open four") {
  Board b = play({{0, 2}, {0, 0}, {1, 0}, {5, 5}, {5, 6}, {2, 0}, {3, 0}});
  const auto result = searchVisits(b, 200);
  CHECK_EQ(turnProblem(b, result), std::string{});
  Board copy = b;
  for (const Hex& h : result.stones) copy.place(h);
  CHECK_EQ(copy.threatCount(Player::O), 0);
}

TEST_CASE("mcts: plays the double-threat win the solver finds") {
  Board b = play({{0, 0}, {0, -7}, {3, -7}, {1, 0}, {2, 0}, {6, -7}, {9, -7}, {0, 4}, {1, 4},
                  {12, -7}, {15, -7}, {2, 4}, {-8, 8}, {18, -7}, {21, -7}});
  const auto result = searchVisits(b, 32);
  CHECK_EQ(result.score, six::kWinScore);
  CHECK_EQ(result.stones.size(), std::size_t{2});
}

TEST_CASE("mcts: always returns a legal complete turn on fixture positions") {
  std::ifstream in(SIX_FIXTURES "/games.txt");
  std::string line;
  Board board(9);
  int positions = 0;
  int checked = 0;
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
    if (board.winner() != Player::None || ++positions % 151 != 0) continue;
    const auto result = searchVisits(board, 48);
    const std::string why = turnProblem(board, result);
    if (!why.empty()) six::testing::fail(__FILE__, __LINE__, "position " + std::to_string(positions) + ": " + why);
    ++checked;
  }
  CHECK(checked > 100);
}

TEST_CASE("mcts: continues the previous turn's tree when the game follows it") {
  six::Mcts mcts(tinyNet());
  mcts.params().batch = 8;
  six::SearchLimits deep;
  deep.maxNodes = 800;
  six::SearchLimits none;
  none.maxNodes = 1;
  Board b = play({{0, 0}, {1, -1}, {1, 0}, {-1, 2}, {3, -2}});
  const auto first = mcts.search(b, deep);
  CHECK_EQ(turnProblem(b, first), std::string{});
  Board next = b;
  for (const Hex& h : first.stones) next.place(h);
  // The opponent's search starts from the kept subtree, so it already has visits before searching any more.
  const auto reply = mcts.search(next, none);
  CHECK_EQ(turnProblem(next, reply), std::string{});
  CHECK(reply.nodes > 1);
  // A position the tree never reached starts over.
  Board other = play({{0, 0}, {2, 2}, {2, 3}});
  const auto fresh = mcts.search(other, none);
  CHECK_EQ(turnProblem(other, fresh), std::string{});
  CHECK(fresh.nodes <= 1);
  // And a new game forgets the tree.
  mcts.search(b, deep);
  mcts.newGame();
  CHECK(mcts.search(next, none).nodes <= 1);
}

TEST_CASE("mcts: a whole game played with one kept tree stays legal") {
  six::Mcts mcts(tinyNet());
  mcts.params().batch = 8;
  six::SearchLimits limits;
  limits.maxNodes = 96;
  Board b = play({{0, 0}});
  int turns = 0;
  while (b.winner() == Player::None && b.stones() < 80) {
    const auto result = mcts.search(b, limits);
    const std::string why = turnProblem(b, result);
    if (!why.empty()) {
      six::testing::fail(__FILE__, __LINE__, "turn " + std::to_string(turns) + ": " + why);
      break;
    }
    for (const Hex& h : result.stones) b.place(h);
    ++turns;
  }
  CHECK(turns > 10);
}

TEST_CASE("mcts: a game stretched to the edge of the board window still gets a legal turn") {
  // A ladder-like walk east, as long as the window allows; the search must not step past it.
  Board b(9);
  int q = 0;
  b.place({q, 0});
  while (b.canPlace({q + 9, 0}) == PlaceError::None) {
    b.place({q + 9, 0});
    q += 9;
    b.place({q, -1});
  }
  six::Mcts mcts(tinyNet());
  mcts.params().batch = 8;
  six::SearchLimits limits;
  limits.maxNodes = 200;
  for (int turn = 0; turn < 6 && b.winner() == Player::None; ++turn) {
    const auto result = mcts.search(b, limits);
    const std::string why = turnProblem(b, result);
    if (!why.empty()) {
      six::testing::fail(__FILE__, __LINE__, "turn " + std::to_string(turn) + ": " + why);
      break;
    }
    for (const Hex& h : result.stones) b.place(h);
  }
  std::mt19937_64 rng(3);
  CHECK(b.winner() != Player::None || b.canPlace(mcts.searchStone(b, 32, 4, rng).move) == PlaceError::None);
}

TEST_CASE("mcts: self-play stone search returns a legal stone and a proper policy target") {
  six::Mcts mcts(tinyNet());
  mcts.params().batch = 8;
  std::mt19937_64 rng(5);
  // A quiet position (the longer opening used elsewhere is a proven win for X, so it would be decided).
  Board b = play({{0, 0}, {1, -1}, {1, 0}, {-1, 2}, {3, -2}});
  for (int trial = 0; trial < 5; ++trial) {
    const six::StoneChoice choice = mcts.searchStone(b, 64, 8, rng);
    CHECK(!choice.decided);
    CHECK(b.canPlace(choice.move) == PlaceError::None);
    float total = 0.0f;
    bool movePresent = false;
    for (const auto& [cell, p] : choice.policy) {
      CHECK(b.canPlace(cell) == PlaceError::None);
      total += p;
      movePresent = movePresent || cell == choice.move;
    }
    CHECK(total > 0.98f && total <= 1.001f);
    CHECK(movePresent);
    CHECK(choice.visits >= 60);
    CHECK(choice.surprise >= -1e-4f && std::isfinite(choice.surprise));
  }
  // A win on the board is decided, so it teaches no policy.
  Board win = play({{0, 0}, {3, 3}, {4, 3}, {1, 0}, {2, 0}, {-3, 3}, {-4, 3}, {3, 0}, {9, -9}, {-5, 3}, {-6, 4}});
  const six::StoneChoice decided = mcts.searchStone(win, 64, 8, rng);
  CHECK(decided.decided);
  Board copy = win;
  copy.place(decided.move);
  CHECK(copy.threatCount(Player::X) > 0 || copy.winner() == Player::X);
}
