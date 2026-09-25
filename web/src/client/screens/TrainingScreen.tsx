import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { ChannelBug } from '../components/Broadcast.tsx';
import { api, type Bout, type GenerationRecord, type RivalResult, type TrainingView } from '../lib/api.ts';
import { boutVerdict, describeAge, describeOurSide, describeShape, extraBouts, intervalSentence, loopState, rivalOutcome, rowLeader, signedElo, tapeRows, type LoopState } from '../lib/trainingView.ts';

const POLL_MS = 15_000;
/** The interval bar spans -SCALE to +SCALE Elo. */
const SCALE = 400;

const finishedAt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATE_TAG: Record<LoopState, string> = {
  'not-started': 'Training',
  running: 'Live',
  paused: 'Paused',
  stalled: 'Stopped',
};

function statusSentence(state: LoopState, view: TrainingView, now: number): string {
  switch (state) {
    case 'not-started':
      return 'The learning loop hasn’t run on this PC yet.';
    case 'paused':
      return `Paused. Generation ${view.generation} picks up where it left off when you resume.`;
    case 'running':
      return `Generation ${view.generation} is playing itself and learning from those games.`;
    case 'stalled':
      return view.lastActivity === null
        ? 'The loop isn’t running.'
        : `The loop isn’t running. Its last activity was ${describeAge(now - view.lastActivity)}.`;
  }
}

/** Elo difference with its 95% interval; an open end runs to the edge of the scale. */
function IntervalBar({ bout, label }: { bout: Bout; label: string }) {
  const at = (elo: number) => `${((Math.max(-SCALE, Math.min(SCALE, elo)) + SCALE) / (2 * SCALE)) * 100}%`;
  return (
    <span
      className="interval"
      data-verdict={boutVerdict(bout)}
      data-open={bout.eloLow === null ? 'low' : bout.eloHigh === null ? 'high' : undefined}
      role="img"
      aria-label={`${label}: ${signedElo(bout.elo)} Elo, ${intervalSentence(bout).toLowerCase()}`}
    >
      <span className="interval-zero" aria-hidden="true" />
      <span className="interval-band" style={{ left: at(bout.eloLow ?? -SCALE), right: `calc(100% - ${at(bout.eloHigh ?? SCALE)})` }} aria-hidden="true" />
      <span className="interval-point" style={{ left: at(bout.elo) }} aria-hidden="true" />
    </span>
  );
}

function BoutLine({ against, bout, minor = false }: { against: string; bout: Bout; minor?: boolean }) {
  const verdict = boutVerdict(bout);
  return (
    <div className={`bout${minor ? ' is-minor' : ''}`} data-verdict={verdict}>
      <p className="bout-score">
        <span className="bout-elo">{signedElo(bout.elo)}</span>
        <span className="bout-unit caps">Elo {against}</span>
        <span className="bout-record">
          {bout.wins}–{bout.losses}
        </span>
      </p>
      <IntervalBar bout={bout} label={`Elo ${against}`} />
      <p className="bout-note">
        {intervalSentence(bout)}{' '}
        {verdict === 'stronger' ? 'Measurably stronger.' : verdict === 'weaker' ? 'Measurably weaker.' : 'Not separable yet.'}
      </p>
    </div>
  );
}

function Corner({ record, role, lead }: { record: GenerationRecord | undefined; role: string; lead: boolean }) {
  return (
    <div className="tape-corner plate" data-lead={lead} key={record?.generation ?? role}>
      <span className="tape-keyline" aria-hidden="true" />
      <p className="tape-gen">{record ? <>Gen {record.generation}</> : <>—</>}</p>
      <p className="tape-when">
        {record ? (
          <>
            <span className="when-role">{role}</span>
            <span className="when-sep"> · finished </span>
            <span className="nowrap">{finishedAt.format(new Date(record.finished))}</span>
          </>
        ) : (
          'No earlier generation'
        )}
      </p>
    </div>
  );
}

