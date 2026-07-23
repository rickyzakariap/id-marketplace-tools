# Project Lessons

> Read this file BEFORE starting a new project. Don't repeat the same mistakes.

---

## 2026-07-15 - Review Sentiment Extension (Chrome MV3)
- Works: Chrome MV3 extension + Express backend + Supabase
- Works: `chrome.scripting.executeScript({ func })` untuk inject scraping langsung
- Works: Supabase connected, insert/delete works
- Issues: Shopee DOM selector ga stabil, review tidak ditemukan
- Issues: Content script auto-injection ga reliable di MV3
- Issues: CSP blokir `new Function()` / eval
- Issues: Tailwind CDN ga bisa dimuat di extension popup
- Fix: Pakai `chrome.scripting.executeScript({ func })` langsung
- Fix: Inline CSS, bukan CDN
- Fix: Broader selector strategy (class pattern matching)
- Lesson: Chrome extension CSP KETAT. Ga boleh eval, ga boleh CDN
- Lesson: Content script injection harus manual via scripting API
- Lesson: Shopee selector: `.product-ratings__list` > children = individual reviews
- Lesson: `.shopee-rating-stars__lit` = filled stars
- Lesson: Shopee lazy-load reviews, perlu scroll/pagination buat ambil semua
- Lesson: Debug Page button = cara terbaik inspect DOM dari extension
- Lesson: Price regex Indonesia: `\d{1,3}(?:\.\d{3})` (dots as thousands)
- Lesson: Location regex: capture city name only, jangan makan suffix
- Lesson: Rating dan toko TIDAK ada di Shopee search results
- Lesson: .env jangan ke-commit (credentials leak)

---

## 2026-07-15 - Review Sentiment Analyzer (Web Upgrade)
- Works: Converted CLI Python to Web (Express + vanilla JS)
- Works: Dark theme, flat design, no AI slop
- Works: CSV upload, paste input, auto-fill sample data
- Works: Theme analysis, keyword extraction, actionable insights
- Issues: User rightfully called out CLI bias - seller awam ga mau pakai terminal
- Lesson: BIKIN UNTUK USER, BUKAN UNTUK KENYAMANAN SENDIRI
- Lesson: Jangan default ke CLI/Python karena "gampang buat gue"
- Lesson: Web > CLI untuk tools yang targetnya seller non-teknis
- Lesson: Minta approval format sebelum build, jangan asumsi

---

## 2026-07-15 - Marketplace Fee Breakdown Calculator
- Works: Data-driven ide from real seller pain points (research via DuckDuckGo)
- Works: 6 marketplaces, 6 categories, accurate 2026 fee structures
- Works: Comparison mode ranks by profit, shows savings vs worst option
- Works: Pre-order + free ongkir toggle for real-world scenarios
- Works: Zero dependencies, Python stdlib only
- Issues: Fee data is approximate, marketplace can change rates anytime
- Lesson: Research before building. Real pain points > guessing.
- Lesson: User wants tech stack variety. Don't default to HTML/JS.
- Next: Add fee update checker, link to official marketplace fee pages

---

## 2026-07-14 - Marketplace Fee Calculator CLI
- Works: Zero dependencies, pure Node.js, clean CLI output
- Works: Compare mode ranks profit across all marketplaces
- Works: Fee structures based on real marketplace data
- Issues: None major - first project, baseline established
- Feedback: N/A (first project)
- Next: Add interactive mode (prompt-based input)

## 2026-07-14 - Listing SEO Analyzer
- Works: Web UI dark theme - better UX than CLI for data visualization
- Works: Color-coded score bars (green/yellow/red) make results scannable
- Works: Platform-specific limits (different title max lengths per marketplace)
- Works: Power words detection with Indonesian marketplace keywords
- Works: Price psychology analysis (X999, goceng pricing) - unique feature
- Issues: Keyword density analysis is basic - no synonym or stemming support
- Issues: No real marketplace data - analysis is heuristic-based
- Feedback: N/A (self-built)
- Next: Add simple synonym detection for Indonesian language

