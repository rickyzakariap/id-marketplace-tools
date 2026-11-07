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

- Revenue = Harga Jual x Qty
- Modal = Harga Modal x Qty
- Fees = (Komisi% x Harga Jual x Qty) + Biaya Layanan + Ongkir + Biaya Lain

Biaya Layanan, Ongkir, dan Biaya Lain adalah biaya **per transaksi**, bukan per item.
Hanya harga jual, modal, dan komisi persen yang dikalikan dengan Qty.

## Test

```bash
python3 -m unittest -v test_server
```

## Tech

Python stdlib (http.server, sqlite3, json, unittest). Zero dependencies.