function Tape({ newest, previous }: { newest: GenerationRecord; previous: GenerationRecord | undefined }) {
  const rows = tapeRows(newest, previous);
  const vsPrevious = newest.evaluation?.vsPrevious;
  const verdict = vsPrevious ? boutVerdict(vsPrevious) : 'even';
  return (
    <section className="tape" aria-label={`Generation ${newest.generation} against generation ${previous?.generation ?? 'none'}`}>
      <table className="tape-table">
        <colgroup>
          <col className="tape-col-side" />
          <col className="tape-col-spine" />
          <col className="tape-col-side" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="tape-head">
              <Corner record={newest} role="Newest" lead={verdict === 'stronger'} />
            </th>
            <td className="tape-vs caps" aria-hidden="true">vs</td>
            <th scope="col" className="tape-head is-previous">
              <Corner record={previous} role="Replaced" lead={verdict === 'weaker'} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const leader = rowLeader(row);
            return (
              <tr key={row.label}>
                <td className="tape-value is-newest" data-lead={leader === 'newest'}>
                  {row.newest === null ? '—' : row.format(row.newest)}
                </td>
                <th scope="row" className="tape-label caps">
                  {row.label}
                </th>
                <td className="tape-value is-previous" data-lead={leader === 'previous'}>
                  {row.previous === null ? '—' : row.format(row.previous)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="tape-bouts">
        {vsPrevious ? (
          <BoutLine against={`vs Gen ${previous?.generation ?? newest.generation - 1}`} bout={vsPrevious} />
        ) : (
          <p className="notice">No match against the previous generation was recorded.</p>
        )}
        {extraBouts(newest).map(({ against, bout }) => (
          <BoutLine key={against} against={`vs ${against}`} bout={bout} minor />
        ))}
      </div>
    </section>
  );
}

function Rivals({ rivals, now }: { rivals: RivalResult[]; now: number }) {
  return (
    <section className="rivals" aria-labelledby="rivals-heading">
      <h2 id="rivals-heading" className="section-heading caps">Against other bots</h2>
      <div className="table-scroll">
        <table className="replay-table rivals-table">
          <thead>
            <tr>
              <th scope="col">Rival</th>
              <th scope="col" className="col-when">Our side</th>
              <th scope="col">Result</th>
              <th scope="col" className="col-when">Played</th>
            </tr>
          </thead>
          <tbody>
            {[...rivals].reverse().map((r) => {
              const outcome = rivalOutcome(r);
              return (
                <tr key={`${r.when}-${r.rival}`}>
                  <th scope="row" className="rival-name">{r.rival}</th>
                  <td className="col-when">{describeOurSide(r)}</td>
                  <td className="rival-result">
                    <span className="rival-headline">
                      <span className="rival-record" data-swept={outcome.swept ?? undefined}>{outcome.record}</span>
                      <span className="rival-elo" data-verdict={boutVerdict(outcome.bout)}>{signedElo(outcome.bout.elo)}</span>
                      <IntervalBar bout={outcome.bout} label={`Elo against ${r.rival}`} />
                    </span>
                    <span className="rival-sentence">{outcome.sentence}</span>
                    {r.note && <span className="rival-note">{r.note}</span>}
                  </td>
                  <td className="col-when">{finishedAt.format(new Date(r.when))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Ladder({ history }: { history: GenerationRecord[] }) {
  const rows = [...history].reverse();
  return (
    <section className="ladder" aria-labelledby="ladder-heading">
      <h2 id="ladder-heading" className="section-heading caps">Every generation</h2>
      <div className="table-scroll">
        <table className="replay-table ladder-table">
          <thead>
            <tr>
              <th scope="col">Gen</th>
              <th scope="col" className="col-when">Finished</th>
              <th scope="col">vs previous</th>
              <th scope="col" className="col-bar">95% interval</th>
              <th scope="col">Also played</th>
              <th scope="col" className="num col-games">Games</th>
              <th scope="col" className="num">Unfinished</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const prev = r.evaluation?.vsPrevious;
              const extra = extraBouts(r);
              const games = r.selfplay?.games ?? 0;
              return (
                <tr key={r.generation}>
                  <td className="is-winner">
                    {r.generation}
                    {r.grown && <span className="ladder-grown">grew to {describeShape(r.grown.network)}</span>}
                  </td>
                  <td className="col-when">{finishedAt.format(new Date(r.finished))}</td>
                  <td data-verdict={prev ? boutVerdict(prev) : undefined}>
                    {prev ? `${signedElo(prev.elo)} · ${prev.wins}–${prev.losses}` : '—'}
                  </td>
                  <td className="col-bar">{prev ? <IntervalBar bout={prev} label={`Generation ${r.generation} vs previous`} /> : null}</td>
                  <td>
                    {extra.length === 0 ? '—' : extra.map(({ against, bout }) => (
                      <span className="ladder-extra" key={against} data-verdict={boutVerdict(bout)}>
                        {signedElo(bout.elo)} · {bout.wins}–{bout.losses}
                        <span className="ladder-range">vs {against}</span>
                      </span>
                    ))}
                  </td>
                  <td className="num col-games">{games ? games.toLocaleString() : '—'}</td>
                  <td className="num">{games ? `${(((r.selfplay?.unfinished ?? 0) / games) * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PauseApps({ apps, onSave }: { apps: string[]; onSave: (apps: string[]) => Promise<void> }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim().toLowerCase();
    if (!/^[a-z0-9 ._()-]+\.exe$/.test(name)) {
      setError('Enter a program file name ending in .exe, like obs64.exe.');
      return;
    }
    setError('');
    await onSave([...apps, name]).then(() => setDraft('')).catch((err: Error) => setError(err.message));
  };
  return (
    <section className="side-plate plate" aria-labelledby="apps-heading">
      <h2 id="apps-heading" className="section-heading caps">Pause while these run</h2>
      <p className="notice">Training always steps aside for a fullscreen game. Add any other program that should pause it.</p>
      {apps.length > 0 ? (
        <ul className="app-list">
          {apps.map((app) => (
            <li key={app} className="app-chip">
              <span>{app}</span>
              <button
                type="button"
                className="app-remove"
                aria-label={`Stop pausing for ${app}`}
                onClick={() => onSave(apps.filter((a) => a !== app)).catch((err: Error) => setError(err.message))}
              >
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="notice app-empty">No programs added.</p>
      )}
      <form className="app-form" onSubmit={add}>
        <label className="visually-hidden" htmlFor="pause-app">Program to add</label>
        <input
          id="pause-app"
          className="text-input"
          value={draft}
          placeholder="streaming-app.exe"
          spellCheck={false}
          autoComplete="off"
          aria-describedby={error ? 'pause-app-error' : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setError('');
          }}
        />
        <button type="submit" className="button">Add</button>
      </form>
      {error && <p id="pause-app-error" className="error-text">{error}</p>}
    </section>
  );
}

export function TrainingScreen() {
  const [view, setView] = useState<TrainingView | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    api
      .training()
      .then((v) => {
        setView(v);
        setLoadError('');
        setNow(Date.now());
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const state = view ? loopState(view, now) : null;
  const newest = view?.history.at(-1);
  const previous = view && view.history.length > 1 ? view.history.at(-2) : undefined;

  const togglePause = async () => {
    if (!view) return;
    setBusy(true);
    setActionError('');
    try {
      setView(await api.setTrainingPaused(!view.paused));
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveApps = async (apps: string[]) => {
    setActionError('');
    setView(await api.setPauseApps(apps));
  };

  return (
    <main className="library training">
      <ChannelBug
        tag={state ? STATE_TAG[state] : 'Training'}
        live={state === 'running'}
        detail={view?.started ? `Gen ${view.generation}` : undefined}
      />
      {view?.started && (
        <div className="training-control">
          <button type="button" className="button is-primary" onClick={togglePause} disabled={busy} aria-describedby={actionError ? 'training-action-error' : undefined}>
            {view.paused ? <Play size={16} strokeWidth={2.25} aria-hidden="true" /> : <Pause size={16} strokeWidth={2.25} aria-hidden="true" />}
            {view.paused ? 'Resume training' : 'Pause training'}
          </button>
        </div>
      )}

      <div className="library-inner">
        <header className="library-header">
          <h1 className="library-title caps">Training</h1>
          {view && state && (
            <p className="notice training-status" aria-live="polite">
              {statusSentence(state, view, now)}
            </p>
          )}
          {actionError && (
            <p id="training-action-error" className="error-text">
              {actionError}
            </p>
          )}
        </header>

        {loadError && <p className="error-text">Training status could not load: {loadError}</p>}

        {view === null && !loadError && (
          <div className="table-skeleton" aria-busy="true" aria-label="Loading training status">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        )}

        {view && !view.started && (
          <section className="empty-state">
            <h2 className="empty-title">Training hasn’t started</h2>
            <p className="notice training-empty">
              Once the learning loop runs, each generation of Six’s network plays itself, trains on those games, then plays a
              measured match against the generation before it. Those results, with their confidence intervals, appear here.
            </p>
          </section>
        )}

        {view?.started && newest && <Tape newest={newest} previous={previous} />}

        {view?.started && !newest && (
          <section className="empty-state">
            <h2 className="empty-title">Generation {view.generation} is playing its first games</h2>
            <p className="notice training-empty">The first measured match appears here when this generation finishes training.</p>
          </section>
        )}

        {view && view.rivals.length > 0 && <Rivals rivals={view.rivals} now={now} />}

        {view?.started && (
          <div className="training-lower">
            {view.history.length > 0 ? <Ladder history={view.history} /> : <div />}
            <div className="training-side">
              <PauseApps apps={view.pauseApps} onSave={saveApps} />
              <section className="side-plate plate" aria-labelledby="log-heading">
                <h2 id="log-heading" className="section-heading caps">Loop log</h2>
                {view.log.length > 0 ? (
                  <ol className="log-lines">
                    {view.log.slice(-14).map((line, i) => (
                      <li key={`${i}-${line}`}>{line}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="notice">Nothing logged yet.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
