import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { DesktopConfigContext, DesktopContext, useDesktopConfig, useDesktopController, type DesktopConfig, type WindowButton } from '../context';
import { detectLocale, resolveLabels, type LabelOverrides } from '../i18n';
import { createDesktopController, DEFAULT_PREFERENCES, type DesktopApi } from '../store/desktop-store';
import { useStoreSelector } from '../store/store';
import { localStorageAdapter, sanitizeLoaded } from '../storage';
import { themeStyle, type ThemeTokenOverrides } from '../theme';
import type { AppDefinition, DesktopPreferences, DesktopShortcut, DesktopStorage, MenuEntry, WallpaperPreset } from '../types';
import { cx, isTypingTarget } from '../utils';
import { AppMenuButton } from './AppMenu';
import { Clock } from './Clock';
import { DesktopIcons } from './DesktopIcons';
import { ContextMenuHost } from './Menu';
import { Notifications } from './Notifications';
import { ColorSchemeToggle, Panel, ShowDesktopButton, SystemTray, WindowList, WorkspaceSwitcher } from './Panel';
import { Wallpaper } from './Wallpaper';
import { WindowLayer } from './Window';

export interface DesktopProps {
  /** Registered applications (desktop icons, app menu, windows). */
  apps?: AppDefinition[];
  /** Extra desktop icons that are not apps (or open an app with arguments). */
  shortcuts?: DesktopShortcut[];
  /** Wallpapers offered by the settings app; referenced as `{ type: 'preset', id }`. */
  wallpapers?: WallpaperPreset[];
  /** Initial preferences; persisted values take precedence. */
  defaultPreferences?: Partial<DesktopPreferences>;
  /** Custom persistence (e.g. a per-user API). May load asynchronously. */
  storage?: DesktopStorage;
  /** Shorthand for `storage={localStorageAdapter(persistKey)}`. */
  persistKey?: string;
  onPreferencesChange?: (preferences: DesktopPreferences) => void;
  /** BCP 47 locale for built-in labels and dates. Defaults to the browser language. */
  locale?: string;
  labels?: LabelOverrides;
  /** Theme token overrides, applied as CSS custom properties. */
  tokens?: ThemeTokenOverrides;
  /** Title-bar button order. Default `['minimize', 'maximize', 'close']`. */
  windowButtons?: WindowButton[];
  titleAlign?: 'left' | 'center';
  iconsAlign?: 'left' | 'right';
  openIconsWith?: 'click' | 'doubleClick';
  /** App opened by "Change wallpaper…". Default `'settings'`; `null` hides the entry. */
  settingsAppId?: string | null;
  /** Customise the desktop right-click menu. */
  desktopMenu?: (defaults: MenuEntry[], api: DesktopApi) => MenuEntry[];
  showIcons?: boolean;
  /** Below this workspace width windows are always maximised. Default 640. */
  compactBreakpoint?: number;
  /** Ctrl+Alt+←/→ switches workspaces. Default `true`. */
  keyboardShortcuts?: boolean;
  /** Cover the viewport (`position: fixed`) instead of filling the parent. */
  fullscreen?: boolean;
  className?: string;
  style?: CSSProperties;
  onReady?: (api: DesktopApi) => void;
  /** Panels and `<DesktopWidget>`s. A default bottom panel is used when omitted. */
  children?: ReactNode;
}

const EMPTY: never[] = [];
const DEFAULT_BUTTONS: WindowButton[] = ['minimize', 'maximize', 'close'];

function usePrefersDark(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false),
    () => false,
  );
}

/** The panel used when `<Desktop>` has no children. */
export function DefaultPanel() {
  return (
    <Panel>
      <AppMenuButton />
      <WindowList />
      <WorkspaceSwitcher />
      <SystemTray>
        <ColorSchemeToggle />
      </SystemTray>
      <Clock showDate />
      <ShowDesktopButton />
    </Panel>
  );
}

function Workspace({ showIcons, compactBreakpoint }: { showIcons: boolean; compactBreakpoint: number }) {
  const api = useDesktopController();
  const { widgetLayerRef } = useDesktopConfig();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      api.setViewport({ width, height }, width < compactBreakpoint);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [api, compactBreakpoint]);

  return (
    <div ref={ref} className="xbd-workspace">
      {showIcons && <DesktopIcons />}
      <div ref={widgetLayerRef} className="xbd-widgets" />
      <WindowLayer />
      <Notifications />
    </div>
  );
}

/**
 * Root of the kit: wallpaper, panels, desktop icons, window manager, menus and
 * notifications. Pass a `ref` to control it imperatively (`ref.current.openApp('files')`).
 */
