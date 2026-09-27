"""Classifies every small shape with the opponent moving first, counting non-forced wins too.

For each shape (smallest first):
  - forced:      unstoppable by double threats alone (from the earlier sixshapes run)
  - contains:    holds a copy of a shape already proven unstoppable (your own extra stones never hurt you)
  - proven:      prove.py shows a win with a few non-forced turns allowed
  - open:        not proven; Six's best defence and how it rates the position are recorded

Results go to runs/shapes/survey.jsonl, one line per shape; a rerun skips shapes already done.

  python engine/tools/survey.py --device cpu
"""
import argparse
import json
import sys
import time
from itertools import combinations
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "guide"))
import prove  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "trainer"))
from pause import pause_reason  # noqa: E402
from make_shapes import canonical  # noqa: E402

RUNS = prove.ROOT / "runs/shapes"


def contains(shape, proven):
    for n in range(2, len(shape)):
        for sub in combinations(shape, n):
            if canonical(list(sub)) in proven:
                return canonical(list(sub))
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--movetime", type=int, default=5000)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--depth", type=int, default=3)
    ap.add_argument("--prove-below", type=int, default=-800, help="try a proof when Six rates the defender this low")
    ap.add_argument("--max-branch", type=int, default=40, help="give up a proof when more replies than this survive")
    ap.add_argument("--root-branch", type=int, default=20000, help="the same limit for the defender's first reply")
    ap.add_argument("--retry-open", action="store_true",
                    help="with --deep: one more try, with backtracking, for shapes an earlier deep pass left open")
    ap.add_argument("--quick", type=int, default=0, help="with --deep: cap every proof at this many seconds (a first sweep)")
    ap.add_argument("--part", type=int, default=0, help="with --parts: this process takes every parts-th shape")
    ap.add_argument("--parts", type=int, default=1)
    ap.add_argument("--shape-seconds", type=int, default=420, help="give up a proof after this long (0: no limit)")
    ap.add_argument("--stones", type=int, default=4)
    ap.add_argument("--reuse", help="an earlier survey.jsonl: its Six ratings and proofs are kept (a proof stays a proof "
                                    "when the solver gets stronger); open shapes get tried again")
    ap.add_argument("--reuse-deep", help="with --deep: an earlier survey-deep.jsonl whose proofs are kept")
    ap.add_argument("--deep", action="store_true",
                    help="retry the shapes whose proof failed or was too big (use a larger --depth), into survey-deep.jsonl")
    a = ap.parse_args()
    if a.deep:
        return deep(a)

    shapes = {}
    for line in open(RUNS / "s4d.jsonl", encoding="utf-8"):
        r = json.loads(line)
        if 2 <= r["stones"] <= a.stones:
            shapes[canonical([tuple(c) for c in r["shape"]])] = [tuple(c) for c in r["shape"]]
    forced = set()
    for line in open(RUNS / "unstoppable4-r5.jsonl", encoding="utf-8"):
        r = json.loads(line)
        if not r["defenses"]["holding"] and not r["defenses"]["unknown"]:
            forced.add(canonical([tuple(c) for c in r["shape"]]))

    out_path = RUNS / "survey.jsonl"
    done = {}
    if out_path.exists():
        for line in open(out_path, encoding="utf-8"):
            r = json.loads(line)
            done[canonical([tuple(c) for c in r["shape"]])] = r
    proven = set(forced) | {k for k, r in done.items() if r["result"] in ("forced", "contains", "proven")}
    earlier = {}
    if a.reuse:
        for line in open(a.reuse, encoding="utf-8"):
            r = json.loads(line)
            earlier[canonical([tuple(c) for c in r["shape"]])] = r

    six = Engine(a)
    order = sorted(shapes, key=lambda k: (len(k), k))
    out = open(out_path, "a", encoding="utf-8")
    try:
        for i, k in enumerate(order, 1):
            if k in done:
                continue
            shape = shapes[k]
            started = time.time()
            row = {"shape": shape, "stones": len(shape)}
            inside = contains(shape, proven)
            if k in forced:
                row["result"] = "forced"
            elif inside:
                row.update(result="contains", inside=[list(c) for c in inside])
            elif earlier.get(k, {}).get("result") == "proven":
                old = earlier[k]
                row.update(result="proven", proof=old["proof"], positions=old.get("positions"), reused=True,
                           **{f: old[f] for f in ("six_reply", "six_defender") if f in old})
            else:
                if "six_defender" in earlier.get(k, {}):
                    reply, score = earlier[k].get("six_reply"), earlier[k]["six_defender"]
                else:
                    six.check()
                    reply, score = six.move(shape, [], x_to_move=False)
                row.update(six_reply=reply, six_defender=score)
                if score is not None and score <= a.prove_below:
                    try:
                        ok, result, positions = prove_shape_capped(six, shape, a)
                    except TooBig as e:
                        ok, result, positions = False, {"too_big": str(e)}, None
                    row.update(result="proven" if ok else "open", proof=result, positions=positions)
                else:
                    row["result"] = "open"
            row["seconds"] = round(time.time() - started)
            if row["result"] in ("forced", "contains", "proven"):
                proven.add(k)
            row["at"] = round(time.time())
            out.write(json.dumps(row) + "\n")
            out.flush()
            print(f"[{i}/{len(order)}] {len(shape)} stones {shape}: {row['result']}"
                  + (f" (Six rates the defender {row.get('six_defender')})" if "six_defender" in row else "")
                  + f" {row['seconds']}s", flush=True)
    finally:
        out.close()
        six.close()


