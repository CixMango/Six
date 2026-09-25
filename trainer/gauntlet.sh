#!/usr/bin/env bash
# Plays one network against each locally runnable rival bot, one match at a time, and records the results
# on the dashboard. KrakenBot is excluded because it only runs as a hosted service.
#   bash trainer/gauntlet.sh GENERATION [PAIRS]
set -u
cd "$(dirname "$0")/.."
gen=$(printf '%04d' "$1"); pairs=${2:-20}
ours="hexnet:1000:runs/rl/gen-$gen/net.onnx"
# Wait for any other arena match to finish so only one runs beside training.
while powershell -NoProfile -Command "if (Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { \$_.CommandLine -match 'netmatch\.py|arena.match\.py' }) { exit 0 } else { exit 1 }"; do sleep 60; done
for rival in "strix-live:512:deep" "shrimp:1024" "sealbot:t5" "hexo_bot2:5" "hexbot:5000"; do
  name="gauntlet-g$1-$(echo "$rival" | tr ':' '-')"
  py -3.12 -u arena/match.py "$ours" "$rival" --pairs "$pairs" --concurrency 2 --pause-file runs/rl/MATCH-PAUSE \
    --out "data/arena/$name" > "data/arena/$name.log" 2>&1
  if [ -f "data/arena/$name/summary.json" ]; then
    py -3.12 arena/record_rival.py "data/arena/$name/summary.json" > /dev/null 2>&1
    echo "$rival: $(grep -oE '"(wins|losses|draws|elo)": [-0-9.]+' "data/arena/$name/summary.json" | tr '\n' ' ')"
  else
    echo "$rival: no result ($(tail -1 "data/arena/$name.log" | cut -c1-120))"
  fi
done
