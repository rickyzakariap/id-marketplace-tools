'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  analyze,
  computeTotals,
  computePhase,
  evaluateEligibility,
  detectSignals,
  assess,
  readiness,
  validateBase,
  validateCase,
  summary,
  buildLetter,
  buildExample,
  meta,
  formatRupiah,
  formatDateID,
  todayISO,
  parseISO,
  addDays,
  addBusinessDays,
  businessDaysBetween,
  daysBetween,
  PLATFORMS,
  SCALES,
  YES_NO,
  REQUIREMENTS,
  AUTO_SIGNALS,
  MANUAL_SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  EFFECTIVE_DATE,
  KEPMEN_DATE,
  DISCOUNT_MIN,
  PULL_WORKING_DAYS,
  VERIFY_WORKING_DAYS,
  TOTAL_WORKING_DAYS,
  IDENTIFIED_SELLERS,
  SERVICE_FEE_MIN,
  SERVICE_FEE_MAX,
} = require('../lib/audit');

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

const NOW = new Date(2026, 10, 3);
const ALL_EVIDENCE = EVIDENCE.map((item) => item.id);

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    scale: 'mikro',
    domestic: 'ya',
    sapa: 'ya',
    verified: 'ya',
    high_risk: 'tidak',
    record: 'ya',
    store_name: 'Toko Contoh Lokal',
    store_id: 'toko-contoh-lokal',
    seller_name: 'Pemilik Toko',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-001',
    period_start: '2026-10-26',
    period_end: '2026-11-02',
    application_date: '2026-10-25',
    verified_date: '2026-10-31',
    gross_sales: 15000000,
    fee_rate: 10,
    fee_basis: 1500000,
    discount_pct: 50,
    actual_fee: 1200000,
    periods_per_year: 12,
    chronology: 'Pengajuan lolos verifikasi, tetapi diskon di settlement hanya sebagian.',
    note: 'Contoh uji.',
    status: 'baru',
    letter_type: 'keberatan',
    manual_signals: [],
    evidence: ALL_EVIDENCE.slice(),
  }, overrides || {});
}

function normalized(overrides, now) {
  const checked = validateBase(base(overrides), now || NOW);
  assert.ok(!checked.error, checked.error || 'expected valid input');
  return checked.data;
}

test('formatRupiah memakai titik ribuan', () => {
  assert.strictEqual(formatRupiah(1500000), 'Rp 1.500.000');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
  assert.strictEqual(formatRupiah(-450000), 'Rp -450.000');
});

test('formatDateID memakai nama bulan Indonesia', () => {
  assert.strictEqual(formatDateID('2026-11-03'), '3 November 2026');
  assert.strictEqual(formatDateID(''), '-');
});

test('todayISO memakai tanggal lokal', () => {
  assert.strictEqual(todayISO(NOW), '2026-11-03');
  assert.strictEqual(todayISO(new Date(2026, 0, 5)), '2026-01-05');
});

test('parseISO menolak tanggal kalender tidak valid', () => {
  assert.strictEqual(parseISO('2026-02-30'), null);
  assert.strictEqual(parseISO('2026-13-01'), null);
  assert.strictEqual(parseISO('2026-02-28'), '2026-02-28');
});

test('addDays melewati akhir bulan', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(addDays('2026-01-01', -1), '2025-12-31');
});

test('addBusinessDays melewati akhir pekan', () => {
  assert.strictEqual(addBusinessDays('2026-10-23', 1), '2026-10-26');
  assert.strictEqual(addBusinessDays('2026-10-30', 3), '2026-11-04');
});

test('businessDaysBetween menghitung Senin sampai Jumat', () => {
  assert.strictEqual(businessDaysBetween('2026-10-26', '2026-11-03'), 6);
  assert.strictEqual(businessDaysBetween('2026-10-23', '2026-10-26'), 1);
  assert.strictEqual(businessDaysBetween('2026-10-23', '2026-10-25'), 0);
  assert.strictEqual(businessDaysBetween('2026-11-03', '2026-10-26'), 0);
});

test('daysBetween menghitung hari kalender', () => {
  assert.strictEqual(daysBetween('2026-10-31', '2026-11-03'), 3);
  assert.strictEqual(daysBetween('2026-11-03', '2026-10-31'), -3);
});

