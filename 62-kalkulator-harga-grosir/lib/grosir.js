'use strict';

const MAX_TEXT = 120;
const MAX_TIERS = 8;
const EPSILON = 1e-9;

const ROUNDING_STEPS = [
  { id: 1, label: '1 rupiah' },
  { id: 50, label: '50 rupiah' },
  { id: 100, label: '100 rupiah' },
  { id: 500, label: '500 rupiah' },
  { id: 1000, label: '1.000 rupiah' },
];

const LIMITS = {
  max_unit_cost: 1000000000,
  max_retail_price: 10000000000,
  max_fee_pct: 40,
  max_target_margin_pct: 90,
  max_order_cost: 1000000000,
  max_rounding_step: 10000,
  max_orders_per_month: 100000,
  max_tiers: MAX_TIERS,
  max_quantity: 100000,
  max_discount_pct: 90,
};

const STATUS_LABELS = {
  ok: 'Margin aman',
  thin: 'Di bawah target',
  loss: 'Rugi per pesanan',
};

const ASSUMPTIONS = [
  'HPP per pcs sudah mencakup bahan, tenaga kerja, dan overhead yang dibebankan per unit.',
  'Biaya platform dihitung dari omzet setelah diskon grosir, bukan dari harga eceran.',
  'Biaya admin, kemasan, dan subsidi ongkir dihitung satu kali per pesanan grosir.',
  'Harga grosir dibulatkan ke langkah rupiah yang dipilih, lalu diskon efektif dihitung ' +
  'dari harga bulat tersebut.',
  'Target margin adalah margin bersih terhadap omzet, bukan markup terhadap HPP.',
  'Perbandingan eceran menganggap jumlah yang sama dijual sebagai pesanan satu pcs, ' +
  'masing-masing menanggung biaya admin, kemasan, dan subsidi ongkir sendiri.',
  'Belum termasuk pajak, iklan, biaya retur, biaya penyimpanan, dan biaya tambahan lain.',
  'Proyeksi bulanan memakai jumlah pesanan grosir yang sama untuk setiap tier. Tier adalah ' +
  'skenario alternatif, bukan akumulasi.',
];

const SCOPE_NOTE =
  'Tool membantu menyusun tangga harga grosir dan memeriksa margin tiap tier. Tool tidak ' +
  'menetapkan harga resmi atau kebijakan diskon marketplace.';

const DISCLAIMER =
  'Angka adalah estimasi dari input Anda, bukan laporan laba resmi. Cocokkan dengan HPP ' +
  'aktual, biaya platform yang berlaku, dan pola pesanan nyata sebelum mengumumkan harga.';

const FIELD_LABELS = {
  unit_cost: 'HPP per pcs',
  retail_price: 'Harga eceran',
  marketplace_fee_pct: 'Biaya platform',
  fixed_fee_per_order: 'Biaya tetap per pesanan',
  packaging_cost_per_order: 'Biaya kemasan per pesanan',
  shipping_subsidy_per_order: 'Subsidi ongkir per pesanan',
  target_margin_pct: 'Target margin',
  rounding_step: 'Pembulatan harga',
  orders_per_month: 'Pesanan grosir per bulan',
};

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
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

function round2(value) {
  return Math.round((value + EPSILON) * 100) / 100;
}

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

function ceilToStep(value, step) {
  // Subtract a tiny amount so exact multiples stay on the same step.
  return Math.ceil((value - EPSILON) / step) * step;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function normalizeTier(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    quantity: numOr(source.quantity !== undefined ? source.quantity : source.moq, 0),
    discount_pct: numOr(
      source.discount_pct !== undefined ? source.discount_pct : source.discount,
      0
    ),
  };
}

function normalizeInput(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const tiers = Array.isArray(source.tiers) ? source.tiers.map(normalizeTier) : [];

  return {
    product_label: cleanText(source.product_label, MAX_TEXT),
    unit_cost: numOr(source.unit_cost, 0),
    retail_price: numOr(source.retail_price, 0),
    marketplace_fee_pct: numOr(source.marketplace_fee_pct, 8),
    fixed_fee_per_order: numOr(source.fixed_fee_per_order, 0),
    packaging_cost_per_order: numOr(source.packaging_cost_per_order, 0),
    shipping_subsidy_per_order: numOr(source.shipping_subsidy_per_order, 0),
    target_margin_pct: numOr(source.target_margin_pct, 10),
    rounding_step: numOr(source.rounding_step, 100),
    orders_per_month: numOr(source.orders_per_month, 0),
    tiers,
  };
}

function validateTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error('Minimal satu tier harga grosir harus diisi.');
  }
  if (tiers.length > LIMITS.max_tiers) {
    throw new Error('Maksimal ' + LIMITS.max_tiers + ' tier harga grosir.');
  }

  const seen = new Set();
  tiers.forEach((tier, index) => {
    const position = 'Tier ' + (index + 1);
    if (!Number.isInteger(tier.quantity) || tier.quantity <= 0) {
      throw new Error(position + ': jumlah pcs harus bilangan bulat lebih dari 0.');
    }
    if (tier.quantity > LIMITS.max_quantity) {
      throw new Error(position + ': jumlah pcs maksimal ' + LIMITS.max_quantity + '.');
    }
    if (!Number.isFinite(tier.discount_pct) || tier.discount_pct < 0) {
      throw new Error(position + ': diskon harus berupa angka 0 atau lebih.');
    }
    if (tier.discount_pct > LIMITS.max_discount_pct) {
      throw new Error(position + ': diskon maksimal ' + LIMITS.max_discount_pct + ' persen.');
    }
    if (seen.has(tier.quantity)) {
      throw new Error('Jumlah pcs ' + tier.quantity + ' muncul lebih dari satu kali.');
    }
    seen.add(tier.quantity);
  });
}

function validateInput(input) {
  if (!Number.isFinite(input.unit_cost) || input.unit_cost <= 0) {
    throw new Error(FIELD_LABELS.unit_cost + ' harus lebih dari 0.');
  }
  if (input.unit_cost > LIMITS.max_unit_cost) {
    throw new Error(FIELD_LABELS.unit_cost + ' terlalu besar.');
  }

  if (!Number.isFinite(input.retail_price) || input.retail_price <= 0) {
    throw new Error(FIELD_LABELS.retail_price + ' harus lebih dari 0.');
  }
  if (input.retail_price > LIMITS.max_retail_price) {
    throw new Error(FIELD_LABELS.retail_price + ' terlalu besar.');
  }

  if (!Number.isFinite(input.marketplace_fee_pct) || input.marketplace_fee_pct < 0) {
    throw new Error(FIELD_LABELS.marketplace_fee_pct + ' harus berupa angka 0 atau lebih.');
  }
  if (input.marketplace_fee_pct > LIMITS.max_fee_pct) {
    throw new Error(FIELD_LABELS.marketplace_fee_pct + ' maksimal ' +
      LIMITS.max_fee_pct + ' persen.');
  }

  ['fixed_fee_per_order', 'packaging_cost_per_order', 'shipping_subsidy_per_order']
    .forEach((key) => {
      const value = input[key];
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
      }
      if (value > LIMITS.max_order_cost) {
        throw new Error(FIELD_LABELS[key] + ' terlalu besar.');
      }
    });

  if (!Number.isFinite(input.target_margin_pct) || input.target_margin_pct < 0) {
    throw new Error(FIELD_LABELS.target_margin_pct + ' harus berupa angka 0 atau lebih.');
  }
  if (input.target_margin_pct > LIMITS.max_target_margin_pct) {
    throw new Error(FIELD_LABELS.target_margin_pct + ' maksimal ' +
      LIMITS.max_target_margin_pct + ' persen.');
  }
  if (input.marketplace_fee_pct + input.target_margin_pct >= 100) {
    throw new Error('Jumlah biaya platform dan target margin harus di bawah 100 persen.');
  }

  if (!Number.isFinite(input.rounding_step) || input.rounding_step <= 0) {
    throw new Error(FIELD_LABELS.rounding_step + ' harus lebih dari 0.');
  }
  if (input.rounding_step > LIMITS.max_rounding_step) {
    throw new Error(FIELD_LABELS.rounding_step + ' maksimal ' +
      LIMITS.max_rounding_step + '.');
  }

  if (!Number.isInteger(input.orders_per_month) || input.orders_per_month < 0) {
    throw new Error(FIELD_LABELS.orders_per_month + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.orders_per_month > LIMITS.max_orders_per_month) {
    throw new Error(FIELD_LABELS.orders_per_month + ' maksimal ' +
      LIMITS.max_orders_per_month + '.');
  }

  validateTiers(input.tiers);
}

