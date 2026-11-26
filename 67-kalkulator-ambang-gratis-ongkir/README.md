# Kalkulator Ambang Gratis Ongkir

CLI untuk menentukan ambang gratis ongkir minimum agar target margin tetap tercapai,
membandingkan profit pesanan dengan dan tanpa gratis ongkir, menghitung batas ongkir yang
masih aman, dan memproyeksikan biaya program per bulan.

Berbeda dari [Estimasi Ongkir](../11-shipping-cost-estimator/) yang membandingkan tarif
kurir, tool ini tidak menghitung tarif pengiriman. Berbeda juga dari
[Biaya Total Marketplace](../36-biaya-total-marketplace/) yang menyusun semua komponen
biaya, tool ini fokus pada satu keputusan: berapa nilai pesanan minimum agar gratis ongkir
masih memenuhi target margin. Untuk audit berat chargeable, gunakan
[Pemeriksa Ongkir Volumetrik](../60-pemeriksa-ongkir-volumetrik/).

## Masalah yang dipecahkan

Gratis ongkir sering dipasang dengan angka bulat yang terasa masuk akal, misalnya dua kali
rata-rata pesanan. Masalahnya, ongkir adalah biaya nyata yang ditanggung seller, sementara
komisi marketplace tetap dipotong dari nilai pesanan. Ambang yang terlalu rendah membuat
setiap pesanan gratis hanya tipis untung atau bahkan rugi. Ambang yang terlalu tinggi membuat
pembeli tidak pernah mencapai syarat, sehingga program tidak menambah omzet.

Tool ini menjawab pertanyaan praktis:

- Berapa profit dan margin pesanan di ambang gratis ongkir saat ini?
- Berapa ambang minimum agar target margin tercapai?
- Berapa titik impas, yaitu ambang paling rendah agar tidak rugi?
- Berapa batas ongkir netto yang masih aman pada ambang sekarang?
- Berapa biaya program gratis ongkir per bulan?
- Apa yang terjadi pada ambang minimum jika ongkir naik atau turun 20 persen?

## Cara run

Butuh Python 3. Tidak ada dependency eksternal.

```bash
cd 67-kalkulator-ambang-gratis-ongkir
python3 main.py
```

## Contoh perintah

Pakai contoh bawaan:

```bash
python3 main.py
```

Uji ambang yang lebih rendah dan ongkir tanpa subsidi:

```bash
python3 main.py --ambang 130000 --ongkir 20000 --subsidi 0 --target-margin 12
```

Ubah semua input untuk toko dengan pesanan lebih banyak:

```bash
python3 main.py \
  --ambang 175000 --hpp 105000 --komisi 9 --biaya-tetap 1500 --kemasan 3000 \
  --ongkir 22000 --subsidi 5000 --target-margin 18 \
  --pesanan-bulanan 500 --persen-gratis 55
```

Keluarkan JSON untuk diproses skrip lain:

```bash
python3 main.py --json
```

Keluarkan CSV untuk spreadsheet:

```bash
python3 main.py --csv > ambang-gratis-ongkir.csv
```

## Contoh output

Output teks dengan data bawaan:

```text
Kalkulator Ambang Gratis Ongkir
===============================
Ambang sekarang             : Rp 150.000
HPP per pesanan             : Rp 90.000
Komisi marketplace          : 8,00%
Biaya tetap                 : Rp 1.250
Kemasan                     : Rp 2.500
Ongkir ditanggung seller    : Rp 18.000
Subsidi ongkir platform     : Rp 4.000
Ongkir netto                : Rp 14.000
Target margin               : 15,00%
Pesanan per bulan           : 300
Porsi pesanan gratis        : 40,00%

Pesanan di ambang sekarang:
Omzet                       : Rp 150.000
Komisi marketplace          : Rp 12.000
HPP                         : Rp 90.000
Biaya tetap + kemasan       : Rp 3.750
Ongkir netto                : Rp 14.000
Profit tanpa gratis ongkir  : Rp 44.250
Margin tanpa gratis ongkir  : 29,50%
Profit dengan gratis ongkir : Rp 30.250
Margin dengan gratis ongkir : 20,17%
Status                      : Aman

Ambang minimum:
Titik impas                 : Rp 118.000
Target margin               : Rp 140.000
Ambang sekarang             : Rp 150.000
Selisih ke target           : +Rp 10.000
Batas ongkir aman           : Rp 21.750
Sisa ruang ongkir           : +Rp 7.750

Proyeksi bulanan:
Pesanan gratis              : 120 dari 300
Omzet pesanan gratis        : Rp 18.000.000
Beban ongkir program        : Rp 1.680.000 (9,33% dari omzet)
Profit pesanan gratis       : Rp 3.630.000
Profit tanpa ongkir         : Rp 5.310.000
Biaya program               : -Rp 1.680.000
Kekurangan dari target      : Rp 0

Sensitivitas ongkir:
Skenario          Ongkir netto  Ambang target  Profit sekarang  Margin  Status
Ongkir turun 20%     Rp 10.400     Rp 136.000        Rp 33.850  22,57%  Aman
Sesuai input         Rp 14.000     Rp 140.000        Rp 30.250  20,17%  Aman
Ongkir naik 20%      Rp 17.600     Rp 145.000        Rp 26.650  17,77%  Aman

Catatan:
- Ambang sekarang Rp 150.000 berada Rp 10.000 di atas minimum target Rp 140.000, ada ruang untuk menurunkan ambang.
```

