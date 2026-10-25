// Unit tests for the shipping claim tracker. Run: node test/claim.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  analyze,
  readiness,
  computeLoss,
  caseView,
  summary,
  validateCase,
  buildLetter,
  buildExample,
  agingFor,
  todayISO,
  addDays,
  daysBetween,
  formatDateOnly,
  formatRupiah,
  PLATFORMS,
  COURIERS,
  INCIDENT_TYPES,
  STATUSES,
  EVIDENCE,
  SOURCES,
} = require('../lib/claim');

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

const NOW = new Date('2026-10-25T03:00:00Z');

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    courier: 'spx',
    incident_type: 'hilang',
    selling_price: 1190000,
    refund_to_buyer: 1190000,
    product_cost: 900000,
    shipping_cost: 20000,
    packaging_cost: 3000,
    insurance: 'tidak',
    insurance_cost: 0,
    compensation_received: 135000,
    recovered_goods_value: 0,
    normal_margin_pct: 15,
    incident_date: '2026-10-07',
    report_date: '2026-10-09',
    last_follow_up: '2026-10-23',
  }, overrides || {});
}

t('tanggal hari ini memakai zona Asia/Jakarta', function () {
  assert.strictEqual(todayISO(NOW), '2026-10-25');
  assert.strictEqual(todayISO(new Date('2026-10-24T18:00:00Z')), '2026-10-25');
});

t('selisih hari dan tambah hari konsisten', function () {
  assert.strictEqual(daysBetween('2026-10-07', '2026-10-25'), 18);
  assert.strictEqual(addDays('2026-10-25', -16), '2026-10-09');
  assert.strictEqual(formatDateOnly('2026-10-25'), '25 Oktober 2026');
});

t('format rupiah memakai pemisah Indonesia', function () {
  assert.strictEqual(formatRupiah(1190000), 'Rp 1.190.000');
  assert.strictEqual(formatRupiah('135000'), 'Rp 135.000');
});

t('kerugian dasar: refund penuh, kompensasi Rp135 ribu', function () {
  const r = computeLoss(base());
  assert.strictEqual(r.total_cost, 923000);
  assert.strictEqual(r.revenue_kept, 0);
  assert.strictEqual(r.net_loss, 788000);
  assert.strictEqual(r.compensation_gap, 788000);
  assert.strictEqual(r.normal_profit, 178500);
  assert.strictEqual(r.sales_to_cover, 5);
  assert.strictEqual(r.severity, 'signifikan');
});

t('refund sebagian menyisakan dana penjualan', function () {
  const r = computeLoss(base({ refund_to_buyer: 500000 }));
  assert.strictEqual(r.revenue_kept, 690000);
  assert.strictEqual(r.net_loss, 98000);
  assert.strictEqual(r.sales_to_cover, 1);
  assert.strictEqual(r.severity, 'ringan');
});

t('tanpa refund, hasil bersih bisa positif', function () {
  const r = computeLoss(base({ refund_to_buyer: 0 }));
  assert.strictEqual(r.revenue_kept, 1190000);
  assert.ok(r.net_result > 0);
  assert.strictEqual(r.net_loss, 0);
  assert.strictEqual(r.severity, 'tertutup');
});

t('premi asuransi masuk sebagai biaya', function () {
  const r = computeLoss(base({ insurance: 'ya', insurance_cost: 50000 }));
  assert.strictEqual(r.total_cost, 973000);
  assert.strictEqual(r.net_loss, 838000);
});

t('nilai barang kembali mengurangi kerugian', function () {
  const r = computeLoss(base({ recovered_goods_value: 300000 }));
  assert.strictEqual(r.net_loss, 488000);
  assert.strictEqual(r.compensation_gap, 488000);
});

t('patokan 10 kali ongkir dihitung dari ongkir', function () {
  const r = computeLoss(base());
  assert.strictEqual(r.ten_times_shipping, 200000);
  assert.ok(r.ten_times_shipping < r.total_cost);
});

t('refund dibatasi maksimal sebesar nilai transaksi', function () {
  const r = computeLoss(base({ refund_to_buyer: 5000000 }));
  assert.strictEqual(r.refund_to_buyer, 1190000);
  assert.strictEqual(r.revenue_kept, 0);
});

t('margin nol tidak menghasilkan pembagi nol', function () {
  const r = computeLoss(base({ normal_margin_pct: 0 }));
  assert.strictEqual(r.normal_profit, 0);
  assert.strictEqual(r.sales_to_cover, null);
  assert.strictEqual(r.severity, 'kritis');
});

t('validasi menolak nilai transaksi nol', function () {
  const r = analyze(base({ selling_price: 0 }), NOW);
  assert.ok(r.error);
});

t('validasi menolak tanggal kejadian di masa depan', function () {
  const r = analyze(base({ incident_date: '2026-10-30' }), NOW);
  assert.ok(r.error);
});

