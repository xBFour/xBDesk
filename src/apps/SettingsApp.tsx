import { useEffect, useState, type ReactNode } from 'react';
import { useDesktop, useDesktopConfig, usePreferences } from '../context';
import { resolveWallpaper, wallpaperStyle } from '../components/Wallpaper';
import { ImageIcon, PaletteIcon, PanelIcon, UploadIcon, WorkspacesIcon } from '../components/icons';
import { ACCENT_COLORS } from '../theme';
import type { AppComponentProps, AppDefinition, IconSource, WallpaperFit } from '../types';
import { cx } from '../utils';

export interface SettingsSection {
  id: string;
  title: string;
  icon?: ReactNode;
  render: () => ReactNode;
}

export interface SettingsAppOptions {
  id?: string;
  /** Shown on the desktop icon, menu and window. Default `'Settings'`. */
  title?: string;
  icon?: IconSource;
  /** Built-in sections to show, in order. */
  sections?: Array<'background' | 'appearance' | 'panel' | 'workspaces'>;
  /** Extra sections appended to the sidebar. */
  extraSections?: SettingsSection[];
  category?: string;
}

/* ---------------------------- small controls ---------------------------- */

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="xbd-segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={cx(value === o.value && 'is-active')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="xbd-settings__row">
      <span className="xbd-settings__label">{label}</span>
      <div className="xbd-settings__control">{children}</div>
    </div>
  );
}

/** Downscale an uploaded image so it fits comfortably in persisted preferences. */
function readImage(file: File, maxSide = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be read'));
    };
    img.src = url;
  });
}

/* ------------------------------- sections ------------------------------- */

function BackgroundSection() {
  const api = useDesktop();
  const { wallpapers, labels } = useDesktopConfig();
  const prefs = usePreferences();
  const L = labels.settings;
  const current = prefs.wallpaper;
  const concrete = resolveWallpaper(current, wallpapers);
  const [url, setUrl] = useState(concrete?.type === 'image' && !concrete.src.startsWith('data:') ? concrete.src : '');
  const fit: WallpaperFit = concrete?.type === 'image' ? concrete.fit ?? 'cover' : 'cover';
  const color = concrete?.type === 'color' ? concrete.color : '#2b3a55';

  const setImage = (src: string) => api.setWallpaper({ type: 'image', src, fit });

  return (
    <>
      <div className="xbd-settings__preview" style={concrete && concrete.type !== 'custom' ? wallpaperStyle(concrete) : undefined}>
        {concrete?.type === 'custom' && concrete.render()}
      </div>
      {wallpapers.length > 0 && (
        <section>
          <h3>{L.wallpapers}</h3>
          <div className="xbd-wallpaper-grid">
            {wallpapers.map((p) => {
              const selected = current.type === 'preset' && current.id === p.id;
              const style = p.thumbnail ? { backgroundImage: `url("${p.thumbnail}")`, backgroundSize: 'cover' } : p.wallpaper.type === 'custom' ? undefined : wallpaperStyle(p.wallpaper);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cx('xbd-wallpaper-grid__item', selected && 'is-active')}
                  aria-pressed={selected}
                  title={p.name}
                  onClick={() => api.setWallpaper({ type: 'preset', id: p.id })}
                >
                  <span className="xbd-wallpaper-grid__thumb" style={style}>
                    {!p.thumbnail && p.wallpaper.type === 'custom' && p.wallpaper.render()}
                  </span>
                  <span className="xbd-wallpaper-grid__name">{p.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <section>
        {concrete?.type === 'image' && (
          <Row label={L.fit}>
            <select className="xbd-input" value={fit} onChange={(e) => api.setWallpaper({ ...concrete, fit: e.target.value as WallpaperFit })}>
              {(Object.keys(L.fits) as WallpaperFit[]).map((f) => (
                <option key={f} value={f}>
                  {L.fits[f]}
                </option>
              ))}
            </select>
          </Row>
        )}
        <Row label={L.solidColor}>
          <input className="xbd-color-input" type="color" value={color} onChange={(e) => api.setWallpaper({ type: 'color', color: e.target.value })} aria-label={L.solidColor} />
        </Row>
        <Row label={L.imageUrl}>
          <form
            className="xbd-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) setImage(url.trim());
            }}
          >
            <input className="xbd-input" type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label={L.imageUrl} />
            <button type="submit" className="xbd-button">
              {L.apply}
            </button>
          </form>
        </Row>
        <Row label="">
          <label className="xbd-button xbd-button--ghost">
            <UploadIcon /> {L.uploadImage}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) setImage(await readImage(file));
              }}
            />
          </label>
        </Row>
      </section>
    </>
  );
}

