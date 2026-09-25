"""hexo_bot2 (sub-surface/hexo-theory, no license; local evaluation only) behind the Six engine protocol.

Usage: py -3.12 hexo_bot2_driver.py --time 0.7    seconds per turn (its default budget)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "rivals" / "hexo_bot2"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import hexo_bot2  # noqa: E402
import sixdriver  # noqa: E402


class HexoBot2:
    def __init__(self, seconds: float):
        self.seconds = seconds
        self.name = f"hexo_bot2 {seconds}s"

    def new_game(self) -> None:
        hexo_bot2._pending.clear()

    def turn(self, game) -> list[tuple[int, int]]:
        stones = {cell: (1 if player == "X" else 2) for cell, player in game.cells.items()}
        side = 1 if game.current == "X" else 2
        if not game.moves:
            return [hexo_bot2.choose_move(stones, side, 0, 1, self.seconds)]
        per_turn = 2
        placed = 0 if game.stones_left == 2 else 1
        cells = []
        while placed < per_turn:
            cell = hexo_bot2.choose_move(dict(stones), side, placed, per_turn, self.seconds)
            cells.append(cell)
            stones[cell] = side
            placed += 1
        return cells


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--time", type=float, default=0.7)
    args = parser.parse_args()
    sixdriver.run(HexoBot2(args.time), version="efa80128")


if __name__ == "__main__":
    main()
