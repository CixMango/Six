// The network search compiled to WebAssembly, for playing HexBot Net in a browser with nothing installed.
// The search is the engine's own MCTS; each batch of positions goes out to JavaScript, which runs the network with
// ONNX Runtime Web (WebGPU when the browser has it, WASM otherwise) and writes the outputs back.
//
// JavaScript supplies Module.evaluateBatch(planesPtr, batch, outPtr), an async function that fills, for each
// position, kCropCells policy logits followed by the value and score exactly as the native Evaluator reports them
// (value = tanh((win - loss) / 2) of the network's two value logits).
#include <emscripten.h>

#include <cstdint>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

#include "board.hpp"
#include "evaluator.hpp"
#include "mcts.hpp"

namespace {

static_assert(sizeof(six::NetOutput) == (six::kCropCells + 2) * sizeof(float),
              "JavaScript writes NetOutput as a flat run of floats");

EM_ASYNC_JS(void, jsEvaluate, (const float* planes, int batch, float* out), {
  await Module.evaluateBatch(planes, batch, out);
});

class JsEvaluator : public six::NetworkEvaluator {
 public:
  void evaluate(const float* planes, int batch, six::NetOutput* out) override {
    jsEvaluate(planes, batch, reinterpret_cast<float*>(out));
  }
};

JsEvaluator evaluator;
std::unique_ptr<six::Mcts> mcts;
std::string reply;

}  // namespace

extern "C" {

/** Plays the rest of the current turn. `moves` is "q r q r ..." (the whole game so far); returns the stones the
 *  same way, or "error ..." when the position isn't legal. Stops after `movetimeMs`, or `nodes` visits if > 0. */
EMSCRIPTEN_KEEPALIVE const char* six_turn(const char* moves, int radius, int movetimeMs, int nodes) {
  try {
    if (!mcts) mcts = std::make_unique<six::Mcts>(evaluator);
    six::Board board(radius);
    std::istringstream in(moves);
    int q = 0;
    int r = 0;
    int index = 0;
    while (in >> q >> r) {
      ++index;
      if (board.place({q, r}) != six::PlaceError::None) {
        reply = "error illegal move " + std::to_string(index);
        return reply.c_str();
      }
    }
    six::SearchLimits limits;
    if (movetimeMs > 0) limits.moveTimeMs = movetimeMs;
    if (nodes > 0) limits.maxNodes = nodes;
    const six::SearchResult result = mcts->search(board, limits);
    std::ostringstream out;
    for (std::size_t i = 0; i < result.stones.size(); ++i) out << (i ? " " : "") << result.stones[i].q << ' ' << result.stones[i].r;
    reply = out.str();
  } catch (const std::exception& e) {
    reply = std::string("error ") + e.what();
  }
  return reply.c_str();
}

/** Judges the position: the search's score for the side to move (1000 x its value, or 1000000 for a proven forced
 *  win), after `movetimeMs`. Returns -2147483647 when the position isn't legal. */
EMSCRIPTEN_KEEPALIVE int six_eval(const char* moves, int radius, int movetimeMs) {
  try {
    if (!mcts) mcts = std::make_unique<six::Mcts>(evaluator);
    six::Board board(radius);
    std::istringstream in(moves);
    int q = 0;
    int r = 0;
    while (in >> q >> r) {
      if (board.place({q, r}) != six::PlaceError::None) return -2147483647;
    }
    six::SearchLimits limits;
    limits.moveTimeMs = movetimeMs;
    return mcts->search(board, limits).score;
  } catch (const std::exception&) {
    return -2147483647;
  }
}

/** Forgets the previous game, so a new one doesn't try to continue its tree. */
EMSCRIPTEN_KEEPALIVE void six_new_game() {
  if (mcts) mcts->newGame();
}

/** Changes a search setting (the names MctsParams::set takes); returns 1 when the name was known. */
EMSCRIPTEN_KEEPALIVE int six_set_option(const char* name, int value) {
  if (!mcts) mcts = std::make_unique<six::Mcts>(evaluator);
  return mcts->params().set(name, value) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE int six_crop_cells() { return six::kCropCells; }
EMSCRIPTEN_KEEPALIVE int six_plane_count() { return six::kPlaneCount; }
EMSCRIPTEN_KEEPALIVE int six_crop() { return six::kCrop; }

}  // extern "C"
