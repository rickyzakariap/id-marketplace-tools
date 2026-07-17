package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

type GenerateRequest struct {
	Name     string   `json:"name"`
	Category string   `json:"category"`
	Price    string   `json:"price"`
	Brand    string   `json:"brand"`
	Condition string  `json:"condition"`
	Features []string `json:"features"`
	Keywords []string `json:"keywords"`
}

type PlatformResult struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	TitleMax    int    `json:"title_max"`
	DescMax     int    `json:"desc_max"`
}

type GenerateResponse struct {
	Tokopedia  PlatformResult `json:"tokopedia"`
	Shopee     PlatformResult `json:"shopee"`
	Lazada     PlatformResult `json:"lazada"`
	Bukalapak  PlatformResult `json:"bukalapak"`
	TikTok     PlatformResult `json:"tiktok"`
	Blibli     PlatformResult `json:"blibli"`
}

var platformLimits = map[string][2]int{
	"tokopedia": {100, 2000},
	"shopee":    {120, 3000},
	"lazada":    {255, 25000},
	"bukalapak": {70, 2000},
	"tiktok":    {34, 1000},
	"blibli":    {150, 5000},
}

var categoryBenefits = map[string][]string{
	"fashion":      {"bahan premium", "nyaman dipakai", "jahitan rapi", "warna tidak luntur", "ukuran lengkap"},
	"electronics":  {"garansi resmi", "hemat energi", "tahan lama", "performa tinggi", "after-sales terjamin"},
	"food":         {"halal", "tanpa pengawet", "kemasan aman", "rasa autentik", "expired panjang"},
	"beauty":       {"aman BPOM", "tidak tested on animals", "bahan alami", "hasil terlihat cepat"},
	"home":         {"mudah dirawat", "tahan lama", "desain modern", "multifungsi", "hemat tempat"},
	"sports":       {"bahan breathable", "ringan", "anti slip", "tahan keringat", "desain ergonomis"},
	"books":        {"ori", "kondisi baik", "halaman lengkap", "pengiriman aman"},
	"automotive":   {"kompatibel universal", "mudah dipasang", "tahan panas", "garansi mesin"},
	"baby":         {"aman untuk bayi", "BPA free", "sudah SNI", "mudah dibersihkan"},
	"pet":          {"aman untuk hewan", "nutrisi lengkap", "kemasan segar"},
}

func buildTitle(name, brand string, features []string, maxLen int) string {
	parts := []string{}
	if brand != "" {
		parts = append(parts, brand)
	}
	parts = append(parts, name)
	for _, f := range features {
		candidate := strings.Join(parts, " ") + " " + f
		if len(candidate) <= maxLen {
			parts = append(parts, f)
		} else {
			break
		}
	}
	title := strings.Join(parts, " ")
	if len(title) > maxLen {
		title = title[:maxLen-3] + "..."
	}
	return title
}

func capitalize(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func formatPrice(priceStr string) string {
	price := strings.ReplaceAll(priceStr, ".", "")
	price = strings.ReplaceAll(price, ",", "")
	return "Rp " + price
}

func generateTokopedia(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features, platformLimits["tokopedia"][0])
	var desc strings.Builder

	desc.WriteString(strings.ToUpper(r.Name) + "\n")
	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Kondisi: " + condText + "\n")
	desc.WriteString("Harga: " + priceFormatted + "\n\n")

	desc.WriteString("SPESIFIKASI:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("KEUNGGULAN PRODUK:\n")
	for i, b := range benefits {
		if i >= 4 {
			break
		}
		desc.WriteString("- " + capitalize(b) + "\n")
	}
	desc.WriteString("\n")

	if len(r.Keywords) > 0 {
		desc.WriteString("Cocok untuk: " + strings.Join(r.Keywords[:min(5, len(r.Keywords))], ", ") + "\n\n")
	}

	desc.WriteString("PENGIRIMAN:\n")
	desc.WriteString("- Packing aman dengan bubble wrap\n")
	desc.WriteString("- Resi otomatis update\n")
	desc.WriteString("- Pengiriman cepat 1-3 hari\n\n")

	desc.WriteString("GARANSI:\n")
	desc.WriteString("- Garansi toko 7 hari\n")
	desc.WriteString("- Retur jika barang tidak sesuai deskripsi\n\n")

	desc.WriteString("#tokopedia #" + r.Category)

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["tokopedia"][0], DescMax: platformLimits["tokopedia"][1]}
}

func generateShopee(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features, platformLimits["shopee"][0])
	var desc strings.Builder

	desc.WriteString(r.Name + "\n")
	desc.WriteString("Harga: " + priceFormatted + "\n\n")

	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Kondisi: " + condText + "\n\n")

	desc.WriteString("DETAIL PRODUK:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("KENAPA HARUS BELI DI SINI?\n")
	for i, b := range benefits {
		if i >= 4 {
			break
		}
		desc.WriteString("- " + capitalize(b) + "\n")
	}
	desc.WriteString("- Packing aman\n")
	desc.WriteString("- Fast response\n\n")

	desc.WriteString("Cara order:\n")
	desc.WriteString("1. Klik Beli\n")
	desc.WriteString("2. Pilih varian (jika ada)\n")
	desc.WriteString("3. Checkout dan bayar\n")
	desc.WriteString("4. Barang dikirim 1x24 jam\n\n")

	desc.WriteString("Jika ada pertanyaan, chat kami sebelum order ya.\n")
	desc.WriteString("Terima kasih sudah berkunjung.\n\n")

	desc.WriteString("#" + r.Category + " #shopee")

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["shopee"][0], DescMax: platformLimits["shopee"][1]}
}

