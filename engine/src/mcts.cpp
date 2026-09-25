#include "mcts.hpp"

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <limits>
#include <random>
#include <stdexcept>
#include <vector>

#include "planes.hpp"
#include "tactics.hpp"
#include "threats.hpp"

namespace six {
namespace {

using Clock = std::chrono::steady_clock;

constexpr std::uint8_t kUnexpanded = 0;
constexpr std::uint8_t kPending = 1;
constexpr std::uint8_t kExpanded = 2;
constexpr std::uint8_t kTerminal = 3;
constexpr std::uint8_t kDead = 4;  // the board refused the stone (only at the window edge)
constexpr std::size_t kMaxNodes = 6'000'000;
constexpr int kLeafThreatTurns = 2;
constexpr int kCacheChildren = 64;

struct Node {
  Hex move;                      // the stone that led here
  Player placer = Player::None;  // who placed it (None at the root)
  float prior = 0.0f;
  float netValue = 0.0f;         // network value for the side to move here, once evaluated
  float valueSum = 0.0f;         // backed-up values from the placer's view
  float terminalValue = 0.0f;    // exact value from the placer's view, when terminal
  std::int32_t visits = 0;
  std::int32_t pending = 0;      // virtual losses from leaves awaiting evaluation
  std::int32_t firstChild = -1;
  std::int16_t childCount = 0;
  std::uint8_t state = kUnexpanded;
};

struct Tactics {
  bool terminal = false;
  float value = 0.0f;         // for the side to move, when terminal
  std::vector<Hex> forced;    // when non-empty, this turn must place a stone among these cells
  std::vector<Hex> winning;   // the stones of a win found here
};

Tactics analyze(Board& board, ThreatSolver& solver, std::int64_t solverNodes, int solverTurns,
                Clock::time_point deadline = Clock::time_point::max()) {
  Tactics t;
  const Player me = board.current();
  const Player opp = other(me);
  const int stones = board.stonesLeft();
  for (const Window& w : threatWindows(board, me)) {
    if (w.count(me) < kWinLength - stones) continue;
    std::vector<Hex> cells;
    bool reachable = true;
    for (int i = 0; i < kWinLength; ++i) {
      if (board.at(w.cell(i)) != Player::None) continue;
      reachable = reachable && board.canPlace(w.cell(i)) == PlaceError::None;
      cells.push_back(w.cell(i));
    }
    if (!reachable) continue;  // only at the edge of the board window
    t.terminal = true;
    t.value = 1.0f;
    t.winning = std::move(cells);
    return t;
  }
  const std::vector<Window> theirs = threatWindows(board, opp);
  if (!theirs.empty()) {
    if (minCover(board, theirs, stones) > stones) {
      t.terminal = true;
      t.value = -1.0f;
      return t;
    }
    // Some stone of this turn must block; the order of a turn's stones doesn't matter, so block first.
    for (const Window& w : theirs) {
      for (int i = 0; i < kWinLength; ++i) {
        const Hex c = w.cell(i);
        if (board.canPlace(c) == PlaceError::None && std::find(t.forced.begin(), t.forced.end(), c) == t.forced.end()) t.forced.push_back(c);
      }
    }
    if (t.forced.empty()) {
      // Every block is beyond the board window's reach: as good as lost.
      t.terminal = true;
      t.value = -1.0f;
    }
    return t;
  }
  if (stones == 2 && solverNodes > 0) {
    const ThreatWin win = solver.solve(board, solverTurns, solverNodes, deadline);
    if (win.found) {
      t.terminal = true;
      t.value = 1.0f;
      t.winning = {win.a, win.b};
    }
  }
  return t;
}

struct Candidate {
  Hex cell;
  int index;  // crop index, or -1 outside the crop
};

// Lets a transposition or a later search skip the network.
struct CachedExpansion {
  std::uint64_t key = 0;
  float value = 0.0f;
  int count = 0;
  std::array<Hex, kCacheChildren> moves;
  std::array<float, kCacheChildren> priors;
};

struct Leaf {
  std::int32_t node = -1;
  std::uint64_t key = 0;
  std::vector<std::int32_t> path;  // nodes below the search root, down to the leaf
  std::vector<Candidate> candidates;
  Player mover = Player::None;
};

}  // namespace

bool MctsParams::set(const std::string& name, std::int64_t value) {
  if (name == "cpuct") cpuct = static_cast<float>(value) / 1000.0f;
  else if (name == "fpuReduction") fpuReduction = static_cast<float>(value) / 1000.0f;
  else if (name == "batch") batch = static_cast<int>(std::clamp<std::int64_t>(value, 1, 1024));
  else if (name == "maxChildren") maxChildren = static_cast<int>(std::clamp<std::int64_t>(value, 1, 400));
  else if (name == "leafThreatNodes") leafThreatNodes = value;
  else if (name == "rootThreatNodes") rootThreatNodes = value;
  else if (name == "rootThreatTurns") rootThreatTurns = static_cast<int>(std::clamp<std::int64_t>(value, 1, 40));
  else if (name == "rootSolverShare") rootSolverShare = static_cast<int>(std::clamp<std::int64_t>(value, 1, 90));
  else if (name == "secondStoneShare") secondStoneShare = static_cast<int>(std::clamp<std::int64_t>(value, 0, 90));
  else if (name == "cacheEntries") cacheEntries = std::clamp<std::int64_t>(value, 0, std::int64_t{1} << 24);
  else if (name == "reuseTree") reuseTree = value != 0;
  else return false;
  return true;
}

std::vector<std::pair<std::string, std::int64_t>> MctsParams::list() const {
  return {{"cpuct", std::lround(cpuct * 1000.0f)},
          {"fpuReduction", std::lround(fpuReduction * 1000.0f)},
          {"batch", batch},
          {"maxChildren", maxChildren},
          {"leafThreatNodes", leafThreatNodes},
          {"rootThreatNodes", rootThreatNodes},
          {"rootThreatTurns", rootThreatTurns},
          {"rootSolverShare", rootSolverShare},
          {"secondStoneShare", secondStoneShare},
          {"cacheEntries", cacheEntries},
          {"reuseTree", reuseTree ? 1 : 0}};
}

struct Mcts::Impl {
  NetworkEvaluator& evaluator;
  MctsParams params;
  ThreatSolver solver;
  Board board{9};
  std::vector<Node> nodes;
  std::vector<Leaf> leaves;
  std::vector<float> planes;
  std::vector<NetOutput> outputs;
  std::vector<CachedExpansion> cache;
  std::int64_t cacheHits = 0;
  // Where the last play search ended, so the next search can reuse the tree.
  std::vector<Hex> treeMoves;
  int treeRadius = 0;
  std::int32_t treeRoot = -1;
  const std::atomic<bool>* stop = nullptr;
  Clock::time_point deadline = Clock::time_point::max();
  int maxDepth = 0;

