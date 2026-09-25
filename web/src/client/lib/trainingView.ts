import type { Bout, GenerationRecord, RivalResult, TrainingView } from './api.ts';

/** The loop counts as running when its log moved within this window. */
export const ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export type LoopState = 'not-started' | 'running' | 'paused' | 'stalled';

export function loopState(view: TrainingView, now: number): LoopState {
  if (!view.started) return 'not-started';
  if (view.paused) return 'paused';
  if (view.lastActivity !== null && now - view.lastActivity < ACTIVE_WINDOW_MS) return 'running';
  return 'stalled';
}

export function describeAge(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function signedElo(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${Math.abs(rounded)}`;
}

/** Only claims a difference when the 95% interval excludes zero. */
export function boutVerdict(bout: Bout): 'stronger' | 'weaker' | 'even' {
  if (bout.eloLow !== null && bout.eloLow > 0) return 'stronger';
  if (bout.eloHigh !== null && bout.eloHigh < 0) return 'weaker';
  return 'even';
}

export function intervalSentence(bout: Bout): string {
  if (bout.eloLow === null && bout.eloHigh === null) return 'No interval could be measured.';
  if (bout.eloHigh === null) return `95% interval ${signedElo(bout.eloLow!)} Elo or more.`;
  if (bout.eloLow === null) return `95% interval ${signedElo(bout.eloHigh)} Elo or less.`;
  return `95% interval ${signedElo(bout.eloLow)} to ${signedElo(bout.eloHigh)}.`;
}

export interface RivalOutcome {
  record: string;
  /** Set when one side won every pair (which leaves the interval open at one end). */
  swept: 'ours' | 'theirs' | null;
  bout: Bout;
  sentence: string;
}

export function turnTime(ms: number): string {
  return ms >= 1000 ? `${ms / 1000} s a turn` : `${ms} ms a turn`;
}

export function describeOurSide(r: RivalResult): string {
  const ms = /(\d+)\s*ms/.exec(r.ours);
  const thinking = ms ? turnTime(Number(ms[1])) : null;
  if (r.generation === null) return thinking ? `${r.ours} · ${thinking}` : r.ours;
  return thinking ? `Gen ${r.generation} · ${thinking}` : `Gen ${r.generation}`;
}

export function rivalOutcome(r: RivalResult): RivalOutcome {
  const record = r.draws > 0 ? `${r.wins}–${r.losses}–${r.draws}` : `${r.wins}–${r.losses}`;
  const games = r.wins + r.losses + r.draws;
  const bout: Bout = { wins: r.wins, losses: r.losses, elo: r.elo, eloLow: r.eloLow, eloHigh: r.eloHigh };
  const swept = r.losses === 0 && r.draws === 0 && r.wins > 0 ? 'ours'
    : r.wins === 0 && r.draws === 0 && r.losses > 0 ? 'theirs' : null;
  const played = `${games} games across ${r.pairs} paired opening${r.pairs === 1 ? '' : 's'}`;
  const how = swept === 'ours' ? `Won all ${played}.` : swept === 'theirs' ? `Lost all ${played}.` : `${played}.`;
  const verdict = boutVerdict(bout);
  const reading = swept ? '' : verdict === 'stronger' ? ' Measurably stronger.' : verdict === 'weaker' ? ' Measurably weaker.' : ' Not separable yet.';
  const forfeits = r.forfeits > 0 ? ` ${r.forfeits} game${r.forfeits > 1 ? 's' : ''} forfeited.` : '';
  return { record, swept, bout, sentence: `${how} ${intervalSentence(bout)}${reading}${forfeits}` };
}

/** "b10c128" becomes "10×128" (blocks × channels). */
export function describeShape(network: string): string {
  const shape = /^b(\d+)c(\d+)$/.exec(network);
  return shape ? `${shape[1]}×${shape[2]}` : network;
}

export interface ExtraBout {
  against: string;
  bout: Bout;
}

/** The periodic match against an older anchor generation, then the fixed Six Classic baseline. */
export function extraBouts(record: GenerationRecord): ExtraBout[] {
  const named = (name: string, bout: Bout | undefined) =>
    bout ? [{ against: bout.moveMs ? `${name} at ${turnTime(bout.moveMs)}` : name, bout }] : [];
  const anchor = record.evaluation?.vsAnchor;
  return [...named(anchor ? `Gen ${anchor.against}` : '', anchor), ...named('Six Classic', record.evaluation?.vsHexBot)];
}

export interface TapeRow {
  label: string;
  newest: number | null;
  previous: number | null;
  format: (value: number) => string;
  /** null when neither direction is better. */
  better: 'higher' | 'lower' | null;
}

const count = (value: number) => Math.round(value).toLocaleString();
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const loss = (value: number) => value.toFixed(3);

function unfinishedShare(record: GenerationRecord | undefined): number | null {
  const games = record?.selfplay?.games;
  if (!games) return null;
  return (record?.selfplay?.unfinished ?? 0) / games;
}

export function tapeRows(newest: GenerationRecord, previous: GenerationRecord | undefined): TapeRow[] {
  const v = (record: GenerationRecord | undefined, key: string) => record?.training?.validation?.[key] ?? null;
  return [
    { label: 'Games', newest: newest.selfplay?.games ?? null, previous: previous?.selfplay?.games ?? null, format: count, better: null },
    { label: 'Positions', newest: newest.selfplay?.rows ?? null, previous: previous?.selfplay?.rows ?? null, format: count, better: null },
    { label: 'Unfinished', newest: unfinishedShare(newest), previous: unfinishedShare(previous), format: percent, better: 'lower' },
    { label: 'Game length', newest: newest.selfplay?.medianStones ?? null, previous: previous?.selfplay?.medianStones ?? null, format: (n) => `${Math.round(n)} stones`, better: null },
    // Losses are shown but never scored: loss isn't strength.
    { label: 'Move loss', newest: v(newest, 'policy'), previous: v(previous, 'policy'), format: loss, better: null },
    { label: 'Result loss', newest: v(newest, 'value'), previous: v(previous, 'value'), format: loss, better: null },
  ];
}

export function rowLeader(row: TapeRow): 'newest' | 'previous' | null {
  if (row.better === null || row.newest === null || row.previous === null || row.newest === row.previous) return null;
  const newestBetter = row.better === 'higher' ? row.newest > row.previous : row.newest < row.previous;
  return newestBetter ? 'newest' : 'previous';
}
