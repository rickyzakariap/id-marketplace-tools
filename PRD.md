# PRD - ID Marketplace Tools

## Product Vision

**Satu suite tools buat seller marketplace Indonesia yang mau optimize penjualan tanpa ribet.**

Target user: Non-technical sellers yang jual di Shopee, Tokopedia, Bukalapak, Lazada, Blibli, TikTok Shop.

## Problem Statement

Seller Indonesia menghadapi:
1. **Fee structure kompleks** - Tiap marketplace punya fee beda, susah bandingin
2. **Pricing gak optimal** - Gak tau harga terbaik buat maximize profit
3. **Listing quality rendah** - Judul & deskripsi gak SEO-friendly
4. **Stock management ribet** - Sync stok antar marketplace manual
5. **Review analysis manual** - Baca ratusan review satu-satu

## Solution

Suite of tools yang:
- ✅ **Bulk Fee Calculator** - Hitung fee semua marketplace sekaligus (DONE)
- 🔄 **Price Optimizer** - Rekomendasi harga terbaik berdasarkan kompetisi
- 🔄 **Listing Generator** - Auto-generate judul & deskripsi SEO-friendly
- 🔄 **Stock Sync** - Sinkron stok antar marketplace real-time
- 🔄 **Review Analyzer** - Analisis sentiment & extract insights dari review
- 🔄 **Profit Calculator** - Hitung HPP + margin + fee = net profit

## User Personas

### Persona 1: Budi (Seller Pemula)
- **Age:** 25-35
- **Background:** Karyawan yang jual side hustle
- **Pain points:** Gak ngerti fee structure, pricing asal
- **Goals:** Jual 10-50 produk/bulan, profit minimal 20%
- **Tech level:** Low - butuh tools yang simple

### Persona 2: Sari (Seller Pro)
- **Age:** 30-45
- **Background:** Full-time seller, 1000+ produk
- **Pain points:** Stock management ribet, listing quality inconsistent
- **Goals:** Scale ke 10.000+ produk, automate workflows
- **Tech level:** Medium - bisa pake CLI, butuh efficiency

### Persona 3: Andi (Agency Owner)
- **Age:** 35-50
- **Background:** Manage 10+ toko untuk clients
- **Pain points:** Multi-account management, reporting
- **Goals:** Centralized dashboard, bulk operations
- **Tech level:** High - butuh API, integrations

## Features (by Priority)

### P0 - Must Have (MVP)

#### 1. Bulk Fee Calculator ✅ DONE
- Input: CSV (name, price)
- Output: Fee breakdown per marketplace
- Features: Parallel processing, export CSV

#### 2. Price Optimizer
- Input: Product category, target marketplace
- Output: Recommended price range
- Features: Scrape competitor prices, analyze demand

#### 3. Listing Generator
- Input: Product name, category, features
- Output: SEO-optimized title + description
- Features: AI-powered, multi-marketplace templates

### P1 - Should Have

#### 4. Stock Sync (Chrome Extension)
- Input: Stock data dari spreadsheet
- Output: Update stok di semua marketplace
- Features: Real-time sync, conflict resolution

#### 5. Profit Calculator
- Input: HPP, shipping cost, marketplace fee
- Output: Net profit, margin %, break-even point
- Features: Multi-product, scenario analysis

### P2 - Nice to Have

#### 6. Review Analyzer
- Input: Product URL / review export
- Output: Sentiment score, common complaints, improvement suggestions
- Features: NLP-powered, trend analysis

#### 7. Competitor Tracker
- Input: Competitor store URLs
- Output: Price changes, new products, rating trends
- Features: Daily monitoring, alerts

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Downloads | 1000+ in 3 months | GitHub releases |
| Active users | 500+ monthly | Web analytics |
| Time saved | 2 hours/week/user | User survey |
| Profit increase | 15% average | Before/after comparison |
| NPS | 50+ | User feedback |

## User Stories

### Fee Calculator
```
As a seller,
I want to upload my product CSV and see fee breakdown for all marketplaces,
So that I can choose the most profitable platform for each product.
```

### Price Optimizer
```
As a seller,
I want to get recommended price range based on competition,
So that I can price competitively without sacrificing profit.
```

### Listing Generator
```
As a seller,
I want to auto-generate SEO-friendly titles and descriptions,
So that my products rank higher in search results.
```

### Stock Sync
```
As a multi-marketplace seller,
I want to sync my stock across all platforms in one click,
So that I don't oversell or run out of stock unexpectedly.
```

## Roadmap

### Phase 1: Foundation (Month 1-2)
- ✅ Bulk Fee Calculator (CLI)
- 🔄 Price Optimizer (CLI)
- 🔄 Listing Generator (Web)

### Phase 2: Automation (Month 3-4)
- 🔄 Stock Sync (Chrome Extension)
- 🔄 Profit Calculator (Web)

### Phase 3: Intelligence (Month 5-6)
- 🔄 Review Analyzer (CLI)
- 🔄 Competitor Tracker (Web)

### Phase 4: Scale (Month 7+)
- API untuk third-party integrations
- Multi-language support (Bahasa Indonesia, English)
- Mobile app (React Native)

## Monetization (Future)

| Tier | Price | Features |
|------|-------|----------|
| Free | Rp 0 | Basic tools, 100 products/month |
| Pro | Rp 99k/month | Unlimited products, advanced features |
| Agency | Rp 499k/month | Multi-account, API access, priority support |

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Marketplace API changes | High | Monitor changelogs, version APIs |
| Low adoption | Medium | Community building, tutorials |
| Competitor copies features | Low | Move fast, build moat |
| Technical debt | Medium | Code review, testing |

## Out of Scope (v1)

- Payment gateway integration
- Order management system
- Customer support chatbot
- Inventory management (beyond stock sync)
- Multi-currency support