t('validasi menolak laporan sebelum kejadian', function () {
  const r = analyze(base({ incident_date: '2026-10-10', report_date: '2026-10-09' }), NOW);
  assert.ok(r.error);
});

t('validasi menolak tanggal kalender tidak valid', function () {
  const r = analyze(base({ incident_date: '2026-02-31' }), NOW);
  assert.strictEqual(r.error, 'Tanggal kejadian tidak valid');
});

t('analisis mengembalikan platform, umur laporan, dan rekomendasi', function () {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.platform_name, 'Shopee');
  assert.strictEqual(r.claim_channel, 'Pusat Resolusi Shopee');
  assert.strictEqual(r.courier_name, 'SPX Express');
  assert.strictEqual(r.incident_age_days, 18);
  assert.strictEqual(r.report_age_days, 16);
  assert.strictEqual(r.follow_up_age_days, 2);
  assert.ok(r.recommendations.length >= 4);
  assert.ok(r.recommendations.some((item) => item.includes('10 kali ongkir')));
  assert.ok(r.recommendations.some((item) => item.includes('tidak diasuransikan')));
});

t('analisis menandai paket nyangkut tanpa menghapus perhitungan', function () {
  const r = analyze(base({ incident_type: 'nyangkut' }), NOW);
  assert.strictEqual(r.incident_type_label, 'Resi tidak bergerak (diduga nyangkut)');
  assert.ok(r.recommendations.some((item) => item.includes('status paket secara tertulis')));
  assert.strictEqual(r.loss.net_loss, 788000);
});

t('analisis retur rusak menambahkan langkah unboxing', function () {
  const r = analyze(base({ incident_type: 'retur_rusak' }), NOW);
  assert.ok(r.recommendations.some((item) => item.toLowerCase().includes('unboxing paket retur')));
});

t('barang di atas Rp5 juta meminta bukti CCTV', function () {
  const r = analyze(base({ product_cost: 6500000, selling_price: 7013470, refund_to_buyer: 7013470 }), NOW);
  assert.ok(r.recommendations.some((item) => item.includes('CCTV')));
});

t('laporan lebih dari 30 hari memicu eskalasi', function () {
  const r = analyze(base({ incident_date: '2026-08-20', report_date: '2026-08-21' }), NOW);
  assert.ok(r.recommendations.some((item) => item.includes('Naikkan eskalasi')));
});

t('kesiapan tanpa bukti bernilai nol', function () {
  const r = readiness({ items: [] });
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.verdict, 'belum');
  assert.strictEqual(r.missing_critical.length, 5);
});

t('kesiapan dengan semua bukti bernilai 100', function () {
  const r = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.verdict, 'siap');
  assert.strictEqual(r.missing_critical.length, 0);
  assert.strictEqual(r.checked_count, EVIDENCE.length);
});

t('bukti kritis memberi bobot lebih besar', function () {
  const r = readiness({ items: ['packing_video', 'handover', 'tracking', 'first_ticket', 'invoice'] });
  assert.strictEqual(r.missing_critical.length, 0);
  assert.ok(r.score < 100);
  assert.ok(r.score >= 55);
});

t('validasi kasus menolak referensi kosong', function () {
  const r = validateCase(base({ ref: '' }));
  assert.ok(r.error);
});

t('validasi kasus menolak tanggal laporan tidak valid', function () {
  const r = validateCase(base({ ref: 'TEST-2', report_date: '2026-02-31' }));
  assert.strictEqual(r.error, 'Tanggal laporan tidak valid');
});

t('validasi kasus menolak status selesai tanpa kompensasi', function () {
  const r = validateCase(base({ status: 'selesai', received_amount: 0 }));
  assert.ok(r.error);
});

t('kasus valid dinormalisasi dan diberi label', function () {
  const r = validateCase(base({
    ref: '2610097HP352JR',
    tracking_ref: 'SPXID06396809073A',
    status: 'ditanggapi',
    claimed_amount: 1190000,
    received_amount: 135000,
    normal_margin_pct: 15,
  }));
  assert.ok(!r.error);
  assert.strictEqual(r.item.platform, 'shopee');
  assert.strictEqual(r.item.incident_type_label, 'Paket hilang di perjalanan');
  assert.strictEqual(r.item.status_label, 'Ditanggapi');
  assert.strictEqual(r.item.claimed_amount, 1190000);
  assert.strictEqual(r.item.received_amount, 135000);
});

t('umur klaim memberi label yang berbeda', function () {
  assert.strictEqual(agingFor(null).id, 'belum-lapor');
  assert.strictEqual(agingFor(3).id, 'baru');
  assert.strictEqual(agingFor(16).id, 'tindak-lanjut');
  assert.strictEqual(agingFor(45).id, 'mendesak');
  assert.strictEqual(agingFor(90).id, 'kritis');
});

