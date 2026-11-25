package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

const defaultIngredients = "Cabai merah:1000:g:45000:1000:5;" +
	"Bawang merah:500:g:18000:1000:3;" +
	"Bawang putih:250:g:12000:1000:2;" +
	"Gula merah:300:g:15000:1000:0;" +
	"Minyak goreng:600:ml:21000:1000:1;" +
	"Garam:100:g:5000:500:0"

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
	set := flag.NewFlagSet("kalkulator-hpp-produksi", flag.ContinueOnError)
	set.SetOutput(io.Discard)

	ingredientsRaw := set.String("bahan", defaultIngredients,
		"daftar bahan dengan format nama:jumlah:satuan:harga:isi:susut, dipisah titik koma")
	batch := set.Int("batch", 20, "jumlah unit yang dihasilkan per batch")
	labor := set.Int64("tenaga-kerja", 60000, "biaya tenaga kerja per batch dalam rupiah")
	overhead := set.Int64("overhead", 25000, "biaya overhead per batch dalam rupiah")
	packaging := set.Int64("kemasan", 2500, "biaya kemasan per unit dalam rupiah")
	target := set.Float64("target-margin", 25, "target margin bersih dalam persen dari harga jual")
	commission := set.Float64("komisi", 8, "komisi platform dalam persen dari harga jual")
	sellingPrice := set.Int64("harga-jual", 15000,
		"harga jual saat ini dalam rupiah, isi 0 untuk melewati penilaian margin")
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

	ingredients, err := ParseIngredients(*ingredientsRaw)
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
		Ingredients:     ingredients,
		BatchYield:      *batch,
		LaborCost:       *labor,
		OverheadCost:    *overhead,
		Packaging:       *packaging,
		TargetMarginPct: *target,
		CommissionPct:   *commission,
		SellingPrice:    *sellingPrice,
	}, format, nil
}

func printUsage(w io.Writer) {
	fmt.Fprintln(w, "Kalkulator HPP Produksi")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Hitung HPP per unit dari resep bahan, susut, tenaga kerja, overhead,")
	fmt.Fprintln(w, "dan kemasan, lalu dapatkan margin saat ini serta harga rekomendasi.")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Pemakaian:")
	fmt.Fprintln(w, "  go run . [flag]")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Flag:")
	fmt.Fprintln(w, "  -bahan string          daftar bahan nama:jumlah:satuan:harga:isi:susut")
	fmt.Fprintln(w, "  -batch int             unit per batch (default 20)")
	fmt.Fprintln(w, "  -tenaga-kerja int      biaya tenaga kerja per batch (default 60000)")
	fmt.Fprintln(w, "  -overhead int          biaya overhead per batch (default 25000)")
	fmt.Fprintln(w, "  -kemasan int           biaya kemasan per unit (default 2500)")
	fmt.Fprintln(w, "  -target-margin float   target margin dari harga jual (default 25)")
	fmt.Fprintln(w, "  -komisi float          komisi platform dari harga jual (default 8)")
	fmt.Fprintln(w, "  -harga-jual int        harga jual saat ini, 0 untuk melewati (default 15000)")
	fmt.Fprintln(w, "  -json                  keluarkan hasil sebagai JSON")
	fmt.Fprintln(w, "  -csv                   keluarkan hasil sebagai CSV")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Contoh:")
	fmt.Fprintln(w, "  go run .")
	fmt.Fprintln(w, "  go run . -batch 40 -tenaga-kerja 100000 -target-margin 20")
	fmt.Fprintln(w, "  go run . -bahan \"Tepung:500:g:12000:1000:2;Gula:200:g:15000:1000:0\" -json")
	fmt.Fprintln(w, "  go run . -csv > hpp.csv")
}
