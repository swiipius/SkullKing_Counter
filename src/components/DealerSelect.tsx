import { useEffect, useRef, useState } from 'preact/hooks';
import { Chevron } from './Icons';
import { SeaScroll } from './SeaScroll';

interface Props {
  names: string[];
  value: number;
  onChange: (index: number) => void;
}

/** "Premier donneur" dropdown: opens upwards, scrolls inside with the anchor bar. */
export function DealerSelect({ names, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (i: number) => {
    onChange(i);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div class="dealer" ref={root}>
      <span id="first-dealer-label" class="dealer__label">
        Premier donneur
      </span>
      <button
        ref={button}
        type="button"
        class="dealer__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="first-dealer-label first-dealer-value"
        onClick={() => setOpen(!open)}
      >
        <span id="first-dealer-value">{names[value]}</span>
        <Chevron up={open} />
      </button>
      {open && (
        <div class="dealer__menu">
          <SeaScroll small maxHeight={200} role="listbox" labelledBy="first-dealer-label" contentClass="dealer__options">
            {names.map((name, i) => (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={i === value}
                class={`dealer__option ${i === value ? 'is-selected' : ''}`}
                onClick={() => pick(i)}
              >
                {i === value ? `✓ ${name}` : name}
              </button>
            ))}
          </SeaScroll>
        </div>
      )}
    </div>
  );
}
