# UMKM Service Fee Discount Checker

Cek kelayakan diskon 50% biaya layanan marketplace untuk usaha mikro dan kecil (Permen UMKM 3/2026, berlaku efektif 25 Oktober 2026) dan simulasi penghematan per bulan.

## Run

```bash
node server.js
```

Buka http://localhost:8023

## Fitur

- Status kebijakan date-aware: sebelum 25 Oktober 2026 tampil hitung hari, setelahnya tampil aktif
- Kuis kelayakan 5 syarat: skala usaha, NIB, SAPA UMKM, produk lokal, dan rekam jejak usaha bersih
- 2 pengecualian kategori (pangan olahan siap saji, elektronik industri besar) sesuai Permen UMKM 3/2026
- Simulasi penghematan per marketplace (omzet bulanan x biaya layanan %)
- Rincian syarat yang belum terpenuhi + checklist persiapan
- Tarif default adalah estimasi total biaya layanan 2026 (kisaran 10-18%, bisa diedit)

## API

- `GET /api/status` - status kebijakan, tanggal berlaku, SLA verifikasi
- `GET /api/marketplaces` - daftar marketplace + default rate
- `POST /api/check` - cek kelayakan + hitung penghematan

## Test

```bash
npm test
```

13 unit test (node assert): status sebelum/sesudah 25 Oktober, kelima syarat, dua pengecualian, batas rate, validasi input, dan matematika penghematan.

## Notes

- Tarif biaya layanan default hanya estimasi 2026, sesuaikan dengan seller center
- Insentif berlaku efektif 25 Oktober 2026 (Kepmen UMKM 398/2026), verifikasi platform maksimal 10 hari kalender, insentif diberikan paling lambat 5 hari setelah dua tahap verifikasi
- Sumber: Permen UMKM 3/2026; ANTARA 16-17 Oktober 2026; Bisnis.com 17 Oktober 2026; Kompas.com 7 Oktober 2026
- Cek tool #34 (insentif-permen-2026) untuk verifikasi 7 syarat, alur pengajuan lengkap, dan surat keberatan
