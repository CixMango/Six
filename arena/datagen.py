"""Plays HexBot against itself to make training games, recording the search score of every turn.

Openings are random clustered positions of varying length (no side holding four), and the
radius alternates between 8 and 9, so the games cover a wide spread of positions.
Games go to data/selfplay/<run>/games-<worker>.jsonl, one JSON object per line:

  {"radius": 9, "opening": 7, "moves": [[q, r], ...], "winner": "X" | "O" | null,
   "turns": [{"at": 7, "score": 120, "depth": 5, "nodes": 81234}, ...]}

`at` is the index of the turn's first stone in `moves`; `score` is from the mover's view
(a win in n turns scores 1000000 - n, where turns count both sides).

Example:
  py -3.12 arena/datagen.py --games 2000 --movetime 100 --concurrency 7
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from engines import parse_spec  # noqa: E402
from make_book import candidate  # noqa: E402
from protocol import EngineClient, EngineError  # noqa: E402
from six_rules import Cell, Game  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def random_opening(rng: random.Random, radius: int) -> list[Cell]:
    while True:
        moves = candidate(rng, rng.choice((1, 3, 5, 7, 9, 11)), radius)
        if moves is not None:
            return moves


def play(client: EngineClient, rng: random.Random, movetime: int, max_stones: int) -> dict:
    radius = rng.choice((8, 9))
    opening = random_opening(rng, radius)
    game = Game(radius)
    for m in opening:
        game.place(m)
    client.send("newgame")
    turns = []
    while not game.winner and len(game.moves) < max_stones:
        at = len(game.moves)
        cells, infos = client.search(list(game.moves), radius, f"go movetime {movetime}", movetime / 1000 * 5 + 15)
        last = infos[-1] if infos else {}
        turns.append({"at": at, "score": last.get("score"), "depth": last.get("depth"), "nodes": last.get("nodes")})
        needed = game.stones_left
        if not cells or len(cells) > needed:
            raise EngineError(f"engine returned {len(cells)} stones for a {needed}-stone turn")
        for cell in cells:
            error = game.place(cell)
            if error:
                raise EngineError(f"engine played {cell}: {error}")
            if game.winner:
                break
        if not game.winner and len(cells) < needed:
            raise EngineError("engine stopped a turn early without winning")
    return {"radius": radius, "opening": len(opening), "moves": [list(m) for m in game.moves],
            "winner": game.winner, "turns": turns}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--games", type=int, default=1000)
    parser.add_argument("--movetime", type=int, default=100)
    parser.add_argument("--concurrency", type=int, default=7)
    parser.add_argument("--max-stones", type=int, default=300)
    parser.add_argument("--engine", default="hexbot:100", help="HexBot spec; its settings apply, its time is replaced by --movetime")
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    seed = args.seed if args.seed is not None else int(time.time())
    out_dir = args.out or ROOT / "data" / "selfplay" / f"{datetime.now():%Y%m%d-%H%M%S}-{args.movetime}ms"
    out_dir.mkdir(parents=True, exist_ok=True)
    spec = parse_spec(args.engine)
    (out_dir / "run.json").write_text(json.dumps({"engine": spec.label, "setup": spec.setup, "movetime": args.movetime,
                                                  "seed": seed, "maxStones": args.max_stones}, indent=2), encoding="utf-8")
    print(f"writing {args.games} games to {out_dir}")

    counter = iter(range(args.games))
    lock = threading.Lock()
    stats = {"games": 0, "stones": 0, "X": 0, "O": 0, "unfinished": 0, "errors": 0}
    started = time.monotonic()

    def worker(index: int) -> None:
        rng = random.Random(seed * 1000 + index)
        client = None
        with open(out_dir / f"games-{index:02d}.jsonl", "a", encoding="utf-8") as sink:
            while True:
                with lock:
                    if next(counter, None) is None:
                        break
                try:
                    if client is None:
                        client = EngineClient(spec.command, spec.label, cwd=str(ROOT), env=spec.env)
                        client.handshake()
                        for line in spec.setup:
                            client.send(line)
                    record = play(client, rng, args.movetime, args.max_stones)
                except EngineError as e:
                    print(f"  worker {index}: {e}; restarting the engine", file=sys.stderr, flush=True)
                    if client:
                        client.close()
                    client = None
                    with lock:
                        stats["errors"] += 1
                    continue
                sink.write(json.dumps(record, separators=(",", ":")) + "\n")
                sink.flush()
                with lock:
                    stats["games"] += 1
                    stats["stones"] += len(record["moves"])
                    stats[record["winner"] or "unfinished"] += 1
                    if stats["games"] % 50 == 0:
                        rate = stats["games"] / (time.monotonic() - started) * 3600
                        print(f"{stats['games']} games, {rate:.0f}/hour, X {stats['X']} O {stats['O']} "
                              f"unfinished {stats['unfinished']} errors {stats['errors']}", flush=True)
        if client:
            client.close()

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        list(pool.map(worker, range(args.concurrency)))
    stats["minutes"] = round((time.monotonic() - started) / 60, 1)
    print(json.dumps(stats))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
