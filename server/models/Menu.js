import db from '../db/database.js';

export const Menu = {
  // Get all menu items
  getAll() {
    return db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY name').all();
  },

  // Get menu item by ID
  getById(id) {
    return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  },

  // Create new menu item
  create(item) {
    const { name, description, image_url } = item;
    const result = db.prepare(
      'INSERT INTO menu_items (name, description, image_url) VALUES (?, ?, ?)'
    ).run(name, description, image_url);
    return result.lastInsertRowid;
  },

  // Update menu item
  update(id, item) {
    const { name, description, image_url, available } = item;
    return db.prepare(
      'UPDATE menu_items SET name = ?, description = ?, image_url = ?, available = ? WHERE id = ?'
    ).run(name, description, image_url, available, id);
  },

  // Delete menu item (soft delete)
  delete(id) {
    return db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?').run(id);
  },

  // Get all customization options
  getCustomizations() {
    const options = db.prepare('SELECT * FROM customization_options ORDER BY type, name').all();

    const grouped = { size: [], milk: [], extra: [] };
    options.forEach(opt => {
      if (grouped[opt.type]) grouped[opt.type].push(opt);
    });
    return grouped;
  },

  createCustomization(type, name) {
    const result = db.prepare(
      'INSERT INTO customization_options (type, name) VALUES (?, ?)'
    ).run(type, name);
    return result.lastInsertRowid;
  },

  deleteCustomization(id) {
    return db.prepare('DELETE FROM customization_options WHERE id = ?').run(id);
  }
};
