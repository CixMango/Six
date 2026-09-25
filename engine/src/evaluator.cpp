#include "evaluator.hpp"

#include <cmath>
#include <filesystem>
#include <iostream>
#include <iterator>
#include <stdexcept>
#include <unordered_map>
#include <vector>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#elif defined(__APPLE__)
#include <mach-o/dyld.h>
#endif

#include <onnxruntime_cxx_api.h>
#ifdef SIX_DML
#include <dml_provider_factory.h>
#endif

namespace six {
namespace {

#ifdef _WIN32
// ONNX Runtime takes wide paths on Windows.
std::basic_string<ORTCHAR_T> modelPath(const std::string& utf8) {
  const int size = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, nullptr, 0);
  std::wstring wide(static_cast<std::size_t>(size), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, wide.data(), size);
  wide.resize(static_cast<std::size_t>(size - 1));
  return wide;
}
#else
std::string modelPath(const std::string& utf8) { return utf8; }
#endif

std::filesystem::path executableDir() {
#ifdef _WIN32
  wchar_t buffer[MAX_PATH];
  const DWORD size = GetModuleFileNameW(nullptr, buffer, MAX_PATH);
  return std::filesystem::path(std::wstring(buffer, size)).parent_path();
#elif defined(__APPLE__)
  std::uint32_t size = 0;
  _NSGetExecutablePath(nullptr, &size);
  std::string buffer(size, '\0');
  _NSGetExecutablePath(buffer.data(), &size);
  std::error_code error;
  return std::filesystem::weakly_canonical(buffer.c_str(), error).parent_path();
#else
  std::error_code error;
  return std::filesystem::read_symlink("/proc/self/exe", error).parent_path();
#endif
}

// Registers the WebGPU plugin shipped next to the executable and adds its device to `options`.
bool appendWebGpu(Ort::Env& env, Ort::SessionOptions& options) {
#ifdef _WIN32
  const auto library = executableDir() / "onnxruntime_providers_webgpu.dll";
#elif defined(__APPLE__)
  const auto library = executableDir() / "libonnxruntime_providers_webgpu.dylib";
#else
  const auto library = executableDir() / "libonnxruntime_providers_webgpu.so";
#endif
  if (!std::filesystem::exists(library)) return false;
  try {
    env.RegisterExecutionProviderLibrary("webgpu_ep", library.native());
    // The macOS build also has WebGPU built in under the same name, and two providers' devices can't be mixed:
    // take just the first WebGPU device.
    std::vector<Ort::ConstEpDevice> devices;
    std::string provider;
    for (const Ort::ConstEpDevice& device : env.GetEpDevices()) {
      const std::string name = device.EpName();
      if (name.find("WebGpu") == std::string::npos) continue;
      provider = name;
      devices.push_back(device);
      break;
    }
    if (devices.empty()) {
      std::cerr << "WebGPU found no graphics card (on Linux it needs the Vulkan loader, libvulkan.so.1)\n";
      return false;
    }
    options.AppendExecutionProvider_V2(env, devices, std::unordered_map<std::string, std::string>{});
    std::cerr << "using WebGPU (" << provider << ")\n";
    return true;
  } catch (const Ort::Exception& e) {
    std::cerr << "WebGPU is not available: " << e.what() << '\n';
    return false;
  }
}

}  // namespace

struct Evaluator::Impl {
  Ort::Env env{ORT_LOGGING_LEVEL_WARNING, "sixengine"};
  Ort::Session session{nullptr};
  Ort::MemoryInfo memory = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
};

