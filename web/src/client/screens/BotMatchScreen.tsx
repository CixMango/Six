import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Flag, LocateFixed, Minus, Plus, RotateCcw, ShieldAlert, Undo2 } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { Game, otherPlayer, type Player } from '../../shared/rules.ts';
import { buildReplay } from '../../shared/replay.ts';
import { BOT_META, botName as botDisplayName, isBotId, parseGeneration, type BotId } from '../../shared/botMeta.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import { BlunderCall, ChannelBug, Dock, LowerThird, ResultBand, Scorebug } from '../components/Broadcast.tsx';
import { api } from '../lib/api.ts';
import { SettingsButton } from '../components/Settings.tsx';
import { KeyHex, LabelChip, plainWord, reviewInBrowser } from './ReviewScreen.tsx';
import { judgeTurn, LABELS, type PositionFacts, type TurnReview } from '../../shared/review.ts';
import type { BoardMark } from '../board/renderer.ts';
import { loadRetry, saveRetry, type RetrySession } from '../lib/retry.ts';
import { factsFor, QUICK_MS } from '../lib/useReview.ts';
import { turnTactics } from '../../shared/coachTactics.ts';
import { swappedTeamColors } from '../lib/teamColors.ts';
import { lastMoveInfo, parseLevel, parseRadius, summarizeTurn, takeBackTarget, threatCallout } from '../lib/gameView.ts';
import { playerName } from '../lib/identity.ts';
import { wait } from '../lib/motion.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useGameStore } from '../lib/useGameStore.ts';
import { useWinChance } from '../lib/useWinChance.ts';
import { blunderModeOn } from '../lib/blunderMode.ts';
import { AFTER_BLUNDER_MS, BLUNDER_CALL_MS } from '../../shared/winChance.ts';
import { threatMarks, useThreatHints } from '../lib/threatHints.ts';

/** Rookie answers instantly, so pad its moves to keep them readable. */
const MIN_THINK_MS = 500;
const BETWEEN_STONES_MS = 380;

/** Retry flow: turn being played, being judged, judged (bot waits), then play continues. */
type RetryPhase = 'try' | 'judging' | 'judged' | 'playing';

