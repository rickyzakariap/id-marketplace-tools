'use strict';

const assert = require('assert');
const tool = require('../lib/take-rate');

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

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat platform, kategori, benchmark, aturan, dan sumber', () => {
  const data = tool.meta();
  assert.strictEqual(data.platforms.length, 3);
  assert.strictEqual(data.categories.length, 3);
  assert.strictEqual(data.store_types.length, 2);
  assert.strictEqual(data.case_statuses.length, 8);
  assert.strictEqual(data.case_statuses.filter((item) => item.open).length, 5);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.evidence.length, 11);
  assert.strictEqual(data.evidence.filter((item) => item.critical).length, 4);
  assert.strictEqual(data.indicators.length, 14);
  assert.strictEqual(data.rules.tolerance_pp, 1);
  assert.strictEqual(data.rules.watch_pp, 2);
  assert.strictEqual(data.rules.default_periods, 12);
  assert.strictEqual(data.rules.benchmark_segment, 'Non-Mall');
  assert.ok(data.rules.scope_note.indexOf('tidak termasuk') !== -1);
  assert.ok(data.sources.length >= 4);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    assert.ok(item.facts.length > 20);
  });
});

test('benchmark sumber sesuai angka Databoks kuartal II 2026', () => {
  assert.deepStrictEqual(tool.BENCHMARKS.fashion, {
    shopee: 17.43,
    tiktok: 14.43,
    lazada: 9.13,
  });
  assert.deepStrictEqual(tool.BENCHMARKS.fmcg, {
    shopee: 18.55,
    tiktok: 14.68,
    lazada: 8.25,
  });
  assert.deepStrictEqual(tool.BENCHMARKS.elektronik, {
    shopee: 17.93,
    tiktok: 13.3,
    lazada: 7.63,
  });
});

test('meta, contoh, surat, dan CSV tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.letter(base({ letter_type: 'rincian' })).body,
    tool.letter(base({ letter_type: 'keberatan' })).body,
    tool.letter(base({ letter_type: 'eskalasi' })).body,
    tool.csvRows([Object.assign(base({}), { id: 'r1' })]),
  ];
  texts.forEach((text) => {
    assert.strictEqual(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});

test('contoh menghasilkan take rate 19 persen dan selisih 1,57 poin', () => {
  const result = analyze({});
  assert.strictEqual(result.platform_label, 'Shopee');
  assert.strictEqual(result.category_label, 'Fashion');
  assert.strictEqual(result.store_type_label, 'Non-Mall');
  assert.strictEqual(result.benchmark.rate, 17.43);
  assert.strictEqual(result.benchmark.is_override, false);
  assert.strictEqual(result.benchmark.segment, 'Non-Mall');
  assert.strictEqual(result.actual.take_fee, 28500000);
  assert.strictEqual(result.actual.take_rate, 19);
  assert.strictEqual(result.gap.pp, 1.57);
  assert.strictEqual(result.gap.rp_month, 2355000);
  assert.strictEqual(result.gap.rp_year, 28260000);
  assert.strictEqual(result.gap.periods_per_year, 12);
  assert.strictEqual(result.gap.direction, 'above');
  assert.strictEqual(result.outside.total, 18750000);
  assert.strictEqual(result.outside.rate, 12.5);
  assert.strictEqual(result.outside.program_rate, 4);
  assert.strictEqual(result.outside.ads_rate, 6);
  assert.strictEqual(result.all_in.total, 47250000);
  assert.strictEqual(result.all_in.rate, 31.5);
  assert.strictEqual(result.verdict.label, 'Sedikit di atas benchmark');
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.score.value, 28);
  assert.strictEqual(result.score.label, 'Sedang');
  assert.strictEqual(result.evidence.score, 67);
  assert.strictEqual(result.evidence.label, 'Hampir siap');
  assert.strictEqual(result.evidence.missing_critical.length, 0);
});

test('take rate tepat di benchmark menghasilkan verdict sesuai', () => {
  const result = analyze({
    gross_sales: 100000000,
    commission_fee: 12000000,
    transaction_fee: 5430000,
    program_fee: 0,
    ads_fee: 0,
    logistics_fee: 0,
    tax_fee: 0,
    fixed_fee: 0,
    evidence: [],
  });
  assert.strictEqual(result.actual.take_rate, 17.43);
  assert.strictEqual(result.gap.pp, 0);
  assert.strictEqual(result.gap.direction, 'match');
  assert.strictEqual(result.verdict.label, 'Sesuai benchmark');
  assert.strictEqual(result.verdict.level, 'ok');
  assert.strictEqual(result.score.value, 0);
  assert.strictEqual(result.score.label, 'Rendah');
});

