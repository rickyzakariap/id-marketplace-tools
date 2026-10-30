'use strict';

const assert = require('assert');
const {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computePpn,
  computeTimeline,
  currentPeriod,
  periodBounds,
  readiness,
  summary,
  validateCase,
  addDays,
  daysBetween,
  formatDateID,
  formatPeriodID,
  formatRupiah,
  meta,
  DEFAULTS,
  DOC_TYPES,
  EVIDENCE,
  FEE_TYPES,
  PROBLEMS,
  PLATFORMS,
  SOURCES,
  CASE_STATUSES,
} = require('../lib/faktur');

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

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    period: '2026-10',
    invoice_received: 'tidak',
    includes_ppn: 'tidak',
    ppn_rate: 11,
    fees: { layanan: 1000000, affiliate: 0, iklan: 0, promo: 0, logistik: 0 },
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko',
    npwp: '00.000.000.0-000.000',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-001',
    problem: 'belum_terbit',
    chronology: 'Faktur belum muncul saat dicek tanggal 12.',
    evidence: ['nama', 'nik_npwp', 'alamat', 'email', 'cocok'],
  }, overrides || {});
}

test('periodBounds menghitung akhir bulan dan jadwal bulan berikutnya', () => {
  const b = periodBounds('2026-10');
  assert.strictEqual(b.start, '2026-10-01');
  assert.strictEqual(b.end, '2026-10-31');
  assert.strictEqual(b.availability, '2026-11-12');
  assert.strictEqual(b.complaint, '2026-11-15');
  assert.strictEqual(b.last_day, 31);
});

test('periodBounds menangani Februari kabisat', () => {
  const b = periodBounds('2028-02');
  assert.strictEqual(b.end, '2028-02-29');
  assert.strictEqual(b.availability, '2028-03-12');
  assert.strictEqual(b.complaint, '2028-03-15');
});

test('periodBounds menolak periode tidak valid', () => {
  assert.strictEqual(periodBounds('2026-13'), null);
  assert.strictEqual(periodBounds('2026-1'), null);
  assert.strictEqual(periodBounds(''), null);
});

test('currentPeriod memakai bulan lokal', () => {
  assert.strictEqual(currentPeriod(new Date(2026, 9, 30)), '2026-10');
  assert.strictEqual(currentPeriod(new Date(2026, 0, 1)), '2026-01');
});

test('timeline fase siapkan sebelum akhir periode', () => {
  const t = computeTimeline(base({ period: '2026-10' }), new Date(2026, 9, 30));
  assert.strictEqual(t.phase, 'siapkan');
  assert.strictEqual(t.days_to_end, 1);
  assert.strictEqual(t.days_to_availability, 13);
});

test('timeline fase menunggu setelah periode berakhir', () => {
  const t = computeTimeline(base({ period: '2026-10' }), new Date(2026, 10, 1));
  assert.strictEqual(t.phase, 'menunggu');
  assert.strictEqual(t.days_to_availability, 11);
});

test('timeline fase cek mulai tanggal 12', () => {
  const t = computeTimeline(base({ period: '2026-10' }), new Date(2026, 10, 12));
  assert.strictEqual(t.phase, 'cek');
  assert.strictEqual(t.days_to_complaint, 3);
});

test('timeline fase cek sampai tanggal 15', () => {
  const t = computeTimeline(base({ period: '2026-10' }), new Date(2026, 10, 15));
  assert.strictEqual(t.phase, 'cek');
  assert.strictEqual(t.days_to_complaint, 0);
});

test('timeline fase lewat setelah tanggal 15', () => {
  const t = computeTimeline(base({ period: '2026-10' }), new Date(2026, 10, 16));
  assert.strictEqual(t.phase, 'lewat');
  assert.strictEqual(t.days_to_complaint, -1);
});

test('timeline fase tersedia bila faktur sudah diterima', () => {
  const t = computeTimeline(base({ period: '2026-10', invoice_received: 'ya' }), new Date(2026, 10, 20));
  assert.strictEqual(t.phase, 'tersedia');
  assert.strictEqual(t.tone, 'ok');
});

test('PPN dihitung dari nilai belum termasuk PPN', () => {
  const p = computePpn(base());
  assert.strictEqual(p.total, 1000000);
  assert.strictEqual(p.dpp, 1000000);
  assert.strictEqual(p.ppn, 110000);
  assert.strictEqual(p.total_with_ppn, 1110000);
});

