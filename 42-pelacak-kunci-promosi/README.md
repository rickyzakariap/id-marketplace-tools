# Pelacak Kunci Promosi

Voucher instant, voucher toko, atau promo berbayar tiba-tiba tidak bisa dipakai, padahal poin penalti nol? Tool ini menghitung kerugian harian, menilai indikasi kunci promosi, menyiapkan bukti, melacak tiket, dan membuat surat permintaan pembukaan kunci.

Berbeda dari [Pelacak Poin Penalti](../38-pelacak-poin-penalti/) yang fokus pada poin dan banding poin, tool ini menangani fitur promosi yang gagal dipakai meski poin nol. Berbeda juga dari [Banding Produk Diblokir](../41-banding-produk-diblokir/) yang menangani produk dihapus, [Pemulih Toko](../37-pemulih-toko/) yang memulihkan akses akun, dan [Program Diskon Checker](../35-program-diskon-checker/) yang menghitung margin setelah diskon.

## Run

```
npm install
npm start
```

Buka http://localhost:8042

## Fitur

- Diagnosis kunci promosi dari pemicu, gejala, poin penalti, peringatan penalti promosi, reset kuartal, jumlah chat CS, dan lama kunci. Skor 0 sampai 100 adalah heuristik tool, bukan penilaian resmi marketplace.
- Kalkulator dampak: omzet hilang, laba hilang, biaya iklan selama kunci, dan penjualan yang hilang per hari. Semua angka berasal dari input Anda.
- Tingkat dampak ringan, signifikan, atau kritis berdasarkan lama kunci dan laba yang hilang.
- Skor kesiapan 13 bukti. Lima bukti kritis diberi bobot dua kali: screenshot voucher, rekaman checkout, screenshot poin nol, riwayat chat dengan nomor tiket, dan bukti pemicu.
- Catatan kasus per toko dengan nomor tiket, tanggal kunci, tanggal dibuka, follow-up terakhir, status, gejala, fakta, dan bukti.
- Peringatan otomatis untuk kunci lebih dari 30 hari, reset kuartal yang tidak membuka kunci, poin nol tetapi kunci lama, banyak chat CS tanpa penyelesaian, dan bukti kritis yang kurang.
- Generator surat permintaan penjelasan tertulis dan pembukaan kunci fitur promosi.
- Ekspor catatan ke CSV.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, pemicu, gejala, status, opsi fakta, bukti, sumber, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, trigger, status, locked_date, restored_date, price, cost, units_before, units_during, ad_spend_per_day, chat_count, symptoms, facts.
- POST /api/readiness - body: items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data toko, penjual, pemicu, kronologi, gejala, fakta, angka, dan bukti.
- GET /api/cases - daftar kasus, jumlah terbuka, jumlah dibuka, jumlah ditolak, total laba hilang, total omzet hilang, dan umur kasus terbuka.
- POST /api/cases - tambah kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up, atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8042/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","trigger":"harga_coret","status":"eskalasi","locked_date":"2026-07-25","price":65000,"cost":52000,"units_before":40,"units_during":24,"ad_spend_per_day":20000,"chat_count":8,"symptoms":["voucher_instant","promo_berbayar","checkout_gagal","star_seller_hilang"],"facts":{"points":"nol","warning":"ya","quarter_reset":"ya","written_reason":"tidak","star_seller_now":"tidak"}}'
```

Hasil pada 28 Oktober 2026: terkunci 95 hari, penjualan hilang 16 unit per hari, omzet hilang Rp 98.800.000, laba hilang Rp 19.760.000, skor indikasi 100/100, perkiraan pemicu penalti promosi karena harga coret.

## Test

```
npm test
```

37 test Node tanpa framework tambahan: perhitungan hari, dampak, margin nol, penjualan tidak turun, tingkat dampak, tanggal dibuka, skor diagnosis, validasi input, kesiapan bukti berbobot, validasi kasus, ringkasan, isi surat, kelengkapan sumber, default, dan larangan em dash.

## Sumber utama

- Media Konsumen, 27 Oktober 2026: penjual Shopee Ngalamngolshop berjualan 9 tahun, berstatus Star Seller, dan tanpa poin penalti, tetapi voucher instant dan promo berbayar tidak bisa menempel selama lebih dari 3 bulan. Pemicu yang dicatat penjual adalah harga coret pada 25 Juli 2026 dan peringatan penalti promosi. Reset poin kuartal akhir September 2026 tidak membuka kunci. Penjual sudah 8 kali chat CS dan jawabannya tetap menyebut aktivitas mencurigakan tanpa rincian.
- Media Konsumen, 16 Oktober 2026: toko toserbashakiel di Pasuruan kehilangan akses voucher kategori Makanan dan Minuman serta status Star Seller pada 13 Oktober 2026, sehari setelah toko berjalan normal. CS menyebut kejanggalan transaksi tanpa menunjukkan transaksi yang dimaksud. Penjual menduga lonjakan pesanan setelah event 1 sampai 6 Oktober 2026 ikut memicu flag otomatis.

## Catatan

Tool ini bukan nasihat hukum. Aturan promosi, jalur eskalasi, dan batas waktu berbeda per marketplace. Skor indikasi dan tingkat dampak adalah heuristik tool, bukan penilaian resmi. Semua angka uang berasal dari input Anda, bukan tarif atau statistik yang dikarang. Contoh ekonomi pada data seed adalah ilustrasi. Selalu cocokkan dengan syarat layanan dan Seller Center. Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.
