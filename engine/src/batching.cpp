#include <algorithm>
#include <atomic>
#include <condition_variable>
#include <deque>
#include <exception>
#include <mutex>
#include <thread>
#include <vector>

#include "evaluator.hpp"

namespace six {

struct BatchingEvaluator::Impl {
  struct Request {
    const float* planes;
    int batch;
    NetOutput* out;
    bool done = false;
    std::exception_ptr error;  // the backend's failure, rethrown to the caller
  };

  NetworkEvaluator& backend;
  const int maxBatch;
  const std::chrono::microseconds wait;
  std::mutex mutex;
  std::condition_variable arrived;   // a request was queued, or shutdown began
  std::condition_variable finished;  // some request completed
  std::deque<Request*> queue;
  int queued = 0;                    // positions waiting in `queue`
  bool stopping = false;
  std::atomic<std::int64_t> positions{0};
  std::atomic<std::int64_t> batches{0};
  std::atomic<std::int64_t> networkMicros{0};  // time spent inside the backend
  std::thread server;

  Impl(NetworkEvaluator& b, int m, std::chrono::microseconds w) : backend(b), maxBatch(std::max(1, m)), wait(w) {
    server = std::thread([this] { serve(); });
  }

  void serve() {
    std::vector<float> planes;
    std::vector<NetOutput> outputs;
    std::vector<Request*> taken;
    while (true) {
      {
        std::unique_lock<std::mutex> lock(mutex);
        arrived.wait(lock, [&] { return stopping || !queue.empty(); });
        if (queue.empty()) return;  // stopping with nothing left to serve
        // Give other threads a moment to add to the batch.
        const auto deadline = std::chrono::steady_clock::now() + wait;
        arrived.wait_until(lock, deadline, [&] { return stopping || queued >= maxBatch; });
        taken.clear();
        int total = 0;
        while (!queue.empty() && (taken.empty() || total + queue.front()->batch <= maxBatch)) {
          total += queue.front()->batch;
          taken.push_back(queue.front());
          queue.pop_front();
        }
        queued -= total;
      }
      int total = 0;
      for (const Request* r : taken) total += r->batch;
      planes.resize(static_cast<std::size_t>(total) * kPlaneCount * kCropCells);
      outputs.resize(static_cast<std::size_t>(total));
      std::size_t offset = 0;
      for (const Request* r : taken) {
        const std::size_t size = static_cast<std::size_t>(r->batch) * kPlaneCount * kCropCells;
        std::copy(r->planes, r->planes + size, planes.data() + offset);
        offset += size;
      }
      const auto began = std::chrono::steady_clock::now();
      std::exception_ptr error;
      try {
        backend.evaluate(planes.data(), total, outputs.data());
      } catch (...) {
        error = std::current_exception();  // e.g. the GPU ran out of memory: fail these requests, keep serving
      }
      networkMicros += std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now() - began).count();
      positions += total;
      ++batches;
      {
        std::lock_guard<std::mutex> lock(mutex);
        std::size_t at = 0;
        for (Request* r : taken) {
          r->error = error;
          if (!error) std::copy(outputs.begin() + static_cast<std::ptrdiff_t>(at), outputs.begin() + static_cast<std::ptrdiff_t>(at) + r->batch, r->out);
          at += static_cast<std::size_t>(r->batch);
          r->done = true;
        }
      }
      finished.notify_all();
    }
  }
};

BatchingEvaluator::BatchingEvaluator(NetworkEvaluator& backend, int maxBatch, std::chrono::microseconds wait)
    : impl_(std::make_unique<Impl>(backend, maxBatch, wait)) {}

BatchingEvaluator::~BatchingEvaluator() {
  {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    impl_->stopping = true;
  }
  impl_->arrived.notify_all();
  impl_->server.join();
}

void BatchingEvaluator::evaluate(const float* planes, int batch, NetOutput* out) {
  if (batch <= 0) return;
  Impl::Request request{planes, batch, out};
  std::unique_lock<std::mutex> lock(impl_->mutex);
  impl_->queue.push_back(&request);
  impl_->queued += batch;
  impl_->arrived.notify_all();
  impl_->finished.wait(lock, [&] { return request.done; });
  if (request.error) std::rethrow_exception(request.error);
}

std::int64_t BatchingEvaluator::positions() const { return impl_->positions.load(); }

std::int64_t BatchingEvaluator::batches() const { return impl_->batches.load(); }

double BatchingEvaluator::networkSeconds() const { return static_cast<double>(impl_->networkMicros.load()) / 1e6; }

}  // namespace six
