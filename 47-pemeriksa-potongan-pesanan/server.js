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
} = require('./lib/audit');

const app = express();
const PORT = 8047;
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
  if (patch.manual_signals && Array.isArray(patch.manual_signals)) {
    mergedRaw.manual_signals = patch.manual_signals;
  }
  if (patch.signals && Array.isArray(patch.signals)) {
    mergedRaw.manual_signals = patch.signals;
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
      order_state: 'batal_sebelum_kirim',
      return_cause: 'tidak_ada',
      shipping_policy: 'grace',
      order_id: 'CONTOH-BATAL-001',
      product_name: 'Masker Kain Premium',
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      seller_name: 'Pemilik Toko Contoh',
      contact: '0812xxxxxxx',
      ticket: 'TIKET-CONTOH-001',
      order_date: addDays(end, -8),
      settlement_date: addDays(end, -2),
      followup_date: addDays(end, -1),
      unit_price: 150000,
      discount_per_unit: 0,
      qty: 2,
      platform_rate: 8,
      dynamic_rate: 4,
      shipping_per_direction: 12000,
      shipping_directions: 1,
      buyer_shipping_paid: 12000,
      refund_to_buyer: 300000,
      actual_commission: 36000,
      actual_processing: 1250,
      actual_shipping: 0,
      actual_other: 0,
      orders_per_month: 10,
      chronology: 'Pesanan dibatalkan pembeli sebelum paket diserahkan ke kurir. Dana sudah direfund penuh, tetapi komisi dan biaya pemrosesan masih muncul di settlement.',
      note: 'Contoh ilustrasi. Nominal adalah contoh, bukan data nyata.',
      status: 'menunggu_rincian',
      letter_type: 'keberatan',
      manual_signals: ['rincian_tidak_diminta'],
      evidence: ['settlement_detail', 'order_detail', 'cancel_proof', 'rate_card', 'timeline'],
    },
    {
      platform: 'tiktok',
      order_state: 'retur_setelah_kirim',
      return_cause: 'pembeli',
      shipping_policy: 'kontribusi_5rb',
      order_id: 'CONTOH-RETUR-002',
      product_name: 'Lampu Meja Keramik',
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      seller_name: 'Pemilik Toko Dua',
      contact: '0813xxxxxxx',
      ticket: 'TIKET-CONTOH-002',
      order_date: addDays(end, -20),
      settlement_date: addDays(end, -4),
      followup_date: addDays(end, -2),
      unit_price: 250000,
      discount_per_unit: 10000,
      qty: 1,
      platform_rate: 6.5,
      dynamic_rate: 3,
      shipping_per_direction: 18000,
      shipping_directions: 2,
      buyer_shipping_paid: 18000,
      refund_to_buyer: 240000,
      actual_commission: 22800,
      actual_processing: 1250,
      actual_shipping: 36000,
      actual_other: 0,
      orders_per_month: 4,
      chronology: 'Pembeli mengembalikan barang karena berubah pikiran. Paket kembali dalam kondisi baik. Penjual melihat ongkir dua arah dibebankan penuh.',
      note: 'Contoh retur karena kesalahan pembeli.',
      status: 'keberatan_dikirim',
      letter_type: 'keberatan',
      manual_signals: ['potongan_berulang', 'cs_hanya_template'],
      evidence: ['settlement_detail', 'order_detail', 'refund_proof', 'rate_card', 'return_shipping', 'timeline'],
    },
    {
      platform: 'tiktok',
      order_state: 'selesai',
      return_cause: 'tidak_ada',
      shipping_policy: 'grace',
      order_id: 'CONTOH-SELESAI-003',
      product_name: 'Kue Kering 500 Gram',
      store_name: 'Toko Contoh Tiga',
      store_id: 'toko-contoh-tiga',
      seller_name: 'Pemilik Toko Tiga',
      contact: '0814xxxxxxx',
      ticket: '',
      order_date: addDays(end, -30),
      settlement_date: addDays(end, -20),
      followup_date: '',
      unit_price: 120000,
      discount_per_unit: 0,
      qty: 1,
      platform_rate: 8,
      dynamic_rate: 0,
      shipping_per_direction: 12000,
      shipping_directions: 1,
      buyer_shipping_paid: 12000,
      refund_to_buyer: 0,
      actual_commission: 9600,
      actual_processing: 1250,
      actual_shipping: 0,
      actual_other: 0,
      orders_per_month: 0,
      chronology: 'Pesanan selesai tanpa sengketa. Tidak ada potongan yang perlu dipertanyakan.',
      note: 'Selesai tanpa kendala.',
      status: 'selesai',
      letter_type: 'rincian',
      manual_signals: [],
      evidence: ['settlement_detail', 'order_detail', 'timeline'],
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
    'id', 'platform', 'store_name', 'store_id', 'order_id', 'product_name',
    'order_date', 'settlement_date', 'followup_date', 'order_state', 'return_cause',
    'shipping_policy', 'unit_price', 'discount_per_unit', 'qty', 'platform_rate',
    'dynamic_rate', 'shipping_per_direction', 'shipping_directions', 'buyer_shipping_paid',
    'refund_to_buyer', 'actual_commission', 'actual_processing', 'actual_shipping',
    'actual_other', 'actual_total', 'expected_total', 'overcharge', 'overcharge_pct',
    'estimated_settlement', 'monthly_leak', 'case_status', 'ticket', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform,
      item.store_name,
      item.store_id,
      item.order_id,
      item.product_name,
      item.order_date,
      item.settlement_date,
      item.followup_date,
      item.order_state_label,
      item.return_cause,
      item.shipping_policy,
      item.unit_price,
      item.discount_per_unit,
      item.qty,
      item.platform_rate,
      item.dynamic_rate,
      item.shipping_per_direction,
      item.shipping_directions,
      item.buyer_shipping_paid,
      item.refund_to_buyer,
      item.actual_commission,
      item.actual_processing,
      item.actual_shipping,
      item.actual_other,
      item.actual_total,
      item.expected_total,
      item.overcharge,
      item.overcharge_pct,
      item.estimated_settlement,
      item.monthly_leak,
      item.status_label,
      item.ticket,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="potongan-pesanan-batal.csv"');
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
    console.log('Pemeriksa Potongan Pesanan Batal berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
