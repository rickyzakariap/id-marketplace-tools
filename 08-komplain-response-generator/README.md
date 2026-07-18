# 08 - Komplain Response Generator

Generate professional complaint responses for marketplace sellers in Indonesian.

## Tech

- Python 3 (stdlib only, no dependencies)
- Light minimal web UI
- Single file server

## Usage

```bash
python server.py
# Open http://localhost:3461
```

## Features

- 6 complaint types: shipping delay, damaged item, wrong item, refund, shipping cost, slow response
- 3 response tones: polite (sopan), firm (tegas), apologetic (minta maaf)
- Auto-detect complaint type from buyer message
- Customizable: resi number, courier, compensation
- Copy individual or all responses
- Keyboard shortcut: Ctrl+Enter to generate
- Light/dark theme toggle
- Responsive design
