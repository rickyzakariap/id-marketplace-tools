'use strict';

const MAX_TEXT = 120;
const MAX_OPTIONS = 8;

const DIVISORS = [
  { id: 5000, label: 'Pembagi 5000' },
  { id: 6000, label: 'Pembagi 6000' },
  { id: 7000, label: 'Pembagi 7000' },
  { id: 8000, label: 'Pembagi 8000' },
];

const ROUNDING_STEPS = [
  { id: 0.1, label: '0,1 kg' },
  { id: 0.25, label: '0,25 kg' },
  { id: 0.5, label: '0,5 kg' },
  { id: 1, label: '1 kg' },
];

const LIMITS = {
  max_dimension_cm: 300,
  max_weight_kg: 500,
  min_divisor: 1000,
  max_divisor: 20000,
  max_rate_per_kg: 10000000,
  max_shipments_per_month: 100000,
  max_rounding_step: 5,
};

const ASSUMPTIONS = [
  'Berat volume dihitung dari panjang x lebar x tinggi dalam cm, lalu dibagi pembagi ' +
  'yang dipilih.',
  'Berat tertagih memakai nilai terbesar antara berat aktual dan berat volume, ' +
  'lalu dibulatkan ke atas.',
  'Biaya per kirim adalah tarif berat setelah minimum charge, ditambah biaya admin ' +
  'dan biaya kemasan.',
  'Pembagi 5000, 6000, 7000, dan 8000 adalah preset umum. Tarif resmi tiap kurir ' +
  'bisa berbeda.',
  'Belum termasuk asuransi, biaya area terpencil, bahan bakar, PPN, dan biaya ' +
  'tambahan lain.',
  'Proyeksi bulanan menganggap profil paket dan jumlah kiriman sama setiap bulan.',
];

const SCOPE_NOTE =
  'Tool membantu menghitung berat volume, berat tertagih, biaya kirim, dan peluang ' +
  'penghematan dari pengecilan kemasan. Tool tidak menetapkan tarif resmi kurir.';

const DISCLAIMER =
  'Angka adalah estimasi dari input Anda, bukan tagihan resmi kurir. Selalu cocokkan ' +
  'dengan tarif tertulis dan hasil timbangan resmi.';

const FIELD_LABELS = {
  length_cm: 'Panjang',
  width_cm: 'Lebar',
  height_cm: 'Tinggi',
  actual_weight_kg: 'Berat aktual',
  divisor: 'Pembagi volume',
  rate_per_kg: 'Tarif per kg',
  minimum_charge: 'Minimum charge',
  admin_fee: 'Biaya admin',
  packaging_cost: 'Biaya kemasan',
  rounding_step: 'Langkah pembulatan',
  shipments_per_month: 'Jumlah kiriman per bulan',
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
  return Math.round(value * 100) / 100;
}

function ceilTo(value, step) {
  // Subtract a tiny amount so exact multiples do not jump to the next step.
  return Math.ceil((value - 1e-9) / step) * step;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function normalizeDimensions(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    length_cm: numOr(source.length_cm, 0),
    width_cm: numOr(source.width_cm, 0),
    height_cm: numOr(source.height_cm, 0),
  };
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const hasProposed = input.proposed_dimensions && typeof input.proposed_dimensions === 'object';

  return {
    package_label: cleanText(input.package_label, MAX_TEXT),
    length_cm: numOr(input.length_cm, 0),
    width_cm: numOr(input.width_cm, 0),
    height_cm: numOr(input.height_cm, 0),
    actual_weight_kg: numOr(input.actual_weight_kg, 0),
    divisor: numOr(input.divisor, 6000),
    rate_per_kg: numOr(input.rate_per_kg, 0),
    minimum_charge: numOr(input.minimum_charge, 0),
    admin_fee: numOr(input.admin_fee, 0),
    packaging_cost: numOr(input.packaging_cost, 0),
    rounding_step: numOr(input.rounding_step, 0.1),
    shipments_per_month: numOr(input.shipments_per_month, 0),
    proposed_dimensions: hasProposed ? normalizeDimensions(input.proposed_dimensions) : null,
  };
}

