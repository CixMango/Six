"""Training records from self-play positions where the threat solver proves a forced win (engine sixmine output).

Six's self-play skips the policy target wherever its root solver already sees the win, and a win deeper than that
solver's budget can be missed and the game lost. Here each proven position becomes a record in the network self-play
format: the game up to that point, then the win played out (the solver's turns, the toughest blocks), with those
turns as policy targets, the certain result as the value, and the owner as the winner.

  py -3.12 trainer/solver_records.py runs/mine/gen452-455.jsonl --out data/solver/gen452-455.jsonl

Rows cover the whole line when the game went another way (the win was missed), otherwise the first two turns.
"""
import argparse
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "arena"))
from six_rules import Game, player_for_stone  # noqa: E402


def rows_for(moves, start, end, mover):
    rows = []
    for t in range(start, end, 2):
        turn = moves[t:t + 2]
        value = 1.0 if player_for_stone(t) == mover else -1.0
        rows.append({"at": t, "value": value, "policy": [[q, r, 1.0 / len(turn)] for q, r in turn]})
        if len(turn) == 2:
            rows.append({"at": t + 1, "value": value, "policy": [[turn[1][0], turn[1][1], 1.0]]})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mined", nargs="+", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--keep", type=float, default=1.0, help="share of won-anyway positions to keep (missed wins all stay)")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    random.seed(a.seed)
    games = {}
    counts = {"missed": 0, "kept": 0, "skipped": 0, "bad": 0}
    a.out.parent.mkdir(parents=True, exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as out:
        for path in a.mined:
            for line in open(path, encoding="utf-8"):
                # Older sixmine output wrote Windows paths with bare backslashes.
                r = json.loads(line.replace("\\", "/"))
                if not r.get("line"):
                    continue
                file = r["file"]
                if file not in games:
                    games[file] = [json.loads(l) for l in open(file, encoding="utf-8")]
                g = games[file][r["game"]]
                k = r["at"]
                played = sorted(map(tuple, r["played"]))
                missed = r["winner"] != r["mover"] or played != sorted(map(tuple, r["first"]))
                if not missed and random.random() >= a.keep:
                    counts["skipped"] += 1
                    continue
                moves = [tuple(m) for m in g["moves"][:k]] + [tuple(c) for c in r["line"]]
                game = Game(g["radius"])
                if any(game.place(m) for m in moves) or game.winner != r["mover"]:
                    counts["bad"] += 1
                    continue
                end = len(moves) if missed else min(len(moves), k + 4)
                out.write(json.dumps({"radius": g["radius"], "opening": g.get("opening", 1), "moves": [list(m) for m in moves],
                                      "winner": r["mover"], "rows": rows_for(moves, k, end, r["mover"])}) + "\n")
                counts["missed" if missed else "kept"] += 1
    print(counts)


if __name__ == "__main__":
    main()
