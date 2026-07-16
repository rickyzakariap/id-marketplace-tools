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

CATEGORIES = ["fashion", "electronics", "food", "beauty", "home", "default"]

# Shipping cost estimates by weight range (JNE regular, Java)
SHIPPING_ESTIMATES = [
    (0.5, 8000),
    (1, 10000),
    (2, 14000),
    (3, 18000),
    (5, 25000),
    (10, 40000),
    (20, 65000),
    (999, 100000),
]


def get_shipping_cost(weight_kg):
    for max_w, cost in SHIPPING_ESTIMATES:
        if weight_kg <= max_w:
            return cost
    return 100000


def calculate_margin(supplier_cost, selling_price, marketplace, category, weight_kg, free_ongkir=False):
    mp = MARKETPLACES.get(marketplace, MARKETPLACES["tokopedia"])
    comm_rate = mp["commission"].get(category, mp["commission"]["default"])

    commission = selling_price * comm_rate
    service_fee = selling_price * mp["service_fee"]
    payment_fee = selling_price * mp["payment_fee"]
    admin_fee = mp["admin_fee"]

    shipping = get_shipping_cost(weight_kg)
    shipping_subsidy = 0
    if free_ongkir:
        shipping_subsidy = min(shipping, mp["max_shipping_subsidy"])

    total_fees = commission + service_fee + payment_fee + admin_fee
    net_revenue = selling_price - total_fees
    if free_ongkir:
        net_revenue -= (shipping - shipping_subsidy)

    profit = net_revenue - supplier_cost
    margin_pct = (profit / selling_price * 100) if selling_price > 0 else 0
    roi_pct = (profit / supplier_cost * 100) if supplier_cost > 0 else 0

    # Break-even price: supplier_cost / (1 - total_fee_rate)
    total_fee_rate = comm_rate + mp["service_fee"] + mp["payment_fee"]
    break_even = supplier_cost / (1 - total_fee_rate) if total_fee_rate < 1 else supplier_cost * 2
    break_even = round_up_1000(break_even)

    # Recommended price: break-even + 20% margin
    recommended = break_even * 1.2
    recommended = round_up_1000(recommended)

    # X999 version of recommended
    recommended_x999 = (recommended // 1000) * 1000 - 1 if recommended > 1000 else recommended

    return {
        "marketplace": mp["name"],
        "marketplace_id": marketplace,
        "selling_price": selling_price,
        "supplier_cost": supplier_cost,
        "commission": round(commission),
        "commission_rate": f"{comm_rate*100:.1f}%",
        "service_fee": round(service_fee),
        "payment_fee": round(payment_fee),
        "admin_fee": admin_fee,
        "total_fees": round(total_fees),
        "shipping_cost": shipping,
        "shipping_subsidy": shipping_subsidy,
        "net_revenue": round(net_revenue),
        "profit": round(profit),
        "margin_pct": round(margin_pct, 1),
        "roi_pct": round(roi_pct, 1),
        "break_even": break_even,
        "recommended_price": recommended,
        "recommended_x999": recommended_x999,
        "free_ongkir": free_ongkir,
    }


def round_up_1000(price):
    return ((int(price) + 999) // 1000) * 1000


def compare_all(supplier_cost, selling_price, category, weight_kg, free_ongkir=False):
    results = []
    for mp_id in MARKETPLACES:
        result = calculate_margin(supplier_cost, selling_price, mp_id, category, weight_kg, free_ongkir)
        results.append(result)
    results.sort(key=lambda x: x["profit"], reverse=True)
    return results


HTML_PAGE = r"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dropship Margin Calculator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0f0f0f;--surface:#171717;--surface2:#1e1e1e;--border:#2a2a2a;
  --text:#e5e5e5;--dim:#888;--accent:#2563eb;--accent-dim:#1d4ed8;
  --green:#22c55e;--red:#ef4444;--yellow:#eab308;
}
body{
  background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;
  line-height:1.5;min-height:100vh;padding:20px;
}
.container{max-width:1100px;margin:0 auto}
h1{font-size:1.5rem;font-weight:600;margin-bottom:4px}
.subtitle{color:var(--dim);font-size:0.85rem;margin-bottom:24px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:768px){.grid{grid-template-columns:1fr}}

.card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:10px;padding:20px;
}
.card-title{
  font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;
  color:var(--dim);margin-bottom:14px;font-weight:500;
}
label{display:block;font-size:0.82rem;color:var(--dim);margin-bottom:4px;margin-top:12px}
label:first-of-type{margin-top:0}
input,select{
  width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);
  border-radius:6px;color:var(--text);font-size:0.9rem;font-family:inherit;
}
input:focus,select:focus{outline:none;border-color:var(--accent)}
input[type=number]{font-family:'JetBrains Mono',monospace;font-size:0.85rem}
select{cursor:pointer}
.check-row{display:flex;align-items:center;gap:8px;margin-top:12px}
.check-row input[type=checkbox]{width:auto;accent-color:var(--accent)}
.check-row label{margin:0;cursor:pointer}

