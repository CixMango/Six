import { hexesWithin, hexKey, LINE_AXES, type Hex } from './hex.ts';

export type Player = 'X' | 'O';
export type PlaceError = 'game-over' | 'occupied' | 'out-of-range';
export type PlaceResult = { ok: true; won: boolean } | { ok: false; error: PlaceError };

export const WIN_LENGTH = 6;
export const DEFAULT_RADIUS = 9;
export const RADII = [9, 8] as const;
export type Radius = (typeof RADII)[number];

export function otherPlayer(p: Player): Player {
  return p === 'X' ? 'O' : 'X';
}

// 1-based turn for a 0-based stone index.
export function turnForStone(index: number): number {
  return index === 0 ? 1 : Math.floor((index - 1) / 2) + 2;
}

// X on odd turns, O on even.
export function playerForStone(index: number): Player {
  return turnForStone(index) % 2 === 1 ? 'X' : 'O';
}

// Includes the stone at `index`.
export function stonesLeftBefore(index: number): number {
  if (index === 0) return 1;
  return (index - 1) % 2 === 0 ? 2 : 1;
}

export interface GameSnapshot {
  radius: number;
  moves: Hex[];
  current: Player;
  turn: number;
  stonesLeft: number;
  winner: Player | null;
  winLine: Hex[] | null;
  lastMove: Hex | null;
}

// Unbounded board, X opens with one stone then two per turn, stones must be within `radius` of an existing stone,
// six in a row wins. Mutable with exact undo so search and replay stepping stay cheap.
export class Game {
  readonly radius: number;
  private readonly cells = new Map<string, Player>();
  // Number of stones within `radius` of each cell.
  private readonly coverage = new Map<string, number>();
  private readonly history: Hex[] = [];
  private winnerValue: Player | null = null;
  private winLineValue: Hex[] | null = null;

  constructor(radius: number = DEFAULT_RADIUS) {
    if (!Number.isInteger(radius) || radius < 1) throw new Error(`invalid radius ${radius}`);
    this.radius = radius;
  }

  static fromMoves(moves: readonly Hex[], radius: number): Game {
    const game = new Game(radius);
    moves.forEach((m, i) => {
      const res = game.place(m.q, m.r);
      if (!res.ok) throw new Error(`move ${i + 1} at ${m.q},${m.r} is illegal: ${res.error}`);
    });
    return game;
  }

  get moves(): readonly Hex[] {
    return this.history;
  }

  get lastMove(): Hex | null {
    return this.history.at(-1) ?? null;
  }

  // Turn state freezes at the winning stone (no hand-off after a win).
  get current(): Player {
    return this.winnerValue ?? playerForStone(this.history.length);
  }

  get turn(): number {
    return turnForStone(this.winnerValue ? this.history.length - 1 : this.history.length);
  }

  get stonesLeft(): number {
    const n = this.history.length;
    return this.winnerValue ? stonesLeftBefore(n - 1) - 1 : stonesLeftBefore(n);
  }

  get winner(): Player | null {
    return this.winnerValue;
  }

  get winLine(): readonly Hex[] | null {
    return this.winLineValue;
  }

  stoneAt(q: number, r: number): Player | undefined {
    return this.cells.get(hexKey(q, r));
  }

  isPlayable(q: number, r: number): boolean {
    const key = hexKey(q, r);
    if (this.cells.has(key)) return false;
    if (this.history.length === 0) {
      return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= this.radius;
    }
    return this.coverage.has(key);
  }

  playableCells(): Hex[] {
    if (this.history.length === 0) return hexesWithin({ q: 0, r: 0 }, this.radius);
    const out: Hex[] = [];
    for (const key of this.coverage.keys()) {
      if (this.cells.has(key)) continue;
      const comma = key.indexOf(',');
      out.push({ q: Number(key.slice(0, comma)), r: Number(key.slice(comma + 1)) });
    }
    return out;
  }

  canPlace(q: number, r: number): PlaceError | null {
    if (this.winnerValue) return 'game-over';
    if (this.cells.has(hexKey(q, r))) return 'occupied';
    if (!this.isPlayable(q, r)) return 'out-of-range';
    return null;
  }

  place(q: number, r: number): PlaceResult {
    const error = this.canPlace(q, r);
    if (error) return { ok: false, error };
    const player = this.current;
    const cell = { q, r };
    this.cells.set(hexKey(q, r), player);
    this.history.push(cell);
    for (const h of hexesWithin(cell, this.radius)) {
      const key = hexKey(h.q, h.r);
      this.coverage.set(key, (this.coverage.get(key) ?? 0) + 1);
    }
    const line = this.lineThrough(cell, player);
    if (line) {
      this.winnerValue = player;
      this.winLineValue = line;
      return { ok: true, won: true };
    }
    return { ok: true, won: false };
  }

  undo(): Hex | null {
    const cell = this.history.pop();
    if (!cell) return null;
    this.cells.delete(hexKey(cell.q, cell.r));
    for (const h of hexesWithin(cell, this.radius)) {
      const key = hexKey(h.q, h.r);
      const n = (this.coverage.get(key) ?? 0) - 1;
      if (n <= 0) this.coverage.delete(key);
      else this.coverage.set(key, n);
    }
    // Only the stone that ended the game can carry the win.
    this.winnerValue = null;
    this.winLineValue = null;
    return cell;
  }

  clone(): Game {
    return Game.fromMoves(this.history, this.radius);
  }

  snapshot(): GameSnapshot {
    return {
      radius: this.radius,
      moves: this.history.map((m) => ({ q: m.q, r: m.r })),
      current: this.current,
      turn: this.turn,
      stonesLeft: this.stonesLeft,
      winner: this.winnerValue,
      winLine: this.winLineValue ? this.winLineValue.map((m) => ({ q: m.q, r: m.r })) : null,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
    };
  }

  // The whole run through `cell` if it is six or longer (overlines win).
  private lineThrough(cell: Hex, player: Player): Hex[] | null {
    for (const axis of LINE_AXES) {
      const back = this.run(cell, player, -axis.q, -axis.r);
      const forward = this.run(cell, player, axis.q, axis.r);
      if (back + forward + 1 >= WIN_LENGTH) {
        const line: Hex[] = [];
        for (let i = -back; i <= forward; i++) line.push({ q: cell.q + axis.q * i, r: cell.r + axis.r * i });
        return line;
      }
    }
    return null;
  }

  private run(cell: Hex, player: Player, dq: number, dr: number): number {
    let count = 0;
    let q = cell.q + dq;
    let r = cell.r + dr;
    while (this.cells.get(hexKey(q, r)) === player) {
      count++;
      q += dq;
      r += dr;
    }
    return count;
  }
}
