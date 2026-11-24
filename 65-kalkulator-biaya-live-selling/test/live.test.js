'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/live');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat batas, skenario, rumus, dan asumsi', () => {
  const data = tool.meta();
  assert.deepEqual(data.scenario_multipliers, [50, 75, 100, 125, 150]);
  assert.equal(data.limits.max_duration_hours, 24);
  assert.equal(data.limits.max_affiliate_pct, 50);
  assert.equal(data.min_price_step, 100);
  assert.equal(data.status_labels.loss, 'Rugi sesi');
  assert.ok(data.formula.indexOf('profit = omzet') !== -1);
  assert.ok(data.break_even_formula.indexOf('biaya tetap') !== -1);
  assert.ok(data.assumptions.length >= 8);
  assert.ok(data.scope_note.indexOf('tidak menetapkan') !== -1);
  assert.ok(data.disclaimer.indexOf('bukan laporan laba resmi') !== -1);
});

test('contoh menghitung omzet, seluruh komponen biaya, dan profit sesi', () => {
  const result = analyze({});
  const session = result.session;

  assert.equal(session.units, 72);
  assert.equal(session.revenue, 9288000);
  assert.equal(session.product_cost, 4896000);
  assert.equal(session.packaging_cost, 180000);
  assert.equal(session.platform_fee, 743040);
  assert.equal(session.affiliate_fee, 371520);
  assert.equal(session.host_cost, 450000);
  assert.equal(session.fixed_cost, 1410000);
  assert.equal(session.total_cost, 7600560);
  assert.equal(session.profit, 1687440);
  assert.equal(session.margin_pct, 18.17);
  assert.equal(session.profit_per_hour, 562480);
  assert.equal(session.cost_per_order, 105563.33);
  assert.equal(session.cost_per_viewer, 1809.66);
  assert.equal(session.revenue_per_viewer, 2211.43);
  assert.equal(session.conversion_pct, 1.71);
  assert.equal(session.roi_pct, 22.2);
  assert.equal(session.contribution_per_unit, 43020);
  assert.equal(session.status, 'ok');
});

test('komisi affiliate hanya dihitung pada porsi pesanan affiliate', () => {
  const result = analyze({});
  assert.equal(result.affiliate_effective_pct, 4);
  assert.equal(result.session.affiliate_fee, 371520);
  assert.equal(
    result.recommendations.some((item) => item.indexOf('Komisi affiliate efektif 4 persen') !== -1),
    true
  );

  const noAffiliate = analyze({ affiliate_pct: 0, affiliate_order_pct: 0 });
  assert.equal(noAffiliate.affiliate_effective_pct, 0);
  assert.equal(noAffiliate.session.affiliate_fee, 0);
  assert.equal(noAffiliate.limits.max_affiliate_pct, null);
});

test('batas balik modal, target unit, harga minimum, dan ruang biaya dihitung', () => {
  const result = analyze({});
  const limits = result.limits;

  assert.equal(limits.break_even_units, 33);
  assert.equal(limits.break_even_revenue, 4257000);
  assert.equal(limits.required_units_for_target, 60);
  assert.equal(limits.minimum_price_at_target, 123500);
  assert.equal(limits.max_fixed_budget_at_target, 1704240);
  assert.equal(limits.max_host_fee_per_hour, 248080);
  assert.equal(limits.max_affiliate_pct, 17.92);
  assert.equal(limits.max_ads_spend, 894240);

  const below = tool.evaluateSession(result.input, 32);
  const atBreakEven = tool.evaluateSession(result.input, 33);
  assert.ok(below.profit < 0);
  assert.ok(atBreakEven.profit >= 0);
});

test('harga minimum yang disarankan memenuhi target margin', () => {
  const thin = analyze({ target_margin_pct: 25 });
  assert.equal(thin.limits.minimum_price_at_target, 143000);
  assert.equal(thin.limits.required_units_for_target, 131);

  const atMinimum = analyze({
    target_margin_pct: 25,
    avg_price: thin.limits.minimum_price_at_target,
  });
  assert.ok(atMinimum.session.margin_pct >= 25);
  assert.equal(atMinimum.session.status, 'ok');
});