.btn{
  width:100%;padding:12px;margin-top:16px;background:var(--accent);color:#fff;
  border:none;border-radius:6px;font-size:0.9rem;font-weight:500;
  cursor:pointer;font-family:inherit;
}
.btn:hover{background:var(--accent-dim)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-secondary{
  background:var(--surface2);color:var(--text);border:1px solid var(--border);
}
.btn-secondary:hover{background:var(--border)}

.example-btn{
  display:inline-block;padding:4px 10px;background:var(--surface2);
  border:1px solid var(--border);border-radius:4px;color:var(--accent);
  font-size:0.75rem;cursor:pointer;margin-top:6px;margin-right:4px;
}
.example-btn:hover{background:var(--border)}

.results{margin-top:24px}
.result-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:10px;padding:16px;margin-bottom:12px;
}
.result-card.best{border-left:3px solid var(--green)}
.result-card.loss{border-left:3px solid var(--red)}

.mp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mp-name{font-weight:600;font-size:1rem}
.badge{
  padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:500;
}
.badge-green{background:rgba(34,197,94,0.15);color:var(--green)}
.badge-red{background:rgba(239,68,68,0.15);color:var(--red)}
.badge-yellow{background:rgba(234,179,8,0.15);color:var(--yellow)}

.fee-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:8px;margin-bottom:10px;
}
.fee-item{font-size:0.78rem}
.fee-item .fee-label{color:var(--dim)}
.fee-item .fee-value{font-family:'JetBrains Mono',monospace;font-size:0.82rem}

.summary-row{
  display:flex;justify-content:space-between;padding:6px 0;
  border-top:1px solid var(--border);margin-top:8px;
}
.summary-row.profit{font-weight:600}
.summary-row.profit .val{font-size:1.05rem}
.val-green{color:var(--green)}
.val-red{color:var(--red)}

.recommend{
  margin-top:10px;padding:8px 12px;background:var(--surface2);
  border-radius:6px;font-size:0.8rem;
}
.recommend strong{color:var(--accent)}

.empty{
  text-align:center;padding:60px 20px;color:var(--dim);font-size:0.9rem;
}
.empty::before{
  content:'';display:block;width:100%;height:100px;margin-bottom:16px;
  background:radial-gradient(circle at center,var(--border) 1px,transparent 1px);
  background-size:20px 20px;opacity:0.5;
}

.footer{
  text-align:center;color:var(--dim);font-size:0.72rem;
  margin-top:32px;padding-top:16px;border-top:1px solid var(--border);
}
</style>
</head>
<body>
<div class="container">
  <h1>Dropship Margin Calculator</h1>
  <p class="subtitle">Hitung profit dropship lintas marketplace Indonesia</p>

  <div class="grid">
    <div class="card">
      <div class="card-title">Input Produk</div>

      <label>Harga Supplier (Rp)</label>
      <input type="number" id="supplierCost" placeholder="50000" min="0" step="1000">

      <label>Harga Jual (Rp)</label>
      <input type="number" id="sellingPrice" placeholder="85000" min="0" step="1000">

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

      <div style="margin-top:10px">
        <span style="font-size:0.75rem;color:var(--dim)">Contoh:</span><br>
        <button class="example-btn" onclick="fillExample('fashion')">Fashion</button>
        <button class="example-btn" onclick="fillExample('electronics')">Elektronik</button>
        <button class="example-btn" onclick="fillExample('beauty')">Kecantikan</button>
      </div>

      <button class="btn" id="calcBtn" onclick="calculate()">Hitung Margin</button>
      <button class="btn btn-secondary" onclick="compareAll()" style="margin-top:8px">Bandingkan Semua Marketplace</button>
    </div>

    <div class="card">
      <div class="card-title">Quick Info</div>
      <div style="font-size:0.82rem;color:var(--dim);line-height:1.7">
        <p><strong style="color:var(--text)">Cara pakai:</strong></p>
        <p>1. Masukkan harga dari supplier (harga beli kamu)</p>
        <p>2. Masukkan harga jual di marketplace</p>
        <p>3. Pilih kategori dan berat produk</p>
        <p>4. Klik "Hitung Margin" untuk satu marketplace, atau "Bandingkan Semua" untuk lihat profit di setiap marketplace</p>
        <br>
        <p><strong style="color:var(--text)">Yang dihitung:</strong></p>
        <p>- Komisi marketplace (per kategori)</p>
        <p>- Biaya layanan + payment processing</p>
        <p>- Biaya admin (jika ada)</p>
        <p>- Estimasi ongkir dan subsidi free ongkir</p>
        <p>- Break-even price dan harga rekomendasi</p>
      </div>
    </div>
  </div>

  <div class="results" id="results">
    <div class="empty">Masukkan data produk lalu klik "Hitung Margin"</div>
  </div>

  <div class="footer">Dropship Margin Calculator - Fee data per Juli 2026, bisa berubah sewaktu-waktu</div>
</div>

<script>
const EXAMPLES = {
  fashion: {supplier:35000,selling:79000,weight:0.3},
  electronics: {supplier:150000,selling:225000,weight:0.8},
  beauty: {supplier:25000,selling:55000,weight:0.2},
};

