"""Output helpers for the free shipping threshold calculator."""

import csv
import io
import json
from dataclasses import asdict
from typing import List, Optional

from ongkir import ThresholdResult


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


def _line(label: str, value: str) -> str:
    return f"{label:<28}: {value}"


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
        lines.append("  ".join(cells).rstrip())
    return lines


def _threshold_text(value: Optional[int]) -> str:
    if value is None:
        return "Tidak tercapai"
    return format_rupiah(value)


def _gap_text(value: Optional[int]) -> str:
    if value is None:
        return "Tidak tercapai"
    return format_signed_rupiah(value)


def render_text(result: ThresholdResult) -> str:
    config = result.config
    lines = [
        "Kalkulator Ambang Gratis Ongkir",
        "===============================",
        _line("Ambang sekarang", format_rupiah(config.order_value)),
        _line("HPP per pesanan", format_rupiah(config.hpp)),
        _line("Komisi marketplace", format_pct(config.fee_pct)),
        _line("Biaya tetap", format_rupiah(config.fixed_fee)),
        _line("Kemasan", format_rupiah(config.packaging)),
        _line("Ongkir ditanggung seller", format_rupiah(config.shipping_cost)),
        _line("Subsidi ongkir platform", format_rupiah(config.shipping_subsidy)),
        _line("Ongkir netto", format_rupiah(result.net_shipping)),
        _line("Target margin", format_pct(config.target_margin_pct)),
        _line("Pesanan per bulan", format_number(config.monthly_orders)),
        _line("Porsi pesanan gratis", format_pct(config.free_share_pct)),
        "",
        "Pesanan di ambang sekarang:",
        _line("Omzet", format_rupiah(config.order_value)),
        _line("Komisi marketplace", format_rupiah(result.commission)),
        _line("HPP", format_rupiah(config.hpp)),
        _line(
            "Biaya tetap + kemasan",
            format_rupiah(config.fixed_fee + config.packaging),
        ),
        _line("Ongkir netto", format_rupiah(result.net_shipping)),
        _line("Profit tanpa gratis ongkir", format_rupiah(result.normal_profit)),
        _line("Margin tanpa gratis ongkir", format_pct(result.normal_margin_pct)),
        _line("Profit dengan gratis ongkir", format_rupiah(result.free_profit)),
        _line("Margin dengan gratis ongkir", format_pct(result.free_margin_pct)),
        _line("Status", result.status),
        "",
        "Ambang minimum:",
        _line("Titik impas", _threshold_text(result.break_even_threshold)),
        _line("Target margin", _threshold_text(result.target_threshold)),
        _line("Ambang sekarang", format_rupiah(config.order_value)),
        _line("Selisih ke target", _gap_text(result.gap_to_target)),
        _line("Batas ongkir aman", format_rupiah(result.safe_shipping_limit)),
        _line("Sisa ruang ongkir", format_signed_rupiah(result.shipping_headroom)),
        "",
        "Proyeksi bulanan:",
        _line(
            "Pesanan gratis",
            f"{format_number(result.monthly_free_orders)} dari "
            f"{format_number(config.monthly_orders)}",
        ),
        _line("Omzet pesanan gratis", format_rupiah(result.monthly_revenue)),
        _line(
            "Beban ongkir program",
            f"{format_rupiah(result.monthly_shipping_cost)} "
            f"({format_pct(result.monthly_shipping_share_pct)} dari omzet)",
        ),
        _line("Profit pesanan gratis", format_rupiah(result.monthly_free_profit)),
        _line("Profit tanpa ongkir", format_rupiah(result.monthly_no_ship_profit)),
        _line("Biaya program", format_signed_rupiah(result.monthly_program_cost)),
        _line("Kekurangan dari target", format_rupiah(result.monthly_shortfall)),
        "",
        "Sensitivitas ongkir:",
    ]

    rows = []
    for scenario in result.scenarios:
        rows.append([
            scenario.label,
            format_rupiah(scenario.net_shipping),
            _threshold_text(scenario.target_threshold),
            format_rupiah(scenario.profit),
            format_pct(scenario.margin_pct),
            scenario.status,
        ])
    lines.extend(_table(
        ["Skenario", "Ongkir netto", "Ambang target", "Profit sekarang",
         "Margin", "Status"],
        rows,
        ["left", "right", "right", "right", "right", "left"],
    ))

    lines.extend(["", "Catatan:"])
    if result.warnings:
        lines.extend(f"- {warning}" for warning in result.warnings)
    else:
        lines.append("- Tidak ada peringatan.")
    return "\n".join(lines)


def build_json(result: ThresholdResult) -> str:
    return json.dumps(asdict(result), ensure_ascii=False, indent=2)


def build_csv(result: ThresholdResult) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow([
        "jenis", "label", "ambang", "ongkir_netto", "komisi", "profit",
        "margin_persen", "status", "ambang_target", "ambang_impas",
        "pesanan_gratis_bulanan", "beban_ongkir_bulanan",
    ])
    writer.writerow([
        "ringkasan",
        "ambang-sekarang",
        result.config.order_value,
        result.net_shipping,
        result.commission,
        result.free_profit,
        f"{result.free_margin_pct:.2f}",
        result.status,
        result.target_threshold if result.target_threshold is not None else "",
        result.break_even_threshold
        if result.break_even_threshold is not None else "",
        result.monthly_free_orders,
        result.monthly_shipping_cost,
    ])
    for scenario in result.scenarios:
        writer.writerow([
            "skenario-ongkir",
            scenario.label,
            "",
            scenario.net_shipping,
            "",
            scenario.profit,
            f"{scenario.margin_pct:.2f}",
            scenario.status,
            scenario.target_threshold
            if scenario.target_threshold is not None else "",
            "",
            "",
            "",
        ])
    return buffer.getvalue()
