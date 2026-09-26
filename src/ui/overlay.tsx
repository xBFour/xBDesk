import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { CloseIcon } from '../components/icons';
import { cx } from '../utils';
import { Button } from './basic';
import { Portal, useUiLabels, type PortalScope } from './shared';

/* -------------------------------- Tooltip ------------------------------- */

export interface TooltipProps {
  content: ReactNode;
  /** A single element that accepts ref-less event props (button, span…). */
  children: ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/** Small hint on hover/focus. Rendered in the desktop overlay so windows never clip it. */
export function Tooltip({ content, children, side = 'top', delay = 350 }: TooltipProps) {
  const id = useId();
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const bubble = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const show = (el: Element) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnchor(el.getBoundingClientRect()), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setAnchor(null);
    setPos(null);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const el = bubble.current;
    if (!anchor || !el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 8;
    let left = anchor.left + anchor.width / 2 - w / 2;
    let top = anchor.top - h - gap;
    if (side === 'bottom' || (side === 'top' && top < 4)) top = anchor.bottom + gap;
    if (side === 'left') {
      left = anchor.left - w - gap;
      top = anchor.top + anchor.height / 2 - h / 2;
    }
    if (side === 'right') {
      left = anchor.right + gap;
      top = anchor.top + anchor.height / 2 - h / 2;
    }
    left = Math.max(4, Math.min(left, window.innerWidth - w - 4));
    // The bubble is position:fixed, so viewport coordinates are used directly.
    setPos({ left, top: Math.max(4, top) });
  }, [anchor, side]);

  if (!isValidElement(children)) return children;
  const child = children as ReactElement<Record<string, unknown>>;
  const p = child.props as Record<string, ((e: unknown) => void) | undefined>;
  const trigger = cloneElement(child, {
    'aria-describedby': anchor ? id : undefined,
    onMouseEnter: (e: { currentTarget: Element }) => {
      p.onMouseEnter?.(e);
      show(e.currentTarget);
    },
    onMouseLeave: (e: unknown) => {
      p.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: { currentTarget: Element }) => {
      p.onFocus?.(e);
      show(e.currentTarget);
    },
    onBlur: (e: unknown) => {
      p.onBlur?.(e);
      hide();
    },
    onKeyDown: (e: { key: string }) => {
      p.onKeyDown?.(e);
      if (e.key === 'Escape') hide();
    },
  });

  return (
    <>
      {trigger}
      {anchor && (
        <Portal>
          <div ref={bubble} id={id} role="tooltip" className="xbd-tooltip" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}>
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}

/* --------------------------------- Dialog ------------------------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons, usually right-aligned. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /**
   * `window` (default inside a window): dims and blocks only that window, like a
   * native sheet. `desktop`: centred over the whole desktop.
   */
  scope?: PortalScope;
  /** Close when the dimmed background is clicked. Default `true`. */
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', scope = 'window', dismissible = true, initialFocus, className }: DialogProps) {
  const labels = useUiLabels();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = initialFocus?.current ?? el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el;
    first?.focus({ preventScroll: true });
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <Portal scope={scope}>
      <div
        className={cx('xbd-dialog-backdrop', scope === 'window' && 'is-window')}
        onPointerDown={(e) => {
          if (dismissible && e.target === e.currentTarget) onCloseRef.current();
        }}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cx('xbd-dialog', `xbd-dialog--${size}`, className)}
          onKeyDown={onKeyDown}
        >
          {(title || description) && (
            <header className="xbd-dialog__header">
              {title && (
                <h2 id={titleId} className="xbd-dialog__title">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="xbd-dialog__description">
                  {description}
                </p>
              )}
              <button type="button" className="xbd-icon-button xbd-dialog__close" aria-label={labels.close} onClick={() => onCloseRef.current()}>
                <CloseIcon />
              </button>
            </header>
          )}
          {children && <div className="xbd-dialog__body">{children}</div>}
          {footer && <footer className="xbd-dialog__footer">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}

export interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  scope?: PortalScope;
}

/**
 * `const { confirm, dialog } = useConfirm()` — render `{dialog}` once, then
 * `if (await confirm({ title: 'Delete?' })) …`.
 */
export function useConfirm() {
  const labels = useUiLabels();
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })), []);
  const answer = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };
  const dialog = (
    <Dialog
      open={!!state}
      onClose={() => answer(false)}
      title={state?.title}
      size="sm"
      scope={state?.scope}
      footer={
        <>
          <Button onClick={() => answer(false)}>{state?.cancelLabel ?? labels.cancel}</Button>
          <Button variant={state?.danger ? 'danger' : 'primary'} data-autofocus onClick={() => answer(true)}>
            {state?.confirmLabel ?? labels.confirm}
          </Button>
        </>
      }
    >
      {state?.message}
    </Dialog>
  );
  return { confirm, dialog };
}
