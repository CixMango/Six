// How long Six thinks at each level. By positions (the default), Six looks at as many positions per turn as it does in
// that level's time on the reference PC (the owner's RTX 4070 SUPER, the app on TensorRT), so a slower computer takes
// longer but plays just as well. By time, it stops at the level's time however many positions it managed.
import { HEXBOT_MOVETIME_MS, type BotId } from './botMeta.ts';

export type ThinkBy = 'positions' | 'time';

/** New positions per turn (both stones) at levels 1 to 7, measured by engine/tools/measure_levels.py (medians over
 * 20 positions from saved games, gen 455). Levels 6 and 7 stop where the search tree fills its 6M-node limit. */
export const SIX_LEVEL_POSITIONS = [5_900, 12_600, 30_200, 65_800, 133_000, 160_000, 160_000] as const;

/** Six (the app's or the browser's) can think by positions; the other bots always think by time. */
export function thinksByPositions(bot: BotId, thinkBy: ThinkBy): boolean {
  return thinkBy === 'positions' && (bot === 'hexnet' || bot === 'hexweb');
}

/** The search limits for a level: a position budget with no time limit, or a time limit. */
export function thinkingLimits(bot: BotId, level: number, thinkBy: ThinkBy): { movetimeMs: number; nodes: number | null } {
  const i = Math.max(0, Math.min(level, HEXBOT_MOVETIME_MS.length) - 1);
  return thinksByPositions(bot, thinkBy)
    ? { movetimeMs: 0, nodes: SIX_LEVEL_POSITIONS[i]! }
    : { movetimeMs: HEXBOT_MOVETIME_MS[i]!, nodes: null };
}

/** 5,890 -> "5.9k", 26,000 -> "26k", 1,200,000 -> "1.2M". */
export function shortCount(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return String(Math.round(n));
}

/** A level's label: "3" over "30k" by positions, "2.5 s" by time. */
export function levelLabel(bot: BotId, level: number, timeLabel: string, thinkBy: ThinkBy): string {
  if (!thinksByPositions(bot, thinkBy)) return timeLabel;
  // Two lines in the level picker: the level, then its positions.
  return `${level}\n${shortCount(SIX_LEVEL_POSITIONS[level - 1] ?? 0)}`;
}

/** The time a level matches on the reference PC, e.g. "2.5 s". */
export function referenceTime(level: number): string {
  const ms = HEXBOT_MOVETIME_MS[Math.max(0, Math.min(level, HEXBOT_MOVETIME_MS.length) - 1)]!;
  return `${ms / 1000} s`;
}

/** How far a running search is: new positions so far, after how long, and the budget when thinking by positions. */
export interface ThinkProgress {
  nodes: number;
  ms: number;
  budget: number | null;
}
