// test.js - Node unit tests for shared logic. Run: node test.js
// Note: DOM/content-script behavior needs a real browser test.
var assert = require('assert');
var S = require('../shared/shared.js');

var pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('PASS ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message); }
}

// --- marketplace detection ---
t('shopee host', function () {
  assert.strictEqual(S.getMarketplace('https://shopee.co.id/product/123/'), 'shopee');
});
t('tokopedia host', function () {
  assert.strictEqual(S.getMarketplace('https://www.tokopedia.com/shop/slug-1234567890123'), 'tokopedia');
});
t('lazada host', function () {
  assert.strictEqual(S.getMarketplace('https://www.lazada.co.id/products/slug-i123456.html'), 'lazada');
});
t('bukalapak host', function () {
  assert.strictEqual(S.getMarketplace('https://www.bukalapak.com/p/products/slug'), 'bukalapak');
});
t('blibli host', function () {
  assert.strictEqual(S.getMarketplace('https://www.blibli.com/p/slug--00000'), 'blibli');
});
t('unknown host returns null', function () {
  assert.strictEqual(S.getMarketplace('https://google.com/'), null);
});

// --- product page detection ---
t('tokopedia product page (new URL format)', function () {
  assert.strictEqual(S.isProductPage('https://www.tokopedia.com/fetch-acc/q86-tws-bluetooth-earphone-1732108930792784929'), true);
});
t('tokopedia search page is not product', function () {
  assert.strictEqual(S.isProductPage('https://www.tokopedia.com/search?q=tws'), false);
});
t('shopee product page', function () {
  assert.strictEqual(S.isProductPage('https://shopee.co.id/product/12345678/98765432'), true);
});
t('shopee search is not product', function () {
  assert.strictEqual(S.isProductPage('https://shopee.co.id/search?keyword=tws'), false);
});
t('lazada product page', function () {
  assert.strictEqual(S.isProductPage('https://www.lazada.co.id/products/tws-earphone-i123456789-s12345.html'), true);
});
t('blibli product page', function () {
  assert.strictEqual(S.isProductPage('https://www.blibli.com/p/tws-earphone--ps-00001'), true);
});

// --- stock extraction ---
t('stok 12', function () { assert.strictEqual(S.extractStock('Stok 12'), 12); });
t('stok: 12', function () { assert.strictEqual(S.extractStock('Stok: 12'), 12); });
t('stok 1.500', function () { assert.strictEqual(S.extractStock('Stok 1.500'), 1500); });
t('12 tersisa', function () { assert.strictEqual(S.extractStock('12 tersisa'), 12); });
t('sisa 5', function () { assert.strictEqual(S.extractStock('Sisa 5'), 5); });
t('stok habis', function () { assert.strictEqual(S.extractStock('Stok habis'), 0); });
t('no stock info', function () { assert.strictEqual(S.extractStock('Rp 25.000'), null); });
t('stok 0', function () { assert.strictEqual(S.extractStock('Stok 0'), 0); });

// --- matching ---
t('normalize name', function () {
  assert.strictEqual(S.normalizeName('Kaos Polos Premium - Putih'), 'kaos polos premium putih');
});
t('identical names score 1', function () {
  assert.strictEqual(S.matchScore('TWS Bluetooth Earphone X7', 'TWS Bluetooth Earphone X7'), 1);
});
t('partial overlap scores between 0 and 1', function () {
  var s = S.matchScore('TWS Bluetooth Earphone X7 - Garansi', 'TWS Bluetooth Earphone X7');
  assert.ok(s > 0.5 && s < 1, 'score was ' + s);
});
t('unrelated names score low', function () {
  var s = S.matchScore('Kaos Polos', 'Skincare Set');
  assert.ok(s < 0.3, 'score was ' + s);
});
t('findMatch finds correct item', function () {
  var list = [{ name: 'Kaos Polos Premium', stock: 50 }, { name: 'TWS Bluetooth Earphone X7', stock: 12 }];
  var m = S.findMatch('TWS Bluetooth Earphone X7 - Garansi Resmi', list);
  assert.ok(m && m.item.stock === 12, 'matched ' + (m && m.item.name));
});
t('findMatch returns null for unknown', function () {
  var list = [{ name: 'Kaos Polos Premium', stock: 50 }];
  assert.strictEqual(S.findMatch('Skincare Set Vitamin C', list), null);
});

// --- compare ---
t('equal stock = ok', function () { assert.strictEqual(S.compareStock(12, '12'), 'ok'); });
t('listed > master = oversell', function () { assert.strictEqual(S.compareStock(20, '12'), 'oversell'); });
t('listed < master = undersell', function () { assert.strictEqual(S.compareStock(5, '12'), 'undersell'); });
t('no master = notrack', function () { assert.strictEqual(S.compareStock(5, null), 'notrack'); });
t('no listed = notrack', function () { assert.strictEqual(S.compareStock(null, '12'), 'notrack'); });

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
