# Kalkulator Modal Kerja Pencairan

Menghitung modal kerja yang tertahan karena jeda pencairan marketplace. Tool ini memisahkan
piutang pencairan dari buffer stok, membandingkannya dengan kas yang dipegang hari ini, lalu
menunjukkan kas minimum, kas yang disarankan, volume aman, dan skenario jeda pencairan.

Berbeda dari [Pelacak Dana Tertahan](../29-dana-tertahan-tracker/) yang mencatat saldo yang
dibekukan atau disengketakan, tool ini menghitung kebutuhan kas normal akibat jeda payout yang
berulang. Berbeda juga dari [Pemeriksa Potongan Pesanan](../47-pemeriksa-potongan-pesanan/)
yang mengaudit selisih potongan, dan dari [Kalkulator Biaya Pinjaman Modal](../58-kalkulator-biaya-pinjaman-modal/)
yang menghitung bunga pinjaman. Tool ini fokus pada satu pertanyaan: berapa uang yang harus
tersedia agar operasional tidak berhenti sebelum dana marketplace cair.

## Masalah yang dipecahkan

Seller sering melihat profit di laporan bulanan, tetapi kehabisan uang untuk restock. Penyebab
utamanya adalah waktu:

- HPP, kemasan, subsidi ongkir, iklan, dan biaya tetap keluar lebih dulu.
- Marketplace baru mencairkan dana setelah paket diterima dan masa pencairan lewat.
- Stok berikutnya harus dibeli sebelum stok saat ini habis.
- Piutang yang sudah menjadi omzet belum bisa dipakai membayar supplier.
- Menambah volume justru memperbesar kas yang tertahan.

Tool ini menjawab pertanyaan praktis:

- Berapa modal kerja minimum agar kas tidak minus?
- Berapa bagian yang tertahan di piutang dan berapa yang tertahan di stok?
- Berapa kas yang disarankan setelah menambahkan buffer?
- Berapa pesanan per hari yang aman dengan kas saat ini?
- Berapa tambahan kas jika jeda pencairan naik dari 7 menjadi 14 hari?
- Pada jeda berapa kas mulai kurang?

## Cara run

```
npm install
npm start
```

Buka http://localhost:8069

## Fitur

- Menghitung omzet, komisi platform, HPP, kemasan, subsidi ongkir, iklan, biaya tetap, profit,
  dan margin harian.
- Menghitung kontribusi per pesanan setelah komisi, HPP, kemasan, dan ongkir.
- Menghitung piutang pencairan dari kas keluar harian dikali total lag.
- Menghitung buffer stok dari HPP dikali pesanan per hari dikali lead time restock.
- Menghitung modal kerja minimum dan kas yang disarankan dengan buffer hari.
- Membandingkan kas saat ini dengan modal kerja minimum dan kas disarankan.
- Memberi status kas aman, kas ketat, atau kas kurang.
- Menghitung volume pesanan aman dengan kas saat ini.
- Menghitung titik balik modal operasional dari kontribusi per pesanan.
- Menampilkan empat skenario jeda pencairan: 3, 7, 14, dan 21 hari.
- Menampilkan piutang tertahan, yaitu uang yang sudah menjadi omzet tetapi belum masuk rekening.
- Memberi peringatan untuk operasional rugi, kontribusi negatif, jeda panjang, lead time
  panjang, buffer tipis, dan volume di atas kapasitas kas.
- Menyusun rekomendasi berisi angka nyata, bukan saran umum.
- Ekspor CSV berisi seluruh skenario.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion,
  dan dark mode tanpa flash.

## API

- GET /api/health - status proses.
- GET /api/meta - batas input, skenario, rumus, status, asumsi, dan disclaimer.
- GET /api/example - contoh toko kaos dengan 12 pesanan per hari.
- POST /api/analyze - hitung volume harian, modal kerja, batas kas, dan skenario.
- POST /api/export - kembalikan CSV dari data yang sama.

Contoh:

