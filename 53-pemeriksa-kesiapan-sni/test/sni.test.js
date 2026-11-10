'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tool = require('../lib/sni');

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

function evidenceIds() {
  return tool.EVIDENCE.map((item) => item.id);
}

test('meta memuat 8 produk wajib SNI, 4 peran, bukti, status, surat, dan sumber', () => {
  const data = tool.meta();
  assert.strictEqual(data.products.length, 9);
  assert.strictEqual(data.products.filter((item) => item.mandatory).length, 8);
  assert.strictEqual(data.roles.length, 4);
  assert.strictEqual(data.marketplaces.length, 6);
  assert.strictEqual(data.case_statuses.length, 8);
  assert.strictEqual(data.case_statuses.filter((item) => item.open).length, 5);
  assert.strictEqual(data.letter_types.length, 3);
  assert.strictEqual(data.evidence.length, 14);
  assert.strictEqual(data.rules.covered_products, 8);
  assert.ok(data.rules.scope_note.indexOf('8 produk') !== -1);
  assert.ok(data.rules.disclaimer.indexOf('bukan putusan hukum') !== -1);
  assert.ok(data.sources.length >= 4);
  data.sources.forEach((item) => {
    assert.ok(item.title.length > 10);
    assert.ok(item.url.startsWith('https://'));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    assert.ok(item.facts.length > 20);
  });
});

test('nomor SNI dan dasar aturan sesuai daftar sumber', () => {
  const byId = {};
  tool.PRODUCTS.forEach((item) => { byId[item.id] = item; });
  assert.strictEqual(byId.melamin.sni, 'SNI 7322:2008');
  assert.strictEqual(byId.melamin.regulation, 'Permenperin 60/2024');
  assert.strictEqual(byId.helm.sni, 'SNI 1811:2007 dan SNI 1811-2007/Amd1:2010');
  assert.strictEqual(byId.helm.regulation, 'Permenperin 59/2024');
  assert.strictEqual(byId['tangki-air'].sni, 'SNI 7276:2020');
  assert.strictEqual(byId['tangki-air'].regulation, 'Permenperin 50/2024');
  assert.ok(byId.ban.regulation.indexOf('Permenperin 24/2026') !== -1);
  assert.ok(byId.ban.regulation.indexOf('17 September 2026') !== -1);
  assert.strictEqual(byId.minyak_lumas, undefined);
  assert.strictEqual(byId['minyak-lumas'].regulation, 'Permenperin 8/2025');
  assert.strictEqual(byId.lain.mandatory, false);
});

