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

# Shipping cost estimator (simplified)
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

    # Break-even price: supplier_cost / (1 - total_fee_rate)
    total_fee_rate = comm_rate + mp["service_fee"] + mp["payment_fee"]
    break_even = supplier_cost / (1 - total_fee_rate) if total_fee_rate < 1 else supplier_cost * 2

    # Recommended price: round up to nearest 1000, then add 1000 margin
    recommended = int((break_even + 1000) / 1000) * 1000 + 1000
    # X999 variant
    recommended_x999 = recommended - 1 if recommended > 1000 else 0

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
        "shipping_cost": shipping_cost,
        "shipping_subsidy": shipping_subsidy,
        "net_revenue": round(net_revenue),
        "profit": round(profit),
        "margin_pct": round(margin_pct, 1),
        "roi_pct": round(roi_pct, 1),
        "break_even": round(break_even),
        "recommended_price": recommended,
        "recommended_x999": recommended_x999,
        "free_ongkir": free_ongkir,
    }


def compare_all(supplier_cost, selling_price, category, weight_kg, free_ongkir=False):
    results = []
    for mp_id in MARKETPLACES:
        result = calculate_margin(supplier_cost, selling_price, mp_id, category, weight_kg, free_ongkir)
        results.append(result)
    results.sort(key=lambda x: x["profit"], reverse=True)
    return results


