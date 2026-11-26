import csv
import io
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout

from main import main
from ongkir import (
    STATUS_LOSS,
    STATUS_SAFE,
    STATUS_THIN,
    ThresholdConfig,
    calculate_threshold,
    find_threshold,
    format_percent,
    format_rupiah,
    round_rupiah,
    validate_config,
)
from report import (
    build_csv,
    build_json,
    format_pct,
    format_rupiah as report_format_rupiah,
    format_signed_rupiah,
    render_text,
)


def default_config(**overrides):
    values = {
        "order_value": 150000,
        "hpp": 90000,
        "fee_pct": 8.0,
        "fixed_fee": 1250,
        "packaging": 2500,
        "shipping_cost": 18000,
        "shipping_subsidy": 4000,
        "target_margin_pct": 15.0,
        "monthly_orders": 300,
        "free_share_pct": 40.0,
    }
    values.update(overrides)
    return ThresholdConfig(**values)


class DefaultExampleTest(unittest.TestCase):
    def setUp(self):
        self.result = calculate_threshold(default_config())

    def test_order_math(self):
        result = self.result
        self.assertEqual(result.net_shipping, 14000)
        self.assertEqual(result.commission, 12000)
        self.assertEqual(result.normal_profit, 44250)
        self.assertAlmostEqual(result.normal_margin_pct, 29.5, places=6)
        self.assertEqual(result.free_profit, 30250)
        self.assertAlmostEqual(result.free_margin_pct, 20.166667, places=6)
        self.assertEqual(result.target_profit, 22500.0)
        self.assertEqual(result.shortfall_per_order, 0)
        self.assertEqual(result.status, STATUS_SAFE)

    def test_thresholds(self):
        result = self.result
        self.assertEqual(result.break_even_threshold, 118000)
        self.assertEqual(result.target_threshold, 140000)
        self.assertEqual(result.gap_to_target, 10000)
        self.assertEqual(result.safe_shipping_limit, 21750)
        self.assertEqual(result.shipping_headroom, 7750)

    def test_monthly_projection(self):
        result = self.result
        self.assertEqual(result.monthly_free_orders, 120)
        self.assertEqual(result.monthly_revenue, 18000000)
        self.assertEqual(result.monthly_shipping_cost, 1680000)
        self.assertAlmostEqual(
            result.monthly_shipping_share_pct, 9.333333, places=6
        )
        self.assertEqual(result.monthly_free_profit, 3630000)
        self.assertEqual(result.monthly_no_ship_profit, 5310000)
        self.assertEqual(result.monthly_program_cost, -1680000)
        self.assertEqual(result.monthly_shortfall, 0)

    def test_shipping_scenarios(self):
        scenarios = self.result.scenarios
        self.assertEqual(len(scenarios), 3)
        self.assertEqual(
            [item.multiplier_pct for item in scenarios], [80, 100, 120]
        )
        self.assertEqual(scenarios[0].net_shipping, 10400)
        self.assertEqual(scenarios[0].target_threshold, 136000)
        self.assertEqual(scenarios[0].profit, 33850)
        self.assertEqual(scenarios[0].status, STATUS_SAFE)
        self.assertEqual(scenarios[1].net_shipping, 14000)
        self.assertEqual(scenarios[1].target_threshold, 140000)
        self.assertEqual(scenarios[2].net_shipping, 17600)
        self.assertEqual(scenarios[2].target_threshold, 145000)
        self.assertEqual(scenarios[2].profit, 26650)


class ThresholdSearchTest(unittest.TestCase):
    def test_target_threshold_is_smallest_multiple(self):
        result = calculate_threshold(default_config())
        costs = (result.config.hpp + result.config.fixed_fee
                 + result.config.packaging + result.net_shipping)

        def meets(value):
            commission = round_rupiah(value * result.config.fee_pct / 100)
            profit = value - commission - costs
            return profit >= value * result.config.target_margin_pct / 100

        self.assertTrue(meets(result.target_threshold))
        self.assertFalse(meets(result.target_threshold - 1000))

    def test_break_even_threshold_is_smallest_multiple(self):
        result = calculate_threshold(default_config())
        costs = (result.config.hpp + result.config.fixed_fee
                 + result.config.packaging + result.net_shipping)

        def profit_at(value):
            commission = round_rupiah(value * result.config.fee_pct / 100)
            return value - commission - costs

        self.assertGreaterEqual(profit_at(result.break_even_threshold), 0)
        self.assertLess(profit_at(result.break_even_threshold - 1000), 0)

    def test_zero_cost_threshold(self):
        self.assertEqual(find_threshold(0, 0.0, 0.0), 1000)

    def test_unreachable_margin_returns_none(self):
        self.assertIsNone(find_threshold(100000, 60.0, 50.0))


class StatusTest(unittest.TestCase):
    def test_thin_margin(self):
        result = calculate_threshold(default_config(target_margin_pct=25.0))
        self.assertEqual(result.status, STATUS_THIN)
        self.assertGreater(result.free_profit, 0)
        self.assertEqual(result.shortfall_per_order, 7250)
        self.assertEqual(result.monthly_shortfall, 870000)
        self.assertTrue(any("bawah target" in text for text in result.warnings))

    def test_loss(self):
        result = calculate_threshold(default_config(shipping_cost=60000))
        self.assertEqual(result.status, STATUS_LOSS)
        self.assertLess(result.free_profit, 0)
        self.assertTrue(any("rugi" in text for text in result.warnings))

    def test_threshold_below_target_warning(self):
        result = calculate_threshold(default_config(order_value=130000))
        self.assertEqual(result.gap_to_target, -10000)
        self.assertTrue(any("di bawah minimum target" in text
                            for text in result.warnings))


