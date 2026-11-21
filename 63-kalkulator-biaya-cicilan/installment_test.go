package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"testing"
)

func baseConfig(methods ...Method) Config {
	if len(methods) == 0 {
		parsed, err := ParseMethods(defaultMethods)
		if err != nil {
			panic(err)
		}
		methods = parsed
	}
	return Config{
		Price:           150000,
		Cost:            100000,
		CommissionPct:   8,
		FixedFee:        1250,
		Packaging:       2000,
		TargetMarginPct: 10,
		MonthlyOrders:   100,
		Methods:         methods,
	}
}

func TestAnalyzeCases(t *testing.T) {
	tests := []struct {
		name         string
		method       Method
		wantFee      int64
		wantProfit   int64
		wantStatus   string
		wantRequired bool
	}{
		{
			name:         "transfer tanpa biaya",
			method:       Method{Name: "Transfer bank", RatePct: 0, Cap: 0},
			wantFee:      0,
			wantProfit:   34750,
			wantStatus:   StatusSafe,
			wantRequired: true,
		},
		{
			name:         "cicilan 2,5 persen",
			method:       Method{Name: "PayLater 3 bulan", RatePct: 2.5, Cap: 0},
			wantFee:      3750,
			wantProfit:   31000,
			wantStatus:   StatusSafe,
			wantRequired: true,
		},
		{
			name:         "cicilan 15 persen di bawah target",
			method:       Method{Name: "Cicilan 18 bulan", RatePct: 15, Cap: 0},
			wantFee:      22500,
			wantProfit:   12250,
			wantStatus:   StatusThin,
			wantRequired: true,
		},
		{
			name:         "cicilan 25 persen rugi",
			method:       Method{Name: "Cicilan 24 bulan", RatePct: 25, Cap: 0},
			wantFee:      37500,
			wantProfit:   -2750,
			wantStatus:   StatusLoss,
			wantRequired: true,
		},
		{
			name:         "cap berlaku",
			method:       Method{Name: "Kartu kredit", RatePct: 20, Cap: 5000},
			wantFee:      5000,
			wantProfit:   29750,
			wantStatus:   StatusSafe,
			wantRequired: true,
		},
		{
			name:         "cap tidak berlaku",
			method:       Method{Name: "Kartu kredit", RatePct: 2, Cap: 5000},
			wantFee:      3000,
			wantProfit:   31750,
			wantStatus:   StatusSafe,
			wantRequired: true,
		},
		{
			name:         "rate tinggi tanpa cap tidak tercapai",
			method:       Method{Name: "Ekstrem", RatePct: 90, Cap: 0},
			wantFee:      135000,
			wantProfit:   -100250,
			wantStatus:   StatusLoss,
			wantRequired: false,
		},
		{
			name:         "rate tinggi dengan cap tercapai",
			method:       Method{Name: "Ekstrem cap", RatePct: 90, Cap: 10000},
			wantFee:      10000,
			wantProfit:   24750,
			wantStatus:   StatusSafe,
			wantRequired: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := baseConfig(test.method)
			report, err := Analyze(config)
			if err != nil {
				t.Fatalf("Analyze() error = %v", err)
			}
			if len(report.Results) != 1 {
				t.Fatalf("got %d results, want 1", len(report.Results))
			}
			got := report.Results[0]
			if got.InstallmentFee != test.wantFee {
				t.Errorf("InstallmentFee = %d, want %d", got.InstallmentFee, test.wantFee)
			}
			if got.Profit != test.wantProfit {
				t.Errorf("Profit = %d, want %d", got.Profit, test.wantProfit)
			}
			if got.Status != test.wantStatus {
				t.Errorf("Status = %q, want %q", got.Status, test.wantStatus)
			}
			if got.RequiredAchievable != test.wantRequired {
				t.Errorf("RequiredAchievable = %v, want %v",
					got.RequiredAchievable, test.wantRequired)
			}
			wantDeduction := got.Commission + got.InstallmentFee + config.FixedFee
			if got.PlatformDeduction != wantDeduction {
				t.Errorf("PlatformDeduction = %d, want %d",
					got.PlatformDeduction, wantDeduction)
			}
		})
	}
}

