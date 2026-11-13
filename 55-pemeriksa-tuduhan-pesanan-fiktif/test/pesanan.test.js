'use strict';

const assert = require('assert');
const tool = require('../lib/pesanan');

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
  return result.signals.signals.find((item) => item.id === id);
}

test('meta memuat pilihan, bukti, ambang, dan sumber', () => {
  const data = tool.meta();
  assert.strictEqual(data.marketplaces.length, 6);
  assert.strictEqual(data.triggers.length, 6);
  assert.strictEqual(data.sanction_statuses.length, 9);
  assert.strictEqual(data.sanction_statuses.filter((item) => item.open).length, 6);
  assert.strictEqual(data.case_statuses.length, 11);
  assert.strictEqual(data.case_statuses.filter((item) => item.open).length, 7);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.evidence.length, 13);
  assert.strictEqual(data.evidence.filter((item) => item.critical).length, 5);
  assert.strictEqual(data.facts.length, 14);
  assert.strictEqual(data.thresholds.reply_promise_days, 14);
  assert.strictEqual(data.thresholds.investigation_days, 90);
  assert.strictEqual(data.thresholds.extension_days, 90);
  assert.ok(data.thresholds.note.indexOf('bukan aturan umum') !== -1);
  assert.ok(data.rules.scope_note.indexOf('tidak menentukan siapa bersalah') !== -1);
  assert.ok(data.sources.length >= 4);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    assert.ok(item.facts.length > 20);
  });
});

test('sumber utama memuat kasus 12 November 2026', () => {
  assert.strictEqual(tool.SOURCES[0].publisher, 'Media Konsumen');
  assert.strictEqual(tool.SOURCES[0].date, '2026-11-12');
  assert.ok(tool.SOURCES[0].facts.indexOf('38.513.620') !== -1);
  assert.ok(tool.SOURCES[0].facts.indexOf('7 Agustus 2026') !== -1);
  assert.ok(tool.SOURCES[0].facts.indexOf('pelanggaran dibatalkan') !== -1);
});

test('contoh menghasilkan dana berisiko dan verdict sanksi batal', () => {
  const result = analyze({});
  assert.strictEqual(result.marketplace_label, 'TikTok Shop');
  assert.strictEqual(result.trigger_label, 'Penyalahgunaan subsidi atau voucher');
  assert.strictEqual(result.loss.outstanding, 38513620);
  assert.strictEqual(result.loss.lost_profit, 34905000);
  assert.strictEqual(result.loss.total_impact, 73418620);
  assert.strictEqual(result.loss.days_down, 179);
  assert.strictEqual(result.defense.label, 'Sedang');
  assert.strictEqual(result.signals.label, 'Kuat');
  assert.strictEqual(result.verdict.level, 'ember');
  assert.strictEqual(result.verdict.label, 'Sanksi batal, saldo belum pulih');
  assert.deepStrictEqual(
    result.evidence.missing_critical.map((item) => item.id),
    ['order_ids_proof', 'bank_mutation', 'subsidy_proof']
  );
});

test('dana berisiko menjumlahkan saldo ditahan dan dipotong dikurangi yang kembali', () => {
  const loss = analyze({
    balance_held: 500000,
    balance_deducted: 300000,
    balance_restored: 100000,
    balance_before: 900000,
  }).loss;
  assert.strictEqual(loss.at_risk, 800000);
  assert.strictEqual(loss.outstanding, 700000);
  assert.strictEqual(loss.balance_gap, 0);
});

test('selisih saldo yang tidak cocok menjadi penanda', () => {
  const result = analyze({
    balance_held: 200000,
    balance_deducted: 300000,
    balance_restored: 100000,
    balance_before: 1000000,
  });
  assert.strictEqual(result.loss.balance_gap, 400000);
  assert.strictEqual(signal(result, 'balance_gap').triggered, true);
});

test('lama toko nonaktif memakai tanggal aktif kembali', () => {
  const loss = analyze({
    deactivation_date: '2026-11-01',
    reactivated_date: '2026-11-11',
    as_of: '2026-11-13',
    orders_per_day: 10,
    aov: 100000,
    margin_pct: 20,
  }).loss;
  assert.strictEqual(loss.days_down, 10);
  assert.strictEqual(loss.profit_per_day, 200000);
  assert.strictEqual(loss.lost_profit, 2000000);
});

