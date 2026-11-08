'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const appeal = require('../lib/appeal');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('ok - ' + name);
  } catch (error) {
    failed += 1;
    console.error('not ok - ' + name);
    console.error(error && error.stack ? error.stack : error);
  }
}

const TODAY = '2026-11-08';
const base = {
  store_name: 'Toko Uji',
  seller_name: 'Penjual Uji',
  contact: '0812-1111-2222',
  platform: 'tiktok',
  order_type: 'mall',
  order_ref: 'UJI-001',
  product_name: 'Produk uji',
  delivered_date: '2026-10-27',
  case_type: 'refund_only',
  trigger_date: '2026-11-04',
  appeal_reason: 'wrong_product',
  buyer_reason_matches: 'ya',
  dispute_condition: 'ya',
  functional_issue: 'tidak',
  already_appealed: 'tidak',
  cs_return_request: 'belum_diminta',
  info_requested_at: '',
  evidence: [],
  chronology: 'Kronologi uji.',
  ticket: '',
  note: '',
  status: 'baru',
};

function withInput(overrides) {
  return Object.assign({}, base, overrides);
}

function analyze(overrides, options) {
  return appeal.analyze(withInput(overrides), Object.assign({ today: TODAY }, options || {}));
}

test('meta memuat pilihan, aturan, bukti, status, dan sumber', () => {
  const data = appeal.meta();
  assert.strictEqual(data.platforms.length, 3);
  assert.strictEqual(data.order_types.length, 2);
  assert.strictEqual(data.case_types.length, 6);
  assert.strictEqual(data.appeal_reasons.length, 8);
  assert.strictEqual(data.evidence.length, 16);
  assert.strictEqual(data.evidence.filter((item) => item.critical).length, 9);
  assert.strictEqual(data.case_statuses.length, 7);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.rules.appeal_days, 7);
  assert.strictEqual(data.rules.info_hours, 24);
  assert.strictEqual(data.rules.mall_return_days, 15);
  assert.ok(data.sources.length >= 4);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
  });
});

test('meta dan contoh tidak memakai em dash', () => {
  const text = JSON.stringify(appeal.meta()) + JSON.stringify(appeal.example());
  assert.ok(text.indexOf('\u2014') === -1, 'em dash ditemukan');
});

test('halaman statis tidak memakai em dash', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert.ok(html.indexOf('\u2014') === -1, 'em dash ditemukan di index.html');
});

test('halaman statis memuat semua id yang dipakai script', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const ids = new Set();
  const idPattern = /id="([^"]+)"/g;
  let match;
  while ((match = idPattern.exec(html))) ids.add(match[1]);
  const used = new Set();
  const callPattern = /\$\('([^']+)'\)/g;
  while ((match = callPattern.exec(html))) used.add(match[1]);
  const getPattern = /getElementById\('([^']+)'\)/g;
  while ((match = getPattern.exec(html))) used.add(match[1]);
  const missing = Array.from(used).filter((id) => !ids.has(id));
  assert.deepStrictEqual(missing, []);
});

test('deadline 7 hari dari tanggal mulai', () => {
  const result = analyze();
  assert.strictEqual(result.deadline.start_date, '2026-11-04');
  assert.strictEqual(result.deadline.deadline_date, '2026-11-11');
  assert.strictEqual(result.deadline.days_left, 3);
  assert.strictEqual(result.deadline.status, 'segera');
  assert.strictEqual(result.deadline.safe_date, '2026-11-10');
  assert.strictEqual(result.deadline.recommended_date, '2026-11-06');
});

test('deadline hari ini dan lewat', () => {
  const today = analyze({ trigger_date: '2026-11-01' });
  assert.strictEqual(today.deadline.deadline_date, '2026-11-08');
  assert.strictEqual(today.deadline.status, 'hari_ini');
  const past = analyze({ trigger_date: '2026-10-31' });
  assert.strictEqual(past.deadline.status, 'lewat');
  assert.ok(past.deadline.days_left < 0);
});

test('tanggal mulai tidak valid ditolak', () => {
  assert.throws(() => analyze({ trigger_date: '2026-02-30' }), /wajib diisi/);
  assert.throws(() => analyze({ trigger_date: '' }), /wajib diisi/);
});

test('jendela retur Mall 15 hari sejak 2 November 2026', () => {
  const result = analyze({ delivered_date: '2026-11-02' });
  assert.strictEqual(result.buyer_window.days, 15);
  assert.strictEqual(result.buyer_window.last_date, '2026-11-17');
  assert.strictEqual(result.buyer_window.days_left, 9);
  assert.strictEqual(result.buyer_window.status, 'terbuka');
});