t('tampilan kasus menghitung kerugian dari kompensasi diterima', function () {
  const view = caseView(base({
    id: 'c1',
    ref: 'INV-1',
    claimed_amount: 1190000,
    received_amount: 135000,
    normal_margin_pct: 15,
  }), NOW);
  assert.strictEqual(view.id, 'c1');
  assert.strictEqual(view.report_age_days, 16);
  assert.strictEqual(view.aging, 'tindak-lanjut');
  assert.strictEqual(view.loss.net_loss, 788000);
  assert.ok(view.flags.length >= 1);
});

t('kasus ditolak dan belum follow-up diberi tanda', function () {
  const view = caseView(base({
    ref: 'INV-2',
    status: 'ditolak',
    last_follow_up: '2026-10-10',
    claimed_amount: 1190000,
    received_amount: 0,
  }), NOW);
  assert.ok(view.flags.some((item) => item.includes('Klaim ditolak')));
  assert.ok(view.flags.some((item) => item.includes('follow-up')));
});

t('ringkasan memisahkan kasus terbuka dan total kerugian', function () {
  const cases = [
    base({ id: 'c1', ref: 'INV-1', status: 'investigasi', claimed_amount: 1190000, received_amount: 135000 }),
    base({ id: 'c2', ref: 'INV-2', status: 'selesai', claimed_amount: 0, received_amount: 923000, compensation_received: 923000 }),
  ];
  const r = summary(cases, NOW);
  assert.strictEqual(r.total_cases, 2);
  assert.strictEqual(r.open_cases, 1);
  assert.strictEqual(r.total_net_loss, 788000);
  assert.strictEqual(r.total_claimed, 1190000);
  assert.strictEqual(r.total_received, 1058000);
  assert.strictEqual(r.oldest_open_days, 16);
});

t('surat klaim memuat data pesanan, kerugian, dan bukti', function () {
  const r = buildLetter(base({
    seller_name: 'Ricky',
    store_name: 'Sinar Audio',
    store_id: 'sainaraudio',
    contact: '0812xxxxxxx',
    item_name: 'Crossover audio',
    ref: '2610097HP352JR',
    tracking_ref: 'SPXID06396809073A',
    claimed_amount: 1190000,
    chronology: '7 Oktober 2026: paket diserahkan ke kurir.',
  }), NOW);
  assert.ok(r.subject.includes('Klaim ganti rugi'));
  assert.ok(!r.subject.includes('paket paket'));
  assert.ok(r.body.includes('Sinar Audio'));
  assert.ok(r.body.includes('2610097HP352JR'));
  assert.ok(r.body.includes('SPXID06396809073A'));
  assert.ok(r.body.includes('Rp 788.000'));
  assert.ok(r.body.includes('Video packing'));
  assert.ok(r.body.includes('Dibuat pada 25 Oktober 2026'));
});

t('surat retur rusak menyertakan bukti unboxing retur', function () {
  const r = buildLetter(base({ incident_type: 'retur_rusak', ref: 'RET-1' }), NOW);
  assert.ok(r.body.includes('Video unboxing paket retur'));
});

t('semua platform, ekspedisi, jenis insiden, dan status punya label', function () {
  PLATFORMS.forEach((item) => assert.ok(item.id && item.name && item.claim_channel));
  COURIERS.forEach((item) => assert.ok(item.id && item.name));
  INCIDENT_TYPES.forEach((item) => assert.ok(item.id && item.label && item.note));
  STATUSES.forEach((item) => assert.ok(item.id && item.label && item.next));
  assert.strictEqual(PLATFORMS.length, 6);
  assert.strictEqual(COURIERS.length, 11);
  assert.strictEqual(INCIDENT_TYPES.length, 5);
  assert.strictEqual(STATUSES.length, 7);
});

t('sumber membawa tanggal dan URL yang bisa dibuka', function () {
  assert.strictEqual(SOURCES.length, 7);
  SOURCES.forEach((item) => {
    assert.ok(item.publisher);
    assert.ok(item.date);
    assert.ok(item.url.startsWith('https://mediakonsumen.com/'));
    assert.ok(Array.isArray(item.facts) && item.facts.length >= 2);
  });
});

t('contoh isian memakai tanggal relatif terhadap hari ini', function () {
  const e = buildExample(NOW);
  assert.strictEqual(e.incident_date, '2026-10-07');
  assert.strictEqual(e.report_date, '2026-10-09');
  assert.strictEqual(e.last_follow_up, '2026-10-23');
  assert.strictEqual(e.selling_price, 1190000);
});

t('tidak ada em dash di kode dan teks tool', function () {
  const files = [
    path.join(__dirname, '..', 'lib', 'claim.js'),
    path.join(__dirname, '..', 'README.md'),
    path.join(__dirname, '..', 'public', 'index.html'),
  ];
  files.forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!text.includes('\u2014'), file + ' mengandung em dash');
  });
});

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