test('tanpa tanggal aktif kembali, lama nonaktif memakai tanggal hari ini', () => {
  const loss = analyze({
    deactivation_date: '2026-11-01',
    reactivated_date: '',
    as_of: '2026-11-13',
  }).loss;
  assert.strictEqual(loss.days_down, 12);
});

test('skor pembelaan naik saat fakta dan bukti lengkap', () => {
  const facts = {};
  tool.FACTS.forEach((item) => {
    facts[item.id] = item.good ? 'ya' : 'tidak';
  });
  const result = analyze({
    facts,
    evidence: tool.EVIDENCE.map((item) => item.id),
    sanction_status: 'aktif',
  });
  assert.strictEqual(result.defense.score, 100);
  assert.strictEqual(result.defense.label, 'Kuat');
  assert.strictEqual(result.evidence.score, 100);
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.verdict.label, 'Pembelaan kuat, ajukan tertulis');
});

test('keputusan otomatis menurunkan skor pembelaan', () => {
  const facts = {};
  tool.FACTS.forEach((item) => {
    facts[item.id] = item.good ? 'ya' : 'tidak';
  });
  const clean = analyze({ facts, evidence: tool.EVIDENCE.map((item) => item.id) });
  const automated = analyze({
    facts: Object.assign({}, facts, { automated_decision: 'ya' }),
    evidence: tool.EVIDENCE.map((item) => item.id),
  });
  assert.ok(automated.defense.score < clean.defense.score);
  assert.strictEqual(signal(automated, 'automated_decision').triggered, true);
});

test('penanda sanksi batal tetapi saldo belum pulih terdeteksi', () => {
  const result = analyze({});
  assert.strictEqual(signal(result, 'cancelled_not_restored').triggered, true);
  assert.strictEqual(signal(result, 'deducted_before_hold_end').triggered, true);
  assert.strictEqual(signal(result, 'no_order_ids').triggered, true);
  assert.strictEqual(signal(result, 'no_platform_evidence').triggered, true);
});

test('jawaban banding yang lewat janji 14 hari terdeteksi', () => {
  const result = analyze({
    appeal_date: '2026-10-20',
    appeal_result_date: '',
    as_of: '2026-11-20',
  });
  assert.strictEqual(signal(result, 'appeal_overdue').triggered, true);
});

test('status saldo dipulihkan memberi verdict aman', () => {
  const result = analyze({
    sanction_status: 'saldo_dipulihkan',
    balance_held: 0,
    balance_deducted: 0,
    balance_restored: 38513620,
  });
  assert.strictEqual(result.verdict.level, 'ok');
  assert.strictEqual(result.verdict.label, 'Saldo sudah dipulihkan');
});

test('tanpa dana berisiko memberi verdict aman', () => {
  const result = analyze({
    balance_held: 0,
    balance_deducted: 0,
    balance_restored: 0,
    balance_before: 0,
    orders_per_day: 0,
  });
  assert.strictEqual(result.loss.outstanding, 0);
  assert.strictEqual(result.verdict.level, 'ok');
  assert.strictEqual(result.verdict.label, 'Tidak ada dana berisiko');
});

test('kronologi dan selisih tanggal dihitung', () => {
  const result = analyze({});
  assert.strictEqual(result.dates.days_since_accusation, 187);
  assert.strictEqual(result.dates.days_since_deactivation, 187);
  assert.strictEqual(result.dates.appeal_result_days, 16);
  assert.strictEqual(result.dates.hold_remaining_days, -97);
});

test('kesiapan bukti bisa dihitung tanpa analisis penuh', () => {
  const result = tool.readiness({
    evidence: ['sanction_notice', 'shipping_receipt'],
  });
  assert.strictEqual(result.checked_count, 2);
  assert.strictEqual(result.critical_count, 5);
  assert.strictEqual(result.missing_critical.length, 3);
  assert.ok(result.score > 0 && result.score < 50);
});