Evaluator::Evaluator(const std::string& onnxPath, Device device) : impl_(std::make_unique<Impl>()) {
  Ort::SessionOptions options;
  options.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
  if (device == Device::TensorRt) {
    // Engines are built for batches of 1 to 1024 positions and cached next to the model, so only the first run waits.
    const std::string cache = onnxPath + ".trt";
    const std::string minShape = "planes:1x" + std::to_string(kPlaneCount) + "x" + std::to_string(kCrop) + "x" + std::to_string(kCrop);
    const std::string optShape = "planes:256x" + std::to_string(kPlaneCount) + "x" + std::to_string(kCrop) + "x" + std::to_string(kCrop);
    const std::string maxShape = "planes:1024x" + std::to_string(kPlaneCount) + "x" + std::to_string(kCrop) + "x" + std::to_string(kCrop);
    const char* keys[] = {"device_id", "trt_fp16_enable", "trt_engine_cache_enable", "trt_engine_cache_path",
                          "trt_timing_cache_enable", "trt_timing_cache_path", "trt_profile_min_shapes", "trt_profile_opt_shapes",
                          "trt_profile_max_shapes"};
    const char* values[] = {"0", "1", "1", cache.c_str(), "1", cache.c_str(), minShape.c_str(), optShape.c_str(), maxShape.c_str()};
    OrtTensorRTProviderOptionsV2* trt = nullptr;
    Ort::ThrowOnError(Ort::GetApi().CreateTensorRTProviderOptions(&trt));
    Ort::ThrowOnError(Ort::GetApi().UpdateTensorRTProviderOptions(trt, keys, values, std::size(keys)));
    options.AppendExecutionProvider_TensorRT_V2(*trt);
    Ort::GetApi().ReleaseTensorRTProviderOptions(trt);
  }
  if (device == Device::Cuda || device == Device::TensorRt) {
    OrtCUDAProviderOptionsV2* cuda = nullptr;
    try {
      Ort::ThrowOnError(Ort::GetApi().CreateCUDAProviderOptions(&cuda));
      options.AppendExecutionProvider_CUDA_V2(*cuda);
    } catch (const Ort::Exception& e) {
      // No usable CUDA (an AMD or Intel card, or no CUDA libraries): try WebGPU, then every CPU core.
      std::cerr << "CUDA is not available: " << e.what() << '\n';
      if (!appendWebGpu(impl_->env, options)) std::cerr << "using the CPU\n";
    }
    if (cuda) Ort::GetApi().ReleaseCUDAProviderOptions(cuda);
  } else if (device == Device::WebGpu) {
    if (!appendWebGpu(impl_->env, options)) std::cerr << "using the CPU\n";
  } else if (device == Device::DirectMl) {
#ifdef SIX_DML
    // DirectML can't use memory patterns or parallel execution; batches all come from one thread anyway.
    options.DisableMemPattern();
    options.SetExecutionMode(ExecutionMode::ORT_SEQUENTIAL);
    Ort::ThrowOnError(OrtSessionOptionsAppendExecutionProvider_DML(options, 0));
#else
    throw std::runtime_error("this engine was built without DirectML");
#endif
  } else {
    options.SetIntraOpNumThreads(1);
  }
  impl_->session = Ort::Session(impl_->env, modelPath(onnxPath).c_str(), options);
  // The first runs set up CUDA and pick kernels, which takes far longer than a search can wait: do them now.
  std::vector<float> planes(static_cast<std::size_t>(kPlaneCount) * kCropCells, 0.0f);
  std::vector<NetOutput> out(1);
  for (int i = 0; i < 3; ++i) evaluate(planes.data(), 1, out.data());
}

Evaluator::~Evaluator() = default;

void Evaluator::evaluate(const float* planes, int batch, NetOutput* out) {
  const std::array<std::int64_t, 4> shape{batch, kPlaneCount, kCrop, kCrop};
  // ONNX Runtime only reads the input, but its API takes a mutable pointer.
  Ort::Value input = Ort::Value::CreateTensor<float>(impl_->memory, const_cast<float*>(planes),
                                                     static_cast<std::size_t>(batch) * kPlaneCount * kCropCells, shape.data(), shape.size());
  const char* inputNames[] = {"planes"};
  const char* outputNames[] = {"policy", "value", "score"};
  auto outputs = impl_->session.Run(Ort::RunOptions{nullptr}, inputNames, &input, 1, outputNames, 3);
  const float* policy = outputs[0].GetTensorData<float>();
  const float* value = outputs[1].GetTensorData<float>();
  const float* score = outputs[2].GetTensorData<float>();
  for (int b = 0; b < batch; ++b) {
    std::copy(policy + b * kCropCells, policy + (b + 1) * kCropCells, out[b].policy.begin());
    // Softmax over (win, loss) reduces to tanh of half the logit difference.
    out[b].value = std::tanh(0.5f * (value[2 * b] - value[2 * b + 1]));
    out[b].score = score[b];
  }
}

}  // namespace six
