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
  meta,
} = require('./lib/kampanye');

const app = express();
const PORT = 8045;
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
  res.json(meta());
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
  if (patch.indicators && Array.isArray(patch.indicators)) {
    mergedRaw.indicators = patch.indicators;
  }
  if (patch.evidence && Array.isArray(patch.evidence)) {
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
  const today = new Date();
  const end = todayISO(today);
  const seeds = [
    {
      platform: 'tiktok',
      enrollment_method: 'popup',
      campaign_name: 'Voucher Boost Campaign Payday',
      campaign_start: addDays(end, -19),
      campaign_end: addDays(end, 4),
      normal_price: 35900,
      campaign_price: 22410,
      seller_price: 22410,
      hpp: 18000,
      fee_rate: 10,
      units_sold: 6870,
      product_name: 'Sandal Slipper Premium',
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      status: 'menunggu_jawaban',
      ticket: 'TIKET-CONTOH-001',
      discovered_date: addDays(end, -6),
      followup_date: addDays(end, -2),
      problem: 'harga_turun',
      indicators: ['no_registration_record', 'price_differs', 'no_notification', 'popup_claim', 'no_consent_log', 'sales_spike'],
      evidence: ['price_screenshot', 'campaign_page', 'transaction_export', 'chat_rm', 'settlement'],
      note: 'Kampanye masih berjalan. Menunggu jawaban audit log dari platform.',
    },
    {
      platform: 'tiktok',
      enrollment_method: 'auto_registration',
      campaign_name: 'CFV Payday Bulan Lalu',
      campaign_start: addDays(end, -45),
      campaign_end: addDays(end, -38),
      normal_price: 120000,
      campaign_price: 84000,
      seller_price: 84000,
      hpp: 70000,
      fee_rate: 10,
      units_sold: 120,
      product_name: 'Tas Kanvas Lipat',
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      status: 'dilaporkan',
      ticket: 'TIKET-CONTOH-002',
      discovered_date: addDays(end, -30),
      followup_date: addDays(end, -20),
      problem: 'data_tidak_transparan',
      indicators: ['no_registration_record', 'price_differs', 'auto_registration', 'no_consent_log'],
      evidence: ['price_screenshot', 'campaign_page', 'registration_record', 'transaction_export', 'price_history'],
      note: 'Diduga ikut CFV auto-registration. Sudah dilaporkan, follow-up sudah lewat 14 hari.',
    },
    {
      platform: 'shopee',
      enrollment_method: 'tidak_tahu',
      campaign_name: 'Program Diskon Toko',
      campaign_start: addDays(end, -60),
      campaign_end: addDays(end, -53),
      normal_price: 50000,
      campaign_price: 45000,
      seller_price: 45000,
      hpp: 30000,
      fee_rate: 8,
      units_sold: 40,
      product_name: 'Botol Minum 1 Liter',
      store_name: 'Toko Contoh Tiga',
      store_id: 'toko-contoh-tiga',
      status: 'selesai',
      ticket: '',
      discovered_date: addDays(end, -50),
      followup_date: '',
      problem: 'kompensasi',
      indicators: ['price_differs', 'no_notification'],
      evidence: ['price_screenshot', 'campaign_page', 'transaction_export', 'timeline'],
      note: 'Dampak kecil, sudah selesai setelah klarifikasi.',
    },
  ];

  const cases = seeds.map((item, index) => {
    const checked = validateCase(item, today);
    return Object.assign({}, checked.item, {
      id: 'k' + (index + 1),
      created_at: new Date().toISOString(),
    });
  });
  writeCases(cases);
  res.json(summary(cases, today));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'store_name', 'store_id', 'product_name', 'campaign_name',
    'campaign_start', 'campaign_end', 'normal_price', 'campaign_price', 'seller_price',
    'hpp', 'fee_rate', 'units_sold', 'discount_pct', 'loss_per_unit', 'total_loss',
    'indicators_score', 'readiness_score', 'case_status', 'ticket', 'followup_date',
    'flags', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    if (!item.timeline) return;
    rows.push([
      item.id,
      item.platform_name,
      item.store_name,
      item.store_id,
      item.product_name,
      item.campaign_name,
      item.timeline.campaign_start,
      item.timeline.campaign_end,
      item.economics.normal_price,
      item.economics.campaign_price,
      item.economics.seller_price,
      item.economics.hpp,
      item.economics.fee_rate,
      item.economics.units_sold,
      item.economics.discount_pct,
      item.economics.loss_per_unit,
      item.economics.total_loss,
      item.assessment.score,
      item.readiness.score,
      item.case_status_label,
      item.ticket,
      item.followup_date,
      item.flags.join(' | '),
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kampanye-sepihak.csv"');
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
    console.log('Pemeriksa Kampanye Sepihak berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
