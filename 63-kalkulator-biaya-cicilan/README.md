# Kalkulator Biaya Cicilan

CLI untuk menghitung biaya cicilan dan paylater yang ditanggung seller pada setiap metode
pembayaran. Tool menampilkan biaya cicilan per pesanan, potongan platform, profit, margin,
status, harga minimum agar target margin tercapai, dan proyeksi biaya bulanan.

Berbeda dari [Marketplace Fee Calculator](../01-marketplace-fee-calculator/) yang menghitung
komisi umum, tool ini fokus pada selisih biaya antar metode pembayaran. Berbeda juga dari
[Biaya Total Marketplace](../36-biaya-total-marketplace/) yang menjumlahkan semua komponen
biaya, tool ini memisahkan biaya cicilan dari komisi dan biaya tetap supaya seller bisa
melihat metode mana yang menggerus margin.

## Masalah yang dipecahkan

Program cicilan 0 persen sering terlihat gratis bagi pembeli, tetapi biaya bunganya bisa
ditanggung seller. Setiap metode pembayaran juga punya rate dan batas biaya yang berbeda.
Seller yang hanya melihat komisi marketplace bisa merasa margin masih aman, padahal setelah
biaya cicilan dan biaya tetap, sebagian pesanan sudah tipis atau rugi.

Tool ini menjawab pertanyaan praktis:

- Berapa biaya cicilan yang dipotong untuk setiap metode pembayaran?
- Berapa profit dan margin bersih setelah HPP, kemasan, komisi, dan biaya tetap?
- Metode mana yang masih aman, tipis, atau rugi?
- Berapa harga jual minimum agar target margin tetap tercapai?
- Berapa ruang biaya cicilan yang tersisa pada harga jual sekarang?
- Berapa biaya tambahan per bulan jika semua pesanan memakai metode tertentu?

## Cara run

Butuh Go 1.21 atau lebih baru. Tidak ada dependency eksternal.

```bash
cd 63-kalkulator-biaya-cicilan
go run .
```

Build binary:

```bash
go build -o kalkulator-biaya-cicilan .
./kalkulator-biaya-cicilan
```

## Contoh perintah

Pakai contoh bawaan:

```bash
go run .
```

Ubah harga, HPP, dan komisi:

```bash
go run . -harga 200000 -hpp 130000 -komisi 9 -target-margin 12
```

Bandingkan dua metode saja:

```bash
go run . -metode "Transfer bank:0:0;PayLater 12 bulan:7.5:0"
```

Keluarkan JSON untuk diproses skrip lain:

```bash
go run . -json
```

Keluarkan CSV untuk spreadsheet:

```bash
go run . -csv > biaya-cicilan.csv
```

## Contoh output

Output teks dengan data bawaan:

```text
Kalkulator Biaya Cicilan
==========================
Harga jual            : Rp 150.000
HPP                   : Rp 100.000
Komisi marketplace    : 8,00%
Biaya tetap           : Rp 1.250
Kemasan               : Rp 2.000
Target margin         : 10,00%
Pesanan per bulan     : 100

Metode             Cicilan    Potongan   Profit     Margin  Status  Harga min   Cicilan/bln
Transfer bank      Rp 0       Rp 13.250  Rp 34.750  23,17%  Aman    Rp 125.915  Rp 0
COD                Rp 0       Rp 13.250  Rp 34.750  23,17%  Aman    Rp 125.915  Rp 0
PayLater 3 bulan   Rp 3.750   Rp 17.000  Rp 31.000  20,67%  Aman    Rp 129.875  Rp 375.000
PayLater 6 bulan   Rp 6.750   Rp 20.000  Rp 28.000  18,67%  Aman    Rp 133.226  Rp 675.000
PayLater 12 bulan  Rp 11.250  Rp 24.500  Rp 23.500  15,67%  Aman    Rp 138.590  Rp 1.125.000
Kartu kredit       Rp 4.500   Rp 17.750  Rp 30.250  20,17%  Aman    Rp 130.697  Rp 450.000
Cicilan 18 bulan   Rp 22.500  Rp 35.750  Rp 12.250  8,17%   Tipis   Rp 154.105  Rp 2.250.000
Cicilan 24 bulan   Rp 37.500  Rp 50.750  -Rp 2.750  -1,83%  Rugi    Rp 181.140  Rp 3.750.000

Metode paling untung: Transfer bank (Rp 34.750 per pesanan).
Metode rugi: Cicilan 24 bulan.
Metode di bawah target: Cicilan 18 bulan.
Batas biaya cicilan agar target 10,00% tercapai: Rp 19.750 per pesanan (13,17% dari harga).
Jika semua 100 pesanan/bulan memakai Cicilan 24 bulan, biaya cicilan Rp 3.750.000/bulan, yaitu Rp 3.750.000 lebih tinggi dari metode tanpa cicilan.
```

