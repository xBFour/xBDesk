import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useDesktop, useDesktopConfig, useWindow } from '../context';
import type { DesktopApi } from '../store/desktop-store';
import type { AppComponentProps, AppDefinition, DesktopShortcut, IconSource } from '../types';
import { cx } from '../utils';
import { AppIcon } from './AppIcon';
import { ChevronLeftIcon } from './icons';

/** Internal app that shows a folder's items; opened through `openShortcut`/`openFolder`. */
export const FOLDER_APP_ID = 'xbd:folder';

export interface ResolvedItem {
  id: string;
  title: string;
  icon?: IconSource;
  /** Set for nested folders. */
  folder?: DesktopShortcut;
  target: string | DesktopShortcut;
}

/** Depth-first lookup of a shortcut (folder) by id, including nested folders. */
export function findShortcut(list: Array<string | DesktopShortcut>, id: string): DesktopShortcut | undefined {
  for (const s of list) {
    if (typeof s === 'string') continue;
    if (s.id === id) return s;
    if (s.items) {
      const hit = findShortcut(s.items, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Folder items as displayable entries; app ids that are not registered (or not permitted) are dropped. */
export function resolveItems(items: Array<string | DesktopShortcut>, apps: AppDefinition[]): ResolvedItem[] {
  const out: ResolvedItem[] = [];
  for (const it of items) {
    if (typeof it === 'string') {
      const app = apps.find((a) => a.id === it);
      if (app) out.push({ id: app.id, title: app.title, icon: app.icon, target: it });
    } else {
      out.push({
        id: it.id,
        title: it.title,
        icon: it.icon ?? (it.items ? <FolderGlyph items={resolveItems(it.items, apps)} color={it.color} /> : it.appId ? apps.find((a) => a.id === it.appId)?.icon : undefined),
        folder: it.items ? it : undefined,
        target: it,
      });
    }
  }
  return out;
}

export function openFolder(api: DesktopApi, id: string): void {
  const existing = Object.values(api.getState().windows).find((w) => w.appId === FOLDER_APP_ID && (w.args as { id?: string } | undefined)?.id === id);
  if (existing) api.focusWindow(existing.id);
  else api.openApp(FOLDER_APP_ID, { id });
}

/** Activates a desktop item: app id, app shortcut, custom handler or folder. */
export function openShortcut(api: DesktopApi, target: string | DesktopShortcut): void {
  if (typeof target === 'string') api.openApp(target);
  else if (target.items) openFolder(api, target.id);
  else if (target.onOpen) target.onOpen();
  else if (target.appId) api.openApp(target.appId, target.args);
}

/** Folder icon: a tinted tile previewing up to four of its items. */
export function FolderGlyph({ items, color }: { items: ResolvedItem[]; color?: string }) {
  const preview = items.slice(0, 4);
  return (
    <span className="xbd-folder-glyph" style={color ? { ['--xbd-folder-tint' as string]: color } : undefined}>
      {preview.map((it) => (
        <span key={it.id} className="xbd-folder-glyph__cell">
          <AppIcon icon={it.icon} style={{ width: '100%', height: '100%' }} />
        </span>
      ))}
    </span>
  );
}

/** Small folder symbol for title bars and the task bar. */
export const FolderSymbol = (
  <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
    <path d="M5 12a4 4 0 014-4h10l4 4h16a4 4 0 014 4v2H5z" fill="#c68a19" />
    <rect x="5" y="15" width="38" height="26" rx="4" fill="#f2b84b" />
  </svg>
);

function FolderView({ args }: AppComponentProps<{ id: string }>) {
  const { shortcuts, apps, labels, openIconsWith } = useDesktopConfig();
  const { setTitle, setRestoreArgs } = useWindow();
  const api = useDesktop();
  const [trail, setTrail] = useState<string[]>([args?.id]);
  const [active, setActive] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Re-opening the window for another folder id starts over there.
  useEffect(() => {
    if (args?.id) setTrail((t) => (t[0] === args.id ? t : [args.id]));
  }, [args?.id]);

  const currentId = trail[trail.length - 1];
  const folder = findShortcut(shortcuts, currentId);
  const items = useMemo(() => (folder?.items ? resolveItems(folder.items, apps) : []), [folder, apps]);

  useEffect(() => {
    if (folder) setTitle(folder.title);
    setRestoreArgs({ id: currentId });
    setActive(0);
  }, [folder, currentId, setTitle, setRestoreArgs]);

  const open = (it: ResolvedItem) => {
    if (it.folder) setTrail((t) => [...t, it.folder!.id]);
    else openShortcut(api, it.target);
  };

  const columns = () => {
    const grid = gridRef.current;
    if (!grid || !grid.children.length) return 1;
    const first = (grid.children[0] as HTMLElement).offsetTop;
    let n = 0;
    for (const el of Array.from(grid.children)) if ((el as HTMLElement).offsetTop === first) n++;
    return Math.max(1, n);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!items.length) return;
    const cols = columns();
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
    if (e.key in move) {
      e.preventDefault();
      const next = Math.min(items.length - 1, Math.max(0, active + move[e.key]));
      setActive(next);
      (gridRef.current?.children[next] as HTMLElement | undefined)?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) open(items[active]);
    } else if (e.key === 'Backspace' && trail.length > 1) {
      e.preventDefault();
      setTrail((t) => t.slice(0, -1));
    }
  };

  if (!folder) return <p className="xbd-folder__empty">{labels.emptyFolder}</p>;

  let crumbs: ReactNode = null;
  if (trail.length > 1) {
    crumbs = (
      <div className="xbd-folder__bar">
        <button type="button" className="xbd-icon-button" aria-label={labels.back} title={labels.back} onClick={() => setTrail((t) => t.slice(0, -1))}>
          <ChevronLeftIcon />
        </button>
        <span className="xbd-folder__path">{trail.map((id) => findShortcut(shortcuts, id)?.title).filter(Boolean).join(' / ')}</span>
      </div>
    );
  }

  return (
    <div className="xbd-folder">
      {crumbs}
      <div ref={gridRef} className="xbd-folder__grid" role="listbox" aria-label={folder.title} onKeyDown={onKeyDown}>
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="option"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className={cx('xbd-folder__item', i === active && 'is-active')}
            title={it.title}
            onClick={() => (openIconsWith === 'click' ? open(it) : setActive(i))}
            onDoubleClick={() => openIconsWith === 'doubleClick' && open(it)}
            onFocus={() => setActive(i)}
          >
            <AppIcon icon={it.icon} size={48} />
            <span>{it.title}</span>
          </button>
        ))}
        {!items.length && <p className="xbd-folder__empty">{labels.emptyFolder}</p>}
      </div>
    </div>
  );
}

export const folderApp: AppDefinition<{ id: string }> = {
  id: FOLDER_APP_ID,
  title: 'Folder',
  icon: FolderSymbol,
  component: FolderView,
  singleInstance: false,
  showOnDesktop: false,
  showInMenu: false,
  window: { width: 600, height: 420, minWidth: 320, minHeight: 240, bare: true },
};
