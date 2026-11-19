# Pemantau Tenggat Kirim

Extension Chrome Manifest V3 untuk memantau tenggat kirim pesanan marketplace dari satu daftar. Tool menghitung sisa waktu, status risiko, waktu mulai packing, estimasi denda, nilai pesanan berisiko, dan menampilkan badge peringatan di icon extension.

Tool ini bukan pengganti halaman pesanan di seller center dan tidak melakukan pengiriman otomatis. Semua angka berasal dari data yang seller masukkan sendiri.

## Masalah yang dipecahkan

Pesanan yang telat dikirim bisa memicu penalti, penurunan performa toko, pembatalan oleh pembeli, dan dana yang tertahan. Seller yang berjualan di beberapa marketplace sering mengecek satu per satu dan tetap ada pesanan yang terlewat.

Tool ini menyatukan tenggat dari beberapa marketplace ke satu daftar, mengurutkan pesanan yang paling mendesak, dan memberi tahu kapan packing harus dimulai. Dengan begitu seller bisa menyusun urutan kerja sebelum tenggat lewat.

## Install (load unpacked)

1. Buka `chrome://extensions`
2. Aktifkan Developer mode di pojok kanan atas
3. Klik Load unpacked
4. Pilih folder `61-pemantau-tenggat-kirim`
5. Pin extension ke toolbar supaya badge peringatan terlihat

Tidak ada build step, tidak ada package manager, dan tidak ada proses tambahan. File yang ada di folder langsung dimuat Chrome.

## Cara pakai

1. Klik icon extension untuk membuka popup.
2. Isi kode pesanan, marketplace, waktu order, SLA kirim dalam jam, dan nilai pesanan. Klik Tambah pesanan.
3. Atau buka Impor CSV, tempel data pesanan, lalu klik Impor CSV.
4. Klik Muat contoh untuk melihat cara kerja dengan 4 pesanan contoh.
5. Pesanan diurutkan dari sisa waktu paling sedikit. Status dan tindakan yang disarankan muncul di setiap kartu.
6. Atur ambang waspada, ambang kritis, buffer packing, denda per pesanan telat, dan SLA default di bagian Pengaturan.
7. Klik Ekspor CSV untuk mengunduh daftar beserta status dan estimasi denda. Kolom hasil ekspor: kode, marketplace, waktu_order, tenggat, status, sisa_menit, nilai_pesanan, estimasi_denda.

Badge di icon extension menampilkan jumlah pesanan kritis ditambah pesanan terlambat. Badge diperbarui setiap menit selama Chrome berjalan. Warna badge biru untuk pesanan kritis dan oranye untuk pesanan terlambat.

## Status risiko

| Status | Syarat | Arti dan tindakan |
|---|---|---|
| Aman | Sisa waktu di atas ambang waspada | Belum perlu tindakan, pantau lagi mendekati tenggat |
| Waspada | Sisa waktu kurang dari atau sama dengan ambang waspada | Siapkan kemasan, cek stok varian, cetak label |
| Kritis | Sisa waktu kurang dari atau sama dengan ambang kritis | Selesaikan packing dan buat resi sekarang |
| Terlambat | Sisa waktu nol atau sudah lewat | Kirim sekarang, simpan bukti packing dan pickup |

Batas status memakai nilai kurang dari atau sama dengan. Contoh, dengan ambang kritis 60 menit, pesanan yang tersisa tepat 60 menit sudah berstatus Kritis.

## Format CSV

```csv
kode,marketplace,waktu_order,sla_jam,nilai
INV-1001,Shopee,2026-11-19T08:00,24,185000
INV-1002,Tokopedia,2026-11-19 09:30,12,"Rp 250.000"
```

Aturan impor:

- Header opsional. Kolom wajib berurutan: kode, marketplace, waktu order, SLA jam, nilai.
- Marketplace yang dikenal: Shopee, Tokopedia, TikTok Shop, Lazada, Blibli, Lainnya. Nama tidak peka huruf besar kecil. `TikTok` dan `TikTok Shop` dianggap sama.
- Waktu order memakai format ISO seperti `2026-11-19T08:00` atau `2026-11-19 08:00`. Waktu tanpa zona mengikuti zona waktu perangkat.
- Nilai boleh angka biasa atau format rupiah seperti `Rp 185.000`.
- Kode yang sudah ada dilewati supaya tidak dobel.
- Baris yang gagal dilaporkan dengan nomor baris dan alasan singkat.

## Perhitungan

Rumus yang dipakai:

- Tenggat = waktu order + SLA jam.
- Sisa waktu = tenggat - waktu sekarang.
- Waktu mulai packing = tenggat - buffer packing.
- Denda = jumlah pesanan terlambat x denda per pesanan telat.
- Nilai pesanan berisiko = total nilai pesanan berstatus Kritis dan Terlambat.
- Skor kesiapan = rata-rata bobot status, dengan Aman 100, Waspada 70, Kritis 35, Terlambat 0. Daftar kosong bernilai 100.
- Status mengikuti urutan Terlambat, Kritis, Waspada, lalu Aman.

Contoh dengan data bawaan, waktu sekarang 19 Nov 2026 pukul 12.00 WIB, dan pengaturan default:

