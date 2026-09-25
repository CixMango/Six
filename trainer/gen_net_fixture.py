"""Writes a tiny random network and its outputs on plane-fixture positions, so the C++ evaluator can be
checked against PyTorch: engine/tests/fixtures/tiny.onnx and tiny-outputs.txt.

tiny-outputs.txt: for each of the first 16 positions of planes.txt, a line
  output <value> <score> <policy logit for each of the 625 crop cells>
where value = P(win) - P(loss).
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch

from export import export
from model import HexNet, NetConfig, save_checkpoint
from planes import CROP, PLANES

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "engine" / "tests" / "fixtures"


def fixture_planes(count: int) -> np.ndarray:
    planes, current = [], None
    for line in (FIXTURES / "planes.txt").read_text(encoding="utf-8").splitlines():
        words = line.split()
        if not words or words[0] == "#":
            continue
        if words[0] == "position":
            if len(planes) == count:
                break
            current = np.zeros((len(PLANES), CROP, CROP), dtype=np.float32)
            planes.append(current)
        elif words[0] == "plane":
            bits = np.unpackbits(np.frombuffer(bytes.fromhex(words[2]), dtype=np.uint8), bitorder="little")
            current[int(words[1])] = bits[: CROP * CROP].reshape(CROP, CROP)
    return np.stack(planes)


def main() -> None:
    torch.manual_seed(7)
    model = HexNet(NetConfig(channels=16, blocks=2, pool_blocks=(1,), pool_channels=8, head_channels=8, value_hidden=16))
    # Randomize batch-norm statistics so the check isn't trivially zero-centred.
    with torch.no_grad():
        for module in model.modules():
            if isinstance(module, torch.nn.BatchNorm2d):
                module.running_mean.uniform_(-0.2, 0.2)
                module.running_var.uniform_(0.5, 1.5)
    model.eval()
    checkpoint = FIXTURES / "tiny.pt"
    save_checkpoint(checkpoint, model)
    diff = export(checkpoint, FIXTURES / "tiny.onnx")
    checkpoint.unlink()
    planes = torch.from_numpy(fixture_planes(16))
    with torch.no_grad():
        policy, _, value, score = model(planes)
        v = torch.softmax(value, dim=1)
    lines = [f"output {v[b, 0] - v[b, 1]:.6f} {score[b]:.6f} " + " ".join(f"{x:.5f}" for x in policy[b].tolist())
             for b in range(planes.shape[0])]
    (FIXTURES / "tiny-outputs.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote tiny.onnx (ONNX Runtime vs PyTorch {diff:.1e}) and outputs for {planes.shape[0]} positions")


if __name__ == "__main__":
    main()