function evaluateTier(input, tier) {
  const quantity = tier.quantity;
  const unitPrice = roundToStep(
    input.retail_price * (1 - tier.discount_pct / 100),
    input.rounding_step
  );
  const revenue = unitPrice * quantity;
  const marketplaceFee = revenue * (input.marketplace_fee_pct / 100);
  const productCost = input.unit_cost * quantity;
  const orderCost = input.fixed_fee_per_order +
    input.packaging_cost_per_order +
    input.shipping_subsidy_per_order;
  const totalCost = productCost + marketplaceFee + orderCost;
  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const effectiveDiscountPct = input.retail_price > 0
    ? ((input.retail_price - unitPrice) / input.retail_price) * 100
    : 0;

  const denominator = quantity *
    (1 - (input.marketplace_fee_pct + input.target_margin_pct) / 100);
  const minimumPriceRaw = denominator > 0
    ? (productCost + orderCost) / denominator
    : null;
  const minimumUnitPrice = minimumPriceRaw === null
    ? null
    : ceilToStep(minimumPriceRaw, input.rounding_step);
  const maxDiscountAtTargetPct = minimumUnitPrice === null
    ? null
    : round2(Math.max(
      0,
      ((input.retail_price - minimumUnitPrice) / input.retail_price) * 100
    ));

  const contributionPerUnit = unitPrice * (1 - input.marketplace_fee_pct / 100) -
    input.unit_cost;
  const minimumQuantityToCoverCost = contributionPerUnit > 0
    ? Math.max(1, Math.ceil((orderCost - EPSILON) / contributionPerUnit))
    : null;

  const retailProfitSameQuantity = quantity * (
    input.retail_price * (1 - input.marketplace_fee_pct / 100) -
    input.unit_cost -
    orderCost
  );
  const profitVsRetail = profit - retailProfitSameQuantity;

  let status = 'ok';
  if (profit < 0) {
    status = 'loss';
  } else if (marginPct < input.target_margin_pct - EPSILON) {
    status = 'thin';
  }

  return {
    quantity,
    discount_pct: round2(tier.discount_pct),
    unit_price: unitPrice,
    effective_discount_pct: round2(effectiveDiscountPct),
    revenue: round2(revenue),
    marketplace_fee: round2(marketplaceFee),
    product_cost: round2(productCost),
    order_cost: round2(orderCost),
    total_cost: round2(totalCost),
    profit: round2(profit),
    profit_per_unit: round2(profit / quantity),
    margin_pct: round2(marginPct),
    status,
    status_label: STATUS_LABELS[status],
    minimum_unit_price: minimumUnitPrice,
    price_gap: minimumUnitPrice === null ? null : round2(unitPrice - minimumUnitPrice),
    max_discount_at_target_pct: maxDiscountAtTargetPct,
    contribution_per_unit: round2(contributionPerUnit),
    minimum_quantity_to_cover_cost: minimumQuantityToCoverCost,
    retail_profit_same_quantity: round2(retailProfitSameQuantity),
    profit_vs_retail: round2(profitVsRetail),
    monthly_profit: round2(profit * input.orders_per_month),
    monthly_revenue: round2(revenue * input.orders_per_month),
    monthly_units: quantity * input.orders_per_month,
  };
}

function tierBrief(tier) {
  if (!tier) return null;
  return {
    quantity: tier.quantity,
    unit_price: tier.unit_price,
    profit: tier.profit,
    margin_pct: tier.margin_pct,
    status: tier.status,
    status_label: tier.status_label,
  };
}

