'use strict';

const assert = require('assert');
const {
  analyze,
  assessRisk,
  buildExample,
  buildLetter,
  caseView,
  computeExposure,
  computeTimeline,
  daysBetween,
  addDays,
  formatDateID,
  formatRupiah,
  getBuyerStatus,
  getCaseStatus,
  getMethod,
  getOrderStatus,
  getLetterType,
  readiness,
  summary,
  todayISO,
  validateCase,
  meta,
  DEFAULTS,
  COD_METHODS,
  ORDER_STATUSES,
  BUYER_STATUSES,
  SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  PROBLEMS,
  LETTER_TYPES,
  PLATFORMS,
  SOURCES,
} = require('../lib/cod');

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

const NOW = new Date(2026, 10, 2);

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    cod_method: 'reguler',
    order_status: 'belum_dikirim',
    buyer_status: 'tidak_merespons',
    order_id: '261026KUHA9AN3',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    product_name: 'Aksesori Rajut Premium',
    seller_name: 'Pemilik Toko',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-001',
    order_date: '2026-10-31',
    ship_deadline: '2026-11-03',
    cancel_requested_date: '2026-11-01',
    return_received_date: '',
    followup_date: '2026-11-01',
    order_value: 185000,
    hpp: 110000,
    packaging_cost: 3000,
    handling_cost: 5000,
    extra_cost: 0,
    shipping_cost: 10000,
    fee_rate: 0,
    problem: 'pembeli_fiktif',
    letter_type: 'pembatalan',
    chronology: 'Pembeli tidak membalas chat konfirmasi alamat.',
    note: 'Contoh.',
    signals: ['cancel_withdrawn', 'buyer_no_response', 'address_change', 'high_value'],
    evidence: ['order_screenshot', 'chat_history', 'cancel_request', 'cs_ticket', 'cancel_withdrawal', 'shipping_deadline', 'timeline'],
  }, overrides || {});
}

test('formatRupiah memakai titik ribuan', () => {
  assert.strictEqual(formatRupiah(185000), 'Rp 185.000');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
});

test('formatDateID memakai nama bulan Indonesia', () => {
  assert.strictEqual(formatDateID('2026-11-02'), '2 November 2026');
  assert.strictEqual(formatDateID(''), '-');
});

test('daysBetween menghitung selisih hari kalender', () => {
  assert.strictEqual(daysBetween('2026-10-31', '2026-11-02'), 2);
  assert.strictEqual(daysBetween('2026-11-02', '2026-10-31'), -2);
  assert.strictEqual(daysBetween('2026-02-30', '2026-03-01'), null);
});

test('addDays melewati batas bulan', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(addDays('2026-11-01', 7), '2026-11-08');
});

test('computeExposure menghitung laba dan kerugian retur', () => {
  const e = computeExposure(base());
  assert.strictEqual(e.success_net, 67000);
  assert.strictEqual(e.margin_pct, 36.2);
  assert.strictEqual(e.return_good_loss, 8000);
  assert.strictEqual(e.return_damaged_gross, 118000);
  assert.strictEqual(e.max_claim, 100000);
  assert.strictEqual(e.return_damaged_net, 18000);
  assert.strictEqual(e.worst_case, 18000);
  assert.strictEqual(e.over_limit, false);
});

test('computeExposure memakai biaya layanan bila diisi', () => {
  const e = computeExposure(base({ fee_rate: 10 }));
  assert.strictEqual(e.fee_amount, 18500);
  assert.strictEqual(e.success_net, 48500);
});

test('computeExposure layanan instant memakai batas klaim harga barang', () => {
  const e = computeExposure(base({ cod_method: 'instant', order_value: 400000, shipping_cost: 10000 }));
  assert.strictEqual(e.max_claim, 400000);
  assert.strictEqual(e.return_damaged_net, 0);
  assert.strictEqual(e.max_payment, 500000);
});

test('computeExposure menandai pesanan di atas batas COD instant', () => {
  const e = computeExposure(base({ cod_method: 'instant', order_value: 600000 }));
  assert.strictEqual(e.over_limit, true);
  assert.strictEqual(e.max_payment, 500000);
});

test('computeExposure Pos Reguler memakai batas Rp 1.000.000', () => {
  const e = computeExposure(base({ cod_method: 'pos_reguler', order_value: 2000000, shipping_cost: 15000 }));
  assert.strictEqual(e.max_claim, 150000);
  assert.strictEqual(e.max_payment, 1000000);
  assert.strictEqual(e.over_limit, true);
});

