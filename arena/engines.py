"""How to start each engine the arena knows, from a short spec like "hexbot:1000" or "sealbot:d4"."""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRIVERS = Path(__file__).resolve().parent / "drivers"
PYTHON312 = ["py", "-3.12"] if sys.platform == "win32" else ["python3.12"]


@dataclass
class EngineSpec:
    label: str
    command: list[str]
    go: str
    move_timeout: float
    setup: list[str] = field(default_factory=list)  # protocol lines sent after the handshake
    env: dict[str, str] | None = None                # environment for the engine process (None: inherit)


def engine_exe() -> Path:
    """HexBot's engine: the release build, or SIX_ENGINE (e.g. a development build under test)."""
    return Path(os.environ.get("SIX_ENGINE") or ROOT / "engine" / "build" / "release" / "sixengine.exe")


def shrimp_python() -> Path:
    """Shrimp runs from its own venv in rivals/shrimp (CPU torch plus its maturin-built crates)."""
    venv = ROOT / "rivals" / "shrimp" / ".venv"
    return venv / "Scripts" / "python.exe" if sys.platform == "win32" else venv / "bin" / "python"


def parse_spec(spec: str) -> EngineSpec:
    """HexBot specs take search settings after commas: "hexbot:1000,nodeThreatNodes=0"."""
    spec, *settings = spec.split(",")
    kind, _, option = spec.partition(":")
    setup = []
    for setting in settings:
        name, _, value = setting.partition("=")
        if not name or not value.lstrip("-").isdigit():
            raise ValueError(f"bad engine setting: {setting}")
        setup.append(f"setoption {name} {value}")
    if setup and not kind.startswith(("hexbot", "hexnet", "hexnnue")):
        raise ValueError(f"only HexBot takes settings: {spec}")
    suffix = "".join(f" {s}" for s in settings)
    if kind == "hexbot":
        ms = int(option or 1000)
        exe = engine_exe()
        return EngineSpec(f"HexBot {ms}ms{suffix}", [str(exe)], f"go movetime {ms}", ms / 1000 * 3 + 10, setup)
    if kind == "hexnet":
        # hexnet:<ms>:<model.onnx> searches with the network on the GPU, using PyTorch's CUDA DLLs from the venv.
        ms_text, _, model = option.partition(":")
        ms = int(ms_text or 1000)
        model_path = Path(model)
        if not model_path.is_absolute():
            model_path = ROOT / model_path
        exe = engine_exe()
        site = ROOT / ".venv" / "Lib" / "site-packages"
        env = dict(os.environ)
        env["PATH"] = os.pathsep.join([str(site / "torch" / "lib"), str(site / "tensorrt_libs"), env.get("PATH", "")])
        # TensorRT when installed; its engine is cached beside the model after the first process builds it.
        trt = ["--trt"] if (site / "tensorrt_libs" / "nvinfer_10.dll").exists() else []
        label = f"HexNet {model_path.parent.name}/{model_path.stem} {ms}ms{suffix}"
        return EngineSpec(label, [str(exe), "--net", str(model_path), *trt], f"go movetime {ms}", ms / 1000 * 3 + 900, setup, env)
    if kind == "hexnnue":
        # hexnnue:<ms>:<weights> is the alpha-beta engine evaluating with a Six NNUE (CPU only).
        ms_text, _, weights = option.partition(":")
        ms = int(ms_text or 1000)
        weights_path = Path(weights or "runs/nnue/v1/six.nnue")
        if not weights_path.is_absolute():
            weights_path = ROOT / weights_path
        label = f"Six NNUE {weights_path.parent.name} {ms}ms{suffix}"
        return EngineSpec(label, [str(engine_exe()), "--nnue", str(weights_path)], f"go movetime {ms}", ms / 1000 * 3 + 10, setup)
    if kind == "hexbot-depth":
        depth = int(option or 4)
        exe = engine_exe()
        return EngineSpec(f"HexBot d{depth}{suffix}", [str(exe)], f"go depth {depth}", 300, setup)
    if kind == "sealbot":
        if option.startswith("t"):
            seconds = float(option[1:])
            return EngineSpec(f"SealBot {seconds}s", PYTHON312 + [str(DRIVERS / "sealbot_driver.py"), "--time", str(seconds)], "go", seconds * 4 + 15)
        depth = int(option.lstrip("d") or 4)
        return EngineSpec(f"SealBot d{depth}", PYTHON312 + [str(DRIVERS / "sealbot_driver.py"), "--depth", str(depth)], "go", 300)
    if kind in ("strix", "strix-live"):
        # strix:<sims>, or strix-live:<sims>[:<difficulty>] with the hexo.tyto.cc forcing layer.
        sims, _, difficulty = option.partition(":")
        sims = sims or "64"
        command = ["node", str(DRIVERS / "strix_driver.mjs"), "--sims", sims]
        label = f"Strix {sims} sims"
        if kind == "strix-live":
            difficulty = difficulty or "standard"
            command += ["--live", difficulty]
            label += f" live {difficulty}"
        return EngineSpec(label, command, "go", 600)
    if kind == "shrimp":
        # shrimp:<visits>[:<threads>]: search visits per stone (default 512) and torch CPU threads (default 4).
        visits_text, _, threads_text = option.partition(":")
        visits = int(visits_text or 512)
        threads = int(threads_text or 4)
        command = [str(shrimp_python()), str(DRIVERS / "shrimp_driver.py"), "--visits", str(visits), "--threads", str(threads)]
        # CPU inference runs 20-30 ms a visit on 4 threads (a turn is two stones); leave room for a loaded machine.
        return EngineSpec(f"Shrimp {visits}v", command, "go", visits * 0.25 + 120)
    if kind == "hexo_bot2":
        seconds = float(option or 0.7)
        return EngineSpec(f"hexo_bot2 {seconds}s", PYTHON312 + [str(DRIVERS / "hexo_bot2_driver.py"), "--time", str(seconds)], "go", seconds * 6 + 15)
    raise ValueError(f"unknown engine spec: {spec}")
