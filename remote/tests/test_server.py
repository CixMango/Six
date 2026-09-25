import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

MOVES = [[0, 0], [-3, 3], [-3, 4], [1, 0], [2, 0], [-3, 5], [-3, 6], [3, 0], [4, 0], [5, -5], [6, -6], [5, 0]]


def record(**changes) -> dict:
    game = {"radius": 8, "opening": 1, "moves": MOVES, "winner": "X",
            "rows": [{"at": 3, "value": 0.25, "kl": 0.1, "policy": [[1, 0, 0.75], [0, 1, 0.25]]}]}
    game.update(changes)
    return game


class Server(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.runs, self.data = base / "runs", base / "data"
        (self.runs / "gen-0010").mkdir(parents=True)
        (self.runs / "gen-0010" / "net.onnx").write_bytes(b"network ten")
        (self.runs / "state.json").write_text(json.dumps({"generation": 10}), encoding="utf-8")
        (self.runs / "config.json").write_text(json.dumps({"gamesPerGeneration": 3, "windowGenerations": 4, "threads": 96,
                                                           "full": 200, "remote": {"gamesPerGeneration": 2}}),
                                               encoding="utf-8")
        engine = base / "sixselfplay.exe"
        engine.write_bytes(b"engine")
        os.environ.update(SIX_RL_RUNS=str(self.runs), SIX_RL_DATA=str(self.data), SIX_SELFPLAY=str(engine))
        sys.path.insert(0, str(ROOT / "remote"))
        sys.modules.pop("server", None)
        import server
        self.server = server
        self.http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=self.http.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.http.server_address[1]}"

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.tmp.cleanup()

    def call(self, path, body=None, token=None):
        request = urllib.request.Request(self.url + path, data=body, method="POST" if body is not None else "GET",
                                         headers={"X-HexBot-Token": self.server.token() if token is None else token})
        with urllib.request.urlopen(request) as response:
            data = response.read()
        return json.loads(data) if data.startswith(b"{") else data

    def upload(self, games, generation=10):
        body = "\n".join(g if isinstance(g, str) else json.dumps(g) for g in games).encode()
        return self.call(f"/games?generation={generation}&helper=friend", body)

    def test_a_legal_game_passes_and_broken_ones_do_not(self):
        check = self.server.check_game
        self.assertIsNone(check(record()))
        self.assertIsNotNone(check(record(winner="O")))
        self.assertIsNotNone(check(record(moves=MOVES[:-1])))  # nobody has won yet
        self.assertIsNotNone(check(record(moves=[[0, 0], [0, 0]], winner=None)))
        self.assertIsNotNone(check(record(rows=[{"at": 99, "value": 0.0, "policy": [[0, 1, 1.0]]}])))
        self.assertIsNotNone(check(record(rows=[{"at": 1, "value": float("nan"), "policy": [[0, 1, 1.0]]}])))
        self.assertIsNotNone(check(record(rows=[{"at": 1, "value": 0.0, "policy": [[0, 1]]}])))
        self.assertIsNone(check(record(rows=[])))
        self.assertIsNotNone(check(record(rows=None)))
        self.assertIsNotNone(check({"radius": 8}))

    def test_status_names_the_current_network_and_settings(self):
        status = self.call("/status")
        self.assertEqual(status["generation"], 10)
        self.assertTrue(status["ready"])
        self.assertTrue(status["wanted"])
        self.assertEqual(status["selfplay"], {"threads": 96, "full": 200})
        self.assertEqual(len(status["engine"]), 64)
        self.assertEqual(self.call("/net/10"), b"network ten")

    def test_a_wrong_token_is_refused(self):
        with self.assertRaises(urllib.error.HTTPError) as caught:
            self.call("/status", token="guess")
        self.assertEqual(caught.exception.code, 403)
        with self.assertRaises(urllib.error.HTTPError):
            self.call("/games?generation=10&helper=friend", b"{}", token="")
        self.assertFalse(self.data.exists())

    def test_good_games_are_kept_where_training_reads_them(self):
        result = self.upload([record(), "not json", record(winner=None)])
        self.assertEqual((result["games"], result["rejected"]), (1, 2))
        files = list((self.data / "gen-0010").glob("games-*.jsonl"))
        self.assertEqual(len(files), 1)
        sys.path.insert(0, str(ROOT / "trainer"))
        from dataset import load_rl
        [loaded] = load_rl(files)
        self.assertEqual(len(loaded.moves), len(MOVES))
        log = [json.loads(x) for x in (self.runs / "remote.jsonl").read_text(encoding="utf-8").splitlines()]
        self.assertEqual(log[-1]["games"], 1)

    def test_games_too_old_for_any_training_window_are_turned_away(self):
        self.assertTrue(self.upload([record()], generation=8)["games"] == 1)
        self.assertTrue(self.upload([record()], generation=7).get("stale"))
        self.assertTrue(self.upload([record()], generation=11).get("stale"))

    def test_a_generation_stops_taking_games_once_it_has_enough(self):
        self.upload([record()] * 5)  # the loop's 3 plus the helpers' 2
        self.assertTrue(self.upload([record()]).get("full"))
        self.assertFalse(self.call("/status")["wanted"])


if __name__ == "__main__":
    unittest.main()
