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


## 2026-08-15 - PPh 22 Tax Calculator
- Works: Go 1.26 single binary, zero external dependencies
- Works: Policy status API that derives phase from current date (belum/aktif/ditunda/refund/berlaku kembali)
- Works: 3-tier seller status logic: wajib dipungut (omzet > Rp500jt), dikecualikan (di bawah + surat pernyataan), berisiko dipungut (di bawah tapi belum kirim surat pernyataan)
- Works: PPN-aware DPP calculation (omzet / 1.11 when PPN included)
- Works: Per-transaction simulation, checklist pengecualian, light minimal theme, responsive
- Issues: Exempt status still showed computed withholding initially - fixed by zeroing withheld amounts on exempt
- Lesson: Research-first paid off - real news (PMK 37/2025, postponed Aug 6, refund Aug 14-Sep 30, restart Nov 1) beats guessing what sellers need
- Lesson: Tax tools need a date-aware policy layer, not just a calculator - rules change over time, status banner handles it
- Lesson: DPP (dasar pengenaan pajak) must exclude PPN when omzet includes it, otherwise over-withholding by 11%
- Next: Add NPWP/NIK requirement check, multi-month omzet input, export per-marketplace summary

## 2026-08-16 - UMKM Service Fee Discount Checker
- Works: Node.js + Express web tool, zero custom deps beyond express
- Works: Research-first via Google News RSS (DuckDuckGo hit captcha, Bing returned JS-only page) - found real policy: Permen UMKM 2026 (PP 7/2021 derivative) mandates 50% service fee discount for micro/small sellers of local products, Kepmen signed week of Aug 12-13 2026
- Works: 5-point eligibility quiz (scale, NIB, BPJS, SAPA UMKM, local products) with per-requirement breakdown
- Works: Savings simulation per marketplace with editable default rates, monthly + annual totals
- Works: Policy status API (date-aware), light minimal theme, responsive, auto-fill example
- Issues: Google News RSS link decoding (batchexecute API) returned 400 - used headline-level facts + stabilitas.id article instead
- Lesson: When DuckDuckGo and Bing block scraping, Google News RSS is a reliable fallback for fresh Indonesian policy news
- Lesson: New regulation + deadline = immediate seller confusion = high-value tool. Same pattern as PPh 22 (#22)
- Lesson: Eligibility checkers need per-requirement breakdown (what passed, what failed), not just a yes/no verdict
- Next: Add Telegram reminder when Kepmen details change, add per-marketplace fee rate lookup

## 2026-08-17 - NIB Deadline Checker
- Works: Python stdlib http.server, zero dependencies
- Works: Research-first via Google News RSS + detikFinance articles - found Permendag 19/2026 (PMSE, berlaku 8 Juni 2026) mewajibkan NIB untuk semua pedagang e-commerce, marketplace wajib tolak/blokir tanpa NIB
- Works: Deadline logic: 18 bulan dari tanggal aturan berlaku (8 Des 2027) untuk seller existing, 6 bulan dari mulai jualan untuk seller baru
- Works: Date-aware status banner, countdown sisa hari, status risiko (Aman/Segera/Kritis/Mendesak/Terlewat), progress bar
- Works: Checklist dokumen, langkah buat NIB via OSS, klarifikasi NIB vs pajak, 5 manfaat, FAQ
- Works: Light minimal theme, responsive, auto-fill example date
- Issues: Lead GMV Max Shopee (berita Mei 2026) minim detail publik - pivot ke NIB yang lebih fresh dan berdampak
- Lesson: Pola yang sama seperti #22 (PPh 22) dan #23 (diskon biaya layanan) terulang: aturan baru + tenggat + kebingungan seller = tool bernilai tinggi
- Lesson: Kebingungan NIB vs pajak nyata - Mendag sampai klarifikasi publik. Tool harus aktif meluruskan mispersepsi, bukan cuma menghitung
- Lesson: Deadline seller existing (18 bulan sejak aturan berlaku) vs seller baru (6 bulan sejak mulai jualan) - kategori berbeda, deadline berbeda
- Next: Tambah pengingat Telegram sebelum deadline, link langsung ke OSS

## 2026-08-18 - PPh 22 Refund Tracker
- Works: Go 1.26 single binary, zero external dependencies
- Works: Research-first via Google News RSS - menemukan episode terbaru PPh 22: pungut mulai 1 Agu, protes massal (potongan tembus 30%), ditunda 6 Agu, refund otomatis 14 Agu - 30 Sep, berlaku lagi 1 Nov (bisa berubah, idEA usul Januari 2027)
- Works: Fakta terverifikasi dari pernyataan resmi platform via detikFinance 10 Agu (d-8611328, d-8610997): Shopee refund bertahap 14 Agu-30 Sep, Tokopedia maks 30 Sep otomatis, Blibli menunggu ketentuan DJP, Lazada belum ada jadwal
- Works: Status banner date-aware dengan progress bar jendela refund (14 Agu -> 30 Sep), estimasi dana refund (omzet 1-5 Agu x 0,5%), status omzet atas/bawah Rp 500jt, kronologi, FAQ, sumber
- Issues: parseDate() pakai time.Parse (UTC) sedangkan todayOnly pakai time.Local (WIB) - selisih 7 jam bikin off-by-one di perhitungan hari
- Fix: ganti ke time.ParseInLocation("2006-01-02", s, time.Local) - refund_pct jadi benar (8,5% bukan 6,4% di 18 Agu)
- Lesson: Go time.Parse return UTC, kalau dibandingkan dengan waktu lokal harus ParseInLocation, kalau tidak perhitungan hari meleset 1 hari
- Lesson: Episode PPh 22 berkembang terus (mulai -> protes -> tunda -> refund -> berlaku lagi) - tool wajib date-aware dan pantau berita terbaru, jangan hardcode status
- Next: Pantau keputusan perpanjangan penundaan (Menkeu buka opsi, idEA usul Januari 2027), update phase restart kalau berubah

## 2026-08-20 - Omzet Gabungan Tracker
- Works: Node.js + Express web tool, zero deps beyond express
- Works: Research-first via Google News RSS - found DJP accumulates omzet across ALL marketplaces + offline for the Rp 500jt threshold (Kompas/MetroTVNews 24-25 Jun 2026, Ortax 29 Jul 2026), and Menkeu's Aug 19 signal that PPh 22 restart could slip to 2027 if economy misses 6% growth
- Works: 7-channel input grid (6 marketplaces + offline), 12-month omzet per channel, quick-fill per channel
- Works: YTD, projected annual, avg monthly, status risk (aman/waspada/mendekati/terlewat), crossing month, PPh 22 0.5% estimate, per-marketplace share bars, monthly total chart
- Works: Date-aware policy banner (refund phase active, restart 1 Nov 2026 or 2027), light minimal theme, responsive, auto-fill example, all element IDs verified
- Works: Updated #25 (PPh 22 refund tracker) restart timeline after Menkeu's 2027 signal - the Aug 19 news made its "restart Nov 1" language stale
- Lesson: The PPh 22 saga keeps evolving (start -> protest -> postpone -> refund -> restart uncertainty). Both #22, #25 and #26 must stay date-aware; #25 needed a same-day fix when the story moved
- Lesson: DJP accumulating omzet across platforms is a blind spot for multi-platform sellers - they check omzet per marketplace, not combined. Tool directly answers "apakah total saya lewat Rp 500jt"
- Lesson: Google News RSS remains reliable for fresh Indonesian policy news; headline-level facts from multiple outlets beat deep-linking single articles
- Next: Add per-marketplace threshold projection, CSV import from seller center exports, Telegram reminder when restart date changes

## 2026-08-21 - TikTok Shop Komisi Kalkulator
- Works: Python stdlib http.server, zero dependencies
- Works: Research-first via Google News RSS + DuckDuckGo HTML fallback (Bing RSS returned empty links) - found the full TikTok Shop dynamic commission table old vs new (30 categories, effective 18 May 2026) from associe.co.id and teknologi.bisnis.com
- Works: Cap logic per item (Rp40rb lama vs Rp650rb baru) - verified against article examples: fashion Rp1jt = Rp40rb (old cap hit) vs Rp80rb, laptop Rp20jt = Rp800rb capped to Rp650rb
- Works: Reco price math with cap transition (base_no_cap check first, capped formula fallback) - verified profit equality: old profit 9.960.000 = new profit at reco price 20.610.000
- Works: Shopee 2026 admin fee comparison (6 groups from metrotvnews), return fee info (Rp10rb per return, 1 June 2026), light minimal theme, responsive, auto-fill, all 40 element IDs verified matching
- Issues: Bing News RSS returned only self-links (no article URLs), Google News redirect URLs are JS-rendered - DuckDuckGo HTML search (html.duckduckgo.com) was the working path to article URLs
- Lesson: When news RSS gives headlines but no usable links, html.duckduckgo.com with the exact headline quote finds the article URL reliably
- Lesson: Policy tools need the FULL rate table, not just the headline number - the 16x/15x "cap melesat" headline is meaningless without per-category old/new rates
- Lesson: Cap-aware commission math must check the no-cap case first then fall back to the capped formula, else reco price is wrong by the cap delta
- Next: Add PPN (11%) to the calculation, add Tokopedia commission comparison, watch for Menteri UMKM enforcement outcome (may freeze rates again)

## 2026-08-22 - Toco Migration Calculator
- Works: Node.js + Express web tool, single dep (express)
- Works: Research-first via Google News RSS - found Toco (marketplace baru, komisi seller 0%, didirikan Arnold Sebastian Egg pendiri Tokobagus) ramai dilirik seller di tengah kenaikan fee Shopee (grup A-X hingga 10%) dan TikTok Shop (18 Mei 2026). Katadata 20 Jun 2025 + ANTARA 4 Mar 2026 + Dataloka 19 Jun 2026 (IDMC) jadi sumber utama
- Works: 7 marketplace comparison (Toco, Shopee, TikTok, Tokopedia, Lazada, Bukalapak, Blibli) dengan profit per item dan per bulan, sorted
- Works: Traffic reality check - slider volume Toco vs marketplace sekarang, karena Toco 0% komisi tapi traffic kecil. Ini insight paling jujur: 0% fee tidak berarti kalau volume cuma 10%
- Works: Break-even unit di Toco agar profit bulanan sama dengan marketplace sekarang (78 unit = 78% volume di contoh fashion)
- Works: Light minimal theme, responsive, auto-fill example, error handling (harga <= 0, kategori invalid)
- Issues: Fee Tokopedia/Lazada/Bukalapak/Blibli dipakai dari project #06 (estimasi 2026), bukan sumber berita fresh
- Issues: Toco buyer fee Rp2.000/transaksi masih digratiskan masa awal - kalau mulai dikenakan, seller harus naikkan harga atau tanggung sendiri
- Lesson: Pola "marketplace baru dengan fee rendah" adalah cerita berulang (Toco sekarang, TikTok Shop dulu). Tool perbandingan migrasi = nilai tinggi buat seller yang bingung pindah atau bertahan
- Lesson: 0% komisi bukan jawaban otomatis - traffic reality check adalah pembeda tool ini vs tabel fee statis
- Lesson: Google News RSS + katadata/ANTARA langsung bisa di-fetch tanpa JS redirect (beda dari detik/bisnis yang kadang anti-bot)
- Next: Tambah input ongkir per item, tambah Toco buyer fee Rp2.000 sebagai toggle, update tarif saat Toco umumkan biaya baru

## 2026-08-23 - UMKM Service Fee Checker (fix)
- Issues: #23 mengklaim Kepmen diskon 50% biaya layanan sudah diteken 12-13 Agu 2026 dan berlaku Agustus. Fakta terbaru (ANTARA, detikFinance, Tirto, 21-22 Agu): Kepmen BELUM diteken, Menteri UMKM targetkan diteken pekan 24-28 Agu, berlaku akhir Agustus. Banner tool salah = seller salah informasi.
- Fix: POLICY dijadikan date-aware (menunggu -> diteken -> active) dengan tanggal target, deskripsi menyebut "jadwal target, bisa berubah". Pakai tanggal lokal (getFullYear/getMonth/getDate), bukan toISOString (UTC bisa beda 1 hari dengan WIB - pola yang sama dengan lesson #25 ParseInLocation).
- Lesson: Tool kebijakan yang dibangun dari berita WAJIB di-recheck tanggalnya saat berita baru keluar. Berita "Kepmen diteken" versi 16 Agu ternyata premature - cek ulang sebelum claim.
- Next: Update lagi saat Kepmen benar-benar diteken dan tarif resmi keluar.

## 2026-08-23 - Dana Tertahan Tracker
- Works: Node.js + Express web tool, single dep (express), JSON file storage
- Works: Research-first via Google News RSS when:3d - ketemu kasus saldo tertahan yang masih berjalan: 500 akun TikTok Shop beku Rp 3 triliun (CNBC 9 Jul), Komisi VII DPR panggil platform (ANTARA 2 Jul), dan update terbaru 21 Agu: penangguhan berakhir tapi saldo Tokopedia/TikTok belum bisa dicairkan (detikNews)
- Works: Case tracker (platform, jumlah, sejak, alasan, status, catatan) dengan summary total dana, kasus terbuka, kasus tertua (hanya dari kasus yang belum cair)
- Works: Kronologi saga date-aware (status banner: sebelum -> berlangsung -> pasca penangguhan), 5 alasan penahanan, checklist eskalasi 5 langkah (CS -> Kemenkop UKM -> Komisi VII DPR -> bantuan hukum)
- Works: Auto-fill contoh (form + seed data), export CSV, light minimal theme, responsive, semua element ID verified
- Issues: Kasus "saldo ditahan" tidak punya tanggal rilis pasti - tool ini tracking + edukasi, bukan prediksi tanggal cair
- Lesson: Story platform vs seller (dana tertahan, fee naik) = pain point nyata yang berulang. Rp 3 triliun nyangkut = masalah yang lebih besar dari sekadar fee, dan belum ada tool yang bantu seller melacaknya
- Lesson: Kasus "cair" harus dikeluarkan dari statistik terbuka - summary open_cases terpisah dari total, kasus tertua dihitung dari kasus yang belum cair (jangan sampai UI kontradiktif)
- Lesson: kill node server di Windows via git-bash: taskkill //F gagal (MSYS path mangling), pakai powershell Stop-Process -Id
- Next: Tambah pengingat Telegram saat ada kabar baru soal pencairan, tambah import CSV

## 2026-08-24 - Hak Tolak Seller
- Works: Go 1.26 single binary, zero external dependencies
- Works: Research-first via Google News RSS - found Permendag 19/2026 (revisi Permendag 31/2023 PMSE, diumumkan Mendag Budi Santoso 8 Juni 2026) mewajibkan marketplace memperoleh persetujuan penjual SEBELUM memberlakukan perubahan biaya, komisi, atau mekanisme layanan. Full article verified from nusantaranews.co (bukan cuma headline)
- Works: Cek hak tolak date-aware (bandingkan tanggal berlaku vs 8 Juni 2026) dengan 5 verdict: berhak tolak, sebelum aturan, sudah disetujui, di luar cakupan, data kurang
- Works: Surat keberatan generator dengan 2 varian (belum/sudah dimintai persetujuan), otomatis tersimpan ke lacak kasus
- Works: Lacak kasus dengan status lifecycle (draft -> dikirim -> ditanggapi -> eskalasi -> selesai), seed contoh 3 kasus nyata (TikTok logistik 1 Mei, TikTok komisi 18 Mei, contoh Shopee pasca-aturan), export CSV
- Works: Semua API verified via curl (policy, meta, check x5 cabang, letter, CRUD, seed, export), semua 50 element ID cocok dengan HTML, light theme + responsive + dark toggle
- Issues: Go time.Format("2 Januari 2006") salah - "Januari" bukan token format Go (hanya "January"), hasilnya "24 Januari 2026" padahal Agustus. Bulan harus diambil manual dari array nama bulan Indonesia
- Fix: formatIDDate() dengan array idMonths, dan tambah spasi sebelum "yang diumumkan" di template surat (detail + announceLine nyambung tanpa spasi)
- Lesson: JANGAN pernah campur teks bahasa asing ke layout string Go time.Format - token bulan cuma "January", sisanya literal. Kalau butuh nama bulan lokal, petakan manual
- Lesson: Pola "aturan baru + seller bingung" berlanjut (#22 PPh 22, #23 diskon layanan, #24 NIB, #30 hak tolak) - kali ini aturannya justru MEMBERI hak ke seller, bukan membebani. Tool yang mengubah hak legal jadi tindakan (surat) lebih actionable daripada sekadar info
- Next: Tambah template surat per jenis perubahan, update saat ada putusan baru soal penerapan Permendag 19/2026

## 2026-08-25 - Biaya Retur Tracker
- Works: Python 3 stdlib http.server, zero dependencies, JSON file storage
- Works: Research-first via Google News RSS - TikTok Shop 2026 bebankan biaya pengiriman gagal + retur ke seller (Bisnis Tekno 31 Mei 2026), Menteri UMKM geram (detikFinance 21 Mei 2026), kasus retur kosong (Media Konsumen 4 Mar 2026) dan retur dijual lagi (BeritaSatu 15 Mei 2026) jadi pain point nyata tanpa tool
- Works: Kalkulator kerugian retur itemized (modal hangus/turun nilai, ongkir kirim, ongkir retur, kemasan), profit per penjualan normal, "1 retur = N penjualan harus ditutup" dengan severity (terkendali/signifikan/kritis)
- Works: 4 branch kalkulator verified via curl (resellable, hangus total, buyer tanggung ongkir retur, invalid input, penjualan sudah rugi), CRUD kasus + seed + validation + CSV export verified
- Works: Light minimal theme, responsive, auto-fill contoh, 41/41 element ID cocok, JS syntax OK, tanpa em dash
- Issues: Artikel sumber (Bisnis Tekno "Beda Kebijakan Shopee dan TikTok Shop") tidak bisa di-fetch langsung - Google News redirect 400, DuckDuckGo HTML kena challenge 202, Bing return tanpa link. Pakai fakta level headline dari banyak outlet
- Fix: Grounding cukup dari headline multi-outlet; kebijakan retur per marketplace ditandai "estimasi, cek seller center" di UI
- Lesson: Biaya retur adalah biaya tersembunyi yang tidak pernah dihitung seller - 1 retur bisa hapus profit 4-8 penjualan untuk margin tipis. Kalkulator yang menampilkan "N penjualan untuk nutup 1 retur" lebih actionable daripada sekadar total rupiah
- Lesson: Seller kalah banding retur karena tidak punya bukti - checklist bukti (video unboxing, foto timbangan, screenshot chat) dan red flag retur bodong jadi bagian penting tool, bukan pelengkap
- Lesson: Sebelumnya fix #30 ketemu server lama masih pegang port dan serve binary lama - selalu cek netstat + StartTime process sebelum restart
- Next: Tambah estimasi fee marketplace yang tidak dikembalikan saat refund, notifikasi Telegram saat kasus retur melewati tenggat banding

## 2026-08-26 - FMCG Trend Analyzer
- Works: Node.js + Express web tool, single dep (express)
- Works: Research-first via Google News RSS - found Compas.co.id FMCG E-commerce Market Insight S1 2026 report (Rp 88,4 triliun H1 2026, +29,4% YoY, Shopee + TikTok ShopTokopedia 99% di semua kategori). Full data extracted from youngster.id article (26 Agu), cross-checked with Gizmologi (25 Agu) and Katadata headlines
- Works: 5 kategori dengan growth nilai + volume (Homecare 78,3%/42%, F&B 52,1%/33%, Healthcare 24,4%/20%, Beauty 20,8%/12,8%, Mom and Baby 18,7%/3,6%), sortable table dengan bar visual
- Works: Detail kategori per platform (Shopee 69% Homecare naik 8 poin, Official Store TikTok agresif di 4 kategori lain), top movers (Mineral Water +219%, Insektisida +162%), seasonality Ramadan/Lebaran
- Works: Kalkulator keep-pace (POST /api/keep-pace): target 12 bulan agar pangsa tidak menyusut = penjualan * (1 + growth pasar). Verified math: homecare 15jt -> target 26.745.000, verdict bawah/sejalan/atas dengan ambang +-10 poin
- Works: Light minimal theme, responsive, auto-fill contoh, Enter hitung / Escape bersihkan, 21/21 element ID cocok, inline JS syntax OK, tanpa em dash
- Issues: Nilai rupiah per kategori tidak dipublikasikan Compas - tool hanya punya growth % dan total Rp 88,4T. Kalkulator keep-pace adalah estimasi matematis, ditandai di UI (caveat)
- Issues: Kasus baru saldo Shopee Rp 6,3 M tertahan + akun terkunci (Bloomberg Technoz, Peradaban.id) = kelanjutan saga #29, tapi #29 tidak di-update hari ini (fokus #32, dicatat sebagai Next)
- Lesson: Data pasar (market report) adalah pain point yang belum tersentuh 31 proyek sebelumnya - semua tool fokus biaya/aturan/retur, belum ada yang jawab "kategori apa yang tumbuh dan di platform mana". Seller butuh data untuk keputusan kategori, bukan cuma kalkulator
- Lesson: Google News RSS -> youngster.id full article bisa di-fetch langsung (beda dari detik/bisnis yang anti-bot). Satu artikel detail > 5 headline
- Lesson: Keep-pace framing lebih actionable daripada sekadar growth %: "pasar tumbuh 78%, kamu cuma 20%, pangsa menyusut" - seller merasa kalah kalau cuma lihat angka penjualan naik
- Next: Update #29 dengan kasus Shopee Rp 6,3 M (akun terkunci) + reaksi Kemendag soal transparansi biaya. Tambah sumber data Compas per kuartal saat rilis S2 2026

---

## 2026-08-27 - Kanal Sendiri vs Marketplace
- Works: Go 1.26 single binary, zero external dependencies, embed HTML
- Works: Research-first via Google News RSS - found the exodus trend arc: The Conversation (4 Agu) "brand ramai-ramai keluar dari marketplace, apakah jualan di kanal sendiri bisa lebih untung?" + Katadata (20 Mei) "seller terimpit biaya berlapis" + kontan (9 Mei) "seller cari kanal alternatif" + UKMINDONESIA (22 Mei) "cara UMKM jualan mandiri". Pertanyaan yang belum dijawab tool mana pun dengan angka
- Works: Kalkulator membandingkan profit marketplace vs kanal sendiri: komisi + biaya layanan + iklan + ongkir vs fee gateway (pola Midtrans/Xendit 2,9% + Rp 2.000) + iklan + ongkir, dengan asumsi % pembeli yang pindah
- Works: Break-even unit di kanal sendiri agar profit menyamai marketplace (verified: 150rb/85rb/120 unit Shopee 5%+2% -> mp profit 5,08jt, own 747rb, break-even 123 unit = 103% volume, verdict marketplace)
- Works: 4 cabang verdict verified via curl: marketplace menang, kanal sendiri menang, marketplace rugi tapi kanal sendiri untung, keduanya rugi (verdict ketiga ditemukan lewat test, bukan direncanakan)
- Works: Update #29 (Next dari LESSONS #32): kasus Shopee Rp 6,3 M (Adi Pekalongan, akun terkunci Juni 2026) + respons resmi Shopee 26 Agu + reason baru 'akun-terkunci' + seed case + status updated 27 Agu, semua API verified
- Issues: Verdict logic awalnya salah untuk kasus keduanya rugi - own (-376rb) > mp (-2,1jt) tapi dua-duanya rugi, verdict 'kanal-sendiri' menyesatkan
- Fix: Branch baru 'keduanya-rugi' dengan pesan "masalahnya bukan pilihan kanal, tapi margin produk" - verified via curl
- Issues: Server lama masih pegang port 8029 dan serve code lama (updated masih 23 Agu) - pola yang sama dengan lesson #31
- Fix: netstat cek PID 21824, powershell Stop-Process, restart bersih
- Lesson: Pola "biaya berlapis marketplace" sudah jadi cerita besar (eksodus seller, Toco, TikTok komisi) - tool yang menjawab "pindah atau bertahan?" dengan angka lebih actionable daripada sekadar tabel fee
- Lesson: Kanal sendiri bukan otomatis lebih murah - fee gateway 2,9% + Rp 2.000 + iklan + ongkir penuh bisa lebih mahal dari komisi marketplace kalau volume kecil. Break-even unit adalah angka yang paling jujur
- Lesson: Verdict logic harus punya branch "keduanya rugi" - kalau dua kanal negatif, jangan pilih yang "kurang rugi" sebagai pemenang, itu menyesatkan seller
- Next: Tambah perbandingan ongkir subsidized (gratis ongkir marketplace vs bayar penuh), tambah mode multi-produk, update #29 saat ada perkembangan kasus Shopee

## 2026-08-28 - Cek Insentif Permen UMKM 3/2026
- Works: Research-first via Google News RSS + ANTARA search - found teks lengkap Permen UMKM 3/2026 (ANTARA 22 Juni 2026, fetched penuh): marketplace WAJIB potongan biaya layanan paling sedikit 50% untuk UMK yang hanya menjual produk dalam negeri. Biaya layanan = administrasi + komisi + jasa aplikasi, kisaran 10-18%. Syarat: UMK terverifikasi, HANYA produk dalam negeri, NIB, info usaha benar, standar mutu, terdaftar SAPA UMKM. Pengecualian eksplisit: pangan olahan siap saji + elektronik industri besar
- Works: Timeline implementasi (ANTARA 8 Juli 2026): Permen kasih platform maksimal 6 bulan, target 1 Agustus geser ke akhir Agustus 2026, 4 marketplace siap. #23 (dibuat saat aturan masih wacana) tidak punya aturan pengecualian, alur SAPA UMKM, dan mekanisme keberatan - tool ini pakai teks regulasi final
- Works: 10 branch API verified via curl (layak, 2 pengecualian, skala menengah, produk impor, hampir-layak, invalid skala, surat ditolak, surat dihentikan, surat invalid), math verified (50jt @12% + 25jt @8% = 8jt fee -> 4jt setelah diskon, hemat 48jt/tahun), 27/27 element ID cocok, JS syntax OK, light theme + responsive + tanpa em dash, path traversal blocked
- Issues: ANTARA search + article fetch rate-limit parah kalau dipanggil berurutan (size 0), perlu sleep 3-5 detik antar request
- Issues: #23 punya syarat BPJS yang TIDAK ada di teks Permen 3/2026 (ANTARA) - kuis #23 kurang akurat, dicatat supaya tidak ikut dipakai
- Fix: Fetch artikel ANTARA satu per satu dengan jeda; grounding hanya dari teks regulasi yang berhasil di-fetch
- Lesson: Saat aturan sudah final, tool lama yang dibangun dari wacana bisa salah syarat. Verifikasi ulang tool regulasi lama saat regulasi final terbit
- Lesson: Pengecualian kategori (pangan olahan siap saji, elektronik industri besar) adalah nilai tool yang tidak terlihat di headline - seller produk kategori ini bakal kaget kalau tidak dicek
- Lesson: Surat keberatan generator (pola #30) bekerja bagus untuk hak baru seller - mekanisme klarifikasi/keberatan di Permen 3/2026 adalah fitur yang membuat tool actionable, bukan sekadar info
- Next: Update #23 dengan syarat final Permen 3/2026 (hapus BPJS, tambah pengecualian), pantau konfirmasi tanggal efektif dari masing-masing platform

## 2026-08-29 - Insentif Checker Update + Fee Checker Fix
- Works: Fresh research via Google News RSS + DuckDuckGo HTML found ANTARA 28-29 Agu (Jumat-Sabtu) dengan alur pengajuan RESMI insentif 50%: pengajuan via SAPA UMKM (nama platform, identitas merchant, data produk), verifikasi 2 tahap (KemenUMKM cek administratif, lalu platform cek skala UMK + produk dalam negeri + bukan high risk user), standar produk (halal, BPOM) punya grace period 6 bulan, platform wajib lapor realisasi insentif bulanan ke SAPA UMKM. Status per 29 Agu: Kepmen BELUM diteken, target tahapan final pekan depan.
- Works: #34 di-update: POLICY status progres-95 -> tahapan-final, syarat baru bukan_high_risk (hard-fail branch), detail standar_mutu + grace period, alur pengajuan 6 langkah 2 tahap verifikasi, semua 5 branch API verified via curl (layak, high-risk, pengecualian, hampir-layak, invalid)
- Works: #23 di-fix sesuai Next dari LESSONS #34: hapus syarat BPJS (tidak ada di teks final Permen 3/2026, konfirmasi dari artikel ANTARA 28-29 Agu yang menyebut halal/BPOM tapi tidak menyebut BPJS), tambah 2 pengecualian kategori (pangan siap saji, elektronik industri besar), fix POLICY date bug (sebelumnya klaim "Kepmen diteken" padahal ANTARA 28-29 Agu bilang belum, signedTarget 24 Agu -> 4 Sep, effective 31 Agu -> 30 Sep)
- Issues: Server #34 lama masih pegang port 8034 dan serve kode lama (2 PID listen sekaligus) - pola yang sama dengan lesson #31/#33. Fix: powershell Stop-Process untuk kedua PID, restart bersih.
- Issues: #23 server lama (PID 22288, start 23 Agu) masih serve kode lama dengan BPJS - harus Stop-Process dulu sebelum restart.
- Lesson: Aturan yang sama bisa punya 2 versi tool yang saling kontradiktif (#23 BPJS vs #34 tanpa BPJS). Saat berita final keluar, tool lama WAJIB di-recheck dan di-update, bukan cuma tool baru. User salah informasi kalau buka tool lama.
- Lesson: Headline "Kepmen segera diteken" (21-22 Agu) vs fakta 28-29 Agu "belum diteken, target tahapan final pekan depan" - status tool harus dari tanggal terbaru, jangan terkunci di headline lama.
- Next: Update #34 dan #23 saat Kepmen benar-benar diteken + tanggal efektif per platform resmi. Pantau SAPA UMKM untuk detail teknis pengajuan.

## 2026-08-30 - Program Diskon Checker
- Works: Node.js + Express web tool, single dep (express)
- Works: Research-first via Google News RSS - found UKMINDONESIA.ID article "Seller UMKM Tiba-Tiba Rugi Padahal Pesanan Ramai" (4 Juni 2026, recirculated 30 Agu): program diskon marketplace aktif tanpa disadari seller via soft enrollment. 3 jenis program paling sering tidak disadari: flash sale/kampanye (klik link undangan tanpa baca syarat = produk langsung terdaftar harga terpotong), gratis ongkir (biaya layanan program ditanggung seller), voucher toko auto-aktif dari level akun
- Works: Kalkulator margin 2 skenario (tanpa program vs dengan program), program bisa stack (flash + voucher multiplicative, gratis ongkir nambah fee rate), verdict aman/tipis/rugi
- Works: Pricing buffer formula verified against article: HPP 40rb + target margin 20% + diskon 20% + fee 0 = 62.500 (persis angka artikel). Dengan fee 12% = 73.529. Formula: buffer = HPP / ((1 - fee - target) * (1 - totalDiscount))
- Works: "1 penjualan program = N penjualan normal" saat program rugi (contoh: flash sale 20% di harga 50rb = 1 program sale butuh 2 normal sale nutup rugi)
- Works: Audit checklist 7 item seller center (tab Promosi/Kampanye/Voucher Toko, email folder Promosi/Spam, keluar kampanye belum mulai, dokumentasi CS), light minimal theme, responsive, auto-fill contoh, 26/26 element ID cocok, JS syntax OK, tanpa em dash
- Issues: Em dash grep kena node_modules (encoding table) - harus exclude node_modules dari cek
- Lesson: Soft enrollment adalah mekanisme program diskon yang jarang dibahas - seller dianggap setuju kalau tidak menolak dalam periode tertentu. Tool yang jawab "harga aman berapa kalau kena program" = nilai tinggi karena seller rugi tanpa sadar
- Lesson: Pricing buffer (harga jual yang dipasang agar margin target tercapai setelah diskon) lebih actionable dari sekadar "jangan ikut program" - seller yang sudah terlanjur terdaftar butuh angka, bukan nasihat
- Lesson: Discount stacking harus multiplicative (flash 20% + voucher 10% = 28% total), bukan additive (30%) - selisih 2% cukup signifikan di margin tipis
- Next: Tambah mode multi-produk (CSV upload), tambah simulasi program "harga sudah terlanjur terpotong" (harga setelah diskon vs HPP langsung), link ke halaman keluar program per marketplace

## 2026-10-19 - Biaya Total Marketplace (revival #36)
- Works: Audit ulang 35 tool lama (REVIVAL_AUDIT.md), lalu pilih bikin tool baru #36 daripada menyentuh tool lama yang lain
- Works: Node.js + Express, kalkulator all-in cost: komponen persen (komisi, gratis ongkir, iklan, afiliasi) + komponen Rp (proses per transaksi, logistik/kemasan/retur per unit), verdict sehat/tipis/rugi, warning total biaya >= 30%, target harga jual minimum
- Works: Default rate diground dari laporan 2026 (Katadata, Bisnis, CNN, Validnews, MarketplaceTactics) dan tetap bisa diedit seller; contoh kuitansi nyata ~24% dipakai sebagai preset
- Works: 13 unit test (node assert) lulus, termasuk uji target price menghasilkan margin target dan biaya proses tidak dikali qty
- Fix: P0 di #06 dropship calculator (profit belum kurangi ongkir seller) + tambah 9 test, commit terpisah 84e0acf
- Issues: Go toolchain tidak terpasang di environment, 10 tool Go hanya bisa diaudit statis, tidak bisa build/test
- Lesson: Bedakan biaya "per transaksi" (biaya proses Rp 1.250, tidak dikali qty) vs "per unit" (logistik, kemasan, retur) - salah klasifikasi bisa bikin perhitungan margin ngawur saat qty > 1
- Lesson: Semua persen biaya dihitung dari harga jual (bukan HPP), konsisten dengan cara marketplace memotong dan dengan tool #35
- Lesson: Target price harus dibatasi: kalau total persen biaya + target margin >= 100%, tidak ada harga jual yang bisa memenuhi target - tool harus bilang "tidak tercapai", bukan keluarkan angka negatif/nonsense
- Next: Tambah mode batch (CSV banyak produk), integrasi tarif aktual per kategori kalau ada, bandingkan hasil dengan kuitansi seller nyata untuk validasi rate default

## 2026-10-19 - Design Contract (DESIGN.md) + Pilot #36
- Works: Ekstraksi design DNA dari bencho.dev (CSS bundle 504KB) jadi DESIGN.md di repo root: token light/dark, font Google Sans + Inter, skala tipografi, radius 28/20/12/999, aturan "kedalaman dari alpha bukan border", easing entrance/hover, focus ring, prefers-reduced-motion
- Works: Prinsip inti bencho = monokrom, semua permukaan alpha hitam (--wash 6%) di atas putih, bukan border #e5e5e5; heading weight 500 bukan 700; motion spring cubic-bezier(.22,1,.36,1) dengan stagger 60ms
- Works: Skill baru `marketplace-tool-ui` di ~/.config/opencode/skills/ yang mewajibkan baca DESIGN.md; prompt cron 10:00 ditambah baris "ikuti DESIGN.md" supaya tool #37+ konsisten otomatis
- Works: Pilot di #36: chip row pill marketplace (ganti select), input di atas --wash, verdict slab, tabel borderless, stagger reveal, dark mode auto ikut OS + tombol toggle dengan localStorage dan no-flash inline script
- Works: Logic kalkulasi tidak disentuh; 13 test tetap lulus, semua endpoint + static page verified via curl, ID JS vs HTML cocok, tanpa em dash
- Issues: Playwright di mesin ini gagal render (libnspr4.so tidak ada) - verifikasi visual tidak bisa dilakukan sendiri, harus lihat di browser
- Lesson: Konsistensi visual antar sesi hanya bisa dijamin lewat file aturan (DESIGN.md), bukan memori. Tanpa kontrak, 36 tool punya tema yang mirip tapi tidak seragam
- Lesson: Design system monokrom (alpha-based) jauh lebih mudah diseragamkan daripada palet warna - tidak ada keputusan "warna apa" per komponen, cuma "alpha berapa"
- Next: Roll out DESIGN.md ke tool lama secara bertahap, mulai dari yang paling sering dipakai; tampilkan hasil pilot #36 untuk approval sebelum retrofit besar

## 2026-10-20 - Pemulih Toko Marketplace
- Works: Research via Google News RSS `when:7d` menemukan pain point baru yang belum tersentuh: suspensi toko tanpa alasan spesifik (Media Konsumen, 16 Okt 2026), NIK terkunci di akun lama sehingga dana tidak bisa dicairkan (Media Konsumen, 19 Okt 2026), dan identitas dipakai akun lain untuk menyerang reputasi (Media Konsumen, 14 Okt 2026)
- Works: Node.js + Express, 4 kasus (toko dibekukan, NIK terkunci, akun dibajak, identitas dipakai), kalkulator dampak dari input seller, checklist bukti, langkah 24 jam, larangan, jalur eskalasi, dan generator surat banding
- Works: Semua angka kerugian dihitung dari input (pesanan/hari, nilai pesanan, margin, hari terhenti, biaya tetap), tidak ada tarif atau statistik baru yang dikarang. Sumber per kasus dan UU PDP 27/2022 ditampilkan di UI
- Works: 17 unit test lulus (matematika dampak, severity, fallback issue/platform, validasi, 4 varian surat, sumber, larangan em dash). Runtime: static 200, semua endpoint 200, 4 branch analyze 200, invalid 400, API 404, surat NIK 200
- Works: UI mengikuti DESIGN.md (token monokrom, kartu 28px, pill 999px, Google Sans weight 500, entrance stagger 60ms, dark mode no-flash, reduced motion, tanpa em dash)
- Issues: `npm` tidak ada di PATH default mesin ini, harus pakai `~/.nvm/versions/node/v22.23.0/bin/npm`. Node sistem v18, tool diuji dengan Node v22
- Issues: Kasus 19 Okt sempat selesai setelah perhatian publik, tetapi tool tidak boleh menjanjikan jalur media sebagai solusi. Media konsumen hanya opsi eskalasi terakhir, bukan jaminan
- Lesson: Pain point paling mendesak bukan selalu biaya, tetapi kehilangan akses. Saat toko mati, seller tidak butuh kalkulator fee, mereka butuh kronologi, bukti, dan surat yang memaksa platform memberi alasan tertulis
- Lesson: Jangan menampilkan "peluang pulih" atau SLA palsu. Yang bisa dihitung hanya kerugian dari input seller dan langkah proses. Selebihnya harus jujur: tidak ada jaminan
- Lesson: Tool pemulihan akun wajib memperingatkan modus jasa pemulihan palsu dan permintaan OTP (Media Konsumen, 24 Sep 2026). Fitur keamanan ini bukan pelengkap, tapi bagian inti
- Lesson: Bedakan dari #29 dana tertahan. #29 melacak saldo jangka panjang, tool ini memulihkan akses akun/toko dan membetulkan data identitas
- Next: Tambah mode tracker kasus dengan tanggal banding dan pengingat follow-up, tombol salin checklist bukti, dan tautan resmi Seller Center per marketplace setelah URL-nya diverifikasi

## 2026-10-20 - Retrofit DESIGN.md ke 23 Tool Lama
- Works: Retrofit 23 tool (HTML statis + HTML di dalam server.py) dengan pola append `<style id="design-skin">` setelah style lama, jadi token baru menang lewat cascade tanpa menyentuh CSS lama
- Works: Tiap tool dapat no-flash theme script di `<head>`, Google Fonts (Google Sans + Inter), dan tombol `theme-btn` (atau memakai tombol lama yang sudah ada) sehingga dark mode konsisten
- Works: 0 em dash di semua file, `python3 -m py_compile` lulus untuk 06/08/09/34/27/31, `node --check` lulus untuk script inline, test #02 tetap lulus
- Works: Runtime dicek per tool: static 200 + satu endpoint API 200. Spot check ulang: #34, #02, #13, #06 (POST /api/calculate), #27 semua 200
- Issues: 7 tool Go (07,10,12,14,19,22,25) dan 2 extension popup (05,20) belum diretrofit; Go tidak terpasang di mesin Linux ini sehingga build/runtime tidak bisa diverifikasi lokal
- Issues: Verifikasi visual tetap tidak bisa dilakukan sendiri (Playwright rusak, tidak ada browser). Yang bisa dijamin hanya struktur CSS, bukan hasil render
- Lesson: Retrofit lewat override skin jauh lebih aman daripada rewrite: diff didominasi insertion (6435+ / 66-), dan 66 deletion itu hampir semua kode toggle tema lama serta link font lama
- Lesson: Perhatikan konflik ID toggle lama. Sebagian tool sudah punya `themeBtn`; kalau skin menyembunyikan `#themeBtn` tanpa menambah `theme-btn`, tombol tema bisa hilang. Selalu cek ada satu tombol yang benar-benar terlihat
- Lesson: File dengan Tailwind CDN (mis. #02) butuh `!important` di skin; file non-Tailwind tetap perlu `!important` karena style lama sering dideklarasikan setelah `:root`
- Next: Retrofit sisa tool setelah ada keputusan soal Go toolchain dan extension popup; review tampilan di browser untuk #02 (Tailwind) dan #06 (HTML di dalam Python) yang paling berisiko

## 2026-10-21 - Sinkronisasi Status Diskon 50% (#23 dan #34, B7)
- Works: Research Google News RSS `when:7d` + web search menemukan perkembangan baru: Kementerian UMKM memastikan diskon biaya layanan minimal 50% berlaku efektif 25 Oktober 2026 (ANTARA 16-17 Okt, Bisnis.com 17 Okt, Kompas 7 Okt), dengan dasar Kepmen UMKM 398/2026. Data pengajuan: akun SAPA UMKM, platform, identitas merchant, daftar SKU; verifikasi platform maksimal 10 hari kalender; insentif paling lambat 5 hari setelah dua tahap verifikasi.
- Works: Memutuskan TIDAK membuat tool #38 karena pain point paling fresh (diskon 50%) sudah punya dua tool (#23, #34). Sesuai aturan fallback, fokus memperbaiki P1 B7 di REVIVAL_AUDIT.md daripada menduplikasi tool.
- Works: #23 diubah date-aware (`terjadwal` sebelum 25 Okt, `aktif` setelahnya), tarif default diselaraskan ke estimasi 10-18% (sebelumnya 1-2%), tambah syarat rekam jejak usaha bersih, dan SLA verifikasi. #34 diubah dari hardcoded `tahapan-final` (29 Agu) ke date-aware dengan tanggal resmi + Kepmen 398/2026.
- Works: Test baru: 13 test Node untuk #23 dan 14 test Python untuk #34, semuanya lulus. Runtime: kedua server hidup, `GET /api/status`, `GET /api/marketplaces`, `POST /api/check`, `POST /api/letter` (#34), dan halaman statis 200; input invalid 400.
- Issues: #23 dan #34 sebelumnya sama-sama benar secara internal tetapi sama-sama usang. Inkonsistensi B7 bukan cuma beda status, tetapi juga beda tarif default (1-2% vs 5-12%) dan beda jumlah syarat.
- Lesson: Konfirmasi kebijakan bukan ide tool baru. Kalau aturan yang sudah punya tool akhirnya ditetapkan, update tool lama dulu; membuat tool baru dengan topik sama hanya menambah sumber informasi yang bisa saling bertentangan.
- Lesson: Dua tool untuk satu regulasi wajib berbagi fakta yang sama: tanggal berlaku, tarif default, syarat, dan SLA. Perbedaan angka antar tool membuat seller tidak percaya pada keduanya.
- Lesson: Bedakan "target" dan "tanggal resmi". Tool harus date-aware dan menyebut dasar hukum terbaru, bukan judul berita lama.
- Lesson: Tarif default marketplace harus ditandai estimasi dan diberi sumber. Definisi biaya layanan (admin + komisi + aplikasi, 10-18%) harus konsisten di semua tool.
- Next: Pantau realisasi per platform setelah 25 Oktober 2026; kalau ada platform yang menunda atau menerapkan tarif berbeda, update kedua tool dengan sumber baru. Pertimbangkan audit realisasi potongan dari kuitansi seller.

## 2026-10-22 - Pelacak Poin Penalti
- Works: Research Google News RSS `when:7d` menemukan kasus baru yang belum tersentuh: toko Shopee berusia lebih dari 5 tahun ditutup karena poin, banding disetujui dan poin direset ke 0, lalu poin muncul lagi untuk referensi yang sama dan toko terancam ditutup kedua kali (Media Konsumen, 21 Okt 2026). Kasus lama lintas platform: Tokopedia sampai minus 210 poin (Media Konsumen, 1 Mei 2022) dan TikTok Shop 12 poin (Media Konsumen, 19 Jan 2025)
- Works: Aturan poin diground langsung dari Pusat Edukasi Penjual Shopee: tingkatan 0/I/II/III/IV/V, sanksi promosi dan peringkat mulai 3 poin, blokir unggah produk mulai 12 poin, pembatasan akun mulai 15 poin selama 28 hari (FAQ 8 Okt 2026, Sistem Poin 17 Sep 2026, Kesehatan Toko). Banding 14 hari sejak poin terbit, proses sekitar 7 hari (Pengajuan Banding 9 Okt 2026). Reset poin pada Senin terakhir Maret, Juni, September, Desember
- Works: Tool #38 dibuat dengan Node.js + Express, single dep. Analisis sisa poin ke ambang, tingkatan, tanggal reset, tenggat banding, estimasi laba hilang bila dibatasi 28 hari, catatan kasus + CRUD, deteksi poin muncul kembali untuk referensi yang sama, export CSV, dan dua template surat (banding poin dan poin kembali setelah banding)
- Works: 21 unit test Node lulus (batas tingkatan, reset kuartal termasuk hari reset, tenggat banding lewat/mendesak, ambang manual non-Shopee, validasi, deteksi reappearance, isi surat, tanpa em dash). Runtime: static 200, semua endpoint 200/201, analyze invalid 400, API 404, export CSV 200, seed + tambah + patch + hapus kasus terverifikasi
- Works: UI mengikuti DESIGN.md (token monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, dark mode no-flash, reduced motion). Semua ID yang dipakai JS ada di HTML, JS syntax OK
- Issues: Endpoint `seller.shopee.co.id/edu/article/7070` sempat mengembalikan kode 000 dua kali saat curl berurutan, lalu 200 setelah jeda. Halaman bantuan Shopee tidak stabil untuk request beruntun
- Issues: Kasus 21 Oktober tidak menyebut nomor putusan atau aturan spesifik yang dilanggar, jadi tool tidak boleh menyimpulkan penyebab. Yang bisa dilakukan hanya mencatat kronologi dan meminta dasar tertulis
- Lesson: Pain point baru bukan selalu biaya. Kegagalan proses banding (poin kembali setelah menang) adalah masalah kepercayaan yang lebih mendesak karena seller kehilangan kepastian hukum internal platform
- Lesson: Jangan mengarang ambang poin platform yang tidak dipublikasikan. Hanya Shopee yang punya tabel resmi yang bisa dipakai langsung; platform lain wajib memakai input manual dengan label jelas
- Lesson: Deteksi "poin muncul kembali" harus memakai referensi pesanan yang sama dan status banding diterima + poin direset. Tanpa syarat itu, dua pelanggaran berbeda pada tanggal berdekatan akan salah ditandai
- Lesson: Reset kuartal mengubah strategi seller. Tool harus menunjukkan sisa hari ke reset, bukan hanya total poin, karena menahan 2 minggu bisa menghindari pembatasan
- Next: Tambah template surat untuk banding tingkat lanjutan setelah banding pertama ditolak, dan pengingat tanggal banding atau reset. Pantau apakah platform lain mulai mempublikasikan tabel poin resmi

## 2026-10-23 - Pelacak Tenggat Wajib Halal
- Works: Research Google News RSS `when:7d` dan web search menemukan berita 17 sampai 23 Oktober 2026: pemerintah memperpanjang penahapan wajib halal ke 2028 lewat PP 40/2026, tetapi perpanjangan tidak seragam. UMK makanan, minuman, hasil sembelihan, dan jasa penyembelihan sampai 17 Oktober 2028; usaha menengah dan besar kelompok yang sama tetap 17 Oktober 2024; jasa makanan dan minuman serta produk impor mulai 18 Oktober 2028; obat bebas 2029; obat keras 2034
- Works: Rincian aturan diground dari BSPJI Pontianak (20 Oktober 2026), ANTARA (17 dan 22 Oktober 2026), MUI (22 Oktober 2026), dan teks PP 42/2024 Pasal 2, 158, 160, dan 161. Kriteria SEHATI, nilai fasilitasi Rp 230.000, kuota 1.350.000, kode SEHATI26, dan dokumen diambil dari BPJPH (5 Januari dan 2 Januari 2026)
- Works: Tool #39 dibuat dengan Node.js + Express. 18 kategori, 4 skala usaha, asal dalam negeri atau impor, status sertifikasi, deteksi barang gunaan tanpa unsur hewan, deteksi bahan haram, jalur SEHATI bersyarat untuk hasil sembelihan, timeline lima tahap, daftar dokumen, skor kesiapan 12 kriteria, tabel jadwal resmi, dan sumber di UI
- Works: 28 unit test Node lulus (tenggat per kategori dan skala, impor, jasa, barang gunaan, bahan haram, status sertifikat, ambang status, timeline, dokumen, validasi, kesiapan, sumber, tanpa em dash). Runtime: halaman statis 200, meta/example/analyze/readiness 200, analyze invalid 400, readiness invalid 400, API 404
- Works: UI mengikuti DESIGN.md (token monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, dark mode no-flash, reduced motion). 41 dari 41 ID yang dipakai JS ada di HTML, JS inline syntax OK, tanpa em dash
- Issues: Link Google News RSS tidak bisa diikuti langsung karena redirect berbasis JavaScript. Solusinya pakai web search untuk mendapatkan URL asli ANTARA, BSPJI, BPJPH, Jakarta Post, detik, dan MUI
- Issues: Test pertama mengharapkan -737 hari untuk tenggat 2024, padahal hasil aktual -736. Yang salah ekspektasi test, bukan logika; test diperbaiki dan seluruh suite lulus
- Lesson: Judul "wajib halal mundur 2028" menyesatkan kalau dipakai sebagai satu tanggal untuk semua seller. Perpanjangan hanya untuk UMK dan kategori tertentu, sementara usaha menengah dan besar makanan sudah lewat tenggat 2024. Tool regulasi wajib memodelkan kategori, skala, dan asal produk sekaligus
- Lesson: Bedakan "batas akhir masa penahapan" dan "tanggal mulai wajib". Dua jenis tanggal ini terlihat sama di berita, tetapi menghasilkan status yang berbeda. Mencampurnya membuat verdict salah untuk produk impor dan jasa
- Lesson: Sertifikasi gratis bukan gratis untuk semua orang. SEHATI hanya untuk UMK, punya 15 kriteria, kuota tahunan, dan kode fasilitasi yang berlaku per tahun. Tampilkan Rp 230.000 sebagai nilai fasilitasi pemerintah, bukan biaya seller, dan selalu sertakan caveat kuota
- Lesson: Pengecualian adalah logika produk, bukan catatan kaki. Barang gunaan tanpa unsur hewan tidak wajib sertifikasi, dan produk berbahan haram tidak disertifikasi tetapi wajib diberi keterangan tidak halal. Tanpa dua cabang ini, tool akan menyuruh seller mengurus sertifikasi yang tidak perlu
- Lesson: Regulasi masih bergerak. Pada 22 Oktober 2026 pemerintah masih membahas formula baru untuk UMKM, jadi tool harus date-aware, menampilkan sumber, dan tidak mengunci status sebagai final
- Next: Update #39 saat aturan pelaksanaan PP 40/2026 atau kuota SEHATI 2027 berubah. Tambah panduan unggah nomor sertifikat halal per marketplace setelah dokumentasi Seller Center diverifikasi, dan opsi pengingat tenggat

## 2026-10-25 - Pelacak Klaim Paket Hilang dan Rusak
- Works: Research Google News RSS `when:7d` dan pencarian Media Konsumen menemukan pain point baru: paket hilang atau rusak, penjual tetap refund, tetapi kompensasi tidak menutup nilai barang. Tujuh kasus Oktober 2026 dipakai sebagai sumber, termasuk Shopee hanya mengganti Rp135.000 untuk barang Rp1.190.000 (23 Okt), iPad Rp7 juta belum cair setelah tiga bulan (22 Okt), laptop Rp14,6 juta dengan laporan ditutup (1 Okt), dan retur rusak yang membebani penjual (6 dan 8 Okt)
- Works: Tool #40 dibuat dengan Node.js + Express. Kalkulator kerugian untuk lima jenis insiden, perhitungan dana penjualan yang tetap diterima setelah refund, premi asuransi, nilai barang kembali, kerugian bersih, biaya belum tertutup, dan jumlah penjualan normal untuk menutup kerugian
- Works: Patokan 10 kali ongkir ditampilkan sebagai pembanding dengan label jelas bahwa angka itu berasal dari pernyataan penjual pada kasus 23 Oktober 2026, bukan tarif resmi. Batas video pengemasan 24 jam juga ditandai sebagai permintaan yang disebut penjual pada kasus 6 Oktober 2026
- Works: Skor kesiapan 13 bukti dengan bobot dua kali untuk lima bukti kritis (video packing, serah terima, tracking, nomor tiket, invoice), catatan kasus dengan umur klaim dan status, peringatan klaim ditolak atau menggantung, generator surat klaim, dan ekspor CSV
- Works: 37 unit test Node lulus (kerugian dasar, refund sebagian, tanpa refund, premi asuransi, nilai barang kembali, batas refund, margin nol, validasi tanggal, umur laporan, kesiapan bukti kritis, validasi kasus, ringkasan, isi surat, sumber, tanpa em dash). Runtime: halaman statis 200, meta/example/analyze/readiness/letter 200, analyze invalid 400, kasus tambah 201, kasus invalid 400, patch 200, delete 200, seed 200, export 200, API tidak dikenal 404
- Works: UI mengikuti DESIGN.md (token monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, dark mode no-flash, reduced motion). 78 ID yang dipakai JS semuanya ada di HTML, tidak ada ID duplikat, JS inline syntax OK
- Works: Server mengembalikan JSON 400 untuk body rusak, 413 untuk payload di atas 64 KB, dan 400 untuk tanggal kalender tidak valid. Ekspor CSV menetralkan sel yang diawali =, +, -, atau @ agar tidak menjadi formula saat dibuka di spreadsheet
- Issues: Perintah curl pertama gagal karena payload JSON dibungkus tanda kutip tambahan saat dimasukkan ke command substitution. Status 400 yang muncul adalah body-parser, bukan validasi aplikasi. Verifikasi diulang memakai file payload terpisah dan semua endpoint memberi status yang benar
- Issues: Server background sempat ikut mati saat shell tool timeout. Solusi: jalankan dengan `setsid nohup ... & disown` lalu curl di perintah terpisah
- Issues: Satu artikel MerahPutih 23 Oktober menyebut diskon biaya marketplace mulai 28 Oktober 2026, sementara ANTARA, Jawa Pos, Koran Jakarta, dan VIVA pada 16 sampai 24 Oktober menyebut 25 Oktober 2026. Mayoritas sumber dan tanggal resmi yang sudah dipakai #23 dan #34 tetap 25 Oktober, jadi kedua tool tidak diubah. Perbedaan ini dicatat untuk dipantau saat realisasi per platform
- Lesson: Kerugian klaim paket bukan sekadar ongkir. Nilai barang, refund, kemasan, premi asuransi, dan nilai barang yang kembali harus dihitung bersama, karena kompensasi 10 kali ongkir bisa jauh di bawah modal
- Lesson: Bukti kritis berbeda per jenis insiden. Video packing dan serah terima menentukan untuk paket hilang, foto berat dan unboxing menentukan untuk isi kosong, sedangkan video unboxing paket retur menentukan untuk retur rusak. Checklist generik tidak cukup
- Lesson: Klaim yang menggantung adalah masalah waktu, bukan hanya nominal. Umur laporan dan follow-up terakhir harus terlihat, karena kasus tiga bulan tanpa kepastian lebih merugikan daripada selisih kompensasi kecil
- Lesson: Jangan mengarang tarif kompensasi. Satu-satunya angka pembanding yang boleh dipakai adalah yang benar-benar disebut di sumber, dan harus diberi label sebagai praktik kasus, bukan aturan resmi
- Next: Update #40 saat marketplace atau ekspedisi mengumumkan tarif kompensasi resmi. Tambah pengingat follow-up otomatis, impor CSV dari ekspor pesanan, dan template surat terpisah untuk klaim asuransi ekspedisi

## 2026-10-26 - Banding Produk Diblokir
- Works: Research Google News RSS `when:7d` dan feed Media Konsumen menemukan pain point baru: produk sah dihapus karena klasifikasi otomatis, lalu toko ikut ditutup permanen. Kasus 24 Oktober 2026 (kapas bayi dianggap produk nikotin, banding ditolak) dan 22 Juli 2026 (semua produk hilang tanpa alasan jelas) jadi sumber utama
- Works: Tool #41 dibuat dengan Node.js + Express. Kalkulator dampak listing hilang (omzet, laba, modal stok tertahan, biaya iklan), penilai kekuatan argumen dari fakta penjual, skor kesiapan 13 bukti dengan 5 bukti kritis, catatan kasus per produk, peringatan banding ditolak atau toko ditutup, generator surat permohonan peninjauan manual, dan ekspor CSV
- Works: 40 unit test Node lulus (dampak dasar, tanggal pulih, margin nol, validasi tanggal dan nominal, skor argumen, kesiapan bukti, validasi kasus, ringkasan, isi surat, sumber, tanpa em dash). Runtime: halaman statis 200, meta/example/analyze/readiness/letter 200, analyze invalid 400, kasus tambah 201, kasus invalid 400, patch 200, delete 200, seed 200, export 200, API tidak dikenal 404
- Works: UI mengikuti DESIGN.md (token monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, dark mode no-flash, reduced motion). 92 ID unik, semua ID yang dipakai JS ada di HTML, tidak ada ID duplikat, JS inline syntax OK, tanpa em dash
- Issues: Perhitungan tingkat dampak awalnya memakai total eksposur yang memasukkan nilai stok, sehingga kasus 10 hari langsung masuk kritis. Nilai stok bukan kerugian yang hilang, hanya modal tertahan
- Fix: Tingkat dampak sekarang memakai kerugian operasional (laba hilang + biaya iklan) terhadap biaya harian, sedangkan modal tertahan tetap ditampilkan terpisah
- Lesson: Produk dihapus karena salah klasifikasi adalah masalah berbeda dari toko dibekukan (#37) dan poin penalti (#38). Yang dibutuhkan penjual bukan pemulihan akun, tetapi argumen produk, bukti listing, dan surat agar sistem meninjau ulang kategori
- Lesson: Jangan menyuruh penjual menyangkal saat produk memang terkait kategori terlarang. Tool harus punya cabang jujur: fokus perbaikan listing dan ajukan pemulihan setelah produk sesuai aturan
- Lesson: Surat pernyataan yang diminta platform saat akses toko diblokir adalah bukti penting. Tool wajib menyimpan salinannya dan mencatat konteks penandatanganan, bukan menyarankan penolakan mentah-mentah
- Lesson: Skor argumen dan tingkat dampak harus diberi label heuristik. Marketplace tidak mempublikasikan rumus penilaian, jadi tool tidak boleh berpura-pura memberi kepastian
- Next: Update #41 saat marketplace mempublikasikan SLA banding produk resmi. Tambah bukti khusus per kategori (BPOM, SNI, halal, merek), impor CSV dari daftar produk, dan pengingat follow-up otomatis
