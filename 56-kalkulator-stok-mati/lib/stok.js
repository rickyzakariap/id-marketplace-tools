'use strict';

const MAX_TEXT = 120;
const MAX_CODE = 40;
const MAX_SKUS = 100;

const DEFAULT_SETTINGS = {
  slow_days: 45,
  dead_days: 90,
  target_clear_months: 3,
  storage_per_unit_month: 500,
  capital_rate_pct_year: 12,
  damage_rate_pct_month: 1,
  fee_pct: 8,
};

const SETTING_FIELDS = [
  {
    key: 'slow_days',
    label: 'Batas stok melambat (hari)',
    min: 1,
    max: 365,
    step: 1,
    unit: 'hari',
    default_value: 45,
  },
  {
    key: 'dead_days',
    label: 'Batas stok mati (hari)',
    min: 2,
    max: 730,
    step: 1,
    unit: 'hari',
    default_value: 90,
  },
  {
    key: 'target_clear_months',
    label: 'Target stok habis (bulan)',
    min: 1,
    max: 24,
    step: 1,
    unit: 'bulan',
    default_value: 3,
  },
  {
    key: 'storage_per_unit_month',
    label: 'Biaya simpan per unit per bulan',
    min: 0,
    max: 100000,
    step: 50,
    unit: 'Rp',
    default_value: 500,
  },
  {
    key: 'capital_rate_pct_year',
    label: 'Biaya modal per tahun',
    min: 0,
    max: 60,
    step: 0.5,
    unit: '%',
    default_value: 12,
  },
  {
    key: 'damage_rate_pct_month',
    label: 'Risiko rusak per bulan',
    min: 0,
    max: 20,
    step: 0.5,
    unit: '%',
    default_value: 1,
  },
  {
    key: 'fee_pct',
    label: 'Biaya marketplace saat cair',
    min: 0,
    max: 50,
    step: 0.5,
    unit: '%',
    default_value: 8,
  },
];

const STATUSES = [
  {
    id: 'habis',
    label: 'Habis',
    level: 'muted',
    action: 'Stok habis. Evaluasi apakah produk ini masih layak direstock.',
  },
  {
    id: 'sehat',
    label: 'Sehat',
    level: 'ok',
    action: 'Pertahankan. Restock mengikuti kecepatan jual.',
  },
  {
    id: 'baru',
    label: 'Baru',
    level: 'signal',
    action: 'Pantau 30 hari. Jangan restock sebelum ada penjualan.',
  },
  {
    id: 'melambat',
    label: 'Melambat',
    level: 'signal',
    action: 'Turunkan harga bertahap atau bundling. Tahan restock sampai sisa stok turun.',
  },
  {
    id: 'mati',
    label: 'Mati',
    level: 'ember',
    action: 'Hentikan restock. Likuidasi lewat diskon, bundling, atau kanal lain.',
  },
];

const ASSUMPTIONS = [
  'Biaya simpan per unit per bulan diisi manual. Angka awal Rp500 adalah asumsi, ' +
    'bukan tarif platform.',
  'Biaya modal 12 persen per tahun adalah asumsi biaya kesempatan, bukan bunga ' +
    'pinjaman tertentu.',
  'Risiko rusak 1 persen per bulan adalah asumsi untuk barang yang mudah rusak ' +
    'atau ketinggalan tren.',
  'Biaya marketplace 8 persen dipakai untuk menghitung uang bersih saat likuidasi. ' +
    'Ganti dengan tarif toko Anda.',
  'Status stok adalah heuristik dari umur stok, kecepatan jual, dan target bulan ' +
    'habis. Bukan aturan marketplace.',
  'Skenario diskon menganggap semua sisa stok bisa terjual pada harga diskon yang ' +
    'dipilih. Ini pembanding, bukan ramalan.',
];

const FORMULAS = [
  'Bulan habis = jumlah stok / penjualan per bulan.',
  'Biaya simpan per bulan = stok x biaya simpan + modal x biaya modal / 12 + ' +
    'modal x risiko rusak.',
  'Diskon impas = biaya simpan sampai habis / (nilai jual x (1 - biaya marketplace)).',
  'Skenario membandingkan uang bersih jual sekarang dengan uang bersih jual ' +
    'bertahap dikurangi biaya simpan.',
];

