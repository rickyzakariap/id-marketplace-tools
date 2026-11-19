(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DeadlineLib = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MINUTE_MS = 60 * 1000;
  var HOUR_MS = 60 * MINUTE_MS;

  var MARKETPLACES = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada', 'Blibli', 'Lainnya'];

  var DEFAULT_SETTINGS = Object.freeze({
    warningMinutes: 240,
    criticalMinutes: 60,
    packingBufferMinutes: 120,
    penaltyPerLate: 10000,
    defaultSlaHours: 24
  });

  var STATUS_LABELS = Object.freeze({
    safe: 'Aman',
    warning: 'Waspada',
    critical: 'Kritis',
    late: 'Terlambat'
  });

  var STATUS_WEIGHTS = Object.freeze({
    safe: 100,
    warning: 70,
    critical: 35,
    late: 0
  });

  function clampNumber(value, minimum, maximum, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function parseTime(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return NaN;
    var text = value.trim();
    if (!text) return NaN;
    var normalized = text.replace(' ', 'T');
    var parsed = Date.parse(normalized);
    if (Number.isFinite(parsed)) return parsed;
    return Date.parse(text);
  }

  function resolveNow(value) {
    if (value === undefined || value === null) return Date.now();
    var parsed = parseTime(value);
    if (!Number.isFinite(parsed)) throw new TypeError('Waktu acuan tidak valid');
    return parsed;
  }

  function normalizeSettings(input) {
    var settings = {
      warningMinutes: DEFAULT_SETTINGS.warningMinutes,
      criticalMinutes: DEFAULT_SETTINGS.criticalMinutes,
      packingBufferMinutes: DEFAULT_SETTINGS.packingBufferMinutes,
      penaltyPerLate: DEFAULT_SETTINGS.penaltyPerLate,
      defaultSlaHours: DEFAULT_SETTINGS.defaultSlaHours
    };

    if (!input || typeof input !== 'object') return settings;

    settings.warningMinutes = clampNumber(
      input.warningMinutes, 30, 10080, DEFAULT_SETTINGS.warningMinutes
    );
    settings.criticalMinutes = clampNumber(
      input.criticalMinutes, 15, settings.warningMinutes, DEFAULT_SETTINGS.criticalMinutes
    );
    if (settings.criticalMinutes > settings.warningMinutes) {
      settings.criticalMinutes = settings.warningMinutes;
    }
    settings.packingBufferMinutes = clampNumber(
      input.packingBufferMinutes, 0, 1440, DEFAULT_SETTINGS.packingBufferMinutes
    );
    settings.penaltyPerLate = clampNumber(
      input.penaltyPerLate, 0, 1000000000, DEFAULT_SETTINGS.penaltyPerLate
    );
    settings.defaultSlaHours = clampNumber(
      input.defaultSlaHours, 1, 240, DEFAULT_SETTINGS.defaultSlaHours
    );

    return settings;
  }

  function matchMarketplace(value) {
    var text = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
    if (!text) return 'Lainnya';
    if (text === 'tiktok' || text === 'tiktok shop' || text === 'tiktokshop') {
      return 'TikTok Shop';
    }
    for (var index = 0; index < MARKETPLACES.length; index += 1) {
      if (MARKETPLACES[index].toLowerCase() === text) return MARKETPLACES[index];
    }
    return null;
  }

  function validateOrder(input) {
    var errors = [];

    if (!input || typeof input !== 'object') {
      return ['data pesanan tidak valid'];
    }

    var code = typeof input.code === 'string' ? input.code.trim() : '';
    if (!code) {
      errors.push('kode pesanan wajib diisi');
    } else if (code.length > 60) {
      errors.push('kode pesanan maksimal 60 karakter');
    } else if (/[\r\n]/.test(code)) {
      errors.push('kode pesanan tidak boleh berisi baris baru');
    }

    if (MARKETPLACES.indexOf(input.marketplace) === -1) {
      errors.push('marketplace harus salah satu dari: ' + MARKETPLACES.join(', '));
    }

    if (!Number.isFinite(parseTime(input.orderAt))) {
      errors.push('waktu order tidak valid');
    }

    var slaHours = Number(input.slaHours);
    if (!Number.isFinite(slaHours) || slaHours < 1 || slaHours > 240) {
      errors.push('SLA harus berupa angka 1 sampai 240 jam');
    }

    var orderValue = Number(input.orderValue);
    if (!Number.isFinite(orderValue) || orderValue < 0 || orderValue > 1000000000000) {
      errors.push('nilai pesanan harus berupa angka 0 sampai 1.000.000.000.000');
    }

    return errors;
  }

  function createOrder(input, options) {
    var errors = validateOrder(input);
    if (errors.length > 0) {
      var error = new Error(errors.join('; '));
      error.name = 'ValidationError';
      error.details = errors;
      throw error;
    }

    var nowMs = options && Number.isFinite(options.now) ? options.now : Date.now();
    var providedId = input.id && String(input.id).trim();
    var identifier = providedId || 'ord-' + Math.random().toString(36).slice(2, 10);

    return {
      id: identifier,
      code: input.code.trim(),
      marketplace: input.marketplace,
      orderAt: new Date(parseTime(input.orderAt)).toISOString(),
      slaHours: Number(input.slaHours),
      orderValue: Math.round(Number(input.orderValue)),
      createdAt: new Date(nowMs).toISOString()
    };
  }

  function calculateDeadline(orderAt, slaHours) {
    var startMs = parseTime(orderAt);
    var hours = Number(slaHours);
    if (!Number.isFinite(startMs) || !Number.isFinite(hours)) {
      throw new TypeError('Waktu order atau SLA tidak valid');
    }
    return new Date(startMs + hours * HOUR_MS).toISOString();
  }

  function evaluateOrder(order, settingsInput, nowInput) {
    var settings = normalizeSettings(settingsInput);
    var nowMs = resolveNow(nowInput);
    var startMs = parseTime(order.orderAt);
    var slaHours = Number(order.slaHours);

    if (!Number.isFinite(startMs) || !Number.isFinite(slaHours)) {
      throw new TypeError('Data pesanan tidak valid');
    }

    var deadlineMs = startMs + slaHours * HOUR_MS;
    var remainingMs = deadlineMs - nowMs;
    var warningMs = settings.warningMinutes * MINUTE_MS;
    var criticalMs = settings.criticalMinutes * MINUTE_MS;
    var packingStartMs = deadlineMs - settings.packingBufferMinutes * MINUTE_MS;
    var packingRemainingMs = packingStartMs - nowMs;

    var status = 'safe';
    if (remainingMs <= 0) {
      status = 'late';
    } else if (remainingMs <= criticalMs) {
      status = 'critical';
    } else if (remainingMs <= warningMs) {
      status = 'warning';
    }

    return {
      id: order.id,
      code: order.code,
      marketplace: order.marketplace,
      orderAt: order.orderAt,
      slaHours: slaHours,
      orderValue: Number(order.orderValue) || 0,
      createdAt: order.createdAt,
      deadline: new Date(deadlineMs).toISOString(),
      remainingMs: remainingMs,
      status: status,
      statusLabel: STATUS_LABELS[status],
      packingStart: new Date(packingStartMs).toISOString(),
      packingRemainingMs: packingRemainingMs,
      packingOverdue: remainingMs > 0 && packingRemainingMs <= 0,
      lateByMs: remainingMs < 0 ? Math.abs(remainingMs) : 0,
      estimatedPenalty: status === 'late' ? settings.penaltyPerLate : 0
    };
  }

  function evaluateOrders(orders, settingsInput, nowInput) {
    var settings = normalizeSettings(settingsInput);
    var nowMs = resolveNow(nowInput);
    var evaluated = [];
    var invalid = 0;

    (Array.isArray(orders) ? orders : []).forEach(function (order) {
      if (validateOrder(order).length > 0) {
        invalid += 1;
        return;
      }
      evaluated.push(evaluateOrder(order, settings, nowMs));
    });

    evaluated.sort(function (left, right) {
      if (left.remainingMs !== right.remainingMs) return left.remainingMs - right.remainingMs;
      return String(left.code).localeCompare(String(right.code), 'id');
    });

    var summary = {
      total: evaluated.length,
      invalid: invalid,
      safe: 0,
      warning: 0,
      critical: 0,
      late: 0,
      mustPackNow: 0,
      latePenalty: 0,
      valueAtRisk: 0,
      score: 100,
      nextDeadline: null,
      generatedAt: new Date(nowMs).toISOString()
    };

    var scoreTotal = 0;
    evaluated.forEach(function (order) {
      summary[order.status] += 1;
      scoreTotal += STATUS_WEIGHTS[order.status];
      if (order.status === 'late') {
        summary.latePenalty += order.estimatedPenalty;
      }
      if (order.status === 'critical' || order.status === 'late') {
        summary.valueAtRisk += order.orderValue;
      }
      if (order.packingOverdue && order.status !== 'late') {
        summary.mustPackNow += 1;
      }
    });

    if (evaluated.length > 0) {
      summary.score = Math.round(scoreTotal / evaluated.length);
      var nextOrder = evaluated.find(function (order) {
        return order.remainingMs > 0;
      });
      if (nextOrder) summary.nextDeadline = nextOrder.deadline;
    }

    return {
      orders: evaluated,
      summary: summary,
      settings: settings
    };
  }

  function formatNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '0';
    var negative = number < 0;
    var digits = String(Math.round(Math.abs(number)));
    var output = '';
    for (var index = 0; index < digits.length; index += 1) {
      if (index > 0 && (digits.length - index) % 3 === 0) output += '.';
      output += digits[index];
    }
    return (negative ? '-' : '') + output;
  }

  function formatRupiah(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 'Rp 0';
    return 'Rp ' + formatNumber(number);
  }

  function formatRemaining(value) {
    var milliseconds = Number(value);
    if (!Number.isFinite(milliseconds)) return 'Waktu tidak valid';

    var late = milliseconds <= 0;
    var absolute = Math.abs(milliseconds);
    var body;

    if (absolute < MINUTE_MS) {
      body = 'kurang dari 1 menit';
    } else {
      var totalMinutes = Math.floor(absolute / MINUTE_MS);
      var days = Math.floor(totalMinutes / 1440);
      var hours = Math.floor((totalMinutes % 1440) / 60);
      var minutes = totalMinutes % 60;
      var parts = [];
      if (days > 0) parts.push(days + ' hari');
      if (hours > 0) parts.push(hours + ' jam');
      if (minutes > 0) parts.push(minutes + ' menit');
      body = parts.join(' ');
    }

    return late ? 'Terlambat ' + body : body + ' lagi';
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

  function parseOrdersCsv(text) {
    var orders = [];
    var errors = [];

    if (typeof text !== 'string' || !text.trim()) {
      return { orders: orders, errors: [{ line: 0, message: 'CSV kosong' }] };
    }

    var lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    var start = 0;
    var firstContent = lines.findIndex(function (line) {
      return line.trim().length > 0;
    });
    if (firstContent >= 0 && /^kode\s*,/i.test(lines[firstContent].trim())) {
      start = firstContent + 1;
    }

    for (var index = start; index < lines.length; index += 1) {
      var line = lines[index].trim();
      if (!line) continue;
      var lineNumber = index + 1;
      var cells = splitCsvLine(line);

      if (cells.length !== 5) {
        errors.push({
          line: lineNumber,
          message: 'butuh tepat 5 kolom: kode, marketplace, waktu order, SLA jam, nilai'
        });
        continue;
      }

      var input = {
        code: cells[0],
        marketplace: matchMarketplace(cells[1]),
        orderAt: cells[2],
        slaHours: Number(cells[3].replace(',', '.')),
        orderValue: parseRupiah(cells[4])
      };
      var problems = validateOrder(input);

      if (problems.length > 0) {
        errors.push({ line: lineNumber, message: problems.join('; ') });
        continue;
      }

      orders.push(createOrder(input));
    }

    return { orders: orders, errors: errors };
  }

  function csvCell(value) {
    var text = String(value === undefined || value === null ? '' : value);
    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function toCsv(orders, settingsInput, nowInput) {
    var evaluation = evaluateOrders(orders, settingsInput, nowInput);
    var lines = [
      'kode,marketplace,waktu_order,tenggat,status,sisa_menit,nilai_pesanan,estimasi_denda'
    ];

    evaluation.orders.forEach(function (order) {
      lines.push([
        csvCell(order.code),
        csvCell(order.marketplace),
        csvCell(order.orderAt),
        csvCell(order.deadline),
        csvCell(order.status),
        String(Math.round(order.remainingMs / MINUTE_MS)),
        String(order.orderValue),
        String(order.estimatedPenalty)
      ].join(','));
    });

    return lines.join('\n');
  }

  function buildSampleOrders(nowInput) {
    var nowMs = resolveNow(nowInput);
    var specs = [
      {
        id: 'sample-1',
        code: 'SMP-1001',
        marketplace: 'Shopee',
        minutesAgo: 20 * 60,
        slaHours: 24,
        orderValue: 185000
      },
      {
        id: 'sample-2',
        code: 'SMP-1002',
        marketplace: 'Tokopedia',
        minutesAgo: 23 * 60 + 30,
        slaHours: 24,
        orderValue: 320000
      },
      {
        id: 'sample-3',
        code: 'SMP-1003',
        marketplace: 'TikTok Shop',
        minutesAgo: 26 * 60,
        slaHours: 24,
        orderValue: 149000
      },
      {
        id: 'sample-4',
        code: 'SMP-1004',
        marketplace: 'Lazada',
        minutesAgo: 2 * 60,
        slaHours: 24,
        orderValue: 275000
      }
    ];

    return specs.map(function (spec) {
      return createOrder({
        id: spec.id,
        code: spec.code,
        marketplace: spec.marketplace,
        orderAt: new Date(nowMs - spec.minutesAgo * MINUTE_MS).toISOString(),
        slaHours: spec.slaHours,
        orderValue: spec.orderValue
      }, { now: nowMs });
    });
  }

  return {
    MARKETPLACES: MARKETPLACES,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    STATUS_LABELS: STATUS_LABELS,
    STATUS_WEIGHTS: STATUS_WEIGHTS,
    normalizeSettings: normalizeSettings,
    matchMarketplace: matchMarketplace,
    validateOrder: validateOrder,
    createOrder: createOrder,
    calculateDeadline: calculateDeadline,
    evaluateOrder: evaluateOrder,
    evaluateOrders: evaluateOrders,
    formatNumber: formatNumber,
    formatRupiah: formatRupiah,
    formatRemaining: formatRemaining,
    parseRupiah: parseRupiah,
    parseOrdersCsv: parseOrdersCsv,
    toCsv: toCsv,
    buildSampleOrders: buildSampleOrders
  };
});
