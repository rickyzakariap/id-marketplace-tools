package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"text/tabwriter"
)

// WriteText prints the human readable report.
func WriteText(w io.Writer, report Report) error {
	config := report.Config
	if _, err := fmt.Fprintln(w, "Kalkulator HPP Produksi"); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(w, "======================="); err != nil {
		return err
	}

	sellingPrice := "belum diisi"
	if config.SellingPrice > 0 {
		sellingPrice = FormatRupiah(config.SellingPrice)
	}
	lines := []struct {
		label string
		value string
	}{
		{"Unit per batch", strconv.Itoa(config.BatchYield)},
		{"Tenaga kerja per batch", FormatRupiah(config.LaborCost)},
		{"Overhead per batch", FormatRupiah(config.OverheadCost)},
		{"Kemasan per unit", FormatRupiah(config.Packaging)},
		{"Target margin", FormatPercent(config.TargetMarginPct)},
		{"Komisi platform", FormatPercent(config.CommissionPct)},
		{"Harga jual", sellingPrice},
	}
	for _, line := range lines {
		if _, err := fmt.Fprintf(w, "%-24s: %s\n", line.label, line.value); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintln(w); err != nil {
		return err
	}
	table := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	if _, err := fmt.Fprintln(table,
		"Bahan\tJumlah\tHarga\tIsi\tSusut\tBiaya\tPorsi"); err != nil {
		return err
	}
	for _, item := range report.Ingredients {
		quantity := fmt.Sprintf("%s %s",
			FormatQuantity(item.Ingredient.Quantity), item.Ingredient.Unit)
		packSize := fmt.Sprintf("%s %s",
			FormatQuantity(item.Ingredient.PackSize), item.Ingredient.Unit)
		if _, err := fmt.Fprintf(table, "%s\t%s\t%s\t%s\t%s\t%s\t%s\n",
			item.Ingredient.Name,
			quantity,
			FormatRupiah(item.Ingredient.PackPrice),
			packSize,
			FormatPercent(item.Ingredient.WastePct),
			FormatRupiah(item.Cost),
			FormatPercent(item.SharePct),
		); err != nil {
			return err
		}
	}
	if err := table.Flush(); err != nil {
		return err
	}

	if _, err := fmt.Fprintln(w); err != nil {
		return err
	}
	costLines := []struct {
		label string
		value string
	}{
		{"Total bahan per batch", FormatRupiah(report.TotalMaterial)},
		{"Bahan per unit", FormatRupiah(report.MaterialPerUnit)},
		{"Tenaga kerja per unit", FormatRupiah(report.LaborPerUnit)},
		{"Overhead per unit", FormatRupiah(report.OverheadPerUnit)},
		{"HPP produksi per unit", FormatRupiah(report.UnitProduction)},
		{"Kemasan per unit", FormatRupiah(report.UnitPackaging)},
		{"Total biaya per unit", FormatRupiah(report.UnitCost)},
	}
	for _, line := range costLines {
		if _, err := fmt.Fprintf(w, "%-24s: %s\n", line.label, line.value); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintf(w,
		"%-24s: %s (%s, %s dari total bahan).\n",
		"Bahan terbesar", report.TopIngredient,
		FormatRupiah(report.Ingredients[topIngredientIndex(report)].Cost),
		FormatPercent(report.TopIngredientPct)); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "%-24s: %s\n",
		"Harga rekomendasi", FormatRupiah(report.RecommendedPrice)); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "%-24s: %s\n",
		"Harga balik modal", FormatRupiah(report.BreakEvenPrice)); err != nil {
		return err
	}

	if !report.HasSellingPrice {
		if _, err := fmt.Fprintln(w,
			"Harga jual belum diisi, status margin tidak dinilai."); err != nil {
			return err
		}
	} else {
		if _, err := fmt.Fprintf(w, "Komisi platform         : %s\n",
			FormatRupiah(report.Commission)); err != nil {
			return err
		}
		if _, err := fmt.Fprintf(w, "Profit per unit         : %s\n",
			FormatRupiah(report.Profit)); err != nil {
			return err
		}
		if _, err := fmt.Fprintf(w, "Margin saat ini         : %s (%s)\n",
			FormatPercent(report.MarginPct), report.Status); err != nil {
			return err
		}
		switch {
		case report.PriceGap > 0:
			if _, err := fmt.Fprintf(w,
				"Selisih harga           : %s di bawah rekomendasi\n",
				FormatRupiah(report.PriceGap)); err != nil {
				return err
			}
		case report.PriceGap < 0:
			if _, err := fmt.Fprintf(w,
				"Selisih harga           : %s di atas rekomendasi\n",
				FormatRupiah(-report.PriceGap)); err != nil {
				return err
			}
		default:
			if _, err := fmt.Fprintln(w,
				"Selisih harga           : sudah sama dengan rekomendasi"); err != nil {
				return err
			}
		}
		if report.Status == StatusLoss {
			if _, err := fmt.Fprintln(w,
				"Peringatan: setiap unit yang terjual pada harga ini menghasilkan kerugian."); err != nil {
				return err
			}
		}
	}

	if _, err := fmt.Fprintln(w); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(w, "Skenario rendemen batch:"); err != nil {
		return err
	}
	scenarioTable := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	if _, err := fmt.Fprintln(scenarioTable,
		"Skenario\tUnit\tBahan\tHPP/unit\tTotal/unit\tRekomendasi\tMargin\tStatus"); err != nil {
		return err
	}
	for _, scenario := range report.Scenarios {
		margin := "-"
		if report.HasSellingPrice {
			margin = FormatPercent(scenario.MarginPct)
		}
		if _, err := fmt.Fprintf(scenarioTable, "%s\t%d\t%s\t%s\t%s\t%s\t%s\t%s\n",
			scenario.Label,
			scenario.Units,
			FormatRupiah(scenario.Material),
			FormatRupiah(scenario.UnitProduction),
			FormatRupiah(scenario.UnitCost),
			FormatRupiah(scenario.RecommendedPrice),
			margin,
			scenario.Status,
		); err != nil {
			return err
		}
	}
	return scenarioTable.Flush()
}

