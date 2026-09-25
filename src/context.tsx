import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import type { DesktopApi, DesktopController, DesktopState } from './store/desktop-store';
import { shallowEqual, useStoreSelector } from './store/store';
import type { DesktopLabels } from './i18n';
import type { AppDefinition, DesktopPreferences, DesktopShortcut, MenuEntry, WallpaperPreset, WindowState } from './types';

export type WindowButton = 'minimize' | 'maximize' | 'close';

export interface DesktopConfig {
  apps: AppDefinition[];
  shortcuts: DesktopShortcut[];
  wallpapers: WallpaperPreset[];
  labels: DesktopLabels;
  locale: string;
  windowButtons: WindowButton[];
  titleAlign: 'left' | 'center';
  iconsAlign: 'left' | 'right';
  openIconsWith: 'click' | 'doubleClick';
  settingsAppId: string | null;
  desktopMenu?: (defaults: MenuEntry[], api: DesktopApi) => MenuEntry[];
  resolvedScheme: 'light' | 'dark';
  rootRef: RefObject<HTMLDivElement>;
  overlayRef: RefObject<HTMLDivElement>;
  widgetLayerRef: RefObject<HTMLDivElement>;
}

export const DesktopContext = createContext<DesktopController | null>(null);
export const DesktopConfigContext = createContext<DesktopConfig | null>(null);
export const WindowContext = createContext<string | null>(null);

export function useDesktopController(): DesktopController {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error('[deskui] This hook must be used inside <Desktop>.');
  return ctx;
}

/** Imperative desktop API: open apps, manage windows, notify, change preferences… */
export function useDesktop(): DesktopApi {
  return useDesktopController();
}

/** Subscribe to a slice of desktop state. Object results are compared shallowly. */
export function useDesktopState<S>(selector: (state: DesktopState) => S, isEqual: (a: S, b: S) => boolean = shallowEqual): S {
  return useStoreSelector(useDesktopController().store, selector, isEqual);
}

export function usePreferences(): DesktopPreferences {
  return useDesktopState((s) => s.preferences, Object.is);
}

export function useDesktopConfig(): DesktopConfig {
  const ctx = useContext(DesktopConfigContext);
  if (!ctx) throw new Error('[deskui] This hook must be used inside <Desktop>.');
  return ctx;
}

export function useLabels(): DesktopLabels {
  return useDesktopConfig().labels;
}

export interface WindowHandle {
  id: string;
  state: WindowState;
  focused: boolean;
  args: unknown;
  close(): Promise<boolean>;
  minimize(): void;
  toggleMaximize(): void;
  focus(): void;
  setTitle(title: string): void;
}

/** Inside an app window: access and control the hosting window. */
export function useWindow<A = unknown>(): WindowHandle & { args: A } {
  const id = useContext(WindowContext);
  if (!id) throw new Error('[deskui] useWindow() must be used inside a window.');
  const api = useDesktopController();
  const state = useDesktopState((s) => s.windows[id], Object.is);
  const focused = useDesktopState((s) => s.focusedId === id, Object.is);
  // Stable callbacks, so they are safe in effect dependency lists.
  const actions = useMemo(
    () => ({
      close: () => api.requestClose(id),
      minimize: () => api.minimizeWindow(id),
      toggleMaximize: () => api.toggleMaximize(id),
      focus: () => api.focusWindow(id),
      setTitle: (title: string) => api.setWindowTitle(id, title),
    }),
    [api, id],
  );
  return useMemo(() => ({ id, state, focused, args: state?.args as A, ...actions }), [id, state, focused, actions]);
}

/**
 * Register a guard that runs before the window closes (title-bar button,
 * task-bar menu…). Return `false` (or a Promise resolving to it) to cancel.
 */
export function useCloseGuard(guard: () => boolean | Promise<boolean>): void {
  const id = useContext(WindowContext);
  const api = useDesktopController();
  const ref = useRef(guard);
  ref.current = guard;
  useEffect(() => {
    if (!id) return;
    api.setCloseGuard(id, () => ref.current());
    return () => api.setCloseGuard(id, null);
  }, [api, id]);
}

/** Returns an `onContextMenu` handler factory that opens a desktop-styled menu. */
export function useContextMenu() {
  const api = useDesktopController();
  return useCallback(
    (items: MenuEntry[] | (() => MenuEntry[])) => (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      api.openContextMenu(event.clientX, event.clientY, typeof items === 'function' ? items() : items);
    },
    [api],
  );
}