  Impl(NetworkEvaluator& e, int solverMegabytes) : evaluator(e), solver(solverMegabytes) {}

  void prepareCache() {
    std::size_t size = 0;
    if (params.cacheEntries > 0) {
      size = 1;
      while (size * 2 <= static_cast<std::size_t>(params.cacheEntries)) size *= 2;
    }
    if (cache.size() != size) cache.assign(size, CachedExpansion{});
  }

  // Radius is mixed in because it changes the legal cells.
  std::uint64_t positionKey() const {
    return board.hash() ^ (0x9e3779b97f4a7c15ull * static_cast<std::uint64_t>(board.radius()));
  }

  bool expandFromCache(std::int32_t node, const std::vector<std::int32_t>& path, std::int32_t root) {
    if (cache.empty()) return false;
    const std::uint64_t key = positionKey();
    const CachedExpansion& e = cache[key & (cache.size() - 1)];
    if (e.key != key || e.count == 0) return false;
    const Player mover = board.current();
    const auto first = static_cast<std::int32_t>(nodes.size());
    for (int k = 0; k < e.count; ++k) {
      Node child;
      child.move = e.moves[static_cast<std::size_t>(k)];
      child.placer = mover;
      child.prior = e.priors[static_cast<std::size_t>(k)];
      nodes.push_back(child);
    }
    Node& n = nodes[static_cast<std::size_t>(node)];
    n.netValue = e.value;
    n.state = kExpanded;
    n.firstChild = first;
    n.childCount = static_cast<std::int16_t>(e.count);
    backup(path, root, mover, e.value, false);
    ++cacheHits;
    return true;
  }

