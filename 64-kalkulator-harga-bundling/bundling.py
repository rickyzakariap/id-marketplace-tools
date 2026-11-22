"""Pure logic for the bundle pricing calculator.

All money values are integer rupiah. Percentages use float values such as 8.0
for eight percent. The module has no I/O so it can be tested directly.
"""

import math
from dataclasses import dataclass
from typing import List, Optional

MAX_ITEMS = 12
MAX_QUANTITY = 1000
MAX_PRICE = 10**12

DEFAULT_ITEM_SPECS = (
    "Kaos polos katun 30s:45000:75000:1",
    "Topi twill:20000:35000:1",
    "Tote bag kanvas:36000:45000:1",
)


@dataclass(frozen=True)
class Item:
    name: str
    unit_cost: int
    retail_price: int
    quantity: int


@dataclass(frozen=True)
class BundleConfig:
    bundle_price: int
    fee_pct: float
    fixed_fee: int
    packaging: int
    shipping_subsidy: int
    target_margin_pct: float
    monthly_bundles: int


@dataclass(frozen=True)
class ItemAnalysis:
    item: Item
    retail_value: int
    allocated_revenue: int
    allocated_fee: int
    contribution: int


@dataclass(frozen=True)
class BundleResult:
    config: BundleConfig
    items: List[Item]
    total_quantity: int
    goods_cost: int
    retail_total: int
    discount: int
    discount_pct: float
    commission: int
    platform_deduction: int
    total_cost: int
    profit: int
    margin_pct: float
    status: str
    minimum_price: Optional[int]
    max_discount: Optional[int]
    max_discount_pct: Optional[float]
    room_to_minimum: Optional[int]
    item_analysis: List[ItemAnalysis]
    separate_profit: int
    profit_difference: int
    saved_order_cost: int
    monthly_bundle_profit: int
    monthly_separate_profit: int
    monthly_difference: int
    warnings: List[str]


def round_rupiah(value: float) -> int:
    """Round a non-negative rupiah value half up."""
    return int(math.floor(value + 0.5))


def parse_item(spec: str) -> Item:
    """Parse NAMA:HPP:HARGA:QTY into an Item."""
    parts = spec.split(":")
    if len(parts) != 4:
        raise ValueError(
            "Format item harus NAMA:HPP:HARGA:QTY, contoh Kaos:45000:75000:1."
        )
    name = parts[0].strip()
    if not name:
        raise ValueError("Nama item tidak boleh kosong.")
    if ":" in name:
        raise ValueError("Nama item tidak boleh mengandung titik dua.")
    try:
        unit_cost = int(parts[1].strip())
        retail_price = int(parts[2].strip())
        quantity = int(parts[3].strip())
    except ValueError as exc:
        raise ValueError(
            "HPP, harga eceran, dan qty harus bilangan bulat tanpa titik."
        ) from exc
    item = Item(name=name, unit_cost=unit_cost, retail_price=retail_price,
                quantity=quantity)
    validate_item(item)
    return item


def validate_item(item: Item) -> None:
    if not item.name or not item.name.strip():
        raise ValueError("Nama item tidak boleh kosong.")
    if item.unit_cost < 0:
        raise ValueError(f"HPP {item.name} tidak boleh negatif.")
    if item.retail_price <= 0:
        raise ValueError(f"Harga eceran {item.name} harus lebih dari 0.")
    if item.quantity < 1:
        raise ValueError(f"Qty {item.name} minimal 1.")
    if item.quantity > MAX_QUANTITY:
        raise ValueError(f"Qty {item.name} maksimal {MAX_QUANTITY}.")


def validate_items(items: List[Item]) -> None:
    if not items:
        raise ValueError("Minimal satu item bundling.")
    if len(items) > MAX_ITEMS:
        raise ValueError(f"Maksimal {MAX_ITEMS} item per bundling.")
    seen = set()
    for item in items:
        validate_item(item)
        key = item.name.casefold()
        if key in seen:
            raise ValueError(f"Nama item dobel: {item.name}.")
        seen.add(key)


