// shared.js - pure logic shared by content script and popup.
// No chrome.* APIs here so it can run in Node tests too.
(function (global) {
  'use strict';

  var MARKETPLACES = [
    { key: 'shopee', host: /(^|\.)shopee\.co\.id$/ },
    { key: 'tokopedia', host: /(^|\.)tokopedia\.com$/ },
    { key: 'lazada', host: /(^|\.)lazada\.co\.id$/ },
    { key: 'bukalapak', host: /(^|\.)bukalapak\.com$/ },
    { key: 'blibli', host: /(^|\.)blibli\.com$/ }
  ];

  function getMarketplace(url) {
    var host = '';
    try { host = new URL(url).hostname; } catch (e) { return null; }
    for (var i = 0; i < MARKETPLACES.length; i++) {
      if (MARKETPLACES[i].host.test(host)) return MARKETPLACES[i].key;
    }
    return null;
  }

  // Product page URL detection per marketplace.
  // Tokopedia: /[shop]/[slug]-[5+ digit id] (link-first pattern, 2026 format)
  // Shopee:   /product/[id]/
  // Lazada:   /products/[slug]-i[digits].html
  // Bukalapak:/p/products/[slug] or /products/[slug]
  // Blibli:   /p/[slug]-[digits]
  function isProductPage(url) {
    var mp = getMarketplace(url);
    if (!mp) return false;
    var path = '';
    try { path = new URL(url).pathname; } catch (e) { return false; }
    var segments = path.split('/').filter(function (s) { return s.length > 0; });
    if (segments.length === 0) return false;

    if (mp === 'tokopedia') {
      var excluded = ['search', 'promo', 'cart', 'checkout', 'account', 'chat', 'notifications', 'settings', 'official', 'toko'];
      if (excluded.indexOf(segments[0]) !== -1) return false;
      var last = segments[segments.length - 1];
      return segments.length >= 2 && /\d{5,}$/.test(last);
    }
    if (mp === 'shopee') {
      return segments[0] === 'product' && segments.length >= 2;
    }
    if (mp === 'lazada') {
      return segments[0] === 'products' && /-i\d+/.test(segments[segments.length - 1]);
    }
    if (mp === 'bukalapak') {
      return (segments[0] === 'p' && segments[1] === 'products') || segments[0] === 'products';
    }
    if (mp === 'blibli') {
      return segments[0] === 'p' && segments.length >= 2;
    }
    return false;
  }

  // Stock extraction from page text. Returns integer or null.
  // Patterns seen on Indonesian marketplaces:
  //   "Stok 12", "Stok: 12", "Stok 12 pcs", "12 Tersisa", "Sisa 12", "Stok habis"
  function extractStock(text) {
    if (!text) return null;
    if (/stok\s*(habis|kosong)/i.test(text)) return 0;
    var m = text.match(/stok\s*:?\s*([\d.,]+)/i);
    if (m) return parseNum(m[1]);
    m = text.match(/([\d.,]+)\s*(?:pcs|unit)?\s*tersisa/i);
    if (m) return parseNum(m[1]);
    m = text.match(/sisa\s*([\d.,]+)/i);
    if (m) return parseNum(m[1]);
    return null;
  }

  function parseNum(s) {
    var clean = String(s).replace(/\./g, '').replace(/,/g, '');
    var n = parseInt(clean, 10);
    return isNaN(n) ? null : n;
  }

  // Name normalization for fuzzy matching.
  function normalizeName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Token overlap score between two names. 1 = identical, 0 = nothing in common.
  function matchScore(pageName, listName) {
    var a = normalizeName(pageName).split(' ').filter(function (w) { return w.length > 1; });
    var b = normalizeName(listName).split(' ').filter(function (w) { return w.length > 1; });
    if (a.length === 0 || b.length === 0) return 0;
    var setA = {};
    a.forEach(function (w) { setA[w] = true; });
    var common = 0;
    b.forEach(function (w) { if (setA[w]) common++; });
    var longer = Math.max(a.length, b.length);
    return longer === 0 ? 0 : common / longer;
  }

  // Find best match in master list. Returns { item, score } or null if below threshold.
  function findMatch(pageName, stockList, threshold) {
    var th = threshold || 0.5;
    var best = null;
    (stockList || []).forEach(function (item) {
      var s = matchScore(pageName, item.name);
      if (s >= th && (!best || s > best.score)) {
        best = { item: item, score: s };
      }
    });
    return best;
  }

  // Compare listed stock vs master stock.
  // Returns: 'ok' | 'oversell' | 'undersell' | 'notrack'
  function compareStock(listed, master) {
    if (master === undefined || master === null || master === '') return 'notrack';
    var m = parseInt(master, 10);
    if (isNaN(m)) return 'notrack';
    if (listed === null || listed === undefined) return 'notrack';
    if (listed === m) return 'ok';
    if (listed > m) return 'oversell';
    return 'undersell';
  }

  var api = {
    getMarketplace: getMarketplace,
    isProductPage: isProductPage,
    extractStock: extractStock,
    parseNum: parseNum,
    normalizeName: normalizeName,
    matchScore: matchScore,
    findMatch: findMatch,
    compareStock: compareStock
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.StokSync = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
