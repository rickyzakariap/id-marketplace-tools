# Komplain Tracker

Track marketplace complaints with SLA monitoring. Log complaints, update status, add follow-up notes, and see which complaints are overdue.

## Usage

```bash
./server.exe
# Open http://localhost:3620
```

Or build from source: `go build -o server.exe .`

## Features

- Log complaints: marketplace, order ID, product, type, severity, buyer, description
- Status workflow: baru -> ditanggapi -> diproses -> selesai / batal
- SLA tracking: response target 24 hours, resolution target 72 hours
- Overdue badges on complaints past SLA
- Follow-up notes per complaint
- Filters by status, marketplace, type
- Dashboard stats: total, open, overdue, avg resolution time
- CSV export
- Auto-fill example data
- Light minimal theme with dark mode toggle, responsive

## Tech Stack

- Go 1.26 (net/http, encoding/json)
- JSON file storage (data/complaints.json)
- Vanilla HTML/CSS/JS
- Zero external dependencies
