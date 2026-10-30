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
  currentPeriod,
  addDays,
  todayISO,
  meta,
} = require('./lib/faktur');

const app = express();
const PORT = 8044;
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
  return 'f' + (max + 1);
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
  if (patch.fees && typeof patch.fees === 'object') {
    mergedRaw.fees = Object.assign({}, base.fees || {}, patch.fees);
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
  const current = currentPeriod(today);
  const previousDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previous = todayISO(previousDate).slice(0, 7);
  const twoMonthsDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const twoMonths = todayISO(twoMonthsDate).slice(0, 7);

  const seeds = [
    {
      platform: 'shopee',
      period: current,
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      status: 'menunggu',
      ticket: '',
      fee_total: 0,
      ppn_amount: 0,
      received_date: '',
      note: 'Periode berjalan. Data penagihan sudah diperbarui, menunggu faktur terbit.',
      fees: { layanan: 1250000, affiliate: 0, iklan: 0, promo: 0, logistik: 0 },
      ppn_rate: 11,
      includes_ppn: 'tidak',
    },
    {
      platform: 'shopee',
      period: previous,
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      status: 'tidak_ada',
      ticket: 'TIKET-CONTOH-001',
      fee_total: 0,
      ppn_amount: 0,
      received_date: '',
      note: 'Faktur tagihan ada, faktur pajak belum muncul di Seller Center.',
      fees: { layanan: 980000, affiliate: 210000, iklan: 450000, promo: 0, logistik: 0 },
      ppn_rate: 11,
      includes_ppn: 'tidak',
    },
    {
      platform: 'shopee',
      period: twoMonths,
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      status: 'tersedia',
      ticket: '',
      fee_total: 0,
      ppn_amount: 0,
      received_date: addDays(todayISO(today), -45),
      note: 'Faktur sudah diterima dan diarsipkan untuk kredit pajak.',
      fees: { layanan: 640000, affiliate: 0, iklan: 120000, promo: 0, logistik: 0 },
      ppn_rate: 11,
      includes_ppn: 'tidak',
    },
  ];

  const cases = seeds.map((item, index) => {
    const checked = validateCase(item, today);
    return Object.assign({}, checked.item, {
      id: 'f' + (index + 1),
      created_at: new Date().toISOString(),
    });
  });
  writeCases(cases);
  res.json(summary(cases, today));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'store_name', 'store_id', 'period', 'status', 'ticket',
    'fee_total', 'ppn_amount', 'ppn_rate', 'availability_date', 'complaint_date',
    'days_to_complaint', 'received_date', 'flags', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    if (!item.timeline) return;
    rows.push([
      item.id,
      item.platform_name,
      item.store_name,
      item.store_id,
      item.timeline.period,
      item.case_status_label,
      item.ticket,
      item.ppn.total,
      item.ppn.ppn,
      item.ppn.rate,
      item.timeline.availability,
      item.timeline.complaint,
      item.timeline.days_to_complaint,
      item.received_date,
      item.flags.join(' | '),
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="faktur-pajak.csv"');
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
    console.log('Pemeriksa Faktur Pajak berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
