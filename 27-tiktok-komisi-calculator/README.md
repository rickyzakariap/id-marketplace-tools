# TikTok Shop Komisi Kalkulator

Hitung potongan komisi dinamis TikTok Shop lama vs baru (berlaku 18 Mei 2026). Cap per item melesat dari Rp40.000 ke Rp650.000, banyak kategori naik tarif. Tool ini jawab: berapa potongan baru per item, berapa total bulanan, dan harus naik harga berapa agar margin tidak tergerus.

## Run

```bash
python3 server.py
```

Buka http://localhost:8027

## What it does

- 30 kategori produk dengan tarif lama (10 Jun 2025) vs baru (18 Mei 2026)
- Hitung komisi per item dengan cap Rp40.000 (lama) vs Rp650.000 (baru)
- Total potongan per bulan, selisih, dan persentase kenaikan
- Dampak ke margin: profit per item dan margin % sebelum vs sesudah
- Rekomendasi harga baru agar profit per item tetap sama dengan skema lama
- Perbandingan opsional dengan biaya admin Shopee 2026 per kelompok kategori
- Info biaya retur baru (hingga Rp10.000 per kejadian, berlaku 1 Juni 2026)
- Auto-fill contoh, light minimal theme, responsive, toggle dark/light

## API

```
GET  /api/status        status kebijakan + sumber
GET  /api/categories    daftar kategori + tarif lama/baru
GET  /api/shopee        kelompok biaya admin Shopee 2026
GET  /api/example       contoh data
POST /api/calculate     hitung komisi (category, price, modal, discount, volume, shopee_group)
```

## Sumber tarif

- teknologi.bisnis.com: Komisi Dinamis Seller TikTok Shop Naik Hari Ini, Batas Atas Melesat 15 Kali Lipat (2026-05-18)
- associe.co.id: Daftar Besar Biaya Komisi Dinamis TikTok Shop Baru dan Lama (2026-05-08)
- metrotvnews.com: Biaya Admin Shopee 2026, Daftar Biaya per Kategori Produk
