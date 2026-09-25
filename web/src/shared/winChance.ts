import { hexDistance, type Hex } from './hex.ts';
import { Game, otherPlayer, playerForStone, type Player } from './rules.ts';

export interface Evaluation {
  // 0 to 1
  winX: number;
  proven: Player | null;
}

// Also how long a bot waits before playing its answer after a blunder.
export const BLUNDER_CALL_MS = 3400;
export const AFTER_BLUNDER_MS = 500;

// A win in n turns scores kWinScore - n (engine/src/search.hpp).
export const PROVEN_SCORE = 1_000_000;
const PROVEN_THRESHOLD = PROVEN_SCORE - 10_000;
// Matches SCORE_SCALE in trainer/dataset.py.
const CLASSIC_SCALE = 600;

// score is from the side to move. Six reports value * 1000 (-1000 to +1000); Six Classic a heuristic score.
export function evaluationFromScore(score: number, mover: Player, engine: 'six' | 'classic'): Evaluation {
  if (Math.abs(score) >= PROVEN_THRESHOLD) {
    const winner = score > 0 ? mover : otherPlayer(mover);
    return { winX: winner === 'X' ? 1 : 0, proven: winner };
  }
  const forMover = engine === 'six'
    ? Math.min(1, Math.max(0, (score / 1000 + 1) / 2))
    : 1 / (1 + Math.exp(-score / CLASSIC_SCALE));
  return { winX: mover === 'X' ? forMover : 1 - forMover, proven: null };
}

// A blunder hands the opponent a proven win that wasn't there before, with at least one of the loser's stones
// played in between.
export function blunderBetween(stonesBefore: number, before: Evaluation, stonesAfter: number, after: Evaluation): Player | null {
  const winner = after.proven;
  if (!winner || before.proven === winner) return null;
  const loser = otherPlayer(winner);
  for (let i = stonesBefore; i < stonesAfter; i++) if (playerForStone(i) === loser) return loser;
  return null;
}

// The solver only proves wins for the side to move, so a proof disappears on the loser's turns. Carry it forward
// until the winner's own play throws it away.
export function followProof(
  proof: Player | null,
  stonesBefore: number,
  before: Evaluation,
  stones: number,
  after: Evaluation,
): { proof: Player | null; shown: Evaluation; blunder: Player | null } {
  if (after.proven) {
    if (proof === after.proven) return { proof, shown: after, blunder: null };
    const carried = proof ? { winX: proof === 'X' ? 1 : 0, proven: proof } : before;
    // No earlier judgment: blame the turn that just ended.
    const from = stonesBefore < stones ? stonesBefore : turnStart(stones);
    return { proof: after.proven, shown: after, blunder: blunderBetween(from, carried, stones, after) };
  }
  if (proof) {
    // Only the winner can throw a forced win away.
    const winnerToMove = playerForStone(stones) === proof;
    const winnerChance = proof === 'X' ? after.winX : 1 - after.winX;
    if (!winnerToMove || winnerChance >= 0.5) return { proof, shown: { winX: proof === 'X' ? 1 : 0, proven: proof }, blunder: null };
  }
  return { proof: null, shown: after, blunder: null };
}

// Stone count at the start of the turn containing stone `stones - 1`.
export function turnStart(stones: number): number {
  if (stones <= 1) return 0;
  const mover = playerForStone(stones - 1);
  let start = stones - 1;
  while (start > 0 && playerForStone(start - 1) === mover) start--;
  return start;
}

// Stand-in for a pass (the engine can't pass): stones on the playable cells farthest from everything. If the
// opponent has no forced win after this, they have none after any turn, since your own stones never hurt you.
export function idleTurn(moves: readonly Hex[], radius: number): Hex[] {
  const game = Game.fromMoves(moves, radius);
  const stones = game.stonesLeft;
  const picked: Hex[] = [];
  const cells = game.playableCells();
  for (let i = 0; i < stones; i++) {
    let best: Hex | null = null;
    let bestDistance = -1;
    for (const cell of cells) {
      if (picked.some((p) => p.q === cell.q && p.r === cell.r)) continue;
      const near = Math.min(...moves.map((m) => hexDistance(m, cell)), ...picked.map((p) => hexDistance(p, cell) + 3));
      if (near > bestDistance) {
        bestDistance = near;
        best = cell;
      }
    }
    if (best) picked.push(best);
  }
  return picked;
}

// 1 to 100 on the chess-site accuracy curve (losing 5 points of win chance is about 80, 20 points about 40).
// Allowing a proven win scores 1, finding one scores 100.
export function rateMove(before: Evaluation, after: Evaluation, mover: Player): number {
  if (after.proven === mover) return 100;
  if (after.proven === otherPlayer(mover) && before.proven !== otherPlayer(mover)) return 1;
  const forMover = (e: Evaluation) => (mover === 'X' ? e.winX : 1 - e.winX);
  const lost = Math.max(0, forMover(before) - forMover(after)) * 100;
  const accuracy = 103.1668 * Math.exp(-0.04354 * lost) - 3.1669;
  return Math.round(Math.min(100, Math.max(1, accuracy)));
}
