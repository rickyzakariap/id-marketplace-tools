package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"
)

type Supplier struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Marketplace     string    `json:"marketplace"`
	ProductCategory string    `json:"productCategory"`
	PriceScore      int       `json:"priceScore"`
	ShippingScore   int       `json:"shippingScore"`
	QualityScore    int       `json:"qualityScore"`
	Communication   int       `json:"communication"`
	ReturnRate      int       `json:"returnRate"`
	MOQScore        int       `json:"moqScore"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type SupplierResponse struct {
	Supplier
	TotalScore float64 `json:"totalScore"`
	Grade      string  `json:"grade"`
	Rank       int     `json:"rank"`
}

type CompareRequest struct {
	SupplierIDs []string `json:"supplierIds"`
}

var (
	suppliers = make(map[string]*Supplier)
	mu        sync.RWMutex
	dataFile  = "data.json"
)

func loadData() {
	data, err := os.ReadFile(dataFile)
	if err != nil {
		return
	}
	var list []Supplier
	if err := json.Unmarshal(data, &list); err != nil {
		return
	}
	for i := range list {
		suppliers[list[i].ID] = &list[i]
	}
}

func saveData() error {
	list := make([]Supplier, 0, len(suppliers))
	for _, s := range suppliers {
		list = append(list, *s)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(dataFile, data, 0644)
}

func generateID() string {
	return fmt.Sprintf("s%d", time.Now().UnixNano()%10000000)
}

func calculateTotal(s *Supplier) float64 {
	return float64(s.PriceScore+s.ShippingScore+s.QualityScore+s.Communication+s.ReturnRate+s.MOQScore) / 6.0
}

func getGrade(score float64) string {
	switch {
	case score >= 4.5:
		return "A+"
	case score >= 4.0:
		return "A"
	case score >= 3.5:
		return "B+"
	case score >= 3.0:
		return "B"
	case score >= 2.5:
		return "C+"
	case score >= 2.0:
		return "C"
	default:
		return "D"
	}
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		handleGetSuppliers(w, r)
	case "POST":
		handleCreateSupplier(w, r)
	case "PUT":
		handleUpdateSupplier(w, r)
	case "DELETE":
		handleDeleteSupplier(w, r)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleGetSuppliers(w http.ResponseWriter, r *http.Request) {
	mu.RLock()
	defer mu.RUnlock()

	list := make([]SupplierResponse, 0, len(suppliers))
	for _, s := range suppliers {
		score := calculateTotal(s)
		list = append(list, SupplierResponse{
			Supplier:   *s,
			TotalScore: score,
			Grade:      getGrade(score),
		})
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].TotalScore > list[j].TotalScore
	})
	for i := range list {
		list[i].Rank = i + 1
	}

	json.NewEncoder(w).Encode(list)
}

func validateSupplier(s *Supplier) error {
	if s.Name == "" {
		return fmt.Errorf("name is required")
	}
	scores := []int{s.PriceScore, s.ShippingScore, s.QualityScore, s.Communication, s.ReturnRate, s.MOQScore}
	for _, v := range scores {
		if v < 1 || v > 5 {
			return fmt.Errorf("scores must be 1-5")
		}
	}
	return nil
}

func handleCreateSupplier(w http.ResponseWriter, r *http.Request) {
	var s Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if err := validateSupplier(&s); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err), http.StatusBadRequest)
		return
	}

	s.ID = generateID()
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()

	mu.Lock()
	suppliers[s.ID] = &s
	err := saveData()
	mu.Unlock()

	if err != nil {
		http.Error(w, `{"error":"failed to save"}`, http.StatusInternalServerError)
		return
	}

	score := calculateTotal(&s)
	resp := SupplierResponse{
		Supplier:   s,
		TotalScore: score,
		Grade:      getGrade(score),
	}
	json.NewEncoder(w).Encode(resp)
}

func handleUpdateSupplier(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	existing, ok := suppliers[id]
	if !ok {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	var s Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if err := validateSupplier(&s); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err), http.StatusBadRequest)
		return
	}

	s.ID = id
	s.CreatedAt = existing.CreatedAt
	s.UpdatedAt = time.Now()
	suppliers[id] = &s

	if err := saveData(); err != nil {
		http.Error(w, `{"error":"failed to save"}`, http.StatusInternalServerError)
		return
	}

	score := calculateTotal(&s)
	resp := SupplierResponse{
		Supplier:   s,
		TotalScore: score,
		Grade:      getGrade(score),
	}
	json.NewEncoder(w).Encode(resp)
}

func handleDeleteSupplier(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
		return
	}

	mu.Lock()
	delete(suppliers, id)
	err := saveData()
	mu.Unlock()

	if err != nil {
		http.Error(w, `{"error":"failed to save"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

func main() {
	loadData()

	http.HandleFunc("/api/suppliers", handleAPI)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, indexHTML)
	})

	port := "3490"
	log.Printf("Supplier Scorer running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
