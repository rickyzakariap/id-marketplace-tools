# Pelacak Kedaluwarsa Stok

Extension Chrome Manifest V3 untuk memantau batch stok yang mendekati atau melewati
tanggal kedaluwarsa. Tool menghitung sisa hari, perkiraan unit yang masih bisa terjual,
potensi rugi, batas diskon aman, dan menampilkan badge peringatan di icon extension.

Tool ini bukan pengganti pencatatan stok di seller center dan tidak menarik data otomatis.
Semua angka berasal dari batch yang seller masukkan sendiri.

## Masalah yang dipecahkan

Produk makanan, minuman, kosmetik, suplemen, dan obat rumahan punya tanggal kedaluwarsa.
Seller sering menyimpan beberapa batch dengan tanggal berbeda dalam satu SKU, lalu menjual
batch mana saja yang paling dekat di rak. Masalah muncul ketika:

- Stok satu batch lebih besar dari perkiraan penjualan sebelum tanggal kedaluwarsa.
- Seller baru sadar ada batch hampir kedaluwarsa setelah produk tidak bisa dijual.
- Diskon diberikan tanpa tahu batas harga agar masih di atas HPP.
- Nilai stok yang berisiko tidak pernah dihitung, sehingga kerugian terasa tiba-tiba.
- Batch kedaluwarsa masih tampil di etalase dan berisiko melanggar aturan marketplace.
- Pencatatan tersebar di buku, spreadsheet, dan catatan chat.

Tool ini menjawab pertanyaan praktis:

- Batch mana yang paling dekat kedaluwarsa?
- Berapa unit yang diperkirakan terjual sebelum tanggal kedaluwarsa?
- Berapa unit dan nilai stok yang berisiko?
- Berapa potensi rugi jika tidak ada tindakan?
- Berapa batas diskon agar harga tidak jatuh di bawah HPP?
- Batch mana yang harus ditarik dari etalase hari ini?

Tool ini berbeda dari [Kalkulator Stok Mati](../56-kalkulator-stok-mati/) yang menghitung
modal tertahan pada stok lambat bergerak tanpa tanggal kedaluwarsa. Berbeda juga dari
[Pemeriksa Kesiapan Stok Kampanye](../59-pemeriksa-kesiapan-stok-kampanye/) yang fokus pada
lonjakan permintaan saat kampanye. Tool ini fokus pada satu hal: sisa umur simpan batch
dibandingkan dengan kecepatan jual dan nilai modal yang bisa hilang.

## Install (load unpacked)

1. Buka `chrome://extensions`
2. Aktifkan Developer mode di pojok kanan atas
3. Klik Load unpacked
4. Pilih folder `68-pelacak-kedaluwarsa-stok`
5. Pin extension ke toolbar supaya badge peringatan terlihat

Tidak ada build step, tidak ada package manager, dan tidak ada proses tambahan. File yang
ada di folder langsung dimuat Chrome.

## Cara pakai

1. Klik icon extension untuk membuka popup.
2. Isi SKU, nama produk, jumlah batch, tanggal kedaluwarsa, HPP per unit, harga jual, dan
   rata-rata unit terjual per hari. Klik Tambah batch.
3. Atau buka Impor CSV, tempel data batch, lalu klik Impor CSV.
4. Klik Muat contoh untuk melihat cara kerja dengan 4 batch contoh.
5. Batch diurutkan dari sisa hari paling sedikit. Status, perkiraan terjual, sisa stok, dan
   tindakan yang disarankan muncul di setiap kartu.
6. Atur ambang waspada dan ambang kritis di bagian Pengaturan.
7. Klik Ekspor CSV untuk mengunduh daftar beserta status, potensi rugi, dan proyeksi profit.

Badge di icon extension menampilkan jumlah batch kedaluwarsa ditambah batch kritis. Badge
diperbarui setiap jam selama Chrome berjalan dan setiap kali data batch berubah. Warna badge
oranye untuk batch kedaluwarsa dan biru untuk batch kritis.

## Status

| Status | Syarat | Arti dan tindakan |
|---|---|---|
| Aman | Sisa hari lebih dari ambang waspada | Stok masih punya waktu, pantau penjualan |
| Waspada | Sisa hari kurang dari atau sama dengan ambang waspada | Jadwalkan flash sale atau bundling |
| Kritis | Sisa hari kurang dari atau sama dengan ambang kritis | Diskon atau bundling sekarang |
| Kedaluwarsa | Tanggal kedaluwarsa sudah lewat | Tarik dari etalase dan catat kerugian |

Batas status memakai nilai kurang dari atau sama dengan. Contoh, dengan ambang kritis 7 hari,
batch yang tersisa tepat 7 hari sudah berstatus Kritis. Batch yang kedaluwarsa hari ini masih
berstatus Kritis karena tanggalnya belum lewat. Status Kedaluwarsa baru muncul ketika tanggal
kedaluwarsa sudah lewat satu hari atau lebih.

