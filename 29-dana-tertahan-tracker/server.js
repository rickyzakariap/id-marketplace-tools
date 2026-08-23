// Dana Tertahan Tracker - lacak saldo marketplace yang dibekukan/ditahan.
// Node.js + Express, single dep (express), JSON file storage.
//
// Konteks (fakta terverifikasi dari berita):
// - 2 Jul 2026: saldo miliaran ditahan TikTok Shop, UMKM lapor Komisi VII DPR (ANTARA)
// - 3 Jul 2026: bos e-commerce dipanggil DPR (CNBC)
// - 9 Jul 2026: 500 akun TikTok Shop beku, Rp 3 triliun tak bisa ditarik (CNBC)
// - 21 Agu 2026: penangguhan berakhir, saldo Tokopedia/TikTok masih belum cair (detikNews)
// Timeline dan alasan di bawah adalah ringkasan berita, bukan dokumen hukum.

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8029;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cases.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Storage -----------------------------------------------------------

function readCases() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).cases || [];
  } catch (e) {
    return [];
  }
}

function writeCases(cases) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ cases }, null, 2));
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysBetween(fromIso) {
  const from = new Date(fromIso + 'T00:00:00');
  const now = new Date(todayStr() + 'T00:00:00');
  return Math.max(0, Math.round((now - from) / 86400000));
}

// --- Data statis ---------------------------------------------------------

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok Shop' },
  { id: 'tokopedia', name: 'Tokopedia' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'lazada', name: 'Lazada' },
  { id: 'bukalapak', name: 'Bukalapak' },
  { id: 'blibli', name: 'Blibli' },
];

const REASONS = [
  { id: 'akun-beku', label: 'Akun dibekukan mendadak', detail: 'Ratusan akun dibekukan tanpa pemberitahuan jelas. Kasus terbesar: 500 akun TikTok Shop dengan total dana Rp 3 triliun tak bisa ditarik (CNBC, 9 Jul 2026).' },
  { id: 'penangguhan', label: 'Penangguhan pencairan platform', detail: 'Platform menangguhkan pencairan saldo. Penangguhan resmi berakhir 21 Agu 2026, tapi saldo Tokopedia/TikTok masih belum bisa dicairkan (detikNews).' },
  { id: 'komisi-afiliasi', label: 'Komisi afiliator dibekukan', detail: 'Komisi afiliator dibekukan, salah satunya terkait program gratis ongkir yang dinilai tidak sesuai ketentuan (CNBC, 7 Jul 2026).' },
  { id: 'verifikasi', label: 'Verifikasi data belum lengkap', detail: 'Dokumen toko/KYC belum lengkap sehingga pencairan ditahan sampai verifikasi selesai. Umum di semua marketplace.' },
  { id: 'sengketa', label: 'Sengketa pesanan / komplain pembeli', detail: 'Dana pesanan ditahan sementara selama proses sengketa atau komplain pembeli berjalan.' },
];

const ESCALATION = [
  { step: 1, label: 'Dokumentasikan semua bukti', detail: 'Screenshot saldo, riwayat pencairan yang gagal, email/chat CS, dan nomor tiket. Ini modal utama untuk semua jalur pengaduan.' },
  { step: 2, label: 'Ajukan ke CS platform', detail: 'Buka tiket lewat seller center. Minta jawaban tertulis soal alasan penahanan dan estimasi pencairan. Simpan nomor tiket.' },
  { step: 3, label: 'Lapor ke Kemenkop UKM', detail: 'Kementerian UMKM sudah merespons kasus ini. Sampaikan laporan dengan bukti dokumen tahap 1.' },
  { step: 4, label: 'Lapor ke Komisi VII DPR', detail: 'Komisi VII sudah memanggil platform terkait saldo UMKM ditahan (ANTARA, 2 Jul 2026). Aduan kolektif dari banyak seller lebih didengar.' },
  { step: 5, label: 'Konsultasi bantuan hukum', detail: 'Jika dana besar dan tidak ada kejelasan, konsultasikan opsi hukum (gugatan perdata / laporan pidana penipuan).' },
];

