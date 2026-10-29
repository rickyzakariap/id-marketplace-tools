'use strict';

const assert = require('node:assert');
const {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  editWindow,
  readiness,
  summary,
  validateCase,
  todayISO,
  addDays,
  formatRupiah,
} = require('../lib/reviews');

const NOW = new Date('2026-10-28T03:00:00Z');
const TODAY = todayISO(NOW);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('ok ' + passed + ' - ' + name);
  } catch (error) {
    failed += 1;
    console.error('not ok - ' + name);
    console.error(error && error.message ? error.message : error);
  }
}

function baseInput(overrides) {
  const base = {
    platform: 'shopee',
    store_name: 'Toko Uji',
    store_id: 'toko-uji',
    status: 'baru',
    order_date: '2026-09-18',
    review_date: '2026-09-28',
    resolved_date: '',
    last_follow_up: '',
    current_rating: 4.9,
    total_ratings: 320,
    bad_reviews: 1,
    target_rating: 4.9,
    review_type: 'product_quality',
    price: 45000,
    cost: 30000,
    units_before: 18,
    units_during: 12,
    facts: {
      buyer_denies: 'ya',
      review_text_match: 'tanpa_teks',
      order_status: 'selesai',
      address_valid: 'tidak_tahu',
      burst: 'tidak',
      same_account: 'tidak_tahu',
      identity_abuse: 'tidak_tahu',
      chat_reply: 'tidak_dibalas',
    },
    evidence: [
      'review_screenshot', 'order_screenshot', 'buyer_statement', 'chat_history', 'tickets',
    ],
  };
  const merged = Object.assign({}, base, overrides || {});
  if (overrides && overrides.facts) {
    merged.facts = Object.assign({}, base.facts, overrides.facts);
  }
  return merged;
}

test('rating produk turun setelah ulasan bintang 1', () => {
  const result = analyze(baseInput(), NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.rating.new_average, 4.89);
  assert.ok(result.rating.drop > 0);
  assert.ok(result.rating.five_star_needed >= 1);
});

test('rating layanan pengiriman tidak dihitung ke peringkat produk', () => {
  const result = analyze(baseInput({
    review_type: 'shipping_service',
    bad_reviews: 5,
    target_rating: 4.9,
  }), NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.rating.counted_bad, 0);
  assert.equal(result.rating.drop, 0);
  assert.equal(result.rating.new_average, 4.9);
  assert.equal(result.rating.five_star_needed, 0);
});

test('target 5,0 tidak bisa dikejar hanya dengan bintang 5', () => {
  const result = analyze(baseInput({
    current_rating: 5,
    total_ratings: 100,
    target_rating: 5,
  }), NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.rating.reachable, false);
  assert.equal(result.rating.five_star_needed, null);
});

test('HPP lebih besar dari harga jual ditolak', () => {
  const result = analyze(baseInput({ cost: 50000 }), NOW);
  assert.equal(result.error, 'HPP tidak boleh lebih besar dari harga jual');
});

test('tanggal ulasan di masa depan ditolak', () => {
  const result = analyze(baseInput({ review_date: addDays(TODAY, 1) }), NOW);
  assert.equal(result.error, 'Tanggal ulasan tidak boleh melewati hari ini');
});

test('tanggal pesanan selesai opsional', () => {
  const result = analyze(baseInput({ order_date: '' }), NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.edit_window.days_left, null);
});

test('diagnosis pembeli menyangkal menghasilkan indikasi lemah', () => {
  const result = analyze(baseInput(), NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.diagnosis.score, 25);
  assert.equal(result.diagnosis.verdict, 'lemah');
  assert.equal(result.diagnosis.pattern, 'bukan_pembeli');
});

test('diagnosis penyalahgunaan identitas menghasilkan indikasi kuat', () => {
  const result = analyze(baseInput({
    bad_reviews: 2,
    facts: {
      buyer_denies: 'tidak_tahu',
      review_text_match: 'tidak_selaras',
      order_status: 'dibatalkan',
      address_valid: 'tidak_valid',
      burst: 'ya',
      same_account: 'ya',
      identity_abuse: 'ya',
      chat_reply: 'tidak_dibalas',
    },
  }), NOW);
  assert.ok(!result.error, result.error);
  assert.ok(result.diagnosis.score >= 70, String(result.diagnosis.score));
  assert.equal(result.diagnosis.verdict, 'kuat');
  assert.equal(result.diagnosis.pattern, 'identitas');
});

