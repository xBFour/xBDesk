import { lazy, useMemo, useState, useSyncExternalStore } from 'react';
import {
  AppMenuButton,
  Clock,
  ColorSchemeToggle,
  Desktop,
  DesktopWidget,
  LoginScreen,
  Panel,
  PanelSpacer,
  ShowDesktopButton,
  SystemTray,
  UserMenu,
  WindowList,
  WorkspaceSwitcher,
  createSettingsApp,
  useDesktop,
  useNow,
  type AppDefinition,
  type DesktopShortcut,
} from 'xbdesk';
import { createRouterApp } from 'xbdesk/react-router';
import { CalculatorApp } from './apps/Calculator';
import { ComponentsApp } from './apps/Components';
import { ProfileApp } from './apps/Profile';
import { CONTACTS, contactRoutes } from './apps/Contacts';
import { FilesApp } from './apps/Files';
import { TerminalApp } from './apps/Terminal';
import { TextEditorApp } from './apps/TextEditor';
import { WelcomeApp } from './apps/Welcome';
import { HOME } from './fs';
import { CalculatorIcon, ComponentsIcon, ContactsIcon, DocumentsFolderIcon, EditorIcon, FilesIcon, MonitorIcon, TerminalIcon, TextFileIcon, WelcomeIcon } from './icons';
import { WALLPAPERS } from './wallpapers';
import { DEMO_USERS, DemoUserProvider, loadUser, saveUser, useDemoUser, type DemoUser } from './session';

/* ------------------------- demo: masaüstü düzeni ------------------------- */

type Layout = 'classic' | 'floating' | 'gnome' | 'vertical';
const LAYOUT_KEY = 'xbdesk-demo-layout';
const layoutListeners = new Set<() => void>();
let layout: Layout = (() => {
  try {
    return (localStorage.getItem(LAYOUT_KEY) as Layout) || 'classic';
  } catch {
    return 'classic';
  }
})();
const setLayout = (next: Layout) => {
  layout = next;
  try {
    localStorage.setItem(LAYOUT_KEY, next);
  } catch {
    /* depolama kapalı olabilir */
  }
  layoutListeners.forEach((l) => l());
};
const useLayout = () =>
  useSyncExternalStore(
    (l) => {
      layoutListeners.add(l);
      return () => layoutListeners.delete(l);
    },
    () => layout,
  );

const LAYOUTS: Array<{ id: Layout; name: string; description: string }> = [
  { id: 'classic', name: 'Klasik', description: 'Tek panel; konumu "Panel" bölümünden seçilir (KDE / Cinnamon).' },
  { id: 'floating', name: 'Yüzen panel', description: 'Kenardan ayrık, yuvarlak köşeli alt panel (Plasma 6).' },
  { id: 'gnome', name: 'GNOME tarzı', description: 'Üstte etkinlikler + ortada saat, altta yüzen dock.' },
  { id: 'vertical', name: 'Dikey', description: 'Solda dar, dikey panel (Unity / Ubuntu).' },
];

function LayoutSection() {
  const current = useLayout();
  return (
    <div className="demo-layouts" role="radiogroup" aria-label="Masaüstü düzeni">
      {LAYOUTS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={current === l.id} className={current === l.id ? 'is-active' : ''} onClick={() => setLayout(l.id)}>
          <span className={`demo-layouts__preview demo-layouts__preview--${l.id}`} aria-hidden="true">
            <i />
            <i />
          </span>
          <strong>{l.name}</strong>
          <small>{l.description}</small>
        </button>
      ))}
    </div>
  );
}

interface SessionActions {
  onLock: () => void;
  onLogout: () => void;
}

function DemoUserMenu({ onLock, onLogout }: SessionActions) {
  const api = useDesktop();
  const user = useDemoUser();
  return (
    <UserMenu
      name={user.name}
      email={user.email}
      role={user.role}
      onProfile={() => api.openApp('profile')}
      onSettings={() => api.openApp('settings')}
      onLock={onLock}
      onLogout={onLogout}
    />
  );
}

