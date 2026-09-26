import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { cx } from '../utils';
import { Button, Spinner } from './basic';
import { Checkbox, Select } from './form';
import { useUiLabels, useUiLocale } from './shared';

/* ---------------------------------- Tabs --------------------------------- */

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Panel content; omit to render your own panels using `value`. */
  content?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  variant?: 'line' | 'pill';
  className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, variant = 'line', className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id);
  const current = value ?? inner;
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };
  const enabled = tabs.filter((t) => !t.disabled);
  const onKeyDown = (e: KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === current);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(enabled[next].id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${enabled[next].id}"]`)?.focus();
  };
  const active = tabs.find((t) => t.id === current);
  return (
    <div className={cx('xbd-tabs', `xbd-tabs--${variant}`, className)}>
      <div ref={listRef} role="tablist" className="xbd-tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab={t.id}
            id={`${base}-${t.id}`}
            aria-selected={t.id === current}
            aria-controls={`${base}-${t.id}-panel`}
            tabIndex={t.id === current ? 0 : -1}
            disabled={t.disabled}
            className={cx('xbd-tabs__tab', t.id === current && 'is-active')}
            onClick={() => select(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {active?.content !== undefined && (
        <div role="tabpanel" id={`${base}-${active.id}-panel`} aria-labelledby={`${base}-${active.id}`} className="xbd-tabs__panel" tabIndex={0}>
          {active.content}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Pagination ------------------------------ */

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizes?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({ page, pageSize, total, onPageChange, pageSizes = [10, 25, 50, 100], onPageSizeChange, className }: PaginationProps) {
  const labels = useUiLabels();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nav = (label: string, target: number, icon: ReactNode, disabled: boolean) => (
    <button type="button" className="xbd-icon-button xbd-icon-button--small" aria-label={label} title={label} disabled={disabled} onClick={() => onPageChange(target)}>
      {icon}
    </button>
  );
  return (
    <div className={cx('xbd-pagination', className)}>
      <span className="xbd-pagination__range">{labels.range(from, to, total)}</span>
      {onPageSizeChange && (
        <label className="xbd-pagination__size">
          <span>{labels.rowsPerPage}</span>
          <Select value={String(pageSize)} onChange={(e) => onPageSizeChange(Number(e.target.value))} options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))} />
        </label>
      )}
      <span className="xbd-pagination__page">{labels.pageOf(page, pages)}</span>
      <div className="xbd-pagination__nav">
        {nav(labels.firstPage, 1, <span className="xbd-pagination__double"><ChevronLeftIcon /><ChevronLeftIcon /></span>, page <= 1)}
        {nav(labels.previousPage, page - 1, <ChevronLeftIcon />, page <= 1)}
        {nav(labels.nextPage, page + 1, <ChevronRightIcon />, page >= pages)}
        {nav(labels.lastPage, pages, <span className="xbd-pagination__double"><ChevronRightIcon /><ChevronRightIcon /></span>, page >= pages)}
      </div>
    </div>
  );
}

/* -------------------------------- DataTable ------------------------------ */

type SortValue = string | number | Date | boolean | null | undefined;
export type SortDirection = 'asc' | 'desc';
export type RowKey = string | number;

export interface SortState {
  key: string;
  dir: SortDirection;
}

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  /** Cell content; defaults to `row[key]`. */
  cell?: (row: T, index: number) => ReactNode;
  /** Value used for sorting; defaults to `row[key]`. */
  sortValue?: (row: T) => SortValue;
  /** Default `true`. */
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** Keep cell content on one line (numbers, codes, chips). */
  nowrap?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  /** All rows — or, in server mode (`total` set), only the current page. */
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => RowKey;
  /**
   * Row count on the server. Setting it switches to **server mode**: `rows` is
   * the current page, and sorting and paging are not applied here but reported
   * through `onSortChange`, `onPageChange` and `onPageSizeChange` so you can
   * fetch the right page (see `useServerTable`).
   */
  total?: number;
  /** Current page, 1-based (controlled). */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Rows per page; `0` disables pagination. Default 25. Controlled when `onPageSizeChange` is set. */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: number[];
  /** Current sort (controlled); `null` = unsorted. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  defaultSort?: SortState;
  selectable?: boolean;
  selected?: Set<RowKey>;
  onSelectedChange?: (selected: Set<RowKey>) => void;
  onRowClick?: (row: T) => void;
  /** Rows already on screen stay visible (dimmed) while loading; a spinner shows when there are none. */
  loading?: boolean;
  /** Shown instead of the rows, e.g. a failed request. */
  error?: ReactNode;
  /** Adds a retry button to the error row. */
  onRetry?: () => void;
  /** Shown when there are no rows. */
  empty?: ReactNode;
  dense?: boolean;
  /**
   * Height of the scroll area. Header stays visible and both scroll bars sit
   * inside the table, so wide tables stay usable in small windows.
   */
  maxHeight?: number | string;
  className?: string;
  caption?: string;
}

const valueOf = (row: unknown, key: string): SortValue => (row as Record<string, SortValue>)[key];

/** Sorted (before paging), paginated, selectable table — client-side, or server-side with `total`. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  total,
  page: pageProp,
  onPageChange,
  pageSize: pageSizeProp,
  onPageSizeChange,
  pageSizes,
  sort: sortProp,
  onSortChange,
  defaultSort,
  selectable,
  selected: selectedProp,
  onSelectedChange,
  onRowClick,
  loading,
  error,
  onRetry,
  empty,
  dense,
  maxHeight,
  className,
  caption,
}: DataTableProps<T>) {
  const labels = useUiLabels();
  const locale = useUiLocale();
  const server = total !== undefined;

  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort ?? null);
  const sort = sortProp !== undefined ? sortProp : innerSort;
  const changeSort = (next: SortState | null) => {
    if (sortProp === undefined) setInnerSort(next);
    onSortChange?.(next);
  };
  const [innerPage, setInnerPage] = useState(1);
  const page = pageProp ?? innerPage;
  const changePage = (next: number) => {
    if (pageProp === undefined) setInnerPage(next);
    onPageChange?.(next);
  };
  const [innerPageSize, setInnerPageSize] = useState(pageSizeProp ?? 25);
  const pageSize = onPageSizeChange && pageSizeProp !== undefined ? pageSizeProp : innerPageSize;
  const changePageSize = (next: number) => {
    setInnerPageSize(next);
    onPageSizeChange?.(next);
    changePage(1);
  };

  const [innerSelected, setInnerSelected] = useState<Set<RowKey>>(() => new Set());
  const selected = selectedProp ?? innerSelected;
  const setSelected = (s: Set<RowKey>) => {
    if (!selectedProp) setInnerSelected(s);
    onSelectedChange?.(s);
  };

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: 'base' }), [locale]);

  // Sort BEFORE paging, otherwise only the visible page would be ordered. The server sorts in server mode.
  const sorted = useMemo(() => {
    if (server || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = col.sortValue ?? ((r: T) => valueOf(r, col.key));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      if (x instanceof Date && y instanceof Date) return (x.getTime() - y.getTime()) * dir;
      return collator.compare(String(x), String(y)) * dir;
    });
  }, [server, rows, columns, sort, collator]);

  const count = server ? total : sorted.length;
  const pages = pageSize > 0 ? Math.max(1, Math.ceil(count / pageSize)) : 1;
  useEffect(() => {
    if (!server && page > pages) changePage(pages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, page, pages]);
  const visible = server || pageSize <= 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    changeSort(sort?.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    changePage(1);
  };

  const visibleKeys = visible.map(rowKey);
  const allOnPage = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someOnPage = visibleKeys.some((k) => selected.has(k));
  const togglePage = () => {
    const next = new Set(selected);
    visibleKeys.forEach((k) => (allOnPage ? next.delete(k) : next.add(k)));
    setSelected(next);
  };
  const toggleRow = (k: RowKey) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);
  const state = (content: ReactNode, tone?: 'error') => (
    <tr>
      <td colSpan={colSpan} className={cx('xbd-table__state', tone && `is-${tone}`)}>
        {content}
      </td>
    </tr>
  );

  return (
    <div className={cx('xbd-table-wrap', dense && 'is-dense', loading && 'is-loading', className)}>
      {loading && visible.length > 0 && <div className="xbd-table__progress" role="progressbar" aria-label={labels.loading} />}
      <div className="xbd-table-scroll" style={{ maxHeight }}>
        <table className="xbd-table" aria-busy={loading || undefined}>
          {caption && <caption className="xbd-visually-hidden">{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th className="xbd-table__select">
                  <Checkbox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} aria-label={labels.selectAll} />
                </th>
              )}
              {columns.map((c) => {
                const sortable = c.sortable !== false;
                const dir = sort?.key === c.key ? sort.dir : null;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={{ width: c.width, textAlign: c.align }}
                    aria-sort={dir ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={c.className}
                  >
                    {sortable ? (
                      <button type="button" className={cx('xbd-table__sort', dir && 'is-sorted', c.align === 'right' && 'is-right')} onClick={() => toggleSort(c.key)}>
                        {c.header}
                        <span className="xbd-table__sort-icon" aria-hidden="true">
                          {dir === 'desc' ? '▼' : '▲'}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {error
              ? state(
                  <>
                    <span>{error}</span>
                    {onRetry && (
                      <Button size="sm" onClick={onRetry}>
                        {labels.retry}
                      </Button>
                    )}
                  </>,
                  'error',
                )
              : visible.length === 0
                ? state(loading ? <Spinner /> : empty ?? labels.noRows)
                : visible.map((row, i) => {
                    const k = rowKey(row);
                    const isSel = selected.has(k);
                    return (
                      <tr
                        key={k}
                        className={cx(isSel && 'is-selected', onRowClick && 'is-clickable')}
                        aria-selected={selectable ? isSel : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                      >
                        {selectable && (
                          <td className="xbd-table__select" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSel} onChange={() => toggleRow(k)} aria-label={labels.selectRow} />
                          </td>
                        )}
                        {columns.map((c) => (
                          <td key={c.key} className={cx(c.nowrap && 'is-nowrap', c.className)} style={{ textAlign: c.align }}>
                            {c.cell ? c.cell(row, i) : String(valueOf(row, c.key) ?? '')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && count > 0 && !error && (
        <Pagination page={Math.min(page, pages)} pageSize={pageSize} total={count} onPageChange={changePage} pageSizes={pageSizes} onPageSizeChange={changePageSize} />
      )}
    </div>
  );
}

/* ----------------------------- useServerTable ---------------------------- */

export interface ServerTableQuery {
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: SortState | null;
  /** Aborted when a newer request starts or the component unmounts — pass it to `fetch`. */
  signal: AbortSignal;
}

export interface ServerTablePage<T> {
  rows: T[];
  total: number;
}

export interface UseServerTableOptions<T> {
  /** Loads one page. Throw (or reject) to show the error row. */
  fetch: (query: ServerTableQuery) => Promise<ServerTablePage<T>>;
  /** Filter values: when one changes, the table goes back to page 1 and reloads. Dates compare by value. */
  deps?: unknown[];
  /** Initial rows per page. Default 25. */
  pageSize?: number;
  defaultSort?: SortState | null;
  /** Delay (ms) before reloading after `deps` change — for search boxes. Paging and sorting load at once. */
  debounce?: number;
}

const sameDep = (a: unknown, b: unknown) => Object.is(a, b) || (a instanceof Date && b instanceof Date && a.getTime() === b.getTime());

/** Increments whenever the values change (shallow; Dates by value). */
function useChangeCounter(values: unknown[]): number {
  const ref = useRef({ values, n: 0 });
  const prev = ref.current.values;
  if (values.length !== prev.length || values.some((v, i) => !sameDep(v, prev[i]))) ref.current = { values, n: ref.current.n + 1 };
  return ref.current.n;
}

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * State and loading for a server-side `DataTable`:
 *
 * ```tsx
 * const table = useServerTable({
 *   fetch: ({ page, pageSize, sort, signal }) => api.list({ page, pageSize, sort, q }, { signal }),
 *   deps: [q],
 *   debounce: 300,
 * });
 * <DataTable {...table.tableProps} columns={columns} rowKey={(r) => r.id} />
 * ```
 *
 * Only the latest request can update the table (older ones are aborted), rows
 * stay on screen while the next page loads, and changing `deps` returns to page 1
 * with a single request.
 */
export function useServerTable<T>({ fetch, deps = [], pageSize: initialPageSize = 25, defaultSort = null, debounce = 0 }: UseServerTableOptions<T>) {
  const depsVersion = useChangeCounter(deps);
  // The page belongs to one filter state; a filter change reads as page 1 without an extra render or request.
  const [pageState, setPageState] = useState({ page: 1, version: depsVersion });
  const page = pageState.version === depsVersion ? pageState.page : 1;
  const setPage = useCallback((p: number) => setPageState({ page: p, version: depsVersion }), [depsVersion]);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<SortState | null>(defaultSort);
  const [data, setData] = useState<ServerTablePage<T>>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [nonce, setNonce] = useState(0);
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;
  const fetchedVersion = useRef(depsVersion);

  const sortKey = sort ? `${sort.key}:${sort.dir}` : '';
  useEffect(() => {
    const controller = new AbortController();
    const filtersChanged = fetchedVersion.current !== depsVersion;
    fetchedVersion.current = depsVersion;
    setLoading(true);
    const run = () => {
      Promise.resolve()
        .then(() => fetchRef.current({ page, pageSize, sort, signal: controller.signal }))
        .then(
          (result) => {
            if (controller.signal.aborted) return;
            setData({ rows: result.rows, total: result.total });
            setError(null);
            setLoading(false);
          },
          (err: unknown) => {
            if (controller.signal.aborted) return;
            setError(err);
            setLoading(false);
          },
        );
    };
    const timer = filtersChanged && debounce > 0 ? setTimeout(run, debounce) : undefined;
    if (!timer) run();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // `sort` is represented by `sortKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortKey, depsVersion, nonce, debounce]);

  // Fewer results than before (rows deleted elsewhere): step back to the last page.
  const pages = Math.max(1, Math.ceil(data.total / pageSize));
  useEffect(() => {
    if (!loading && !error && page > pages) setPage(pages);
  }, [loading, error, page, pages, setPage]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const changeSort = useCallback(
    (s: SortState | null) => {
      setSort(s);
      setPage(1);
    },
    [setPage],
  );
  const changePageSize = useCallback(
    (n: number) => {
      setPageSize(n);
      setPage(1);
    },
    [setPage],
  );

  return {
    /** Spread onto `<DataTable>`. */
    tableProps: {
      rows: data.rows,
      total: data.total,
      page,
      onPageChange: setPage,
      pageSize,
      onPageSizeChange: changePageSize,
      sort,
      onSortChange: changeSort,
      loading,
      error: error ? messageOf(error) : undefined,
      onRetry: reload,
    },
    rows: data.rows,
    total: data.total,
    page,
    pageSize,
    sort,
    loading,
    error,
    setPage,
    reload,
  };
}
