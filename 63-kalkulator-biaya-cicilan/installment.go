package main

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

const (
	StatusSafe = "Aman"
	StatusThin = "Tipis"
	StatusLoss = "Rugi"

	maxMethods = 20
	maxAmount  = int64(1_000_000_000_000)
	maxOrders  = 1_000_000
)

// Method is one payment option and the installment fee the seller bears.
type Method struct {
	Name    string  `json:"name"`
	RatePct float64 `json:"rate_pct"`
	Cap     int64   `json:"cap_rupiah"`
}

// Config holds all inputs for one calculation.
type Config struct {
	Price           int64    `json:"price"`
	Cost            int64    `json:"cost"`
	CommissionPct   float64  `json:"commission_pct"`
	FixedFee        int64    `json:"fixed_fee"`
	Packaging       int64    `json:"packaging"`
	TargetMarginPct float64  `json:"target_margin_pct"`
	MonthlyOrders   int      `json:"monthly_orders"`
	Methods         []Method `json:"methods"`
}

// MethodResult is the calculation result for one payment method.
type MethodResult struct {
	Method             Method  `json:"method"`
	Commission         int64   `json:"commission"`
	InstallmentFee     int64   `json:"installment_fee"`
	PlatformDeduction  int64   `json:"platform_deduction"`
	Profit             int64   `json:"profit"`
	MarginPct          float64 `json:"margin_pct"`
	Status             string  `json:"status"`
	RequiredPrice      int64   `json:"required_price"`
	RequiredAchievable bool    `json:"required_achievable"`
	MaxFeeRoom         int64   `json:"max_fee_room"`
	MaxRatePct         float64 `json:"max_rate_pct"`
	MaxRateAchievable  bool    `json:"max_rate_achievable"`
	MonthlyFee         int64   `json:"monthly_fee"`
	MonthlyExtra       int64   `json:"monthly_extra"`
}

// Report is the full output for text, JSON, and CSV writers.
type Report struct {
	Config      Config         `json:"config"`
	Results     []MethodResult `json:"results"`
	BestMethod  string         `json:"best_method"`
	BaselineFee int64          `json:"baseline_fee"`
}

// ParseMethods reads a semicolon separated list of name:rate:cap entries.
func ParseMethods(raw string) ([]Method, error) {
	parts := strings.Split(raw, ";")
	methods := make([]Method, 0, len(parts))
	seen := make(map[string]bool, len(parts))

	for index, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			return nil, fmt.Errorf("metode ke-%d kosong", index+1)
		}
		fields := strings.Split(part, ":")
		if len(fields) != 3 {
			return nil, fmt.Errorf("metode %q harus berformat nama:rate:cap", part)
		}

		name := strings.TrimSpace(fields[0])
		if name == "" {
			return nil, fmt.Errorf("nama metode ke-%d kosong", index+1)
		}
		if len([]rune(name)) > 60 {
			return nil, fmt.Errorf("nama metode %q lebih dari 60 karakter", name)
		}
		key := strings.ToLower(name)
		if seen[key] {
			return nil, fmt.Errorf("nama metode %q dobel", name)
		}
		seen[key] = true

		rate, err := strconv.ParseFloat(strings.TrimSpace(fields[1]), 64)
		if err != nil {
			return nil, fmt.Errorf("rate metode %q tidak valid: %w", name, err)
		}
		capValue, err := strconv.ParseInt(strings.TrimSpace(fields[2]), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("cap metode %q tidak valid: %w", name, err)
		}
		if rate < 0 || rate > 100 {
			return nil, fmt.Errorf("rate metode %q harus di antara 0 dan 100 persen", name)
		}
		if capValue < 0 || capValue > maxAmount {
			return nil, fmt.Errorf("cap metode %q harus di antara 0 dan %d rupiah", name, maxAmount)
		}

		methods = append(methods, Method{Name: name, RatePct: rate, Cap: capValue})
	}

	if len(methods) == 0 {
		return nil, errors.New("minimal satu metode pembayaran")
	}
	if len(methods) > maxMethods {
		return nil, fmt.Errorf("maksimal %d metode pembayaran", maxMethods)
	}
	return methods, nil
}

