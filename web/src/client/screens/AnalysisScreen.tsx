import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useParams, useSearch } from 'wouter';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, LocateFixed, Minus, PencilLine, Plus, Redo2, ShieldAlert, Undo2 } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { Game, otherPlayer, type Player, type Setup } from '../../shared/rules.ts';
import type { ReplayRecord } from '../../shared/replay.ts';
import { looksLikeHexoNotation, parseHexoNotation, positionFor, setupFromGame, toHexoNotation } from '../../shared/setup.ts';
import { threatWindows } from '../../shared/tactics.ts';
import type { Evaluation } from '../../shared/winChance.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import type { BoardMark } from '../board/renderer.ts';
import { BlunderCall, ChannelBug, Dock, LowerThird, Scorebug, Segmented } from '../components/Broadcast.tsx';
import { SettingsButton } from '../components/Settings.tsx';
import { ThinkingMeter, useThinking } from '../components/ThinkingMeter.tsx';
import { api } from '../lib/api.ts';
import { lastMoveInfo } from '../lib/gameView.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useWinChance } from '../lib/useWinChance.ts';
import { swappedTeamColors } from '../lib/teamColors.ts';
import { ExportMenu } from '../components/ExportMenu.tsx';
import { buildReplay, newReplayId } from '../../shared/replay.ts';

/** What a click on the board does: play the side to move's stone, or edit the position freely. */
type Tool = 'turn' | 'X' | 'O' | 'erase';

const TOOL_OPTIONS: Array<{ value: Tool; label: string }> = [
  { value: 'turn', label: 'Play' },
  { value: 'X', label: 'X' },
  { value: 'O', label: 'O' },
  { value: 'erase', label: 'Erase' },
];