function buildWarnings(input, tiers) {
  const warnings = [];

  if (input.unit_cost >= input.retail_price) {
    warnings.push(
      'HPP per pcs sama atau lebih besar dari harga eceran. Periksa kembali harga eceran ' +
      'dan komponen HPP sebelum memakai tangga harga ini.'
    );
  }

  for (let index = 1; index < tiers.length; index += 1) {
    if (tiers[index].discount_pct <= tiers[index - 1].discount_pct) {
      warnings.push(
        'Diskon tier ' + tiers[index].quantity + ' pcs tidak lebih besar dari tier ' +
        tiers[index - 1].quantity + ' pcs. Pembeli grosir biasanya mengharapkan diskon ' +
        'yang naik seiring jumlah.'
      );
    }
  }

  tiers.forEach((tier) => {
    if (tier.status !== 'ok') {
      warnings.push(
        'Tier ' + tier.quantity + ' pcs: harga ' + formatRupiah(tier.unit_price) +
        ' memberi margin ' + tier.margin_pct + ' persen, di bawah target ' +
        input.target_margin_pct + ' persen.'
      );
    }
  });

  return warnings.filter((item, index) => warnings.indexOf(item) === index);
}

function buildVerdict(input, tiers, safe, thin, loss, bestSafe) {
  if (loss.length > 0) {
    const worst = loss.reduce(
      (item, current) => (current.profit < item.profit ? current : item),
      loss[0]
    );
    const monthly = input.orders_per_month > 0
      ? ' atau ' + formatRupiah(Math.abs(worst.monthly_profit)) + ' per bulan'
      : '';
    const priceNote = worst.minimum_unit_price
      ? ' Harga minimum di target ' + input.target_margin_pct + ' persen adalah ' +
        formatRupiah(worst.minimum_unit_price) + ' per pcs.'
      : '';
    return {
      level: 'ember',
      label: 'Ada tier yang rugi',
      note: 'Tier ' + worst.quantity + ' pcs pada ' + formatRupiah(worst.unit_price) +
        ' per pcs rugi ' + formatRupiah(Math.abs(worst.profit)) + ' per pesanan' +
        monthly + '.' + priceNote,
    };
  }

  if (thin.length > 0) {
    const lowest = thin.reduce(
      (item, current) => (current.margin_pct < item.margin_pct ? current : item),
      thin[0]
    );
    const priceNote = lowest.minimum_unit_price
      ? ' Harga minimum di target ' + input.target_margin_pct + ' persen adalah ' +
        formatRupiah(lowest.minimum_unit_price) + ' per pcs.'
      : '';
    return {
      level: 'signal',
      label: 'Sebagian tier di bawah target',
      note: 'Tier ' + lowest.quantity + ' pcs memberi margin ' + lowest.margin_pct +
        ' persen, di bawah target ' + input.target_margin_pct + ' persen.' + priceNote,
    };
  }

  const reference = bestSafe || tiers[0];
  return {
    level: 'ok',
    label: 'Semua tier memenuhi target',
    note: 'Semua tier memberi margin minimal ' + input.target_margin_pct + ' persen. ' +
      'Tier aman dengan profit terbesar adalah ' + reference.quantity + ' pcs pada ' +
      formatRupiah(reference.unit_price) + ' per pcs.',
  };
}

