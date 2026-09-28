// What the "Import a game" box accepts: a HeXO link, HTTTX text, a saved replay file (.json), or a HeXO sandbox
// position in its notation (opened on the analysis board).
import type { Hex } from './hex.ts';
import { parseHexoLink, type HexoLink } from './hexoImport.ts';
import { fromHtttx, looksLikeHtttx } from './notation.ts';
import { validateReplay, type ReplayRecord } from './replay.ts';
import type { Setup } from './rules.ts';
import { looksLikeHexoNotation, parseHexoNotation } from './setup.ts';

export type GameText =
  | { kind: 'hexo'; link: HexoLink }
  | { kind: 'htttx'; moves: Hex[] }
  | { kind: 'replay'; record: ReplayRecord }
  | { kind: 'position'; setup: Setup };

export const IMPORT_HINT = 'Paste a HeXO link, HTTTX, or a HeXO position like -xxo/.xxo3x, or open a saved replay file.';

export function parseGameText(text: string): GameText {
  const trimmed = text.trim();
  const link = parseHexoLink(trimmed);
  if (link) return { kind: 'hexo', link };
  if (looksLikeHtttx(trimmed)) return { kind: 'htttx', moves: fromHtttx(trimmed) };
  if (trimmed.startsWith('{')) {
    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      throw new Error("That file isn't a valid replay.");
    }
    return { kind: 'replay', record: validateReplay(json) };
  }
  if (looksLikeHexoNotation(trimmed)) return { kind: 'position', setup: parseHexoNotation(trimmed) };
  throw new Error(IMPORT_HINT);
}
