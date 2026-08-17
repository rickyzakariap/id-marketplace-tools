#!/usr/bin/env python3
"""NIB Deadline Checker - cek tenggat kewajiban NIB (Permendag 19/2026).

Permendag 19/2026 (PMSE) berlaku sejak 8 Juni 2026. Semua pedagang di
e-commerce wajib punya NIB. Marketplace wajib menolak pedagang tanpa NIB.
Masa tenggang: 18 bulan untuk pedagang existing, 6 bulan untuk pedagang baru.
"""

import calendar
import json
import http.server
import socketserver
from datetime import date

PORT = 8024

# Permendag 19/2026 tentang PMSE, berlaku 8 Juni 2026
EFFECTIVE = date(2026, 6, 8)
MONTHS_EXISTING = 18
MONTHS_NEW = 6

POLICY = {
    "status": "active",
    "label": "Berlaku sejak 8 Juni 2026",
    "description": "Permendag 19/2026 (PMSE) mewajibkan semua pedagang di e-commerce memiliki NIB. Marketplace wajib menolak pendaftaran pedagang tanpa NIB. Masa tenggang: 18 bulan untuk pedagang yang sudah berjualan, 6 bulan untuk pedagang baru.",
    "regulation": "Permendag 19/2026 tentang Penyelenggaraan Usaha Perdagangan Melalui Sistem Elektronik (PMSE)",
    "key_date": "2026-06-08",
    "key_desc": "Aturan mulai berlaku",
    "note": "NIB adalah legalitas usaha, bukan pajak. Pembuatan NIB gratis via OSS."
}

# Langkah buat NIB via OSS (dari artikel detikFinance)
OSS_STEPS = [
    "Download aplikasi OSS, login dengan akun UMK",
    "Pilih menu Kelola NIB, lalu Tambah Bidang Usaha",
    "Lengkapi jenis usaha, bidang usaha, ruang lingkup usaha, pilih KBLI yang sesuai",
    "Lengkapi data luas lahan, satuan, dan moda usaha, lalu Validasi Risiko",
    "Lengkapi data Perizinan Usaha dan Lokasi Usaha",
    "Tambah Produk atau Jasa, lengkapi datanya, lalu Simpan",
    "NIB terbit, simpan file-nya untuk pendaftaran/verifikasi di marketplace"
]

# Dokumen/data yang perlu disiapkan sebelum buat NIB
CHECKLIST = [
    {"id": "ktp", "label": "KTP pemilik usaha", "detail": "Data diri yang terdaftar di Dukcapil"},
    {"id": "email", "label": "Email aktif", "detail": "Dipakai untuk akun OSS dan menerima NIB"},
    {"id": "nohp", "label": "Nomor HP aktif", "detail": "Untuk verifikasi OTP saat pendaftaran"},
    {"id": "usaha", "label": "Data usaha", "detail": "Nama usaha, alamat, bidang usaha (KBLI)"},
    {"id": "npwp", "label": "NPWP (jika ada)", "detail": "Tidak wajib untuk NIB, tapi membantu verifikasi"},
    {"id": "produk", "label": "Daftar produk/jasa", "detail": "Produk yang dijual, untuk diisi di OSS"}
]

BENEFITS = [
    {"title": "Legalitas dan kepercayaan", "detail": "Identitas resmi yang meningkatkan kepercayaan pembeli, mitra, dan investor"},
    {"title": "Aman berjualan di marketplace", "detail": "Tanpa NIB, marketplace bisa menolak atau memblokir toko"},
    {"title": "Akses pembiayaan", "detail": "NIB umum dipersyaratkan untuk pinjaman bank, bantuan pemerintah, pelatihan"},
    {"title": "Pengembangan usaha", "detail": "Fondasi untuk izin lanjutan, sertifikasi, kemitraan, dan ekspor"},
    {"title": "Daya saing produk lokal", "detail": "Lebih mudah ikut program promosi dan pengadaan barang/jasa"}
]


def add_months(d, months):
    """Return date d + months, clamping day to month length."""
    m = d.month - 1 + months
    year = d.year + m // 12
    month = m % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def compute_deadline(start_date):
    """Deadline NIB: existing seller 18 bulan dari aturan berlaku, baru 6 bulan dari mulai jualan."""
    if start_date < EFFECTIVE:
        return add_months(EFFECTIVE, MONTHS_EXISTING), "existing", MONTHS_EXISTING
    return add_months(start_date, MONTHS_NEW), "baru", MONTHS_NEW


def status_for(days_left):
    if days_left > 180:
        return "Aman", "#16a34a"
    if days_left > 60:
        return "Segera", "#d97706"
    if days_left > 30:
        return "Kritis", "#ea580c"
    if days_left > 0:
        return "Mendesak", "#dc2626"
    return "Terlewat", "#991b1b"


def format_id(d):
    bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
             "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    return "{} {} {}".format(d.day, bulan[d.month - 1], d.year)


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            with open("index.html", "rb") as f:
                body = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/status":
            self._json({
                "policy": POLICY,
                "today": date.today().isoformat(),
                "effective": EFFECTIVE.isoformat(),
                "months_existing": MONTHS_EXISTING,
                "months_new": MONTHS_NEW,
                "steps": OSS_STEPS,
                "checklist": CHECKLIST,
                "benefits": BENEFITS
            })
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        if self.path != "/api/check":
            self._json({"error": "not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except Exception:
            self._json({"error": "body tidak valid"}, 400)
            return

        raw = str(data.get("start_date", "")).strip()
        try:
            y, m, d = raw.split("-")
            start = date(int(y), int(m), int(d))
        except Exception:
            self._json({"error": "format tanggal harus YYYY-MM-DD"}, 400)
            return

        today = date.today()
        if start > today:
            self._json({"error": "tanggal mulai jualan tidak bisa di masa depan"}, 400)
            return

        deadline, kind, months = compute_deadline(start)
        days_left = (deadline - today).days
        status, color = status_for(days_left)

        # Progress: porsi waktu yang sudah lewat sejak awal tenggang sampai deadline
        anchor = EFFECTIVE if kind == "existing" else start
        total = (deadline - anchor).days
        elapsed = (today - anchor).days
        progress = max(0, min(100, round(elapsed / total * 100))) if total > 0 else 0

        self._json({
            "start_date": start.isoformat(),
            "start_label": format_id(start),
            "seller_kind": kind,
            "seller_label": "Seller existing (18 bulan)" if kind == "existing" else "Seller baru (6 bulan)",
            "months": months,
            "deadline": deadline.isoformat(),
            "deadline_label": format_id(deadline),
            "days_left": days_left,
            "status": status,
            "status_color": color,
            "progress": progress,
            "today": today.isoformat(),
            "note": "Perhitungan berdasarkan masa tenggang Permendag 19/2026. Cek juga pengumuman resmi marketplace kamu."
        })


if __name__ == "__main__":
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        print("NIB Deadline Checker running at http://localhost:{}".format(PORT))
        httpd.serve_forever()
