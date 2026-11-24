import type { ComponentChildren } from 'preact';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';

/** Anchor used as the scroll thumb; colour from --sea-anchor (gold by default). */
function ScrollAnchor({ size = 30 }: { size?: number }) {
  const paths = (
    <>
      <circle cx="12" cy="4" r="2.2" />
      <path d="M12 6.5v16M4.5 15.5H3a9 8 0 0 0 18 0h-1.5M8 9.5h8" />
    </>
  );
  return (
    <svg width={size} height={(size * 26) / 24} viewBox="0 0 24 26" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g stroke="#2a1a10" stroke-width="5">{paths}</g>
      <g stroke="var(--sea-anchor, #e8b04a)" stroke-width="2.4">{paths}</g>
    </svg>
  );
}

interface Props {
  children: ComponentChildren;
  /** Class of the inner content box (padding, gap…). */
  contentClass?: string;
  /** Smaller track, for menus. */
  small?: boolean;
  maxHeight?: number;
  role?: 'listbox';
  labelledBy?: string;
}

/**
 * Scroll area whose scrollbar is a strip of sea with an anchor as the thumb.
 * Native scrolling (touch, wheel, keyboard) still works; the anchor can also be dragged.
 */
export function SeaScroll({ children, contentClass, small, maxHeight, role, labelledBy }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ can: false, pct: 0 });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const can = max > 2;
    const pct = can ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    setState((prev) => (prev.can === can && Math.abs(prev.pct - pct) < 0.001 ? prev : { can, pct }));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (scroller.current) ro.observe(scroller.current);
    if (content.current) ro.observe(content.current);
    return () => ro.disconnect();
  }, [measure]);

  const scrollToPointer = (clientY: number) => {
    const el = scroller.current;
    const t = track.current;
    if (!el || !t) return;
    const rect = t.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrollToPointer(e.clientY);
  };
  const onPointerMove = (e: PointerEvent) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) scrollToPointer(e.clientY);
  };

  const pct = `${(state.pct * 100).toFixed(1)}%`;
  return (
    <div class={`sea ${small ? 'sea--small' : ''}`}>
      <div
        ref={scroller}
        class="sea__scroller"
        onScroll={measure}
        style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
        role={role}
        aria-labelledby={labelledBy}
      >
        <div ref={content} class={contentClass}>
          {children}
        </div>
      </div>
      {state.can && (
        <div ref={track} class="sea__track" aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <span class="sea__anchor" style={{ top: pct, transform: `translate(-50%, -${pct})` }}>
            <ScrollAnchor size={small ? 22 : 30} />
          </span>
        </div>
      )}
    </div>
  );
}
