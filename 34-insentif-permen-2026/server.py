#!/usr/bin/env python3
"""Cek Insentif Permen UMKM 3/2026 - eligibility checker for 50% biaya layanan discount.

Python 3 stdlib, zero dependencies. Serves static UI from public/ and JSON API.
Regulation grounding: ANTARA 22 Juni 2026 (full text of Permen UMKM 3/2026) and
ANTARA 8 Juli 2026 (implementation timeline). Target applies end of August 2026.
"""
import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

PORT = 8034
PUBLIC = Path(__file__).parent / "public"

# Biaya layanan = biaya administrasi + komisi + biaya jasa aplikasi (definisi
# resmi Permen UMKM 3/2026, kisaran 10-18% per ANTARA). Default = estimasi
# total fee 2026 per marketplace, editable di UI. Cek seller center untuk aktual.
MARKETPLACES = [
    {"id": "shopee", "name": "Shopee", "defaultRate": 12.0},
    {"id": "tiktok", "name": "TikTok Shop", "defaultRate": 10.0},
    {"id": "tokopedia", "name": "Tokopedia", "defaultRate": 8.0},
    {"id": "lazada", "name": "Lazada", "defaultRate": 8.0},
    {"id": "blibli", "name": "Blibli", "defaultRate": 6.0},
    {"id": "bukalapak", "name": "Bukalapak", "defaultRate": 5.0},
]

# Syarat dari teks Permen UMKM 3/2026 (ANTARA 22 Juni 2026, full text).
REQUIREMENTS = [
    {"id": "skala", "label": "Usaha mikro atau kecil (bukan menengah/besar)", "detail": "Insentif khusus usaha mikro dan kecil (UMK)"},
    {"id": "produk_dalam_negeri", "label": "Hanya menjual produk dalam negeri", "detail": "Wajib 100% produk dalam negeri. Kalau campur produk impor, lokapasar bisa menolak atau menghentikan insentif"},
    {"id": "nib", "label": "Punya NIB (Nomor Induk Berusaha)", "detail": "NIB wajib sebagai identitas usaha"},
    {"id": "info_benar", "label": "Informasi usaha benar dan jelas", "detail": "Data usaha di seller center harus akurat"},
    {"id": "standar_mutu", "label": "Produk memenuhi standar mutu dan keamanan", "detail": "Produk dalam negeri wajib lolos standar mutu dan keamanan"},
    {"id": "sapa", "label": "Terdaftar di SAPA UMKM", "detail": "Terdaftar di layanan SAPA UMKM Kementerian UMKM, pengajuan insentif lewat layanan ini"},
]

# Kategori yang TIDAK dapat insentif (pengecualian eksplisit di Permen).
EXCLUSIONS = [
    {"id": "pangan_siap_saji", "label": "Produk pangan olahan siap saji", "detail": "Insentif tidak berlaku untuk produk pangan olahan siap saji"},
    {"id": "elektronik_industri_besar", "label": "Produk elektronik dari industri besar dalam negeri", "detail": "Insentif tidak berlaku untuk produk elektronik yang diproduksi industri besar dalam negeri"},
]

# Status kebijakan. Tanggal efektif = target resmi, bukan tanggal pasti.
# Permen ditetapkan Juni 2026. Target mulai berlaku akhir Agustus 2026.
# Platform diberi waktu paling lama 6 bulan untuk implementasi.
POLICY = {
    "status": "target-berlaku",
    "label": "Diskon 50% biaya layanan: target mulai akhir Agustus 2026",
    "description": (
        "Permen UMKM Nomor 3 Tahun 2026 sudah ditetapkan (Juni 2026). Marketplace wajib "
        "memberikan potongan biaya layanan paling sedikit 50% kepada UMK yang hanya menjual "
        "produk dalam negeri dan memenuhi syarat. Pemerintah menargetkan berlaku akhir Agustus "
        "2026, platform diberi waktu paling lama 6 bulan untuk implementasi. Empat marketplace "
        "menyatakan siap. Cek seller center untuk tarif aktual."
    ),
    "timeline": [
        {"date": "Juni 2026", "label": "Permen UMKM 3/2026 ditetapkan", "status": "selesai"},
        {"date": "12-13 Agustus 2026", "label": "Kepmen teknis diteken (per pemberitaan)", "status": "selesai"},
        {"date": "Akhir Agustus 2026", "label": "Target diskon mulai berlaku", "status": "target"},
        {"date": "Maksimal 6 bulan sejak Permen", "label": "Batas platform implementasi", "status": "target"},
    ],
    "source": "ANTARA 22 Juni 2026, ANTARA 8 Juli 2026, Suara Surabaya (akhir Agustus 2026)",
}


