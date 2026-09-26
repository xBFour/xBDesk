import { createContext, useCallback, useContext, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DesktopConfigContext, WindowLayerContext } from '../context';
import { detectLocale, resolveLabels, type UiLabels } from '../i18n';
import { themeStyle, type ThemeTokenOverrides } from '../theme';
import { cx } from '../utils';

interface ScopeValue {
  element: HTMLElement | null;
  scheme: 'light' | 'dark';
  labels?: Partial<UiLabels>;
  locale?: string;
}

const ScopeContext = createContext<ScopeValue | null>(null);

/** Component labels: from the surrounding <Desktop> or <ThemeScope>, else from the browser language. */
export function useUiLabels(overrides?: Partial<UiLabels>): UiLabels {
  const config = useContext(DesktopConfigContext);
  const scope = useContext(ScopeContext);
  return useMemo(() => {
    const base = config?.labels.ui ?? resolveLabels(scope?.locale ?? detectLocale(), { ui: scope?.labels }).ui;
    return overrides ? { ...base, ...overrides } : base;
  }, [config, scope, overrides]);
}

export function useUiLocale(): string {
  const config = useContext(DesktopConfigContext);
  const scope = useContext(ScopeContext);
  return config?.locale ?? scope?.locale ?? detectLocale();
}

/** Controlled when `value !== undefined`, otherwise internal state seeded with `defaultValue`. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [controlled ? value : inner, set];
}

export type PortalScope = 'window' | 'desktop';

/**
 * Renders floating UI in the right place: the current window's overlay layer
 * (window-modal), the desktop overlay, a <ThemeScope>, or document.body.
 */
export function Portal({ children, scope = 'desktop' }: { children: ReactNode; scope?: PortalScope }) {
  const windowLayer = useContext(WindowLayerContext);
  const config = useContext(DesktopConfigContext);
  const themeScope = useContext(ScopeContext);
  if (scope === 'window' && windowLayer) return createPortal(children, windowLayer);
  const overlay = config?.overlayRef.current;
  if (overlay) return createPortal(children, overlay);
  if (themeScope?.element) return createPortal(children, themeScope.element);
  if (typeof document === 'undefined') return null;
  // Outside any themed root: carry the tokens along.
  return createPortal(
    <div className="xbd-theme xbd-portal-theme" data-scheme={config?.resolvedScheme ?? 'light'}>
      {children}
    </div>,
    document.body,
  );
}

export interface ThemeScopeProps {
  colorScheme?: 'light' | 'dark';
  accentColor?: string;
  tokens?: ThemeTokenOverrides;
  /** BCP 47 locale for component labels. */
  locale?: string;
  labels?: Partial<UiLabels>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Applies xBDesk theme tokens to children outside <Desktop> (login pages, standalone forms…). */
export function ThemeScope({ colorScheme = 'light', accentColor = '#3584e4', tokens, locale, labels, className, style, children }: ThemeScopeProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ element, scheme: colorScheme, locale, labels }), [element, colorScheme, locale, labels]);
  return (
    <ScopeContext.Provider value={value}>
      <div ref={setElement} className={cx('xbd-theme', className)} data-scheme={colorScheme} style={{ ...themeStyle(accentColor, tokens), ...style }}>
        {children}
      </div>
    </ScopeContext.Provider>
  );
}

/** Stable, readable colour for a name (avatars, generated tiles). */
export function colorFor(name: string): string {
  const palette = ['#3584e4', '#2190a4', '#3a944a', '#c88800', '#ed5b00', '#e62d42', '#d56199', '#9141ac', '#6f8396'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toLocaleUpperCase();
}
