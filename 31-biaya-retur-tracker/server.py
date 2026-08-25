#!/usr/bin/env python3
"""Biaya Retur Tracker - hitung kerugian nyata per retur dan lacak kasus retur bermasalah.

Latar: TikTok Shop 2026 membebankan biaya pengiriman gagal dan biaya retur ke seller
(Bisnis Tekno 31 Mei 2026, berlaku setelah masa tenggang 3 bulan). Menteri UMKM geram
dan ancam tindak tegas (detikFinance 21 Mei 2026). Kasus retur bodong marak: barang
diretur kosong tapi dana dikembalikan ke pembeli, bukti tidak dipertimbangkan, saldo
minus. Seller tidak pernah menghitung: 1 retur = berapa penjualan tambahan yang harus
ditutup.

Sumber:
- Bisnis Tekno 31 Mei 2026: TikTok Shop bebankan biaya pengiriman gagal dan retur ke seller
- Bisnis Tekno 14 Apr 2026: beda kebijakan biaya retur Shopee vs TikTok Shop
- detikFinance 21 Mei 2026: Menteri UMKM buka suara soal penjual tanggung biaya retur
- Media Konsumen 4 Mar 2026: barang diretur kosong, dana tetap dikembalikan ke pembeli
- BeritaSatu 15 Mei 2026: seller menjerit, barang retur diduga dijual lagi
"""

import csv
import io
import json
import math
import os
import socketserver
import uuid
from datetime import date
from http.server import BaseHTTPRequestHandler

PORT = 8031
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "cases.json")

# Komisi per marketplace (estimasi 2026, bisa diedit user di form)
MARKETPLACES = [
    {"id": "shopee", "name": "Shopee", "commission": 6.5,
     "return_note": "Retur 7 hari. Ongkir retur ditanggung seller kalau alasan dari pihak seller (barang salah/rusak), ditanggung pembeli kalau change of mind."},
    {"id": "tokopedia", "name": "Tokopedia", "commission": 6.25,
     "return_note": "Retur 7 hari. Ongkir retur ditanggung seller jika produk tidak sesuai deskripsi."},
    {"id": "tiktok", "name": "TikTok Shop", "commission": 7.0,
     "return_note": "Aturan baru 2026: seller menanggung biaya pengiriman gagal dan biaya retur (Bisnis Tekno 31 Mei 2026). Menteri UMKM geram dan ancam tindak tegas."},
    {"id": "lazada", "name": "Lazada", "commission": 5.0,
     "return_note": "Retur 7 hari. Ongkir retur ditanggung seller jika produk tidak sesuai."},
    {"id": "bukalapak", "name": "Bukalapak", "commission": 4.0,
     "return_note": "Retur 7 hari. Proses lewat pusat resolusi, ongkir retur tergantung hasil mediasi."},
    {"id": "blibli", "name": "Blibli", "commission": 4.0,
     "return_note": "Retur 14 hari, jendela paling lama. Ongkir retur gratis untuk alasan seller."},
]

# Checklist bukti untuk kasus retur bermasalah
EVIDENCE_CHECKLIST = [
    "Video unboxing paket retur dari awal buka sampai isi lengkap",
    "Foto kondisi barang, kemasan, dan segel saat tiba",
    "Foto timbangan paket dibanding nomor resi (deteksi isi kosong/diganti)",
    "Screenshot chat dengan pembeli sebelum dan sesudah retur",
    "Screenshot detail pesanan dan nomor resi retur",
    "Catatan waktu buka paket (jangan ditunda, langsung dokumentasi)",
]

# Red flag retur bodong
RED_FLAGS = [
    "Akun baru atau jarang bertransaksi dengan nilai order tinggi",
    "Alasan retur tidak sesuai kondisi barang yang dikirim",
    "Pembeli menolak kirim video/foto kondisi saat barang diterima",
    "Pembeli minta refund di luar platform (transfer langsung)",
    "Barang high-value dikirim tanpa asuransi dan tiba-tiba diretur",
    "Alamat retur berbeda dengan alamat pengiriman awal",
]

