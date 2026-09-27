"""Builds guide/shapes.md, guide/shapes-catalog.md and their diagrams from sixshapes output.

  engine/build/release/sixshapes --stones 4 --defend 4 > runs/shapes/s4d.jsonl
  engine/build/release/sixshapes --stones 5 --defend 0 > runs/shapes/s5.jsonl
  engine/build/release/sixshapes --only runs/shapes/unstoppable4.txt --defend 4 --region 5 > runs/shapes/unstoppable4-r5.jsonl
  engine/build/release/sixshapes --line 0 0 0 1 1 0 > runs/shapes/lines.jsonl
  engine/build/release/sixshapes --refute -1 0 2 0 0 0 0 1 1 0 >> runs/shapes/lines.jsonl
  engine/build/release/sixshapes --refute -1 0 0 -1 0 0 0 1 1 -1 1 0 >> runs/shapes/lines.jsonl
  python guide/make_shapes.py runs/shapes/s4d.jsonl runs/shapes/s5.jsonl \
      --unstoppable=runs/shapes/unstoppable4-r5.jsonl --lines=runs/shapes/lines.jsonl

If it lists refutations it needs for the quiz answers, run each as `sixshapes --refute ...`, append the output to
runs/shapes/lines.jsonl and run it again.

The close-pair check (--pairblock=runs/shapes/pairblock.jsonl) is each close pair's finishes that the two ringed cells
don't take away, one per line as "pair and finish | ringed cells", run through
  engine/build/release/sixshapes --only runs/shapes/pairblock.txt --defend 4 --region 3 --first-hold 1
"""
import json
import math
import re
import sys
from collections import defaultdict
from itertools import combinations
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
        if len(shape_lines(s)) == 1 and all(on_axis(a, b) for a, b in combinations(s, 2)):
            line = sorted(s)
            gaps = sorted(dist(x, y) for x, y in zip(line, line[1:]))
            return "Three in a row" if gaps == [1, 1] else f"Line {gaps[0]}+{gaps[1]}"
        bend = arms(s)
        if bend:
            a, b, angle = bend
            return f"{'Triangle' if angle == 60 else 'Chevron'} {a}+{b}"
        a, b = next((a, b) for i, a in enumerate(s) for b in s[i + 1:] if on_axis(a, b))
        third = next(c for c in s if c not in (a, b))
        near, far = sorted((dist(third, a), dist(third, b)))
        return ("Pair" if dist(a, b) == 1 else "One-gap pair" if dist(a, b) == 2 else "Two-gap pair") + f" + 1 ({near},{far})"
    if len(s) == 4:
        d = sorted(dist(a, b) for i, a in enumerate(s) for b in s[i + 1:])
        if d == [1, 1, 1, 1, 1, 2]:
            return "Diamond (two triangles)"
    return ""


def arms(s):
    """For three stones: (short arm, long arm, angle) when two of them sit on lines from the third at 60 or 120 degrees."""
    for v in s:
        o = [x for x in s if x != v]
        if all(on_axis(v, x) for x in o):
            a = [pixel((x[0] - v[0], x[1] - v[1])) for x in o]
            c = (a[0][0] * a[1][0] + a[0][1] * a[1][1]) / math.hypot(*a[0]) / math.hypot(*a[1])
            angle = round(math.degrees(math.acos(max(-1.0, min(1.0, c)))))
            if angle in (60, 120):
                lo, hi = sorted(dist(v, x) for x in o)
                return lo, hi, angle
    return None


def shape_lines(s):
    """The lines through two or more of the shape's stones, each given by its two outermost stones."""
    lines = {}
    for i, a in enumerate(s):
        for b in s[i + 1:]:
            if on_axis(a, b):
                ident = ("q", a[0]) if a[0] == b[0] else ("r", a[1]) if a[1] == b[1] else ("s", a[0] + a[1])
                lines.setdefault(ident, set()).update((tuple(a), tuple(b)))
    return [(min(v), max(v)) for v in lines.values()]


def lines_through(c, s):
    """Which of the shape's lines c sits on, close enough to share a window of six with both stones."""
    out = []
    for k, (a, b) in enumerate(shape_lines(s)):
        (dq1, dr1), (dq2, dr2) = (b[0] - a[0], b[1] - a[1]), (c[0] - a[0], c[1] - a[1])
        if dq1 * dr2 == dr1 * dq2 and max(dist(a, c), dist(b, c), dist(a, b)) <= 5:
            out.append((k, "gap" if dist(a, c) + dist(c, b) == dist(a, b) else "end"))
    return out


def two_lines(pair, s):
    """One stone on each of two different lines of the shape."""
    a, b = ({k for k, _ in lines_through(tuple(c), s)} for c in pair)
    return any(x != y for x in a for y in b)


SIZE = 16
YELLOW = "#f6d04a"
BLUE = "#87d1f7"
EMPTY = "#1b2233"
BG = "#0b0e15"
AXES = ((1, 0), (0, 1), (1, -1))


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


def svg(shape, defense=(), first=(), margin=3, heat=None, numbered=None, six=(), frame=None, lines=(), rings=(),
        guides=(), canvas=None, off_line=(), inner=(), add=(), dashed=(), fresh=None):
    """One diagram. heat maps a cell to its share of holding replies (1 = holds alone); numbered maps a cell to
    (player, turn) for worked examples."""
    stones = [tuple(c) for c in shape]
    heat = heat or {}
    numbered = numbered or {}
    defense = [tuple(d) for d in defense]
    first = [tuple(c) for c in first]
    rings = [tuple(c) for c in rings]
    fresh = None if fresh is None else {tuple(c) for c in fresh}
    off_line = [tuple(c) for c in off_line]
    spread = list(frame) if frame else stones + list(numbered) + defense + first + list(heat) + rings + off_line
    pts = [pixel(c) for c in spread]
    pad = SIZE * math.sqrt(3) * (margin + 0.5)
    minx, maxx = min(p[0] for p in pts) - pad, max(p[0] for p in pts) + pad
    miny, maxy = min(p[1] for p in pts) - pad, max(p[1] for p in pts) + pad
    if canvas:  # grow to a shared size so a table's pictures line up
        dx, dy = max(0, canvas[0] - (maxx - minx)) / 2, max(0, canvas[1] - (maxy - miny)) / 2
        minx, maxx, miny, maxy = minx - dx, maxx + dx, miny - dy, maxy + dy
    # every hex whose centre falls inside the box, so spread-out shapes sit on a full board
    cells = {(q, r) for q in range(-40, 41) for r in range(-40, 41)
             if minx + SIZE * 0.6 <= pixel((q, r))[0] <= maxx - SIZE * 0.6 and miny + SIZE * 0.6 <= pixel((q, r))[1] <= maxy - SIZE * 0.6}
    w, h = maxx - minx, maxy - miny
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx:.0f} {miny:.0f} {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">',
           f'<rect x="{minx:.0f}" y="{miny:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{BG}"/>']
    shades = [v for v in heat.values() if v < 1]
    top = max(shades, default=1) or 1
    for c in sorted(cells):
        x, y = pixel(c)
        extra = ""
        if c in stones or numbered.get(c, ("",))[0] == "X":
            fill = YELLOW
        elif c in defense or numbered.get(c, ("",))[0] == "O":
            fill = BLUE
        elif c in heat and heat[c] >= 1:
            fill = BLUE
            extra = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{SIZE * 0.3:.1f}" fill="{BG}"/>'
        elif c in off_line:
            fill = EMPTY
            extra = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{SIZE * 0.34:.1f}" fill="{BLUE}"/>'
        elif c in heat:
            fill = f"rgba(135,209,247,{0.12 + 0.68 * heat[c] / top:.2f})"
        else:
            fill = EMPTY
        faded = fresh is not None and c in numbered and c not in fresh
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.92)}" fill="{fill}"'
                   + (' fill-opacity="0.4"' if faded else "") + "/>" + extra)
    for a, b in guides:
        a, b = pixel(tuple(a)), pixel(tuple(b))
        out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{BLUE}" stroke-width="2.5" '
                   'stroke-linecap="round" opacity="0.6"/>')
    for c in rings:
        x, y = pixel(c)
        on_fill = c in heat or c in defense or c in stones
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.72)}" fill="none" '
                   f'stroke="{"#ffffff" if on_fill else BLUE}" stroke-width="3"/>')
    for c in first:
        x, y = pixel(c)
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.66)}" fill="rgba(246,208,74,0.4)" stroke="{YELLOW}" stroke-width="3"/>')
    for c in inner:
        x, y = pixel(tuple(c))
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{SIZE * 0.34:.1f}" fill="none" stroke="{BG}" stroke-width="3"/>')
    for c in add:
        x, y = pixel(tuple(c))
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.7)}" fill="none" stroke="{YELLOW}" stroke-width="2.5" '
                   'stroke-dasharray="4 3"/>')
        out.append(f'<text x="{x:.1f}" y="{y + 5:.1f}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" '
                   f'font-weight="700" fill="{YELLOW}">+</text>')
    for a, b in list(lines) + ([(six[0], six[-1])] if six else []):
        a, b = pixel(tuple(a)), pixel(tuple(b))
        out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#ffffff" stroke-width="3" '
                   'stroke-linecap="round" opacity="0.85"/>')
    for a, b in dashed:
        a, b = pixel(tuple(a)), pixel(tuple(b))
        out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#ffffff" stroke-width="3" '
                   'stroke-dasharray="6 5" opacity="0.85"/>')
    for c, (who, turn) in numbered.items():
        if fresh is not None and who == "O" and c not in fresh:
            continue  # older blocks stay as plain blue stones
        x, y = pixel(c)
        out.append(f'<text x="{x:.1f}" y="{y + 4.5:.1f}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" '
                   f'font-weight="700" fill="{BG}" stroke="{YELLOW if who == "X" else BLUE}" stroke-width="3" '
                   f'paint-order="stroke"' + (' opacity="0.5"' if fresh is not None and c not in fresh else "")
                   + f'>{turn}</text>')
    out.append("</svg>")
    return "\n".join(out)


def legend(main=False):
    rows = [("stone", "The shape: the owner's stones"),
            ("first", "The owner's winning first turn"),
            ("reply", "The opponent's reply"),
            ("heat", "Defence map: bluer = used by more holding replies"),
            ("alone", "Holds on its own, whatever the second stone does"),
            ("offline", "Also holds on its own (not on the shape's lines)"),
            ("ring", "Ringed: the cells or stones the text points to"),
            ("number", "Worked examples: stones numbered by turn"),
            ("line", "A four or six (white; dashed: a three), a window of six (orange)"),
            ("guide", "A shape's lines (blue)"),
            ("add", "Add here: two stones that make a pair unstoppable"),
            ("inner", "A two-stone three inside a bigger shape")]
    if main:
        rows = [r for r in rows if r[0] not in ("heat", "inner", "offline")]
    else:
        rows = [r for r in rows if r[0] not in ("add", "inner", "number", "guide", "offline", "ring")]
    step = 38
    w = 520
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {len(rows) * step + 8}" width="{w}" height="{len(rows) * step + 8}">',
           f'<rect width="{w}" height="{len(rows) * step + 8}" fill="{BG}"/>']
    for i, (kind, text) in enumerate(rows):
        x, y = 24, 22 + i * step
        fill = {"stone": YELLOW, "reply": BLUE, "heat": "rgba(135,209,247,0.55)", "alone": BLUE}.get(kind, EMPTY)
        out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.92)}" fill="{fill}"/>')
        if kind == "first":
            out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.66)}" fill="rgba(246,208,74,0.25)" stroke="{YELLOW}" stroke-width="2.5"/>')
        if kind == "number":
            out[-1] = f'<polygon points="{hex_points(x, y, SIZE * 0.92)}" fill="{YELLOW}"/>'
            out.append(f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" '
                       f'font-weight="700" fill="{BG}">3</text>')
        if kind == "line":
            out.append(f'<line x1="{x - 14}" y1="{y}" x2="{x + 14}" y2="{y}" stroke="#ffffff" stroke-width="3"/>')
            out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.98)}" fill="none" stroke="#ff8a3d" stroke-width="2"/>')
        if kind == "ring":
            out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.66)}" fill="none" stroke="{BLUE}" stroke-width="2.5"/>')
        if kind == "guide":
            out[-1] = f'<line x1="{x - 16}" y1="{y}" x2="{x + 16}" y2="{y}" stroke="{BLUE}" stroke-width="2.5" opacity="0.6"/>'
        if kind == "add":
            out.append(f'<polygon points="{hex_points(x, y, SIZE * 0.7)}" fill="none" stroke="{YELLOW}" stroke-width="2.5" '
                       'stroke-dasharray="4 3"/>')
            out.append(f'<text x="{x}" y="{y + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" '
                       f'font-weight="700" fill="{YELLOW}">+</text>')
        if kind == "inner":
            out[-1] = f'<polygon points="{hex_points(x, y, SIZE * 0.92)}" fill="{YELLOW}"/>'
            out.append(f'<circle cx="{x}" cy="{y}" r="{SIZE * 0.34:.1f}" fill="none" stroke="{BG}" stroke-width="3"/>')
        if kind == "offline":
            out.append(f'<circle cx="{x}" cy="{y}" r="{SIZE * 0.34:.1f}" fill="{BLUE}"/>')
        if kind == "alone":
            out.append(f'<circle cx="{x}" cy="{y}" r="{SIZE * 0.3:.1f}" fill="{BG}"/>')
        out.append(f'<text x="50" y="{y + 5}" font-family="Arial, sans-serif" font-size="15" fill="#d9e1f2">{text}</text>')
    out.append("</svg>")
    return "\n".join(out)


