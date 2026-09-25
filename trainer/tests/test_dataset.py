import json
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

from dataset import (FUTURE_HORIZONS, SHORT_VALUE_HORIZON, GameRecord, RowDataset, replays_legally,  # noqa: E402
                     short_term_value, squash, surprise_weight, turn_cells, turn_start)
import dataset  # noqa: E402
from planes import CROP, crop_center, crop_index  # noqa: E402

sys.path.insert(0, str(ROOT / "arena"))
from six_rules import player_for_stone  # noqa: E402


# X (0,0); O (0,3),(2,3); X (1,0),(2,0); O (4,3),(6,3); X (3,0),(4,0); O (8,3),(10,3); X (5,0) makes six.
GOOD_MOVES = [[0, 0], [0, 3], [2, 3], [1, 0], [2, 0], [4, 3], [6, 3], [3, 0], [4, 0], [8, 3], [10, 3], [5, 0]]


def sample_game() -> GameRecord:
    # X: (0,0); O: (0,3),(2,3); X: (1,0),(2,0); O: (4,3),(6,3); X: (3,0),(4,0); O: (8,3),(10,3); X: (5,0) wins with its first stone.
    moves = [(0, 0), (0, 3), (2, 3), (1, 0), (2, 0), (4, 3), (6, 3), (3, 0), (4, 0), (8, 3), (10, 3), (5, 0)]
    return GameRecord(moves, 9, "X", "selfplay", first_row=1, scores={3: 250, 7: 999_990})


