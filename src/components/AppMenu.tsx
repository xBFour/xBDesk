import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useDesktopConfig, useDesktopController } from '../context';
import type { AppDefinition, IconSource } from '../types';
import { cx } from '../utils';
import { AppIcon } from './AppIcon';
import { AppsIcon, SearchIcon } from './icons';
import { PanelPopoverButton, usePanel } from './Panel';

const COLUMNS = 4;

function matches(app: AppDefinition, q: string): boolean {
  if (!q) return true;
  const hay = [app.title, app.description, app.category, ...(app.keywords ?? [])].filter(Boolean).join(' ').toLocaleLowerCase();
  return q
    .toLocaleLowerCase()
    .split(/\s+/)
    .every((part) => hay.includes(part));
}

export interface AppMenuProps {
  onLaunch?: () => void;
}

/** Searchable launcher with categories. Usually shown via `<AppMenuButton/>`. */
export function AppMenu({ onLaunch }: AppMenuProps) {
  const api = useDesktopController();
  const { apps, labels, locale } = useDesktopConfig();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleApps = useMemo(() => apps.filter((a) => a.showInMenu !== false), [apps]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    visibleApps.forEach((a) => a.category && set.add(a.category));
    return [...set].sort((a, b) => a.localeCompare(b, locale));
  }, [visibleApps, locale]);

  const results = useMemo(
    () =>
      visibleApps
        .filter((a) => (query ? true : !category || a.category === category))
        .filter((a) => matches(a, query.trim()))
        .sort((a, b) => a.title.localeCompare(b.title, locale)),
    [visibleApps, query, category, locale],
  );

  const launch = (app: AppDefinition) => {
    onLaunch?.();
    api.openApp(app.id);
  };

  const focusItem = (index: number) => {
    setActive(index);
    const el = gridRef.current?.children[index] as HTMLElement | undefined;
    el?.focus();
    el?.scrollIntoView({ block: 'nearest' });
  };

  const onGridKeyDown = (e: KeyboardEvent) => {
    const max = results.length - 1;
    let next = active;
    if (e.key === 'ArrowRight') next = Math.min(max, active + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, active - 1);
    else if (e.key === 'ArrowDown') next = Math.min(max, active + COLUMNS);
    else if (e.key === 'ArrowUp') {
      if (active < COLUMNS) {
        e.preventDefault();
        (e.currentTarget.closest('.xbd-app-menu')?.querySelector('input') as HTMLInputElement | null)?.focus();
        return;
      }
      next = active - COLUMNS;
    } else return;
    e.preventDefault();
    focusItem(next);
  };

  return (
    <div className="xbd-app-menu">
      <label className="xbd-app-menu__search">
        <SearchIcon />
        <input
          autoFocus
          type="search"
          value={query}
          placeholder={labels.searchApplications}
          aria-label={labels.searchApplications}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[active]) {
              e.preventDefault();
              launch(results[active]);
            } else if (e.key === 'ArrowDown' && results.length) {
              e.preventDefault();
              focusItem(0);
            }
          }}
        />
      </label>
      <div className="xbd-app-menu__main">
        {categories.length > 0 && !query && (
          <nav className="xbd-app-menu__categories" aria-label={labels.applications}>
            <button type="button" className={cx('xbd-app-menu__category', category === null && 'is-active')} onClick={() => setCategory(null)}>
              {labels.allApplications}
            </button>
            {categories.map((c) => (
              <button key={c} type="button" className={cx('xbd-app-menu__category', category === c && 'is-active')} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </nav>
        )}
        <div ref={gridRef} className="xbd-app-menu__grid" role="listbox" aria-label={labels.applications} onKeyDown={onGridKeyDown}>
          {results.map((app, i) => (
            <button
              key={app.id}
              type="button"
              role="option"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className={cx('xbd-app-menu__app', i === active && 'is-active')}
              title={app.description ?? app.title}
              onClick={() => launch(app)}
              onPointerEnter={() => setActive(i)}
            >
              <AppIcon icon={app.icon} size={40} />
              <span>{app.title}</span>
            </button>
          ))}
          {!results.length && <p className="xbd-app-menu__empty">{labels.noResults}</p>}
        </div>
      </div>
    </div>
  );
}

export interface AppMenuButtonProps {
  icon?: IconSource;
  label?: string;
  /** Show the label next to the icon (horizontal panels only). */
  showLabel?: boolean;
}

export function AppMenuButton({ icon, label, showLabel = false }: AppMenuButtonProps) {
  const { labels } = useDesktopConfig();
  const { vertical } = usePanel();
  const text = label ?? labels.applications;
  return (
    <PanelPopoverButton
      className="xbd-app-menu-button"
      icon={icon ?? <AppsIcon />}
      label={showLabel && !vertical ? text : undefined}
      title={text}
      aria-label={text}
      popoverClassName="xbd-popover--app-menu"
      content={(close) => <AppMenu onLaunch={close} />}
    />
  );
}
