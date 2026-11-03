# Pemeriksa Realisasi Diskon 50%

Diskon biaya layanan minimal 50 persen untuk UMK sudah berlaku sejak 25 Oktober 2026, tetapi potongannya tidak otomatis. Penjual harus mengajukan lewat SAPA UMKM, platform menarik data dalam 5 hari kerja, lalu memverifikasi dalam 10 hari kerja. Setelah itu pun, potongan di settlement bisa belum muncul, hanya muncul sebagian, atau hanya berlaku untuk sebagian SKU. Pemberitaan 25 Oktober sampai 2 November 2026 masih menyoroti kesenjangan antara aturan yang berlaku dan realisasi yang dirasakan pedagang kecil.

Tool ini membandingkan biaya layanan yang seharusnya setelah diskon dengan biaya yang benar-benar ditagih, menghitung selisih dan potensi kebocoran tahunan, menilai tahap verifikasi dan indikasi masalah, menyusun bukti, melacak kasus per periode, serta membuat surat permintaan status, keberatan, atau eskalasi.

Berbeda dari [Pemeriksa Insentif UMK](../23-umkm-service-fee-checker/) dan [Insentif Permen 2026](../34-insentif-permen-2026/) yang mengecek kelayakan dan memperkirakan penghematan, serta [Pemeriksa Potongan Pesanan](../47-pemeriksa-potongan-pesanan/) yang mengaudit potongan pesanan batal atau retur, tool ini fokus pada **realisasi diskon 50 persen setelah pengajuan**: apakah angka di settlement benar-benar turun, sebesar apa selisihnya, dan pada tahap mana prosesnya tertahan.

## Run

```
npm install
npm start
```

Buka http://localhost:8048

## Fitur

