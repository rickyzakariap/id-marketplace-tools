const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3616;
const DATA_FILE = path.join(__dirname, 'data', 'listings.json');

app.use(express.json());
app.use(express.static('public'));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Load or initialize data
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return [];
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/listings
app.get('/api/listings', (req, res) => {
  const data = loadData();
  res.json(data);
});

// GET /api/products - unique product names
app.get('/api/products', (req, res) => {
  const data = loadData();
  const products = [...new Set(data.map(l => l.product_name))];
  res.json(products);
});

// POST /api/listings
app.post('/api/listings', (req, res) => {
  const { product_name, marketplace, title, price, stock, description } = req.body;
  if (!product_name || !marketplace) {
    return res.status(400).json({ error: 'product_name and marketplace required' });
  }
  const data = loadData();
  const listing = {
    id: crypto.randomUUID(),
    product_name,
    marketplace,
    title: title || '',
    price: parseFloat(price) || 0,
    stock: parseInt(stock) || 0,
    description: description || '',
    created_at: new Date().toISOString()
  };
  data.push(listing);
  saveData(data);
  res.status(201).json(listing);
});

// PUT /api/listings/:id
app.put('/api/listings/:id', (req, res) => {
  const data = loadData();
  const idx = data.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id };
  saveData(data);
  res.json(data[idx]);
});

// DELETE /api/listings/:id
app.delete('/api/listings/:id', (req, res) => {
  const data = loadData();
  const filtered = data.filter(l => l.id !== req.params.id);
  if (filtered.length === data.length) return res.status(404).json({ error: 'not found' });
  saveData(filtered);
  res.json({ success: true });
});

// POST /api/check - analyze consistency
app.post('/api/check', (req, res) => {
  const { product_name } = req.body;
  if (!product_name) return res.status(400).json({ error: 'product_name required' });

  const data = loadData();
  const listings = data.filter(l => l.product_name === product_name);
  if (listings.length === 0) return res.status(404).json({ error: 'no listings found' });

  const fields = ['price', 'stock', 'title'];
  const consistency = { score: 0, fields: {} };
  let totalChecks = 0;
  let consistentChecks = 0;

  for (const field of fields) {
    const values = listings.map(l => ({
      marketplace: l.marketplace,
      value: l[field]
    }));

    const uniqueValues = new Set(values.map(v => String(v.value)));
    const isConsistent = uniqueValues.size === 1;

    if (isConsistent) consistentChecks++;
    totalChecks++;

    let outlier = null;
    if (!isConsistent && field === 'price') {
      const prices = values.map(v => v.value);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const maxDiff = Math.max(...prices.map(p => Math.abs(p - avg)));
      const outlierListing = values.find(v => Math.abs(v.value - avg) === maxDiff);
      outlier = outlierListing ? outlierListing.marketplace : null;
    }

    consistency.fields[field] = {
      consistent: isConsistent,
      values,
      outlier
    };
  }

  consistency.score = Math.round((consistentChecks / totalChecks) * 100);

  res.json({
    product_name,
    listings,
    consistency
  });
});

// POST /api/seed - example data
app.post('/api/seed', (req, res) => {
  const seed = [
    { product_name: 'Kaos Polos Premium', marketplace: 'tokopedia', title: 'Kaos Polos Premium Katun Combed 30s', price: 89000, stock: 50, description: 'Bahan katun combed 30s, halus dan adem' },
    { product_name: 'Kaos Polos Premium', marketplace: 'shopee', title: 'Kaos Polos Premium Katun Combed 30s Original', price: 85000, stock: 45, description: 'Bahan katun combed 30s, halus dan adem' },
    { product_name: 'Kaos Polos Premium', marketplace: 'lazada', title: 'Kaos Polos Premium Katun', price: 92000, stock: 30, description: 'Kaos polos bahan katun combed 30s' },
    { product_name: 'Kaos Polos Premium', marketplace: 'bukalapak', title: 'Kaos Polos Premium Katun Combed 30s', price: 89000, stock: 50, description: 'Bahan katun combed 30s, halus dan adem' },
    { product_name: 'Tumbler Stainless', marketplace: 'tokopedia', title: 'Tumbler Stainless Steel 500ml', price: 125000, stock: 20, description: 'Tumbler stainless steel, tahan panas dan dingin' },
    { product_name: 'Tumbler Stainless', marketplace: 'shopee', title: 'Tumbler Stainless Steel 500ml Premium', price: 125000, stock: 20, description: 'Tumbler stainless steel, tahan panas dan dingin' },
    { product_name: 'Tumbler Stainless', marketplace: 'lazada', title: 'Tumbler Stainless 500ml', price: 130000, stock: 15, description: 'Tumbler stainless steel 500ml' },
    { product_name: 'Tumbler Stainless', marketplace: 'tokopedia', title: 'Tumbler Stainless Steel 500ml', price: 125000, stock: 20, description: 'Tumbler stainless steel, tahan panas dan dingin' },
    { product_name: 'Powerbank 10000mAh', marketplace: 'shopee', title: 'Powerbank 10000mAh Fast Charging', price: 199000, stock: 35, description: 'Powerbank kapasitas 10000mAh dengan fast charging' },
    { product_name: 'Powerbank 10000mAh', marketplace: 'tokopedia', title: 'Powerbank 10000mAh Fast Charging PD', price: 210000, stock: 30, description: 'Powerbank 10000mAh fast charging PD dan QC' },
    { product_name: 'Powerbank 10000mAh', marketplace: 'lazada', title: 'Powerbank 10000mAh', price: 185000, stock: 40, description: 'Powerbank 10000mAh' }
  ];

  const data = seed.map(s => ({
    ...s,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  }));

  saveData(data);
  res.json({ count: data.length });
});

app.listen(PORT, () => {
  console.log(`Listing Consistency Checker running on http://localhost:${PORT}`);
});