#include <cmath>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "planes.hpp"
#include "testing.hpp"

namespace {

/** The first `count` positions of planes.txt, rebuilt through fillPlanes. */
std::vector<float> fixturePlanes(int count) {
  std::ifstream in(SIX_FIXTURES "/planes.txt");
  std::vector<float> planes(static_cast<std::size_t>(count) * six::kPlaneCount * six::kCropCells);
  std::string line;
  int built = 0;
  while (built < count && std::getline(in, line)) {
    std::istringstream ss(line);
    std::string kind;
    ss >> kind;
    if (kind != "position") continue;
    int radius = 9;
    int stones = 0;
    ss >> radius >> stones;
    six::Board board(radius);
    for (int i = 0; i < stones; ++i) {
      int q = 0;
      int r = 0;
      ss >> q >> r;
      board.place({q, r});
    }
    six::fillPlanes(board, planes.data() + static_cast<std::size_t>(built) * six::kPlaneCount * six::kCropCells);
    ++built;
  }
  return planes;
}

void checkAgainstPyTorch(six::Device device) {
  const int count = 16;
  const auto planes = fixturePlanes(count);
  six::Evaluator evaluator(SIX_FIXTURES "/tiny.onnx", device);
  std::vector<six::NetOutput> out(count);
  evaluator.evaluate(planes.data(), count, out.data());
  std::ifstream expected(SIX_FIXTURES "/tiny-outputs.txt");
  std::string word;
  double worst = 0.0;
  for (int b = 0; b < count; ++b) {
    double value = 0.0;
    double score = 0.0;
    expected >> word >> value >> score;
    worst = std::max({worst, std::abs(value - out[b].value), std::abs(score - out[b].score)});
    for (int i = 0; i < six::kCropCells; ++i) {
      double logit = 0.0;
      expected >> logit;
      worst = std::max(worst, std::abs(logit - out[b].policy[static_cast<std::size_t>(i)]));
    }
  }
  CHECK(expected.good());
  if (worst > 1e-3) six::testing::fail(__FILE__, __LINE__, "largest difference from PyTorch " + std::to_string(worst));
}

}  // namespace

TEST_CASE("evaluator: CPU outputs match PyTorch on fixture positions") { checkAgainstPyTorch(six::Device::Cpu); }

TEST_CASE("evaluator: CUDA outputs match PyTorch (set SIX_TEST_CUDA=1 with CUDA DLLs on PATH)") {
#ifdef _WIN32
  char* flag = nullptr;
  std::size_t length = 0;
  const bool enabled = _dupenv_s(&flag, &length, "SIX_TEST_CUDA") == 0 && flag != nullptr;
  std::free(flag);
#else
  const bool enabled = std::getenv("SIX_TEST_CUDA") != nullptr;
#endif
  if (enabled) checkAgainstPyTorch(six::Device::Cuda);
}

TEST_CASE("evaluator: batching many threads' requests gives each thread its own outputs") {
  const int count = 16;
  const auto planes = fixturePlanes(count);
  six::Evaluator direct(SIX_FIXTURES "/tiny.onnx", six::Device::Cpu);
  std::vector<six::NetOutput> expected(count);
  direct.evaluate(planes.data(), count, expected.data());

  six::BatchingEvaluator batching(direct, 12, std::chrono::microseconds(500));
  std::vector<std::vector<six::NetOutput>> got(count, std::vector<six::NetOutput>(3));
  std::vector<std::thread> threads;
  for (int t = 0; t < count; ++t) {
    threads.emplace_back([&, t] {
      // Each thread asks three times for its own position.
      std::vector<float> mine(planes.begin() + t * six::kPlaneCount * six::kCropCells,
                              planes.begin() + (t + 1) * six::kPlaneCount * six::kCropCells);
      for (int k = 0; k < 3; ++k) batching.evaluate(mine.data(), 1, &got[static_cast<std::size_t>(t)][static_cast<std::size_t>(k)]);
    });
  }
  for (auto& th : threads) th.join();
  double worst = 0.0;
  for (int t = 0; t < count; ++t) {
    for (const auto& out : got[static_cast<std::size_t>(t)]) {
      worst = std::max(worst, static_cast<double>(std::abs(out.value - expected[static_cast<std::size_t>(t)].value)));
      worst = std::max(worst, static_cast<double>(std::abs(out.policy[77] - expected[static_cast<std::size_t>(t)].policy[77])));
    }
  }
  CHECK(worst < 1e-4);
  CHECK_EQ(batching.positions(), std::int64_t{3 * count});
  CHECK(batching.batches() < 3 * count);
}

TEST_CASE("evaluator: a failing backend fails its callers instead of the batching server") {
  struct Flaky : six::NetworkEvaluator {
    int calls = 0;
    void evaluate(const float*, int batch, six::NetOutput* out) override {
      if (++calls == 1) throw std::runtime_error("out of GPU memory");
      for (int i = 0; i < batch; ++i) out[i].value = 0.25f;
    }
  } flaky;
  six::BatchingEvaluator batching(flaky, 4, std::chrono::microseconds(100));
  std::vector<float> planes(static_cast<std::size_t>(six::kPlaneCount) * six::kCropCells, 0.0f);
  six::NetOutput out;
  bool threw = false;
  try {
    batching.evaluate(planes.data(), 1, &out);
  } catch (const std::runtime_error&) {
    threw = true;
  }
  CHECK(threw);
  batching.evaluate(planes.data(), 1, &out);  // the server kept going
  CHECK(out.value == 0.25f);
}