# Pemeriksa Kesiapan SNI

Alat bantu untuk memeriksa kesiapan dokumen SNI pada 8 produk yang wajib SNI sebelum menambah stok atau mempertahankan listing. Tool memetakan bukti kritis per peran, menghitung modal yang berisiko tertahan, memberi verdict, mencatat kasus, dan menyusun surat permintaan dokumen.

Dibuat dari publikasi UKMINDONESIA.ID 9 November 2026 yang mengutip Kemenperin: delapan produk wajib SNI beserta nomor SNI dan Permenperin, kewajiban produsen, importir, pemilik merek maklun, dan pedagang. Dasar kewajiban pedagang hanya menjual barang bertanda SNI merujuk PP 34/2018 melalui penjelasan Hukumonline. Ketentuan atribut nomor sertifikat SNI di marketplace merujuk pusat edukasi penjual Shopee yang diakses 10 November 2026.

## Run

```bash
cd 53-pemeriksa-kesiapan-sni
npm install
npm start
```

Buka `http://localhost:8053`.

Data kasus disimpan di `data/cases.json` dan tidak masuk git.

## Fitur

- Memuat 8 produk wajib SNI: selang termoplastik LPG, tangki air silinder, selang karet LPG, karet perapat LPG, helm, perlengkapan melamin, minyak lumas, dan ban.
- Menampilkan nomor SNI dan dasar aturan per produk, termasuk perubahan Permenperin 24/2026 yang berlaku 17 September 2026 untuk ban.
- Membedakan bukti dan kewajiban untuk empat peran: pedagang, produsen, importir, dan pemilik merek maklun.
- Menilai 14 bukti dengan jumlah bukti kritis berbeda per peran: pedagang 5, produsen 6, importir 6, dan maklun 7.
- Menghitung modal tertahan dari stok dikali harga modal, serta omzet produk per bulan dan per tahun.
- Memberi verdict risiko tinggi bila bukti kritis kurang sementara produk masih dijual.
- Menahan kesimpulan bila produk tidak sedang dijual, status penjualan belum diketahui, atau produk berada di luar daftar 8 produk.
- Menampilkan kewajiban, rekomendasi, dan skor kesiapan bukti berbobot dua kali untuk bukti kritis.
- Membuat tiga surat: permintaan dokumen ke pemasok, klarifikasi ke LSPro, dan klarifikasi ke marketplace.
- Mencatat kasus per toko, menandai selesai, menghapus kasus, dan mengekspor CSV.
- Menampilkan sumber, cakupan, dan batas tool agar skor tidak dibaca sebagai putusan hukum.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/meta` | Pilihan produk, peran, marketplace, bukti, status, surat, aturan, dan sumber |
| GET | `/api/products` | Daftar produk wajib SNI, cakupan, dan sumber |
| GET | `/api/example` | Contoh kasus perlengkapan melamin yang bisa langsung dihitung |
| POST | `/api/analyze` | Validasi, hitung modal tertahan, verdict, kewajiban, rekomendasi, dan kesiapan bukti |
| POST | `/api/readiness` | Hitung kesiapan bukti saja |
| POST | `/api/letter` | Susun surat pemasok, klarifikasi LSPro, atau marketplace |
| GET | `/api/cases` | Ringkasan kasus dan total modal tertahan |
| POST | `/api/cases` | Simpan kasus baru |
| PATCH | `/api/cases/:id` | Ubah status atau isi kasus |
| DELETE | `/api/cases/:id` | Hapus kasus |
| POST | `/api/seed` | Simpan satu kasus contoh |
| GET | `/api/export` | Unduh kasus sebagai CSV |

Contoh analisis:

```bash
curl -s http://localhost:8053/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Toko Uji",
    "product": "melamin",
    "role": "pedagang",
    "marketplace": "shopee",
    "selling_now": "ya",
    "stock_units": 240,
    "unit_cost": 35000,
    "monthly_revenue": 12000000,
    "evidence": ["sni_certificate", "sppt_sni", "sni_mark", "purchase_proof", "listing_screenshot", "stock_list"]
  }'
```

## Test

```bash
npm test
```

25 unit test mencakup jumlah produk dan sumber, nomor SNI dan dasar aturan, perhitungan contoh, verdict per status penjualan, bukti kritis per peran, produk di luar daftar, validasi dan normalisasi, skor bukti, tabel produk, tiga surat, ringkasan kasus, ekspor CSV, format angka, dan pemeriksaan em dash.

## Batas

- Tool hanya memuat 8 produk wajib SNI dari sumber yang dipakai. Produk di luar daftar belum tentu bebas SNI, jadi cocokkan dengan daftar resmi Kemenperin atau BSN.
- Nomor SNI bukan nomor sertifikat SNI. Atribut marketplace memakai nomor sertifikat, bukan nomor standar.
- Kewajiban dapat berubah lewat Permenperin baru. Periksa JDIH Kemenperin dan peraturan.go.id sebelum menumpuk stok.
- Skor menilai kelengkapan bukti, bukan kelayakan sertifikasi, bukan putusan hukum, dan bukan jaminan listing aman.
- Tool tidak mengarang biaya, waktu sertifikasi, atau ambang omzet.
- Stok dan omzet berasal dari input penjual, bukan data resmi platform atau Kemenperin.
- Data kasus bersifat lokal dan tidak disinkronkan ke perangkat lain.

## Sumber

- UKMINDONESIA.ID, 8 Produk Wajib SNI dari Kemenperin: Daftar dan Dampaknya bagi UMKM, 9 November 2026: `https://ukmindonesia.id/baca-deskripsi-posts/8-produk-wajib-sni-dari-kemenperin-daftar-dan-dampaknya-bagi-umkm`
- Hukumonline, Apakah SNI Wajib untuk Semua Produk?, 7 Juli 2026: `https://www.hukumonline.com/klinik/a/Apakah-sni-wajib-cl3855`
- Pusat Edukasi Penjual Shopee Indonesia, Ketentuan Bukti Pemenuhan Standar Barang, diakses 10 November 2026: `https://seller.shopee.co.id/edu/article/19552`
- BBSPJI Tekstil Kementerian Perindustrian, Sertifikasi Produk Wajib dan Sukarela, diperbarui 2 Juni 2026: `https://bbt.kemenperin.go.id/layanan/sertifikasi-produk`
