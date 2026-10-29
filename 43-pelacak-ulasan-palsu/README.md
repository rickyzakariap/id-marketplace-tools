# Pelacak Ulasan Palsu

Toko mendapat bintang 1, padahal pembeli bilang tidak pernah membuka aplikasi atau memberi ulasan? Tool ini mengukur dampak rating dan laba, menilai indikasi ulasan palsu, menyiapkan bukti, melacak tiket, dan membuat surat permintaan pemeriksaan.

Berbeda dari [Review Sentiment Analyzer](../03-review-sentiment-analyzer/) yang menganalisis isi ulasan asli, tool ini menangani ulasan yang diduga tidak sah. Berbeda juga dari [Pemulih Toko](../37-pemulih-toko/) yang memulihkan akun atau NIK, dan [Pelacak Kunci Promosi](../42-pelacak-kunci-promosi/) yang menangani voucher gagal dipakai.

## Run

```
npm install
npm start
```

Buka http://localhost:8043

## Fitur

- Skor indikasi 0 sampai 100 dari 10 indikator: pembeli menyangkal, bintang tidak selaras dengan teks, pesanan batal atau tidak ditemukan, ulasan muncul sebelum pesanan selesai, alamat fiktif, serangan beruntun, akun yang sama menyerang beberapa toko, identitas penjual dipakai akun lain, pembeli tidak membalas chat, dan tiga atau lebih ulasan bintang 1. Skor ini heuristik tool, bukan penilaian resmi.
- Kalkulator rating: rata-rata baru, penurunan poin, dampak satu ulasan bintang 1, dan jumlah ulasan bintang 5 yang dibutuhkan untuk kembali ke target. Memakai asumsi rata-rata sederhana, karena marketplace tidak mempublikasikan rumus resminya.
- Pemisahan jenis penilaian. Menurut Pusat Bantuan Shopee, peringkat rendah untuk Layanan Pengiriman dan Layanan Penjual tidak dihitung ke peringkat produk. Hanya Kualitas Produk yang dihitung. Ulasan pada pesanan batal atau retur juga tidak memenuhi syarat dinilai.
- Batas 120 hari. Pembeli dapat mengubah penilaian satu kali dalam 120 hari setelah pesanan selesai. Tool menghitung tanggal batas dan sisa hari, lalu memberi peringatan bila sudah lewat.
- Kalkulator dampak: omzet hilang, laba hilang, penjualan hilang per hari, dan tingkat dampak. Semua angka berasal dari input Anda, bukan statistik yang dikarang.
- Skor kesiapan 13 bukti. Lima bukti kritis: screenshot ulasan, screenshot pesanan, pernyataan pembeli, riwayat chat, dan nomor tiket.
- Catatan kasus per toko dengan status, umur kasus, nomor tiket, fakta, bukti, dan ekspor CSV.
- Peringatan otomatis untuk laporan ditolak, batas 120 hari lewat atau tinggal 14 hari, indikasi kuat tetapi bukti kurang, ulasan layanan yang tidak memengaruhi peringkat produk, pembeli pasif, dan pola serangan beruntun.
- Generator surat permintaan pemeriksaan log dan penghapusan ulasan, dengan kutipan aturan resmi untuk Shopee. Surat tidak menjanjikan penghapusan.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, jenis penilaian, status, opsi fakta, bukti, sumber, default, dan batas 120 hari.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, status, store_name, store_id, order_id, order_date, review_date, resolved_date, last_follow_up, current_rating, total_ratings, bad_reviews, target_rating, review_type, price, cost, units_before, units_during, facts, evidence.
- POST /api/readiness - body: items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data toko, penjual, kontak, kronologi, angka, fakta, dan bukti.
- GET /api/cases - daftar kasus, jumlah terbuka, jumlah dihapus, ulasan bermasalah, total laba hilang, total omzet hilang, dan umur kasus terbuka.
- POST /api/cases - tambah kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up, atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8043/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","store_name":"Toko Contoh","status":"tiket_cs","order_date":"2026-09-18","review_date":"2026-09-28","current_rating":4.8,"total_ratings":150,"bad_reviews":2,"target_rating":4.8,"review_type":"product_quality","price":35000,"cost":25000,"units_before":25,"units_during":17,"facts":{"buyer_denies":"tidak_tahu","review_text_match":"tidak_selaras","order_status":"selesai","address_valid":"tidak_valid","burst":"ya","same_account":"ya","identity_abuse":"ya","chat_reply":"tidak_dibalas"},"evidence":["review_screenshot","order_screenshot","chat_history","tickets","reviewer_profile","address_proof","burst_list","identity_proof","rating_history","chronology"]}'
```

Hasil pada 28 Oktober 2026: rating 4,80 turun ke 4,75, dibutuhkan 38 ulasan bintang 5 untuk kembali ke 4,80, laba hilang Rp 2.400.000 selama 30 hari, skor indikasi 60/100 dengan pola penyalahgunaan identitas, batas ubah ulasan 16 Januari 2027, dan kesiapan bukti 77%.

## Test

```
npm test
```

18 test Node tanpa framework tambahan: rating produk, pengecualian rating layanan pengiriman, target 5,0 yang tidak tercapai, validasi HPP dan tanggal, tanggal pesanan opsional, skor indikasi, kesiapan bukti kritis, contoh dan surat, batas 120 hari, validasi kasus, ringkasan, peringatan kasus, dan format rupiah.

## Sumber utama

- Media Konsumen, 28 Oktober 2026: toko sablon Hedos Printing dengan rating sekitar 4,9 menerima bintang 1 dari pesanan selesai. Pembeli menyatakan belum membuka aplikasi Shopee saat penilaian muncul. CS menyebut penghapusan ulasan memerlukan persetujuan pembeli.
- Media Konsumen, 14 Oktober 2026: akun memakai nama KTP dan foto AI milik penjual, memasang alamat fiktif, lalu membuat pesanan dan ulasan bintang 1 di dua toko penjual. Laporan penjual ditutup, akun masih aktif.
- Pusat Bantuan Shopee, artikel 73047: pesanan batal atau retur tidak memenuhi syarat dinilai, peringkat Layanan Pengiriman dan Layanan Penjual tidak dihitung ke peringkat produk, dan penilaian yang tidak selaras dengan ulasan dapat dihapus.
- Pusat Bantuan Shopee, artikel 73045: pembeli dapat mengubah penilaian atau ulasan satu kali dalam 120 hari setelah pesanan selesai.
- Pusat Edukasi Penjual Shopee, artikel 6859: penjual dapat merespons penilaian satu kali dan tidak dapat mengubahnya, serta dapat melaporkan ulasan yang tidak pantas.

## Catatan

Tool ini bukan nasihat hukum dan tidak menjamin ulasan dihapus. Aturan penilaian dan jalur laporan dapat berubah. Verifikasi kutipan aturan di pusat bantuan sebelum mengirim laporan. Semua angka uang berasal dari input Anda. Contoh ekonomi pada data seed adalah ilustrasi. Jangan membeli ulasan positif, menyerang balik, atau membagikan OTP, password, dan kode verifikasi kepada siapa pun.
