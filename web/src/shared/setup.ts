// Set-up positions: checking ones sent over the wire, turning any position into "this side to move", and HeXO's
// sandbox notation (a rectilinear board layout, BKE moves, or both joined by a comma), which uses our axial axes.
import type { Hex } from './hex.ts';
import { Game, otherPlayer, type Player, type Setup } from './rules.ts';

export const MAX_SETUP_STONES = 2000;
const MAX_COORDINATE = 1000;

export function parseSetup(value: unknown): Setup | null {
  if (value === undefined || value === null) return null;
  const v = value as { stones?: unknown; toMove?: unknown; stonesLeft?: unknown };
  if (!Array.isArray(v.stones) || v.stones.length > MAX_SETUP_STONES) throw new Error('setup stones must be a list');
  if (v.toMove !== 'X' && v.toMove !== 'O') throw new Error('setup toMove must be X or O');
  if (v.stonesLeft !== 1 && v.stonesLeft !== 2) throw new Error('setup stonesLeft must be 1 or 2');
  const seen = new Set<string>();
  const stones = v.stones.map((s) => {
    const c = s as { q?: unknown; r?: unknown; player?: unknown };
    if (!Number.isInteger(c.q) || !Number.isInteger(c.r) || Math.abs(c.q as number) > MAX_COORDINATE || Math.abs(c.r as number) > MAX_COORDINATE) {
      throw new Error('each setup stone needs whole-number q and r');
    }
    if (c.player !== 'X' && c.player !== 'O') throw new Error('each setup stone belongs to X or O');
    const key = `${c.q},${c.r}`;
    if (seen.has(key)) throw new Error(`two setup stones on ${key}`);
    seen.add(key);
    return { q: c.q as number, r: c.r as number, player: c.player as Player };
  });
  return { stones, toMove: v.toMove, stonesLeft: v.stonesLeft };
}

/** Every stone on the board with its owner, as a set-up with `toMove` placing next. */
export function setupFromGame(game: Game, toMove: Player, stonesLeft: 1 | 2): Setup {
  return { stones: game.stones.map((s) => ({ q: s.q, r: s.r, player: game.stoneAt(s.q, s.r)! })), toMove, stonesLeft };
}

/** The position with `side` to move: as it is if it's already their turn, else set up with two stones for them. */
export function positionFor(game: Game, side: Player): { setup: Setup | null; moves: Hex[] } {
  if (game.current === side && !game.winner) return { setup: game.setup, moves: [...game.moves] };
  return { setup: setupFromGame(game, side, 2), moves: [] };
}

/** The engine protocol's position line. */
export function positionCommand(radius: number, moves: readonly Hex[], setup: Setup | null | undefined): string {
  const parts = [`position radius ${radius}`];
  if (setup) {
    const stones = setup.stones.map((s) => `${s.player === 'X' ? 'x' : 'o'} ${s.q} ${s.r}`).join(' ');
    parts.push(`setup${stones ? ` ${stones}` : ''}`, `tomove ${setup.toMove === 'X' ? 'x' : 'o'} ${setup.stonesLeft}`);
  }
  if (moves.length > 0) parts.push(`moves ${moves.map((m) => `${m.q} ${m.r}`).join(' ')}`);
  return parts.join(' ');
}

// ---- HeXO sandbox notation ----

const BKE_DIRECTIONS: Hex[] = [{ q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }];
const BKE_SYMBOLS = '>qp<bd';

