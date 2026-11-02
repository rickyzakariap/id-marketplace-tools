# Pemeriksa Potongan Pesanan Batal

Pesanan dibatalkan pembeli sebelum dikirim, tetapi komisi dan biaya pemrosesan tetap muncul di settlement. Paket sudah dikirim lalu diretur, tetapi ongkir dua arah dibebankan penuh kepada penjual. Pembeli sudah membayar ongkir, tetapi penjual masih ditagih ongkir yang sama. Kasus 12 Oktober 2026 di Media Konsumen menunjukkan penjual TikTok Shop di Semarang mengalami potongan setelah pesanan dibatalkan, termasuk ongkir yang disebut ditagih dua kali.

Tool ini membandingkan potongan aktual dari settlement dengan perkiraan berdasarkan kebijakan yang Anda masukkan, menilai indikasi selisih, menyusun bukti, melacak kasus, dan membuat surat permintaan rincian, keberatan, atau eskalasi.

Berbeda dari [Biaya Retur Tracker](../31-biaya-retur-tracker/) yang menghitung kerugian setelah retur terjadi, [Pemeriksa Pesanan COD](../46-pemeriksa-pesanan-cod/) yang menilai risiko sebelum paket dikirim, [Pelacak Poin Penalti](../38-pelacak-poin-penalti/) yang membahas poin dan banding, dan [Pemeriksa Kampanye Sepihak](../45-pemeriksa-kampanye-sepihak/) yang mengaudit pendaftaran kampanye, tool ini fokus pada **audit potongan setelah pesanan batal atau retur**: komisi, biaya pemrosesan, ongkir, refund, dan dasar kebijakan.

## Run

```
npm install
npm start
```

Buka http://localhost:8047

## Fitur

