const test = require('node:test');
const assert = require('node:assert/strict');
const { daysBetween, sagaStatus, summary } = require('../server');

test('daysBetween', () => {
  assert.equal(daysBetween('2026-08-01', '2026-08-10'), 9);
  assert.equal(daysBetween('2026-08-10', '2026-08-10'), 0);
  assert.equal(daysBetween('2026-08-20', '2026-08-10'), 0);
});

test('sagaStatus', () => {
  assert.equal(sagaStatus('2026-07-01').status, 'sebelum');
  assert.equal(sagaStatus('2026-07-02').status, 'berlangsung');
  assert.equal(sagaStatus('2026-08-21').status, 'pasca');
  assert.equal(sagaStatus('2026-10-01').status, 'lanjut');
});

test('summary', () => {
  const cases = [
    { platform: 'shopee', amount: 100, since: '2026-08-01', status: 'baru' },
    { platform: 'shopee', amount: 50, since: '2026-08-05', status: 'cair' },
    { platform: 'tiktok', amount: 25, since: '2026-08-10', status: 'proses-cs' },
  ];
  const s = summary(cases, '2026-08-20');
  assert.equal(s.total_cases, 3);
  assert.equal(s.total_amount, 175);
  assert.equal(s.open_cases, 2);
  assert.equal(s.open_amount, 125);
  assert.equal(s.oldest_since, '2026-08-01');
  assert.equal(s.oldest_days, 19);
  assert.deepEqual(
    s.by_platform.find((p) => p.name === 'Shopee'),
    { name: 'Shopee', count: 2, total: 150 }
  );
});
