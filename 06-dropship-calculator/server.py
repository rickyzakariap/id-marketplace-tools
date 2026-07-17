#!/usr/bin/env python3
"""Dropship Margin Calculator - Hitung profit dropship lintas marketplace."""

import json
import http.server
import urllib.parse
import os
import re

PORT = 3459

# Marketplace fee structures (2026 data)
MARKETPLACES = {
    "tokopedia": {
        "name": "Tokopedia",
        "commission": {
            "fashion": 0.045,
            "electronics": 0.035,
            "food": 0.04,
            "beauty": 0.045,
            "home": 0.04,
            "default": 0.04,
        },
        "service_fee": 0.005,
        "payment_fee": 0.015,
        "admin_fee": 1000,
        "max_shipping_subsidy": 20000,
    },
    "shopee": {
        "name": "Shopee",
        "commission": {
            "fashion": 0.06,
            "electronics": 0.04,
            "food": 0.05,
            "beauty": 0.06,
            "home": 0.05,
            "default": 0.05,
        },
        "service_fee": 0.005,
        "payment_fee": 0.02,
        "admin_fee": 0,
        "max_shipping_subsidy": 30000,
    },
    "tiktokshop": {
        "name": "TikTok Shop",
        "commission": {
            "fashion": 0.05,
            "electronics": 0.03,
            "food": 0.04,
            "beauty": 0.05,
            "home": 0.04,
            "default": 0.04,
        },
        "service_fee": 0.005,
        "payment_fee": 0.01,
        "admin_fee": 500,
        "max_shipping_subsidy": 25000,
    },
    "lazada": {
        "name": "Lazada",
        "commission": {
            "fashion": 0.055,
            "electronics": 0.035,
            "food": 0.04,
            "beauty": 0.055,
            "home": 0.045,
            "default": 0.045,
        },
        "service_fee": 0.005,
        "payment_fee": 0.018,
        "admin_fee": 800,
        "max_shipping_subsidy": 20000,
    },
    "bukalapak": {
        "name": "Bukalapak",
        "commission": {
            "fashion": 0.04,
            "electronics": 0.03,
            "food": 0.035,
            "beauty": 0.04,
            "home": 0.035,
            "default": 0.035,
        },
        "service_fee": 0.005,
        "payment_fee": 0.015,
        "admin_fee": 500,
        "max_shipping_subsidy": 15000,
    },
    "blibli": {
        "name": "Blibli",
        "commission": {
            "fashion": 0.05,
            "electronics": 0.03,
            "food": 0.04,
            "beauty": 0.05,
            "home": 0.04,
            "default": 0.04,
        },
        "service_fee": 0.005,
        "payment_fee": 0.015,
        "admin_fee": 1000,
        "max_shipping_subsidy": 20000,
    },
}

def estimate_shipping(weight_kg, marketplace_id):
    base = 8000
    per_kg = 5000
    return base + max(0, weight_kg - 0.5) * per_kg

def calculate_margin(supplier_cost, selling_price, marketplace, category, weight_kg, free_ongkir=False):
    mp = MARKETPLACES.get(marketplace, MARKETPLACES["tokopedia"])
    comm_rate = mp["commission"].get(category, mp["commission"]["default"])
    commission = selling_price * comm_rate
    service_fee = selling_price * mp["service_fee"]
    payment_fee = selling_price * mp["payment_fee"]
    admin_fee = mp["admin_fee"]
    total_fees = commission + service_fee + payment_fee + admin_fee
    shipping_cost = estimate_shipping(weight_kg, marketplace)
    shipping_subsidy = min(shipping_cost, mp["max_shipping_subsidy"]) if free_ongkir else 0
    net_revenue = selling_price - total_fees
    profit = net_revenue - supplier_cost
    margin_pct = (profit / selling_price * 100) if selling_price > 0 else 0
    roi_pct = (profit / supplier_cost * 100) if supplier_cost > 0 else 0
    total_fee_rate = comm_rate + mp["service_fee"] + mp["payment_fee"]
    break_even = supplier_cost / (1 - total_fee_rate) if total_fee_rate < 1 else supplier_cost * 2
    recommended = int((break_even + 1000) / 1000) * 1000 + 1000
    recommended_x999 = recommended - 1 if recommended > 1000 else 0
    return {
        "marketplace": mp["name"], "marketplace_id": marketplace,
        "selling_price": selling_price, "supplier_cost": supplier_cost,
        "commission": round(commission), "commission_rate": f"{comm_rate*100:.1f}%",
        "service_fee": round(service_fee), "payment_fee": round(payment_fee),
        "admin_fee": admin_fee, "total_fees": round(total_fees),
        "shipping_cost": shipping_cost, "shipping_subsidy": shipping_subsidy,
        "net_revenue": round(net_revenue), "profit": round(profit),
        "margin_pct": round(margin_pct, 1), "roi_pct": round(roi_pct, 1),
        "break_even": round(break_even), "recommended_price": recommended,
        "recommended_x999": recommended_x999, "free_ongkir": free_ongkir,
    }

