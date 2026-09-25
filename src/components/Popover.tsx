import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useDesktopConfig, useDesktopController, useDesktopState } from '../context';
import type { PanelPosition } from '../types';
import { cx } from '../utils';

export interface PopoverProps {
  anchorRef: RefObject<HTMLElement>;
  /** Side of the screen the anchor sits on; the popover opens away from it. */
  edge: PanelPosition;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  label?: string;
}

/** Floating surface anchored to a panel button, rendered into the overlay layer. */
export function Popover({ anchorRef, edge, onClose, children, className, align = 'start', label }: PopoverProps) {
  const { rootRef, overlayRef } = useDesktopConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const anchor = anchorRef.current;
    const root = rootRef.current;
    if (!el || !anchor || !root) return;
    const place = () => {
      const r = root.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 6;
      let left = 0;
      let top = 0;
      if (edge === 'bottom' || edge === 'top') {
        top = edge === 'bottom' ? a.top - r.top - h - gap : a.bottom - r.top + gap;
        left = align === 'start' ? a.left - r.left : align === 'end' ? a.right - r.left - w : a.left - r.left + a.width / 2 - w / 2;
      } else {
        left = edge === 'left' ? a.right - r.left + gap : a.left - r.left - w - gap;
        top = a.top - r.top;
      }
      left = Math.min(Math.max(6, left), r.width - w - 6);
      top = Math.min(Math.max(6, top), r.height - h - 6);
      setPos({ left, top });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchorRef, rootRef, edge, align]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return;
      if (t instanceof Element && t.closest('[data-xbd-menu]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchorRef]);

  if (!overlayRef.current) return null;
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={cx('xbd-popover', `xbd-popover--from-${edge}`, className)}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, opacity: pos ? undefined : 0, pointerEvents: pos ? undefined : 'none' }}
    >
      {children}
    </div>,
    overlayRef.current,
  );
}

/** Open/close state for a panel popover; only one popover is open desktop-wide. */
export function usePanelPopover() {
  const id = useId();
  const api = useDesktopController();
  const open = useDesktopState((s) => s.openPopover === id, Object.is);
  return {
    open,
    setOpen: (value: boolean) => api.setOpenPopover(value ? id : null),
    toggle: () => api.setOpenPopover(api.getState().openPopover === id ? null : id),
    close: () => {
      if (api.getState().openPopover === id) api.setOpenPopover(null);
    },
  };
}
