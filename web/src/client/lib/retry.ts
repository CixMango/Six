import type { Hex } from '../../shared/hex.ts';
import { otherPlayer, type Player } from '../../shared/rules.ts';
import { isBotId, type BotId } from '../../shared/botMeta.ts';
import type { GameReview, Label, PositionFacts } from '../../shared/review.ts';

export interface RetryItem {
  turn: number;
  moves: Hex[];
  mover: Player;
  before: PositionFacts;
  played: Hex[];
  label: Label;
}

export interface RetrySession {
  radius: 8 | 9;
  names: Record<Player, string>;
  opponent: { bot: BotId; level: number };
  items: RetryItem[];
  index: number;
  back: string;
  /** Each side in the other's colour (a HeXO game where blue moved first). */
  swapColors?: boolean;
}

const KEY = 'six.retry';

export function saveRetry(session: RetrySession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the game then starts from the empty board.
  }
}

export function loadRetry(): RetrySession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as RetrySession) : null;
    return s && Array.isArray(s.items) && s.items[s.index] ? s : null;
  } catch {
    return null;
  }
}

export function retryItems(moves: readonly Hex[], review: GameReview, turns: readonly number[]): RetryItem[] {
  return turns.flatMap((i) => {
    const t = review.turns[i];
    if (!t) return [];
    return [{ turn: i, moves: moves.slice(0, t.start), mover: t.mover, before: t.before, played: t.stones, label: t.label }];
  });
}

/** Same bot and level as in the game, or Six at 1 s a turn if a person sat opposite. */
export function retryOpponent(bots: Partial<Record<Player, string>> | undefined, mover: Player, offline: boolean): { bot: BotId; level: number } {
  const seat = bots?.[otherPlayer(mover)];
  const [id, lv] = (seat ?? '').split(':');
  const level = Number(lv);
  // The public site only has Six in the browser.
  if (!offline && isBotId(id) && id !== 'hexweb' && Number.isInteger(level) && level >= 1) return { bot: id, level };
  return offline ? { bot: 'hexweb', level: 2 } : { bot: 'hexnet', level: 2 };
}

export function retryUrl(session: RetrySession): string {
  const item = session.items[session.index]!;
  return `/bot?bot=${session.opponent.bot}&side=${item.mover}&level=${session.opponent.level}&radius=${session.radius}&retry=1`;
}
