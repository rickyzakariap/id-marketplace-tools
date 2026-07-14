# Listing SEO Analyzer

Analyze and optimize product listings for Indonesian marketplaces (Tokopedia, Shopee, TikTok Shop, Lazada, Bukalapak, Blibli).

## What It Does

- **Title Analysis** - length, keyword variety, power words, capitalization, duplicate detection
- **Description Analysis** - length, bullet points, structure, keyword density, emoji usage, CTA presence
- **Price Analysis** - psychological pricing (X999), goceng pricing (Rp 5000 increments), range check
- **Overall SEO Score** - letter grade A+ to F with percentage breakdown
- **Actionable Tips** - prioritized recommendations to improve listing rank
- **Platform-Specific** - optimal lengths per marketplace (Shopee vs Tokopedia vs others)

## Usage

```bash
cd ~/marketplace-projects/02-listing-seo-analyzer
npm install
npm start
# Open http://localhost:3456
```

Fill in the listing form (title, description, price, platform) and click "Analisa Listing".

## API

```
POST /api/analyze
Content-Type: application/json

{
  "title": "Kaos Polos Premium Cotton Combed 30s",
  "description": "Kaos polos premium...",
  "price": 89999,
  "category": "fashion",
  "platform": "shopee"
}
```

Returns JSON with scores, tips, and overall grade.

## Tech

- Node.js + Express (backend)
- Tailwind CSS + Material Design 3 (frontend)
- Dark theme UI

## Supported Marketplaces

| Platform | Title Max | Optimal Range |
|----------|-----------|---------------|
| Tokopedia | 100 | 40-70 |
| Shopee | 120 | 50-80 |
| TikTok Shop | 200 | 50-100 |
| Lazada | 200 | 50-80 |
| Bukalapak | 70 | 30-60 |
| Blibli | 100 | 40-70 |

## Contributing

Feel free to open issues or submit PRs.
