"""Exports a checkpoint to ONNX for the C++ evaluator and checks ONNX Runtime agrees with PyTorch.

  .venv/Scripts/python trainer/export.py runs/v1/best.pt runs/v1/best.onnx
"""
from __future__ import annotations

import argparse
import sys
import warnings
from pathlib import Path

import numpy as np
import torch

from model import load_checkpoint
from planes import CROP, PLANES, raw_planes


class HalfPrecision(torch.nn.Module):
    """Runs the network in float16 behind float32 inputs and outputs, so the engine's code doesn't change."""

    def __init__(self, model):
        super().__init__()
        self.model = model.half()

    def forward(self, planes):
        return tuple(output.float() for output in self.model(planes.half()))


def _softmax(x: np.ndarray) -> np.ndarray:
    z = x.astype(np.float64) - x.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)


def export(checkpoint: Path, out: Path, half: bool = False) -> float:
    """Writes the ONNX file; returns the largest difference between ONNX Runtime and the float32 PyTorch model.

    Policy and value heads are compared as probabilities, which is what the engine uses: float16 rounds very
    negative logits noticeably without changing any probability that matters. The score head is compared directly.
    """
    model, _ = load_checkpoint(checkpoint)
    model.eval()
    example = torch.from_numpy(np.stack([raw_planes([(0, 0), (1, -1), (1, 0)], 8)[0],
                                         raw_planes([(0, 0), (0, 1), (2, -1), (1, 0)], 9)[0]]))
    with torch.no_grad():
        want = [t.numpy() for t in model(example)]
    # The tracer warns about the Python `aux` flag in forward; it is constant for export.
    warnings.filterwarnings("ignore", category=torch.jit.TracerWarning)
    exported = HalfPrecision(load_checkpoint(checkpoint)[0].eval()) if half else model
    torch.onnx.export(
        exported, (example,), str(out), dynamo=False, opset_version=17,
        input_names=["planes"], output_names=["policy", "opponent", "value", "score"],
        dynamic_axes={name: {0: "batch"} for name in ("planes", "policy", "opponent", "value", "score")},
    )
    import onnxruntime as ort

    if half:
        ort.preload_dlls()
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if half else ["CPUExecutionProvider"]
    session = ort.InferenceSession(str(out), providers=providers)
    got = session.run(None, {"planes": example.numpy()})
    # Outputs: policy, opponent, value (logits), score.
    diffs = [float(np.abs(_softmax(g) - _softmax(w)).max()) for g, w in zip(got[:3], want[:3])]
    diffs.append(float(np.abs(got[3] - want[3]).max()))
    return max(diffs)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--fp16", action="store_true", help="run the network in float16 (faster on the GPU)")
    args = parser.parse_args()
    diff = export(args.checkpoint, args.out, args.fp16)
    print(f"wrote {args.out}; largest difference from PyTorch {diff:.2e} ({len(PLANES)} planes, crop {CROP})")
    return 0 if diff < (2e-2 if args.fp16 else 1e-3) else 1


if __name__ == "__main__":
    sys.exit(main())
