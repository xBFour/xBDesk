import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDesktopConfig, useDesktopController, useDesktopState } from '../context';
import type { DesktopNotification } from '../types';
import { AppIcon } from './AppIcon';
import { CloseIcon } from './icons';

function Toast({ n }: { n: DesktopNotification }) {
  const api = useDesktopController();
  const { labels } = useDesktopConfig();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(n.timeout ?? 5000);

  useEffect(() => {
    if (!remaining.current || paused) return;
    const started = Date.now();
    const t = setTimeout(() => api.dismissNotification(n.id), remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current = Math.max(400, remaining.current - (Date.now() - started));
    };
  }, [paused, api, n.id]);

  return (
    <div className="dui-toast" role="status" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      {n.icon !== undefined && <AppIcon icon={n.icon} size={32} className="dui-toast__icon" />}
      <div className="dui-toast__content">
        <strong className="dui-toast__title">{n.title}</strong>
        {n.body && <div className="dui-toast__body">{n.body}</div>}
        {n.actions?.length ? (
          <div className="dui-toast__actions">
            {n.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className="dui-button dui-button--small"
                onClick={() => {
                  a.onClick();
                  api.dismissNotification(n.id);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button type="button" className="dui-icon-button dui-toast__close" aria-label={labels.dismiss} onClick={() => api.dismissNotification(n.id)}>
        <CloseIcon />
      </button>
    </div>
  );
}

/** Toast stack for `api.notify()`. Rendered by `<Desktop>` in the workspace corner. */
export function Notifications() {
  const notifications = useDesktopState((s) => s.notifications, Object.is);
  return (
    <div className="dui-notifications" aria-live="polite">
      {notifications.map((n) => (
        <Toast key={n.id} n={n} />
      ))}
    </div>
  );
}

export interface DesktopWidgetProps {
  /** Absolute placement inside the workspace, e.g. `{ top: 24, right: 24 }`. */
  position?: Pick<CSSProperties, 'top' | 'right' | 'bottom' | 'left'>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Content pinned on the desktop surface (above the wallpaper, below windows) — clocks, stats, notes… */
export function DesktopWidget({ position = { top: 24, right: 24 }, className, style, children }: DesktopWidgetProps) {
  const { widgetLayerRef } = useDesktopConfig();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(widgetLayerRef.current), [widgetLayerRef]);
  if (!target) return null;
  return createPortal(
    <div className={['dui-widget', className].filter(Boolean).join(' ')} style={{ ...position, ...style }}>
      {children}
    </div>,
    target,
  );
}
