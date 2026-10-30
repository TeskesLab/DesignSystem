import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  density: Density;
  setTheme: (theme: ThemePreference) => void;
  setDensity: (density: Density) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'tl-theme';
const DENSITY_KEY = 'tl-density';

function readPreference(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writePreference(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch { /* Storage can be disabled; the in-memory choice still applies. */ }
}

/** Manages the document's theme and density token selectors. Use one provider per document. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Identical server and first client render; browser preferences are read after hydration.
  const [theme, updateTheme] = useState<ThemePreference>('system');
  const [density, updateDensity] = useState<Density>('comfortable');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const storedTheme = readPreference(THEME_KEY);
    updateTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system');
    updateDensity(readPreference(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable');
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const syncSystem = () => setSystemTheme(media?.matches ? 'dark' : 'light');
    syncSystem();
    if (media?.addEventListener) media.addEventListener('change', syncSystem);
    else media?.addListener(syncSystem);
    const syncStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) {
        const storedTheme = readPreference(THEME_KEY);
        updateTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system');
      }
      if (event.key === DENSITY_KEY || event.key === null) updateDensity(readPreference(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable');
    };
    window.addEventListener('storage', syncStorage);
    return () => {
      if (media?.removeEventListener) media.removeEventListener('change', syncSystem);
      else media?.removeListener(syncSystem);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    const previousDensity = root.getAttribute('data-density');
    return () => {
      if (previousTheme === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', previousTheme);
      if (previousDensity === null) root.removeAttribute('data-density');
      else root.setAttribute('data-density', previousDensity);
    };
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-density', density);
  }, [resolvedTheme, density]);

  const setTheme = useCallback((value: ThemePreference) => {
    updateTheme(value);
    writePreference(THEME_KEY, value === 'system' ? null : value);
  }, []);
  const setDensity = useCallback((value: Density) => {
    updateDensity(value);
    writePreference(DENSITY_KEY, value);
  }, []);
  const reset = useCallback(() => {
    updateTheme('system');
    updateDensity('comfortable');
    writePreference(THEME_KEY, null);
    writePreference(DENSITY_KEY, null);
  }, []);
  const value = useMemo(() => ({ theme, resolvedTheme, density, setTheme, setDensity, reset }), [theme, resolvedTheme, density, setTheme, setDensity, reset]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within a ThemeProvider');
  return value;
}
