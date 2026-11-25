package main

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

const (
	StatusSafe  = "Aman"
	StatusThin  = "Tipis"
	StatusLoss  = "Rugi"
	StatusUnset = "Belum dinilai"

	maxIngredients = 30
	maxAmount      = int64(1_000_000_000_000)
	maxBatch       = 1_000_000
	maxQuantity    = 1_000_000_000.0
)

// Ingredient is one line of a production recipe.
type Ingredient struct {
	Name      string  `json:"name"`
	Quantity  float64 `json:"quantity"`
	Unit      string  `json:"unit"`
	PackPrice int64   `json:"pack_price"`
	PackSize  float64 `json:"pack_size"`
	WastePct  float64 `json:"waste_pct"`
}

// Config holds every input for one batch calculation.
type Config struct {
	Ingredients     []Ingredient `json:"ingredients"`
	BatchYield      int          `json:"batch_yield"`
	LaborCost       int64        `json:"labor_cost"`
	OverheadCost    int64        `json:"overhead_cost"`
	Packaging       int64        `json:"packaging_per_unit"`
	TargetMarginPct float64      `json:"target_margin_pct"`
	CommissionPct   float64      `json:"commission_pct"`
	SellingPrice    int64        `json:"selling_price"`
}

// IngredientResult is the cost of one ingredient in the batch.
type IngredientResult struct {
	Ingredient  Ingredient `json:"ingredient"`
	Cost        int64      `json:"cost"`
	CostPerUnit int64      `json:"cost_per_unit"`
	SharePct    float64    `json:"share_pct"`
}

// Scenario shows how fixed batch costs behave at different yields.
type Scenario struct {
	Label            string  `json:"label"`
	RatioPct         float64 `json:"ratio_pct"`
	Units            int     `json:"units"`
	Material         int64   `json:"material"`
	Labor            int64   `json:"labor"`
	Overhead         int64   `json:"overhead"`
	BatchCost        int64   `json:"batch_cost"`
	UnitProduction   int64   `json:"unit_production_cost"`
	UnitCost         int64   `json:"unit_cost"`
	RecommendedPrice int64   `json:"recommended_price"`
	Profit           int64   `json:"profit"`
	MarginPct        float64 `json:"margin_pct"`
	Status           string  `json:"status"`
}

// Report is the full output for the text, JSON, and CSV writers.
type Report struct {
	Config           Config             `json:"config"`
	Ingredients      []IngredientResult `json:"ingredients"`
	TotalMaterial    int64              `json:"total_material"`
	MaterialPerUnit  int64              `json:"material_per_unit"`
	LaborPerUnit     int64              `json:"labor_per_unit"`
	OverheadPerUnit  int64              `json:"overhead_per_unit"`
	BatchCost        int64              `json:"batch_cost"`
	UnitProduction   int64              `json:"unit_production_cost"`
	UnitPackaging    int64              `json:"unit_packaging"`
	UnitCost         int64              `json:"unit_cost"`
	TopIngredient    string             `json:"top_ingredient"`
	TopIngredientPct float64            `json:"top_ingredient_pct"`
	HasSellingPrice  bool               `json:"has_selling_price"`
	Commission       int64              `json:"commission"`
	Profit           int64              `json:"profit"`
	MarginPct        float64            `json:"margin_pct"`
	Status           string             `json:"status"`
	RecommendedPrice int64              `json:"recommended_price"`
	BreakEvenPrice   int64              `json:"break_even_price"`
	PriceGap         int64              `json:"price_gap"`
	Scenarios        []Scenario         `json:"scenarios"`
}

