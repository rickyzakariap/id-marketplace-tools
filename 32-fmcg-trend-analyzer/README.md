# FMCG Trend Analyzer

Peta tren kategori FMCG e-commerce Indonesia dari data Compas.co.id (FMCG E-commerce Market Insight Semester 1 2026): pertumbuhan nilai dan volume per kategori, dominasi platform per kategori, produk dengan kenaikan tertinggi, dan kalkulator keep-pace untuk tahu berapa penjualan minimal agar pangsa pasar tidak menyusut.

Data: Compas.co.id S1 2026 (rilis 25 Agu 2026), diliput youngster.id 26 Agu 2026, Gizmologi 25 Agu 2026, Katadata.

## Run

```bash
npm install
npm start
```

Buka http://localhost:8032

## Fitur

- Ringkasan pasar: Rp 88,4 triliun transaksi FMCG H1 2026, +29,4% YoY, Shopee + TikTok ShopTokopedia kuasai 99% penjualan
- Tabel pertumbuhan 5 kategori (Homecare, Food & Beverages, Healthcare, Beauty & Care, Mom & Baby): nilai vs volume, bisa diurutkan, bar visual
- Detail kategori: dinamika platform (Shopee 69% di Homecare, Official Store TikTok agresif di 4 kategori lain) dan produk dengan kenaikan tertinggi
- Daftar produk dengan pertumbuhan tertinggi (Mineral Water +219%, Insektisida +162%, Cooking Oil +123%)
- Kalkulator keep-pace: input kategori + penjualan bulanan + rencana pertumbuhan, keluar target 12 bulan agar pangsa tidak menyusut
- Tema terang default dengan toggle gelap, responsive, contoh data, Enter hitung / Escape bersihkan

## API

- GET /api/meta - ringkasan laporan dan sumber
- GET /api/categories - data pertumbuhan semua kategori
- GET /api/categories/:id - detail satu kategori (dinamika platform, top movers)
- GET /api/movers - produk dengan pertumbuhan tertinggi
- POST /api/keep-pace - hitung target keep-pace (category, monthly_sales, planned_growth)

## Catatan

Nilai rupiah per kategori tidak dipublikasikan Compas, hanya persentase pertumbuhan. Angka proyeksi di kalkulator adalah estimasi matematis, bukan prediksi.
