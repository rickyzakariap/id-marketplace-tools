const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3491;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load or initialize data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading data:', e.message);
  }
  return { products: [], prices: [], nextId: 1, nextPriceId: 1 };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/products - list all products with latest price
app.get('/api/products', (req, res) => {
  const data = loadData();
  const marketplace = req.query.marketplace;
  let products = data.products;

  if (marketplace && marketplace !== 'all') {
    products = products.filter(p => p.marketplace === marketplace);
  }

  const result = products.map(p => {
    const productPrices = data.prices
      .filter(price => price.productId === p.id)
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    const latest = productPrices[0] || null;
    const previous = productPrices[1] || null;
    const change = latest && previous
      ? ((latest.price - previous.price) / previous.price * 100).toFixed(1)
      : null;

    const minPrice = productPrices.length > 0
      ? Math.min(...productPrices.map(pp => pp.price))
      : null;
    const maxPrice = productPrices.length > 0
      ? Math.max(...productPrices.map(pp => pp.price))
      : null;

    return {
      ...p,
      currentPrice: latest ? latest.price : p.currentPrice,
      priceChange: change,
      priceChangeAbs: latest && previous ? latest.price - previous.price : null,
      minPrice,
      maxPrice,
      recordCount: productPrices.length,
      lastRecorded: latest ? latest.recordedAt : null
    };
  });

  res.json(result);
});

// POST /api/products - add new product
app.post('/api/products', (req, res) => {
  const { name, marketplace, url, currentPrice, notes } = req.body;
  if (!name || !marketplace || !currentPrice) {
    return res.status(400).json({ error: 'Name, marketplace, and current price are required' });
  }
  const price = parseFloat(currentPrice);
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const data = loadData();
  const id = data.nextId++;
  const product = {
    id,
    name: name.trim(),
    marketplace,
    url: url || '',
    currentPrice: price,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  data.products.push(product);

  // Record initial price
  const priceRecord = {
    id: data.nextPriceId++,
    productId: id,
    price,
    recordedAt: new Date().toISOString()
  };
  data.prices.push(priceRecord);

  saveData(data);
  res.json(product);
});

// PUT /api/products/:id - update product details
app.put('/api/products/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const product = data.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { name, marketplace, url, notes } = req.body;
  if (name) product.name = name.trim();
  if (marketplace) product.marketplace = marketplace;
  if (url !== undefined) product.url = url;
  if (notes !== undefined) product.notes = notes;

  saveData(data);
  res.json(product);
});

// DELETE /api/products/:id
app.delete('/api/products/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  data.products = data.products.filter(p => p.id !== id);
  data.prices = data.prices.filter(p => p.productId !== id);
  saveData(data);
  res.json({ ok: true });
});

// GET /api/products/:id/history - price history for chart
app.get('/api/products/:id/history', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const product = data.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const history = data.prices
    .filter(p => p.productId === id)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

  res.json({ product, history });
});

// POST /api/products/:id/record - record new price
app.post('/api/products/:id/record', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const product = data.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { price } = req.body;
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const priceRecord = {
    id: data.nextPriceId++,
    productId: id,
    price: numPrice,
    recordedAt: new Date().toISOString()
  };
  data.prices.push(priceRecord);
  product.currentPrice = numPrice;

  saveData(data);
  res.json(priceRecord);
});

