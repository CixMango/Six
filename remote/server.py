"""Lets a friend's PC play self-play games for the training loop.

A helper (remote/helper.ps1, shipped by remote/package.py) asks this server which network is current, downloads it,
plays a batch of games with the same sixselfplay.exe and settings as the loop, and uploads them. Accepted games land
beside the loop's own (data/rl/gen-NNNN/games-remote-*.jsonl), so training picks them up with no change to the loop.

Every uploaded game is replayed under the rules before it is kept: one malformed record would stop training.
Run it beside the loop:  py -3.12 remote/server.py   (listens on the Hamachi address by default)

  GET  /status                          current generation, engine hash and self-play settings
  GET  /net/<generation>                that generation's net.onnx
  POST /games?generation=N&helper=NAME  newline-separated game records
  GET  /package                         dist/hexbot-helper.zip
Every request needs the header X-HexBot-Token with the contents of runs/rl/remote-token.txt.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import math
import os
import re
import secrets
import socket
import sys
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "arena"))

from six_rules import Game  # noqa: E402

RUNS = Path(os.environ.get("SIX_RL_RUNS", ROOT / "runs" / "rl"))
DATA = Path(os.environ.get("SIX_RL_DATA", ROOT / "data" / "rl"))
SELFPLAY = Path(os.environ.get("SIX_SELFPLAY", ROOT / "engine" / "build" / "release" / "sixselfplay.exe"))
PACKAGE = ROOT / "dist" / "hexbot-helper.zip"
PORT = 6700
MAX_UPLOAD = 64 * 1024 * 1024
SELFPLAY_KEYS = ("threads", "full", "fast", "fullShare", "sampled", "fastSampled", "maxStones")
REMOTE_DEFAULTS = {"gamesPerGeneration": 2400, "batch": 400}
HELPER_NAME = re.compile(r"^[A-Za-z0-9_-]{1,32}$")
_write_lock = threading.Lock()


def token() -> str:
    path = RUNS / "remote-token.txt"
    if not path.exists():
        RUNS.mkdir(parents=True, exist_ok=True)
        path.write_text(secrets.token_urlsafe(24), encoding="utf-8")
    return path.read_text(encoding="utf-8").strip()


def load_config() -> dict:
    path = RUNS / "config.json"
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return {}


def current_generation() -> int:
    try:
        return int(json.loads((RUNS / "state.json").read_text(encoding="utf-8"))["generation"])
    except (OSError, ValueError, KeyError):
        return 0


_hash_cache: dict[tuple[str, float], str] = {}


def engine_hash(path: Path = SELFPLAY) -> str:
    key = (str(path), path.stat().st_mtime)
    if key not in _hash_cache:
        _hash_cache[key] = hashlib.sha256(path.read_bytes()).hexdigest()
    return _hash_cache[key]


def remote_settings(config: dict) -> dict:
    return {**REMOTE_DEFAULTS, **config.get("remote", {})}


_count_cache: dict[int, tuple[float, int]] = {}
COUNT_CACHE_SECONDS = 30.0  # counting lines in a generation's 60 MB of games on every request steals CPU from self-play


def games_in(generation: int) -> int:
    cached = _count_cache.get(generation)
    if cached and time.monotonic() - cached[0] < COUNT_CACHE_SECONDS:
        return cached[1]
    folder = DATA / f"gen-{generation:04d}"
    total = 0
    for path in folder.glob("games-*.jsonl"):
        with path.open("rb") as f:
            total += sum(1 for line in f if line.strip())
    _count_cache[generation] = (time.monotonic(), total)
    return total


def wanted_limit(config: dict) -> int:
    """Games a generation may hold in all: the loop's own plus the helpers' share, so a paused loop's generation
    cannot pile up hours of games that would all have to be trained on."""
    return int(config.get("gamesPerGeneration", 2400)) + int(remote_settings(config)["gamesPerGeneration"])


def accepts(generation: int, current: int, config: dict) -> bool:
    """A generation's games are useful while a later training window will still include them."""
    window = int(config.get("windowGenerations", 6))
    return current - window + 2 <= generation <= current


def check_game(record: object) -> str | None:
    """None when the record is one the trainer can use; otherwise why not."""
    if not isinstance(record, dict):
        return "not an object"
    radius, moves, winner, rows = (record.get(k) for k in ("radius", "moves", "winner", "rows"))
    if radius not in (8, 9) or not isinstance(record.get("opening"), int):
        return "bad radius or opening"
    if winner not in ("X", "O", None):
        return "bad winner"
    if not isinstance(moves, list) or not moves or len(moves) > 1000:
        return "bad moves"
    if not all(isinstance(m, list) and len(m) == 2 and all(type(v) is int for v in m) for m in moves):
        return "bad move"
    if not isinstance(rows, list):  # a game can have no searched rows at all (training skips it), as the loop's do
        return "bad rows"
    for row in rows:
        if not isinstance(row, dict) or type(row.get("at")) is not int or not 0 <= row["at"] < len(moves):
            return "bad row"
        value, policy = row.get("value"), row.get("policy")
        if not isinstance(value, (int, float)) or not math.isfinite(value) or not -1.0001 <= value <= 1.0001:
            return "bad value"
        if "kl" in row and (not isinstance(row["kl"], (int, float)) or not math.isfinite(row["kl"])):
            return "bad kl"
        if not isinstance(policy, list) or not policy:
            return "bad policy"
        for entry in policy:
            if not (isinstance(entry, list) and len(entry) == 3 and type(entry[0]) is int and type(entry[1]) is int
                    and isinstance(entry[2], (int, float)) and math.isfinite(entry[2]) and entry[2] >= 0):
                return "bad policy entry"
    game = Game(radius)
    for m in moves:
        if game.place((m[0], m[1])):
            return "illegal move"
    if game.winner != winner:
        return "winner does not match the moves"
    return None


