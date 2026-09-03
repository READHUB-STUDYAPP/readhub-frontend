import { apiEndpoints } from '../Util/apiEndpoints';
import axiosConfig from '../Util/axiosConfig';

/**
 * The admin API.
 *
 * Every one of the panel's endpoints in one place, each returning the shape the
 * screens actually use rather than the envelope it arrives in. The list
 * endpoints all answer `{ data, page, limit, total, totalPages }`, so they are
 * unwrapped the same way and a screen never has to remember which.
 *
 * There is no separate admin sign-in on the server: an admin signs in through
 * the ordinary login and `requireAdmin` gates these routes by the role held in
 * the database. `me` is what confirms it.
 */
export const adminApi = {
  /** The signed-in admin, and the check that this account really is one. */
  async me() {
    const { data } = await axiosConfig.get(apiEndpoints.ADMIN_ME);
    return data?.admin ?? null;
  },

  /** Everything the dashboard shows, in one request. */
  async overview() {
    const { data } = await axiosConfig.get(apiEndpoints.ADMIN_OVERVIEW);
    return {
      stats: data?.stats ?? {},
      weekMinutes: Array.isArray(data?.weekMinutes) ? data.weekMinutes : [],
      popularBooks: Array.isArray(data?.popularBooks) ? data.popularBooks : [],
      recentActivity: Array.isArray(data?.recentActivity) ? data.recentActivity : [],
    };
  },

  readers(params) {
    return page(apiEndpoints.ADMIN_READERS, params);
  },

  books(params) {
    return page(apiEndpoints.ADMIN_BOOKS, params);
  },

  /** Outstanding invitations to become an admin. */
  async invites() {
    const { data } = await axiosConfig.get(apiEndpoints.ADMIN_INVITES);
    return Array.isArray(data?.invites) ? data.invites : [];
  },

  /** Invites someone to become an admin. */
  async invite(email) {
    const { data } = await axiosConfig.post(apiEndpoints.ADMIN_INVITE, { email });
    return data;
  },

  /** Accepts an invitation. The only admin route that needs no session. */
  async acceptInvite(payload) {
    const { data } = await axiosConfig.post(apiEndpoints.ADMIN_ACCEPT_INVITE, payload);
    return data;
  },
};

async function page(endpoint, { page = 1, limit = 20, search = '', status = 'all', sort = 'newest' } = {}) {
  const { data } = await axiosConfig.get(endpoint, {
    params: { page, limit, search, status, sort },
  });

  return {
    rows: Array.isArray(data?.data) ? data.data : [],
    page: data?.page ?? page,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
  };
}

/** Minutes as hours and minutes, the way the design writes them: "15h 22m". */
export function readingTime(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

/** "2m ago", and a date once that stops being useful. */
export function timeAgo(iso) {
  if (!iso) return 'Never';

  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}
