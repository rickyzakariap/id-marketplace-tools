package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const PORT = "8025"

const (
	RATE_PPH22        = 0.005 // 0.5% dari peredaran bruto
	THRESHOLD_OMZET   = 500_000_000.0
	DATE_ACTIVE       = "2026-08-01" // pemungutan mulai
	DATE_STOPPED      = "2026-08-06" // pemungutan dihentikan
	DATE_REFUND_START = "2026-08-14"
	DATE_REFUND_END   = "2026-09-30"
	DATE_RESTART      = "2026-11-01" // berlaku kembali
)

type Platform struct {
	Name        string `json:"name"`
	StopDate    string `json:"stop_date"`
	RefundInfo  string `json:"refund_info"`
	RefundBy    string `json:"refund_by"`
	CheckWhere  string `json:"check_where"`
	Status      string `json:"status"` // refund-berjalan | refund-maks | menunggu-djp | belum-ada
	StatusLabel string `json:"status_label"`
}

var PLATFORMS = []Platform{
	{
		Name:        "Shopee",
		StopDate:    "6 Agustus 2026, 00.00 WIB",
		RefundInfo:  "Refund otomatis bertahap 14 Agustus - 30 September 2026",
		RefundBy:    "30 September 2026",
		CheckWhere:  "Seller Centre > Saldo Saya, filter tipe transaksi 'Penyesuaian'. App: Saya > Saldo Penjual > Transaksi.",
		Status:      "refund-berjalan",
		StatusLabel: "Refund berjalan (14 Agu - 30 Sep)",
	},
	{
		Name:        "Tokopedia",
		StopDate:    "6 Agustus 2026, 17.00 WIB",
		RefundInfo:  "Refund otomatis, paling lambat 30 September 2026",
		RefundBy:    "30 September 2026",
		CheckWhere:  "Cek melalui akun penjual atau riwayat transaksi. Tidak perlu mengajukan apa pun.",
		Status:      "refund-maks",
		StatusLabel: "Refund maksimal 30 Sep",
	},
	{
		Name:        "Blibli",
		StopDate:    "6 Agustus 2026, 00.00 WIB",
		RefundInfo:  "Menunggu ketentuan resmi DJP untuk mekanisme pengembalian. Adjustment seller terdampak kendala sistem diproses maksimal akhir Agustus 2026",
		RefundBy:    "Menunggu ketentuan DJP",
		CheckWhere:  "Pantau pengumuman resmi Blibli Seller Center dan akun seller.",
		Status:      "menunggu-djp",
		StatusLabel: "Menunggu ketentuan DJP",
	},
	{
		Name:        "Lazada",
		StopDate:    "6 Agustus 2026",
		RefundInfo:  "Belum ada pengumuman resmi jadwal pengembalian per 10 Agustus 2026",
		RefundBy:    "Belum diumumkan",
		CheckWhere:  "Pantau pengumuman resmi Lazada Seller Center.",
		Status:      "belum-ada",
		StatusLabel: "Belum ada jadwal resmi",
	},
}

type StatusResponse struct {
	Phase       string `json:"phase"`
	Label       string `json:"label"`
	Description string `json:"description"`
	NextKeyDate string `json:"next_key_date"`
	NextKeyDesc string `json:"next_key_desc"`
	DaysToNext  int    `json:"days_to_next"`
	// refund window progress (hanya terisi saat phase=refund)
	RefundStart string  `json:"refund_start,omitempty"`
	RefundEnd   string  `json:"refund_end,omitempty"`
	RefundPct   float64 `json:"refund_pct,omitempty"`
	RefundLeft  int     `json:"refund_left,omitempty"`
	RefundTotal int     `json:"refund_total,omitempty"`
}

type EstimateRequest struct {
	Platform    string  `json:"platform"`     // shopee | tokopedia | blibli | lazada
	SalesAmount float64 `json:"sales_amount"` // omzet penjualan 1-5 Agustus di platform tsb
	AnnualOmzet float64 `json:"annual_omzet"` // omzet setahun (estimasi)
}

type EstimateResponse struct {
	SalesAmount       float64 `json:"sales_amount"`
	Withheld          float64 `json:"withheld"`            // 0.5% x sales
	ExpectedRefund    float64 `json:"expected_refund"`     // = withheld (dikembalikan semua)
	Eligibility       string  `json:"eligibility"`         // exempt | kena
	EligibilityLabel  string  `json:"eligibility_label"`
	EligibilityDetail string  `json:"eligibility_detail"`
	PlatformName      string  `json:"platform_name"`
	RefundBy          string  `json:"refund_by"`
	CheckWhere        string  `json:"check_where"`
	NextStep          string  `json:"next_step"`
}

func parseDate(s string) time.Time {
	t, _ := time.ParseInLocation("2006-01-02", s, time.Local)
	return t
}

func daysBetween(from, to time.Time) int {
	return int(to.Sub(from).Hours() / 24)
}

func todayOnly(now time.Time) time.Time {
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
}

