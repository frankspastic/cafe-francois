import db from '../db/database.js';
import { debug } from '../logger.js';

const ARCHIVED_STATUSES = ['completed', 'cancelled'];

// SQLite's CURRENT_TIMESTAMP stores UTC without a timezone marker, which
// JavaScript then parses as local time. Write an explicit ISO-8601 UTC string
// instead so the client and the label printer read it back correctly.
function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Attaches items to a list of orders using one query instead of one per order.
function withItems(orders) {
  if (orders.length === 0) return [];

  const placeholders = orders.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT
      oi.id,
      oi.order_id,
      oi.customizations,
      mi.name as menu_item_name,
      mi.description as menu_item_description,
      mi.image_url as menu_item_image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id IN (${placeholders})
  `).all(...orders.map(o => o.id));

  const byOrderId = new Map();
  for (const row of rows) {
    const { order_id, ...item } = row;
    item.customizations = item.customizations ? JSON.parse(item.customizations) : {};
    if (!byOrderId.has(order_id)) byOrderId.set(order_id, []);
    byOrderId.get(order_id).push(item);
  }

  return orders.map(order => ({ ...order, items: byOrderId.get(order.id) || [] }));
}

export const Order = {
  // Get all orders with optional status filter
  getAll(status = null) {
    if (status) {
      return db.prepare(`
        SELECT * FROM orders
        WHERE status = ?
        ORDER BY created_at DESC
      `).all(status);
    }
    return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  },

  // Get active orders (pending and in-progress), with items attached
  getActive() {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE status IN ('pending', 'in-progress')
      ORDER BY created_at ASC
    `).all();
    return withItems(orders);
  },

  // Get archived orders. Cancelled orders belong here too — otherwise they
  // vanish from the board with no record that they ever existed.
  getArchived() {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE status IN ('completed', 'cancelled')
      ORDER BY COALESCE(completed_at, created_at) DESC
    `).all();
    return withItems(orders);
  },

  // Get order by ID with items
  getById(id) {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        debug(`Order ${id} not found`);
        return null;
      }
      return withItems([order])[0];
    } catch (error) {
      console.error('Error in Order.getById:', error);
      throw error;
    }
  },

  // How many orders are still ahead of this one in the queue.
  getQueuePosition(id) {
    const row = db.prepare(`
      SELECT COUNT(*) as ahead FROM orders
      WHERE status IN ('pending', 'in-progress') AND id < ?
    `).get(id);
    return row ? row.ahead : 0;
  },

  // Create new order
  create(orderData) {
    const { customer_name, items } = orderData;
    const createdAt = nowIso();

    // Order numbers restart each day, so guests see "#3" instead of "#1247".
    const dailyRow = db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE(?)"
    ).get(createdAt);
    const dailyNumber = (dailyRow?.count || 0) + 1;

    const orderResult = db.prepare(
      'INSERT INTO orders (customer_name, status, created_at, daily_number) VALUES (?, ?, ?, ?)'
    ).run(customer_name, 'pending', createdAt, dailyNumber);

    const orderId = orderResult.lastInsertRowid;

    items.forEach((item) => {
      db.prepare(
        'INSERT INTO order_items (order_id, menu_item_id, customizations) VALUES (?, ?, ?)'
      ).run(
        orderId,
        item.menu_item_id,
        JSON.stringify(item.customizations || {})
      );
    });

    debug('[Order.create] Created order', orderId, 'with', items.length, 'item(s)');
    return orderId;
  },

  // Update order status
  updateStatus(id, status) {
    if (ARCHIVED_STATUSES.includes(status)) {
      return db.prepare(
        'UPDATE orders SET status = ?, completed_at = ? WHERE id = ?'
      ).run(status, nowIso(), id);
    }

    return db.prepare(
      'UPDATE orders SET status = ?, completed_at = NULL WHERE id = ?'
    ).run(status, id);
  },

  // Delete order
  delete(id) {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }
};