test('computeExposure tidak menghitung ongkir sebagai kerugian otomatis', () => {
  const e = computeExposure(base({ shipping_cost: 50000 }));
  assert.strictEqual(e.return_good_loss, 8000);
  assert.strictEqual(e.return_damaged_gross, 118000);
});

test('computeTimeline fase sebelum tenggat', () => {
  const t = computeTimeline(base({ ship_deadline: '2026-11-07', cancel_requested_date: '' }), NOW);
  assert.strictEqual(t.days_to_ship, 5);
  assert.strictEqual(t.ship_phase, 'sebelum');
  assert.strictEqual(t.tone, 'signal');
  assert.strictEqual(t.cancel, null);
});

test('computeTimeline fase mendesak besok', () => {
  const t = computeTimeline(base({ ship_deadline: '2026-11-03', cancel_requested_date: '' }), NOW);
  assert.strictEqual(t.days_to_ship, 1);
  assert.strictEqual(t.ship_phase, 'mendesak');
  assert.strictEqual(t.tone, 'ember');
});

test('computeTimeline fase mendesak hari ini', () => {
  const t = computeTimeline(base({ ship_deadline: '2026-11-02', cancel_requested_date: '' }), NOW);
  assert.strictEqual(t.days_to_ship, 0);
  assert.strictEqual(t.ship_label, 'Batas waktu hari ini');
});

test('computeTimeline fase lewat', () => {
  const t = computeTimeline(base({ ship_deadline: '2026-11-01', cancel_requested_date: '' }), NOW);
  assert.strictEqual(t.days_to_ship, -1);
  assert.strictEqual(t.ship_phase, 'lewat');
  assert.ok(t.action.indexOf('sudah lewat') !== -1);
});

test('computeTimeline status sudah diatur pengirimannya', () => {
  const t = computeTimeline(base({ order_status: 'sudah_dikirim', cancel_requested_date: '' }), NOW);
  assert.strictEqual(t.ship_phase, 'diatur');
  assert.ok(t.action.indexOf('Jangan menerima pembatalan') !== -1);
});

test('computeTimeline status retur', () => {
  const t = computeTimeline(base({ order_status: 'retur', cancel_requested_date: '', return_received_date: '2026-11-01' }), NOW);
  assert.strictEqual(t.ship_phase, 'retur');
  assert.ok(t.claim);
  assert.strictEqual(t.claim.deadline, '2026-11-08');
  assert.strictEqual(t.claim.days_left, 6);
});

test('computeTimeline batas respons pembatalan 1x24 jam', () => {
  const t = computeTimeline(base({ cancel_requested_date: '2026-11-01' }), NOW);
  assert.ok(t.cancel);
  assert.strictEqual(t.cancel.deadline, '2026-11-02');
  assert.strictEqual(t.cancel.days_left, 0);
  assert.strictEqual(t.cancel.phase, 'mendesak');
});

test('computeTimeline batas respons pembatalan lewat', () => {
  const t = computeTimeline(base({ cancel_requested_date: '2026-10-31' }), NOW);
  assert.strictEqual(t.cancel.phase, 'lewat');
  assert.strictEqual(t.cancel.tone, 'ember');
});

test('computeTimeline batas klaim retur 7 hari', () => {
  const t = computeTimeline(base({ order_status: 'retur', cancel_requested_date: '', return_received_date: '2026-10-25' }), NOW);
  assert.strictEqual(t.claim.deadline, '2026-11-01');
  assert.strictEqual(t.claim.phase, 'lewat');
});

test('assessRisk menjumlah bobot sinyal dan status pembeli', () => {
  const r = assessRisk(['cancel_withdrawn', 'buyer_no_response', 'address_change', 'high_value'], 'tidak_merespons');
  assert.strictEqual(r.score, 47);
  assert.strictEqual(r.level, 'tinggi');
  assert.strictEqual(r.tone, 'ember');
  assert.strictEqual(r.count, 4);
});

test('assessRisk kosong menghasilkan skor nol', () => {
  const r = assessRisk([], 'responsif');
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.level, 'rendah');
  assert.strictEqual(r.count, 0);
});

test('assessRisk menambah bobot status pembeli bila sinyal belum dicentang', () => {
  const r = assessRisk([], 'tidak_merespons');
  assert.strictEqual(r.score, 15);
  assert.strictEqual(r.level, 'rendah');
});

test('assessRisk membatasi skor maksimal 100', () => {
  const r = assessRisk(SIGNALS.map((item) => item.id), 'menolak');
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.level, 'sangat_tinggi');
});

