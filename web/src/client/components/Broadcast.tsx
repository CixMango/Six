import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Focus, Volume2, VolumeX, type LucideIcon } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import type { Player } from '../../shared/rules.ts';
import type { Postmortem } from '../../shared/postmortem.ts';
import type { ResultReason } from '../../shared/replay.ts';
import { BLUNDER_CALL_MS, type Evaluation } from '../../shared/winChance.ts';
import { blunderVolume, loadBlunderVolume, playBlunder, setBlunderVolume, soloSound } from '../lib/sound.ts';

/** A 6 whose loop is a hexagon, with X's opening stone inside. */
export function SixMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="six-mark" width={(size * 116) / 156} height={size} viewBox="70 50 116 156" aria-hidden="true">
      <path
        d="M173 63 L83 115 L83 167 L128 193 L173 167 L173 115 L128 89"
        fill="none"
        stroke="var(--o)"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M128 118 L147.9 129.5 L147.9 152.5 L128 164 L108.1 152.5 L108.1 129.5 Z" fill="var(--x)" />
    </svg>
  );
}

export function ChannelBug({ tag, live = false, detail }: { tag: string; live?: boolean; detail?: ReactNode }) {
  return (
    <div className="bug">
      <Link href="/" className="bug-mark" aria-label="Six, back to the arena">
        <SixMark />
        <span className="bug-word">SIX</span>
      </Link>
      <span className={`bug-tag caps${live ? ' is-live' : ''}`}>
        {live && <span className="bug-dot" aria-hidden="true" />}
        {tag}
      </span>
      {detail && <span className="bug-detail" title={typeof detail === 'string' ? detail : undefined}>{detail}</span>}
    </div>
  );
}

export interface ScorebugProps {
  names: Record<Player, string>;
  lastMove: { cell: Hex; player: Player } | null;
  onShowLastStone?: () => void;
  current: Player;
  stonesLeft: number;
  turn: number;
  winner: Player | null;
  finished: boolean;
  you?: Player | null;
  chance?: Evaluation | null;
  /** Latest turn rated 1 to 100, per stone and for the whole turn. */
  ratings?: Record<Player, { stones: Array<number | null>; turn: number | null } | null> | null;
  /** Colours swapped (a HeXO game where blue moved first); each letter follows its colour. */
  swapColors?: boolean;
}

function Pips({ player, left, total }: { player: Player; left: number; total: number }) {
  return (
    <span className="pips" data-player={player} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} className={`pip${i < left ? ' is-on' : ''}`} viewBox="0 0 10 11">
          <path d="M5 .6 9.4 3.1v4.8L5 10.4.6 7.9V3.1Z" />
        </svg>
      ))}
    </span>
  );
}

