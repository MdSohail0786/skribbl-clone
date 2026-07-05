const STORAGE_KEY = 'doodle_duel_session';

/** Persists { roomId, playerId, name } across page refreshes so a
 * dropped connection or accidental reload doesn't lose the player's seat. */
export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* localStorage unavailable (private browsing) - non-fatal */
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
