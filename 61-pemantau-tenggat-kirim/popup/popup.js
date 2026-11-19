(function () {
  'use strict';

  const DeadlineLib = globalThis.DeadlineLib;
  const STORAGE_ORDERS = 'orders';
  const STORAGE_SETTINGS = 'settings';
  const state = {
    orders: [],
    settings: Object.assign({}, DeadlineLib.DEFAULT_SETTINGS)
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

  function toLocalInputValue(date) {
    return date.getFullYear() + '-' + padTwo(date.getMonth() + 1) + '-' +
      padTwo(date.getDate()) + 'T' + padTwo(date.getHours()) + ':' +
      padTwo(date.getMinutes());
  }

  function formatDateTime(value) {
    if (!value) return 'belum ada';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      const data = await chrome.storage.local.get([STORAGE_ORDERS, STORAGE_SETTINGS]);
      state.orders = Array.isArray(data[STORAGE_ORDERS]) ? data[STORAGE_ORDERS] : [];
      state.settings = DeadlineLib.normalizeSettings(data[STORAGE_SETTINGS]);
    } catch (error) {
      setNote(byId('form-note'), 'Gagal membaca data lokal: ' + error.message, true);
    }
  }

  function populateMarketplaces() {
    const select = byId('order-marketplace');
    DeadlineLib.MARKETPLACES.forEach(function (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = 'Shopee';
  }

  function renderSettings() {
    byId('warning-hours').value = String(Number((state.settings.warningMinutes / 60).toFixed(2)));
    byId('critical-hours').value = String(Number((state.settings.criticalMinutes / 60).toFixed(2)));
    byId('buffer-minutes').value = String(state.settings.packingBufferMinutes);
    byId('penalty-late').value = String(state.settings.penaltyPerLate);
    byId('default-sla').value = String(state.settings.defaultSlaHours);
  }

  function resetOrderForm() {
    byId('order-code').value = '';
    byId('order-marketplace').value = 'Shopee';
    byId('order-time').value = toLocalInputValue(new Date());
    byId('order-sla').value = String(state.settings.defaultSlaHours);
    byId('order-value').value = '150000';
  }

  function formatPackingTime(order) {
    if (order.status === 'late') return 'Lewat tenggat';
    if (order.packingRemainingMs <= 0) {
      return 'Lewat ' + DeadlineLib.formatRemaining(order.packingRemainingMs)
        .replace(/^Terlambat /, '');
    }
    return DeadlineLib.formatRemaining(order.packingRemainingMs);
  }

  function actionText(order) {
    if (order.status === 'late') {
      return 'Kirim sekarang, simpan bukti packing dan serahkan paket ke kurir. ' +
        'Ajukan kendala lewat Pusat Bantuan bila pengiriman tertahan.';
    }
    if (order.status === 'critical') {
      return 'Selesaikan packing dan buat resi sekarang. Jangan menunggu jadwal pickup berikutnya.';
    }
    if (order.status === 'warning') {
      return 'Siapkan kemasan, cek stok varian, dan cetak label sebelum waktu packing habis.';
    }
    return 'Belum perlu tindakan. Pantau lagi mendekati tenggat.';
  }

  function createOrderCard(order, index) {
    const card = createElement('article', 'order');
    card.style.animationDelay = Math.min(index * 60, 300) + 'ms';

    const head = createElement('div', 'order__head');
    const identity = createElement('div');
    identity.appendChild(createElement('p', 'order__code', order.code));
    identity.appendChild(createElement(
      'p',
      'order__meta',
      order.marketplace + ' | tenggat ' + formatDateTime(order.deadline)
    ));
    head.appendChild(identity);
    head.appendChild(createElement(
      'span',
      'pill pill--' + order.status,
      DeadlineLib.STATUS_LABELS[order.status]
    ));

    const grid = createElement('div', 'order__grid');
    [
      ['Sisa waktu', DeadlineLib.formatRemaining(order.remainingMs)],
      ['Mulai packing', formatPackingTime(order)],
      ['Nilai', DeadlineLib.formatRupiah(order.orderValue)]
    ].forEach(function (entry) {
      const block = createElement('div');
      block.appendChild(createElement('p', 'order__label', entry[0]));
      block.appendChild(createElement('p', 'order__value', entry[1]));
      grid.appendChild(block);
    });

    const action = createElement('p', 'order__action', actionText(order));

    const foot = createElement('div', 'order__foot');
    let penaltyText = 'Tidak ada denda';
    let penaltyClass = 'order__penalty order__penalty--muted';
    if (order.estimatedPenalty > 0) {
      penaltyText = 'Denda ' + DeadlineLib.formatRupiah(order.estimatedPenalty);
      penaltyClass = 'order__penalty';
    } else if (order.packingOverdue) {
      penaltyText = 'Waktu packing lewat';
      penaltyClass = 'order__penalty';
    }
    foot.appendChild(createElement('span', penaltyClass, penaltyText));

    const remove = createElement('button', 'mini-button', 'Hapus');
    remove.type = 'button';
    remove.dataset.remove = order.id;
    remove.setAttribute('aria-label', 'Hapus pesanan ' + order.code);
    foot.appendChild(remove);

    card.appendChild(head);
    card.appendChild(grid);
    card.appendChild(action);
    card.appendChild(foot);
    return card;
  }

  function renderOrderList(orders) {
    const list = byId('order-list');
    list.textContent = '';

    if (orders.length === 0) {
      list.appendChild(createElement(
        'p',
        'empty',
        'Belum ada pesanan. Tambahkan manual, impor CSV, atau muat contoh.'
      ));
      return;
    }

    orders.forEach(function (order, index) {
      list.appendChild(createOrderCard(order, index));
    });
  }

  function renderVerdict(summary) {
    const verdict = byId('verdict');
    verdict.classList.remove('verdict--ok', 'verdict--ember', 'verdict--signal');

    let tone = 'signal';
    let title = 'Belum ada pesanan';
    let note = 'Tambahkan pesanan atau muat contoh untuk mulai memantau.';

    if (summary.total > 0 && summary.late > 0) {
      tone = 'ember';
      title = summary.late + ' pesanan terlambat';
      note = 'Estimasi denda ' + DeadlineLib.formatRupiah(summary.latePenalty) +
        '. Nilai pesanan berisiko ' + DeadlineLib.formatRupiah(summary.valueAtRisk) + '.';
      if (summary.critical > 0) {
        note += ' Masih ada ' + summary.critical + ' pesanan kritis.';
      }
    } else if (summary.total > 0 && summary.critical > 0) {
      tone = 'ember';
      title = summary.critical + ' pesanan kritis';
      note = 'Mulai packing sekarang. Nilai pesanan berisiko ' +
        DeadlineLib.formatRupiah(summary.valueAtRisk) + '.';
      if (summary.mustPackNow > 0) {
        note += ' ' + summary.mustPackNow + ' pesanan sudah lewat waktu mulai packing.';
      }
    } else if (summary.total > 0 && summary.warning > 0) {
      tone = 'signal';
      title = summary.warning + ' pesanan mendekati tenggat';
      note = 'Tenggat terdekat ' + formatDateTime(summary.nextDeadline) +
        '. Siapkan packing dari sekarang.';
    } else if (summary.total > 0) {
      tone = 'ok';
      title = 'Semua pesanan aman';
      note = 'Tenggat terdekat ' + formatDateTime(summary.nextDeadline) +
        '. Skor kesiapan ' + summary.score + ' dari 100.';
    }

    if (summary.invalid > 0) {
      note += ' ' + summary.invalid + ' data rusak diabaikan.';
    }

    verdict.classList.add('verdict--' + tone);
    byId('verdict-title').textContent = title;
    byId('verdict-note').textContent = note;
  }

  function render() {
    const result = DeadlineLib.evaluateOrders(state.orders, state.settings, Date.now());
    const summary = result.summary;

    renderVerdict(summary);
    byId('stat-critical').textContent = String(summary.critical);
    byId('stat-late').textContent = String(summary.late);
    byId('stat-penalty').textContent = DeadlineLib.formatRupiah(summary.latePenalty);
    byId('order-count').textContent = summary.total + ' pesanan';

    const dataNote = byId('data-note');
    if (summary.invalid > 0) {
      dataNote.textContent = summary.invalid +
        ' data pesanan rusak diabaikan. Hapus semua lalu tambahkan ulang bila perlu.';
      dataNote.hidden = false;
    } else {
      dataNote.hidden = true;
    }

    renderOrderList(result.orders);
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    const note = byId('form-note');
    const code = byId('order-code').value.trim();

    if (!code) {
      setNote(note, 'Kode pesanan wajib diisi.', true);
      return;
    }

    const duplicate = state.orders.some(function (order) {
      return String(order.code).toLowerCase() === code.toLowerCase();
    });

    if (duplicate) {
      setNote(note, 'Kode pesanan ' + code + ' sudah ada di daftar.', true);
      return;
    }

    try {
      const created = DeadlineLib.createOrder({
        code: code,
        marketplace: byId('order-marketplace').value,
        orderAt: byId('order-time').value,
        slaHours: Number(byId('order-sla').value),
        orderValue: Number(byId('order-value').value)
      });
      state.orders.push(created);
      await writeStorage({ [STORAGE_ORDERS]: state.orders });
      resetOrderForm();
      setNote(note, 'Pesanan ' + created.code + ' ditambahkan.', false);
      render();
    } catch (error) {
      const message = error.details ? error.details.join('. ') : error.message;
      setNote(note, message, true);
    }
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    const note = byId('settings-note');
    const previousSla = state.settings.defaultSlaHours;

    state.settings = DeadlineLib.normalizeSettings({
      warningMinutes: Number(byId('warning-hours').value) * 60,
      criticalMinutes: Number(byId('critical-hours').value) * 60,
      packingBufferMinutes: Number(byId('buffer-minutes').value),
      penaltyPerLate: Number(byId('penalty-late').value),
      defaultSlaHours: Number(byId('default-sla').value)
    });

    await writeStorage({ [STORAGE_SETTINGS]: state.settings });
    renderSettings();

    if (previousSla !== state.settings.defaultSlaHours) {
      byId('order-sla').value = String(state.settings.defaultSlaHours);
    }

    setNote(note, 'Pengaturan disimpan dan langsung dipakai.', false);
    render();
  }

  async function handleImport() {
    const note = byId('import-note');
    const parsed = DeadlineLib.parseOrdersCsv(byId('csv-input').value);

    if (parsed.orders.length === 0 && parsed.errors.length === 0) {
      setNote(note, 'Tidak ada baris untuk diimpor.', true);
      return;
    }

    const seen = new Set(state.orders.map(function (order) {
      return String(order.code).toLowerCase();
    }));
    let added = 0;
    let skipped = 0;

    parsed.orders.forEach(function (order) {
      const key = String(order.code).toLowerCase();
      if (seen.has(key)) {
        skipped += 1;
        return;
      }
      seen.add(key);
      state.orders.push(order);
      added += 1;
    });

    if (added > 0) {
      await writeStorage({ [STORAGE_ORDERS]: state.orders });
      byId('csv-input').value = '';
      render();
    }

    const parts = [];
    if (added > 0) parts.push(added + ' pesanan diimpor');
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
    if (state.orders.length === 0) {
      setNote(byId('form-note'), 'Belum ada pesanan untuk diekspor.', true);
      return;
    }

    const csv = DeadlineLib.toCsv(state.orders, state.settings, Date.now());
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date();
    link.href = url;
    link.download = 'tenggat-kirim-' + today.getFullYear() + '-' +
      padTwo(today.getMonth() + 1) + '-' + padTwo(today.getDate()) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleSample() {
    if (state.orders.length > 0) {
      const approved = window.confirm(
        'Ganti daftar pesanan saat ini dengan 4 contoh pesanan?'
      );
      if (!approved) return;
    }

    state.orders = DeadlineLib.buildSampleOrders(Date.now());
    await writeStorage({ [STORAGE_ORDERS]: state.orders });
    setNote(byId('form-note'), '4 contoh pesanan dimuat.', false);
    render();
  }

  async function handleClear() {
    if (state.orders.length === 0) return;
    const approved = window.confirm(
      'Hapus semua pesanan dari daftar? Tindakan ini tidak bisa dibatalkan.'
    );
    if (!approved) return;

    state.orders = [];
    await writeStorage({ [STORAGE_ORDERS]: state.orders });
    setNote(byId('form-note'), 'Semua pesanan dihapus.', false);
    render();
  }

  async function handleRemove(event) {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;

    state.orders = state.orders.filter(function (order) {
      return order.id !== button.dataset.remove;
    });
    await writeStorage({ [STORAGE_ORDERS]: state.orders });
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
    byId('order-form').addEventListener('submit', handleOrderSubmit);
    byId('settings-form').addEventListener('submit', handleSettingsSubmit);
    byId('import-button').addEventListener('click', handleImport);
    byId('export-button').addEventListener('click', handleExport);
    byId('sample-button').addEventListener('click', handleSample);
    byId('clear-button').addEventListener('click', handleClear);
    byId('order-list').addEventListener('click', handleRemove);
    byId('theme-toggle').addEventListener('click', handleThemeToggle);
  }

  async function init() {
    populateMarketplaces();
    await loadState();
    renderSettings();
    resetOrderForm();
    applyThemeLabel();
    bindEvents();
    render();
    setInterval(render, 30000);
  }

  init();
})();
