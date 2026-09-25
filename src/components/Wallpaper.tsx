import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useDesktopConfig, useDesktopState } from '../context';
import type { Wallpaper as WallpaperValue, WallpaperFit, WallpaperPreset } from '../types';

type Concrete = Exclude<WallpaperValue, { type: 'preset' }>;

export function resolveWallpaper(w: WallpaperValue, presets: WallpaperPreset[]): Concrete | null {
  if (w.type !== 'preset') return w;
  return presets.find((p) => p.id === w.id)?.wallpaper ?? presets[0]?.wallpaper ?? null;
}

const FIT: Record<WallpaperFit, CSSProperties> = {
  cover: { backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  contain: { backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  fill: { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' },
  center: { backgroundSize: 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  tile: { backgroundSize: 'auto', backgroundRepeat: 'repeat' },
};

export function wallpaperStyle(w: Concrete): CSSProperties {
  switch (w.type) {
    case 'image':
      return { backgroundColor: w.color ?? '#101418', backgroundImage: `url("${w.src.replace(/"/g, '%22')}")`, ...FIT[w.fit ?? 'cover'] };
    case 'color':
      return { background: w.color };
    case 'gradient':
      return { background: w.value };
    default:
      return {};
  }
}

function Layer({ w, entering }: { w: Concrete; entering: boolean }) {
  let content: ReactNode = null;
  if (w.type === 'custom') content = w.render();
  return (
    <div className={entering ? 'dui-wallpaper__layer is-entering' : 'dui-wallpaper__layer'} style={wallpaperStyle(w)}>
      {content}
    </div>
  );
}

const identity = (w: Concrete | null): unknown => (w ? (w.type === 'custom' ? w.render : JSON.stringify(w)) : null);

/** Full-screen background; cross-fades when the wallpaper changes. */
export function Wallpaper() {
  const { wallpapers } = useDesktopConfig();
  const value = useDesktopState((s) => s.preferences.wallpaper, Object.is);
  const current = resolveWallpaper(value, wallpapers);
  const id = identity(current);
  const [layers, setLayers] = useState<Array<{ key: number; w: Concrete }>>(() => (current ? [{ key: 0, w: current }] : []));

  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (identity(top?.w ?? null) === id) return prev;
      return current ? [...prev.slice(-1), { key: (top?.key ?? 0) + 1, w: current }] : [];
    });
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), 700);
    return () => clearTimeout(t);
    // `current` is derived from `id`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="dui-wallpaper" aria-hidden="true">
      {layers.map((l, i) => (
        <Layer key={l.key} w={l.w} entering={layers.length > 1 && i === layers.length - 1} />
      ))}
    </div>
  );
}
