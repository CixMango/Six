import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Hex } from '../../shared/hex.ts';
import type { Player } from '../../shared/rules.ts';
import { otherPlayer, type Player as Side } from '../../shared/rules.ts';
import { reviewGame, turnsOf, type GameReview, type PositionFacts, type Turn } from '../../shared/review.ts';
import { api } from './api.ts';

/** Search time per position for the quick review and for "look deeper". */
export const QUICK_MS = 1000;
export const DEEP_MS = 5000;

export type ReviewSource = 'server' | 'browser';

export async function factsFor(moves: readonly Hex[], radius: number, ms: number, source: ReviewSource, signal: AbortSignal): Promise<PositionFacts> {
  if (source === 'server') {
    const f = await api.reviewPosition(moves, radius, ms, signal);
    return { winX: f.winX, proven: f.proven, best: f.best.map(([q, r]) => ({ q, r })) };
  }
  // Public site: Six runs in the browser.
  const { browserEvaluate, browserTurn } = await import('../bot/client.ts');
  const best = await browserTurn(moves, radius, ms, signal);
  const judged = await browserEvaluate(moves, radius, signal);
  return { winX: judged.winX, proven: judged.proven, best };
}

const sameCells = (a: readonly Hex[], b: readonly Hex[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.q === x.q && y.r === x.r));

// A turn that handed over a forced win when Six's own pick was that same turn has no better turn to show; ask the
// solver for a defence instead (app only).
async function withDefense(turn: Turn, before: PositionFacts, after: PositionFacts, moves: readonly Hex[], radius: number,
  source: ReviewSource, signal: AbortSignal): Promise<PositionFacts> {
  const them: Side = otherPlayer(turn.mover);
  if (source !== 'server' || after.proven !== them || before.proven === them || !sameCells(before.best, turn.stones)) return before;
  try {
    const best = await api.reviewDefense(moves.slice(0, turn.start), turn.stones, radius, signal);
    return best.length ? { ...before, best } : before;
  } catch {
    return before;
  }
}

export interface ReviewState {
  review: GameReview | null;
  /** Positions judged: the start of each turn, plus the end. */
  judged: number;
  total: number;
  done: boolean;
  error: string;
  deep: ReadonlySet<number>;
  deepening: number | null;
  lookDeeper: (turn: number) => void;
}

/** Judges positions in order so the move list fills in as it goes; each turn needs the position before and after. */
export function useReview(moves: readonly Hex[], radius: number, names: Record<Player, string>, winner: Player | null, source: ReviewSource): ReviewState {
  const turns = useMemo(() => turnsOf(moves), [moves]);
  const positions = useMemo(() => [...turns.map((t) => t.start), moves.length], [turns, moves.length]);
  const [facts, setFacts] = useState<Array<PositionFacts | undefined>>([]);
  const [error, setError] = useState('');
  const [deep, setDeep] = useState<ReadonlySet<number>>(new Set());
  const [deepening, setDeepening] = useState<number | null>(null);
  const deepAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    setFacts([]);
    setDeep(new Set());
    setError('');
    const controller = new AbortController();
    const got: PositionFacts[] = [];
    (async () => {
      for (let i = 0; i < positions.length; i++) {
        try {
          const f = await factsFor(moves.slice(0, positions[i]), radius, QUICK_MS, source, controller.signal);
          if (controller.signal.aborted) return;
          got[i] = f;
          const fixed = i > 0 ? await withDefense(turns[i - 1]!, got[i - 1]!, f, moves, radius, source, controller.signal) : null;
          if (controller.signal.aborted) return;
          if (fixed) got[i - 1] = fixed;
          setFacts((prev) => {
            const next = [...prev];
            next[i] = f;
            if (fixed) next[i - 1] = fixed;
            return next;
          });
        } catch (e) {
          if (controller.signal.aborted) return;
          setError((e as Error).message);
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [moves, radius, source, positions]);

  const judged = facts.filter(Boolean).length;
  const review = useMemo(() => {
    let ready = 0;
    while (ready < turns.length && facts[ready] && facts[ready + 1]) ready++;
    if (ready === 0) return null;
    const complete = ready === turns.length;
    const played = complete ? moves : moves.slice(0, turns[ready]!.start);
    return reviewGame(played, facts.slice(0, ready + 1) as PositionFacts[], names, complete ? winner : null);
  }, [facts, turns, moves, names, winner]);

  const lookDeeper = useCallback((turn: number) => {
    deepAbort.current?.abort();
    const controller = new AbortController();
    deepAbort.current = controller;
    setDeepening(turn);
    (async () => {
      try {
        const [deepBefore, after] = await Promise.all([turn, turn + 1].map((i) =>
          factsFor(moves.slice(0, positions[i]), radius, DEEP_MS, source, controller.signal)));
        if (controller.signal.aborted) return;
        const before = await withDefense(turns[turn]!, deepBefore!, after!, moves, radius, source, controller.signal);
        if (controller.signal.aborted) return;
        setFacts((prev) => {
          const next = [...prev];
          next[turn] = before;
          next[turn + 1] = after;
          return next;
        });
        setDeep((prev) => new Set([...prev, turn]));
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (deepAbort.current === controller) setDeepening(null);
      }
    })();
  }, [moves, radius, source, positions, turns]);

  useEffect(() => () => deepAbort.current?.abort(), []);

  return { review, judged, total: positions.length, done: judged === positions.length, error, deep, deepening, lookDeeper };
}
