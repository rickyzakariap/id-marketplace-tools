// Unit tests for the penalty point tracker. Run: node test/penalty.test.js
const assert = require('assert');
const {
  analyze,
  buildLetter,
  buildExample,
  detectReappearance,
  validateCase,
  nextResetDate,
  lastMondayOfQuarter,
  tierFor,
  formatDateOnly,
  addDays,
  daysBetween,
  PLATFORMS,
  VIOLATIONS,
  TIERS,
  SOURCES,
  EVIDENCE,
  SHOPEE_THRESHOLD,
} = require('../lib/penalty');

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

const NOW = new Date('2026-10-22T03:00:00Z');

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    violation: 'fake_package',
    points: 9,
    last_point_date: '2026-10-17',
    appeal_window_days: 14,
    orders_per_day: 100,
    aov: 150000,
    margin_pct: 20,
    restriction_days: 28,
  }, overrides || {});
}

t('tingkatan Shopee sesuai tabel resmi', function () {
  assert.strictEqual(tierFor(0).level, 'Tingkat 0');
  assert.strictEqual(tierFor(2).level, 'Tingkat 0');
  assert.strictEqual(tierFor(3).level, 'Tingkat I');
  assert.strictEqual(tierFor(5).level, 'Tingkat I');
  assert.strictEqual(tierFor(6).level, 'Tingkat II');
  assert.strictEqual(tierFor(8).level, 'Tingkat II');
  assert.strictEqual(tierFor(9).level, 'Tingkat III');
  assert.strictEqual(tierFor(11).level, 'Tingkat III');
  assert.strictEqual(tierFor(12).level, 'Tingkat IV');
  assert.strictEqual(tierFor(14).level, 'Tingkat IV');
  assert.strictEqual(tierFor(15).level, 'Tingkat V');
  assert.strictEqual(tierFor(40).level, 'Tingkat V');
});

t('reset kuartal jatuh pada Senin terakhir', function () {
  assert.strictEqual(lastMondayOfQuarter(2026, 1), '2026-03-30');
  assert.strictEqual(lastMondayOfQuarter(2026, 2), '2026-06-29');
  assert.strictEqual(lastMondayOfQuarter(2026, 3), '2026-09-28');
  assert.strictEqual(lastMondayOfQuarter(2026, 4), '2026-12-28');
  assert.strictEqual(nextResetDate('2026-10-22'), '2026-12-28');
  assert.strictEqual(nextResetDate('2026-09-28'), '2026-12-28');
  assert.strictEqual(nextResetDate('2026-09-29'), '2026-12-28');
  assert.strictEqual(nextResetDate('2026-12-28'), '2027-03-29');
  assert.strictEqual(nextResetDate('2026-06-29'), '2026-09-28');
  assert.strictEqual(nextResetDate('2026-06-30'), '2026-09-28');
});

t('selisih hari dan tambah hari konsisten', function () {
  assert.strictEqual(daysBetween('2026-10-17', '2026-10-31'), 14);
  assert.strictEqual(addDays('2026-10-17', 14), '2026-10-31');
  assert.strictEqual(addDays('2026-12-28', 1), '2026-12-29');
  assert.strictEqual(formatDateOnly('2026-10-31'), '31 Oktober 2026');
});

t('analisis basis menghitung sisa poin dan reset', function () {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.points, 9);
  assert.strictEqual(r.threshold, SHOPEE_THRESHOLD);
  assert.strictEqual(r.tier, 'Tingkat III');
  assert.strictEqual(r.points_to_restriction, 6);
  assert.strictEqual(r.points_to_next_tier, 3);
  assert.strictEqual(r.next_tier, 'Tingkat IV');
  assert.strictEqual(r.reset_date, '2026-12-28');
  assert.strictEqual(r.days_to_reset, 67);
  assert.strictEqual(r.risk, 'waspada');
  assert.strictEqual(r.appeal.deadline, '2026-10-31');
  assert.strictEqual(r.appeal.days_left, 9);
  assert.strictEqual(r.appeal.state, 'terbuka');
  assert.strictEqual(r.appeal.process_days, 7);
});

