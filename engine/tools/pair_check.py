"""Do a close pair's two ringed cells stop it for good? With the opponent's stones on them and the pair's owner to
move, look for a proof that the owner still wins (non-forced wins allowed, every reply within 5 cells checked).

  py -3.12 engine/tools/pair_check.py > runs/shapes/pair-check.jsonl
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prove  # noqa: E402

# Each close pair and the ringed cells the guide recommends (from runs/shapes/wide.log, pairblock).
PAIRS = [([(0, 0), (0, 1)], [(-1, 1), (1, 0)]),
         ([(0, 0), (0, 2)], [(-2, 2), (2, 0)]),
         ([(0, 0), (0, 3)], [(-1, 3), (1, 0)]),
         ([(0, 0), (1, -2)], [(1, 0), (2, -2)])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--depth", type=int, default=5)
    ap.add_argument("--threads", type=int, default=8)
    ap.add_argument("--movetime", type=int, default=5000)
    ap.add_argument("--seconds", type=int, default=3600)
    ap.add_argument("--device", default="trt")
    a = ap.parse_args()
    six = prove.Six(a.movetime, a.device)
    try:
        for pair, ringed in PAIRS:
            started = time.time()
            prove.DEADLINE = started + a.seconds
            try:
                ok, result, positions = prove.prove_shape(six, pair, a.depth, a.threads, say=lambda s: None,
                                                          theirs=ringed, owner_first=True)
            except prove.OutOfTime:
                ok, result, positions = False, {"too_big": f"out of time ({a.seconds}s)"}, None
            print(json.dumps({"pair": pair, "ringed": ringed, "ownerWins": ok, "proof": result, "positions": positions,
                              "seconds": round(time.time() - started)}), flush=True)
    finally:
        six.close()


if __name__ == "__main__":
    main()
