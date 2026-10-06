import axiosConfig from '../Util/axiosConfig';

/**
 * Communities: the umbrella a set of reading groups belongs to.
 *
 * One module for every community call, so a screen never assembles a URL. The
 * paths are built here from ids rather than kept as constants, because almost
 * every one of them is nested under a community.
 */

const base = (communityId) => `communities/${communityId}`;

export const communitiesApi = {
  /** The reader's own communities, each with the role they hold in it. */
  async mine() {
    const { data } = await axiosConfig.get('communities');
    return Array.isArray(data) ? data : [];
  },

  /** Public communities they are not already in. Backs Discover. */
  async discover({ q = '', category = 'all' } = {}) {
    const { data } = await axiosConfig.get('communities/discover', {
      params: { q: q || undefined, category },
    });
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await axiosConfig.post('communities', payload);
    return data;
  },

  async get(communityId) {
    const { data } = await axiosConfig.get(base(communityId));
    return data;
  },

  async update(communityId, payload) {
    const { data } = await axiosConfig.patch(base(communityId), payload);
    return data;
  },

  /**
   * Join by id, or by code when one is given.
   *
   * A community that requires approval answers 202 rather than 201, so the
   * caller can tell "you are in" from "we have asked for you".
   */
  async join({ communityId, code } = {}) {
    const url = code ? 'communities/join' : `${base(communityId)}/join`;
    const response = await axiosConfig.post(url, code ? { code } : {});
    return { status: response.status, ...response.data };
  },

  async leave(communityId) {
    const { data } = await axiosConfig.delete(`${base(communityId)}/members/me`);
    return data;
  },

  async members(communityId, q = '') {
    const { data } = await axiosConfig.get(`${base(communityId)}/members`, {
      params: { q: q || undefined },
    });
    return Array.isArray(data) ? data : [];
  },

  async setRole(communityId, userId, role) {
    const { data } = await axiosConfig.patch(`${base(communityId)}/members/${userId}/role`, { role });
    return data;
  },

  async removeMember(communityId, userId) {
    const { data } = await axiosConfig.delete(`${base(communityId)}/members/${userId}`);
    return data;
  },

  async joinRequests(communityId) {
    const { data } = await axiosConfig.get(`${base(communityId)}/requests`);
    return Array.isArray(data) ? data : [];
  },

  async decideRequest(communityId, requestId, approve) {
    const { data } = await axiosConfig.patch(`${base(communityId)}/requests/${requestId}`, {
      approve,
    });
    return data;
  },

  async rotateInvite(communityId) {
    const { data } = await axiosConfig.post(`${base(communityId)}/invite/rotate`, {});
    return data;
  },

  async groups(communityId) {
    const { data } = await axiosConfig.get(`${base(communityId)}/groups`);
    return Array.isArray(data) ? data : [];
  },

  async activity(communityId) {
    const { data } = await axiosConfig.get(`${base(communityId)}/activity`);
    return Array.isArray(data) ? data : [];
  },

  async announcements(communityId) {
    const { data } = await axiosConfig.get(`${base(communityId)}/announcements`);
    return Array.isArray(data) ? data : [];
  },

  async postAnnouncement(communityId, payload) {
    const { data } = await axiosConfig.post(`${base(communityId)}/announcements`, payload);
    return data;
  },

  async reactToAnnouncement(communityId, announcementId, emoji) {
    const { data } = await axiosConfig.post(
      `${base(communityId)}/announcements/${announcementId}/react`,
      { emoji },
    );
    return data;
  },

  async deleteAnnouncement(communityId, announcementId) {
    const { data } = await axiosConfig.delete(
      `${base(communityId)}/announcements/${announcementId}`,
    );
    return data;
  },

  async challenges(communityId) {
    const { data } = await axiosConfig.get(`${base(communityId)}/challenges`);
    return Array.isArray(data) ? data : [];
  },

  async createChallenge(communityId, payload) {
    const { data } = await axiosConfig.post(`${base(communityId)}/challenges`, payload);
    return data;
  },

  async joinChallenge(communityId, challengeId) {
    const { data } = await axiosConfig.post(
      `${base(communityId)}/challenges/${challengeId}/join`,
      {},
    );
    return data;
  },

  async challengeBoard(communityId, challengeId) {
    const { data } = await axiosConfig.get(
      `${base(communityId)}/challenges/${challengeId}/board`,
    );
    return data;
  },
};

/** The categories the backend accepts, with the labels a person reads. */
export const COMMUNITY_CATEGORIES = [
  { value: 'book-club', label: 'Book Club' },
  { value: 'university', label: 'University' },
  { value: 'school', label: 'School' },
  { value: 'student-organization', label: 'Student Organisation' },
  { value: 'department', label: 'Department' },
  { value: 'class', label: 'Class' },
  { value: 'friends', label: 'Friends' },
  { value: 'professional', label: 'Professional' },
  { value: 'personal-development', label: 'Personal Development' },
  { value: 'other', label: 'Other' },
];

/** The filter pills above Discover, in the designs' order. */
export const DISCOVER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'book-club', label: 'Book Club' },
  { value: 'university', label: 'University' },
  { value: 'student-organization', label: 'Student' },
];

export function categoryLabel(value) {
  return COMMUNITY_CATEGORIES.find((category) => category.value === value)?.label ?? 'Community';
}

/** "2 hours ago" — short, and never a date for something said minutes ago. */
export function timeAgo(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}
