export const BOOKING_SESSION_KEY = 'silva-cortes-booking-session-v1';
export const OTP_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const VERIFIED_SESSION_TTL_MS = 5 * 60 * 1000;

export function saveBookingSession(storage, booking, now = Date.now(), ttlMs = OTP_CHALLENGE_TTL_MS) {
  if (!storage || !booking || typeof booking !== 'object') return false;
  const safeTtl = Math.max(0, Math.min(Number(ttlMs) || 0, OTP_CHALLENGE_TTL_MS));
  if (!safeTtl) return false;
  try {
    storage.setItem(BOOKING_SESSION_KEY, JSON.stringify({
      version: 1,
      expiresAt: now + safeTtl,
      booking,
    }));
    return true;
  } catch { return false; }
}

export function restoreBookingSession(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(BOOKING_SESSION_KEY);
    if (!raw || raw.length > 4096) { storage.removeItem(BOOKING_SESSION_KEY); return null; }
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= now ||
        !saved.booking || typeof saved.booking !== 'object') {
      storage.removeItem(BOOKING_SESSION_KEY);
      return null;
    }
    return saved.booking;
  } catch {
    try { storage.removeItem(BOOKING_SESSION_KEY); } catch { /* storage may be blocked */ }
    return null;
  }
}

export function clearBookingSession(storage) {
  try { storage?.removeItem(BOOKING_SESSION_KEY); } catch { /* storage may be blocked */ }
}
