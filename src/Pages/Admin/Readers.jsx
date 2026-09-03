import { useCallback, useEffect, useState } from 'react';

import AdminShell from '../../Components/AdminShell';
import { AdminFilters, AdminPager, AdminTable, StatusPill } from '../../Components/AdminTable';
import { adminApi, readingTime, timeAgo } from '../../services/admin';

const COLUMNS = ['Reader', 'Books', 'Reading time', 'Current book', 'Last active', 'Status'];

/**
 * Everyone using ReadHub.
 *
 * A table on a desktop, as the designs draw it, and the same rows as cards
 * below the large breakpoint -- six columns on a phone either scroll sideways
 * or crush every one of them past reading.
 *
 * Searching and filtering happen on the server, which is what makes this work
 * with more readers than one page: filtering an array of twenty here would
 * only ever search the twenty already fetched.
 */
export default function Readers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.readers({ page, search, status, sort });
      setRows(result.rows);
      setMeta({ page: result.page, total: result.total, totalPages: result.totalPages });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load readers.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    // Debounced, so typing a name is one request when they stop rather than
    // one per keystroke.
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Any change to what is being asked for starts again at the first page:
  // staying on page 4 of a new, shorter result is an empty screen.
  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <AdminShell title="Readers">
      <div className="flex flex-col gap-4">
        <AdminFilters
          search={search}
          onSearch={change(setSearch)}
          status={status}
          onStatus={change(setStatus)}
          sort={sort}
          onSort={change(setSort)}
          placeholder="Search readers"
        />

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body_Medium text-danger">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2, 3, 4].map((key) => (
                <div key={key} className="h-14 animate-pulse rounded-lg bg-surface-variant" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-body_Medium text-ink-soft">
              {search ? `No readers match “${search}”.` : 'No readers yet.'}
            </p>
          ) : (
            <>
              <AdminTable columns={COLUMNS}>
                {rows.map((reader) => (
                  <tr key={reader._id} className="text-body_Medium text-ink">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{reader.username}</span>
                        <span className="text-label_Medium text-ink-faint">{reader.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{reader.booksCount ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {readingTime(reader.readingMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-1">{reader.currentBook || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{timeAgo(reader.lastActive)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={reader.status} />
                    </td>
                  </tr>
                ))}
              </AdminTable>

              {/* The same rows, as cards, on a narrow screen. */}
              <ul className="flex flex-col divide-y divide-line lg:hidden">
                {rows.map((reader) => (
                  <li key={reader._id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-label_Large font-semibold text-ink">
                          {reader.username}
                        </span>
                        <span className="truncate text-label_Medium text-ink-faint">
                          {reader.email}
                        </span>
                      </div>
                      <StatusPill status={reader.status} />
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-label_Medium">
                      <Cell label="Books" value={reader.booksCount ?? 0} />
                      <Cell label="Reading time" value={readingTime(reader.readingMinutes)} />
                      <Cell label="Current book" value={reader.currentBook || '—'} />
                      <Cell label="Last active" value={timeAgo(reader.lastActive)} />
                    </dl>
                  </li>
                ))}
              </ul>

              <AdminPager
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPage={setPage}
              />
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Cell({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="truncate text-ink">{value}</dd>
    </div>
  );
}
