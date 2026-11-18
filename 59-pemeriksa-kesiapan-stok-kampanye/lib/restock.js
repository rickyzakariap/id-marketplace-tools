'use strict';

const MAX_TEXT = 120;
const MAX_NOTE = 400;
const DAY_MS = 86400000;

const MARKETPLACES = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tokopedia', label: 'Tokopedia' },
  { id: 'tiktok', label: 'TikTok Shop' },
  { id: 'lazada', label: 'Lazada' },
  { id: 'blibli', label: 'Blibli' },
  { id: 'lain', label: 'Marketplace lain' },
];

const DEFAULTS = {
  campaign_days: 3,
  uplift_pct: 150,
  safety_days: 4,
  lead_time_days: 10,
  handling_days: 2,
  marketplace_fee_pct: 12,
  packaging_cost: 2000,
};

const LIMITS = {
  max_campaign_days: 90,
  max_safety_days: 60,
  max_lead_time_days: 180,
  max_handling_days: 30,
  max_uplift_pct: 1000,
  max_units: 10000000,
  max_price: 1000000000,
  max_scenarios: 10,
  safe_coverage: 1.1,
  enough_coverage: 1,
};

const DEFAULT_UPLIFTS = [0, 50, 100, 150, 200];

const ASSUMPTIONS = [
  'Permintaan kampanye = penjualan harian biasa x (1 + kenaikan). Penjualan sebelum kampanye tetap memakai penjualan harian biasa.',
  'Buffer keamanan = penjualan harian biasa x hari buffer. Buffer ini bukan angka resmi marketplace.',
  'Tanggal pesan = tanggal kampanye - lead time - hari penanganan. Dua hari penanganan adalah default tool dan bisa diubah.',
  'Ambang aman 110% dan ambang cukup 100% adalah penanda audit internal, bukan aturan resmi marketplace.',
  'Stok masuk dihitung bisa dipakai hanya bila tiba paling lambat pada tanggal kampanye. Bila tanggal tiba kosong, stok masuk dianggap tersedia sekarang.',
  'Laba hilang memakai margin bersih per unit setelah biaya marketplace dan kemasan. Bila margin negatif, laba hilang dihitung 0 dan margin diberi peringatan.',
];

const FORMULAS = [
  'Penjualan harian kampanye = penjualan harian x (1 + kenaikan / 100).',
  'Kebutuhan = penjualan sebelum kampanye + penjualan selama kampanye + buffer keamanan.',
  'Kecukupan = (stok di tangan + stok masuk yang tiba tepat waktu) / kebutuhan.',
  'Kekurangan = maksimal 0 dari kebutuhan dikurangi stok tersedia.',
  'Potensi stok habis = maksimal 0 dari permintaan kampanye dikurangi stok yang tersisa saat kampanye dimulai.',
  'Laba hilang = potensi stok habis x margin bersih per unit.',
  'Kas restock = unit restock yang disarankan x modal per unit.',
];

const FIELD_LABELS = {
  campaign_days: 'Lama kampanye',
  baseline_daily_sales: 'Penjualan harian',
  uplift_pct: 'Kenaikan permintaan',
  stock_on_hand: 'Stok di tangan',
  incoming_qty: 'Stok masuk',
  safety_days: 'Hari buffer',
  lead_time_days: 'Lead time pemasok',
  handling_days: 'Hari penanganan',
  unit_cost: 'Modal per unit',
  unit_price: 'Harga jual',
  marketplace_fee_pct: 'Biaya marketplace',
  packaging_cost: 'Biaya kemasan',
};

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function oneOf(value, list, fallback) {
  return list.some((item) => item.id === value) ? value : fallback;
}

function findById(list, id) {
  return list.find((item) => item.id === id) || list[0];
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  return number;
}

function numOr(value, fallback) {
  const number = parseNumber(value);
  if (number === null) return fallback;
  return number;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  const time = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const date = new Date(time);
  if (
    date.getUTCFullYear() !== parts[0] ||
    date.getUTCMonth() !== parts[1] - 1 ||
    date.getUTCDate() !== parts[2]
  ) {
    return null;
  }
  return time;
}

function formatDate(value) {
  const time = parseDate(value);
  if (time === null) return 'tanggal tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(time));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value, days) {
  const time = parseDate(value);
  if (time === null) return '';
  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (start === null || end === null) return null;
  return Math.round((end - start) / DAY_MS);
}

