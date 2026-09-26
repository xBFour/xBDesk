import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Icons,
  Input,
  Progress,
  RadioGroup,
  SegmentedControl,
  Select,
  SidebarLayout,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Toolbar,
  ToolbarSpacer,
  Tooltip,
  useConfirm,
  useDesktop,
  type DataColumn,
  type Tone,
} from 'xbdesk';
import { ComboboxPage } from './ComboboxPage';
import { DatesPage } from './DatesPage';
import { ServerTablePage } from './ServerTablePage';

// Bileşen galerisi: kitteki her bileşenin çalışan örneği. Veriler örnektir.

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="m2.5 4.5 5.5 4 5.5-4" />
  </svg>
);

type Status = 'odendi' | 'bekliyor' | 'gecikti' | 'iptal';
interface Invoice {
  no: string;
  customer: string;
  date: Date;
  due: Date;
  amount: number;
  status: Status;
}

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  odendi: { label: 'Ödendi', tone: 'success' },
  bekliyor: { label: 'Bekliyor', tone: 'info' },
  gecikti: { label: 'Gecikti', tone: 'danger' },
  iptal: { label: 'İptal', tone: 'neutral' },
};

const CUSTOMERS = ['Akdeniz Gıda', 'Anadolu Yapı Market', 'Boğaziçi Kırtasiye', 'Ege Tarım', 'Karadeniz Lojistik', 'Trakya Otomotiv', 'Marmara Ambalaj', 'Çukurova Tekstil'];
const INVOICES: Invoice[] = Array.from({ length: 57 }, (_, i) => {
  const date = new Date(2026, 5, 1 + ((i * 3) % 110));
  const statuses: Status[] = ['odendi', 'bekliyor', 'gecikti', 'odendi', 'bekliyor', 'iptal'];
  return {
    no: `SF-2026-${String(1000 + i * 7).padStart(5, '0')}`,
    customer: CUSTOMERS[(i * 5) % CUSTOMERS.length],
    date,
    due: new Date(date.getTime() + (30 + (i % 3) * 15) * 86400000),
    amount: Math.round((1500 + ((i * 7919) % 98000)) * 100) / 100,
    status: statuses[i % statuses.length],
  };
});

const money = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
const day = (d: Date) => d.toLocaleDateString('tr-TR');

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="demo-gallery__section">
    <h3>{title}</h3>
    {children}
  </section>
);

function ButtonsPage() {
  const [loading, setLoading] = useState(false);
  const [chips, setChips] = useState(['Bu ay', 'Gecikenler', 'İstanbul']);
  return (
    <>
      <Section title="Düğmeler">
        <Toolbar>
          <Button>Varsayılan</Button>
          <Button variant="primary">Birincil</Button>
          <Button variant="ghost">Sade</Button>
          <Button variant="danger">Sil</Button>
          <Button variant="primary" icon={<Icons.CheckIcon />}>
            Simgeli
          </Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            Kaydet
          </Button>
          <Button disabled>Pasif</Button>
        </Toolbar>
        <Toolbar>
          <Button size="sm">Küçük</Button>
          <Button>Orta</Button>
          <Button size="lg">Büyük</Button>
          <Tooltip content="Ara (ipucu örneği)">
            <IconButton label="Ara" icon={<Icons.SearchIcon />} />
          </Tooltip>
          <IconButton label="Yenile" variant="default" icon={<Icons.WorkspacesIcon />} />
          <IconButton label="Ekle" variant="primary" icon={<Icons.MaximizeIcon />} />
        </Toolbar>
      </Section>
      <Section title="Rozetler (chip)">
        {(['soft', 'solid', 'outline'] as const).map((variant) => (
          <Toolbar key={variant}>
            {(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as Tone[]).map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>
                {tone}
              </Badge>
            ))}
          </Toolbar>
        ))}
        <Toolbar>
          {chips.map((c) => (
            <Badge key={c} tone="accent" onRemove={() => setChips((x) => x.filter((y) => y !== c))}>
              {c}
            </Badge>
          ))}
          {chips.length < 3 && (
            <Button size="sm" variant="ghost" onClick={() => setChips(['Bu ay', 'Gecikenler', 'İstanbul'])}>
              Filtreleri geri getir
            </Button>
          )}
        </Toolbar>
      </Section>
    </>
  );
}

