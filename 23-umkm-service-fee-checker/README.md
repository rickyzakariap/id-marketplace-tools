# UMKM Service Fee Discount Checker

Cek kelayakan diskon 50% biaya layanan marketplace untuk usaha mikro dan kecil (Permen UMKM 2026) dan simulasi penghematan per bulan.

## Run

```bash
node server.js
```

Buka http://localhost:8023

## What it does

- Kuis kelayakan 4 syarat: skala usaha, NIB, SAPA UMKM, produk lokal
- 2 pengecualian kategori (pangan olahan siap saji, elektronik industri besar) sesuai Permen UMKM 3/2026
- Simulasi penghematan per marketplace (omzet bulanan x biaya layanan %)
- Rincian syarat yang belum terpenuhi + checklist persiapan
- Status kebijakan real-time (per 29 Agustus 2026: Kepmen belum diteken, target tahapan final pekan depan)

## API

- `GET /api/status` - status kebijakan
- `GET /api/marketplaces` - daftar marketplace + default rate
- `POST /api/check` - cek kelayakan + hitung penghematan

## Notes

- Tarif biaya layanan default hanya perkiraan 2026, sesuaikan dengan seller center
- Sumber: Permen UMKM 3/2026 (teks final), ANTARA 28-29 Agustus 2026 (alur pengajuan resmi)
- Cek tool #34 (insentif-permen-2026) untuk verifikasi 2 tahap, surat keberatan, dan syarat lengkap