function dateField(value) {
  return cleanText(value, 20);
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    sku_name: cleanText(input.sku_name, MAX_TEXT),
    marketplace: oneOf(input.marketplace, MARKETPLACES, 'shopee'),
    campaign_name: cleanText(input.campaign_name, MAX_TEXT),
    campaign_date: dateField(input.campaign_date),
    as_of: dateField(input.as_of) || todayIso(),
    campaign_days: numOr(input.campaign_days, DEFAULTS.campaign_days),
    baseline_daily_sales: numOr(input.baseline_daily_sales, 0),
    uplift_pct: numOr(input.uplift_pct, DEFAULTS.uplift_pct),
    stock_on_hand: numOr(input.stock_on_hand, 0),
    incoming_qty: numOr(input.incoming_qty, 0),
    incoming_date: dateField(input.incoming_date),
    safety_days: numOr(input.safety_days, DEFAULTS.safety_days),
    lead_time_days: numOr(input.lead_time_days, DEFAULTS.lead_time_days),
    handling_days: numOr(input.handling_days, DEFAULTS.handling_days),
    unit_cost: numOr(input.unit_cost, 0),
    unit_price: numOr(input.unit_price, 0),
    marketplace_fee_pct: numOr(input.marketplace_fee_pct, DEFAULTS.marketplace_fee_pct),
    packaging_cost: numOr(input.packaging_cost, DEFAULTS.packaging_cost),
    note: cleanText(input.note, MAX_NOTE),
  };
}

function validateRange(input, key, min, max) {
  const value = input[key];
  if (!Number.isFinite(value)) {
    throw new Error(FIELD_LABELS[key] + ' harus berupa angka.');
  }
  if (value < min || value > max) {
    throw new Error(
      FIELD_LABELS[key] + ' harus antara ' + min + ' dan ' + max + '.'
    );
  }
}

function validateInput(input) {
  if (!input.campaign_date) {
    throw new Error('Tanggal kampanye wajib diisi.');
  }
  if (parseDate(input.campaign_date) === null) {
    throw new Error('Tanggal kampanye tidak valid.');
  }
  if (parseDate(input.as_of) === null) {
    throw new Error('Tanggal acuan tidak valid.');
  }
  if (parseDate(input.campaign_date) < parseDate(input.as_of)) {
    throw new Error('Tanggal kampanye tidak boleh sebelum tanggal acuan.');
  }
  if (input.incoming_date && parseDate(input.incoming_date) === null) {
    throw new Error('Tanggal stok masuk tidak valid.');
  }

  validateRange(input, 'campaign_days', 1, LIMITS.max_campaign_days);
  validateRange(input, 'baseline_daily_sales', 0, LIMITS.max_units);
  validateRange(input, 'uplift_pct', 0, LIMITS.max_uplift_pct);
  validateRange(input, 'stock_on_hand', 0, LIMITS.max_units);
  validateRange(input, 'incoming_qty', 0, LIMITS.max_units);
  validateRange(input, 'safety_days', 0, LIMITS.max_safety_days);
  validateRange(input, 'lead_time_days', 0, LIMITS.max_lead_time_days);
  validateRange(input, 'handling_days', 0, LIMITS.max_handling_days);
  validateRange(input, 'unit_cost', 0, LIMITS.max_price);
  validateRange(input, 'unit_price', 0, LIMITS.max_price);
  validateRange(input, 'marketplace_fee_pct', 0, 100);
  validateRange(input, 'packaging_cost', 0, LIMITS.max_price);

  ['campaign_days', 'safety_days', 'lead_time_days', 'handling_days'].forEach((key) => {
    if (!Number.isInteger(input[key])) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka bulat.');
    }
  });
}

function calculateMargin(input) {
  const net = input.unit_price * (1 - input.marketplace_fee_pct / 100) -
    input.unit_cost - input.packaging_cost;
  const percent = input.unit_price > 0 ? (net / input.unit_price) * 100 : 0;
  return {
    net_per_unit: round2(net),
    percent: round1(percent),
    negative: net <= 0,
  };
}