const TIMELINE = [
  { date: '2026-07-02', title: 'UMKM lapor ke Komisi VII DPR', detail: 'Saldo miliaran ditahan TikTok Shop. Komisi VII DPR memanggil TikTok Shop terkait saldo UMKM ditahan.', source: 'ANTARA' },
  { date: '2026-07-03', title: 'Bos e-commerce dipanggil DPR', detail: 'TikTok Shop banyak masalah dan aduan, pimpinan platform dipanggil DPR.', source: 'CNBC Indonesia' },
  { date: '2026-07-04', title: 'DPR minta perlindungan pelaku usaha', detail: 'Kasus pembekuan dana UMKM di TikTok Shop disorot, DPR minta perlindungan diperkuat.', source: 'ANTARA' },
  { date: '2026-07-07', title: 'Komisi afiliator dibekukan', detail: 'Komisi afiliator TikTok Shop dibekukan, salah satunya perkara gratis ongkir.', source: 'CNBC Indonesia' },
  { date: '2026-07-09', title: '500 akun beku, Rp 3 triliun tertahan', detail: '500 akun TikTok Shop mendadak beku, Rp 3 triliun tak bisa ditarik. Pemerintah merespons.', source: 'CNBC Indonesia, detikFinance' },
  { date: '2026-08-21', title: 'Penangguhan berakhir, saldo belum cair', detail: 'Masa penangguhan berakhir, tapi saldo Tokopedia dan TikTok masih belum dapat dicairkan.', source: 'detikNews' },
];

const STATUSES = [
  { id: 'baru', label: 'Baru ditemukan' },
  { id: 'proses-cs', label: 'Dalam proses CS' },
  { id: 'escalated', label: 'Sudah dilaporkan ke instansi' },
  { id: 'cair', label: 'Saldo cair' },
];

// Status kasus: date-aware, dihitung dari tanggal hari ini.
function sagaStatus() {
  const today = todayStr();
  if (today < '2026-07-02') {
    return { status: 'sebelum', label: 'Belum ada kasus massal', description: 'Belum ada pemberitaan saldo tertahan massal pada tanggal ini.' };
  }
  if (today < '2026-08-21') {
    return { status: 'berlangsung', label: 'Kasus saldo tertahan berlangsung', description: 'Ribuan seller melaporkan saldo tidak bisa ditarik. DPR dan pemerintah sudah turun tangan, penangguhan masih berjalan.' };
  }
  if (today < '2026-09-30') {
    return { status: 'pasca', label: 'Penangguhan berakhir, saldo masih tertahan', description: 'Masa penangguhan resmi berakhir 21 Agu 2026, tapi banyak seller melaporkan saldo Tokopedia/TikTok masih belum bisa dicairkan. Pantau seller center dan lanjutkan eskalasi jika belum cair.' };
  }
  return { status: 'lanjut', label: 'Kasus berlanjut', description: 'Penangguhan sudah berakhir lama. Jika saldo masih tertahan, gunakan jalur eskalasi (Kemenkop UKM, Komisi VII DPR, bantuan hukum).' };
}

// --- API ----------------------------------------------------------------

app.get('/api/status', (req, res) => {
  const s = sagaStatus();
  res.json({ ...s, updated: '2026-08-23', sources: ['ANTARA', 'CNBC Indonesia', 'detikNews', 'detikFinance'] });
});

app.get('/api/meta', (req, res) => {
  res.json({ platforms: PLATFORMS, reasons: REASONS, statuses: STATUSES, escalation: ESCALATION, timeline: TIMELINE });
});

app.get('/api/cases', (req, res) => {
  res.json(readCases().map(withAge));
});

