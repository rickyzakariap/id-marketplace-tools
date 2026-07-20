# 10-bulk-fee-calculator

CLI tool buat hitung fee marketplace secara bulk. Upload CSV produk, langsung dapat breakdown fee di semua marketplace.

## Fitur

- Support 6 marketplace: Shopee, Tokopedia, Bukalapak, Lazada, Blibli, TikTok Shop
- Bulk processing dari CSV — hitung ratusan produk sekaligus
- Parallel processing pake goroutines
- Perbandingan antar marketplace
- Export hasil ke CSV

## Install

```bash
go build -o bulk-fee-calculator .
```

## Usage

```bash
# Hitung semua marketplace
./bulk-fee-calculator -i data/sample.csv

# Marketplace tertentu
./bulk-fee-calculator -i data/sample.csv -m Shopee

# Export ke CSV
./bulk-fee-calculator -i data/sample.csv -o results.csv

# List marketplace yang didukung
./bulk-fee-calculator -list
```

## Format CSV

```csv
name,price
Kemeja Flanel Pria,185000
Celana Chino Slim Fit,159000
```

Header opsional — tool auto-detect kalau baris pertama adalah `name`, `product`, atau `nama`.

## Fee Structure

| Marketplace  | Commission | Admin Fee | Payment Fee | Service Fee |
|-------------|-----------|-----------|-------------|-------------|
| Shopee      | 5.0%      | Rp1,000   | 2.0%        | -           |
| Tokopedia   | 4.5%      | Rp1,000   | 1.5%        | -           |
| Bukalapak   | 3.5%      | Rp500     | -           | -           |
| Lazada      | 4.0%      | Rp1,000   | 2.0%        | -           |
| Blibli      | 3.0%      | Rp500     | 1.5%        | -           |
| TikTok Shop | 4.5%      | Rp500     | 2.0%        | 1.0%        |

## Tech Stack

- Go 1.21+
- Standard library only (no external dependencies)
- Goroutines untuk parallel processing
