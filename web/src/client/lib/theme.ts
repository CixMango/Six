import { useEffect, useState } from 'react';
import { BOARD_COLORS, BOARD_EFFECTS, type BoardPalette } from '../board/renderer.ts';

/** Each theme sets the CSS tokens (`html[data-theme]`) and the board's canvas colors. */
export const THEMES = [
  { id: 'six', label: 'Six' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'neon', label: 'Neon' },
  { id: 'deepsea', label: 'Deep Sea' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'six.theme';
const EVENT = 'six:theme';

const SIX_BOARD: BoardPalette = { ...BOARD_COLORS, X: { ...BOARD_COLORS.X }, O: { ...BOARD_COLORS.O }, alarm: { ...BOARD_COLORS.alarm } };

const BOARDS: Record<ThemeId, BoardPalette> = {
  six: SIX_BOARD,
  dark: { ...SIX_BOARD, ground: '#080808', field: '150, 150, 156' },
  light: {
    ground: '#e6e9f0',
    field: '64, 86, 134',
    X: { core: '#e3a200', glow: '226, 150, 0' },
    O: { core: '#2c84d2', glow: '36, 118, 210' },
    alarm: { ground: '#f2d9da', stripe: 'rgba(206, 64, 72, 0.2)', edge: '214, 48, 56' },
  },
  midnight: { ...SIX_BOARD, ground: '#03050e', field: '84, 118, 236' },
  neon: {
    ...SIX_BOARD,
    ground: '#0b0613',
    field: '172, 112, 236',
    X: { core: '#ffe23c', glow: '255, 212, 20' },
    O: { core: '#6cdcff', glow: '56, 204, 255' },
  },
  deepsea: { ...SIX_BOARD, ground: '#040c0f', field: '84, 170, 188' },
};

export function themeSwatch(id: ThemeId): { ground: string; field: string; x: string; o: string } {
  const board = BOARDS[id];
  return { ground: board.ground, field: `rgb(${board.field})`, x: board.X.core, o: board.O.core };
}

function isTheme(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function currentTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(KEY);
    return isTheme(stored) ? stored : 'six';
  } catch {
    return 'six';
  }
}

export function applyTheme(id: ThemeId): void {
  const root = document.documentElement;
  if (id === 'six') delete root.dataset.theme;
  else root.dataset.theme = id;
  const board = BOARDS[id];
  Object.assign(BOARD_COLORS, { ...board, X: { ...board.X }, O: { ...board.O }, alarm: { ...board.alarm } });
  window.dispatchEvent(new Event(EVENT));
}

const BLOOM_KEY = 'six.bloom';

export function bloomOn(): boolean {
  try {
    return localStorage.getItem(BLOOM_KEY) !== '0';
  } catch {
    return true;
  }
}

export function applyBloom(on: boolean): void {
  BOARD_EFFECTS.bloom = on;
  window.dispatchEvent(new Event(EVENT));
}

export function useBloom(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(bloomOn);
  const set = (next: boolean) => {
    try {
      localStorage.setItem(BLOOM_KEY, next ? '1' : '0');
    } catch {
      // Private windows may block storage; the choice holds for this visit.
    }
    applyBloom(next);
    setOn(next);
  };
  return [on, set];
}

/** Calls `redraw` whenever the theme or bloom changes. */
export function onThemeChange(redraw: () => void): () => void {
  window.addEventListener(EVENT, redraw);
  return () => window.removeEventListener(EVENT, redraw);
}

export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState(currentTheme);
  useEffect(() => onThemeChange(() => setTheme(currentTheme())), []);
  const set = (id: ThemeId) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // Private windows may block storage; the theme holds for this visit.
    }
    applyTheme(id);
    setTheme(id);
  };
  return [theme, set];
}