// Validate checks every input before any calculation runs.
func (c Config) Validate() error {
	if c.Price <= 0 || c.Price > maxAmount {
		return fmt.Errorf("harga jual harus antara 1 dan %d rupiah", maxAmount)
	}
	if c.Cost < 0 || c.Cost > maxAmount {
		return fmt.Errorf("HPP harus antara 0 dan %d rupiah", maxAmount)
	}
	if c.CommissionPct < 0 || c.CommissionPct >= 100 {
		return errors.New("komisi marketplace harus di antara 0 dan 100 persen")
	}
	if c.TargetMarginPct < 0 || c.TargetMarginPct >= 100 {
		return errors.New("target margin harus di antara 0 dan 100 persen")
	}
	if c.CommissionPct+c.TargetMarginPct >= 100 {
		return errors.New("komisi ditambah target margin harus di bawah 100 persen")
	}
	if c.FixedFee < 0 || c.FixedFee > maxAmount {
		return fmt.Errorf("biaya tetap harus antara 0 dan %d rupiah", maxAmount)
	}
	if c.Packaging < 0 || c.Packaging > maxAmount {
		return fmt.Errorf("biaya kemasan harus antara 0 dan %d rupiah", maxAmount)
	}
	if c.MonthlyOrders < 0 || c.MonthlyOrders > maxOrders {
		return fmt.Errorf("pesanan bulanan harus antara 0 dan %d", maxOrders)
	}
	if len(c.Methods) == 0 {
		return errors.New("minimal satu metode pembayaran")
	}
	if len(c.Methods) > maxMethods {
		return fmt.Errorf("maksimal %d metode pembayaran", maxMethods)
	}

	seen := make(map[string]bool, len(c.Methods))
	for _, method := range c.Methods {
		name := strings.TrimSpace(method.Name)
		if name == "" {
			return errors.New("nama metode tidak boleh kosong")
		}
		if len([]rune(name)) > 60 {
			return fmt.Errorf("nama metode %q lebih dari 60 karakter", name)
		}
		key := strings.ToLower(name)
		if seen[key] {
			return fmt.Errorf("nama metode %q dobel", name)
		}
		seen[key] = true
		if method.RatePct < 0 || method.RatePct > 100 {
			return fmt.Errorf("rate metode %q harus di antara 0 dan 100 persen", name)
		}
		if method.Cap < 0 || method.Cap > maxAmount {
			return fmt.Errorf("cap metode %q harus antara 0 dan %d rupiah", name, maxAmount)
		}
	}
	return nil
}

// Analyze validates the config and calculates every payment method.
func Analyze(c Config) (Report, error) {
	if err := c.Validate(); err != nil {
		return Report{}, err
	}

	results := make([]MethodResult, 0, len(c.Methods))
	for _, method := range c.Methods {
		results = append(results, evaluate(c, method))
	}

	baseline := results[0].InstallmentFee
	for _, result := range results[1:] {
		if result.InstallmentFee < baseline {
			baseline = result.InstallmentFee
		}
	}

	for index := range results {
		results[index].MonthlyFee = results[index].InstallmentFee * int64(c.MonthlyOrders)
		extra := results[index].InstallmentFee - baseline
		results[index].MonthlyExtra = extra * int64(c.MonthlyOrders)
	}

	best := results[0]
	for _, result := range results[1:] {
		if result.Profit > best.Profit {
			best = result
		}
	}

	return Report{
		Config:      c,
		Results:     results,
		BestMethod:  best.Method.Name,
		BaselineFee: baseline,
	}, nil
}

