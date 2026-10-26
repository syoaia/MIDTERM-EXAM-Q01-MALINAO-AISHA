const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3001;
const dataFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

function readItems() {
  const rawData = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(rawData);
}

function writeItems(items) {
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

function generateNextId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id))) + 1 : 1;
}

app.get('/api/items', (req, res) => {
  const items = readItems();
  res.status(200).json(items);
});

app.get('/api/items/:id', (req, res) => {
  const items = readItems();
  const item = items.find((entry) => Number(entry.id) === Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Item not found.' });
  }

  return res.status(200).json(item);
});

app.post('/api/items', (req, res) => {
  const { item_name, category, location_found, date_found, claimed } = req.body;

  if (!item_name || !category || !location_found || !date_found) {
    return res.status(400).json({ message: 'item_name, category, location_found, and date_found are required.' });
  }

  const items = readItems();
  const newItem = {
    id: generateNextId(items),
    item_name,
    category,
    location_found,
    date_found,
    claimed: false
  };

  items.push(newItem);
  writeItems(items);

  return res.status(201).json({ message: 'Item added successfully', item: newItem });
});

app.delete('/api/items/:id', (req, res) => {
  const items = readItems();
  const itemIndex = items.findIndex((entry) => Number(entry.id) === Number(req.params.id));

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found.' });
  }

  if (items[itemIndex].claimed) {
    return res.status(400).json({ message: 'Cannot delete a claimed item.' });
  }

  const [deletedItem] = items.splice(itemIndex, 1);
  writeItems(items);

  return res.status(200).json({ message: 'Item deleted successfully', item: deletedItem });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Lost & Found API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
