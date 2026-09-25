import { useEffect, useRef, useState } from 'react';
import { GameImport } from '../client/components/GameImport.tsx';
import { parseGameText } from '../shared/gameImport.ts';
import { reviewInBrowser } from '../client/screens/ReviewScreen.tsx';
import { fromHexo, parseHexoLink, type ImportedGame } from '../shared/hexoImport.ts';
import { useLocation } from 'wouter';
import { Game } from '../shared/rules.ts';
import { BOT_META } from '../shared/botMeta.ts';
import { BoardCanvas, type BoardHandle } from '../client/board/BoardCanvas.tsx';
import { ChannelBug, Scorebug, Segmented } from '../client/components/Broadcast.tsx';
import { SettingsButton } from '../client/components/Settings.tsx';
import { lastMoveInfo } from '../client/lib/gameView.ts';
import { wait } from '../client/lib/motion.ts';
import { useNarrow } from '../client/lib/useNarrow.ts';
import { useGameStore } from '../client/lib/useGameStore.ts';
import { browserTurn, warmUpBrowserBot } from '../client/bot/client.ts';

type SideChoice = 'X' | 'O' | 'random';

const SIDE_OPTIONS: Array<{ value: SideChoice; label: string }> = [
  { value: 'X', label: 'X (opens)' },
  { value: 'O', label: 'O' },
  { value: 'random', label: 'Random' },
];

const LEVEL_OPTIONS = BOT_META.hexweb.levelLabels.map((label, i) => ({ value: i + 1, label }));

type Mode = 'play' | 'watch';
type WatchBot = 'hexweb' | 'rookie';
const WATCH_BOTS: Array<{ value: WatchBot; label: string }> = [
  { value: 'hexweb', label: 'Six' },
  { value: 'rookie', label: 'Rookie' },
];
const levelOptions = (bot: WatchBot) => BOT_META[bot].levelLabels.map((label, i) => ({ value: i + 1, label }));

/** Which bot, and its thinking time (Six) or strength (Rookie). */
function BotPick({ side, bot, level, onBot, onLevel }: {
  side: 'X' | 'O';
  bot: WatchBot;
  level: number;
  onBot: (bot: WatchBot) => void;
  onLevel: (level: number) => void;
}) {
  return (
    <>
      <Segmented label={`${side} plays`} value={bot} options={WATCH_BOTS} onChange={onBot} />
      <Segmented label={bot === 'hexweb' ? `${side}'s thinking time` : `${side}'s strength`} value={level} options={levelOptions(bot)} onChange={onLevel} />
    </>
  );
}

const RADIUS = 8;
const EXHIBITION_MS = 500;
const EXHIBITION_NAME = 'Six';

/** Six plays itself behind the panel so the arena is never empty. */
function useExhibition() {
  const store = useGameStore(() => new Game(RADIUS));
  const { game, version, place, replace } = store;
  const turnKey = game.winner ? `won-${version}` : `turn-${game.turn}-${game.moves.length === 0 ? 0 : 1}`;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      if (game.winner) {
        await wait(6000);
        if (!cancelled) replace(new Game(RADIUS));
        return;
      }
      await wait(game.moves.length === 0 ? 900 : 1100);
      while (!cancelled && document.hidden) await wait(1000);
      if (cancelled) return;
      let cells;
      try {
        cells = await browserTurn(game.moves, RADIUS, EXHIBITION_MS, controller.signal);
      } catch {
        return; // Six failed to load, or a match started
      }
      for (const [i, cell] of cells.entries()) {
        if (cancelled) return;
        if (i > 0) await wait(650);
        const res = place(cell);
        if (!res.ok || res.won) break;
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [turnKey]);

  return store;
}

/** Goes through our own proxy (deploy/worker.js) since HeXO's API doesn't allow cross-origin reads. */
async function fetchHexo(text: string): Promise<ImportedGame> {
  const link = parseHexoLink(text);
  if (!link) throw new Error('Paste a HeXO sandbox or game link, like https://hexo.did.science/sandbox/ldqa40j');
  let res: Response;
  try {
    res = await fetch(`/api/hexo/${link.kind}/${encodeURIComponent(link.id)}`);
  } catch {
    throw new Error("Couldn't reach HeXO. Check your connection and try again.");
  }
  if (res.status === 404) throw new Error(`HeXO has no ${link.kind === 'sandbox' ? 'sandbox position' : 'finished game'} at that link.`);
  if (!res.ok) throw new Error(`HeXO answered with an error (${res.status}).`);
  return fromHexo(link, await res.json());
}