function fillExample(cat){
  const e=EXAMPLES[cat];
  document.getElementById('supplierCost').value=e.supplier;
  document.getElementById('sellingPrice').value=e.selling;
  document.getElementById('category').value=cat;
  document.getElementById('weight').value=e.weight;
  calculate();
}

function getInputs(){
  return{
    supplier:parseInt(document.getElementById('supplierCost').value)||0,
    selling:parseInt(document.getElementById('sellingPrice').value)||0,
    category:document.getElementById('category').value,
    weight:parseFloat(document.getElementById('weight').value)||0.5,
    freeOngkir:document.getElementById('freeOngkir').checked,
  };
}

function renderResult(r,isBest,isLoss){
  const cls=isBest?'best':(isLoss?'loss':'');
  const profitCls=r.profit>=0?'val-green':'val-red';
  const badgeCls=r.profit>=0?(isBest?'badge-green':'badge-yellow'):'badge-red';
  const badgeText=r.profit>=0?(isBest?'Best':'Profit'):'Rugi';

  return`<div class="result-card ${cls}">
    <div class="mp-header">
      <span class="mp-name">${r.marketplace}</span>
      <span class="badge ${badgeCls}">${badgeText}</span>
    </div>
    <div class="fee-grid">
      <div class="fee-item"><div class="fee-label">Komisi (${r.commission_rate})</div><div class="fee-value">${fmt(r.commission)}</div></div>
      <div class="fee-item"><div class="fee-label">Biaya Layanan</div><div class="fee-value">${fmt(r.service_fee)}</div></div>
      <div class="fee-item"><div class="fee-label">Payment Fee</div><div class="fee-value">${fmt(r.payment_fee)}</div></div>
      <div class="fee-item"><div class="fee-label">Admin</div><div class="fee-value">${fmt(r.admin_fee)}</div></div>
      <div class="fee-item"><div class="fee-label">Total Fee</div><div class="fee-value">${fmt(r.total_fees)}</div></div>
      <div class="fee-item"><div class="fee-label">Ongkir</div><div class="fee-value">${fmt(r.shipping_cost)}${r.free_ongkir?' (subsidi '+fmt(r.shipping_subsidy)+')':''}</div></div>
    </div>
    <div class="summary-row"><span>Net Revenue</span><span class="fee-value">${fmt(r.net_revenue)}</span></div>
    <div class="summary-row profit"><span>Profit</span><span class="val ${profitCls}">${fmt(r.profit)} (${r.margin_pct}%)</span></div>
    <div class="summary-row"><span>ROI</span><span class="fee-value">${r.roi_pct}%</span></div>
    <div class="recommend">
      Break-even: <strong>${fmt(r.break_even)}</strong> &nbsp;|&nbsp;
      Rekomendasi: <strong>${fmt(r.recommended_price)}</strong>
      ${r.recommended_x999>0?' (X999: '+fmt(r.recommended_x999)+')':''}
    </div>
  </div>`;
}

function fmt(n){return'Rp '+n.toLocaleString('id-ID')}

async function calculate(){
  const i=getInputs();
  if(!i.supplier||!i.selling){alert('Isi harga supplier dan harga jual');return;}
  const mp=document.getElementById('marketplaceSelect')?.value||'tokopedia';
  const resp=await fetch('/api/calculate',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({supplier_cost:i.supplier,selling_price:i.selling,marketplace:mp,category:i.category,weight:i.weight,free_ongkir:i.freeOngkir})
  });
  const data=await resp.json();
  document.getElementById('results').innerHTML=`<div class="card"><div class="card-title">Hasil - ${data.marketplace}</div>${renderResult(data,true,false)}</div>`;
}

async function compareAll(){
  const i=getInputs();
  if(!i.supplier||!i.selling){alert('Isi harga supplier dan harga jual');return;}
  const resp=await fetch('/api/compare',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({supplier_cost:i.supplier,selling_price:i.selling,category:i.category,weight:i.weight,free_ongkir:i.freeOngkir})
  });
  const data=await resp.json();
  const best=Math.max(...data.map(r=>r.profit));
  let html=`<div class="card"><div class="card-title">Perbandingan Marketplace - Profit ${fmt(i.selling-i.supplier)} sebelum fee</div>`;
  data.forEach(r=>{
    html+=renderResult(r,r.profit===best,r.profit<0);
  });
  html+=`</div>`;
  document.getElementById('results').innerHTML=html;
}
</script>
</body>
</html>"""


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress logs

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
            result = calculate_margin(
                body.get("supplier_cost", 0),
                body.get("selling_price", 0),
                body.get("marketplace", "tokopedia"),
                body.get("category", "default"),
                body.get("weight", 0.5),
                body.get("free_ongkir", False),
            )
            self._json_response(result)
        elif self.path == "/api/compare":
            results = compare_all(
                body.get("supplier_cost", 0),
                body.get("selling_price", 0),
                body.get("category", "default"),
                body.get("weight", 0.5),
                body.get("free_ongkir", False),
            )
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
