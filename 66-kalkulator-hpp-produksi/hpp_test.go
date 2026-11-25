package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"testing"
)

func baseConfig() Config {
	ingredients, err := ParseIngredients(defaultIngredients)
	if err != nil {
		panic(err)
	}
	return Config{
		Ingredients:     ingredients,
		BatchYield:      20,
		LaborCost:       60000,
		OverheadCost:    25000,
		Packaging:       2500,
		TargetMarginPct: 25,
		CommissionPct:   8,
		SellingPrice:    15000,
	}
}

func TestAnalyzeDefault(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}

	checks := []struct {
		name string
		got  int64
		want int64
	}{
		{"TotalMaterial", report.TotalMaterial, 77806},
		{"MaterialPerUnit", report.MaterialPerUnit, 3890},
		{"LaborPerUnit", report.LaborPerUnit, 3000},
		{"OverheadPerUnit", report.OverheadPerUnit, 1250},
		{"BatchCost", report.BatchCost, 162806},
		{"UnitProduction", report.UnitProduction, 8140},
		{"UnitPackaging", report.UnitPackaging, 2500},
		{"UnitCost", report.UnitCost, 10640},
		{"Commission", report.Commission, 1200},
		{"Profit", report.Profit, 3160},
		{"RecommendedPrice", report.RecommendedPrice, 15900},
		{"BreakEvenPrice", report.BreakEvenPrice, 11600},
		{"PriceGap", report.PriceGap, 900},
	}
	for _, check := range checks {
		if check.got != check.want {
			t.Errorf("%s = %d, want %d", check.name, check.got, check.want)
		}
	}
	if math.Abs(report.MarginPct-21.0647) > 0.0001 {
		t.Errorf("MarginPct = %v, want about 21.0647", report.MarginPct)
	}
	if report.Status != StatusThin {
		t.Errorf("Status = %q, want %q", report.Status, StatusThin)
	}
	if report.TopIngredient != "Cabai merah" {
		t.Errorf("TopIngredient = %q, want Cabai merah", report.TopIngredient)
	}
	if math.Abs(report.TopIngredientPct-60.728) > 0.001 {
		t.Errorf("TopIngredientPct = %v, want about 60.728", report.TopIngredientPct)
	}
	if len(report.Ingredients) != 6 {
		t.Errorf("ingredients = %d, want 6", len(report.Ingredients))
	}
}