function validateDimensions(dimensions, prefix) {
  ['length_cm', 'width_cm', 'height_cm'].forEach((key) => {
    const value = dimensions[key];
    const label = (prefix || '') + FIELD_LABELS[key];
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(label + ' harus lebih dari 0 cm.');
    }
    if (value > LIMITS.max_dimension_cm) {
      throw new Error(label + ' maksimal ' + LIMITS.max_dimension_cm + ' cm.');
    }
  });
}

function validateInput(input) {
  validateDimensions(input, '');

  if (!Number.isFinite(input.actual_weight_kg) || input.actual_weight_kg <= 0) {
    throw new Error(FIELD_LABELS.actual_weight_kg + ' harus lebih dari 0 kg.');
  }
  if (input.actual_weight_kg > LIMITS.max_weight_kg) {
    throw new Error(FIELD_LABELS.actual_weight_kg + ' maksimal ' +
      LIMITS.max_weight_kg + ' kg.');
  }

  if (!Number.isFinite(input.divisor) || input.divisor < LIMITS.min_divisor) {
    throw new Error(FIELD_LABELS.divisor + ' minimal ' + LIMITS.min_divisor + '.');
  }
  if (input.divisor > LIMITS.max_divisor) {
    throw new Error(FIELD_LABELS.divisor + ' maksimal ' + LIMITS.max_divisor + '.');
  }

  if (!Number.isFinite(input.rate_per_kg) || input.rate_per_kg <= 0) {
    throw new Error(FIELD_LABELS.rate_per_kg + ' harus lebih dari 0.');
  }
  if (input.rate_per_kg > LIMITS.max_rate_per_kg) {
    throw new Error(FIELD_LABELS.rate_per_kg + ' terlalu besar.');
  }

  ['minimum_charge', 'admin_fee', 'packaging_cost'].forEach((key) => {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
  });

  if (!Number.isFinite(input.rounding_step) || input.rounding_step <= 0) {
    throw new Error(FIELD_LABELS.rounding_step + ' harus lebih dari 0.');
  }
  if (input.rounding_step > LIMITS.max_rounding_step) {
    throw new Error(FIELD_LABELS.rounding_step + ' maksimal ' +
      LIMITS.max_rounding_step + ' kg.');
  }

  if (!Number.isInteger(input.shipments_per_month) || input.shipments_per_month < 0) {
    throw new Error(FIELD_LABELS.shipments_per_month + ' harus bilangan bulat 0 atau lebih.');
  }
  if (input.shipments_per_month > LIMITS.max_shipments_per_month) {
    throw new Error(FIELD_LABELS.shipments_per_month + ' maksimal ' +
      LIMITS.max_shipments_per_month + '.');
  }

  if (input.proposed_dimensions) {
    validateDimensions(input.proposed_dimensions, 'Ukuran usulan: ');
  }
}

