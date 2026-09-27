#!/bin/sh
# Runs inside an Ubuntu 24.04 container with the engine build at /engine: WebGPU on the software Vulkan driver must
# load the network and play a move.
set -e
apt-get update -qq
apt-get install -y -qq libvulkan1 mesa-vulkan-drivers > /dev/null
(printf 'six\nisready\nposition radius 8 moves 0 0 1 0 2 -1\ngo movetime 3000\n'; sleep 30; echo quit) \
  | /engine/build/linux/sixengine --net /engine/tests/fixtures/tiny.onnx --webgpu > /tmp/out.txt 2>&1 || true
cat /tmp/out.txt
grep -q "using WebGPU" /tmp/out.txt
grep -q "^bestmove" /tmp/out.txt
