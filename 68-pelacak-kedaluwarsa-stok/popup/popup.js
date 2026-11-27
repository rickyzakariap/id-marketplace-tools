(function () {
  'use strict';

  const ExpiryLib = globalThis.ExpiryLib;
  const STORAGE_BATCHES = 'batches';
  const STORAGE_SETTINGS = 'settings';
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const state = {
    batches: [],
    settings: Object.assign({}, ExpiryLib.DEFAULT_SETTINGS)
  };

  const hasChromeStorage = Boolean(
    globalThis.chrome && chrome.storage && chrome.storage.local
  );

  function byId(identifier) {
    return document.getElementById(identifier);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function padTwo(value) {
    return String(value).padStart(2, '0');
  }

  function toDateInputValue(date) {
    return date.getFullYear() + '-' + padTwo(date.getMonth() + 1) + '-' +
      padTwo(date.getDate());
  }

  function addDays(date, days) {
    const copy = new Date(date.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function formatDate(value) {
    const parsed = ExpiryLib.parseDateOnly(value);
    if (!parsed) return String(value);
    return parsed.day + ' ' + MONTHS[parsed.month - 1] + ' ' + parsed.year;
  }

  function setNote(node, message, isError) {
    node.textContent = message;
    node.classList.toggle('status-note--error', Boolean(isError));
    node.hidden = !message;
  }

  async function writeStorage(values) {
    if (!hasChromeStorage) return true;
    try {
      await chrome.storage.local.set(values);
      notifyBackground();
      return true;
    } catch (error) {
      setNote(byId('form-note'), 'Gagal menyimpan data lokal: ' + error.message, true);
      return false;
    }
  }

  function notifyBackground() {
    if (!globalThis.chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
    try {
      chrome.runtime.sendMessage({ type: 'refresh-badge' }, function () {
        void chrome.runtime.lastError;
      });
    } catch (error) {
      return;
    }
  }

  async function loadState() {
    if (!hasChromeStorage) return;
    try {
      const data = await chrome.storage.local.get([STORAGE_BATCHES, STORAGE_SETTINGS]);
      state.batches = Array.isArray(data[STORAGE_BATCHES]) ? data[STORAGE_BATCHES] : [];
      state.settings = ExpiryLib.normalizeSettings(data[STORAGE_SETTINGS]);
    } catch (error) {
      setNote(byId('form-note'), 'Gagal membaca data lokal: ' + error.message, true);
    }
  }

  function renderSettings() {
    byId('warning-days').value = String(state.settings.warningDays);
    byId('critical-days').value = String(state.settings.criticalDays);
  }

  function resetBatchForm() {
    byId('batch-sku').value = '';
    byId('batch-name').value = '';
    byId('batch-quantity').value = '50';
    byId('batch-expiry').value = toDateInputValue(addDays(new Date(), 30));
    byId('batch-daily').value = '2';
    byId('batch-cost').value = '12000';
    byId('batch-price').value = '20000';
  }

  function createBatchCard(item, index) {
    const card = createElement('article', 'batch');
    card.style.animationDelay = Math.min(index * 60, 300) + 'ms';

    const head = createElement('div', 'batch__head');
    const identity = createElement('div');
    identity.appendChild(createElement('p', 'batch__sku', item.sku));
    identity.appendChild(createElement(
      'p',
      'batch__meta',
      item.name + ' | kedaluwarsa ' + formatDate(item.expiryDate)
    ));
    head.appendChild(identity);
    head.appendChild(createElement(
      'span',
      'pill pill--' + item.status,
      item.statusLabel
    ));

    const grid = createElement('div', 'batch__grid');
    [
      ['Sisa hari', ExpiryLib.formatDaysLeft(item.daysLeft)],
      ['Perkiraan terjual', item.projectedSold + ' / ' + item.quantity],
      ['Sisa stok', item.projectedLeftover + ' unit'],
      ['Nilai stok', ExpiryLib.formatRupiah(item.capital)]
    ].forEach(function (entry) {
      const block = createElement('div');
      block.appendChild(createElement('p', 'batch__label', entry[0]));
      block.appendChild(createElement('p', 'batch__value', entry[1]));
      grid.appendChild(block);
    });

    const action = createElement('p', 'batch__action', item.action);

    const foot = createElement('div', 'batch__foot');
    if (item.loss > 0) {
      foot.appendChild(createElement(
        'span',
        'batch__loss',
        'Potensi rugi ' + ExpiryLib.formatRupiah(item.loss)
      ));
    } else {
      foot.appendChild(createElement(
        'span',
        'batch__loss batch__loss--muted',
        'Tidak ada potensi rugi'
      ));
    }

    const remove = createElement('button', 'mini-button', 'Hapus');
    remove.type = 'button';
    remove.dataset.remove = item.id;
    remove.setAttribute('aria-label', 'Hapus batch ' + item.sku);
    foot.appendChild(remove);

    card.appendChild(head);
    card.appendChild(grid);
    card.appendChild(action);
    card.appendChild(foot);
    return card;
  }

  function renderBatchList(batches) {
    const list = byId('batch-list');
    list.textContent = '';

    if (batches.length === 0) {
      list.appendChild(createElement(
        'p',
        'empty',
        'Belum ada batch. Tambahkan manual, impor CSV, atau muat contoh.'
      ));
      return;
    }

    batches.forEach(function (item, index) {
      list.appendChild(createBatchCard(item, index));
    });
  }

  function renderVerdict(summary, settings) {
    const verdict = byId('verdict');
    verdict.classList.remove('verdict--ok', 'verdict--ember', 'verdict--signal');

    let tone = 'signal';
    let title = 'Belum ada batch';
    let note = 'Tambahkan batch atau muat contoh untuk mulai memantau.';

    if (summary.totalBatches > 0 && summary.expired > 0) {
      tone = 'ember';
      title = summary.expired + ' batch kedaluwarsa';
      note = 'Potensi rugi ' + ExpiryLib.formatRupiah(summary.potentialLoss) +
        '. Masih ada ' + summary.critical + ' batch kritis dan ' +
        summary.warning + ' batch waspada.';
    } else if (summary.totalBatches > 0 && summary.critical > 0) {
      tone = 'ember';
      title = summary.critical + ' batch kritis';
      note = summary.unitsAtRisk + ' unit berisiko dengan nilai stok ' +
        ExpiryLib.formatRupiah(summary.capitalAtRisk) +
        '. Jalankan diskon atau bundling sekarang.';
    } else if (summary.totalBatches > 0 && summary.warning > 0) {
      tone = 'signal';
      title = summary.warning + ' batch mendekati kedaluwarsa';
      note = 'Jadwalkan flash sale atau bundling. Potensi rugi ' +
        ExpiryLib.formatRupiah(summary.potentialLoss) + '.';
    } else if (summary.totalBatches > 0) {
      tone = 'ok';
      title = 'Semua batch aman';
      note = 'Tidak ada batch dalam ' + settings.warningDays +
        ' hari ke depan. Skor kesehatan stok ' + summary.score + ' dari 100.';
    }

    if (summary.invalid > 0) {
      note += ' ' + summary.invalid + ' data rusak diabaikan.';
    }

    verdict.classList.add('verdict--' + tone);
    byId('verdict-title').textContent = title;
    byId('verdict-note').textContent = note;
  }

  function render() {
    const result = ExpiryLib.evaluateBatches(state.batches, state.settings, Date.now());
    const summary = result.summary;

    renderVerdict(summary, result.settings);
    byId('stat-expired').textContent = String(summary.expired);
    byId('stat-critical').textContent = String(summary.critical);
    byId('stat-loss').textContent = ExpiryLib.formatRupiah(summary.potentialLoss);
    byId('batch-count').textContent = summary.totalBatches + ' batch';

    const dataNote = byId('data-note');
    if (summary.invalid > 0) {
      dataNote.textContent = summary.invalid +
        ' data batch rusak diabaikan. Hapus semua lalu tambahkan ulang bila perlu.';
      dataNote.hidden = false;
    } else {
      dataNote.hidden = true;
    }

    renderBatchList(result.batches);
  }

  function duplicateKey(sku, expiryDate) {
    return String(sku).trim().toLowerCase() + '|' + String(expiryDate).trim();
  }

  async function handleBatchSubmit(event) {
    event.preventDefault();
    const note = byId('form-note');
    const sku = byId('batch-sku').value.trim();
    const expiryDate = byId('batch-expiry').value;

    const duplicate = state.batches.some(function (item) {
      return duplicateKey(item.sku, item.expiryDate) === duplicateKey(sku, expiryDate);
    });

    if (duplicate) {
      setNote(note, 'Batch dengan SKU dan tanggal kedaluwarsa yang sama sudah ada.', true);
      return;
    }

    try {
      const created = ExpiryLib.createBatch({
        sku: sku,
        name: byId('batch-name').value,
        quantity: Number(byId('batch-quantity').value),
        expiryDate: expiryDate,
        costPerUnit: Number(byId('batch-cost').value),
        sellingPrice: Number(byId('batch-price').value),
        dailySales: Number(byId('batch-daily').value)
      });
      state.batches.push(created);
      await writeStorage({ [STORAGE_BATCHES]: state.batches });
      resetBatchForm();
      setNote(note, 'Batch ' + created.sku + ' ditambahkan.', false);
      render();
    } catch (error) {
      const message = error.details ? error.details.join('. ') : error.message;
      setNote(note, message, true);
    }
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    const note = byId('settings-note');

    state.settings = ExpiryLib.normalizeSettings({
      warningDays: Number(byId('warning-days').value),
      criticalDays: Number(byId('critical-days').value)
    });

    await writeStorage({ [STORAGE_SETTINGS]: state.settings });
    renderSettings();
    setNote(note, 'Pengaturan disimpan dan langsung dipakai.', false);
    render();
  }

  async function handleImport() {
    const note = byId('import-note');
    const parsed = ExpiryLib.parseBatchesCsv(byId('csv-input').value);

    if (parsed.batches.length === 0 && parsed.errors.length === 0) {
      setNote(note, 'Tidak ada baris untuk diimpor.', true);
      return;
    }

    const seen = new Set(state.batches.map(function (item) {
      return duplicateKey(item.sku, item.expiryDate);
    }));
    let added = 0;
    let skipped = 0;

    parsed.batches.forEach(function (item) {
      const key = duplicateKey(item.sku, item.expiryDate);
      if (seen.has(key)) {
        skipped += 1;
        return;
      }
      seen.add(key);
      state.batches.push(item);
      added += 1;
    });

    if (added > 0) {
      await writeStorage({ [STORAGE_BATCHES]: state.batches });
      byId('csv-input').value = '';
      render();
    }

    const parts = [];
    if (added > 0) parts.push(added + ' batch diimpor');
    if (skipped > 0) parts.push(skipped + ' duplikat dilewati');
    if (parsed.errors.length > 0) {
      const details = parsed.errors.slice(0, 3).map(function (item) {
        const label = item.line > 0 ? 'baris ' + item.line + ': ' : '';
        return label + item.message;
      }).join('; ');
      parts.push(parsed.errors.length + ' baris gagal (' + details + ')');
    }
    if (parts.length === 0) parts.push('Tidak ada perubahan');

    setNote(note, parts.join('. ') + '.', added === 0 && parsed.errors.length > 0);
  }

  async function handleExport() {
    if (state.batches.length === 0) {
      setNote(byId('form-note'), 'Belum ada batch untuk diekspor.', true);
      return;
    }

    const csv = ExpiryLib.toCsv(state.batches, state.settings, Date.now());
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date();
    link.href = url;
    link.download = 'kedaluwarsa-stok-' + today.getFullYear() + '-' +
      padTwo(today.getMonth() + 1) + '-' + padTwo(today.getDate()) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleSample() {
    if (state.batches.length > 0) {
      const approved = window.confirm(
        'Ganti daftar batch saat ini dengan 4 contoh batch?'
      );
      if (!approved) return;
    }

    state.batches = ExpiryLib.buildSampleBatches(Date.now());
    await writeStorage({ [STORAGE_BATCHES]: state.batches });
    setNote(byId('form-note'), '4 contoh batch dimuat.', false);
    render();
  }

  async function handleClear() {
    if (state.batches.length === 0) return;
    const approved = window.confirm(
      'Hapus semua batch dari daftar? Tindakan ini tidak bisa dibatalkan.'
    );
    if (!approved) return;

    state.batches = [];
    await writeStorage({ [STORAGE_BATCHES]: state.batches });
    setNote(byId('form-note'), 'Semua batch dihapus.', false);
    render();
  }

  async function handleRemove(event) {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;

    state.batches = state.batches.filter(function (item) {
      return item.id !== button.dataset.remove;
    });
    await writeStorage({ [STORAGE_BATCHES]: state.batches });
    render();
  }

  function applyThemeLabel() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const button = byId('theme-toggle');
    button.textContent = isDark ? 'Terang' : 'Gelap';
    button.setAttribute(
      'aria-label',
      isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'
    );
  }

  function handleThemeToggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch (error) {
      return;
    }
    applyThemeLabel();
  }

  function bindEvents() {
    byId('batch-form').addEventListener('submit', handleBatchSubmit);
    byId('settings-form').addEventListener('submit', handleSettingsSubmit);
    byId('import-button').addEventListener('click', handleImport);
    byId('export-button').addEventListener('click', handleExport);
    byId('sample-button').addEventListener('click', handleSample);
    byId('clear-button').addEventListener('click', handleClear);
    byId('batch-list').addEventListener('click', handleRemove);
    byId('theme-toggle').addEventListener('click', handleThemeToggle);
  }

  async function init() {
    await loadState();
    renderSettings();
    resetBatchForm();
    applyThemeLabel();
    bindEvents();
    render();
    setInterval(render, 60000);
  }

  init();
})();
