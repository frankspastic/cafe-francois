import express from 'express';
import { Order } from '../models/Order.js';
import { printLabel } from '../printing/labelPrinter.js';

const router = express.Router();

// Get all orders (with optional status filter)
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const orders = status ? Order.getAll(status) : Order.getActive();

    // Get items for each order
    const ordersWithItems = orders.map(order => Order.getById(order.id));

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get archived orders
router.get('/archived', (req, res) => {
  try {
    const orders = Order.getArchived();
    const ordersWithItems = orders.map(order => Order.getById(order.id));
    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', (req, res) => {
  try {
    console.log('[Server] Creating new order with data:', JSON.stringify(req.body, null, 2));
    const orderId = Order.create(req.body);
    console.log('[Server] Order created with ID:', orderId);

    const order = Order.getById(orderId);
    console.log('[Server] Retrieved order:', JSON.stringify(order, null, 2));

    console.log('[Server] Emitting new-order event to all clients');
    // Emit socket event for new order
    req.io.emit('new-order', order);
    printLabel(order);

    res.status(201).json(order);
  } catch (error) {
    console.error('[Server] Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    Order.updateStatus(req.params.id, status);
    const order = Order.getById(req.params.id);

    // Emit socket event for order status update
    req.io.emit('order-status-updated', order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete('/:id', (req, res) => {
  try {
    Order.delete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reprint label for an existing order
router.post('/:id/print', (req, res) => {
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
