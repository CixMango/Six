import { useRef, useState, type FormEvent } from 'react';
import { IMPORT_HINT } from '../../shared/gameImport.ts';

// `onImport` gets a HeXO link, HTTTX text or a replay file's contents; it opens the game or rejects with a message.
export function GameImport({ onImport, label = 'Import a game' }: { onImport: (text: string) => Promise<void>; label?: string }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const run = async (value: string) => {
    if (!value.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onImport(value.trim());
    } catch (err) {
      setError((err as Error).message || 'That game could not be imported.');
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(text);
  };

  return (
    <form className="join-form game-import" onSubmit={submit}>
      <label className="field-label" htmlFor="game-import">{label}</label>
      <div className="join-row">
        <textarea
          id="game-import"
          className="text-input game-import-text"
          rows={3}
          value={text}
          autoComplete="off"
          spellCheck={false}
          placeholder={'HeXO link or HTTTX, e.g.\nversion[1];\n1. [1,0][2,0];'}
          aria-describedby="game-import-hint"
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
        />
        <button type="submit" className="button is-primary" disabled={busy || !text.trim()}>
          {busy ? 'Importing…' : 'Import'}
        </button>
      </div>
      <div className="game-import-file">
        <button type="button" className="button is-quiet" disabled={busy} onClick={() => file.current?.click()}>Open a replay file</button>
        <input
          ref={file}
          type="file"
          accept=".json,.txt,.htttx,application/json,text/plain"
          hidden
          onChange={async (e) => {
            const chosen = e.target.files?.[0];
            e.target.value = '';
            if (chosen) await run(await chosen.text());
          }}
        />
      </div>
      <p id="game-import-hint" className={error ? 'error-text' : 'notice'} role={error ? 'alert' : undefined}>{error || IMPORT_HINT}</p>
    </form>
  );
}
