'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/pencairan');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat batas, skenario, rumus, dan asumsi', () => {
  const data = tool.meta();
  assert.deepEqual(data.payout_scenarios, [3, 7, 14, 21]);
  assert.equal(data.limits.max_delay_days, 60);
  assert.equal(data.limits.max_lead_days, 180);
  assert.equal(data.cash_status_labels.thin, 'Kas ketat');
  assert.equal(data.daily_status_labels.loss, 'Rugi harian');
  assert.ok(data.formula.indexOf('profit harian') !== -1);
  assert.ok(data.working_capital_formula.indexOf('modal kerja') !== -1);
  assert.ok(data.recommended_cash_formula.indexOf('kas disarankan') !== -1);
  assert.ok(data.assumptions.length >= 9);
  assert.ok(data.scope_note.indexOf('tidak menetapkan') !== -1);
  assert.ok(data.disclaimer.indexOf('bukan laporan arus kas resmi') !== -1);
});

test('contoh menghitung omzet, biaya, profit, dan margin harian', () => {
  const result = analyze({});
  const volume = result.volume;

  assert.equal(volume.orders, 12);
  assert.equal(volume.revenue, 1140000);
  assert.equal(volume.platform_fee, 91200);
  assert.equal(volume.product_cost, 660000);
  assert.equal(volume.packaging_cost, 24000);
  assert.equal(volume.shipping_cost, 36000);
  assert.equal(volume.total_cost, 1061200);
  assert.equal(volume.profit, 78800);
  assert.equal(volume.margin_pct, 6.91);
  assert.equal(volume.contribution_per_order, 27400);
  assert.equal(volume.daily_cash_out, 970000);
  assert.equal(volume.net_receipt_per_day, 1048800);
  assert.equal(volume.monthly_profit, 2364000);
  assert.equal(volume.profit_per_order, 6566.67);
  assert.equal(volume.status, 'thin');
});

test('modal kerja minimum memisahkan piutang pencairan dan buffer stok', () => {
  const result = analyze({});
  const cash = result.cash;

  assert.equal(cash.lag_days, 9);
  assert.equal(cash.receivable_gap, 8730000);
  assert.equal(cash.inventory_buffer, 4620000);
  assert.equal(cash.minimum_working_capital, 13350000);
  assert.equal(cash.safety_buffer, 4850000);
  assert.equal(cash.recommended_cash, 18200000);
  assert.equal(cash.settlement_receivable, 9439200);
  assert.equal(cash.surplus_over_minimum, 1650000);
  assert.equal(cash.surplus_over_recommended, -3200000);
  assert.equal(cash.cash_coverage_days, 15.46);
  assert.equal(cash.working_capital_per_order, 1112500);
  assert.equal(cash.status, 'thin');
  assert.equal(cash.status_label, 'Kas ketat');
});

test('volume aman dan titik balik modal operasional dihitung', () => {
  const result = analyze({});
  assert.equal(result.limits.cash_out_per_order, 60000);
  assert.equal(result.limits.max_orders_at_current_cash, 9);
  assert.equal(result.limits.break_even_orders, 10);

  const biggerCash = analyze({ current_cash: 30000000, target_margin_pct: 5 });
  assert.equal(biggerCash.cash.status, 'ok');
  assert.equal(biggerCash.limits.max_orders_at_current_cash, 21);
  assert.equal(biggerCash.verdict.label, 'Kas aman');
});

test('skenario jeda pencairan menandai kas aman, ketat, dan kurang', () => {
  const result = analyze({});
  assert.equal(result.scenarios.length, 4);
  assert.deepEqual(
    result.scenarios.map((item) => item.payout_delay_days),
    [3, 7, 14, 21]
  );
  assert.deepEqual(
    result.scenarios.map((item) => item.status),
    ['ok', 'thin', 'short', 'short']
  );
  assert.deepEqual(
    result.scenarios.map((item) => item.minimum_working_capital),
    [9470000, 13350000, 20140000, 26930000]
  );
  assert.deepEqual(
    result.scenarios.map((item) => item.recommended_cash),
    [14320000, 18200000, 24990000, 31780000]
  );
  assert.equal(result.scenarios[0].surplus_over_recommended, 680000);
  assert.equal(result.scenarios[3].surplus_over_recommended, -16780000);
  assert.equal(result.scenarios[1].is_actual, true);
  assert.equal(result.scenario_summary.safe_count, 1);
  assert.equal(result.scenario_summary.thin_count, 1);
  assert.equal(result.scenario_summary.short_count, 2);
  assert.equal(result.scenario_summary.max_safe_payout_delay_days, 3);
  assert.equal(result.scenario_summary.first_short_payout_delay_days, 14);
});

test('kas kurang menghasilkan verdict merah dan saran tambahan kas', () => {
  const result = analyze({ current_cash: 10000000 });
  assert.equal(result.cash.status, 'short');
  assert.equal(result.cash.surplus_over_minimum, -3350000);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Kas tidak cukup');
  assert.ok(result.verdict.note.indexOf('Rp 3.350.000') !== -1);
  assert.ok(result.verdict.note.indexOf('5 pesanan per hari') !== -1);
  assert.ok(
    result.recommendations.some((item) => item.indexOf('Tambah kas minimal Rp 3.350.000') !== -1)
  );
  assert.ok(result.warnings.some((item) => item.indexOf('Kas kurang Rp 3.350.000') !== -1));
});

