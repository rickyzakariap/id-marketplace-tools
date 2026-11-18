'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/restock');
const app = require('../server');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat pilihan, asumsi, formula, dan ambang internal', () => {
  const data = tool.meta();
  assert.equal(data.marketplaces.length, 6);
  assert.equal(data.defaults.campaign_days, 3);
  assert.equal(data.defaults.uplift_pct, 150);
  assert.equal(data.limits.max_scenarios, 10);
  assert.equal(data.scenario_uplifts.length, 5);
  assert.equal(data.thresholds.safe_coverage, 1.1);
  assert.equal(data.assumptions.length, 6);
  assert.equal(data.formulas.length, 7);
  assert.ok(data.thresholds.note.indexOf('bukan aturan resmi') !== -1);
});

test('contoh menghitung kebutuhan, kekurangan, dan laba hilang', () => {
  const result = analyze({});
  const projection = result.projection;
  assert.equal(result.marketplace_label, 'Shopee');
  assert.equal(result.timeline.days_until_campaign, 24);
  assert.equal(result.timeline.restock_deadline, '2026-11-30');
  assert.equal(result.timeline.days_to_deadline, 12);
  assert.equal(projection.pre_demand, 720);
  assert.equal(projection.campaign_demand, 225);
  assert.equal(projection.safety_units, 120);
  assert.equal(projection.total_need, 1065);
  assert.equal(projection.available, 800);
  assert.equal(projection.coverage_pct, 75.1);
  assert.equal(projection.shortfall_units, 265);
  assert.equal(projection.stockout_units, 145);
  assert.equal(projection.lost_revenue, 21605000);
  assert.equal(projection.lost_profit, 7412400);
  assert.equal(projection.restock_units, 265);
  assert.equal(projection.cash_needed, 20670000);
  assert.equal(result.margin.net_per_unit, 51120);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Stok kurang, pesan sekarang');
});

test('penjualan nol tidak membagi nol dan memberi verdict kosong', () => {
  const result = analyze({
    baseline_daily_sales: 0,
    stock_on_hand: 0,
    incoming_qty: 0,
    safety_days: 0,
  });
  assert.equal(result.projection.total_need, 0);
  assert.equal(result.projection.coverage_pct, 100);
  assert.equal(result.projection.shortfall_units, 0);
  assert.equal(result.projection.stockout_units, 0);
  assert.equal(result.verdict.level, 'muted');
  assert.equal(result.verdict.label, 'Belum ada permintaan');
});

test('stok di atas 110 persen kebutuhan memberi verdict aman', () => {
  const result = analyze({
    campaign_date: '2026-11-28',
    as_of: '2026-11-18',
    campaign_days: 2,
    baseline_daily_sales: 10,
    uplift_pct: 0,
    safety_days: 2,
    stock_on_hand: 200,
    incoming_qty: 0,
    incoming_date: '',
  });
  assert.equal(result.projection.total_need, 140);
  assert.equal(result.projection.coverage_pct, 142.9);
  assert.equal(result.projection.surplus_units, 60);
  assert.equal(result.verdict.level, 'ok');
  assert.equal(result.verdict.label, 'Stok aman untuk kampanye');
});

test('kecukupan tepat 100 persen dianggap tipis, bukan aman', () => {
  const result = analyze({
    campaign_date: '2026-11-28',
    as_of: '2026-11-18',
    campaign_days: 2,
    baseline_daily_sales: 10,
    uplift_pct: 0,
    safety_days: 2,
    stock_on_hand: 140,
    incoming_qty: 0,
    incoming_date: '',
  });
  assert.equal(result.projection.coverage_pct, 100);
  assert.equal(result.projection.shortfall_units, 0);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Stok tipis');
});

test('lead time yang melewati tanggal kampanye memberi verdict terlambat', () => {
  const result = analyze({
    campaign_date: '2026-11-28',
    as_of: '2026-11-18',
    campaign_days: 2,
    baseline_daily_sales: 10,
    uplift_pct: 0,
    safety_days: 2,
    stock_on_hand: 100,
    incoming_qty: 0,
    incoming_date: '',
    lead_time_days: 30,
    handling_days: 2,
  });
  assert.equal(result.timeline.restock_deadline, '2026-10-27');
  assert.equal(result.timeline.days_to_deadline, -22);
  assert.equal(result.timeline.order_late, true);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Restock sudah terlambat');
});

test('stok masuk setelah tanggal kampanye tidak dihitung tersedia', () => {
  const result = analyze({
    campaign_date: '2026-11-28',
    as_of: '2026-11-18',
    baseline_daily_sales: 10,
    uplift_pct: 0,
    safety_days: 0,
    stock_on_hand: 100,
    incoming_qty: 50,
    incoming_date: '2026-11-29',
  });
  assert.equal(result.projection.incoming_usable, 0);
  assert.equal(result.projection.incoming_late, 50);
  assert.equal(result.projection.available, 100);
  assert.equal(result.projection.shortfall_units, 30);
  assert.equal(result.timeline.incoming_late, true);
});