function AppearanceSection() {
  const api = useDesktop();
  const { labels } = useDesktopConfig();
  const prefs = usePreferences();
  const L = labels.settings;
  return (
    <section>
      <Row label={L.colorScheme}>
        <Segmented
          label={L.colorScheme}
          value={prefs.colorScheme}
          onChange={(colorScheme) => api.setPreferences({ colorScheme })}
          options={(['light', 'dark', 'auto'] as const).map((v) => ({ value: v, label: L.schemes[v] }))}
        />
      </Row>
      <Row label={L.accentColor}>
        <div className="xbd-swatches" role="radiogroup" aria-label={L.accentColor}>
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={prefs.accentColor.toLowerCase() === c}
              aria-label={c}
              className={cx('xbd-swatch', prefs.accentColor.toLowerCase() === c && 'is-active')}
              style={{ background: c }}
              onClick={() => api.setPreferences({ accentColor: c })}
            />
          ))}
          <input className="xbd-color-input" type="color" value={prefs.accentColor} title={L.customColor} aria-label={L.customColor} onChange={(e) => api.setPreferences({ accentColor: e.target.value })} />
        </div>
      </Row>
      <Row label={L.windowButtons}>
        <div className="xbd-settings__stack">
          <Segmented label={L.windowButtons} value={prefs.buttonSide} onChange={(buttonSide) => api.setPreferences({ buttonSide })} options={(['left', 'right'] as const).map((v) => ({ value: v, label: L.buttonSide[v] }))} />
          <Segmented label={L.windowButtons} value={prefs.buttonStyle} onChange={(buttonStyle) => api.setPreferences({ buttonStyle })} options={(['icons', 'dots'] as const).map((v) => ({ value: v, label: L.buttonStyle[v] }))} />
        </div>
      </Row>
      <Row label={L.iconSize}>
        <Segmented label={L.iconSize} value={prefs.iconSize} onChange={(iconSize) => api.setPreferences({ iconSize })} options={(['small', 'medium', 'large'] as const).map((v) => ({ value: v, label: labels.iconSizes[v] }))} />
      </Row>
    </section>
  );
}

function PanelSection() {
  const api = useDesktop();
  const { labels } = useDesktopConfig();
  const prefs = usePreferences();
  const L = labels.settings;
  return (
    <section>
      <Row label={L.panelPosition}>
        <Segmented label={L.panelPosition} value={prefs.panelPosition} onChange={(panelPosition) => api.setPreferences({ panelPosition })} options={(['top', 'bottom', 'left', 'right'] as const).map((v) => ({ value: v, label: L.positions[v] }))} />
      </Row>
    </section>
  );
}

function WorkspacesSection() {
  const api = useDesktop();
  const { labels } = useDesktopConfig();
  const prefs = usePreferences();
  const L = labels.settings;
  return (
    <section>
      <Row label={L.workspaceCount}>
        <Segmented
          label={L.workspaceCount}
          value={String(prefs.workspaces)}
          onChange={(v) => api.setPreferences({ workspaces: Number(v) })}
          options={['1', '2', '3', '4', '6'].map((v) => ({ value: v, label: v }))}
        />
      </Row>
    </section>
  );
}

function SettingsView({ options, args }: { options: SettingsAppOptions; args?: { section?: string } }) {
  const { labels } = useDesktopConfig();
  const L = labels.settings;
  const builtin: Record<string, SettingsSection> = {
    background: { id: 'background', title: L.background, icon: <ImageIcon />, render: () => <BackgroundSection /> },
    appearance: { id: 'appearance', title: L.appearance, icon: <PaletteIcon />, render: () => <AppearanceSection /> },
    panel: { id: 'panel', title: L.panel, icon: <PanelIcon />, render: () => <PanelSection /> },
    workspaces: { id: 'workspaces', title: L.workspaces, icon: <WorkspacesIcon />, render: () => <WorkspacesSection /> },
  };
  const sections = [...(options.sections ?? ['background', 'appearance', 'panel', 'workspaces']).map((id) => builtin[id]), ...(options.extraSections ?? [])];
  const [active, setActive] = useState(args?.section ?? sections[0]?.id);

  // Re-opening the app with `{ section }` jumps to that section.
  useEffect(() => {
    if (args?.section) setActive(args.section);
  }, [args]);

  const current = sections.find((s) => s.id === active) ?? sections[0];
  return (
    <div className="xbd-settings">
      <nav className="xbd-settings__nav" aria-label={L.title}>
        {sections.map((s) => (
          <button key={s.id} type="button" className={cx('xbd-settings__nav-item', s.id === current?.id && 'is-active')} aria-current={s.id === current?.id ? 'page' : undefined} onClick={() => setActive(s.id)}>
            {s.icon}
            <span>{s.title}</span>
          </button>
        ))}
      </nav>
      <div className="xbd-settings__content">
        <h2>{current?.title}</h2>
        {current?.render()}
      </div>
    </div>
  );
}

const SettingsGlyph = (
  <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
    <rect x="4" y="4" width="40" height="40" rx="10" fill="#6b7589" />
    <rect x="4" y="4" width="40" height="20" rx="10" fill="#ffffff" opacity=".08" />
    <path
      fill="#fff"
      d="M24 14.5l2 .3.6 2.6 1.9.8 2.3-1.4 2.8 2.8-1.4 2.3.8 1.9 2.6.6v4l-2.6.6-.8 1.9 1.4 2.3-2.8 2.8-2.3-1.4-1.9.8-.6 2.6h-4l-.6-2.6-1.9-.8-2.3 1.4-2.8-2.8 1.4-2.3-.8-1.9-2.6-.6v-4l2.6-.6.8-1.9-1.4-2.3 2.8-2.8 2.3 1.4 1.9-.8.6-2.6zM24 20a4 4 0 100 8 4 4 0 000-8z"
    />
  </svg>
);

/** Built-in settings app. Register it with `apps={[createSettingsApp(), ...]}`. */
export function createSettingsApp(options: SettingsAppOptions = {}): AppDefinition<{ section?: string }> {
  function SettingsApp({ args }: AppComponentProps<{ section?: string }>) {
    return <SettingsView options={options} args={args} />;
  }
  return {
    id: options.id ?? 'settings',
    title: options.title ?? 'Settings',
    icon: options.icon ?? SettingsGlyph,
    category: options.category,
    component: SettingsApp,
    window: { width: 760, height: 540, minWidth: 420, minHeight: 360, bare: true },
    keywords: ['wallpaper', 'theme', 'duvar kağıdı', 'tema', 'ayarlar', 'settings'],
  };
}

