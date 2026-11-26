"""CLI entry point for the free shipping threshold calculator."""

import argparse
import sys
from typing import List, Optional

from ongkir import ThresholdConfig, calculate_threshold
from report import build_csv, build_json, render_text


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kalkulator-ambang-gratis-ongkir",
        description=(
            "Hitung ambang gratis ongkir minimum agar target margin tetap "
            "tercapai, plus proyeksi biaya program per bulan."
        ),
        epilog=(
            "Contoh: python3 main.py --ambang 150000 --ongkir 18000 "
            "--subsidi 4000 --target-margin 15"
        ),
    )
    parser.add_argument(
        "--ambang", type=int, default=150000,
        help="Ambang gratis ongkir saat ini dalam rupiah (default: 150000).",
    )
    parser.add_argument(
        "--hpp", type=int, default=90000,
        help="HPP per pesanan dalam rupiah (default: 90000).",
    )
    parser.add_argument(
        "--komisi", type=float, default=8.0,
        help="Komisi marketplace dalam persen (default: 8).",
    )
    parser.add_argument(
        "--biaya-tetap", type=int, default=1250,
        help="Biaya tetap marketplace per pesanan (default: 1250).",
    )
    parser.add_argument(
        "--kemasan", type=int, default=2500,
        help="Biaya kemasan per pesanan (default: 2500).",
    )
    parser.add_argument(
        "--ongkir", type=int, default=18000,
        help="Ongkir yang ditanggung seller per pesanan gratis (default: 18000).",
    )
    parser.add_argument(
        "--subsidi", type=int, default=4000,
        help="Subsidi ongkir dari platform per pesanan (default: 4000).",
    )
    parser.add_argument(
        "--target-margin", type=float, default=15.0,
        help="Target margin bersih dalam persen (default: 15).",
    )
    parser.add_argument(
        "--pesanan-bulanan", type=int, default=300,
        help="Jumlah pesanan per bulan untuk proyeksi (default: 300).",
    )
    parser.add_argument(
        "--persen-gratis", type=float, default=40.0,
        help="Porsi pesanan yang memakai gratis ongkir, 0 sampai 100 "
             "(default: 40).",
    )
    output = parser.add_mutually_exclusive_group()
    output.add_argument(
        "--json", action="store_true", help="Cetak hasil sebagai JSON."
    )
    output.add_argument(
        "--csv", action="store_true", help="Cetak hasil sebagai CSV."
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    config = ThresholdConfig(
        order_value=args.ambang,
        hpp=args.hpp,
        fee_pct=args.komisi,
        fixed_fee=args.biaya_tetap,
        packaging=args.kemasan,
        shipping_cost=args.ongkir,
        shipping_subsidy=args.subsidi,
        target_margin_pct=args.target_margin,
        monthly_orders=args.pesanan_bulanan,
        free_share_pct=args.persen_gratis,
    )
    try:
        result = calculate_threshold(config)
    except ValueError as exc:
        parser.error(str(exc))

    if args.json:
        print(build_json(result))
    elif args.csv:
        sys.stdout.write(build_csv(result))
    else:
        print(render_text(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
