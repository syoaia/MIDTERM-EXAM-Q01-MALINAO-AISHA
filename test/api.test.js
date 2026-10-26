const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');

const app = require('../server');

const dataFile = path.join(__dirname, '..', 'data.json');
const originalData = fs.readFileSync(dataFile, 'utf8');

async function resetData() {
  fs.writeFileSync(dataFile, originalData, 'utf8');
}

test.beforeEach(async () => {
  await resetData();
});

test.afterEach(async () => {
  await resetData();
});

test('GET /api/items returns all items', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/items`);
  const items = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(items));
  assert.ok(items.some((item) => item.claimed === true));
  assert.ok(items.some((item) => item.claimed === false));

  server.close();
});

test('GET /api/items/:id returns the item by ID', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/items/1`);
  const item = await response.json();

  assert.equal(response.status, 200);
  assert.equal(item.id, 1);
  assert.equal(item.item_name, 'Black Wallet');

  server.close();
});

test('POST /api/items adds a new item with claimed false', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_name: 'Red Backpack',
      category: 'Bag',
      location_found: 'Library',
      date_found: '2026-10-27'
    })
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.item.claimed, false);
  assert.equal(body.item.item_name, 'Red Backpack');

  server.close();
});

test('DELETE /api/items/:id removes an unclaimed item', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/items/2`, {
    method: 'DELETE'
  });

  const body = await response.json();
  const updatedItems = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  assert.equal(response.status, 200);
  assert.equal(body.message, 'Item deleted successfully');
  assert.ok(updatedItems.every((item) => item.id !== 2));

  server.close();
});

test('DELETE /api/items/:id rejects deleting a claimed item', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const before = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  const response = await fetch(`http://127.0.0.1:${port}/api/items/1`, {
    method: 'DELETE'
  });

  const body = await response.json();
  const after = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  assert.equal(response.status, 400);
  assert.equal(body.message, 'Cannot delete a claimed item.');
  assert.deepEqual(before, after);

  server.close();
});
