"""SealBot (Ramora0, no license; local evaluation only) behind the Six engine protocol.

Usage: py -3.12 sealbot_driver.py --depth 4      fixed depth (reproducible)
       py -3.12 sealbot_driver.py --time 1.0     seconds per turn
Needs a local build in rivals/sealbot.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEALBOT = ROOT / "rivals" / "sealbot"
sys.path.insert(0, str(SEALBOT))
sys.path.insert(0, str(SEALBOT / "current"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import game as sealgame  # noqa: E402  SealBot's own game module, which its extension imports by name
import minimax_cpp  # noqa: E402
import sixdriver  # noqa: E402


class SealBot:
    def __init__(self, depth: int | None, seconds: float | None):
        self.depth = depth
        self.seconds = seconds
        self.name = f"SealBot d{depth}" if depth else f"SealBot {seconds}s"
        self.bot = None

    def new_game(self) -> None:
        # A fresh instance per game: SealBot's transposition table persists otherwise.
        self.bot = minimax_cpp.MinimaxBot(self.seconds if self.seconds else 1e6)
        if self.depth:
            self.bot.max_depth = self.depth

    def turn(self, game) -> list[tuple[int, int]]:
        if self.bot is None:
            self.new_game()
        # SealBot's board is a fixed 140x140 array: translate the stones around the origin.
        if game.moves:
            qs = [q for q, _ in game.moves]
            rs = [r for _, r in game.moves]
            cq = (min(qs) + max(qs)) // 2
            cr = (min(rs) + max(rs)) // 2
        else:
            cq = cr = 0
        g = sealgame.HexGame()
        for q, r in game.moves:
            g.make_move(q - cq, r - cr)
        moves = self.bot.get_move(g)
        return [(q + cq, r + cr) for q, r in moves]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--depth", type=int)
    parser.add_argument("--time", type=float)
    args = parser.parse_args()
    if not args.depth and not args.time:
        args.depth = 4
    sixdriver.run(SealBot(args.depth, args.time), version="c94749c+mantis-patch")


if __name__ == "__main__":
    main()
