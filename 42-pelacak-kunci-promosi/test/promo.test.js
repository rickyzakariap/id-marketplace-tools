const assert = require('assert');
const {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computeDiagnosis,
  computeImpact,
  daysBetween,
  addDays,
  formatDateOnly,
  formatRupiah,
  readiness,
  summary,
  todayISO,
  validateCase,
  EVIDENCE,
  FACT_OPTIONS,
  PLATFORMS,
  SOURCES,
  STATUSES,
  SYMPTOMS,
  TRIGGERS,
  DEFAULTS,
} = require('../lib/promo');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('ok ' + passed + ' - ' + name);
}

const NOW = new Date('2026-10-28T03:00:00Z');
const TODAY = todayISO(NOW);

function baseInput(overrides) {
  return Object.assign({
    platform: 'shopee',
    trigger: 'harga_coret',
    status: 'terkunci',
    store_name: 'Toko Uji',
    locked_date: addDays(TODAY, -10),
    price: 100000,
    cost: 70000,
    units_before: 10,
    units_during: 4,
    ad_spend_per_day: 5000,
    chat_count: 2,
    symptoms: ['voucher_instant', 'checkout_gagal'],
    facts: {
      points: 'nol',
      warning: 'tidak',
      quarter_reset: 'belum',
      written_reason: 'tidak',
      star_seller_now: 'tidak',
    },
  }, overrides || {});
}

test('daysBetween counts calendar days', () => {
  assert.strictEqual(daysBetween('2026-10-01', '2026-10-28'), 27);
  assert.strictEqual(daysBetween('2026-10-28', '2026-10-28'), 0);
});

test('addDays handles month boundaries', () => {
  assert.strictEqual(addDays('2026-10-28', 5), '2026-11-02');
  assert.strictEqual(addDays('2026-03-01', -1), '2026-02-28');
});

test('formatDateOnly uses Indonesian month names', () => {
  assert.strictEqual(formatDateOnly('2026-10-27'), '27 Oktober 2026');
  assert.strictEqual(formatDateOnly(''), '');
});

test('formatRupiah formats Indonesian thousands', () => {
  assert.strictEqual(formatRupiah(1800000), 'Rp 1.800.000');
});

test('computeImpact subtracts sales during lock from normal sales', () => {
  const impact = computeImpact(baseInput(), NOW);
  assert.strictEqual(impact.locked_days, 10);
  assert.strictEqual(impact.lost_units_per_day, 6);
  assert.strictEqual(impact.lost_units, 60);
  assert.strictEqual(impact.lost_revenue, 6000000);
  assert.strictEqual(impact.lost_profit, 1800000);
  assert.strictEqual(impact.ad_waste, 50000);
});

test('computeImpact returns zero loss when sales did not drop', () => {
  const impact = computeImpact(baseInput({ units_during: 12 }), NOW);
  assert.strictEqual(impact.lost_units_per_day, 0);
  assert.strictEqual(impact.lost_revenue, 0);
  assert.strictEqual(impact.lost_profit, 0);
});

test('computeImpact never produces negative margin', () => {
  const impact = computeImpact(baseInput({ cost: 150000 }), NOW);
  assert.strictEqual(impact.unit_margin, 0);
  assert.strictEqual(impact.lost_profit, 0);
});

test('computeImpact marks short lock as ringan', () => {
  const impact = computeImpact(baseInput({ locked_date: addDays(TODAY, -3) }), NOW);
  assert.strictEqual(impact.locked_days, 3);
  assert.strictEqual(impact.severity, 'ringan');
});

test('computeImpact marks one week lock as signifikan', () => {
  const impact = computeImpact(baseInput({ locked_date: addDays(TODAY, -7) }), NOW);
  assert.strictEqual(impact.severity, 'signifikan');
});

test('computeImpact marks 30 day lock as kritis', () => {
  const impact = computeImpact(baseInput({ locked_date: addDays(TODAY, -30) }), NOW);
  assert.strictEqual(impact.severity, 'kritis');
});

test('computeImpact uses restored date as end date', () => {
  const impact = computeImpact(baseInput({
    locked_date: addDays(TODAY, -20),
    restored_date: addDays(TODAY, -12),
  }), NOW);
  assert.strictEqual(impact.locked_days, 8);
  assert.strictEqual(impact.severity, 'dibuka');
});

test('computeDiagnosis gives a strong score for the reported pattern', () => {
  const input = baseInput({
    locked_date: addDays(TODAY, -95),
    chat_count: 8,
    symptoms: ['voucher_instant', 'promo_berbayar', 'checkout_gagal', 'star_seller_hilang'],
    facts: {
      points: 'nol',
      warning: 'ya',
      quarter_reset: 'ya',
      written_reason: 'tidak',
      star_seller_now: 'tidak',
    },
  });
  const impact = computeImpact(input, NOW);
  const diagnosis = computeDiagnosis(input, impact);
  assert.strictEqual(diagnosis.score, 100);
  assert.strictEqual(diagnosis.verdict, 'kuat');
  assert.strictEqual(diagnosis.cause, 'Penalti promosi karena harga coret');
});