def validate_config(config: BundleConfig) -> None:
    if config.bundle_price <= 0:
        raise ValueError("Harga bundling harus lebih dari 0.")
    if config.bundle_price > MAX_PRICE:
        raise ValueError("Harga bundling terlalu besar.")
    if config.fee_pct < 0 or config.fee_pct > 100:
        raise ValueError("Komisi marketplace harus di antara 0 dan 100 persen.")
    if config.target_margin_pct < 0 or config.target_margin_pct >= 100:
        raise ValueError("Target margin harus di antara 0 dan 100 persen.")
    if config.fee_pct + config.target_margin_pct >= 100:
        raise ValueError(
            "Komisi ditambah target margin harus kurang dari 100 persen."
        )
    if config.fixed_fee < 0:
        raise ValueError("Biaya tetap tidak boleh negatif.")
    if config.packaging < 0:
        raise ValueError("Biaya kemasan tidak boleh negatif.")
    if config.shipping_subsidy < 0:
        raise ValueError("Subsidi ongkir tidak boleh negatif.")
    if config.monthly_bundles < 0:
        raise ValueError("Jumlah bundling per bulan tidak boleh negatif.")


def allocate_amount(total: int, weights: List[float]) -> List[int]:
    """Split an integer total by weights using the largest remainder method."""
    if not weights:
        return []
    weight_sum = sum(weights)
    if weight_sum <= 0:
        weights = [1.0 for _ in weights]
        weight_sum = float(len(weights))
    raw = [total * weight / weight_sum for weight in weights]
    base = [int(math.floor(value)) for value in raw]
    remainder = total - sum(base)
    order = sorted(range(len(raw)), key=lambda index: raw[index] - base[index],
                   reverse=True)
    for index in order[:max(0, remainder)]:
        base[index] += 1
    return base


def calculate_profit(price: int, goods_cost: int, fixed_costs: int,
                     fee_pct: float) -> int:
    commission = round_rupiah(price * fee_pct / 100)
    return price - goods_cost - fixed_costs - commission


def find_minimum_price(goods_cost: int, fixed_costs: int, fee_pct: float,
                       target_margin_pct: float) -> Optional[int]:
    """Return the smallest integer price that meets the target margin."""
    denominator = 1 - fee_pct / 100 - target_margin_pct / 100
    if denominator <= 0:
        return None

    def meets_target(price: int) -> bool:
        profit = calculate_profit(price, goods_cost, fixed_costs, fee_pct)
        return profit >= price * target_margin_pct / 100

    if meets_target(1):
        return 1
    high = max(2, int((goods_cost + fixed_costs) / denominator) + 2)
    while not meets_target(high):
        high *= 2
        if high > MAX_PRICE:
            return None
    low = 1
    while low + 1 < high:
        middle = (low + high) // 2
        if meets_target(middle):
            high = middle
        else:
            low = middle
    return high