Contoh JSON dari `python3 main.py --json`:

```json
{
  "config": {
    "order_value": 150000,
    "hpp": 90000,
    "fee_pct": 8.0,
    "fixed_fee": 1250,
    "packaging": 2500,
    "shipping_cost": 18000,
    "shipping_subsidy": 4000,
    "target_margin_pct": 15.0,
    "monthly_orders": 300,
    "free_share_pct": 40.0
  },
  "net_shipping": 14000,
  "commission": 12000,
  "normal_profit": 44250,
  "normal_margin_pct": 29.5,
  "free_profit": 30250,
  "free_margin_pct": 20.166666666666664,
  "target_profit": 22500.0,
  "shortfall_per_order": 0,
  "status": "Aman",
  "break_even_threshold": 118000,
  "target_threshold": 140000,
  "gap_to_target": 10000,
  "safe_shipping_limit": 21750,
  "shipping_headroom": 7750,
  "monthly_free_orders": 120,
  "monthly_revenue": 18000000,
  "monthly_shipping_cost": 1680000,
  "monthly_shipping_share_pct": 9.333333333333334,
  "monthly_free_profit": 3630000,
  "monthly_no_ship_profit": 5310000,
  "monthly_program_cost": -1680000,
  "monthly_shortfall": 0,
  "scenarios": [
    {
      "label": "Ongkir turun 20%",
      "multiplier_pct": 80,
      "net_shipping": 10400,
      "target_threshold": 136000,
      "profit": 33850,
      "margin_pct": 22.566666666666666,
      "status": "Aman"
    }
  ],
  "warnings": [
    "Ambang sekarang Rp 150.000 berada Rp 10.000 di atas minimum target Rp 140.000, ada ruang untuk menurunkan ambang."
  ]
}
```

Daftar `scenarios` dipotong menjadi satu item di contoh ini supaya ringkas. Output sebenarnya
memuat tiga skenario: ongkir turun 20 persen, sesuai input, dan ongkir naik 20 persen.

Contoh CSV dari `python3 main.py --csv`:

```csv
jenis,label,ambang,ongkir_netto,komisi,profit,margin_persen,status,ambang_target,ambang_impas,pesanan_gratis_bulanan,beban_ongkir_bulanan
ringkasan,ambang-sekarang,150000,14000,12000,30250,20.17,Aman,140000,118000,120,1680000
skenario-ongkir,Ongkir turun 20%,,10400,,33850,22.57,Aman,136000,,,
skenario-ongkir,Sesuai input,,14000,,30250,20.17,Aman,140000,,,
skenario-ongkir,Ongkir naik 20%,,17600,,26650,17.77,Aman,145000,,,
```

CSV memakai titik sebagai desimal dan tidak memakai format rupiah. Baris pertama adalah
ringkasan, tiga baris berikutnya adalah skenario sensitivitas ongkir.

## Format input

Semua input lewat flag. Angka rupiah memakai bilangan bulat tanpa titik. Persentase memakai
titik sebagai desimal, misalnya `8.5`, bukan `8,5`.

| Flag | Default | Arti |
|---|---|---|
| `--ambang` | `150000` | Ambang gratis ongkir saat ini dalam rupiah, sekaligus nilai pesanan yang diuji |
| `--hpp` | `90000` | HPP per pesanan dalam rupiah |
| `--komisi` | `8` | Komisi marketplace dalam persen dari nilai pesanan |
| `--biaya-tetap` | `1250` | Biaya tetap marketplace per pesanan dalam rupiah |
| `--kemasan` | `2500` | Biaya kemasan per pesanan dalam rupiah |
| `--ongkir` | `18000` | Ongkir yang ditanggung seller per pesanan gratis dalam rupiah |
| `--subsidi` | `4000` | Subsidi ongkir dari platform per pesanan gratis dalam rupiah |
| `--target-margin` | `15` | Target margin bersih dalam persen dari nilai pesanan |
| `--pesanan-bulanan` | `300` | Jumlah pesanan per bulan untuk proyeksi |
| `--persen-gratis` | `40` | Porsi pesanan yang memakai gratis ongkir, 0 sampai 100 |
| `--json` | `false` | Output JSON |
| `--csv` | `false` | Output CSV |

