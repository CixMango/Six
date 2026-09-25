// Evaluates positions with a Six NNUE weights file, for cross-checking the trainer's PyTorch version.
// Usage: sixnnue <weights> < positions, one per line: "radius q r q r ...".
// Prints per position: the value for the side to move, X's then O's accumulator, and the policy score of every empty
// cell within 2 of the last stone as "q,r:score" (sorted by q, then r).
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "board.hpp"
#include "nnue.hpp"

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: sixnnue <weights> < positions\n";
    return 2;
  }
  const auto weights = six::nnue::Weights::load(argv[1]);
  std::cout << std::setprecision(9);
  std::string line;
  while (std::getline(std::cin, line)) {
    std::istringstream in(line);
    int radius = 9;
    if (!(in >> radius)) continue;
    six::Board board(radius);
    int q = 0;
    int r = 0;
    while (in >> q >> r) {
      if (board.place({q, r}) != six::PlaceError::None) {
        std::cerr << "illegal move in: " << line << "\n";
        return 2;
      }
    }
    six::nnue::Accumulator acc(weights);
    acc.reset(board);
    std::cout << acc.value(board);
    for (const six::Player p : {six::Player::X, six::Player::O}) {
      for (int k = 0; k < weights.dim; ++k) std::cout << ' ' << acc.sum(p)[k];
    }
    std::vector<six::Hex> cells;
    if (board.stones() > 0) {
      const six::Hex last = board.moves().back();
      for (int dq = -2; dq <= 2; ++dq) {
        for (int dr = -2; dr <= 2; ++dr) {
          const six::Hex c{last.q + dq, last.r + dr};
          if (six::hexDistance(c, last) <= 2 && board.at(c) == six::Player::None) cells.push_back(c);
        }
      }
    }
    std::sort(cells.begin(), cells.end(), [](six::Hex a, six::Hex b) { return a.q != b.q ? a.q < b.q : a.r < b.r; });
    for (const six::Hex c : cells) std::cout << ' ' << c.q << ',' << c.r << ':' << acc.policy(board, c);
    std::cout << '\n';
  }
  return 0;
}
