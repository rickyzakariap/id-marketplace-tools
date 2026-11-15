'use strict';

const express = require('express');
const path = require('path');
const {
  meta,
  example,
  analyze,
  scenario,
  csvRows,
} = require('./lib/stok');

const app = express();
const PORT = 8056;

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.post('/api/scenario', (req, res) => {
  try {
    res.json(scenario(req.body || {}));
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/export', (req, res) => {
  try {
    const csv = csvRows(req.body || {});
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="kalkulator-stok-mati.csv"'
    );
    res.send('\uFEFF' + csv);
  } catch (error) {
    sendError(res, error);
  }
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
    console.log('Kalkulator Stok Mati berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
