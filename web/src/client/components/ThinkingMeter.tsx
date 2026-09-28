import { useRef, useState } from 'react';
import { shortCount, type ThinkProgress } from '../../shared/thinking.ts';

/** Follows one search at a time: `start` returns the progress callback for a new search, `stop` hides the meter. */
export function useThinking() {
  const [progress, setProgress] = useState<ThinkProgress | null>(null);
  const search = useRef(0);
  // The meter keeps showing the last search's numbers until the new one reports, so back-to-back searches don't flicker.
  const start = (): ((p: ThinkProgress) => void) => {
    const id = ++search.current;
    return (p) => {
      if (search.current === id) setProgress(p);
    };
  };
  const stop = () => {
    search.current++;
    setProgress(null);
  };
  return { progress, start, stop };
}

function seconds(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/** Top left while Six thinks: its speed on this computer, and with a position budget how far along it is. */
export function ThinkingMeter({ progress, who = 'Six' }: { progress: ThinkProgress | null; who?: string }) {
  if (!progress || progress.ms < 200 || progress.nodes === 0) return null;
  const rate = (progress.nodes / progress.ms) * 1000;
  const budget = progress.budget;
  const share = budget ? Math.min(1, progress.nodes / budget) : null;
  const left = budget && rate > 0 ? ((budget - progress.nodes) / rate) * 1000 : null;
  return (
    <div className="think-meter plate" role="status" aria-label={`${who} is looking at ${Math.round(rate)} positions a second`}>
      <span className="think-pulse" aria-hidden="true" />
      <span className="think-who caps">{who} thinking</span>
      <span className="think-rate">
        <strong>{shortCount(rate)}</strong> positions/s
      </span>
      {share !== null && (
        <span className="think-left">
          {Math.round(share * 100)}%{left !== null && left > 500 ? ` · ${seconds(left)} left` : ''}
        </span>
      )}
      {share !== null && <span className="think-bar" aria-hidden="true" style={{ transform: `scaleX(${share})` }} />}
    </div>
  );
}
