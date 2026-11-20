# Kalkulator Harga Grosir

Menyusun harga grosir bertingkat untuk reseller: hitung margin dan profit setiap tier,
harga minimum agar target margin tetap tercapai, jumlah pcs minimum untuk menutup biaya
pesanan, dan perbandingan dengan penjualan eceran.

Berbeda dari [Marketplace Fee Calculator](../01-marketplace-fee-calculator/) yang menghitung
satu harga jual, tool ini fokus pada tangga harga berdasarkan jumlah pcs. Berbeda juga dari
[Biaya Total Marketplace](../36-biaya-total-marketplace/) yang menjumlahkan semua komponen
biaya untuk satu pesanan, tool ini memisahkan biaya pesanan yang hanya muncul sekali dari
diskon per pcs yang berlaku untuk seluruh isi pesanan.

## Masalah yang dipecahkan

Seller sering memberi diskon grosir dengan menebak. Diskon 20 persen untuk 24 pcs terlihat
menarik, tetapi setelah komisi platform, HPP, biaya admin, kemasan, dan subsidi ongkir, tier
tersebut bisa rugi. Di sisi lain, satu pesanan grosir hanya menanggung biaya admin, kemasan,
dan ongkir sekali, bukan 24 kali. Sebagian diskon sebenarnya dibayar oleh penghematan biaya
pesanan itu.

Tool ini memisahkan dua sisi tersebut untuk setiap tier:

- Omzet setelah diskon dan setelah pembulatan harga.
- Biaya platform yang dihitung dari omzet.
- HPP untuk seluruh pcs dalam pesanan.
- Biaya pesanan yang dihitung satu kali.
- Profit, margin, dan status tier.
- Harga minimum per pcs agar target margin tercapai.
- Perbandingan dengan menjual jumlah yang sama sebagai pesanan eceran satu pcs.

## Cara run

```
npm install
npm start
```

Buka http://localhost:8062

## Fitur

- Menghitung harga per pcs setelah diskon dan pembulatan rupiah.
- Menghitung diskon efektif setelah pembulatan, bukan hanya diskon yang diminta.
- Menghitung omzet, biaya platform, HPP, biaya pesanan, total biaya, profit, dan margin
  untuk setiap tier.
- Memberi status margin aman, di bawah target, atau rugi per pesanan.
- Menghitung harga minimum per pcs agar target margin tercapai pada setiap tier.
- Menghitung diskon maksimum yang masih memenuhi target margin.
- Menghitung jumlah pcs minimum untuk menutup biaya pesanan pada harga tier tersebut.
- Menandai tier yang tidak mungkin menutup biaya pesanan karena kontribusi per pcs negatif.
- Membandingkan profit tier grosir dengan penjualan jumlah yang sama secara eceran, termasuk
  biaya pesanan yang terpisah untuk setiap pesanan eceran.
- Menampilkan ringkasan tier aman, margin tertinggi, profit tier aman, dan proyeksi bulanan.
- Memberi peringatan bila diskon tidak naik seiring jumlah, HPP sama atau lebih besar dari
  harga eceran, atau ada tier di bawah target.
- Menyusun rekomendasi berisi angka nyata, bukan saran umum.
- Ekspor CSV berisi seluruh tier.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion,
  dan dark mode tanpa flash.

## API

- GET /api/health - status proses.
- GET /api/meta - langkah pembulatan, batas input, rumus, status, asumsi, dan disclaimer.
- GET /api/example - contoh produk kaos dengan empat tier.
- POST /api/analyze - hitung seluruh tier. Body memuat HPP, harga eceran, biaya platform,
  biaya pesanan, target margin, pembulatan, jumlah pesanan per bulan, dan array tiers.
- POST /api/export - kembalikan CSV dari data yang sama.

Contoh:

```
curl -s -X POST http://localhost:8062/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"product_label":"Kaos polos katun 30s","unit_cost":110000,"retail_price":150000,"marketplace_fee_pct":8,"fixed_fee_per_order":1250,"packaging_cost_per_order":2000,"shipping_subsidy_per_order":5000,"target_margin_pct":12,"rounding_step":100,"orders_per_month":30,"tiers":[{"quantity":3,"discount_pct":3},{"quantity":6,"discount_pct":10},{"quantity":12,"discount_pct":15},{"quantity":24,"discount_pct":22}]}'
```

Hasil utama dari contoh:

- Tier 3 pcs: harga Rp 145.500 per pcs, profit Rp 63.330 per pesanan, margin 14,51 persen,
  dan masih Rp 4.080 lebih untung daripada menjual 3 pcs secara eceran.
- Tier 6 pcs: margin 9,5 persen, di bawah target. Harga minimum Rp 139.300 per pcs.
- Tier 12 pcs: margin 5,19 persen. Harga minimum Rp 138.400 per pcs.
- Tier 24 pcs: rugi Rp 64.890 per pesanan. Harga minimum Rp 138.000 per pcs.
- Harga minimum tier 24 pcs (Rp 138.000) justru lebih rendah dari tier 3 pcs
  (Rp 141.000) karena biaya pesanan dibagi ke lebih banyak pcs. Namun harga tier 24 pcs
  (Rp 117.000) berada jauh di bawah harga minimum tersebut, sehingga tier itu rugi.

## Asumsi

- HPP per pcs sudah mencakup bahan, tenaga kerja, dan overhead yang dibebankan per unit.
- Biaya platform dihitung dari omzet setelah diskon grosir, bukan dari harga eceran.
- Biaya admin, kemasan, dan subsidi ongkir dihitung satu kali per pesanan grosir.
- Harga grosir dibulatkan ke langkah rupiah yang dipilih. Diskon efektif dihitung dari harga
  bulat tersebut.
- Target margin adalah margin bersih terhadap omzet, bukan markup terhadap HPP.
- Perbandingan eceran menganggap jumlah yang sama dijual sebagai pesanan satu pcs,
  masing-masing menanggung biaya admin, kemasan, dan subsidi ongkir sendiri.
- Belum termasuk pajak, iklan, biaya retur, biaya penyimpanan, dan biaya tambahan lain.
- Proyeksi bulanan memakai jumlah pesanan grosir yang sama untuk setiap tier. Tier adalah
  skenario alternatif, bukan akumulasi.
- Pembulatan memakai langkah 1, 50, 100, 500, atau 1.000 rupiah. Pembulatan dilakukan ke
  nilai terdekat, bukan selalu ke atas.
- Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.

## Test

```
npm test
```

Test memakai node:test dan node:assert/strict. Cakupan meliputi meta, contoh perhitungan
empat tier, status aman, tipis, dan rugi, harga minimum target, diskon maksimum, pembulatan
harga, perbandingan eceran, jumlah pesanan nol, pengurutan tier, peringatan diskon tidak naik,
peringatan HPP di atas harga eceran, validasi input, batas delapan tier, normalisasi field
opsional, CSV, dan larangan em dash serta en dash.

## Catatan

Angka pada tool adalah estimasi dari input seller, bukan laporan laba resmi. Cocokkan dengan
HPP aktual, biaya platform yang berlaku, dan pola pesanan nyata sebelum mengumumkan harga.
Untuk sengketa atau negosiasi, simpan CSV hasil perhitungan, bukti HPP, tangkapan layar biaya
platform, dan riwayat pesanan grosir.
