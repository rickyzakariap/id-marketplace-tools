"""Pure logic for the free shipping threshold calculator.

All money values are integer rupiah. Percentages use float values such as 8.0
for eight percent. The module has no I/O so it can be tested directly.
"""

import math
from dataclasses import dataclass, replace
from typing import List, Optional

MAX_PRICE = 10**12
THRESHOLD_STEP = 1000

STATUS_SAFE = "Aman"
STATUS_THIN = "Tipis"
STATUS_LOSS = "Rugi"

SHIPPING_MULTIPLIERS = (
    (80, "Ongkir turun 20%"),
    (100, "Sesuai input"),
    (120, "Ongkir naik 20%"),
)


@dataclass(frozen=True)
class ThresholdConfig:
    order_value: int
    hpp: int
    fee_pct: float
    fixed_fee: int
    packaging: int
    shipping_cost: int
    shipping_subsidy: int
    target_margin_pct: float
    monthly_orders: int
    free_share_pct: float


@dataclass(frozen=True)
class ShippingScenario:
    label: str
    multiplier_pct: int
    net_shipping: int
    target_threshold: Optional[int]
    profit: int
    margin_pct: float
    status: str


@dataclass(frozen=True)
class ThresholdResult:
    config: ThresholdConfig
    net_shipping: int
    commission: int
    normal_profit: int
    normal_margin_pct: float
    free_profit: int
    free_margin_pct: float
    target_profit: float
    shortfall_per_order: int
    status: str
    break_even_threshold: Optional[int]
    target_threshold: Optional[int]
    gap_to_target: Optional[int]
    safe_shipping_limit: int
    shipping_headroom: int
    monthly_free_orders: int
    monthly_revenue: int
    monthly_shipping_cost: int
    monthly_shipping_share_pct: float
    monthly_free_profit: int
    monthly_no_ship_profit: int
    monthly_program_cost: int
    monthly_shortfall: int
    scenarios: List[ShippingScenario]
    warnings: List[str]


def round_rupiah(value: float) -> int:
    """Round a non-negative rupiah value half up."""
    return int(math.floor(value + 0.5))


def format_percent(value: float) -> str:
    """Format a percentage with an Indonesian decimal comma."""
    return f"{value:.2f}".replace(".", ",")


def format_rupiah(value: int) -> str:
    """Format an integer rupiah value with Indonesian thousands dots."""
    return "Rp " + f"{value:,}".replace(",", ".")


def validate_config(config: ThresholdConfig) -> None:
    if config.order_value <= 0:
        raise ValueError("Ambang pesanan harus lebih dari 0.")
    if config.order_value > MAX_PRICE:
        raise ValueError("Ambang pesanan terlalu besar.")
    if config.hpp < 0:
        raise ValueError("HPP tidak boleh negatif.")
    if config.hpp > MAX_PRICE:
        raise ValueError("HPP terlalu besar.")
    if config.fee_pct < 0 or config.fee_pct >= 100:
        raise ValueError(
            "Komisi marketplace harus di antara 0 dan kurang dari 100 persen."
        )
    if not math.isfinite(config.fee_pct):
        raise ValueError("Komisi marketplace harus angka yang valid.")
    if config.fixed_fee < 0:
        raise ValueError("Biaya tetap tidak boleh negatif.")
    if config.fixed_fee > MAX_PRICE:
        raise ValueError("Biaya tetap terlalu besar.")
    if config.packaging < 0:
        raise ValueError("Biaya kemasan tidak boleh negatif.")
    if config.packaging > MAX_PRICE:
        raise ValueError("Biaya kemasan terlalu besar.")
    if config.shipping_cost < 0:
        raise ValueError("Ongkir tidak boleh negatif.")
    if config.shipping_cost > MAX_PRICE:
        raise ValueError("Ongkir terlalu besar.")
    if config.shipping_subsidy < 0:
        raise ValueError("Subsidi ongkir tidak boleh negatif.")
    if config.shipping_subsidy > MAX_PRICE:
        raise ValueError("Subsidi ongkir terlalu besar.")
    if config.target_margin_pct < 0 or config.target_margin_pct >= 100:
        raise ValueError(
            "Target margin harus di antara 0 dan kurang dari 100 persen."
        )
    if not math.isfinite(config.target_margin_pct):
        raise ValueError("Target margin harus angka yang valid.")
    if config.fee_pct + config.target_margin_pct >= 100:
        raise ValueError(
            "Komisi ditambah target margin harus kurang dari 100 persen."
        )
    if config.monthly_orders < 0:
        raise ValueError("Jumlah pesanan per bulan tidak boleh negatif.")
    if config.free_share_pct < 0 or config.free_share_pct > 100:
        raise ValueError("Porsi pesanan gratis harus di antara 0 dan 100 persen.")
    if not math.isfinite(config.free_share_pct):
        raise ValueError("Porsi pesanan gratis harus angka yang valid.")


