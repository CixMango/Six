"""Brings the shape catalogue up to date after the double-threat solver got stronger (sixshapes --wide 1).

A stronger solver only finds more wins, and every win the old one found still stands. So a reply the old run refuted
stays refuted, and only the replies that held get checked again; a shape with no win to move gets a full run.

  python engine/tools/shapes_recheck.py            # s4d, s5, then the region-5 unstoppable check and the close pairs

The old files are kept next to the new ones as *-narrow.jsonl. Progress goes to runs/shapes/wide.log.
"""
import json
import shutil
import subprocess
import sys
import time
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNS = ROOT / "runs/shapes"
EXE = ROOT / "engine/build/release/sixshapes.exe"
LOG = RUNS / "wide.log"
LOW = subprocess.BELOW_NORMAL_PRIORITY_CLASS
sys.path.insert(0, str(ROOT / "guide"))
import make_shapes as m  # noqa: E402


def log(msg):
    line = f"{time.strftime('%Y-%m-%d %H:%M:%S')} {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def narrow(name):
    """The old run's file, copied aside once so a rerun of this script starts from the same place."""
    src, dst = RUNS / name, RUNS / name.replace(".jsonl", "-narrow.jsonl")
    if not dst.exists():
        shutil.copy(src, dst)
    return [json.loads(line) for line in open(dst, encoding="utf-8")]


def cells(cs):
    return " ".join(f"{q} {r}" for q, r in cs)


def shape_of(row):
    nums = [int(v) for v in row.split("|")[0].split()]
    return json.dumps([[nums[i], nums[i + 1]] for i in range(0, len(nums), 2)])


def sixshapes(rows, tag, *args, threads=12):
    """Runs sixshapes --only over text rows; returns its output rows keyed by shape. Rows already in the output file
    (from a run that was stopped) aren't run again."""
    if not rows:
        return {}
    src, out_path = RUNS / f"wide-{tag}.txt", RUNS / f"wide-{tag}.jsonl"
    got = {}
    if out_path.exists():
        for line in open(out_path, encoding="utf-8"):
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            got[json.dumps(r["shape"])] = r
    todo = [row for row in rows if shape_of(row) not in got]
    if todo:
        src.write_text("\n".join(todo) + "\n", encoding="ascii")
        started = time.time()
        if out_path.exists() and out_path.stat().st_size and not out_path.read_bytes().endswith(b"\n"):
            with open(out_path, "ab") as out:  # a row cut off when the run was stopped
                out.write(b"\n")
        with open(out_path, "a", encoding="utf-8") as out:
            subprocess.run([str(EXE), "--only", str(src), *map(str, args), "--threads", str(threads)], stdout=out,
                           stderr=subprocess.DEVNULL, creationflags=LOW, check=True)
        for line in open(out_path, encoding="utf-8"):
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            got[json.dumps(r["shape"])] = r
        log(f"{tag}: {len(todo)} shapes in {time.time() - started:.0f}s")
    return got


def s4d():
    old = narrow("s4d.jsonl")
    full = [r for r in old if not r["toMove"]["win"]]
    again = [r for r in old if r["toMove"]["win"] and r["defenses"]["holding"]]
    got = sixshapes([cells(r["shape"]) for r in full], "s4d-full", "--defend", 4)
    got.update(sixshapes([cells(r["shape"]) + " | | " + " ".join(cells(p) for p in r["defenses"]["holding"]) for r in again],
                         "s4d-again", "--defend", 4))
    rows = []
    for r in old:
        n = got.get(json.dumps(r["shape"]))
        if n is None:
            rows.append(r)
        elif r["toMove"]["win"]:
            if n["toMove"]["win"] and "defenses" in n:
                d = n["defenses"]
                rows.append({**r, "toMove": n["toMove"], "defenses": {"tried": r["defenses"]["tried"], "unknown": d["unknown"],
                                                                      "skipped": 0, "holding": d["holding"]}})
            else:
                log(f"s4d: kept the old result for {r['shape']} (no win found this time)")
                rows.append(r)
        else:
            rows.append(n)
    with open(RUNS / "s4d.jsonl", "w", encoding="utf-8") as f:
        f.writelines(json.dumps(r) + "\n" for r in rows)
    wins = sum(r["toMove"]["win"] for r in rows) - sum(r["toMove"]["win"] for r in old)
    held = sum(len(r["defenses"]["holding"]) for r in old if r.get("defenses"))
    log(f"s4d: {wins} more shapes win to move; holding replies {held} -> "
        f"{sum(len(r['defenses']['holding']) for r in rows if r.get('defenses'))}")
    return rows


