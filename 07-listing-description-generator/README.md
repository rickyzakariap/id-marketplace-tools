# 07 - Listing Description Generator

Generate optimized product descriptions for Indonesian marketplaces.

## Tech

- Go 1.26 (net/http)
- MD3 + Tailwind CSS frontend
- Single binary, no dependencies

## Usage

```bash
go build -o server.exe .
./server.exe
# Open http://localhost:3460
```

## Features

- 6 marketplace targets: Tokopedia, Shopee, Lazada, Bukalapak, TikTok Shop, Blibli
- Platform-specific formatting and character limits
- Category-aware benefits (10 categories)
- Copy-to-clipboard per section
- Auto-fill example data
- Keyboard: Ctrl+Enter to generate
