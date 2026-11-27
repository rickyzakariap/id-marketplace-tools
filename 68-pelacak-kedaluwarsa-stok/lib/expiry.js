(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.ExpiryLib = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  var DEFAULT_SETTINGS = Object.freeze({
    warningDays: 30,
    criticalDays: 7
  });

  var STATUS_LABELS = Object.freeze({
    safe: 'Aman',
    warning: 'Waspada',
    critical: 'Kritis',
    expired: 'Kedaluwarsa'
  });

  var STATUS_WEIGHTS = Object.freeze({
    safe: 100,
    warning: 70,
    critical: 30,
    expired: 0
  });

  function clampNumber(value, minimum, maximum, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function normalizeSettings(input) {
    var settings = {
      warningDays: DEFAULT_SETTINGS.warningDays,
      criticalDays: DEFAULT_SETTINGS.criticalDays
    };

    if (!input || typeof input !== 'object') return settings;

    settings.warningDays = clampNumber(
      input.warningDays, 1, 3650, DEFAULT_SETTINGS.warningDays
    );
    settings.criticalDays = clampNumber(
      input.criticalDays, 0, settings.warningDays, DEFAULT_SETTINGS.criticalDays
    );
    if (settings.criticalDays > settings.warningDays) {
      settings.criticalDays = settings.warningDays;
    }

    return settings;
  }

  function parseDateOnly(value) {
    if (typeof value !== 'string') return null;
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return null;

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var utcMs = Date.UTC(year, month - 1, day);
    var date = new Date(utcMs);

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return {
      year: year,
      month: month,
      day: day,
      key: match[1] + '-' + match[2] + '-' + match[3],
      utcMs: utcMs
    };
  }

  function resolveNow(value) {
    if (value === undefined || value === null) return Date.now();

    if (value instanceof Date) {
      var time = value.getTime();
      if (!Number.isFinite(time)) throw new TypeError('Waktu acuan tidak valid');
      return time;
    }

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
      var parsed = Date.parse(value.replace(' ', 'T'));
      if (Number.isFinite(parsed)) return parsed;
      parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }

    throw new TypeError('Waktu acuan tidak valid');
  }

  function todayUtcMs(nowMs) {
    var date = new Date(nowMs);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dateKeyFromOffset(nowMs, offsetDays) {
    var date = new Date(nowMs);
    var shifted = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays)
    );
    return shifted.getUTCFullYear() + '-' +
      String(shifted.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(shifted.getUTCDate()).padStart(2, '0');
  }

  function daysUntil(expiryDate, nowInput) {
    var parsed = parseDateOnly(expiryDate);
    if (!parsed) return NaN;
    var nowMs = resolveNow(nowInput);
    return Math.round((parsed.utcMs - todayUtcMs(nowMs)) / DAY_MS);
  }

  function validateBatch(input) {
    var errors = [];

    if (!input || typeof input !== 'object') {
      return ['data batch tidak valid'];
    }

    var sku = typeof input.sku === 'string' ? input.sku.trim() : '';
    if (!sku) {
      errors.push('SKU wajib diisi');
    } else if (sku.length > 60) {
      errors.push('SKU maksimal 60 karakter');
    } else if (/[\r\n]/.test(sku)) {
      errors.push('SKU tidak boleh berisi baris baru');
    }

    var name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      errors.push('nama produk wajib diisi');
    } else if (name.length > 80) {
      errors.push('nama produk maksimal 80 karakter');
    } else if (/[\r\n]/.test(name)) {
      errors.push('nama produk tidak boleh berisi baris baru');
    }

    var quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
      errors.push('jumlah harus bilangan bulat 1 sampai 1.000.000');
    }

    if (!parseDateOnly(input.expiryDate)) {
      errors.push('tanggal kedaluwarsa harus format YYYY-MM-DD dan valid');
    }

    var cost = Number(input.costPerUnit);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000000000) {
      errors.push('HPP per unit harus angka 0 sampai 1.000.000.000.000');
    }

    var price = Number(input.sellingPrice);
    if (!Number.isFinite(price) || price <= 0 || price > 1000000000000) {
      errors.push('harga jual harus angka lebih dari 0');
    }

    var daily = Number(input.dailySales);
    if (!Number.isFinite(daily) || daily < 0 || daily > 1000000) {
      errors.push('penjualan harian harus angka 0 sampai 1.000.000');
    }

    return errors;
  }

  function createBatch(input, options) {
    var errors = validateBatch(input);
    if (errors.length > 0) {
      var error = new Error(errors.join('; '));
      error.name = 'ValidationError';
      error.details = errors;
      throw error;
    }

    var nowMs = options && Number.isFinite(options.now) ? options.now : Date.now();
    var providedId = input.id && String(input.id).trim();
    var identifier = providedId || 'batch-' + Math.random().toString(36).slice(2, 10);
    var parsedExpiry = parseDateOnly(input.expiryDate);

    return {
      id: identifier,
      sku: input.sku.trim(),
      name: input.name.trim(),
      quantity: Number(input.quantity),
      expiryDate: parsedExpiry.key,
      costPerUnit: Math.round(Number(input.costPerUnit)),
      sellingPrice: Math.round(Number(input.sellingPrice)),
      dailySales: Number(input.dailySales),
      createdAt: new Date(nowMs).toISOString()
    };
  }

  function formatPercent(value, digits) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '0%';
    var places = digits === undefined ? 1 : digits;
    return number.toFixed(places).replace('.', ',') + '%';
  }

  function suggestAction(item) {
    if (item.status === 'expired') {
      return 'Tarik dari etalase, pisahkan dari stok jual, dan catat sebagai kerugian.';
    }

    if (item.projectedLeftover === 0) {
      return 'Perkiraan stok habis sebelum kedaluwarsa. Tidak perlu diskon tambahan.';
    }

    var guardrail;
    if (item.maxDiscountPct > 0) {
      guardrail = 'Batas diskon aman ' + formatPercent(item.maxDiscountPct) +
        ' agar harga tidak di bawah HPP.';
    } else {
      guardrail = 'Harga jual belum di atas HPP, cek ulang harga sebelum diskon.';
    }

    if (item.dailySales === 0) {
      return 'Belum ada penjualan harian. Aktifkan iklan atau diskon. ' + guardrail;
    }

    if (item.status === 'critical') {
      return 'Jalankan diskon atau bundling hari ini. ' + guardrail;
    }

    if (item.status === 'warning') {
      return 'Jadwalkan flash sale atau bundling minggu ini. ' + guardrail;
    }

    return 'Pantau penjualan harian dan kurangi pembelian batch berikutnya. ' + guardrail;
  }

  function evaluateBatch(batch, settingsInput, nowInput) {
    var settings = normalizeSettings(settingsInput);
    var nowMs = resolveNow(nowInput);
    var daysLeft = daysUntil(batch.expiryDate, nowMs);

    if (!Number.isFinite(daysLeft)) {
      throw new TypeError('Tanggal kedaluwarsa batch tidak valid');
    }

    var quantity = Number(batch.quantity);
    var costPerUnit = Number(batch.costPerUnit);
    var sellingPrice = Number(batch.sellingPrice);
    var dailySales = Number(batch.dailySales);

    var status = 'safe';
    if (daysLeft < 0) {
      status = 'expired';
    } else if (daysLeft <= settings.criticalDays) {
      status = 'critical';
    } else if (daysLeft <= settings.warningDays) {
      status = 'warning';
    }

    var sellingDays = status === 'expired' ? 0 : daysLeft + 1;
    var sellableUnits = Math.floor(dailySales * sellingDays);
    var projectedSold = Math.min(quantity, sellableUnits);
    var projectedLeftover = quantity - projectedSold;
    var capital = Math.round(quantity * costPerUnit);
    var projectedRevenue = Math.round(projectedSold * sellingPrice);
    var projectedProfit = projectedRevenue - capital;
    var loss = Math.round(projectedLeftover * costPerUnit);
    var unitMargin = sellingPrice - costPerUnit;
    var maxDiscountPct = sellingPrice > 0 && unitMargin > 0
      ? (unitMargin / sellingPrice) * 100
      : 0;
    var stockDays = dailySales > 0 ? quantity / dailySales : null;
    var coverageGapDays = stockDays === null || status === 'expired'
      ? null
      : stockDays - sellingDays;

    var evaluated = {
      id: batch.id,
      sku: batch.sku,
      name: batch.name,
      quantity: quantity,
      expiryDate: batch.expiryDate,
      costPerUnit: costPerUnit,
      sellingPrice: sellingPrice,
      dailySales: dailySales,
      createdAt: batch.createdAt,
      daysLeft: daysLeft,
      status: status,
      statusLabel: STATUS_LABELS[status],
      sellingDays: sellingDays,
      sellableUnits: sellableUnits,
      projectedSold: projectedSold,
      projectedLeftover: projectedLeftover,
      stockDays: stockDays,
      coverageGapDays: coverageGapDays,
      capital: capital,
      projectedRevenue: projectedRevenue,
      projectedProfit: projectedProfit,
      loss: loss,
      unitMargin: unitMargin,
      maxDiscountPct: maxDiscountPct,
      floorPrice: costPerUnit
    };

    evaluated.action = suggestAction(evaluated);
    return evaluated;
  }

  function evaluateBatches(batches, settingsInput, nowInput) {
    var settings = normalizeSettings(settingsInput);
    var nowMs = resolveNow(nowInput);
    var evaluated = [];
    var invalid = 0;

    (Array.isArray(batches) ? batches : []).forEach(function (batch) {
      if (validateBatch(batch).length > 0) {
        invalid += 1;
        return;
      }
      evaluated.push(evaluateBatch(batch, settings, nowMs));
    });

    evaluated.sort(function (left, right) {
      if (left.daysLeft !== right.daysLeft) return left.daysLeft - right.daysLeft;
      return String(left.sku).localeCompare(String(right.sku), 'id');
    });

    var summary = {
      totalBatches: evaluated.length,
      totalUnits: 0,
      invalid: invalid,
      safe: 0,
      warning: 0,
      critical: 0,
      expired: 0,
      unitsAtRisk: 0,
      unitsExpiringSoon: 0,
      capitalAtRisk: 0,
      totalCapital: 0,
      potentialLoss: 0,
      projectedProfit: 0,
      score: 100,
      nextExpiry: null,
      generatedAt: new Date(nowMs).toISOString()
    };

    var scoreTotal = 0;
    evaluated.forEach(function (item) {
      summary[item.status] += 1;
      summary.totalUnits += item.quantity;
      summary.totalCapital += item.capital;
      summary.potentialLoss += item.loss;
      summary.projectedProfit += item.projectedProfit;
      scoreTotal += STATUS_WEIGHTS[item.status];

      if (item.status === 'critical' || item.status === 'expired') {
        summary.unitsAtRisk += item.quantity;
        summary.capitalAtRisk += item.capital;
      }
      if (item.status !== 'safe') {
        summary.unitsExpiringSoon += item.quantity;
      }
    });

    if (evaluated.length > 0) {
      summary.score = Math.round(scoreTotal / evaluated.length);
      var upcoming = evaluated.filter(function (item) {
        return item.status !== 'expired';
      });
      if (upcoming.length > 0) {
        summary.nextExpiry = upcoming.reduce(function (earliest, item) {
          if (!earliest || item.expiryDate < earliest) return item.expiryDate;
          return earliest;
        }, null);
      }
    }

    return {
      batches: evaluated,
      summary: summary,
      settings: settings
    };
  }

  function formatNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '0';
    var digits = String(Math.round(Math.abs(number)));
    var output = '';
    for (var index = 0; index < digits.length; index += 1) {
      if (index > 0 && (digits.length - index) % 3 === 0) output += '.';
      output += digits[index];
    }
    return output;
  }

  function formatRupiah(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'Rp 0';
    var rounded = Math.round(number);
    var sign = rounded < 0 ? '-' : '';
    return sign + 'Rp ' + formatNumber(Math.abs(rounded));
  }

  function formatDaysLeft(value) {
    var days = Number(value);
    if (!Number.isFinite(days)) return 'Tanggal tidak valid';
    if (days < 0) return 'Lewat ' + Math.abs(days) + ' hari';
    if (days === 0) return 'Kedaluwarsa hari ini';
    return days + ' hari lagi';
  }

  function parseRupiah(value) {
    if (typeof value === 'number') return value;
    var text = String(value === undefined || value === null ? '' : value).trim();
    if (!text) return NaN;
    text = text.replace(/rp/gi, '').replace(/\s/g, '');
    text = text.replace(/[.,](?=\d{3}(\D|$))/g, '');
    text = text.replace(',', '.');
    var number = Number(text);
    return Number.isFinite(number) ? number : NaN;
  }

  function splitCsvLine(line) {
    var cells = [];
    var current = '';
    var quoted = false;

    for (var index = 0; index < line.length; index += 1) {
      var character = line.charAt(index);
      if (quoted) {
        if (character === '"') {
          if (line.charAt(index + 1) === '"') {
            current += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          current += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ',') {
        cells.push(current);
        current = '';
      } else {
        current += character;
      }
    }

    cells.push(current);
    return cells.map(function (cell) {
      return cell.trim();
    });
  }

  function parseBatchesCsv(text) {
    var batches = [];
    var errors = [];

    if (typeof text !== 'string' || !text.trim()) {
      return { batches: batches, errors: [{ line: 0, message: 'CSV kosong' }] };
    }

    var lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    var start = 0;
    var firstContent = lines.findIndex(function (line) {
      return line.trim().length > 0;
    });
    if (firstContent >= 0 && /^sku\s*,/i.test(lines[firstContent].trim())) {
      start = firstContent + 1;
    }

    for (var index = start; index < lines.length; index += 1) {
      var line = lines[index].trim();
      if (!line) continue;
      var lineNumber = index + 1;
      var cells = splitCsvLine(line);

      if (cells.length !== 7) {
        errors.push({
          line: lineNumber,
          message: 'butuh tepat 7 kolom: sku, nama, jumlah, kedaluwarsa, hpp, jual, ' +
            'terjual_harian'
        });
        continue;
      }

      var input = {
        sku: cells[0],
        name: cells[1],
        quantity: Number(cells[2]),
        expiryDate: cells[3],
        costPerUnit: parseRupiah(cells[4]),
        sellingPrice: parseRupiah(cells[5]),
        dailySales: Number(cells[6].replace(',', '.'))
      };
      var problems = validateBatch(input);

      if (problems.length > 0) {
        errors.push({ line: lineNumber, message: problems.join('; ') });
        continue;
      }

      batches.push(createBatch(input));
    }

    return { batches: batches, errors: errors };
  }

  function csvCell(value) {
    var text = String(value === undefined || value === null ? '' : value);
    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function toCsv(batches, settingsInput, nowInput) {
    var evaluation = evaluateBatches(batches, settingsInput, nowInput);
    var lines = [
      'sku,nama,jumlah,kedaluwarsa,sisa_hari,status,terjual_harian,' +
      'perkiraan_terjual,sisa_stok,nilai_stok,potensi_rugi,potensi_profit'
    ];

    evaluation.batches.forEach(function (item) {
      lines.push([
        csvCell(item.sku),
        csvCell(item.name),
        String(item.quantity),
        csvCell(item.expiryDate),
        String(item.daysLeft),
        csvCell(item.status),
        String(item.dailySales),
        String(item.projectedSold),
        String(item.projectedLeftover),
        String(item.capital),
        String(item.loss),
        String(item.projectedProfit)
      ].join(','));
    });

    return lines.join('\n');
  }

  function buildSampleBatches(nowInput) {
    var nowMs = resolveNow(nowInput);
    var specs = [
      {
        id: 'sample-1',
        sku: 'SKU-EXP-01',
        name: 'Selai Kurma 250 ml',
        quantity: 40,
        offset: -2,
        costPerUnit: 18000,
        sellingPrice: 32000,
        dailySales: 2
      },
      {
        id: 'sample-2',
        sku: 'SKU-CRIT-02',
        name: 'Granola Cokelat 200 g',
        quantity: 60,
        offset: 3,
        costPerUnit: 15000,
        sellingPrice: 28000,
        dailySales: 6
      },
      {
        id: 'sample-3',
        sku: 'SKU-WARN-03',
        name: 'Madu Hutan 500 ml',
        quantity: 120,
        offset: 18,
        costPerUnit: 42000,
        sellingPrice: 75000,
        dailySales: 3
      },
      {
        id: 'sample-4',
        sku: 'SKU-SAFE-04',
        name: 'Kopi Arabika 200 g',
        quantity: 200,
        offset: 75,
        costPerUnit: 25000,
        sellingPrice: 45000,
        dailySales: 3
      }
    ];

    return specs.map(function (spec) {
      return createBatch({
        id: spec.id,
        sku: spec.sku,
        name: spec.name,
        quantity: spec.quantity,
        expiryDate: dateKeyFromOffset(nowMs, spec.offset),
        costPerUnit: spec.costPerUnit,
        sellingPrice: spec.sellingPrice,
        dailySales: spec.dailySales
      }, { now: nowMs });
    });
  }

  return {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    STATUS_LABELS: STATUS_LABELS,
    STATUS_WEIGHTS: STATUS_WEIGHTS,
    normalizeSettings: normalizeSettings,
    parseDateOnly: parseDateOnly,
    daysUntil: daysUntil,
    validateBatch: validateBatch,
    createBatch: createBatch,
    evaluateBatch: evaluateBatch,
    evaluateBatches: evaluateBatches,
    suggestAction: suggestAction,
    formatNumber: formatNumber,
    formatRupiah: formatRupiah,
    formatPercent: formatPercent,
    formatDaysLeft: formatDaysLeft,
    parseRupiah: parseRupiah,
    parseBatchesCsv: parseBatchesCsv,
    toCsv: toCsv,
    buildSampleBatches: buildSampleBatches
  };
});
