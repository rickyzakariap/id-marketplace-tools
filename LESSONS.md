# Project Lessons

> Read this file BEFORE starting a new project. Don't repeat the same mistakes.

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
