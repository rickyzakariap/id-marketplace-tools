# Competitor Price Monitor

Track competitor product prices across marketplaces. Record price changes over time, view trends, and export data.

## Usage

```bash
cd 13-competitor-price-monitor
npm install
node server.js
```

Open http://localhost:3491

## Features

- Track products across 6 marketplaces (Shopee, Tokopedia, Lazada, Bukalapak, Blibli, TikTok Shop)
- Record price changes with timestamps
- Canvas-based price history chart
- Price range tracking (min/max/current)
- Marketplace filters
- CSV export
- Auto-fill sample data for testing
- Light/dark theme toggle

## API

- `GET /api/products` - list products (query: ?marketplace=Shopee)
- `POST /api/products` - add product (body: name, marketplace, currentPrice, url?, notes?)
- `PUT /api/products/:id` - update product
- `DELETE /api/products/:id` - delete product
- `GET /api/products/:id/history` - price history
- `POST /api/products/:id/record` - record new price (body: price)
- `GET /api/stats` - dashboard stats
- `GET /api/export` - CSV download
- `POST /api/sample` - load sample data
