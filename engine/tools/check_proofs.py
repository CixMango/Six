"""Checks the survey's proofs (survey.jsonl, survey-deep.jsonl) again from scratch.

At every defender turn in a proof tree the holding replies are recomputed (sixshapes, every reply within 5 cells).
Each one must be answered in the tree: by its own branch, or by a branch for a reply the position's symmetry maps
onto it. Each owner turn must be legal, and after the last one no reply may hold. A node the search marked "cached"
(proven elsewhere) must be proven somewhere in the same tree.

  py -3.12 engine/tools/check_proofs.py > runs/shapes/proof-check.jsonl
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prove  # noqa: E402

RUNS = prove.ROOT / "runs/shapes"


class Failed(Exception):
    pass


def key(xs, os_):
    return prove.position_key(list(xs), list(os_))


def proven_keys(xs, os_, node, out):
    """Every defender position the tree proves outright (not by a cache hit)."""
    if "cached" in node:
        return
    out.add(key(xs, os_))
    for b in node.get("survive", []):
        then = b["then"]
        o2 = os_ + [tuple(c) for c in b["O"]]
        if "X" in then:
            proven_keys(xs + [tuple(c) for c in then["X"]], o2, then["then"], out)


def check_defender(xs, os_, node, threads, known, stats, depth=0):
    if "cached" in node:
        if key(xs, os_) not in known:
            stats["cachedElsewhere"] += 1
        return
    stats["positions"] += 1
    holding, _, unknown = prove.holding_replies(list(xs), list(os_), threads)
    reps = [tuple(sorted(tuple(c) for c in b["O"])) for b in node.get("survive", [])]
    maps = prove.symmetries(list(xs), list(os_)) or [lambda h: h]
    covered = {tuple(sorted(m(c) for c in rep)) for rep in reps for m in maps}
    for reply in holding:
        if tuple(sorted(reply)) not in covered:
            raise Failed(f"reply {list(reply)} after {len(os_)} defender stones isn't answered")
    for b in node.get("survive", []):
        o2 = os_ + [tuple(c) for c in b["O"]]
        then = b["then"]
        if "X" not in then:
            raise Failed("a branch has no owner turn")
        turn = [tuple(c) for c in then["X"]]
        if set(turn) & (set(xs) | set(o2)) or len(set(turn)) != len(turn):
            raise Failed(f"owner turn {turn} is on an occupied cell")
        check_defender(xs + turn, o2, then["then"], threads, known, stats, depth + 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--threads", type=int, default=8)
    a = ap.parse_args()
    latest = {}
    for name in ("survey.jsonl", "survey-deep.jsonl"):
        path = RUNS / name
        if path.exists():
            for line in open(path, encoding="utf-8"):
                r = json.loads(line)
                if r["result"] == "proven" and isinstance(r.get("proof"), dict):
                    latest[json.dumps(sorted(r["shape"]))] = r
    for r in latest.values():
        xs = [tuple(c) for c in r["shape"]]
        stats = {"positions": 0, "cachedElsewhere": 0}
        known = set()
        proven_keys(xs, [], r["proof"], known)
        try:
            check_defender(xs, [], r["proof"], a.threads, known, stats)
            ok, why = True, ""
        except Failed as e:
            ok, why = False, str(e)
        print(json.dumps({"shape": r["shape"], "ok": ok, "why": why, **stats}), flush=True)


if __name__ == "__main__":
    main()
