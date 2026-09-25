"""Shrimp (Cmiller132/hexo-bot, MIT; main_7 epoch 18) behind the Six engine protocol.

Usage: rivals/shrimp/.venv/Scripts/python.exe shrimp_driver.py --visits 512 [--threads 4]
Needs a local build in rivals/shrimp: the maturin-built crates in its venv, the weights and
the shrimp_main_7 search profile (checksums pinned below).

Searches the way Shrimp's showcase server does: one Gumbel search per stone with a fixed visit
budget, reusing the tree for the second stone. Shrimp's rules and axial coordinates match ours
at radius 8.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHRIMP = ROOT / "rivals" / "shrimp"
WEIGHTS = SHRIMP / "models" / "shrimp_main7_infer.pt"
PROFILE = SHRIMP / "hexo-bot" / "apps" / "showcase" / "profiles" / "shrimp_main_7.toml"
PINNED = {
    WEIGHTS: "680eebd4381ad59511674b21d80ae8222cc1338ba4de3301eb2942ba6b96304f",  # Git LFS oid at hexo-bot 6251fc6
    PROFILE: "2e3ea6308cb03cc25de1e5b686331cebae67d94416d603f431a70018ac78e62d",
}
VERSION = "hexo-bot@6251fc6 main_7 ep18"

# Shrimp reads the network shape and its featurization radius from the environment once, at
# import. The shipped weights need exactly these; radius 4 is what they were trained with.
ARCH_ENV = {
    "SHRIMP_CHANNELS": "192",
    "SHRIMP_ATTENTION_HEADS": "3",
    "SHRIMP_TRUNK": "CCACCACCACCACCA",
    "SHRIMP_SUPPORT_RADIUS": "4",
}
SUPPORT_RADIUS = 4
LEGAL_RADIUS = 8  # Shrimp's engine has a fixed legal radius (hexo_engine legal.rs)
COORD_OFFSET = 1 << 15
SEED_MASK = (1 << 63) - 1

sys.path.insert(0, str(Path(__file__).resolve().parent))

import sixdriver  # noqa: E402


def pack(q: int, r: int) -> int:
    """Shrimp's packed action id for an axial cell (hexo_engine legal.rs pack_coord)."""
    return ((q + COORD_OFFSET) << 16) | (r + COORD_OFFSET)


def unpack(action_id: int) -> tuple[int, int]:
    return ((action_id >> 16) & 0xFFFF) - COORD_OFFSET, (action_id & 0xFFFF) - COORD_OFFSET


def verify(path: Path) -> None:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != PINNED[path]:
        raise RuntimeError(f"checksum mismatch for {path} ({digest})")


