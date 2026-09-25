// Differential test: replays games generated from the TypeScript rules and checks that
// the engine reports the same facts after every stone.
#include <cstdint>
#include <fstream>
#include <map>
#include <sstream>
#include <string>

#include "board.hpp"
#include "tactics.hpp"
#include "testing.hpp"

namespace {

std::uint32_t cellHash(six::Hex h) {
  return (static_cast<std::uint32_t>(h.q) * 73856093u) ^ (static_cast<std::uint32_t>(h.r) * 19349663u);
}

std::map<std::string, std::string> engineFacts(const six::Board& b) {
  std::uint32_t sum = 0;
  int playable = 0;
  b.forEachPlayable([&](six::Hex h) {
    sum += cellHash(h);
    ++playable;
  });
  const six::Player mover = b.current();
  const six::Player opp = six::other(mover);
  const bool over = b.winner() != six::Player::None;
  const auto oppThreats = six::threatWindows(b, opp);
  std::map<std::string, std::string> f;
  f["playable"] = std::to_string(playable);
  f["sum"] = std::to_string(sum);
  f["winner"] = over ? std::string(1, six::toChar(b.winner())) : "-";
  f["current"] = std::string(1, six::toChar(mover));
  f["turn"] = std::to_string(b.turn());
  f["left"] = std::to_string(b.stonesLeft());
  f["threatsX"] = std::to_string(six::threatWindows(b, six::Player::X).size());
  f["threatsO"] = std::to_string(six::threatWindows(b, six::Player::O).size());
  f["win1"] = std::to_string(over ? 0 : six::countWinningSets(b, mover, 1));
  f["win2"] = std::to_string(over ? 0 : six::countWinningSets(b, mover, 2));
  f["cover"] = std::to_string(oppThreats.empty() ? 0 : six::minCover(b, oppThreats, 2));
  if (playable != b.playableCount()) f["playable"] += "(count mismatch)";
  return f;
}

}  // namespace

namespace {

/** Incremental threat lists and alive-window counts must equal a full rescan of the windows. */
bool incrementalMatchesScan(const six::Board& b, std::string& why) {
  for (six::Player p : {six::Player::X, six::Player::O}) {
    const auto scanned = six::scanThreatWindows(b, p);
    if (static_cast<int>(scanned.size()) != b.threatCount(p)) {
      why = std::string("threat count for ") + six::toChar(p) + " is " + std::to_string(b.threatCount(p)) +
            ", scan says " + std::to_string(scanned.size());
      return false;
    }
    int alive[7] = {};
    for (const six::Window& w : six::activeWindows(b)) {
      if (w.count(six::other(p)) == 0 && w.count(p) > 0) ++alive[w.count(p)];
    }
    if (b.threeCount(p) != alive[3]) {
      why = std::string("three list for ") + six::toChar(p) + " has " + std::to_string(b.threeCount(p)) +
            " windows, scan says " + std::to_string(alive[3]);
      return false;
    }
    if (b.twoCount(p) != alive[2]) {
      why = std::string("two list for ") + six::toChar(p) + " has " + std::to_string(b.twoCount(p)) +
            " windows, scan says " + std::to_string(alive[2]);
      return false;
    }
    for (int k = 1; k <= 6; ++k) {
      if (alive[k] != b.aliveWindows(p, k)) {
        why = std::string("alive windows for ") + six::toChar(p) + " with " + std::to_string(k) + " stones is " +
              std::to_string(b.aliveWindows(p, k)) + ", scan says " + std::to_string(alive[k]);
        return false;
      }
    }
  }
  return true;
}

}  // namespace

TEST_CASE("incremental threat lists and window counts match a rescan, placing and undoing") {
  std::ifstream in(SIX_FIXTURES "/games.txt");
  std::string line;
  six::Board board(9);
  int checked = 0;
  int reported = 0;
  auto verify = [&](const char* when) {
    std::string why;
    if (!incrementalMatchesScan(board, why) && reported++ < 10) {
      six::testing::fail(__FILE__, __LINE__, std::string(when) + " at " + std::to_string(board.stones()) + " stones: " + why);
    }
    ++checked;
  };
  auto unwind = [&]() {
    while (board.stones() > 0) {
      board.undo();
      if (board.stones() % 7 == 0) verify("undo");
    }
  };
  while (std::getline(in, line)) {
    std::istringstream ss(line);
    std::string kind;
    ss >> kind;
    if (kind == "game") {
      unwind();
      int radius = 9;
      std::string id;
      ss >> id >> radius;
      board = six::Board(radius);
    } else if (kind == "stone") {
      int q = 0;
      int r = 0;
      ss >> q >> r;
      board.place({q, r});
      verify("place");
    }
  }
  unwind();
  CHECK(checked > 20000);
}

TEST_CASE("engine agrees with the TypeScript rules on every stone of 240 games") {
  std::ifstream in(SIX_FIXTURES "/games.txt");
  CHECK(in.good());
  std::string line;
  six::Board board(9);
  std::string game = "?";
  int stoneIndex = 0;
  int positions = 0;
  int reported = 0;
  while (std::getline(in, line)) {
    if (line.empty() || line[0] == '#') continue;
    std::istringstream ss(line);
    std::string kind;
    ss >> kind;
    if (kind == "game") {
      int radius = 9;
      ss >> game >> radius;
      board = six::Board(radius);
      stoneIndex = 0;
      continue;
    }
    if (kind == "stone") {
      int q = 0;
      int r = 0;
      ss >> q >> r;
      if (board.place({q, r}) != six::PlaceError::None) {
        six::testing::fail(__FILE__, __LINE__, "game " + game + " stone " + std::to_string(stoneIndex) + " rejected");
        return;
      }
      ++stoneIndex;
    }
    const auto facts = engineFacts(board);
    std::string token;
    while (ss >> token) {
      const auto eq = token.find('=');
      const std::string key = token.substr(0, eq);
      const std::string expected = token.substr(eq + 1);
      const auto it = facts.find(key);
      const std::string actual = it == facts.end() ? "<missing>" : it->second;
      if (actual != expected && reported++ < 20) {
        six::testing::fail(__FILE__, __LINE__,
                           "game " + game + " after stone " + std::to_string(stoneIndex) + ": " + key + " is " +
                               actual + ", TypeScript says " + expected);
      }
    }
    ++positions;
  }
  std::cout << "        checked " << positions << " positions\n";
  CHECK(positions > 10000);
}
