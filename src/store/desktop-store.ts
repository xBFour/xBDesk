import type {
  AppDefinition,
  Bounds,
  DesktopNotification,
  DesktopSession,
  DesktopPreferences,
  MenuEntry,
  NotificationInput,
  OpenWindowOptions,
  Size,
  TileSide,
  Wallpaper,
  SavedWindow,
  WindowOptions,
  WindowState,
} from '../types';
import { createStore, type Store } from './store';
import { clamp, fitInto, keepReachable, uid } from '../utils';

export interface ContextMenuState {
  /** Client (viewport) coordinates. */
  x: number;
  y: number;
  items: MenuEntry[];
}

export interface DesktopState {
  windows: Record<string, WindowState>;
  /** Window ids, bottom → top. */
  stack: string[];
  focusedId: string | null;
  /** Zero-based. */
  activeWorkspace: number;
  preferences: DesktopPreferences;
  /** Size of the workspace area (screen minus panels). */
  viewport: Size;
  /** Narrow screens: windows are forced maximised. */
  compact: boolean;
  snapPreview: Bounds | null;
  contextMenu: ContextMenuState | null;
  notifications: DesktopNotification[];
  /** Ids minimised by "show desktop", restored on the next toggle. */
  showingDesktop: string[] | null;
  /** Id of the currently open panel popover (only one at a time). */
  openPopover: string | null;
}

export type OpenAppOptions = WindowOptions & { workspace?: number };
export type CloseGuard = () => boolean | Promise<boolean>;

/** Public, imperative API — available through `useDesktop()` or a `ref` on `<Desktop>`. */
export interface DesktopApi {
  getState(): DesktopState;
  subscribe(listener: () => void): () => void;

  getApps(): AppDefinition[];
  getApp(id: string): AppDefinition | undefined;
  openApp<A = unknown>(appId: string, args?: A, options?: OpenAppOptions): string | null;
  openWindow(options: OpenWindowOptions): string;

  /** Asks the window's close guard (if any) first. Resolves to `true` when closed. */
  requestClose(id: string): Promise<boolean>;
  /** Closes immediately, bypassing close guards. */
  closeWindow(id: string): void;
  focusWindow(id: string): void;
  minimizeWindow(id: string): void;
  restoreWindow(id: string): void;
  maximizeWindow(id: string): void;
  toggleMaximize(id: string): void;
  tileWindow(id: string, side: TileSide | null): void;
  setWindowBounds(id: string, bounds: Bounds): void;
  setWindowTitle(id: string, title: string): void;
  moveWindowToWorkspace(id: string, workspace: number): void;
  /** Remounts the window content. */
  reloadWindow(id: string): void;
  /** Task-bar semantics: minimise when focused, otherwise restore and focus. */
  activateWindow(id: string): void;
  /** Arguments to reopen this window with after a page reload (defaults to its launch args). */
  setRestoreArgs(id: string, args: unknown): void;

  /** Snapshot of the open app windows (what gets persisted between reloads). */
  getSession(): DesktopSession;
  /** Reopens the windows of a snapshot; windows of unknown apps are skipped. */
  restoreSession(session: DesktopSession | null | undefined): void;

  switchWorkspace(workspace: number): void;
  toggleShowDesktop(): void;

  setPreferences(patch: Partial<DesktopPreferences> | ((prev: DesktopPreferences) => Partial<DesktopPreferences>)): void;
  setWallpaper(wallpaper: Wallpaper): void;
  arrangeIcons(): void;

  openContextMenu(x: number, y: number, items: MenuEntry[]): void;
  closeContextMenu(): void;

  notify(notification: NotificationInput): string;
  dismissNotification(id: string): void;
}

/** Internal controller: the public API plus hooks used by the kit's own components. */
export interface DesktopController extends DesktopApi {
  store: Store<DesktopState>;
  setApps(apps: AppDefinition[]): void;
  setViewport(size: Size, compact: boolean): void;
  setSnapPreview(bounds: Bounds | null): void;
  setOpenPopover(id: string | null): void;
  setCloseGuard(windowId: string, guard: CloseGuard | null): void;
}

