# Stock Alert Dashboard

Track inventory across marketplaces. Get visual alerts when stock is low, out, or overstocked.

## Tech

Go 1.26 (net/http + encoding/json). Zero external dependencies. Single binary.

## Build

```bash
cd 10-stock-alert-dashboard
go build -o stock-alert.exe .
```

## Run

```bash
./stock-alert.exe
# Opens at http://localhost:3470
```

Data stored in `stock.json` (auto-created).

## Features

- Add/edit/delete products with marketplace + category
- Set min/max stock thresholds per product
- Visual alerts: red (out of stock), yellow (low), orange (overstocked)
- Quick stock adjustment (+1, +5, -1) from inventory table
- Filter by marketplace, category, or alert status
- CSV export
- Auto-fill example data (single or bulk 5 products)
- Light/dark theme toggle
- Responsive (mobile breakpoint at 768px)

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/summary | Total products, low/out/over counts, stock value |
| GET | /api/alerts | All stock alerts sorted by priority |
| GET | /api/meta | Marketplaces and categories list |
| GET | /api/products | All products (filters: marketplace, category, alerts=1) |
| POST | /api/products | Add product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| POST | /api/adjust-stock | Adjust stock: {id, delta} |
| GET | /api/export | Download CSV |
