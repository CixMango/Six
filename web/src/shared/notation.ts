// HTTTX, the text notation HeXO's sandbox imports: "version[1];" then one "N. [q,r][q,r];" per turn.
// X's first stone is implied at the centre and turn 1 is O's first two stones. Its axial axes differ from ours:
// HTTTX [q, r] is our (q + r, -r).
import type { Hex } from './hex.ts';
import { DEFAULT_RADIUS, Game } from './rules.ts';

export function looksLikeHtttx(text: string): boolean {
  return /^\s*version\s*\[/i.test(text);
}

export function toHtttx(moves: readonly Hex[]): string {
  if (moves.length === 0) return 'version[1];\n';
  // The game is the same anywhere on the board, and HTTTX puts the first stone at the centre.
  const origin = moves[0]!;
  const rest = moves.slice(1).map((m) => ({ q: m.q - origin.q, r: m.r - origin.r }));
  const parts = ['version[1]'];
  for (let i = 0, turn = 1; i < rest.length; i += 2, turn++) {
    parts.push(`${turn}. ${rest.slice(i, i + 2).map((m) => `[${m.q + m.r},${0 - m.r}]`).join('')}`);
  }
  // One statement per line, the layout other HTTTX tools paste in.
  return `${parts.map((p) => `${p};`).join('\n')}\n`;
}

export function fromHtttx(text: string, radius = DEFAULT_RADIUS): Hex[] {
  const statements = text.split(';').map((s) => s.trim()).filter(Boolean);
  if (statements[0]?.replace(/\s/g, '').toLowerCase() !== 'version[1]') throw new Error('Only HTTTX version 1 is supported.');
  const moves: Hex[] = [{ q: 0, r: 0 }];
  statements.slice(1).forEach((statement, i) => {
    const turn = /^(\d+)\.\s*((?:\[\s*-?\d+\s*,\s*-?\d+\s*\]\s*)+)$/.exec(statement);
    if (!turn || Number(turn[1]) !== i + 1) throw new Error(`Expected turn ${i + 1} in the HTTTX text.`);
    const cells = [...turn[2]!.matchAll(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g)].map((m) => ({ q: Number(m[1]) + Number(m[2]), r: 0 - Number(m[2]) }));
    const last = i === statements.length - 2;
    if (cells.length > 2 || (cells.length < 2 && !last)) throw new Error(`Turn ${i + 1} must have two stones.`);
    moves.push(...cells);
  });
  const game = new Game(radius);
  moves.forEach((m, i) => {
    const res = game.place(m.q, m.r);
    if (!res.ok) throw new Error(`Stone ${i + 1} isn't a legal move (${res.error}).`);
  });
  return moves;
}