- Perbandingan potongan aktual dan perkiraan kebijakan per komponen: komisi platform, komisi dinamis, biaya pemrosesan, ongkir, dan biaya lain.
- Komisi platform 2,50 sampai 12,20 persen dan komisi dinamis 3 sampai 8 persen dengan batas Rp 650.000 per item atau SKU. Kedua tarif bisa diedit dan ditandai sebagai estimasi.
- Biaya pemrosesan Rp 1.250 hanya dihitung untuk pesanan yang dikirim. Pesanan yang dibatalkan sebelum dikirim tidak mengharapkan komisi maupun biaya pemrosesan.
- Ongkir perkiraan mengikuti status pesanan dan penyebab retur: masa tenggang Rp 0, kontribusi maksimal Rp 5.000 per arah, atau beban penuh bila memang kebijakan toko. Retur kesalahan logistik tidak membebani penjual.
- Selisih, persentase selisih, perkiraan dana bersih, dan potensi kebocoran bulanan dari jumlah pesanan serupa.
- Skor indikasi dari 13 indikator otomatis dan 6 indikator manual, dengan label heuristik. Skor bukan putusan bahwa platform melakukan pelanggaran.
- Lima status pesanan, empat penyebab retur, tiga kebijakan ongkir, enam status kasus, dan tiga jenis surat.
- Skor kesiapan 13 bukti dengan lima bukti kritis: rincian settlement, detail pesanan, bukti pembatalan, bukti refund atau retur, dan kartu tarif.
- Catatan kasus per pesanan dengan status, nomor tiket, tanggal follow-up terakhir, peringatan otomatis, ringkasan selisih, dan ekspor CSV.
- Tiga generator surat: permintaan rincian potongan, keberatan atas potongan yang tidak sesuai, dan eskalasi setelah tiket ditutup.
- Peringatan untuk platform selain TikTok Shop by Tokopedia: tarif dan batas di tool ini berasal dari kartu tarif TikTok dan tidak boleh dipakai langsung untuk platform lain.
- Sumber berita dan dokumentasi Seller Center ditampilkan di UI dan README. Tidak ada tingkat keberhasilan, SLA, atau angka kompensasi yang dikarang.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, Google Sans weight 500, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - platform, status pesanan, penyebab retur, kebijakan ongkir, 13 indikator otomatis, 6 indikator manual, 13 bukti, status kasus, jenis surat, sumber, kebijakan, dan default.
- GET /api/example - contoh isian dengan tanggal relatif terhadap hari ini.
- POST /api/analyze - body: platform, order_state, return_cause, shipping_policy, order_id, product_name, store_name, store_id, order_date, settlement_date, followup_date, unit_price, discount_per_unit, qty, platform_rate, dynamic_rate, shipping_per_direction, shipping_directions, buyer_shipping_paid, refund_to_buyer, actual_commission, actual_processing, actual_shipping, actual_other, orders_per_month, manual_signals, evidence.
- POST /api/readiness - body: items berisi id bukti yang sudah tersedia.
- POST /api/letter - body: data pesanan dan toko, ditambah seller_name, contact, ticket, chronology, letter_type.
- GET /api/cases - daftar kasus, jumlah terbuka, total selisih, selisih terbuka, umur kasus terbuka tertua, peringatan, dan ringkasan per status.
- POST /api/cases - tambah catatan kasus.
- PATCH /api/cases/:id - ubah status, tanggal follow-up terakhir, sinyal, atau bukti.
- DELETE /api/cases/:id - hapus catatan.
- POST /api/seed - muat 3 contoh kasus.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8047/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"tiktok","order_state":"batal_setelah_kirim","return_cause":"pembeli","shipping_policy":"grace","order_id":"586224247341024870","product_name":"Masker Kain Premium","store_name":"Toko Contoh","store_id":"toko-contoh","order_date":"2026-10-19","settlement_date":"2026-10-30","followup_date":"2026-11-01","unit_price":150000,"discount_per_unit":0,"qty":2,"platform_rate":8,"dynamic_rate":4,"shipping_per_direction":12000,"shipping_directions":1,"buyer_shipping_paid":12000,"refund_to_buyer":300000,"actual_commission":36000,"actual_processing":1250,"actual_shipping":24000,"actual_other":0,"orders_per_month":12,"manual_signals":["rincian_tidak_diminta","cs_hanya_template"],"evidence":["settlement_detail","order_detail","refund_proof","rate_card","chat_history","ticket_number","buyer_shipping_paid","timeline"]}'
```

Hasil pada 2 November 2026: potongan aktual Rp 61.250, perkiraan Rp 37.250, selisih Rp 24.000 (64,4 persen), perkiraan dana bersih minus Rp 61.250, potensi kebocoran Rp 288.000 per bulan, indikasi 83/100, kesiapan bukti 67/100, verdict ajukan keberatan.

## Test

```
npm test
```

65 test Node tanpa framework tambahan: format angka dan tanggal, selisih hari, perhitungan komisi platform dan dinamis, batas Rp 650.000 per unit, biaya pemrosesan hanya saat dikirim, ongkir per status dan penyebab retur, kontribusi Rp 5.000 per arah, refund sebagian, selisih dan potensi kebocoran, verdict, bobot indikasi, kesiapan bukti kritis, validasi tanggal dan nominal, validasi kasus, ringkasan dan peringatan, isi tiga surat, meta, sumber, serta tidak adanya em dash.

## Sumber utama

- Media Konsumen, 12 Oktober 2026: penjual TikTok Shop di Semarang melaporkan pesanan dibatalkan pembeli, tetapi komisi dan biaya pemrosesan tetap ditagih. Ongkir yang sudah dibayar pembeli disebut ditagih lagi ke penjual. Ini pengaduan penjual, bukan putusan platform.
- Media Konsumen, 6 Oktober 2026: penjual mengeluhkan biaya yang tetap dibebankan saat pembeli mengajukan retur, sementara barang retur rusak tidak diganti. Kasus ini menunjukkan pentingnya memisahkan potongan yang sesuai kebijakan dari yang perlu dipertanyakan.
- Media Konsumen, 5 Juni 2026: contoh lama potongan yang melebihi perkiraan penjual. Nominal berasal dari pengaduan penjual, bukan tarif resmi.
- TikTok Shop by Tokopedia Seller Center, Shop Operation: komisi platform 2,50 sampai 12,20 persen sesuai kategori. Komisi dinamis 3 sampai 8 persen dengan batas Rp 650.000 per item atau SKU mulai 18 Mei 2026. Biaya pemrosesan order Rp 1.250 per pesanan yang berhasil dikirim.
- TikTok Shop by Tokopedia Seller Center, Kebijakan Pembatalan dan Pengembalian Dana: retur kesalahan logistik dapat mengembalikan komisi terkait produk retur. Mulai 1 Juni 2026, retur kesalahan pembeli dikenakan kontribusi hingga Rp 5.000 per arah, dengan masa tenggang sampai pemberitahuan lebih lanjut.
- Bisnis.com, 11 Agustus 2025: biaya pemrosesan Rp 1.250 per pesanan yang berhasil dikirim. Biaya dikembalikan penuh bila seluruh pesanan dibatalkan sebelum dikirim. Bila sudah terkirim lalu retur atau refund, biaya tidak dikembalikan.
- teknologi.bisnis.com, 16 Mei 2026: komisi dinamis tidak dikembalikan bila pesanan sudah dikirim lalu diretur atau direfund. Batas lama Rp 40.000 per item naik menjadi Rp 650.000 mulai 18 Mei 2026.

## Catatan

Tool ini alat bantu audit operasional, bukan nasihat hukum. Selisih dihitung dari input Anda dan tarif contoh, bukan dari data resmi platform. Kasus yang dipakai sebagai sumber adalah pengaduan penjual, bukan putusan platform. Potongan yang sesuai kebijakan tetap sah. Tarif dan batas yang dipakai berasal dari TikTok Shop by Tokopedia, jadi jangan memakai angka yang sama untuk platform lain tanpa mencocokkan kebijakan platform tersebut. Keputusan koreksi, pengembalian biaya, dan sanksi tetap berada pada platform. Simpan rincian settlement, detail pesanan, bukti batal atau retur, dan kartu tarif sebelum mengubah status atau menutup kasus. Jangan membagikan OTP, password, atau kode verifikasi kepada pihak yang tidak berwenang.