test('surat banding memuat kronologi, fakta, dan dana berisiko', () => {
  const result = tool.letter(base({ letter_type: 'banding' }));
  assert.strictEqual(result.type, 'banding');
  assert.ok(result.subject.indexOf('Toko Contoh Sejahtera') !== -1);
  assert.ok(result.body.indexOf('Kronologi') !== -1);
  assert.ok(result.body.indexOf('Daftar ID pesanan') !== -1);
  assert.ok(result.body.indexOf('Dana berisiko: Rp 38.513.620') !== -1);
});

test('surat pemulihan fokus pada saldo setelah pelanggaran dibatalkan', () => {
  const result = tool.letter(base({ letter_type: 'pemulihan' }));
  assert.ok(result.subject.indexOf('pemulihan saldo') !== -1);
  assert.ok(result.body.indexOf('Pelanggaran yang dituduhkan telah dinyatakan dibatalkan') !== -1);
  assert.ok(result.body.indexOf('Rekonsiliasi saldo') !== -1);
});

test('surat eskalasi memuat penanda proses dan Kementerian UMKM', () => {
  const result = tool.letter(base({ letter_type: 'eskalasi' }));
  assert.ok(result.heading.indexOf('Kementerian UMKM') !== -1);
  assert.ok(result.body.indexOf('Penanda proses') !== -1);
  assert.ok(result.body.indexOf('SP4N-Lapor') !== -1);
});

test('CSV memuat kolom dana berisiko dan menetralkan formula', () => {
  const csv = tool.csvRows([
    Object.assign(base({}), { id: 'f1', store_name: '=SUM(A1)' }),
  ]);
  assert.ok(csv.indexOf('dana_berisiko') !== -1);
  assert.ok(csv.indexOf('skor_pembelaan') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('38513620') !== -1);
});

test('ringkasan kasus menghitung kasus terbuka dan sanksi batal', () => {
  const summary = tool.summarizeCases([
    Object.assign(base({}), { id: 'f1', status: 'minta_saldo' }),
    Object.assign(base({}), {
      id: 'f2',
      status: 'selesai',
      sanction_status: 'saldo_dipulihkan',
      balance_held: 0,
      balance_deducted: 0,
      balance_restored: 38513620,
    }),
  ]);
  assert.strictEqual(summary.total, 2);
  assert.strictEqual(summary.open_cases, 1);
  assert.strictEqual(summary.cancelled_not_restored, 1);
  assert.strictEqual(summary.total_outstanding, 38513620);
  assert.strictEqual(summary.total_impact, 73418620);
});

test('nominal negatif dan margin di atas 100 ditolak', () => {
  assert.throws(() => tool.analyze(base({ balance_held: -1 })), /angka 0 atau lebih/);
  assert.throws(() => tool.analyze(base({ aov: 'abc' })), /angka 0 atau lebih/);
  assert.throws(() => tool.analyze(base({ margin_pct: 101 })), /maksimal 100 persen/);
});

test('tanggal tidak valid ditolak', () => {
  assert.throws(
    () => tool.analyze(base({ accusation_date: 'bukan tanggal' })),
    /Tanggal accusation date tidak valid/
  );
});

test('pilihan tidak dikenal jatuh ke nilai aman', () => {
  const input = tool.normalizeInput({
    marketplace: 'tidak-ada',
    trigger: 'tidak-ada',
    sanction_status: 'tidak-ada',
    status: 'tidak-ada',
    facts: { shipped: 'ya' },
  });
  assert.strictEqual(input.marketplace, 'tiktok');
  assert.strictEqual(input.trigger, 'subsidi_voucher');
  assert.strictEqual(input.sanction_status, 'aktif');
  assert.strictEqual(input.status, 'baru');
  assert.strictEqual(input.facts.shipping_proof, 'tidak_tahu');
});

test('meta, contoh, analisis, surat, dan CSV tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.letter(base({ letter_type: 'banding' })).body,
    tool.letter(base({ letter_type: 'pemulihan' })).body,
    tool.letter(base({ letter_type: 'eskalasi' })).body,
    tool.csvRows([Object.assign(base({}), { id: 'f1' })]),
  ];
  texts.forEach((text) => {
    assert.strictEqual(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
