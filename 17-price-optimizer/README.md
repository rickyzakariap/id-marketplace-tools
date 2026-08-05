# Price Optimizer

Rekomendasi harga terbaik berdasarkan kategori produk dan marketplace.

## Cara Pakai

```bash
# Build dan jalankan
go mod init price-optimizer
go build -o optimizer.exe .
./optimizer.exe

# Buka browser
http://localhost:3717
```

## Fitur

- Rekomendasi harga optimal berdasarkan kategori dan marketplace
- Simulasi kompetitor dengan harga, rating, dan volume penjualan
- 5 saran harga: minimum, kompetitif, optimal, premium, tinggi
- Insight otomatis: X999 pricing, goceng, margin analysis
- 8 kategori produk Indonesia (fashion, elektronik, kecantikan, dll)
- 6 marketplace dengan fee structure akurat (Shopee, Tokopedia, Lazada, dll)
- Light/dark theme toggle
- Responsive design

## API Endpoints

- `GET /api/categories` - List semua kategori
- `GET /api/marketplaces` - List marketplace dengan fee
- `POST /api/analyze` - Analisa harga produk
- `GET /api/history` - Riwayat analisa

## Tech Stack

- Go 1.26 (backend)
- Vanilla HTML/CSS/JS (frontend)
- Zero external dependencies