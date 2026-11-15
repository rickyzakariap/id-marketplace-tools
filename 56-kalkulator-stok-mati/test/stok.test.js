'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/stok');

function baseSku(overrides) {
  return Object.assign(
    {
      code: 'SKU-UJI',
      name: 'Produk Uji',
      quantity: 10,
      unit_cost: 10000,
      unit_price: 20000,
      monthly_sales: 5,
      days_in_stock: 30,
    },
    overrides || {}
  );
}

function input(skus, settings) {
  return {
    settings: Object.assign({}, tool.DEFAULT_SETTINGS, settings || {}),
    skus,
  };
}

function analyzeOne(overrides, settings) {
  return tool.analyze(input([baseSku(overrides)], settings));
}

function exampleInput(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

test('meta memuat pengaturan, status, asumsi, dan rumus', () => {
  const data = tool.meta();
  assert.equal(data.default_settings.dead_days, 90);
  assert.equal(data.default_settings.slow_days, 45);
  assert.equal(data.setting_fields.length, 7);
  assert.equal(data.statuses.length, 5);
  assert.deepEqual(
    data.statuses.map((item) => item.id),
    ['habis', 'sehat', 'baru', 'melambat', 'mati']
  );
  assert.equal(data.assumptions.length, 6);
  assert.equal(data.formulas.length, 4);
  assert.equal(data.limits.max_skus, 100);
  assert.ok(data.rules.scope_note.indexOf('tidak memprediksi') !== -1);
});

test('contoh menghitung modal, stok mati, dan biaya simpan', () => {
  const result = tool.analyze(tool.example());
  assert.equal(result.summary.total_skus, 5);
  assert.equal(result.summary.total_units, 410);
  assert.equal(result.summary.total_capital, 13740000);
  assert.equal(result.summary.total_retail_value, 32690000);
  assert.equal(result.summary.dead_units, 150);
  assert.equal(result.summary.slow_units, 60);
  assert.equal(result.summary.at_risk_units, 210);
  assert.equal(result.summary.dead_capital, 7440000);
  assert.equal(result.summary.slow_capital, 2700000);
  assert.equal(result.summary.at_risk_capital, 10140000);
  assert.equal(result.summary.dead_ratio_pct, 54.15);
  assert.equal(result.summary.at_risk_ratio_pct, 73.8);
  assert.equal(result.summary.monthly_holding_cost, 479800);
  assert.equal(result.summary.dead_monthly_holding, 223800);
  assert.equal(result.summary.at_risk_monthly_holding, 307800);
  assert.equal(result.summary.annual_holding_cost_at_risk, 3693600);
  assert.equal(result.summary.break_even_discount_pct, 12.18);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Modal tertahan di stok mati');
});

test('status stok mengikuti umur, penjualan, dan target bulan habis', () => {
  const empty = tool.analyze(
    input([baseSku({ quantity: 0 }), baseSku({ name: 'Pengisi' })])
  );
  assert.equal(empty.skus[0].status, 'habis');
  assert.equal(
    analyzeOne({ monthly_sales: 0, days_in_stock: 44 }).skus[0].status,
    'baru'
  );
  assert.equal(
    analyzeOne({ monthly_sales: 0, days_in_stock: 45 }).skus[0].status,
    'melambat'
  );
  assert.equal(
    analyzeOne({ monthly_sales: 0, days_in_stock: 90 }).skus[0].status,
    'mati'
  );
  assert.equal(
    analyzeOne({ quantity: 10, monthly_sales: 4, days_in_stock: 44 }).skus[0].status,
    'sehat'
  );
  assert.equal(
    analyzeOne({ quantity: 10, monthly_sales: 4, days_in_stock: 45 }).skus[0].status,
    'melambat'
  );
  assert.equal(
    analyzeOne({ quantity: 30, monthly_sales: 10, days_in_stock: 10 }).skus[0].status,
    'sehat'
  );
  assert.equal(
    analyzeOne({ quantity: 31, monthly_sales: 10, days_in_stock: 10 }).skus[0].status,
    'melambat'
  );
});

test('biaya simpan dan diskon impas dihitung dari modal dan nilai jual', () => {
  const item = analyzeOne({
    quantity: 120,
    unit_cost: 32000,
    unit_price: 79000,
    monthly_sales: 8,
    days_in_stock: 140,
  }).skus[0];

  assert.equal(item.status, 'mati');
  assert.equal(item.capital, 3840000);
  assert.equal(item.retail_value, 9480000);
  assert.equal(item.coverage_months, 15);
  assert.equal(item.storage_cost_month, 60000);
  assert.equal(item.capital_cost_month, 38400);
  assert.equal(item.damage_cost_month, 38400);
  assert.equal(item.holding_cost_month, 136800);
  assert.equal(item.holding_cost_per_unit_month, 1140);
  assert.equal(item.holding_cost_to_clear, 2052000);
  assert.equal(item.break_even_discount_pct, 23.53);
});

test('stok tanpa penjualan memakai horizon target untuk biaya simpan', () => {
  const item = analyzeOne({
    quantity: 30,
    unit_cost: 120000,
    unit_price: 249000,
    monthly_sales: 0,
    days_in_stock: 120,
  }).skus[0];

  assert.equal(item.status, 'mati');
  assert.equal(item.coverage_months, null);
  assert.equal(item.holding_cost_month, 87000);
  assert.equal(item.holding_cost_to_clear, 261000);
  assert.equal(item.break_even_discount_pct, 3.8);
});

test('skenario diskon membandingkan jual sekarang dengan jual bertahap', () => {
  const result = tool.scenario(
    exampleInput({ discount_pct: 20, clear_months: 3 })
  );

  assert.equal(result.items.length, 3);
  assert.equal(result.summary.item_count, 3);
  assert.equal(result.summary.liquidate_count, 2);
  assert.equal(result.summary.hold_count, 1);
  assert.equal(result.summary.at_risk_capital, 10140000);
  assert.equal(result.summary.total_net_now, 16847040);
  assert.equal(result.summary.total_net_wait, 11621400);
  assert.equal(result.summary.total_advantage, 5225640);
  assert.equal(result.summary.cash_recovery_pct, 166.14);

  const kaos = result.items.find((item) => item.code === 'KAOS-CC30');
  const tumbler = result.items.find((item) => item.code === 'TMB-500');
  const sepatu = result.items.find((item) => item.code === 'SEP-SNK');

  assert.equal(kaos.verdict, 'likuidasi');
  assert.equal(kaos.advantage, 307680);
  assert.equal(tumbler.verdict, 'tahan');
  assert.equal(tumbler.advantage, -840960);
  assert.equal(sepatu.verdict, 'likuidasi');
  assert.equal(sepatu.wait_basis, 'target');
  assert.ok(sepatu.note.indexOf('Tidak ada penjualan') !== -1);
});

test('stok tanpa penjualan tetap disarankan likuidasi pada diskon kecil', () => {
  const result = tool.scenario(exampleInput({ discount_pct: 0 }));
  const sepatu = result.items.find((item) => item.code === 'SEP-SNK');
  assert.equal(sepatu.verdict, 'likuidasi');
  assert.equal(sepatu.net_now, 6872400);
  assert.equal(sepatu.net_wait, -261000);
  assert.equal(sepatu.advantage, 7133400);
});

test('skenario tanpa stok berisiko memberi verdict aman', () => {
  const result = tool.scenario(
    input([
      baseSku({
        quantity: 20,
        unit_cost: 10000,
        unit_price: 20000,
        monthly_sales: 10,
        days_in_stock: 10,
      }),
    ], {})
  );
  assert.equal(result.items.length, 0);
  assert.equal(result.summary.item_count, 0);
  assert.equal(result.summary.verdict.level, 'ok');
  assert.equal(result.summary.verdict.label, 'Diskon tidak diperlukan');
});

test('validasi menolak SKU kosong, nominal negatif, dan harga nol', () => {
  assert.throws(
    () => tool.analyze({ settings: {}, skus: [] }),
    /minimal satu SKU/
  );
  assert.throws(
    () => tool.analyze(input([baseSku({ quantity: -1 })])),
    /Jumlah stok/
  );
  assert.throws(
    () => tool.analyze(input([baseSku({ name: '' })])),
    /Nama SKU wajib/
  );
  assert.throws(
    () => tool.analyze(input([baseSku({ unit_price: 0 })])),
    /Harga jual/
  );
  assert.throws(
    () => tool.analyze(input([baseSku({ monthly_sales: 'abc' })])),
    /Penjualan per bulan/
  );
  assert.throws(
    () => tool.analyze(input([baseSku({ quantity: 0 })])),
    /jumlah stok lebih dari 0/
  );
  assert.throws(
    () => tool.analyze(input([baseSku()], { dead_days: 30, slow_days: 45 })),
    /tidak boleh lebih kecil/
  );
});

test('validasi skenario membatasi diskon dan horizon', () => {
  assert.throws(
    () => tool.scenario(exampleInput({ discount_pct: 91 })),
    /Diskon harus antara 0 dan 90/
  );
  assert.throws(
    () => tool.scenario(exampleInput({ discount_pct: -1 })),
    /Diskon harus antara 0 dan 90/
  );
  assert.throws(
    () => tool.scenario(exampleInput({ clear_months: 0 })),
    /Horizon penjualan/
  );
  assert.throws(
    () => tool.scenario(exampleInput({ clear_months: 2.5 })),
    /bilangan bulat/
  );
});

test('CSV memuat kolom biaya simpan dan menetralkan formula', () => {
  const data = exampleInput();
  data.skus[0].name = '=SUM(A1)';
  const csv = tool.csvRows(data);
  assert.ok(csv.indexOf('diskon_impas_persen') !== -1);
  assert.ok(csv.indexOf('biaya_simpan_sampai_habis') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('2052000') !== -1);
});

test('hasil tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    JSON.stringify(tool.scenario(exampleInput({ discount_pct: 20 }))),
    tool.csvRows(tool.example()),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});
