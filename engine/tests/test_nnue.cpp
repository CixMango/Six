#include <algorithm>
#include <cmath>
#include <random>
#include <set>
#include <vector>

#include "board.hpp"
#include "nnue.hpp"
#include "print.hpp"
#include "testing.hpp"

using six::Board;
using six::Hex;
using six::PlaceError;
using six::Player;
namespace nnue = six::nnue;

namespace {

bool close(const float* a, const float* b, int n, float tolerance = 1e-3f) {
  for (int i = 0; i < n; ++i) {
    if (std::fabs(a[i] - b[i]) > tolerance * (1.0f + std::fabs(a[i]))) return false;
  }
  return true;
}

/** A random legal game of up to `stones` stones (stops early at a win). */
std::vector<Hex> randomGame(std::mt19937& rng, int stones, int radius = 8) {
  Board b(radius);
  std::vector<Hex> moves;
  while (static_cast<int>(moves.size()) < stones && b.winner() == Player::None) {
    std::vector<Hex> options;
    for (int q = -12; q <= 12; ++q) {
      for (int r = -12; r <= 12; ++r) {
        if (b.canPlace({q, r}) == PlaceError::None) options.push_back({q, r});
      }
    }
    // The opening stone at the centre, so shifted copies of the game stay legal.
    const Hex h = moves.empty() ? Hex{0, 0} : options[std::uniform_int_distribution<std::size_t>(0, options.size() - 1)(rng)];
    b.place(h);
    moves.push_back(h);
  }
  return moves;
}

Hex rotate(Hex h) { return {-h.r, h.q + h.r}; }
Hex reflect(Hex h) { return {h.r, h.q}; }

}  // namespace

TEST_CASE("nnue: a line code counts the viewer's stones as 1 and the other side's as 2, by offset") {
  Board b(9);
  CHECK_EQ(nnue::lineCode(b, {0, 0}, 0, Player::X), 0);
  b.place({1, 0});  // X, one step along axis 0: digit 5
  CHECK_EQ(nnue::lineCode(b, {0, 0}, 0, Player::X), 243);
  CHECK_EQ(nnue::lineCode(b, {0, 0}, 0, Player::O), 486);
  CHECK_EQ(nnue::lineCode(b, {2, 0}, 0, Player::X), 81);  // one step back: digit 4
  CHECK_EQ(nnue::lineCode(b, {0, 0}, 1, Player::X), 0);   // not on that line
  CHECK_EQ(nnue::lineCode(b, {1, 0}, 0, Player::X), 0);   // a cell's own stone is not part of its line
}

TEST_CASE("nnue: a code and its reverse share one entry, and the entries fill the table exactly") {
  CHECK_EQ(nnue::reversed(243), 81);
  CHECK_EQ(nnue::canonicalIndex(243), nnue::canonicalIndex(81));
  std::set<int> seen;
  for (int code = 0; code < nnue::kCodes; ++code) {
    const int index = nnue::canonicalIndex(code);
    CHECK(index >= 0 && index < nnue::kCanonical);
    CHECK_EQ(index, nnue::canonicalIndex(nnue::reversed(code)));
    seen.insert(index);
  }
  CHECK_EQ(static_cast<int>(seen.size()), nnue::kCanonical);
}

TEST_CASE("nnue: an empty board adds up to nothing") {
  const auto w = nnue::Weights::random(1);
  Board b(9);
  nnue::Accumulator acc(w);
  acc.reset(b);
  std::vector<float> zero(static_cast<std::size_t>(w.dim), 0.0f);
  CHECK(close(acc.sum(Player::X), zero.data(), w.dim));
}

TEST_CASE("nnue: incremental updates match a full recompute through random games, forwards and back") {
  const auto w = nnue::Weights::random(2);
  std::mt19937 rng(11);
  for (int game = 0; game < 20; ++game) {
    const auto moves = randomGame(rng, 40);
    Board b(8);
    nnue::Accumulator incremental(w);
    incremental.reset(b);
    for (const Hex h : moves) {
      b.place(h);
      incremental.placed(b, h);
      nnue::Accumulator fresh(w);
      fresh.reset(b);
      CHECK(close(incremental.sum(Player::X), fresh.sum(Player::X), w.dim));
      CHECK(close(incremental.sum(Player::O), fresh.sum(Player::O), w.dim));
    }
    while (b.stones() > 0) {
      const Hex h = b.moves().back();
      incremental.removing(b, h);
      b.undo();
    }
    std::vector<float> zero(static_cast<std::size_t>(w.dim), 0.0f);
    CHECK(close(incremental.sum(Player::X), zero.data(), w.dim));
  }
}

