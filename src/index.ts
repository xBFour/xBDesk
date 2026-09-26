import './styles/xbdesk.css';
import './styles/components.css';

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
export { FolderGlyph, openShortcut, openFolder, FOLDER_APP_ID } from './components/Folder';

// Component library
export { ThemeScope, Portal, useUiLabels, type ThemeScopeProps, type PortalScope } from './ui/shared';
export {
  Button,
  IconButton,
  Badge,
  Card,
  Avatar,
  Alert,
  Progress,
  Spinner,
  EmptyState,
  Toolbar,
  ToolbarSpacer,
  type ButtonProps,
  type IconButtonProps,
  type BadgeProps,
  type Tone,
  type CardProps,
  type AvatarProps,
  type AlertProps,
  type ProgressProps,
  type EmptyStateProps,
} from './ui/basic';
export {
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  SegmentedControl,
  type FieldProps,
  type InputProps,
  type TextareaProps,
  type SelectProps,
  type SelectOption,
  type CheckboxProps,
  type SwitchProps,
  type RadioGroupProps,
  type SegmentedControlProps,
} from './ui/form';
export { Tooltip, Dialog, useConfirm, type TooltipProps, type DialogProps, type ConfirmOptions } from './ui/overlay';
export {
  Combobox,
  type ComboboxProps,
  type ComboboxSingleProps,
  type ComboboxMultipleProps,
  type ComboboxOption,
  type ComboboxValue,
} from './ui/combobox';
export {
  DateCalendar,
  DatePicker,
  DateRangePicker,
  defaultDatePresets,
  type DateCalendarProps,
  type DatePickerProps,
  type DateRangePickerProps,
  type DateRange,
  type DateConstraints,
  type DatePreset,
} from './ui/date';
export { toISODate, fromISODate, formatDate, parseDate, compareDay, sameDay, type Weekday } from './utils/date';
export {
  Tabs,
  Pagination,
  DataTable,
  useServerTable,
  type TabItem,
  type TabsProps,
  type PaginationProps,
  type DataColumn,
  type DataTableProps,
  type SortDirection,
  type SortState,
  type RowKey,
  type ServerTableQuery,
  type ServerTablePage,
  type UseServerTableOptions,
} from './ui/data';
export { SidebarLayout, type SidebarItem, type SidebarLayoutProps } from './ui/layout';
export { LoginScreen, UserMenu, type LoginScreenProps, type LoginUser, type LoginCredentials, type UserMenuProps, type UserMenuAction } from './ui/account';

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
export { locales, resolveLabels, type DesktopLabels, type LabelOverrides, type UiLabels } from './i18n';
export { ACCENT_COLORS, type ThemeTokens, type ThemeTokenOverrides } from './theme';
export type * from './types';

/** Type helper for app definitions with typed launch arguments. */
export function defineApp<A = unknown>(app: import('./types').AppDefinition<A>): import('./types').AppDefinition<A> {
  return app;
}
