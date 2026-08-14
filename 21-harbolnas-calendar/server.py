#!/usr/bin/env python3
"""Harbolnas Promo Calendar - Indonesian marketplace promo event calendar."""

import json
import http.server
import socketserver
from datetime import date, timedelta

PORT = 8021

MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Blibli", "Bukalapak"]

CATEGORIES = {
    "harbolnas": {"label": "Harbolnas", "color": "#ee4d2d"},
    "payday":    {"label": "Payday",    "color": "#4a9"},
    "ramadan":   {"label": "Ramadan",   "color": "#16a34a"},
    "lebaran":   {"label": "Lebaran",   "color": "#d97706"},
    "imlek":     {"label": "Imlek",     "color": "#dc2626"},
    "tahunbaru": {"label": "Tahun Baru", "color": "#3b82f6"},
}

ALL = MARKETPLACES

# Static events. Religious dates are estimates (marked estimated: true).
EVENTS = [
    {
        "date": "2026-01-01", "name": "Tahun Baru 2026", "category": "tahunbaru",
        "marketplaces": ALL, "estimated": False,
        "desc": "Awal tahun, banyak pembeli cari produk baru dan pengganti.",
        "prep_lead_days": 7,
        "checklist": [
            "Siapkan promo awal tahun untuk produk baru",
            "Update banner toko dengan tema tahun baru",
            "Cek stok produk yang mau didiskon",
        ],
    },
    {
        "date": "2026-02-17", "name": "Ramadan 2026", "category": "ramadan",
        "marketplaces": ALL, "estimated": True,
        "desc": "Bulan puasa. Penjualan makanan, minuman, dan fashion naik drastis.",
        "prep_lead_days": 14,
        "checklist": [
            "Stok produk makanan dan minuman 2-3x lipat",
            "Siapkan paket hampers dan parcel",
            "Naikkan budget iklan di minggu pertama",
            "Siapkan konten bertema buka puasa",
        ],
    },
    {
        "date": "2026-03-20", "name": "Lebaran 2026", "category": "lebaran",
        "marketplaces": ALL, "estimated": True,
        "desc": "Puncak belanja tahunan. Fashion, hampers, dan perlengkapan mudik laris.",
        "prep_lead_days": 21,
        "checklist": [
            "Stok fashion dan hampers 3x lipat",
            "Hentikan penawaran pengiriman H-3 Lebaran",
            "Siapkan voucher THR dan gratis ongkir",
            "Antisipasi lonjakan chat pembeli",
        ],
    },
    {
        "date": "2026-04-04", "name": "Harbolnas 4.4", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Hari belanja online nasional pertama di tahun 2026.",
        "prep_lead_days": 10,
        "checklist": [
            "Siapkan stok produk best seller",
            "Buat voucher toko dan flash sale H-7",
            "Cek ulang fee dan subsidi ongkir event",
            "Siapkan foto produk dan konten promosi",
        ],
    },
    {
        "date": "2026-05-05", "name": "Harbolnas 5.5", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo tengah tahun, fokus ke elektronik dan fashion.",
        "prep_lead_days": 10,
        "checklist": [
            "Siapkan stok elektronik dan aksesoris",
            "Siapkan bundling produk",
            "Naikkan budget iklan H-7",
        ],
    },
    {
        "date": "2026-06-06", "name": "Harbolnas 6.6", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo bulan Juni, banyak voucher cashback dari marketplace.",
        "prep_lead_days": 10,
        "checklist": [
            "Daftarkan produk ke program cashback",
            "Siapkan stok tambahan",
            "Aktifkan gratis ongkir",
        ],
    },
    {
        "date": "2026-07-07", "name": "Harbolnas 7.7", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo pertengahan tahun, momen jualan produk musiman.",
        "prep_lead_days": 10,
        "checklist": [
            "Siapkan stok produk musiman",
            "Buat konten promosi di sosmed",
            "Cek persediaan packaging",
        ],
    },
    {
        "date": "2026-08-08", "name": "Harbolnas 8.8", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo Agustus, berdekatan dengan HUT RI.",
        "prep_lead_days": 10,
        "checklist": [
            "Siapkan promo tema kemerdekaan",
            "Stok produk merchandise merah putih",
            "Siapkan voucher toko",
        ],
    },
    {
        "date": "2026-09-09", "name": "Harbolnas 9.9", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Salah satu Harbolnas terbesar. Semua marketplace kasih diskon besar.",
        "prep_lead_days": 14,
        "checklist": [
            "Stok 2-3x lipat produk best seller",
            "Siapkan voucher toko dan flash sale dari H-7",
            "Cek ulang fee dan subsidi ongkir event",
            "Naikkan budget iklan 1-2 minggu sebelum",
            "Siapkan CS untuk lonjakan chat",
        ],
    },
    {
        "date": "2026-10-10", "name": "Harbolnas 10.10", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo bulan Oktober, fokus ke gadget dan fashion.",
        "prep_lead_days": 14,
        "checklist": [
            "Stok produk elektronik dan fashion",
            "Siapkan bundling dan paket hemat",
            "Naikkan budget iklan H-7",
        ],
    },
    {
        "date": "2026-11-11", "name": "Harbolnas 11.11", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Harbolnas terbesar kedua setelah 12.12. Momen belanja tahunan.",
        "prep_lead_days": 21,
        "checklist": [
            "Stok 2-3x lipat dari penjualan normal",
            "Siapkan voucher toko dan flash sale dari H-14",
            "Cek ulang fee dan subsidi ongkir event",
            "Naikkan budget iklan 2 minggu sebelum",
            "Siapkan tim CS tambahan",
        ],
    },
    {
        "date": "2026-12-12", "name": "Harbolnas 12.12", "category": "harbolnas",
        "marketplaces": ALL, "estimated": False,
        "desc": "Harbolnas terbesar tahun ini. Semua marketplace kasih promo maksimal.",
        "prep_lead_days": 21,
        "checklist": [
            "Stok 3x lipat produk best seller",
            "Siapkan voucher toko dan flash sale dari H-14",
            "Cek ulang fee dan subsidi ongkir event",
            "Naikkan budget iklan 2 minggu sebelum",
            "Siapkan packaging dan tim packing ekstra",
        ],
    },
    {
        "date": "2026-12-25", "name": "Natal 2026", "category": "tahunbaru",
        "marketplaces": ALL, "estimated": False,
        "desc": "Momen hadiah dan belanja akhir tahun.",
        "prep_lead_days": 14,
        "checklist": [
            "Siapkan paket kado dan gift set",
            "Stok produk hadiah",
            "Siapkan promo akhir tahun",
        ],
    },
    {
        "date": "2027-01-01", "name": "Tahun Baru 2027", "category": "tahunbaru",
        "marketplaces": ALL, "estimated": False,
        "desc": "Promo awal tahun baru, banyak pembeli cari produk baru.",
        "prep_lead_days": 7,
        "checklist": [
            "Siapkan promo produk baru",
            "Update banner toko",
            "Cek stok produk yang mau didiskon",
        ],
    },
    {
        "date": "2027-02-06", "name": "Imlek 2027", "category": "imlek",
        "marketplaces": ALL, "estimated": True,
        "desc": "Tahun Baru China. Produk warna merah dan emas laris.",
        "prep_lead_days": 14,
        "checklist": [
            "Stok produk tema merah dan emas",
            "Siapkan paket angpao dan hampers",
            "Buat konten tema Imlek",
        ],
    },
    {
        "date": "2027-02-07", "name": "Ramadan 2027", "category": "ramadan",
        "marketplaces": ALL, "estimated": True,
        "desc": "Bulan puasa. Penjualan makanan, minuman, dan fashion naik drastis.",
        "prep_lead_days": 14,
        "checklist": [
            "Stok produk makanan dan minuman 2-3x lipat",
            "Siapkan paket hampers dan parcel",
            "Naikkan budget iklan di minggu pertama",
            "Siapkan konten bertema buka puasa",
        ],
    },
    {
        "date": "2027-03-09", "name": "Lebaran 2027", "category": "lebaran",
        "marketplaces": ALL, "estimated": True,
        "desc": "Puncak belanja tahunan. Fashion, hampers, dan perlengkapan mudik laris.",
        "prep_lead_days": 21,
        "checklist": [
            "Stok fashion dan hampers 3x lipat",
            "Hentikan penawaran pengiriman H-3 Lebaran",
            "Siapkan voucher THR dan gratis ongkir",
            "Antisipasi lonjakan chat pembeli",
        ],
    },
]


