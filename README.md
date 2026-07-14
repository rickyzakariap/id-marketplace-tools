# id-marketplace-tools

Tools buat seller marketplace Indonesia. Dibikin otomatis 1 project per hari.

## Projects

| # | Name | Type | Tech | Description |
|---|------|------|------|-------------|
| 1 | [marketplace-fee-calculator](marketplace-fee-calculator/) | CLI | Node.js | Hitung net profit setelah fee dari 6 marketplace |
| 2 | [listing-seo-analyzer](listing-seo-analyzer/) | Web | Node.js + Express | Analisa dan optimasi listing SEO |

## Cara Pakai

```bash
# Fee Calculator
cd marketplace-fee-calculator
node index.js --price 150000 --cost 80000 --compare

# Listing SEO Analyzer
cd listing-seo-analyzer
npm install
node server.js
# Buka http://localhost:3456
```

## Learning Log

Lihat [LESSONS.md](LESSONS.md) untuk feedback dan perbaikan dari setiap project.

## License

MIT
