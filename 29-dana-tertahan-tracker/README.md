# Dana Tertahan Tracker

Lacak saldo marketplace yang dibekukan atau ditahan platform. Dibuat untuk seller yang uang jualannya nyangkut di TikTok Shop, Tokopedia, dan marketplace lain (kasus 500 akun beku Rp 3 triliun, Juli 2026).

## Run

```bash
npm install
npm start
```

Buka http://localhost:8029

## Fitur

- Catat kasus: platform, jumlah dana, tanggal mulai, alasan, status
- Ringkasan total dana tertahan, kasus tertua, rata-rata per kasus
- Kronologi kasus saldo tertahan (Juli-Agustus 2026) dengan sumber berita
- Penjelasan alasan umum saldo ditahan
- Checklist eskalasi: CS platform, Kemenkop UKM, Komisi VII DPR, bantuan hukum
- Export CSV, contoh data, tema terang default dengan toggle gelap

## API

- GET /api/status - status kasus terkini (date-aware)
- GET /api/meta - platform, alasan, status, timeline, eskalasi
- GET /api/cases - daftar kasus
- POST /api/cases - tambah kasus
- PATCH /api/cases/:id - ubah status
- DELETE /api/cases/:id - hapus kasus
- POST /api/seed - muat contoh data
- GET /api/export - export CSV

Data tersimpan di data/cases.json. Fakta kronologi dari ANTARA, CNBC Indonesia, detikFinance, detikNews (Juli-Agustus 2026).
