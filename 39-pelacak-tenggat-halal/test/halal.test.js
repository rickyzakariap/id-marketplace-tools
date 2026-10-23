// Unit tests for the halal deadline tracker. Run: node test/halal.test.js
const assert = require('assert');
const {
  analyze,
  readiness,
  buildExample,
  validate,
  deadlineFor,
  basisFor,
  statusFor,
  formatDateLong,
  formatDateShort,
  addDays,
  daysBetween,
  todayISO,
  CATEGORIES,
  SCALES,
  ORIGINS,
  RULES,
  READINESS_ITEMS,
  SOURCES,
  DEFAULTS,
  FACILITATION,
} = require('../lib/halal');

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

const NOW = new Date('2026-10-23T03:00:00Z');

function base(overrides) {
  return Object.assign({}, DEFAULTS, overrides || {});
}

t('tanggal dan selisih hari konsisten', function () {
  assert.strictEqual(formatDateLong('2028-10-17'), '17 Oktober 2028');
  assert.strictEqual(formatDateShort('2028-10-17'), '17 Okt 2028');
  assert.strictEqual(addDays('2028-10-17', -540), '2027-04-26');
  assert.strictEqual(daysBetween('2026-10-23', '2028-10-17'), 725);
  assert.strictEqual(todayISO(NOW), '2026-10-23');
});

t('tenggat UMK makanan dan minuman 17 Oktober 2028', function () {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.deadline, '2028-10-17');
  assert.strictEqual(r.deadline_kind, 'akhir');
  assert.strictEqual(r.days_left, 725);
  assert.strictEqual(r.status, 'ada-waktu');
  assert.ok(r.legal_basis.includes('Pasal 160 ayat (2)'));
  assert.strictEqual(r.self_declare.potential, true);
});

t('usaha menengah dan besar makanan sudah lewat tenggat 2024', function () {
  const r = analyze(base({ scale: 'menengah' }), NOW);
  assert.strictEqual(r.deadline, '2024-10-17');
  assert.strictEqual(r.status, 'lewat');
  assert.strictEqual(r.days_left, -736);
  assert.strictEqual(r.self_declare.potential, false);
  assert.ok(r.legal_basis.includes('tidak diubah'));
  assert.strictEqual(r.timeline.length, 0);
});

t('produk impor makanan mulai wajib 18 Oktober 2028', function () {
  const r = analyze(base({ import_status: 'impor', scale: 'besar' }), NOW);
  assert.strictEqual(r.deadline, '2028-10-18');
  assert.strictEqual(r.deadline_kind, 'mulai');
  assert.strictEqual(r.days_left, 726);
  assert.strictEqual(r.self_declare.potential, false);
  assert.ok(r.legal_basis.includes('Pasal 160 ayat (3)'));
});

t('jasa makanan dan minuman mulai wajib 18 Oktober 2028', function () {
  const r = analyze(base({ category: 'jasa_makanan_minuman' }), NOW);
  assert.strictEqual(r.deadline, '2028-10-18');
  assert.strictEqual(r.deadline_kind, 'mulai');
  assert.ok(r.legal_basis.includes('Pasal 160 ayat (1a)'));
  assert.strictEqual(r.self_declare.potential, false);
});

t('kosmetik memakai tenggat 2028 dan jalur reguler', function () {
  const r = analyze(base({ category: 'kosmetik' }), NOW);
  assert.strictEqual(r.deadline, '2028-10-17');
  assert.strictEqual(r.self_declare.potential, false);
  assert.ok(r.self_declare.label.includes('reguler'));
});

t('obat bebas 2029 dan obat keras 2034', function () {
  assert.strictEqual(analyze(base({ category: 'obat_bebas' }), NOW).deadline, '2029-10-17');
  assert.strictEqual(analyze(base({ category: 'obat_bebas_terbatas' }), NOW).deadline, '2029-10-17');
  assert.strictEqual(analyze(base({ category: 'obat_keras' }), NOW).deadline, '2034-10-17');
});

t('alat kesehatan kelas A, B, dan C punya tenggat berbeda', function () {
  assert.strictEqual(analyze(base({ category: 'alat_kesehatan_a' }), NOW).deadline, '2028-10-17');
  assert.strictEqual(analyze(base({ category: 'alat_kesehatan_b' }), NOW).deadline, '2029-10-17');
  assert.strictEqual(analyze(base({ category: 'alat_kesehatan_c' }), NOW).deadline, '2034-10-17');
});

