'use strict';

const assert = require('assert');
const refund = require('../lib/refund');

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

const TODAY = '2026-11-05';
const base = {
  store_name: 'Toko Uji',
  seller_name: 'Penjual Uji',
  contact: '0812-1111-2222',
  platform: 'shopee',
  order_ref: 'UJI-001',
  product_name: 'Produk uji',
  order_date: '2026-10-20',
  case_date: '2026-11-01',
  order_value: 100000,
  product_cost: 60000,
  shipping_cost: 10000,
  packaging_cost: 2000,
  return_shipping_cost: 5000,
  refund_amount: 100000,
  recovered_value: 0,
  goods_status: 'tidak_kembali',
  return_tracking: 'tidak_ada',
  return_packaging: 'tidak_ada_barang',
  refund_before_return: 'tidak',
  store_blocked: 'tidak',
  complaint_visible: 'ya',
  appeal_status: 'belum',
  buyer_account: 'lama',
  repeat_refund: 'tidak',
  buyer_refuses_chat: 'tidak',
  ticket: '',
  followup_date: '2026-11-02',
  note: '',
  chronology: '',
  status: 'baru',
  evidence: [],
};

function withInput(overrides) {
  return Object.assign({}, base, overrides);
}

test('meta memuat pilihan, bukti, ambang, dan sumber', () => {
  const data = refund.meta();
  assert.strictEqual(data.platforms.length, 6);
  assert.strictEqual(data.evidence.length, 13);
  assert.strictEqual(data.evidence.filter((item) => item.critical).length, 5);
  assert.strictEqual(data.case_statuses.length, 7);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.thresholds.high_value, 1000000);
  assert.ok(data.sources.length >= 5);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(!item.url.includes('d-0000000'));
  });
});

test('meta dan teks tidak memakai em dash', () => {
  const text = JSON.stringify(refund.meta()) + JSON.stringify(refund.example());
  assert.ok(text.indexOf('\u2014') === -1, 'em dash ditemukan');
});

test('contoh menghasilkan perhitungan yang konsisten', () => {
  const result = refund.analyze(refund.example(), { today: TODAY });
  assert.strictEqual(result.calculation.normal_profit, 824000);
  assert.strictEqual(result.calculation.cash_after, -2293000);
  assert.strictEqual(result.calculation.profit_loss, 3117000);
  assert.strictEqual(result.calculation.cash_loss, 2293000);
  assert.strictEqual(result.calculation.lost_revenue, 3497000);
  assert.strictEqual(result.calculation.unrecovered_goods, 2100000);
  assert.strictEqual(result.calculation.loss_pct, 89.13);
  assert.strictEqual(result.calculation.cash_loss_pct, 65.57);
  assert.strictEqual(result.calculation.normal_sales_needed, 3);
  assert.strictEqual(result.calculation.severity, 'kritis');
  assert.strictEqual(result.risk.score, 38);
  assert.strictEqual(result.risk.label, 'Sedang');
  assert.strictEqual(result.goods_label, 'Barang kembali rusak');
  assert.strictEqual(result.platform_label, 'Shopee');
});

test('refund penuh tanpa barang kembali dihitung sebagai kerugian kas penuh', () => {
  const result = refund.analyze(withInput({}), { today: TODAY });
  assert.strictEqual(result.calculation.normal_profit, 28000);
  assert.strictEqual(result.calculation.cash_after, -77000);
  assert.strictEqual(result.calculation.profit_loss, 105000);
  assert.strictEqual(result.calculation.cash_loss, 77000);
  assert.strictEqual(result.calculation.normal_sales_needed, 3);
  assert.strictEqual(result.calculation.severity, 'kritis');
  assert.strictEqual(result.risk.score, 48);
  assert.strictEqual(result.risk.label, 'Sedang');
});

test('barang kembali utuh tidak menghitung HPP sebagai kerugian', () => {
  const result = refund.analyze(withInput({
    goods_status: 'kembali_utuh',
    recovered_value: 60000,
    return_tracking: 'ada',
    return_packaging: 'layak',
    refund_amount: 100000,
  }), { today: TODAY });
  assert.strictEqual(result.calculation.unrecovered_goods, 0);
  assert.strictEqual(result.calculation.cash_loss, 17000);
  assert.strictEqual(result.calculation.profit_loss, 45000);
  assert.strictEqual(result.calculation.recovery_pct, 100);
  assert.ok(result.calculation.normal_sales_needed >= 1);
});

