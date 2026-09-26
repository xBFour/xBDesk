import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../components/icons';
import type { UiLabels } from '../i18n';
import { cx } from '../utils';
import {
  addDays,
  addMonths,
  compareDay,
  datePattern,
  daysInMonth,
  endOfMonth,
  firstDayOfWeek,
  formatDate,
  isWithin,
  monthDiff,
  parseDate,
  sameDay,
  startOfDay,
  startOfMonth,
  toISODate,
  type Weekday,
} from '../utils/date';
import { Button } from './basic';
import { useFieldProps } from './form';
import { useAnchoredPosition, useOutsidePointerDown } from './popup';
import { Portal, useControllable, useUiLabels, useUiLocale } from './shared';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateConstraints {
  /** Earliest selectable day. */
  min?: Date | null;
  /** Latest selectable day. */
  max?: Date | null;
  /** Return `true` to block a day (weekends, holidays…). */
  isDateDisabled?: (date: Date) => boolean;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

const sameValue = (a: Date | null | undefined, b: Date | null | undefined) => (!a && !b) || sameDay(a, b);

function useDayDisabled({ min, max, isDateDisabled }: DateConstraints) {
  return useMemo(() => (d: Date) => !isWithin(d, min, max) || !!isDateDisabled?.(d), [min, max, isDateDisabled]);
}

const formats = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formats.set(key, f);
  }
  return f;
}

/* ------------------------------ DateCalendar ----------------------------- */

export interface DateCalendarProps extends DateConstraints {
  /** Selected day. */
  value?: Date | null;
  onChange?: (date: Date) => void;
  /** Selected range — turns on range selection (first click = start, second = end). */
  range?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  /** First visible month (controlled). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Months shown side by side. Default 1. */
  months?: number;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's first weekday. */
  weekStartsOn?: Weekday;
  locale?: string;
  /** Move keyboard focus to the active day when mounted. */
  autoFocus?: boolean;
  className?: string;
}

type View = 'days' | 'months' | 'years';

/**
 * Inline month calendar with day, month and year views. Keyboard: arrows move by
 * day/week, Home/End to the week's ends, PageUp/PageDown by month (Shift: year).
 */