class Shrimp:
    def __init__(self, visits: int, threads: int, seed: int, opening_plies: int, opening_temperature: float):
        self.visits = visits
        self.seed = seed
        self.opening_plies = opening_plies
        self.opening_temperature = opening_temperature
        self.name = f"Shrimp {visits}v"
        for path in PINNED:
            verify(path)
        os.environ.update(ARCH_ENV)  # before the first shrimp import
        os.environ.setdefault("RAYON_NUM_THREADS", "2")

        import torch

        torch.set_num_threads(threads)
        torch.set_num_interop_threads(1)

        import hexo_engine
        from hexo_engine.types import AxialCoord, PlacementAction
        from shrimp import _rust, support
        from shrimp.config import build_divergence_overrides, parse_shrimp_config
        from shrimp.inference import ShrimpEvaluator
        from shrimp.model import ShrimpNet, infer_net_kwargs_from_state_dict

        self.engine = hexo_engine
        self.placement = lambda q, r: PlacementAction(AxialCoord(q, r))
        self.rust = _rust

        # Both featurizers must run at the weights' radius: 60 legal cells around a lone stone.
        probe = hexo_engine.new_game()
        hexo_engine.apply_action(probe, self.placement(0, 0))
        rust_legal = _rust.featurize_states([probe])[0]["legal_count"]
        if support._SUPPORT_RADIUS != SUPPORT_RADIUS or rust_legal != 60:
            raise RuntimeError(f"Shrimp support radius is not {SUPPORT_RADIUS} (python {support._SUPPORT_RADIUS}, rust legal {rust_legal})")

        payload = torch.load(WEIGHTS, map_location="cpu", weights_only=False)
        state_dict = payload["model"]
        self.model = ShrimpNet(**infer_net_kwargs_from_state_dict(state_dict))
        self.model.load_state_dict(state_dict, strict=True)
        self.model.eval()
        self.evaluator = ShrimpEvaluator(self.model, device="cpu")

        with open(PROFILE, "rb") as fh:
            config = tomllib.load(fh)["model"]["config"]
        parsed = parse_shrimp_config(
            {"device": "cpu", "selfplay": config["selfplay"], "multi_stage_eval": config["multi_stage_eval"]}
        )
        self.profile = parsed.selfplay
        if not (self.profile.gumbel_root_enabled and self.profile.tss_enabled):
            raise RuntimeError("the shrimp_main_7 profile should have the Gumbel root and TSS on")
        self.overrides = build_divergence_overrides(self.profile)
        self.virtual_batch_size = int(parsed.multi_stage_eval.eval_virtual_batch_size or 32)
        self.session = None
        self.game_key = 0

    def new_game(self) -> None:
        self.session = self.rust.ShrimpMctsSession(max_states=65_536)
        self.game_key += 1

    def replay(self, action_ids: list[int]):
        state = self.engine.new_game()
        for action_id in action_ids:
            q, r = unpack(action_id)
            self.engine.apply_action(state, self.placement(q, r))
        return state

    def turn(self, game) -> list[tuple[int, int]]:
        if game.radius != LEGAL_RADIUS:
            raise ValueError(f"Shrimp only plays radius {LEGAL_RADIUS}, not {game.radius}")
        if self.session is None:
            self.new_game()
        # Shrimp's first stone is always at the origin; both rule sets are translation-invariant.
        oq, or_ = game.moves[0] if game.moves else (0, 0)
        state = self.replay([pack(q - oq, r - or_) for q, r in game.moves])
        self.check_same_position(game, state, oq, or_)

        entry = self.engine.current_player(state)
        ply = len(game.moves)
        cells = []
        while self.engine.terminal(state) is None and self.engine.current_player(state) == entry:
            started = time.perf_counter()
            result = self.search(state, ply)
            q, r = unpack(int(result["action_id"]))
            self.engine.apply_action(state, self.placement(q, r))
            cells.append((q + oq, r + or_))
            print(f"shrimp ply {ply}: {cells[-1]} visits {result['visits']} value {float(result['root_value']):+.3f} "
                  f"{time.perf_counter() - started:.1f}s", file=sys.stderr, flush=True)
            ply += 1
        return cells

    def search(self, state, ply: int) -> dict:
        """One stone, exactly as the showcase's SearchProfile.search_one calls it."""
        sp = self.profile
        temperature = self.opening_temperature if ply < self.opening_plies else 0.0
        return self.session.search(
            [self.game_key],
            (state,),
            visits=self.visits,
            c_puct=sp.c_puct,
            temperature=0.0,
            seed=(self.seed * 5003 + ply) & SEED_MASK,
            evaluator=self.evaluator,
            move_temperatures=[float(temperature)],
            divergence_overrides=self.overrides,
            virtual_batch_size=self.virtual_batch_size,
            active_root_limit=sp.active_root_limit,
            widening_policy_mass=sp.widening_policy_mass,
            widening_max_children=sp.widening_max_children,
            widening_min_children=sp.widening_min_children,
            fpu_reduction=sp.fpu_reduction,
            tss_enabled=sp.tss_enabled,
            search_parity_mode=sp.search_parity_mode,
        )[0]

    def check_same_position(self, game, state, oq: int, or_: int) -> None:
        """Shrimp's engine and the arena's rules must agree on whose turn it is and where stones may go."""
        player = "X" if str(self.engine.current_player(state).value) == "player0" else "O"
        if player != game.current:
            raise RuntimeError(f"Shrimp thinks {player} is to move, the arena says {game.current}")
        if game.moves:
            ours = {pack(q - oq, r - or_) for q, r in game.playable_cells()}
            theirs = set(self.engine.legal_action_ids(state))
            if ours != theirs:
                raise RuntimeError(f"legal cells differ: {len(ours - theirs)} only ours, {len(theirs - ours)} only Shrimp's")


