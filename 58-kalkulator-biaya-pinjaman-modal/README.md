# Kalkulator Biaya Pinjaman Modal

Seller meminjam untuk restock, melihat bunga 1,5% per bulan, lalu menganggapnya murah. Padahal bunga flat dihitung dari plafon awal, biaya admin dan asuransi dipotong di depan, dan cicilan bisa memakan hampir separuh laba kotor. Tool ini menghitung uang yang benar-benar diterima, total biaya, bunga efektif tahunan, beban cicilan, plafon aman, dan perbandingan dua penawaran.

Berbeda dari [Biaya Total Marketplace](../36-biaya-total-marketplace/) yang menghitung biaya jual, tool ini fokus pada biaya modal pinjaman. Berbeda juga dari [Kalkulator Stok Mati](../56-kalkulator-stok-mati/) yang menghitung modal tertahan, [Pemeriksa Efisiensi Iklan](../57-pemeriksa-efisiensi-iklan/) yang mengaudit ROAS, dan [Profit Tracker](../09-profit-tracker/) yang mencatat laba penjualan.

## Run

```
npm install
npm start
```

Buka http://localhost:8058

## Fitur

- Menghitung angsuran bunga flat dan bunga efektif saldo menurun, termasuk tenor sampai 120 bulan.
- Memisahkan plafon, bunga, biaya admin, provisi, asuransi, dan biaya lain.
- Menghitung uang diterima bersih setelah semua biaya awal dipotong.
- Menghitung total biaya dan rasio biaya terhadap uang yang benar-benar diterima.
- Menghitung bunga efektif bulanan dan tahunan dengan IRR dari arus kas, lalu membandingkannya dengan bunga nominal.
- Menghitung rasio cicilan terhadap laba kotor, sisa laba bulanan, rasio cakupan laba, dan status aman, tipis, berat, atau rugi.
- Menghitung plafon aman dari batas persen cicilan dan cicilan lain yang sudah berjalan.
- Menghitung skenario denda telat dari persen denda per hari dan jumlah hari.
- Membuat jadwal angsuran per bulan: saldo awal, pokok, bunga, angsuran, dan sisa.
- Membandingkan dua sampai delapan penawaran dan memilih bunga efektif tahunan terendah.
- Ekspor CSV berisi ringkasan dan jadwal angsuran, dengan netralisasi formula.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - jenis bunga, nilai default, asumsi, rumus, batas, dan aturan.
- GET /api/example - contoh pinjaman modal Rp 20 juta, tenor 12 bulan, bunga flat 1,5% per bulan.
- POST /api/analyze - body: data pinjaman, biaya awal, laba kotor bulanan, cicilan lain, batas aman, dan skenario telat.
- POST /api/compare - body: `offers` berisi dua sampai delapan penawaran, ditambah laba kotor bulanan sebagai nilai default.
- POST /api/export - body sama seperti analyze, mengembalikan CSV ringkasan dan jadwal angsuran.

Contoh:

```
curl -s -X POST http://localhost:8058/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"lender":"Pinjaman modal toko","principal":20000000,"tenor_months":12,"interest_type":"flat","interest_rate_pct":1.5,"admin_fee_pct":1,"admin_fee_amount":0,"provision_pct":0,"insurance_pct":0.5,"other_fee_amount":0,"monthly_gross_profit":6000000,"existing_installment":500000,"max_installment_pct":30,"late_days":0,"late_fee_per_day_pct":0.1}'
```

Hasil: angsuran Rp 1.966.667 per bulan, uang diterima bersih Rp 19.700.000, total biaya Rp 3.900.000, bunga efektif tahunan 40,83%, rasio cicilan total 41,11% dari laba kotor, plafon aman Rp 13.220.339, verdict "Cicilan menipiskan laba".

## Test

```
npm test
```

17 test Node tanpa framework tambahan: meta dan asumsi, hasil contoh, bunga flat, biaya awal dan prioritas nominal admin, bunga efektif nol persen, rumus anuitas, empat tingkat verdict, peringatan bunga sangat tinggi, plafon aman, denda telat, jadwal angsuran, perbandingan penawaran, batas jumlah penawaran, validasi input, fallback jenis bunga, CSV, serta larangan em dash.

## Asumsi

- Bunga flat dihitung dari plafon awal setiap bulan. Bunga efektif dihitung dari sisa pokok dengan angsuran tetap.
- Biaya admin, provisi, asuransi, dan biaya lain dianggap dipotong di awal, bukan ditambahkan ke angsuran.
- Bila biaya admin nominal diisi, nominal itu dipakai dan persentase admin diabaikan.
- Bunga efektif tahunan dihitung dari arus kas bulanan dengan IRR, lalu disetahunkan. Angka ini memasukkan seluruh biaya awal.
- Batas aman cicilan 30% dari laba kotor adalah patokan internal tool, bukan aturan marketplace, OJK, atau pemberi pinjaman. Pengguna bisa mengubahnya.
- Ambang bunga efektif 60% dan 100% per tahun juga patokan internal untuk memberi peringatan, bukan batas resmi.
- Denda telat hanya skenario hitungan dari persen dan hari yang diisi. Denda sebenarnya mengikuti perjanjian.
- Tool tidak memakai data jaringan, tidak mengakses akun pinjaman, dan tidak menawarkan pinjaman. Semua hasil berasal dari angka yang dimasukkan.
- Hasil bukan penawaran resmi atau nasihat keuangan. Cocokkan dengan tabel angsuran dan perjanjian tertulis.
