// Game review. Labels come from win-chance loss (chess.com's expected-points bands) or, where the solver proved a
// forced win, from the proof.
import type { Hex } from './hex.ts';
import { otherPlayer, playerForStone, type Player } from './rules.ts';
import { rateMove } from './winChance.ts';

export interface PositionFacts {
  // 0 to 1
  winX: number;
  proven: Player | null;
  // empty when the game is over
  best: Hex[];
}

// A turn gets the first label that applies: six, then the solver labels (lost, missed-win, kept-win, allowed-win,
// winning), then best, then the win-chance bands.
export type Label =
  | 'six'
  | 'winning'
  | 'kept-win'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed-win'
  | 'allowed-win'
  | 'lost';

export type LabelTone = 'great' | 'good' | 'neutral' | 'warn' | 'bad';

export const LABELS: Record<Label, { name: string; tone: LabelTone; meaning: string }> = {
  six: { name: 'Six in a row', tone: 'great', meaning: 'Made six in a row and won the game.' },
  winning: {
    name: 'Found a forced win',
    tone: 'great',
    meaning: "Nobody had a forced win before this turn; after it, this player has one: a proven line the opponent can't stop.",
  },
  'kept-win': {
    name: 'Kept the win',
    tone: 'good',
    meaning: 'This player already had a forced win, and still has one after this turn.',
  },
  best: { name: 'Best', tone: 'good', meaning: 'Exactly the turn Six would play here (both stones, in either order).' },
  excellent: { name: 'Excellent', tone: 'good', meaning: "Not Six's turn, but gave away less than 2% of the winning chance." },
  good: { name: 'Good', tone: 'neutral', meaning: 'Gave away 2% to 5% of the winning chance.' },
  inaccuracy: { name: 'Inaccuracy', tone: 'warn', meaning: 'Gave away 5% to 10% of the winning chance.' },
  mistake: { name: 'Mistake', tone: 'warn', meaning: 'Gave away 10% to 20% of the winning chance.' },
  blunder: {
    name: 'Blunder',
    tone: 'bad',
    meaning: 'Gave away 20% or more of the winning chance, without handing over a forced win.',
  },
  'missed-win': {
    name: 'Missed win',
    tone: 'bad',
    meaning: 'This player had a forced win before this turn and threw it away.',
  },
  'allowed-win': {
    name: 'Allowed a forced win',
    tone: 'bad',
    meaning: 'Nobody had a forced win before this turn; after it, the opponent has one. The live game calls this out with the blunder horn.',
  },
  lost: {
    name: 'Already lost',
    tone: 'neutral',
    meaning: 'The opponent already had a forced win before this turn, so no turn could save the game.',
  },
};

export const LABEL_ORDER: readonly Label[] = [
  'six', 'winning', 'kept-win', 'missed-win', 'allowed-win', 'lost',
  'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder',
];

export const PROVEN_LABELS: ReadonlySet<Label> = new Set<Label>(['six', 'winning', 'kept-win', 'missed-win', 'allowed-win', 'lost']);

export interface Turn {
  mover: Player;
  // index of its first stone
  start: number;
  stones: Hex[];
}

export interface TurnReview extends Turn {
  label: Label;
  // 1 to 100, same scale as rateMove
  rating: number;
  chanceBefore: number;
  chanceAfter: number;
  before: PositionFacts;
  // Six's turn, only when it differs and the played turn was worse than excellent.
  better: Hex[] | null;
  // For a flawed turn: the opponent's best reply.
  reply: Hex[] | null;
  comment: string | null;
}

export interface PlayerSummary {
  turns: number;
  // mean turn rating, 1 to 100
  accuracy: number;
  counts: Record<Label, number>;
}

export interface GameReview {
  turns: TurnReview[];
  summary: Record<Player, PlayerSummary>;
}

// X opens with one stone, then two per turn (the last turn may have one if the game ended on it).
export function turnsOf(moves: readonly Hex[]): Turn[] {
  const turns: Turn[] = [];
  let i = 0;
  while (i < moves.length) {
    const size = i === 0 ? 1 : 2;
    turns.push({ mover: playerForStone(i), start: i, stones: moves.slice(i, i + size) });
    i += size;
  }
  return turns;
}

const sameStones = (a: readonly Hex[], b: readonly Hex[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.q === x.q && y.r === x.r));

const pct = (x: number) => `${Math.round(x * 100)}%`;

function bandFor(loss: number): Label {
  if (loss < 0.02) return 'excellent';
  if (loss < 0.05) return 'good';
  if (loss < 0.1) return 'inaccuracy';
  if (loss < 0.2) return 'mistake';
  return 'blunder';
}

