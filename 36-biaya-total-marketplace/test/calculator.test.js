// Unit tests for the all-in seller cost calculator. Run: node test/calculator.test.js
const assert = require('assert');
const { calculate, getMarketplace } = require('../lib/calculator');

let pass = 0;
let fail = 0;
function t(name, fn) {
  try {
    fn();
    pass += 1;
    console.log('PASS ' + name);
  } catch (e) {
    fail += 1;
    console.log('FAIL ' + name + ': ' + e.message);
  }
}

function near(actual, expected, tolerance = 0.5) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    'got ' + actual + ', want ' + expected
  );
}

t('menghitung total biaya berlapis', function () {
  const r = calculate({
    hpp: 50000,
    harga_jual: 100000,
    qty: 1,
    komisi_admin_pct: 10,
    gratis_ongkir_pct: 8,
    iklan_pct: 5,
    affiliate_pct: 10,
    biaya_proses_rp: 1250,
    layanan_logistik_rp: 3000,
    kemasan_rp: 1000,
    retur_pct: 2,
    retur_fee_rp: 10000,
    target_margin_pct: 20,
  });
  assert.strictEqual(r.total_cost, 38450);
  assert.strictEqual(r.profit, 11550);
  near(r.margin_pct, 11.6, 0.05);
  near(r.total_cost_pct, 38.5, 0.05);
  assert.strictEqual(r.verdict, 'tipis');
  assert.strictEqual(r.warning_30, true);
});

t('breakdown hanya memuat komponen > 0', function () {
  const r = calculate({ hpp: 10000, harga_jual: 20000, qty: 1, komisi_admin_pct: 5 });
  const ids = r.breakdown.map((b) => b.id);
  assert.deepStrictEqual(ids, ['komisi', 'proses']);
});

t('biaya proses pesanan tidak dikali qty (per transaksi)', function () {
  const single = calculate({ hpp: 50000, harga_jual: 100000, qty: 1, komisi_admin_pct: 10, biaya_proses_rp: 1250 });
  const triple = calculate({ hpp: 50000, harga_jual: 100000, qty: 3, komisi_admin_pct: 10, biaya_proses_rp: 1250 });
  assert.strictEqual(single.revenue, 100000);
  assert.strictEqual(triple.revenue, 300000);
  assert.strictEqual(triple.total_cost, 30000 + 1250);
  assert.strictEqual(triple.hpp_total, 150000);
  assert.strictEqual(triple.profit, 300000 - 31250 - 150000);
});

t('biaya logistik dan kemasan dikali qty', function () {
  const r = calculate({
    hpp: 10000,
    harga_jual: 50000,
    qty: 2,
    komisi_admin_pct: 0,
    layanan_logistik_rp: 3000,
    kemasan_rp: 1000,
    biaya_proses_rp: 0,
  });
  assert.strictEqual(r.total_cost, 2 * 3000 + 2 * 1000);
});

t('estimasi biaya retur = retur% x fee x qty', function () {
  const r = calculate({
    hpp: 10000,
    harga_jual: 100000,
    qty: 2,
    komisi_admin_pct: 0,
    biaya_proses_rp: 0,
    retur_pct: 10,
    retur_fee_rp: 10000,
  });
  assert.strictEqual(r.total_cost, 2 * 0.1 * 10000);
});

t('verdict rugi saat biaya melebihi harga', function () {
  const r = calculate({ hpp: 90000, harga_jual: 100000, qty: 1, komisi_admin_pct: 20, biaya_proses_rp: 1250 });
  assert.strictEqual(r.verdict, 'rugi');
  assert.ok(r.profit < 0);
});

t('verdict sehat saat margin di atas target', function () {
  const r = calculate({ hpp: 20000, harga_jual: 100000, qty: 1, komisi_admin_pct: 5, biaya_proses_rp: 1250, target_margin_pct: 20 });
  assert.strictEqual(r.verdict, 'sehat');
  assert.ok(r.margin_pct >= 20);
});

t('target price menghasilkan margin target', function () {
  const input = {
    hpp: 50000,
    harga_jual: 100000,
    qty: 1,
    komisi_admin_pct: 10,
    gratis_ongkir_pct: 8,
    iklan_pct: 5,
    affiliate_pct: 10,
    biaya_proses_rp: 1250,
    layanan_logistik_rp: 3000,
    kemasan_rp: 1000,
    retur_pct: 2,
    retur_fee_rp: 10000,
    target_margin_pct: 20,
  };
  const base = calculate(input);
  const atTarget = calculate(Object.assign({}, input, { harga_jual: base.target_price }));
  near(atTarget.margin_pct, 20, 0.2);
});

t('target price null saat komponen persen + target >= 100%', function () {
  const r = calculate({ hpp: 50000, harga_jual: 100000, qty: 1, komisi_admin_pct: 80, gratis_ongkir_pct: 10, target_margin_pct: 20 });
  assert.strictEqual(r.target_price, null);
});

t('komisi default mengikuti marketplace', function () {
  const shopee = calculate({ hpp: 10000, harga_jual: 20000, qty: 1, marketplace: 'shopee', biaya_proses_rp: 0 });
  const tiktok = calculate({ hpp: 10000, harga_jual: 20000, qty: 1, marketplace: 'tiktok', biaya_proses_rp: 0 });
  assert.strictEqual(shopee.inputs.komisi_admin_pct, 10);
  assert.strictEqual(tiktok.inputs.komisi_admin_pct, 8);
});

t('marketplace tidak dikenal jatuh ke default pertama', function () {
  assert.strictEqual(getMarketplace('tidak-ada').id, 'shopee');
});

t('validasi HPP dan harga jual wajib > 0', function () {
  assert.ok(calculate({ hpp: 0, harga_jual: 10000 }).error);
  assert.ok(calculate({ hpp: 10000, harga_jual: 0 }).error);
});

t('kasus kuitansi ~24% dari harga transaksi', function () {
  const r = calculate({
    marketplace: 'shopee',
    hpp: 250000,
    harga_jual: 499000,
    qty: 1,
    komisi_admin_pct: 9,
    gratis_ongkir_pct: 10,
    affiliate_pct: 4.66,
    biaya_proses_rp: 1250,
    layanan_logistik_rp: 350,
    target_margin_pct: 20,
  });
  near(r.total_cost, 119663, 200);
  near(r.total_cost_pct, 24, 0.1);
  assert.strictEqual(r.warning_30, false);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