test('meta, contoh, analisis, surat, dan CSV tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    tool.letter(base({ letter_type: 'pemasok' })).body,
    tool.letter(base({ letter_type: 'klarifikasi' })).body,
    tool.letter(base({ letter_type: 'marketplace' })).body,
    tool.csvRows([Object.assign(base({}), { id: 's1' })]),
  ];
  texts.forEach((text) => {
    assert.strictEqual(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});

test('contoh menghitung modal tertahan, omzet, dan verdict risiko tinggi', () => {
  const result = analyze({});
  assert.strictEqual(result.product.id, 'melamin');
  assert.strictEqual(result.product.sni, 'SNI 7322:2008');
  assert.strictEqual(result.role_label, 'Pedagang atau reseller');
  assert.strictEqual(result.marketplace_label, 'Shopee');
  assert.strictEqual(result.selling_now_label, 'Ya');
  assert.strictEqual(result.exposure.stock_units, 240);
  assert.strictEqual(result.exposure.unit_cost, 35000);
  assert.strictEqual(result.exposure.stuck_capital, 8400000);
  assert.strictEqual(result.exposure.monthly_revenue, 12000000);
  assert.strictEqual(result.exposure.annual_revenue, 144000000);
  assert.strictEqual(result.evidence.score, 64);
  assert.strictEqual(result.evidence.label, 'Sebagian siap');
  assert.strictEqual(result.evidence.critical_count, 5);
  assert.strictEqual(result.evidence.total_count, 9);
  assert.strictEqual(result.verdict.level, 'ember');
  assert.strictEqual(result.verdict.label, 'Risiko tinggi, hentikan penjualan sementara');
  assert.ok(result.verdict.note.indexOf('PP 34/2018') !== -1);
  assert.deepStrictEqual(
    result.evidence.missing_critical.map((item) => item.id),
    ['number_match', 'supplier_proof']
  );
});

test('jumlah bukti dan bukti kritis berbeda per peran', () => {
  assert.strictEqual(tool.readiness({ role: 'pedagang', evidence: [] }).total_count, 9);
  assert.strictEqual(tool.readiness({ role: 'pedagang', evidence: [] }).critical_count, 5);
  assert.strictEqual(tool.readiness({ role: 'produsen', evidence: [] }).total_count, 10);
  assert.strictEqual(tool.readiness({ role: 'produsen', evidence: [] }).critical_count, 6);
  assert.strictEqual(tool.readiness({ role: 'importir', evidence: [] }).total_count, 11);
  assert.strictEqual(tool.readiness({ role: 'importir', evidence: [] }).critical_count, 6);
  assert.strictEqual(tool.readiness({ role: 'maklun', evidence: [] }).total_count, 11);
  assert.strictEqual(tool.readiness({ role: 'maklun', evidence: [] }).critical_count, 7);
});

test('semua bukti pada peran pedagang menghasilkan skor 100 dan siap', () => {
  const result = analyze({
    role: 'pedagang',
    evidence: evidenceIds(),
  });
  assert.strictEqual(result.evidence.score, 100);
  assert.strictEqual(result.evidence.label, 'Siap');
  assert.strictEqual(result.verdict.level, 'ok');
  assert.strictEqual(result.verdict.label, 'Siap diperiksa');
  assert.strictEqual(result.evidence.missing_critical.length, 0);
});

test('semua bukti kritis tanpa bukti pendukung masih hampir siap', () => {
  const result = analyze({
    role: 'pedagang',
    evidence: ['sni_certificate', 'sppt_sni', 'sni_mark', 'number_match', 'supplier_proof'],
  });
  assert.strictEqual(result.evidence.score, 71);
  assert.strictEqual(result.evidence.label, 'Hampir siap');
  assert.strictEqual(result.verdict.label, 'Hampir siap, lengkapi bukti');
  assert.strictEqual(result.verdict.level, 'signal');
});

test('produsen wajib punya akun SIINas sebagai bukti kritis', () => {
  const evidence = evidenceIds().filter((id) => id !== 'siinas_account');
  const result = analyze({ role: 'produsen', evidence: evidence });
  assert.ok(
    result.evidence.missing_critical.some((item) => item.id === 'siinas_account')
  );
  assert.strictEqual(result.verdict.level, 'ember');
});

test('importir wajib membuktikan perwakilan resmi', () => {
  const evidence = evidenceIds().filter((id) => id !== 'official_rep');
  const result = analyze({ role: 'importir', evidence: evidence });
  assert.ok(result.evidence.missing_critical.some((item) => item.id === 'official_rep'));
  assert.ok(result.obligations.some((item) => item.indexOf('perwakilan resmi') !== -1));
});

test('pemilik merek maklun wajib punya lisensi merek DJKI', () => {
  const evidence = evidenceIds().filter((id) => id !== 'trademark_license');
  const result = analyze({ role: 'maklun', evidence: evidence });
  assert.ok(
    result.evidence.missing_critical.some((item) => item.id === 'trademark_license')
  );
  assert.ok(result.obligations.some((item) => item.indexOf('DJKI') !== -1));
});

test('produk tidak dijual dan status tidak diketahui memberi verdict berbeda', () => {
  const notSelling = analyze({ selling_now: 'tidak', evidence: [] });
  assert.strictEqual(notSelling.verdict.level, 'signal');
  assert.strictEqual(notSelling.verdict.label, 'Bukti kritis belum lengkap');

  const unsure = analyze({ selling_now: 'tidak_tahu', evidence: [] });
  assert.strictEqual(unsure.verdict.level, 'signal');
  assert.strictEqual(unsure.verdict.label, 'Status penjualan belum jelas');
});

test('produk di luar daftar tidak disimpulkan bebas SNI', () => {
  const result = analyze({ product: 'lain', evidence: [] });
  assert.strictEqual(result.product.mandatory, false);
  assert.strictEqual(result.verdict.level, 'signal');
  assert.strictEqual(result.verdict.label, 'Perlu cek daftar resmi');
  assert.ok(result.verdict.note.indexOf('belum tentu bebas SNI') !== -1);
  assert.ok(
    result.recommendations.some((item) => item.indexOf('daftar SNI wajib Kemenperin') !== -1)
  );
});

test('produk tidak dikenal jatuh ke opsi lain, bukan produk wajib pertama', () => {
  const input = tool.normalizeInput({ product: 'tidak-ada', role: 'tidak-ada' });
  assert.strictEqual(input.product, 'lain');
  assert.strictEqual(input.role, 'pedagang');
  assert.strictEqual(input.marketplace, 'shopee');
  assert.strictEqual(input.selling_now, 'tidak_tahu');
});

test('validasi menolak stok dan nominal negatif atau stok pecahan', () => {
  assert.throws(() => analyze({ stock_units: -1 }), /Jumlah stok harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ stock_units: 1.5 }), /Jumlah stok harus berupa bilangan bulat/);
  assert.throws(() => analyze({ stock_units: 'abc' }), /Jumlah stok harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ unit_cost: -1 }), /Harga modal per unit harus berupa angka 0 atau lebih/);
  assert.throws(() => analyze({ monthly_revenue: -1 }), /Omzet produk per bulan harus berupa angka 0 atau lebih/);
});

