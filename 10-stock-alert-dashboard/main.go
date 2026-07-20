package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const PORT = 3470

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	SKU         string  `json:"sku"`
	Marketplace string  `json:"marketplace"`
	Category    string  `json:"category"`
	Stock       int     `json:"stock"`
	MinStock    int     `json:"min_stock"`
	MaxStock    int     `json:"max_stock"`
	UnitCost    float64 `json:"unit_cost"`
	Notes       string  `json:"notes"`
	UpdatedAt   string  `json:"updated_at"`
	CreatedAt   string  `json:"created_at"`
}

type StockDB struct {
	mu       sync.RWMutex
	Products []Product `json:"products"`
	NextID   int       `json:"next_id"`
	filePath string
}

var db *StockDB

var marketplaces = []string{"Tokopedia", "Shopee", "Lazada", "Bukalapak", "Blibli", "TikTok Shop"}
var categories = []string{"Elektronik", "Fashion", "Makanan", "Kecantikan", "Rumah Tangga", "Kesehatan", "Olahraga", "Lainnya"}

func loadDB(path string) *StockDB {
	sdb := &StockDB{filePath: path, NextID: 1}
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, sdb)
	}
	if sdb.Products == nil {
		sdb.Products = []Product{}
	}
	return sdb
}

func (s *StockDB) save() {
	s.mu.RLock()
	data, _ := json.MarshalIndent(s, "", "  ")
	s.mu.RUnlock()
	os.WriteFile(s.filePath, data, 0644)
}

func (s *StockDB) add(p Product) Product {
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = s.NextID
	s.NextID++
	now := time.Now().Format("2006-01-02 15:04:05")
	p.CreatedAt = now
	p.UpdatedAt = now
	s.Products = append(s.Products, p)
	return p
}

func (s *StockDB) update(id int, p Product) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, prod := range s.Products {
		if prod.ID == id {
			p.ID = id
			p.CreatedAt = prod.CreatedAt
			p.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
			s.Products[i] = p
			return true
		}
	}
	return false
}

func (s *StockDB) delete(id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.Products {
		if p.ID == id {
			s.Products = append(s.Products[:i], s.Products[i+1:]...)
			return true
		}
	}
	return false
}

func (s *StockDB) adjustStock(id int, delta int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.Products {
		if p.ID == id {
			newStock := p.Stock + delta
			if newStock < 0 {
				newStock = 0
			}
			s.Products[i].Stock = newStock
			s.Products[i].UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
			return true
		}
	}
	return false
}

func (s *StockDB) getSummary() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	total := len(s.Products)
	lowStock := 0
	outOfStock := 0
	overStock := 0
	totalValue := 0.0

	for _, p := range s.Products {
		if p.Stock == 0 {
			outOfStock++
		} else if p.Stock <= p.MinStock {
			lowStock++
		}
		if p.MaxStock > 0 && p.Stock > p.MaxStock {
			overStock++
		}
		totalValue += float64(p.Stock) * p.UnitCost
	}

	return map[string]interface{}{
		"total_products": total,
		"low_stock":      lowStock,
		"out_of_stock":   outOfStock,
		"over_stock":     overStock,
		"total_value":    totalValue,
	}
}

func (s *StockDB) getAlerts() []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var alerts []map[string]interface{}
	for _, p := range s.Products {
		if p.Stock == 0 {
			alerts = append(alerts, map[string]interface{}{
				"product":    p.Name,
				"marketplace": p.Marketplace,
				"sku":        p.SKU,
				"stock":      p.Stock,
				"min_stock":  p.MinStock,
				"type":       "out_of_stock",
				"message":    "Stok habis! Segera restock.",
			})
		} else if p.Stock <= p.MinStock {
			alerts = append(alerts, map[string]interface{}{
				"product":    p.Name,
				"marketplace": p.Marketplace,
				"sku":        p.SKU,
				"stock":      p.Stock,
				"min_stock":  p.MinStock,
				"type":       "low_stock",
				"message":    fmt.Sprintf("Stok tinggal %d, minimum %d", p.Stock, p.MinStock),
			})
		}
		if p.MaxStock > 0 && p.Stock > p.MaxStock {
			alerts = append(alerts, map[string]interface{}{
				"product":    p.Name,
				"marketplace": p.Marketplace,
				"sku":        p.SKU,
				"stock":      p.Stock,
				"max_stock":  p.MaxStock,
				"type":       "over_stock",
				"message":    fmt.Sprintf("Stok berlebih: %d dari max %d", p.Stock, p.MaxStock),
			})
		}
	}
	sort.Slice(alerts, func(i, j int) bool {
		priority := map[string]int{"out_of_stock": 0, "low_stock": 1, "over_stock": 2}
		return priority[alerts[i]["type"].(string)] < priority[alerts[j]["type"].(string)]
	})
	return alerts
}

