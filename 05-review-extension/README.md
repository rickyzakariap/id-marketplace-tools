# 05 - Review Scraper Extension

Chrome MV3 extension that scrapes product reviews and search results from Shopee and Tokopedia. Saves to Supabase, exports to CSV/Google Sheets.

## Setup

```bash
cd backend && npm install
cp .env.example .env  # add your Supabase keys
node server.js        # runs on port 3458
```

1. Open `chrome://extensions`, enable Developer Mode
2. Click "Load unpacked", select this folder
3. Navigate to a Shopee or Tokopedia product/search page
4. Click the extension icon, then "Scrape"

## Features

- Scrape product reviews from Shopee and Tokopedia product pages
- Scrape search results (product name, price, sales, shop)
- Auto-save to Supabase
- Export as CSV
- Sentiment analysis on reviews

## Tech

- Chrome MV3 Extension (manifest v3)
- Express backend with Supabase
- Inline CSS (no Tailwind CDN - CSP restriction)

## Backend

- `POST /api/analyze` - sentiment analysis
- `POST /api/save` - save reviews to Supabase
- `POST /api/save-products` - save products to Supabase
- `POST /api/sheets` - export to Google Sheets

Port: 3458