// Also used by retries to judge a replacement turn.
export function judgeTurn(turn: Turn, before: PositionFacts, after: PositionFacts, names: Record<Player, string>, madeSix: boolean): TurnReview {
  const me = turn.mover;
  const them = otherPlayer(me);
  const chance = (f: PositionFacts) => (me === 'X' ? f.winX : 1 - f.winX);
  const rating = rateMove(before, after, me);
  const base = { ...turn, rating, chanceBefore: chance(before), chanceAfter: chance(after), before, better: null, reply: null, comment: null };
  const playedBest = before.best.length > 0 && sameStones(turn.stones, before.best);
  const otherwise = before.best.length > 0 && !playedBest ? before.best : null;
  const reply = after.best.length > 0 ? after.best : null;

  if (madeSix) return { ...base, label: 'six', rating: 100 };
  if (before.proven === them) {
    return { ...base, label: 'lost', comment: `${names[them]} already had a forced win here; no turn could stop it.` };
  }
  if (before.proven === me) {
    if (after.proven === me) return { ...base, label: 'kept-win' };
    const handed = after.proven === them ? `, and ${names[them]} had a forced win instead` : '';
    return {
      ...base,
      label: 'missed-win',
      better: otherwise,
      reply,
      comment: `${names[me]} had a forced win here${otherwise ? ': the outlined stones start it' : ''}. After this turn it was gone${handed}.`,
    };
  }
  if (after.proven === them) {
    return {
      ...base,
      label: 'allowed-win',
      better: otherwise,
      reply,
      comment: `This let ${names[them]} force a win.${otherwise ? ' Six would have played the outlined stones instead.' : ''}`,
    };
  }
  if (after.proven === me) {
    return { ...base, label: 'winning', comment: `${names[me]} found a forced win: from here, ${names[them]} can't stop it.` };
  }
  if (playedBest) return { ...base, label: 'best' };
  const loss = Math.max(0, base.chanceBefore - base.chanceAfter);
  const label = bandFor(loss);
  if (label === 'excellent' || label === 'good') return { ...base, label };
  return {
    ...base,
    label,
    better: otherwise,
    reply,
    comment: `${names[me]}'s chances fell from ${pct(base.chanceBefore)} to ${pct(base.chanceAfter)}.${otherwise ? ' Six preferred the outlined stones.' : ''}`,
  };
}

// Inaccuracies and worse, skipping turns in already-lost positions.
export function keyMoments(review: GameReview, player?: Player): number[] {
  const out: number[] = [];
  review.turns.forEach((t, i) => {
    const tone = LABELS[t.label].tone;
    if ((tone === 'warn' || tone === 'bad') && (!player || t.mover === player)) out.push(i);
  });
  return out;
}

// facts[i] is the position at the start of turn i, plus one extra entry for the final position.
// winner is set only when the game ended with six in a row.
export function reviewGame(moves: readonly Hex[], facts: readonly PositionFacts[], names: Record<Player, string>, winner: Player | null): GameReview {
  const turns = turnsOf(moves);
  if (facts.length < turns.length + 1) throw new Error('review needs facts for every turn and for the end');
  const reviewed = turns.map((turn, i) =>
    judgeTurn(turn, facts[i]!, facts[i + 1]!, names, winner === turn.mover && i === turns.length - 1));

  const summary = {} as Record<Player, PlayerSummary>;
  for (const p of ['X', 'O'] as const) {
    const mine = reviewed.filter((t) => t.mover === p);
    const counts = Object.fromEntries(Object.keys(LABELS).map((k) => [k, 0])) as Record<Label, number>;
    for (const t of mine) counts[t.label]++;
    const accuracy = mine.length ? Math.round(mine.reduce((s, t) => s + t.rating, 0) / mine.length) : 0;
    summary[p] = { turns: mine.length, accuracy, counts };
  }
  return { turns: reviewed, summary };
}

export function gameStory(review: GameReview, names: Record<Player, string>, winner: Player | null): string {
  const out: string[] = [];
  const turns = review.turns;
  const turning = turns.findIndex((t) => t.label === 'allowed-win' || t.label === 'missed-win');
  if (turning >= 0) {
    const t = turns[turning]!;
    out.push(`The game turned on turn ${turning + 1}: ${names[t.mover]} ${t.label === 'allowed-win' ? 'allowed a forced win' : 'let a forced win slip'}.`);
  } else {
    let swing = -1;
    let most = 0.1;
    turns.forEach((t, i) => {
      const loss = t.chanceBefore - t.chanceAfter;
      if (!PROVEN_LABELS.has(t.label) && loss >= most) [swing, most] = [i, loss];
    });
    if (swing >= 0) {
      const t = turns[swing]!;
      out.push(`The biggest swing was turn ${swing + 1}: ${names[t.mover]}'s chances fell from ${pct(t.chanceBefore)} to ${pct(t.chanceAfter)}.`);
    } else {
      out.push('No single turn swung the game by much.');
    }
  }
  const found = turns.findIndex((t) => t.label === 'winning');
  if (found >= 0) out.push(`${names[turns[found]!.mover]} found a forced win on turn ${found + 1}.`);
  const last = turns[turns.length - 1];
  if (winner && last?.label === 'six') out.push(`${names[winner]} finished it with six in a row on turn ${turns.length}.`);
  else out.push('The game ended before six in a row.');
  return out.join(' ');
}
