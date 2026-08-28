# Cek Insentif Permen UMKM 3/2026

Verifikator kelayakan diskon 50% biaya layanan marketplace untuk usaha mikro dan kecil, berdasarkan teks resmi Permen UMKM Nomor 3 Tahun 2026.

## Run

```bash
python3 server.py
```

Buka http://localhost:8034

## What it does

- Kuis kelayakan 6 syarat + 2 pengecualian kategori (pangan olahan siap saji, elektronik industri besar) dengan verdict layak / hampir layak / tidak layak
- Kalkulator penghematan per marketplace (definisi biaya layanan = administrasi + komisi + jasa aplikasi, kisaran 10-18%)
- Checklist pengajuan insentif via SAPA UMKM
- Generator surat keberatan saat marketplace menolak atau menghentikan insentif

## API

- `GET /api/status` - status kebijakan + timeline
- `GET /api/marketplaces` - daftar marketplace + default rate
- `POST /api/check` - cek kelayakan + hitung penghematan
- `POST /api/letter` - generate surat keberatan

## Notes

- Tarif default estimasi 2026, sesuaikan dengan seller center
- Per 27 Agustus 2026 implementasi ~95%, tinggal jadwal integrasi teknis dengan SAPA UMKM (ANTARA)
- Sumber: ANTARA 22 Juni 2026 (teks lengkap Permen UMKM 3/2026), ANTARA 8 Juli 2026 + 27 Agustus 2026 (timeline implementasi)