test('selisih di atas 2 poin memicu verdict dan nominal tahunan', () => {
  const result = analyze({
    gross_sales: 100000000,
    commission_fee: 18000000,
    transaction_fee: 3200000,
    program_fee: 0,
    ads_fee: 0,
    logistics_fee: 0,
    tax_fee: 0,
    fixed_fee: 0,
    evidence: [],
  });
  assert.strictEqual(result.actual.take_rate, 21.2);
  assert.strictEqual(result.gap.pp, 3.77);
  assert.strictEqual(result.gap.rp_month, 3770000);
  assert.strictEqual(result.gap.rp_year, 45240000);
  assert.strictEqual(result.verdict.label, 'Di atas benchmark');
  assert.strictEqual(result.verdict.level, 'ember');
  assert.strictEqual(result.indicators.find((item) => item.id === 'above_watch').triggered, true);
  assert.strictEqual(result.indicators.find((item) => item.id === 'above_high').triggered, false);
  assert.strictEqual(result.score.value, 25);
});

test('selisih jauh di bawah benchmark tidak langsung disimpulkan aman', () => {
  const result = analyze({
    gross_sales: 100000000,
    commission_fee: 8000000,
    transaction_fee: 2000000,
    program_fee: 0,
    ads_fee: 0,
    logistics_fee: 0,
    tax_fee: 0,
    fixed_fee: 0,
    evidence: [],
  });
  assert.strictEqual(result.actual.take_rate, 10);
  assert.strictEqual(result.gap.pp, -7.43);
  assert.strictEqual(result.gap.direction, 'below');
  assert.strictEqual(result.verdict.label, 'Di bawah benchmark');
  assert.strictEqual(result.verdict.level, 'muted');
  assert.strictEqual(result.indicators.find((item) => item.id === 'below_watch').triggered, true);
  assert.ok(
    result.recommendations.some((item) => item.indexOf('data belum lengkap') !== -1)
  );
});

test('cakupan biaya belum dikonfirmasi menahan kesimpulan', () => {
  const result = analyze({ scope_confirmed: 'tidak_tahu' });
  assert.strictEqual(result.verdict.label, 'Cek cakupan biaya dulu');
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.indicators.find((item) => item.id === 'scope_unconfirmed').triggered, true);
});

test('toko Mall diberi peringatan benchmark non-Mall', () => {
  const result = analyze({ store_type: 'mall' });
  assert.strictEqual(result.store_type_label, 'Mall');
  assert.strictEqual(result.verdict.label, 'Benchmark non-Mall');
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.indicators.find((item) => item.id === 'mall_store').triggered, true);
  assert.ok(result.recommendations.some((item) => item.indexOf('non-Mall') !== -1));
});

test('komisi dan biaya transaksi nol menghasilkan data belum lengkap', () => {
  const result = analyze({ commission_fee: 0, transaction_fee: 0 });
  assert.strictEqual(result.actual.take_fee, 0);
  assert.strictEqual(result.verdict.label, 'Data belum lengkap');
  assert.strictEqual(result.verdict.level, 'muted');
  assert.strictEqual(result.indicators.find((item) => item.id === 'zero_commission').triggered, true);
  assert.strictEqual(result.indicators.find((item) => item.id === 'zero_transaction').triggered, true);
  assert.ok(
    result.recommendations.some((item) => item.indexOf('Jangan memakai total potongan') !== -1)
  );
});

test('benchmark manual dipakai dan ditandai override', () => {
  const result = analyze({ benchmark_rate: 20 });
  assert.strictEqual(result.benchmark.rate, 20);
  assert.strictEqual(result.benchmark.is_override, true);
  assert.strictEqual(result.gap.pp, -1);
  assert.strictEqual(result.gap.direction, 'match');
  assert.strictEqual(result.indicators.find((item) => item.id === 'benchmark_override').triggered, true);
  assert.strictEqual(result.verdict.label, 'Sesuai benchmark');
});

test('benchmark mengikuti kategori dan platform yang dipilih', () => {
  const result = analyze({
    platform: 'lazada',
    category: 'elektronik',
    gross_sales: 100000000,
    commission_fee: 5000000,
    transaction_fee: 2630000,
    program_fee: 0,
    ads_fee: 0,
    logistics_fee: 0,
    tax_fee: 0,
    fixed_fee: 0,
    evidence: [],
  });
  assert.strictEqual(result.platform_label, 'Lazada');
  assert.strictEqual(result.category_label, 'Elektronik');
  assert.strictEqual(result.benchmark.rate, 7.63);
  assert.strictEqual(result.actual.take_rate, 7.63);
  assert.strictEqual(result.gap.pp, 0);
});

