'use strict';

const MAX_TEXT = 120;
const EPSILON = 1e-9;
const PAYOUT_SCENARIOS = [3, 7, 14, 21];

const LIMITS = {
  max_daily_orders: 1000000,
  max_price: 10000000000,
  max_unit_cost: 1000000000,
  max_fee_pct: 40,
  max_per_order_cost: 1000000,
  max_daily_cost: 10000000000,
  max_delay_days: 60,
  max_lead_days: 180,
  max_safety_days: 60,
  max_cash: 1000000000000,
  max_target_margin_pct: 90,
};

const CASH_STATUS_LABELS = {
  ok: 'Kas aman',
  thin: 'Kas ketat',
  short: 'Kas kurang',
};

const DAILY_STATUS_LABELS = {
  ok: 'Margin aman',
  thin: 'Margin tipis',
  loss: 'Rugi harian',
};

const ASSUMPTIONS = [
  'Omzet harian dihitung dari pesanan per hari dikali harga rata-rata setelah diskon.',
  'Komisi platform dihitung dari omzet dan mengurangi uang yang cair, bukan kas keluar.',
  'Kas keluar harian mencakup HPP, kemasan, subsidi ongkir, iklan, dan biaya tetap.',
  'Jeda pencairan dihitung setelah paket diterima, yaitu waktu kirim ditambah jeda payout.',
  'Piutang tertahan adalah uang yang sudah menjadi omzet tetapi belum masuk rekening.',
  'Buffer stok memakai HPP dikali pesanan per hari dikali lead time restock.',
  'Jeda pencairan, waktu kirim, dan lead time restock adalah input seller, bukan tarif resmi.',
  'Belum termasuk pajak, retur, refund, biaya pinjaman, dan biaya penyimpanan.',
  'Skenario jeda pencairan adalah alternatif, bukan akumulasi.',
  'Tool tidak melakukan panggilan jaringan ke marketplace dan tidak menyimpan data pengguna.',
];

const SCOPE_NOTE =
  'Tool membantu menghitung modal kerja yang tertahan karena jeda pencairan marketplace. ' +
  'Tool tidak menetapkan jadwal payout atau kebijakan platform.';

const DISCLAIMER =
  'Angka adalah estimasi dari input Anda, bukan laporan arus kas resmi. Cocokkan dengan ' +
  'riwayat pencairan di seller center dan mutasi rekening sebelum mengambil keputusan.';

const FIELD_LABELS = {
  daily_orders: 'Pesanan per hari',
  avg_price: 'Harga rata-rata per pesanan',
  unit_cost: 'HPP per pesanan',
  marketplace_fee_pct: 'Komisi platform',
  packaging_per_order: 'Kemasan per pesanan',
  shipping_subsidy_per_order: 'Subsidi ongkir per pesanan',
  ads_spend_per_day: 'Biaya iklan per hari',
  fixed_cost_per_day: 'Biaya tetap per hari',
  target_margin_pct: 'Target margin',
  delivery_days: 'Waktu kirim',
  payout_delay_days: 'Jeda pencairan',
  restock_lead_days: 'Lead time restock',
  safety_buffer_days: 'Buffer kas',
  current_cash: 'Kas saat ini',
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

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  const number = Number(value) || 0;
  const sign = number < 0 ? '-Rp ' : 'Rp ';
  return sign + formatNumber(Math.abs(number));
}

function normalizeInput(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};

  return {
    store_label: cleanText(source.store_label, MAX_TEXT),
    daily_orders: numOr(source.daily_orders, 12),
    avg_price: numOr(source.avg_price, 95000),
    unit_cost: numOr(source.unit_cost, 55000),
    marketplace_fee_pct: numOr(source.marketplace_fee_pct, 8),
    packaging_per_order: numOr(source.packaging_per_order, 2000),
    shipping_subsidy_per_order: numOr(source.shipping_subsidy_per_order, 3000),
    ads_spend_per_day: numOr(source.ads_spend_per_day, 150000),
    fixed_cost_per_day: numOr(source.fixed_cost_per_day, 100000),
    target_margin_pct: numOr(source.target_margin_pct, 10),
    delivery_days: numOr(source.delivery_days, 2),
    payout_delay_days: numOr(source.payout_delay_days, 7),
    restock_lead_days: numOr(source.restock_lead_days, 7),
    safety_buffer_days: numOr(source.safety_buffer_days, 5),
    current_cash: numOr(source.current_cash, 15000000),
  };
}