export function Scorebug({ names, lastMove, onShowLastStone, current, stonesLeft, turn, winner, finished, you, chance, ratings, swapColors = false }: ScorebugProps) {
  const total = turn === 1 ? 1 : 2;
  const side = (p: Player) => (
    <div className={`sb-side is-${p.toLowerCase()}`} data-active={!finished && current === p} data-won={winner === p}>
      <span className="sb-key" aria-hidden="true" />
      <span className="sb-letter caps" aria-hidden="true">{swapColors ? (p === 'X' ? 'O' : 'X') : p}</span>
      <span className="sb-name caps">
        {names[p]}
        {you === p && <span className="sb-you"> (you)</span>}
      </span>
    </div>
  );
  const status = finished
    ? winner
      ? `${names[winner]} wins`
      : 'Game over'
    : `${names[current]} to place ${stonesLeft} ${stonesLeft === 1 ? 'stone' : 'stones'}`;
  return (
    <div className="scorebug-wrap">
      <div className="scorebug plate" role="group" aria-label="Scoreboard">
        {side('X')}
        <div className="sb-turn">
          <span className="sb-turn-label caps">Turn</span>
          <span className="sb-turn-number">{turn}</span>
        </div>
        {side('O')}
      </div>
      {chance && !finished && <WinMeter chance={chance} names={names} />}
      {ratings && (ratings.X || ratings.O) && (
        <div className="sb-ratings">
          <TurnRatingChip player="X" rating={ratings.X} />
          <TurnRatingChip player="O" rating={ratings.O} />
        </div>
      )}
      <div className="sb-status plate caps" data-player={finished ? (winner ?? 'none') : current} aria-live="polite">
        {!finished && <Pips player={current} left={stonesLeft} total={total} />}
        <span>{status}</span>
        {lastMove && onShowLastStone && (
          <button
            type="button"
            className="sb-last"
            data-player={lastMove.player}
            onClick={onShowLastStone}
            aria-label={`Show ${names[lastMove.player]}’s last stone on the board`}
            title="Show the last stone"
          >
            <span className="sb-last-chip" aria-hidden="true" />
            <span>Last stone</span>
            <Focus size={13} strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function ratingTone(value: number): 'good' | 'fair' | 'poor' {
  return value >= 80 ? 'good' : value >= 50 ? 'fair' : 'poor';
}

function TurnRatingChip({ player, rating }: { player: Player; rating: { stones: Array<number | null>; turn: number | null } | null }) {
  if (!rating) return <span className={`sb-rating is-${player.toLowerCase()}`} />;
  const value = (v: number | null) =>
    v === null ? <span className="sb-rating-value is-pending">…</span> : <span className="sb-rating-value" data-tone={ratingTone(v)}>{v}</span>;
  return (
    <span className={`sb-rating is-${player.toLowerCase()} caps`} aria-label={`${player}'s last turn rated ${rating.turn ?? 'pending'} out of 100`}>
      {rating.stones.map((v, i) => (
        <span key={i} className="sb-rating-part">
          <span className="sb-rating-label">{i === 0 ? '1st' : '2nd'}</span>
          {value(v)}
        </span>
      ))}
      {rating.stones.length > 1 && (
        <span className="sb-rating-part is-turn">
          <span className="sb-rating-label">Turn</span>
          {value(rating.turn)}
        </span>
      )}
    </span>
  );
}

/** A proven forced win is shown as such rather than as a percentage. */
function WinMeter({ chance, names }: { chance: Evaluation; names: Record<Player, string> }) {
  const x = Math.round(chance.winX * 100);
  const label = (p: Player) => {
    if (chance.proven === p) return 'Forced win';
    const pct = p === 'X' ? x : 100 - x;
    return `${pct}%`;
  };
  const described = chance.proven
    ? `${names[chance.proven]} has a forced win`
    : `${names.X} ${x} percent, ${names.O} ${100 - x} percent to win`;
  return (
    <div className="sb-chance" data-proven={chance.proven ?? 'none'} role="img" aria-label={described}>
      <span className="sb-chance-label is-x caps">{label('X')}</span>
      <span className="sb-chance-bar" aria-hidden="true">
        <span className="sb-chance-fill" style={{ inlineSize: `${x}%` }} />
      </span>
      <span className="sb-chance-label is-o caps">{label('O')}</span>
    </div>
  );
}

function VolumeRow({ label, value, onChange }: { label: string; value: number; onChange?: (value: number) => void }) {
  const id = useId();
  const pct = Math.round(value * 100);
  return (
    <div className="sound-check">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="sound-check-row">
        {pct === 0 ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
        <input
          id={id}
          className="sound-check-range"
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          disabled={!onChange}
          style={{ '--fill': `${pct}%` } as CSSProperties}
          aria-valuetext={pct === 0 ? 'Off' : `${pct} percent`}
          onChange={(e) => onChange?.(Number(e.target.value) / 100)}
        />
        <span className="sound-check-value">{pct === 0 ? 'Off' : `${pct}%`}</span>
        <button type="button" className="button" onClick={() => playBlunder(value)} disabled={pct === 0}>Test</button>
      </div>
    </div>
  );
}

/** Host only: blunder-call volumes for the host and the friend. */
export function SoundCheck() {
  const [settings, setSettings] = useState({ volume: blunderVolume(), host: blunderVolume(), friend: blunderVolume(), canChange: false });
  useEffect(() => {
    void loadBlunderVolume().then(setSettings);
  }, []);
  if (!settings.canChange) return null;
  if (soloSound) return <VolumeRow label="Blunder sound" value={settings.host} onChange={(v) => {
    setSettings((s) => ({ ...s, host: v, volume: v }));
    void setBlunderVolume({ host: v });
  }} />;
  const change = (who: 'host' | 'friend') => (value: number) => {
    setSettings((s) => ({ ...s, [who]: value, ...(who === 'host' ? { volume: value } : {}) }));
    void setBlunderVolume({ [who]: value });
  };
  return (
    <div className="sound-check-pair">
      <VolumeRow label="Blunder sound: you hear it at" value={settings.host} onChange={change('host')} />
      <VolumeRow label="Your friend hears it at" value={settings.friend} onChange={change('friend')} />
    </div>
  );
}

/** Plays once per blunder (keyed by `at`), then clears itself. */
export function BlunderCall({ blunder, names }: { blunder: { player: Player; at: number } | null; names: Record<Player, string> }) {
  const [shown, setShown] = useState<{ player: Player; at: number } | null>(null);
  const last = useRef<number | null>(null);
  // Load the host's volume up front so the first call plays at the right level.
  useEffect(() => void loadBlunderVolume(), []);
  useEffect(() => {
    if (!blunder || last.current === blunder.at) return;
    last.current = blunder.at;
    setShown(blunder);
    playBlunder();
    const t = setTimeout(() => setShown(null), BLUNDER_CALL_MS);
    return () => clearTimeout(t);
  }, [blunder]);
  if (!shown) return null;
  const winner = shown.player === 'X' ? 'O' : 'X';
  return (
    <div className="blunder" key={shown.at} role="alert" data-player={shown.player}>
      <div className="blunder-flash" aria-hidden="true" />
      <div className="blunder-band">
        <p className="blunder-word">Blunder</p>
        <p className="blunder-line caps">
          <span className="blunder-chip" data-player={winner} aria-hidden="true" />
          Forced win allowed: {names[winner]} can now force a win
        </p>
      </div>
    </div>
  );
}

/** Re-keys on `title` so each event wipes in; `wipe` off is for events faster than the animation (avoids flicker). */
export function LowerThird({ title, detail, player, wipe = true, children }: { title: string; detail?: ReactNode; player?: Player | null; wipe?: boolean; children?: ReactNode }) {
  return (
    <div className="lower-third plate" key={wipe ? title : 'steady'} data-player={player ?? 'none'}>
      <span className="lt-key" aria-hidden="true" />
      <div className="lt-body">
        <p className="lt-title caps">{title}</p>
        {detail && <p className="lt-detail">{detail}</p>}
        {children}
      </div>
    </div>
  );
}

export interface DockAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'accent';
  pressed?: boolean;
}

export function Dock({ actions }: { actions: DockAction[] }) {
  return (
    <div className="dock plate" role="toolbar" aria-label="Board controls">
      {actions.map(({ icon: Icon, label, onClick, disabled, tone = 'default', pressed }) => (
        <button
          key={label}
          type="button"
          className={`dock-button tone-${tone}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={pressed}
          title={label}
        >
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

const REASON_TEXT: Record<ResultReason, string> = {
  six: 'Six in a row',
  resign: 'Win by resignation',
  abandoned: 'Opponent left the game',
  unfinished: 'Game stopped',
};

export interface ResultAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}

export function ResultBand({ winner, reason, names, turn, stones, actions, note }: {
  winner: Player | null;
  reason: ResultReason;
  names: Record<Player, string>;
  turn: number;
  stones: number;
  actions: ResultAction[];
  note?: string;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="result-band plate" data-player={winner ?? 'none'} aria-live="assertive" aria-label="Result">
      <span className="rb-key" aria-hidden="true" />
      <div className="rb-headline">
        <p className="rb-winner caps">{winner ? `${names[winner]} wins` : 'No result'}</p>
        <p className="rb-meta">
          {REASON_TEXT[reason]} · Turn {turn} · {stones} stones
        </p>
        {note && <p className="rb-note">{note}</p>}
      </div>
      <div className="rb-actions">
        {actions.map((a, i) => (
          <button
            key={a.label}
            ref={i === 0 ? first : undefined}
            type="button"
            className={`button${a.primary ? ' is-primary' : ''}`}
            onClick={a.onClick}
            disabled={a.disabled}
          >
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function MatchReport({ report, names, meta, children }: {
  report: Postmortem;
  names: Record<Player, string>;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="report plate" data-player={report.winner} aria-live="polite" aria-label="Match report">
      <span className="report-key" aria-hidden="true" />
      <div className="report-body">
        <h2 className="report-headline">{names[report.winner]} wins</h2>
        <p className="report-meta">
          Finished on turn {report.turn} · {report.stones} stones{meta ? <> · {meta}</> : null}
        </p>
        {children}
      </div>
    </section>
  );
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend className="field-label">{label}</legend>
      <div className="seg-track">
        {options.map((o) => (
          <label key={String(o.value)} className="seg-option" data-checked={o.value === value}>
            <input
              type="radio"
              name={label}
              value={String(o.value)}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
