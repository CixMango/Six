"""Builds dist/hexbot-helper.zip: everything a friend's Windows PC with an NVIDIA GPU needs to play self-play games.

The zip holds sixselfplay.exe, the ONNX Runtime, CUDA, cuDNN and TensorRT libraries it loads (TensorRT's builder
data only for the architectures named), the Visual C++ runtime, helper.ps1, a start script and the settings that
point it at this PC's server.

  py -3.12 remote/package.py --name sam            (server address: this PC's Hamachi address, port 6700)
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "remote"))

import server  # noqa: E402

RELEASE = ROOT / "engine" / "build" / "release"
TORCH_LIB = ROOT / ".venv" / "Lib" / "site-packages" / "torch" / "lib"
TENSORRT_LIB = ROOT / ".venv" / "Lib" / "site-packages" / "tensorrt_libs"
VC_REDIST = Path(r"C:\Program Files\Microsoft Visual Studio\18\Community\VC\Redist\MSVC")

# Every DLL self-play loads beyond Windows' own, found from the running process and each library's imports.
ENGINE = ["sixselfplay.exe", "onnxruntime.dll", "onnxruntime_providers_shared.dll", "onnxruntime_providers_cuda.dll",
          "onnxruntime_providers_tensorrt.dll"]
CUDA = ["cublas64_13.dll", "cublasLt64_13.dll", "nvrtc64_130_0.dll", "nvrtc-builtins64_130.dll"]
TENSORRT = ["nvinfer_10.dll", "nvinfer_plugin_10.dll", "nvonnxparser_10.dll", "nvinfer_builder_resource_ptx_10.dll"]
VC_RUNTIME = ["msvcp140.dll", "msvcp140_1.dll", "vcruntime140.dll", "vcruntime140_1.dll"]
ARCHITECTURES = {"20": "sm75", "30": "sm86", "40": "sm89", "50": "sm120"}  # GeForce RTX series -> TensorRT builder data

START = """@echo off
title HexBot helper
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0helper.ps1"
pause
"""

README = """HexBot helper
=============

This plays practice games for HexBot's training on your GPU and sends them to {owner}'s PC.

1. Join {owner}'s Hamachi network and stay connected.
2. Double-click "Start helper.bat". Leave the window open.
   The first games with each new network wait a minute or two while the GPU prepares it.
3. Close the window whenever you want the GPU back. Starting it again carries on.

Needs an NVIDIA driver from 2025 or later (version 580 or newer).
Nothing is installed: delete this folder to remove it.
"""


def vc_runtime_folder() -> Path:
    for folder in sorted(VC_REDIST.glob("*/x64/Microsoft.VC*.CRT"), reverse=True):
        if all((folder / name).exists() for name in VC_RUNTIME):
            return folder
    raise FileNotFoundError(f"no Visual C++ runtime under {VC_REDIST}")


def build(name: str, address: str, series: list[str], out: Path) -> Path:
    stage = out.with_suffix("")
    shutil.rmtree(stage, ignore_errors=True)
    bin_dir = stage / "bin"
    bin_dir.mkdir(parents=True)
    sources = [RELEASE / f for f in ENGINE] + [TORCH_LIB / f for f in CUDA] + sorted(TORCH_LIB.glob("cudnn*64_9.dll"))
    sources += [TENSORRT_LIB / f for f in TENSORRT]
    sources += [TENSORRT_LIB / f"nvinfer_builder_resource_{ARCHITECTURES[s]}_10.dll" for s in series]
    sources += [vc_runtime_folder() / f for f in VC_RUNTIME]
    for source in sources:
        shutil.copyfile(source, bin_dir / source.name)
    shutil.copyfile(ROOT / "remote" / "helper.ps1", stage / "helper.ps1")
    (stage / "Start helper.bat").write_text(START, encoding="ascii")
    (stage / "README.txt").write_text(README.format(owner="your friend"), encoding="utf-8")
    settings = {"server": f"http://{address}:{server.PORT}", "token": server.token(), "name": name}
    (stage / "helper-settings.json").write_text(json.dumps(settings, indent=2), encoding="utf-8")
    out.unlink(missing_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for path in sorted(stage.rglob("*")):
            if path.is_file():
                z.write(path, Path("HexBot helper") / path.relative_to(stage))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--name", required=True, help="the helper's name in the training log (letters, digits, - or _)")
    parser.add_argument("--address", help="the server's address (default: this PC's Hamachi address)")
    parser.add_argument("--series", nargs="+", default=["30"], choices=sorted(ARCHITECTURES),
                        help="GeForce RTX series of the helper's GPU (default: 30)")
    args = parser.parse_args()
    if not server.HELPER_NAME.match(args.name):
        parser.error("--name: letters, digits, - or _ only")
    address = args.address or server.hamachi_address()
    if not address:
        parser.error("no Hamachi address found; connect Hamachi or pass --address")
    out = build(args.name, address, args.series, ROOT / "dist" / "hexbot-helper.zip")
    print(f"{out} ({out.stat().st_size / 1e9:.2f} GB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
