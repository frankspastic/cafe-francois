import express from 'express';
import db from '../db/database.js';

const router = express.Router();

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
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:key', (req, res) => {
  try {
    setSetting(req.params.key, req.body.value ?? '');
    res.json({ key: req.params.key, value: req.body.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