const SCOPE_NOTE =
  'Tool membantu menghitung modal tertahan dan membandingkan opsi likuidasi. ' +
  'Tool tidak memprediksi permintaan dan tidak memakai tarif resmi marketplace tertentu.';

const DISCLAIMER =
  'Angka biaya dan diskon adalah estimasi dari input Anda. Keputusan stok tetap milik penjual. ' +
  'Selalu cocokkan dengan laporan stok, arus kas, dan syarat program marketplace ' +
  'yang sedang berlaku.';

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
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value === 'string') {
    if (value.trim() === '') return null;
    const number = Number(value.trim());
    return Number.isFinite(number) ? number : NaN;
  }
  return NaN;
}

function numOr(value, fallback) {
  const number = parseNumber(value);
  if (number === null) return fallback;
  return number;
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

function normalizeSettings(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    slow_days: numOr(input.slow_days, DEFAULT_SETTINGS.slow_days),
    dead_days: numOr(input.dead_days, DEFAULT_SETTINGS.dead_days),
    target_clear_months: numOr(
      input.target_clear_months,
      DEFAULT_SETTINGS.target_clear_months
    ),
    storage_per_unit_month: numOr(
      input.storage_per_unit_month,
      DEFAULT_SETTINGS.storage_per_unit_month
    ),
    capital_rate_pct_year: numOr(
      input.capital_rate_pct_year,
      DEFAULT_SETTINGS.capital_rate_pct_year
    ),
    damage_rate_pct_month: numOr(
      input.damage_rate_pct_month,
      DEFAULT_SETTINGS.damage_rate_pct_month
    ),
    fee_pct: numOr(input.fee_pct, DEFAULT_SETTINGS.fee_pct),
  };
}

function normalizeSku(raw, index) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    code: cleanText(input.code, MAX_CODE),
    name: cleanText(input.name, MAX_TEXT),
    quantity: numOr(input.quantity, 0),
    unit_cost: numOr(input.unit_cost, 0),
    unit_price: numOr(input.unit_price, 0),
    monthly_sales: numOr(input.monthly_sales, 0),
    days_in_stock: numOr(input.days_in_stock, 0),
    row: index + 1,
  };
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const rawSkus = Array.isArray(input.skus)
    ? input.skus
    : Array.isArray(input.items)
      ? input.items
      : [];

  return {
    settings: normalizeSettings(input.settings),
    skus: rawSkus.map((item, index) => normalizeSku(item, index)),
  };
}

function validateSettings(settings) {
  const labels = {
    slow_days: 'Batas stok melambat',
    dead_days: 'Batas stok mati',
    target_clear_months: 'Target stok habis',
    storage_per_unit_month: 'Biaya simpan per unit per bulan',
    capital_rate_pct_year: 'Biaya modal per tahun',
    damage_rate_pct_month: 'Risiko rusak per bulan',
    fee_pct: 'Biaya marketplace',
  };

  SETTING_FIELDS.forEach((field) => {
    const value = settings[field.key];
    if (!Number.isFinite(value)) {
      throw new Error(labels[field.key] + ' harus berupa angka.');
    }
    if (value < field.min || value > field.max) {
      throw new Error(
        labels[field.key] + ' harus antara ' + field.min + ' dan ' + field.max + '.'
      );
    }
    if (['slow_days', 'dead_days', 'target_clear_months'].includes(field.key)) {
      if (!Number.isInteger(value)) {
        throw new Error(labels[field.key] + ' harus bilangan bulat.');
      }
    }
  });

  if (settings.dead_days < settings.slow_days) {
    throw new Error('Batas stok mati tidak boleh lebih kecil dari batas stok melambat.');
  }
}

