import type { CSSProperties } from 'react';

const SHADES = ['', '-deep', '-ink', '-wash'];

/** CSS vars that swap the X and O colours, matching BoardCanvas's swapColors. */
export function swappedTeamColors(on: boolean | undefined): CSSProperties | undefined {
  if (!on || typeof document === 'undefined') return undefined;
  const root = getComputedStyle(document.documentElement);
  const style: Record<string, string> = {};
  for (const shade of SHADES) {
    style[`--x${shade}`] = root.getPropertyValue(`--o${shade}`).trim();
    style[`--o${shade}`] = root.getPropertyValue(`--x${shade}`).trim();
  }
  return style as CSSProperties;
}
