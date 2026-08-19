'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'growpath.themeMode';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedScheme: ResolvedScheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemScheme(): ResolvedScheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyResolvedScheme(scheme: ResolvedScheme) {
  document.documentElement.dataset.theme = scheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ResolvedScheme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    setModeState(stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system');
    setSystemScheme(getSystemScheme());

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemScheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedScheme: ResolvedScheme = mode === 'system' ? systemScheme : mode;

  useEffect(() => {
    applyResolvedScheme(resolvedScheme);
  }, [resolvedScheme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ mode, resolvedScheme, setMode }), [mode, resolvedScheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within a ThemeProvider');
  return ctx;
}

/** Blocking inline script string — run in <head> before hydration to avoid a flash of the wrong theme. */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var scheme = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.dataset.theme = scheme;
  } catch (e) {}
})();
`;
