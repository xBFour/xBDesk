import type { DesktopPreferences, DesktopSession, DesktopStorage } from './types';

/** Persists preferences in `localStorage` under `key`, and the open windows under `key:session`. */
export function localStorageAdapter(key: string): DesktopStorage {
  const sessionKey = `${key}:session`;
  return {
    loadSession() {
      try {
        const raw = localStorage.getItem(sessionKey);
        return raw ? (JSON.parse(raw) as DesktopSession) : null;
      } catch {
        return null;
      }
    },
    saveSession(session) {
      try {
        localStorage.setItem(sessionKey, JSON.stringify(session));
      } catch (err) {
        console.warn('[xBDesk] Could not persist the window session:', err);
      }
    },
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as Partial<DesktopPreferences>) : null;
      } catch {
        return null;
      }
    },
    save(preferences) {
      try {
        localStorage.setItem(key, JSON.stringify(preferences));
      } catch (err) {
        // Quota exceeded (e.g. a large uploaded wallpaper) or storage disabled.
        console.warn('[xBDesk] Could not persist preferences:', err);
      }
    },
  };
}

/** Drops values that did not survive a JSON round-trip (inline `custom` wallpapers lose their render function). */
export function sanitizeLoaded(p: Partial<DesktopPreferences> | null | undefined): Partial<DesktopPreferences> {
  if (!p || typeof p !== 'object') return {};
  const out = { ...p };
  const w = out.wallpaper as { type?: string; render?: unknown } | undefined;
  if (w && (typeof w !== 'object' || !w.type || (w.type === 'custom' && typeof w.render !== 'function'))) delete out.wallpaper;
  return out;
}