export function AnalysisScreen() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id?: string }>();
  // ?at=N opens the game at its Nth stone.
  const at = Number(new URLSearchParams(useSearch()).get('at'));
  const board = useRef<BoardHandle>(null);
  const narrow = useNarrow();

  const [record, setRecord] = useState<ReplayRecord | null>(null);
  const [loadError, setLoadError] = useState('');
  const [radius, setRadius] = useState<8 | 9>(8);
  // A set-up position the moves start from (free placement or an imported HeXO position), or null for an empty board.
  const [setup, setSetup] = useState<Setup | null>(null);
  const [line, setLine] = useState<Hex[]>([]);
  const [cursor, setCursor] = useState(0);
  const [showThreats, setShowThreats] = useState(true);
  const [editOpen, setEditOpen] = useState(() => !narrow);
  const [tool, setTool] = useState<Tool>('turn');
  const [suggestion, setSuggestion] = useState<{ key: string; side: Player; cells: Hex[] } | null>(null);
  const [suggesting, setSuggesting] = useState<Player | null>(null);
  const [suggestError, setSuggestError] = useState('');
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [version, setVersion] = useState(0);
  const meter = useThinking();

  useEffect(() => {
    if (!id) return;
    api
      .replay(id)
      .then((r) => {
        setRecord(r);
        past.current = [];
        future.current = [];
        setRadius(r.radius === 8 ? 8 : 9);
        setSetup(r.setup ?? null);
        const moves = r.moves.map(([q, r2]) => ({ q, r: r2 }));
        setLine(moves);
        setCursor(Number.isInteger(at) && at > 0 ? Math.min(at, moves.length) : moves.length);
        setVersion((v) => v + 1);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [id]);

  const original = useMemo(() => record?.moves.map(([q, r]) => ({ q, r })) ?? null, [record]);
  const inVariation =
    original !== null &&
    (JSON.stringify(setup) !== JSON.stringify(record?.setup ?? null) ||
      line.length !== original.length ||
      line.some((m, i) => m.q !== original[i]!.q || m.r !== original[i]!.r));

  const start = useMemo(() => new Game(radius, setup), [radius, setup]);
  const game = useMemo(() => Game.fromMoves(line.slice(0, cursor), radius, setup), [line, cursor, radius, setup]);
  const positionKey = useMemo(() => JSON.stringify([radius, setup, line.slice(0, cursor)]), [radius, setup, line, cursor]);

  // Games from an empty board are judged stone by stone (blunders included); a set-up position just gets its chance.
  const { chance: gameChance, blunder } = useWinChance(game.moves, radius, game.winner, setup === null, false);
  const [setupChance, setSetupChance] = useState<Evaluation | null>(null);
  useEffect(() => {
    setSetupChance(null);
    if (!setup) return;
    if (game.winner) {
      setSetupChance({ winX: game.winner === 'X' ? 1 : 0, proven: game.winner });
      return;
    }
    const abort = new AbortController();
    api
      .evaluate(game.moves, radius, abort.signal, false, setup)
      .then((e) => setSetupChance({ winX: e.winX, proven: e.proven }))
      .catch(() => undefined);
    return () => abort.abort();
  }, [positionKey]);
  const chance = setup ? setupChance : gameChance;

  const go = (n: number) => {
    const next = Math.max(0, Math.min(line.length, n));
    if (next !== cursor) {
      setCursor(next);
      setVersion((v) => v + 1);
    }
  };

  // Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) undo and redo edits, anywhere but a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest('input, textarea')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undo();
      else if (key === 'y' || (key === 'z' && e.shiftKey)) redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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

  /** Every edit (a stone, a set-up change, an import) goes through here, so it can be undone. */
  type Snapshot = { setup: Setup | null; line: Hex[]; cursor: number };
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [, setHistoryVersion] = useState(0);
  const show = (next: Snapshot) => {
    setSetup(next.setup);
    setLine(next.line);
    setCursor(next.cursor);
    setSuggestion(null);
    setVersion((v) => v + 1);
    setHistoryVersion((v) => v + 1);
  };
  const commit = (next: Snapshot) => {
    past.current.push({ setup, line, cursor });
    if (past.current.length > 500) past.current.shift();
    future.current = [];
    show(next);
  };
  const undo = () => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push({ setup, line, cursor });
    show(previous);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ setup, line, cursor });
    show(next);
  };

  /** Starts over from `next`: the moves so far become part of the position. */
  const startFrom = (next: Setup | null, moves: Hex[] = []) => commit({ setup: next, line: moves, cursor: moves.length });

  // The side to move and stones left, as the controls show them (after a six: the loser's turn).
  const sideToMove: Player = game.winner ? otherPlayer(game.winner) : game.current;
  const stonesLeft: 1 | 2 = game.winner ? 2 : game.stonesLeft === 1 ? 1 : 2;

  const activeTool: Tool = editOpen ? tool : 'turn';

  const editCell = (cell: Hex) => {
    const owner = game.stoneAt(cell.q, cell.r);
    if (activeTool === 'erase' && !owner) return;
    const stones = setupFromGame(game, sideToMove, stonesLeft).stones.filter((s) => s.q !== cell.q || s.r !== cell.r);
    // Clicking a stone of the colour being placed takes it off again.
    if ((activeTool === 'X' || activeTool === 'O') && owner !== activeTool) stones.push({ q: cell.q, r: cell.r, player: activeTool });
    startFrom({ stones, toMove: sideToMove, stonesLeft });
  };

  const setTurn = (side: Player, left: 1 | 2) => {
    if (side === sideToMove && left === stonesLeft && !game.winner) return;
    startFrom(setupFromGame(game, side, left));
  };

  const onPlace = (cell: Hex) => {
    if (game.winner || !game.isPlayable(cell.q, cell.r)) return;
    const next = [...line.slice(0, cursor), cell];
    commit({ setup, line: next, cursor: next.length });
  };

  const suggest = async (side: Player) => {
    setSuggestError('');
    setSuggesting(side);
    const key = positionKey;
    try {
      const pos = positionFor(game, side);
      const cells = await api.suggest(pos.moves, radius, pos.setup, undefined, meter.start()).finally(meter.stop);
      setSuggestion({ key, side, cells });
    } catch (e) {
      setSuggestion(null);
      setSuggestError((e as Error).message);
    } finally {
      setSuggesting(null);
    }
  };
  const shown = suggestion && suggestion.key === positionKey ? suggestion : null;

  const playSuggestion = () => {
    if (!shown) return;
    const pos = positionFor(game, shown.side);
    const probe = Game.fromMoves(pos.moves, radius, pos.setup);
    const legal: Hex[] = [];
    for (const c of shown.cells) {
      if (!probe.place(c.q, c.r).ok) break;
      legal.push(c);
      if (probe.winner) break;
    }
    if (pos.setup === setup) {
      const next = [...line.slice(0, cursor), ...legal];
      commit({ setup, line: next, cursor: next.length });
    } else {
      // Not that side's turn: the position is set up with them to move, then their stones are played.
      startFrom(pos.setup, legal);
    }
  };

  /** A HeXO position loads here; games (HeXO links, HTTTX, replay files) are saved and open as their own replay. */
  const loadPasted = async () => {
    const text = pasted.trim();
    setPasteError('');
    try {
      if (looksLikeHexoNotation(text)) {
        startFrom(parseHexoNotation(text));
        setTimeout(() => board.current?.recenter(), 0);
      } else {
        const opened = await api.importGame(text);
        navigate(`/analysis/${opened.split('/').pop()}`);
      }
      setPasted('');
    } catch (e) {
      setPasteError((e as Error).message);
    }
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
    if (shown) {
      for (const cell of shown.cells) out.push({ cell, player: shown.side, kind: 'ghost' });
    }
    return out;
  }, [game, showThreats, shown]);

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
  } else if (suggesting) {
    title = `Six is thinking about ${names[suggesting]}’s turn`;
    detail = 'The newest Six network, thinking for a few seconds.';
  } else if (shown) {
    const turnNote = shown.side === game.current && !game.winner ? '' : ` It isn’t ${names[shown.side]}’s turn, so playing it gives them the turn.`;
    title = `Six’s pick for ${names[shown.side]}`;
    detail = `The ${shown.cells.length === 1 ? 'marked stone' : 'two marked stones'}, from the newest Six network.${turnNote}`;
  } else if (suggestError) {
    title = 'Six couldn’t suggest a turn';
    detail = suggestError;
  } else if (activeTool !== 'turn') {
    title = activeTool === 'erase' ? 'Erasing stones' : `Placing ${activeTool} stones`;
    detail =
      activeTool === 'erase'
        ? 'Click a stone to take it off. Pick Play to go back to taking turns.'
        : 'Click any cell. Click one of these stones again to take it off.';
  } else if (game.winner) {
    title = `${names[game.winner]} has six in a row`;
    detail = (
      <>
        Turn {game.turn} · {game.stones.length} stones
      </>
    );
  } else {
    title = game.stones.length === 0 ? 'Empty board: X opens' : `${names[game.current]} to place ${game.stonesLeft}`;
    const threatText =
      xThreats + oThreats === 0
        ? 'No open fours on the board.'
        : [xThreats && `X has ${xThreats} ${xThreats === 1 ? 'window' : 'windows'} one turn from six`, oThreats && `O has ${oThreats}`].filter(Boolean).join(' · ') + '.';
    detail = showThreats ? threatText : 'Click a lit cell to add a stone for the side to move.';
  }

  const turnLabel = `Stone ${cursor} of ${line.length}`;
  const freePlace = activeTool === 'turn' ? undefined : { player: activeTool === 'erase' ? null : activeTool };

  return (
    <main className="stage analysis" style={swappedTeamColors(record?.swapColors)}>
      <BoardCanvas
        swapColors={record?.swapColors}
        ref={board}
        game={game}
        version={version}
        interactive={Boolean(freePlace) || !game.winner}
        onPlace={freePlace ? editCell : onPlace}
        freePlace={freePlace}
        marks={marks}
        alarm={Boolean(chance?.proven) && !game.winner}
        label="Analysis board"
        inset={narrow ? { top: 150, right: 16, bottom: 300, left: 16 } : { top: 110, right: 24, bottom: 170, left: editOpen ? 332 : 24 }}
      />
      <ChannelBug
        tag={record ? 'Replay' : 'Analysis'}
        detail={`${record ? `${names.X} vs ${names.O} · ` : ''}${setup ? 'Set-up position · ' : ''}Radius ${radius}`}
      />
      <SettingsButton />
      <ThinkingMeter progress={meter.progress} />
      <Scorebug swapColors={record?.swapColors} names={names} lastMove={lastMoveInfo(game)} onShowLastStone={() => board.current?.showLastStone()} current={game.current} stonesLeft={game.stonesLeft} turn={game.turn} winner={game.winner} finished={game.winner !== null} chance={chance} />
      <BlunderCall blunder={blunder} names={names} />

      {editOpen && (
        <section className="edit-panel plate" aria-label="Edit the board">
          <header className="edit-panel-header">
            <h2 className="edit-panel-title caps">Board</h2>
            <p className="edit-panel-note">Set up any position. Edits start a new line from here.</p>
          </header>
          <Segmented label="Clicks" value={tool} options={TOOL_OPTIONS} onChange={setTool} />
          <div className="edit-panel-row">
            <Segmented
              label="To move"
              value={sideToMove}
              options={[{ value: 'X', label: 'X' }, { value: 'O', label: 'O' }]}
              onChange={(side) => setTurn(side, stonesLeft)}
            />
            <Segmented
              label="Stones left"
              value={stonesLeft}
              options={[{ value: 2, label: '2' }, { value: 1, label: '1' }]}
              onChange={(left) => setTurn(sideToMove, left)}
            />
          </div>
          <div className="edit-panel-analyze" role="group" aria-label="Six's best turn">
            {(['O', 'X'] as Player[]).map((p) => {
              const blue = (p === 'O') !== Boolean(record?.swapColors);
              return (
                <button
                  key={p}
                  type="button"
                  className={`button analyze-button is-${p.toLowerCase()}`}
                  onClick={() => suggest(p)}
                  disabled={Boolean(suggesting) || Boolean(game.winner)}
                  title={`Six's best turn for ${names[p]}${p === game.current && !game.winner ? ' (to move)' : ''}`}
                >
                  {suggesting === p ? 'Thinking...' : `Analyze ${blue ? 'Blue' : 'Yellow'}`}
                </button>
              );
            })}
          </div>
          <form
            className="edit-panel-paste"
            onSubmit={(e) => {
              e.preventDefault();
              loadPasted();
            }}
          >
            <label className="field-label" htmlFor="paste-position">Import a game or position</label>
            <div className="edit-panel-paste-row">
              <input
                id="paste-position"
                className="text-input"
                value={pasted}
                onChange={(e) => {
                  setPasted(e.target.value);
                  setPasteError('');
                }}
                placeholder="HeXO link or position, HTTTX, replay"
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" className="button" disabled={!pasted.trim()}>Load</button>
            </div>
            {pasteError && <p className="error-text" role="alert">{pasteError}</p>}
          </form>
          <button type="button" className="button is-quiet edit-panel-clear" onClick={() => startFrom(null)} disabled={game.stones.length === 0 && !setup}>
            Clear the board
          </button>
        </section>
      )}

      <LowerThird title={title} detail={detail} player={shown?.side ?? suggesting ?? game.winner ?? game.current}>
        {shown && (
          <div className="lt-actions">
            <button type="button" className="button" onClick={playSuggestion}>Play it</button>
            <button type="button" className="button is-quiet" onClick={() => setSuggestion(null)}>Dismiss</button>
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
              <span key={i} className="tick" data-player={start.ownerOfMove(i)} data-past={i < cursor} />
            ))}
          </div>
        </div>
        <p className="timeline-label caps">{turnLabel}</p>
        <ExportMenu
          up
          moves={line}
          setUp={setup !== null}
          position={() => toHexoNotation(game)}
          record={async () => (record && !inVariation
            ? record
            : buildReplay({
              game: Game.fromMoves(line, radius, setup),
              mode: 'analysis',
              players: { X: { name: names.X, kind: 'human' }, O: { name: names.O, kind: 'human' } },
              resignedBy: null,
              id: newReplayId(),
              swapColors: record?.swapColors,
            }))}
        />
        {inVariation && (
          <button
            type="button"
            className="button is-quiet"
            onClick={() => commit({ setup: record?.setup ?? null, line: original!, cursor: Math.min(cursor, original!.length) })}
          >
            Back to the game
          </button>
        )}
      </section>

      <Dock
        actions={[
          ...(record && !record.setup ? [{ icon: GraduationCap, label: 'Review with coach', onClick: () => navigate(`/review/${record.id}`) }] : []),
          { icon: PencilLine, label: editOpen ? 'Hide board editing' : 'Edit the board', onClick: () => setEditOpen((o) => !o), pressed: editOpen },
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: () => setShowThreats((s) => !s), pressed: showThreats },
          { icon: Undo2, label: 'Undo (Ctrl+Z)', onClick: undo, disabled: past.current.length === 0 },
          { icon: Redo2, label: 'Redo (Ctrl+Y)', onClick: redo, disabled: future.current.length === 0 },
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