# Status lifecycle kasus
STATUSES = ["baru", "bukti", "diajukan", "diproses", "disetujui", "ditolak", "kompensasi"]

# Sumber berita
SOURCES = [
    "Bisnis Tekno (31 Mei 2026): TikTok Shop Bebankan Biaya Pengiriman Gagal dan Retur ke Seller",
    "Bisnis Tekno (14 Apr 2026): Beda Kebijakan Shopee dan TikTok Shop soal Biaya Retur Seller",
    "detikFinance (21 Mei 2026): Menteri UMKM Buka Suara soal Penjual Ikut Tanggung Biaya Retur di TikTok Shop",
    "Media Konsumen (4 Mar 2026): Barang Diretur ke Penjual Tanpa Isinya, TikTok Shop Malah Mengembalikan Dana ke Pembeli",
    "BeritaSatu (15 Mei 2026): Seller Menjerit, Untung Tergerus dan Barang Retur Diduga Dijual Lagi",
]

SEED_CASES = [
    {
        "platform": "TikTok Shop", "order_id": "TIK-2026-0314", "product": "Jam tangan pria (high value)",
        "amount": 850000, "reason": "Barang diretur tanpa isi, dana dikembalikan ke pembeli",
        "status": "diajukan", "note": "Video unboxing sudah disiapkan, timbangan paket 180gr vs resi 420gr. Dispute berjalan.",
        "evidence": [0, 1, 2, 4], "date": "2026-08-18"
    },
    {
        "platform": "Shopee", "order_id": "SP-2026-7761", "product": "Sepatu sneakers size 42",
        "amount": 320000, "reason": "Barang dikembalikan tanpa label, CS bilang sudah sesuai S&K",
        "status": "diproses", "note": "Bukti foto pengiriman awal + screenshot chat diminta ulang CS. Minta jawaban tertulis.",
        "evidence": [3, 4], "date": "2026-08-21"
    },
    {
        "platform": "Blibli", "order_id": "BB-2026-2055", "product": "Tas kulit",
        "amount": 540000, "reason": "Retur hari ke-12, alasan berubah pikiran, ongkir retur dibebankan ke seller",
        "status": "baru", "note": "Jendela retur Blibli 14 hari, cek dulu ketentuan siapa penanggung ongkir.",
        "evidence": [0], "date": "2026-08-24"
    },
]


def load_cases():
    if not os.path.exists(DATA_FILE):
        return list(SEED_CASES)
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return list(SEED_CASES)


def save_cases(cases):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)


def calc(body):
    """Hitung kerugian nyata per retur."""
    try:
        selling = float(body.get("selling_price", 0))
        cost = float(body.get("product_cost", 0))
    except (TypeError, ValueError):
        return {"error": "Harga jual dan harga modal wajib angka."}
    if selling <= 0:
        return {"error": "Harga jual harus lebih dari 0."}
    if cost <= 0:
        return {"error": "Harga modal harus lebih dari 0."}

    ship_out = float(body.get("shipping_out", 0) or 0)
    ship_return = float(body.get("shipping_return", 0) or 0)
    seller_pays_return = bool(body.get("seller_pays_return", True))
    packaging = float(body.get("packaging", 0) or 0)
    resellable = bool(body.get("resellable", False))
    resell_value = float(body.get("resell_value_pct", 50) or 0)
    commission_pct = float(body.get("commission_pct", 6.5) or 0) / 100.0

    fee = selling * commission_pct
    net_profit = selling - cost - ship_out - packaging - fee

    product_loss = cost if not resellable else cost * (1.0 - min(max(resell_value, 0), 100) / 100.0)
    return_ship_loss = ship_return if seller_pays_return else 0.0
    total_loss = product_loss + ship_out + return_ship_loss + packaging

    if net_profit <= 0:
        sales_to_cover = None
        severity = "rugi-dasar"
        severity_label = "Penjualan normal sudah rugi"
    else:
        sales_to_cover = int(math.ceil(total_loss / net_profit))
        if sales_to_cover >= 8:
            severity = "kritis"
            severity_label = "Kritis: 1 retur menghapus 8+ penjualan"
        elif sales_to_cover >= 4:
            severity = "signifikan"
            severity_label = "Signifikan: 1 retur menghapus 4-7 penjualan"
        else:
            severity = "terkendali"
            severity_label = "Terkendali: 1 retur menghapus 1-3 penjualan"

    return {
        "components": {
            "product_loss": round(product_loss),
            "shipping_out": round(ship_out),
            "shipping_return": round(return_ship_loss),
            "packaging": round(packaging),
        },
        "total_loss": round(total_loss),
        "net_profit_per_sale": round(net_profit),
        "margin_pct": round(net_profit / selling * 100, 1) if selling else 0,
        "fee": round(fee),
        "sales_to_cover": sales_to_cover,
        "severity": severity,
        "severity_label": severity_label,
    }