t('barang gunaan tanpa unsur hewan tidak wajib sertifikasi', function () {
  const r = analyze(base({ category: 'barang_sandang', contains_animal: 'tidak' }), NOW);
  assert.strictEqual(r.required, false);
  assert.strictEqual(r.status, 'tidak-wajib');
  assert.ok(r.requirement_reason.includes('unsur hewan'));
  assert.strictEqual(r.timeline.length, 0);
});

t('barang gunaan dengan unsur hewan tetap wajib', function () {
  const r = analyze(base({ category: 'barang_sandang', contains_animal: 'ya' }), NOW);
  assert.strictEqual(r.required, true);
  assert.strictEqual(r.deadline, '2028-10-17');
  assert.ok(r.documents.some((doc) => doc.label.includes('unsur hewan')));
});

t('bahan haram tidak disertifikasi tetapi wajib label tidak halal', function () {
  const r = analyze(base({ contains_haram: 'ya' }), NOW);
  assert.strictEqual(r.required, false);
  assert.strictEqual(r.status, 'tidak-wajib');
  assert.ok(r.requirement_reason.includes('tidak halal'));
  assert.strictEqual(r.self_declare.potential, false);
});

t('produk yang sudah bersertifikat tidak punya timeline', function () {
  const r = analyze(base({ certified: 'sudah' }), NOW);
  assert.strictEqual(r.certified, true);
  assert.strictEqual(r.status, 'bersertifikat');
  assert.strictEqual(r.tone, 'aman');
  assert.strictEqual(r.timeline.length, 0);
  assert.strictEqual(r.documents.length, 0);
});

t('hasil sembelihan UMK hanya berpotensi SEHATI dengan syarat', function () {
  const r = analyze(base({ category: 'hasil_sembelihan' }), NOW);
  assert.strictEqual(r.self_declare.potential, true);
  assert.ok(r.self_declare.label.includes('syarat'));
  assert.ok(r.self_declare.reason.includes('RPH'));
});

t('self declare tidak berlaku untuk impor atau usaha menengah', function () {
  assert.strictEqual(analyze(base({ import_status: 'impor' }), NOW).self_declare.potential, false);
  assert.strictEqual(analyze(base({ scale: 'menengah' }), NOW).self_declare.potential, false);
});

t('ambang status memakai 180 dan 365 hari', function () {
  assert.strictEqual(statusFor(true, false, 'akhir', 181).status, 'segera');
  assert.strictEqual(statusFor(true, false, 'akhir', 180).status, 'mendesak');
  assert.strictEqual(statusFor(true, false, 'akhir', 365).status, 'segera');
  assert.strictEqual(statusFor(true, false, 'akhir', 366).status, 'ada-waktu');
  assert.strictEqual(statusFor(true, false, 'akhir', 0).status, 'mendesak');
  assert.strictEqual(statusFor(true, false, 'akhir', -1).status, 'lewat');
  assert.strictEqual(statusFor(true, false, 'mulai', 0).status, 'wajib');
  assert.strictEqual(statusFor(false, false, 'akhir', 10).status, 'tidak-wajib');
  assert.strictEqual(statusFor(true, true, 'akhir', -10).status, 'bersertifikat');
});

t('semua kategori punya tenggat yang bisa dihitung', function () {
  CATEGORIES.forEach(function (category) {
    const result = deadlineFor(category.id, 'mikro', 'dalam-negeri');
    assert.ok(result && result.date, 'tenggat kosong untuk ' + category.id);
    assert.ok(result.kind === 'akhir' || result.kind === 'mulai');
  });
  SCALES.forEach(function (scale) {
    assert.ok(deadlineFor('makanan_minuman', scale.id, 'dalam-negeri').date);
  });
  ORIGINS.forEach(function (origin) {
    assert.ok(deadlineFor('makanan_minuman', 'mikro', origin.id).date);
  });
});

t('dasar aturan sesuai kategori dan asal', function () {
  assert.ok(basisFor('makanan_minuman', 'mikro', 'dalam-negeri').includes('Pasal 160 ayat (2)'));
  assert.ok(basisFor('makanan_minuman', 'besar', 'dalam-negeri').includes('tidak diubah'));
  assert.ok(basisFor('makanan_minuman', 'mikro', 'impor').includes('Pasal 160 ayat (3)'));
  assert.ok(basisFor('jasa_makanan_minuman', 'mikro', 'dalam-negeri').includes('ayat (1a)'));
  assert.ok(basisFor('kosmetik', 'mikro', 'dalam-negeri').includes('Pasal 161'));
});

