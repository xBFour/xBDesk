/**
 * Date-only helpers. Every value is a local calendar day at 00:00 — no time
 * zones involved; use `toISODate` / `fromISODate` to talk to an API.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DatePart = 'day' | 'month' | 'year';

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Negative when `a` is an earlier day than `b`, 0 on the same day. */
export function compareDay(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Same day of month `n` months later, clamped to the month's end (31 Jan + 1 → 28/29 Feb). */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), daysInMonth(first.getFullYear(), first.getMonth())));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Months between the first days of the two months (`b` − `a`). */
export function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}

export function isWithin(d: Date, min?: Date | null, max?: Date | null): boolean {
  return (!min || compareDay(d, min) >= 0) && (!max || compareDay(d, max) <= 0);
}

/** First day of the week for a locale: 1 = Monday (tr, de, en-GB…), 0 = Sunday (en-US…). */
export function firstDayOfWeek(locale: string): Weekday {
  try {
    const info = new Intl.Locale(locale) as unknown as { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } };
    const wi = info.getWeekInfo?.() ?? info.weekInfo;
    if (wi) return (wi.firstDay % 7) as Weekday;
  } catch {
    /* older engines */
  }
  return /^en(-US|-CA)?$|^en-(US|CA)|^ja|^he|^pt-BR/.test(locale) ? 0 : 1;
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** `2026-09-26` — the unambiguous form for APIs and `<input name>`. */
export function toISODate(d: Date): string {
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses `YYYY-MM-DD` (a longer ISO timestamp is cut to its date) as a local day. */
export function fromISODate(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? makeDate(+m[1], +m[2], +m[3]) : null;
}

function makeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || year < 1 || year > 9999 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  const d = new Date(2000, month - 1, day);
  d.setFullYear(year); // new Date(y < 100, …) would mean 19xx
  return d;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function numericFormat(locale: string): Intl.DateTimeFormat {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    formatters.set(locale, f);
  }
  return f;
}

/** Numeric date in the locale's own order and separator: `26.09.2026`, `09/26/2026`… */
export function formatDate(d: Date, locale: string): string {
  return numericFormat(locale).format(d);
}

/** Order of the parts in the locale's numeric date, e.g. `['day', 'month', 'year']` for Turkish. */
export function dateOrder(locale: string): DatePart[] {
  return numericFormat(locale)
    .formatToParts(new Date(2026, 10, 22))
    .map((p) => p.type)
    .filter((t): t is DatePart => t === 'day' || t === 'month' || t === 'year');
}

/** Input hint such as `gg.aa.yyyy` built from localised part names. */
export function datePattern(locale: string, names: Record<DatePart, string>): string {
  const parts = numericFormat(locale).formatToParts(new Date(2026, 10, 22));
  return parts.map((p) => (p.type === 'day' || p.type === 'month' || p.type === 'year' ? names[p.type] : p.value)).join('');
}

/**
 * Reads a typed date in the locale's order. Accepts any separator (`1.2.2026`,
 * `01/02/26`, `1 2 2026`), digits only (`01022026`, `010226`) and ISO
 * (`2026-02-01`). Two-digit years fall within 80 years back / 20 years ahead.
 * Returns `null` for anything that is not a real calendar day.
 */
export function parseDate(text: string, locale: string): Date | null {
  const t = text.trim();
  if (!t) return null;
  const order = dateOrder(locale);
  let parts: string[];
  if (/^\d{6}$|^\d{8}$/.test(t)) {
    const yearLen = t.length === 8 ? 4 : 2;
    parts = [];
    let i = 0;
    for (const p of order) {
      const len = p === 'year' ? yearLen : 2;
      parts.push(t.slice(i, i + len));
      i += len;
    }
  } else {
    parts = t.split(/[^\d]+/).filter(Boolean);
  }
  if (parts.length !== 3) return null;
  const iso = parts[0].length === 4;
  const get = (p: DatePart) => parts[iso ? ['year', 'month', 'day'].indexOf(p) : order.indexOf(p)];
  let year = Number(get('year'));
  if (get('year').length <= 2) {
    const now = new Date().getFullYear();
    year += Math.floor(now / 100) * 100;
    if (year > now + 20) year -= 100;
    else if (year <= now - 80) year += 100;
  }
  return makeDate(year, Number(get('month')), Number(get('day')));
}