test('operasional rugi tetap terdeteksi walau kas mencukupi', () => {
  const result = analyze({ ads_spend_per_day: 500000, current_cash: 40000000 });
  assert.equal(result.volume.profit, -271200);
  assert.equal(result.volume.margin_pct, -23.79);
  assert.equal(result.cash.status, 'ok');
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Operasional rugi');
  assert.ok(result.warnings.some((item) => item.indexOf('Operasional harian rugi') !== -1));
  assert.ok(result.warnings.some((item) => item.indexOf('Margin harian') !== -1));
});

test('pesanan nol tidak menghasilkan NaN atau pembagian nol', () => {
  const result = analyze({
    daily_orders: 0,
    ads_spend_per_day: 100000,
    fixed_cost_per_day: 50000,
    current_cash: 5000000,
  });
  assert.equal(result.volume.revenue, 0);
  assert.equal(result.volume.profit, -150000);
  assert.equal(result.volume.margin_pct, 0);
  assert.equal(result.volume.profit_per_order, null);
  assert.equal(result.cash.receivable_gap, 150000 * 9);
  assert.equal(result.cash.inventory_buffer, 0);
  assert.equal(result.cash.working_capital_per_order, null);
  assert.ok(Number.isFinite(result.cash.minimum_working_capital));
  assert.equal(result.verdict.label, 'Operasional rugi');

  const empty = analyze({
    daily_orders: 0,
    ads_spend_per_day: 0,
    fixed_cost_per_day: 0,
    current_cash: 0,
  });
  assert.equal(empty.cash.minimum_working_capital, 0);
  assert.equal(empty.cash.recommended_cash, 0);
  assert.equal(empty.cash.cash_coverage_days, null);
  assert.equal(empty.verdict.label, 'Kas aman');
});

test('input salah ditolak dengan pesan yang jelas', () => {
  assert.throws(() => analyze({ daily_orders: 1.5 }), /Pesanan per hari harus bilangan bulat/);
  assert.throws(() => analyze({ avg_price: 0 }), /Harga rata-rata per pesanan harus lebih dari 0/);
  assert.throws(() => analyze({ unit_cost: -1 }), /HPP per pesanan harus berupa angka/);
  assert.throws(() => analyze({ marketplace_fee_pct: 41 }), /Komisi platform maksimal 40 persen/);
  assert.throws(() => analyze({ packaging_per_order: -1 }), /Kemasan per pesanan/);
  assert.throws(() => analyze({ shipping_subsidy_per_order: -1 }), /Subsidi ongkir per pesanan/);
  assert.throws(() => analyze({ ads_spend_per_day: -1 }), /Biaya iklan per hari/);
  assert.throws(() => analyze({ fixed_cost_per_day: -1 }), /Biaya tetap per hari/);
  assert.throws(() => analyze({ target_margin_pct: 91 }), /Target margin maksimal 90 persen/);
  assert.throws(() => analyze({ delivery_days: 1.5 }), /Waktu kirim harus bilangan bulat/);
  assert.throws(() => analyze({ payout_delay_days: 61 }), /Jeda pencairan maksimal 60 hari/);
  assert.throws(() => analyze({ restock_lead_days: 181 }), /Lead time restock maksimal 180 hari/);
  assert.throws(() => analyze({ safety_buffer_days: -1 }), /Buffer kas harus bilangan bulat/);
  assert.throws(
    () => analyze({ current_cash: -1 }),
    /Kas saat ini harus berupa angka 0 atau lebih/
  );
});

test('normalisasi memberi nilai aman untuk field opsional', () => {
  const input = tool.normalizeInput({});
  assert.equal(input.store_label, '');
  assert.equal(input.daily_orders, 12);
  assert.equal(input.avg_price, 95000);
  assert.equal(input.marketplace_fee_pct, 8);
  assert.equal(input.target_margin_pct, 10);
  assert.equal(input.delivery_days, 2);
  assert.equal(input.payout_delay_days, 7);
  assert.equal(input.restock_lead_days, 7);
  assert.equal(input.safety_buffer_days, 5);
  assert.equal(input.current_cash, 15000000);
});

test('CSV memuat empat skenario dan menetralkan formula', () => {
  const csv = tool.csvRows(base({ store_label: '=SUM(A1)' }));
  const lines = csv.split('\n');
  assert.equal(lines.length, 5);
  assert.ok(lines[0].indexOf('modal_kerja_minimum') !== -1);
  assert.ok(lines[0].indexOf('kas_disarankan') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('9470000') !== -1);
  assert.ok(csv.indexOf('Kas ketat') !== -1);
  assert.ok(csv.indexOf('Kas kurang') !== -1);
});

test('semua keluaran bebas em dash dan en dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.csvRows(tool.example()),
    tool.analyze(base({ current_cash: 10000000 })).recommendations.join(' '),
    tool.analyze(base({ ads_spend_per_day: 500000 })).warnings.join(' '),
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
    assert.equal(example.daily_orders, 12);

    const analyzed = await fetch(`http://127.0.0.1:${port}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(example),
    }).then((res) => res.json());
    assert.equal(analyzed.cash.minimum_working_capital, 13350000);
    assert.equal(analyzed.verdict.label, 'Kas ketat');

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
      body: JSON.stringify({ daily_orders: -1 }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    server.close();
  }
});
