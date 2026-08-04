# PRD - Listing Consistency Checker

## Problem
Sellers list the same product across multiple marketplaces (Tokopedia, Shopee, Lazada, etc). Prices, titles, stock, and descriptions drift apart over time. No easy way to spot inconsistencies.

## Target User
Marketplace sellers active on 2+ platforms. Non-technical.

## Features (MVP)
1. Add listings per marketplace (product name, price, stock, title, description)
2. Group listings by product
3. Check consistency: compare price, title, stock across marketplaces
4. Visual diff: highlight mismatches in red, matches in green
5. Consistency score per product group (0-100%)
6. Quick summary: "3 of 5 marketplaces have different prices"
7. Auto-fill example data for testing
8. Dark/light theme toggle

## Success Metrics
- Seller can see all inconsistencies in one view
- Seller can identify which marketplace has the outlier price
- Tool loads in <2s, works on mobile

## Out of Scope
- Real-time sync with marketplace APIs
- Auto-fix (just report, don't modify marketplace listings)
- Image comparison