# Kalkulator Biaya Live Selling

Menghitung profit satu sesi live selling setelah host, affiliate, iklan, sampel, HPP,
kemasan, dan komisi platform. Tool ini juga menunjukkan titik balik modal, harga minimum,
unit minimum untuk target margin, serta batas biaya host dan affiliate yang masih aman.

Berbeda dari [Kalkulator Komisi TikTok](../27-tiktok-komisi-calculator/) yang fokus pada
perubahan tarif komisi platform, tool ini menghitung **biaya sesi live** yang dibayar seller
di luar komisi: host per jam, iklan, sampel, properti, dan affiliate. Berbeda juga dari
[Pemeriksa Efisiensi Iklan](../57-pemeriksa-efisiensi-iklan/) yang mengaudit ROAS dan ACOS,
tool ini menyatukan semua biaya sesi menjadi profit, margin, dan batas biaya.

## Masalah yang dipecahkan

Live selling terlihat ramai dari jumlah penonton dan pesanan, tetapi profit sesi bisa habis
oleh biaya yang tidak terlihat per pesanan:

- Host dibayar per jam, termasuk saat penjualan sepi.
- Iklan, sampel untuk host, giveaway, dan properti studio dibayar sekali per sesi.
- Komisi affiliate hanya berlaku pada porsi pesanan yang datang dari link affiliate, tetapi
  sering dihitung seolah berlaku untuk seluruh omzet.
- Komisi platform, HPP, dan kemasan mengikuti jumlah unit.
- Harga diskon khusus live mengurangi omzet per unit.

Tool ini memisahkan biaya tetap sesi dari biaya per unit. Hasilnya adalah profit sesi,
margin, profit per jam, biaya per pesanan, konversi penonton, titik balik modal, dan batas
biaya yang masih bisa ditoleransi. Skenario volume 50 sampai 150 persen menunjukkan pada
volume berapa sesi mulai mencapai target margin.

## Cara run

```
npm install
npm start
```

Buka http://localhost:8065

## Fitur

- Menghitung omzet dari unit terjual dan harga rata-rata setelah diskon live.
- Menghitung HPP, kemasan, komisi platform, dan komisi affiliate per sesi.
- Menghitung komisi affiliate efektif dari tarif affiliate dan porsi pesanan affiliate.
- Menghitung biaya host dari tarif per jam, durasi, dan jumlah host.
- Memisahkan biaya tetap sesi: host, iklan, sampel, dan biaya lain.
- Menghitung profit, margin, profit per jam, biaya per pesanan, dan profit per pesanan.
- Menghitung konversi penonton, omzet per penonton, dan biaya per penonton.
- Menghitung unit dan omzet balik modal.
- Menghitung unit minimum dan harga minimum agar target margin tercapai.
- Menghitung batas biaya host per jam, batas komisi affiliate, dan batas biaya iklan.
- Menampilkan lima skenario volume: 50, 75, 100, 125, dan 150 persen.
- Memberi status margin aman, di bawah target, atau rugi sesi.
- Memberi peringatan untuk HPP di atas harga, komisi tinggi, host atau iklan terlalu besar,
  dan kontribusi per unit yang negatif.
- Menyusun rekomendasi berisi angka nyata, bukan saran umum.
- Ekspor CSV berisi seluruh skenario dan komponen biaya.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion,
  dan dark mode tanpa flash.

## API

- GET /api/health - status proses.
- GET /api/meta - batas input, skenario, rumus, status, asumsi, dan disclaimer.
- GET /api/example - contoh sesi live tiga jam dengan 72 unit terjual.
- POST /api/analyze - hitung satu sesi dan lima skenario volume.
- POST /api/export - kembalikan CSV dari data yang sama.

Contoh:

```
curl -s -X POST http://localhost:8065/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"session_label":"Live malam promo akhir bulan","duration_hours":3,"viewers":4200,"units_sold":72,"avg_price":129000,"unit_cost":68000,"marketplace_fee_pct":8,"affiliate_pct":10,"affiliate_order_pct":40,"host_fee_per_hour":150000,"host_count":1,"ads_spend":600000,"sample_cost":300000,"packaging_per_order":2500,"other_cost":60000,"target_margin_pct":15}'
```

Hasil utama dari contoh:

- Omzet Rp 9.288.000 dari 72 unit pada harga rata-rata Rp 129.000.
- Komisi platform Rp 743.040, affiliate efektif 4 persen atau Rp 371.520.
- HPP Rp 4.896.000, kemasan Rp 180.000, biaya tetap sesi Rp 1.410.000.
- Total biaya Rp 7.600.560, profit Rp 1.687.440, margin 18,17 persen.
- Profit per jam Rp 562.480 dan biaya per pesanan Rp 105.563,33.
- Balik modal di 33 unit atau omzet Rp 4.257.000.
- Target margin 15 persen tercapai mulai 60 unit, atau pada harga minimum Rp 123.500.
- Batas biaya host Rp 248.080 per jam, batas affiliate 17,92 persen, batas iklan
  Rp 894.240.
- Skenario 50 persen (36 unit) hanya memberi margin 2,99 persen. Skenario 75 persen
  (54 unit) memberi 13,11 persen. Keduanya masih di bawah target.

## Asumsi

- Harga rata-rata per unit sudah memperhitungkan diskon, voucher, dan harga khusus live.
- Komisi platform dihitung dari omzet setelah diskon, bukan dari harga normal.
- Komisi affiliate hanya dikenakan pada porsi pesanan yang berasal dari link affiliate.
  Komisi efektif = tarif affiliate x porsi pesanan affiliate.
- Host dibayar per jam. Bagi hasil penjualan untuk host belum termasuk.
- HPP per unit sudah mencakup bahan dan ongkir masuk ke gudang.
- Kemasan dihitung per pesanan, bukan per unit. Satu pesanan dianggap satu unit pada contoh
  ini. Jika satu pesanan berisi beberapa unit, sesuaikan angka kemasan.
- Sampel, iklan, dan biaya lain dihitung satu kali per sesi, bukan per pesanan.
- Belum termasuk pajak, retur, refund, subsidi ongkir ke pembeli, biaya penyimpanan, dan
  biaya tetap toko bulanan.
- Skenario volume memakai harga, porsi affiliate, dan biaya tetap sesi yang sama. Skenario
  adalah alternatif, bukan akumulasi.
- Harga minimum dibulatkan ke atas pada langkah Rp 100.
- Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.

## Test

```
npm test
```

Test memakai node:test dan node:assert/strict. Cakupan meliputi meta, contoh perhitungan
tiga jam, komisi affiliate efektif, seluruh komponen biaya, batas balik modal, unit dan
harga minimum target, lima skenario volume, verdict aman, tipis, dan rugi, unit nol,
penonton nol, kontribusi per unit negatif, validasi input, normalisasi field opsional,
CSV, endpoint API, dan larangan em dash serta en dash.

## Catatan

Angka pada tool adalah estimasi dari input seller, bukan laporan laba resmi. Cocokkan dengan
tagihan iklan, kontrak host, laporan affiliate, dan settlement platform sebelum mengambil
keputusan. Untuk negosiasi, simpan CSV hasil perhitungan bersama tangkapan layar biaya
platform dan laporan penjualan sesi.
