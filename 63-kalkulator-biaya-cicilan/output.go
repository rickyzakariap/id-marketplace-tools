package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"text/tabwriter"
)

// WriteText prints the human readable report.
func WriteText(w io.Writer, report Report) error {
	config := report.Config
	if _, err := fmt.Fprintln(w, "Kalkulator Biaya Cicilan"); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(w, "=========================="); err != nil {
		return err
	}

	lines := []struct {
		label string
		value string
	}{
		{"Harga jual", FormatRupiah(config.Price)},
		{"HPP", FormatRupiah(config.Cost)},
		{"Komisi marketplace", FormatPercent(config.CommissionPct)},
		{"Biaya tetap", FormatRupiah(config.FixedFee)},
		{"Kemasan", FormatRupiah(config.Packaging)},
		{"Target margin", FormatPercent(config.TargetMarginPct)},
		{"Pesanan per bulan", strconv.Itoa(config.MonthlyOrders)},
	}
	for _, line := range lines {
		if _, err := fmt.Fprintf(w, "%-22s: %s\n", line.label, line.value); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintln(w); err != nil {
		return err
	}
	table := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	if _, err := fmt.Fprintln(table,
		"Metode\tCicilan\tPotongan\tProfit\tMargin\tStatus\tHarga min\tCicilan/bln"); err != nil {
		return err
	}
	for _, result := range report.Results {
		required := "tidak tercapai"
		if result.RequiredAchievable {
			required = FormatRupiah(result.RequiredPrice)
		}
		if _, err := fmt.Fprintf(table, "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n",
			result.Method.Name,
			FormatRupiah(result.InstallmentFee),
			FormatRupiah(result.PlatformDeduction),
			FormatRupiah(result.Profit),
			FormatPercent(result.MarginPct),
			result.Status,
			required,
			FormatRupiah(result.MonthlyFee),
		); err != nil {
			return err
		}
	}
	if err := table.Flush(); err != nil {
		return err
	}

	best := report.Results[0]
	var loss, thin []string
	for _, result := range report.Results {
		if result.Method.Name == report.BestMethod {
			best = result
		}
		switch result.Status {
		case StatusLoss:
			loss = append(loss, result.Method.Name)
		case StatusThin:
			thin = append(thin, result.Method.Name)
		}
	}

	if _, err := fmt.Fprintln(w); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "Metode paling untung: %s (%s per pesanan).\n",
		report.BestMethod, FormatRupiah(best.Profit)); err != nil {
		return err
	}
	if len(loss) > 0 {
		if _, err := fmt.Fprintf(w, "Metode rugi: %s.\n", strings.Join(loss, ", ")); err != nil {
			return err
		}
	}
	if len(thin) > 0 {
		if _, err := fmt.Fprintf(w, "Metode di bawah target: %s.\n", strings.Join(thin, ", ")); err != nil {
			return err
		}
	}

	room := report.Results[0].MaxFeeRoom
	if room >= 0 {
		roomRate := float64(room) / float64(config.Price) * 100
		if roomRate > 100 {
			roomRate = 100
		}
		if _, err := fmt.Fprintf(w,
			"Batas biaya cicilan agar target %s tercapai: %s per pesanan (%s dari harga).\n",
			FormatPercent(config.TargetMarginPct), FormatRupiah(room), FormatPercent(roomRate)); err != nil {
			return err
		}
	} else {
		if _, err := fmt.Fprintf(w,
			"Tidak ada ruang biaya cicilan: profit saat ini sudah di bawah target %s.\n",
			FormatPercent(config.TargetMarginPct)); err != nil {
			return err
		}
	}

	if config.MonthlyOrders == 0 {
		if _, err := fmt.Fprintln(w, "Proyeksi bulanan dimatikan karena pesanan bulanan 0."); err != nil {
			return err
		}
		return nil
	}

	worst := report.Results[0]
	for _, result := range report.Results[1:] {
		if result.MonthlyExtra > worst.MonthlyExtra {
			worst = result
		}
	}
	if worst.MonthlyExtra > 0 {
		if _, err := fmt.Fprintf(w,
			"Jika semua %d pesanan/bulan memakai %s, biaya cicilan %s/bulan, "+
				"yaitu %s lebih tinggi dari metode tanpa cicilan.\n",
			config.MonthlyOrders, worst.Method.Name, FormatRupiah(worst.MonthlyFee),
			FormatRupiah(worst.MonthlyExtra)); err != nil {
			return err
		}
	} else {
		if _, err := fmt.Fprintln(w,
			"Semua metode memiliki biaya cicilan yang sama pada harga ini."); err != nil {
			return err
		}
	}
	return nil
}

// WriteJSON prints the report as indented JSON.
func WriteJSON(w io.Writer, report Report) error {
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	return encoder.Encode(report)
}

// WriteCSV prints one row per payment method for spreadsheets.
func WriteCSV(w io.Writer, report Report) error {
	writer := csv.NewWriter(w)
	header := []string{
		"metode",
		"rate_persen",
		"cap_rupiah",
		"biaya_cicilan",
		"potongan_platform",
		"profit",
		"margin_persen",
		"status",
		"harga_minimum",
		"biaya_cicilan_bulanan",
		"biaya_tambahan_bulanan",
	}
	if err := writer.Write(header); err != nil {
		return err
	}

	for _, result := range report.Results {
		required := ""
		if result.RequiredAchievable {
			required = strconv.FormatInt(result.RequiredPrice, 10)
		}
		row := []string{
			result.Method.Name,
			strconv.FormatFloat(result.Method.RatePct, 'f', 2, 64),
			strconv.FormatInt(result.Method.Cap, 10),
			strconv.FormatInt(result.InstallmentFee, 10),
			strconv.FormatInt(result.PlatformDeduction, 10),
			strconv.FormatInt(result.Profit, 10),
			strconv.FormatFloat(result.MarginPct, 'f', 2, 64),
			result.Status,
			required,
			strconv.FormatInt(result.MonthlyFee, 10),
			strconv.FormatInt(result.MonthlyExtra, 10),
		}
		if err := writer.Write(row); err != nil {
			return err
		}
	}
	writer.Flush()
	return writer.Error()
}
