import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.ts';

const ASKED = 'six.updateAsked';
const WAIT_MS = 4 * 60_000;

/** When Six first opens and a newer version is out, asks whether to update; the app then restarts itself. */
export function UpdatePrompt() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [update, setUpdate] = useState<{ current: string; latest: string } | null>(null);
  const [stage, setStage] = useState<'ask' | 'updating' | 'slow' | 'failed'>('ask');
  const [error, setError] = useState('');

  useEffect(() => {
    // Once per visit: not again on every page of the app.
    try {
      if (sessionStorage.getItem(ASKED)) return;
      sessionStorage.setItem(ASKED, '1');
    } catch {
      // Storage blocked: ask anyway.
    }
    api
      .update()
      .then((u) => {
        if (u.latest) setUpdate({ current: u.current, latest: u.latest });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (d && update && !d.open) d.showModal();
  }, [update]);

  const start = async () => {
    if (!update) return;
    setStage('updating');
    setError('');
    try {
      await api.startUpdate();
    } catch (e) {
      setStage('failed');
      setError((e as Error).message);
      return;
    }
    // Six stops, installs the update and starts again; reload once the new version answers.
    const until = Date.now() + WAIT_MS;
    const poll = async () => {
      try {
        const info = await api.info();
        if (info.version === update.latest) {
          window.location.reload();
          return;
        }
      } catch {
        // Still restarting.
      }
      if (Date.now() > until) setStage('slow');
      setTimeout(poll, 2000);
    };
    setTimeout(poll, 3000);
  };

  if (!update) return null;
  const busy = stage === 'updating' || stage === 'slow';
  return (
    <dialog
      ref={dialog}
      className="settings update-prompt plate"
      aria-labelledby="update-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
    >
      <div className="settings-body">
        <h2 id="update-title" className="settings-title">{busy ? `Updating to Six ${update.latest}` : `Six ${update.latest} is out`}</h2>
        {stage === 'ask' && (
          <p className="settings-note">
            You have version {update.current}. Updating takes about a minute; your saved games and settings are kept. Six restarts
            by itself and this page reloads when it's done.{' '}
            <a href="https://github.com/CixMango/Six/blob/main/CHANGELOG.md" target="_blank" rel="noopener">What's new</a>
          </p>
        )}
        {stage === 'updating' && <p className="settings-note" role="status">Downloading and installing. This page reloads by itself when Six is back.</p>}
        {stage === 'slow' && (
          <p className="settings-note" role="status">
            This is taking longer than usual. If nothing happens, open Six again: it will either be updated or still on {update.current}.
          </p>
        )}
        {stage === 'failed' && <p className="error-text" role="alert">The update couldn't start: {error}</p>}
        {!busy && (
          <div className="update-actions">
            <button type="button" className="button is-primary" onClick={start}>Update now</button>
            <button type="button" className="button is-quiet" onClick={() => dialog.current?.close()}>Not now</button>
          </div>
        )}
        {busy && <span className="coach-progress-bar is-indeterminate" aria-hidden="true"><span /></span>}
      </div>
    </dialog>
  );
}
