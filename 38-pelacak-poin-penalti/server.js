const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  analyze,
  buildLetter,
  buildExample,
  detectReappearance,
  validateCase,
  todayISO,
  addDays,
  PLATFORMS,
  VIOLATIONS,
  TIERS,
  CONSEQUENCES,
  SOURCES,
  DEFAULTS,
  EVIDENCE,
  SHOPEE_THRESHOLD,
  SHOPEE_RESTRICTION_DAYS,
  SHOPEE_APPEAL_WINDOW_DAYS,
  SHOPEE_APPEAL_PROCESS_DAYS,
} = require('./lib/penalty');

const app = express();
const PORT = 8038;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cases.json');

app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readCases() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed.cases) ? parsed.cases : [];
  } catch (e) {
    return [];
  }
}

function writeCases(cases) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ cases }, null, 2));
}

function nextId(cases) {
  let max = 0;
  cases.forEach((item) => {
    const n = Number(String(item.id || '').replace(/\D/g, ''));
    if (Number.isFinite(n) && n > max) max = n;
  });
  return 'c' + (max + 1);
}

function summary(cases) {
  const reappearances = detectReappearance(cases);
  const activePoints = cases.reduce((total, item) => {
    if (item.appeal_status === 'diterima' && item.points_reset === 'ya') return total;
    return total + (Number(item.points) || 0);
  }, 0);
  return {
    total_cases: cases.length,
    active_points: activePoints,
    reappearances: reappearances,
    cases: cases,
  };
}

app.get('/api/meta', (req, res) => {
  res.json({
    platforms: PLATFORMS,
    violations: VIOLATIONS,
    tiers: TIERS,
    consequences: CONSEQUENCES,
    sources: SOURCES,
    defaults: DEFAULTS,
    evidence: EVIDENCE,
    rules: {
      shopee_threshold: SHOPEE_THRESHOLD,
      shopee_restriction_days: SHOPEE_RESTRICTION_DAYS,
      shopee_appeal_window_days: SHOPEE_APPEAL_WINDOW_DAYS,
      shopee_appeal_process_days: SHOPEE_APPEAL_PROCESS_DAYS,
    },
  });
});

app.get('/api/example', (req, res) => {
  res.json(buildExample(new Date()));
});

app.post('/api/analyze', (req, res) => {
  const result = analyze(req.body || {}, new Date());
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/letter', (req, res) => {
  res.json(buildLetter(req.body || {}, new Date()));
});

app.get('/api/cases', (req, res) => {
  res.json(summary(readCases()));
});

app.post('/api/cases', (req, res) => {
  const checked = validateCase(req.body || {});
  if (checked.error) {
    return res.status(400).json(checked);
  }
  const cases = readCases();
  const item = Object.assign({}, checked.item, {
    id: nextId(cases),
    created_at: new Date().toISOString(),
  });
  cases.push(item);
  writeCases(cases);
  res.status(201).json(summary(cases));
});

app.patch('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const index = cases.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'kasus tidak ditemukan' });
  const merged = validateCase(Object.assign({}, cases[index], req.body || {}));
  if (merged.error) return res.status(400).json(merged);
  cases[index] = Object.assign({}, cases[index], merged.item);
  writeCases(cases);
  res.json(summary(cases));
});

app.delete('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const next = cases.filter((item) => item.id !== req.params.id);
  if (next.length === cases.length) return res.status(404).json({ error: 'kasus tidak ditemukan' });
  writeCases(next);
  res.json(summary(next));
});

app.post('/api/seed', (req, res) => {
  const today = todayISO(new Date());
  const seeds = [
    {
      platform: 'shopee',
      ref: '261001GGJ854U8',
      violation: 'fake_package',
      violation_label: 'Paket kosong atau tidak lengkap',
      points: 6,
      issued_date: addDays(today, -20),
      appeal_status: 'diterima',
      appeal_date: addDays(today, -18),
      appeal_result_date: addDays(today, -12),
      points_reset: 'ya',
      note: 'Banding disetujui dan poin dikembalikan ke nol. Contoh pola kasus Media Konsumen 21 Oktober 2026.',
    },
    {
      platform: 'shopee',
      ref: '261001GGJ854U8',
      violation: 'fake_package',
      violation_label: 'Paket kosong atau tidak lengkap',
      points: 9,
      issued_date: addDays(today, -2),
      appeal_status: 'belum',
      appeal_date: '',
      appeal_result_date: '',
      points_reset: 'tidak-tahu',
      note: 'Poin muncul lagi untuk referensi yang sama setelah banding sebelumnya disetujui.',
    },
    {
      platform: 'tiktok',
      ref: 'TT-5820193',
      violation: 'forbidden',
      violation_label: 'Produk diblokir sepihak',
      points: 12,
      issued_date: addDays(today, -9),
      appeal_status: 'diajukan',
      appeal_date: addDays(today, -7),
      appeal_result_date: '',
      points_reset: 'tidak-tahu',
      note: 'Banding sudah diajukan, menunggu hasil tertulis. Ambang pembatasan TikTok diisi manual di Seller Center.',
    },
    {
      platform: 'tokopedia',
      ref: 'INV-2026-0912',
      violation: 'late',
      violation_label: 'Keterlambatan pengiriman',
      points: 3,
      issued_date: addDays(today, -5),
      appeal_status: 'belum',
      appeal_date: '',
      appeal_result_date: '',
      points_reset: 'tidak-tahu',
      note: 'Poin rendah, belum diajukan banding. Catat nomor tiket saat menghubungi CS.',
    },
  ];
  const cases = seeds.map((item, index) => Object.assign({}, item, {
    id: 'c' + (index + 1),
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases));
});

app.get('/api/export', (req, res) => {
  const cases = readCases();
  const rows = [['id', 'platform', 'ref', 'violation', 'points', 'issued_date', 'appeal_status', 'appeal_date', 'appeal_result_date', 'points_reset', 'note']];
  cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform,
      item.ref,
      item.violation_label || item.violation,
      item.points,
      item.issued_date,
      item.appeal_status,
      item.appeal_date,
      item.appeal_result_date,
      item.points_reset,
      String(item.note || '').replace(/[\n,]/g, ' '),
    ]);
  });
  const csv = rows.map((row) => row.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="poin-penalti.csv"');
  res.send(csv);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not found' });
  }
  next();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Pelacak Poin Penalti running at http://localhost:' + PORT);
  });
}

module.exports = app;
