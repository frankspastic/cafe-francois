import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';

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

router.post('/barista-pin/verify', (req, res) => {
  try {
    const { pin } = req.body;
    const hash = getSetting(BARISTA_PIN_KEY);
    const valid = !!hash && !!pin && bcrypt.compareSync(String(pin), hash);
    res.json({ valid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/barista-pin', (req, res) => {
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
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:key', (req, res) => {
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
