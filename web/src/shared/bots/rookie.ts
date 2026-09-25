import { hexDistance, hexKey, LINE_AXES, type Hex } from '../hex.ts';
import { otherPlayer, WIN_LENGTH, type Game, type Player } from '../rules.ts';
import { allCovers, coverThreats, lineWindows, threatWindows, winningMoves } from '../tactics.ts';

// Exact one-turn tactics (win now, cover every threat), then a shallow window-count eval over the best cells and pairs.
export interface RookieOptions {
  // 1 (loose) to 5 (sharpest)
  level: number;
  random?: () => number;
}

const OWN = [0, 1, 5, 25, 120, 400];
const THEIRS = [0, 1.5, 8, 45];
const LOSS = -1e9;
const FORCED_WIN = 1e7;

export function chooseTurn(game: Game, options: RookieOptions): Hex[] {
  if (game.winner) return [];
  const level = Math.min(5, Math.max(1, Math.round(options.level)));
  const random = options.random ?? Math.random;
  const g = game.clone();
  const me = g.current;
  const opp = otherPlayer(me);
  const stones = g.stonesLeft;

  if (g.moves.length === 0) return [{ q: 0, r: 0 }];

  const windows = lineWindows(g);

  const wins = winningMoves(g, me, stones, windows);
  if (wins.length > 0) {
    const shortest = Math.min(...wins.map((w) => w.length));
    const quickest = wins.filter((w) => w.length === shortest);
    return quickest[Math.floor(random() * quickest.length)]!;
  }

  const threats = threatWindows(g, opp, windows);
  const missesBlock = level <= 2 && random() < (level === 1 ? 0.35 : 0.12);
  if (threats.length > 0 && !missesBlock) {
    const covers = allCovers(threats, stones);
    if (covers.length > 0) return bestCompletion(g, covers, stones, me, level, random);
    return greedyBlock(threats, stones);
  }

  const width = [4, 6, 8, 11, 14][level - 1]!;
  const ranked = rankCells(g, me).slice(0, width);
  if (ranked.length === 0) return fallback(g, stones);

  const turns: Array<{ cells: Hex[]; score: number }> = [];
  if (stones === 1) {
    for (const a of ranked) turns.push({ cells: [a], score: afterPlacing(g, [a], me) });
  } else {
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        const cells = [ranked[i]!, ranked[j]!];
        turns.push({ cells, score: afterPlacing(g, cells, me) });
      }
    }
  }
  return pick(turns, level, random);
}

function bestCompletion(g: Game, covers: Hex[][], stones: number, me: Player, level: number, random: () => number): Hex[] {
  const options: Array<{ cells: Hex[]; score: number }> = [];
  const extras = rankCells(g, me).slice(0, 8);
  for (const cover of covers.slice(0, 40)) {
    if (cover.length >= stones) {
      options.push({ cells: cover, score: afterPlacing(g, cover, me) });
      continue;
    }
    const used = new Set(cover.map((c) => hexKey(c.q, c.r)));
    for (const extra of extras) {
      if (used.has(hexKey(extra.q, extra.r))) continue;
      const cells = [...cover, extra];
      options.push({ cells, score: afterPlacing(g, cells, me) });
    }
    if (extras.every((e) => used.has(hexKey(e.q, e.r)))) options.push({ cells: cover, score: afterPlacing(g, cover, me) });
  }
  return pick(options, Math.max(level, 4), random);
}

// Used when no full cover exists.
function greedyBlock(threats: readonly { empties: readonly Hex[] }[], stones: number): Hex[] {
  const remaining = [...threats];
  const chosen: Hex[] = [];
  while (chosen.length < stones && remaining.length > 0) {
    const tally = new Map<string, { cell: Hex; n: number }>();
    for (const t of remaining) {
      for (const e of t.empties) {
        const k = hexKey(e.q, e.r);
        const entry = tally.get(k) ?? { cell: e, n: 0 };
        entry.n++;
        tally.set(k, entry);
      }
    }
    const best = [...tally.values()].sort((a, b) => b.n - a.n)[0]!;
    chosen.push(best.cell);
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i]!.empties.some((e) => e.q === best.cell.q && e.r === best.cell.r)) remaining.splice(i, 1);
    }
  }
  return chosen;
}

function rankCells(g: Game, me: Player): Hex[] {
  const opp = otherPlayer(me);
  const scored: Array<{ cell: Hex; score: number }> = [];
  const seen = new Set<string>();
  for (const stone of g.moves) {
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        const cell = { q: stone.q + dq, r: stone.r + dr };
        const key = hexKey(cell.q, cell.r);
        if (seen.has(key) || hexDistance(stone, cell) > 2) continue;
        seen.add(key);
        if (!g.isPlayable(cell.q, cell.r)) continue;
        let score = 0;
        for (const axis of LINE_AXES) {
          for (let k = 0; k < WIN_LENGTH; k++) {
            let mine = 0;
            let theirs = 0;
            for (let i = 0; i < WIN_LENGTH; i++) {
              const p = g.stoneAt(cell.q + axis.q * (i - k), cell.r + axis.r * (i - k));
              if (p === me) mine++;
              else if (p === opp) theirs++;
            }
            if (theirs === 0) score += OWN[Math.min(mine + 1, 5)]! - OWN[mine]!;
            if (mine === 0 && theirs > 0) score += (THEIRS[Math.min(theirs, 3)] ?? 45) * 1.2;
          }
        }
        scored.push({ cell, score });
      }
    }
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.cell);
}

function afterPlacing(g: Game, cells: readonly Hex[], me: Player): number {
  const opp = otherPlayer(me);
  let placed = 0;
  for (const c of cells) {
    if (!g.place(c.q, c.r).ok) break;
    placed++;
  }
  let score: number;
  if (placed < cells.length) score = LOSS;
  else if (g.winner === me) score = FORCED_WIN * 10;
  else {
    const windows = lineWindows(g);
    if (threatWindows(g, opp, windows).length > 0) score = LOSS;
    else {
      const mine = threatWindows(g, me, windows);
      score = mine.length > 0 && coverThreats(mine, 2) === null ? FORCED_WIN : mine.length * 150;
      for (const w of windows) {
        if (w.counts[opp] === 0) score += OWN[Math.min(w.counts[me], 5)]!;
        if (w.counts[me] === 0) score -= THEIRS[Math.min(w.counts[opp], 3)]!;
      }
    }
  }
  for (let i = 0; i < placed; i++) g.undo();
  return score;
}

// Lower levels sample among the top few options.
function pick(options: Array<{ cells: Hex[]; score: number }>, level: number, random: () => number): Hex[] {
  options.sort((a, b) => b.score - a.score);
  const best = options[0]!;
  if (level >= 5 || best.score >= FORCED_WIN) return best.cells;
  const pool = options.slice(0, [6, 4, 3, 2][level - 1]).filter((o) => o.score > LOSS / 2);
  if (pool.length === 0) return best.cells;
  return pool[Math.floor(random() * pool.length)]!.cells;
}

function fallback(g: Game, stones: number): Hex[] {
  const cells = g.playableCells().sort((a, b) => hexDistance(a, { q: 0, r: 0 }) - hexDistance(b, { q: 0, r: 0 }));
  return cells.slice(0, stones);
}
