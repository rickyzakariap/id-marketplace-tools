const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  analyze,
  readiness,
  buildLetter,
  buildExample,
  validateCase,
  summary,
  todayISO,
  addDays,
  PLATFORMS,
  REASONS,
  STATUSES,
  FACT_OPTIONS,
  EVIDENCE,
  SOURCES,
  DEFAULTS,
} = require('./lib/appeal');

const app = express();
const PORT = 8041;
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
  return 'p' + (max + 1);
}

function csvCell(value) {
  let text = String(value === null || value === undefined ? '' : value).replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

app.get('/api/meta', (req, res) => {
  res.json({
    platforms: PLATFORMS,
    reasons: REASONS,
    statuses: STATUSES,
    fact_options: FACT_OPTIONS,
    evidence: EVIDENCE,
    sources: SOURCES,
    defaults: DEFAULTS,
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

app.post('/api/readiness', (req, res) => {
  res.json(readiness(req.body || {}));
});

app.post('/api/letter', (req, res) => {
  const result = buildLetter(req.body || {}, new Date());
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get('/api/cases', (req, res) => {
  res.json(summary(readCases(), new Date()));
});

app.post('/api/cases', (req, res) => {
  const checked = validateCase(req.body || {}, new Date());
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
  res.status(201).json(summary(cases, new Date()));
});

app.patch('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const index = cases.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kasus tidak ditemukan' });

  const base = cases[index];
  const patch = req.body || {};
  const mergedRaw = Object.assign({}, base, patch);
  if (patch.facts && typeof patch.facts === 'object') {
    mergedRaw.facts = Object.assign({}, base.facts || {}, patch.facts);
  }
  if (Array.isArray(patch.evidence)) {
    mergedRaw.evidence = patch.evidence;
  }

  const merged = validateCase(mergedRaw, new Date());
  if (merged.error) return res.status(400).json(merged);
  cases[index] = Object.assign({}, base, merged.item);
  writeCases(cases);
  res.json(summary(cases, new Date()));
});

app.delete('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const next = cases.filter((item) => item.id !== req.params.id);
  if (next.length === cases.length) return res.status(404).json({ error: 'Kasus tidak ditemukan' });
  writeCases(next);
  res.json(summary(next, new Date()));
});

app.post('/api/seed', (req, res) => {
  const today = todayISO(new Date());
  const seeds = [
    {
      platform: 'shopee',
      reason: 'nikotin',
      reason_text: 'Produk dianggap mengandung tembakau, nikotin, rokok elektronik, dan shisha',
      product_name: 'Kapas bayi Medisoft',
      sku: 'MEDISOFT-100',
      category: 'Perlengkapan bayi',
      status: 'ditutup',
      price: 45000,
      cost: 32000,
      stock_units: 120,
      units_per_day: 8,
      ad_spend_per_day: 15000,
      removed_date: addDays(today, -10),
      appeal_date: addDays(today, -9),
      restored_date: '',
      last_follow_up: addDays(today, -2),
      ticket: 'TIKET-CONTOH-001',
      note: 'Contoh dari Media Konsumen 24 Oktober 2026. Angka ekonomi adalah ilustrasi.',
      facts: {
        reason_matches: 'tidak',
        listing_unchanged: 'ya',
        permit: 'tidak_berlaku',
        written_reason: 'tidak',
        similar_active: 'ya',
        forced_statement: 'ya',
      },
      evidence: ['reason_screenshot', 'listing_before', 'product_photo', 'invoice', 'ticket', 'appeal_history', 'statement_copy', 'chronology'],
    },
    {
      platform: 'shopee',
      reason: 'mencurigakan',
      reason_text: 'Indikasi aktivitas mencurigakan tanpa rincian',
      product_name: 'Seluruh listing toko',
      sku: '',
      category: 'Campuran',
      status: 'ditolak',
      price: 150000,
      cost: 100000,
      stock_units: 300,
      units_per_day: 20,
      ad_spend_per_day: 50000,
      removed_date: addDays(today, -96),
      appeal_date: addDays(today, -95),
      restored_date: '',
      last_follow_up: addDays(today, -30),
      ticket: 'TIKET-CONTOH-002',
      note: 'Contoh dari Media Konsumen 22 Juli 2026. Angka ekonomi adalah ilustrasi.',
      facts: {
        reason_matches: 'tidak_yakin',
        listing_unchanged: 'ya',
        permit: 'tidak_berlaku',
        written_reason: 'tidak',
        similar_active: 'tidak',
        forced_statement: 'tidak',
      },
      evidence: ['reason_screenshot', 'listing_before', 'ticket', 'chronology'],
    },
    {
      platform: 'tokopedia',
      reason: 'kategori_salah',
      reason_text: 'Produk masuk kategori yang tidak sesuai',
      product_name: 'Contoh produk salah kategori',
      sku: 'CONTOH-003',
      category: 'Rumah tangga',
      status: 'dipulihkan',
      price: 89000,
      cost: 60000,
      stock_units: 40,
      units_per_day: 5,
      ad_spend_per_day: 5000,
      removed_date: addDays(today, -20),
      appeal_date: addDays(today, -19),
      restored_date: addDays(today, -14),
      last_follow_up: addDays(today, -14),
      ticket: 'TIKET-CONTOH-003',
      note: 'Contoh ilustrasi tool, bukan kasus berita. Angka ekonomi adalah ilustrasi.',
      facts: {
        reason_matches: 'tidak',
        listing_unchanged: 'ya',
        permit: 'tidak_berlaku',
        written_reason: 'ya',
        similar_active: 'ya',
        forced_statement: 'tidak',
      },
      evidence: ['reason_screenshot', 'listing_before', 'product_photo', 'invoice', 'edit_history', 'ticket', 'appeal_history', 'similar_listing', 'chronology'],
    },
  ];

  const cases = seeds.map((item, index) => Object.assign({}, validateCase(item, new Date()).item, {
    id: 'p' + (index + 1),
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases, new Date()));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'reason', 'product_name', 'sku', 'category', 'status',
    'removed_date', 'appeal_date', 'restored_date', 'ticket', 'price', 'cost',
    'stock_units', 'units_per_day', 'ad_spend_per_day', 'offline_days',
    'lost_revenue', 'lost_profit', 'stock_value', 'ad_waste', 'total_exposure',
    'argument_score', 'readiness_score', 'last_follow_up', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform_name,
      item.reason_label,
      item.product_name,
      item.sku,
      item.category,
      item.status_label,
      item.removed_date,
      item.appeal_date,
      item.restored_date,
      item.ticket,
      item.impact.price,
      item.impact.cost,
      item.impact.stock_units,
      item.impact.units_per_day,
      item.impact.ad_spend_per_day,
      item.impact.offline_days,
      item.impact.lost_revenue,
      item.impact.lost_profit,
      item.impact.stock_value,
      item.impact.ad_waste,
      item.impact.total_exposure,
      item.argument.score,
      item.readiness.score,
      item.last_follow_up,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="banding-produk.csv"');
  res.send(rows.join('\n'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload terlalu besar. Maksimal 64 KB.' });
  }
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Format JSON tidak valid.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Banding Produk Diblokir berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
