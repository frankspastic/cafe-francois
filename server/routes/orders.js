import express from 'express';
import { Order } from '../models/Order.js';
import { Menu } from '../models/Menu.js';
import { printLabel } from '../printing/labelPrinter.js';
import { requireBarista } from '../auth.js';

const router = express.Router();

const VALID_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

// Get all orders (with optional status filter) — barista only, since the full
// list exposes every guest's name and drinks.
router.get('/', requireBarista, (req, res) => {
  try {
    const { status } = req.query;
    const orders = status ? Order.getAll(status) : Order.getActive();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get archived orders
router.get('/archived', requireBarista, (req, res) => {
  try {
    res.json(Order.getArchived());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID — public so a guest can follow the order they just placed.
router.get('/:id', (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ ...order, queue_position: Order.getQueuePosition(order.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order — the one write endpoint guests can reach, so validate it.
const MAX_NAME_LENGTH = 40;
const MAX_ITEMS_PER_ORDER = 20;

function validateOrder(body) {
  const name = typeof body?.customer_name === 'string' ? body.customer_name.trim() : '';
  if (!name) return { error: 'A name is required' };
  if (name.length > MAX_NAME_LENGTH) return { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` };

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) return { error: 'Order must contain at least one item' };
  if (items.length > MAX_ITEMS_PER_ORDER) return { error: `Order cannot exceed ${MAX_ITEMS_PER_ORDER} items` };

  const cleanItems = [];
  for (const item of items) {
    const menuItemId = Number(item?.menu_item_id);
    if (!Number.isInteger(menuItemId) || menuItemId <= 0) return { error: 'Invalid menu item' };
    if (!Menu.getById(menuItemId)) return { error: 'Menu item no longer available' };
    cleanItems.push({ menu_item_id: menuItemId, customizations: item?.customizations || {} });
  }

  return { value: { customer_name: name, items: cleanItems } };
}

router.post('/', (req, res) => {
  try {
    const { error, value } = validateOrder(req.body);
    if (error) return res.status(400).json({ error });

    const orderId = Order.create(value);
    const order = Order.getById(orderId);

    // Barista dashboards get the new order; the guest joins their own room to
    // follow it. See server.js for how sockets are scoped.
    req.io.to('barista').emit('new-order', order);
    printLabel(order);

    res.status(201).json({ ...order, queue_position: Order.getQueuePosition(order.id) });
  } catch (error) {
    console.error('[Server] Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/:id/status', requireBarista, (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    Order.updateStatus(req.params.id, status);
    const order = Order.getById(req.params.id);

    // Only the baristas and the guest who placed this order need to hear about it.
    req.io.to('barista').emit('order-status-updated', order);
    req.io.to(`order:${order.id}`).emit('order-status-updated', {
      ...order,
      queue_position: Order.getQueuePosition(order.id)
    });

    // Everyone else in the queue may have moved up a place.
    for (const other of Order.getActive()) {
      if (other.id === order.id) continue;
      req.io.to(`order:${other.id}`).emit('order-status-updated', {
        ...other,
        queue_position: Order.getQueuePosition(other.id)
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete('/:id', requireBarista, (req, res) => {
  try {
    Order.delete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reprint label for an existing order
router.post('/:id/print', requireBarista, (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    printLabel(order);
    res.json({ message: `Print job sent for order #${order.id}` });
  } catch (error) {
    console.error('[Server] Error reprinting order:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
