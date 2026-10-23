# Pelacak Tenggat Wajib Halal

Wajib sertifikasi halal mundur ke 2028, tetapi tidak semua produk mendapat tenggat yang sama. Tool ini memetakan tenggat berdasarkan kategori produk, skala usaha, dan asal produk, lalu menunjukkan jalur sertifikasi, potensi SEHATI, rencana persiapan, dokumen, dan skor kesiapan.

Berbeda dari [Cek NIB](../24-nib-deadline-checker/) yang mengurus izin usaha, tool ini fokus pada kewajiban halal produk yang dijual di marketplace.

## Run

```
npm install
npm start
```

Buka http://localhost:8039

## Fitur

- 18 kategori produk dan jasa: makanan dan minuman, hasil sembelihan, jasa penyembelihan, jasa makanan dan minuman, obat, suplemen, kosmetik, produk kimiawi, produk rekayasa genetik, barang gunaan, dan alat kesehatan kelas A sampai C.
- Tenggat sesuai PP 42/2024 sebagaimana diubah PP 40/2026, bukan satu tanggal untuk semua produk.
- Membedakan UMK dan usaha menengah atau besar. Untuk makanan, minuman, hasil sembelihan, dan jasa penyembelihan, UMK mendapat batas 17 Oktober 2028, sedangkan usaha menengah dan besar tetap 17 Oktober 2024.
- Produk impor makanan dan minuman memakai tanggal mulai wajib 18 Oktober 2028, bukan self declare UMK.
- Jasa makanan dan minuman selain jasa penyembelihan mulai wajib 18 Oktober 2028.
- Obat bebas dan obat bebas terbatas 17 Oktober 2029. Obat keras selain psikotropika dan alat kesehatan kelas C 17 Oktober 2034.
- Barang gunaan hanya wajib jika berasal dari atau mengandung unsur hewan. Produk berbahan haram tidak disertifikasi, tetapi wajib diberi keterangan tidak halal.
- Deteksi potensi SEHATI: hanya untuk UMK dalam negeri dengan kategori yang memenuhi syarat self declare. Hasil sembelihan ditandai bersyarat karena bahan hewan harus berasal dari RPH atau RPU bersertifikat halal.
- Menampilkan nilai fasilitasi SEHATI 2026 Rp 230.000 per sertifikat, kuota 1.350.000 sertifikat, dan kode SEHATI26 dari BPJPH.
- Timeline persiapan lima tahap: 18 bulan, 12 bulan, 6 bulan, 3 bulan, dan 1 bulan sebelum tenggat.
- Daftar dokumen yang perlu disiapkan, termasuk NIB, daftar bahan, bukti kehalalan bahan, manual SJPH, penyelia halal, foto produk, izin edar, dan bukti asal hewan.
- Skor kesiapan dari 12 kriteria, dengan celah dan langkah berikutnya.
- Tabel jadwal resmi penahapan dan sumber yang bisa dibuka.
- Tombol salin ringkasan hasil untuk dikirim ke tim atau pendamping.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - kategori, skala, asal, status sertifikasi, jadwal penahapan, kriteria kesiapan, sumber, dan nilai fasilitasi.
- GET /api/example - contoh isian.
- POST /api/analyze - body: category, scale, import_status, certified, contains_haram, contains_animal.
- POST /api/readiness - body: items berisi 12 kriteria kesiapan.

Contoh:

```
curl -s -X POST http://localhost:8039/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"category":"makanan_minuman","scale":"mikro","import_status":"dalam-negeri","certified":"belum","contains_haram":"tidak","contains_animal":"ya"}'
```

Hasil: status masih ada waktu, tenggat 17 Oktober 2028, sisa 725 hari, dasar PP 40/2026 Pasal 160 ayat (2), jalur SEHATI, nilai fasilitasi Rp 230.000.

Contoh usaha menengah:

```
curl -s -X POST http://localhost:8039/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"category":"makanan_minuman","scale":"menengah","import_status":"dalam-negeri","certified":"belum","contains_haram":"tidak","contains_animal":"ya"}'
```

Hasil: batas penahapan 17 Oktober 2024 sudah lewat, jalur reguler melalui LPH.

## Test

```
npm test
```

28 test Node tanpa framework tambahan: perhitungan tanggal, tenggat per kategori dan skala, produk impor, jasa, barang gunaan, bahan haram, status sertifikat, ambang status, timeline, dokumen, validasi, skor kesiapan, kelengkapan sumber, dan larangan em dash.

## Sumber utama

- ANTARA News, 17 Oktober 2026: pemerintah memperpanjang penahapan sertifikasi halal sejumlah produk dan jasa hingga Oktober 2028. UMK mendapat batas 17 Oktober 2028, jasa makanan dan minuman serta produk impor mulai 18 Oktober 2028, obat bebas 17 Oktober 2029, obat keras 17 Oktober 2034.
- BSPJI Pontianak, 20 Oktober 2026: rincian PP 40/2026 per kategori dan penegasan bahwa tenggat usaha menengah dan besar untuk makanan, minuman, hasil sembelihan, dan jasa penyembelihan tetap 17 Oktober 2024.
- ANTARA News, 22 Oktober 2026: Menteri UMKM menyebut pemerintah masih mencari formula agar kewajiban halal tidak membebani UMKM. Data yang disebut: 4,43 juta entitas usaha dan 16 juta produk bersertifikat.
- BPJPH, 5 Januari 2026: 15 kriteria UMK untuk Sertifikasi Halal Gratis (SEHATI) 2026, termasuk NIB UMK, omzet maksimal Rp 15 miliar, satu fasilitas produksi, proses sederhana, dan verifikasi Pendamping PPH.
- BPJPH, 2 Januari 2026: juknis SEHATI 2026, nilai fasilitasi Rp 230.000 per sertifikat, kuota 1.350.000, dan kode fasilitasi SEHATI26.
- PP 42/2024 tentang Penyelenggaraan Bidang Jaminan Produk Halal, Pasal 2, 158, 160, dan 161.
- detikcom, 20 Oktober 2026: alur pendaftaran gratis melalui SIHALAL, dari akun, NIB, self declare, verifikasi Pendamping PPH, sampai sertifikat.
- The Jakarta Post, 19 Oktober 2026: ringkasan tenggat per kategori, termasuk obat bebas 2029 dan obat keras 2034.

## Catatan

Tool ini bukan nasihat hukum. PP 40/2026 baru berlaku 14 Oktober 2026 dan pemerintah masih membahas formula baru untuk UMKM. Jadwal penahapan tidak menghapus kewajiban sertifikasi dan tidak menjamin marketplace menunggu sampai tenggat. Selalu cek SIHALAL dan konfirmasi ke BPJPH atau Pendamping PPH. Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.
