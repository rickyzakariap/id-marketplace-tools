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
  addDays,
  todayISO,
  meta,
} = require('./lib/reviews');

const app = express();
const PORT = 8043;
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
  return 'u' + (max + 1);
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
  if (patch.facts && typeof patch.facts === 'object') {
    mergedRaw.facts = Object.assign({}, base.facts || {}, patch.facts);
  }
  if (Array.isArray(patch.evidence)) {
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
  const iso = todayISO(today);
  const seeds = [
    {
      platform: 'shopee',
      store_name: 'Hedos Printing',
      store_id: 'hedosprinting',
      status: 'lapor_platform',
      ticket: 'TIKET-CONTOH-001',
      order_id: '261028XXXXXXXX',
      order_date: addDays(iso, -90),
      review_date: addDays(iso, -80),
      resolved_date: '',
      last_follow_up: addDays(iso, -3),
      current_rating: 4.9,
      total_ratings: 320,
      bad_reviews: 1,
      target_rating: 4.9,
      review_type: 'product_quality',
      price: 45000,
      cost: 30000,
      units_before: 18,
      units_during: 12,
      facts: {
        buyer_denies: 'ya',
        review_text_match: 'tanpa_teks',
        order_status: 'selesai',
        address_valid: 'tidak_tahu',
        burst: 'tidak',
        same_account: 'tidak_tahu',
        identity_abuse: 'tidak_tahu',
        chat_reply: 'tidak_dibalas',
      },
      note: 'Contoh dari Media Konsumen 28 Oktober 2026. Angka ekonomi adalah ilustrasi.',
      evidence: [
        'review_screenshot', 'order_screenshot', 'buyer_statement', 'chat_history',
        'tickets', 'reviewer_profile', 'rating_history', 'sales_data', 'chronology', 'packing_proof',
      ],
    },
    {
      platform: 'shopee',
      store_name: 'Toko Contoh',
      store_id: 'toko-contoh',
      status: 'tiket_cs',
      ticket: 'TIKET-CONTOH-002',
      order_id: '261014XXXXXXXX',
      order_date: addDays(iso, -60),
      review_date: addDays(iso, -50),
      resolved_date: '',
      last_follow_up: addDays(iso, -1),
      current_rating: 4.8,
      total_ratings: 150,
      bad_reviews: 2,
      target_rating: 4.8,
      review_type: 'product_quality',
      price: 35000,
      cost: 25000,
      units_before: 25,
      units_during: 17,
      facts: {
        buyer_denies: 'tidak_tahu',
        review_text_match: 'tidak_selaras',
        order_status: 'selesai',
        address_valid: 'tidak_valid',
        burst: 'ya',
        same_account: 'ya',
        identity_abuse: 'ya',
        chat_reply: 'tidak_dibalas',
      },
      note: 'Contoh ilustrasi berdasarkan Media Konsumen 14 Oktober 2026. Nama toko dan angka ekonomi adalah ilustrasi.',
      evidence: [
        'review_screenshot', 'order_screenshot', 'chat_history', 'tickets', 'reviewer_profile',
        'address_proof', 'burst_list', 'identity_proof', 'rating_history', 'chronology',
      ],
    },
    {
      platform: 'shopee',
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      status: 'ditolak',
      ticket: 'TIKET-CONTOH-003',
      order_id: '260101XXXXXXXX',
      order_date: addDays(iso, -220),
      review_date: addDays(iso, -210),
      resolved_date: '',
      last_follow_up: addDays(iso, -10),
      current_rating: 4.7,
      total_ratings: 80,
      bad_reviews: 1,
      target_rating: 4.7,
      review_type: 'shipping_service',
      price: 120000,
      cost: 95000,
      units_before: 10,
      units_during: 9,
      facts: {
        buyer_denies: 'tidak',
        review_text_match: 'selaras',
        order_status: 'selesai',
        address_valid: 'valid',
        burst: 'tidak',
        same_account: 'tidak',
        identity_abuse: 'tidak',
        chat_reply: 'dibalas',
      },
      note: 'Contoh ilustrasi penilaian layanan pengiriman. Angka ekonomi adalah ilustrasi.',
      evidence: ['review_screenshot', 'order_screenshot', 'chat_history', 'tickets', 'rating_history'],
    },
  ];

  const cases = seeds.map((item, index) => Object.assign({}, validateCase(item, today).item, {
    id: 'u' + (index + 1),
    created_at: new Date().toISOString(),
  }));
  writeCases(cases);
  res.json(summary(cases, today));
});

app.get('/api/export', (req, res) => {
  const data = summary(readCases(), new Date());
  const header = [
    'id', 'platform', 'store_name', 'store_id', 'status', 'ticket', 'order_id',
    'order_date', 'review_date', 'resolved_date', 'last_follow_up', 'review_type',
    'current_rating', 'total_ratings', 'bad_reviews', 'new_average', 'rating_drop',
    'five_star_needed', 'price', 'cost', 'units_before', 'units_during', 'days_affected',
    'lost_units', 'lost_revenue', 'lost_profit', 'diagnosis_score', 'diagnosis_pattern',
    'readiness_score', 'aging_days', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    if (!item.rating || !item.impact) return;
    rows.push([
      item.id,
      item.platform_name,
      item.store_name,
      item.store_id,
      item.status_label,
      item.ticket,
      item.order_id,
      item.order_date,
      item.review_date,
      item.resolved_date,
      item.last_follow_up,
      item.rating.review_type_label,
      item.rating.current,
      item.rating.total,
      item.rating.bad,
      item.rating.new_average,
      item.rating.drop,
      item.rating.five_star_needed === null ? 'tidak tercapai' : item.rating.five_star_needed,
      item.impact.price,
      item.impact.cost,
      item.impact.units_before,
      item.impact.units_during,
      item.impact.days,
      item.impact.lost_units,
      item.impact.lost_revenue,
      item.impact.lost_profit,
      item.diagnosis.score,
      item.diagnosis.pattern_label,
      item.readiness.score,
      item.aging_days,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ulasan-palsu.csv"');
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
    console.log('Pelacak Ulasan Palsu berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
