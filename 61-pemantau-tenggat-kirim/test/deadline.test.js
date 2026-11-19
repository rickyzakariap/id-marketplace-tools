const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lib = require('../lib/deadline.js');

const NOW = Date.parse('2026-11-19T12:00:00+07:00');

function order(overrides) {
  return Object.assign({
    id: 'ord-test',
    code: 'INV-1001',
    marketplace: 'Shopee',
    orderAt: '2026-11-19T08:00:00+07:00',
    slaHours: 24,
    orderValue: 150000,
    createdAt: '2026-11-19T08:00:00.000Z'
  }, overrides || {});
}

test('calculateDeadline menambah SLA ke waktu order', function () {
  const deadline = lib.calculateDeadline('2026-11-19T08:00:00+07:00', 24);
  assert.equal(deadline, '2026-11-20T01:00:00.000Z');
  assert.throws(function () {
    lib.calculateDeadline('bukan waktu', 24);
  }, TypeError);
});

test('evaluateOrder memakai batas status yang tepat', function () {
  const base = order({ orderAt: '2026-11-19T08:00:00+07:00', slaHours: 10 });

  const safe = lib.evaluateOrder(base, lib.DEFAULT_SETTINGS, '2026-11-19T10:00:00+07:00');
  assert.equal(safe.status, 'safe');
  assert.equal(safe.remainingMs, 8 * 60 * 60 * 1000);
  assert.equal(safe.packingOverdue, false);

  const warning = lib.evaluateOrder(base, lib.DEFAULT_SETTINGS, '2026-11-19T14:00:00+07:00');
  assert.equal(warning.status, 'warning');
  assert.equal(warning.remainingMs, 4 * 60 * 60 * 1000);

  const critical = lib.evaluateOrder(base, lib.DEFAULT_SETTINGS, '2026-11-19T17:00:00+07:00');
  assert.equal(critical.status, 'critical');
  assert.equal(critical.packingOverdue, true);

  const late = lib.evaluateOrder(base, lib.DEFAULT_SETTINGS, '2026-11-19T18:30:00+07:00');
  assert.equal(late.status, 'late');
  assert.equal(late.lateByMs, 30 * 60 * 1000);
  assert.equal(late.estimatedPenalty, lib.DEFAULT_SETTINGS.penaltyPerLate);
});

test('evaluateOrders mengurutkan sisa waktu dan meringkas risiko', function () {
  const orders = [
    order({ id: 'a', code: 'SAFE-1', orderAt: '2026-11-19T08:00:00+07:00', orderValue: 100000 }),
    order({ id: 'b', code: 'CRIT-1', orderAt: '2026-11-18T12:30:00+07:00', orderValue: 200000 }),
    order({ id: 'c', code: 'LATE-1', orderAt: '2026-11-18T11:00:00+07:00', orderValue: 300000 })
  ];

  const result = lib.evaluateOrders(orders, lib.DEFAULT_SETTINGS, NOW);

  assert.deepEqual(result.orders.map(function (item) { return item.code; }), [
    'LATE-1', 'CRIT-1', 'SAFE-1'
  ]);
  assert.equal(result.summary.total, 3);
  assert.equal(result.summary.safe, 1);
  assert.equal(result.summary.critical, 1);
  assert.equal(result.summary.late, 1);
  assert.equal(result.summary.mustPackNow, 1);
  assert.equal(result.summary.latePenalty, lib.DEFAULT_SETTINGS.penaltyPerLate);
  assert.equal(result.summary.valueAtRisk, 500000);
  assert.equal(result.summary.score, 45);
  assert.equal(result.summary.nextDeadline, '2026-11-19T05:30:00.000Z');
});

test('evaluateOrders mengabaikan data rusak dan tetap menghitung', function () {
  const result = lib.evaluateOrders([
    order({ code: '' }),
    order({ code: 'OK-1' })
  ], lib.DEFAULT_SETTINGS, NOW);

  assert.equal(result.summary.total, 1);
  assert.equal(result.summary.invalid, 1);
  assert.equal(result.orders[0].code, 'OK-1');
});

test('skor kosong bernilai 100 dan daftar kosong aman', function () {
  const result = lib.evaluateOrders([], lib.DEFAULT_SETTINGS, NOW);
  assert.equal(result.summary.total, 0);
  assert.equal(result.summary.score, 100);
  assert.equal(result.summary.nextDeadline, null);
});

test('validateOrder menolak input yang tidak lengkap', function () {
  const errors = lib.validateOrder({
    code: '',
    marketplace: 'Marketplace Asing',
    orderAt: 'bukan waktu',
    slaHours: 0,
    orderValue: -1
  });
  assert.equal(errors.length, 5);

  assert.deepEqual(lib.validateOrder(order()), []);
});

test('createOrder menormalkan field dan memakai id yang diberikan', function () {
  const created = lib.createOrder({
    id: 'fixed-id',
    code: '  INV-9  ',
    marketplace: 'Shopee',
    orderAt: '2026-11-19T08:00:00+07:00',
    slaHours: '24',
    orderValue: '185000.7'
  }, { now: NOW });

  assert.equal(created.id, 'fixed-id');
  assert.equal(created.code, 'INV-9');
  assert.equal(created.orderAt, '2026-11-19T01:00:00.000Z');
  assert.equal(created.slaHours, 24);
  assert.equal(created.orderValue, 185001);
  assert.equal(created.createdAt, '2026-11-19T05:00:00.000Z');
});