def read_body(handler):
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def check_eligibility(payload):
    answers = payload.get("answers") or {}
    exclusions = payload.get("exclusions") or {}
    entries = payload.get("entries") or []

    skala = answers.get("skala", "")
    if skala not in ("mikro", "kecil", "menengah", "besar"):
        return {"error": "skala usaha tidak valid"}, 400

    checks = []
    for req in REQUIREMENTS:
        if req["id"] == "skala":
            ok = skala in ("mikro", "kecil")
        else:
            ok = bool(answers.get(req["id"]))
        checks.append({"id": req["id"], "label": req["label"], "detail": req["detail"], "ok": ok})

    active_exclusions = [
        {"id": ex["id"], "label": ex["label"], "detail": ex["detail"]}
        for ex in EXCLUSIONS
        if bool(exclusions.get(ex["id"]))
    ]

    # Verdict logic. Pengecualian kategori menang atas segalanya.
    if active_exclusions:
        verdict = "tidak-layak"
        verdict_label = "Tidak layak untuk kategori produk ini"
        verdict_reason = (
            "Insentif diskon 50% biaya layanan tidak berlaku untuk: "
            + ", ".join(e["label"] for e in active_exclusions)
            + ". Pengecualian ini eksplisit di Permen UMKM 3/2026."
        )
    elif skala in ("menengah", "besar"):
        verdict = "tidak-layak"
        verdict_label = "Bukan usaha mikro atau kecil"
        verdict_reason = "Insentif hanya untuk usaha mikro dan kecil (UMK), bukan usaha menengah atau besar."
    elif not answers.get("produk_dalam_negeri"):
        verdict = "tidak-layak"
        verdict_label = "Menjual produk selain produk dalam negeri"
        verdict_reason = (
            "Insentif hanya untuk UMK yang HANYA menjual produk dalam negeri. Kalau toko masih "
            "menjual produk impor, lokapasar berhak menolak atau menghentikan insentif."
        )
    else:
        missing = [c for c in checks if not c["ok"]]
        if missing:
            verdict = "hampir-layak"
            verdict_label = "Hampir layak, " + str(len(missing)) + " syarat belum terpenuhi"
            verdict_reason = "Lengkapi syarat berikut lalu ajukan lewat SAPA UMKM: " + ", ".join(c["label"] for c in missing) + "."
        else:
            verdict = "layak"
            verdict_label = "Layak dapat diskon 50% biaya layanan"
            verdict_reason = "Semua syarat Permen UMKM 3/2026 terpenuhi. Ajukan lewat SAPA UMKM, lalu cek tarif biaya layanan di seller center setelah insentif aktif."

    # Hitung penghematan. Hanya verdict layak yang dihitung sebagai aktif;
    # hampir-layak ditampilkan sebagai potensi setelah syarat terpenuhi.
    breakdown = []
    total_fee = 0.0
    total_after = 0.0
    for entry in entries:
        mp = next((m for m in MARKETPLACES if m["id"] == entry.get("marketplace")), None)
        if not mp:
            continue
        omzet = max(0.0, float(entry.get("omzet") or 0))
        rate = max(0.0, min(50.0, float(entry.get("rate") or 0)))
        if omzet <= 0:
            continue
        fee = omzet * rate / 100.0
        total_fee += fee
        if verdict == "layak":
            after = fee * 0.5
        else:
            after = fee
        total_after += after
        breakdown.append({
            "marketplace": mp["name"],
            "omzet": omzet,
            "rate": rate,
            "fee": round(fee, 0),
            "after": round(after, 0),
            "saving": round(fee - after, 0),
        })

    result = {
        "verdict": verdict,
        "verdict_label": verdict_label,
        "verdict_reason": verdict_reason,
        "checks": checks,
        "exclusions": active_exclusions,
        "savings": {
            "feeMonthly": round(total_fee, 0),
            "afterMonthly": round(total_after, 0),
            "savingMonthly": round(total_fee - total_after, 0),
            "savingAnnual": round((total_fee - total_after) * 12, 0),
            "active": verdict == "layak",
        },
        "breakdown": breakdown,
    }
    return result, 200


