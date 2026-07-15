#!/usr/bin/env python3
"""
Marketplace Fee Breakdown Calculator - Indonesia 2026

Hitung semua potongan marketplace (komisi, biaya layanan, pemrosesan, pre-order)
dan tampilkan profit bersih. Bisa compare lintas marketplace.

Usage:
    python fee_calc.py 200000                  # harga jual, semua marketplace
    python fee_calc.py 200000 --marketplace shopee
    python fee_calc.py 200000 --kategori fashion --modal 100000
    python fee_calc.py 200000 --compare        # tabel perbandingan
"""

import argparse
import sys

# ============================================================
# Fee structures per marketplace (2026 data)
# Source: webekspor.com, jangkar.io, traksee.com, seller.shopee.co.id
# ============================================================

SHOPEE_FEES = {
    "name": "Shopee",
    "categories": {
        "fashion":      {"label": "Fashion, FMCG, Lifestyle",        "admin": 0.10},
        "elektronik":   {"label": "Elektronik, Perawatan Kulit",     "admin": 0.095},
        "suplemen":     {"label": "Susu Formula, Suplemen",          "admin": 0.0675},
        "elektronik_hi":{"label": "Elektronik High-End",             "admin": 0.0525},
        "perhiasan":    {"label": "Logam Mulia, Perhiasan",          "admin": 0.0425},
        "digital":      {"label": "E-Money, Tiket",                  "admin": 0.025},
    },
    "service_fee_pct": 0.0,      # included in admin above for non-star
    "preorder_extra_pct": 0.03,  # tambahan 3% untuk pre-order
    "processing_fee": 0,         # flat per order (included in admin)
    "free_ongkir_extra_pct": 0.02,  # estimasi tambahan jika ikut program
}

TOKOPEDIA_FEES = {
    "name": "Tokopedia",
    "categories": {
        "fashion":      {"label": "Fashion",              "komisi_platform": 0.0697},
        "elektronik":   {"label": "Elektronik",           "komisi_platform": 0.0697},
        "suplemen":     {"label": "Suplemen",             "komisi_platform": 0.0697},
        "elektronik_hi":{"label": "Elektronik Premium",   "komisi_platform": 0.08},
        "perhiasan":    {"label": "Perhiasan",            "komisi_platform": 0.0697},
        "digital":      {"label": "Digital",              "komisi_platform": 0.0697},
    },
    "komisi_dinamis_max": 40000,   # max Rp 40.000 per item
    "komisi_dinamis_tiers": [      # (batas_harga, biaya_flat)
        (50000, 1000),
        (100000, 2000),
        (200000, 3500),
        (500000, 5000),
        (1000000, 10000),
        (float("inf"), 40000),
    ],
    "preorder_extra_pct": 0.03,
    "processing_fee": 1250,  # per pesanan terkirim
}

LAZADA_FEES = {
    "name": "Lazada",
    "categories": {
        "fashion":      {"label": "Fashion",              "komisi_pct": 0.06, "komisi_max": 20000},
        "elektronik":   {"label": "Elektronik",           "komisi_pct": 0.06, "komisi_max": 20000},
        "suplemen":     {"label": "Suplemen",             "komisi_pct": 0.04, "komisi_max": 20000},
        "elektronik_hi":{"label": "Elektronik Premium",   "komisi_pct": 0.06, "komisi_max": 20000},
        "perhiasan":    {"label": "Perhiasan",            "komisi_pct": 0.06, "komisi_max": 20000},
        "digital":      {"label": "Digital",              "komisi_pct": 0.04, "komisi_max": 10000},
    },
    "processing_pct": 0.02,    # 2% biaya proses pesanan
    "preorder_extra_pct": 0.0,
}

TIKTOK_FEES = {
    "name": "TikTok Shop",
    "categories": {
        "fashion":      {"label": "Fashion",              "komisi": 0.08},
        "elektronik":   {"label": "Elektronik",           "komisi": 0.06},
        "suplemen":     {"label": "Suplemen",             "komisi": 0.06},
        "elektronik_hi":{"label": "Elektronik Premium",   "komisi": 0.06},
        "perhiasan":    {"label": "Perhiasan",            "komisi": 0.08},
        "digital":      {"label": "Digital",              "komisi": 0.05},
    },
    "service_fee_pct": 0.03,   # biaya layanan
    "preorder_extra_pct": 0.03,
    "processing_fee": 1250,    # per pesanan
}