func evaluate(c Config, method Method) MethodResult {
	commission := commissionFor(c, float64(c.Price))
	installment := installmentFeeFor(method, float64(c.Price))
	deduction := commission + installment + c.FixedFee
	profit := c.Price - deduction - c.Cost - c.Packaging
	margin := float64(profit) / float64(c.Price) * 100

	status := StatusSafe
	if profit < 0 {
		status = StatusLoss
	} else if margin+1e-9 < c.TargetMarginPct {
		status = StatusThin
	}

	required, requiredOK := requiredPrice(c, method)
	targetProfit := roundRupiah(float64(c.Price) * c.TargetMarginPct / 100)
	room := c.Price - commission - c.FixedFee - c.Cost - c.Packaging - targetProfit
	maxRate, maxRateOK := maxInstallmentRate(c, method, room)

	return MethodResult{
		Method:             method,
		Commission:         commission,
		InstallmentFee:     installment,
		PlatformDeduction:  deduction,
		Profit:             profit,
		MarginPct:          margin,
		Status:             status,
		RequiredPrice:      required,
		RequiredAchievable: requiredOK,
		MaxFeeRoom:         room,
		MaxRatePct:         maxRate,
		MaxRateAchievable:  maxRateOK,
	}
}

func commissionFor(c Config, price float64) int64 {
	return roundRupiah(price * c.CommissionPct / 100)
}

func installmentFeeFor(method Method, price float64) int64 {
	fee := roundRupiah(price * method.RatePct / 100)
	if method.Cap > 0 && fee > method.Cap {
		return method.Cap
	}
	return fee
}

func roundRupiah(value float64) int64 {
	return int64(math.Round(value))
}

// requiredPrice finds the smallest whole rupiah price that reaches the target.
// It uses binary search so a capped installment fee is handled exactly.
func requiredPrice(c Config, method Method) (int64, bool) {
	if method.Cap <= 0 && c.CommissionPct+method.RatePct+c.TargetMarginPct >= 100 {
		return 0, false
	}

	high := 1000.0
	for !meetsTarget(c, method, high) {
		high *= 2
		if high > float64(maxAmount) {
			return 0, false
		}
	}

	low := int64(0)
	highInt := int64(math.Ceil(high))
	for low < highInt {
		middle := low + (highInt-low)/2
		if meetsTarget(c, method, float64(middle)) {
			highInt = middle
		} else {
			low = middle + 1
		}
	}
	return low, true
}

func meetsTarget(c Config, method Method, price float64) bool {
	return profitExcess(c, method, price) >= -1e-9
}

func profitExcess(c Config, method Method, price float64) float64 {
	commission := float64(commissionFor(c, price))
	installment := float64(installmentFeeFor(method, price))
	profit := price - commission - installment - float64(c.FixedFee) -
		float64(c.Cost) - float64(c.Packaging)
	return profit - price*c.TargetMarginPct/100
}

func maxInstallmentRate(c Config, method Method, room int64) (float64, bool) {
	if room < 0 {
		return 0, false
	}
	if method.Cap > 0 && method.Cap <= room {
		return 100, true
	}
	rate := float64(room) / float64(c.Price) * 100
	if rate > 100 {
		rate = 100
	}
	return rate, true
}

// FormatRupiah prints whole rupiah with Indonesian thousand separators.
func FormatRupiah(value int64) string {
	prefix := "Rp "
	if value < 0 {
		prefix = "-Rp "
		value = -value
	}
	digits := strconv.FormatInt(value, 10)
	var builder strings.Builder
	builder.WriteString(prefix)
	for index, digit := range digits {
		if index > 0 && (len(digits)-index)%3 == 0 {
			builder.WriteByte('.')
		}
		builder.WriteRune(digit)
	}
	return builder.String()
}

// FormatPercent prints two decimals with an Indonesian comma.
func FormatPercent(value float64) string {
	text := strconv.FormatFloat(value, 'f', 2, 64)
	return strings.Replace(text, ".", ",", 1) + "%"
}
