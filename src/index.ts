import './styles/xbdesk.css';

export { Desktop, DefaultPanel, type DesktopProps } from './components/Desktop';
export {
  Panel,
  PanelButton,
  PanelPopoverButton,
  PanelSpacer,
  PanelSeparator,
  SystemTray,
  ShowDesktopButton,
  ColorSchemeToggle,
  WorkspaceSwitcher,
  WindowList,
  usePanel,
  type PanelProps,
  type PanelButtonProps,
  type PanelPopoverButtonProps,
  type WorkspaceSwitcherProps,
  type WindowListProps,
} from './components/Panel';
export { AppMenu, AppMenuButton, type AppMenuButtonProps } from './components/AppMenu';
export { Clock, Calendar, useNow, type ClockProps, type CalendarProps } from './components/Clock';
export { DesktopWidget, type DesktopWidgetProps } from './components/Notifications';
export { Popover, usePanelPopover, type PopoverProps } from './components/Popover';
export { MenuList, type MenuListProps } from './components/Menu';
export { AppIcon, type AppIconProps } from './components/AppIcon';
export * as Icons from './components/icons';
export { createSettingsApp, type SettingsAppOptions, type SettingsSection } from './apps/SettingsApp';

export {
  useDesktop,
  useDesktopState,
  usePreferences,
  useLabels,
  useResolvedColorScheme,
  useWindow,
  useCloseGuard,
  useContextMenu,
  type WindowHandle,
  type WindowButton,
} from './context';
export { DEFAULT_PREFERENCES, type DesktopApi, type DesktopState, type OpenAppOptions } from './store/desktop-store';
export { localStorageAdapter } from './storage';
export { locales, resolveLabels, type DesktopLabels, type LabelOverrides } from './i18n';
export { ACCENT_COLORS, type ThemeTokens, type ThemeTokenOverrides } from './theme';
export type * from './types';

/** Type helper for app definitions with typed launch arguments. */
export function defineApp<A = unknown>(app: import('./types').AppDefinition<A>): import('./types').AppDefinition<A> {
  return app;
}
