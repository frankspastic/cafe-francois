import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
const dbPath = join(__dirname, 'cafe-francois.db');

// Initialize SQL.js and database
export async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Database loaded from file');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customization_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      customizations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    )
  `);

  // Migration: add allowed_customization_types if it doesn't exist yet
  try {
    db.run('ALTER TABLE menu_items ADD COLUMN allowed_customization_types TEXT DEFAULT \'["size","milk","extra"]\'');
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Migration: add category if it doesn't exist yet
  try {
    db.run("ALTER TABLE menu_items ADD COLUMN category TEXT DEFAULT 'Coffee'");
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Migration: add sort_order for drag-to-reorder
  try {
    db.run('ALTER TABLE menu_items ADD COLUMN sort_order INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Migration: improve seed descriptions (only if still using original text)
  const descUpdates = [
    ['Espresso', 'Rich and bold shot of espresso', 'A concentrated shot of pure coffee — intense, rich, and topped with a velvety golden crema'],
    ['Americano', 'Espresso with hot water', 'Bold espresso diluted with hot water for a smooth, full-bodied cup without the bitterness'],
    ['Cappuccino', 'Espresso with steamed milk and foam', 'Equal parts espresso, steamed milk, and silky microfoam — the classic Italian coffeehouse balance'],
    ['Latte', 'Espresso with steamed milk', 'Smooth espresso blended with velvety steamed milk, finished with a delicate layer of foam'],
    ['Mocha', 'Latte with chocolate', 'Rich espresso and dark chocolate come together with steamed milk for an indulgent coffeehouse treat'],
    ['Cold Brew', 'Smooth cold-steeped coffee', 'Slow-steeped for 12 hours for a naturally sweet, low-acidity cold coffee with a smooth finish'],
    ['Iced Latte', 'Chilled latte over ice', 'Freshly pulled espresso poured over ice and finished with cold milk — refreshing and bold'],
  ];
  descUpdates.forEach(([name, oldDesc, newDesc]) => {
    db.run('UPDATE menu_items SET description = ? WHERE name = ? AND description = ?', [newDesc, name, oldDesc]);
  });

  console.log('Database initialized successfully');
  saveDatabase();
}

// Seed default data
export function seedDatabase() {
  const menuCountResult = db.exec('SELECT COUNT(*) as count FROM menu_items');
  const menuCount = menuCountResult.length > 0 ? menuCountResult[0].values[0][0] : 0;

  if (menuCount === 0) {
    console.log('Seeding menu items...');

    const menuItems = [
      { name: 'Espresso', description: 'Rich and bold shot of espresso', image_url: '/images/espresso.jpg' },
      { name: 'Americano', description: 'Espresso with hot water', image_url: '/images/americano.jpg' },
      { name: 'Cappuccino', description: 'Espresso with steamed milk and foam', image_url: '/images/cappuccino.jpg' },
      { name: 'Latte', description: 'Espresso with steamed milk', image_url: '/images/latte.jpg' },
      { name: 'Mocha', description: 'Latte with chocolate', image_url: '/images/mocha.jpg' },
      { name: 'Cold Brew', description: 'Smooth cold-steeped coffee', image_url: '/images/coldbrew.jpg' },
      { name: 'Iced Latte', description: 'Chilled latte over ice', image_url: '/images/icedlatte.jpg' }
    ];

    menuItems.forEach(item => {
      db.run('INSERT INTO menu_items (name, description, image_url) VALUES (?, ?, ?)',
        [item.name, item.description, item.image_url]);
    });
  }

  const customizationCountResult = db.exec('SELECT COUNT(*) as count FROM customization_options');
  const customizationCount = customizationCountResult.length > 0 ? customizationCountResult[0].values[0][0] : 0;

  if (customizationCount === 0) {
    console.log('Seeding customization options...');

    const customizations = [
      // Sizes
      { type: 'size', name: 'Small' },
      { type: 'size', name: 'Medium' },
      { type: 'size', name: 'Large' },
      // Milk types
      { type: 'milk', name: 'Whole Milk' },
      { type: 'milk', name: '2% Milk' },
      { type: 'milk', name: 'Oat Milk' },
      { type: 'milk', name: 'Almond Milk' },
      { type: 'milk', name: 'Soy Milk' },
      // Extras
      { type: 'extra', name: 'Extra Shot' },
      { type: 'extra', name: 'Vanilla' },
      { type: 'extra', name: 'Caramel' },
      { type: 'extra', name: 'Hazelnut' }
    ];

    customizations.forEach(custom => {
      db.run('INSERT INTO customization_options (type, name) VALUES (?, ?)',
        [custom.type, custom.name]);
    });
  }

  saveDatabase();
  console.log('Database seeded successfully');
}

// Save database to file
export function saveDatabase() {
  if (db) {
    const data = db.export();
    writeFileSync(dbPath, data);
  }
}

// Helper functions for prepared statements
export function prepare(sql) {
  return {
    run: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();

      // Get the last insert ID immediately after the insert
      const lastId = getLastInsertId();
      saveDatabase();
      return { lastInsertRowid: lastId };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const hasRow = stmt.step();

      if (!hasRow) {
        stmt.free();
        return null;
      }

      const columns = stmt.getColumnNames();
      const values = stmt.get();
      stmt.free();

      const row = {};
      columns.forEach((col, idx) => {
        row[col] = values[idx];
      });
      return row;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }

      const rows = [];
      const columns = stmt.getColumnNames();

      while (stmt.step()) {
        const values = stmt.get();
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = values[idx];
        });
        rows.push(row);
      }

      stmt.free();
      return rows;
    }
  };
}

function getLastInsertId() {
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
    console.error('Failed to get last insert ID, result:', result);
    return 0;
  }
  const id = result[0].values[0][0];
  console.log('[Database] Last insert ID:', id);
  return id;
}

export default {
  prepare,
  exec: (sql) => {
    db.exec(sql);
    saveDatabase();
  }
};