test('skenario volume 50 sampai 150 persen menandai margin tipis dan aman', () => {
  const result = analyze({});
  assert.equal(result.scenarios.length, 5);
  assert.deepEqual(
    result.scenarios.map((item) => item.multiplier_pct),
    [50, 75, 100, 125, 150]
  );
  assert.deepEqual(
    result.scenarios.map((item) => item.status),
    ['thin', 'thin', 'ok', 'ok', 'ok']
  );
  assert.equal(result.scenarios[0].units, 36);
  assert.equal(result.scenarios[0].profit, 138720);
  assert.equal(result.scenarios[0].margin_pct, 2.99);
  assert.equal(result.scenarios[4].units, 108);
  assert.equal(result.scenarios[4].profit, 3236160);
  assert.equal(result.scenarios[2].is_actual, true);
  assert.equal(result.scenario_summary.safe_count, 3);
  assert.equal(result.scenario_summary.thin_count, 2);
  assert.equal(result.scenario_summary.loss_count, 0);
  assert.equal(result.scenario_summary.best_safe_multiplier_pct, 150);
});

test('margin di bawah target memberi verdict waspada dan saran unit', () => {
  const result = analyze({ target_margin_pct: 25 });
  assert.equal(result.session.status, 'thin');
  assert.equal(result.session.margin_pct, 18.17);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Margin di bawah target');
  assert.ok(result.verdict.note.indexOf('143.000') !== -1);
  assert.ok(
    result.recommendations.some((item) => item.indexOf('Butuh 131 unit') !== -1)
  );
});

test('biaya tetap besar menghasilkan rugi, titik balik modal, dan peringatan', () => {
  const result = analyze({ ads_spend: 3000000 });
  assert.equal(result.session.profit, -712560);
  assert.equal(result.session.margin_pct, -7.67);
  assert.equal(result.session.status, 'loss');
  assert.equal(result.limits.break_even_units, 89);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Sesi live rugi');
  assert.ok(result.verdict.note.indexOf('Rp 712.560') !== -1);
  assert.ok(result.verdict.note.indexOf('89 unit') !== -1);
  assert.ok(result.warnings.some((item) => item.indexOf('89 unit') !== -1));
  assert.ok(result.warnings.some((item) => item.indexOf('iklan') !== -1));
});

test('unit nol dan penonton nol tidak menghasilkan NaN', () => {
  const noSales = analyze({
    units_sold: 0,
    viewers: 0,
    host_fee_per_hour: 0,
    ads_spend: 100000,
    sample_cost: 0,
    other_cost: 0,
  });
  assert.equal(noSales.session.revenue, 0);
  assert.equal(noSales.session.profit, -100000);
  assert.equal(noSales.session.cost_per_order, null);
  assert.equal(noSales.session.conversion_pct, null);
  assert.equal(noSales.verdict.level, 'ember');
  assert.equal(noSales.verdict.label, 'Belum ada penjualan');

  const empty = analyze({
    units_sold: 0,
    viewers: 0,
    host_fee_per_hour: 0,
    ads_spend: 0,
    sample_cost: 0,
    other_cost: 0,
  });
  assert.equal(empty.session.total_cost, 0);
  assert.equal(empty.session.margin_pct, 0);
  assert.equal(empty.verdict.level, 'muted');

  const soldNoViewers = analyze({ viewers: 0 });
  assert.equal(soldNoViewers.session.conversion_pct, null);
  assert.equal(soldNoViewers.session.cost_per_viewer, null);
  assert.equal(soldNoViewers.session.revenue_per_viewer, null);
  assert.ok(Number.isFinite(soldNoViewers.session.profit));
});

test('kontribusi per unit negatif menutup jalan balik modal lewat volume', () => {
  const result = analyze({ unit_cost: 130000 });
  assert.ok(result.session.contribution_per_unit < 0);
  assert.equal(result.limits.break_even_units, null);
  assert.equal(result.verdict.level, 'ember');
  assert.ok(result.verdict.note.indexOf('Kontribusi per unit negatif') !== -1);
  assert.ok(result.warnings.some((item) => item.indexOf('Kontribusi per unit negatif') !== -1));
});

