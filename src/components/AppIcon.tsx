import type { CSSProperties } from 'react';
import type { IconSource } from '../types';
import { cx } from '../utils';
import { WindowIcon } from './icons';

export interface AppIconProps {
  icon?: IconSource;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Renders an `IconSource`: string → `<img>`, node → as-is, empty → generic window glyph. */
export function AppIcon({ icon, size = 20, className, style }: AppIconProps) {
  const s: CSSProperties = { width: size, height: size, ...style };
  if (typeof icon === 'string') {
    return <img className={cx('dui-app-icon', className)} src={icon} alt="" draggable={false} style={s} />;
  }
  return (
    <span className={cx('dui-app-icon', className)} style={s} aria-hidden="true">
      {icon ?? <WindowIcon width="70%" height="70%" />}
    </span>
  );
}
