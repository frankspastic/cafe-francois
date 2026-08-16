import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// The database module resolves its path from DB_PATH at import time, so point it
// at a throwaway file before anything imports it.
const testDir = mkdtempSync(join(tmpdir(), 'cafe-test-'));
process.env.DB_PATH = join(testDir, 'test.db');

const { initializeDatabase, seedDatabase } = await import('../db/database.js');
const { Order } = await import('../models/Order.js');
const { formatLabel } = await import('../printing/labelPrinter.js');
const dbModule = await import('../db/database.js');
const db = dbModule.default;

before(async () => {
  await initializeDatabase();
  seedDatabase();
});

beforeEach(() => {
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
});

function createOrder(name = 'Frank', items = [{ menu_item_id: 1, customizations: {} }]) {
  return Order.create({ customer_name: name, items });
}

describe('Order timestamps', () => {
  test('created_at is stored as ISO-8601 UTC so JavaScript parses it correctly', () => {
    const order = Order.getById(createOrder());

    assert.match(order.created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // The bug this guards against: a bare "YYYY-MM-DD HH:MM:SS" is read as local
    // time, so the displayed time drifted by the UTC offset.
    const parsed = new Date(order.created_at);
    assert.ok(Math.abs(Date.now() - parsed.getTime()) < 60_000,
      'parsed timestamp should be within a minute of now');
  });

  test('completing an order records completed_at in the same format', () => {
    const id = createOrder();
    Order.updateStatus(id, 'completed');
    const order = Order.getById(id);
    assert.match(order.completed_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test('moving an order back to in-progress clears completed_at', () => {
    const id = createOrder();
    Order.updateStatus(id, 'completed');
    Order.updateStatus(id, 'in-progress');
    assert.equal(Order.getById(id).completed_at, null);
  });
});

describe('Order history', () => {
  test('cancelled orders are archived, not lost', () => {
    const cancelled = createOrder('Cancelled Guest');
    const completed = createOrder('Completed Guest');
    Order.updateStatus(cancelled, 'cancelled');
    Order.updateStatus(completed, 'completed');

    const archived = Order.getArchived();
    const names = archived.map(o => o.customer_name);

    assert.ok(names.includes('Cancelled Guest'), 'cancelled order should appear in history');
    assert.ok(names.includes('Completed Guest'), 'completed order should appear in history');
  });

  test('archived orders come back with their items attached', () => {
    const id = createOrder('Frank', [
      { menu_item_id: 1, customizations: { size: 'Large' } },
      { menu_item_id: 2, customizations: {} }
    ]);
    Order.updateStatus(id, 'completed');

    const archived = Order.getArchived().find(o => o.id === id);
    assert.equal(archived.items.length, 2);
    assert.equal(archived.items[0].customizations.size, 'Large');
  });

  test('active orders do not appear in history', () => {
    const id = createOrder('Waiting Guest');
    assert.ok(!Order.getArchived().some(o => o.id === id));
    assert.ok(Order.getActive().some(o => o.id === id));
  });
});

describe('Daily order numbers', () => {
  test('numbering starts at 1 and increments within the day', () => {
    assert.equal(Order.getById(createOrder()).daily_number, 1);
    assert.equal(Order.getById(createOrder()).daily_number, 2);
    assert.equal(Order.getById(createOrder()).daily_number, 3);
  });

  test('the number restarts for a new day', () => {
    createOrder();
    createOrder();

    // Backdate everything to yesterday, then place a fresh order.
    db.exec("UPDATE orders SET created_at = datetime('now', '-1 day') || 'Z'");
    assert.equal(Order.getById(createOrder()).daily_number, 1);
  });
});

describe('Queue position', () => {
  test('counts only the orders still ahead in the queue', () => {
    const first = createOrder('First');
    const second = createOrder('Second');
    const third = createOrder('Third');

    assert.equal(Order.getQueuePosition(first), 0);
    assert.equal(Order.getQueuePosition(second), 1);
    assert.equal(Order.getQueuePosition(third), 2);

    // Finishing the first order moves everyone up.
    Order.updateStatus(first, 'completed');
    assert.equal(Order.getQueuePosition(second), 0);
    assert.equal(Order.getQueuePosition(third), 1);
  });
});

describe('Order items', () => {
  test('items are attached to the right order', () => {
    const a = createOrder('A', [{ menu_item_id: 1, customizations: { size: 'Small' } }]);
    const b = createOrder('B', [
      { menu_item_id: 2, customizations: {} },
      { menu_item_id: 3, customizations: {} }
    ]);

    assert.equal(Order.getById(a).items.length, 1);
    assert.equal(Order.getById(b).items.length, 2);

    const active = Order.getActive();
    assert.equal(active.find(o => o.id === a).items.length, 1);
    assert.equal(active.find(o => o.id === b).items.length, 2);
  });

  test('customizations survive the round trip', () => {
    const id = createOrder('Frank', [{
      menu_item_id: 1,
      customizations: { size: 'Large', milk: 'Oat Milk', extras: ['Vanilla', 'Extra Shot'] }
    }]);

    const { customizations } = Order.getById(id).items[0];
    assert.equal(customizations.size, 'Large');
    assert.equal(customizations.milk, 'Oat Milk');
    assert.deepEqual(customizations.extras, ['Vanilla', 'Extra Shot']);
  });
});

describe('Label formatting', () => {
  test('the label uses the daily number, not the raw row id', () => {
    const order = Order.getById(createOrder('Frank'));
    const label = formatLabel(order);

    assert.match(label, /ORDER #1/);
    assert.match(label, /FRANK/);
    assert.match(label, /CAFE FRANCOIS/);
  });
});

process.on('exit', () => rmSync(testDir, { recursive: true, force: true }));
