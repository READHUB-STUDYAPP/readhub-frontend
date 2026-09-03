import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';

/**
 * The controls above both admin tables: a search box and two filters.
 *
 * Shared because the Readers and Books screens ask the same three questions,
 * and two copies of this would drift apart the first time one of them changed.
 */
export function AdminFilters({
  search,
  onSearch,
  status,
  onStatus,
  sort,
  onSort,
  placeholder = 'Search',
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 focus-within:border-brand">
        <FiSearch size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-body_Medium text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="flex gap-3">
        <Select value={status} onChange={onStatus} label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        <Select value={sort} onChange={onSort} label="Sort order">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </div>
    </div>
  );
}

function Select({ value, onChange, label, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-body_Medium text-ink outline-none focus:border-brand sm:flex-none"
    >
      {children}
    </select>
  );
}

/**
 * A status pill.
 *
 * Green for active, plain for anything else. The word is there as well as the
 * colour, so it still reads for anyone who cannot tell the two apart.
 */
export function StatusPill({ status }) {
  const active = String(status).toLowerCase() === 'active';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-label_Small font-semibold ${
        active ? 'bg-success/15 text-success' : 'bg-surface-variant text-ink-faint'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/**
 * Which page of how many.
 *
 * Hidden entirely when everything fits on one page, rather than showing two
 * dead arrows around the word "1".
 */
export function AdminPager({ page, totalPages, total, onPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3">
      <span className="text-label_Medium text-ink-faint">
        {`Page ${page} of ${totalPages} · ${total.toLocaleString()} in total`}
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
        >
          <FiChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * The table itself, on a screen wide enough for one.
 *
 * Below the large breakpoint the same rows are rendered as cards by the caller.
 * A table is the right shape for six columns of comparable values and the wrong
 * one on a 360px screen, where it either scrolls sideways or crushes every
 * column past reading.
 */
export function AdminTable({ columns, children }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-label_Medium font-semibold text-ink-soft"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
