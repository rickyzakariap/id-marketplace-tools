package marketplace

import "math"

// Marketplace represents a marketplace platform
type Marketplace struct {
	Name           string
	CommissionRate float64 // percentage
	AdminFee       float64 // flat fee in IDR
	PaymentFee     float64 // percentage of total
	ServiceFee     float64 // percentage
}

// FeeBreakdown holds the detailed fee breakdown for a product
type FeeBreakdown struct {
	ProductName    string  `json:"product_name"`
	Price          float64 `json:"price"`
	Marketplace    string  `json:"marketplace"`
	Commission     float64 `json:"commission"`
	AdminFee       float64 `json:"admin_fee"`
	PaymentFee     float64 `json:"payment_fee"`
	ServiceFee     float64 `json:"service_fee"`
	TotalFees      float64 `json:"total_fees"`
	NetProfit      float64 `json:"net_profit"`
	ProfitMargin   float64 `json:"profit_margin"`
}

// All returns all supported marketplaces
func All() []Marketplace {
	return []Marketplace{
		{"Shopee", 5.0, 1000, 2.0, 0, },
		{"Tokopedia", 4.5, 1000, 1.5, 0, },
		{"Bukalapak", 3.5, 500, 0, 0, },
		{"Lazada", 4.0, 1000, 2.0, 0, },
		{"Blibli", 3.0, 500, 1.5, 0, },
		{"TikTok Shop", 4.5, 500, 2.0, 1.0, },
	}
}

// ByName returns a marketplace by name (case-insensitive)
func ByName(name string) (Marketplace, bool) {
	for _, m := range All() {
		if equalFold(m.Name, name) {
			return m, true
		}
	}
	return Marketplace{}, false
}

// Calculate computes fee breakdown for a product on a marketplace
func Calculate(m Marketplace, productName string, price float64) FeeBreakdown {
	commission := math.Round(price * m.CommissionRate / 100)
	paymentFee := math.Round(price * m.PaymentFee / 100)
	serviceFee := math.Round(price * m.ServiceFee / 100)
	totalFees := commission + m.AdminFee + paymentFee + serviceFee
	netProfit := price - totalFees
	margin := 0.0
	if price > 0 {
		margin = math.Round(netProfit/price*10000) / 100
	}

	return FeeBreakdown{
		ProductName:  productName,
		Price:        price,
		Marketplace:  m.Name,
		Commission:   commission,
		AdminFee:     m.AdminFee,
		PaymentFee:   paymentFee,
		ServiceFee:   serviceFee,
		TotalFees:    totalFees,
		NetProfit:    netProfit,
		ProfitMargin: margin,
	}
}

func equalFold(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if ca >= 'A' && ca <= 'Z' {
			ca += 32
		}
		if cb >= 'A' && cb <= 'Z' {
			cb += 32
		}
		if ca != cb {
			return false
		}
	}
	return true
}