test('PPN dihitung dari nilai sudah termasuk PPN', () => {
  const p = computePpn(base({ includes_ppn: 'ya', fees: { layanan: 1110000 } }));
  assert.strictEqual(p.total, 1110000);
  assert.strictEqual(p.dpp, 1000000);
  assert.strictEqual(p.ppn, 110000);
  assert.strictEqual(p.total_with_ppn, 1110000);
});

test('tarif PPN bisa diubah', () => {
  const p = computePpn(base({ ppn_rate: 12 }));
  assert.strictEqual(p.ppn, 120000);
});

test('semua jenis biaya dijumlahkan', () => {
  const p = computePpn(base({ fees: { layanan: 100000, affiliate: 200000, iklan: 300000, promo: 400000, logistik: 500000 } }));
  assert.strictEqual(p.total, 1500000);
  assert.strictEqual(p.ppn, 165000);
});

test('analyze menolak periode kosong', () => {
  const r = analyze(base({ period: '' }), new Date(2026, 9, 30));
  assert.ok(r.error);
});

test('analyze menolak tarif PPN di luar rentang', () => {
  assert.ok(analyze(base({ ppn_rate: 0 }), new Date(2026, 9, 30)).error);
  assert.ok(analyze(base({ ppn_rate: 101 }), new Date(2026, 9, 30)).error);
});

test('analyze mengembalikan timeline, ppn, dokumen, dan sumber', () => {
  const r = analyze(base(), new Date(2026, 10, 13));
  assert.strictEqual(r.platform, 'shopee');
  assert.strictEqual(r.timeline.phase, 'cek');
  assert.strictEqual(r.ppn.ppn, 110000);
  assert.strictEqual(r.documents.length, 3);
  assert.ok(r.sources.length >= 5);
  assert.ok(r.recommendations.length >= 3);
  assert.ok(r.disclaimer.indexOf('bukan nasihat pajak') !== -1);
});

test('analyze memakai bukti yang dikirim di body', () => {
  const r = analyze(base({ evidence: ['nama', 'nik_npwp', 'alamat', 'email', 'cocok'] }), new Date(2026, 10, 13));
  assert.strictEqual(r.readiness.available_count, 5);
  assert.strictEqual(r.readiness.missing_critical.length, 0);
});

test('kesiapan data menghitung lima data kritis', () => {
  const r = readiness({ items: ['nama', 'nik_npwp', 'alamat', 'email', 'cocok'] });
  assert.strictEqual(r.available_count, 5);
  assert.strictEqual(r.missing_critical.length, 0);
  assert.strictEqual(r.score, 42);
  assert.strictEqual(r.verdict, 'hampir');
});

test('kesiapan data penuh mendapat nilai 100 dan siap', () => {
  const r = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.verdict, 'siap');
  assert.strictEqual(r.ready, true);
});

test('kesiapan data tanpa kritis berstatus kurang', () => {
  const r = readiness({ items: [] });
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.verdict, 'kurang');
  assert.strictEqual(r.missing_critical.length, 5);
});

test('validateCase menolak nama toko kosong', () => {
  assert.ok(validateCase(base({ store_name: '' }), new Date(2026, 9, 30)).error);
});

test('validateCase menyimpan status dan menghitung nominal', () => {
  const r = validateCase(base({ status: 'tidak_ada', received_date: '' }), new Date(2026, 9, 30));
  assert.strictEqual(r.error, undefined);
  assert.strictEqual(r.item.status, 'tidak_ada');
  assert.strictEqual(r.item.period, '2026-10');
  assert.strictEqual(r.item.fee_total, 1000000);
  assert.strictEqual(r.item.ppn_amount, 110000);
  assert.strictEqual(r.item.fees.layanan, 1000000);
  assert.strictEqual(r.item.ppn_rate, 11);
  assert.strictEqual(r.item.received_date, '');
});

test('validateCase menolak tanggal terima yang tidak valid', () => {
  const r = validateCase(base({ received_date: '2026-02-30' }), new Date(2026, 9, 30));
  assert.ok(r.error);
});

test('caseView menandai periode lama yang belum dilaporkan', () => {
  const view = caseView(base({ period: '2026-09', status: 'menunggu' }), new Date(2026, 9, 30));
  assert.strictEqual(view.timeline.phase, 'lewat');
  assert.ok(view.flags.some((f) => f.indexOf('Tenggat lapor') !== -1));
  assert.strictEqual(view.open, true);
});

test('caseView menandai periode berjalan yang belum punya faktur', () => {
  const view = caseView(base({ period: '2026-10', status: 'tidak_ada' }), new Date(2026, 9, 30));
  assert.strictEqual(view.timeline.phase, 'siapkan');
  assert.ok(view.flags.some((f) => f.indexOf('Periode masih berjalan') !== -1));
});

