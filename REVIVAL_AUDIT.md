# REVIVAL_AUDIT.md — Audit & Revival id-marketplace-tools

> Tanggal audit: 2026-10-19
> Auditor: coding agent (branch `main`)
> Basis: source code aktual + pengujian runtime, **bukan** klaim README.

---

## 1. Ringkasan Eksekutif

- 35 project terdaftar. 22 tool berbasis server (Node/Python) **berhasil dijalankan** dan merespons HTTP 200 pada smoke test.
- 10 tool Go **tidak dapat diverifikasi** karena toolchain Go tidak terpasang di lingkungan ini (`go: command not found`).
- 1 tool (05-review-extension/backend) membutuhkan kredensial Supabase (env) sehingga tidak bisa dijalankan lokal tanpa secret milik pengguna.
- Cakupan test sangat rendah: hanya 2 tool punya test sebelum audit (02, 20). Setelah audit dan perbaikan B7 menjadi 5 (02, 20, 06, 23, 34).
- Ditemukan beberapa bug finansial nyata. Yang paling berdampak & dapat diperbaiki lokal: **06-dropship-calculator** menghitung `profit` tanpa mengurangi ongkir yang ditanggung seller, dan `break_even` tidak menutup admin fee. Bug ini sudah **diperbaiki + diberi test**.

---

## 2. Metodologi & Bukti Pengujian

Lingkungan:

```
node v22.23.0 | npm 10.9.8 | python3 3.12.3 | go: NOT INSTALLED
```

Yang dijalankan:

1. `git status`, struktur direktori, `package.json`/`go.mod` tiap tool.
2. `npm install` untuk 12 tool Node (berhasil semua).
3. Smoke test HTTP: start tiap server Node/Python lalu curl endpoint utama → **semua 200** (lihat daftar di §4).
4. `node test/test.js` (20) → 31 passed, 0 failed.
5. `node test.js` pada 02 (server hidup) → semua lulus.
6. Probe POST endpoint finansial dengan payload nyata + verifikasi angka manual (01, 02, 03, 11, 13, 16, 23, 26, 28, 32, 35).
7. `python3 -m unittest` untuk test baru 06 → 9 passed.
8. Verifikasi langsung fungsi Python (`import` modul) untuk membuktikan bug sebelum/sesudah fix.

Catatan: `git config user.name` kosong di repo; commit akan memakai env git identity. gh CLI sudah login sebagai `rickyzakariap` (scopes repo/workflow).

---

## 3. Temuan Bug (terverifikasi)

| # | Tool | Bug | Bukti | Severity | Status |
|---|------|-----|-------|----------|--------|
| B1 | **06-dropship** | `profit` tidak mengurangi ongkir yang ditanggung seller; nilai profit identik untuk berat 0.3kg vs 5kg dan free-ongkir on/off. `break_even` juga tidak menutup `admin_fee` → harga rekomendasi masih rugi. | Sebelum fix: profit `61625` untuk semua berat & toggle; pada `break_even=106383` profit `-1000`. `server.py:118-126` | **P0** | ✅ FIXED + test |
| B2 | **03-sentiment** | Pencocokan kata kunci memakai substring: `"ok"` cocok pada `"toko"`. Negation flip salah. | `"Stok barang di toko kosong"` → **positive +1.0**; `"Pelayanan bagus, tidak ada keluhan"` → **negative -0.7**. `analyze.py:175,179,204` | P1 | Belum |
| B3 | **09-profit-tracker** | `platform_fee`, `shipping_cost`, `other_fees` dikali `qty`, padahal label UI "Biaya platform **per transaksi**" → fee bisa overstate. | `server.py:343` (`(t.platform_fee * t.qty)` dst). Perlu klarifikasi semantik transaksi vs item. | P1 | Belum |
| B4 | **27-tiktok-komisi** | Shopee Group A `rate_min: null`; frontend cek `!== undefined` → tampil `"null-null%"`. | `index.html:396` vs `:299`. | P1 | Belum |
| B5 | **01-fee-calculator** | `profitMargin` dihitung `grossProfit / cost` (identik dengan `roi`), bukan `profit / price`. Field tidak ditampilkan saat ini, jadi latent. | `index.js:210-211`. | P2 | Belum |
| B6 | **11-shipping** | Faktor zona diterapkan **dua kali** (zoneMultiplier courier × zoneFactor) untuk rute antar-zona → biaya bisa overestimate. | `server.js:152-157`. | P2 | Belum |
| B7 | **23 vs 34** | Status regulasi biaya layanan 50% tidak konsisten dan keduanya usang: 23 (date-based) → `active`, 34 (hardcoded) → `tahapan-final`. Per 21 Okt 2026 keduanya belum menyebut tanggal resmi 25 Okt 2026. | `/api/status` 23 vs 34; dibandingkan dengan ANTARA/Bisnis 16-17 Okt 2026. | P1 | ✅ FIXED + test |
| B8 | **33-kanal-sendiri** | `round2` pakai `int64(v*100+0.5)` salah untuk bilangan negatif. | `server.go` (static). | P2 | Belum |