TEST_CASE("nnue: the evaluation is the same for every rotation and reflection, and anywhere on the board") {
  const auto w = nnue::Weights::random(3);
  std::mt19937 rng(5);
  const auto moves = randomGame(rng, 25);
  auto evaluate = [&](auto map) {
    Board b(8);
    for (const Hex h : moves) b.place(map(h));
    nnue::Accumulator acc(w);
    acc.reset(b);
    return acc.value(b);
  };
  const float base = evaluate([](Hex h) { return h; });
  CHECK(std::fabs(base - evaluate([](Hex h) { return rotate(h); })) < 1e-4f);
  CHECK(std::fabs(base - evaluate([](Hex h) { return rotate(rotate(rotate(h))); })) < 1e-4f);
  CHECK(std::fabs(base - evaluate([](Hex h) { return reflect(h); })) < 1e-4f);
  CHECK(std::fabs(base - evaluate([](Hex h) { return Hex{h.q + 3, h.r - 7}; })) < 1e-4f);
}

// ---- The search with the NNUE evaluation ----
#include <fstream>
#include <memory>
#include <sstream>
#include <string>

#include "search.hpp"

namespace {

six::SearchResult nnueSearch(const Board& b, int depth, std::int64_t nodes = -1) {
  static const auto weights = std::make_shared<const nnue::Weights>(nnue::Weights::random(7));
  six::Searcher searcher(16);
  searcher.setNnue(weights);
  searcher.params().set("nnueCheck", 1);  // every evaluation compares the running sums with a fresh count
  six::SearchLimits limits;
  limits.maxDepth = depth;
  limits.maxNodes = nodes;
  return searcher.search(b, limits);
}

Board playAll(const std::vector<std::pair<int, int>>& moves) {
  Board b(9);
  for (auto [q, r] : moves) b.place({q, r});
  return b;
}

}  // namespace

TEST_CASE("nnue search: the running sums stay exact through a real search, and turns are legal") {
  std::ifstream in(SIX_FIXTURES "/games.txt");
  std::string line;
  Board board(9);
  int positions = 0;
  int searched = 0;
  while (std::getline(in, line) && searched < 12) {
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
    if (board.winner() != Player::None || ++positions % 53 != 0) continue;
    ++searched;
    const auto result = nnueSearch(board, 3, 3000);  // throws if the running sums drift
    Board copy = board;
    CHECK(!result.stones.empty());
    for (const Hex& h : result.stones) {
      if (copy.winner() != Player::None) break;
      CHECK_EQ(copy.place(h), PlaceError::None);
    }
  }
  CHECK(searched >= 10);
}

TEST_CASE("nnue search: exact tactics still win and defend whatever the evaluation says") {
  Board win = playAll({{0, 0}, {3, 3}, {4, 3}, {1, 0}, {2, 0}, {-3, 3}, {-4, 3}, {3, 0}, {9, -9}, {-5, 3}, {-6, 4}});
  const auto taken = nnueSearch(win, 2);
  Board afterWin = win;
  for (const Hex& h : taken.stones) {
    afterWin.place(h);
    if (afterWin.winner() != Player::None) break;
  }
  CHECK_EQ(afterWin.winner(), Player::X);

  Board threat = playAll({{0, 2}, {0, 0}, {1, 0}, {5, 5}, {5, 6}, {2, 0}, {3, 0}});
  const auto blocked = nnueSearch(threat, 2);
  Board afterBlock = threat;
  for (const Hex& h : blocked.stones) afterBlock.place(h);
  CHECK_EQ(afterBlock.threatCount(Player::O), 0);
}

TEST_CASE("nnue: cached move scores equal freshly computed ones through random games, forwards and back") {
  const auto w = nnue::Weights::random(9);
  std::mt19937 rng(21);
  for (int game = 0; game < 8; ++game) {
    const auto moves = randomGame(rng, 36);
    Board b(8);
    nnue::Accumulator cached(w);
    cached.enablePolicyCache();
    cached.reset(b);
    const nnue::Accumulator direct(w);  // no cache: computes each score from the board
    auto compare = [&]() {
      if (b.stones() == 0) return;
      for (const Hex s : b.moves()) {
        for (int dq = -3; dq <= 3; ++dq) {
          for (int dr = -3; dr <= 3; ++dr) {
            const Hex c{s.q + dq, s.r + dr};
            if (b.at(c) != Player::None) continue;
            const float want = direct.policy(b, c);
            if (std::fabs(cached.policy(b, c) - want) > 1e-3f * (1.0f + std::fabs(want))) {
              six::testing::fail(__FILE__, __LINE__, "cached policy differs");
              return;
            }
          }
        }
      }
    };
    for (const Hex h : moves) {
      b.place(h);
      cached.placed(b, h);
      compare();
    }
    for (int i = 0; i < 10 && b.stones() > 0; ++i) {
      const Hex h = b.moves().back();
      cached.removing(b, h);
      b.undo();
      compare();
    }
    cached.reset(b);  // a fresh count mid-game leaves the cache right too
    compare();
  }
}

