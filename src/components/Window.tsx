import {
  Component,
  Suspense,
  memo,
  useEffect,
  useRef,
  type ErrorInfo,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { WindowContext, useDesktopConfig, useDesktopController, useDesktopState, type WindowButton } from '../context';
import type { DesktopController } from '../store/desktop-store';
import type { Bounds, MenuEntry, Size, WindowState } from '../types';
import { clamp, cx, keepReachable } from '../utils';
import { AppIcon } from './AppIcon';
import { AlertIcon, CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon, TileLeftIcon, TileRightIcon } from './icons';

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const DRAG_THRESHOLD = 4;
const SNAP_MARGIN = 6;

/** Bounds actually rendered for a window, given maximise/tile state. */
export function displayBounds(w: WindowState, viewport: Size, compact: boolean): Bounds {
  if (compact || w.maximized) return { x: 0, y: 0, width: viewport.width, height: viewport.height };
  if (w.tiled) {
    const half = Math.round(viewport.width / 2);
    return w.tiled === 'left'
      ? { x: 0, y: 0, width: half, height: viewport.height }
      : { x: half, y: 0, width: viewport.width - half, height: viewport.height };
  }
  return keepReachable(w.bounds, viewport);
}

/** Window menu shared by the title bar and the task bar. */
export function windowMenu(api: DesktopController, w: WindowState, labels: ReturnType<typeof useDesktopConfig>['labels'], workspaces: number): MenuEntry[] {
  const entries: MenuEntry[] = [
    { label: labels.minimize, icon: <MinimizeIcon />, disabled: !w.minimizable || w.minimized, onSelect: () => api.minimizeWindow(w.id) },
    {
      label: w.maximized ? labels.restore : labels.maximize,
      icon: w.maximized ? <RestoreIcon /> : <MaximizeIcon />,
      disabled: !w.maximizable,
      onSelect: () => (w.minimized ? api.restoreWindow(w.id) : api.toggleMaximize(w.id)),
    },
    { label: labels.tileLeft, icon: <TileLeftIcon />, disabled: !w.resizable, onSelect: () => { api.focusWindow(w.id); api.tileWindow(w.id, 'left'); } },
    { label: labels.tileRight, icon: <TileRightIcon />, disabled: !w.resizable, onSelect: () => { api.focusWindow(w.id); api.tileWindow(w.id, 'right'); } },
  ];
  if (workspaces > 1) {
    entries.push({
      label: labels.moveToWorkspace,
      items: Array.from({ length: workspaces }, (_, i) => ({
        label: labels.workspace(i + 1),
        checked: w.workspace === i,
        onSelect: () => api.moveWindowToWorkspace(w.id, i),
      })),
    });
  }
  entries.push({ type: 'separator' }, { label: labels.close, icon: <CloseIcon />, danger: true, onSelect: () => void api.requestClose(w.id) });
  return entries;
}

class WindowErrorBoundary extends Component<
  { children: ReactNode; message: string; reloadLabel: string; onReload: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[xBDesk] Window content crashed:', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="xbd-window__crash" role="alert">
        <AlertIcon width={32} height={32} />
        <p>{this.props.message}</p>
        <code>{this.state.error.message}</code>
        <button type="button" className="xbd-button" onClick={this.props.onReload}>
          {this.props.reloadLabel}
        </button>
      </div>
    );
  }
}

function WindowContent({ w }: { w: WindowState }) {
  const { apps } = useDesktopConfig();
  if (w.appId) {
    const app = apps.find((a) => a.id === w.appId);
    if (!app) return null;
    const C = app.component;
    return <C windowId={w.id} args={w.args} />;
  }
  return <>{typeof w.content === 'function' ? w.content() : w.content}</>;
}

interface WindowFrameProps {
  id: string;
  z: number;
}

