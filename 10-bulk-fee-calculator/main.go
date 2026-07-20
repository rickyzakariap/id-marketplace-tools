package main

import (
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"
	"sync"

	"bulk-fee-calculator/internal/csvhandler"
	"bulk-fee-calculator/internal/marketplace"
)

const version = "1.0.0"

func main() {
	input := flag.String("i", "", "Input CSV file path (required)")
	output := flag.String("o", "", "Output CSV file path (optional)")
	mp := flag.String("m", "all", "Marketplace name or 'all' for comparison")
	showVersion := flag.Bool("v", false, "Show version")
	listMP := flag.Bool("list", false, "List supported marketplaces")
	flag.Parse()

	if *showVersion {
		fmt.Printf("bulk-fee-calculator v%s\n", version)
		os.Exit(0)
	}

	if *listMP {
		fmt.Println("Supported marketplaces:")
		for _, m := range marketplace.All() {
			fmt.Printf("  - %s (commission: %.1f%%, admin: Rp%.0f)\n",
				m.Name, m.CommissionRate, m.AdminFee)
		}
		os.Exit(0)
	}

	if *input == "" {
		fmt.Fprintln(os.Stderr, "Error: input file is required. Use -h for help.")
		os.Exit(1)
	}

	products, err := csvhandler.Parse(*input)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Loaded %d products from %s\n\n", len(products), *input)

	var marketplaces []marketplace.Marketplace
	if strings.ToLower(*mp) == "all" {
		marketplaces = marketplace.All()
	} else {
		m, found := marketplace.ByName(*mp)
		if !found {
			fmt.Fprintf(os.Stderr, "Error: marketplace %q not found. Use -list to see options.\n", *mp)
			os.Exit(1)
		}
		marketplaces = []marketplace.Marketplace{m}
	}

	// Parallel calculation using goroutines
	type result struct {
		breakdown marketplace.FeeBreakdown
		index     int
	}

	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		results []marketplace.FeeBreakdown
		idx     int
	)

	for _, product := range products {
		for _, mp := range marketplaces {
			wg.Add(1)
			go func(p csvhandler.Product, m marketplace.Marketplace, i int) {
				defer wg.Done()
				r := marketplace.Calculate(m, p.Name, p.Price)
				mu.Lock()
				results = append(results, r)
				idx++
				mu.Unlock()
			}(product, mp, idx)
		}
	}

	wg.Wait()

	// Sort by product name then marketplace
	sort.Slice(results, func(i, j int) bool {
		if results[i].ProductName != results[j].ProductName {
			return results[i].ProductName < results[j].ProductName
		}
		return results[i].Marketplace < results[j].Marketplace
	})

	// Print table
	printTable(results, len(marketplaces) > 1)

	// Write output if requested
	if *output != "" {
		if err := csvhandler.WriteResults(*output, results); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing output: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("\nResults saved to %s\n", *output)
	}
}

func printTable(results []marketplace.FeeBreakdown, showMarketplace bool) {
	if showMarketplace {
		fmt.Printf("%-25s %12s %-12s %12s %12s %12s %12s %12s %8s\n",
			"Product", "Price", "Marketplace", "Commission", "Admin", "Payment", "Total", "Net", "Margin%")
		fmt.Println(strings.Repeat("-", 127))
	} else {
		fmt.Printf("%-25s %12s %12s %12s %12s %12s %12s %8s\n",
			"Product", "Price", "Commission", "Admin", "Payment", "Total", "Net", "Margin%")
		fmt.Println(strings.Repeat("-", 113))
	}

	var lastProduct string
	for _, r := range results {
		if showMarketplace && r.ProductName != lastProduct && lastProduct != "" {
			fmt.Println()
		}
		lastProduct = r.ProductName

		if showMarketplace {
			fmt.Printf("%-25s %12.0f %-12s %12.0f %12.0f %12.0f %12.0f %12.0f %7.2f%%\n",
				truncate(r.ProductName, 25), r.Price, r.Marketplace,
				r.Commission, r.AdminFee, r.PaymentFee, r.TotalFees, r.NetProfit, r.ProfitMargin)
		} else {
			fmt.Printf("%-25s %12.0f %12.0f %12.0f %12.0f %12.0f %12.0f %7.2f%%\n",
				truncate(r.ProductName, 25), r.Price,
				r.Commission, r.AdminFee, r.PaymentFee, r.TotalFees, r.NetProfit, r.ProfitMargin)
		}
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-2] + ".."
}
