#!/usr/bin/env python3
"""Unit tests for the Permen UMKM 3/2026 incentive checker.

Run: python3 -m unittest -v test_server.py
"""
import unittest
from datetime import date

import server


def base_answers():
    return {
        "skala": "mikro",
        "produk_dalam_negeri": True,
        "nib": True,
        "info_benar": True,
        "standar_mutu": True,
        "sapa": True,
        "bukan_high_risk": True,
    }


def entry(marketplace="shopee", omzet=50000000, rate=12.0):
    return {"marketplace": marketplace, "omzet": omzet, "rate": rate}


class PolicyTest(unittest.TestCase):
    def test_before_effective_date_is_scheduled(self):
        policy = server.build_policy(date(2026, 10, 21))
        self.assertEqual(policy["status"], "terjadwal")
        self.assertEqual(policy["effective_date"], "2026-10-25")
        self.assertEqual(policy["days_left"], 4)
        self.assertIn("25 Oktober 2026", policy["label"])
        self.assertIn("Kepmen UMKM 398/2026", policy["description"])
        self.assertEqual(policy["verification_days"], 10)
        self.assertEqual(policy["grant_days"], 5)

    def test_effective_date_is_active(self):
        policy = server.build_policy(date(2026, 10, 25))
        self.assertEqual(policy["status"], "aktif")
        self.assertEqual(policy["days_left"], 0)
        self.assertIn("sudah berlaku", policy["label"])

    def test_timeline_marks_effective_date_done_after_start(self):
        before = server.build_policy(date(2026, 10, 21))
        after = server.build_policy(date(2026, 10, 26))
        before_status = [t["status"] for t in before["timeline"] if t["date"] == "25 Oktober 2026"][0]
        after_status = [t["status"] for t in after["timeline"] if t["date"] == "25 Oktober 2026"][0]
        self.assertEqual(before_status, "progres")
        self.assertEqual(after_status, "selesai")

    def test_policy_source_is_cited(self):
        policy = server.build_policy(date(2026, 10, 21))
        self.assertIn("Kepmen UMKM 398/2026", policy["source"])
        self.assertIn("ANTARA", policy["source"])


class EligibilityTest(unittest.TestCase):
    def test_all_requirements_met_is_eligible_with_half_saving(self):
        result, code = server.check_eligibility({
            "answers": base_answers(),
            "exclusions": {},
            "entries": [entry()],
        })
        self.assertEqual(code, 200)
        self.assertEqual(result["verdict"], "layak")
        self.assertTrue(result["savings"]["active"])
        self.assertEqual(result["savings"]["feeMonthly"], 6000000)
        self.assertEqual(result["savings"]["savingMonthly"], 3000000)
        self.assertEqual(result["savings"]["savingAnnual"], 36000000)

    def test_category_exclusion_wins(self):
        result, code = server.check_eligibility({
            "answers": base_answers(),
            "exclusions": {"pangan_siap_saji": True},
            "entries": [entry()],
        })
        self.assertEqual(code, 200)
        self.assertEqual(result["verdict"], "tidak-layak")
        self.assertEqual(result["savings"]["savingMonthly"], 0)

    def test_menengah_is_not_eligible(self):
        answers = base_answers()
        answers["skala"] = "menengah"
        result, _ = server.check_eligibility({"answers": answers, "entries": []})
        self.assertEqual(result["verdict"], "tidak-layak")

    def test_import_products_are_not_eligible(self):
        answers = base_answers()
        answers["produk_dalam_negeri"] = False
        result, _ = server.check_eligibility({"answers": answers, "entries": []})
        self.assertEqual(result["verdict"], "tidak-layak")

    def test_bad_record_is_not_eligible(self):
        answers = base_answers()
        answers["bukan_high_risk"] = False
        result, _ = server.check_eligibility({"answers": answers, "entries": []})
        self.assertEqual(result["verdict"], "tidak-layak")
        self.assertIn("Kepmen UMKM 398/2026", result["verdict_reason"])

    def test_missing_nib_is_almost_eligible(self):
        answers = base_answers()
        answers["nib"] = False
        result, _ = server.check_eligibility({"answers": answers, "entries": []})
        self.assertEqual(result["verdict"], "hampir-layak")
        self.assertFalse(result["savings"]["active"])

    def test_invalid_scale_returns_400(self):
        answers = base_answers()
        answers["skala"] = "konglomerat"
        result, code = server.check_eligibility({"answers": answers, "entries": []})
        self.assertEqual(code, 400)
        self.assertIn("error", result)


class LetterTest(unittest.TestCase):
    def test_letter_requires_identity(self):
        result, code = server.generate_letter({"nama": "Sari"})
        self.assertEqual(code, 400)
        self.assertIn("error", result)

    def test_rejection_letter_mentions_regulation_and_store(self):
        result, code = server.generate_letter({
            "nama": "Sari",
            "toko": "Toko Sari Snack",
            "marketplace": "Shopee",
            "tanggal": "21 Oktober 2026",
            "jenis": "ditolak",
        })
        self.assertEqual(code, 200)
        self.assertIn("Toko Sari Snack", result["letter"])
        self.assertIn("Permen UMKM Nomor 3 Tahun 2026", result["letter"])
        self.assertIn("ditolak", result["letter"])

    def test_stopped_letter_uses_stopped_wording(self):
        result, _ = server.generate_letter({
            "nama": "Sari",
            "toko": "Toko Sari Snack",
            "marketplace": "Shopee",
            "tanggal": "21 Oktober 2026",
            "jenis": "dihentikan",
        })
        self.assertIn("dihentikan", result["letter"])


if __name__ == "__main__":
    unittest.main()
