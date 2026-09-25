import { useEffect, useRef, useState } from 'react';
import type { Hex } from '../../shared/hex.ts';
import { playerForStone, type Player } from '../../shared/rules.ts';
import { followProof, rateMove, turnStart, type Evaluation } from '../../shared/winChance.ts';
import { api } from './api.ts';
import { browserEvaluate } from '../bot/client.ts';

export interface BlunderEvent {
  /** The side that blundered (the other side now has a proven forced win). */
  player: Player;
  /** Stone count when found; keys the call so each blunder shows once. */
  at: number;
}

const EVEN: Evaluation = { winX: 0.5, proven: null };

/** Ratings from 1 to 100 per stone and for the whole turn; null until judged. */
export interface TurnRating {
  stones: Array<number | null>;
  turn: number | null;
}

function rateLatestTurn(player: Player, stones: number, shownAt: (count: number) => Evaluation | undefined): TurnRating | null {
  let last = stones - 1;
  while (last >= 0 && playerForStone(last) !== player) last--;
  if (last < 0) return null;
  const start = turnStart(last + 1);
  const rate = (from: number, to: number) => {
    const before = shownAt(from);
    const after = shownAt(to);
    return before && after ? rateMove(before, after, player) : null;
  };
  const rated: Array<number | null> = [];
  for (let i = start; i <= last; i++) rated.push(rate(i, i + 1));
  const complete = last + 1 < stones || playerForStone(last + 1) !== player; // the turn is over
  return { stones: rated, turn: complete && rated.length > 1 ? rate(start, last + 1) : complete ? rated[0] ?? null : null };
}

/** True when stone `n - 1` ended a turn, so position `n` is where a blunder would land. */
const turnEndsAt = (n: number) => n >= 1 && playerForStone(n) !== playerForStone(n - 1);