// ParseIngredients reads a semicolon separated recipe.
// Each entry uses the format name:quantity:unit:pack_price:pack_size:waste.
func ParseIngredients(raw string) ([]Ingredient, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, errors.New("minimal satu bahan")
	}

	parts := strings.Split(raw, ";")
	if len(parts) > maxIngredients {
		return nil, fmt.Errorf("maksimal %d bahan", maxIngredients)
	}

	ingredients := make([]Ingredient, 0, len(parts))
	seen := make(map[string]bool, len(parts))

	for index, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			return nil, fmt.Errorf("bahan ke-%d kosong", index+1)
		}

		fields := strings.Split(part, ":")
		if len(fields) != 6 {
			return nil, fmt.Errorf(
				"bahan %q harus berformat nama:jumlah:satuan:harga:isi:susut", part)
		}

		quantity, err := strconv.ParseFloat(strings.TrimSpace(fields[1]), 64)
		if err != nil {
			return nil, fmt.Errorf("jumlah bahan %q tidak valid: %w",
				strings.TrimSpace(fields[0]), err)
		}
		packPrice, err := strconv.ParseInt(strings.TrimSpace(fields[3]), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("harga kemasan bahan %q tidak valid: %w",
				strings.TrimSpace(fields[0]), err)
		}
		packSize, err := strconv.ParseFloat(strings.TrimSpace(fields[4]), 64)
		if err != nil {
			return nil, fmt.Errorf("isi kemasan bahan %q tidak valid: %w",
				strings.TrimSpace(fields[0]), err)
		}
		waste, err := strconv.ParseFloat(strings.TrimSpace(fields[5]), 64)
		if err != nil {
			return nil, fmt.Errorf("susut bahan %q tidak valid: %w",
				strings.TrimSpace(fields[0]), err)
		}

		ingredient := Ingredient{
			Name:      strings.TrimSpace(fields[0]),
			Quantity:  quantity,
			Unit:      strings.TrimSpace(fields[2]),
			PackPrice: packPrice,
			PackSize:  packSize,
			WastePct:  waste,
		}
		if err := validateIngredient(ingredient, index+1); err != nil {
			return nil, err
		}

		key := strings.ToLower(ingredient.Name)
		if seen[key] {
			return nil, fmt.Errorf("nama bahan %q dobel", ingredient.Name)
		}
		seen[key] = true
		ingredients = append(ingredients, ingredient)
	}

	return ingredients, nil
}

func validateIngredient(ingredient Ingredient, position int) error {
	name := strings.TrimSpace(ingredient.Name)
	if name == "" {
		return fmt.Errorf("nama bahan ke-%d kosong", position)
	}
	if len([]rune(name)) > 60 {
		return fmt.Errorf("nama bahan %q lebih dari 60 karakter", name)
	}
	if !isFinite(ingredient.Quantity) || ingredient.Quantity <= 0 ||
		ingredient.Quantity > maxQuantity {
		return fmt.Errorf("jumlah bahan %q harus antara 0 dan %v", name, maxQuantity)
	}
	unit := strings.TrimSpace(ingredient.Unit)
	if unit == "" {
		return fmt.Errorf("satuan bahan %q kosong", name)
	}
	if len([]rune(unit)) > 12 {
		return fmt.Errorf("satuan bahan %q lebih dari 12 karakter", unit)
	}
	if ingredient.PackPrice <= 0 || ingredient.PackPrice > maxAmount {
		return fmt.Errorf("harga kemasan bahan %q harus antara 1 dan %d rupiah",
			name, maxAmount)
	}
	if !isFinite(ingredient.PackSize) || ingredient.PackSize <= 0 ||
		ingredient.PackSize > maxQuantity {
		return fmt.Errorf("isi kemasan bahan %q harus antara 0 dan %v", name, maxQuantity)
	}
	if !isFinite(ingredient.WastePct) || ingredient.WastePct < 0 ||
		ingredient.WastePct >= 100 {
		return fmt.Errorf("susut bahan %q harus antara 0 dan 100 persen", name)
	}
	return nil
}