| Kode | Marketplace | Sisa waktu | Status |
|---|---|---|---|
| SMP-1001 | Shopee | 4 jam | Waspada |
| SMP-1002 | Tokopedia | 30 menit | Kritis |
| SMP-1003 | TikTok Shop | Terlambat 2 jam | Terlambat |
| SMP-1004 | Lazada | 22 jam | Aman |

Ringkasan contoh: 1 kritis, 1 terlambat, estimasi denda Rp 10.000, nilai pesanan berisiko Rp 469.000, dan skor kesiapan 51 dari 100.

## Permission

| Permission | Alasan |
|---|---|
| `storage` | Menyimpan daftar pesanan dan pengaturan di `chrome.storage.local` pada browser ini. Tidak memakai `storage.sync`, jadi data tidak dikirim ke akun Google. |
| `alarms` | Menjalankan pemeriksaan tenggat setiap menit untuk memperbarui badge di icon extension. |

Permission yang sengaja tidak diminta:

- Tanpa `host_permissions`, karena extension tidak membaca halaman marketplace.
- Tanpa `tabs`, `activeTab`, atau `scripting`, karena tidak ada scraping dan tidak ada interaksi dengan tab.
- Tanpa `downloads`, karena ekspor CSV memakai unduhan dari halaman popup.
- Tanpa `notifications`, karena peringatan hanya berupa badge. Ini mengurangi gangguan dan menjaga permission tetap minimal.

Tidak ada remote code, CDN, `eval`, atau `new Function`. Semua JavaScript dibundel di folder ini. Popup memakai font sistem supaya tetap berjalan offline dan tidak melakukan permintaan jaringan.

## Struktur

```text
61-pemantau-tenggat-kirim/
├── manifest.json          Manifest V3, permission storage dan alarms
├── background.js          Service worker, alarm per menit, badge
├── lib/deadline.js        Logika murni: validasi, hitung tenggat, status, CSV
├── popup/popup.html       UI popup sesuai DESIGN.md
├── popup/theme.js         Tema awal dari localStorage tanpa inline script
├── popup/popup.js         Render daftar, form, impor, ekspor, pengaturan
├── test/deadline.test.js  Unit test node:test
└── README.md
```

## Test

```bash
cd 61-pemantau-tenggat-kirim
node --test
```

Test memakai `node:test` dan `node:assert/strict`. Cakupan meliputi perhitungan tenggat, batas status aman, waspada, kritis, dan terlambat, buffer packing, pengurutan, ringkasan denda dan nilai berisiko, skor, data rusak, validasi input, normalisasi pengaturan, impor CSV, format rupiah, format sisa waktu, ekspor CSV, data contoh, dan pemeriksaan em dash serta en dash.

## Asumsi

- Tenggat dihitung sederhana dari waktu order ditambah SLA jam. Tool belum memperhitungkan hari libur, jam operasional kurir, cut-off pickup, atau aturan khusus marketplace.
- SLA, ambang waspada, ambang kritis, buffer packing, dan denda adalah input seller. Angka default hanya contoh yang wajar, bukan tarif resmi platform.
- Pesanan dianggap harus dikirim sebelum tenggat, tanpa membedakan metode kirim, jenis kurir, atau status pembayaran.
- Nilai pesanan berisiko memakai nilai pesanan penuh, bukan margin. Ini ukuran eksposur, bukan kerugian final.
- Skor kesiapan adalah ringkasan internal tool, bukan metrik resmi marketplace.
- Waktu mengikuti zona waktu perangkat. Perbedaan zona waktu antar perangkat bisa menggeser tampilan jam.
- Data disimpan tanpa enkripsi di profil Chrome. Siapa pun yang bisa membuka profil tersebut bisa membaca daftar pesanan.

## Batasan yang diketahui

- Input pesanan dilakukan manual atau lewat CSV. Extension tidak mengambil pesanan dari seller center karena itu membutuhkan host permission, selector halaman yang mudah berubah, dan akses ke akun seller.
- Badge hanya diperbarui saat Chrome berjalan. Jika Chrome ditutup total, tidak ada pembaruan sampai browser dibuka lagi. Popup selalu menghitung ulang saat dibuka.
- Tidak ada notifikasi desktop. Peringatan hanya berupa badge dan isi popup.
- Tidak ada sinkronisasi antar perangkat dan tidak ada backend.
- Data rusak di `chrome.storage.local` dilewati dan dihitung di catatan popup. Tool tidak memperbaiki data secara otomatis.
- Ekspor CSV memakai file yang diunduh lewat browser. Nama file memakai tanggal perangkat.
- Tool tidak mengirim pesanan, membuat resi, atau menghubungi kurir.
- Hanya diuji untuk Chrome dengan Manifest V3. Firefox dan Safari tidak menjadi target.

## Catatan

Selalu cocokkan tenggat dan konsekuensi keterlambatan dengan halaman pesanan serta aturan resmi marketplace yang sedang dipakai. Simpan tangkapan layar tenggat, bukti packing, dan bukti pickup bila terjadi sengketa. Tool ini membantu mengatur prioritas, bukan menggantikan keputusan seller atau kebijakan platform.

## Lisensi

MIT, mengikuti lisensi repository.
