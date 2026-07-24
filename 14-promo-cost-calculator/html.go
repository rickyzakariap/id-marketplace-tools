package main

var indexHTML = `<!DOCTYPE html>
<html lang="id" style="-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Promo Cost Calculator</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}

h1, h2, h3 { text-wrap: balance; }

.tabular { font-variant-numeric: tabular-nums; }

body{font-family:'Inter',system-ui,sans-serif;background:#fafafa;color:#1a1a1a;line-height:1.5}
.container{max-width:960px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
h1{font-size:1.4rem;font-weight:700}
.subtitle{font-size:.85rem;color:#666;margin-top:2px}
.theme-toggle{background:none;border:1px solid #e5e5e5;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.85rem;color:#666}
.theme-toggle:hover{border-color:#999}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:20px}
.card h2{font-size:1rem;font-weight:600;margin-bottom:16px;color:#1a1a1a}
.form-group{margin-bottom:12px}
label{font-size:.78rem;font-weight:500;color:#666;display:block;margin-bottom:4px}
input,select{width:100%;padding:8px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:.9rem;font-family:inherit}
input:focus,select:focus{outline:none;border-color:#4a9}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-size:.9rem;font-weight:500;font-family:inherit;width:100%;margin-top:8px;transition:background 0.15s, transform 0.15s}
.btn:active{transform:scale(0.96)}
.btn-primary{background:#4a9;color:#fff}
.btn-primary:hover{background:#3a8}
.btn-secondary{background:#f5f5f5;color:#1a1a1a;border:1px solid #e5e5e5}
.btn-secondary:hover{background:#eee}
.result-section{margin-top:16px;display:none}
.result-section.show{display:block}
.result-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0}
.result-row:last-child{border-bottom:none}
.result-label{font-size:.85rem;color:#666}
.result-value{font-family:'JetBrains Mono',monospace;font-size:.95rem;font-weight:600;font-variant-numeric:tabular-nums}
.result-positive{color:#16a34a}
.result-negative{color:#dc2626}
.result-zero{color:#666}
.highlight-card{border-left:3px solid #4a9;padding:12px 16px;background:#f0faf6;border-radius:0 6px 6px 0;margin-top:12px}
.highlight-card.profit{border-left-color:#16a34a;background:#f0fdf4}
.highlight-card.loss{border-left-color:#dc2626;background:#fef2f2}
.highlight-title{font-size:.8rem;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.highlight-value{font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;font-variant-numeric:tabular-nums}
.promo-types{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:4px}
.promo-type-btn{padding:6px 8px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;cursor:pointer;font-size:.78rem;font-family:inherit;text-align:center;transition:border-color 0.15s}
.promo-type-btn:hover{border-color:#4a9}
.promo-type-btn.active{border-color:#4a9;background:#f0faf6;color:#166534;font-weight:500}
.compare-section{margin-top:16px;display:none}
.compare-section.show{display:block}
.compare-table{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:12px}
.compare-table th{text-align:left;padding:8px 10px;border-bottom:2px solid #e5e5e5;color:#666;font-weight:500;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}
.compare-table td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-family:'JetBrains Mono',monospace}
.compare-table tr:hover td{background:#fafafa}
.compare-table .best{background:#f0fdf4;font-weight:600}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:500}
.badge-good{background:#dcfce7;color:#166534}
.badge-warn{background:#fef9c3;color:#854d0e}
.badge-bad{background:#fee2e2;color:#991b1b}
.empty-state{text-align:center;padding:32px;color:#999;font-size:.9rem}
.tip{font-size:.78rem;color:#999;margin-top:6px;line-height:1.4}
.max-disc{font-size:.85rem;color:#666;margin-top:8px;padding:8px 12px;background:#f9f9f9;border-radius:6px;border:1px dashed #e5e5e5}
.max-disc strong{color:#1a1a1a}
.auto-fill{background:none;border:none;color:#4a9;cursor:pointer;font-size:.78rem;padding:0;font-family:inherit}
.auto-fill:hover{text-decoration:underline}
.section-divider{height:1px;background:#e5e5e5;margin:16px 0}
@media(max-width:768px){
  .grid{grid-template-columns:1fr}
  .form-row{grid-template-columns:1fr 1fr}
  .promo-types{grid-template-columns:1fr 1fr}
  .container{padding:12px}
  h1{font-size:1.2rem}
}
.dark{background:#1a1a1a;color:#e0e0e0}
.dark .card{background:#242424;border-color:#333}
.dark h1,.dark h2{color:#f0f0f0}
.dark .theme-toggle{border-color:#444;color:#aaa}
.dark .theme-toggle:hover{border-color:#666}
.dark input,.dark select{background:#2a2a2a;border-color:#444;color:#e0e0e0}
.dark input:focus,.dark select:focus{border-color:#4a9}
.dark .promo-type-btn{background:#2a2a2a;border-color:#444;color:#ccc}
.dark .promo-type-btn.active{border-color:#4a9;background:#1a2e1a;color:#6ee7a0}
.dark .result-label{color:#aaa}
.dark .highlight-card{background:#1a2e1a}
.dark .highlight-card.loss{background:#2e1a1a}
.dark .compare-table th{border-bottom-color:#444;color:#888}
.dark .compare-table td{border-bottom-color:#333}
.dark .compare-table tr:hover td{background:#2a2a2a}
.dark .compare-table .best{background:#1a2e1a}
.dark .badge-good{background:#16653420;color:#6ee7a0}
.dark .badge-warn{background:#854d0e20;color:#fbbf24}
.dark .badge-bad{background:#991b1b20;color:#f87171}
.dark .max-disc{background:#2a2a2a;border-color:#444;color:#aaa}
.dark .max-disc strong{color:#e0e0e0}
.dark .tip{color:#888}
.dark .form-group label{color:#aaa}
.dark .section-divider{background:#333}
</style>
</head>
<body>
<div class="container">
  <header>
    <div>
      <h1>Promo Cost Calculator</h1>
      <div class="subtitle">Hitung biaya promo sebelum jalan</div>
    </div>
    <button class="theme-toggle" onclick="toggleTheme()">Dark</button>
  </header>

  <div class="grid">
    <div class="card">
      <h2>Input</h2>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div></div>
        <button class="auto-fill" onclick="fillExample()">Isi contoh</button>
      </div>
      <div class="form-group">
        <label>Harga Jual Asli (Rp)</label>
        <input type="number" id="price" placeholder="150000" min="0">
      </div>
      <div class="form-group">
        <label>Harga Modal / COGS (Rp)</label>
        <input type="number" id="cost" placeholder="85000" min="0">
      </div>
      <div class="form-group">
        <label>Marketplace</label>
        <select id="marketplace">
          <option value="Shopee">Shopee</option>
          <option value="Tokopedia">Tokopedia</option>
          <option value="Lazada">Lazada</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Bukalapak">Bukalapak</option>
          <option value="Blibli">Blibli</option>
        </select>
      </div>
      <div class="form-group">
        <label>Jenis Promo</label>
        <div class="promo-types" id="promoTypes">
          <button class="promo-type-btn active" data-type="percent" onclick="selectPromo(this)">Diskon %</button>
          <button class="promo-type-btn" data-type="fixed" onclick="selectPromo(this)">Diskon Rp</button>
          <button class="promo-type-btn" data-type="freeship" onclick="selectPromo(this)">Gratis Ongkir</button>
          <button class="promo-type-btn" data-type="flash" onclick="selectPromo(this)">Flash Sale</button>
          <button class="promo-type-btn" data-type="voucher" onclick="selectPromo(this)">Voucher Toko</button>
        </div>
      </div>
      <div class="form-group" id="promoValueGroup">
        <label id="promoValueLabel">Nilai Diskon (%)</label>
        <input type="number" id="promoValue" placeholder="30" min="0" max="100">
      </div>
      <div class="form-group">
        <label>Estimasi Ongkir (Rp)</label>
        <input type="number" id="shipping" placeholder="15000" min="0" value="15000">
      </div>
      <div class="form-group">
        <label>Target Penjualan Tambahan (%)</label>
        <input type="number" id="extraSales" placeholder="50" min="0" max="500" value="50">
        <div class="tip">Berapa % kenaikan penjualan yang diharapkan dari promo ini</div>
      </div>
      <button class="btn btn-primary" id="calcBtn" onclick="calculate()">Hitung Biaya Promo</button>
      <div style="margin-top:8px">
        <button class="btn btn-secondary" onclick="compareAll()">Bandingkan Semua Marketplace</button>
      </div>
    </div>

    <div>
      <div class="card result-section" id="resultCard">
        <h2>Hasil Perhitungan</h2>
        <div id="resultContent"></div>
      </div>

      <div class="card compare-section" id="compareCard">
        <h2>Perbandingan Marketplace</h2>
        <div id="compareContent"></div>
      </div>
    </div>
  </div>
</div>

<script>
let currentPromoType = 'percent';

function $(id){ return document.getElementById(id); }

function toggleTheme(){
  document.body.classList.toggle('dark');
  const btn = document.querySelector('.theme-toggle');
  btn.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

(function(){
  if(localStorage.getItem('theme') === 'dark'){
    document.body.classList.add('dark');
    document.querySelector('.theme-toggle').textContent = 'Light';
  }
})();

function selectPromo(btn){
  document.querySelectorAll('.promo-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPromoType = btn.dataset.type;
  updatePromoLabel();
}

function updatePromoLabel(){
  const labels = {
    percent: ['Nilai Diskon (%)', '30'],
    fixed: ['Nominal Diskon (Rp)', '30000'],
    freeship: ['Ongkir yang Disubsidi (Rp)', '15000'],
    flash: ['Diskon Flash Sale (%)', '40'],
    voucher: ['Nilai Voucher (Rp)', '25000']
  };
  const [label, ph] = labels[currentPromoType] || labels.percent;
  $('promoValueLabel').textContent = label;
  $('promoValue').placeholder = ph;
  if(currentPromoType === 'freeship'){
    $('promoValueGroup').style.display = 'none';
  } else {
    $('promoValueGroup').style.display = 'block';
  }
}

function fillExample(){
  $('price').value = 150000;
  $('cost').value = 85000;
  $('marketplace').value = 'Shopee';
  $('shipping').value = 15000;
  $('extraSales').value = 50;
  $('promoValue').value = 30;
  selectPromo(document.querySelector('[data-type="percent"]'));
  calculate();
}

function fmtRp(n){
  if(n === 0) return 'Rp 0';
  const neg = n < 0;
  let s = Math.abs(Math.round(n)).toString();
  let result = '';
  for(let i = 0; i < s.length; i++){
    if(i > 0 && (s.length - i) % 3 === 0) result += '.';
    result += s[i];
  }
  return (neg ? '-' : '') + 'Rp ' + result;
}

function pctClass(v){
  if(v > 0) return 'result-positive';
  if(v < 0) return 'result-negative';
  return 'result-zero';
}

function badgeClass(v){
  if(v > 0) return 'badge badge-good';
  if(v > -50) return 'badge badge-warn';
  return 'badge badge-bad';
}

async function calculate(){
  const btn = $('calcBtn');
  btn.textContent = 'Menghitung...';
  btn.disabled = true;
  try {
    const body = {
      originalPrice: parseFloat($('price').value) || 0,
      cost: parseFloat($('cost').value) || 0,
      marketplace: $('marketplace').value,
      promoType: currentPromoType,
      promoValue: parseFloat($('promoValue').value) || 0,
      shippingCost: parseFloat($('shipping').value) || 0,
      extraSalesPct: parseFloat($('extraSales').value) || 0
    };
    if(body.originalPrice <= 0){ alert('Harga jual harus lebih dari 0'); return; }
    if(body.cost < 0){ alert('Harga modal tidak boleh negatif'); return; }

    const resp = await fetch('/api/calculate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    renderResult(data);
  } catch(e){
    alert('Error: ' + e.message);
  } finally {
    btn.textContent = 'Hitung Biaya Promo';
    btn.disabled = false;
  }
}

function renderResult(d){
  const card = $('resultCard');
  card.classList.add('show');

  let profitClass = d.profitDifference >= 0 ? 'profit' : 'loss';
  let profitColor = d.profitDifference >= 0 ? 'result-positive' : 'result-negative';

  let maxDiscText = d.maxDiscountPct > 0
    ? '<div class="max-disc">Maks diskon sebelum rugi: <strong>' + d.maxDiscountPct.toFixed(1) + '%</strong> (Rp ' + Math.round(d.originalPrice * (1 - d.maxDiscountPct/100)).toLocaleString('id-ID') + ')</div>'
    : '';

  let breakEvenText = '';
  if(d.breakEvenUnits > 0){
    breakEvenText = '<div class="result-row"><span class="result-label">Butuh +{0} unit terjual lagi'.replace('{0}', d.breakEvenUnits) + '</span><span class="result-value">untuk balik modal</span></div>';
  } else if(d.breakEvenUnits === -1){
    breakEvenText = '<div class="result-row"><span class="result-label">Promo ini tidak bisa balik modal</span><span class="result-value result-negative">Setiap unit juga rugi</span></div>';
  }

  $('resultContent').innerHTML =
    '<div class="highlight-card ' + profitClass + '">' +
      '<div class="highlight-title">Profit per unit</div>' +
      '<div class="highlight-value ' + profitColor + '">' + fmtRp(d.promoProfit) + '</div>' +
      '<div style="font-size:.8rem;color:#666;margin-top:4px">Tanpa promo: ' + fmtRp(d.originalProfit) + ' | Selisih: <span class="' + profitColor + '">' + fmtRp(d.profitDifference) + '</span></div>' +
    '</div>' +
    '<div class="section-divider"></div>' +
    '<div class="result-row"><span class="result-label">Harga asli</span><span class="result-value">' + fmtRp(d.originalPrice) + '</span></div>' +
    '<div class="result-row"><span class="result-label">Harga promo</span><span class="result-value" style="color:#4a9">' + fmtRp(d.discountedPrice) + ' (-' + fmtRp(d.discountAmount) + ')</span></div>' +
    '<div class="result-row"><span class="result-label">Harga modal</span><span class="result-value">' + fmtRp(d.cost) + '</span></div>' +
    '<div class="section-divider"></div>' +
    '<div class="result-row"><span class="result-label">Komisi marketplace</span><span class="result-value">' + fmtRp(d.promoFees.commission) + '</span></div>' +
    '<div class="result-row"><span class="result-label">Biaya platform</span><span class="result-value">' + fmtRp(d.promoFees.platformFee) + '</span></div>' +
    '<div class="result-row"><span class="result-label">Biaya payment</span><span class="result-value">' + fmtRp(d.promoFees.paymentFee) + '</span></div>' +
    (d.promoFees.shippingSubsidy > 0
      ? '<div class="result-row"><span class="result-label">Subsidi ongkir</span><span class="result-value">' + fmtRp(d.promoFees.shippingSubsidy) + '</span></div>'
      : '') +
    '<div class="result-row" style="font-weight:600"><span class="result-label">Total biaya</span><span class="result-value">' + fmtRp(d.promoFees.totalFees) + '</span></div>' +
    '<div class="section-divider"></div>' +
    breakEvenText +
    '<div class="result-row"><span class="result-label">ROI (target ' + (parseFloat($('extraSales').value)||0) + '% tambahan)</span><span class="result-value ' + pctClass(d.roi) + '">' + d.roi.toFixed(1) + '%</span></div>' +
    maxDiscText;
}

async function compareAll(){
  const body = {
    originalPrice: parseFloat($('price').value) || 0,
    cost: parseFloat($('cost').value) || 0,
    promoType: currentPromoType,
    promoValue: parseFloat($('promoValue').value) || 0,
    shippingCost: parseFloat($('shipping').value) || 0,
    extraSalesPct: parseFloat($('extraSales').value) || 0
  };
  if(body.originalPrice <= 0){ alert('Harga jual harus lebih dari 0'); return; }
  if(body.cost < 0){ alert('Harga modal tidak boleh negatif'); return; }

  try {
    const resp = await fetch('/api/compare', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    renderCompare(data);
  } catch(e){
    alert('Error: ' + e.message);
  }
}

function renderCompare(list){
  const card = $('compareCard');
  card.classList.add('show');

  let bestIdx = 0;
  list.forEach(function(item, i){
    if(item.result.promoProfit > list[bestIdx].result.promoProfit) bestIdx = i;
  });

  let rows = '';
  list.forEach(function(item, i){
    const r = item.result;
    const cls = i === bestIdx ? ' class="best"' : '';
    const profitCls = r.profitDifference >= 0 ? 'result-positive' : 'result-negative';
    const badge = r.isProfitable
      ? '<span class="badge badge-good">Untung</span>'
      : '<span class="badge badge-bad">Rugi</span>';
    rows += '<tr' + cls + '>'
      + '<td>' + item.marketplace + (i === bestIdx ? ' <span style="color:#4a9;font-size:.7rem">BEST</span>' : '') + '</td>'
      + '<td>' + fmtRp(r.discountedPrice) + '</td>'
      + '<td>' + fmtRp(r.promoFees.totalFees) + '</td>'
      + '<td class="' + profitCls + '">' + fmtRp(r.promoProfit) + '</td>'
      + '<td>' + badge + '</td>'
      + '</tr>';
  });

  $('compareContent').innerHTML =
    '<table class="compare-table">' +
    '<thead><tr><th>Marketplace</th><th>Harga Promo</th><th>Total Biaya</th><th>Profit/Unit</th><th>Status</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '<div class="tip">Marketplace dengan profit per unit tertinggi ditandai BEST</div>';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && e.target.tagName !== 'BUTTON') calculate();
});
</script>
</body>
</html>`
