// What the "Import a game" box accepts: a HeXO link, HTTTX text, or a saved replay file (.json).
import type { Hex } from './hex.ts';
import { parseHexoLink, type HexoLink } from './hexoImport.ts';
import { fromHtttx, looksLikeHtttx } from './notation.ts';
import { validateReplay, type ReplayRecord } from './replay.ts';

export type GameText =
  | { kind: 'hexo'; link: HexoLink }
  | { kind: 'htttx'; moves: Hex[] }
  | { kind: 'replay'; record: ReplayRecord };

export const IMPORT_HINT = 'Paste a HeXO link or HTTTX notation, or open a saved replay file.';

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
  throw new Error(IMPORT_HINT);
}