## 2026-07-14 - Listing SEO Analyzer (fixes)
- Issues: Analyze button stuck due to ID mismatch (`descError` vs `descriptionError`)
- Issues: Contradictory price suggestions (20000 suggests 19999, but also suggests rounding to 5000)
- Fix: Standardize IDs, price suggestion logic checks X999 before suggesting rounding
- Lesson: MUST test in browser, don't rely on backend tests only. ID mismatch = silent crash.
- Lesson: clearErrors() must handle all IDs consistently, no abbreviations.
- Issues: Price 11999 (already X999) still suggests "round to Rp 5.000" because Goceng check runs separately
- Fix: Skip Goceng tip if already X999, bump score from 60 to 80
- Lesson: Don't give contradictory suggestions. If price is X999, don't suggest rounding to 5000.

## Lesson: Commit Messages for Security Fixes

- NEVER reveal security vulnerability details in commit messages
- Bad: "fix: sanitize user input to prevent XSS via innerHTML"
- Good: "fix: improve input handling" or "fix: minor backend improvements"
- Anyone reading git history can see the vulnerability and exploit it on older versions
- Keep security commits vague and generic

## 2026-07-15 - Review Sentiment Analyzer
- Works: Zero dependencies, pure Python stdlib, clean terminal output
- Works: Indonesian + English keyword support with negation detection
- Works: Theme extraction (shipping, quality, packaging, price, CS, size)
- Works: CSV auto-detection of column names with aliases
- Works: JSON export for further processing
- Works: Actionable insights based on theme-level sentiment ratios
- Issues: Keyword-based approach has no synonym/stemming support (acknowledged limitation)
- Issues: Negation detection is simple word proximity, not full NLP
- Lesson: Python stdlib is enough for a useful CLI tool, no need for pip packages
- Lesson: Curated keyword lists work well for domain-specific sentiment in Indonesian
- Next: Add synonym detection for Indonesian language, consider using a simple stemming approach

---

## 2026-07-16 - Dropship Margin Calculator
- Works: Python stdlib http.server, zero dependencies, single file
- Works: Web UI (not CLI) - sellers can use it directly
- Works: 6 Indonesian marketplaces with category-specific fees
- Works: Compare mode ranks profit across all marketplaces
- Works: Break-even price + recommended selling price with X999 variant
- Works: Free ongkir subsidy calculation
- Works: Auto-fill example data for quick testing
- Issues: Fee data is approximate, marketplace rates change quarterly
- Issues: No persistent storage - calculations lost on refresh
- Lesson: Python stdlib is enough for a web tool, no need for Flask/Django
- Lesson: http.server handles simple JSON APIs fine for prototypes
- Lesson: Go not available on this machine - check toolchain before planning
- Next: Add save/export functionality, SQLite for history

---

## 2026-07-17 - Listing Description Generator (Go rewrite)
- Works: Rewrote static HTML to Go 1.26 server
- Works: MD3 + Tailwind frontend (no AI slop)
- Works: 6 marketplace-specific generation with proper limits
- Works: Go single binary, no runtime dependency
- Issues: Need `go mod init` before build
- Lesson: Go installed via winget (GoLang.Go 1.26.5)
- Lesson: Embed HTML as const in separate .go file
- Lesson: Go net/http is enough for simple JSON APIs
- Lesson: Don't promise tech stacks without checking what's installed - just install them

---

## 2026-07-17 - Listing Description Generator
- Works: Static HTML/CSS/JS, zero dependencies, no backend needed
- Works: 6 marketplace targets with platform-specific formatting
- Works: Character count with warning colors (yellow/red)
- Works: Auto-fill example data, copy-to-clipboard
- Works: Category-aware benefits and keywords
- Works: Platform character limits respected
- Issues: TikTok title limit is very short (34 chars), hard to fit useful info
- Issues: Generated descriptions are template-based, not AI-generated
- Lesson: Static HTML/CSS/JS is perfect for tools that don't need backend logic
- Lesson: Platform limits vary wildly (TikTok 34 vs Lazada 255 for titles)
- Lesson: Template-based generation works well for marketplace descriptions
- Next: Add more category-specific templates, support custom templates

---

## 2026-07-18 - Komplain Response Generator
- Works: Python stdlib http.server, zero dependencies
- Works: Web UI (not CLI) - sellers can use directly
- Works: 6 complaint types with auto-detection from buyer message
- Works: 3 response tones: sopan, tegas, minta maaf
- Works: Customizable fields: resi, courier, compensation
- Works: Copy individual or all responses
- Works: Light minimal theme, responsive design
- Works: Keyboard shortcut Ctrl+Enter
- Issues: Templates are static, not AI-generated
- Lesson: Auto-detect from buyer message text is very useful for sellers
- Lesson: Template-based responses work well for common complaint patterns
- Lesson: Python stdlib is enough for a useful web tool
- Next: Add more complaint types, support custom templates, save response history

