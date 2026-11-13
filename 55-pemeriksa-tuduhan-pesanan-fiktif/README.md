# Pemeriksa Tuduhan Pesanan Fiktif

Toko dituduh pesanan fiktif atau menyalahgunakan subsidi, lalu saldo ditahan, dipotong, atau diambil meski pelanggaran sudah dibatalkan? Tool ini menghitung dana berisiko, menilai kelengkapan pembelaan, memetakan bukti, melacak tanggal penting, dan menyiapkan surat banding atau pemulihan saldo.

Berbeda dari [Dana Tertahan Tracker](../29-dana-tertahan-tracker/) yang mencatat saldo yang dibekukan, tool ini fokus pada pembelaan atas tuduhan pesanan fiktif dan pemulihan saldo setelah sanksi. Berbeda juga dari [Pelacak Poin Penalti](../38-pelacak-poin-penalti/) yang mengurus poin dan banding poin, [Pemulih Toko](../37-pemulih-toko/) yang memulihkan akses akun, dan [Pemeriksa Refund Tanpa Retur](../50-pemeriksa-refund-tanpa-retur/) yang fokus pada barang tidak kembali.

## Run

```
npm install
npm start
```

Buka http://localhost:8055

## Fitur

- Menghitung saldo sebelum sanksi, saldo ditahan, saldo dipotong, saldo yang sudah dikembalikan, dana berisiko, dan selisih saldo yang tidak cocok.
- Menghitung laba hilang selama toko nonaktif dari pesanan per hari, nilai pesanan rata-rata, margin, dan lama nonaktif.
- Memisahkan dana berisiko dan laba hilang. Dampak total menjumlahkan keduanya agar tidak dihitung dua kali.
- Skor pembelaan 0 sampai 100 dari 14 fakta dan kesiapan bukti. Skor adalah heuristik internal, bukan peluang menang.
- Tiga belas penanda proses: keputusan otomatis, tanpa alasan tertulis, tanpa daftar ID pesanan, tanpa peninjauan manusia, tanpa bukti pelanggaran, alasan berubah, banding dibatasi, kasus ditutup belum selesai, sanksi batal tetapi saldo belum pulih, potong sebelum masa tahan berakhir, potongan tanpa rincian, jawaban banding lewat janji, dan angka saldo tidak cocok.
- Empat belas fakta dengan pilihan ya, tidak, atau belum tahu.
- Skor kesiapan 13 bukti. Lima bukti kritis berbobot dua kali: notifikasi sanksi, daftar ID pesanan, resi dan serah terima, mutasi rekening, serta bukti program subsidi resmi.
- Tanggal penting: lama sejak tuduhan, selisih hasil banding, sisa masa tahan, dan jumlah bukti kritis yang kurang.
- Tiga surat: banding tuduhan, permintaan pemulihan saldo, dan eskalasi ke Kementerian UMKM melalui SP4N-Lapor.
- Catatan kasus per toko dengan nomor tiket, status, verdict, dan dana berisiko.
- Ekspor CSV dengan netralisasi formula.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, jenis tuduhan, status sanksi, status kasus, fakta, bukti, ambang, aturan, dan sumber.
- GET /api/example - contoh isian dari kasus 12 November 2026.
- POST /api/analyze - body: data toko, tanggal, saldo, pesanan per hari, nilai pesanan, margin, fakta, dan bukti.
- POST /api/readiness - body: evidence atau items berisi id bukti yang sudah dimiliki.
- POST /api/letter - body: data kasus dan letter_type (banding, pemulihan, eskalasi).
- GET /api/cases - daftar kasus, jumlah terbuka, sanksi batal yang saldo belum pulih, dana berisiko, dan dampak total.
- POST /api/cases - tambah kasus. Nama toko dan tanggal tuduhan wajib.
- PATCH /api/cases/:id - ubah status atau data kasus.
- DELETE /api/cases/:id - hapus kasus.
- POST /api/seed - muat contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8055/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"store_name":"Toko Contoh Sejahtera","marketplace":"tiktok","trigger":"subsidi_voucher","sanction_status":"pelanggaran_dibatalkan","accusation_date":"2026-05-10","deactivation_date":"2026-05-10","reactivated_date":"2026-11-05","appeal_date":"2026-10-20","appeal_result_date":"2026-11-05","deduction_date":"2026-08-07","hold_end_date":"2026-08-08","as_of":"2026-11-13","balance_held":0,"balance_deducted":38513620,"balance_restored":0,"balance_before":38513620,"orders_per_day":15,"aov":65000,"margin_pct":20,"facts":{"written_reason":"ya","order_ids":"tidak","human_review":"ya","deduction_breakdown":"tidak","official_subsidy":"tidak_tahu","shipping_proof":"ya","stock_invoice":"ya","buyer_received":"ya","appeal_result_written":"ya","automated_decision":"ya","reason_changed":"tidak","appeal_limited":"ya","case_closed":"ya","platform_evidence":"tidak"},"evidence":["sanction_notice","shipping_receipt","stock_invoice","stock_photo","cs_chat","appeal_email","appeal_result","buyer_confirmation","escalation_report"]}'
```

Hasil: dana berisiko Rp 38.513.620, laba hilang Rp 34.905.000, dampak total Rp 73.418.620, toko nonaktif 179 hari, skor pembelaan 59 dari 100 (Sedang), 8 dari 13 penanda terpicu (Kuat), kesiapan bukti 61 persen (Sebagian siap), verdict "Sanksi batal, saldo belum pulih".

## Test

```
npm test
```

24 test Node tanpa framework tambahan: meta dan sumber, analisis contoh, perhitungan dana berisiko, selisih saldo, lama nonaktif, laba hilang, skor pembelaan, pengaruh keputusan otomatis, penanda sanksi batal, tenggat jawaban banding, verdict aman, tanggal penting, kesiapan bukti, tiga surat, CSV, ringkasan kasus, validasi nominal dan tanggal, fallback pilihan, serta larangan em dash.

## Sumber utama

- Media Konsumen, 12 November 2026: toko TikTok Shop Tokopedia dinonaktifkan 10 Mei 2026 karena diduga menyalahgunakan subsidi. Saldo Rp38.513.620 ditahan 90 hari sampai 8 Agustus 2026, lalu diambil seluruhnya pada 7 Agustus 2026. Setelah mediasi Kementerian UMKM dan banding, pelanggaran dibatalkan dan toko bisa diakses lagi, tetapi saldo tetap Rp0.
- Media Konsumen, 12 September 2026: tuduhan fake order 11 Juni 2026 setelah toko ikut program subsidi resmi. Saldo Rp12.805.727 dipotong, toko dinonaktifkan, dan sisa Rp13.421.313 ditahan 90 hari. Banding lewat Seller Center ditolak otomatis tanpa peninjauan manusia.
- ANTARA News, 8 September 2026: dalam dengar pendapat Komisi VII DPR RI, platform menyebut 217 penjual terdampak dengan dana Rp24 miliar dan Rp16,7 miliar di antaranya terkait fraud. Platform menyatakan investigasi 90 hari plus 90 hari dan penjual tetap dapat mengajukan banding.
- detikFinance, 1 Oktober 2026: dua penjual kehilangan saldo yang berubah menjadi Rp0, masing-masing Rp549 juta dan sekitar Rp566 juta.

## Catatan

Angka pada contoh adalah ilustrasi dari fakta pemberitaan, bukan data resmi platform. Janji jawaban 14 hari kalender tercatat pada kasus contoh dan bukan aturan umum. Jangka 90 hari plus 90 hari berasal dari pernyataan platform dalam dengar pendapat DPR, bukan aturan tertulis. Tool ini bukan nasihat hukum dan tidak menjamin banding atau pemulihan saldo. Selalu gunakan kanal resmi Seller Center, simpan dokumen asli, dan jangan membagikan OTP, password, atau kode verifikasi.
