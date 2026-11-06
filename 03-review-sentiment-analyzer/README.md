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
npm start
# Buka http://localhost:8003
```

Analisa memakai pencocokan kata utuh, bukan substring. Kata negasi hanya membalik
kata sentimen yang letaknya berdekatan, sehingga "tidak ada keluhan" tidak lagi
membalik pujian lain di review yang sama.

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
python3 cli/analyze.py --sample
python3 cli/analyze.py reviews.csv
```

## Test

```bash
npm test
```

Test menjalankan suite Node untuk web API dan suite Python untuk CLI.