export function looksLikeHexoNotation(text: string): boolean {
  const t = cleanNotation(text);
  if (/^version\s*\[/i.test(t) || t.startsWith('{') || /^https?:/i.test(t)) return false;
  return t.includes(',') || t === '0' || /[xo]\s+[A-Z]+\d/.test(t) || /^[cxoXO.!/\s\d([-]+/.test(t) && /[xoXO]/.test(t);
}

function cleanNotation(text: string): string {
  let t = text.trim().replace(/\r\n?/g, '\n');
  if (t.startsWith('```') && t.endsWith('```')) t = t.slice(3, -3).trim();
  else if (t.startsWith('`') && t.endsWith('`')) t = t.slice(1, -1).trim();
  if (t.startsWith('#')) t = t.slice(1).trim();
  return t;
}

class Stones {
  readonly list: Setup['stones'] = [];
  private readonly at = new Map<string, Player>();
  toMove: Player = 'X';
  stonesLeft: 1 | 2 = 2;

  add(q: number, r: number, player: Player, sameIsFine = false): void {
    if (!Number.isSafeInteger(q) || !Number.isSafeInteger(r) || Math.abs(q) > MAX_COORDINATE || Math.abs(r) > MAX_COORDINATE) {
      throw new Error('Position coordinates must be whole numbers between -1000 and 1000.');
    }
    const key = `${q},${r}`;
    if (sameIsFine && this.at.get(key) === player) return;
    if (this.at.has(key)) throw new Error(`Two stones on (${q}, ${r}).`);
    if (this.list.length >= MAX_SETUP_STONES) throw new Error(`A position can have at most ${MAX_SETUP_STONES} stones.`);
    this.at.set(key, player);
    this.list.push({ q: q || 0, r: r || 0, player });
  }

  /** After `player` placed `count` stones: one means they still have one to go. */
  turnPlayed(player: Player, count: number): void {
    this.toMove = count === 1 ? player : otherPlayer(player);
    this.stonesLeft = count === 1 ? 1 : 2;
  }

  setup(): Setup {
    return { stones: this.list, toMove: this.toMove, stonesLeft: this.stonesLeft };
  }
}

/** Rows split by "/" or new lines; x and o are stones, "." one empty cell, "-" two, a number that many. Each row
 * runs along q from 0; rows go down in r. A leading "c" swaps rows and columns. [labels] and (marks) are skipped. */
function readLayout(text: string, into: Stones): void {
  const columns = text.startsWith('c');
  let row = 0;
  let offset = 0;
  for (let i = columns ? 1 : 0; i < text.length; ) {
    const ch = text[i++]!;
    if (ch === ' ' || ch === '\t') continue;
    if (ch === '/' || ch === '\n') {
      row++;
      offset = 0;
      continue;
    }
    if (ch === '[') {
      let depth = 1;
      while (i < text.length && depth > 0) {
        const next = text[i++];
        if (next === '\\') i++;
        else if (next === '[') depth++;
        else if (next === ']') depth--;
      }
      if (depth !== 0) throw new Error('A [label] in the position is never closed.');
      continue;
    }
    if (ch === '(') {
      const end = text.indexOf(')', i);
      if (end < 0) throw new Error('A (mark) in the position is never closed.');
      i = end + 1;
      continue;
    }
    if (/\d/.test(ch)) {
      const digits = /^\d+/.exec(text.slice(i - 1))![0];
      const gap = Number(digits);
      if (gap > MAX_COORDINATE) throw new Error('A gap in the position is too long.');
      offset += gap;
      i += digits.length - 1;
      continue;
    }
    if (!'xoXO.!-'.includes(ch)) throw new Error(`The position has a character it can't read: ${ch}`);
    if ('xoXO'.includes(ch)) {
      const player: Player = ch === 'x' || ch === 'X' ? 'X' : 'O';
      into.add(columns ? row : offset, columns ? offset : row, player);
    }
    offset += ch === '-' ? 2 : 1;
  }
}

/** Where BKE's ring `ring`, offset `offset` lands around `origin`, counting from `direction`. */
function bkeCell(origin: Hex, direction: number, ring: number, offset: number): Hex {
  const sector = Math.floor(offset / ring);
  const start = BKE_DIRECTIONS[direction]!;
  let q = origin.q + start.q * ring;
  let r = origin.r + start.r * ring;
  for (let side = 0; side <= sector; side++) {
    const d = BKE_DIRECTIONS[(direction + side + 2) % 6]!;
    const steps = side === sector ? offset % ring : ring;
    q += d.q * steps;
    r += d.r * steps;
  }
  return { q, r };
}

/** BKE: optional direction (> q p < b d) and CW/CCW, an optional @(q, r) origin, then turns like "x A0 A1": the player,
 * then each stone as a ring letter (A = 1 away) and its offset around that ring. Without an origin, X's first stone is
 * implied at (0, 0). */
function readMoves(text: string, into: Stones, implicitOrigin: boolean): void {
  if (text.trim() === '0') {
    into.add(0, 0, 'X');
    into.turnPlayed('X', 2); // the opening stone ends X's first turn
    return;
  }
  const prefix = /^\s*([bdpq<>])?\s*(CW|CCW)?\s*(?:@\s*\((-?\d+),\s*(-?\d+)\)\s*:?)?\s*/.exec(text)!;
  if (implicitOrigin && prefix[3] !== undefined) throw new Error('An @(q, r) origin needs a board layout before it.');
  const origin = { q: Number(prefix[3] ?? 0), r: Number(prefix[4] ?? 0) };
  const direction = BKE_SYMBOLS.indexOf(prefix[1] ?? 'd');
  const counterClockwise = prefix[2] === 'CCW';
  const parts = text.slice(prefix[0].length).trim().split(/\s+/).filter(Boolean);
  if (implicitOrigin) {
    into.add(0, 0, 'X');
    into.turnPlayed('X', 2);
  }
  for (let i = 0; i < parts.length; ) {
    const owner = parts[i++];
    if (owner !== 'x' && owner !== 'o') throw new Error('Each turn of moves starts with x or o.');
    const player: Player = owner === 'x' ? 'X' : 'O';
    let count = 0;
    while (i < parts.length && parts[i] !== 'x' && parts[i] !== 'o') {
      const m = /^([A-Z]+)(?:([0-5])\.)?(\d+)$/.exec(parts[i++]!);
      if (!m) throw new Error(`"${parts[i - 1]}" isn't a ring and offset like A0.`);
      let ring = 0;
      for (const letter of m[1]!) {
        ring = ring * 26 + letter.charCodeAt(0) - 64;
        if (ring > MAX_COORDINATE) throw new Error('A ring in the moves is too far out.');
      }
      let offset = Number(m[3]) + Number(m[2] ?? 0) * ring;
      if (!Number.isSafeInteger(offset) || offset >= ring * 6) throw new Error(`"${parts[i - 1]}" is past the end of its ring.`);
      if (counterClockwise) offset = (ring * 6 - offset) % (ring * 6);
      const cell = bkeCell(origin, direction, ring, offset);
      into.add(cell.q, cell.r, player, !implicitOrigin);
      count++;
    }
    if (count === 0) throw new Error('A turn in the moves has no stones.');
    into.turnPlayed(player, count);
  }
}

/** A HeXO sandbox position: layout, moves, or "layout, moves". Rows and moves use our (q, r) directly. */
export function parseHexoNotation(text: string): Setup {
  const t = cleanNotation(text);
  if (t.length > 50_000) throw new Error('That position is too long.');
  const stones = new Stones();
  const comma = layoutEnd(t);
  if (comma >= 0) {
    readLayout(t.slice(0, comma), stones);
    readMoves(t.slice(comma + 1), stones, false);
  } else if (t === '0' || /[xo]\s+[A-Z]+\d/.test(t)) {
    readMoves(t, stones, true);
  } else {
    readLayout(t, stones);
  }
  if (stones.list.length === 0) throw new Error('That position has no stones.');
  return stones.setup();
}

/** The comma between layout and moves (commas inside [labels] don't count), or -1. */
function layoutEnd(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === '[') depth++;
    if (text[i] === ']') depth--;
    if (text[i] === ',' && depth === 0) return i;
  }
  return -1;
}

/** HeXO notation for a position: the layout, and when the side to move isn't "X with two", the stones of the turn
 * just played written as moves so the turn carries over. Positions are the same anywhere, so it starts at (0, 0). */
export function toHexoNotation(game: Game): string {
  const all = game.stones.map((s) => ({ q: s.q, r: s.r, player: game.stoneAt(s.q, s.r)! }));
  if (all.length === 0) return '';
  const toMove = game.winner ? 'X' : game.current;
  const left = game.winner ? 2 : game.stonesLeft;
  // The turn to write as moves: two of the other side's stones (their turn is over), or one of the mover's.
  const mover: Player | null = toMove === 'X' && left === 2 ? null : left === 2 ? otherPlayer(toMove) : toMove;
  const need = left === 2 ? 2 : 1;
  const played: Hex[] = [];
  if (mover) {
    for (let i = all.length - 1; i >= 0 && played.length < need; i--) if (all[i]!.player === mover) played.push(all[i]!);
  }
  const moveKeys = new Set(played.length === need ? played.map((s) => `${s.q},${s.r}`) : []);
  const minQ = Math.min(...all.map((s) => s.q));
  const minR = Math.min(...all.map((s) => s.r));
  const maxR = Math.max(...all.map((s) => s.r));
  const rows: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    const inRow = all.filter((s) => s.r === r && !moveKeys.has(`${s.q},${s.r}`)).sort((a, b) => a.q - b.q);
    let text = '';
    let at = minQ;
    for (const s of inRow) {
      if (s.q > at) text += s.q - at === 1 ? '.' : String(s.q - at);
      text += s.player === 'X' ? 'x' : 'o';
      at = s.q + 1;
    }
    rows.push(text);
  }
  const layout = rows.join('/') || '.';
  if (moveKeys.size === 0) return layout;
  // Any cell next to the first stone works as the origin, as long as no written stone sits on it.
  const shifted = played.map((s) => ({ q: s.q - minQ, r: s.r - minR }));
  const origin = BKE_DIRECTIONS.map((d) => ({ q: shifted[0]!.q + d.q, r: shifted[0]!.r + d.r }))
    .find((c) => !shifted.some((s) => s.q === c.q && s.r === c.r))!;
  const codes = shifted.map((s) => bkeCode(origin, s));
  return `${layout}, d @(${origin.q}, ${origin.r}) ${mover === 'X' ? 'x' : 'o'} ${codes.join(' ')}`;
}

function bkeCode(origin: Hex, cell: Hex): string {
  const dq = cell.q - origin.q;
  const dr = cell.r - origin.r;
  const ring = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
  for (let offset = 0; offset < ring * 6; offset++) {
    const c = bkeCell(origin, 5, ring, offset);
    if (c.q === cell.q && c.r === cell.r) return `${ringLetters(ring)}${offset}`;
  }
  throw new Error('unreachable');
}

function ringLetters(ring: number): string {
  let out = '';
  for (let n = ring; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
  return out;
}
