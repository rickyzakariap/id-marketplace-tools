# Hak Tolak Seller

Cek apakah kamu berhak menolak perubahan kebijakan sepihak marketplace, lalu buat surat keberatan resmi. Dibuat dari pemberitaan Permendag 19/2026 (revisi Permendag 31/2023 tentang PMSE) yang mewajibkan marketplace memperoleh persetujuan penjual sebelum mengubah biaya, komisi, atau mekanisme layanan.

## Run

```bash
go build -o server.exe .
./server.exe
```

Buka http://localhost:8030

## Fitur

- Cek hak tolak: masukkan platform, jenis perubahan, tanggal berlaku, dan status persetujuan, dapatkan verdict (berhak tolak, sebelum aturan, sudah disetujui, di luar cakupan)
- Surat keberatan: generate surat formal siap kirim ke seller center, dengan tombol salin
- Lacak kasus: simpan surat yang dibuat, ubah status (draft, dikirim, ditanggapi, eskalasi, selesai), export CSV
- Kronologi aturan (Mei-Juni 2026), jalur eskalasi 5 langkah, daftar sumber
- Tema terang default dengan toggle gelap, responsive, contoh data

## API

- GET /api/policy - status kebijakan (date-aware)
- GET /api/meta - platform, jenis perubahan, timeline, eskalasi, sumber
- POST /api/check - cek hak tolak
- POST /api/letter - generate surat keberatan (opsional simpan ke kasus)
- GET /api/cases, POST /api/cases - daftar / tambah kasus
- PATCH /api/cases/:id - ubah status
- DELETE /api/cases/:id - hapus kasus
- POST /api/seed - muat contoh data
- GET /api/export - export CSV

Data tersimpan di data/cases.json. Alat ini disusun dari pemberitaan (nusantaranews.co, suara.com, kompas.com, ikpi.or.id), bukan nasihat hukum.