  void backup(const std::vector<std::int32_t>& path, std::int32_t root, Player valuePlayer, float value, bool wasPending) {
    for (const std::int32_t index : path) {
      Node& n = nodes[static_cast<std::size_t>(index)];
      n.visits += 1;
      n.valueSum += n.placer == valuePlayer ? value : -value;
      if (wasPending) n.pending -= 1;
    }
    Node& r = nodes[static_cast<std::size_t>(root)];
    r.visits += 1;
    if (wasPending) r.pending -= 1;
  }

  std::int32_t selectChild(const Node& parent) const {
    const float sqrtVisits = std::sqrt(static_cast<float>(std::max(1, parent.visits + parent.pending)));
    const float fpu = parent.netValue - params.fpuReduction;
    std::int32_t best = -1;
    float bestScore = -std::numeric_limits<float>::infinity();
    for (std::int32_t i = 0; i < parent.childCount; ++i) {
      const std::int32_t index = parent.firstChild + i;
      const Node& c = nodes[static_cast<std::size_t>(index)];
      if (c.state == kDead) continue;
      const int n = c.visits + c.pending;
      float q = n > 0 ? (c.valueSum - static_cast<float>(c.pending)) / static_cast<float>(n) : fpu;
      if (c.state == kTerminal) q = c.terminalValue;
      const float score = q + params.cpuct * c.prior * sqrtVisits / (1.0f + static_cast<float>(n));
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    }
    return best;
  }

  // Descends to a leaf (through `firstChild` if given). False on a collision with a pending leaf.
  bool gather(std::int32_t root, std::int32_t firstChild = -1) {
    std::vector<std::int32_t> path;
    std::int32_t current = root;
    int placed = 0;
    while (nodes[static_cast<std::size_t>(current)].state == kExpanded) {
      const std::int32_t child = placed == 0 && firstChild >= 0 ? firstChild : selectChild(nodes[static_cast<std::size_t>(current)]);
      if (child < 0) break;
      if (board.place(nodes[static_cast<std::size_t>(child)].move) != PlaceError::None) {
        // The board wouldn't take it after all (its window can't hold a game this wide): drop that branch.
        nodes[static_cast<std::size_t>(child)].state = kDead;
        for (int i = 0; i < placed; ++i) board.undo();
        return false;
      }
      ++placed;
      path.push_back(child);
      current = child;
    }
    maxDepth = std::max(maxDepth, placed);
    const auto takeBack = [&]() {
      for (int i = 0; i < placed; ++i) board.undo();
    };
    Node& leaf = nodes[static_cast<std::size_t>(current)];
    if (leaf.state == kPending) {
      takeBack();
      return false;
    }
    if (leaf.state == kUnexpanded && board.winner() != Player::None) {
      leaf.state = kTerminal;
      leaf.terminalValue = 1.0f;  // its placer just made six
    }
    if (leaf.state == kUnexpanded) {
      const Tactics t = analyze(board, solver, params.leafThreatNodes, kLeafThreatTurns, deadline);
      // The search root is always expanded, even when lost, so there is a move to return.
      if (t.terminal && current != root) {
        leaf.state = kTerminal;
        leaf.terminalValue = board.current() == leaf.placer ? t.value : -t.value;
      } else if (expandFromCache(current, path, root)) {
        takeBack();
        return true;
      } else {
        queue(current, std::move(path), t);
        takeBack();
        return true;
      }
    }
    const Node& done = nodes[static_cast<std::size_t>(current)];
    if (done.state == kTerminal) backup(path, root, done.placer, done.terminalValue, false);
    takeBack();
    return true;
  }