Ambang default adalah 30 hari untuk Waspada dan 7 hari untuk Kritis. Kedua ambang bisa diubah
di popup. Nilai Kritis tidak boleh lebih besar dari Waspada.

## Format CSV

```csv
sku,nama,jumlah,kedaluwarsa,hpp,jual,terjual_harian
SKU-2001,Selai Kurma 250 ml,40,2026-12-31,18000,32000,2
SKU-2002,Madu Hutan 500 ml,120,2026-12-15,"Rp 42.000","Rp 75.000",3
```

Aturan impor:

- Header opsional. Kolom wajib berurutan: SKU, nama, jumlah, kedaluwarsa, HPP, harga jual,
  rata-rata terjual per hari.
- Tanggal kedaluwarsa memakai format `YYYY-MM-DD`, misalnya `2026-12-31`.
- Jumlah harus bilangan bulat. HPP dan harga jual boleh angka biasa atau format rupiah seperti
  `Rp 42.000`.
- Terjual per hari boleh desimal dengan titik, misalnya `2.5`, atau koma, misalnya `2,5`.
- Batch dengan SKU dan tanggal kedaluwarsa yang sama dilewati supaya tidak dobel. SKU yang
  sama dengan tanggal berbeda tetap boleh, karena itu batch yang berbeda.
- Baris yang gagal dilaporkan dengan nomor baris dan alasan singkat.

## Cara hitung

Untuk setiap batch, dengan tanggal hari ini dihitung dari zona waktu perangkat:

- Sisa hari = selisih tanggal kedaluwarsa dengan tanggal hari ini. Kedaluwarsa hari ini
  bernilai 0, kemarin bernilai -1.
- Hari jual = sisa hari + 1 untuk batch yang belum kedaluwarsa. Hari ini ikut dihitung
  sebagai satu hari jual. Batch kedaluwarsa memakai 0 hari jual.
- Perkiraan unit terjual = `min(jumlah batch, floor(terjual per hari x hari jual))`.
- Sisa stok = `jumlah batch - perkiraan unit terjual`.
- Nilai stok = `jumlah batch x HPP per unit`.
- Omzet proyeksi = `perkiraan unit terjual x harga jual`.
- Profit proyeksi = `omzet proyeksi - nilai stok`. HPP seluruh batch dikurangkan, termasuk
  unit yang tidak terjual, sehingga unit sisa tampil sebagai kerugian.
- Potensi rugi = `sisa stok x HPP per unit`.
- Margin per unit = `harga jual - HPP per unit`.
- Batas diskon aman = `margin per unit / harga jual x 100` jika margin positif. Ini diskon
  maksimum secara HPP saja, belum memperhitungkan komisi marketplace, ongkir, kemasan, iklan,
  dan pajak.
- Hari stok = `jumlah batch / terjual per hari`. Nilainya kosong jika terjual per hari 0.
- Selisih umur stok = `hari stok - hari jual`. Nilai positif berarti stok bertahan lebih lama
  dari sisa umur simpan, sehingga pasti ada sisa. Nilai kosong untuk batch kedaluwarsa atau
  tanpa penjualan.

Ringkasan daftar:

- Unit berisiko = jumlah unit batch Kritis ditambah Kedaluwarsa.
- Nilai stok berisiko = nilai stok batch Kritis ditambah Kedaluwarsa.
- Unit mendekati kedaluwarsa = jumlah unit batch Waspada, Kritis, dan Kedaluwarsa.
- Potensi rugi = jumlah potensi rugi semua batch.
- Profit proyeksi = jumlah profit proyeksi semua batch.
- Skor kesehatan stok = rata-rata bobot status per batch, dengan Aman 100, Waspada 70,
  Kritis 30, dan Kedaluwarsa 0. Daftar kosong bernilai 100.
- Kedaluwarsa terdekat = tanggal kedaluwarsa paling awal di antara batch yang belum lewat.

### Contoh satu batch

Hari ini 27 November 2026. Sebuah batch memiliki data:

- Jumlah 60 unit, kedaluwarsa 5 Desember 2026, terjual 6 unit per hari.
- HPP Rp 15.000 per unit, harga jual Rp 28.000 per unit.

Hasil:

| Ukuran | Nilai |
|---|---|
| Sisa hari | 8 hari |
| Hari jual | 9 hari |
| Perkiraan terjual | 54 unit |
| Sisa stok | 6 unit |
| Nilai stok | Rp 900.000 |
| Omzet proyeksi | Rp 1.512.000 |
| Profit proyeksi | Rp 612.000 |
| Potensi rugi | Rp 90.000 |
| Batas diskon aman | 46,4% |

