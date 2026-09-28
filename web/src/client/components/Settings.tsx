import { useEffect, useId, useRef, useState } from 'react';
import { Settings as Gear, X } from 'lucide-react';
import { Segmented, SoundCheck } from './Broadcast.tsx';
import { api } from '../lib/api.ts';
import { FeedbackButton } from './Feedback.tsx';
import { useGeneration } from '../lib/generation.ts';
import { GenerationSlider } from './GenerationSlider.tsx';
import { useAutoCamera } from '../lib/autoCamera.ts';
import { useThinkBy } from '../lib/thinkBy.ts';
import { useBlunderMode } from '../lib/blunderMode.ts';
import { useBloom, useTheme } from '../lib/theme.ts';
import { ThemePicker } from './ThemePicker.tsx';

export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [blunderMode, setBlunderMode] = useBlunderMode();
  const [theme, setTheme] = useTheme();
  const [bloom, setBloom] = useBloom();
  const [autoCamera, setAutoCamera] = useAutoCamera();
  const [thinking, setThinking] = useThinkBy();
  const titleId = useId();
  const [canQuit, setCanQuit] = useState(false);
  const [generation, setGeneration] = useGeneration();
  const [gens, setGens] = useState<{ generations: number[]; downloadable?: number[]; newest: number | null } | null>(null);
  const [stopped, setStopped] = useState(false);
  const [shortcut, setShortcut] = useState('');

  // The downloaded app has no window to close, so the host stops it here.
  useEffect(() => {
    if (!open) return;
    api.info().then((i) => setCanQuit(Boolean(i.canQuit))).catch(() => setCanQuit(false));
    // The app's own networks; the website has none to choose from.
    api.generations().then(setGens).catch(() => setGens(null));
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <FeedbackButton />
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

          {gens && gens.generations.length > 1 && (
            <section className="settings-section">
              <GenerationSlider
                label="Six's generation"
                generations={gens.generations}
                downloadable={gens.downloadable}
                newest={gens.newest}
                value={generation}
                onChange={setGeneration}
              />
              <p className="settings-note">Which of Six's trained networks you play against. Older ones are weaker; the newest is the default.</p>
            </section>
          )}

          <section className="settings-section">
            <Segmented
              label="Six thinks by"
              value={thinking}
              options={[{ value: 'positions', label: 'Positions' }, { value: 'time', label: 'Time' }]}
              onChange={setThinking}
            />
            <p className="settings-note">
              {thinking === 'positions'
                ? 'Six looks at the same number of positions on any computer, so it plays at full strength everywhere. Slower computers take longer per move.'
                : 'Six stops at the chosen time. On a slower computer it looks at fewer positions, so it plays weaker.'}
            </p>
          </section>

          <section className="settings-section">
            <Segmented
              label="Auto camera"
              value={autoCamera ? 'on' : 'off'}
              options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
              onChange={(v) => setAutoCamera(v === 'on')}
            />
            <p className="settings-note">Automatically moves the camera to match the board size. (Can cause miss clicks)</p>
          </section>

          {canQuit && (
            <section className="settings-section">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShortcut('Adding...');
                  api.desktopShortcut().then(
                    () => setShortcut('Added: Six is on your desktop.'),
                    (e: Error) => setShortcut(`Couldn't add it: ${e.message}`),
                  );
                }}
              >
                Add Six to the desktop
              </button>
              <p className="settings-note" role="status">{shortcut || 'A shortcut that opens Six, like the Six file in its folder.'}</p>
            </section>
          )}

          {canQuit && (
            <section className="settings-section">
              {stopped ? (
                <p className="settings-note" role="status">Six has stopped. You can close this tab; open Six again to play.</p>
              ) : (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      api.quit().then(() => setStopped(true)).catch(() => setStopped(true));
                    }}
                  >
                    Quit Six
                  </button>
                  <p className="settings-note">Stops Six on this PC. It also stops by itself a few minutes after the last tab closes.</p>
                </>
              )}
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
