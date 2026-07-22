# Supplier Scorer

Score and rank suppliers across 6 dimensions: price, shipping, quality, communication, returns, and MOQ.

## Usage

```bash
go build -o server.exe .
./server.exe
```

Open http://localhost:3490

## Features

- Add/edit/delete suppliers with 6-dimension scoring (1-5 scale)
- Auto-calculated average score and letter grade (A+ to D)
- Filter by marketplace, search by name
- Dark/light theme toggle
- JSON file persistence (data.json)
- Keyboard shortcuts: Ctrl+Enter (save), Escape (cancel)

## Scoring Dimensions

| Dimension | What it measures |
|-----------|-----------------|
| Price | Price competitiveness vs market |
| Shipping | Speed and reliability of delivery |
| Quality | Product quality and consistency |
| Communication | Responsiveness and clarity |
| Low Returns | How rarely buyers return items |
| MOQ/Flexibility | Minimum order quantity and terms |

## Tech

Go 1.26, zero dependencies, JSON file storage.
