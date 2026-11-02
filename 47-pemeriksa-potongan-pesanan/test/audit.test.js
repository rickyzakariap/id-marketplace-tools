'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  analyze,
  computeTotals,
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
  daysBetween,
  PLATFORMS,
  ORDER_STATES,
  RETURN_CAUSES,
  SHIPPING_POLICIES,
  AUTO_SIGNALS,
  MANUAL_SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  PROCESSING_FEE,
  DYNAMIC_CAP,
  BUYER_RETURN_CONTRIBUTION,
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

const NOW = new Date(2026, 10, 2);

function base(overrides) {
  return Object.assign({
    platform: 'tiktok',
    order_state: 'batal_setelah_kirim',
    return_cause: 'pembeli',
    shipping_policy: 'grace',
    order_id: '586224247341024870',
    product_name: 'Masker Kain Premium',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-001',
    order_date: '2026-10-26',
    settlement_date: '2026-10-30',
    followup_date: '2026-11-01',
    unit_price: 150000,
    discount_per_unit: 0,
    qty: 2,
    platform_rate: 8,
    dynamic_rate: 4,
    shipping_per_direction: 12000,
    shipping_directions: 1,
    buyer_shipping_paid: 12000,
    refund_to_buyer: 300000,
    actual_commission: 36000,
    actual_processing: 1250,
    actual_shipping: 24000,
    actual_other: 0,
    orders_per_month: 12,
    chronology: 'Pembeli membatalkan pesanan setelah paket dikirim.',
    note: 'Contoh.',
    status: 'baru',
    letter_type: 'keberatan',
    manual_signals: ['rincian_tidak_diminta', 'cs_hanya_template'],
    evidence: ['settlement_detail', 'order_detail', 'refund_proof', 'rate_card', 'chat_history', 'ticket_number', 'buyer_shipping_paid', 'timeline'],
  }, overrides || {});
}

test('formatRupiah memakai titik ribuan', () => {
  assert.strictEqual(formatRupiah(61250), 'Rp 61.250');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
  assert.strictEqual(formatRupiah(-61250), 'Rp -61.250');
});

test('formatDateID memakai nama bulan Indonesia', () => {
  assert.strictEqual(formatDateID('2026-11-02'), '2 November 2026');
  assert.strictEqual(formatDateID(''), '-');
});

test('daysBetween menghitung selisih hari kalender', () => {
  assert.strictEqual(daysBetween('2026-10-26', '2026-11-02'), 7);
  assert.strictEqual(daysBetween('2026-11-02', '2026-10-26'), -7);
  assert.strictEqual(daysBetween('2026-02-30', '2026-03-01'), null);
});

test('addDays melewati batas bulan dan tahun', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(addDays('2026-11-01', 7), '2026-11-08');
});

test('todayISO memakai tanggal lokal', () => {
  assert.strictEqual(todayISO(NOW), '2026-11-02');
});

test('parseISO menolak tanggal yang tidak ada', () => {
  assert.strictEqual(parseISO('2026-02-30'), null);
  assert.strictEqual(parseISO('2026-13-01'), null);
  assert.strictEqual(parseISO('2026-11-02'), '2026-11-02');
});

test('contoh menghasilkan nilai produk dan refund yang konsisten', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.base, 300000);
  assert.strictEqual(r.calculation.refund_to_buyer, 300000);
  assert.strictEqual(r.calculation.buyer_shipping_paid, 12000);
});

test('contoh menghitung komisi platform dan dinamis', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.platform_commission, 24000);
  assert.strictEqual(r.calculation.dynamic_uncapped, 12000);
  assert.strictEqual(r.calculation.dynamic_capped, 12000);
  assert.strictEqual(r.calculation.expected_commission, 36000);
});

test('contoh menghitung biaya pemrosesan hanya saat terkirim', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.expected_processing, PROCESSING_FEE);
  assert.strictEqual(r.calculation.actual_processing, 1250);
});

test('contoh menghitung ongkir perkiraan nol karena masa tenggang', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.expected_shipping, 0);
  assert.strictEqual(r.calculation.actual_shipping, 24000);
});

test('contoh menghitung total perkiraan dan aktual', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.expected_total, 37250);
  assert.strictEqual(r.calculation.actual_total, 61250);
  assert.strictEqual(r.calculation.overcharge, 24000);
  assert.strictEqual(r.calculation.overcharge_pct, 64.4);
});

test('contoh menghitung dana bersih dan kebocoran bulanan', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.calculation.estimated_settlement, -61250);
  assert.strictEqual(r.calculation.monthly_leak, 288000);
});

