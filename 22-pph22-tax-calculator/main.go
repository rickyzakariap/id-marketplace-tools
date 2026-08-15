package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const PORT = "8022"

const (
	RATE_PPH22        = 0.005 // 0.5% dari peredaran bruto, di luar PPN dan PPnBM
	THRESHOLD_OMZET   = 500_000_000.0
	PPN_RATE          = 0.11
	DATE_ACTIVE       = "2026-08-01" // semula mulai berlaku
	DATE_STOPPED      = "2026-08-06" // pemungutan dihentikan
	DATE_REFUND_START = "2026-08-14"
	DATE_REFUND_END   = "2026-09-30"
	DATE_RESTART      = "2026-11-01" // berlaku kembali
)

var MARKETPLACES = []string{"Shopee", "Tokopedia", "Lazada", "Blibli", "TikTok Shop", "Lainnya"}

type PolicyPhase struct {
	Phase       string `json:"phase"`
	Label       string `json:"label"`
	Description string `json:"description"`
	NextKeyDate string `json:"next_key_date"`
	NextKeyDesc string `json:"next_key_desc"`
	DaysToNext  int    `json:"days_to_next"`
}

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func daysBetween(from, to time.Time) int {
	return int(to.Sub(from).Hours() / 24)
}

func getPolicyPhase(now time.Time) PolicyPhase {
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	active := parseDate(DATE_ACTIVE)
	stopped := parseDate(DATE_STOPPED)
	refundEnd := parseDate(DATE_REFUND_END)
	restart := parseDate(DATE_RESTART)

	switch {
	case today.Before(active):
		return PolicyPhase{
			Phase: "belum", Label: "Belum berlaku",
			Description: "Pemungutan PPh 22 marketplace belum mulai. Berlaku mulai 1 Agustus 2026.",
			NextKeyDate: DATE_ACTIVE, NextKeyDesc: "Pemungutan dimulai",
			DaysToNext: daysBetween(today, active),
		}
	case today.Before(stopped):
		return PolicyPhase{
			Phase: "aktif", Label: "Sedang berjalan",
			Description: "Marketplace memungut PPh 22 sebesar 0,5% dari peredaran bruto penjual.",
			NextKeyDate: DATE_STOPPED, NextKeyDesc: "Pemungutan dihentikan (penundaan)",
			DaysToNext: daysBetween(today, stopped),
		}
	case today.Before(refundEnd.AddDate(0, 0, 1)):
		return PolicyPhase{
			Phase: "refund", Label: "Ditunda, refund berjalan",
			Description: "Pemerintah menunda implementasi. Dana PPh 22 yang sempat dipotong dikembalikan otomatis ke saldo seller sampai 30 September 2026.",
			NextKeyDate: DATE_REFUND_END, NextKeyDesc: "Batas akhir refund dana seller",
			DaysToNext: daysBetween(today, refundEnd),
		}
	case today.Before(restart):
		return PolicyPhase{
			Phase: "ditunda", Label: "Ditunda sementara",
			Description: "Pemungutan PPh 22 dihentikan. Seller tidak perlu membayar, dana yang terlanjur dipotong sudah dikembalikan.",
			NextKeyDate: DATE_RESTART, NextKeyDesc: "Pemungutan berlaku kembali",
			DaysToNext: daysBetween(today, restart),
		}
	default:
		return PolicyPhase{
			Phase: "aktif", Label: "Berlaku kembali",
			Description: "Pemungutan PPh 22 aktif lagi. Marketplace memotong 0,5% dari peredaran bruto penjual.",
			NextKeyDate: "", NextKeyDesc: "",
			DaysToNext: 0,
		}
	}
}

type CalculateRequest struct {
	Omzet          map[string]float64 `json:"omzet"`
	HasDeclaration bool               `json:"has_declaration"`
	PpnIncluded    bool               `json:"ppn_included"`
}

type MarketplaceBreakdown struct {
	Marketplace     string  `json:"marketplace"`
	OmzetMonthly    float64 `json:"omzet_monthly"`
	DppMonthly      float64 `json:"dpp_monthly"`
	WithheldMonthly float64 `json:"withheld_monthly"`
}

