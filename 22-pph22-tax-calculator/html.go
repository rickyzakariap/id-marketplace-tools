package main

const htmlPage = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kalkulator PPh 22 Marketplace</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;--yellow:#d97706;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent:#4a9;--accent-hover:#5ba8;--accent-light:#1a2a25;
  --green:#4ade80;--red:#f87171;--yellow:#fbbf24;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;min-height:100vh;padding:20px}
.container{max-width:1080px;margin:0 auto}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
h1{font-size:22px;font-weight:600}
h1 span{color:var(--text-muted);font-weight:400}
button{font-family:inherit;cursor:pointer}
.theme-btn{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 14px;border-radius:6px;font-size:13px}
.theme-btn:hover{border-color:var(--accent);color:var(--accent)}
.phase-banner{background:var(--card);border:1px solid var(--border);border-left:4px solid var(--yellow);border-radius:8px;padding:14px 16px;margin-bottom:20px}
.phase-banner.ok{border-left-color:var(--green)}
.phase-banner.warn{border-left-color:var(--yellow)}
.phase-banner.danger{border-left-color:var(--red)}
.phase-title{font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.phase-desc{font-size:13px;color:var(--text-dim);margin-top:4px}
.phase-next{font-size:12px;color:var(--text-muted);margin-top:6px;font-family:'JetBrains Mono',Consolas,monospace}
.phase-next b{color:var(--text)}
.layout{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px}
.card h2{font-size:14px;font-weight:600;margin-bottom:12px}
label{display:block;font-size:12px;color:var(--text-dim);margin:10px 0 4px}
input,select{width:100%;background:var(--input-bg);border:1px solid var(--input-border);border-radius:6px;padding:8px 10px;font-family:'JetBrains Mono',Consolas,monospace;font-size:14px;color:var(--text)}
input:focus,select:focus{outline:none;border-color:var(--accent)}
input.error{border-color:var(--red)}
.err{color:var(--red);font-size:12px;min-height:16px;margin-top:2px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.toggle-row{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.toggle{flex:1;min-width:180px}
.toggle input{width:auto;margin-right:6px}
.toggle label{display:inline;font-size:13px;color:var(--text)}
.btn{background:var(--accent);color:#fff;border:none;border-radius:6px;padding:9px 16px;font-size:14px;font-weight:500;margin-top:14px;width:100%}
.btn:hover{background:var(--accent-hover)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 12px;border-radius:6px;font-size:13px}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.example-btn{margin-top:0}
.result-status{padding:12px 14px;border-radius:8px;font-size:14px;margin-bottom:12px;border:1px solid var(--border)}
.result-status.exempt{border-left:4px solid var(--green)}
.result-status.risk{border-left:4px solid var(--yellow)}
.result-status.kena{border-left:4px solid var(--red)}
.result-status b{display:block;font-size:15px;margin-bottom:2px}
.result-status p{font-size:13px;color:var(--text-dim)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.stat{background:var(--card-alt);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
.stat .num{font-family:'JetBrains Mono',Consolas,monospace;font-size:18px;font-weight:600;line-height:1.2}
.stat .lbl{font-size:11px;color:var(--text-muted);margin-top:2px}
.stat .num.green{color:var(--green)}
.stat .num.red{color:var(--red)}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:8px;border-bottom:1px solid var(--border);font-family:'JetBrains Mono',Consolas,monospace}
td:first-child{font-family:'Inter',system-ui,sans-serif;font-weight:500}
.notes{font-size:12px;color:var(--text-muted);margin-top:10px}
.notes li{margin:4px 0;list-style:none;padding-left:16px;position:relative}
.notes li:before{content:"-";position:absolute;left:0;color:var(--accent)}
.checklist label{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--text);margin:8px 0;cursor:pointer}
.checklist input{margin-top:3px;width:auto}
.quick-result{margin-top:10px;font-family:'JetBrains Mono',Consolas,monospace;font-size:13px}
@media(max-width:768px){
  body{padding:12px}
  .layout{grid-template-columns:1fr}
  .stats{grid-template-columns:repeat(2,1fr)}
  .row{grid-template-columns:1fr}
  h1{font-size:18px}
}
</style>
</head>
<body>
<div class="container">
<header>
  <h1>Kalkulator PPh 22 <span>Marketplace</span></h1>
  <button class="theme-btn" id="themeBtn" onclick="toggleTheme()">Dark</button>
</header>

<div id="phaseBanner" class="phase-banner warn">
  <div class="phase-title">Memuat status kebijakan...</div>
  <div class="phase-desc"></div>
  <div class="phase-next"></div>
</div>

<div class="layout">
  <div>
    <div class="card">
      <h2>Omzet per marketplace</h2>
      <div style="display:flex;justify-content:flex-end;margin-bottom:4px">
        <button class="btn-ghost example-btn" onclick="fillExample()">Isi contoh</button>
      </div>
      <div id="omzetFields"></div>
      <div class="toggle-row">
        <div class="toggle">
          <input type="checkbox" id="ppnIncluded"/>
          <label for="ppnIncluded">Omzet sudah termasuk PPN 11%</label>
        </div>
        <div class="toggle">
          <input type="checkbox" id="hasDeclaration"/>
          <label for="hasDeclaration">Sudah kirim surat pernyataan pengecualian</label>
        </div>
      </div>
      <button class="btn" id="calcBtn" onclick="calculate()">Hitung potongan PPh 22</button>
      <div class="err" id="formError"></div>
    </div>

    <div class="card">
      <h2>Simulasi per transaksi</h2>
      <label for="txAmount">Harga jual produk</label>
      <input type="text" id="txAmount" inputmode="numeric" placeholder="contoh: 2000000"/>
      <div class="toggle-row" style="margin-top:8px">
        <div class="toggle">
          <input type="checkbox" id="txPpnIncluded"/>
          <label for="txPpnIncluded">Sudah termasuk PPN</label>
        </div>
      </div>
      <button class="btn" onclick="calculateTransaction()">Hitung potongan transaksi</button>
      <div class="quick-result" id="txResult"></div>
    </div>
  </div>

  <div>
    <div class="card">
      <h2>Hasil</h2>
      <div id="resultArea">
        <p style="font-size:13px;color:var(--text-muted)">Isi omzet lalu klik "Hitung potongan PPh 22". Contoh data tersedia lewat tombol "Isi contoh".</p>
      </div>
    </div>

    <div class="card">
      <h2>Checklist pengecualian</h2>
      <div class="checklist">
        <label><input type="checkbox" onchange="updateChecklist()"/> Omzet tahunan maksimal Rp500 juta (gabungan semua marketplace)</label>
        <label><input type="checkbox" onchange="updateChecklist()"/> Surat pernyataan pengecualian sudah disampaikan ke marketplace</label>
        <label><input type="checkbox" onchange="updateChecklist()"/> Punya Surat Keterangan Bebas (SKB) dari DJP</label>
        <label><input type="checkbox" onchange="updateChecklist()"/> Transaksi bukan objek: pulsa, expedisi, emas tertentu, transfer hak tanah/bangunan</label>
      </div>
      <div class="notes" id="checklistResult"></div>
    </div>
  </div>
</div>

<script>
var MARKETPLACES = ["Shopee","Tokopedia","Lazada","Blibli","TikTok Shop","Lainnya"];
var EXAMPLE = {"Shopee":85000000,"Tokopedia":62000000,"Lazada":18000000,"Blibli":9000000,"TikTok Shop":26000000,"Lainnya":0};

function fmt(n){
  if(n===null||n===undefined||isNaN(n)) return "-";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function initOmzetFields(){
  var el = document.getElementById("omzetFields");
  var html = "";
  MARKETPLACES.forEach(function(mp){
    html += '<label for="omzet_'+mp+'">'+mp+' - omzet bulanan</label>' +
            '<input type="text" id="omzet_'+mp+'" inputmode="numeric" placeholder="contoh: 50000000"/>';
  });
  el.innerHTML = html;
}

function parseInput(v){
  if(!v) return 0;
  var n = parseFloat(String(v).replace(/[^\d.-]/g,""));
  return isNaN(n)?0:n;
}

function fillExample(){
  MARKETPLACES.forEach(function(mp){
    var el = document.getElementById("omzet_"+mp);
    if(el) el.value = EXAMPLE[mp] ? EXAMPLE[mp].toLocaleString("id-ID") : "";
  });
}

function calculate(){
  document.getElementById("formError").innerHTML = "";
  var omzet = {};
  var any = false;
  MARKETPLACES.forEach(function(mp){
    var el = document.getElementById("omzet_"+mp);
    var v = parseInput(el.value);
    if(v<0){ el.classList.add("error"); document.getElementById("formError").innerHTML = "Omzet tidak boleh minus."; return; }
    el.classList.remove("error");
    omzet[mp] = v;
    if(v>0) any = true;
  });
  if(!any){
    document.getElementById("formError").innerHTML = "Isi minimal satu omzet marketplace, atau klik Isi contoh.";
    return;
  }
  var btn = document.getElementById("calcBtn");
  btn.disabled = true; btn.textContent = "Menghitung...";
  fetch("/api/calculate", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      omzet: omzet,
      has_declaration: document.getElementById("hasDeclaration").checked,
      ppn_included: document.getElementById("ppnIncluded").checked
    })
  }).then(function(r){return r.json();}).then(function(d){
    renderResult(d);
  }).catch(function(){
    document.getElementById("formError").innerHTML = "Gagal memproses. Coba lagi.";
  }).finally(function(){
    btn.disabled = false; btn.textContent = "Hitung potongan PPh 22";
  });
}

function renderResult(d){
  var statusClass = d.status;
  var rows = "";
  d.breakdown.forEach(function(b){
    if(b.omzet_monthly>0){
      rows += '<tr><td>'+b.marketplace+'</td><td>'+fmt(b.omzet_monthly)+'</td><td>'+fmt(b.withheld_monthly)+'</td></tr>';
    }
  });
  document.getElementById("resultArea").innerHTML =
    '<div class="result-status '+statusClass+'"><b>'+d.status_label+'</b><p>'+d.status_detail+'</p></div>' +
    '<div class="stats">' +
      '<div class="stat"><div class="num">'+fmt(d.omzet_annual)+'</div><div class="lbl">Omzet tahunan (proyeksi)</div></div>' +
      '<div class="stat"><div class="num">'+fmt(d.withheld_monthly)+'</div><div class="lbl">Potongan per bulan</div></div>' +
      '<div class="stat"><div class="num '+(d.withheld_annual>0?"red":"green")+'">'+fmt(d.withheld_annual)+'</div><div class="lbl">Potongan per tahun</div></div>' +
    '</div>' +
    '<table><tr><th>Marketplace</th><th>Omzet/bulan</th><th>Potongan/bulan</th></tr>'+rows+'</table>' +
    '<div class="notes"><ul>' +
      '<li>Tarif 0,5% dari peredaran bruto, di luar PPN dan PPnBM</li>' +
      '<li>Omzet tahunan dihitung omzet bulanan x 12</li>' +
      '<li>Pemotongan dikreditkan sebagai pajak di SPT Tahunan, bukan pajak tambahan</li>' +
    '</ul></div>';
}

function calculateTransaction(){
  var v = parseInput(document.getElementById("txAmount").value);
  var el = document.getElementById("txResult");
  if(v<=0){ el.innerHTML = '<span style="color:var(--red)">Masukkan harga jual dulu.</span>'; return; }
  fetch("/api/transaction", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({amount:v, ppn_included:document.getElementById("txPpnIncluded").checked})
  }).then(function(r){return r.json();}).then(function(d){
    el.innerHTML = 'DPP (di luar PPN): '+fmt(d.dpp)+'<br/>Potongan 0,5%: <b>'+fmt(d.withheld)+'</b><br/>Diterima seller: '+fmt(d.received);
  });
}

function updateChecklist(){
  var boxes = document.querySelectorAll(".checklist input");
  var checked = 0;
  boxes.forEach(function(b){ if(b.checked) checked++; });
  var el = document.getElementById("checklistResult");
  el.innerHTML = "";
  if(checked===0){ el.innerHTML = '<ul><li>Centang kondisi yang sesuai untuk lihat ringkasan.</li></ul>'; return; }
  if(checked>=2){ el.innerHTML = '<ul><li>Kemungkinan besar kamu dikecualikan dari pemungutan PPh 22.</li></ul>'; }
  else if(checked===1){ el.innerHTML = '<ul><li>Masih ada syarat lain yang belum terpenuhi. Pastikan omzet di bawah Rp500 juta dan surat pernyataan sudah dikirim.</li></ul>'; }
}

function toggleTheme(){
  var cur = document.documentElement.getAttribute("data-theme");
  if(cur==="dark"){
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("themeBtn").textContent = "Dark";
    localStorage.setItem("theme","light");
  } else {
    document.documentElement.setAttribute("data-theme","dark");
    document.getElementById("themeBtn").textContent = "Light";
    localStorage.setItem("theme","dark");
  }
}

function loadStatus(){
  fetch("/api/status").then(function(r){return r.json();}).then(function(d){
    var banner = document.getElementById("phaseBanner");
    var cls = d.phase==="aktif" ? "danger" : (d.phase==="refund" ? "warn" : "ok");
    banner.className = "phase-banner "+cls;
    banner.innerHTML =
      '<div class="phase-title">Status kebijakan: '+d.label+'</div>' +
      '<div class="phase-desc">'+d.description+'</div>' +
      (d.next_key_date ? '<div class="phase-next">'+d.next_key_desc+': <b>'+d.next_key_date+'</b> ('+d.days_to_next+' hari lagi)</div>' : '');
  });
}

document.addEventListener("DOMContentLoaded", function(){
  initOmzetFields();
  loadStatus();
  if(localStorage.getItem("theme")==="dark"){ toggleTheme(); }
});
</script>
</body>
</html>`
