import { useEffect, useState } from 'react';

import AdminShell from '../../Components/AdminShell';
import { adminApi, readingTime, timeAgo } from '../../services/admin';

const DAYS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'S'];

/**
 * The admin dashboard.
 *
 * Four counts, the week's reading, what people are reading most, and what has
 * just happened -- the four questions someone opens this page to answer, in
 * the order the designs put them.
 *
 * The chart is drawn with divs rather than a charting library. It is seven
 * bars: a library would add weight to the bundle and a second set of
 * conventions to the page, and buys nothing at this size.
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .overview()
      .then(setData)
      .catch((err) =>
        setError(err?.response?.data?.message || 'Could not load the dashboard.'),
      );
  }, []);

  const stats = data?.stats ?? {};
  const week = data?.weekMinutes ?? [];

  // The tallest bar sets the scale. Without the floor of 1, a week with no
  // reading divides by zero and every bar becomes NaN tall.
  const peak = Math.max(1, ...week);

  return (
    <AdminShell title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-tittle_Large font-bold text-ink">Good day, Admin 👋</h2>
          <p className="text-body_Medium text-ink-soft">
            Here&apos;s what&apos;s happening on ReadHub
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body_Medium text-danger">
            {error}
          </p>
        )}

        {/* The four counts. Two columns on a phone, four from the medium
            breakpoint -- one long column of cards is a lot of scrolling for
            four numbers. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            label="Total Readers"
            value={stats.totalReaders}
            note={stats.newReadersThisMonth}
            loading={!data}
          />
          <Stat
            label="Total reading hours"
            value={stats.totalReadingHours}
            loading={!data}
          />
          <Stat label="Total books in library" value={stats.totalBooks} loading={!data} />
          <Stat label="Active readers" value={stats.activeReaders} loading={!data} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          {/* The week. */}
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-6">
            <h3 className="text-tittle_Medium font-bold text-ink">Reading this week</h3>

            <div className="flex h-64 items-end gap-2 sm:gap-4">
              {DAYS.map((day, index) => {
                const minutes = week[index] ?? 0;

                return (
                  <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-brand/70 transition-[height] duration-500"
                        style={{ height: `${Math.max(2, (minutes / peak) * 100)}%` }}
                        title={`${readingTime(minutes)} on ${day}`}
                      />
                    </div>
                    <span className="text-label_Small text-ink-faint">{day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* What people are reading. */}
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-6">
            <h3 className="text-tittle_Medium font-bold text-ink">Popular books</h3>

            {!data ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="h-16 animate-pulse rounded-lg bg-surface-variant" />
                ))}
              </div>
            ) : data.popularBooks.length === 0 ? (
              <p className="text-body_Medium text-ink-soft">
                Nothing has been read yet, so there is nothing to rank.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.popularBooks.map((book) => (
                  <li key={book.title} className="flex items-center gap-3">
                    <img
                      src={book.coverImageUrl || '/note_stack.svg'}
                      alt=""
                      loading="lazy"
                      className="h-16 w-12 shrink-0 rounded-md bg-surface-variant object-cover"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label_Large font-semibold text-ink">
                        {book.title}
                      </span>
                      <span className="text-label_Medium text-ink-faint">
                        {`${book.readers} ${book.readers === 1 ? 'reader' : 'readers'}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* What has just happened. */}
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-6">
          <h3 className="text-tittle_Medium font-bold text-ink">Recent reader activity</h3>

          {!data ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="h-8 animate-pulse rounded bg-surface-variant" />
              ))}
            </div>
          ) : data.recentActivity.length === 0 ? (
            <p className="text-body_Medium text-ink-soft">No reading recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {data.recentActivity.map((row, index) => (
                <li
                  key={`${row.reader}-${row.at}-${index}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
                >
                  <span className="min-w-0 text-body_Medium text-ink">
                    {`${row.reader} read for ${readingTime(row.minutes)} — `}
                    <span className="text-brand">{row.book}</span>
                  </span>
                  <span className="shrink-0 text-label_Medium text-ink-faint">
                    {timeAgo(row.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, note, loading }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="text-label_Medium text-ink-soft">{label}</span>

      {loading ? (
        <span className="mt-1 h-8 w-16 animate-pulse rounded bg-surface-variant" />
      ) : (
        <span className="text-headline_Small font-extrabold tabular-nums text-ink">
          {Number(value ?? 0).toLocaleString()}
        </span>
      )}

      {/* Only shown when the server actually sent a figure: "+0 this month" on
          every card is noise dressed up as information. */}
      {!loading && Number.isFinite(Number(note)) && Number(note) > 0 && (
        <span className="text-label_Small text-success">{`+${note} this month`}</span>
      )}
    </div>
  );
}
