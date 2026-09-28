import { useState } from 'react';

const KEY = 'six.autoCamera';

/** Off by default: moving the camera between a turn's two stones causes misclicks. */
export function autoCameraOn(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function useAutoCamera(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(autoCameraOn);
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
