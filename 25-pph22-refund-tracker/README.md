# PPh 22 Refund Tracker

Web tool untuk seller marketplace yang dana PPh 22-nya sempat dipotong 1-5 Agustus 2026 dan dikembalikan otomatis (14 Agustus - 30 September 2026).

## Run

```
go build -o server.exe .
./server.exe
```

Buka http://localhost:8025

## Fitur

- Status kebijakan real-time (date-aware): masa refund berjalan, progress bar jendela refund
- Estimasi dana refund: omzet 1-5 Agustus x 0,5%
- Status per marketplace: Shopee, Tokopedia, Blibli, Lazada (jadwal refund resmi masing-masing)
- Cek status omzet: di atas atau di bawah Rp 500 juta (surat pernyataan)
- Kronologi penundaan + FAQ + sumber berita

## Sumber

detikFinance 10 Agu 2026 (refund Shopee/Tokopedia/Blibli), kontan 2-3 Agu 2026 (protes penjual), DDTCNews 6 Agu 2026 (penundaan), Ortax (idEA usul Januari 2027), Bloomberg Technoz 15 Agu 2026.