t('tiga poin hanya membatasi promosi dan peringkat', function () {
  const r = analyze(base({ points: 3 }), NOW);
  assert.strictEqual(r.tier, 'Tingkat I');
  assert.strictEqual(r.risk, 'waspada');
  assert.ok(r.consequences.includes('Tidak bisa ikut promosi Shopee'));
  assert.ok(!r.consequences.some((item) => item.includes('unggah')));
});

t('dua belas poin memblokir unggah produk', function () {
  const r = analyze(base({ points: 12 }), NOW);
  assert.strictEqual(r.tier, 'Tingkat IV');
  assert.strictEqual(r.points_to_restriction, 3);
  assert.ok(r.consequences.some((item) => item.toLowerCase().includes('unggah')));
});

t('lima belas poin masuk risiko pembatasan dan hitung kerugian', function () {
  const r = analyze(base({ points: 15 }), NOW);
  assert.strictEqual(r.tier, 'Tingkat V');
  assert.strictEqual(r.risk, 'dibatasi');
  assert.strictEqual(r.points_to_restriction, 0);
  assert.strictEqual(r.economics.daily_profit, 3000000);
  assert.strictEqual(r.economics.restriction_days, 28);
  assert.strictEqual(r.economics.restriction_loss, 84000000);
  assert.ok(r.recommendations.length >= 3);
});

t('poin kritis dua angka di bawah ambang', function () {
  const r = analyze(base({ points: 13 }), NOW);
  assert.strictEqual(r.risk, 'kritis');
});

t('banding lewat tenggat ditandai', function () {
  const r = analyze(base({ last_point_date: '2026-10-01' }), NOW);
  assert.strictEqual(r.appeal.deadline, '2026-10-15');
  assert.strictEqual(r.appeal.days_left, -7);
  assert.strictEqual(r.appeal.state, 'lewat');
});

t('banding mendesak saat sisa dua hari atau kurang', function () {
  const r = analyze(base({ last_point_date: '2026-10-11' }), NOW);
  assert.strictEqual(r.appeal.days_left, 3);
  assert.strictEqual(r.appeal.state, 'terbuka');
  const r2 = analyze(base({ last_point_date: '2026-10-10' }), NOW);
  assert.strictEqual(r2.appeal.days_left, 2);
  assert.strictEqual(r2.appeal.state, 'kritis');
});

t('tanpa tanggal poin, banding tidak dihitung', function () {
  const r = analyze(base({ last_point_date: '' }), NOW);
  assert.strictEqual(r.appeal.available, false);
  assert.strictEqual(r.appeal.state, 'tanpa-tanggal');
});

t('platform non-Shopee memakai ambang manual', function () {
  const r = analyze(base({ platform: 'tiktok', points: 9, threshold: 10 }), NOW);
  assert.strictEqual(r.threshold, 10);
  assert.strictEqual(r.risk, 'kritis');
  assert.strictEqual(r.preset, false);
  assert.ok(r.consequences[0].toLowerCase().includes('tidak memetakan'));
  assert.strictEqual(r.appeal.state, 'terbuka');
  const manual = analyze(base({ platform: 'tiktok', points: 9, threshold: 10, appeal_window_days: 0 }), NOW);
  assert.strictEqual(manual.appeal.state, 'manual');
});

t('input orders dan aov wajib lebih dari nol', function () {
  assert.ok(analyze(base({ orders_per_day: 0 }), NOW).error);
  assert.ok(analyze(base({ aov: 0 }), NOW).error);
});

t('validasi kasus menolak referensi, tanggal, dan poin kosong', function () {
  assert.ok(validateCase({ ref: '', issued_date: '2026-10-01', points: 3 }).error);
  assert.ok(validateCase({ ref: 'A', issued_date: '', points: 3 }).error);
  assert.ok(validateCase({ ref: 'A', issued_date: '2026-10-01', points: 0 }).error);
  assert.ok(!validateCase({ ref: 'A', issued_date: '2026-10-01', points: 3 }).error);
});

