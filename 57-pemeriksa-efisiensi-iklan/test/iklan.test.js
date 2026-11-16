'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/iklan');

function baseCampaign(overrides) {
  return Object.assign(
    {
      name: 'Kampanye Uji',
      spend: 1000000,
      impressions: 100000,
      clicks: 2000,
      orders: 40,
      revenue: 4000000,
      unit_cost: 50000,
      days: 30,
    },
    overrides || {}
  );
}

function input(campaigns, settings) {
  return {
    settings: Object.assign({}, tool.DEFAULT_SETTINGS, settings || {}),
    campaigns,
  };
}

function analyzeOne(overrides, settings) {
  return tool.analyze(input([baseCampaign(overrides)], settings)).campaigns[0];
}

function exampleInput(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

test('meta memuat pengaturan, status, funnel, asumsi, dan rumus', () => {
  const data = tool.meta();
  assert.equal(data.default_settings.fee_pct, 8);
  assert.equal(data.default_settings.packaging_per_order, 1500);
  assert.equal(data.setting_fields.length, 5);
  assert.equal(data.statuses.length, 4);
  assert.deepEqual(
    data.statuses.map((item) => item.id),
    ['sehat', 'tipis', 'rugi', 'struktur_rugi']
  );
  assert.equal(data.funnels.length, 5);
  assert.equal(data.assumptions.length, 7);
  assert.equal(data.formulas.length, 7);
  assert.equal(data.limits.max_campaigns, 50);
  assert.ok(data.rules.scope_note.indexOf('tidak membaca akun iklan') !== -1);
});

test('contoh menghitung total belanja, laba, dan ROAS impas', () => {
  const result = tool.analyze(tool.example());
  const summary = result.summary;

  assert.equal(summary.total_campaigns, 3);
  assert.equal(summary.total_spend, 4500000);
  assert.equal(summary.total_revenue, 26400000);
  assert.equal(summary.total_orders, 190);
  assert.equal(summary.total_clicks, 6500);
  assert.equal(summary.total_impressions, 450000);
  assert.equal(summary.total_cogs, 13200000);
  assert.equal(summary.total_fee, 2112000);
  assert.equal(summary.total_packaging, 285000);
  assert.equal(summary.total_contribution, 10803000);
  assert.equal(summary.total_profit, 6303000);
  assert.equal(summary.total_wasted_spend, 540000);
  assert.equal(summary.roas, 5.87);
  assert.equal(summary.acos_pct, 17.05);
  assert.equal(summary.ctr_pct, 1.44);
  assert.equal(summary.cvr_pct, 2.92);
  assert.equal(summary.cpa, 23684.21);
  assert.equal(summary.break_even_roas, 2.44);
  assert.equal(summary.margin_before_ads_pct, 40.92);
  assert.equal(summary.margin_after_ads_pct, 23.88);
  assert.equal(summary.profit_per_order, 33173.68);
  assert.equal(summary.average_daily_spend, 50000);
  assert.equal(summary.loss_count, 1);
  assert.equal(summary.thin_count, 1);
  assert.equal(summary.healthy_count, 1);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Ada kampanye yang membakar budget');
});

test('kampanye sehat menghitung CTR, CPC, CPA, margin, dan laba', () => {
  const item = tool.analyze(tool.example()).campaigns[0];

  assert.equal(item.name, 'Kaos Polos Combed 30s');
  assert.equal(item.ctr_pct, 2);
  assert.equal(item.cpc, 400);
  assert.equal(item.cvr_pct, 4);
  assert.equal(item.cpa, 10000);
  assert.equal(item.aov, 150000);
  assert.equal(item.cogs, 8400000);
  assert.equal(item.fee, 1440000);
  assert.equal(item.packaging, 180000);
  assert.equal(item.contribution, 7980000);
  assert.equal(item.margin_before_ads_pct, 44.33);
  assert.equal(item.break_even_roas, 2.26);
  assert.equal(item.roas, 15);
  assert.equal(item.acos_pct, 6.67);
  assert.equal(item.profit_after_ads, 6780000);
  assert.equal(item.profit_per_order, 56500);
  assert.equal(item.wasted_spend, 0);
  assert.equal(item.break_even_cpa, 66500);
  assert.equal(item.max_profitable_spend, 7980000);
  assert.equal(item.cut_needed, 0);
  assert.equal(item.scale_room, 6780000);
  assert.equal(item.daily_spend, 40000);
  assert.equal(item.daily_revenue, 600000);
  assert.equal(item.daily_orders, 4);
  assert.equal(item.status, 'sehat');
  assert.equal(item.funnel, 'sehat');
});

test('kampanye merugi menghitung budget terbuang dan batas CPA impas', () => {
  const item = tool.analyze(tool.example()).campaigns[1];

  assert.equal(item.name, 'Tumbler Stainless 500 ml');
  assert.equal(item.contribution, 1860000);
  assert.equal(item.break_even_roas, 3.23);
  assert.equal(item.roas, 2.5);
  assert.equal(item.acos_pct, 40);
  assert.equal(item.profit_after_ads, -540000);
  assert.equal(item.margin_after_ads_pct, -9);
  assert.equal(item.wasted_spend, 540000);
  assert.equal(item.break_even_cpa, 46500);
  assert.equal(item.profit_per_order, -13500);
  assert.equal(item.cut_needed, 540000);
  assert.equal(item.scale_room, 0);
  assert.equal(item.status, 'rugi');
  assert.equal(item.status_level, 'ember');
});

test('kampanye laba tipis diberi status signal dan rekomendasi CPA', () => {
  const item = tool.analyze(tool.example()).campaigns[2];

  assert.equal(item.contribution, 963000);
  assert.equal(item.profit_after_ads, 63000);
  assert.equal(item.margin_after_ads_pct, 2.63);
  assert.equal(item.status, 'tipis');
  assert.equal(item.status_level, 'signal');
  assert.equal(item.break_even_cpa, 32100);
  assert.ok(item.action.indexOf('32.100') !== -1);
});

test('diagnosis funnel memisahkan masalah materi, halaman, audiens, dan pesanan', () => {
  const materi = analyzeOne({
    impressions: 200000,
    clicks: 1000,
    orders: 40,
    spend: 500000,
  });
  assert.equal(materi.ctr_pct, 0.5);
  assert.equal(materi.cvr_pct, 4);
  assert.equal(materi.funnel, 'materi');

  const halaman = analyzeOne({
    clicks: 2000,
    orders: 20,
    spend: 400000,
    revenue: 2000000,
  });
  assert.equal(halaman.ctr_pct, 2);
  assert.equal(halaman.cvr_pct, 1);
  assert.equal(halaman.funnel, 'halaman');

  const audiens = analyzeOne({
    clicks: 500,
    orders: 5,
    spend: 200000,
    revenue: 500000,
  });
  assert.equal(audiens.funnel, 'audiens');

  const tanpaOrder = analyzeOne({
    clicks: 1000,
    orders: 0,
    spend: 300000,
    revenue: 0,
  });
  assert.equal(tanpaOrder.funnel, 'tanpa_order');
  assert.equal(tanpaOrder.status, 'rugi');
  assert.equal(tanpaOrder.profit_after_ads, -300000);
  assert.equal(tanpaOrder.cpa, null);
  assert.equal(tanpaOrder.aov, null);
  assert.equal(tanpaOrder.margin_before_ads_pct, 0);
});

test('margin negatif sebelum iklan ditandai struktur rugi', () => {
  const item = analyzeOne({ unit_cost: 100000 });

  assert.equal(item.contribution, -380000);
  assert.equal(item.margin_before_ads_pct, -9.5);
  assert.equal(item.break_even_roas, null);
  assert.equal(item.break_even_cpa, null);
  assert.equal(item.profit_after_ads, -1380000);
  assert.equal(item.wasted_spend, 1000000);
  assert.equal(item.status, 'struktur_rugi');
  assert.equal(item.status_level, 'ember');
});

test('rencana budget menghitung potongan dan proyeksi penskalaan', () => {
  const result = tool.plan(
    Object.assign({ target_profit: 8000000, scale_pct: 20 }, tool.example())
  );

  assert.equal(result.current_profit, 6303000);
  assert.equal(result.profit_gap, 1697000);
  assert.equal(result.max_safe_spend, 2803000);
  assert.equal(result.spend_headroom, -1697000);
  assert.equal(result.cut_needed, 1697000);
  assert.equal(result.room_to_grow, 0);
  assert.equal(result.required_roas, 9.42);
  assert.equal(result.required_cpa, 14752.63);
  assert.equal(result.projected.spend, 5400000);
  assert.equal(result.projected.revenue, 31680000);
  assert.equal(result.projected.contribution, 12963600);
  assert.equal(result.projected.profit, 7563600);
  assert.equal(result.projected.incremental_profit, 1260600);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Budget iklan harus dipotong');
  assert.equal(result.items.length, 3);
  assert.equal(result.items[1].cut_needed, 540000);
  assert.equal(result.items[0].scale_room, 6780000);
});

test('rencana budget mendeteksi target tercapai dan target mustahil', () => {
  const achieved = tool.plan(
    Object.assign({ target_profit: 5000000 }, tool.example())
  );
  assert.equal(achieved.verdict.level, 'ok');
  assert.equal(achieved.verdict.label, 'Target laba sudah tercapai');
  assert.equal(achieved.max_safe_spend, 5803000);
  assert.equal(achieved.spend_headroom, 1303000);
  assert.equal(achieved.required_roas, 4.55);

  const impossible = tool.plan(
    Object.assign({ target_profit: 12000000 }, tool.example())
  );
  assert.equal(impossible.verdict.level, 'ember');
  assert.equal(impossible.verdict.label, 'Target laba melebihi margin');
});

test('validasi menolak kampanye kosong dan angka yang tidak masuk akal', () => {
  assert.throws(
    () => tool.analyze({ settings: {}, campaigns: [] }),
    /minimal satu kampanye/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ name: '' })])),
    /Nama kampanye wajib/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ spend: 0 })])),
    /Belanja iklan/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ clicks: 0 })])),
    /Klik .* harus lebih dari 0/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ impressions: 100, clicks: 200 })])),
    /Klik tidak boleh lebih besar/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ orders: 50, clicks: 40 })])),
    /Pesanan tidak boleh lebih besar/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ orders: 0, revenue: 5000 })])),
    /Pendapatan harus 0/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ revenue: 0 })])),
    /Pendapatan .* harus lebih dari 0/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ unit_cost: -1 })])),
    /Modal per unit/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign({ days: 0 })])),
    /Durasi/
  );
  assert.throws(
    () => tool.analyze(input([baseCampaign()], { fee_pct: 60 })),
    /Biaya marketplace/
  );
});

test('validasi rencana membatasi target laba dan penskalaan', () => {
  assert.throws(
    () => tool.plan(Object.assign({ target_profit: -1 }, tool.example())),
    /Target laba/
  );
  assert.throws(
    () => tool.plan(Object.assign({ scale_pct: 101 }, tool.example())),
    /Penskalaan budget/
  );
});

test('CSV memuat kolom ROAS impas dan menetralkan formula', () => {
  const data = exampleInput();
  data.campaigns[0].name = '=SUM(A1)';
  const csv = tool.csvRows(data);
  assert.ok(csv.indexOf('roas_impas') !== -1);
  assert.ok(csv.indexOf('budget_terbuang') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('6780000') !== -1);
  assert.ok(csv.indexOf("'-540000") === -1);
  assert.ok(csv.indexOf('-540000') !== -1);
});

test('hasil tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    JSON.stringify(tool.plan(Object.assign({ target_profit: 8000000 }, tool.example()))),
    tool.csvRows(tool.example()),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});
