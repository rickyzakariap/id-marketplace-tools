# Architecture - ID Marketplace Tools

## Overview

Suite of web tools dan CLI untuk seller marketplace Indonesia. Target: non-technical sellers yang butuh tools praktis tanpa ribet.

## Tech Stack

This table is the source of truth for every new tool. Do not add a framework or build step without updating this file first.

| Layer | Technology | Reason |
|-------|-----------|--------|
| Web tools (default) | Node.js 22 + Express 4 | Single process, no build step, easy to curl-test and deploy |
| Web frontend | Vanilla HTML/CSS/JS in `public/` | No React/Vite/Tailwind build, fast daily iteration |
| CLI tools | Go 1.21+ or Python 3 stdlib | Fast binary or zero-dependency scripts |
| Storage | JSON files / SQLite (local-first) | Simple start, no external service required |
| Database (future) | PostgreSQL | Only when a tool genuinely needs shared state |
| Chrome Extensions | Manifest V3 | Future-proof, Chrome Web Store |

Legacy tools (#01-#35) use a mix of Node, Go, Python, and React. They stay as they are. New tools follow the policy above.

## Stack Policy

1. **New web tool:** Node.js 22 + Express, static frontend in `public/`, no bundler. Port is `8000 + project number` (e.g. #49 -> 8049).
2. **New CLI tool:** Go or Python stdlib only. No external dependency unless justified in the tool README.
3. **New Chrome extension:** Manifest V3.
4. **Never** introduce React, Vite, Next.js, Tailwind, or another server framework for a new tool unless Architecture.md is updated first.
5. Every UI follows `DESIGN.md`. Every tool has `README.md`, tests, and a source-grounded default.
6. Code and comments in English, user-facing text in Bahasa Indonesia.

## Project Structure

```
id-marketplace-tools/
├── NN-slug-tool/                # Web tool (default)
│   ├── server.js                # Express app, PORT = 8000 + NN
│   ├── lib/                     # Business logic
│   ├── public/
│   │   └── index.html           # Static UI, inline CSS/JS
│   ├── test/
│   │   └── *.test.js            # node:test or plain assert runner
│   ├── package.json             # express, start, test
│   └── README.md                # Run / Fitur / API / Test
├── NN-slug-cli/                 # CLI tool
│   ├── main.go                  # or server.py + public/ for legacy Python web tools
│   └── README.md
├── scripts/
│   └── check-tool-conventions.sh
├── research/
│   └── ideas-YYYY-MM-DD.json
├── README.md                    # One table row per tool
├── LESSONS.md                   # Dated entry per run
└── DESIGN.md                    # Visual contract
```

## Architecture Patterns

### Web Tools (Node + Express)
- `server.js` exposes JSON endpoints under `/api/` and serves `public/` statically.
- Business logic lives in `lib/` and is unit-tested without starting the server.
- `express.json({ limit: '64kb' })`; reject malformed JSON with 400 and oversized payloads with 413.
- Local-first: data lives in JSON files or in-memory; no auth unless a tool needs it.
- Bind to localhost in development and verify every endpoint with `curl` before commit.

### CLI Tools (Go / Python)
- Stdlib only, flag-based arguments, CSV/JSON input and output.
- Errors are checked and wrapped with context.
- Tests use table-driven cases (Go) or `test_*.py` (Python).

### Chrome Extensions (MV3)
- Background service worker, content scripts for scraping, popup UI.
- Storage: `chrome.storage.local`.

## Data Flow

```
User Input (Web/CLI/Extension)
    ↓
Parser/Validator
    ↓
Business Logic (fee, tax, audit, etc. in lib/)
    ↓
Output (JSON API / CSV export / letter / dashboard)
```

## Deployment

| Tool | Deploy Target |
|------|--------------|
| Web Tools | Node process (Railway/Fly/VPS) or local |
| CLI Tools | GitHub Releases (binary) or source |
| Extensions | Chrome Web Store |

## Scalability

- Web: stateless Express process, horizontal scaling possible.
- CLI: parallel processing where useful.
- Extensions: background sync for real-time updates.

## Security

- No API keys or secrets in code; use environment variables.
- Rate limiting for external API calls.
- Input validation on every endpoint.
- No sensitive data in logs or committed data files.
