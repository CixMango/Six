import { useState, type FormEvent } from 'react';
import { parseHexoLink } from '../../shared/hexoImport.ts';

export function HexoImport({ onImport, label = 'Review a game from HeXO' }: { onImport: (link: string) => Promise<void>; label?: string }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!parseHexoLink(link)) {
      setError('Paste a HeXO sandbox or game link, like https://hexo.did.science/sandbox/ldqa40j');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onImport(link.trim());
    } catch (err) {
      setError((err as Error).message || 'That link could not be imported.');
      setBusy(false);
    }
  };

  return (
    <form className="join-form hexo-import" onSubmit={submit}>
      <label className="field-label" htmlFor="hexo-link">{label}</label>
      <div className="join-row">
        <input
          id="hexo-link"
          className="text-input"
          value={link}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://hexo.did.science/sandbox/…"
          aria-describedby={error ? 'hexo-error' : undefined}
          onChange={(e) => {
            setLink(e.target.value);
            setError('');
          }}
        />
        <button type="submit" className="button is-primary" disabled={busy || !link.trim()}>
          {busy ? 'Importing…' : 'Import'}
        </button>
      </div>
      {error && <p id="hexo-error" className="error-text" role="alert">{error}</p>}
    </form>
  );
}
