"""Plays paired games between two engines and reports Elo and SPRT results.

Example:
  py -3.12 arena/match.py hexbot:1000 sealbot:d4 --pairs 100 --radius 8 --concurrency 6 --sprt 0 50

Every game is saved as a six-replay record under data/arena/<run>/, so it can be opened in
the app's analysis board.
"""
from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from engines import EngineSpec, parse_spec  # noqa: E402
from openings import DEFAULT_BOOK, openings  # noqa: E402
from protocol import EngineClient, EngineError  # noqa: E402
from six_rules import Cell, Game  # noqa: E402
from sprt import elo_estimate, elo_json, llr, sprt_bounds  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


@dataclass
class GameOutcome:
    x: str
    o: str
    winner: str | None  # "X", "O" or None for a draw by length
    reason: str  # six, forfeit, length
    moves: list[Cell]
    detail: str = ""
    seconds: float = 0.0
    times: dict[str, float] = field(default_factory=dict)  # thinking seconds per side
    turns: dict[str, int] = field(default_factory=dict)


def play_game(x_spec: EngineSpec, o_spec: EngineSpec, opening: list[Cell], radius: int, max_stones: int) -> GameOutcome:
    specs = {"X": x_spec, "O": o_spec}
    clients: dict[str, EngineClient] = {}
    game = Game(radius)
    started = time.monotonic()
    think = {"X": 0.0, "O": 0.0}
    turns = {"X": 0, "O": 0}
    try:
        for side, spec in specs.items():
            clients[side] = EngineClient(spec.command, spec.label, cwd=str(ROOT), env=spec.env)
            clients[side].handshake()
            for line in spec.setup:
                clients[side].send(line)
            clients[side].new_game()
        for cell in opening:
            game.place(cell)
        while not game.winner and len(game.moves) < max_stones:
            side = game.current
            spec = specs[side]
            t0 = time.monotonic()
            try:
                cells = clients[side].best_turn(list(game.moves), radius, spec.go, spec.move_timeout)
            except EngineError as e:
                return GameOutcome(x_spec.label, o_spec.label, other(side), "forfeit", list(game.moves), str(e))
            think[side] += time.monotonic() - t0
            turns[side] += 1
            needed = game.stones_left
            if not cells or len(cells) > needed:
                return GameOutcome(x_spec.label, o_spec.label, other(side), "forfeit", list(game.moves),
                                   f"{spec.label} returned {len(cells)} stones for a {needed}-stone turn")
            for cell in cells:
                error = game.place(cell)
                if error:
                    return GameOutcome(x_spec.label, o_spec.label, other(side), "forfeit", list(game.moves),
                                       f"{spec.label} played {cell}: {error}")
                if game.winner:
                    break
            if not game.winner and len(cells) < needed:
                return GameOutcome(x_spec.label, o_spec.label, other(side), "forfeit", list(game.moves),
                                   f"{spec.label} stopped a turn early without winning")
        reason = "six" if game.winner else "length"
        return GameOutcome(x_spec.label, o_spec.label, game.winner, reason, list(game.moves),
                           seconds=time.monotonic() - started, times=think, turns=turns)
    finally:
        for client in clients.values():
            client.close()


def other(side: str) -> str:
    return "O" if side == "X" else "X"


def score_for(outcome: GameOutcome, a_side: str) -> float:
    if outcome.winner is None:
        return 0.5
    return 1.0 if outcome.winner == a_side else 0.0


