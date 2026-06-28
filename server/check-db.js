import { initializeDatabase, prepare } from './db/database.js';

await initializeDatabase();

console.log('\n=== Checking order_items table ===');
const orderItems = prepare('SELECT * FROM order_items').all();
console.log('Order items:', JSON.stringify(orderItems, null, 2));

console.log('\n=== Checking orders table ===');
const orders = prepare('SELECT * FROM orders').all();
console.log('Orders:', JSON.stringify(orders, null, 2));

console.log('\n=== Checking menu_items table ===');
const menuItems = prepare('SELECT * FROM menu_items').all();
console.log('Menu items:', JSON.stringify(menuItems, null, 2));

process.exit(0);