BUKALAPAK_FEES = {
    "name": "Bukalapak",
    "categories": {
        "fashion":      {"label": "Fashion",              "admin": 0.065},
        "elektronik":   {"label": "Elektronik",           "admin": 0.065},
        "suplemen":     {"label": "Suplemen",             "admin": 0.065},
        "elektronik_hi":{"label": "Elektronik Premium",   "admin": 0.055},
        "perhiasan":    {"label": "Perhiasan",            "admin": 0.055},
        "digital":      {"label": "Digital",              "admin": 0.03},
    },
    "processing_fee": 1000,
    "preorder_extra_pct": 0.0,
}

BLIBLI_FEES = {
    "name": "Blibli",
    "categories": {
        "fashion":      {"label": "Fashion",              "komisi": 0.065},
        "elektronik":   {"label": "Elektronik",           "komisi": 0.045},
        "suplemen":     {"label": "Suplemen",             "komisi": 0.055},
        "elektronik_hi":{"label": "Elektronik Premium",   "komisi": 0.045},
        "perhiasan":    {"label": "Perhiasan",            "komisi": 0.05},
        "digital":      {"label": "Digital",              "komisi": 0.03},
    },
    "processing_fee": 1250,
    "preorder_extra_pct": 0.0,
}

MARKETPLACES = [SHOPEE_FEES, TOKOPEDIA_FEES, LAZADA_FEES, TIKTOK_FEES, BUKALAPAK_FEES, BLIBLI_FEES]
CATEGORIES = ["fashion", "elektronik", "suplemen", "elektronik_hi", "perhiasan", "digital"]

# ============================================================
# ANSI colors
# ============================================================
RST = "\033[0m"
B = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
MAG = "\033[35m"

# ============================================================
# Calculation
# ============================================================

def tokopedia_dinamis(price):
    for batas, biaya in TOKOPEDIA_FEES["komisi_dinamis_tiers"]:
        if price <= batas:
            return min(biaya, TOKOPEDIA_FEES["komisi_dinamis_max"])
    return TOKOPEDIA_FEES["komisi_dinamis_max"]


def calc_shopee(price, kategori, is_preorder=False, free_ongkir=False):
    cat = SHOPEE_FEES["categories"][kategori]
    breakdown = []
    total = 0

    admin = price * cat["admin"]
    breakdown.append(("Biaya Admin", cat["admin"], admin))
    total += admin

    if is_preorder:
        po = price * SHOPEE_FEES["preorder_extra_pct"]
        breakdown.append(("Pre-order (+3%)", SHOPEE_FEES["preorder_extra_pct"], po))
        total += po

    if free_ongkir:
        fo = price * SHOPEE_FEES["free_ongkir_extra_pct"]
        breakdown.append(("Gratis Ongkir Xtra (+2%)", SHOPEE_FEES["free_ongkir_extra_pct"], fo))
        total += fo

    return total, breakdown


def calc_tokopedia(price, kategori, is_preorder=False):
    cat = TOKOPEDIA_FEES["categories"][kategori]
    breakdown = []
    total = 0

    komisi = price * cat["komisi_platform"]
    breakdown.append(("Komisi Platform", cat["komisi_platform"], komisi))
    total += komisi

    dinamis = tokopedia_dinamis(price)
    rate = dinamis / price if price > 0 else 0
    breakdown.append(("Komisi Dinamis", rate, dinamis))
    total += dinamis

    proc = TOKOPEDIA_FEES["processing_fee"]
    breakdown.append(("Biaya Pemrosesan", None, proc))
    total += proc

    if is_preorder:
        po = price * TOKOPEDIA_FEES["preorder_extra_pct"]
        breakdown.append(("Pre-order (+3%)", TOKOPEDIA_FEES["preorder_extra_pct"], po))
        total += po

    return total, breakdown


def calc_lazada(price, kategori, is_preorder=False):
    cat = LAZADA_FEES["categories"][kategori]
    breakdown = []
    total = 0

    komisi_raw = price * cat["komisi_pct"]
    komisi = min(komisi_raw, cat["komisi_max"])
    rate = komisi / price if price > 0 else 0
    breakdown.append(("Komisi", rate, komisi))
    total += komisi

    proc = price * LAZADA_FEES["processing_pct"]
    breakdown.append(("Biaya Proses (2%)", LAZADA_FEES["processing_pct"], proc))
    total += proc

    return total, breakdown


