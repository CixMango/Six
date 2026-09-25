import { LINE_AXES, type Hex } from '../../shared/hex.ts';
import { Game, otherPlayer, playerForStone, type Player } from '../../shared/rules.ts';
import { coverThreats, threatWindows } from '../../shared/tactics.ts';

export function lastMoveInfo(game: Game): { cell: Hex; player: Player } | null {
  const last = game.lastMove;
  return last ? { cell: last, player: game.stoneAt(last.q, last.r)! } : null;
}

/** Every claim is exact: blocks, fours and unstoppable threats come from the line windows. */
export function turnSummary(game: Game, names: Record<Player, string>): string | null {
  return summarizeTurn(game, names)?.text ?? null;
}

export function summarizeTurn(game: Game, names: Record<Player, string>): { player: Player; text: string } | null {
  const n = game.moves.length;
  const inProgress = game.winner === null && n > 1 && game.stonesLeft === 1;
  const end = inProgress ? n - 1 : n;
  if (end === 0) return null;
  const player = playerForStone(end - 1);
  const text = describeTurn(game, names, player, end);
  return { player, text };
}

function describeTurn(game: Game, names: Record<Player, string>, player: Player, end: number): string {
  const who = names[player];
  if (end === 1) return `${who} opened the game`;

  const opp = otherPlayer(player);
  const start = isTurnStart(end - 1) ? end - 1 : end - 2;
  const before = Game.fromMoves(game.moves.slice(0, start), game.radius);
  const after = Game.fromMoves(game.moves.slice(0, end), game.radius);
  if (after.winner === player) return `${who} completed six in a row`;

  const oppAfter = threatWindows(after, opp).length;
  if (threatWindows(before, opp).length > 0 && oppAfter === 0) return `${who} blocked ${names[opp]}’s four`;

  const mine = threatWindows(after, player);
  if (mine.length > threatWindows(before, player).length) {
    return oppAfter === 0 && coverThreats(mine, 2) === null
      ? `${who} made a threat two stones can’t stop`
      : `${who} made a four`;
  }

  let longest = 1;
  for (const stone of game.moves.slice(start, end)) {
    for (const axis of LINE_AXES) {
      let run = 1;
      for (const sign of [1, -1]) {
        let q = stone.q + axis.q * sign;
        let r = stone.r + axis.r * sign;
        while (after.stoneAt(q, r) === player) {
          run++;
          q += axis.q * sign;
          r += axis.r * sign;
        }
      }
      longest = Math.max(longest, run);
    }
  }
  if (longest >= 3) return `${who} built a line of ${longest}`;
  return `${who} placed two stones`;
}

export function threatCallout(game: Game, names: Record<Player, string>): string | null {
  if (game.winner) return null;
  const mover = game.current;
  const opp = otherPlayer(mover);
  const threats = threatWindows(game, opp).length;
  if (threats === 0) return null;
  return `${names[opp]} is one turn from six. ${names[mover]} has to block.`;
}

export function isTurnStart(index: number): boolean {
  return index === 0 || (index - 1) % 2 === 0;
}

/** Stone count to rewind to so `player` replays their most recent turn, or null if none. */
export function takeBackTarget(game: Game, player: Player): number | null {
  for (let i = game.moves.length - 1; i >= 0; i--) {
    if (isTurnStart(i) && playerForStone(i) === player) return i;
  }
  return null;
}

export const LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

// Always 8, except a retry from an older saved game played at radius 9.
export function parseRadius(value: string | null): 8 | 9 {
  return value === '9' ? 9 : 8;
}

export function parseLevel(value: string | null, fallback = 3): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 7 ? n : fallback;
}