---

## 4. Status per Tool

Keterangan: ✅ terverifikasi jalan · ⚠️ jalan tapi ada cacat · 🔒 butuh env/secret · ❔ tidak bisa diverifikasi (Go tidak ada) · 🧪 punya test

| # | Tool | Stack | Bukti | Status |
|---|------|-------|-------|--------|
| 01 | marketplace-fee-calculator | Node CLI | CLI compare/ single jalan | ⚠️ B5, tanpa test |
| 02 | listing-seo-analyzer | Node+Express | HTTP 200; `test.js` lulus (grade A/B/D) | ✅🧪 |
| 03 | review-sentiment-analyzer | Node+Express | HTTP 200; bug B2 | ⚠️ tanpa test (`npm test` exit 1) |
| 04 | fee-breakdown-calculator | Python CLI | `--help` & kalkulasi jalan | ✅ tanpa test |
| 05 | review-extension | Chrome MV3 + Express + Supabase | Backend error `supabaseUrl is required` tanpa env | 🔒 |
| 06 | dropship-calculator | Python stdlib | HTTP 200; **fix + 9 test lulus** | ✅🧪 |
| 07 | listing-description-generator | Go | Go tidak tersedia | ❔ |
| 08 | komplain-response-generator | Python stdlib | HTTP 200 | ✅ tanpa test |
| 09 | profit-tracker | Python stdlib | HTTP 200; bug B3 | ⚠️ tanpa test |
| 10 | stock-alert-dashboard | Go | Go tidak tersedia | ❔ |
| 11 | shipping-cost-estimator | Node+Express | HTTP 200; bug B6 | ⚠️ tanpa test |
| 12 | supplier-scorer | Go | Go tidak tersedia | ❔ |
| 13 | competitor-price-monitor | Node+Express | HTTP 200 (`/api/products`, `/api/stats`) | ✅ tanpa test |
| 14 | promo-cost-calculator | Go | Go tidak tersedia | ❔ |
| 15 | keyword-research-tool | Python stdlib | HTTP 200 | ✅ tanpa test |
| 16 | listing-consistency-checker | Node+Express | HTTP 200 (`/api/check` jalankan skor) | ✅ tanpa test |
| 17 | price-optimizer | Go | Go tidak tersedia | ❔ |
| 18 | image-optimizer | Python stdlib | HTTP 200 | ✅ tanpa test |
| 19 | komplain-tracker | Go | Go tidak tersedia | ❔ |
| 20 | stock-sync-checker | Chrome MV3 | `node test/test.js` → 31 passed | ✅🧪 |
| 21 | harbolnas-calendar | Python stdlib | HTTP 200 | ✅ tanpa test |
| 22 | pph22-tax-calculator | Go | Go tidak tersedia | ❔ |
| 23 | umkm-service-fee-checker | Node+Express | HTTP 200; B7 fixed; 13 test lulus | ✅🧪 |
| 24 | nib-deadline-checker | Python stdlib | HTTP 200 | ✅ tanpa test |
| 25 | pph22-refund-tracker | Go | Go tidak tersedia | ❔ |
| 26 | omzet-gabungan-tracker | Node+Express | HTTP 200 (`/api/status` & `/api/analyze`) | ✅ tanpa test |
| 27 | tiktok-komisi-calculator | Python stdlib | HTTP 200; bug B4 | ⚠️ tanpa test |
| 28 | toco-migration-calculator | Node+Express | HTTP 200; matematika profit/margin benar | ✅ tanpa test |
| 29 | dana-tertahan-tracker | Node+Express | HTTP 200 | ✅ tanpa test |
| 30 | hak-tolak-seller | Go | Go tidak tersedia | ❔ |
| 31 | biaya-retur-tracker | Python stdlib | HTTP 200 | ✅ tanpa test |
| 32 | fmcg-trend-analyzer | Node+Express | HTTP 200 | ✅ tanpa test |
| 33 | kanal-sendiri-vs-marketplace | Go | Go tidak tersedia; bug B8 (static) | ❔ |
| 34 | insentif-permen-2026 | Python stdlib | HTTP 200; B7 fixed; 14 test lulus | ✅🧪 |
| 35 | program-diskon-checker | Node+Express | HTTP 200; buffer 62.500 sesuai contoh README (terverifikasi) | ✅ tanpa test |

Ringkasan: 22 server Node/Python terverifikasi hidup, 1 CLI Node + 2 CLI Python jalan, 10 Go tidak terverifikasi, 1 butuh secret.

---

## 5. Prioritas