test('contoh menghasilkan indikasi kuat dan verdict keberatan', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.risk.score, 83);
  assert.strictEqual(r.risk.level, 'tinggi');
  assert.strictEqual(r.verdict.code, 'keberatan');
});

test('contoh menilai kesiapan bukti hampir siap', () => {
  const r = analyze(buildExample(NOW), NOW);
  assert.strictEqual(r.readiness.score, 67);
  assert.strictEqual(r.readiness.verdict, 'hampir');
  assert.strictEqual(r.readiness.missing_critical.length, 1);
});

test('pesanan batal sebelum kirim tidak mengharapkan komisi atau biaya', () => {
  const r = analyze(base({
    order_state: 'batal_sebelum_kirim',
    return_cause: 'tidak_ada',
    actual_shipping: 0,
  }), NOW);
  assert.strictEqual(r.calculation.shipped, false);
  assert.strictEqual(r.calculation.expected_commission, 0);
  assert.strictEqual(r.calculation.expected_processing, 0);
  assert.strictEqual(r.calculation.expected_shipping, 0);
  assert.strictEqual(r.calculation.expected_total, 0);
});

test('pesanan batal sebelum kirim menandai komisi dan biaya pemrosesan', () => {
  const input = base({
    order_state: 'batal_sebelum_kirim',
    return_cause: 'tidak_ada',
    actual_shipping: 0,
  });
  const r = analyze(input, NOW);
  const checked = validateBase(input, NOW);
  assert.deepStrictEqual(detectSignals(checked.data, r.calculation), [
    'batal_tanpa_kirim_komisi',
    'batal_tanpa_kirim_proses',
    'komisi_lebih_tarif',
    'selisih_besar',
    'settlement_negatif',
  ]);
  assert.strictEqual(r.calculation.overcharge, 37250);
  assert.strictEqual(r.calculation.overcharge_pct, 100);
});

