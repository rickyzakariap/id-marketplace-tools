# Kalkulator Harga Bundling

CLI untuk menyusun harga paket bundling: hitung profit dan margin setelah komisi, biaya
tetap, kemasan, dan subsidi ongkir; cari harga minimum agar target margin tercapai; lihat
kontribusi setiap item; dan bandingkan dengan menjual item satu per satu.

Berbeda dari [Kalkulator Harga Grosir](../62-kalkulator-harga-grosir/) yang mengatur diskon
berdasarkan jumlah pcs produk yang sama, tool ini menggabungkan beberapa produk berbeda dalam
satu paket. Berbeda juga dari [Biaya Total Marketplace](../36-biaya-total-marketplace/) yang
menjumlahkan semua komponen biaya untuk satu pesanan, tool ini fokus pada keputusan harga
paket: berapa diskon yang masih aman, item mana yang menahan margin, dan apakah bundling
benar-benar lebih untung daripada jual terpisah.

## Masalah yang dipecahkan

Bundling sering dipakai untuk menaikkan nilai pesanan dan menghabiskan stok lambat. Masalahnya,
harga paket biasanya ditebak dari total harga eceran dikurangi diskon yang terlihat menarik.
Setelah komisi marketplace, biaya tetap, kemasan, dan subsidi ongkir, paket bisa hanya tipis
untung atau rugi. Satu item juga bisa menutupi kerugian item lain, sehingga seller tidak sadar
produk mana yang sebenarnya membebani paket.

Tool ini menjawab pertanyaan praktis:

- Berapa profit dan margin paket setelah semua biaya yang diinput?
- Berapa harga minimum paket agar target margin tercapai?
- Berapa diskon maksimum dari total harga eceran yang masih aman?
- Item mana yang memberi kontribusi positif dan mana yang negatif?
- Apakah bundling lebih untung daripada menjual setiap pcs terpisah?
- Berapa profit bulanan jika jumlah bundling per bulan diketahui?

## Cara run

Butuh Python 3. Tidak ada dependency eksternal.

```bash
cd 64-kalkulator-harga-bundling
python3 main.py
```

## Contoh perintah

Pakai contoh bawaan:

```bash
python3 main.py
```

Ubah harga paket, komisi, dan target margin:

```bash
python3 main.py --harga-bundling 145000 --komisi 9 --target-margin 15
```

Tentukan item sendiri:

```bash
python3 main.py \
  --item "Kaos:45000:75000:1" \
  --item "Topi:20000:35000:1" \
  --item "Tote bag:36000:45000:1" \
  --harga-bundling 139000
```

Keluarkan JSON untuk diproses skrip lain:

```bash
python3 main.py --json
```

Keluarkan CSV untuk spreadsheet:

```bash
python3 main.py --csv > harga-bundling.csv
```

## Contoh output

Output teks dengan data bawaan:

```text
Kalkulator Harga Bundling
=========================
Harga bundling        : Rp 139.000
Total harga eceran    : Rp 155.000
Diskon bundling       : Rp 16.000 (10,32%)
HPP total             : Rp 101.000
Komisi marketplace    : 8,00% (Rp 11.120)
Biaya tetap           : Rp 1.250
Kemasan               : Rp 2.000
Subsidi ongkir        : Rp 5.000
Target margin         : 12,00%
Bundling per bulan    : 40

Isi bundling:
Item                  Qty    HPP/pcs  Eceran/pcs  Nilai eceran  Alokasi omzet  Kontribusi
Kaos polos katun 30s    1  Rp 45.000   Rp 75.000     Rp 75.000      Rp 67.258   Rp 12.885
Topi twill              1  Rp 20.000   Rp 35.000     Rp 35.000      Rp 31.387    Rp 7.013
Tote bag kanvas         1  Rp 36.000   Rp 45.000     Rp 45.000      Rp 40.355   -Rp 1.268
Total                   3          -           -    Rp 155.000     Rp 139.000   Rp 18.630

Hasil per bundling:
Omzet                 : Rp 139.000
Biaya barang          : Rp 101.000
Potongan platform     : Rp 19.370
Total biaya           : Rp 120.370
Profit                : Rp 18.630
Margin                : 13,40%
Status                : Aman
Harga minimum         : Rp 136.563
Diskon maksimum       : Rp 18.437 (11,89%)
Ruang harga sekarang  : +Rp 2.437

Perbandingan jual terpisah:
Profit terpisah       : Rp 16.850
Selisih               : +Rp 1.780
Biaya pesanan dihemat : Rp 16.500
Diskon diberikan      : Rp 16.000

Proyeksi bulanan (40 bundling):
Profit bundling       : Rp 745.200
Profit terpisah       : Rp 674.000
Selisih bulanan       : +Rp 71.200

Catatan:
- Tote bag kanvas menyumbang kontribusi negatif Rp 1.268 per bundling.
```