class Rows(unittest.TestCase):
    def test_turn_structure_helpers(self):
        moves = sample_game().moves
        self.assertEqual(turn_start(0), 0)
        self.assertEqual([turn_start(n) for n in (1, 2, 3, 4)], [1, 1, 3, 3])
        self.assertEqual(turn_cells(moves, 0), [(0, 0)])
        self.assertEqual(turn_cells(moves, 3), [(1, 0), (2, 0)])
        self.assertEqual(turn_cells(moves, 11), [(5, 0)])  # the winning stone ends the game
        self.assertTrue(replays_legally(sample_game()))

    def test_first_and_second_stone_targets(self):
        game = sample_game()
        rows = RowDataset([game], augment=False)
        self.assertEqual(len(rows), 11)
        first = rows[rows.row_of(0, 3)]
        center = crop_center(game.moves[:3])
        self.assertAlmostEqual(first["policy"][crop_index((1, 0), center)].item(), 0.5)
        self.assertAlmostEqual(first["policy"][crop_index((2, 0), center)].item(), 0.5)
        self.assertAlmostEqual(first["policy"].sum().item(), 1.0)
        second = rows[rows.row_of(0, 4)]
        center = crop_center(game.moves[:4])
        self.assertEqual(second["policy"][crop_index((2, 0), center)].item(), 1.0)
        # Both rows belong to X, who won; the opponent's next turn is O's (4,3),(6,3).
        self.assertEqual(first["value"].item(), 0)
        self.assertEqual(rows[rows.row_of(0, 5)]["value"].item(), 1)
        self.assertAlmostEqual(first["opponent"][crop_index((4, 3), crop_center(game.moves[:3]))].item(), 0.5, places=5)
        self.assertTrue(first["score_known"].item())
        self.assertAlmostEqual(first["score"].item(), squash(250), places=5)
        self.assertEqual(rows[rows.row_of(0, 7)]["score"].item(), 1.0)
        self.assertFalse(rows[rows.row_of(0, 5)]["score_known"].item())

    def test_a_second_cell_reachable_only_through_the_first_is_not_a_first_stone_target(self):
        # O's turn: (0,8) is in range of X's origin stone; (0,16) is in range only of (0,8).
        game = GameRecord([(0, 0), (0, 8), (0, 16), (1, 0), (2, 0)], 8, None, "human", first_row=1)
        rows = RowDataset([game], augment=False)
        first = rows[rows.row_of(0, 1)]
        center = crop_center(game.moves[:1])
        self.assertEqual(first["policy"][crop_index((0, 8), center)].item(), 1.0)
        for item in (rows[i] for i in range(len(rows))):
            legal = item["planes"][3].flatten()
            self.assertTrue(torch.all(legal[item["policy"] > 0] == 1.0))

    def test_every_corpus_target_is_legal(self):
        from dataset import load_corpus
        games = load_corpus(ROOT / "data" / "corpus" / "hexo_human_corpus.jsonl")
        rows = RowDataset(games, augment=False)
        checked = 0
        for i in range(0, len(rows), 97):
            item = rows[i]
            legal = item["planes"][3].flatten()
            self.assertTrue(torch.all(legal[item["policy"] > 0] == 1.0), rows.rows[i])
            checked += 1
        self.assertGreater(checked, 1000)

    def test_network_selfplay_rows_use_the_search_policy_and_value(self):
        import json
        import tempfile
        from dataset import load_rl
        record = {
            "radius": 9, "opening": 3, "winner": "O",
            "moves": [[0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [2, -1]],
            # Before stone 3 (X's turn): the search liked (0,1) best; a far cell outside the crop is dropped.
            "rows": [{"at": 3, "value": -0.25, "policy": [[0, 1, 0.7], [-1, 1, 0.25], [0, 30, 0.05]]}],
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "games-0.jsonl"
            path.write_text(json.dumps(record) + "\n{broken\n", encoding="utf-8")
            games = load_rl([path])
        self.assertEqual(len(games), 1)
        rows = RowDataset(games, augment=False)
        self.assertEqual(rows.rows.tolist(), [[0, 3]])
        item = rows[0]
        center = crop_center(games[0].moves[:3])
        self.assertAlmostEqual(item["policy"][crop_index((0, 1), center)].item(), 0.7 / 0.95, places=5)
        self.assertAlmostEqual(item["policy"].sum().item(), 1.0, places=5)
        self.assertEqual(item["value"].item(), 1)  # X to move, O won
        self.assertAlmostEqual(item["score"].item(), -0.25, places=6)
        self.assertTrue(item["score_known"].item())
        augmented = RowDataset(games, augment=True)
        for _ in range(12):
            a = augmented[0]
            legal = a["planes"][3].flatten()
            self.assertTrue(torch.all(legal[a["policy"] > 0] == 1.0))

    def test_future_occupancy_marks_the_stones_placed_within_each_horizon(self):
        game = sample_game()
        rows = RowDataset([game], augment=False)
        item = rows[rows.row_of(0, 3)]  # X to move; stones 3.. are X X O O X X O O X
        center = crop_center(game.moves[:3])
        future = item["future"].view(2 * len(FUTURE_HORIZONS), CROP * CROP)
        short, long = FUTURE_HORIZONS
        for j, cell in enumerate(game.moves[3:], start=3):
            index = crop_index(cell, center)
            own = player_for_stone(j) == "X"
            within_short = j < 3 + short
            within_long = j < 3 + long
            self.assertEqual(future[0 if own else 1, index].item(), 1.0 if within_short else 0.0, (j, cell))
            self.assertEqual(future[2 if own else 3, index].item(), 1.0 if within_long else 0.0, (j, cell))
        self.assertEqual(future.sum().item(), min(short, 9) + min(long, 9))
        self.assertTrue(item["future_known"].all().item())

    def test_future_occupancy_past_the_end_of_an_unfinished_game_is_unknown(self):
        game = sample_game()
        game.winner = None
        game.moves = game.moves[:11]
        rows = RowDataset([game], augment=False)
        early = rows[rows.row_of(0, 1)]
        late = rows[rows.row_of(0, 9)]
        short, long = FUTURE_HORIZONS
        self.assertEqual(early["future_known"].tolist(), [1 + short <= 11, 1 + long <= 11])
        self.assertEqual(late["future_known"].tolist(), [False, False])

    def test_short_term_value_weights_later_search_values_and_the_result(self):
        rows = {3: (0.5, [(0, 1, 1.0)]), 5: (-0.2, [(-1, 1, 1.0)])}
        moves = [(0, 0), (1, -1), (1, 0), (0, 1), (-1, 1), (2, -1), (3, -1)]
        game = GameRecord(moves, 9, "O", "rl", searched=rows)
        lam = 1 - 1 / SHORT_VALUE_HORIZON
        # Row 3 is X's; row 5 is O's (its -0.2 is +0.2 for X); O won, so the result is -1 for X, 4 stones after row 3.
        weights = [(1 - lam), (1 - lam) * lam ** 2, lam ** 4]
        values = [0.5, 0.2, -1.0]
        want = sum(w * v for w, v in zip(weights, values)) / sum(weights)
        self.assertAlmostEqual(short_term_value(game, 3), want, places=6)
        item = RowDataset([game], augment=False)[0]
        self.assertAlmostEqual(item["short_value"].item(), want, places=5)
        self.assertTrue(item["short_value_known"].item())
        # Unfinished games have no result term; other sources have no search values.
        game.winner = None
        self.assertAlmostEqual(short_term_value(game, 3), (weights[0] * 0.5 + weights[1] * 0.2) / (weights[0] + weights[1]), places=6)
        self.assertIsNone(short_term_value(sample_game(), 3))
        self.assertFalse(RowDataset([sample_game()], augment=False)[0]["short_value_known"].item())

    def test_rows_unpickle_compactly_in_data_loader_workers(self):
        import pickle
        import tracemalloc
        from dataset import load_corpus
        games = load_corpus(ROOT / "data" / "corpus" / "hexo_human_corpus.jsonl")[:400]
        rows = RowDataset(games, augment=False)
        data = pickle.dumps(rows)
        tracemalloc.start()
        restored = pickle.loads(data)
        per_row = tracemalloc.get_traced_memory()[0] / len(rows)
        tracemalloc.stop()
        self.assertLess(per_row, 40)  # tuples and lists took ~150 bytes a row
        for i in (0, 97, len(rows) - 1):
            self.assertTrue(torch.equal(restored[i]["policy"], rows[i]["policy"]))
            self.assertTrue(torch.equal(restored[i]["planes"], rows[i]["planes"]))
        game = sample_game()
        scored = RowDataset([game], augment=False)
        self.assertAlmostEqual(scored[scored.row_of(0, 3)]["score"].item(), squash(250), places=5)

    def test_surprising_rows_weigh_more_within_their_game(self):
        import json
        import tempfile
        from dataset import load_rl
        moves = [[0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [2, -1], [3, -1]]
        record = {
            "radius": 9, "opening": 1, "winner": "O", "moves": moves,
            "rows": [{"at": 1, "value": 0.1, "kl": 0.1, "policy": [[1, -1, 1.0]]},
                     {"at": 3, "value": 0.2, "kl": 0.3, "policy": [[0, 1, 1.0]]}],
        }
        plain = dict(record, rows=[{k: v for k, v in r.items() if k != "kl"} for r in record["rows"]])
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "games-0.jsonl"
            path.write_text(json.dumps(record) + "\n" + json.dumps(plain) + "\n", encoding="utf-8")
            games = load_rl([path])
        self.assertAlmostEqual(surprise_weight(games[0], 1), 0.75)
        self.assertAlmostEqual(surprise_weight(games[0], 3), 1.25)
        self.assertEqual(surprise_weight(games[1], 3), 1.0)  # rows written before surprise was recorded
        games[0].weight = 2.0
        rows = RowDataset(games, augment=False)
        self.assertAlmostEqual(rows[rows.row_of(0, 3)]["weight"].item(), 2.5)
        self.assertAlmostEqual(rows[rows.row_of(1, 3)]["weight"].item(), 1.0)

    def test_augmented_rows_keep_targets_on_legal_cells(self):
        rows = RowDataset([sample_game()], augment=True)
        for _ in range(5):
            for i in range(len(rows)):
                item = rows[i]
                legal = item["planes"][3].flatten()
                self.assertTrue(torch.all(legal[item["policy"] > 0] == 1.0))
                self.assertEqual(item["planes"].shape, (8, CROP, CROP))
                # Future stones land only on cells empty at the row.
                empty = (item["planes"][1] + item["planes"][2]).flatten() < 0.5
                self.assertTrue(torch.all(item["future"].view(-1, CROP * CROP)[:, ~empty] == 0))


if __name__ == "__main__":
    unittest.main()


class ValidationCache(unittest.TestCase):
    """Files already validated on an earlier run are not replayed again."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.folder = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def write(self, name, games):
        path = self.folder / name
        path.write_text("\n".join(json.dumps(g) for g in games) + "\n", encoding="utf-8")
        return path

    @staticmethod
    def game(moves, winner):
        return {"radius": 8, "opening": 1, "moves": moves, "winner": winner,
                "rows": [{"at": 1, "value": 0.0, "kl": 0.0, "policy": [[1, 0, 1.0]]}]}

    def test_a_sound_file_is_replayed_once_and_taken_on_trust_after_that(self):
        path = self.write("games-0.jsonl", [self.game(GOOD_MOVES, "X")])
        [first] = dataset.load_rl([path])
        self.assertFalse(first.checked)  # nothing has vouched for the file yet
        self.assertEqual(first.path, path)
        dataset.remember_validated([path])
        [again] = dataset.load_rl([path])
        self.assertTrue(again.checked)  # later generations skip replaying it

    def test_a_file_that_changed_is_replayed_again(self):
        path = self.write("games-0.jsonl", [self.game(GOOD_MOVES, "X")])
        dataset.remember_validated([path])
        self.assertTrue(dataset.load_rl([path])[0].checked)
        self.write("games-0.jsonl", [self.game(GOOD_MOVES, "X"), self.game(GOOD_MOVES, "O")])
        self.assertFalse(any(g.checked for g in dataset.load_rl([path])))