test('bukti kritis lengkap dinyatakan siap dikirim', () => {
  const proof = readiness({ items: ['review_screenshot', 'order_screenshot', 'buyer_statement', 'chat_history', 'tickets'] });
  assert.equal(proof.missing_critical.length, 0);
  assert.equal(proof.ready, true);
  assert.equal(proof.available_count, 5);
});

test('bukti kosong menandai lima bukti kritis', () => {
  const proof = readiness({ items: [] });
  assert.equal(proof.ready, false);
  assert.equal(proof.missing_critical.length, 5);
  assert.equal(proof.score, 0);
});

test('contoh menghasilkan dampak dan surat yang konsisten', () => {
  const example = buildExample(NOW);
  const result = analyze(example, NOW);
  assert.ok(!result.error, result.error);
  assert.equal(result.rating.new_average, 4.75);
  assert.equal(result.rating.five_star_needed, 38);
  assert.equal(result.impact.days, 30);
  assert.equal(result.impact.lost_profit, 2400000);
  assert.equal(result.edit_window.closed, false);
  assert.ok(result.edit_window.days_left > 0);
  assert.equal(result.readiness.available_count, 10);

  const letter = buildLetter(Object.assign({}, example, { seller_name: 'Sari' }), NOW);
  assert.ok(!letter.error, letter.error);
  assert.ok(letter.subject.indexOf('Toko Contoh') !== -1);
  assert.ok(letter.body.indexOf('120 hari') !== -1);
  assert.ok(letter.body.indexOf('tidak selaras') !== -1);
  assert.ok(letter.body.indexOf('Sari') !== -1);
});

test('batas 120 hari dihitung dari tanggal pesanan selesai', () => {
  const window = editWindow({ order_date: '2026-09-18' }, NOW);
  assert.equal(window.deadline, '2027-01-16');
  assert.equal(window.days_left, 80);
  assert.equal(window.closed, false);
});

test('batas 120 hari yang lewat ditandai tertutup', () => {
  const window = editWindow({ order_date: '2026-03-01' }, NOW);
  assert.equal(window.closed, true);
  assert.ok(window.days_left < 0);
});

test('kasus wajib punya nama toko', () => {
  const checked = validateCase(baseInput({ store_name: '' }), NOW);
  assert.equal(checked.error, 'Nama toko wajib diisi');
});

test('kasus menyimpan order_id dan fakta', () => {
  const checked = validateCase(baseInput({ order_id: '260928ABC' }), NOW);
  assert.ok(!checked.error, checked.error);
  assert.equal(checked.item.order_id, '260928ABC');
  assert.equal(checked.item.facts.buyer_denies, 'ya');
  assert.equal(checked.item.status, 'baru');
});

test('ringkasan menghitung kasus terbuka dan kerugian', () => {
  const first = Object.assign({ id: 'u1' }, validateCase(baseInput(), NOW).item);
  const second = Object.assign({ id: 'u2' }, validateCase(baseInput({
    status: 'dihapus',
    resolved_date: '2026-10-10',
    store_name: 'Toko Uji Dua',
  }), NOW).item);
  const data = summary([first, second], NOW);
  assert.equal(data.total_cases, 2);
  assert.equal(data.open_cases, 1);
  assert.equal(data.removed_cases, 1);
  assert.ok(data.total_lost_profit > 0);
  assert.equal(data.total_bad_reviews, 2);
});

test('kasus dengan batas 120 hari lewat mendapat peringatan', () => {
  const item = Object.assign({ id: 'u3' }, validateCase(baseInput({
    order_date: '2026-03-01',
    review_date: '2026-03-10',
  }), NOW).item);
  const view = caseView(item, NOW);
  assert.ok(!view.error, view.error);
  assert.equal(view.edit_window.closed, true);
  assert.ok(view.flags.some((text) => text.indexOf('Batas 120 hari') !== -1));
});

test('format rupiah memakai pemisah ribuan Indonesia', () => {
  assert.equal(formatRupiah(2400000), 'Rp 2.400.000');
});

console.log('');
console.log(passed + ' lulus, ' + failed + ' gagal');
if (failed > 0) process.exitCode = 1;