def calc_tiktok(price, kategori, is_preorder=False):
    cat = TIKTOK_FEES["categories"][kategori]
    breakdown = []
    total = 0

    komisi = price * cat["komisi"]
    breakdown.append(("Komisi", cat["komisi"], komisi))
    total += komisi

    svc = price * TIKTOK_FEES["service_fee_pct"]
    breakdown.append(("Biaya Layanan (3%)", TIKTOK_FEES["service_fee_pct"], svc))
    total += svc

    proc = TIKTOK_FEES["processing_fee"]
    breakdown.append(("Biaya Pemrosesan", None, proc))
    total += proc

    if is_preorder:
        po = price * TIKTOK_FEES["preorder_extra_pct"]
        breakdown.append(("Pre-order (+3%)", TIKTOK_FEES["preorder_extra_pct"], po))
        total += po

    return total, breakdown


def calc_bukalapak(price, kategori, is_preorder=False):
    cat = BUKALAPAK_FEES["categories"][kategori]
    breakdown = []
    total = 0

    admin = price * cat["admin"]
    breakdown.append(("Biaya Admin", cat["admin"], admin))
    total += admin

    proc = BUKALAPAK_FEES["processing_fee"]
    breakdown.append(("Biaya Pemrosesan", None, proc))
    total += proc

    return total, breakdown


def calc_blibli(price, kategori, is_preorder=False):
    cat = BLIBLI_FEES["categories"][kategori]
    breakdown = []
    total = 0

    komisi = price * cat["komisi"]
    breakdown.append(("Komisi", cat["komisi"], komisi))
    total += komisi

    proc = BLIBLI_FEES["processing_fee"]
    breakdown.append(("Biaya Pemrosesan", None, proc))
    total += proc

    return total, breakdown


CALC_MAP = {
    "Shopee": calc_shopee,
    "Tokopedia": calc_tokopedia,
    "Lazada": calc_lazada,
    "TikTok Shop": calc_tiktok,
    "Bukalapak": calc_bukalapak,
    "Blibli": calc_blibli,
}


def fmt_rp(n):
    """Format number as Rp X.XXX"""
    if n >= 1_000_000:
        return f"Rp {n/1_000_000:,.2f}jt".replace(",", ".")
    return f"Rp {n:,.0f}".replace(",", ".")


def fmt_pct(n):
    if n is None:
        return "-"
    return f"{n*100:.2f}%"


# ============================================================
# Display
# ============================================================

def show_breakdown(name, price, modal, total_fee, breakdown, is_preorder=False, free_ongkir=False):
    net = price - total_fee
    profit = net - modal if modal else net
    fee_pct = (total_fee / price * 100) if price > 0 else 0

    print(f"\n{B}{CYAN}{'='*50}{RST}")
    print(f"{B}  {name}{RST}")
    if is_preorder:
        print(f"  {DIM}(pre-order aktif){RST}")
    if free_ongkir:
        print(f"  {DIM}(gratis ongkir Xtra){RST}")
    print(f"{B}{CYAN}{'='*50}{RST}")

    print(f"\n  Harga Jual:      {B}{fmt_rp(price)}{RST}")
    if modal:
        print(f"  Modal:           {fmt_rp(modal)}")

    print(f"\n  {B}Breakdown:{RST}")
    for label, rate, amount in breakdown:
        rate_str = f" ({fmt_pct(rate)})" if rate else ""
        print(f"    {label:<28}{rate_str:<12} {RED}-{fmt_rp(amount)}{RST}")

    print(f"  {'─'*46}")
    print(f"  {B}Total Potongan:{RST}  {YELLOW}{fmt_rp(total_fee)}{RST}  ({fee_pct:.1f}%)")
    print(f"  {B}Diterima Bersih:{RST} {GREEN}{fmt_rp(net)}{RST}")

    if modal:
        print(f"  {B}Profit:{RST}          {GREEN if profit >= 0 else RED}{fmt_rp(profit)}{RST}")
        margin = (profit / price * 100) if price > 0 else 0
        print(f"  {B}Margin:{RST}          {GREEN if margin >= 0 else RED}{margin:.1f}%{RST}")


