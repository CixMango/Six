// Explains why a game ended, using only line windows (no engine). A threat is a six-cell window with four or five
// of one side's stones and none of the other's.
import { hexKey, type Hex } from './hex.ts';
import { Game, otherPlayer, playerForStone, stonesLeftBefore, turnForStone, type Player } from './rules.ts';
import { allCovers, threatWindows, winningMoves, type LineWindow } from './tactics.ts';

export const SIDE_COLOR: Record<Player, string> = { X: 'Yellow', O: 'Blue' };

export interface Moment {
  // counted like the scorebug
  turn: number;
  text: string;
}

export interface Postmortem {
  winner: Player;
  loser: Player;
  turn: number;
  stones: number;
  headline: string;
  // main reason first
  why: Moment[];
  turnsUnderThreat: number;
}

interface TurnFacts {
  turn: number;
  mover: Player;
  faced: LineWindow[];
  // null when two stones can't block them all
  cover: Hex[] | null;
  couldWin: boolean;
  blocked: boolean;
  threatened: boolean;
}

function walk(game: Game): TurnFacts[] {
  const moves = game.moves;
  const facts: TurnFacts[] = [];
  for (let i = 0; i < moves.length; ) {
    const stones = stonesLeftBefore(i);
    const played = Math.min(stones, moves.length - i);
    const mover = playerForStone(i);
    const opp = otherPlayer(mover);
    const before = Game.fromMoves(moves.slice(0, i), game.radius);
    const after = Game.fromMoves(moves.slice(0, i + played), game.radius);
    const faced = threatWindows(before, opp);
    facts.push({
      turn: turnForStone(i),
      mover,
      faced,
      cover: allCovers(faced, stones)[0] ?? null,
      couldWin: winningMoves(before, mover, stones).length > 0,
      blocked: threatWindows(after, opp).length === 0,
      threatened: threatWindows(after, mover).length > 0,
    });
    i += played;
  }
  return facts;
}

const NUMBER = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const count = (n: number) => NUMBER[n] ?? String(n);

// Two fours on one line count as one attack.
export function separateLines(threats: readonly LineWindow[]): number {
  const lines = new Set(threats.map((t) => `${t.axis.q},${t.axis.r}:${t.start.q * t.axis.r - t.start.r * t.axis.q}`));
  return lines.size;
}

// Greedy count, which is good enough for "in three places at once".
function placesToBlock(threats: readonly LineWindow[]): number {
  const left = threats.map((t) => new Set(t.empties.map((e) => hexKey(e.q, e.r))));
  let used = 0;
  while (left.length > 0 && used < 12) {
    const counts = new Map<string, number>();
    for (const cells of left) for (const key of cells) counts.set(key, (counts.get(key) ?? 0) + 1);
    let best = '';
    let bestCount = 0;
    for (const [key, count] of counts) if (count > bestCount) [best, bestCount] = [key, count];
    for (let i = left.length - 1; i >= 0; i--) if (left[i]!.has(best)) left.splice(i, 1);
    used++;
  }
  return used;
}

export function postmortem(game: Game, names?: Record<Player, string>): Postmortem | null {
  const winner = game.winner;
  if (!winner) return null;
  const loser = otherPlayer(winner);
  const them = SIDE_COLOR[winner];
  const us = SIDE_COLOR[loser];
  const naming = (p: Player) => (names && names[p] && names[p] !== SIDE_COLOR[p] ? `${SIDE_COLOR[p]} (${names[p]})` : SIDE_COLOR[p]);

  const facts = walk(game);
  const mine = facts.filter((f) => f.mover === loser);
  const turnsUnderThreat = mine.filter((f) => f.faced.length > 0).length;

  // The game was decided on the first turn they couldn't block everything. A missed block or missed win only
  // matters if it was the last one, so those are searched from the end.
  const overwhelmed = mine.find((f) => f.faced.length > 0 && f.cover === null && !f.couldWin) ?? null;
  const missedBlock = mine.findLast((f) => f.faced.length > 0 && f.cover !== null && !f.couldWin && !f.blocked) ?? null;
  const missedWin = mine.findLast((f) => f.couldWin) ?? null;
  const firstAttack = facts.find((f) => f.mover === winner && f.threatened) ?? null;
  const loserEverThreatened = mine.some((f) => f.threatened);

  const why: Moment[] = [];
  if (missedWin && (!missedBlock || missedWin.turn <= missedBlock.turn)) {
    why.push({ turn: missedWin.turn, text: `${us} could have finished six on turn ${missedWin.turn} and played elsewhere.` });
  }
  if (missedBlock) {
    why.push({ turn: missedBlock.turn, text: `${them} was one move from six on turn ${missedBlock.turn}, and ${us} left it standing.` });
  }
  if (overwhelmed) {
    const lines = separateLines(overwhelmed.faced);
    const needed = placesToBlock(overwhelmed.faced);
    const stones = overwhelmed.turn === 1 ? 1 : 2;
    why.push({
      turn: overwhelmed.turn,
      text: `By turn ${overwhelmed.turn}, ${them} was one move from six on ${count(lines)} separate ${lines === 1 ? 'line' : 'lines'}. `
        + `${us} had ${count(stones)} stones to block with and would have needed ${count(needed)}.`,
    });
  }
  if (why.length === 0) {
    why.push({
      turn: firstAttack?.turn ?? game.turn,
      text: loserEverThreatened
        ? `${them} kept the attack going and finished first; ${us} was always a move behind.`
        : `${us} never got a line of its own going. ${them} attacked from turn ${firstAttack?.turn ?? 1} and ${us} spent the rest of the game blocking.`,
    });
  }
  if (turnsUnderThreat > 0 && why.length < 3 && firstAttack) {
    why.push({
      turn: firstAttack.turn,
      text: `${them} made its first four on turn ${firstAttack.turn}; ${us} had to answer a threat on ${turnsUnderThreat} of its turns.`,
    });
  }

  const headline = overwhelmed
    ? `${naming(winner)} attacked on ${count(separateLines(overwhelmed.faced))} lines at once`
    : missedBlock
      ? `${naming(winner)} finished a line ${us} left open`
      : missedWin
        ? `${naming(winner)} got there first`
        : `${naming(winner)} kept the attack and finished`;

  return { winner, loser, turn: game.turn, stones: game.moves.length, headline, why, turnsUnderThreat };
}
