'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/grosir');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat langkah pembulatan, batas, rumus, dan asumsi', () => {
  const data = tool.meta();
  assert.equal(data.rounding_steps.length, 5);
  assert.equal(data.limits.max_tiers, 8);
  assert.equal(data.limits.max_quantity, 100000);
  assert.equal(data.limits.max_discount_pct, 90);
  assert.ok(data.formula.indexOf('harga grosir') !== -1);
  assert.ok(data.margin_formula.indexOf('margin') !== -1);
  assert.equal(data.status_labels.loss, 'Rugi per pesanan');
  assert.ok(data.assumptions.length >= 6);
  assert.ok(data.scope_note.indexOf('tidak menetapkan harga resmi') !== -1);
  assert.ok(data.disclaimer.indexOf('bukan laporan laba resmi') !== -1);
});

test('contoh menghitung harga, biaya, profit, dan margin tiap tier', () => {
  const result = analyze({});
  assert.equal(result.tier_count, 4);
  assert.equal(result.order_cost, 8250);
  assert.equal(result.retail_contribution_per_unit, 28000);

  const first = result.tiers[0];
  assert.equal(first.quantity, 3);
  assert.equal(first.unit_price, 145500);
  assert.equal(first.effective_discount_pct, 3);
  assert.equal(first.revenue, 436500);
  assert.equal(first.marketplace_fee, 34920);
  assert.equal(first.product_cost, 330000);
  assert.equal(first.total_cost, 373170);
  assert.equal(first.profit, 63330);
  assert.equal(first.profit_per_unit, 21110);
  assert.equal(first.margin_pct, 14.51);
  assert.equal(first.status, 'ok');
  assert.equal(first.monthly_profit, 1899900);
  assert.equal(first.monthly_units, 90);

  const last = result.tiers[3];
  assert.equal(last.quantity, 24);
  assert.equal(last.unit_price, 117000);
  assert.equal(last.revenue, 2808000);
  assert.equal(last.marketplace_fee, 224640);
  assert.equal(last.total_cost, 2872890);
  assert.equal(last.profit, -64890);
  assert.equal(last.margin_pct, -2.31);
  assert.equal(last.status, 'loss');
});

test('ringkasan menandai tier aman, tipis, rugi, dan verdict utama', () => {
  const result = analyze({});
  assert.equal(result.safe_count, 1);
  assert.equal(result.thin_count, 2);
  assert.equal(result.loss_count, 1);
  assert.equal(result.best_safe_tier.quantity, 3);
  assert.equal(result.best_safe_tier.profit, 63330);
  assert.equal(result.best_margin_tier.margin_pct, 14.51);
  assert.equal(result.highest_profit_tier.quantity, 12);
  assert.equal(result.highest_profit_tier.profit, 79350);
  assert.equal(result.lowest_safe_quantity, 3);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Ada tier yang rugi');
  assert.ok(result.verdict.note.indexOf('Rp 64.890') !== -1);
  assert.ok(result.verdict.note.indexOf('Rp 1.946.700') !== -1);
  assert.ok(result.verdict.note.indexOf('Rp -') === -1);
});

test('harga minimum target dan diskon maksimum dihitung per tier', () => {
  const result = analyze({});
  const first = result.tiers[0];
  assert.equal(first.minimum_unit_price, 141000);
  assert.equal(first.price_gap, 4500);
  assert.equal(first.max_discount_at_target_pct, 6);
  assert.equal(first.minimum_quantity_to_cover_cost, 1);

  const middle = result.tiers[2];
  assert.equal(middle.minimum_unit_price, 138400);
  assert.equal(middle.price_gap, -10900);
  assert.equal(middle.max_discount_at_target_pct, 7.73);
  assert.equal(middle.minimum_quantity_to_cover_cost, 2);

  const loss = result.tiers[3];
  assert.equal(loss.minimum_unit_price, 138000);
  assert.equal(loss.contribution_per_unit, -2360);
  assert.equal(loss.minimum_quantity_to_cover_cost, null);
});

