# Pemeriksa Tenggat Banding Retur

Alat bantu untuk menghitung sisa jendela banding retur 7 hari di TikTok Shop by Tokopedia, memeriksa syarat video unboxing dan pengemasan, mengukur kesiapan bukti, mencatat kasus, dan menyusun surat banding.

Dibuat dari perubahan kebijakan purnajual 27 Oktober sampai 5 November 2026: tenggat banding 7 hari kalender, video unboxing dan pengemasan wajib pada kondisi tertentu, satu kali banding per kasus, batas 24 jam untuk info tambahan, jendela retur Tokopedia Mall 15 hari, dan kewajiban mengirim barang retur ke pembeli bila diminta agen CS.

## Run

```bash
cd 51-pemeriksa-tenggat-banding-retur
npm install
npm start
```

Buka `http://localhost:8051`.

Data kasus disimpan di `data/cases.json` dan tidak masuk git.

## Fitur

- Menghitung batas banding 7 hari kalender dari tanggal mulai yang Anda masukkan.
- Menampilkan sisa hari, status jendela (terbuka, segera, hari ini, lewat), batas aman satu hari lebih awal, dan tanggal saran pengajuan hari ke-3 sebagai rekomendasi, bukan aturan platform.
- Memeriksa jendela retur pembeli: 15 hari untuk pesanan Mall sejak 2 November 2026 dan 6 hari untuk Non-Mall. Pesanan Mall sebelum 2 November 2026 tetap memakai 6 hari.
- Menentukan syarat video berdasarkan alasan banding: unboxing, pengemasan, keduanya, atau tidak perlu.
- Menilai 16 bukti dengan 9 bukti kritis, termasuk video 6 sisi, video unboxing utuh, video pengemasan dengan nomor pesanan, resi retur, dan kronologi.
- Menghitung batas 24 jam untuk info tambahan bila waktu permintaan diisi.
- Memberi sinyal untuk instruksi CS yang belum dijalankan, banding yang sudah pernah diajukan, dan bukti kritis yang kurang.
- Membuat tiga surat: pengajuan banding, jawaban permintaan info tambahan, dan eskalasi banding.
- Mencatat kasus per toko, mengubah status, menghapus kasus, dan mengekspor CSV.
- Menampilkan sumber kebijakan resmi dan tanggal berlakunya.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/meta` | Pilihan, aturan, daftar bukti, status, surat, dan sumber |
| GET | `/api/example` | Contoh kasus yang bisa langsung dihitung |
| POST | `/api/analyze` | Validasi, hitung tenggat, syarat video, dan kesiapan bukti |
| POST | `/api/letter` | Susun surat banding, klarifikasi, atau eskalasi |
| GET | `/api/cases` | Ringkasan kasus, jatuh tempo, dan jendela lewat |
| POST | `/api/cases` | Simpan kasus baru |
| PATCH | `/api/cases/:id` | Ubah status atau isi kasus |
| DELETE | `/api/cases/:id` | Hapus kasus |
| POST | `/api/seed` | Simpan satu kasus contoh |
| GET | `/api/export` | Unduh kasus sebagai CSV |

Contoh analisis:

```bash
curl -s http://localhost:8051/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Toko Uji",
    "platform": "tiktok",
    "order_type": "mall",
    "order_ref": "UJI-001",
    "case_type": "refund_only",
    "trigger_date": "2026-11-04",
    "appeal_reason": "wrong_product",
    "buyer_reason_matches": "ya",
    "evidence": ["order_detail", "buyer_request", "refund_proof"]
  }'
```

## Test

```bash
npm test
```

29 unit test mencakup validasi tanggal, perhitungan tenggat 7 hari, jendela retur Mall dan Non-Mall, syarat video per alasan, skor bukti, sinyal CS, batas info tambahan, tiga surat, ringkasan kasus, ekspor CSV, contoh, metadata, dan pemeriksaan halaman statis.

## Batas

- Hasil adalah panduan internal, bukan jaminan banding diterima dan bukan keputusan resmi platform.
- Tanggal cutoff mengikuti zona waktu platform. Cocokkan tanggal di Seller Center sebelum mengirim banding.
- Tool ini memuat aturan TikTok Shop by Tokopedia dan Tokopedia. Untuk platform lain, cocokkan kebijakan masing-masing.
- Tanggal mulai untuk kasus barang retur yang belum diterima harus diambil dari tanggal buka jendela di Seller Center, bukan dihitung otomatis dari tanggal unggah resi.
- Rekomendasi hari ke-3 adalah saran operasional dari ringkasan kebijakan, bukan tenggat resmi.
- Batas utama memakai hitungan 7 hari setelah tanggal mulai. Karena sebagian penjual menghitung tanggal mulai sebagai hari ke-1, tool juga menampilkan batas aman satu hari lebih awal. Cocokkan dengan tanggal di Seller Center.
- Data kasus bersifat lokal dan tidak disinkronkan ke perangkat lain.

## Sumber

- TikTok Shop by Tokopedia Seller Center, Pembaruan Kebijakan Terkini, 29 Oktober 2026: `https://seller-id.tokopedia.com/university/essay?knowledge_id=4293090979071761&lang=id-ID`
- TikTok Shop by Tokopedia Seller Center, Returns and Refunds, 29 Oktober 2026: `https://seller-id.tokopedia.com/university/essay?knowledge_id=1683292773779217&lang=en`
- Superseller.id, Banding Retur TikTok Shop Berubah: 7 Hari dan Video Wajib, 4 November 2026: `https://supersellerid.com/banding-retur-tiktok-shop/`
- Tuke Marketing, TikTok Shop Tetapkan Jendela Banding 7 Hari Mulai 27 Oktober 2026, 21 Oktober 2026: `https://www.tktk.com/id/news/4061.html`
- Ksher, Tokopedia Ubah Aturan Purnajual, 5 November 2026: `https://www.ksher.cn/news/post/kjzx26110504/`