function validateInput(input) {
  validateSettings(input.settings);

  if (!Array.isArray(input.skus) || input.skus.length === 0) {
    throw new Error('Isi minimal satu SKU untuk dihitung.');
  }
  if (input.skus.length > MAX_SKUS) {
    throw new Error('Maksimal ' + MAX_SKUS + ' SKU dalam satu perhitungan.');
  }

  input.skus.forEach((item, index) => {
    const position = 'SKU baris ' + (index + 1);
    if (!item.name) {
      throw new Error('Nama SKU wajib diisi pada baris ' + (index + 1) + '.');
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 0) {
      throw new Error('Jumlah stok ' + position + ' harus angka 0 atau lebih.');
    }
    if (!Number.isInteger(item.quantity)) {
      throw new Error('Jumlah stok ' + position + ' harus bilangan bulat.');
    }
    if (!Number.isFinite(item.unit_cost) || item.unit_cost < 0) {
      throw new Error('Modal per unit ' + position + ' harus angka 0 atau lebih.');
    }
    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      throw new Error('Harga jual ' + position + ' harus angka 0 atau lebih.');
    }
    if (item.quantity > 0 && item.unit_price <= 0) {
      throw new Error('Harga jual ' + position + ' harus lebih dari 0 bila stok ada.');
    }
    if (!Number.isFinite(item.monthly_sales) || item.monthly_sales < 0) {
      throw new Error('Penjualan per bulan ' + position + ' harus angka 0 atau lebih.');
    }
    if (!Number.isFinite(item.days_in_stock) || item.days_in_stock < 0) {
      throw new Error('Umur stok ' + position + ' harus angka 0 atau lebih.');
    }
    if (!Number.isInteger(item.days_in_stock)) {
      throw new Error('Umur stok ' + position + ' harus bilangan bulat.');
    }
  });

  const totalUnits = input.skus.reduce((sum, item) => sum + item.quantity, 0);
  if (totalUnits <= 0) {
    throw new Error('Isi minimal satu SKU dengan jumlah stok lebih dari 0.');
  }
}

function classify(sku, settings) {
  if (sku.quantity <= 0) {
    return { id: 'habis', coverage_months: null, note: 'Tidak ada sisa stok.' };
  }

  const coverage = sku.monthly_sales > 0 ? sku.quantity / sku.monthly_sales : null;

  if (sku.monthly_sales <= 0) {
    if (sku.days_in_stock >= settings.dead_days) {
      return {
        id: 'mati',
        coverage_months: null,
        note:
          'Tidak ada penjualan selama ' +
          sku.days_in_stock +
          ' hari, sudah melewati batas ' +
          settings.dead_days +
          ' hari.',
      };
    }
    if (sku.days_in_stock >= settings.slow_days) {
      return {
        id: 'melambat',
        coverage_months: null,
        note:
          'Belum ada penjualan pada ' + sku.days_in_stock + ' hari pertama. Pantau segera.',
      };
    }
    return {
      id: 'baru',
      coverage_months: null,
      note: 'Stok masih baru dan belum punya riwayat penjualan yang cukup.',
    };
  }

  if (
    sku.days_in_stock >= settings.dead_days &&
    coverage > settings.target_clear_months
  ) {
    return {
      id: 'mati',
      coverage_months: coverage,
      note:
        'Butuh ' +
        round2(coverage) +
        ' bulan untuk habis, di atas target ' +
        settings.target_clear_months +
        ' bulan.',
    };
  }

  if (
    sku.days_in_stock >= settings.slow_days ||
    coverage > settings.target_clear_months
  ) {
    return {
      id: 'melambat',
      coverage_months: coverage,
      note:
        'Butuh ' +
        round2(coverage) +
        ' bulan untuk habis. Percepat perputaran stok.',
    };
  }

  return {
    id: 'sehat',
    coverage_months: coverage,
    note: 'Perputaran stok masih dalam target.',
  };
}

