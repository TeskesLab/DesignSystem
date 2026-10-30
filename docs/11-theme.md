# React theme and density

Import the token and component styles, then mount one `ThemeProvider` for the document. The provider writes `data-theme="light"` or `data-theme="dark"` and `data-density="comfortable"` or `data-density="compact"` on `document.documentElement`, matching the existing token selectors. On unmount it restores the attributes that were present when it mounted. Do not mount multiple providers that manage the same document.

```tsx
import '@teskeslab/design-system/tokens.css';
import '@teskeslab/design-system/components.css';
import { ThemeProvider, useTheme } from '@teskeslab/design-system';

function AppearanceSettings() {
  const { theme, resolvedTheme, density, setTheme, setDensity, reset } = useTheme();
  return <section aria-label="Appearance">
    <label>Theme
      <select value={theme} onChange={event => setTheme(event.target.value as 'system' | 'light' | 'dark')}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <p>Current theme: {resolvedTheme}</p>
    <label>Density
      <select value={density} onChange={event => setDensity(event.target.value as 'comfortable' | 'compact')}>
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
      </select>
    </label>
    <button type="button" onClick={reset}>Reset appearance</button>
  </section>;
}

function App() {
  return <ThemeProvider><AppearanceSettings /></ThemeProvider>;
}
```

`useTheme()` must be called within a provider. `theme` is the user's `system`, `light`, or `dark` preference; `resolvedTheme` is always `light` or `dark`. System follows `prefers-color-scheme` changes, with light as the fallback when the API is unavailable. `density` is `comfortable` or `compact`; the token stylesheet still enforces comfortable control dimensions on coarse pointers and narrow screens.

Explicit choices are saved in local storage under `tl-theme` and `tl-density`, the keys used by the reference gallery. Setting the theme to `system` removes the theme override. `reset()` removes both saved values, returns the theme to system and the density to comfortable. Invalid or inaccessible stored values fall back to those defaults; if storage is unavailable, choices still work for the current mounted session. Changes from other tabs are reflected through storage events.

The server and first client render use system/light and comfortable defaults to avoid hydration mismatches. Browser preferences and saved choices are read after hydration, so applications can see a brief initial appearance change. Applications needing to avoid that flash should apply their own early, CSP-compatible script before rendering using the same storage keys and token attributes; coordinate it with the provider's defaults and hydration strategy.
