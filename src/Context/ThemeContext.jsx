import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { applyTheme, readStoredMode, resolveMode, storeMode } from '../Util/theme';

/**
 * Appearance, in three states.
 *
 * `system` follows the operating system and keeps following it as it changes;
 * `light` and `dark` are the reader's own choice and override it. Two states
 * would be simpler and worse: a reader whose laptop is dark all day still has
 * to be able to read this app in light, and once they pick one there must be a
 * way back to following the machine.
 */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // While following the system, keep following it: a laptop switching to dark
  // in the evening should take the app with it, without a reload.
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode]);

  const choose = useCallback((next) => {
    setMode(next);
    storeMode(next);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode: choose, isDark: resolveMode(mode) === 'dark' }),
    [mode, choose],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
