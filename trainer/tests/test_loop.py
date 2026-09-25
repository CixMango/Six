import json
import os
import sys
import tempfile
import threading
import time
import unittest
import unittest.mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))


class Loop(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        os.environ["SIX_RL_RUNS"] = str(base / "runs")
        os.environ["SIX_RL_DATA"] = str(base / "data")
        import importlib
        import loop
        self.loop = importlib.reload(loop)
        # The real check reads the PAUSE file and fullscreen windows; tests that need a pause fake it.
        self.loop.wait_while_paused = lambda *a, **k: None
        (base / "runs" / "gen-0000").mkdir(parents=True)
        for name in ("net.pt", "net.onnx"):
            (base / "runs" / "gen-0000" / name).write_text("generation 0", encoding="utf-8")
        self.events = []
        self.evaluating = threading.Event()
        self.verdicts = {}

    def tearDown(self):
        os.environ.pop("SIX_RL_RUNS", None)
        os.environ.pop("SIX_RL_DATA", None)
        self.tmp.cleanup()

    def fake(self):
        loop = self.loop

        def play(g, config):
            time.sleep(0.05)  # the evaluation thread has started by now
            self.events.append(("play", g, self.evaluating.is_set()))
            return {"games": 10, "rows": 100}

        def train(g, config, rows):
            for name in ("net.pt", "net.onnx"):
                loop.gen_dir(g + 1).mkdir(parents=True, exist_ok=True)
                (loop.gen_dir(g + 1) / name).write_text(f"generation {g + 1}", encoding="utf-8")
            self.events.append(("train", g))
            return {"steps": 1}

        def evaluate(g, config):
            self.evaluating.set()
            time.sleep(0.2)
            self.evaluating.clear()
            self.events.append(("evaluated", g + 1))
            elo = self.verdicts.get(g + 1, 50.0)
            return {"vsPrevious": {"wins": 1, "losses": 1, "elo": elo, "eloLow": elo - 40, "eloHigh": elo + 40}}

        loop.play_generation = play
        loop.train_generation = train
        loop.evaluate_generation = evaluate
        loop.wait_while_paused = lambda *a, **k: None
        loop.load_config = lambda: dict(loop.DEFAULTS)

    def run_loop(self, generations):
        sys.argv = ["loop.py", "--generations", str(generations)]
        self.assertEqual(self.loop.main(), 0)
        return json.loads((self.loop.RUNS / "state.json").read_text(encoding="utf-8"))

    def test_the_new_network_is_measured_while_it_already_plays(self):
        self.fake()
        state = self.run_loop(3)
        self.assertEqual(state["generation"], 3)
        # Generation 1 is evaluated during generation 1's self-play, and recorded once that finishes.
        self.assertEqual(self.events[:4], [("play", 0, False), ("train", 0), ("play", 1, True), ("evaluated", 1)])
        self.assertEqual([h["generation"] for h in state["history"]], [1, 2])
        self.assertEqual(state["pending"]["generation"], 3)
        self.assertEqual(state["history"][0]["selfplay"], {"games": 10, "rows": 100})

    def test_a_weaker_generation_is_replaced_by_its_predecessor_after_its_self_play(self):
        self.fake()
        self.verdicts[1] = -300.0
        state = self.run_loop(2)
        gen1 = self.loop.gen_dir(1)
        self.assertEqual((gen1 / "net.pt").read_text(encoding="utf-8"), "generation 0")
        self.assertEqual((gen1 / "rejected-net.pt").read_text(encoding="utf-8"), "generation 1")
        self.assertTrue(state["history"][0]["evaluation"]["rolledBack"])

    def test_a_restart_evaluates_the_pending_generation_again(self):
        self.fake()
        self.run_loop(1)  # trains generation 1, stops before measuring it
        self.events.clear()
        state = self.run_loop(1)
        self.assertIn(("evaluated", 1), self.events)
        self.assertEqual([h["generation"] for h in state["history"]], [1])

    def test_the_hexbot_match_never_holds_up_training_and_joins_the_record_later(self):
        loop = self.loop
        release = threading.Event()
        loop.evaluate_generation = lambda g, config: {"vsPrevious": {"wins": 1, "losses": 0, "elo": 10.0, "eloLow": -5.0, "eloHigh": 25.0}}

        def hexbot(generation, config):
            release.wait(5)
            loop.gen_dir(generation).mkdir(parents=True, exist_ok=True)
            (loop.gen_dir(generation) / "eval-hexbot.json").write_text(json.dumps({"vsHexBot": {"elo": 300.0}}), encoding="utf-8")

        loop.hexbot_eval = hexbot
        config = dict(loop.DEFAULTS, hexbotEvalEvery=5, anchorEvery=0)
        evaluation = loop.BackgroundEvaluation(4, config)  # generation 5: due for HexBot
        self.assertEqual(evaluation.wait()["vsPrevious"]["elo"], 10.0)  # returns while the HexBot match still runs
        self.assertTrue(evaluation.thread.is_alive())
        state = {"generation": 6, "history": [{"generation": 5, "evaluation": evaluation.result}]}
        self.assertFalse(loop.attach_extra_results(state))
        release.set()
        evaluation.thread.join(5)
        self.assertTrue(loop.attach_extra_results(state))
        self.assertEqual(state["history"][0]["evaluation"]["vsHexBot"]["elo"], 300.0)
        self.assertEqual(state["history"][0]["evaluation"]["vsPrevious"]["elo"], 10.0)

    def test_a_generation_measured_before_a_restart_is_not_measured_again(self):
        loop = self.loop
        loop.gen_dir(3).mkdir(parents=True, exist_ok=True)
        saved = {"vsPrevious": {"wins": 12, "losses": 8, "elo": 70.0, "eloLow": -20.0, "eloHigh": 160.0}}
        (loop.gen_dir(3) / "eval.json").write_text(json.dumps(saved), encoding="utf-8")
        loop.net_match = lambda *a, **k: self.fail("the match was played again")
        self.assertEqual(loop.evaluate_generation(2, dict(loop.DEFAULTS)), saved)

    def test_an_incomplete_saved_result_is_measured_again(self):
        loop = self.loop
        loop.gen_dir(3).mkdir(parents=True, exist_ok=True)
        (loop.gen_dir(3) / "eval.json").write_text(json.dumps({"vsPrevious": {"wins": None, "elo": None}}), encoding="utf-8")
        played = []
        loop.warm_up = lambda net: None
        loop.use_tensorrt = lambda config: False
        loop.net_match = lambda *a, **k: played.append(a) or {"wins": 1, "losses": 1, "elo": 0.0, "eloLow": -9.0, "eloHigh": 9.0}
        self.assertEqual(loop.evaluate_generation(2, dict(loop.DEFAULTS))["vsPrevious"]["eloHigh"], 9.0)
        self.assertEqual(len(played), 1)

    def test_a_long_pause_stops_the_child_to_free_the_gpu(self):
        loop = self.loop
        loop.POLL_SECONDS = 0.05
        paused = {"on": True}
        loop.pause_reason = lambda: "a game" if paused["on"] else None
        loop.suspend = lambda pid: True
        loop.resume = lambda pid: True
        began = time.monotonic()
        code = loop.run_pausable([sys.executable, "-c", "import time; time.sleep(30)"], "child", release_after=0.3)
        self.assertEqual(code, loop.PAUSED_EXIT)
        self.assertLess(time.monotonic() - began, 10)
        # A short pause only suspends and resumes.
        paused["on"] = False
        self.assertEqual(loop.run_pausable([sys.executable, "-c", "pass"], "child", release_after=0.3), 0)

    def grow_fakes(self, elo_low):
        loop = self.loop
        calls = []

        def run(command, prefix, *a, **k):
            calls.append(command)
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            (out / "best.pt").write_text("big", encoding="utf-8")
            Path(command[command.index("--export") + 1]).write_text("big onnx", encoding="utf-8")
            return 0

        loop.run_pausable = run
        loop.warm_up = lambda net: None
        self.seeded = []
        loop.seed_grown_network = lambda source, target, spec: self.seeded.append((source, target)) or 0.0
        loop.net_match = lambda a, b, ms, pairs, name, concurrency=2: {
            "wins": 20, "losses": 10, "elo": elo_low + 80, "eloLow": elo_low, "eloHigh": elo_low + 160}
        for g in (1, 2):
            loop.gen_dir(g).mkdir(parents=True, exist_ok=True)
            for name in ("net.pt", "net.onnx"):
                (loop.gen_dir(g) / name).write_text(f"generation {g}", encoding="utf-8")
        return calls

    def test_a_larger_network_that_measures_stronger_takes_the_generations_place(self):
        loop = self.loop
        calls = self.grow_fakes(elo_low=25.0)
        config = dict(loop.DEFAULTS, grow={"blocks": 15, "channels": 128, "epochs": 5, "batch": 256, "lr": 0.001,
                                           "movetimeMs": 1000, "pairs": 30})
        grown = loop.grow_network(1, config)
        self.assertTrue(grown["promoted"])
        self.assertEqual(len(self.seeded), 1)  # grown from the generation's own network, not trained from scratch
        self.assertEqual(self.seeded[0][0], loop.gen_dir(2) / "net.pt")
        self.assertIn("--init", calls[0])
        self.assertNotIn("--blocks", calls[0])
        self.assertEqual((loop.gen_dir(2) / "net.pt").read_text(encoding="utf-8"), "big")
        self.assertEqual((loop.gen_dir(2) / "small-net.pt").read_text(encoding="utf-8"), "generation 2")
        self.assertIsNone(loop.grow_network(2, config))  # done once

    def test_a_larger_network_that_isnt_stronger_yet_is_tried_again_later(self):
        loop = self.loop
        config = dict(loop.DEFAULTS, grow={"blocks": 15, "channels": 128, "epochs": 5, "batch": 256, "lr": 0.001,
                                           "movetimeMs": 1000, "pairs": 30, "retryEvery": 3})
        calls = self.grow_fakes(elo_low=-40.0)
        grown = loop.grow_network(1, config)
        self.assertFalse(grown["promoted"])
        self.assertEqual((loop.gen_dir(2) / "net.pt").read_text(encoding="utf-8"), "generation 2")
        self.assertIsNone(loop.grow_network(3, config))  # generation 4 is too soon
        self.assertIsNotNone(loop.grow_network(4, config))  # generation 5: try again
        self.assertEqual(len(self.seeded), 1)  # grown once, then trained on
        self.assertIn("--init", calls[0])
        self.assertIn("--init", calls[-1])

    def test_a_match_is_asked_to_wait_between_games_instead_of_being_frozen_mid_turn(self):
        loop = self.loop
        loop.POLL_SECONDS = 0.01
        seen = []
        paused = threading.Event()
        paused.set()
        loop.pause_reason = lambda: "a HexBot game in Six" if paused.is_set() else None
        loop.suspend = lambda pid: seen.append("suspended") or True

        class Fake:
            def __init__(self):
                self.stdout = iter(())
                self.calls = 0

            def poll(self):
                self.calls += 1
                if self.calls == 3:
                    seen.append(("waiting", loop.MATCH_PAUSE_FILE.exists()))
                    paused.clear()
                if self.calls > 6:
                    seen.append(("playing on", loop.MATCH_PAUSE_FILE.exists()))
                    return 0
                return None

            @property
            def returncode(self):
                return 0

        loop.RUNS.mkdir(parents=True, exist_ok=True)
        with unittest.mock.patch.object(loop.subprocess, "Popen", lambda *a, **k: Fake()):
            self.assertEqual(loop.run_pausable(["sixmatch"], "eval 3 vs 2", suspendable=False), 0)
        self.assertIn(("waiting", True), seen)
        self.assertIn(("playing on", False), seen)
        self.assertNotIn("suspended", seen)  # a timed game is never frozen mid-turn
        self.assertFalse(loop.MATCH_PAUSE_FILE.exists())

    def test_training_keeps_the_network_it_produced_and_not_its_spare_copies(self):
        loop = self.loop

        def run(command, prefix, *a, **k):
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            for name in ("best.pt", "last.pt"):
                (out / name).write_text("checkpoint", encoding="utf-8")
            (out / "metrics.jsonl").write_text(json.dumps({"loss": 1.25}) + "\n", encoding="utf-8")
            Path(command[command.index("--export") + 1]).write_text("onnx", encoding="utf-8")
            return 0

        loop.run_pausable = run
        trained = loop.train_generation(0, dict(loop.DEFAULTS), rows=1000)
        self.assertEqual(trained["validation"], {"loss": 1.25})
        self.assertEqual((loop.gen_dir(1) / "net.pt").read_text(encoding="utf-8"), "checkpoint")
        self.assertFalse((loop.gen_dir(1) / "train" / "best.pt").exists())
        self.assertFalse((loop.gen_dir(1) / "train" / "last.pt").exists())
        self.assertTrue((loop.gen_dir(1) / "train" / "metrics.jsonl").exists())

    def test_a_long_pause_stops_what_the_child_started_too(self):
        # The venv's python.exe is a launcher that runs the real interpreter as its child, and train.py starts data
        # workers; stopping only the direct child would leave those running.
        import subprocess
        loop = self.loop
        loop.pause_reason = lambda: "paused from the dashboard"
        loop.suspend = lambda pid: True
        loop.resume = lambda pid: True
        marker = Path(self.tmp.name) / "grandchild.pid"
        script = ("import subprocess, sys, time; "
                  "p = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)']); "
                  f"open(r'{marker}', 'w').write(str(p.pid)); time.sleep(60)")
        code = loop.run_pausable([sys.executable, "-c", script], "child", release_after=1.5)
        self.assertEqual(code, loop.PAUSED_EXIT)
        grandchild = int(marker.read_text())
        time.sleep(0.5)
        listed = subprocess.run(["tasklist", "/fi", f"PID eq {grandchild}", "/nh"], capture_output=True, text=True).stdout
        self.assertNotIn(str(grandchild), listed)

    def test_training_stopped_by_a_long_pause_frees_the_gpu_and_trains_again_afterwards(self):
        loop = self.loop
        attempts = []

        def run(command, prefix, *a, **k):
            attempts.append(k)
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            if len(attempts) == 1:
                # Stopped part-way by a pause: a half-trained checkpoint is left behind.
                (out / "best.pt").write_text("half-trained", encoding="utf-8")
                (out / "metrics.jsonl").write_text(json.dumps({"loss": 9.0}) + "\n", encoding="utf-8")
                return loop.PAUSED_EXIT
            self.assertFalse((out / "best.pt").exists())  # the second run starts clean
            (out / "best.pt").write_text("trained", encoding="utf-8")
            (out / "metrics.jsonl").write_text(json.dumps({"loss": 1.25}) + "\n", encoding="utf-8")
            Path(command[command.index("--export") + 1]).write_text("onnx", encoding="utf-8")
            return 0

        loop.run_pausable = run
        waited = []
        loop.wait_while_paused = lambda *a, **k: waited.append(True)
        trained = loop.train_generation(0, dict(loop.DEFAULTS), rows=1000)
        self.assertEqual(len(attempts), 2)
        # Training may never sit suspended holding the GPU: a long pause stops it (see run_pausable).
        self.assertTrue(all(k.get("release_after") is not None for k in attempts))
        self.assertGreaterEqual(len(waited), 1)
        self.assertEqual((loop.gen_dir(1) / "net.pt").read_text(encoding="utf-8"), "trained")
        self.assertEqual(trained["validation"], {"loss": 1.25})

    def test_a_helper_pcs_extra_games_widen_training_instead_of_lengthening_it(self):
        loop = self.loop
        steps = []

        def run(command, prefix, *a, **k):
            steps.append(int(command[command.index("--steps") + 1]))
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            (out / "best.pt").write_text("checkpoint", encoding="utf-8")
            return 0

        loop.run_pausable = run
        config = dict(loop.DEFAULTS, trainPasses=16.0, batch=256, maxTrainSteps=2100)
        loop.train_generation(0, config, rows=33000)  # this PC's games alone: 16 passes would be 2063 steps
        loop.train_generation(0, config, rows=66000)  # with a helper's games too: capped, not doubled
        loop.train_generation(0, dict(config, maxTrainSteps=None), rows=66000)
        self.assertEqual(steps, [2063, 2100, 4125])

    def test_growing_in_place_swaps_the_shape_the_loop_trains_from_and_costs_no_match(self):
        loop = self.loop
        played = []
        loop.net_match = lambda *a, **k: played.append(a) or {}
        loop.warm_up = lambda net: None
        self.seeded = []

        def seed(source, target, spec):
            self.seeded.append((source, target))
            Path(target).write_text("grown", encoding="utf-8")
            return 0.0

        loop.seed_grown_network = seed
        loop.export_network = lambda pt, onnx, config: Path(onnx).write_text("grown onnx", encoding="utf-8")
        loop.gen_dir(2).mkdir(parents=True, exist_ok=True)
        for name in ("net.pt", "net.onnx"):
            (loop.gen_dir(2) / name).write_text("generation 2", encoding="utf-8")
        config = dict(loop.DEFAULTS, grow={"sizes": [{"blocks": 10, "channels": 128}], "inPlace": True})

        grown = loop.grow_network(1, config)
        self.assertEqual((grown["network"], grown["promoted"]), ("b10c128", True))
        self.assertEqual(played, [])  # a network that plays exactly the same has nothing to prove in a match
        self.assertEqual((loop.gen_dir(2) / "net.pt").read_text(encoding="utf-8"), "grown")
        self.assertEqual((loop.gen_dir(2) / "net.onnx").read_text(encoding="utf-8"), "grown onnx")
        self.assertEqual((loop.gen_dir(2) / "small-net.pt").read_text(encoding="utf-8"), "generation 2")
        self.assertIsNone(loop.grow_network(2, config))  # grown once, then left to learn at the new size

    def test_the_next_size_up_is_tried_once_the_promoted_one_has_had_time_to_learn(self):
        loop = self.loop
        self.grow_fakes(elo_low=25.0)
        config = dict(loop.DEFAULTS, grow={"sizes": [{"blocks": 10, "channels": 128}, {"blocks": 15, "channels": 128}],
                                           "epochs": 5, "batch": 256, "lr": 0.001, "movetimeMs": 1000, "pairs": 30,
                                           "nextAfter": 4})
        first = loop.grow_network(1, config)
        self.assertEqual((first["network"], first["promoted"]), ("b10c128", True))
        for g in (2, 3, 4):  # the promoted size trains at its new capacity first
            self.assertIsNone(loop.grow_network(g, config))
        for g in (2, 3, 4, 5):
            loop.gen_dir(g + 1).mkdir(parents=True, exist_ok=True)
            for name in ("net.pt", "net.onnx"):
                (loop.gen_dir(g + 1) / name).write_text(f"generation {g + 1}", encoding="utf-8")
        second = loop.grow_network(5, config)
        self.assertEqual((second["network"], second["promoted"]), ("b15c128", True))
        self.assertEqual(self.seeded[-1][0], loop.gen_dir(6) / "net.pt")  # from the promoted b10c128 network

    def test_a_size_that_is_not_stronger_yet_holds_the_ladder_where_it_is(self):
        loop = self.loop
        self.grow_fakes(elo_low=-40.0)
        config = dict(loop.DEFAULTS, grow={"sizes": [{"blocks": 10, "channels": 128}, {"blocks": 15, "channels": 128}],
                                           "epochs": 5, "batch": 256, "lr": 0.001, "movetimeMs": 1000, "pairs": 30,
                                           "retryEvery": 3})
        self.assertFalse(loop.grow_network(1, config)["promoted"])
        self.assertIsNone(loop.grow_network(2, config))  # the larger size is not skipped ahead to
        again = loop.grow_network(4, config)
        self.assertEqual(again["network"], "b10c128")

    def test_a_grown_generation_is_not_rolled_back_by_its_short_match(self):
        self.fake()
        loop = self.loop
        self.verdicts[1] = -300.0
        loop.grow_network = lambda g, config: {"network": "b15c128", "promoted": True} if g == 0 else None
        state = self.run_loop(2)
        self.assertNotIn("rolledBack", state["history"][0]["evaluation"])
        self.assertEqual(state["history"][0]["grown"]["network"], "b15c128")

    def test_every_so_often_a_generation_is_measured_against_an_older_one(self):
        loop = self.loop
        played = []
        loop.net_match = lambda a, b, ms, pairs, name, concurrency=2: played.append((name, pairs)) or {
            "wins": 30, "losses": 10, "elo": 150.0, "eloLow": 60.0, "eloHigh": 280.0}
        loop.gen_dir(10).mkdir(parents=True, exist_ok=True)
        loop.anchor_eval(10, 5, dict(loop.DEFAULTS, anchorPairs=24))
        self.assertEqual(played, [("eval 10 vs 5", 24)])
        state = {"history": [{"generation": 10, "evaluation": {"vsPrevious": {"elo": -20.0}}}]}
        self.assertTrue(loop.attach_extra_results(state))
        bout = state["history"][0]["evaluation"]["vsAnchor"]
        self.assertEqual((bout["against"], bout["elo"]), (5, 150.0))

    def test_a_match_reads_its_own_summary_even_while_another_one_finishes(self):
        loop = self.loop
        arena = loop.ROOT / "data" / "arena"

        def run(command, prefix, *a, **k):
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            (out / "summary.json").write_text(json.dumps({"name": prefix, "elo": 42.0}), encoding="utf-8")
            # Another match finishes while this one runs.
            other = arena / "20260915-000000-some-other-match"
            other.mkdir(parents=True, exist_ok=True)
            (other / "summary.json").write_text(json.dumps({"name": "other", "elo": -999.0}), encoding="utf-8")
            return 0

        loop.run_pausable = run
        loop.wait_while_paused = lambda *a, **k: None
        try:
            summary = loop.run_match(["py", "match.py"], "eval 10 vs 5")
            self.assertEqual(summary, {"name": "eval 10 vs 5", "elo": 42.0})
        finally:
            import shutil
            shutil.rmtree(arena / "20260915-000000-some-other-match", ignore_errors=True)
            for run_dir in arena.glob("*eval-10-vs-5"):
                shutil.rmtree(run_dir, ignore_errors=True)

    def test_a_long_pause_stops_a_match_too_so_it_gives_its_memory_back(self):
        loop = self.loop
        loop.POLL_SECONDS = 0.05
        loop.pause_reason = lambda: "a game"
        loop.RUNS.mkdir(parents=True, exist_ok=True)
        code = loop.run_pausable([sys.executable, "-c", "import time; time.sleep(30)"], "eval 3 vs 2",
                                 suspendable=False, release_after=0.3)
        self.assertEqual(code, loop.PAUSED_EXIT)
        self.assertFalse(loop.MATCH_PAUSE_FILE.exists())

    def test_a_match_stopped_by_a_long_pause_is_played_again_afterwards(self):
        loop = self.loop
        arena = loop.ROOT / "data" / "arena"
        attempts = []

        def run(command, prefix, *a, **k):
            attempts.append(command)
            out = Path(command[command.index("--out") + 1])
            out.mkdir(parents=True, exist_ok=True)
            if len(attempts) == 1:
                return loop.PAUSED_EXIT  # stopped by a pause
            (out / "summary.json").write_text(json.dumps({"elo": 12.0}), encoding="utf-8")
            return 0

        loop.run_pausable = run
        waited = []
        loop.wait_while_paused = lambda *a, **k: waited.append(True)
        try:
            self.assertEqual(loop.run_match(["py", "match.py"], "eval 4 vs 3"), {"elo": 12.0})
            self.assertEqual(len(attempts), 2)
            self.assertEqual(len(waited), 2)  # it waits for the pause to end before playing again
        finally:
            import shutil
            for run_dir in arena.glob("*eval-4-vs-3"):
                shutil.rmtree(run_dir, ignore_errors=True)

    def test_a_match_that_keeps_being_paused_gives_up_instead_of_never_ending(self):
        loop = self.loop
        arena = loop.ROOT / "data" / "arena"
        attempts = []
        loop.run_pausable = lambda command, prefix, *a, **k: attempts.append(command) or loop.PAUSED_EXIT
        loop.wait_while_paused = lambda *a, **k: None
        try:
            with self.assertRaises(RuntimeError):
                loop.run_match(["py", "match.py"], "eval 5 vs 4")
            self.assertEqual(len(attempts), loop.MATCH_ATTEMPTS)
        finally:
            import shutil
            for run_dir in arena.glob("*eval-5-vs-4"):
                shutil.rmtree(run_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
