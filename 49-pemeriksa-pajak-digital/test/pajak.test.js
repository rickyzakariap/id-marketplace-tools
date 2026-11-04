'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  analyze,
  validateBase,
  classifyItem,
  computeTotals,
  readiness,
  buildLetter,
  validateCase,
  summary,
  buildExample,
  meta,
  formatRupiah,
  formatDateID,
  parseISO,
  daysBetween,
  addDays,
  todayISO,
  CATEGORIES,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  POLICY,
  DEFAULTS,
  SPP_STARTED,
  ANNOUNCED_DATE,
  PPN_RATE_DEFAULT,
  MAX_ITEMS,
} = require('../lib/pajak');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('ok - ' + name);
  } catch (err) {
    failed += 1;
    console.error('not ok - ' + name);
    console.error('  ' + err.message);
  }
}

const NOW = new Date(2026, 10, 4);
const TODAY = '2026-11-04';

function base(overrides) {
  return Object.assign({
    store_name: 'Toko Uji',
    seller_name: 'Pemilik Uji',
    contact: '0812xxxxxxx',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    rate: 11,
    months_per_year: 12,
    pkp: 'tidak',
    seller_type: 'perorangan',
    items: [
      {
        label: 'Iklan digital',
        category: 'iklan',
        amount: 500000,
        includes_ppn: 'tidak',
        provider_ppn: 'belum',
        payment_issuer: 'ya',
      },
    ],
  }, overrides || {});
}

function item(overrides) {
  return Object.assign({
    label: 'Transaksi uji',
    category: 'langganan',
    amount: 100000,
    includes_ppn: 'tidak',
    provider_ppn: 'belum',
    payment_issuer: 'tidak_tahu',
  }, overrides || {});
}

test('constants have expected dates and defaults', () => {
  assert.strictEqual(SPP_STARTED, '2026-09-25');
  assert.strictEqual(ANNOUNCED_DATE, '2026-11-09');
  assert.strictEqual(PPN_RATE_DEFAULT, 11);
  assert.strictEqual(DEFAULTS.rate, 11);
  assert.strictEqual(MAX_ITEMS, 20);
});

test('date helpers parse, format, and count days', () => {
  assert.strictEqual(parseISO('2026-11-04'), '2026-11-04');
  assert.strictEqual(parseISO('2026-02-30'), null);
  assert.strictEqual(parseISO('04-11-2026'), null);
  assert.strictEqual(formatDateID('2026-11-04'), '4 November 2026');
  assert.strictEqual(daysBetween('2026-11-01', '2026-11-04'), 3);
  assert.strictEqual(addDays('2026-11-04', -3), '2026-11-01');
  assert.strictEqual(todayISO(NOW), TODAY);
});

test('rupiah formatter uses Indonesian separators', () => {
  assert.strictEqual(formatRupiah(1250000), 'Rp 1.250.000');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
});

test('validateBase fills period defaults when blank', () => {
  const checked = validateBase({ store_name: 'Toko', items: [] }, NOW);
  assert.ok(!checked.error);
  assert.strictEqual(checked.data.period_start, '2026-11-01');
  assert.strictEqual(checked.data.period_end, TODAY);
  assert.strictEqual(checked.data.rate, 11);
  assert.strictEqual(checked.data.months_per_year, 12);
});

test('validateBase rejects invalid dates', () => {
  assert.match(validateBase(base({ period_start: '2026-02-30' }), NOW).error, /awal periode/);
  assert.match(validateBase(base({ period_end: '2026-13-01' }), NOW).error, /akhir periode/);
});

test('validateBase rejects future and reversed periods', () => {
  assert.match(validateBase(base({ period_start: '2026-11-05' }), NOW).error, /melewati hari ini/);
  assert.match(validateBase(base({ period_end: '2026-10-01', period_start: '2026-10-02' }), NOW).error, /sebelum/);
});

test('validateBase rejects out of range rate and months', () => {
  assert.match(validateBase(base({ rate: 0 }), NOW).error, /Tarif PPN/);
  assert.match(validateBase(base({ rate: 31 }), NOW).error, /Tarif PPN/);
  assert.match(validateBase(base({ months_per_year: 0 }), NOW).error, /Jumlah bulan/);
  assert.match(validateBase(base({ months_per_year: 1.5 }), NOW).error, /Jumlah bulan/);
});