Status batch adalah Waspada karena 8 hari masih di atas ambang kritis 7 hari, tetapi tidak
lebih dari ambang waspada 30 hari. Tindakan yang disarankan adalah menjadwalkan flash sale
atau bundling minggu ini, dengan batas diskon 46,4% agar harga tidak di bawah HPP.

### Contoh data bawaan

Tombol Muat contoh membuat 4 batch dengan tanggal relatif terhadap hari ini. Jika dijalankan
pada 27 November 2026, datanya menjadi:

| SKU | Jumlah | Kedaluwarsa | Sisa hari | Status | Perkiraan terjual | Sisa stok | Potensi rugi |
|---|---|---|---|---|---|---|---|
| SKU-EXP-01 | 40 | 2026-11-25 | -2 | Kedaluwarsa | 0 | 40 | Rp 720.000 |
| SKU-CRIT-02 | 60 | 2026-11-30 | 3 | Kritis | 24 | 36 | Rp 540.000 |
| SKU-WARN-03 | 120 | 2026-12-15 | 18 | Waspada | 57 | 63 | Rp 2.646.000 |
| SKU-SAFE-04 | 200 | 2027-02-10 | 75 | Aman | 200 | 0 | Rp 0 |

Ringkasan contoh: 4 batch, 420 unit, 1 batch di setiap status, 100 unit berisiko, nilai stok
berisiko Rp 1.620.000, potensi rugi Rp 3.906.000, dan profit proyeksi Rp 2.287.000. Skor
kesehatan stok 50 dari 100. Profit proyeksi tetap positif karena batch Aman yang habis terjual
menutup kerugian batch lain.

Contoh CSV hasil ekspor:

```csv
sku,nama,jumlah,kedaluwarsa,sisa_hari,status,terjual_harian,perkiraan_terjual,sisa_stok,nilai_stok,potensi_rugi,potensi_profit
SKU-EXP-01,Selai Kurma 250 ml,40,2026-11-25,-2,expired,2,0,40,720000,720000,-720000
SKU-CRIT-02,Granola Cokelat 200 g,60,2026-11-30,3,critical,6,24,36,900000,540000,-228000
SKU-WARN-03,Madu Hutan 500 ml,120,2026-12-15,18,warning,3,57,63,5040000,2646000,-765000
SKU-SAFE-04,Kopi Arabika 200 g,200,2027-02-10,75,safe,3,200,0,5000000,0,4000000
```

CSV memakai titik sebagai desimal dan tidak memakai format rupiah. Kolom `status` memakai
kode `safe`, `warning`, `critical`, atau `expired`.

## Permission

| Permission | Alasan |
|---|---|
| `storage` | Menyimpan daftar batch dan pengaturan di `chrome.storage.local` pada browser ini. Tidak memakai `storage.sync`, jadi data tidak dikirim ke akun Google. |
| `alarms` | Menjalankan pemeriksaan kedaluwarsa setiap jam untuk memperbarui badge di icon extension. |

Permission yang sengaja tidak diminta:

- Tanpa `host_permissions`, karena extension tidak membaca halaman marketplace.
- Tanpa `tabs`, `activeTab`, atau `scripting`, karena tidak ada scraping dan tidak ada
  interaksi dengan tab.
- Tanpa `downloads`, karena ekspor CSV memakai unduhan dari halaman popup.
- Tanpa `notifications`, karena peringatan hanya berupa badge. Ini mengurangi gangguan dan
  menjaga permission tetap minimal.

Tidak ada remote code, CDN, `eval`, atau `new Function`. Semua JavaScript dibundel di folder
ini. Popup memakai font sistem supaya tetap berjalan offline dan tidak melakukan permintaan
jaringan.

## Struktur

```text
68-pelacak-kedaluwarsa-stok/
├── manifest.json          Manifest V3, permission storage dan alarms
├── background.js          Service worker, alarm per jam, badge
├── lib/expiry.js          Logika murni: tanggal, validasi, hitung, CSV, data contoh
├── popup/popup.html       UI popup sesuai DESIGN.md
├── popup/theme.js         Tema awal dari localStorage tanpa inline script
├── popup/popup.js         Render daftar, form, impor, ekspor, pengaturan
├── test/expiry.test.js    Unit test node:test
└── README.md
```

## Test

```bash
cd 68-pelacak-kedaluwarsa-stok
node --test
```

Test memakai `node:test` dan `node:assert/strict`, dengan 20 kasus. Cakupan meliputi parsing
tanggal dan sisa hari, validasi seluruh input, normalisasi batch, batas status Aman, Waspada,
Kritis, dan Kedaluwarsa, perhitungan unit terjual dan sisa stok, potensi rugi, profit
proyeksi, batas diskon, penjualan harian nol, ringkasan unit dan nilai berisiko, skor,
pengurutan, data rusak, impor CSV, kutip dan nilai rupiah, ekspor CSV, data contoh, pengaturan,
format angka, serta larangan em dash dan en dash.