function projectDemand(input, upliftPct) {
  const asOf = parseDate(input.as_of);
  const campaign = parseDate(input.campaign_date);
  const preDays = Math.max(0, Math.round((campaign - asOf) / DAY_MS));
  const campaignDaily = input.baseline_daily_sales * (1 + upliftPct / 100);
  const preDemand = input.baseline_daily_sales * preDays;
  const campaignDemand = campaignDaily * input.campaign_days;
  const safetyUnits = input.baseline_daily_sales * input.safety_days;
  const totalNeed = preDemand + campaignDemand + safetyUnits;

  const incomingTime = parseDate(input.incoming_date);
  const campaignTime = parseDate(input.campaign_date);
  let incomingUsable = 0;
  let incomingLate = 0;
  if (input.incoming_qty > 0) {
    if (incomingTime === null || incomingTime <= campaignTime) {
      incomingUsable = input.incoming_qty;
    } else {
      incomingLate = input.incoming_qty;
    }
  }

  const available = input.stock_on_hand + incomingUsable;
  const coverage = totalNeed > 0 ? available / totalNeed : 1;
  const shortfall = Math.max(0, totalNeed - available);
  const surplus = Math.max(0, available - totalNeed);
  const stockAtCampaign = Math.max(0, available - preDemand);
  const campaignCoverDays = campaignDaily > 0
    ? Math.min(input.campaign_days, stockAtCampaign / campaignDaily)
    : input.campaign_days;
  const stockoutUnits = Math.max(0, campaignDemand - stockAtCampaign);
  const margin = calculateMargin(input);
  const lostRevenue = stockoutUnits * input.unit_price;
  const lostProfit = stockoutUnits * Math.max(0, margin.net_per_unit);
  const restockUnits = Math.ceil(round2(shortfall));
  const cashNeeded = restockUnits * input.unit_cost;

  return {
    uplift_pct: upliftPct,
    pre_days: preDays,
    baseline_daily: round2(input.baseline_daily_sales),
    campaign_daily: round2(campaignDaily),
    pre_demand: round2(preDemand),
    campaign_demand: round2(campaignDemand),
    safety_units: round2(safetyUnits),
    total_need: round2(totalNeed),
    stock_on_hand: round2(input.stock_on_hand),
    incoming_usable: round2(incomingUsable),
    incoming_late: round2(incomingLate),
    available: round2(available),
    coverage_ratio: round2(coverage),
    coverage_pct: round1(coverage * 100),
    shortfall_units: round2(shortfall),
    surplus_units: round2(surplus),
    stock_at_campaign: round2(stockAtCampaign),
    campaign_cover_days: round2(campaignCoverDays),
    stockout_units: round2(stockoutUnits),
    lost_revenue: round2(lostRevenue),
    lost_profit: round2(lostProfit),
    restock_units: restockUnits,
    cash_needed: round2(cashNeeded),
  };
}

function buildTimeline(input) {
  const deadline = addDays(
    input.campaign_date,
    -(input.lead_time_days + input.handling_days)
  );
  const daysUntilCampaign = daysBetween(input.as_of, input.campaign_date);
  const daysToDeadline = deadline ? daysBetween(input.as_of, deadline) : null;
  const incomingLate = input.incoming_qty > 0 &&
    Boolean(input.incoming_date) &&
    parseDate(input.incoming_date) > parseDate(input.campaign_date);

  return {
    as_of: input.as_of,
    as_of_label: formatDate(input.as_of),
    campaign_date: input.campaign_date,
    campaign_date_label: formatDate(input.campaign_date),
    days_until_campaign: daysUntilCampaign,
    restock_deadline: deadline,
    restock_deadline_label: formatDate(deadline),
    days_to_deadline: daysToDeadline,
    order_now: daysToDeadline !== null && daysToDeadline <= 0,
    order_late: daysToDeadline !== null && daysToDeadline < 0,
    incoming_date: input.incoming_date,
    incoming_date_label: input.incoming_date ? formatDate(input.incoming_date) : '',
    incoming_late: incomingLate,
  };
}

function buildVerdict(input, projection, timeline, margin) {
  if (projection.total_need <= 0) {
    return {
      level: 'muted',
      label: 'Belum ada permintaan',
      note: 'Penjualan harian masih 0. Isi rata-rata penjualan harian agar kebutuhan stok dan tanggal restock bisa dihitung.',
    };
  }

  if (projection.coverage_ratio >= LIMITS.safe_coverage) {
    return {
      level: 'ok',
      label: 'Stok aman untuk kampanye',
      note: 'Stok tersedia menutup ' + projection.coverage_pct + '% kebutuhan sampai akhir kampanye. Sisa ' +
        formatNumber(projection.surplus_units) + ' unit di atas kebutuhan, jadi tahan restock tambahan.',
    };
  }

  if (projection.coverage_ratio >= LIMITS.enough_coverage) {
    return {
      level: 'signal',
      label: 'Stok tipis',
      note: 'Permintaan utama tertutup, tetapi buffer keamanan belum penuh. Tambah ' +
        formatNumber(projection.shortfall_units) + ' unit bila pemasok masih bisa mengirim sebelum ' +
        timeline.restock_deadline_label + '.',
    };
  }

  if (timeline.order_late) {
    return {
      level: 'ember',
      label: 'Restock sudah terlambat',
      note: 'Kekurangan ' + formatNumber(projection.shortfall_units) + ' unit dan tanggal pesan ideal ' +
        timeline.restock_deadline_label + ' sudah lewat ' + Math.abs(timeline.days_to_deadline) +
        ' hari. Cek stok cabang, minta pengiriman ekspres, atau kurangi target kampanye.',
    };
  }

  let note = 'Kekurangan ' + formatNumber(projection.shortfall_units) + ' unit. Pesan minimal ' +
    formatNumber(projection.restock_units) + ' unit sebelum ' + timeline.restock_deadline_label +
    ' agar tiba sebelum kampanye.';
  if (margin.negative) {
    note += ' Margin per unit negatif, jadi restock justru memperbesar kerugian.';
  }

  return {
    level: 'ember',
    label: 'Stok kurang, pesan sekarang',
    note: note,
  };
}