function calculateSku(item, settings) {
  const status = classify(item, settings);
  const statusInfo = findById(STATUSES, status.id);
  const capital = item.quantity * item.unit_cost;
  const retailValue = item.quantity * item.unit_price;
  const storageCost = item.quantity * settings.storage_per_unit_month;
  const capitalCost = (capital * settings.capital_rate_pct_year) / 100 / 12;
  const damageCost = (capital * settings.damage_rate_pct_month) / 100;
  const holdingCostMonth = storageCost + capitalCost + damageCost;
  const coverage = status.coverage_months;
  const holdingMonths = coverage !== null ? coverage : settings.target_clear_months;
  const holdingCostToClear = holdingCostMonth * holdingMonths;
  const netRetail = retailValue * (1 - settings.fee_pct / 100);
  const breakEvenDiscount =
    netRetail > 0 ? Math.min(100, (holdingCostToClear / netRetail) * 100) : 0;
  const atRisk = status.id === 'mati' || status.id === 'melambat';

  return {
    code: item.code,
    name: item.name,
    row: item.row,
    quantity: item.quantity,
    unit_cost: round2(item.unit_cost),
    unit_price: round2(item.unit_price),
    monthly_sales: round2(item.monthly_sales),
    days_in_stock: item.days_in_stock,
    capital: round2(capital),
    retail_value: round2(retailValue),
    coverage_months: coverage === null ? null : round2(coverage),
    status: status.id,
    status_label: statusInfo.label,
    status_level: statusInfo.level,
    at_risk: atRisk,
    note: status.note,
    action: statusInfo.action,
    storage_cost_month: round2(storageCost),
    capital_cost_month: round2(capitalCost),
    damage_cost_month: round2(damageCost),
    holding_cost_month: round2(holdingCostMonth),
    holding_cost_per_unit_month:
      item.quantity > 0 ? round2(holdingCostMonth / item.quantity) : 0,
    holding_cost_to_clear: round2(holdingCostToClear),
    break_even_discount_pct: round2(breakEvenDiscount),
    full_price_net: round2(netRetail),
    capital_recovery_pct:
      capital > 0 ? round2((netRetail / capital) * 100) : null,
  };
}

function buildVerdict(summary) {
  if (summary.at_risk_capital <= 0) {
    return {
      level: 'ok',
      label: 'Stok masih berputar',
      note:
        'Tidak ada SKU yang masuk kategori melambat atau mati. Pertahankan ' +
        'pencatatan umur stok dan hitung ulang setiap bulan.',
    };
  }

  if (summary.dead_capital > 0 && summary.dead_ratio_pct >= 25) {
    return {
      level: 'ember',
      label: 'Modal tertahan di stok mati',
      note:
        formatRupiah(summary.dead_capital) +
        ' atau ' +
        summary.dead_ratio_pct +
        ' persen modal berada di stok mati. Setiap bulan stok ini menyerap ' +
        formatRupiah(summary.dead_monthly_holding) +
        ' biaya simpan.',
    };
  }

  if (summary.dead_capital > 0) {
    return {
      level: 'ember',
      label: 'Ada stok mati yang perlu dilikuidasi',
      note:
        formatRupiah(summary.dead_capital) +
        ' modal tertahan di stok mati. Batas diskon impas agregat ' +
        summary.break_even_discount_pct +
        ' persen.',
    };
  }

  return {
    level: 'signal',
    label: 'Stok melambat, perputaran perlu dipercepat',
    note:
      formatRupiah(summary.slow_capital) +
      ' modal berada di stok melambat. Turunkan harga bertahap atau bundling ' +
      'sebelum status berubah menjadi mati.',
  };
}