export const DEFAULT_PREFERENCES: DesktopPreferences = {
  wallpaper: { type: 'gradient', value: 'linear-gradient(135deg, #1d2b64 0%, #3a4f9a 55%, #7a8fd0 100%)' },
  colorScheme: 'auto',
  accentColor: '#3584e4',
  iconSize: 'medium',
  panelPosition: 'bottom',
  buttonSide: 'right',
  buttonStyle: 'icons',
  workspaces: 1,
  iconPositions: {},
  appBounds: {},
};

const CASCADE = 28;
const MAX_NOTIFICATIONS = 5;

function topVisible(s: DesktopState, workspace = s.activeWorkspace, exclude?: string): string | null {
  for (let i = s.stack.length - 1; i >= 0; i--) {
    const w = s.windows[s.stack[i]];
    if (w && w.id !== exclude && !w.minimized && w.workspace === workspace) return w.id;
  }
  return null;
}

function raise(stack: string[], id: string): string[] {
  return [...stack.filter((x) => x !== id), id];
}

const INVALID = Symbol('invalid');

/** JSON round-trip; windows whose args cannot be stored are left out of the session. */
function storable(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return INVALID;
  }
}

function validBounds(b: unknown): Bounds | null {
  const o = b as Partial<Bounds> | null;
  if (!o || ![o.x, o.y, o.width, o.height].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  return { x: o.x!, y: o.y!, width: Math.max(1, o.width!), height: Math.max(1, o.height!) };
}

function fallbackViewport(): Size {
  if (typeof window === 'undefined') return { width: 1280, height: 720 };
  return { width: window.innerWidth, height: window.innerHeight - 48 };
}

export function createDesktopController(initialPreferences: DesktopPreferences): DesktopController {
  const store = createStore<DesktopState>({
    windows: {},
    stack: [],
    focusedId: null,
    activeWorkspace: 0,
    preferences: initialPreferences,
    viewport: { width: 0, height: 0 },
    compact: false,
    snapPreview: null,
    contextMenu: null,
    notifications: [],
    showingDesktop: null,
    openPopover: null,
  });

  let apps: AppDefinition[] = [];
  let appMap = new Map<string, AppDefinition>();
  const closeGuards = new Map<string, CloseGuard>();
  const pendingCloses = new Map<string, Promise<boolean>>();

  const updateWindow = (id: string, patch: Partial<WindowState> | ((w: WindowState) => Partial<WindowState>)) => {
    store.set((s) => {
      const w = s.windows[id];
      if (!w) return null;
      const p = typeof patch === 'function' ? patch(w) : patch;
      return { windows: { ...s.windows, [id]: { ...w, ...p } } };
    });
  };

  const rememberBounds = (w: WindowState) => {
    if (!w.appId) return;
    const appId = w.appId;
    store.set((s) => ({
      preferences: { ...s.preferences, appBounds: { ...s.preferences.appBounds, [appId]: w.bounds } },
    }));
  };

  const createWindow = (
    base: Pick<WindowState, 'appId' | 'title' | 'icon' | 'args' | 'content'>,
    opts: OpenAppOptions,
  ): string => {
    const s = store.get();
    const vp = s.viewport.width ? s.viewport : fallbackViewport();
    const remembered = base.appId ? s.preferences.appBounds[base.appId] : undefined;
    const siblings = Object.values(s.windows).filter((w) => w.appId && w.appId === base.appId).length;
    const size = fitInto(
      {
        width: remembered?.width ?? opts.width ?? 720,
        height: remembered?.height ?? opts.height ?? 480,
      },
      vp,
    );
    let x: number;
    let y: number;
    if (opts.x != null && opts.y != null) {
      x = opts.x;
      y = opts.y;
    } else if (remembered && siblings === 0) {
      x = remembered.x;
      y = remembered.y;
    } else {
      const workspace = opts.workspace ?? s.activeWorkspace;
      const visible = Object.values(s.windows).filter((w) => !w.minimized && w.workspace === workspace).length;
      const offset = (visible % 6) * CASCADE;
      x = Math.round((vp.width - size.width) / 2) - CASCADE * 2 + offset;
      y = Math.round(Math.max(0, (vp.height - size.height) / 2 - 24)) + offset;
    }
    const id = uid('win');
    const win: WindowState = {
      id,
      ...base,
      bounds: keepReachable({ x, y, ...size }, vp),
      maximized: !!opts.maximized,
      minimized: false,
      tiled: null,
      workspace: clamp(opts.workspace ?? s.activeWorkspace, 0, s.preferences.workspaces - 1),
      resizable: opts.resizable !== false,
      minimizable: opts.minimizable !== false,
      maximizable: opts.maximizable !== false,
      minWidth: opts.minWidth ?? 240,
      minHeight: opts.minHeight ?? 160,
      className: opts.className,
      bare: !!opts.bare,
      generation: 0,
    };
    store.set((st) => ({
      windows: { ...st.windows, [id]: win },
      stack: [...st.stack, id],
      focusedId: win.workspace === st.activeWorkspace ? id : st.focusedId,
      showingDesktop: null,
    }));
    return id;
  };

  const api: DesktopController = {
    store,
    getState: store.get,
    subscribe: store.subscribe,

    getApps: () => apps,
    getApp: (id) => appMap.get(id),

    setApps(next) {
      apps = next;
      appMap = new Map(next.map((a) => [a.id, a]));
    },

    setViewport(size, compact) {
      const s = store.get();
      if (s.viewport.width === size.width && s.viewport.height === size.height && s.compact === compact) return;
      store.set({ viewport: size, compact });
    },

    setSnapPreview(bounds) {
      store.set({ snapPreview: bounds });
    },

    setOpenPopover(id) {
      if (store.get().openPopover === id) return;
      store.set({ openPopover: id, contextMenu: null });
    },

    setCloseGuard(windowId, guard) {
      if (guard) closeGuards.set(windowId, guard);
      else closeGuards.delete(windowId);
    },

    openApp(appId, args, options = {}) {
      const app = appMap.get(appId);
      if (!app) {
        console.warn(`[xBDesk] Unknown app "${appId}"`);
        return null;
      }
      if (app.singleInstance !== false) {
        const existing = Object.values(store.get().windows).find((w) => w.appId === appId);
        if (existing) {
          if (args !== undefined) updateWindow(existing.id, { args });
          api.focusWindow(existing.id);
          return existing.id;
        }
      }
      return createWindow(
        { appId, title: app.title, icon: app.icon, args, content: undefined },
        { ...app.window, ...options },
      );
    },

    openWindow(options) {
      const { title, icon, content, ...rest } = options;
      return createWindow({ appId: null, title, icon, content, args: undefined }, rest);
    },

    requestClose(id) {
      // Clicking close again while a guard is still asking returns the same answer.
      const inFlight = pendingCloses.get(id);
      if (inFlight) return inFlight;
      const guard = closeGuards.get(id);
      if (!guard) {
        api.closeWindow(id);
        return Promise.resolve(true);
      }
      const p = Promise.resolve()
        .then(guard)
        .then((ok) => {
          if (ok) api.closeWindow(id);
          return !!ok;
        })
        .finally(() => pendingCloses.delete(id));
      pendingCloses.set(id, p);
      return p;
    },

    closeWindow(id) {
      const w = store.get().windows[id];
      if (!w) return;
      rememberBounds(w);
      closeGuards.delete(id);
      store.set((s) => {
        const windows = { ...s.windows };
        delete windows[id];
        const next = { ...s, windows, stack: s.stack.filter((x) => x !== id) };
        return {
          windows,
          stack: next.stack,
          focusedId: s.focusedId === id ? topVisible(next) : s.focusedId,
        };
      });
    },

    focusWindow(id) {
      const s = store.get();
      const w = s.windows[id];
      if (!w) return;
      const needsSwitch = w.workspace !== s.activeWorkspace;
      if (s.focusedId === id && !w.minimized && !needsSwitch && s.stack[s.stack.length - 1] === id) return;
      store.set((st) => ({
        windows: w.minimized ? { ...st.windows, [id]: { ...w, minimized: false } } : st.windows,
        stack: raise(st.stack, id),
        focusedId: id,
        activeWorkspace: w.workspace,
        showingDesktop: null,
      }));
    },

    minimizeWindow(id) {
      store.set((s) => {
        const w = s.windows[id];
        if (!w || w.minimized) return null;
        const windows = { ...s.windows, [id]: { ...w, minimized: true } };
        return {
          windows,
          focusedId: s.focusedId === id ? topVisible({ ...s, windows }, s.activeWorkspace, id) : s.focusedId,
        };
      });
    },

    restoreWindow(id) {
      const w = store.get().windows[id];
      if (!w) return;
      if (w.maximized) updateWindow(id, { maximized: false });
      api.focusWindow(id);
    },

    maximizeWindow(id) {
      updateWindow(id, (w) => (w.maximizable ? { maximized: true } : {}));
    },

    toggleMaximize(id) {
      updateWindow(id, (w) => (w.maximizable ? { maximized: !w.maximized } : {}));
    },

    tileWindow(id, side) {
      updateWindow(id, (w) => (w.resizable || side === null ? { tiled: side, maximized: false } : {}));
    },

    setWindowBounds(id, bounds) {
      updateWindow(id, (w) => ({
        bounds: {
          x: Math.round(bounds.x),
          y: Math.round(bounds.y),
          width: Math.round(Math.max(w.minWidth, bounds.width)),
          height: Math.round(Math.max(w.minHeight, bounds.height)),
        },
        tiled: null,
        maximized: false,
      }));
    },

    setWindowTitle(id, title) {
      updateWindow(id, (w) => (w.title === title ? {} : { title }));
    },

    moveWindowToWorkspace(id, workspace) {
      store.set((s) => {
        const w = s.windows[id];
        if (!w) return null;
        const ws = clamp(workspace, 0, s.preferences.workspaces - 1);
        const windows = { ...s.windows, [id]: { ...w, workspace: ws } };
        return {
          windows,
          focusedId: s.focusedId === id && ws !== s.activeWorkspace ? topVisible({ ...s, windows }) : s.focusedId,
        };
      });
    },

    reloadWindow(id) {
      updateWindow(id, (w) => ({ generation: w.generation + 1 }));
    },

    activateWindow(id) {
      const s = store.get();
      const w = s.windows[id];
      if (!w) return;
      if (s.focusedId === id && !w.minimized && w.workspace === s.activeWorkspace) {
        if (w.minimizable) api.minimizeWindow(id);
      } else {
        api.focusWindow(id);
      }
    },

    setRestoreArgs(id, args) {
      const w = store.get().windows[id];
      if (!w) return;
      const next = storable(args);
      if (next === INVALID || JSON.stringify(next) === JSON.stringify(w.restoreArgs)) return;
      updateWindow(id, { restoreArgs: next });
    },

    getSession() {
      const s = store.get();
      const windows: SavedWindow[] = [];
      let focused: number | null = null;
      for (const id of s.stack) {
        const w = s.windows[id];
        if (!w || !w.appId) continue; // ad-hoc windows carry React content and cannot be restored
        const args = storable(w.restoreArgs !== undefined ? w.restoreArgs : w.args);
        if (args === INVALID) continue;
        if (id === s.focusedId) focused = windows.length;
        windows.push({
          appId: w.appId,
          args,
          title: w.title,
          bounds: w.bounds,
          maximized: w.maximized,
          minimized: w.minimized,
          tiled: w.tiled,
          workspace: w.workspace,
        });
      }
      return { version: 1, windows, focused, activeWorkspace: s.activeWorkspace };
    },

    restoreSession(session) {
      if (!session || session.version !== 1 || !Array.isArray(session.windows)) return;
      const s = store.get();
      const last = s.preferences.workspaces - 1;
      const windows = { ...s.windows };
      const stack = [...s.stack];
      let focusedId: string | null = null;
      session.windows.forEach((saved, index) => {
        const app = saved && appMap.get(saved.appId);
        if (!app) return; // app removed, or no longer permitted
        if (app.singleInstance !== false && Object.values(windows).some((w) => w.appId === app.id)) return;
        const opts = app.window ?? {};
        const vp = s.viewport.width ? s.viewport : fallbackViewport();
        const size = fitInto({ width: opts.width ?? 720, height: opts.height ?? 480 }, vp);
        const id = uid('win');
        windows[id] = {
          id,
          appId: app.id,
          title: typeof saved.title === 'string' && saved.title ? saved.title : app.title,
          icon: app.icon,
          args: saved.args,
          restoreArgs: saved.args,
          content: undefined,
          bounds: validBounds(saved.bounds) ?? { x: Math.round((vp.width - size.width) / 2), y: 24, ...size },
          maximized: !!saved.maximized,
          minimized: !!saved.minimized,
          tiled: saved.tiled === 'left' || saved.tiled === 'right' ? saved.tiled : null,
          workspace: clamp(Math.round(Number(saved.workspace) || 0), 0, last),
          resizable: opts.resizable !== false,
          minimizable: opts.minimizable !== false,
          maximizable: opts.maximizable !== false,
          minWidth: opts.minWidth ?? 240,
          minHeight: opts.minHeight ?? 160,
          className: opts.className,
          bare: !!opts.bare,
          generation: 0,
        };
        stack.push(id);
        if (session.focused === index) focusedId = id;
      });
      const activeWorkspace = clamp(Math.round(Number(session.activeWorkspace) || 0), 0, last);
      const next = { ...s, windows, stack, activeWorkspace };
      const f = focusedId ? windows[focusedId] : null;
      if (!f || f.minimized || f.workspace !== activeWorkspace) focusedId = topVisible(next);
      store.set({ windows, stack, activeWorkspace, focusedId });
    },

    switchWorkspace(workspace) {
      store.set((s) => {
        const ws = clamp(workspace, 0, s.preferences.workspaces - 1);
        if (ws === s.activeWorkspace) return null;
        const next = { ...s, activeWorkspace: ws };
        return { activeWorkspace: ws, focusedId: topVisible(next), showingDesktop: null, contextMenu: null };
      });
    },

    toggleShowDesktop() {
      store.set((s) => {
        if (s.showingDesktop) {
          const windows = { ...s.windows };
          for (const id of s.showingDesktop) {
            if (windows[id]?.minimized) windows[id] = { ...windows[id], minimized: false };
          }
          const next = { ...s, windows };
          return { windows, showingDesktop: null, focusedId: topVisible(next) };
        }
        const ids = Object.values(s.windows)
          .filter((w) => !w.minimized && w.workspace === s.activeWorkspace)
          .map((w) => w.id);
        if (!ids.length) return null;
        const windows = { ...s.windows };
        for (const id of ids) windows[id] = { ...windows[id], minimized: true };
        return { windows, showingDesktop: ids, focusedId: null };
      });
    },

    setPreferences(patch) {
      store.set((s) => {
        const p = typeof patch === 'function' ? patch(s.preferences) : patch;
        const preferences = { ...s.preferences, ...p };
        preferences.workspaces = clamp(Math.round(preferences.workspaces || 1), 1, 12);
        if (preferences.workspaces === s.preferences.workspaces) return { preferences };
        const last = preferences.workspaces - 1;
        const windows: Record<string, WindowState> = {};
        for (const w of Object.values(s.windows)) {
          windows[w.id] = w.workspace > last ? { ...w, workspace: last } : w;
        }
        const activeWorkspace = Math.min(s.activeWorkspace, last);
        return { preferences, windows, activeWorkspace };
      });
    },

    setWallpaper(wallpaper) {
      api.setPreferences({ wallpaper });
    },

    arrangeIcons() {
      api.setPreferences({ iconPositions: {} });
    },

    openContextMenu(x, y, items) {
      store.set({ contextMenu: { x, y, items }, openPopover: null });
    },

    closeContextMenu() {
      if (store.get().contextMenu) store.set({ contextMenu: null });
    },

    notify(input) {
      const id = uid('ntf');
      const n: DesktopNotification = { timeout: 5000, ...input, id, createdAt: Date.now() };
      store.set((s) => ({ notifications: [...s.notifications, n].slice(-MAX_NOTIFICATIONS) }));
      return id;
    },

    dismissNotification(id) {
      store.set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    },
  };

  return api;
}