func generateLazada(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features, platformLimits["lazada"][0])
	var desc strings.Builder

	desc.WriteString("Product Description\n")
	desc.WriteString("==================\n\n")

	desc.WriteString(r.Name + "\n")
	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Condition: " + condText + "\n")
	desc.WriteString("Price: " + priceFormatted + "\n\n")

	desc.WriteString("Features:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Benefits:\n")
	for i, b := range benefits {
		if i >= 4 {
			break
		}
		desc.WriteString("- " + capitalize(b) + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Package Includes:\n")
	desc.WriteString("- 1x " + r.Name + "\n")
	desc.WriteString("- Packaging box\n\n")

	desc.WriteString("Shipping:\n")
	desc.WriteString("- Same day processing\n")
	desc.WriteString("- Bubble wrap protection\n")
	desc.WriteString("- Tracking number provided\n\n")

	desc.WriteString("Warranty:\n")
	desc.WriteString("- 7-day return policy\n")
	desc.WriteString("- Contact seller for support")

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["lazada"][0], DescMax: platformLimits["lazada"][1]}
}

func generateBukalapak(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features, platformLimits["bukalapak"][0])
	var desc strings.Builder

	desc.WriteString(r.Name + "\n\n")
	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Kondisi: " + condText + "\n")
	desc.WriteString("Harga: " + priceFormatted + "\n\n")

	desc.WriteString("Fitur:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Kelebihan:\n")
	for i, b := range benefits {
		if i >= 3 {
			break
		}
		desc.WriteString("- " + capitalize(b) + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Info Pengiriman:\n")
	desc.WriteString("- Kirim setiap hari (Senin-Sabtu)\n")
	desc.WriteString("- Packing rapi dan aman\n\n")

	desc.WriteString("Silakan diorder. Chat kami jika ada pertanyaan.")

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["bukalapak"][0], DescMax: platformLimits["bukalapak"][1]}
}

func generateTikTok(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features[:min(2, len(r.Features))], platformLimits["tiktok"][0])
	var desc strings.Builder

	desc.WriteString(r.Name + "\n")
	desc.WriteString(priceFormatted + "\n\n")

	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Kondisi: " + condText + "\n\n")

	desc.WriteString("Fitur:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	for i, b := range benefits {
		if i >= 3 {
			break
		}
		desc.WriteString(capitalize(b) + " | ")
	}
	desc.WriteString("\n\n")

	desc.WriteString("Packing aman, kirim cepat!")

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["tiktok"][0], DescMax: platformLimits["tiktok"][1]}
}

func generateBlibli(r GenerateRequest, priceFormatted, condText string, benefits []string) PlatformResult {
	title := buildTitle(r.Name, r.Brand, r.Features, platformLimits["blibli"][0])
	var desc strings.Builder

	desc.WriteString(r.Name + "\n")
	if r.Brand != "" {
		desc.WriteString("Brand: " + r.Brand + "\n")
	}
	desc.WriteString("Kondisi: " + condText + "\n")
	desc.WriteString("Harga: " + priceFormatted + "\n\n")

	desc.WriteString("Fitur Utama:\n")
	for _, f := range r.Features {
		desc.WriteString("- " + f + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Keunggulan:\n")
	for i, b := range benefits {
		if i >= 4 {
			break
		}
		desc.WriteString("- " + capitalize(b) + "\n")
	}
	desc.WriteString("\n")

	desc.WriteString("Pengiriman:\n")
	desc.WriteString("- Proses 1x24 jam\n")
	desc.WriteString("- Packing aman\n")
	desc.WriteString("- Resi otomatis\n\n")

	desc.WriteString("Garansi 7 hari uang kembali jika barang tidak sesuai.")

	return PlatformResult{Title: title, Description: desc.String(), TitleMax: platformLimits["blibli"][0], DescMax: platformLimits["blibli"][1]}
}

func handleGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Category == "" || req.Price == "" {
		http.Error(w, "name, category, and price required", http.StatusBadRequest)
		return
	}

	priceFormatted := formatPrice(req.Price)
	condText := "Baru"
	if req.Condition == "used" {
		condText = "Bekas"
	} else if req.Condition == "refurbished" {
		condText = "Refurbished"
	}

	benefits := categoryBenefits[req.Category]
	if benefits == nil {
		benefits = []string{"kualitas terjamin", "harga bersaing", "pengiriman cepat"}
	}

	resp := GenerateResponse{
		Tokopedia: generateTokopedia(req, priceFormatted, condText, benefits),
		Shopee:    generateShopee(req, priceFormatted, condText, benefits),
		Lazada:    generateLazada(req, priceFormatted, condText, benefits),
		Bukalapak: generateBukalapak(req, priceFormatted, condText, benefits),
		TikTok:    generateTikTok(req, priceFormatted, condText, benefits),
		Blibli:    generateBlibli(req, priceFormatted, condText, benefits),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, htmlPage)
}

func main() {
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/api/generate", handleGenerate)
	fmt.Println("Listing Description Generator running on http://localhost:3460")
	log.Fatal(http.ListenAndServe(":3460", nil))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