def save_replay(path: Path, outcome: GameOutcome, radius: int, run_id: str, index: int) -> None:
    if outcome.reason == "six":
        result = {"winner": outcome.winner, "reason": "six"}
    elif outcome.reason == "forfeit":
        result = {"winner": outcome.winner, "reason": "abandoned"}
    else:
        result = {"winner": None, "reason": "unfinished"}
    record = {
        "format": "six-replay",
        "version": 1,
        "id": f"{run_id}-{index:04d}",
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "mode": "botmatch",
        "radius": radius,
        "players": {
            "X": {"name": outcome.x[:40], "kind": "bot", "bot": outcome.x[:40]},
            "O": {"name": outcome.o[:40], "kind": "bot", "bot": outcome.o[:40]},
        },
        "moves": [[q, r] for q, r in outcome.moves],
        "result": result,
    }
    path.write_text(json.dumps(record), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("engine_a")
    parser.add_argument("engine_b")
    parser.add_argument("--pairs", type=int, default=50)
    parser.add_argument("--radius", type=int, default=8, choices=(8, 9))
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--max-stones", type=int, default=400)
    parser.add_argument("--sprt", type=float, nargs=2, metavar=("ELO0", "ELO1"))
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--book", default=str(DEFAULT_BOOK), help="opening book JSON, or 'none' for X-center openings")
    parser.add_argument("--out", type=Path, default=None, help="folder for the replays and summary (default: data/arena/<run>)")
    parser.add_argument("--pause-file", type=Path, default=None,
                        help="while this file exists, finish the game in hand and start no new one")
    args = parser.parse_args()

    a = parse_spec(args.engine_a)
    b = parse_spec(args.engine_b)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = lambda s: "".join(ch if ch.isalnum() else "-" for ch in s.lower())
    run_id = f"{stamp}-{slug(a.label)}-vs-{slug(b.label)}"[:60].rstrip("-")
    out_dir = args.out or ROOT / "data" / "arena" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)

    book_path = None if args.book == "none" else Path(args.book)
    book = openings(args.pairs, args.seed, book_path if book_path and book_path.exists() else None)
    penta = [0, 0, 0, 0, 0]
    wins = losses = draws = forfeits = 0
    lock = threading.Lock()
    pair_scores: dict[int, list[float]] = {}
    think = {a.label: [0.0, 0], b.label: [0.0, 0]}  # label -> [seconds, turns]; labels differ for A and B
    lower, upper = sprt_bounds()
    stop = threading.Event()
    verdict = "incomplete"

    print(f"{a.label} vs {b.label}: {args.pairs} pairs at radius {args.radius}, {args.concurrency} games at a time")
    print(f"games saved to {out_dir}")
    print(f"openings: {book_path if book_path and book_path.exists() else 'X at the center plus two O stones'}")

    def run_one(pair: int, a_is_x: bool):
        # While the pause file exists, running games finish but no new one starts.
        while args.pause_file and args.pause_file.exists() and not stop.is_set():
            time.sleep(2)
        if stop.is_set():
            return pair, a_is_x, None
        x, o = (a, b) if a_is_x else (b, a)
        return pair, a_is_x, play_game(x, o, book[pair], args.radius, args.max_stones)

    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futures = [pool.submit(run_one, p, a_is_x) for p in range(args.pairs) for a_is_x in (True, False)]
        for future in as_completed(futures):
            if future.cancelled():
                continue
            pair, a_is_x, outcome = future.result()
            if outcome is None:
                continue
            a_side = "X" if a_is_x else "O"
            score = score_for(outcome, a_side)
            with lock:
                index = pair * 2 + (0 if a_is_x else 1)
                save_replay(out_dir / f"game-{index:04d}.json", outcome, args.radius, run_id, index)
                if score == 1.0:
                    wins += 1
                elif score == 0.0:
                    losses += 1
                else:
                    draws += 1
                if outcome.reason == "forfeit":
                    forfeits += 1
                    print(f"  forfeit in pair {pair}: {outcome.detail}")
                pair_scores.setdefault(pair, []).append(score)
                for side, label in (("X", outcome.x), ("O", outcome.o)):
                    if label in think and outcome.turns:
                        think[label][0] += outcome.times[side]
                        think[label][1] += outcome.turns[side]
                if len(pair_scores[pair]) == 2:
                    penta[int(round(sum(pair_scores[pair]) * 2))] += 1
                    est = elo_estimate(penta)
                    line = (f"pair {sum(penta):4d}  W-L-D {wins}-{losses}-{draws}  "
                            f"Elo {est.elo:+.0f} [{est.low:+.0f}, {est.high:+.0f}]  penta {penta}")
                    if args.sprt:
                        value = llr(penta, *args.sprt)
                        line += f"  LLR {value:+.2f} [{lower:.2f}, {upper:.2f}]"
                        if value >= upper or value <= lower:
                            verdict = "H1 accepted (A is stronger)" if value >= upper else "H0 accepted"
                            stop.set()
                    print(line, flush=True)
            if stop.is_set():
                for f in futures:
                    f.cancel()

    est = elo_estimate(penta)
    summary = {
        "engineA": a.label,
        "engineB": b.label,
        "radius": args.radius,
        "pairs": sum(penta),
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "forfeits": forfeits,
        "pentanomial": penta,
        "elo": elo_json(est.elo),
        "eloLow": elo_json(est.low),
        "eloHigh": elo_json(est.high),
        "sprt": {"elo0": args.sprt[0], "elo1": args.sprt[1], "llr": round(llr(penta, *args.sprt), 3), "verdict": verdict} if args.sprt else None,
        "secondsPerTurn": {label: round(s / n, 3) for label, (s, n) in think.items() if n},
        "minutes": round((time.monotonic() - started) / 60, 1),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