function buildRecommendations(input, tiers, safe, thin, loss, bestSafe) {
  const list = [];

  loss.concat(thin).forEach((tier) => {
    if (tier.status === 'loss') {
      list.push(
        'Tier ' + tier.quantity + ' pcs rugi ' + formatRupiah(Math.abs(tier.profit)) +
        ' per pesanan. Naikkan harga minimal ke ' +
        formatRupiah(tier.minimum_unit_price) + ' per pcs atau kurangi diskon menjadi ' +
        tier.max_discount_at_target_pct + ' persen.'
      );
      return;
    }
    list.push(
      'Tier ' + tier.quantity + ' pcs margin ' + tier.margin_pct +
      ' persen. Agar mencapai target ' + input.target_margin_pct + ' persen, harga ' +
      'minimal ' + formatRupiah(tier.minimum_unit_price) + ' per pcs atau diskon ' +
      'maksimal ' + tier.max_discount_at_target_pct + ' persen.'
    );
  });

  if (bestSafe) {
    list.push(
      'Tier aman terbaik: ' + bestSafe.quantity + ' pcs pada ' +
      formatRupiah(bestSafe.unit_price) + ' per pcs, profit ' +
      formatRupiah(bestSafe.profit) + ' per pesanan dan margin ' +
      bestSafe.margin_pct + ' persen.'
    );
  } else {
    const candidate = tiers.reduce(
      (best, item) => (item.profit > best.profit ? item : best),
      tiers[0]
    );
    list.push(
      'Belum ada tier yang mencapai target margin. Tier dengan profit terbesar adalah ' +
      candidate.quantity + ' pcs pada ' + formatRupiah(candidate.unit_price) +
      ' per pcs, tetapi marginnya ' + candidate.margin_pct + ' persen.'
    );
  }

  const smallest = tiers[0];
  if (smallest.minimum_quantity_to_cover_cost !== null) {
    list.push(
      'Pada harga tier ' + smallest.quantity + ' pcs, minimal ' +
      smallest.minimum_quantity_to_cover_cost + ' pcs dibutuhkan hanya untuk menutup ' +
      'biaya pesanan ' + formatRupiah(smallest.order_cost) + '.'
    );
  } else if (smallest.contribution_per_unit <= 0) {
    list.push(
      'Pada harga tier ' + smallest.quantity + ' pcs, setiap pcs sudah kehilangan ' +
      formatRupiah(Math.abs(smallest.contribution_per_unit)) + ' sebelum biaya pesanan. ' +
      'Tidak ada jumlah pcs yang bisa menutup biaya pesanan pada harga ini.'
    );
  }

  const better = tiers.filter((tier) => tier.profit_vs_retail > 0);
  if (better.length > 0) {
    const best = better.reduce(
      (item, current) => (current.profit_vs_retail > item.profit_vs_retail ? current : item),
      better[0]
    );
    list.push(
      'Tier ' + best.quantity + ' pcs masih lebih untung ' +
      formatRupiah(best.profit_vs_retail) + ' dibanding menjual jumlah yang sama ' +
      'secara eceran, karena biaya pesanan hanya ditanggung sekali.'
    );
  }

  const worse = tiers.filter((tier) => tier.profit_vs_retail <= 0);
  if (worse.length > 0) {
    const worst = worse.reduce(
      (item, current) => (current.profit_vs_retail < item.profit_vs_retail ? current : item),
      worse[0]
    );
    list.push(
      'Tier ' + worst.quantity + ' pcs memberi ' +
      formatRupiah(Math.abs(worst.profit_vs_retail)) +
      ' lebih rendah dibanding menjual jumlah yang sama secara eceran. ' +
      'Diskon grosirnya memakan lebih banyak margin daripada biaya pesanan yang dihemat.'
    );
  }

  if (input.orders_per_month > 0 && bestSafe) {
    list.push(
      'Dengan ' + input.orders_per_month + ' pesanan grosir per bulan, tier aman ' +
      bestSafe.quantity + ' pcs menghasilkan proyeksi profit ' +
      formatRupiah(bestSafe.monthly_profit) + ' per bulan dari ' +
      bestSafe.monthly_units + ' pcs.'
    );
  }

  list.push(
    'Biaya pesanan ' + formatRupiah(tiers[0].order_cost) + ' terdiri dari biaya admin, ' +
    'kemasan, dan subsidi ongkir. Angka ini wajar digabung dalam satu pesanan grosir, ' +
    'bukan dihitung per pcs.'
  );
  list.push(
    'Tetapkan diskon berdasarkan margin bersih, bukan hanya berdasarkan harga pesaing. ' +
    'Simpan file CSV sebagai lampiran saat menawar harga dengan reseller.'
  );
  list.push(DISCLAIMER);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);
  input.tiers = input.tiers.slice().sort((a, b) => a.quantity - b.quantity);

  const tiers = input.tiers.map((tier) => evaluateTier(input, tier));
  const safe = tiers.filter((tier) => tier.status === 'ok');
  const thin = tiers.filter((tier) => tier.status === 'thin');
  const loss = tiers.filter((tier) => tier.status === 'loss');

  const bestMargin = tiers.reduce(
    (best, item) => (item.margin_pct > best.margin_pct ? item : best),
    tiers[0]
  );
  const highestProfit = tiers.reduce(
    (best, item) => (item.profit > best.profit ? item : best),
    tiers[0]
  );
  const bestSafe = safe.length
    ? safe.reduce((best, item) => (item.profit > best.profit ? item : best), safe[0])
    : null;
  const lowestSafe = safe.length
    ? safe.reduce((best, item) => (item.quantity < best.quantity ? item : best), safe[0])
    : null;

  const verdict = buildVerdict(input, tiers, safe, thin, loss, bestSafe);
  const recommendations = buildRecommendations(input, tiers, safe, thin, loss, bestSafe);
  const warnings = buildWarnings(input, tiers);

  return {
    input,
    tier_count: tiers.length,
    safe_count: safe.length,
    thin_count: thin.length,
    loss_count: loss.length,
    best_margin_tier: tierBrief(bestMargin),
    highest_profit_tier: tierBrief(highestProfit),
    best_safe_tier: tierBrief(bestSafe),
    lowest_safe_quantity: lowestSafe ? lowestSafe.quantity : null,
    retail_contribution_per_unit: round2(
      input.retail_price * (1 - input.marketplace_fee_pct / 100) - input.unit_cost
    ),
    order_cost: round2(tiers[0].order_cost),
    tiers,
    verdict,
    recommendations,
    warnings,
    assumptions: ASSUMPTIONS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
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
    'produk',
    'tier_pcs',
    'diskon_diminta_persen',
    'harga_per_pcs',
    'diskon_efektif_persen',
    'omzet',
    'biaya_platform',
    'hpp',
    'biaya_pesanan',
    'profit_per_pesanan',
    'margin_persen',
    'harga_minimum_target',
    'diskon_maksimum_persen',
    'minimum_pcs_untuk_biaya',
    'profit_vs_eceran',
    'status',
  ];

  const lines = [header.join(',')];
  result.tiers.forEach((tier) => {
    lines.push([
      result.input.product_label || 'Produk',
      tier.quantity,
      tier.discount_pct,
      tier.unit_price,
      tier.effective_discount_pct,
      tier.revenue,
      tier.marketplace_fee,
      tier.product_cost,
      tier.order_cost,
      tier.profit,
      tier.margin_pct,
      tier.minimum_unit_price,
      tier.max_discount_at_target_pct,
      tier.minimum_quantity_to_cover_cost,
      tier.profit_vs_retail,
      tier.status_label,
    ].map(csvEscape).join(','));
  });

  return lines.join('\n');
}