func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func handleProducts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		// Optional filters
		mp := r.URL.Query().Get("marketplace")
		cat := r.URL.Query().Get("category")
		alertOnly := r.URL.Query().Get("alerts") == "1"

		db.mu.RLock()
		var results []Product
		for _, p := range db.Products {
			if mp != "" && p.Marketplace != mp {
				continue
			}
			if cat != "" && p.Category != cat {
				continue
			}
			if alertOnly && p.Stock > p.MinStock {
				if p.MaxStock <= 0 || p.Stock <= p.MaxStock {
					continue
				}
			}
			results = append(results, p)
		}
		db.mu.RUnlock()
		if results == nil {
			results = []Product{}
		}
		jsonResponse(w, results)

	case "POST":
		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, `{"error":"invalid json"}`, 400)
			return
		}
		if p.Name == "" {
			http.Error(w, `{"error":"name required"}`, 400)
			return
		}
		created := db.add(p)
		db.save()
		w.WriteHeader(201)
		jsonResponse(w, created)

	default:
		http.Error(w, `{"error":"method not allowed"}`, 405)
	}
}

func handleProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, 400)
		return
	}

	switch r.Method {
	case "PUT":
		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, `{"error":"invalid json"}`, 400)
			return
		}
		if db.update(id, p) {
			db.save()
			jsonResponse(w, map[string]string{"status": "ok"})
		} else {
			http.Error(w, `{"error":"not found"}`, 404)
		}

	case "DELETE":
		if db.delete(id) {
			db.save()
			jsonResponse(w, map[string]string{"status": "ok"})
		} else {
			http.Error(w, `{"error":"not found"}`, 404)
		}

	default:
		http.Error(w, `{"error":"method not allowed"}`, 405)
	}
}

func handleAdjustStock(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, `{"error":"method not allowed"}`, 405)
		return
	}
	var body struct {
		ID    int `json:"id"`
		Delta int `json:"delta"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"invalid json"}`, 400)
		return
	}
	if db.adjustStock(body.ID, body.Delta) {
		db.save()
		jsonResponse(w, map[string]string{"status": "ok"})
	} else {
		http.Error(w, `{"error":"not found"}`, 404)
	}
}

func handleSummary(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, db.getSummary())
}

func handleAlerts(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, db.getAlerts())
}

func handleMeta(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, map[string]interface{}{
		"marketplaces": marketplaces,
		"categories":   categories,
	})
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=stock_export.csv")
	fmt.Fprintln(w, "ID,Produk,SKU,Marketplace,Kategori,Stok,Min Stok,Max Stok,Harga Modal,Update Terakhir")
	for _, p := range db.Products {
		fmt.Fprintf(w, "%d,%q,%q,%q,%q,%d,%d,%d,%.0f,%s\n",
			p.ID, p.Name, p.SKU, p.Marketplace, p.Category,
			p.Stock, p.MinStock, p.MaxStock, p.UnitCost, p.UpdatedAt)
	}
}

var htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stock Alert Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;--yellow:#ca8a04;--orange:#ea580c;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent-light:#1a2e28;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
.container{max-width:1100px;margin:0 auto;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.header h1{font-size:1.5rem;font-weight:600}
.header-actions{display:flex;gap:8px;align-items:center}
.theme-toggle,.btn{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;font-family:inherit}
.theme-toggle:hover,.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn-primary:hover{background:var(--accent-hover);color:#fff;border-color:var(--accent-hover)}
.btn-danger{background:var(--card);color:var(--red);border-color:var(--red)}
.btn-danger:hover{background:var(--red);color:#fff}
.btn-sm{padding:4px 8px;font-size:0.75rem}

/* Summary */
.summary{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.summary-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px}
.summary-card .label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:4px}
.summary-card .value{font-size:1.3rem;font-weight:600;font-family:'JetBrains Mono',monospace}
.summary-card .value.green{color:var(--green)}
.summary-card .value.red{color:var(--red)}
.summary-card .value.yellow{color:var(--yellow)}
.summary-card .value.orange{color:var(--orange)}

/* Alerts */
.alerts-section{margin-bottom:24px}
.alerts-section h2{font-size:1rem;font-weight:600;margin-bottom:12px}
.alert-list{display:flex;flex-direction:column;gap:8px}
.alert-item{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-left:3px solid var(--yellow)}
.alert-item.out_of_stock{border-left-color:var(--red)}
.alert-item.low_stock{border-left-color:var(--yellow)}
.alert-item.over_stock{border-left-color:var(--orange)}
.alert-info{display:flex;flex-direction:column;gap:2px}
.alert-product{font-weight:600;font-size:0.9rem}
.alert-meta{font-size:0.75rem;color:var(--text-dim)}
.alert-message{font-size:0.8rem;font-weight:500}
.alert-message.red{color:var(--red)}
.alert-message.yellow{color:var(--yellow)}
.alert-message.orange{color:var(--orange)}

/* Tabs */
.tabs{display:flex;gap:0;margin-bottom:0;border-bottom:2px solid var(--border)}
.tab{padding:10px 20px;font-size:0.85rem;font-weight:500;cursor:pointer;color:var(--text-dim);border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.panel{display:none;padding-top:20px}
.panel.active{display:block}

/* Table */
.table-wrap{overflow-x:auto;margin-top:12px}
table{width:100%;border-collapse:collapse;font-size:0.85rem}
th{text-align:left;padding:10px 12px;border-bottom:2px solid var(--border);font-weight:600;color:var(--text-dim);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.04em}
td{padding:10px 12px;border-bottom:1px solid var(--border)}
tr:hover{background:var(--card-alt)}
.mono{font-family:'JetBrains Mono',monospace}
.stock-ok{color:var(--green);font-weight:500}
.stock-low{color:var(--yellow);font-weight:500}
.stock-out{color:var(--red);font-weight:600}
.stock-over{color:var(--orange);font-weight:500}
.stock-actions{display:flex;gap:4px}

/* Form */
.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.form-group{margin-bottom:12px}
.form-group label{display:block;font-size:0.8rem;font-weight:500;color:var(--text-dim);margin-bottom:4px}
.form-group input,.form-group select{width:100%;padding:10px 12px;border:1px solid var(--input-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:0.9rem;font-family:inherit}
.form-group input:focus,.form-group select:focus{outline:none;border-color:var(--accent)}
.form-group .hint{font-size:0.7rem;color:var(--text-muted);margin-top:2px}
.form-actions{display:flex;gap:8px;margin-top:8px}

/* Filters */
.filters{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.filters select{padding:8px 12px;border:1px solid var(--input-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:0.85rem;font-family:inherit}
.filters select:focus{outline:none;border-color:var(--accent)}
.filter-label{font-size:0.8rem;color:var(--text-dim)}

.empty-state{text-align:center;padding:40px 20px;color:var(--text-muted)}
.empty-state p{font-size:0.9rem;margin-top:8px}

@media(max-width:768px){
  .summary{grid-template-columns:repeat(2,1fr)}
  .form-grid{grid-template-columns:1fr}
  .container{padding:12px}
  .header{flex-direction:column;gap:12px;align-items:flex-start}
  .header h1{font-size:1.2rem}
  .tabs{flex-wrap:wrap}
  .tab{padding:8px 14px;font-size:0.8rem}
  .filters{flex-direction:column}
  .filters select{width:100%}
  .alert-item{flex-direction:column;align-items:flex-start;gap:8px}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Stock Alert Dashboard</h1>
    <div class="header-actions">
      <button class="btn" onclick="exportCSV()">Export CSV</button>
      <button class="theme-toggle" onclick="toggleTheme()">Dark</button>
    </div>
  </div>

  <div class="summary" id="summary">
    <div class="summary-card"><div class="label">Total Produk</div><div class="value" id="sTotal">0</div></div>
    <div class="summary-card"><div class="label">Stok Rendah</div><div class="value yellow" id="sLow">0</div></div>
    <div class="summary-card"><div class="label">Stok Habis</div><div class="value red" id="sOut">0</div></div>
    <div class="summary-card"><div class="label">Stok Berlebih</div><div class="value orange" id="sOver">0</div></div>
    <div class="summary-card"><div class="label">Total Nilai Stok</div><div class="value green" id="sValue">Rp 0</div></div>
  </div>

  <div class="alerts-section" id="alertsSection" style="display:none">
    <h2>Alert Stok</h2>
    <div class="alert-list" id="alertList"></div>
  </div>

  <div class="tabs">
    <div class="tab active" data-panel="inventory">Inventory</div>
    <div class="tab" data-panel="add">Tambah Produk</div>
    <div class="tab" data-panel="alerts">Semua Alert</div>
  </div>

  <div class="panel active" id="panel-inventory">
    <div class="filters">
      <span class="filter-label">Filter:</span>
      <select id="filterMp" onchange="loadInventory()"><option value="">Semua Marketplace</option></select>
      <select id="filterCat" onchange="loadInventory()"><option value="">Semua Kategori</option></select>
      <select id="filterStatus" onchange="loadInventory()">
        <option value="">Semua Status</option>
        <option value="low">Stok Rendah</option>
        <option value="out">Stok Habis</option>
        <option value="over">Stok Berlebih</option>
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>SKU</th>
            <th>Marketplace</th>
            <th>Stok</th>
            <th>Min</th>
            <th>Max</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="inventoryBody"></tbody>
      </table>
    </div>
    <div class="empty-state" id="emptyInventory" style="display:none">
      <p>Belum ada produk. Tambahkan di tab "Tambah Produk".</p>
    </div>
  </div>

  <div class="panel" id="panel-add">
    <div class="form-grid">
      <div class="form-group">
        <label>Nama Produk</label>
        <input type="text" id="pName" placeholder="TWS Bluetooth Earphone">
      </div>
      <div class="form-group">
        <label>SKU</label>
        <input type="text" id="pSKU" placeholder="TWS-001">
        <div class="hint">Kode unik produk</div>
      </div>
      <div class="form-group">
        <label>Marketplace</label>
        <select id="pMarketplace"></select>
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select id="pCategory"></select>
      </div>
      <div class="form-group">
        <label>Stok Saat Ini</label>
        <input type="number" id="pStock" placeholder="50" min="0">
      </div>
      <div class="form-group">
        <label>Stok Minimum (Alert)</label>
        <input type="number" id="pMinStock" placeholder="10" min="0">
        <div class="hint">Alert jika stok di bawah angka ini</div>
      </div>
      <div class="form-group">
        <label>Stok Maksimum</label>
        <input type="number" id="pMaxStock" placeholder="200" min="0">
        <div class="hint">Alert jika stok melebihi (opsional)</div>
      </div>
      <div class="form-group">
        <label>Harga Modal (per item)</label>
        <input type="number" id="pUnitCost" placeholder="35000" min="0">
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" id="pNotes" placeholder="Opsional">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" id="saveBtn" onclick="saveProduct()">Simpan Produk</button>
      <button class="btn" onclick="fillExample()">Isi Contoh</button>
      <button class="btn" onclick="fillBulkExample()">Isi 5 Contoh</button>
    </div>
  </div>

  <div class="panel" id="panel-alerts">
    <div id="allAlerts"></div>
    <div class="empty-state" id="emptyAlerts" style="display:none">
      <p>Semua stok aman. Tidak ada alert saat ini.</p>
    </div>
  </div>
</div>

<script>
const $ = id => document.getElementById(id);

// Theme
function toggleTheme() {
  const isDark = document.body.hasAttribute('data-theme');
  if (isDark) {
    document.body.removeAttribute('data-theme');
    document.querySelector('.theme-toggle').textContent = 'Dark';
    localStorage.setItem('theme', 'light');
  } else {
    document.body.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').textContent = 'Light';
    localStorage.setItem('theme', 'dark');
  }
}
if (localStorage.getItem('theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.querySelector('.theme-toggle').textContent = 'Light';
}

// Init
let META = { marketplaces: [], categories: [] };
async function init() {
  const resp = await fetch('/api/meta');
  META = await resp.json();
  const mpSel = $('pMarketplace');
  const catSel = $('pCategory');
  const filterMp = $('filterMp');
  const filterCat = $('filterCat');
  META.marketplaces.forEach(m => {
    mpSel.innerHTML += '<option value="'+m+'">'+m+'</option>';
    filterMp.innerHTML += '<option value="'+m+'">'+m+'</option>';
  });
  META.categories.forEach(c => {
    catSel.innerHTML += '<option value="'+c+'">'+c+'</option>';
    filterCat.innerHTML += '<option value="'+c+'">'+c+'</option>';
  });
  loadSummary();
  loadAlerts();
  loadInventory();
}
init();

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    $('panel-' + this.dataset.panel).classList.add('active');
    if (this.dataset.panel === 'inventory') loadInventory();
    if (this.dataset.panel === 'alerts') loadAllAlerts();
  });
});

function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

async function loadSummary() {
  const resp = await fetch('/api/summary');
  const d = await resp.json();
  $('sTotal').textContent = d.total_products;
  $('sLow').textContent = d.low_stock;
  $('sOut').textContent = d.out_of_stock;
  $('sOver').textContent = d.over_stock;
  $('sValue').textContent = fmt(d.total_value);
}

async function loadAlerts() {
  const resp = await fetch('/api/alerts');
  const alerts = await resp.json();
  const section = $('alertsSection');
  const list = $('alertList');
  if (alerts.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  // Show top 3 alerts only
  list.innerHTML = alerts.slice(0, 3).map(a => {
    const colorClass = a.type === 'out_of_stock' ? 'red' : (a.type === 'low_stock' ? 'yellow' : 'orange');
    return '<div class="alert-item '+a.type+'">' +
      '<div class="alert-info">' +
        '<span class="alert-product">'+esc(a.product)+'</span>' +
        '<span class="alert-meta">'+esc(a.marketplace)+' | SKU: '+esc(a.sku)+'</span>' +
      '</div>' +
      '<span class="alert-message '+colorClass+'">'+esc(a.message)+'</span>' +
    '</div>';
  }).join('');
}

async function loadAllAlerts() {
  const resp = await fetch('/api/alerts');
  const alerts = await resp.json();
  const container = $('allAlerts');
  const empty = $('emptyAlerts');
  if (alerts.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = '<div class="alert-list">' + alerts.map(a => {
    const colorClass = a.type === 'out_of_stock' ? 'red' : (a.type === 'low_stock' ? 'yellow' : 'orange');
    return '<div class="alert-item '+a.type+'">' +
      '<div class="alert-info">' +
        '<span class="alert-product">'+esc(a.product)+'</span>' +
        '<span class="alert-meta">'+esc(a.marketplace)+' | SKU: '+esc(a.sku)+'</span>' +
      '</div>' +
      '<span class="alert-message '+colorClass+'">'+esc(a.message)+'</span>' +
    '</div>';
  }).join('') + '</div>';
}

async function loadInventory() {
  const mp = $('filterMp').value;
  const cat = $('filterCat').value;
  const status = $('filterStatus').value;

  let url = '/api/products?';
  if (mp) url += 'marketplace=' + encodeURIComponent(mp) + '&';
  if (cat) url += 'category=' + encodeURIComponent(cat) + '&';
  if (status) url += 'alerts=1&';

  const resp = await fetch(url);
  let data = await resp.json();

  // Client-side status filter
  if (status) {
    data = data.filter(p => {
      if (status === 'out') return p.stock === 0;
      if (status === 'low') return p.stock > 0 && p.stock <= p.min_stock;
      if (status === 'over') return p.max_stock > 0 && p.stock > p.max_stock;
      return true;
    });
  }

  const tbody = $('inventoryBody');
  const empty = $('emptyInventory');

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(p => {
    let statusClass = 'stock-ok';
    let statusText = 'Aman';
    if (p.stock === 0) { statusClass = 'stock-out'; statusText = 'Habis'; }
    else if (p.stock <= p.min_stock) { statusClass = 'stock-low'; statusText = 'Rendah'; }
    if (p.max_stock > 0 && p.stock > p.max_stock) { statusClass = 'stock-over'; statusText = 'Berlebih'; }

    return '<tr>' +
      '<td>'+esc(p.name)+'</td>' +
      '<td class="mono">'+esc(p.sku)+'</td>' +
      '<td>'+esc(p.marketplace)+'</td>' +
      '<td class="mono '+statusClass+'">'+p.stock+'</td>' +
      '<td class="mono">'+p.min_stock+'</td>' +
      '<td class="mono">'+(p.max_stock || '-')+'</td>' +
      '<td class="'+statusClass+'">'+statusText+'</td>' +
      '<td>' +
        '<div class="stock-actions">' +
          '<button class="btn btn-sm" onclick="adjustStock('+p.id+', 1)" title="Tambah 1">+1</button>' +
          '<button class="btn btn-sm" onclick="adjustStock('+p.id+', 5)" title="Tambah 5">+5</button>' +
          '<button class="btn btn-sm" onclick="adjustStock('+p.id+', -1)" title="Kurang 1">-1</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteProduct('+p.id+')" title="Hapus">x</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

async function saveProduct() {
  const btn = $('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const body = {
    name: $('pName').value,
    sku: $('pSKU').value,
    marketplace: $('pMarketplace').value,
    category: $('pCategory').value,
    stock: parseInt($('pStock').value) || 0,
    min_stock: parseInt($('pMinStock').value) || 0,
    max_stock: parseInt($('pMaxStock').value) || 0,
    unit_cost: parseFloat($('pUnitCost').value) || 0,
    notes: $('pNotes').value
  };

  if (!body.name) {
    alert('Nama produk wajib diisi');
    btn.disabled = false;
    btn.textContent = 'Simpan Produk';
    return;
  }

  const resp = await fetch('/api/products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    $('pName').value = '';
    $('pSKU').value = '';
    $('pStock').value = '';
    $('pMinStock').value = '';
    $('pMaxStock').value = '';
    $('pUnitCost').value = '';
    $('pNotes').value = '';
    loadSummary();
    loadAlerts();
  }

  btn.disabled = false;
  btn.textContent = 'Simpan Produk';
}

function fillExample() {
  $('pName').value = 'TWS Bluetooth Earphone';
  $('pSKU').value = 'TWS-001';
  $('pMarketplace').value = 'Shopee';
  $('pCategory').value = 'Elektronik';
  $('pStock').value = '8';
  $('pMinStock').value = '10';
  $('pMaxStock').value = '200';
  $('pUnitCost').value = '35000';
  $('pNotes').value = 'Supplier: Toko A, Lead time 3 hari';
}

async function fillBulkExample() {
  const examples = [
    {name:'TWS Bluetooth Earphone', sku:'TWS-001', marketplace:'Shopee', category:'Elektronik', stock:8, min_stock:10, max_stock:200, unit_cost:35000},
    {name:'Kaos Polos Cotton Combed 30s', sku:'FASH-010', marketplace:'Tokopedia', category:'Fashion', stock:150, min_stock:20, max_stock:500, unit_cost:45000},
    {name:'Sambal Bang Jarwo 250ml', sku:'MAK-005', marketplace:'TikTok Shop', category:'Makanan', stock:3, min_stock:15, max_stock:100, unit_cost:12000},
    {name:'Serum Vitamin C 30ml', sku:'KEC-022', marketplace:'Lazada', category:'Kecantikan', stock:45, min_stock:10, max_stock:0, unit_cost:28000},
    {name:'Rak Dinding Minimalis', sku:'RUM-008', marketplace:'Blibli', category:'Rumah Tangga', stock:0, min_stock:5, max_stock:50, unit_cost:65000},
  ];

  for (const ex of examples) {
    await fetch('/api/products', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(ex)
    });
  }
  loadSummary();
  loadAlerts();
  loadInventory();
}

async function adjustStock(id, delta) {
  await fetch('/api/adjust-stock', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id, delta})
  });
  loadInventory();
  loadSummary();
  loadAlerts();
}

async function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  await fetch('/api/products/' + id, {method: 'DELETE'});
  loadInventory();
  loadSummary();
  loadAlerts();
}

function exportCSV() {
  window.open('/api/export', '_blank');
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
</script>
</body>
</html>`

func main() {
	dbPath := "stock.json"
	if len(os.Args) > 1 {
		dbPath = os.Args[1]
	}
	db = loadDB(dbPath)

	http.HandleFunc("/api/summary", handleSummary)
	http.HandleFunc("/api/alerts", handleAlerts)
	http.HandleFunc("/api/meta", handleMeta)
	http.HandleFunc("/api/products", handleProducts)
	http.HandleFunc("/api/products/", handleProductByID)
	http.HandleFunc("/api/adjust-stock", handleAdjustStock)
	http.HandleFunc("/api/export", handleExport)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, htmlContent)
	})

	addr := fmt.Sprintf(":%d", PORT)
	fmt.Printf("Stock Alert Dashboard running on http://localhost:%d\n", PORT)
	log.Fatal(http.ListenAndServe(addr, nil))
}
