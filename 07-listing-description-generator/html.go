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
@media(max-width:768px){.grid{grid-template-columns:1fr}.container{padding:12px}.tabs{flex-wrap:wrap}.tab{padding:6px 10px;font-size:0.75rem}}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px}
.section-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:14px;font-weight:500}
label{display:block;font-size:0.82rem;color:var(--text-dim);margin-bottom:4px;margin-top:14px}
label:first-of-type{margin-top:0}
input,select,textarea{width:100%;padding:10px 12px;background:var(--input-bg);border:1px solid var(--input-border);border-radius:6px;color:var(--text);font-size:0.88rem;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent)}
textarea{resize:none}
select{cursor:pointer}
.example-row{margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.example-row span{font-size:0.72rem;color:var(--text-muted)}
.example-btn{padding:3px 10px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--accent);font-size:0.72rem;cursor:pointer}
.example-btn:hover{background:var(--accent-light)}
.validation{margin-top:10px;padding:8px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#b91c1c;font-size:0.82rem;display:none}
[data-theme="dark"] .validation{background:#3a1a1a;border-color:#7f1d1d;color:#fca5a5}
.btn{width:100%;padding:12px;margin-top:14px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:0.88rem;font-weight:500;cursor:pointer;font-family:inherit}
.btn:hover{background:var(--accent-hover)}
.tabs{display:flex;gap:0;margin-bottom:16px;border-bottom:1px solid var(--border)}
.tab{padding:8px 14px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent}
.tab:hover{color:var(--text-dim)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.output-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.char-count{font-size:0.72rem;font-family:'JetBrains Mono',monospace,'Inter',sans-serif}
.char-ok{color:var(--text-muted)}
.char-warn{color:#d97706}
.char-over{color:var(--red)}
.output-box{background:var(--card-alt);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:0.85rem;white-space:pre-wrap;min-height:80px}
.copy-btn{margin-top:6px;padding:4px 12px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--accent);font-size:0.75rem;cursor:pointer}
.copy-btn:hover{background:var(--accent-light)}
.empty{text-align:center;padding:60px 20px;color:var(--text-muted);font-size:0.88rem}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Listing Description Generator</h1>
    <button class="theme-toggle" onclick="toggleTheme()" id="themeBtn">Dark</button>
  </div>
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