/** One managed window: title bar, move/resize/snap, error boundary, suspense. */
export const WindowFrame = memo(function WindowFrame({ id, z }: WindowFrameProps) {
  const api = useDesktopController();
  const { labels, windowButtons, titleAlign, rootRef } = useDesktopConfig();
  const w = useDesktopState((s) => s.windows[id], Object.is);
  const focused = useDesktopState((s) => s.focusedId === id, Object.is);
  const visible = useDesktopState((s) => s.activeWorkspace === s.windows[id]?.workspace, Object.is);
  const viewport = useDesktopState((s) => s.viewport);
  const compact = useDesktopState((s) => s.compact, Object.is);
  const workspaces = useDesktopState((s) => s.preferences.workspaces, Object.is);
  const buttonSide = useDesktopState((s) => s.preferences.buttonSide, Object.is);
  const ref = useRef<HTMLDivElement>(null);

  // Move keyboard focus into the window when it becomes the focused one.
  useEffect(() => {
    const el = ref.current;
    if (focused && visible && el && !w?.minimized && !el.contains(document.activeElement)) {
      el.focus({ preventScroll: true });
    }
  }, [focused, visible, w?.minimized]);

  if (!w) return null;
  const b = displayBounds(w, viewport, compact);
  const maximized = compact || w.maximized;
  const interactive = !compact;

  const setInteracting = (on: boolean) => rootRef.current?.classList.toggle('xbd-root--interacting', on);

  /* -------------------------------- move -------------------------------- */
  const onTitlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !interactive) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const el = ref.current;
    const ws = el?.parentElement;
    if (!el || !ws) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const wsRect = ws.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let start: Bounds = displayBounds(w, viewport, compact);
    let current = start;
    let dragging = false;
    let snap: 'left' | 'right' | 'top' | null = null;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        dragging = true;
        setInteracting(true);
        // Dragging a maximised/tiled window restores it under the pointer.
        if (w.maximized || w.tiled) {
          const ratio = (startX - wsRect.left - start.x) / start.width;
          const restored: Bounds = {
            ...w.bounds,
            x: startX - wsRect.left - ratio * w.bounds.width,
            y: Math.max(0, startY - wsRect.top - 16),
          };
          api.setWindowBounds(id, restored);
          start = restored;
          el.style.width = `${restored.width}px`;
          el.style.height = `${restored.height}px`;
        }
      }
      const px = ev.clientX - wsRect.left;
      const py = ev.clientY - wsRect.top;
      current = {
        ...start,
        x: start.x + dx,
        y: clamp(start.y + dy, 0, wsRect.height - 32),
      };
      el.style.left = `${current.x}px`;
      el.style.top = `${current.y}px`;

      let nextSnap: typeof snap = null;
      if (w.resizable) {
        if (py <= SNAP_MARGIN && w.maximizable) nextSnap = 'top';
        else if (px <= SNAP_MARGIN) nextSnap = 'left';
        else if (px >= wsRect.width - SNAP_MARGIN) nextSnap = 'right';
      }
      if (nextSnap !== snap) {
        snap = nextSnap;
        const half = Math.round(wsRect.width / 2);
        api.setSnapPreview(
          snap === 'top'
            ? { x: 0, y: 0, width: wsRect.width, height: wsRect.height }
            : snap === 'left'
              ? { x: 0, y: 0, width: half, height: wsRect.height }
              : snap === 'right'
                ? { x: half, y: 0, width: wsRect.width - half, height: wsRect.height }
                : null,
        );
      }
    };

    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      if (!dragging) return;
      setInteracting(false);
      api.setSnapPreview(null);
      if (snap === 'top') {
        api.setWindowBounds(id, { ...current, x: start.x, y: start.y });
        api.maximizeWindow(id);
      } else if (snap) {
        api.setWindowBounds(id, { ...current, x: start.x, y: start.y });
        api.tileWindow(id, snap);
      } else {
        api.setWindowBounds(id, current);
      }
    };

    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  /* ------------------------------- resize ------------------------------- */
  const onResizePointerDown = (edge: Edge) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = ref.current;
    const ws = el?.parentElement;
    if (!el || !ws) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    api.focusWindow(id);
    const wsRect = ws.getBoundingClientRect();
    const start = displayBounds(w, viewport, compact);
    const startX = e.clientX;
    const startY = e.clientY;
    let current = start;
    setInteracting(true);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, width, height } = start;
      if (edge.includes('e')) width = Math.max(w.minWidth, start.width + dx);
      if (edge.includes('s')) height = Math.max(w.minHeight, start.height + dy);
      if (edge.includes('w')) {
        width = Math.max(w.minWidth, start.width - dx);
        x = start.x + start.width - width;
      }
      if (edge.includes('n')) {
        const maxH = start.y + start.height;
        height = clamp(start.height - dy, w.minHeight, maxH);
        y = start.y + start.height - height;
      }
      if (edge.includes('s')) height = Math.min(height, wsRect.height - y + 40);
      current = { x, y, width, height };
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      setInteracting(false);
      api.setWindowBounds(id, current);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  // Left-side layouts put "close" at the outer edge (GNOME/macOS convention).
  const order = buttonSide === 'left' ? [...windowButtons].sort((a, b) => Number(b === 'close') - Number(a === 'close')) : windowButtons;
  const buttons = (
    <div className="xbd-window__buttons">
      {order.map((btn: WindowButton) => {
        if (btn === 'minimize' && w.minimizable) {
          return (
            <button key={btn} type="button" className="xbd-window__btn xbd-window__btn--minimize" aria-label={labels.minimize} title={labels.minimize} onClick={() => api.minimizeWindow(id)}>
              <MinimizeIcon />
            </button>
          );
        }
        if (btn === 'maximize' && w.maximizable && !compact) {
          const label = w.maximized ? labels.restore : labels.maximize;
          return (
            <button key={btn} type="button" className="xbd-window__btn xbd-window__btn--maximize" aria-label={label} title={label} onClick={() => api.toggleMaximize(id)}>
              {w.maximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
          );
        }
        if (btn === 'close') {
          return (
            <button key={btn} type="button" className="xbd-window__btn xbd-window__btn--close" aria-label={labels.close} title={labels.close} onClick={() => void api.requestClose(id)}>
              <CloseIcon />
            </button>
          );
        }
        return null;
      })}
    </div>
  );

  const titleId = `${id}-title`;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      aria-hidden={!visible || w.minimized || undefined}
      tabIndex={-1}
      className={cx(
        'xbd-window',
        focused && 'is-focused',
        maximized && 'is-maximized',
        w.tiled && !maximized && `is-tiled is-tiled-${w.tiled}`,
        w.minimized && 'is-minimized',
        !visible && 'is-offscreen',
        w.className,
      )}
      style={{ left: b.x, top: b.y, width: b.width, height: b.height, zIndex: z }}
      onPointerDownCapture={() => {
        if (!focused) api.focusWindow(id);
      }}
      onKeyDown={(e) => {
        if (e.altKey && e.key === 'F4') {
          e.preventDefault();
          void api.requestClose(id);
        }
      }}
    >
      <div
        className={cx('xbd-window__titlebar', `xbd-window__titlebar--${titleAlign}`, buttonSide === 'left' && 'has-buttons-left')}
        onPointerDown={onTitlePointerDown}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest('button') && interactive) api.toggleMaximize(id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          api.openContextMenu(e.clientX, e.clientY, windowMenu(api, w, labels, workspaces));
        }}
      >
        <span className="xbd-window__heading">
          <AppIcon icon={w.icon} size={16} className="xbd-window__icon" />
          <span id={titleId} className="xbd-window__title">
            {w.title}
          </span>
        </span>
        {buttons}
      </div>
      <div className={cx('xbd-window__body', w.bare && 'is-bare')}>
        <WindowContext.Provider value={id}>
          <WindowErrorBoundary key={w.generation} message={labels.appCrashed} reloadLabel={labels.reload} onReload={() => api.reloadWindow(id)}>
            <Suspense
              fallback={
                <div className="xbd-window__loading" aria-live="polite">
                  <span className="xbd-spinner" />
                  {labels.loading}
                </div>
              }
            >
              <WindowContent w={w} />
            </Suspense>
          </WindowErrorBoundary>
        </WindowContext.Provider>
      </div>
      {interactive && w.resizable && !w.maximized &&
        EDGES.map((edge) => <div key={edge} className={`xbd-window__resize xbd-window__resize--${edge}`} onPointerDown={onResizePointerDown(edge)} />)}
    </div>
  );
});

/** Renders every window plus the snap preview. */
export function WindowLayer() {
  const stack = useDesktopState((s) => s.stack);
  // Creation order: keeps DOM order stable so raising a window never moves nodes (iframes would reload).
  const ids = useDesktopState((s) => Object.keys(s.windows));
  const preview = useDesktopState((s) => s.snapPreview, Object.is);
  return (
    <div className="xbd-windows">
      {preview && (
        <div
          className="xbd-snap-preview"
          style={{ left: preview.x, top: preview.y, width: preview.width, height: preview.height, zIndex: 9 + (stack.length - 1) * 2 }}
        />
      )}
      {ids.map((id) => (
        <WindowFrame key={id} id={id} z={10 + stack.indexOf(id) * 2} />
      ))}
    </div>
  );
}
