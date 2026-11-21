package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

const defaultMethods = "Transfer bank:0:0;COD:0:0;PayLater 3 bulan:2.5:0;" +
	"PayLater 6 bulan:4.5:0;PayLater 12 bulan:7.5:0;Kartu kredit:3:10000;" +
	"Cicilan 18 bulan:15:0;Cicilan 24 bulan:25:0"

func main() {
	config, format, err := parseFlags(os.Args[1:])
	if err != nil {
		if errors.Is(err, flag.ErrHelp) {
			printUsage(os.Stdout)
			return
		}
		fmt.Fprintf(os.Stderr, "error: %v\n\n", err)
		printUsage(os.Stderr)
		os.Exit(2)
	}

	report, err := Analyze(config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(2)
	}

	switch format {
	case "json":
		err = WriteJSON(os.Stdout, report)
	case "csv":
		err = WriteCSV(os.Stdout, report)
	default:
		err = WriteText(os.Stdout, report)
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: gagal menulis output: %v\n", err)
		os.Exit(1)
	}
}

func parseFlags(args []string) (Config, string, error) {
	set := flag.NewFlagSet("kalkulator-biaya-cicilan", flag.ContinueOnError)
	set.SetOutput(io.Discard)

	price := set.Int64("harga", 150000, "harga jual per pesanan dalam rupiah")
	cost := set.Int64("hpp", 100000, "harga pokok penjualan per pesanan dalam rupiah")
	commission := set.Float64("komisi", 8, "komisi marketplace dalam persen")
	fixedFee := set.Int64("biaya-tetap", 1250, "biaya tetap marketplace per pesanan")
	packaging := set.Int64("kemasan", 2000, "biaya kemasan per pesanan")
	target := set.Float64("target-margin", 10, "target margin bersih dalam persen")
	orders := set.Int("pesanan-bulanan", 100, "jumlah pesanan per bulan untuk proyeksi")
	methodsRaw := set.String("metode", defaultMethods,
		"daftar metode dengan format nama:rate:cap, dipisah titik koma")
	jsonOutput := set.Bool("json", false, "keluarkan hasil sebagai JSON")
	csvOutput := set.Bool("csv", false, "keluarkan hasil sebagai CSV")

	if err := set.Parse(args); err != nil {
		return Config{}, "", err
	}
	if *jsonOutput && *csvOutput {
		return Config{}, "", errors.New("pilih salah satu: -json atau -csv")
	}
	if set.NArg() > 0 {
		return Config{}, "", fmt.Errorf("argumen tidak dikenal: %s", strings.Join(set.Args(), " "))
	}

	methods, err := ParseMethods(*methodsRaw)
	if err != nil {
		return Config{}, "", err
	}

	format := "text"
	if *jsonOutput {
		format = "json"
	}
	if *csvOutput {
		format = "csv"
	}

	return Config{
		Price:           *price,
		Cost:            *cost,
		CommissionPct:   *commission,
		FixedFee:        *fixedFee,
		Packaging:       *packaging,
		TargetMarginPct: *target,
		MonthlyOrders:   *orders,
		Methods:         methods,
	}, format, nil
}

func printUsage(w io.Writer) {
	fmt.Fprintln(w, "Kalkulator Biaya Cicilan")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Hitung biaya cicilan dan paylater yang ditanggung seller untuk setiap metode")
	fmt.Fprintln(w, "pembayaran, lengkap dengan profit, margin, dan harga minimum.")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Pemakaian:")
	fmt.Fprintln(w, "  go run . [flag]")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Flag:")
	fmt.Fprintln(w, "  -harga int           harga jual per pesanan (default 150000)")
	fmt.Fprintln(w, "  -hpp int             harga pokok penjualan per pesanan (default 100000)")
	fmt.Fprintln(w, "  -komisi float        komisi marketplace dalam persen (default 8)")
	fmt.Fprintln(w, "  -biaya-tetap int     biaya tetap marketplace per pesanan (default 1250)")
	fmt.Fprintln(w, "  -kemasan int         biaya kemasan per pesanan (default 2000)")
	fmt.Fprintln(w, "  -target-margin float target margin bersih dalam persen (default 10)")
	fmt.Fprintln(w, "  -pesanan-bulanan int jumlah pesanan per bulan (default 100)")
	fmt.Fprintln(w, "  -metode string       daftar nama:rate:cap, dipisah titik koma")
	fmt.Fprintln(w, "  -json                keluarkan hasil sebagai JSON")
	fmt.Fprintln(w, "  -csv                 keluarkan hasil sebagai CSV")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Contoh:")
	fmt.Fprintln(w, "  go run . -harga 150000 -hpp 100000 -komisi 8")
	fmt.Fprintln(w, "  go run . -metode \"Transfer bank:0:0;PayLater 12 bulan:7.5:0\" -json")
	fmt.Fprintln(w, "  go run . -csv > biaya-cicilan.csv")
}