test('computeTotals menghitung dasar, biaya setelah diskon, dan selisih', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 1200000 });
  const c = computeTotals(data);
  assert.strictEqual(c.basis, 1500000);
  assert.strictEqual(c.expected_fee, 750000);
  assert.strictEqual(c.expected_discount, 750000);
  assert.strictEqual(c.actual_discount, 300000);
  assert.strictEqual(c.actual_discount_pct, 20);
  assert.strictEqual(c.gap, 450000);
  assert.strictEqual(c.gap_pct, 30);
  assert.strictEqual(c.realization_pct, 40);
  assert.strictEqual(c.code, 'kurang');
  assert.strictEqual(c.annual_leak, 5400000);
  assert.strictEqual(c.basis_source, 'input');
});

test('computeTotals memberi verdict sesuai saat selisih kecil', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 755000 });
  const c = computeTotals(data);
  assert.strictEqual(c.gap, 5000);
  assert.strictEqual(c.code, 'sesuai');
});

test('computeTotals menandai selisih di atas toleransi', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 760000 });
  const c = computeTotals(data);
  assert.strictEqual(c.gap, 10000);
  assert.strictEqual(c.code, 'kurang');
});

test('computeTotals menangani diskon lebih besar dari 50 persen', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 600000 });
  const c = computeTotals(data);
  assert.strictEqual(c.actual_discount_pct, 60);
  assert.strictEqual(c.gap, -150000);
  assert.strictEqual(c.code, 'lebih');
  assert.strictEqual(c.annual_leak, 0);
});

test('computeTotals menangani biaya yang tidak dikenai diskon sama sekali', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 1500000 });
  const c = computeTotals(data);
  assert.strictEqual(c.actual_discount, 0);
  assert.strictEqual(c.actual_discount_pct, 0);
  assert.strictEqual(c.realization_pct, 0);
  assert.strictEqual(c.code, 'kurang');
  assert.strictEqual(c.label, 'Diskon belum terlihat');
});

test('computeTotals menangani biaya yang melebihi dasar sebelum diskon', () => {
  const data = normalized({ fee_basis: 1500000, discount_pct: 50, actual_fee: 1600000 });
  const c = computeTotals(data);
  assert.strictEqual(c.actual_discount, -100000);
  assert.strictEqual(c.actual_discount_pct, -6.7);
  assert.strictEqual(c.gap, 850000);
  assert.strictEqual(c.code, 'kurang');
});

test('computeTotals bisa menurunkan dasar dari omzet dan tarif', () => {
  const data = normalized({ fee_basis: 0, gross_sales: 20000000, fee_rate: 10, actual_fee: 1500000 });
  const c = computeTotals(data);
  assert.strictEqual(c.basis, 2000000);
  assert.strictEqual(c.basis_source, 'estimated');
  assert.strictEqual(c.expected_fee, 1000000);
  assert.strictEqual(c.gap, 500000);
});

test('biaya layanan dasar eksplisit menang atas omzet dan tarif', () => {
  const data = normalized({ fee_basis: 1500000, gross_sales: 20000000, fee_rate: 10, actual_fee: 1200000 });
  const c = computeTotals(data);
  assert.strictEqual(c.basis, 1500000);
  assert.strictEqual(c.basis_source, 'input');
});

test('computePhase menandai sebelum tanggal efektif', () => {
  const data = normalized({ period_start: '2026-10-13', period_end: '2026-10-19', application_date: '2026-10-15', verified_date: '' }, new Date(2026, 9, 20));
  const p = computePhase(data, new Date(2026, 9, 20));
  assert.strictEqual(p.code, 'before_effective');
  assert.strictEqual(p.label, 'Kebijakan belum berlaku');
});

