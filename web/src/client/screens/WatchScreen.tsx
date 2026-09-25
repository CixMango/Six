import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { LocateFixed, Minus, Pause, Play, Plus, ShieldAlert, SkipForward } from 'lucide-react';
import { Game, type Player } from '../../shared/rules.ts';
import { buildReplay } from '../../shared/replay.ts';
import { SettingsButton } from '../components/Settings.tsx';
import { reviewInBrowser } from './ReviewScreen.tsx';
import { postmortem } from '../../shared/postmortem.ts';
import { BOT_META, botName, isBotId, parseGeneration, type BotId } from '../../shared/botMeta.ts';
import { chooseTurn } from '../../shared/bots/rookie.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import { BlunderCall, ChannelBug, Dock, LowerThird, MatchReport, Scorebug, Segmented } from '../components/Broadcast.tsx';
import { api } from '../lib/api.ts';
import { lastMoveInfo, parseLevel, parseRadius, summarizeTurn, threatCallout } from '../lib/gameView.ts';
import { wait } from '../lib/motion.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useGameStore } from '../lib/useGameStore.ts';
import { useWinChance } from '../lib/useWinChance.ts';
import { blunderModeOn } from '../lib/blunderMode.ts';
import { threatMarks, useThreatHints } from '../lib/threatHints.ts';

type Speed = 'slow' | 'normal' | 'fast';
/** `nextGame`: how long the match report stays up before the next game. */
const PACE: Record<Speed, { think: number; between: number; nextGame: number }> = {
  slow: { think: 1400, between: 700, nextGame: 16000 },
  normal: { think: 650, between: 350, nextGame: 11000 },
  fast: { think: 60, between: 40, nextGame: 4000 },
};

function publicName(id: BotId, level: number): string {
  const label = BOT_META[id].levelLabels[level - 1] ?? String(level);
  return id === 'hexweb' ? `Six ${label}` : `${BOT_META[id].name} ${label}`;
}