test('validateBase rejects too many items', () => {
  const items = [];
  for (let i = 0; i < MAX_ITEMS + 1; i += 1) items.push(item());
  assert.match(validateBase(base({ items }), NOW).error, /Maksimal/);
});

test('validateBase skips completely empty rows', () => {
  const checked = validateBase(base({ items: [{ label: '', amount: 0 }] }), NOW);
  assert.ok(!checked.error);
  assert.strictEqual(checked.data.items.length, 0);
});

test('validateBase rejects missing label, negative amount, and huge amount', () => {
  assert.match(validateBase(base({ items: [item({ label: '', amount: 1000 })] }), NOW).error, /wajib diisi/);
  assert.match(validateBase(base({ items: [item({ amount: -1 })] }), NOW).error, /negatif/);
  assert.match(validateBase(base({ items: [item({ amount: 1000000000001 })] }), NOW).error, /terlalu besar/);
});

test('validateBase normalizes unknown enums', () => {
  const checked = validateBase(base({
    pkp: 'mungkin',
    seller_type: 'lain',
    items: [item({ category: 'tidak_ada', provider_ppn: 'x', payment_issuer: 'y' })],
  }), NOW);
  assert.ok(!checked.error);
  assert.strictEqual(checked.data.pkp, 'tidak');
  assert.strictEqual(checked.data.seller_type, 'perorangan');
  assert.strictEqual(checked.data.items[0].category, 'lain');
  assert.strictEqual(checked.data.items[0].provider_ppn, 'tidak_tahu');
  assert.strictEqual(checked.data.items[0].payment_issuer, 'tidak_tahu');
});

test('classifyItem marks transfer as not taxable', () => {
  const result = classifyItem(item({ category: 'transfer', amount: 3000000, provider_ppn: 'sudah' }), 11);
  assert.strictEqual(result.status, 'transfer');
  assert.strictEqual(result.ppn, 0);
  assert.strictEqual(result.charged_ppn, 0);
  assert.strictEqual(result.potential_ppn, 0);
  assert.strictEqual(result.tone, 'ok');
});

test('classifyItem marks provider PMSE as already collected', () => {
  const result = classifyItem(item({ amount: 250000, includes_ppn: 'ya', provider_ppn: 'sudah' }), 11);
  assert.strictEqual(result.status, 'pmse');
  assert.strictEqual(result.ppn, 24775);
  assert.strictEqual(result.charged_ppn, 24775);
  assert.strictEqual(result.potential_ppn, 0);
  assert.strictEqual(result.dpp, 225225);
});

test('classifyItem marks appointed channel as SPP-TDLN risk', () => {
  const result = classifyItem(item({ amount: 500000, provider_ppn: 'belum', payment_issuer: 'ya' }), 11);
  assert.strictEqual(result.status, 'spp_tdln');
  assert.strictEqual(result.ppn, 55000);
  assert.strictEqual(result.charged_ppn, 55000);
  assert.strictEqual(result.tone, 'ember');
});

test('classifyItem keeps unknown cases unresolved', () => {
  const result = classifyItem(item({ amount: 150000, provider_ppn: 'tidak_tahu', payment_issuer: 'ya' }), 11);
  assert.strictEqual(result.status, 'perlu_cek');
  assert.strictEqual(result.potential_ppn, 16500);
  assert.strictEqual(result.charged_ppn, 0);
});

test('classifyItem keeps non-appointed unknown cases unresolved', () => {
  const result = classifyItem(item({ amount: 150000, provider_ppn: 'belum', payment_issuer: 'tidak' }), 11);
  assert.strictEqual(result.status, 'perlu_cek');
  assert.strictEqual(result.charged_ppn, 0);
  assert.strictEqual(result.potential_ppn, 16500);
});

test('computeTotals for non-PKP treats PPN as cost', () => {
  const items = [
    classifyItem(item({ amount: 100000, provider_ppn: 'belum', payment_issuer: 'ya' }), 11),
    classifyItem(item({ amount: 200000, provider_ppn: 'tidak_tahu', payment_issuer: 'ya' }), 11),
  ];
  const calc = computeTotals(items, { rate: 11, months_per_year: 12, pkp: 'tidak' });
  assert.strictEqual(calc.spend, 300000);
  assert.strictEqual(calc.ppn_charged, 11000);
  assert.strictEqual(calc.ppn_potential, 22000);
  assert.strictEqual(calc.creditable, 0);
  assert.strictEqual(calc.cost, 11000);
  assert.strictEqual(calc.ppn_annual, 132000);
  assert.strictEqual(calc.cost_annual, 132000);
  assert.strictEqual(calc.flagged_count, 2);
  assert.strictEqual(calc.unresolved_count, 1);
});

