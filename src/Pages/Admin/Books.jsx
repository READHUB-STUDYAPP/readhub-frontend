import { useCallback, useEffect, useState } from 'react';

import AdminShell from '../../Components/AdminShell';
import { AdminFilters, AdminPager, AdminTable, StatusPill } from '../../Components/AdminTable';
import { adminApi, timeAgo } from '../../services/admin';

const COLUMNS = ['Book', 'Genre', 'Author', 'Readers', 'Status'];

/**
 * The ReadHub library.
 *
 * The server groups these by title, so a book twenty readers have each uploaded
 * their own copy of is one row with twenty readers rather than twenty rows --
 * which is the question this page is asked: what is in the library, and who is
 * reading it.
 */
export default function Books() {
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
      const result = await adminApi.books({ page, search, status, sort });
      setRows(result.rows);
      setMeta({ page: result.page, total: result.total, totalPages: result.totalPages });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load books.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <AdminShell title="Books">
      <div className="flex flex-col gap-4">
        <p className="text-body_Medium text-ink-soft">Manage the ReadHub library</p>

        <AdminFilters
          search={search}
          onSearch={change(setSearch)}
          status={status}
          onStatus={change(setStatus)}
          sort={sort}
          onSort={change(setSort)}
          placeholder="Search title or author"
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
              {search ? `No books match “${search}”.` : 'No books in the library yet.'}
            </p>
          ) : (
            <>
              <AdminTable columns={COLUMNS}>
                {rows.map((book) => (
                  <tr key={book.title} className="text-body_Medium text-ink">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImageUrl || '/note_stack.svg'}
                          alt=""
                          loading="lazy"
                          className="h-12 w-9 shrink-0 rounded bg-surface-variant object-cover"
                        />
                        <span className="line-clamp-2 font-semibold">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{book.genre || '—'}</td>
                    <td className="px-4 py-3 text-ink-soft">{book.author || 'Unknown'}</td>
                    <td className="px-4 py-3 tabular-nums">{book.readers ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={book.status} />
                    </td>
                  </tr>
                ))}
              </AdminTable>

              <ul className="flex flex-col divide-y divide-line lg:hidden">
                {rows.map((book) => (
                  <li key={book.title} className="flex items-start gap-3 p-4">
                    <img
                      src={book.coverImageUrl || '/note_stack.svg'}
                      alt=""
                      loading="lazy"
                      className="h-16 w-12 shrink-0 rounded bg-surface-variant object-cover"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="line-clamp-2 text-label_Large font-semibold text-ink">
                        {book.title}
                      </span>
                      <span className="truncate text-label_Medium text-ink-faint">
                        {book.author || 'Unknown'}
                        {book.genre ? ` · ${book.genre}` : ''}
                      </span>
                      <span className="text-label_Medium text-ink-faint">
                        {`${book.readers ?? 0} ${book.readers === 1 ? 'reader' : 'readers'}`}
                        {book.lastUpdated ? ` · ${timeAgo(book.lastUpdated)}` : ''}
                      </span>
                    </div>

                    <StatusPill status={book.status} />
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
