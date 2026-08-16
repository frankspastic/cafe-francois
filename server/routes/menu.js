import express from 'express';
import { Menu } from '../models/Menu.js';
import { requireBarista } from '../auth.js';

const router = express.Router();

// Get all menu items (admin=true returns unavailable items too, barista only)
router.get('/', (req, res, next) => {
  if (req.query.admin === 'true') return requireBarista(req, res, next);
  next();
}, (req, res) => {
  try {
    const items = req.query.admin === 'true' ? Menu.getAllAdmin() : Menu.getAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories in sort order
router.get('/categories', (req, res) => {
  try {
    res.json(Menu.getCategories());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder categories
router.patch('/categories/reorder', requireBarista, (req, res) => {
  try {
    Menu.reorderCategories(req.body.items);
    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customization options
router.get('/customizations', (req, res) => {
  try {
    const options = Menu.getCustomizations();
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customization option
router.post('/customizations', requireBarista, (req, res) => {
  try {
    const { type, name } = req.body;
    const id = Menu.createCustomization(type, name);
    res.status(201).json({ id, type, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customization option
router.delete('/customizations/:id', requireBarista, (req, res) => {
  try {
    Menu.deleteCustomization(req.params.id);
    res.json({ message: 'Customization option deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk reorder menu items
router.patch('/reorder', requireBarista, (req, res) => {
  try {
    const { items } = req.body;
    Menu.reorder(items);
    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get menu item by ID
router.get('/:id', (req, res) => {
  try {
    const item = Menu.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new menu item
router.post('/', requireBarista, (req, res) => {
  try {
    const id = Menu.create(req.body);
    const item = Menu.getById(id);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update menu item
router.put('/:id', requireBarista, (req, res) => {
  try {
    Menu.update(req.params.id, req.body);
    const item = Menu.getById(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete menu item
router.delete('/:id', requireBarista, (req, res) => {
  try {
    Menu.delete(req.params.id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
