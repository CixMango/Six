import { useEffect, useState } from 'react';

const KEY = 'six.generation';
const CHANGED = 'six-generation';

/** Which of Six's network generations plays in the app: null for the newest. Chosen in Settings. */
export function chosenGeneration(): number | null {
  try {
    const n = Number(localStorage.getItem(KEY));
    return localStorage.getItem(KEY) !== null && Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export function useGeneration(): [number | null, (gen: number | null) => void] {
  const [gen, setGen] = useState<number | null>(chosenGeneration);
  useEffect(() => {
    const onChange = () => setGen(chosenGeneration());
    window.addEventListener(CHANGED, onChange);
    return () => window.removeEventListener(CHANGED, onChange);
  }, []);
  const set = (next: number | null) => {
    setGen(next);
    try {
      if (next === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(next));
    } catch {
      // Private windows may block storage; the choice holds for this page.
    }
    window.dispatchEvent(new Event(CHANGED));
  };
  return [gen, set];
}
