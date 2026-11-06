const test = require('node:test');
const assert = require('node:assert');
const { analyzeReview } = require('../server.js');

test('ok inside toko is not treated as a positive word', () => {
  const result = analyzeReview('Stok barang di toko kosong', null);
  assert.strictEqual(result.sentiment, 'neutral');
  assert.ok(!result.positiveWords.includes('ok'));
});

test('a negator far from a sentiment word does not flip it', () => {
  const result = analyzeReview('Pelayanan bagus, tidak ada keluhan', null);
  assert.strictEqual(result.sentiment, 'positive');
  assert.ok(result.positiveWords.includes('bagus'));
});

test('a negated positive word counts as negative', () => {
  const result = analyzeReview('Barang tidak bagus, kecewa', null);
  assert.strictEqual(result.sentiment, 'negative');
  assert.ok(result.negativeWords.includes('kecewa'));
  assert.ok(result.negatedWords.includes('bagus'));
});

test('a negated complaint counts as positive', () => {
  const result = analyzeReview('Tidak ada komplain, respon cepat', null);
  assert.strictEqual(result.sentiment, 'positive');
  assert.ok(result.positiveWords.includes('cepat'));
  assert.ok(result.negatedWords.includes('komplain'));
});

test('a negative phrase is not double counted as its positive word', () => {
  const result = analyzeReview('Kualitas jelek, tidak sesuai deskripsi', null);
  assert.strictEqual(result.sentiment, 'negative');
  assert.ok(result.negativeWords.includes('tidak sesuai'));
  assert.ok(!result.positiveWords.includes('sesuai'));
});

test('an exact ok token is still positive', () => {
  const result = analyzeReview('Barang OK, pengiriman cepat', null);
  assert.strictEqual(result.sentiment, 'positive');
  assert.ok(result.positiveWords.includes('ok'));
});

test('rating still influences the score when there are no keywords', () => {
  const positive = analyzeReview('Barang datang', 5);
  const negative = analyzeReview('Barang datang', 1);
  assert.ok(positive.score > negative.score);
  assert.strictEqual(positive.sentiment, 'positive');
  assert.strictEqual(negative.sentiment, 'negative');
});
