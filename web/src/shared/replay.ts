import { Game, otherPlayer, SAVED_RADII, turnForStone, type Player } from './rules.ts';

export type MatchMode = 'online' | 'bot' | 'botmatch' | 'analysis' | 'hexo' | 'imported';
export type ResultReason = 'six' | 'resign' | 'abandoned' | 'unfinished';

export interface SeatInfo {
  name: string;
  kind: 'human' | 'bot';
  // e.g. "rookie:3" when kind is bot
  bot?: string;
}

export interface ReplayResult {
  winner: Player | null;
  reason: ResultReason;
}

// Owners aren't stored; they follow from the turn order.
export interface ReplayRecord {
  format: 'six-replay';
  version: 1;
  id: string;
  createdAt: string;
  mode: MatchMode;
  radius: number;
  players: { X: SeatInfo; O: SeatInfo };
  moves: Array<[number, number]>;
  result: ReplayResult;
  // Imported HeXO game where blue moved first.
  swapColors?: boolean;
}

export interface ReplaySummary {
  id: string;
  createdAt: string;
  mode: MatchMode;
  radius: number;
  players: { X: SeatInfo; O: SeatInfo };
  stones: number;
  turns: number;
  winner: Player | null;
  reason: ResultReason;
  swapColors?: boolean;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MODES: readonly MatchMode[] = ['online', 'bot', 'botmatch', 'analysis', 'hexo', 'imported'];

export function newReplayId(now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `${stamp}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildReplay(args: {
  game: Game;
  mode: MatchMode;
  players: { X: SeatInfo; O: SeatInfo };
  resignedBy: Player | null;
  abandonedBy?: Player | null;
  now?: Date;
  id?: string;
  swapColors?: boolean;
}): ReplayRecord {
  const now = args.now ?? new Date();
  const { game } = args;
  let result: ReplayResult;
  if (game.winner) result = { winner: game.winner, reason: 'six' };
  else if (args.resignedBy) result = { winner: otherPlayer(args.resignedBy), reason: 'resign' };
  else if (args.abandonedBy) result = { winner: otherPlayer(args.abandonedBy), reason: 'abandoned' };
  else result = { winner: null, reason: 'unfinished' };
  return {
    format: 'six-replay',
    version: 1,
    id: args.id ?? newReplayId(now),
    createdAt: now.toISOString(),
    mode: args.mode,
    radius: game.radius,
    players: args.players,
    moves: game.moves.map((m) => [m.q, m.r]),
    result,
    ...(args.swapColors ? { swapColors: true } : {}),
  };
}

function fail(message: string): never {
  throw new Error(`invalid replay: ${message}`);
}

function checkSeat(value: unknown, side: string): SeatInfo {
  if (typeof value !== 'object' || value === null) fail(`player ${side} missing`);
  const seat = value as Record<string, unknown>;
  if (typeof seat.name !== 'string' || seat.name.length === 0 || seat.name.length > 40) fail(`player ${side} name`);
  if (seat.kind !== 'human' && seat.kind !== 'bot') fail(`player ${side} kind`);
  if (seat.bot !== undefined && typeof seat.bot !== 'string') fail(`player ${side} bot`);
  return { name: seat.name, kind: seat.kind, ...(typeof seat.bot === 'string' ? { bot: seat.bot } : {}) };
}

// Replays every move through the rules.
export function validateReplay(value: unknown): ReplayRecord {
  if (typeof value !== 'object' || value === null) fail('not an object');
  const v = value as Record<string, unknown>;
  if (v.format !== 'six-replay' || v.version !== 1) fail('unknown format');
  if (typeof v.id !== 'string' || !ID_PATTERN.test(v.id)) fail('bad id');
  if (typeof v.createdAt !== 'string' || Number.isNaN(Date.parse(v.createdAt))) fail('bad createdAt');
  if (!MODES.includes(v.mode as MatchMode)) fail('bad mode');
  if (!SAVED_RADII.includes(v.radius as 8 | 9)) fail('bad radius');
  const players = v.players as Record<string, unknown> | undefined;
  const seats = { X: checkSeat(players?.X, 'X'), O: checkSeat(players?.O, 'O') };
  if (!Array.isArray(v.moves) || v.moves.length > 5000) fail('bad moves');
  const moves = v.moves.map((m, i) => {
    if (!Array.isArray(m) || m.length !== 2 || !m.every((n) => Number.isInteger(n) && Math.abs(n) < 100000)) {
      fail(`move ${i + 1} is malformed`);
    }
    return [m[0], m[1]] as [number, number];
  });
  let game: Game;
  try {
    game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), v.radius as number);
  } catch (e) {
    fail((e as Error).message);
  }
  const r = v.result as Record<string, unknown> | undefined;
  const winner = r?.winner ?? null;
  const reason = r?.reason;
  const consistent =
    (game.winner !== null && reason === 'six' && winner === game.winner) ||
    (game.winner === null && (reason === 'resign' || reason === 'abandoned') && (winner === 'X' || winner === 'O')) ||
    (game.winner === null && reason === 'unfinished' && winner === null);
  if (!consistent) fail('result does not match the moves');
  return {
    format: 'six-replay',
    version: 1,
    id: v.id,
    createdAt: v.createdAt,
    mode: v.mode as MatchMode,
    radius: v.radius as number,
    players: seats,
    moves,
    result: { winner: winner as Player | null, reason: reason as ResultReason },
    ...(v.swapColors === true ? { swapColors: true } : {}),
  };
}

export function summarize(record: ReplayRecord): ReplaySummary {
  const stones = record.moves.length;
  return {
    id: record.id,
    createdAt: record.createdAt,
    mode: record.mode,
    radius: record.radius,
    players: record.players,
    stones,
    turns: stones === 0 ? 0 : turnForStone(stones - 1),
    winner: record.result.winner,
    reason: record.result.reason,
    ...(record.swapColors ? { swapColors: true } : {}),
  };
}