Contoh JSON dari `python3 main.py --json`:

```json
{
  "config": {
    "bundle_price": 139000,
    "fee_pct": 8.0,
    "fixed_fee": 1250,
    "packaging": 2000,
    "shipping_subsidy": 5000,
    "target_margin_pct": 12.0,
    "monthly_bundles": 40
  },
  "items": [
    {
      "name": "Kaos polos katun 30s",
      "quantity": 1,
      "unit_cost": 45000,
      "retail_price": 75000,
      "retail_value": 75000
    },
    {
      "name": "Topi twill",
      "quantity": 1,
      "unit_cost": 20000,
      "retail_price": 35000,
      "retail_value": 35000
    },
    {
      "name": "Tote bag kanvas",
      "quantity": 1,
      "unit_cost": 36000,
      "retail_price": 45000,
      "retail_value": 45000
    }
  ],
  "totals": {
    "total_quantity": 3,
    "goods_cost": 101000,
    "retail_total": 155000,
    "discount": 16000,
    "discount_pct": 10.32258064516129,
    "commission": 11120,
    "platform_deduction": 19370,
    "total_cost": 120370,
    "profit": 18630,
    "margin_pct": 13.402877697841728,
    "status": "Aman",
    "minimum_price": 136563,
    "max_discount": 18437,
    "max_discount_pct": 11.894838709677419,
    "room_to_minimum": 2437
  },
  "item_analysis": [
    {
      "name": "Kaos polos katun 30s",
      "quantity": 1,
      "retail_value": 75000,
      "allocated_revenue": 67258,
      "allocated_fee": 9373,
      "contribution": 12885
    },
    {
      "name": "Topi twill",
      "quantity": 1,
      "retail_value": 35000,
      "allocated_revenue": 31387,
      "allocated_fee": 4374,
      "contribution": 7013
    },
    {
      "name": "Tote bag kanvas",
      "quantity": 1,
      "retail_value": 45000,
      "allocated_revenue": 40355,
      "allocated_fee": 5623,
      "contribution": -1268
    }
  ],
  "comparison": {
    "separate_profit": 16850,
    "profit_difference": 1780,
    "saved_order_cost": 16500,
    "discount_given": 16000
  },
  "monthly": {
    "bundles": 40,
    "bundle_profit": 745200,
    "separate_profit": 674000,
    "difference": 71200
  },
  "warnings": [
    "Tote bag kanvas menyumbang kontribusi negatif Rp 1.268 per bundling."
  ]
}
```

Contoh CSV dari `python3 main.py --csv`:

```csv
jenis,nama,qty,hpp_per_pcs,harga_eceran_per_pcs,nilai_eceran,alokasi_omzet,kontribusi,omzet_bundling,profit_bundling,margin_persen,status,harga_minimum,diskon_maksimum,profit_terpisah,selisih,profit_bulanan
ringkasan,,3,,,155000,139000,18630,139000,18630,13.40,Aman,136563,18437,16850,1780,745200
item,Kaos polos katun 30s,1,45000,75000,75000,67258,12885,,,,,,,,,
item,Topi twill,1,20000,35000,35000,31387,7013,,,,,,,,,
item,Tote bag kanvas,1,36000,45000,45000,40355,-1268,,,,,,,,,
```

