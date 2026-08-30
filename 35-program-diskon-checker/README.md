# Program Diskon Checker

Cek margin setelah program diskon marketplace aktif. Jawab pertanyaan: harga jual berapa yang tetap untung kalau toko kena flash sale, voucher, atau program gratis ongkir?

## Run

```
npm install
npm start
```

Buka http://localhost:8035

## Fitur

- Hitung margin per unit tanpa program vs dengan program (flash sale, voucher toko, gratis ongkir, bisa stack)
- Verdict otomatis: aman / margin tipis / rugi per unit
- Pricing buffer: harga jual yang harus dipasang agar margin target tercapai meski program diskon berjalan, dengan varian pembulatan 500-an dan X999
- "1 penjualan program = N penjualan normal" saat program bikin rugi
- Audit checklist seller center: tab Promosi/Kampanye/Voucher Toko, email folder Promosi/Spam, keluar kampanye
- Light minimal theme, responsive, auto-fill contoh

## API

- GET /api/marketplaces - daftar marketplace + biaya layanan default
- GET /api/checklist - audit checklist
- POST /api/analyze - body: hpp, harga_jual, fee_rate, target_margin, flash_sale, voucher_toko, gratis_ongkir

Contoh: HPP 40.000, target margin 20%, flash sale 20%, fee 0 -> buffer 62.500 (artikel UKMINDONESIA).