class Handler(BaseHTTPRequestHandler):
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

    def _body(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return None

    def do_GET(self):
        if self.path == "/api/meta":
            self._json({
                "marketplaces": MARKETPLACES,
                "evidence": EVIDENCE_CHECKLIST,
                "red_flags": RED_FLAGS,
                "statuses": STATUSES,
                "sources": SOURCES,
            })
        elif self.path == "/api/cases":
            self._json(load_cases())
        elif self.path == "/api/export":
            self._export_csv()
        else:
            self._html()

    def _export_csv(self):
        cases = load_cases()
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["tanggal", "platform", "order_id", "produk", "nilai_order",
                         "alasan", "status", "catatan"])
        for c in cases:
            writer.writerow([c.get("date", ""), c.get("platform", ""), c.get("order_id", ""),
                             c.get("product", ""), c.get("amount", 0), c.get("reason", ""),
                             c.get("status", ""), c.get("note", "")])
        data = buf.getvalue().encode("utf-8-sig")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", 'attachment; filename="kasus-retur.csv"')
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        body = self._body()
        if body is None:
            self._json({"error": "JSON tidak valid"}, 400)
            return

        if self.path == "/api/calculate":
            self._json(calc(body))
            return

        if self.path == "/api/cases":
            cases = load_cases()
            new_case = {
                "id": uuid.uuid4().hex[:10],
                "date": body.get("date", date.today().isoformat()),
                "platform": body.get("platform", ""),
                "order_id": body.get("order_id", ""),
                "product": body.get("product", ""),
                "amount": float(body.get("amount", 0) or 0),
                "reason": body.get("reason", ""),
                "status": body.get("status", "baru"),
                "note": body.get("note", ""),
                "evidence": body.get("evidence", []),
            }
            if not new_case["platform"] or not new_case["product"]:
                self._json({"error": "Platform dan produk wajib diisi."}, 400)
                return
            cases.insert(0, new_case)
            save_cases(cases)
            self._json(new_case)
            return

        if self.path == "/api/cases/update":
            cases = load_cases()
            cid = body.get("id", "")
            for c in cases:
                if c.get("id") == cid:
                    if "status" in body:
                        c["status"] = body["status"]
                    if "note" in body:
                        c["note"] = body["note"]
                    if "evidence" in body:
                        c["evidence"] = body["evidence"]
                    save_cases(cases)
                    self._json(c)
                    return
            self._json({"error": "Kasus tidak ditemukan."}, 404)
            return

        if self.path == "/api/cases/delete":
            cases = load_cases()
            cid = body.get("id", "")
            remaining = [c for c in cases if c.get("id") != cid]
            if len(remaining) == len(cases):
                self._json({"error": "Kasus tidak ditemukan."}, 404)
                return
            save_cases(remaining)
            self._json({"ok": True})
            return

        self._json({"error": "Not found"}, 404)


if __name__ == "__main__":
    print(f"Biaya Retur Tracker: http://localhost:{PORT}")
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