test('refund sebagian hanya menghitung dana yang benar-benar hilang', () => {
  const result = refund.analyze(withInput({ refund_amount: 40000 }), { today: TODAY });
  assert.strictEqual(result.calculation.profit_loss, 45000);
  assert.strictEqual(result.calculation.lost_revenue, 40000);
  assert.strictEqual(result.calculation.refund_pct, 40);
  assert.strictEqual(result.calculation.cash_loss, 77000);
});

test('nilai nol tidak dianggap kosong', () => {
  const result = refund.analyze(withInput({
    product_cost: 0,
    shipping_cost: 0,
    packaging_cost: 0,
    return_shipping_cost: 0,
    refund_amount: 0,
    recovered_value: 0,
  }), { today: TODAY });
  assert.strictEqual(result.calculation.normal_profit, 100000);
  assert.strictEqual(result.calculation.cash_loss, 0);
  assert.strictEqual(result.calculation.severity, 'aman');
  assert.strictEqual(result.risk.score, 43);
});

test('validasi menolak nilai pesanan kosong', () => {
  assert.throws(() => refund.analyze(withInput({ order_value: '' }), { today: TODAY }), /Nilai pesanan wajib/);
});

test('validasi menolak biaya negatif', () => {
  assert.throws(() => refund.analyze(withInput({ product_cost: -1 }), { today: TODAY }), /tidak boleh kurang/);
});

test('validasi menolak refund melebihi nilai pesanan', () => {
  assert.throws(() => refund.analyze(withInput({ refund_amount: 100001 }), { today: TODAY }), /melebihi nilai pesanan/);
});

test('validasi menolak nilai selamat melebihi HPP', () => {
  assert.throws(() => refund.analyze(withInput({ recovered_value: 60001 }), { today: TODAY }), /melebihi HPP/);
});

test('validasi menolak tanggal tidak valid', () => {
  assert.throws(() => refund.analyze(withInput({ case_date: '2026-02-31' }), { today: TODAY }), /tidak valid/);
  assert.throws(() => refund.analyze(withInput({ case_date: '2026-11-06' }), { today: TODAY }), /melewati hari ini/);
});

test('validasi menolak urutan tanggal yang salah', () => {
  assert.throws(() => refund.analyze(withInput({ order_date: '2026-11-02' }), { today: TODAY }), /setelah tanggal kasus/);
  assert.throws(() => refund.analyze(withInput({ followup_date: '2026-10-31' }), { today: TODAY }), /sebelum tanggal kasus/);
});

test('validasi membersihkan teks dan membatasi bukti', () => {
  const result = refund.analyze(withInput({
    store_name: '  Toko   Uji  ',
    evidence: ['order_detail', 'order_detail', 'tidak_ada', 'packing_video'],
  }), { today: TODAY });
  assert.strictEqual(result.input.store_name, 'Toko Uji');
  assert.deepStrictEqual(result.input.evidence, ['order_detail', 'packing_video']);
});

test('validasi menolak catatan terlalu panjang', () => {
  assert.throws(() => refund.analyze(withInput({ note: 'x'.repeat(401) }), { today: TODAY }), /maksimal 400/);
});

test('readiness kosong menghasilkan nol dan semua bukti kritis terbuka', () => {
  const result = refund.readiness({ evidence: [] });
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.label, 'Belum siap');
  assert.strictEqual(result.checked_count, 0);
  assert.strictEqual(result.critical_open.length, 5);
});

test('readiness semua bukti menghasilkan seratus', () => {
  const result = refund.readiness({ evidence: refund.EVIDENCE.map((item) => item.id) });
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.label, 'Siap');
  assert.strictEqual(result.critical_open.length, 0);
  assert.strictEqual(result.checked_count, 13);
});

test('readiness membobot bukti kritis dua kali', () => {
  const result = refund.readiness({ evidence: ['order_detail'] });
  assert.strictEqual(result.score, 11);
  assert.strictEqual(result.critical_open.length, 4);
});

test('readiness menolak id bukti yang tidak dikenal', () => {
  const result = refund.readiness({ evidence: ['order_detail', 'tidak_ada'] });
  assert.strictEqual(result.checked_count, 1);
});