test('assessRisk mengabaikan duplikat dan id asing', () => {
  const r = assessRisk(['high_value', 'high_value', 'tidak_ada'], 'responsif');
  assert.strictEqual(r.score, 6);
  assert.strictEqual(r.count, 1);
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
  const r = readiness({ items: ['order_screenshot'] });
  assert.strictEqual(r.score, 11);
  assert.strictEqual(r.verdict, 'kurang');
  assert.strictEqual(r.available_count, 1);
});

test('analyze contoh menghasilkan verdict tahan dan angka benar', () => {
  const result = analyze(buildExample(NOW), NOW);
  assert.ok(!result.error);
  assert.strictEqual(result.risk.score, 47);
  assert.strictEqual(result.exposure.success_net, 67000);
  assert.strictEqual(result.exposure.worst_case, 18000);
  assert.strictEqual(result.verdict.code, 'tahan');
  assert.strictEqual(result.timeline.ship_phase, 'mendesak');
  assert.ok(result.recommendations.length >= 6);
  assert.ok(result.sources.length >= 6);
});

test('analyze risiko rendah memberi verdict kirim', () => {
  const result = analyze(base({ buyer_status: 'responsif', signals: [], cancel_requested_date: '', followup_date: '' }), NOW);
  assert.strictEqual(result.risk.score, 0);
  assert.strictEqual(result.verdict.code, 'kirim');
});

test('analyze pesanan di atas batas COD memberi verdict batas_cod', () => {
  const result = analyze(base({ cod_method: 'instant', order_value: 600000 }), NOW);
  assert.strictEqual(result.verdict.code, 'batas_cod');
  assert.strictEqual(result.verdict.tone, 'ember');
});

test('analyze status retur memberi verdict klaim', () => {
  const result = analyze(base({ order_status: 'retur', cancel_requested_date: '', return_received_date: '2026-11-01' }), NOW);
  assert.strictEqual(result.verdict.code, 'klaim');
  assert.strictEqual(result.verdict.tone, 'ember');
});

test('analyze menolak nilai pesanan nol', () => {
  const result = analyze(base({ order_value: 0 }), NOW);
  assert.ok(result.error.indexOf('Nilai pesanan') !== -1);
});

test('analyze menolak tanggal pesanan tidak valid', () => {
  const result = analyze(base({ order_date: '2026-02-30' }), NOW);
  assert.ok(result.error.indexOf('Tanggal pesanan') !== -1);
});

test('analyze menolak tenggat kirim sebelum tanggal pesanan', () => {
  const result = analyze(base({ ship_deadline: '2026-10-30' }), NOW);
  assert.ok(result.error.indexOf('tidak boleh sebelum') !== -1);
});

test('analyze menolak pembatalan sebelum tanggal pesanan', () => {
  const result = analyze(base({ cancel_requested_date: '2026-10-30' }), NOW);
  assert.ok(result.error.indexOf('Tanggal pembatalan') !== -1);
});

test('analyze menolak biaya layanan 100 persen', () => {
  const result = analyze(base({ fee_rate: 100 }), NOW);
  assert.ok(result.error.indexOf('Biaya layanan') !== -1);
});

test('analyze tidak memakai em dash pada teks', () => {
  const result = analyze(base(), NOW);
  assert.strictEqual(JSON.stringify(result).indexOf('\u2014'), -1);
});

