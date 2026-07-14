# Marketplace Project Lessons

> File ini dibaca SETIAP SEBELUM mulai project baru. Jangan repeat mistake yang sama.

---

## 2026-07-14 - Marketplace Fee Calculator CLI
- Yang berhasil: Zero dependency, pure Node.js, output CLI yang rapi
- Yang berhasil: Mode compare bisa bandingin profit dari semua marketplace sekaligus
- Yang berhasil: Struktur fee berdasarkan data marketplace asli
- Yang gagal: Ga ada masalah berat - project pertama, jadi baseline
- Feedback user: N/A (project pertama)
- Perbaikan berikutnya: Tambahin mode interaktif (prompt-based input)

## 2026-07-14 - Listing SEO Analyzer
- Yang berhasil: Web UI dark theme - UX lebih bagus dari CLI untuk visualisasi data
- Yang berhasil: Score bar dengan warna (hijau/kuning/merah) bikin hasil gampang dibaca
- Yang berhasil: Limit per-platform (judul Tokopedia beda panjangnya sama Shopee)
- Yang berhasil: Deteksi power words keyword marketplace Indonesia
- Yang berhasil: Analisa harga psikologis (X999, goceng pricing) - fitur unik
- Yang gagal: Analisa keyword density masih basic - belum handle sinonim atau stemming
- Yang gagal: Belum ada data marketplace asli - analisa masih pakai heuristik
- Feedback user: N/A (self-built)
- Perbaikan berikutnya: Tambahin deteksi sinonim sederhana untuk bahasa Indonesia

## 2026-07-14 - Listing SEO Analyzer (fixes)
- Yang gagal: Button Analisa stuck karena ID mismatch (`descError` vs `descriptionError`)
- Yang gagal: Saran harga kontradiktif (20000 disuruh pakai 19999, tapi juga disuruh bulatkan ke 5000)
- Fix: Rename ID ke konsisten, logic saran harga cek X999 dulu sebelum suggest rounding
- Lesson: WAJIB QA di browser, jangan cuma backend tests. ID mismatch = silent crash.
- Lesson: clearErrors() harus handle semua ID dengan konsisten, jangan campur singkatan.
- Yang gagal: Harga 11999 (sudah X999) tetap disuruh "bulatkan ke Rp 5.000" karena Goceng check jalan terpisah
- Fix: Skip Goceng tip kalau sudah X999, naikkan score dari 60 ke 80
- Lesson: Jangan kasih saran yang kontradiktif. Kalau harga sudah X999, jangan suruh bulatkan ke 5000.
