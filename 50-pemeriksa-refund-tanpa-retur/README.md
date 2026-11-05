# Pemeriksa Refund Tanpa Retur

Alat bantu untuk menghitung kerugian ketika marketplace mencairkan refund padahal barang tidak kembali, kembali kosong, atau kembali dalam kondisi tidak layak. Ukur indikasi masalah proses, susun bukti, catat kasus, dan buat surat.

## Run

```bash
cd 50-pemeriksa-refund-tanpa-retur
npm install
npm start
```

Buka `http://localhost:8050`.

Data kasus disimpan di `data/cases.json` dan tidak masuk git.

## Fitur

- Menghitung profit normal, kas setelah refund, kerugian profit, kerugian kas, dan persentase kerugian.
- Memisahkan kerugian barang yang tidak kembali dari kerugian biaya kirim retur.
- Menghitung jumlah penjualan normal yang dibutuhkan untuk menutup kerugian kas.
- Mengklasifikasikan kondisi barang: tidak kembali, kosong atau isi tidak sesuai, barang berbeda, sudah dipakai, rusak, atau kembali utuh.
- Memberi sinyal proses: resi retur, refund sebelum barang kembali, kemasan retur, toko dibatasi, banding ditolak, akun pembeli, refund berulang, keluhan tersembunyi, refund penuh, dan nilai tinggi.
- Menilai kesiapan 13 bukti dengan lima bukti kritis.
- Membuat tiga surat: permintaan rincian refund dan retur, permintaan barang kembali atau pembatalan refund, dan eskalasi ke lembaga perlindungan konsumen.
- Mencatat kasus per toko, memberi peringatan umur kasus, memuat ulang kasus, dan mengekspor CSV.
- Menampilkan sumber keluhan publik sebagai konteks, bukan putusan resmi.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/meta` | Opsi kondisi barang, resi, bukti, status, sumber, dan kebijakan |
| GET | `/api/example` | Contoh kasus yang bisa langsung dihitung |
| POST | `/api/analyze` | Validasi dan hitung kerugian serta sinyal proses |
| POST | `/api/readiness` | Nilai kesiapan bukti |
| POST | `/api/letter` | Susun surat dalam teks biasa |
| GET | `/api/cases` | Ringkasan kasus dan peringatan |
| POST | `/api/cases` | Simpan kasus baru |
| PATCH | `/api/cases/:id` | Ubah status atau isi kasus |
| DELETE | `/api/cases/:id` | Hapus kasus |
| POST | `/api/seed` | Simpan satu kasus contoh |
| GET | `/api/export` | Unduh kasus sebagai CSV |

Contoh analisis:

```bash
curl -s http://localhost:8050/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Toko Uji",
    "platform": "shopee",
    "order_ref": "UJI-001",
    "case_date": "2026-11-01",
    "order_value": 3497000,
    "product_cost": 2600000,
    "shipping_cost": 65000,
    "packaging_cost": 8000,
    "return_shipping_cost": 120000,
    "refund_amount": 3497000,
    "recovered_value": 500000,
    "goods_status": "rusak",
    "return_tracking": "ada",
    "return_packaging": "tidak_layak",
    "appeal_status": "ditolak"
  }'
```

## Test

```bash
npm test
```

28 unit test mencakup validasi input, perhitungan kerugian, klasifikasi barang, sinyal proses, kesiapan bukti, surat, ringkasan kasus, ekspor CSV, contoh, metadata, dan pemeriksaan halaman statis.

## Batas

- Hasil adalah perkiraan dari input penjual, bukan penetapan kerugian oleh platform atau pengadilan.
- Tidak ada tarif resmi, SLA, atau tenggat platform yang dipakai. Semua nominal berasal dari input dan fakta kasus yang dikutip.
- Status retur, resi, dan hasil banding harus dicocokkan dengan data resmi di pusat resolusi masing-masing marketplace.
- Sumber adalah keluhan publik dan pemberitaan, bukan putusan resmi. Gunakan sebagai konteks, bukan bukti hukum.
- Kelengkapan bukti tidak menjamin refund dibatalkan. Tool ini membantu menyusun permintaan peninjauan yang lebih rinci.
- Ambang nilai tinggi Rp1.000.000 adalah penanda perhatian internal, bukan aturan platform.

## Sumber

- Media Konsumen, 5 November 2026: `https://mediakonsumen.com/2026/11/05/surat-pembaca/shopee-menolak-banding-penjual-atas-kerusakan-produk-saat-pengembalian-bukti-yang-diajukan-tidak-dipertimbangkan`
- Media Konsumen, 23 Juli 2026: `https://mediakonsumen.com/2026/07/23/surat-pembaca/toko-star-seller-shopee-saya-diblokir-pembeli-bisa-klaim-dana-tanpa-kembalikan-barang`
- Media Konsumen, 7 Juli 2026: `https://mediakonsumen.com/2026/07/07/surat-pembaca/shopee-menolak-banding-penjual-atas-barang-retur-kosong-tanpa-ada-pertanggungjawaban-secara-adil`
- Media Konsumen, 30 Juli 2026: `https://mediakonsumen.com/2026/07/30/surat-pembaca/kurir-tidak-menjemput-paket-retur-salah-kirim-shopee-batalkan-retur-secara-sepihak-tanpa-pengembalian-dana`
- Media Konsumen, 6 Desember 2025: `https://mediakonsumen.com/2025/12/06/surat-pembaca/bug-tokopedia-rugikan-seller-refund-otomatis-tanpa-retur-barang-kerugian-capai-rp1-juta`
- Media Konsumen, 28 November 2025: `https://mediakonsumen.com/2025/11/28/surat-pembaca/dana-refund-dicairkan-tanpa-retur-barang-penjual-tokopedia-dirugikan`
- Media Konsumen, 4 November 2025: `https://mediakonsumen.com/2025/11/04/surat-pembaca/tiktok-shop-by-tokopedia-merugikan-seller-pembeli-bisa-klaim-refund-tanpa-bukti-jelas-dan-otomatis-menang`
