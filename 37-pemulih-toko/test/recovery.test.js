// Unit tests for the store recovery assistant. Run: node test/recovery.test.js
const assert = require('assert');
const {
  calculateImpact,
  buildLetter,
  getIssue,
  getPlatform,
  ISSUES,
  PLATFORMS,
  SOURCES,
} = require('../lib/recovery');

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

t('menghitung omzet dan laba yang hilang', function () {
  const r = calculateImpact({
    issue: 'suspend',
    platform: 'shopee',
    orders_per_day: 100,
    aov: 150000,
    margin_pct: 20,
    days_down: 3,
    fixed_cost_per_day: 250000,
  });
  assert.strictEqual(r.metrics.daily_revenue, 15000000);
  assert.strictEqual(r.metrics.daily_profit, 3000000);
  assert.strictEqual(r.metrics.daily_impact, 3250000);
  assert.strictEqual(r.metrics.total_revenue, 45000000);
  assert.strictEqual(r.metrics.total_profit, 9000000);
  assert.strictEqual(r.metrics.total_fixed, 750000);
  assert.strictEqual(r.metrics.total_impact, 9750000);
  near(r.metrics.per_hour, 135416.67, 0.5);
});

t('margin nol hanya menghitung biaya tetap', function () {
  const r = calculateImpact({
    orders_per_day: 10,
    aov: 100000,
    margin_pct: 0,
    days_down: 2,
    fixed_cost_per_day: 50000,
  });
  assert.strictEqual(r.metrics.daily_impact, 50000);
  assert.strictEqual(r.metrics.total_impact, 100000);
});

t('severity mengikuti lama toko terhenti', function () {
  const base = { orders_per_day: 1, aov: 10000, margin_pct: 10 };
  assert.strictEqual(calculateImpact(Object.assign({}, base, { days_down: 1 })).severity, 'baru');
  assert.strictEqual(calculateImpact(Object.assign({}, base, { days_down: 3 })).severity, 'waspada');
  assert.strictEqual(calculateImpact(Object.assign({}, base, { days_down: 7 })).severity, 'tinggi');
  assert.strictEqual(calculateImpact(Object.assign({}, base, { days_down: 14 })).severity, 'kritis');
});

t('hari minimal satu walau input nol atau negatif', function () {
  const r = calculateImpact({ orders_per_day: 2, aov: 10000, days_down: 0 });
  assert.strictEqual(r.days_down, 1);
});

t('validasi pesanan dan nilai pesanan', function () {
  assert.ok(calculateImpact({ orders_per_day: 0, aov: 10000 }).error);
  assert.ok(calculateImpact({ orders_per_day: 2, aov: 0 }).error);
});

t('issue dan platform tidak dikenal jatuh ke default', function () {
  assert.strictEqual(getIssue('tidak-ada').id, 'suspend');
  assert.strictEqual(getPlatform('tidak-ada').id, 'shopee');
});

t('hasil membawa checklist dan langkah sesuai issue', function () {
  const r = calculateImpact({ issue: 'nik', orders_per_day: 2, aov: 10000, days_down: 2 });
  assert.strictEqual(r.issue_label, 'NIK terkunci');
  assert.ok(r.evidence.some((item) => item.toLowerCase().includes('ktp')));
  assert.ok(r.actions.length >= 5);
  assert.ok(r.sources.some((source) => source.id === 'uu-pdp-27-2022'));
});

t('surat suspend memuat toko, platform, tiket, dan tanggal', function () {
  const letter = buildLetter({
    issue: 'suspend',
    platform: 'shopee',
    seller_name: 'Sari',
    store_name: 'Toko Sari Snack',
    store_id: 'contoh-toko',
    contact: '0812xxxxxxx',
    case_id: '2109830730719211531',
    chronology: '13 Oktober 2026: voucher berhenti bekerja.',
  }, new Date('2026-10-20T03:00:00Z'));
  assert.ok(letter.body.includes('Toko Sari Snack'));
  assert.ok(letter.body.includes('Shopee'));
  assert.ok(letter.body.includes('2109830730719211531'));
  assert.ok(letter.body.includes('20 Oktober 2026'));
  assert.ok(letter.body.includes('Permintaan saya:'));
});

t('surat NIK meminta unlink dan merujuk UU PDP', function () {
  const letter = buildLetter({
    issue: 'nik',
    seller_name: 'Sari',
    store_name: 'Toko Sari Snack',
  }, new Date('2026-10-20T03:00:00Z'));
  assert.ok(letter.body.includes('unlink'));
  assert.ok(letter.body.includes('Undang-Undang No. 27 Tahun 2022'));
});

t('surat identitas meminta penghapusan ulasan palsu', function () {
  const letter = buildLetter({
    issue: 'fake_reviews',
    seller_name: 'Sari',
    store_name: 'Toko Sari Snack',
  }, new Date('2026-10-20T03:00:00Z'));
  assert.ok(letter.body.includes('ulasan'));
  assert.ok(letter.body.includes('data pribadi'));
});

t('surat tanpa tiket tidak memuat baris nomor tiket', function () {
  const letter = buildLetter({
    issue: 'hijack',
    seller_name: 'Sari',
    store_name: 'Toko Sari Snack',
  }, new Date('2026-10-20T03:00:00Z'));
  assert.ok(!letter.body.includes('Nomor tiket atau laporan terakhir'));
});

t('surat tanpa kronologi tidak mengulang konteks dua kali', function () {
  const letter = buildLetter({
    issue: 'suspend',
    seller_name: 'Sari',
    store_name: 'Toko Sari Snack',
  }, new Date('2026-10-20T03:00:00Z'));
  const context = 'Pembatasan terjadi mendadak dan saya belum menerima rincian';
  const first = letter.body.indexOf(context);
  const second = letter.body.indexOf(context, first + 1);
  assert.ok(first >= 0);
  assert.strictEqual(second, -1);
});

t('langkah akun dibajak menolak permintaan OTP', function () {
  const issue = getIssue('hijack');
  const combined = issue.actions.concat(issue.donts).map((item) => item.detail || item).join(' ');
  assert.ok(combined.toLowerCase().includes('otp'));
});

t('semua issue punya sumber, bukti, langkah, dan larangan', function () {
  ISSUES.forEach((issue) => {
    assert.ok(issue.sourceIds.length > 0, issue.id + ' tanpa sumber');
    assert.ok(issue.evidence.length > 0, issue.id + ' tanpa bukti');
    assert.ok(issue.actions.length > 0, issue.id + ' tanpa langkah');
    assert.ok(issue.donts.length > 0, issue.id + ' tanpa larangan');
  });
});

t('semua platform punya nama dan catatan', function () {
  PLATFORMS.forEach((platform) => {
    assert.ok(platform.name);
    assert.ok(platform.note);
  });
});

t('semua sumber punya tanggal dan URL', function () {
  SOURCES.forEach((source) => {
    assert.ok(source.date);
    assert.ok(source.url.startsWith('https://'));
    assert.ok(source.publisher);
  });
});

t('tidak ada em dash di teks user-facing', function () {
  const blob = JSON.stringify({ ISSUES, PLATFORMS, SOURCES });
  assert.strictEqual(blob.indexOf('\u2014'), -1);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
