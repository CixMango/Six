#!/usr/bin/env bash
# Waits until generation NEW has finished its self-play, then plays it against generation OLD at 1 s a turn
# and prints the result on one line. Exits early if the loop logs a failure or goes quiet.
#   bash trainer/checkpoint.sh NEW OLD [PAIRS]
set -u
cd "$(dirname "$0")/.."
new=$(printf '%04d' "$1"); old=$(printf '%04d' "$2"); pairs=${3:-40}
name="g$1-vs-g$2"
log=runs/rl/log.txt
while ! { [ -f "runs/rl/gen-$new/net.onnx" ] && grep -q "generation $1: {'games'" "$log"; }; do
  # Matches stopped for a pause log "failed (... exit code -2)"; those aren't real failures.
  if tail -40 "$log" | grep -E "failed|Traceback" | grep -qv "exit code -2"; then echo "LOOP FAILURE: $(tail -3 "$log" | cut -c1-200)"; exit 1; fi
  age=$(( $(date +%s) - $(date -r "$log" +%s) ))
  if [ "$age" -gt 1200 ] && [ ! -f runs/rl/PAUSE ] && ! tail -1 "$log" | grep -qE "paus(ed|ing)"; then echo "LOOP QUIET for $((age / 60)) min: $(tail -1 "$log" | cut -c1-160)"; exit 1; fi
  sleep 60
done
py -3.12 -u arena/netmatch.py "runs/rl/gen-$new/net.onnx" "runs/rl/gen-$old/net.onnx" --movetime 1000 --pairs "$pairs" \
  --concurrency 2 --pause-file runs/rl/MATCH-PAUSE --out "data/arena/$name" > "data/arena/$name.log" 2>&1
remote=$(tail -1 runs/rl/remote.jsonl 2>/dev/null | grep -o '"when": "[^"]*"')
echo "$name: $(grep -E '"(wins|losses|elo|eloLow|eloHigh)"' "data/arena/$name.log" | tail -5 | tr -d ' \n') helper last seen $remote"