func getStatus(now time.Time) StatusResponse {
	today := todayOnly(now)
	active := parseDate(DATE_ACTIVE)
	stopped := parseDate(DATE_STOPPED)
	refundStart := parseDate(DATE_REFUND_START)
	refundEnd := parseDate(DATE_REFUND_END)
	restart := parseDate(DATE_RESTART)

	switch {
	case today.Before(active):
		return StatusResponse{
			Phase: "belum", Label: "Belum berlaku",
			Description: "Pemungutan PPh 22 marketplace belum mulai. Berlaku mulai 1 Agustus 2026.",
			NextKeyDate: DATE_ACTIVE, NextKeyDesc: "Pemungutan dimulai",
			DaysToNext: daysBetween(today, active),
		}
	case today.Before(stopped):
		return StatusResponse{
			Phase: "pungut", Label: "Pemungutan berjalan",
			Description: "4 marketplace (Shopee, Tokopedia, Lazada, Blibli) memungut PPh 22 sebesar 0,5% dari peredaran bruto penjual.",
			NextKeyDate: DATE_STOPPED, NextKeyDesc: "Pemungutan dihentikan",
			DaysToNext: daysBetween(today, stopped),
		}
	case today.Before(refundStart):
		return StatusResponse{
			Phase: "stop-gap", Label: "Pemungutan dihentikan",
			Description: "Pemerintah menunda pemungutan. Marketplace sudah berhenti memotong, refund dana yang terlanjur dipotong dimulai 14 Agustus 2026.",
			NextKeyDate: DATE_REFUND_START, NextKeyDesc: "Refund dimulai",
			DaysToNext: daysBetween(today, refundStart),
		}
	case today.Before(refundEnd.AddDate(0, 0, 1)):
		total := daysBetween(refundStart, refundEnd)
		elapsed := daysBetween(refundStart, today)
		if elapsed < 0 {
			elapsed = 0
		}
		pct := float64(elapsed) / float64(total) * 100
		return StatusResponse{
			Phase: "refund", Label: "Masa refund berjalan",
			Description: "Dana PPh 22 yang dipotong 1-5 Agustus dikembalikan otomatis ke saldo seller. Tidak perlu mengajukan apa pun, cek saldo secara berkala.",
			NextKeyDate: DATE_REFUND_END, NextKeyDesc: "Batas akhir refund",
			DaysToNext:  daysBetween(today, refundEnd),
			RefundStart: DATE_REFUND_START, RefundEnd: DATE_REFUND_END,
			RefundPct: pct, RefundLeft: daysBetween(today, refundEnd), RefundTotal: total,
		}
	case today.Before(restart):
		return StatusResponse{
			Phase: "refund-done", Label: "Masa refund selesai",
			Description: "Batas akhir refund 30 September 2026 sudah lewat. Belum terima dana? Hubungi dukungan platform masing-masing. Pemungutan berlaku kembali 1 November 2026.",
			NextKeyDate: DATE_RESTART, NextKeyDesc: "Pemungutan berlaku kembali",
			DaysToNext:  daysBetween(today, restart),
		}
	default:
		return StatusResponse{
			Phase: "restart", Label: "Pemungutan berlaku kembali",
			Description: "Pemungutan PPh 22 aktif lagi per 1 November 2026. Marketplace memotong 0,5% dari peredaran bruto penjual. Catatan: jadwal bisa berubah, Menkeu membuka opsi perpanjangan dan idEA mengusulkan mundur ke Januari 2027.",
			NextKeyDate: "", NextKeyDesc: "", DaysToNext: 0,
		}
	}
}

func estimate(req EstimateRequest) EstimateResponse {
	resp := EstimateResponse{
		SalesAmount:    req.SalesAmount,
		Withheld:       req.SalesAmount * RATE_PPH22,
		ExpectedRefund: req.SalesAmount * RATE_PPH22,
	}
	// cari platform
	for _, p := range PLATFORMS {
		if p.Name == req.Platform {
			resp.PlatformName = p.Name
			resp.RefundBy = p.RefundBy
			resp.CheckWhere = p.CheckWhere
			break
		}
	}
	if req.AnnualOmzet < THRESHOLD_OMZET {
		resp.Eligibility = "exempt"
		resp.EligibilityLabel = "Di bawah Rp 500 juta (tidak kena)"
		resp.EligibilityDetail = "Omzet tahunan di bawah Rp 500 juta, seharusnya tidak dipungut PPh 22. Kalau sempat terpotong, dana tetap dikembalikan otomatis. Untuk jaga-jaga saat pemungutan lanjut 1 November, siapkan surat pernyataan omzet di bawah Rp 500 juta."
		resp.NextStep = "Kalau sudah terpotong, dana otomatis dikembalikan. Siapkan surat pernyataan agar tidak dipotong lagi saat pemungutan lanjut."
	} else {
		resp.Eligibility = "kena"
		resp.EligibilityLabel = "Di atas Rp 500 juta (kena pungutan)"
		resp.EligibilityDetail = "Omzet tahunan di atas Rp 500 juta, terkena pungutan PPh 22 0,5%. Karena ada penundaan, dana yang dipotong 1-5 Agustus tetap dikembalikan otomatis. Mulai 1 November pemungutan berlaku lagi."
		resp.NextStep = "Dana refund otomatis masuk ke saldo. Mulai 1 November, marketplace akan memotong 0,5% lagi dari peredaran bruto."
	}
	return resp
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(data)
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, PAGE_HTML)
	})

	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, getStatus(time.Now()))
	})

	mux.HandleFunc("/api/platforms", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, PLATFORMS)
	})

	mux.HandleFunc("/api/estimate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}
		var req EstimateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, map[string]string{"error": "Invalid JSON"})
			return
		}
		if req.SalesAmount < 0 || req.AnnualOmzet < 0 {
			writeJSON(w, map[string]string{"error": "Nilai tidak boleh negatif"})
			return
		}
		writeJSON(w, estimate(req))
	})

	log.Printf("PPh 22 Refund Tracker running at http://localhost:%s", PORT)
	if err := http.ListenAndServe(":"+PORT, mux); err != nil {
		log.Fatal(err)
	}
}
