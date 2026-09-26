import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useDesktopConfig, useDesktopController, useDesktopState } from '../context';
import type { DesktopController } from '../store/desktop-store';
import type { Bounds, GridCell, IconSize, IconSource, MenuEntry } from '../types';
import { cellKey, clamp, cx, nearestFreeCell, rectsIntersect } from '../utils';
import { AppIcon } from './AppIcon';
import { FolderGlyph, openShortcut, resolveItems } from './Folder';
import { GridIcon, ImageIcon, MoonIcon, SunIcon } from './icons';

export const ICON_METRICS: Record<IconSize, { w: number; h: number; icon: number }> = {
  small: { w: 80, h: 84, icon: 32 },
  medium: { w: 96, h: 104, icon: 48 },
  large: { w: 116, h: 128, icon: 64 },
};
const PAD = 8;
const DRAG_THRESHOLD = 5;

interface Item {
  id: string;
  title: string;
  icon?: IconSource;
  open: () => void;
}

function resolveLayout(items: Item[], stored: Record<string, GridCell>, cols: number, rows: number): Map<string, GridCell> {
  const layout = new Map<string, GridCell>();
  const occupied = new Set<string>();
  const pending: Item[] = [];
  for (const it of items) {
    const c = stored[it.id];
    if (c && c.col < cols && c.row < rows && !occupied.has(cellKey(c))) {
      layout.set(it.id, c);
      occupied.add(cellKey(c));
    } else {
      pending.push(it);
    }
  }
  let col = 0;
  let row = 0;
  for (const it of pending) {
    while (occupied.has(`${col}:${row}`)) {
      row += 1;
      if (row >= rows) {
        row = 0;
        col += 1;
      }
    }
    layout.set(it.id, { col, row });
    occupied.add(`${col}:${row}`);
  }
  return layout;
}

function blurWindows(api: DesktopController) {
  if (api.store.get().focusedId) api.store.set({ focusedId: null });
}

