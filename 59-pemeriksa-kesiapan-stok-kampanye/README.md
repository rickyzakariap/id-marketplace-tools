# Pemeriksa Kesiapan Stok Kampanye

Versi 18 November 2026.

Seller sering menambah stok berdasarkan perasaan, lalu kehabisan barang di tengah
kampanye atau justru menumpuk stok setelah promo selesai. Tool ini menghitung
kebutuhan stok sampai akhir kampanye, kekurangan unit, potensi omzet dan laba yang
hilang, tanggal pesan ideal, jumlah restock, serta modal yang perlu disiapkan.

Berbeda dari [Stock Alert Dashboard](../10-stock-alert-dashboard/) yang memantau level
stok dan [Stock Sync Checker](../20-stock-sync-checker/) yang membandingkan stok antar
marketplace, tool ini fokus pada kecukupan stok untuk lonjakan permintaan kampanye.
Berbeda juga dari [Kalkulator Stok Mati](../56-kalkulator-stok-mati/) yang mengurus stok
berlebih dan [Pemeriksa Efisiensi Iklan](../57-pemeriksa-efisiensi-iklan/) yang mengaudit
belanja iklan.

## Masalah yang dipecahkan

Stok yang aman hari ini belum tentu aman saat kampanye. Ada tiga kebutuhan yang sering
tercampur:

1. Penjualan biasa sebelum kampanye, yang tetap mengurangi stok.
2. Lonjakan permintaan selama kampanye.
3. Buffer keamanan untuk pesanan yang lebih cepat dari perkiraan.

Tanpa memisahkan ketiganya, seller sulit tahu berapa unit yang harus dipesan, kapan
pesanan harus keluar, dan berapa modal yang perlu disiapkan. Tool ini menjawab:

- Berapa unit yang dibutuhkan sampai akhir kampanye?
- Berapa unit yang kurang dari stok di tangan dan stok masuk?
- Berapa potensi stok habis dan laba yang hilang?
- Kapan tanggal pesan ideal berdasarkan lead time pemasok?
- Berapa unit restock dan berapa kas yang dibutuhkan?
- Bagaimana kebutuhan berubah pada beberapa skenario kenaikan permintaan?

## Run

```
npm install
npm start
```

Buka http://localhost:8059

## Fitur

- Menghitung penjualan harian saat kampanye dari penjualan biasa dan persen kenaikan.
- Memisahkan kebutuhan sebelum kampanye, kebutuhan selama kampanye, dan buffer keamanan.
- Menghitung stok tersedia dari stok di tangan dan stok masuk yang tiba tepat waktu.
- Menandai stok masuk yang baru tiba setelah tanggal kampanye agar tidak dihitung.
- Menghitung kecukupan stok, kekurangan unit, sisa stok, dan potensi stok habis.
- Menghitung omzet hilang dan laba hilang setelah biaya marketplace serta kemasan.
- Menghitung tanggal pesan ideal dari lead time pemasok dan hari penanganan.
- Menghitung saran unit restock dan kas yang dibutuhkan.
- Memberi verdict aman, stok tipis, stok kurang, restock terlambat, atau belum ada permintaan.
- Membandingkan skenario kenaikan permintaan 0, 50, 100, 150, 200, dan 300 persen.
- Menampilkan rincian kebutuhan, rekomendasi, asumsi, dan rumus di halaman.
- Ekspor CSV dengan netralisasi formula.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, default, batas, ambang, asumsi, dan rumus.
- GET /api/example - contoh SKU dengan kampanye 12 Desember 2026.
- POST /api/analyze - body berisi SKU, tanggal, penjualan, stok, lead time, dan biaya. Mengembalikan proyeksi, margin, verdict, rekomendasi, dan timeline.
- POST /api/scenarios - body sama seperti analyze, ditambah `uplifts` berisi daftar persen kenaikan. Mengembalikan satu baris per skenario.
- POST /api/export - body sama seperti scenarios. Mengembalikan CSV.

Contoh:

```
curl -s -X POST http://localhost:8059/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"sku_name":"Jaket Bomber Pria","marketplace":"shopee","campaign_name":"Flash Sale 12 Desember","campaign_date":"2026-12-12","as_of":"2026-11-18","campaign_days":3,"baseline_daily_sales":30,"uplift_pct":150,"stock_on_hand":600,"incoming_qty":200,"incoming_date":"2026-12-05","safety_days":4,"lead_time_days":10,"handling_days":2,"unit_cost":78000,"unit_price":149000,"marketplace_fee_pct":12,"packaging_cost":2000}'
```

Hasil: kebutuhan 1.065 unit, stok tersedia 800 unit, kecukupan 75,1 persen,
kekurangan 265 unit, potensi stok habis 145 unit, omzet hilang Rp 21.605.000,
laba hilang Rp 7.412.400, saran restock 265 unit, kas Rp 20.670.000, tanggal pesan
ideal 30 November 2026, verdict "Stok kurang, pesan sekarang".

## Test

```
npm test
```

16 test Node memakai `node:test` dan `node:assert/strict`: meta dan asumsi, hasil contoh,
margin bersih, tanggal pesan, stok masuk yang terlambat, verdict aman, verdict tipis
pada kecukupan 100 persen, restock terlambat, penjualan nol tanpa pembagian nol, margin
negatif, skenario kenaikan, validasi daftar skenario, validasi angka dan tanggal,
fallback marketplace, CSV, larangan em dash dan en dash, serta endpoint API yang
mengembalikan 200 untuk data valid dan 400 untuk data salah.

## Asumsi

- Permintaan selama kampanye = penjualan harian biasa x (1 + kenaikan persen).
- Penjualan sebelum kampanye memakai penjualan harian biasa, dihitung dari tanggal acuan
  sampai tanggal kampanye.
- Buffer keamanan = penjualan harian biasa x hari buffer. Default empat hari adalah
  patokan tool, bukan aturan marketplace.
- Stok masuk dihitung tersedia hanya bila tanggal tibanya paling lambat pada tanggal
  kampanye. Bila tanggal tiba kosong, stok masuk dianggap tersedia sekarang dan perlu
  dikonfirmasi ke pemasok.
- Tanggal pesan ideal = tanggal kampanye - lead time - hari penanganan. Default hari
  penanganan dua hari dan bisa diubah.
- Ambang aman 110 persen dan ambang cukup 100 persen adalah penanda audit internal,
  bukan kutipan kebijakan marketplace.
- Laba hilang memakai margin bersih per unit setelah biaya marketplace dan kemasan.
  Bila margin negatif, laba hilang dihitung 0 dan margin diberi peringatan.
- Semua nominal dalam Rupiah dan belum memperhitungkan pajak, biaya iklan, atau biaya
  penyimpanan.

## Catatan

Tool ini tidak mengklaim ambang resmi marketplace mana pun dan tidak menjamin stok
tersedia atau penjualan terjadi. Angka contoh adalah ilustrasi, bukan data resmi.
Selalu cocokkan hasil dengan laporan penjualan, kapasitas pemasok, dan kebijakan
kampanye yang berlaku di Seller Center.
