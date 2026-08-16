import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const testDir = mkdtempSync(join(tmpdir(), 'cafe-test-menu-'));
process.env.DB_PATH = join(testDir, 'test.db');

const { initializeDatabase, seedDatabase } = await import('../db/database.js');
const { Menu } = await import('../models/Menu.js');

before(async () => {
  await initializeDatabase();
  seedDatabase();
});

describe('Menu.create', () => {
  test('creating an item without image_url or description does not throw', () => {
    // Regression: sql.js's bind() throws on `undefined` params (only `null` is
    // accepted), and its thrown value isn't a real Error, so callers that read
    // error.message got `undefined` — which JSON.stringify then drops entirely,
    // turning a genuine failure into a silent, misleading `{}` response.
    const id = Menu.create({ name: 'Plain Item', category: 'Coffee' });
    const item = Menu.getById(id);

    assert.equal(item.name, 'Plain Item');
    assert.equal(item.image_url, null);
    assert.equal(item.description, null);
  });

  test('updating an item without image_url or available does not throw', () => {
    const id = Menu.create({ name: 'To Update', category: 'Coffee' });
    assert.doesNotThrow(() => Menu.update(id, { name: 'Updated', category: 'Coffee' }));
  });
});

describe('bindParams error normalization', () => {
  test('a bind failure surfaces a real Error with a message', () => {
    // Binding a value sql.js rejects (a plain object) should raise something
    // with a usable .message, not a bare string/undefined that vanishes when
    // a route does res.json({ error: error.message }).
    assert.throws(
      () => Menu.create({ name: 'Bad', category: 'Coffee', allowed_customization_types: undefined, image_url: { not: 'valid' } }),
      (err) => err instanceof Error && typeof err.message === 'string' && err.message.length > 0
    );
  });
});

process.on('exit', () => rmSync(testDir, { recursive: true, force: true }));
