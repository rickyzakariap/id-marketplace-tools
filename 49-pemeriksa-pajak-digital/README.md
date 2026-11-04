# Pemeriksa Pajak Digital

Alat bantu untuk memisahkan PPN SPP-TDLN pada transaksi digital luar negeri dari PPh 22 final marketplace. Hitung perkiraan PPN, cek potensi pungutan ganda, susun bukti, catat kasus, dan buat surat.

## Run

```bash
cd 49-pemeriksa-pajak-digital
npm install
npm start
```

Buka `http://localhost:8049`.

Data kasus disimpan di `data/cases.json` dan tidak masuk git.

## Fitur

- Membedakan transaksi digital luar negeri, transfer atau remitansi, dan penjualan marketplace dalam negeri.
- Menghitung perkiraan PPN dengan tarif awal 11% yang dapat diubah, termasuk opsi nominal sudah termasuk PPN.
- Menandai tiga kondisi: PPN sudah dipungut PMSE, berpotensi dipungut SPP-TDLN, atau masih perlu dicek.
- Memisahkan PPN yang sudah atau akan dipungut dari PPN potensial yang belum jelas.
- Menghitung PPN setahun, kredit pajak bila PKP, dan biaya bila belum PKP.
- Menilai kesiapan 10 bukti dengan empat bukti kritis.
- Membuat tiga surat: permintaan rincian, konfirmasi transfer bukan objek, dan koreksi pungutan ganda.
- Mencatat kasus per toko dan periode, peringatan umur kasus, ekspor CSV, dan muat ulang kasus.
- Menampilkan sumber DJP, PMK 131/2024, dan pemberitaan 9 November 2026.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/meta` | Opsi kategori, bukti, status, sumber, dan kebijakan |
| GET | `/api/example` | Contoh transaksi yang bisa langsung dihitung |
| POST | `/api/analyze` | Validasi dan hitung perkiraan PPN |
| POST | `/api/readiness` | Nilai kesiapan bukti |
| POST | `/api/letter` | Susun surat dalam teks biasa |
| GET | `/api/cases` | Ringkasan kasus dan peringatan |
| POST | `/api/cases` | Simpan kasus baru |
| PATCH | `/api/cases/:id` | Ubah status atau isi kasus |
| DELETE | `/api/cases/:id` | Hapus kasus |
| GET | `/api/export` | Unduh kasus sebagai CSV |

Contoh analisis:

```bash
curl -s http://localhost:8049/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Toko Uji",
    "period_start": "2026-10-01",
    "period_end": "2026-10-31",
    "rate": 11,
    "months_per_year": 12,
    "pkp": "tidak",
    "items": [{
      "label": "Iklan digital",
      "category": "iklan",
      "amount": 500000,
      "includes_ppn": "tidak",
      "provider_ppn": "belum",
      "payment_issuer": "ya"
    }]
  }'
```

## Test

```bash
npm test
```

50 unit test mencakup validasi input, klasifikasi transaksi, perhitungan PPN, kredit pajak, kesiapan bukti, surat, kasus, ringkasan, contoh, metadata, dan pemeriksaan halaman statis.

## Batas

- Hasil adalah perkiraan dari input, bukan ketetapan pajak.
- Tarif awal 11% mengacu pada tarif efektif PPN non-mewah menurut PMK 131/2024. Tarif dapat berubah dan harus dicocokkan dengan invoice.
- Status PMSE penyedia dan status kanal SPP-TDLN harus dikonfirmasi. Tool ini tidak memiliki akses ke data DJP atau bank.
- Transfer atau remitansi pribadi tidak otomatis menjadi objek PPN.
- Penjualan di marketplace dalam negeri bukan objek SPP-TDLN. PPh 22 final 0,5% adalah jalur terpisah dan tidak dihitung di sini.
- Kredit pajak hanya relevan bila Anda PKP dan dokumennya sah.

## Sumber

- DJP melalui Ortax, 3 November 2026: `https://ortax.org/ramai-isu-ppn-atas-semua-transaksi-digital-begini-penjelasan-djp`
- UKMINDONESIA.ID, 3 November 2026: `https://ukmindonesia.id/baca-deskripsi-posts/pajak-digital-9-november-2026-apa-artinya-bagi-umkm-dan-penjual-online`
- Suluh Sumatera, 2 November 2026: `https://www.suluhsumatera.co.id/2026/11/9-november-pajak-digital-akan-berlaku.html`
- DJP, 6 Januari 2025: `https://pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas`
