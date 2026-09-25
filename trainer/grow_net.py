"""Grows a trained network wider or deeper without changing its outputs (Net2Net-style).

New channels get zero outgoing weights; new blocks get a zeroed second batch norm, so they start as the identity.

  .venv/Scripts/python trainer/grow_net.py runs/rl/gen-0014/net.pt runs/rl/grow-b10c128/net.pt --channels 128
"""
from __future__ import annotations

import argparse
from dataclasses import replace
from pathlib import Path

import torch

from model import HexNet, NetConfig, load_checkpoint, save_checkpoint


def _channel_map(old_channels: int, new_channels: int, pool_channels: int) -> list[int]:
    """New index of each conv1 output channel. A block pools its last `pool_channels`, so those move to the end
    of the wider layer; the regular ones keep their index."""
    regular = old_channels - pool_channels
    return list(range(regular)) + [new_channels - pool_channels + i for i in range(pool_channels)]


def _copy_conv(target: torch.Tensor, source: torch.Tensor, out_map: list[int] | None = None) -> None:
    """Copies a conv/linear weight into the top-left of a larger one; old outputs read nothing from new inputs."""
    out_rows = out_map if out_map is not None else list(range(source.shape[0]))
    in_count = source.shape[1]
    target[out_rows, in_count:] = 0.0
    for new_row, old_row in enumerate(out_rows):
        target[old_row, :in_count] = source[new_row]


def _copy_norm(target: torch.nn.BatchNorm2d, source: torch.nn.BatchNorm2d, out_map: list[int] | None = None) -> None:
    rows = out_map if out_map is not None else list(range(source.weight.shape[0]))
    for new_row, old_row in enumerate(rows):
        target.weight.data[old_row] = source.weight.data[new_row]
        target.bias.data[old_row] = source.bias.data[new_row]
        target.running_mean.data[old_row] = source.running_mean.data[new_row]
        target.running_var.data[old_row] = source.running_var.data[new_row]


def grow(model: HexNet, config: NetConfig) -> HexNet:
    old = model.config
    if config.channels < old.channels or config.blocks < old.blocks:
        raise ValueError("a grown network can only be wider and deeper")
    if config.pool_channels != old.pool_channels or config.head_channels != old.head_channels or config.value_hidden != old.value_hidden:
        raise ValueError("the pooled width and head sizes have to stay the same")
    if tuple(config.pool_blocks)[: len(old.pool_blocks)] != tuple(old.pool_blocks) or any(
        b >= old.blocks for b in tuple(config.pool_blocks)[: len(old.pool_blocks)]
    ):
        raise ValueError("the blocks that pool have to stay where they are")
    grown = HexNet(config)
    with torch.no_grad():
        _copy_conv(grown.stem.weight.data, model.stem.weight.data)
        _copy_norm(grown.stem_bn, model.stem_bn)
        split = _channel_map(old.channels, config.channels, old.pool_channels)
        for i, block in enumerate(model.blocks):
            target = grown.blocks[i]
            # Only a pooling block splits its conv1 outputs, so only there do the pooled channels move.
            _copy_conv(target.conv1.weight.data, block.conv1.weight.data, split if block.pool_channels else None)
            _copy_norm(target.bn1, block.bn1)
            if block.pool_channels:
                _copy_norm(target.pool_bn, block.pool_bn)
                _copy_conv(target.pool_fc.weight.data, block.pool_fc.weight.data)
                target.pool_fc.bias.data[: block.pool_fc.bias.shape[0]] = block.pool_fc.bias.data
                target.pool_fc.bias.data[block.pool_fc.bias.shape[0] :] = 0.0
            _copy_conv(target.conv2.weight.data, block.conv2.weight.data)
            _copy_norm(target.bn2, block.bn2)
        # New blocks: bn2 outputs zero and the block input is already post-ReLU, so relu(x + 0) == x.
        for i in range(old.blocks, config.blocks):
            grown.blocks[i].bn2.weight.data.zero_()
            grown.blocks[i].bn2.bias.data.zero_()
        for name in ("policy", "value", "future"):
            _copy_conv(getattr(grown, f"{name}_conv").weight.data, getattr(model, f"{name}_conv").weight.data)
            _copy_norm(getattr(grown, f"{name}_bn"), getattr(model, f"{name}_bn"))
            out, source = getattr(grown, f"{name}_out"), getattr(model, f"{name}_out")
            out.weight.data.copy_(source.weight.data)
            out.bias.data.copy_(source.bias.data)
        for name in ("value_fc", "value_out", "short_value_out"):
            getattr(grown, name).weight.data.copy_(getattr(model, name).weight.data)
            getattr(grown, name).bias.data.copy_(getattr(model, name).bias.data)
    return grown


def grow_checkpoint(source: Path, out: Path, blocks: int, channels: int, pool_blocks: tuple[int, ...] | None = None) -> float:
    """Writes the grown checkpoint; returns the largest output difference from the source on sample positions."""
    from planes import CROP, PLANES

    model, extra = load_checkpoint(source)
    model.eval()
    config = replace(model.config, blocks=blocks, channels=channels,
                     pool_blocks=tuple(pool_blocks) if pool_blocks else model.config.pool_blocks)
    grown = grow(model, config).eval()
    example = torch.rand(4, len(PLANES), CROP, CROP)
    with torch.no_grad():
        before = model(example, aux=True)
        after = grown(example, aux=True)
    difference = max(float((a - b).abs().max()) for a, b in zip(before, after))
    out.parent.mkdir(parents=True, exist_ok=True)
    save_checkpoint(out, grown, {"grownFrom": str(source), "metrics": extra.get("metrics", {})})
    return difference


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--blocks", type=int, default=0, help="0: keep the source's depth")
    parser.add_argument("--channels", type=int, default=0, help="0: keep the source's width")
    parser.add_argument("--pool-blocks", type=int, nargs="*", default=None)
    args = parser.parse_args()
    model, _ = load_checkpoint(args.source)
    blocks = args.blocks or model.config.blocks
    channels = args.channels or model.config.channels
    difference = grow_checkpoint(args.source, args.out, blocks, channels, args.pool_blocks)
    grown, _ = load_checkpoint(args.out)
    print(f"wrote {args.out}: {blocks} blocks x {channels} channels, "
          f"{sum(p.numel() for p in grown.parameters()):,} parameters, "
          f"largest output difference from {args.source.name} {difference:.2e}")
    return 0 if difference < 1e-4 else 1


if __name__ == "__main__":
    raise SystemExit(main())