def s5():
    old = narrow("s5.jsonl")
    got = sixshapes([cells(r["shape"]) for r in old if not r["toMove"]["win"]], "s5", "--defend", 0, "--stones", 5)
    rows = [got.get(json.dumps(r["shape"]), r) if not r["toMove"]["win"] else r for r in old]
    with open(RUNS / "s5.jsonl", "w", encoding="utf-8") as f:
        f.writelines(json.dumps(r) + "\n" for r in rows)
    log(f"s5: {sum(r['toMove']['win'] for r in rows) - sum(r['toMove']['win'] for r in old)} more shapes win to move")


def unstoppable(rows):
    """Shapes no reply within 3 cells stops, checked again with replies within 5 cells."""
    old = narrow("unstoppable4-r5.jsonl")
    seen = {m.canonical([tuple(c) for c in r["shape"]]) for r in old}
    cands = [r for r in rows if r["toMove"]["win"] and r.get("defenses") and not r["defenses"]["holding"]
             and not r["defenses"]["unknown"]]
    (RUNS / "unstoppable4.txt").write_text("".join(cells(r["shape"]) + "\n" for r in cands), encoding="ascii")
    new = [r for r in cands if m.canonical([tuple(c) for c in r["shape"]]) not in seen]
    got = sixshapes([cells(r["shape"]) for r in new], "r5", "--defend", 4, "--region", 5)
    out = old + [got[json.dumps(r["shape"])] for r in new]
    with open(RUNS / "unstoppable4-r5.jsonl", "w", encoding="utf-8") as f:
        f.writelines(json.dumps(r) + "\n" for r in out)
    confirmed = [r for r in out if not r["defenses"]["holding"] and not r["defenses"]["unknown"]]
    log(f"unstoppable: {len(cands)} candidates at 3 cells ({len(new)} new), {len(confirmed)} confirmed at 5 cells "
        f"(was {sum(1 for r in old if not r['defenses']['holding'])}); by stones "
        f"{sorted((n, sum(1 for r in confirmed if r['stones'] == n)) for n in {r['stones'] for r in confirmed})}")
    return confirmed


def pairblock(confirmed):
    """Each close pair's finishes that its two ringed cells don't take away, checked with O on those cells."""
    U = [[tuple(c) for c in r["shape"]] for r in confirmed]
    rows = []
    for pair in ([(0, 0), (0, 1)], [(0, 0), (0, 2)], [(0, 0), (0, 3)], [(0, 0), (1, -2)]):
        ways = m.completions(pair, U)
        near = sorted({c for w in ways for c in w})
        best = max(combinations(near, 2), key=lambda ab: (sum(1 for w in ways if ab[0] in w or ab[1] in w), ab))
        left = [w for w in ways if best[0] not in w and best[1] not in w]
        log(f"pairblock: {pair} ringed {best}, {len(ways)} finishes, {len(left)} left")
        rows += [cells(pair + list(w)) + " | " + cells(best) for w in left]
    (RUNS / "pairblock.txt").write_text("\n".join(rows) + "\n", encoding="ascii")
    narrow("pairblock.jsonl")
    got = sixshapes(rows, "pairblock", "--defend", 4, "--region", 3, "--first-hold", 1)
    shutil.copy(RUNS / "wide-pairblock.jsonl", RUNS / "pairblock.jsonl")
    log(f"pairblock: {sum(1 for r in got.values() if r['toMove']['win'] and not r.get('defenses', {}).get('holding'))} of {len(rows)} "
        "still unstoppable with O on the ringed cells")


if __name__ == "__main__":
    log("recheck with the wide solver: start")
    rows = s4d()
    confirmed = unstoppable(rows)
    pairblock(confirmed)
    s5()
    log("recheck with the wide solver: end")
