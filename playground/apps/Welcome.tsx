import { useDesktop } from 'xbdesk';

const SNIPPET = `import { Desktop, createSettingsApp } from 'xbdesk';
import 'xbdesk/style.css';

const apps = [
  createSettingsApp({ title: 'Ayarlar' }),
  {
    id: 'customers',
    title: 'Müşteriler',
    icon: '/icons/customers.svg',
    component: lazy(() => import('./CustomersPage')),
    window: { width: 960, height: 620 },
  },
];

<Desktop apps={apps} persistKey="my-desktop" locale="tr" />`;

export function WelcomeApp() {
  const api = useDesktop();
  return (
    <div className="demo-welcome">
      <h1>xBDesk'e hoş geldiniz</h1>
      <p className="demo-welcome__lead">
        React projeleri için Linux masaüstü tarzı arayüz kiti: pencere yöneticisi, masaüstü simgeleri, panel, uygulama menüsü, saat, bildirimler,
        çalışma alanları, duvar kağıdı ve tema — hepsi tek bileşenle.
      </p>
      <div className="demo-welcome__actions">
        <button type="button" className="xbd-button xbd-button--primary" onClick={() => api.openApp('settings', { section: 'background' })}>
          Duvar kağıdını değiştir
        </button>
        <button type="button" className="xbd-button" onClick={() => api.openApp('terminal')}>
          Terminali aç
        </button>
        <button type="button" className="xbd-button" onClick={() => api.notify({ title: 'Merhaba 👋', body: 'Bu bir masaüstü bildirimi.', actions: [{ label: 'Dosyaları aç', onClick: () => api.openApp('files') }] })}>
          Bildirim gönder
        </button>
      </div>
      <h2>Deneyin</h2>
      <ul>
        <li>Pencereyi başlığından tutup ekranın <b>sol/sağ kenarına</b> sürükleyin: yarım ekrana yaslanır. <b>Üst kenar</b> ekranı kaplar.</li>
        <li>Kenar ve köşelerden boyutlandırın, başlığa <b>çift tıklayıp</b> büyütün.</li>
        <li>Masaüstünde <b>sağ tıklayın</b>; simgeleri sürükleyip ızgarada yerleştirin, boş alanda sürükleyerek çoklu seçin.</li>
        <li>Paneldeki <b>1-4</b> düğmeleri çalışma alanlarıdır (Ctrl+Alt+←/→ da çalışır).</li>
        <li>Ayarlar → <b>Masaüstü düzeni</b>'nden GNOME tarzı üst çubuk veya dikey panel seçin.</li>
        <li>Metin Düzenleyici'de değişiklik yapıp kapatmayı deneyin: uygulama kapanışı <b>engelleyebilir</b>.</li>
      </ul>
      <h2>Kullanım</h2>
      <pre className="demo-welcome__code">{SNIPPET}</pre>
    </div>
  );
}
