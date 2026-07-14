# Marketplace Project Lessons

> File ini dibaca SETIAP SEBELUM mulai project baru. Jangan repeat mistake yang sama.

---

## 2026-07-14 - Marketplace Fee Calculator CLI
- What worked: Zero dependencies, pure Node.js, clean CLI output with emojis
- What worked: Comparison mode shows ranked profit across all marketplaces
- What worked: Fee structures based on real marketplace data
- What failed: Nothing major — first project, baseline established
- User feedback: N/A (first project)
- Fix for next time: Consider adding interactive mode for easier UX

## 2026-07-14 - Listing SEO Analyzer
- What worked: Web UI with dark theme — much better UX than CLI for visual analysis
- What worked: Score bars with color coding (green/yellow/red) make results scannable
- What worked: Platform-specific limits per marketplace (different title max lengths)
- What worked: Power words detection with Indonesian marketplace keywords
- What worked: Price psychology analysis (X999, goceng pricing) — unique selling point
- What failed: Keyword density analysis is basic — doesn't handle synonyms or stemming
- What failed: No real marketplace data — analysis is heuristic, not data-driven
- User feedback: N/A (self-built)
- Fix for next time: Add synonym detection using simple word mapping for Indonesian

## 2026-07-14 - Listing SEO Analyzer (fixes)
- What failed: Button Analisa stuck karena ID mismatch (`descError` vs `descriptionError`)
- What failed: Saran harga kontradiktif (20000 → suruh pakai 19999, tapi juga suruh bulatkan ke 5000)
- Fix: Rename ID ke konsisten, logic saran harga cek X999 dulu sebelum suggest rounding
- Lesson: WAJIB QA di browser, jangan cuma backend tests. ID mismatch = silent crash.
- Lesson: clearErrors() harus handle semua ID dengan konsisten, jangan campur singkatan.
- What failed: Harga X999 (11999) tetap disuruh "bulatkan ke Rp 5.000" karena Goceng check jalan terpisah
- Fix: Skip Goceng tip kalau sudah X999, naikkan score dari 60 ke 80
- Lesson: Jangan kasih saran yang kontradiktif. Kalau harga sudah X999, jangan suruh bulatkan ke 5000.
