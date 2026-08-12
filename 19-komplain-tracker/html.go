package main

const htmlPage = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Komplain Tracker</title>
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
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px}
h1{font-size:22px;font-weight:600}
h1 span{color:var(--text-muted);font-weight:400}
button{font-family:inherit;cursor:pointer}
.theme-btn{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 14px;border-radius:6px;font-size:13px}
.theme-btn:hover{border-color:var(--accent);color:var(--accent)}
.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px}
.stat .num{font-family:'JetBrains Mono',Consolas,monospace;font-size:24px;font-weight:600;line-height:1.2}
.stat .lbl{font-size:12px;color:var(--text-muted);margin-top:2px}
.stat.warn .num{color:var(--yellow)}
.stat.danger .num{color:var(--red)}
.stat.ok .num{color:var(--green)}
.layout{display:grid;grid-template-columns:380px 1fr;gap:16px;align-items:start}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px}
.card h2{font-size:14px;font-weight:600;margin-bottom:12px}
label{display:block;font-size:12px;color:var(--text-dim);margin:10px 0 4px}
input,select,textarea{width:100%;background:var(--input-bg);border:1px solid var(--input-border);border-radius:6px;padding:8px 10px;font-family:inherit;font-size:14px;color:var(--text)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent)}
input.error,select.error{border-color:var(--red)}
.err{color:var(--red);font-size:12px;min-height:16px;margin-top:2px}
textarea{resize:vertical;min-height:64px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{background:var(--accent);color:#fff;border:none;border-radius:6px;padding:9px 16px;font-size:14px;font-weight:500;margin-top:14px;width:100%}
.btn:hover{background:var(--accent-hover)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 12px;border-radius:6px;font-size:13px}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.toolbar select{width:auto;min-width:120px;padding:6px 10px;font-size:13px}
.toolbar .spacer{flex:1}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:10px 8px;border-bottom:1px solid var(--border);vertical-align:top}
tr:hover td{background:var(--card-alt)}
.prod{font-weight:500}
.prod small{display:block;color:var(--text-muted);font-weight:400;font-size:12px}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border);color:var(--text-dim);white-space:nowrap}
.tag.s-tinggi{background:#fef2f2;border-color:#fecaca;color:var(--red)}
.tag.s-sedang{background:#fffbeb;border-color:#fde68a;color:var(--yellow)}
.tag.s-rendah{background:#f0fdf4;border-color:#bbf7d0;color:var(--green)}
.tag.st-baru{background:var(--accent-light);border-color:var(--accent);color:var(--accent)}
.tag.st-ditanggapi{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
.tag.st-diproses{background:#fffbeb;border-color:#fde68a;color:var(--yellow)}
.tag.st-selesai{background:#f0fdf4;border-color:#bbf7d0;color:var(--green)}
.tag.st-batal{background:var(--card-alt);border-color:var(--border);color:var(--text-muted)}
.sla{font-size:11px;font-family:'JetBrains Mono',Consolas,monospace;margin-top:4px}
.sla.ok{color:var(--green)}
.sla.warn{color:var(--yellow)}
.sla.danger{color:var(--red)}
select.mini{padding:4px 6px;font-size:12px;width:auto}
.note-input{display:flex;gap:6px;margin-top:6px}
.note-input input{font-size:12px;padding:5px 8px}
.note-input button{background:var(--card);border:1px solid var(--border);color:var(--text-dim);border-radius:6px;padding:4px 10px;font-size:12px}
.note-input button:hover{border-color:var(--accent);color:var(--accent)}
.del{background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;padding:2px 6px;border-radius:4px}
.del:hover{color:var(--red);background:var(--card-alt)}
.notes{font-size:12px;color:var(--text-dim);margin-top:6px;max-width:280px}
.notes div{border-left:2px solid var(--border);padding:2px 0 2px 8px;margin-top:2px}
.empty{text-align:center;color:var(--text-muted);padding:40px 0;font-size:14px}
@media(max-width:768px){
  body{padding:12px}
  .stats{grid-template-columns:repeat(3,1fr);gap:8px}
  .stat{padding:10px}
  .stat .num{font-size:18px}
  .layout{grid-template-columns:1fr}
  .row{grid-template-columns:1fr}
  table{font-size:12px}
  th:nth-child(5),td:nth-child(5){display:none}
  .toolbar select{min-width:100px}
}
</style>
</head>
<body>
<div class="container">
<header>
  <h1>Komplain Tracker</h1>
  <button class="theme-btn" id="themeBtn" onclick="toggleTheme()">Dark</button>
</header>

<div class="stats">
  <div class="stat"><div class="num" id="stTotal">0</div><div class="lbl">Total</div></div>
  <div class="stat"><div class="num" id="stOpen">0</div><div class="lbl">Belum selesai</div></div>
  <div class="stat warn"><div class="num" id="stOverdueResp">0</div><div class="lbl">Lewat balas 24 jam</div></div>
  <div class="stat danger"><div class="num" id="stOverdueRes">0</div><div class="lbl">Lewat selesai 72 jam</div></div>
  <div class="stat ok"><div class="num" id="stDone">0</div><div class="lbl">Selesai</div></div>
  <div class="stat"><div class="num" id="stAvg">-</div><div class="lbl">Rata-rata selesai</div></div>
</div>

<div class="layout">
  <div>
    <div class="card">
      <h2>Tambah Komplain</h2>
      <button class="btn-ghost" style="width:100%;margin-bottom:4px" onclick="fillExample()">Isi contoh data</button>
      <label for="fMarketplace">Marketplace</label>
      <select id="fMarketplace">
        <option>Shopee</option><option>Tokopedia</option><option>Lazada</option>
        <option>Bukalapak</option><option>Blibli</option><option>TikTok Shop</option>
      </select>
      <label for="fOrder">No. Order</label>
      <input id="fOrder" placeholder="cth: 260812ABC123"/>
      <label for="fProduct">Nama produk</label>
      <input id="fProduct" placeholder="cth: TWS Bluetooth Earphone X7"/>
      <div id="fProductError" class="err"></div>
      <div class="row">
        <div>
          <label for="fType">Tipe komplain</label>
          <select id="fType">
            <option>terlambat</option><option>barang rusak</option><option>salah kirim</option>
            <option>refund</option><option>ongkir</option><option>kualitas</option><option>lainnya</option>
          </select>
        </div>
        <div>
          <label for="fSeverity">Severity</label>
          <select id="fSeverity">
            <option>rendah</option><option selected>sedang</option><option>tinggi</option>
          </select>
        </div>
      </div>
      <label for="fBuyer">Nama pembeli</label>
      <input id="fBuyer" placeholder="cth: Budi Santoso"/>
      <label for="fDesc">Deskripsi komplain</label>
      <textarea id="fDesc" placeholder="Apa yang dikeluhkan pembeli?"></textarea>
      <button class="btn" id="addBtn" onclick="addComplaint()">Simpan</button>
    </div>
  </div>

  <div>
    <div class="card">
      <div class="toolbar">
        <select id="fStatus" onchange="loadList()">
          <option value="">Semua status</option>
          <option>baru</option><option>ditanggapi</option><option>diproses</option>
          <option>selesai</option><option>batal</option>
        </select>
        <select id="fMarketplaceFilter" onchange="loadList()">
          <option value="">Semua marketplace</option>
          <option>Shopee</option><option>Tokopedia</option><option>Lazada</option>
          <option>Bukalapak</option><option>Blibli</option><option>TikTok Shop</option>
        </select>
        <select id="fTypeFilter" onchange="loadList()">
          <option value="">Semua tipe</option>
          <option>terlambat</option><option>barang rusak</option><option>salah kirim</option>
          <option>refund</option><option>ongkir</option><option>kualitas</option><option>lainnya</option>
        </select>
        <div class="spacer"></div>
        <button class="btn-ghost" onclick="exportCSV()">Export CSV</button>
      </div>
      <table>
        <thead>
          <tr><th>Produk</th><th>Status</th><th>SLA</th><th>Follow-up</th><th>Aksi</th></tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <div class="empty" id="emptyState">Belum ada komplain. Tambahkan atau klik "Isi contoh data".</div>
    </div>
  </div>
</div>

<script>
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('themeBtn').textContent = savedTheme === 'dark' ? 'Light' : 'Dark';
function toggleTheme(){
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeBtn').textContent = next === 'dark' ? 'Light' : 'Dark';
}

const STATUS_FLOW = ['baru','ditanggapi','diproses','selesai','batal'];
const MP_COLOR = {Shopee:'#ee4d2d',Tokopedia:'#00aa5b',Lazada:'#0f146d',Bukalapak:'#e31837',Blibli:'#0073c8','TikTok Shop':'#000'};

function fmtNum(n){return Number(n).toLocaleString('id-ID')}
function fmtHours(h){return h < 1 ? Math.round(h*60)+' menit' : h.toFixed(1)+' jam'}

function fillExample(){
  const examples = [
    ['260812ABC123','TWS Bluetooth Earphone X7','terlambat','sedang','Budi Santoso','Pesanan belum sampai setelah 5 hari, pembeli minta update resi.'],
    ['TP-99231','Kemeja Flanel Pria Premium','salah kirim','tinggi','Siti Rahma','Ukuran L terkirim, padahal pesanan ukuran M. Pembeli minta tukar.'],
    ['LZD-8845','Skincare Set Vitamin C','kualitas','rendah','Andi Wijaya','Kemasan penyok, isi masih bagus. Pembeli minta kompensasi.'],
    ['260813XYZ777','Tas Ransel Anti Air','refund','tinggi','Dewi Lestari','Produk bocor saat hujan, pembeli minta refund penuh.']
  ];
  const e = examples[Math.floor(Math.random()*examples.length)];
  document.getElementById('fOrder').value = e[0];
  document.getElementById('fProduct').value = e[1];
  document.getElementById('fType').value = e[2];
  document.getElementById('fSeverity').value = e[3];
  document.getElementById('fBuyer').value = e[4];
  document.getElementById('fDesc').value = e[5];
}

function clearErrors(){
  ['fProduct'].forEach(id=>{
    document.getElementById(id).classList.remove('error');
    document.getElementById(id+'Error').textContent = '';
  });
}

async function addComplaint(){
  clearErrors();
  const product = document.getElementById('fProduct').value.trim();
  if(!product){
    document.getElementById('fProduct').classList.add('error');
    document.getElementById('fProductError').textContent = 'Nama produk wajib diisi';
    return;
  }
  const btn = document.getElementById('addBtn');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try{
    const res = await fetch('/api/complaints',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        marketplace:document.getElementById('fMarketplace').value,
        order_id:document.getElementById('fOrder').value,
        product_name:product,
        complaint_type:document.getElementById('fType').value,
        severity:document.getElementById('fSeverity').value,
        buyer_name:document.getElementById('fBuyer').value,
        description:document.getElementById('fDesc').value
      })
    });
    if(!res.ok){const e=await res.json();throw new Error(e.error||'Gagal simpan')}
    ['fOrder','fProduct','fBuyer','fDesc'].forEach(id=>document.getElementById(id).value='');
    loadStats(); loadList();
  }catch(err){
    document.getElementById('fProductError').textContent = err.message;
  }finally{
    btn.disabled = false; btn.textContent = 'Simpan';
  }
}

function slaText(c){
  const now = new Date();
  const respDue = new Date(c.created_at); respDue.setHours(respDue.getHours()+24);
  const resDue = new Date(c.created_at); resDue.setHours(resDue.getHours()+72);
  if(['selesai','batal'].includes(c.status)) return '<span class="sla ok">selesai</span>';
  let html = '';
  if(now > resDue) html += '<div class="sla danger">lewat selesai '+fmtHours((now-resDue)/3600000)+'</div>';
  else if(now > respDue) html += '<div class="sla warn">lewat balas '+fmtHours((now-respDue)/3600000)+'</div>';
  else html += '<div class="sla ok">balas '+fmtHours((respDue-now)/3600000)+'</div>';
  return html;
}

function statusOptions(c){
  return STATUS_FLOW.map(s=>'<option value="'+s+'"'+(c.status===s?' selected':'')+'>'+s+'</option>').join('');
}

function renderList(list){
  const tb = document.getElementById('tbody');
  const empty = document.getElementById('emptyState');
  if(!list.length){tb.innerHTML='';empty.style.display='block';return}
  empty.style.display='none';
  tb.innerHTML = list.map(c=>{
    const mp = c.marketplace;
    const notes = (c.notes||[]).map(n=>'<div>'+n.replace(/</g,'&lt;')+'</div>').join('');
    return '<tr>'+
      '<td><span class="prod">'+c.product_name.replace(/</g,'&lt;')+
        '<small style="color:'+(MP_COLOR[mp]||'#666')+'">'+mp+' · '+c.order_id+' · '+c.complaint_type+'</small></span></td>'+
      '<td><span class="tag st-'+c.status+'">'+c.status+'</span><br/><span class="tag s-'+c.severity+'">'+c.severity+'</span></td>'+
      '<td>'+slaText(c)+'</td>'+
      '<td>'+
        '<select class="mini" onchange="updateStatus(\''+c.id+'\',this.value)">'+statusOptions(c)+'</select>'+
        '<div class="note-input"><input id="note-'+c.id+'" placeholder="tambah follow-up" onkeydown="if(event.key===\'Enter\')addNote(\''+c.id+'\')"/><button onclick="addNote(\''+c.id+'\')">+</button></div>'+
        '<div class="notes">'+notes+'</div>'+
      '</td>'+
      '<td><button class="del" onclick="del(\''+c.id+'\')">hapus</button></td>'+
    '</tr>';
  }).join('');
}

async function loadList(){
  const qs = new URLSearchParams({
    status:document.getElementById('fStatus').value,
    marketplace:document.getElementById('fMarketplaceFilter').value,
    type:document.getElementById('fTypeFilter').value
  });
  const res = await fetch('/api/complaints?'+qs);
  const data = await res.json();
  renderList(data.complaints);
}

async function loadStats(){
  const res = await fetch('/api/stats');
  const s = await res.json();
  document.getElementById('stTotal').textContent = s.total;
  document.getElementById('stOpen').textContent = s.open;
  document.getElementById('stOverdueResp').textContent = s.overdue_response;
  document.getElementById('stOverdueRes').textContent = s.overdue_resolution;
  document.getElementById('stDone').textContent = s.done;
  document.getElementById('stAvg').textContent = s.avg_resolution_hours ? fmtHours(s.avg_resolution_hours) : '-';
}

async function updateStatus(id,status){
  await fetch('/api/complaints/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  loadStats(); loadList();
}

async function addNote(id){
  const input = document.getElementById('note-'+id);
  const note = input.value.trim();
  if(!note) return;
  await fetch('/api/complaints/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({note})});
  input.value='';
  loadList();
}

async function del(id){
  if(!confirm('Hapus komplain ini?')) return;
  await fetch('/api/complaints/'+id,{method:'DELETE'});
  loadStats(); loadList();
}

function exportCSV(){
  window.location = '/api/export';
}

document.addEventListener('keydown',e=>{
  if(e.key==='Enter' && e.target.id==='fProduct') addComplaint();
  if(e.key==='Escape'){['fOrder','fProduct','fBuyer','fDesc'].forEach(id=>document.getElementById(id).value='');document.getElementById('fProduct').focus()}
});

loadStats(); loadList();
</script>
</body>
</html>`
