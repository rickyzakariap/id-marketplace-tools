# Image Optimizer

Web tool to optimize product images for Indonesian marketplace requirements.

## Features

- Upload product images (drag-drop or click)
- Check compatibility with 6 marketplaces (Tokopedia, Shopee, Lazada, Bukalapak, Blibli, TikTok Shop)
- Auto-resize and crop to marketplace specs
- White background fill for non-square images
- File size validation
- Batch export for multiple marketplaces

## Usage

```bash
python server.py
```

Open http://localhost:3818

## Tech Stack

- Python 3 stdlib (http.server)
- Vanilla HTML/CSS/JS
- Canvas API for image processing
- Zero dependencies

## Marketplace Specs

| Marketplace | Min Size | Ratio | Max File | Recommended |
|-------------|----------|-------|----------|-------------|
| Tokopedia | 700x700 | 1:1 | 5 MB | 1000x1000 |
| Shopee | 500x500 | 1:1 | 2 MB | 800x800 |
| Lazada | 330x330 | 1:1 | 5 MB | 800x800 |
| Bukalapak | 500x500 | 1:1 | 5 MB | 800x800 |
| Blibli | 500x500 | 1:1 | 2 MB | 800x800 |
| TikTok Shop | 600x600 | 1:1 | 5 MB | 800x800 |

## How It Works

1. Upload image (any format/size)
2. Select target marketplaces
3. Tool analyzes: dimensions, aspect ratio, file size
4. Shows status per marketplace (OK / Needs Fix / Fail)
5. Click "Optimize" to auto-resize and crop
6. Download optimized versions

## Features

- Light/dark theme toggle
- Responsive design (mobile-friendly)
- Keyboard shortcuts (Esc to clear)
- Auto-crop to 1:1 ratio from center
- White background fill
- Quality compression (85% JPEG)