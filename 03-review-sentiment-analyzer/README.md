# Review Sentiment Analyzer

Analisa sentimen review marketplace Indonesia. Support upload CSV, paste langsung, atau pakai contoh data.

## Fitur

- Sentimen positif/negatif/netral per review
- Analisa tema (Shipping, Kualitas, Kemasan, Harga, CS, Ukuran)
- Kata kunci positif & negatif paling sering muncul
- Insight actionable untuk seller
- Review terbaik & terburuk
- Export data

## Install

```bash
npm install
node server.js
# Buka http://localhost:3457
```

## Input Format

Satu review per baris:
```
Barang bagus, pengiriman cepat
Kualitas jelek, kecewa
```

Dengan rating (rating|teks):
```
5|Barang bagus, pengiriman cepat
1|Kualitas jelek, kecewa
```

Atau upload CSV dengan kolom: text/review/ulasan, rating/bintang.

## CLI (tanpa web)

```bash
python analyze.py --sample
python analyze.py reviews.csv
```
