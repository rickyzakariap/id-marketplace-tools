'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  meta,
  example,
  analyze,
  readiness,
  letter,
  summarizeCases,
  csvRows,
  normalizeInput,
  validateAnalysis,
} = require('./lib/resi');

const app = express();
const PORT = 8054;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cases.json');
const DATA_TMP = path.join(DATA_DIR, 'cases.json.tmp');

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readCases() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed.cases) ? parsed.cases : [];
  } catch (error) {
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
    const value = Number(String(item.id || '').replace(/\D/g, ''));
    if (Number.isFinite(value) && value > max) max = value;
  });
  return 'r' + (max + 1);
}

function validateCase(raw) {
  const input = normalizeInput(raw);
  validateAnalysis(input);
  if (!input.store_name) {
    throw new Error('Nama toko wajib diisi untuk menyimpan kasus.');
  }
  if (!input.resi) {
    throw new Error('Nomor resi wajib diisi untuk menyimpan kasus.');
  }
  return input;
}

function sendError(res, error) {
  const message = error && error.message ? error.message : 'Permintaan tidak valid.';
  res.status(400).json({ error: message });
}

app.get('/api/meta', (req, res) => {
  res.json(meta());
});

app.get('/api/example', (req, res) => {
  res.json(example());
});

app.post('/api/analyze', (req, res) => {
  try {
    res.json(analyze(req.body || {}));
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/readiness', (req, res) => {
  res.json(readiness(req.body || {}));
});

app.post('/api/letter', (req, res) => {
  try {
    res.json(letter(req.body || {}));
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/cases', (req, res) => {
  res.json(summarizeCases(readCases()));
});

app.post('/api/cases', (req, res) => {
  try {
    const input = validateCase(req.body || {});
    const cases = readCases();
    const item = Object.assign({}, input, {
      id: nextId(cases),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    cases.push(item);
    writeCases(cases);
    res.status(201).json({ item: item, summary: summarizeCases(cases) });
  } catch (error) {
    sendError(res, error);
  }
});

app.patch('/api/cases/:id', (req, res) => {
  try {
    const cases = readCases();
    const index = cases.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Kasus tidak ditemukan.' });
    const merged = Object.assign({}, cases[index], req.body || {}, {
      id: cases[index].id,
      created_at: cases[index].created_at,
      updated_at: new Date().toISOString(),
    });
    const input = validateCase(merged);
    cases[index] = Object.assign({}, input, {
      id: merged.id,
      created_at: merged.created_at,
      updated_at: merged.updated_at,
    });
    writeCases(cases);
    res.json({ item: cases[index], summary: summarizeCases(cases) });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/cases/:id', (req, res) => {
  const cases = readCases();
  const index = cases.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kasus tidak ditemukan.' });
  cases.splice(index, 1);
  writeCases(cases);
  res.json(summarizeCases(cases));
});

app.post('/api/seed', (req, res) => {
  try {
    const input = validateCase(example());
    const cases = readCases();
    const item = Object.assign({}, input, {
      id: nextId(cases),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    cases.push(item);
    writeCases(cases);
    res.status(201).json({ item: item, summary: summarizeCases(cases) });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/export', (req, res) => {
  const csv = csvRows(readCases());
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="pemeriksa-resi-fiktif.csv"');
  res.send('\uFEFF' + csv);
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error && error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload terlalu besar. Maksimal 64 KB.' });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ error: 'Format JSON tidak valid.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Terjadi kesalahan server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Pemeriksa Resi Fiktif berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
