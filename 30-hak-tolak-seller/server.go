// Hak Tolak Seller - keberatan atas perubahan kebijakan sepihak marketplace.
// Go 1.26, net/http, JSON file storage, embed HTML, zero dependencies.
//
// Landasan (fakta terverifikasi dari pemberitaan, bukan nasihat hukum):
// - Permendag 19/2026 = revisi Permendag 31/2023 (PMSE), diumumkan Mendag Budi
//   Santoso dalam konferensi pers Senin 8 Juni 2026.
// - Poin utama: marketplace WAJIB memperoleh persetujuan penjual SEBELUM
//   memberlakukan perubahan kebijakan: pengenaan biaya baru, perubahan komisi,
//   atau penyesuaian mekanisme layanan.
// - Latar: TikTok Shop biaya layanan logistik sejak 1 Mei 2026 (berat + jarak),
//   Shopee penyesuaian Gratis Ongkir XTRA sejak 2 Mei 2026 (1%-9,5%), keduanya
//   tanpa ruang negosiasi. TikTok Shop komisi dinamis baru 18 Mei 2026.
// - Sumber: nusantaranews.co, suara.com, kompas.com, ikpi.or.id, ukmindonesia.id.
//
// Cakupan "wajib persetujuan" di tool ini disusun dari pemberitaan, bukan
// salinan pasal regulasi. UI menampilkan disclaimer itu.

package main

