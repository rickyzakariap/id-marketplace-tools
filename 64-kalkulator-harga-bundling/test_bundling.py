import csv
import io
import json
import unittest

from bundling import (
    DEFAULT_ITEM_SPECS,
    BundleConfig,
    allocate_amount,
    calculate_bundle,
    calculate_profit,
    find_minimum_price,
    parse_item,
)
from report import (
    build_csv,
    build_json,
    format_pct,
    format_rupiah,
    format_signed_rupiah,
    render_text,
)


def default_items():
    return [parse_item(spec) for spec in DEFAULT_ITEM_SPECS]


def default_config(**overrides):
    values = {
        "bundle_price": 139000,
        "fee_pct": 8.0,
        "fixed_fee": 1250,
        "packaging": 2000,
        "shipping_subsidy": 5000,
        "target_margin_pct": 12.0,
        "monthly_bundles": 40,
    }
    values.update(overrides)
    return BundleConfig(**values)


class DefaultExampleTest(unittest.TestCase):
    def setUp(self):
        self.result = calculate_bundle(default_items(), default_config())

    def test_totals(self):
        result = self.result
        self.assertEqual(result.total_quantity, 3)
        self.assertEqual(result.goods_cost, 101000)
        self.assertEqual(result.retail_total, 155000)
        self.assertEqual(result.discount, 16000)
        self.assertAlmostEqual(result.discount_pct, 10.322580645, places=6)
        self.assertEqual(result.commission, 11120)
        self.assertEqual(result.platform_deduction, 19370)
        self.assertEqual(result.total_cost, 120370)
        self.assertEqual(result.profit, 18630)
        self.assertAlmostEqual(result.margin_pct, 13.402877697, places=6)
        self.assertEqual(result.status, "Aman")

    def test_minimum_price_and_discount(self):
        result = self.result
        self.assertEqual(result.minimum_price, 136563)
        self.assertEqual(result.max_discount, 18437)
        self.assertAlmostEqual(result.max_discount_pct, 11.894838709, places=6)
        self.assertEqual(result.room_to_minimum, 2437)

    def test_separate_comparison_and_monthly(self):
        result = self.result
        self.assertEqual(result.separate_profit, 16850)
        self.assertEqual(result.profit_difference, 1780)
        self.assertEqual(result.saved_order_cost, 16500)
        self.assertEqual(result.monthly_bundle_profit, 745200)
        self.assertEqual(result.monthly_separate_profit, 674000)
        self.assertEqual(result.monthly_difference, 71200)


class StatusAndMinimumTest(unittest.TestCase):
    def test_thin_margin(self):
        result = calculate_bundle(
            default_items(), default_config(target_margin_pct=20.0)
        )
        self.assertEqual(result.status, "Tipis")
        self.assertGreater(result.profit, 0)
        self.assertTrue(any("di bawah target" in text for text in result.warnings))

    def test_loss(self):
        result = calculate_bundle(
            default_items(), default_config(bundle_price=100000)
        )
        self.assertEqual(result.status, "Rugi")
        self.assertLess(result.profit, 0)
        self.assertTrue(any("rugi" in text for text in result.warnings))

    def test_minimum_price_is_smallest(self):
        result = calculate_bundle(default_items(), default_config())
        fixed_costs = (
            result.config.fixed_fee
            + result.config.packaging
            + result.config.shipping_subsidy
        )

        def meets_target(price):
            profit = calculate_profit(
                price, result.goods_cost, fixed_costs, result.config.fee_pct
            )
            return profit >= price * result.config.target_margin_pct / 100

        self.assertTrue(meets_target(result.minimum_price))
        self.assertFalse(meets_target(result.minimum_price - 1))

    def test_unreachable_target_above_retail(self):
        item = parse_item("Produk mahal:90000:100000:1")
        result = calculate_bundle(
            [item],
            default_config(
                bundle_price=100000,
                fee_pct=10.0,
                fixed_fee=5000,
                packaging=0,
                shipping_subsidy=0,
                target_margin_pct=20.0,
                monthly_bundles=0,
            ),
        )
        self.assertGreater(result.minimum_price, result.retail_total)
        self.assertLess(result.max_discount, 0)
        self.assertTrue(any("melebihi" in text for text in result.warnings))

    def test_zero_target_and_zero_cost_minimum(self):
        self.assertEqual(find_minimum_price(0, 0, 0.0, 0.0), 1)


class AllocationAndItemTest(unittest.TestCase):
    def test_allocation_sums_exactly(self):
        result = calculate_bundle(default_items(), default_config())
        self.assertEqual(
            sum(a.allocated_revenue for a in result.item_analysis),
            result.config.bundle_price,
        )
        self.assertEqual(
            sum(a.allocated_fee for a in result.item_analysis),
            result.platform_deduction,
        )
        self.assertEqual(
            sum(a.contribution for a in result.item_analysis), result.profit
        )

    def test_allocation_with_zero_weights(self):
        parts = allocate_amount(100, [0, 0, 0])
        self.assertEqual(sum(parts), 100)
        self.assertLessEqual(max(parts) - min(parts), 1)

    def test_negative_item_contribution_warning(self):
        result = calculate_bundle(default_items(), default_config())
        tote = [a for a in result.item_analysis if a.item.name == "Tote bag kanvas"]
        self.assertEqual(len(tote), 1)
        self.assertLess(tote[0].contribution, 0)
        self.assertTrue(any("Tote bag kanvas" in text for text in result.warnings))


