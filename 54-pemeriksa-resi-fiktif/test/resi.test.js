'use strict';

const assert = require('assert');
const tool = require('../lib/resi');

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

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

function signal(result, id) {
  return result.indication.signals.find((item) => item.id === id);
}

test('meta memuat pilihan, bukti, ambang, dan sumber', () => {
  const data = tool.meta();
  assert.strictEqual(data.marketplaces.length, 6);
  assert.strictEqual(data.couriers.length, 9);
  assert.strictEqual(data.scan_statuses.length, 9);
  assert.strictEqual(data.yes_no.length, 3);
  assert.strictEqual(data.case_statuses.length, 9);
  assert.strictEqual(data.case_statuses.filter((item) => item.open).length, 6);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.evidence.length, 12);
  assert.strictEqual(data.evidence.filter((item) => item.critical).length, 5);
  assert.strictEqual(data.thresholds.ats_minutes, 5);
  assert.strictEqual(data.thresholds.return_minutes, 60);
  assert.strictEqual(data.thresholds.hub_hours, 72);
  assert.ok(data.thresholds.note.indexOf('bukan aturan resmi') !== -1);
  assert.ok(data.rules.disclaimer.indexOf('bukan putusan hukum') !== -1);
  assert.ok(data.sources.length >= 1);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    assert.ok(item.facts.length > 20);
  });
});

test('sumber utama memuat kasus 10 November 2026', () => {
  assert.strictEqual(tool.SOURCES[0].publisher, 'Media Konsumen');
  assert.strictEqual(tool.SOURCES[0].date, '2026-11-10');
  assert.ok(tool.SOURCES[0].facts.indexOf('006920823346') !== -1);
  assert.ok(tool.SOURCES[0].facts.indexOf('satu menit') !== -1);
  assert.ok(tool.SOURCES[0].facts.indexOf('34 menit') !== -1);
});

test('contoh menghasilkan indikasi kuat dan verdict risiko tinggi', () => {
  const result = analyze({});
  assert.strictEqual(result.marketplace_label, 'TikTok Shop');
  assert.strictEqual(result.courier_label, 'SiCepat');
  assert.strictEqual(result.indication.score, 100);
  assert.strictEqual(result.indication.label, 'Indikasi kuat');
  assert.ok(result.indication.triggered_count >= 7);
  assert.strictEqual(result.verdict.level, 'ember');
  assert.strictEqual(result.verdict.label, 'Indikasi kuat, bukti kritis belum lengkap');
  assert.deepStrictEqual(
    result.evidence.missing_critical.map((item) => item.id),
    ['courier_ticket']
  );
});

test('kerugian kas dan dampak total dipisahkan dari nilai pesanan', () => {
  const loss = analyze({}).loss;
  assert.strictEqual(loss.base_cost, 955000);
  assert.strictEqual(loss.cash_loss, 205000);
  assert.strictEqual(loss.normal_profit, 320000);
  assert.strictEqual(loss.total_impact, 525000);
  assert.strictEqual(loss.normal_sales_to_cover, 2);
  assert.ok(loss.note.indexOf('terpisah') !== -1);
});

test('ATS satu menit setelah dibawa kurir terdeteksi', () => {
  const result = analyze({});
  const item = signal(result, 'ats_fast');
  assert.strictEqual(item.triggered, true);
  assert.ok(item.note.indexOf('1 menit') !== -1);
});

test('retur pusat 34 menit setelah ATS terdeteksi', () => {
  const result = analyze({});
  const item = signal(result, 'return_fast');
  assert.strictEqual(item.triggered, true);
  assert.ok(item.note.indexOf('34 menit') !== -1);
});

test('paket menginap 97,9 jam di hub terdeteksi', () => {
  const result = analyze({});
  const item = signal(result, 'hub_long');
  assert.strictEqual(item.triggered, true);
  assert.ok(item.note.indexOf('97.9 jam') !== -1);
});

test('ATS berulang terdeteksi', () => {
  const result = analyze({});
  const item = signal(result, 'repeat_ats');
  assert.strictEqual(item.triggered, true);
  assert.ok(item.note.indexOf('2') !== -1);
});

test('alamat lengkap, nomor aktif, dan tanpa kontak memperkuat indikasi', () => {
  const result = analyze({});
  assert.strictEqual(signal(result, 'address_complete_ats').triggered, true);
  assert.strictEqual(signal(result, 'phone_active_ats').triggered, true);
  assert.strictEqual(signal(result, 'no_contact_attempt').triggered, true);
});

test('retur tanpa permintaan pembeli terdeteksi', () => {
  const result = analyze({});
  assert.strictEqual(signal(result, 'return_without_request').triggered, true);
});

test('riwayat normal tanpa ATS tidak memberi indikasi', () => {
  const result = analyze({
    timeline: [{ status: 'delivered', at: '2026-11-06T10:00', note: 'Diterima pembeli' }],
  });
  assert.strictEqual(result.indication.score, 0);
  assert.strictEqual(result.indication.triggered_count, 0);
  assert.strictEqual(result.verdict.level, 'ok');
  assert.strictEqual(result.verdict.label, 'Tidak ada pola ATS fiktif');
});

test('satu scan ATS saja tetap memberi indikasi, bukan verdict aman', () => {
  const result = analyze({
    timeline: [{ status: 'ats', at: '2026-11-06T13:06', note: 'ATS tanpa riwayat lain' }],
  });
  assert.ok(result.indication.score > 0);
  assert.notStrictEqual(result.verdict.level, 'ok');
  assert.strictEqual(signal(result, 'ats_without_ofd').triggered, true);
});