func TestAnalyzeCases(t *testing.T) {
	tests := []struct {
		name         string
		mutate       func(*Config)
		wantProfit   int64
		wantMargin   float64
		wantStatus   string
		wantRec      int64
		wantBreak    int64
		wantGap      int64
		wantHasPrice bool
	}{
		{
			name:         "harga di atas rekomendasi",
			mutate:       func(c *Config) { c.SellingPrice = 18000 },
			wantProfit:   5920,
			wantMargin:   32.8872,
			wantStatus:   StatusSafe,
			wantRec:      15900,
			wantBreak:    11600,
			wantGap:      -2100,
			wantHasPrice: true,
		},
		{
			name:         "harga tipis di bawah target",
			mutate:       func(c *Config) { c.SellingPrice = 13000 },
			wantProfit:   1320,
			wantMargin:   10.1515,
			wantStatus:   StatusThin,
			wantRec:      15900,
			wantBreak:    11600,
			wantGap:      2900,
			wantHasPrice: true,
		},
		{
			name:         "harga jual rugi",
			mutate:       func(c *Config) { c.SellingPrice = 10000 },
			wantProfit:   -1440,
			wantMargin:   -14.403,
			wantStatus:   StatusLoss,
			wantRec:      15900,
			wantBreak:    11600,
			wantGap:      5900,
			wantHasPrice: true,
		},
		{
			name:         "tanpa harga jual",
			mutate:       func(c *Config) { c.SellingPrice = 0 },
			wantProfit:   0,
			wantMargin:   0,
			wantStatus:   StatusUnset,
			wantRec:      15900,
			wantBreak:    11600,
			wantGap:      0,
			wantHasPrice: false,
		},
		{
			name: "tanpa tenaga kerja dan overhead",
			mutate: func(c *Config) {
				c.LaborCost = 0
				c.OverheadCost = 0
			},
			wantProfit:   7410,
			wantMargin:   49.398,
			wantStatus:   StatusSafe,
			wantRec:      9600,
			wantBreak:    7000,
			wantGap:      -5400,
			wantHasPrice: true,
		},
		{
			name:         "tanpa komisi platform",
			mutate:       func(c *Config) { c.CommissionPct = 0 },
			wantProfit:   4360,
			wantMargin:   29.0647,
			wantStatus:   StatusSafe,
			wantRec:      14200,
			wantBreak:    10700,
			wantGap:      -800,
			wantHasPrice: true,
		},
		{
			name:         "batch kecil membuat rugi",
			mutate:       func(c *Config) { c.BatchYield = 10 },
			wantProfit:   -4981,
			wantMargin:   -33.204,
			wantStatus:   StatusLoss,
			wantRec:      28100,
			wantBreak:    20500,
			wantGap:      13100,
			wantHasPrice: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := baseConfig()
			test.mutate(&config)
			report, err := Analyze(config)
			if err != nil {
				t.Fatalf("Analyze() error = %v", err)
			}
			if report.Profit != test.wantProfit {
				t.Errorf("Profit = %d, want %d", report.Profit, test.wantProfit)
			}
			if math.Abs(report.MarginPct-test.wantMargin) > 0.01 {
				t.Errorf("MarginPct = %v, want about %v", report.MarginPct, test.wantMargin)
			}
			if report.Status != test.wantStatus {
				t.Errorf("Status = %q, want %q", report.Status, test.wantStatus)
			}
			if report.RecommendedPrice != test.wantRec {
				t.Errorf("RecommendedPrice = %d, want %d",
					report.RecommendedPrice, test.wantRec)
			}
			if report.BreakEvenPrice != test.wantBreak {
				t.Errorf("BreakEvenPrice = %d, want %d",
					report.BreakEvenPrice, test.wantBreak)
			}
			if report.PriceGap != test.wantGap {
				t.Errorf("PriceGap = %d, want %d", report.PriceGap, test.wantGap)
			}
			if report.HasSellingPrice != test.wantHasPrice {
				t.Errorf("HasSellingPrice = %v, want %v",
					report.HasSellingPrice, test.wantHasPrice)
			}
		})
	}
}

func TestRecommendedPriceIsMinimalAtHundredStep(t *testing.T) {
	config := baseConfig()
	report, err := Analyze(config)
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}

	unitCost := float64(report.BatchCost)/float64(config.BatchYield) +
		float64(config.Packaging)
	divisor := 1 - (config.TargetMarginPct+config.CommissionPct)/100

	if float64(report.RecommendedPrice)*divisor < unitCost {
		t.Fatalf("recommended price %d does not cover unit cost", report.RecommendedPrice)
	}
	if report.RecommendedPrice > 100 &&
		float64(report.RecommendedPrice-100)*divisor >= unitCost {
		t.Fatalf("recommended price %d is not the lowest Rp 100 step",
			report.RecommendedPrice)
	}
}

func TestScenarios(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	if len(report.Scenarios) != 3 {
		t.Fatalf("scenarios = %d, want 3", len(report.Scenarios))
	}

	want := []struct {
		ratio     float64
		units     int
		material  int64
		unitProd  int64
		unitCost  int64
		recommend int64
		profit    int64
		margin    float64
		status    string
	}{
		{75, 15, 58355, 9557, 12057, 18000, 1743, 11.62, StatusThin},
		{100, 20, 77806, 8140, 10640, 15900, 3160, 21.0647, StatusThin},
		{125, 25, 97258, 7290, 9790, 14700, 4010, 26.731, StatusSafe},
	}

	for index, expected := range want {
		got := report.Scenarios[index]
		if got.RatioPct != expected.ratio {
			t.Errorf("scenario %d RatioPct = %v, want %v",
				index, got.RatioPct, expected.ratio)
		}
		if got.Units != expected.units {
			t.Errorf("scenario %d Units = %d, want %d",
				index, got.Units, expected.units)
		}
		if got.Material != expected.material {
			t.Errorf("scenario %d Material = %d, want %d",
				index, got.Material, expected.material)
		}
		if got.UnitProduction != expected.unitProd {
			t.Errorf("scenario %d UnitProduction = %d, want %d",
				index, got.UnitProduction, expected.unitProd)
		}
		if got.UnitCost != expected.unitCost {
			t.Errorf("scenario %d UnitCost = %d, want %d",
				index, got.UnitCost, expected.unitCost)
		}
		if got.RecommendedPrice != expected.recommend {
			t.Errorf("scenario %d RecommendedPrice = %d, want %d",
				index, got.RecommendedPrice, expected.recommend)
		}
		if got.Profit != expected.profit {
			t.Errorf("scenario %d Profit = %d, want %d",
				index, got.Profit, expected.profit)
		}
		if math.Abs(got.MarginPct-expected.margin) > 0.01 {
			t.Errorf("scenario %d MarginPct = %v, want about %v",
				index, got.MarginPct, expected.margin)
		}
		if got.Status != expected.status {
			t.Errorf("scenario %d Status = %q, want %q",
				index, got.Status, expected.status)
		}
	}
}

