# 07 - Listing Description Generator

Generate optimized product descriptions for Indonesian marketplaces.

## What It Does

- Generates platform-specific descriptions for Tokopedia, Shopee, Lazada, Bukalapak, TikTok Shop, Blibli
- Respects platform character limits (title and description)
- Includes marketplace-specific formatting (Tokopedia uses uppercase headers, TikTok is short and punchy)
- Auto-generates bullet points for quick copy
- Copy-to-clipboard for each section

## Usage

Open `index.html` in any browser. No server needed.

1. Fill in product info (name, category, price, features, keywords)
2. Click "Generate Descriptions"
3. Switch between marketplace tabs to see platform-specific output
4. Copy title or description with one click

## Features

- 6 marketplace targets with unique formatting
- Category-aware benefits and keywords
- Character count with warning colors (yellow near limit, red over)
- Auto-fill example data for quick testing
- Keyboard shortcut: Ctrl+Enter to generate
- Pure HTML/CSS/JS, no dependencies

## Platform Limits

| Platform  | Title Max | Description Max |
|-----------|-----------|-----------------|
| Tokopedia | 100       | 2,000           |
| Shopee    | 120       | 3,000           |
| Lazada    | 255       | 25,000          |
| Bukalapak | 70        | 2,000           |
| TikTok    | 34        | 1,000           |
| Blibli    | 150       | 5,000           |