test('createOrder melempar ValidationError untuk data salah', function () {
  assert.throws(function () {
    lib.createOrder({ code: '', marketplace: 'Shopee' });
  }, function (error) {
    return error.name === 'ValidationError' && error.details.length > 0;
  });
});

test('parseOrdersCsv membaca header, kutip, dan nilai rupiah', function () {
  const csv = [
    'kode,marketplace,waktu_order,sla_jam,nilai',
    'INV-1,shopee,2026-11-19T08:00:00+07:00,24,185000',
    '"INV,2",TikTok,2026-11-19T09:00:00+07:00,12,"Rp 250.000"'
  ].join('\n');

  const result = lib.parseOrdersCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.equal(result.orders.length, 2);
  assert.equal(result.orders[0].code, 'INV-1');
  assert.equal(result.orders[0].marketplace, 'Shopee');
  assert.equal(result.orders[1].code, 'INV,2');
  assert.equal(result.orders[1].marketplace, 'TikTok Shop');
  assert.equal(result.orders[1].orderValue, 250000);
});

test('parseOrdersCsv melaporkan nomor baris yang salah', function () {
  const csv = [
    'kode,marketplace,waktu_order,sla_jam,nilai',
    'INV-3,Marketplace Asing,2026-11-19T08:00,24,1000',
    'INV-4,Shopee,bukan-waktu,24,1000',
    'INV-5,Shopee,2026-11-19T08:00,0,1000'
  ].join('\n');

  const result = lib.parseOrdersCsv(csv);
  assert.equal(result.orders.length, 0);
  assert.deepEqual(result.errors.map(function (item) { return item.line; }), [2, 3, 4]);
});

test('parseOrdersCsv menangani CSV kosong', function () {
  const result = lib.parseOrdersCsv('   ');
  assert.equal(result.orders.length, 0);
  assert.equal(result.errors[0].line, 0);
});

test('parseOrdersCsv melewati baris kosong dan menolak kolom berlebih', function () {
  const csv = [
    '',
    '',
    'kode,marketplace,waktu_order,sla_jam,nilai',
    'INV-6,Shopee,2026-11-19T08:00,24,1000,extra'
  ].join('\n');

  const result = lib.parseOrdersCsv(csv);
  assert.equal(result.orders.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 4);
  assert.match(result.errors[0].message, /tepat 5 kolom/);
});

test('formatRemaining menghasilkan teks Indonesia', function () {
  assert.equal(lib.formatRemaining(2 * 3600000 + 15 * 60000), '2 jam 15 menit lagi');
  assert.equal(lib.formatRemaining(-(3600000 + 5 * 60000)), 'Terlambat 1 jam 5 menit');
  assert.equal(lib.formatRemaining(30000), 'kurang dari 1 menit lagi');
  assert.equal(lib.formatRemaining(0), 'Terlambat kurang dari 1 menit');
  assert.equal(lib.formatRemaining(26 * 3600000), '1 hari 2 jam lagi');
  assert.equal(lib.formatRemaining(NaN), 'Waktu tidak valid');
});

test('formatRupiah dan parseRupiah konsisten untuk angka Indonesia', function () {
  assert.equal(lib.formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(lib.formatRupiah(0), 'Rp 0');
  assert.equal(lib.parseRupiah('Rp 185.000'), 185000);
  assert.equal(lib.parseRupiah('1.250.000'), 1250000);
  assert.equal(lib.parseRupiah('12,5'), 12.5);
  assert.ok(Number.isNaN(lib.parseRupiah('')));
});

test('toCsv mengutip kode yang memuat koma dan tanda kutip', function () {
  const csv = lib.toCsv([
    order({ code: 'INV,"A"' })
  ], lib.DEFAULT_SETTINGS, NOW);

  const lines = csv.split('\n');
  assert.equal(
    lines[0],
    'kode,marketplace,waktu_order,tenggat,status,sisa_menit,nilai_pesanan,estimasi_denda'
  );
  assert.ok(lines[1].startsWith('"INV,""A"""'));
  assert.ok(lines[1].includes(',safe,'));
});

test('buildSampleOrders mencakup keempat status', function () {
  const result = lib.evaluateOrders(lib.buildSampleOrders(NOW), lib.DEFAULT_SETTINGS, NOW);
  assert.equal(result.summary.total, 4);
  assert.equal(result.summary.safe, 1);
  assert.equal(result.summary.warning, 1);
  assert.equal(result.summary.critical, 1);
  assert.equal(result.summary.late, 1);
});

test('normalizeSettings membatasi nilai yang berbahaya', function () {
  const settings = lib.normalizeSettings({
    warningMinutes: 60,
    criticalMinutes: 120,
    packingBufferMinutes: -10,
    penaltyPerLate: -5,
    defaultSlaHours: 999
  });

  assert.equal(settings.warningMinutes, 60);
  assert.equal(settings.criticalMinutes, 60);
  assert.equal(settings.packingBufferMinutes, 0);
  assert.equal(settings.penaltyPerLate, 0);
  assert.equal(settings.defaultSlaHours, 240);

  const tight = lib.normalizeSettings({ warningMinutes: 30, criticalMinutes: 5 });
  assert.equal(tight.criticalMinutes, 15);
});

test('file tool tidak memuat em dash atau en dash', function () {
  const root = path.join(__dirname, '..');
  const files = [
    'manifest.json',
    'background.js',
    'lib/deadline.js',
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
