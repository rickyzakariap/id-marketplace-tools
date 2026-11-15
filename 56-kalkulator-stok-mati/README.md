# Kalkulator Stok Mati

Versi 15 November 2026.

Stok yang tidak laku tetap menagih biaya: modal kerja terkunci, gudang penuh, dan barang berisiko rusak atau ketinggalan tren. Tool ini mengelompokkan SKU menjadi sehat, melambat, dan mati, menghitung modal tertahan serta biaya simpan per bulan, lalu membandingkan jual sekarang dengan diskon versus menjual bertahap.

Berbeda dari [Stock Alert Dashboard](../10-stock-alert-dashboard/) yang memantau level stok dan [Stock Sync Checker](../20-stock-sync-checker/) yang membandingkan stok antar marketplace, tool ini fokus pada biaya modal yang tidak berputar dan keputusan likuidasi.

## Run

```
npm install
npm start
```

Buka http://localhost:8056

## Fitur

- Mengelompokkan setiap SKU menjadi habis, sehat, baru, melambat, atau mati.
- Menghitung modal tertahan, nilai jual, dan porsi modal di stok mati.
- Menghitung biaya simpan per bulan dari biaya gudang, biaya modal, dan risiko rusak.
- Menghitung biaya simpan sampai stok habis berdasarkan kecepatan jual saat ini.
- Menghitung batas diskon impas per SKU dan agregat. Diskon di bawah batas itu masih lebih murah daripada menanggung biaya simpan.
- Menghitung skenario diskon: uang bersih jual sekarang, uang bersih jual bertahap, selisih, dan putusan likuidasi atau tahan.
- Memberi rekomendasi per SKU dan langkah agregat untuk menghentikan restock, bundling, dan evaluasi 30 hari.
- Menampilkan rincian per SKU dalam tabel dan menyediakan ekspor CSV.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - pengaturan awal, daftar status, asumsi, rumus, dan batas jumlah SKU.
- GET /api/example - contoh lima SKU dengan pengaturan awal.
- POST /api/analyze - body: `settings` dan `skus`. Mengembalikan hasil per SKU, ringkasan, verdict, dan rekomendasi.
- POST /api/scenario - body: `settings`, `skus`, `discount_pct`, dan `clear_months`. Mengembalikan perbandingan likuidasi.
- POST /api/export - body: `settings` dan `skus`. Mengembalikan CSV.

Contoh:

```
curl -s -X POST http://localhost:8056/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "slow_days": 45,
      "dead_days": 90,
      "target_clear_months": 3,
      "storage_per_unit_month": 500,
      "capital_rate_pct_year": 12,
      "damage_rate_pct_month": 1,
      "fee_pct": 8
    },
    "skus": [
      {
        "code": "KAOS-CC30",
        "name": "Kaos Polos Cotton Combed 30s",
        "quantity": 120,
        "unit_cost": 32000,
        "unit_price": 79000,
        "monthly_sales": 8,
        "days_in_stock": 140
      }
    ]
  }'
```

Hasil contoh: modal Rp 3.840.000, nilai jual Rp 9.480.000, butuh 15 bulan untuk habis, status mati, biaya simpan Rp 136.800 per bulan, biaya simpan sampai habis Rp 2.052.000, dan diskon impas 23,53 persen.

Contoh skenario dengan data `/api/example`, diskon 20 persen, dan horizon 3 bulan: uang bersih jual sekarang Rp 16.847.040, jual bertahap Rp 11.621.400, selisih Rp 5.225.640. Dua SKU disarankan likuidasi dan satu ditahan.

## Test

```
npm test
```

Dua belas test Node tanpa framework tambahan, memakai `node:test` dan `node:assert/strict`. Cakupan: bentuk meta, total contoh, batas status stok, perhitungan biaya simpan, diskon impas, horizon tanpa penjualan, skenario likuidasi, skenario aman, validasi input, validasi diskon, CSV, dan larangan em dash.

## Asumsi

- Biaya simpan awal Rp 500 per unit per bulan adalah asumsi, bukan tarif platform. Ganti dengan biaya gudang, listrik, dan tenaga kerja Anda.
- Biaya modal 12 persen per tahun adalah asumsi biaya kesempatan, bukan bunga pinjaman tertentu.
- Risiko rusak 1 persen per bulan adalah asumsi untuk barang yang mudah rusak atau ketinggalan tren.
- Biaya marketplace 8 persen dipakai untuk menghitung uang bersih saat likuidasi. Ganti dengan tarif toko Anda.
- Status stok adalah heuristik dari umur stok, kecepatan jual, dan target bulan habis. Tool tidak memakai aturan resmi marketplace tertentu.
- Bila belum ada penjualan, biaya simpan sampai habis memakai horizon target. Skenario tetap menyarankan likuidasi karena menahan stok hanya menambah biaya.
- Skenario menganggap semua sisa stok bisa terjual pada harga diskon yang dipilih. Ini pembanding keputusan, bukan ramalan penjualan.
- Tool tidak memprediksi permintaan, tidak membaca data marketplace secara otomatis, dan tidak menjamin hasil likuidasi.