func TestScenariosWithoutSellingPrice(t *testing.T) {
	config := baseConfig()
	config.SellingPrice = 0
	report, err := Analyze(config)
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	for _, scenario := range report.Scenarios {
		if scenario.Status != StatusUnset {
			t.Errorf("%s Status = %q, want %q",
				scenario.Label, scenario.Status, StatusUnset)
		}
		if scenario.MarginPct != 0 || scenario.Profit != 0 {
			t.Errorf("%s margin/profit = %v/%d, want 0/0",
				scenario.Label, scenario.MarginPct, scenario.Profit)
		}
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(*Config)
		wantErr bool
	}{
		{"konfigurasi valid", func(*Config) {}, false},
		{"batch nol", func(c *Config) { c.BatchYield = 0 }, true},
		{"batch negatif", func(c *Config) { c.BatchYield = -1 }, true},
		{"batch terlalu besar", func(c *Config) { c.BatchYield = maxBatch + 1 }, true},
		{"tenaga kerja negatif", func(c *Config) { c.LaborCost = -1 }, true},
		{"tenaga kerja terlalu besar", func(c *Config) { c.LaborCost = maxAmount + 1 }, true},
		{"overhead negatif", func(c *Config) { c.OverheadCost = -1 }, true},
		{"kemasan negatif", func(c *Config) { c.Packaging = -1 }, true},
		{"target negatif", func(c *Config) { c.TargetMarginPct = -1 }, true},
		{"target terlalu besar", func(c *Config) { c.TargetMarginPct = 91 }, true},
		{"target NaN", func(c *Config) { c.TargetMarginPct = math.NaN() }, true},
		{"komisi negatif", func(c *Config) { c.CommissionPct = -1 }, true},
		{"komisi terlalu besar", func(c *Config) { c.CommissionPct = 51 }, true},
		{"komisi NaN", func(c *Config) { c.CommissionPct = math.NaN() }, true},
		{"target plus komisi lebih dari 95", func(c *Config) {
			c.TargetMarginPct = 60
			c.CommissionPct = 40
		}, true},
		{"harga jual negatif", func(c *Config) { c.SellingPrice = -1 }, true},
		{"harga jual terlalu besar", func(c *Config) { c.SellingPrice = maxAmount + 1 }, true},
		{"tanpa bahan", func(c *Config) { c.Ingredients = nil }, true},
		{"terlalu banyak bahan", func(c *Config) {
			ingredients := make([]Ingredient, maxIngredients+1)
			for index := range ingredients {
				ingredients[index] = Ingredient{
					Name:      fmt.Sprintf("Bahan %d", index),
					Quantity:  1,
					Unit:      "g",
					PackPrice: 1000,
					PackSize:  1000,
				}
			}
			c.Ingredients = ingredients
		}, true},
		{"nama bahan kosong", func(c *Config) { c.Ingredients[0].Name = " " }, true},
		{"nama bahan terlalu panjang", func(c *Config) {
			c.Ingredients[0].Name = strings.Repeat("a", 61)
		}, true},
		{"nama bahan dobel", func(c *Config) {
			c.Ingredients[1].Name = strings.ToUpper(c.Ingredients[0].Name)
		}, true},
		{"jumlah nol", func(c *Config) { c.Ingredients[0].Quantity = 0 }, true},
		{"jumlah negatif", func(c *Config) { c.Ingredients[0].Quantity = -1 }, true},
		{"jumlah NaN", func(c *Config) { c.Ingredients[0].Quantity = math.NaN() }, true},
		{"satuan kosong", func(c *Config) { c.Ingredients[0].Unit = " " }, true},
		{"satuan terlalu panjang", func(c *Config) {
			c.Ingredients[0].Unit = strings.Repeat("x", 13)
		}, true},
		{"harga kemasan nol", func(c *Config) { c.Ingredients[0].PackPrice = 0 }, true},
		{"harga kemasan negatif", func(c *Config) { c.Ingredients[0].PackPrice = -1 }, true},
		{"isi kemasan nol", func(c *Config) { c.Ingredients[0].PackSize = 0 }, true},
		{"isi kemasan NaN", func(c *Config) { c.Ingredients[0].PackSize = math.NaN() }, true},
		{"susut negatif", func(c *Config) { c.Ingredients[0].WastePct = -1 }, true},
		{"susut seratus", func(c *Config) { c.Ingredients[0].WastePct = 100 }, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := baseConfig()
			test.mutate(&config)
			err := config.Validate()
			if (err != nil) != test.wantErr {
				t.Fatalf("Validate() error = %v, wantErr %v", err, test.wantErr)
			}
		})
	}
}

