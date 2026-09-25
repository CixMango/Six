import { RADII, type Player } from './rules.ts';
import type { ReplayResult } from './replay.ts';
import { BOT_META, type BotId } from './botMeta.ts';

export type SideChoice = Player | 'random';
export type RoomStatus = 'waiting' | 'playing' | 'finished';

// The browser bot can't sit in a room since room bots run on the server.
export type RoomBotId = Exclude<BotId, 'hexweb'>;
export const ROOM_BOTS: readonly RoomBotId[] = ['rookie', 'hexbot', 'hexnet'];

export interface RoomBot {
  id: RoomBotId;
  level: number;
  // If set, the bot holds its answer while a blunder call is shown.
  blunders?: boolean;
}

export interface SeatView {
  name: string;
  connected: boolean;
}

export interface RoomView {
  code: string;
  radius: number;
  status: RoomStatus;
  seats: { X: SeatView | null; O: SeatView | null };
  moves: Array<[number, number]>;
  result: ReplayResult | null;
  rematch: Player[];
  replayId: string | null;
  you: Player | null;
  // includes rematches
  gameNumber: number;
  bot: { name: string; seat: Player } | null;
  // Host of a friend-vs-bot room, not playing.
  watching: boolean;
}

export type ClientMessage =
  | { type: 'hello'; clientId: string; name: string }
  | { type: 'room:create'; radius: number; side: SideChoice; bot?: RoomBot }
  | { type: 'room:join'; code: string }
  | { type: 'room:leave' }
  | { type: 'game:place'; q: number; r: number; index: number }
  | { type: 'game:resign' }
  | { type: 'game:rematch' };

export type ServerMessage =
  | { type: 'welcome'; clientId: string }
  | { type: 'room'; room: RoomView }
  | { type: 'left' }
  | { type: 'error'; message: string };

export const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z]{4}$/;
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const isInt = (n: unknown): n is number => Number.isInteger(n) && Math.abs(n as number) < 1_000_000;

export function cleanName(name: unknown): string {
  const text = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 24) : '';
  return text.length > 0 ? text : 'Player';
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let v: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    v = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  switch (v.type) {
    case 'hello':
      return typeof v.clientId === 'string' && CLIENT_ID_PATTERN.test(v.clientId)
        ? { type: 'hello', clientId: v.clientId, name: cleanName(v.name) }
        : null;
    case 'room:create': {
      if (!RADII.includes(v.radius as 8 | 9) || !(v.side === 'X' || v.side === 'O' || v.side === 'random')) return null;
      const base = { type: 'room:create' as const, radius: v.radius as number, side: v.side as SideChoice };
      if (v.bot === undefined) return base;
      // In a bot room, `side` is the joining friend's side.
      const bot = v.bot as Record<string, unknown> | null;
      const id = bot?.id as RoomBotId;
      if (!bot || !ROOM_BOTS.includes(id) || !Number.isInteger(bot.level)) return null;
      const level = bot.level as number;
      if (!(level >= 1 && level <= BOT_META[id].levelLabels.length)) return null;
      return { ...base, bot: bot.blunders === true ? { id, level, blunders: true } : { id, level } };
    }
    case 'room:join': {
      const code = typeof v.code === 'string' ? v.code.trim().toUpperCase() : '';
      return ROOM_CODE_PATTERN.test(code) ? { type: 'room:join', code } : null;
    }
    case 'game:place':
      return isInt(v.q) && isInt(v.r) && isInt(v.index) ? { type: 'game:place', q: v.q, r: v.r, index: v.index } : null;
    case 'room:leave':
    case 'game:resign':
    case 'game:rematch':
      return { type: v.type };
    default:
      return null;
  }
}
