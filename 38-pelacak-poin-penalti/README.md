# Pelacak Poin Penalti

Poin penalti menumpuk, banding sudah disetujui, tetapi poin muncul lagi? Tool ini membantu seller membaca posisi poin, menghitung sisa ke pembatasan akun, mengecek tenggat banding dan tanggal reset, mencatat riwayat banding, serta membuat surat permintaan penjelasan tertulis.

Berbeda dari [Pemulih Toko](../37-pemulih-toko/) yang dipakai setelah toko dibekukan, tool ini dipakai untuk mencegah pembatasan dan mengawal hasil banding yang tidak konsisten.

## Run

```
npm install
npm start
```

Buka http://localhost:8038

## Fitur

- Analisis poin untuk 6 marketplace. Shopee memakai tabel tingkatan resmi, platform lain memakai ambang manual dari Seller Center.
- Tingkatan Shopee: 0 sampai 2 (tanpa pembatasan), 3 sampai 5 (Tingkat I), 6 sampai 8 (Tingkat II), 9 sampai 11 (Tingkat III), 12 sampai 14 (Tingkat IV), 15 atau lebih (Tingkat V).
- Dampak yang sudah aktif: promosi dan peringkat dibatasi mulai 3 poin, unggah dan ubah produk diblokir mulai 12 poin, pembatasan akun mulai 15 poin.
- Hitung sisa poin ke ambang pembatasan dan ke tingkatan berikutnya.
- Tanggal reset kuartal otomatis: Senin terakhir bulan Maret, Juni, September, dan Desember (aturan Shopee).
- Tenggat banding: tanggal poin diterbitkan ditambah 14 hari untuk Shopee, dengan penanda terbuka, mendesak, lewat, atau manual untuk platform lain.
- Estimasi kerugian bila akun dibatasi 28 hari, dihitung dari pesanan per hari, nilai pesanan, dan margin milik seller.
- Catatan kasus dan banding: referensi pesanan, poin, tanggal, status banding, hasil, dan apakah poin benar-benar direset.
- Deteksi poin muncul kembali: kasus yang sudah diterima dan direset, lalu muncul lagi dengan referensi yang sama, ditandai merah.
- Ekspor catatan ke CSV.
- Generator dua surat: banding poin dan permintaan penjelasan saat poin muncul kembali setelah banding disetujui.
- Sumber ditampilkan di UI. Semua angka poin dan kerugian adalah estimasi dari input seller, bukan data resmi platform.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - platform, jenis pelanggaran, tingkatan, sumber, dan aturan Shopee yang dipakai.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, violation, points, threshold, last_point_date, appeal_window_days, orders_per_day, aov, margin_pct, restriction_days.
- POST /api/letter - body: letter_type (banding atau poin-kembali), platform, seller_name, store_name, store_id, contact, ref, points, last_point_date, appeal_date, appeal_result_date, chronology.
- GET /api/cases - daftar kasus, total poin aktif, dan temuan poin yang muncul kembali.
- POST /api/cases - tambah kasus.
- PATCH /api/cases/:id - ubah status dan data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat 4 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8038/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","violation":"fake_package","points":9,"last_point_date":"2026-10-17","appeal_window_days":14,"orders_per_day":100,"aov":150000,"margin_pct":20,"restriction_days":28}'
```

Hasil: risiko waspada, Tingkat III, sisa 6 poin ke pembatasan, reset 28 Desember 2026, tenggat banding 31 Oktober 2026, estimasi laba hilang Rp 84.000.000 bila dibatasi 28 hari.

## Test

```
npm test
```

21 test Node tanpa framework tambahan: batas tingkatan, reset kuartal, tenggat banding, ambang manual, validasi, deteksi poin kembali, dua jenis surat, dan larangan em dash.

## Sumber utama

- Media Konsumen, 21 Oktober 2026: toko Shopee lebih dari 5 tahun ditutup karena poin, banding disetujui dan poin direset ke 0, lalu poin muncul lagi dan toko terancam ditutup kedua kali. Empat transaksi ditandai paket kosong atau tidak lengkap, tetapi laporan ditutup tanpa penjelasan substansi.
- Pusat Edukasi Penjual Shopee, 8 Oktober 2026 (FAQ Sistem Poin Penalti): tingkatan 0, I, II, III, IV, V dan reset pada Senin terakhir setiap kuartal.
- Pusat Edukasi Penjual Shopee, 17 September 2026 (Sistem dan Ketentuan Poin Penalti): rincian poin per pelanggaran, termasuk paket kosong 6 poin (pertama), 9 poin (kedua), dan pembatasan akun (ketiga).
- Pusat Edukasi Penjual Shopee, 9 Oktober 2026 (Pengajuan Banding Penalti): banding lewat Seller Centre dalam 14 hari sejak poin diterbitkan, proses sekitar 7 hari kalender.
- Pusat Edukasi Penjual Shopee (Kesehatan Toko): akumulasi 15 poin berujung pembatasan akun 28 hari yang bisa diperpanjang.
- Media Konsumen, 1 Mei 2022: penalti Tokopedia sampai minus 210 poin. Media Konsumen, 19 Januari 2025: produk diblokir dan 12 poin di TikTok Shop. Dua kasus lama ini menunjukkan pola lintas platform, bukan aturan resmi platform saat ini.

## Catatan

Aturan poin, ambang, reset, dan banding berbeda per marketplace dan bisa berubah. Selalu cocokkan angka dengan halaman Penalti Saya di Seller Center. Tool ini bukan nasihat hukum dan tidak menjamin poin dihapus. Jangan pernah membagikan OTP, password, atau kode verifikasi kepada siapa pun.
