import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useThinkBy } from '../lib/thinkBy.ts';
import { levelLabel, thinksByPositions } from '../../shared/thinking.ts';
import { TrainingHomeRow } from '../lib/localScreens.ts';
import { useLocation } from 'wouter';
import { ChevronDown } from 'lucide-react';
import { Game } from '../../shared/rules.ts';
import type { SideChoice } from '../../shared/protocol.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import { ChannelBug, Scorebug, Segmented } from '../components/Broadcast.tsx';
import { GameImport } from '../components/GameImport.tsx';
import { SettingsButton } from '../components/Settings.tsx';
import { useGeneration } from '../lib/generation.ts';
import { api } from '../lib/api.ts';
import { BOT_META, isBotId, isTimedBot, type BotId } from '../../shared/botMeta.ts';
import { lastMoveInfo } from '../lib/gameView.ts';
import { wait } from '../lib/motion.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useGameStore } from '../lib/useGameStore.ts';

type RowId = string;

const SIDE_OPTIONS: Array<{ value: SideChoice; label: string }> = [
  { value: 'X', label: 'X (opens)' },
  { value: 'O', label: 'O' },
  { value: 'random', label: 'Random' },
];

/** Background demo: the best local bot against itself at level 1 (Rookie until the server lists its bots). */
const EXHIBITION_BOTS: BotId[] = ['hexnet', 'hexbot', 'rookie'];

function exhibitionBot(bots: readonly BotId[]): { id: BotId; level: number; name: string } {
  const id = EXHIBITION_BOTS.find((b) => bots.includes(b)) ?? 'rookie';
  return id === 'rookie' ? { id, level: 4, name: 'Rookie' } : { id, level: 1, name: BOT_META[id].name };
}

function useExhibition(bot: { id: BotId; level: number }) {
  const store = useGameStore(() => new Game(9));
  const { game, version, place, replace } = store;
  const turnKey = game.winner ? `won-${version}` : `turn-${game.turn}-${game.moves.length === 0 ? 0 : 1}`;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      if (game.winner) {
        await wait(6000);
        if (!cancelled) replace(new Game(9));
        return;
      }
      await wait(game.moves.length === 0 ? 900 : 1100);
      while (!cancelled && document.hidden) await wait(1000);
      if (cancelled) return;
      try {
        const cells = await api.botTurn(game.moves, 9, bot.id, bot.level, controller.signal);
        for (const [i, cell] of cells.entries()) {
          if (cancelled) return;
          if (i > 0) await wait(650);
          const res = place(cell);
          if (!res.ok || (res.ok && res.won)) break;
        }
      } catch {
        // Server unavailable: the arena stays still.
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Once per turn; the loop places the stones within a turn.
  }, [turnKey, bot.id]);

  return store;
}

function RundownRow({ id, tag, title, summary, open, onToggle, children }: {
  id: RowId;
  tag: string;
  title: string;
  summary: string;
  open: boolean;
  onToggle: (id: RowId) => void;
  children: ReactNode;
}) {
  const panelId = useId();
  return (
    <li className="rundown-row" data-open={open}>
      <button type="button" className="rundown-head" aria-expanded={open} aria-controls={panelId} onClick={() => onToggle(id)}>
        <span className="rundown-tag caps">{tag}</span>
        <span className="rundown-titles">
          <span className="rundown-title">{title}</span>
          <span className="rundown-summary">{summary}</span>
        </span>
        <ChevronDown className="rundown-chevron" size={18} aria-hidden="true" />
      </button>
      <div id={panelId} className="rundown-panel" hidden={!open}>
        {children}
      </div>
    </li>
  );
}

/** Six if its network is here; otherwise the best engine the PC has, so the app still has an opponent. */
function offeredBots(bots: readonly BotId[]): BotId[] {
  return bots.includes('hexnet') ? ['hexnet'] : bots.includes('hexbot') ? ['hexbot'] : ['rookie'];
}