function validateInput(input) {
  if (!Number.isInteger(input.daily_orders) || input.daily_orders < 0) {
    throw new Error(FIELD_LABELS.daily_orders + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.daily_orders > LIMITS.max_daily_orders) {
    throw new Error(FIELD_LABELS.daily_orders + ' terlalu besar.');
  }

  if (!Number.isFinite(input.avg_price) || input.avg_price <= 0) {
    throw new Error(FIELD_LABELS.avg_price + ' harus lebih dari 0.');
  }
  if (input.avg_price > LIMITS.max_price) {
    throw new Error(FIELD_LABELS.avg_price + ' terlalu besar.');
  }

  if (!Number.isFinite(input.unit_cost) || input.unit_cost < 0) {
    throw new Error(FIELD_LABELS.unit_cost + ' harus berupa angka 0 atau lebih.');
  }
  if (input.unit_cost > LIMITS.max_unit_cost) {
    throw new Error(FIELD_LABELS.unit_cost + ' terlalu besar.');
  }

  if (!Number.isFinite(input.marketplace_fee_pct) || input.marketplace_fee_pct < 0) {
    throw new Error(FIELD_LABELS.marketplace_fee_pct + ' harus berupa angka 0 atau lebih.');
  }
  if (input.marketplace_fee_pct > LIMITS.max_fee_pct) {
    throw new Error(FIELD_LABELS.marketplace_fee_pct + ' maksimal ' +
      LIMITS.max_fee_pct + ' persen.');
  }

  ['packaging_per_order', 'shipping_subsidy_per_order'].forEach((key) => {
    if (!Number.isFinite(input[key]) || input[key] < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
    if (input[key] > LIMITS.max_per_order_cost) {
      throw new Error(FIELD_LABELS[key] + ' terlalu besar.');
    }
  });

  ['ads_spend_per_day', 'fixed_cost_per_day'].forEach((key) => {
    if (!Number.isFinite(input[key]) || input[key] < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
    if (input[key] > LIMITS.max_daily_cost) {
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

  ['delivery_days', 'payout_delay_days', 'safety_buffer_days'].forEach((key) => {
    if (!Number.isInteger(input[key]) || input[key] < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus bilangan bulat 0 atau lebih.');
    }
    if (input[key] > LIMITS.max_delay_days) {
      throw new Error(FIELD_LABELS[key] + ' maksimal ' + LIMITS.max_delay_days + ' hari.');
    }
  });

  if (!Number.isInteger(input.restock_lead_days) || input.restock_lead_days < 0) {
    throw new Error(FIELD_LABELS.restock_lead_days + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.restock_lead_days > LIMITS.max_lead_days) {
    throw new Error(FIELD_LABELS.restock_lead_days + ' maksimal ' +
      LIMITS.max_lead_days + ' hari.');
  }

  if (!Number.isFinite(input.current_cash) || input.current_cash < 0) {
    throw new Error(FIELD_LABELS.current_cash + ' harus berupa angka 0 atau lebih.');
  }
  if (input.current_cash > LIMITS.max_cash) {
    throw new Error(FIELD_LABELS.current_cash + ' terlalu besar.');
  }
}

function evaluateVolume(input, orders) {
  const revenue = round2(orders * input.avg_price);
  const platformFee = round2(revenue * (input.marketplace_fee_pct / 100));
  const productCost = round2(orders * input.unit_cost);
  const packagingCost = round2(orders * input.packaging_per_order);
  const shippingCost = round2(orders * input.shipping_subsidy_per_order);
  const totalCost = round2(
    productCost + packagingCost + shippingCost + platformFee +
    input.ads_spend_per_day + input.fixed_cost_per_day
  );
  const profit = round2(revenue - totalCost);
  const marginPct = revenue > 0 ? round2((profit / revenue) * 100) : 0;
  const contributionPerOrder = round2(
    input.avg_price * (1 - input.marketplace_fee_pct / 100) -
    input.unit_cost - input.packaging_per_order - input.shipping_subsidy_per_order
  );
  const dailyCashOut = round2(
    productCost + packagingCost + shippingCost +
    input.ads_spend_per_day + input.fixed_cost_per_day
  );
  const netReceiptPerDay = round2(revenue - platformFee);

  let status = 'ok';
  if (profit < 0) {
    status = 'loss';
  } else if (orders > 0 && marginPct < input.target_margin_pct - EPSILON) {
    status = 'thin';
  }

  return {
    orders,
    revenue,
    platform_fee: platformFee,
    product_cost: productCost,
    packaging_cost: packagingCost,
    shipping_cost: shippingCost,
    total_cost: totalCost,
    profit,
    margin_pct: marginPct,
    contribution_per_order: contributionPerOrder,
    daily_cash_out: dailyCashOut,
    net_receipt_per_day: netReceiptPerDay,
    monthly_profit: round2(profit * 30),
    profit_per_order: orders > 0 ? round2(profit / orders) : null,
    status,
    status_label: DAILY_STATUS_LABELS[status],
  };
}

function cashStatus(currentCash, minimum, recommended) {
  if (currentCash + EPSILON >= recommended) return 'ok';
  if (currentCash + EPSILON >= minimum) return 'thin';
  return 'short';
}

function buildCash(input, volume) {
  const lagDays = input.delivery_days + input.payout_delay_days;
  const receivableGap = round2(volume.daily_cash_out * lagDays);
  const inventoryBuffer = round2(
    input.unit_cost * input.daily_orders * input.restock_lead_days
  );
  const minimumWorkingCapital = round2(receivableGap + inventoryBuffer);
  const safetyBuffer = round2(volume.daily_cash_out * input.safety_buffer_days);
  const recommendedCash = round2(minimumWorkingCapital + safetyBuffer);
  const settlementReceivable = round2(volume.net_receipt_per_day * lagDays);
  const status = cashStatus(input.current_cash, minimumWorkingCapital, recommendedCash);

  return {
    lag_days: lagDays,
    receivable_gap: receivableGap,
    inventory_buffer: inventoryBuffer,
    minimum_working_capital: minimumWorkingCapital,
    safety_buffer: safetyBuffer,
    recommended_cash: recommendedCash,
    settlement_receivable: settlementReceivable,
    surplus_over_minimum: round2(input.current_cash - minimumWorkingCapital),
    surplus_over_recommended: round2(input.current_cash - recommendedCash),
    cash_coverage_days: volume.daily_cash_out > 0
      ? round2(input.current_cash / volume.daily_cash_out)
      : null,
    working_capital_per_order: input.daily_orders > 0
      ? round2(minimumWorkingCapital / input.daily_orders)
      : null,
    status,
    status_label: CASH_STATUS_LABELS[status],
  };
}

function buildLimits(input, volume) {
  const window = input.delivery_days + input.payout_delay_days + input.safety_buffer_days;
  const perOrderCashOut =
    input.unit_cost + input.packaging_per_order + input.shipping_subsidy_per_order;
  const denominator = perOrderCashOut * window + input.unit_cost * input.restock_lead_days;
  const fixedComponent = (input.ads_spend_per_day + input.fixed_cost_per_day) * window;
  const numerator = input.current_cash - fixedComponent;

  let maxOrders = null;
  if (denominator > 0) {
    maxOrders = Math.max(0, Math.floor((numerator + EPSILON) / denominator));
  }

  const breakEvenOrders = volume.contribution_per_order > 0
    ? Math.max(0, Math.ceil(
      (input.ads_spend_per_day + input.fixed_cost_per_day - EPSILON) /
      volume.contribution_per_order
    ))
    : null;

  return {
    max_orders_at_current_cash: maxOrders,
    break_even_orders: breakEvenOrders,
    cash_out_per_order: round2(perOrderCashOut),
  };
}

function buildScenarios(input) {
  return PAYOUT_SCENARIOS.map((delay) => {
    const scenarioInput = Object.assign({}, input, { payout_delay_days: delay });
    const volume = evaluateVolume(scenarioInput, scenarioInput.daily_orders);
    const cash = buildCash(scenarioInput, volume);
    return {
      payout_delay_days: delay,
      lag_days: cash.lag_days,
      receivable_gap: cash.receivable_gap,
      inventory_buffer: cash.inventory_buffer,
      minimum_working_capital: cash.minimum_working_capital,
      recommended_cash: cash.recommended_cash,
      surplus_over_recommended: cash.surplus_over_recommended,
      status: cash.status,
      status_label: cash.status_label,
      is_actual: delay === input.payout_delay_days,
    };
  });
}

function buildWarnings(input, volume, cash, limits) {
  const warnings = [];
  const extraDayCost = volume.daily_cash_out;

  if (volume.profit < 0) {
    warnings.push(
      'Operasional harian rugi ' + formatRupiah(Math.abs(volume.profit)) +
      '. Menambah volume justru memperbesar kebocoran kas.'
    );
  }

  if (volume.contribution_per_order <= 0) {
    warnings.push(
      'Kontribusi per pesanan ' + formatRupiah(volume.contribution_per_order) +
      ' nol atau negatif. Volume tambahan tidak akan menutup biaya tetap harian.'
    );
  }

  if (cash.status === 'short') {
    warnings.push(
      'Kas kurang ' + formatRupiah(Math.abs(cash.surplus_over_minimum)) +
      ' dari modal kerja minimum ' + formatRupiah(cash.minimum_working_capital) + '.'
    );
  } else if (cash.status === 'thin') {
    warnings.push(
      'Kas hanya ' + formatRupiah(cash.surplus_over_minimum) +
      ' di atas modal kerja minimum, belum mencapai kas disarankan ' +
      formatRupiah(cash.recommended_cash) + '.'
    );
  }

  if (input.payout_delay_days >= 14) {
    warnings.push(
      'Jeda pencairan ' + input.payout_delay_days + ' hari menahan ' +
      formatRupiah(cash.receivable_gap) + ' kas keluar sebelum omzet masuk.'
    );
  }

  if (input.delivery_days >= 7) {
    warnings.push(
      'Waktu kirim ' + input.delivery_days + ' hari ikut menambah lag pencairan. ' +
      'Setiap satu hari tambahan membutuhkan ' + formatRupiah(extraDayCost) + ' kas.'
    );
  }

  if (input.restock_lead_days >= 14) {
    warnings.push(
      'Lead time restock ' + input.restock_lead_days + ' hari mengikat ' +
      formatRupiah(cash.inventory_buffer) + ' di stok yang belum terjual.'
    );
  }

  const perOrderFees = input.packaging_per_order + input.shipping_subsidy_per_order;
  if (perOrderFees > input.avg_price * 0.1) {
    warnings.push(
      'Kemasan dan subsidi ongkir ' + formatRupiah(perOrderFees) +
      ' per pesanan, lebih dari 10 persen harga jual ' + formatRupiah(input.avg_price) + '.'
    );
  }

  if (limits.max_orders_at_current_cash !== null &&
      limits.max_orders_at_current_cash < input.daily_orders) {
    warnings.push(
      'Dengan kas saat ini, volume aman hanya ' + limits.max_orders_at_current_cash +
      ' pesanan per hari, di bawah ' + input.daily_orders + ' pesanan yang diisi.'
    );
  }

  if (input.safety_buffer_days < 3) {
    warnings.push(
      'Buffer kas hanya ' + input.safety_buffer_days + ' hari. Sedikit keterlambatan ' +
      'pencairan bisa membuat kas habis.'
    );
  }

  if (input.daily_orders > 0 &&
      volume.margin_pct < input.target_margin_pct - EPSILON) {
    warnings.push(
      'Margin harian ' + volume.margin_pct + ' persen di bawah target ' +
      input.target_margin_pct + ' persen.'
    );
  }

  return warnings.filter((item, index) => warnings.indexOf(item) === index);
}

function buildVerdict(input, volume, cash, limits) {
  if (cash.status === 'short') {
    const orderNote = limits.max_orders_at_current_cash !== null
      ? ' Volume aman dengan kas ini sekitar ' + limits.max_orders_at_current_cash +
        ' pesanan per hari.'
      : '';
    return {
      level: 'ember',
      label: 'Kas tidak cukup',
      note: 'Kas ' + formatRupiah(input.current_cash) + ' kurang ' +
        formatRupiah(Math.abs(cash.surplus_over_minimum)) +
        ' dari modal kerja minimum ' + formatRupiah(cash.minimum_working_capital) +
        '. Tambah kas, percepat pencairan, atau turunkan volume.' + orderNote,
    };
  }

  if (volume.profit < 0) {
    return {
      level: 'ember',
      label: 'Operasional rugi',
      note: 'Kas cukup untuk modal kerja, tetapi operasional harian rugi ' +
        formatRupiah(Math.abs(volume.profit)) + ' per hari. Perbaiki harga, HPP, ' +
        'atau biaya tetap sebelum menambah volume.',
    };
  }

  if (cash.status === 'thin') {
    return {
      level: 'signal',
      label: 'Kas ketat',
      note: 'Kas ' + formatRupiah(input.current_cash) + ' masih ' +
        formatRupiah(cash.surplus_over_minimum) + ' di atas modal kerja minimum, ' +
        'tetapi kurang ' + formatRupiah(Math.abs(cash.surplus_over_recommended)) +
        ' dari kas disarankan ' + formatRupiah(cash.recommended_cash) + '.',
    };
  }

  if (input.daily_orders > 0 &&
      volume.margin_pct < input.target_margin_pct - EPSILON) {
    return {
      level: 'signal',
      label: 'Kas aman, margin tipis',
      note: 'Kas ' + formatRupiah(input.current_cash) + ' melewati kas disarankan ' +
        formatRupiah(cash.recommended_cash) + ', tetapi margin harian ' +
        volume.margin_pct + ' persen masih di bawah target ' +
        input.target_margin_pct + ' persen.',
    };
  }

  return {
    level: 'ok',
    label: 'Kas aman',
    note: 'Kas ' + formatRupiah(input.current_cash) + ' melewati kas disarankan ' +
      formatRupiah(cash.recommended_cash) + ' dengan ruang ' +
      formatRupiah(cash.surplus_over_recommended) + '. Margin harian ' +
      volume.margin_pct + ' persen memenuhi target ' + input.target_margin_pct + ' persen.',
  };
}

function buildRecommendations(input, volume, cash, limits, scenarios, warnings) {
  const list = [];

  if (cash.status === 'short') {
    list.push(
      'Tambah kas minimal ' + formatRupiah(Math.abs(cash.surplus_over_minimum)) +
      ' agar modal kerja minimum ' + formatRupiah(cash.minimum_working_capital) +
      ' tertutup. Untuk mencapai kas disarankan, tambah ' +
      formatRupiah(Math.abs(cash.surplus_over_recommended)) + '.'
    );
  } else if (cash.status === 'thin') {
    list.push(
      'Kas ' + formatRupiah(input.current_cash) + ' berada di atas minimum ' +
      formatRupiah(cash.minimum_working_capital) + ' tetapi di bawah kas disarankan ' +
      formatRupiah(cash.recommended_cash) + '. Sisihkan ' +
      formatRupiah(Math.abs(cash.surplus_over_recommended)) +
      ' lagi sebagai buffer sebelum menaikkan volume.'
    );
  } else {
    list.push(
      'Kas ' + formatRupiah(input.current_cash) + ' melewati kas disarankan ' +
      formatRupiah(cash.recommended_cash) + ' dengan ruang ' +
      formatRupiah(cash.surplus_over_recommended) + '. Ruang ini bisa dipakai untuk ' +
      'restock atau kampanye, bukan untuk menambah biaya tetap permanen.'
    );
  }

  list.push(
    'Modal kerja minimum ' + formatRupiah(cash.minimum_working_capital) +
    ' terdiri dari ' + formatRupiah(cash.receivable_gap) + ' piutang pencairan (' +
    cash.lag_days + ' hari) dan ' + formatRupiah(cash.inventory_buffer) +
    ' buffer stok (' + input.restock_lead_days + ' hari restock).'
  );

  list.push(
    'Setiap tambahan 1 hari jeda pencairan menambah kebutuhan kas ' +
    formatRupiah(volume.daily_cash_out) + '. Pada volume ' + input.daily_orders +
    ' pesanan per hari, tambahan 7 hari berarti ' +
    formatRupiah(volume.daily_cash_out * 7) + '.'
  );

  list.push(
    'Piutang yang sudah menjadi omzet tetapi belum cair sekitar ' +
    formatRupiah(cash.settlement_receivable) + '. Angka ini bukan kas yang bisa dipakai ' +
    'untuk restock hari ini.'
  );

  if (limits.break_even_orders !== null) {
    list.push(
      'Kontribusi per pesanan ' + formatRupiah(volume.contribution_per_order) +
      '. Biaya tetap harian ' +
      formatRupiah(input.ads_spend_per_day + input.fixed_cost_per_day) +
      ' tertutup mulai ' + limits.break_even_orders + ' pesanan per hari.'
    );
  } else {
    list.push(
      'Kontribusi per pesanan ' + formatRupiah(volume.contribution_per_order) +
      '. Biaya tetap harian tidak bisa ditutup oleh volume karena kontribusi nol ' +
      'atau negatif.'
    );
  }

  if (limits.max_orders_at_current_cash !== null) {
    const volumeNote = limits.max_orders_at_current_cash >= input.daily_orders
      ? 'Volume saat ini masih di dalam batas kas.'
      : 'Volume saat ini ' + input.daily_orders + ' pesanan, jadi perlu tambahan kas ' +
        'atau penurunan volume.';
    list.push(
      'Dengan kas ' + formatRupiah(input.current_cash) + ', volume aman sekitar ' +
      limits.max_orders_at_current_cash + ' pesanan per hari. ' + volumeNote
    );
  }

  const safeDelays = scenarios.filter((item) => item.status === 'ok');
  const shortDelays = scenarios.filter((item) => item.status === 'short');
  if (safeDelays.length > 0) {
    list.push(
      'Kas saat ini aman untuk jeda pencairan sampai ' +
      safeDelays[safeDelays.length - 1].payout_delay_days + ' hari pada skenario yang diuji.'
    );
  } else {
    list.push(
      'Belum ada skenario jeda pencairan 3 sampai 21 hari yang membuat kas aman. ' +
      'Tambah kas atau turunkan volume lebih dulu.'
    );
  }
  if (shortDelays.length > 0) {
    list.push(
      'Kas mulai kurang pada jeda ' + shortDelays[0].payout_delay_days +
      ' hari, dengan kekurangan ' +
      formatRupiah(Math.abs(shortDelays[0].surplus_over_recommended)) +
      ' dari kas disarankan.'
    );
  }

  if (warnings.length > 0) {
    list.push(
      'Ada ' + warnings.length + ' peringatan yang perlu dicek sebelum restock berikutnya.'
    );
  }

  list.push(DISCLAIMER);
  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const volume = evaluateVolume(input, input.daily_orders);
  const cash = buildCash(input, volume);
  const limits = buildLimits(input, volume);
  const scenarios = buildScenarios(input);
  const warnings = buildWarnings(input, volume, cash, limits);
  const verdict = buildVerdict(input, volume, cash, limits);
  const recommendations = buildRecommendations(
    input, volume, cash, limits, scenarios, warnings
  );

  const safeScenarios = scenarios.filter((item) => item.status === 'ok');
  const shortScenarios = scenarios.filter((item) => item.status === 'short');

  return {
    input,
    volume,
    cash,
    limits,
    scenarios,
    scenario_summary: {
      safe_count: safeScenarios.length,
      thin_count: scenarios.filter((item) => item.status === 'thin').length,
      short_count: shortScenarios.length,
      max_safe_payout_delay_days: safeScenarios.length > 0
        ? safeScenarios[safeScenarios.length - 1].payout_delay_days
        : null,
      first_short_payout_delay_days: shortScenarios.length > 0
        ? shortScenarios[0].payout_delay_days
        : null,
    },
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
    'toko',
    'pesanan_harian',
    'skenario_delay_hari',
    'total_lag_hari',
    'omzet_harian',
    'profit_harian',
    'margin_persen',
    'kas_keluar_harian',
    'piutang_tertahan',
    'modal_kerja_minimum',
    'kas_disarankan',
    'selisih_kas',
    'status_kas',
  ];

  const lines = [header.join(',')];
  result.scenarios.forEach((scenario) => {
    const scenarioInput = Object.assign({}, result.input, {
      payout_delay_days: scenario.payout_delay_days,
    });
    const volume = evaluateVolume(scenarioInput, scenarioInput.daily_orders);
    lines.push([
      result.input.store_label || 'Toko',
      result.input.daily_orders,
      scenario.payout_delay_days,
      scenario.lag_days,
      volume.revenue,
      volume.profit,
      volume.margin_pct,
      volume.daily_cash_out,
      scenario.receivable_gap,
      scenario.minimum_working_capital,
      scenario.recommended_cash,
      scenario.surplus_over_recommended,
      scenario.status_label,
    ].map(csvEscape).join(','));
  });

  return lines.join('\n');
}

function example() {
  return {
    store_label: 'Toko kaos harian',
    daily_orders: 12,
    avg_price: 95000,
    unit_cost: 55000,
    marketplace_fee_pct: 8,
    packaging_per_order: 2000,
    shipping_subsidy_per_order: 3000,
    ads_spend_per_day: 150000,
    fixed_cost_per_day: 100000,
    target_margin_pct: 10,
    delivery_days: 2,
    payout_delay_days: 7,
    restock_lead_days: 7,
    safety_buffer_days: 5,
    current_cash: 15000000,
  };
}

function meta() {
  return {
    limits: LIMITS,
    payout_scenarios: PAYOUT_SCENARIOS,
    cash_status_labels: CASH_STATUS_LABELS,
    daily_status_labels: DAILY_STATUS_LABELS,
    formula:
      'profit harian = omzet - komisi - HPP - kemasan - ongkir - iklan - biaya tetap',
    working_capital_formula:
      'modal kerja = kas keluar harian x (waktu kirim + jeda pencairan) + HPP x pesanan ' +
      'harian x lead time restock',
    recommended_cash_formula:
      'kas disarankan = modal kerja minimum + kas keluar harian x buffer kas',
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
  evaluateVolume,
  buildCash,
  buildLimits,
  buildScenarios,
  buildWarnings,
  buildVerdict,
  buildRecommendations,
  cashStatus,
  LIMITS,
  PAYOUT_SCENARIOS,
  CASH_STATUS_LABELS,
  DAILY_STATUS_LABELS,
  ASSUMPTIONS,
  SCOPE_NOTE,
  DISCLAIMER,
};
