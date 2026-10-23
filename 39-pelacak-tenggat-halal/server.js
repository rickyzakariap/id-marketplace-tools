const express = require('express');
const path = require('path');
const {
  analyze,
  readiness,
  buildExample,
  CATEGORIES,
  SCALES,
  ORIGINS,
  CERTIFICATION_STATUS,
  RULES,
  READINESS_ITEMS,
  SOURCES,
  DEFAULTS,
  FACILITATION,
} = require('./lib/halal');

const app = express();
const PORT = 8039;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/meta', (req, res) => {
  res.json({
    categories: CATEGORIES,
    scales: SCALES,
    origins: ORIGINS,
    certification_status: CERTIFICATION_STATUS,
    rules: RULES,
    readiness_items: READINESS_ITEMS,
    sources: SOURCES,
    defaults: DEFAULTS,
    facilitation: FACILITATION,
  });
});

app.get('/api/example', (req, res) => {
  res.json(buildExample());
});

app.post('/api/analyze', (req, res) => {
  const result = analyze(req.body || {}, new Date());
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/readiness', (req, res) => {
  const result = readiness(req.body || {});
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.listen(PORT, () => {
  console.log('Pelacak Tenggat Wajib Halal berjalan di http://localhost:' + PORT);
});
