import { useMemo, useState } from 'react';
import { Card, DateCalendar, DatePicker, DateRangePicker, Field, defaultDatePresets, toISODate, useUiLabels, type DatePreset, type DateRange } from 'xbdesk';

// Tarih seçici örnekleri. Değerler yerel gün (Date); API'ye toISODate ile YYYY-MM-DD gider.

const iso = (d: Date | null) => (d ? toISODate(d) : '—');
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export function DatesPage() {
  const labels = useUiLabels();
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const limit = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()), [today]);
  const presets = useMemo<DatePreset[]>(
    () => [...defaultDatePresets(labels.presets), { label: 'Son 90 gün', range: () => ({ start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89), end: today }) }],
    [labels, today],
  );

  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [delivery, setDelivery] = useState<Date | null>(null);
  const [period, setPeriod] = useState<DateRange>({ start: null, end: null });
  const [day, setDay] = useState<Date | null>(today);

  return (
    <div className="demo-gallery__stack">
      <Field label="Fatura tarihi" hint="Yazın (26092026, 26.9.26…) ya da takvimden seçin — ↓ tuşu takvimi açar">
        <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
      </Field>
      <Field label="Teslim tarihi" hint="Bugünden 3 ay sonrasına kadar; hafta sonları seçilemez">
        <DatePicker value={delivery} onChange={setDelivery} min={today} max={limit} isDateDisabled={isWeekend} />
      </Field>
      <Field label="Rapor dönemi" hint="Hazır aralıklar solda; iki uç da yazılabilir, ters girilirse yer değiştirir">
        <DateRangePicker value={period} onChange={setPeriod} presets={presets} />
      </Field>
      <Field label="Salt okunur">
        <DatePicker defaultValue={new Date(2026, 0, 1)} disabled />
      </Field>
      <dl className="demo-gallery__dl demo-dates__values">
        <dt>Fatura tarihi</dt>
        <dd>
          <code>{iso(invoiceDate)}</code>
        </dd>
        <dt>Teslim tarihi</dt>
        <dd>
          <code>{iso(delivery)}</code>
        </dd>
        <dt>Rapor dönemi</dt>
        <dd>
          <code>
            {iso(period.start)} → {iso(period.end)}
          </code>
        </dd>
      </dl>
      <Card title="Satır içi takvim" description="DateCalendar — açılır pencere olmadan, doğrudan sayfada">
        <DateCalendar value={day} onChange={setDay} />
        <p className="demo-dates__picked">
          Seçilen: <code>{iso(day)}</code>
        </p>
      </Card>
    </div>
  );
}
