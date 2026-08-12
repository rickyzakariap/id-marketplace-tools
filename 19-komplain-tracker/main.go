package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

const PORT = "3620"
const DATA_FILE = "data/complaints.json"

type Complaint struct {
	ID            string    `json:"id"`
	Marketplace   string    `json:"marketplace"`
	OrderID       string    `json:"order_id"`
	ProductName   string    `json:"product_name"`
	ComplaintType string    `json:"complaint_type"`
	Severity      string    `json:"severity"`
	Status        string    `json:"status"`
	BuyerName     string    `json:"buyer_name"`
	Description   string    `json:"description"`
	Notes         []string  `json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	ResolvedAt    time.Time `json:"resolved_at"`
}

type Store struct {
	mu         sync.Mutex
	complaints []Complaint
	seq        int
}

var store = &Store{}

const (
	STATUS_NEW     = "baru"
	STATUS_REPLIED = "ditanggapi"
	STATUS_PROCESS = "diproses"
	STATUS_DONE    = "selesai"
	STATUS_CANCEL  = "batal"
)

var VALID_STATUS = map[string]bool{
	STATUS_NEW: true, STATUS_REPLIED: true, STATUS_PROCESS: true,
	STATUS_DONE: true, STATUS_CANCEL: true,
}

var VALID_MARKETPLACES = []string{"Shopee", "Tokopedia", "Lazada", "Bukalapak", "Blibli", "TikTok Shop"}

var COMPLAINT_TYPES = []string{"terlambat", "barang rusak", "salah kirim", "refund", "ongkir", "kualitas", "lainnya"}

func (s *Store) load() {
	data, err := os.ReadFile(DATA_FILE)
	if err != nil {
		return
	}
	var saved struct {
		Complaints []Complaint `json:"complaints"`
		Seq        int         `json:"seq"`
	}
	if err := json.Unmarshal(data, &saved); err != nil {
		log.Printf("warning: failed to parse %s: %v", DATA_FILE, err)
		return
	}
	s.complaints = saved.Complaints
	s.seq = saved.Seq
}

func (s *Store) save() {
	os.MkdirAll("data", 0755)
	data, _ := json.MarshalIndent(struct {
		Complaints []Complaint `json:"complaints"`
		Seq        int         `json:"seq"`
	}{s.complaints, s.seq}, "", "  ")
	os.WriteFile(DATA_FILE, data, 0644)
}

func (s *Store) add(c Complaint) Complaint {
	s.seq++
	c.ID = fmt.Sprintf("K%03d", s.seq)
	c.CreatedAt = time.Now()
	c.UpdatedAt = c.CreatedAt
	s.complaints = append(s.complaints, c)
	s.save()
	return c
}

func (s *Store) update(id string, status string, note string) (Complaint, bool) {
	for i := range s.complaints {
		if s.complaints[i].ID == id {
			c := &s.complaints[i]
			if VALID_STATUS[status] {
				c.Status = status
				if status == STATUS_DONE || status == STATUS_CANCEL {
					c.ResolvedAt = time.Now()
				}
			}
			if note != "" {
				c.Notes = append(c.Notes, fmt.Sprintf("[%s] %s", time.Now().Format("02 Jan 15:04"), note))
			}
			c.UpdatedAt = time.Now()
			s.save()
			return *c, true
		}
	}
	return Complaint{}, false
}

func (s *Store) remove(id string) bool {
	for i := range s.complaints {
		if s.complaints[i].ID == id {
			s.complaints = append(s.complaints[:i], s.complaints[i+1:]...)
			s.save()
			return true
		}
	}
	return false
}

func (s *Store) seed() {
	if len(s.complaints) > 0 {
		return
	}
	now := time.Now()
	seedData := []Complaint{
		{Marketplace: "Shopee", OrderID: "260801XYZ123", ProductName: "TWS Bluetooth Earphone X7", ComplaintType: "terlambat", Severity: "sedang", Status: STATUS_NEW, BuyerName: "Budi Santoso", Description: "Pesanan belum sampai setelah 5 hari, buyer minta update resi.", Notes: []string{"[seed] auto-generated example"}},
		{Marketplace: "Tokopedia", OrderID: "TP-88231", ProductName: "Kemeja Flanel Pria Premium", ComplaintType: "salah kirim", Severity: "tinggi", Status: STATUS_REPLIED, BuyerName: "Siti Rahma", Description: "Ukuran L terkirim, padahal pesanan M. Buyer minta tukar.", Notes: []string{"[seed] auto-generated example", "[seed] sudah dibalas, menunggu foto produk"}},
		{Marketplace: "Lazada", OrderID: "LZD-7712", ProductName: "Skincare Set Vitamin C", ComplaintType: "kualitas", Severity: "rendah", Status: STATUS_PROCESS, BuyerName: "Andi Wijaya", Description: "Kemasan penyok, isi masih bagus. Buyer minta kompensasi.", Notes: []string{"[seed] auto-generated example"}},
		{Marketplace: "Shopee", OrderID: "260802ABC789", ProductName: "Tas Ransel Anti Air", ComplaintType: "refund", Severity: "tinggi", Status: STATUS_NEW, BuyerName: "Dewi Lestari", Description: "Produk bocor saat hujan, buyer minta refund penuh.", Notes: []string{}},
	}
	for i := range seedData {
		seedData[i].CreatedAt = now.Add(-time.Duration(i*8+2) * time.Hour)
		seedData[i].UpdatedAt = seedData[i].CreatedAt
	}
	for _, c := range seedData {
		s.add(c)
	}
}

func complaintTypeOf(t string) string {
	for _, valid := range COMPLAINT_TYPES {
		if t == valid {
			return t
		}
	}
	return "lainnya"
}

func responseDue(c Complaint) time.Time { return c.CreatedAt.Add(24 * time.Hour) }
func resolveDue(c Complaint) time.Time  { return c.CreatedAt.Add(72 * time.Hour) }

func isOpen(c Complaint) bool {
	return c.Status == STATUS_NEW || c.Status == STATUS_REPLIED || c.Status == STATUS_PROCESS
}

// 0 = on track, 1 = response overdue, 2 = resolution overdue
func slaLevel(c Complaint) int {
	now := time.Now()
	if !isOpen(c) {
		return 0
	}
	if now.After(resolveDue(c)) {
		return 2
	}
	if now.After(responseDue(c)) {
		return 1
	}
	return 0
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, htmlPage)
}

func handleList(w http.ResponseWriter, r *http.Request) {
	store.mu.Lock()
	defer store.mu.Unlock()
	q := r.URL.Query()
	status := q.Get("status")
	marketplace := q.Get("marketplace")
	ctype := q.Get("type")
	list := make([]Complaint, 0, len(store.complaints))
	for _, c := range store.complaints {
		if status != "" && c.Status != status {
			continue
		}
		if marketplace != "" && c.Marketplace != marketplace {
			continue
		}
		if ctype != "" && c.ComplaintType != ctype {
			continue
		}
		list = append(list, c)
	}
	sort.Slice(list, func(i, j int) bool { return list[i].CreatedAt.After(list[j].CreatedAt) })
	writeJSON(w, 200, map[string]interface{}{"complaints": list})
}

func handleCreate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Marketplace   string `json:"marketplace"`
		OrderID       string `json:"order_id"`
		ProductName   string `json:"product_name"`
		ComplaintType string `json:"complaint_type"`
		Severity      string `json:"severity"`
		BuyerName     string `json:"buyer_name"`
		Description   string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "Invalid JSON"})
		return
	}
	if strings.TrimSpace(body.ProductName) == "" {
		writeJSON(w, 400, map[string]string{"error": "Nama produk wajib diisi"})
		return
	}
	mpValid := false
	for _, mp := range VALID_MARKETPLACES {
		if body.Marketplace == mp {
			mpValid = true
			break
		}
	}
	if !mpValid {
		body.Marketplace = "Shopee"
	}
	severity := body.Severity
	if severity != "rendah" && severity != "sedang" && severity != "tinggi" {
		severity = "sedang"
	}
	store.mu.Lock()
	c := store.add(Complaint{
		Marketplace:   body.Marketplace,
		OrderID:       strings.TrimSpace(body.OrderID),
		ProductName:   strings.TrimSpace(body.ProductName),
		ComplaintType: complaintTypeOf(body.ComplaintType),
		Severity:      severity,
		Status:        STATUS_NEW,
		BuyerName:     strings.TrimSpace(body.BuyerName),
		Description:   strings.TrimSpace(body.Description),
	})
	store.mu.Unlock()
	writeJSON(w, 201, map[string]interface{}{"complaint": c})
}

func handleUpdate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "Invalid JSON"})
		return
	}
	store.mu.Lock()
	c, ok := store.update(id, body.Status, strings.TrimSpace(body.Note))
	store.mu.Unlock()
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "Not found"})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"complaint": c})
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	store.mu.Lock()
	ok := store.remove(id)
	store.mu.Unlock()
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "Not found"})
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "deleted"})
}

func handleStats(w http.ResponseWriter, r *http.Request) {
	store.mu.Lock()
	defer store.mu.Unlock()
	now := time.Now()
	total := len(store.complaints)
	open := 0
	overdueResp := 0
	overdueResolve := 0
	done := 0
	byMarketplace := map[string]int{}
	byType := map[string]int{}
	for _, c := range store.complaints {
		byMarketplace[c.Marketplace]++
		byType[c.ComplaintType]++
		if isOpen(c) {
			open++
			if now.After(responseDue(c)) {
				overdueResp++
			}
			if now.After(resolveDue(c)) {
				overdueResolve++
			}
		}
		if c.Status == STATUS_DONE {
			done++
		}
	}
	// avg resolution hours for done complaints
	var totalHours float64
	countDone := 0
	for _, c := range store.complaints {
		if c.Status == STATUS_DONE && !c.ResolvedAt.IsZero() {
			totalHours += c.ResolvedAt.Sub(c.CreatedAt).Hours()
			countDone++
		}
	}
	avgHours := 0.0
	if countDone > 0 {
		avgHours = totalHours / float64(countDone)
	}
	writeJSON(w, 200, map[string]interface{}{
		"total": total, "open": open, "done": done,
		"overdue_response": overdueResp, "overdue_resolution": overdueResolve,
		"avg_resolution_hours": avgHours,
		"by_marketplace":       byMarketplace,
		"by_type":              byType,
	})
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	store.mu.Lock()
	defer store.mu.Unlock()
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=komplain.csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"ID", "Marketplace", "Order ID", "Produk", "Tipe", "Severity", "Status", "Buyer", "Deskripsi", "Dibuat"})
	for _, c := range store.complaints {
		cw.Write([]string{c.ID, c.Marketplace, c.OrderID, c.ProductName, c.ComplaintType, c.Severity, c.Status, c.BuyerName, c.Description, c.CreatedAt.Format("2006-01-02 15:04")})
	}
	cw.Flush()
}

func handleSeed(w http.ResponseWriter, r *http.Request) {
	store.mu.Lock()
	store.seed()
	store.mu.Unlock()
	writeJSON(w, 200, map[string]interface{}{"ok": "seeded", "total": len(store.complaints)})
}

func main() {
	store.load()
	store.mu.Lock()
	if len(store.complaints) == 0 {
		store.seed()
	}
	store.mu.Unlock()

	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/api/complaints", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleList(w, r)
		case http.MethodPost:
			handleCreate(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/api/complaints/{id}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPatch:
			handleUpdate(w, r)
		case http.MethodDelete:
			handleDelete(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/api/stats", handleStats)
	http.HandleFunc("/api/seed", handleSeed)
	http.HandleFunc("/api/export", handleExport)

	fmt.Printf("Komplain Tracker running at http://localhost:%s\n", PORT)
	log.Fatal(http.ListenAndServe(":"+PORT, nil))
}