function DemoPanels(session: SessionActions) {
  const current = useLayout();
  const tray = (
    <SystemTray>
      <ColorSchemeToggle />
      <DemoUserMenu {...session} />
    </SystemTray>
  );
  if (current === 'gnome') {
    return (
      <>
        <Panel position="top" size={34} className="demo-topbar">
          <AppMenuButton showLabel label="Etkinlikler" />
          <WorkspaceSwitcher />
          <PanelSpacer />
          <Clock timeFormat={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
          <PanelSpacer />
          {tray}
          <ShowDesktopButton />
        </Panel>
        <Panel position="bottom" size={54} floating className="demo-dock">
          <WindowList showLabels={false} />
          <AppMenuButton />
        </Panel>
      </>
    );
  }
  if (current === 'vertical') {
    return (
      <Panel position="left" size={58}>
        <AppMenuButton />
        <WindowList />
        <WorkspaceSwitcher />
        {tray}
        <Clock />
        <ShowDesktopButton />
      </Panel>
    );
  }
  if (current === 'floating') {
    return (
      <Panel floating size={48}>
        <AppMenuButton />
        <WindowList />
        <WorkspaceSwitcher />
        {tray}
        <Clock showDate />
        <ShowDesktopButton />
      </Panel>
    );
  }
  return (
    <Panel>
      <AppMenuButton />
      <WindowList />
      <WorkspaceSwitcher />
      {tray}
      <Clock showDate />
      <ShowDesktopButton />
    </Panel>
  );
}

/* --------------------------- masaüstü widget'ı --------------------------- */

function ClockWidget() {
  const now = useNow(1000);
  return (
    <div className="demo-clock-widget" aria-hidden="true">
      <div className="demo-clock-widget__time">{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="demo-clock-widget__date">{now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    </div>
  );
}

/* --------------------------------- demo ---------------------------------- */

// Tembel yüklenen uygulama örneği: pencere Suspense ile "Yükleniyor…" gösterir.
const SystemMonitorApp = lazy(() =>
  Promise.all([import('./apps/SystemMonitor'), new Promise((r) => setTimeout(r, 450))]).then(([m]) => ({ default: m.SystemMonitorApp })),
);

function CrashApp() {
  // Hata sınırları yalnızca render sırasında atılan hataları yakalar; bu yüzden hatayı state ile render'a taşıyoruz.
  const [crashed, setCrashed] = useState(false);
  if (crashed) throw new Error('Demo: kasıtlı hata');
  return (
    <div className="demo-crash">
      <p>Bu uygulama, pencere başına hata sınırını (error boundary) göstermek için var. Çökse bile masaüstü çalışmaya devam eder.</p>
      <button type="button" className="xbd-button xbd-button--primary" onClick={() => setCrashed(true)}>
        Uygulamayı çökert
      </button>
    </div>
  );
}

function DemoDesktop(session: SessionActions) {
  const apps = useMemo<AppDefinition[]>(
    () => [
      { id: 'welcome', title: 'Hoş geldiniz', icon: WelcomeIcon, component: WelcomeApp, category: 'Başlangıç', window: { width: 700, height: 580 } },
      { id: 'files', title: 'Dosyalar', icon: FilesIcon, component: FilesApp, category: 'Donatılar', keywords: ['dosya', 'klasör', 'files'], window: { width: 820, height: 520, minWidth: 460, bare: true } },
      { id: 'terminal', title: 'Terminal', icon: TerminalIcon, component: TerminalApp, category: 'Sistem', singleInstance: false, keywords: ['konsol', 'shell'], window: { width: 720, height: 440, bare: true } },
      { id: 'editor', title: 'Metin Düzenleyici', icon: EditorIcon, component: TextEditorApp, category: 'Donatılar', singleInstance: false, keywords: ['not', 'text'], window: { width: 680, height: 500, bare: true } },
      { id: 'calculator', title: 'Hesap Makinesi', icon: CalculatorIcon, component: CalculatorApp, category: 'Donatılar', window: { width: 320, height: 480, resizable: false, maximizable: false, bare: true } },
      { id: 'monitor', title: 'Sistem İzleyici', icon: MonitorIcon, component: SystemMonitorApp, category: 'Sistem', window: { width: 560, height: 540 } },
      {
        ...createSettingsApp({
        title: 'Ayarlar',
        category: 'Sistem',
        extraSections: [
          {
            id: 'layout',
            title: 'Masaüstü düzeni',
            icon: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
                <path d="M2 5.5h12M5.5 5.5v8" />
              </svg>
            ),
            render: () => <LayoutSection />,
          },
        ],
        }),
      },
      createRouterApp({
        id: 'contacts',
        title: 'Rehber',
        icon: ContactsIcon,
        category: 'Donatılar',
        keywords: ['kişi', 'router'],
        singleInstance: false,
        path: '/kisiler',
        element: contactRoutes,
        windowTitle: (loc) => {
          const c = CONTACTS.find((x) => loc.pathname === `/kisiler/${x.id}`);
          return c ? `${c.name} — Rehber` : 'Rehber';
        },
        window: { width: 520, height: 520, bare: true },
      }),
      { id: 'components', title: 'Bileşenler', icon: ComponentsIcon, component: ComponentsApp, category: 'Başlangıç', keywords: ['component', 'ui', 'tablo', 'form'], window: { width: 1040, height: 680, minWidth: 560, bare: true } },
      { id: 'profile', title: 'Profil', component: ProfileApp, category: 'Sistem', showOnDesktop: false, keywords: ['hesap', 'şifre', 'kullanıcı'], window: { width: 760, height: 640, minWidth: 480 } },
      { id: 'crash', title: 'Çökme testi', component: CrashApp, category: 'Geliştirici', window: { width: 420, height: 260 } },
    ],
    [],
  );

  const shortcuts = useMemo<DesktopShortcut[]>(
    () => [
      // Gruplar (klasörler): içindeki uygulamalar klasör penceresinde simge olarak açılır.
      { id: 'grp-tools', title: 'Araçlar', color: '#e5a50a', items: ['calculator', 'editor', 'terminal'] },
      { id: 'grp-system', title: 'Sistem', color: '#6f8396', items: ['settings', 'monitor', 'crash'] },
      { id: 'docs', title: 'Belgeler', icon: DocumentsFolderIcon, appId: 'files', args: { path: `${HOME}/Belgeler` } },
      { id: 'readme', title: 'beni-oku.txt', icon: TextFileIcon, appId: 'editor', args: { path: `${HOME}/beni-oku.txt` } },
    ],
    [],
  );

  return (
    <Desktop
      apps={apps}
      shortcuts={shortcuts}
      wallpapers={WALLPAPERS}
      persistKey="xbdesk-demo"
      locale="tr"
      fullscreen
      defaultPreferences={{ wallpaper: { type: 'preset', id: 'aurora' }, workspaces: 4 }}
      onReady={(api) => {
        if (!Object.keys(api.getState().windows).length) api.openApp('welcome');
      }}
    >
      <DemoPanels {...session} />
      <DesktopWidget position={{ top: 28, right: 36 }} style={{ pointerEvents: 'none' }}>
        <ClockWidget />
      </DesktopWidget>
    </Desktop>
  );
}

/* ------------------------------ giriş / kilit ----------------------------- */

const LOGIN_BG = WALLPAPERS[0].wallpaper;

export function App() {
  const [user, setUser] = useState<DemoUser | null>(loadUser);
  const [locked, setLocked] = useState(false);

  const login = ({ username, password }: { username: string; password: string }) => {
    // Demo: gerçek doğrulama yok. "hata" şifresi hata durumunu göstermek için reddedilir.
    if (password === 'hata') return 'Şifre hatalı. (Demo: "hata" dışındaki her şifre kabul edilir.)';
    const found = DEMO_USERS.find((u) => u.username === username) ?? { name: username, username, email: `${username}@example.com`, role: 'Kullanıcı' };
    saveUser(found);
    setUser(found);
  };

  if (!user) {
    return (
      <LoginScreen
        title="xBDesk"
        subtitle="Demo: bir kullanıcı seçin, herhangi bir şifreyle girin"
        users={DEMO_USERS}
        background={LOGIN_BG}
        locale="tr"
        onLogin={login}
        footer="xBDesk — React için masaüstü arayüz kiti"
      />
    );
  }

  return (
    <DemoUserProvider value={user}>
      <DemoDesktop
        onLock={() => setLocked(true)}
        onLogout={() => {
          saveUser(null);
          setUser(null);
          setLocked(false);
        }}
      />
      {locked && <LoginScreen mode="unlock" user={user} background={LOGIN_BG} locale="tr" onLogin={() => setLocked(false)} />}
    </DemoUserProvider>
  );
}
