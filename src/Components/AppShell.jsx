import { useEffect, useState } from 'react';
import {
  FiBookOpen,
  FiCompass,
  FiFileText,
  FiHome,
  FiMoreHorizontal,
  FiTarget,
  FiUser,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';

import { ReadHubImages } from '../assets/asset';
import ThemeToggle from './ThemeToggle';

/**
 * The shell every signed-in screen sits inside.
 *
 * One list of destinations, drawn two ways. Above the large breakpoint it is a
 * sidebar: a desktop browser has width to spare and a persistent nav costs
 * nothing there, while a row of tabs across 1440px looks like a phone app
 * stretched. Below it, the bottom bar stays -- that is where a thumb is on a
 * phone browser, and a sidebar would eat a third of a small screen.
 *
 * The two are the same component's two halves rather than two components, so a
 * destination cannot be added to one and forgotten in the other.
 */
const DESTINATIONS = [
  { to: '/home', label: 'Home', Icon: FiHome },
  { to: '/library', label: 'Library', Icon: FiBookOpen },
  { to: '/notes', label: 'Notes', Icon: FiFileText },
  { to: '/explore', label: 'Explore', Icon: FiCompass },
  { to: '/communities', label: 'Communities', Icon: FiUsers },
  { to: '/buddies', label: 'Buddies', Icon: FiUserPlus },
  { to: '/groups', label: 'Groups', Icon: FiUsers },
  { to: '/focus', label: 'Focus', Icon: FiTarget },
  { to: '/profile', label: 'Profile', Icon: FiUser },
];

/**
 * The destinations the phone bar carries directly.
 *
 * Four, not five, because the fifth slot is More -- and More is what makes
 * this list safe to choose. The sidebar holds nine destinations and a phone
 * bar holds about five, so any fixed five leaves four unreachable on a phone,
 * which is most of the readers this app is for. That has bitten this file
 * before: an earlier revision dropped Groups and Profile out of the bar
 * without putting them anywhere else, so on a phone there was no way to reach
 * a reading group, or to sign out.
 *
 * Explore is not here on purpose -- it is reached from the home screen, and
 * browsing what others are reading is a lean-back activity rather than
 * somewhere you tap to on a bus.
 */
const PRIMARY = ['/home', '/library', '/communities', '/buddies'];

function SidebarLink({ item }) {
  const { to, label, Icon } = item;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 rounded-md px-4 py-2 text-body_Medium transition-colors',
          isActive
            ? 'bg-brand-wash text-brand font-semibold'
            : 'text-ink-soft hover:bg-surface-variant hover:text-ink',
        ].join(' ')
      }
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

function TabLink({ item }) {
  const { to, label, Icon } = item;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-label_Small transition-colors',
          isActive ? 'text-brand' : 'text-ink-faint',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-7 w-12 items-center justify-center rounded-md transition-colors',
              isActive ? 'bg-brand-wash' : 'bg-transparent',
            ].join(' ')}
          >
            <Icon size={19} aria-hidden="true" />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const tabs = DESTINATIONS.filter((item) => PRIMARY.includes(item.to));
  const overflow = DESTINATIONS.filter((item) => !PRIMARY.includes(item.to));
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  // A destination chosen from the sheet should not leave the sheet open behind
  // it, and neither should the back button.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-page text-ink">
      {/* Desktop: a fixed sidebar, with the content inset beside it. */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        {/* The mark sits in a round well, which gives a logo of any proportion
            somewhere definite to sit -- a bare PNG in a sidebar floats and
            looks misaligned against the links beneath it. The name is beside
            it rather than inside the image, so the brand still reads if that
            request fails. Linked home, which is where a masthead leads. */}
        <NavLink to="/home" className="mb-6 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-wash">
            <img
              src={ReadHubImages.FirstOnboardingImageIcon}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="text-tittle_Large font-extrabold tracking-tight text-brand">
            ReadHub
          </span>
        </NavLink>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {DESTINATIONS.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-line pt-4">
          <ThemeToggle />
        </div>
      </aside>

      {/*
        The content column.
        `pb-24` on small screens clears the bottom bar; `lg:pl-64` clears the
        sidebar. Padding rather than margin, so a scrolling page's own
        background still reaches the edge behind the bar.
      */}
      <div className="pb-24 lg:pb-0 lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 py-4 lg:px-6 lg:py-6">{children}</main>
      </div>

      {/* Mobile: the bottom bar, over the safe area on a phone browser. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface px-2 pt-1 lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
        aria-label="Main"
      >
        {tabs.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-controls="more-destinations"
          className={[
            'flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-label_Small transition-colors',
            moreOpen || overflow.some((item) => item.to === pathname)
              ? 'text-brand'
              : 'text-ink-faint',
          ].join(' ')}
        >
          <span
            className={[
              'flex h-7 w-12 items-center justify-center rounded-md transition-colors',
              moreOpen || overflow.some((item) => item.to === pathname)
                ? 'bg-brand-wash'
                : 'bg-transparent',
            ].join(' ')}
          >
            <FiMoreHorizontal size={19} aria-hidden="true" />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* The rest of the destinations, for a phone. */}
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          />
          <div
            id="more-destinations"
            className="fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-line bg-surface p-4 lg:hidden"
            style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 6px) + 5.5rem)' }}
          >
            <nav className="grid grid-cols-3 gap-2" aria-label="More destinations">
              {overflow.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'flex flex-col items-center gap-2 rounded-xl p-4 text-label_Small transition-colors',
                      isActive
                        ? 'bg-brand-wash font-semibold text-brand'
                        : 'text-ink-soft hover:bg-surface-variant',
                    ].join(' ')
                  }
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-line pt-4">
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
