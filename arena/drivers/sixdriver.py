"""Runs a Python bot behind the Six engine protocol on stdin/stdout.

A driver supplies `new_game()` and `turn(game) -> list of cells`; this loop handles the
protocol, rebuilds positions with the arena's own rules, and checks every answer.
"""
from __future__ import annotations

import sys
import traceback
from pathlib import Path
from typing import Protocol

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from six_rules import Cell, Game, distance  # noqa: E402


class Bot(Protocol):
    name: str

    def new_game(self) -> None: ...

    def turn(self, game: Game) -> list[Cell]: ...


def nearest_legal(game: Game, wanted: Cell) -> Cell:
    """The playable cell closest to one a rival asked for but can't have (e.g. outside the radius)."""
    return min(game.playable_cells(), key=lambda c: (distance(c, wanted), c))


def run(bot: Bot, version: str = "rival") -> None:
    game = Game(9)
    out = sys.stdout
    for raw in sys.stdin:
        line = raw.strip().lstrip("﻿")
        if not line:
            continue
        words = line.split()
        command = words[0]
        try:
            if command == "six":
                print(f"id name {bot.name}", file=out)
                print(f"id version {version}", file=out)
                print("sixok", file=out, flush=True)
            elif command == "isready":
                print("readyok", file=out, flush=True)
            elif command == "newgame":
                bot.new_game()
            elif command == "position":
                radius = int(words[words.index("radius") + 1]) if "radius" in words else 8
                numbers = [int(w) for w in words[words.index("moves") + 1 :]] if "moves" in words else []
                game = Game(radius)
                for i in range(0, len(numbers), 2):
                    if game.place((numbers[i], numbers[i + 1])):
                        print(f"error illegal move {i // 2 + 1}", file=out, flush=True)
                        break
            elif command == "go":
                cells = bot.turn(game)
                probe = Game(game.radius)
                for m in game.moves:
                    probe.place(m)
                played: list[Cell] = []
                for cell in cells[: probe.stones_left]:
                    if not probe.is_playable(cell):
                        replacement = nearest_legal(probe, cell)
                        print(f"{bot.name} asked for illegal {cell}; playing {replacement}", file=sys.stderr, flush=True)
                        cell = replacement
                    probe.place(cell)
                    played.append(cell)
                    if probe.winner:
                        break
                print("bestmove " + " ".join(f"{q} {r}" for q, r in played), file=out, flush=True)
            elif command == "quit":
                return
        except Exception:
            traceback.print_exc(file=sys.stderr)
            print(f"error {command} failed", file=out, flush=True)