def payday_events():
    """Generate monthly payday events. Include current month if the 25th has not passed."""
    out = []
    today = date.today()
    start = 0 if today.day <= 25 else 1
    for i in range(start, start + 12):
        y = today.year + (today.month + i - 1) // 12
        m = (today.month + i - 1) % 12 + 1
        last = (date(y, m + 1, 1) - timedelta(days=1)).day if m < 12 else 31
        d = 25 if 25 <= last else last
        out.append({
            "date": f"{y:04d}-{m:02d}-{d:02d}",
            "name": "Payday Sale",
            "category": "payday",
            "marketplaces": ["Shopee", "Tokopedia", "TikTok Shop"],
            "estimated": False,
            "desc": "Gajian tanggal 25. Pembeli punya uang lebih, momen bagus untuk jualan.",
            "prep_lead_days": 5,
            "checklist": [
                "Top up stok produk best seller",
                "Buat voucher kecil (cashback 5-10%)",
                "Aktifkan gratis ongkir",
                "Siapkan banner toko",
            ],
        })
    return out


def enrich(ev):
    """Add computed fields: days_left, status, prep_date, prep_days_left."""
    e = dict(ev)
    d = date.fromisoformat(e["date"])
    today = date.today()
    delta = (d - today).days
    e["days_left"] = delta
    if delta < 0:
        e["status"] = "passed"
    elif delta == 0:
        e["status"] = "today"
    else:
        e["status"] = "upcoming"
    prep = d - timedelta(days=e["prep_lead_days"])
    e["prep_date"] = prep.isoformat()
    e["prep_days_left"] = (prep - today).days
    e["cat"] = CATEGORIES.get(e["category"], {"label": e["category"], "color": "#666"})
    return e


def all_events():
    events = EVENTS + payday_events()
    events = [enrich(e) for e in events]
    events.sort(key=lambda e: e["date"])
    return events


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.path = "/index.html"
            return super().do_GET()
        if self.path == "/api/events":
            body = json.dumps({
                "today": date.today().isoformat(),
                "categories": {k: v["label"] for k, v in CATEGORIES.items()},
                "marketplaces": MARKETPLACES,
                "events": all_events(),
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Harbolnas Calendar running at http://localhost:{PORT}")
        httpd.serve_forever()
