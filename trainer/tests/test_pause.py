import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

import pause  # noqa: E402


class BotGames(unittest.TestCase):
    def test_a_recent_bot_game_mark_pauses_and_an_old_one_does_not(self):
        with tempfile.TemporaryDirectory() as tmp:
            mark = Path(tmp) / "six-bot-game"
            original = pause.BOT_GAME_FILE
            pause.BOT_GAME_FILE = mark
            try:
                self.assertFalse(pause.six_bot_game())
                mark.write_text("now", encoding="utf-8")
                self.assertTrue(pause.six_bot_game())
                old = time.time() - pause.BOT_GAME_SECONDS - 5
                os.utime(mark, (old, old))
                self.assertFalse(pause.six_bot_game())
            finally:
                pause.BOT_GAME_FILE = original


if __name__ == "__main__":
    unittest.main()
