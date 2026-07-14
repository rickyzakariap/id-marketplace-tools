# Catatan Perbaikan Project

> Baca file ini SEBELUM mulai project baru. Jangan ulangi kesalahan yang sama.

---

## 2026-07-14 - Marketplace Fee Calculator CLI
- Berhasil: Tanpa dependency, murni Node.js, output CLI yang rapi
- Berhasil: Mode perbandingan bisa adu profit dari semua marketplace sekaligus
- Berhasil: Struktur fee berdasarkan data marketplace asli
- Bermasalah: Tidak ada kendala berat - project pertama, jadi patokan awal
- Umpan balik: Belum ada (project pertama)
- Rencana perbaikan: Tambahkan mode interaktif (input berbasis prompt)

## 2026-07-14 - Listing SEO Analyzer
- Berhasil: Web UI dark theme - pengalaman pengguna lebih baik dari CLI untuk visualisasi data
- Berhasil: Batang skor dengan warna (hijau/kuning/merah) bikin hasil gampang dibaca
- Berhasil: Batas per-platform (judul Tokopedia beda panjangnya dari Shopee)
- Berhasil: Deteksi kata kunci power words marketplace Indonesia
- Berhasil: Analisis harga psikologis (X999, harga goceng) - fitur unik
- Bermasalah: Analisis kepadatan kata kunci masih dasar - belum bisa handle sinonim atau stemming
- Bermasalah: Belum ada data marketplace asli - analisis masih pakai perkiraan
- Umpan balik: Belum ada (dibuat sendiri)
- Rencana perbaikan: Tambahkan deteksi sinonim sederhana untuk bahasa Indonesia

## 2026-07-14 - Listing SEO Analyzer (perbaikan)
- Bermasalah: Tombol Analisa macet karena ID tidak cocok (`descError` vs `descriptionError`)
- Bermasalah: Saran harga bertentangan (20000 disuruh pakai 19999, tapi juga disuruh bulatkan ke 5000)
- Perbaikan: Samakan ID, logika saran harga cek X999 dulu sebelum sarankan pembulatan
- Pelajaran: WAJIB cek di browser, jangan cuma andalkan tes backend. ID tidak cocok = crash diam-diam.
- Pelajaran: clearErrors() harus menangani semua ID secara konsisten, jangan pakai singkatan.
- Bermasalah: Harga 11999 (sudah X999) tetap disuruh "bulatkan ke Rp 5.000" karena pemeriksaan Goceng berjalan terpisah
- Perbaikan: Lewati saran Goceng kalau sudah X999, naikkan skor dari 60 ke 80
- Pelajaran: Jangan beri saran yang bertentangan. Kalau harga sudah X999, jangan suruh bulatkan ke 5000.