class ValidationTest(unittest.TestCase):
    def test_parse_valid_item(self):
        item = parse_item("  Kaos polos : 45000 : 75000 : 2 ")
        self.assertEqual(item.name, "Kaos polos")
        self.assertEqual(item.unit_cost, 45000)
        self.assertEqual(item.retail_price, 75000)
        self.assertEqual(item.quantity, 2)

    def test_parse_invalid_item_format(self):
        for spec in [
            "Kaos:45000:75000",
            "Kaos:45000:75000:1:extra",
            ":45000:75000:1",
            "Kaos:abc:75000:1",
            "Kaos:45000:75000:1.5",
        ]:
            with self.subTest(spec=spec):
                with self.assertRaises(ValueError):
                    parse_item(spec)

    def test_parse_invalid_item_values(self):
        for spec in [
            "Kaos:-1:75000:1",
            "Kaos:45000:0:1",
            "Kaos:45000:75000:0",
            "Kaos:45000:75000:1001",
        ]:
            with self.subTest(spec=spec):
                with self.assertRaises(ValueError):
                    parse_item(spec)

    def test_duplicate_names_rejected(self):
        items = [parse_item("Kaos:1000:2000:1"), parse_item("kaos:1000:2000:1")]
        with self.assertRaises(ValueError):
            calculate_bundle(items, default_config())

    def test_item_limit_rejected(self):
        items = [parse_item(f"Item {index}:1000:2000:1") for index in range(13)]
        with self.assertRaises(ValueError):
            calculate_bundle(items, default_config())

    def test_invalid_config_values(self):
        cases = [
            {"bundle_price": 0},
            {"fee_pct": -1.0},
            {"fee_pct": 101.0},
            {"target_margin_pct": 100.0},
            {"target_margin_pct": -1.0},
            {"fee_pct": 8.0, "target_margin_pct": 95.0},
            {"fixed_fee": -1},
            {"packaging": -1},
            {"shipping_subsidy": -1},
            {"monthly_bundles": -1},
        ]
        for overrides in cases:
            with self.subTest(overrides=overrides):
                with self.assertRaises(ValueError):
                    calculate_bundle(default_items(), default_config(**overrides))

    def test_empty_items_rejected(self):
        with self.assertRaises(ValueError):
            calculate_bundle([], default_config())


class OutputTest(unittest.TestCase):
    def setUp(self):
        self.result = calculate_bundle(default_items(), default_config())

    def test_format_helpers(self):
        self.assertEqual(format_rupiah(1250000), "Rp 1.250.000")
        self.assertEqual(format_rupiah(-1269), "-Rp 1.269")
        self.assertEqual(format_signed_rupiah(1780), "+Rp 1.780")
        self.assertEqual(format_signed_rupiah(-1900), "-Rp 1.900")
        self.assertEqual(format_signed_rupiah(0), "Rp 0")
        self.assertEqual(format_pct(13.4028), "13,40%")

    def test_text_output_sections(self):
        text = render_text(self.result)
        self.assertIn("Kalkulator Harga Bundling", text)
        self.assertIn("Isi bundling:", text)
        self.assertIn("Hasil per bundling:", text)
        self.assertIn("Perbandingan jual terpisah:", text)
        self.assertIn("Catatan:", text)
        self.assertIn("Status                : Aman", text)
        self.assertNotIn("\u2014", text)
        self.assertNotIn("\u2013", text)

    def test_json_output(self):
        payload = json.loads(build_json(self.result))
        self.assertEqual(payload["config"]["bundle_price"], 139000)
        self.assertEqual(payload["totals"]["profit"], 18630)
        self.assertEqual(payload["totals"]["status"], "Aman")
        self.assertEqual(len(payload["items"]), 3)
        self.assertEqual(len(payload["item_analysis"]), 3)
        self.assertEqual(payload["monthly"]["difference"], 71200)
        self.assertIsInstance(payload["warnings"], list)

    def test_csv_output(self):
        rows = list(csv.reader(io.StringIO(build_csv(self.result))))
        self.assertEqual(len(rows), 5)
        self.assertEqual(len(rows[0]), 17)
        for row in rows:
            self.assertEqual(len(row), 17)
        self.assertEqual(rows[1][0], "ringkasan")
        self.assertEqual(rows[1][10], "13.40")
        self.assertEqual(rows[1][11], "Aman")
        self.assertEqual(rows[2][0], "item")

    def test_single_item_has_no_order_saving(self):
        item = parse_item("Kaos:45000:75000:1")
        result = calculate_bundle(
            [item],
            default_config(
                bundle_price=75000,
                fixed_fee=1250,
                packaging=2000,
                shipping_subsidy=5000,
                monthly_bundles=0,
            ),
        )
        self.assertEqual(result.saved_order_cost, 0)
        self.assertEqual(result.monthly_bundle_profit, 0)
        self.assertTrue(any("1 pcs" in text for text in result.warnings))


if __name__ == "__main__":
    unittest.main()
