// Prints search progress per depth for a position, to measure speed and node counts.
// Usage: sixbench <maxDepth> <movetimeMs> q r q r ...
#include <cstdlib>
#include <iostream>

#include "board.hpp"
#include "search.hpp"

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: sixbench <maxDepth> <movetimeMs> [q r ...]\n";
    return 2;
  }
  six::Board board(9);
  for (int i = 3; i + 1 < argc; i += 2) {
    if (board.place({std::atoi(argv[i]), std::atoi(argv[i + 1])}) != six::PlaceError::None) {
      std::cerr << "illegal move at argument " << i << "\n";
      return 2;
    }
  }
  six::Searcher searcher(64);
  six::SearchLimits limits;
  limits.maxDepth = std::atoi(argv[1]);
  limits.moveTimeMs = std::atoi(argv[2]);
  const auto result = searcher.search(board, limits, [](const six::SearchInfo& info) {
    std::cout << "depth " << info.depth << " score " << info.score << " nodes " << info.nodes << " time " << info.timeMs
              << " ms  nps " << (info.timeMs > 0 ? info.nodes * 1000 / info.timeMs : 0) << "\n";
  });
  std::cout << "bestmove";
  for (const auto& h : result.stones) std::cout << " " << h.q << " " << h.r;
  std::cout << "  (depth " << result.depth << ", " << result.nodes << " nodes, " << result.timeMs << " ms)\n";
  return 0;
}
