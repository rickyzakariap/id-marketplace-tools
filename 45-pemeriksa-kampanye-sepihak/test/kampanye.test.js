'use strict';

const assert = require('assert');
const {
  analyze,
  assessIndicators,
  buildExample,
  buildLetter,
  caseView,
  computeEconomics,
  computeTimeline,
  daysBetween,
  addDays,
  formatDateID,
  formatRupiah,
  getMethod,
  getStatus,
  readiness,
  summary,
  todayISO,
  validateCase,
  meta,
  DEFAULTS,
  ENROLLMENT_METHODS,
  EVIDENCE,
  INDICATORS,
  PLATFORMS,
  PROBLEMS,
  SOURCES,
  CASE_STATUSES,
} = require('../lib/kampanye');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('ok - ' + name);
  } catch (err) {
    failed += 1;
    console.error('not ok - ' + name);
    console.error('  ' + err.message);
  }
}

const NOW = new Date(2026, 9, 31);

function base(overrides) {
  return Object.assign({
    platform: 'tiktok',
    enrollment_method: 'popup',
    campaign_name: 'Voucher Boost Campaign Payday',
    campaign_start: '2026-10-12',
    campaign_end: '2026-11-04',
    normal_price: 35900,
    campaign_price: 22410,
    seller_price: 22410,
    hpp: 18000,
    fee_rate: 10,
    units_sold: 6870,
    product_name: 'Sandal Slipper Premium',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-001',
    discovered_date: '2026-10-25',
    followup_date: '2026-10-29',
    problem: 'harga_turun',
    indicators: ['no_registration_record', 'price_differs', 'no_notification', 'popup_claim', 'no_consent_log', 'sales_spike'],
    evidence: ['price_screenshot', 'campaign_page', 'transaction_export', 'campaign_notification', 'chat_rm', 'price_history', 'ads_live_data', 'settlement', 'timeline'],
    chronology: 'Saya menemukan produk terdaftar saat memeriksa halaman kampanye.',
    note: 'Contoh.',
  }, overrides || {});
}

test('formatRupiah memakai titik ribuan', () => {
  assert.strictEqual(formatRupiah(83408670), 'Rp 83.408.670');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
});

test('formatDateID memakai nama bulan Indonesia', () => {
  assert.strictEqual(formatDateID('2026-10-31'), '31 Oktober 2026');
  assert.strictEqual(formatDateID(''), '-');
});

test('daysBetween menghitung selisih hari kalender', () => {
  assert.strictEqual(daysBetween('2026-10-01', '2026-10-31'), 30);
  assert.strictEqual(daysBetween('2026-10-31', '2026-10-01'), -30);
  assert.strictEqual(daysBetween('2026-02-30', '2026-03-01'), null);
});

test('addDays melewati batas bulan', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(addDays('2026-01-01', -1), '2025-12-31');
});

test('computeEconomics menghitung laba normal dan kampanye', () => {
  const e = computeEconomics(base());
  assert.strictEqual(e.normal_net, 14310);
  assert.strictEqual(e.campaign_net, 2169);
  assert.strictEqual(e.loss_per_unit, 12141);
  assert.strictEqual(e.total_loss, 83408670);
  assert.strictEqual(e.discount_per_unit, 13490);
  assert.strictEqual(e.discount_pct, 37.6);
  assert.strictEqual(e.verdict, 'turun');
  assert.strictEqual(e.cover_units, 5829);
});

test('computeEconomics tanpa biaya layanan', () => {
  const e = computeEconomics(base({ fee_rate: 0 }));
  assert.strictEqual(e.normal_net, 17900);
  assert.strictEqual(e.campaign_net, 4410);
  assert.strictEqual(e.loss_per_unit, 13490);
});

test('computeEconomics menandai rugi bila harga di bawah HPP', () => {
  const e = computeEconomics(base({ campaign_price: 15000, seller_price: 15000, hpp: 18000, fee_rate: 10 }));
  assert.strictEqual(e.campaign_net, -4500);
  assert.strictEqual(e.verdict, 'rugi');
  assert.strictEqual(e.tone, 'ember');
});

test('computeEconomics memakai harga yang diterima penjual bila diisi', () => {
  const e = computeEconomics(base({ seller_price: 25000 }));
  assert.strictEqual(e.seller_price, 25000);
  assert.strictEqual(e.campaign_net, 4500);
  assert.strictEqual(e.loss_per_unit, 9810);
});

test('computeEconomics unit nol tidak menghasilkan kerugian total', () => {
  const e = computeEconomics(base({ units_sold: 0 }));
  assert.strictEqual(e.total_loss, 0);
  assert.strictEqual(e.cover_units, null);
});

