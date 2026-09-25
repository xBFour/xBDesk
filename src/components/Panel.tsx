import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  type WheelEvent,
} from 'react';
import { useDesktopConfig, useDesktopController, useDesktopState } from '../context';
import type { IconSource, PanelPosition } from '../types';
import { cx } from '../utils';
import { AppIcon } from './AppIcon';
import { DesktopIcon, MoonIcon, SunIcon } from './icons';
import { Popover, usePanelPopover } from './Popover';
import { windowMenu } from './Window';

export interface PanelContextValue {
  position: PanelPosition;
  vertical: boolean;
}

export const PanelContext = createContext<PanelContextValue>({ position: 'bottom', vertical: false });
export const usePanel = () => useContext(PanelContext);

export interface PanelProps {
  /** Screen edge. Defaults to the user's `panelPosition` preference. */
  position?: PanelPosition;
  /** Thickness in px. */
  size?: number;
  /** Detached from the screen edge with rounded corners. */
  floating?: boolean;
  /** Blurred, semi-transparent background. Default `true`. */
  translucent?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  children?: ReactNode;
}

/** A bar docked to a screen edge that hosts panel widgets. */
export function Panel({ position, size = 44, floating, translucent = true, className, style, children, ...rest }: PanelProps) {
  const pref = useDesktopState((s) => s.preferences.panelPosition, Object.is);
  const pos = position ?? pref;
  const vertical = pos === 'left' || pos === 'right';
  return (
    <PanelContext.Provider value={{ position: pos, vertical }}>
      <div
        role="region"
        aria-label={rest['aria-label'] ?? 'Panel'}
        className={cx(
          'dui-panel',
          `dui-panel--${pos}`,
          vertical ? 'dui-panel--vertical' : 'dui-panel--horizontal',
          floating && 'dui-panel--floating',
          translucent && 'dui-panel--translucent',
          className,
        )}
        style={{ ['--dui-panel-size' as string]: `${size}px`, ...style }}
      >
        <div className="dui-panel__inner">{children}</div>
      </div>
    </PanelContext.Provider>
  );
}

export const PanelSpacer = () => <div className="dui-panel-spacer" aria-hidden="true" />;
export const PanelSeparator = () => <div className="dui-panel-separator" role="separator" />;

export interface PanelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconSource;
  label?: ReactNode;
  active?: boolean;
}

export const PanelButton = forwardRef<HTMLButtonElement, PanelButtonProps>(function PanelButton(
  { icon, label, active, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type="button" className={cx('dui-panel-button', active && 'is-active', className)} {...rest}>
      {icon !== undefined && <AppIcon icon={icon} size={18} />}
      {label !== undefined && <span className="dui-panel-button__label">{label}</span>}
      {children}
    </button>
  );
});

export interface PanelPopoverButtonProps extends Omit<PanelButtonProps, 'content'> {
  /** Popover content; receives a `close` callback. */
  content: (close: () => void) => ReactNode;
  popoverClassName?: string;
  align?: 'start' | 'center' | 'end';
}

/** Panel button that toggles a popover (calendar, app menu, tray widgets…). */
export function PanelPopoverButton({ content, popoverClassName, align, title, ...rest }: PanelPopoverButtonProps) {
  const { position } = usePanel();
  const popover = usePanelPopover();
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <PanelButton
        ref={anchor}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        active={popover.open}
        title={title}
        onClick={popover.toggle}
        {...rest}
      />
      {popover.open && (
        <Popover anchorRef={anchor} edge={position} onClose={popover.close} className={popoverClassName} align={align} label={typeof title === 'string' ? title : undefined}>
          {content(popover.close)}
        </Popover>
      )}
    </>
  );
}

export function SystemTray({ children }: { children?: ReactNode }) {
  return <div className="dui-tray">{children}</div>;
}

export function ShowDesktopButton() {
  const api = useDesktopController();
  const { labels } = useDesktopConfig();
  const active = useDesktopState((s) => !!s.showingDesktop, Object.is);
  return (
    <PanelButton icon={<DesktopIcon />} active={active} aria-pressed={active} aria-label={labels.showDesktop} title={labels.showDesktop} onClick={() => api.toggleShowDesktop()} />
  );
}

