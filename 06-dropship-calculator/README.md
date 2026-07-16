# Dropship Margin Calculator

Web tool to calculate dropship profit margins across Indonesian marketplaces.

## Features

- Calculate profit after all marketplace fees (commission, service, payment, admin)
- Compare profit across 6 marketplaces (Tokopedia, Shopee, TikTok Shop, Lazada, Bukalapak, Blibli)
- Break-even price calculation
- Recommended selling price with X999 pricing
- Free ongkir subsidy estimation
- Category-specific commission rates

## Usage

```bash
python3 server.py
# Open http://localhost:3459
```

Zero dependencies. Python stdlib only.

## Tech

- Python 3 (http.server, json)
- Single-file HTML frontend
- No external packages