func TestRequiredPriceIsMinimal(t *testing.T) {
	config := baseConfig()
	for _, method := range config.Methods {
		t.Run(method.Name, func(t *testing.T) {
			result := evaluate(config, method)
			if !result.RequiredAchievable {
				return
			}
			if !meetsTarget(config, method, float64(result.RequiredPrice)) {
				t.Fatalf("harga minimum %d belum mencapai target", result.RequiredPrice)
			}
			if result.RequiredPrice > 0 &&
				meetsTarget(config, method, float64(result.RequiredPrice-1)) {
				t.Fatalf("harga %d sudah mencapai target, minimum tidak minimal",
					result.RequiredPrice-1)
			}
		})
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(*Config)
		wantErr bool
	}{
		{"konfigurasi valid", func(*Config) {}, false},
		{"harga nol", func(c *Config) { c.Price = 0 }, true},
		{"harga negatif", func(c *Config) { c.Price = -1 }, true},
		{"harga terlalu besar", func(c *Config) { c.Price = maxAmount + 1 }, true},
		{"hpp negatif", func(c *Config) { c.Cost = -1 }, true},
		{"komisi negatif", func(c *Config) { c.CommissionPct = -1 }, true},
		{"komisi seratus", func(c *Config) { c.CommissionPct = 100 }, true},
		{"komisi plus target seratus", func(c *Config) {
			c.CommissionPct = 90
			c.TargetMarginPct = 10
		}, true},
		{"target negatif", func(c *Config) { c.TargetMarginPct = -1 }, true},
		{"target seratus", func(c *Config) { c.TargetMarginPct = 100 }, true},
		{"biaya tetap negatif", func(c *Config) { c.FixedFee = -1 }, true},
		{"kemasan negatif", func(c *Config) { c.Packaging = -1 }, true},
		{"pesanan negatif", func(c *Config) { c.MonthlyOrders = -1 }, true},
		{"pesanan terlalu besar", func(c *Config) { c.MonthlyOrders = maxOrders + 1 }, true},
		{"tanpa metode", func(c *Config) { c.Methods = nil }, true},
		{"nama metode kosong", func(c *Config) { c.Methods[0].Name = " " }, true},
		{"rate negatif", func(c *Config) { c.Methods[0].RatePct = -1 }, true},
		{"rate lebih dari seratus", func(c *Config) { c.Methods[0].RatePct = 101 }, true},
		{"cap negatif", func(c *Config) { c.Methods[0].Cap = -1 }, true},
		{"cap terlalu besar", func(c *Config) { c.Methods[0].Cap = maxAmount + 1 }, true},
		{"nama metode terlalu panjang", func(c *Config) {
			c.Methods[0].Name = strings.Repeat("a", 61)
		}, true},
		{"nama metode dobel", func(c *Config) {
			c.Methods = []Method{
				{Name: "COD", RatePct: 0},
				{Name: "cod", RatePct: 0},
			}
		}, true},
		{"terlalu banyak metode", func(c *Config) {
			methods := make([]Method, maxMethods+1)
			for index := range methods {
				methods[index] = Method{Name: fmt.Sprintf("Metode %d", index)}
			}
			c.Methods = methods
		}, true},
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

func TestParseMethods(t *testing.T) {
	tests := []struct {
		name    string
		raw     string
		want    int
		wantErr bool
	}{
		{"dua metode", "Transfer bank:0:0;PayLater 3 bulan:2.5:0", 2, false},
		{"spasi di sekitar field", " Transfer bank : 0 : 0 ; COD : 1.5 : 5000 ", 2, false},
		{"string kosong", "", 0, true},
		{"segmen kosong", "Transfer bank:0:0;;COD:0:0", 0, true},
		{"kolom kurang", "Transfer bank:0", 0, true},
		{"kolom lebih", "PayLater:3:0:0", 0, true},
		{"rate bukan angka", "Transfer bank:abc:0", 0, true},
		{"cap bukan angka", "Transfer bank:0:abc", 0, true},
		{"rate negatif", "Transfer bank:-1:0", 0, true},
		{"rate lebih dari seratus", "Transfer bank:101:0", 0, true},
		{"cap negatif", "Transfer bank:0:-1", 0, true},
		{"nama kosong", ":0:0", 0, true},
		{"nama dobel", "COD:0:0;cod:0:0", 0, true},
		{"nama terlalu panjang", strings.Repeat("a", 61) + ":0:0", 0, true},
		{"cap terlalu besar", "Transfer bank:0:1000000000001", 0, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			methods, err := ParseMethods(test.raw)
			if (err != nil) != test.wantErr {
				t.Fatalf("ParseMethods() error = %v, wantErr %v", err, test.wantErr)
			}
			if !test.wantErr && len(methods) != test.want {
				t.Errorf("got %d methods, want %d", len(methods), test.want)
			}
		})
	}
}

func TestMaxInstallmentRate(t *testing.T) {
	config := baseConfig()
	tests := []struct {
		name     string
		method   Method
		room     int64
		wantRate float64
		wantOK   bool
	}{
		{"tanpa cap", Method{Name: "A"}, 19750, 13.1666667, true},
		{"cap lebih kecil dari ruang", Method{Name: "B", Cap: 5000}, 19750, 100, true},
		{"cap lebih besar dari ruang", Method{Name: "C", Cap: 30000}, 19750, 13.1666667, true},
		{"ruang negatif", Method{Name: "D"}, -1, 0, false},
		{"ruang nol", Method{Name: "E"}, 0, 0, true},
		{"ruang lebih besar dari harga", Method{Name: "F"}, 300000, 100, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rate, ok := maxInstallmentRate(config, test.method, test.room)
			if ok != test.wantOK {
				t.Fatalf("ok = %v, want %v", ok, test.wantOK)
			}
			if math.Abs(rate-test.wantRate) > 0.0001 {
				t.Errorf("rate = %v, want %v", rate, test.wantRate)
			}
		})
	}
}

