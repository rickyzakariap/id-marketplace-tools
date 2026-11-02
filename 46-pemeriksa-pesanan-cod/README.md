# Pemeriksa Pesanan COD Berisiko

Pesanan COD masuk dari akun yang tidak dikenal, pembeli tidak membalas chat, sempat mengajukan pembatalan lalu menariknya kembali, sementara batas kirim semakin dekat. Penjual dihadapkan pada dua risiko: mengirim dan menanggung retur, atau menahan paket dan dianggap terlambat. Kasus 31 Oktober 2026 di Media Konsumen menunjukkan toko Golto Accessories mengalami situasi ini dan khawatir terkena penalti ganda saat menunggu keputusan CS.

Tool ini membantu menghitung laba dan kerugian terburuk, menilai indikasi pesanan berisiko, menyusun bukti, melacak kasus, dan membuat surat tertulis ke platform.

Berbeda dari [Biaya Retur Tracker](../31-biaya-retur-tracker/) yang menghitung kerugian setelah retur terjadi, [Pelacak Poin Penalti](../38-pelacak-poin-penalti/) yang membahas poin dan banding, [Klaim Paket Hilang](../40-klaim-paket-hilang/) yang membahas paket hilang atau rusak, dan [Pelacak Ulasan Palsu](../43-pelacak-ulasan-palsu/) yang membahas ulasan, tool ini fokus pada **keputusan sebelum paket dikirim**: identifikasi risiko, batas waktu, bukti, dan permintaan keputusan tertulis.

## Run

```
npm install
npm start
```

Buka http://localhost:8046

## Fitur