function evaluate(input) {
  const volume = input.length_cm * input.width_cm * input.height_cm;
  const volumetric = volume / input.divisor;
  const rawBilled = Math.max(input.actual_weight_kg, volumetric);
  const chargeable = round2(ceilTo(rawBilled, input.rounding_step));
  const actualChargeable = round2(ceilTo(input.actual_weight_kg, input.rounding_step));

  const weightCharge = Math.max(input.minimum_charge, chargeable * input.rate_per_kg);
  const actualWeightCharge = Math.max(
    input.minimum_charge,
    actualChargeable * input.rate_per_kg
  );
  const fixed = input.admin_fee + input.packaging_cost;
  const total = weightCharge + fixed;
  const actualTotal = actualWeightCharge + fixed;
  const volumeExtra = Math.max(0, total - actualTotal);

  const nextChargeable = round2(chargeable + input.rounding_step);
  const nextTotal = Math.max(input.minimum_charge, nextChargeable * input.rate_per_kg) + fixed;
  const nextTierExtra = Math.max(0, nextTotal - total);
  const maxVolumeForTier = input.divisor * chargeable;
  const volumeHeadroom = maxVolumeForTier - volume;

  const density = volume > 0 ? input.actual_weight_kg / (volume / 1000000) : 0;
  const volumeRatio = input.actual_weight_kg > 0
    ? volume / (input.divisor * input.actual_weight_kg)
    : 0;

  return {
    volume_cm3: round2(volume),
    volumetric_kg: round2(volumetric),
    actual_weight_kg: round2(input.actual_weight_kg),
    chargeable_kg: chargeable,
    actual_chargeable_kg: actualChargeable,
    billed_by: volumetric > input.actual_weight_kg ? 'volume' : 'actual',
    weight_charge: round2(weightCharge),
    admin_fee: round2(input.admin_fee),
    packaging_cost: round2(input.packaging_cost),
    total_per_shipment: round2(total),
    cost_by_actual_weight: round2(actualTotal),
    volume_extra_per_shipment: round2(volumeExtra),
    monthly_total: round2(total * input.shipments_per_month),
    annual_total: round2(total * input.shipments_per_month * 12),
    volume_extra_monthly: round2(volumeExtra * input.shipments_per_month),
    volume_extra_annual: round2(volumeExtra * input.shipments_per_month * 12),
    density_kg_m3: round2(density),
    volume_ratio_pct: round2(volumeRatio * 100),
    max_volume_for_tier_cm3: round2(maxVolumeForTier),
    volume_headroom_cm3: round2(volumeHeadroom),
    next_chargeable_kg: nextChargeable,
    next_tier_extra: round2(nextTierExtra),
  };
}

function compareDivisors(input) {
  const rows = DIVISORS.map((item) => {
    const result = evaluate(Object.assign({}, input, { divisor: item.id }));
    return {
      divisor: item.id,
      label: item.label,
      volumetric_kg: result.volumetric_kg,
      chargeable_kg: result.chargeable_kg,
      total_per_shipment: result.total_per_shipment,
      volume_extra_per_shipment: result.volume_extra_per_shipment,
      selected: item.id === input.divisor,
    };
  });

  const cheapest = rows.reduce(
    (min, item) => (item.total_per_shipment < min ? item.total_per_shipment : min),
    rows[0].total_per_shipment
  );

  rows.forEach((item) => {
    item.extra_vs_cheapest = round2(item.total_per_shipment - cheapest);
  });

  return rows;
}

function buildVerdict(input, base, proposed, savings) {
  const volumeText = round2(base.volumetric_kg) + ' kg';
  const actualText = round2(input.actual_weight_kg) + ' kg';

  if (base.billed_by === 'volume' && base.volume_extra_per_shipment > 0) {
    return {
      level: 'ember',
      label: 'Ongkir ditentukan volume',
      note: 'Berat volume ' + volumeText + ' lebih besar dari berat aktual ' + actualText +
        '. Kelebihan biaya akibat volume ' + formatRupiah(base.volume_extra_per_shipment) +
        ' per kirim atau ' + formatRupiah(base.volume_extra_monthly) + ' per bulan.',
    };
  }

  if (base.billed_by === 'volume') {
    return {
      level: 'signal',
      label: 'Volume menentukan, biaya tertahan minimum',
      note: 'Berat volume ' + volumeText + ' lebih besar dari berat aktual ' + actualText +
        ', tetapi tarif minimum masih menahan biaya. Volume tetap perlu dijaga agar ' +
        'tidak naik ke tier berikutnya.',
    };
  }

  if (base.volume_ratio_pct >= 90) {
    return {
      level: 'signal',
      label: 'Volume hampir mendominasi',
      note: 'Berat volume ' + volumeText + ' sudah ' + base.volume_ratio_pct +
        ' persen dari batas berat aktual. Sedikit penambahan dimensi bisa membuat ongkir ' +
        'berpindah ke berat volume.',
    };
  }

  const proposedNote = proposed && savings && savings.per_shipment > 0
    ? ' Ukuran usulan menghemat ' + formatRupiah(savings.per_shipment) + ' per kirim.'
    : '';

  return {
    level: 'ok',
    label: 'Ongkir ditentukan berat aktual',
    note: 'Berat aktual ' + actualText + ' sama atau lebih besar dari berat volume ' +
      volumeText + '. Volume paket masih aman.' + proposedNote,
  };
}

