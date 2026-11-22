"""Output helpers for the bundle pricing calculator."""

import csv
import io
import json
from typing import List, Optional

from bundling import BundleResult


def format_number(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def format_rupiah(value: int) -> str:
    if value < 0:
        return "-Rp " + format_number(abs(value))
    return "Rp " + format_number(value)


def format_signed_rupiah(value: int) -> str:
    if value > 0:
        return "+Rp " + format_number(value)
    if value < 0:
        return "-Rp " + format_number(abs(value))
    return "Rp 0"


def format_pct(value: float) -> str:
    return f"{value:.2f}".replace(".", ",") + "%"


def _shorten(text: str, width: int = 28) -> str:
    if len(text) <= width:
        return text
    return text[: width - 3] + "..."


def _table(headers: List[str], rows: List[List[str]],
           aligns: List[str]) -> List[str]:
    widths = [len(header) for header in headers]
    for row in rows:
        for index, cell in enumerate(row):
            widths[index] = max(widths[index], len(cell))
    lines = []
    header_cells = []
    for index, header in enumerate(headers):
        if aligns[index] == "left":
            header_cells.append(header.ljust(widths[index]))
        else:
            header_cells.append(header.rjust(widths[index]))
    lines.append("  ".join(header_cells))
    for row in rows:
        cells = []
        for index, cell in enumerate(row):
            if aligns[index] == "left":
                cells.append(cell.ljust(widths[index]))
            else:
                cells.append(cell.rjust(widths[index]))
        lines.append("  ".join(cells))
    return lines


def _line(label: str, value: str) -> str:
    return f"{label:<22}: {value}"


def _minimum_line(result: BundleResult) -> str:
    if result.minimum_price is None:
        return _line("Harga minimum", "Tidak tercapai")
    return _line("Harga minimum", format_rupiah(result.minimum_price))


def _max_discount_line(result: BundleResult) -> str:
    if result.max_discount is None or result.max_discount_pct is None:
        return _line("Diskon maksimum", "Tidak tercapai")
    return _line(
        "Diskon maksimum",
        f"{format_rupiah(result.max_discount)} "
        f"({format_pct(result.max_discount_pct)})",
    )


def _room_line(result: BundleResult) -> str:
    if result.room_to_minimum is None:
        return _line("Ruang harga sekarang", "Tidak tercapai")
    return _line(
        "Ruang harga sekarang", format_signed_rupiah(result.room_to_minimum)
    )


def render_text(result: BundleResult) -> str:
    config = result.config
    lines = [
        "Kalkulator Harga Bundling",
        "=========================",
        _line("Harga bundling", format_rupiah(config.bundle_price)),
        _line("Total harga eceran", format_rupiah(result.retail_total)),
        _line(
            "Diskon bundling",
            f"{format_rupiah(result.discount)} "
            f"({format_pct(result.discount_pct)})",
        ),
        _line("HPP total", format_rupiah(result.goods_cost)),
        _line(
            "Komisi marketplace",
            f"{format_pct(config.fee_pct)} ({format_rupiah(result.commission)})",
        ),
        _line("Biaya tetap", format_rupiah(config.fixed_fee)),
        _line("Kemasan", format_rupiah(config.packaging)),
        _line("Subsidi ongkir", format_rupiah(config.shipping_subsidy)),
        _line("Target margin", format_pct(config.target_margin_pct)),
        _line("Bundling per bulan", format_number(config.monthly_bundles)),
        "",
        "Isi bundling:",
    ]

    rows = []
    for analysis in result.item_analysis:
        rows.append([
            _shorten(analysis.item.name),
            format_number(analysis.item.quantity),
            format_rupiah(analysis.item.unit_cost),
            format_rupiah(analysis.item.retail_price),
            format_rupiah(analysis.retail_value),
            format_rupiah(analysis.allocated_revenue),
            format_rupiah(analysis.contribution),
        ])
    rows.append([
        "Total",
        format_number(result.total_quantity),
        "-",
        "-",
        format_rupiah(result.retail_total),
        format_rupiah(config.bundle_price),
        format_rupiah(result.profit),
    ])
    lines.extend(_table(
        ["Item", "Qty", "HPP/pcs", "Eceran/pcs", "Nilai eceran",
         "Alokasi omzet", "Kontribusi"],
        rows,
        ["left", "right", "right", "right", "right", "right", "right"],
    ))

    lines.extend([
        "",
        "Hasil per bundling:",
        _line("Omzet", format_rupiah(config.bundle_price)),
        _line("Biaya barang", format_rupiah(result.goods_cost)),
        _line("Potongan platform", format_rupiah(result.platform_deduction)),
        _line("Total biaya", format_rupiah(result.total_cost)),
        _line("Profit", format_rupiah(result.profit)),
        _line("Margin", format_pct(result.margin_pct)),
        _line("Status", result.status),
        _minimum_line(result),
        _max_discount_line(result),
        _room_line(result),
        "",
        "Perbandingan jual terpisah:",
        _line("Profit terpisah", format_rupiah(result.separate_profit)),
        _line("Selisih", format_signed_rupiah(result.profit_difference)),
        _line("Biaya pesanan dihemat", format_rupiah(result.saved_order_cost)),
        _line("Diskon diberikan", format_rupiah(result.discount)),
        "",
        f"Proyeksi bulanan ({format_number(config.monthly_bundles)} bundling):",
        _line("Profit bundling", format_rupiah(result.monthly_bundle_profit)),
        _line("Profit terpisah", format_rupiah(result.monthly_separate_profit)),
        _line("Selisih bulanan", format_signed_rupiah(result.monthly_difference)),
        "",
        "Catatan:",
    ])
    if result.warnings:
        lines.extend(f"- {warning}" for warning in result.warnings)
    else:
        lines.append("- Tidak ada peringatan.")
    return "\n".join(lines)


def build_json(result: BundleResult) -> str:
    config = result.config
    payload = {
        "config": {
            "bundle_price": config.bundle_price,
            "fee_pct": config.fee_pct,
            "fixed_fee": config.fixed_fee,
            "packaging": config.packaging,
            "shipping_subsidy": config.shipping_subsidy,
            "target_margin_pct": config.target_margin_pct,
            "monthly_bundles": config.monthly_bundles,
        },
        "items": [
            {
                "name": item.name,
                "quantity": item.quantity,
                "unit_cost": item.unit_cost,
                "retail_price": item.retail_price,
                "retail_value": item.retail_price * item.quantity,
            }
            for item in result.items
        ],
        "totals": {
            "total_quantity": result.total_quantity,
            "goods_cost": result.goods_cost,
            "retail_total": result.retail_total,
            "discount": result.discount,
            "discount_pct": result.discount_pct,
            "commission": result.commission,
            "platform_deduction": result.platform_deduction,
            "total_cost": result.total_cost,
            "profit": result.profit,
            "margin_pct": result.margin_pct,
            "status": result.status,
            "minimum_price": result.minimum_price,
            "max_discount": result.max_discount,
            "max_discount_pct": result.max_discount_pct,
            "room_to_minimum": result.room_to_minimum,
        },
        "item_analysis": [
            {
                "name": analysis.item.name,
                "quantity": analysis.item.quantity,
                "retail_value": analysis.retail_value,
                "allocated_revenue": analysis.allocated_revenue,
                "allocated_fee": analysis.allocated_fee,
                "contribution": analysis.contribution,
            }
            for analysis in result.item_analysis
        ],
        "comparison": {
            "separate_profit": result.separate_profit,
            "profit_difference": result.profit_difference,
            "saved_order_cost": result.saved_order_cost,
            "discount_given": result.discount,
        },
        "monthly": {
            "bundles": config.monthly_bundles,
            "bundle_profit": result.monthly_bundle_profit,
            "separate_profit": result.monthly_separate_profit,
            "difference": result.monthly_difference,
        },
        "warnings": result.warnings,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _csv_number(value: Optional[int]) -> str:
    if value is None:
        return ""
    return str(value)


def build_csv(result: BundleResult) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow([
        "jenis", "nama", "qty", "hpp_per_pcs", "harga_eceran_per_pcs",
        "nilai_eceran", "alokasi_omzet", "kontribusi", "omzet_bundling",
        "profit_bundling", "margin_persen", "status", "harga_minimum",
        "diskon_maksimum", "profit_terpisah", "selisih", "profit_bulanan",
    ])
    writer.writerow([
        "ringkasan", "", result.total_quantity, "", "",
        result.retail_total, result.config.bundle_price, result.profit,
        result.config.bundle_price, result.profit,
        f"{result.margin_pct:.2f}", result.status,
        _csv_number(result.minimum_price), _csv_number(result.max_discount),
        result.separate_profit, result.profit_difference,
        result.monthly_bundle_profit,
    ])
    for analysis in result.item_analysis:
        writer.writerow([
            "item", analysis.item.name, analysis.item.quantity,
            analysis.item.unit_cost, analysis.item.retail_price,
            analysis.retail_value, analysis.allocated_revenue,
            analysis.contribution, "", "", "", "", "", "", "", "", "",
        ])
    return buffer.getvalue()
