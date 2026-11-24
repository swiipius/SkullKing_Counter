import type { ComponentChildren } from 'preact';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';
import './sea-scroll.css';

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
  /** Custom thumb (default: the Skull King anchor). */
  thumb?: ComponentChildren;
  /** Extra class on the track, so each game can restyle it. */
  trackClass?: string;
  maxHeight?: number;
  role?: 'listbox';
  labelledBy?: string;
}

/**
 * Scroll area whose scrollbar is a strip of sea with an anchor as the thumb.
 * Like a normal scrollbar, the thumb is as long as the visible part of the page:
 * the shorter the page, the bigger the thumb. Native scrolling (touch, wheel,
 * keyboard) still works, and the thumb can be dragged.
 */
export function SeaScroll({ children, contentClass, small, maxHeight, role, labelledBy, thumb, trackClass }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLSpanElement>(null);
  const grab = useRef(0);
  const [state, setState] = useState({ can: false, pct: 0, size: 1 });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const can = max > 2;
    const pct = can ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    const size = can ? el.clientHeight / el.scrollHeight : 1;
    setState((prev) =>
      prev.can === can && Math.abs(prev.pct - pct) < 0.001 && Math.abs(prev.size - size) < 0.001 ? prev : { can, pct, size },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (scroller.current) ro.observe(scroller.current);
    if (content.current) ro.observe(content.current);
    return () => ro.disconnect();
  }, [measure]);

  /** Moves the page so the thumb's top sits at the pointer minus where it was grabbed. */
  const scrollToPointer = (clientY: number) => {
    const el = scroller.current;
    const t = track.current;
    const h = handle.current;
    if (!el || !t || !h) return;
    const tr = t.getBoundingClientRect();
    const room = tr.height - h.getBoundingClientRect().height;
    const ratio = room > 0 ? Math.min(1, Math.max(0, (clientY - tr.top - grab.current) / room)) : 0;
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const hr = handle.current?.getBoundingClientRect();
    // Grabbing the thumb keeps it under the finger; tapping the track centres it there.
    grab.current = hr && e.clientY >= hr.top && e.clientY <= hr.bottom ? e.clientY - hr.top : (hr?.height ?? 0) / 2;
    scrollToPointer(e.clientY);
  };
  const onPointerMove = (e: PointerEvent) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) scrollToPointer(e.clientY);
  };

  const min = small ? 28 : 40;
  const length = `max(${min}px, ${(state.size * 100).toFixed(2)}%)`;
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
        <div ref={track} class={`sea__track ${trackClass ?? ''}`} aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <span ref={handle} class="sea__thumb" style={{ height: length, top: `calc((100% - ${length}) * ${state.pct.toFixed(4)})` }}>
            {thumb ?? (
              <span class="sea__bar">
                <ScrollAnchor size={small ? 20 : 26} />
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