class Engine:
    """Six on the graphics card, moved to the processor while a game (or the Six app) is using the machine."""

    def __init__(self, a):
        self.a = a
        self.six = None
        self.check()

    def check(self):
        want = "cpu" if (self.a.device == "cpu" or pause_reason()) else self.a.device
        if self.six is None or not self.six.name.endswith(want):
            if self.six:
                self.six.close()
            self.six = prove.Six(self.a.movetime, want)
            print("Six:", self.six.name, flush=True)

    def move(self, *args, **kw):
        return self.six.move(*args, **kw)

    def close(self):
        self.six.close()


def deep(a):
    """Longer proofs for the shapes a shorter proof didn't settle."""
    rows = [json.loads(line) for line in open(RUNS / "survey.jsonl", encoding="utf-8")]
    # Every shape still open, the likeliest proofs (Six thinks the owner is ahead) first.
    todo = [r for r in rows if r["result"] == "open"]
    todo.sort(key=lambda r: (r["stones"], r.get("six_defender") or 0))
    if a.retry_open:
        latest = {}
        for line in open(RUNS / "survey-deep.jsonl", encoding="utf-8"):
            r = json.loads(line)
            latest[canonical([tuple(c) for c in r["shape"]])] = r
        todo = [r for r in todo if (d := latest.get(canonical([tuple(c) for c in r["shape"]])))
                and d["result"] == "open" and not d.get("retried")]
    todo = todo[a.part::a.parts]
    out_path = RUNS / "survey-deep.jsonl"
    done = set()
    retried = set()
    timed_out = {}
    proven = {canonical([tuple(c) for c in r["shape"]]) for r in rows if r["result"] in ("forced", "contains", "proven")}
    earlier = {}
    if a.reuse_deep:
        for line in open(a.reuse_deep, encoding="utf-8"):
            r = json.loads(line)
            if r["result"] == "proven":
                earlier[canonical([tuple(c) for c in r["shape"]])] = r
    if out_path.exists():
        for line in open(out_path, encoding="utf-8"):
            r = json.loads(line)
            done.add(canonical([tuple(c) for c in r["shape"]]))
            why = str((r.get("proof") or {}).get("too_big", "")) if isinstance(r.get("proof"), dict) else ""
            if r["result"] == "open" and why.startswith("out of time ("):
                timed_out[canonical([tuple(c) for c in r["shape"]])] = int(why.split("(")[1].rstrip("s)"))
            elif canonical([tuple(c) for c in r["shape"]]) in timed_out:
                del timed_out[canonical([tuple(c) for c in r["shape"]])]
            if r.get("retried"):
                retried.add(canonical([tuple(c) for c in r["shape"]]))
            if r["result"] in ("proven", "contains"):
                proven.add(canonical([tuple(c) for c in r["shape"]]))
    six = Engine(a)
    out = open(out_path, "a", encoding="utf-8")
    try:
        for i, r in enumerate(todo, 1):
            shape = [tuple(c) for c in r["shape"]]
            rating = r.get("six_defender") or 0
            budget = a.shape_seconds if rating <= -800 else min(a.shape_seconds, 420 if rating <= -500 else 300 if rating < 0
                                                                else 180)
            if a.quick:
                budget = min(budget, a.quick)
            k = canonical(shape)
            if k in (retried if a.retry_open else done) and not (k in timed_out and timed_out[k] < budget):
                continue
            started = time.time()
            inside = contains(shape, proven)
            if inside:
                row = {"shape": shape, "stones": len(shape), "result": "contains", "inside": [list(c) for c in inside],
                       "seconds": 0}
            elif k in earlier:
                row = {**earlier[k], "reused": True}
            else:
                six.check()
                try:
                    # The likeliest proofs (Six sees the defender as lost) get the most time.
                    ok, result, positions = prove_shape_capped(six, shape, a, budget)
                except TooBig as e:
                    ok, result, positions = False, {"too_big": str(e)}, None
                row = {"shape": shape, "stones": len(shape), "depth": a.depth, "result": "proven" if ok else "open",
                       "proof": result, "positions": positions, "seconds": round(time.time() - started),
                       "retried": a.retry_open}
            if row["result"] in ("proven", "contains"):
                proven.add(canonical(shape))
            row["at"] = round(time.time())
            out.write(json.dumps(row) + "\n")
            out.flush()
            print(f"[deep {i}/{len(todo)}] {shape}: {row['result']} {row['seconds']}s", flush=True)
    finally:
        out.close()
        six.close()


class TooBig(Exception):
    pass


def prove_shape_capped(six, shape, a, seconds=None):
    real = prove.holding_replies
    seconds = a.shape_seconds if seconds is None else seconds
    started = time.time()

    def capped(xs, os_, threads):
        if seconds and time.time() - started > seconds:
            raise TooBig(f"out of time ({seconds}s)")
        holding, tried, unknown = real(xs, os_, threads)
        limit = a.root_branch if not os_ else a.max_branch
        if len(holding) > limit:
            raise TooBig(f"{len(holding)} replies survive after {len(os_)} defender stones")
        return holding, tried, unknown

    prove.holding_replies = capped
    # A single reply check can run long on a spread-out position: it gets stopped at the budget too.
    prove.DEADLINE = started + seconds if seconds else None
    try:
        return prove.prove_shape(six.six if isinstance(six, Engine) else six, shape, a.depth, a.threads, say=lambda s: None)
    except prove.OutOfTime:
        raise TooBig(f"out of time ({seconds}s)") from None
    finally:
        prove.holding_replies = real
        prove.DEADLINE = None


if __name__ == "__main__":
    main()
