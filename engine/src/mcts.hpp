#pragma once
// PUCT MCTS with one tree ply per stone and batched leaf evaluation with virtual loss. Exact tactics
// (wins, unblockable threats, forced blocks, threat-solver wins) override the network.
#include <atomic>
#include <cstdint>
#include <functional>
#include <memory>
#include <random>
#include <string>
#include <utility>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "search.hpp"

namespace six {

// setoption takes integers, so fractional settings are given in thousandths.
struct MctsParams {
  float cpuct = 1.5f;
  float fpuReduction = 0.25f;
  int batch = 32;
  int maxChildren = 40;                 // top cells by prior
  std::int64_t leafThreatNodes = 64;    // threat-solver budget per new leaf (0: off)
  std::int64_t rootThreatNodes = 20'000;
  int secondStoneShare = 25;            // percent of the turn spent re-searching after the first stone
  std::int64_t cacheEntries = 1 << 15;  // expansion cache, rounded down to a power of two (0: off)
  bool reuseTree = true;

  bool set(const std::string& name, std::int64_t value);
  std::vector<std::pair<std::string, std::int64_t>> list() const;
};

struct StoneChoice {
  Hex move;
  float value = 0.0f;                         // search value for the side to move
  std::vector<std::pair<Hex, float>> policy;  // improved policy, entries >= 1e-4
  bool decided = false;                       // forced by tactics or a single candidate; no policy target
  int visits = 0;
  float surprise = 0.0f;                      // KL(improved policy || network prior)
};

class Mcts {
 public:
  explicit Mcts(NetworkEvaluator& evaluator, int solverMegabytes = 16);
  ~Mcts();
  Mcts(const Mcts&) = delete;
  Mcts& operator=(const Mcts&) = delete;

  void newGame();
  MctsParams& params();

  SearchResult search(const Board& position, const SearchLimits& limits,
                      const std::function<void(const SearchInfo&)>& onInfo = {});

  // Self-play: Gumbel top-m with sequential halving at the root (Danihelka et al., 2022), PUCT
  // below. `simulations` includes the root evaluation.
  StoneChoice searchStone(const Board& position, int simulations, int sampledActions, std::mt19937_64& rng);

  void stop() { stopRequested_ = true; }

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
  std::atomic<bool> stopRequested_{false};
};

}  // namespace six
