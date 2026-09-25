"""Trains network v1 on HexBot self-play and human games, keeping the checkpoint with the best validation loss.

Example:
  .venv/Scripts/python trainer/train.py --corpus data/corpus/hexo_human_corpus.jsonl \
      --selfplay "data/selfplay/*/games-*.jsonl" --epochs 4 --out runs/v1
"""
from __future__ import annotations

import argparse
import gc
import glob
import json
import math
import time
from pathlib import Path

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from dataset import RowDataset, load_corpus, load_rl, load_selfplay, remember_validated, replays_legally
from export import export
from model import HexNet, NetConfig, load_checkpoint, save_checkpoint
from pause import pause_reason, wait_while_paused

ROOT = Path(__file__).resolve().parents[1]
LOSS_WEIGHTS = {"policy": 1.0, "opponent": 0.15, "value": 1.0, "score": 0.5, "future": 0.5, "short_value": 0.5}
FUTURE_CELL_SCALE = 1.0 / 100.0  # future occupancy: cross-entropy summed over cells, scaled to about a policy loss


def compute_losses(outputs, batch):
    policy, opponent, value, score, future, short_value = outputs
    weight = batch["weight"]
    legal = batch["planes"][:, 3].flatten(1) > 0.5
    logp = F.log_softmax(policy.float().masked_fill(~legal, -1e4), dim=1)
    policy_rows = -(batch["policy"] * logp).sum(dim=1)

    known = batch["opponent_known"]
    opp_rows = -(batch["opponent"] * F.log_softmax(opponent.float(), dim=1)).sum(dim=1)

    decided = batch["value"] >= 0
    value_rows = F.cross_entropy(value.float(), batch["value"].clamp(min=0), reduction="none")

    scored = batch["score_known"]
    score_rows = (score.float() - batch["score"]) ** 2

    # Future occupancy over the cells still empty, per horizon; horizons past an unfinished record's end are skipped.
    empty = ((batch["planes"][:, 1] + batch["planes"][:, 2]).flatten(1) < 0.5).float()[:, None, :]
    future_cells = F.binary_cross_entropy_with_logits(future.float(), batch["future"].flatten(2), reduction="none") * empty
    horizons = future_cells.view(future_cells.shape[0], -1, 2, future_cells.shape[2]).sum(dim=(2, 3))
    horizon_known = batch["future_known"].float()
    future_rows = (horizons * horizon_known).sum(dim=1) / horizon_known.sum(dim=1).clamp(min=1.0) * FUTURE_CELL_SCALE

    short_rows = (short_value.float() - batch["short_value"]) ** 2

    def mean(rows, mask=None):
        w = weight if mask is None else weight * mask
        return (rows * w).sum() / w.sum().clamp(min=1e-6)

    parts = {
        "policy": mean(policy_rows),
        "opponent": mean(opp_rows, known),
        "value": mean(value_rows, decided),
        "score": mean(score_rows, scored),
        "future": mean(future_rows, batch["future_known"].any(dim=1)),
        "short_value": mean(short_rows, batch["short_value_known"]),
    }
    total = sum(LOSS_WEIGHTS[k] * v for k, v in parts.items())
    top1 = (batch["policy"].gather(1, logp.argmax(dim=1, keepdim=True)).squeeze(1) > 0).float()
    return total, parts, top1


def to_device(batch, device):
    return {k: v.to(device, non_blocking=True) for k, v in batch.items()}


