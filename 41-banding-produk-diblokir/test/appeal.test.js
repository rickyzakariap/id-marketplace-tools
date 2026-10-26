// Unit tests for the product takedown appeal tool. Run: node test/appeal.test.js
const assert = require('assert');
const {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computeArgument,
  computeImpact,
  daysBetween,
  addDays,
  formatDateOnly,
  formatRupiah,
  normalizeFacts,
  readiness,
  summary,
  todayISO,
  validateCase,
  EVIDENCE,
  FACT_OPTIONS,
  PLATFORMS,
  REASONS,
  SOURCES,
  STATUSES,
} = require('../lib/appeal');

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

const NOW = new Date('2026-10-26T03:00:00Z');

function base(overrides) {
  return Object.assign({
    platform: 'shopee',
    reason: 'nikotin',
    product_name: 'Kapas bayi Medisoft',
    price: 45000,
    cost: 32000,
    stock_units: 120,
    units_per_day: 8,
    ad_spend_per_day: 15000,
    removed_date: '2026-10-16',
    status: 'ditutup',
    facts: {
      reason_matches: 'tidak',
      listing_unchanged: 'ya',
      permit: 'tidak_berlaku',
      written_reason: 'tidak',
      similar_active: 'ya',
      forced_statement: 'ya',
    },
  }, overrides || {});
}

t('tanggal hari ini memakai zona Asia/Jakarta', function () {
  assert.strictEqual(todayISO(NOW), '2026-10-26');
  assert.strictEqual(todayISO(new Date('2026-10-25T18:00:00Z')), '2026-10-26');
});

t('selisih hari dan tambah hari konsisten', function () {
  assert.strictEqual(daysBetween('2026-10-16', '2026-10-26'), 10);
  assert.strictEqual(addDays('2026-10-26', -10), '2026-10-16');
  assert.strictEqual(formatDateOnly('2026-10-26'), '26 Oktober 2026');
});

t('format rupiah memakai pemisah Indonesia', function () {
  assert.strictEqual(formatRupiah(5030000), 'Rp 5.030.000');
  assert.strictEqual(formatRupiah('150000'), 'Rp 150.000');
});

t('dampak dasar: 10 hari hilang, laba dan modal tertahan', function () {
  const r = computeImpact(base(), NOW);
  assert.strictEqual(r.offline_days, 10);
  assert.strictEqual(r.unit_margin, 13000);
  assert.strictEqual(r.lost_units, 80);
  assert.strictEqual(r.lost_revenue, 3600000);
  assert.strictEqual(r.lost_profit, 1040000);
  assert.strictEqual(r.stock_value, 3840000);
  assert.strictEqual(r.ad_waste, 150000);
  assert.strictEqual(r.total_exposure, 5030000);
  assert.strictEqual(r.daily_cost, 119000);
  assert.strictEqual(r.severity, 'signifikan');
});

t('tanggal pulih membatasi hari hilang dan menandai terpulih', function () {
  const r = computeImpact(base({ removed_date: '2026-10-10', restored_date: '2026-10-14' }), NOW);
  assert.strictEqual(r.offline_days, 4);
  assert.strictEqual(r.lost_profit, 416000);
  assert.strictEqual(r.severity, 'terpulih');
});

t('tanpa penjualan harian, laba hilang nol tetapi modal tetap dihitung', function () {
  const r = computeImpact(base({ units_per_day: 0 }), NOW);
  assert.strictEqual(r.lost_profit, 0);
  assert.strictEqual(r.stock_value, 3840000);
  assert.strictEqual(r.ad_waste, 150000);
});

t('harga di bawah modal tidak menghasilkan margin negatif', function () {
  const r = computeImpact(base({ price: 20000, cost: 32000 }), NOW);
  assert.strictEqual(r.unit_margin, 0);
  assert.strictEqual(r.lost_profit, 0);
});

t('dampak 30 hari atau lebih masuk kategori kritis', function () {
  const r = computeImpact(base({ removed_date: '2026-09-20' }), NOW);
  assert.ok(r.offline_days >= 30);
  assert.strictEqual(r.severity, 'kritis');
});

t('argumen lengkap tanpa surat pernyataan bernilai kuat', function () {
  const facts = base().facts;
  facts.forced_statement = 'tidak';
  const r = computeArgument({ facts: facts });
  assert.strictEqual(r.score, 80);
  assert.strictEqual(r.verdict, 'kuat');
});

t('argumen tanpa bukti pendukung bernilai lemah', function () {
  const r = computeArgument({
    facts: {
      reason_matches: 'tidak_yakin',
      listing_unchanged: 'tidak',
      permit: 'tidak_ada',
      written_reason: 'tidak',
      similar_active: 'tidak',
      forced_statement: 'ya',
    },
  });
  assert.strictEqual(r.score, 10);
  assert.strictEqual(r.verdict, 'lemah');
});

