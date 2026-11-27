const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lib = require('../lib/expiry.js');

const NOW = new Date(2026, 10, 27, 12, 0, 0).getTime();

function dateKey(offsetDays) {
  const base = new Date(Date.UTC(2026, 10, 27));
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

function batch(overrides) {
  return Object.assign({
    id: 'batch-test',
    sku: 'SKU-1',
    name: 'Produk Uji',
    quantity: 100,
    expiryDate: dateKey(60),
    costPerUnit: 10000,
    sellingPrice: 20000,
    dailySales: 2,
    createdAt: new Date(NOW).toISOString()
  }, overrides || {});
}

test('parseDateOnly dan daysUntil memakai tanggal kalender lokal', function () {
  assert.equal(lib.parseDateOnly('2026-11-27').key, '2026-11-27');
  assert.equal(lib.parseDateOnly('2026-02-30'), null);
  assert.equal(lib.parseDateOnly('27-11-2026'), null);
  assert.equal(lib.parseDateOnly(''), null);

  assert.equal(lib.daysUntil(dateKey(0), NOW), 0);
  assert.equal(lib.daysUntil(dateKey(1), NOW), 1);
  assert.equal(lib.daysUntil(dateKey(-1), NOW), -1);
  assert.equal(lib.daysUntil(dateKey(75), NOW), 75);
  assert.ok(Number.isNaN(lib.daysUntil('2026-13-01', NOW)));
});

test('validateBatch menolak input yang tidak lengkap', function () {
  const errors = lib.validateBatch({
    sku: '',
    name: '',
    quantity: 0,
    expiryDate: '2026-13-01',
    costPerUnit: -1,
    sellingPrice: 0,
    dailySales: -1
  });

  assert.equal(errors.length, 7);
  assert.deepEqual(lib.validateBatch(batch()), []);
});

test('createBatch menormalkan field dan memakai id yang diberikan', function () {
  const created = lib.createBatch({
    id: 'fixed-id',
    sku: '  SKU-9  ',
    name: '  Produk Uji  ',
    quantity: '50',
    expiryDate: '2026-12-31',
    costPerUnit: '18000.6',
    sellingPrice: '32000.4',
    dailySales: '2.5'
  }, { now: NOW });

  assert.equal(created.id, 'fixed-id');
  assert.equal(created.sku, 'SKU-9');
  assert.equal(created.name, 'Produk Uji');
  assert.equal(created.quantity, 50);
  assert.equal(created.expiryDate, '2026-12-31');
  assert.equal(created.costPerUnit, 18001);
  assert.equal(created.sellingPrice, 32000);
  assert.equal(created.dailySales, 2.5);
  assert.equal(created.createdAt, new Date(NOW).toISOString());
});

test('createBatch melempar ValidationError untuk data salah', function () {
  assert.throws(function () {
    lib.createBatch({ sku: '', name: '', quantity: 0 });
  }, function (error) {
    return error.name === 'ValidationError' && error.details.length > 0;
  });
});

test('evaluateBatch menghitung batch aman yang habis sebelum kedaluwarsa', function () {
  const item = lib.evaluateBatch(
    batch({ expiryDate: dateKey(60), quantity: 100, dailySales: 2 }),
    lib.DEFAULT_SETTINGS,
    NOW
  );

  assert.equal(item.status, 'safe');
  assert.equal(item.statusLabel, 'Aman');
  assert.equal(item.daysLeft, 60);
  assert.equal(item.sellingDays, 61);
  assert.equal(item.sellableUnits, 122);
  assert.equal(item.projectedSold, 100);
  assert.equal(item.projectedLeftover, 0);
  assert.equal(item.capital, 1000000);
  assert.equal(item.projectedRevenue, 2000000);
  assert.equal(item.projectedProfit, 1000000);
  assert.equal(item.loss, 0);
  assert.equal(item.unitMargin, 10000);
  assert.equal(item.maxDiscountPct, 50);
  assert.equal(item.floorPrice, 10000);
  assert.match(item.action, /habis sebelum kedaluwarsa/);
});

test('evaluateBatch memakai batas status yang tepat', function () {
  function statusAt(offset) {
    return lib.evaluateBatch(
      batch({ expiryDate: dateKey(offset) }),
      lib.DEFAULT_SETTINGS,
      NOW
    ).status;
  }

  assert.equal(statusAt(31), 'safe');
  assert.equal(statusAt(30), 'warning');
  assert.equal(statusAt(8), 'warning');
  assert.equal(statusAt(7), 'critical');
  assert.equal(statusAt(0), 'critical');
  assert.equal(statusAt(-1), 'expired');
});

test('evaluateBatch menghitung sisa stok dan potensi rugi batch kritis', function () {
  const item = lib.evaluateBatch(
    batch({
      expiryDate: dateKey(5),
      quantity: 50,
      costPerUnit: 10000,
      sellingPrice: 20000,
      dailySales: 2
    }),
    lib.DEFAULT_SETTINGS,
    NOW
  );

  assert.equal(item.status, 'critical');
  assert.equal(item.daysLeft, 5);
  assert.equal(item.sellingDays, 6);
  assert.equal(item.sellableUnits, 12);
  assert.equal(item.projectedSold, 12);
  assert.equal(item.projectedLeftover, 38);
  assert.equal(item.capital, 500000);
  assert.equal(item.projectedRevenue, 240000);
  assert.equal(item.projectedProfit, -260000);
  assert.equal(item.loss, 380000);
  assert.equal(item.stockDays, 25);
  assert.equal(item.coverageGapDays, 19);
  assert.match(item.action, /hari ini/);
  assert.match(item.action, /50,0%/);
});

test('evaluateBatch menandai batch yang sudah lewat tanggal', function () {
  const item = lib.evaluateBatch(
    batch({
      expiryDate: dateKey(-1),
      quantity: 10,
      costPerUnit: 5000,
      sellingPrice: 9000,
      dailySales: 5
    }),
    lib.DEFAULT_SETTINGS,
    NOW
  );

  assert.equal(item.status, 'expired');
  assert.equal(item.daysLeft, -1);
  assert.equal(item.sellingDays, 0);
  assert.equal(item.projectedSold, 0);
  assert.equal(item.projectedLeftover, 10);
  assert.equal(item.capital, 50000);
  assert.equal(item.loss, 50000);
  assert.equal(item.projectedProfit, -50000);
  assert.equal(item.coverageGapDays, null);
  assert.match(item.action, /Tarik dari etalase/);
});

test('batas diskon mengikuti margin kotor per unit', function () {
  const healthy = lib.evaluateBatch(
    batch({ quantity: 200, costPerUnit: 15000, sellingPrice: 25000 }),
    lib.DEFAULT_SETTINGS,
    NOW
  );
  assert.equal(healthy.unitMargin, 10000);
  assert.equal(healthy.maxDiscountPct, 40);
  assert.match(healthy.action, /40,0%/);

  const belowCost = lib.evaluateBatch(
    batch({ quantity: 200, costPerUnit: 15000, sellingPrice: 10000 }),
    lib.DEFAULT_SETTINGS,
    NOW
  );
  assert.equal(belowCost.unitMargin, -5000);
  assert.equal(belowCost.maxDiscountPct, 0);
  assert.match(belowCost.action, /belum di atas HPP/);
});

test('penjualan harian nol membuat stok tidak pernah habis', function () {
  const item = lib.evaluateBatch(
    batch({ expiryDate: dateKey(20), quantity: 30, dailySales: 0 }),
    lib.DEFAULT_SETTINGS,
    NOW
  );

  assert.equal(item.sellableUnits, 0);
  assert.equal(item.projectedSold, 0);
  assert.equal(item.projectedLeftover, 30);
  assert.equal(item.stockDays, null);
  assert.equal(item.coverageGapDays, null);
  assert.match(item.action, /Belum ada penjualan/);
});

test('evaluateBatches meringkas risiko dan mengurutkan sisa hari', function () {
  const batches = [
    batch({
      id: 'a', sku: 'SAFE-1', expiryDate: dateKey(60),
      quantity: 100, dailySales: 2
    }),
    batch({
      id: 'b', sku: 'CRIT-1', expiryDate: dateKey(5),
      quantity: 50, dailySales: 2
    }),
    batch({
      id: 'c', sku: 'EXP-1', expiryDate: dateKey(-1),
      quantity: 10, costPerUnit: 5000, sellingPrice: 9000, dailySales: 1
    }),
    batch({
      id: 'd', sku: 'WARN-1', expiryDate: dateKey(20),
      quantity: 30, costPerUnit: 4000, sellingPrice: 8000, dailySales: 1
    })
  ];

  const result = lib.evaluateBatches(batches, lib.DEFAULT_SETTINGS, NOW);

  assert.deepEqual(result.batches.map(function (item) {
    return item.sku;
  }), ['EXP-1', 'CRIT-1', 'WARN-1', 'SAFE-1']);

  assert.equal(result.summary.totalBatches, 4);
  assert.equal(result.summary.totalUnits, 190);
  assert.equal(result.summary.safe, 1);
  assert.equal(result.summary.warning, 1);
  assert.equal(result.summary.critical, 1);
  assert.equal(result.summary.expired, 1);
  assert.equal(result.summary.unitsAtRisk, 60);
  assert.equal(result.summary.unitsExpiringSoon, 90);
  assert.equal(result.summary.capitalAtRisk, 550000);
  assert.equal(result.summary.totalCapital, 1670000);
  assert.equal(result.summary.potentialLoss, 466000);
  assert.equal(result.summary.projectedProfit, 738000);
  assert.equal(result.summary.score, 50);
  assert.equal(result.summary.nextExpiry, dateKey(5));
});

test('evaluateBatches mengabaikan data rusak dan menangani daftar kosong', function () {
  const result = lib.evaluateBatches([
    batch({ sku: '' }),
    batch({ id: 'ok', sku: 'OK-1' })
  ], lib.DEFAULT_SETTINGS, NOW);

  assert.equal(result.summary.totalBatches, 1);
  assert.equal(result.summary.invalid, 1);
  assert.equal(result.batches[0].sku, 'OK-1');

  const empty = lib.evaluateBatches([], lib.DEFAULT_SETTINGS, NOW);
  assert.equal(empty.summary.totalBatches, 0);
  assert.equal(empty.summary.score, 100);
  assert.equal(empty.summary.nextExpiry, null);
});

test('parseBatchesCsv membaca header, kutip, dan nilai rupiah', function () {
  const csv = [
    'sku,nama,jumlah,kedaluwarsa,hpp,jual,terjual_harian',
    'SKU-1,Selai Kurma,40,2026-12-31,18000,32000,2',
    '"SKU,2",Madu Hutan,10,2026-12-01,"Rp 42.000","Rp 75.000",1.5'
  ].join('\n');

  const result = lib.parseBatchesCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.equal(result.batches.length, 2);
  assert.equal(result.batches[0].sku, 'SKU-1');
  assert.equal(result.batches[0].expiryDate, '2026-12-31');
  assert.equal(result.batches[1].sku, 'SKU,2');
  assert.equal(result.batches[1].costPerUnit, 42000);
  assert.equal(result.batches[1].sellingPrice, 75000);
  assert.equal(result.batches[1].dailySales, 1.5);
});

test('parseBatchesCsv melaporkan nomor baris yang salah', function () {
  const csv = [
    'sku,nama,jumlah,kedaluwarsa,hpp,jual,terjual_harian',
    'SKU-3,Produk,0,2026-13-01,1000,2000,1',
    'SKU-4,Produk,5,2026-12-01,-1,2000,1',
    'SKU-5,Produk,5,2026-12-01,1000,2000,-1'
  ].join('\n');

  const result = lib.parseBatchesCsv(csv);
  assert.equal(result.batches.length, 0);
  assert.deepEqual(result.errors.map(function (item) {
    return item.line;
  }), [2, 3, 4]);
});

test('parseBatchesCsv menangani CSV kosong dan kolom berlebih', function () {
  const empty = lib.parseBatchesCsv('   ');
  assert.equal(empty.batches.length, 0);
  assert.equal(empty.errors[0].line, 0);

  const extra = lib.parseBatchesCsv([
    'sku,nama,jumlah,kedaluwarsa,hpp,jual,terjual_harian',
    'SKU-6,Produk,5,2026-12-01,1000,2000,1,extra'
  ].join('\n'));

  assert.equal(extra.batches.length, 0);
  assert.equal(extra.errors.length, 1);
  assert.equal(extra.errors[0].line, 2);
  assert.match(extra.errors[0].message, /tepat 7 kolom/);
});

test('toCsv memakai header lengkap dan mengutip SKU yang memuat koma', function () {
  const csv = lib.toCsv([
    batch({ sku: 'SKU,"A"', expiryDate: dateKey(-1) })
  ], lib.DEFAULT_SETTINGS, NOW);

  const lines = csv.split('\n');
  assert.equal(
    lines[0],
    'sku,nama,jumlah,kedaluwarsa,sisa_hari,status,terjual_harian,' +
    'perkiraan_terjual,sisa_stok,nilai_stok,potensi_rugi,potensi_profit'
  );
  assert.ok(lines[1].startsWith('"SKU,""A"""'));
  assert.ok(lines[1].includes(',expired,'));
  assert.ok(lines[1].endsWith(',1000000,1000000,-1000000'));
});

test('buildSampleBatches mencakup keempat status dengan ringkasan tetap', function () {
  const result = lib.evaluateBatches(
    lib.buildSampleBatches(NOW),
    lib.DEFAULT_SETTINGS,
    NOW
  );

  assert.equal(result.summary.totalBatches, 4);
  assert.equal(result.summary.totalUnits, 420);
  assert.equal(result.summary.safe, 1);
  assert.equal(result.summary.warning, 1);
  assert.equal(result.summary.critical, 1);
  assert.equal(result.summary.expired, 1);
  assert.equal(result.summary.unitsAtRisk, 100);
  assert.equal(result.summary.unitsExpiringSoon, 220);
  assert.equal(result.summary.capitalAtRisk, 1620000);
  assert.equal(result.summary.totalCapital, 11660000);
  assert.equal(result.summary.potentialLoss, 3906000);
  assert.equal(result.summary.projectedProfit, 2287000);
  assert.equal(result.summary.score, 50);
  assert.equal(result.summary.nextExpiry, dateKey(3));
});

test('normalizeSettings membatasi ambang yang berbahaya', function () {
  const tight = lib.normalizeSettings({ warningDays: 0, criticalDays: 99 });
  assert.equal(tight.warningDays, 1);
  assert.equal(tight.criticalDays, 1);

  const loose = lib.normalizeSettings({ warningDays: 45, criticalDays: -3 });
  assert.equal(loose.warningDays, 45);
  assert.equal(loose.criticalDays, 0);

  const fallback = lib.normalizeSettings(null);
  assert.equal(fallback.warningDays, 30);
  assert.equal(fallback.criticalDays, 7);
});

test('format angka, rupiah, persen, dan sisa hari memakai gaya Indonesia', function () {
  assert.equal(lib.formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(lib.formatRupiah(0), 'Rp 0');
  assert.equal(lib.formatRupiah(-1000), '-Rp 1.000');
  assert.equal(lib.formatPercent(46.428), '46,4%');
  assert.equal(lib.formatPercent(50, 0), '50%');
  assert.equal(lib.formatDaysLeft(-2), 'Lewat 2 hari');
  assert.equal(lib.formatDaysLeft(0), 'Kedaluwarsa hari ini');
  assert.equal(lib.formatDaysLeft(12), '12 hari lagi');
  assert.equal(lib.formatDaysLeft(NaN), 'Tanggal tidak valid');
  assert.equal(lib.parseRupiah('Rp 185.000'), 185000);
  assert.equal(lib.parseRupiah('1.250.000'), 1250000);
  assert.equal(lib.parseRupiah('12,5'), 12.5);
  assert.ok(Number.isNaN(lib.parseRupiah('')));
});

test('file tool tidak memuat em dash atau en dash', function () {
  const root = path.join(__dirname, '..');
  const files = [
    'manifest.json',
    'background.js',
    'lib/expiry.js',
    'popup/popup.html',
    'popup/theme.js',
    'popup/popup.js',
    'README.md'
  ];

  files.forEach(function (file) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(content.includes('\u2014'), false, file + ' memuat em dash');
    assert.equal(content.includes('\u2013'), false, file + ' memuat en dash');
  });
});
