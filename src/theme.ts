import type { CSSProperties } from 'react';
import { readableForeground } from './utils';

/**
 * Design tokens. Every token maps to a CSS custom property (`fontFamily` →
 * `--dui-font-family`) so themes can be set from props *or* plain CSS.
 */
export interface ThemeTokens {
  fontFamily: string;
  fontSize: string;
  /** Radius of small controls (buttons, inputs). */
  radius: string;
  windowRadius: string;
  panelBg: string;
  panelFg: string;
  surfaceBg: string;
  surfaceFg: string;
  windowBg: string;
  windowFg: string;
  titlebarBg: string;
  titlebarFg: string;
  titlebarInactiveBg: string;
  titlebarInactiveFg: string;
  border: string;
  mutedFg: string;
  hoverBg: string;
  windowShadow: string;
  iconLabelFg: string;
  iconLabelShadow: string;
}

export type ThemeTokenOverrides = Partial<ThemeTokens>;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function themeStyle(accentColor: string, tokens?: ThemeTokenOverrides): CSSProperties {
  const style: Record<string, string> = {
    '--dui-accent': accentColor,
    '--dui-accent-fg': readableForeground(accentColor),
  };
  if (tokens) {
    for (const [k, v] of Object.entries(tokens)) {
      if (v != null) style[`--dui-${kebab(k)}`] = v;
    }
  }
  return style as CSSProperties;
}

/** Accent presets used by the built-in settings app. */
export const ACCENT_COLORS = ['#3584e4', '#2190a4', '#3a944a', '#c88800', '#ed5b00', '#e62d42', '#d56199', '#9141ac', '#6f8396'];
