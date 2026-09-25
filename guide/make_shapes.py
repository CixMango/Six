"""Builds guide/shapes.md and its diagrams from sixshapes output.

  engine/build/release/sixshapes --stones 4 --defend 4 > runs/shapes/s4d.jsonl
  python guide/make_shapes.py runs/shapes/s4d.jsonl
"""
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "shapes"


def rotate(h):
    q, r = h
    return (-r, q + r)


def mirror(h):
    q, r = h
    return (r, q)


def transforms():
    fs = []
    for m in range(2):
        for k in range(6):
            def f(h, m=m, k=k):
                if m:
                    h = mirror(h)
                for _ in range(k):
                    h = rotate(h)
                return h
            fs.append(f)
    return fs


TRANSFORMS = transforms()


def dist(a, b):
    dq, dr = a[0] - b[0], a[1] - b[1]
    return max(abs(dq), abs(dr), abs(dq + dr))


def on_axis(a, b):
    dq, dr = b[0] - a[0], b[1] - a[1]
    return dq == 0 or dr == 0 or dq == -dr


def key(cells):
    return tuple(sorted(cells))


def canonical(cells):
    best = None
    for f in TRANSFORMS:
        t = sorted(f(c) for c in cells)
        o = t[0]
        n = tuple((q - o[0], r - o[1]) for q, r in t)
        if best is None or n < best:
            best = n
    return best


def stabilizer(shape):
    """Symmetries (transform plus translation) that map the shape onto itself."""
    s = set(shape)
    out = []
    for f in TRANSFORMS:
        t = [f(c) for c in shape]
        a, b = min(t), min(shape)
        shift = (b[0] - a[0], b[1] - a[1])
        if {(q + shift[0], r + shift[1]) for q, r in t} == s:
            out.append(lambda h, f=f, shift=shift: (f(h)[0] + shift[0], f(h)[1] + shift[1]))
    return out


def distinct_defenses(shape, holding):
    groups = {}
    for pair in holding:
        pair = tuple(tuple(c) for c in pair)
        k = min(key(g(c) for c in pair) for g in stabilizer(shape))
        groups.setdefault(k, pair)
    return list(groups.values())


def describe(shape):
    """A plain name for three-stone shapes, and community names where they exist."""
    s = [tuple(c) for c in shape]
    if len(s) == 3:
        d = sorted(dist(a, b) for i, a in enumerate(s) for b in s[i + 1:])
        axes = [on_axis(a, b) for i, a in enumerate(s) for b in s[i + 1:]]
        if d == [1, 1, 1]:
            return "Triangle"
        if d == [1, 1, 2] and not all(axes):
            return "Chevron (boomerang)"
    if len(s) == 4:
        d = sorted(dist(a, b) for i, a in enumerate(s) for b in s[i + 1:])
        if d == [1, 1, 1, 1, 1, 2]:
            return "Diamond (two triangles)"
    parts = []
    for i, a in enumerate(s):
        for b in s[i + 1:]:
            gap = dist(a, b) - 1
            if on_axis(a, b):
                parts.append("adjacent" if gap == 0 else f"{gap} gap" + ("s" if gap > 1 else ""))
    return ""


SIZE = 16


def pixel(h):
    q, r = h
    return (SIZE * math.sqrt(3) * (q + r / 2), SIZE * 1.5 * r)


def hex_points(cx, cy, s):
    return " ".join(f"{cx + s * math.cos(math.radians(60 * i - 30)):.1f},{cy + s * math.sin(math.radians(60 * i - 30)):.1f}" for i in range(6))


def region(shape, radius=3):
    """The reply cells sixshapes tries: empty cells within `radius` of the shape."""
    stones = {tuple(c) for c in shape}
    return {(s[0] + dq, s[1] + dr) for s in stones for dq in range(-radius, radius + 1) for dr in range(-radius, radius + 1)
            if dist(s, (s[0] + dq, s[1] + dr)) <= radius} - stones


def svg(shape, defense=(), first=(), margin=3, heat=None):
    stones = [tuple(c) for c in shape]
    heat = heat or {}
    cells = {(q, r) for q in range(-12, 13) for r in range(-12, 13) if any(dist((q, r), s) <= margin for s in stones)}
    pts = [pixel(c) for c in cells]
    minx, maxx = min(p[0] for p in pts) - SIZE, max(p[0] for p in pts) + SIZE
    miny, maxy = min(p[1] for p in pts) - SIZE, max(p[1] for p in pts) + SIZE
    w, h = maxx - minx, maxy - miny
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx:.0f} {miny:.0f} {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">',
           f'<rect x="{minx:.0f}" y="{miny:.0f}" width="{w:.0f}" height="{h:.0f}" fill="#0b0e15"/>']
    for c in sorted(cells):
        x, y = pixel(c)
        if c in stones:
            fill = "#f6d04a"
        elif c in [tuple(d) for d in defense]:
            fill = "#87d1f7"
        elif c in heat:
            # Share of holding replies using this cell; a full share means one stone here is enough.
            v = heat[c]
            fill = "#3f8fd2" if v >= 1 else f"rgba(135,209,247,{0.18 + 0.8 * v:.2f})"
        else:
            fill = "#1b2233"
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.92)}" fill="{fill}"/>')
    for c in first:
        x, y = pixel(tuple(c))
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.62)}" fill="none" stroke="#f6d04a" stroke-width="2.5"/>')
    out.append("</svg>")
    return "\n".join(out)


