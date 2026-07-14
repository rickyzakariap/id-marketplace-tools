# Marketplace Fee Calculator CLI

Calculate net profit after fees across all Indonesian marketplaces. Zero dependencies, pure Node.js.

## Supported Marketplaces

| Marketplace | Commission Range | Payment Fee | Notes |
|-------------|-----------------|-------------|-------|
| 🟢 Tokopedia | 3-5.5% | 1.5% | Varies by seller tier |
| 🟠 Shopee | 3.5-6% | 2% | Star Seller gets lower rates |
| 🎵 TikTok Shop | 4-7% | 2% | Rates change during promos |
| 🔵 Lazada | 2.5-5% | 1.5% | Lower fees, smaller share |
| 🔴 Bukalapak | 2.5-5% | 1.5% | Loyal user base |
| 💎 Blibli | 2-4.5% | 1.5% | Quality-focused |

## Usage

```bash
# Single marketplace
node index.js --price 150000 --marketplace shopee

# With cost (profit calculation)
node index.js --price 150000 --cost 80000 --marketplace tokopedia

# Compare all marketplaces
node index.js --price 150000 --cost 80000 --compare

# Different product category
node index.js --price 200000 --marketplace tiktokshop --category fashion

# Help
node index.js --help
```

## Options

| Flag | Description |
|------|-------------|
| `--price <amount>` | Selling price (required) |
| `--cost <amount>` | Cost price (for profit calculation) |
| `--marketplace <name>` | tokopedia, shopee, tiktokshop, lazada, bukalapak, blibli |
| `--category <name>` | default, electronics, fashion, food, beauty, home, automotive, books |
| `--compare` | Compare all marketplaces |

## How It Works

Calculates total seller fees by combining:
1. **Commission** - percentage based on product category
2. **Platform fee** - fixed 0.5% across all platforms
3. **Payment processing** - 1.5-2% depending on marketplace
4. **Admin fee** - some platforms charge per-transaction

Then subtracts from selling price to get net amount, and optionally subtracts cost to get profit.

## Requirements

- Node.js 14+ (no external dependencies)

## Disclaimer

Fee rates are approximate based on publicly available data (2024-2026). Actual fees vary by seller tier, promotions, and category. Always check official marketplace seller center for current rates.