test('computeEconomics break even null saat biaya 100 persen', () => {
  const e = computeEconomics(base({ fee_rate: 100 }));
  assert.strictEqual(e.break_even_price, null);
});

test('computeTimeline fase belum mulai', () => {
  const t = computeTimeline({ campaign_start: '2026-11-05', campaign_end: '2026-11-10' }, NOW);
  assert.strictEqual(t.phase, 'belum_mulai');
  assert.strictEqual(t.days_to_start, 5);
  assert.strictEqual(t.tone, 'signal');
});

test('computeTimeline fase berjalan', () => {
  const t = computeTimeline(base(), NOW);
  assert.strictEqual(t.phase, 'berjalan');
  assert.strictEqual(t.days_to_end, 4);
  assert.strictEqual(t.campaign_days, 24);
  assert.strictEqual(t.days_since_discovered, 6);
  assert.strictEqual(t.followup_age, 2);
});

test('computeTimeline fase selesai', () => {
  const t = computeTimeline({ campaign_start: '2026-09-01', campaign_end: '2026-09-10' }, NOW);
  assert.strictEqual(t.phase, 'selesai');
  assert.strictEqual(t.days_to_end, -51);
  assert.strictEqual(t.tone, 'ok');
});

test('validateBase menolak tanggal mulai kosong', () => {
  const result = analyze(base({ campaign_start: '' }), NOW);
  assert.ok(result.error.indexOf('Tanggal mulai') !== -1);
});

test('validateBase menolak tanggal selesai sebelum mulai', () => {
  const result = analyze(base({ campaign_end: '2026-10-01' }), NOW);
  assert.ok(result.error.indexOf('tidak boleh sebelum') !== -1);
});

test('validateBase menolak harga normal nol', () => {
  const result = analyze(base({ normal_price: 0 }), NOW);
  assert.ok(result.error.indexOf('Harga normal') !== -1);
});

test('validateBase menolak harga kampanye nol', () => {
  const result = analyze(base({ campaign_price: 0 }), NOW);
  assert.ok(result.error.indexOf('Harga kampanye') !== -1);
});

test('validateBase menolak biaya layanan 100 persen', () => {
  const result = analyze(base({ fee_rate: 100 }), NOW);
  assert.ok(result.error.indexOf('Biaya layanan') !== -1);
});

test('validateBase menolak harga penjual di atas harga normal', () => {
  const result = analyze(base({ seller_price: 40000 }), NOW);
  assert.ok(result.error.indexOf('tidak boleh melebihi') !== -1);
});

test('validateBase menolak tanggal temuan di masa depan', () => {
  const result = analyze(base({ discovered_date: '2026-11-01' }), NOW);
  assert.ok(result.error.indexOf('Tanggal temuan') !== -1);
});

test('validateBase menolak tanggal follow-up di masa depan', () => {
  const result = analyze(base({ followup_date: '2026-11-01' }), NOW);
  assert.ok(result.error.indexOf('Tanggal follow-up') !== -1);
});

test('validateBase menolak tanggal kalender tidak valid', () => {
  const result = analyze(base({ campaign_start: '2026-02-30' }), NOW);
  assert.ok(result.error.indexOf('Tanggal mulai') !== -1);
});

test('assessIndicators kosong menghasilkan skor nol', () => {
  const a = assessIndicators([]);
  assert.strictEqual(a.score, 0);
  assert.strictEqual(a.level, 'rendah');
  assert.strictEqual(a.count, 0);
});

test('assessIndicators menjumlah bobot dan memberi level', () => {
  const a = assessIndicators(['no_registration_record', 'price_differs', 'no_notification', 'popup_claim', 'no_consent_log', 'sales_spike']);
  assert.strictEqual(a.score, 60);
  assert.strictEqual(a.level, 'tinggi');
  assert.strictEqual(a.tone, 'ember');
});

test('assessIndicators mengabaikan duplikat dan id asing', () => {
  const a = assessIndicators(['price_differs', 'price_differs', 'tidak_ada']);
  assert.strictEqual(a.score, 14);
  assert.strictEqual(a.count, 1);
});

test('readiness kosong memberi skor nol', () => {
  const r = readiness({ items: [] });
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.verdict, 'kurang');
  assert.strictEqual(r.missing_critical.length, 5);
});

test('readiness semua bukti memberi skor 100', () => {
  const r = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.verdict, 'siap');
  assert.strictEqual(r.missing_critical.length, 0);
});

test('readiness satu bukti kritis memakai bobot dua', () => {
  const r = readiness({ items: ['price_screenshot'] });
  assert.strictEqual(r.score, 11);
  assert.strictEqual(r.verdict, 'kurang');
  assert.strictEqual(r.available_count, 1);
});