test('buildLetter mewajibkan nama toko', () => {
  const result = buildLetter(base({ store_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama toko') !== -1);
});

test('buildLetter mewajibkan nomor pesanan', () => {
  const result = buildLetter(base({ order_id: '' }), NOW);
  assert.ok(result.error.indexOf('Nomor pesanan') !== -1);
});

test('buildLetter mewajibkan nama produk', () => {
  const result = buildLetter(base({ product_name: '' }), NOW);
  assert.ok(result.error.indexOf('Nama produk') !== -1);
});

test('buildLetter pembatalan memuat nomor pesanan dan tenggat', () => {
  const result = buildLetter(base(), NOW);
  assert.ok(result.subject.indexOf('pembatalan') !== -1);
  assert.ok(result.body.indexOf('261026KUHA9AN3') !== -1);
  assert.ok(result.body.indexOf('1x24 jam') !== -1);
  assert.ok(result.body.indexOf('Rp 18.000') !== -1);
});

test('buildLetter klaim retur memuat batas klaim dan 7 hari', () => {
  const result = buildLetter(base({ letter_type: 'klaim_retur', order_status: 'retur', return_received_date: '2026-11-01' }), NOW);
  assert.ok(result.subject.indexOf('klaim') !== -1);
  assert.ok(result.body.indexOf('Rp 100.000') !== -1);
  assert.ok(result.body.indexOf('7 hari kalender') !== -1);
});

test('buildLetter peninjauan pembeli memuat ketentuan pembatalan berulang', () => {
  const result = buildLetter(base({ letter_type: 'peninjauan_pembeli' }), NOW);
  assert.ok(result.subject.indexOf('peninjauan') !== -1);
  assert.ok(result.body.indexOf('2 kali dalam 60 hari') !== -1);
});

test('buildExample menghasilkan payload yang valid', () => {
  const example = buildExample(NOW);
  const result = analyze(example, NOW);
  assert.ok(!result.error);
  assert.strictEqual(result.order_id, '261026KUHA9AN3');
  assert.strictEqual(result.exposure.order_value, 185000);
});

test('validateCase mewajibkan nomor pesanan', () => {
  const result = validateCase(base({ order_id: '' }), NOW);
  assert.ok(result.error.indexOf('Nomor pesanan') !== -1);
});

test('validateCase mengembalikan item dengan status', () => {
  const result = validateCase(base({ case_status: 'menunggu_cs' }), NOW);
  assert.ok(!result.error);
  assert.strictEqual(result.item.status, 'menunggu_cs');
  assert.strictEqual(result.item.order_id, '261026KUHA9AN3');
});

test('caseView menandai tenggat kirim mendesak', () => {
  const item = Object.assign(validateCase(base(), NOW).item, { id: 'k1' });
  const view = caseView(item, NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('Tenggat kirim') !== -1));
  assert.strictEqual(view.open, true);
});

test('caseView menandai retur tanpa bukti unboxing', () => {
  const item = Object.assign(validateCase(base({ order_status: 'retur', cancel_requested_date: '', return_received_date: '2026-11-01', evidence: ['order_screenshot'] }), NOW).item, { id: 'k1' });
  const view = caseView(item, NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('video unboxing') !== -1));
});

test('caseView menandai batas pembatalan lewat', () => {
  const item = Object.assign(validateCase(base({ cancel_requested_date: '2026-10-31' }), NOW).item, { id: 'k1' });
  const view = caseView(item, NOW);
  assert.ok(view.flags.some((flag) => flag.indexOf('Batas respons pembatalan') !== -1));
});

test('summary menjumlahkan nilai dan kerugian terburuk', () => {
  const one = Object.assign(validateCase(base(), NOW).item, { id: 'k1' });
  const two = Object.assign(validateCase(base({ order_id: 'KEDUA', order_value: 100000, hpp: 50000, shipping_cost: 5000, status: 'selesai' }), NOW).item, { id: 'k2' });
  const s = summary([one, two], NOW);
  assert.strictEqual(s.total_cases, 2);
  assert.strictEqual(s.total_order_value, 285000);
  assert.strictEqual(s.risky_cases, 2);
  assert.strictEqual(s.nearest_ship_days, 1);
});

test('summary tanpa kasus tetap aman', () => {
  const s = summary([], NOW);
  assert.strictEqual(s.total_cases, 0);
  assert.strictEqual(s.nearest_ship_days, null);
  assert.strictEqual(s.nearest_cancel_days, null);
});

test('meta memuat semua daftar yang dipakai UI', () => {
  const m = meta();
  assert.strictEqual(m.platforms.length, PLATFORMS.length);
  assert.strictEqual(m.cod_methods.length, COD_METHODS.length);
  assert.strictEqual(m.order_statuses.length, ORDER_STATUSES.length);
  assert.strictEqual(m.buyer_statuses.length, BUYER_STATUSES.length);
  assert.strictEqual(m.signals.length, SIGNALS.length);
  assert.strictEqual(m.evidence.length, EVIDENCE.length);
  assert.strictEqual(m.case_statuses.length, CASE_STATUSES.length);
  assert.strictEqual(m.problems.length, PROBLEMS.length);
  assert.strictEqual(m.letter_types.length, LETTER_TYPES.length);
  assert.ok(m.sources.length >= 6);
  assert.strictEqual(m.defaults.platform, DEFAULTS.platform);
});

test('getMethod, getStatus, dan getLetterType memakai fallback aman', () => {
  assert.strictEqual(getMethod('tidak_ada').id, 'reguler');
  assert.strictEqual(getOrderStatus('tidak_ada').id, 'belum_dikirim');
  assert.strictEqual(getBuyerStatus('tidak_ada').id, 'belum_dihubungi');
  assert.strictEqual(getCaseStatus('tidak_ada').id, 'baru');
  assert.strictEqual(getLetterType('tidak_ada').id, 'pembatalan');
});

test('todayISO memakai tanggal lokal', () => {
  assert.strictEqual(todayISO(NOW), '2026-11-02');
});

console.log('');
console.log(passed + ' lulus, ' + failed + ' gagal');
if (failed > 0) process.exit(1);
