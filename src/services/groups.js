import { apiEndpoints } from '../Util/apiEndpoints';
import axiosConfig from '../Util/axiosConfig';

/**
 * Reading groups, and the conversations in them.
 *
 * Mirrors `src/features/groups` in the mobile app, against the same endpoints.
 * There is deliberately no call that adds another member: a reader joins by
 * presenting a code themselves, which is what makes being visible to a group a
 * choice rather than something done to them.
 */
export const groupsApi = {
  async list() {
    const { data } = await axiosConfig.get(apiEndpoints.GROUPS);
    return data?.groups ?? [];
  },

  async get(groupId) {
    const { data } = await axiosConfig.get(apiEndpoints.groupById(groupId));
    return data?.group ?? null;
  },

  async create({ name, description }) {
    const { data } = await axiosConfig.post(apiEndpoints.GROUPS, { name, description });
    return data?.group ?? null;
  },

  async join(inviteCode) {
    const { data } = await axiosConfig.post(apiEndpoints.GROUPS_JOIN, {
      inviteCode: String(inviteCode).trim().toUpperCase(),
    });
    return data?.group ?? null;
  },

  async leave(groupId) {
    await axiosConfig.delete(apiEndpoints.groupLeave(groupId));
  },

  /** Shows or hides the reader's own pages, in this group only. */
  async setVisibility(groupId, visible) {
    await axiosConfig.patch(apiEndpoints.groupVisibility(groupId), { visible });
  },

  async addBook(groupId, bookId) {
    await axiosConfig.post(apiEndpoints.groupBooks(groupId), { bookId });
  },

  async removeBook(groupId, bookId) {
    await axiosConfig.delete(apiEndpoints.groupBook(groupId, bookId));
  },

  async setTarget(groupId, { bookId, targetPage, dueAt }) {
    await axiosConfig.post(apiEndpoints.groupSchedule(groupId), { bookId, targetPage, dueAt });
  },

  /** A page of comments, newest first. `before` continues from the oldest held. */
  async messages(groupId, { book, before } = {}) {
    const { data } = await axiosConfig.get(apiEndpoints.groupMessages(groupId), {
      params: { book, before },
    });
    return { messages: data?.messages ?? [], hasMore: Boolean(data?.hasMore) };
  },

  async postMessage(groupId, { body, book, page, replyTo }) {
    await axiosConfig.post(apiEndpoints.groupMessages(groupId), { body, book, page, replyTo });
  },

  /** Withdraws a comment. The row stays, so replies keep their parent. */
  async deleteMessage(groupId, messageId) {
    await axiosConfig.delete(apiEndpoints.groupMessage(groupId, messageId));
  },
};

/**
 * Where a reader stands against the group's target.
 *
 * The wording matters more than the arithmetic: "behind" is discouraging to
 * somebody one page short with three days to go, so it is only used once the
 * date has actually passed.
 */
export function targetStatus(target, lastPageRead) {
  const behindBy = Math.max(0, Number(target.targetPage) - Number(lastPageRead || 0));
  if (behindBy === 0) return { onTrack: true, label: 'Target met' };

  const daysLeft = Math.ceil((new Date(target.dueAt).getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return { onTrack: false, label: `${behindBy} pages behind` };
  if (daysLeft === 0) return { onTrack: false, label: `${behindBy} pages due today` };

  return {
    onTrack: false,
    label: `${behindBy} pages in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
  };
}
