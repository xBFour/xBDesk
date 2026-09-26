import { useEffect, useState } from 'react';
import { AppIcon, Icons, useContextMenu, useDesktop, useWindow, type AppComponentProps } from 'xbdesk';
import { HOME, basename, displayPath, isText, list, normalize, stat, useFsVersion, type FsNode } from '../fs';
import { DocumentsFolderIcon, FolderSmall, ImageFileIcon, ScriptFileIcon, TextFileIcon } from '../icons';

const PLACES = [
  { label: 'Ev', path: HOME },
  { label: 'Belgeler', path: `${HOME}/Belgeler` },
  { label: 'Resimler', path: `${HOME}/Resimler` },
  { label: 'İndirilenler', path: `${HOME}/İndirilenler` },
  { label: 'Müzik', path: `${HOME}/Müzik` },
];

function iconFor(n: FsNode) {
  if (n.type === 'dir') return n.name === 'Belgeler' ? DocumentsFolderIcon : FolderSmall;
  if (/\.(png|jpe?g|svg|gif|webp)$/i.test(n.name)) return ImageFileIcon;
  if (/\.sh$/i.test(n.name)) return ScriptFileIcon;
  return TextFileIcon;
}

export function FilesApp({ args }: AppComponentProps<{ path?: string }>) {
  useFsVersion();
  const api = useDesktop();
  const { setTitle, setRestoreArgs } = useWindow();
  const menu = useContextMenu();
  const [history, setHistory] = useState<string[]>([args?.path ?? HOME]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const cwd = history[index];
  const items = list(cwd);

  // Başka yerden (ör. masaüstü kısayolu) yeni bir yolla açılınca oraya git.
  useEffect(() => {
    if (args?.path) go(args.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args]);

  useEffect(() => {
    setTitle(`${basename(cwd) === 'kullanici' ? 'Ev' : basename(cwd)} — Dosyalar`);
    // Sayfa yenilenince pencere bu klasörde açılsın.
    setRestoreArgs({ path: cwd });
  }, [cwd, setTitle, setRestoreArgs]);

  function go(path: string) {
    const p = normalize(path);
    if (p === history[index]) return;
    setHistory((h) => [...h.slice(0, index + 1), p]);
    setIndex((i) => i + 1);
    setSelected(null);
  }

  const open = (n: FsNode) => {
    const path = `${cwd === '/' ? '' : cwd}/${n.name}`;
    if (n.type === 'dir') go(path);
    else if (isText(n.name)) api.openApp('editor', { path });
    else
      api.notify({
        title: 'Açılamadı',
        body: `"${n.name}" için bu demoda bir görüntüleyici yok.`,
        icon: iconFor(n),
      });
  };

  const crumbs = displayPath(cwd).split('/').filter(Boolean);

  return (
    <div className="demo-files">
      <aside className="demo-files__sidebar">
        {PLACES.map((p) => (
          <button key={p.path} type="button" className={cwd === p.path ? 'is-active' : ''} onClick={() => go(p.path)}>
            <AppIcon icon={p.path === HOME ? FolderSmall : DocumentsFolderIcon} size={18} />
            {p.label}
          </button>
        ))}
      </aside>
      <section className="demo-files__main">
        <header className="demo-files__toolbar">
          <button type="button" className="xbd-icon-button" aria-label="Geri" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            <Icons.ChevronLeftIcon />
          </button>
          <button type="button" className="xbd-icon-button" aria-label="İleri" disabled={index >= history.length - 1} onClick={() => setIndex((i) => i + 1)}>
            <Icons.ChevronRightIcon />
          </button>
          <nav className="demo-files__crumbs" aria-label="Konum">
            {crumbs.map((c, i) => {
              const target = i === 0 && c === '~' ? HOME : normalize(crumbs.slice(0, i + 1).join('/').replace(/^~/, HOME), '/');
              return (
                <button key={i} type="button" onClick={() => go(target)} className={i === crumbs.length - 1 ? 'is-current' : ''}>
                  {c === '~' ? 'Ev' : c}
                </button>
              );
            })}
          </nav>
        </header>
        <div
          className="demo-files__grid"
          onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          {items.map((n) => (
            <button
              key={n.name}
              type="button"
              className={selected === n.name ? 'is-selected' : ''}
              onClick={() => setSelected(n.name)}
              onDoubleClick={() => open(n)}
              onKeyDown={(e) => e.key === 'Enter' && open(n)}
              onContextMenu={menu(() => [
                { label: 'Aç', onSelect: () => open(n) },
                ...(n.type === 'file' && isText(n.name)
                  ? [{ label: 'Yeni pencerede düzenle', onSelect: () => api.openApp('editor', { path: `${cwd}/${n.name}` }) }]
                  : []),
                { type: 'separator' as const },
                {
                  label: 'Özellikler',
                  onSelect: () =>
                    api.notify({
                      title: n.name,
                      body: `${n.type === 'dir' ? `${n.children?.length ?? 0} öğe` : `${(n.content ?? '').length} bayt`} · ${new Date(n.modified).toLocaleString('tr-TR')}`,
                      icon: iconFor(n),
                    }),
                },
              ])}
            >
              <AppIcon icon={iconFor(n)} size={48} />
              <span>{n.name}</span>
            </button>
          ))}
          {!items.length && <p className="demo-files__empty">Bu klasör boş</p>}
        </div>
        <footer className="demo-files__status">
          {items.length} öğe{selected ? ` · "${selected}" seçili` : ''}
          <span>{stat(cwd) ? displayPath(cwd) : ''}</span>
        </footer>
      </section>
    </div>
  );
}