Contoh JSON dari `go run . -metode "Transfer bank:0:0" -json`:

```json
{
  "config": {
    "price": 150000,
    "cost": 100000,
    "commission_pct": 8,
    "fixed_fee": 1250,
    "packaging": 2000,
    "target_margin_pct": 10,
    "monthly_orders": 100,
    "methods": [
      {
        "name": "Transfer bank",
        "rate_pct": 0,
        "cap_rupiah": 0
      }
    ]
  },
  "results": [
    {
      "method": {
        "name": "Transfer bank",
        "rate_pct": 0,
        "cap_rupiah": 0
      },
      "commission": 12000,
      "installment_fee": 0,
      "platform_deduction": 13250,
      "profit": 34750,
      "margin_pct": 23.166666666666664,
      "status": "Aman",
      "required_price": 125915,
      "required_achievable": true,
      "max_fee_room": 19750,
      "max_rate_pct": 13.166666666666666,
      "max_rate_achievable": true,
      "monthly_fee": 0,
      "monthly_extra": 0
    }
  ],
  "best_method": "Transfer bank",
  "baseline_fee": 0
}
```

Contoh header CSV:

```csv
metode,rate_persen,cap_rupiah,biaya_cicilan,potongan_platform,profit,margin_persen,status,harga_minimum,biaya_cicilan_bulanan,biaya_tambahan_bulanan
Transfer bank,0.00,0,0,13250,34750,23.17,Aman,125915,0,0
```

## Format input

Semua input lewat flag. Angka rupiah memakai bilangan bulat tanpa titik. Persentase memakai
titik sebagai desimal, misalnya `7.5`, bukan `7,5`.

| Flag | Default | Arti |
|---|---|---|
| `-harga` | `150000` | Harga jual per pesanan dalam rupiah |
| `-hpp` | `100000` | Harga pokok penjualan per pesanan dalam rupiah |
| `-komisi` | `8` | Komisi marketplace dalam persen dari harga jual |
| `-biaya-tetap` | `1250` | Biaya tetap marketplace per pesanan dalam rupiah |
| `-kemasan` | `2000` | Biaya kemasan per pesanan dalam rupiah |
| `-target-margin` | `10` | Target margin bersih dalam persen dari harga jual |
| `-pesanan-bulanan` | `100` | Jumlah pesanan per bulan untuk proyeksi |
| `-metode` | daftar contoh | Daftar metode pembayaran |
| `-json` | `false` | Output JSON |
| `-csv` | `false` | Output CSV |

Format `-metode` adalah daftar yang dipisah titik koma. Setiap metode memakai format
`nama:rate:cap`:

- `nama` adalah label metode, boleh mengandung spasi.
- `rate` adalah persentase biaya cicilan yang ditanggung seller.
- `cap` adalah batas maksimum biaya cicilan per pesanan dalam rupiah. Isi `0` untuk tanpa
  batas.

Contoh:

```bash
go run . -metode "Transfer bank:0:0;COD:0:0;PayLater 6 bulan:4.5:0;Kartu kredit:3:10000"
```

Nama metode tidak boleh dobel, maksimal 20 metode, dan setiap rate harus di antara 0 dan 100
persen.

## Cara hitung

Untuk setiap metode:

- Komisi = pembulatan ke rupiah dari `harga x komisi persen / 100`.
- Biaya cicilan = pembulatan ke rupiah dari `harga x rate persen / 100`.
- Jika `cap` lebih dari 0 dan biaya cicilan melebihi `cap`, biaya cicilan menjadi `cap`.
- Potongan platform = komisi + biaya cicilan + biaya tetap.
- Profit = harga - potongan platform - HPP - kemasan.
- Margin = `profit / harga x 100`.
- Ruang biaya cicilan = harga - komisi - biaya tetap - HPP - kemasan - target margin.
- Harga minimum = harga bulat terkecil yang membuat profit minimal sama dengan target margin.
  Pencarian memakai binary search supaya batas `cap` tetap dihitung tepat.
