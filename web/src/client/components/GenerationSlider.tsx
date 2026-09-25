import { useId, useState, type CSSProperties } from 'react';
import { resolveGeneration } from '../../shared/generations.ts';

/** `value` null means the newest generation, following training as new ones appear. */
export function GenerationSlider({ label, generations, newest, value, onChange, downloadable = [] }: {
  label: string;
  generations: readonly number[];
  newest: number | null;
  value: number | null;
  onChange: (value: number | null) => void;
  downloadable?: readonly number[];
}) {
  const id = useId();
  const [typing, setTyping] = useState<string | null>(null);
  if (generations.length < 2) return null;
  const first = generations[0]!;
  const last = generations[generations.length - 1]!;
  const top = newest ?? last;
  const shown = value ?? top;
  const fill = last > first ? ((shown - first) / (last - first)) * 100 : 100;
  const choose = (picked: number) => onChange(picked === top ? null : picked);
  const commit = () => {
    const picked = typing === null ? null : resolveGeneration(typing, generations);
    if (picked !== null) choose(picked);
    setTyping(null);
  };
  return (
    <div className="sound-check generation-slider">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="sound-check-row">
        <input
          id={id}
          className="sound-check-range"
          type="range"
          min={first}
          max={last}
          step={1}
          value={shown}
          style={{ '--fill': `${fill}%` } as CSSProperties}
          aria-valuetext={value === null ? `newest, generation ${shown}` : `generation ${shown}`}
          onChange={(e) => choose(resolveGeneration(e.target.value, generations) ?? top)}
        />
        {typing === null ? (
          <button
            type="button"
            className="generation-value"
            title="Click to type a generation"
            aria-label={`Generation ${shown}${value === null ? ' (newest)' : ''}. Click to type one.`}
            onClick={() => setTyping(String(shown))}
          >
            {value === null ? `Newest (${shown})` : `Gen ${shown}`}
          </button>
        ) : (
          <input
            className="generation-input"
            type="number"
            inputMode="numeric"
            min={first}
            max={last}
            step={1}
            value={typing}
            aria-label={`Generation, ${first} to ${last}`}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              // Digits only, capped at the newest generation.
              const digits = e.target.value.replace(/[^\d]/g, '');
              setTyping(digits !== '' && Number(digits) > last ? String(last) : digits);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();  // don't submit the whole form
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setTyping(null);
              }
            }}
          />
        )}
        {value !== null && typing === null && (
          <button type="button" className="button is-quiet" onClick={() => onChange(null)}>Newest</button>
        )}
      </div>
      {value !== null && downloadable.includes(value) && (
        <p className="notice">Downloads the first time you play it (up to about 25 MB).</p>
      )}
    </div>
  );
}
