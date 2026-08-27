// Kanal Sendiri vs Marketplace - bandingkan profit jualan di marketplace
// vs kanal sendiri (WhatsApp, IG, website, toko offline).
// Go 1.26, net/http, embed HTML, zero dependencies.
//
// Latar (fakta terverifikasi dari pemberitaan):
// - The Conversation (4 Agu 2026): "Brand ramai-ramai keluar dari marketplace:
//   apakah jualan di kanal sendiri bisa lebih untung?" - pertanyaan ini belum
//   ada tool yang menjawab dengan angka.
// - Katadata (20 Mei 2026): "Untung Makin Tipis, Seller Online Terimpit Biaya
//   Berlapis di Marketplace" - komisi + biaya layanan + ongkir + iklan.
// - kontan.co.id (9 Mei 2026): "Tekanan Biaya E-Commerce 2026, Seller Mulai
//   Cari Kanal Penjualan Alternatif".
// - UKMINDONESIA.ID (22 Mei 2026): "Biaya Admin Marketplace Naik? Ini Cara
//   UMKM Mulai Jualan Mandiri".
// - Tarif gateway pembayaran: pola Midtrans/Xendit (2,9% + Rp 2.000 per
//   transaksi), angka umum industri 2026.
// Tarif komisi marketplace adalah nilai default yang bisa diedit user, karena
// tarif berubah per kategori dan per periode.

package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed public
var publicFS embed.FS

const PORT = "8033"

type Marketplace struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Commission  float64 `json:"commission"`   // % potongan per transaksi (default)
	ServiceFee  float64 `json:"service_fee"`  // % biaya layanan
	Note        string  `json:"note"`
}

var marketplaces = []Marketplace{
	{ID: "shopee", Name: "Shopee", Commission: 5.0, ServiceFee: 2.0, Note: "Komisi 1-10% per kategori (grup A-X 2026), biaya layanan 1-2%."},
	{ID: "tiktok", Name: "TikTok Shop", Commission: 6.0, ServiceFee: 2.0, Note: "Komisi dinamis 0,5-7,5% + cap per item (18 Mei 2026), biaya layanan 2%."},
	{ID: "tokopedia", Name: "Tokopedia", Commission: 4.0, ServiceFee: 1.0, Note: "Komisi 2-6,5% per kategori, biaya layanan 1%."},
	{ID: "lazada", Name: "Lazada", Commission: 3.0, ServiceFee: 1.0, Note: "Komisi 1-4%, biaya layanan 1%."},
	{ID: "blibli", Name: "Blibli", Commission: 2.5, ServiceFee: 1.0, Note: "Komisi 1,5-3%, biaya layanan 1%."},
	{ID: "bukalapak", Name: "Bukalapak", Commission: 1.5, ServiceFee: 1.0, Note: "Komisi 0,5-3%, biaya layanan 1%."},
}

type CompareRequest struct {
	Price         float64 `json:"price"`
	HPP           float64 `json:"hpp"`
	MonthlyUnits  float64 `json:"monthly_units"`
	MarketplaceID string  `json:"marketplace_id"`
	Commission    float64 `json:"commission"`
	ServiceFee    float64 `json:"service_fee"`
	AdsSpend      float64 `json:"ads_spend"`
	OngkirUnit    float64 `json:"ongkir_unit"` // ongkir ditanggung seller per unit
	// Kanal sendiri
	OwnUnitsPct   float64 `json:"own_units_pct"`   // % pembeli marketplace yang realistis pindah ke kanal sendiri
	OwnAdsBudget  float64 `json:"own_ads_budget"`  // Rp/bulan untuk iklan kanal sendiri
	GatewayPct    float64 `json:"gateway_pct"`     // % fee payment gateway
	GatewayFixed  float64 `json:"gateway_fixed"`   // Rp per transaksi
	OwnOngkirUnit float64 `json:"own_ongkir_unit"` // ongkir per unit kanal sendiri
}