// In live play every turn end is judged, even after the next player has moved (bots answer within a second),
// and results are read back in order. The analysis board only judges the position on screen.
export function useWinChance(moves: readonly Hex[], radius: number, winner: Player | null, enabled = true, live = true, inBrowser = false) {
  const [chance, setChance] = useState<Evaluation | null>(null);
  const [blunder, setBlunder] = useState<BlunderEvent | null>(null);
  const [ratings, setRatings] = useState<Record<Player, TurnRating | null>>({ X: null, O: null });
  const judged = useRef(new Map<number, Evaluation>());
  /** Quick proven-win verdicts at turn ends; they arrive well before full judgments. */
  const verdicts = useRef(new Map<number, Player | null>());
  const asked = useRef(new Set<number>());
  const announced = useRef(new Set<number>());
  const line = useRef<string>('');
  const latest = useRef(0);
  /** Resolvers waiting on a stone count's judgment (true if a blunder landed there). */
  const waiting = useRef(new Map<number, Array<(blundered: boolean) => void>>());
  const blunders = useRef(new Set<number>());

  const key = moves.map((m) => `${m.q},${m.r}`).join(' ');

  /** Replays judgments in stone order, carrying proofs forward and finding blunders. */
  const replay = () => {
    const counts = [...new Set([...judged.current.keys(), ...verdicts.current.keys()])].sort((a, b) => a - b);
    let proof: Player | null = null;
    let previous: number | null = null;
    let before: Evaluation = EVEN;
    let shownNow: Evaluation | null = null;
    let newest: BlunderEvent | null = null;
    const shownAt = new Map<number, Evaluation>([[0, EVEN]]);
    for (const count of counts) {
      if (count > latest.current) break;
      // Full judgment if we have it, else the quick verdict with the last known chance carried over.
      const full = judged.current.get(count);
      const quick = verdicts.current.get(count);
      const here: Evaluation = full ?? (quick ? { winX: quick === 'X' ? 1 : 0, proven: quick } : { winX: before.winX, proven: null });
      const step = followProof(proof, previous ?? count, before, count, here);
      before = here;
      proof = step.proof;
      shownNow = step.shown;
      // Ratings use a verdict alone only when it proves something.
      if (full || quick) shownAt.set(count, step.shown);
      previous = count;
      if (step.blunder) blunders.current.add(count);
      if (step.blunder && !announced.current.has(count)) {
        announced.current.add(count);
        newest = { player: step.blunder, at: count };
      }
      for (const resolve of waiting.current.get(count) ?? []) resolve(blunders.current.has(count));
      waiting.current.delete(count);
    }
    if (shownNow) setChance(shownNow);
    if (newest) setBlunder(newest);
    const at = (count: number) => shownAt.get(count);
    setRatings({ X: rateLatestTurn('X', latest.current, at), O: rateLatestTurn('O', latest.current, at) });
  };

  useEffect(() => {
    // New game, take-back or jump back: old judgments don't belong to this line.
    if (!key.startsWith(line.current)) {
      judged.current.clear();
      verdicts.current.clear();
      setRatings({ X: null, O: null });
      asked.current.clear();
      announced.current.clear();
      blunders.current.clear();
      for (const list of waiting.current.values()) for (const resolve of list) resolve(false);
      waiting.current.clear();
      setBlunder(null);
      setChance(null); // stale until the new line is judged
    }
    line.current = key;
    latest.current = moves.length;
    if (!enabled) return;
    if (winner) {
      setChance({ winX: winner === 'X' ? 1 : 0, proven: winner });
      return;
    }
    const lineKey = key;
    const ask = (count: number, keep: boolean, signal?: AbortSignal) => {
      asked.current.add(count);
      (inBrowser ? browserEvaluate(moves.slice(0, count), radius, signal) : api.evaluate(moves.slice(0, count), radius, signal, keep))
        .then((e) => {
          if (line.current !== lineKey && !line.current.startsWith(lineKey)) return; // a different line now
          judged.current.set(count, { winX: e.winX, proven: e.proven });
          replay();
        })
        .catch(() => asked.current.delete(count)); // optional: retry when this position comes up again
    };
    if (live) {
      // Quick verdict first at each turn end, since a blunder call (and a bot waiting on it) only needs that.
      for (let n = 1; n <= moves.length; n++) {
        // In the browser the judgment itself proves forced wins; there's no separate quick verdict.
        if (inBrowser || !turnEndsAt(n) || asked.current.has(n)) continue;
        api
          .verdict(moves.slice(0, n), radius)
          .then((proven) => {
            if (line.current !== lineKey && !line.current.startsWith(lineKey)) return;
            verdicts.current.set(n, proven);
            replay();
          })
          .catch(() => undefined);
      }
      // Judge every stone so each can be rated.
      for (let n = 1; n <= moves.length; n++) if (!asked.current.has(n)) ask(n, true);
      // Precheck the coming turn while its player thinks.
      if (!inBrowser && (turnEndsAt(moves.length) || moves.length === 1)) api.precheck(moves, radius).catch(() => undefined);
    }
    if (asked.current.has(moves.length)) {
      replay();
      return;
    }
    // Mid-turn or analysis board: only this position, and only if it stays on screen briefly.
    const controller = new AbortController();
    const timer = setTimeout(() => ask(moves.length, false, controller.signal), 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, radius, winner, enabled, live, inBrowser]);

  /** Resolves true if the turn ending at `stones` was a blunder. Times out to false so a bot never hangs. */
  const verdict = (stones: number, timeoutMs = 6000): Promise<boolean> => {
    if (!enabled) return Promise.resolve(false);
    if (judged.current.has(stones) || verdicts.current.has(stones)) return Promise.resolve(blunders.current.has(stones));
    return new Promise((resolve) => {
      const list = waiting.current.get(stones) ?? [];
      list.push(resolve);
      waiting.current.set(stones, list);
      setTimeout(() => resolve(false), timeoutMs);
    });
  };

  return { chance: enabled ? chance : null, blunder: enabled ? blunder : null, verdict, ratings: enabled && live ? ratings : null };
}
