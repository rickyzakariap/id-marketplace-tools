# UMKM Service Fee Discount Checker

Cek kelayakan diskon 50% biaya layanan marketplace untuk usaha mikro dan kecil (Permen UMKM 2026) dan simulasi penghematan per bulan.

## Run

```bash
node server.js
```

Buka http://localhost:8023

## What it does

- Kuis kelayakan 5 syarat: skala usaha, NIB, BPJS, SAPA UMKM, produk lokal
- Simulasi penghematan per marketplace (omzet bulanan x biaya layanan %)
- Rincian syarat yang belum terpenuhi + checklist persiapan
- Status kebijakan real-time (Kepmen diteken 12-13 Agustus 2026)

## API

- `GET /api/status` - status kebijakan
- `GET /api/marketplaces` - daftar marketplace + default rate
- `POST /api/check` - cek kelayakan + hitung penghematan

## Notes

- Tarif biaya layanan default hanya perkiraan 2026, sesuaikan dengan seller center
- Sumber: Permen Perlindungan dan Peningkatan Daya Saing UMKM (PP 7/2021), pemberitaan 12-13 Agustus 2026
