package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
)

const PORT = 3717
const DATA_FILE = "data/history.json"

// Category benchmarks: avg price, min, max, most common price points
type CategoryBenchmark struct {
	Name         string  `json:"name"`
	AvgPrice     int     `json:"avg_price"`
	MinPrice     int     `json:"min_price"`
	MaxPrice     int     `json:"max_price"`
	PricePoints  []int   `json:"price_points"`
	Competitors  int     `json:"competitors"`
	DemandLevel  string  `json:"demand_level"`
}

type PriceAnalysis struct {
	Product          string  `json:"product"`
	Category         string  `json:"category"`
	Cost             int     `json:"cost"`
	Marketplace      string  `json:"marketplace"`
	RecommendedPrice int     `json:"recommended_price"`
	PriceRange       [2]int  `json:"price_range"`
	MinProfit        int     `json:"min_profit"`
	MaxProfit        int     `json:"max_profit"`
	OptimalProfit    int     `json:"optimal_profit"`
	OptimalMargin    float64 `json:"optimal_margin"`
	FeeAtOptimal     int     `json:"fee_at_optimal"`
	NetAtOptimal     int     `json:"net_at_optimal"`
	PriceSuggestions []PriceSuggestion `json:"price_suggestions"`
	CompetitorSim    []CompetitorPrice `json:"competitor_sim"`
	Insights         []string          `json:"insights"`
}

type PriceSuggestion struct {
	Price      int     `json:"price"`
	Profit     int     `json:"profit"`
	Margin     float64 `json:"margin"`
	NetAfterFee int    `json:"net_after_fee"`
	Fee        int     `json:"fee"`
	Label      string  `json:"label"`
	Reason     string  `json:"reason"`
}

type CompetitorPrice struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
	Rating float64 `json:"rating"`
	Sold  int    `json:"sold"`
}

type HistoryEntry struct {
	Product     string `json:"product"`
	Category    string `json:"category"`
	Cost        int    `json:"cost"`
	Marketplace string `json:"marketplace"`
	Recommended int    `json:"recommended"`
	Timestamp   string `json:"timestamp"`
}

var mu sync.Mutex

var categories = map[string]CategoryBenchmark{
	"fashion_pria": {
		Name: "Fashion Pria", AvgPrice: 150000, MinPrice: 35000, MaxPrice: 500000,
		PricePoints: []int{49000, 79000, 99000, 129000, 159000, 199000, 250000, 350000},
		Competitors: 850, DemandLevel: "Tinggi",
	},
	"fashion_wanita": {
		Name: "Fashion Wanita", AvgPrice: 125000, MinPrice: 25000, MaxPrice: 450000,
		PricePoints: []int{39000, 59000, 79000, 99000, 129000, 159000, 199000, 299000},
		Competitors: 1200, DemandLevel: "Sangat Tinggi",
	},
	"elektronik": {
		Name: "Elektronik", AvgPrice: 350000, MinPrice: 50000, MaxPrice: 5000000,
		PricePoints: []int{75000, 149000, 249000, 399000, 599000, 899000, 1499000},
		Competitors: 600, DemandLevel: "Tinggi",
	},
	"kecantikan": {
		Name: "Kecantikan & Skincare", AvgPrice: 85000, MinPrice: 15000, MaxPrice: 500000,
		PricePoints: []int{25000, 45000, 69000, 89000, 125000, 175000, 250000},
		Competitors: 950, DemandLevel: "Sangat Tinggi",
	},
	"makanan": {
		Name: "Makanan & Minuman", AvgPrice: 45000, MinPrice: 5000, MaxPrice: 200000,
		PricePoints: []int{10000, 15000, 25000, 35000, 50000, 75000, 99000},
		Competitors: 700, DemandLevel: "Tinggi",
	},
	"rumah_tangga": {
		Name: "Rumah Tangga", AvgPrice: 95000, MinPrice: 10000, MaxPrice: 800000,
		PricePoints: []int{25000, 49000, 75000, 99000, 149000, 199000, 299000},
		Competitors: 500, DemandLevel: "Sedang",
	},
	"otomotif": {
		Name: "Otomotif", AvgPrice: 175000, MinPrice: 20000, MaxPrice: 2000000,
		PricePoints: []int{35000, 65000, 99000, 149000, 249000, 399000, 599000},
		Competitors: 350, DemandLevel: "Sedang",
	},
	"anak": {
		Name: "Ibu & Anak", AvgPrice: 110000, MinPrice: 15000, MaxPrice: 600000,
		PricePoints: []int{29000, 55000, 89000, 125000, 175000, 250000, 399000},
		Competitors: 450, DemandLevel: "Tinggi",
	},
}

