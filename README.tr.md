<div align="center">

# xBDesk

**React web uygulamaları için Linux masaüstü tarzı kabuk ve arayüz kiti.**

Sayfalar pencereye, menü grupları klasöre dönüşür; uygulamanız gerçek bir masaüstüne kavuşur —
duvar kağıdı, panel, saat, çalışma alanları — ve pencerelerin içini kuracak bileşenler de hazır.

[![Lisans: MIT](https://img.shields.io/badge/lisans-MIT-3584e4.svg)](LICENSE)
![React 18 · 19](https://img.shields.io/badge/react-18%20%C2%B7%2019-61dafb.svg)
![TypeScript](https://img.shields.io/badge/tipler-TypeScript-3178c6.svg)
![Sıfır bağımlılık](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-0-2ec27e.svg)
![Boyut](https://img.shields.io/badge/gzip-48%20kB%20JS%20%2B%2010%20kB%20CSS-6f8396.svg)

[![Canlı demo](https://img.shields.io/badge/%E2%96%B6%20canl%C4%B1%20demo-xbfour.github.io%2FxBDesk-3584e4?style=for-the-badge)](https://xbfour.github.io/xBDesk/)

<sub>Giriş ekranında bir kullanıcı seçin — her şifre geçerli (<code>hata</code> yazarsanız hata durumunu görürsünüz).</sub>

[English](README.md) · **Türkçe**

<img src=".github/assets/demo.gif" alt="Uygulama açma, pencereyi kenara yapıştırma, masaüstü klasörü, koyu tema ve uygulama menüsü" width="880">

</div>

## Neden

Yönetim panelleri, ERP'ler ve şirket içi araçlar zamanla uzun bir yan menünün arkasında onlarca
sayfaya dönüşür ve kullanıcı aynı anda yalnız birine bakabilir. xBDesk bu sayfaları **masaüstünde
pencereler** hâline getirir: fatura girerken raporu açık tutun, iki müşteriyi yan yana karşılaştırın,
kullanmadığınızı küçültün. Her pencere kendi adresini, kaydırma konumunu ve form durumunu korur;
sayfa yenilendiğinde açık pencereler geri gelir.

Tek bileşendir — `<Desktop>` — ve çalışma zamanında hiçbir bağımlılığı yoktur. Pencerelerin içi
tamamen sizin React kodunuzdur: xBDesk bunun için bir bileşen kütüphanesiyle gelir ama Tailwind,
shadcn/ui, MUI gibi herhangi bir kit de aynı şekilde çalışır.

## Ekran görüntüleri

<table>
  <tr>
    <td width="50%"><img src=".github/assets/hero.webp" alt="Tablo penceresi ve hesap makinesi olan masaüstü"><br><sub><b>Masaüstü</b> — pencereler, simgeler, klasörler, panel ve saat</sub></td>
    <td width="50%"><img src=".github/assets/dark.webp" alt="Uygulama menüsü açık, koyu tema"><br><sub><b>Koyu tema ve uygulama menüsü</b> — arama, kategoriler, klavye</sub></td>
  </tr>
  <tr>
    <td><img src=".github/assets/table.webp" alt="Pencere içi diyaloglu tablo"><br><sub><b>Tablo</b> — sıralama, seçim, sayfalama; diyalog yalnız kendi penceresini karartır</sub></td>
    <td><img src=".github/assets/server.webp" alt="Filtreli sunucu tablosu"><br><sub><b>Sunucu taraflı tablo</b> — her sayfa tek istek, eski istekler iptal</sub></td>
  </tr>
  <tr>
    <td><img src=".github/assets/datepicker.webp" alt="Hazır aralıklı, iki aylık tarih aralığı seçici"><br><sub><b>Tarih aralığı seçici</b> — hazır aralıklar, iki ay, yazarak giriş</sub></td>
    <td><img src=".github/assets/folders.webp" alt="Açık iki masaüstü klasörü"><br><sub><b>Klasörler</b> — sayfaları menü gibi gruplayın, iç içe koyun</sub></td>
  </tr>
  <tr>
    <td><img src=".github/assets/login.webp" alt="Kullanıcı kutucuklu giriş ekranı"><br><sub><b>Giriş ve kilit ekranı</b> — hesap kutucukları, hata mesajı, şifreyi göster</sub></td>
    <td><img src=".github/assets/account.webp" alt="Profil penceresi ve kullanıcı menüsü"><br><sub><b>Kullanıcı menüsü ve profil</b> — kitin kendi bileşenleriyle</sub></td>
  </tr>
  <tr>
    <td><img src=".github/assets/settings.webp" alt="Duvar kağıtlarıyla ayarlar uygulaması"><br><sub><b>Ayarlar uygulaması</b> — duvar kağıdı, tema, vurgu rengi, panel, çalışma alanları</sub></td>
    <td><img src=".github/assets/combobox.webp" alt="Çipli, gruplu ve eşleşmeleri vurgulayan aranabilir açılır liste"><br><sub><b>Aranabilir açılır liste</b> — sunucudan arama, çipler, gruplar, eşleşme vurgusu</sub></td>
  </tr>
</table>

## Özellikler

**Masaüstü**

- **Pencere yöneticisi** — sürükleme, boyutlandırma, ekranın yarısına yapıştırma, büyütme, küçültme, basamaklı açılış; bir penceredeki çökme diğerlerini etkilemez; `React.lazy` sayfalar pencere açılınca yüklenir; kaydedilmemiş değişiklikler için kapatma koruması.
- **Masaüstü simgeleri ve klasörler** — sürükleyip dizme, alan seçimi, klavyeyle gezinme; klasörler (istediğiniz derinlikte iç içe) kendi penceresinde açılır.
- **Panel** — aramalı ve kategorili uygulama menüsü, görev çubuğu, çalışma alanları, sistem tepsisi, takvimli saat, bildirimler. Ekranın her kenarında, yüzen ya da sabit — ya da parçalardan kendi panelinizi kurun.
- **Duvar kağıdı ve tema** — resim, renk, gradyan ya da herhangi bir React düğümü; açık, koyu ya da otomatik; vurgu rengi; tüm yüzeyler CSS değişkeni.
- **Pencere başına yönlendirme** — her pencere kendi bellek içi `react-router`'ını (v6.4+ / v7) alır: bağlantılar ve `useParams` içeride çalışır, tarayıcı adresi hiç değişmez. Mevcut rota ağacınızı olduğu gibi kullanın.
- **Oturumu geri yükleme** — tercihler ve açık pencereler (adresleriyle) yenilemede kalır; kullanıcı başına sunucuda saklamak için kendi depolamanızı verin.
- **Hazır ayarlar uygulaması**, sağ tık menüleri, klavye kısayolları (Ctrl+Alt+←/→ çalışma alanı değiştirir).

**Bileşenler**

| | |
|---|---|
| Temel | `Button` `IconButton` `Badge` `Card` `Avatar` `Alert` `Progress` `Spinner` `EmptyState` `Toolbar` |
| Form | `Field` `Input` `Textarea` `Select` `Combobox` `Checkbox` `Switch` `RadioGroup` `SegmentedControl` — `Combobox` statik listede ya da sunucunuzda arar, tekli veya çoklu |
| Tarih | `DatePicker` `DateRangePicker` `DateCalendar` — yazarak giriş, klavye, min/max, kapalı günler, hazır aralıklar |
| Veri | `DataTable` (istemci ya da sunucu taraflı) + `useServerTable`, `Pagination`, `Tabs` |
| Katman | `Dialog` (pencere içi ya da masaüstü geneli), `useConfirm`, `Tooltip` |
| Düzen | `SidebarLayout` |
| Hesap | `LoginScreen` (giriş ve kilit ekranı), `UserMenu` |

- **Çok dilli** — İngilizce, Türkçe ve Almanca hazır; her etiket değiştirilebilir; ay adları, tarih biçimi ve haftanın ilk günü `Intl`'den gelir.
- **Erişilebilir** — gerçek düğme ve giriş alanları, etiketli form alanları, diyaloglarda odak kapanı, ızgara ve menülerde klavyeyle gezinme.
- **Sıfır bağımlılık** — eş bağımlılıklar `react` ve `react-dom` ≥ 18.2; `react-router-dom` ≥ 6.4 yalnız yönlendirme adaptörünü kullanırsanız.

## Kurulum

xBDesk henüz npm'de değil. Doğrudan GitHub'dan kurun (paket kurulurken kendini derler):

```bash
npm install github:xBFour/xBDesk
```

ya da bir paket dosyası üretip onu kurun — GitHub erişimi olmayan sunucular için pratik:

```bash
git clone https://github.com/xBFour/xBDesk && cd xBDesk
npm install && npm pack            # → xbdesk-0.1.0.tgz
cd ../uygulamaniz && npm install ../xBDesk/xbdesk-0.1.0.tgz
```

## Hızlı başlangıç

```tsx
import { lazy } from 'react';
import { Desktop, createSettingsApp, defineApp, type DesktopShortcut } from 'xbdesk';
import 'xbdesk/style.css';

const apps = [
  defineApp({
    id: 'customers',
    title: 'Müşteriler',
    icon: '/icons/customers.svg', // resim adresi ya da herhangi bir React düğümü
    component: lazy(() => import('./CustomersPage')), // pencere açılınca yüklenir
    window: { width: 960, height: 620 },
  }),
  defineApp({ id: 'invoices', title: 'Faturalar', icon: <InvoiceIcon />, component: InvoicesPage }),
  createSettingsApp({ title: 'Ayarlar' }), // duvar kağıdı, tema, panel, çalışma alanları
];

// Menü grupları masaüstünde klasör olur (metinler uygulama kimliğidir).
const shortcuts: DesktopShortcut[] = [{ id: 'sales', title: 'Satış', color: '#e5a50a', items: ['customers', 'invoices'] }];

export default function App() {
  return <Desktop apps={apps} shortcuts={shortcuts} persistKey="uygulamam" locale="tr" />;
}
```

`<Desktop>` varsayılan olarak tüm ekranı kaplar. Bir kapsayıcıyı doldurmasını istiyorsanız
`fullscreen={false}` verin (kapsayıcının bir yüksekliği olmalı). Klasöre konan uygulama ayrıca
masaüstü simgesi almaz — ikisini birden istiyorsanız `showOnDesktop: true` verin.

## Tarifler

<details>
<summary><b>Rotalı sayfalar</b> — her pencereye bir router</summary>

```tsx
import { Route, Routes } from 'react-router-dom';
import { createRouterApp } from 'xbdesk/react-router';

export const ordersApp = createRouterApp({
  id: 'orders',
  title: 'Siparişler',
  path: '/orders',
  element: (
    <Routes>
      <Route path="/orders" element={<OrderList />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
    </Routes>
  ),
  windowTitle: (location) => (location.pathname.startsWith('/orders/') ? `Sipariş ${location.pathname.split('/').pop()}` : null),
});
```

Belirli bir sayfayı `desktop.openApp('orders', { path: '/orders/1042' })` ile açın. Uygulamanız
zaten router kullanıyorsa bütün rota ağacını `element` olarak verin; her sayfa, yetki kontrolleri
dahil, pencerede çalışır.

</details>

<details>
<summary><b>Pencerenin içinden masaüstüyle konuşmak</b></summary>

```tsx
import { useState } from 'react';
import { Button, useCloseGuard, useConfirm, useDesktop, useWindow } from 'xbdesk';

export function InvoiceEditor() {
  const win = useWindow();
  const desktop = useDesktop();
  const { confirm, dialog } = useConfirm();
  const [dirty, setDirty] = useState(false);

  // Pencere kapanmadan önce sorulur (başlıktaki ×, görev çubuğu, desktop.requestClose…)
  useCloseGuard(() => !dirty || confirm({ title: 'Değişiklikler silinsin mi?', danger: true }));

  const save = () => {
    setDirty(false);
    win.setTitle('Fatura #1042');
    desktop.notify({ title: 'Kaydedildi', body: 'Fatura #1042' });
  };

  return (
    <>
      <Button onClick={() => setDirty(true)}>Düzenle</Button>
      <Button variant="primary" onClick={save}>Kaydet</Button>
      <Button onClick={() => desktop.openApp('customers', { id: 42 })}>Müşteriyi aç</Button>
      {dialog}
    </>
  );
}
```

`useDesktop()` denetleyicinin tamamını verir — pencere açma, öne getirme, yapıştırma, kapatma,
çalışma alanı değiştirme, tercihler, bildirimler. Aynı API'ye dışarıdan `<Desktop ref={…}>` ile
ulaşılır.

</details>

<details>
<summary><b>Sunucu taraflı tablo</b> — sayfalama, sıralama ve filtre sunucuda</summary>

```tsx
import { useState } from 'react';
import { DataTable, Input, useServerTable, type DataColumn } from 'xbdesk';

const columns: DataColumn<Order>[] = [
  { key: 'no', header: 'Sipariş', nowrap: true },
  { key: 'customer', header: 'Müşteri' },
  { key: 'total', header: 'Tutar', align: 'right', cell: (r) => r.total.toLocaleString('tr-TR') },
];

export function Orders() {
  const [q, setQ] = useState('');
  const table = useServerTable<Order>({
    fetch: async ({ page, pageSize, sort, signal }) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), q });
      if (sort) params.set('sort', `${sort.key}:${sort.dir}`);
      const res = await fetch(`/api/orders?${params}`, { signal });
      if (!res.ok) throw new Error(`Sunucu hatası ${res.status}`);
      return res.json(); // { rows: Order[], total: number }
    },
    deps: [q], // arama değişince 1. sayfaya döner
    debounce: 300,
  });

  return (
    <>
      <Input placeholder="Ara…" value={q} onChange={(e) => setQ(e.target.value)} />
      <DataTable {...table.tableProps} columns={columns} rowKey={(r) => r.id} selectable />
    </>
  );
}
```

Tabloyu yalnız son istek güncelleyebilir — eskiler `signal` ile iptal edilir. Sonraki sayfa
yüklenirken satırlar soluk hâlde ekranda kalır; başarısız istek, "Tekrar dene" düğmeli bir hata
satırı gösterir. `total` verilmezse `DataTable` verdiğiniz satırları istemcide sıralar ve sayfalar.

</details>

<details>
<summary><b>Tarihler</b></summary>

```tsx
import { useState } from 'react';
import { DatePicker, DateRangePicker, Field, toISODate, type DateRange } from 'xbdesk';

export function ReportFilters() {
  const [due, setDue] = useState<Date | null>(null);
  const [period, setPeriod] = useState<DateRange>({ start: null, end: null });
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  return (
    <>
      <Field label="Vade" hint="Yalnız hafta içi">
        <DatePicker value={due} onChange={setDue} min={new Date()} isDateDisabled={isWeekend} />
      </Field>
      <Field label="Dönem">
        <DateRangePicker value={period} onChange={setPeriod} />
      </Field>
      <code>{period.start && toISODate(period.start)}</code>
    </>
  );
}
```

Değerler yerel takvim günüdür (gece yarısındaki `Date`); API için `toISODate` / `fromISODate`
ile `YYYY-MM-DD` biçimine çevrilir. Kullanıcı tarihi kendi dilinin sırasıyla yazabilir
(`26.09.2026`, `26092026`, `26/9/26`…), klavyeyi kullanabilir ya da takvimden seçebilir.

</details>

<details>
<summary><b>Aranabilir açılır liste</b> — statik liste, sunucudan arama, çoklu seçim</summary>

```tsx
import { useState } from 'react';
import { Combobox, Field, type ComboboxOption } from 'xbdesk';

const cities: ComboboxOption<number>[] = [{ value: 34, label: 'İstanbul' }, { value: 35, label: 'İzmir' }, { value: 63, label: 'Şanlıurfa' }];
const tags: ComboboxOption[] = [{ value: 'gida', label: 'Gıda', group: 'Perakende' }, { value: 'nakliye', label: 'Nakliye', group: 'Hizmet' }];

export function Pickers() {
  const [city, setCity] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <>
      {/* Statik liste: yazdıkça süzülür; harf büyüklüğü ve Türkçe karakter fark etmez ("sanliurfa" → "Şanlıurfa") */}
      <Field label="İl">
        <Combobox options={cities} value={city} onChange={setCity} placeholder="İl seçin" />
      </Field>

      {/* Sunucudan arama: eski istekler iptal edilir, sonuçlar geldiği gibi gösterilir */}
      <Field label="Müşteri">
        <Combobox
          loadOptions={async (q, signal) => {
            const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`, { signal });
            const rows: Array<{ id: string; name: string; code: string }> = await res.json();
            return rows.map((c) => ({ value: c.id, label: c.name, description: c.code }));
          }}
          value={customerId}
          onChange={(id) => setCustomerId(id)}
        />
      </Field>

      {/* Birden çok değer, çip olarak; grubu olan seçenekler başlık altında listelenir */}
      <Field label="Etiketler">
        <Combobox multiple options={tags} value={selected} onChange={setSelected} />
      </Field>
    </>
  );
}
```

Seçenekler `{ value, label, description?, icon?, group?, disabled? }` biçimindedir. `loadOptions`
kullanırken mevcut seçimi `initialOptions` ile verin; etiketi ilk aramadan önce de görünsün. Klavye:
↑/↓, PageUp/PageDown, Enter, Esc ve son çipi silmek için Backspace.

</details>

<details>
<summary><b>Giriş, kilit ekranı ve kullanıcı menüsü</b></summary>

```tsx
import { useState } from 'react';
import { AppMenuButton, Clock, ColorSchemeToggle, Desktop, LoginScreen, Panel, SystemTray, UserMenu, WindowList, WorkspaceSwitcher } from 'xbdesk';

export function Shell() {
  const [user, setUser] = useState<User | null>(null);
  const [locked, setLocked] = useState(false);

  if (!user) {
    return (
      <LoginScreen
        title="Acme ERP"
        onLogin={async ({ username, password }) => {
          const signedIn = await api.login(username, password);
          if (!signedIn) return 'Kullanıcı adı ya da şifre hatalı'; // formda gösterilir
          setUser(signedIn);
        }}
      />
    );
  }

  return (
    <>
      <Desktop persistKey={`acme:${user.username}`}>
        <Panel>
          <AppMenuButton />
          <WindowList />
          <WorkspaceSwitcher />
          <SystemTray>
            <ColorSchemeToggle />
            <UserMenu name={user.name} email={user.email} onLock={() => setLocked(true)} onLogout={() => setUser(null)} />
          </SystemTray>
          <Clock showDate />
        </Panel>
      </Desktop>
      {locked && <LoginScreen mode="unlock" user={user} onLogin={async ({ password }) => (await api.verify(user.username, password)) ? setLocked(false) : false} />}
    </>
  );
}
```

`LoginScreen` yalnız formu çizer — kimlik doğrulama sizin kodunuzda kalır. Hata göstermek için
bir metin döndürün (ya da hata fırlatın); genel mesaj için `false` döndürün.

</details>

<details>
<summary><b>Tema</b> — uygulamanızın temasını ve tasarım değişkenlerini izleyin</summary>

```tsx
<Desktop
  colorScheme={theme} // uygulamanızın temasını izler…
  onColorSchemeChange={(_scheme, resolved) => setTheme(resolved)} // …masaüstünde yapılan değişikliği bildirir
  defaultPreferences={{ accentColor: '#16a34a', panelPosition: 'top' }}
  tokens={{ fontFamily: 'Inter, system-ui, sans-serif', radius: '6px', windowRadius: '10px' }}
  locale="tr"
/>
```

Değişkenler CSS custom property'lerine (`--xbd-window-bg`, `--xbd-accent`, …) karşılık gelir; kendi
değişkenlerinizi gösterebilirler — ör. shadcn/ui ile `windowBg: 'hsl(var(--background))'`. Tüm
sınıflar `xbd-` önekli, global hiçbir stil uygulanmaz. `<Desktop>` dışında (ör. ayrı bir giriş
sayfasında) bileşenleri `<ThemeScope>` ile sarın.

</details>

<details>
<summary><b>Kalıcılık</b></summary>

`persistKey` tercihleri ve açık pencereleri `localStorage`'da tutar. Kullanıcı başına sunucuda
saklamak için yerine `storage` verin — tercihler için `load`/`save`, pencereler için isteğe bağlı
`loadSession`/`saveSession`; hepsi asenkron olabilir. Uygulama listesi hâlâ yükleniyorsa (ör.
yetkiler) geri yükleme sırasında pencere kaybolmasın diye `appsReady={false}` verin.

</details>

## Tarayıcı desteği

Güncel Chrome, Edge, Firefox ve Safari (stiller `color-mix()` kullanır: Chrome 111+, Firefox 113+,
Safari 16.2+). Sunucu tarafında çizim (SSR) çalışır; Next.js App Router'da `<Desktop>`'u bir istemci
bileşeninden çizin.

## Geliştirme

```bash
npm install
npm run dev          # tüm bileşenleri içeren oyun alanı → http://localhost:5180
npm run typecheck
npm run build        # kütüphane → dist/
npm run build:demo   # oyun alanı tek, bağımsız bir HTML dosyası olarak → dist-demo/
```

Oyun alanı (`playground/`) aynı zamanda demodur: giriş ekranı, klasörler, bileşen galerisi, sahte
API'li sunucu tablosu ve profil sayfası.

## Lisans

[MIT](LICENSE) © 2026 Emrah Dedeoğlu