t('izin yang tersedia menambah kekuatan argumen', function () {
  const a = computeArgument(base());
  const b = computeArgument(base({ facts: Object.assign({}, base().facts, { permit: 'ada' }) }));
  assert.strictEqual(b.score - a.score, 5);
});

t('alasan tertulis menambah kekuatan argumen', function () {
  const b = computeArgument(base({ facts: Object.assign({}, base().facts, { written_reason: 'ya' }) }));
  assert.strictEqual(b.score, 80);
});

t('fakta tidak dikenal jatuh ke default yang aman', function () {
  const facts = normalizeFacts({ facts: { reason_matches: 'ngawur', listing_unchanged: 'ngawur' } });
  assert.strictEqual(facts.reason_matches, 'tidak_yakin');
  assert.strictEqual(facts.listing_unchanged, 'ya');
});

t('kesiapan tanpa bukti bernilai nol', function () {
  const r = readiness({ items: [] });
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.verdict, 'belum');
  assert.strictEqual(r.missing_critical.length, 5);
});

t('kesiapan semua bukti bernilai 100', function () {
  const r = readiness({ items: EVIDENCE.map((item) => item.id) });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.verdict, 'siap');
  assert.strictEqual(r.missing_critical.length, 0);
});

t('lima bukti kritis saja memberi 56 persen', function () {
  const items = EVIDENCE.filter((item) => item.critical).map((item) => item.id);
  const r = readiness({ items: items });
  assert.strictEqual(r.score, 56);
  assert.strictEqual(r.verdict, 'hampir');
  assert.strictEqual(r.missing_critical.length, 0);
});

t('analisis menolak harga jual nol', function () {
  const r = analyze(base({ price: 0 }), NOW);
  assert.ok(r.error);
});

t('analisis menolak tanggal dihapus kosong', function () {
  const r = analyze(base({ removed_date: '' }), NOW);
  assert.strictEqual(r.error, 'Tanggal produk dihapus wajib diisi');
});

t('analisis menolak tanggal dihapus di masa depan', function () {
  const r = analyze(base({ removed_date: '2026-10-30' }), NOW);
  assert.ok(r.error);
});

t('analisis menolak tanggal kalender tidak valid', function () {
  const r = analyze(base({ removed_date: '2026-02-31' }), NOW);
  assert.strictEqual(r.error, 'Tanggal produk dihapus tidak valid');
});

t('analisis menolak tanggal pulih sebelum tanggal hapus', function () {
  const r = analyze(base({ removed_date: '2026-10-16', restored_date: '2026-10-15' }), NOW);
  assert.ok(r.error);
});

t('analisis mengembalikan platform, alasan, dampak, dan rekomendasi', function () {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.platform_name, 'Shopee');
  assert.strictEqual(r.reason_label, 'Nikotin, tembakau, rokok elektronik, atau shisha');
  assert.strictEqual(r.impact.lost_profit, 1040000);
  assert.strictEqual(r.argument.score, 65);
  assert.ok(r.recommendations.length >= 4);
  assert.ok(r.recommendations.some((item) => item.includes('peninjauan manual')));
  assert.ok(r.recommendations.some((item) => item.includes('surat pernyataan')));
  assert.ok(r.sources.length >= 2);
});

t('rekomendasi menyesuaikan saat produk memang melanggar', function () {
  const r = analyze(base({ facts: Object.assign({}, base().facts, { reason_matches: 'ya' }) }), NOW);
  assert.ok(r.recommendations.some((item) => item.includes('Fokus pada perbaikan listing')));
});

t('rekomendasi menandai banding yang ditolak', function () {
  const r = analyze(base({ status: 'ditolak' }), NOW);
  assert.ok(r.recommendations.some((item) => item.includes('alasan penolakan tertulis')));
});

t('validasi kasus menerima data lengkap', function () {
  const r = validateCase(base({ evidence: ['reason_screenshot', 'ticket'] }), NOW);
  assert.ok(!r.error);
  assert.strictEqual(r.item.product_name, 'Kapas bayi Medisoft');
  assert.strictEqual(r.item.evidence.length, 2);
});

t('validasi kasus membuang id bukti yang tidak dikenal', function () {
  const r = validateCase(base({ evidence: ['reason_screenshot', 'tidak_ada'] }), NOW);
  assert.ok(!r.error);
  assert.deepStrictEqual(r.item.evidence, ['reason_screenshot']);
});

t('validasi kasus menolak nama produk kosong', function () {
  const r = validateCase(base({ product_name: '' }), NOW);
  assert.ok(r.error);
});

