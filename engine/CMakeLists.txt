cmake_minimum_required(VERSION 3.25)
project(sixengine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(MSVC)
  add_compile_options(/W4 /permissive- /utf-8 /EHsc /Zc:__cplusplus)
  if(SIX_ASAN)
    add_compile_options(/fsanitize=address)
  endif()
else()
  add_compile_options(-Wall -Wextra)
  # Find the ONNX Runtime libraries copied next to the executables.
  if(APPLE)
    set(CMAKE_BUILD_RPATH "@loader_path")
  else()
    set(CMAKE_BUILD_RPATH "$ORIGIN")
  endif()
endif()
find_package(Threads REQUIRED)

add_library(sixcore STATIC
  src/board.cpp
  src/tactics.cpp
  src/search.cpp
  src/threats.cpp
  src/planes.cpp
  src/nnue.cpp
)
target_include_directories(sixcore PUBLIC src)
target_link_libraries(sixcore PUBLIC Threads::Threads)

add_executable(sixtests
  tests/test_main.cpp
  tests/test_board.cpp
  tests/test_tactics.cpp
  tests/test_fixtures.cpp
  tests/test_search.cpp
  tests/test_threats.cpp
  tests/test_planes.cpp
  tests/test_nnue.cpp
)
target_link_libraries(sixtests PRIVATE sixcore)
target_include_directories(sixtests PRIVATE tests)
target_compile_definitions(sixtests PRIVATE SIX_FIXTURES="${CMAKE_CURRENT_SOURCE_DIR}/tests/fixtures")

add_executable(sixbench tools/bench.cpp)
target_link_libraries(sixbench PRIVATE sixcore)
add_executable(sixshapes tools/shapes.cpp)
target_link_libraries(sixshapes PRIVATE sixcore)
add_executable(sixnnue tools/nnue_eval.cpp)
target_link_libraries(sixnnue PRIVATE sixcore)

add_executable(sixengine src/main.cpp)
target_link_libraries(sixengine PRIVATE sixcore)

# The network evaluator and MCTS need an ONNX Runtime SDK unpacked into third_party/ (gitignored): the CUDA build by
# default, or with SIX_DML=ON the DirectML build (any DX12 GPU, used for the release download).
# Without one the engine builds as the alpha-beta baseline only.
option(SIX_DML "Use the DirectML build of ONNX Runtime" OFF)
if(SIX_DML)
  set(SIX_ORT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/ort-dml-1.24.4" CACHE PATH "ONNX Runtime SDK")
  set(SIX_DIRECTML_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/directml-1.15.4" CACHE PATH "DirectML redistributable")
  set(SIX_ORT_INCLUDE "${SIX_ORT_DIR}/build/native/include")
  set(SIX_ORT_LIB "${SIX_ORT_DIR}/runtimes/win-x64/native")
  set(SIX_ORT_DLLS "${SIX_ORT_LIB}/onnxruntime.dll" "${SIX_ORT_LIB}/onnxruntime_providers_shared.dll"
      "${SIX_DIRECTML_DIR}/bin/x64-win/DirectML.dll")
elseif(WIN32)
  set(SIX_ORT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/onnxruntime-win-x64-gpu_cuda13-1.30.0" CACHE PATH "ONNX Runtime SDK")
  set(SIX_ORT_INCLUDE "${SIX_ORT_DIR}/include")
  set(SIX_ORT_LIB "${SIX_ORT_DIR}/lib")
  set(SIX_ORT_DLLS "${SIX_ORT_LIB}/onnxruntime.dll" "${SIX_ORT_LIB}/onnxruntime_providers_shared.dll"
      "${SIX_ORT_LIB}/onnxruntime_providers_cuda.dll" "${SIX_ORT_LIB}/onnxruntime_providers_tensorrt.dll")
elseif(APPLE)
  # macOS (Apple Silicon): the CPU build plus the WebGPU plugin, which runs the network on the GPU through Metal.
  set(SIX_ORT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/onnxruntime-osx-arm64-1.24.4" CACHE PATH "ONNX Runtime SDK")
  set(SIX_ORT_INCLUDE "${SIX_ORT_DIR}/include")
  set(SIX_ORT_LIB "${SIX_ORT_DIR}/lib")
  file(GLOB SIX_ORT_DLLS "${SIX_ORT_LIB}/libonnxruntime*.dylib")
  set(SIX_WEBGPU_EP "${CMAKE_CURRENT_SOURCE_DIR}/third_party/ep-webgpu-0.4.0/runtimes/osx-arm64/native/libonnxruntime_providers_webgpu.dylib")
  if(EXISTS "${SIX_WEBGPU_EP}")
    list(APPEND SIX_ORT_DLLS "${SIX_WEBGPU_EP}")
  endif()
else()
  # Linux: the GPU (CUDA 12) build; without CUDA installed the engine falls back to the CPU.
  set(SIX_ORT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/onnxruntime-linux-x64-gpu-1.24.4" CACHE PATH "ONNX Runtime SDK")
  set(SIX_ORT_INCLUDE "${SIX_ORT_DIR}/include")
  set(SIX_ORT_LIB "${SIX_ORT_DIR}/lib")
  file(GLOB SIX_ORT_DLLS "${SIX_ORT_LIB}/libonnxruntime*.so*")
  # WebGPU plugin (Vulkan): runs the network on AMD and Intel cards, and on NVIDIA cards without CUDA.
  set(SIX_WEBGPU_EP "${CMAKE_CURRENT_SOURCE_DIR}/third_party/ep-webgpu-0.4.0/runtimes/linux-x64/native/libonnxruntime_providers_webgpu.so")
  if(EXISTS "${SIX_WEBGPU_EP}")
    list(APPEND SIX_ORT_DLLS "${SIX_WEBGPU_EP}")
  endif()
endif()
if(EXISTS "${SIX_ORT_INCLUDE}/onnxruntime_cxx_api.h")
  add_library(sixnet STATIC src/evaluator.cpp src/batching.cpp src/mcts.cpp)
  target_include_directories(sixnet PUBLIC src "${SIX_ORT_INCLUDE}")
  if(WIN32)
    target_link_libraries(sixnet PUBLIC sixcore "${SIX_ORT_LIB}/onnxruntime.lib")
  elseif(APPLE)
    target_link_libraries(sixnet PUBLIC sixcore "${SIX_ORT_LIB}/libonnxruntime.dylib")
  else()
    target_link_libraries(sixnet PUBLIC sixcore "${SIX_ORT_LIB}/libonnxruntime.so")
  endif()
  target_compile_definitions(sixnet PUBLIC SIX_WITH_NET=1)
  if(SIX_DML)
    target_compile_definitions(sixnet PUBLIC SIX_DML=1)
  endif()
  target_sources(sixtests PRIVATE tests/test_evaluator.cpp tests/test_mcts.cpp)
  add_executable(sixselfplay tools/selfplay.cpp)
  target_link_libraries(sixselfplay PRIVATE sixnet)
  # Paired games between two networks in one process.
  add_executable(sixmatch tools/match.cpp)
  target_link_libraries(sixmatch PRIVATE sixnet)
  foreach(target sixtests sixengine sixselfplay sixmatch)
    target_link_libraries(${target} PRIVATE sixnet)
    # Ship ONNX Runtime next to the executable so Windows doesn't pick up another copy from System32.
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different ${SIX_ORT_DLLS} "$<TARGET_FILE_DIR:${target}>")
  endforeach()
else()
  message(STATUS "ONNX Runtime SDK not found at ${SIX_ORT_DIR}: building without the network engine")
endif()

enable_testing()
add_test(NAME sixtests COMMAND sixtests)
