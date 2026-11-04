'use strict';

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
  meta,
} = require('./lib/pajak');

const app = express();
const PORT = 8049;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cases.json');
const DATA_TMP = path.join(DATA_DIR, 'cases.json.tmp');

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
  fs.writeFileSync(DATA_TMP, JSON.stringify({ cases }, null, 2));
  fs.renameSync(DATA_TMP, DATA_FILE);
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
  res.json(meta(new Date()));
});

app.get('/api/example', (req, res) => {
  res.json(buildExample(new Date()));
});

app.post('/api/analyze', (req, res) => {
  const result = analyze(req.body || {}, new Date());
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/readiness', (req, res) => {
  if (!Array.isArray((req.body || {}).evidence)) {
    return res.status(400).json({ error: 'Daftar bukti wajib berupa array' });
  }
  res.json(readiness(req.body || {}));
});

app.post('/api/letter', (req, res) => {
  const result = buildLetter(req.body || {}, new Date());
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.get('/api/cases', (req, res) => {
  res.json(summary(readCases(), new Date()));
});

app.post('/api/cases', (req, res) => {
  const checked = validateCase(req.body || {}, new Date());
  if (checked.error) return res.status(400).json(checked);

  const cases = readCases();
  const item = Object.assign({}, checked.item, {
    id: nextId(cases),
    created_at: new Date().toISOString(),
  });
  cases.push(item);
  writeCases(cases);
  res.status(201).json({ item: item, summary: summary(cases, new Date()) });
});

app.patch('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const index = cases.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kasus tidak ditemukan' });

  const merged = Object.assign({}, cases[index], req.body || {}, {
    id: cases[index].id,
    created_at: cases[index].created_at,
    updated_at: new Date().toISOString(),
  });
  const checked = validateCase(merged, new Date());
  if (checked.error) return res.status(400).json(checked);

  cases[index] = Object.assign({}, checked.item, {
    id: merged.id,
    created_at: merged.created_at,
    updated_at: merged.updated_at,
  });
  writeCases(cases);
  res.json({ item: cases[index], summary: summary(cases, new Date()) });
});

app.delete('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const index = cases.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kasus tidak ditemukan' });
  cases.splice(index, 1);
  writeCases(cases);
  res.json(summary(cases, new Date()));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'store_name', 'seller_name', 'period_start', 'period_end',
    'rate', 'pkp', 'status', 'verdict', 'monthly_spend', 'monthly_ppn',
    'potential_ppn', 'annual_ppn', 'creditable_ppn', 'cost_ppn',
    'ticket', 'followup_date', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.store_name,
      item.seller_name,
      item.period_start,
      item.period_end,
      item.rate,
      item.pkp,
      item.status_label,
      item.verdict_label,
      item.monthly_spend,
      item.monthly_ppn,
      item.potential_ppn,
      item.annual_ppn,
      item.creditable_ppn,
      item.cost_ppn,
      item.ticket,
      item.followup_date,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="pemeriksa-pajak-digital.csv"');
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
    console.log('Pemeriksa Pajak Digital berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
