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
    shipping_cost = round(estimate_shipping(weight_kg, marketplace))
    shipping_subsidy = min(shipping_cost, mp["max_shipping_subsidy"]) if free_ongkir else 0
    net_revenue = selling_price - total_fees
    # Ongkir yang ditanggung seller (subsidi free ongkir) ikut mengurangi profit.
    profit = net_revenue - supplier_cost - shipping_subsidy
    margin_pct = (profit / selling_price * 100) if selling_price > 0 else 0
    roi_pct = (profit / supplier_cost * 100) if supplier_cost > 0 else 0
    total_fee_rate = comm_rate + mp["service_fee"] + mp["payment_fee"]
    fixed_cost = supplier_cost + admin_fee + shipping_subsidy
    break_even = fixed_cost / (1 - total_fee_rate) if total_fee_rate < 1 else fixed_cost * 2
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
<script>
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&family=Inter:wght@300..700&display=swap" rel="stylesheet">
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
<style id="design-skin">
:root {
  color-scheme: light;
  --ink-rgb: 23, 24, 26;
  --bg: #ffffff;
  --surface: #f7f7f6;
  --surface-2: #f1f1f0;
  --surface-3: #ecebe7;
  --elev: #ffffff;
  --card: #ffffff;
  --card-alt: #f1f1f0;
  --ink: #17181a;
  --ink-2: #3c3b37;
  --ink-3: #5c5b56;
  --ink-4: #6f6e68;
  --ink-5: #85847e;
  --text: #17181a;
  --text-dim: #5c5b56;
  --text-muted: #85847e;
  --wash: rgba(23, 24, 26, 0.06);
  --wash-hover: rgba(23, 24, 26, 0.09);
  --rule: rgba(23, 24, 26, 0.16);
  --line: rgba(23, 24, 26, 0.08);
  --border: rgba(23, 24, 26, 0.08);
  --signal: #2231dd;
  --ember: #b8431c;
  --ok: #15803d;
  --green: #15803d;
  --red: #2231dd;
  --yellow: #b8431c;
  --on-slab: #ffffff;
  --slab: var(--ink);
  --accent: #17181a;
  --accent-hover: #3c3b37;
  --accent-light: rgba(23, 24, 26, 0.06);
  --input-bg: #ffffff;
  --input-border: rgba(23, 24, 26, 0.08);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --font-head: "Google Sans", "Inter", system-ui, sans-serif;
  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-pop: cubic-bezier(0.3, 1.12, 0.4, 1);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --ink-rgb: 255, 255, 255;
  --bg: #000000;
  --surface: #0f0f0f;
  --surface-2: #181818;
  --surface-3: #202020;
  --elev: #202020;
  --card: #202020;
  --card-alt: #181818;
  --ink: #ffffff;
  --ink-2: #b4b4b4;
  --ink-3: #9a9a9a;
  --ink-4: #828282;
  --ink-5: #6b6b6b;
  --text: #ffffff;
  --text-dim: #9a9a9a;
  --text-muted: #6b6b6b;
  --wash: rgba(255, 255, 255, 0.06);
  --wash-hover: rgba(255, 255, 255, 0.1);
  --rule: rgba(255, 255, 255, 0.14);
  --line: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.08);
  --signal: #3aa9ff;
  --ember: #ff7a4d;
  --ok: #34d17a;
  --green: #34d17a;
  --red: #3aa9ff;
  --yellow: #ff7a4d;
  --on-slab: #000000;
  --slab: var(--ink);
  --accent: #ffffff;
  --accent-hover: #b4b4b4;
  --accent-light: rgba(255, 255, 255, 0.06);
  --input-bg: #202020;
  --input-border: rgba(255, 255, 255, 0.08);
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.55;
  padding: 28px 20px 64px;
  -webkit-font-smoothing: antialiased;
}
.container { max-width: 1000px; }
.header { align-items: flex-start; margin-bottom: 4px; }
h1 {
  font-family: var(--font-head);
  font-size: 46px;
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.subtitle { color: var(--ink-4); font-size: 15px; margin-bottom: 28px; }
.theme {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.16s, background-color 0.16s;
}
.theme:hover { color: var(--ink); background: var(--wash-hover); }
.theme .moon { display: none; }
html[data-theme="dark"] .theme .sun { display: none; }
html[data-theme="dark"] .theme .moon { display: block; }
.card {
  background: var(--wash);
  border: 0;
  border-radius: 28px;
  padding: 24px;
}
.section-label { color: var(--ink-4); letter-spacing: 0.04em; }
label { color: var(--ink-4); font-size: 13px; }
input, select {
  background: var(--elev);
  border: 0;
  border-radius: 12px;
  color: var(--ink);
  font-family: var(--font-ui);
}
html[data-theme="dark"] input,
html[data-theme="dark"] select { background: var(--surface-2); }
input[type=number] { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
input:focus, select:focus {
  outline: none;
  border: 0;
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px rgba(var(--ink-rgb), 0.35);
}
.check-row input[type=checkbox] { accent-color: var(--ink); }
.example-row span { color: var(--ink-5); }
.example-btn {
  background: var(--wash);
  border: 0;
  border-radius: 999px;
  color: var(--ink-2);
  padding: 4px 12px;
}
.example-btn:hover { background: var(--wash-hover); color: var(--ink); }
.chip {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: var(--ink-3);
  transition: background-color 0.16s, color 0.16s, transform 0.14s var(--ease-pop);
}
.chip:hover { background: var(--wash-hover); color: var(--ink); }
.chip.active { background: var(--slab); color: var(--on-slab); border-color: transparent; }
.chip:active { transform: scale(0.96); }
.validation {
  background: var(--wash);
  border: 0;
  border-left: 3px solid var(--signal);
  border-radius: 20px;
  color: var(--ink-2);
}
[data-theme="dark"] .validation { background: var(--wash); border-color: transparent; border-left-color: var(--signal); color: var(--ink-2); }
.btn {
  background: var(--slab);
  color: var(--on-slab);
  border: 0;
  border-radius: 999px;
  min-height: 44px;
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 500;
  transition: opacity 0.16s, transform 0.14s var(--ease-pop);
}
.btn:hover { background: var(--slab); opacity: 0.9; }
.btn:active { transform: scale(0.96); }
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px rgba(var(--ink-rgb), 0.35);
}
.btn-sec {
  background: var(--wash);
  color: var(--ink-2);
  border: 0;
}
.btn-sec:hover { background: var(--wash-hover); color: var(--ink); }
.result-card {
  background: var(--elev);
  border: 0;
  border-radius: 28px;
  padding: 24px;
  box-shadow: var(--shadow);
}
html[data-theme="dark"] .result-card { background: var(--surface-2); }
.result-card.best { border-left: 3px solid var(--ok); }
.result-card.loss { border-left: 3px solid var(--signal); }
.mp-name { font-family: var(--font-head); font-size: 17px; font-weight: 500; letter-spacing: -0.02em; }
.badge {
  border-radius: 20px;
  background: var(--wash);
  border-left: 3px solid var(--ink);
  color: var(--ink-2);
}
.badge-green, .badge-gray { background: var(--wash); color: var(--ink-2); }
.badge-red { background: var(--wash); color: var(--ink-2); border-left-color: var(--signal); }
[data-theme="dark"] .badge-red { background: var(--wash); }
.fee-label { color: var(--ink-5); }
.fee-value { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--ink); }
.summary-row { border-top: 1px solid var(--line); }
.val-green { color: var(--ok); }
.val-red { color: var(--signal); }
.recommend { background: var(--wash); border-radius: 20px; color: var(--ink-3); }
.recommend strong { color: var(--ink); }
.recommend span { color: var(--ink-5) !important; }
.empty { color: var(--ink-5); }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.card,
.result-card { animation: rise 0.62s var(--ease-out) both; }
.result-card:nth-of-type(2) { animation-delay: 60ms; }
.result-card:nth-of-type(3) { animation-delay: 120ms; }
.result-card:nth-of-type(4) { animation-delay: 180ms; }
@media (max-width: 768px) {
  body { padding: 20px 14px 48px; }
  h1 { font-size: 31px; }
  .card, .result-card { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: 1ms !important; }
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Dropship Margin Calculator</h1>
    <button class="theme" id="themeBtn" type="button" aria-label="Ganti tema" title="Ganti tema">
      <svg class="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
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
function initTheme() {
  const btn = document.getElementById('theme-btn') || document.getElementById('themeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}
initTheme();

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
