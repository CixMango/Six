import { fromHexo, HEXO_ORIGIN, HEXO_RADIUS, hexoApiPath, parseHexoLink } from '../shared/hexoImport.ts';
import { parseGameText } from '../shared/gameImport.ts';
import { buildReplay, newReplayId } from '../shared/replay.ts';
import { Game } from '../shared/rules.ts';
import type { ReplayStore } from './replayStore.ts';

// HeXO's API has no CORS, so the server fetches it. The same link always maps to the same replay.
export async function importHexo(text: string, replays: ReplayStore): Promise<string> {
  const link = parseHexoLink(text);
  if (!link) throw new Error('Paste a HeXO sandbox or game link, like https://hexo.did.science/sandbox/ldqa40j');
  const id = `hexo-${link.kind === 'sandbox' ? 's' : 'g'}-${link.id.toLowerCase()}`;
  if (await replays.get(id)) return id;

  let res: Response;
  try {
    res = await fetch(HEXO_ORIGIN + hexoApiPath(link), { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error("Couldn't reach HeXO. Check the internet connection and try again.");
  }
  if (res.status === 404) throw new Error(`HeXO has no ${link.kind === 'sandbox' ? 'sandbox position' : 'finished game'} at that link.`);
  if (!res.ok) throw new Error(`HeXO answered with an error (${res.status}).`);
  const imported = fromHexo(link, await res.json());

  const record = buildReplay({
    game: Game.fromMoves(imported.moves, HEXO_RADIUS),
    mode: 'hexo',
    players: { X: { name: imported.names.X, kind: 'human' }, O: { name: imported.names.O, kind: 'human' } },
    resignedBy: imported.gaveUp,
    id,
    swapColors: imported.swapColors,
  });
  await replays.save(record);
  return id;
}

// A HeXO link, HTTTX text or a replay file's contents, saved as a replay.
export async function importGame(text: string, replays: ReplayStore): Promise<string> {
  const parsed = parseGameText(text);
  if (parsed.kind === 'hexo') return importHexo(text, replays);
  if (parsed.kind === 'replay') {
    const record = parsed.record;
    if (await replays.get(record.id)) return record.id;
    await replays.save(record);
    return record.id;
  }
  const record = buildReplay({
    game: Game.fromMoves(parsed.moves, HEXO_RADIUS),
    mode: 'imported',
    players: { X: { name: 'Player 1', kind: 'human' }, O: { name: 'Player 2', kind: 'human' } },
    resignedBy: null,
    id: newReplayId(),
  });
  await replays.save(record);
  return record.id;
}
