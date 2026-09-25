// HeXO (hexo.did.science) uses the same axial coordinates as we do (lines along (1,0), (0,1), (1,-1)) and radius 8.
import type { Hex } from './hex.ts';
import { Game, otherPlayer, playerForStone, type Player } from './rules.ts';

export const HEXO_ORIGIN = 'https://hexo.did.science';
export const HEXO_RADIUS = 8;

export type HexoLink = { kind: 'sandbox' | 'game'; id: string };

// Accepts .../sandbox/<id> or .../games/<id> links.
export function parseHexoLink(text: string): HexoLink | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (!/(^|\.)hexo\.did\.science$/.test(url.hostname)) return null;
  const m = /^\/(sandbox|games)\/([A-Za-z0-9-]{1,64})\/?$/.exec(url.pathname);
  if (!m) return null;
  return { kind: m[1] === 'sandbox' ? 'sandbox' : 'game', id: m[2]! };
}

export function hexoApiPath(link: HexoLink): string {
  return link.kind === 'sandbox' ? `/api/sandbox-positions/${link.id}` : `/api/finished-games/${link.id}`;
}

export interface ImportedGame {
  moves: Hex[];
  names: Record<Player, string>;
  // Resigned or lost on time.
  gaveUp: Player | null;
  // Our first mover is always X, but on HeXO either colour can open. Swapping lets players keep their HeXO colour.
  swapColors: boolean;
}

interface Placed {
  q: number;
  r: number;
  owner: string;
}

// Also checks each stone's owner matches the turn order.
function playThrough(placed: Placed[]): { moves: Hex[]; seat: Map<string, Player> } {
  if (placed.length === 0) throw new Error('That HeXO position has no stones.');
  const seat = new Map<string, Player>([[placed[0]!.owner, 'X']]);
  const game = new Game(HEXO_RADIUS);
  placed.forEach((p, i) => {
    const player = playerForStone(i);
    if (!seat.has(p.owner) && player === 'O') seat.set(p.owner, 'O');
    if (seat.get(p.owner) !== player) {
      throw new Error(`Stone ${i + 1} doesn't follow the turn order (one stone, then two each), so it can't be reviewed as a game.`);
    }
    const res = game.place(p.q, p.r);
    if (!res.ok) throw new Error(`Stone ${i + 1} at (${p.q}, ${p.r}) isn't a legal move here.`);
  });
  return { moves: game.moves.map((m) => ({ q: m.q, r: m.r })), seat };
}

const isInt = (n: unknown): n is number => Number.isInteger(n);

// GET /api/sandbox-positions/:id
export function fromHexoSandbox(json: unknown): ImportedGame {
  const cells = (json as { gamePosition?: { cells?: unknown } })?.gamePosition?.cells;
  if (!Array.isArray(cells)) throw new Error("That doesn't look like a HeXO sandbox position.");
  const placed = cells
    .map((c) => c as { x?: unknown; y?: unknown; player?: unknown; moveId?: unknown })
    .filter((c) => isInt(c.x) && isInt(c.y) && typeof c.player === 'string' && isInt(c.moveId))
    .sort((a, b) => (a.moveId as number) - (b.moveId as number))
    .map((c) => ({ q: c.x as number, r: c.y as number, owner: c.player as string }));
  if (placed.length !== cells.length) throw new Error('That HeXO position has stones we could not read.');
  const { moves, seat } = playThrough(placed);
  const label = (p: Player) => {
    const slot = [...seat].find(([, s]) => s === p)?.[0];
    return slot === 'player-2' ? 'Player 2' : slot === 'player-1' ? 'Player 1' : p === 'X' ? 'Player 1' : 'Player 2';
  };
  // In HeXO's sandbox, player 1 places X (yellow) and player 2 places O (blue).
  return { moves, names: { X: label('X'), O: label('O') }, gaveUp: null, swapColors: placed[0]!.owner === 'player-2' };
}

// GET /api/finished-games/:id
export function fromHexoGame(json: unknown): ImportedGame {
  const g = json as {
    moves?: unknown;
    players?: Array<{ playerId?: unknown; displayName?: unknown }>;
    playerTiles?: Record<string, { colorIndex?: unknown } | undefined>;
    gameResult?: { winningPlayerId?: unknown; reason?: unknown } | null;
  };
  if (!Array.isArray(g?.moves)) throw new Error("That doesn't look like a finished HeXO game.");
  const placed = g.moves
    .map((m) => m as { x?: unknown; y?: unknown; playerId?: unknown; moveNumber?: unknown })
    .filter((m) => isInt(m.x) && isInt(m.y) && typeof m.playerId === 'string' && isInt(m.moveNumber))
    .sort((a, b) => (a.moveNumber as number) - (b.moveNumber as number))
    .map((m) => ({ q: m.x as number, r: m.y as number, owner: m.playerId as string }));
  if (placed.length !== g.moves.length) throw new Error('That HeXO game has moves we could not read.');
  const { moves, seat } = playThrough(placed);
  const nameOf = (p: Player) => {
    const id = [...seat].find(([, s]) => s === p)?.[0];
    const shown = g.players?.find((pl) => pl.playerId === id)?.displayName;
    return typeof shown === 'string' && shown.trim() ? shown.trim().slice(0, 40) : p === 'X' ? 'Player 1' : 'Player 2';
  };
  const winnerSeat = typeof g.gameResult?.winningPlayerId === 'string' ? seat.get(g.gameResult.winningPlayerId) ?? null : null;
  const madeSix = Game.fromMoves(moves, HEXO_RADIUS).winner !== null;
  // HeXO colour 0 is yellow (X), colour 1 light blue (O), whoever moved first.
  const firstColor = g.playerTiles?.[placed[0]!.owner]?.colorIndex;
  return {
    moves,
    names: { X: nameOf('X'), O: nameOf('O') },
    gaveUp: !madeSix && winnerSeat ? otherPlayer(winnerSeat) : null,
    swapColors: firstColor === 1,
  };
}

export function fromHexo(link: HexoLink, json: unknown): ImportedGame {
  return link.kind === 'sandbox' ? fromHexoSandbox(json) : fromHexoGame(json);
}