test('surat rincian memuat data kunci dan tidak memakai em dash', () => {
  const result = refund.letter(Object.assign({}, refund.example(), {
    letter_type: 'rincian',
    chronology: 'Barang dikirim, lalu kembali rusak.',
    ticket: 'TKT-001',
  }), { today: TODAY });
  assert.ok(result.subject.indexOf('rincian') !== -1);
  assert.ok(result.body.indexOf('ORD-CONTOH-001') !== -1);
  assert.ok(result.body.indexOf('Shopee') !== -1);
  assert.ok(result.body.indexOf('Rp2.293.000') !== -1);
  assert.ok(result.body.indexOf('TKT-001') !== -1);
  assert.ok(result.body.indexOf('\u2014') === -1);
  assert.ok(result.body.indexOf('Hormat saya') !== -1);
});

test('surat eskalasi memakai penerima lembaga dan permintaan peninjauan', () => {
  const result = refund.letter(Object.assign({}, refund.example(), { letter_type: 'eskalasi' }), { today: TODAY });
  assert.ok(result.recipient.indexOf('Kementerian') !== -1);
  assert.ok(result.body.indexOf('tinjau ulang') !== -1);
});

test('surat menolak data wajib yang kosong', () => {
  assert.throws(() => refund.letter(withInput({ store_name: '' }), { today: TODAY }), /Nama toko wajib/);
  assert.throws(() => refund.letter(withInput({ order_ref: '' }), { today: TODAY }), /Nomor pesanan wajib/);
});

test('surat menolak kronologi terlalu panjang', () => {
  assert.throws(() => refund.letter(withInput({ chronology: 'x'.repeat(1201) }), { today: TODAY }), /maksimal 1200/);
});

test('summarizeCases menjumlahkan kerugian dan menghitung kasus terbuka', () => {
  const a = Object.assign({}, refund.example(), {
    id: 'r1',
    created_at: '2026-11-01T00:00:00.000Z',
    order_date: '2026-07-01',
    case_date: '2026-08-01',
    followup_date: '2026-08-02',
  });
  const b = Object.assign({}, withInput({ order_value: 100000, product_cost: 0, shipping_cost: 0, packaging_cost: 0, return_shipping_cost: 0, refund_amount: 0, recovered_value: 0 }), {
    id: 'r2',
    created_at: '2026-11-02T00:00:00.000Z',
    status: 'selesai',
    evidence: ['order_detail'],
  });
  const result = refund.summarizeCases([a, b], TODAY);
  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.open_count, 1);
  assert.strictEqual(result.closed_count, 1);
  assert.strictEqual(result.total_cash_loss, 2293000);
  assert.strictEqual(result.total_refund, 3497000);
  assert.strictEqual(result.total_recovered, 500000);
  assert.strictEqual(result.cases.length, 2);
  assert.ok(result.warnings.length >= 1);
});

test('summarizeCases menandai kasus terbuka lebih dari 30 hari', () => {
  const old = Object.assign({}, base, {
    id: 'r1',
    created_at: '2026-01-01T00:00:00.000Z',
    order_date: '2026-08-01',
    case_date: '2026-09-01',
    followup_date: '2026-09-02',
  });
  const result = refund.summarizeCases([old], TODAY);
  assert.ok(result.oldest_open_days > 30);
  assert.ok(result.warnings.some((item) => item.indexOf('30 hari') !== -1));
});

test('CSV memiliki header, baris, dan melindungi formula', () => {
  const item = Object.assign({}, refund.example(), {
    id: 'r1',
    created_at: '2026-11-01T00:00:00.000Z',
    note: '=1+1',
    product_name: 'Produk, "khusus"',
  });
  const csv = refund.csvRows([item], TODAY);
  const lines = csv.split('\r\n');
  assert.ok(lines[0].startsWith('id,created_at,platform'));
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[1].indexOf("'=1+1") !== -1);
  assert.ok(lines[1].indexOf('"Produk, ""khusus"""') !== -1);
  assert.ok(lines[1].indexOf('2293000') !== -1);
});

test('format rupiah dan tanggal stabil', () => {
  assert.strictEqual(refund.rupiah(2293000), 'Rp2.293.000');
  assert.strictEqual(refund.rupiah(0), 'Rp0');
  assert.strictEqual(refund.formatDateLong('2026-11-01'), '1 November 2026');
  assert.strictEqual(refund.dayDiff('2026-11-01', '2026-11-05'), 4);
});

test('sumber tidak memakai URL placeholder', () => {
  refund.SOURCES.forEach((item) => {
    assert.ok(!/d-0000000/.test(item.url));
    assert.ok(item.url.indexOf('mediakonsumen.com') !== -1);
  });
});

if (failed > 0) {
  console.error('\n' + failed + ' tes gagal, ' + passed + ' tes lulus.');
  process.exitCode = 1;
} else {
  console.log('\n' + passed + ' tes lulus.');
}