test('computeDiagnosis is weak when facts are thin', () => {
  const input = baseInput({
    locked_date: addDays(TODAY, -2),
    chat_count: 1,
    symptoms: ['voucher_toko'],
    facts: {
      points: 'ada',
      warning: 'tidak',
      quarter_reset: 'belum',
      written_reason: 'ya',
      star_seller_now: 'ya',
    },
  });
  const impact = computeImpact(input, NOW);
  const diagnosis = computeDiagnosis(input, impact);
  assert.strictEqual(diagnosis.score, 10);
  assert.strictEqual(diagnosis.verdict, 'lemah');
});

test('computeDiagnosis labels order spike as automatic flag', () => {
  const input = baseInput({ trigger: 'lonjakan_pesanan' });
  const diagnosis = computeDiagnosis(input, computeImpact(input, NOW));
  assert.strictEqual(diagnosis.cause, 'Flag otomatis karena lonjakan transaksi');
});

test('analyze rejects missing price', () => {
  const result = analyze(baseInput({ price: 0 }), NOW);
  assert.ok(result.error);
  assert.strictEqual(result.error, 'Isi harga jual rata-rata lebih dari 0');
});

test('analyze rejects missing lock date', () => {
  const result = analyze(baseInput({ locked_date: '' }), NOW);
  assert.ok(result.error);
  assert.strictEqual(result.error, 'Tanggal kunci promosi wajib diisi');
});

test('analyze rejects future lock date', () => {
  const result = analyze(baseInput({ locked_date: addDays(TODAY, 1) }), NOW);
  assert.ok(result.error);
  assert.strictEqual(result.error, 'Tanggal kunci promosi tidak boleh melewati hari ini');
});

test('analyze rejects invalid restored date order', () => {
  const result = analyze(baseInput({
    locked_date: addDays(TODAY, -10),
    restored_date: addDays(TODAY, -20),
  }), NOW);
  assert.ok(result.error);
  assert.strictEqual(result.error, 'Tanggal kunci dibuka tidak boleh sebelum tanggal kunci');
});

test('analyze requires at least one symptom', () => {
  const result = analyze(baseInput({ symptoms: [] }), NOW);
  assert.ok(result.error);
  assert.strictEqual(result.error, 'Pilih minimal satu gejala yang dialami');
});

test('analyze returns full result for a valid case', () => {
  const result = analyze(baseInput(), NOW);
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.platform_name, 'Shopee');
  assert.strictEqual(result.trigger_label, 'Harga coret atau diskon dianggap tidak wajar');
  assert.strictEqual(result.impact.lost_profit, 1800000);
  assert.strictEqual(result.symptoms.length, 2);
  assert.ok(result.recommendations.length >= 3);
  assert.ok(result.sources.length >= 2);
});

test('readiness gives full score when every evidence item is present', () => {
  const result = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.verdict, 'siap');
  assert.strictEqual(result.missing_critical.length, 0);
});

test('readiness gives zero and lists critical gaps when empty', () => {
  const result = readiness({ items: [] });
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.verdict, 'belum');
  assert.strictEqual(result.missing_critical.length, 5);
});

test('readiness weights critical evidence twice', () => {
  const result = readiness({ items: ['voucher_screenshot'] });
  assert.strictEqual(result.score, 11);
  assert.strictEqual(result.checked_count, 1);
});

test('validateCase normalizes symptoms and evidence', () => {
  const checked = validateCase(baseInput({
    symptoms: ['voucher_instant', 'tidak_ada', 'voucher_instant'],
    evidence: ['points_zero', 'tidak_ada'],
  }), NOW);
  assert.strictEqual(checked.error, undefined);
  assert.deepStrictEqual(checked.item.symptoms, ['voucher_instant']);
  assert.deepStrictEqual(checked.item.evidence, ['points_zero']);
  assert.strictEqual(checked.item.store_name, 'Toko Uji');
});

test('validateCase rejects missing store name', () => {
  const checked = validateCase(baseInput({ store_name: '' }), NOW);
  assert.strictEqual(checked.error, 'Nama toko wajib diisi');
});

test('validateCase rejects case without symptoms', () => {
  const checked = validateCase(baseInput({ symptoms: [] }), NOW);
  assert.strictEqual(checked.error, 'Pilih minimal satu gejala yang dialami');
});

test('validateCase rejects future follow-up date', () => {
  const checked = validateCase(baseInput({ last_follow_up: addDays(TODAY, 2) }), NOW);
  assert.strictEqual(checked.error, 'Tanggal follow-up tidak boleh melewati hari ini');
});

