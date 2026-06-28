import db from '../db/database.js';

const DEFAULT_TYPES = ['size', 'milk', 'extra'];

function parseItem(item) {
  if (!item) return item;
  return {
    ...item,
    allowed_customization_types: item.allowed_customization_types
      ? JSON.parse(item.allowed_customization_types)
      : DEFAULT_TYPES,
  };
}

export const Menu = {
  // Get available menu items (kiosk/guest view)
  getAll() {
    return db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, sort_order ASC, name ASC').all().map(parseItem);
  },

  // Get all menu items including unavailable (barista management view)
  getAllAdmin() {
    return db.prepare('SELECT * FROM menu_items ORDER BY category, sort_order ASC, name ASC').all().map(parseItem);
  },

  // Get menu item by ID
  getById(id) {
    return parseItem(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id));
  },

  // Create new menu item
  create(item) {
    const { name, description, image_url, allowed_customization_types, category } = item;
    const result = db.prepare(
      'INSERT INTO menu_items (name, description, image_url, allowed_customization_types, category) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description, image_url, JSON.stringify(allowed_customization_types || DEFAULT_TYPES), category || 'Coffee');
    return result.lastInsertRowid;
  },

  // Update menu item
  update(id, item) {
    const { name, description, image_url, available, allowed_customization_types, category } = item;
    return db.prepare(
      'UPDATE menu_items SET name = ?, description = ?, image_url = ?, available = ?, allowed_customization_types = ?, category = ? WHERE id = ?'
    ).run(name, description, image_url, available, JSON.stringify(allowed_customization_types || DEFAULT_TYPES), category || 'Coffee', id);
  },

  // Delete menu item (soft delete)
  delete(id) {
    return db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?').run(id);
  },

  // Bulk-update sort_order for drag-to-reorder
  reorder(items) {
    items.forEach(({ id, sort_order }) => {
      db.prepare('UPDATE menu_items SET sort_order = ? WHERE id = ?').run(sort_order, id);
    });
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