def cell_hash(q: int, r: int) -> int:
    return ((q * 73856093) & 0xFFFFFFFF) ^ ((r * 19349663) & 0xFFFFFFFF)


def selftest() -> int:
    """Replays the shared radius-8 game records through Shrimp's engine and checks every stone's facts.

    The records (engine/tests/fixtures/games.txt) come from the TypeScript rules. Games that don't
    open at the origin are translated, as turn() does.
    """
    os.environ.update(ARCH_ENV)
    import hexo_engine
    from hexo_engine.types import AxialCoord, PlacementAction

    fixtures = ROOT / "engine" / "tests" / "fixtures" / "games.txt"
    games = checked = 0
    radius = None
    state = origin = None
    for line in fixtures.read_text(encoding="utf-8").splitlines():
        words = line.split()
        if not words or line.startswith("#"):
            continue
        if words[0] == "game":
            radius = int(words[2])
            state, origin = hexo_engine.new_game(), None
            games += radius == LEGAL_RADIUS
            continue
        if words[0] != "stone" or radius != LEGAL_RADIUS:
            continue
        q, r = int(words[1]), int(words[2])
        origin = origin or (q, r)
        hexo_engine.apply_action(state, PlacementAction(AxialCoord(q - origin[0], r - origin[1])))
        facts = dict(f.split("=", 1) for f in words[3:])
        legal = hexo_engine.legal_action_ids(state)
        total = 0
        for action_id in legal:
            lq, lr = unpack(action_id)
            total = (total + cell_hash(lq + origin[0], lr + origin[1])) & 0xFFFFFFFF
        end = hexo_engine.terminal(state)
        winner = "-" if end is None else ("X" if str(end.winner.value) == "player0" else "O")
        current = "X" if str(hexo_engine.current_player(state).value) == "player0" else "O"
        seen = {"winner": winner, "current": current}
        if end is None:  # Shrimp's engine offers no moves once the game is won
            seen.update(playable=str(len(legal)), sum=str(total))
        wrong = {k: (v, facts[k]) for k, v in seen.items() if v != facts[k]}
        if wrong:
            print(f"stone {q} {r}: Shrimp's engine disagrees (shrimp, ours): {wrong}", file=sys.stderr)
            return 1
        checked += 1
    print(f"Shrimp's engine agrees with {checked} stones in {games} radius-{LEGAL_RADIUS} game records")
    return 0 if checked else 1


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--visits", type=int, default=512, help="search visits per stone (512: Shrimp's eval strength)")
    parser.add_argument("--threads", type=int, default=4, help="torch CPU threads")
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--opening-plies", type=int, default=0,
                        help="stones sampled at --opening-temperature (Shrimp's own arena: 8 at 1.0)")
    parser.add_argument("--opening-temperature", type=float, default=1.0)
    parser.add_argument("--selftest", action="store_true", help="check Shrimp's rules against the shared game records")
    args = parser.parse_args()
    if args.selftest:
        raise SystemExit(selftest())
    bot = Shrimp(args.visits, args.threads, args.seed, args.opening_plies, args.opening_temperature)
    sixdriver.run(bot, version=VERSION)


if __name__ == "__main__":
    main()