func TestParseIngredients(t *testing.T) {
	tests := []struct {
		name    string
		raw     string
		want    int
		wantErr bool
	}{
		{"dua bahan", "Tepung:500:g:12000:1000:2;Gula:200:g:15000:1000:0", 2, false},
		{"spasi di sekitar field", " Tepung : 500 : g : 12000 : 1000 : 2 ", 1, false},
		{"string kosong", "", 0, true},
		{"segmen kosong", "Tepung:500:g:12000:1000:2;;Gula:1:g:1:1:0", 0, true},
		{"kolom kurang", "Tepung:500:g:12000:1000", 0, true},
		{"kolom lebih", "Tepung:500:g:12000:1000:2:extra", 0, true},
		{"jumlah bukan angka", "Tepung:abc:g:12000:1000:2", 0, true},
		{"harga bukan angka", "Tepung:500:g:abc:1000:2", 0, true},
		{"isi bukan angka", "Tepung:500:g:12000:abc:2", 0, true},
		{"susut bukan angka", "Tepung:500:g:12000:1000:abc", 0, true},
		{"jumlah negatif", "Tepung:-1:g:12000:1000:2", 0, true},
		{"harga nol", "Tepung:500:g:0:1000:2", 0, true},
		{"isi nol", "Tepung:500:g:12000:0:2", 0, true},
		{"susut seratus", "Tepung:500:g:12000:1000:100", 0, true},
		{"nama kosong", ":500:g:12000:1000:2", 0, true},
		{"nama dobel", "Tepung:500:g:12000:1000:2;tepung:1:g:1:1:0", 0, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ingredients, err := ParseIngredients(test.raw)
			if (err != nil) != test.wantErr {
				t.Fatalf("ParseIngredients() error = %v, wantErr %v", err, test.wantErr)
			}
			if !test.wantErr && len(ingredients) != test.want {
				t.Errorf("got %d ingredients, want %d", len(ingredients), test.want)
			}
		})
	}
}

func TestParseIngredientsTooMany(t *testing.T) {
	parts := make([]string, 0, maxIngredients+1)
	for index := 0; index <= maxIngredients; index++ {
		parts = append(parts, fmt.Sprintf("Bahan%d:1:g:1000:1000:0", index))
	}
	if _, err := ParseIngredients(strings.Join(parts, ";")); err == nil {
		t.Fatal("ParseIngredients() should reject too many ingredients")
	}
}

func TestAnalyzeRejectsHugeIngredientCost(t *testing.T) {
	config := baseConfig()
	config.Ingredients = []Ingredient{{
		Name:      "Bahan mahal",
		Quantity:  maxQuantity,
		Unit:      "g",
		PackPrice: maxAmount,
		PackSize:  0.001,
		WastePct:  99,
	}}
	if _, err := Analyze(config); err == nil {
		t.Fatal("Analyze() should reject an ingredient cost above the limit")
	}
}

