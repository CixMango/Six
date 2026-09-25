import { useState } from 'react';
import { soloSound } from './sound.ts';

const KEY = 'six.blunderMode';

/** Defaults off on the public site (judging slows the bot) and on in the local app. */
export function blunderModeOn(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === null ? !soloSound : stored === '1';
  } catch {
    return !soloSound;
  }
}

export function useBlunderMode(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(blunderModeOn);
  const set = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Private windows may block storage; the choice holds for this visit.
    }
  };
  return [on, set];
}
