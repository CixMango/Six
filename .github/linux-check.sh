#!/bin/sh
# Runs inside a bare Linux container with the unpacked download at /six. There are no graphics drivers, so the
# network has to fall back to the CPU, and it must still play: straight from the engine, then through the app.
set -e
cp -r /six /tmp/six
cd /tmp/six
net=$(ls runs/rl/gen-*/net.onnx)
(printf 'six\nisready\nposition radius 8 moves 0 0 1 0 2 -1\ngo movetime 1000\n'; sleep 30; echo quit) \
  | timeout 60 ./engine/sixengine --net "$net" > out.txt 2> err.txt || true
cat err.txt
grep '^bestmove' out.txt

SIX_PORT=6690 SIX_ENGINE="$PWD/engine/sixengine" ./node/node web/src/server/main.mjs --prod > server.txt 2>&1 &
sleep 5
./node/node --input-type=module -e '
const res = await fetch("http://localhost:6690/api/bot/turn", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ moves: [[0, 0], [1, 0], [2, -1]], radius: 8, bot: "hexnet", level: 1 }),
  signal: AbortSignal.timeout(90000),
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok || !text.includes("cells")) process.exit(1);
' || { cat server.txt; exit 1; }