test('pembulatan harga mengubah diskon efektif', () => {
  const result = analyze({
    retail_price: 150000,
    rounding_step: 1000,
    tiers: [{ quantity: 3, discount_pct: 3 }],
  });
  const tier = result.tiers[0];
  assert.equal(tier.unit_price, 146000);
  assert.equal(tier.discount_pct, 3);
  assert.equal(tier.effective_discount_pct, 2.67);
});

test('harga minimum menghasilkan margin minimal sesuai target', () => {
  const result = analyze({});
  result.tiers.forEach((tier) => {
    const revenue = tier.minimum_unit_price * tier.quantity;
    const fee = revenue * (result.input.marketplace_fee_pct / 100);
    const profit = revenue - fee - tier.product_cost - tier.order_cost;
    const margin = (profit / revenue) * 100;
    assert.ok(
      margin >= result.input.target_margin_pct - 0.01,
      'margin tier ' + tier.quantity + ' hanya ' + margin
    );
  });
});

test('tier tipis tetap diberi verdict waspada dan harga minimum', () => {
  const result = analyze({
    tiers: [{ quantity: 6, discount_pct: 10 }],
  });
  assert.equal(result.thin_count, 1);
  assert.equal(result.safe_count, 0);
  assert.equal(result.loss_count, 0);
  assert.equal(result.tiers[0].margin_pct, 9.5);
  assert.equal(result.tiers[0].status, 'thin');
  assert.equal(result.tiers[0].minimum_unit_price, 139300);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Sebagian tier di bawah target');
});

test('semua tier di atas target memberi verdict aman', () => {
  const result = analyze({
    target_margin_pct: 5,
    tiers: [
      { quantity: 3, discount_pct: 0 },
      { quantity: 6, discount_pct: 2 },
    ],
  });
  assert.equal(result.safe_count, 2);
  assert.equal(result.thin_count, 0);
  assert.equal(result.loss_count, 0);
  assert.equal(result.verdict.level, 'ok');
  assert.equal(result.verdict.label, 'Semua tier memenuhi target');
});

test('perbandingan eceran memakai biaya pesanan per pesanan satu pcs', () => {
  const result = analyze({});
  assert.equal(result.tiers[0].retail_profit_same_quantity, 59250);
  assert.equal(result.tiers[0].profit_vs_retail, 4080);
  assert.equal(result.tiers[1].retail_profit_same_quantity, 118500);
  assert.equal(result.tiers[1].profit_vs_retail, -41550);
  assert.equal(result.tiers[3].profit_vs_retail, -538890);
  assert.ok(result.recommendations.some((item) => item.indexOf('lebih untung') !== -1));
});

test('jumlah pesanan nol menghentikan proyeksi bulanan saja', () => {
  const result = analyze({ orders_per_month: 0 });
  assert.equal(result.tiers[0].profit, 63330);
  assert.equal(result.tiers[0].monthly_profit, 0);
  assert.equal(result.tiers[0].monthly_units, 0);
  assert.ok(result.recommendations.every(
    (item) => item.indexOf('per bulan') === -1 || item.indexOf('proyeksi') === -1
  ));
});

test('tier diurutkan naik walau input tidak berurutan', () => {
  const result = analyze({
    tiers: [
      { quantity: 12, discount_pct: 15 },
      { quantity: 3, discount_pct: 3 },
      { quantity: 6, discount_pct: 10 },
    ],
  });
  assert.deepEqual(result.tiers.map((tier) => tier.quantity), [3, 6, 12]);
  assert.deepEqual(
    result.input.tiers.map((tier) => tier.quantity),
    [3, 6, 12]
  );
});

