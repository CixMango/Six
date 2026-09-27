"""Does Six's search see the forced wins that self-play games lost? Positions come from sixmine output (the side to
move has a proven forced win but lost that game); Six searches each with every setting and reports whether its root
proved the win (a winning score) and which turn it plays.

  py -3.12 engine/tools/recognize.py runs/mine/gen452-455.jsonl --sample 300 --nodes 15000 \
      --setting default= --setting wide=rootThreatWide=1 --setting big=rootThreatWide=1,rootThreatNodes=300000
"""
import argparse
import json
import os
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prove  # noqa: E402

ROOT = prove.ROOT
WIN = 1_000_000


def engine(exe, options):
    net = sorted((ROOT / "runs/rl").glob("gen-*/net.onnx"))[-1]
    lib = ROOT / ".venv/Lib/site-packages"
    env = dict(os.environ, PATH=os.pathsep.join([str(lib / "torch/lib"), str(lib / "tensorrt_libs"), os.environ["PATH"]]))
    p = subprocess.Popen([str(exe), "--net", str(net), "--trt"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                         stderr=subprocess.DEVNULL, text=True, env=env, creationflags=prove.LOW)
    for name, value in options:
        p.stdin.write(f"setoption {name} {value}\n")
    return p


def search(p, radius, moves, nodes):
    flat = " ".join(f"{q} {r}" for q, r in moves)
    p.stdin.write(f"position radius {radius} moves {flat}\ngo nodes {nodes}\n")
    p.stdin.flush()
    score = None
    for line in p.stdout:
        if line.startswith("info") and " score " in line:
            score = int(line.split(" score ")[1].split()[0])
        if line.startswith("bestmove"):
            n = list(map(int, line.split()[1:]))
            return [[n[i], n[i + 1]] for i in range(0, len(n), 2)], score
    raise RuntimeError("the engine stopped")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mined", nargs="+", type=Path)
    ap.add_argument("--sample", type=int, default=300)
    ap.add_argument("--nodes", type=int, default=15000)
    ap.add_argument("--setting", action="append", default=[])
    ap.add_argument("--engine", default=str(ROOT / "engine/build/exp/sixengine.exe"))
    ap.add_argument("--out", type=Path, default=ROOT / "runs/mine/recognize.jsonl")
    ap.add_argument("--seed", type=int, default=5)
    a = ap.parse_args()
    lost = []
    for path in a.mined:
        for line in open(path, encoding="utf-8"):
            r = json.loads(line.replace("\\", "/"))
            if r["mover"] != r["winner"] and r.get("line"):
                lost.append(r)
    random.seed(a.seed)
    sample = random.sample(lost, min(a.sample, len(lost)))
    games = {}
    settings = []
    for s in a.setting or ["default="]:
        name, _, rest = s.partition("=")
        settings.append((name, [tuple(kv.split("=")) for kv in rest.split(",") if kv]))
    with open(a.out, "w", encoding="utf-8") as out:
        for name, opts in settings:
            p = engine(a.engine, opts)
            try:
                for i, r in enumerate(sample, 1):
                    if r["file"] not in games:
                        games[r["file"]] = [json.loads(l) for l in open(r["file"], encoding="utf-8")]
                    g = games[r["file"]][r["game"]]
                    turn, score = search(p, g["radius"], g["moves"][:r["at"]], a.nodes)
                    row = {"file": r["file"], "game": r["game"], "at": r["at"], "setting": name, "turn": turn,
                           "score": score, "proved": score is not None and score >= WIN,
                           "solverFirst": r["first"], "solverTurns": r["wide"] or r["narrow"],
                           "playedInGame": r["played"]}
                    out.write(json.dumps(row) + "\n")
                    out.flush()
                    print(f"[{name} {i}/{len(sample)}] proved={row['proved']} score={score}", flush=True)
            finally:
                try:
                    p.stdin.write("quit\n")
                    p.stdin.flush()
                except OSError:
                    pass


if __name__ == "__main__":
    main()
