#!/usr/bin/env python3
"""TikTok Shop Komisi Kalkulator - hitung potongan komisi dinamis lama vs baru.

Komisi dinamis TikTok Shop naik per 18 Mei 2026. Cap per item melesat dari
Rp40.000 ke Rp650.000, banyak kategori naik tarif (4% -> 7-8%). Seller butuh
tahu: berapa potongan baru per item, berapa total bulanan, dan harus naik
harga berapa agar margin tidak tergerus. Plus perbandingan dengan biaya admin
Shopee 2026.
"""

import json
import http.server
import socketserver
from datetime import date

PORT = 8027

# Tarif komisi dinamis TikTok Shop: (kategori, lama %, baru %)
# Lama: berlaku sejak 10 Jun 2025. Baru: berlaku 18 Mei 2026.
# Sumber: associe.co.id (2026-05-08), teknologi.bisnis.com (2026-05-18)
CATEGORIES = [
    ("Telepon & Elektronik", 4.00, 3.00),
    ("Komputer & Peralatan Kantor", 4.00, 4.00),
    ("Otomotif & Sepeda Motor", 5.50, 7.50),
    ("Peralatan Rumah Tangga", 4.00, 6.00),
    ("Perbaikan Rumah", 5.50, 7.50),
    ("Makanan & Minuman", 5.00, 6.50),
    ("Perkakas & Perangkat Keras", 5.50, 7.00),
    ("Kesehatan", 4.00, 6.50),
    ("Olahraga & Aktivitas Luar Ruangan", 6.00, 6.50),
    ("Perlengkapan Rumah Tangga", 6.00, 8.00),
    ("Kecantikan & Perawatan Pribadi", 4.00, 7.00),
    ("Perlengkapan Hewan Peliharaan", 6.00, 8.00),
    ("Mainan & Hobi", 6.00, 8.00),
    ("Peralatan Dapur", 6.00, 8.00),
    ("Furnitur", 5.00, 6.50),
    ("Pakaian Pria & Pakaian Dalam", 5.00, 8.00),
    ("Aksesoris Perhiasan & Turunannya", 4.00, 4.50),
    ("Aksesoris Fesyen", 6.00, 7.50),
    ("Koper & Tas", 5.50, 8.00),
    ("Bayi & Ibu Hamil", 4.00, 7.00),
    ("Sepatu", 5.00, 8.00),
    ("Pemesanan & Voucher", 4.00, 6.00),
    ("Pakaian Wanita & Pakaian Dalam", 5.50, 8.00),
    ("Tekstil & Perabot Rumah Tangga", 5.00, 8.00),
    ("Buku, Majalah & Audio", 5.00, 8.00),
    ("Barang Koleksi", 6.00, 8.00),
    ("Busana Muslim", 5.50, 8.00),
    ("Busana Anak-Anak", 4.00, 7.50),
    ("Produk Virtual", 4.00, 6.00),
    ("Peralatan & Perlengkapan Kantor", 4.00, 8.00),
]

# Cap biaya per item (Rp): lama (sebelum 18 Mei 2026) vs baru
OLD_CAP = 40000
NEW_CAP = 650000

# Biaya retur/gagal kirim per item (berlaku 1 Juni 2026): pengiriman gagal
# Rp5.000 + retur kesalahan pembeli Rp5.000 = hingga Rp10.000 per kejadian
RETURN_FEE_FAIL = 5000
RETURN_FEE_BUYER = 5000

# Biaya admin Shopee 2026 per kelompok kategori (metrotvnews.com)
SHOPEE_GROUPS = [
    {"id": "A", "label": "Kategori A (Fashion, FMCG, Lifestyle)", "rate": 10.0},
    {"id": "B", "label": "Kategori B (Elektronik, Perawatan Kulit)", "rate": 9.25, "rate_min": 9.0, "rate_max": 9.5},
    {"id": "C", "label": "Kategori C (Susu Formula, Suplemen)", "rate": 6.625, "rate_min": 6.5, "rate_max": 6.75},
    {"id": "D", "label": "Kategori D (Elektronik High-End)", "rate": 5.25},
    {"id": "E", "label": "Kategori E (Logam Mulia, Perhiasan)", "rate": 4.25},
    {"id": "X", "label": "Kategori Khusus (E-Money, Tiket)", "rate": 2.5},
]

POLICY = {
    "status": "active",
    "label": "Komisi dinamis baru berlaku 18 Mei 2026",
    "description": "TikTok Shop menaikkan tarif komisi dinamis per 18 Mei 2026. Batas atas (cap) per item melesat dari Rp40.000 menjadi Rp650.000. Sebagian besar kategori naik, contoh Pakaian Wanita 5,5% -> 8%, Kecantikan 4% -> 7%, Busana Muslim 5,5% -> 8%.",
    "note": "Mulai 1 Juni 2026 ada biaya retur: hingga Rp5.000 untuk pengiriman gagal dan Rp5.000 untuk retur kesalahan pembeli, total hingga Rp10.000 per kejadian. Menteri UMKM telah memanggil marketplace dan melarang kenaikan sepihak.",
    "sources": [
        "teknologi.bisnis.com: Komisi Dinamis Seller TikTok Shop Naik Hari Ini, Batas Atas Melesat 15 Kali Lipat (2026-05-18)",
        "jpnn.com: TikTok Shop Bersiap Naikkan Komisi Seller, Pemerintah Bakal Ambil Tindakan Tegas (2026-05-14)",
        "associe.co.id: Daftar Besar Biaya Komisi Dinamis TikTok Shop Baru dan Lama (2026-05-08)",
        "metrotvnews.com: Biaya Admin Shopee 2026, Daftar Biaya per Kategori Produk"
    ]
}