test('input salah ditolak dengan pesan yang jelas', () => {
  assert.throws(() => analyze({ duration_hours: 0 }), /Durasi sesi harus lebih dari 0 jam/);
  assert.throws(() => analyze({ duration_hours: 25 }), /Durasi sesi maksimal 24 jam/);
  assert.throws(() => analyze({ units_sold: 1.5 }), /Unit terjual harus bilangan bulat/);
  assert.throws(() => analyze({ avg_price: 0 }), /Harga rata-rata per unit harus lebih dari 0/);
  assert.throws(() => analyze({ unit_cost: -1 }), /HPP per unit harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ marketplace_fee_pct: 41 }), /Komisi platform maksimal 40 persen/);
  assert.throws(() => analyze({ affiliate_pct: 51 }), /Komisi affiliate maksimal 50 persen/);
  assert.throws(
    () => analyze({ affiliate_order_pct: 101 }),
    /Porsi pesanan affiliate maksimal 100 persen/
  );
  assert.throws(() => analyze({ host_count: 0 }), /Jumlah host harus bilangan bulat lebih dari 0/);
  assert.throws(() => analyze({ host_fee_per_hour: -1 }), /Biaya host per jam/);
  assert.throws(() => analyze({ ads_spend: -1 }), /Biaya iklan harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ packaging_per_order: -1 }), /Kemasan per pesanan/);
  assert.throws(() => analyze({ target_margin_pct: 91 }), /Target margin maksimal 90 persen/);
  assert.throws(
    () => analyze({ marketplace_fee_pct: 40, target_margin_pct: 60 }),
    /Jumlah komisi platform, affiliate efektif, dan target margin/
  );
});

test('normalisasi memberi nilai aman untuk field opsional', () => {
  const input = tool.normalizeInput({});
  assert.equal(input.session_label, '');
  assert.equal(input.duration_hours, 3);
  assert.equal(input.viewers, 0);
  assert.equal(input.units_sold, 0);
  assert.equal(input.marketplace_fee_pct, 8);
  assert.equal(input.affiliate_pct, 0);
  assert.equal(input.affiliate_order_pct, 0);
  assert.equal(input.host_count, 1);
  assert.equal(input.packaging_per_order, 0);
  assert.equal(input.target_margin_pct, 15);
});

test('CSV memuat lima skenario dan menetralkan formula', () => {
  const csv = tool.csvRows(base({ session_label: '=SUM(A1)' }));
  const lines = csv.split('\n');
  assert.equal(lines.length, 6);
  assert.ok(lines[0].indexOf('margin_persen') !== -1);
  assert.ok(lines[0].indexOf('komisi_affiliate') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('9288000') !== -1);
  assert.ok(csv.indexOf('Rugi sesi') === -1);
  assert.ok(csv.indexOf('Margin aman') !== -1);
});

test('semua keluaran bebas em dash dan en dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.csvRows(tool.example()),
    tool.analyze(base({ target_margin_pct: 25 })).recommendations.join(' '),
    tool.analyze(base({ ads_spend: 3000000 })).warnings.join(' '),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
    assert.equal(text.indexOf('\u2013'), -1, 'en dash ditemukan');
  });
});

test('API mengembalikan contoh, analisis, dan CSV', async () => {
  const app = require('../server');
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200);

    const example = await fetch(`http://127.0.0.1:${port}/api/example`).then((res) => res.json());
    assert.equal(example.duration_hours, 3);

    const analyzed = await fetch(`http://127.0.0.1:${port}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(example),
    }).then((res) => res.json());
    assert.equal(analyzed.session.profit, 1687440);

    const exported = await fetch(`http://127.0.0.1:${port}/api/export`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(example),
    });
    assert.equal(exported.status, 200);
    assert.ok(exported.headers.get('content-type').indexOf('text/csv') !== -1);

    const invalid = await fetch(`http://127.0.0.1:${port}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ avg_price: 0 }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    server.close();
  }
});