test('komisi dinamis dibatasi Rp 650.000 per unit', () => {
  const r = analyze(base({
    unit_price: 10000000,
    qty: 1,
    dynamic_rate: 8,
    actual_commission: 1600000,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(DYNAMIC_CAP, 650000);
  assert.strictEqual(r.calculation.dynamic_uncapped, 800000);
  assert.strictEqual(r.calculation.dynamic_capped, 650000);
  assert.strictEqual(r.calculation.expected_commission, 1450000);
});

test('batas komisi dinamis dikali jumlah unit', () => {
  const r = analyze(base({
    unit_price: 10000000,
    qty: 2,
    dynamic_rate: 8,
    actual_commission: 0,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.dynamic_cap, 650000);
  assert.strictEqual(r.calculation.dynamic_capped, 1300000);
});

test('retur kesalahan pembeli masa tenggang tidak mengharapkan ongkir', () => {
  const r = analyze(base({
    order_state: 'retur_setelah_kirim',
    shipping_policy: 'grace',
    actual_shipping: 0,
    actual_commission: 36000,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.expected_shipping, 0);
});

test('retur kesalahan pembeli kontribusi lima ribu per arah', () => {
  const r = analyze(base({
    order_state: 'retur_setelah_kirim',
    shipping_policy: 'kontribusi_5rb',
    unit_price: 250000,
    discount_per_unit: 10000,
    qty: 1,
    platform_rate: 6.5,
    dynamic_rate: 3,
    shipping_per_direction: 18000,
    shipping_directions: 2,
    buyer_shipping_paid: 18000,
    refund_to_buyer: 240000,
    actual_commission: 22800,
    actual_shipping: 36000,
    orders_per_month: 4,
  }), NOW);
  assert.strictEqual(BUYER_RETURN_CONTRIBUTION, 5000);
  assert.strictEqual(r.calculation.expected_shipping, 10000);
  assert.strictEqual(r.calculation.expected_total, 34050);
  assert.strictEqual(r.calculation.overcharge, 26000);
});

test('retur kesalahan penjual menanggung ongkir penuh', () => {
  const r = analyze(base({
    order_state: 'retur_setelah_kirim',
    return_cause: 'penjual',
    shipping_policy: 'penuh',
    shipping_per_direction: 18000,
    shipping_directions: 2,
    actual_shipping: 36000,
    actual_commission: 36000,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.expected_shipping, 36000);
});

test('retur kesalahan logistik tidak mengharapkan ongkir penjual', () => {
  const r = analyze(base({
    order_state: 'retur_setelah_kirim',
    return_cause: 'logistik',
    shipping_policy: 'penuh',
    shipping_per_direction: 18000,
    shipping_directions: 2,
    actual_shipping: 36000,
    actual_commission: 36000,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.expected_shipping, 0);
});

test('refund sebagian tetap tidak mengharapkan ongkir', () => {
  const r = analyze(base({
    order_state: 'refund_sebagian',
    refund_to_buyer: 100000,
    actual_shipping: 0,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.expected_shipping, 0);
  assert.strictEqual(r.calculation.overcharge, 0);
  assert.strictEqual(r.verdict.code, 'sesuai');
});

test('pesanan selesai tidak mengharapkan ongkir', () => {
  const r = analyze(base({
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    unit_price: 120000,
    qty: 1,
    dynamic_rate: 0,
    actual_commission: 9600,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
    manual_signals: [],
  }), NOW);
  assert.strictEqual(r.calculation.expected_total, 10850);
  assert.strictEqual(r.calculation.estimate, undefined);
  assert.strictEqual(r.verdict.code, 'sesuai');
  assert.strictEqual(r.risk.score, 0);
});

test('biaya lain masuk ke total potongan aktual', () => {
  const r = analyze(base({ actual_other: 5000 }), NOW);
  assert.strictEqual(r.calculation.actual_other, 5000);
  assert.strictEqual(r.calculation.actual_total, 66250);
  assert.strictEqual(r.calculation.overcharge, 29000);
});

test('kebocoran bulanan tidak negatif saat potongan lebih rendah', () => {
  const r = analyze(base({
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 30000,
    actual_processing: 0,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 10,
  }), NOW);
  assert.strictEqual(r.calculation.overcharge, -7250);
  assert.strictEqual(r.calculation.monthly_leak, 0);
});

test('verdict potongan lebih rendah meminta pemeriksaan', () => {
  const r = analyze(base({
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 30000,
    actual_processing: 0,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.verdict.code, 'lebih_rendah');
  assert.strictEqual(r.verdict.tone, 'signal');
});

test('verdict selisih kecil meminta rincian', () => {
  const r = analyze(base({
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 36100,
    actual_processing: 1250,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
  }), NOW);
  assert.strictEqual(r.calculation.overcharge, 100);
  assert.strictEqual(r.verdict.code, 'minta_rincian');
});

test('verdict selisih besar menjadi keberatan', () => {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.verdict.code, 'keberatan');
  assert.strictEqual(r.verdict.tone, 'ember');
});

test('skor risiko menjumlahkan indikator otomatis dan manual', () => {
  const checked = validateBase(base(), NOW);
  const risk = assess(checked.data, computeTotals(checked.data));
  assert.strictEqual(risk.score, 83);
  assert.strictEqual(risk.auto.length, 5);
  assert.strictEqual(risk.manual.length, 2);
});

test('skor risiko dibatasi 100', () => {
  const checked = validateBase(base({ refund_to_buyer: 900000, actual_other: 50000 }), NOW);
  const risk = assess(checked.data, computeTotals(checked.data));
  assert.strictEqual(risk.score, 100);
});

test('tanpa indikasi memberi skor nol dan label aman', () => {
  const checked = validateBase(base({
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 9600,
    actual_processing: 1250,
    actual_shipping: 0,
    refund_to_buyer: 0,
    orders_per_month: 0,
    manual_signals: [],
  }), NOW);
  const risk = assess(checked.data, computeTotals(checked.data));
  assert.strictEqual(risk.score, 0);
  assert.strictEqual(risk.level, 'tidak_ada');
  assert.strictEqual(risk.tone, 'ok');
});

test('tarif di luar kartu TikTok menambah indikator', () => {
  const checked = validateBase(base({ platform_rate: 20, manual_signals: [] }), NOW);
  const ids = detectSignals(checked.data, computeTotals(checked.data));
  assert.ok(ids.indexOf('tarif_luar_kartu') !== -1);
});

test('platform lain tidak memakai peringatan tarif TikTok', () => {
  const checked = validateBase(base({ platform: 'lain', platform_rate: 20, manual_signals: [] }), NOW);
  const ids = detectSignals(checked.data, computeTotals(checked.data));
  assert.strictEqual(ids.indexOf('tarif_luar_kartu'), -1);
});

test('kesiapan bukti lengkap mencapai 100', () => {
  const proof = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(proof.score, 100);
  assert.strictEqual(proof.verdict, 'siap');
  assert.strictEqual(proof.missing_critical.length, 0);
});

test('kesiapan bukti tanpa bukti kritis kurang', () => {
  const proof = readiness({ items: [] });
  assert.strictEqual(proof.score, 0);
  assert.strictEqual(proof.verdict, 'kurang');
  assert.strictEqual(proof.missing_critical.length, 5);
});

test('kesiapan bukti satu kritis hilang dianggap hampir siap', () => {
  const items = EVIDENCE.map((item) => item.id).filter((id) => id !== 'rate_card');
  const proof = readiness({ items });
  assert.strictEqual(proof.missing_critical.length, 1);
  assert.strictEqual(proof.verdict, 'hampir');
  assert.strictEqual(proof.score, 89);
});

test('validasi menolak tanggal pesanan kosong', () => {
  const r = analyze(base({ order_date: '' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Tanggal pesanan') !== -1);
});

test('validasi menolak tanggal pesanan di masa depan', () => {
  const r = analyze(base({ order_date: '2026-11-03' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('melewati hari ini') !== -1);
});

test('validasi menolak tanggal settlement tidak valid', () => {
  const r = analyze(base({ settlement_date: '2026-02-30' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('settlement') !== -1);
});

test('validasi menolak settlement sebelum pesanan', () => {
  const r = analyze(base({ order_date: '2026-10-26', settlement_date: '2026-10-25' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('sebelum tanggal pesanan') !== -1);
});

test('validasi menolak follow-up di masa depan', () => {
  const r = analyze(base({ followup_date: '2026-11-03' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('follow-up') !== -1);
});

test('validasi menolak harga satuan nol', () => {
  const r = analyze(base({ unit_price: 0 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Harga satuan') !== -1);
});

test('validasi menolak diskon yang menghabiskan harga', () => {
  const r = analyze(base({ unit_price: 150000, discount_per_unit: 150000 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('setelah diskon') !== -1);
});

test('validasi menolak jumlah unit pecahan', () => {
  const r = analyze(base({ qty: 1.5 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Jumlah unit') !== -1);
});

test('validasi menolak tarif komisi seratus persen', () => {
  const r = analyze(base({ platform_rate: 100 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Tarif komisi platform') !== -1);
});

test('validasi menolak jumlah arah selain satu atau dua', () => {
  const r = analyze(base({ shipping_directions: 3 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Jumlah arah') !== -1);
});

test('validasi menolak nominal potongan negatif', () => {
  const r = analyze(base({ actual_shipping: -1 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('tidak boleh negatif') !== -1);
});

test('validasi menolak jumlah pesanan bulanan pecahan', () => {
  const r = analyze(base({ orders_per_month: 1.2 }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('pesanan serupa') !== -1);
});

test('validasi menyaring sinyal dan bukti yang tidak dikenal', () => {
  const checked = validateBase(base({
    manual_signals: ['rincian_tidak_diminta', 'tidak_ada', 'rincian_tidak_diminta'],
    evidence: ['settlement_detail', 'tidak_ada', 'settlement_detail'],
  }), NOW);
  assert.deepStrictEqual(checked.data.manual_signals, ['rincian_tidak_diminta']);
  assert.deepStrictEqual(checked.data.evidence, ['settlement_detail']);
});

test('validasi kasus menolak nomor pesanan kosong', () => {
  const r = validateCase(base({ order_id: '' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Nomor pesanan') !== -1);
});

test('validasi kasus menyimpan nominal hasil hitung', () => {
  const r = validateCase(base(), NOW);
  assert.strictEqual(r.item.actual_total, 61250);
  assert.strictEqual(r.item.expected_total, 37250);
  assert.strictEqual(r.item.overcharge, 24000);
  assert.strictEqual(r.item.estimated_settlement, -61250);
});

test('ringkasan menghitung kasus terbuka, selisih, dan peringatan', () => {
  const a = validateCase(base(), NOW).item;
  const b = validateCase(base({
    order_id: 'CONTOH-2',
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 30100,
    actual_processing: 0,
    actual_shipping: 0,
    refund_to_buyer: 0,
    order_date: '2026-10-01',
    settlement_date: '2026-10-10',
    followup_date: '2026-10-20',
  }), NOW).item;
  b.status = 'baru';
  const s = summary([a, b], NOW);
  assert.strictEqual(s.total_cases, 2);
  assert.strictEqual(s.open_cases, 2);
  assert.strictEqual(s.total_overcharge, 24000);
  assert.strictEqual(s.open_overcharge, 24000);
  assert.strictEqual(s.oldest_open_days, 32);
  assert.ok(s.warnings.length >= 2);
});

test('ringkasan tidak menghitung kasus selesai sebagai terbuka', () => {
  const item = validateCase(base({
    status: 'selesai',
    order_state: 'selesai',
    return_cause: 'tidak_ada',
    actual_commission: 9600,
    actual_processing: 1250,
    actual_shipping: 0,
    refund_to_buyer: 0,
  }), NOW).item;
  const s = summary([item], NOW);
  assert.strictEqual(s.open_cases, 0);
  assert.strictEqual(s.open_overcharge, 0);
  assert.strictEqual(s.by_status.find((x) => x.id === 'selesai').count, 1);
});

test('ringkasan kosong tetap mengembalikan struktur lengkap', () => {
  const s = summary([], NOW);
  assert.strictEqual(s.total_cases, 0);
  assert.deepStrictEqual(s.cases, []);
  assert.strictEqual(s.by_status.length, CASE_STATUSES.length);
});

test('surat menolak nama toko kosong', () => {
  const r = buildLetter(base({ store_name: '' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Nama toko') !== -1);
});

test('surat menolak nomor pesanan kosong', () => {
  const r = buildLetter(base({ order_id: '' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Nomor pesanan') !== -1);
});

test('surat menolak nama produk kosong', () => {
  const r = buildLetter(base({ product_name: '' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.indexOf('Nama produk') !== -1);
});

test('surat rincian memuat subjek dan angka utama', () => {
  const r = buildLetter(base({ letter_type: 'rincian' }), NOW);
  assert.ok(r.subject.indexOf('Permintaan rincian potongan') !== -1);
  assert.ok(r.body.indexOf('Rp 61.250') !== -1);
  assert.ok(r.body.indexOf('Rp 37.250') !== -1);
  assert.ok(r.body.indexOf('Rp 24.000') !== -1);
  assert.ok(r.body.indexOf('64.4 persen') !== -1);
});

test('surat keberatan memuat permintaan koreksi', () => {
  const r = buildLetter(base({ letter_type: 'keberatan' }), NOW);
  assert.ok(r.subject.indexOf('Keberatan') !== -1);
  assert.ok(r.body.indexOf('Koreksi potongan') !== -1);
  assert.ok(r.body.indexOf('Rp 24.000') !== -1);
});

test('surat eskalasi memuat permintaan buka tiket', () => {
  const r = buildLetter(base({ letter_type: 'eskalasi' }), NOW);
  assert.ok(r.subject.indexOf('eskalasi') !== -1);
  assert.ok(r.body.indexOf('Buka kembali tiket') !== -1);
});

test('surat memakai fallback nama penjual dan kronologi', () => {
  const r = buildLetter(base({ seller_name: '', contact: '', chronology: '' }), NOW);
  assert.ok(r.body.indexOf('Pemilik toko') !== -1);
  assert.ok(r.body.indexOf('Saya mencatat selisih potongan ini') !== -1);
});

test('meta memuat semua pilihan, sumber, dan kebijakan', () => {
  const m = meta();
  assert.strictEqual(m.platforms.length, PLATFORMS.length);
  assert.strictEqual(m.order_states.length, ORDER_STATES.length);
  assert.strictEqual(m.return_causes.length, RETURN_CAUSES.length);
  assert.strictEqual(m.shipping_policies.length, SHIPPING_POLICIES.length);
  assert.strictEqual(m.auto_signals.length, AUTO_SIGNALS.length);
  assert.strictEqual(m.manual_signals.length, MANUAL_SIGNALS.length);
  assert.strictEqual(m.evidence.length, EVIDENCE.length);
  assert.strictEqual(m.case_statuses.length, CASE_STATUSES.length);
  assert.strictEqual(m.letter_types.length, LETTER_TYPES.length);
  assert.strictEqual(m.sources.length, SOURCES.length);
  assert.strictEqual(m.policy.processing_fee, 1250);
  assert.strictEqual(m.policy.dynamic_cap, 650000);
  assert.strictEqual(m.policy.buyer_return_contribution, 5000);
});

test('sumber memuat tanggal dan tautan resmi', () => {
  assert.ok(SOURCES.length >= 7);
  SOURCES.forEach((item) => {
    assert.ok(item.title);
    assert.ok(item.publisher);
    assert.ok(item.date);
    assert.ok(/^https:\/\//.test(item.url));
  });
});

test('teks library tidak memakai em dash', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'audit.js'), 'utf8');
  assert.strictEqual(source.indexOf('\u2014'), -1);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
