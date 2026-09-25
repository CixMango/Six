#pragma once
// ONNX Runtime inference for the exported network, plus a batching front for many search threads.
#include <array>
#include <chrono>
#include <memory>
#include <string>

#include "planes.hpp"

namespace six {

struct NetOutput {
  std::array<float, kCropCells> policy{};  // logits per crop cell for the next stone
  float value = 0.0f;                      // P(mover wins) - P(mover loses)
  float score = 0.0f;                      // squashed search-score estimate in [-1, 1]
};

class NetworkEvaluator {
 public:
  virtual ~NetworkEvaluator() = default;
  // `planes` holds batch * kPlaneCount * kCropCells values.
  virtual void evaluate(const float* planes, int batch, NetOutput* out) = 0;
};

// TensorRt builds fp16 engines, cached beside the model on first use, and falls back to CUDA per node.
// DirectMl needs a SIX_DML build. WebGpu needs the ONNX Runtime WebGPU plugin next to the executable (Vulkan on
// Linux, so AMD, Intel and NVIDIA cards all work); Cuda falls back to it, then to the CPU.
enum class Device { Cpu, Cuda, TensorRt, DirectMl, WebGpu };

class Evaluator : public NetworkEvaluator {
 public:
  Evaluator(const std::string& onnxPath, Device device);
  ~Evaluator() override;
  Evaluator(const Evaluator&) = delete;
  Evaluator& operator=(const Evaluator&) = delete;

  void evaluate(const float* planes, int batch, NetOutput* out) override;

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

// Thread-safe front for another evaluator. Concurrent calls block while a server thread batches up
// to maxBatch positions, or whatever arrived within `wait`.
class BatchingEvaluator : public NetworkEvaluator {
 public:
  BatchingEvaluator(NetworkEvaluator& backend, int maxBatch, std::chrono::microseconds wait);
  ~BatchingEvaluator() override;
  BatchingEvaluator(const BatchingEvaluator&) = delete;
  BatchingEvaluator& operator=(const BatchingEvaluator&) = delete;

  void evaluate(const float* planes, int batch, NetOutput* out) override;

  std::int64_t positions() const;
  std::int64_t batches() const;
  double networkSeconds() const;

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

}  // namespace six