## Asumsi

- Tanggal kedaluwarsa adalah input seller dan hanya berupa tanggal, tanpa jam. Tanggal
  mengikuti zona waktu perangkat. Perbedaan zona waktu antar perangkat bisa menggeser satu
  hari pada tampilan sisa hari.
- Satu batch memiliki satu tanggal kedaluwarsa. Jika satu batch fisik dipindah sebagian ke
  rak lain, seller perlu mencatatnya sebagai batch terpisah.
- Terjual per hari adalah rata-rata tetap dari input seller. Tool belum mempelajari musim,
  hari libur, kampanye, atau perubahan harga.
- Hari ini dihitung sebagai satu hari jual untuk batch yang belum kedaluwarsa. Ini membuat
  perkiraan terjual sedikit lebih longgar daripada menghitung hari penuh saja.
- Perkiraan terjual dibatasi jumlah batch. Tool tidak menganggap seller bisa menjual lebih
  banyak dari stok yang ada.
- Profit proyeksi mengurangkan HPP seluruh batch, bukan hanya unit yang terjual. Unit sisa
  dianggap kerugian penuh sebesar HPP. Biaya pembuangan, retur, dan biaya administrasi belum
  termasuk.
- Potensi rugi adalah nilai HPP unit sisa, bukan nilai jual yang hilang. Ini ukuran modal yang
  tidak kembali, bukan kehilangan omzet.
- Batas diskon aman hanya memakai margin kotor terhadap HPP. Komisi marketplace, ongkir yang
  ditanggung seller, kemasan, iklan, dan pajak belum dikurangkan, sehingga diskon yang aman
  secara bisnis biasanya lebih kecil dari angka ini.
- Nilai stok berisiko dan unit berisiko hanya menjumlahkan batch Kritis dan Kedaluwarsa.
  Batch Waspada masuk ke unit mendekati kedaluwarsa, tetapi tidak masuk nilai berisiko.
- Skor kesehatan stok adalah ringkasan internal tool, bukan metrik resmi marketplace.
- Pembulatan rupiah memakai pembulatan ke rupiah terdekat. Marketplace bisa memakai pembulatan
  berbeda, sehingga selisih satu atau dua rupiah mungkin terjadi.
- Tool tidak melakukan panggilan jaringan dan tidak menyimpan data pengguna di server.

## Batasan yang diketahui

- Input batch dilakukan manual atau lewat CSV. Extension tidak mengambil stok dari seller
  center karena itu membutuhkan host permission, selector halaman yang mudah berubah, dan
  akses ke akun seller.
- Badge hanya diperbarui saat Chrome berjalan. Jika Chrome ditutup total, tidak ada pembaruan
  sampai browser dibuka lagi. Popup selalu menghitung ulang saat dibuka.
- Tidak ada notifikasi desktop. Peringatan hanya berupa badge dan isi popup.
- Tidak ada sinkronisasi antar perangkat dan tidak ada backend.
- Data disimpan tanpa enkripsi di profil Chrome. Siapa pun yang bisa membuka profil tersebut
  bisa membaca daftar batch.
- Data rusak di `chrome.storage.local` dilewati dan dihitung di catatan popup. Tool tidak
  memperbaiki data secara otomatis.
- Satu batch hanya punya satu tanggal kedaluwarsa dan satu rata-rata penjualan. Belum ada
  lokasi rak, nomor lot pemasok, atau aturan FEFO otomatis.
- Tool tidak menghitung biaya retur, biaya pemusnahan, atau potongan marketplace. Untuk itu,
  gunakan tool biaya dan retur yang sesuai.
- Ekspor CSV memakai file yang diunduh lewat browser. Nama file memakai tanggal perangkat.
- Hanya diuji untuk Chrome dengan Manifest V3. Firefox dan Safari tidak menjadi target.

## Catatan

Selalu cocokkan tanggal kedaluwarsa dengan kemasan fisik dan catatan penerimaan barang. Untuk
produk dengan masa simpan pendek, periksa batch minimal sekali seminggu dan pisahkan stok yang
sudah mendekati tanggal agar tidak tercampur dengan stok baru. Sebelum memberi diskon besar,
cocokkan batas diskon aman dengan komisi marketplace dan ongkir yang berlaku, lalu simpan CSV
hasil ekspor sebagai bukti tindakan. Aturan marketplace tentang produk kedaluwarsa berbeda-beda,
jadi cek kebijakan platform yang sedang dipakai sebelum menarik atau menjual batch tertentu.

## Lisensi

MIT, mengikuti lisensi repository.
