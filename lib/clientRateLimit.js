/**
 * Client-side login rate limiter backed by localStorage.
 * Allows five failed attempts within 15 minutes, then locks for 30 minutes.
 */

const STORAGE_KEY = "admin_login_limit";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 30 * 60 * 1000;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function checkLocked() {
  const entry = readStore();
  if (!entry?.lockedUntil) return { locked: false, retryAfter: 0 };

  const now = Date.now();
  if (now >= entry.lockedUntil) {
    localStorage.removeItem(STORAGE_KEY);
    return { locked: false, retryAfter: 0 };
  }

  return {
    locked: true,
    retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
  };
}

export function recordFailure() {
  const now = Date.now();
  let entry = readStore();

  if (entry && now - entry.firstFailAt > WINDOW_MS + LOCK_MS) {
    entry = null;
  }

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      locked: true,
      remaining: 0,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  if (!entry) {
    entry = { firstFailAt: now, failures: 0, lockedUntil: null };
  }

  entry.failures += 1;

  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
    writeStore(entry);
    return { locked: true, remaining: 0, retryAfter: LOCK_MS / 1000 };
  }

  writeStore(entry);
  return {
    locked: false,
    remaining: MAX_FAILURES - entry.failures,
    retryAfter: 0,
  };
}

export function resetLimit() {
  localStorage.removeItem(STORAGE_KEY);
}
