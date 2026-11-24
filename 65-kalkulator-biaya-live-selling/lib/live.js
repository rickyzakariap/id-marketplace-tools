'use strict';

const MAX_TEXT = 120;
const EPSILON = 1e-9;
const MIN_PRICE_STEP = 100;
const SCENARIO_MULTIPLIERS = [50, 75, 100, 125, 150];

const LIMITS = {
  max_duration_hours: 24,
  max_viewers: 100000000,
  max_units: 1000000,
  max_price: 10000000000,
  max_unit_cost: 1000000000,
  max_fee_pct: 40,
  max_affiliate_pct: 50,
  max_host_fee_per_hour: 100000000,
  max_host_count: 50,
  max_session_cost: 10000000000,
  max_packaging: 1000000,
  max_target_margin_pct: 90,
};

const STATUS_LABELS = {
  ok: 'Margin aman',
  thin: 'Di bawah target',
  loss: 'Rugi sesi',
};

const ASSUMPTIONS = [
  'Harga rata-rata per unit sudah memperhitungkan diskon, voucher, dan harga khusus live.',
  'Komisi platform dihitung dari omzet setelah diskon, bukan dari harga normal.',
  'Komisi affiliate hanya dikenakan pada porsi pesanan yang berasal dari link afiliasi.',
  'Host dibayar per jam. Bagi hasil penjualan untuk host belum termasuk.',
  'HPP per unit sudah mencakup bahan dan ongkir masuk ke gudang.',
  'Sampel, iklan, dan biaya lain dihitung satu kali per sesi, bukan per pesanan.',
  'Belum termasuk pajak, retur, refund, subsidi ongkir ke pembeli, dan biaya tetap toko.',
  'Skenario volume memakai harga, porsi affiliate, dan biaya tetap sesi yang sama.',
  'Harga minimum dibulatkan ke atas pada langkah Rp 100.',
];

const SCOPE_NOTE =
  'Tool membantu menghitung biaya dan margin satu sesi live selling. Tool tidak menetapkan ' +
  'tarif host, komisi affiliate, atau kebijakan platform.';

const DISCLAIMER =
  'Angka adalah estimasi dari input Anda, bukan laporan laba resmi. Cocokkan dengan tagihan ' +
  'platform, kontrak host, dan laporan affiliate sebelum mengambil keputusan.';

