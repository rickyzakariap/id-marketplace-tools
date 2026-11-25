# Kalkulator HPP Produksi

CLI untuk menghitung harga pokok produksi per unit dari resep bahan, susut, tenaga kerja,
overhead, dan kemasan. Tool ini juga menghitung margin pada harga jual saat ini, harga
rekomendasi untuk target margin, harga balik modal, dan dampak jumlah unit per batch.

Berbeda dari [Kalkulator Biaya Cicilan](../63-kalkulator-biaya-cicilan/) yang menghitung biaya
pembayaran, tool ini fokus pada biaya produksi sebelum barang dijual. Berbeda juga dari
[Kalkulator Harga Bundling](../64-kalkulator-harga-bundling/) yang menyusun harga paket dari
beberapa produk, tool ini menyusun HPP satu produk dari bahan mentah dan proses produksinya.
Untuk biaya marketplace lengkap setelah HPP, gunakan
[Biaya Total Marketplace](../36-biaya-total-marketplace/).

## Masalah yang dipecahkan

Seller produk makanan, minuman, kosmetik rumahan, dan kerajinan sering menghitung HPP hanya
dari harga bahan yang terlihat. Padahal biaya sebenarnya dipengaruhi oleh hal yang mudah
terlewat:

- Harga bahan dibeli per kemasan besar, sementara resep memakai satuan kecil.
- Bahan terbuang saat persiapan, pemasakan, atau pengemasan.
- Tenaga kerja dan overhead dibayar per batch, bukan per unit.
- Batch kecil membuat biaya tetap per unit melonjak.
- Komisi platform dan target margin dihitung dari harga jual, bukan dari HPP.
- Harga jual yang terlihat untung ternyata hanya tipis atau rugi setelah semua biaya.

Tool ini menjawab pertanyaan praktis:

- Berapa biaya bahan per batch dan per unit?
- Berapa HPP produksi dan total biaya per unit setelah kemasan?
- Berapa margin pada harga jual yang dipakai sekarang?
- Berapa harga jual minimum agar target margin tercapai?
- Berapa harga balik modal jika komisi platform ikut dihitung?
- Bahan mana yang paling besar menyerap biaya?
- Berapa biaya per unit jika batch diperkecil atau diperbesar?

## Cara run

Butuh Go 1.21 atau lebih baru. Tidak ada dependency eksternal.

```bash
cd 66-kalkulator-hpp-produksi
go run .
```

Build binary:

```bash
go build -o kalkulator-hpp-produksi .
./kalkulator-hpp-produksi
```

## Contoh perintah

Pakai contoh bawaan, yaitu satu batch 20 botol sambal:

```bash
go run .
```

Ubah jumlah unit per batch dan biaya tenaga kerja:

```bash
go run . -batch 40 -tenaga-kerja 100000 -overhead 40000
```

Tentukan resep sendiri dan target margin 20 persen:

```bash
go run . \
  -bahan "Tepung:500:g:12000:1000:2;Gula:200:g:15000:1000:0;Mentega:250:g:22000:1000:1" \
  -batch 30 -tenaga-kerja 45000 -overhead 18000 -kemasan 1500 \
  -target-margin 20 -komisi 8 -harga-jual 9000
```

Lihat status tanpa mengisi harga jual:

```bash
go run . -harga-jual 0
```

Keluarkan JSON untuk diproses skrip lain:

```bash
go run . -json
```

Keluarkan CSV rincian bahan untuk spreadsheet:

```bash
go run . -csv > hpp-bahan.csv
```

## Contoh output

Output teks dengan data bawaan:

