import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { THEMES, themeSwatch, type ThemeId } from '../lib/theme.ts';

/** Points of a pointy-top hexagon centred at (cx, cy). */
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function Swatch({ id }: { id: ThemeId }) {
  const c = themeSwatch(id);
  return (
    <svg className="theme-swatch" viewBox="0 0 46 28" aria-hidden="true">
      <rect width="46" height="28" rx="3" fill={c.ground} />
      <polygon points={hexPoints(11, 14, 7.5)} fill={c.field} opacity="0.35" />
      <polygon points={hexPoints(23, 14, 7.5)} fill={c.x} />
      <polygon points={hexPoints(35, 14, 7.5)} fill={c.o} />
    </svg>
  );
}

/** The list opens inline rather than floating so the settings dialog can't clip it. */
export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const labelId = useId();
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLLIElement | null>>([]);
  const current = THEMES.find((t) => t.id === value) ?? THEMES[0];

  useEffect(() => {
    if (open) options.current[active]?.focus();
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, THEMES.findIndex((t) => t.id === value)));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const pick = (id: ThemeId) => {
    onChange(id);
    close();
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = THEMES.length - 1;
    const move = (to: number) => {
      e.preventDefault();
      setActive(to);
    };
    if (e.key === 'ArrowDown') move(active === last ? 0 : active + 1);
    else if (e.key === 'ArrowUp') move(active === 0 ? last : active - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(last);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(THEMES[active]!.id);
    } else if (e.key === 'Escape') {
      // Closes only the list, not the settings window.
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="theme-picker" data-open={open}>
      <span id={labelId} className="field-label">Theme</span>
      <button
        ref={trigger}
        type="button"
        className="theme-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${listId}-current`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            show();
          }
        }}
      >
        <Swatch id={current.id} />
        <span id={`${listId}-current`} className="theme-name">{current.label}</span>
        <ChevronDown className="theme-chevron" size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul id={listId} className="theme-list" role="listbox" aria-labelledby={labelId} onKeyDown={onListKey}>
          {THEMES.map((t, i) => (
            <li
              key={t.id}
              ref={(el) => {
                options.current[i] = el;
              }}
              role="option"
              aria-selected={t.id === value}
              tabIndex={i === active ? 0 : -1}
              className="theme-option"
              onClick={() => pick(t.id)}
              onMouseMove={() => i !== active && setActive(i)}
            >
              <Swatch id={t.id} />
              <span className="theme-name">{t.label}</span>
              {t.id === value && <Check className="theme-check" size={16} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