  void queue(std::int32_t node, std::vector<std::int32_t> path, const Tactics& t) {
    Leaf leaf;
    leaf.node = node;
    leaf.key = positionKey();
    leaf.mover = board.current();
    const std::size_t slot = leaves.size();
    if (planes.size() < (slot + 1) * kPlaneCount * kCropCells) planes.resize((slot + 1) * kPlaneCount * kCropCells);
    const float* legal = planes.data() + slot * kPlaneCount * kCropCells + 3 * kCropCells;
    const Hex center = fillPlanes(board, planes.data() + slot * kPlaneCount * kCropCells);
    if (!t.forced.empty()) {
      for (const Hex& c : t.forced) leaf.candidates.push_back({c, cropIndex(c, center)});
    } else {
      for (int index = 0; index < kCropCells; ++index) {
        if (legal[index] > 0.5f) leaf.candidates.push_back({cropCell(index, center), index});
      }
    }
    nodes[static_cast<std::size_t>(node)].state = kPending;
    for (const std::int32_t index : path) nodes[static_cast<std::size_t>(index)].pending += 1;
    leaf.path = std::move(path);
    leaves.push_back(std::move(leaf));
  }

  void flush(std::int32_t root) {
    if (leaves.empty()) return;
    nodes[static_cast<std::size_t>(root)].pending += static_cast<std::int32_t>(leaves.size());
    outputs.resize(leaves.size());
    evaluator.evaluate(planes.data(), static_cast<int>(leaves.size()), outputs.data());
    std::vector<std::pair<float, Hex>> ranked;
    for (std::size_t i = 0; i < leaves.size(); ++i) {
      const Leaf& leaf = leaves[i];
      const NetOutput& out = outputs[i];
      ranked.clear();
      float top = -std::numeric_limits<float>::infinity();
      for (const Candidate& c : leaf.candidates) top = std::max(top, c.index >= 0 ? out.policy[static_cast<std::size_t>(c.index)] : top);
      if (!std::isfinite(top)) top = 0.0f;
      for (const Candidate& c : leaf.candidates) {
        // Cells outside the crop (only forced blocks) get the weakest in-crop logit.
        const float logit = c.index >= 0 ? out.policy[static_cast<std::size_t>(c.index)] : top - 8.0f;
        ranked.push_back({std::exp(logit - top), c.cell});
      }
      const std::size_t keep = std::min(ranked.size(), static_cast<std::size_t>(params.maxChildren));
      std::partial_sort(ranked.begin(), ranked.begin() + static_cast<std::ptrdiff_t>(keep), ranked.end(), [](const auto& a, const auto& b) {
        return a.first != b.first ? a.first > b.first : (a.second.q != b.second.q ? a.second.q < b.second.q : a.second.r < b.second.r);
      });
      float total = 0.0f;
      for (std::size_t k = 0; k < keep; ++k) total += ranked[k].first;
      const auto first = static_cast<std::int32_t>(nodes.size());
      for (std::size_t k = 0; k < keep; ++k) {
        Node child;
        child.move = ranked[k].second;
        child.placer = leaf.mover;
        child.prior = total > 0.0f ? ranked[k].first / total : 1.0f / static_cast<float>(keep);
        nodes.push_back(child);
      }
      if (!cache.empty() && keep > 0 && keep <= static_cast<std::size_t>(kCacheChildren)) {
        CachedExpansion& e = cache[leaf.key & (cache.size() - 1)];
        e.key = leaf.key;
        e.value = out.value;
        e.count = static_cast<int>(keep);
        for (std::size_t k = 0; k < keep; ++k) {
          e.moves[k] = nodes[static_cast<std::size_t>(first) + k].move;
          e.priors[k] = nodes[static_cast<std::size_t>(first) + k].prior;
        }
      }
      Node& n = nodes[static_cast<std::size_t>(leaf.node)];
      n.netValue = out.value;
      if (keep == 0) {
        n.state = kTerminal;
        n.terminalValue = n.placer == leaf.mover ? out.value : -out.value;
      } else {
        n.state = kExpanded;
        n.firstChild = first;
        n.childCount = static_cast<std::int16_t>(keep);
      }
      backup(leaf.path, root, leaf.mover, out.value, true);
    }
    leaves.clear();
  }

