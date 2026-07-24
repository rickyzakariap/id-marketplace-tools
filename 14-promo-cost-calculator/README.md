# Promo Cost Calculator

Calculate the real cost of running promotions across Indonesian marketplaces.

## Usage

```bash
cd 14-promo-cost-calculator
go build -o server.exe .
./server.exe
```

Open http://localhost:3510

## Features

- 5 promo types: % discount, Rp discount, free shipping, flash sale, store voucher
- Full fee breakdown per marketplace (commission + platform + payment + shipping subsidy)
- Break-even analysis: how many extra units needed to cover promo cost
- ROI calculation based on expected additional sales
- Max discount threshold: how deep you can discount before losing money
- Cross-marketplace comparison: which marketplace gives best promo profit
- 6 marketplaces: Shopee, Tokopedia, Lazada, TikTok Shop, Bukalapak, Blibli

## Tech

Go 1.26, single binary, zero external dependencies.