t('deteksi poin muncul kembali setelah banding disetujui', function () {
  const cases = [
    { id: 'c1', ref: 'A', points: 6, issued_date: '2026-10-01', appeal_status: 'diterima', points_reset: 'ya', appeal_result_date: '2026-10-08' },
    { id: 'c2', ref: 'A', points: 9, issued_date: '2026-10-20', appeal_status: 'belum', points_reset: 'tidak-tahu' },
    { id: 'c3', ref: 'B', points: 2, issued_date: '2026-10-20', appeal_status: 'belum', points_reset: 'tidak-tahu' },
  ];
  const flags = detectReappearance(cases);
  assert.strictEqual(flags.length, 1);
  assert.strictEqual(flags[0].ref, 'A');
  assert.deepStrictEqual(flags[0].later_ids, ['c2']);
});

t('poin lama tanpa reset tidak dianggap muncul kembali', function () {
  const cases = [
    { id: 'c1', ref: 'A', points: 6, issued_date: '2026-10-01', appeal_status: 'diterima', points_reset: 'tidak', appeal_result_date: '2026-10-08' },
    { id: 'c2', ref: 'A', points: 9, issued_date: '2026-10-20', appeal_status: 'belum', points_reset: 'tidak-tahu' },
  ];
  assert.strictEqual(detectReappearance(cases).length, 0);
});

t('surat banding memuat referensi dan permintaan rincian', function () {
  const letter = buildLetter(Object.assign({}, buildExample(NOW), {
    seller_name: 'Ricky',
    store_name: 'Sinar Maju Palembang',
    ref: '261001GGJ854U8',
    points: 9,
  }), NOW);
  assert.strictEqual(letter.type, 'banding');
  assert.ok(letter.subject.includes('banding'));
  assert.ok(letter.body.includes('Sinar Maju Palembang'));
  assert.ok(letter.body.includes('261001GGJ854U8'));
  assert.ok(letter.body.includes('9 poin'));
  assert.ok(letter.body.includes('Permintaan saya:'));
  assert.ok(letter.body.includes('nomor tiket'));
});

t('surat poin kembali menyebut banding disetujui dan permintaan penjelasan', function () {
  const letter = buildLetter({
    letter_type: 'poin-kembali',
    platform: 'shopee',
    seller_name: 'Ricky',
    store_name: 'Sinar Maju Palembang',
    ref: 'A',
    points: 9,
    last_point_date: '2026-10-20',
    appeal_date: '2026-10-05',
    appeal_result_date: '2026-10-08',
  }, NOW);
  assert.strictEqual(letter.type, 'poin-kembali');
  assert.ok(letter.body.includes('disetujui'));
  assert.ok(letter.body.includes('muncul kembali'));
  assert.ok(letter.body.includes('8 Oktober 2026'));
  assert.ok(letter.body.includes('tahan sanksi'));
});

t('contoh isian memakai tanggal relatif dan data lengkap', function () {
  const example = buildExample(NOW);
  assert.strictEqual(example.platform, 'shopee');
  assert.strictEqual(example.last_point_date, '2026-10-17');
  assert.strictEqual(example.seller_name, 'Ricky');
  assert.ok(example.chronology.length > 20);
});

t('semua platform, pelanggaran, dan sumber punya data wajib', function () {
  PLATFORMS.forEach((item) => {
    assert.ok(item.id);
    assert.ok(item.name);
    assert.ok(item.note);
    assert.strictEqual(typeof item.preset, 'boolean');
  });
  VIOLATIONS.forEach((item) => {
    assert.ok(item.id);
    assert.ok(item.label);
    assert.ok(item.points >= 1);
    assert.ok(item.note);
  });
  TIERS.forEach((item) => {
    assert.ok(item.level);
    assert.ok(item.label);
  });
  SOURCES.forEach((item) => {
    assert.ok(item.publisher);
    assert.ok(item.date);
    assert.ok(item.url.startsWith('https://'));
  });
  assert.ok(EVIDENCE.length >= 6);
});

t('tidak ada em dash di teks user-facing', function () {
  const blob = JSON.stringify({ PLATFORMS, VIOLATIONS, TIERS, SOURCES, EVIDENCE });
  assert.strictEqual(blob.indexOf('\u2014'), -1);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
