import { Fragment, type ReactNode } from 'react';
import { cx } from '../utils';

export interface SidebarItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Count or status shown on the right. */
  badge?: ReactNode;
  /** Items with the same section are grouped under this heading. */
  section?: string;
}

export interface SidebarLayoutProps {
  items: SidebarItem[];
  value: string;
  onChange: (id: string) => void;
  /** Above the navigation (search box, account…). */
  header?: ReactNode;
  footer?: ReactNode;
  width?: number;
  label?: string;
  className?: string;
  children?: ReactNode;
}

/** Sidebar navigation + content, for multi-page apps inside a window (settings, admin screens…). */
export function SidebarLayout({ items, value, onChange, header, footer, width = 210, label, className, children }: SidebarLayoutProps) {
  let lastSection: string | undefined;
  return (
    <div className={cx('xbd-sidebar-layout', className)} style={{ ['--xbd-sidebar-width' as string]: `${width}px` }}>
      <nav className="xbd-sidebar-layout__nav" aria-label={label}>
        {header}
        {items.map((it) => {
          const heading = it.section && it.section !== lastSection ? it.section : null;
          lastSection = it.section;
          return (
            <Fragment key={it.id}>
              {heading && <div className="xbd-sidebar-layout__section">{heading}</div>}
              <button
                type="button"
                className={cx('xbd-sidebar-layout__item', it.id === value && 'is-active')}
                aria-current={it.id === value ? 'page' : undefined}
                onClick={() => onChange(it.id)}
              >
                {it.icon}
                <span className="xbd-sidebar-layout__label">{it.label}</span>
                {it.badge !== undefined && <span className="xbd-sidebar-layout__badge">{it.badge}</span>}
              </button>
            </Fragment>
          );
        })}
        {footer && <div className="xbd-sidebar-layout__footer">{footer}</div>}
      </nav>
      <div className="xbd-sidebar-layout__content">{children}</div>
    </div>
  );
}