// Marketplace fee structures (2026 estimates)
var marketplaceFees = map[string]struct {
	Commission  float64
	PlatformFee float64
	PaymentFee  float64
}{
	"shopee":    {0.055, 0.01, 0.0},
	"tokopedia": {0.04, 0.01, 0.007},
	"lazada":    {0.04, 0.01, 0.012},
	"bukalapak": {0.03, 0.005, 0.0},
	"blibli":    {0.05, 0.01, 0.01},
	"tiktok":    {0.05, 0.01, 0.01},
}

func calcFee(price int, marketplace string) int {
	fees, ok := marketplaceFees[marketplace]
	if !ok {
		fees = marketplaceFees["shopee"]
	}
	totalRate := fees.Commission + fees.PlatformFee + fees.PaymentFee
	return int(math.Round(float64(price) * totalRate))
}

func findNearestPricePoint(price int, points []int) int {
	best := points[0]
	bestDiff := abs(price - best)
	for _, p := range points {
		diff := abs(price - p)
		if diff < bestDiff {
			best = p
			bestDiff = diff
		}
	}
	return best
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func generateCompetitors(product, category string, avgPrice int) []CompetitorPrice {
	names := []string{
		"Toko Jaya", "Sumber Makmur", "Global Store", "Prime Shop",
		"Nusa Trading", "Maju Jaya", "Sentra Murah", "Top Seller",
		"Best Deal", "Pusat Grosir",
	}
	comps := make([]CompetitorPrice, 0, 8)
	for i := 0; i < 8; i++ {
		variation := (i - 4) * (avgPrice / 20)
		price := avgPrice + variation
		if price < 1000 {
			price = 1000
		}
		// Round to nearest 1000
		price = (price / 1000) * 1000
		rating := 4.2 + float64(i%5)*0.15
		if rating > 5.0 {
			rating = 4.9
		}
		sold := 50 + (8-i)*120 + (i * 37)
		comps = append(comps, CompetitorPrice{
			Name:   names[i],
			Price:  price,
			Rating: math.Round(rating*10) / 10,
			Sold:   sold,
		})
	}
	sort.Slice(comps, func(i, j int) bool {
		return comps[i].Price < comps[j].Price
	})
	return comps
}

func analyzePrice(product, category, marketplace string, cost int) PriceAnalysis {
	bench, ok := categories[category]
	if !ok {
		bench = categories["fashion_pria"]
	}

	// Calculate minimum viable price (cost + 15% margin minimum)
	minViable := int(math.Ceil(float64(cost) * 1.15))

	// Find optimal price point near category average
	optimalRaw := bench.AvgPrice
	if cost*2 > optimalRaw {
		optimalRaw = cost * 2
	}
	optimal := findNearestPricePoint(optimalRaw, bench.PricePoints)

	// Ensure optimal is above minimum viable
	if optimal < minViable {
		optimal = findNearestPricePoint(minViable, bench.PricePoints)
		if optimal < minViable {
			// Round up to nearest 1000
			optimal = ((minViable / 1000) + 1) * 1000
		}
	}

	// Fee calculation
	fee := calcFee(optimal, marketplace)
	net := optimal - cost - fee
	margin := float64(net) / float64(optimal) * 100

	// Price range: from cost+20% to max reasonable
	lowEnd := int(math.Ceil(float64(cost) * 1.2))
	highEnd := bench.MaxPrice
	if cost*3 > highEnd {
		highEnd = cost * 3
	}

	// Generate price suggestions at different points
	suggestions := make([]PriceSuggestion, 0, 5)
	// Build a spread of test prices ensuring they're all distinct
	testPrices := []int{
		cost + (optimal-cost)/4,           // Low: quarter way between cost and optimal
		cost + (optimal-cost)/2,           // Competitive: halfway
		optimal,                           // Optimal
		optimal + (bench.MaxPrice/2-optimal)/3, // Premium: above optimal
		bench.MaxPrice / 2,               // High: half of max
	}
	labels := []string{"Harga Minimum", "Harga Kompetitif", "Harga Optimal", "Harga Premium", "Harga Tinggi"}
	reasons := []string{
		"Margin tipis tapi volume tinggi",
		"Di bawah rata-rata kategori, menarik pembeli sensitif harga",
		"Seimbang antara profit dan daya saing",
		"Di atas rata-rata, untuk produk berkualitas",
		"Margin besar tapi volume lebih rendah",
	}

	seen := make(map[int]bool)
	for i, price := range testPrices {
		if price < cost+1000 {
			price = cost + 1000
		}
		// Snap to nearest price point
		price = findNearestPricePoint(price, bench.PricePoints)
		if price < cost+1000 {
			// Round up to nearest 1000 above cost
			price = ((cost / 1000) + 1) * 1000
		}
		// Skip duplicates
		if seen[price] {
			continue
		}
		seen[price] = true
		f := calcFee(price, marketplace)
		p := price - cost - f
		if p <= 0 {
			continue
		}
		m := float64(p) / float64(price) * 100
		suggestions = append(suggestions, PriceSuggestion{
			Price:       price,
			Profit:      p,
			Margin:      math.Round(m*10) / 10,
			NetAfterFee: p,
			Fee:         f,
			Label:       labels[i],
			Reason:      reasons[i],
		})
	}

	// Generate insights
	insights := make([]string, 0, 5)
	if margin > 30 {
		insights = append(insights, fmt.Sprintf("Margin %.0f%% sangat sehat untuk kategori %s", margin, bench.Name))
	} else if margin < 15 {
		insights = append(insights, "Margin tipis. Pertimbangkan naikkan harga atau cari supplier lebih murah")
	}
	if bench.Competitors > 800 {
		insights = append(insights, fmt.Sprintf("Kategori sangat kompetitif (%d+ penjual). Diferensiasi produk penting", bench.Competitors))
	}
	if bench.DemandLevel == "Sangat Tinggi" {
		insights = append(insights, "Demand tinggi - fokus pada review dan rating untuk menang")
	}
	// Check X999 pricing
	lastDigit := optimal % 1000
	if lastDigit == 999 || lastDigit == 999 || optimal%1000 == 0 {
		// already good
	} else {
		x999 := (optimal/1000)*1000 + 999
		if x999-cost-calcFee(x999, marketplace) > 0 {
			insights = append(insights, fmt.Sprintf("Pertimbangkan harga X999: Rp %s (psikologis lebih menarik)", formatRupiah(x999)))
		}
	}
	// Goceng check
	if optimal%5000 != 0 && optimal%5000 != 4999 {
		goceng := ((optimal / 5000) + 1) * 5000
		gocengFee := calcFee(goceng, marketplace)
		gocengNet := goceng - cost - gocengFee
		if gocengNet > 0 {
			insights = append(insights, fmt.Sprintf("Harga goceng terdekat: Rp %s (mudah dihitung buyer)", formatRupiah(goceng)))
		}
	}
	if len(insights) == 0 {
		insights = append(insights, "Harga sudah optimal untuk kategori ini")
	}

	// Competitor simulation
	comps := generateCompetitors(product, category, bench.AvgPrice)

	return PriceAnalysis{
		Product:          product,
		Category:         bench.Name,
		Cost:             cost,
		Marketplace:      marketplace,
		RecommendedPrice: optimal,
		PriceRange:       [2]int{lowEnd, highEnd},
		MinProfit:        lowEnd - cost - calcFee(lowEnd, marketplace),
		MaxProfit:        highEnd/2 - cost - calcFee(highEnd/2, marketplace),
		OptimalProfit:    net,
		OptimalMargin:    math.Round(margin*10) / 10,
		FeeAtOptimal:     fee,
		NetAtOptimal:     net,
		PriceSuggestions: suggestions,
		CompetitorSim:    comps,
		Insights:         insights,
	}
}

func formatRupiah(amount int) string {
	s := strconv.Itoa(amount)
	var result strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result.WriteRune('.')
		}
		result.WriteRune(ch)
	}
	return result.String()
}

