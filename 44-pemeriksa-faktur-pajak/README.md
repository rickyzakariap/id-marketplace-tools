# Pemeriksa Faktur Pajak Marketplace

Shopee mulai menerbitkan faktur pajak untuk biaya layanan, komisi affiliate, dan pembelian saldo iklan secara bertahap mulai November 2026. Tool ini membantu penjual mengecek kesiapan data, menghitung estimasi PPN, memantau tenggat tanggal 12 dan 15, melacak perkara per periode, dan membuat surat permintaan pemeriksaan.

Berbeda dari [PPh 22 Tax Calculator](../22-pph22-tax-calculator/), [PPh 22 Refund Tracker](../25-pph22-refund-tracker/), dan [Omzet Gabungan Tracker](../26-omzet-gabungan-tracker/) yang membahas PPh 22 atas penjualan, tool ini membahas **faktur pajak PPN atas biaya yang dibebankan marketplace ke penjual**. Keduanya adalah dokumen dan kredit pajak yang berbeda.

## Run

```
npm install
npm start
```

Buka http://localhost:8044

## Fitur

- Pemeriksa jadwal per periode faktur. Batas perbarui data tanggal 30 atau 31, perkiraan faktur tersedia tanggal 12 bulan berikutnya, dan batas lapor ke CS tanggal 15 bulan berikutnya. Status berubah otomatis mengikuti tanggal hari ini: siapkan data, menunggu, cek dan lapor, tenggat lewat, atau sudah diterima.
- Estimasi PPN dari lima jenis biaya: layanan, komisi affiliate, saldo iklan, promo, dan logistik. Bisa memilih nominal sudah termasuk PPN atau belum. Default tarif 11% adalah tarif efektif PPN non-mewah menurut PMK 131/2024, bisa diubah, dan selalu ditandai estimasi.
- Skor kesiapan 12 data dengan lima data kritis: nama, NIK dan NPWP, alamat, email penagihan, serta kecocokan Data Diri dengan Informasi Penagihan.
- Pemisahan tiga dokumen: Faktur Pajak (PPN biaya), Faktur Tagihan (rincian biaya), dan Bukti Pemungutan PPh 22 (0,5% dari peredaran bruto, tidak termasuk PPN dan PPnBM). Tool memperingatkan agar tidak mencampur kredit PPN dengan kredit PPh 22.
- Catatan per periode dengan status, nomor tiket, tanggal faktur diterima, estimasi PPN, peringatan tenggat, ringkasan, dan ekspor CSV.
- Generator surat permintaan pemeriksaan untuk tiga masalah: faktur belum terbit, data salah, atau nominal tidak sesuai. Surat tidak menjanjikan penerbitan ulang untuk periode berjalan.
- Sumber berita dan aturan ditampilkan di UI. Tidak ada tarif, statistik, atau tingkat keberhasilan yang dikarang.
- Visual mengikuti DESIGN.md: monokrom, kartu 28px, pill, entrance stagger, reduced motion, dan dark mode tanpa flash.

## API

- GET /api/meta - marketplace, jenis biaya, tiga jenis dokumen, 12 data kesiapan, status kasus, masalah, sumber, jadwal, dan tarif default.
- GET /api/example - contoh isian dengan periode bulan sebelumnya.
- POST /api/analyze - body: platform, period, invoice_received, includes_ppn, ppn_rate, fees, evidence.
- POST /api/readiness - body: items berisi id data yang sudah siap.
- POST /api/letter - body: data toko, penjual, NPWP, kontak, tiket, masalah, kronologi, fees, period.
- GET /api/cases - daftar periode, jumlah terbuka, faktur belum ada, sudah dilaporkan, total biaya, total PPN, dan tenggat lapor terdekat.
- POST /api/cases - tambah catatan periode.
- PATCH /api/cases/:id - ubah status atau tanggal faktur diterima.
- DELETE /api/cases/:id - hapus catatan.
- POST /api/seed - muat 3 contoh periode.
- GET /api/export - unduh CSV.

Contoh:

```
curl -s -X POST http://localhost:8044/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"platform":"shopee","period":"2026-10","invoice_received":"tidak","includes_ppn":"tidak","ppn_rate":11,"fees":{"layanan":1250000,"affiliate":350000,"iklan":600000,"promo":0,"logistik":0},"evidence":["nama","nik_npwp","alamat","email","cocok"]}'
```

Hasil pada 13 November 2026: fase cek, faktur tersedia 12 November 2026, batas lapor 15 November 2026, total biaya Rp 2.200.000, estimasi PPN Rp 242.000, kesiapan data 42%.

## Test

```
npm test
```

37 test Node tanpa framework tambahan: batas bulan dan tahun kabisat, lima fase jadwal pada tanggal batas, PPN termasuk dan belum termasuk PPN, tarif yang bisa diubah, validasi periode dan tarif, kesiapan data kritis, validasi kasus, peringatan tenggat, ringkasan, isi surat, format Indonesia, dan tidak adanya em dash.

## Sumber utama

- IKPI, 27 Oktober 2026: Shopee menerbitkan faktur pajak secara bertahap mulai November 2026 untuk biaya layanan, komisi affiliate, dan pembelian saldo iklan. Data diri dan informasi penagihan wajib benar. Permohonan manual paling lambat tanggal 30 atau 31. Jika faktur belum tersedia sampai tanggal 12 bulan berikutnya, hubungi CS paling lambat tanggal 15.
- DDTCNews, 28 Oktober 2026: konfirmasi cakupan biaya dan aturan bahwa faktur yang sudah terbit tidak diperbarui otomatis bila data diubah setelah periode berakhir.
- Bisa Pajak, 29 Oktober 2026: faktur pajak biaya layanan berbeda dari bukti pemungutan PPh Pasal 22 atas penjualan. Ketepatan data penting bagi PKP untuk Pajak Masukan.
- DJP, 1 Oktober 2026: empat marketplace pemungut PPh 22 (Shopee, Tokopedia, Blibli, Lazada), tarif 0,5% dari peredaran bruto tidak termasuk PPN dan PPnBM, dapat dikreditkan.
- DJP, 6 Januari 2025: PMK 131/2024, tarif PPN 12% dengan DPP nilai lain 11/12 menghasilkan tarif efektif 11% untuk non-mewah.
- Bisnis.com, 11 Oktober 2026: pelaporan perdana PPh 22 lokapasar disiapkan 1 November 2026 dan akan dievaluasi, sehingga jadwal per platform masih bisa berubah.

## Catatan

Tool ini bukan nasihat pajak. Jadwal dan cakupan faktur mengikuti pengumuman Shopee yang dikutip pada 27 sampai 29 Oktober 2026. Platform lain belum tentu memakai jadwal yang sama. Selalu cek Seller Center dan konsultasikan dengan konsultan pajak untuk kredit Pajak Masukan. Jangan membagikan NPWP, OTP, password, atau kode verifikasi kepada pihak yang tidak berwenang.
