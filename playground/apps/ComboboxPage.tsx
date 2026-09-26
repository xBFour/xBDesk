import { useState } from 'react';
import { Card, Combobox, Field, type ComboboxOption } from 'xbdesk';

// Aranabilir açılır liste örnekleri: statik liste, sunucudan arama, çoklu seçim.

const PROVINCES = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'];
// Plaka kodu sırası korunur; liste alfabetik gösterilir.
const PROVINCE_OPTIONS: ComboboxOption<number>[] = PROVINCES.map((name, i) => ({ value: i + 1, label: name, description: `Plaka ${String(i + 1).padStart(2, '0')}` })).sort((a, b) =>
  a.label.localeCompare(b.label, 'tr'),
);

// "Sunucu": 5.000 müşteri. Gerçek bir uç gibi arar, gecikir ve iptal edilebilir.
const WORDS = ['Akdeniz', 'Anadolu', 'Boğaziçi', 'Ege', 'Karadeniz', 'Trakya', 'Marmara', 'Çukurova', 'Kapadokya', 'Toros', 'Yıldız', 'Güneş', 'Şimşek', 'Özgür', 'İnci'];
const TRADES = ['Gıda', 'Yapı Market', 'Kırtasiye', 'Tarım', 'Lojistik', 'Otomotiv', 'Ambalaj', 'Tekstil', 'Turizm', 'Kimya', 'Mobilya', 'Elektrik'];
const CUSTOMERS = Array.from({ length: 5000 }, (_, i) => ({
  value: `C${String(10000 + i)}`,
  label: `${WORDS[i % WORDS.length]} ${TRADES[(i * 7) % TRADES.length]}${i >= 180 ? ` ${Math.floor(i / 180) + 1}` : ''} ${i % 3 ? 'Ltd. Şti.' : 'A.Ş.'}`,
  description: `C${10000 + i} · ${PROVINCES[(i * 13) % PROVINCES.length]}`,
}));
const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
function searchCustomers(query: string, signal: AbortSignal) {
  return new Promise<ComboboxOption[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      const terms = fold(query).split(/\s+/).filter(Boolean);
      resolve(CUSTOMERS.filter((c) => terms.every((t) => fold(`${c.label} ${c.description}`).includes(t))).slice(0, 50));
    }, 200 + Math.random() * 450);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('İptal edildi', 'AbortError'));
    });
  });
}

const CATEGORIES: ComboboxOption[] = [
  ...['Un', 'Şeker', 'Ayçiçek yağı', 'Makarna', 'Pirinç'].map((l) => ({ value: `gida-${l}`, label: l, group: 'Gıda' })),
  ...['Deterjan', 'Çamaşır suyu', 'Yüzey temizleyici'].map((l) => ({ value: `temizlik-${l}`, label: l, group: 'Temizlik' })),
  ...['Defter', 'Kalem', 'Fotokopi kâğıdı', 'Klasör'].map((l) => ({ value: `kirtasiye-${l}`, label: l, group: 'Kırtasiye' })),
  { value: 'arsiv', label: 'Arşivlenmiş kategori', group: 'Kırtasiye', disabled: true },
];

const show = (v: unknown) => (v === null || (Array.isArray(v) && !v.length) ? '—' : JSON.stringify(v));

export function ComboboxPage() {
  const [city, setCity] = useState<number | null>(35);
  const [customer, setCustomer] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['gida-Un', 'kirtasiye-Defter']);
  const [cities, setCities] = useState<number[]>([]);

  return (
    <div className="demo-gallery__stack">
      <Field label="İl" hint="81 il, statik liste — harf büyüklüğü ve Türkçe karakter fark etmez: “sanliurfa”, “izmir”, “canak” deneyin">
        <Combobox options={PROVINCE_OPTIONS} value={city} onChange={setCity} placeholder="İl seçin" />
      </Field>
      <Field label="Müşteri" hint="5.000 kayıt sunucuda; yazdıkça aranır, eski istek iptal edilir">
        <Combobox loadOptions={searchCustomers} value={customer} onChange={setCustomer} placeholder="Unvan, kod ya da il yazın…" />
      </Field>
      <Field label="Kategoriler" hint="Çoklu seçim, gruplar; Backspace son seçimi kaldırır">
        <Combobox multiple options={CATEGORIES} value={categories} onChange={setCategories} placeholder="Kategori ekle…" />
      </Field>
      <Field label="Teslimat illeri" required error={cities.length ? undefined : 'En az bir il seçin'}>
        <Combobox multiple options={PROVINCE_OPTIONS} value={cities} onChange={setCities} placeholder="İl ekle…" />
      </Field>
      <Field label="Salt okunur">
        <Combobox options={PROVINCE_OPTIONS} defaultValue={6} disabled />
      </Field>
      <Card title="Seçilen değerler" flush>
        <dl className="demo-gallery__dl demo-dates__values" style={{ padding: 14 }}>
          <dt>İl</dt>
          <dd>
            <code>{show(city)}</code>
          </dd>
          <dt>Müşteri</dt>
          <dd>
            <code>{show(customer)}</code>
          </dd>
          <dt>Kategoriler</dt>
          <dd>
            <code>{show(categories)}</code>
          </dd>
          <dt>Teslimat illeri</dt>
          <dd>
            <code>{show(cities)}</code>
          </dd>
        </dl>
      </Card>
    </div>
  );
}
