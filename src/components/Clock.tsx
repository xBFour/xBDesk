import { useEffect, useMemo, useState } from 'react';
import { useDesktopConfig } from '../context';
import { cx } from '../utils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { PanelButton, PanelPopoverButton, usePanel } from './Panel';

/** Re-renders on every tick of `intervalMs`, aligned to the wall clock. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      timer = setTimeout(tick, intervalMs - (d.getTime() % intervalMs) + 5);
    };
    timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 5);
    return () => clearTimeout(timer);
  }, [intervalMs]);
  return now;
}

function firstDayOfWeek(locale: string): number {
  try {
    const info = (new Intl.Locale(locale) as unknown as { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } });
    const wi = info.getWeekInfo?.() ?? info.weekInfo;
    if (wi) return wi.firstDay % 7;
  } catch {
    /* older engines */
  }
  return /^en-(US|CA)|^ja|^he|^pt-BR/.test(locale) ? 0 : 1;
}

export interface CalendarProps {
  locale?: string;
  className?: string;
}

/** Month view calendar used by the clock popover. */
export function Calendar({ locale: localeProp, className }: CalendarProps) {
  const config = useDesktopConfig();
  const locale = localeProp ?? config.locale;
  const today = useNow(60_000);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const start = firstDayOfWeek(locale);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2023-01-01 was a Sunday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + ((i + start) % 7))));
  }, [locale, start]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() - start + 7) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), 1 - offset + i));
  }, [cursor, start]);

  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor);
  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <div className={cx('xbd-calendar', className)}>
      <div className="xbd-calendar__today">
        <span>{new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(today)}</span>
        <strong>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(today)}</strong>
      </div>
      <div className="xbd-calendar__header">
        <button type="button" className="xbd-icon-button" onClick={() => shift(-1)} aria-label={config.labels.previousMonth} title={config.labels.previousMonth}>
          <ChevronLeftIcon />
        </button>
        <button type="button" className="xbd-calendar__month" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} title={config.labels.today}>
          {monthTitle}
        </button>
        <button type="button" className="xbd-icon-button" onClick={() => shift(1)} aria-label={config.labels.nextMonth} title={config.labels.nextMonth}>
          <ChevronRightIcon />
        </button>
      </div>
      <div className="xbd-calendar__grid" role="grid" aria-label={monthTitle}>
        {weekdays.map((d) => (
          <span key={d} className="xbd-calendar__weekday" role="columnheader">
            {d}
          </span>
        ))}
        {days.map((d) => (
          <span
            key={d.toISOString()}
            role="gridcell"
            className={cx('xbd-calendar__day', d.getMonth() !== cursor.getMonth() && 'is-outside', sameDay(d, today) && 'is-today')}
            aria-current={sameDay(d, today) ? 'date' : undefined}
          >
            {d.getDate()}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface ClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  /** Force 12/24-hour format; defaults to the locale's convention. */
  hour12?: boolean;
  /** Full control over the time format (overrides `showSeconds`/`hour12`). */
  timeFormat?: Intl.DateTimeFormatOptions;
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Open a calendar popover on click. Default `true`. */
  calendar?: boolean;
  locale?: string;
}

export function Clock({ showDate = false, showSeconds = false, hour12, timeFormat, dateFormat, calendar = true, locale: localeProp }: ClockProps) {
  const config = useDesktopConfig();
  const locale = localeProp ?? config.locale;
  const { vertical } = usePanel();
  const now = useNow(showSeconds || timeFormat?.second ? 1000 : 60_000);
  const time = new Intl.DateTimeFormat(locale, timeFormat ?? { hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined, hour12 }).format(now);
  const date = new Intl.DateTimeFormat(locale, dateFormat ?? (vertical ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short' })).format(now);
  const full = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(now);

  const face = (
    <span className={cx('xbd-clock', (showDate || vertical) && 'xbd-clock--stacked')}>
      <time dateTime={now.toISOString()} className="xbd-clock__time">
        {time}
      </time>
      {showDate && <span className="xbd-clock__date">{date}</span>}
    </span>
  );

  if (!calendar) return <PanelButton title={full} aria-label={full}>{face}</PanelButton>;
  return (
    <PanelPopoverButton title={full} aria-label={full} align="end" popoverClassName="xbd-popover--calendar" content={() => <Calendar locale={locale} />}>
      {face}
    </PanelPopoverButton>
  );
}