type CalculateResponse struct {
	OmzetMonthlyTotal float64                `json:"omzet_monthly_total"`
	OmzetAnnual       float64                `json:"omzet_annual"`
	Status            string                 `json:"status"` // kena | exempt | risk
	StatusLabel       string                 `json:"status_label"`
	StatusDetail      string                 `json:"status_detail"`
	WithheldMonthly   float64                `json:"withheld_monthly"`
	WithheldAnnual    float64                `json:"withheld_annual"`
	Breakdown         []MarketplaceBreakdown `json:"breakdown"`
	Threshold         float64                `json:"threshold"`
	Rate              float64                `json:"rate"`
}

func dppFrom(omzet float64, ppnIncluded bool) float64 {
	if ppnIncluded && omzet > 0 {
		return omzet / (1 + PPN_RATE)
	}
	return omzet
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	var req CalculateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid body"})
		return
	}

	totalMonthly := 0.0
	breakdown := make([]MarketplaceBreakdown, 0, len(MARKETPLACES))
	for _, mp := range MARKETPLACES {
		omzet := req.Omzet[mp]
		if omzet < 0 {
			omzet = 0
		}
		dpp := dppFrom(omzet, req.PpnIncluded)
		withheld := dpp * RATE_PPH22
		totalMonthly += withheld
		breakdown = append(breakdown, MarketplaceBreakdown{
			Marketplace:     mp,
			OmzetMonthly:    omzet,
			DppMonthly:      dpp,
			WithheldMonthly: withheld,
		})
	}

	omzetMonthlyGross := 0.0
	for _, mp := range MARKETPLACES {
		omzetMonthlyGross += req.Omzet[mp]
	}
	omzetAnnual := omzetMonthlyGross * 12

	resp := CalculateResponse{
		OmzetMonthlyTotal: omzetMonthlyGross,
		OmzetAnnual:       omzetAnnual,
		WithheldMonthly:   totalMonthly,
		WithheldAnnual:    totalMonthly * 12,
		Breakdown:         breakdown,
		Threshold:         THRESHOLD_OMZET,
		Rate:              RATE_PPH22,
	}

	switch {
	case omzetAnnual <= THRESHOLD_OMZET && req.HasDeclaration:
		resp.Status = "exempt"
		resp.StatusLabel = "Dikecualikan"
		resp.StatusDetail = fmt.Sprintf("Omzet tahunan Rp%.0f juta (di bawah Rp500 juta) dan surat pernyataan sudah disampaikan. Marketplace tidak memungut PPh 22.", omzetAnnual/1e6)
		// dikecualikan: tidak ada pemotongan sama sekali
		resp.WithheldMonthly = 0
		resp.WithheldAnnual = 0
		for i := range resp.Breakdown {
			resp.Breakdown[i].WithheldMonthly = 0
		}
	case omzetAnnual <= THRESHOLD_OMZET:
		resp.Status = "risk"
		resp.StatusLabel = "Berisiko dipungut"
		resp.StatusDetail = fmt.Sprintf("Omzet tahunan Rp%.0f juta masih di bawah Rp500 juta, tapi surat pernyataan pengecualian belum disampaikan. Tanpa surat itu, marketplace tetap berhak memungut. Sampaikan surat pernyataan ke marketplace.", omzetAnnual/1e6)
	default:
		resp.Status = "kena"
		resp.StatusLabel = "Wajib dipungut"
		resp.StatusDetail = fmt.Sprintf("Omzet tahunan Rp%.0f juta melebihi Rp500 juta (gabungan semua marketplace). Marketplace memotong 0,5%% dari peredaran bruto di luar PPN dan PPnBM.", omzetAnnual/1e6)
	}

	writeJSON(w, 200, resp)
}

func handleTransaction(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Amount      float64 `json:"amount"`
		PpnIncluded bool    `json:"ppn_included"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount < 0 {
		writeJSON(w, 400, map[string]string{"error": "invalid body"})
		return
	}
	dpp := dppFrom(req.Amount, req.PpnIncluded)
	withheld := dpp * RATE_PPH22
	writeJSON(w, 200, map[string]float64{
		"amount":   req.Amount,
		"dpp":      dpp,
		"withheld": withheld,
		"received": req.Amount - withheld,
	})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	phase := getPolicyPhase(time.Now())
	writeJSON(w, 200, phase)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, htmlPage)
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func main() {
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/calculate", handleCalculate)
	http.HandleFunc("/api/transaction", handleTransaction)

	fmt.Printf("PPh 22 Tax Calculator running at http://localhost:%s\n", PORT)
	log.Fatal(http.ListenAndServe(":"+PORT, nil))
}
