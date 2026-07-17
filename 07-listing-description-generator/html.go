package main

const htmlPage = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Listing Description Generator</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#fafafa;color:#1a1a1a;line-height:1.5;min-height:100vh;padding:20px}
.container{max-width:1000px;margin:0 auto}
h1{font-size:1.4rem;font-weight:600;margin-bottom:2px}
.subtitle{color:#666;font-size:0.85rem;margin-bottom:24px}
.grid{display:grid;grid-template-columns:1fr 2fr;gap:16px}
@media(max-width:768px){.grid{grid-template-columns:1fr}.container{padding:12px}.tabs{flex-wrap:wrap}.tab{padding:6px 10px;font-size:0.75rem}}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:20px}
.section-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#999;margin-bottom:14px;font-weight:500}
label{display:block;font-size:0.82rem;color:#555;margin-bottom:4px;margin-top:14px}
label:first-of-type{margin-top:0}
input,select,textarea{width:100%;padding:10px 12px;background:#fff;border:1px solid #ddd;border-radius:6px;color:#1a1a1a;font-size:0.88rem;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:#4a9}
textarea{resize:none}
select{cursor:pointer}
.example-row{margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.example-row span{font-size:0.72rem;color:#999}
.example-btn{padding:3px 10px;background:#fff;border:1px solid #ddd;border-radius:4px;color:#4a9;font-size:0.72rem;cursor:pointer}
.example-btn:hover{background:#f0f7f5}
.validation{margin-top:10px;padding:8px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#b91c1c;font-size:0.82rem;display:none}
.btn{width:100%;padding:12px;margin-top:14px;background:#4a9;color:#fff;border:none;border-radius:6px;font-size:0.88rem;font-weight:500;cursor:pointer;font-family:inherit}
.btn:hover{background:#3a8}
.tabs{display:flex;gap:0;margin-bottom:16px;border-bottom:1px solid #e5e5e5}
.tab{padding:8px 14px;font-size:0.82rem;color:#999;cursor:pointer;border-bottom:2px solid transparent}
.tab:hover{color:#555}
.tab.active{color:#2a7;border-bottom-color:#4a9}
.output-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.char-count{font-size:0.72rem;font-family:'JetBrains Mono',monospace,'Inter',sans-serif}
.char-ok{color:#999}
.char-warn{color:#d97706}
.char-over{color:#dc2626}
.output-box{background:#f8f8f8;border:1px solid #e5e5e5;border-radius:6px;padding:12px;font-size:0.85rem;white-space:pre-wrap;min-height:80px}
.copy-btn{margin-top:6px;padding:4px 12px;background:#fff;border:1px solid #ddd;border-radius:4px;color:#4a9;font-size:0.75rem;cursor:pointer}
.copy-btn:hover{background:#f0f7f5}
.empty{text-align:center;padding:60px 20px;color:#ccc;font-size:0.88rem}
</style>
</head>
<body>
<div class="container">
  <h1>Listing Description Generator</h1>
  <p class="subtitle">Generate deskripsi produk untuk 6 marketplace Indonesia</p>

  <div class="grid">
    <div class="card">
      <div class="section-label">Info Produk</div>

      <label>Nama Produk</label>
      <input type="text" id="productName" placeholder="Kaos Polos Premium">

      <label>Kategori</label>
      <select id="category">
        <option value="fashion">Fashion</option>
        <option value="electronics">Elektronik</option>
        <option value="food">Makanan & Minuman</option>
        <option value="beauty">Kecantikan</option>
        <option value="home">Rumah & Dekorasi</option>
        <option value="sports">Olahraga</option>
        <option value="books">Buku</option>
        <option value="automotive">Otomotif</option>
        <option value="baby">Bayi & Anak</option>
        <option value="pet">Hewan Peliharaan</option>
      </select>

      <label>Harga (Rp)</label>
      <input type="text" id="price" placeholder="79000" style="font-family:'JetBrains Mono',monospace,'Inter',sans-serif">

      <label>Brand (opsional)</label>
      <input type="text" id="brand" placeholder="Nama brand">

      <label>Kondisi</label>
      <select id="condition">
        <option value="new">Baru</option>
        <option value="used">Bekas</option>
        <option value="refurbished">Refurbished</option>
      </select>

      <label>Fitur (satu per baris)</label>
      <textarea id="features" rows="4" placeholder="100% cotton&#10;Tersedia S-XXL&#10;Warna tidak luntur"></textarea>

      <label>Keywords (satu per baris)</label>
      <textarea id="keywords" rows="2" placeholder="kaos polos&#10;baju cotton"></textarea>

      <div class="example-row">
        <span>Contoh:</span>
        <button class="example-btn" onclick="fillExample('fashion')">Fashion</button>
        <button class="example-btn" onclick="fillExample('electronics')">Elektronik</button>
        <button class="example-btn" onclick="fillExample('food')">Makanan</button>
      </div>

      <div id="validationMsg" class="validation"></div>

      <button class="btn" onclick="generate()">Generate Deskripsi</button>
    </div>

    <div>
      <div id="results" class="card">
        <div class="empty">Isi info produk lalu generate</div>
      </div>
    </div>
  </div>
</div>

<script>
const EXAMPLES = {
  fashion: {name:'Kaos Polos Premium',category:'fashion',price:'79000',brand:'Uniqlo',features:'100% cotton\nTersedia S-XXL\nWarna tidak luntur\nNyaman dipakai',keywords:'kaos polos\nbaju cotton'},
  electronics: {name:'TWS Bluetooth Earphone',category:'electronics',price:'159000',brand:'Baseus',features:'Bluetooth 5.3\nBattery 30 jam\nNoise cancelling\nIPX5 waterproof',keywords:'earphone bluetooth\ntws murah'},
  food: {name:'Kopi Arabika Gayo',category:'food',price:'85000',brand:'Gayo Premium',features:'100% arabika\nRoasting medium\nKemasan 250gr\nHalal MUI',keywords:'kopi arabika\nkopi gayo'},
};

let currentData = null;
let currentPlatform = 'tokopedia';

function fillExample(cat) {
  const e = EXAMPLES[cat];
  document.getElementById('productName').value = e.name;
  document.getElementById('category').value = e.category;
  document.getElementById('price').value = e.price;
  document.getElementById('brand').value = e.brand;
  document.getElementById('features').value = e.features;
  document.getElementById('keywords').value = e.keywords;
  generate();
}

function showValidation(msg) {
  const el = document.getElementById('validationMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

async function generate() {
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('category').value;
  const price = document.getElementById('price').value.trim();
  const brand = document.getElementById('brand').value.trim();
  const condition = document.getElementById('condition').value;
  const features = document.getElementById('features').value.split('\n').map(s => s.trim()).filter(Boolean);
  const keywords = document.getElementById('keywords').value.split('\n').map(s => s.trim()).filter(Boolean);

  if (!name) { showValidation('Isi nama produk'); return; }
  if (!price) { showValidation('Isi harga'); return; }

  const resp = await fetch('/api/generate', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, category, price, brand, condition, features, keywords})
  });
  currentData = await resp.json();
  renderResults();
}

function renderResults() {
  if (!currentData) return;
  const platforms = ['tokopedia','shopee','lazada','bukalapak','tiktok','blibli'];
  const names = {tokopedia:'Tokopedia',shopee:'Shopee',lazada:'Lazada',bukalapak:'Bukalapak',tiktok:'TikTok Shop',blibli:'Blibli'};

  let tabs = '<div class="tabs">';
  platforms.forEach(p => {
    tabs += '<div class="tab ' + (p === currentPlatform ? 'active' : '') + '" onclick="switchPlatform(\'' + p + '\')">' + names[p] + '</div>';
  });
  tabs += '</div>';

  const d = currentData[currentPlatform];
  const titleLen = d.title.length;
  const descLen = d.description.length;
  const titleCls = titleLen > d.title_max ? 'char-over' : (titleLen > d.title_max * 0.9 ? 'char-warn' : 'char-ok');
  const descCls = descLen > d.desc_max ? 'char-over' : (descLen > d.desc_max * 0.9 ? 'char-warn' : 'char-ok');

  let html = tabs;
  html += '<div style="margin-bottom:16px">';
  html += '<div class="output-label"><div class="section-label" style="margin:0">Title</div><span class="char-count ' + titleCls + '">' + titleLen + '/' + d.title_max + '</span></div>';
  html += '<div class="output-box">' + escapeHtml(d.title) + '</div>';
  html += '<button class="copy-btn" onclick="copyText(this,\'' + escapeAttr(d.title) + '\')">Copy</button>';
  html += '</div>';

  html += '<div>';
  html += '<div class="output-label"><div class="section-label" style="margin:0">Description</div><span class="char-count ' + descCls + '">' + descLen + '/' + d.desc_max + '</span></div>';
  html += '<div class="output-box">' + escapeHtml(d.description) + '</div>';
  html += '<button class="copy-btn" onclick="copyText(this,\'' + escapeAttr(d.description) + '\')">Copy</button>';
  html += '</div>';

  document.getElementById('results').innerHTML = html;
}

function switchPlatform(p) {
  currentPlatform = p;
  renderResults();
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeAttr(s) {
  return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n');
}

function copyText(btn, text) {
  text = text.replace(/\\\\n/g, '\n').replace(/\\\\'/g, "'");
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); generate(); }
});
</script>
</body>
</html>`