def compare_all(supplier_cost, selling_price, category, weight_kg, free_ongkir=False):
    results = [calculate_margin(supplier_cost, selling_price, mp_id, category, weight_kg, free_ongkir) for mp_id in MARKETPLACES]
    results.sort(key=lambda x: x["profit"], reverse=True)
    return results

HTML_PAGE = r"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dropship Margin Calculator</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent:#4a9;--accent-hover:#5ba8;--accent-light:#1a2a25;
  --green:#4ade80;--red:#f87171;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;min-height:100vh;padding:20px}
.container{max-width:1000px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
h1{font-size:1.4rem;font-weight:600;color:var(--text)}
.subtitle{color:var(--text-dim);font-size:0.85rem;margin-bottom:24px}
.theme-toggle{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:0.78rem;color:var(--text-dim)}
.theme-toggle:hover{background:var(--card-alt)}
.grid{display:grid;grid-template-columns:1fr 2fr;gap:16px}
@media(max-width:768px){.grid{grid-template-columns:1fr}.chip-grid{grid-template-columns:repeat(2,1fr)}.fee-grid{grid-template-columns:repeat(2,1fr)}.container{padding:12px}}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px}
.section-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:14px;font-weight:500}
label{display:block;font-size:0.82rem;color:var(--text-dim);margin-bottom:4px;margin-top:14px}
label:first-of-type{margin-top:0}
input,select{width:100%;padding:10px 12px;background:var(--input-bg);border:1px solid var(--input-border);border-radius:6px;color:var(--text);font-size:0.88rem;font-family:inherit}
input:focus,select:focus{outline:none;border-color:var(--accent)}
input[type=number]{font-family:'JetBrains Mono',monospace,'Inter',sans-serif;font-size:0.85rem}
select{cursor:pointer}
.check-row{display:flex;align-items:center;gap:8px;margin-top:14px}
.check-row input[type=checkbox]{width:auto;accent-color:var(--accent)}
.check-row label{margin:0;cursor:pointer;font-size:0.85rem}
.example-row{margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.example-row span{font-size:0.72rem;color:var(--text-muted)}
.example-btn{padding:3px 10px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--accent);font-size:0.72rem;cursor:pointer}
.example-btn:hover{background:var(--accent-light)}
.chip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}
.chip{padding:8px 0;text-align:center;border:1px solid var(--border);border-radius:6px;font-size:0.78rem;color:var(--text-dim);cursor:pointer;transition:border-color 0.15s}
.chip:hover{border-color:var(--accent)}
.chip.active{border-color:var(--accent);background:var(--accent-light);color:var(--accent)}
.validation{margin-top:10px;padding:8px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#b91c1c;font-size:0.82rem;display:none}
[data-theme="dark"] .validation{background:#3a1a1a;border-color:#7f1d1d;color:#fca5a5}
.btn{width:100%;padding:12px;margin-top:14px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:0.88rem;font-weight:500;cursor:pointer;font-family:inherit}
.btn:hover{background:var(--accent-hover)}
.btn-sec{background:var(--card);color:var(--text);border:1px solid var(--border);margin-top:8px}
.btn-sec:hover{background:var(--card-alt)}
.results{margin-top:20px}
.result-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px}
.result-card.best{border-left:3px solid var(--green)}
.result-card.loss{border-left:3px solid var(--red)}
.mp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mp-name{font-weight:600;font-size:0.95rem}
.badge{padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:500}
.badge-green{background:var(--accent-light);color:var(--green)}
.badge-red{background:#fef2f2;color:var(--red)}
.badge-gray{background:var(--card-alt);color:var(--text-muted)}
[data-theme="dark"] .badge-red{background:#3a1a1a}
.fee-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.fee-item{font-size:0.75rem}
.fee-label{color:var(--text-muted)}
.fee-value{font-family:'JetBrains Mono',monospace,'Inter',sans-serif;font-size:0.82rem;color:var(--text)}
.summary-row{display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid var(--border);margin-top:6px;font-size:0.85rem}
.summary-row.profit{font-weight:600}
.val-green{color:var(--green)}
.val-red{color:var(--red)}
.recommend{margin-top:8px;padding:8px 12px;background:var(--card-alt);border-radius:6px;font-size:0.78rem;color:var(--text-dim)}
.recommend strong{color:var(--accent)}
.empty{text-align:center;padding:60px 20px;color:var(--text-muted);font-size:0.88rem}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Dropship Margin Calculator</h1>
    <button class="theme-toggle" onclick="toggleTheme()" id="themeBtn">Dark</button>
  </div>
  <p class="subtitle">Hitung profit dropship lintas marketplace Indonesia</p>

  <div class="grid">
    <div class="card">
      <div class="section-label">Input Produk</div>

      <label>Harga Supplier (Rp)</label>
      <input type="number" id="supplierCost" placeholder="50000" min="0" step="1000">

      <label>Harga Jual (Rp)</label>
      <input type="number" id="sellingPrice" placeholder="85000" min="0" step="1000">

      <label>Marketplace</label>
      <div class="chip-grid">
        <div class="chip active" data-mp="tokopedia" onclick="selectMp(this)">Tokopedia</div>
        <div class="chip" data-mp="shopee" onclick="selectMp(this)">Shopee</div>
        <div class="chip" data-mp="tiktokshop" onclick="selectMp(this)">TikTok Shop</div>
        <div class="chip" data-mp="lazada" onclick="selectMp(this)">Lazada</div>
        <div class="chip" data-mp="bukalapak" onclick="selectMp(this)">Bukalapak</div>
        <div class="chip" data-mp="blibli" onclick="selectMp(this)">Blibli</div>
      </div>

      <label>Kategori</label>
      <select id="category">
        <option value="fashion">Fashion</option>
        <option value="electronics">Elektronik</option>
        <option value="food">Makanan & Minuman</option>
        <option value="beauty">Kecantikan</option>
        <option value="home">Rumah & Dekorasi</option>
      </select>

      <label>Berat (kg)</label>
      <input type="number" id="weight" placeholder="0.5" min="0.1" step="0.1" value="0.5">

      <div class="check-row">
        <input type="checkbox" id="freeOngkir" checked>
        <label for="freeOngkir">Pakai Free Ongkir</label>
      </div>

      <div class="example-row">
        <span>Contoh:</span>
        <button class="example-btn" onclick="fillExample('fashion')">Fashion</button>
        <button class="example-btn" onclick="fillExample('electronics')">Elektronik</button>
        <button class="example-btn" onclick="fillExample('beauty')">Kecantikan</button>
      </div>

      <div id="validationMsg" class="validation"></div>

      <button class="btn" onclick="calculate()">Hitung Margin</button>
      <button class="btn btn-sec" onclick="compareAll()">Bandingkan Semua Marketplace</button>
    </div>

    <div>
      <div id="results" class="card">
        <div class="empty">Masukkan data, pilih marketplace, lalu hitung</div>
      </div>
    </div>
  </div>
</div>

<script>
// Theme toggle
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeBtn').textContent = next === 'dark' ? 'Light' : 'Dark';
}
document.getElementById('themeBtn').textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

const EXAMPLES = {
  fashion: {supplier:35000,selling:79000,weight:0.3},
  electronics: {supplier:150000,selling:225000,weight:0.8},
  beauty: {supplier:25000,selling:55000,weight:0.2},
};

let selectedMp = 'tokopedia';

function selectMp(el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedMp = el.dataset.mp;
}

function fillExample(cat) {
  const e = EXAMPLES[cat];
  document.getElementById('supplierCost').value = e.supplier;
  document.getElementById('sellingPrice').value = e.selling;
  document.getElementById('category').value = cat;
  document.getElementById('weight').value = e.weight;
  calculate();
}

function getInputs() {
  return {
    supplier: parseInt(document.getElementById('supplierCost').value) || 0,
    selling: parseInt(document.getElementById('sellingPrice').value) || 0,
    category: document.getElementById('category').value,
    weight: parseFloat(document.getElementById('weight').value) || 0.5,
    freeOngkir: document.getElementById('freeOngkir').checked,
  };
}

function showValidation(msg) {
  const el = document.getElementById('validationMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

function fmt(n) { return 'Rp ' + n.toLocaleString('id-ID'); }

function renderResult(r, isBest, isLoss) {
  const cls = isBest ? 'best' : (isLoss ? 'loss' : '');
  const profitCls = r.profit >= 0 ? 'val-green' : 'val-red';
  const badgeCls = r.profit >= 0 ? (isBest ? 'badge-green' : 'badge-gray') : 'badge-red';
  const badgeText = r.profit >= 0 ? (isBest ? 'Best' : 'Profit') : 'Rugi';

  return '<div class="result-card ' + cls + '">' +
    '<div class="mp-header"><span class="mp-name">' + r.marketplace + '</span>' +
    '<span class="badge ' + badgeCls + '">' + badgeText + '</span></div>' +
    '<div class="fee-grid">' +
    '<div class="fee-item"><div class="fee-label">Komisi (' + r.commission_rate + ')</div><div class="fee-value">' + fmt(r.commission) + '</div></div>' +
    '<div class="fee-item"><div class="fee-label">Biaya Layanan</div><div class="fee-value">' + fmt(r.service_fee) + '</div></div>' +
    '<div class="fee-item"><div class="fee-label">Payment Fee</div><div class="fee-value">' + fmt(r.payment_fee) + '</div></div>' +
    '<div class="fee-item"><div class="fee-label">Admin</div><div class="fee-value">' + fmt(r.admin_fee) + '</div></div>' +
    '<div class="fee-item"><div class="fee-label">Total Fee</div><div class="fee-value">' + fmt(r.total_fees) + '</div></div>' +
    '<div class="fee-item"><div class="fee-label">Ongkir</div><div class="fee-value">' + fmt(r.shipping_cost) + (r.free_ongkir ? ' (subsidi ' + fmt(r.shipping_subsidy) + ')' : '') + '</div></div>' +
    '</div>' +
    '<div class="summary-row"><span>Net Revenue</span><span class="fee-value">' + fmt(r.net_revenue) + '</span></div>' +
    '<div class="summary-row profit"><span>Profit</span><span class="' + profitCls + '">' + fmt(r.profit) + ' (' + r.margin_pct + '%)</span></div>' +
    '<div class="summary-row"><span>ROI</span><span class="fee-value">' + r.roi_pct + '%</span></div>' +
    '<div class="recommend">Break-even: <strong>' + fmt(r.break_even) + '</strong> · Rekomendasi: <strong>' + fmt(r.recommended_price) + '</strong>' +
    (r.recommended_x999 > 0 ? ' <span style="color:#999">(X999: ' + fmt(r.recommended_x999) + ')</span>' : '') +
    '</div></div>';
}

async function calculate() {
  const i = getInputs();
  if (!i.supplier || !i.selling) { showValidation('Isi harga supplier dan harga jual'); return; }
  const resp = await fetch('/api/calculate', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({supplier_cost: i.supplier, selling_price: i.selling, marketplace: selectedMp, category: i.category, weight: i.weight, free_ongkir: i.freeOngkir})
  });
  const data = await resp.json();
  document.getElementById('results').innerHTML = '<div class="section-label">Hasil - ' + data.marketplace + '</div>' + renderResult(data, true, false);
}

async function compareAll() {
  const i = getInputs();
  if (!i.supplier || !i.selling) { showValidation('Isi harga supplier dan harga jual'); return; }
  const resp = await fetch('/api/compare', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({supplier_cost: i.supplier, selling_price: i.selling, category: i.category, weight: i.weight, free_ongkir: i.freeOngkir})
  });
  const data = await resp.json();
  const best = Math.max(...data.map(r => r.profit));
  let html = '<div class="section-label">Perbandingan Marketplace</div>';
  data.forEach(r => { html += renderResult(r, r.profit === best, r.profit < 0); });
  document.getElementById('results').innerHTML = html;
}
</script>
</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode())
        else:
            self.send_error(404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        if self.path == "/api/calculate":
            result = calculate_margin(body.get("supplier_cost", 0), body.get("selling_price", 0), body.get("marketplace", "tokopedia"), body.get("category", "default"), body.get("weight", 0.5), body.get("free_ongkir", False))
            self._json_response(result)
        elif self.path == "/api/compare":
            results = compare_all(body.get("supplier_cost", 0), body.get("selling_price", 0), body.get("category", "default"), body.get("weight", 0.5), body.get("free_ongkir", False))
            self._json_response(results)
        else:
            self.send_error(404)

    def _json_response(self, data):
        resp = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Dropship Margin Calculator running on http://localhost:{PORT}")
    server.serve_forever()
