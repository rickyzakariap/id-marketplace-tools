#!/usr/bin/env python3
"""Unit tests for the dropship margin calculator.

Run: python3 -m unittest -v test_server
"""

import unittest

import server


class TestFeeComponents(unittest.TestCase):
    def test_fee_components_match_rates(self):
        result = server.calculate_margin(
            supplier_cost=100000,
            selling_price=200000,
            marketplace="tokopedia",
            category="fashion",
            weight_kg=0.5,
            free_ongkir=False,
        )
        # Tokopedia fashion: commission 4.5%, service 0.5%, payment 1.5%, admin Rp 1.000
        self.assertEqual(result["commission"], 9000)
        self.assertEqual(result["service_fee"], 1000)
        self.assertEqual(result["payment_fee"], 3000)
        self.assertEqual(result["admin_fee"], 1000)
        self.assertEqual(result["total_fees"], 14000)
        self.assertEqual(result["net_revenue"], 186000)


class TestShippingInProfit(unittest.TestCase):
    """Regression: seller-borne shipping (free ongkir subsidy) must reduce profit."""

    def test_free_ongkir_subsidy_is_deducted(self):
        with_free = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 0.3, free_ongkir=True
        )
        without_free = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 0.3, free_ongkir=False
        )
        self.assertEqual(with_free["shipping_cost"], 8000)
        self.assertEqual(with_free["shipping_subsidy"], 8000)
        self.assertEqual(without_free["shipping_subsidy"], 0)
        self.assertEqual(
            without_free["profit"] - with_free["profit"], with_free["shipping_subsidy"]
        )

    def test_heavier_package_lowers_profit_when_free_ongkir(self):
        light = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 0.3, free_ongkir=True
        )
        heavy = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 5.0, free_ongkir=True
        )
        self.assertLess(heavy["profit"], light["profit"])

    def test_heavier_package_does_not_change_profit_without_free_ongkir(self):
        light = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 0.3, free_ongkir=False
        )
        heavy = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 5.0, free_ongkir=False
        )
        self.assertEqual(light["profit"], heavy["profit"])

    def test_subsidy_capped_at_marketplace_max(self):
        result = server.calculate_margin(
            150000, 225000, "tokopedia", "electronics", 5.0, free_ongkir=True
        )
        # Tokopedia max_shipping_subsidy = 20.000
        self.assertEqual(result["shipping_subsidy"], 20000)
        self.assertGreater(result["shipping_cost"], result["shipping_subsidy"])


class TestBreakEven(unittest.TestCase):
    """Regression: break-even price must cover admin fee and seller shipping."""

    def test_break_even_yields_zero_profit(self):
        for free_ongkir in (False, True):
            base = server.calculate_margin(
                100000, 100000, "tokopedia", "default", 0.5, free_ongkir=free_ongkir
            )
            at_break_even = server.calculate_margin(
                100000, base["break_even"], "tokopedia", "default", 0.5,
                free_ongkir=free_ongkir,
            )
            self.assertLessEqual(
                abs(at_break_even["profit"]), 1,
                msg=f"free_ongkir={free_ongkir} profit={at_break_even['profit']}",
            )

    def test_recommended_price_is_profitable(self):
        base = server.calculate_margin(
            100000, 100000, "tokopedia", "default", 0.5, free_ongkir=True
        )
        at_recommended = server.calculate_margin(
            100000, base["recommended_price"], "tokopedia", "default", 0.5,
            free_ongkir=True,
        )
        self.assertGreater(at_recommended["profit"], 0)


class TestCompare(unittest.TestCase):
    def test_compare_returns_all_marketplaces_sorted(self):
        results = server.compare_all(50000, 90000, "fashion", 0.5, free_ongkir=False)
        self.assertEqual(len(results), len(server.MARKETPLACES))
        profits = [r["profit"] for r in results]
        self.assertEqual(profits, sorted(profits, reverse=True))

    def test_margin_and_roi_are_percentages(self):
        result = server.calculate_margin(
            50000, 100000, "shopee", "fashion", 0.5, free_ongkir=False
        )
        self.assertAlmostEqual(result["margin_pct"], result["profit"] / 100000 * 100, places=1)
        self.assertAlmostEqual(result["roi_pct"], result["profit"] / 50000 * 100, places=1)


if __name__ == "__main__":
    unittest.main()