t('timeline UMK berisi lima milestone dan tanggal urut', function () {
  const r = analyze(base(), NOW);
  assert.strictEqual(r.timeline.length, 5);
  for (let i = 1; i < r.timeline.length; i += 1) {
    assert.ok(r.timeline[i].date > r.timeline[i - 1].date);
  }
  assert.ok(r.timeline.every((item) => item.days_left >= 0));
  assert.ok(r.timeline[0].tasks.length >= 2);
});

t('dokumen dasar dan tambahan sesuai kategori', function () {
  const food = analyze(base(), NOW);
  assert.strictEqual(food.documents.length, 11);
  const meat = analyze(base({ category: 'hasil_sembelihan' }), NOW);
  assert.ok(meat.documents.some((doc) => doc.label.includes('RPH')));
  const goods = analyze(base({ category: 'barang_sandang', contains_animal: 'ya' }), NOW);
  assert.ok(goods.documents.some((doc) => doc.label.includes('unsur hewan')));
});

t('validasi menolak kategori, skala, asal, dan jawaban kosong', function () {
  assert.ok(validate(base({ category: 'tidak-ada' })).includes('Kategori'));
  assert.ok(validate(base({ scale: 'raksasa' })).includes('Skala'));
  assert.ok(validate(base({ import_status: 'luar' })).includes('Asal'));
  assert.ok(validate(base({ certified: 'mungkin' })).includes('Status'));
  assert.ok(validate(base({ contains_haram: '' })).includes('haram'));
  assert.ok(validate(base({ category: 'barang_sandang', contains_animal: '' })).includes('hewan'));
  assert.strictEqual(validate(base()), '');
});

t('analisis menolak input tidak valid dengan pesan', function () {
  const r = analyze(base({ category: 'tidak-ada' }), NOW);
  assert.ok(r.error);
  assert.ok(r.error.includes('Kategori'));
});

t('kesiapan penuh mendapat skor 100', function () {
  const items = {};
  READINESS_ITEMS.forEach(function (item) { items[item.id] = true; });
  const r = readiness({ items });
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.done, r.total);
  assert.strictEqual(r.gaps.length, 0);
  assert.strictEqual(r.status, 'siap');
  assert.ok(r.next_steps[0].includes('SIHALAL'));
});

t('kesiapan sebagian menghitung celah dan langkah berikut', function () {
  const r = readiness({ items: { nib: true, sihalal: true, product_list: true } });
  assert.strictEqual(r.done, 3);
  assert.strictEqual(r.score, 25);
  assert.strictEqual(r.status, 'belum');
  assert.strictEqual(r.gaps.length, READINESS_ITEMS.length - 3);
  assert.ok(r.next_steps[0].includes('Lengkapi'));
});

t('kesiapan menolak payload kosong', function () {
  assert.ok(readiness({}).error);
  assert.ok(readiness({ items: [] }).error);
  assert.ok(readiness(null).error);
});

t('contoh isian dan meta konsisten', function () {
  const example = buildExample();
  assert.strictEqual(example.category, 'makanan_minuman');
  assert.strictEqual(example.scale, 'mikro');
  assert.ok(validate(example) === '');
  assert.strictEqual(RULES.length, 9);
  assert.strictEqual(CATEGORIES.length, 18);
  assert.strictEqual(SOURCES.length, 8);
  assert.strictEqual(FACILITATION.value, 230000);
  assert.strictEqual(FACILITATION.code, 'SEHATI26');
});

t('setiap sumber punya URL, tanggal, dan penerbit', function () {
  SOURCES.forEach(function (source) {
    assert.ok(source.url.startsWith('https://'));
    assert.ok(source.date.length > 4);
    assert.ok(source.publisher.length > 2);
  });
});

t('tidak ada em dash di teks hasil analisis', function () {
  const r = analyze(base(), NOW);
  const text = JSON.stringify(r) + JSON.stringify(RULES) + JSON.stringify(READINESS_ITEMS) + JSON.stringify(SOURCES);
  assert.strictEqual(text.indexOf('\u2014'), -1);
});

t('status teks tidak kosong untuk semua cabang', function () {
  const cases = [
    base(),
    base({ scale: 'menengah' }),
    base({ certified: 'sudah' }),
    base({ contains_haram: 'ya' }),
    base({ category: 'barang_sandang', contains_animal: 'tidak' }),
    base({ import_status: 'impor' }),
  ];
  cases.forEach(function (input) {
    const r = analyze(input, NOW);
    assert.ok(r.status_label);
    assert.ok(r.status_detail);
    assert.ok(r.days_left_label);
  });
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
