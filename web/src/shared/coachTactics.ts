// Coach "what happened" lines, built only from line windows like postmortem.ts (no engine estimates).
import type { Hex } from './hex.ts';
import { separateLines } from './postmortem.ts';
import { Game, otherPlayer, playerForStone, stonesLeftBefore, type Player } from './rules.ts';
import { allCovers, threatWindows, winningMoves, type LineWindow } from './tactics.ts';

const lines = (threats: readonly LineWindow[]) => {
  const n = separateLines(threats);
  return n === 1 ? 'a line' : `${n === 2 ? 'two' : n === 3 ? 'three' : n} lines`;
};

export function turnTactics(before: readonly Hex[], stones: readonly Hex[], radius: number, names: Record<Player, string>): string[] {
  const i = before.length;
  const me = playerForStone(i);
  const them = otherPlayer(me);
  const budget = stonesLeftBefore(i);
  const gBefore = Game.fromMoves(before, radius);
  const gAfter = Game.fromMoves([...before, ...stones], radius);
  if (gAfter.winner === me) return [];
  const out: string[] = [];

  if (winningMoves(gBefore, me, budget).length > 0) out.push(`${names[me]} could have made six in a row this turn.`);

  const faced = threatWindows(gBefore, them);
  let leftOpen = false;
  if (faced.length > 0) {
    const left = threatWindows(gAfter, them);
    if (allCovers(faced, budget).length === 0) {
      leftOpen = left.length > 0;
      out.push(`${names[them]} had ${lines(faced)} one turn from six, in more places than ${budget === 1 ? 'one stone' : 'two stones'} can block.`);
    } else if (left.length === 0) {
      out.push(`Blocked ${separateLines(faced) === 1 ? `${names[them]}'s line` : `all of ${names[them]}'s lines`} one turn from six.`);
    } else {
      leftOpen = true;
      out.push(`Left ${names[them]} ${lines(left)} one turn from six: ${names[them]} can make six next turn.`);
    }
  }

  // If an opponent line was left open they win first, so new lines don't matter.
  const made = gAfter.winner || leftOpen ? [] : threatWindows(gAfter, me);
  if (made.length > 0) {
    if (allCovers(made, 2).length === 0) {
      out.push(`Made lines one turn from six in more places than ${names[them]}'s two stones can block.`);
    } else {
      out.push(`Made ${lines(made)} one turn from six: ${names[them]} has to block.`);
    }
  }
  return out;
}