function example() {
  return {
    product_label: 'Kaos polos katun 30s',
    unit_cost: 110000,
    retail_price: 150000,
    marketplace_fee_pct: 8,
    fixed_fee_per_order: 1250,
    packaging_cost_per_order: 2000,
    shipping_subsidy_per_order: 5000,
    target_margin_pct: 12,
    rounding_step: 100,
    orders_per_month: 30,
    tiers: [
      { quantity: 3, discount_pct: 3 },
      { quantity: 6, discount_pct: 10 },
      { quantity: 12, discount_pct: 15 },
      { quantity: 24, discount_pct: 22 },
    ],
  };
}

function meta() {
  return {
    rounding_steps: ROUNDING_STEPS,
    limits: LIMITS,
    formula: 'harga grosir = harga eceran x (1 - diskon), lalu dibulatkan',
    margin_formula: 'margin = (omzet - biaya platform - HPP - biaya pesanan) / omzet',
    status_labels: STATUS_LABELS,
    assumptions: ASSUMPTIONS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
}

module.exports = {
  meta,
  example,
  analyze,
  csvRows,
  normalizeInput,
  validateInput,
  validateTiers,
  evaluateTier,
  buildWarnings,
  buildVerdict,
  buildRecommendations,
  ROUNDING_STEPS,
  LIMITS,
  STATUS_LABELS,
  ASSUMPTIONS,
  SCOPE_NOTE,
  DISCLAIMER,
};
