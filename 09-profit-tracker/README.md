# Profit Tracker Dashboard

Track real profit across Indonesian marketplaces. Record transactions, see breakdown by marketplace, export to CSV.

## Usage

```bash
python server.py
# Open http://localhost:3462
```

## Features

- Record sales with full cost breakdown (modal, komisi, biaya layanan, ongkir)
- Summary dashboard: total revenue, cost, fees, net profit
- Marketplace breakdown: see profit per marketplace (Tokopedia, Shopee, Lazada, etc.)
- History with filters (marketplace, category, date range)
- CSV export
- Light/dark theme, responsive on mobile
- SQLite persistence (data survives restarts)
- Auto-fill example data for quick testing

## Fee Calculation

Profit = Revenue - Modal - Fees
Fees = (Komisi% x Harga Jual) + Biaya Layanan + Ongkir + Biaya Lain

## Tech

Python stdlib (http.server, sqlite3, json). Zero dependencies.
