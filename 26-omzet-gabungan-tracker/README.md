# Omzet Gabungan Tracker

Cek posisi omzet gabungan lintas marketplace vs batas bebas pajak Rp 500 juta per tahun. DJP menghitung omzet dari SEMUA platform digabung, plus penjualan offline.

## Run

```bash
npm install
node server.js
```

Buka http://localhost:8026

## What it does

- Input omzet per marketplace per bulan (Shopee, Tokopedia, TikTok Shop, Lazada, Blibli, Bukalapak, Offline)
- Hitung omzet YTD, proyeksi 1 tahun, rata-rata bulanan
- Status risiko: Aman, Waspada, Mendekati batas, Di atas batas
- Progress bar vs Rp 500 juta, bulan di mana omzet menyentuh batas
- Estimasi PPh 22 0,5% kalau omzet lewat batas
- Kontribusi per marketplace + total per bulan
- Banner status kebijakan date-aware (pemungutan ditunda, restart 1 Nov 2026 atau mundur ke 2027)
- Auto-fill contoh data, light minimal theme, responsive

## API

```
GET  /api/status        status kebijakan + fase saat ini
GET  /api/marketplaces  daftar marketplace
GET  /api/example       contoh data omzet
POST /api/analyze       { values: { shopee: [12 angka], ... } } -> analisis
```
