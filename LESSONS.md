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

---

## 2026-07-24 - Promo Cost Calculator
- Works: Go 1.26 single binary, zero external dependencies
- Works: 5 promo types: % discount, Rp discount, free shipping, flash sale, store voucher
- Works: Full fee breakdown per marketplace (commission + platform + payment + shipping subsidy)
- Works: Break-even analysis: how many extra units needed to cover promo cost
- Works: ROI calculation based on expected additional sales volume
- Works: Max discount threshold: how deep you can discount before losing money
- Works: Cross-marketplace comparison sorted by promo profit
- Works: Light minimal theme, responsive design, dark mode toggle
- Works: Auto-fill example data, keyboard shortcut (Enter to calculate)
- Issues: Fee data is 2026 estimates, marketplace rates change quarterly
- Lesson: Sellers often don't know that marketplace commissions are charged on DISCOUNTED price, not original
- Lesson: Break-even analysis is the most actionable metric - shows exactly how many extra sales needed
- Lesson: Bukalapak consistently has lowest fees, Shopee highest - comparison table makes this obvious
- Lesson: Max discount threshold is a critical safety feature - prevents sellers from pricing themselves into losses
- Next: Add promo history tracking, export comparison to CSV, add per-category fee rates

---

## 2026-08-03 - Keyword Research Tool
- Works: Python 3 stdlib http.server, zero dependencies
- Works: Web UI (not CLI) - sellers can use directly
- Works: 5 categories with keyword patterns: fashion, electronics, beauty, home, food
- Works: Generate 20 keyword suggestions with competition level and relevance score
- Works: Keyword analysis: length, word count, modifier detection, competition estimate
- Works: Copy individual keywords or all at once
- Works: Example chips for quick testing (kaos, hp, serum, rak, kopi)
- Works: Light minimal theme, responsive design
- Works: Keyboard shortcuts (Enter to submit)
- Issues: Keyword database is heuristic-based, not real marketplace search volume data
- Issues: Competition estimates are educated guesses, not actual marketplace metrics
- Lesson: Keyword research is a real pain point - sellers struggle with what keywords to use
- Lesson: Category-based keyword patterns (modifier, material, occasion, brand) work well for Indonesian marketplace
- Lesson: Long-tail keywords (3+ words) have lower competition - useful insight for sellers
- Lesson: Python stdlib is enough for a useful keyword tool, no need for external packages
- Next: Add real search volume data from marketplace APIs, add keyword trend tracking, add competitor keyword analysis

---

## 2026-08-06 - Image Optimizer
- Works: Python stdlib http.server, zero dependencies
- Works: Web UI (not CLI) - sellers can use directly
- Works: Upload images (drag-drop or click)
- Works: Check compatibility with 6 marketplaces (Tokopedia, Shopee, Lazada, Bukalapak, Blibli, TikTok Shop)
- Works: Auto-resize and crop to marketplace specs (1:1 ratio)
- Works: White background fill for non-square images
- Works: File size validation per marketplace
- Works: Batch export for multiple marketplaces
- Works: Light minimal theme, responsive design, dark mode toggle
- Works: Keyboard shortcuts (Esc to clear)
- Issues: Canvas API quality is good but not professional-grade (no advanced compression)
- Lesson: Canvas API is enough for basic image optimization, no need for Pillow/ImageMagick
- Lesson: Marketplace image specs vary (Tokopedia 1000x1000 recommended, others 800x800)
- Lesson: Auto-crop to 1:1 from center works well for product photos
- Next: Add watermark support, add batch upload, add background removal

---

## 2026-08-05 - Price Optimizer
- Works: Go 1.26 single binary, zero external dependencies
- Works: 8 Indonesian product categories with price benchmarks
- Works: 5 price suggestions: minimum, competitive, optimal, premium, high
- Works: Competitor simulation with price, rating, sold count
- Works: Marketplace-specific fee calculation (6 marketplaces)
- Works: Price psychology insights (X999, goceng pricing)
- Works: Light minimal theme, responsive design, dark mode toggle
- Works: All API endpoints tested (categories, marketplaces, analyze, history)
- Issues: Price suggestions had duplicates when snapping to price points
- Fix: Added deduplication logic with seen map, spread test prices more evenly
- Lesson: When generating multiple price points, ensure they're distinct after snapping to benchmarks
- Lesson: Go's single binary deployment is perfect for self-contained tools
- Next: Add price trend tracking, add CSV import for bulk analysis