@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()
    sums: dict[str, float] = {}
    counts: dict[str, int] = {}
    for batch in loader:
        batch = to_device(batch, device)
        with torch.autocast("cuda", dtype=torch.bfloat16):
            outputs = model(batch["planes"], aux=True)
        _, parts, top1 = compute_losses(outputs, batch)
        n = batch["planes"].shape[0]
        for key, value in parts.items():
            sums[key] = sums.get(key, 0.0) + value.item() * n
            counts[key] = counts.get(key, 0) + n
        for group, mask in (("human", batch["human"]), ("selfplay", ~batch["human"])):
            if mask.any():
                sums[f"top1_{group}"] = sums.get(f"top1_{group}", 0.0) + top1[mask].sum().item()
                counts[f"top1_{group}"] = counts.get(f"top1_{group}", 0) + int(mask.sum().item())
    model.train()
    metrics = {k: sums[k] / counts[k] for k in sums}
    metrics["loss"] = sum(LOSS_WEIGHTS[k] * metrics[k] for k in LOSS_WEIGHTS if k in metrics)
    return metrics


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--corpus", type=Path, default=None)
    parser.add_argument("--selfplay", nargs="*", default=[], help="globs of HexBot datagen .jsonl files")
    parser.add_argument("--rl", nargs="*", default=[], help="globs of network self-play (sixselfplay) .jsonl files")
    parser.add_argument("--selfplay-weight", type=float, default=1.0)
    parser.add_argument("--init", type=Path, default=None, help="continue from this checkpoint (its architecture wins)")
    parser.add_argument("--steps", type=int, default=0, help="train this many steps instead of --epochs")
    parser.add_argument("--export", type=Path, default=None, help="write the final network to this ONNX file")
    parser.add_argument("--fp16", action="store_true", help="export the network to run in float16")
    parser.add_argument("--pause", action="store_true", help="step aside while a game or chosen app runs (see pause.py)")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--epochs", type=float, default=4)
    parser.add_argument("--batch", type=int, default=512)
    parser.add_argument("--lr", type=float, default=2e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--channels", type=int, default=96)
    parser.add_argument("--blocks", type=int, default=10)
    parser.add_argument("--pool-blocks", type=int, nargs="*", default=None,
                        help="blocks with global pooling (default: at 30%% and 70%% of the depth)")
    parser.add_argument("--head-channels", type=int, default=32)
    parser.add_argument("--human-weight", type=float, default=1.0)
    parser.add_argument("--limit-games", type=int, default=0, help="use only this many games per source (for smoke tests)")
    args = parser.parse_args()

    games = []
    if args.corpus:
        human = load_corpus(args.corpus)
        for g in human:
            g.weight = args.human_weight
        games += human[: args.limit_games or None]
    expand = lambda patterns: sorted({Path(p) for pattern in patterns for p in glob.glob(str(pattern))})
    if args.selfplay:
        hexbot = load_selfplay(expand(args.selfplay))[: args.limit_games or None]
        for g in hexbot:
            g.weight = args.selfplay_weight
        games += hexbot
    if args.rl:
        games += load_rl(expand(args.rl))[: args.limit_games or None]
    # Files validated on an earlier run are trusted (dataset.load_rl); the rest are replayed and then recorded.
    fresh = {g.path for g in games if not g.checked and g.path}
    legal, unsound = [], set()
    for g in games:
        if g.checked or replays_legally(g):
            legal.append(g)
        elif g.path:
            unsound.add(g.path)
    if not args.limit_games:  # with --limit-games only part of a file was checked
        remember_validated(sorted(fresh - unsound))
    rejected = len(games) - len(legal)
    kept = len(legal)
    train_set = RowDataset([g for g in legal if not g.validation], augment=True)
    val_set = RowDataset([g for g in legal if g.validation], augment=False)
    # The datasets hold compact copies; free the originals (about 1 GB on a six-generation window).
    games.clear()
    legal.clear()
    gc.collect()
    summary = {
        "games": kept, "rejectedGames": rejected,
        "trainRows": len(train_set), "valRows": len(val_set),
        "skippedRowsOutsideCrop": train_set.skipped + val_set.skipped,
    }
    print(json.dumps(summary), flush=True)

    device = "cuda"
    if args.init:
        model, _ = load_checkpoint(args.init, device)
        config = model.config
        model = model.to(memory_format=torch.channels_last)
    else:
        pools = tuple(args.pool_blocks) if args.pool_blocks is not None else (args.blocks * 3 // 10, args.blocks * 7 // 10)
        config = NetConfig(channels=args.channels, blocks=args.blocks, pool_blocks=pools,
                           pool_channels=max(32, args.channels // 3), head_channels=args.head_channels)
        model = HexNet(config).to(device).to(memory_format=torch.channels_last)
    params = sum(p.numel() for p in model.parameters())
    print(f"network: {config.blocks} blocks x {config.channels} channels, {params:,} parameters" + (f", from {args.init}" if args.init else ""), flush=True)

    # Every worker holds a copy of the rows, so validation gets at most two non-persistent workers.
    train_loader = DataLoader(train_set, shuffle=True, drop_last=True, batch_size=args.batch, num_workers=args.workers,
                              pin_memory=True, persistent_workers=args.workers > 0)
    val_loader = DataLoader(val_set, shuffle=False, batch_size=args.batch, num_workers=min(2, args.workers), pin_memory=True)
    steps = args.steps if args.steps > 0 else max(1, int(len(train_loader) * args.epochs))
    warmup = min(500, steps // 10)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    schedule = torch.optim.lr_scheduler.LambdaLR(
        optimizer, lambda s: min(1.0, (s + 1) / max(1, warmup)) * 0.5 * (1 + math.cos(math.pi * min(1.0, s / steps))))

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "run.json").write_text(json.dumps({"args": {k: str(v) for k, v in vars(args).items()},
                                                   "config": config.to_dict(), "data": summary}, indent=2))
    log = open(args.out / "metrics.jsonl", "a", encoding="utf-8")
    best = math.inf
    step = 0
    started = time.monotonic()
    epoch = 0
    while step < steps:
        epoch += 1
        for batch in train_loader:
            batch = to_device(batch, device)
            with torch.autocast("cuda", dtype=torch.bfloat16):
                outputs = model(batch["planes"].contiguous(memory_format=torch.channels_last), aux=True)
            total, parts, _ = compute_losses(outputs, batch)
            optimizer.zero_grad(set_to_none=True)
            total.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            schedule.step()
            step += 1
            if args.pause and step % 50 == 0 and pause_reason():
                torch.cuda.empty_cache()
                wait_while_paused(lambda message: print(message, flush=True))
            if step % 100 == 0:
                rate = step * args.batch / (time.monotonic() - started)
                print(f"step {step}/{steps}  loss {total.item():.3f}  " +
                      "  ".join(f"{k} {v.item():.3f}" for k, v in parts.items()) + f"  {rate:.0f} rows/s", flush=True)
            if step >= steps:
                break
        metrics = evaluate(model, val_loader, device)
        metrics.update({"epoch": epoch, "step": step, "minutes": round((time.monotonic() - started) / 60, 1)})
        print("validation " + json.dumps({k: round(v, 4) if isinstance(v, float) else v for k, v in metrics.items()}), flush=True)
        log.write(json.dumps(metrics) + "\n")
        log.flush()
        save_checkpoint(args.out / "last.pt", model, {"metrics": metrics, "data": summary})
        if metrics["loss"] < best:
            best = metrics["loss"]
            save_checkpoint(args.out / "best.pt", model, {"metrics": metrics, "data": summary})
    log.close()
    if args.export:
        diff = export(args.out / "best.pt", args.export, args.fp16)
        print(f"exported {args.export} (ONNX Runtime vs PyTorch {diff:.1e})", flush=True)
        if diff > (2e-2 if args.fp16 else 1e-3):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