t('validasi kasus menolak harga jual nol', function () {
  const r = validateCase(base({ price: 0 }), NOW);
  assert.ok(r.error);
});

t('validasi kasus menolak tanggal banding sebelum tanggal hapus', function () {
  const r = validateCase(base({ appeal_date: '2026-10-15' }), NOW);
  assert.ok(r.error);
});

t('validasi kasus menolak tanggal pulih di masa depan', function () {
  const r = validateCase(base({ restored_date: '2026-10-30' }), NOW);
  assert.ok(r.error);
});

t('case view memberi flag untuk toko ditutup dan surat pernyataan', function () {
  const v = caseView(Object.assign({ id: 'p1' }, validateCase(base(), NOW).item), NOW);
  assert.ok(v.flags.some((item) => item.includes('ditutup permanen')));
  assert.ok(v.flags.some((item) => item.includes('surat pernyataan')));
  assert.strictEqual(v.aging_days, 10);
});

t('case view menghitung umur sampai tanggal pulih', function () {
  const item = validateCase(base({ removed_date: '2026-10-10', restored_date: '2026-10-14', status: 'dipulihkan' }), NOW).item;
  const v = caseView(item, NOW);
  assert.strictEqual(v.aging_days, 4);
  assert.strictEqual(v.impact.severity, 'terpulih');
});

t('ringkasan memisahkan kasus terbuka, pulih, dan permanen', function () {
  const cases = [
    validateCase(base({ status: 'banding', removed_date: '2026-10-01' }), NOW).item,
    validateCase(base({ status: 'dipulihkan', removed_date: '2026-10-01', restored_date: '2026-10-05' }), NOW).item,
    validateCase(base({ status: 'ditutup', removed_date: '2026-09-01' }), NOW).item,
  ];
  const s = summary(cases, NOW);
  assert.strictEqual(s.total_cases, 3);
  assert.strictEqual(s.open_cases, 1);
  assert.strictEqual(s.restored_cases, 1);
  assert.strictEqual(s.permanent_cases, 1);
  assert.strictEqual(s.oldest_open_days, 25);
  assert.ok(s.total_lost_profit > 0);
  assert.ok(s.total_stock_value > 0);
});

t('ringkasan kosong tidak menghasilkan pembagi nol', function () {
  const s = summary([], NOW);
  assert.strictEqual(s.total_cases, 0);
  assert.strictEqual(s.oldest_open_days, 0);
  assert.strictEqual(s.total_exposure, 0);
});

t('surat memuat produk, nomor tiket, dan permohonan peninjauan', function () {
  const r = buildLetter(base({ ticket: 'TIKET-99', chronology: 'Produk dihapus otomatis.' }), NOW);
  assert.ok(r.subject.includes('Kapas bayi Medisoft'));
  assert.ok(r.body.includes('TIKET-99'));
  assert.ok(r.body.includes('Permohonan peninjauan manual'));
  assert.ok(r.body.includes('Produk ini tidak mengandung'));
  assert.ok(r.body.includes('26 Oktober 2026'));
});

t('surat menolak nama produk kosong', function () {
  const r = buildLetter({ product_name: '' }, NOW);
  assert.ok(r.error);
});

t('contoh isian mengikuti tanggal hari ini dan memakai sumber', function () {
  const e = buildExample(NOW);
  assert.strictEqual(e.removed_date, '2026-10-16');
  assert.strictEqual(e.status, 'ditutup');
  assert.strictEqual(e.facts.reason_matches, 'tidak');
  assert.ok(e.note.includes('Media Konsumen'));
  assert.ok(e.evidence.length >= 5);
});

t('semua sumber punya url, tanggal, dan fakta', function () {
  assert.ok(SOURCES.length >= 2);
  SOURCES.forEach((item) => {
    assert.ok(item.url.startsWith('https://'));
    assert.ok(item.date.length > 4);
    assert.ok(Array.isArray(item.facts) && item.facts.length >= 2);
  });
});

t('semua label user-facing bebas em dash', function () {
  const all = JSON.stringify([PLATFORMS, REASONS, STATUSES, FACT_OPTIONS, EVIDENCE, SOURCES]);
  assert.ok(!all.includes('\u2014'));
  assert.ok(!buildExample(NOW).note.includes('\u2014'));
  assert.ok(!buildLetter(base(), NOW).body.includes('\u2014'));
});

t('kelima bukti kritis ditandai di metadata', function () {
  const critical = EVIDENCE.filter((item) => item.critical);
  assert.strictEqual(critical.length, 5);
  assert.deepStrictEqual(critical.map((item) => item.id), [
    'reason_screenshot', 'listing_before', 'product_photo', 'invoice', 'permit',
  ]);
});

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
