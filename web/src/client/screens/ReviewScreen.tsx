import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleAlert, CircleHelp, FastForward, Flag, LocateFixed,
  Minus, OctagonX, Plus, Rewind, SearchX, ShieldAlert, ShieldCheck, ShieldOff, Star, Swords, ThumbsUp, Trophy, type LucideIcon,
} from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { Game, otherPlayer, type Player } from '../../shared/rules.ts';
import { gameStory, keyMoments, LABEL_ORDER, LABELS, PROVEN_LABELS, turnsOf, type GameReview, type Label, type PositionFacts, type TurnReview } from '../../shared/review.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import type { BoardMark } from '../board/renderer.ts';
import { ChannelBug, Dock, LowerThird, Scorebug } from '../components/Broadcast.tsx';
import { SettingsButton } from '../components/Settings.tsx';
import { ExportMenu } from '../components/ExportMenu.tsx';
import { buildReplay, newReplayId } from '../../shared/replay.ts';
import { api } from '../lib/api.ts';
import { lastMoveInfo } from '../lib/gameView.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { factsFor, QUICK_MS, useReview, type ReviewSource } from '../lib/useReview.ts';
import { turnTactics } from '../../shared/coachTactics.ts';
import { retryItems, retryOpponent, retryUrl, saveRetry } from '../lib/retry.ts';
import { threatMarks, useThreatHints } from '../lib/threatHints.ts';
import { swappedTeamColors } from '../lib/teamColors.ts';

export interface ReviewGameData {
  moves: Hex[];
  radius: 8 | 9;
  names: Record<Player, string>;
  winner: Player | null;
  replayId?: string;
  /** Bot seat ids with level ("hexnet:2"), so a retry faces the same opponent. */
  bots?: Partial<Record<Player, string>>;
  /** Colours swapped (a HeXO game where blue moved first). */
  swapColors?: boolean;
}

const ICONS: Record<Label, LucideIcon> = {
  six: Trophy,
  winning: Swords,
  'kept-win': ShieldCheck,
  best: Star,
  excellent: ThumbsUp,
  good: Check,
  inaccuracy: CircleHelp,
  mistake: CircleAlert,
  blunder: OctagonX,
  'missed-win': SearchX,
  'allowed-win': ShieldOff,
  lost: Flag,
};

export function plainWord(turn: TurnReview): string {
  switch (turn.label) {
    case 'six':
      return 'Six in a row. Game over.';
    case 'best':
      return "Exactly Six's own choice.";
    case 'kept-win':
      return 'The forced win is still on.';
    case 'excellent':
      return "Nearly as good as Six's choice.";
    case 'good':
      return 'A solid turn; a little better was there.';
    default:
      return '';
  }
}

const HEX_POINTS = '8,1 14.5,4.75 14.5,12.25 8,16 1.5,12.25 1.5,4.75';

export function KeyHex({ kind, player }: { kind: 'played' | 'better' | 'ghost'; player: Player }) {
  return (
    <svg className="review-key-hex" data-kind={kind} data-player={player} viewBox="0 0 16 17" aria-hidden="true">
      <polygon points={HEX_POINTS} />
    </svg>
  );
}

export function LabelChip({ label, compact = false }: { label: Label; compact?: boolean }) {
  const Icon = ICONS[label];
  return (
    <span className="label-chip" data-tone={LABELS[label].tone} data-label={label}>
      <Icon size={14} aria-hidden="true" />
      {!compact && <span>{LABELS[label].name}</span>}
    </span>
  );
}

/** X's win chance after each turn, plus the starting position. */
function traceOf(review: GameReview): number[] {
  const xChance = (t: TurnReview, v: number) => (t.mover === 'X' ? v : 1 - v);
  const first = review.turns[0];
  if (!first) return [];
  return [xChance(first, first.chanceBefore), ...review.turns.map((t) => xChance(t, t.chanceAfter))];
}