function buildRecommendations(skus, summary) {
  const list = [];
  const atRisk = skus
    .filter((item) => item.at_risk)
    .sort((a, b) => b.capital - a.capital);

  atRisk.slice(0, 4).forEach((item) => {
    list.push(
      item.name +
        ' (' +
        item.status_label +
        ', modal ' +
        formatRupiah(item.capital) +
        '): ' +
        item.action
    );
  });

  if (summary.dead_capital > 0) {
    list.push(
      'Hentikan restock semua SKU berstatus mati. Modal ' +
        formatRupiah(summary.dead_capital) +
        ' harus diputar kembali sebelum menambah stok baru.'
    );
  }

  if (summary.at_risk_capital > 0) {
    list.push(
      'Batas diskon impas agregat ' +
        summary.break_even_discount_pct +
        ' persen. Diskon di bawah batas itu masih lebih murah daripada ' +
        'menanggung biaya simpan sampai stok habis.'
    );
    list.push(
      'Uji diskon bertahap 10 sampai 20 persen selama 14 hari, lalu ukur ' +
        'penjualan. Jangan memotong harga sekaligus tanpa batas impas.'
    );
    list.push(
      'Bundling stok melambat dengan produk sehat yang paling cepat laku. ' +
        'Hitung harga bundel dari modal gabungan, bukan hanya harga jual.'
    );
  }

  list.push(
    'Hitung ulang setiap 30 hari. Status dapat berubah saat penjualan, ' +
      'umur stok, atau biaya simpan berubah.'
  );
  list.push(SCOPE_NOTE);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const skus = input.skus.map((item) => calculateSku(item, input.settings));
  const byStatus = (id) => skus.filter((item) => item.status === id);
  const atRisk = skus.filter((item) => item.at_risk);
  const dead = byStatus('mati');
  const slow = byStatus('melambat');

  const totalCapital = skus.reduce((sum, item) => sum + item.capital, 0);
  const totalRetail = skus.reduce((sum, item) => sum + item.retail_value, 0);
  const deadCapital = dead.reduce((sum, item) => sum + item.capital, 0);
  const slowCapital = slow.reduce((sum, item) => sum + item.capital, 0);
  const atRiskCapital = atRisk.reduce((sum, item) => sum + item.capital, 0);
  const atRiskHolding = atRisk.reduce((sum, item) => sum + item.holding_cost_month, 0);
  const deadHolding = dead.reduce((sum, item) => sum + item.holding_cost_month, 0);
  const holdingToClearAtRisk = atRisk.reduce(
    (sum, item) => sum + item.holding_cost_to_clear,
    0
  );
  const netRetailAtRisk = atRisk.reduce((sum, item) => sum + item.full_price_net, 0);
  const aggregateDiscount =
    netRetailAtRisk > 0
      ? Math.min(100, (holdingToClearAtRisk / netRetailAtRisk) * 100)
      : 0;

  const summary = {
    total_skus: skus.length,
    total_units: skus.reduce((sum, item) => sum + item.quantity, 0),
    total_capital: round2(totalCapital),
    total_retail_value: round2(totalRetail),
    dead_units: dead.reduce((sum, item) => sum + item.quantity, 0),
    slow_units: slow.reduce((sum, item) => sum + item.quantity, 0),
    at_risk_units: atRisk.reduce((sum, item) => sum + item.quantity, 0),
    dead_capital: round2(deadCapital),
    slow_capital: round2(slowCapital),
    at_risk_capital: round2(atRiskCapital),
    dead_ratio_pct: totalCapital > 0 ? round2((deadCapital / totalCapital) * 100) : 0,
    at_risk_ratio_pct:
      totalCapital > 0 ? round2((atRiskCapital / totalCapital) * 100) : 0,
    monthly_holding_cost: round2(
      skus.reduce((sum, item) => sum + item.holding_cost_month, 0)
    ),
    at_risk_monthly_holding: round2(atRiskHolding),
    dead_monthly_holding: round2(deadHolding),
    annual_holding_cost_at_risk: round2(atRiskHolding * 12),
    holding_cost_to_clear_at_risk: round2(holdingToClearAtRisk),
    full_price_net_at_risk: round2(netRetailAtRisk),
    break_even_discount_pct: round2(aggregateDiscount),
    status_counts: STATUSES.map((status) => ({
      id: status.id,
      label: status.label,
      count: byStatus(status.id).length,
    })),
  };

  return {
    input,
    settings: input.settings,
    skus,
    summary,
    verdict: buildVerdict(summary),
    recommendations: buildRecommendations(skus, summary),
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
}

function normalizeScenario(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const discount = numOr(input.discount_pct, 20);
  const clearMonths = numOr(
    input.clear_months,
    DEFAULT_SETTINGS.target_clear_months
  );

  if (!Number.isFinite(discount) || discount < 0 || discount > 90) {
    throw new Error('Diskon harus antara 0 dan 90 persen.');
  }
  if (!Number.isFinite(clearMonths) || clearMonths < 1 || clearMonths > 24) {
    throw new Error('Horizon penjualan harus antara 1 dan 24 bulan.');
  }
  if (!Number.isInteger(clearMonths)) {
    throw new Error('Horizon penjualan harus bilangan bulat.');
  }

  return { discount_pct: discount, clear_months: clearMonths };
}

function scenario(raw) {
  const result = analyze(raw);
  const options = normalizeScenario(raw);
  const settings = result.settings;
  const discountFactor = 1 - options.discount_pct / 100;
  const feeFactor = 1 - settings.fee_pct / 100;

  const items = result.skus
    .filter((item) => item.at_risk)
    .map((item) => {
      const hasSales = item.coverage_months !== null;
      const waitMonths = hasSales ? item.coverage_months : options.clear_months;
      const grossNow = item.quantity * item.unit_price * discountFactor;
      const netNow = grossNow * feeFactor;
      const grossWait = hasSales ? item.quantity * item.unit_price : 0;
      const netWait = grossWait * feeFactor - item.holding_cost_month * waitMonths;
      const advantage = netNow - netWait;
      const liquidate = advantage > 0 || !hasSales;

      return {
        code: item.code,
        name: item.name,
        status: item.status,
        status_label: item.status_label,
        quantity: item.quantity,
        unit_price: item.unit_price,
        capital: item.capital,
        coverage_months: item.coverage_months,
        wait_months: round2(waitMonths),
        wait_basis: hasSales ? 'kecepatan_jual' : 'target',
        discount_pct: options.discount_pct,
        net_now: round2(netNow),
        net_wait: round2(netWait),
        advantage: round2(advantage),
        discount_cost: round2(
          item.quantity * item.unit_price * (options.discount_pct / 100) * feeFactor
        ),
        holding_saved: round2(item.holding_cost_month * waitMonths),
        verdict: liquidate ? 'likuidasi' : 'tahan',
        verdict_label: liquidate ? 'Likuidasi' : 'Tahan',
        note: !hasSales
          ? 'Tidak ada penjualan. Menahan stok hanya menambah biaya simpan.'
          : liquidate
            ? 'Diskon lebih murah daripada biaya simpan sampai stok habis.'
            : 'Biaya diskon lebih besar daripada biaya simpan. Jual dengan harga normal.',
      };
    });

  const totalNetNow = items.reduce((sum, item) => sum + item.net_now, 0);
  const totalNetWait = items.reduce((sum, item) => sum + item.net_wait, 0);
  const totalAdvantage = totalNetNow - totalNetWait;
  const liquidateCount = items.filter((item) => item.verdict === 'likuidasi').length;
  const holdCount = items.length - liquidateCount;
  const atRiskCapital = items.reduce((sum, item) => sum + item.capital, 0);
  const totalDiscountCost = items.reduce((sum, item) => sum + item.discount_cost, 0);
  const totalHoldingSaved = items.reduce((sum, item) => sum + item.holding_saved, 0);

  let verdict = {
    level: 'ok',
    label: 'Diskon tidak diperlukan',
    note:
      'Tidak ada stok melambat atau mati. Skenario diskon tidak dihitung untuk ' +
      'SKU yang masih sehat.',
  };

  if (items.length > 0 && totalAdvantage > 0) {
    verdict = {
      level: 'signal',
      label: 'Skenario diskon layak dicoba',
      note:
        'Dengan diskon ' +
        options.discount_pct +
        ' persen, uang bersih sekarang ' +
        formatRupiah(totalNetNow) +
        ', lebih tinggi ' +
        formatRupiah(totalAdvantage) +
        ' dibanding menjual bertahap dan menanggung biaya simpan.',
    };
  } else if (items.length > 0) {
    verdict = {
      level: 'ember',
      label: 'Diskon terlalu dalam',
      note:
        'Dengan diskon ' +
        options.discount_pct +
        ' persen, uang bersih sekarang ' +
        formatRupiah(totalNetNow) +
        ', lebih rendah ' +
        formatRupiah(Math.abs(totalAdvantage)) +
        ' dibanding menjual bertahap. Turunkan diskon atau gunakan bundling.',
    };
  }

  return {
    discount_pct: options.discount_pct,
    clear_months: options.clear_months,
    fee_pct: settings.fee_pct,
    items,
    summary: {
      item_count: items.length,
      liquidate_count: liquidateCount,
      hold_count: holdCount,
      at_risk_capital: round2(atRiskCapital),
      total_net_now: round2(totalNetNow),
      total_net_wait: round2(totalNetWait),
      total_advantage: round2(totalAdvantage),
      total_discount_cost: round2(totalDiscountCost),
      total_holding_saved: round2(totalHoldingSaved),
      cash_recovery_pct:
        atRiskCapital > 0 ? round2((totalNetNow / atRiskCapital) * 100) : 0,
      verdict,
    },
    note:
      'Skenario membandingkan dua pilihan untuk stok melambat dan mati. ' +
      'Angka bukan jaminan semua stok terjual pada harga diskon.',
  };
}

function csvEscape(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(raw) {
  const result = analyze(raw);
  const header = [
    'baris',
    'kode',
    'nama',
    'jumlah_stok',
    'modal_per_unit',
    'harga_jual',
    'penjualan_per_bulan',
    'umur_stok_hari',
    'bulan_habis',
    'status',
    'modal_tertahan',
    'nilai_jual',
    'biaya_simpan_per_bulan',
    'biaya_simpan_sampai_habis',
    'diskon_impas_persen',
    'rekomendasi',
  ];
  const lines = [header.join(',')];
  result.skus.forEach((item) => {
    lines.push(
      [
        item.row,
        item.code,
        item.name,
        item.quantity,
        item.unit_cost,
        item.unit_price,
        item.monthly_sales,
        item.days_in_stock,
        item.coverage_months === null ? '' : item.coverage_months,
        item.status_label,
        item.capital,
        item.retail_value,
        item.holding_cost_month,
        item.holding_cost_to_clear,
        item.break_even_discount_pct,
        item.action,
      ]
        .map((value) => csvEscape(value))
        .join(',')
    );
  });
  return lines.join('\n');
}

function example() {
  return {
    settings: Object.assign({}, DEFAULT_SETTINGS),
    skus: [
      {
        code: 'KAOS-CC30',
        name: 'Kaos Polos Cotton Combed 30s',
        quantity: 120,
        unit_cost: 32000,
        unit_price: 79000,
        monthly_sales: 8,
        days_in_stock: 140,
      },
      {
        code: 'TMB-500',
        name: 'Tumbler Stainless 500 ml',
        quantity: 60,
        unit_cost: 45000,
        unit_price: 99000,
        monthly_sales: 20,
        days_in_stock: 75,
      },
      {
        code: 'CASE-BEN',
        name: 'Case HP Bening Universal',
        quantity: 0,
        unit_cost: 8000,
        unit_price: 25000,
        monthly_sales: 40,
        days_in_stock: 30,
      },
      {
        code: 'SEP-SNK',
        name: 'Sepatu Sneakers Kanvas',
        quantity: 30,
        unit_cost: 120000,
        unit_price: 249000,
        monthly_sales: 0,
        days_in_stock: 120,
      },
      {
        code: 'TOP-BSB',
        name: 'Topi Baseball Bordir',
        quantity: 200,
        unit_cost: 18000,
        unit_price: 49000,
        monthly_sales: 120,
        days_in_stock: 30,
      },
    ],
  };
}

function meta() {
  return {
    default_settings: DEFAULT_SETTINGS,
    setting_fields: SETTING_FIELDS,
    statuses: STATUSES,
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    limits: { max_skus: MAX_SKUS },
    rules: {
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

module.exports = {
  meta,
  example,
  analyze,
  scenario,
  csvRows,
  normalizeInput,
  validateInput,
  normalizeScenario,
  calculateSku,
  classify,
  statusById: (id) => findById(STATUSES, id),
  DEFAULT_SETTINGS,
  SETTING_FIELDS,
  STATUSES,
  ASSUMPTIONS,
  FORMULAS,
  SCOPE_NOTE,
  DISCLAIMER,
  oneOf,
};