CSV memakai titik sebagai desimal dan baris pertama adalah ringkasan. Baris berikutnya berisi
setiap item dengan kolom ringkasan dikosongkan.

## Format input

Semua input lewat flag. Angka rupiah memakai bilangan bulat tanpa titik. Persentase memakai
titik sebagai desimal, misalnya `8.5`, bukan `8,5`.

| Flag | Default | Arti |
|---|---|---|
| `--item` | tiga item contoh | Satu item dengan format `NAMA:HPP:HARGA:QTY`, boleh diulang |
| `--harga-bundling` | `139000` | Harga jual paket dalam rupiah |
| `--komisi` | `8` | Komisi marketplace dalam persen dari harga paket |
| `--biaya-tetap` | `1250` | Biaya tetap marketplace per pesanan dalam rupiah |
| `--kemasan` | `2000` | Biaya kemasan per pesanan dalam rupiah |
| `--subsidi-ongkir` | `5000` | Subsidi ongkir per pesanan dalam rupiah |
| `--target-margin` | `12` | Target margin bersih dalam persen dari harga paket |
| `--bundling-bulanan` | `40` | Jumlah bundling per bulan untuk proyeksi |
| `--json` | `false` | Output JSON |
| `--csv` | `false` | Output CSV |

Format `--item` adalah `NAMA:HPP:HARGA:QTY`:

- `NAMA` adalah label produk, boleh mengandung spasi tetapi tidak boleh mengandung titik dua.
- `HPP` adalah harga pokok per pcs dalam rupiah, minimal 0.
- `HARGA` adalah harga eceran per pcs dalam rupiah, harus lebih dari 0.
- `QTY` adalah jumlah pcs item tersebut dalam paket, antara 1 dan 1000.

Maksimal 12 item per paket dan nama item tidak boleh dobel. Jika `--item` tidak diisi, tool
memakai tiga item contoh. Jika `--item` diisi, seluruh item contoh diganti.

Contoh:

```bash
python3 main.py \
  --item "Kaos:45000:75000:1" \
  --item "Topi:20000:35000:1" \
  --item "Tote bag:36000:45000:1" \
  --item "Stiker:1000:3000:5" \
  --harga-bundling 145000
```

## Cara hitung

Untuk setiap paket:

- Total harga eceran = jumlah `harga eceran x qty` semua item.
- Diskon = total harga eceran - harga bundling. Diskon persen dihitung dari total harga
  eceran.
- Komisi = pembulatan ke rupiah dari `harga bundling x komisi persen / 100`.
- Biaya pesanan tetap = biaya tetap + kemasan + subsidi ongkir.
- Potongan platform = komisi + biaya pesanan tetap.
- Total biaya = HPP total + potongan platform.
- Profit = harga bundling - total biaya.
- Margin = `profit / harga bundling x 100`.
- Harga minimum = harga bulat terkecil yang membuat profit minimal sama dengan target margin.
  Pencarian memakai binary search karena komisi dibulatkan per rupiah.
- Diskon maksimum = total harga eceran - harga minimum. Nilai negatif berarti target margin
  tidak mungkin dicapai tanpa menaikkan harga eceran.
- Ruang harga sekarang = harga bundling - harga minimum. Nilai negatif berarti harga paket
  harus dinaikkan sebesar itu agar target tercapai.
- Alokasi omzet dan alokasi biaya platform dibagi ke setiap item secara proporsional terhadap
  nilai ecerannya. Pembagian memakai metode largest remainder supaya jumlahnya tepat sama
  dengan total paket.