const FIELD_LABELS = {
  duration_hours: 'Durasi sesi',
  viewers: 'Jumlah penonton',
  units_sold: 'Unit terjual',
  avg_price: 'Harga rata-rata per unit',
  unit_cost: 'HPP per unit',
  marketplace_fee_pct: 'Komisi platform',
  affiliate_pct: 'Komisi affiliate',
  affiliate_order_pct: 'Porsi pesanan affiliate',
  host_fee_per_hour: 'Biaya host per jam',
  host_count: 'Jumlah host',
  ads_spend: 'Biaya iklan',
  sample_cost: 'Biaya sampel',
  packaging_per_order: 'Kemasan per pesanan',
  other_cost: 'Biaya lain per sesi',
  target_margin_pct: 'Target margin',
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

function ceilToStep(value, step) {
  return Math.ceil((value - EPSILON) / step) * step;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function normalizeInput(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};

  return {
    session_label: cleanText(source.session_label, MAX_TEXT),
    duration_hours: numOr(source.duration_hours, 3),
    viewers: numOr(source.viewers, 0),
    units_sold: numOr(source.units_sold, 0),
    avg_price: numOr(source.avg_price, 0),
    unit_cost: numOr(source.unit_cost, 0),
    marketplace_fee_pct: numOr(source.marketplace_fee_pct, 8),
    affiliate_pct: numOr(source.affiliate_pct, 0),
    affiliate_order_pct: numOr(source.affiliate_order_pct, 0),
    host_fee_per_hour: numOr(source.host_fee_per_hour, 0),
    host_count: numOr(source.host_count, 1),
    ads_spend: numOr(source.ads_spend, 0),
    sample_cost: numOr(source.sample_cost, 0),
    packaging_per_order: numOr(source.packaging_per_order, 0),
    other_cost: numOr(source.other_cost, 0),
    target_margin_pct: numOr(source.target_margin_pct, 15),
  };
}

function effectiveAffiliatePct(input) {
  return (input.affiliate_pct * input.affiliate_order_pct) / 100;
}

function validateInput(input) {
  if (!Number.isFinite(input.duration_hours) || input.duration_hours <= 0) {
    throw new Error(FIELD_LABELS.duration_hours + ' harus lebih dari 0 jam.');
  }
  if (input.duration_hours > LIMITS.max_duration_hours) {
    throw new Error(FIELD_LABELS.duration_hours + ' maksimal ' +
      LIMITS.max_duration_hours + ' jam.');
  }

  if (!Number.isInteger(input.viewers) || input.viewers < 0) {
    throw new Error(FIELD_LABELS.viewers + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.viewers > LIMITS.max_viewers) {
    throw new Error(FIELD_LABELS.viewers + ' terlalu besar.');
  }

  if (!Number.isInteger(input.units_sold) || input.units_sold < 0) {
    throw new Error(FIELD_LABELS.units_sold + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.units_sold > LIMITS.max_units) {
    throw new Error(FIELD_LABELS.units_sold + ' terlalu besar.');
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

  if (!Number.isFinite(input.affiliate_pct) || input.affiliate_pct < 0) {
    throw new Error(FIELD_LABELS.affiliate_pct + ' harus berupa angka 0 atau lebih.');
  }
  if (input.affiliate_pct > LIMITS.max_affiliate_pct) {
    throw new Error(FIELD_LABELS.affiliate_pct + ' maksimal ' +
      LIMITS.max_affiliate_pct + ' persen.');
  }

  if (!Number.isFinite(input.affiliate_order_pct) || input.affiliate_order_pct < 0) {
    throw new Error(FIELD_LABELS.affiliate_order_pct + ' harus berupa angka 0 atau lebih.');
  }
  if (input.affiliate_order_pct > 100) {
    throw new Error(FIELD_LABELS.affiliate_order_pct + ' maksimal 100 persen.');
  }

  const affiliateEffective = effectiveAffiliatePct(input);

  if (!Number.isFinite(input.host_fee_per_hour) || input.host_fee_per_hour < 0) {
    throw new Error(FIELD_LABELS.host_fee_per_hour + ' harus berupa angka 0 atau lebih.');
  }
  if (input.host_fee_per_hour > LIMITS.max_host_fee_per_hour) {
    throw new Error(FIELD_LABELS.host_fee_per_hour + ' terlalu besar.');
  }

  if (!Number.isInteger(input.host_count) || input.host_count <= 0) {
    throw new Error(FIELD_LABELS.host_count + ' harus bilangan bulat lebih dari 0.');
  }
  if (input.host_count > LIMITS.max_host_count) {
    throw new Error(FIELD_LABELS.host_count + ' maksimal ' + LIMITS.max_host_count + '.');
  }

  ['ads_spend', 'sample_cost', 'other_cost'].forEach((key) => {
    if (!Number.isFinite(input[key]) || input[key] < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
    if (input[key] > LIMITS.max_session_cost) {
      throw new Error(FIELD_LABELS[key] + ' terlalu besar.');
    }
  });

  if (!Number.isFinite(input.packaging_per_order) || input.packaging_per_order < 0) {
    throw new Error(FIELD_LABELS.packaging_per_order + ' harus angka 0 atau lebih.');
  }
  if (input.packaging_per_order > LIMITS.max_packaging) {
    throw new Error(FIELD_LABELS.packaging_per_order + ' terlalu besar.');
  }

  if (!Number.isFinite(input.target_margin_pct) || input.target_margin_pct < 0) {
    throw new Error(FIELD_LABELS.target_margin_pct + ' harus angka 0 atau lebih.');
  }
  if (input.target_margin_pct > LIMITS.max_target_margin_pct) {
    throw new Error(FIELD_LABELS.target_margin_pct + ' maksimal ' +
      LIMITS.max_target_margin_pct + ' persen.');
  }
  if (input.marketplace_fee_pct + affiliateEffective + input.target_margin_pct >= 100) {
    throw new Error(
      'Jumlah komisi platform, affiliate efektif, dan target margin harus di bawah 100 persen.'
    );
  }
}

function evaluateSession(input, units) {
  const affiliatePct = effectiveAffiliatePct(input);
  const revenue = round2(units * input.avg_price);
  const platformFee = round2(revenue * (input.marketplace_fee_pct / 100));
  const affiliateFee = round2(revenue * (affiliatePct / 100));
  const productCost = round2(units * input.unit_cost);
  const packagingCost = round2(units * input.packaging_per_order);
  const hostCost = round2(input.host_fee_per_hour * input.duration_hours * input.host_count);
  const adsSpend = round2(input.ads_spend);
  const sampleCost = round2(input.sample_cost);
  const otherCost = round2(input.other_cost);
  const fixedCost = round2(hostCost + adsSpend + sampleCost + otherCost);
  const totalCost = round2(
    productCost + packagingCost + platformFee + affiliateFee + fixedCost
  );
  const profit = round2(revenue - totalCost);
  const marginPct = revenue > 0 ? round2((profit / revenue) * 100) : 0;

  let status = 'ok';
  if (profit < 0) {
    status = 'loss';
  } else if (marginPct < input.target_margin_pct - EPSILON) {
    status = 'thin';
  }

  const contributionPerUnit = round2(
    input.avg_price * (1 - (input.marketplace_fee_pct + affiliatePct) / 100) -
    input.unit_cost - input.packaging_per_order
  );

  return {
    units,
    revenue,
    product_cost: productCost,
    packaging_cost: packagingCost,
    platform_fee: platformFee,
    affiliate_fee: affiliateFee,
    host_cost: hostCost,
    ads_spend: adsSpend,
    sample_cost: sampleCost,
    other_cost: otherCost,
    fixed_cost: fixedCost,
    total_cost: totalCost,
    profit,
    profit_per_hour: round2(profit / input.duration_hours),
    cost_per_order: units > 0 ? round2(totalCost / units) : null,
    profit_per_order: units > 0 ? round2(profit / units) : null,
    cost_per_viewer: input.viewers > 0 ? round2(totalCost / input.viewers) : null,
    revenue_per_viewer: input.viewers > 0 ? round2(revenue / input.viewers) : null,
    conversion_pct: input.viewers > 0 ? round2((units / input.viewers) * 100) : null,
    roi_pct: totalCost > 0 ? round2((profit / totalCost) * 100) : null,
    contribution_per_unit: contributionPerUnit,
    margin_pct: marginPct,
    status,
    status_label: STATUS_LABELS[status],
  };
}

function buildLimits(input, session) {
  const affiliatePct = effectiveAffiliatePct(input);
  const targetRate = input.target_margin_pct / 100;

  const breakEvenUnits = session.contribution_per_unit > 0
    ? Math.max(0, Math.ceil((session.fixed_cost - EPSILON) / session.contribution_per_unit))
    : null;
  const breakEvenRevenue = breakEvenUnits === null ? null : breakEvenUnits * input.avg_price;

  const unitMarginAtTarget = input.avg_price * (
    1 - targetRate - (input.marketplace_fee_pct + affiliatePct) / 100
  ) - input.unit_cost - input.packaging_per_order;
  const requiredUnits = unitMarginAtTarget > 0
    ? Math.max(0, Math.ceil((session.fixed_cost - EPSILON) / unitMarginAtTarget))
    : null;

  const priceShare = 1 - targetRate - (input.marketplace_fee_pct + affiliatePct) / 100;
  let minimumPrice = null;
  if (session.units > 0 && priceShare > 0) {
    const raw = (
      session.units * (input.unit_cost + input.packaging_per_order) + session.fixed_cost
    ) / (session.units * priceShare);
    minimumPrice = ceilToStep(raw, MIN_PRICE_STEP);
  }

  const maxFixedBudget = session.revenue * (1 - targetRate) -
    session.product_cost - session.packaging_cost -
    session.platform_fee - session.affiliate_fee;
  const maxHostPerHour = input.duration_hours > 0 && input.host_count > 0
    ? (maxFixedBudget - session.ads_spend - session.sample_cost - session.other_cost) /
      (input.duration_hours * input.host_count)
    : null;

  const maxAffiliateFee = session.revenue * (1 - targetRate) -
    session.product_cost - session.packaging_cost -
    session.platform_fee - session.fixed_cost;
  const affiliateBase = session.revenue * (input.affiliate_order_pct / 100);
  const maxAffiliatePct = affiliateBase > 0
    ? (maxAffiliateFee / affiliateBase) * 100
    : null;

  const maxAdsSpend = maxFixedBudget - session.host_cost -
    session.sample_cost - session.other_cost;

  return {
    break_even_units: breakEvenUnits,
    break_even_revenue: breakEvenRevenue === null ? null : round2(breakEvenRevenue),
    required_units_for_target: requiredUnits,
    minimum_price_at_target: minimumPrice,
    max_fixed_budget_at_target: round2(maxFixedBudget),
    max_host_fee_per_hour: maxHostPerHour === null ? null : round2(maxHostPerHour),
    max_affiliate_pct: maxAffiliatePct === null ? null : round2(maxAffiliatePct),
    max_ads_spend: round2(maxAdsSpend),
  };
}

function buildScenarios(input) {
  return SCENARIO_MULTIPLIERS.map((multiplier) => {
    const units = Math.max(0, Math.round((input.units_sold * multiplier) / 100));
    const session = evaluateSession(input, units);
    return {
      multiplier_pct: multiplier,
      units,
      revenue: session.revenue,
      total_cost: session.total_cost,
      profit: session.profit,
      profit_per_hour: session.profit_per_hour,
      margin_pct: session.margin_pct,
      status: session.status,
      status_label: session.status_label,
      is_actual: multiplier === 100,
    };
  });
}

function buildWarnings(input, session, limits) {
  const warnings = [];
  const revenue = session.revenue;

  if (input.unit_cost >= input.avg_price) {
    warnings.push(
      'HPP per unit sama atau lebih besar dari harga rata-rata. Periksa harga jual dan ' +
      'komponen HPP sebelum sesi berikutnya.'
    );
  }

  const affiliatePct = effectiveAffiliatePct(input);
  if (input.marketplace_fee_pct + affiliatePct >= 40) {
    warnings.push(
      'Komisi platform ' + input.marketplace_fee_pct + ' persen ditambah affiliate efektif ' +
      round2(affiliatePct) + ' persen memakan ' + round2(input.marketplace_fee_pct + affiliatePct) +
      ' persen omzet.'
    );
  }

  if (input.affiliate_pct > 20) {
    warnings.push(
      'Komisi affiliate ' + input.affiliate_pct + ' persen termasuk tinggi. Pastikan ' +
      'affiliate mendatangkan pesanan tambahan, bukan hanya memindahkan pembeli lama.'
    );
  }

  if (revenue > 0 && session.host_cost / revenue > 0.2) {
    warnings.push(
      'Biaya host ' + formatRupiah(session.host_cost) + ' setara ' +
      round2((session.host_cost / revenue) * 100) + ' persen omzet, di atas 20 persen.'
    );
  }

  if (revenue > 0 && session.ads_spend / revenue > 0.3) {
    warnings.push(
      'Biaya iklan ' + formatRupiah(session.ads_spend) + ' setara ' +
      round2((session.ads_spend / revenue) * 100) + ' persen omzet, di atas 30 persen.'
    );
  }

  if (limits.break_even_units === null) {
    warnings.push(
      'Kontribusi per unit negatif. Menambah jumlah unit tidak akan menutup biaya tetap, ' +
      'jadi harga atau HPP harus diubah lebih dulu.'
    );
  } else if (session.units > 0 && limits.break_even_units > session.units) {
    warnings.push(
      'Sesi ini butuh minimal ' + limits.break_even_units + ' unit untuk balik modal, ' +
      'sedangkan unit terjual ' + session.units + '.'
    );
  }

  if (limits.max_affiliate_pct !== null && limits.max_affiliate_pct <= 0) {
    warnings.push(
      'Bahkan tanpa komisi affiliate, margin sesi ini belum mencapai target ' +
      input.target_margin_pct + ' persen.'
    );
  }

  return warnings.filter((item, index) => warnings.indexOf(item) === index);
}

function buildVerdict(input, session, limits) {
  if (input.units_sold === 0) {
    if (session.total_cost > 0) {
      return {
        level: 'ember',
        label: 'Belum ada penjualan',
        note: 'Biaya sesi ' + formatRupiah(session.total_cost) + ' belum tertutup karena ' +
          'belum ada unit terjual. Isi unit terjual atau periksa biaya tetap sesi.',
      };
    }
    return {
      level: 'muted',
      label: 'Belum ada data',
      note: 'Isi unit terjual dan biaya sesi untuk melihat profit, margin, dan batas aman.',
    };
  }

  if (session.status === 'loss') {
    const breakEven = limits.break_even_units === null
      ? 'Kontribusi per unit negatif, sehingga volume tambahan tidak menutup biaya tetap.'
      : 'Butuh minimal ' + limits.break_even_units + ' unit pada harga ' +
        formatRupiah(input.avg_price) + ' untuk balik modal.';
    const price = limits.minimum_price_at_target === null
      ? ''
      : ' Harga minimum untuk target ' + input.target_margin_pct + ' persen adalah ' +
        formatRupiah(limits.minimum_price_at_target) + ' per unit.';
    return {
      level: 'ember',
      label: 'Sesi live rugi',
      note: 'Sesi rugi ' + formatRupiah(Math.abs(session.profit)) + ' dari omzet ' +
        formatRupiah(session.revenue) + '. ' + breakEven + price,
    };
  }

  if (session.status === 'thin') {
    const units = limits.required_units_for_target === null
      ? 'Margin per unit tidak cukup untuk menutup biaya tetap pada target ini.'
      : 'Butuh minimal ' + limits.required_units_for_target + ' unit untuk mencapai target.';
    const price = limits.minimum_price_at_target === null
      ? ''
      : ' Harga minimum ' + formatRupiah(limits.minimum_price_at_target) + ' per unit.';
    return {
      level: 'signal',
      label: 'Margin di bawah target',
      note: 'Margin ' + session.margin_pct + ' persen, kurang ' +
        round2(input.target_margin_pct - session.margin_pct) + ' poin dari target ' +
        input.target_margin_pct + ' persen. ' + units + price,
    };
  }

  const hostRoom = limits.max_host_fee_per_hour !== null && limits.max_host_fee_per_hour > 0
    ? ' Biaya host masih punya ruang sampai ' + formatRupiah(limits.max_host_fee_per_hour) +
      ' per jam sebelum menyentuh target.'
    : '';
  return {
    level: 'ok',
    label: 'Margin sesi aman',
    note: 'Margin ' + session.margin_pct + ' persen dengan profit ' +
      formatRupiah(session.profit) + ' atau ' + formatRupiah(session.profit_per_hour) +
      ' per jam.' + hostRoom,
  };
}

function buildRecommendations(input, session, limits, scenarios, warnings) {
  const list = [];
  const affiliatePct = effectiveAffiliatePct(input);

  if (session.status === 'loss') {
    if (limits.break_even_units === null) {
      list.push(
        'Kontribusi per unit Rp ' + formatNumber(session.contribution_per_unit) +
        ' (negatif). Naikkan harga di atas ' +
        formatRupiah(input.unit_cost + input.packaging_per_order) +
        ' ditambah komisi, atau turunkan HPP sebelum menambah volume.'
      );
    } else {
      list.push(
        'Sesi rugi ' + formatRupiah(Math.abs(session.profit)) + '. Titik balik modal ada di ' +
        limits.break_even_units + ' unit atau omzet ' +
        formatRupiah(limits.break_even_revenue) + '.'
      );
    }
  } else if (session.status === 'thin') {
    list.push(
      'Margin ' + session.margin_pct + ' persen, di bawah target ' +
      input.target_margin_pct + ' persen. Butuh ' +
      (limits.required_units_for_target === null ? 'harga lebih tinggi' :
        limits.required_units_for_target + ' unit') +
      (limits.minimum_price_at_target === null ? '' :
        ' atau harga minimal ' + formatRupiah(limits.minimum_price_at_target) + ' per unit') +
      ' agar target tercapai.'
    );
  } else {
    list.push(
      'Margin ' + session.margin_pct + ' persen memenuhi target ' +
      input.target_margin_pct + ' persen. Profit sesi ' +
      formatRupiah(session.profit) + ', setara ' +
      formatRupiah(session.profit_per_hour) + ' per jam.'
    );
  }

  list.push(
    'Kontribusi per unit ' + formatRupiah(session.contribution_per_unit) +
    ' setelah HPP, kemasan, komisi platform, dan affiliate. Biaya tetap sesi ' +
    formatRupiah(session.fixed_cost) + ' harus ditutup oleh kontribusi tersebut.'
  );

  const affiliatePerPoint = session.revenue * (input.affiliate_order_pct / 100) / 100;
  list.push(
    'Komisi affiliate efektif ' + round2(affiliatePct) + ' persen dari omzet, yaitu ' +
    formatRupiah(session.affiliate_fee) + '. Setiap kenaikan 1 poin affiliate menambah biaya ' +
    formatRupiah(affiliatePerPoint) + ' pada volume ini.'
  );

  if (limits.max_host_fee_per_hour !== null) {
    if (limits.max_host_fee_per_hour > input.host_fee_per_hour) {
      list.push(
        'Batas biaya host agar target tetap tercapai adalah ' +
        formatRupiah(limits.max_host_fee_per_hour) + ' per jam. Saat ini ' +
        formatRupiah(input.host_fee_per_hour) + ' per jam, masih ada ruang ' +
        formatRupiah(limits.max_host_fee_per_hour - input.host_fee_per_hour) + ' per jam.'
      );
    } else {
      list.push(
        'Biaya host saat ini ' + formatRupiah(input.host_fee_per_hour) +
        ' per jam sudah melewati batas ' + formatRupiah(limits.max_host_fee_per_hour) +
        ' per jam untuk target margin ini.'
      );
    }
  }

  if (limits.max_affiliate_pct !== null && limits.max_affiliate_pct > 0) {
    list.push(
      'Komisi affiliate masih bisa naik sampai ' + limits.max_affiliate_pct +
      ' persen sebelum margin menyentuh target, dengan porsi pesanan affiliate ' +
      input.affiliate_order_pct + ' persen.'
    );
  }

  if (limits.max_ads_spend > session.ads_spend) {
    list.push(
      'Anggaran iklan masih bisa naik ' +
      formatRupiah(limits.max_ads_spend - session.ads_spend) + ' lagi, dari ' +
      formatRupiah(session.ads_spend) + ' menjadi ' + formatRupiah(limits.max_ads_spend) +
      ', tanpa melewati target margin.'
    );
  }

  const safe = scenarios.filter((item) => item.status === 'ok');
  const thin = scenarios.filter((item) => item.status === 'thin');
  const loss = scenarios.filter((item) => item.status === 'loss');
  const firstSafe = safe.find((item) => item.multiplier_pct >= 100);
  if (firstSafe) {
    list.push(
      'Dari skenario 50 sampai 150 persen, margin aman mulai terlihat pada ' +
      firstSafe.multiplier_pct + ' persen volume, yaitu ' + firstSafe.units + ' unit.'
    );
  } else if (safe.length > 0) {
    list.push(
      'Skenario aman tertinggi hanya pada ' + safe[safe.length - 1].multiplier_pct +
      ' persen volume. Sesi saat ini masih di bawah target.'
    );
  } else {
    list.push(
      'Tidak ada skenario volume 50 sampai 150 persen yang mencapai target margin. ' +
      'Harga, HPP, atau biaya tetap perlu diubah.'
    );
  }

  if (thin.length > 0 || loss.length > 0) {
    list.push(
      'Skenario di bawah target: ' +
      thin.concat(loss).map((item) => item.multiplier_pct + ' persen').join(', ') +
      '. Naikkan volume, harga, atau pangkas biaya tetap pada skenario tersebut.'
    );
  }

  if (warnings.length > 0) {
    list.push('Ada ' + warnings.length + ' peringatan yang perlu dicek sebelum sesi berikutnya.');
  }

  list.push(DISCLAIMER);
  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const session = evaluateSession(input, input.units_sold);
  const limits = buildLimits(input, session);
  const scenarios = buildScenarios(input);
  const warnings = buildWarnings(input, session, limits);
  const verdict = buildVerdict(input, session, limits);
  const recommendations = buildRecommendations(input, session, limits, scenarios, warnings);

  const safeScenarios = scenarios.filter((item) => item.status === 'ok');
  const bestSafe = safeScenarios.length > 0
    ? safeScenarios.reduce(
      (best, item) => (item.profit > best.profit ? item : best),
      safeScenarios[0]
    )
    : null;

  return {
    input,
    affiliate_effective_pct: round2(effectiveAffiliatePct(input)),
    session,
    limits,
    scenarios,
    scenario_summary: {
      safe_count: safeScenarios.length,
      thin_count: scenarios.filter((item) => item.status === 'thin').length,
      loss_count: scenarios.filter((item) => item.status === 'loss').length,
      best_safe_multiplier_pct: bestSafe ? bestSafe.multiplier_pct : null,
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
    'sesi',
    'skenario_persen',
    'unit_terjual',
    'omzet',
    'hpp',
    'kemasan',
    'komisi_platform',
    'komisi_affiliate',
    'biaya_host',
    'iklan',
    'sampel',
    'biaya_lain',
    'total_biaya',
    'profit',
    'margin_persen',
    'status',
  ];

  const lines = [header.join(',')];
  result.scenarios.forEach((scenario) => {
    const full = evaluateSession(result.input, scenario.units);
    lines.push([
      result.input.session_label || 'Sesi live',
      scenario.multiplier_pct,
      scenario.units,
      full.revenue,
      full.product_cost,
      full.packaging_cost,
      full.platform_fee,
      full.affiliate_fee,
      full.host_cost,
      full.ads_spend,
      full.sample_cost,
      full.other_cost,
      full.total_cost,
      full.profit,
      full.margin_pct,
      full.status_label,
    ].map(csvEscape).join(','));
  });

  return lines.join('\n');
}

function example() {
  return {
    session_label: 'Live malam promo akhir bulan',
    duration_hours: 3,
    viewers: 4200,
    units_sold: 72,
    avg_price: 129000,
    unit_cost: 68000,
    marketplace_fee_pct: 8,
    affiliate_pct: 10,
    affiliate_order_pct: 40,
    host_fee_per_hour: 150000,
    host_count: 1,
    ads_spend: 600000,
    sample_cost: 300000,
    packaging_per_order: 2500,
    other_cost: 60000,
    target_margin_pct: 15,
  };
}

function meta() {
  return {
    limits: LIMITS,
    scenario_multipliers: SCENARIO_MULTIPLIERS,
    min_price_step: MIN_PRICE_STEP,
    status_labels: STATUS_LABELS,
    formula:
      'profit = omzet - HPP - kemasan - komisi platform - affiliate - host - iklan - sampel',
    margin_formula: 'margin = profit / omzet',
    break_even_formula:
      'unit balik modal = biaya tetap / (harga - komisi - HPP - kemasan)',
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
  evaluateSession,
  buildLimits,
  buildScenarios,
  buildWarnings,
  buildVerdict,
  buildRecommendations,
  effectiveAffiliatePct,
  LIMITS,
  SCENARIO_MULTIPLIERS,
  STATUS_LABELS,
  ASSUMPTIONS,
  SCOPE_NOTE,
  DISCLAIMER,
};