// Validate checks every input before any calculation runs.
func (c Config) Validate() error {
	if c.BatchYield <= 0 || c.BatchYield > maxBatch {
		return fmt.Errorf("jumlah unit per batch harus antara 1 dan %d", maxBatch)
	}
	if c.LaborCost < 0 || c.LaborCost > maxAmount {
		return fmt.Errorf("tenaga kerja per batch harus antara 0 dan %d rupiah", maxAmount)
	}
	if c.OverheadCost < 0 || c.OverheadCost > maxAmount {
		return fmt.Errorf("overhead per batch harus antara 0 dan %d rupiah", maxAmount)
	}
	if c.Packaging < 0 || c.Packaging > maxAmount {
		return fmt.Errorf("kemasan per unit harus antara 0 dan %d rupiah", maxAmount)
	}
	if !isFinite(c.TargetMarginPct) || c.TargetMarginPct < 0 || c.TargetMarginPct > 90 {
		return errors.New("target margin harus antara 0 dan 90 persen")
	}
	if !isFinite(c.CommissionPct) || c.CommissionPct < 0 || c.CommissionPct > 50 {
		return errors.New("komisi platform harus antara 0 dan 50 persen")
	}
	if c.TargetMarginPct+c.CommissionPct > 95 {
		return errors.New("target margin ditambah komisi tidak boleh lebih dari 95 persen")
	}
	if c.SellingPrice < 0 || c.SellingPrice > maxAmount {
		return fmt.Errorf("harga jual harus antara 0 dan %d rupiah", maxAmount)
	}
	if len(c.Ingredients) == 0 {
		return errors.New("minimal satu bahan")
	}
	if len(c.Ingredients) > maxIngredients {
		return fmt.Errorf("maksimal %d bahan", maxIngredients)
	}

	seen := make(map[string]bool, len(c.Ingredients))
	for index, ingredient := range c.Ingredients {
		if err := validateIngredient(ingredient, index+1); err != nil {
			return err
		}
		key := strings.ToLower(strings.TrimSpace(ingredient.Name))
		if seen[key] {
			return fmt.Errorf("nama bahan %q dobel", ingredient.Name)
		}
		seen[key] = true
	}
	return nil
}

// Analyze validates the config and calculates the production cost report.
func Analyze(c Config) (Report, error) {
	if err := c.Validate(); err != nil {
		return Report{}, err
	}

	ingredients := make([]IngredientResult, 0, len(c.Ingredients))
	var totalMaterial int64

	for _, ingredient := range c.Ingredients {
		costExact := ingredientCost(ingredient)
		if !isFinite(costExact) || costExact > float64(maxAmount) {
			return Report{}, fmt.Errorf("biaya bahan %q melebihi batas %d rupiah",
				ingredient.Name, maxAmount)
		}
		cost := roundRupiah(costExact)
		totalMaterial += cost
		ingredients = append(ingredients, IngredientResult{
			Ingredient: ingredient,
			Cost:       cost,
		})
	}

	topIndex := 0
	for index := range ingredients {
		item := &ingredients[index]
		if totalMaterial > 0 {
			item.SharePct = float64(item.Cost) / float64(totalMaterial) * 100
		}
		item.CostPerUnit = roundRupiah(float64(item.Cost) / float64(c.BatchYield))
		if item.Cost > ingredients[topIndex].Cost {
			topIndex = index
		}
	}
	topShare := 0.0
	if totalMaterial > 0 {
		topShare = float64(ingredients[topIndex].Cost) / float64(totalMaterial) * 100
	}

	batchCost := totalMaterial + c.LaborCost + c.OverheadCost
	unitProductionExact := float64(batchCost) / float64(c.BatchYield)
	unitCostExact := unitProductionExact + float64(c.Packaging)

	divisor := 1 - (c.TargetMarginPct+c.CommissionPct)/100
	report := Report{
		Config:           c,
		Ingredients:      ingredients,
		TotalMaterial:    totalMaterial,
		MaterialPerUnit:  roundRupiah(float64(totalMaterial) / float64(c.BatchYield)),
		LaborPerUnit:     roundRupiah(float64(c.LaborCost) / float64(c.BatchYield)),
		OverheadPerUnit:  roundRupiah(float64(c.OverheadCost) / float64(c.BatchYield)),
		BatchCost:        batchCost,
		UnitProduction:   roundRupiah(unitProductionExact),
		UnitPackaging:    c.Packaging,
		UnitCost:         roundRupiah(unitCostExact),
		TopIngredient:    ingredients[topIndex].Ingredient.Name,
		TopIngredientPct: topShare,
		RecommendedPrice: roundUpToHundred(unitCostExact / divisor),
		BreakEvenPrice:   roundUpToHundred(unitCostExact / (1 - c.CommissionPct/100)),
	}

	if c.SellingPrice > 0 {
		report.HasSellingPrice = true
		report.Commission = roundRupiah(float64(c.SellingPrice) * c.CommissionPct / 100)
		profitExact := float64(c.SellingPrice) - float64(report.Commission) - unitCostExact
		report.Profit = roundRupiah(profitExact)
		report.MarginPct = profitExact / float64(c.SellingPrice) * 100
		report.Status = statusFor(profitExact, report.MarginPct, c.TargetMarginPct)
		report.PriceGap = report.RecommendedPrice - c.SellingPrice
	} else {
		report.Status = StatusUnset
	}

	report.Scenarios = buildScenarios(c, totalMaterial, divisor)
	return report, nil
}