test('validasi menolak periode dan omzet yang tidak valid', () => {
  assert.throws(() => analyze({ period: '' }), /Periode wajib diisi/);
  assert.throws(() => analyze({ period: '2026-13' }), /Periode wajib diisi/);
  assert.throws(() => analyze({ gross_sales: null }), /Omzet kotor wajib diisi/);
  assert.throws(() => analyze({ gross_sales: 0 }), /Omzet kotor harus berupa angka lebih dari 0/);
  assert.throws(() => analyze({ gross_sales: -1 }), /Omzet kotor harus berupa angka lebih dari 0/);
  assert.throws(() => analyze({ gross_sales: 'abc' }), /Omzet kotor harus berupa angka lebih dari 0/);
});

test('validasi menolak biaya negatif dan benchmark di luar 0 sampai 100', () => {
  assert.throws(() => analyze({ commission_fee: -1 }), /Komisi platform harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ transaction_fee: -1 }), /Biaya transaksi harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ benchmark_rate: 101 }), /Benchmark harus berupa angka antara 0 dan 100/);
  assert.throws(() => analyze({ benchmark_rate: -1 }), /Benchmark harus berupa angka antara 0 dan 100/);
  assert.throws(() => analyze({ periods_per_year: 0 }), /Periode per tahun harus antara 1 dan 12/);
  assert.throws(() => analyze({ periods_per_year: 13 }), /Periode per tahun harus antara 1 dan 12/);
});

test('normalisasi membuang bukti tidak dikenal dan merapikan teks', () => {
  const input = tool.normalizeInput({
    store_name: '  Toko  ',
    platform: 'tidak_ada',
    category: 'tidak_ada',
    store_type: 'tidak_ada',
    category_confidence: 'tidak_ada',
    period: '2026-11',
    evidence: ['order_detail', 'settlement_report', 'settlement_report'],
  });
  assert.strictEqual(input.store_name, 'Toko');
  assert.strictEqual(input.platform, 'shopee');
  assert.strictEqual(input.category, 'fashion');
  assert.strictEqual(input.store_type, 'non_mall');
  assert.strictEqual(input.category_confidence, 'ya');
  assert.deepStrictEqual(input.evidence, ['settlement_report']);
  assert.strictEqual(input.gross_sales, null);
  assert.strictEqual(input.commission_fee, 0);
  assert.strictEqual(input.scope_confirmed, 'tidak_tahu');
});

test('kesiapan bukti memberi skor dan label bertingkat', () => {
  const none = tool.readiness({ items: [] });
  assert.strictEqual(none.score, 0);
  assert.strictEqual(none.label, 'Belum siap');
  assert.strictEqual(none.missing_critical.length, 4);

  const oneCritical = tool.readiness({ items: ['settlement_report'] });
  assert.strictEqual(oneCritical.score, 13);
  assert.strictEqual(oneCritical.label, 'Belum siap');

  const allCritical = tool.readiness({
    items: ['settlement_report', 'fee_detail', 'transaction_detail', 'gross_sales_report'],
  });
  assert.strictEqual(allCritical.score, 53);
  assert.strictEqual(allCritical.label, 'Hampir siap');
  assert.strictEqual(allCritical.missing_critical.length, 0);

  const all = tool.readiness({ items: tool.EVIDENCE.map((item) => item.id) });
  assert.strictEqual(all.score, 100);
  assert.strictEqual(all.label, 'Siap');
  assert.strictEqual(all.checked_count, all.total_count);
});

test('tabel benchmark menandai kategori yang dipilih', () => {
  const rows = tool.benchmarkTable('fmcg');
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows.find((item) => item.category === 'fmcg').selected, true);
  assert.strictEqual(rows.find((item) => item.category === 'fashion').selected, false);
  assert.strictEqual(rows.find((item) => item.category === 'fmcg').shopee, 18.55);
});