function buildRecommendations(input, projection, timeline, margin) {
  const list = [];

  if (projection.shortfall_units > 0) {
    list.push(
      'Pesan minimal ' + formatNumber(projection.restock_units) + ' unit, perkiraan kas ' +
      formatRupiah(projection.cash_needed) + ', paling lambat ' +
      timeline.restock_deadline_label + '.'
    );
  } else {
    list.push(
      'Tidak perlu restock tambahan untuk skenario ini. Stok tersedia ' +
      formatNumber(projection.available) + ' unit, kebutuhan ' +
      formatNumber(projection.total_need) + ' unit.'
    );
  }

  if (timeline.order_late) {
    list.push(
      'Lead time ' + input.lead_time_days + ' hari ditambah ' + input.handling_days +
      ' hari penanganan sudah melewati tanggal pesan ideal. Minta pengiriman ekspres atau alihkan stok dari gudang lain.'
    );
  }

  if (projection.incoming_late > 0) {
    list.push(
      'Stok masuk ' + formatNumber(projection.incoming_late) + ' unit tiba setelah tanggal kampanye, jadi belum dihitung sebagai stok tersedia.'
    );
  } else if (input.incoming_qty > 0 && !input.incoming_date) {
    list.push(
      'Tanggal tiba stok masuk belum diisi. Tool menganggap stok itu tersedia sekarang. Konfirmasi tanggal tiba ke pemasok.'
    );
  }

  if (projection.coverage_ratio >= LIMITS.enough_coverage &&
    projection.coverage_ratio < LIMITS.safe_coverage) {
    list.push(
      'Kecukupan ' + projection.coverage_pct + '% masih di bawah ambang aman 110%. Tambah ' +
      formatNumber(projection.shortfall_units) + ' unit bila memungkinkan.'
    );
  }

  if (margin.negative) {
    list.push(
      'Margin bersih per unit ' + formatRupiah(margin.net_per_unit) + ' (' +
      margin.percent + '%). Harga jual belum menutup modal, biaya marketplace, dan kemasan. Perbaiki harga sebelum menambah stok.'
    );
  } else {
    list.push(
      'Margin bersih per unit ' + formatRupiah(margin.net_per_unit) + ' (' +
      margin.percent + '%). Potensi laba hilang bila stok habis: ' +
      formatRupiah(projection.lost_profit) + '.'
    );
  }

  if (projection.stockout_units > 0) {
    list.push(
      'Potensi ' + formatNumber(projection.stockout_units) + ' unit tidak terpenuhi selama kampanye, setara omzet hilang ' +
      formatRupiah(projection.lost_revenue) + '.'
    );
  }

  if (input.uplift_pct >= 200) {
    list.push(
      'Kenaikan ' + input.uplift_pct + '% sudah tinggi. Siapkan kapasitas packing dan cek batas stok per pesanan agar tidak oversell.'
    );
  }

  if (input.campaign_days >= 7) {
    list.push(
      'Kampanye berjalan ' + input.campaign_days + ' hari. Bagi kebutuhan menjadi dua gelombang restock agar modal tidak terkunci sekaligus.'
    );
  }

  list.push(
    'Perbarui penjualan harian dari data 14 sampai 30 hari terakhir, bukan dari satu hari terbaik.'
  );
  list.push(
    'Tool ini alat bantu perencanaan, bukan jaminan stok atau penjualan. Cocokkan dengan kapasitas pemasok dan kanal resmi marketplace.'
  );

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);
  const projection = projectDemand(input, input.uplift_pct);
  const timeline = buildTimeline(input);
  const margin = calculateMargin(input);
  const verdict = buildVerdict(input, projection, timeline, margin);
  const recommendations = buildRecommendations(input, projection, timeline, margin);

  return {
    input,
    marketplace_label: findById(MARKETPLACES, input.marketplace).label,
    timeline,
    margin,
    projection,
    verdict,
    recommendations,
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
  };
}