test('computeTotals for PKP makes PPN creditable', () => {
  const items = [classifyItem(item({ amount: 100000, provider_ppn: 'belum', payment_issuer: 'ya' }), 11)];
  const calc = computeTotals(items, { rate: 11, months_per_year: 6, pkp: 'ya' });
  assert.strictEqual(calc.creditable, 11000);
  assert.strictEqual(calc.cost, 0);
  assert.strictEqual(calc.creditable_annual, 66000);
});

test('analyze returns no-data verdict for empty input', () => {
  const data = analyze(base({ items: [] }), NOW);
  assert.ok(!data.error);
  assert.strictEqual(data.verdict.code, 'tanpa_data');
  assert.strictEqual(data.calculation.spend, 0);
});

test('analyze returns not-object verdict for transfers only', () => {
  const data = analyze(base({ items: [item({ category: 'transfer', amount: 3000000 })] }), NOW);
  assert.strictEqual(data.verdict.code, 'bukan_objek');
  assert.strictEqual(data.verdict.tone, 'ok');
  assert.match(data.verdict.detail, /tidak otomatis/);
});

test('analyze returns PMSE verdict when provider already collected', () => {
  const data = analyze(base({ items: [item({ amount: 111000, includes_ppn: 'ya', provider_ppn: 'sudah' })] }), NOW);
  assert.strictEqual(data.verdict.code, 'sudah_pmse');
  assert.strictEqual(data.calculation.pmse_ppn, 11000);
});

test('analyze returns SPP risk verdict', () => {
  const data = analyze(base(), NOW);
  assert.strictEqual(data.verdict.code, 'ada_spp');
  assert.strictEqual(data.verdict.tone, 'ember');
  assert.strictEqual(data.calculation.spp_ppn, 55000);
});

test('analyze prioritizes SPP risk over unresolved items', () => {
  const data = analyze(base({
    items: [
      item({ label: 'SPP', provider_ppn: 'belum', payment_issuer: 'ya' }),
      item({ label: 'Belum jelas', provider_ppn: 'tidak_tahu', payment_issuer: 'ya' }),
    ],
  }), NOW);
  assert.strictEqual(data.verdict.code, 'ada_spp');
  assert.strictEqual(data.calculation.unresolved_count, 1);
});

test('analyze returns unresolved verdict when only unknown items exist', () => {
  const data = analyze(base({ items: [item({ provider_ppn: 'tidak_tahu', payment_issuer: 'ya' })] }), NOW);
  assert.strictEqual(data.verdict.code, 'perlu_cek');
  assert.strictEqual(data.verdict.tone, 'signal');
});

test('analyze includes policy and source grounding', () => {
  const data = analyze(base(), NOW);
  assert.strictEqual(data.policy.spp_started, '2026-09-25');
  assert.strictEqual(data.policy.ppn_rate_default, 11);
  assert.match(data.policy.announced_note, /25 September 2026/);
  assert.ok(data.sources.length >= 4);
  assert.ok(data.recommendations.some((text) => /PPh 22/.test(text)));
  assert.ok(data.disclaimer.indexOf('bukan nasihat hukum') !== -1);
});

test('analyze rejects invalid items', () => {
  const data = analyze(base({ items: [item({ label: '' })] }), NOW);
  assert.match(data.error, /wajib diisi/);
});

test('readiness scores empty evidence as insufficient', () => {
  const result = readiness({ evidence: [] });
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.verdict, 'kurang');
  assert.strictEqual(result.checked_count, 0);
  assert.strictEqual(result.total, EVIDENCE.length);
});

test('readiness ignores unknown evidence ids', () => {
  const result = readiness({ evidence: ['tidak_ada', 'invoice_ppn'] });
  assert.strictEqual(result.checked_count, 1);
  assert.strictEqual(result.score, 14);
});

