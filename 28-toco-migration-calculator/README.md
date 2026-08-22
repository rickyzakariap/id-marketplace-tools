# Toco Migration Calculator

Bandingkan profit jualan di Toco (komisi seller 0%) vs Shopee, TikTok Shop, Tokopedia, Lazada, Bukalapak, dan Blibli. Jawab pertanyaan: pindah ke Toco atau bertahan?

## Run

```bash
npm install
node server.js
```

Buka http://localhost:8028

## What it does

- 7 marketplace dengan struktur biaya 2026: Toco 0% komisi, Shopee grup A-X (hingga 10%), TikTok Shop tarif baru 18 Mei 2026 (cap Rp650.000), plus Tokopedia/Lazada/Bukalapak/Blibli
- Profit per item dan per bulan per marketplace, diurutkan dari yang paling untung
- Selisih profit Toco vs marketplace sekarang
- Traffic reality check: geser slider estimasi volume di Toco, lihat mana yang tetap lebih untung
- Break-even: berapa unit di Toco agar profit bulanan sama dengan marketplace sekarang
- Auto-fill contoh, light minimal theme, responsive, toggle dark/light

## API

```
GET  /api/meta        daftar marketplace + kategori
POST /api/calc        hitung profit semua marketplace
                      body: {category, price, modal, volume, current_marketplace}
```

## Catatan

Perhitungan belum termasuk ongkir, pajak, dan biaya program promosi. Toco masih baru dengan traffic jauh lebih kecil dari marketplace besar. Tarif bisa berubah sewaktu-waktu.

Sumber: katadata.co.id (20 Jun 2025), antaranews.com (4 Mar 2026), metrotvnews.com (biaya admin Shopee 2026), associe.co.id (8 Mei 2026, tarif TikTok Shop).
