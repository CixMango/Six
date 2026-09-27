"""Proves a shape wins even with the opponent moving first, allowing any kind of attacking turn.

sixshapes --always-defend lists every opponent reply (within 5 cells of any stone) that stops a win made only of
double threats. For each of those, Six picks the owner's next turn (non-forced turns allowed) and the same check
runs again. The shape is proven when every branch ends in a double-threat win. If a reply survives to the depth
limit, it's reported as the line to look at.

  python engine/tools/prove.py 0 0 0 1 0 2 1 0 --depth 3
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHAPES = ROOT / "engine/build/release/sixshapes.exe"
ENGINE = ROOT / "engine/build/release/sixengine.exe"
WORK = ROOT / "runs/shapes/proof"
LOW = subprocess.BELOW_NORMAL_PRIORITY_CLASS if os.name == "nt" else 0


def dist(a, b):
    dq, dr = a[0] - b[0], a[1] - b[1]
    return max(abs(dq), abs(dr), abs(dq + dr))


TRANSFORMS = []
for mirror in (False, True):
    for turns in range(6):
        def f(h, mirror=mirror, turns=turns):
            q, r = (h[1], h[0]) if mirror else h
            for _ in range(turns):
                q, r = -r, q + r
            return q, r
        TRANSFORMS.append(f)


def inverse(f):
    probe = [(1, 0), (0, 1)]
    return next(g for g in TRANSFORMS if [g(f(h)) for h in probe] == probe)


def position_key(xs, os_):
    """The same key for a position and all its rotations, mirror images and shifts."""
    best = None
    for f in TRANSFORMS:
        x = [f(c) for c in xs]
        o = [f(c) for c in os_]
        oq, orr = min(x + o)
        k = (tuple(sorted((q - oq, r - orr) for q, r in x)), tuple(sorted((q - oq, r - orr) for q, r in o)))
        if best is None or k < best:
            best = k
    return best


CHECKED = {}
DEADLINE = None  # time.time() by which a reply check must finish; set by callers with a time budget


class OutOfTime(Exception):
    pass


def holding_replies(xs, os_, threads):
    """Opponent replies after which the owner has no double-threat win (or the solver couldn't decide)."""
    memo = (tuple(sorted(xs)), tuple(sorted(os_)))
    if memo in CHECKED:
        return CHECKED[memo]
    CHECKED[memo] = result = _holding_replies(xs, os_, threads)
    if len(CHECKED) > 20000:
        CHECKED.clear()
    return result


def _holding_replies(xs, os_, threads):
    WORK.mkdir(parents=True, exist_ok=True)
    row = " ".join(f"{q} {r}" for q, r in xs) + " | " + " ".join(f"{q} {r}" for q, r in os_)
    node = WORK / f"node-{os.getpid()}.txt"
    node.write_text(row + "\n", encoding="ascii")
    args = [str(SHAPES), "--only", str(node), "--stones", "99", "--defend", "99", "--region", "5",
            "--always-defend", "1", "--threads", str(threads)]
    left = None if DEADLINE is None else DEADLINE - time.time()
    if left is not None and left <= 0:
        raise OutOfTime()
    try:
        out = subprocess.run(args, capture_output=True, text=True, creationflags=LOW, check=True, timeout=left).stdout
    except subprocess.TimeoutExpired:
        raise OutOfTime() from None
    d = json.loads(out.strip().splitlines()[-1])["defenses"]
    return [tuple(tuple(c) for c in pair) for pair in d["holding"]], d["tried"], d["unknown"]


RING = sorted(((q, r) for q in range(-40, 41) for r in range(-40, 41) if dist((q, r), (0, 0)) <= 40),
              key=lambda c: (dist(c, (0, 0)), c))


def game_order(xs, os_, x_to_move=True):
    """A legal move list for this position: X opens, then two stones a turn. Every stone must land within 8 cells of
    one already down, so the real stones go in as soon as they're in reach and far filler stones (6+ cells from every
    real stone and from each other, so they share no window of six with anything) fill the other slots."""
    real = set(xs) | set(os_)
    for extra in range(0, 20):
        if x_to_move:
            turns = max((len(xs) + 2) // 2, (len(os_) + 1) // 2) + extra
            counts = {"X": 2 * turns - 1, "O": 2 * turns}
        else:
            turns = max(len(xs) // 2, (len(os_) + 1) // 2) + extra
            counts = {"X": 2 * turns + 1, "O": 2 * turns}
        left = {"X": list(xs), "O": list(os_)}
        order, fillers = [], []
        slots = ["X"] + [side for t in range(counts["O"] // 2) for side in ("O", "O", "X", "X")]
        slots = slots[:counts["X"] + counts["O"]]
        ok = True
        for side in slots:
            reach = lambda c: not order or any(dist(c, d) <= 8 for d in order)
            pick = next((c for c in left[side] if reach(c)), None)
            if pick is not None:
                left[side].remove(pick)
            else:
                pick = next((c for c in RING if c not in real and reach(c)
                             and all(dist(c, r) >= 6 for r in real) and all(dist(c, f) >= 6 for f in fillers)), None)
                if pick is None:
                    ok = False
                    break
                fillers.append(pick)
            order.append(pick)
        if ok and not left["X"] and not left["O"]:
            return order
    raise ValueError(f"no legal move order for {xs} / {os_}")


class Six:
    """The newest network, asked for the side to move's best turn and its value (-1000 to 1000, for that side)."""

    def __init__(self, movetime, device):
        net = sorted((ROOT / "runs/rl").glob("gen-*/net.onnx"))[-1]
        lib = ROOT / ".venv/Lib/site-packages"
        env = dict(os.environ, PATH=os.pathsep.join([str(lib / "torch/lib"), str(lib / "tensorrt_libs"), os.environ["PATH"]]))
        self.p = subprocess.Popen([str(ENGINE), "--net", str(net), f"--{device}"], stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, env=env, creationflags=LOW)
        self.movetime = movetime
        self.name = f"{net.parent.name} on {device}"

    def move(self, xs, os_, x_to_move=True, view=None, movetime=None):
        """Six's turn; `view` asks about a rotated or mirrored copy of the position and maps the answer back."""
        if view is not None:
            back = inverse(view)
            turn, score = self.move([view(c) for c in xs], [view(c) for c in os_], x_to_move, None, movetime)
            return [back(c) for c in turn], score
        flat = " ".join(f"{q} {r}" for q, r in game_order(xs, os_, x_to_move))
        self.p.stdin.write(f"position radius 8 moves {flat}\ngo movetime {movetime or self.movetime}\n")
        self.p.stdin.flush()
        score = None
        for line in self.p.stdout:
            if line.startswith("info") and " score " in line:
                score = int(line.split(" score ")[1].split()[0])
            if line.startswith("bestmove"):
                n = list(map(int, line.split()[1:]))
                return [(n[i], n[i + 1]) for i in range(0, len(n), 2)], score
        raise RuntimeError("the engine stopped")

    def close(self):
        try:
            self.p.stdin.write("quit\n")
            self.p.stdin.flush()
        except OSError:
            pass


def symmetries(xs, os_):
    """Maps (a rotation or mirror image plus a shift) that carry the position onto itself, colours kept."""
    x, o = set(xs), set(os_)
    out = []
    for f in TRANSFORMS:
        fx = [f(c) for c in xs]
        shift = (min(xs)[0] - min(fx)[0], min(xs)[1] - min(fx)[1])
        m = lambda h, f=f, shift=shift: (f(h)[0] + shift[0], f(h)[1] + shift[1])
        if {m(c) for c in xs} == x and {m(c) for c in os_} == o:
            out.append(m)
    return out


def one_per_orbit(replies, maps):
    """Replies the position's symmetry makes equivalent are checked once."""
    seen, kept = set(), []
    for pair in replies:
        k = min(tuple(sorted(m(c) for c in pair)) for m in maps) if maps else tuple(sorted(pair))
        if k not in seen:
            seen.add(k)
            kept.append(pair)
    return kept


PROVEN_CACHE = {}  # position key -> fewest owner turns it was proven with (defender to move)


def prove_shape(six, shape, depth, threads, say=print, candidates=3):
    """True with the proof tree, or False with the line still open."""
    stats = {"positions": 0}
    killers = {}  # owner turns that already won at this depth: tried first, before asking Six

    def owner_to_move(xs, os_, left, line):
        if left == 0:
            return False, line, None
        taken = set(xs) | set(os_)
        for k in killers.get(left, [])[:6]:
            if not (set(k) & taken) and not holding_replies(xs + k, os_, threads)[0]:
                say(f"{'  ' * len(line)}X {k} (reused)")
                return True, None, {"X": k, "then": {"survive": []}}
        turn, score = six.move(xs, os_)
        options = [turn]
        if candidates > 1 and holding_replies(xs + turn, os_, threads)[0]:
            # A few more of Six's choices (the position rotated, mirrored, or thought about for less time), tried in
            # order of how few replies they leave the defender; the next one is tried if a branch fails.
            for view, time_ in ((TRANSFORMS[7], None), (TRANSFORMS[3], None), (None, max(500, six.movetime // 3))):
                if len(options) >= candidates:
                    break
                other, _ = six.move(xs, os_, view=view, movetime=time_)
                if set(other) not in [set(o) for o in options] and not (set(other) & taken):
                    options.append(other)
            if len(options) > 1:
                counts = [len(holding_replies(xs + o, os_, threads)[0]) for o in options]
                order = sorted(range(len(options)), key=lambda i: (counts[i], i))
                say(f"{'  ' * len(line)}  candidates {options} leave {counts}")
                options = [options[i] for i in order]
        bad = line
        for turn in options:
            say(f"{'  ' * len(line)}X {turn} (Six {score})")
            ok, bad, sub = defender_to_move(xs + turn, os_, left - 1, line + [("X", turn)])
            if ok:
                ks = killers.setdefault(left, [])
                if turn in ks:
                    ks.remove(turn)
                ks.insert(0, turn)
                return True, None, {"X": turn, "then": sub}
        return False, bad, None

    def defender_to_move(xs, os_, left, line):
        key = position_key(xs, os_)
        if PROVEN_CACHE.get(key, 99) <= left:
            say(f"{'  ' * len(line)}O: already proven")
            return True, None, {"cached": True}
        stats["positions"] += 1
        holding, tried, unknown = holding_replies(xs, os_, threads)
        total = len(holding)
        holding = one_per_orbit(holding, symmetries(xs, os_))
        say(f"{'  ' * len(line)}O: {tried} replies, {total} survive" + (f" ({len(holding)} up to symmetry)" if len(holding) < total else "")
            + (f" ({unknown} undecided)" if unknown else ""))
        if len(holding) > 1:
            # Six's own choice of defence goes first: if the proof is going to fail, it most likely fails there.
            best, _ = six.move(xs, os_, x_to_move=False)
            holding.sort(key=lambda pair: 0 if set(pair) == set(best) else 1)
        branches = []
        for reply in holding:
            say(f"{'  ' * len(line)}O {list(reply)}")
            ok, bad, sub = owner_to_move(xs, os_ + list(reply), left, line + [("O", list(reply))])
            if not ok:
                return False, bad, None
            branches.append({"O": list(reply), "then": sub})
        PROVEN_CACHE[key] = min(PROVEN_CACHE.get(key, 99), left)
        return True, None, {"tried": tried, "survive": branches}

    ok, bad, tree = defender_to_move(list(shape), [], depth, [])
    return ok, (tree if ok else bad), stats["positions"]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cells", nargs="+", type=int)
    ap.add_argument("--depth", type=int, default=3, help="owner turns allowed before the double-threat win")
    ap.add_argument("--threads", type=int, default=6)
    ap.add_argument("--movetime", type=int, default=5000)
    ap.add_argument("--device", default="trt", help="trt (graphics card) or cpu")
    a = ap.parse_args()
    shape = [(a.cells[i], a.cells[i + 1]) for i in range(0, len(a.cells), 2)]
    six = Six(a.movetime, a.device)
    print("Six:", six.name, flush=True)
    started = time.time()
    try:
        ok, result, positions = prove_shape(six, shape, a.depth, a.threads, say=lambda s: print(s, flush=True))
    finally:
        six.close()
    print(f"\n{'PROVEN' if ok else 'NOT PROVEN'} in {time.time() - started:.0f}s, {positions} defender positions checked")
    if not ok:
        print("line still open:", result)
    sys.exit(0 if ok else 1)
