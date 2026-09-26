import type { ComponentType, ReactNode } from 'react';

/** A React node, or a string treated as an image URL. */
export type IconSource = ReactNode | string;

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GridCell {
  col: number;
  row: number;
}

/* ------------------------------------------------------------------ */
/* Apps & windows                                                      */
/* ------------------------------------------------------------------ */

export interface WindowOptions {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  /** Initial position; centred (with cascade) when omitted. */
  x?: number;
  y?: number;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  /** Open maximised. */
  maximized?: boolean;
  /** Extra class on the window element. */
  className?: string;
  /** Remove the default padding/scroll container around content. */
  bare?: boolean;
}

/** Props every app component receives. Existing components may ignore them. */
export interface AppComponentProps<A = any> {
  windowId: string;
  args: A;
}

export interface AppDefinition<A = any> {
  id: string;
  title: string;
  icon?: IconSource;
  /** May be a `React.lazy` component — windows render inside Suspense. */
  component: ComponentType<AppComponentProps<A>>;
  description?: string;
  category?: string;
  keywords?: string[];
  window?: WindowOptions;
  /** Focus the existing window instead of opening a new one. Default `true`. */
  singleInstance?: boolean;
  /**
   * Own desktop icon. By default the app gets one unless a folder or a shortcut
   * (without `args`) already points to it. `true` always shows it, `false` never.
   */
  showOnDesktop?: boolean;
  /** Default `true`. */
  showInMenu?: boolean;
}

export interface OpenWindowOptions extends WindowOptions {
  title: string;
  icon?: IconSource;
  /** Ad-hoc content for windows not backed by a registered app. */
  content: ReactNode | (() => ReactNode);
  workspace?: number;
}

export type TileSide = 'left' | 'right';

export interface WindowState {
  id: string;
  /** Registered app id, or `null` for ad-hoc windows. */
  appId: string | null;
  title: string;
  icon?: IconSource;
  args?: unknown;
  content?: ReactNode | (() => ReactNode);
  /** Normal (restored) bounds, relative to the workspace. */
  bounds: Bounds;
  maximized: boolean;
  minimized: boolean;
  tiled: TileSide | null;
  workspace: number;
  resizable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  minWidth: number;
  minHeight: number;
  className?: string;
  bare: boolean;
  /** Incremented to force-remount the content (e.g. after a crash). */
  generation: number;
  /** Arguments used to reopen this window after a page reload; defaults to `args`. */
  restoreArgs?: unknown;
}

/* ------------------------------------------------------------------ */
/* Desktop items                                                       */
/* ------------------------------------------------------------------ */

export interface DesktopShortcut {
  id: string;
  title: string;
  /** Folders without an icon show a preview of their first four items. */
  icon?: IconSource;
  /** Opens this app (with `args`) when activated. */
  appId?: string;
  args?: unknown;
  /** Custom activation handler; takes precedence over `appId`. */
  onOpen?: () => void;
  /** Makes this a folder (group): items open from a folder window. Strings are app ids. */
  items?: Array<string | DesktopShortcut>;
  /** Folder tint. */
  color?: string;
}

/* ------------------------------------------------------------------ */
/* Wallpaper                                                           */
/* ------------------------------------------------------------------ */

export type WallpaperFit = 'cover' | 'contain' | 'fill' | 'center' | 'tile';

export type Wallpaper =
  | { type: 'image'; src: string; fit?: WallpaperFit; color?: string }
  | { type: 'color'; color: string }
  | { type: 'gradient'; value: string }
  /** Anything React can render — video, canvas, animated scenes. Not persistable on its own; use it via a preset. */
  | { type: 'custom'; render: () => ReactNode }
  /** Reference to an entry of `Desktop.wallpapers` (persistable form of any wallpaper). */
  | { type: 'preset'; id: string };

export interface WallpaperPreset {
  id: string;
  name: string;
  wallpaper: Exclude<Wallpaper, { type: 'preset' }>;
  /** Thumbnail URL for the picker; derived from the wallpaper when omitted. */
  thumbnail?: string;
}

/* ------------------------------------------------------------------ */
/* Preferences (user-changeable, persisted)                            */
/* ------------------------------------------------------------------ */

export type ColorScheme = 'light' | 'dark' | 'auto';
export type IconSize = 'small' | 'medium' | 'large';
export type PanelPosition = 'top' | 'bottom' | 'left' | 'right';
export type ButtonSide = 'left' | 'right';
export type ButtonStyle = 'icons' | 'dots';

export interface DesktopPreferences {
  wallpaper: Wallpaper;
  colorScheme: ColorScheme;
  accentColor: string;
  iconSize: IconSize;
  /** Default position for panels that don't set one explicitly. */
  panelPosition: PanelPosition;
  buttonSide: ButtonSide;
  buttonStyle: ButtonStyle;
  workspaces: number;
  /** Desktop icon positions, keyed by item id. */
  iconPositions: Record<string, GridCell>;
  /** Last normal bounds per app id, reused when the app is opened again. */
  appBounds: Record<string, Bounds>;
}

/** A window as stored in a session snapshot. */
export interface SavedWindow {
  appId: string;
  args?: unknown;
  title: string;
  bounds: Bounds;
  maximized: boolean;
  minimized: boolean;
  tiled: TileSide | null;
  workspace: number;
}

/** Open windows, so they survive a page reload. Only app-backed windows are kept. */
export interface DesktopSession {
  version: 1;
  /** Bottom → top. */
  windows: SavedWindow[];
  /** Index in `windows` of the focused window. */
  focused: number | null;
  activeWorkspace: number;
}

type MaybePromise<T> = T | Promise<T>;

export interface DesktopStorage {
  load(): MaybePromise<Partial<DesktopPreferences> | null | undefined>;
  save(preferences: DesktopPreferences): void | Promise<void>;
  /** Optional: enables restoring open windows after a reload. */
  loadSession?(): MaybePromise<DesktopSession | null | undefined>;
  saveSession?(session: DesktopSession): void | Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Menus & notifications                                               */
/* ------------------------------------------------------------------ */

export interface MenuActionItem {
  type?: 'item';
  id?: string;
  label: ReactNode;
  icon?: IconSource;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  danger?: boolean;
  onSelect?: () => void;
  /** Sub-menu entries. */
  items?: MenuEntry[];
}

export interface MenuSeparator {
  type: 'separator';
}

export interface MenuLabel {
  type: 'label';
  label: ReactNode;
}

export type MenuEntry = MenuActionItem | MenuSeparator | MenuLabel;

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationInput {
  title: string;
  body?: ReactNode;
  icon?: IconSource;
  /** Milliseconds; `0` keeps it until dismissed. Default 5000. */
  timeout?: number;
  actions?: NotificationAction[];
}

export interface DesktopNotification extends NotificationInput {
  id: string;
  createdAt: number;
}