  void run(std::int32_t root, Clock::time_point until, std::int64_t visitCap) {
    while (true) {
      if (stop && stop->load()) return;
      if (Clock::now() >= until) return;
      if (visitCap >= 0 && nodes[static_cast<std::size_t>(root)].visits >= visitCap) return;
      if (nodes.size() > kMaxNodes) return;
      for (int i = 0; i < params.batch; ++i) {
        if (!gather(root)) break;
        if (visitCap >= 0 && nodes[static_cast<std::size_t>(root)].visits + static_cast<std::int64_t>(leaves.size()) >= visitCap) break;
      }
      flush(root);
    }
  }

  float childQ(const Node& c) const {
    if (c.state == kTerminal) return c.terminalValue;
    return c.visits > 0 ? c.valueSum / static_cast<float>(c.visits) : 0.0f;
  }

  // logits + sigma(completed Q), following mctx's qtransform_completed_by_mix_value: Q rescaled to
  // [0, 1] across children, sigma = (50 + max visits) * 0.1 * rescaled Q.
  std::vector<float> improvedLogits(const std::vector<float>& logits, std::int32_t firstChild, int count) const {
    const std::vector<float> completed = completedQ(firstChild, count);
    int maxVisits = 0;
    for (int i = 0; i < count; ++i) maxVisits = std::max(maxVisits, nodes[static_cast<std::size_t>(firstChild + i)].visits);
    float low = std::numeric_limits<float>::infinity();
    float high = -std::numeric_limits<float>::infinity();
    for (const float q : completed) {
      low = std::min(low, q);
      high = std::max(high, q);
    }
    const float scale = (50.0f + static_cast<float>(maxVisits)) * 0.1f / std::max(high - low, 1e-6f);
    std::vector<float> out(static_cast<std::size_t>(count));
    for (int i = 0; i < count; ++i) {
      out[static_cast<std::size_t>(i)] = logits[static_cast<std::size_t>(i)] + scale * (completed[static_cast<std::size_t>(i)] - low);
    }
    return out;
  }

  // Unvisited children get the mixed value estimate.
  std::vector<float> completedQ(std::int32_t firstChild, int count) const {
    int visitSum = 0;
    float priorSum = 0.0f;
    float weightedQ = 0.0f;
    for (int i = 0; i < count; ++i) {
      const Node& c = nodes[static_cast<std::size_t>(firstChild + i)];
      visitSum += c.visits;
      if (c.visits > 0) {
        priorSum += c.prior;
        weightedQ += c.prior * childQ(c);
      }
    }
    const float mixed = (nodes[0].netValue + (priorSum > 0.0f ? static_cast<float>(visitSum) * weightedQ / priorSum : 0.0f)) /
                        (1.0f + static_cast<float>(visitSum));
    std::vector<float> completed(static_cast<std::size_t>(count));
    for (int i = 0; i < count; ++i) {
      const Node& c = nodes[static_cast<std::size_t>(firstChild + i)];
      completed[static_cast<std::size_t>(i)] = c.visits > 0 || c.state == kTerminal ? childQ(c) : mixed;
    }
    return completed;
  }

  void simulate(std::int32_t child) {
    if (!gather(0, child)) {
      flush(0);
      gather(0, child);
    }
    if (static_cast<int>(leaves.size()) >= params.batch) flush(0);
  }

