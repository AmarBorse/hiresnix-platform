// src/hooks/useInactivityLogout.ts
// Logs a student out if they haven't used the site for INACTIVITY_LIMIT_MS.
// "Activity" = any click, key press, scroll or touch, or opening the tab.
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const INACTIVITY_LIMIT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const LAST_ACTIVE_KEY = 'hx_last_active';
const ROLES = ['student'];                 // add 'company', 'institution' etc. to apply to them too
const WRITE_EVERY_MS = 60 * 1000;          // save the timestamp at most once a minute
const CHECK_EVERY_MS = 30 * 60 * 1000;     // re-check every 30 minutes while the tab is open

const readLastActive = () => {
  const n = Number(localStorage.getItem(LAST_ACTIVE_KEY));
  return Number.isFinite(n) && n > 0 ? n : null;
};
export const markActive = () => {
  try { localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())); } catch { /* storage full/blocked */ }
};

export function useInactivityLogout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const applies = isAuthenticated && !!user && ROLES.includes(user.role as string);

  useEffect(() => {
    if (!applies) return;

    const expireIfIdle = () => {
      const last = readLastActive();
      if (last === null) { markActive(); return false; }     // first run after this update: start the clock now
      if (Date.now() - last > INACTIVITY_LIMIT_MS) {
        logout();
        localStorage.removeItem(LAST_ACTIVE_KEY);
        window.location.replace('/auth?reason=inactive');
        return true;
      }
      return false;
    };

    if (expireIfIdle()) return;
    markActive();

    let lastWrite = Date.now();
    const onActivity = () => {
      if (Date.now() - lastWrite < WRITE_EVERY_MS) return;
      if (expireIfIdle()) return;                             // laptop woke up after 4 days → log out, don't refresh
      lastWrite = Date.now();
      markActive();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') onActivity(); };

    const events: (keyof WindowEventMap)[] = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(expireIfIdle, CHECK_EVERY_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [applies, logout]);
}