def calculate_bundle(items: List[Item], config: BundleConfig) -> BundleResult:
    validate_items(items)
    validate_config(config)

    total_quantity = sum(item.quantity for item in items)
    goods_cost = sum(item.unit_cost * item.quantity for item in items)
    retail_total = sum(item.retail_price * item.quantity for item in items)
    discount = retail_total - config.bundle_price
    discount_pct = discount / retail_total * 100
    commission = round_rupiah(config.bundle_price * config.fee_pct / 100)
    fixed_costs = (config.fixed_fee + config.packaging
                   + config.shipping_subsidy)
    platform_deduction = commission + fixed_costs
    total_cost = goods_cost + platform_deduction
    profit = config.bundle_price - total_cost
    margin_pct = profit / config.bundle_price * 100
    target_profit = config.bundle_price * config.target_margin_pct / 100

    if profit < 0:
        status = "Rugi"
    elif profit < target_profit:
        status = "Tipis"
    else:
        status = "Aman"

    minimum_price = find_minimum_price(
        goods_cost, fixed_costs, config.fee_pct, config.target_margin_pct
    )
    max_discount = None
    max_discount_pct = None
    room_to_minimum = None
    if minimum_price is not None:
        max_discount = retail_total - minimum_price
        max_discount_pct = max_discount / retail_total * 100
        room_to_minimum = config.bundle_price - minimum_price

    weights = [item.retail_price * item.quantity for item in items]
    revenues = allocate_amount(config.bundle_price, weights)
    fees = allocate_amount(platform_deduction, weights)
    item_analysis = []
    for item, revenue, fee in zip(items, revenues, fees):
        item_cost = item.unit_cost * item.quantity
        item_analysis.append(ItemAnalysis(
            item=item,
            retail_value=item.retail_price * item.quantity,
            allocated_revenue=revenue,
            allocated_fee=fee,
            contribution=revenue - item_cost - fee,
        ))

    separate_profit = 0
    for item in items:
        unit_commission = round_rupiah(item.retail_price * config.fee_pct / 100)
        unit_profit = (item.retail_price - item.unit_cost - unit_commission
                       - fixed_costs)
        separate_profit += unit_profit * item.quantity

    saved_order_cost = fixed_costs * (total_quantity - 1)
    profit_difference = profit - separate_profit
    monthly_bundle_profit = profit * config.monthly_bundles
    monthly_separate_profit = separate_profit * config.monthly_bundles
    monthly_difference = profit_difference * config.monthly_bundles

    warnings = build_warnings(
        config=config,
        retail_total=retail_total,
        discount=discount,
        profit=profit,
        margin_pct=margin_pct,
        status=status,
        minimum_price=minimum_price,
        profit_difference=profit_difference,
        total_quantity=total_quantity,
        item_analysis=item_analysis,
    )

    return BundleResult(
        config=config,
        items=items,
        total_quantity=total_quantity,
        goods_cost=goods_cost,
        retail_total=retail_total,
        discount=discount,
        discount_pct=discount_pct,
        commission=commission,
        platform_deduction=platform_deduction,
        total_cost=total_cost,
        profit=profit,
        margin_pct=margin_pct,
        status=status,
        minimum_price=minimum_price,
        max_discount=max_discount,
        max_discount_pct=max_discount_pct,
        room_to_minimum=room_to_minimum,
        item_analysis=item_analysis,
        separate_profit=separate_profit,
        profit_difference=profit_difference,
        saved_order_cost=saved_order_cost,
        monthly_bundle_profit=monthly_bundle_profit,
        monthly_separate_profit=monthly_separate_profit,
        monthly_difference=monthly_difference,
        warnings=warnings,
    )


def build_warnings(config: BundleConfig, retail_total: int, discount: int,
                   profit: int, margin_pct: float, status: str,
                   minimum_price: Optional[int], profit_difference: int,
                   total_quantity: int,
                   item_analysis: List[ItemAnalysis]) -> List[str]:
    warnings = []
    if config.bundle_price > retail_total:
        warnings.append(
            "Harga bundling di atas total harga eceran, pembeli tidak mendapat diskon."
        )
    elif discount == 0:
        warnings.append(
            "Harga bundling sama dengan total harga eceran, tidak ada diskon."
        )

    if status == "Rugi":
        warnings.append(
            f"Setiap bundling rugi Rp {abs(profit):,} setelah semua biaya."
            .replace(",", ".")
        )
    elif status == "Tipis":
        margin_text = f"{margin_pct:.2f}".replace(".", ",")
        target_text = f"{config.target_margin_pct:.2f}".replace(".", ",")
        warnings.append(
            f"Margin {margin_text} persen masih di bawah target "
            f"{target_text} persen."
        )

    if minimum_price is not None and minimum_price > retail_total:
        warnings.append(
            "Harga minimum agar target tercapai melebihi total harga eceran."
        )

    for analysis in item_analysis:
        if analysis.contribution < 0:
            amount = f"{abs(analysis.contribution):,}".replace(",", ".")
            warnings.append(
                f"{analysis.item.name} menyumbang kontribusi negatif "
                f"Rp {amount} per bundling."
            )
        if analysis.item.retail_price < analysis.item.unit_cost:
            warnings.append(
                f"Harga eceran {analysis.item.name} di bawah HPP per pcs."
            )

    if total_quantity == 1:
        warnings.append(
            "Bundling hanya berisi 1 pcs, tidak ada biaya pesanan yang dihemat."
        )

    if profit_difference < 0:
        amount = f"{abs(profit_difference):,}".replace(",", ".")
        warnings.append(
            f"Profit bundling Rp {amount} lebih rendah daripada menjual terpisah."
        )

    return warnings
