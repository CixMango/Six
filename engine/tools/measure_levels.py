"""How many positions Six looks at per turn at each thinking time, on this PC: the budgets for thinking by positions.

Plays each level's time on real positions (turn starts from saved games, early to late) with a fresh tree each time,
the way a player's slower PC would search them, and writes the median per level.

  py -3.12 engine/tools/measure_levels.py [--engine engine/build/release/sixengine.exe] [--net runs/rl/gen-0455/net.onnx]
      > runs/levels/levels.json
"""
import argparse
import json
import os
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TIMES_MS = [500, 1000, 2500, 5000, 10000, 20000, 45000]
STAGES = (8, 16, 26, 40)  # stone counts to take positions near


def turn_starts(n):
    """Stone counts where a two-stone turn begins: 1, 3, 5, ..."""
    return [i for i in range(1, n) if (i - 1) % 2 == 0]


def positions(limit):
    out = []
    for f in sorted((ROOT / "data" / "replays").glob("*.json")):
        try:
            r = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        moves = r.get("moves") or []
        if r.get("setup") or len(moves) < 12:
            continue
        starts = turn_starts(len(moves))
        for stage in STAGES:
            at = min(starts, key=lambda i: abs(i - stage))
            if abs(at - stage) <= 3:
                out.append({"radius": r.get("radius", 8), "moves": moves[:at], "from": f.name})
    # Spread over games and stages, not just the first few games.
    step = max(1, len(out) // limit)
    return out[::step][:limit]


def main():
    ap = argparse.ArgumentParser()
    # The optimised build: a debug build (build/exp can be one) searches about three times slower.
    ap.add_argument("--engine", default=str(ROOT / "engine/build/release/sixengine.exe"))
    ap.add_argument("--net", default=str(ROOT / "runs/rl/gen-0455/net.onnx"))
    ap.add_argument("--positions", type=int, default=24)
    ap.add_argument("--levels", default="1,2,3,4,5,6,7", help="which levels to measure, e.g. 6,7")
    ap.add_argument("--tree", type=int, default=0, help="the engine's tree limit (setoption maxTreeNodes), 0: its default")
    args = ap.parse_args()
    lib = ROOT / ".venv/Lib/site-packages"
    env = dict(os.environ, PATH=os.pathsep.join([str(lib / "torch/lib"), str(lib / "tensorrt_libs"), os.environ["PATH"]]))
    trt = ["--trt"] if (lib / "tensorrt_libs/nvinfer_10.dll").exists() else []
    engine = subprocess.Popen([args.engine, "--net", args.net, *trt], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                              stderr=subprocess.DEVNULL, text=True, env=env)

    def ask(lines):
        for line in lines:
            engine.stdin.write(line + "\n")
        engine.stdin.flush()

    def search(pos, ms):
        flat = " ".join(f"{q} {r}" for q, r in pos["moves"])
        ask(["newgame", f"position radius {pos['radius']} moves {flat}", f"go movetime {ms}"])
        nodes = None
        for line in engine.stdout:
            if line.startswith("info") and " score " in line:
                nodes = int(line.split(" nodes ")[1].split()[0])
            if line.startswith("bestmove"):
                return nodes
        raise RuntimeError("the engine stopped")

    if args.tree:
        ask([f"setoption maxTreeNodes {args.tree}"])
    wanted = {int(x) for x in args.levels.split(",")}
    chosen = positions(args.positions)
    print(f"{len(chosen)} positions; engine {'TensorRT' if trt else 'CUDA'}", file=sys.stderr, flush=True)
    search(chosen[0], 2000)  # warm-up: loading and building the GPU engine
    levels = []
    for level, ms in enumerate(TIMES_MS, 1):
        if level not in wanted:
            continue
        counts = []
        for pos in chosen:
            n = search(pos, ms)
            if n:  # a turn decided by the threat search alone looks at no positions
                counts.append(n)
        levels.append({"level": level, "ms": ms, "median": int(statistics.median(counts)), "min": min(counts),
                       "max": max(counts), "samples": len(counts)})
        print(json.dumps(levels[-1]), file=sys.stderr, flush=True)
    ask(["quit"])
    print(json.dumps({"net": Path(args.net).parent.name, "tree": args.tree or None, "positions": len(chosen), "levels": levels}, indent=2))


if __name__ == "__main__":
    main()