def directions():
    """The three line directions the text names."""
    rows = [((1, 0), "horizontal"), ((1, -1), "up-right diagonal"), ((0, 1), "down-right diagonal")]
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 44" width="520" height="44">',
           f'<rect width="520" height="44" fill="{BG}"/>']
    for i, ((dq, dr), name) in enumerate(rows):
        x0, y0 = 20 + i * 170, 22
        ex, ey = pixel((dq, dr))
        k = 22 / math.hypot(ex, ey)
        out.append(f'<line x1="{x0 - ex * k:.1f}" y1="{y0 - ey * k:.1f}" x2="{x0 + ex * k:.1f}" y2="{y0 + ey * k:.1f}" '
                   'stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>')
        out.append(f'<text x="{x0 + 30}" y="{y0 + 5}" font-family="Arial, sans-serif" font-size="14" fill="#d9e1f2">{name}</text>')
    out.append("</svg>")
    return "\n".join(out)


def basics():
    """A triangle with its three lines, and one window of six."""
    shape = [(0, 0), (0, 1), (1, 0)]
    lines = [((-3, 0), (4, 0)), ((0, -3), (0, 4)), ((-2, 3), (3, -2))]
    window = [(-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (3, 0)]
    body = svg(shape, margin=1, guides=lines, frame=[(-3, 0), (4, 0), (0, -3), (0, 4), (-2, 3), (3, -2)])
    marks = []
    for c in window:
        x, y = pixel(c)
        marks.append(f'<polygon points="{hex_points(x, y, SIZE * 0.98)}" fill="none" stroke="#ff8a3d" stroke-width="2"/>')
    return body.replace("</svg>", "\n".join(marks) + "\n</svg>")


def uniform(draws):
    """Render a table's pictures at one shared size: each draw(canvas) returns (file name, svg text)."""
    first = [d(None) for d in draws]
    sizes = [tuple(float(v) for v in re.search(r'width="([\d.]+)" height="([\d.]+)"', text).groups()) for _, text in first]
    canvas = (max(w for w, _ in sizes), max(h for _, h in sizes))
    for d in draws:
        fname, text = d(canvas)
        (OUT / fname).write_text(text, encoding="utf-8")


def scaled(m):
    """Every diagram at the same hex size, whatever its board size."""
    fname, alt = m.group(1), m.group(2)
    width = float(re.search(r'width="([\d.]+)"', (OUT / fname).read_text(encoding="utf-8")).group(1))
    if fname in ("legend.svg", "legend-main.svg", "basics.svg", "directions.svg"):
        factor = 1
    elif "_four" in fname:
        factor = 0.7
    elif "_line" in fname or "_wrong" in fname or "_holds" in fname:
        factor = 1.05
    elif any(tag in fname for tag in ("_cheat", "_big", "_grow")):
        factor = 0.9
    else:
        factor = 0.75
    caps = {"_answer": 150, "_cheat": 180, "_grow": 150, "_big": 190, "_ways": 150, "_line": 260, "_wrongturn": 260, "_name": 110}
    shown = width * factor
    for tag, cap in caps.items():
        if tag in fname:
            shown = min(shown, cap)
    return f'<img src="shapes/{fname}" alt="{alt}" width="{round(shown)}">'


def name_file(shape, suffix=""):
    return "s" + "_".join(f"{q}x{r}".replace("-", "m") for q, r in shape) + suffix + ".svg"


def pct(a, b):
    p = 100 * a / b
    if 0 < p < 0.1:
        return "under 0.1%"
    return f"{p:.1f}%" if p < 10 else f"{p:.0f}%"


def plural(n, word, many=None):
    return f"{n:,} {word}" if n == 1 else f"{n:,} {many or word + 's'}"


def defence_stats(shape, d, radius):
    cells = region(shape, radius)
    per_cell = defaultdict(int)
    for pair in d["holding"]:
        for c in pair:
            per_cell[tuple(c)] += 1
    heat = {c: n / (len(cells) - 1) for c, n in per_cell.items()}
    alone = sorted(c for c, v in heat.items() if v >= 1)
    if alone:
        rest = defaultdict(int)
        for pair in d["holding"]:
            if not any(tuple(c) in alone for c in pair):
                for c in pair:
                    rest[tuple(c)] += 1
        top = max(rest.values(), default=1)
        heat = {c: 1.0 for c in alone} | {c: 0.99 * n / top for c, n in rest.items()}
    ranked = sorted(distinct_defenses(shape, d["holding"]), key=lambda pr: -sum(heat.get(tuple(c), 0) for c in pr))
    return heat, alone, ranked


def summary_line(r, radius=3, turns_shown=True):
    d = r["defenses"]
    shape = [tuple(c) for c in r["shape"]]
    _, alone, _ = defence_stats(shape, d, radius)
    turns = r["toMove"]["turns"]
    win = ("Six next turn · " if turns == 0 else f"Six on turn {turns + 1} · ") if turns_shown else ""
    share = f"{pct(len(d['holding']), d['tried'])} of replies hold"
    if alone:
        return f"**{win}{share} · one stone is enough on the {plural(len(alone), 'dotted cell')} in the map below**"
    rule = rule_pairs(shape)
    holding = {tuple(sorted(tuple(c) for c in pair)) for pair in d["holding"]}
    if rule and all(pair in holding for pair in rule):
        return f"**{win}{share} · needs both stones · all {len(rule)} two-lines pairs hold**"
    return f"**{win}{share} · needs both stones**"


def shape_block(r, label, extra_title="", radius=3, key_count=2, turns_shown=True):
    """One must-answer shape: the shape and its best replies side by side, the numbers, and the rest folded away."""
    shape = [tuple(c) for c in r["shape"]]
    fname = name_file(shape)
    (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", [])), encoding="utf-8")
    named = describe(shape)
    title = " · ".join(x for x in (label, named, extra_title) if x)
    d = r["defenses"]
    heat, alone, ranked = defence_stats(shape, d, radius)
    imgs = [f'<td align="center"><img src="shapes/{fname}" alt="{label}"><br>Winning first turn</td>']
    more = []
    for i, pair in enumerate(ranked[:6]):
        dname = name_file(shape, f"_d{i}")
        (OUT / dname).write_text(svg(shape, defense=pair), encoding="utf-8")
        if i < key_count:
            imgs.append(f'<td align="center"><img src="shapes/{dname}" alt="{label} holding reply {i + 1}"><br>'
                        f'Stops the forced win</td>')
        else:
            more.append(f'<img src="shapes/{dname}" alt="{label} holding reply {i + 1}">')
    hname = name_file(shape, "_map")
    (OUT / hname).write_text(svg(shape, heat=heat), encoding="utf-8")
    out = [f"### {title}", "", "<table><tr>" + "".join(imgs) + "</tr></table>", "", summary_line(r, radius, turns_shown), "",
           "<details><summary>Defence map and more holding replies</summary>", "",
           f'<img src="shapes/{hname}" alt="{label} defence map"> ' + " ".join(more), "", "</details>", ""]
    return out


def rule_pairs(shape):
    """The tight-three defence: one stone on each of two of the shape's lines, both within 2 cells of the shape."""
    near = sorted(c for c in region(shape, 2))
    return [(a, b) for i, a in enumerate(near) for b in near[i + 1:] if two_lines((a, b), shape)]


# --- worked examples -------------------------------------------------------------------------------------------------

def windows_with(cell):
    for dq, dr in AXES:
        for k in range(6):
            start = (cell[0] - dq * k, cell[1] - dr * k)
            yield tuple((start[0] + dq * i, start[1] + dr * i) for i in range(6))


def open_fours(xs, os):
    seen = set()
    for c in xs:
        for w in windows_with(c):
            if w not in seen and sum(x in xs for x in w) >= 4 and not any(x in os for x in w):
                seen.add(w)
    return seen


def cover(fours, taken):
    """Fewest stones that block every four (3 means more than two)."""
    if not fours:
        return 0
    cells = {c for w in fours for c in w if c not in taken}
    blocks = lambda chosen: all(any(c in chosen for c in w) for w in fours)
    if any(blocks({c}) for c in cells):
        return 1
    cells = sorted(cells)
    if any(blocks({a, b}) for i, a in enumerate(cells) for b in cells[i + 1:]):
        return 2
    return 3


LINE_NAMES = {(1, 0): "horizontal line", (0, 1): "down-right diagonal", (1, -1): "up-right diagonal"}


def by_line(fours):
    lines = defaultdict(list)
    for w in fours:
        axis = (w[1][0] - w[0][0], w[1][1] - w[0][1])
        # cells on one line share q (axis 0,1), r (axis 1,0) or q + r (axis 1,-1)
        lines[(axis, w[0][0] if axis == (0, 1) else w[0][1] if axis == (1, 0) else w[0][0] + w[0][1])].append(w)
    return lines


def line_names(fours):
    names = sorted({LINE_NAMES[(w[1][0] - w[0][0], w[1][1] - w[0][1])] for w in fours})
    return " and the ".join(names)


def line_extents(shape, cells):
    """Each of the shape's lines, drawn from end to end through its stones and the given cells."""
    out = []
    for k, (a, b) in enumerate(shape_lines(shape)):
        on = [a, b] + [c for c in cells if any(j == k for j, _ in lines_through(c, shape))]
        on.sort(key=lambda c: (c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1]))
        out.append((on[0], on[-1]))
    return out


def completion(pair, target):
    """Two cells that turn `pair` into a copy of the shape `target`, or None."""
    for f in TRANSFORMS:
        img = [f(c) for c in target]
        for i, j in ((i, j) for i in range(len(img)) for j in range(len(img)) if i != j):
            shift = (pair[0][0] - img[i][0], pair[0][1] - img[i][1])
            if (img[j][0] + shift[0], img[j][1] + shift[1]) == tuple(pair[1]):
                return [(c[0] + shift[0], c[1] + shift[1]) for k, c in enumerate(img) if k not in (i, j)]
    return None


def completions(pair, targets):
    """Every pair of cells that turns `pair` into a copy of one of the target shapes."""
    out = set()
    for target in targets:
        for f in TRANSFORMS:
            img = [f(c) for c in target]
            for i, j in ((i, j) for i in range(len(img)) for j in range(len(img)) if i != j):
                shift = (pair[0][0] - img[i][0], pair[0][1] - img[i][1])
                if (img[j][0] + shift[0], img[j][1] + shift[1]) == tuple(pair[1]):
                    out.add(tuple(sorted((c[0] + shift[0], c[1] + shift[1]) for k, c in enumerate(img) if k not in (i, j))))
    return out


NAME_STRIP = [([(0, 0), (0, 1), (1, 0)], "Triangle 1+1"), ([(0, 0), (0, 1), (3, 0)], "Triangle 1+3"),
              ([(0, 0), (0, 1), (1, -1)], "Chevron 1+1"), ([(0, 0), (0, 1), (2, -2)], "Chevron 1+2"),
              ([(0, 0), (0, 1), (1, -2)], "Pair + 1 (2,3)"), ([(0, 0), (0, 1), (0, 3)], "Line 1+2")]


def nonforced_results(survey_path, deep_path):
    """Every 2-4 stone shape with the defender moving first: forced (double threats), proven (with non-forced turns),
    contains (holds a proven shape) or open (with Six's rating), latest result per shape."""
    results = {}
    for path in (survey_path, deep_path):
        if not path or not Path(path).exists():
            continue
        for line in open(path, encoding="utf-8"):
            r = json.loads(line)
            k = canonical([tuple(c) for c in r["shape"]])
            old = results.get(k)
            if old and old["result"] in ("forced", "proven", "contains") and r["result"] == "open":
                continue
            merged = dict(old or {})
            merged.update(r)
            results[k] = merged
    # A shape holding a proven one is proven too (your own extra stones never hurt), even when the survey process that
    # tried it didn't know the smaller proof yet.
    won = {k for k, r in results.items() if r["result"] in ("forced", "proven", "contains")}
    for k, r in sorted(results.items(), key=lambda kr: len(kr[1]["shape"])):
        if r["result"] != "open":
            continue
        shape = [tuple(c) for c in r["shape"]]
        inside = next((t for n in range(2, len(shape)) for t in combinations(shape, n) if canonical(list(t)) in won), None)
        if inside:
            r.update(result="contains", inside=[list(c) for c in inside])
            won.add(k)
    return results


def open_reason(r):
    """Why a proof didn't settle an open shape: too many defences left, the time limit, a defence that held against
    every turn Six suggested, or no proof tried."""
    proof = r.get("proof")
    if isinstance(proof, dict) and "too_big" in proof:
        return "time" if str(proof["too_big"]).startswith("out of time") else "replies"
    return "held" if proof else "untried"


def owner_chance(r):
    """Six's rating of the defender (-1000 to 1000), as the owner's chance of winning."""
    v = r.get("six_defender")
    return None if v is None else 1 - (v / 1000 + 1) / 2


def natural_branch(proof, shape):
    """The branch of a proof for the defender's most natural reply (closest to the shape) and the owner's answer."""
    branches = proof.get("survive") or []
    if not branches:
        return None, None
    best = min(branches, key=lambda b: sum(min(dist(tuple(c), x) for x in shape) for c in b["O"]))
    return [tuple(c) for c in best["O"]], [tuple(c) for c in best["then"]["X"]]


def quiet_branch(proof, shape):
    """The most natural defence (closest to the shape) that the owner answers with a quiet turn, one making no four;
    the most natural defence of all if every answer is a four. Returns the defence, the answer and whether it's quiet."""
    branches = [b for b in proof.get("survive") or [] if "X" in b.get("then", {})]
    quiet = [b for b in branches
             if not open_fours(set(shape) | {tuple(c) for c in b["then"]["X"]}, {tuple(c) for c in b["O"]})]
    pool = quiet or branches
    if not pool:
        return None, None, False, False
    best = min(pool, key=lambda b: (sum(min(dist(tuple(c), x) for x in shape) for c in b["O"]), b["O"]))
    after = best["then"].get("then", {})
    # Settled: after the answer, no defender reply stops a win by double threats.
    settled = "survive" in after and not after["survive"]
    return [tuple(c) for c in best["O"]], [tuple(c) for c in best["then"]["X"]], bool(quiet), settled


def unified_unstoppable(forced_rows, results):
    """Every shape that wins with the defender moving first: the double-threat ones, the ones proven with a quiet
    move, and the ones containing either. Smallest and most compact first."""
    out, seen = [], set()
    for r in forced_rows:
        k = canonical([tuple(c) for c in r["shape"]])
        seen.add(k)
        out.append({"shape": r["shape"], "stones": len(r["shape"]), "kind": "double"})
    for k, r in results.items():
        if k in seen or r["result"] not in ("forced", "proven", "contains"):
            continue
        kind = {"forced": "double", "proven": "quiet", "contains": "contains"}[r["result"]]
        out.append({"shape": r["shape"], "stones": len(r["shape"]), "kind": kind, "proof": r.get("proof"),
                    "inside": r.get("inside")})
    spread = lambda e: sum(dist(tuple(a), tuple(b)) for a, b in combinations(e["shape"], 2))
    return sorted(out, key=lambda e: (e["stones"], e["kind"] == "contains", spread(e), e["shape"]))


def nonforced_section(results):
    """The catalogue's list of shapes no proof settled with the defender moving first."""
    by = defaultdict(lambda: defaultdict(list))
    for k, r in results.items():
        by[r["stones"]][r["result"]].append(r)

    phrases = {"replies": "too many defences survived to check them all", "time": "the proof ran out of time",
               "held": "a defence held against every turn Six suggested (within five turns)", "untried": "no proof was tried"}
    seen = {open_reason(r) for r in results.values() if r["result"] == "open"}
    cat = ["## Not proven", "",
           "Every shape of 2 to 4 stones that no proof settled with the defender moving first. Under each: Six's "
           "estimate of the owner's chance, and why there's no proof: "
           + "; ".join(phrases[k] for k in ("replies", "time", "held", "untried") if k in seen) + ".", ""]
    for n in sorted(by):
        rest = sorted(by[n]["open"], key=lambda r: -(owner_chance(r) or 0))
        if rest:
            cat += [f"### {n} stones", "",
                    "<details><summary>Not proven, by Six's estimate of the owner's chance</summary>", "", "<table>"]
            row = []
            for r in rest:
                shape = [tuple(x) for x in r["shape"]]
                fname = name_file(shape, "_open")
                (OUT / fname).write_text(svg(shape, margin=1), encoding="utf-8")
                ch = owner_chance(r)
                reason = {"replies": "too many defences", "time": "out of time", "held": "a defence held",
                          "untried": "not tried"}[open_reason(r)]
                row.append(f'<td align="center"><img src="shapes/{fname}" alt="shape"><br><sub>'
                           + (f"owner {ch:.0%}" if ch is not None else "not rated") + f"<br>{reason}</sub></td>")
                if len(row) == 6:
                    cat.append("<tr>" + "".join(row) + "</tr>")
                    row = []
            if row:
                cat.append("<tr>" + "".join(row) + "</tr>")
            cat += ["</table>", "", "</details>", ""]
    return cat


def quiz(tight, loose, fours, labels, refutes, reach, rows, cells_of, needed, u_canon=None, inside=None):
    """Five questions: three 'which reply holds', one 'which three is must-answer', one 'which pair can't grow'."""
    out = ["## Test yourself", "", "The answer is folded under each question.", ""]

    def pick(shape, candidates, holding):
        return next((p for p in candidates if tuple(sorted(p)) not in holding), None)

    cases = []
    chevron = next(r for r in tight if describe(cells_of(r)).startswith("Chevron 1+1"))
    shape = cells_of(chevron)
    holding = {tuple(sorted(tuple(c) for c in p)) for p in chevron["defenses"]["holding"]}
    same_line = [p for p in combinations(sorted(region(shape, 1)), 2)
                 if {k for k, _ in lines_through(p[0], shape)} & {k for k, _ in lines_through(p[1], shape)}]
    too_far = [p for p in combinations(sorted(region(shape, 3)), 2)
               if two_lines(p, shape) and max(min(dist(c, x) for x in shape) for c in p) == 3]
    cases.append((chevron, rule_pairs(shape)[0], pick(shape, sorted(too_far, key=lambda pr: sum(min(dist(c, x) for x in shape) for c in pr)), holding) or pick(shape, same_line, holding),
                  "one stone on each of two of its lines, both within 2 cells, and every such pair holds. The other "
                  "reply looks the same, but one stone is 3 cells out: some pairs like that hold, this one doesn't"))
    for r in loose:
        shape = cells_of(r)
        alone = defence_stats(shape, r["defenses"], 3)[1]
        gap = next((c for c in alone if on_shape_gap(c, shape)), None)
        if gap:
            break
    holding = {tuple(sorted(tuple(c) for c in p)) for p in r["defenses"]["holding"]}
    off = [p for p in combinations(sorted(region(shape, 1)), 2)
           if not lines_through(p[0], shape) and not lines_through(p[1], shape)]
    partner = next(c for c in sorted(region(shape, 1)) if c != gap and not lines_through(c, shape))
    cases.append((r, (gap, partner), pick(shape, off, holding),
                  "one stone in a gap on one of its lines is enough. The other reply hugs the shape and looks solid, but "
                  "neither stone is on any of the shape's lines"))
    solid = fours[0]
    shape = cells_of(solid)
    holding = {tuple(sorted(tuple(c) for c in p)) for p in solid["defenses"]["holding"]}
    a, b = shape_lines(shape)[0]
    step = ((b[0] - a[0]) // max(1, dist(a, b)), (b[1] - a[1]) // max(1, dist(a, b)))
    end = max(shape, key=lambda c: (c[0] - a[0]) * step[0] + (c[1] - a[1]) * step[1])
    one_end = [((end[0] + step[0], end[1] + step[1]), (end[0] + 2 * step[0], end[1] + 2 * step[1]))]
    clean = min(sorted(holding), key=lambda pr: sum(min(dist(c, x) for x in shape) for c in pr))
    cases.append((solid, clean, pick(shape, one_end, holding),
                  f"a solid four needs a stone at each end; it's one of only {len(holding)} replies that hold. Two stones "
                  "at one end leave the other end open"
                  + (f". In open space it still wins later, since it contains {inside(shape)}: the block only stops the six"
                     if inside and inside(shape) else "")))

    for n, (r, good, wrong, why) in enumerate(cases, 1):
        shape = cells_of(r)
        first_is_good = n % 2 == 0
        a, b = (good, wrong) if first_is_good else (wrong, good)
        label = labels.get(canonical(shape), "F1")
        name = describe(shape) if len(shape) == 3 else "solid four"
        cells = []
        for tag, pair in (("A", a), ("B", b)):
            fname = name_file(shape, f"_quiz{tag}")
            (OUT / fname).write_text(svg(shape, defense=pair, margin=1, frame=shape + list(a) + list(b)), encoding="utf-8")
            cells.append(f'<td align="center"><img src="shapes/{fname}" alt="Reply {tag}"><br><b>{tag}</b></td>')
        refute = refutes.get((key(shape), key(wrong)))
        answer = [f"**{'A' if first_is_good else 'B'}** holds: {why}."]
        if refute:
            x_first = [tuple(c) for c in refute["turns"][1]["stones"]]
            fname = name_file(shape, "_quizwin")
            far = [c for c in wrong if min(dist(c, x) for x in shape) > 2]
            (OUT / fname).write_text(svg(shape, defense=wrong, first=x_first, rings=far, margin=1), encoding="utf-8")
            answer += ["", f'<img src="shapes/{fname}" alt="The winning reply">', "",
                       (f"After the other reply, X wins starting here (outlined), with six on turn {x_turns}."
                        if (x_turns := sum(1 for t in refute['turns'] if t['player'] == 'X')) > 1 else
                        "After the other reply, X makes six right away (outlined).")
                       + (" The ringed stone is the one 3 cells out." if far else "")]
        else:
            needed.append(" ".join(f"{q} {r2}" for q, r2 in list(wrong) + shape))
        out += [f"**{n}. {label} · {name}: which reply holds?**", "", "<table><tr>" + "".join(cells) + "</tr></table>", "",
                "<details><summary>Answer</summary>", ""] + answer + ["", "</details>", ""]

    # which three must be answered? A three on one line that's too spread out, against the triangle 1+3
    spread = next((r for r in rows if r["stones"] == 3 and not r["toMove"]["win"]
                   and canonical(cells_of(r)) == canonical([(0, 0), (0, 2), (0, 4)])), None)
    spread = spread or next(r for r in rows if r["stones"] == 3 and not r["toMove"]["win"] and len(shape_lines(cells_of(r))) == 1)
    triangle = next(r for r in tight if describe(cells_of(r)) == "Triangle 1+3")
    cells = []
    for tag, r in (("A", spread), ("B", triangle)):
        fname = name_file(cells_of(r), f"_quiz{tag}")
        (OUT / fname).write_text(svg(cells_of(r), margin=1), encoding="utf-8")
        cells.append(f'<td align="center"><img src="shapes/{fname}" alt="Shape {tag}"><br><b>{tag}</b></td>')
    out += [f"**{len(cases) + 1}. Which one needs the cheat-sheet reply right now?**", "",
            "<table><tr>" + "".join(cells) + "</tr></table>", "",
            "<details><summary>Answer</summary>", "",
            f"**B**, the triangle 1+3 ({labels[canonical(cells_of(triangle))]}): its owner has a forced win if you "
            f"don't. The {describe(cells_of(spread)).lower()} (A) has no forced win yet. Treat it as close pairs: take the "
            "ringed cells of its most dangerous pair (neighbours or a one-gap pair first, as in step 6).", "",
            f'<img src="shapes/{name_file(cells_of(triangle), "_quizfix")}" alt="The reply for B">', "",
            "The cheat-sheet reply for B: one stone on each of two of its lines.", "",
            "</details>", ""]
    (OUT / name_file(cells_of(triangle), "_quizfix")).write_text(
        svg(cells_of(triangle), defense=rule_pairs(cells_of(triangle))[0], margin=1), encoding="utf-8")

    # which one is proven unstoppable? Three in a row, against a must-answer three nobody proved unstoppable
    u_canon = u_canon or {}
    row3 = [(0, 0), (0, 1), (0, 2)]
    open_tight = [cells_of(r) for r in tight if canonical(cells_of(r)) not in u_canon]
    other = next((sh for sh in open_tight if describe(sh) == "Triangle 1+1"), open_tight[0] if open_tight else None)
    if canonical(row3) in u_canon and other:
        cells = []
        for tag, shape in (("A", other), ("B", row3)):
            fname = name_file(shape, f"_quiz{tag}")
            (OUT / fname).write_text(svg(shape, margin=1, frame=[(0, -1), (0, 3), (1, 0)]), encoding="utf-8")
            cells.append(f'<td align="center"><img src="shapes/{fname}" alt="Shape {tag}"><br><b>{tag}</b></td>')
        out += [f"**{len(cases) + 2}. You move first. Which one is proven to win for its owner anyway, in open space?**",
                "", "<table><tr>" + "".join(cells) + "</tr></table>", "",
                "<details><summary>Answer</summary>", "",
                f"**B**, three in a row ({u_canon[canonical(row3)]}): whatever two stones you place within 5 cells, its "
                f"owner still wins (see [Unstoppable shapes](#unstoppable-shapes)). The {describe(other).lower()} (A) is "
                "must-answer, but the two-lines defence stops its forced win, and no non-forced win was proven.",
                "", f'<img src="shapes/{name_file(row3, "_nf")}" alt="Three in a row, a defence and the answer">', "",
                "</details>", ""]
    return out


def on_shape_gap(c, shape):
    return any(kind == "gap" for _, kind in lines_through(c, shape))


def cheat_table(group, labels, kind):
    cells = []
    draws = []
    for r in group:
        shape = [tuple(c) for c in r["shape"]]
        label = labels[canonical(shape)]
        _, alone, ranked = defence_stats(shape, r["defenses"], 3)
        fname = name_file(shape, "_cheat")
        rule_cells = {c for pair in rule_pairs(shape) for c in pair}
        if kind == "tight":
            draws.append(lambda canvas, shape=shape, fname=fname, rule_cells=rule_cells: (
                fname, svg(shape, rings=rule_cells, guides=line_extents(shape, rule_cells), margin=1, canvas=canvas)))
        else:
            ruled = [c for c in alone if any(kind == "gap" or min(dist(c, a), dist(c, b)) <= 2
                                             for k, kind in lines_through(c, shape)
                                             for a, b in [shape_lines(shape)[k]])]
            draws.append(lambda canvas, shape=shape, fname=fname, alone=alone, ruled=ruled: (
                fname, svg(shape, heat={c: 1.0 for c in alone}, rings=ruled, margin=1, canvas=canvas)))
        d = r["defenses"]
        action = (("3 lines: pick any two" if len(shape_lines(shape)) == 3 else "2 lines: one stone on each")
                  if kind == "tight" else plural(len(alone), "one-stone cell"))
        cells.append(f'<td align="center"><img src="shapes/{fname}" alt="{label}" width="130"><br><b>{label}</b> · '
                     f'{describe(shape)}<br><sub>{action}</sub></td>')
    uniform(draws)
    rows = ["<tr>" + "".join(cells[i:i + 4]) + "</tr>" for i in range(0, len(cells), 4)]
    return "<table>" + "".join(rows) + "</table>"


def stone_span(cells, xs):
    """The first and last of the owner's stones among `cells`, in line order."""
    on = sorted((c for c in set(cells) if c in xs), key=lambda c: (c[0], c[1]))
    return on[0], on[-1]


def narrate(shape, turns):
    """Per X turn: its text, its stones, the lines to draw, and the stones on the board after it."""
    xs, os = set(shape), set()
    numbered = {}
    frames = []  # (numbered after this X turn, fresh cells, lines, dashed, six, caption, text)
    xturn = key_move = 0
    said = False
    last_block = []
    for i, t in enumerate(turns):
        cells = [tuple(c) for c in t["stones"]]
        if t["player"] == "O":
            last_block = cells
            os |= set(cells)
            for c in cells:
                numbered[c] = ("O", xturn if xturn else "")
            continue
        xturn += 1
        before = set(xs)
        xs |= set(cells)
        bright = cells + last_block
        for c in cells:
            numbered[c] = ("X", xturn)
        if i == len(turns) - 1:
            six = next(w for c in cells for w in windows_with(c) if all(x in xs for x in w))
            frames.append((dict(numbered), bright, [], [], six, f"X{xturn}: six in a row", f"**X{xturn}:** six in a row."))
            continue
        fours = open_fours(xs, os)
        if not fours:
            frames.append((dict(numbered), bright, [], [], (), f"X{xturn}: a quiet move", f"**X{xturn}:** a quiet move."))
            continue
        need = cover(fours, xs | os)
        groups = by_line(fours)
        spans = [stone_span([c for w in ws for c in w], xs) for ws in groups.values()]
        if need >= 3:
            open_cells = sorted({c for w in fours for c in w if c not in xs and c not in os})
            blocks = next(list(t) for n in range(1, 5) for t in combinations(open_cells, n)
                          if all(any(c in t for c in w) for w in fours))
            parts = [f"the {LINE_NAMES[axis]} takes {plural(cover(ws, xs | os), 'stone')}"
                     for (axis, _), ws in sorted(groups.items())]
            text = (f"**X{xturn}:** threats on two lines: {' and '.join(parts)} to block. That's more than O's two "
                    "stones.")
            frames.append((dict(numbered), bright, spans, [], (), f"X{xturn}: blocking takes {len(blocks)} stones (one way ringed)", text,
                           blocks))
            continue
        best = max(fours, key=lambda w: sum(c in xs for c in w))
        old = sum(c in before for c in best)
        built = {w for c in cells for w in windows_with(c) if sum(x in xs for x in w) == 3 and not any(x in os for x in w)}
        built_lines = {LINE_NAMES[(w[1][0] - w[0][0], w[1][1] - w[0][1])] for w in built} - {line_names(fours)}
        three = [stone_span(w, xs) for w in built if LINE_NAMES[(w[1][0] - w[0][0], w[1][1] - w[0][1])] in built_lines][:1]
        extra = f" It also lines up three on the {' and the '.join(sorted(built_lines))}." if built_lines else ""
        if built_lines:
            key_move = xturn
        if not said:
            text = (f"**X{xturn}:** a four on the {line_names(fours)}: {plural(old, 'stone')} already there plus two new "
                    f"ones. It takes both of O's stones to block.{extra}")
            said = True
        else:
            text = f"**X{xturn}:** another four ({line_names(fours)}), another two stones for O.{extra}"
        caption = f"X{xturn}: a four" + (" and a new three (dashed)" if built_lines else "") + f" · {line_names(fours)}"
        frames.append((dict(numbered), bright, spans, three, (), caption, text))
    return frames, numbered, key_move, xturn


def turn_grid(shape, frames, numbered, stem, columns=3):
    """One small picture per X turn: that turn's stones bright, earlier ones dimmed, its lines drawn."""
    frame = shape + list(numbered)
    cells, draws = [], []
    for k, (stones, fresh, spans, three, six, caption, _, *rest) in enumerate(frames):
        fname = name_file(shape, f"{stem}{k}")
        draws.append(lambda canvas, fname=fname, stones=stones, fresh=fresh, spans=spans, three=three, six=six, rest=rest: (
            fname, svg(shape, numbered=stones, fresh=fresh, lines=spans, dashed=three, six=six, margin=1, frame=frame,
                       rings=rest[0] if rest else (), canvas=canvas)))
        cells.append(f'<td align="center" valign="top"><img src="shapes/{fname}" alt="{caption}"><br><sub>{caption}</sub></td>')
    uniform(draws)
    rows = ["<tr>" + "".join(cells[i:i + columns]) + "</tr>" for i in range(0, len(cells), columns)]
    return "<table>" + "".join(rows) + "</table>"


def worked_example(line, label, name):
    shape = [tuple(c) for c in line["shape"]]
    frames, numbered, key_move, xturn = narrate(shape, line["turns"])
    lesson = (f" The key move is X{key_move}: its four also lines up three stones on a second line, which becomes part "
              f"of the unblockable threats on turn {xturn - 1}." if key_move else "")
    return ([f"### How the {name} wins ({label})", "",
             '<img src="shapes/directions.svg" alt="The three line directions">', "",
             turn_grid(shape, frames, numbered, "_line"), "",
             f"Every turn is a four that takes both of O's stones, so O never builds anything. On turn {xturn - 1} the "
             f"threats need three stones to block, and O has two.{lesson}", "",
             "<details><summary>Turn by turn</summary>", ""]
            + [f"{i + 1}. {f[6]}" for i, f in enumerate(frames)] + ["", "</details>", ""])


def defence_example(line, title, wrong_caption, holding, holding_caption, text):
    """A reply that loses and the owner's win after it (turn by turn, folded), and optionally a reply that holds."""
    shape = [tuple(c) for c in line["shape"]]
    frames, numbered, _, xturn = narrate(shape, line["turns"])
    wrong = [tuple(c) for c in line["turns"][0]["stones"]]
    frame = shape + list(numbered)
    box = shape + wrong + (list(holding) if holding else [])
    pictures = [("_wrong0", svg(shape, defense=wrong, margin=2, frame=box), wrong_caption)]
    if holding:
        pictures.append(("_holds", svg(shape, defense=holding, guides=line_extents(shape, holding), margin=2, frame=box),
                         holding_caption))
    cells = []
    for suffix, body, caption in pictures:
        fname = name_file(shape, suffix)
        (OUT / fname).write_text(body, encoding="utf-8")
        cells.append(f'<td align="center"><img src="shapes/{fname}" alt="{caption}"><br>{caption}</td>')
    return ([f"### {title}", "", "<table><tr>" + "".join(cells) + "</tr></table>", "",
             text + f" After the losing reply, X makes six on turn {xturn}.", "",
             "<details><summary>Turn by turn after the reply</summary>", "",
             turn_grid(shape, frames, numbered, "_wrongturn"), ""]
            + [f"{i + 1}. {f[6]}" for i, f in enumerate(frames)] + ["", "</details>", ""])


def main(paths, unstoppable_path=None, lines_path=None, pairblock_path=None, survey_path=None, deep_path=None):
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
    examples, refutes = {}, {}
    if lines_path:
        for line in open(lines_path, encoding="utf-8"):
            r = json.loads(line)
            if r["turns"][0]["player"] == "O":
                refutes[(key(tuple(c) for c in r["shape"]), key(tuple(c) for c in r["turns"][0]["stones"]))] = r
            else:
                examples[canonical([tuple(c) for c in r["shape"]])] = r
    # finishes of a close pair checked with the opponent's stones on the two ringed cells
    blocked = defaultdict(lambda: [0, 0])
    if pairblock_path:
        for line in open(pairblock_path, encoding="utf-8"):
            r = json.loads(line)
            d = r.get("defenses")
            still = r["toMove"]["win"] and d and not d["holding"] and not d["unknown"]
            k = canonical([tuple(c) for c in r["shape"][:2]])
            blocked[k][0] += 1
            blocked[k][1] += bool(still)
    rows = list(rows.values())
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    (OUT / "legend.svg").write_text(legend(), encoding="utf-8")
    (OUT / "legend-main.svg").write_text(legend(main=True), encoding="utf-8")
    (OUT / "basics.svg").write_text(basics(), encoding="utf-8")
    (OUT / "directions.svg").write_text(directions(), encoding="utf-8")
    draws = [lambda canvas, sh=sh: (name_file(sh, "_name"), svg(sh, margin=1, canvas=canvas)) for sh, _ in NAME_STRIP]
    uniform(draws)
    wins = {canonical([tuple(c) for c in r["shape"]]) for r in rows if r["toMove"]["win"]}

    def cells_of(r):
        return [tuple(c) for c in r["shape"]]

    def minimal(r):
        s = cells_of(r)
        return not any(canonical(s[:i] + s[i + 1:]) in wins for i in range(len(s)))

    def unstoppable(r):
        d = r.get("defenses")
        return bool(d) and not d["holding"] and not d["unknown"]

    def hardest(group):
        return sorted(group, key=lambda r: (len(r["defenses"]["holding"]) / r["defenses"]["tried"], r["shape"]))

    def most_in_window(r):
        shape = cells_of(r)
        return max(sum(x in shape for x in w) for c in shape for w in windows_with(c))

    counts = defaultdict(lambda: [0, 0, 0, 0])
    for r in rows:
        c = counts[r["stones"]]
        c[0] += 1
        if r["toMove"]["win"]:
            c[1] += 1
            c[2] += minimal(r)
            c[3] += unstoppable(r)

    def family_order(r):
        shape = cells_of(r)
        bend = arms(shape)
        return (0 if bend and bend[2] == 60 else 1 if bend else 2, sum(bend[:2]) if bend else 0, bend[:2] if bend else (),
                describe(shape))

    threes = [r for r in rows if r["stones"] == 3 and r["toMove"]["win"]]
    tight = sorted((r for r in threes if not defence_stats(cells_of(r), r["defenses"], 3)[1]), key=family_order)
    loose = sorted((r for r in threes if defence_stats(cells_of(r), r["defenses"], 3)[1]), key=family_order)
    threes = tight + loose
    a_label = {canonical(cells_of(r)): f"A{i}" for i, r in enumerate(threes, 1)}
    lab = lambda group: [a_label[canonical(cells_of(r))] for r in group]
    def span(labels):
        nums = [int(x[1:]) for x in labels]
        if nums == list(range(nums[0], nums[0] + len(nums))):
            return f"{labels[0]}–{labels[-1]}" if len(labels) > 1 else labels[0]
        return ", ".join(labels)
    two_line = [a_label[canonical(cells_of(r))] for r in threes if rule_pairs(cells_of(r))]
    # Every four (four stones in one window: six next turn), and the minimal 4-stone must-answer shapes besides.
    in_window = hardest([r for r in rows if r["stones"] == 4 and r["toMove"]["win"] and r["toMove"]["turns"] == 0])
    others = hardest([r for r in rows if r["stones"] == 4 and r["toMove"]["win"] and r["toMove"]["turns"] > 0
                      and minimal(r) and not unstoppable(r)])
    others = [r for r in others if most_in_window(r) == 3] + [r for r in others if most_in_window(r) < 3]
    unstop = sorted((r for r in rows if unstoppable(r) and (not confirmed or key(cells_of(r)) in confirmed)),
                    key=lambda r: (sum(dist(a, b) for a, b in combinations(cells_of(r), 2)), r["shape"]))
    solid = min(in_window, key=lambda r: len(r["defenses"]["holding"]), default=None)
    pairs = sorted((r for r in rows if r["stones"] == 2), key=lambda r: r["shape"])
    reach = []
    for r in pairs:
        pair = cells_of(r)
        grows = [f"U{i}" for i, u in enumerate(unstop, 1)
                 if any(canonical(list(t)) == canonical(pair) for t in combinations(cells_of(u), 2))]
        reach.append((pair, grows))
    close_pairs = sum(1 for _, g in reach if g)
    turns3 = {r["toMove"]["turns"] for r in threes}

    needed = []
    cut_shares = []
    # 4-stone shapes holding a must-answer three (not fours, not unstoppable), and how often the cheat-sheet reply for a
    # two-stone three inside one still holds
    clusters = [r for r in rows if r["stones"] == 4 and r["toMove"]["win"] and r["toMove"]["turns"] > 0
                and not minimal(r) and r["defenses"]["holding"]]
    tight_keys = {canonical(cells_of(r)) for r in tight}
    inside_tried = inside_held = 0
    # The same replies split by whether a stone sits on a line of the cluster that runs through its fourth stone.
    through = {True: [0, 0], False: [0, 0]}

    def on_segment(c, a, b):
        return c in (a, b) or (on_axis(a, c) and on_axis(b, c) and dist(a, c) + dist(c, b) == dist(a, b))

    for r in clusters:
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        cluster_lines = shape_lines(shape)
        for t in combinations(shape, 3):
            if canonical(list(t)) not in tight_keys:
                continue
            fourth = next(c for c in shape if c not in t)
            via = {k for k, (a, b) in enumerate(cluster_lines) if on_segment(fourth, a, b)}
            for pr in rule_pairs(list(t)):
                pr = tuple(sorted(pr))
                if pr[0] not in shape and pr[1] not in shape:
                    inside_tried += 1
                    inside_held += pr in hold
                    hit = any(k in via for c in pr for k, _ in lines_through(c, shape))
                    through[hit][0] += 1
                    through[hit][1] += pr in hold
    inside_pct = round(100 * inside_held / inside_tried) if inside_tried else 0
    through_pct = {k: round(100 * h / n) if n else 0 for k, (n, h) in through.items()}
    # The quick rule as the page states it: one stone on a line joining the fourth stone to another of the shape's
    # stones, within 2 cells of the fourth stone. How often it holds, in how many shapes it can be used, and an example.
    def joins_fourth(c, fourth, shape):
        if c in shape or dist(c, fourth) > 2 or not on_axis(c, fourth):
            return False
        dq, dr = c[0] - fourth[0], c[1] - fourth[1]
        return any(o != fourth and on_axis(o, fourth) and (o[0] - fourth[0]) * dr == (o[1] - fourth[1]) * dq for o in shape)

    quick = [0, 0]
    usable = total_tight = 0
    quick_example = None
    for r in clusters:
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        can = has = False
        for t in combinations(shape, 3):
            if canonical(list(t)) not in tight_keys:
                continue
            has = True
            fourth = next(c for c in shape if c not in t)
            for pr in rule_pairs(list(t)):
                pr = tuple(sorted(pr))
                if pr[0] in shape or pr[1] in shape or not any(joins_fourth(c, fourth, shape) for c in pr):
                    continue
                quick[0] += 1
                quick[1] += pr in hold
                can = True
                if pr in hold and quick_example is None and describe(list(t)).startswith("Triangle 1+1"):
                    quick_example = (shape, fourth, pr)
        total_tight += has
        usable += can
    # A one-stone three inside a four-stone shape: do its dotted cells still hold on their own, and with a second stone
    # placed like the quick rule's?
    single = [0, 0]
    paired = [0, 0]
    anywhere = [0, 0]
    loose_rows = {canonical(cells_of(r)): r for r in loose}
    for r in clusters:
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        cluster_alone = set(defence_stats(shape, r["defenses"], 3)[1])
        for t in combinations(shape, 3):
            inner = loose_rows.get(canonical(list(t)))
            if not inner:
                continue
            fourth = next(c for c in shape if c not in t)
            near = [c for c in region(shape, 2) if joins_fourth(c, fourth, shape)]
            # the inner three's cells, mapped onto this copy of it
            for f in TRANSFORMS:
                img = [f(c) for c in cells_of(inner)]
                shift = (min(t)[0] - min(img)[0], min(t)[1] - min(img)[1])
                if sorted((c[0] + shift[0], c[1] + shift[1]) for c in img) == sorted(t):
                    for c in defence_stats(cells_of(inner), inner["defenses"], 3)[1]:
                        cell = (f(c)[0] + shift[0], f(c)[1] + shift[1])
                        if cell in shape:
                            continue
                        single[0] += 1
                        single[1] += cell in cluster_alone
                        for d in near:
                            if d != cell:
                                paired[0] += 1
                                paired[1] += tuple(sorted((cell, d))) in hold
                        for d in region(shape, 3):
                            if d != cell and d not in shape:
                                anywhere[0] += 1
                                anywhere[1] += tuple(sorted((cell, d))) in hold
                    break
    single_pct = round(100 * single[1] / single[0]) if single[0] else 0
    paired_pct = round(100 * paired[1] / paired[0]) if paired[0] else 0
    anywhere_pct = round(100 * anywhere[1] / anywhere[0]) if anywhere[0] else 0

    spread_out = [r for r in others if most_in_window(r) < 3]
    two_pairs = len(spread_out)
    plus_patterns = len([r for r in others if most_in_window(r) == 3])
    ring_for = {}
    for pair, grows in reach:
        if grows:
            ways = completions(pair, [cells_of(u) for u in unstop])
            ring_for[canonical(pair)] = (pair, max(combinations(sorted({c for w in ways for c in w}), 2),
                                                   key=lambda ab: (sum(1 for w in ways if ab[0] in w or ab[1] in w), ab)))

    def ringed_holds(r):
        """Some close pair of the shape, answered with its ringed cells (in either orientation), holds."""
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        for a, b in combinations(shape, 2):
            entry = ring_for.get(canonical([a, b]))
            if not entry:
                continue
            base, ring = entry
            for f in TRANSFORMS:
                img = [f(c) for c in base]
                for x, y in ((a, b), (b, a)):
                    shift = (x[0] - img[0][0], x[1] - img[0][1])
                    if (img[1][0] + shift[0], img[1][1] + shift[1]) == y:
                        mapped = tuple(sorted((f(c)[0] + shift[0], f(c)[1] + shift[1]) for c in ring))
                        if mapped in hold:
                            return True
        return False

    spread_ok = sum(ringed_holds(r) for r in spread_out)
    spread_pairs = spread_pairs_ok = 0
    for r in spread_out:
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        for a, b in combinations(shape, 2):
            entry = ring_for.get(canonical([a, b]))
            if not entry:
                continue
            spread_pairs += 1
            base, ring = entry
            works = False
            for f in TRANSFORMS:
                img = [f(c) for c in base]
                for x, y in ((a, b), (b, a)):
                    shift = (x[0] - img[0][0], x[1] - img[0][1])
                    if (img[1][0] + shift[0], img[1][1] + shift[1]) == y:
                        works |= tuple(sorted((f(c)[0] + shift[0], f(c)[1] + shift[1]) for c in ring)) in hold
            spread_pairs_ok += works
    closest_ok = 0
    for r in spread_out:
        shape = cells_of(r)
        hold = {tuple(sorted(tuple(c) for c in pr)) for pr in r["defenses"]["holding"]}
        close = [(a, b) for a, b in combinations(shape, 2) if canonical([a, b]) in ring_for]
        if not close:
            continue
        a, b = min(close, key=lambda ab: (dist(*ab), on_axis(*ab), ab))
        base, ring = ring_for[canonical([a, b])]
        works = False
        for f in TRANSFORMS:
            img = [f(c) for c in base]
            for x, y in ((a, b), (b, a)):
                shift = (x[0] - img[0][0], x[1] - img[0][1])
                if (img[1][0] + shift[0], img[1][1] + shift[1]) == y:
                    works |= tuple(sorted((f(c)[0] + shift[0], f(c)[1] + shift[1]) for c in ring)) in hold
        closest_ok += works
    minimal_one_stone = sum(1 for r in others if defence_stats(cells_of(r), r["defenses"], 3)[1])
    unholdable4 = sum(1 for r in rows if r["stones"] == 4 and unstoppable(r))
    wins3 = {canonical(cells_of(r)) for r in rows if r["stones"] == 3 and r["toMove"]["win"]}
    plus_all = [r for r in rows if r["stones"] == 4 and most_in_window(r) == 3
                and not any(canonical(list(t)) in wins3 for t in combinations(cells_of(r), 3))]
    plus_must = sum(1 for r in plus_all if r["toMove"]["win"])
    if quick_example:
        ex_shape, ex_fourth, ex_pair = quick_example
        (OUT / name_file(ex_shape, "_quick")).write_text(svg(ex_shape, defense=ex_pair, rings=[ex_fourth], margin=1),
                                                          encoding="utf-8")

    # --- main page ---------------------------------------------------------------------------------------------------
    nf = nonforced_results(survey_path, deep_path) if survey_path else {}
    unified = unified_unstoppable(unstop, nf)
    u_label = {key(cells_of(r)): f"U{i}" for i, r in enumerate(unified, 1)}
    u_canon = {canonical(cells_of(r)): f"U{i}" for i, r in enumerate(unified, 1)}
    TAG = {"double": "forced win", "quiet": "non-forced win"}

    def smaller_inside(shape):
        """The label of the smallest unstoppable shape inside this one, if any."""
        for n in range(2, len(shape)):
            found = sorted(u_canon[canonical(list(t))] for t in combinations(shape, n) if canonical(list(t)) in u_canon)
            if found:
                return min(found, key=lambda x: int(x[1:]))
        return None

    # The featured ones win by double threats and hold no smaller unstoppable shape.
    featured = [e for e in unified if e["kind"] == "double" and not smaller_inside(cells_of(e))][:4]
    # the close pairs' finishes, named by the merged list's labels
    reach = [(pair, sorted((u_label[key(cells_of(u))] for u in unstop
                            if any(canonical(list(t)) == canonical(pair) for t in combinations(cells_of(u), 2))),
                           key=lambda x: int(x[1:])))
             for pair, _ in reach]
    is_tight = lambda t: canonical(list(t)) in a_label and int(a_label[canonical(list(t))][1:]) <= len(tight)

    def u_cell(r, suffix="", canvas=None):
        shape = cells_of(r)
        fname = name_file(shape, suffix)
        (OUT / fname).write_text(svg(shape, margin=1, canvas=canvas), encoding="utf-8")
        named = describe(shape) if len(shape) <= 3 or describe(shape).startswith("Diamond") else ""
        label = u_label[key(shape)]
        kind = r.get("kind", "double")
        inner = smaller_inside(shape)
        tag = (f"contains {inner or 'a proven shape'}" if kind == "contains"
               else TAG.get(kind, kind) + (f" · contains {inner}" if inner else ""))
        caption = f"<b>{label}</b>" + (f" · {named}" if named else "") + f"<br><sub>{tag}</sub>"
        return f'<td align="center"><img src="shapes/{fname}" alt="{label}"><br>{caption}</td>'

    def u_name(label):
        r = next(r for r in unified if u_label[key(cells_of(r))] == label)
        named = describe(cells_of(r))
        short = named.lower() if named.startswith(("Three", "Line")) else named.split(" ")[0].lower()
        return f"{label} ({short})" if named else label

    def u_ref(label):
        """A U label in running text: "three in a row (U1)", or just the label for an unnamed shape."""
        r = next(r for r in unified if u_label[key(cells_of(r))] == label)
        named = describe(cells_of(r))
        named = "diamond" if named.startswith("Diamond") else named.lower() if len(r["shape"]) <= 3 else ""
        return f"{named} ({label})" if named else label

    def pair_name(pair):
        a, b = pair
        if not on_axis(a, b):
            return "Off-line pair"
        return ["Neighbours", "One-gap pair", "Two-gap pair", "Three-gap pair"][dist(a, b) - 1]

    tried = [confirmed[key(cells_of(r))]["defenses"]["tried"] for r in unstop if key(cells_of(r)) in confirmed] or [0]
    tried_lo, tried_hi = round(min(tried), -2), round(max(tried), -2)
    shares = [100 * len(r["defenses"]["holding"]) / r["defenses"]["tried"] for r in tight]
    tight_range = f"{min(shares):.1f}–{max(shares):.1f}%"
    growing = {canonical(pair) for pair, grows in reach if grows}
    quiet_threes = sum(1 for r in rows if r["stones"] == 3 and not r["toMove"]["win"]
                       and any(canonical(list(t)) in growing for t in combinations(cells_of(r), 2)))
    all_tight = [r for r in rows if r["stones"] == 4 and all(is_tight(t) for t in combinations(cells_of(r), 3))]
    unstop_keys = {key(cells_of(r)) for r in unstop}
    holdable_two = sum(1 for r in rows if r["stones"] == 4 and key(cells_of(r)) not in unstop_keys
                       and sum(is_tight(t) for t in combinations(cells_of(r), 3)) >= 2)

    def rule_cells(shape):
        """Loose-three cells the rule names: on one of the shape's lines, in a gap or within 2 cells of its stones."""
        out = set()
        for c in region(shape, 3):
            for k, kind in lines_through(c, shape):
                a, b = shape_lines(shape)[k]
                if kind == "gap" or min(dist(c, a), dist(c, b)) <= 2:
                    out.add(c)
        return out

    extras = []
    for r in loose:
        alone = set(defence_stats(cells_of(r), r["defenses"], 3)[1])
        n = len(alone - rule_cells(cells_of(r)))
        if n:
            extras.append(f"{a_label[canonical(cells_of(r))]} {n}")

    lines = ["# Shapes that win", "",
             "Every small shape of one player's stones, checked by the forced-win solver in Six (the bot in this "
             "repository): which ones you must answer, the replies that work, and the ones that can't be answered at "
             "all. The full lists are in the [catalogue](shapes-catalog.md).", "",
             '<img src="shapes/basics.svg" alt="A triangle, its three lines, and one window of six" align="right">', "",
             "**The game:** X opens with one stone, then each player places two stones a turn; six in a row wins. Every "
             "threat lives in a **window of six** cells in a row (orange), and a **four** (four of your stones in one "
             "window, none of the opponent's) threatens six next turn.", "",
             "**Tempo:** some fours take one stone to block, others (like four in a row with open ends) take both. A "
             "defender who spends both stones builds nothing. A **forced win** is a four every turn that takes both "
             "stones (a **double threat**), until one turn's threats take three or more stones to block. A **non-forced "
             "win** also needs at least one turn that isn't a double threat: a **quiet move** (no four, or a four one "
             "stone can block).", "",
             "**Key words:** a shape is **must-answer** if its owner, moving next, has a forced win; your reply **holds** "
             "if the solver then finds no forced win (a quiet move can still win: both replies shown for the triangle A4 "
             "still lose); a shape is **unstoppable** if it wins even when you move first.",
             "",
             "<details><summary>More words</summary>", "",
             "A **shape** is some of one player's stones with nothing else nearby; stones belong to one shape when "
             "they're within 2 cells (at most 2 steps across the grid) or on one line within 4 (so they share a window "
             "of six with room to spare); rotations and mirror images count as the same shape. The **lines** of a shape "
             "are the lines through two or more of its stones. Replies within 3 cells were tried for **holds**; holding "
             "stops the forced win, it doesn't make the position safe. **Open space** means the shape is alone on the "
             "board: no other stones nearby, and no threats of the defender's anywhere. That second part matters for "
             "non-forced wins (below). **Two-stone** and **one-stone** threes and **close "
             "pairs** are defined below.", "", "</details>", "",
             "**On this page:** [In short](#in-short) · [Using this in a game](#using-this-in-a-game) · "
             "[Fours](#fours) · [Close pairs](#close-pairs) · [Cheat sheet](#cheat-sheet) · [Attacking](#attacking) · "
             "[Worked examples](#worked-examples) · [Unstoppable shapes](#unstoppable-shapes) · "
             "[Test yourself](#test-yourself)", "",
             '<img src="shapes/legend-main.svg" alt="Diagram key">', "",
             "## In short", "",
             "- **Must-answer three** (its owner, to move, has a forced win) → **answer it this turn with the "
             "cheat-sheet reply.** If it's part of a four-stone shape, use step 4's quick rule or look the shape up in "
             "the [catalogue](shapes-catalog.md).",
             f"- **Two-stone three** (your answer takes both stones; a triangle or chevron with no two stones more than 3 "
             f"apart; {span(lab(tight))}) → **one stone "
             "on each of two of its lines (blue), both within 2 cells of it.** Every such pair holds.",
             f"- **One-stone three** (one of your stones is enough; every other must-answer three; {span(lab(loose))}) → "
             "**one stone on one of its lines, in a gap or within 2 cells of that line's stones.** The other stone isn't needed "
             "against the threats: put it on one of the ringed cells of its closest pair (see [Close pairs](#close-pairs)), "
             "or attack.",
             "- **Four** → **block it now**: one stone in its gap, or both ends if it's solid.",
             "- **Close pair** (two stones within 2 cells, or 3 apart on one line) → **needs an answer too: your stones "
             "near it.** In open space, two more stones make any close pair unstoppable.",
             f"- **{len(unified)} unstoppable shapes** win even when the opponent moves first, in open space. The smallest "
             "is **three in a row**: nothing stops it once it has room around it, unless the defender has a threat of "
             "their own somewhere (a three one stone from a four) to win the tempo back. So never give the opponent a "
             "free turn where they have room, and keep a three of your own on the board as insurance.",
             "",
             "## Using this in a game", "",
             "Each turn, in this order:", "",
             "1. **Can you make six?** Do it.",
             "2. **Does the opponent have a four?** Block it (see [Fours](#fours)). A block that also makes your own four "
             "is best.",
             "3. **Can you force a win?** You need a four that takes both of their stones every turn, until one turn's "
             "threats take three or more stones to block (see the [worked example](#worked-examples)).",
             "4. **Does the opponent have a must-answer shape?** Check their two new stones and anything of theirs within "
             "5 cells (a window of six spans 5 steps), and follow their lines: stones up to 4 apart on a line belong to "
             "the same shape.",
             "   - **A three on its own:** the [cheat sheet](#cheat-sheet).",
             "   - **A must-answer three plus a fourth stone:** the cheat-sheet reply often fails here. **Quick rule** for "
             "a two-stone three: use a two-lines reply with one stone on a line joining the fourth stone to one of the "
             f"three's stones, within 2 cells of the fourth stone: it held {quick[1]:,} times out of {quick[0]:,}, and "
             "it's possible in "
             f"{usable} of the {total_tight} such shapes. For a one-stone three, use a dotted cell plus a stone placed the "
             f"same way (holds {paired_pct}% of the time). Otherwise look the shape up in the "
             "[catalogue](shapes-catalog.md)."
             + (f' <br><img src="shapes/{name_file(quick_example[0], "_quick")}" alt="Quick rule example"> <sub>ringed: '
                "the fourth stone; blue: a quick-rule reply</sub>" if quick_example else ""),
             f"   - **No must-answer three inside, still must-answer:** three in one window plus a stone outside it "
             f"({plus_patterns} shapes), or four spread-out stones ({two_pairs}; no three in one window, usually two close "
             "pairs). These are the easiest to miss. "
             + ("Every one" if minimal_one_stone == len(others) else f"{minimal_one_stone} of the {len(others)}")
             + " has a cell where a single stone holds (dotted in the catalogue: "
             "[three plus one](shapes-catalog.md#4-stones-a-three-plus-one), "
             "[spread out](shapes-catalog.md#4-stones-spread-out)). For the spread-out ones, the ringed cells (or their "
             "mirror image) of the closest pair, the one with the fewest cells between its stones (off the line if two "
             f"are equally close), also hold in {closest_ok} of the {two_pairs}.",
             f"   - **No reply holds** in {unholdable4} four-stone shapes: they're in the catalogue's "
             "[unstoppable shapes](shapes-catalog.md#unstoppable-shapes), tagged forced win. Every other four-stone "
             "must-answer shape except the fours has its own catalogue entry.",
             "   - Don't skip this step to build your own shape: once they start making fours, you never get to use it.",
             "5. **Do you have a close pair in open space?** Add the two stones (+) that make it an unstoppable shape "
             "(see [Close pairs](#close-pairs)).",
             "6. **Does the opponent have a close pair in open space?** Two more stones make it "
             "[unstoppable](#unstoppable-shapes), and neighbours or a one-gap pair need only one more for three in a "
             "row. Take its two ringed cells (see [Close pairs](#close-pairs)): they stop it growing into an unstoppable "
             "shape with a forced win, but they don't stop three in a row, and whether that still wins with your two stones nearby wasn't "
             "settled. Two such pairs near each other can already be must-answer (step 4). Otherwise, with two pairs, "
             "answer neighbours or a one-gap pair first (a rule of thumb: they have the most ways to finish).",
             "7. **Otherwise, [attack](#attacking).**", "",
             "**Must-answer** needs a specific reply now (the cheat sheet or the catalogue); a **close pair** needs stones "
             "of yours near it "
             "(see Close pairs). Nearly every group of enemy stones needs one or the other.", "",
             "<details><summary>Definitions and details</summary>", "",
             "<table><tr>" + "".join(
                 f'<td align="center"><img src="shapes/{name_file(sh, "_name")}" alt="{nm}"><br><sub>{nm}</sub></td>'
                 for sh, nm in NAME_STRIP) + "</tr></table>", "",
             "<sub>Names: the numbers are how far the two outer stones are from the corner stone. A triangle's lines meet "
             "at 60°, a chevron's at 120°. On a line, they're the distances between neighbouring stones.</sub>", "",

             f"- {counts[3][1]} of the {counts[3][0]} three-stone shapes are must-answer. Against a two-stone three, only "
             "about 5% of all replies hold.",
             f"- The two-lines defence works for all {len(two_line)} threes with two or more lines ({span(two_line)}); "
             "against the classic triangle, those pairs are the only replies that hold.",
             "- The one-stone rule works for every one-stone three"
             + (f"; some also hold with one stone on other cells (extra cells: {', '.join(extras)})." if extras else "."),
             f"- The other {counts[3][0] - counts[3][1]} threes aren't must-answer. {quiet_threes} of them contain a close "
             "pair that two more stones turn into an unstoppable shape with a forced win; with a free turn, any of them "
             "becomes unstoppable through three in a row.",
             f"- All {len(all_tight)} four-stone shapes in which every three stones form a two-stone three are unstoppable.",
             f"- **Inside a four-stone shape** the cheat-sheet replies hold less often: a two-stone three's two-lines "
             f"reply {inside_pct}% of the time, a one-stone three's dotted cell alone {single_pct}%, a dotted cell plus any "
             f"second stone within 3 cells {anywhere_pct}%. That's why step 4 has its own rules.",
             "- **Triangle a+b, chevron a+b:** two stones on two different lines from a corner stone, a and b cells "
             "away. The lines meet at 60° in a triangle and 120° in a chevron; only the equal triangles (1+1, 2+2, 3+3) "
             "close into a full triangle. The classic triangle and chevron (boomerang) are both 1+1.",
             "- **Pair + 1 (2,3):** a pair plus a third stone 2 and 3 cells from the two; a one-gap pair has one empty "
             "cell between its stones, a two-gap pair two.",
             "- **Line a+b:** three stones on one line, a and b cells apart. Line 1+1 is three in a row.", "",
             "</details>", "",
             "## Fours", "",
             "Four stones in one window of six threaten six next turn. With a gap, one stone on a dotted cell holds; the "
             "solid four needs both stones"
             + (f" (only {len(solid['defenses']['holding'])} replies hold, one shown)." if solid else "."), "",
             "<table><tr>"]
    draws = []
    for b, r in enumerate(in_window, 1):
        shape = cells_of(r)
        heat, alone, ranked = defence_stats(shape, r["defenses"], 3)
        fname = name_file(shape, "_four")
        draws.append(lambda canvas, shape=shape, fname=fname, alone=alone, reply=ranked[0]: (
            fname, svg(shape, heat={c: 1.0 for c in alone}, margin=1, canvas=canvas) if alone
            else svg(shape, defense=reply, margin=1, canvas=canvas)))
        also = u_canon.get(canonical(shape))
        lines.append(("</tr><tr>" if b == 5 else "") + f'<td align="center"><img src="shapes/{fname}" alt="F{b}"><br>'
                     f"<b>F{b}</b><br>" + ("<sub>1 stone in a gap" if alone else "<sub>both stones")
                     + (f" · also {also}" if also else "") + "</sub></td>")
    uniform(draws)
    lasting = [(f"F{b}", smaller_inside(cells_of(r))) for b, r in enumerate(in_window, 1) if canonical(cells_of(r)) in u_canon]
    lines += ["</tr></table>", ""]
    if lasting:
        inner = sorted({i for _, i in lasting if i}, key=lambda x: int(x[1:]))
        lines += [f"In open space {', '.join(f for f, _ in lasting[:-1])}{' and ' if len(lasting) > 1 else ''}"
                  f"{lasting[-1][0]} win even after the block: "
                  + (f"each contains {' or '.join(u_ref(i) for i in inner)}, which is [unstoppable](#unstoppable-shapes). "
                     if inner else "they're [unstoppable](#unstoppable-shapes). ")
                  + "Block anyway: the block stops six next turn, and real games are rarely that open.", ""]
    lines += [
              "## Close pairs", "",
              "Each close pair becomes an [unstoppable shape](#unstoppable-shapes) with two more stones; one way is "
              "marked (+). In open space even a single stone is dangerous: two stones next to it make three in a row, "
              "which is [unstoppable](#unstoppable-shapes). Close pairs matter because they give the most ways to a forced win, "
              "the kind that never gives the defender a free stone. A **way** is a pair of cells that finishes the pair into an "
              "unstoppable shape with a forced win.", "", "<table><tr>"]
    draws = []
    for pair, grows in [(p, g) for p, g in reach if g]:
        fname = name_file(pair, "_grow")
        if grows:
            target = next(r for r in unstop if u_label[key(cells_of(r))] == grows[0])
            done = completion(pair, cells_of(target))
            draws.append(lambda canvas, pair=pair, fname=fname, done=done: (fname, svg(pair, add=done, margin=1,
                                                                                      canvas=canvas)))
            featured_labels = {u_label[key(cells_of(r))] for r in featured}
            target_label = grows[0] if grows[0] in featured_labels else next((g for g in grows if g in featured_labels), grows[0])
            target = next(r for r in unstop if u_label[key(cells_of(r))] == target_label)
            done = completion(pair, cells_of(target))
            draws[-1] = (lambda canvas, pair=pair, fname=fname, done=done: (fname, svg(pair, add=done, margin=1, canvas=canvas)))
            link = "#unstoppable-shapes" if target_label in featured_labels else "shapes-catalog.md#unstoppable-shapes"
            text = f'add these two → <a href="{link}">{u_name(target_label)}</a>'

        else:
            draws.append(lambda canvas, pair=pair, fname=fname: (fname, svg(pair, margin=1, canvas=canvas)))
            text = "can't grow into one"
        lines.append(f'<td align="center"><img src="shapes/{fname}" alt="{pair_name(pair)}"><br><b>{pair_name(pair)}</b>'
                     f"<br><sub>{text}</sub></td>")
    uniform(draws)
    lines += ["</tr><tr>"]
    draws = []
    for pair, grows in [(p, g) for p, g in reach if g]:
        ways = completions(pair, [cells_of(r) for r in unstop])
        answer = max(combinations(sorted({c for w in ways for c in w}), 2),
                     key=lambda ab: (sum(1 for w in ways if ab[0] in w or ab[1] in w), ab))
        fname = name_file(pair, "_answer")
        draws.append(lambda canvas, pair=pair, fname=fname, answer=answer: (
            fname, svg(pair, defense=answer, margin=1, canvas=canvas)))
        images = set()
        for f in TRANSFORMS:
            img = [f(c) for c in pair]
            for x, y in ((pair[0], pair[1]), (pair[1], pair[0])):
                shift = (x[0] - img[0][0], x[1] - img[0][1])
                if (img[1][0] + shift[0], img[1][1] + shift[1]) == y:
                    images.add(tuple(sorted((f(c)[0] + shift[0], f(c)[1] + shift[1]) for c in answer)))
        lines.append(f'<td align="center"><img src="shapes/{fname}" alt="Your answer"><br><sub>your answer: these two'
                     + (" (or their mirror image)" if len(images) > 1 else "") + "</sub></td>")
    uniform(draws)
    lines += ["</tr><tr>"]
    draws = []
    for pair, grows in [(p, g) for p, g in reach if g]:
        ways = completions(pair, [cells_of(r) for r in unstop])
        per_cell = defaultdict(int)
        for w in ways:
            for c in w:
                per_cell[c] += 1
        top = max(per_cell.values())
        cells = sorted(per_cell)
        best = max(combinations(cells, 2), key=lambda ab: (sum(1 for w in ways if ab[0] in w or ab[1] in w), ab))
        cut = sum(1 for w in ways if best[0] in w or best[1] in w)
        cut_shares.append(cut / len(ways))
        fname = name_file(pair, "_ways")
        draws.append(lambda canvas, pair=pair, fname=fname, per_cell=per_cell, top=top, best=best: (
            fname, svg(pair, heat={c: 0.99 * n / top for c, n in per_cell.items()}, rings=best, margin=1, canvas=canvas)))
        checked, still = blocked.get(canonical(pair), (0, 0))
        verdict = (f"; the other {checked} can all be held" if checked and not still
                   else f"; {still} of the other {checked} stay unstoppable" if checked else "")
        lines.append(f'<td align="center"><img src="shapes/{fname}" alt="Where it can be finished"><br><sub>stones on the '
                     f"two ringed cells take away {cut} of its {len(ways)} ways{verdict}</sub></td>")
    uniform(draws)
    lines += ["</tr></table>", "",
              "The maps show the cells the owner can finish with (bluer = more ways)."
              + (" **Two stones on the ringed cells stop it becoming an unstoppable shape with a forced win:** they "
                 f"take away {round(100 * min(cut_shares))} to {round(100 * max(cut_shares))}% of those ways outright, "
                 "and the solver checked every other one with those two "
                 "stones on the board and found a reply that holds each time (replies within 3 cells). Whether they also "
                 "stop the ones that need a non-forced win, like three in a row, wasn't checked; your stones nearby at least take away the "
                 "open space those need. So answer an opponent's close pair in open space with the ringed "
                 "cells, and don't leave your own pairs where they can be answered this way before you use them."
                 if blocked and not any(v[1] for v in blocked.values()) else
                 f" Stones on the ringed cells take away {round(100 * min(cut_shares))} to "
                 f"{round(100 * max(cut_shares))}% of the ways; keep stones near the opponent's "
                 "pairs."), "",
              "## Cheat sheet", "",
              "**Two-stone threes: one stone on each of two blue lines (on the ringed cells).** Any rotation or mirror "
              "image works the same way.", "",
              cheat_table(tight, a_label, "tight"), "",
              "**One-stone threes: one stone on any dotted cell.** The ringed ones are the rule's cells; every dotted cell "
              "works.", "",
              cheat_table(loose, a_label, "loose"), ""]
    lasting = [r for r in threes if canonical(cells_of(r)) in u_canon]
    if lasting:
        names = [f"{describe(cells_of(r)).lower()} ({a_label[canonical(cells_of(r))]})" for r in lasting]
        lines += [(f"The {names[0]} is" if len(names) == 1 else f"The {', '.join(names[:-1])} and {names[-1]} are")
                  + " also [unstoppable](#unstoppable-shapes) in open space: the reply stops the threats, not the win. "
                  "Answer anyway, and keep your stones close so the space isn't open.", ""]
    lines += ["The defence map and the best holding replies for each are in the "
              "[catalogue](shapes-catalog.md#3-stone-must-answer-shapes).", ""]

    # attacking: a pair into a tight three, and the three-plus-one family
    pair = [(0, 0), (0, 1)]
    third = (1, 0)
    fname = name_file(pair, "_attack")
    (OUT / fname).write_text(svg(pair, add=[third], margin=1, frame=pair + [third]), encoding="utf-8")
    plus_one, seen = [], set()
    for r in (r for r in others if most_in_window(r) == 3):
        after = set(cells_of(r)) | {tuple(c) for c in r["toMove"].get("first", [])}
        sh = cells_of(r)
        window3 = max((w for c in sh for w in windows_with(c)), key=lambda w: sum(x in sh for x in w))
        lone = next(c for c in sh if c not in window3)
        kind = any(lone in w for w in open_fours(after, set()))
        if kind not in seen and len(plus_one) < 2:
            seen.add(kind)
            plus_one.append(r)
    lines += ["## Attacking", "",
              f'<img src="shapes/{fname}" alt="A pair plus one stone makes a triangle" align="right">', "",
              "- **Finish a close pair in open space.** If the opponent leaves one of your close pairs alone, the two "
              "(+) stones in [Close pairs](#close-pairs) make an unstoppable shape.",
              "- **Turn a close pair into a two-stone three.** One stone does it (+ makes the triangle). The opponent must "
              "answer with both stones, and your other stone is free to build somewhere else.",
              f"- **Four spread-out stones.** {two_pairs} shapes with no three stones in one window and no must-answer "
              "three inside are must-answer, "
              "and opponents miss them ([catalogue](shapes-catalog.md#4-stones-spread-out)).",
              "- **Keep fours coming.** A four that takes both stones every turn leaves the opponent no time, as in the "
              "worked example below.",
              *([f"- **Make three in a row where there's room.** It's must-answer, and in open space it wins even after "
                 f"the opponent answers it ({u_canon[canonical([(0, 0), (0, 1), (0, 2)])]}), as long as they have no three "
                 "of their own to counter with."]
                if canonical([(0, 0), (0, 1), (0, 2)]) in u_canon else []),
              "- **Three in a window plus one.** Three of your stones in one window of six with a fourth stone outside that "
              "window (on the same line or off it) "
              f"is must-answer in {plus_must} of the {len(plus_all)} such shapes with no must-answer three inside (all "
              f"in the catalogue). {'One' if len(plus_one) == 1 else 'Two'} of them, with the winning first turn "
              "outlined:", ""]
    cells = []
    for r in plus_one:
        shape = cells_of(r)
        fname = name_file(shape, "_plus")
        (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", []), margin=1), encoding="utf-8")
        after = set(shape) | {tuple(c) for c in r["toMove"].get("first", [])}
        fours_now = open_fours(after, set())
        need = cover(fours_now, after)
        three_window = max((w for c in shape for w in windows_with(c)), key=lambda w: sum(x in shape for x in w))
        lone = next(c for c in shape if c not in three_window)
        uses_lone = any(lone in w for w in fours_now)
        cells.append(f'<td align="center"><img src="shapes/{fname}" alt="Three plus one"><br><sub>the outlined turn '
                     + ("builds its four through the lone stone" if uses_lone else
                        "fills the window to five stones, one from six")
                     + f"; six on turn {r['toMove']['turns'] + 1}</sub></td>")
    lines += ["<table><tr>" + "".join(cells) + "</tr></table>", "",
              f"In these {len([r for r in others if most_in_window(r) == 3])} patterns the three alone isn't must-answer. "
              "The catalogue has all of them, with the defence map and the best holding replies, "
              "under [a three plus one](shapes-catalog.md#4-stones-a-three-plus-one).", ""]

    if examples:
        lines += ["## Worked examples", "",
                  "Numbers are turns: a yellow n is X's turn n, and a blue n is O's answer to it. Each picture shows X's new stones and O's latest "
                  "block bright, older stones dim, and the starting shape bright. Each block is the toughest one the "
                  "solver found.", ""]
        for r in threes:
            k = canonical(cells_of(r))
            if k in examples:
                lines += worked_example(examples[k], a_label[k], describe(cells_of(r)).split(" ")[0].lower())
            found = next((line for (sk, _), line in refutes.items() if sk == key(cells_of(r))), None)
            if found and k == canonical([(0, 0), (0, 1), (1, 0)]):
                holding = next(pair for pair in rule_pairs(cells_of(r)))
                lines += defence_example(
                    found, f"Defending the triangle ({a_label[k]})", "Both ends of one line: loses", holding,
                    "One stone on each of two lines: holds",
                    "Blocking both ends of one line looks solid, but it leaves the triangle's other two lines untouched, "
                    "and X still wins with a four every turn. One stone on each of two lines cuts two of the three lines "
                    "at once, and the solver finds no win after it.")


    by_kind = defaultdict(int)
    for e in unified:
        by_kind[e["kind"]] += 1
    lines += ["## Unstoppable shapes", "",
              f"{len(unified)} shapes of up to 4 stones win even when the defender moves first, in open space: every two "
              "stones the defender can place within 5 cells were checked, directly or through a smaller shape inside. "
              "Each is tagged by how it wins:", "",
              f"- **Forced win** ({by_kind['double']}): a four every turn that takes both of the defender's stones, until "
              f"one turn's threats can't all be blocked. The solver tried every two-stone reply within 5 cells (about {tried_lo:,} to "
              f"{tried_hi:,} of them) and none holds. Easy to play once you see it, and the defender never gets a free stone.",
              f"- **Non-forced win** ({by_kind['quiet']}): against some defences the owner needs a quiet move. Proven "
              "by checking every defender reply after each of the owner's turns, with Six "
              "suggesting those turns. Harder to play, and far more fragile: each quiet move hands the defender a free "
              "turn, and a defender with a three of their own anywhere on the board (one stone from a four) can spend it "
              "on a four and win the tempo back. So these hold only when the defender has no such threat. Forced wins "
              "don't have that weakness: every turn takes both of the defender's stones.",
              f"- **Proven by containing one** ({by_kind['contains']}): proven only because it contains a smaller "
              "unstoppable shape (your own extra stones never hurt). Shapes in the other two groups can contain one too; "
              "their tag says so.", ""]
    three = next((e for e in unified if e["stones"] == 3), None)
    if three:
        shape = cells_of(three)
        reply, answer, is_quiet, settled = quiet_branch(three.get("proof") or {}, shape)
        row = next((r for r in rows if canonical(cells_of(r)) == canonical(shape)), None)
        fname = name_file(shape, "_nf")
        (OUT / fname).write_text(svg(shape, defense=reply or (), first=answer or (), margin=2), encoding="utf-8")
        name = describe(shape)
        to_move = (f"With its owner to move it's must-answer: a four every turn, six on turn {row['toMove']['turns'] + 1}. "
                   if row and row["toMove"]["win"] else "")
        how = {"double": "with a forced win", "quiet": "but not always by force",
               "contains": "since it contains a smaller unstoppable shape"}[three["kind"]]
        example = ""
        if three["kind"] == "quiet" and reply and is_quiet:
            example = (": against some defences, like the one in blue, the owner answers with a quiet move "
                       "(outlined)" + (", and after it every defender reply loses to a forced win." if settled else "."))
        lines += [f"### {name} ({u_label[key(shape)]})", "",
                  f'<img src="shapes/{fname}" alt="{name}, a defence and the answer">', "",
                  to_move + f"With the defender moving first it still wins, {how}" + (example or ".")
                  + " Real games are crowded, which is why this rarely decides them outright, but it's the reason never "
                  "to leave a three room to grow.", ""]
    lines += ["The four most compact with a forced win that don't contain a smaller unstoppable shape (all "
              f"{len(unified)} are in the [catalogue](shapes-catalog.md#unstoppable-shapes)):", ""]
    sizes = []
    for r in featured:
        u_cell(r, "_big")
        text = (OUT / name_file(cells_of(r), "_big")).read_text(encoding="utf-8")
        sizes.append(tuple(float(v) for v in re.search(r'width="([\d.]+)" height="([\d.]+)"', text).groups()))
    canvas = (max(w for w, _ in sizes), max(h for _, h in sizes))
    lines += ["<table><tr>" + "".join(u_cell(r, "_big", canvas) for r in featured) + "</tr></table>", ""]
    diamond = next((r for r in featured if describe(cells_of(r)).startswith("Diamond")), None)
    found = diamond and next((line for (sk, _), line in refutes.items() if sk == key(cells_of(diamond))), None)
    if found:
        lines += defence_example(
            found, f"Why the diamond ({u_label[key(cells_of(diamond))]}) can't be stopped",
            "The two-lines defence on one of its triangles", None, "",
            "The diamond is two triangles sharing a side. The defence that stops a lone triangle doesn't stop both: X "
            "still makes a four every turn and six on the last.")
    nf_cat = nonforced_section(nf) if nf else []
    limits_seen = []
    if nf:
        why = defaultdict(int)
        for r in nf.values():
            if r["result"] == "open":
                why[open_reason(r)] += 1
        parts = [(why["replies"], "too many defences survived to check them all"),
                 (why["time"], "the proof ran out of time"),
                 (why["held"], "a defence held against every turn Six suggested, within five turns"),
                 (why["untried"], "no proof was tried")]
        limit_words = {"replies": "too many defences", "time": "the time limit", "held": "five turns"}
        limits_seen = [limit_words[k] for k in ("replies", "time", "held") if why[k]]
        parts = [f"{text} ({n})" for n, text in parts if n]
        lines += [f"The other {sum(why.values())} shapes of 2 to 4 stones are **not proven** either way with the "
                  "defender moving first. Why no proof: " + "; ".join(parts) + ". Not proven doesn't mean defendable: "
                  "proving a defence would mean solving the game around the shape. The "
                  "[catalogue](shapes-catalog.md#not-proven) lists them with Six's estimate of the owner's chances.", ""]
    lines += quiz(tight, loose, in_window, a_label, refutes, reach, rows, cells_of, needed, u_canon,
                  lambda sh: u_ref(smaller_inside(sh)) if smaller_inside(sh) else None)
    lines += ["## What this doesn't cover", "",
              "- **Shapes near other stones, and the defender's own threats.** Every shape here stands alone. In a real "
              "game other stones change things, and the defender's threats anywhere on the board count: a three that one "
              "stone turns into a four can break a non-forced win (a forced win never gives them the free stone for it).",
              "- **Threes that aren't must-answer.** Answering their most dangerous pair (step 6's order) with that pair's ringed "
              "cells is a rule of thumb; the solver check covered pairs on their own, not inside a three.",
              *([f"- **Wins the proofs couldn't finish.** A shape that isn't proven may still win: its proof stopped "
                 f"at a limit ({', '.join(limits_seen)}), as listed under [Unstoppable shapes](#unstoppable-shapes)."]
                if limits_seen else []),
              f"- **Bigger shapes.** Every must-answer shape of up to 4 stones is on this page (the fours) or in the "
              "[catalogue](shapes-catalog.md). "
              f"For 5 stones it lists the {counts[5][2]} minimal must-answer ones; each has a reply within 3 cells that "
              "stops its forced win, but those replies aren't listed. Nothing past 5 stones was checked.",
              ""]
    write_page("shapes.md", lines)
    if needed:
        (HERE.parent / "runs" / "shapes" / "quiz_needed.txt").write_text("\n".join(needed) + "\n", encoding="utf-8")
        print("quiz answers need these refutations (sixshapes --refute ...):", *needed, sep="\n  ")

    # --- catalogue ---------------------------------------------------------------------------------------------------
    cat = ["# Shapes that win: catalogue", "",
           "Every must-answer shape of up to 4 stones except the fours (on the [main page](shapes.md#fours)), with its "
           "best holding replies. The rules and the cheat sheet are on the [main page](shapes.md).", "",
           "**On this page:** [Summary](#summary) · [Unstoppable shapes](#unstoppable-shapes) · [Not proven](#not-proven) · "
           "[3-stone must-answer shapes](#3-stone-must-answer-shapes) · [4 stones: a three plus one](#4-stones-a-three-plus-one) · "
           "[4 stones: spread out](#4-stones-spread-out) · "
           "[4 stones containing a must-answer three](#4-stones-containing-a-must-answer-three) · [5 stones](#5-stones)", "",
           '<img src="shapes/legend.svg" alt="Diagram key">', "",
           "The threes are in the same order as the cheat sheet; the 4-stone must-answer shapes are sorted hardest first, by the share "
           "of replies (pairs of empty cells within 3 cells of the shape) that hold. A reply that holds stops the forced win "
           "only; the owner can often still win with a quiet move first (both replies shown for A4 lose that way). In names like \"Chevron 1+2\", the "
           "numbers are the distances from the corner stone to the other two.",
           "", "## Summary", "",
           "| Stones | Shapes | Must-answer | Minimal must-answer | Unstoppable (opponent moves first) |",
           "|---|---|---|---|---|"]
    for n in sorted(counts):
        c = counts[n]
        unstoppable_n = sum(1 for e in unified if e["stones"] == n)
        cat.append(f"| {n} | {c[0]:,} | {c[1]:,} | {c[2]:,} | {unstoppable_n if n <= 4 else 'not checked'} |")
    minimal_fours = counts[4][2] - len(others)
    if minimal_fours > 0:
        cat += ["", f"The minimal 4-stone count includes {plural(minimal_fours, 'four')}, shown on the "
                "[main page](shapes.md#fours); the other " f"{len(others)} are below."]
    cat += ["",
            "A **shape** is some of one player's stones with nothing else nearby; rotations, mirror images and shifts "
            "count as the same shape, and stones count as one shape when they're within 2 cells or on one line within "
            "4. **Must-answer:** its owner, to move, has a forced win (a four every turn that takes both stones). "
            "**Minimal:** it contains no smaller "
            "must-answer shape. **Unstoppable:** its owner wins even when the opponent moves first, whatever two stones "
            "the opponent places within 5 cells, in open space. **Replies tried:** every pair of empty cells within 3 "
            "cells of the shape (within 5 for the unstoppable shapes). **Six on turn N:** its owner makes a four on each "
            "of the first N − 1 turns.", ""]
    cat += ["## Unstoppable shapes", "",
            f"All {len(unified)}, smallest and most compact first. Each wins even with the opponent to move, in open "
            "space; the tag says how.", "", "<table>"]
    for i in range(0, len(unified), 4):
        cat.append("<tr>" + "".join(u_cell(r) for r in unified[i:i + 4]) + "</tr>")
    cat += ["</table>", ""] + nf_cat + ["", "## 3-stone must-answer shapes", ""]
    for r in threes:
        also = u_canon.get(canonical(cells_of(r)))
        cat += shape_block(r, a_label[canonical(cells_of(r))], f"unstoppable in open space ({also})" if also else "",
                           turns_shown=False)
    first_b = 1
    families = [("## 4 stones: a three plus one", "Three stones in one window of six, plus a fourth stone outside that "
                 "window (on the same line or off it), and no must-answer three inside.",
                 [r for r in others if most_in_window(r) == 3]),
                ("## 4 stones: spread out", "No three of the stones share a window of six, and there's no "
                 "must-answer three inside: usually two close pairs, "
                 "sometimes stones 4 apart on one line plus one more. These are the easiest to overlook.",
                 [r for r in others if most_in_window(r) < 3])]
    j = first_b - 1
    for heading, text, group in families:
        cat += [heading, "", f"{len(group)} shapes. {text}", "", "<table>"]
        blocks = []
        for i in range(0, len(group), 4):
            cat.append("<tr>")
            for r in group[i:i + 4]:
                j += 1
                shape = cells_of(r)
                fname = name_file(shape)
                (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", []), margin=1), encoding="utf-8")
                d = r["defenses"]
                alone = defence_stats(shape, d, 3)[1]
                one = plural(len(alone), "one-stone cell") if alone else "needs 2 stones"
                cat.append(f'<td align="center"><img src="shapes/{fname}" alt="B{j}"><br><b>B{j}</b> · six on turn '
                           f'{r["toMove"]["turns"] + 1}<br>{pct(len(d["holding"]), d["tried"])} hold · {one}</td>')
                blocks += shape_block(r, f"B{j}")
            cat.append("</tr>")
        cat += ["</table>", "", "<details><summary>Holding replies for each</summary>", ""] + blocks + ["</details>", ""]

    groups = defaultdict(list)
    for r in clusters:
        inner = sorted((a_label[canonical(list(t))] for t in combinations(cells_of(r), 3) if canonical(list(t)) in a_label),
                       key=lambda x: int(x[1:]))
        groups[inner[0]].append(r)
    cat += ["## 4 stones containing a must-answer three", "",
            f"{len(clusters)} shapes, each with one reply that holds (or, where one stone is enough, the dotted cells it can "
            f"go on). The cheat-sheet reply for a two-stone three inside holds only about {inside_pct}% of the time, so "
            "answer the whole shape. With a two-stone three inside, a two-lines reply with one stone on a line joining "
            "the fourth stone to one of the other three, within 2 cells of the fourth stone, held every time "
            f"({quick[1]:,} of {quick[0]:,}). Shapes no reply holds are under "
            "[Unstoppable shapes](#unstoppable-shapes) instead. Grouped by the "
            "three inside (the first, if there are several), hardest first.", ""]
    for label in sorted(groups, key=lambda x: int(x[1:])):
        group = hardest(groups[label])
        inner_three = threes[int(label[1:]) - 1]
        cat += [f"<details><summary>{label} · {describe(cells_of(inner_three))} plus a stone ({len(group)})</summary>", "",
                "<table>"]
        for i in range(0, len(group), 6):
            row_cells = []
            for k, r in enumerate(group[i:i + 6], i + 1):
                shape = cells_of(r)
                _, alone, ranked = defence_stats(shape, r["defenses"], 3)
                fname = name_file(shape, "_reply")
                (OUT / fname).write_text(svg(shape, heat={c: 1.0 for c in alone}, margin=1) if alone
                                         else svg(shape, defense=ranked[0], margin=1), encoding="utf-8")
                note = plural(len(alone), "one-stone cell") if alone else "this pair holds"
                also = u_canon.get(canonical(shape))
                row_cells.append(f'<td align="center"><img src="shapes/{fname}" alt="{label}.{k}"><br><b>{label}.{k}</b> '
                                 f'<sub>{pct(len(r["defenses"]["holding"]), r["defenses"]["tried"])} hold · {note}'
                                 + (f" · stops the forced win only: unstoppable ({also})" if also else "") + "</sub></td>")
            cat.append("<tr>" + "".join(row_cells) + "</tr>")
        cat += ["</table>", "", "</details>", ""]

    five = sorted((r for r in rows if r["stones"] == 5 and r["toMove"]["win"] and minimal(r)),
                  key=lambda r: (r["toMove"]["turns"], r["shape"]))
    if five:
        cat += ["## 5 stones", "",
                f"The {len(five)} minimal ones, quickest wins first. Each has a reply within 3 cells that stops its forced "
                "win (checked), so none is unstoppable by a forced win; the replies themselves aren't listed.", "",
                "<table>"]
        for i in range(0, len(five), 5):
            cat.append("<tr>")
            for j, r in enumerate(five[i:i + 5], i + 1):
                shape = cells_of(r)
                fname = name_file(shape)
                (OUT / fname).write_text(svg(shape, first=r["toMove"].get("first", []), margin=1), encoding="utf-8")
                cat.append(f'<td align="center"><img src="shapes/{fname}" alt="C{j}"><br><b>C{j}</b> · six on turn '
                           f'{r["toMove"]["turns"] + 1}</td>')
            cat.append("</tr>")
        cat += ["</table>", ""]
    write_page("shapes-catalog.md", cat)


def write_page(name, lines):
    text = re.sub(r'<img src="shapes/([^"]+)" alt="([^"]*)"(?: width="\d+")?>', scaled, "\n".join(lines))
    (HERE / name).write_text(text + "\n", encoding="utf-8")
    print("wrote", HERE / name)


if __name__ == "__main__":
    flags = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--"))
    main([a for a in sys.argv[1:] if not a.startswith("--")], flags.get("unstoppable"), flags.get("lines"),
         flags.get("pairblock"), flags.get("survey"), flags.get("deep"))