type CompareResponse struct {
	Marketplace MarketplaceResult `json:"marketplace"`
	OwnChannel  OwnResult         `json:"own_channel"`
	BreakEven   float64           `json:"break_even_units"`
	BreakEvenPct float64          `json:"break_even_pct"`
	Verdict     string            `json:"verdict"`
	VerdictNote string            `json:"verdict_note"`
}

type MarketplaceResult struct {
	Revenue     float64 `json:"revenue"`
	HPP         float64 `json:"hpp"`
	Commission  float64 `json:"commission"`
	ServiceFee  float64 `json:"service_fee"`
	Ads         float64 `json:"ads"`
	Ongkir      float64 `json:"ongkir"`
	Profit      float64 `json:"profit"`
	MarginPct   float64 `json:"margin_pct"`
}

type OwnResult struct {
	Revenue    float64 `json:"revenue"`
	Units      float64 `json:"units"`
	HPP        float64 `json:"hpp"`
	Gateway    float64 `json:"gateway"`
	Ads        float64 `json:"ads"`
	Ongkir     float64 `json:"ongkir"`
	Profit     float64 `json:"profit"`
	MarginPct  float64 `json:"margin_pct"`
}

func round2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100
}

func handleCompare(w http.ResponseWriter, r *http.Request) {
	var req CompareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Data tidak valid"}`, 400)
		return
	}
	if req.Price <= 0 || req.HPP < 0 || req.MonthlyUnits <= 0 {
		http.Error(w, `{"error":"Harga jual dan jumlah penjualan harus lebih dari 0"}`, 400)
		return
	}
	if req.Commission < 0 || req.ServiceFee < 0 || req.GatewayPct < 0 {
		http.Error(w, `{"error":"Persentase tidak boleh negatif"}`, 400)
		return
	}
	if req.GatewayPct == 0 {
		req.GatewayPct = 2.9
	}
	if req.GatewayFixed == 0 {
		req.GatewayFixed = 2000
	}
	if req.OwnUnitsPct <= 0 {
		req.OwnUnitsPct = 20
	}

	// Marketplace channel
	mp := MarketplaceResult{
		Revenue:    req.Price * req.MonthlyUnits,
		HPP:        req.HPP * req.MonthlyUnits,
		Commission: req.Price * req.MonthlyUnits * req.Commission / 100,
		ServiceFee: req.Price * req.MonthlyUnits * req.ServiceFee / 100,
		Ads:        req.AdsSpend,
		Ongkir:     req.OngkirUnit * req.MonthlyUnits,
	}
	mp.Profit = mp.Revenue - mp.HPP - mp.Commission - mp.ServiceFee - mp.Ads - mp.Ongkir
	if mp.Revenue > 0 {
		mp.MarginPct = mp.Profit / mp.Revenue * 100
	}

	// Own channel
	ownUnits := req.MonthlyUnits * req.OwnUnitsPct / 100
	own := OwnResult{
		Revenue: req.Price * ownUnits,
		Units:   ownUnits,
		HPP:     req.HPP * ownUnits,
		Gateway: req.Price*ownUnits*req.GatewayPct/100 + req.GatewayFixed*ownUnits,
		Ads:     req.OwnAdsBudget,
		Ongkir:  req.OwnOngkirUnit * ownUnits,
	}
	own.Profit = own.Revenue - own.HPP - own.Gateway - own.Ads - own.Ongkir
	if own.Revenue > 0 {
		own.MarginPct = own.Profit / own.Revenue * 100
	}

	// Break-even: berapa unit di kanal sendiri agar profit = profit marketplace.
	// profit_own(u) = u*(harga - hpp - harga*gateway% - gateway_fixed - ongkir) - ads
	// samakan dengan profit marketplace, cari u.
	perUnit := req.Price - req.HPP - req.Price*req.GatewayPct/100 - req.GatewayFixed - req.OwnOngkirUnit
	var breakEven float64
	if perUnit > 0 {
		breakEven = (mp.Profit + own.Ads) / perUnit
		if breakEven < 0 {
			breakEven = 0
		}
	}
	breakEvenPct := 0.0
	if req.MonthlyUnits > 0 {
		breakEvenPct = breakEven / req.MonthlyUnits * 100
	}

	// Verdict
	verdict := ""
	note := ""
	switch {
	case mp.Profit <= 0 && own.Profit <= 0:
		verdict = "keduanya-rugi"
		note = "Marketplace dan kanal sendiri sama-sama rugi pada asumsi ini. Masalahnya bukan pilihan kanal, tapi margin produk: harga jual terlalu rendah, modal terlalu tinggi, atau biaya (iklan, ongkir, komisi) makan semua margin. Naikkan harga atau cari produk dengan margin lebih besar dulu."
	case mp.Profit <= 0 && own.Profit > 0:
		verdict = "kanal-sendiri"
		note = "Marketplace malah rugi (biaya berlapis makan margin), kanal sendiri untung. Pertimbangkan pindah bertahap sambil tetap jaga rating toko."
	case own.Profit > mp.Profit:
		verdict = "kanal-sendiri"
		note = fmt.Sprintf("Profit kanal sendiri lebih tinggi %.0f%% dari marketplace pada asumsi %g%% volume pindah. Cek dulu apakah angka itu realistis: butuh %g unit/bulan di kanal sendiri untuk menyamai profit marketplace (%.0f%% dari volume sekarang).", own.Profit/mp.Profit*100-100, req.OwnUnitsPct, round2(breakEven), round2(breakEvenPct))
	case own.Profit <= 0:
		verdict = "marketplace"
		note = "Kanal sendiri belum untung pada asumsi ini (biaya iklan + gateway masih lebih besar dari margin). Tetap di marketplace dulu, atau naikkan harga/volume kanal sendiri."
	default:
		verdict = "marketplace"
		note = fmt.Sprintf("Marketplace masih lebih untung. Trafik marketplace gratis, kanal sendiri harus bayar iklan. Butuh %g unit/bulan di kanal sendiri (%.0f%% dari volume sekarang) untuk menyamai profit marketplace.", round2(breakEven), round2(breakEvenPct))
	}

	res := CompareResponse{
		Marketplace:  mp,
		OwnChannel:   own,
		BreakEven:    round2(breakEven),
		BreakEvenPct: round2(breakEvenPct),
		Verdict:      verdict,
		VerdictNote:  note,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleMeta(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"marketplaces":   marketplaces,
		"gateway_pct":    2.9,
		"gateway_fixed":  2000,
		"sources": []string{
			"The Conversation (4 Agu 2026): Brand ramai-ramai keluar dari marketplace, apakah jualan di kanal sendiri bisa lebih untung?",
			"Katadata (20 Mei 2026): Untung Makin Tipis, Seller Online Terimpit Biaya Berlapis di Marketplace",
			"kontan.co.id (9 Mei 2026): Tekanan Biaya E-Commerce 2026, Seller Mulai Cari Kanal Penjualan Alternatif",
			"UKMINDONESIA.ID (22 Mei 2026): Biaya Admin Marketplace Naik? Ini Cara UMKM Mulai Jualan Mandiri",
			"Pola fee gateway Midtrans/Xendit: 2,9% + Rp 2.000 per transaksi (angka umum industri)",
		},
	})
}

func main() {
	sub, _ := fs.Sub(publicFS, "public")
	http.Handle("/", http.FileServer(http.FS(sub)))
	http.HandleFunc("/api/meta", handleMeta)
	http.HandleFunc("/api/compare", handleCompare)

	log.Println("Kanal Sendiri vs Marketplace running on http://localhost:" + PORT)
	log.Fatal(http.ListenAndServe(":"+PORT, nil))
}