function buildRecommendations(input, base, proposed, savings, divisors) {
  const list = [];
  const reductionNeeded = base.volume_cm3 - input.divisor * input.actual_weight_kg;

  if (base.billed_by === 'volume' && reductionNeeded > 0) {
    const percent = (reductionNeeded / base.volume_cm3) * 100;
    list.push(
      'Kurangi volume paket minimal ' + formatNumber(reductionNeeded) + ' cm3 (' +
      round2(percent) + ' persen) agar berat volume turun ke ' + input.actual_weight_kg + ' kg.'
    );
  }

  list.push(
    'Batas volume agar tetap di berat tertagih ' + base.chargeable_kg + ' kg adalah ' +
    formatNumber(base.max_volume_for_tier_cm3) + ' cm3. Sisa ruang ' +
    formatNumber(base.volume_headroom_cm3) + ' cm3.'
  );

  if (base.volume_headroom_cm3 < base.max_volume_for_tier_cm3 * 0.05 &&
      base.next_tier_extra > 0) {
    list.push(
      'Volume hampir naik ke tier ' + base.next_chargeable_kg + ' kg. Tier berikutnya ' +
      'menambah ' + formatRupiah(base.next_tier_extra) + ' per kirim.'
    );
  }

  if (proposed && savings && savings.per_shipment > 0) {
    list.push(
      'Ukuran usulan menurunkan berat tertagih menjadi ' + proposed.chargeable_kg +
      ' kg dan menghemat ' + formatRupiah(savings.per_shipment) + ' per kirim, ' +
      formatRupiah(savings.monthly) + ' per bulan.'
    );
  }

  const cheapest = divisors.reduce(
    (best, item) => (item.total_per_shipment < best.total_per_shipment ? item : best),
    divisors[0]
  );
  if (cheapest.divisor !== input.divisor && cheapest.total_per_shipment < base.total_per_shipment) {
    list.push(
      'Dengan pembagi ' + cheapest.divisor + ', biaya menjadi ' +
      formatRupiah(cheapest.total_per_shipment) + ' per kirim. Selisih ' +
      formatRupiah(base.total_per_shipment - cheapest.total_per_shipment) +
      '. Konfirmasi pembagi resmi kurir sebelum memilih.'
    );
  }

  if (base.volume_extra_monthly > 0) {
    list.push(
      'Kelebihan biaya karena volume mencapai ' + formatRupiah(base.volume_extra_monthly) +
      ' per bulan atau ' + formatRupiah(base.volume_extra_annual) + ' per tahun.'
    );
  }

  if (base.weight_charge <= input.minimum_charge) {
    list.push(
      'Tarif minimum ' + formatRupiah(input.minimum_charge) + ' berlaku, sehingga berat ' +
      'tertagih ' + base.chargeable_kg + ' kg belum menambah biaya.'
    );
  }

  list.push('Ukur paket setelah selesai dikemas, bukan ukuran produk sebelum dibungkus.');
  list.push('Ganti box besar dengan polymailer atau box pas untuk mengurangi ruang kosong.');
  list.push('Simpan foto dimensi dan bukti timbangan untuk sengketa tagihan kurir.');
  list.push(DISCLAIMER);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const base = evaluate(input);
  const divisors = compareDivisors(input);

  const proposed = input.proposed_dimensions
    ? evaluate(Object.assign({}, input, input.proposed_dimensions))
    : null;

  let savings = null;
  if (proposed) {
    const perShipment = base.total_per_shipment - proposed.total_per_shipment;
    savings = {
      per_shipment: round2(perShipment),
      monthly: round2(perShipment * input.shipments_per_month),
      annual: round2(perShipment * input.shipments_per_month * 12),
      chargeable_kg: round2(base.chargeable_kg - proposed.chargeable_kg),
    };
  }

  const verdict = buildVerdict(input, base, proposed, savings);
  const recommendations = buildRecommendations(input, base, proposed, savings, divisors);

  return {
    input,
    volume_cm3: base.volume_cm3,
    volumetric_kg: base.volumetric_kg,
    actual_weight_kg: base.actual_weight_kg,
    chargeable_kg: base.chargeable_kg,
    billed_by: base.billed_by,
    billed_by_label: base.billed_by === 'volume' ? 'Berat volume' : 'Berat aktual',
    density_kg_m3: base.density_kg_m3,
    volume_ratio_pct: base.volume_ratio_pct,
    breakdown: {
      weight_charge: base.weight_charge,
      admin_fee: base.admin_fee,
      packaging_cost: base.packaging_cost,
      total_per_shipment: base.total_per_shipment,
      monthly_total: base.monthly_total,
      annual_total: base.annual_total,
      cost_by_actual_weight: base.cost_by_actual_weight,
      volume_extra_per_shipment: base.volume_extra_per_shipment,
      volume_extra_monthly: base.volume_extra_monthly,
      volume_extra_annual: base.volume_extra_annual,
    },
    tier: {
      chargeable_kg: base.chargeable_kg,
      next_chargeable_kg: base.next_chargeable_kg,
      next_tier_extra: base.next_tier_extra,
      max_volume_for_tier_cm3: base.max_volume_for_tier_cm3,
      volume_headroom_cm3: base.volume_headroom_cm3,
    },
    divisors,
    proposed: proposed
      ? {
        dimensions: input.proposed_dimensions,
        volume_cm3: proposed.volume_cm3,
        volumetric_kg: proposed.volumetric_kg,
        chargeable_kg: proposed.chargeable_kg,
        billed_by: proposed.billed_by,
        total_per_shipment: proposed.total_per_shipment,
        volume_extra_per_shipment: proposed.volume_extra_per_shipment,
      }
      : null,
    savings,
    verdict,
    recommendations,
    assumptions: ASSUMPTIONS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
}

function compare(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawOptions = Array.isArray(source.options) ? source.options : [];
  if (!rawOptions.length) {
    throw new Error('Minimal satu opsi ukuran harus diisi.');
  }
  if (rawOptions.length > MAX_OPTIONS) {
    throw new Error('Maksimal ' + MAX_OPTIONS + ' opsi ukuran.');
  }
  const options = rawOptions;

  const baseInput = normalizeInput(source);
  validateInput(baseInput);
  const base = evaluate(baseInput);

  const rows = options.map((option, index) => {
    const candidate = normalizeInput(Object.assign({}, source, {
      length_cm: option && option.length_cm,
      width_cm: option && option.width_cm,
      height_cm: option && option.height_cm,
      proposed_dimensions: null,
    }));
    validateInput(candidate);
    const result = evaluate(candidate);
    const saving = base.total_per_shipment - result.total_per_shipment;
    return {
      label: cleanText(option && option.label, MAX_TEXT) || 'Opsi ' + (index + 1),
      length_cm: candidate.length_cm,
      width_cm: candidate.width_cm,
      height_cm: candidate.height_cm,
      volume_cm3: result.volume_cm3,
      volumetric_kg: result.volumetric_kg,
      chargeable_kg: result.chargeable_kg,
      billed_by: result.billed_by,
      total_per_shipment: result.total_per_shipment,
      savings_per_shipment: round2(saving),
      savings_monthly: round2(saving * baseInput.shipments_per_month),
    };
  });

  const cheapest = rows.reduce(
    (best, item) => (item.total_per_shipment < best.total_per_shipment ? item : best),
    rows[0]
  );

  return {
    base: {
      volume_cm3: base.volume_cm3,
      volumetric_kg: base.volumetric_kg,
      chargeable_kg: base.chargeable_kg,
      billed_by: base.billed_by,
      total_per_shipment: base.total_per_shipment,
    },
    options: rows,
    cheapest: {
      label: cheapest.label,
      total_per_shipment: cheapest.total_per_shipment,
      savings_per_shipment: cheapest.savings_per_shipment,
      savings_monthly: cheapest.savings_monthly,
    },
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
  const result = analyze(raw);
  const header = [
    'jenis',
    'label',
    'pembagi',
    'panjang_cm',
    'lebar_cm',
    'tinggi_cm',
    'berat_aktual_kg',
    'volume_cm3',
    'berat_volume_kg',
    'berat_tertagih_kg',
    'biaya_per_kirim',
    'biaya_bulanan',
    'kelebihan_biaya_volume',
  ];

  const lines = [header.join(',')];
  const input = result.input;

  lines.push([
    'utama',
    input.package_label || 'Paket utama',
    input.divisor,
    input.length_cm,
    input.width_cm,
    input.height_cm,
    result.actual_weight_kg,
    result.volume_cm3,
    result.volumetric_kg,
    result.chargeable_kg,
    result.breakdown.total_per_shipment,
    result.breakdown.monthly_total,
    result.breakdown.volume_extra_per_shipment,
  ].map(csvEscape).join(','));

  if (result.proposed && result.savings) {
    const dimensions = result.proposed.dimensions;
    lines.push([
      'usulan',
      'Ukuran usulan',
      input.divisor,
      dimensions.length_cm,
      dimensions.width_cm,
      dimensions.height_cm,
      result.actual_weight_kg,
      result.proposed.volume_cm3,
      result.proposed.volumetric_kg,
      result.proposed.chargeable_kg,
      result.proposed.total_per_shipment,
      result.savings.monthly,
      result.proposed.volume_extra_per_shipment,
    ].map(csvEscape).join(','));
  }

  result.divisors.forEach((item) => {
    lines.push([
      'pembanding',
      item.label,
      item.divisor,
      input.length_cm,
      input.width_cm,
      input.height_cm,
      result.actual_weight_kg,
      result.volume_cm3,
      item.volumetric_kg,
      item.chargeable_kg,
      item.total_per_shipment,
      '',
      item.volume_extra_per_shipment,
    ].map(csvEscape).join(','));
  });

  return lines.join('\n');
}

function example() {
  return {
    package_label: 'Kaos katun dewasa',
    length_cm: 30,
    width_cm: 25,
    height_cm: 10,
    actual_weight_kg: 0.6,
    divisor: 6000,
    rate_per_kg: 18000,
    minimum_charge: 9000,
    admin_fee: 1000,
    packaging_cost: 1200,
    rounding_step: 0.1,
    shipments_per_month: 400,
    proposed_dimensions: {
      length_cm: 28,
      width_cm: 22,
      height_cm: 6,
    },
  };
}

function meta() {
  return {
    divisors: DIVISORS,
    rounding_steps: ROUNDING_STEPS,
    limits: LIMITS,
    formula: 'Berat volume = panjang x lebar x tinggi / pembagi',
    assumptions: ASSUMPTIONS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
}

module.exports = {
  meta,
  example,
  analyze,
  compare,
  csvRows,
  normalizeInput,
  validateInput,
  evaluate,
  compareDivisors,
  buildVerdict,
  buildRecommendations,
  DIVISORS,
  ROUNDING_STEPS,
  LIMITS,
  ASSUMPTIONS,
  SCOPE_NOTE,
  DISCLAIMER,
};
