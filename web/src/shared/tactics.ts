import { hexKey, LINE_AXES, type Hex } from './hex.ts';
import { otherPlayer, WIN_LENGTH, type Game, type Player } from './rules.ts';

export interface LineWindow {
  readonly start: Hex;
  readonly axis: Hex;
  readonly counts: { readonly X: number; readonly O: number };
  readonly empties: readonly Hex[];
}

export function lineWindows(game: Game): LineWindow[] {
  const seen = new Set<string>();
  const out: LineWindow[] = [];
  for (const stone of game.moves) {
    LINE_AXES.forEach((axis, axisIndex) => {
      for (let k = 0; k < WIN_LENGTH; k++) {
        const start = { q: stone.q - axis.q * k, r: stone.r - axis.r * k };
        const id = `${start.q},${start.r},${axisIndex}`;
        if (seen.has(id)) continue;
        seen.add(id);
        let x = 0;
        let o = 0;
        const empties: Hex[] = [];
        for (let i = 0; i < WIN_LENGTH; i++) {
          const q = start.q + axis.q * i;
          const r = start.r + axis.r * i;
          const p = game.stoneAt(q, r);
          if (p === 'X') x++;
          else if (p === 'O') o++;
          else empties.push({ q, r });
        }
        out.push({ start, axis, counts: { X: x, O: o }, empties });
      }
    });
  }
  return out;
}

// Four or more of `player`'s stones and none of the opponent's, so finishable in one two-stone turn.
export function threatWindows(game: Game, player: Player, windows = lineWindows(game)): LineWindow[] {
  const opp = otherPlayer(player);
  return windows.filter((w) => w.counts[player] >= WIN_LENGTH - 2 && w.counts[opp] === 0);
}

export function winningMoves(game: Game, player: Player, stones: number, windows = lineWindows(game)): Hex[][] {
  const opp = otherPlayer(player);
  const found = new Map<string, Hex[]>();
  for (const w of windows) {
    if (w.counts[opp] !== 0 || w.empties.length > stones) continue;
    const cells = [...w.empties].sort((a, b) => a.q - b.q || a.r - b.r);
    found.set(cells.map((c) => hexKey(c.q, c.r)).join('|'), cells);
  }
  return [...found.values()];
}

// All minimum-size sets of at most `budget` cells that hit every threat.
export function allCovers(threats: readonly LineWindow[], budget: number): Hex[][] {
  if (threats.length === 0) return [[]];
  const candidates = new Map<string, Hex>();
  for (const t of threats) for (const e of t.empties) candidates.set(hexKey(e.q, e.r), e);
  const keys = [...candidates.keys()].sort();
  const hits = new Map(
    keys.map((k) => [k, new Set(threats.flatMap((t, i) => (t.empties.some((e) => hexKey(e.q, e.r) === k) ? [i] : [])))]),
  );
  const singles = keys.filter((k) => hits.get(k)!.size === threats.length);
  if (singles.length > 0 && budget >= 1) return singles.map((k) => [candidates.get(k)!]);
  if (budget < 2) return [];
  const pairs: Hex[][] = [];
  for (let i = 0; i < keys.length; i++) {
    const a = hits.get(keys[i]!)!;
    for (let j = i + 1; j < keys.length; j++) {
      const b = hits.get(keys[j]!)!;
      if (a.size + b.size < threats.length) continue;
      let all = true;
      for (let t = 0; t < threats.length; t++) {
        if (!a.has(t) && !b.has(t)) {
          all = false;
          break;
        }
      }
      if (all) pairs.push([candidates.get(keys[i]!)!, candidates.get(keys[j]!)!]);
    }
  }
  return pairs;
}

export function coverThreats(threats: readonly LineWindow[], budget: number): Hex[] | null {
  return allCovers(threats, budget)[0] ?? null;
}
