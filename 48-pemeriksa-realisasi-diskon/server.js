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
const PORT = 8048;
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
      platform: 'shopee',
      scale: 'mikro',
      domestic: 'ya',
      sapa: 'ya',
      verified: 'ya',
      high_risk: 'tidak',
      record: 'ya',
      store_name: 'Toko Contoh Lokal',
      store_id: 'toko-contoh-lokal',
      seller_name: 'Pemilik Toko Contoh',
      contact: '0812xxxxxxx',
      ticket: 'TIKET-CONTOH-048',
      period_start: addDays(end, -20),
      period_end: addDays(end, -6),
      application_date: addDays(end, -21),
      verified_date: addDays(end, -14),
      gross_sales: 15000000,
      fee_rate: 10,
      fee_basis: 1500000,
      discount_pct: 50,
      actual_fee: 1200000,
      periods_per_year: 12,
      chronology: 'Pengajuan insentif dibuat lewat SAPA UMKM dan dinyatakan lolos verifikasi. Pada settlement terbaru, baris diskon hanya menutup sebagian biaya layanan.',
      note: 'Contoh ilustrasi. Nominal adalah contoh, bukan data nyata.',
      status: 'keberatan_dikirim',
      letter_type: 'keberatan',
      followup_date: addDays(end, -1),
      manual_signals: ['sebagian_sku', 'settlement_tidak_rinci'],
      evidence: ['sapa_account', 'verification_notice', 'settlement_after', 'fee_basis_proof', 'sku_list', 'fee_breakdown', 'ticket_number', 'sapa_timeline'],
    },
    {
      platform: 'tiktok',
      scale: 'kecil',
      domestic: 'ya',
      sapa: 'ya',
      verified: 'tidak',
      high_risk: 'tidak',
      record: 'ya',
      store_name: 'Toko Contoh Dua',
      store_id: 'toko-contoh-dua',
      seller_name: 'Pemilik Toko Dua',
      contact: '0813xxxxxxx',
      ticket: 'TIKET-CONTOH-049',
      period_start: addDays(end, -30),
      period_end: addDays(end, -16),
      application_date: addDays(end, -6),
      verified_date: '',
      gross_sales: 25000000,
      fee_rate: 12,
      fee_basis: 0,
      discount_pct: 50,
      actual_fee: 3000000,
      periods_per_year: 12,
      chronology: 'Pengajuan baru dikirim. Platform belum memberi pemberitahuan verifikasi, sehingga selisih belum bisa dipakai sebagai dasar keberatan.',
      note: 'Contoh fase verifikasi. Dasarnya dihitung dari omzet dan tarif.',
      status: 'menunggu_verifikasi',
      letter_type: 'status',
      followup_date: addDays(end, -2),
      manual_signals: ['tanpa_pemberitahuan'],
      evidence: ['sapa_account', 'settlement_after', 'sku_list'],
    },
    {
      platform: 'lazada',
      scale: 'mikro',
      domestic: 'ya',
      sapa: 'ya',
      verified: 'ya',
      high_risk: 'tidak',
      record: 'ya',
      store_name: 'Toko Contoh Tiga',
      store_id: 'toko-contoh-tiga',
      seller_name: 'Pemilik Toko Tiga',
      contact: '0814xxxxxxx',
      ticket: '',
      period_start: addDays(end, -12),
      period_end: addDays(end, -2),
      application_date: addDays(end, -25),
      verified_date: addDays(end, -18),
      gross_sales: 8000000,
      fee_rate: 10,
      fee_basis: 800000,
      discount_pct: 50,
      actual_fee: 400000,
      periods_per_year: 12,
      chronology: 'Diskon terlihat sesuai perkiraan pada settlement. Tidak ada selisih yang perlu dipertanyakan.',
      note: 'Contoh selesai tanpa selisih.',
      status: 'selesai',
      letter_type: 'keberatan',
      followup_date: '',
      manual_signals: [],
      evidence: ['sapa_account', 'verification_notice', 'settlement_after', 'fee_basis_proof', 'sku_list'],
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
    'id', 'platform', 'store_name', 'store_id', 'period_start', 'period_end',
    'application_date', 'verified_date', 'gross_sales', 'fee_rate', 'fee_basis',
    'discount_pct', 'actual_fee', 'expected_fee', 'actual_discount', 'gap',
    'annual_leak', 'phase_code', 'eligibility_verdict', 'verdict_code',
    'case_status', 'ticket', 'followup_date', 'note',
  ];
  const rows = [header.map(csvCell).join(',')];
  data.cases.forEach((item) => {
    rows.push([
      item.id,
      item.platform,
      item.store_name,
      item.store_id,
      item.period_start,
      item.period_end,
      item.application_date,
      item.verified_date,
      item.gross_sales,
      item.fee_rate,
      item.basis,
      item.discount_pct,
      item.actual_fee,
      item.expected_fee,
      item.actual_fee !== undefined && item.basis !== undefined ? item.basis - item.actual_fee : '',
      item.gap,
      item.annual_leak,
      item.phase_code,
      item.eligibility_verdict,
      item.verdict_code,
      item.status_label,
      item.ticket,
      item.followup_date,
      item.note,
    ].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="realisasi-diskon-umk.csv"');
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
    console.log('Pemeriksa Realisasi Diskon 50% berjalan di http://localhost:' + PORT);
  });
}

module.exports = app;