test('surat rincian, keberatan, dan eskalasi memuat angka yang benar', () => {
  const rincian = tool.letter(base({ letter_type: 'rincian' }));
  assert.strictEqual(rincian.type, 'rincian');
  assert.ok(rincian.subject.indexOf('Permintaan rincian') !== -1);
  assert.ok(rincian.body.indexOf('Take rate aktual: 19%') !== -1);
  assert.ok(rincian.body.indexOf('17,43%') !== -1);
  assert.ok(rincian.body.indexOf('1,57 poin') !== -1);
  assert.ok(rincian.body.indexOf('TKT-2026-1109') !== -1);
  assert.ok(rincian.body.indexOf('bukan batas resmi') === -1);
  assert.ok(rincian.body.indexOf('tidak menyimpulkan adanya pelanggaran') !== -1);

  const keberatan = tool.letter(base({ letter_type: 'keberatan' }));
  assert.ok(keberatan.subject.indexOf('Keberatan') !== -1);
  assert.ok(keberatan.body.indexOf('Rp 2.355.000') !== -1);
  assert.ok(keberatan.body.indexOf('bukan batas resmi') !== -1);

  const eskalasi = tool.letter(base({ letter_type: 'eskalasi' }));
  assert.ok(eskalasi.subject.indexOf('Eskalasi') !== -1);
  assert.ok(eskalasi.body.indexOf('Rp 28.260.000 per tahun') !== -1);
  assert.ok(eskalasi.body.indexOf('Status bukti saat ini: 67 persen') !== -1);
  assert.ok(eskalasi.body.indexOf('Seluruh bukti kritis sudah tersedia') !== -1);
});

test('surat memakai nilai bawaan saat identitas toko kosong', () => {
  const result = tool.letter(base({
    store_name: '',
    seller_name: '',
    contact: '',
    ticket: '',
    letter_type: 'rincian',
  }));
  assert.ok(result.body.indexOf('Toko saya') !== -1);
  assert.ok(result.body.indexOf('Saya Penjual') !== -1);
  assert.ok(result.body.indexOf('(periode belum diisi)') === -1);
  assert.ok(result.body.indexOf('Nomor tiket') === -1);
});

test('ringkasan kasus menghitung kasus terbuka dan selisih positif', () => {
  const open = Object.assign(base({}), {
    id: 'r1',
    status: 'analisis',
    note: 'Kasus contoh.',
  });
  const closed = Object.assign(base({
    gross_sales: 100000000,
    commission_fee: 12000000,
    transaction_fee: 5430000,
    program_fee: 0,
    ads_fee: 0,
    logistics_fee: 0,
    tax_fee: 0,
    fixed_fee: 0,
    evidence: [],
  }), {
    id: 'r2',
    status: 'selesai',
    note: '',
  });

  const summary = tool.summarizeCases([open, closed]);
  assert.strictEqual(summary.total, 2);
  assert.strictEqual(summary.open_cases, 1);
  assert.strictEqual(summary.above_benchmark, 1);
  assert.strictEqual(summary.missing_evidence, 0);
  assert.strictEqual(summary.total_gap_month, 2355000);
  assert.strictEqual(summary.total_gap_year, 28260000);
  assert.strictEqual(summary.cases[0].status_label, 'Sudah dianalisis');
  assert.strictEqual(summary.cases[1].status_label, 'Selesai');
  assert.strictEqual(summary.cases[1].gap_pp, 0);
});

test('CSV memakai header, escape, dan netralisasi formula', () => {
  const rows = [Object.assign(base({}), {
    id: 'r1',
    store_name: 'Toko, "Uji"',
    status: 'analisis',
    note: '=SUM(A1)',
  })];
  const csv = tool.csvRows(rows);
  const lines = csv.split('\n');
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[0].indexOf('selisih_poin') !== -1);
  assert.ok(lines[0].indexOf('selisih_rp_bulan') !== -1);
  assert.ok(lines[1].indexOf('"Toko, ""Uji"""') !== -1);
  assert.ok(lines[1].indexOf("'=SUM(A1)") !== -1);
  assert.ok(lines[1].indexOf('Sedikit di atas benchmark') !== -1);
});

test('format angka memakai gaya Indonesia', () => {
  assert.strictEqual(tool.formatRupiah(2355000), 'Rp 2.355.000');
  assert.strictEqual(tool.formatPercent(17.43), '17,43%');
  assert.strictEqual(tool.formatPercent(19), '19%');
  assert.strictEqual(tool.formatPoints(1.57), '1,57 poin');
  assert.strictEqual(tool.round2(2.345), 2.35);
});

test('contoh memakai periode bulan sebelumnya', () => {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  const expected = String(year) + '-' + String(month).padStart(2, '0');
  assert.strictEqual(tool.example().period, expected);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