test('pesanan Mall sebelum 2 November 2026 memakai 6 hari', () => {
  const result = analyze({ delivered_date: '2026-10-20' });
  assert.strictEqual(result.buyer_window.days, 6);
  assert.ok(result.buyer_window.note.indexOf('sebelum 2 November 2026') !== -1);
});

test('pesanan Non-Mall memakai 6 hari', () => {
  const result = analyze({ order_type: 'non_mall', delivered_date: '2026-11-01' });
  assert.strictEqual(result.buyer_window.days, 6);
  assert.strictEqual(result.buyer_window.last_date, '2026-11-07');
  assert.strictEqual(result.buyer_window.status, 'tutup');
});

test('alasan barang berbeda mewajibkan unboxing dan packing bila alasan sama', () => {
  const result = analyze();
  assert.strictEqual(result.requirements.unboxing, 'wajib');
  assert.strictEqual(result.requirements.packing, 'wajib');
});

test('packing opsional bila alasan banding tidak sama dengan alasan pembeli', () => {
  const result = analyze({ buyer_reason_matches: 'tidak' });
  assert.strictEqual(result.requirements.packing, 'opsional');
});

test('alasan keaslian tidak mewajibkan video', () => {
  const result = analyze({ appeal_reason: 'sent_authentic', buyer_reason_matches: 'tidak' });
  assert.strictEqual(result.requirements.packing, 'tidak_perlu');
});

test('alasan pembeli salah hanya mewajibkan unboxing bila membantah kondisi', () => {
  const without = analyze({ appeal_reason: 'buyer_wrong_reason', dispute_condition: 'tidak', buyer_reason_matches: 'tidak' });
  assert.strictEqual(without.requirements.unboxing, 'opsional');
  const withDispute = analyze({ appeal_reason: 'buyer_wrong_reason', dispute_condition: 'ya', buyer_reason_matches: 'tidak' });
  assert.strictEqual(withDispute.requirements.unboxing, 'wajib');
});

test('barang retur tidak diterima tidak butuh video unboxing', () => {
  const result = analyze({ appeal_reason: 'not_received', case_type: 'not_received_speedy' });
  assert.strictEqual(result.requirements.unboxing, 'tidak_perlu');
  assert.strictEqual(result.requirements.packing, 'tidak_perlu');
  const tracking = result.evidence.items.find((item) => item.id === 'return_tracking');
  assert.strictEqual(tracking.requirement, 'required');
});

test('bukti wajib lengkap memberi label siap', () => {
  const required = appeal.EVIDENCE.map((item) => item.id);
  const result = analyze({ evidence: required });
  assert.strictEqual(result.evidence.missing_required.length, 0);
  assert.strictEqual(result.evidence.label, 'Siap');
  assert.ok(result.evidence.score >= 90);
});

test('bukti kritis yang kurang masuk daftar missing_critical', () => {
  const result = analyze({ evidence: ['order_detail', 'buyer_request', 'refund_proof', 'chronology'] });
  const ids = result.evidence.missing_critical.map((item) => item.id);
  assert.ok(ids.includes('unboxing_6_sides'));
  assert.ok(ids.includes('packing_video'));
  assert.ok(result.evidence.score < 60);
  assert.strictEqual(result.verdict.level, 'ember');
});

test('instruksi CS yang belum dijalankan menggugurkan banding', () => {
  const result = analyze({ cs_return_request: 'ya_belum' });
  assert.strictEqual(result.verdict.level, 'ember');
  assert.ok(result.verdict.label.indexOf('belum memenuhi syarat') !== -1);
  assert.ok(result.signals.some((item) => item.label.indexOf('belum dikirim') !== -1));
});

test('banding yang sudah diajukan diberi sinyal satu kali banding', () => {
  const result = analyze({ already_appealed: 'ya' });
  assert.strictEqual(result.verdict.level, 'signal');
  assert.ok(result.verdict.detail.indexOf('hanya satu') !== -1);
  assert.ok(result.recommendations.some((item) => item.indexOf('banding kedua') !== -1));
});

test('batas info tambahan 24 jam', () => {
  const open = analyze(
    { info_requested_at: '2026-11-08T10:00' },
    { now: new Date('2026-11-08T20:00:00') }
  );
  assert.ok(open.info_window);
  assert.strictEqual(open.info_window.expired, false);
  assert.strictEqual(open.info_window.hours_left, 14);
  const expired = analyze(
    { info_requested_at: '2026-11-08T10:00' },
    { now: new Date('2026-11-10T10:00:00') }
  );
  assert.strictEqual(expired.info_window.expired, true);
  assert.strictEqual(expired.verdict.level, 'ember');
});

