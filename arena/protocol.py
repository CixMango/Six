"""Client for engines that speak the Six engine protocol (see engine/src/main.cpp)."""
from __future__ import annotations

import queue
import subprocess
import sys
import threading
import time

from six_rules import Cell


class EngineError(RuntimeError):
    """The engine crashed, timed out, or said something unreadable."""


class EngineClient:
    def __init__(self, command: list[str], name: str, cwd: str | None = None, env: dict[str, str] | None = None):
        self.name = name
        flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        self.proc = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            bufsize=1,
            cwd=cwd,
            env=env,
            creationflags=flags,
        )
        self.lines: queue.Queue[str | None] = queue.Queue()
        self.stderr: list[str] = []
        threading.Thread(target=self._read_stdout, daemon=True).start()
        threading.Thread(target=self._read_stderr, daemon=True).start()

    def _read_stdout(self) -> None:
        assert self.proc.stdout
        for line in self.proc.stdout:
            self.lines.put(line.rstrip("\r\n"))
        self.lines.put(None)

    def _read_stderr(self) -> None:
        assert self.proc.stderr
        for line in self.proc.stderr:
            self.stderr.append(line.rstrip("\r\n"))
            del self.stderr[:-200]

    def send(self, line: str) -> None:
        try:
            assert self.proc.stdin
            self.proc.stdin.write(line + "\n")
            self.proc.stdin.flush()
        except (OSError, ValueError) as e:
            raise EngineError(f"{self.name} stopped accepting commands: {e}") from e

    def wait_for(self, prefix: str, timeout: float) -> str:
        deadline = time.monotonic() + timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise EngineError(f"{self.name} did not answer within {timeout:.0f} s")
            try:
                line = self.lines.get(timeout=remaining)
            except queue.Empty:
                continue
            if line is None:
                tail = " | ".join(self.stderr[-5:])
                raise EngineError(f"{self.name} exited unexpectedly. {tail}")
            if line.startswith("error"):
                raise EngineError(f"{self.name}: {line}")
            if line.startswith(prefix):
                return line

    def handshake(self, timeout: float = 30.0) -> None:
        self.send("six")
        self.wait_for("sixok", timeout)

    def new_game(self) -> None:
        self.send("newgame")
        self.send("isready")
        self.wait_for("readyok", 30.0)

    def best_turn(self, moves: list[Cell], radius: int, go: str, timeout: float) -> list[Cell]:
        return self.search(moves, radius, go, timeout)[0]

    def search(self, moves: list[Cell], radius: int, go: str, timeout: float) -> tuple[list[Cell], list[dict[str, int]]]:
        """The engine's turn, plus each `info` line it sent on the way as {depth, score, nodes, time}."""
        flat = " ".join(f"{q} {r}" for q, r in moves)
        self.send(f"position radius {radius}" + (f" moves {flat}" if flat else ""))
        self.send(go)
        infos: list[dict[str, int]] = []
        deadline = time.monotonic() + timeout
        while True:
            line = self.wait_for("", max(deadline - time.monotonic(), 0.001))
            if line.startswith("bestmove"):
                break
            words = line.split()
            if words and words[0] == "info":
                info = {}
                for key in ("depth", "score", "nodes", "time"):
                    if key in words:
                        try:
                            info[key] = int(words[words.index(key) + 1])
                        except (IndexError, ValueError):
                            pass
                infos.append(info)
        parts = line.split()[1:]
        try:
            numbers = [int(p) for p in parts]
        except ValueError as e:
            raise EngineError(f"{self.name} sent an unreadable move: {line}") from e
        if not numbers or len(numbers) % 2:
            raise EngineError(f"{self.name} sent an unreadable move: {line}")
        return [(numbers[i], numbers[i + 1]) for i in range(0, len(numbers), 2)], infos

    def close(self) -> None:
        try:
            self.send("quit")
            self.proc.wait(timeout=3)
        except Exception:
            pass
        if self.proc.poll() is None:
            self.proc.kill()
            self.proc.wait(timeout=3)
        for stream in (self.proc.stdin, self.proc.stdout, self.proc.stderr):
            try:
                if stream:
                    stream.close()
            except OSError:
                pass