Aturan validasi:

- `--ambang` harus lebih dari 0.
- `--hpp`, `--biaya-tetap`, `--kemasan`, `--ongkir`, `--subsidi`, dan
  `--pesanan-bulanan` tidak boleh negatif.
- `--komisi` harus 0 sampai kurang dari 100.
- `--target-margin` harus 0 sampai kurang dari 100.
- Komisi ditambah target margin harus kurang dari 100.
- `--persen-gratis` harus 0 sampai 100.

Nilai yang tidak valid ditolak dengan pesan error dan exit code 2. Tool tidak membaca file
input. Semua nilai diberikan lewat flag.

## Cara hitung

Untuk pesanan di ambang sekarang:

- Ongkir netto = `max(0, ongkir - subsidi)`. Subsidi yang lebih besar dari ongkir dianggap
  menutup seluruh ongkir.
- Komisi = pembulatan ke rupiah dari `ambang x komisi persen / 100`.
- Profit tanpa gratis ongkir = `ambang - komisi - HPP - biaya tetap - kemasan`.
- Margin tanpa gratis ongkir = `profit tanpa gratis ongkir / ambang x 100`.
- Profit dengan gratis ongkir = `profit tanpa gratis ongkir - ongkir netto`.
- Margin dengan gratis ongkir = `profit dengan gratis ongkir / ambang x 100`.
- Kekurangan per pesanan = `ambang x target margin / 100 - profit dengan gratis ongkir`,
  minimal 0.

Untuk ambang minimum:

- Total biaya = `HPP + biaya tetap + kemasan + ongkir netto`.
- Titik impas adalah kelipatan Rp 1.000 terkecil yang membuat profit dengan gratis ongkir
  minimal 0.
- Ambang target adalah kelipatan Rp 1.000 terkecil yang membuat profit dengan gratis ongkir
  minimal sama dengan `ambang x target margin / 100`.
- Kedua ambang dihitung dengan pencarian bertahap, bukan sekadar pembagian, karena komisi
  dibulatkan per rupiah. Hasilnya dijamin kelipatan Rp 1.000 terkecil yang benar-benar
  memenuhi syarat.
- Selisih ke target = `ambang sekarang - ambang target`. Nilai positif berarti ambang
  sekarang masih di atas minimum, nilai negatif berarti ambang sekarang terlalu rendah.
- Batas ongkir aman = `floor(profit tanpa gratis ongkir - ambang x target margin / 100)`,
  minimal 0. Ini ongkir netto terbesar yang masih memenuhi target pada ambang sekarang.
- Sisa ruang ongkir = `batas ongkir aman - ongkir netto`.

Untuk proyeksi bulanan:

- Pesanan gratis = pembulatan ke rupiah dari `pesanan bulanan x persen gratis / 100`.
- Omzet pesanan gratis = `pesanan gratis x ambang`.
- Beban ongkir program = `pesanan gratis x ongkir netto`.
- Profit pesanan gratis = `pesanan gratis x profit dengan gratis ongkir`.
- Profit tanpa ongkir = `pesanan gratis x profit tanpa gratis ongkir`.
- Biaya program = `profit pesanan gratis - profit tanpa ongkir`, yang sama dengan
  `-beban ongkir program`.
- Kekurangan dari target = `pesanan gratis x kekurangan per pesanan`.

Contoh bawaan: pada ambang Rp 150.000, komisi Rp 12.000, HPP Rp 90.000, biaya tetap
Rp 1.250, dan kemasan Rp 2.500, profit tanpa gratis ongkir Rp 44.250. Ongkir netto
Rp 14.000 menurunkan profit menjadi Rp 30.250, margin 20,17 persen. Total biaya untuk
pencarian ambang adalah Rp 107.750. Titik impas Rp 118.000 dan ambang target Rp 140.000.
Batas ongkir aman Rp 21.750, sehingga ongkir netto sekarang masih menyisakan ruang
Rp 7.750.

Skenario sensitivitas mengalikan `--ongkir` dengan 80, 100, dan 120 persen, lalu menghitung
ulang ongkir netto, ambang target, profit, dan margin pada ambang sekarang. Subsidi tetap
sama di ketiga skenario.

## Status

