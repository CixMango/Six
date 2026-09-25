import { useState } from 'react';
import { Download } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { toHtttx } from '../../shared/notation.ts';
import type { ReplayRecord } from '../../shared/replay.ts';

// Clipboard API needs a secure context; a friend on a Hamachi http:// address falls back to execCommand.
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// `record` builds the replay file on demand (the app fetches the saved one).
export function ExportMenu({ moves, record, up = false }: { moves: readonly Hex[]; record: () => Promise<ReplayRecord>; up?: boolean }) {
  const [note, setNote] = useState('');
  const flash = (text: string) => {
    setNote(text);
    setTimeout(() => setNote(''), 2000);
  };
  return (
    <details className="export-menu" data-up={up}>
      <summary className="button is-quiet"><Download size={16} aria-hidden="true" /> {note || 'Export'}</summary>
      <div className="export-menu-list plate" role="menu">
        <button
          type="button"
          role="menuitem"
          className="button is-quiet"
          disabled={moves.length === 0}
          onClick={async (e) => {
            flash((await copyText(toHtttx(moves))) ? 'Copied' : 'Copy failed');
            e.currentTarget.closest('details')?.removeAttribute('open');
          }}
        >
          Copy HTTTX notation
        </button>
        <button
          type="button"
          role="menuitem"
          className="button is-quiet"
          disabled={moves.length === 0}
          onClick={async (e) => {
            const details = e.currentTarget.closest('details');
            try {
              const r = await record();
              download(`${r.id}.json`, JSON.stringify(r, null, 2));
              flash('Saved');
            } catch {
              flash('Save failed');
            }
            details?.removeAttribute('open');
          }}
        >
          Download replay file
        </button>
      </div>
    </details>
  );
}
