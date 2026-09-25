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
endif()

add_library(sixcore STATIC
  src/board.cpp
  src/tactics.cpp
  src/search.cpp
  src/threats.cpp
  src/planes.cpp
  src/nnue.cpp
)
target_include_directories(sixcore PUBLIC src)

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
add_executable(sixnnue tools/nnue_eval.cpp)
target_link_libraries(sixnnue PRIVATE sixcore)

add_executable(sixengine src/main.cpp)
target_link_libraries(sixengine PRIVATE sixcore)

# The network evaluator and MCTS need the ONNX Runtime GPU SDK, unpacked into third_party/ (gitignored).
# Without it the engine builds as the alpha-beta baseline only.
set(SIX_ORT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/onnxruntime-win-x64-gpu_cuda13-1.30.0" CACHE PATH "ONNX Runtime SDK")
if(EXISTS "${SIX_ORT_DIR}/include/onnxruntime_cxx_api.h")
  add_library(sixnet STATIC src/evaluator.cpp src/batching.cpp src/mcts.cpp)
  target_include_directories(sixnet PUBLIC src "${SIX_ORT_DIR}/include")
  target_link_libraries(sixnet PUBLIC sixcore "${SIX_ORT_DIR}/lib/onnxruntime.lib")
  target_compile_definitions(sixnet PUBLIC SIX_WITH_NET=1)
  target_sources(sixtests PRIVATE tests/test_evaluator.cpp tests/test_mcts.cpp)
  add_executable(sixselfplay tools/selfplay.cpp)
  target_link_libraries(sixselfplay PRIVATE sixnet)
  # Paired games between two networks in one process; it runs from the same folder, so it shares the DLLs below.
  add_executable(sixmatch tools/match.cpp)
  target_link_libraries(sixmatch PRIVATE sixnet)
  add_custom_command(TARGET sixselfplay POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${SIX_ORT_DIR}/lib/onnxruntime.dll"
      "${SIX_ORT_DIR}/lib/onnxruntime_providers_shared.dll"
      "${SIX_ORT_DIR}/lib/onnxruntime_providers_cuda.dll"
      "${SIX_ORT_DIR}/lib/onnxruntime_providers_tensorrt.dll"
      "$<TARGET_FILE_DIR:sixselfplay>")
  foreach(target sixtests sixengine)
    target_link_libraries(${target} PRIVATE sixnet)
    # Ship ONNX Runtime next to the executable so Windows doesn't pick up another copy from System32.
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${SIX_ORT_DIR}/lib/onnxruntime.dll"
        "${SIX_ORT_DIR}/lib/onnxruntime_providers_shared.dll"
        "${SIX_ORT_DIR}/lib/onnxruntime_providers_cuda.dll"
        "$<TARGET_FILE_DIR:${target}>")
  endforeach()
else()
  message(STATUS "ONNX Runtime SDK not found at ${SIX_ORT_DIR}: building without the network engine")
endif()

enable_testing()
add_test(NAME sixtests COMMAND sixtests)