| Status | Syarat | Arti |
|---|---|---|
| Aman | Profit dengan gratis ongkir minimal sama dengan target margin | Ambang sekarang memenuhi target |
| Tipis | Profit tidak negatif, tetapi di bawah target margin | Masih untung, target belum tercapai |
| Rugi | Profit negatif | Setiap pesanan gratis kehilangan uang |

Status memakai nilai profit asli, bukan angka yang sudah dibulatkan untuk tampilan. Contoh,
margin `14,99 persen` dengan target `15,00 persen` berstatus Tipis.

## Asumsi

- HPP, komisi, biaya tetap, kemasan, ongkir, subsidi, dan target margin adalah input seller.
  Angka default hanya contoh yang wajar, bukan tarif resmi marketplace atau kurir. Cocokkan
  dengan seller center, kontrak, dan tagihan kurir yang berlaku.
- Nilai yang diuji adalah ambang itu sendiri. Artinya, tool menganggap pesanan gratis berada
  tepat di ambang. Pesanan di atas ambang biasanya punya margin lebih baik, sedangkan pesanan
  di bawah ambang tidak ikut program.
- Satu pesanan memakai satu ongkir. Belum ada perbedaan berat, dimensi, tujuan, atau jenis
  kurir. Jika ongkir berbeda per wilayah, jalankan tool beberapa kali dengan ongkir rata-rata
  per kelompok atau pakai ongkir tertinggi untuk skenario konservatif.
- Subsidi dihitung per pesanan gratis dan tidak bisa membuat ongkir netto negatif. Jika
  platform memberi subsidi dalam bentuk lain, misalnya voucher ongkir untuk pembeli,
  masukkan nilai bersih yang benar-benar mengurangi biaya seller.
- Komisi dihitung dari nilai pesanan, bukan dari ongkir yang dibayar seller. Sebagian
  marketplace dapat memperlakukan ongkir atau biaya lain secara berbeda. Sesuaikan angka
  komisi jika settlement menunjukkan perbedaan.
- Biaya tetap dan kemasan dihitung satu kali per pesanan. HPP mencakup harga barang dan
  biaya lain yang melekat pada produk, tetapi belum termasuk pajak, iklan, retur, biaya
  penyimpanan, dan biaya administrasi di luar input.
- Ambang target dan titik impas dibulatkan ke atas pada kelipatan Rp 1.000 supaya mudah
  dipakai di seller center. Pembulatan ini bisa membuat margin sedikit di atas target.
- Proyeksi bulanan menganggap semua pesanan gratis memakai nilai ambang yang sama dan porsi
  pesanan gratis stabil. Perubahan harga, kampanye, dan lonjakan ongkir belum
  diperhitungkan.
- Pembulatan rupiah memakai setengah ke atas. Marketplace bisa membulatkan dengan cara lain,
  sehingga selisih satu atau dua rupiah mungkin terjadi.
- Tool tidak melakukan panggilan jaringan dan tidak menyimpan data pengguna.

## Test

```bash
cd 67-kalkulator-ambang-gratis-ongkir
python3 -m py_compile ./*.py
python3 -m unittest discover -s . -p 'test_*.py'
```

Test memakai `unittest` dan mencakup 24 kasus: perhitungan contoh bawaan, profit dan margin
dengan serta tanpa gratis ongkir, titik impas, ambang target yang benar-benar minimal, batas
ongkir aman, status aman, tipis, dan rugi, subsidi yang menutup seluruh ongkir, pembulatan
pesanan gratis, proyeksi bulanan, tiga skenario sensitivitas, validasi seluruh input,
format rupiah dan persen, output teks, JSON, CSV, pemanggilan CLI, penolakan input tidak
valid, serta larangan em dash dan en dash pada output.

## Struktur

```text
67-kalkulator-ambang-gratis-ongkir/
├── main.py            Entry point, argparse, dan pemilihan format output
├── ongkir.py          Logika murni: validasi, pencarian ambang, proyeksi, peringatan
├── report.py          Penulis output teks, JSON, dan CSV
├── test_ongkir.py     Test unittest
└── README.md
```

## Catatan

Angka dari tool adalah estimasi dari input seller, bukan laporan laba resmi. Sebelum
menaikkan atau menurunkan ambang gratis ongkir, simpan CSV hasil perhitungan, cocokkan
ongkir netto dengan tagihan kurir terakhir, dan bandingkan dengan data pesanan nyata selama
minimal dua sampai empat minggu. Jika ongkir sering berubah, gunakan skenario ongkir naik
20 persen sebagai batas aman. Untuk produk dengan berat atau dimensi besar, hitung ongkir
volumetrik lebih dulu agar angka ongkir yang dimasukkan tidak terlalu rendah.

## Lisensi

MIT, mengikuti lisensi repository.
