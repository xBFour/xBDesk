import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useDesktopConfig, useDesktopController, useDesktopState } from '../context';
import type { MenuActionItem, MenuEntry } from '../types';
import { cx } from '../utils';
import { AppIcon } from './AppIcon';
import { CheckIcon, ChevronRightIcon } from './icons';

export interface MenuListProps {
  items: MenuEntry[];
  /** Anchor point in client coordinates (ignored for sub-menus). */
  x: number;
  y: number;
  onClose: () => void;
  /** Sub-menus: rect of the parent item, in client coordinates. */
  anchorRect?: DOMRect;
  onBack?: () => void;
  className?: string;
}

const isAction = (e: MenuEntry): e is MenuActionItem => e.type === undefined || e.type === 'item';

/** Keyboard-navigable menu with sub-menus. Rendered into the desktop overlay layer. */
export function MenuList({ items, x, y, onClose, anchorRect, onBack, className }: MenuListProps) {
  const { rootRef, overlayRef } = useDesktopConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [active, setActive] = useState(-1);
  const [sub, setSub] = useState<{ index: number; rect: DOMRect } | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    const el = ref.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left: number;
    let top: number;
    if (anchorRect) {
      left = anchorRect.right - r.left - 2;
      top = anchorRect.top - r.top - 5;
      if (left + w > r.width - 4) left = anchorRect.left - r.left - w + 2;
    } else {
      left = x - r.left;
      top = y - r.top;
      if (left + w > r.width - 4) left = left - w;
    }
    if (top + h > r.height - 4) top = r.height - h - 4;
    setPos({ left: Math.max(4, left), top: Math.max(4, top) });
  }, [x, y, anchorRect, items, rootRef]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const actionable = items.map((it, i) => (isAction(it) && !it.disabled ? i : -1)).filter((i) => i >= 0);

  const openSub = (index: number) => {
    const el = itemRefs.current[index];
    if (el) setSub({ index, rect: el.getBoundingClientRect() });
  };

  const select = (index: number) => {
    const it = items[index];
    if (!it || !isAction(it) || it.disabled) return;
    if (it.items?.length) {
      openSub(index);
      return;
    }
    onClose();
    it.onSelect?.();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    const pos = actionable.indexOf(active);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(actionable[(pos + 1) % actionable.length] ?? -1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(actionable[pos <= 0 ? actionable.length - 1 : pos - 1] ?? -1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(actionable[0] ?? -1);
        break;
      case 'End':
        e.preventDefault();
        setActive(actionable[actionable.length - 1] ?? -1);
        break;
      case 'ArrowRight': {
        const it = items[active];
        if (it && isAction(it) && it.items?.length) {
          e.preventDefault();
          openSub(active);
        }
        break;
      }
      case 'ArrowLeft':
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (active >= 0) select(active);
        break;
      case 'Escape':
        e.preventDefault();
        if (onBack) onBack();
        else onClose();
        break;
      case 'Tab':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const subItems = sub ? (items[sub.index] as MenuActionItem).items : undefined;

  return (
    <>
      <div
        ref={ref}
        className={cx('dui-menu', className)}
        role="menu"
        tabIndex={-1}
        data-dui-menu=""
        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, opacity: pos ? undefined : 0, pointerEvents: pos ? undefined : 'none' }}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((it, i) => {
          if (it.type === 'separator') return <div key={i} className="dui-menu__sep" role="separator" />;
          if (it.type === 'label') {
            return (
              <div key={i} className="dui-menu__label">
                {it.label}
              </div>
            );
          }
          return (
            <div
              key={it.id ?? i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role={it.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
              aria-checked={it.checked}
              aria-disabled={it.disabled || undefined}
              aria-haspopup={it.items?.length ? 'menu' : undefined}
              aria-expanded={it.items?.length ? sub?.index === i : undefined}
              className={cx(
                'dui-menu__item',
                i === active && 'is-active',
                it.danger && 'is-danger',
                it.disabled && 'is-disabled',
              )}
              onPointerEnter={() => {
                if (it.disabled) return;
                setActive(i);
                if (it.items?.length) openSub(i);
                else if (sub) {
                  setSub(null);
                  ref.current?.focus({ preventScroll: true });
                }
              }}
              onClick={() => select(i)}
            >
              <span className="dui-menu__icon">
                {it.checked ? <CheckIcon /> : it.icon ? <AppIcon icon={it.icon} size={16} /> : null}
              </span>
              <span className="dui-menu__text">{it.label}</span>
              {it.shortcut && <span className="dui-menu__shortcut">{it.shortcut}</span>}
              {it.items?.length ? <ChevronRightIcon className="dui-menu__chevron" /> : null}
            </div>
          );
        })}
      </div>
      {sub &&
        subItems &&
        overlayRef.current &&
        createPortal(
          <MenuList
            key={sub.index}
            items={subItems}
            x={0}
            y={0}
            anchorRect={sub.rect}
            onClose={onClose}
            onBack={() => {
              setSub(null);
              ref.current?.focus({ preventScroll: true });
            }}
          />,
          overlayRef.current,
        )}
    </>
  );
}

/** Hosts the single desktop-wide context menu (see `api.openContextMenu`). */
export function ContextMenuHost() {
  const api = useDesktopController();
  const menu = useDesktopState((s) => s.contextMenu, Object.is);
  const { overlayRef } = useDesktopConfig();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    if (!returnFocus.current && document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
    const close = () => api.closeContextMenu();
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-dui-menu]')) close();
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
    };
  }, [menu, api]);

  useEffect(() => {
    if (menu) return;
    const el = returnFocus.current;
    returnFocus.current = null;
    const lost = !document.activeElement || document.activeElement === document.body;
    if (el && el.isConnected && lost) el.focus({ preventScroll: true });
  }, [menu]);

  if (!menu || !overlayRef.current) return null;
  return createPortal(
    <MenuList key={`${menu.x}:${menu.y}`} items={menu.items} x={menu.x} y={menu.y} onClose={() => api.closeContextMenu()} />,
    overlayRef.current,
  );
}
