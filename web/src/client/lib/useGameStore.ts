import { useCallback, useRef, useState } from 'react';
import type { Hex } from '../../shared/hex.ts';
import { Game, type PlaceResult } from '../../shared/rules.ts';

/** The Game is mutable; `version` bumps on every change so views know when to refresh. */
export function useGameStore(create: () => Game) {
  const ref = useRef<Game | null>(null);
  ref.current ??= create();
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const place = useCallback(
    (cell: Hex): PlaceResult => {
      const res = ref.current!.place(cell.q, cell.r);
      if (res.ok) bump();
      return res;
    },
    [bump],
  );

  const undoTo = useCallback(
    (stones: number) => {
      const g = ref.current!;
      let changed = false;
      while (g.moves.length > stones) {
        g.undo();
        changed = true;
      }
      if (changed) bump();
    },
    [bump],
  );

  const replace = useCallback(
    (game: Game) => {
      ref.current = game;
      bump();
    },
    [bump],
  );

  return { game: ref.current, version, place, undoTo, replace };
}
