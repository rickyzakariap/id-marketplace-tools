# Pemeriksa Take Rate

Alat bantu untuk membandingkan take rate aktual toko marketplace dengan benchmark rata-rata Cube kuartal II 2026 per platform dan kategori, menghitung selisih dalam poin dan rupiah, memeriksa cakupan biaya, menilai kesiapan bukti, mencatat kasus, dan menyusun surat permintaan rincian.

Dibuat dari publikasi Databoks Katadata 6 November 2026 yang memuat data Cube, Shopee Take-Rate Tracker edisi Agustus 2026, untuk penjual non-Mall Indonesia: fashion, FMCG, dan elektronik di Shopee, TikTok Shop, dan Lazada. Take rate pada benchmark mencakup komisi platform dan biaya transaksi, tanpa biaya program gratis ongkir atau cashback, iklan, logistik, pajak, dan biaya tetap.

## Run

```bash
cd 52-pemeriksa-take-rate
npm install
npm start
```

Buka `http://localhost:8052`.

Data kasus disimpan di `data/cases.json` dan tidak masuk git.

## Fitur

- Memilih platform, kategori, tipe toko, dan periode laporan.
- Menghitung take rate aktual dari komisi platform ditambah biaya transaksi dibagi omzet kotor.
- Membandingkan take rate aktual dengan benchmark kategori dan platform yang dipilih.
- Menampilkan selisih dalam poin persentase, rupiah per bulan, dan rupiah per tahun.
- Memisahkan biaya di luar benchmark: program gratis ongkir atau cashback, iklan, logistik, pajak, dan biaya tetap.
- Menghitung total potongan all-in sebagai konteks, bukan sebagai take rate.
- Menilai 14 sinyal, termasuk selisih di atas 2 dan 5 poin, komisi atau biaya transaksi nol, cakupan biaya belum dikonfirmasi, toko Mall, dan benchmark yang diubah.
- Menilai 11 bukti dengan 4 bukti kritis: laporan settlement, rincian komisi, rincian biaya transaksi, dan laporan omzet kotor.
- Memberi verdict yang menahan kesimpulan bila cakupan biaya belum dikonfirmasi atau toko berstatus Mall.
- Membuat tiga surat: permintaan rincian biaya, keberatan selisih take rate, dan eskalasi.
- Mencatat kasus per toko, mengubah status, menghapus kasus, dan mengekspor CSV.
- Menampilkan sumber benchmark, periode, segmen, dan cakupan biaya.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/meta` | Pilihan, benchmark, aturan, daftar bukti, status, surat, dan sumber |
| GET | `/api/benchmarks` | Tabel benchmark, periode, segmen, cakupan, dan sumber |
| GET | `/api/example` | Contoh kasus yang bisa langsung dihitung |
| POST | `/api/analyze` | Validasi, hitung take rate, selisih, sinyal, dan kesiapan bukti |
| POST | `/api/readiness` | Hitung kesiapan bukti saja |
| POST | `/api/letter` | Susun surat rincian, keberatan, atau eskalasi |
| GET | `/api/cases` | Ringkasan kasus dan total selisih |
| POST | `/api/cases` | Simpan kasus baru |
| PATCH | `/api/cases/:id` | Ubah status atau isi kasus |
| DELETE | `/api/cases/:id` | Hapus kasus |
| POST | `/api/seed` | Simpan satu kasus contoh |
| GET | `/api/export` | Unduh kasus sebagai CSV |

Contoh analisis:

```bash
curl -s http://localhost:8052/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Toko Uji",
    "platform": "shopee",
    "category": "fashion",
    "store_type": "non_mall",
    "period": "2026-10",
    "gross_sales": 150000000,
    "commission_fee": 22500000,
    "transaction_fee": 6000000,
    "scope_confirmed": "ya",
    "evidence": ["settlement_report", "fee_detail", "transaction_detail", "gross_sales_report"]
  }'
```

## Test

```bash
npm test
```

23 unit test mencakup nilai benchmark, perhitungan contoh, verdict untuk selisih di atas dan di bawah benchmark, cakupan biaya, toko Mall, komisi nol, benchmark manual, validasi input, normalisasi, skor bukti, tabel benchmark, tiga surat, ringkasan kasus, ekspor CSV, format angka, dan pemeriksaan em dash.

## Batas

- Benchmark adalah rata-rata pasar dari data Cube, bukan batas resmi platform dan bukan bukti pelanggaran.
- Benchmark hanya mencakup komisi platform dan biaya transaksi. Biaya program gratis ongkir atau cashback, iklan, logistik, pajak, dan biaya tetap harus dipisahkan sebelum membandingkan.
- Benchmark sumber adalah penjual non-Mall. Toko Mall tidak bisa langsung disimpulkan memakai benchmark ini.
- Kategori produk harus dipastikan di listing. Kategori yang salah membuat benchmark tidak sebanding.
- Selisih kecil bisa berasal dari pembulatan, kategori, atau program. Periksa rincian settlement dan pengumuman tarif platform sebelum menyimpulkan ada kelebihan biaya.
- Take rate di bawah benchmark tidak otomatis berarti tarif lebih rendah. Bisa jadi ada komponen biaya yang belum diisi.
- Data kasus bersifat lokal dan tidak disinkronkan ke perangkat lain.

## Sumber

- Databoks Katadata, Perbandingan Biaya Penjual Fashion di Shopee, TikTok Shop, dan Lazada Kuartal II 2026, 6 November 2026: `https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed6dccea4cf/perbandingan-biaya-penjual-fashion-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026`
- Databoks Katadata, Perbandingan Biaya Penjual FMCG di Shopee, TikTok Shop, dan Lazada Kuartal II 2026, 6 November 2026: `https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed674a94db7/perbandingan-biaya-penjual-fmcg-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026`
- Databoks Katadata, Perbandingan Biaya Penjual Elektronik di Shopee, TikTok Shop, dan Lazada Kuartal II 2026, 6 November 2026: `https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed717b759d9/perbandingan-biaya-penjual-elektronik-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026`
- Kompas.id, Beban Marketplace Tinggi, Mungkinkah Transaksi Beralih ke Luar Platform, 18 April 2026: `https://www.kompas.id/artikel/komisi-dan-biaya-marketplace-makin-tinggi-mungkinkah-transaksi-beralih-ke-luar-platform`