test('stok nol dan omzet nol tetap valid sebagai nilai finansial', () => {
  const result = analyze({ stock_units: 0, unit_cost: 0, monthly_revenue: 0 });
  assert.strictEqual(result.exposure.stuck_capital, 0);
  assert.strictEqual(result.exposure.monthly_revenue, 0);
  assert.strictEqual(result.exposure.annual_revenue, 0);
});

test('normalisasi membuang bukti tidak dikenal dan merapikan teks', () => {
  const input = tool.normalizeInput({
    store_name: '  Toko  ',
    evidence: ['sni_certificate', 'bukti_asing', 'sni_certificate'],
  });
  assert.strictEqual(input.store_name, 'Toko');
  assert.deepStrictEqual(input.evidence, ['sni_certificate']);
  assert.strictEqual(input.stock_units, 0);
  assert.strictEqual(input.unit_cost, 0);
  assert.strictEqual(input.monthly_revenue, 0);
});

test('kesiapan bukti tanpa bukti bernilai nol dan belum siap', () => {
  const none = tool.readiness({ role: 'pedagang', items: [] });
  assert.strictEqual(none.score, 0);
  assert.strictEqual(none.label, 'Belum siap');
  assert.strictEqual(none.missing_critical.length, 5);
});

test('tabel produk menandai produk yang dipilih', () => {
  const rows = tool.productTable('helm');
  assert.strictEqual(rows.length, 8);
  assert.strictEqual(rows.find((item) => item.id === 'helm').selected, true);
  assert.strictEqual(rows.find((item) => item.id === 'melamin').selected, false);
  assert.ok(rows.find((item) => item.id === 'helm').regulation.indexOf('Permenperin 59/2024') !== -1);
});

test('surat pemasok memuat nomor SNI, aturan, nilai stok, dan bukti kurang', () => {
  const result = tool.letter(base({ letter_type: 'pemasok' }));
  assert.strictEqual(result.type, 'pemasok');
  assert.ok(result.subject.indexOf('Permintaan salinan sertifikat SNI') !== -1);
  assert.ok(result.body.indexOf('SNI 7322:2008') !== -1);
  assert.ok(result.body.indexOf('Permenperin 60/2024') !== -1);
  assert.ok(result.body.indexOf('Rp 8.400.000') !== -1);
  assert.ok(result.body.indexOf('Kecocokan nomor SNI') !== -1);
  assert.ok(result.body.indexOf('Nomor SNI dan nomor sertifikat SNI yang berbeda') !== -1);
  assert.ok(result.body.indexOf('TKT-2026-1110') !== -1);
});

