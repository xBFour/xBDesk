import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { CheckIcon, ChevronDownIcon, CloseIcon } from '../components/icons';
import { cx } from '../utils';
import { Badge, Spinner } from './basic';
import { useFieldProps } from './form';
import { useAnchoredPosition, useOutsidePointerDown } from './popup';
import { Portal, useUiLabels, useUiLocale } from './shared';

export type ComboboxValue = string | number;

export interface ComboboxOption<V extends ComboboxValue = string> {
  value: V;
  label: string;
  /** Second line (code, city…); searched as well. */
  description?: string;
  icon?: ReactNode;
  /** Options sharing a group are listed under its heading, groups in order of first appearance. */
  group?: string;
  disabled?: boolean;
}

interface ComboboxBaseProps<V extends ComboboxValue> {
  /** Static options, filtered while typing (case- and accent-insensitive: "izmir" finds "İzmir"). */
  options?: ComboboxOption<V>[];
  /**
   * Server search instead of `options`: called with the typed text, results are
   * shown as returned. The signal is aborted when a newer search starts.
   */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<ComboboxOption<V>[]>;
  /** With `loadOptions`: options for the current value(s), so their labels show before any search. */
  initialOptions?: ComboboxOption<V>[];
  /** Delay (ms) after typing before `loadOptions` runs. Default 250. */
  debounce?: number;
  /** Characters needed before `loadOptions` runs. Default 0 — a first page loads on open. */
  minQueryLength?: number;
  /** Most options rendered at once; the rest are reached by refining the search. Default 100. */
  limit?: number;
  placeholder?: string;
  /** Clear (×) button. Default `true`. */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  id?: string;
  /** Posts the value(s) through hidden inputs. */
  name?: string;
  /** Shown when nothing matches. */
  emptyText?: ReactNode;
  /** Custom option content; highlighting, keyboard and selection still work. */
  renderOption?: (option: ComboboxOption<V>, state: { selected: boolean; active: boolean; query: string }) => ReactNode;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  onBlur?: () => void;
}

export interface ComboboxSingleProps<V extends ComboboxValue = string> extends ComboboxBaseProps<V> {
  multiple?: false;
  value?: V | null;
  defaultValue?: V | null;
  onChange?: (value: V | null, option: ComboboxOption<V> | null) => void;
}

export interface ComboboxMultipleProps<V extends ComboboxValue = string> extends ComboboxBaseProps<V> {
  /** Pick several values; they show as removable chips. */
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onChange?: (values: V[], options: ComboboxOption<V>[]) => void;
}

export type ComboboxProps<V extends ComboboxValue = string> = ComboboxSingleProps<V> | ComboboxMultipleProps<V>;

/* ------------------------------ search helpers ----------------------------- */

const MARKS = /[̀-ͯ]/g;
const fold = (s: string, locale: string) => s.toLocaleLowerCase(locale).normalize('NFD').replace(MARKS, '').replace(/ı/g, 'i');

/** Folded text plus, per folded character, the index of its source character. */
function foldWithMap(text: string, locale: string): { text: string; map: number[] } {
  let out = '';
  const map: number[] = [];
  let i = 0;
  for (const ch of text) {
    const f = fold(ch, locale);
    for (let k = 0; k < f.length; k++) map.push(i);
    out += f;
    i += ch.length;
  }
  map.push(i);
  return { text: out, map };
}

const termsOf = (query: string, locale: string) => fold(query, locale).split(/\s+/).filter(Boolean);