- Kontribusi item = alokasi omzet - HPP item - alokasi biaya platform.
- Profit jual terpisah = jumlah profit setiap pcs jika dijual sebagai pesanan sendiri,
  masing-masing menanggung komisi dari harga ecerannya dan biaya pesanan tetap sendiri.
- Biaya pesanan dihemat = biaya pesanan tetap x (total qty - 1), yaitu selisih antara satu
  pesanan paket dan satu pesanan untuk setiap pcs.
- Proyeksi bulanan = profit per paket x jumlah bundling per bulan.

## Status

| Status | Syarat | Arti |
|---|---|---|
| Aman | Profit lebih besar atau sama dengan target margin | Paket memenuhi target |
| Tipis | Profit tidak negatif, tetapi di bawah target margin | Masih untung, target belum tercapai |
| Rugi | Profit negatif | Setiap paket kehilangan uang |

Status memakai nilai profit asli, bukan angka yang sudah dibulatkan untuk tampilan.

## Asumsi

- Rate komisi, biaya tetap, kemasan, dan subsidi ongkir adalah input seller. Angka default
  hanya contoh yang wajar, bukan tarif resmi marketplace. Cocokkan dengan seller center dan
  kontrak yang berlaku.
- Komisi dihitung dari harga paket, bukan dari harga eceran setiap item.
- Biaya tetap, kemasan, dan subsidi ongkir dihitung satu kali per paket.
- Perbandingan jual terpisah menganggap setiap pcs dijual sebagai pesanan sendiri. Jika
  beberapa pcs biasanya digabung dalam satu pesanan, hasil perbandingan bisa berbeda.
- Alokasi omzet dan biaya per item adalah alat bantu analisis, bukan rincian settlement resmi
  dari marketplace. Marketplace bisa membagi biaya dengan cara lain.
- HPP sudah mencakup bahan, tenaga kerja, dan overhead per pcs. Belum termasuk pajak, iklan,
  biaya retur, biaya penyimpanan, dan biaya lain di luar input.
- Pembulatan dilakukan per komponen ke rupiah terdekat. Hasil bisa berbeda satu atau dua
  rupiah dari sistem marketplace yang membulatkan di akhir.
- Proyeksi bulanan menganggap semua pesanan memakai paket yang sama. Belum memperhitungkan
  perubahan harga, kampanye, atau kenaikan biaya.
- Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.

## Test

```bash
cd 64-kalkulator-harga-bundling
python3 -m py_compile ./*.py
python3 -m unittest discover -s . -p 'test_*.py'
```

Test memakai `unittest` dan mencakup 23 kasus: perhitungan contoh bawaan, status aman, tipis,
dan rugi, harga minimum yang benar-benar minimal, target yang tidak mungkin tercapai, alokasi
yang jumlahnya tepat, bobot nol, kontribusi item negatif, parsing item valid dan tidak valid,
nama dobel, batas 12 item, validasi harga, komisi, target margin, biaya tetap, kemasan,
subsidi ongkir, jumlah bundling bulanan, format rupiah dan persen, output teks, JSON, CSV,
serta larangan em dash dan en dash pada output.

## Struktur

```text
64-kalkulator-harga-bundling/
├── main.py            Entry point, argparse, dan pemilihan format output
├── bundling.py        Logika murni: parsing, validasi, perhitungan, alokasi
├── report.py          Penulis output teks, JSON, dan CSV
├── test_bundling.py   Test unittest
└── README.md
```

## Catatan

Angka dari tool adalah estimasi dari input seller, bukan laporan laba resmi. Sebelum
mengumumkan harga bundling, simpan CSV hasil perhitungan, cocokkan dengan HPP aktual dan
potongan settlement nyata, lalu uji satu atau dua paket sebelum memperluas ke semua produk.
Untuk paket dengan item yang kontribusinya negatif, pertimbangkan menaikkan harga paket,
menurunkan porsi item tersebut, atau menjualnya terpisah.

## Lisensi

MIT, mengikuti lisensi repository.
