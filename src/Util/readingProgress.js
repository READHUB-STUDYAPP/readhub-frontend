/**
 * Whether a book counts as being read, or finished.
 *
 * Both screens asked this with `page > 0 && page < book.pages`, which quietly
 * assumes every book has a known length. An EPUB often does not: epub.js
 * measures a book in locations rather than pages, generating them is slow
 * enough to be done in the background, and when it fails the upload records a
 * length of 1.
 *
 * With a length of 1 the old test could never be true, so an EPUB never
 * appeared under "Continue reading" -- and the companion test, `page >=
 * pages`, called it finished the moment it was opened. A book the reader was
 * part-way through was therefore filed as complete and shown nowhere.
 *
 * So an unknown length is treated as unknown rather than as zero: a started
 * book is being read, and nothing is called finished until there is a real
 * length to have reached the end of.
 */

/** A length of 0 or 1 is a placeholder, not a one-page book. */
export const hasKnownLength = (book) => Number(book?.pages) > 1;

export const pageOf = (book, currentPage = {}) =>
  currentPage[book?._id] ?? book?.lastPageRead ?? 0;

export const isReading = (book, page) =>
  page > 0 && (!hasKnownLength(book) || page < Number(book.pages));

export const isFinished = (book, page) =>
  hasKnownLength(book) && page >= Number(book.pages);