function FormPage() {
  const api = useDesktop();
  const [email, setEmail] = useState('ornek@firma');
  const [plan, setPlan] = useState('aylik');
  const [period, setPeriod] = useState<'gun' | 'hafta' | 'ay'>('hafta');
  const [notify, setNotify] = useState(true);
  const emailError = email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Geçerli bir e-posta adresi girin' : undefined;
  return (
    <form
      className="demo-gallery__form"
      onSubmit={(e) => {
        e.preventDefault();
        api.notify({ title: 'Form gönderildi', body: 'Örnek form — veriler hiçbir yere gönderilmedi.' });
      }}
    >
      <Field label="Firma adı" required hint="Faturada görünecek unvan">
        <Input placeholder="Örn. Akdeniz Gıda A.Ş." />
      </Field>
      <Field label="E-posta" error={emailError}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<MailIcon />} />
      </Field>
      <Field label="Kredi limiti">
        <Input type="number" defaultValue={25000} suffix="TL" />
      </Field>
      <Field label="Şehir">
        <Select defaultValue="izmir" options={[{ value: 'istanbul', label: 'İstanbul' }, { value: 'ankara', label: 'Ankara' }, { value: 'izmir', label: 'İzmir' }, { value: 'bursa', label: 'Bursa' }]} />
      </Field>
      <Field label="Not">
        <Textarea placeholder="Müşteriyle ilgili notlar…" />
      </Field>
      <Field label="Ödeme planı">
        <RadioGroup value={plan} onChange={setPlan} orientation="horizontal" options={[{ value: 'aylik', label: 'Aylık' }, { value: 'yillik', label: 'Yıllık' }, { value: 'pesin', label: 'Peşin' }]} />
      </Field>
      <Field label="Rapor dönemi">
        <SegmentedControl value={period} onChange={setPeriod} options={[{ value: 'gun', label: 'Gün' }, { value: 'hafta', label: 'Hafta' }, { value: 'ay', label: 'Ay' }]} />
      </Field>
      <Switch label="E-posta bildirimleri" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
      <Checkbox label="Sözleşmeyi okudum" defaultChecked />
      <Toolbar>
        <ToolbarSpacer />
        <Button type="reset">Temizle</Button>
        <Button type="submit" variant="primary" disabled={!!emailError}>
          Kaydet
        </Button>
      </Toolbar>
    </form>
  );
}