  StoneChoice searchStone(int simulations, int sampledActions, std::mt19937_64& rng) {
    StoneChoice choice;
    prepareCache();
    treeRoot = -1;  // self-play searches start fresh trees
    nodes.clear();
    leaves.clear();
    maxDepth = 0;
    nodes.push_back(Node{});
    const Tactics tactics = analyze(board, solver, params.rootThreatNodes, params.rootThreatTurns);
    if (tactics.terminal && tactics.value > 0.0f) {
      choice.move = tactics.winning.front();
      choice.value = 1.0f;
      choice.decided = true;
      return choice;
    }
    gather(0);
    flush(0);
    const Node& root = nodes[0];
    const int count = root.state == kExpanded ? root.childCount : 0;
    if (count == 0) {
      throw std::logic_error("self-play search found no candidate stone");
    }
    if (count == 1 || tactics.terminal) {
      // A single candidate, or a lost position: nothing here teaches the policy.
      choice.move = nodes[static_cast<std::size_t>(root.firstChild)].move;
      choice.value = tactics.terminal ? -1.0f : root.netValue;
      choice.decided = true;
      return choice;
    }

    // Gumbel top-m: sample the actions to consider, then halve them while spending the simulations.
    std::extreme_value_distribution<float> gumbelNoise(0.0f, 1.0f);
    std::vector<float> logits(static_cast<std::size_t>(count));
    std::vector<float> gumbel(static_cast<std::size_t>(count));
    std::vector<int> remaining(static_cast<std::size_t>(count));
    for (int i = 0; i < count; ++i) {
      logits[static_cast<std::size_t>(i)] = std::log(std::max(nodes[static_cast<std::size_t>(root.firstChild + i)].prior, 1e-12f));
      gumbel[static_cast<std::size_t>(i)] = gumbelNoise(rng);
      remaining[static_cast<std::size_t>(i)] = i;
    }
    remaining.erase(std::remove_if(remaining.begin(), remaining.end(), [&](int i) {
                      return nodes[static_cast<std::size_t>(root.firstChild + i)].state == kDead;
                    }), remaining.end());
    if (remaining.empty()) throw std::logic_error("self-play search has no playable stone");
    std::sort(remaining.begin(), remaining.end(), [&](int a, int b) {
      return gumbel[static_cast<std::size_t>(a)] + logits[static_cast<std::size_t>(a)] > gumbel[static_cast<std::size_t>(b)] + logits[static_cast<std::size_t>(b)];
    });
    remaining.resize(static_cast<std::size_t>(std::min(count, std::max(1, sampledActions))));
    const std::int32_t firstChild = nodes[0].firstChild;
    const int phases = std::max(1, static_cast<int>(std::ceil(std::log2(static_cast<double>(remaining.size())))));
    for (int phase = 0; phase < phases && remaining.size() > 1; ++phase) {
      const int left = std::max(0, simulations - nodes[0].visits);
      const int perAction = std::max(1, left / ((phases - phase) * static_cast<int>(remaining.size())));
      for (int rep = 0; rep < perAction; ++rep) {
        for (const int i : remaining) simulate(firstChild + i);
      }
      flush(0);
      const std::vector<float> improved = improvedLogits(logits, firstChild, count);
      const auto score = [&](int i) { return gumbel[static_cast<std::size_t>(i)] + improved[static_cast<std::size_t>(i)]; };
      std::sort(remaining.begin(), remaining.end(), [&](int a, int b) { return score(a) > score(b); });
      remaining.resize((remaining.size() + 1) / 2);
    }
    const Node& chosen = nodes[static_cast<std::size_t>(firstChild + remaining.front())];
    choice.move = chosen.move;

    // Training target: softmax(logits + sigma(completed Q)).
    std::vector<float> improved = improvedLogits(logits, firstChild, count);
    float top = -std::numeric_limits<float>::infinity();
    for (const float x : improved) top = std::max(top, x);
    float total = 0.0f;
    for (float& x : improved) {
      x = std::exp(x - top);
      total += x;
    }
    // Value under the improved policy. The plain mean is pessimistic, since sequential halving spends
    // many simulations on weak actions.
    const std::vector<float> completed = completedQ(firstChild, count);
    choice.value = 0.0f;
    for (int i = 0; i < count; ++i) {
      const float p = improved[static_cast<std::size_t>(i)] / total;
      choice.value += p * completed[static_cast<std::size_t>(i)];
      const float prior = nodes[static_cast<std::size_t>(firstChild + i)].prior;
      if (p > 0.0f) choice.surprise += p * std::log(p / std::max(prior, 1e-12f));
      if (p >= 1e-4f && nodes[static_cast<std::size_t>(firstChild + i)].state != kDead) {
        choice.policy.push_back({nodes[static_cast<std::size_t>(firstChild + i)].move, p});
      }
    }
    choice.visits = nodes[0].visits;
    return choice;
  }

