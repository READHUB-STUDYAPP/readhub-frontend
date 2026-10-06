import axiosConfig from '../Util/axiosConfig';

/**
 * Reading Buddy: one reader paired with another around a book.
 *
 * One module for every buddy call, so no screen assembles a URL. The server
 * owns the vocabularies (reading times, paces, purposes) and hands them back
 * with the profile, so the labels below are presentation only -- adding a new
 * purpose server-side does not mean editing a list in two places, it means the
 * label falls back to the raw value until someone writes a nicer one.
 */

export const buddiesApi = {
  /** The caller's own profile, their tier limits, and what they have used. */
  async myProfile() {
    const { data } = await axiosConfig.get('buddies/profile');
    return data;
  },

  async saveProfile(payload) {
    const { data } = await axiosConfig.put('buddies/profile', payload);
    return data;
  },

  /** Scored recommendations. `filter` narrows the same list. */
  async discover({ filter = 'recommended', skip = 0 } = {}) {
    const { data } = await axiosConfig.get('buddies/discover', { params: { filter, skip } });
    return data;
  },

  /** One reader's public profile, with why they were suggested. */
  async profileOf(userId) {
    const { data } = await axiosConfig.get(`buddies/users/${userId}`);
    return data;
  },

  async sendRequest(userId, message) {
    const { data } = await axiosConfig.post(`buddies/users/${userId}/request`, { message });
    return data;
  },

  async requests() {
    const { data } = await axiosConfig.get('buddies/requests');
    return { incoming: data?.incoming ?? [], outgoing: data?.outgoing ?? [] };
  },

  async respond(requestId, accept) {
    const { data } = await axiosConfig.patch(`buddies/requests/${requestId}`, { accept });
    return data;
  },

  async cancelRequest(requestId) {
    const { data } = await axiosConfig.delete(`buddies/requests/${requestId}`);
    return data;
  },

  async mine() {
    const { data } = await axiosConfig.get('buddies');
    return { buddies: data?.buddies ?? [], limits: data?.limits };
  },

  async end(buddyId) {
    const { data } = await axiosConfig.delete(`buddies/${buddyId}`);
    return data;
  },

  /* --------------------------------------------------------- shared reads */

  async reads(buddyId) {
    const { data } = await axiosConfig.get(`buddies/${buddyId}/reads`);
    return Array.isArray(data) ? data : [];
  },

  async startRead(buddyId, payload) {
    const { data } = await axiosConfig.post(`buddies/${buddyId}/reads`, payload);
    return data;
  },

  async setProgress(buddyId, readId, page) {
    const { data } = await axiosConfig.patch(`buddies/${buddyId}/reads/${readId}/progress`, { page });
    return data;
  },

  async setGoal(buddyId, readId, payload) {
    const { data } = await axiosConfig.patch(`buddies/${buddyId}/reads/${readId}/goal`, payload);
    return data;
  },

  async abandonRead(buddyId, readId) {
    const { data } = await axiosConfig.delete(`buddies/${buddyId}/reads/${readId}`);
    return data;
  },

  /* ---------------------------------------------------------------- chat */

  async messages(buddyId, before) {
    const { data } = await axiosConfig.get(`buddies/${buddyId}/messages`, {
      params: { before: before || undefined },
    });
    return { messages: data?.messages ?? [], hasMore: Boolean(data?.hasMore) };
  },

  async post(buddyId, payload) {
    const { data } = await axiosConfig.post(`buddies/${buddyId}/messages`, payload);
    return data;
  },

  async react(buddyId, messageId, emoji) {
    const { data } = await axiosConfig.post(`buddies/${buddyId}/messages/${messageId}/react`, { emoji });
    return data;
  },

  async deleteMessage(buddyId, messageId) {
    const { data } = await axiosConfig.delete(`buddies/${buddyId}/messages/${messageId}`);
    return data;
  },

  /* ------------------------------------------------------ safety controls */

  async block(userId, reason) {
    const { data } = await axiosConfig.post(`buddies/users/${userId}/block`, { reason });
    return data;
  },

  async unblock(userId) {
    const { data } = await axiosConfig.delete(`buddies/users/${userId}/block`);
    return data;
  },

  async blocked() {
    const { data } = await axiosConfig.get('buddies/blocked');
    return Array.isArray(data) ? data : [];
  },

  async report(userId, payload) {
    const { data } = await axiosConfig.post(`buddies/users/${userId}/report`, payload);
    return data;
  },
};

/** The tabs above Discover. */
export const DISCOVER_FILTERS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'same-book', label: 'Same book' },
  { value: 'same-goal', label: 'Same goal' },
  { value: 'same-genre', label: 'Shared taste' },
];

/** Why someone wants a buddy, in words a student would use. */
export const PURPOSE_LABELS = {
  accountability: 'Accountability',
  discussion: 'Discussion',
  casual: 'Casual reading',
  'goal-focused': 'Goal-focused',
};

export const TIME_LABELS = {
  'early-morning': 'Early morning',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  flexible: 'Flexible',
};

export const PACE_LABELS = {
  relaxed: 'Relaxed',
  steady: 'Steady',
  fast: 'Fast',
};

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate-content', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'underage-safety', label: 'Concern about a young reader' },
  { value: 'other', label: 'Something else' },
];

/** Genres offered as chips. Readers can still be matched on anything. */
export const GENRE_SUGGESTIONS = [
  'self-development',
  'memoir',
  'fiction',
  'fantasy',
  'science-fiction',
  'romance',
  'history',
  'business',
  'psychology',
  'poetry',
  'thriller',
  'biography',
  'spirituality',
  'science',
];

export function labelFor(map, value) {
  return map[value] ?? value ?? '';
}

/** "2 hours ago" — never a date for something that happened minutes ago. */
export function timeAgo(iso) {
  if (!iso) return '';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}

/**
 * How far through a shared read one person is, as a percentage.
 *
 * Returns null rather than 0 when there is no target, so a progress bar can
 * tell "not started" from "no goal set" and show the right thing for each.
 */
export function percentOf(progressRow, targetPage) {
  if (!targetPage || targetPage <= 0) return null;
  const page = progressRow?.page ?? 0;
  return Math.min(100, Math.round((page / targetPage) * 100));
}