### P0 (blocker kepercayaan finansial)
- **B1 — 06-dropship** profit mengabaikan ongkir seller & break-even tidak menutup admin fee. → **sudah diperbaiki**.

### P1 (cacat kebenaran yang terlihat pengguna)
- B2 — 03 sentiment salah klasifikasi (substring + negation).
- B3 — 09 profit-tracker fee ×qty (perlu konfirmasi semantik).
- B4 — 27 tampilan `null-null%`.
- B7 — 23 vs 34 status regulasi biaya layanan tidak konsisten (data regulasi perlu diselaraskan & diberi sumber; jangan mengarang tarif). → **sudah diperbaiki 2026-10-21**, lihat §8.
- Tambah test untuk semua tool tanpa test (prioritas yang menghasilkan uang: 01, 04, 09, 11, 26, 27, 28, 35).

### P2 (kebersihan & akurasi sekunder)
- B5 — 01 `profitMargin` salah rumus.
- B6 — 11 double zone multiplier.
- B8 — 33 `round2` negatif.
- Verifikasi/build tool Go (butuh memasang toolchain Go 1.26).

---

## 6. Perbaikan yang Dikerjakan (P0 — B1)

File: `06-dropship-calculator/server.py`

Perubahan:
1. `shipping_cost` dibulatkan ke integer.
2. `profit = net_revenue - supplier_cost - shipping_subsidy` (ongkir yang ditanggung seller kini mengurangi profit).
3. `break_even = (supplier_cost + admin_fee + shipping_subsidy) / (1 - total_fee_rate)` agar harga impas benar-benar menutup semua biaya.

Test baru: `06-dropship-calculator/test_server.py` (9 test, `python3 -m unittest`) mencakup: komponen fee, pengurangan subsidi ongkir, pengaruh berat, cap subsidi, break-even = 0 profit, dan rekomendasi harga tetap untung.

Bukti sesudah fix (API `/api/calculate`, Tokopedia electronics, jual 225.000, modal 150.000):

| Berat | free_ongkir | shipping_subsidy | profit (sebelum → sesudah) | break_even (sebelum → sesudah) |
|-------|-------------|------------------|----------------------------|-------------------------------|
| 0.3kg | on | 8.000 | 61.625 → **53.625** | 158.730 → **168.254** |
| 5.0kg | on | 20.000 (cap) | 61.625 → **41.625** | 158.730 → **180.952** |

README tool diperbarui (fitur + section Tests).

---

## 7. Batasan Audit
- Tool Go tidak di-compile/test (tidak ada `go`); temuan Go bersifat statis.
- Angka fee marketplace adalah estimasi 2026 dan dapat berubah; tidak ada tarif baru yang dikarang dalam audit ini.
- 05 tidak diuji runtime karena butuh kredensial Supabase pengguna (tidak diakses sesuai aturan).

---

## 8. Perbaikan 2026-10-21 (B7)

Sumber baru: ANTARA 16-17 Oktober 2026, Bisnis.com 17 Oktober 2026, Kompas.com 7 Oktober 2026. Kebijakan diskon 50% dipastikan berlaku efektif **25 Oktober 2026** dengan dasar **Kepmen UMKM 398/2026**.

Yang diperbaiki:

1. **#23** status date-aware: `terjadwal` sebelum 25 Oktober 2026 (menampilkan sisa hari), `aktif` setelahnya. Deskripsi menyebut Kepmen 398/2026, verifikasi platform maksimal 10 hari kalender, dan insentif paling lambat 5 hari setelah dua tahap verifikasi.
2. **#34** status diubah dari hardcoded `tahapan-final` (29 Agustus 2026) menjadi date-aware dengan tanggal resmi 25 Oktober 2026, timeline Kepmen 398/2026, dan SLA verifikasi yang sama.
3. **Tarif diselaraskan**: #23 sebelumnya memakai 1-2% dan #34 memakai 5-12%. Keduanya kini memakai estimasi 10-18% (ANTARA 8 Juli 2026) dengan angka per marketplace yang sama, ditandai sebagai estimasi yang bisa diedit.
4. **Syarat diselaraskan**: #23 menambahkan syarat rekam jejak usaha bersih (tidak memanipulasi transaksi, tidak menyalahgunakan fasilitas, bukan pengguna berisiko tinggi), sesuai Kepmen 398/2026.
5. **Test baru**: `23-umkm-service-fee-checker/test/checker.test.js` (13 test) dan `34-insentif-permen-2026/test_server.py` (14 test). Keduanya mengunci tanggal berlaku, status date-aware, tarif, kelayakan, pengecualian, matematika penghematan, dan surat.
6. **README** kedua tool diperbarui dengan status, sumber, dan cara test.

Verifikasi runtime: kedua server dijalankan lalu `GET /api/status`, `GET /api/marketplaces`, `POST /api/check`, `POST /api/letter` (#34), dan halaman statis di-curl. Semua 200; input tidak valid 400.
