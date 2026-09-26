import { useState } from 'react';
import {
  Badge,
  DataTable,
  DateRangePicker,
  Icons,
  Input,
  SegmentedControl,
  Switch,
  compareDay,
  useServerTable,
  type DataColumn,
  type DateRange,
  type ServerTableQuery,
  type Tone,
} from 'xbdesk';

// Sunucu taraflı tablo örneği: 5.000 kayıt "sunucuda" (sahte API) durur; her sayfa,
// sıralama ve filtre değişikliği ayrı bir istektir. Gecikme rastgele — eski bir
// isteğin yeni sonucu ezmediğini görmek için hızlıca sayfa değiştirin.

type OrderStatus = 'hazirlaniyor' | 'kargoda' | 'teslim' | 'iade';
interface Order {
  id: number;
  no: string;
  customer: string;
  date: Date;
  amount: number;
  status: OrderStatus;
}

const STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  hazirlaniyor: { label: 'Hazırlanıyor', tone: 'warning' },
  kargoda: { label: 'Kargoda', tone: 'info' },
  teslim: { label: 'Teslim edildi', tone: 'success' },
  iade: { label: 'İade', tone: 'danger' },
};
const STATUSES = Object.keys(STATUS) as OrderStatus[];
const CUSTOMERS = ['Akdeniz Gıda', 'Anadolu Yapı Market', 'Boğaziçi Kırtasiye', 'Ege Tarım', 'Karadeniz Lojistik', 'Trakya Otomotiv', 'Marmara Ambalaj', 'Çukurova Tekstil', 'Kapadokya Turizm', 'Toros Kimya'];

const DB: Order[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  no: `SP-${String(100000 + i * 13).slice(-6)}`,
  customer: CUSTOMERS[(i * 7) % CUSTOMERS.length],
  date: new Date(2025, 0, 1 + ((i * 37) % 600)),
  amount: Math.round((250 + ((i * 7919) % 48000)) * 100) / 100,
  status: STATUSES[(i * 3 + (i >> 4)) % STATUSES.length],
}));

interface Filters {
  query: string;
  range: DateRange;
  status: 'hepsi' | OrderStatus;
}

/** Gerçek bir uç gibi: filtreler, sıralar, sayfalar; iptal edilince (signal) yarıda bırakır. */
function fakeApi({ page, pageSize, sort, signal }: ServerTableQuery, f: Filters, failRate: number, onCancel: () => void) {
  return new Promise<{ rows: Order[]; total: number }>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      if (Math.random() < failRate) {
        reject(new Error('Sunucu yanıt vermedi (simülasyon).'));
        return;
      }
      const q = f.query.trim().toLocaleLowerCase('tr');
      let rows = DB.filter(
        (o) =>
          (f.status === 'hepsi' || o.status === f.status) &&
          (!q || `${o.no} ${o.customer}`.toLocaleLowerCase('tr').includes(q)) &&
          (!f.range.start || compareDay(o.date, f.range.start) >= 0) &&
          (!f.range.end || compareDay(o.date, f.range.end) <= 0),
      );
      if (sort) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        const key = sort.key as keyof Order;
        rows = [...rows].sort((a, b) => {
          const x = a[key];
          const y = b[key];
          if (x instanceof Date && y instanceof Date) return (x.getTime() - y.getTime()) * dir;
          if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
          return String(x).localeCompare(String(y), 'tr') * dir;
        });
      }
      resolve({ rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length });
    }, 200 + Math.random() * 700);
    signal.addEventListener('abort', () => {
      if (settled) return;
      clearTimeout(timer);
      onCancel();
      reject(new DOMException('İptal edildi', 'AbortError'));
    });
  });
}

const money = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const COLUMNS: DataColumn<Order>[] = [
  { key: 'no', header: 'Sipariş no', nowrap: true },
  { key: 'customer', header: 'Müşteri' },
  { key: 'date', header: 'Tarih', nowrap: true, cell: (r) => r.date.toLocaleDateString('tr-TR') },
  { key: 'amount', header: 'Tutar', align: 'right', nowrap: true, cell: (r) => money(r.amount) },
  { key: 'status', header: 'Durum', cell: (r) => <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge> },
];

export function ServerTablePage() {
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [status, setStatus] = useState<Filters['status']>('hepsi');
  const [fail, setFail] = useState(false);
  const [stats, setStats] = useState({ sent: 0, cancelled: 0 });

  const table = useServerTable<Order>({
    fetch: (q) => {
      setStats((s) => ({ ...s, sent: s.sent + 1 }));
      return fakeApi(q, { query, range, status }, fail ? 0.5 : 0, () => setStats((s) => ({ ...s, cancelled: s.cancelled + 1 })));
    },
    deps: [query, range.start, range.end, status],
    debounce: 300,
    defaultSort: { key: 'date', dir: 'desc' },
  });

  return (
    <div className="demo-server">
      <div className="demo-server__filters">
        <Input placeholder="Sipariş no / müşteri ara…" value={query} onChange={(e) => setQuery(e.target.value)} icon={<Icons.SearchIcon />} style={{ maxWidth: 240 }} />
        <DateRangePicker value={range} onChange={setRange} style={{ maxWidth: 270 }} aria-label="Tarih aralığı" />
        <SegmentedControl
          size="sm"
          value={status}
          onChange={setStatus}
          label="Durum"
          options={[{ value: 'hepsi' as const, label: 'Hepsi' }, ...STATUSES.map((s) => ({ value: s, label: STATUS[s].label }))]}
        />
        <Switch label="Hata simüle et (%50)" checked={fail} onChange={(e) => setFail(e.target.checked)} />
      </div>
      <DataTable {...table.tableProps} columns={COLUMNS} rowKey={(r) => r.id} selectable maxHeight={420} pageSizes={[10, 25, 50, 100]} />
      <p className="demo-gallery__note">
        Sunucuda 5.000 kayıt · bu filtrede <strong>{table.total.toLocaleString('tr-TR')}</strong> · gönderilen istek {stats.sent}, iptal edilen {stats.cancelled}. Arama 300 ms
        bekler; sayfa ve sıralama anında istek atar, bekleyen eski istek iptal edilir.
      </p>
    </div>
  );
}
