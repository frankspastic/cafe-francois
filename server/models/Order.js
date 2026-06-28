import db from '../db/database.js';

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

  // Get active orders (pending and in-progress)
  getActive() {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status IN ('pending', 'in-progress')
      ORDER BY created_at ASC
    `).all();
  },

  // Get archived orders (completed)
  getArchived() {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status = 'completed'
      ORDER BY completed_at DESC
    `).all();
  },

  // Get order by ID with items
  getById(id) {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        console.log(`Order ${id} not found`);
        return null;
      }

      const items = db.prepare(`
        SELECT
          oi.id,
          oi.customizations,
          mi.name as menu_item_name,
          mi.description as menu_item_description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).all(id);

      console.log(`Order ${id} has ${items ? items.length : 0} items:`, items);

      // Parse customizations JSON
      order.items = items ? items.map(item => ({
        ...item,
        customizations: item.customizations ? JSON.parse(item.customizations) : {}
      })) : [];

      console.log('Returning order:', JSON.stringify(order, null, 2));
      return order;
    } catch (error) {
      console.error('Error in Order.getById:', error);
      throw error;
    }
  },

  // Create new order
  create(orderData) {
    const { customer_name, items } = orderData;

    console.log('[Order.create] Creating order for:', customer_name);
    console.log('[Order.create] Items to insert:', JSON.stringify(items, null, 2));

    // Insert order
    const orderResult = db.prepare(
      'INSERT INTO orders (customer_name, status) VALUES (?, ?)'
    ).run(customer_name, 'pending');

    const orderId = orderResult.lastInsertRowid;
    console.log('[Order.create] Created order with ID:', orderId);

    // Insert order items
    items.forEach((item, index) => {
      console.log(`[Order.create] Inserting item ${index + 1}:`, {
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        customizations: item.customizations
      });

      const result = db.prepare(
        'INSERT INTO order_items (order_id, menu_item_id, customizations) VALUES (?, ?, ?)'
      ).run(
        orderId,
        item.menu_item_id,
        JSON.stringify(item.customizations || {})
      );

      console.log(`[Order.create] Item ${index + 1} inserted with ID:`, result.lastInsertRowid);
    });

    console.log('[Order.create] All items inserted for order:', orderId);
    return orderId;
  },

  // Update order status
  updateStatus(id, status) {
    const updates = { status };

    // If completing the order, set completed_at timestamp
    if (status === 'completed') {
      return db.prepare(
        'UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(status, id);
    }

    return db.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    ).run(status, id);
  },

  // Delete order
  delete(id) {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }
};
