import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface AnchoredPosition {
  left: number;
  top: number;
  /** The anchor's width, for panels that should be at least as wide as their field. */
  anchorWidth: number;
}

/**
 * Viewport position (`position: fixed`) for a panel under its anchor — flipped
 * above when there is no room below, clamped to the viewport. Follows scrolling,
 * resizing and size changes of both elements. Call it from the component that
 * renders the panel and mount that component only while the panel is open.
 */
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement>, panelRef: RefObject<HTMLElement>): AnchoredPosition | null {
  const [pos, setPos] = useState<AnchoredPosition | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      const el = panelRef.current;
      if (!a || !el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 4;
      const margin = 8;
      let top = a.bottom + gap;
      if (top + h > window.innerHeight - margin && a.top - gap - h >= margin) top = a.top - gap - h;
      top = Math.max(margin, top);
      const left = Math.max(margin, Math.min(a.left, window.innerWidth - w - margin));
      setPos((p) => (p && p.left === left && p.top === top && p.anchorWidth === a.width ? p : { left, top, anchorWidth: a.width }));
    };
    place();
    const ro = new ResizeObserver(place);
    if (panelRef.current) ro.observe(panelRef.current);
    if (anchorRef.current) ro.observe(anchorRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, panelRef]);
  return pos;
}

/** Calls `onDismiss` for a pointer press outside all of `refs`. */
export function useOutsidePointerDown(refs: Array<RefObject<HTMLElement>>, onDismiss: () => void): void {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const refsRef = useRef(refs);
  refsRef.current = refs;
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (refsRef.current.some((r) => r.current?.contains(t))) return;
      dismissRef.current();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);
}
