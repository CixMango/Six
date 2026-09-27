"""Does Six find the forced win in every must-answer shape? Six plays the owner's turn with each engine setting, and
the solver checks whether that turn keeps a forced win (no reply within 5 cells stops it).

  python engine/tools/blindspots.py --stones 3 4 --movetime 1000 --setting narrow= --setting wide=rootThreatWide=1

Results go to runs/blind/attacker.jsonl, one line per shape and setting; a rerun skips what's done.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prove  # noqa: E402

ROOT = prove.ROOT
RUNS = ROOT / "runs/blind"


class Engine:
    """sixengine with the newest network and some options set; the owner (X) to move."""

    def __init__(self, exe, options, device):
        net = sorted((ROOT / "runs/rl").glob("gen-*/net.onnx"))[-1]
        lib = ROOT / ".venv/Lib/site-packages"
        env = dict(os.environ, PATH=os.pathsep.join([str(lib / "torch/lib"), str(lib / "tensorrt_libs"), os.environ["PATH"]]))
        self.p = subprocess.Popen([str(exe), "--net", str(net), f"--{device}"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, env=env, creationflags=prove.LOW)
        for name, value in options:
            self.p.stdin.write(f"setoption {name} {value}\n")

    def move(self, xs, os_, movetime, nodes=0, x_to_move=True):
        flat = " ".join(f"{q} {r}" for q, r in prove.game_order(xs, os_, x_to_move))
        limit = f"nodes {nodes}" if nodes else f"movetime {movetime}"
        self.p.stdin.write(f"position radius 8 moves {flat}\ngo {limit}\n")
        self.p.stdin.flush()
        score = None
        for line in self.p.stdout:
            if line.startswith("info") and " score " in line:
                score = int(line.split(" score ")[1].split()[0])
            if line.startswith("bestmove"):
                n = list(map(int, line.split()[1:]))
                return [(n[i], n[i + 1]) for i in range(0, len(n), 2)], score
        raise RuntimeError("the engine stopped")

    def close(self):
        try:
            self.p.stdin.write("quit\n")
            self.p.stdin.flush()
        except OSError:
            pass


def six_in_row(stones):
    s = set(stones)
    return any(all((c[0] + d[0] * i, c[1] + d[1] * i) in s for i in range(6)) for c in s for d in ((1, 0), (0, 1), (1, -1)))


def keeps_win(xs, threads):
    """True when the owner, after this turn, wins by force whatever the opponent replies (within 5 cells)."""
    if six_in_row(xs):
        return True, 0
    holding, _, unknown = prove.holding_replies(list(xs), [], threads)
    return not holding, len(holding)


def owner_wins(xs, os_):
    """True when the owner (X), to move, has a forced win; None when the solver ran out of budget."""
    if six_in_row(xs):
        return True
    prove.WORK.mkdir(parents=True, exist_ok=True)
    node = prove.WORK / f"to-move-{os.getpid()}.txt"
    node.write_text(" ".join(f"{q} {r}" for q, r in xs) + " | " + " ".join(f"{q} {r}" for q, r in os_) + "\n",
                    encoding="ascii")
    out = subprocess.run([str(prove.SHAPES), "--only", str(node), "--stones", "99", "--defend", "0", "--threads", "1"],
                         capture_output=True, text=True, creationflags=prove.LOW, check=True).stdout
    to_move = json.loads(out.strip().splitlines()[-1])["toMove"]
    return None if to_move["unknown"] else to_move["win"]


def defend(a, shapes, out, done):
    """Six defends each must-answer shape (the opponent to move); does its reply stop the forced win?"""
    engine = Engine(a.engine, [], a.device)
    try:
        for i, r in enumerate(shapes, 1):
            if (json.dumps(r["shape"]), "defend") in done:
                continue
            xs = [tuple(c) for c in r["shape"]]
            reply, score = engine.move(xs, [], a.movetime, a.nodes, x_to_move=False)
            wins = owner_wins(xs, reply)
            row = {"shape": r["shape"], "stones": r["stones"], "setting": "defend", "reply": [list(c) for c in reply],
                   "score": score, "holds": wins is False, "unknown": wins is None,
                   "holdingKnown": len(r["defenses"]["holding"]), "tried": r["defenses"]["tried"]}
            out.write(json.dumps(row) + "\n")
            out.flush()
            print(f"[defend {i}/{len(shapes)}] {r['shape']}: {'holds' if wins is False else 'unknown' if wins is None else 'LOSES'}",
                  flush=True)
    finally:
        engine.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stones", type=int, nargs="+", default=[3, 4])
    ap.add_argument("--movetime", type=int, default=1000)
    ap.add_argument("--nodes", type=int, default=0, help="search this many nodes instead (the same on a busy machine)")
    ap.add_argument("--setting", action="append", default=[], help="name=opt=value,opt=value (empty for defaults)")
    ap.add_argument("--engine", default=str(ROOT / "engine/build/exp/sixengine.exe"))
    ap.add_argument("--device", default="trt")
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--source", default="s4d.jsonl")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--out", default=str(RUNS / "attacker.jsonl"))
    ap.add_argument("--defend", action="store_true", help="Six defends instead (shapes with a known holding reply)")
    a = ap.parse_args()
    RUNS.mkdir(parents=True, exist_ok=True)
    settings = []
    for s in a.setting or ["default="]:
        name, _, rest = s.partition("=")
        opts = [tuple(kv.split("=")) for kv in rest.split(",") if kv]
        settings.append((name, opts))
    shapes = []
    for line in open(ROOT / "runs/shapes" / a.source, encoding="utf-8"):
        r = json.loads(line)
        if r["stones"] in a.stones and r["toMove"]["win"]:
            shapes.append(r)
    if a.defend:
        shapes = [r for r in shapes if r.get("defenses") and r["defenses"]["holding"]]
    if a.limit:
        shapes = shapes[:a.limit]
    out_path = Path(a.out)
    done = set()
    if out_path.exists():
        for line in open(out_path, encoding="utf-8"):
            r = json.loads(line)
            done.add((json.dumps(r["shape"]), r["setting"]))
    checked = {}
    with open(out_path, "a", encoding="utf-8") as out:
        if a.defend:
            return defend(a, shapes, out, done)
        for name, opts in settings:
            engine = Engine(a.engine, opts, a.device)
            try:
                for i, r in enumerate(shapes, 1):
                    if (json.dumps(r["shape"]), name) in done:
                        continue
                    xs = [tuple(c) for c in r["shape"]]
                    started = time.time()
                    turn, score = engine.move(xs, [], a.movetime, a.nodes)
                    k = tuple(sorted(xs + turn))
                    if k not in checked:
                        checked[k] = keeps_win(xs + turn, a.threads)
                    kept, holding = checked[k]
                    row = {"shape": r["shape"], "stones": r["stones"], "setting": name, "turn": [list(c) for c in turn],
                           "score": score, "kept": kept, "holding": holding, "solverTurns": r["toMove"]["turns"],
                           "seconds": round(time.time() - started, 1)}
                    out.write(json.dumps(row) + "\n")
                    out.flush()
                    print(f"[{name} {i}/{len(shapes)}] {r['shape']}: {'kept' if kept else f'MISSED ({holding} replies hold)'}",
                          flush=True)
            finally:
                engine.close()


if __name__ == "__main__":
    main()