---

## 2026-08-04 - Listing Consistency Checker
- Works: Node.js + Express, JSON file storage, single HTML frontend
- Works: 6 marketplace support (Tokopedia, Shopee, Lazada, Bukalapak, Blibli, TikTok Shop)
- Works: Consistency score per product (0-100%) based on price/stock/title match
- Works: Visual diff table with red highlighting for mismatches
- Works: Price outlier detection (which marketplace has the odd price)
- Works: Seed data with 3 products across multiple marketplaces
- Works: Light minimal theme, responsive, dark mode toggle
- Works: All API endpoints tested (CRUD, check, products, seed)
- Issues: No batch import from CSV yet
- Lesson: Consistency checking is a real pain point for multi-marketplace sellers
- Lesson: Outlier detection (which marketplace differs from the rest) is more actionable than just "mismatch"
- Next: Add CSV import, add description similarity check, add price difference percentage

## 2026-08-12 - Komplain Tracker
- Works: Go 1.26 single binary, zero external dependencies
- Works: Complaint lifecycle tracking (baru -> ditanggapi -> diproses -> selesai/batal)
- Works: SLA monitoring with 24h response and 72h resolution targets
- Works: Overdue detection at two levels (response vs resolution)
- Works: Follow-up notes per complaint
- Works: Filters by status, marketplace, complaint type
- Works: Dashboard stats with avg resolution time
- Works: CSV export
- Works: Auto-fill example data, light minimal theme, responsive
- Issues: Complaint types are hardcoded, no customization
- Lesson: SLA-based tools need two thresholds (response + resolution), not one
- Lesson: Go http.ServeMux with {id} path params (Go 1.22+) simplifies REST routing
- Next: Add Telegram notification when complaint is overdue, add editable complaint types

## 2026-08-13 - Stock Sync Checker (Chrome Extension)
- Works: Chrome MV3 extension, zero external dependencies
- Works: Product page detection for 5 marketplaces (Shopee, Tokopedia, Lazada, Bukalapak, Blibli)
- Works: Stock extraction from page text with polling for lazy-load (Tokopedia)
- Works: Fuzzy name matching (token overlap) tolerates per-marketplace title variations
- Works: Badge overlay with color status: green ok, red oversell, orange undersell, gray untracked
- Works: Popup with master stock list, stats, CSV import/export, example data
- Works: 31/31 Node unit tests pass on shared logic
- Issues: DOM selectors per marketplace need real browser test, page structure changes over time
- Issues: bodyText-based stock extraction can miss stock info if page renders it in an iframe
- Lesson: MV3 popup CSP blocks inline scripts, use addEventListener not onclick
- Lesson: activeTab + scripting permission needed to inject content script into already-open tabs
- Lesson: Pure logic in shared.js (no chrome.* API) makes unit testing possible in Node
- Lesson: Extensions are the right format for page-interaction tools, user already logged in, no bot detection
- Next: Add stock update shortcuts, auto-detect seller center pages, Telegram alert on oversell

## 2026-08-14 - Harbolnas Promo Calendar
- Works: Python stdlib http.server, zero dependencies
- Works: Web UI (not CLI) - sellers can see upcoming promo events directly
- Works: 6 event categories: Harbolnas, Payday, Ramadan, Lebaran, Imlek, Tahun Baru
- Works: Live countdown to next event (days, weeks, prep start date)
- Works: Per-event prep checklists (stock, vouchers, ads, CS) with prep lead days
- Works: Payday sale events auto-generated monthly from current date
- Works: Estimated religious dates flagged in UI (Ramadan, Lebaran, Imlek)
- Works: Filters by category and marketplace, light minimal theme, responsive
- Issues: Harbolnas dates for 2027 are fixed data, not scraped from marketplace announcements
- Lesson: Promo calendar is a real gap - sellers miss Harbolnas deadlines because nothing reminds them
- Lesson: Estimating religious dates and flagging them as estimates beats hardcoding wrong dates
- Lesson: Countdown tools need a hero section with the NEXT event, not just a flat list
- Next: Add Telegram reminder before event, link to official marketplace promo pages