test('peringatan muncul untuk diskon tidak naik dan HPP di atas harga eceran', () => {
  const flat = analyze({
    tiers: [
      { quantity: 3, discount_pct: 5 },
      { quantity: 6, discount_pct: 5 },
    ],
  });
  assert.ok(flat.warnings.some((item) => item.indexOf('tidak lebih besar') !== -1));

  const costly = analyze({
    unit_cost: 160000,
    retail_price: 150000,
    tiers: [{ quantity: 3, discount_pct: 0 }],
  });
  assert.ok(costly.warnings.some((item) => item.indexOf('HPP per pcs') !== -1));
});

test('input salah ditolak dengan pesan yang jelas', () => {
  assert.throws(
    () => tool.analyze(base({ tiers: [] })),
    /Minimal satu tier/
  );
  assert.throws(
    () => analyze({ unit_cost: 0 }),
    /HPP per pcs harus lebih dari 0/
  );
  assert.throws(
    () => analyze({ retail_price: -1 }),
    /Harga eceran harus lebih dari 0/
  );
  assert.throws(
    () => analyze({ marketplace_fee_pct: 41 }),
    /Biaya platform maksimal 40 persen/
  );
  assert.throws(
    () => analyze({ marketplace_fee_pct: 40, target_margin_pct: 70 }),
    /Jumlah biaya platform dan target margin harus di bawah 100 persen/
  );
  assert.throws(
    () => analyze({ target_margin_pct: 91 }),
    /Target margin maksimal 90 persen/
  );
  assert.throws(
    () => analyze({ orders_per_month: 1.5 }),
    /Pesanan grosir per bulan harus bilangan bulat/
  );
  assert.throws(
    () => analyze({ tiers: [{ quantity: 3.5, discount_pct: 3 }] }),
    /jumlah pcs harus bilangan bulat/
  );
  assert.throws(
    () => analyze({ tiers: [{ quantity: 3, discount_pct: 91 }] }),
    /diskon maksimal 90 persen/
  );
  assert.throws(
    () => analyze({
      tiers: [
        { quantity: 3, discount_pct: 3 },
        { quantity: 3, discount_pct: 5 },
      ],
    }),
    /muncul lebih dari satu kali/
  );
  assert.throws(
    () => analyze({ rounding_step: 0 }),
    /Pembulatan harga harus lebih dari 0/
  );
});

test('jumlah tier dibatasi delapan', () => {
  const tiers = [];
  for (let index = 1; index <= 9; index += 1) {
    tiers.push({ quantity: index, discount_pct: index });
  }
  assert.throws(() => analyze({ tiers }), /Maksimal 8 tier harga grosir/);
});

test('normalisasi memberi nilai aman dan menerima alias moq serta discount', () => {
  const input = tool.normalizeInput({
    tiers: [{ moq: 12, discount: 7 }],
  });
  assert.equal(input.marketplace_fee_pct, 8);
  assert.equal(input.target_margin_pct, 10);
  assert.equal(input.rounding_step, 100);
  assert.equal(input.fixed_fee_per_order, 0);
  assert.equal(input.orders_per_month, 0);
  assert.equal(input.product_label, '');
  assert.equal(input.tiers[0].quantity, 12);
  assert.equal(input.tiers[0].discount_pct, 7);
});

test('CSV memuat semua tier dan menetralkan formula', () => {
  const csv = tool.csvRows(base({ product_label: '=SUM(A1)' }));
  const lines = csv.split('\n');
  assert.equal(lines.length, 5);
  assert.ok(lines[0].indexOf('margin_persen') !== -1);
  assert.ok(lines[0].indexOf('profit_vs_eceran') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('145500') !== -1);
  assert.ok(csv.indexOf('Rugi per pesanan') !== -1);
});

test('semua keluaran bebas em dash dan en dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.csvRows(tool.example()),
    tool.analyze(base({ tiers: [{ quantity: 6, discount_pct: 10 }] }))
      .recommendations.join(' '),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
    assert.equal(text.indexOf('\u2013'), -1, 'en dash ditemukan');
  });
});
