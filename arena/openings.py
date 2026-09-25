"""Deterministic opening positions for paired games.

Matches use a book of balanced openings (`arena/books/balanced.json`, built by make_book.py) when
one exists. The fallback is X's stone at the center plus O's first two stones near it, which
favors X heavily. Every opening is played twice, once with each engine as X.
"""
from __future__ import annotations

import itertools
import json
import random
from pathlib import Path

from six_rules import Cell, Game, cells_within

DEFAULT_BOOK = Path(__file__).resolve().parent / "books" / "balanced.json"


def load_book(path: Path) -> list[list[Cell]]:
    book = json.loads(path.read_text(encoding="utf-8"))
    return [[(q, r) for q, r in entry["moves"]] for entry in book["openings"]]


def openings(count: int, seed: int = 2026, book: Path | None = None) -> list[list[Cell]]:
    if book is not None:
        lines = load_book(book)
        random.Random(seed).shuffle(lines)
        return [list(moves) for moves in itertools.islice(itertools.cycle(lines), count)]
    ring = [c for c in cells_within((0, 0), 2) if c != (0, 0)]
    pairs = list(itertools.combinations(sorted(ring), 2))
    random.Random(seed).shuffle(pairs)
    chosen: list[list[Cell]] = []
    for a, b in itertools.islice(itertools.cycle(pairs), count):
        moves = [(0, 0), a, b]
        probe = Game(8)
        assert all(probe.place(m) is None for m in moves)
        chosen.append(moves)
    return chosen