/** `offline`: the public build, with no server to save replays to. */
export function BotMatchScreen({ offline = false }: { offline?: boolean } = {}) {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const bot: BotId = isBotId(params.get('bot')) ? (params.get('bot') as BotId) : 'rookie';
  const level = parseLevel(params.get('level'));
  const generation = bot === 'hexnet' ? parseGeneration(params.get('gen')) : null;
  const radius = parseRadius(params.get('radius'));
  const sideParam = params.get('side');

  // Retry from a review: the game starts just before the reviewed turn (see lib/retry.ts).
  const [retry, setRetry] = useState<RetrySession | null>(() => (params.get('retry') ? loadRetry() : null));
  const item = retry ? retry.items[retry.index]! : null;
  const pickSide = (): Player => (item ? item.mover : sideParam === 'X' || sideParam === 'O' ? sideParam : Math.random() < 0.5 ? 'X' : 'O');
  const [human, setHuman] = useState<Player>(pickSide);
  const botSeat = otherPlayer(human);
  const store = useGameStore(() => (item ? Game.fromMoves(item.moves, radius) : new Game(radius)));
  const { game, version } = store;
  const board = useRef<BoardHandle>(null);
  const narrow = useNarrow();

  const [thinking, setThinking] = useState(false);
  const [resigned, setResigned] = useState<Player | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [error, setError] = useState('');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  const savedName = playerName();
  const you = savedName || 'You';
  const botName = offline ? `Six ${BOT_META[bot].levelLabels[level - 1] ?? ''}`.trim() : botDisplayName(bot, level, generation);
  const names = { [human]: you, [botSeat]: botName } as Record<Player, string>;
  const [showThreats, toggleThreats] = useThreatHints();
  // Read once per match: switching mid-game would leave judgments half done.
  const [blunderMode] = useState(blunderModeOn);
  // A retry starts mid-game, and the review already judged the earlier stones.
  const { chance, blunder, verdict, ratings } = useWinChance(game.moves, radius, game.winner, blunderMode, !item, offline);
  const finished = game.winner !== null || resigned !== null;

  const [phase, setPhase] = useState<RetryPhase>('try');
  const [retryVerdict, setRetryVerdict] = useState<TurnReview | null>(null);
  const [showHint, setShowHint] = useState(true);
  const retryStart = item?.moves.length ?? 0;
  const retrySize = retryStart === 0 ? 1 : 2;
  const retryTurnDone = item !== null && game.moves.length > retryStart && (game.moves.length >= retryStart + retrySize || game.winner !== null);
  const botToMove = !finished && game.current === botSeat && (!item || phase === 'playing');

  useEffect(() => {
    if (!item || !retryTurnDone || phase !== 'try') return;
    setPhase('judging');
    const controller = new AbortController();
    const stones = game.moves.slice(retryStart, retryStart + retrySize);
    const madeSix = game.winner === item.mover;
    (async () => {
      try {
        const after: PositionFacts = madeSix
          ? { winX: item.mover === 'X' ? 1 : 0, proven: item.mover, best: [] }
          : await factsFor(game.moves.slice(0, retryStart + retrySize), radius, QUICK_MS, offline ? 'browser' : 'server', controller.signal);
        if (controller.signal.aborted) return;
        setRetryVerdict(judgeTurn({ mover: item.mover, start: retryStart, stones }, item.before, after, names, madeSix));
        setPhase('judged');
      } catch (e) {
        if (controller.signal.aborted) return;
        setError((e as Error).message || 'The coach could not judge this turn.');
        setPhase('judged');
      }
    })();
    return () => controller.abort();
    // A try-again un-completes the turn, which cancels the judging.
  }, [retryTurnDone, item]);

  const tryAgain = () => {
    if (!item) return;
    setResigned(null);
    setConfirmResign(false);
    setError('');
    setRetryVerdict(null);
    setPhase('try');
    store.undoTo(retryStart);
  };

  const nextRetry = () => {
    if (!retry || retry.index + 1 >= retry.items.length) return;
    const next = { ...retry, index: retry.index + 1 };
    const it = next.items[next.index]!;
    saveRetry(next);
    setRetry(next);
    setHuman(it.mover);
    setResigned(null);
    setConfirmResign(false);
    setError('');
    setRetryVerdict(null);
    setPhase('try');
    setShowHint(true);
    store.replace(Game.fromMoves(it.moves, radius));
  };
  const hasNext = retry !== null && retry.index + 1 < retry.items.length;

  // Keyed by turn so the bot's own stones don't restart it.
  useEffect(() => {
    if (!botToMove) return;
    let cancelled = false;
    const controller = new AbortController();
    setThinking(true);
    setError('');
    (async () => {
      const started = performance.now();
      try {
        // Bot thinks while the human's turn is judged; after a blunder it waits for the call to finish.
        const [cells, blundered] = await Promise.all([
          api.botTurn(game.moves, radius, bot, level, controller.signal, generation),
          verdict(game.moves.length),
        ]);
        if (blundered) await wait(BLUNDER_CALL_MS + AFTER_BLUNDER_MS);
        await wait(Math.max(0, MIN_THINK_MS - (performance.now() - started)));
        for (const [i, cell] of cells.entries()) {
          if (cancelled) return;
          if (i > 0) await wait(BETWEEN_STONES_MS);
          const res = store.place(cell);
          if (!res.ok || res.won) break;
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'The bot could not move.');
      } finally {
        if (!cancelled) setThinking(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      setThinking(false);
    };
  }, [botToMove ? game.turn : null, human, game]);

  useEffect(() => {
    // Retries from a review aren't saved.
    if (offline || item || !finished || saveState !== 'idle') return;
    setSaveState('saving');
    const record = buildReplay({
      game,
      mode: 'bot',
      players: {
        X: human === 'X' ? { name: you, kind: 'human' } : { name: botName, kind: 'bot', bot: `${bot}:${level}` },
        O: human === 'O' ? { name: you, kind: 'human' } : { name: botName, kind: 'bot', bot: `${bot}:${level}` },
      },
      resignedBy: resigned,
    });
    api
      .saveReplay(record)
      .then(({ id }) => {
        setReplayId(id);
        setSaveState('saved');
      })
      .catch(() => setSaveState('failed'));
  }, [finished, saveState, game, human, you, botName, level, resigned]);

  const onPlace = (cell: Hex) => {
    if (finished || game.current !== human || thinking) return;
    setConfirmResign(false);
    store.place(cell);
  };

  const takeBack = () => {
    // During a retry, undo stops at the start of the retried turn.
    if (item && phase !== 'playing') {
      store.undoTo(retryStart);
      return;
    }
    const target = takeBackTarget(game, human);
    if (target !== null) store.undoTo(item ? Math.max(target, retryStart) : target);
  };

  const playAgain = () => {
    if (sideParam !== 'X' && sideParam !== 'O') setHuman((h) => otherPlayer(h));
    setResigned(null);
    setConfirmResign(false);
    setReplayId(null);
    setSaveState('idle');
    setError('');
    store.replace(new Game(radius));
  };

  const yourTurn = !finished && game.current === human;
  const summary = summarizeTurn(game, names);
  const threat = threatCallout(game, names);
  let title: string;
  let detail: string | undefined;
  let tone: Player = human;
  if (error) {
    title = 'The bot hit a problem';
    detail = `${error} Reload the page to try again.`;
  } else if (thinking) {
    title = `${botName} is thinking`;
    detail = summary?.text;
    tone = botSeat;
  } else if (!summary) {
    title = 'Your move: open the game';
    detail = 'Place your first stone anywhere in the lit area.';
  } else {
    title = summary.text;
    detail = threat ?? undefined;
    tone = summary.player;
  }

  const canTakeBack = item
    ? !finished && !thinking && phase !== 'judging' && phase !== 'judged' && game.moves.length > retryStart
    : !finished && !thinking && takeBackTarget(game, human) !== null;

  // Six's pick for the retried turn, drawn as an outline.
  const retryMarks: BoardMark[] =
    item && showHint && (phase === 'try' || phase === 'judging' || phase === 'judged')
      ? item.before.best.map((cell) => ({ cell, player: item.mover, kind: 'better' as const }))
      : [];
  const marks = [...(showThreats ? threatMarks(game) : []), ...retryMarks];
  const backToReview = () => retry && navigate(retry.back);

  let retryCard: React.ReactNode = null;
  if (item && retry && !error && phase !== 'playing') {
    const inGame = `In the game: ${LABELS[item.label].name.toLowerCase()}.`;
    const count = retry.items.length > 1 ? ` · ${retry.index + 1} of ${retry.items.length}` : '';
    const hintButton = item.before.best.length > 0 && (
      <button type="button" className="button" aria-pressed={showHint} onClick={() => setShowHint((h) => !h)}>
        {showHint ? "Hide Six's turn" : "Show Six's turn"}
      </button>
    );
    if (phase === 'try') {
      retryCard = (
        <LowerThird title={`Retry turn ${item.turn + 1}${count}`} detail={`${inGame} ${showHint && item.before.best.length ? "Six's pick is outlined: play it, or find your own." : 'Find a better turn.'}`} player={human} wipe={false}>
          {showHint && item.before.best.length > 0 && (
            <p className="review-key"><span><KeyHex kind="better" player={item.mover} /> Outlined: what Six would play</span></p>
          )}
          <div className="lt-actions">
            {hintButton}
            <button type="button" className="button is-quiet" onClick={backToReview}>Back to review</button>
          </div>
        </LowerThird>
      );
    } else if (phase === 'judging') {
      retryCard = <LowerThird title="The coach is judging your turn" detail={inGame} player={human} wipe={false} />;
    } else if (retryVerdict) {
      const good = LABELS[retryVerdict.label].tone === 'great' || LABELS[retryVerdict.label].tone === 'good';
      retryCard = (
        <LowerThird title={`Your retry: ${LABELS[retryVerdict.label].name}`} detail={`${retryVerdict.comment ?? plainWord(retryVerdict)} ${inGame}`} player={human} wipe={false}>
          {(() => {
            const facts = turnTactics(item.moves, retryVerdict.stones, radius, names);
            return facts.length > 0 && <ul className="coach-facts" aria-label="What happened">{facts.map((f) => <li key={f}>{f}</li>)}</ul>;
          })()}
          <p className="review-key"><LabelChip label={retryVerdict.label} /><span>Rated {retryVerdict.rating} of 100</span></p>
          <div className="lt-actions">
            {hasNext && <button type="button" className={good ? 'button is-primary' : 'button'} onClick={nextRetry}>Next key moment</button>}
            <button type="button" className={good && hasNext ? 'button' : 'button is-primary'} onClick={tryAgain}>Try again</button>
            {!finished && <button type="button" className="button" onClick={() => setPhase('playing')}>Play on</button>}
            {hintButton}
            <button type="button" className="button is-quiet" onClick={backToReview}>Back to review</button>
          </div>
        </LowerThird>
      );
    }
  }

  return (
    <main className="stage" style={swappedTeamColors(retry?.swapColors)}>
      <BoardCanvas
        ref={board}
        swapColors={retry?.swapColors}
        game={game}
        version={version}
        interactive={yourTurn && !thinking}
        onPlace={onPlace}
        alarm={Boolean(chance?.proven) && !game.winner}
        marks={marks.length ? marks : undefined}
        label={`Game against ${botName}`}
        inset={narrow ? { top: 150, right: 16, bottom: 160, left: 16 } : { top: 110, right: 24, bottom: 90, left: 24 }}
      />
      {/* The public site always plays radius 8. */}
      <ChannelBug tag={item ? 'Retry' : 'VS bot'} detail={offline ? botName : `${botName} · Radius ${radius}`} />
      <SettingsButton />
      <Scorebug swapColors={retry?.swapColors}
        names={names}
        lastMove={lastMoveInfo(game)}
        onShowLastStone={() => board.current?.showLastStone()}
        current={game.current}
        stonesLeft={game.stonesLeft}
        turn={game.turn}
        winner={game.winner ?? (resigned ? otherPlayer(resigned) : null)}
        finished={finished}
        you={savedName ? human : null}
        chance={chance}
        ratings={ratings}
      />
      <BlunderCall blunder={blunder} names={names} />

      {retryCard}
      {!retryCard && !finished &&
        (confirmResign ? (
          <LowerThird title="Resign this game?" detail={`${botName} will be recorded as the winner.`} player={human}>
            <div className="lt-actions">
              <button type="button" className="button" onClick={() => setResigned(human)}>Resign</button>
              <button type="button" className="button is-quiet" onClick={() => setConfirmResign(false)}>Keep playing</button>
            </div>
          </LowerThird>
        ) : (
          <LowerThird title={title} detail={detail} player={tone} />
        ))}

      {finished && !retryCard && (
        <ResultBand
          winner={game.winner ?? (resigned ? otherPlayer(resigned) : null)}
          reason={game.winner ? 'six' : 'resign'}
          names={names}
          turn={game.turn}
          stones={game.moves.length}
          note={saveState === 'failed' ? 'This game could not be saved.' : undefined}
          actions={item
            ? [
                { label: 'Try again', onClick: tryAgain, primary: true },
                ...(hasNext ? [{ label: 'Next key moment', onClick: nextRetry }] : []),
                { label: 'Back to review', onClick: backToReview },
              ]
            : offline
            ? [
                { label: 'Play again', onClick: playAgain, primary: true },
                { label: 'Review with coach', onClick: () => { reviewInBrowser(game.moves, radius, names); navigate('/review'); } },
                { label: 'Change settings', onClick: () => navigate('/') },
              ]
            : [
                { label: 'Play again', onClick: playAgain, primary: true },
                { label: saveState === 'saving' ? 'Saving…' : 'Review with coach', onClick: () => replayId && navigate(`/review/${replayId}`), disabled: !replayId },
                { label: 'Back to arena', onClick: () => navigate('/') },
              ]}
        />
      )}

      <Dock
        actions={[
          { icon: LocateFixed, label: 'Recenter on the stones', onClick: () => board.current?.recenter() },
          { icon: Minus, label: 'Zoom out', onClick: () => board.current?.zoomBy(0.8) },
          { icon: Plus, label: 'Zoom in', onClick: () => board.current?.zoomBy(1.25) },
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: toggleThreats, pressed: showThreats },
          { icon: Undo2, label: 'Take back your last turn', onClick: takeBack, disabled: !canTakeBack },
          ...(item ? [{ icon: RotateCcw, label: 'Retry this turn again', onClick: tryAgain, disabled: game.moves.length === retryStart }] : []),
          { icon: Flag, label: 'Resign', onClick: () => setConfirmResign(true), disabled: finished, tone: 'danger' },
        ]}
      />
    </main>
  );
}
