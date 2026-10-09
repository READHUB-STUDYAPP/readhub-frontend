import { useEffect, useState } from 'react';

import axiosConfig from '../Util/axiosConfig';

/**
 * Badges a reader has earned.
 *
 * Two shapes, because two audiences. On your own profile the unearned ones are
 * worth showing -- they are something to aim for. On somebody else's they are
 * not: a stranger's page listing what they have failed to manage is nobody's
 * business, so `showAvailable` is off by default and the server does not even
 * send them on a public profile.
 *
 * The catalogue comes from the server, labels and all, so adding a badge is a
 * table entry there rather than a deploy here.
 */

export function AchievementList({ achievements = [], emptyText = 'No badges yet.' }) {
  if (achievements.length === 0) {
    return <p className="text-body_Small text-ink-soft">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {achievements.map((badge) => (
        <li
          key={badge.key}
          title={badge.earnedBy}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2"
        >
          <span aria-hidden="true" className="text-body_Large">
            {badge.icon}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body_Small font-semibold text-ink">{badge.label}</span>
            <span className="truncate text-label_Small text-ink-faint">{badge.earnedBy}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The caller's own badges, fetched here so no page has to know the endpoint.
 *
 * Fails quietly: a profile that cannot load its decorations is still a
 * profile, and an error banner where a row of badges should be is worse than
 * the row simply not being there.
 */
export default function Achievements({ showAvailable = true }) {
  const [state, setState] = useState({ loading: true, earned: [], available: [] });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await axiosConfig.get('profile/achievements');
        if (cancelled) return;
        setState({
          loading: false,
          earned: data?.earned ?? [],
          available: data?.available ?? [],
        });
      } catch {
        if (!cancelled) setState({ loading: false, earned: [], available: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return <div className="h-16 animate-pulse rounded-xl bg-surface-variant" />;
  }

  // Nothing earned and nothing to aim for means the catalogue could not be
  // read. Say nothing rather than show an empty shelf.
  if (state.earned.length === 0 && state.available.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-tittle_Large font-bold text-ink">Achievements</h2>

      <AchievementList
        achievements={state.earned}
        emptyText="Nothing yet. Read a few days in a row and the first one arrives."
      />

      {showAvailable && state.available.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-body_Small font-semibold text-ink-soft">To aim for</h3>
          <ul className="flex flex-wrap gap-2">
            {state.available.map((badge) => (
              <li
                key={badge.key}
                title={badge.earnedBy}
                className="flex items-center gap-2 rounded-full border border-dashed border-line px-3 py-2"
              >
                {/* Greyed, not hidden: on your own page an unearned badge is a
                    suggestion. It never appears on anybody else's. */}
                <span aria-hidden="true" className="text-body_Large opacity-40">
                  {badge.icon}
                </span>
                <span className="truncate text-label_Medium text-ink-faint">{badge.earnedBy}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