func TestMonthlyProjection(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	if report.BestMethod != "Transfer bank" {
		t.Errorf("BestMethod = %q, want Transfer bank", report.BestMethod)
	}
	if report.BaselineFee != 0 {
		t.Errorf("BaselineFee = %d, want 0", report.BaselineFee)
	}

	var transfer, extreme MethodResult
	for _, result := range report.Results {
		switch result.Method.Name {
		case "Transfer bank":
			transfer = result
		case "Cicilan 24 bulan":
			extreme = result
		}
	}
	if transfer.MonthlyFee != 0 || transfer.MonthlyExtra != 0 {
		t.Errorf("transfer monthly fee = %d, extra = %d, want 0 and 0",
			transfer.MonthlyFee, transfer.MonthlyExtra)
	}
	if extreme.MonthlyFee != 3750000 {
		t.Errorf("extreme MonthlyFee = %d, want 3750000", extreme.MonthlyFee)
	}
	if extreme.MonthlyExtra != 3750000 {
		t.Errorf("extreme MonthlyExtra = %d, want 3750000", extreme.MonthlyExtra)
	}
}

func TestFormatRupiah(t *testing.T) {
	tests := []struct {
		value int64
		want  string
	}{
		{0, "Rp 0"},
		{1250, "Rp 1.250"},
		{150000, "Rp 150.000"},
		{-2750, "-Rp 2.750"},
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
		{23.1666, "23,17%"},
		{-2.75, "-2,75%"},
	}
	for _, test := range tests {
		if got := FormatPercent(test.value); got != test.want {
			t.Errorf("FormatPercent(%v) = %q, want %q", test.value, got, test.want)
		}
	}
}

func TestOutputs(t *testing.T) {
	report, err := Analyze(baseConfig())
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}

	var text bytes.Buffer
	if err := WriteText(&text, report); err != nil {
		t.Fatalf("WriteText() error = %v", err)
	}
	for _, want := range []string{
		"Kalkulator Biaya Cicilan",
		"Transfer bank",
		"Cicilan 24 bulan",
		"Rugi",
		"Rp 150.000",
	} {
		if !strings.Contains(text.String(), want) {
			t.Errorf("text output missing %q", want)
		}
	}

	var jsonBuffer bytes.Buffer
	if err := WriteJSON(&jsonBuffer, report); err != nil {
		t.Fatalf("WriteJSON() error = %v", err)
	}
	var decoded Report
	if err := json.Unmarshal(jsonBuffer.Bytes(), &decoded); err != nil {
		t.Fatalf("JSON output is invalid: %v", err)
	}
	if len(decoded.Results) != len(report.Results) {
		t.Errorf("JSON results = %d, want %d", len(decoded.Results), len(report.Results))
	}

	var csvBuffer bytes.Buffer
	if err := WriteCSV(&csvBuffer, report); err != nil {
		t.Fatalf("WriteCSV() error = %v", err)
	}
	lines := strings.Split(strings.TrimSpace(csvBuffer.String()), "\n")
	if len(lines) != len(report.Results)+1 {
		t.Errorf("CSV lines = %d, want %d", len(lines), len(report.Results)+1)
	}
	if !strings.HasPrefix(lines[0], "metode,rate_persen,cap_rupiah") {
		t.Errorf("CSV header = %q", lines[0])
	}
}

func TestAnalyzeChoosesBest(t *testing.T) {
	config := baseConfig(
		Method{Name: "Cicilan mahal", RatePct: 25},
		Method{Name: "Transfer bank", RatePct: 0},
	)
	report, err := Analyze(config)
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}
	if report.BestMethod != "Transfer bank" {
		t.Errorf("BestMethod = %q, want Transfer bank", report.BestMethod)
	}
	if report.BaselineFee != 0 {
		t.Errorf("BaselineFee = %d, want 0", report.BaselineFee)
	}
}

