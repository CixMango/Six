# Arena

The arena plays paired games between engines and reports Elo with confidence intervals and SPRT verdicts. Every engine speaks the Six engine protocol (`engine/src/main.cpp`); rivals are wrapped by drivers.

```bash
py -3.12 arena/match.py hexbot:1000 sealbot:d4 --pairs 100 --radius 8 --concurrency 6 --sprt 0 30
py -3.12 arena/netmatch.py runs/rl/gen-0009/net.onnx runs/rl/gen-0005/net.onnx --movetime 300 --pairs 24
py -3.12 -m unittest discover -s arena/tests
```

`netmatch.py` is the same match between two **networks**, played inside one `sixmatch` process: one CUDA context for both
sides instead of a ~1.8 GB engine process per side per game. It takes `--set-a` / `--set-b` MCTS settings (e.g.
`--set-b reuseTree=0`), and writes the same replays and `summary.json`.

**Engine specs**

| Spec | Engine |
|---|---|
| `hexbot:<ms>` | HexBot with a fixed thinking time per turn |
| `hexbot-depth:<d>` | HexBot at a fixed depth in turns |
| `sealbot:d<depth>` or `sealbot:t<seconds>` | SealBot, built locally in `rivals/sealbot` |
| `hexo_bot2:<seconds>` | hexo_bot2 from `rivals/hexo_bot2` |
| `strix:<sims>` | Strix's Gumbel MCTS alone (WASM in Node, from `rivals/strix`, checksums pinned) |
| `strix-live:<sims>[:<difficulty>]` | Strix with the hexo.tyto.cc forcing layer; difficulty is quick, standard (default), strong or deep |
| `shrimp:<visits>[:<threads>]` | Shrimp main_7 epoch 18 on CPU torch, from its own venv in `rivals/shrimp` (weights and search profile checksums pinned). Visits per stone (default 512, Shrimp's eval setting) and torch threads (default 4). Radius 8 only. About 20-30 s per turn at 512 visits |

HexBot specs take search settings after commas, sent as `setoption` lines: `hexbot:1000,replyThreatNodes=2000`.

**How matches run**

- **Openings:** each opening is X at the center plus two O stones within two steps. Each opening is played twice, once with each engine as X.
- **Refereeing:** the arena's own rules (`six_rules.py`) referee every move. They are checked against the TypeScript rules fixtures.
- **Forfeits:** an illegal move, crash or timeout forfeits the game, and the reason is printed.
- **Output:** results go to `data/arena/<run>/`, with one six-replay file per game plus `summary.json`.
- **Rival code:** rivals without licenses are used for local evaluation only and never committed (`rivals/` is gitignored).