  // Follows the stones played since the last search into the kept tree; -1 if not found.
  std::int32_t reusableRoot(const Board& position) const {
    if (!params.reuseTree || treeRoot < 0 || position.radius() != treeRadius) return -1;
    const std::vector<Hex>& moves = position.moves();
    if (moves.size() < treeMoves.size() || !std::equal(treeMoves.begin(), treeMoves.end(), moves.begin())) return -1;
    std::int32_t node = treeRoot;
    for (std::size_t i = treeMoves.size(); i < moves.size(); ++i) {
      const Node& parent = nodes[static_cast<std::size_t>(node)];
      if (parent.state != kExpanded) return -1;
      std::int32_t next = -1;
      for (std::int32_t k = 0; k < parent.childCount && next < 0; ++k) {
        if (nodes[static_cast<std::size_t>(parent.firstChild + k)].move == moves[i]) next = parent.firstChild + k;
      }
      if (next < 0) return -1;
      node = next;
    }
    const Node& found = nodes[static_cast<std::size_t>(node)];
    return found.state == kExpanded && found.pending == 0 ? node : -1;
  }

  // Compacts the subtree under `root` to the front of the node list and drops the rest.
  void compact(std::int32_t root) {
    std::vector<Node> kept;
    kept.reserve(1 << 20);
    kept.push_back(nodes[static_cast<std::size_t>(root)]);
    for (std::size_t i = 0; i < kept.size(); ++i) {
      if (kept[i].state != kExpanded) continue;
      const std::int32_t from = kept[i].firstChild;
      const int count = kept[i].childCount;
      kept[i].firstChild = static_cast<std::int32_t>(kept.size());
      for (int k = 0; k < count; ++k) kept.push_back(nodes[static_cast<std::size_t>(from + k)]);
    }
    nodes.swap(kept);
  }