func TestStatusFor(t *testing.T) {
	tests := []struct {
		name   string
		profit float64
		margin float64
		target float64
		want   string
	}{
		{"profit negatif", -1, -1, 25, StatusLoss},
		{"margin sama dengan target", 100, 25, 25, StatusSafe},
		{"margin di atas target", 200, 30, 25, StatusSafe},
		{"margin di bawah target", 100, 24.99, 25, StatusThin},
		{"profit nol", 0, 0, 0, StatusSafe},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := statusFor(test.profit, test.margin, test.target)
			if got != test.want {
				t.Errorf("statusFor() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestFormatRupiah(t *testing.T) {
	tests := []struct {
		value int64
		want  string
	}{
		{0, "Rp 0"},
		{900, "Rp 900"},
		{2500, "Rp 2.500"},
		{77806, "Rp 77.806"},
		{-1440, "-Rp 1.440"},
		{1000000000, "Rp 1.000.000.000"},
	}
	for _, test := range tests {
		if got := FormatRupiah(test.value); got != test.want {
			t.Errorf("FormatRupiah(%d) = %q, want %q", test.value, got, test.want)
		}
	}
}

func TestFormatPercent(t *testing.T) {
	tests := []struct {
		value float64
		want  string
	}{
		{0, "0,00%"},
		{21.0646, "21,06%"},
		{-14.403, "-14,40%"},
		{100, "100,00%"},
	}
	for _, test := range tests {
		if got := FormatPercent(test.value); got != test.want {
			t.Errorf("FormatPercent(%v) = %q, want %q", test.value, got, test.want)
		}
	}
}

func TestFormatQuantity(t *testing.T) {
	tests := []struct {
		value float64
		want  string
	}{
		{1000, "1000"},
		{0.5, "0,5"},
		{2.25, "2,25"},
	}
	for _, test := range tests {
		if got := FormatQuantity(test.value); got != test.want {
			t.Errorf("FormatQuantity(%v) = %q, want %q", test.value, got, test.want)
		}
	}
}

func TestWriteText(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	var buffer bytes.Buffer
	if err := WriteText(&buffer, report); err != nil {
		t.Fatalf("WriteText() error = %v", err)
	}
	text := buffer.String()
	for _, want := range []string{
		"Kalkulator HPP Produksi",
		"Cabai merah",
		"Total biaya per unit",
		"Rp 15.900",
		"Margin saat ini",
		"21,06% (Tipis)",
		"Skenario rendemen batch",
		"125% batch",
	} {
		if !strings.Contains(text, want) {
			t.Errorf("text output missing %q", want)
		}
	}
	if strings.ContainsAny(text, "\u2014\u2013") {
		t.Error("text output must not contain em dash or en dash")
	}
}

func TestWriteTextWithoutPrice(t *testing.T) {
	config := baseConfig()
	config.SellingPrice = 0
	report, err := Analyze(config)
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	var buffer bytes.Buffer
	if err := WriteText(&buffer, report); err != nil {
		t.Fatalf("WriteText() error = %v", err)
	}
	text := buffer.String()
	if !strings.Contains(text, "Harga jual belum diisi") {
		t.Error("text output missing unset-price branch")
	}
	if !strings.Contains(text, "Belum dinilai") {
		t.Error("text output missing unset status")
	}
}

func TestWriteTextEqualGap(t *testing.T) {
	config := baseConfig()
	config.SellingPrice = 15900
	report, err := Analyze(config)
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	var buffer bytes.Buffer
	if err := WriteText(&buffer, report); err != nil {
		t.Fatalf("WriteText() error = %v", err)
	}
	if !strings.Contains(buffer.String(), "sudah sama dengan rekomendasi") {
		t.Error("text output missing equal-gap branch")
	}
}

func TestWriteJSON(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	var buffer bytes.Buffer
	if err := WriteJSON(&buffer, report); err != nil {
		t.Fatalf("WriteJSON() error = %v", err)
	}
	var decoded Report
	if err := json.Unmarshal(buffer.Bytes(), &decoded); err != nil {
		t.Fatalf("JSON output is invalid: %v", err)
	}
	if decoded.TotalMaterial != report.TotalMaterial {
		t.Errorf("JSON TotalMaterial = %d, want %d",
			decoded.TotalMaterial, report.TotalMaterial)
	}
	if len(decoded.Ingredients) != len(report.Ingredients) {
		t.Errorf("JSON ingredients = %d, want %d",
			len(decoded.Ingredients), len(report.Ingredients))
	}
	if len(decoded.Scenarios) != 3 {
		t.Errorf("JSON scenarios = %d, want 3", len(decoded.Scenarios))
	}
}

func TestWriteCSV(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	var buffer bytes.Buffer
	if err := WriteCSV(&buffer, report); err != nil {
		t.Fatalf("WriteCSV() error = %v", err)
	}
	lines := strings.Split(strings.TrimSpace(buffer.String()), "\n")
	if len(lines) != len(report.Ingredients)+1 {
		t.Fatalf("CSV lines = %d, want %d", len(lines), len(report.Ingredients)+1)
	}
	if !strings.HasPrefix(lines[0], "bahan,jumlah,susut_persen,biaya_batch") {
		t.Errorf("CSV header = %q", lines[0])
	}
	fields := strings.Split(lines[1], ",")
	if len(fields) != 9 {
		t.Errorf("CSV fields = %d, want 9", len(fields))
	}
}

func TestPrintUsage(t *testing.T) {
	var buffer bytes.Buffer
	printUsage(&buffer)
	for _, want := range []string{
		"Kalkulator HPP Produksi",
		"-bahan",
		"-batch",
		"-target-margin",
		"-json",
		"-csv",
		"Contoh:",
	} {
		if !strings.Contains(buffer.String(), want) {
			t.Errorf("usage missing %q", want)
		}
	}
}

func TestParseFlags(t *testing.T) {
	config, format, err := parseFlags([]string{
		"-batch", "40",
		"-tenaga-kerja", "100000",
		"-overhead", "30000",
		"-kemasan", "3000",
		"-target-margin", "20",
		"-komisi", "9",
		"-harga-jual", "25000",
		"-bahan", "Tepung:500:g:12000:1000:2;Gula:200:g:15000:1000:0",
		"-json",
	})
	if err != nil {
		t.Fatalf("parseFlags() error = %v", err)
	}
	if format != "json" {
		t.Errorf("format = %q, want json", format)
	}
	if config.BatchYield != 40 || config.LaborCost != 100000 {
		t.Errorf("batch/labor = %d/%d", config.BatchYield, config.LaborCost)
	}
	if config.OverheadCost != 30000 || config.Packaging != 3000 {
		t.Errorf("overhead/packaging = %d/%d", config.OverheadCost, config.Packaging)
	}
	if config.SellingPrice != 25000 {
		t.Errorf("selling price = %d, want 25000", config.SellingPrice)
	}
	if len(config.Ingredients) != 2 {
		t.Errorf("ingredients = %d, want 2", len(config.Ingredients))
	}

	if _, format, err := parseFlags([]string{"-csv"}); err != nil || format != "csv" {
		t.Errorf("parseFlags(-csv) = %q, %v", format, err)
	}
	if _, _, err := parseFlags([]string{"-json", "-csv"}); err == nil {
		t.Error("parseFlags() should reject -json with -csv")
	}
	if _, _, err := parseFlags([]string{"argumen"}); err == nil {
		t.Error("parseFlags() should reject positional arguments")
	}
	if _, _, err := parseFlags([]string{"-bahan", "rusak"}); err == nil {
		t.Error("parseFlags() should reject an invalid ingredient list")
	}
	if _, format, err := parseFlags([]string{"-harga-jual", "0"}); err != nil || format != "text" {
		t.Errorf("parseFlags(-harga-jual 0) = %q, %v", format, err)
	}
}

func TestAnalyzeRejectsInvalidConfig(t *testing.T) {
	config := baseConfig()
	config.BatchYield = 0
	if _, err := Analyze(config); err == nil {
		t.Fatal("Analyze() should reject an invalid config")
	}
}
