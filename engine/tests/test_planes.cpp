#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#include "board.hpp"
#include "planes.hpp"
#include "print.hpp"
#include "testing.hpp"

using six::Board;
using six::Hex;

TEST_CASE("planes: match the trainer's planes on every fixture position") {
  std::ifstream in(SIX_FIXTURES "/planes.txt");
  CHECK(in.good());
  std::string line;
  std::vector<float> planes(six::kPlaneCount * six::kCropCells);
  Board board(9);
  Hex center;
  int positions = 0;
  int mismatches = 0;
  while (std::getline(in, line)) {
    std::istringstream ss(line);
    std::string kind;
    ss >> kind;
    if (kind == "position") {
      int radius = 9;
      int stones = 0;
      ss >> radius >> stones;
      board = Board(radius);
      for (int i = 0; i < stones; ++i) {
        int q = 0;
        int r = 0;
        ss >> q >> r;
        board.place({q, r});
      }
      center = six::fillPlanes(board, planes.data());
      ++positions;
    } else if (kind == "center") {
      int q = 0;
      int r = 0;
      ss >> q >> r;
      CHECK_EQ(center, (Hex{q, r}));
    } else if (kind == "plane") {
      int p = 0;
      std::string hex;
      ss >> p >> hex;
      for (int index = 0; index < six::kCropCells; ++index) {
        const int byte = std::stoi(hex.substr(static_cast<std::size_t>(index / 8) * 2, 2), nullptr, 16);
        const float want = ((byte >> (index % 8)) & 1) ? 1.0f : 0.0f;
        if (planes[static_cast<std::size_t>(p * six::kCropCells + index)] != want && ++mismatches <= 5) {
          six::testing::fail(__FILE__, __LINE__,
                             "position " + std::to_string(positions) + " plane " + std::to_string(p) + " cell " + std::to_string(index));
        }
      }
    }
  }
  CHECK(positions > 500);
  CHECK_EQ(mismatches, 0);
}

TEST_CASE("planes: crop centre rounds half up, negatives included") {
  CHECK_EQ(six::cropCenter({{0, 0}, {1, 0}}), (Hex{1, 0}));
  CHECK_EQ(six::cropCenter({{0, 0}, {-1, 0}}), (Hex{0, 0}));
  CHECK_EQ(six::cropCenter({{5, 5}, {-3, -3}, {-3, -3}, {-4, -4}, {-4, -4}}), (Hex{-3, -3}));
  const Hex c{-7, 3};
  for (int index = 0; index < six::kCropCells; index += 37) CHECK_EQ(six::cropIndex(six::cropCell(index, c), c), index);
  CHECK_EQ(six::cropIndex({c.q + 13, c.r}, c), -1);
}
