import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown } from 'lucide-react';
import { Game } from '../../shared/rules.ts';
import { ROOM_BOTS, ROOM_CODE_PATTERN, type SideChoice } from '../../shared/protocol.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import { ChannelBug, Scorebug, Segmented } from '../components/Broadcast.tsx';
import { HexoImport } from '../components/HexoImport.tsx';
import { SettingsButton } from '../components/Settings.tsx';
import { GenerationSlider } from '../components/GenerationSlider.tsx';
import { api, type ServerInfo, type TrainingView } from '../lib/api.ts';
import { BOT_META, isBotId, isTimedBot, type BotId } from '../../shared/botMeta.ts';
import { lastMoveInfo } from '../lib/gameView.ts';
import { playerName, savePlayerName } from '../lib/identity.ts';
import { wait } from '../lib/motion.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useGameStore } from '../lib/useGameStore.ts';

type RowId = 'hexo' | 'bot' | 'friend' | 'friendbot' | 'watch' | 'study' | 'replays' | 'training';

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

export function HomeScreen() {
  const [, navigate] = useLocation();
  const [loadedBots, setBots] = useState<BotId[] | null>(null);
  const bots = loadedBots ?? ['rookie'];
  const shown = exhibitionBot(bots);
  const exhibition = useExhibition(shown);
  const narrow = useNarrow();
  const board = useRef<BoardHandle>(null);
  const [open, setOpen] = useState<RowId | null>('bot');
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [replayCount, setReplayCount] = useState<number | null>(null);
  const [training, setTraining] = useState<TrainingView | null>(null);

  const [botSide, setBotSide] = useState<SideChoice>('X');
  const [botId, setBotId] = useState<BotId>('rookie');
  const [botLevel, setBotLevel] = useState(3);
  const [botGen, setBotGen] = useState<number | null>(null);
  const [gens, setGens] = useState<{ generations: number[]; newest: number | null }>({ generations: [], newest: null });

  const [name, setName] = useState(playerName);
  const [roomSide, setRoomSide] = useState<SideChoice>('random');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const [watchXBot, setWatchXBot] = useState<BotId>('rookie');
  const [watchOBot, setWatchOBot] = useState<BotId>('rookie');
  const [watchX, setWatchX] = useState(5);
  const [watchO, setWatchO] = useState(3);
  const [watchXGen, setWatchXGen] = useState<number | null>(null);
  const [watchOGen, setWatchOGen] = useState<number | null>(null);
  const [friendBot, setFriendBot] = useState<BotId>('rookie');
  const [friendBotLevel, setFriendBotLevel] = useState(3);
  const [friendBotSide, setFriendBotSide] = useState<SideChoice>('X');

  useEffect(() => {
    api.info().then(setInfo).catch(() => setInfo(null));
    api.replays().then((list) => setReplayCount(list.length)).catch(() => setReplayCount(null));
    api.training().then(setTraining).catch(() => setTraining(null));
    api.generations().then(setGens).catch(() => undefined);
    api
      .bots()
      .then((list) => {
        const ids = list.map((b) => b.id).filter(isBotId);
        setBots(ids);
        // Once the engine is built, HexBot is the default opponent.
        if (ids.includes('hexbot')) {
          setBotId('hexbot');
          setWatchXBot('hexbot');
        }
        if (ids.includes('hexnet')) setFriendBot('hexnet');
      })
      .catch(() => setBots(['rookie']));
  }, []);

  const botOptions = bots.map((id) => ({ value: id, label: BOT_META[id].name }));
  const levelOptions = (id: BotId) => BOT_META[id].levelLabels.map((label, i) => ({ value: i + 1, label }));

  const fit = (id: BotId, level: number) => Math.min(level, BOT_META[id].levelLabels.length);
  const toggle = (id: RowId) => setOpen((current) => (current === id ? null : id));
  // Room bots run on this PC, so the in-browser build is left out.
  const roomBotOptions = botOptions.filter((o) => (ROOM_BOTS as readonly string[]).includes(o.value));
  const createBotRoom = (e: FormEvent) => {
    e.preventDefault();
    savePlayerName(name);
    navigate(`/room/new?side=${friendBotSide}&bot=${friendBot}&level=${friendBotLevel}`);
  };

  const createRoom = (e: FormEvent) => {
    e.preventDefault();
    savePlayerName(name);
    navigate(`/room/new?side=${roomSide}`);
  };

  const joinRoom = (e: FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!ROOM_CODE_PATTERN.test(code)) {
      setJoinError('Room codes are four letters, like KDRW.');
      return;
    }
    savePlayerName(name);
    navigate(`/room/${code}`);
  };

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
          <RundownRow id="hexo" tag="Import" title="Review a HeXO game" summary="Paste a sandbox or game link" open={open === 'hexo'} onToggle={toggle}>
            <div className="rundown-form">
              <HexoImport label="HeXO link" onImport={async (link) => navigate(`/review/${await api.importHexo(link)}`)} />
            </div>
          </RundownRow>
          <RundownRow
            id="bot"
            tag="VS bot"
            title="Play the bot"
            summary={bots.length > 1 ? bots.map((id) => BOT_META[id].name).reverse().join(', ') : 'Rookie, strength 1 to 5'}
            open={open === 'bot'}
            onToggle={toggle}
          >
            <form
              className="rundown-form"
              onSubmit={(e) => {
                e.preventDefault();
                const gen = botId === 'hexnet' && botGen !== null ? `&gen=${botGen}` : '';
                navigate(`/bot?bot=${botId}&side=${botSide}&level=${botLevel}${gen}`);
              }}
            >
              {bots.length > 1 && <Segmented label="Opponent" value={botId} options={botOptions} onChange={(id) => { setBotId(id); setBotLevel((l) => fit(id, l)); }} />}
              <Segmented label="Your side" value={botSide} options={SIDE_OPTIONS} onChange={setBotSide} />
              {botId === 'hexnet' && <GenerationSlider label="Six's generation" generations={gens.generations} newest={gens.newest} value={botGen} onChange={setBotGen} />}
              <Segmented label={isTimedBot(botId) ? `${BOT_META[botId].name} thinking time` : 'Rookie strength'} value={botLevel} options={levelOptions(botId)} onChange={setBotLevel} />
              <button type="submit" className="button is-primary">Start match</button>
            </form>
          </RundownRow>

          <RundownRow id="friend" tag="Hamachi" title="Play a friend" summary="Share a link, nothing to install" open={open === 'friend'} onToggle={toggle}>
            <form className="rundown-form" onSubmit={createRoom}>
              <div>
                <label className="field-label" htmlFor="player-name">Your name</label>
                <input id="player-name" className="text-input" value={name} maxLength={24} autoComplete="nickname" placeholder="Shown on the scoreboard" onChange={(e) => setName(e.target.value)} />
              </div>
              <Segmented label="Your side" value={roomSide} options={SIDE_OPTIONS} onChange={setRoomSide} />
              <button type="submit" className="button is-primary">Create room</button>
            </form>
            <form className="join-form" onSubmit={joinRoom}>
              <label className="field-label" htmlFor="join-code">Have a room code?</label>
              <div className="join-row">
                <input
                  id="join-code"
                  className="text-input caps"
                  value={joinCode}
                  maxLength={4}
                  placeholder="KDRW"
                  aria-describedby={joinError ? 'join-error' : undefined}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    setJoinError('');
                  }}
                />
                <button type="submit" className="button">Join</button>
              </div>
              {joinError && <p id="join-error" className="error-text">{joinError}</p>}
            </form>
            <p className="notice hamachi-note">
              {info?.hamachiUrl ? (
                <>Friends on your Hamachi network connect through <strong>{info.hamachiUrl}</strong>.</>
              ) : info ? (
                <>Hamachi isn't connected on this PC. Friends on the same network can use {info.lanUrls[0] ?? 'this PC’s address'}.</>
              ) : (
                <>Checking your network…</>
              )}
            </p>
          </RundownRow>

          <RundownRow
            id="friendbot"
            tag="Hamachi"
            title="Friend vs bot"
            summary="Your friend joins, the bot plays them, you watch"
            open={open === 'friendbot'}
            onToggle={toggle}
          >
            <form className="rundown-form" onSubmit={createBotRoom}>
              <div>
                <label className="field-label" htmlFor="host-name">Your name</label>
                <input id="host-name" className="text-input" value={name} maxLength={24} autoComplete="nickname" placeholder="Shown to your friend" onChange={(e) => setName(e.target.value)} />
              </div>
              {roomBotOptions.length > 1 && <Segmented label="Their opponent" value={friendBot} options={roomBotOptions} onChange={(id) => { setFriendBot(id); setFriendBotLevel((l) => fit(id, l)); }} />}
              <Segmented label={isTimedBot(friendBot) ? 'Thinking time' : 'Rookie strength'} value={friendBotLevel} options={levelOptions(friendBot)} onChange={setFriendBotLevel} />
              <Segmented label="Your friend's side" value={friendBotSide} options={SIDE_OPTIONS} onChange={setFriendBotSide} />
              <button type="submit" className="button is-primary">Create room</button>
              <p className="notice">You get a link to send. When your friend opens it, they play the bot and you watch the game live.</p>
            </form>
          </RundownRow>


          <RundownRow id="watch" tag="Bot match" title="Watch bots play" summary="Pick the lineup, then sit back" open={open === 'watch'} onToggle={toggle}>
            <form
              className="rundown-form"
              onSubmit={(e) => {
                e.preventDefault();
                const xg = watchXBot === 'hexnet' && watchXGen !== null ? `&xg=${watchXGen}` : '';
                const og = watchOBot === 'hexnet' && watchOGen !== null ? `&og=${watchOGen}` : '';
                navigate(`/watch?xb=${watchXBot}&x=${watchX}&ob=${watchOBot}&o=${watchO}${xg}${og}`);
              }}
            >
              {bots.length > 1 && <Segmented label="X" value={watchXBot} options={botOptions} onChange={(id) => { setWatchXBot(id); setWatchX((l) => fit(id, l)); }} />}
              {watchXBot === 'hexnet' && <GenerationSlider label="X: Six's generation" generations={gens.generations} newest={gens.newest} value={watchXGen} onChange={setWatchXGen} />}
              <Segmented label={`X: ${BOT_META[watchXBot].name} ${isTimedBot(watchXBot) ? 'thinking time' : 'strength'}`} value={watchX} options={levelOptions(watchXBot)} onChange={setWatchX} />
              {bots.length > 1 && <Segmented label="O" value={watchOBot} options={botOptions} onChange={(id) => { setWatchOBot(id); setWatchO((l) => fit(id, l)); }} />}
              {watchOBot === 'hexnet' && <GenerationSlider label="O: Six's generation" generations={gens.generations} newest={gens.newest} value={watchOGen} onChange={setWatchOGen} />}
              <Segmented label={`O: ${BOT_META[watchOBot].name} ${isTimedBot(watchOBot) ? 'thinking time' : 'strength'}`} value={watchO} options={levelOptions(watchOBot)} onChange={setWatchO} />
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

          <RundownRow
            id="training"
            tag="Training"
            title="Six training"
            summary={!training ? 'How the self-taught network is doing' : training.started ? `Generation ${training.generation}${training.paused ? ', paused' : ''}` : 'Not started yet'}
            open={open === 'training'}
            onToggle={toggle}
          >
            <div className="rundown-form">
              <p className="notice">Each generation of Six’s network plays itself, learns from those games, and is measured against the one before it.</p>
              <button type="button" className="button is-primary" onClick={() => navigate('/training')}>Open training</button>
            </div>
          </RundownRow>
        </ol>
      </aside>
    </main>
  );
}
