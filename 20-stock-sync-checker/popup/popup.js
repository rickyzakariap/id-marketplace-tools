// popup.js - master stock list management + current page check.
(function () {
  'use strict';
  var S = window.StokSync;

  var STORAGE_KEY = 'stockList';
  var stockList = [];

  var $ = function (id) { return document.getElementById(id); };

  function loadList() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(STORAGE_KEY, function (data) {
        stockList = (data && data[STORAGE_KEY]) || [];
        resolve(stockList);
      });
    });
  }

  function saveList() {
    var obj = {};
    obj[STORAGE_KEY] = stockList;
    return new Promise(function (resolve) {
      chrome.storage.local.set(obj, resolve);
    });
  }

  function renderList() {
    var wrap = $('listWrap');
    var total = stockList.length;
    var oversell = 0;
    var ok = 0;

    if (total === 0) {
      wrap.innerHTML = '<div class="empty">Belum ada produk. Tambah manual atau impor CSV.</div>';
      $('statTotal').textContent = '0';
      $('statOversell').textContent = '0';
      $('statOk').textContent = '0';
      return;
    }

    var html = '<table><thead><tr><th>Produk</th><th class="num">Stok</th><th></th></tr></thead><tbody>';
    stockList.forEach(function (item, idx) {
      var tag = '';
      if (item.lastStatus === 'oversell') { tag = '<span class="tag oversell">oversell</span>'; oversell++; }
      else if (item.lastStatus === 'ok') { tag = '<span class="tag ok">cocok</span>'; ok++; }
      else if (item.lastStatus === 'undersell') { tag = '<span class="tag undersell">bisa naik</span>'; }
      else { tag = '<span class="tag notrack">belum dicek</span>'; }
      var name = item.name.length > 34 ? item.name.slice(0, 34) + '...' : item.name;
      html += '<tr>' +
        '<td>' + esc(name) + (item.marketplace ? '<div class="mini">' + esc(item.marketplace) + '</div>' : '') + '</td>' +
        '<td class="num">' + item.stock + '</td>' +
        '<td>' + tag + ' <button class="danger" data-del="' + idx + '">Hapus</button></td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
    $('statTotal').textContent = String(total);
    $('statOversell').textContent = String(oversell);
    $('statOk').textContent = String(ok);

    wrap.querySelectorAll('button[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stockList.splice(parseInt(btn.getAttribute('data-del'), 10), 1);
        saveList().then(renderList);
      });
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function addProduct(name, stock) {
    name = name.trim();
    if (!name) return false;
    var n = parseInt(stock, 10);
    if (isNaN(n) || n < 0) return false;
    stockList.push({ name: name, stock: n });
    return true;
  }

  // Example data (auto-fill, so user never starts from empty).
  var EXAMPLES = [
    { name: 'Kaos Polos Premium', stock: 50 },
    { name: 'TWS Bluetooth Earphone X7', stock: 12 },
    { name: 'Skincare Set Vitamin C', stock: 30 },
    { name: 'Tas Ransel Anti Air', stock: 8 }
  ];

  function renderPageResult(info) {
    var box = $('pageResult');
    box.className = 'result ' + (info.status || 'notrack');
    if (!info || info.status === 'notproduct') {
      box.innerHTML = '<div class="msg">Buka halaman produk Shopee, Tokopedia, Lazada, Bukalapak, atau Blibli, lalu klik Cek.</div>';
      return;
    }
    var statusMsg = '';
    if (info.status === 'notrack') statusMsg = 'Produk belum ada di daftar stok. Tambahkan lewat form di bawah.';
    else if (info.status === 'ok') statusMsg = 'Stok listing cocok dengan stok asli.';
    else if (info.status === 'oversell') statusMsg = 'Oversell risk: listing menunjukkan stok lebih banyak dari stok asli. Update stok sekarang.';
    else statusMsg = 'Stok listing lebih sedikit dari stok asli. Bisa dinaikkan.';

    box.innerHTML =
      '<div class="pname">' + esc(info.name) + '</div>' +
      '<div class="nums">Listing: ' + (info.listed === null ? '?' : info.listed) +
      ' | Stok asli: ' + (info.master === null || info.master === undefined ? '?' : info.master) + '</div>' +
      '<div class="msg">' + statusMsg + '</div>' +
      '<div class="meta">' + esc(info.marketplace || '') + ' | ' + esc(info.url) + '</div>';

    // Remember last status on the matched product.
    if (info.status !== 'notrack' && info.status !== 'notproduct') {
      var matched = stockList.find(function (it) {
        return S.normalizeName(it.name) === S.normalizeName(info.name);
      });
      if (matched) {
        matched.lastStatus = info.status;
        matched.marketplace = info.marketplace;
        saveList();
      }
    }
  }

  function checkCurrentPage() {
    var btn = $('btnCheck');
    btn.disabled = true;
    btn.textContent = 'Mengecek...';
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || !tab.id) {
        renderPageResult({ status: 'notproduct' });
        btn.disabled = false;
        btn.textContent = 'Cek halaman ini';
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, function (resp) {
        if (chrome.runtime.lastError || !resp) {
          // Content script not injected (e.g. page opened before install). Inject then retry.
          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, files: ['shared/shared.js', 'content/content.js'] },
            function () {
              setTimeout(function () {
                chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, function (resp2) {
                  renderPageResult(resp2 || { status: 'notproduct' });
                  btn.disabled = false;
                  btn.textContent = 'Cek halaman ini';
                });
              }, 300);
            }
          );
        } else {
          renderPageResult(resp);
          btn.disabled = false;
          btn.textContent = 'Cek halaman ini';
        }
      });
    });
  }

  function importCsv(text) {
    var lines = text.split(/\r?\n/);
    var added = 0;
    lines.forEach(function (line) {
      var parts = line.split(',').map(function (p) { return p.trim(); });
      if (parts.length >= 2 && parts[0]) {
        if (addProduct(parts[0], parts[1])) added++;
      }
    });
    return added;
  }

  function exportCsv() {
    var rows = [['nama', 'stok']].concat(stockList.map(function (it) { return [it.name, it.stock]; }));
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'stok-asli.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadList().then(function () {
      renderList();
      checkCurrentPage();
    });

    $('btnAdd').addEventListener('click', function () {
      if (addProduct($('inpName').value, $('inpStock').value)) {
        $('inpName').value = '';
        $('inpStock').value = '';
        saveList().then(renderList);
      }
    });

    $('btnExample').addEventListener('click', function () {
      stockList = EXAMPLES.slice();
      saveList().then(renderList);
    });

    $('btnCheck').addEventListener('click', checkCurrentPage);

    $('btnImport').addEventListener('click', function () {
      $('importWrap').style.display = 'block';
    });
    $('btnImportCancel').addEventListener('click', function () {
      $('importWrap').style.display = 'none';
    });
    $('btnImportGo').addEventListener('click', function () {
      var added = importCsv($('csvText').value);
      $('csvText').value = '';
      $('importWrap').style.display = 'none';
      saveList().then(function () {
        renderList();
        var hint = document.createElement('div');
        hint.className = 'hint';
        hint.style.color = '#16a34a';
        hint.textContent = 'Impor selesai: ' + added + ' produk ditambahkan.';
        $('listWrap').appendChild(hint);
        setTimeout(function () { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 3000);
      });
    });
    $('btnExport').addEventListener('click', exportCsv);

    // Enter in name/stock fields adds product.
    $('inpName').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('btnAdd').click();
    });
    $('inpStock').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('btnAdd').click();
    });
    // Escape hides import box.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('importWrap').style.display = 'none';
    });
  });
})();
