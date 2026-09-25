"""Self-play health per generation: unfinished games, first-player share, game length, position diversity, and how
well the search values predicted the results (calibration).

  .venv/Scripts/python trainer/health.py            # every generation in data/rl
  .venv/Scripts/python trainer/health.py 3 4 5      # just these
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "arena"))

from six_rules import player_for_stone  # noqa: E402

DATA = Path(os.environ.get("SIX_RL_DATA", ROOT / "data" / "rl"))
DIVERSITY_STONE = 20  # compare positions this many stones in (after every random opening)


def read_games(generation: int) -> list[dict]:
    games = []
    for path in sorted((DATA / f"gen-{generation:04d}").glob("games-*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                games.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return games


def health(games: list[dict]) -> dict:
    finished = [g for g in games if g["winner"]]
    lengths = sorted(len(g["moves"]) for g in games)
    # Search value vs result, from the mover's side, in five buckets over [-1, 1].
    buckets = [[0, 0.0, 0.0] for _ in range(5)]  # rows, summed value, summed result
    squared = 0.0
    rows = 0
    for g in finished:
        for row in g["rows"]:
            result = 1.0 if g["winner"] == player_for_stone(row["at"]) else -1.0
            value = max(-1.0, min(1.0, row["value"]))
            b = buckets[min(4, int((value + 1.0) / 2.0 * 5))]
            b[0] += 1
            b[1] += value
            b[2] += result
            squared += (value - result) ** 2
            rows += 1
    positions = {
        frozenset((tuple(m), player_for_stone(i)) for i, m in enumerate(g["moves"][:DIVERSITY_STONE]))
        for g in games if len(g["moves"]) >= DIVERSITY_STONE
    }
    long_games = sum(1 for g in games if len(g["moves"]) >= DIVERSITY_STONE)
    return {
        "games": len(games),
        "unfinishedRate": round(1 - len(finished) / max(1, len(games)), 4),
        "xShare": round(sum(g["winner"] == "X" for g in finished) / max(1, len(finished)), 3),
        "medianStones": statistics.median(lengths) if lengths else 0,
        "p90Stones": lengths[int(0.9 * (len(lengths) - 1))] if lengths else 0,
        f"distinctAt{DIVERSITY_STONE}": round(len(positions) / max(1, long_games), 3),
        "valueMse": round(squared / max(1, rows), 3),
        "calibration": [
            {"value": round(v / n, 2), "result": round(r / n, 2), "rows": n} for n, v, r in buckets if n
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("generations", nargs="*", type=int)
    args = parser.parse_args()
    generations = args.generations or sorted(int(p.name[4:]) for p in DATA.glob("gen-[0-9][0-9][0-9][0-9]"))
    for g in generations:
        print(f"generation {g}: " + json.dumps(health(read_games(g))), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
