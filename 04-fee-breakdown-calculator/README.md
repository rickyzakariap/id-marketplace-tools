# Marketplace Fee Breakdown Calculator

CLI buat hitung semua potongan marketplace Indonesia 2026. Bisa compare lintas marketplace, breakdown per komponen fee, dan hitung profit bersih.

## Marketplace

Shopee, Tokopedia, Lazada, TikTok Shop, Bukalapak, Blibli

## Install

```bash
# No dependencies, Python 3.8+ stdlib only
python fee_calc.py --help
```

## Usage

```bash
# Semua marketplace
python fee_calc.py 200000

# Marketplace spesifik
python fee_calc.py 200000 --marketplace shopee

# Perbandingan + profit
python fee_calc.py 200000 --compare --modal 100000

# Kategori + pre-order
python fee_calc.py 200000 --kategori elektronik --preorder

# Shopee + gratis ongkir
python fee_calc.py 200000 --marketplace shopee --preorder --free-ongkir
```

## Kategori

- `fashion` - Fashion, FMCG, Lifestyle
- `elektronik` - Elektronik, Perawatan Kulit
- `suplemen` - Susu Formula, Suplemen
- `elektronik_hi` - Elektronik High-End
- `perhiasan` - Logam Mulia, Perhiasan
- `digital` - E-Money, Tiket

## Data Source

Fee structures from webekspor.com, jangkar.io, traksee.com (Apr-Jun 2026).