```
curl -s -X POST http://localhost:8069/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"store_label":"Toko kaos harian","daily_orders":12,"avg_price":95000,"unit_cost":55000,"marketplace_fee_pct":8,"packaging_per_order":2000,"shipping_subsidy_per_order":3000,"ads_spend_per_day":150000,"fixed_cost_per_day":100000,"target_margin_pct":10,"delivery_days":2,"payout_delay_days":7,"restock_lead_days":7,"safety_buffer_days":5,"current_cash":15000000}'
```

Hasil utama dari contoh:

- Omzet Rp 1.140.000 per hari, profit Rp 78.800, margin 6,91 persen.
- Kontribusi per pesanan Rp 27.400. Biaya tetap harian Rp 250.000 tertutup mulai
  10 pesanan per hari.
- Kas keluar harian Rp 970.000. Total lag 9 hari dari 2 hari kirim dan 7 hari pencairan.
- Piutang pencairan Rp 8.730.000. Buffer stok Rp 4.620.000 untuk 7 hari restock.
- Modal kerja minimum Rp 13.350.000. Buffer kas 5 hari Rp 4.850.000.
- Kas disarankan Rp 18.200.000. Kas saat ini Rp 15.000.000, jadi kurang Rp 3.200.000
  dari kas disarankan dan berstatus Kas ketat.
- Piutang yang sudah menjadi omzet tetapi belum cair sekitar Rp 9.439.200.
- Dengan kas Rp 15.000.000, volume aman sekitar 9 pesanan per hari, di bawah 12 pesanan
  yang diisi.
- Setiap tambahan 1 hari jeda pencairan menambah kebutuhan kas Rp 970.000.
- Skenario 3 hari: kas aman dengan sisa Rp 680.000 di atas kas disarankan.
- Skenario 7 hari: kas ketat, kurang Rp 3.200.000 dari kas disarankan.
- Skenario 14 hari: kas kurang Rp 9.990.000 dari kas disarankan.
- Skenario 21 hari: kas kurang Rp 16.780.000 dari kas disarankan.

## Asumsi

- Omzet harian dihitung dari pesanan per hari dikali harga rata-rata setelah diskon.
- Komisi platform dihitung dari omzet dan mengurangi uang yang cair, bukan kas keluar.
- Kas keluar harian mencakup HPP, kemasan, subsidi ongkir, iklan, dan biaya tetap.
- Jeda pencairan dihitung setelah paket diterima, yaitu waktu kirim ditambah jeda payout.
- Piutang tertahan adalah uang yang sudah menjadi omzet tetapi belum masuk rekening.
- Buffer stok memakai HPP dikali pesanan per hari dikali lead time restock. Buffer ini
  terpisah dari barang yang sudah terjual dan sedang menunggu pencairan.
- Jeda pencairan, waktu kirim, dan lead time restock adalah input seller, bukan tarif resmi.
  Nilai default hanya contoh. Cocokkan dengan riwayat payout di seller center.
- Kas saat ini adalah saldo yang benar-benar bisa dipakai, bukan limit kredit atau piutang.
- Belum termasuk pajak, retur, refund, biaya pinjaman, biaya penyimpanan, dan bagi hasil.
- Skenario jeda pencairan mengubah satu variabel saja. Input lain dianggap tetap.
- Volume aman dihitung dengan membagi sisa kas setelah biaya tetap harian dengan kebutuhan
  kas per pesanan pada window lag ditambah buffer.
- Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.

## Test

```
npm test
```

Test memakai node:test dan node:assert/strict. Cakupan meliputi meta, contoh perhitungan
harian, pemisahan piutang dan buffer stok, modal kerja minimum, kas disarankan, selisih kas,
volume aman, titik balik modal, empat skenario jeda, verdict kas kurang, operasional rugi,
pesanan nol, validasi input, normalisasi field opsional, CSV, endpoint API, dan larangan
em dash serta en dash.

## Catatan

Angka pada tool adalah estimasi dari input seller, bukan laporan arus kas resmi. Cocokkan
dengan riwayat pencairan, mutasi rekening, tagihan iklan, dan faktur supplier sebelum
mengambil keputusan restock. Untuk pengajuan pinjaman atau negosiasi dengan supplier, simpan
CSV hasil perhitungan bersama bukti payout dan posisi stok.