export const Desktop = forwardRef<DesktopApi, DesktopProps>(function Desktop(props, ref) {
  const {
    apps = EMPTY,
    shortcuts = EMPTY,
    wallpapers = EMPTY,
    defaultPreferences,
    storage: storageProp,
    persistKey,
    onPreferencesChange,
    locale: localeProp,
    labels: labelOverrides,
    tokens,
    windowButtons = DEFAULT_BUTTONS,
    titleAlign = 'center',
    iconsAlign = 'left',
    openIconsWith = 'doubleClick',
    settingsAppId = 'settings',
    desktopMenu,
    showIcons = true,
    compactBreakpoint = 640,
    keyboardShortcuts = true,
    fullscreen,
    className,
    style,
    onReady,
    children,
  } = props;

  const storage = useMemo(() => storageProp ?? (persistKey ? localStorageAdapter(persistKey) : null), [storageProp, persistKey]);

  const [boot] = useState(() => {
    const loaded = storage?.load();
    const pending = loaded && typeof (loaded as Promise<unknown>).then === 'function' ? (loaded as Promise<Partial<DesktopPreferences>>) : null;
    const initial = { ...DEFAULT_PREFERENCES, ...defaultPreferences, ...(pending ? {} : sanitizeLoaded(loaded as Partial<DesktopPreferences>)) };
    return { controller: createDesktopController(initial), pending };
  });
  const controller = boot.controller;
  // Synchronous so apps are known before any child or parent effect calls openApp().
  controller.setApps(apps);

  const readyToSave = useRef(!boot.pending);
  useEffect(() => {
    if (!boot.pending) return;
    let cancelled = false;
    boot.pending
      .then((p) => {
        if (cancelled) return;
        controller.setPreferences(sanitizeLoaded(p));
        readyToSave.current = true;
      })
      .catch((err) => {
        console.warn('[xBDesk] Could not load preferences:', err);
        readyToSave.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [boot, controller]);

  const onChangeRef = useRef(onPreferencesChange);
  onChangeRef.current = onPreferencesChange;
  useEffect(() => {
    let last = controller.getState().preferences;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: DesktopPreferences | null = null;
    const flush = () => {
      if (pending && storage) void storage.save(pending);
      pending = null;
    };
    const unsubscribe = controller.subscribe(() => {
      const p = controller.getState().preferences;
      if (p === last) return;
      last = p;
      onChangeRef.current?.(p);
      if (!storage || !readyToSave.current) return;
      pending = p;
      clearTimeout(timer);
      timer = setTimeout(flush, 250);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
      flush();
    };
  }, [controller, storage]);

  useImperativeHandle(ref, () => controller, [controller]);

  useEffect(() => {
    onReady?.(controller);
    // Fire once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorScheme = useStoreSelector(controller.store, (s) => s.preferences.colorScheme);
  const accentColor = useStoreSelector(controller.store, (s) => s.preferences.accentColor);
  const buttonStyle = useStoreSelector(controller.store, (s) => s.preferences.buttonStyle);
  const compact = useStoreSelector(controller.store, (s) => s.compact);
  const prefersDark = usePrefersDark();
  const resolvedScheme = colorScheme === 'auto' ? (prefersDark ? 'dark' : 'light') : colorScheme;

  const locale = localeProp ?? detectLocale();
  const labels = useMemo(() => resolveLabels(locale, labelOverrides), [locale, labelOverrides]);

  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const widgetLayerRef = useRef<HTMLDivElement>(null);

  const config = useMemo<DesktopConfig>(
    () => ({
      apps,
      shortcuts,
      wallpapers,
      labels,
      locale,
      windowButtons,
      titleAlign,
      iconsAlign,
      openIconsWith,
      settingsAppId,
      desktopMenu,
      resolvedScheme,
      rootRef,
      overlayRef,
      widgetLayerRef,
    }),
    [apps, shortcuts, wallpapers, labels, locale, windowButtons, titleAlign, iconsAlign, openIconsWith, settingsAppId, desktopMenu, resolvedScheme],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (!keyboardShortcuts || isTypingTarget(e.target)) return;
    if (e.ctrlKey && e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const s = controller.getState();
      const n = s.preferences.workspaces;
      controller.switchWorkspace((s.activeWorkspace + (e.key === 'ArrowRight' ? 1 : -1) + n) % n);
    }
  };

  return (
    <DesktopContext.Provider value={controller}>
      <DesktopConfigContext.Provider value={config}>
        <div
          ref={rootRef}
          className={cx(
            'xbd-root',
            `xbd-root--${resolvedScheme}`,
            `xbd-root--buttons-${buttonStyle}`,
            compact && 'xbd-root--compact',
            fullscreen && 'xbd-root--fullscreen',
            className,
          )}
          data-scheme={resolvedScheme}
          style={{ ...themeStyle(accentColor, tokens), ...style }}
          onKeyDown={onKeyDown}
        >
          <Wallpaper />
          <div className="xbd-shell">
            {children ?? <DefaultPanel />}
            <Workspace showIcons={showIcons} compactBreakpoint={compactBreakpoint} />
          </div>
          <div ref={overlayRef} className="xbd-overlay" />
          <ContextMenuHost />
        </div>
      </DesktopConfigContext.Provider>
    </DesktopContext.Provider>
  );
});
