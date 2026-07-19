#!/usr/bin/env python3
"""Profit Tracker Dashboard - Track real profit across marketplaces."""

import json
import http.server
import socketserver
import sqlite3
import os
import datetime

PORT = 3462
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'profit.db')

MARKETPLACES = ['Tokopedia', 'Shopee', 'Lazada', 'Bukalapak', 'Blibli', 'TikTok Shop']
CATEGORIES = ['Elektronik', 'Fashion', 'Makanan', 'Kecantikan', 'Rumah Tangga', 'Kesehatan', 'Olahraga', 'Lainnya']

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Profit Tracker</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;--yellow:#ca8a04;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent-light:#1a2e28;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
.container{max-width:1100px;margin:0 auto;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.header h1{font-size:1.5rem;font-weight:600}
.header-actions{display:flex;gap:8px;align-items:center}
.theme-toggle{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem}
.theme-toggle:hover{border-color:var(--accent);color:var(--accent)}

/* Summary cards */
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.summary-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px}
.summary-card .label{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:4px}
.summary-card .value{font-size:1.4rem;font-weight:600;font-family:'JetBrains Mono',monospace}
.summary-card .value.green{color:var(--green)}
.summary-card .value.red{color:var(--red)}

/* Tabs */
.tabs{display:flex;gap:0;margin-bottom:0;border-bottom:2px solid var(--border)}
.tab{padding:10px 20px;font-size:0.85rem;font-weight:500;cursor:pointer;color:var(--text-dim);border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Panels */
.panel{display:none;padding-top:20px}
.panel.active{display:block}

/* Form */
.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.form-group{margin-bottom:12px}
.form-group label{display:block;font-size:0.8rem;font-weight:500;color:var(--text-dim);margin-bottom:4px}
.form-group input,.form-group select{width:100%;padding:10px 12px;border:1px solid var(--input-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:0.9rem;font-family:inherit}
.form-group input:focus,.form-group select:focus{outline:none;border-color:var(--accent)}
.form-group .hint{font-size:0.7rem;color:var(--text-muted);margin-top:2px}
.btn{background:var(--accent);color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:0.9rem;font-weight:500;cursor:pointer;font-family:inherit}
.btn:hover{background:var(--accent-hover)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-danger{background:var(--red)}
.btn-danger:hover{background:#b91c1c}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text-dim)}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.form-actions{display:flex;gap:8px;margin-top:8px}

/* Marketplace breakdown */
.breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.breakdown-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px}
.breakdown-card .mp-name{font-size:0.85rem;font-weight:600;margin-bottom:8px}
.breakdown-card .mp-stat{display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px}
.breakdown-card .mp-stat .label{color:var(--text-dim)}
.breakdown-card .mp-stat .val{font-family:'JetBrains Mono',monospace;font-weight:500}
.breakdown-card .mp-profit{font-size:1.1rem;font-weight:600;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}
.breakdown-card .mp-profit.positive{color:var(--green)}
.breakdown-card .mp-profit.negative{color:var(--red)}

/* Table */
.table-wrap{overflow-x:auto;margin-top:12px}
table{width:100%;border-collapse:collapse;font-size:0.85rem}
th{text-align:left;padding:10px 12px;border-bottom:2px solid var(--border);font-weight:600;color:var(--text-dim);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em}
td{padding:10px 12px;border-bottom:1px solid var(--border)}
tr:hover{background:var(--card-alt)}
.mono{font-family:'JetBrains Mono',monospace}
.profit-positive{color:var(--green);font-weight:500}
.profit-negative{color:var(--red);font-weight:500}
.delete-btn{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;padding:4px 8px;border-radius:4px}
.delete-btn:hover{color:var(--red);background:rgba(220,38,38,0.1)}

/* Filters */
.filters{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.filters select,.filters input{padding:8px 12px;border:1px solid var(--input-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:0.85rem;font-family:inherit}
.filters select:focus,.filters input:focus{outline:none;border-color:var(--accent)}
.filter-label{font-size:0.8rem;color:var(--text-dim)}

.empty-state{text-align:center;padding:40px 20px;color:var(--text-muted)}
.empty-state p{font-size:0.9rem;margin-top:8px}

@media(max-width:768px){
  .summary{grid-template-columns:repeat(2,1fr)}
  .form-grid{grid-template-columns:1fr}
  .breakdown{grid-template-columns:1fr}
  .container{padding:12px}
  .header h1{font-size:1.2rem}
  .tabs{flex-wrap:wrap}
  .tab{padding:8px 14px;font-size:0.8rem}
  .filters{flex-direction:column}
  .filters select,.filters input{width:100%}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Profit Tracker</h1>
    <div class="header-actions">
      <button class="btn btn-outline" onclick="exportCSV()">Export CSV</button>
      <button class="theme-toggle" onclick="toggleTheme()">Dark</button>
    </div>
  </div>

  <div class="summary" id="summary">
    <div class="summary-card"><div class="label">Total Revenue</div><div class="value" id="totalRevenue">Rp 0</div></div>
    <div class="summary-card"><div class="label">Total Cost</div><div class="value" id="totalCost">Rp 0</div></div>
    <div class="summary-card"><div class="label">Total Fees</div><div class="value" id="totalFees">Rp 0</div></div>
    <div class="summary-card"><div class="label">Net Profit</div><div class="value" id="totalProfit">Rp 0</div></div>
  </div>

  <div class="tabs">
    <div class="tab active" data-panel="add">Tambah Transaksi</div>
    <div class="tab" data-panel="history">Riwayat</div>
    <div class="tab" data-panel="breakdown">Breakdown</div>
  </div>

  <div class="panel active" id="panel-add">
    <div class="form-grid">
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" id="date">
      </div>
      <div class="form-group">
        <label>Marketplace</label>
        <select id="marketplace"></select>
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select id="category"></select>
      </div>
      <div class="form-group">
        <label>Nama Produk</label>
        <input type="text" id="product" placeholder="TWS Bluetooth Earphone">
      </div>
      <div class="form-group">
        <label>Qty</label>
        <input type="number" id="qty" value="1" min="1">
      </div>
      <div class="form-group">
        <label>Harga Jual (per item)</label>
        <input type="number" id="sellingPrice" placeholder="75000">
      </div>
      <div class="form-group">
        <label>Harga Modal (per item)</label>
        <input type="number" id="cost" placeholder="35000">
      </div>
      <div class="form-group">
        <label>Komisi Marketplace (%)</label>
        <input type="number" id="commission" placeholder="5" step="0.1">
        <div class="hint">Biasanya 2-6% tergantung kategori</div>
      </div>
      <div class="form-group">
        <label>Biaya Layanan</label>
        <input type="number" id="platformFee" placeholder="1000">
        <div class="hint">Biaya platform per transaksi</div>
      </div>
      <div class="form-group">
        <label>Ongkir (yang seller tanggung)</label>
        <input type="number" id="shippingCost" placeholder="0">
      </div>
      <div class="form-group">
        <label>Biaya Lainnya</label>
        <input type="number" id="otherFees" placeholder="0">
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" id="notes" placeholder="Opsional">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn" id="saveBtn" onclick="saveTransaction()">Simpan Transaksi</button>
      <button class="btn btn-outline" onclick="fillExample()">Isi Contoh</button>
    </div>
  </div>

  <div class="panel" id="panel-history">
    <div class="filters">
      <span class="filter-label">Filter:</span>
      <select id="filterMp" onchange="loadHistory()"><option value="">Semua Marketplace</option></select>
      <select id="filterCat" onchange="loadHistory()"><option value="">Semua Kategori</option></select>
      <input type="date" id="filterFrom" onchange="loadHistory()">
      <span class="filter-label">sampai</span>
      <input type="date" id="filterTo" onchange="loadHistory()">
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Marketplace</th>
            <th>Produk</th>
            <th>Qty</th>
            <th>Revenue</th>
            <th>Modal</th>
            <th>Fees</th>
            <th>Profit</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="historyBody"></tbody>
      </table>
    </div>
    <div class="empty-state" id="emptyHistory" style="display:none">
      <p>Belum ada transaksi. Tambahkan di tab "Tambah Transaksi".</p>
    </div>
  </div>

  <div class="panel" id="panel-breakdown">
    <div class="filters">
      <span class="filter-label">Periode:</span>
      <select id="breakdownPeriod" onchange="loadBreakdown()">
        <option value="all">Semua Waktu</option>
        <option value="month">Bulan Ini</option>
        <option value="week">Minggu Ini</option>
      </select>
    </div>
    <div class="breakdown" id="breakdownGrid"></div>
    <div class="empty-state" id="emptyBreakdown" style="display:none">
      <p>Belum ada data untuk periode ini.</p>
    </div>
  </div>
</div>

<script>
const MARKETPLACES = %MARKETPLACES%;
const CATEGORIES = %CATEGORIES%;

// Theme
function toggleTheme() {
  const isDark = document.body.hasAttribute('data-theme');
  if (isDark) {
    document.body.removeAttribute('data-theme');
    document.querySelector('.theme-toggle').textContent = 'Dark';
    localStorage.setItem('theme', 'light');
  } else {
    document.body.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').textContent = 'Light';
    localStorage.setItem('theme', 'dark');
  }
}
if (localStorage.getItem('theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.querySelector('.theme-toggle').textContent = 'Light';
}

// Init dropdowns
const mpSelect = document.getElementById('marketplace');
const catSelect = document.getElementById('category');
const filterMp = document.getElementById('filterMp');
const filterCat = document.getElementById('filterCat');

MARKETPLACES.forEach(m => {
  mpSelect.innerHTML += `<option value="${m}">${m}</option>`;
  filterMp.innerHTML += `<option value="${m}">${m}</option>`;
});
CATEGORIES.forEach(c => {
  catSelect.innerHTML += `<option value="${c}">${c}</option>`;
  filterCat.innerHTML += `<option value="${c}">${c}</option>`;
});

// Set today's date
document.getElementById('date').value = new Date().toISOString().split('T')[0];

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('panel-' + this.dataset.panel).classList.add('active');
    if (this.dataset.panel === 'history') loadHistory();
    if (this.dataset.panel === 'breakdown') loadBreakdown();
  });
});

function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function calcProfit(t) {
  const revenue = t.selling_price * t.qty;
  const cost = t.cost * t.qty;
  const commission = revenue * (t.commission / 100);
  const fees = commission + (t.platform_fee * t.qty) + (t.shipping_cost * t.qty) + (t.other_fees * t.qty);
  return revenue - cost - fees;
}

async function loadSummary() {
  const resp = await fetch('/api/summary');
  const data = await resp.json();
  document.getElementById('totalRevenue').textContent = fmt(data.total_revenue);
  document.getElementById('totalCost').textContent = fmt(data.total_cost);
  document.getElementById('totalFees').textContent = fmt(data.total_fees);
  const profitEl = document.getElementById('totalProfit');
  profitEl.textContent = fmt(data.total_profit);
  profitEl.className = 'value ' + (data.total_profit >= 0 ? 'green' : 'red');
}

async function saveTransaction() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const body = {
    date: document.getElementById('date').value,
    marketplace: document.getElementById('marketplace').value,
    product: document.getElementById('product').value,
    category: document.getElementById('category').value,
    qty: parseInt(document.getElementById('qty').value) || 1,
    selling_price: parseFloat(document.getElementById('sellingPrice').value) || 0,
    cost: parseFloat(document.getElementById('cost').value) || 0,
    commission: parseFloat(document.getElementById('commission').value) || 0,
    platform_fee: parseFloat(document.getElementById('platformFee').value) || 0,
    shipping_cost: parseFloat(document.getElementById('shippingCost').value) || 0,
    other_fees: parseFloat(document.getElementById('otherFees').value) || 0,
    notes: document.getElementById('notes').value
  };

  if (!body.product || !body.selling_price) {
    alert('Nama produk dan harga jual wajib diisi');
    btn.disabled = false;
    btn.textContent = 'Simpan Transaksi';
    return;
  }

  const resp = await fetch('/api/transactions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    // Clear form (except date, marketplace, category)
    document.getElementById('product').value = '';
    document.getElementById('qty').value = '1';
    document.getElementById('sellingPrice').value = '';
    document.getElementById('cost').value = '';
    document.getElementById('commission').value = '';
    document.getElementById('platformFee').value = '';
    document.getElementById('shippingCost').value = '';
    document.getElementById('otherFees').value = '';
    document.getElementById('notes').value = '';
    loadSummary();
  }

  btn.disabled = false;
  btn.textContent = 'Simpan Transaksi';
}

function fillExample() {
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  document.getElementById('marketplace').value = 'Shopee';
  document.getElementById('category').value = 'Elektronik';
  document.getElementById('product').value = 'TWS Bluetooth Earphone';
  document.getElementById('qty').value = '2';
  document.getElementById('sellingPrice').value = '75000';
  document.getElementById('cost').value = '35000';
  document.getElementById('commission').value = '4.5';
  document.getElementById('platformFee').value = '1000';
  document.getElementById('shippingCost').value = '0';
  document.getElementById('otherFees').value = '0';
}

async function loadHistory() {
  const mp = document.getElementById('filterMp').value;
  const cat = document.getElementById('filterCat').value;
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;

  let url = '/api/transactions?';
  if (mp) url += 'marketplace=' + encodeURIComponent(mp) + '&';
  if (cat) url += 'category=' + encodeURIComponent(cat) + '&';
  if (from) url += 'from=' + from + '&';
  if (to) url += 'to=' + to + '&';

  const resp = await fetch(url);
  const data = await resp.json();
  const tbody = document.getElementById('historyBody');
  const empty = document.getElementById('emptyHistory');

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(t => {
    const revenue = t.selling_price * t.qty;
    const cost = t.cost * t.qty;
    const commission = revenue * (t.commission / 100);
    const fees = commission + (t.platform_fee * t.qty) + (t.shipping_cost * t.qty) + (t.other_fees * t.qty);
    const profit = revenue - cost - fees;
    const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
    return `<tr>
      <td>${t.date}</td>
      <td>${t.marketplace}</td>
      <td>${escapeHtml(t.product)}</td>
      <td class="mono">${t.qty}</td>
      <td class="mono">${fmt(revenue)}</td>
      <td class="mono">${fmt(cost)}</td>
      <td class="mono">${fmt(fees)}</td>
      <td class="mono ${profitClass}">${fmt(profit)}</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Hapus</button></td>
    </tr>`;
  }).join('');
}

async function deleteTransaction(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  await fetch('/api/transactions/' + id, {method: 'DELETE'});
  loadHistory();
  loadSummary();
}

async function loadBreakdown() {
  const period = document.getElementById('breakdownPeriod').value;
  const resp = await fetch('/api/breakdown?period=' + period);
  const data = await resp.json();
  const grid = document.getElementById('breakdownGrid');
  const empty = document.getElementById('emptyBreakdown');

  if (data.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = data.map(mp => {
    const profitClass = mp.profit >= 0 ? 'positive' : 'negative';
    return `<div class="breakdown-card">
      <div class="mp-name">${escapeHtml(mp.marketplace)}</div>
      <div class="mp-stat"><span class="label">Transaksi</span><span class="val mono">${mp.count}</span></div>
      <div class="mp-stat"><span class="label">Revenue</span><span class="val mono">${fmt(mp.revenue)}</span></div>
      <div class="mp-stat"><span class="label">Modal</span><span class="val mono">${fmt(mp.cost)}</span></div>
      <div class="mp-stat"><span class="label">Fees</span><span class="val mono">${fmt(mp.fees)}</span></div>
      <div class="mp-profit ${profitClass}">${fmt(mp.profit)}</div>
    </div>`;
  }).join('');
}

async function exportCSV() {
  const resp = await fetch('/api/transactions');
  const data = await resp.json();
  if (data.length === 0) { alert('Tidak ada data untuk di-export'); return; }

  const headers = ['Tanggal','Marketplace','Produk','Kategori','Qty','Harga Jual','Modal','Komisi(%)','Biaya Layanan','Ongkir','Biaya Lain','Catatan','Revenue','Total Fees','Profit'];
  const rows = data.map(t => {
    const revenue = t.selling_price * t.qty;
    const cost = t.cost * t.qty;
    const commission = revenue * (t.commission / 100);
    const fees = commission + (t.platform_fee * t.qty) + (t.shipping_cost * t.qty) + (t.other_fees * t.qty);
    const profit = revenue - cost - fees;
    return [t.date, t.marketplace, t.product, t.category, t.qty, t.selling_price, t.cost, t.commission, t.platform_fee, t.shipping_cost, t.other_fees, t.notes, revenue.toFixed(0), fees.toFixed(0), profit.toFixed(0)];
  });

  const csv = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'profit-tracker-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Keyboard shortcut
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'Enter' && document.getElementById('panel-add').classList.contains('active')) {
    saveTransaction();
  }
});

// Load initial data
loadSummary();
</script>
</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            html = HTML_TEMPLATE.replace('%MARKETPLACES%', json.dumps(MARKETPLACES)).replace('%CATEGORIES%', json.dumps(CATEGORIES))
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode())
            return

        if self.path == '/api/summary':
            conn = get_db()
            row = conn.execute('''SELECT
                COALESCE(SUM(selling_price * qty), 0) as total_revenue,
                COALESCE(SUM(cost * qty), 0) as total_cost,
                COALESCE(SUM(commission * selling_price * qty / 100.0 + platform_fee * qty + shipping_cost * qty + other_fees * qty), 0) as total_fees
            FROM transactions''').fetchone()
            profit = row['total_revenue'] - row['total_cost'] - row['total_fees']
            self._json({
                'total_revenue': row['total_revenue'],
                'total_cost': row['total_cost'],
                'total_fees': row['total_fees'],
                'total_profit': profit
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

            rows = conn.execute(f'''SELECT marketplace,
                COUNT(*) as count,
                SUM(selling_price * qty) as revenue,
                SUM(cost * qty) as cost,
                SUM(commission * selling_price * qty / 100.0 + platform_fee * qty + shipping_cost * qty + other_fees * qty) as fees
            FROM transactions WHERE 1=1{date_filter}
            GROUP BY marketplace ORDER BY revenue DESC''').fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d['profit'] = d['revenue'] - d['cost'] - d['fees']
                result.append(d)
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
