import type { ComponentChildren } from 'preact';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';
import './sea-scroll.css';


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
 * Scroll area with a slim, discreet scrollbar. Like a normal scrollbar, the thumb
 * is as long as the visible part of the page: the shorter the page, the bigger
 * the thumb. Colours come from --sea-track and --sea-thumb so each game sets its
 * own. Native scrolling (touch, wheel, keyboard) still works; the thumb can be dragged.
 */
export function SeaScroll({ children, contentClass, small, maxHeight, role, labelledBy }: Props) {
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

  const min = small ? 24 : 36;
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
        <div ref={track} class="sea__track" aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <span ref={handle} class="sea__thumb" style={{ height: length, top: `calc((100% - ${length}) * ${state.pct.toFixed(4)})` }}>
          </span>
        </div>
      )}
    </div>
  );
}
