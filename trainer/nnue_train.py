"""Trains the NNUE on positions from trainer/nnue_data.py and writes the engine's weight file.

    .venv/Scripts/python trainer/nnue_train.py --data data/nnue --out runs/nnue/v1

Value target: 0.75 * teacher value + 0.25 * game result, for the side to move. Policy target: the teacher's top
cells, scored against a few random empty cells near the stones as negatives.

Chunks are merged once into flat .npy files (<data>/merged/) that DataLoader workers memory-map read-only, so the OS
shares one copy. After a minute of pausing it saves resume.pt and exits with code 3; nnue_train.sh restarts it.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nnue_model as nm  # noqa: E402
from nnue_data import load_chunk  # noqa: E402
from pause import pause_reason  # noqa: E402

PAUSED_EXIT = 3
RELEASE_AFTER_SECONDS = 60.0
TEACHER_SHARE = 0.75
NEGATIVES = 12
NEAR = [(dq, dr) for dq in range(-2, 3) for dr in range(-2, 3) if max(abs(dq), abs(dr), abs(dq + dr)) in (1, 2)]
ROW_KEYS = ("game", "n", "value", "result", "cells", "probs")


def _held_out(moves) -> bool:
    """2% of games, chosen by their moves, for validation."""
    return hashlib.md5(json.dumps([list(m) for m in moves]).encode()).digest()[0] % 50 == 0


def merge(data: Path) -> Path:
    """Flattens the chunks into <data>/merged/*.npy (redone when the chunks change)."""
    chunks = sorted(data.glob("chunk-*.npz"))
    out = data / "merged"
    stamp = json.dumps([[c.name, c.stat().st_size] for c in chunks])
    if (out / "stamp.json").exists() and (out / "stamp.json").read_text() == stamp:
        return out
    out.mkdir(exist_ok=True)
    moves, offsets, held = [], [0], []
    rows = {k: [] for k in ROW_KEYS}
    for path in chunks:
        chunk = load_chunk(path)
        base = len(offsets) - 1
        for game in chunk["moves"]:
            moves.append(np.asarray(game, dtype=np.int16).reshape(-1, 2))
            offsets.append(offsets[-1] + len(game))
            held.append(_held_out(game))
        for k in ROW_KEYS:
            rows[k].append(chunk[k] + base if k == "game" else chunk[k])
    np.save(out / "moves.npy", np.concatenate(moves))
    np.save(out / "offsets.npy", np.asarray(offsets, dtype=np.int64))
    np.save(out / "held.npy", np.asarray(held, dtype=bool))
    for k in ROW_KEYS:
        np.save(out / f"{k}.npy", np.concatenate(rows[k]))
    (out / "stamp.json").write_text(stamp)
    return out


class Positions(Dataset):
    """Yields row indices into the merged arrays; Collate builds the batch."""

    def __init__(self, merged: Path, validation: bool):
        game = np.load(merged / "game.npy", mmap_mode="r")
        held = np.load(merged / "held.npy")
        self.index = np.nonzero(held[game] == validation)[0]

    def __len__(self) -> int:
        return len(self.index)

    def __getitem__(self, i: int) -> int:
        return int(self.index[i])


class Collate:
    """Builds a batch from row indices. The arrays are memory-mapped lazily so each worker opens its own view."""

    def __init__(self, merged: Path):
        self.merged = merged
        self.arrays: dict[str, np.ndarray] | None = None

    def __getstate__(self):
        return {"merged": self.merged, "arrays": None}

    def _open(self) -> dict[str, np.ndarray]:
        if self.arrays is None:
            self.arrays = {k: np.load(self.merged / f"{k}.npy", mmap_mode="r") for k in ("moves", "offsets", *ROW_KEYS)}
        return self.arrays

    def __call__(self, rows_index: list[int]):
        a = self._open()
        positions, keep = [], []
        for i in rows_index:
            g, n = int(a["game"][i]), int(a["n"][i])
            start = int(a["offsets"][g])
            moves = [(int(q), int(r)) for q, r in a["moves"][start:start + n]]
            try:
                nm.grids([moves])
            except ValueError:
                continue  # spreads wider than the grid: rare, skipped
            positions.append(moves)
            keep.append(i)
        index = np.asarray(keep, dtype=np.int64)
        grid, mover = nm.grids(positions)
        n = np.asarray(a["n"][index])
        target = (TEACHER_SHARE * np.asarray(a["value"][index], dtype=np.float32)
                  + (1 - TEACHER_SHARE) * np.asarray(a["result"][index], dtype=np.float32))
        top_cells = np.asarray(a["cells"][index])
        top_probs = np.asarray(a["probs"][index], dtype=np.float32)
        k = top_cells.shape[1]
        cells = np.zeros((len(positions), k + NEGATIVES, 2), dtype=np.int64)
        probs = np.zeros((len(positions), k + NEGATIVES), dtype=np.float32)
        valid = np.zeros((len(positions), k + NEGATIVES), dtype=bool)
        rng = random.Random(int(index[0]) if len(index) else 0)
        for b, moves in enumerate(positions):
            stones = np.asarray(moves).reshape(-1, 2)
            shift = nm.GRID // 2 - (stones.min(axis=0) + stones.max(axis=0)) // 2
            occupied = set(moves)
            chosen = set()
            for j in range(k):
                q, r = int(top_cells[b, j, 0]), int(top_cells[b, j, 1])
                if top_probs[b, j] > 0 and (q, r) not in occupied and 0 <= r + shift[1] < nm.GRID and 0 <= q + shift[0] < nm.GRID:
                    cells[b, j] = (r + shift[1], q + shift[0])
                    probs[b, j] = top_probs[b, j]
                    valid[b, j] = True
                    chosen.add((q, r))
            for j in range(NEGATIVES):
                for _ in range(20):
                    s = moves[rng.randrange(len(moves))]
                    dq, dr = NEAR[rng.randrange(len(NEAR))]
                    c = (s[0] + dq, s[1] + dr)
                    if c not in occupied and c not in chosen and 0 <= c[1] + shift[1] < nm.GRID and 0 <= c[0] + shift[0] < nm.GRID:
                        cells[b, k + j] = (c[1] + shift[1], c[0] + shift[0])
                        valid[b, k + j] = True
                        chosen.add(c)
                        break
        probs /= np.maximum(probs.sum(axis=1, keepdims=True), 1e-9)
        return (torch.as_tensor(grid), torch.as_tensor(mover), torch.as_tensor(nm.second_stone_flags(n)),
                torch.as_tensor(target, dtype=torch.float32), torch.as_tensor(cells), torch.as_tensor(probs),
                torch.as_tensor(valid))


def losses(model: nm.SixNnue, batch, device):
    grid, mover, second, target, cells, probs, valid = (t.to(device, non_blocking=True) for t in batch)
    value = model.value(model.sums(grid), mover, second)
    value_loss = torch.mean((value - target) ** 2)
    scores = model.cell_scores(grid, mover, cells).masked_fill(~valid, -1e9)
    policy_loss = -(probs * torch.log_softmax(scores, dim=1)).sum(dim=1).mean()
    top1 = (scores.argmax(dim=1) == probs.argmax(dim=1)).float().mean()
    return value_loss, policy_loss, top1


def evaluate(model, loader, device, batches: int = 60) -> dict[str, float]:
    model.eval()
    totals = np.zeros(3)
    count = 0
    with torch.no_grad():
        for i, batch in enumerate(loader):
            if i >= batches:
                break
            v, p, t = losses(model, batch, device)
            totals += [v.item(), p.item(), t.item()]
            count += 1
    model.train()
    return dict(zip(("value_mse", "policy_ce", "policy_top1"), (totals / max(count, 1)).round(5).tolist()))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--dim", type=int, default=32)
    parser.add_argument("--hidden", type=int, default=32)
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--batch", type=int, default=512)
    parser.add_argument("--lr", type=float, default=2e-3)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--policy-weight", type=float, default=0.1)
    parser.add_argument("--eval-every", type=int, default=2000)
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--percell", action="store_true", help="clipped ReLU per cell before pooling (v2)")
    args = parser.parse_args(argv)
    args.out.mkdir(parents=True, exist_ok=True)
    device = torch.device(args.device)

    merged = merge(args.data)
    train, valid = Positions(merged, validation=False), Positions(merged, validation=True)
    if len(valid) == 0:  # tiny datasets (tests) may hold nothing out
        valid = train
    print(f"{len(train)} training and {len(valid)} validation positions", flush=True)
    steps = int(args.epochs * len(train) / args.batch)
    model = nm.SixNnue(args.dim, args.hidden, percell=args.percell).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.0)
    schedule = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda s: 0.5 * (1 + math.cos(math.pi * min(s, steps) / steps)))
    step, best = 0, math.inf
    save = args.out / "resume.pt"
    if save.exists():
        state = torch.load(save, map_location=device, weights_only=False)
        model.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        schedule.load_state_dict(state["schedule"])
        step, best = state["step"], state["best"]
        print(f"resuming at step {step}", flush=True)

    def checkpoint():
        torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(), "schedule": schedule.state_dict(),
                    "step": step, "best": best}, save)

    generator = torch.Generator().manual_seed(step)  # a resumed run draws different batches
    loader = DataLoader(train, batch_size=args.batch, shuffle=True, num_workers=args.workers, collate_fn=Collate(merged),
                        generator=generator, persistent_workers=args.workers > 0, pin_memory=device.type == "cuda")
    valid_loader = DataLoader(valid, batch_size=args.batch, shuffle=True, num_workers=min(2, args.workers),
                              collate_fn=Collate(merged), generator=torch.Generator().manual_seed(0))
    log = open(args.out / "metrics.jsonl", "a", encoding="utf-8")
    started = time.monotonic()
    while step < steps:
        for batch in loader:
            if pause_reason():
                since = time.monotonic()
                while pause_reason():
                    if time.monotonic() - since > RELEASE_AFTER_SECONDS:
                        checkpoint()
                        print(f"paused ({pause_reason()}): saved at step {step}, exiting to free the GPU", flush=True)
                        return PAUSED_EXIT
                    time.sleep(5)
            value_loss, policy_loss, _ = losses(model, batch, device)
            loss = value_loss + args.policy_weight * policy_loss
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()
            schedule.step()
            step += 1
            if step % args.eval_every == 0 or step >= steps:
                metrics = {"step": step, "of": steps, "train_value_mse": round(value_loss.item(), 5),
                           **evaluate(model, valid_loader, device), "minutes": round((time.monotonic() - started) / 60, 1)}
                print(json.dumps(metrics), flush=True)
                log.write(json.dumps(metrics) + "\n")
                log.flush()
                score = metrics["value_mse"] + args.policy_weight * metrics["policy_ce"]
                if score < best:
                    best = score
                    nm.export(model, args.out / "six.nnue")
                checkpoint()
            if step >= steps:
                break
    print(f"done: best validation score {best:.5f}, weights in {args.out / 'six.nnue'}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
