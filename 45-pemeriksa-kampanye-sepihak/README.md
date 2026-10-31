# Pemeriksa Kampanye Sepihak

Produk tiba-tiba ikut kampanye marketplace dengan harga lebih rendah tanpa persetujuan penjual. Kasus 29 Oktober 2026 di TikTok Shop menunjukkan produk toko COZYON tercatat di Voucher Boost Campaign dengan harga Rp22.410 dari harga normal Rp35.900, sementara penjual tidak merasa pernah mendaftar. Tool ini membantu menghitung dampak harga, menilai indikasi pendaftaran tanpa persetujuan, menyusun bukti, melacak kasus, dan membuat surat permintaan audit.

Berbeda dari [Program Diskon Checker](../35-program-diskon-checker/) yang menghitung margin untuk program diskon yang penjual pilih sendiri, tool ini mengaudit **keikutsertaan kampanye yang diduga terjadi tanpa persetujuan** dan meminta bukti pendaftaran ke platform. Berbeda juga dari [Pelacak Kunci Promosi](../42-pelacak-kunci-promosi/) yang membahas akses voucher yang hilang.

## Run

```
npm install
npm start
```

Buka http://localhost:8045

## Fitur

- Hitung dampak per unit: diskon dari harga normal, laba normal, laba kampanye, selisih laba, total dampak dari unit terjual, kekurangan omzet, harga minimum agar tidak rugi, dan jumlah penjualan normal untuk menutup dampak.
- Biaya layanan tidak memakai tarif default karena potongan berbeda per toko dan per program. Semua angka berasal dari input penjual dan harus dicocokkan dengan rincian settlement.
- Penilaian indikasi 10 fakta dengan bobot: tidak ada catatan pendaftaran, harga berbeda, tidak ada pemberitahuan, klaim pop-up, pendaftaran oleh tim operasional, auto-registration, tidak bisa keluar, harga terkunci, tidak ada bukti persetujuan, dan lonjakan pesanan. Skor diberi label heuristik, bukan bukti hukum.
- Tujuh metode pendaftaran dengan catatan risiko: manual, sekali klik, auto-registration atau CFV auto-registration, tim operasional, WhatsApp resmi, pop-up, dan tidak diketahui.
- Skor kesiapan 13 bukti dengan lima bukti kritis: tangkapan layar harga normal, halaman kampanye, riwayat pendaftaran, bukti persetujuan, dan ekspor transaksi.
- Jadwal kampanye: belum mulai, berjalan, atau selesai, plus umur temuan dan umur follow-up terakhir.
- Catatan kasus per produk dan kampanye dengan status, nomor tiket, tanggal follow-up, peringatan otomatis, ringkasan dampak terbuka, dan ekspor CSV.
- Generator surat permintaan audit yang meminta waktu pendaftaran, kanal, akun yang menyetujui, bukti persetujuan, dasar harga, penghentian produk, verifikasi dampak, dan SLA. Surat tidak menjanjikan kompensasi.
- Sumber berita dan dokumentasi Seller Center ditampilkan di UI dan README. Tidak ada tarif, statistik, atau tingkat keberhasilan yang dikarang.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - platform, metode pendaftaran, 10 indikasi, 13 bukti, status kasus, masalah, sumber, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, enrollment_method, campaign_name, campaign_start, campaign_end, normal_price, campaign_price, seller_price, hpp, fee_rate, units_sold, product_name, discovered_date, followup_date, indicators, evidence.
- POST /api/readiness - body: items berisi id bukti yang sudah tersedia.
- POST /api/letter - body: data toko, produk, kampanye, harga, penjual, kontak, tiket, masalah, kronologi.
- GET /api/cases - daftar kasus, jumlah terbuka, kampanye berjalan, unit, dampak total, dampak terbuka, skor indikasi tertinggi, dan hari ke akhir kampanye terdekat.
- POST /api/cases - tambah catatan kasus.
- PATCH /api/cases/:id - ubah status atau tanggal follow-up.
- DELETE /api/cases/:id - hapus catatan.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8045/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"tiktok","enrollment_method":"popup","campaign_name":"Voucher Boost Campaign Payday","campaign_start":"2026-10-12","campaign_end":"2026-11-04","normal_price":35900,"campaign_price":22410,"seller_price":22410,"hpp":18000,"fee_rate":10,"units_sold":6870,"product_name":"Sandal Slipper Premium","discovered_date":"2026-10-25","followup_date":"2026-10-29","indicators":["no_registration_record","price_differs","no_notification","popup_claim","no_consent_log","sales_spike"],"evidence":["price_screenshot","campaign_page","transaction_export","campaign_notification","chat_rm","price_history","ads_live_data","settlement","timeline"]}'
```

Hasil pada 31 Oktober 2026: kampanye berjalan, 4 hari lagi ke akhir, diskon 37,6%, laba normal Rp14.310 per unit, laba kampanye Rp2.169 per unit, estimasi dampak Rp83.408.670 dari 6.870 unit, indikasi 60/100 (tinggi), kesiapan bukti 67/100.

## Test

```
npm test
```

44 test Node tanpa framework tambahan: format angka dan tanggal, selisih hari, perhitungan laba normal dan kampanye, harga yang diterima penjual, rugi di bawah HPP, unit nol, break even, tiga fase kampanye, validasi tanggal dan nominal, bobot indikasi, kesiapan bukti kritis, isi surat, contoh, validasi kasus, peringatan kasus, ringkasan, meta, dan tidak adanya em dash.

## Sumber utama

- Media Konsumen, 29 Oktober 2026: toko COZYON menemukan produknya ikut Voucher Boost Campaign dengan harga lebih rendah tanpa diketahui. Platform menyebut pendaftaran lewat pop-up dan dianggap dikonfirmasi. Estimasi dampak Rp92.676.021 adalah klaim penjual, bukan angka resmi platform.
- TikTok Shop by Tokopedia Seller Center, Campaign Produk (30 Desember 2025): harga campaign diisi otomatis sebagai rekomendasi, stok campaign dikunci setelah disetujui, dan tim operasional dapat mendaftarkan produk atas nama penjual.
- TikTok Shop by Tokopedia Seller Center, Co-Funded Voucher Campaign Auto Registration (diakses 31 Oktober 2026): auto-registration CFV mendaftarkan produk terpilih ke kampanye berikutnya memakai harga kampanye sebelumnya, dan harga registrasi belum bisa diubah pada versi saat artikel diakses.
- TikTok Shop by Tokopedia Seller Center, Guide to Campaign Confirmation via Official WhatsApp (diakses 31 Oktober 2026): penjual dapat mendaftarkan produk dengan membalas YES, lalu harga otomatis disesuaikan menurut aturan kampanye.
- TikTok Shop by Tokopedia Seller Center, Pendaftaran Sekali Klik Campaign (20 Oktober 2025): pendaftaran sekali klik dapat mendaftarkan semua produk yang memenuhi syarat, dan sebagian sub-campaign bersifat wajib serta otomatis disertakan.
- JDIH Kementerian Perdagangan, Permendag 19/2026 (8 Juni 2026): PPMSE wajib menginformasikan biaya secara transparan, membuat biaya yang disepakati dalam perjanjian tertulis atau kontrak elektronik, dan menyediakan layanan pengaduan dengan SLA.

## Catatan

Tool ini alat bantu audit, bukan nasihat hukum. Kasus yang dipakai sebagai sumber adalah pengaduan penjual, bukan putusan resmi. Skor indikasi bersifat heuristik dan tidak membuktikan ada atau tidaknya persetujuan. Keputusan pendaftaran, harga, dan kompensasi tetap berada pada platform. Simpan semua bukti sebelum mengubah harga, stok, atau keluar dari kampanye. Jangan membagikan OTP, password, atau kode verifikasi kepada pihak yang tidak berwenang.
