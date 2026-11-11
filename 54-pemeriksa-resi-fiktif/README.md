# Pemeriksa Resi Fiktif

Riwayat resi bisa berubah menjadi ATS (alamat tidak sesuai) satu menit setelah paket dibawa kurir, lalu retur pusat beberapa puluh menit kemudian. Tool ini menyorot jeda waktu yang tidak wajar, menghitung kerugian kas, memetakan bukti, dan menyiapkan surat klaim ke ekspedisi atau marketplace.

Berbeda dari [Pelacak Klaim Paket Hilang dan Rusak](../40-klaim-paket-hilang/) yang menghitung kompensasi paket hilang atau rusak, tool ini fokus pada status pengantaran yang diduga tidak benar. Berbeda juga dari [Biaya Retur Tracker](../31-biaya-retur-tracker/) yang menghitung biaya retur, [Pemeriksa Refund Tanpa Retur](../50-pemeriksa-refund-tanpa-retur/) yang fokus pada barang tidak kembali, [Pemeriksa Pesanan COD](../46-pemeriksa-pesanan-cod/) yang memutuskan pengiriman sebelum paket keluar, dan [Pemeriksa Tenggat Banding Retur](../51-pemeriksa-tenggat-banding-retur/) yang menghitung tenggat banding.

## Run

```
npm install
npm start
```

Buka http://localhost:8054

## Fitur

- Audit riwayat resi dengan status: dijemput, dalam perjalanan, tiba di hub, dibawa kurir, ATS, retur pusat, terkirim, gagal kirim, atau status lain.
- Menyorot sepuluh pola: ATS terlalu cepat setelah paket dibawa kurir, retur terlalu cepat setelah ATS, paket menginap di hub, ATS berulang, ATS tanpa status dibawa kurir, alamat lengkap tetapi ATS, nomor aktif tetapi ATS, tidak ada percobaan kontak, retur tanpa permintaan pembeli, dan retur tanpa ATS.
- Ambang 5 menit, 60 menit, dan 72 jam diberi label sebagai penanda audit internal, bukan aturan resmi ekspedisi atau marketplace.
- Menghitung kerugian kas dari HPP, ongkir, kemasan, ongkir retur, biaya lain, dan nilai barang yang kembali.
- Menghitung kerugian profit dan dampak total secara terpisah agar nilai pesanan tidak dihitung dua kali.
- Menghitung berapa penjualan normal yang perlu ditutup untuk menutup dampak total.
- Skor kesiapan 12 bukti dengan lima bukti kritis: tangkapan layar tracking, detail pesanan, bukti alamat, bukti nomor aktif, dan tiket CS ekspedisi.
- Tiga surat: klaim ke ekspedisi, peninjauan ke marketplace, dan permintaan bukti pengantaran.
- Catatan kasus dengan nomor resi, status, kerugian, dan tindak lanjut.
- Ekspor CSV dengan netralisasi formula.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, ekspedisi, status scan, status kasus, bukti, ambang, aturan, dan sumber.
- GET /api/example - contoh isian dari kasus 10 November 2026.
- POST /api/analyze - body: marketplace, courier, resi, order_value, product_cost, shipping_cost, packaging_cost, return_shipping_cost, other_cost, recovered_goods_value, address_complete, phone_active, contact_attempt, buyer_requested_return, incident_date, report_date, timeline.
- POST /api/readiness - body: evidence atau items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data kasus dan letter_type (ekspedisi, marketplace, bukti).
- GET /api/cases - daftar kasus, jumlah terbuka, indikasi kuat, bukti kurang, kerugian kas, dan dampak total.
- POST /api/cases - tambah kasus. Nama toko dan nomor resi wajib.
- PATCH /api/cases/:id - ubah status atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8054/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"marketplace":"tiktok","courier":"sicepat","resi":"006920823346","order_value":1250000,"product_cost":900000,"shipping_cost":25000,"packaging_cost":5000,"return_shipping_cost":25000,"other_cost":0,"recovered_goods_value":750000,"address_complete":"ya","phone_active":"ya","contact_attempt":"tidak","buyer_requested_return":"tidak","timeline":[{"status":"hub","at":"2026-11-01T08:00"},{"status":"ofd","at":"2026-11-05T09:51"},{"status":"ats","at":"2026-11-05T16:14"},{"status":"hub","at":"2026-11-06T07:44"},{"status":"ofd","at":"2026-11-06T13:05"},{"status":"ats","at":"2026-11-06T13:06"},{"status":"returned","at":"2026-11-06T13:40"}]}'
```

Hasil: indikasi 100 dari 100 (Kuat), kerugian kas Rp 205.000, kerugian profit Rp 320.000, dampak total Rp 525.000, setara 2 penjualan normal, skor bukti 71 persen, verdict risiko tinggi karena tiket CS ekspedisi belum ada.

## Test

```
npm test
```

24 test Node tanpa framework tambahan: meta dan sumber, analisis contoh, perhitungan kerugian kas dan dampak total, deteksi ATS satu menit, retur 34 menit, paket menginap 97,9 jam, ATS berulang, alamat dan nomor aktif, retur tanpa permintaan, riwayat normal, ATS tunggal, indikasi rendah, skor bukti, surat, CSV, ringkasan kasus, validasi nominal dan waktu, fallback pilihan, batas 20 baris scan, serta larangan em dash.

## Sumber utama

- Media Konsumen, 10 November 2026: surat pembaca tentang resi SiCepat 006920823346 untuk pesanan TikTok Shop 30 Oktober 2026. Paket tiba di Hub Jakabaring 1 November 2026, dibawa kurir 5 November 2026 pukul 09:51, lalu berstatus ATS pukul 16:14 tanpa kurir datang atau menelepon. Pada 6 November 2026 paket dibawa kurir pukul 13:05 dan berstatus ATS pukul 13:06, hanya satu menit kemudian, lalu retur pusat pukul 13:40 atau 34 menit setelah ATS.

## Catatan

Tool ini bukan nasihat hukum. Ambang 5 menit, 60 menit, dan 72 jam adalah penanda audit internal, bukan aturan resmi marketplace atau ekspedisi. Status ATS bisa sah bila alamat benar-benar tidak ditemukan, akses jalan tertutup, atau pembeli tidak bisa dihubungi. Tool tidak menentukan siapa bersalah dan tidak menjamin klaim diterima. Selalu cocokkan dengan syarat layanan, log pengantaran, dan kanal resmi. Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.
