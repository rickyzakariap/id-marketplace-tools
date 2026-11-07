#!/usr/bin/env python3
"""Tests for the profit tracker fee model and HTTP API.

Run: python3 -m unittest -v test_server
"""

import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
TEST_DIR = tempfile.mkdtemp(prefix='profit-tracker-test-')
os.environ['PROFIT_DB'] = os.path.join(TEST_DIR, 'unit.db')
os.environ['PORT'] = '0'

import server  # noqa: E402


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request(url, method='GET', payload=None):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status, resp.read()


class TestFeeModel(unittest.TestCase):
    def test_transaction_fees_are_not_multiplied_by_qty(self):
        totals = server.calculate_totals(2, 75000, 35000, 4.5, 1000, 5000, 2000)
        self.assertEqual(totals['revenue'], 150000)
        self.assertEqual(totals['cost'], 70000)
        self.assertAlmostEqual(totals['commission_fee'], 6750)
        self.assertAlmostEqual(totals['fees'], 14750)
        self.assertAlmostEqual(totals['profit'], 65250)

    def test_single_quantity_matches_manual_formula(self):
        totals = server.calculate_totals(1, 100000, 60000, 5, 1250, 0, 0)
        self.assertAlmostEqual(totals['fees'], 6250)
        self.assertAlmostEqual(totals['profit'], 33750)

    def test_commission_scales_with_quantity(self):
        one = server.calculate_totals(1, 100000, 0, 10, 0, 0, 0)
        two = server.calculate_totals(2, 100000, 0, 10, 0, 0, 0)
        self.assertAlmostEqual(one['commission_fee'], 10000)
        self.assertAlmostEqual(two['commission_fee'], 20000)

    def test_fixed_fee_stays_flat_across_quantity(self):
        one = server.calculate_totals(1, 100000, 0, 0, 2000, 3000, 1000)
        five = server.calculate_totals(5, 100000, 0, 0, 2000, 3000, 1000)
        self.assertAlmostEqual(one['fees'], 6000)
        self.assertAlmostEqual(five['fees'], 6000)

    def test_zero_quantity_falls_back_to_one(self):
        totals = server.calculate_totals(0, 50000, 20000, 0, 0, 0, 0)
        self.assertEqual(totals['revenue'], 50000)
        self.assertEqual(totals['profit'], 30000)

    def test_missing_fee_values_are_zero(self):
        totals = server.calculate_totals(1, 50000, 20000, None, None, None, None)
        self.assertEqual(totals['fees'], 0)
        self.assertEqual(totals['profit'], 30000)


class TestApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.port = free_port()
        cls.db = os.path.join(TEST_DIR, 'api.db')
        env = os.environ.copy()
        env['PORT'] = str(cls.port)
        env['PROFIT_DB'] = cls.db
        cls.proc = subprocess.Popen(
            [sys.executable, os.path.join(BASE, 'server.py')],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        cls.base = 'http://127.0.0.1:%d' % cls.port
        deadline = time.time() + 10
        while time.time() < deadline:
            try:
                status, _ = request(cls.base + '/api/summary')
                if status == 200:
                    break
            except Exception:
                time.sleep(0.1)
        else:
            cls.proc.kill()
            raise RuntimeError('server did not start')

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
            cls.proc.wait()
        shutil.rmtree(TEST_DIR, ignore_errors=True)

    def make_transaction(self, product, **overrides):
        payload = {
            'date': '2026-11-07',
            'marketplace': 'Shopee',
            'product': product,
            'category': 'Elektronik',
            'qty': 2,
            'selling_price': 75000,
            'cost': 35000,
            'commission': 4.5,
            'platform_fee': 1000,
            'shipping_cost': 5000,
            'other_fees': 2000,
        }
        payload.update(overrides)
        status, _ = request(self.base + '/api/transactions', 'POST', payload)
        self.assertEqual(status, 200)

    def test_static_page_served(self):
        status, body = request(self.base + '/')
        self.assertEqual(status, 200)
        self.assertIn(b'Profit Tracker', body)

    def test_summary_and_breakdown_use_transaction_fees(self):
        self.make_transaction('TWS Test')

        _, body = request(self.base + '/api/summary')
        summary = json.loads(body)
        self.assertAlmostEqual(summary['total_revenue'], 150000)
        self.assertAlmostEqual(summary['total_cost'], 70000)
        self.assertAlmostEqual(summary['total_fees'], 14750)
        self.assertAlmostEqual(summary['total_profit'], 65250)

        _, body = request(self.base + '/api/breakdown?period=all')
        breakdown = json.loads(body)
        self.assertEqual(len(breakdown), 1)
        self.assertEqual(breakdown[0]['marketplace'], 'Shopee')
        self.assertEqual(breakdown[0]['count'], 1)
        self.assertAlmostEqual(breakdown[0]['fees'], 14750)
        self.assertAlmostEqual(breakdown[0]['profit'], 65250)

    def test_delete_transaction(self):
        self.make_transaction('Delete Me')
        _, body = request(self.base + '/api/transactions')
        rows = json.loads(body)
        target = next(row for row in rows if row['product'] == 'Delete Me')

        status, _ = request(self.base + '/api/transactions/%d' % target['id'], 'DELETE')
        self.assertEqual(status, 200)

        _, body = request(self.base + '/api/transactions')
        ids = [row['id'] for row in json.loads(body)]
        self.assertNotIn(target['id'], ids)


if __name__ == '__main__':
    unittest.main()
