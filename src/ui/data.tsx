import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { cx } from '../utils';
import { Spinner } from './basic';
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
type RowKey = string | number;

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
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => RowKey;
  /** Rows per page; `0` disables pagination. Default 25. */
  pageSize?: number;
  pageSizes?: number[];
  defaultSort?: { key: string; dir: SortDirection };
  selectable?: boolean;
  selected?: Set<RowKey>;
  onSelectedChange?: (selected: Set<RowKey>) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
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

/** Sorted (before paging), paginated, selectable table. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize: initialPageSize = 25,
  pageSizes,
  defaultSort,
  selectable,
  selected: selectedProp,
  onSelectedChange,
  onRowClick,
  loading,
  empty,
  dense,
  maxHeight,
  className,
  caption,
}: DataTableProps<T>) {
  const labels = useUiLabels();
  const locale = useUiLocale();
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [innerSelected, setInnerSelected] = useState<Set<RowKey>>(() => new Set());
  const selected = selectedProp ?? innerSelected;
  const setSelected = (s: Set<RowKey>) => {
    if (!selectedProp) setInnerSelected(s);
    onSelectedChange?.(s);
  };

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: 'base' }), [locale]);

  // Sort BEFORE paging, otherwise only the visible page would be ordered.
  const sorted = useMemo(() => {
    if (!sort) return rows;
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
  }, [rows, columns, sort, collator]);

  const pages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const visible = pageSize > 0 ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
    setPage(1);
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

  return (
    <div className={cx('xbd-table-wrap', dense && 'is-dense', className)}>
      <div className="xbd-table-scroll" style={{ maxHeight }}>
        <table className="xbd-table">
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
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="xbd-table__state">
                  <Spinner />
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="xbd-table__state">
                  {empty ?? labels.noRows}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && sorted.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
          pageSizes={pageSizes}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