export function ColorSchemeToggle() {
  const api = useDesktopController();
  const { labels, resolvedScheme } = useDesktopConfig();
  const dark = resolvedScheme === 'dark';
  const label = dark ? labels.lightTheme : labels.darkTheme;
  return (
    <PanelButton
      icon={dark ? <SunIcon /> : <MoonIcon />}
      aria-label={label}
      title={label}
      onClick={() => api.setPreferences({ colorScheme: dark ? 'light' : 'dark' })}
    />
  );
}

export interface WorkspaceSwitcherProps {
  /** Render even with a single workspace. */
  alwaysShow?: boolean;
}

export function WorkspaceSwitcher({ alwaysShow }: WorkspaceSwitcherProps) {
  const api = useDesktopController();
  const { labels } = useDesktopConfig();
  const count = useDesktopState((s) => s.preferences.workspaces, Object.is);
  const active = useDesktopState((s) => s.activeWorkspace, Object.is);
  const perWorkspace = useDesktopState((s) => {
    const counts = Array.from({ length: s.preferences.workspaces }, () => 0);
    for (const w of Object.values(s.windows)) counts[w.workspace] = (counts[w.workspace] ?? 0) + 1;
    return counts;
  });
  if (count <= 1 && !alwaysShow) return null;
  const onWheel = (e: WheelEvent) => {
    const dir = Math.sign(e.deltaY || e.deltaX);
    if (dir) api.switchWorkspace((active + dir + count) % count);
  };
  return (
    <div className="dui-workspaces" role="group" aria-label={labels.workspace(active + 1)} onWheel={onWheel}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={cx('dui-workspaces__item', i === active && 'is-active')}
          aria-pressed={i === active}
          aria-label={labels.workspace(i + 1)}
          title={labels.workspace(i + 1)}
          onClick={() => api.switchWorkspace(i)}
        >
          <span className="dui-workspaces__num">{i + 1}</span>
          <span className="dui-workspaces__dots" aria-hidden="true">
            {Array.from({ length: Math.min(perWorkspace[i] ?? 0, 3) }, (_, d) => (
              <i key={d} />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

export interface WindowListProps {
  /** Show titles next to icons. Defaults to `true` on horizontal panels. */
  showLabels?: boolean;
  /** List windows from every workspace. */
  allWorkspaces?: boolean;
}

/** Task bar: one button per window. Click to focus/minimise, middle-click to close. */
export function WindowList({ showLabels, allWorkspaces }: WindowListProps) {
  const api = useDesktopController();
  const { labels } = useDesktopConfig();
  const { vertical } = usePanel();
  const compact = useDesktopState((s) => s.compact, Object.is);
  const ids = useDesktopState((s) =>
    Object.values(s.windows)
      .filter((w) => allWorkspaces || w.workspace === s.activeWorkspace)
      .map((w) => w.id),
  );
  const windows = useDesktopState((s) => s.windows, Object.is);
  const focusedId = useDesktopState((s) => s.focusedId, Object.is);
  const workspaces = useDesktopState((s) => s.preferences.workspaces, Object.is);
  const labelsOn = (showLabels ?? !vertical) && !compact;

  return (
    <div className={cx('dui-window-list', labelsOn && 'has-labels')} role="group">
      {ids.map((id) => {
        const w = windows[id];
        if (!w) return null;
        const active = focusedId === id && !w.minimized;
        return (
          <button
            key={id}
            type="button"
            className={cx('dui-window-list__item', active && 'is-active', w.minimized && 'is-minimized')}
            aria-pressed={active}
            title={w.title}
            onClick={() => api.activateWindow(id)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                void api.requestClose(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              api.openContextMenu(e.clientX, e.clientY, windowMenu(api, w, labels, workspaces));
            }}
          >
            <AppIcon icon={w.icon} size={18} />
            {labelsOn && <span className="dui-window-list__label">{w.title}</span>}
          </button>
        );
      })}
    </div>
  );
}