/** `offline`: the public build. Both bots run in the browser and nothing is saved. */
export function WatchScreen({ offline = false }: { offline?: boolean } = {}) {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const bots: Record<Player, BotId> = {
    X: isBotId(params.get('xb')) ? (params.get('xb') as BotId) : 'rookie',
    O: isBotId(params.get('ob')) ? (params.get('ob') as BotId) : 'rookie',
  };
  const levels: Record<Player, number> = { X: parseLevel(params.get('x'), 5), O: parseLevel(params.get('o'), 3) };
  const generations: Record<Player, number | null> = {
    X: bots.X === 'hexnet' ? parseGeneration(params.get('xg')) : null,
    O: bots.O === 'hexnet' ? parseGeneration(params.get('og')) : null,
  };
  const radius = parseRadius(params.get('radius'));
  const names: Record<Player, string> = offline
    ? { X: publicName(bots.X, levels.X), O: publicName(bots.O, levels.O) }
    : { X: botName(bots.X, levels.X, generations.X), O: botName(bots.O, levels.O, generations.O) };

  const store = useGameStore(() => new Game(radius));
  const { game, version } = store;
  const [showThreats, toggleThreats] = useThreatHints();
  const [blunderMode] = useState(blunderModeOn);
  const { chance, blunder, ratings } = useWinChance(game.moves, radius, game.winner, blunderMode, true, offline);
  const board = useRef<BoardHandle>(null);
  const narrow = useNarrow();
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [tally, setTally] = useState({ X: 0, O: 0, games: 0 });
  const [error, setError] = useState('');
  const pace = useRef(PACE.normal);
  pace.current = PACE[speed];

  const finished = game.winner !== null;

  // One bot turn per run; keyed by turn so stones within a turn don't restart it.
  useEffect(() => {
    if (!running || finished) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      const started = performance.now();
      try {
        const bot = bots[game.current];
        // Offline, Rookie runs here; everything else goes through api.botTurn.
        const cells = offline && bot === 'rookie'
          ? chooseTurn(game, { level: levels[game.current] })
          : await api.botTurn(game.moves, radius, bot, levels[game.current], controller.signal, generations[game.current]);
        await wait(Math.max(0, pace.current.think - (performance.now() - started)));
        for (const [i, cell] of cells.entries()) {
          if (cancelled) return;
          if (i > 0) await wait(pace.current.between);
          const res = store.place(cell);
          if (!res.ok || res.won) break;
        }
        setError('');
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setRunning(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [running, finished, game.turn, game]);

  // Keep each finished game with its saved replay so the report never links the next game's moves.
  const recorded = useRef<Game | null>(null);
  const [saved, setSaved] = useState<{ game: Game; id: string } | null>(null);
  useEffect(() => {
    if (!finished || recorded.current === game) return;
    recorded.current = game;
    const winner = game.winner!;
    setTally((t) => ({ ...t, [winner]: t[winner] + 1, games: t.games + 1 }));
    if (offline) return;
    void api
      .saveReplay(
        buildReplay({
          game,
          mode: 'botmatch',
          players: {
            X: { name: names.X, kind: 'bot', bot: `${bots.X}:${levels.X}` },
            O: { name: names.O, kind: 'bot', bot: `${bots.O}:${levels.O}` },
          },
          resignedBy: null,
        }),
      )
      .then(({ id }) => setSaved({ game, id }))
      .catch(() => setError('The last game could not be saved.'));
  }, [finished, game]);

  const replayId = saved && saved.game === game ? saved.id : null;

  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!finished || !running) return;
    const total = pace.current.nextGame;
    const started = performance.now();
    setSecondsLeft(Math.ceil(total / 1000));
    const tick = setInterval(() => setSecondsLeft(Math.max(0, Math.ceil((total - (performance.now() - started)) / 1000))), 250);
    const timer = setTimeout(() => store.replace(new Game(radius)), total);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [finished, running, game]);

  const report = useMemo(() => (finished ? postmortem(game, names) : null), [finished, game, names.X, names.O]);

  const series = tally.games > 0 ? `Series: ${names.X} ${tally.X} – ${tally.O} ${names.O}` : null;
  const summary = summarizeTurn(game, names);
  const threat = threatCallout(game, names);
  const title = error
    ? 'Broadcast paused'
    : finished
      ? `${names[game.winner!]} wins game ${tally.games}`
      : !running
        ? 'Paused'
        : (summary?.text ?? 'Opening stone coming up');
  const detail = error || threat || series || (offline ? 'Games keep coming until you pause.' : 'Every game in this broadcast is saved to Replays.');

  return (
    <main className="stage">
      <BoardCanvas
        ref={board}
        game={game}
        version={version}
        interactive={false}
        alarm={Boolean(chance?.proven) && !game.winner}
        marks={showThreats ? threatMarks(game) : undefined}
        label={`Bot match: ${names.X} against ${names.O}`}
        // The match report is taller than the lower third, so move the stones up.
        inset={
          narrow
            ? { top: 150, right: 16, bottom: report ? 380 : 250, left: 16 }
            : { top: 110, right: 24, bottom: report ? 300 : 130, left: 24 }
        }
      />
      <ChannelBug tag="Bot match" detail={offline ? `${names.X} vs ${names.O}` : `Radius ${radius}`} />
      <SettingsButton />
      <Scorebug names={names} lastMove={lastMoveInfo(game)} onShowLastStone={() => board.current?.showLastStone()} current={game.current} stonesLeft={game.stonesLeft} turn={game.turn} winner={game.winner} finished={finished} chance={chance} ratings={ratings} />
      <BlunderCall blunder={blunder} names={names} />

      {report ? (
        <MatchReport report={report} names={names} meta={series ?? undefined}>
          <p className="report-next">
            <span>{!running ? 'Holding on this report.' : secondsLeft > 0 ? `Next game in ${secondsLeft}s.` : 'Next game starting.'}</span>
            <button
              type="button"
              className="button"
              onClick={() => {
                if (offline) {
                  reviewInBrowser(game.moves, radius, names);
                  navigate('/review');
                } else if (replayId) {
                  navigate(`/review/${replayId}`);
                }
              }}
              disabled={!offline && !replayId}
            >
              Review with coach
            </button>
            <button type="button" className="button is-quiet" onClick={() => setRunning((r) => !r)}>
              {running ? 'Hold' : 'Play on'}
            </button>
          </p>
        </MatchReport>
      ) : (
        <LowerThird title={title} detail={detail} player={summary?.player ?? game.current} wipe={speed !== 'fast'}>
          <div className="lt-controls">
            <Segmented
              label="Speed"
              value={speed}
              options={[
                { value: 'slow', label: 'Slow' },
                { value: 'normal', label: 'Normal' },
                { value: 'fast', label: 'Fast' },
              ]}
              onChange={setSpeed}
            />
          </div>
        </LowerThird>
      )}

      <Dock
        actions={[
          running
            ? { icon: Pause, label: 'Pause the broadcast', onClick: () => setRunning(false) }
            : { icon: Play, label: 'Resume the broadcast', onClick: () => { setError(''); setRunning(true); }, tone: 'accent' },
          { icon: SkipForward, label: 'Start the next game', onClick: () => store.replace(new Game(radius)) },
          { icon: LocateFixed, label: 'Recenter on the stones', onClick: () => board.current?.recenter() },
          { icon: Minus, label: 'Zoom out', onClick: () => board.current?.zoomBy(0.8) },
          { icon: Plus, label: 'Zoom in', onClick: () => board.current?.zoomBy(1.25) },
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: toggleThreats, pressed: showThreats },
        ]}
      />
    </main>
  );
}