// GET /api/stats - dashboard stats
app.get('/api/stats', (req, res) => {
  const data = loadData();
  const products = data.products;
  const totalProducts = products.length;

  // Marketplace breakdown
  const marketplaceCounts = {};
  products.forEach(p => {
    marketplaceCounts[p.marketplace] = (marketplaceCounts[p.marketplace] || 0) + 1;
  });

  // Price changes summary
  let priceIncreases = 0;
  let priceDecreases = 0;
  let priceStable = 0;

  products.forEach(p => {
    const pp = data.prices
      .filter(price => price.productId === p.id)
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    if (pp.length >= 2) {
      const diff = pp[0].price - pp[1].price;
      if (diff > 0) priceIncreases++;
      else if (diff < 0) priceDecreases++;
      else priceStable++;
    }
  });

  // Average price per marketplace
  const marketplaceAvg = {};
  const marketplacePrices = {};
  products.forEach(p => {
    if (!marketplacePrices[p.marketplace]) marketplacePrices[p.marketplace] = [];
    marketplacePrices[p.marketplace].push(p.currentPrice);
  });
  Object.keys(marketplacePrices).forEach(mp => {
    const prices = marketplacePrices[mp];
    marketplaceAvg[mp] = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  });

  res.json({
    totalProducts,
    marketplaceCounts,
    priceChanges: { increases: priceIncreases, decreases: priceDecreases, stable: priceStable },
    marketplaceAvg
  });
});

// GET /api/export - CSV export
app.get('/api/export', (req, res) => {
  const data = loadData();
  const headers = ['ID', 'Name', 'Marketplace', 'Current Price', 'Min Price', 'Max Price', 'Price Change %', 'Records', 'Notes'];
  const rows = data.products.map(p => {
    const pp = data.prices
      .filter(price => price.productId === p.id)
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
    const min = pp.length > 0 ? Math.min(...pp.map(x => x.price)) : p.currentPrice;
    const max = pp.length > 0 ? Math.max(...pp.map(x => x.price)) : p.currentPrice;
    let change = '';
    if (pp.length >= 2) {
      const last = pp[pp.length - 1].price;
      const prev = pp[pp.length - 2].price;
      change = ((last - prev) / prev * 100).toFixed(1) + '%';
    }
    return [p.id, `"${p.name}"`, p.marketplace, p.currentPrice, min, max, change, pp.length, `"${(p.notes || '').replace(/"/g, '""')}"`];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="price-monitor-export.csv"');
  res.send(csv);
});

// Load sample data
app.post('/api/sample', (req, res) => {
  const data = loadData();
  if (data.products.length > 0) {
    return res.json({ ok: true, message: 'Data already exists' });
  }

  const sampleProducts = [
    { name: 'TWS Bluetooth Earphone X7', marketplace: 'Shopee', url: 'https://shopee.co.id/product/123', currentPrice: 89000 },
    { name: 'Phone Case iPhone 15 Pro', marketplace: 'Tokopedia', url: 'https://tokopedia.com/product/456', currentPrice: 45000 },
    { name: 'Power Bank 20000mAh', marketplace: 'Lazada', url: 'https://lazada.co.id/product/789', currentPrice: 175000 },
    { name: 'USB-C Cable 2m', marketplace: 'Shopee', url: 'https://shopee.co.id/product/101', currentPrice: 25000 },
    { name: 'LED Desk Lamp', marketplace: 'Bukalapak', url: 'https://bukalapak.com/product/202', currentPrice: 135000 },
  ];

  sampleProducts.forEach(sp => {
    const id = data.nextId++;
    data.products.push({
      id,
      name: sp.name,
      marketplace: sp.marketplace,
      url: sp.url,
      currentPrice: sp.currentPrice,
      notes: '',
      createdAt: new Date().toISOString()
    });

    // Generate price history (last 7 days with some variation)
    const basePrice = sp.currentPrice;
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.1 * basePrice;
      const price = Math.round((basePrice + variation) / 1000) * 1000;
      data.prices.push({
        id: data.nextPriceId++,
        productId: id,
        price,
        recordedAt: date.toISOString()
      });
    }
    // Set final price
    const lastPrice = data.prices[data.prices.length - 1];
    data.products[data.products.length - 1].currentPrice = lastPrice.price;
  });

  saveData(data);
  res.json({ ok: true, message: 'Sample data loaded', count: sampleProducts.length });
});

// Clear all data
app.delete('/api/data', (req, res) => {
  saveData({ products: [], prices: [], nextId: 1, nextPriceId: 1 });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Competitor Price Monitor running on http://localhost:${PORT}`);
});