class ShippingPolicyTest(unittest.TestCase):
    def test_subsidy_covers_all_shipping(self):
        result = calculate_threshold(default_config(shipping_subsidy=20000))
        self.assertEqual(result.net_shipping, 0)
        self.assertEqual(result.free_profit, result.normal_profit)
        self.assertEqual(result.target_threshold, 122000)
        self.assertTrue(any("menutup seluruh ongkir" in text
                            for text in result.warnings))

    def test_safe_shipping_limit_boundary(self):
        at_limit = calculate_threshold(default_config(shipping_cost=25750))
        self.assertEqual(at_limit.net_shipping, 21750)
        self.assertEqual(at_limit.shipping_headroom, 0)
        self.assertEqual(at_limit.status, STATUS_SAFE)
        above_limit = calculate_threshold(default_config(shipping_cost=25751))
        self.assertEqual(above_limit.net_shipping, 21751)
        self.assertEqual(above_limit.shipping_headroom, -1)
        self.assertEqual(above_limit.status, STATUS_THIN)
        self.assertTrue(any("melebihi batas aman" in text
                            for text in above_limit.warnings))

    def test_free_share_rounding(self):
        result = calculate_threshold(
            default_config(monthly_orders=10, free_share_pct=45.0)
        )
        self.assertEqual(result.monthly_free_orders, 5)
        self.assertEqual(round_rupiah(2.5), 3)

    def test_zero_monthly_orders(self):
        result = calculate_threshold(default_config(monthly_orders=0))
        self.assertEqual(result.monthly_free_orders, 0)
        self.assertEqual(result.monthly_shipping_cost, 0)
        self.assertTrue(any("bulan diisi 0" in text for text in result.warnings))


class ValidationTest(unittest.TestCase):
    def test_invalid_values_are_rejected(self):
        invalid_overrides = [
            {"order_value": 0},
            {"order_value": 10**13},
            {"hpp": -1},
            {"hpp": 10**13},
            {"fee_pct": 100},
            {"fee_pct": float("nan")},
            {"fee_pct": 95.0, "target_margin_pct": 10.0},
            {"fixed_fee": -1},
            {"packaging": -1},
            {"shipping_cost": -1},
            {"shipping_subsidy": -1},
            {"target_margin_pct": -1},
            {"target_margin_pct": 100},
            {"target_margin_pct": float("inf")},
            {"monthly_orders": -1},
            {"free_share_pct": -1},
            {"free_share_pct": 101},
            {"free_share_pct": float("nan")},
        ]
        for overrides in invalid_overrides:
            with self.subTest(overrides=overrides):
                with self.assertRaises(ValueError):
                    validate_config(default_config(**overrides))


class FormatTest(unittest.TestCase):
    def test_rupiah_and_percent(self):
        self.assertEqual(format_rupiah(150000), "Rp 150.000")
        self.assertEqual(report_format_rupiah(-1000), "-Rp 1.000")
        self.assertEqual(format_signed_rupiah(7750), "+Rp 7.750")
        self.assertEqual(format_signed_rupiah(-1), "-Rp 1")
        self.assertEqual(format_signed_rupiah(0), "Rp 0")
        self.assertEqual(format_pct(20.166666), "20,17%")
        self.assertEqual(format_percent(9.5), "9,50")

    def test_output_has_no_em_or_en_dash(self):
        result = calculate_threshold(default_config())
        outputs = [render_text(result), build_json(result), build_csv(result)]
        for output in outputs:
            self.assertNotIn("\u2014", output)
            self.assertNotIn("\u2013", output)


class OutputTest(unittest.TestCase):
    def setUp(self):
        self.result = calculate_threshold(default_config())

    def test_text_sections(self):
        text = render_text(self.result)
        self.assertIn("Kalkulator Ambang Gratis Ongkir", text)
        self.assertIn("Pesanan di ambang sekarang:", text)
        self.assertIn("Ambang minimum:", text)
        self.assertIn("Proyeksi bulanan:", text)
        self.assertIn("Sensitivitas ongkir:", text)
        self.assertIn("Rp 140.000", text)

    def test_json_payload(self):
        payload = json.loads(build_json(self.result))
        self.assertEqual(payload["net_shipping"], 14000)
        self.assertEqual(payload["status"], "Aman")
        self.assertEqual(payload["config"]["order_value"], 150000)
        self.assertEqual(payload["target_threshold"], 140000)
        self.assertEqual(payload["break_even_threshold"], 118000)
        self.assertEqual(payload["monthly_free_orders"], 120)
        self.assertEqual(len(payload["scenarios"]), 3)
        self.assertIsInstance(payload["warnings"], list)

    def test_csv_rows(self):
        rows = list(csv.reader(io.StringIO(build_csv(self.result))))
        self.assertEqual(rows[0][0], "jenis")
        self.assertEqual(len(rows), 5)
        self.assertEqual(rows[1][0], "ringkasan")
        self.assertEqual(rows[1][1], "ambang-sekarang")
        self.assertEqual(rows[1][7], "Aman")
        self.assertEqual(rows[2][0], "skenario-ongkir")
        self.assertEqual(rows[3][0], "skenario-ongkir")
        self.assertEqual(rows[4][1], "Ongkir naik 20%")


class CliTest(unittest.TestCase):
    def test_cli_json(self):
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            code = main(["--json"])
        self.assertEqual(code, 0)
        payload = json.loads(buffer.getvalue())
        self.assertEqual(payload["status"], "Aman")

    def test_cli_csv(self):
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            code = main(["--csv", "--ambang", "130000"])
        self.assertEqual(code, 0)
        self.assertTrue(buffer.getvalue().startswith("jenis,label"))

    def test_cli_rejects_invalid_input(self):
        with redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as context:
                main(["--hpp", "-1"])
        self.assertEqual(context.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
