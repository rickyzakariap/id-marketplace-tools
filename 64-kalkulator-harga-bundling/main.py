"""CLI entry point for the bundle pricing calculator."""

import argparse
import sys
from typing import List, Optional

from bundling import (
    DEFAULT_ITEM_SPECS,
    BundleConfig,
    Item,
    calculate_bundle,
    parse_item,
)
from report import build_csv, build_json, render_text


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kalkulator-harga-bundling",
        description=(
            "Hitung profit, margin, harga minimum, dan perbandingan jual "
            "terpisah untuk paket bundling."
        ),
        epilog=(
            "Contoh: python3 main.py --item 'Kaos:45000:75000:1' "
            "--item 'Topi:20000:35000:1' --harga-bundling 95000"
        ),
    )
    parser.add_argument(
        "--item",
        action="append",
        metavar="NAMA:HPP:HARGA:QTY",
        help=(
            "Satu item bundling, boleh diulang. Default memakai tiga item "
            "contoh bila tidak diisi."
        ),
    )
    parser.add_argument(
        "--harga-bundling", type=int, default=139000,
        help="Harga jual paket bundling dalam rupiah (default: 139000).",
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
        "--kemasan", type=int, default=2000,
        help="Biaya kemasan per pesanan (default: 2000).",
    )
    parser.add_argument(
        "--subsidi-ongkir", type=int, default=5000,
        help="Subsidi ongkir per pesanan (default: 5000).",
    )
    parser.add_argument(
        "--target-margin", type=float, default=12.0,
        help="Target margin bersih dalam persen (default: 12).",
    )
    parser.add_argument(
        "--bundling-bulanan", type=int, default=40,
        help="Jumlah bundling per bulan untuk proyeksi (default: 40).",
    )
    output = parser.add_mutually_exclusive_group()
    output.add_argument(
        "--json", action="store_true", help="Cetak hasil sebagai JSON."
    )
    output.add_argument(
        "--csv", action="store_true", help="Cetak hasil sebagai CSV."
    )
    return parser


def parse_items(specs: List[str]) -> List[Item]:
    return [parse_item(spec) for spec in specs]


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    specs = args.item if args.item else list(DEFAULT_ITEM_SPECS)
    try:
        items = parse_items(specs)
        config = BundleConfig(
            bundle_price=args.harga_bundling,
            fee_pct=args.komisi,
            fixed_fee=args.biaya_tetap,
            packaging=args.kemasan,
            shipping_subsidy=args.subsidi_ongkir,
            target_margin_pct=args.target_margin,
            monthly_bundles=args.bundling_bulanan,
        )
        result = calculate_bundle(items, config)
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
