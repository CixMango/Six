#pragma once
// Alpha-beta over whole turns, with exact forced defenses and a window-count or NNUE evaluation.
#include <atomic>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "board.hpp"

namespace six {

namespace nnue {
struct Weights;
}

/** Scores are from the side to move; a win in n turns scores kWinScore - n. */
constexpr int kWinScore = 1'000'000;

// True when the mover (two stones left, facing no threats) can make fours that two stones can't
// all block. Leaves `board` unchanged.
bool hasDoubleFourWin(Board& board);

struct SearchParams {
  int rootThreatTurns = 8;             // double-threat win search at the root
  std::int64_t rootThreatNodes = 20'000;
  std::int64_t replyThreatNodes = 2'000;  // the same depth for the opponent after each root turn (0: node settings)
  int nodeThreatTurns = 2;             // and at quiet nodes inside the tree
  std::int64_t nodeThreatNodes = 16;
  int nodeThreatMaxDepth = 100;        // quiet nodes with more turns of depth left than this skip it
  int genThreatTurns = 0;              // double-threat turns added to each quiet node's moves, searched first
  // With NNUE loaded, order candidates by its policy instead of line counts.
  int nnueOrdering = 1;
  int nnueScale = 4000;                // the NNUE value (-1..1) times this is the search score
  int nnueCheck = 0;                   // tests: recount the accumulator on every evaluation

  bool set(const std::string& name, std::int64_t value);
  std::vector<std::pair<std::string, std::int64_t>> list() const;
};

struct SearchLimits {
  int maxDepth = 64;              // in turns
  std::int64_t maxNodes = -1;     // -1: unlimited
  int moveTimeMs = -1;            // -1: unlimited
};

struct SearchInfo {
  int depth = 0;
  int score = 0;
  std::int64_t nodes = 0;
  int timeMs = 0;
  std::vector<Hex> pv;            // stones of the principal variation, turn by turn
};

struct SearchResult {
  std::vector<Hex> stones;        // the rest of the current turn
  int score = 0;
  int depth = 0;
  std::int64_t nodes = 0;
  int timeMs = 0;
};

class Searcher {
 public:
  explicit Searcher(int ttMegabytes = 64);
  ~Searcher();
  Searcher(const Searcher&) = delete;
  Searcher& operator=(const Searcher&) = delete;

  void newGame();

  SearchParams& params();

  // Null switches back to the line-count evaluation.
  void setNnue(std::shared_ptr<const nnue::Weights> weights);

  // Calls onInfo after each completed depth.
  SearchResult search(const Board& position, const SearchLimits& limits,
                      const std::function<void(const SearchInfo&)>& onInfo = {});

  void stop() { stopRequested_ = true; }

 private:
  struct Impl;
  Impl* impl_;
  std::atomic<bool> stopRequested_{false};
};

}  // namespace six