```text
Kalkulator HPP Produksi
=======================
Unit per batch          : 20
Tenaga kerja per batch  : Rp 60.000
Overhead per batch      : Rp 25.000
Kemasan per unit        : Rp 2.500
Target margin           : 25,00%
Komisi platform         : 8,00%
Harga jual              : Rp 15.000

Bahan          Jumlah  Harga      Isi      Susut  Biaya      Porsi
Cabai merah    1000 g  Rp 45.000  1000 g   5,00%  Rp 47.250  60,73%
Bawang merah   500 g   Rp 18.000  1000 g   3,00%  Rp 9.270   11,91%
Bawang putih   250 g   Rp 12.000  1000 g   2,00%  Rp 3.060   3,93%
Gula merah     300 g   Rp 15.000  1000 g   0,00%  Rp 4.500   5,78%
Minyak goreng  600 ml  Rp 21.000  1000 ml  1,00%  Rp 12.726  16,36%
Garam          100 g   Rp 5.000   500 g    0,00%  Rp 1.000   1,29%

Total bahan per batch   : Rp 77.806
Bahan per unit          : Rp 3.890
Tenaga kerja per unit   : Rp 3.000
Overhead per unit       : Rp 1.250
HPP produksi per unit   : Rp 8.140
Kemasan per unit        : Rp 2.500
Total biaya per unit    : Rp 10.640
Bahan terbesar          : Cabai merah (Rp 47.250, 60,73% dari total bahan).
Harga rekomendasi       : Rp 15.900
Harga balik modal       : Rp 11.600
Komisi platform         : Rp 1.200
Profit per unit         : Rp 3.160
Margin saat ini         : 21,06% (Tipis)
Selisih harga           : Rp 900 di bawah rekomendasi

Skenario rendemen batch:
Skenario    Unit  Bahan      HPP/unit  Total/unit  Rekomendasi  Margin  Status
75% batch   15    Rp 58.355  Rp 9.557  Rp 12.057   Rp 18.000    11,62%  Tipis
100% batch  20    Rp 77.806  Rp 8.140  Rp 10.640   Rp 15.900    21,06%  Tipis
125% batch  25    Rp 97.258  Rp 7.290  Rp 9.790    Rp 14.700    26,73%  Aman
```

Contoh JSON singkat dari:

```bash
go run . -bahan "Tepung:500:g:12000:1000:2" -batch 10 \
  -tenaga-kerja 0 -overhead 0 -kemasan 0 -harga-jual 0 -json
```

```json
{
  "config": {
    "ingredients": [
      {
        "name": "Tepung",
        "quantity": 500,
        "unit": "g",
        "pack_price": 12000,
        "pack_size": 1000,
        "waste_pct": 2
      }
    ],
    "batch_yield": 10,
    "labor_cost": 0,
    "overhead_cost": 0,
    "packaging_per_unit": 0,
    "target_margin_pct": 25,
    "commission_pct": 8,
    "selling_price": 0
  },
  "total_material": 6120,
  "unit_production_cost": 612,
  "unit_cost": 612,
  "status": "Belum dinilai",
  "recommended_price": 1000,
  "break_even_price": 700,
  "scenarios": [
    {
      "label": "100% batch",
      "units": 10,
      "unit_production_cost": 612,
      "unit_cost": 612,
      "recommended_price": 1000,
      "status": "Belum dinilai"
    }
  ]
}
```

Objek `ingredients`, `scenarios`, dan beberapa field lain dipotong di contoh ini supaya
ringkas. Output sebenarnya memuat semua field.

Contoh CSV dari `go run . -csv`:

```csv
bahan,jumlah,susut_persen,biaya_batch,biaya_per_unit,porsi_persen,satuan,harga_kemasan,isi_kemasan
Cabai merah,1000,5.00,47250,2363,60.73,g,45000,1000
Bawang merah,500,3.00,9270,464,11.91,g,18000,1000
```

CSV berisi satu baris per bahan. Ringkasan HPP, margin, dan harga rekomendasi ada di output
teks dan JSON. Untuk mengambil ringkasan di skrip, pakai `-json`.

## Format input

Semua input lewat flag. Angka rupiah memakai bilangan bulat tanpa titik. Persentase memakai
titik sebagai desimal, misalnya `7.5`, bukan `7,5`.