def show_comparison(price, modal, kategori, is_preorder, free_ongkir):
    print(f"\n{B}{'='*70}{RST}")
    print(f"{B}  PERBANDINGAN FEE MARKETPLACE - {fmt_rp(price)}{RST}")
    print(f"  Kategori: {kategori} | Pre-order: {'Ya' if is_preorder else 'Tidak'}")
    print(f"{B}{'='*70}{RST}")

    results = []
    for mp in MARKETPLACES:
        name = mp["name"]
        fn = CALC_MAP[name]
        kwargs = {"is_preorder": is_preorder}
        if name == "Shopee":
            kwargs["free_ongkir"] = free_ongkir
        total, _ = fn(price, kategori, **kwargs)
        net = price - total
        profit = net - (modal or 0)
        fee_pct = total / price * 100 if price > 0 else 0
        results.append((name, total, fee_pct, net, profit))

    # Sort by profit (highest first)
    results.sort(key=lambda x: x[4], reverse=True)

    # Table header
    print(f"\n  {'Rank':<5} {'Marketplace':<15} {'Potongan':<14} {'Fee %':<8} {'Diterima':<14}", end="")
    if modal:
        print(f" {'Profit':<14} {'Margin':<8}")
    else:
        print()
    print(f"  {'─'*5} {'─'*14} {'─'*13} {'─'*7} {'─'*13}", end="")
    if modal:
        print(f" {'─'*13} {'─'*7}")
    else:
        print()

    for i, (name, total, fee_pct, net, profit) in enumerate(results, 1):
        rank = f"  {i}."
        profit_str = ""
        margin_str = ""
        if modal:
            margin = (profit / price * 100) if price > 0 else 0
            color = GREEN if profit >= 0 else RED
            profit_str = f" {color}{fmt_rp(profit)}{RST}"
            margin_str = f" {color}{margin:.1f}%{RST}"

        color_fee = GREEN if fee_pct < 10 else YELLOW if fee_pct < 15 else RED
        print(f"  {rank:<5} {name:<15} {color_fee}{fmt_rp(total)}{RST}{'':>{14-len(fmt_rp(total))}} {fee_pct:.1f}%{'':<3} {GREEN}{fmt_rp(net)}{RST}{'':>{14-len(fmt_rp(net))}}{profit_str}{'':<6}{margin_str}")

    best = results[0]
    worst = results[-1]
    diff = worst[1] - best[1]
    print(f"\n  {B}Best:{RST} {GREEN}{best[0]}{RST} (hemat {fmt_rp(diff)} vs terburuk)")


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Hitung fee marketplace Indonesia 2026",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Contoh:
  %(prog)s 200000                              # semua marketplace
  %(prog)s 200000 --marketplace shopee          # Shopee saja
  %(prog)s 200000 --compare --modal 100000      # perbandingan + profit
  %(prog)s 200000 --kategori fashion --preorder # fashion + pre-order
        """,
    )
    parser.add_argument("harga", type=int, help="Harga jual produk (Rp)")
    parser.add_argument("--modal", type=int, default=0, help="Modal/harga beli (Rp)")
    parser.add_argument("--kategori", "-k", choices=CATEGORIES, default="fashion",
                        help="Kategori produk (default: fashion)")
    parser.add_argument("--marketplace", "-m", type=str, help="Marketplace spesifik")
    parser.add_argument("--compare", "-c", action="store_true", help="Tabel perbandingan")
    parser.add_argument("--preorder", "-p", action="store_true", help="Produk pre-order")
    parser.add_argument("--free-ongkir", action="store_true", help="Ikut program gratis ongkir (Shopee)")

    args = parser.parse_args()

    if args.harga <= 0:
        print(f"{RED}Error: harga harus > 0{RST}", file=sys.stderr)
        sys.exit(1)

    print(f"\n{B}{MAG}Marketplace Fee Calculator - Indonesia 2026{RST}")
    print(f"{DIM}Data: webekspor.com, jangkar.io, traksee.com (Apr-Jun 2026){RST}")

    if args.compare:
        show_comparison(args.harga, args.modal, args.kategori, args.preorder, args.free_ongkir)
        return

    targets = MARKETPLACES
    if args.marketplace:
        name_lower = args.marketplace.lower()
        targets = [mp for mp in MARKETPLACES if name_lower in mp["name"].lower()]
        if not targets:
            print(f"{RED}Marketplace '{args.marketplace}' tidak ditemukan.{RST}")
            print(f"  Tersedia: {', '.join(mp['name'] for mp in MARKETPLACES)}")
            sys.exit(1)

    for mp in targets:
        name = mp["name"]
        fn = CALC_MAP[name]
        kwargs = {"is_preorder": args.preorder}
        if name == "Shopee":
            kwargs["free_ongkir"] = args.free_ongkir
        total, breakdown = fn(args.harga, args.kategori, **kwargs)
        show_breakdown(name, args.harga, args.modal, total, breakdown,
                       is_preorder=args.preorder, free_ongkir=args.free_ongkir)


if __name__ == "__main__":
    main()
