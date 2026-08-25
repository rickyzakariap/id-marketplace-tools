# Biaya Retur Tracker

Hitung kerugian nyata per retur (modal hangus, ongkir dua arah, kemasan), berapa penjualan tambahan untuk menutup satu retur, panduan kebijakan retur per marketplace, dan lacak kasus retur bermasalah dengan checklist bukti.

Dibuat dari pemberitaan: TikTok Shop 2026 membebankan biaya pengiriman gagal dan retur ke seller (Bisnis Tekno 31 Mei 2026), Menteri UMKM geram (detikFinance 21 Mei 2026), kasus retur kosong dan barang retur dijual lagi marak (Media Konsumen, BeritaSatu).

## Run

```bash
python3 server.py
```

Buka http://localhost:8031

## Fitur

- Kalkulator kerugian retur: itemized (barang, ongkir kirim, ongkir retur, kemasan), profit penjualan normal, dan berapa penjualan untuk menutup 1 retur, dengan tingkat keparahan
- Panduan kebijakan retur 6 marketplace (komisi estimasi 2026 + siapa penanggung ongkir retur)
- Checklist 6 bukti saat barang retur tiba dan 6 red flag retur bodong
- Lacak kasus: tambah, ubah status (baru, bukti, diajukan, diproses, disetujui, ditolak, kompensasi), checklist bukti per kasus, export CSV
- Tema terang default dengan toggle gelap, responsive, contoh data, Enter hitung / Escape bersihkan

## API

- GET /api/meta - marketplaces, checklist bukti, red flag, status, sumber
- POST /api/calculate - hitung kerugian retur
- GET /api/cases, POST /api/cases - daftar / tambah kasus
- POST /api/cases/update, POST /api/cases/delete - ubah status / hapus
- GET /api/export - export CSV
