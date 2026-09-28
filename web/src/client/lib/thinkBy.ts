import { useEffect, useState } from 'react';
import type { ThinkBy } from '../../shared/thinking.ts';

const KEY = 'six.thinkBy';
const CHANGED = 'six-think-by';

/** By positions unless the player chose time. */
export function thinkBy(): ThinkBy {
  try {
    return localStorage.getItem(KEY) === 'time' ? 'time' : 'positions';
  } catch {
    return 'positions';
  }
}

let visit: ThinkBy | null = null;

export function useThinkBy(): [ThinkBy, (next: ThinkBy) => void] {
  const [value, setValue] = useState<ThinkBy>(() => visit ?? thinkBy());
  // Level pickers on the page follow a change made in Settings.
  useEffect(() => {
    const onChange = () => setValue(visit ?? thinkBy());
    window.addEventListener(CHANGED, onChange);
    return () => window.removeEventListener(CHANGED, onChange);
  }, []);
  const set = (next: ThinkBy) => {
    visit = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private windows may block storage; the choice holds for this visit.
    }
    window.dispatchEvent(new Event(CHANGED));
  };
  return [value, set];
}

/** The current choice, including one made this visit when storage is blocked. */
export function currentThinkBy(): ThinkBy {
  return visit ?? thinkBy();
}
