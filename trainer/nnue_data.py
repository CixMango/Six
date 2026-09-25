"""Builds the NNUE training set: self-play positions labelled by a network teacher.

    .venv/Scripts/python trainer/nnue_data.py --first 300 --last 455 --net runs/rl/gen-0455/net.onnx --out data/nnue

Each position stores the teacher's value for the side to move, its top policy cells, and the game result. Games are
shuffled with a fixed seed and written in chunks (chunk-NNNN.npz), so a stopped run resumes. After a minute of
pausing it exits with code 3 to free the GPU; nnue_data.sh restarts it.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pause import pause_reason  # noqa: E402
from planes import CROP, HALF, player_for_stone, raw_planes  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
PAUSED_EXIT = 3
RELEASE_AFTER_SECONDS = 60.0
K = 12  # policy cells kept per position


def pick_positions(length: int, share: float, seed: int) -> list[int]:
    """Stone counts to sample from a game of `length` stones (all non-final ones when share is 1)."""
    rng = random.Random(seed)
    return [n for n in range(1, length) if share >= 1.0 or rng.random() < share]


def result_for_mover(winner: str | None, n: int) -> int:
    """Result for the side about to place stone n: 1 win, -1 loss, 0 unfinished."""
    if winner is None:
        return 0
    return 1 if player_for_stone(n) == winner else -1


def planes_for(moves: list[tuple[int, int]], radius: int):
    return raw_planes(moves, radius)


def labels_from_outputs(policy_logits: np.ndarray, value_logits: np.ndarray, planes: np.ndarray,
                        centers: list[tuple[int, int]], k: int = K) -> dict[str, np.ndarray]:
    """Per position: teacher value for the side to move, and the top-k legal policy cells (renormalised)."""
    legal = planes[:, 3].reshape(len(planes), -1) > 0.5
    logits = np.where(legal, policy_logits, -np.inf)
    logits = logits - logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= probs.sum(axis=1, keepdims=True)
    top = np.argsort(-probs, axis=1)[:, :k]
    top_probs = np.take_along_axis(probs, top, axis=1)
    top_probs = top_probs / np.maximum(top_probs.sum(axis=1, keepdims=True), 1e-9)
    rows, cols = top // CROP, top % CROP
    centers_arr = np.array(centers, dtype=np.int32)
    cells = np.stack([cols - HALF + centers_arr[:, None, 0], rows - HALF + centers_arr[:, None, 1]], axis=-1)
    value = np.tanh(0.5 * (value_logits[:, 0] - value_logits[:, 1]))
    return {"cells": cells.astype(np.int16), "probs": top_probs.astype(np.float16), "value": value.astype(np.float16)}


def save_chunk(path: Path, games: list[dict], rows: dict[str, np.ndarray]) -> None:
    lengths = np.array([len(g["moves"]) for g in games], dtype=np.int32)
    moves = np.array([m for g in games for m in g["moves"]], dtype=np.int16).reshape(-1, 2)
    tmp = path.with_suffix(".tmp.npz")
    np.savez_compressed(tmp, lengths=lengths, moves=moves,
                        radius=np.array([g["radius"] for g in games], dtype=np.int8),
                        winner=np.array([{"X": 1, "O": -1}.get(g.get("winner"), 0) for g in games], dtype=np.int8),
                        **rows)
    tmp.replace(path)


def load_chunk(path: Path) -> dict:
    data = dict(np.load(path))
    offsets = np.concatenate([[0], np.cumsum(data["lengths"])])
    data["moves"] = [[tuple(int(x) for x in m) for m in data["moves"][offsets[i]:offsets[i + 1]]]
                     for i in range(len(data["lengths"]))]
    return data


def _planes_job(job):
    moves, radius, n = job
    planes, center = raw_planes(moves[:n], radius)
    return planes, center


def read_games(first: int, last: int) -> list[dict]:
    games = []
    for g in range(first, last + 1):
        for path in sorted((ROOT / "data" / "rl" / f"gen-{g:04d}").glob("games-*.jsonl")):
            for line in path.read_text(encoding="utf-8").splitlines():
                try:
                    record = json.loads(line)
                except ValueError:
                    continue
                if record.get("moves") and len(record["moves"]) > 1:
                    games.append({"moves": [tuple(m) for m in record["moves"]], "radius": record["radius"],
                                  "winner": record.get("winner")})
    return games


class Teacher:
    def __init__(self, net: Path):
        import onnxruntime as ort
        ort.preload_dlls()
        self.session = ort.InferenceSession(str(net), providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

    def __call__(self, planes: np.ndarray):
        policy, _opponent, value, _score = self.session.run(None, {"planes": planes})
        return policy.reshape(len(planes), -1), value.reshape(len(planes), 2)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--first", type=int, required=True)
    parser.add_argument("--last", type=int, required=True)
    parser.add_argument("--net", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--share", type=float, default=0.5, help="fraction of each game's positions to keep")
    parser.add_argument("--games-per-chunk", type=int, default=4000)
    parser.add_argument("--batch", type=int, default=512)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--seed", type=int, default=1)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    games = read_games(args.first, args.last)
    random.Random(args.seed).shuffle(games)
    chunks = [games[i:i + args.games_per_chunk] for i in range(0, len(games), args.games_per_chunk)]
    print(f"{len(games)} games in {len(chunks)} chunks", flush=True)
    teacher = None
    with Pool(args.workers) as pool:
        for c, chunk in enumerate(chunks):
            path = args.out / f"chunk-{c:04d}.npz"
            if path.exists():
                continue
            jobs = [(g["moves"], g["radius"], n, i) for i, g in enumerate(chunk)
                    for n in pick_positions(len(g["moves"]), args.share, args.seed * 1_000_003 + c * 10_007 + i)]
            parts: dict[str, list[np.ndarray]] = {"game": [], "n": [], "value": [], "result": [], "cells": [], "probs": []}
            started = time.monotonic()
            for b in range(0, len(jobs), args.batch):
                # A long pause exits to free the GPU; this chunk is redone on restart.
                if pause_reason():
                    since = time.monotonic()
                    while pause_reason():
                        if time.monotonic() - since > RELEASE_AFTER_SECONDS:
                            print(f"paused ({pause_reason()}): exiting to free the GPU", flush=True)
                            return PAUSED_EXIT
                        time.sleep(5)
                batch = jobs[b:b + args.batch]
                built = pool.map(_planes_job, [(m, r, n) for m, r, n, _ in batch], chunksize=16)
                planes = np.stack([p for p, _ in built])
                if teacher is None:
                    teacher = Teacher(args.net)
                policy, value = teacher(planes)
                labels = labels_from_outputs(policy, value, planes, [c for _, c in built])
                parts["game"].append(np.array([i for _, _, _, i in batch], np.int32))
                parts["n"].append(np.array([n for _, _, n, _ in batch], np.int16))
                parts["result"].append(np.array([result_for_mover(chunk[i]["winner"], n) for _, _, n, i in batch], np.int8))
                for key in ("value", "cells", "probs"):
                    parts[key].append(labels[key])
            save_chunk(path, chunk, {k: np.concatenate(v) for k, v in parts.items()})
            print(f"chunk {c + 1}/{len(chunks)}: {len(jobs)} positions in {time.monotonic() - started:.0f} s", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