test('readiness scores all evidence as ready', () => {
  const result = readiness({ evidence: EVIDENCE.map((entry) => entry.id) });
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.verdict, 'siap');
  assert.strictEqual(result.critical_open.length, 0);
});

test('readiness marks one critical gap as almost ready', () => {
  const evidence = EVIDENCE.filter((entry) => entry.id !== 'invoice_ppn').map((entry) => entry.id);
  const result = readiness({ evidence });
  assert.ok(result.score >= 80);
  assert.strictEqual(result.verdict, 'hampir');
  assert.strictEqual(result.critical_open.length, 1);
});

test('buildLetter rejects missing store name', () => {
  assert.match(buildLetter({ ...base(), store_name: '' }, NOW).error, /Nama toko/);
});

test('buildLetter rejects empty items', () => {
  assert.match(buildLetter(base({ items: [] }), NOW).error, /minimal satu transaksi/);
});

test('buildLetter creates a detail request', () => {
  const letter = buildLetter(base({ letter_type: 'rincian' }), NOW);
  assert.ok(!letter.error);
  assert.strictEqual(letter.letter_type, 'rincian');
  assert.match(letter.subject, /Permintaan rincian PPN/);
  assert.match(letter.body, /Toko Uji/);
  assert.match(letter.body, /Iklan digital/);
  assert.match(letter.body, /Rp 55.000/);
  assert.match(letter.body, /PMK 131\/2024/);
  assert.match(letter.body, /4 November 2026/);
});

test('buildLetter requires a transfer for confirmation letter', () => {
  assert.match(buildLetter(base({ letter_type: 'konfirmasi' }), NOW).error, /transfer/);
  const letter = buildLetter(base({
    letter_type: 'konfirmasi',
    items: [item({ category: 'transfer', amount: 3000000 })],
  }), NOW);
  assert.ok(!letter.error);
  assert.match(letter.subject, /Konfirmasi/);
});

test('buildLetter requires PMSE evidence for double collection letter', () => {
  assert.match(buildLetter(base({ letter_type: 'koreksi' }), NOW).error, /koreksi ganda/);
  const letter = buildLetter(base({
    letter_type: 'koreksi',
    items: [item({ amount: 111000, includes_ppn: 'ya', provider_ppn: 'sudah' })],
  }), NOW);
  assert.ok(!letter.error);
  assert.match(letter.subject, /koreksi/);
  assert.match(letter.body, /kembalikan kelebihan/);
});

test('validateCase rejects missing store name', () => {
  assert.match(validateCase({ store_name: '', items: [] }, NOW).error, /Nama toko/);
});

test('validateCase stores computed totals, status, evidence, and chronology', () => {
  const checked = validateCase(base({
    status: 'cek_invoice',
    evidence: ['invoice_ppn', 'invoice_ppn', 'tidak_ada', 'payment_proof'],
    chronology: 'Saya mencocokkan invoice dengan mutasi.',
  }), NOW);
  assert.ok(!checked.error);
  assert.strictEqual(checked.item.status, 'cek_invoice');
  assert.strictEqual(checked.item.monthly_ppn, 55000);
  assert.strictEqual(checked.item.annual_ppn, 660000);
  assert.strictEqual(checked.item.verdict_code, 'ada_spp');
  assert.deepStrictEqual(checked.item.evidence, ['invoice_ppn', 'payment_proof']);
  assert.strictEqual(checked.item.chronology, 'Saya mencocokkan invoice dengan mutasi.');
});

test('validateCase defaults unknown status to first status', () => {
  const checked = validateCase(base({ status: 'entah' }), NOW);
  assert.strictEqual(checked.item.status, CASE_STATUSES[0].id);
});

test('validateCase rejects future follow-up', () => {
  const checked = validateCase(base({ followup_date: '2026-11-05' }), NOW);
  assert.match(checked.error, /melewati hari ini/);
});

test('validateCase rejects follow-up before period end', () => {
  const checked = validateCase(base({ followup_date: '2026-10-15' }), NOW);
  assert.match(checked.error, /sebelum akhir periode/);
});

test('summary handles empty cases', () => {
  const result = summary([], NOW);
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.open_count, 0);
  assert.strictEqual(result.total_monthly_ppn, 0);
  assert.strictEqual(result.warning_count, 0);
});