test('surat klarifikasi LSPro dan marketplace memakai data yang benar', () => {
  const lspro = tool.letter(base({ letter_type: 'klarifikasi' }));
  assert.ok(lspro.subject.indexOf('klarifikasi kesiapan sertifikasi') !== -1);
  assert.ok(lspro.body.indexOf('Lembaga Sertifikasi Produk') !== -1);
  assert.ok(lspro.body.indexOf('SIINas') !== -1);

  const market = tool.letter(base({ letter_type: 'marketplace' }));
  assert.ok(market.subject.indexOf('Klarifikasi kelengkapan dokumen SNI') !== -1);
  assert.ok(market.body.indexOf('Seller Support') !== -1);
  assert.ok(market.body.indexOf('Shopee') !== -1);
  assert.ok(market.body.indexOf('tidak meminta pengecualian') !== -1);
});

test('surat memakai nilai bawaan saat identitas toko kosong', () => {
  const result = tool.letter(base({
    store_name: '',
    seller_name: '',
    contact: '',
    ticket: '',
    letter_type: 'pemasok',
  }));
  assert.ok(result.body.indexOf('Toko saya') !== -1);
  assert.ok(result.body.indexOf('Saya Penjual') !== -1);
  assert.ok(result.body.indexOf('Nomor tiket') === -1);
});

test('ringkasan kasus menghitung terbuka, risiko tinggi, dan modal tertahan', () => {
  const open = Object.assign(base({}), {
    id: 's1',
    status: 'cek_dokumen',
    note: 'Kasus contoh.',
  });
  const closed = Object.assign(base({
    evidence: evidenceIds(),
    stock_units: 10,
    unit_cost: 1000,
    selling_now: 'ya',
  }), {
    id: 's2',
    status: 'selesai',
    note: '',
  });

  const summary = tool.summarizeCases([open, closed]);
  assert.strictEqual(summary.total, 2);
  assert.strictEqual(summary.open_cases, 1);
  assert.strictEqual(summary.high_risk, 1);
  assert.strictEqual(summary.missing_evidence, 1);
  assert.strictEqual(summary.total_stuck_capital, 8400000);
  assert.strictEqual(summary.total_monthly_revenue, 12000000);
  assert.strictEqual(summary.cases[0].status_label, 'Cek dokumen');
  assert.strictEqual(summary.cases[1].status_label, 'Selesai');
  assert.strictEqual(summary.cases[1].readiness_score, 100);
  assert.strictEqual(summary.cases[1].verdict.level, 'ok');
});

test('CSV memakai header, escape, dan netralisasi formula', () => {
  const rows = [Object.assign(base({}), {
    id: 's1',
    store_name: 'Toko, "Uji"',
    status: 'cek_dokumen',
    note: '=SUM(A1)',
  })];
  const csv = tool.csvRows(rows);
  const lines = csv.split('\n');
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[0].indexOf('modal_tertahan') !== -1);
  assert.ok(lines[0].indexOf('bukti_kritis_kurang') !== -1);
  assert.ok(lines[1].indexOf('"Toko, ""Uji"""') !== -1);
  assert.ok(lines[1].indexOf("'=SUM(A1)") !== -1);
  assert.ok(lines[1].indexOf('Risiko tinggi') !== -1);
});

test('format rupiah dan pembulatan memakai gaya Indonesia', () => {
  assert.strictEqual(tool.formatRupiah(8400000), 'Rp 8.400.000');
  assert.strictEqual(tool.formatRupiah(0), 'Rp 0');
  assert.strictEqual(tool.round2(2.345), 2.35);
});

test('semua id yang dipakai script ada di HTML dan tidak duplikat', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const ids = [];
  const idPattern = /id="([^"]+)"/g;
  let match = idPattern.exec(html);
  while (match) {
    ids.push(match[1]);
    match = idPattern.exec(html);
  }
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, 'ada id duplikat');
  const used = new Set();
  const usePattern = /\$\('([^']+)'\)/g;
  match = usePattern.exec(html);
  while (match) {
    used.add(match[1]);
    match = usePattern.exec(html);
  }
  used.forEach((id) => {
    assert.ok(unique.has(id), 'id tidak ditemukan: ' + id);
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
