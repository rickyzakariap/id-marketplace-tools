# Pemeriksa Efisiensi Iklan

Versi 16 November 2026.

Belanja iklan marketplace bisa terlihat produktif karena pesanan bertambah, padahal
margin per pesanan lebih kecil dari biaya akuisisi. Tool ini mengaudit setiap kampanye
dengan ROAS, ACOS, CPA, CTR, konversi, dan ROAS impas yang dihitung dari modal barang,
biaya marketplace, serta biaya kemas. Hasilnya: kampanye mana yang layak ditambah,
mana yang harus dipotong, dan berapa batas budget untuk mencapai target laba.

Berbeda dari [Biaya Total Marketplace](../36-biaya-total-marketplace/) yang menghitung
semua komponen biaya sebagai persen, tool ini fokus pada efisiensi iklan per kampanye.
Berbeda juga dari [Pemeriksa Take Rate](../52-pemeriksa-take-rate/) yang membandingkan
potongan platform dengan benchmark.

## Masalah yang dipecahkan

Seller sering menilai iklan hanya dari ROAS atau jumlah pesanan. Padahal ROAS 5x bisa
tetap merugi bila margin bersih hanya 15 persen. Tanpa ROAS impas dan CPA impas, seller
sulit tahu kapan harus menambah budget, mempertahankan, atau mematikan kampanye.

Tool ini menjawab empat pertanyaan:

1. Berapa laba bersih setelah belanja iklan, bukan hanya omzet?
2. Berapa ROAS minimum agar iklan tidak merugi?
3. Berapa budget yang terbuang di kampanye yang CPA-nya terlalu mahal?
4. Berapa batas belanja untuk mencapai target laba tertentu?

## Run

```
npm install
npm start
```

Buka http://localhost:8057

## Fitur

- Menghitung CTR, CPC, konversi, CPA, AOV, ROAS, ACOS, dan margin per kampanye.
- Menghitung margin sebelum iklan setelah modal barang, biaya marketplace, dan biaya kemas.
- Menghitung ROAS impas dan CPA impas per kampanye serta gabungan.
- Menghitung laba setelah iklan, laba per pesanan, dan budget yang terbuang.
- Memberi status sehat, laba tipis, merugi, atau margin negatif.
- Mendiagnosis funnel: materi iklan lemah, halaman produk lemah, audiens lemah, atau belum ada pesanan.
- Menyusun rencana budget: batas belanja aman, ruang budget, ROAS minimum, dan CPA maksimum untuk target laba.
- Memproyeksikan laba bila budget naik dengan asumsi ROAS tetap.
- Menampilkan rincian per kampanye dalam tabel dan menyediakan ekspor CSV.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - pengaturan awal, daftar status, diagnosis funnel, asumsi, rumus, dan batas jumlah kampanye.
- GET /api/example - contoh tiga kampanye dengan pengaturan awal.
- POST /api/analyze - body: `settings` dan `campaigns`. Mengembalikan hasil per kampanye, ringkasan, verdict, dan rekomendasi.
- POST /api/plan - body: `settings`, `campaigns`, `target_profit`, dan `scale_pct`. Mengembalikan batas budget dan proyeksi.
- POST /api/export - body: `settings` dan `campaigns`. Mengembalikan CSV.

Contoh:

```
curl -s -X POST http://localhost:8057/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "fee_pct": 8,
      "packaging_per_order": 1500,
      "min_ctr_pct": 1,
      "min_cvr_pct": 2,
      "thin_margin_pct": 10
    },
    "campaigns": [
      {
        "name": "Kaos Polos Combed 30s",
        "spend": 1200000,
        "impressions": 150000,
        "clicks": 3000,
        "orders": 120,
        "revenue": 18000000,
        "unit_cost": 70000,
        "days": 30
      }
    ]
  }'
```

Hasil contoh: margin sebelum iklan Rp 7.980.000, ROAS 15x, ROAS impas 2,26x,
laba setelah iklan Rp 6.780.000, dan CPA impas Rp 66.500.

Contoh rencana dengan data `/api/example`, target laba Rp 8.000.000, dan kenaikan
budget 20 persen: batas belanja aman Rp 2.803.000, belanja perlu dipotong
Rp 1.697.000, ROAS minimum 9,42x, dan proyeksi laba Rp 7.563.600.

## Test

```
npm test
```

Tiga belas test Node tanpa framework tambahan, memakai `node:test` dan
`node:assert/strict`. Cakupan: bentuk meta, total contoh, perhitungan kampanye sehat,
kampanye merugi, laba tipis, diagnosis funnel, margin negatif, rencana budget,
target tercapai, target mustahil, validasi input, validasi rencana, CSV, dan larangan
em dash.

## Asumsi

- Biaya marketplace 8 persen adalah asumsi, bukan tarif resmi platform. Ganti dengan
  tarif toko Anda.
- Biaya kemas Rp 1.500 per pesanan adalah asumsi. Ganti dengan biaya aktual.
- Pendapatan iklan dianggap sudah bersih dari diskon, pembatalan, dan retur. Bila belum,
  masukkan angka bersih agar laba tidak terlihat lebih besar.
- Laba setelah iklan belum memasukkan biaya tetap, gaji, pajak, dan biaya operasional
  di luar pesanan.
- Patokan CTR 1 persen dan konversi 2 persen hanya titik awal diagnosis funnel, bukan
  benchmark resmi marketplace.
- Atribusi menganggap semua pesanan berasal dari iklan. Pesanan organik yang tercampur
  akan membuat ROAS terlihat lebih tinggi.
- Rencana penskalaan menganggap ROAS dan margin tetap saat budget naik. Itu skenario
  pembanding, bukan ramalan hasil.
- Tool tidak membaca akun iklan, tidak memakai API marketplace, dan tidak menjamin
  hasil optimasi. Selalu cocokkan dengan laporan iklan dan laporan pencairan.