test('computePhase menandai belum ada pengajuan', () => {
  const data = normalized({ application_date: '', verified_date: '', verified: 'tidak' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.code, 'no_application');
});

test('computePhase menandai fase penarikan data', () => {
  const data = normalized({ application_date: '2026-10-30', verified_date: '', verified: 'tidak' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.code, 'waiting_pull');
  assert.strictEqual(p.business_days, 2);
  assert.strictEqual(p.days_remaining, 13);
});

test('computePhase menandai fase verifikasi', () => {
  const data = normalized({ application_date: '2026-10-26', verified_date: '', verified: 'tidak' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.code, 'verifying');
  assert.strictEqual(p.business_days, 6);
});

test('computePhase menandai lewat 15 hari kerja', () => {
  const later = new Date(2026, 10, 25);
  const data = normalized({ period_end: '2026-11-20', application_date: '2026-10-26', verified_date: '', verified: 'tidak' }, later);
  const p = computePhase(data, later);
  assert.strictEqual(p.code, 'overdue');
  assert.ok(p.business_days >= TOTAL_WORKING_DAYS);
});

test('computePhase memberi prioritas status verifikasi tercatat', () => {
  const data = normalized({ verified: 'ya', verified_date: '2026-10-31' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.code, 'verified');
  assert.ok(p.detail.indexOf('31 Oktober 2026') !== -1);
});

test('computePhase memakai tanggal efektif bila pengajuan lebih awal', () => {
  const data = normalized({ application_date: '2026-10-20', verified_date: '', verified: 'tidak' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.baseline_date, EFFECTIVE_DATE);
});

test('computePhase menyebut batas 5 dan 15 hari kerja', () => {
  const data = normalized({ application_date: '2026-10-26', verified_date: '', verified: 'tidak' });
  const p = computePhase(data, NOW);
  assert.strictEqual(p.pull_deadline, '2026-11-02');
  assert.strictEqual(p.active_deadline, '2026-11-16');
  assert.strictEqual(p.pull_working_days, 5);
  assert.strictEqual(p.verify_working_days, 10);
});

test('evaluateEligibility menyatakan layak saat semua syarat terpenuhi', () => {
  const data = normalized({});
  const phase = computePhase(data, NOW);
  const e = evaluateEligibility(data, phase);
  assert.strictEqual(e.verdict, 'layak');
  assert.strictEqual(e.hard_failed.length, 0);
});

test('evaluateEligibility menolak skala menengah', () => {
  const data = normalized({ scale: 'menengah' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'tidak_layak');
  assert.ok(e.hard_failed.some((label) => label.indexOf('Skala') !== -1));
});

test('evaluateEligibility menolak produk impor', () => {
  const data = normalized({ domestic: 'tidak' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'tidak_layak');
});

test('evaluateEligibility menolak tanpa SAPA UMKM', () => {
  const data = normalized({ sapa: 'tidak' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'tidak_layak');
});

test('evaluateEligibility menolak pengguna berisiko tinggi', () => {
  const data = normalized({ high_risk: 'ya' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'tidak_layak');
});

test('evaluateEligibility menolak rekam jejak buruk', () => {
  const data = normalized({ record: 'tidak' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'tidak_layak');
});

test('evaluateEligibility menunggu verifikasi bila syarat dasar lolos', () => {
  const data = normalized({ verified: 'tidak', verified_date: '' });
  const e = evaluateEligibility(data, computePhase(data, NOW));
  assert.strictEqual(e.verdict, 'menunggu_verifikasi');
  assert.strictEqual(e.pending.length, 1);
});

test('detectSignals menandai diskon belum terlihat', () => {
  const data = normalized({ actual_fee: 1500000 });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  assert.ok(ids.indexOf('diskon_tidak_ada') !== -1);
});

test('detectSignals menandai diskon sebagian dan selisih besar', () => {
  const data = normalized({});
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  assert.ok(ids.indexOf('diskon_sebagian') !== -1);
  assert.ok(ids.indexOf('gap_besar') !== -1);
});

test('detectSignals menandai biaya melebihi dasar', () => {
  const data = normalized({ actual_fee: 1600000 });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  assert.ok(ids.indexOf('fee_lebih_basis') !== -1);
});

test('detectSignals menandai keterlambatan 15 hari kerja', () => {
  const later = new Date(2026, 10, 25);
  const data = normalized({ period_end: '2026-11-20', application_date: '2026-10-26', verified_date: '', verified: 'tidak' }, later);
  const calc = computeTotals(data);
  const phase = computePhase(data, later);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  assert.ok(ids.indexOf('lewat_15_hari') !== -1);
});

test('detectSignals menandai tarif di luar kisaran 10 sampai 18 persen', () => {
  const data = normalized({ fee_basis: 0, gross_sales: 15000000, fee_rate: 5, actual_fee: 500000 });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  assert.ok(ids.indexOf('tarif_luar_kisaran') !== -1);
});

test('detectSignals menandai syarat yang gagal', () => {
  const data = normalized({ scale: 'besar', domestic: 'tidak', sapa: 'tidak', high_risk: 'ya', record: 'tidak' });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const ids = detectSignals(data, calc, evaluateEligibility(data, phase), phase);
  ['produk_impor', 'skala_besar', 'high_risk', 'sapa_belum', 'rekam_jejak'].forEach((id) => {
    assert.ok(ids.indexOf(id) !== -1, id + ' should be detected');
  });
});

test('assess memberi skor dan level sesuai bobot', () => {
  const data = normalized({});
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const e = evaluateEligibility(data, phase);
  const risk = assess(data, calc, e, phase);
  assert.ok(risk.score > 0);
  assert.strictEqual(risk.level, 'sedang');
  assert.ok(risk.auto.length > 0);
});

test('assess menjumlahkan sinyal manual', () => {
  const data = normalized({ manual_signals: ['sebagian_sku', 'settlement_tidak_rinci'] });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const risk = assess(data, calc, evaluateEligibility(data, phase), phase);
  assert.strictEqual(risk.manual.length, 2);
  assert.ok(risk.selected.length >= 2);
});

test('assess membatasi skor maksimal 100', () => {
  const data = normalized({ scale: 'besar', domestic: 'tidak', sapa: 'tidak', high_risk: 'ya', record: 'tidak', actual_fee: 2000000, manual_signals: MANUAL_SIGNALS.map((item) => item.id) });
  const calc = computeTotals(data);
  const phase = computePhase(data, NOW);
  const risk = assess(data, calc, evaluateEligibility(data, phase), phase);
  assert.strictEqual(risk.score, 100);
  assert.strictEqual(risk.level, 'tinggi');
});

test('readiness kosong memberi skor 0 dan bukti kritis hilang', () => {
  const r = readiness({ items: [] });
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.missing_critical.length, 5);
  assert.strictEqual(r.verdict, 'kurang');
});

test('readiness semua bukti memberi skor 100 dan siap', () => {
  const r = readiness({ items: ALL_EVIDENCE });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.missing_critical.length, 0);
  assert.strictEqual(r.verdict, 'siap');
  assert.strictEqual(r.available_count, EVIDENCE.length);
});

test('readiness satu bukti kritis bernilai 11 persen', () => {
  const r = readiness({ items: ['sapa_account'] });
  assert.strictEqual(r.score, 11);
  assert.strictEqual(r.verdict, 'kurang');
});

test('readiness dengan satu bukti kritis hilang berstatus hampir siap', () => {
  const items = EVIDENCE.filter((item) => item.id !== 'sku_list').map((item) => item.id);
  const r = readiness({ items: items });
  assert.strictEqual(r.missing_critical.length, 1);
  assert.strictEqual(r.verdict, 'hampir');
});

test('analyze memberi verdict kurang saat verifikasi lolos dan selisih ada', () => {
  const r = analyze(base({}), NOW);
  assert.ok(!r.error, r.error);
  assert.strictEqual(r.phase.code, 'verified');
  assert.strictEqual(r.verdict.code, 'kurang');
  assert.strictEqual(r.calculation.gap, 450000);
  assert.ok(r.recommendations.length > 0);
});

test('analyze memberi verdict sesuai saat biaya sudah dipotong 50 persen', () => {
  const r = analyze(base({ actual_fee: 750000 }), NOW);
  assert.strictEqual(r.verdict.code, 'sesuai');
  assert.strictEqual(r.verdict.tone, 'ok');
});

test('analyze memberi verdict lebih saat diskon melebihi perkiraan', () => {
  const r = analyze(base({ actual_fee: 600000 }), NOW);
  assert.strictEqual(r.verdict.code, 'lebih');
});

test('analyze memberi verdict belum berhak saat syarat gagal', () => {
  const r = analyze(base({ scale: 'menengah' }), NOW);
  assert.strictEqual(r.verdict.code, 'belum_berhak');
  assert.ok(r.verdict.detail.indexOf('Skala') !== -1);
});

test('analyze memberi verdict menunggu saat verifikasi berjalan', () => {
  const r = analyze(base({ verified: 'tidak', verified_date: '', application_date: '2026-10-26' }), NOW);
  assert.strictEqual(r.phase.code, 'verifying');
  assert.strictEqual(r.verdict.code, 'menunggu');
});

test('analyze memberi verdict belum mengajukan tanpa pengajuan', () => {
  const r = analyze(base({ verified: 'tidak', verified_date: '', application_date: '' }), NOW);
  assert.strictEqual(r.phase.code, 'no_application');
  assert.strictEqual(r.verdict.code, 'belum_mengajukan');
});

test('analyze memberi verdict belum berlaku sebelum 25 Oktober 2026', () => {
  const r = analyze(base({ period_start: '2026-10-13', period_end: '2026-10-19', application_date: '2026-10-15', verified_date: '' }), new Date(2026, 9, 20));
  assert.strictEqual(r.verdict.code, 'belum_berlaku');
});

test('analyze memberi verdict eskalasi saat lewat batas dan masih kurang', () => {
  const later = new Date(2026, 10, 25);
  const r = analyze(base({ period_end: '2026-11-20', application_date: '2026-10-26', verified_date: '', verified: 'tidak' }), later);
  assert.strictEqual(r.phase.code, 'overdue');
  assert.strictEqual(r.verdict.code, 'eskalasi');
});

test('analyze menyertakan sumber, kebijakan, dan disclaimer', () => {
  const r = analyze(base({}), NOW);
  assert.strictEqual(r.sources.length, SOURCES.length);
  assert.strictEqual(r.policy.discount_min, 50);
  assert.strictEqual(r.policy.effective_date, EFFECTIVE_DATE);
  assert.ok(r.disclaimer.indexOf('bukan nasihat hukum') !== -1);
});

test('validateBase menolak periode tanpa tanggal', () => {
  const r = validateBase(base({ period_start: '' }), NOW);
  assert.ok(r.error.indexOf('Tanggal awal periode') !== -1);
});

test('validateBase menolak akhir periode sebelum awal', () => {
  const r = validateBase(base({ period_start: '2026-11-02', period_end: '2026-10-26' }), NOW);
  assert.ok(r.error.indexOf('tidak boleh sebelum') !== -1);
});

test('validateBase menolak tanggal masa depan', () => {
  const r = validateBase(base({ period_end: '2026-12-01' }), NOW);
  assert.ok(r.error.indexOf('tidak boleh melewati hari ini') !== -1);
});

test('validateBase menolak pengajuan masa depan', () => {
  const r = validateBase(base({ application_date: '2026-12-01' }), NOW);
  assert.ok(r.error.indexOf('Tanggal pengajuan') !== -1);
});

test('validateBase menolak verifikasi sebelum pengajuan', () => {
  const r = validateBase(base({ application_date: '2026-10-30', verified_date: '2026-10-29' }), NOW);
  assert.ok(r.error.indexOf('verifikasi') !== -1);
});

test('validateBase menolak diskon di luar 1 sampai 100', () => {
  assert.ok(validateBase(base({ discount_pct: 0 }), NOW).error);
  assert.ok(validateBase(base({ discount_pct: 101 }), NOW).error);
});

test('validateBase menolak biaya negatif dan tarif tidak masuk akal', () => {
  assert.ok(validateBase(base({ actual_fee: -1 }), NOW).error);
  assert.ok(validateBase(base({ fee_rate: 100 }), NOW).error);
  assert.ok(validateBase(base({ gross_sales: -1 }), NOW).error);
});

test('validateBase menolak dasar kosong tanpa omzet dan tarif', () => {
  const r = validateBase(base({ fee_basis: 0, gross_sales: 0, fee_rate: 0 }), NOW);
  assert.ok(r.error.indexOf('biaya layanan dasar') !== -1);
});

test('validateBase menolak jumlah periode per tahun tidak valid', () => {
  assert.ok(validateBase(base({ periods_per_year: 0 }), NOW).error);
  assert.ok(validateBase(base({ periods_per_year: 1.5 }), NOW).error);
});

test('validateBase menormalkan flag ya dan tidak', () => {
  const data = normalized({ verified: 'tidak', verified_date: '', domestic: 'tidak', high_risk: 'ya' });
  assert.strictEqual(data.verified, 'tidak');
  assert.strictEqual(data.domestic, 'tidak');
  assert.strictEqual(data.high_risk, 'ya');
});

test('validateCase mewajibkan nama toko', () => {
  const r = validateCase(base({ store_name: '' }), NOW);
  assert.ok(r.error.indexOf('Nama toko') !== -1);
});

test('validateCase menghitung ringkasan selisih', () => {
  const r = validateCase(base({}), NOW);
  assert.ok(!r.error, r.error);
  assert.strictEqual(r.item.gap, 450000);
  assert.strictEqual(r.item.expected_fee, 750000);
  assert.strictEqual(r.item.basis, 1500000);
});

test('validateCase menolak follow-up sebelum akhir periode', () => {
  const r = validateCase(base({ followup_date: '2026-10-30' }), NOW);
  assert.ok(r.error.indexOf('follow-up') !== -1);
});

test('validateCase menolak follow-up di masa depan', () => {
  const r = validateCase(base({ followup_date: '2026-12-01' }), NOW);
  assert.ok(r.error.indexOf('follow-up') !== -1);
});

test('summary menghitung kasus terbuka dan total selisih', () => {
  const a = validateCase(base({ status: 'keberatan_dikirim' }), NOW);
  const b = validateCase(base({ status: 'selesai', store_name: 'Toko Selesai' }), NOW);
  const s = summary([
    Object.assign({}, a.item, { id: 'k1' }),
    Object.assign({}, b.item, { id: 'k2' }),
  ], NOW);
  assert.strictEqual(s.total, 2);
  assert.strictEqual(s.open_count, 1);
  assert.strictEqual(s.closed_count, 1);
  assert.strictEqual(s.total_gap, 900000);
  assert.strictEqual(s.open_gap, 450000);
});

test('summary memberi peringatan untuk kasus tua dan follow-up lama', () => {
  const old = validateCase(base({
    status: 'baru',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    application_date: '2026-09-01',
    verified_date: '2026-09-10',
    followup_date: '2026-09-30',
  }), NOW);
  const s = summary([Object.assign({}, old.item, { id: 'k1' })], NOW);
  assert.strictEqual(s.oldest_open_days, 34);
  assert.ok(s.warning_count >= 2);
  assert.ok(s.warnings[0].indexOf('Toko Contoh Lokal') !== -1);
});

test('buildLetter permintaan status mewajibkan tanggal pengajuan', () => {
  const r = buildLetter(base({ application_date: '', verified: 'tidak', verified_date: '', letter_type: 'status' }), NOW);
  assert.ok(r.error.indexOf('Tanggal pengajuan') !== -1);
});

test('buildLetter status menyebut SAPA UMKM dan Kepmen', () => {
  const r = buildLetter(base({ letter_type: 'status' }), NOW);
  assert.ok(!r.error, r.error);
  assert.ok(r.body.indexOf('status verifikasi') !== -1);
  assert.ok(r.body.indexOf('SAPA UMKM') !== -1);
  assert.ok(r.body.indexOf('Keputusan Menteri UMKM Nomor 398 Tahun 2026') !== -1);
});

test('buildLetter keberatan memuat angka perbandingan', () => {
  const r = buildLetter(base({ letter_type: 'keberatan' }), NOW);
  assert.ok(!r.error, r.error);
  assert.ok(r.body.indexOf('Rp 1.500.000') !== -1);
  assert.ok(r.body.indexOf('Rp 750.000') !== -1);
  assert.ok(r.body.indexOf('Rp 1.200.000') !== -1);
  assert.ok(r.body.indexOf('Rp 450.000') !== -1);
});

test('buildLetter eskalasi ditujukan ke Kementerian UMKM', () => {
  const r = buildLetter(base({ letter_type: 'eskalasi' }), NOW);
  assert.ok(!r.error, r.error);
  assert.ok(r.body.indexOf('Kementerian Usaha Mikro, Kecil, dan Menengah') !== -1);
  assert.ok(r.body.indexOf('fasilitasi') !== -1);
});

test('buildLetter memakai fallback nama penjual dan kronologi', () => {
  const r = buildLetter(base({ seller_name: '', chronology: '' }), NOW);
  assert.ok(r.body.indexOf('Pemilik toko') !== -1);
  assert.ok(r.body.indexOf('Saya mencatat selisih biaya layanan ini') !== -1);
});

test('buildExample bisa dianalisis dan menghasilkan selisih konkret', () => {
  const ex = buildExample(NOW);
  const r = analyze(ex, NOW);
  assert.ok(!r.error, r.error);
  assert.strictEqual(r.calculation.basis, 1500000);
  assert.strictEqual(r.calculation.gap, 450000);
  assert.strictEqual(r.verdict.code, 'kurang');
});

test('meta memuat semua pilihan, sumber, dan kebijakan', () => {
  const m = meta(NOW);
  assert.strictEqual(m.platforms.length, PLATFORMS.length);
  assert.strictEqual(m.scales.length, SCALES.length);
  assert.strictEqual(m.yes_no.length, YES_NO.length);
  assert.strictEqual(m.requirements.length, REQUIREMENTS.length);
  assert.strictEqual(m.auto_signals.length, AUTO_SIGNALS.length);
  assert.strictEqual(m.manual_signals.length, MANUAL_SIGNALS.length);
  assert.strictEqual(m.evidence.length, EVIDENCE.length);
  assert.strictEqual(m.case_statuses.length, CASE_STATUSES.length);
  assert.strictEqual(m.letter_types.length, LETTER_TYPES.length);
  assert.strictEqual(m.sources.length, SOURCES.length);
  assert.strictEqual(m.policy.discount_min, DISCOUNT_MIN);
  assert.strictEqual(m.policy.pull_working_days, PULL_WORKING_DAYS);
  assert.strictEqual(m.policy.verify_working_days, VERIFY_WORKING_DAYS);
  assert.strictEqual(m.policy.total_working_days, TOTAL_WORKING_DAYS);
  assert.strictEqual(m.policy.identified_sellers, IDENTIFIED_SELLERS);
  assert.strictEqual(m.policy.service_fee_min, SERVICE_FEE_MIN);
  assert.strictEqual(m.policy.service_fee_max, SERVICE_FEE_MAX);
  assert.strictEqual(m.policy.effective_date, EFFECTIVE_DATE);
  assert.strictEqual(m.policy.kepmen_date, KEPMEN_DATE);
});

test('sumber memuat tanggal, tautan, dan catatan', () => {
  assert.ok(SOURCES.length >= 8);
  SOURCES.forEach((item) => {
    assert.ok(item.title);
    assert.ok(item.publisher);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    assert.ok(/^https:\/\//.test(item.url));
    assert.ok(item.note.length > 20);
  });
});

test('teks library dan halaman tidak memakai em dash', () => {
  const files = [
    path.join(__dirname, '..', 'lib', 'audit.js'),
    path.join(__dirname, '..', 'public', 'index.html'),
  ];
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    assert.strictEqual(source.indexOf('\u2014'), -1, file + ' contains em dash');
  });
});

test('halaman statis memuat semua id yang dipakai script', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const ids = [];
  const seen = new Set();
  let match;
  const re = /id="([^"]+)"/g;
  while ((match = re.exec(html))) {
    assert.ok(!seen.has(match[1]), 'duplicate id: ' + match[1]);
    seen.add(match[1]);
    ids.push(match[1]);
  }
  const script = html.slice(html.indexOf('<script>', html.indexOf('<body')));
  const used = new Set();
  const reUse = /getElementById\('([^']+)'\)/g;
  while ((match = reUse.exec(script))) used.add(match[1]);
  used.forEach((id) => {
    assert.ok(seen.has(id), 'missing element id: ' + id);
  });
  assert.ok(ids.indexOf('theme-btn') !== -1);
  assert.ok(ids.indexOf('calc-btn') !== -1);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
