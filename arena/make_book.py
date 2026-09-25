"""Builds a book of balanced openings, so paired games aren't decided by who plays X.

Candidates are short random games with stones clustered near the center and no side holding
four in a window. HexBot scores each one at two consecutive depths (averaged, because odd and
even depths favor different sides), and the most even candidates are kept.

Example:
  py -3.12 arena/make_book.py --out arena/books/balanced.json --count 300
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from engines import parse_spec  # noqa: E402
from protocol import EngineClient, EngineError  # noqa: E402
from six_rules import AXES, WIN_LENGTH, Cell, Game, cells_within, player_for_stone  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
WIN_SCORE = 1_000_000


def holds_four(game: Game, cell: Cell) -> bool:
    """Whether the stone just placed at `cell` gives its owner a window with four or more stones and none of the other's."""
    owner = game.cells[cell]
    for dq, dr in AXES:
        for k in range(WIN_LENGTH):
            window = [(cell[0] + dq * (i - k), cell[1] + dr * (i - k)) for i in range(WIN_LENGTH)]
            mine = sum(1 for c in window if game.cells.get(c) == owner)
            theirs = sum(1 for c in window if c in game.cells and game.cells[c] != owner)
            if mine >= 4 and theirs == 0:
                return True
    return False


def candidate(rng: random.Random, stones: int, radius: int) -> list[Cell] | None:
    game = Game(radius)
    game.place((0, 0))
    for _ in range(stones * 20):
        if len(game.moves) == stones:
            return list(game.moves)
        base = rng.choice(game.moves)
        cell = rng.choice([c for c in cells_within(base, 2) if c not in game.cells])
        game.place(cell)
        if holds_four(game, cell):
            return None
    return None


def score_opening(client: EngineClient, moves: list[Cell], radius: int, movetime: int) -> float | None:
    """Average of the last two completed depths' scores for the side to move, or None if proven or too shallow."""
    client.send("newgame")
    _, infos = client.search(moves, radius, f"go movetime {movetime}", movetime / 1000 * 5 + 10)
    scores = [info["score"] for info in infos if "score" in info]
    if len(scores) < 2 or any(abs(s) > WIN_SCORE // 2 for s in scores[-2:]):
        return None
    return (scores[-1] + scores[-2]) / 2


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=ROOT / "arena" / "books" / "balanced.json")
    parser.add_argument("--count", type=int, default=300)
    parser.add_argument("--candidates", type=int, default=1500)
    parser.add_argument("--stones", type=int, nargs="+", default=[7, 9])
    parser.add_argument("--radius", type=int, default=8)
    parser.add_argument("--movetime", type=int, default=300)
    parser.add_argument("--concurrency", type=int, default=7)
    parser.add_argument("--seed", type=int, default=2026)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    seen: set[frozenset] = set()
    pool: list[list[Cell]] = []
    while len(pool) < args.candidates:
        moves = candidate(rng, rng.choice(args.stones), args.radius)
        if moves is None:
            continue
        # The same stones in another order are the same position.
        key = frozenset((m, player_for_stone(i)) for i, m in enumerate(moves))
        if key not in seen:
            seen.add(key)
            pool.append(moves)

    spec = parse_spec("hexbot:1000")
    local = threading.local()
    clients: list[EngineClient] = []
    lock = threading.Lock()
    done = [0]

    def evaluate(moves: list[Cell]):
        if not hasattr(local, "client"):
            local.client = EngineClient(spec.command, spec.label, cwd=str(ROOT), env=spec.env)
            local.client.handshake()
            with lock:
                clients.append(local.client)
        try:
            score = score_opening(local.client, moves, args.radius, args.movetime)
        except EngineError as e:
            print(f"  skipped a candidate: {e}", file=sys.stderr)
            score = None
        with lock:
            done[0] += 1
            if done[0] % 100 == 0:
                print(f"scored {done[0]}/{len(pool)}", flush=True)
        return moves, score

    try:
        with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            scored = [(m, s) for m, s in executor.map(evaluate, pool) if s is not None]
    finally:
        for client in clients:
            client.close()

    scored.sort(key=lambda item: (abs(item[1]), len(item[0])))
    kept = scored[: args.count]
    if len(kept) < args.count:
        print(f"only {len(kept)} usable candidates", file=sys.stderr)
    book = {
        "format": "six-book-1",
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "radius": args.radius,
        "method": f"random clustered openings of {args.stones} stones, HexBot {args.movetime} ms, "
                  f"most even {len(kept)} of {len(scored)} scored",
        "openings": [{"moves": [list(m) for m in moves], "score": score} for moves, score in kept],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(book, indent=1), encoding="utf-8")
    worst = max(abs(s) for _, s in kept) if kept else 0
    print(f"wrote {len(kept)} openings to {args.out} (largest |score| {worst:.0f})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
