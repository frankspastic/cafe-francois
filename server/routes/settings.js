import express from 'express';
import bcrypt from 'bcryptjs';
import db, { exportDatabase, restoreDatabase } from '../db/database.js';
import {
  createSession,
  destroySession,
  destroyAllSessions,
  requireBarista,
  isValidSession,
  checkPinRateLimit,
  recordPinFailure,
  clearPinFailures
} from '../auth.js';

const router = express.Router();

const BARISTA_PIN_KEY = 'barista_pin_hash';

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      if (r.key === BARISTA_PIN_KEY) return; // never expose the PIN hash to clients
      settings[r.key] = r.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exchange a correct PIN for a session token.
router.post('/barista-pin/verify', (req, res) => {
  try {
    const ip = req.ip;
    const limit = checkPinRateLimit(ip);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many incorrect attempts. Try again in ${limit.retryAfterSeconds}s.`,
        retryAfterSeconds: limit.retryAfterSeconds
      });
    }

    const { pin } = req.body;
    const hash = getSetting(BARISTA_PIN_KEY);
    const valid = !!hash && !!pin && bcrypt.compareSync(String(pin), hash);

    if (!valid) {
      recordPinFailure(ip);
      return res.status(401).json({ valid: false });
    }

    clearPinFailures(ip);
    res.json({ valid: true, token: createSession() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/barista-pin/logout', requireBarista, (req, res) => {
  destroySession(req.baristaToken);
  res.json({ success: true });
});

// Confirms an existing token is still good, so the dashboard can restore a
// session after a reload instead of asking for the PIN again.
router.get('/barista-pin/session', requireBarista, (req, res) => {
  res.json({ valid: true });
});

router.put('/barista-pin', requireBarista, (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!/^\d{4}$/.test(newPin || '')) {
      return res.status(400).json({ error: 'New PIN must be 4 digits' });
    }
    const hash = getSetting(BARISTA_PIN_KEY);
    const currentValid = !!hash && bcrypt.compareSync(String(currentPin || ''), hash);
    if (!currentValid) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }
    setSetting(BARISTA_PIN_KEY, bcrypt.hashSync(newPin, 10));
    // Sessions opened with the old PIN should not outlive it.
    destroyAllSessions();
    res.json({ success: true, token: createSession() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download a snapshot of the database. Browsers can't set an Authorization
// header on a plain download link, so the token comes in as a query parameter.
router.get('/backup', (req, res) => {
  if (!isValidSession(req.query.token)) {
    return res.status(401).json({ error: 'Barista authentication required' });
  }
  try {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="cafe-francois-${stamp}.db"`);
    res.send(exportDatabase());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a database file to replace the live one — the other half of /backup,
// used to move a dev database to production. requireBarista runs before the
// raw-body parser so an unauthenticated caller can't push arbitrary bytes at all.
router.post('/restore', requireBarista, express.raw({ type: 'application/octet-stream', limit: '200mb' }), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    await restoreDatabase(req.body);
    // The uploaded database has its own barista_pin_hash, so every existing
    // session (including this one) needs to reauthenticate against it.
    destroyAllSessions();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:key', requireBarista, (req, res) => {
  try {
    if (req.params.key === BARISTA_PIN_KEY) {
      return res.status(403).json({ error: 'Use PUT /api/settings/barista-pin to change the PIN' });
    }
    setSetting(req.params.key, req.body.value ?? '');
    res.json({ key: req.params.key, value: req.body.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