function withAge(c) {
  return { ...c, age_days: daysBetween(c.since) };
}

function summary(cases) {
  const total = cases.reduce((s, c) => s + c.amount, 0);
  const open = cases.filter((c) => c.status !== 'cair');
  const byPlatform = {};
  PLATFORMS.forEach((p) => { byPlatform[p.id] = { name: p.name, count: 0, total: 0 }; });
  cases.forEach((c) => {
    if (byPlatform[c.platform]) {
      byPlatform[c.platform].count += 1;
      byPlatform[c.platform].total += c.amount;
    }
  });
  const oldest = open.length
    ? open.reduce((a, b) => (a.since < b.since ? a : b))
    : null;
  return {
    total_cases: cases.length,
    total_amount: total,
    open_cases: open.length,
    open_amount: open.reduce((s, c) => s + c.amount, 0),
    oldest_since: oldest ? oldest.since : null,
    oldest_days: oldest ? daysBetween(oldest.since) : 0,
    by_platform: Object.values(byPlatform).filter((p) => p.count > 0),
  };
}

app.get('/api/summary', (req, res) => {
  res.json(summary(readCases()));
});

app.post('/api/cases', (req, res) => {
  const { platform, amount, since, reason, status, note } = req.body || {};
  if (!PLATFORMS.some((p) => p.id === platform)) return res.status(400).json({ error: 'platform tidak valid' });
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'jumlah dana harus lebih dari 0' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(since || ''))) return res.status(400).json({ error: 'tanggal tidak valid' });
  if (!REASONS.some((r) => r.id === reason)) return res.status(400).json({ error: 'alasan tidak valid' });
  if (!STATUSES.some((s) => s.id === status)) return res.status(400).json({ error: 'status tidak valid' });

  const cases = readCases();
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    platform,
    amount: amt,
    since: String(since),
    reason,
    status,
    note: String(note || '').slice(0, 500),
    created_at: new Date().toISOString(),
  };
  cases.push(item);
  writeCases(cases);
  res.json(withAge(item));
});

app.patch('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const idx = cases.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'kasus tidak ditemukan' });
  const { status } = req.body || {};
  if (!STATUSES.some((s) => s.id === status)) return res.status(400).json({ error: 'status tidak valid' });
  cases[idx].status = status;
  writeCases(cases);
  res.json(withAge(cases[idx]));
});

app.delete('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const next = cases.filter((c) => c.id !== req.params.id);
  if (next.length === cases.length) return res.status(404).json({ error: 'kasus tidak ditemukan' });
  writeCases(next);
  res.json({ ok: true });
});

app.post('/api/seed', (req, res) => {
  const examples = [
    { platform: 'tiktok', amount: 85000000, since: '2026-07-05', reason: 'akun-beku', status: 'escalated', note: 'Akun dibekukan setelah penjualan ramai. Sudah lapor CS dan menunggu kepastian.' },
    { platform: 'tiktok', amount: 23000000, since: '2026-07-20', reason: 'komisi-afiliasi', status: 'proses-cs', note: 'Komisi afiliasi dibekukan terkait program gratis ongkir.' },
    { platform: 'tokopedia', amount: 147500000, since: '2026-06-28', reason: 'penangguhan', status: 'baru', note: 'Saldo belum bisa dicairkan meski penangguhan sudah berakhir.' },
  ];
  const cases = examples.map((e, i) => ({
    id: 'ex' + (i + 1),
    ...e,
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases));
});

app.get('/api/export', (req, res) => {
  const cases = readCases();
  const rows = [['platform', 'amount', 'since', 'reason', 'status', 'note']];
  cases.forEach((c) => rows.push([c.platform, c.amount, c.since, c.reason, c.status, c.note.replace(/[\n,]/g, ' ')]));
  const csv = rows.map((r) => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="dana-tertahan.csv"');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log('Dana Tertahan Tracker running on http://localhost:' + PORT);
});