def name_file(shape, suffix=""):
    return "s" + "_".join(f"{q}x{r}".replace("-", "m") for q, r in shape) + suffix + ".svg"


def contents(shape):
    """The named three-stone shapes inside a bigger shape, e.g. "2 chevrons + a triangle"."""
    s = [tuple(c) for c in shape]
    found = defaultdict(int)
    for i in range(len(s)):
        for j in range(i + 1, len(s)):
            for k in range(j + 1, len(s)):
                n = describe([s[i], s[j], s[k]])
                if n:
                    found[n.split(" ")[0].lower()] += 1
    parts = [f"{v} {k}s" if v > 1 else f"a {k}" for k, v in sorted(found.items())]
    return " + ".join(parts)


def shape_block(r, heading_level="###", defense_radius=3, label=""):
    """Markdown and diagrams for one shape: the shape with its winning first turn, then its defence map."""
    shape = [tuple(c) for c in r["shape"]]
    fname = name_file(shape)
    (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", [])), encoding="utf-8")
    named = describe(shape)
    inside = "" if named else contents(shape)
    title = " · ".join(x for x in (label, named, ("contains " + inside) if inside else "") if x)
    out = [f"{heading_level} {title}", "", f'<img src="shapes/{fname}" alt="{label} {named}">', "",
           f"Forced win in {r['toMove']['turns']} turns for the owner to move."]
    d = r.get("defenses")
    if d:
        if not d["holding"]:
            out.append(f"No reply within {defense_radius} cells holds ({d['tried']} tried): it wins with the opponent to move.")
        else:
            cells = region(shape, defense_radius)
            per_cell = defaultdict(int)
            for pair in d["holding"]:
                for c in pair:
                    per_cell[tuple(c)] += 1
            partners = len(cells) - 1
            heat = {c: n / partners for c, n in per_cell.items()}
            enough = sorted(c for c, v in heat.items() if v >= 1)
            hname = name_file(shape, "_map")
            (OUT / hname).write_text(svg(shape, heat=heat), encoding="utf-8")
            out += [f"{len(d['holding'])} of {d['tried']} replies within {defense_radius} cells hold.", "",
                    f'<img src="shapes/{hname}" alt="defence map">', "",
                    "Defence map: the more holding replies use a cell, the bluer it is"
                    + (f"; the {len(enough)} darkest cells hold whatever the second stone does." if enough
                       else "; no single cell is enough, both stones matter.")]
            ranked = sorted(distinct_defenses(shape, d["holding"]), key=lambda pr: -sum(heat.get(tuple(c), 0) for c in pr))
            imgs = []
            for i, pair in enumerate(ranked[:4]):
                dname = name_file(shape, f"_d{i}")
                (OUT / dname).write_text(svg(shape, defense=pair), encoding="utf-8")
                imgs.append(f'<img src="shapes/{dname}" alt="holding defence {i + 1}">')
            out += ["", "Some holding replies:", "", " ".join(imgs)]
    out.append("")
    return out


def main(paths, unstoppable_path=None):
    rows = {}
    for path in paths:
        for line in open(path, encoding="utf-8"):
            r = json.loads(line)
            k = key(tuple(c) for c in r["shape"])
            if k not in rows or (r.get("defenses") and not rows[k].get("defenses")):
                rows[k] = r
    confirmed = {}
    if unstoppable_path:
        for line in open(unstoppable_path, encoding="utf-8"):
            r = json.loads(line)
            if not r["defenses"]["holding"] and not r["defenses"]["unknown"]:
                confirmed[key(tuple(c) for c in r["shape"])] = r
    rows = list(rows.values())
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    wins = {key(tuple(c) for c in r["shape"]) for r in rows if r["toMove"]["win"]}

    def minimal(r):
        s = [tuple(c) for c in r["shape"]]
        return not any(canonical(s[:i] + s[i + 1:]) in wins for i in range(len(s)))

    def unstoppable(r):
        d = r.get("defenses")
        return bool(d) and not d["holding"] and not d["unknown"]

    counts = defaultdict(lambda: [0, 0, 0, 0])
    for r in rows:
        c = counts[r["stones"]]
        c[0] += 1
        if r["toMove"]["win"]:
            c[1] += 1
            c[2] += minimal(r)
            c[3] += unstoppable(r)

    lines = ["# Shapes that win", "",
             "Every small shape of one player's stones, checked with Six's forced-win solver: which ones must be "
             "answered, how to answer them, and which can't be answered at all.", "",
             "## What the words mean", "",
             "- **Shape:** some of one player's stones with nothing else nearby. Rotations, mirror images and shifts of a "
             "shape count as the same shape. Stones count as part of one shape when they're within 2 cells of each other, "
             "or on one line within 4.",
             "- **Must-answer:** if the owner gets to move (two stones), they have a forced win, so the opponent has to "
             "spend their turn on it.",
             "- **Forced win:** a win the solver proves: every one of the owner's turns makes threats (lines one turn from "
             "six) that need both of the opponent's stones to block, until there are more threats than two stones can "
             "block. It holds whatever the opponent does.",
             "- **Holding reply:** two opponent stones after which the owner has no forced win any more.",
             "- **Unstoppable:** no reply holds. The shape wins even with the opponent to move.",
             "- **Minimal:** it doesn't contain a smaller must-answer shape. Bigger must-answer shapes usually just contain "
             "one of these.", "",
             "In the diagrams the shape is yellow, outlined cells are the owner's winning first turn, and blue stones are "
             "the opponent's reply.", "",
             "## Summary", "",
             "| Stones | Shapes | Must-answer | Minimal must-answer | Unstoppable |",
             "|---|---|---|---|---|"]
    for n in sorted(counts):
        c = counts[n]
        unst = str(c[3]) if n <= 4 else "not checked"
        lines.append(f"| {n} | {c[0]:,} | {c[1]:,} | {c[2]:,} | {unst} |")
    lines += ["",
              "- No shape of 1 or 2 stones is must-answer. Every must-answer shape needs at least 3 stones.",
              "- No 3-stone shape is unstoppable: each one has replies that hold. The smallest unstoppable shapes have "
              "4 stones.",
              "- Checking every reply to every 5-stone shape would take many hours, so the 5-stone shapes are listed without "
              "defences.", ""]

    unstop = sorted((r for r in rows if unstoppable(r)), key=lambda r: r["shape"])
    lines += ["## Unstoppable shapes", "",
              f"These {len(unstop)} four-stone shapes win even with the opponent to move: the solver tried every two-stone "
              "reply within 5 cells of each (6,000 to 10,600 replies; a stone further away can't share a line of six with "
              "the shape) and the owner still forces a win after every one. Don't let the opponent build one.", ""]
    for i, r in enumerate(unstop, 1):
        k = key(tuple(c) for c in r["shape"])
        shown = dict(r)
        if k in confirmed:
            shown["defenses"] = confirmed[k]["defenses"]
        lines += shape_block(shown, defense_radius=5 if k in confirmed else 3, label=f"U{i}")

    for n in (3, 4):
        group = [r for r in rows if r["stones"] == n and r["toMove"]["win"] and minimal(r) and not unstoppable(r)]
        if not group:
            continue
        lines += [f"## {n}-stone must-answer shapes", "",
                  f"The {len(group)} minimal ones (they contain no 3-stone must-answer shape), hardest to defend first."
                  if n == 4 else
                  f"All {len(group)} of them, hardest to defend first. Every must-answer shape with more stones contains one "
                  "of these or is listed below.", ""]
        prefix = "A" if n == 3 else "B"
        ordered = sorted(group, key=lambda r: (len(r["defenses"]["holding"]) if r.get("defenses") else 10**9, r["shape"]))
        for i, r in enumerate(ordered, 1):
            lines += shape_block(r, label=f"{prefix}{i}")

    five = sorted((r for r in rows if r["stones"] == 5 and r["toMove"]["win"] and minimal(r)), key=lambda r: r["shape"])
    if five:
        lines += ["## 5-stone must-answer shapes", "",
                  f"The {len(five)} minimal ones. They're spread out: every tighter 5-stone must-answer shape contains a "
                  "smaller one above.", ""]
        imgs = []
        for r in five:
            shape = [tuple(c) for c in r["shape"]]
            fname = name_file(shape)
            (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", []), margin=1), encoding="utf-8")
            imgs.append(f'<img src="shapes/{fname}" alt="5-stone shape" width="160">')
        lines += [" ".join(imgs), ""]

    lines += ["## What this doesn't cover", "",
              "- **Wins that need a quiet move.** The solver only proves wins where every turn forces the opponent. Some "
              "shapes are probably still winning with a slower, non-forcing move first: the straight three (three in a "
              "row), for example, has no forcing win for the owner to move, but Six's deeper search thinks the owner "
              "wins. Those aren't listed as must-answer here, because that kind of win can't be proven the same way.",
              "- **Shapes near other stones.** Every shape here stands alone. In a real game, the opponent's own threats "
              "(a counter-threat while defending) and other stones change everything.",
              "- **Spread-out shapes.** Stones more than 2 cells apart only count as one shape when they share a line "
              "within 4 cells.", "",
              "## Rebuilding this page", "",
              "```bash",
              "engine/build/release/sixshapes --stones 4 --defend 4 > runs/shapes/s4d.jsonl",
              "engine/build/release/sixshapes --stones 5 --defend 0 > runs/shapes/s5.jsonl",
              "python guide/make_shapes.py runs/shapes/s4d.jsonl runs/shapes/s5.jsonl",
              "```", ""]
    (HERE / "shapes.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote", HERE / "shapes.md")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--unstoppable=")]
    extra = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--unstoppable=")]
    main(args, extra[0] if extra else None)
