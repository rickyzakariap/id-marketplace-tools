# Kanal Sendiri vs Marketplace

Bandingkan profit jualan di marketplace vs kanal sendiri (WhatsApp, IG, website, toko offline).

## Run

```
./server.exe
```

Buka http://localhost:8033

## Cara pakai

1. Isi harga jual, modal (HPP), penjualan per bulan, dan pilih marketplace
2. Atur asumsi kanal sendiri: persen pembeli yang pindah, budget iklan, fee gateway
3. Klik Hitung

## Output

- Profit bersih + margin per kanal per bulan
- Break-even: berapa unit di kanal sendiri agar profitnya menyamai marketplace
- Verdict: kanal mana lebih untung, atau keduanya rugi (masalah margin produk)

## Sumber data

- The Conversation (4 Agu 2026): brand ramai-ramai keluar dari marketplace
- Katadata (20 Mei 2026): seller terimpit biaya berlapis di marketplace
- kontan.co.id (9 Mei 2026): seller cari kanal penjualan alternatif
- UKMINDONESIA.ID (22 Mei 2026): cara UMKM mulai jualan mandiri
- Fee gateway: pola Midtrans/Xendit 2,9% + Rp 2.000 per transaksi

Tarif komisi per marketplace adalah default yang bisa diedit, karena berubah per kategori dan periode. Cek seller center untuk nilai pasti.

## Tech

Go 1.26, single binary, zero dependencies, embed HTML.
