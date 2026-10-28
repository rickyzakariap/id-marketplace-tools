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
  TRIGGERS,
  SYMPTOMS,
  STATUSES,
  FACT_OPTIONS,
  EVIDENCE,
  SOURCES,
  DEFAULTS,
} = require('./lib/promo');

const app = express();
const PORT = 8042;
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
  return 'k' + (max + 1);
}

function csvCell(value) {
  let text = String(value === null || value === undefined ? '' : value).replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

app.get('/api/meta', (req, res) => {
  res.json({
    platforms: PLATFORMS,
    triggers: TRIGGERS,
    symptoms: SYMPTOMS,
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
  if (Array.isArray(patch.symptoms)) {
    mergedRaw.symptoms = patch.symptoms;
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
      trigger: 'harga_coret',
      trigger_text: 'Membuat harga coret pada 25 Juli 2026, muncul peringatan penalti promosi',
      store_name: 'Ngalamngolshop',
      store_id: 'ngalamngolshop',
      ticket: 'TIKET-CONTOH-001',
      status: 'eskalasi',
      locked_date: addDays(today, -95),
      restored_date: '',
      last_follow_up: addDays(today, -2),
      price: 65000,
      cost: 52000,
      units_before: 40,
      units_during: 24,
      ad_spend_per_day: 20000,
      chat_count: 8,
      symptoms: ['voucher_instant', 'promo_berbayar', 'checkout_gagal', 'star_seller_hilang'],
      facts: {
        points: 'nol',
        warning: 'ya',
        quarter_reset: 'ya',
        written_reason: 'tidak',
        star_seller_now: 'tidak',
      },
      note: 'Contoh dari Media Konsumen 27 Oktober 2026. Angka ekonomi adalah ilustrasi.',
      evidence: ['voucher_screenshot', 'checkout_recording', 'points_zero', 'chat_tickets', 'trigger_evidence', 'star_history', 'program_list', 'sales_before_after'],
    },
    {
      platform: 'shopee',
      trigger: 'lonjakan_pesanan',
      trigger_text: 'Pesanan naik dari sekitar 100 menjadi 1.000 resi per hari setelah event 1 sampai 6 Oktober 2026',
      store_name: 'toserbashakiel',
      store_id: 'toserbashakiel',
      ticket: '2109830730719211531',
      status: 'lapor_cs',
      locked_date: addDays(today, -15),
      restored_date: '',
      last_follow_up: addDays(today, -1),
      price: 30000,
      cost: 24000,
      units_before: 200,
      units_during: 80,
      ad_spend_per_day: 25000,
      chat_count: 3,
      symptoms: ['voucher_kategori', 'checkout_gagal', 'star_seller_hilang'],
      facts: {
        points: 'nol',
        warning: 'tidak',
        quarter_reset: 'belum',
        written_reason: 'tidak',
        star_seller_now: 'tidak',
      },
      note: 'Contoh dari Media Konsumen 16 Oktober 2026. Angka ekonomi adalah ilustrasi.',
      evidence: ['voucher_screenshot', 'checkout_recording', 'points_zero', 'chat_tickets', 'star_history', 'account_health'],
    },
    {
      platform: 'tokopedia',
      trigger: 'kata_kunci',
      trigger_text: 'Kata kunci produk ditandai otomatis',
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      ticket: 'TIKET-CONTOH-003',
      status: 'dibuka',
      locked_date: addDays(today, -40),
      restored_date: addDays(today, -32),
      last_follow_up: addDays(today, -32),
      price: 120000,
      cost: 90000,
      units_before: 12,
      units_during: 5,
      ad_spend_per_day: 10000,
      chat_count: 2,
      symptoms: ['voucher_toko', 'promosi_lain'],
      facts: {
        points: 'nol',
        warning: 'tidak',
        quarter_reset: 'belum',
        written_reason: 'ya',
        star_seller_now: 'ya',
      },
      note: 'Contoh ilustrasi tool, bukan kasus berita. Angka ekonomi adalah ilustrasi.',
      evidence: ['voucher_screenshot', 'points_zero', 'chat_tickets', 'account_health', 'chronology', 'written_reply'],
    },
  ];

  const cases = seeds.map((item, index) => Object.assign({}, validateCase(item, new Date()).item, {
    id: 'k' + (index + 1),
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases, new Date()));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'store_name', 'store_id', 'trigger', 'trigger_text', 'status',
    'locked_date', 'restored_date', 'last_follow_up', 'ticket', 'price', 'cost',
    'units_before', 'units_during', 'ad_spend_per_day', 'chat_count', 'locked_days',
    'lost_units', 'lost_revenue', 'lost_profit', 'ad_waste', 'diagnosis_score',
    'readiness_score', 'symptoms', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform_name,
      item.store_name,
      item.store_id,
      item.trigger_label,
      item.trigger_text,
      item.status_label,
      item.locked_date,
      item.restored_date,
      item.last_follow_up,
      item.ticket,
      item.impact.price,
      item.impact.cost,
      item.impact.units_before,
      item.impact.units_during,
      item.impact.ad_spend_per_day,
      item.impact.chat_count,
      item.impact.locked_days,
      item.impact.lost_units,
      item.impact.lost_revenue,
      item.impact.lost_profit,
      item.impact.ad_waste,
      item.diagnosis.score,
      item.readiness.score,
      item.symptoms.map((symptom) => symptom.label).join('; '),
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kunci-promosi.csv"');
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
    console.log('Pelacak Kunci Promosi berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
