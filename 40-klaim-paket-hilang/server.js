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
  COURIERS,
  INCIDENT_TYPES,
  STATUSES,
  EVIDENCE,
  SOURCES,
  DEFAULTS,
} = require('./lib/claim');

const app = express();
const PORT = 8040;
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
  return 'c' + (max + 1);
}

function csvCell(value) {
  let text = String(value === null || value === undefined ? '' : value).replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

app.get('/api/meta', (req, res) => {
  res.json({
    platforms: PLATFORMS,
    couriers: COURIERS,
    incident_types: INCIDENT_TYPES,
    statuses: STATUSES,
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
  res.json(buildLetter(req.body || {}, new Date()));
});

app.get('/api/cases', (req, res) => {
  res.json(summary(readCases(), new Date()));
});

app.post('/api/cases', (req, res) => {
  const checked = validateCase(req.body || {});
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
  const merged = validateCase(Object.assign({}, cases[index], req.body || {}));
  if (merged.error) return res.status(400).json(merged);
  cases[index] = Object.assign({}, cases[index], merged.item);
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
      courier: 'spx',
      incident_type: 'hilang',
      ref: '2610097HP352JR',
      tracking_ref: 'SPXID06396809073A',
      incident_date: addDays(today, -18),
      report_date: addDays(today, -16),
      status: 'ditolak',
      claimed_amount: 1190000,
      received_amount: 135000,
      last_follow_up: addDays(today, -2),
      selling_price: 1190000,
      refund_to_buyer: 1190000,
      product_cost: 900000,
      shipping_cost: 20000,
      packaging_cost: 3000,
      insurance: 'tidak',
      insurance_cost: 0,
      recovered_goods_value: 0,
      normal_margin_pct: 15,
      note: 'Kompensasi Rp135.000 ditawarkan karena paket tidak diasuransikan. Contoh Media Konsumen 23 Oktober 2026.',
    },
    {
      platform: 'tokopedia',
      courier: 'blitz',
      incident_type: 'hilang',
      ref: '584853443855811904',
      tracking_ref: 'BEMAWB-00001444156',
      incident_date: addDays(today, -112),
      report_date: addDays(today, -96),
      status: 'investigasi',
      claimed_amount: 7013470,
      received_amount: 0,
      last_follow_up: addDays(today, -12),
      selling_price: 7013470,
      refund_to_buyer: 7013470,
      product_cost: 6500000,
      shipping_cost: 25000,
      packaging_cost: 5000,
      insurance: 'ya',
      insurance_cost: 0,
      recovered_goods_value: 0,
      normal_margin_pct: 12,
      note: 'Ekspedisi menunggu tagihan marketplace. Follow-up 9 September dan 13 Oktober 2026 belum ada hasil. Contoh Media Konsumen 22 Oktober 2026.',
    },
    {
      platform: 'shopee',
      courier: 'jntcargo',
      incident_type: 'isi_kosong',
      ref: '2104138664265691172',
      tracking_ref: 'JNT-CARGO-146',
      incident_date: addDays(today, -90),
      report_date: addDays(today, -88),
      status: 'ditolak',
      claimed_amount: 14600000,
      received_amount: 0,
      last_follow_up: addDays(today, -20),
      selling_price: 14600000,
      refund_to_buyer: 14600000,
      product_cost: 13000000,
      shipping_cost: 50000,
      packaging_cost: 10000,
      insurance: 'tidak',
      insurance_cost: 0,
      recovered_goods_value: 0,
      normal_margin_pct: 10,
      note: 'CCTV packing dan serah terima sudah dikirim, laporan ditutup tanpa rincian solusi. Contoh Media Konsumen 1 Oktober 2026.',
    },
    {
      platform: 'shopee',
      courier: 'spx',
      incident_type: 'nyangkut',
      ref: '260918VITAMIN01',
      tracking_ref: 'SPXID060025783779',
      incident_date: addDays(today, -37),
      report_date: addDays(today, -36),
      status: 'lapor',
      claimed_amount: 1300000,
      received_amount: 0,
      last_follow_up: addDays(today, -30),
      selling_price: 1300000,
      refund_to_buyer: 1300000,
      product_cost: 1000000,
      shipping_cost: 18000,
      packaging_cost: 2000,
      insurance: 'tidak',
      insurance_cost: 0,
      recovered_goods_value: 0,
      normal_margin_pct: 15,
      note: 'Resi tidak bergerak lebih dari 10 hari. Laporan keterlambatan sudah dibuat. Contoh Media Konsumen 4 Oktober 2026.',
    },
  ];
  const cases = seeds.map((item, index) => Object.assign({}, validateCase(item).item, {
    id: 'c' + (index + 1),
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases, new Date()));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'courier', 'incident_type', 'ref', 'tracking_ref',
    'incident_date', 'report_date', 'status', 'claimed_amount', 'received_amount',
    'net_loss', 'compensation_gap', 'aging', 'last_follow_up', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform,
      item.courier,
      item.incident_type_label,
      item.ref,
      item.tracking_ref,
      item.incident_date,
      item.report_date,
      item.status_label,
      item.claimed_amount,
      item.received_amount,
      item.loss.net_loss,
      item.loss.compensation_gap,
      item.aging_label,
      item.last_follow_up,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="klaim-paket.csv"');
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
    console.log('Pelacak Klaim Paket Hilang dan Rusak berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
