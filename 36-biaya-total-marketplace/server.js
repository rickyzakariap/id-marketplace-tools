const express = require('express');
const path = require('path');
const { calculate, MARKETPLACES, DEFAULTS, SOURCES } = require('./lib/calculator');

const app = express();
const PORT = 8036;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Contoh kuitansi nyata (Skorra, 2026): harga transaksi Rp 499.000,
// total potongan platform Rp 119.673 (~24%) - dipakai sebagai preset edukasi.
const EXAMPLE = {
  marketplace: 'shopee',
  hpp: 250000,
  harga_jual: 499000,
  qty: 1,
  komisi_admin_pct: 9,
  gratis_ongkir_pct: 10,
  affiliate_pct: 4.66,
  iklan_pct: 0,
  biaya_proses_rp: 1250,
  layanan_logistik_rp: 350,
  kemasan_rp: 0,
  retur_pct: 0,
  retur_fee_rp: 10000,
  target_margin_pct: 20,
};

app.get('/api/marketplaces', (req, res) => {
  res.json(MARKETPLACES);
});

app.get('/api/sources', (req, res) => {
  res.json(SOURCES);
});

app.get('/api/example', (req, res) => {
  res.json(EXAMPLE);
});

app.get('/api/defaults', (req, res) => {
  res.json(DEFAULTS);
});

app.post('/api/calculate', (req, res) => {
  const result = calculate(req.body || {});
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not found' });
  }
  next();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Biaya Total Marketplace running at http://localhost:' + PORT);
  });
}

module.exports = app;
