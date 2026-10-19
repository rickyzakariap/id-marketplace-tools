# Kalkulator Biaya Total Marketplace

Hitung semua biaya seller di marketplace dalam satu angka. Jawab pertanyaan: dari harga jual, berapa persen habis untuk platform, dan berapa laba bersih sebenarnya?

## Run

```
npm install
npm start
```

Buka http://localhost:8036

## Fitur

- Tumpuk komponen biaya berlapis: komisi/admin, program gratis ongkir, iklan, komisi afiliasi, biaya proses pesanan, layanan logistik, kemasan, estimasi retur
- Total biaya dalam Rupiah dan persen dari harga jual, laba bersih, margin bersih
- Verdict otomatis: sehat / margin tipis / rugi per transaksi
- Peringatan bila total biaya >= 30% dari harga jual
- Target harga jual minimum agar margin target tercapai (atau "tidak tercapai" bila total biaya persen + target margin >= 100%)
- Default rate per marketplace dan komponen biaya diground dari laporan publik 2026, semua bisa diedit
- Marketplace dipilih lewat chip row, tema terang/gelap otomatis ikut OS dengan tombol toggle
- Visual mengikuti DESIGN.md (monokrom, kartu 28px, pill, entrance stagger, spring hover)
- Responsive, auto-fill contoh dari kuitansi nyata

## API

- GET /api/marketplaces - daftar marketplace + estimasi biaya admin
- GET /api/sources - sumber angka default
- GET /api/defaults - default biaya proses dan fee retur
- GET /api/example - preset contoh
- POST /api/calculate - body: marketplace, hpp, harga_jual, qty, komisi_admin_pct, gratis_ongkir_pct, iklan_pct, affiliate_pct, biaya_proses_rp, layanan_logistik_rp, kemasan_rp, retur_pct, retur_fee_rp, target_margin_pct

## Test

```
npm test
```

## Catatan

Biaya proses pesanan dihitung per transaksi (tidak dikali qty). Layanan logistik, kemasan, dan retur dihitung per unit. Semua persen dihitung dari harga jual. Tarif aktual berbeda per kategori, selalu cek seller center.
