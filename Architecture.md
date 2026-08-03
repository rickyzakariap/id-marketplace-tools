# Architecture — ID Marketplace Tools

## Overview

Suite of CLI tools dan web apps untuk seller marketplace Indonesia. Target: non-technical sellers yang butuh tools praktis tanpa ribet.

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| CLI Tools | Go 1.21+ | Fast binary, cross-platform, zero deps |
| Web Apps | React + Vite | Fast dev, small bundle |
| Backend API | Go (Fiber) | Same language as CLI, low memory |
| Database | SQLite (local) / PostgreSQL (cloud) | Simple start, scale later |
| Chrome Extensions | Manifest V3 | Future-proof, Chrome Web Store |

## Project Structure

```
id-marketplace-tools/
├── 10-bulk-fee-calculator/     # ✅ DONE - Go CLI
│   ├── main.go
│   ├── internal/
│   │   ├── csvhandler/
│   │   └── marketplace/
│   └── data/
│
├── 20-price-optimizer/         # TODO - Go CLI
│   ├── main.go
│   ├── internal/
│   │   ├── analyzer/
│   │   ├── scraper/
│   │   └── recommender/
│   └── data/
│
├── 30-listing-generator/       # TODO - Web App
│   ├── frontend/               # React + Vite
│   ├── backend/                # Go Fiber
│   └── shared/                 # Shared types
│
├── 40-stock-sync/              # TODO - Chrome Extension
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   └── popup/
│
├── 50-review-analyzer/         # TODO - Go CLI
│   ├── main.go
│   └── internal/
│
├── 60-profit-calculator/       # TODO - Web App
│   ├── frontend/
│   └── backend/
│
├── shared/                     # Shared libraries
│   ├── marketplace-api/        # Common marketplace API clients
│   ├── ui-components/          # Shared React components
│   └── go-utils/               # Shared Go utilities
│
├── docs/                       # Documentation
│   ├── api/
│   └── guides/
│
└── .hermes/
    └── plans/                  # AI development plans
```

## Architecture Patterns

### CLI Tools (Go)
- Single binary, no dependencies
- Flag-based CLI (`-i`, `-o`, `-m`)
- CSV/JSON input/output
- Parallel processing via goroutines
- Stdlib only (no external deps)

### Web Apps (React + Go)
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Go Fiber (REST API)
- Communication: JSON over HTTP
- Auth: None (local-first) atau simple token

### Chrome Extensions (MV3)
- Background service worker
- Content scripts untuk scraping
- Popup UI (React)
- Storage: chrome.storage.local

## Data Flow

```
User Input (CSV/Web/Extension)
    ↓
Parser/Scraper
    ↓
Business Logic (Fee Calc, Price Analysis, etc.)
    ↓
Output (CSV/JSON/Dashboard)
```

## Deployment

| Tool | Deploy Target |
|------|--------------|
| CLI Tools | GitHub Releases (binary download) |
| Web Apps | Vercel (frontend) + Railway (backend) |
| Extensions | Chrome Web Store |

## Scalability

- CLI: Goroutines untuk parallel processing
- Web: Horizontal scaling (stateless backend)
- Extensions: Background sync untuk real-time updates

## Security

- No API keys stored in code (env vars only)
- Rate limiting untuk API calls
- Input validation di semua endpoints
- No sensitive data in logs