test('skenario memakai kenaikan yang diminta dan mengurutkannya', () => {
  const result = tool.scenarios(base({ uplifts: [150, 0, 100] }));
  assert.equal(result.rows.length, 3);
  assert.deepEqual(result.rows.map((row) => row.uplift_pct), [0, 100, 150]);
  assert.equal(result.rows[2].total_need, 1065);
  assert.equal(result.rows[2].shortfall_units, 265);
});

test('skenario menolak daftar kosong, terlalu banyak, dan nilai tidak wajar', () => {
  assert.throws(
    () => tool.scenarios(base({ uplifts: [] })),
    /minimal satu skenario/
  );
  assert.throws(
    () => tool.scenarios(base({ uplifts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] })),
    /Maksimal 10 skenario/
  );
  assert.throws(
    () => tool.scenarios(base({ uplifts: [0, 1001] })),
    /0 sampai 1000 persen/
  );
  assert.throws(
    () => tool.scenarios(base({ uplifts: 'banyak' })),
    /harus berupa array/
  );
});

test('validasi menolak angka negatif, biaya di atas 100 persen, dan hari pecahan', () => {
  assert.throws(
    () => analyze({ baseline_daily_sales: -1 }),
    /Penjualan harian harus antara 0/
  );
  assert.throws(
    () => analyze({ marketplace_fee_pct: 101 }),
    /Biaya marketplace harus antara 0 dan 100/
  );
  assert.throws(
    () => analyze({ campaign_days: 1.5 }),
    /Lama kampanye harus berupa angka bulat/
  );
  assert.throws(
    () => analyze({ campaign_days: 0 }),
    /Lama kampanye harus antara 1 dan 90/
  );
});

test('validasi tanggal menolak format salah dan kampanye sebelum tanggal acuan', () => {
  assert.throws(
    () => analyze({ campaign_date: '' }),
    /Tanggal kampanye wajib diisi/
  );
  assert.throws(
    () => analyze({ campaign_date: '2026-02-31' }),
    /Tanggal kampanye tidak valid/
  );
  assert.throws(
    () => analyze({ campaign_date: '2026-11-01', as_of: '2026-11-18' }),
    /tidak boleh sebelum tanggal acuan/
  );
  assert.throws(
    () => analyze({ incoming_date: 'bukan tanggal' }),
    /Tanggal stok masuk tidak valid/
  );
});

test('margin negatif tidak dihitung sebagai laba hilang', () => {
  const result = analyze({
    unit_price: 70000,
    unit_cost: 65000,
    marketplace_fee_pct: 12,
    packaging_cost: 2000,
  });
  assert.equal(result.margin.negative, true);
  assert.ok(result.margin.net_per_unit < 0);
  assert.equal(result.projection.lost_profit, 0);
  assert.ok(
    result.recommendations.some((text) => text.indexOf('Margin bersih per unit') !== -1)
  );
});

test('pilihan tidak dikenal jatuh ke nilai aman', () => {
  const input = tool.normalizeInput({
    marketplace: 'tidak-ada',
    campaign_date: '2026-12-12',
    as_of: '2026-11-18',
  });
  assert.equal(input.marketplace, 'shopee');
  assert.equal(input.campaign_days, 3);
  assert.equal(input.safety_days, 4);
  assert.equal(input.handling_days, 2);
});

test('CSV memuat skenario dan menetralkan formula', () => {
  const csv = tool.csvRows(base({
    sku_name: '=SUM(A1)',
    uplifts: [0, 150],
  }));
  assert.ok(csv.indexOf('kecukupan_persen') !== -1);
  assert.ok(csv.indexOf('saran_restock_unit') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('2026-11-30') !== -1);
  assert.equal(csv.split('\n').length, 3);
});

test('semua keluaran tidak memakai em dash atau en dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    JSON.stringify(tool.scenarios(tool.example())),
    tool.csvRows(tool.example()),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
    assert.equal(text.indexOf('\u2013'), -1, 'en dash ditemukan');
  });
});

test('API mengembalikan 200 untuk data valid dan 400 untuk data salah', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const endpoint = 'http://127.0.0.1:' + address.port + '/api/analyze';

  const good = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(tool.example()),
  });
  assert.equal(good.status, 200);
  const goodBody = await good.json();
  assert.equal(goodBody.projection.shortfall_units, 265);

  const bad = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(base({ campaign_days: 0 })),
  });
  assert.equal(bad.status, 400);
  const badBody = await bad.json();
  assert.match(badBody.error, /Lama kampanye/);
});