export function DateCalendar(props: DateCalendarProps) {
  const { value, onChange, range, onRangeChange, month: monthProp, defaultMonth, onMonthChange, months = 1, weekStartsOn, locale: localeProp, autoFocus, className, min, max } = props;
  const labels = useUiLabels();
  const uiLocale = useUiLocale();
  const locale = localeProp ?? uiLocale;
  const weekStart = weekStartsOn ?? firstDayOfWeek(locale);
  const isDisabled = useDayDisabled(props);
  const isRange = range !== undefined;
  const today = startOfDay(new Date());

  const [focus, setFocus] = useState<Date>(() => {
    const d = startOfDay((isRange ? range.start ?? range.end : value) ?? today);
    if (min && compareDay(d, min) < 0) return startOfDay(min);
    if (max && compareDay(d, max) > 0) return startOfDay(max);
    return d;
  });
  const [first, setFirst] = useControllable(monthProp && startOfMonth(monthProp), startOfMonth(defaultMonth ?? focus), onMonthChange);
  const [view, setView] = useState<View>('days');
  const [hover, setHover] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(!!autoFocus);

  const ensureVisible = (d: Date) => {
    const diff = monthDiff(first, d);
    if (diff < 0) setFirst(startOfMonth(d));
    else if (diff >= months) setFirst(new Date(d.getFullYear(), d.getMonth() - months + 1, 1));
  };
  const moveFocus = (d: Date) => {
    setFocus(d);
    ensureVisible(d);
    wantFocus.current = true;
  };
  const shiftMonths = (n: number) => {
    setFirst(new Date(first.getFullYear(), first.getMonth() + n, 1));
    setFocus(addMonths(focus, n));
  };
  const changeView = (next: View) => {
    setView(next);
    wantFocus.current = true;
  };

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const root = rootRef.current;
    const target = view === 'days' ? root?.querySelector<HTMLElement>('.xbd-cal__day[tabindex="0"]') : root?.querySelector<HTMLElement>('[data-view-focus]');
    target?.focus({ preventScroll: true });
  });

  const select = (d: Date) => {
    if (isDisabled(d)) return;
    setFocus(d);
    ensureVisible(d);
    if (!isRange) onChange?.(d);
    else if (!range.start || range.end) onRangeChange?.({ start: d, end: null });
    else if (compareDay(d, range.start) < 0) onRangeChange?.({ start: d, end: range.start });
    else onRangeChange?.({ start: range.start, end: d });
  };

  const onDaysKeyDown = (e: KeyboardEvent) => {
    const col = (focus.getDay() - weekStart + 7) % 7;
    const next: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -col),
      End: () => addDays(focus, 6 - col),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    const go = next[e.key];
    if (!go || !(e.target as HTMLElement).classList.contains('xbd-cal__day')) return;
    e.preventDefault();
    moveFocus(go());
  };

  const weekdays = useMemo(() => {
    const short = fmt(locale, { weekday: 'short' });
    const long = fmt(locale, { weekday: 'long' });
    // 2023-01-01 was a Sunday.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2023, 0, 1 + ((i + weekStart) % 7));
      return { short: short.format(d), long: long.format(d) };
    });
  }, [locale, weekStart]);

  const titleFmt = fmt(locale, { month: 'long', year: 'numeric' });
  const prev = (label: string, onClick: () => void) => (
    <button type="button" className="xbd-icon-button" aria-label={label} title={label} onClick={onClick}>
      <ChevronLeftIcon />
    </button>
  );
  const next = (label: string, onClick: () => void) => (
    <button type="button" className="xbd-icon-button" aria-label={label} title={label} onClick={onClick}>
      <ChevronRightIcon />
    </button>
  );

  if (view === 'months' || view === 'years') {
    const year = first.getFullYear();
    const pageStart = year - (year % 12);
    const anchor = isRange ? range.start : value;
    const items =
      view === 'months'
        ? Array.from({ length: 12 }, (_, m) => {
            const d = new Date(year, m, 1);
            return {
              key: m,
              label: fmt(locale, { month: 'short' }).format(d),
              current: today.getFullYear() === year && today.getMonth() === m,
              selected: !!anchor && anchor.getFullYear() === year && anchor.getMonth() === m,
              disabled: (!!max && compareDay(d, max) > 0) || (!!min && compareDay(endOfMonth(d), min) < 0),
              pick: () => {
                setFirst(d);
                setFocus(new Date(year, m, Math.min(focus.getDate(), daysInMonth(year, m))));
                changeView('days');
              },
            };
          })
        : Array.from({ length: 12 }, (_, i) => {
            const y = pageStart + i;
            return {
              key: y,
              label: String(y),
              current: today.getFullYear() === y,
              selected: !!anchor && anchor.getFullYear() === y,
              disabled: (!!max && max.getFullYear() < y) || (!!min && min.getFullYear() > y),
              pick: () => {
                setFirst(new Date(y, first.getMonth(), 1));
                changeView('months');
              },
            };
          });
    const focusKey = (items.find((it) => it.selected) ?? items.find((it) => it.current) ?? items[0]).key;
    return (
      <div ref={rootRef} className={cx('xbd-cal', className)}>
        <div className="xbd-cal__head">
          {view === 'months'
            ? prev(labels.previousYear, () => setFirst(new Date(year - 1, first.getMonth(), 1)))
            : prev(labels.previousYears, () => setFirst(new Date(year - 12, first.getMonth(), 1)))}
          {view === 'months' ? (
            <button type="button" className="xbd-cal__title" aria-label={`${year} — ${labels.chooseYear}`} onClick={() => changeView('years')}>
              {year}
            </button>
          ) : (
            <span className="xbd-cal__title is-static">
              {pageStart} – {pageStart + 11}
            </span>
          )}
          {view === 'months'
            ? next(labels.nextYear, () => setFirst(new Date(year + 1, first.getMonth(), 1)))
            : next(labels.nextYears, () => setFirst(new Date(year + 12, first.getMonth(), 1)))}
        </div>
        <div className="xbd-cal__picker">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              className={cx('xbd-cal__pick', it.current && 'is-current', it.selected && 'is-selected')}
              disabled={it.disabled}
              data-view-focus={it.key === focusKey ? '' : undefined}
              onClick={it.pick}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Range highlighting; while choosing the end, the hovered day previews it.
  let lo = isRange ? range.start : null;
  let hi = isRange ? range.end ?? (range.start && hover ? hover : null) : null;
  if (lo && hi && compareDay(hi, lo) < 0) [lo, hi] = [hi, lo];
  const previewing = isRange && !!range.start && !range.end && !!hover;
  const span = !!lo && !!hi && !sameDay(lo, hi);

  const focusShown = monthDiff(first, focus) >= 0 && monthDiff(first, focus) < months;
  const tabbable = focusShown ? focus : first;
  const dayLabel = fmt(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={rootRef} className={cx('xbd-cal', className)} onKeyDown={onDaysKeyDown} onMouseLeave={() => setHover(null)}>
      <div className="xbd-cal__months">
        {Array.from({ length: months }, (_, i) => {
          const m = new Date(first.getFullYear(), first.getMonth() + i, 1);
          const offset = (m.getDay() - weekStart + 7) % 7;
          const title = titleFmt.format(m);
          return (
            <div key={i} className="xbd-cal__month">
              <div className="xbd-cal__head">
                {i === 0 ? prev(labels.previousMonth, () => shiftMonths(-1)) : <span className="xbd-cal__spacer" />}
                <button
                  type="button"
                  className="xbd-cal__title"
                  aria-label={`${title} — ${labels.chooseMonth}`}
                  onClick={() => {
                    setFirst(m);
                    changeView('months');
                  }}
                >
                  {title}
                </button>
                {i === months - 1 ? next(labels.nextMonth, () => shiftMonths(1)) : <span className="xbd-cal__spacer" />}
              </div>
              <div role="grid" aria-label={title} className="xbd-cal__grid">
                <div role="row" className="xbd-cal__row">
                  {weekdays.map((w) => (
                    <span key={w.long} role="columnheader" aria-label={w.long} title={w.long} className="xbd-cal__weekday">
                      {w.short}
                    </span>
                  ))}
                </div>
                {Array.from({ length: 6 }, (_, r) => (
                  <div key={r} role="row" className="xbd-cal__row">
                    {Array.from({ length: 7 }, (_, c) => {
                      const d = new Date(m.getFullYear(), m.getMonth(), 1 - offset + r * 7 + c);
                      const outside = d.getMonth() !== m.getMonth();
                      if (outside && months > 1) return <span key={c} role="gridcell" className="xbd-cal__cell" />;
                      const disabled = isDisabled(d);
                      const isStart = sameDay(d, lo);
                      const isEnd = sameDay(d, hi);
                      const selected = isRange ? isStart || isEnd : sameDay(d, value);
                      const inRange = !!lo && !!hi && compareDay(d, lo) > 0 && compareDay(d, hi) < 0;
                      return (
                        <span
                          key={c}
                          role="gridcell"
                          aria-selected={selected || inRange}
                          className={cx('xbd-cal__cell', inRange && 'is-in-range', span && isStart && 'is-range-start', span && isEnd && 'is-range-end', previewing && 'is-preview')}
                        >
                          <button
                            type="button"
                            data-date={toISODate(d)}
                            tabIndex={sameDay(d, tabbable) ? 0 : -1}
                            aria-label={dayLabel.format(d)}
                            aria-disabled={disabled || undefined}
                            aria-current={sameDay(d, today) ? 'date' : undefined}
                            className={cx('xbd-cal__day', outside && 'is-outside', selected && 'is-selected', sameDay(d, today) && 'is-today', disabled && 'is-disabled')}
                            onClick={() => select(d)}
                            onMouseEnter={isRange ? () => setHover(d) : undefined}
                          >
                            {d.getDate()}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Popup ------------------------------- */

const TABBABLE = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex="0"]';

interface DatePopupProps {
  anchorRef: RefObject<HTMLElement>;
  popupRef: RefObject<HTMLDivElement>;
  label: string;
  /** `refocus`: return focus to the field (Escape, a completed choice). */
  onClose: (refocus: boolean) => void;
  children: ReactNode;
}

/** Floating panel under (or above) the field, in the desktop overlay so windows never clip it. */
function DatePopup({ anchorRef, popupRef, label, onClose, children }: DatePopupProps) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pos = useAnchoredPosition(anchorRef, popupRef);
  useOutsidePointerDown([popupRef, anchorRef], () => closeRef.current(false));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Handled here so a surrounding dialog does not close or trap focus.
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeRef.current(true);
    } else if (e.key === 'Tab') {
      e.stopPropagation();
      const items = Array.from(popupRef.current?.querySelectorAll<HTMLElement>(TABBABLE) ?? []);
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1].focus();
    }
  };

  return (
    <Portal>
      <div ref={popupRef} role="dialog" aria-label={label} className="xbd-datepop" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }} onKeyDown={onKeyDown}>
        {children}
      </div>
    </Portal>
  );
}

/** Closes the popup when focus leaves both the field and the popup (Tab away). */
function leavesPicker(e: FocusEvent, ...roots: Array<RefObject<HTMLElement>>): boolean {
  const next = e.relatedTarget as Node | null;
  return !!next && !roots.some((r) => r.current?.contains(next));
}

/* ------------------------------- DatePicker ------------------------------ */

export interface DatePickerProps extends DateConstraints {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Defaults to the locale's pattern, e.g. `gg.aa.yyyy`. */
  placeholder?: string;
  /** Clear (×) button while a date is set. Default `true`. */
  clearable?: boolean;
  /** "Today" button under the calendar. Default `true`. */
  showToday?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  id?: string;
  /** Posts the value as `YYYY-MM-DD` through a hidden input. */
  name?: string;
  locale?: string;
  weekStartsOn?: Weekday;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  onBlur?: () => void;
}

/**
 * Date field: type it (`26.09.2026`, `26092026`, `26/9/26`…) or pick it from the
 * calendar (click, the calendar button or ↓). Typed text is applied on Enter or
 * blur; text that is not a valid, allowed day is flagged and not applied.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) {
  const { value: valueProp, defaultValue, onChange, placeholder, clearable = true, showToday = true, disabled, invalid, required, id, name, locale: localeProp, weekStartsOn, className, style, onBlur } = props;
  const labels = useUiLabels();
  const uiLocale = useUiLocale();
  const locale = localeProp ?? uiLocale;
  const isDisabled = useDayDisabled(props);
  const [value, setValue] = useControllable(valueProp, defaultValue ?? null, onChange);
  const [text, setText] = useState(() => (value ? formatDate(value, locale) : ''));
  const [bad, setBad] = useState(false);
  const [open, setOpen] = useState(false);
  const [gridFocus, setGridFocus] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const field = useFieldProps({ id, required }, invalid || bad);

  const valueKey = value ? toISODate(value) : '';
  useEffect(() => {
    setText(value ? formatDate(value, locale) : '');
    setBad(false);
    // Re-sync only when the day or the locale changes, not on every new Date instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, locale]);

  const apply = (d: Date | null) => {
    if (!sameValue(d, value)) setValue(d);
    setText(d ? formatDate(d, locale) : '');
    setBad(false);
  };
  const commitText = () => {
    const t = text.trim();
    const d = t ? parseDate(t, locale) : null;
    if (t && (!d || isDisabled(d))) setBad(true);
    else apply(d);
  };
  const openPopup = (focusGrid: boolean) => {
    if (disabled) return;
    setGridFocus(focusGrid);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) inputRef.current?.focus();
  };
  const today = startOfDay(new Date());

  return (
    <>
      <div ref={wrapRef} className={cx('xbd-input-wrap', 'xbd-datepicker', field['aria-invalid'] && 'is-invalid', disabled && 'is-disabled', className)} style={style}>
        <input
          ref={inputRef}
          className="xbd-input"
          value={text}
          placeholder={placeholder ?? datePattern(locale, labels.dateParts)}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-label={props['aria-label']}
          aria-haspopup="dialog"
          aria-expanded={open}
          onChange={(e) => {
            setText(e.target.value);
            setBad(false);
          }}
          onClick={() => !open && openPopup(false)}
          onBlur={(e) => {
            commitText();
            if (open && leavesPicker(e, wrapRef, popupRef)) setOpen(false);
            onBlur?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (open) popupRef.current?.querySelector<HTMLElement>('.xbd-cal__day[tabindex="0"]')?.focus();
              else openPopup(true);
            } else if (e.key === 'Enter') commitText();
            else if (e.key === 'Escape') {
              if (open) setOpen(false);
              else apply(value);
            }
          }}
          {...field}
        />
        <span className="xbd-datepicker__buttons">
          {clearable && value && !disabled && (
            <button type="button" className="xbd-icon-button xbd-icon-button--small" aria-label={labels.clear} title={labels.clear} onClick={() => {
                apply(null);
                inputRef.current?.focus();
              }}>
              <CloseIcon />
            </button>
          )}
          <button
            type="button"
            className="xbd-icon-button xbd-icon-button--small"
            aria-label={labels.chooseDate}
            title={labels.chooseDate}
            aria-expanded={open}
            disabled={disabled}
            onClick={() => (open ? close(true) : openPopup(true))}
          >
            <CalendarIcon />
          </button>
        </span>
        {name && <input type="hidden" name={name} value={valueKey} />}
      </div>
      {open && (
        <DatePopup anchorRef={wrapRef} popupRef={popupRef} label={labels.chooseDate} onClose={close}>
          <DateCalendar
            value={value}
            onChange={(d) => {
              apply(d);
              close(true);
            }}
            min={props.min}
            max={props.max}
            isDateDisabled={props.isDateDisabled}
            locale={locale}
            weekStartsOn={weekStartsOn}
            autoFocus={gridFocus}
          />
          {showToday && (
            <div className="xbd-datepop__footer">
              <Button
                size="sm"
                variant="ghost"
                disabled={isDisabled(today)}
                onClick={() => {
                  apply(today);
                  close(true);
                }}
              >
                {labels.today}
              </Button>
            </div>
          )}
        </DatePopup>
      )}
    </>
  );
});

/* ---------------------------- DateRangePicker ---------------------------- */

export interface DatePreset {
  label: ReactNode;
  /** Evaluated on click, so "today" is always the current day. */
  range: () => DateRange;
}

/** Built-in quick ranges; spread them to add your own: `[...defaultDatePresets(labels), mine]`. */
export function defaultDatePresets(labels: UiLabels['presets']): DatePreset[] {
  const t = () => startOfDay(new Date());
  const lastMonth = () => new Date(t().getFullYear(), t().getMonth() - 1, 1);
  return [
    { label: labels.today, range: () => ({ start: t(), end: t() }) },
    { label: labels.yesterday, range: () => ({ start: addDays(t(), -1), end: addDays(t(), -1) }) },
    { label: labels.last7Days, range: () => ({ start: addDays(t(), -6), end: t() }) },
    { label: labels.last30Days, range: () => ({ start: addDays(t(), -29), end: t() }) },
    { label: labels.thisMonth, range: () => ({ start: startOfMonth(t()), end: endOfMonth(t()) }) },
    { label: labels.lastMonth, range: () => ({ start: lastMonth(), end: endOfMonth(lastMonth()) }) },
    { label: labels.thisYear, range: () => ({ start: new Date(t().getFullYear(), 0, 1), end: new Date(t().getFullYear(), 11, 31) }) },
    { label: labels.lastYear, range: () => ({ start: new Date(t().getFullYear() - 1, 0, 1), end: new Date(t().getFullYear() - 1, 11, 31) }) },
  ];
}

export interface DateRangePickerProps extends DateConstraints {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** Quick ranges beside the calendar. Default: `defaultDatePresets`; `false` hides them. */
  presets?: DatePreset[] | false;
  /** Months side by side. Default 2 (1 on narrow screens). */
  months?: number;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  id?: string;
  /** Hidden `YYYY-MM-DD` inputs for native form posts. */
  startName?: string;
  endName?: string;
  locale?: string;
  weekStartsOn?: Weekday;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/**
 * Start–end field with a two-month calendar and quick ranges. Both ends can be
 * typed; a reversed range is swapped. `onChange` receives `{ start, end }`.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const { clearable = true, disabled, invalid, required, id, startName, endName, locale: localeProp, weekStartsOn, className, style, min, max } = props;
  const labels = useUiLabels();
  const uiLocale = useUiLocale();
  const locale = localeProp ?? uiLocale;
  const isDisabled = useDayDisabled(props);
  const [value, setValue] = useControllable(props.value, props.defaultValue ?? EMPTY_RANGE, props.onChange);
  const show = (d: Date | null) => (d ? formatDate(d, locale) : '');
  const [startText, setStartText] = useState(() => show(value.start));
  const [endText, setEndText] = useState(() => show(value.end));
  const [bad, setBad] = useState({ start: false, end: false });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [gridFocus, setGridFocus] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  // `invalid` or a <Field error>; typed-text errors are flagged per input on top of it.
  const field = useFieldProps({ id, required }, invalid);
  const pattern = datePattern(locale, labels.dateParts);

  const startKey = value.start ? toISODate(value.start) : '';
  const endKey = value.end ? toISODate(value.end) : '';
  useEffect(() => {
    setStartText(show(value.start));
    setEndText(show(value.end));
    setBad({ start: false, end: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey, locale]);

  const apply = (r: DateRange) => {
    let { start, end } = r;
    if (start && end && compareDay(end, start) < 0) [start, end] = [end, start];
    if (!sameValue(start, value.start) || !sameValue(end, value.end)) setValue({ start, end });
    setStartText(show(start));
    setEndText(show(end));
    setBad({ start: false, end: false });
  };
  const commitText = (which: 'start' | 'end') => {
    const t = (which === 'start' ? startText : endText).trim();
    const d = t ? parseDate(t, locale) : null;
    if (t && (!d || isDisabled(d))) setBad((b) => ({ ...b, [which]: true }));
    else apply(which === 'start' ? { start: d, end: value.end } : { start: value.start, end: d });
  };
  const openPopup = (focusGrid: boolean) => {
    if (disabled) return;
    setDraft(value);
    setGridFocus(focusGrid);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) startRef.current?.focus();
  };
  const clampToLimits = (r: DateRange): DateRange => ({
    start: r.start && min && compareDay(r.start, min) < 0 ? startOfDay(min) : r.start,
    end: r.end && max && compareDay(r.end, max) > 0 ? startOfDay(max) : r.end,
  });

  const presets = props.presets === false ? [] : props.presets ?? defaultDatePresets(labels.presets);
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const months = narrow ? 1 : props.months ?? 2;

  const input = (which: 'start' | 'end') => {
    const isStart = which === 'start';
    return (
      <input
        ref={isStart ? startRef : undefined}
        className="xbd-input"
        value={isStart ? startText : endText}
        placeholder={pattern}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        aria-label={isStart ? labels.startDate : labels.endDate}
        aria-haspopup="dialog"
        aria-expanded={open}
        onChange={(e) => {
          (isStart ? setStartText : setEndText)(e.target.value);
          setBad((b) => ({ ...b, [which]: false }));
        }}
        onClick={() => !open && openPopup(false)}
        onBlur={(e) => {
          commitText(which);
          if (open && leavesPicker(e, wrapRef, popupRef)) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (open) popupRef.current?.querySelector<HTMLElement>('.xbd-cal__day[tabindex="0"]')?.focus();
            else openPopup(true);
          } else if (e.key === 'Enter') commitText(which);
          else if (e.key === 'Escape') {
            if (open) setOpen(false);
            else apply(value);
          }
        }}
        {...(isStart ? field : { 'aria-describedby': field['aria-describedby'] })}
        aria-invalid={bad[which] || field['aria-invalid'] || undefined}
      />
    );
  };

  return (
    <>
      <div
        ref={wrapRef}
        role="group"
        aria-label={props['aria-label']}
        className={cx('xbd-input-wrap', 'xbd-datepicker', 'xbd-daterange', (field['aria-invalid'] || bad.start || bad.end) && 'is-invalid', disabled && 'is-disabled', className)}
        style={style}
      >
        {input('start')}
        <span className="xbd-daterange__sep" aria-hidden="true">
          –
        </span>
        {input('end')}
        <span className="xbd-datepicker__buttons">
          {clearable && (value.start || value.end) && !disabled && (
            <button type="button" className="xbd-icon-button xbd-icon-button--small" aria-label={labels.clear} title={labels.clear} onClick={() => {
                apply(EMPTY_RANGE);
                startRef.current?.focus();
              }}>
              <CloseIcon />
            </button>
          )}
          <button
            type="button"
            className="xbd-icon-button xbd-icon-button--small"
            aria-label={labels.chooseDateRange}
            title={labels.chooseDateRange}
            aria-expanded={open}
            disabled={disabled}
            onClick={() => (open ? close(true) : openPopup(true))}
          >
            <CalendarIcon />
          </button>
        </span>
        {startName && <input type="hidden" name={startName} value={startKey} />}
        {endName && <input type="hidden" name={endName} value={endKey} />}
      </div>
      {open && (
        <DatePopup anchorRef={wrapRef} popupRef={popupRef} label={labels.chooseDateRange} onClose={close}>
          <div className="xbd-daterange-pop">
            {presets.length > 0 && (
              <div className="xbd-daterange-pop__presets">
                {presets.map((p, i) => {
                  const r = clampToLimits(p.range());
                  const active = sameValue(r.start, value.start) && sameValue(r.end, value.end);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cx('xbd-daterange-pop__preset', active && 'is-active')}
                      aria-pressed={active}
                      onClick={() => {
                        apply(r);
                        close(true);
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}
            <DateCalendar
              range={draft}
              onRangeChange={(r) => {
                setDraft(r);
                if (r.start && r.end) {
                  apply(r);
                  close(true);
                }
              }}
              months={months}
              min={min}
              max={max}
              isDateDisabled={props.isDateDisabled}
              locale={locale}
              weekStartsOn={weekStartsOn}
              autoFocus={gridFocus}
            />
          </div>
        </DatePopup>
      )}
    </>
  );
}
