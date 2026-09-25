#!/usr/bin/env bash
# Compiles the network search to WebAssembly for the browser build of HexBot Net.
#   bash engine/web/build.sh        -> web/public/bot/sixbot.mjs + sixbot.wasm, hexnet.onnx (newest network), web/public/ort/
# Needs the Emscripten SDK in tools/emsdk (git clone https://github.com/emscripten-core/emsdk; emsdk install latest;
# emsdk activate latest, which writes tools/emsdk/.emscripten and changes nothing system-wide).
set -eu
root="$(cd "$(dirname "$0")/../.." && pwd)"
emsdk="$root/tools/emsdk"
export EM_CONFIG="$emsdk/.emscripten"
export PATH="$emsdk/upstream/emscripten:$emsdk/node/24.19.0_64bit:$emsdk/python/3.13.3_64bit:$PATH"
out="$root/web/public/bot"
mkdir -p "$out"
src="$root/engine/src"
em++.exe -std=c++20 -O3 -msimd128 -fexceptions -I"$src" \
  "$src/board.cpp" "$src/tactics.cpp" "$src/search.cpp" "$src/threats.cpp" "$src/planes.cpp" "$src/mcts.cpp" \
  "$root/engine/web/web_bot.cpp" \
  -sASYNCIFY -sASYNCIFY_STACK_SIZE=65536 -sSTACK_SIZE=1048576 \
  -sMODULARIZE -sEXPORT_ES6 -sEXPORT_NAME=createSixBot -sENVIRONMENT=web,worker,node \
  -sALLOW_MEMORY_GROWTH -sINITIAL_MEMORY=67108864 \
  -sEXPORTED_FUNCTIONS=_six_turn,_six_eval,_six_new_game,_six_set_option,_six_crop_cells,_six_plane_count,_six_crop,_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap,UTF8ToString,HEAPF32 \
  -o "$out/sixbot.mjs"

# ONNX Runtime Web's own WebAssembly files, served from /ort/ (the worker points ort.env.wasm.wasmPaths there).
mkdir -p "$root/web/public/ort"
cp "$root/web/node_modules/onnxruntime-web/dist/"ort-wasm-simd-threaded*.{mjs,wasm} "$root/web/public/ort/"
# The newest trained network, as the one the browser plays with.
net=$(ls -d "$root"/runs/rl/gen-* 2>/dev/null | sort -r | while read -r d; do [ -f "$d/net.onnx" ] && { echo "$d/net.onnx"; break; }; done)
if [ -n "$net" ]; then
  # Full precision for the CPU fallback; half precision (as the app runs it on the GPU) for WebGPU. Both are rewritten
  # so the whole network runs on the GPU, with identical outputs.
  py="$root/.venv/Scripts/python.exe"
  "$py" "$root/engine/web/prepare_net.py" "$net" "$out/hexnet.onnx"
  half="$(mktemp -d)/fp16.onnx"
  PYTHONPATH="$root/trainer" "$py" "$root/trainer/export.py" "$(dirname "$net")/net.pt" "$half" --fp16
  "$py" "$root/engine/web/prepare_net.py" "$half" "$out/hexnet-fp16.onnx"
  printf '{"generation": %d}\n' "$((10#$(basename "$(dirname "$net")" | sed 's/gen-//')))" > "$out/model.json"
  echo "browser network: $net"
fi