function TablePage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'hepsi' | Status>('hepsi');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [open, setOpen] = useState<Invoice | null>(null);
  const api = useDesktop();
  const rows = useMemo(
    () =>
      INVOICES.filter((r) => (status === 'hepsi' || r.status === status) && `${r.no} ${r.customer}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))),
    [query, status],
  );
  const columns: DataColumn<Invoice>[] = [
    { key: 'no', header: 'Fatura no', nowrap: true },
    { key: 'customer', header: 'Müşteri' },
    { key: 'date', header: 'Tarih', cell: (r) => day(r.date), nowrap: true },
    { key: 'due', header: 'Vade', cell: (r) => day(r.due), nowrap: true },
    { key: 'amount', header: 'Tutar', align: 'right', cell: (r) => money(r.amount), nowrap: true },
    { key: 'status', header: 'Durum', sortValue: (r) => STATUS[r.status].label, cell: (r) => <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge> },
  ];
  return (
    <>
      <Toolbar className="demo-gallery__toolbar">
        <Input placeholder="Fatura no / müşteri ara…" value={query} onChange={(e) => setQuery(e.target.value)} icon={<Icons.SearchIcon />} style={{ maxWidth: 260 }} />
        <SegmentedControl
          size="sm"
          value={status}
          onChange={setStatus}
          options={[{ value: 'hepsi', label: 'Hepsi' }, ...Object.entries(STATUS).map(([value, s]) => ({ value: value as Status, label: s.label }))]}
        />
        <ToolbarSpacer />
        {selected.size > 0 && (
          <Button size="sm" variant="primary" onClick={() => api.notify({ title: `${selected.size} fatura dışa aktarıldı`, body: 'Örnek işlem.' })}>
            Seçilenleri dışa aktar ({selected.size})
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.no}
        defaultSort={{ key: 'date', dir: 'asc' }}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={setOpen}
        maxHeight={380}
        pageSize={25}
        empty={<EmptyState title="Sonuç yok" description="Arama ya da durum filtresini değiştirin." />}
      />
      <p className="demo-gallery__note">Başlığa tıklayarak sıralayın (sıralama sayfalamadan önce uygulanır). Satıra tıklayınca pencere içi diyalog açılır.</p>
      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.no}
        description={open?.customer}
        footer={
          <>
            <Button onClick={() => setOpen(null)}>Kapat</Button>
            <Button variant="primary" onClick={() => setOpen(null)}>
              Tahsil et
            </Button>
          </>
        }
      >
        {open && (
          <dl className="demo-gallery__dl">
            <dt>Tarih</dt>
            <dd>{day(open.date)}</dd>
            <dt>Vade</dt>
            <dd>{day(open.due)}</dd>
            <dt>Tutar</dt>
            <dd>{money(open.amount)}</dd>
            <dt>Durum</dt>
            <dd>
              <Badge tone={STATUS[open.status].tone}>{STATUS[open.status].label}</Badge>
            </dd>
          </dl>
        )}
      </Dialog>
    </>
  );
}

function FeedbackPage() {
  const api = useDesktop();
  const { confirm, dialog } = useConfirm();
  const [progress, setProgress] = useState(35);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 5)), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <Section title="Uyarılar">
        <div className="demo-gallery__stack">
          <Alert tone="info" title="Bilgi">
            Yeni sürüm hazır; bir sonraki girişte uygulanacak.
          </Alert>
          <Alert tone="success" title="Kaydedildi">
            Değişiklikler başarıyla kaydedildi.
          </Alert>
          <Alert tone="warning" title="Dikkat">
            3 müşterinin kredi limiti aşıldı.
          </Alert>
          <Alert tone="danger" title="Bağlantı hatası" onClose={() => undefined}>
            Sunucuya ulaşılamadı. Ağ bağlantınızı kontrol edin.
          </Alert>
        </div>
      </Section>
      <Section title="İlerleme">
        <div className="demo-gallery__stack">
          <Progress value={progress} label="Yükleme" />
          <Progress value={72} tone="success" label="Hedef" />
          <Progress indeterminate label="Aktarılıyor" />
          <Toolbar>
            <Spinner /> <span>Yükleniyor…</span>
          </Toolbar>
        </div>
      </Section>
      <Section title="Bildirim ve onay">
        <Toolbar>
          <Button onClick={() => api.notify({ title: 'Aktarım tamamlandı', body: '128 kayıt başarıyla aktarıldı.' })}>Bildirim göster</Button>
          <Button
            variant="danger"
            onClick={async () => {
              const ok = await confirm({ title: 'Kayıt silinsin mi?', message: 'Bu işlem geri alınamaz.', confirmLabel: 'Sil', danger: true });
              api.notify({ title: ok ? 'Silindi' : 'Vazgeçildi', timeout: 2500 });
            }}
          >
            Onay iste (useConfirm)
          </Button>
        </Toolbar>
        {dialog}
      </Section>
      <Section title="Boş durum">
        <Card flush>
          <EmptyState icon={<Icons.ImageIcon />} title="Henüz belge yok" description="Belgeleri sürükleyip bırakın ya da yükleyin." action={<Button variant="primary">Belge yükle</Button>} />
        </Card>
      </Section>
    </>
  );
}

function LayoutPage() {
  return (
    <>
      <Section title="Kartlar">
        <div className="demo-gallery__cards">
          <Card title="Açık bakiye" description="Tüm müşteriler" actions={<Badge tone="danger">-12%</Badge>}>
            <strong className="demo-gallery__kpi">1.284.560,00 TL</strong>
          </Card>
          <Card title="Bu ayki tahsilat" description="26 Eylül itibarıyla" actions={<Badge tone="success">+8%</Badge>}>
            <strong className="demo-gallery__kpi">412.300,00 TL</strong>
          </Card>
          <Card title="Kart altlığı" footer={<Button size="sm" variant="primary">Detay</Button>}>
            Kart gövdesi; altlıkta işlemler yer alır.
          </Card>
        </div>
      </Section>
      <Section title="Sekmeler">
        <Tabs
          tabs={[
            { id: 'ozet', label: 'Özet', content: <p>Sekme içeriği — ok tuşlarıyla gezilebilir.</p> },
            { id: 'hareket', label: 'Hareketler', content: <p>Hareket listesi burada.</p> },
            { id: 'belge', label: 'Belgeler', content: <p>Belgeler burada.</p> },
            { id: 'pasif', label: 'Pasif', disabled: true },
          ]}
        />
        <div style={{ height: 12 }} />
        <Tabs variant="pill" tabs={[{ id: 'a', label: 'Günlük' }, { id: 'b', label: 'Haftalık' }, { id: 'c', label: 'Aylık' }]} />
      </Section>
      <Section title="Avatarlar">
        <Toolbar>
          <Avatar name="Ayşe Demir" size={24} />
          <Avatar name="Mehmet Kaya" size={32} status="online" />
          <Avatar name="Zeynep Arslan" size={40} status="away" />
          <Avatar name="Can Yıldız" size={48} status="busy" />
          <Avatar name="Elif Şahin" size={64} status="offline" />
        </Toolbar>
      </Section>
    </>
  );
}

const PAGES = [
  { id: 'buttons', label: 'Düğmeler ve rozetler', icon: <Icons.CheckIcon />, section: 'Temel', render: () => <ButtonsPage /> },
  { id: 'form', label: 'Form', icon: <Icons.PanelIcon />, section: 'Temel', render: () => <FormPage /> },
  { id: 'dates', label: 'Tarih seçici', icon: <Icons.CalendarIcon />, section: 'Temel', render: () => <DatesPage /> },
  { id: 'combobox', label: 'Açılır liste', icon: <Icons.SearchIcon />, section: 'Temel', render: () => <ComboboxPage /> },
  { id: 'table', label: 'Tablo', icon: <Icons.GridIcon />, section: 'Veri', render: () => <TablePage /> },
  { id: 'server', label: 'Sunucu tablosu', icon: <Icons.GridIcon />, section: 'Veri', render: () => <ServerTablePage /> },
  { id: 'feedback', label: 'Geri bildirim', icon: <Icons.AlertIcon />, section: 'Veri', render: () => <FeedbackPage /> },
  { id: 'layout', label: 'Kart, sekme, avatar', icon: <Icons.WorkspacesIcon />, section: 'Düzen', render: () => <LayoutPage /> },
];

export function ComponentsApp() {
  const [page, setPage] = useState('table');
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  return (
    <SidebarLayout items={PAGES} value={page} onChange={setPage} label="Bileşenler" width={230}>
      <h2 className="demo-gallery__title">{current.label}</h2>
      {current.render()}
    </SidebarLayout>
  );
}