EXAMPLE = {
    "category": "Pakaian Wanita & Pakaian Dalam",
    "price": 100000,
    "discount": 0,
    "volume": 200,
    "modal": 55000
}


def calc_commission(base, rate_pct, cap):
    """Komisi per item: (harga - diskon) x tarif, dibatasi cap."""
    raw = base * rate_pct / 100.0
    return min(raw, cap)


def rec_price(modal, diskon, profit_old, rate_new, cap_new):
    """Harga baru agar profit per item sama dengan skema lama.

    profit = (P - diskon) - modal - min((P - diskon) * rate, cap)
    Kasus tanpa cap:  base = (profit + modal) / (1 - rate)
    Kasus kena cap:   base = profit + modal + cap
    """
    base_no_cap = (profit_old + modal) / (1.0 - rate_new / 100.0)
    if base_no_cap * rate_new / 100.0 <= cap_new:
        return base_no_cap + diskon
    base_capped = profit_old + modal + cap_new
    return base_capped + diskon


def calc(body):
    try:
        category = str(body.get("category", "")).strip()
        price = float(body.get("price") or 0)
        discount = float(body.get("discount") or 0)
        volume = int(float(body.get("volume") or 1))
        modal = float(body.get("modal") or 0)
    except (TypeError, ValueError):
        return {"error": "Input tidak valid"}

    cat = next((c for c in CATEGORIES if c[0] == category), None)
    if cat is None:
        return {"error": "Kategori tidak ditemukan"}
    if price <= 0:
        return {"error": "Harga harus lebih dari 0"}
    if volume < 1:
        volume = 1

    name, rate_old, rate_new = cat
    base = max(price - discount, 0)

    comm_old = calc_commission(base, rate_old, OLD_CAP)
    comm_new = calc_commission(base, rate_new, NEW_CAP)
    diff_item = comm_new - comm_old
    pct_up = (diff_item / comm_old * 100.0) if comm_old > 0 else None

    total_old = comm_old * volume
    total_new = comm_new * volume
    total_diff = total_new - total_old

    cap_old_hit = base * rate_old / 100.0 > OLD_CAP
    cap_new_hit = base * rate_new / 100.0 > NEW_CAP

    result = {
        "category": name,
        "rate_old": rate_old,
        "rate_new": rate_new,
        "base": base,
        "comm_old": round(comm_old),
        "comm_new": round(comm_new),
        "diff_item": round(diff_item),
        "pct_up": round(pct_up, 1) if pct_up is not None else None,
        "total_old": round(total_old),
        "total_new": round(total_new),
        "total_diff": round(total_diff),
        "cap_old": OLD_CAP,
        "cap_new": NEW_CAP,
        "cap_old_hit": cap_old_hit,
        "cap_new_hit": cap_new_hit,
        "volume": volume,
        "modal": modal,
        "return_fee_max": RETURN_FEE_FAIL + RETURN_FEE_BUYER,
    }

    # Dampak margin kalau modal diisi
    if modal > 0:
        profit_old = base - modal - comm_old
        profit_new = base - modal - comm_new
        margin_old = (profit_old / price * 100.0) if price > 0 else 0
        margin_new = (profit_new / price * 100.0) if price > 0 else 0
        result["profit_old"] = round(profit_old)
        result["profit_new"] = round(profit_new)
        result["margin_old"] = round(margin_old, 1)
        result["margin_new"] = round(margin_new, 1)
        result["reco_price"] = round(rec_price(modal, discount, profit_old, rate_new, NEW_CAP))
        result["reco_base"] = round(result["reco_price"] - discount)

    # Perbandingan Shopee (opsional)
    sg = body.get("shopee_group")
    if sg:
        grp = next((g for g in SHOPEE_GROUPS if g["id"] == sg), None)
        if grp:
            rate = grp["rate"]
            if grp.get("rate_min"):
                rate = grp["rate_min"]
            comm_shopee = base * rate / 100.0
            result["shopee"] = {
                "group": grp["label"],
                "rate": rate,
                "rate_min": grp.get("rate_min"),
                "rate_max": grp.get("rate_max"),
                "comm": round(comm_shopee),
                "diff_vs_tiktok": round(comm_shopee - comm_new),
            }

    return result


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _json(self, obj, code=200):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _html(self):
        try:
            with open("index.html", "rb") as f:
                data = f.read()
        except FileNotFoundError:
            data = b"index.html not found"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/status":
            self._json(POLICY)
        elif self.path == "/api/categories":
            self._json([{"name": n, "old": o, "new": w} for n, o, w in CATEGORIES])
        elif self.path == "/api/shopee":
            self._json(SHOPEE_GROUPS)
        elif self.path == "/api/example":
            self._json(EXAMPLE)
        else:
            self._html()

    def do_POST(self):
        if self.path != "/api/calculate":
            self._json({"error": "Not found"}, 404)
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json({"error": "JSON tidak valid"}, 400)
            return
        self._json(calc(body))


if __name__ == "__main__":
    print(f"TikTok Shop Komisi Kalkulator: http://localhost:{PORT}")
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