export function HomeScreen() {
  const [, navigate] = useLocation();
  const [loadedBots, setBots] = useState<BotId[] | null>(null);
  const bots = loadedBots ?? ['rookie'];
  const shown = exhibitionBot(bots);
  const exhibition = useExhibition(shown);
  const narrow = useNarrow();
  const board = useRef<BoardHandle>(null);
  const [open, setOpen] = useState<RowId | null>('bot');
  const [replayCount, setReplayCount] = useState<number | null>(null);

  const [botSide, setBotSide] = useState<SideChoice>('X');
  const [botId, setBotId] = useState<BotId>('rookie');
  const [botLevel, setBotLevel] = useState(3);
  const [generation] = useGeneration();

  const [watchXBot, setWatchXBot] = useState<BotId>('rookie');
  const [watchOBot, setWatchOBot] = useState<BotId>('rookie');
  const [watchX, setWatchX] = useState(5);
  const [watchO, setWatchO] = useState(3);

  useEffect(() => {
    api.replays().then((list) => setReplayCount(list.length)).catch(() => setReplayCount(null));
    api
      .bots()
      .then((list) => {
        const ids = list.map((b) => b.id).filter(isBotId);
        setBots(ids);
        const best = offeredBots(ids)[0]!;
        setBotId(best);
        setWatchXBot(best);
        setWatchOBot(best);
      })
      .catch(() => setBots(['rookie']));
  }, []);

  // The app offers Six alone; the choice is still shown so players see who they're up against.
  const botOptions = offeredBots(bots).map((id) => ({ value: id, label: BOT_META[id].name }));
  const [think] = useThinkBy();
  const levelOptions = (id: BotId) => BOT_META[id].levelLabels.map((label, i) => ({ value: i + 1, label: levelLabel(id, i + 1, label, think) }));
  /** "Six level" when thinking by positions, "Six thinking time" by time. */
  const levelName = (id: BotId) =>
    !isTimedBot(id) ? 'Rookie strength' : thinksByPositions(id, think) ? `${BOT_META[id].name} level · positions per turn` : `${BOT_META[id].name} thinking time`;

  const fit = (id: BotId, level: number) => Math.min(level, BOT_META[id].levelLabels.length);
  const toggle = (id: RowId) => setOpen((current) => (current === id ? null : id));
  const { game, version } = exhibition;

  return (
    <main className="stage home">
      <BoardCanvas
        ref={board}
        game={game}
        version={version}
        interactive={false}
        label={`Exhibition game: ${shown.name} against itself`}
        inset={narrow ? { top: 150, right: 16, bottom: Math.round(window.innerHeight * 0.62), left: 16 } : { top: 110, right: 24, bottom: 24, left: 440 }}
      />
      <ChannelBug tag="Exhibition" detail={`${shown.name} vs ${shown.name}`} />
      <SettingsButton />
      <Scorebug
        names={{ X: shown.name, O: shown.name }}
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
          <h1 id="rundown-heading" className="rundown-heading">Pick a match</h1>
          <p className="rundown-lede">
            Six in a row wins. X opens with one stone, then every turn is two stones, anywhere within the lit area.
          </p>
        </header>

        <ol className="rundown-list">
          <RundownRow id="hexo" tag="Import" title="Import a game" summary="HeXO link, HTTTX or a replay file" open={open === 'hexo'} onToggle={toggle}>
            <div className="rundown-form">
              <GameImport label="Game to import" onImport={async (text) => navigate(await api.importGame(text))} />
            </div>
          </RundownRow>
          <RundownRow
            id="bot"
            tag="VS bot"
            title="Play the bot"
            summary={botOptions.map((o) => o.label).join(', ')}
            open={open === 'bot'}
            onToggle={toggle}
          >
            <form
              className="rundown-form"
              onSubmit={(e) => {
                e.preventDefault();
                const gen = botId === 'hexnet' && generation !== null ? `&gen=${generation}` : '';
                navigate(`/bot?bot=${botId}&side=${botSide}&level=${botLevel}${gen}`);
              }}
            >
              <Segmented label="Opponent" value={botId} options={botOptions} onChange={(id) => { setBotId(id); setBotLevel((l) => fit(id, l)); }} />
              <Segmented label="Your side" value={botSide} options={SIDE_OPTIONS} onChange={setBotSide} />
              <Segmented label={levelName(botId)} value={botLevel} options={levelOptions(botId)} onChange={setBotLevel} />
              <button type="submit" className="button is-primary">Start match</button>
            </form>
          </RundownRow>



          <RundownRow id="watch" tag="Bot match" title="Bot vs Bot" summary="Pick the lineup, then sit back" open={open === 'watch'} onToggle={toggle}>
            <form
              className="rundown-form"
              onSubmit={(e) => {
                e.preventDefault();
                const xg = watchXBot === 'hexnet' && generation !== null ? `&xg=${generation}` : '';
                const og = watchOBot === 'hexnet' && generation !== null ? `&og=${generation}` : '';
                navigate(`/watch?xb=${watchXBot}&x=${watchX}&ob=${watchOBot}&o=${watchO}${xg}${og}`);
              }}
            >
              <Segmented label="X" value={watchXBot} options={botOptions} onChange={(id) => { setWatchXBot(id); setWatchX((l) => fit(id, l)); }} />
              <Segmented label={`X: ${levelName(watchXBot)}`} value={watchX} options={levelOptions(watchXBot)} onChange={setWatchX} />
              <Segmented label="O" value={watchOBot} options={botOptions} onChange={(id) => { setWatchOBot(id); setWatchO((l) => fit(id, l)); }} />
              <Segmented label={`O: ${levelName(watchOBot)}`} value={watchO} options={levelOptions(watchOBot)} onChange={setWatchO} />
              <p className="notice">SealBot, Strix and the other rival bots join this lineup once the test arena is built.</p>
              <button type="submit" className="button is-primary">Start broadcast</button>
            </form>
          </RundownRow>

          <RundownRow id="study" tag="Study" title="Analysis board" summary="Set up positions, see threats" open={open === 'study'} onToggle={toggle}>
            <div className="rundown-form">
              <p className="notice">Place stones for both sides, step back and forth, and branch into your own lines. Open any saved game from Replays.</p>
              <button type="button" className="button is-primary" onClick={() => navigate('/analysis')}>Open an empty board</button>
            </div>
          </RundownRow>

          <RundownRow
            id="replays"
            tag="Replays"
            title="Saved games"
            summary={replayCount === null ? 'Every finished game, kept on this PC' : `${replayCount} ${replayCount === 1 ? 'game' : 'games'} on this PC`}
            open={open === 'replays'}
            onToggle={toggle}
          >
            <div className="rundown-form">
              <p className="notice">Games against the bot, friends and bot matches are saved automatically when they end.</p>
              <button type="button" className="button is-primary" onClick={() => navigate('/replays')}>Browse replays</button>
            </div>
          </RundownRow>

          {TrainingHomeRow && <TrainingHomeRow Row={RundownRow} open={open === 'training'} onToggle={toggle} />}
        </ol>
      </aside>
    </main>
  );
}
