# Pemeriksa Ongkir Volumetrik

Paket ringan tetapi besar sering ditagih lebih mahal karena kurir memakai berat volume, bukan berat timbangan. Tool ini menghitung berat volume, berat tertagih, biaya per kirim, kelebihan biaya akibat volume, batas ukuran tier berikutnya, dan penghematan dari ukuran kemasan yang lebih kecil.

Berbeda dari [Shipping Cost Estimator](../11-shipping-cost-estimator/) yang membandingkan tarif antar kurir berdasarkan berat, tool ini fokus pada hubungan antara dimensi paket dan berat tertagih. Tool juga bukan pengganti tarif resmi kurir.

## Masalah yang dipecahkan

Seller sering mengira ongkir hanya ditentukan berat timbangan. Padahal paket seperti pakaian, makanan ringan, dan produk perawatan bisa memakan volume besar. Akibatnya biaya kirim naik, margin pesanan habis, dan seller tidak tahu bagian mana yang harus diperbaiki.

Tool ini memisahkan tiga hal:

- Berat aktual dari timbangan.
- Berat volume dari dimensi paket dibagi pembagi kurir.
- Berat tertagih, yaitu nilai terbesar dari keduanya setelah pembulatan.

Dengan pemisahan itu, seller bisa melihat apakah ongkir ditentukan berat atau volume, berapa rupiah kelebihan yang dibayar, dan berapa besar kemasan harus dikecilkan.

## Cara run

```
npm install
npm start
```

Buka http://localhost:8060

## Fitur

- Menghitung volume paket, berat volume, berat tertagih, dan dasar yang dipakai.
- Menghitung tarif berat, minimum charge, biaya admin, biaya kemasan, dan total per kirim.
- Menghitung proyeksi biaya bulanan dan tahunan dari jumlah kiriman.
- Memisahkan kelebihan biaya karena volume dari biaya yang tetap muncul akibat berat aktual.
- Menampilkan batas volume agar tetap di tier berat saat ini, sisa ruang, dan kenaikan biaya di tier berikutnya.
- Membandingkan empat pembagi umum: 5000, 6000, 7000, dan 8000.
- Menghitung penghematan per kirim, per bulan, dan per tahun dari ukuran usulan.
- Memberi verdict aman, waspada, atau berisiko volume.
- Menyusun rekomendasi berisi angka nyata, bukan saran umum saja.
- Ekspor CSV berisi baris utama, usulan, dan pembanding pembagi.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/health - status proses.
- GET /api/meta - daftar pembagi, langkah pembulatan, batas input, rumus, asumsi, dan disclaimer.
- GET /api/example - contoh paket kaos katun.
- POST /api/analyze - hitung satu paket. Body memuat dimensi, berat aktual, tarif, dan pengaturan pembulatan.
- POST /api/compare - bandingkan beberapa ukuran kemasan. Body memuat data dasar dan array options.
- POST /api/export - kembalikan CSV dari data paket.

Contoh:

```
curl -s -X POST http://localhost:8060/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"length_cm":30,"width_cm":25,"height_cm":10,"actual_weight_kg":0.6,"divisor":6000,"rate_per_kg":18000,"minimum_charge":9000,"admin_fee":1000,"packaging_cost":1200,"rounding_step":0.1,"shipments_per_month":400,"proposed_dimensions":{"length_cm":28,"width_cm":22,"height_cm":6}}'
```

Hasil utama: volume 7500 cm3, berat volume 1,25 kg, berat tertagih 1,3 kg, biaya per kirim Rp 25.600, kelebihan karena volume Rp 12.600 per kirim, penghematan ukuran usulan Rp 10.800 per kirim atau Rp 4.320.000 per bulan.

Contoh banding:

```
curl -s -X POST http://localhost:8060/api/compare \
  -H 'Content-Type: application/json' \
  -d '{"length_cm":30,"width_cm":25,"height_cm":10,"actual_weight_kg":0.6,"divisor":6000,"rate_per_kg":18000,"minimum_charge":9000,"admin_fee":1000,"packaging_cost":1200,"rounding_step":0.1,"shipments_per_month":400,"options":[{"label":"Box kecil","length_cm":20,"width_cm":20,"height_cm":5}]}'
```

## Asumsi

- Berat volume dihitung dengan rumus panjang x lebar x tinggi dalam cm dibagi pembagi.
- Berat tertagih memakai nilai terbesar antara berat aktual dan berat volume, lalu dibulatkan ke atas sesuai langkah yang dipilih.
- Tarif berat memakai minimum charge bila hasil kali berat tertagih dan tarif per kg lebih kecil dari minimum charge.
- Biaya admin dan biaya kemasan ditambahkan setelah tarif berat.
- Pembagi 5000, 6000, 7000, dan 8000 adalah preset umum, bukan tarif resmi semua kurir. Setiap kurir dan layanan bisa memakai pembagi berbeda.
- Belum termasuk asuransi, biaya area terpencil, bahan bakar, PPN, dan biaya tambahan lain.
- Proyeksi bulanan dan tahunan menganggap profil paket dan jumlah kiriman sama setiap bulan.
- Perbandingan pembagi hanya mengubah pembagi, bukan tarif per kg atau biaya lain.
- Tool tidak melakukan panggilan jaringan ke layanan kurir dan tidak menyimpan data pengguna.

## Test

```
npm test
```

Test memakai node:test dan node:assert/strict. Cakupan meliputi meta, contoh perhitungan, berat aktual yang lebih besar, berat volume yang sama dengan berat aktual, pembulatan 0,1 kg dan 1 kg, minimum charge, verdict saat volume menentukan tetapi biaya tertahan minimum, perbandingan pembagi, perbandingan beberapa ukuran, batas delapan opsi, jumlah kiriman nol, batas dimensi 300 cm, validasi input, normalisasi field opsional, CSV, dan larangan em dash serta en dash.

## Catatan

Angka pada tool adalah estimasi dari input seller, bukan tagihan resmi. Selalu cocokkan dengan tarif tertulis kurir, hasil timbangan resmi, dan pengaturan layanan yang dipakai. Untuk sengketa tagihan, simpan foto dimensi paket, bukti timbangan, dan tangkapan layar tarif.
