"""Checks double-threat proof trees from sixshapes --dump-skips with its own implementation of the rules.

For each skipped reply: the owner's stones, the defender's stones and the reply go on an empty board, then the tree
is played out. At every owner turn the defender must have no four, the turn must leave fours that one stone can't
block, and every pair of cells that blocks them all must have a branch in the tree. No code is shared with the
engine, so a bug there can't hide here.

  python engine/tools/verify_proof.py runs/shapes/speedtest/skips.jsonl
"""
import json
import sys
from itertools import combinations

AXES = ((1, 0), (0, 1), (1, -1))


def windows_through(c):
    for dq, dr in AXES:
        for k in range(6):
            yield tuple((c[0] + (i - k) * dq, c[1] + (i - k) * dr) for i in range(6))


def fours(board, who):
    """Windows of six with at least four of `who`'s stones and none of the other side's."""
    seen = set()
    for c, p in board.items():
        if p != who:
            continue
        for w in windows_through(c):
            if w in seen:
                continue
            owners = [board.get(x) for x in w]
            if owners.count(who) >= 4 and all(o in (None, who) for o in owners):
                seen.add(w)
    return seen


def check(board, node, owner="X", defender="O"):
    if fours(board, defender):
        return False, "the defender has a four"
    if fours(board, owner):
        return True, ""
    a, b = tuple(node["a"]), tuple(node["b"])
    if a in board or b in board or a == b:
        return False, "the owner's turn is on an occupied cell"
    board[a] = board[b] = owner
    try:
        threats = fours(board, owner)
        if not threats:
            return False, "the owner's turn makes no four"
        cells = sorted({x for w in threats for x in w if x not in board})
        if any(all(c in w for w in threats) for c in cells):
            return False, "one stone blocks every four"
        blocks = [(x, y) for x, y in combinations(cells, 2) if all(x in w or y in w for w in threats)]
        if not blocks:
            return True, ""
        if node["last"]:
            return False, "the tree says unblockable but it can be blocked"
        tree = {frozenset((tuple(k["x"]), tuple(k["y"]))): k["then"] for k in node["blocks"]}
        for x, y in blocks:
            nxt = tree.get(frozenset((x, y)))
            if nxt is None:
                return False, f"block {x} {y} is missing from the tree"
            board[x] = board[y] = defender
            try:
                ok, why = check(board, nxt, owner, defender)
            finally:
                del board[x], board[y]
            if not ok:
                return False, why
        return True, ""
    finally:
        del board[a], board[b]


def main(path):
    good = bad = 0
    for line in open(path, encoding="utf-8"):
        r = json.loads(line)
        board = {tuple(c): "X" for c in r["shape"]}
        board.update({tuple(c): "O" for c in r["theirs"] + r["reply"]})
        ok, why = check(board, r["proof"])
        if ok:
            good += 1
        else:
            bad += 1
            print("FAILED", r["shape"], r["theirs"], r["reply"], why)
    print(f"{good} proofs verified, {bad} failed")
    return bad == 0


if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1]) else 1)
