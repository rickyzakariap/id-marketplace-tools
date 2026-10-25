# Pelacak Klaim Paket Hilang dan Rusak

Paket hilang atau rusak di perjalanan, pembeli tetap mendapat refund, tetapi kompensasi marketplace atau ekspedisi tidak menutup nilai barang. Tool ini menghitung kerugian bersih, menyiapkan bukti, melacak umur klaim, dan membuat surat klaim.

Berbeda dari [Biaya Retur Tracker](../31-biaya-retur-tracker/) yang menghitung retur barang dari pembeli, tool ini fokus pada paket yang hilang, rusak, isi kosong, nyangkut, atau rusak saat retur. Berbeda juga dari [Dana Tertahan Tracker](../29-dana-tertahan-tracker/) yang melacak saldo platform, dan [Pemulih Toko](../37-pemulih-toko/) yang memulihkan akses akun.

## Run

```
npm install
npm start
```

Buka http://localhost:8040

## Fitur

- Kalkulator kerugian untuk lima jenis insiden: paket hilang, paket rusak, isi kosong atau tertukar, resi tidak bergerak, dan barang rusak saat retur.
- Menghitung dana penjualan yang tetap diterima setelah refund, modal barang, ongkir, kemasan, premi asuransi, kompensasi, dan nilai barang yang kembali.
- Kerugian bersih, biaya yang belum tertutup kompensasi, dan berapa penjualan normal yang perlu ditutup.
- Patokan 10 kali ongkir ditampilkan sebagai pembanding, dengan label jelas bahwa angka itu berasal dari kasus penjual 23 Oktober 2026, bukan tarif resmi.
- Skor kesiapan 13 bukti klaim. Lima bukti kritis diberi bobot lebih besar: video packing, bukti serah terima, tracking, nomor tiket, dan invoice.
- Catatan kasus dengan nomor pesanan, resi, tanggal kejadian, tanggal laporan, follow-up, status, nominal klaim, dan kompensasi diterima.
- Umur klaim otomatis: baru, perlu ditindaklanjuti, mendesak, kritis, atau belum dilaporkan.
- Peringatan untuk klaim ditolak, kompensasi diterima belum sesuai klaim, laporan menggantung lebih dari 30 hari, dan paket tanpa asuransi.
- Generator surat klaim dengan rincian kerugian, kronologi, permintaan keputusan tertulis, dan daftar bukti.
- Ekspor catatan ke CSV.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, ekspedisi, jenis insiden, status, bukti, sumber, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, courier, incident_type, selling_price, refund_to_buyer, product_cost, shipping_cost, packaging_cost, insurance, insurance_cost, compensation_received, recovered_goods_value, normal_margin_pct, incident_date, report_date.
- POST /api/readiness - body: items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data penjual, nomor pesanan, resi, nama barang, kronologi, dan rincian kerugian.
- GET /api/cases - daftar kasus, jumlah terbuka, total kerugian, total klaim, total diterima, dan klaim tertua.
- POST /api/cases - tambah kasus.
- PATCH /api/cases/:id - ubah status, nominal kompensasi, atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat 4 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8040/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","courier":"spx","incident_type":"hilang","selling_price":1190000,"refund_to_buyer":1190000,"product_cost":900000,"shipping_cost":20000,"packaging_cost":3000,"insurance":"tidak","compensation_received":135000,"normal_margin_pct":15,"incident_date":"2026-10-07","report_date":"2026-10-09"}'
```

Hasil: kerugian bersih Rp 788.000, biaya belum tertutup Rp 788.000, setara 5 penjualan normal, status signifikan, patokan 10 kali ongkir Rp 200.000.

## Test

```
npm test
```

37 test Node tanpa framework tambahan: perhitungan kerugian, refund sebagian, premi asuransi, nilai barang kembali, batas refund, margin nol, validasi tanggal, umur laporan, kesiapan bukti, validasi kasus, ringkasan, isi surat, kelengkapan sumber, dan larangan em dash.

## Sumber utama

- Media Konsumen, 23 Oktober 2026: penjual mengirim crossover audio Rp1.190.000 via SPX Express. Paket dinyatakan hilang atau rusak, Shopee menawarkan Rp135.000 karena tidak ada asuransi pengiriman. Penjual menyebut kompensasi standar 10 kali ongkir.
- Media Konsumen, 22 Oktober 2026: penjual Tokopedia TikTok Shop mengirim iPad Rp7.013.470 via Blitz. Paket hilang, kompensasi belum cair setelah follow-up 9 September dan 13 Oktober 2026.
- Media Konsumen, 24 Oktober 2026: uang Rp2.395.080 tertahan dua bulan di Shopee karena paket Samsung A07 hilang dalam pengiriman GrabExpress. Bukti yang ada hanya foto paket di atas motor.
- Media Konsumen, 1 Oktober 2026: laptop Rp14,6 juta hilang di J&T Cargo. Shopee meminta CCTV packing dan serah terima, lalu menutup laporan tanpa rincian solusi.
- Media Konsumen, 4 Oktober 2026: paket SPX Hemat Rp1,3 juta tidak bergerak lebih dari 10 hari tanpa pembaruan resi.
- Media Konsumen, 8 Oktober 2026: barang pecah saat retur, pembeli tidak mengirim video unboxing, tetapi penjual yang disalahkan.
- Media Konsumen, 6 Oktober 2026: penjual TikTok Shop by Tokopedia dibebankan biaya retur dan banding ditolak karena video pengemasan tidak dikirim dalam 24 jam.

## Catatan

Tool ini bukan nasihat hukum. Kompensasi, batas waktu, dan jalur klaim berbeda per marketplace dan ekspedisi. Angka 10 kali ongkir dan batas video pengemasan 24 jam berasal dari kasus yang dilaporkan penjual, bukan tarif resmi. Angka kerugian dihitung dari input Anda. Selalu cocokkan dengan syarat layanan dan Seller Center. Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.