func topIngredientIndex(report Report) int {
	for index, item := range report.Ingredients {
		if item.Ingredient.Name == report.TopIngredient {
			return index
		}
	}
	return 0
}

// WriteJSON prints the report as indented JSON.
func WriteJSON(w io.Writer, report Report) error {
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	return encoder.Encode(report)
}

// WriteCSV prints one row per ingredient for spreadsheets.
func WriteCSV(w io.Writer, report Report) error {
	writer := csv.NewWriter(w)
	header := []string{
		"bahan",
		"jumlah",
		"susut_persen",
		"biaya_batch",
		"biaya_per_unit",
		"porsi_persen",
		"satuan",
		"harga_kemasan",
		"isi_kemasan",
	}
	if err := writer.Write(header); err != nil {
		return err
	}

	for _, item := range report.Ingredients {
		row := []string{
			item.Ingredient.Name,
			strconv.FormatFloat(item.Ingredient.Quantity, 'f', -1, 64),
			strconv.FormatFloat(item.Ingredient.WastePct, 'f', 2, 64),
			strconv.FormatInt(item.Cost, 10),
			strconv.FormatInt(item.CostPerUnit, 10),
			strconv.FormatFloat(item.SharePct, 'f', 2, 64),
			item.Ingredient.Unit,
			strconv.FormatInt(item.Ingredient.PackPrice, 10),
			strconv.FormatFloat(item.Ingredient.PackSize, 'f', -1, 64),
		}
		if err := writer.Write(row); err != nil {
			return err
		}
	}
	writer.Flush()
	return writer.Error()
}