HTML_PAGE = r"""<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dropship Margin Calculator</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#adc6ff',
        'on-primary': '#002e6a',
        'primary-container': '#4d8eff',
        'on-primary-container': '#00285d',
        background: '#0b1326',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c2c6d6',
        outline: '#8c909f',
        'outline-variant': '#424754',
        error: '#ffb4ab',
        green: '#22c55e',
        red: '#ef4444',
        yellow: '#eab308',
      },
    },
  },
}
</script>
<style>
body { font-family: 'Inter', system-ui, sans-serif; }
h1 { font-family: 'Plus Jakarta Sans', sans-serif; }
.mono { font-family: 'JetBrains Mono', monospace; }
</style>
</head>
<body class="bg-background text-on-surface min-h-screen p-5">
<div class="max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-1">Dropship Margin Calculator</h1>
  <p class="text-on-surface-variant text-sm mb-6">Hitung profit dropship lintas marketplace Indonesia</p>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-1 bg-surface-container-low border border-outline-variant rounded-xl p-5">
      <div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium mb-4">Input Produk</div>

      <label class="block text-sm text-on-surface-variant mb-1">Harga Supplier (Rp)</label>
      <input type="number" id="supplierCost" placeholder="50000" min="0" step="1000"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50">

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Harga Jual (Rp)</label>
      <input type="number" id="sellingPrice" placeholder="85000" min="0" step="1000"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50">

      <label class="block text-sm text-on-surface-variant mb-2 mt-4">Marketplace</label>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <label class="cursor-pointer"><input checked class="peer sr-only" name="mp" type="radio" value="tokopedia"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">Tokopedia</div></label>
        <label class="cursor-pointer"><input class="peer sr-only" name="mp" type="radio" value="shopee"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">Shopee</div></label>
        <label class="cursor-pointer"><input class="peer sr-only" name="mp" type="radio" value="tiktokshop"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">TikTok Shop</div></label>
        <label class="cursor-pointer"><input class="peer sr-only" name="mp" type="radio" value="lazada"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">Lazada</div></label>
        <label class="cursor-pointer"><input class="peer sr-only" name="mp" type="radio" value="bukalapak"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">Bukalapak</div></label>
        <label class="cursor-pointer"><input class="peer sr-only" name="mp" type="radio" value="blibli"/><div class="px-2 py-2 text-center rounded-lg border border-outline-variant bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary peer-hover:border-primary transition-colors text-xs text-on-surface-variant">Blibli</div></label>
      </div>

      <label class="block text-sm text-on-surface-variant mb-1">Kategori</label>
      <select id="category" class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
        <option value="fashion">Fashion</option>
        <option value="electronics">Elektronik</option>
        <option value="food">Makanan & Minuman</option>
        <option value="beauty">Kecantikan</option>
        <option value="home">Rumah & Dekorasi</option>
      </select>

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Berat (kg)</label>
      <input type="number" id="weight" placeholder="0.5" min="0.1" step="0.1" value="0.5"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors">

      <div class="flex items-center gap-2 mt-4">
        <input type="checkbox" id="freeOngkir" checked class="accent-primary">
        <label for="freeOngkir" class="text-sm text-on-surface-variant cursor-pointer">Pakai Free Ongkir</label>
      </div>

      <div class="mt-3 flex items-center gap-2 flex-wrap">
        <span class="text-xs text-on-surface-variant">Contoh:</span>
        <button onclick="fillExample('fashion')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Fashion</button>
        <button onclick="fillExample('electronics')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Elektronik</button>
        <button onclick="fillExample('beauty')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Kecantikan</button>
      </div>

      <div id="validationMsg" class="hidden mt-3 text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2"></div>

      <button id="calcBtn" onclick="calculate()" class="w-full mt-5 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90 active:scale-[0.98]">Hitung Margin</button>
      <button onclick="compareAll()" class="w-full mt-2 bg-surface-container text-on-surface border border-outline-variant py-3 rounded-lg text-sm font-medium transition-colors hover:bg-surface-container-high">Bandingkan Semua Marketplace</button>
    </div>

    <div class="lg:col-span-2">
      <div id="results" class="bg-surface-container-low border border-outline-variant rounded-xl p-5 min-h-[300px]">
        <div class="text-center py-16 text-on-surface-variant/40">
          <div class="text-sm">Masukkan data, pilih marketplace, lalu hitung</div>
        </div>
      </div>
    </div>
  </div>
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

function getSelectedMp(){
  const checked=document.querySelector('input[name="mp"]:checked');
  return checked?checked.value:'tokopedia';
}

function showValidation(msg){
  const el=document.getElementById('validationMsg');
  el.textContent=msg;
  el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'),3000);
}

function renderResult(r,isBest,isLoss){
  const borderCls=isBest?'border-l-4 border-l-green':(isLoss?'border-l-4 border-l-red':'');
  const profitColor=r.profit>=0?'text-green':'text-red';
  const badgeBg=r.profit>=0?(isBest?'bg-green/15 text-green':'bg-yellow/15 text-yellow'):'bg-red/15 text-red';
  const badgeText=r.profit>=0?(isBest?'Best':'Profit'):'Rugi';

  return`<div class="bg-surface-container border border-outline-variant ${borderCls} rounded-lg p-4 mb-3">
    <div class="flex justify-between items-center mb-3">
      <span class="font-semibold text-base">${r.marketplace}</span>
      <span class="px-2 py-0.5 rounded text-xs font-medium ${badgeBg}">${badgeText}</span>
    </div>
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="text-xs"><span class="text-on-surface-variant">Komisi (${r.commission_rate})</span><div class="mono text-sm">${fmt(r.commission)}</div></div>
      <div class="text-xs"><span class="text-on-surface-variant">Biaya Layanan</span><div class="mono text-sm">${fmt(r.service_fee)}</div></div>
      <div class="text-xs"><span class="text-on-surface-variant">Payment Fee</span><div class="mono text-sm">${fmt(r.payment_fee)}</div></div>
      <div class="text-xs"><span class="text-on-surface-variant">Admin</span><div class="mono text-sm">${fmt(r.admin_fee)}</div></div>
      <div class="text-xs"><span class="text-on-surface-variant">Total Fee</span><div class="mono text-sm font-medium">${fmt(r.total_fees)}</div></div>
      <div class="text-xs"><span class="text-on-surface-variant">Ongkir</span><div class="mono text-sm">${fmt(r.shipping_cost)}${r.free_ongkir?' (subsidi '+fmt(r.shipping_subsidy)+')':''}</div></div>
    </div>
    <div class="border-t border-outline-variant pt-2 flex justify-between text-sm"><span class="text-on-surface-variant">Net Revenue</span><span class="mono">${fmt(r.net_revenue)}</span></div>
    <div class="flex justify-between text-sm mt-1"><span class="text-on-surface-variant">Profit</span><span class="mono font-semibold ${profitColor}">${fmt(r.profit)} (${r.margin_pct}%)</span></div>
    <div class="flex justify-between text-sm mt-1"><span class="text-on-surface-variant">ROI</span><span class="mono">${r.roi_pct}%</span></div>
    <div class="mt-2 bg-surface-container-low rounded-lg px-3 py-2 text-xs text-on-surface-variant">
      Break-even: <span class="text-primary font-medium">${fmt(r.break_even)}</span> &middot;
      Rekomendasi: <span class="text-primary font-medium">${fmt(r.recommended_price)}</span>
      ${r.recommended_x999>0?' <span class="text-on-surface-variant/60">(X999: '+fmt(r.recommended_x999)+')</span>':''}
    </div>
  </div>`;
}

function fmt(n){return'Rp '+n.toLocaleString('id-ID')}

async function calculate(){
  const i=getInputs();
  if(!i.supplier||!i.selling){showValidation('Isi harga supplier dan harga jual');return;}
  const mp=getSelectedMp();
  const resp=await fetch('/api/calculate',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({supplier_cost:i.supplier,selling_price:i.selling,marketplace:mp,category:i.category,weight:i.weight,free_ongkir:i.freeOngkir})
  });
  const data=await resp.json();
  document.getElementById('results').innerHTML=`<div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium mb-3">Hasil - ${data.marketplace}</div>`+renderResult(data,true,false);
}

async function compareAll(){
  const i=getInputs();
  if(!i.supplier||!i.selling){showValidation('Isi harga supplier dan harga jual');return;}
  const resp=await fetch('/api/compare',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({supplier_cost:i.supplier,selling_price:i.selling,category:i.category,weight:i.weight,free_ongkir:i.freeOngkir})
  });
  const data=await resp.json();
  const best=Math.max(...data.map(r=>r.profit));
  let html=`<div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium mb-3">Perbandingan Marketplace</div>`;
  data.forEach(r=>{
    html+=renderResult(r,r.profit===best,r.profit<0);
  });
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