function EvalTrace({ review, total, selected, onSelect }: { review: GameReview; total: number; selected: number | null; onSelect: (turn: number) => void }) {
  const points = traceOf(review);
  const width = 300;
  const height = 64;
  const x = (i: number) => (total <= 0 ? 0 : (i / total) * width);
  const y = (v: number) => (1 - v) * height;
  const line = points.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = points.length ? `0,${height / 2} ${line} ${x(points.length - 1).toFixed(1)},${height / 2}` : '';
  return (
    <svg
      className="coach-trace"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Each side's chance to win across the game (X above the middle, O below)"
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const turn = Math.round(((e.clientX - box.left) / box.width) * total) - 1;
        onSelect(Math.max(0, Math.min(review.turns.length - 1, turn)));
      }}
    >
      <defs>
        <clipPath id="trace-x"><rect x="0" y="0" width={width} height={height / 2} /></clipPath>
        <clipPath id="trace-o"><rect x="0" y={height / 2} width={width} height={height / 2} /></clipPath>
      </defs>
      <polygon points={area} className="trace-fill is-x" clipPath="url(#trace-x)" />
      <polygon points={area} className="trace-fill is-o" clipPath="url(#trace-o)" />
      <line x1="0" x2={width} y1={height / 2} y2={height / 2} className="trace-mid" />
      <polyline points={line} className="trace-line" vectorEffect="non-scaling-stroke" />
      {review.turns.map((t, i) => LABELS[t.label].tone === 'bad' && (
        <line key={i} x1={x(i + 1)} x2={x(i + 1)} y1="0" y2={height} className="trace-mark" vectorEffect="non-scaling-stroke" />
      ))}
      {selected !== null && (
        <line x1={x(selected + 1)} x2={x(selected + 1)} y1="0" y2={height} className="trace-playhead" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

function Summary({ review, names, onPractise }: { review: GameReview; names: Record<Player, string>; onPractise: (player: Player) => void }) {
  return (
    <div className="coach-summary">
      {(['X', 'O'] as const).map((p) => {
        const s = review.summary[p];
        const notable = (Object.keys(s.counts) as Label[]).filter((l) => s.counts[l] > 0);
        return (
          <div key={p} className="coach-player" data-player={p}>
            <p className="coach-name caps"><span className={`team-chip is-${p.toLowerCase()}`} aria-hidden="true" />{names[p]}</p>
            <p className="coach-accuracy"><span className="numeral">{s.turns ? s.accuracy : '–'}</span><span className="field-label">Accuracy</span></p>
            <dl className="coach-counts">
              {notable.map((l) => (
                <div key={l}>
                  <dt><LabelChip label={l} /></dt>
                  <dd>{s.counts[l]}</dd>
                </div>
              ))}
            </dl>
            {keyMoments(review, p).length > 0 && (
              <button type="button" className="button is-quiet coach-practise" onClick={() => onPractise(p)}>
                Practise {keyMoments(review, p).length === 1 ? 'the key moment' : `${keyMoments(review, p).length} key moments`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LabelKey() {
  const row = (l: Label) => (
    <div key={l}>
      <dt><LabelChip label={l} /></dt>
      <dd>{LABELS[l].meaning}</dd>
    </div>
  );
  return (
    <details className="coach-key">
      <summary className="caps">What the labels mean</summary>
      <div className="coach-key-body">
        <p className="coach-key-group caps">Proven exactly</p>
        <p className="coach-key-note">The forced-win solver checks every turn; these are facts, not estimates.</p>
        <dl>{LABEL_ORDER.filter((l) => PROVEN_LABELS.has(l)).map(row)}</dl>
        <p className="coach-key-group caps">Judged by winning chance</p>
        <p className="coach-key-note">
          Everything else compares the mover's chance to win, as Six estimates it, before and after the turn.
        </p>
        <dl>{LABEL_ORDER.filter((l) => !PROVEN_LABELS.has(l)).map(row)}</dl>
        <p className="coach-key-group caps">Numbers and marks</p>
        <dl>
          <div><dt className="coach-key-term">Rating</dt><dd>Each turn scored 1 to 100 from the winning chance it kept; 100 gives nothing away.</dd></div>
          <div><dt className="coach-key-term">Accuracy</dt><dd>A player's average rating over their turns.</dd></div>
          <div><dt className="coach-key-term">Key moment</dt><dd>An inaccuracy or anything worse: the turns Practise and the key-moment buttons go to.</dd></div>
          <div><dt className="coach-key-term">Ringed stones</dt><dd>What was played that turn.</dd></div>
          <div><dt className="coach-key-term">Outlined cells</dt><dd>What Six would have played instead.</dd></div>
          <div><dt className="coach-key-term">Faint stones</dt><dd>How play goes on after the turn with Six's best for both sides (Show the follow-up).</dd></div>
          <div><dt className="coach-key-term">What happened</dt><dd>Board facts under the coach's word: lines one turn from six that were made, blocked or left open.</dd></div>
        </dl>
      </div>
    </details>
  );
}

/** Follow-up length in turns; a proven forced win is played out to six in a row, up to FORCED_TURNS. */
const FOLLOW_TURNS = 4;
const FORCED_TURNS = 12;

interface FollowUp {
  turn: number;
  /** Six's best turns after the reviewed one, alternating sides starting with the opponent. */
  line: Hex[][];
  done: boolean;
  six: Player | null;
}

function useFollowUp(moves: readonly Hex[], turn: TurnReview | undefined, index: number | null, radius: number, source: ReviewSource, on: boolean): FollowUp | null {
  const [follow, setFollow] = useState<FollowUp | null>(null);
  useEffect(() => {
    setFollow(null);
    if (!on || !turn || index === null) return;
    const controller = new AbortController();
    const base = moves.slice(0, turn.start + turn.stones.length);
    (async () => {
      const line: Hex[][] = [];
      let six: Player | null = Game.fromMoves(base, radius).winner;
      while (!six && line.length < FORCED_TURNS) {
        const pos = [...base, ...line.flat()];
        let facts: PositionFacts;
        try {
          facts = await factsFor(pos, radius, QUICK_MS, source, controller.signal);
        } catch {
          break;
        }
        if (controller.signal.aborted) return;
        if (facts.best.length === 0 || (!facts.proven && line.length >= FOLLOW_TURNS)) break;
        const best = facts.best;
        line.push(best);
        six = Game.fromMoves([...pos, ...best], radius).winner;
        setFollow({ turn: index, line: [...line], done: false, six });
      }
      if (!controller.signal.aborted) setFollow({ turn: index, line, done: true, six });
    })();
    return () => controller.abort();
  }, [on, turn?.start, index, moves, radius, source]);
  return follow && follow.turn === index ? follow : null;
}

/** Must match the CSS breakpoint for the bottom-sheet coach panel. */
const COACH_SHEET_WIDTH = 1100;

export function ReviewScreen({ data, source, onOpenBoard, onLeave, leaveLabel }: {
  data: ReviewGameData;
  source: ReviewSource;
  onOpenBoard?: (stones: number) => void;
  onLeave: () => void;
  leaveLabel: string;
}) {
  const board = useRef<BoardHandle>(null);
  const [, navigate] = useLocation();
  const sheet = useNarrow(COACH_SHEET_WIDTH);
  const { moves, radius, names, winner } = data;
  const turns = useMemo(() => turnsOf(moves), [moves]);
  const state = useReview(moves, radius, names, winner, source);
  const [selected, setSelected] = useState<number | null>(null);
  const [showBetter, setShowBetter] = useState(true);
  const [showFollow, setShowFollow] = useState(false);
  // Hiding Six's turn is for the turn on screen; the next turn shows it again.
  useEffect(() => setShowBetter(true), [selected]);
  const [showThreats, toggleThreats] = useThreatHints();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const shownStones = selected === null ? moves.length : turns[selected]!.start + turns[selected]!.stones.length;
  const game = useMemo(() => Game.fromMoves(moves.slice(0, shownStones), radius), [moves, shownStones, radius]);
  const turn = selected !== null ? state.review?.turns[selected] : undefined;
  const follow = useFollowUp(moves, turn, selected, radius, source, showFollow);
  const [followStep, setFollowStep] = useState<number | null>(null);
  useEffect(() => setFollowStep(null), [selected, showFollow]);
  const followShown = follow ? Math.min(followStep ?? follow.line.length, follow.line.length) : 0;
  const tactics = useMemo(
    () => (turn ? turnTactics(moves.slice(0, turn.start), turn.stones, radius, names) : []),
    [turn, moves, radius, names],
  );
  const story = useMemo(() => (state.review && state.done ? gameStory(state.review, names, winner) : null), [state.review, state.done, names, winner]);

  const select = (i: number | null) => {
    const next = i === null ? null : Math.max(0, Math.min(turns.length - 1, i));
    setSelected(next);
    if (next !== null) rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') select(selected === null ? 0 : selected + 1);
      else if (e.key === 'ArrowLeft') select(selected === null ? turns.length - 1 : selected - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const marks = useMemo<BoardMark[]>(() => {
    const threats = showThreats ? threatMarks(game) : [];
    if (!turn) return threats;
    const played = turn.stones.map((cell) => ({ cell, player: turn.mover, kind: 'played' as const }));
    const better = showBetter && turn.better ? turn.better.map((cell) => ({ cell, player: turn.mover, kind: 'better' as const })) : [];
    const line = follow
      ? follow.line.slice(0, followShown).flatMap((cells, k) => cells.map((cell) => ({ cell, player: k % 2 === 0 ? otherPlayer(turn.mover) : turn.mover, kind: 'ghost' as const })))
      : [];
    return [...threats, ...line, ...played, ...better];
  }, [showBetter, follow, followShown, showThreats, turn, game]);

  const moments = state.review ? keyMoments(state.review) : [];
  const prevMoment = [...moments].reverse().find((i) => selected === null || i < selected);
  const nextMoment = moments.find((i) => selected === null || i > selected);

  const retry = (turnIndices: number[]) => {
    if (!state.review || turnIndices.length === 0) return;
    const items = retryItems(moves, state.review, turnIndices);
    const session = {
      radius,
      names,
      opponent: retryOpponent(data.bots, items[0]!.mover, source === 'browser'),
      items,
      index: 0,
      back: data.replayId ? `/review/${data.replayId}` : '/review',
      swapColors: data.swapColors,
    };
    saveRetry(session);
    navigate(retryUrl(session));
  };

  const chance = turn ? { winX: turn.mover === 'X' ? turn.chanceAfter : 1 - turn.chanceAfter, proven: null } : null;
  const progress = state.done ? null : `Six is reviewing: position ${Math.min(state.judged + 1, state.total)} of ${state.total}`;

  let title: string;
  let detail: ReactNode;
  if (state.error) {
    title = 'The review stopped';
    detail = state.error;
  } else if (!turn) {
    title = selected === null ? 'Coach review' : `Turn ${selected + 1}`;
    detail = selected === null
      ? progress ?? 'Pick a turn in the list, or use the arrow keys, to hear what the coach thinks of it.'
      : 'Still reviewing this turn.';
  } else {
    title = `${LABELS[turn.label].name} · Turn ${selected! + 1}`;
    detail = turn.comment ?? plainWord(turn);
  }

  const coachCard = (
    <LowerThird title={title} detail={detail} player={turn?.mover ?? null} wipe={false}>
      {tactics.length > 0 && (
        <ul className="coach-facts" aria-label="What happened">
          {tactics.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      {turn && ((turn.better && showBetter) || showFollow) && (
        <p className="review-key">
          <span><KeyHex kind="played" player={turn.mover} /> Ringed: what was played</span>
          {turn.better && showBetter && <span><KeyHex kind="better" player={turn.mover} /> Outlined: what Six would play</span>}
          {showFollow && <span><KeyHex kind="ghost" player={otherPlayer(turn.mover)} /> Faint: how it goes on, Six's best for both sides</span>}
        </p>
      )}
      {turn && showFollow && (
        <p className="coach-follow" role="status">
          {!follow || !follow.done
            ? `Six is playing it out${follow ? `: ${follow.line.length} ${follow.line.length === 1 ? 'turn' : 'turns'} so far` : ''}…`
            : follow.six
              ? `${names[follow.six]} makes six in a row ${follow.line.length === 1 ? 'on the very next turn' : `${follow.line.length} turns later`}.`
              : follow.line.length === 0
                ? 'Nothing more to show here.'
                : `Six's best play for the next ${follow.line.length} turns: no six in a row yet.`}
        </p>
      )}
      {turn && showFollow && follow?.done && follow.line.length > 1 && (
        <div className="coach-follow-steps">
          <button type="button" className="button is-quiet" onClick={() => setFollowStep(Math.max(1, followShown - 1))} disabled={followShown <= 1}>
            <ChevronLeft size={16} aria-hidden="true" /> Earlier
          </button>
          <span className="caps">Turn {followShown} of {follow.line.length}</span>
          <button type="button" className="button is-quiet" onClick={() => setFollowStep(followShown + 1)} disabled={followShown >= follow.line.length}>
            Later <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {turn && (
        <div className="lt-actions">
          <button type="button" className="button is-primary" onClick={() => retry([selected!])}>
            Retry from here
          </button>
          {turn.better && (
            <button type="button" className="button" aria-pressed={showBetter} onClick={() => setShowBetter((s) => !s)}>
              {showBetter ? "Hide Six's turn" : "Show Six's turn"}
            </button>
          )}
          <button type="button" className="button" aria-pressed={showFollow} onClick={() => setShowFollow((s) => !s)}>
            {showFollow ? 'Hide the follow-up' : 'Show the follow-up'}
          </button>
          <button type="button" className="button is-quiet" onClick={() => state.lookDeeper(selected!)} disabled={state.deepening !== null || state.deep.has(selected!)}>
            {state.deepening === selected ? 'Looking deeper…' : state.deep.has(selected!) ? 'Looked deeper' : 'Look deeper'}
          </button>
        </div>
      )}
    </LowerThird>
  );

  return (
    <main className="stage review" style={swappedTeamColors(data.swapColors)}>
      <BoardCanvas
        ref={board}
        game={game}
        version={shownStones}
        interactive={false}
        marks={marks}
        swapColors={data.swapColors}
        label="Game review board"
        inset={sheet ? { top: 150, right: 16, bottom: Math.round(window.innerHeight * 0.54), left: 16 } : { top: 110, right: 440, bottom: 170, left: 24 }}
      />
      <ChannelBug tag="Review" />
      <SettingsButton />
      <Scorebug swapColors={data.swapColors} names={names} lastMove={lastMoveInfo(game)} onShowLastStone={() => board.current?.showLastStone()} current={game.current} stonesLeft={game.stonesLeft} turn={game.turn} winner={game.winner} finished={game.winner !== null} chance={chance} />

      {!sheet && coachCard}

      <aside className="coach plate" aria-label="Coach review">
        <header className="coach-header">
          <div className="coach-title-row">
            <h1 className="coach-heading">Coach</h1>
            <div className="coach-exits">
              <ExportMenu
                moves={moves}
                record={async () => (data.replayId && source === 'server'
                  ? api.replay(data.replayId)
                  : buildReplay({
                    game: Game.fromMoves(moves, radius),
                    mode: 'imported',
                    players: { X: { name: names.X, kind: 'human' }, O: { name: names.O, kind: 'human' } },
                    resignedBy: null,
                    id: newReplayId(),
                    swapColors: data.swapColors,
                  }))}
              />
              {onOpenBoard && <button type="button" className="button is-quiet" onClick={() => onOpenBoard(shownStones)}>Analysis board</button>}
              <button type="button" className="button is-quiet" onClick={onLeave}>{leaveLabel}</button>
            </div>
          </div>
          {progress && (
            <div className="coach-progress" role="status">
              <span className="caps">{progress}</span>
              <span className="coach-progress-bar"><span style={{ transform: `scaleX(${state.judged / state.total})` }} /></span>
            </div>
          )}
        </header>
        {sheet && <div className="coach-card-inline">{coachCard}</div>}
        {state.review && state.done && <Summary review={state.review} names={names} onPractise={(p) => retry(keyMoments(state.review!, p))} />}
        {story && <p className="coach-story">{story}</p>}
        <LabelKey />
        {state.review && <EvalTrace review={state.review} total={turns.length} selected={selected} onSelect={select} />}
        <div className="coach-list">
          <table className="coach-table">
            <thead>
              <tr><th scope="col">Turn</th><th scope="col">Played by</th><th scope="col">Coach</th><th scope="col" className="num">Rating</th></tr>
            </thead>
            <tbody>
              {turns.map((t, i) => {
                const r = state.review?.turns[i];
                return (
                  <tr
                    key={i}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    aria-selected={selected === i}
                    tabIndex={0}
                    onClick={() => select(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        select(i);
                      }
                    }}
                  >
                    <td className="num">{i + 1}</td>
                    <td><span className={`team-chip is-${t.mover.toLowerCase()}`} aria-hidden="true" /> {names[t.mover]}</td>
                    <td>{r ? <LabelChip label={r.label} /> : <span className="pending">…</span>}</td>
                    <td className="num">{r ? r.rating : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </aside>

      <Dock
        actions={[
          { icon: ChevronsLeft, label: 'First turn', onClick: () => select(0), disabled: selected === 0 },
          { icon: ChevronLeft, label: 'Previous turn', onClick: () => select(selected === null ? turns.length - 1 : selected - 1), disabled: selected === 0 },
          { icon: ChevronRight, label: 'Next turn', onClick: () => select(selected === null ? 0 : selected + 1), disabled: selected === turns.length - 1 },
          { icon: ChevronsRight, label: 'Last turn', onClick: () => select(turns.length - 1), disabled: selected === turns.length - 1 },
          { icon: Rewind, label: 'Previous key moment', onClick: () => prevMoment !== undefined && select(prevMoment), disabled: prevMoment === undefined },
          { icon: FastForward, label: 'Next key moment', onClick: () => nextMoment !== undefined && select(nextMoment), disabled: nextMoment === undefined },
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: toggleThreats, pressed: showThreats },
          { icon: LocateFixed, label: 'Recenter on the stones', onClick: () => board.current?.recenter() },
          { icon: Minus, label: 'Zoom out', onClick: () => board.current?.zoomBy(0.8) },
          { icon: Plus, label: 'Zoom in', onClick: () => board.current?.zoomBy(1.25) },
        ]}
      />
    </main>
  );
}

const SITE_REVIEW_KEY = 'six.review';

/** Public site: no server, so the finished game is passed to /review through sessionStorage. */
export function reviewInBrowser(moves: readonly Hex[], radius: number, names: Record<Player, string>, swapColors = false): void {
  const data: ReviewGameData = {
    moves: [...moves],
    radius: radius === 8 ? 8 : 9,
    names,
    winner: Game.fromMoves(moves, radius).winner,
    ...(swapColors ? { swapColors } : {}),
  };
  try {
    sessionStorage.setItem(SITE_REVIEW_KEY, JSON.stringify(data));
  } catch {
    // Storage blocked: the review page says there's nothing to review.
  }
}

export function SiteReviewScreen() {
  const [, navigate] = useLocation();
  const data = useMemo<ReviewGameData | null>(() => {
    try {
      const raw = sessionStorage.getItem(SITE_REVIEW_KEY);
      return raw ? (JSON.parse(raw) as ReviewGameData) : null;
    } catch {
      return null;
    }
  }, []);
  if (!data) {
    return (
      <main className="stage review">
        <LowerThird title="Nothing to review yet" detail="Finish a game, then choose Review with coach." />
        <button type="button" className="button floating-back" onClick={() => navigate('/')}>Back to Six</button>
      </main>
    );
  }
  return <ReviewScreen data={data} source="browser" onLeave={() => navigate('/')} leaveLabel="Back to Six" />;
}

export function AppReviewScreen() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<ReviewGameData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .replay(id)
      .then((r) => setData({
        moves: r.moves.map(([q, rr]) => ({ q, r: rr })),
        radius: r.radius === 8 ? 8 : 9,
        names: { X: r.players.X.name, O: r.players.O.name },
        // Only a six in a row ends on a finishing turn; after a resignation the last turn still gets judged.
        winner: Game.fromMoves(r.moves.map(([q, rr]) => ({ q, r: rr })), r.radius).winner,
        replayId: r.id,
        bots: { X: r.players.X.bot, O: r.players.O.bot },
        swapColors: r.swapColors,
      }))
      .catch((e: Error) => setError(e.message));
  }, [id]);
  if (error) {
    return (
      <main className="stage review">
        <LowerThird title="Replay not found" detail={error} />
        <button type="button" className="button floating-back" onClick={() => navigate('/replays')}>Back to replays</button>
      </main>
    );
  }
  if (!data) return <main className="stage review" aria-busy="true" />;
  return (
    <ReviewScreen
      data={data}
      source="server"
      onOpenBoard={(stones) => navigate(`/analysis/${data.replayId}?at=${stones}`)}
      onLeave={() => navigate('/replays')}
      leaveLabel="Replays"
    />
  );
}
