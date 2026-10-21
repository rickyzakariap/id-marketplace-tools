// Unit tests for the UMKM service fee checker. Run: npm test
const assert = require('assert');
const {
  buildPolicy,
  checkEligibility,
  formatIDDate,
  MARKETPLACES,
  EFFECTIVE_DATE,
} = require('../server');

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

function answers(overrides) {
  return Object.assign({
    scale: 'mikro',
    nib: true,
    sapa: true,
    local: true,
    bukan_high_risk: true,
  }, overrides || {});
}

function entry(overrides) {
  return Object.assign({ marketplace: 'shopee', omzet: 50000000, rate: 12 }, overrides || {});
}

t('status sebelum 25 Oktober 2026 adalah terjadwal', function () {
  const policy = buildPolicy(new Date(2026, 9, 21));
  assert.strictEqual(policy.status, 'terjadwal');
  assert.strictEqual(policy.effective_date, EFFECTIVE_DATE);
  assert.strictEqual(policy.days_left, 4);
  assert.ok(policy.label.includes('25 Oktober 2026'));
  assert.ok(policy.description.includes('Kepmen UMKM 398/2026'));
  assert.strictEqual(policy.verification_days, 10);
  assert.strictEqual(policy.grant_days, 5);
});

t('status pada 25 Oktober 2026 sudah aktif', function () {
  const policy = buildPolicy(new Date(2026, 9, 25));
  assert.strictEqual(policy.status, 'aktif');
  assert.strictEqual(policy.days_left, 0);
  assert.ok(policy.label.includes('sudah berlaku'));
});

t('format tanggal memakai nama bulan Indonesia', function () {
  assert.strictEqual(formatIDDate(new Date(2026, 9, 21)), '21 Oktober 2026');
});

t('semua syarat terpenuhi dapat diskon 50 persen', function () {
  const result = checkEligibility({
    answers: answers(),
    exclusions: {},
    entries: [entry()],
  });
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.body.eligible, true);
  assert.strictEqual(result.body.summary.feeMonthlyTotal, 6000000);
  assert.strictEqual(result.body.summary.savingMonthly, 3000000);
  assert.strictEqual(result.body.summary.savingAnnual, 36000000);
  assert.strictEqual(result.body.summary.feeAfterDiscountMonthly, 3000000);
});

t('pengecualian kategori menang atas syarat lain', function () {
  const result = checkEligibility({
    answers: answers(),
    exclusions: { pangan_siap_saji: true },
    entries: [entry()],
  });
  assert.strictEqual(result.body.eligible, false);
  assert.strictEqual(result.body.summary.savingMonthly, 0);
  assert.strictEqual(result.body.exclusions[0].id, 'pangan_siap_saji');
});

t('usaha menengah tidak layak', function () {
  const result = checkEligibility({ answers: answers({ scale: 'menengah' }), entries: [] });
  assert.strictEqual(result.body.eligible, false);
});

t('produk impor tidak layak', function () {
  const result = checkEligibility({ answers: answers({ local: false }), entries: [] });
  assert.strictEqual(result.body.eligible, false);
});

t('rekam jejak tidak bersih tidak layak', function () {
  const result = checkEligibility({ answers: answers({ bukan_high_risk: false }), entries: [] });
  assert.strictEqual(result.body.eligible, false);
  assert.strictEqual(result.body.checks.bukan_high_risk.ok, false);
});

t('tanpa NIB tidak layak tetapi penghematan nol', function () {
  const result = checkEligibility({
    answers: answers({ nib: false }),
    entries: [entry()],
  });
  assert.strictEqual(result.body.eligible, false);
  assert.strictEqual(result.body.summary.savingMonthly, 0);
});

t('skala tidak valid mengembalikan 400', function () {
  const result = checkEligibility({ answers: answers({ scale: 'konglomerat' }), entries: [] });
  assert.strictEqual(result.status, 400);
  assert.ok(result.body.error);
});

t('entri marketplace tidak dikenal dilewati', function () {
  const result = checkEligibility({
    answers: answers(),
    entries: [entry({ marketplace: 'tidak-ada' })],
  });
  assert.strictEqual(result.body.breakdown.length, 0);
  assert.strictEqual(result.body.summary.savingMonthly, 0);
});

t('rate default adalah estimasi 10-18 persen', function () {
  MARKETPLACES.forEach(function (mp) {
    assert.ok(mp.defaultRate >= 5 && mp.defaultRate <= 18, mp.id + ' rate di luar rentang');
  });
  assert.strictEqual(MARKETPLACES.find(function (m) { return m.id === 'shopee'; }).defaultRate, 12);
});

t('rate dibatasi 0 sampai 50 persen', function () {
  const result = checkEligibility({
    answers: answers(),
    entries: [entry({ rate: 99 }), entry({ marketplace: 'tokopedia', rate: -5, omzet: 1000000 })],
  });
  assert.strictEqual(result.body.breakdown[0].rate, 50);
  assert.strictEqual(result.body.breakdown[1].rate, 0);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