def generate_letter(payload):
    nama = str(payload.get("nama") or "").strip()
    toko = str(payload.get("toko") or "").strip()
    marketplace = str(payload.get("marketplace") or "").strip()
    tanggal = str(payload.get("tanggal") or "").strip()
    jenis = str(payload.get("jenis") or "ditolak")
    keterangan = str(payload.get("keterangan") or "").strip()

    if not nama or not toko or not marketplace or not tanggal:
        return {"error": "nama, toko, marketplace, dan tanggal wajib diisi"}, 400

    if jenis == "dihentikan":
        perihal = "Keberatan atas Penghentian Insentif Biaya Layanan 50%"
        kejadian = "insentif biaya layanan 50% pada toko saya telah dihentikan"
    else:
        perihal = "Keberatan atas Penolakan Insentif Biaya Layanan 50%"
        kejadian = "permohonan insentif biaya layanan 50% pada toko saya ditolak"

    catatan = ""
    if keterangan:
        catatan = "Adapun kronologi/alasan yang saya sampaikan: " + keterangan + "\n"

    letter = (
        "SURAT KEBERATAN INSENTIF BIAYA LAYANAN 50%\n"
        "(Permen UMKM Nomor 3 Tahun 2026 tentang Pelindungan dan Peningkatan Daya Saing UMK dalam PMSE)\n\n"
        + tanggal + "\n\n"
        "Kepada Yth.\nTim " + marketplace + "\n"
        "Melalui layanan pengaduan " + marketplace + "\n\n"
        "Perihal: " + perihal + "\n\n"
        "Yang bertanda tangan di bawah ini:\n"
        "Nama: " + nama + "\n"
        "Nama Toko: " + toko + "\n"
        "Platform: " + marketplace + "\n\n"
        "Dengan ini saya menyampaikan keberatan karena " + kejadian + ".\n"
        + catatan +
        "Sesuai Permen UMKM Nomor 3 Tahun 2026, lokapasar wajib memberikan potongan biaya layanan "
        "paling sedikit 50% kepada usaha mikro dan kecil yang hanya menjual produk dalam negeri dan "
        "memenuhi persyaratan (memiliki NIB, informasi usaha benar dan jelas, produk memenuhi standar "
        "mutu dan keamanan, serta terdaftar di SAPA UMKM).\n"
        "Saya memenuhi persyaratan tersebut dan hanya menjual produk dalam negeri. Oleh karena itu "
        "saya mohon insentif biaya layanan 50% dapat diberlakukan kembali pada toko saya, atau "
        "diberikan penjelasan tertulis mengenai alasan penolakan/penghentian sesuai mekanisme yang "
        "ditetapkan pemerintah.\n\n"
        "Demikian surat ini saya sampaikan. Atas perhatian dan tindak lanjutnya, saya ucapkan terima kasih.\n\n"
        "Hormat saya,\n" + nama
    )
    return {"letter": letter}, 200


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, path):
        clean = path.lstrip("/")
        if clean == "":
            clean = "index.html"
        file_path = (PUBLIC / clean).resolve()
        # Prevent path traversal
        if PUBLIC.resolve() not in file_path.parents and file_path != PUBLIC.resolve():
            self.send_error(404)
            return
        if not file_path.is_file():
            self.send_error(404)
            return
        body = file_path.read_bytes()
        ctype = "text/html; charset=utf-8" if file_path.suffix == ".html" else (
            "text/css; charset=utf-8" if file_path.suffix == ".css" else (
            "application/javascript; charset=utf-8" if file_path.suffix == ".js" else "application/octet-stream"))
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/status":
            return self._send_json(POLICY)
        if path == "/api/marketplaces":
            return self._send_json(MARKETPLACES)
        if path.startswith("/api/"):
            return self._send_json({"error": "not found"}, 404)
        return self._serve_static(path)

    def do_POST(self):
        path = urlparse(self.path).path
        payload = read_body(self)
        if path == "/api/check":
            result, code = check_eligibility(payload)
            return self._send_json(result, code)
        if path == "/api/letter":
            result, code = generate_letter(payload)
            return self._send_json(result, code)
        return self._send_json({"error": "not found"}, 404)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print("Insentif Permen 3/2026 running at http://localhost:%d" % PORT)
    server.serve_forever()