---

## 2026-07-19 - Profit Tracker Dashboard
- Works: Web UI with SQLite persistence, zero dependencies
- Works: Transaction CRUD with full fee breakdown (komisi, biaya layanan, ongkir)
- Works: Summary cards (revenue, cost, fees, net profit)
- Works: Marketplace breakdown with per-marketplace profit
- Works: History filters (marketplace, category, date range)
- Works: CSV export with all calculated fields
- Works: Auto-fill example data, light/dark theme, responsive
- Issues: Fee data entered manually per transaction (no auto-calc from marketplace rules)
- Lesson: SQLite via Python stdlib is enough for a useful persistent tool
- Lesson: Data analytics category fills a gap - sellers need to track actual profit, not just calculate it
- Next: Add auto-fill commission rates per marketplace, add charts/graphs for profit trends

---

## 2026-07-20 - Stock Alert Dashboard
- Works: Go 1.26 single binary, zero external dependencies
- Works: JSON file storage (no CGO, no SQLite driver needed)
- Works: Visual stock alerts (red/yellow/orange) with priority sorting
- Works: Quick stock adjustment buttons (+1, +5, -1) from table
- Works: Filter by marketplace, category, alert status
- Works: CSV export, auto-fill example data (single + bulk 5)
- Works: Light/dark theme toggle, responsive design
- Works: All 9 API endpoints tested and verified
- Issues: JSON file storage not suitable for high-write concurrent access (fine for single user)
- Issues: No authentication (local tool only)
- Lesson: Go net/http + encoding/json is enough for a useful web tool without external deps
- Lesson: JSON file storage is simpler than SQLite for Go projects without CGO
- Lesson: Quick stock adjustment buttons (+1/+5/-1) are more useful than edit forms for inventory management
- Next: Add stock history tracking (log every change with timestamp), add restock suggestions based on sales velocity

---

## 2026-07-21 - Shipping Cost Estimator
- Works: Node.js + Express, vanilla HTML/CSS/JS
- Works: Compare costs from 5 Indonesian couriers (JNE, J&T, SiCepat, AnterAja, GoSend)
- Works: Zone-based pricing model with 18 cities
- Works: COD fee calculation with minimum floor
- Works: Cheapest/fastest courier recommendations
- Works: Light minimal UI with dark theme option
- Works: Responsive design, autocomplete for cities
- Issues: Fee data is estimated (not real-time API rates)
- Lesson: Shipping cost is the #1 factor in purchase decisions for Indonesian buyers
- Lesson: Zone-based pricing model works well for estimation without real API
- Lesson: GoSend same-city only limitation is realistic for instant delivery
- Lesson: COD fees typically 2-3% of shipping cost with minimum floor
- Next: Add more cities, integrate with real courier APIs if available

---

## 2026-07-22 - Supplier Scorer
- Works: Go 1.26 single binary, zero external dependencies
- Works: 6-dimension scoring with auto-calculated average and letter grade (A+ to D)
- Works: CRUD API with JSON file persistence
- Works: Filter by marketplace, search by name
- Works: Dark/light theme toggle, responsive design
- Works: Keyboard shortcuts (Ctrl+Enter, Escape)
- Issues: No batch import for existing supplier lists
- Lesson: Go embedded HTML pattern works well for simple tools - no separate build step
- Lesson: Supplier scoring is a real pain point for dropshippers evaluating multiple sources
- Lesson: Letter grades (A+ to D) are more intuitive than raw numbers for quick comparison
----

## 2026-07-23 - Competitor Price Monitor
- Works: Node.js + Express, JSON file storage, canvas-based price chart
- Works: 6 marketplaces, marketplace filters, price change tracking
- Works: Price history with min/max/avg stats, CSV export
- Works: Auto-fill sample data with 7-day price history
- Works: Light/dark theme toggle, responsive design
- Works: All API endpoints tested (CRUD, record price, history, stats, export)
- Issues: Chart needs minimum 2 price records to render
- Lesson: Canvas charts are simpler than chart libraries for basic line graphs
- Lesson: JSON file storage works well for single-user tools, no DB setup needed
- Lesson: Price change percentage + absolute value both needed for context
- Next: Add price alert thresholds, bulk import from CSV, weekly price comparison report
