import { useEffect, useState } from 'react';
import { FiBarChart2, FiGrid, FiLogOut, FiMenu, FiUsers, FiX } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ReadHubImages } from '../assets/asset';
import { adminApi } from '../services/admin';
import { apiEndpoints } from '../Util/apiEndpoints';
import axiosConfig from '../Util/axiosConfig';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: FiGrid },
  { to: '/admin/readers', label: 'Readers', Icon: FiUsers },
  { to: '/admin/books', label: 'Books', Icon: FiBarChart2 },
];

/**
 * The frame every admin screen sits in.
 *
 * A blue rail down the left with the wordmark, the three destinations and the
 * signed-in admin at the foot, exactly as the designs have it. The rail is
 * fixed on a desktop and slides in over the page below the large breakpoint,
 * because the designs are drawn at desktop width and a 256px column on a phone
 * leaves nothing for the tables.
 *
 * The blue is the fixed brand value rather than the themed one: this rail is a
 * solid field of brand colour, and the themed `--brand` lightens in dark mode
 * for use as an accent, which would wash the whole rail out.
 */
export default function AdminShell({ title, children, actions }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Also the gate: `me` is what says this account is really an admin, and a
    // 401 or 403 sends them to the sign-in page via the axios interceptor.
    adminApi.me().then(setAdmin).catch(() => setAdmin(null));
  }, []);

  const onLogout = async () => {
    try {
      await axiosConfig.post(apiEndpoints.LOGOUT, {});
    } catch {
      // Signing out of this browser matters more than telling the server.
    }
    localStorage.clear();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh bg-page">
      {/* The rail. Fixed on a desktop, a drawer below it. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between p-5 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--brand-500)' }}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <img
                  src={ReadHubImages.FirstOnboardingImageIcon}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              </span>
              <span className="text-tittle_Large font-bold text-white">ReadHub</span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the menu"
              className="text-white/80 transition-colors hover:text-white lg:hidden"
            >
              <FiX size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-body_Medium transition-colors ${
                    active
                      ? 'bg-white/20 font-semibold text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/20 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-label_Medium font-bold text-white">
              {(admin?.username ?? 'A').slice(0, 1).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label_Large font-semibold text-white">
                {admin?.username ?? 'Admin'}
              </span>
              <span className="text-label_Small text-white/70">Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-label_Large text-white/80 transition-colors hover:text-white"
          >
            <FiLogOut size={16} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      {/* The scrim, so a tap outside the drawer closes it. */}
      {open && (
        <button
          type="button"
          aria-label="Close the menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open the menu"
            className="text-ink-soft transition-colors hover:text-ink lg:hidden"
          >
            <FiMenu size={22} />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-tittle_Large font-bold text-ink sm:text-headline_Small">
            {title}
          </h1>

          {actions}
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