TEST_CASE("nnue search: a loss is only proven where the defender's every reply was tried") {
  // With random weights, every reply the quiet-node cut keeps loses, but the defender has others
  // (the line-count search finds one), so this must not be scored as a proven win.
  Board b = playAll({{0, 0}, {1, 0}, {1, 1}, {3, -2}, {4, -2}, {2, 2}, {5, -1}});
  static const auto weights = std::make_shared<const nnue::Weights>(nnue::Weights::random(7, 32, 32));
  six::Searcher searcher(16);
  searcher.setNnue(weights);
  six::SearchLimits limits;
  limits.maxDepth = 3;
  const auto result = searcher.search(b, limits);
  CHECK(result.score < six::kWinScore - 10'000);
}

// ---- Per-cell mode (v2): each cell's features pass the clipped ReLU before pooling ----

TEST_CASE("nnue per-cell: incremental pooled sums match a full recompute through random games, forwards and back") {
  const auto w = nnue::Weights::random(12, 8, 8, true);
  std::mt19937 rng(31);
  for (int game = 0; game < 12; ++game) {
    const auto moves = randomGame(rng, 36);
    Board b(8);
    nnue::Accumulator incremental(w);
    incremental.enablePolicyCache();  // per-cell mode keeps its incremental state only when asked to
    incremental.reset(b);
    for (const Hex h : moves) {
      b.place(h);
      incremental.placed(b, h);
      nnue::Accumulator fresh(w);
      fresh.reset(b);
      CHECK(close(incremental.sum(Player::X), fresh.sum(Player::X), w.dim));
      CHECK(close(incremental.sum(Player::O), fresh.sum(Player::O), w.dim));
      CHECK(std::fabs(incremental.value(b) - fresh.value(b)) < 1e-4f);
    }
    while (b.stones() > 0) {
      const Hex h = b.moves().back();
      incremental.removing(b, h);
      b.undo();
    }
    std::vector<float> zero(static_cast<std::size_t>(w.dim), 0.0f);
    CHECK(close(incremental.sum(Player::X), zero.data(), w.dim));
  }
}

TEST_CASE("nnue per-cell: the evaluation is the same for every rotation and reflection") {
  const auto w = nnue::Weights::random(13, 8, 8, true);
  std::mt19937 rng(8);
  const auto moves = randomGame(rng, 25);
  auto evaluate = [&](auto map) {
    Board b(8);
    for (const Hex h : moves) b.place(map(h));
    nnue::Accumulator acc(w);
    acc.reset(b);
    return acc.value(b);
  };
  const float base = evaluate([](Hex h) { return h; });
  CHECK(std::fabs(base - evaluate([](Hex h) { return rotate(h); })) < 1e-4f);
  CHECK(std::fabs(base - evaluate([](Hex h) { return reflect(h); })) < 1e-4f);
  CHECK(std::fabs(base - evaluate([](Hex h) { return Hex{h.q + 3, h.r - 7}; })) < 1e-4f);
}

TEST_CASE("nnue per-cell: move scores equal freshly computed ones through a game and back") {
  const auto w = nnue::Weights::random(14, 8, 8, true);
  std::mt19937 rng(41);
  const auto moves = randomGame(rng, 30);
  Board b(8);
  nnue::Accumulator acc(w);
  acc.enablePolicyCache();
  acc.reset(b);
  auto compare = [&]() {
    nnue::Accumulator fresh(w);
    fresh.reset(b);
    for (const Hex s : b.moves()) {
      for (int dq = -2; dq <= 2; ++dq) {
        for (int dr = -2; dr <= 2; ++dr) {
          const Hex c{s.q + dq, s.r + dr};
          if (b.at(c) != Player::None) continue;
          CHECK(std::fabs(acc.policy(b, c) - fresh.policy(b, c)) < 1e-3f);
        }
      }
    }
  };
  for (const Hex h : moves) {
    b.place(h);
    acc.placed(b, h);
  }
  compare();
  for (int i = 0; i < 8; ++i) {
    const Hex h = b.moves().back();
    acc.removing(b, h);
    b.undo();
  }
  compare();
}

TEST_CASE("nnue per-cell search: running sums stay exact through a real search") {
  static const auto weights = std::make_shared<const nnue::Weights>(nnue::Weights::random(15, 8, 8, true));
  Board b = playAll({{0, 0}, {1, 0}, {1, 1}, {3, -2}, {4, -2}, {2, 2}, {5, -1}});
  six::Searcher searcher(16);
  searcher.setNnue(weights);
  searcher.params().set("nnueCheck", 1);
  six::SearchLimits limits;
  limits.maxDepth = 3;
  limits.maxNodes = 3000;
  const auto result = searcher.search(b, limits);
  CHECK(!result.stones.empty());
}
