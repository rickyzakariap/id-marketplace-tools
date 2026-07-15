# 03 - Review Sentiment Analyzer

CLI tool that analyzes marketplace product reviews for sentiment, extracts themes, and generates actionable insights. Supports Indonesian and English reviews.

## Usage

```bash
# Run with built-in sample Indonesian reviews
python3 analyze.py --sample

# Analyze your own CSV file
python3 analyze.py reviews.csv

# Enter reviews manually
python3 analyze.py --interactive

# Export results to JSON
python3 analyze.py --sample --export results.json
```

## CSV Format

The tool auto-detects columns by name. Supported headers:

| Column | Aliases |
|--------|---------|
| text | review, content, ulasan, komentar, comment |
| rating | stars, bintang, nilai |
| source | marketplace, platform |
| product | produk, item, nama |

Example CSV:
```csv
text,rating,source
"Barang bagus, pengiriman cepat",5,Tokopedia
"Kualitas jelek, kecewa",1,Shopee
```

## Features

- Sentiment analysis (positive/negative/neutral) with keyword matching
- Theme extraction: Shipping, Product Quality, Packaging, Price, Customer Service, Size/Fit
- Top positive and negative keywords
- Actionable insights based on theme sentiment ratios
- Worst and best review samples
- JSON export for further processing
- Zero dependencies - Python stdlib only

## How It Works

1. Parses reviews from CSV or stdin
2. Matches against curated Indonesian + English sentiment keywords
3. Detects negation (tidak, ga, bukan) to flip sentiment
4. Combines keyword score with star rating (if available)
5. Groups reviews by theme using keyword sets
6. Generates insights based on theme-level sentiment ratios

## Tech

Python 3, no external dependencies.
