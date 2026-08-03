# Keyword Research Tool

Tool riset keyword untuk marketplace Indonesia (Tokopedia, Shopee, Lazada, dll).

## Cara Pakai

1. Jalankan server: `python3 server.py`
2. Buka browser: `http://localhost:3515`
3. Pilih kategori produk (Fashion, Elektronik, Kecantikan, dll)
4. Masukkan nama produk atau klik contoh
5. Klik "Generate" untuk dapat 20 keyword suggestions
6. Klik "copy" pada keyword yang mau dipakai, atau "Copy Semua"

## Fitur

- Generate 20 keyword suggestions berdasarkan kategori dan produk
- Analisa keyword: panjang, kompetisi, modifier detection
- Keyword database: modifier, material, occasion, brand, spec
- Copy individual atau semua keywords sekaligus
- Light theme, responsive design

## Tech Stack

- Python 3 stdlib (zero dependencies)
- http.server untuk API
- Vanilla HTML/CSS/JS

## API Endpoints

- POST `/api/generate` - Generate keywords
  - Body: `{"category": "fashion", "product": "kaos"}`
  - Returns: array of keywords dengan competition level dan relevance score

- POST `/api/analyze` - Analisa single keyword
  - Body: `{"keyword": "kaos polos murah"}`
  - Returns: analysis (length, word count, modifiers, suggestions)

## Categories

- Fashion: baju, kaos, kemeja, dress, dll
- Electronics: hp, laptop, earphone, charger, dll
- Beauty: skincare, makeup, lipstick, serum, dll
- Home: dekorasi, perabot, rak, lampu, dll
- Food: snack, kopi, teh, sambal, dll