  std::int32_t mostVisited(std::int32_t parent) const {
    const Node& p = nodes[static_cast<std::size_t>(parent)];
    std::int32_t best = -1;
    for (std::int32_t i = 0; i < p.childCount; ++i) {
      const std::int32_t index = p.firstChild + i;
      const Node& c = nodes[static_cast<std::size_t>(index)];
      if (c.state == kDead) continue;
      if (best < 0) {
        best = index;
        continue;
      }
      const Node& b = nodes[static_cast<std::size_t>(best)];
      // Proven wins first, then visits, then prior.
      const bool cWins = c.state == kTerminal && c.terminalValue > 0.5f;
      const bool bWins = b.state == kTerminal && b.terminalValue > 0.5f;
      if (cWins != bWins ? cWins : (c.visits != b.visits ? c.visits > b.visits : c.prior > b.prior)) best = index;
    }
    return best;
  }
};

Mcts::Mcts(NetworkEvaluator& evaluator, int solverMegabytes) : impl_(std::make_unique<Impl>(evaluator, solverMegabytes)) {}

Mcts::~Mcts() = default;

void Mcts::newGame() {
  impl_->solver.clear();
  impl_->treeRoot = -1;
}

MctsParams& Mcts::params() { return impl_->params; }

StoneChoice Mcts::searchStone(const Board& position, int simulations, int sampledActions, std::mt19937_64& rng) {
  Impl& s = *impl_;
  stopRequested_ = false;
  s.stop = &stopRequested_;
  s.deadline = Clock::time_point::max();
  s.board = position;
  s.board.setSearchMode(false);
  return s.searchStone(simulations, sampledActions, rng);
}

SearchResult Mcts::search(const Board& position, const SearchLimits& limits, const std::function<void(const SearchInfo&)>& onInfo) {
  Impl& s = *impl_;
  stopRequested_ = false;
  s.stop = &stopRequested_;
  const auto started = Clock::now();
  SearchResult result;
  if (position.winner() != Player::None) return result;
  if (position.stones() == 0) {
    result.stones = {{0, 0}};
    return result;
  }
  s.board = position;
  s.board.setSearchMode(false);

  const auto total = limits.moveTimeMs >= 0 ? std::chrono::milliseconds(limits.moveTimeMs) : std::chrono::milliseconds(24 * 3600 * 1000);
  s.deadline = started + total;
  const Tactics rootTactics = analyze(s.board, s.solver, s.params.rootThreatNodes, s.params.rootThreatTurns,
                                      started + total * s.params.rootSolverShare / 100);
  if (rootTactics.terminal && rootTactics.value > 0.0f) {
    result.stones = rootTactics.winning;
    if (static_cast<int>(result.stones.size()) > s.board.stonesLeft()) result.stones.resize(static_cast<std::size_t>(s.board.stonesLeft()));
    result.score = kWinScore;
    result.depth = 1;
    return result;
  }

  s.prepareCache();
  s.leaves.clear();
  s.maxDepth = 0;
  // Reuse the previous turn's tree when this position is in it.
  std::int32_t root = s.reusableRoot(position);
  if (root > 0) s.compact(root);
  if (root >= 0 && s.nodes.size() <= kMaxNodes / 2) {
    root = 0;
  } else {
    s.nodes.clear();
    s.nodes.reserve(1 << 20);
    s.nodes.push_back(Node{});
    root = 0;
  }
  const std::int64_t visitCap = limits.maxNodes;
  const bool twoStones = s.board.stonesLeft() == 2;
  const int share = twoStones ? s.params.secondStoneShare : 0;
  const auto firstDeadline = started + total * (100 - share) / 100;
  const std::int64_t firstCap = visitCap >= 0 ? std::max<std::int64_t>(1, visitCap * (100 - share) / 100) : -1;

  s.run(root, firstDeadline, firstCap);
  s.treeRoot = root;
  s.treeMoves = position.moves();
  s.treeRadius = position.radius();
  const std::int32_t first = s.mostVisited(root);
  if (first < 0) {
    // Nothing could be expanded (every candidate is lost): fall back to the forced cells or any legal stone.
    return result;
  }
  const Node& a = s.nodes[static_cast<std::size_t>(first)];
  result.stones.push_back(a.move);
  const float rootValue = a.visits > 0 ? a.valueSum / static_cast<float>(a.visits) : a.netValue;

  bool won = false;
  if (twoStones) {
    s.board.place(a.move);
    won = s.board.winner() != Player::None;
    if (!won) {
      const Tactics next = analyze(s.board, s.solver, 0, kLeafThreatTurns);
      if (next.terminal && next.value > 0.0f && !next.winning.empty()) {
        result.stones.push_back(next.winning.front());
      } else if (s.nodes[static_cast<std::size_t>(first)].state != kTerminal) {
        // Re-search from the chosen first stone, keeping its subtree.
        s.run(first, started + total, visitCap);
        const std::int32_t second = s.mostVisited(first);
        if (second >= 0) result.stones.push_back(s.nodes[static_cast<std::size_t>(second)].move);
      }
    }
    s.board.undo();
  }
  if (twoStones && !won && result.stones.size() == 1) {
    // Still one stone short (the chosen first stone's subtree is lost or empty): take the best legal cell by prior.
    s.board.place(result.stones[0]);
    {
      std::vector<float> planes(kPlaneCount * kCropCells);
      const Hex center = fillPlanes(s.board, planes.data());
      NetOutput out;
      s.evaluator.evaluate(planes.data(), 1, &out);
      int best = -1;
      for (int i = 0; i < kCropCells; ++i) {
        if (planes[static_cast<std::size_t>(3 * kCropCells + i)] > 0.5f && (best < 0 || out.policy[static_cast<std::size_t>(i)] > out.policy[static_cast<std::size_t>(best)])) best = i;
      }
      if (best >= 0) result.stones.push_back(cropCell(best, center));
    }
    s.board.undo();
  }

  result.score = static_cast<int>(std::lround(rootValue * 1000.0f));
  result.depth = s.maxDepth;
  result.nodes = s.nodes[static_cast<std::size_t>(root)].visits;
  result.timeMs = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - started).count());
  if (onInfo) {
    SearchInfo info;
    info.depth = result.depth;
    info.score = result.score;
    info.nodes = result.nodes;
    info.timeMs = result.timeMs;
    info.pv = result.stones;
    onInfo(info);
  }
  return result;
}

}  // namespace six
