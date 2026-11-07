#!/usr/bin/env python3
"""Profit Tracker Dashboard - Track real profit across marketplaces."""

import json
import http.server
import socketserver
import sqlite3
import os
import datetime

PORT = int(os.environ.get('PORT', 3462))
DB_PATH = os.environ.get(
    'PROFIT_DB',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'profit.db'),
)

MARKETPLACES = ['Tokopedia', 'Shopee', 'Lazada', 'Bukalapak', 'Blibli', 'TikTok Shop']
CATEGORIES = ['Elektronik', 'Fashion', 'Makanan', 'Kecantikan', 'Rumah Tangga', 'Kesehatan', 'Olahraga', 'Lainnya']

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def calculate_totals(qty, selling_price, cost, commission, platform_fee, shipping_cost, other_fees):
    """Return revenue, cost, fees and profit for one transaction.

    Selling price, cost and commission scale with qty. Platform, shipping and
    other fees are charged per transaction, so they must not be multiplied by qty.
    """
    qty = max(int(qty or 1), 1)
    revenue = float(selling_price or 0) * qty
    total_cost = float(cost or 0) * qty
    commission_fee = revenue * (float(commission or 0) / 100.0)
    fees = (
        commission_fee
        + float(platform_fee or 0)
        + float(shipping_cost or 0)
        + float(other_fees or 0)
    )
    return {
        'revenue': revenue,
        'cost': total_cost,
        'commission_fee': commission_fee,
        'fees': fees,
        'profit': revenue - total_cost - fees,
    }

def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        marketplace TEXT NOT NULL,
        product TEXT NOT NULL,
        category TEXT DEFAULT 'Lainnya',
        qty INTEGER DEFAULT 1,
        selling_price REAL NOT NULL,
        cost REAL NOT NULL,
        commission REAL DEFAULT 0,
        platform_fee REAL DEFAULT 0,
        shipping_cost REAL DEFAULT 0,
        other_fees REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )''')
    conn.commit()
    conn.close()

init_db()

INDEX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'index.html')


def render_index():
    with open(INDEX_PATH, encoding='utf-8') as fh:
        return (
            fh.read()
            .replace('%MARKETPLACES%', json.dumps(MARKETPLACES))
            .replace('%CATEGORIES%', json.dumps(CATEGORIES))
        )


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            html = render_index()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode())
            return

        if self.path == '/api/summary':
            conn = get_db()
            rows = conn.execute('SELECT * FROM transactions').fetchall()
            totals = {'revenue': 0.0, 'cost': 0.0, 'fees': 0.0, 'profit': 0.0}
            for row in rows:
                item = calculate_totals(
                    row['qty'], row['selling_price'], row['cost'], row['commission'],
                    row['platform_fee'], row['shipping_cost'], row['other_fees'],
                )
                for key in totals:
                    totals[key] += item[key]
            self._json({
                'total_revenue': totals['revenue'],
                'total_cost': totals['cost'],
                'total_fees': totals['fees'],
                'total_profit': totals['profit']
            })
            conn.close()
            return

        if self.path.startswith('/api/transactions'):
            conn = get_db()
            query = 'SELECT * FROM transactions WHERE 1=1'
            params = []
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(self.path).query)
            if 'marketplace' in qs:
                query += ' AND marketplace = ?'
                params.append(qs['marketplace'][0])
            if 'category' in qs:
                query += ' AND category = ?'
                params.append(qs['category'][0])
            if 'from' in qs:
                query += ' AND date >= ?'
                params.append(qs['from'][0])
            if 'to' in qs:
                query += ' AND date <= ?'
                params.append(qs['to'][0])
            query += ' ORDER BY date DESC, id DESC'
            rows = conn.execute(query, params).fetchall()
            self._json([dict(r) for r in rows])
            conn.close()
            return

        if self.path.startswith('/api/breakdown'):
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(self.path).query)
            period = qs.get('period', ['all'])[0]
            conn = get_db()
            date_filter = ''
            if period == 'month':
                today = datetime.date.today()
                first = today.replace(day=1).isoformat()
                date_filter = f" AND date >= '{first}'"
            elif period == 'week':
                today = datetime.date.today()
                monday = (today - datetime.timedelta(days=today.weekday())).isoformat()
                date_filter = f" AND date >= '{monday}'"

            rows = conn.execute(
                f'SELECT * FROM transactions WHERE 1=1{date_filter}'
            ).fetchall()
            grouped = {}
            for row in rows:
                item = calculate_totals(
                    row['qty'], row['selling_price'], row['cost'], row['commission'],
                    row['platform_fee'], row['shipping_cost'], row['other_fees'],
                )
                bucket = grouped.setdefault(row['marketplace'], {
                    'marketplace': row['marketplace'],
                    'count': 0,
                    'revenue': 0.0,
                    'cost': 0.0,
                    'fees': 0.0,
                    'profit': 0.0,
                })
                bucket['count'] += 1
                for key in ('revenue', 'cost', 'fees', 'profit'):
                    bucket[key] += item[key]
            result = sorted(grouped.values(), key=lambda row: row['revenue'], reverse=True)
            self._json(result)
            conn.close()
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/transactions':
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
            conn = get_db()
            conn.execute('''INSERT INTO transactions
                (date, marketplace, product, category, qty, selling_price, cost, commission, platform_fee, shipping_cost, other_fees, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (body['date'], body['marketplace'], body['product'], body.get('category', 'Lainnya'),
                 body.get('qty', 1), body['selling_price'], body['cost'],
                 body.get('commission', 0), body.get('platform_fee', 0),
                 body.get('shipping_cost', 0), body.get('other_fees', 0), body.get('notes', '')))
            conn.commit()
            conn.close()
            self._json({'ok': True})
            return
        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        if self.path.startswith('/api/transactions/'):
            tid = self.path.split('/')[-1]
            conn = get_db()
            conn.execute('DELETE FROM transactions WHERE id = ?', (tid,))
            conn.commit()
            conn.close()
            self._json({'ok': True})
            return
        self.send_response(404)
        self.end_headers()

    def _json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Profit Tracker running at http://localhost:{PORT}')
        httpd.serve_forever()
