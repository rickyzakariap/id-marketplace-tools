package main

var indexHTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Supplier Scorer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#fafafa;color:#1a1a1a;line-height:1.5}
.container{max-width:960px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
h1{font-size:1.5rem;font-weight:700}
.theme-toggle{background:none;border:1px solid #e5e5e5;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.85rem;color:#666}
.theme-toggle:hover{border-color:#999}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:16px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
label{font-size:.8rem;font-weight:500;color:#666;display:block;margin-bottom:4px}
input,select,textarea{width:100%;padding:8px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:.9rem;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:#4a9}
textarea{resize:vertical;min-height:60px}
.score-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.score-field{text-align:center}
.score-field input{width:60px;text-align:center;font-size:1.1rem;font-weight:600;font-family:'JetBrains Mono',monospace}
.score-label{font-size:.75rem;color:#666;margin-top:4px}
.btn{padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-size:.9rem;font-weight:500;font-family:inherit}
.btn-primary{background:#4a9;color:#fff}
.btn-primary:hover{background:#3a8}
.btn-secondary{background:#f5f5f5;color:#1a1a1a;border:1px solid #e5e5e5}
.btn-secondary:hover{background:#eee}
.btn-danger{background:#fff;color:#dc2626;border:1px solid #fecaca}
.btn-danger:hover{background:#fef2f2}
.btn-sm{padding:6px 12px;font-size:.8rem}
.actions{display:flex;gap:8px;margin-top:16px}
.results-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.results-header h2{font-size:1.1rem;font-weight:600}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{text-align:left;padding:10px 12px;border-bottom:2px solid #e5e5e5;color:#666;font-weight:500;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em}
td{padding:10px 12px;border-bottom:1px solid #f0f0f0}
tr:hover td{background:#fafafa}
.grade{display:inline-block;padding:2px 8px;border-radius:4px;font-weight:600;font-size:.8rem;font-family:'JetBrains Mono',monospace}
.grade-a-plus{background:#dcfce7;color:#166534}
.grade-a{background:#dcfce7;color:#166534}
.grade-b-plus{background:#fef9c3;color:#854d0e}
.grade-b{background:#fef9c3;color:#854d0e}
.grade-c-plus{background:#fee2e2;color:#991b1b}
.grade-c{background:#fee2e2;color:#991b1b}
.grade-d{background:#fee2e2;color:#991b1b}
.score-bar{height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;min-width:80px}
.score-bar-fill{height:100%;border-radius:3px;transition:width .2s}
.rank-badge{font-weight:600;font-family:'JetBrains Mono',monospace;color:#4a9}
.empty-state{text-align:center;padding:40px;color:#999}
.empty-state p{margin-top:8px;font-size:.9rem}
.filter-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.filter-bar select,.filter-bar input{width:auto;min-width:150px}
@media(max-width:768px){
  .container{padding:12px}
  .form-grid{grid-template-columns:1fr}
  .score-grid{grid-template-columns:1fr 1fr}
  .actions{flex-direction:column}
  .btn{width:100%;text-align:center}
  .filter-bar{flex-direction:column}
  .filter-bar select,.filter-bar input{width:100%}
  table{font-size:.8rem}
  th,td{padding:8px 6px}
}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Supplier Scorer</h1>
    <button class="theme-toggle" onclick="toggleTheme()">Dark</button>
  </header>

  <div class="card" id="formCard">
    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px" id="formTitle">Add Supplier</h3>
    <input type="hidden" id="editId">
    <div class="form-grid">
      <div><label>Supplier Name</label><input type="text" id="name" placeholder="e.g. Toko Maju Jaya"></div>
      <div><label>Marketplace</label>
        <select id="marketplace">
          <option value="">Select marketplace</option>
          <option value="Shopee">Shopee</option>
          <option value="Tokopedia">Tokopedia</option>
          <option value="Lazada">Lazada</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Bukalapak">Bukalapak</option>
          <option value="Blibli">Blibli</option>
          <option value="TokoPedia">Tokopedia</option>
          <option value="Offline">Offline/WhatsApp</option>
        </select>
      </div>
      <div><label>Product Category</label><input type="text" id="category" placeholder="e.g. Electronics, Fashion"></div>
      <div><label>Notes</label><input type="text" id="notes" placeholder="e.g. Fast response, good packaging"></div>
    </div>
    <div style="margin-top:12px">
      <label>Scoring (1-5, 5 = best)</label>
      <div class="score-grid" style="margin-top:8px">
        <div class="score-field">
          <input type="number" id="priceScore" min="1" max="5" value="3">
          <div class="score-label">Price</div>
        </div>
        <div class="score-field">
          <input type="number" id="shippingScore" min="1" max="5" value="3">
          <div class="score-label">Shipping</div>
        </div>
        <div class="score-field">
          <input type="number" id="qualityScore" min="1" max="5" value="3">
          <div class="score-label">Quality</div>
        </div>
        <div class="score-field">
          <input type="number" id="communication" min="1" max="5" value="3">
          <div class="score-label">Communication</div>
        </div>
        <div class="score-field">
          <input type="number" id="returnRate" min="1" max="5" value="3">
          <div class="score-label">Low Returns</div>
        </div>
        <div class="score-field">
          <input type="number" id="moqScore" min="1" max="5" value="3">
          <div class="score-label">MOQ/Flexibility</div>
        </div>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="saveSupplier()">Save Supplier</button>
      <button class="btn btn-secondary" onclick="resetForm()">Cancel</button>
    </div>
  </div>

  <div class="results-header">
    <h2>Suppliers (<span id="count">0</span>)</h2>
    <div class="filter-bar">
      <select id="filterMarketplace" onchange="renderSuppliers()">
        <option value="">All Marketplaces</option>
        <option value="Shopee">Shopee</option>
        <option value="Tokopedia">Tokopedia</option>
        <option value="Lazada">Lazada</option>
        <option value="TikTok Shop">TikTok Shop</option>
        <option value="Bukalapak">Bukalapak</option>
        <option value="Blibli">Blibli</option>
      </select>
      <input type="text" id="searchInput" placeholder="Search name..." oninput="renderSuppliers()">
    </div>
  </div>

  <div id="supplierList">
    <div class="empty-state">
      <p>No suppliers yet. Add your first supplier above.</p>
    </div>
  </div>
</div>

<script>
let allSuppliers = [];

function toggleTheme() {
  const b = document.body;
  const btn = document.querySelector('.theme-toggle');
  if (b.style.background === '#1a1a1a') {
    b.style.background = '#fafafa';
    b.style.color = '#1a1a1a';
    btn.textContent = 'Dark';
    document.querySelectorAll('.card').forEach(c => { c.style.background = '#fff'; c.style.borderColor = '#e5e5e5'; });
    document.querySelectorAll('input,select,textarea').forEach(c => { c.style.borderColor = '#e5e5e5'; c.style.color = '#1a1a1a'; });
    document.querySelectorAll('th').forEach(c => c.style.color = '#666');
    localStorage.setItem('theme', 'light');
  } else {
    b.style.background = '#1a1a1a';
    b.style.color = '#e0e0e0';
    btn.textContent = 'Light';
    document.querySelectorAll('.card').forEach(c => { c.style.background = '#242424'; c.style.borderColor = '#333'; });
    document.querySelectorAll('input,select,textarea').forEach(c => { c.style.borderColor = '#444'; c.style.color = '#e0e0e0'; });
    document.querySelectorAll('th').forEach(c => c.style.color = '#888');
    localStorage.setItem('theme', 'dark');
  }
}

async function loadSuppliers() {
  try {
    const res = await fetch('/api/suppliers');
    allSuppliers = await res.json();
    renderSuppliers();
  } catch (e) {
    console.error('Failed to load suppliers:', e);
  }
}

function renderSuppliers() {
  const filter = document.getElementById('filterMarketplace').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allSuppliers.filter(s => {
    if (filter && s.marketplace !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search)) return false;
    return true;
  });

  document.getElementById('count').textContent = filtered.length;

  if (filtered.length === 0) {
    document.getElementById('supplierList').innerHTML = '<div class="empty-state"><p>No suppliers found. Add your first supplier above.</p></div>';
    return;
  }

  const gradeColors = {
    'A+': 'grade-a-plus', 'A': 'grade-a',
    'B+': 'grade-b-plus', 'B': 'grade-b',
    'C+': 'grade-c-plus', 'C': 'grade-c', 'D': 'grade-d'
  };

  const barColors = ['#dc2626', '#f59e0b', '#eab308', '#22c55e', '#16a34a', '#15803d'];

  let html = '<div class="table-wrap"><table><thead><tr>';
  html += '<th>#</th><th>Supplier</th><th>Marketplace</th><th>Grade</th>';
  html += '<th>Price</th><th>Ship</th><th>Quality</th><th>Comms</th><th>Returns</th><th>MOQ</th>';
  html += '<th>Avg</th><th>Actions</th></tr></thead><tbody>';

  filtered.forEach(s => {
    const gc = gradeColors[s.grade] || 'grade-c';
    const avg = s.totalScore.toFixed(1);
    const pct = (s.totalScore / 5 * 100).toFixed(0);
    const barColor = barColors[Math.min(Math.floor(s.totalScore) - 1, 5)] || '#999';

    html += '<tr>';
    html += '<td class="rank-badge">' + s.rank + '</td>';
    html += '<td><strong>' + esc(s.name) + '</strong>';
    if (s.notes) html += '<br><span style="color:#999;font-size:.75rem">' + esc(s.notes) + '</span>';
    html += '</td>';
    html += '<td>' + esc(s.marketplace || '-') + '</td>';
    html += '<td><span class="grade ' + gc + '">' + s.grade + '</span></td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.priceScore + '</td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.shippingScore + '</td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.qualityScore + '</td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.communication + '</td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.returnRate + '</td>';
    html += '<td style="text-align:center;font-family:monospace">' + s.moqScore + '</td>';
    html += '<td><div class="score-bar"><div class="score-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div>';
    html += '<span style="font-family:monospace;font-size:.8rem">' + avg + '</span></td>';
    html += '<td><button class="btn btn-secondary btn-sm" onclick="editSupplier(\'' + s.id + '\')">Edit</button> ';
    html += '<button class="btn btn-danger btn-sm" onclick="deleteSupplier(\'' + s.id + '\')">Del</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  document.getElementById('supplierList').innerHTML = html;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getFormData() {
  return {
    name: document.getElementById('name').value.trim(),
    marketplace: document.getElementById('marketplace').value,
    productCategory: document.getElementById('category').value.trim(),
    priceScore: parseInt(document.getElementById('priceScore').value) || 3,
    shippingScore: parseInt(document.getElementById('shippingScore').value) || 3,
    qualityScore: parseInt(document.getElementById('qualityScore').value) || 3,
    communication: parseInt(document.getElementById('communication').value) || 3,
    returnRate: parseInt(document.getElementById('returnRate').value) || 3,
    moqScore: parseInt(document.getElementById('moqScore').value) || 3,
    notes: document.getElementById('notes').value.trim()
  };
}

function validateForm(data) {
  if (!data.name) { alert('Supplier name is required'); return false; }
  const scores = [data.priceScore, data.shippingScore, data.qualityScore, data.communication, data.returnRate, data.moqScore];
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] < 1 || scores[i] > 5) { alert('All scores must be between 1 and 5'); return false; }
  }
  return true;
}

async function saveSupplier() {
  const data = getFormData();
  if (!validateForm(data)) return;

  const editId = document.getElementById('editId').value;
  const url = editId ? '/api/suppliers?id=' + editId : '/api/suppliers';
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      resetForm();
      loadSuppliers();
    } else {
      alert('Error saving supplier');
    }
  } catch (e) {
    alert('Network error');
  }
}

function editSupplier(id) {
  const s = allSuppliers.find(x => x.id === id);
  if (!s) return;
  document.getElementById('editId').value = s.id;
  document.getElementById('name').value = s.name;
  document.getElementById('marketplace').value = s.marketplace || '';
  document.getElementById('category').value = s.productCategory || '';
  document.getElementById('priceScore').value = s.priceScore;
  document.getElementById('shippingScore').value = s.shippingScore;
  document.getElementById('qualityScore').value = s.qualityScore;
  document.getElementById('communication').value = s.communication;
  document.getElementById('returnRate').value = s.returnRate;
  document.getElementById('moqScore').value = s.moqScore;
  document.getElementById('notes').value = s.notes || '';
  document.getElementById('formTitle').textContent = 'Edit Supplier';
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier?')) return;
  try {
    const res = await fetch('/api/suppliers?id=' + id, { method: 'DELETE' });
    if (res.ok) loadSuppliers();
  } catch (e) {
    alert('Network error');
  }
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('name').value = '';
  document.getElementById('marketplace').value = '';
  document.getElementById('category').value = '';
  document.getElementById('priceScore').value = 3;
  document.getElementById('shippingScore').value = 3;
  document.getElementById('qualityScore').value = 3;
  document.getElementById('communication').value = 3;
  document.getElementById('returnRate').value = 3;
  document.getElementById('moqScore').value = 3;
  document.getElementById('notes').value = '';
  document.getElementById('formTitle').textContent = 'Add Supplier';
}

// Init
loadSuppliers();
if (localStorage.getItem('theme') === 'dark') toggleTheme();

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') resetForm();
  if (e.key === 'Enter' && e.ctrlKey) saveSupplier();
});
</script>
</body>
</html>`