/** Grid of desktop icons: drag to arrange, rubber-band selection, keyboard navigation. */
export function DesktopIcons() {
  const api = useDesktopController();
  const config = useDesktopConfig();
  const { apps, shortcuts, labels, iconsAlign, openIconsWith, settingsAppId, desktopMenu, resolvedScheme } = config;
  const iconSize = useDesktopState((s) => s.preferences.iconSize, Object.is);
  const stored = useDesktopState((s) => s.preferences.iconPositions, Object.is);
  const viewport = useDesktopState((s) => s.viewport);

  const items = useMemo<Item[]>(
    () => [
      ...apps
        .filter((a) => a.showOnDesktop !== false)
        .map((a) => ({ id: a.id, title: a.title, icon: a.icon, open: () => void api.openApp(a.id) })),
      ...shortcuts.map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon ?? (s.items ? <FolderGlyph items={resolveItems(s.items, apps)} color={s.color} /> : s.appId ? api.getApp(s.appId)?.icon : undefined),
        open: () => openShortcut(api, s),
      })),
    ],
    [apps, shortcuts, api],
  );

  const m = ICON_METRICS[iconSize];
  const cols = Math.max(1, Math.floor((viewport.width - PAD * 2) / m.w));
  const rows = Math.max(1, Math.floor((viewport.height - PAD * 2) / m.h));
  const layout = useMemo(() => resolveLayout(items, stored, cols, rows), [items, stored, cols, rows]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [band, setBand] = useState<Bounds | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (focusId && containerRef.current?.contains(document.activeElement)) {
      iconRefs.current.get(focusId)?.focus({ preventScroll: true });
    }
  }, [focusId]);

  const cellToXY = (c: GridCell) => ({
    x: iconsAlign === 'right' ? viewport.width - PAD - (c.col + 1) * m.w : PAD + c.col * m.w,
    y: PAD + c.row * m.h,
  });
  const xyToCell = (x: number, y: number): GridCell => ({
    col: clamp(Math.floor((iconsAlign === 'right' ? viewport.width - PAD - x : x - PAD) / m.w), 0, cols - 1),
    row: clamp(Math.floor((y - PAD) / m.h), 0, rows - 1),
  });

  const commitPositions = (changes: Map<string, GridCell>) => {
    const next: Record<string, GridCell> = { ...stored };
    layout.forEach((c, id) => (next[id] = c));
    changes.forEach((c, id) => (next[id] = c));
    api.setPreferences({ iconPositions: next });
  };

  /* --------------------------- icon pointer ---------------------------- */
  const onIconPointerDown = (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    blurWindows(api);
    const additive = e.ctrlKey || e.metaKey;
    const wasSelected = selected.has(id);
    let group: Set<string>;
    if (additive) {
      group = new Set(selected);
      if (wasSelected) group.delete(id);
      else group.add(id);
    } else {
      group = wasSelected ? selected : new Set([id]);
    }
    setSelected(group);
    setFocusId(id);

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const moving = group.has(id) ? [...group] : [id];
    let dragging = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragging = true;
      for (const mid of moving) {
        const el = iconRefs.current.get(mid);
        if (el) {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.classList.add('is-dragging');
        }
      }
    };

    const up = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      for (const mid of moving) {
        const el = iconRefs.current.get(mid);
        if (el) {
          el.style.transform = '';
          el.classList.remove('is-dragging');
        }
      }
      if (!dragging) {
        if (!additive && wasSelected && group.size > 1) setSelected(new Set([id]));
        if (!additive && (openIconsWith === 'click' || ev.pointerType === 'touch')) items.find((i) => i.id === id)?.open();
        return;
      }
      if (ev.type === 'pointercancel') return;
      const from = layout.get(id);
      if (!from) return;
      const origin = cellToXY(from);
      const to = xyToCell(origin.x + m.w / 2 + (ev.clientX - startX), origin.y + m.h / 2 + (ev.clientY - startY));
      const dc = to.col - from.col;
      const dr = to.row - from.row;
      if (!dc && !dr) return;

      const changes = new Map<string, GridCell>();
      const occupied = new Map<string, string>();
      layout.forEach((c, iid) => {
        if (!moving.includes(iid)) occupied.set(cellKey(c), iid);
      });
      if (moving.length === 1) {
        const occupant = occupied.get(cellKey(to));
        if (occupant) changes.set(occupant, from);
        changes.set(id, to);
      } else {
        const taken = new Set(occupied.keys());
        for (const mid of moving) {
          const c = layout.get(mid);
          if (!c) continue;
          let t: GridCell | null = { col: clamp(c.col + dc, 0, cols - 1), row: clamp(c.row + dr, 0, rows - 1) };
          if (taken.has(cellKey(t))) t = nearestFreeCell(t, taken, cols, rows);
          if (!t) continue;
          taken.add(cellKey(t));
          changes.set(mid, t);
        }
      }
      commitPositions(changes);
    };

    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  /* ------------------------- rubber-band select ------------------------ */
  const onBackgroundPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    blurWindows(api);
    api.closeContextMenu();
    const container = e.currentTarget;
    container.setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const base = e.ctrlKey || e.metaKey ? new Set(selected) : new Set<string>();
    setSelected(base);

    const move = (ev: PointerEvent) => {
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const r = { x: Math.min(sx, x), y: Math.min(sy, y), width: Math.abs(x - sx), height: Math.abs(y - sy) };
      setBand(r);
      const next = new Set(base);
      layout.forEach((c, id) => {
        const p = cellToXY(c);
        if (rectsIntersect(r, { x: p.x + 8, y: p.y + 4, width: m.w - 16, height: m.h - 8 })) next.add(id);
      });
      setSelected(next);
    };
    const up = () => {
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerup', up);
      container.removeEventListener('pointercancel', up);
      setBand(null);
    };
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerup', up);
    container.addEventListener('pointercancel', up);
  };

  /* ---------------------------- context menus --------------------------- */
  const onBackgroundContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const prefs = api.getState().preferences;
    const defaults: MenuEntry[] = [];
    if (settingsAppId && api.getApp(settingsAppId)) {
      defaults.push({ label: labels.changeWallpaper, icon: <ImageIcon />, onSelect: () => void api.openApp(settingsAppId, { section: 'background' }) });
    }
    defaults.push(
      { label: labels.arrangeIcons, icon: <GridIcon />, onSelect: () => api.arrangeIcons() },
      {
        label: labels.iconSize,
        items: (['small', 'medium', 'large'] as const).map((size) => ({
          label: labels.iconSizes[size],
          checked: prefs.iconSize === size,
          onSelect: () => api.setPreferences({ iconSize: size }),
        })),
      },
      { type: 'separator' },
      resolvedScheme === 'dark'
        ? { label: labels.lightTheme, icon: <SunIcon />, onSelect: () => api.setPreferences({ colorScheme: 'light' }) }
        : { label: labels.darkTheme, icon: <MoonIcon />, onSelect: () => api.setPreferences({ colorScheme: 'dark' }) },
    );
    api.openContextMenu(e.clientX, e.clientY, desktopMenu ? desktopMenu(defaults, api) : defaults);
  };

  const onIconContextMenu = (item: Item) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected.has(item.id)) setSelected(new Set([item.id]));
    setFocusId(item.id);
    api.openContextMenu(e.clientX, e.clientY, [{ label: labels.open, onSelect: item.open }]);
  };

  /* ------------------------------ keyboard ------------------------------ */
  const onKeyDown = (e: KeyboardEvent) => {
    const current = focusId ?? items[0]?.id;
    if (!current) return;
    const c = layout.get(current);
    if (!c) return;
    const find = (pred: (cell: GridCell) => boolean, score: (cell: GridCell) => number) => {
      let best: string | null = null;
      let bestScore = Infinity;
      layout.forEach((cell, id) => {
        if (id !== current && pred(cell)) {
          const sc = score(cell);
          if (sc < bestScore) {
            bestScore = sc;
            best = id;
          }
        }
      });
      return best;
    };
    let next: string | null = null;
    const horizontal = (dir: 1 | -1) => find((x) => (x.col - c.col) * dir > 0, (x) => Math.abs(x.col - c.col) * 100 + Math.abs(x.row - c.row));
    switch (e.key) {
      case 'ArrowDown':
        next = find((x) => x.col === c.col && x.row > c.row, (x) => x.row) ?? find((x) => x.col > c.col, (x) => x.col * 1000 + x.row);
        break;
      case 'ArrowUp':
        next = find((x) => x.col === c.col && x.row < c.row, (x) => -x.row) ?? find((x) => x.col < c.col, (x) => -x.col * 1000 - x.row);
        break;
      case 'ArrowRight':
        next = horizontal(iconsAlign === 'right' ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = horizontal(iconsAlign === 'right' ? 1 : -1);
        break;
      case 'Enter': {
        e.preventDefault();
        const targets = selected.size ? items.filter((i) => selected.has(i.id)) : items.filter((i) => i.id === current);
        targets.forEach((i) => i.open());
        return;
      }
      case ' ': {
        e.preventDefault();
        const s = new Set(selected);
        if (s.has(current)) s.delete(current);
        else s.add(current);
        setSelected(s);
        return;
      }
      case 'Escape':
        setSelected(new Set());
        return;
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setSelected(new Set(items.map((i) => i.id)));
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) {
      setFocusId(next);
      if (!e.shiftKey) setSelected(new Set([next]));
      else setSelected(new Set([...selected, next]));
    }
  };

  const tabStop = focusId ?? items[0]?.id;

  return (
    <div
      ref={containerRef}
      className={cx('xbd-icons', `xbd-icons--${iconSize}`)}
      role="listbox"
      aria-multiselectable="true"
      aria-orientation="vertical"
      onPointerDown={onBackgroundPointerDown}
      onContextMenu={onBackgroundContextMenu}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const c = layout.get(item.id);
        if (!c) return null;
        const p = cellToXY(c);
        const isSel = selected.has(item.id);
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) iconRefs.current.set(item.id, el);
              else iconRefs.current.delete(item.id);
            }}
            role="option"
            aria-selected={isSel}
            tabIndex={item.id === tabStop ? 0 : -1}
            title={item.title}
            className={cx('xbd-desktop-icon', isSel && 'is-selected')}
            style={{ left: p.x, top: p.y, width: m.w, height: m.h }}
            onPointerDown={onIconPointerDown(item.id)}
            onDoubleClick={() => openIconsWith === 'doubleClick' && item.open()}
            onContextMenu={onIconContextMenu(item)}
            onFocus={() => setFocusId(item.id)}
          >
            <AppIcon icon={item.icon} size={m.icon} className="xbd-desktop-icon__img" />
            <span className="xbd-desktop-icon__label">{item.title}</span>
          </div>
        );
      })}
      {band && <div className="xbd-rubber-band" style={{ left: band.x, top: band.y, width: band.width, height: band.height }} />}
    </div>
  );
}
