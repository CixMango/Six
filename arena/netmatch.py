"""Paired games between two networks, both searched inside one `sixmatch` process.

One process holds one CUDA context for both networks, where match.py would start a ~1.8 GB engine process per side
per game. Replays and summary.json are written exactly as match.py writes them.

Example:
  py -3.12 arena/netmatch.py runs/rl/gen-0005/net.onnx runs/rl/gen-0004/net.onnx --movetime 300 --pairs 20
  py -3.12 arena/netmatch.py net.onnx net.onnx --set-b reuseTree=0 --sprt 0 15 --pairs 400
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from match import GameOutcome, save_replay, score_for  # noqa: E402
from openings import DEFAULT_BOOK, openings  # noqa: E402
from sprt import elo_estimate, elo_json, llr, sprt_bounds  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / ".venv" / "Lib" / "site-packages"


def match_exe() -> Path:
    return Path(os.environ.get("SIX_MATCH") or ROOT / "engine" / "build" / "release" / "sixmatch.exe")


def label(model: Path, ms: int, settings: list[str]) -> str:
    return f"HexNet {model.parent.name}/{model.stem} {ms}ms" + "".join(f" {s}" for s in settings)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("net_a", type=Path)
    parser.add_argument("net_b", type=Path)
    parser.add_argument("--movetime", type=int, default=300)
    parser.add_argument("--movetime-a", type=int, default=0, help="A's own time per turn (0: --movetime), for time odds")
    parser.add_argument("--movetime-b", type=int, default=0)
    parser.add_argument("--pairs", type=int, default=20)
    parser.add_argument("--radius", type=int, default=8, choices=(8, 9))
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--max-stones", type=int, default=400)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--book", default=str(DEFAULT_BOOK), help="opening book JSON, or 'none' for X-center openings")
    parser.add_argument("--set-a", action="append", default=[], help="MCTS setting for A, e.g. reuseTree=0")
    parser.add_argument("--set-b", action="append", default=[], help="MCTS setting for B")
    parser.add_argument("--sprt", type=float, nargs=2, metavar=("ELO0", "ELO1"))
    parser.add_argument("--cpu", action="store_true", help="run the networks on the CPU (tests)")
    parser.add_argument("--pause-file", type=Path, default=None,
                        help="while this file exists, finish the game in hand and start no new one")
    parser.add_argument("--out", type=Path, default=None, help="folder for the replays and summary (default: data/arena/<run>)")
    args = parser.parse_args(argv)

    net_a = args.net_a if args.net_a.is_absolute() else ROOT / args.net_a
    net_b = args.net_b if args.net_b.is_absolute() else ROOT / args.net_b
    label_a = label(net_a, args.movetime_a or args.movetime, args.set_a)
    label_b = label(net_b, args.movetime_b or args.movetime, args.set_b)
    if label_a == label_b:
        label_b += " (B)"
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = lambda s: "".join(ch if ch.isalnum() else "-" for ch in s.lower())
    run_id = f"{stamp}-{slug(label_a)}-vs-{slug(label_b)}"[:60].rstrip("-")
    out_dir = args.out or ROOT / "data" / "arena" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)

    book_path = None if args.book == "none" else Path(args.book)
    book = openings(args.pairs, args.seed, book_path if book_path and book_path.exists() else None)
    (out_dir / "openings.txt").write_text("".join(" ".join(f"{q} {r}" for q, r in o) + "\n" for o in book), encoding="utf-8")

    command = [str(match_exe()), "--net-a", str(net_a), "--net-b", str(net_b), "--openings", str(out_dir / "openings.txt"),
               "--movetime", str(args.movetime), "--radius", str(args.radius), "--concurrency", str(args.concurrency),
               "--max-stones", str(args.max_stones)]
    for side in ("a", "b"):
        ms = getattr(args, f"movetime_{side}")
        if ms:
            command += [f"--movetime-{side}", str(ms)]
    if args.pause_file:
        command += ["--pause-file", str(args.pause_file)]
    for s in args.set_a:
        command += ["--set-a", s]
    for s in args.set_b:
        command += ["--set-b", s]
    if args.cpu:
        command.append("--cpu")
    elif (SITE / "tensorrt_libs" / "nvinfer_10.dll").exists():
        command.append("--trt")
    env = dict(os.environ)
    env["PATH"] = os.pathsep.join([str(SITE / "torch" / "lib"), str(SITE / "tensorrt_libs"), env.get("PATH", "")])

    print(f"{label_a} vs {label_b}: {args.pairs} pairs at radius {args.radius}, {args.concurrency} games at a time (one process)")
    print(f"games saved to {out_dir}")
    print(f"openings: {book_path if book_path and book_path.exists() else 'X at the center plus two O stones'}")

    penta = [0, 0, 0, 0, 0]
    wins = losses = draws = forfeits = 0
    pair_scores: dict[int, list[float]] = {}
    think = {"A": [0.0, 0], "B": [0.0, 0]}
    lower, upper = sprt_bounds()
    verdict = "incomplete"
    started = time.monotonic()
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, cwd=str(ROOT),
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    assert process.stdout
    for line in process.stdout:
        line = line.strip()
        if not line.startswith("{"):
            if line and "onnxruntime" not in line:
                print(f"  sixmatch: {line}")
            continue
        game = json.loads(line)
        pair, a_is_x = game["pair"], game["aIsX"]
        outcome = GameOutcome(label_a if a_is_x else label_b, label_b if a_is_x else label_a, game["winner"],
                              game["reason"], [tuple(m) for m in game["moves"]], game["detail"])
        index = pair * 2 + (0 if a_is_x else 1)
        save_replay(out_dir / f"game-{index:04d}.json", outcome, args.radius, run_id, index)
        score = score_for(outcome, "X" if a_is_x else "O")
        wins += score == 1.0
        losses += score == 0.0
        draws += score == 0.5
        if outcome.reason == "forfeit":
            forfeits += 1
            print(f"  forfeit in pair {pair}: {outcome.detail}")
        think["A"][0] += game["thinkA"]
        think["A"][1] += game["turnsA"]
        think["B"][0] += game["thinkB"]
        think["B"][1] += game["turnsB"]
        pair_scores.setdefault(pair, []).append(score)
        if len(pair_scores[pair]) == 2:
            penta[int(round(sum(pair_scores[pair]) * 2))] += 1
            est = elo_estimate(penta)
            progress = (f"pair {sum(penta):4d}  W-L-D {wins}-{losses}-{draws}  "
                        f"Elo {est.elo:+.0f} [{est.low:+.0f}, {est.high:+.0f}]  penta {penta}")
            if args.sprt:
                value = llr(penta, *args.sprt)
                progress += f"  LLR {value:+.2f} [{lower:.2f}, {upper:.2f}]"
                if value >= upper or value <= lower:
                    verdict = "H1 accepted (A is stronger)" if value >= upper else "H0 accepted"
            print(progress, flush=True)
            if verdict != "incomplete":
                process.kill()
                break
    process.wait()

    est = elo_estimate(penta)
    summary = {
        "engineA": label_a,
        "engineB": label_b,
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
        "secondsPerTurn": {lab: round(s / n, 3) for lab, (s, n) in ((label_a, think["A"]), (label_b, think["B"])) if n},
        "minutes": round((time.monotonic() - started) / 60, 1),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0 if sum(penta) > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