import (
	"embed"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

//go:embed public
var publicFS embed.FS

const PORT = "8030"
const DATA_DIR = "data"
const DATA_FILE = "data/cases.json"

// Aturan berlaku mulai 8 Juni 2026 (tanggal konferensi pers Kemendag).
var policyEffective, _ = time.ParseInLocation("2006-01-02", "2026-06-08", time.Local)

var idMonths = []string{"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

func formatIDDate(t time.Time) string {
	return fmt.Sprintf("%d %s %d", t.Day(), idMonths[int(t.Month())-1], t.Year())
}

type Objection struct {
	ID           string `json:"id"`
	Platform     string `json:"platform"`
	ChangeType   string `json:"change_type"`
	Title        string `json:"title"`
	Detail       string `json:"detail"`
	AnnouncedAt  string `json:"announced_at"`
	EffectiveAt  string `json:"effective_at"`
	AskedConsent bool   `json:"asked_consent"`
	Status       string `json:"status"`
	Note         string `json:"note"`
	CreatedAt    string `json:"created_at"`
}

type Meta struct {
	Platforms   []string `json:"platforms"`
	ChangeTypes []ChangeType `json:"change_types"`
	Statuses    []string `json:"statuses"`
	Timeline    []TimelineItem `json:"timeline"`
	Escalation  []EscalationStep `json:"escalation"`
	Sources     []string `json:"sources"`
}

type ChangeType struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Scope string `json:"scope"` // wajib / tidak-wajib
}

type TimelineItem struct {
	Date   string `json:"date"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type EscalationStep struct {
	Step   int    `json:"step"`
	Label  string `json:"label"`
	Detail string `json:"detail"`
}

var platforms = []string{"Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Bukalapak", "Blibli"}

var changeTypes = []ChangeType{
	{"biaya-baru", "Biaya baru (layanan, admin, retur, logistik)", "wajib"},
	{"komisi", "Perubahan komisi / tarif penjual", "wajib"},
	{"mekanisme-layanan", "Perubahan mekanisme layanan / program (gratis ongkir, voucher)", "wajib"},
	{"harga-produk", "Penetapan / intervensi harga produk", "tidak-wajib"},
	{"lainnya", "Kebijakan lain (AI, data, tata tertib)", "tidak-wajib"},
}

var statuses = []string{"draft", "dikirim", "ditanggapi", "eskalasi", "selesai"}

var timeline = []TimelineItem{
	{"2026-05-01", "TikTok Shop biaya layanan logistik", "Biaya layanan logistik untuk semua pesanan baru, dihitung dari berat paket dan jarak pengiriman. Diterapkan tanpa ruang negosiasi."},
	{"2026-05-02", "Shopee sesuaikan Gratis Ongkir XTRA", "Tarif biaya layanan program Gratis Ongkir XTRA 1% hingga 9,5% tergantung kategori dan dimensi produk."},
	{"2026-05-18", "TikTok Shop komisi dinamis baru", "Tarif komisi kategori baru dengan cap per item naik dari Rp40.000 ke Rp650.000. Seller menjerit."},
	{"2026-06-08", "Permendag 19/2026 diumumkan", "Mendag Budi Santoso menerbitkan revisi Permendag 31/2023: marketplace wajib persetujuan penjual sebelum ubah biaya, komisi, atau mekanisme layanan."},
}

var escalation = []EscalationStep{
	{1, "Ajukan keberatan ke CS platform", "Buka tiket tertulis di seller center. Lampirkan surat keberatan, screenshot pengumuman perubahan, dan bukti dampak. Minta jawaban tertulis dengan nomor tiket."},
	{2, "Lapor ke Kemendag (Ditjen PDN)", "Permendag 19/2026 diterbitkan Kemendag. Lapor pengaduan ke Direktorat Jenderal Perdagangan Dalam Negeri dengan bukti tiket CS dan surat keberatan."},
	{3, "Lapor ke Kemenkop UKM", "Kementerian UMKM aktif memantau perilaku marketplace dan sudah melarang kenaikan sepihak. Sampaikan laporan dengan dokumen lengkap."},
	{4, "Lapor ke Komisi VI DPR", "Komisi VI membidangi perdagangan dan industri. Aduan kolektif dari banyak seller lebih didengar daripada laporan individu."},
	{5, "Bantuan hukum / media", "Jika perubahan merugikan dalam skala besar dan tidak ada tanggapan, konsultasikan opsi hukum dan pertimbangkan pemberitaan media."},
}

var sources = []string{
	"nusantaranews.co: Permendag 19/2026 Terbit, Jutaan Penjual Online Kini Punya Hak Tolak Kebijakan Sepihak Marketplace (Agu 2026)",
	"suara.com: Marketplace Tak Bisa Lagi Naikkan Biaya Sepihak, Seller Kini Wajib Setujui Perubahan Kontrak",
	"kompas.com: Mendag Serap Keluhan Penjual Marketplace, Revisi Permendag 31 Disiapkan",
	"ikpi.or.id: UMKM Kini Bisa Protes Kenaikan Biaya Marketplace, Ini Aturan Barunya",
	"ukmindonesia.id: Permendag 19 Tahun 2026 Sudah Berlaku, UMKM Wajib Tahu 5 Perubahan Ini",
}

// --- Storage ---------------------------------------------------------------

func readCases() []Objection {
	raw, err := os.ReadFile(DATA_FILE)
	if err != nil {
		return []Objection{}
	}
	var list []Objection
	if err := json.Unmarshal(raw, &list); err != nil {
		return []Objection{}
	}
	return list
}

func writeCases(list []Objection) {
	if err := os.MkdirAll(DATA_DIR, 0o755); err != nil {
		log.Printf("mkdir data: %v", err)
	}
	raw, _ := json.MarshalIndent(list, "", "  ")
	if err := os.WriteFile(DATA_FILE, raw, 0o644); err != nil {
		log.Printf("write cases: %v", err)
	}
}

func genID() string {
	return fmt.Sprintf("obj-%d", time.Now().UnixNano()%1000000)
}

// --- Handlers --------------------------------------------------------------

func handleMeta(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, Meta{
		Platforms:   platforms,
		ChangeTypes: changeTypes,
		Statuses:    statuses,
		Timeline:    timeline,
		Escalation:  escalation,
		Sources:     sources,
	})
}

func handlePolicy(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	daysActive := int(now.Sub(policyEffective).Hours() / 24)
	writeJSON(w, map[string]interface{}{
		"effective":    "2026-06-08",
		"active":       true,
		"days_active":  daysActive,
		"summary":      "Marketplace wajib memperoleh persetujuan penjual sebelum memberlakukan perubahan biaya, komisi, atau mekanisme layanan.",
		"detail":       "Permendag 19/2026 (revisi Permendag 31/2023 tentang PMSE) diumumkan Mendag Budi Santoso, 8 Juni 2026. Cakupan rinci disusun dari pemberitaan, bukan salinan pasal.",
	})
}

type CheckRequest struct {
	Platform     string `json:"platform"`
	ChangeType   string `json:"change_type"`
	AnnouncedAt  string `json:"announced_at"`
	EffectiveAt  string `json:"effective_at"`
	AskedConsent *bool  `json:"asked_consent"`
}

type CheckResult struct {
	Code    string   `json:"code"` // berhak-tolak / sudah-disetujui / sebelum-aturan / di-luar-cakupan / data-kurang
	Title   string   `json:"title"`
	Color   string   `json:"color"` // red / amber / green / gray
	Summary string   `json:"summary"`
	Bullets []string `json:"bullets"`
}

func parseDate(s string) (time.Time, bool) {
	if s == "" {
		return time.Time{}, false
	}
	t, err := time.ParseInLocation("2006-01-02", s, time.Local)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

func handleCheck(w http.ResponseWriter, r *http.Request) {
	var req CheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, CheckResult{Code: "data-kurang", Title: "Data tidak lengkap", Color: "gray",
			Summary: "Isi jenis perubahan dan tanggal berlaku dulu."})
		return
	}

	var ct *ChangeType
	for i := range changeTypes {
		if changeTypes[i].ID == req.ChangeType {
			ct = &changeTypes[i]
			break
		}
	}
	if ct == nil {
		writeJSON(w, CheckResult{Code: "data-kurang", Title: "Jenis perubahan belum dipilih", Color: "gray",
			Summary: "Pilih jenis perubahan yang diumumkan marketplace."})
		return
	}

	if ct.Scope != "wajib" {
		writeJSON(w, CheckResult{Code: "di-luar-cakupan", Title: "Di luar cakupan wajib persetujuan", Color: "gray",
			Summary: "Menurut pemberitaan, kategori ini tidak termasuk yang wajib persetujuan penjual.",
			Bullets: []string{
				"Permendag 19/2026 menyoroti biaya baru, komisi, dan mekanisme layanan.",
				"Kalau kebijakan ini tetap merugikan, kamu tetap bisa protes ke CS dan lapor Kemendag.",
			}})
		return
	}

	effective, hasEffective := parseDate(req.EffectiveAt)
	if !hasEffective {
		writeJSON(w, CheckResult{Code: "data-kurang", Title: "Tanggal berlaku belum diisi", Color: "gray",
			Summary: "Isi tanggal perubahan berlaku agar bisa dibandingkan dengan tanggal aturan (8 Juni 2026)."})
		return
	}

	before := effective.Before(policyEffective)
	if before {
		writeJSON(w, CheckResult{Code: "sebelum-aturan", Title: "Berlaku sebelum Permendag 19/2026", Color: "amber",
			Summary: "Perubahan ini diberlakukan sebelum 8 Juni 2026, jadi tidak bisa ditolak lewat jalur persetujuan baru.",
			Bullets: []string{
				"Aturan tidak berlaku surut untuk perubahan yang sudah jalan duluan.",
				"Kamu tetap bisa protes ke CS, minta penjelasan tertulis, dan lapor ke Kemendag.",
				"Contoh nyata: biaya logistik TikTok (1 Mei 2026), Gratis Ongkir XTRA Shopee (2 Mei 2026), komisi TikTok (18 Mei 2026).",
			}})
		return
	}

	if req.AskedConsent == nil {
		writeJSON(w, CheckResult{Code: "data-kurang", Title: "Status persetujuan belum diisi", Color: "gray",
			Summary: "Jawab dulu: apakah marketplace sudah meminta persetujuanmu?"})
		return
	}

	if *req.AskedConsent {
		writeJSON(w, CheckResult{Code: "sudah-disetujui", Title: "Persetujuan sudah diminta", Color: "green",
			Summary: "Marketplace sudah meminta dan kamu menyetujui, jadi perubahan ini sah secara prosedur.",
			Bullets: []string{
				"Kalau dampaknya merugikan di luar yang disepakati, kamu tetap bisa ajukan keberatan tertulis.",
				"Simpan bukti persetujuan dan pengumuman perubahan untuk arsip.",
			}})
		return
	}

	label := ct.Label
	if strings.HasPrefix(label, "Perubahan ") {
		// label sudah diawali "Perubahan", jangan duplikat
	} else {
		label = "Perubahan " + strings.ToLower(label[:1]) + label[1:]
	}
	writeJSON(w, CheckResult{Code: "berhak-tolak", Title: "Kamu berhak menolak", Color: "red",
		Summary: label + " di " + req.Platform + " berlaku setelah 8 Juni 2026 tanpa persetujuanmu. Ini melanggar kewajiban Permendag 19/2026.",
		Bullets: []string{
			"Kirim surat keberatan ke seller center dan minta jawaban tertulis.",
			"Kalau tidak ditanggapi, eskalasi ke Kemendag (Ditjen PDN) dan Kemenkop UKM.",
			"Buat surat keberatan langsung dari tab Surat Keberatan.",
		}})
}

type LetterRequest struct {
	Name         string `json:"name"`
	Shop         string `json:"shop"`
	Platform     string `json:"platform"`
	ChangeType   string `json:"change_type"`
	Detail       string `json:"detail"`
	AnnouncedAt  string `json:"announced_at"`
	EffectiveAt  string `json:"effective_at"`
	AskedConsent bool   `json:"asked_consent"`
	City         string `json:"city"`
	Save         bool   `json:"save"`
}

func handleLetter(w http.ResponseWriter, r *http.Request) {
	var req LetterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Shop == "" || req.Platform == "" {
		writeJSON(w, map[string]string{"error": "Nama, nama toko, dan platform wajib diisi."})
		return
	}

	ctLabel := req.ChangeType
	for _, ct := range changeTypes {
		if ct.ID == req.ChangeType {
			ctLabel = ct.Label
			break
		}
	}
	if req.ChangeType == "" {
		ctLabel = "kebijakan"
	}

	now := time.Now()
	dateStr := formatIDDate(now)
	if req.City != "" {
		dateStr = req.City + ", " + dateStr
	}

	consentPar := "Sampai dengan surat ini dibuat, saya belum dimintai persetujuan atas perubahan tersebut, padahal Permendag Nomor 19 Tahun 2026 (revisi Permendag Nomor 31 Tahun 2023 tentang PMSE) mewajibkan marketplace memperoleh persetujuan penjual sebelum memberlakukan perubahan biaya, komisi, atau mekanisme layanan."
	if req.AskedConsent {
		consentPar = "Saya sudah dimintai persetujuan atas perubahan ini, namun saya menilai dampaknya merugikan toko saya dan meminta peninjauan kembali sesuai Permendag Nomor 19 Tahun 2026 (revisi Permendag Nomor 31 Tahun 2023 tentang PMSE)."
	}

	announceLine := ""
	if req.AnnouncedAt != "" {
		announceLine = fmt.Sprintf(" yang diumumkan pada %s", req.AnnouncedAt)
	}
	effectiveLine := ""
	if req.EffectiveAt != "" {
		effectiveLine = fmt.Sprintf(" dan diberlakukan mulai %s", req.EffectiveAt)
	}

	letter := fmt.Sprintf(`%s

Kepada Yth.
Tim Seller Center %s
di tempat

Perihal: Keberatan atas %s

Dengan hormat,

Saya yang bertanda tangan di bawah ini:
Nama: %s
Nama Toko: %s
Platform: %s

Dengan ini menyampaikan keberatan atas pemberlakuan %s: %s%s%s.

%s

Saya meminta:
1. Penjelasan tertulis atas dasar pemberlakuan perubahan ini.
2. Peninjauan kembali atas perubahan tersebut terhadap toko saya.

Mohon respons tertulis selambat-lambatnya 7 (tujuh) hari kerja setelah surat ini diterima.

Demikian surat keberatan ini saya sampaikan. Atas perhatian dan respons Bapak/Ibu, saya ucapkan terima kasih.

Hormat saya,

%s
Toko %s`, dateStr, req.Platform, ctLabel, req.Name, req.Shop, req.Platform,
		ctLabel, req.Detail, announceLine, effectiveLine, consentPar, req.Name, req.Shop)

	if req.Save {
		obj := Objection{
			ID:           genID(),
			Platform:     req.Platform,
			ChangeType:   req.ChangeType,
			Title:        ctLabel,
			Detail:       req.Detail,
			AnnouncedAt:  req.AnnouncedAt,
			EffectiveAt:  req.EffectiveAt,
			AskedConsent: req.AskedConsent,
			Status:       "draft",
			Note:         "Dibuat dari surat keberatan",
			CreatedAt:    time.Now().Format(time.RFC3339),
		}
		list := readCases()
		list = append(list, obj)
		writeCases(list)
		writeJSON(w, map[string]interface{}{"letter": letter, "saved": true})
		return
	}

	writeJSON(w, map[string]interface{}{"letter": letter, "saved": false})
}

func handleCases(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, readCases())
	case http.MethodPost:
		var obj Objection
		if err := json.NewDecoder(r.Body).Decode(&obj); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if obj.ID == "" {
			obj.ID = genID()
		}
		if obj.CreatedAt == "" {
			obj.CreatedAt = time.Now().Format(time.RFC3339)
		}
		list := readCases()
		list = append(list, obj)
		writeCases(list)
		writeJSON(w, obj)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleCaseByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	list := readCases()
	idx := -1
	for i := range list {
		if list[i].ID == id {
			idx = i
			break
		}
	}
	if idx < 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var patch struct {
			Status string `json:"status"`
			Note   string `json:"note"`
		}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if patch.Status != "" {
			list[idx].Status = patch.Status
		}
		if patch.Note != "" {
			list[idx].Note = patch.Note
		}
		writeCases(list)
		writeJSON(w, list[idx])
	case http.MethodDelete:
		list = append(list[:idx], list[idx+1:]...)
		writeCases(list)
		w.WriteHeader(http.StatusNoContent)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleSeed(w http.ResponseWriter, r *http.Request) {
	list := readCases()
	if len(list) > 0 {
		writeJSON(w, map[string]string{"error": "Data sudah ada, kosongkan dulu kalau mau muat contoh."})
		return
	}
	now := time.Now().Format(time.RFC3339)
	list = []Objection{
		{
			ID: "ex1", Platform: "TikTok Shop", ChangeType: "biaya-baru",
			Title:       "Biaya layanan logistik",
			Detail:      "Biaya layanan logistik untuk semua pesanan baru, dihitung dari berat paket dan jarak pengiriman.",
			AnnouncedAt: "2026-04-20", EffectiveAt: "2026-05-01",
			AskedConsent: false, Status: "selesai",
			Note:      "Contoh: berlaku sebelum Permendag 19/2026 (8 Juni 2026), tidak bisa ditolak lewat jalur persetujuan.",
			CreatedAt: now,
		},
		{
			ID: "ex2", Platform: "TikTok Shop", ChangeType: "komisi",
			Title:       "Komisi dinamis baru",
			Detail:      "Tarif komisi kategori baru, cap per item naik dari Rp40.000 ke Rp650.000.",
			AnnouncedAt: "2026-04-29", EffectiveAt: "2026-05-18",
			AskedConsent: false, Status: "ditanggapi",
			Note:      "Contoh: berlaku sebelum aturan, tapi tetap bisa diprotes.",
			CreatedAt: now,
		},
		{
			ID: "ex3", Platform: "Shopee", ChangeType: "biaya-baru",
			Title:       "Biaya admin per kategori (contoh)",
			Detail:      "Contoh: kenaikan biaya layanan per kategori produk yang diumumkan setelah aturan berlaku, tanpa dimintai persetujuan.",
			AnnouncedAt: "2026-08-10", EffectiveAt: "2026-09-01",
			AskedConsent: false, Status: "dikirim",
			Note:      "Contoh: berlaku setelah 8 Juni 2026 dan belum ada persetujuan, berhak tolak.",
			CreatedAt: now,
		},
	}
	writeCases(list)
	writeJSON(w, list)
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	list := readCases()
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=hak-tolak-kasus.csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"id", "platform", "jenis", "ringkasan", "detail", "diumumkan", "berlaku", "persetujuan", "status", "catatan"})
	for _, o := range list {
		consent := "tidak"
		if o.AskedConsent {
			consent = "ya"
		}
		cw.Write([]string{o.ID, o.Platform, o.ChangeType, o.Title, o.Detail, o.AnnouncedAt, o.EffectiveAt, consent, o.Status, o.Note})
	}
	cw.Flush()
}

// --- Helpers ---------------------------------------------------------------

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(v)
}

func staticHandler() http.Handler {
	sub, err := fs.Sub(publicFS, "public")
	if err != nil {
		log.Fatal(err)
	}
	return http.FileServer(http.FS(sub))
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("GET /", staticHandler())
	mux.HandleFunc("GET /api/meta", handleMeta)
	mux.HandleFunc("GET /api/policy", handlePolicy)
	mux.HandleFunc("POST /api/check", handleCheck)
	mux.HandleFunc("POST /api/letter", handleLetter)
	mux.HandleFunc("GET /api/cases", handleCases)
	mux.HandleFunc("POST /api/cases", handleCases)
	mux.HandleFunc("PATCH /api/cases/{id}", handleCaseByID)
	mux.HandleFunc("DELETE /api/cases/{id}", handleCaseByID)
	mux.HandleFunc("POST /api/seed", handleSeed)
	mux.HandleFunc("GET /api/export", handleExport)

	// Pastikan folder data ada.
	os.MkdirAll(DATA_DIR, 0o755)
	if _, err := os.Stat(DATA_FILE); os.IsNotExist(err) {
		writeCases([]Objection{})
	}

	log.Printf("Hak Tolak Seller running on http://localhost:%s", PORT)
	log.Fatal(http.ListenAndServe(":"+PORT, mux))
}
