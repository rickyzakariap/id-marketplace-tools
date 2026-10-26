# Banding Produk Diblokir

Produk dihapus atau dianggap salah kategori, padahal tidak melanggar? Tool ini menghitung dampak harian dari listing yang hilang, menilai kekuatan argumen, menyiapkan bukti, melacak kasus per produk, dan membuat surat permohonan peninjauan manual.

Berbeda dari [Pemulih Toko](../37-pemulih-toko/) yang memulihkan akses akun dan toko, tool ini fokus pada produk yang dihapus atau salah klasifikasi. Berbeda juga dari [Pelacak Poin Penalti](../38-pelacak-poin-penalti/) yang melacak poin dan banding poin, serta [Pelacak Klaim Paket Hilang](../40-klaim-paket-hilang/) yang menangani klaim logistik.

## Run

```
npm install
npm start
```

Buka http://localhost:8041

## Fitur

- Kalkulator dampak listing yang hilang: omzet, laba, modal stok tertahan, dan biaya iklan yang tetap berjalan.
- Tingkat dampak ringan, signifikan, atau kritis berdasarkan hari hilang dan kerugian operasional. Ambang ini adalah heuristik tool, bukan aturan marketplace.
- Penilai kekuatan argumen dari fakta yang diisi penjual: apakah produk benar terkait tuduhan, apakah listing berubah, ketersediaan izin, alasan tertulis, produk sejenis yang masih aktif, dan ada tidaknya surat pernyataan.
- Skor kesiapan 13 bukti. Lima bukti kritis diberi bobot dua kali: screenshot alasan, listing sebelum dihapus, foto produk, invoice, dan izin edar.
- Catatan kasus per produk dengan nomor tiket, tanggal dihapus, tanggal banding, tanggal pulih, status, dan follow-up terakhir.
- Umur kasus otomatis dan peringatan untuk banding ditolak, toko ditutup permanen, produk hilang lebih dari 30 hari, argumen kuat tetapi bukti kurang, serta surat pernyataan yang diminta platform.
- Generator surat permohonan peninjauan manual berisi kronologi, dasar permohonan, daftar bukti, dan permintaan keputusan tertulis.
- Ekspor catatan ke CSV.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, alasan, status, opsi fakta, bukti, sumber, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, reason, status, product_name, sku, category, reason_text, ticket, price, cost, stock_units, units_per_day, ad_spend_per_day, removed_date, appeal_date, last_follow_up, facts.
- POST /api/readiness - body: items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data penjual, produk, alasan, kronologi, fakta, dan bukti.
- GET /api/cases - daftar kasus, jumlah terbuka, jumlah pulih, jumlah permanen, total laba hilang, total modal tertahan, dan umur kasus terbuka.
- POST /api/cases - tambah kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up, atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8041/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","reason":"nikotin","status":"ditutup","product_name":"Kapas bayi Medisoft","price":45000,"cost":32000,"stock_units":120,"units_per_day":8,"ad_spend_per_day":15000,"removed_date":"2026-10-16","facts":{"reason_matches":"tidak","listing_unchanged":"ya","permit":"tidak_berlaku","written_reason":"tidak","similar_active":"ya","forced_statement":"ya"}}'
```

Hasil: listing hilang 10 hari, laba hilang Rp 1.040.000, modal tertahan Rp 3.840.000, total eksposur Rp 5.030.000, skor argumen 65/100.

## Test

```
npm test
```

40 test Node tanpa framework tambahan: perhitungan dampak, tanggal pulih, margin nol, validasi tanggal dan nominal, skor argumen, kesiapan bukti, validasi kasus, ringkasan, isi surat, kelengkapan sumber, dan larangan em dash.

## Sumber utama

- Media Konsumen, 24 Oktober 2026: akun toko Bebekidz yang berjualan 7 tahun dibatasi karena kapas bayi Medisoft dianggap mengandung tembakau, nikotin, rokok elektronik, dan shisha. Produk dihapus, penjual diminta membuat surat pernyataan, toko sempat pulih 17 Oktober 2026, lalu ditutup permanen 19 Oktober 2026 tanpa ada perubahan listing. Banding berikutnya ditolak.
- Media Konsumen, 22 Juli 2026: seluruh produk akun alby.outfit yang hampir 9 tahun berjualan hilang dari pencarian. CS menyebut indikasi aktivitas mencurigakan tanpa menjelaskan indikasi tersebut.

## Catatan

Tool ini bukan nasihat hukum. Kategori terlarang, jalur banding, dan batas waktu berbeda per marketplace. Skor argumen dan tingkat dampak adalah heuristik tool, bukan penilaian resmi. Semua angka uang berasal dari input Anda, bukan tarif atau statistik yang dikarang. Contoh ekonomi pada data seed adalah ilustrasi. Selalu cocokkan dengan syarat layanan dan Seller Center. Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.
