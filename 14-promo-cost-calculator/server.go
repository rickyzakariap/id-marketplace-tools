package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
)

type CalcRequest struct {
	OriginalPrice   float64 `json:"originalPrice"`
	Cost            float64 `json:"cost"`
	Marketplace     string  `json:"marketplace"`
	PromoType       string  `json:"promoType"`
	PromoValue      float64 `json:"promoValue"`
	ShippingCost    float64 `json:"shippingCost"`
	ExtraSalesPct   float64 `json:"extraSalesPct"`
}

type FeeBreakdown struct {
	Commission      float64 `json:"commission"`
	PlatformFee     float64 `json:"platformFee"`
	PaymentFee      float64 `json:"paymentFee"`
	ShippingSubsidy float64 `json:"shippingSubsidy"`
	TotalFees       float64 `json:"totalFees"`
}

type CalcResult struct {
	DiscountedPrice    float64     `json:"discountedPrice"`
	DiscountAmount     float64     `json:"discountAmount"`
	OriginalProfit     float64     `json:"originalProfit"`
	PromoProfit        float64     `json:"promoProfit"`
	ProfitDifference   float64     `json:"profitDifference"`
	OriginalFees       FeeBreakdown `json:"originalFees"`
	PromoFees          FeeBreakdown `json:"promoFees"`
	BreakEvenUnits     int         `json:"breakEvenUnits"`
	ROI                float64     `json:"roi"`
	IsProfitable       bool        `json:"isProfitable"`
	MaxDiscountPct     float64     `json:"maxDiscountPct"`
	OriginalPrice      float64     `json:"originalPrice"`
	Cost               float64     `json:"cost"`
	Marketplace        string      `json:"marketplace"`
	PromoType          string      `json:"promoType"`
	PromoValue         float64     `json:"promoValue"`
	ShippingCost       float64     `json:"shippingCost"`
}

type CompareRequest struct {
	OriginalPrice float64 `json:"originalPrice"`
	Cost          float64 `json:"cost"`
	PromoType     string  `json:"promoType"`
	PromoValue    float64 `json:"promoValue"`
	ShippingCost  float64 `json:"shippingCost"`
	ExtraSalesPct float64 `json:"extraSalesPct"`
}

type CompareResult struct {
	Marketplace string      `json:"marketplace"`
	Result      CalcResult  `json:"result"`
}

// Marketplace fee structures (2026 estimates)
type MarketFees struct {
	CommissionRate float64
	PlatformRate   float64
	PaymentRate    float64
}

var marketplaces = map[string]MarketFees{
	"Shopee":       {CommissionRate: 0.05, PlatformRate: 0.02, PaymentRate: 0.02},
	"Tokopedia":    {CommissionRate: 0.04, PlatformRate: 0.015, PaymentRate: 0.02},
	"Lazada":       {CommissionRate: 0.03, PlatformRate: 0.015, PaymentRate: 0.02},
	"TikTok Shop":  {CommissionRate: 0.04, PlatformRate: 0.01, PaymentRate: 0.02},
	"Bukalapak":    {CommissionRate: 0.02, PlatformRate: 0.01, PaymentRate: 0.015},
	"Blibli":       {CommissionRate: 0.03, PlatformRate: 0.01, PaymentRate: 0.02},
}

func calcFees(sellingPrice, shippingCost float64, mf MarketFees, freeShipping bool) FeeBreakdown {
	commission := sellingPrice * mf.CommissionRate
	platformFee := sellingPrice * mf.PlatformRate
	paymentFee := sellingPrice * mf.PaymentRate
	var shippingSubsidy float64
	if freeShipping && shippingCost > 0 {
		shippingSubsidy = shippingCost * 0.5
	}
	return FeeBreakdown{
		Commission:      round2(commission),
		PlatformFee:     round2(platformFee),
		PaymentFee:      round2(paymentFee),
		ShippingSubsidy: round2(shippingSubsidy),
		TotalFees:       round2(commission + platformFee + paymentFee + shippingSubsidy),
	}
}

func calcDiscountedPrice(original float64, promoType string, promoValue float64) float64 {
	switch promoType {
	case "percent":
		return round2(original * (1 - promoValue/100))
	case "fixed":
		disc := math.Min(promoValue, original)
		return round2(original - disc)
	case "freeship":
		return original
	case "flash":
		return round2(original * (1 - promoValue/100))
	case "voucher":
		disc := math.Min(promoValue, original)
		return round2(original - disc)
	default:
		return original
	}
}

