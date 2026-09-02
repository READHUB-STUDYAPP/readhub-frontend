import { apiEndpoints } from '../Util/apiEndpoints';
import axiosConfig from '../Util/axiosConfig';

/**
 * Explore, and sharing a book into it.
 *
 * The same four endpoints the phone app uses, so what is trending is trending
 * in both places rather than each client ranking its own idea of it.
 */
export const discoverApi = {
  /** Books readers are opening, among those shared publicly. */
  async trending(limit = 12) {
    const { data } = await axiosConfig.get(apiEndpoints.DISCOVER_TRENDING, { params: { limit } });
    return Array.isArray(data) ? data : [];
  },

  /** Shared books this reader does not already hold. */
  async recommended(limit = 12) {
    const { data } = await axiosConfig.get(apiEndpoints.DISCOVER_RECOMMENDED, { params: { limit } });
    return Array.isArray(data) ? data : [];
  },

  /** Takes a copy of somebody else's shared book. */
  async add(bookId) {
    const { data } = await axiosConfig.post(apiEndpoints.discoverAdd(bookId));
    return data?.book ?? null;
  },

  /**
   * Turns sharing on or off for a book the reader uploaded.
   *
   * One call, one boolean: sharing is a switch on a book you own, not a
   * separate publishing step with a form behind it.
   */
  async setVisibility(bookId, isPublic) {
    const { data } = await axiosConfig.patch(apiEndpoints.discoverVisibility(bookId), { isPublic });
    return data?.book ?? null;
  },
};

/**
 * Today's quote.
 *
 * Chosen by the day, and by the same arithmetic as the phone app, so both show
 * the same one on the same date. A quote that changed on every render would
 * read as a glitch -- "discover" does not mean "reshuffle".
 */
const QUOTES = [
  {
    text: 'The more that you read, the more things you will know. The more that you learn, the more places you will go.',
    author: 'Dr. Seuss',
  },
  { text: 'A book is a dream that you hold in your hand.', author: 'Neil Gaiman' },
  { text: 'Reading is a discount ticket to everywhere.', author: 'Mary Schmich' },
  { text: 'Once you learn to read, you will be forever free.', author: 'Frederick Douglass' },
  { text: 'Books are the mirrors of the soul.', author: 'Virginia Woolf' },
];

export function quoteForToday(now = new Date()) {
  const days = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
  );
  return QUOTES[Math.abs(days) % QUOTES.length];
}

/** Reader counts are people, not sittings -- that is what the ranking counts. */
export function readerLabel(readers) {
  if (typeof readers !== 'number' || readers <= 0) return null;
  return readers === 1 ? '1 reader' : `${readers} readers`;
}