def store_games(body: bytes, generation: int, helper: str) -> dict:
    kept, rejected, reasons = [], 0, {}
    for line in body.decode("utf-8", errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
            reason = check_game(record)
        except ValueError:
            reason = "not JSON"
        if reason:
            rejected += 1
            reasons[reason] = reasons.get(reason, 0) + 1
        else:
            kept.append(json.dumps(record, separators=(",", ":")))
    rows = 0
    if kept:
        folder = DATA / f"gen-{generation:04d}"
        folder.mkdir(parents=True, exist_ok=True)
        stamp = f"{time.time_ns()}-{secrets.token_hex(3)}"
        tmp = folder / f"incoming-{helper}-{stamp}.tmp"  # not games-*.jsonl, so nothing reads it half-written
        tmp.write_text("\n".join(kept) + "\n", encoding="utf-8")
        os.replace(tmp, folder / f"games-remote-{helper}-{stamp}.jsonl")
        rows = sum(len(json.loads(k)["rows"]) for k in kept)
        cached = _count_cache.get(generation)  # keep the cheap count right without rereading the generation
        if cached:
            _count_cache[generation] = (cached[0], cached[1] + len(kept))
    entry = {"when": datetime.now().isoformat(timespec="seconds"), "helper": helper, "generation": generation,
             "games": len(kept), "rows": rows, "rejected": rejected}
    if reasons:
        entry["reasons"] = reasons
    with _write_lock, (RUNS / "remote.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


class Handler(BaseHTTPRequestHandler):
    server_version = "HexBotRemote/1"

    def log_message(self, format, *args):  # noqa: A002 - the base class's name
        pass

    def reply(self, code: int, payload: dict) -> None:
        data = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path: Path) -> None:
        size = path.stat().st_size
        self.send_response(200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Length", str(size))
        self.end_headers()
        with path.open("rb") as f:
            while chunk := f.read(1 << 20):
                self.wfile.write(chunk)

    def authorized(self) -> bool:
        given = self.headers.get("X-HexBot-Token", "")
        if hmac.compare_digest(given.encode(), token().encode()):
            return True
        self.reply(403, {"error": "wrong token"})
        return False

    def do_GET(self):  # noqa: N802
        if not self.authorized():
            return
        url = urlparse(self.path)
        config, current = load_config(), current_generation()
        if url.path == "/status":
            net = RUNS / f"gen-{current:04d}" / "net.onnx"
            self.reply(200, {"generation": current, "ready": net.exists(), "engine": engine_hash(),
                             "wanted": games_in(current) < wanted_limit(config),
                             "batch": remote_settings(config)["batch"],
                             "selfplay": {k: config[k] for k in SELFPLAY_KEYS if k in config}})
        elif m := re.fullmatch(r"/net/(\d+)", url.path):
            net = RUNS / f"gen-{int(m.group(1)):04d}" / "net.onnx"
            self.send_file(net) if net.exists() else self.reply(404, {"error": "no such network"})
        elif url.path == "/package" and PACKAGE.exists():
            self.send_file(PACKAGE)
        else:
            self.reply(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        if not self.authorized():
            return
        url = urlparse(self.path)
        query = parse_qs(url.query)
        try:
            generation = int(query.get("generation", [""])[0])
        except ValueError:
            return self.reply(400, {"error": "generation must be a number"})
        helper = query.get("helper", [""])[0]
        if url.path != "/games" or not HELPER_NAME.match(helper):
            return self.reply(400, {"error": "POST /games?generation=N&helper=NAME"})
        length = int(self.headers.get("Content-Length", "0"))
        if not 0 < length <= MAX_UPLOAD:
            return self.reply(413, {"error": "upload too large"})
        body = self.rfile.read(length)
        config, current = load_config(), current_generation()
        if not accepts(generation, current, config):
            return self.reply(200, {"games": 0, "stale": True, "generation": current})
        if games_in(generation) >= wanted_limit(config):
            return self.reply(200, {"games": 0, "full": True, "generation": current})
        self.reply(200, store_games(body, generation, helper))


def hamachi_address() -> str | None:
    """The PC's Hamachi address (Hamachi hands out 25.x.x.x), so the server is not open to the local network too."""
    try:
        addresses = {info[4][0] for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)}
    except OSError:
        return None
    return next((a for a in sorted(addresses) if a.startswith("25.")), None)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", help="address to listen on (default: this PC's Hamachi address)")
    parser.add_argument("--port", type=int, default=PORT)
    args = parser.parse_args()
    host = args.host or hamachi_address()
    if not host:
        print("no Hamachi address found; is Hamachi connected? (or pass --host)", file=sys.stderr)
        return 2
    token()
    print(f"remote self-play server on http://{host}:{args.port}", flush=True)
    ThreadingHTTPServer((host, args.port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
