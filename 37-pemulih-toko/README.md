# Pemulih Toko Marketplace

Toko tiba-tiba dibekukan, NIK terkunci di akun lama, akun diambil alih, atau nama dan foto dipakai akun lain? Tool ini membantu seller menghitung potensi kerugian, menyiapkan bukti, dan membuat surat banding yang spesifik.

## Run

```
npm install
npm start
```

Buka http://localhost:8037

## Fitur

- Empat jenis masalah: toko dibekukan, NIK terkunci, akun dibajak, dan identitas dipakai untuk menyerang reputasi.
- Kalkulator dampak: potensi laba hilang per hari, total kerugian selama toko terhenti, nilai per jam, dan biaya tetap.
- Tingkat urgensi otomatis: baru terjadi, perlu respons cepat, kerugian menumpuk, atau eskalasi sekarang.
- Dugaan penyebab yang perlu dicek, daftar bukti, langkah 24 jam pertama, larangan, dan jalur eskalasi per kasus.
- Generator surat banding dalam Bahasa Indonesia, bisa disalin atau diunduh sebagai .txt.
- Sumber per kasus ditampilkan di hasil, termasuk kasus terbaru dan rujukan UU PDP.
- Marketplace dipilih lewat chip row. Tema terang atau gelap mengikuti OS dan bisa diganti manual.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, dan reduced motion.

## API

- GET /api/issues - daftar jenis masalah, tanda, bukti, langkah, dan sumber.
- GET /api/platforms - daftar marketplace dan catatan.
- GET /api/sources - semua sumber yang dipakai.
- GET /api/defaults - nilai awal untuk UI.
- GET /api/example - contoh isian.
- POST /api/analyze - body: issue, platform, orders_per_day, aov, margin_pct, days_down, fixed_cost_per_day.
- POST /api/letter - body: issue, platform, seller_name, store_name, store_id, contact, case_id, chronology.

Contoh:

```
curl -s -X POST http://localhost:8037/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"issue":"suspend","platform":"shopee","orders_per_day":100,"aov":150000,"margin_pct":20,"days_down":3,"fixed_cost_per_day":250000}'
```

## Test

```
npm test
```

## Sumber utama

- Media Konsumen, 16 Oktober 2026: toko Shopee hampir 10 tahun kehilangan voucher dan Star Seller tanpa peringatan, CS hanya menyebut "kejanggalan transaksi" tanpa ID pesanan.
- Media Konsumen, 19 Oktober 2026: dana penjualan tertahan karena NIK KTP masih terdaftar di akun lama yang sudah dihapus.
- Media Konsumen, 14 Oktober 2026: nama sesuai KTP dan foto mirip AI dipakai akun lain, dua toko kena ulasan bintang 1.
- Media Konsumen, 22 Agustus 2026: NIK, NPWP, dan rekening dikunci di akun penipu sehingga pemilik sah tidak bisa mendaftar affiliate.
- Media Konsumen, 24 September 2026: modus pemulihan akun palsu meminta OTP dan memicu transaksi SPayLater.
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi: hak pembetulan dan penghapusan data.

## Catatan

Angka kerugian adalah estimasi dari input seller, bukan data resmi platform. Angka pada contoh isian juga ilustratif, bukan rata-rata pasar. Tool ini bukan nasihat hukum dan tidak menjamin pemulihan toko. Jangan pernah membagikan OTP, password, atau kode verifikasi. Kebijakan dan alur banding berbeda per marketplace, jadi selalu gunakan kanal resmi di Seller Center.
