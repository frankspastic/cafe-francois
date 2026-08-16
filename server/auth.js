import crypto from 'crypto';

// Barista sessions live in memory: a server restart signs everyone out, which is
// an acceptable trade for a single-service app with one or two baristas.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — comfortably longer than a party
const sessions = new Map(); // token -> expiresAt

export function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function isValidSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}

// Invalidate every session — used when the PIN changes, so an old PIN's sessions
// don't outlive it.
export function destroyAllSessions() {
  sessions.clear();
}

function tokenFromRequest(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Guards barista-only routes.
export function requireBarista(req, res, next) {
  const token = tokenFromRequest(req);
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Barista authentication required' });
  }
  req.baristaToken = token;
  next();
}

// ---------------------------------------------------------------------------
// PIN brute-force protection
//
// A 4-digit PIN is only 10,000 combinations, so without throttling it falls in
// seconds. Track failures per IP and lock out with a growing delay.
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 60 * 1000; // doubles for each further batch of failures
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map(); // ip -> { count, lockedUntil, lastAttempt }

export function checkPinRateLimit(ip) {
  const record = attempts.get(ip);
  if (!record) return { allowed: true };

  // Stale record — forget the old failures entirely.
  if (Date.now() - record.lastAttempt > ATTEMPT_WINDOW_MS && Date.now() > (record.lockedUntil || 0)) {
    attempts.delete(ip);
    return { allowed: true };
  }

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - Date.now()) / 1000)
    };
  }

  return { allowed: true };
}

export function recordPinFailure(ip) {
  const record = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();

  if (record.count >= MAX_ATTEMPTS) {
    const lockoutMultiplier = 2 ** Math.floor(record.count / MAX_ATTEMPTS - 1);
    record.lockedUntil = Date.now() + BASE_LOCKOUT_MS * lockoutMultiplier;
  }

  attempts.set(ip, record);
}

export function clearPinFailures(ip) {
  attempts.delete(ip);
}