test('summary counts open cases and warnings', () => {
  const old = Object.assign({}, validateCase(base({
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    followup_date: '2026-02-01',
    status: 'konfirmasi_kanal',
  }), NOW).item, { id: 'k1', created_at: '2026-02-01T00:00:00.000Z' });
  const closed = Object.assign({}, validateCase(base({
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    status: 'selesai',
  }), NOW).item, { id: 'k2', created_at: '2026-11-01T00:00:00.000Z' });
  const result = summary([old, closed], NOW);
  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.open_count, 1);
  assert.strictEqual(result.closed_count, 1);
  assert.strictEqual(result.total_monthly_ppn, 110000);
  assert.strictEqual(result.open_monthly_ppn, 55000);
  assert.ok(result.warnings.length >= 2);
  assert.strictEqual(result.oldest_open_store, 'Toko Uji');
});

test('summary does not warn for closed cases', () => {
  const closed = Object.assign({}, validateCase(base({
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    status: 'selesai',
  }), NOW).item, { id: 'k1', created_at: '2026-02-01T00:00:00.000Z' });
  const result = summary([closed], NOW);
  assert.strictEqual(result.warning_count, 0);
});

test('buildExample is valid and has mixed statuses', () => {
  const example = buildExample(NOW);
  assert.strictEqual(example.store_name, 'Toko Contoh Digital');
  assert.strictEqual(example.items.length, 4);
  const data = analyze(example, NOW);
  assert.ok(!data.error);
  assert.strictEqual(data.verdict.code, 'ada_spp');
  assert.strictEqual(data.calculation.transfer_count, 1);
  assert.strictEqual(data.calculation.unresolved_count, 1);
  assert.strictEqual(data.calculation.pmse_ppn, 24775);
  assert.strictEqual(data.calculation.spp_ppn, 55000);
});

test('meta exposes options, sources, and policy', () => {
  const data = meta(NOW);
  assert.ok(data.categories.length >= 7);
  assert.ok(data.evidence.length === EVIDENCE.length);
  assert.ok(data.case_statuses.length === CASE_STATUSES.length);
  assert.ok(data.letter_types.length === LETTER_TYPES.length);
  assert.ok(data.sources.length === SOURCES.length);
  assert.strictEqual(data.policy.spp_started, '2026-09-25');
  assert.match(data.policy.announced_note, /bukan konfirmasi/i);
  assert.strictEqual(data.defaults.rate, 11);
});

test('source list contains official and news grounding', () => {
  assert.ok(SOURCES.some((source) => /pajak\.go\.id/.test(source.url)));
  assert.ok(SOURCES.some((source) => /ortax\.org/.test(source.url)));
  assert.ok(SOURCES.some((source) => /ukmindonesia\.id/.test(source.url)));
});

test('policy keeps 9 November labelled as a claim, not an official start', () => {
  assert.strictEqual(POLICY.announced_date, '2026-11-09');
  assert.strictEqual(POLICY.spp_started, '2026-09-25');
  assert.match(POLICY.announced_note, /bukan konfirmasi/i);
});

test('static HTML has required ids and no missing getElementById target', () => {
  const file = path.join(__dirname, '..', 'public', 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const ids = [];
  const seen = new Set();
  const re = /id="([^"]+)"/g;
  let match;
  while ((match = re.exec(html))) {
    assert.ok(!seen.has(match[1]), 'duplicate id: ' + match[1]);
    seen.add(match[1]);
    ids.push(match[1]);
  }
  const script = html.slice(html.indexOf('<script>', html.indexOf('<body')));
  const used = new Set();
  const reUse = /getElementById\('([^']+)'\)/g;
  while ((match = reUse.exec(script))) used.add(match[1]);
  used.forEach((id) => assert.ok(seen.has(id), 'missing element id: ' + id));
  ['theme-btn', 'calc-btn', 'example-btn', 'tx-rows', 'result', 'letter-btn', 'cases-list', 'save-case-btn'].forEach((id) => {
    assert.ok(ids.indexOf(id) !== -1, 'required id missing: ' + id);
  });
});

test('UI copy contains no em dash', () => {
  const file = path.join(__dirname, '..', 'public', 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  assert.strictEqual(html.indexOf('\u2014'), -1);
});

test('README and package metadata exist', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'pemeriksa-pajak-digital');
  assert.ok(fs.existsSync(path.join(root, 'README.md')));
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