func TestWriteTextBranches(t *testing.T) {
	t.Run("tanpa ruang biaya cicilan", func(t *testing.T) {
		config := baseConfig(Method{Name: "Transfer bank", RatePct: 0})
		config.TargetMarginPct = 40
		report, err := Analyze(config)
		if err != nil {
			t.Fatalf("Analyze() error = %v", err)
		}
		var buffer bytes.Buffer
		if err := WriteText(&buffer, report); err != nil {
			t.Fatalf("WriteText() error = %v", err)
		}
		if !strings.Contains(buffer.String(), "Tidak ada ruang biaya cicilan") {
			t.Errorf("text output missing no-room branch")
		}
	})

	t.Run("pesanan bulanan nol", func(t *testing.T) {
		config := baseConfig(Method{Name: "Transfer bank", RatePct: 0})
		config.MonthlyOrders = 0
		report, err := Analyze(config)
		if err != nil {
			t.Fatalf("Analyze() error = %v", err)
		}
		var buffer bytes.Buffer
		if err := WriteText(&buffer, report); err != nil {
			t.Fatalf("WriteText() error = %v", err)
		}
		if !strings.Contains(buffer.String(), "Proyeksi bulanan dimatikan") {
			t.Errorf("text output missing zero-orders branch")
		}
	})

	t.Run("biaya cicilan sama", func(t *testing.T) {
		config := baseConfig(
			Method{Name: "Transfer bank", RatePct: 0},
			Method{Name: "COD", RatePct: 0},
		)
		report, err := Analyze(config)
		if err != nil {
			t.Fatalf("Analyze() error = %v", err)
		}
		var buffer bytes.Buffer
		if err := WriteText(&buffer, report); err != nil {
			t.Fatalf("WriteText() error = %v", err)
		}
		if !strings.Contains(buffer.String(), "Semua metode memiliki biaya cicilan yang sama") {
			t.Errorf("text output missing equal-fee branch")
		}
	})
}

func TestOutputsForUnachievableMethod(t *testing.T) {
	report, err := Analyze(baseConfig(Method{Name: "Ekstrem", RatePct: 90}))
	if err != nil {
		t.Fatalf("Analyze() error = %v", err)
	}

	var text bytes.Buffer
	if err := WriteText(&text, report); err != nil {
		t.Fatalf("WriteText() error = %v", err)
	}
	if !strings.Contains(text.String(), "tidak tercapai") {
		t.Errorf("text output missing unachievable marker")
	}

	var csvBuffer bytes.Buffer
	if err := WriteCSV(&csvBuffer, report); err != nil {
		t.Fatalf("WriteCSV() error = %v", err)
	}
	lines := strings.Split(strings.TrimSpace(csvBuffer.String()), "\n")
	if len(lines) != 2 {
		t.Fatalf("CSV lines = %d, want 2", len(lines))
	}
	fields := strings.Split(lines[1], ",")
	if len(fields) != 11 {
		t.Fatalf("CSV fields = %d, want 11", len(fields))
	}
	if fields[8] != "" {
		t.Errorf("CSV harga_minimum = %q, want empty", fields[8])
	}
}

func TestPrintUsage(t *testing.T) {
	var buffer bytes.Buffer
	printUsage(&buffer)
	for _, want := range []string{
		"Kalkulator Biaya Cicilan",
		"-harga",
		"-metode",
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
		"-harga", "200000",
		"-hpp", "120000",
		"-komisi", "10",
		"-metode", "Transfer bank:0:0;PayLater 6 bulan:4.5:0",
		"-csv",
	})
	if err != nil {
		t.Fatalf("parseFlags() error = %v", err)
	}
	if format != "csv" {
		t.Errorf("format = %q, want csv", format)
	}
	if config.Price != 200000 || config.Cost != 120000 {
		t.Errorf("config price/cost = %d/%d", config.Price, config.Cost)
	}
	if len(config.Methods) != 2 {
		t.Errorf("methods = %d, want 2", len(config.Methods))
	}

	if _, _, err := parseFlags([]string{"-json", "-csv"}); err == nil {
		t.Error("parseFlags() should reject -json with -csv")
	}
	if _, _, err := parseFlags([]string{"-harga", "0"}); err != nil {
		t.Fatalf("parseFlags() should not validate price: %v", err)
	}
	if _, _, err := parseFlags([]string{"argumen"}); err == nil {
		t.Error("parseFlags() should reject positional arguments")
	}
}
