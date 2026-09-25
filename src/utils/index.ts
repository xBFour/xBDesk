import type { Bounds, GridCell, Size } from '../types';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

let idCounter = 0;
export function uid(prefix = 'dui'): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Keep enough of the title bar on screen that the window can always be grabbed. */
export function keepReachable(bounds: Bounds, viewport: Size, grip = 96): Bounds {
  if (!viewport.width || !viewport.height) return bounds;
  return {
    ...bounds,
    x: clamp(bounds.x, grip - bounds.width, viewport.width - grip),
    y: clamp(bounds.y, 0, viewport.height - 36),
  };
}

export function fitInto(size: Size, viewport: Size, margin = 16): Size {
  if (!viewport.width || !viewport.height) return size;
  return {
    width: Math.min(size.width, Math.max(160, viewport.width - margin * 2)),
    height: Math.min(size.height, Math.max(120, viewport.height - margin * 2)),
  };
}

export function rectsIntersect(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export const cellKey = (c: GridCell) => `${c.col}:${c.row}`;

/** Closest free cell to `target` (Chebyshev rings, column-major within a ring). */
export function nearestFreeCell(target: GridCell, occupied: Set<string>, cols: number, rows: number): GridCell | null {
  const maxRing = Math.max(cols, rows);
  for (let ring = 0; ring <= maxRing; ring++) {
    let best: GridCell | null = null;
    let bestDist = Infinity;
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const col = target.col + dc;
        const row = target.row + dr;
        if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
        if (occupied.has(`${col}:${row}`)) continue;
        const dist = dc * dc + dr * dr;
        if (dist < bestDist) {
          bestDist = dist;
          best = { col, row };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** Relative luminance based black/white foreground for a hex/rgb colour. */
export function readableForeground(color: string): string {
  const rgb = parseColor(color);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? '#111418' : '#ffffff';
}

export function parseColor(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = color.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}