export function PlayHome() {
  const [, navigate] = useLocation();
  const narrow = useNarrow();
  const board = useRef<BoardHandle>(null);
  const { game, version } = useExhibition();
  const [side, setSide] = useState<SideChoice>('X');
  const [level, setLevel] = useState(2);
  const [mode, setMode] = useState<Mode>('play');
  const [watch, setWatch] = useState<Record<'X' | 'O', { bot: WatchBot; level: number }>>({
    X: { bot: 'hexweb', level: 2 },
    O: { bot: 'hexweb', level: 2 },
  });
  const pick = (side: 'X' | 'O') => ({
    side,
    bot: watch[side].bot,
    level: watch[side].level,
    onBot: (bot: WatchBot) => setWatch((w) => ({ ...w, [side]: { bot, level: Math.min(w[side].level, BOT_META[bot].levelLabels.length) } })),
    onLevel: (lv: number) => setWatch((w) => ({ ...w, [side]: { ...w[side], level: lv } })),
  });

  // The network is about 20 MB, so start fetching it early.
  useEffect(() => warmUpBrowserBot(), []);

  return (
    <main className="stage home">
      <BoardCanvas
        ref={board}
        game={game}
        version={version}
        interactive={false}
        label="Exhibition game: Six against itself"
        inset={narrow ? { top: 150, right: 16, bottom: Math.round(window.innerHeight * 0.62), left: 16 } : { top: 110, right: 24, bottom: 24, left: 440 }}
      />
      <ChannelBug tag="Exhibition" detail={`${EXHIBITION_NAME} vs ${EXHIBITION_NAME}`} />
      <SettingsButton />
      <Scorebug
        names={{ X: EXHIBITION_NAME, O: EXHIBITION_NAME }}
        lastMove={lastMoveInfo(game)}
        onShowLastStone={() => board.current?.showLastStone()}
        current={game.current}
        stonesLeft={game.stonesLeft}
        turn={game.turn}
        winner={game.winner}
        finished={game.winner !== null}
      />

      <aside className="rundown plate" aria-labelledby="rundown-heading">
        <header className="rundown-header">
          <h1 id="rundown-heading" className="rundown-heading">Play Six</h1>
          <p className="rundown-lede">
            Six in a row wins. X opens with one stone, then every turn is two stones, anywhere within the lit area.
          </p>
        </header>

        <div className="rundown-panel play-panel">
        <form
          className="rundown-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'watch') {
              navigate(`/watch?xb=${watch.X.bot}&x=${watch.X.level}&ob=${watch.O.bot}&o=${watch.O.level}&radius=${RADIUS}`);
              return;
            }
            const seat = side === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : side;
            navigate(`/bot?bot=hexweb&side=${seat}&level=${level}&radius=${RADIUS}`);
          }}
        >
          <Segmented
            label="Mode"
            value={mode}
            options={[{ value: 'play', label: 'Play Six' }, { value: 'watch', label: 'Bot vs bot' }]}
            onChange={setMode}
          />
          {mode === 'play' ? (
            <>
              <Segmented label="Your side" value={side} options={SIDE_OPTIONS} onChange={setSide} />
              <Segmented label="Six's thinking time" value={level} options={LEVEL_OPTIONS} onChange={setLevel} />
            </>
          ) : (
            <>
              <BotPick {...pick('X')} />
              <BotPick {...pick('O')} />
            </>
          )}
          <button type="submit" className="button is-primary">{mode === 'watch' ? 'Start bot match' : 'Start match'}</button>
        </form>
        <GameImport onImport={async (text) => {
          const parsed = parseGameText(text);
          if (parsed.kind === 'hexo') {
            const imported = await fetchHexo(text);
            reviewInBrowser(imported.moves, RADIUS, imported.names, imported.swapColors);
          } else if (parsed.kind === 'htttx') {
            reviewInBrowser(parsed.moves, RADIUS, { X: 'Player 1', O: 'Player 2' });
          } else {
            const r = parsed.record;
            reviewInBrowser(r.moves.map(([q, rr]) => ({ q, r: rr })), r.radius, { X: r.players.X.name, O: r.players.O.name }, r.swapColors);
          }
          navigate('/review');
        }} />
        <p className="legal-note">
          &copy; 2026 CixMango. Six and its trained network are open source under the MIT license:{' '}
          <a href="https://github.com/CixMango/Six" target="_blank" rel="noopener">source and download</a>.{' '}
          <a href="/notice.txt" target="_blank" rel="noopener">Full notice</a>
        </p>
        </div>
      </aside>
    </main>
  );
}