test('caseView flags a lock longer than 30 days', () => {
  const view = caseView(baseInput({ locked_date: addDays(TODAY, -40) }), NOW);
  assert.strictEqual(view.aging_days, 40);
  assert.ok(view.flags.some((flag) => flag.indexOf('40 hari') !== -1));
});

test('caseView flags quarter reset that did not unlock promo', () => {
  const view = caseView(baseInput({
    locked_date: addDays(TODAY, -35),
    facts: {
      points: 'nol',
      warning: 'ya',
      quarter_reset: 'ya',
      written_reason: 'tidak',
      star_seller_now: 'tidak',
    },
  }), NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('Reset poin kuartal') !== -1));
});

test('summary separates open, opened and rejected cases', () => {
  const data = summary([
    validateCase(baseInput(), NOW).item,
    validateCase(baseInput({ store_name: 'Toko Buka', status: 'dibuka', restored_date: addDays(TODAY, -1) }), NOW).item,
    validateCase(baseInput({ store_name: 'Toko Tolak', status: 'ditolak' }), NOW).item,
  ], NOW);
  assert.strictEqual(data.total_cases, 3);
  assert.strictEqual(data.open_cases, 2);
  assert.strictEqual(data.opened_cases, 1);
  assert.strictEqual(data.rejected_cases, 1);
});

test('summary totals losses and finds the oldest open case', () => {
  const data = summary([
    validateCase(baseInput({ locked_date: addDays(TODAY, -10) }), NOW).item,
    validateCase(baseInput({ store_name: 'Toko Lama', locked_date: addDays(TODAY, -40) }), NOW).item,
  ], NOW);
  assert.strictEqual(data.total_lost_profit, 9000000);
  assert.strictEqual(data.oldest_open_days, 40);
});

test('buildLetter includes store, symptoms and written requests', () => {
  const letter = buildLetter(Object.assign(baseInput(), {
    seller_name: 'Siti',
    store_id: 'toko-uji',
    ticket: 'TIKET-9',
    chronology: 'Voucher gagal sejak 18 Oktober 2026.',
    evidence: ['voucher_screenshot', 'checkout_recording', 'points_zero'],
  }), NOW);
  assert.strictEqual(letter.error, undefined);
  assert.ok(letter.subject.indexOf('Toko Uji') !== -1);
  assert.ok(letter.body.indexOf('Siti') !== -1);
  assert.ok(letter.body.indexOf('0 poin') !== -1);
  assert.ok(letter.body.indexOf('Penjelasan tertulis') !== -1);
  assert.ok(letter.body.indexOf('Screenshot voucher yang tampil lalu hilang') !== -1);
});

test('buildLetter rejects missing store name', () => {
  const letter = buildLetter({ store_name: '' }, NOW);
  assert.strictEqual(letter.error, 'Nama toko wajib diisi');
});

test('buildExample is analyzable', () => {
  const example = buildExample(NOW);
  const result = analyze(example, NOW);
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.impact.locked_days, 95);
  assert.ok(example.store_id);
});

test('all sources have publisher, date, URL and facts', () => {
  assert.ok(SOURCES.length >= 2);
  SOURCES.forEach((source) => {
    assert.ok(source.label);
    assert.ok(source.publisher);
    assert.ok(source.date);
    assert.ok(source.url.indexOf('https://') === 0);
    assert.ok(Array.isArray(source.facts) && source.facts.length > 0);
  });
});

test('all select defaults exist in their option lists', () => {
  Object.keys(DEFAULTS.facts).forEach((key) => {
    const allowed = FACT_OPTIONS[key].map((item) => item.id);
    assert.ok(allowed.indexOf(DEFAULTS.facts[key]) !== -1, 'missing default for ' + key);
  });
  assert.ok(PLATFORMS.some((item) => item.id === DEFAULTS.platform));
  assert.ok(TRIGGERS.some((item) => item.id === DEFAULTS.trigger));
  assert.ok(STATUSES.some((item) => item.id === DEFAULTS.status));
  DEFAULTS.symptoms.forEach((id) => {
    assert.ok(SYMPTOMS.some((item) => item.id === id));
  });
});

test('user-facing text contains no em dash', () => {
  const texts = [];
  [PLATFORMS, TRIGGERS, SYMPTOMS, STATUSES, EVIDENCE].forEach((list) => {
    list.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === 'string') texts.push(item[key]);
      });
    });
  });
  Object.keys(FACT_OPTIONS).forEach((key) => {
    FACT_OPTIONS[key].forEach((item) => texts.push(item.label));
  });
  SOURCES.forEach((source) => {
    texts.push(source.label);
    source.facts.forEach((fact) => texts.push(fact));
  });
  texts.forEach((text) => {
    assert.strictEqual(text.indexOf('\u2014'), -1, 'em dash found in: ' + text);
  });
});

console.log('\n' + passed + ' tests passed');