def status_for(profit: int, order_value: int, target_margin_pct: float) -> str:
    """Return the status of an order at the given value and target margin."""
    if profit < 0:
        return STATUS_LOSS
    if profit < order_value * target_margin_pct / 100:
        return STATUS_THIN
    return STATUS_SAFE


def find_threshold(costs: int, fee_pct: float, target_margin_pct: float,
                   step: int = THRESHOLD_STEP) -> Optional[int]:
    """Find the smallest order value that meets a margin target.

    The result is a multiple of step because sellers usually set round
    thresholds. Returns None when the margin target cannot be reached.
    """
    denominator = 1 - fee_pct / 100 - target_margin_pct / 100
    if denominator <= 0:
        return None

    def meets(value: int) -> bool:
        commission = round_rupiah(value * fee_pct / 100)
        profit = value - commission - costs
        return profit >= value * target_margin_pct / 100

    estimate = costs / denominator if costs > 0 else 0.0
    steps = max(1, int(math.ceil(estimate / step)))
    if steps * step > MAX_PRICE:
        return None
    while not meets(steps * step):
        steps += 1
        if steps * step > MAX_PRICE:
            return None
    while steps > 1 and meets((steps - 1) * step):
        steps -= 1
    return steps * step


def calculate_shipping_scenarios(config: ThresholdConfig) -> List[ShippingScenario]:
    """Evaluate the recommended threshold when the shipping cost moves."""
    scenarios = []
    for multiplier, label in SHIPPING_MULTIPLIERS:
        shipping_cost = round_rupiah(config.shipping_cost * multiplier / 100)
        net_shipping = max(0, shipping_cost - config.shipping_subsidy)
        costs = (config.hpp + config.fixed_fee + config.packaging
                 + net_shipping)
        commission = round_rupiah(config.order_value * config.fee_pct / 100)
        profit = config.order_value - commission - costs
        margin_pct = profit / config.order_value * 100
        scenarios.append(ShippingScenario(
            label=label,
            multiplier_pct=multiplier,
            net_shipping=net_shipping,
            target_threshold=find_threshold(
                costs, config.fee_pct, config.target_margin_pct
            ),
            profit=profit,
            margin_pct=margin_pct,
            status=status_for(profit, config.order_value,
                              config.target_margin_pct),
        ))
    return scenarios


