# Cek Insentif Permen UMKM 3/2026

Verifikator kelayakan diskon 50% biaya layanan marketplace untuk usaha mikro dan kecil, berdasarkan teks resmi Permen UMKM Nomor 3 Tahun 2026 dan Kepmen UMKM Nomor 398 Tahun 2026.

## Run

```bash
python3 server.py
```

Buka http://localhost:8034

## Fitur

- Kuis kelayakan 7 syarat + 2 pengecualian kategori (pangan olahan siap saji, elektronik industri besar) dengan verdict layak / hampir layak / tidak layak
- Syarat rekam jejak usaha: tidak memanipulasi transaksi, tidak menyalahgunakan fasilitas platform, bukan pengguna berisiko tinggi
- Kalkulator penghematan per marketplace (biaya layanan = administrasi + komisi + jasa aplikasi, kisaran 10-18%)
- Alur pengajuan resmi 2 tahap verifikasi via SAPA UMKM (KemenUMKM lalu platform), platform verifikasi maksimal 10 hari kalender, insentif paling lambat 5 hari setelah lolos
- Generator surat keberatan saat marketplace menolak atau menghentikan insentif
- Status date-aware: hitung hari sebelum 25 Oktober 2026, aktif setelahnya

## API

- `GET /api/status` - status kebijakan, timeline, tanggal berlaku, SLA verifikasi
- `GET /api/marketplaces` - daftar marketplace + default rate
- `POST /api/check` - cek kelayakan + hitung penghematan
- `POST /api/letter` - generate surat keberatan

## Test

```bash
python3 -m unittest -v test_server.py
```

14 unit test: status sebelum/pada tanggal berlaku, timeline, sumber, 6 cabang kelayakan, matematika penghematan, validasi, dan surat.

## Notes

- Tarif default estimasi 2026, sesuaikan dengan seller center
- Insentif berlaku efektif 25 Oktober 2026 (Kepmen UMKM 398/2026). Sekitar 42.000 seller produk lokal sudah teridentifikasi, insentif untuk UMK dengan omzet maksimal Rp 15 miliar per tahun
- Platform wajib lapor realisasi insentif bulanan ke SAPA UMKM; seller penerima insentif lapor omzet setiap 3 bulan
- Grace period 6 bulan untuk standar produk (sertifikasi halal, BPOM)
- Sumber: Permen UMKM 3/2026; Kepmen UMKM 398/2026; ANTARA 16-17 Oktober 2026; Bisnis.com 17 Oktober 2026; Kompas.com 7 Oktober 2026
