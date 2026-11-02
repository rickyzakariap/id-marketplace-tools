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
} = require('./lib/cod');

const app = express();
const PORT = 8046;
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
  if (patch.signals && Array.isArray(patch.signals)) {
    mergedRaw.signals = patch.signals;
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
      platform: 'shopee',
      cod_method: 'reguler',
      order_status: 'belum_dikirim',
      buyer_status: 'tidak_merespons',
      order_id: '261026KUHA9AN3',
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      product_name: 'Aksesori Rajut Premium',
      seller_name: 'Pemilik Toko Contoh',
      contact: '0812xxxxxxx',
      ticket: 'TIKET-CONTOH-001',
      order_date: addDays(end, -2),
      ship_deadline: addDays(end, 1),
      cancel_requested_date: addDays(end, -1),
      followup_date: addDays(end, -1),
      order_value: 185000,
      hpp: 110000,
      packaging_cost: 3000,
      handling_cost: 5000,
      extra_cost: 0,
      shipping_cost: 10000,
      fee_rate: 0,
      problem: 'pembeli_fiktif',
      letter_type: 'pembatalan',
      status: 'menunggu_cs',
      chronology: 'Pesanan COD masuk, pembeli mengajukan pembatalan lalu menariknya. Chat konfirmasi alamat tidak dibalas.',
      note: 'Menunggu keputusan tertulis CS sebelum tenggat kirim.',
      signals: ['cancel_withdrawn', 'buyer_no_response', 'address_change', 'high_value'],
      evidence: ['order_screenshot', 'chat_history', 'cancel_request', 'cs_ticket', 'cancel_withdrawal', 'shipping_deadline', 'timeline'],
    },
    {
      platform: 'shopee',
      cod_method: 'reguler',
      order_status: 'retur',
      buyer_status: 'menolak',
      order_id: 'CONTOH-RETUR-002',
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      product_name: 'Lampu Meja Keramik',
      seller_name: 'Pemilik Toko Dua',
      contact: '0813xxxxxxx',
      ticket: 'TIKET-CONTOH-002',
      order_date: addDays(end, -10),
      ship_deadline: addDays(end, -8),
      cancel_requested_date: '',
      return_received_date: addDays(end, -1),
      followup_date: addDays(end, -1),
      order_value: 250000,
      hpp: 150000,
      packaging_cost: 4000,
      handling_cost: 6000,
      extra_cost: 0,
      shipping_cost: 8000,
      fee_rate: 0,
      problem: 'retur_rusak',
      letter_type: 'klaim_retur',
      status: 'retur',
      chronology: 'Pembeli menolak membayar saat kurir datang. Paket kembali dan kemasan luar penyok.',
      note: 'Rekam video unboxing lalu ajukan klaim sebelum batas 7 hari.',
      signals: ['buyer_no_response', 'previous_cancel', 'fragile_product'],
      evidence: ['order_screenshot', 'chat_history', 'cs_ticket', 'courier_handover', 'timeline'],
    },
    {
      platform: 'shopee',
      cod_method: 'instant',
      order_status: 'selesai',
      buyer_status: 'responsif',
      order_id: 'CONTOH-SELESAI-003',
      store_name: 'Toko Contoh Tiga',
      store_id: 'toko-contoh-tiga',
      product_name: 'Kue Kering 500 Gram',
      seller_name: 'Pemilik Toko Tiga',
      contact: '0814xxxxxxx',
      ticket: '',
      order_date: addDays(end, -20),
      ship_deadline: addDays(end, -20),
      cancel_requested_date: '',
      return_received_date: '',
      followup_date: '',
      order_value: 120000,
      hpp: 70000,
      packaging_cost: 2500,
      handling_cost: 3000,
      extra_cost: 0,
      shipping_cost: 12000,
      fee_rate: 0,
      problem: 'pembeli_fiktif',
      letter_type: 'pembatalan',
      status: 'selesai',
      chronology: 'Pesanan COD instant diterima dan dibayar. Tidak ada kendala.',
      note: 'Selesai tanpa kendala.',
      signals: [],
      evidence: ['order_screenshot', 'packaging_video', 'courier_handover', 'timeline'],
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
    'order_date', 'ship_deadline', 'order_status', 'buyer_status', 'cod_method',
    'order_value', 'hpp', 'packaging_cost', 'handling_cost', 'shipping_cost',
    'success_net', 'return_good_loss', 'return_damaged_gross', 'max_claim',
    'return_damaged_net', 'worst_case', 'risk_score', 'readiness_score',
    'case_status', 'ticket', 'followup_date', 'flags', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    if (!item.exposure) return;
    rows.push([
      item.id,
      item.platform_name,
      item.store_name,
      item.store_id,
      item.order_id,
      item.product_name,
      item.timeline.order_date,
      item.timeline.ship_deadline,
      item.order_status_label,
      item.buyer_status_label,
      item.method.label,
      item.exposure.order_value,
      item.exposure.hpp,
      item.exposure.packaging_cost,
      item.exposure.handling_cost,
      item.exposure.shipping_cost,
      item.exposure.success_net,
      item.exposure.return_good_loss,
      item.exposure.return_damaged_gross,
      item.exposure.max_claim,
      item.exposure.return_damaged_net,
      item.exposure.worst_case,
      item.risk.score,
      item.readiness.score,
      item.case_status_label,
      item.ticket,
      item.followup_date,
      item.flags.join(' | '),
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="pesanan-cod-berisiko.csv"');
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
    console.log('Pemeriksa Pesanan COD Berisiko berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
