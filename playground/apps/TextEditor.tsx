import { useEffect, useRef, useState } from 'react';
import { useCloseGuard, useDesktop, useWindow, type AppComponentProps } from 'xbdesk';
import { HOME, basename, readFile, writeFile } from '../fs';

export function TextEditorApp({ args }: AppComponentProps<{ path?: string }>) {
  const api = useDesktop();
  const { setTitle, setRestoreArgs } = useWindow();
  const [path, setPath] = useState<string | null>(args?.path ?? null);
  const [text, setText] = useState(() => (args?.path ? readFile(args.path) ?? '' : ''));
  const [saved, setSaved] = useState(text);
  const [confirm, setConfirm] = useState<((ok: boolean) => void) | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = text !== saved;
  const name = path ? basename(path) : 'Adsız belge';

  useEffect(() => {
    setTitle(`${dirty ? '● ' : ''}${name} — Metin Düzenleyici`);
  }, [dirty, name, setTitle]);

  // Yeni belge ilk kez kaydedilince yenilemede o dosyayla açılsın.
  useEffect(() => {
    if (path) setRestoreArgs({ path });
  }, [path, setRestoreArgs]);

  // Kaydedilmemiş değişiklik varsa kapatmadan önce pencere içinde onay iste (asenkron guard).
  useCloseGuard(() => {
    if (!dirty) return true;
    return new Promise<boolean>((resolve) => setConfirm(() => resolve));
  });

  const save = () => {
    let target = path;
    if (!target) {
      target = `${HOME}/Belgeler/not-${new Date().toISOString().slice(0, 10)}.txt`;
      setPath(target);
    }
    writeFile(target, text);
    setSaved(text);
    api.notify({ title: 'Kaydedildi', body: basename(target), timeout: 2500 });
  };

  const answer = (ok: boolean) => {
    confirm?.(ok);
    setConfirm(null);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;

  return (
    <div className="demo-editor">
      <header className="demo-editor__toolbar">
        <button type="button" className="xbd-button xbd-button--small" onClick={() => api.openApp('editor')}>
          Yeni
        </button>
        <button type="button" className="xbd-button xbd-button--small xbd-button--primary" onClick={save} disabled={!dirty && !!path}>
          Kaydet
        </button>
        <span className="demo-editor__path">{path ?? '—'}</span>
      </header>
      <textarea
        ref={areaRef}
        autoFocus
        spellCheck={false}
        value={text}
        placeholder="Yazmaya başlayın…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            save();
          }
        }}
      />
      <footer className="demo-editor__status">
        <span>{lines} satır · {words} kelime · {text.length} karakter</span>
        <span>{dirty ? 'Kaydedilmedi' : 'Kaydedildi'}</span>
      </footer>
      {confirm && (
        <div className="demo-dialog" role="alertdialog" aria-labelledby="demo-dialog-title">
          <div className="demo-dialog__box">
            <h3 id="demo-dialog-title">Değişiklikler kaydedilsin mi?</h3>
            <p>"{name}" belgesinde kaydedilmemiş değişiklikler var.</p>
            <div className="demo-dialog__actions">
              <button type="button" className="xbd-button" onClick={() => answer(false)}>
                İptal
              </button>
              <button type="button" className="xbd-button" onClick={() => answer(true)}>
                Kaydetmeden kapat
              </button>
              <button
                type="button"
                className="xbd-button xbd-button--primary"
                autoFocus
                onClick={() => {
                  save();
                  answer(true);
                }}
              >
                Kaydet ve kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
