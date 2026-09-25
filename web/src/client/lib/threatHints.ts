import { useState } from 'react';
import type { Game, Player } from '../../shared/rules.ts';
import { threatWindows } from '../../shared/tactics.ts';
import type { BoardMark } from '../board/renderer.ts';

/** Empty cells that complete a line one turn from six, in the color of the side that owns the line. */
export function threatMarks(game: Game): BoardMark[] {
  const out: BoardMark[] = [];
  if (game.winner) return out;
  for (const player of ['X', 'O'] as Player[]) {
    const seen = new Set<string>();
    for (const w of threatWindows(game, player)) {
      for (const e of w.empties) {
        const key = `${e.q},${e.r}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ cell: e, player, kind: 'threat' });
      }
    }
  }
  return out;
}

const KEY = 'six.showThreats';

export function useThreatHints(): [boolean, () => void] {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setOn((current) => {
      try {
        localStorage.setItem(KEY, current ? '0' : '1');
      } catch {
        // Private windows may block storage; the switch still works for this visit.
      }
      return !current;
    });
  return [on, toggle];
}
