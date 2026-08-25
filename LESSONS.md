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