| Flag | Default | Arti |
|---|---|---|
| `-bahan` | resep sambal 6 bahan | Daftar bahan, dipisah titik koma |
| `-batch` | `20` | Jumlah unit yang dihasilkan per batch |
| `-tenaga-kerja` | `60000` | Biaya tenaga kerja per batch dalam rupiah |
| `-overhead` | `25000` | Biaya overhead per batch dalam rupiah |
| `-kemasan` | `2500` | Biaya kemasan per unit dalam rupiah |
| `-target-margin` | `25` | Target margin bersih dalam persen dari harga jual |
| `-komisi` | `8` | Komisi platform dalam persen dari harga jual |
| `-harga-jual` | `15000` | Harga jual saat ini, isi `0` untuk melewati penilaian margin |
| `-json` | `false` | Output JSON |
| `-csv` | `false` | Output CSV rincian bahan |

Format `-bahan` adalah daftar yang dipisah titik koma. Setiap bahan memakai format
`nama:jumlah:satuan:harga:isi:susut`:

- `nama` adalah label bahan, boleh mengandung spasi, maksimal 60 karakter.
- `jumlah` adalah jumlah yang dipakai resep, boleh desimal, misalnya `0.5`.
- `satuan` adalah satuan resep, misalnya `g`, `ml`, atau `pcs`, maksimal 12 karakter.
- `harga` adalah harga satu kemasan bahan dalam rupiah, bilangan bulat.
- `isi` adalah isi satu kemasan dalam satuan yang sama dengan `jumlah`.
- `susut` adalah persentase bahan yang terbuang, antara 0 dan kurang dari 100.

Contoh:

```bash
go run . -bahan "Tepung:500:g:12000:1000:2;Gula:200:g:15000:1000:0;Telur:3:pcs:28000:30:0"
```

Nama bahan tidak boleh dobel, maksimal 30 bahan, dan setiap bahan harus memakai satuan yang
sama antara `jumlah` dan `isi`.

## Cara hitung

Untuk setiap bahan:

- Biaya bahan = `jumlah / isi x harga kemasan x (1 + susut / 100)`, dibulatkan ke rupiah.
- Porsi bahan = biaya bahan / total biaya bahan x 100.

Untuk batch:

- Total bahan = jumlah biaya semua bahan.
- Biaya batch = total bahan + tenaga kerja + overhead.
- HPP produksi per unit = biaya batch / jumlah unit per batch.
- Total biaya per unit = HPP produksi per unit + kemasan per unit.
- Harga balik modal = total biaya per unit / (1 - komisi / 100), dibulatkan ke atas per
  Rp 100.
- Harga rekomendasi = total biaya per unit / (1 - target margin / 100 - komisi / 100),
  dibulatkan ke atas per Rp 100.
- Komisi = harga jual x komisi / 100, dibulatkan ke rupiah.
- Profit = harga jual - komisi - total biaya per unit.
- Margin = profit / harga jual x 100.
- Selisih harga = harga rekomendasi - harga jual.

Contoh bawaan: total bahan Rp 77.806 untuk 20 unit, ditambah tenaga kerja Rp 60.000 dan
overhead Rp 25.000 menjadi Rp 162.806 per batch. HPP produksi Rp 8.140 per unit, ditambah
kemasan Rp 2.500 menjadi Rp 10.640. Pada harga Rp 15.000 dan komisi 8 persen, profit
Rp 3.160 dan margin 21,06 persen.

Skenario rendemen memakai 75, 100, dan 125 persen dari jumlah unit per batch. Bahan ikut
diskalakan dengan jumlah unit, sedangkan tenaga kerja dan overhead tetap per batch. Tujuannya
menunjukkan berapa besar biaya tetap per unit berubah ketika ukuran batch berubah.

## Status