test('analyze mengembalikan metode, sumber, dan penilaian', () => {
  const result = analyze(base(), NOW);
  assert.strictEqual(result.method.id, 'popup');
  assert.strictEqual(result.assessment.score, 60);
  assert.strictEqual(result.economics.total_loss, 83408670);
  assert.ok(result.sources.length >= 5);
  assert.ok(result.recommendations.length >= 5);
});

test('analyze tidak memakai em dash pada teks', () => {
  const result = analyze(base(), NOW);
  assert.strictEqual(JSON.stringify(result).indexOf('\u2014'), -1);
});

test('buildLetter mewajibkan nama toko', () => {
  const result = buildLetter(base({ store_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama toko') !== -1);
});

test('buildLetter mewajibkan nama produk', () => {
  const result = buildLetter(base({ product_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama produk') !== -1);
});

test('buildLetter mewajibkan nama kampanye', () => {
  const result = buildLetter(base({ campaign_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama kampanye') !== -1);
});

test('buildLetter memuat permintaan audit dan angka dampak', () => {
  const result = buildLetter(base(), NOW);
  assert.ok(result.subject.indexOf('Permintaan audit') !== -1);
  assert.ok(result.body.indexOf('catatan pendaftaran') !== -1);
  assert.ok(result.body.indexOf('Rp 83.408.670') !== -1);
  assert.ok(result.body.indexOf('Permendag 19/2026') !== -1);
});

test('buildExample menghasilkan payload yang valid', () => {
  const example = buildExample(NOW);
  const result = analyze(example, NOW);
  assert.ok(!result.error);
  assert.strictEqual(result.economics.units_sold, 6870);
});

test('validateCase mewajibkan nama produk', () => {
  const result = validateCase(base({ product_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama produk') !== -1);
});

test('validateCase mengembalikan item dengan status', () => {
  const result = validateCase(base({ case_status: 'dilaporkan' }), NOW);
  assert.ok(!result.error);
  assert.strictEqual(result.item.status, 'dilaporkan');
  assert.strictEqual(result.item.product_name, 'Sandal Slipper Premium');
});

test('caseView menandai kampanye berjalan tanpa bukti persetujuan', () => {
  const item = Object.assign(validateCase(base(), NOW).item, { id: 'k1' });
  const view = caseView(item, NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('masih berjalan') !== -1));
  assert.strictEqual(view.open, true);
});

test('caseView menandai follow-up lebih dari 14 hari', () => {
  const item = Object.assign(validateCase(base({ followup_date: '2026-10-01' }), NOW).item, { id: 'k1' });
  const view = caseView(item, NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('Follow-up terakhir') !== -1));
});

test('summary menjumlahkan kerugian dan unit', () => {
  const one = Object.assign(validateCase(base(), NOW).item, { id: 'k1' });
  const two = Object.assign(validateCase(base({ units_sold: 10, campaign_end: '2026-10-20', status: 'selesai' }), NOW).item, { id: 'k2' });
  const s = summary([one, two], NOW);
  assert.strictEqual(s.total_cases, 2);
  assert.strictEqual(s.total_units, 6880);
  assert.strictEqual(s.total_loss, 83408670 + 121410);
  assert.strictEqual(s.highest_score, 60);
});

test('summary tanpa kasus tetap aman', () => {
  const s = summary([], NOW);
  assert.strictEqual(s.total_cases, 0);
  assert.strictEqual(s.nearest_end_days, null);
});

test('meta memuat semua daftar yang dipakai UI', () => {
  const m = meta();
  assert.strictEqual(m.platforms.length, PLATFORMS.length);
  assert.strictEqual(m.indicators.length, INDICATORS.length);
  assert.strictEqual(m.evidence.length, EVIDENCE.length);
  assert.strictEqual(m.enrollment_methods.length, ENROLLMENT_METHODS.length);
  assert.strictEqual(m.problems.length, PROBLEMS.length);
  assert.strictEqual(m.case_statuses.length, CASE_STATUSES.length);
  assert.ok(m.sources.length >= 5);
  assert.strictEqual(m.defaults.platform, DEFAULTS.platform);
});

test('getMethod dan getStatus memakai fallback aman', () => {
  assert.strictEqual(getMethod('tidak_ada').id, 'tidak_tahu');
  assert.strictEqual(getStatus('tidak_ada').id, 'baru');
});

test('todayISO memakai tanggal lokal', () => {
  assert.strictEqual(todayISO(NOW), '2026-10-31');
});

console.log('');
console.log(passed + ' lulus, ' + failed + ' gagal');
if (failed > 0) process.exit(1);