test('platform lain diberi verdict aturan khusus belum tersedia', () => {
  const result = analyze({ platform: 'lain' });
  assert.strictEqual(result.verdict.level, 'signal');
  assert.ok(result.verdict.label.indexOf('Aturan khusus') !== -1);
});

test('surat banding memuat pesanan, alasan, dan bukti', () => {
  const result = appeal.letter(withInput({ evidence: ['order_detail', 'chronology'] }), { today: TODAY });
  assert.strictEqual(result.type, 'banding');
  assert.ok(result.subject.indexOf('UJI-001') !== -1);
  assert.ok(result.body.indexOf('Barang yang kembali bukan barang yang dikirim') !== -1);
  assert.ok(result.body.indexOf('Detail pesanan') !== -1);
  assert.ok(result.body.indexOf('\u2014') === -1);
});

test('surat klarifikasi memuat batas info tambahan', () => {
  const result = appeal.letter(
    withInput({ letter_type: 'klarifikasi', info_requested_at: '2026-11-08T10:00' }),
    { today: TODAY, now: new Date('2026-11-08T12:00:00') }
  );
  assert.strictEqual(result.type, 'klarifikasi');
  assert.ok(result.body.indexOf('Batas jawaban') !== -1);
  assert.ok(result.subject.indexOf('informasi tambahan') !== -1);
});

test('surat eskalasi memuat status bukti', () => {
  const result = appeal.letter(withInput({ letter_type: 'eskalasi' }), { today: TODAY });
  assert.strictEqual(result.type, 'eskalasi');
  assert.ok(result.body.indexOf('Status bukti') !== -1);
});

test('ringkasan kasus menghitung terbuka, jatuh tempo, dan lewat', () => {
  const cases = [
    Object.assign({}, withInput({}), { id: 'r1', status: 'baru' }),
    Object.assign({}, withInput({ trigger_date: '2026-11-05' }), { id: 'r2', status: 'bukti' }),
    Object.assign({}, withInput({ trigger_date: '2026-10-31' }), { id: 'r3', status: 'banding' }),
    Object.assign({}, withInput({ trigger_date: '2026-11-07' }), { id: 'r4', status: 'diterima' }),
  ];
  const summary = appeal.summarizeCases(cases, TODAY);
  assert.strictEqual(summary.total, 4);
  assert.strictEqual(summary.open_cases, 3);
  assert.strictEqual(summary.expired, 1);
  assert.ok(summary.due_soon >= 1);
});

test('CSV memuat header dan satu baris per kasus', () => {
  const cases = [Object.assign({}, withInput({}), { id: 'r1' })];
  const csv = appeal.csvRows(cases, TODAY);
  const lines = csv.split('\n');
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[0].indexOf('batas_banding') !== -1);
  assert.ok(lines[1].indexOf('UJI-001') !== -1);
});

test('contoh bisa dianalisis dan menghasilkan tenggat 11 November 2026', () => {
  const result = appeal.analyze(appeal.example(), { today: TODAY, now: new Date('2026-11-08T10:00:00') });
  assert.strictEqual(result.deadline.deadline_date, '2026-11-11');
  assert.strictEqual(result.deadline.days_left, 3);
  assert.strictEqual(result.deadline.safe_date, '2026-11-10');
  assert.strictEqual(result.deadline.recommended_date, '2026-11-06');
  assert.strictEqual(result.buyer_window.last_date, '2026-11-17');
  assert.ok(result.evidence.score > 0);
});

test('normalisasi membuang bukti tidak dikenal dan membatasi teks', () => {
  const input = appeal.normalizeInput(
    {
      evidence: ['order_detail', 'order_detail', 'tidak_ada'],
      store_name: '  Toko  ',
      platform: 'tidak_ada',
      order_type: 'tidak_ada',
    },
    TODAY
  );
  assert.deepStrictEqual(input.evidence, ['order_detail']);
  assert.strictEqual(input.store_name, 'Toko');
  assert.strictEqual(input.platform, 'tiktok');
  assert.strictEqual(input.order_type, 'non_mall');
});

test('format tanggal memakai nama bulan Indonesia', () => {
  assert.strictEqual(appeal.formatDate(appeal.parseDateOnly('2026-11-11')), '11 November 2026');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
