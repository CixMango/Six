import { useEffect, useId, useRef, useState } from 'react';
import { Settings as Gear, X } from 'lucide-react';
import { Segmented, SoundCheck } from './Broadcast.tsx';
import { useBlunderMode } from '../lib/blunderMode.ts';
import { useBloom, useTheme } from '../lib/theme.ts';
import { ThemePicker } from './ThemePicker.tsx';

export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [blunderMode, setBlunderMode] = useBlunderMode();
  const [theme, setTheme] = useTheme();
  const [bloom, setBloom] = useBloom();
  const titleId = useId();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className="settings-gear plate" aria-label="Settings" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Gear size={17} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="settings plate"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="settings-body">
          <header className="settings-header">
            <h2 id={titleId} className="settings-title">Settings</h2>
            <button type="button" className="settings-close" aria-label="Close settings" onClick={() => setOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <section className="settings-section">
            <ThemePicker value={theme} onChange={setTheme} />
            <div className="settings-subfield">
              <Segmented
                label="Bloom"
                value={bloom ? 'on' : 'off'}
                options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
                onChange={(v) => setBloom(v === 'on')}
              />
              <p className="settings-note">The glow the stones cast on the board.</p>
            </div>
          </section>

          <section className="settings-section">
            <Segmented
              label="Blunder mode"
              value={blunderMode ? 'on' : 'off'}
              options={[{ value: 'off', label: 'Off (fastest)' }, { value: 'on', label: 'On' }]}
              onChange={(v) => setBlunderMode(v === 'on')}
            />
            <p className="settings-note">
              Enables &ldquo;blunder mode&rdquo;, which will inform you that you have lost once it is already too late,
              at the cost of some thinking speed.
            </p>
            {blunderMode && <SoundCheck />}
          </section>
        </div>
      </dialog>
    </>
  );
}