def calculate_threshold(config: ThresholdConfig) -> ThresholdResult:
    validate_config(config)

    net_shipping = max(0, config.shipping_cost - config.shipping_subsidy)
    commission = round_rupiah(config.order_value * config.fee_pct / 100)
    base_cost = config.hpp + config.fixed_fee + config.packaging
    normal_profit = config.order_value - commission - base_cost
    normal_margin_pct = normal_profit / config.order_value * 100
    free_profit = normal_profit - net_shipping
    free_margin_pct = free_profit / config.order_value * 100
    target_profit = config.order_value * config.target_margin_pct / 100
    shortfall_per_order = max(0, int(math.ceil(target_profit - free_profit)))
    status = status_for(free_profit, config.order_value,
                        config.target_margin_pct)

    total_cost = base_cost + net_shipping
    break_even_threshold = find_threshold(total_cost, config.fee_pct, 0.0)
    target_threshold = find_threshold(
        total_cost, config.fee_pct, config.target_margin_pct
    )
    if target_threshold is None:
        gap_to_target = None
    else:
        gap_to_target = config.order_value - target_threshold

    safe_shipping_limit = max(
        0, int(math.floor(normal_profit - target_profit))
    )
    shipping_headroom = safe_shipping_limit - net_shipping

    monthly_free_orders = round_rupiah(
        config.monthly_orders * config.free_share_pct / 100
    )
    monthly_revenue = monthly_free_orders * config.order_value
    monthly_shipping_cost = monthly_free_orders * net_shipping
    if monthly_revenue > 0:
        monthly_shipping_share_pct = (
            monthly_shipping_cost / monthly_revenue * 100
        )
    else:
        monthly_shipping_share_pct = 0.0
    monthly_free_profit = monthly_free_orders * free_profit
    monthly_no_ship_profit = monthly_free_orders * normal_profit
    monthly_program_cost = monthly_free_profit - monthly_no_ship_profit
    monthly_shortfall = monthly_free_orders * shortfall_per_order

    result = ThresholdResult(
        config=config,
        net_shipping=net_shipping,
        commission=commission,
        normal_profit=normal_profit,
        normal_margin_pct=normal_margin_pct,
        free_profit=free_profit,
        free_margin_pct=free_margin_pct,
        target_profit=target_profit,
        shortfall_per_order=shortfall_per_order,
        status=status,
        break_even_threshold=break_even_threshold,
        target_threshold=target_threshold,
        gap_to_target=gap_to_target,
        safe_shipping_limit=safe_shipping_limit,
        shipping_headroom=shipping_headroom,
        monthly_free_orders=monthly_free_orders,
        monthly_revenue=monthly_revenue,
        monthly_shipping_cost=monthly_shipping_cost,
        monthly_shipping_share_pct=monthly_shipping_share_pct,
        monthly_free_profit=monthly_free_profit,
        monthly_no_ship_profit=monthly_no_ship_profit,
        monthly_program_cost=monthly_program_cost,
        monthly_shortfall=monthly_shortfall,
        scenarios=calculate_shipping_scenarios(config),
        warnings=[],
    )
    return replace(result, warnings=build_warnings(result))


def build_warnings(result: ThresholdResult) -> List[str]:
    config = result.config
    warnings = []

    if result.status == STATUS_LOSS:
        warnings.append(
            "Setiap pesanan gratis rugi "
            f"{format_rupiah(abs(result.free_profit))} setelah ongkir netto."
        )
    elif result.status == STATUS_THIN:
        warnings.append(
            f"Margin {format_percent(result.free_margin_pct)} persen masih di "
            f"bawah target {format_percent(config.target_margin_pct)} persen, "
            f"kurang {format_rupiah(result.shortfall_per_order)} per pesanan."
        )

    if result.target_threshold is not None:
        if config.order_value < result.target_threshold:
            warnings.append(
                f"Ambang sekarang {format_rupiah(config.order_value)} berada "
                f"{format_rupiah(result.target_threshold - config.order_value)} "
                f"di bawah minimum target "
                f"{format_rupiah(result.target_threshold)}."
            )
        elif config.order_value > result.target_threshold:
            warnings.append(
                f"Ambang sekarang {format_rupiah(config.order_value)} berada "
                f"{format_rupiah(config.order_value - result.target_threshold)} "
                f"di atas minimum target "
                f"{format_rupiah(result.target_threshold)}, ada ruang untuk "
                "menurunkan ambang."
            )

    if config.shipping_cost > 0 and result.net_shipping == 0:
        warnings.append(
            "Subsidi platform menutup seluruh ongkir, beban ongkir netto Rp 0."
        )
    elif result.net_shipping > result.safe_shipping_limit:
        warnings.append(
            f"Ongkir netto {format_rupiah(result.net_shipping)} melebihi batas "
            f"aman {format_rupiah(result.safe_shipping_limit)}, kekurangan "
            f"{format_rupiah(result.net_shipping - result.safe_shipping_limit)} "
            "per pesanan gratis."
        )

    if (result.normal_profit
            < config.order_value * config.target_margin_pct / 100):
        warnings.append(
            "Bahkan tanpa ongkir, profit di ambang sekarang belum mencapai "
            "target margin."
        )

    if config.monthly_orders == 0:
        warnings.append(
            "Proyeksi bulanan nol karena pesanan per bulan diisi 0."
        )
    elif config.free_share_pct == 0:
        warnings.append("Tidak ada pesanan gratis pada proyeksi bulanan.")
    elif config.free_share_pct == 100:
        warnings.append("Semua pesanan diasumsikan memakai gratis ongkir.")

    return warnings