test('satu penanda sedang memberi indikasi rendah, bukan verdict aman', () => {
  const result = analyze({
    timeline: [
      { status: 'hub', at: '2026-11-01T08:00', note: 'Tiba di hub' },
      { status: 'ofd', at: '2026-11-04T16:00', note: 'Dibawa kurir' },
    ],
  });
  assert.strictEqual(result.indication.score, 10);
  assert.strictEqual(result.indication.label, 'Indikasi rendah');
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.verdict.label, 'Indikasi rendah, cek manual');
});

test('semua bukti menghasilkan skor 100 dan verdict siap klaim', () => {
  const result = analyze({
    evidence: tool.EVIDENCE.map((item) => item.id),
  });
  assert.strictEqual(result.evidence.score, 100);
  assert.strictEqual(result.evidence.label, 'Siap');
  assert.strictEqual(result.evidence.missing_critical.length, 0);
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.verdict.label, 'Indikasi kuat, ajukan klaim');
});

test('kesiapan bukti bisa dihitung tanpa analisis penuh', () => {
  const result = tool.readiness({
    evidence: ['tracking_screenshot', 'order_detail'],
  });
  assert.strictEqual(result.checked_count, 2);
  assert.strictEqual(result.critical_count, 5);
  assert.strictEqual(result.missing_critical.length, 3);
  assert.ok(result.score > 0 && result.score < 50);
});

test('surat ekspedisi memuat resi, kronologi, penanda, dan kerugian', () => {
  const result = tool.letter(base({ letter_type: 'ekspedisi' }));
  assert.strictEqual(result.type, 'ekspedisi');
  assert.ok(result.subject.indexOf('006920823346') !== -1);
  assert.ok(result.body.indexOf('Riwayat resi') !== -1);
  assert.ok(result.body.indexOf('Penanda waktu') !== -1);
  assert.ok(result.body.indexOf('Kerugian kas: Rp 205.000') !== -1);
  assert.ok(result.body.indexOf('Dampak total: Rp 525.000') !== -1);
});

test('surat marketplace dan surat bukti memakai kanal yang tepat', () => {
  const marketplace = tool.letter(base({ letter_type: 'marketplace' }));
  assert.ok(marketplace.heading.indexOf('TikTok Shop') !== -1);
  assert.ok(marketplace.body.indexOf('pembebanan ongkir retur') !== -1);

  const bukti = tool.letter(base({ letter_type: 'bukti' }));
  assert.ok(bukti.heading.indexOf('SiCepat') !== -1);
  assert.ok(bukti.body.indexOf('Log panggilan') !== -1);
});

test('CSV memuat kolom kerugian dan menetralkan formula', () => {
  const csv = tool.csvRows([
    Object.assign(base({}), { id: 'r1', store_name: '=SUM(A1)' }),
  ]);
  assert.ok(csv.indexOf('kerugian_kas') !== -1);
  assert.ok(csv.indexOf('dampak_total') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('205000') !== -1);
});

test('ringkasan kasus menghitung kasus terbuka dan indikasi kuat', () => {
  const summary = tool.summarizeCases([
    Object.assign(base({}), { id: 'r1', status: 'klaim_ekspedisi' }),
    Object.assign(base({}), {
      id: 'r2',
      status: 'baru',
      order_value: 0,
      product_cost: 0,
      shipping_cost: 0,
      packaging_cost: 0,
      return_shipping_cost: 0,
      other_cost: 0,
      recovered_goods_value: 0,
      evidence: tool.EVIDENCE.map((item) => item.id),
      timeline: [{ status: 'delivered', at: '2026-11-06T10:00' }],
    }),
  ]);
  assert.strictEqual(summary.total, 2);
  assert.strictEqual(summary.open_cases, 2);
  assert.strictEqual(summary.high_indication, 1);
  assert.strictEqual(summary.missing_evidence, 1);
  assert.strictEqual(summary.total_cash_loss, 205000);
  assert.strictEqual(summary.total_impact, 525000);
});

test('nominal negatif ditolak', () => {
  assert.throws(() => tool.analyze(base({ product_cost: -1 })), /angka 0 atau lebih/);
  assert.throws(() => tool.analyze(base({ order_value: 'abc' })), /angka 0 atau lebih/);
});

test('waktu scan tidak valid ditolak', () => {
  assert.throws(
    () => tool.analyze(base({ timeline: [{ status: 'ats', at: 'bukan tanggal' }] })),
    /Waktu scan baris 1 tidak valid/
  );
});

test('status dan pilihan tidak dikenal jatuh ke nilai aman', () => {
  const input = tool.normalizeInput({
    marketplace: 'tidak-ada',
    courier: 'tidak-ada',
    status: 'tidak-ada',
    timeline: [{ status: 'tidak-ada', at: '2026-11-01T00:00' }],
  });
  assert.strictEqual(input.marketplace, 'shopee');
  assert.strictEqual(input.courier, 'sicepat');
  assert.strictEqual(input.status, 'baru');
  assert.strictEqual(input.timeline[0].status, 'other');
});

test('lebih dari 20 baris scan ditolak', () => {
  const timeline = Array.from({ length: 21 }, () => ({
    status: 'transit',
    at: '2026-11-01T00:00',
  }));
  assert.throws(() => tool.analyze(base({ timeline })), /maksimal 20 baris/);
});

test('meta, contoh, analisis, surat, dan CSV tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.letter(base({ letter_type: 'ekspedisi' })).body,
    tool.letter(base({ letter_type: 'marketplace' })).body,
    tool.letter(base({ letter_type: 'bukti' })).body,
    tool.csvRows([Object.assign(base({}), { id: 'r1' })]),
  ];
  texts.forEach((text) => {
    assert.strictEqual(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