- Rate maksimum = `ruang biaya cicilan / harga x 100`. Jika `cap` sudah lebih kecil dari ruang,
  semua rate sampai 100 persen masih aman karena biaya cicilan dibatasi `cap`.
- Biaya cicilan bulanan = biaya cicilan x pesanan bulanan.
- Biaya tambahan bulanan = selisih biaya cicilan terhadap metode dengan biaya cicilan
  terendah, dikali pesanan bulanan.

## Status

| Status | Syarat | Arti |
|---|---|---|
| Aman | Margin lebih besar atau sama dengan target | Metode masih memenuhi target margin |
| Tipis | Profit tidak negatif, tetapi margin di bawah target | Masih untung, tetapi target belum tercapai |
| Rugi | Profit negatif | Setiap pesanan dengan metode ini kehilangan uang |

Status memakai nilai margin asli, bukan angka yang sudah dibulatkan untuk tampilan. Contoh,
margin `9,99 persen` dengan target `10,00 persen` berstatus Tipis.

## Asumsi

- Rate dan cap adalah input seller. Angka default hanya contoh yang wajar, bukan tarif resmi
  marketplace atau penyedia paylater. Selalu cocokkan dengan seller center dan kontrak
  pembayaran yang berlaku.
- Komisi marketplace dihitung dari harga jual sebelum biaya cicilan. Biaya cicilan juga
  dihitung dari harga jual, bukan dari harga setelah komisi.
- Biaya cicilan dianggap sepenuhnya ditanggung seller. Jika marketplace membagi biaya dengan
  pembeli, masukkan rate yang benar-benar dibebankan ke seller.
- HPP dan kemasan dihitung per pesanan. Belum termasuk pajak, iklan, biaya retur, biaya
  penyimpanan, biaya admin tambahan, atau biaya lain di luar input.
- Proyeksi bulanan menganggap semua pesanan memakai metode yang sama. Metode adalah skenario
  alternatif, bukan akumulasi.
- Pembulatan dilakukan per komponen ke rupiah terdekat. Hasil bisa berbeda satu atau dua
  rupiah dari sistem marketplace yang membulatkan di akhir.
- Harga minimum adalah harga jual per pesanan, bukan harga per pcs. Untuk pesanan multi item,
  gabungkan harga semua item sebelum memakai tool ini.
- Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.

## Test

```bash
cd 63-kalkulator-biaya-cicilan
go vet ./...
go test ./...
```

Test memakai table-driven test dan mencakup perhitungan tanpa biaya, rate rendah, rate di
bawah target, rate yang membuat rugi, batas cap yang berlaku dan tidak berlaku, rate tinggi
tanpa cap yang tidak mungkin mencapai target, rate tinggi dengan cap, harga minimum yang
benar-benar minimal, validasi harga, HPP, komisi, target margin, biaya tetap, kemasan,
pesanan bulanan, jumlah dan nama metode, parsing `nama:rate:cap`, rate maksimum, proyeksi
bulanan, format rupiah, format persen, output teks, JSON, CSV, dan parsing flag.

## Struktur

```text
63-kalkulator-biaya-cicilan/
├── go.mod
├── main.go              Entry point, flag, dan pemilihan format output
├── installment.go       Logika murni: parsing, validasi, perhitungan
├── output.go            Penulis output teks, JSON, dan CSV
├── installment_test.go  Table-driven test
└── README.md
```

## Catatan

Angka dari tool adalah estimasi dari input seller, bukan laporan laba resmi. Sebelum
mengaktifkan program cicilan atau paylater, simpan tangkapan layar rate dan cap dari seller
center, bandingkan dengan settlement nyata, dan periksa apakah biaya cicilan berubah pada
kampanye tertentu. Untuk sengketa, simpan CSV hasil perhitungan, bukti HPP, dan rincian
potongan dari marketplace.

## Lisensi

MIT, mengikuti lisensi repository.