func ingredientCost(ingredient Ingredient) float64 {
	base := ingredient.Quantity / ingredient.PackSize * float64(ingredient.PackPrice)
	return base * (1 + ingredient.WastePct/100)
}

func statusFor(profitExact, marginPct, targetPct float64) string {
	if profitExact < 0 {
		return StatusLoss
	}
	if marginPct+1e-9 < targetPct {
		return StatusThin
	}
	return StatusSafe
}

func buildScenarios(c Config, totalMaterial int64, divisor float64) []Scenario {
	ratios := []float64{75, 100, 125}
	scenarios := make([]Scenario, 0, len(ratios))

	for _, ratio := range ratios {
		units := int(math.Round(float64(c.BatchYield) * ratio / 100))
		if units < 1 {
			units = 1
		}

		materialExact := float64(totalMaterial) * float64(units) / float64(c.BatchYield)
		material := roundRupiah(materialExact)
		batchCost := material + c.LaborCost + c.OverheadCost
		unitProductionExact := float64(batchCost) / float64(units)
		unitCostExact := unitProductionExact + float64(c.Packaging)

		scenario := Scenario{
			Label:            fmt.Sprintf("%d%% batch", int(ratio)),
			RatioPct:         ratio,
			Units:            units,
			Material:         material,
			Labor:            c.LaborCost,
			Overhead:         c.OverheadCost,
			BatchCost:        batchCost,
			UnitProduction:   roundRupiah(unitProductionExact),
			UnitCost:         roundRupiah(unitCostExact),
			RecommendedPrice: roundUpToHundred(unitCostExact / divisor),
			Status:           StatusUnset,
		}

		if c.SellingPrice > 0 {
			commission := roundRupiah(float64(c.SellingPrice) * c.CommissionPct / 100)
			profitExact := float64(c.SellingPrice) - float64(commission) - unitCostExact
			scenario.Profit = roundRupiah(profitExact)
			scenario.MarginPct = profitExact / float64(c.SellingPrice) * 100
			scenario.Status = statusFor(profitExact, scenario.MarginPct, c.TargetMarginPct)
		}

		scenarios = append(scenarios, scenario)
	}
	return scenarios
}

func roundRupiah(value float64) int64 {
	return int64(math.Round(value))
}

// roundUpToHundred rounds a price up to the nearest Rp 100.
func roundUpToHundred(value float64) int64 {
	if value <= 0 {
		return 0
	}
	return int64(math.Ceil(value/100)) * 100
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
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

// FormatQuantity prints a recipe amount without trailing zeros.
func FormatQuantity(value float64) string {
	text := strconv.FormatFloat(value, 'f', -1, 64)
	return strings.Replace(text, ".", ",", 1)
}