- Hitung laba bersih bila pesanan berhasil, kerugian retur utuh, kerugian retur rusak sebelum klaim, estimasi klaim maksimal, dan sisa kerugian setelah klaim. Semua nominal berasal dari input penjual.
- Biaya layanan default 0 karena potongan berbeda per toko dan per program. Tool tidak mengarang tarif.
- Batas pembayaran COD per metode: Rp 500.000 untuk Instant, Rp 5.000.000 untuk Reguler dan Hemat Kargo, dan Rp 1.000.000 untuk Pos Reguler.
- Patokan klaim perlindungan COD: 10 kali ongkos kirim atau harga barang, maksimal Rp 1.000.000, mengikuti nominal terendah untuk Reguler, Hemat Kargo, dan Pos Reguler. Instant memakai harga barang maksimal Rp 10.000.000.
- Skor risiko dari 12 indikator berbobot dan status pembeli. Skor diberi label heuristik, bukan bukti pembeli fiktif.
- Enam status pesanan, lima status pembeli, lima masalah utama, dan delapan status kasus.
- Jadwal: umur pesanan, sisa hari ke batas kirim, dan batas respons pembatalan 1x24 jam. Retur memakai batas konfirmasi 7 hari kalender.
- Skor kesiapan 13 bukti dengan lima bukti kritis: tangkapan layar pesanan, riwayat chat, bukti pengajuan pembatalan, nomor tiket CS, dan video pengemasan.
- Catatan kasus per pesanan dengan status, nomor tiket, tanggal follow-up terakhir, peringatan otomatis, ringkasan nilai terbuka, dan ekspor CSV.
- Tiga generator surat: permintaan pembatalan tanpa penalti, permintaan peninjauan pembeli COD, dan permintaan klaim retur rusak.
- Peringatan untuk platform selain Shopee: batas pembayaran, aturan pembatalan, dan patokan klaim di tool ini berasal dari Shopee dan tidak boleh dipakai langsung untuk platform lain.
- Sumber berita dan dokumentasi Seller Center ditampilkan di UI dan README. Tidak ada tingkat keberhasilan, SLA platform, atau angka kompensasi yang dikarang.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - platform, metode COD, status pesanan, status pembeli, 12 indikator, 13 bukti, status kasus, masalah, jenis surat, sumber, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, cod_method, order_status, buyer_status, order_id, store_name, product_name, order_date, ship_deadline, cancel_requested_date, return_received_date, followup_date, order_value, hpp, packaging_cost, handling_cost, extra_cost, shipping_cost, fee_rate, signals, evidence.
- POST /api/readiness - body: items berisi id bukti yang sudah tersedia.
- POST /api/letter - body: data pesanan dan toko, ditambah seller_name, contact, ticket, chronology, letter_type.
- GET /api/cases - daftar kasus, jumlah terbuka, risiko tinggi, retur, nilai total, kerugian terburuk, kerugian terbuka, skor tertinggi, dan sisa hari terdekat.
- POST /api/cases - tambah catatan kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up terakhir, atau catatan.
- DELETE /api/cases/:id - hapus catatan.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8046/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","cod_method":"reguler","order_status":"belum_dikirim","buyer_status":"tidak_merespons","order_id":"261026KUHA9AN3","store_name":"Toko Contoh","store_id":"toko-contoh","product_name":"Aksesori Rajut Premium","order_date":"2026-10-31","ship_deadline":"2026-11-03","cancel_requested_date":"2026-11-01","return_received_date":"","followup_date":"2026-11-01","order_value":185000,"hpp":110000,"packaging_cost":3000,"handling_cost":5000,"extra_cost":0,"shipping_cost":10000,"fee_rate":0,"signals":["cancel_withdrawn","buyer_no_response","address_change","high_value"],"evidence":["order_screenshot","chat_history","cancel_request","cs_ticket","cancel_withdrawal","shipping_deadline","timeline"]}'
```

Hasil pada 2 November 2026: risiko 47/100 (tinggi), laba bersih bila berhasil Rp 67.000, kerugian retur rusak setelah klaim Rp 18.000, estimasi klaim maksimal Rp 100.000, kesiapan bukti 61/100, verdict tahan dulu dan minta keputusan tertulis.

## Test

```
npm test
```

54 test Node tanpa framework tambahan: format angka dan tanggal, selisih hari, perhitungan laba dan kerugian, batas klaim per metode, batas pembayaran COD, validasi tanggal dan nominal, tiga fase tenggat kirim, batas respons pembatalan 1x24 jam, batas retur 7 hari, bobot risiko, kesiapan bukti kritis, verdict per status, validasi kasus, isi tiga surat, ringkasan kasus, meta, fallback, dan tidak adanya em dash.

## Sumber utama

- Media Konsumen, 31 Oktober 2026: toko Golto Accessories menerima pesanan COD 26 Oktober 2026 dari akun yang tidak merespons chat. Pembeli sempat mengajukan pembatalan lalu menariknya. Penjual khawatir dipaksa mengirim atau terkena penalti ganda. Ini pengaduan penjual, bukan putusan platform.
- Pusat Edukasi Penjual Shopee, FAQ COD (3 September 2026): batas pembayaran Rp 500.000 untuk Instant, Rp 5.000.000 untuk Reguler dan Hemat Kargo, dan Rp 1.000.000 untuk Pos Reguler. Pembeli yang tidak dapat dihubungi, menolak, atau tidak membayar dan membatalkan 2 kali dalam 60 hari kalender dapat dinonaktifkan dari COD selama 60 hari. Penjual diberi 7 hari kalender untuk mengonfirmasi keadaan barang retur.
- Pusat Edukasi Penjual Shopee, Perlindungan Penjual terhadap Pembeli COD (24 Juli 2026): mekanisme klaim dan penanganan pembeli COD bermasalah.
- Pusat Edukasi Penjual Shopee, Mengelola Pengiriman yang Gagal (29 Oktober 2026): paket COD ditolak, alamat salah, atau kendala pengiriman akan dikembalikan ke penjual.
- Pusat Edukasi Penjual Shopee, Tentang Pembatalan Pesanan (27 Juli 2026): pembatalan non-instan memerlukan respons penjual dalam 1x24 jam. Jika tidak direspons, pesanan dibatalkan otomatis.
- Pusat Edukasi Penjual Shopee, Tentang COD Cek Dulu (diakses 2 November 2026): pembeli yang tidak dapat dihubungi, tidak membayar, atau menolak paket sampai 3 kali dalam 30 hari kalender dapat diblokir dari COD Cek Dulu dan COD selama 60 hari. Klaim memakai 10 kali ongkos kirim atau harga barang, maksimal Rp 1.000.000, mengikuti nominal terendah.

## Catatan

Tool ini alat bantu keputusan operasional, bukan nasihat hukum. Skor risiko bersifat heuristik dan tidak membuktikan pembeli fiktif. Batas pembayaran, aturan pembatalan, dan patokan klaim yang dipakai berasal dari Shopee, jadi jangan memakai angka yang sama untuk platform lain tanpa mencocokkan kebijakan platform tersebut. Keputusan pembatalan, penalti, dan klaim tetap berada pada platform. Simpan semua bukti sebelum mengubah status pesanan, membatalkan, atau menyerahkan paket. Jangan membagikan OTP, password, atau kode verifikasi kepada pihak yang tidak berwenang.
