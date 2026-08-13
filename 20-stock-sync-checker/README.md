# Stok Sync Checker

Chrome extension untuk cek stok listing vs stok asli di Shopee, Tokopedia, Lazada, Bukalapak, dan Blibli. Flag risiko oversell sebelum buyer order.

## Install (load unpacked)

1. Buka `chrome://extensions`
2. Aktifkan Developer mode (pojok kanan atas)
3. Klik Load unpacked
4. Pilih folder `20-stock-sync-checker`

## Cara pakai

1. Klik icon extension, isi daftar stok asli (manual, isi contoh, atau impor CSV `nama,stok`)
2. Buka halaman produk di marketplace mana pun
3. Badge muncul di kanan bawah halaman: stok listing vs stok asli
   - Hijau: stok cocok
   - Merah: risiko oversell, listing lebih banyak dari stok asli, update stok sekarang
   - Oranye: stok listing lebih sedikit, bisa dinaikkan
   - Abu-abu: produk belum ada di daftar stok
4. Klik icon extension untuk cek status semua produk

## Fitur

- Deteksi halaman produk: Shopee, Tokopedia, Lazada, Bukalapak, Blibli
- Ekstrak stok dari halaman (polling untuk lazy-load)
- Fuzzy match nama produk (tahan variasi judul per marketplace)
- Badge overlay dengan status warna
- Popup: daftar stok, statistik, impor/ekspor CSV
- Data tersimpan di chrome.storage.local (tanpa backend)

## Struktur

- `manifest.json` - MV3 manifest
- `shared/shared.js` - logika murni (deteksi URL, ekstrak stok, fuzzy match)
- `content/content.js` - content script, badge overlay
- `popup/popup.html` + `popup/popup.js` - daftar stok + cek halaman
- `test/test.js` - unit test logika, `node test/test.js`

## Catatan

- Logika terverifikasi via unit test (31 test pass). Selector DOM per marketplace butuh test di browser asli karena struktur halaman bisa berubah.
- Halaman Tokopedia pakai lazy-load, extension polling hingga 2 detik sebelum menyerah.
