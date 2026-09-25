import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDesktop, useWindow, type ColorScheme } from 'deskui';
import { HOME, displayPath, list, normalize, readFile, stat } from '../fs';
import { WALLPAPERS } from '../wallpapers';

interface Line {
  id: number;
  node: ReactNode;
}

const COMMANDS = ['help', 'ls', 'cd', 'pwd', 'cat', 'echo', 'date', 'whoami', 'uname', 'clear', 'neofetch', 'apps', 'open', 'notify', 'theme', 'accent', 'wallpaper', 'ws', 'exit'];

const startedAt = Date.now();

export function TerminalApp() {
  const api = useDesktop();
  const win = useWindow();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState(HOME);
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = (...nodes: ReactNode[]) =>
    setLines((l) => [...l, ...nodes.map((node) => ({ id: idRef.current++, node }))]);

  useEffect(() => {
    print(<span className="demo-term__muted">deskui terminali — komutlar için "help" yazın.</span>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const prompt = (path: string) => (
    <>
      <span className="demo-term__user">kullanici@deskui</span>:<span className="demo-term__path">{displayPath(path)}</span>$
    </>
  );

  const run = (raw: string) => {
    const line = raw.trim();
    print(
      <>
        {prompt(cwd)} {raw}
      </>,
    );
    if (!line) return;
    setHistory((h) => [...h, line]);
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');
    const s = api.getState();

    switch (cmd) {
      case 'help':
        print(
          <pre>{`Kullanılabilir komutlar:
  ls [yol]          klasör içeriği        cd <yol>      klasör değiştir
  cat <dosya>       dosya göster          pwd           geçerli klasör
  echo <metin>      yazdır                date          tarih/saat
  neofetch          sistem bilgisi        clear         ekranı temizle
  apps              uygulama listesi      open <id>     uygulama aç
  notify <metin>    bildirim gönder       theme light|dark|auto
  accent <#renk>    vurgu rengi           wallpaper [id] duvar kağıdı
  ws <n>            çalışma alanına geç   exit          pencereyi kapat`}</pre>,
        );
        break;
      case 'ls': {
        const target = normalize(arg || '.', cwd);
        const node = stat(target);
        if (!node) print(<span className="demo-term__err">ls: '{arg}' bulunamadı</span>);
        else if (node.type === 'file') print(node.name);
        else
          print(
            <div className="demo-term__ls">
              {list(target).map((n) => (
                <span key={n.name} className={n.type === 'dir' ? 'demo-term__dir' : ''}>
                  {n.name}
                  {n.type === 'dir' ? '/' : ''}
                </span>
              ))}
            </div>,
          );
        break;
      }
      case 'cd': {
        const target = normalize(arg || HOME, cwd);
        const node = stat(target);
        if (node?.type === 'dir') setCwd(target);
        else print(<span className="demo-term__err">cd: '{arg}' bir klasör değil</span>);
        break;
      }
      case 'pwd':
        print(cwd);
        break;
      case 'cat': {
        const content = readFile(normalize(arg, cwd));
        print(content === null ? <span className="demo-term__err">cat: '{arg}' okunamadı</span> : <pre>{content}</pre>);
        break;
      }
      case 'echo':
        print(arg);
        break;
      case 'date':
        print(new Date().toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' }));
        break;
      case 'whoami':
        print('kullanici');
        break;
      case 'uname':
        print('deskui 0.1.0 web-desktop react');
        break;
      case 'clear':
        setLines([]);
        break;
      case 'neofetch': {
        const up = Math.round((Date.now() - startedAt) / 1000);
        print(
          <div className="demo-term__neofetch">
            <pre className="demo-term__logo">{`┌──────────────────┐
│ ● ● ●            │
│  ▄▄▄▄   ▄▄▄▄▄▄▄  │
│  ████   ███████  │
│  ████   ███████  │
└────────┬─────────┘
      ───┴───`}</pre>
            <pre>
              <span className="demo-term__user">kullanici@deskui</span>
              {`
----------------
İS: deskui 0.1.0 (web)
Çekirdek: React
Uptime: ${Math.floor(up / 60)} dk ${up % 60} sn
Çözünürlük: ${s.viewport.width}x${s.viewport.height}
Tema: ${s.preferences.colorScheme} · ${s.preferences.accentColor}
Pencereler: ${Object.keys(s.windows).length}
Çalışma alanı: ${s.activeWorkspace + 1}/${s.preferences.workspaces}
Uygulamalar: ${api.getApps().length}`}
            </pre>
          </div>,
        );
        break;
      }
      case 'apps':
        print(<pre>{api.getApps().map((a) => `${a.id.padEnd(12)} ${a.title}`).join('\n')}</pre>);
        break;
      case 'open':
        if (!api.getApp(arg)) print(<span className="demo-term__err">open: '{arg}' diye bir uygulama yok ("apps" yazın)</span>);
        else api.openApp(arg);
        break;
      case 'notify':
        api.notify({ title: 'Terminal', body: arg || 'Merhaba!', timeout: 4000 });
        break;
      case 'theme':
        if (['light', 'dark', 'auto'].includes(arg)) api.setPreferences({ colorScheme: arg as ColorScheme });
        else print('kullanım: theme light|dark|auto');
        break;
      case 'accent':
        if (/^#[0-9a-f]{3,6}$/i.test(arg)) api.setPreferences({ accentColor: arg });
        else print('kullanım: accent #e62d42');
        break;
      case 'wallpaper':
        if (!arg) print(<pre>{WALLPAPERS.map((w) => `${w.id.padEnd(10)} ${w.name}`).join('\n')}</pre>);
        else if (WALLPAPERS.some((w) => w.id === arg)) api.setWallpaper({ type: 'preset', id: arg });
        else print(<span className="demo-term__err">wallpaper: '{arg}' bulunamadı</span>);
        break;
      case 'ws': {
        const n = Number(arg);
        if (n >= 1 && n <= s.preferences.workspaces) api.switchWorkspace(n - 1);
        else print(`kullanım: ws 1..${s.preferences.workspaces}`);
        break;
      }
      case 'exit':
        void win.close();
        break;
      default:
        print(<span className="demo-term__err">{cmd}: komut bulunamadı</span>);
    }
  };

  return (
    <div className="demo-term" onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}>
      {lines.map((l) => (
        <div key={l.id} className="demo-term__line">
          {l.node}
        </div>
      ))}
      <form
        className="demo-term__input"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
          setInput('');
          setHIndex(-1);
        }}
      >
        <label htmlFor={`${win.id}-cmd`}>{prompt(cwd)}</label>
        <input
          id={`${win.id}-cmd`}
          ref={inputRef}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' && history.length) {
              e.preventDefault();
              const i = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
              setHIndex(i);
              setInput(history[i]);
            } else if (e.key === 'ArrowDown' && hIndex >= 0) {
              e.preventDefault();
              const i = hIndex + 1;
              setHIndex(i >= history.length ? -1 : i);
              setInput(i >= history.length ? '' : history[i]);
            } else if (e.key === 'Tab') {
              e.preventDefault();
              const [cmd, ...rest] = input.split(' ');
              const pool = rest.length ? (cmd === 'open' ? api.getApps().map((a) => a.id) : cmd === 'wallpaper' ? WALLPAPERS.map((w) => w.id) : []) : COMMANDS;
              const partial = rest.length ? rest.join(' ') : cmd;
              const match = pool.filter((c) => c.startsWith(partial));
              if (match.length === 1) setInput(rest.length ? `${cmd} ${match[0]}` : `${match[0]} `);
              else if (match.length > 1) print(match.join('  '));
            } else if (e.key === 'l' && e.ctrlKey) {
              e.preventDefault();
              setLines([]);
            }
          }}
        />
      </form>
      <div ref={endRef} />
    </div>
  );
}
