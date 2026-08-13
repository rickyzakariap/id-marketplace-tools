// content.js - runs on Shopee/Tokopedia/Lazada/Bukalapak/Blibli product pages.
// Extracts product name + listed stock, compares with master list, shows badge.
(function () {
  'use strict';
  var S = window.StokSync;

  var STORAGE_KEY = 'stockList';
  var badge = null;
  var lastUrl = '';

  function getProductName() {
    // Prefer h1, then og:title, then document.title.
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim().length > 3) return clean(h1.textContent);
    var og = document.querySelector('meta[property="og:title"]');
    if (og && og.getAttribute('content')) return clean(og.getAttribute('content'));
    return clean(document.title);
  }

  function clean(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // Tokopedia lazy-loads stock info. Poll a few times before giving up.
  function waitForStock(maxAttempts) {
    var attempts = 0;
    return new Promise(function (resolve) {
      var t = setInterval(function () {
        attempts++;
        var stock = S.extractStock(document.body.innerText);
        if (stock !== null || attempts >= maxAttempts) {
          clearInterval(t);
          resolve(stock);
        }
      }, 400);
    });
  }

  function loadMasterList() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(STORAGE_KEY, function (data) {
        resolve((data && data[STORAGE_KEY]) || []);
      });
    });
  }

  function statusText(status, listed, master) {
    if (status === 'notrack') return 'Belum di-track. Tambah ke daftar stok via popup.';
    if (status === 'ok') return 'Stok cocok: ' + listed + ' = ' + master;
    if (status === 'oversell') return 'RISIKO OVERSELL: listing ' + listed + ', stok asli ' + master + '. Update stok!';
    return 'Stok bisa dinaikkan: listing ' + listed + ', stok asli ' + master + '.';
  }

  function statusColor(status) {
    if (status === 'ok') return '#16a34a';
    if (status === 'oversell') return '#dc2626';
    if (status === 'undersell') return '#d97706';
    return '#999';
  }

  function removeBadge() {
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    badge = null;
  }

  function showBadge(info) {
    removeBadge();
    var status = info.status;
    var color = statusColor(status);
    var div = document.createElement('div');
    div.id = 'stok-sync-badge';
    div.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;' +
      'background:#fff;border:1px solid #e5e5e5;border-left:4px solid ' + color + ';' +
      'border-radius:8px;padding:10px 14px;font-family:system-ui,sans-serif;' +
      'font-size:13px;line-height:1.5;color:#1a1a1a;max-width:300px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.08);';
    var title = document.createElement('div');
    title.style.cssText = 'font-weight:600;margin-bottom:4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;';
    title.textContent = 'Stok Sync Checker';
    var body = document.createElement('div');
    body.style.cssText = 'margin-bottom:6px;';
    body.textContent = info.name.length > 80 ? info.name.slice(0, 80) + '...' : info.name;
    var stat = document.createElement('div');
    stat.style.cssText = 'font-family:ui-monospace,Consolas,monospace;font-weight:600;color:' + color + ';margin-bottom:6px;';
    stat.textContent = 'Listing: ' + (info.listed === null ? '?' : info.listed) +
      ' | Stok asli: ' + (info.master === null || info.master === undefined ? '?' : info.master);
    var msg = document.createElement('div');
    msg.style.cssText = 'font-size:12px;color:#666;';
    msg.textContent = statusText(status, info.listed, info.master);
    var close = document.createElement('button');
    close.textContent = 'Tutup';
    close.style.cssText = 'margin-top:8px;background:#fafafa;border:1px solid #e5e5e5;' +
      'border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;color:#1a1a1a;';
    close.addEventListener('click', removeBadge);

    div.appendChild(title);
    div.appendChild(body);
    div.appendChild(stat);
    div.appendChild(msg);
    div.appendChild(close);
    document.body.appendChild(div);
    badge = div;
  }

  async function analyzePage() {
    if (!S.isProductPage(window.location.href)) {
      removeBadge();
      return null;
    }
    var name = getProductName();
    var listed = await waitForStock(5);
    var masterList = await loadMasterList();
    var match = S.findMatch(name, masterList);
    var master = match ? match.item.stock : null;
    var status = S.compareStock(listed, master);
    var info = {
      url: window.location.href,
      marketplace: S.getMarketplace(window.location.href),
      name: name,
      listed: listed,
      master: master,
      status: status
    };
    showBadge(info);
    return info;
  }

  // Re-analyze on SPA navigation (Shopee/Tokopedia are SPAs).
  setInterval(function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      analyzePage();
    }
  }, 1500);

  // Respond to popup queries.
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg && msg.action === 'getPageInfo') {
      analyzePage().then(function (info) {
        sendResponse(info || { status: 'notproduct' });
      });
      return true; // async response
    }
  });

  lastUrl = window.location.href;
  analyzePage();
})();
