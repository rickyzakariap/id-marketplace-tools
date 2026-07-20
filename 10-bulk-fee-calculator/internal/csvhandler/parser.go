package csvhandler

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"

	"bulk-fee-calculator/internal/marketplace"
)

// Product represents a product from CSV input
type Product struct {
	Name  string
	Price float64
}

// Parse reads a CSV file and returns products
// Expected format: name,price
func Parse(path string) ([]Product, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.TrimLeadingSpace = true

	rows, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("cannot parse CSV: %w", err)
	}

	var products []Product
	for i, row := range rows {
		if i == 0 && isHeader(row[0]) {
			continue
		}
		if len(row) < 2 {
			return nil, fmt.Errorf("row %d: expected name,price but got %v", i+1, row)
		}

		name := strings.TrimSpace(row[0])
		price, err := strconv.ParseFloat(strings.TrimSpace(row[1]), 64)
		if err != nil {
			return nil, fmt.Errorf("row %d: invalid price %q: %w", i+1, row[1], err)
		}
		if price <= 0 {
			return nil, fmt.Errorf("row %d: price must be positive, got %.0f", i+1, price)
		}

		products = append(products, Product{Name: name, Price: price})
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("no products found in CSV")
	}

	return products, nil
}

// WriteResults writes fee breakdown results to a CSV file
func WriteResults(path string, results []marketplace.FeeBreakdown) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("cannot create output file: %w", err)
	}
	defer f.Close()

	writer := csv.NewWriter(f)
	defer writer.Flush()

	// Header
	header := []string{
		"Product", "Price", "Marketplace", "Commission", "Admin Fee",
		"Payment Fee", "Service Fee", "Total Fees", "Net Profit", "Margin %",
	}
	if err := writer.Write(header); err != nil {
		return err
	}

	for _, r := range results {
		row := []string{
			r.ProductName,
			fmt.Sprintf("%.0f", r.Price),
			r.Marketplace,
			fmt.Sprintf("%.0f", r.Commission),
			fmt.Sprintf("%.0f", r.AdminFee),
			fmt.Sprintf("%.0f", r.PaymentFee),
			fmt.Sprintf("%.0f", r.ServiceFee),
			fmt.Sprintf("%.0f", r.TotalFees),
			fmt.Sprintf("%.0f", r.NetProfit),
			fmt.Sprintf("%.2f", r.ProfitMargin),
		}
		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}

func isHeader(s string) bool {
	lower := strings.ToLower(strings.TrimSpace(s))
	return lower == "name" || lower == "product" || lower == "product_name" || lower == "nama"
}
