import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useParams, useSearch } from 'wouter';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, Lightbulb, LocateFixed, Minus, Plus, ShieldAlert } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { Game, playerForStone, type Player } from '../../shared/rules.ts';
import type { ReplayRecord } from '../../shared/replay.ts';
import { threatWindows } from '../../shared/tactics.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import type { BoardMark } from '../board/renderer.ts';
import { BlunderCall, ChannelBug, Dock, LowerThird, Scorebug, Segmented } from '../components/Broadcast.tsx';
import { api } from '../lib/api.ts';
import { lastMoveInfo, RADIUS_OPTIONS } from '../lib/gameView.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useWinChance } from '../lib/useWinChance.ts';
import { swappedTeamColors } from '../lib/teamColors.ts';

export function AnalysisScreen() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id?: string }>();
  // ?at=N opens the game at its Nth stone.
  const at = Number(new URLSearchParams(useSearch()).get('at'));
  const board = useRef<BoardHandle>(null);
  const narrow = useNarrow();

  const [record, setRecord] = useState<ReplayRecord | null>(null);
  const [loadError, setLoadError] = useState('');
  const [radius, setRadius] = useState<8 | 9>(9);
  const [line, setLine] = useState<Hex[]>([]);
  const [cursor, setCursor] = useState(0);
  const [showThreats, setShowThreats] = useState(true);
  const [suggestion, setSuggestion] = useState<{ at: number; cells: Hex[] } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    api
      .replay(id)
      .then((r) => {
        setRecord(r);
        setRadius(r.radius === 8 ? 8 : 9);
        const moves = r.moves.map(([q, r2]) => ({ q, r: r2 }));
        setLine(moves);
        setCursor(Number.isInteger(at) && at > 0 ? Math.min(at, moves.length) : moves.length);
        setVersion((v) => v + 1);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [id]);

  const original = useMemo(() => record?.moves.map(([q, r]) => ({ q, r })) ?? null, [record]);
  const inVariation = original !== null && (line.length !== original.length || line.some((m, i) => m.q !== original[i]!.q || m.r !== original[i]!.r));

  const game = useMemo(() => Game.fromMoves(line.slice(0, cursor), radius), [line, cursor, radius]);
  // Each position is judged while stepping through; a blunder marks the stone that lost the game.
  const { chance, blunder } = useWinChance(game.moves, radius, game.winner, true, false);

  const go = (n: number) => {
    const next = Math.max(0, Math.min(line.length, n));
    if (next !== cursor) {
      setCursor(next);
      setVersion((v) => v + 1);
    }
  };

  // Arrow keys step through the game unless the board or a field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, canvas, button, [role="toolbar"]')) return;
      if (e.key === 'ArrowLeft') go(cursor - 1);
      else if (e.key === 'ArrowRight') go(cursor + 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(line.length);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onPlace = (cell: Hex) => {
    if (game.winner || !game.isPlayable(cell.q, cell.r)) return;
    const next = [...line.slice(0, cursor), cell];
    setLine(next);
    setCursor(next.length);
    setSuggestion(null);
    setVersion((v) => v + 1);
  };

  const suggest = async () => {
    if (game.winner) return;
    setSuggesting(true);
    try {
      const cells = await api.botTurn(game.moves, radius, 'rookie', 5);
      setSuggestion({ at: cursor, cells });
    } catch {
      setSuggestion(null);
    } finally {
      setSuggesting(false);
    }
  };

  const playSuggestion = () => {
    if (!suggestion) return;
    const next = [...line.slice(0, cursor), ...suggestion.cells];
    const probe = Game.fromMoves(line.slice(0, cursor), radius);
    const legal: Hex[] = [];
    for (const c of suggestion.cells) {
      if (!probe.place(c.q, c.r).ok) break;
      legal.push(c);
      if (probe.winner) break;
    }
    const applied = next.slice(0, cursor + legal.length);
    setLine(applied);
    setCursor(applied.length);
    setSuggestion(null);
    setVersion((v) => v + 1);
  };

  const marks = useMemo<BoardMark[]>(() => {
    const out: BoardMark[] = [];
    if (showThreats && !game.winner) {
      for (const player of ['X', 'O'] as Player[]) {
        const seen = new Set<string>();
        for (const w of threatWindows(game, player)) {
          for (const e of w.empties) {
            const key = `${e.q},${e.r}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ cell: e, player, kind: 'threat' });
          }
        }
      }
    }
    if (suggestion && suggestion.at === cursor) {
      for (const cell of suggestion.cells) out.push({ cell, player: game.current, kind: 'ghost' });
    }
    return out;
  }, [game, showThreats, suggestion, cursor]);

  const names: Record<Player, string> = {
    X: record?.players.X.name ?? 'X side',
    O: record?.players.O.name ?? 'O side',
  };

  const threatsFor = (p: Player) => (game.winner ? 0 : threatWindows(game, p).length);
  const xThreats = threatsFor('X');
  const oThreats = threatsFor('O');

  let title: string;
  let detail: ReactNode;
  if (loadError) {
    title = 'Replay not found';
    detail = loadError;
  } else if (game.winner) {
    title = `${names[game.winner]} has six in a row`;
    detail = (
      <>
        Turn {game.turn} · {game.moves.length} stones
      </>
    );
  } else if (suggestion && suggestion.at === cursor) {
    title = `Rookie suggests the ${suggestion.cells.length === 1 ? 'marked stone' : 'two marked stones'}`;
    detail = 'A placeholder bot, not the trained engine. Treat it as a second opinion.';
  } else {
    title = game.moves.length === 0 ? 'Empty board: X opens' : `${names[game.current]} to place ${game.stonesLeft}`;
    const threatText =
      xThreats + oThreats === 0
        ? 'No open fours on the board.'
        : [xThreats && `X has ${xThreats} ${xThreats === 1 ? 'window' : 'windows'} one turn from six`, oThreats && `O has ${oThreats}`].filter(Boolean).join(' · ') + '.';
    detail = showThreats ? threatText : 'Click a lit cell to add a stone for the side to move.';
  }

  const turnLabel = `Stone ${cursor} of ${line.length}`;

  return (
    <main className="stage analysis" style={swappedTeamColors(record?.swapColors)}>
      <BoardCanvas
        swapColors={record?.swapColors}
        ref={board}
        game={game}
        version={version}
        interactive={!game.winner}
        onPlace={onPlace}
        marks={marks}
        alarm={Boolean(chance?.proven) && !game.winner}
        label="Analysis board"
        inset={narrow ? { top: 150, right: 16, bottom: 300, left: 16 } : { top: 110, right: 24, bottom: 170, left: 24 }}
      />
      <ChannelBug tag={record ? 'Replay' : 'Analysis'} detail={record ? `${names.X} vs ${names.O} · Radius ${radius}` : `Radius ${radius}`} />
      <Scorebug swapColors={record?.swapColors} names={names} lastMove={lastMoveInfo(game)} onShowLastStone={() => board.current?.showLastStone()} current={game.current} stonesLeft={game.stonesLeft} turn={game.turn} winner={game.winner} finished={game.winner !== null} chance={chance} />
      <BlunderCall blunder={blunder} names={names} />

      <LowerThird title={title} detail={detail} player={game.winner ?? game.current}>
        {suggestion && suggestion.at === cursor && (
          <div className="lt-actions">
            <button type="button" className="button" onClick={playSuggestion}>Play it</button>
            <button type="button" className="button is-quiet" onClick={() => setSuggestion(null)}>Dismiss</button>
          </div>
        )}
        {!record && line.length === 0 && (
          <div className="lt-controls">
            <Segmented label="Rules" value={radius} options={[...RADIUS_OPTIONS]} onChange={(v) => { setRadius(v as 8 | 9); setVersion((n) => n + 1); }} />
          </div>
        )}
      </LowerThird>

      <section className="timeline plate" aria-label="Move timeline">
        <div className="timeline-buttons">
          <button type="button" className="dock-button" onClick={() => go(0)} disabled={cursor === 0} aria-label="First stone"><ChevronsLeft size={18} aria-hidden="true" /></button>
          <button type="button" className="dock-button" onClick={() => go(cursor - 1)} disabled={cursor === 0} aria-label="Previous stone"><ChevronLeft size={18} aria-hidden="true" /></button>
          <button type="button" className="dock-button" onClick={() => go(cursor + 1)} disabled={cursor >= line.length} aria-label="Next stone"><ChevronRight size={18} aria-hidden="true" /></button>
          <button type="button" className="dock-button" onClick={() => go(line.length)} disabled={cursor >= line.length} aria-label="Last stone"><ChevronsRight size={18} aria-hidden="true" /></button>
        </div>
        <div className="timeline-track">
          <input
            type="range"
            className="timeline-range"
            min={0}
            max={Math.max(1, line.length)}
            value={cursor}
            disabled={line.length === 0}
            onChange={(e) => go(Number(e.target.value))}
            aria-label="Position in the game"
            aria-valuetext={turnLabel}
          />
          <div className="timeline-ticks" aria-hidden="true">
            {line.map((_, i) => (
              <span key={i} className="tick" data-player={playerForStone(i)} data-past={i < cursor} />
            ))}
          </div>
        </div>
        <p className="timeline-label caps">{turnLabel}</p>
        {inVariation && (
          <button
            type="button"
            className="button is-quiet"
            onClick={() => {
              setLine(original!);
              setCursor(Math.min(cursor, original!.length));
              setVersion((v) => v + 1);
            }}
          >
            Back to the game
          </button>
        )}
      </section>

      <Dock
        actions={[
          ...(record ? [{ icon: GraduationCap, label: 'Review with coach', onClick: () => navigate(`/review/${record.id}`) }] : []),
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: () => setShowThreats((s) => !s), pressed: showThreats },
          { icon: Lightbulb, label: suggesting ? 'Rookie is thinking' : 'Ask Rookie for a suggestion', onClick: suggest, disabled: suggesting || Boolean(game.winner) },
          { icon: LocateFixed, label: 'Recenter on the stones', onClick: () => board.current?.recenter() },
          { icon: Minus, label: 'Zoom out', onClick: () => board.current?.zoomBy(0.8) },
          { icon: Plus, label: 'Zoom in', onClick: () => board.current?.zoomBy(1.25) },
        ]}
      />
      {loadError && (
        <button type="button" className="button floating-back" onClick={() => navigate('/replays')}>
          Back to replays
        </button>
      )}
    </main>
  );
}
