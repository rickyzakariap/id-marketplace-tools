const express = require('express');
const path = require('path');
const {
  calculateImpact,
  buildLetter,
  ISSUES,
  PLATFORMS,
  SOURCES,
  DEFAULTS,
  EXAMPLE,
} = require('./lib/recovery');

const app = express();
const PORT = 8037;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/issues', (req, res) => {
  res.json(ISSUES);
});

app.get('/api/platforms', (req, res) => {
  res.json(PLATFORMS);
});

app.get('/api/sources', (req, res) => {
  res.json(SOURCES);
});

app.get('/api/defaults', (req, res) => {
  res.json(DEFAULTS);
});

app.get('/api/example', (req, res) => {
  res.json(EXAMPLE);
});

app.post('/api/analyze', (req, res) => {
  const result = calculateImpact(req.body || {});
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/letter', (req, res) => {
  res.json(buildLetter(req.body || {}));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not found' });
  }
  next();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Pemulih Toko Marketplace running at http://localhost:' + PORT);
  });
}

module.exports = app;