function normalizeUplifts(raw) {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_UPLIFTS.slice();
  if (!Array.isArray(raw)) {
    throw new Error('Daftar skenario kenaikan harus berupa array.');
  }
  if (raw.length === 0) {
    throw new Error('Isi minimal satu skenario kenaikan.');
  }
  if (raw.length > LIMITS.max_scenarios) {
    throw new Error('Maksimal ' + LIMITS.max_scenarios + ' skenario kenaikan.');
  }
  const levels = raw.map((value) => {
    const number = parseNumber(value);
    if (number === null || !Number.isFinite(number) || number < 0 ||
      number > LIMITS.max_uplift_pct) {
      throw new Error('Kenaikan permintaan skenario harus angka 0 sampai ' +
        LIMITS.max_uplift_pct + ' persen.');
    }
    return round1(number);
  });
  return levels
    .filter((value, index) => levels.indexOf(value) === index)
    .sort((a, b) => a - b);
}

function scenarios(raw) {
  const input = normalizeInput(raw);
  validateInput(input);
  const levels = normalizeUplifts(raw && raw.uplifts);
  const timeline = buildTimeline(input);
  const margin = calculateMargin(input);
  const rows = levels.map((level) => {
    const projection = projectDemand(input, level);
    return Object.assign({ uplift_pct: level }, projection);
  });

  return {
    input,
    marketplace_label: findById(MARKETPLACES, input.marketplace).label,
    timeline,
    margin,
    rows,
    note: 'Skenario memakai tanggal, stok, dan biaya yang sama. Hanya kenaikan permintaan yang berubah.',
    assumptions: ASSUMPTIONS,
  };
}

function csvEscape(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(raw) {
  const result = scenarios(raw);
  const header = [
    'sku',
    'kampanye',
    'tanggal_kampanye',
    'kenaikan_persen',
    'permintaan_harian_kampanye',
    'kebutuhan_total',
    'stok_tersedia',
    'kecukupan_persen',
    'kekurangan_unit',
    'potensi_stok_habis_unit',
    'omzet_hilang',
    'laba_hilang',
    'saran_restock_unit',
    'kas_dibutuhkan',
    'tanggal_pesan_ideal',
  ];
  const lines = [header.join(',')];
  result.rows.forEach((row) => {
    lines.push([
      result.input.sku_name,
      result.input.campaign_name,
      result.input.campaign_date,
      row.uplift_pct,
      row.campaign_daily,
      row.total_need,
      row.available,
      row.coverage_pct,
      row.shortfall_units,
      row.stockout_units,
      row.lost_revenue,
      row.lost_profit,
      row.restock_units,
      row.cash_needed,
      result.timeline.restock_deadline,
    ].map(csvEscape).join(','));
  });
  return lines.join('\n');
}

function example() {
  return {
    sku_name: 'Jaket Bomber Pria',
    marketplace: 'shopee',
    campaign_name: 'Flash Sale 12 Desember',
    campaign_date: '2026-12-12',
    as_of: '2026-11-18',
    campaign_days: 3,
    baseline_daily_sales: 30,
    uplift_pct: 150,
    stock_on_hand: 600,
    incoming_qty: 200,
    incoming_date: '2026-12-05',
    safety_days: 4,
    lead_time_days: 10,
    handling_days: 2,
    unit_cost: 78000,
    unit_price: 149000,
    marketplace_fee_pct: 12,
    packaging_cost: 2000,
    note: 'Contoh ilustrasi. Angka penjualan, stok, dan harga bukan data resmi marketplace.',
  };
}

function meta() {
  return {
    marketplaces: MARKETPLACES,
    defaults: DEFAULTS,
    limits: LIMITS,
    scenario_uplifts: DEFAULT_UPLIFTS,
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    thresholds: {
      safe_coverage: LIMITS.safe_coverage,
      enough_coverage: LIMITS.enough_coverage,
      note: 'Ambang 100% dan 110% adalah penanda audit internal tool, bukan aturan resmi marketplace.',
    },
  };
}

module.exports = {
  meta,
  example,
  analyze,
  scenarios,
  csvRows,
  normalizeInput,
  validateInput,
  projectDemand,
  calculateMargin,
  buildTimeline,
  normalizeUplifts,
  MARKETPLACES,
  DEFAULTS,
  LIMITS,
  DEFAULT_UPLIFTS,
  ASSUMPTIONS,
  FORMULAS,
};