func calculate(req CalcRequest) CalcResult {
	mf := marketplaces[req.Marketplace]
	if mf == (MarketFees{}) {
		mf = marketplaces["Shopee"]
	}

	origFees := calcFees(req.OriginalPrice, req.ShippingCost, mf, false)
	origProfit := req.OriginalPrice - req.Cost - origFees.TotalFees

	discPrice := calcDiscountedPrice(req.OriginalPrice, req.PromoType, req.PromoValue)
	discAmount := req.OriginalPrice - discPrice

	freeShip := req.PromoType == "freeship"
	promoFees := calcFees(discPrice, req.ShippingCost, mf, freeShip)
	promoProfit := discPrice - req.Cost - promoFees.TotalFees

	profitDiff := promoProfit - origProfit

	// Break-even: how many extra units at promo price needed to cover per-unit loss
	breakEven := 0
	if profitDiff < 0 {
		// If selling at normal price gives profit X, and promo gives loss Y per unit
		// We need: normalUnits * X + extraUnits * promoProfit >= (normalUnits + extraUnits) * X
		// => extraUnits * promoProfit >= extraUnits * X
		// Actually: we need extra sales to compensate for the per-unit loss
		// Each normal unit loses |profitDiff| in profit
		// If each extra unit at promo price earns promoProfit, we need:
		// extraUnits * promoProfit >= normalUnits * |profitDiff|
		// But we don't know normalUnits, so we express as: 1 extra unit must earn enough
		// to cover the loss on 1 unit: promoProfit per extra unit
		// Simplified: how many promo-priced units to equal the profit of 1 normal-priced unit
		if promoProfit > 0 {
			breakEven = int(math.Ceil(-profitDiff / promoProfit))
		} else {
			breakEven = -1 // not possible - each promo unit also loses money
		}
	}

	// ROI: if extra sales happen, what's the return
	extraSalesPct := req.ExtraSalesPct / 100
	// Assume 100 normal units for comparison
	normalProfit := 100.0 * origProfit
	extraUnits := 100.0 * extraSalesPct
	totalUnits := 100.0 + extraUnits
	promoRevenue := totalUnits * discPrice
	totalCost := totalUnits * req.Cost
	totalFees := totalUnits * promoFees.TotalFees
	promoNetProfit := promoRevenue - totalCost - totalFees
	roi := 0.0
	if normalProfit > 0 {
		roi = ((promoNetProfit - normalProfit) / normalProfit) * 100
	}

	// Max discount before losing money
	maxDisc := 0.0
	totalFeeRate := mf.CommissionRate + mf.PlatformRate + mf.PaymentRate
	// sellingPrice - cost - sellingPrice * totalFeeRate = 0
	// sellingPrice * (1 - totalFeeRate) = cost
	// sellingPrice = cost / (1 - totalFeeRate)
	if totalFeeRate < 1 {
		maxSellingPrice := req.Cost / (1 - totalFeeRate)
		if freeShip {
			maxSellingPrice = (req.Cost + req.ShippingCost*0.5) / (1 - totalFeeRate)
		}
		if maxSellingPrice < req.OriginalPrice {
			maxDisc = ((req.OriginalPrice - maxSellingPrice) / req.OriginalPrice) * 100
		}
	}

	return CalcResult{
		DiscountedPrice:  discPrice,
		DiscountAmount:   discAmount,
		OriginalProfit:   round2(origProfit),
		PromoProfit:      round2(promoProfit),
		ProfitDifference: round2(profitDiff),
		OriginalFees:     origFees,
		PromoFees:        promoFees,
		BreakEvenUnits:   breakEven,
		ROI:              round2(roi),
		IsProfitable:     promoProfit > 0,
		MaxDiscountPct:   round2(maxDisc),
		OriginalPrice:    req.OriginalPrice,
		Cost:             req.Cost,
		Marketplace:      req.Marketplace,
		PromoType:        req.PromoType,
		PromoValue:       req.PromoValue,
		ShippingCost:     req.ShippingCost,
	}
}

func handleCalc(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, `{"error":"POST only"}`, http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var req CalcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.OriginalPrice <= 0 || req.Cost < 0 {
		http.Error(w, `{"error":"price must be positive, cost must be non-negative"}`, http.StatusBadRequest)
		return
	}
	if req.PromoValue < 0 {
		http.Error(w, `{"error":"promo value must be non-negative"}`, http.StatusBadRequest)
		return
	}
	result := calculate(req)
	json.NewEncoder(w).Encode(result)
}

func handleCompare(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, `{"error":"POST only"}`, http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var req CompareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	var results []CompareResult
	for name := range marketplaces {
		cr := CalcRequest{
			OriginalPrice: req.OriginalPrice,
			Cost:          req.Cost,
			Marketplace:   name,
			PromoType:     req.PromoType,
			PromoValue:    req.PromoValue,
			ShippingCost:  req.ShippingCost,
			ExtraSalesPct: req.ExtraSalesPct,
		}
		results = append(results, CompareResult{
			Marketplace: name,
			Result:      calculate(cr),
		})
	}

	// Sort by promo profit descending (simple bubble sort for 6 items)
	for i := 0; i < len(results); i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].Result.PromoProfit > results[i].Result.PromoProfit {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	json.NewEncoder(w).Encode(results)
}

func handleMarketplaces(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	type mpInfo struct {
		Name            string  `json:"name"`
		CommissionRate  float64 `json:"commissionRate"`
		PlatformRate    float64 `json:"platformRate"`
		PaymentRate     float64 `json:"paymentRate"`
		TotalFeeRate    float64 `json:"totalFeeRate"`
	}
	var list []mpInfo
	for name, mf := range marketplaces {
		list = append(list, mpInfo{
			Name:           name,
			CommissionRate: mf.CommissionRate,
			PlatformRate:   mf.PlatformRate,
			PaymentRate:    mf.PaymentRate,
			TotalFeeRate:   mf.CommissionRate + mf.PlatformRate + mf.PaymentRate,
		})
	}
	json.NewEncoder(w).Encode(list)
}

func round2(f float64) float64 {
	return math.Round(f*100) / 100
}

func fmtRp(f float64) string {
	// Format as Indonesian Rupiah
	neg := f < 0
	if neg {
		f = -f
	}
	s := fmt.Sprintf("%.0f", f)
	// Add thousand separators
	n := len(s)
	if n > 3 {
		var result []byte
		for i, c := range s {
			if i > 0 && (n-i)%3 == 0 {
				result = append(result, '.')
			}
			result = append(result, byte(c))
		}
		s = string(result)
	}
	if neg {
		return "-Rp " + s
	}
	return "Rp " + s
}

func main() {
	http.HandleFunc("/api/calculate", handleCalc)
	http.HandleFunc("/api/compare", handleCompare)
	http.HandleFunc("/api/marketplaces", handleMarketplaces)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, indexHTML)
	})

	port := "3510"
	log.Printf("Promo Cost Calculator running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