- Perbandingan biaya layanan dasar sebelum diskon, biaya seharusnya setelah diskon, biaya yang ditagih, selisih, persentase selisih, realisasi potongan, dan potensi kebocoran per tahun.
- Dasar biaya bisa diambil langsung dari invoice atau dihitung dari omzet dikali tarif. Bila dihitung, tool menandainya sebagai perkiraan dan meminta pencocokan invoice.
- Enam platform, empat skala usaha, dan pengecekan syarat: produk dalam negeri, SAPA UMKM, verifikasi platform, akun berisiko tinggi, dan rekam jejak.
- Tahap verifikasi mengikuti aturan 5 hari kerja penarikan data dan 10 hari kerja verifikasi, termasuk deteksi lewat 15 hari kerja, pengajuan sebelum tanggal efektif, dan verifikasi yang sudah tercatat.
- 14 indikator otomatis dan 6 indikator manual dengan skor heuristik 0 sampai 100. Skor bukan putusan bahwa platform melanggar aturan.
- Skor kesiapan 13 bukti dengan lima bukti kritis: akun SAPA UMKM, bukti verifikasi, settlement setelah tanggal aktif, bukti biaya dasar, dan daftar SKU.
- Tujuh status kasus, peringatan otomatis untuk kasus terbuka yang tua atau follow-up yang lama, ringkasan selisih, dan ekspor CSV.
- Tiga generator surat: permintaan status verifikasi, keberatan realisasi diskon, dan permohonan fasilitasi ke Kementerian UMKM.
- Peringatan bahwa komponen yang dipotong bisa berbeda per platform dan diskon tidak berlaku surut. Angka dasar harus diambil dari invoice, bukan ditebak dari total biaya layanan.
- Sumber berita dan dasar aturan ditampilkan di UI dan README. Tidak ada tingkat keberhasilan, SLA, atau angka kompensasi yang dikarang.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - platform, skala, syarat, 14 indikator otomatis, 6 indikator manual, 13 bukti, status kasus, jenis surat, sumber, kebijakan, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, scale, domestic, sapa, verified, verified_date, high_risk, record, store_name, store_id, seller_name, contact, ticket, period_start, period_end, application_date, gross_sales, fee_rate, fee_basis, discount_pct, actual_fee, periods_per_year, manual_signals, evidence.
- POST /api/readiness - body: items berisi id bukti yang sudah tersedia.
- POST /api/letter - body: data toko dan angka settlement, ditambah seller_name, contact, ticket, chronology, letter_type.
- GET /api/cases - daftar kasus, jumlah terbuka, total selisih, selisih terbuka, umur kasus terbuka tertua, potensi bocor tahunan, peringatan, dan ringkasan per status.
- POST /api/cases - tambah catatan kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up terakhir, sinyal, atau bukti.
- DELETE /api/cases/:id - hapus catatan.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8048/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","scale":"mikro","domestic":"ya","sapa":"ya","verified":"ya","verified_date":"2026-10-31","high_risk":"tidak","record":"ya","store_name":"Toko Contoh Lokal","store_id":"toko-contoh-lokal","period_start":"2026-10-26","period_end":"2026-11-02","application_date":"2026-10-25","gross_sales":15000000,"fee_rate":10,"fee_basis":1500000,"discount_pct":50,"actual_fee":1200000,"periods_per_year":12,"manual_signals":["sebagian_sku"],"evidence":["sapa_account","verification_notice","settlement_after","fee_basis_proof","sku_list"]}'
```

Hasil pada 3 November 2026: biaya dasar Rp 1.500.000, biaya seharusnya Rp 750.000, yang ditagih Rp 1.200.000, selisih Rp 450.000, realisasi potongan 20 persen dari 50 persen yang seharusnya, potensi bocor Rp 5.400.000 per tahun, indikasi 47/100, kesiapan bukti 72/100, verdict diskon belum diterapkan penuh.

## Test

```
npm test
```

79 test Node tanpa framework tambahan: format angka dan tanggal, selisih hari, hari kerja, perhitungan dasar dan biaya setelah diskon, toleransi selisih, dasar dari omzet dan tarif, tahap verifikasi, kelayakan, 14 indikator otomatis, bobot indikasi, kesiapan bukti kritis, validasi tanggal dan nominal, validasi kasus, ringkasan dan peringatan, isi tiga surat, meta, sumber, serta tidak adanya em dash dan id yang hilang di halaman statis.

## Sumber utama

- Kompas.id, 27 Oktober 2026: diskon 50 persen biaya admin berlaku 25 Oktober 2026. UMKM meminta potongan otomatis, platform meminta masa transisi. Mekanisme teknis mengacu Kepmen UMKM 398/2026.
- Bisnis.com, 26 Oktober 2026: Kementerian UMKM memberlakukan potongan biaya layanan paling sedikit 50 persen untuk UMK penjual produk dalam negeri mulai 25 Oktober 2026. idEA meminta masa transisi dan menyebut verifikasi dilakukan platform.
- UKMINDONESIA.ID, 25 Oktober 2026: potongan tidak langsung aktif. Pengajuan lewat SAPA UMKM harus lolos dua tahap verifikasi. Dalam skenario terlama, jarak dari pengajuan sampai potongan aktif sekitar tiga minggu. Komponen yang dipotong adalah biaya administrasi, komisi, atau biaya aplikasi dasar toko.
- Industry.co.id, 2 November 2026: kebijakan masih menjadi harapan bagi pedagang kecil, menunjukkan kesenjangan antara aturan dan realisasi yang dirasakan seller.
- ANTARA News, 16 Oktober 2026: insentif mencakup biaya administrasi, komisi, atau biaya aplikasi dasar toko. Syarat: skala mikro atau kecil, hanya produk dalam negeri, tidak memanipulasi transaksi, rekam jejak baik. Platform memverifikasi paling lama 10 hari kalender sejak menerima data.
- detikFinance, 22 Oktober 2026: kebijakan berlaku permanen selama pelaku masih usaha mikro atau kecil dan menjual produk dalam negeri. Kepmen UMKM ditandatangani 25 September 2026. Platform menarik data dari SAPA UMKM dalam 5 hari kerja, lalu verifikasi maksimal 10 hari.
- Kompas.com, 7 Oktober 2026: sekitar 42.000 seller e-commerce teridentifikasi menjual produk lokal. Insentif hanya untuk usaha mikro dan kecil dengan omzet maksimal Rp 15 miliar per tahun.
- CNN Indonesia, 1 September 2026: contoh Menteri UMKM, dari biaya layanan sekitar Rp 20.000 pada transaksi Rp 100.000, porsi biaya administrasi umumnya 40 sampai 50 persen. Karena cakupan komponen bisa berbeda, tool ini meminta angka dasar dari invoice.
- DailySocial.ID, 23 Juni 2026: Permen UMKM 3/2026 Pasal 15 ayat (1) mewajibkan PPMSE bukan UMKM memberi insentif potongan biaya layanan kepada UMK terverifikasi untuk setiap transaksi produk dalam negeri.
- Radar Surabaya Bisnis, 13 Agustus 2026: biaya layanan marketplace bervariasi 10 sampai 18 persen dari nilai transaksi, belum termasuk promosi dan iklan. Angka ini hanya kisaran pembanding, bukan tarif bawaan.

## Catatan

Tool ini alat bantu audit operasional, bukan nasihat hukum. Selisih dihitung dari input Anda, bukan dari data resmi platform. Cakupan komponen yang dipotong bisa berbeda per platform, jadi cocokkan angka dasar dengan invoice dan kartu tarif. Diskon tidak berlaku surut untuk periode sebelum 25 Oktober 2026. Keputusan verifikasi, pemberian insentif, dan koreksi tetap berada pada platform dan Kementerian UMKM. Simpan tangkapan layar SAPA UMKM, bukti verifikasi, settlement sebelum dan sesudah, serta rincian komponen sebelum mengubah status kasus. Jangan membagikan OTP, password, atau kode verifikasi kepada pihak yang tidak berwenang.