function Highlight({ text, terms, locale }: { text: string; terms: string[]; locale: string }) {
  if (!terms.length) return <>{text}</>;
  const f = foldWithMap(text, locale);
  const ranges: Array<[number, number]> = [];
  for (const t of terms) {
    for (let at = f.text.indexOf(t); at !== -1; at = f.text.indexOf(t, at + t.length)) ranges.push([f.map[at], f.map[at + t.length]]);
  }
  if (!ranges.length) return <>{text}</>;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const parts: ReactNode[] = [];
  let pos = 0;
  merged.forEach(([a, b], i) => {
    if (a > pos) parts.push(text.slice(pos, a));
    parts.push(
      <mark key={i} className="xbd-listbox__match">
        {text.slice(a, b)}
      </mark>,
    );
    pos = b;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

/** The floating list; mounted only while open so its position is measured with the panel present. */
function ListPopup({ anchorRef, popupRef, children }: { anchorRef: RefObject<HTMLElement>; popupRef: RefObject<HTMLDivElement>; children: ReactNode }) {
  const pos = useAnchoredPosition(anchorRef, popupRef);
  return (
    <Portal>
      <div
        ref={popupRef}
        className="xbd-listpop"
        style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, minWidth: pos?.anchorWidth }}
        // Keep focus in the input: the list is driven through aria-activedescendant.
        onMouseDown={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </Portal>
  );
}

/* -------------------------------- Combobox -------------------------------- */

function ComboboxInner<V extends ComboboxValue>(props: ComboboxProps<V>, ref: ForwardedRef<HTMLInputElement>) {
  const {
    options,
    loadOptions,
    initialOptions,
    debounce = 250,
    minQueryLength = 0,
    limit = 100,
    placeholder,
    clearable = true,
    disabled,
    invalid,
    required,
    id,
    name,
    emptyText,
    renderOption,
    className,
    style,
    onBlur,
  } = props;
  const multiple = props.multiple === true;
  const labels = useUiLabels();
  const locale = useUiLocale();
  const listId = useId();
  const field = useFieldProps({ id, required }, invalid);

  // Every option seen (static, initial, search results, picks): labels for the selected values.
  const known = useRef(new Map<V, ComboboxOption<V>>());
  const remember = (list?: ComboboxOption<V>[] | null) => list?.forEach((o) => known.current.set(o.value, o));
  remember(options);
  remember(initialOptions);

  const controlled = props.value !== undefined;
  const [inner, setInner] = useState<V | null | V[]>(() => props.defaultValue ?? (multiple ? [] : null));
  const current = controlled ? props.value : inner;
  const selected: V[] = multiple ? ((current as V[] | undefined) ?? []) : current == null ? [] : [current as V];
  const commit = (values: V[]) => {
    if (!controlled) setInner(multiple ? values : (values[0] ?? null));
    const picked = values.map((v) => known.current.get(v)).filter((o): o is ComboboxOption<V> => !!o);
    if (props.multiple === true) props.onChange?.(values, picked);
    else props.onChange?.(values[0] ?? null, picked[0] ?? null);
  };

  const [open, setOpen] = useState(false);
  /** `null`: not searching — a single-select input shows the selected label and the list shows everything. */
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<ComboboxOption<V>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const q = (query ?? '').trim();
  const loadRef = useRef(loadOptions);
  loadRef.current = loadOptions;
  const tooShort = !!loadOptions && q.length < minQueryLength;
  useEffect(() => {
    if (!open || !loadRef.current) return;
    if (q.length < minQueryLength) {
      setRemote(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    const run = () => {
      loadRef.current?.(q, controller.signal).then(
        (result) => {
          if (controller.signal.aborted) return;
          remember(result);
          setRemote(result);
          setLoading(false);
        },
        () => {
          if (controller.signal.aborted) return;
          setFailed(true);
          setLoading(false);
        },
      );
    };
    const timer = q ? setTimeout(run, debounce) : undefined;
    if (!timer) run();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, q, minQueryLength, debounce]);

  const terms = useMemo(() => termsOf(q, locale), [q, locale]);
  const matches = useMemo(() => {
    if (loadOptions) return tooShort ? [] : (remote ?? initialOptions ?? []);
    const all = options ?? [];
    if (!terms.length) return all;
    return all.filter((o) => {
      const hay = fold(`${o.label} ${o.description ?? ''}`, locale);
      return terms.every((t) => hay.includes(t));
    });
  }, [loadOptions, tooShort, remote, initialOptions, options, terms, locale]);

  // Grouped (groups in order of first appearance) and capped for rendering.
  const shown = useMemo(() => {
    const capped = matches.slice(0, limit);
    if (!capped.some((o) => o.group)) return capped;
    const order = new Map<string, number>();
    capped.forEach((o) => !order.has(o.group ?? '') && order.set(o.group ?? '', order.size));
    return [...capped].sort((a, b) => (order.get(a.group ?? '') ?? 0) - (order.get(b.group ?? '') ?? 0));
  }, [matches, limit]);
  const more = matches.length - shown.length;
  const shownKey = useMemo(() => shown.map((o) => `${o.value}${o.disabled ? '!' : ''}`).join('\u0001'), [shown]);

  const firstEnabled = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < shown.length; i += step) if (!shown[i].disabled) return i;
    return -1;
  };
  // Keep a valid active option: the selected one when the list opens, else the first enabled.
  useEffect(() => {
    if (!open) return;
    const sel = query === null ? shown.findIndex((o) => selected.includes(o.value) && !o.disabled) : -1;
    setActive(sel >= 0 ? sel : firstEnabled(0, 1));
    // Keyed by content, so a new array with the same options keeps the keyboard position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shownKey]);

  useEffect(() => {
    if (!open || active < 0) return;
    popupRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const close = () => {
    setOpen(false);
    setQuery(null);
  };
  useOutsidePointerDown([wrapRef, popupRef], () => open && close());

  const choose = (option: ComboboxOption<V>) => {
    if (option.disabled) return;
    remember([option]);
    if (multiple) {
      commit(selected.includes(option.value) ? selected.filter((v) => v !== option.value) : [...selected, option.value]);
      setQuery(null);
    } else {
      commit([option.value]);
      close();
    }
    inputRef.current?.focus();
  };

  const move = (step: number) => {
    if (!shown.length) return;
    const dir = step > 0 ? 1 : -1;
    let i = active < 0 ? (dir > 0 ? -1 : shown.length) : active;
    for (let n = 0; n < Math.abs(step); n++) {
      const next = firstEnabled(i + dir, dir);
      if (next < 0) {
        // Arrows wrap around; page keys stop at the ends.
        if (Math.abs(step) === 1) i = firstEnabled(dir > 0 ? 0 : shown.length - 1, dir);
        break;
      }
      i = next;
    }
    setActive(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else if (!e.altKey) move(e.key === 'ArrowDown' ? 1 : -1);
        break;
      case 'PageDown':
      case 'PageUp':
        if (!open) return;
        e.preventDefault();
        move(e.key === 'PageDown' ? 10 : -10);
        break;
      case 'Enter':
        if (open && shown[active]) {
          e.preventDefault();
          choose(shown[active]);
        }
        break;
      case 'Escape':
        if (open || query !== null) {
          // Handled here so a surrounding dialog stays open.
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case 'Backspace':
        if (multiple && !query && selected.length) commit(selected.slice(0, -1));
        break;
      case 'Tab':
        if (open) close();
        break;
    }
  };

  const selectedOption = !multiple && selected.length ? known.current.get(selected[0]) : undefined;
  const inputValue = query ?? (multiple ? '' : (selectedOption?.label ?? (selected.length ? String(selected[0]) : '')));
  const activeId = open && active >= 0 ? `${listId}-${active}` : undefined;

  let lastGroup: string | undefined;
  const rows: ReactNode[] = [];
  shown.forEach((o, i) => {
    if (o.group && o.group !== lastGroup) {
      rows.push(
        <div key={`g:${o.group}`} className="xbd-listbox__group" role="presentation">
          {o.group}
        </div>,
      );
    }
    lastGroup = o.group;
    const isSelected = selected.includes(o.value);
    rows.push(
      <div
        key={String(o.value)}
        id={`${listId}-${i}`}
        role="option"
        data-index={i}
        aria-selected={isSelected}
        aria-disabled={o.disabled || undefined}
        className={cx('xbd-listbox__option', i === active && 'is-active', isSelected && 'is-selected', o.disabled && 'is-disabled')}
        onMouseMove={() => !o.disabled && active !== i && setActive(i)}
        onClick={() => choose(o)}
      >
        {renderOption ? (
          renderOption(o, { selected: isSelected, active: i === active, query: q })
        ) : (
          <>
            {o.icon && <span className="xbd-listbox__icon">{o.icon}</span>}
            <span className="xbd-listbox__text">
              <span className="xbd-listbox__label">
                <Highlight text={o.label} terms={terms} locale={locale} />
              </span>
              {o.description && (
                <span className="xbd-listbox__desc">
                  <Highlight text={o.description} terms={terms} locale={locale} />
                </span>
              )}
            </span>
          </>
        )}
        <CheckIcon className="xbd-listbox__check" />
      </div>,
    );
  });

  let status: ReactNode = null;
  if (failed) status = labels.loadFailed;
  else if (tooShort) status = labels.typeToSearch(minQueryLength);
  else if (loading && !shown.length)
    status = (
      <>
        <Spinner /> {labels.loading}
      </>
    );
  else if (!shown.length) status = emptyText ?? labels.noResults;

  return (
    <>
      <div
        ref={wrapRef}
        className={cx('xbd-input-wrap', 'xbd-combobox', multiple && 'is-multiple', field['aria-invalid'] && 'is-invalid', disabled && 'is-disabled', className)}
        style={style}
        onMouseDown={(e) => {
          // Clicking the field's padding or chips focuses the input.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {multiple &&
          selected.map((v) => (
            <Badge key={String(v)} tone="accent" onRemove={disabled ? undefined : () => commit(selected.filter((s) => s !== v))}>
              {known.current.get(v)?.label ?? String(v)}
            </Badge>
          ))}
        <input
          ref={inputRef}
          className="xbd-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={activeId}
          aria-label={props['aria-label']}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={multiple && selected.length ? undefined : placeholder}
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onClick={() => !open && setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // An emptied single-select field clears its value.
            if (!multiple && clearable && query === '' && selected.length) commit([]);
            close();
            onBlur?.();
          }}
          {...field}
        />
        <span className="xbd-combobox__buttons" onMouseDown={(e) => e.preventDefault()}>
          {clearable && selected.length > 0 && !disabled && (
            <button
              type="button"
              className="xbd-icon-button xbd-icon-button--small"
              aria-label={labels.clear}
              title={labels.clear}
              onClick={() => {
                commit([]);
                setQuery(null);
                inputRef.current?.focus();
              }}
            >
              <CloseIcon />
            </button>
          )}
          <button
            type="button"
            className="xbd-icon-button xbd-icon-button--small xbd-combobox__chevron"
            aria-label={labels.showOptions}
            title={labels.showOptions}
            aria-expanded={open}
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (open) close();
              else setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <ChevronDownIcon />
          </button>
        </span>
        {name && selected.map((v) => <input key={String(v)} type="hidden" name={name} value={String(v)} />)}
      </div>
      {open && (
        <ListPopup anchorRef={wrapRef} popupRef={popupRef}>
            <div id={listId} role="listbox" aria-multiselectable={multiple || undefined} aria-label={props['aria-label']} aria-busy={loading || undefined}>
              {rows}
            </div>
            {status && <div className="xbd-listbox__state">{status}</div>}
            {loading && shown.length > 0 && <div className="xbd-listbox__loading" role="progressbar" aria-label={labels.loading} />}
            {more > 0 && <div className="xbd-listbox__more">{labels.moreResults(more)}</div>}
        </ListPopup>
      )}
    </>
  );
}

/**
 * Searchable dropdown ("combobox"): type to filter a static list or search a
 * server, pick one value or several (`multiple`). Keyboard: ↑/↓ move, PageUp/
 * PageDown jump, Enter picks, Esc closes, Backspace removes the last chip.
 */
export const Combobox = forwardRef(ComboboxInner) as {
  <V extends ComboboxValue = string>(props: ComboboxMultipleProps<V> & { ref?: Ref<HTMLInputElement> }): ReactElement | null;
  <V extends ComboboxValue = string>(props: ComboboxSingleProps<V> & { ref?: Ref<HTMLInputElement> }): ReactElement | null;
};
