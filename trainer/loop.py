"""Self-play RL loop: play, train on a window of recent generations, match against the previous generation, repeat.
Resumes where it left off. Usually started and stopped by trainer/start_loop.ps1 and trainer/stop_loop.ps1.

  .venv/Scripts/python trainer/loop.py --start runs/v1-mixed/best.pt

A generation's match against its predecessor runs alongside its self-play; if it measures weaker, the previous
network is restored before the next training.

State lives in runs/rl/:
  config.json   settings (read at the start of every generation, so edits apply without a restart)
  state.json    current generation and the history shown on the dashboard
  gen-NNNN/     net.pt, net.onnx (float16), train/ (training output), eval.json
  log.txt
Games go to data/rl/gen-NNNN/. Everything pauses while a fullscreen game or a chosen app runs (pause.py).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

from pause import kill_tree, pause_reason, resume, suspend, wait_while_paused

ROOT = Path(__file__).resolve().parents[1]
RUNS = Path(os.environ.get("SIX_RL_RUNS", ROOT / "runs" / "rl"))
DATA = Path(os.environ.get("SIX_RL_DATA", ROOT / "data" / "rl"))
PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
SELFPLAY = ROOT / "engine" / "build" / "release" / "sixselfplay.exe"
TORCH_LIB = ROOT / ".venv" / "Lib" / "site-packages" / "torch" / "lib"
TENSORRT_LIB = ROOT / ".venv" / "Lib" / "site-packages" / "tensorrt_libs"
SIXENGINE = ROOT / "engine" / "build" / "release" / "sixengine.exe"

DEFAULTS = {
    "gamesPerGeneration": 600,
    "threads": 48,
    "full": 200,
    "fast": 32,
    "fullShare": 25,
    "sampled": 16,
    "fastSampled": 4,
    "maxStones": 300,
    "windowGenerations": 6,
    "trainPasses": 2.0,
    "maxTrainSteps": None,  # caps a generation's training steps however many games came in
    "batch": 512,
    "lr": 5e-4,
    "trainWorkers": 6,
    "evalPairs": 20,
    "evalMoveMs": 300,
    "evalConcurrency": 2,  # games at a time in evaluation matches
    "hexbotEvalEvery": 5,
    "anchorEvery": 5,  # also match every Nth generation against the one N back (one generation's gain is
                       # too small for a 20-pair match to resolve)
    "anchorPairs": 24,
    # Larger shapes to grow through, e.g. {"sizes": [{"blocks": 10, "channels": 128},
    # {"blocks": 15, "channels": 128}], "epochs": 5, "batch": 256, "lr": 0.001, "movetimeMs": 1000, "pairs": 30,
    # "retryEvery": 5, "nextAfter": 10}; None: keep the current size.
    "grow": None,
    "hexbotMoveMs": 300,  # per turn for both sides in the HexBot match
    "tensorRt": True,
    "pauseApps": [],
}


def log(message: str) -> None:
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S}  {message}"
    print(line, flush=True)
    with open(RUNS / "log.txt", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_config() -> dict:
    path = RUNS / "config.json"
    config = dict(DEFAULTS)
    if path.exists():
        try:
            config.update(json.loads(path.read_text(encoding="utf-8-sig")))  # tolerate a byte order mark from hand edits
        except ValueError as e:
            log(f"config.json is unreadable ({e}); using defaults")
    else:
        path.write_text(json.dumps(DEFAULTS, indent=2), encoding="utf-8")
    return config


def load_state() -> dict:
    path = RUNS / "state.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"generation": 0, "history": []}


def save_state(state: dict) -> None:
    tmp = RUNS / "state.json.tmp"
    tmp.write_text(json.dumps(state, indent=2), encoding="utf-8")
    os.replace(tmp, RUNS / "state.json")


def gen_dir(g: int) -> Path:
    return RUNS / f"gen-{g:04d}"


def env_with_cuda() -> dict:
    env = dict(os.environ)
    env["PATH"] = os.pathsep.join([str(TORCH_LIB), str(TENSORRT_LIB), env.get("PATH", "")])
    return env


def use_tensorrt(config: dict) -> bool:
    return bool(config.get("tensorRt", True)) and (TENSORRT_LIB / "nvinfer_10.dll").exists()


def warm_up(net: Path) -> None:
    """Builds and caches the network's TensorRT engine so parallel processes don't race to build it."""
    subprocess.run([str(SIXENGINE), "--net", str(net), "--trt"], input="quit\n", text=True, cwd=str(ROOT),
                   env=env_with_cuda(), capture_output=True, timeout=900, creationflags=subprocess.CREATE_NO_WINDOW)


POLL_SECONDS = 5.0
RELEASE_AFTER_SECONDS = 60.0  # a suspended self-play still holds GPU memory; a longer pause stops it to hand that back
PAUSED_EXIT = -2  # run_pausable's code for a process stopped during a long pause
MATCH_PAUSE_FILE = RUNS / "MATCH-PAUSE"  # sixmatch waits between games while this exists
MATCH_RELEASE_AFTER_SECONDS = 180.0  # a waiting match still holds ~1 GB and a CUDA context
MATCH_ATTEMPTS = 3  # restarts allowed after a pause stopped the match


def run_pausable(command: list[str], log_prefix: str, env: dict | None = None, suspendable: bool = True,
                 release_after: float | None = None) -> int:
    """Runs a child process, logging its output and suspending it during pauses when `suspendable`.
    With `release_after`, a pause longer than that many seconds kills it instead and returns PAUSED_EXIT.

    Matches have timed games and can't be suspended; instead MATCH_PAUSE_FILE exists during a pause and sixmatch
    waits between games while it does (`--pause-file`)."""
    process = subprocess.Popen(command, cwd=str(ROOT), env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                               text=True, encoding="utf-8", errors="replace", bufsize=1,
                               creationflags=subprocess.CREATE_NO_WINDOW | subprocess.BELOW_NORMAL_PRIORITY_CLASS)
    def pump():
        assert process.stdout
        for line in process.stdout:
            line = line.rstrip()
            if line and "onnxruntime" not in line and "Deprecat" not in line and "torch.onnx.export" not in line:
                log(f"{log_prefix}: {line}")

    reader = threading.Thread(target=pump, daemon=True)
    reader.start()
    suspended = False
    suspended_at = 0.0
    asked_to_wait = False
    waiting_since = 0.0
    while process.poll() is None:
        if not suspendable:  # a match: it waits between games while the pause file exists
            waiting = pause_reason()
            if bool(waiting) != asked_to_wait:
                MATCH_PAUSE_FILE.write_text("", encoding="utf-8") if waiting else MATCH_PAUSE_FILE.unlink(missing_ok=True)
                asked_to_wait = bool(waiting)
                waiting_since = time.monotonic()
                log(f"{log_prefix}: {'waiting between games (' + waiting + ')' if waiting else 'playing on'}")
            # A long pause kills the waiting match; the caller replays it afterwards.
            if waiting and release_after is not None and time.monotonic() - waiting_since > release_after:
                kill_tree(process.pid)  # includes the venv launcher's interpreter and sixmatch
                process.wait()
                reader.join(timeout=5)
                MATCH_PAUSE_FILE.unlink(missing_ok=True)
                log(f"{log_prefix}: stopped while paused; it will be played again")
                return PAUSED_EXIT
        reason = pause_reason() if suspendable else None
        if reason and not suspended:
            suspended = suspend(process.pid)
            suspended_at = time.monotonic()
            if suspended:
                log(f"{log_prefix}: paused ({reason})")
        elif reason and suspended and release_after is not None and time.monotonic() - suspended_at > release_after:
            kill_tree(process.pid)  # finished games are already on disk; train.py's workers go with it
            process.wait()
            reader.join(timeout=5)
            log(f"{log_prefix}: stopped to free the GPU while paused")
            return PAUSED_EXIT
        elif not reason and suspended:
            resume(process.pid)
            suspended = False
            log(f"{log_prefix}: resumed")
        time.sleep(POLL_SECONDS)
    reader.join(timeout=5)
    if not suspendable:
        MATCH_PAUSE_FILE.unlink(missing_ok=True)
    return process.returncode


def game_records(g: int) -> list[dict]:
    games = []
    for path in sorted((DATA / f"gen-{g:04d}").glob("games-*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                games.append(json.loads(line))
            except ValueError:
                pass
    return games


def play_generation(g: int, config: dict) -> dict:
    out = DATA / f"gen-{g:04d}"
    out.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    while (missing := config["gamesPerGeneration"] - len(game_records(g))) > 0:
        wait_while_paused(log)
        log(f"generation {g}: self-play, {missing} games to go")
        code = run_pausable([str(SELFPLAY), "--net", str(gen_dir(g) / "net.onnx"), "--out", str(out),
                             "--games", str(missing), "--threads", str(config["threads"]),
                             "--full", str(config["full"]), "--fast", str(config["fast"]),
                             "--full-share", str(config["fullShare"]), "--sampled", str(config["sampled"]),
                             "--fast-sampled", str(config["fastSampled"]), "--max-stones", str(config["maxStones"]),
                             "--seed", str(int(time.time()) * 100 + g), *(["--trt"] if use_tensorrt(config) else [])],
                            f"selfplay {g}", env_with_cuda(), release_after=RELEASE_AFTER_SECONDS)
        if code == PAUSED_EXIT:
            continue  # play the missing games once the pause ends
        if code != 0:
            raise RuntimeError(f"self-play exited with code {code}")
        log(f"generation {g}: self-play took {(time.monotonic() - started) / 60:.0f} min")
    games = game_records(g)
    stones = [len(x["moves"]) for x in games]
    return {
        "games": len(games),
        "rows": sum(len(x["rows"]) for x in games),
        "xWins": sum(1 for x in games if x["winner"] == "X"),
        "oWins": sum(1 for x in games if x["winner"] == "O"),
        "unfinished": sum(1 for x in games if x["winner"] is None),
        "medianStones": sorted(stones)[len(stones) // 2] if stones else 0,
    }


def train_generation(g: int, config: dict, rows: int) -> dict:
    target = gen_dir(g + 1)
    target.mkdir(parents=True, exist_ok=True)
    first = max(0, g - config["windowGenerations"] + 1)
    patterns = [str(DATA / f"gen-{k:04d}" / "games-*.jsonl") for k in range(first, g + 1)]
    steps = max(50, math.ceil(config["trainPasses"] * rows / config["batch"]))
    if config.get("maxTrainSteps"):
        # Extra games (e.g. from a second machine) widen the data without lengthening training.
        steps = min(steps, int(config["maxTrainSteps"]))
    log(f"generation {g}: training {steps} steps on generations {first}-{g}")
    while True:
        # A suspended trainer still holds its CUDA context and several GB of memory, so a long pause kills it and
        # training restarts from scratch afterwards (at most one ~10 minute run is lost).
        wait_while_paused(log)
        shutil.rmtree(target / "train", ignore_errors=True)
        code = run_pausable([str(PYTHON), str(ROOT / "trainer" / "train.py"), "--init", str(gen_dir(g) / "net.pt"),
                             "--rl", *patterns, "--steps", str(steps), "--batch", str(config["batch"]),
                             "--lr", str(config["lr"]), "--workers", str(config["trainWorkers"]), "--pause",
                             "--out", str(target / "train"), "--export", str(target / "net.onnx"),
                             # TensorRT converts float32 models to float16 itself.
                             *([] if use_tensorrt(config) else ["--fp16"])], f"train {g + 1}",
                            release_after=RELEASE_AFTER_SECONDS)
        if code != PAUSED_EXIT:
            break
        log(f"generation {g}: training stopped to free the GPU while paused; it starts over once the pause ends")
    if code != 0:
        raise RuntimeError(f"training exited with code {code}")
    shutil.copyfile(target / "train" / "best.pt", target / "net.pt")
    metrics_path = target / "train" / "metrics.jsonl"
    last = json.loads(metrics_path.read_text(encoding="utf-8").splitlines()[-1]) if metrics_path.exists() else {}
    # net.pt is a copy of best.pt; delete the train/ checkpoints to save disk space.
    for spare in ("best.pt", "last.pt"):
        (target / "train" / spare).unlink(missing_ok=True)
    return {"steps": steps, "validation": {k: round(v, 4) for k, v in last.items() if isinstance(v, float)}}


def seed_grown_network(source: Path, target: Path, spec: dict) -> float:
    sys.path.insert(0, str(ROOT / "trainer"))
    from grow_net import grow_checkpoint

    pools = tuple(spec["poolBlocks"]) if spec.get("poolBlocks") else None
    return grow_checkpoint(source, target, spec["blocks"], spec["channels"], pools)


def export_network(checkpoint: Path, onnx: Path, config: dict) -> None:
    """Exports to ONNX: float16 unless TensorRT is used (it converts float32 models itself)."""
    sys.path.insert(0, str(ROOT / "trainer"))
    from export import export

    export(checkpoint, onnx, half=not use_tensorrt(config))


def grow_ladder(spec: dict) -> list[dict]:
    """Sizes to grow through, smallest first. A plain blocks/channels spec is a single size."""
    sizes = spec.get("sizes") or [{"blocks": spec["blocks"], "channels": spec["channels"]}]
    return [dict(spec, **size) for size in sizes]


def grow_next(g: int, spec: dict) -> tuple[dict, Path] | None:
    """The size to try at generation g + 1, or None while waiting (a size that failed its match and is due a retry
    later, or a promoted size that hasn't had `nextAfter` generations yet)."""
    for size in grow_ladder(spec):
        target = RUNS / f"grow-b{size['blocks']}c{size['channels']}"
        status_path = target / "status.json"
        status = json.loads(status_path.read_text(encoding="utf-8")) if status_path.exists() else {}
        if status.get("promoted"):
            if g + 1 < status.get("generation", 0) + spec.get("nextAfter", 10):
                return None
            continue
        if g + 1 < status.get("retryAt", 0):
            return None
        return size, target
    return None


def grow_in_place(g: int, spec: dict, target: Path, config: dict) -> dict:
    """Replaces generation g + 1's network with a grown copy, keeping the old one as small-net.pt.

    No match is played: the grown network is function-preserving, so any gain only shows in later generations.
    """
    name = target.name.removeprefix("grow-")
    for file in ("net.pt", "net.onnx"):
        shutil.move(gen_dir(g + 1) / file, gen_dir(g + 1) / f"small-{file}")
    difference = seed_grown_network(gen_dir(g + 1) / "small-net.pt", gen_dir(g + 1) / "net.pt", spec)
    export_network(gen_dir(g + 1) / "net.pt", gen_dir(g + 1) / "net.onnx", config)
    if use_tensorrt(config):
        warm_up(gen_dir(g + 1) / "net.onnx")
    log(f"generation {g + 1}: the network is now {name}, grown from the one it replaces "
        f"(it plays the same to within {difference:.1e}); later generations train on from it")
    return {"promoted": True, "generation": g + 1, "inPlace": True, "difference": difference}


def grow_network(g: int, config: dict) -> dict | None:
    """Grows generation g + 1's network into the next size.

    With `grow.inPlace` the grown network takes over directly. Otherwise it is trained on recent games and matched
    against generation g + 1 at equal time per move; it replaces it only if the 95% interval is above zero,
    and is retried `retryEvery` generations later otherwise."""
    chosen = grow_next(g, config.get("grow") or {}) if config.get("grow") else None
    if not chosen:
        return None
    spec, target = chosen
    name = target.name.removeprefix("grow-")
    status_path = target / "status.json"
    target.mkdir(parents=True, exist_ok=True)
    if spec.get("inPlace"):
        status = grow_in_place(g, spec, target, config)
        status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")
        return {"network": name, **status}
    window = spec.get("windowGenerations", 2 * config["windowGenerations"])
    first = max(0, g + 1 - window)
    patterns = [str(DATA / f"gen-{k:04d}" / "games-*.jsonl") for k in range(first, g + 1)]
    # The first attempt seeds from this generation's network; retries keep training the grown one.
    again = (target / "net.pt").exists()
    if not again:
        difference = seed_grown_network(gen_dir(g + 1) / "net.pt", target / "net.pt", spec)
        log(f"generation {g + 1}: grew generation {g + 1}'s network into {name} "
            f"(it plays the same to within {difference:.1e})")
    epochs = spec.get("retryEpochs", 2) if again else spec["epochs"]
    log(f"generation {g + 1}: training the {name} network for {epochs} passes over generations {first}-{g}")
    code = run_pausable([str(PYTHON), str(ROOT / "trainer" / "train.py"), "--rl", *patterns,
                         "--init", str(target / "net.pt"),
                         "--epochs", str(epochs), "--batch", str(spec["batch"]),
                         "--lr", str(spec.get("retryLr", spec["lr"]) if again else spec["lr"]),
                         "--workers", str(spec.get("workers", config["trainWorkers"])), "--pause",
                         "--out", str(target / "train"), "--export", str(target / "net.onnx")], f"grow {name}")
    if code != 0:
        raise RuntimeError(f"training the {name} network exited with code {code}")
    shutil.copyfile(target / "train" / "best.pt", target / "net.pt")
    if use_tensorrt(config):
        warm_up(target / "net.onnx")
    summary = net_match(target / "net.onnx", gen_dir(g + 1) / "net.onnx", spec["movetimeMs"], spec["pairs"],
                        f"grow {name} vs {g + 1}", config["evalConcurrency"])
    bout = {k: summary[k] for k in ("wins", "losses", "elo", "eloLow", "eloHigh")}
    if summary["eloLow"] > 0:
        for file in ("net.pt", "net.onnx"):
            shutil.move(gen_dir(g + 1) / file, gen_dir(g + 1) / f"small-{file}")
            shutil.copyfile(target / file, gen_dir(g + 1) / file)
        status = {"promoted": True, "generation": g + 1, "match": bout}
        log(f"generation {g + 1}: the {name} network measured stronger ({bout}) and takes over")
    else:
        status = {"promoted": False, "retryAt": g + 1 + spec.get("retryEvery", 5), "match": bout}
        log(f"generation {g + 1}: the {name} network isn't stronger yet ({bout}); trying again at generation {status['retryAt']}")
    status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")
    return {"network": name, **status}


def run_match(command: list[str], name: str) -> dict:
    """Runs an arena match script with its own --out folder (matches can overlap) and returns its summary."""
    slug = "".join(ch if ch.isalnum() else "-" for ch in name.lower())
    for attempt in range(MATCH_ATTEMPTS):
        wait_while_paused(log)
        out = ROOT / "data" / "arena" / f"{datetime.now():%Y%m%d-%H%M%S}-{slug}"
        code = run_pausable([*command, "--out", str(out)], name, suspendable=False,  # timed games
                            release_after=MATCH_RELEASE_AFTER_SECONDS)
        summary = out / "summary.json"
        if summary.exists():
            return json.loads(summary.read_text(encoding="utf-8"))
        if code != PAUSED_EXIT:
            break
        if attempt + 1 < MATCH_ATTEMPTS:
            log(f"{name}: starting over after the pause (its games so far are lost)")
    raise RuntimeError(f"match {name} produced no summary (exit code {code})")


def match(engine_a: str, engine_b: str, pairs: int, name: str, concurrency: int = 2) -> dict:
    """Paired match between two arena engines, one process per side per game."""
    return run_match(["py", "-3.12", str(ROOT / "arena" / "match.py"), engine_a, engine_b, "--pairs", str(pairs),
                      "--radius", "8", "--concurrency", str(concurrency),
                      "--pause-file", str(MATCH_PAUSE_FILE)], name)


def net_match(net_a: Path, net_b: Path, ms: int, pairs: int, name: str, concurrency: int = 2) -> dict:
    """Paired match between two networks in a single sixmatch process (one CUDA context, much less RAM)."""
    return run_match(["py", "-3.12", str(ROOT / "arena" / "netmatch.py"), str(net_a), str(net_b), "--movetime", str(ms),
                      "--pairs", str(pairs), "--radius", "8", "--concurrency", str(concurrency),
                      "--pause-file", str(MATCH_PAUSE_FILE)], name)


def evaluate_generation(g: int, config: dict) -> dict:
    saved = gen_dir(g + 1) / "eval.json"
    if saved.exists():
        # Already measured before a restart.
        result = json.loads(saved.read_text(encoding="utf-8"))
        bout = result.get("vsPrevious") or {}
        if all(isinstance(bout.get(k), (int, float)) for k in ("wins", "losses", "elo", "eloLow", "eloHigh")):
            return {"vsPrevious": bout}
    new = gen_dir(g + 1) / "net.onnx"
    old = gen_dir(g) / "net.onnx"
    ms = config["evalMoveMs"]
    result = {}
    if use_tensorrt(config):
        warm_up(new)
        warm_up(old)
    summary = net_match(new, old, ms, config["evalPairs"], f"eval {g + 1} vs {g}", config["evalConcurrency"])
    result["vsPrevious"] = {**{k: summary[k] for k in ("wins", "losses", "elo", "eloLow", "eloHigh")}, "moveMs": ms}
    (gen_dir(g + 1) / "eval.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def hexbot_eval(generation: int, config: dict) -> dict:
    """Matches a generation against HexBot (a fixed baseline) and saves eval-hexbot.json."""
    ms = config["hexbotMoveMs"]
    # One game at a time: it runs beside the next generation's match and self-play.
    summary = match(f"hexnet:{ms}:{gen_dir(generation) / 'net.onnx'}", f"hexbot:{ms}", config["evalPairs"],
                    f"eval {generation} vs HexBot", 1)
    result = {"vsHexBot": {**{k: summary[k] for k in ("wins", "losses", "elo", "eloLow", "eloHigh")}, "moveMs": ms}}
    (gen_dir(generation) / "eval-hexbot.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def anchor_eval(generation: int, against: int, config: dict) -> dict:
    """Matches a generation against an older one, since one generation's gain is too small to resolve."""
    ms = config["evalMoveMs"]
    summary = net_match(gen_dir(generation) / "net.onnx", gen_dir(against) / "net.onnx", ms,
                        config.get("anchorPairs", config["evalPairs"]), f"eval {generation} vs {against}", 1)
    result = {"vsAnchor": {"against": against, "moveMs": ms,
                           **{k: summary[k] for k in ("wins", "losses", "elo", "eloLow", "eloHigh")}}}
    (gen_dir(generation) / "eval-anchor.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def attach_extra_results(state: dict) -> bool:
    """Adds finished HexBot and older-generation matches to their history records; True if any were added."""
    changed = False
    for record in state["history"]:
        evaluation = record.setdefault("evaluation", {})
        for name, key in (("eval-hexbot.json", "vsHexBot"), ("eval-anchor.json", "vsAnchor")):
            path = gen_dir(record["generation"]) / name
            if key not in evaluation and path.exists():
                evaluation.update(json.loads(path.read_text(encoding="utf-8")))
                changed = True
    return changed


class BackgroundEvaluation:
    """Matches generation g + 1 against g on a background thread, then (periodically) against HexBot and an older
    generation. Only the first result is waited on; the others are attached to history when they finish."""

    def __init__(self, g: int, config: dict):
        self.g = g
        self.result: dict | None = None
        self.error: Exception | None = None
        self.measured = threading.Event()
        self.thread = threading.Thread(target=self._run, args=(config,), daemon=True)
        self.thread.start()

    def _run(self, config: dict) -> None:
        try:
            self.result = evaluate_generation(self.g, config)
        except Exception as e:  # reported when the result is collected
            self.error = e
        finally:
            self.measured.set()
        if (self.g + 1) % config["hexbotEvalEvery"] == 0:
            try:
                hexbot_eval(self.g + 1, config)
            except Exception as e:
                log(f"generation {self.g + 1}: HexBot match failed ({e})")
        every = config.get("anchorEvery", 0)
        if every and (self.g + 1) % every == 0 and self.g + 1 - every >= 0:
            try:
                anchor_eval(self.g + 1, self.g + 1 - every, config)
            except Exception as e:
                log(f"generation {self.g + 1}: the match against generation {self.g + 1 - every} failed ({e})")

    def wait(self) -> dict | None:
        self.measured.wait()
        return self.result


def finish_evaluation(pending: dict, evaluation: BackgroundEvaluation) -> dict:
    """History record for a measured generation. If it measured weaker (95% interval entirely below zero), its
    network is replaced by its predecessor's."""
    g = pending["generation"]
    result = evaluation.wait()
    if result is None:
        log(f"generation {g}: evaluation failed ({evaluation.error}); keeping the network unmeasured")
        result = {}
    else:
        log(f"generation {g}: {result}")
    # Never roll back a generation whose network was just grown.
    if (result.get("vsPrevious", {}).get("eloHigh") or 0) < 0 and not pending.get("grown"):
        for name in ("net.pt", "net.onnx"):
            shutil.move(gen_dir(g) / name, gen_dir(g) / f"rejected-{name}")
            shutil.copyfile(gen_dir(g - 1) / name, gen_dir(g) / name)
        result["rolledBack"] = True
        log(f"generation {g} measured weaker than {g - 1}; the next generation trains from generation {g - 1}'s network")
    record = {"generation": g, "finished": datetime.now().isoformat(timespec="seconds"),
              "selfplay": pending.get("selfplay"), "training": pending.get("training"), "evaluation": result}
    if pending.get("grown"):
        record["grown"] = pending["grown"]
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--start", type=Path, help="checkpoint for generation 0 (only when starting fresh)")
    parser.add_argument("--generations", type=int, default=0, help="stop after this many generations (0: never)")
    args = parser.parse_args()
    RUNS.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)

    state = load_state()
    if not (gen_dir(0) / "net.pt").exists():
        if not args.start:
            print("starting fresh needs --start <checkpoint>", file=sys.stderr)
            return 2
        gen_dir(0).mkdir(parents=True, exist_ok=True)
        shutil.copyfile(args.start, gen_dir(0) / "net.pt")
        sys.path.insert(0, str(ROOT / "trainer"))
        from export import export
        export(gen_dir(0) / "net.pt", gen_dir(0) / "net.onnx", half=not use_tensorrt(load_config()))
        log(f"generation 0 is {args.start}")

    done = 0
    evaluation: BackgroundEvaluation | None = None
    while args.generations == 0 or done < args.generations:
        config = load_config()
        g = state["generation"]
        pending = state.get("pending")
        try:
            wait_while_paused(log)
            if use_tensorrt(config) and (gen_dir(g) / "net.onnx").exists():
                warm_up(gen_dir(g) / "net.onnx")
            if pending and evaluation is None:
                # Match the newest network against its predecessor during its self-play.
                evaluation = BackgroundEvaluation(g - 1, config)
            played = play_generation(g, config)
            log(f"generation {g}: {played}")
            if evaluation is not None and pending:
                record = finish_evaluation(pending, evaluation)
                evaluation = None
                state["history"].append(record)
                state.pop("pending", None)
                save_state(state)
            if attach_extra_results(state):
                save_state(state)
            trained = train_generation(g, config, played["rows"])
            try:
                grown = grow_network(g, config)
            except Exception as e:  # growing is optional
                log(f"generation {g + 1}: growing the network failed ({e})")
                grown = None
        except Exception as e:  # keep the loop alive across crashes; retry the same generation
            log(f"generation {g} failed: {e}; retrying in 60 s")
            if evaluation is not None and evaluation.measured.is_set():
                evaluation = None  # re-run rather than reuse a possibly failed result
            time.sleep(60)
            continue
        state["generation"] = g + 1
        state["pending"] = {"generation": g + 1, "selfplay": played, "training": trained}
        if grown and grown.get("promoted"):
            state["pending"]["grown"] = grown
        attach_extra_results(state)
        save_state(state)
        done += 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
