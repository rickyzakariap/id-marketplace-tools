import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import server


class ShopeeRateLabelTest(unittest.TestCase):
    def test_every_group_has_a_clean_label(self):
        for group in server.SHOPEE_GROUPS:
            label = server.rate_label(group)
            self.assertTrue(label)
            self.assertNotIn("None", label)
            self.assertNotIn("null", label)
            self.assertTrue(label.endswith("%"))

    def test_single_rate_group_has_no_range(self):
        group = next(g for g in server.SHOPEE_GROUPS if g["id"] == "A")
        self.assertEqual(server.rate_label(group), "10%")

    def test_range_group_shows_both_rates(self):
        group = next(g for g in server.SHOPEE_GROUPS if g["id"] == "B")
        self.assertEqual(server.rate_label(group), "9-9.5%")

    def test_calc_exposes_rate_label_for_single_rate_group(self):
        result = server.calc({
            "category": "Pakaian Wanita & Pakaian Dalam",
            "price": 100000,
            "modal": 55000,
            "volume": 10,
            "shopee_group": "A",
        })
        self.assertEqual(result["shopee"]["rate_label"], "10%")
        self.assertEqual(result["shopee"]["rate"], 10.0)

    def test_calc_exposes_rate_label_for_range_group(self):
        result = server.calc({
            "category": "Pakaian Wanita & Pakaian Dalam",
            "price": 100000,
            "modal": 55000,
            "volume": 10,
            "shopee_group": "B",
        })
        self.assertEqual(result["shopee"]["rate_label"], "9-9.5%")
        self.assertEqual(result["shopee"]["rate"], 9.0)

    def test_calc_omits_shopee_when_group_is_unknown(self):
        result = server.calc({
            "category": "Pakaian Wanita & Pakaian Dalam",
            "price": 100000,
            "modal": 55000,
            "volume": 10,
            "shopee_group": "Z",
        })
        self.assertNotIn("shopee", result)


class CommissionTest(unittest.TestCase):
    def test_commission_uses_new_rate_and_cap(self):
        result = server.calc({
            "category": "Pakaian Wanita & Pakaian Dalam",
            "price": 100000,
            "modal": 55000,
            "volume": 2,
        })
        self.assertEqual(result["comm_new"], 8000)
        self.assertEqual(result["total_new"], 16000)

    def test_invalid_price_is_rejected(self):
        result = server.calc({"category": "Pakaian Wanita & Pakaian Dalam", "price": 0})
        self.assertIn("error", result)

    def test_index_uses_server_rate_label(self):
        index_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "index.html",
        )
        with open(index_path, encoding="utf-8") as handle:
            html = handle.read()
        self.assertIn("rate_label", html)
        self.assertNotIn("rate_min !== undefined", html)


if __name__ == "__main__":
    unittest.main()
