/**
 * Theme helpers, kept out of the provider file.
 *
 * Fast refresh only works on a module that exports components alone, and the
 * provider needs these before React renders -- so they live here.
 */
const STORAGE_KEY = 'rh_theme';

/** Reads the saved choice. Anything unrecognised means follow the system. */
export function readStoredMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    // Private browsing, or storage blocked. Following the system is the right
    // default for a reader we know nothing about.
    return 'system';
  }
}

export function storeMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // The choice still applies for this session.
  }
}

export function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

/** What the mode actually resolves to right now. */
export function resolveMode(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemPrefersDark() ? 'dark' : 'light';
}

/** Writes the resolved theme onto the document, which the palette keys off. */
export function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', resolveMode(mode));
}