func loadHistory() []HistoryEntry {
	mu.Lock()
	defer mu.Unlock()
	data, err := os.ReadFile(DATA_FILE)
	if err != nil {
		return []HistoryEntry{}
	}
	var entries []HistoryEntry
	json.Unmarshal(data, &entries)
	return entries
}

func saveHistory(entries []HistoryEntry) {
	os.MkdirAll(filepath.Dir(DATA_FILE), 0755)
	data, _ := json.MarshalIndent(entries, "", "  ")
	os.WriteFile(DATA_FILE, data, 0644)
}

func main() {
	http.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		cats := make([]map[string]interface{}, 0)
		for key, bench := range categories {
			cats = append(cats, map[string]interface{}{
				"key":         key,
				"name":        bench.Name,
				"avg_price":   bench.AvgPrice,
				"competitors": bench.Competitors,
				"demand":      bench.DemandLevel,
			})
		}
		sort.Slice(cats, func(i, j int) bool {
			return cats[i]["name"].(string) < cats[j]["name"].(string)
		})
		json.NewEncoder(w).Encode(cats)
	})

	http.HandleFunc("/api/analyze", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "POST only", 405)
			return
		}
		var req struct {
			Product     string `json:"product"`
			Category    string `json:"category"`
			Cost        int    `json:"cost"`
			Marketplace string `json:"marketplace"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", 400)
			return
		}
		if req.Product == "" || req.Category == "" || req.Cost <= 0 || req.Marketplace == "" {
			http.Error(w, "product, category, cost, marketplace required", 400)
			return
		}

		result := analyzePrice(req.Product, req.Category, req.Marketplace, req.Cost)

		// Save to history
		entry := HistoryEntry{
			Product:     req.Product,
			Category:    req.Category,
			Cost:        req.Cost,
			Marketplace: req.Marketplace,
			Recommended: result.RecommendedPrice,
			Timestamp:   fmt.Sprintf("%d", os.Getpid()), // simplified
		}
		history := loadHistory()
		history = append(history, entry)
		if len(history) > 100 {
			history = history[len(history)-100:]
		}
		saveHistory(history)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})

	http.HandleFunc("/api/history", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(loadHistory())
	})

	http.HandleFunc("/api/marketplaces", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		mktps := make([]map[string]interface{}, 0)
		for key, fees := range marketplaceFees {
			total := (fees.Commission + fees.PlatformFee + fees.PaymentFee) * 100
			mktps = append(mktps, map[string]interface{}{
				"key":        key,
				"name":       strings.Title(key),
				"total_fee":  math.Round(total*10) / 10,
				"commission": fees.Commission * 100,
			})
		}
		sort.Slice(mktps, func(i, j int) bool {
			return mktps[i]["name"].(string) < mktps[j]["name"].(string)
		})
		json.NewEncoder(w).Encode(mktps)
	})

	// Serve static files
	http.Handle("/", http.FileServer(http.Dir("public")))

	fmt.Printf("Price Optimizer running at http://localhost:%d\n", PORT)
	http.ListenAndServe(fmt.Sprintf(":%d", PORT), nil)
}