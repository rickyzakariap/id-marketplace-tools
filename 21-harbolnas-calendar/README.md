# Kalender Promo Marketplace

Kalender event promo marketplace Indonesia: Harbolnas, payday sale, Ramadan, Lebaran, dan tahun baru. Countdown real-time, filter per kategori dan marketplace, checklist persiapan per event.

## Usage

```bash
python3 server.py
# Open http://localhost:8021
```

## Features

- Countdown ke event berikutnya (hari, minggu, kapan mulai persiapan)
- 6 kategori: Harbolnas, Payday, Ramadan, Lebaran, Imlek, Tahun Baru
- Filter per kategori dan marketplace
- Checklist persiapan per event (stok, voucher, iklan, CS)
- Tanggal perkiraan ditandai untuk Ramadan, Lebaran, Imlek
- Payday sale digenerate otomatis tiap bulan
- Light minimal theme dengan dark mode toggle, responsive

## Tech Stack

- Python 3.12 (http.server, stdlib only)
- JSON API + vanilla HTML/CSS/JS
- Zero external dependencies