test('summary menghitung kasus terbuka, hilang, dan total PPN', () => {
  const cases = [
    { id: 'f1', platform: 'shopee', period: '2026-09', store_name: 'Toko A', status: 'tidak_ada', fees: { layanan: 100000 }, ppn_rate: 11 },
    { id: 'f2', platform: 'shopee', period: '2026-10', store_name: 'Toko A', status: 'menunggu', fees: { layanan: 200000 }, ppn_rate: 11 },
    { id: 'f3', platform: 'shopee', period: '2026-08', store_name: 'Toko A', status: 'tersedia', fees: { layanan: 300000 }, ppn_rate: 11 },
  ];
  const s = summary(cases, new Date(2026, 9, 30));
  assert.strictEqual(s.total_cases, 3);
  assert.strictEqual(s.open_cases, 2);
  assert.strictEqual(s.missing_cases, 1);
  assert.strictEqual(s.available_cases, 1);
  assert.strictEqual(s.total_fee, 600000);
  assert.strictEqual(s.total_ppn, 66000);
});

test('surat memuat periode, tenggat, dan pemisahan dokumen', () => {
  const r = buildLetter(base({ problem: 'data_salah' }), new Date(2026, 10, 13));
  assert.strictEqual(r.error, undefined);
  assert.ok(r.subject.indexOf('Oktober 2026') !== -1);
  assert.ok(r.body.indexOf('12 November 2026') !== -1);
  assert.ok(r.body.indexOf('15 November 2026') !== -1);
  assert.ok(r.body.indexOf('faktur pajak') !== -1);
  assert.ok(r.body.indexOf('PPh Pasal 22') !== -1);
  assert.ok(r.body.indexOf('data_salah') === -1);
  assert.ok(r.body.indexOf('Nama, NPWP, atau alamat') !== -1);
});

test('surat menolak tanpa nama toko', () => {
  assert.ok(buildLetter(base({ store_name: '' }), new Date(2026, 10, 13)).error);
});

test('contoh memakai periode sebelumnya dan bukti', () => {
  const ex = buildExample(new Date(2026, 9, 30));
  assert.strictEqual(ex.period, '2026-09');
  assert.ok(ex.evidence.length >= 5);
  assert.strictEqual(ex.platform, 'shopee');
});

test('meta memuat jadwal, default, dan sumber', () => {
  const m = meta();
  assert.strictEqual(m.ppn_default_rate, 11);
  assert.strictEqual(m.schedule.availability, 'tanggal 12 bulan berikutnya');
  assert.ok(m.sources.length >= 5);
  assert.strictEqual(m.platforms.length, PLATFORMS.length);
  assert.strictEqual(m.doc_types.length, DOC_TYPES.length);
});

test('format tanggal dan rupiah mengikuti gaya Indonesia', () => {
  assert.strictEqual(formatDateID('2026-11-12'), '12 November 2026');
  assert.strictEqual(formatPeriodID('2026-10'), 'Oktober 2026');
  assert.strictEqual(formatRupiah(1234567), 'Rp 1.234.567');
});

test('addDays dan daysBetween konsisten melewati pergantian bulan', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(daysBetween('2026-10-30', '2026-11-15'), 16);
});

test('tidak ada em dash di sumber atau teks meta', () => {
  const text = JSON.stringify(meta()) + JSON.stringify(SOURCES);
  assert.strictEqual(text.indexOf('\u2014'), -1);
});

test('default memakai tarif 11 dan status belum dicek', () => {
  assert.strictEqual(DEFAULTS.ppn_rate, 11);
  assert.strictEqual(DEFAULTS.invoice_received, 'belum');
});

test('konstanta dokumen menjelaskan perbedaan PPN dan PPh 22', () => {
  const pajak = DOC_TYPES.find((d) => d.id === 'faktur_pajak');
  const pph = DOC_TYPES.find((d) => d.id === 'bukti_pph22');
  assert.ok(pajak.not_same.indexOf('PPh 22') !== -1);
  assert.ok(pph.not_same.indexOf('faktur pajak') !== -1);
  assert.ok(pph.content.indexOf('0,5%') !== -1);
});

test('jenis biaya mencakup tiga kategori yang diumumkan Shopee', () => {
  const announced = FEE_TYPES.filter((f) => f.announced).map((f) => f.id);
  assert.deepStrictEqual(announced, ['layanan', 'affiliate', 'iklan']);
});

test('status dan masalah kasus tersedia', () => {
  assert.ok(CASE_STATUSES.length >= 5);
  assert.ok(PROBLEMS.length >= 3);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
