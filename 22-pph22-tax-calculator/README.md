# Kalkulator PPh 22 Marketplace

Hitung pemotongan PPh Pasal 22 untuk seller marketplace Indonesia sesuai PMK 37/2025. Cek status kebijakan terbaru (ditunda/refund/berlaku), hitung potongan 0,5% dari omzet, dan simulasi per transaksi.

## Usage

```bash
./server.exe
# Open http://localhost:8022
```

## Features

- Status kebijakan real-time berdasarkan tanggal (belum berlaku, berjalan, ditunda, refund, berlaku kembali)
- Kalkulator potongan 0,5% dari peredaran bruto (di luar PPN dan PPnBM) per marketplace
- Cek status seller: wajib dipungut, dikecualikan (omzet di bawah Rp500 juta + surat pernyataan), atau berisiko dipungut
- Simulasi potongan per transaksi
- Checklist pengecualian interaktif
- Auto-fill contoh data, light minimal theme, responsive

## Aturan (PMK 37/2025)

- Tarif: 0,5% dari peredaran bruto, di luar PPN dan PPnBM
- Ambang batas: omzet tahunan Rp500 juta (gabungan semua marketplace)
- Pengecualian: omzet maksimal Rp500 juta + surat pernyataan ke marketplace, atau punya SKB
- Timeline: mulai 1 Agustus 2026, ditunda 6 Agustus 2026, refund 14 Agustus-30 September 2026, berlaku kembali 1 November 2026

## Tech Stack

- Go 1.26 (stdlib net/http, single binary)
- JSON API + vanilla HTML/CSS/JS
- Zero external dependencies