| Status | Syarat | Arti |
|---|---|---|
| Aman | Margin lebih besar atau sama dengan target | Harga jual memenuhi target margin |
| Tipis | Profit tidak negatif, margin di bawah target | Masih untung, target belum tercapai |
| Rugi | Profit negatif | Setiap unit yang terjual kehilangan uang |
| Belum dinilai | Harga jual diisi 0 | Margin tidak dihitung |

Status memakai nilai profit dan margin asli, bukan angka yang sudah dibulatkan untuk tampilan.
Contoh, margin `24,99 persen` dengan target `25,00 persen` berstatus Tipis.

## Asumsi

- Resep dan harga bahan adalah input seller. Angka default hanya contoh yang wajar, bukan
  harga pasar resmi. Selalu cocokkan dengan nota pembelian terakhir.
- Susut dihitung sebagai tambahan kebutuhan bahan. Susut 5 persen berarti membeli 5 persen
  lebih banyak dari jumlah yang masuk produk jadi.
- Satu batch menghasilkan jumlah unit yang diisi di `-batch`. Belum ada produk gagal di luar
  susut bahan. Jika ada produk gagal, turunkan `-batch` atau tambahkan bahan.
- Tenaga kerja dan overhead adalah biaya per batch, bukan per bulan. Biaya listrik, gas, air,
  sewa dapur, dan penyusutan alat perlu digabung sendiri ke `-overhead`.
- Kemasan per unit hanya satu angka. Jika kemasan terdiri dari beberapa komponen, jumlahkan
  dulu harganya, misalnya botol, label, dan segel.
- Komisi platform dihitung dari harga jual. Biaya iklan, biaya tetap marketplace, ongkir
  subsidi, retur, dan pajak belum termasuk. Untuk itu, pakai tool biaya marketplace yang
  sesuai.
- Target margin dan komisi dihitung dari harga jual, bukan dari HPP. Harga rekomendasi
  dibulatkan ke atas pada langkah Rp 100 supaya harga mudah dipakai.
- Pembulatan dilakukan per bahan ke rupiah terdekat, lalu total memakai hasil bulat tersebut.
  Hasil bisa berbeda satu atau dua rupiah dari spreadsheet yang membulatkan di akhir.
- Skenario rendemen adalah alternatif, bukan akumulasi. Bahan diskalakan proporsional dengan
  jumlah unit, sementara tenaga kerja dan overhead tidak berubah.
- Tool tidak melakukan panggilan jaringan dan tidak menyimpan data pengguna.

## Test

```bash
cd 66-kalkulator-hpp-produksi
go vet ./...
go test ./...
```

Test memakai table-driven test dan mencakup perhitungan contoh bawaan, harga di atas
rekomendasi, harga tipis, harga rugi, harga jual kosong, tanpa tenaga kerja dan overhead,
tanpa komisi, batch kecil, batas pembulatan harga rekomendasi, tiga skenario rendemen, status
tanpa harga, validasi batch, tenaga kerja, overhead, kemasan, target margin, komisi, harga
jual, jumlah dan nama bahan, parsing `nama:jumlah:satuan:harga:isi:susut`, biaya bahan yang
melebihi batas, format rupiah, format persen, format jumlah, output teks, JSON, CSV, usage,
dan parsing flag.

## Struktur

```text
66-kalkulator-hpp-produksi/
├── go.mod
├── main.go        Entry point, flag, dan pemilihan format output
├── hpp.go         Logika murni: parsing, validasi, perhitungan
├── output.go      Penulis output teks, JSON, dan CSV
├── hpp_test.go    Table-driven test
└── README.md
```

## Catatan

Angka dari tool adalah estimasi dari input seller, bukan laporan biaya resmi. Sebelum
menetapkan harga, timbang bahan dengan timbangan dapur, catat berat bersih setelah dikupas
atau ditiriskan, dan cocokkan harga kemasan dengan nota terbaru. Untuk produk makanan,
periksa juga izin edar dan masa simpan karena keduanya bisa menambah biaya yang belum
tercakup di tool ini.

## Lisensi

MIT, mengikuti lisensi repository.
