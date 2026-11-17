'use strict';

const MAX_TEXT = 120;
const MAX_NOTE = 400;
const MAX_MONEY = 1000000000000;
const MAX_TENOR = 120;
const MAX_OFFERS = 8;

const DEFAULTS = {
  max_installment_pct: 30,
  late_fee_per_day_pct: 0.1,
  expensive_annual_pct: 60,
  very_expensive_annual_pct: 100,
};

const INTEREST_TYPES = [
  {
    id: 'flat',
    label: 'Bunga flat',
    note: 'Bunga dihitung dari plafon awal setiap bulan. Angsuran tetap.',
  },
  {
    id: 'efektif',
    label: 'Bunga efektif',
    note: 'Bunga dihitung dari sisa pokok. Angsuran tetap, porsi bunga menurun.',
  },
];

const ASSUMPTIONS = [
  'Bunga flat dihitung dari plafon awal setiap bulan. Bunga efektif dihitung dari ' +
    'sisa pokok pinjaman.',
  'Biaya admin, provisi, asuransi, dan biaya lain dipotong di awal, sehingga uang ' +
    'yang diterima lebih kecil dari plafon.',
  'Bunga efektif tahunan dihitung dari arus kas bulanan dengan metode IRR, lalu ' +
    'disetahunkan.',
  'Batas aman cicilan 30 persen laba kotor bulanan adalah patokan internal tool, ' +
    'bukan aturan marketplace atau pemberi pinjaman.',
  'Denda telat hanya skenario hitungan, bukan angka resmi pemberi pinjaman.',
  'Tool tidak mengakses akun pinjaman, tidak memakai data jaringan, dan tidak ' +
    'menawarkan pinjaman.',
];

const FORMULAS = [
  'Angsuran flat = (plafon + plafon x bunga bulanan x tenor) / tenor',
  'Angsuran efektif = plafon x bunga bulanan / (1 - (1 + bunga bulanan) ^ -tenor)',
  'Biaya total = total angsuran - uang diterima bersih',
  'Bunga efektif tahunan = (1 + IRR bulanan) ^ 12 - 1',
];

const LIMITS = {
  max_tenor_months: MAX_TENOR,
  max_offers: MAX_OFFERS,
  max_money: MAX_MONEY,
};

const SCOPE_NOTE =
  'Tool menghitung biaya pinjaman dan beban cicilan dari angka yang Anda masukkan. ' +
  'Tool tidak menilai kelayakan kredit, tidak menawarkan pinjaman, dan bukan nasihat keuangan.';

const DISCLAIMER =
  'Hasil ini estimasi aritmetika, bukan penawaran resmi. Cocokkan dengan tabel angsuran ' +
  'dan perjanjian tertulis pemberi pinjaman. Jangan membagikan OTP, password, atau ' +
  'kode verifikasi.';

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

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function formatPercent(value) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value) + '%';
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    lender: cleanText(input.lender, MAX_TEXT),
    product_name: cleanText(input.product_name, MAX_TEXT),
    principal: numOr(input.principal, 0),
    tenor_months: numOr(input.tenor_months, 0),
    interest_type: oneOf(input.interest_type, INTEREST_TYPES, 'flat'),
    interest_rate_pct: numOr(input.interest_rate_pct, 0),
    admin_fee_pct: numOr(input.admin_fee_pct, 0),
    admin_fee_amount: numOr(input.admin_fee_amount, 0),
    provision_pct: numOr(input.provision_pct, 0),
    insurance_pct: numOr(input.insurance_pct, 0),
    other_fee_amount: numOr(input.other_fee_amount, 0),
    monthly_gross_profit: numOr(input.monthly_gross_profit, 0),
    existing_installment: numOr(input.existing_installment, 0),
    max_installment_pct: numOr(input.max_installment_pct, DEFAULTS.max_installment_pct),
    late_days: numOr(input.late_days, 0),
    late_fee_per_day_pct: numOr(input.late_fee_per_day_pct, DEFAULTS.late_fee_per_day_pct),
    note: cleanText(input.note, MAX_NOTE),
  };
}

function calculateFees(input) {
  const admin = input.admin_fee_amount > 0
    ? input.admin_fee_amount
    : (input.principal * input.admin_fee_pct) / 100;
  const provision = (input.principal * input.provision_pct) / 100;
  const insurance = (input.principal * input.insurance_pct) / 100;
  const other = input.other_fee_amount;
  const total = admin + provision + insurance + other;
  return {
    admin: round2(admin),
    provision: round2(provision),
    insurance: round2(insurance),
    other: round2(other),
    total: round2(total),
  };
}

function validateInput(input) {
  if (!Number.isFinite(input.principal) || input.principal <= 0) {
    throw new Error('Plafon pinjaman harus berupa angka lebih dari 0.');
  }
  if (input.principal > MAX_MONEY) {
    throw new Error('Plafon pinjaman terlalu besar.');
  }
  if (!Number.isInteger(input.tenor_months) || input.tenor_months < 1) {
    throw new Error('Tenor harus bilangan bulat minimal 1 bulan.');
  }
  if (input.tenor_months > MAX_TENOR) {
    throw new Error('Tenor maksimal ' + MAX_TENOR + ' bulan.');
  }
  if (!Number.isFinite(input.interest_rate_pct) || input.interest_rate_pct < 0) {
    throw new Error('Bunga per bulan tidak boleh negatif.');
  }
  if (input.interest_rate_pct > 100) {
    throw new Error('Bunga per bulan maksimal 100 persen.');
  }

  const percentageFields = [
    ['admin_fee_pct', 'Biaya admin persen'],
    ['provision_pct', 'Provisi persen'],
    ['insurance_pct', 'Asuransi persen'],
  ];
  percentageFields.forEach((entry) => {
    const value = input[entry[0]];
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(entry[1] + ' harus antara 0 dan 100 persen.');
    }
  });

  const moneyFields = [
    ['admin_fee_amount', 'Biaya admin nominal'],
    ['other_fee_amount', 'Biaya lain'],
    ['monthly_gross_profit', 'Laba kotor bulanan'],
    ['existing_installment', 'Cicilan lain per bulan'],
  ];
  moneyFields.forEach((entry) => {
    const value = input[entry[0]];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(entry[1] + ' harus berupa angka 0 atau lebih.');
    }
  });

  if (!Number.isFinite(input.max_installment_pct) ||
      input.max_installment_pct < 1 || input.max_installment_pct > 100) {
    throw new Error('Batas aman cicilan harus antara 1 dan 100 persen.');
  }
  if (!Number.isInteger(input.late_days) || input.late_days < 0 || input.late_days > 365) {
    throw new Error('Hari telat harus bilangan bulat antara 0 dan 365.');
  }
  if (!Number.isFinite(input.late_fee_per_day_pct) ||
      input.late_fee_per_day_pct < 0 || input.late_fee_per_day_pct > 10) {
    throw new Error('Denda telat per hari harus antara 0 dan 10 persen.');
  }

  const fees = calculateFees(input);
  if (fees.total >= input.principal) {
    throw new Error('Total biaya awal harus lebih kecil dari plafon pinjaman.');
  }
}

function calculateInstallment(principal, monthlyRate, tenor, type) {
  if (type === 'efektif') {
    if (monthlyRate === 0) return principal / tenor;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenor));
  }
  return (principal + principal * monthlyRate * tenor) / tenor;
}

function monthlyIrr(netDisbursed, installment, tenor) {
  if (netDisbursed <= 0) {
    throw new Error('Uang diterima bersih harus lebih dari 0.');
  }
  if (installment * tenor <= netDisbursed + 0.005) return 0;

  function netPresentValue(rate) {
    let value = netDisbursed;
    for (let month = 1; month <= tenor; month += 1) {
      value -= installment / Math.pow(1 + rate, month);
    }
    return value;
  }

  if (netPresentValue(0) >= 0) return 0;
  let low = 0;
  let high = 10;
  for (let step = 0; step < 200; step += 1) {
    const middle = (low + high) / 2;
    if (netPresentValue(middle) > 0) high = middle;
    else low = middle;
  }
  return (low + high) / 2;
}

function calculateLoan(input) {
  const monthlyRate = input.interest_rate_pct / 100;
  const fees = calculateFees(input);
  const monthlyInstallment = calculateInstallment(
    input.principal,
    monthlyRate,
    input.tenor_months,
    input.interest_type
  );
  const totalInstallment = monthlyInstallment * input.tenor_months;
  const totalInterest = totalInstallment - input.principal;
  const netDisbursed = input.principal - fees.total;
  const totalCost = totalInstallment - netDisbursed;
  const irrMonthly = monthlyIrr(netDisbursed, monthlyInstallment, input.tenor_months);
  const effectiveMonthlyPct = irrMonthly * 100;
  const effectiveAnnualPct = (Math.pow(1 + irrMonthly, 12) - 1) * 100;
  const nominalAnnualPct = input.interest_rate_pct * 12;
  const lateFee = monthlyInstallment * (input.late_fee_per_day_pct / 100) * input.late_days;
  const totalWithLate = totalCost + lateFee;

  return {
    principal: round2(input.principal),
    tenor_months: input.tenor_months,
    interest_type: input.interest_type,
    interest_type_label: findById(INTEREST_TYPES, input.interest_type).label,
    monthly_rate_pct: round2(input.interest_rate_pct),
    monthly_installment: round2(monthlyInstallment),
    total_installment: round2(totalInstallment),
    total_interest: round2(totalInterest),
    upfront_fees: fees,
    net_disbursed: round2(netDisbursed),
    total_cost: round2(totalCost),
    cost_ratio_pct: round2((totalCost / netDisbursed) * 100),
    cost_ratio_principal_pct: round2((totalCost / input.principal) * 100),
    effective_monthly_pct: round2(effectiveMonthlyPct),
    effective_annual_pct: round2(effectiveAnnualPct),
    nominal_annual_pct: round2(nominalAnnualPct),
    rate_gap_points: round2(effectiveAnnualPct - nominalAnnualPct),
    flat_equivalent_monthly_pct: round2(
      (totalCost / netDisbursed / input.tenor_months) * 100
    ),
    late_days: input.late_days,
    late_fee_per_day_pct: input.late_fee_per_day_pct,
    late_fee: round2(lateFee),
    total_cost_with_late: round2(totalWithLate),
    cost_ratio_with_late_pct: round2((totalWithLate / netDisbursed) * 100),
  };
}

function assessAffordability(input, loan) {
  const totalInstallment = loan.monthly_installment + input.existing_installment;
  const safeLimit = (input.monthly_gross_profit * input.max_installment_pct) / 100;
  const maxSafeInstallment = Math.max(0, safeLimit - input.existing_installment);
  const profit = input.monthly_gross_profit;
  const netAfterDebt = profit - totalInstallment;
  const installmentRatio = profit > 0 ? (loan.monthly_installment / profit) * 100 : null;
  const totalRatio = profit > 0 ? (totalInstallment / profit) * 100 : null;
  const coverage = totalInstallment > 0 ? profit / totalInstallment : null;
  const excess = Math.max(0, totalInstallment - safeLimit);
  const headroom = Math.max(0, safeLimit - totalInstallment);

  return {
    monthly_gross_profit: round2(profit),
    monthly_installment: round2(loan.monthly_installment),
    existing_installment: round2(input.existing_installment),
    total_installment: round2(totalInstallment),
    max_installment_pct: round2(input.max_installment_pct),
    safe_installment_limit: round2(safeLimit),
    max_safe_installment: round2(maxSafeInstallment),
    installment_ratio_pct: installmentRatio === null ? null : round2(installmentRatio),
    total_debt_ratio_pct: totalRatio === null ? null : round2(totalRatio),
    net_monthly_after_debt: round2(netAfterDebt),
    annual_net_after_debt: round2(netAfterDebt * 12),
    coverage_ratio: coverage === null ? null : round2(coverage),
    excess: round2(excess),
    headroom: round2(headroom),
  };
}

function calculateMaxSafePrincipal(input, affordability) {
  const monthlyRate = input.interest_rate_pct / 100;
  const installment = affordability.max_safe_installment;
  let principal = 0;

  if (installment > 0) {
    if (input.interest_type === 'efektif') {
      principal = monthlyRate > 0
        ? (installment * (1 - Math.pow(1 + monthlyRate, -input.tenor_months))) / monthlyRate
        : installment * input.tenor_months;
    } else {
      principal = (installment * input.tenor_months) /
        (1 + monthlyRate * input.tenor_months);
    }
  }

  return {
    max_safe_principal: round2(Math.max(0, principal)),
    max_safe_installment: round2(installment),
    note: 'Plafon aman dihitung dari cicilan yang muat di batas persen laba. ' +
      'Biaya awal dan denda belum diperhitungkan dalam batas ini.',
  };
}

function buildVerdict(input, loan, affordability) {
  if (affordability.total_debt_ratio_pct === null) {
    return {
      level: 'ember',
      label: 'Laba bulanan belum diisi',
      note: 'Isi laba kotor bulanan yang dihasilkan modal ini agar beban cicilan bisa dinilai.',
    };
  }

  if (affordability.net_monthly_after_debt < 0) {
    return {
      level: 'ember',
      label: 'Cicilan melebihi laba bulanan',
      note: 'Total cicilan ' + formatRupiah(affordability.total_installment) +
        ' lebih besar dari laba kotor ' + formatRupiah(affordability.monthly_gross_profit) +
        '. Turunkan plafon, perpanjang tenor, atau batalkan pinjaman.',
    };
  }

  if (affordability.total_debt_ratio_pct > 50) {
    return {
      level: 'ember',
      label: 'Beban cicilan terlalu berat',
      note: 'Cicilan memakai ' + formatPercent(affordability.total_debt_ratio_pct) +
        ' dari laba kotor. Sisakan ruang untuk biaya lain dan penurunan penjualan.',
    };
  }

  if (affordability.total_debt_ratio_pct > input.max_installment_pct) {
    return {
      level: 'signal',
      label: 'Cicilan menipiskan laba',
      note: 'Cicilan memakai ' + formatPercent(affordability.total_debt_ratio_pct) +
        ' dari laba kotor, di atas batas aman ' +
        formatPercent(input.max_installment_pct) + '.',
    };
  }

  if (loan.effective_annual_pct >= DEFAULTS.very_expensive_annual_pct) {
    return {
      level: 'ember',
      label: 'Biaya pinjaman sangat tinggi',
      note: 'Bunga efektif tahunan ' + formatPercent(loan.effective_annual_pct) +
        '. Bandingkan dengan penawaran lain sebelum mengambil pinjaman.',
    };
  }

  if (loan.effective_annual_pct >= DEFAULTS.expensive_annual_pct) {
    return {
      level: 'signal',
      label: 'Bunga efektif tinggi',
      note: 'Cicilan muat, tetapi bunga efektif tahunan ' +
        formatPercent(loan.effective_annual_pct) +
        ' tergolong mahal. Minta rincian biaya dan tabel angsuran tertulis.',
    };
  }

  return {
    level: 'ok',
    label: 'Cicilan masih terkendali',
    note: 'Cicilan memakai ' + formatPercent(affordability.total_debt_ratio_pct) +
      ' dari laba kotor dan masih di bawah batas aman ' +
      formatPercent(input.max_installment_pct) + '.',
  };
}

function buildSchedule(input, loan) {
  const monthlyRate = input.interest_rate_pct / 100;
  const rows = [];
  let opening = input.principal;

  for (let month = 1; month <= input.tenor_months; month += 1) {
    let interest;
    let principalPart;

    if (input.interest_type === 'efektif') {
      interest = opening * monthlyRate;
      principalPart = month === input.tenor_months
        ? opening
        : loan.monthly_installment - interest;
    } else {
      interest = input.principal * monthlyRate;
      principalPart = month === input.tenor_months
        ? opening
        : input.principal / input.tenor_months;
    }

    principalPart = Math.min(Math.max(0, principalPart), opening);
    const closing = Math.max(0, opening - principalPart);
    rows.push({
      month,
      opening: round2(opening),
      principal: round2(principalPart),
      interest: round2(interest),
      installment: round2(principalPart + interest),
      closing: round2(closing),
    });
    opening = closing;
  }

  const totals = rows.reduce((acc, row) => {
    acc.principal += row.principal;
    acc.interest += row.interest;
    acc.installment += row.installment;
    return acc;
  }, { principal: 0, interest: 0, installment: 0 });

  return {
    rows,
    totals: {
      principal: round2(totals.principal),
      interest: round2(totals.interest),
      installment: round2(totals.installment),
    },
  };
}

function buildRecommendations(input, loan, affordability, verdict, maxSafe) {
  const list = [];

  if (affordability.total_debt_ratio_pct !== null &&
      affordability.total_debt_ratio_pct > input.max_installment_pct) {
    list.push(
      'Turunkan plafon ke sekitar ' + formatRupiah(maxSafe.max_safe_principal) +
      ' atau kurangi cicilan lain agar total cicilan masuk batas ' +
      formatPercent(input.max_installment_pct) + ' dari laba kotor.'
    );
  }
  if (affordability.existing_installment > 0) {
    list.push(
      'Cicilan lain ' + formatRupiah(affordability.existing_installment) +
      ' per bulan ikut dihitung. Gabungkan semua utang sebelum menambah pinjaman baru.'
    );
  }
  if (loan.upfront_fees.total > 0) {
    list.push(
      'Biaya awal ' + formatRupiah(loan.upfront_fees.total) +
      ' dipotong di depan. Pastikan uang yang benar-benar diterima ' +
      formatRupiah(loan.net_disbursed) + ', bukan plafon.'
    );
  }
  if (loan.rate_gap_points > 0) {
    list.push(
      'Bunga efektif tahunan ' + formatPercent(loan.effective_annual_pct) +
      ' lebih tinggi ' + formatPercent(loan.rate_gap_points) +
      ' poin dari hitungan nominal ' + formatPercent(loan.nominal_annual_pct) +
      ' per tahun. Minta tabel angsuran dan rincian bunga tertulis.'
    );
  }
  if (input.late_days > 0) {
    list.push(
      'Skenario telat ' + input.late_days + ' hari menambah denda ' +
      formatRupiah(loan.late_fee) + '. Siapkan dana cadangan satu kali angsuran.'
    );
  }
  if (loan.effective_annual_pct >= DEFAULTS.expensive_annual_pct) {
    list.push(
      'Bandingkan minimal dua penawaran memakai bunga efektif tahunan, bukan hanya ' +
      'angka bunga per bulan.'
    );
  }
  list.push(
    'Hitung ulang dengan laba kotor yang paling pesimistis. Bila penjualan turun, ' +
    'cicilan tetap harus dibayar.'
  );
  list.push(
    'Simpan tabel angsuran, perjanjian, bukti potong biaya, dan mutasi rekening. ' +
    'Cocokkan setiap potongan dengan perjanjian.'
  );
  list.push('Siapkan dana cadangan minimal satu bulan angsuran sebelum dana dipakai untuk stok.');
  list.push(DISCLAIMER);

  if (verdict.level === 'ok') {
    list.push(
      'Setelah pinjaman cair, pantau rasio cicilan setiap bulan. Bila laba turun di bawah ' +
      formatRupiah(affordability.total_installment / (input.max_installment_pct / 100)) +
      ', beban cicilan sudah melewati batas aman.'
    );
  }

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const loan = calculateLoan(input);
  const affordability = assessAffordability(input, loan);
  const maxSafe = calculateMaxSafePrincipal(input, affordability);
  const verdict = buildVerdict(input, loan, affordability);
  const schedule = buildSchedule(input, loan);
  const recommendations = buildRecommendations(input, loan, affordability, verdict, maxSafe);

  return {
    input,
    interest_type_label: findById(INTEREST_TYPES, input.interest_type).label,
    loan,
    affordability,
    max_safe: maxSafe,
    verdict,
    schedule,
    recommendations,
    rules: {
      assumptions: ASSUMPTIONS,
      formulas: FORMULAS,
      limits: LIMITS,
      thresholds: {
        expensive_annual_pct: DEFAULTS.expensive_annual_pct,
        very_expensive_annual_pct: DEFAULTS.very_expensive_annual_pct,
      },
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

function pickValue(offer, key, fallback) {
  return Object.prototype.hasOwnProperty.call(offer, key) ? offer[key] : fallback;
}

function compare(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const offers = Array.isArray(source.offers) ? source.offers : [];

  if (offers.length < 2) {
    throw new Error('Isi minimal dua penawaran untuk dibandingkan.');
  }
  if (offers.length > MAX_OFFERS) {
    throw new Error('Maksimal ' + MAX_OFFERS + ' penawaran sekali banding.');
  }

  const fallbackProfit = numOr(source.monthly_gross_profit, 0);
  const fallbackExisting = numOr(source.existing_installment, 0);
  const fallbackMaxPct = numOr(source.max_installment_pct, DEFAULTS.max_installment_pct);

  const rows = offers.map((offer, index) => {
    const item = offer && typeof offer === 'object' ? offer : {};
    const merged = Object.assign({}, item, {
      monthly_gross_profit: pickValue(item, 'monthly_gross_profit', fallbackProfit),
      existing_installment: pickValue(item, 'existing_installment', fallbackExisting),
      max_installment_pct: pickValue(item, 'max_installment_pct', fallbackMaxPct),
    });
    const result = analyze(merged);
    const label = result.input.lender || result.input.product_name ||
      ('Penawaran ' + (index + 1));

    return {
      label,
      principal: result.loan.principal,
      tenor_months: result.loan.tenor_months,
      interest_type_label: result.loan.interest_type_label,
      monthly_installment: result.loan.monthly_installment,
      total_cost: result.loan.total_cost,
      effective_annual_pct: result.loan.effective_annual_pct,
      nominal_annual_pct: result.loan.nominal_annual_pct,
      cost_ratio_pct: result.loan.cost_ratio_pct,
      total_debt_ratio_pct: result.affordability.total_debt_ratio_pct,
      verdict: result.verdict,
    };
  });

  const ranked = rows.slice().sort((left, right) => {
    if (left.effective_annual_pct !== right.effective_annual_pct) {
      return left.effective_annual_pct - right.effective_annual_pct;
    }
    return left.total_cost - right.total_cost;
  });

  return {
    offers: rows,
    ranked_labels: ranked.map((item) => item.label),
    best_label: ranked[0].label,
    best_effective_annual_pct: ranked[0].effective_annual_pct,
    note: 'Peringkat memakai bunga efektif tahunan terendah, lalu biaya total terendah. ' +
      'Plafon dan tenor yang berbeda tetap perlu dicocokkan dengan kebutuhan modal.',
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
  const label = result.input.lender || result.input.product_name || 'Pinjaman';
  const summary = [
    ['ringkasan', 'nilai'],
    ['pemberi_pinjaman', label],
    ['plafon', result.loan.principal],
    ['tenor_bulan', result.loan.tenor_months],
    ['jenis_bunga', result.loan.interest_type_label],
    ['angsuran_per_bulan', result.loan.monthly_installment],
    ['uang_diterima_bersih', result.loan.net_disbursed],
    ['total_biaya', result.loan.total_cost],
    ['bunga_efektif_tahunan_pct', result.loan.effective_annual_pct],
    ['rasio_cicilan_pct', result.affordability.total_debt_ratio_pct],
    ['verdict', result.verdict.label],
  ];
  const schedule = [['bulan', 'saldo_awal', 'pokok', 'bunga', 'angsuran', 'sisa']];
  result.schedule.rows.forEach((row) => {
    schedule.push([
      row.month,
      row.opening,
      row.principal,
      row.interest,
      row.installment,
      row.closing,
    ]);
  });

  const lines = [];
  summary.forEach((row) => lines.push(row.map(csvEscape).join(',')));
  lines.push('');
  schedule.forEach((row) => lines.push(row.map(csvEscape).join(',')));
  return lines.join('\n');
}

function example() {
  return {
    lender: 'Pinjaman modal toko',
    product_name: 'Restock 200 pcs',
    principal: 20000000,
    tenor_months: 12,
    interest_type: 'flat',
    interest_rate_pct: 1.5,
    admin_fee_pct: 1,
    admin_fee_amount: 0,
    provision_pct: 0,
    insurance_pct: 0.5,
    other_fee_amount: 0,
    monthly_gross_profit: 6000000,
    existing_installment: 500000,
    max_installment_pct: 30,
    late_days: 0,
    late_fee_per_day_pct: 0.1,
    note: 'Contoh angka ilustrasi, bukan penawaran resmi.',
  };
}

function meta() {
  return {
    interest_types: INTEREST_TYPES,
    defaults: DEFAULTS,
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    limits: LIMITS,
    rules: {
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

module.exports = {
  analyze,
  compare,
  csvRows,
  example,
  meta,
  normalizeInput,
  validateInput,
  calculateFees,
  calculateLoan,
  assessAffordability,
  calculateMaxSafePrincipal,
  buildSchedule,
  monthlyIrr,
  INTEREST_TYPES,
  DEFAULTS,
  ASSUMPTIONS,
  FORMULAS,
  LIMITS,
  SCOPE_NOTE,
  DISCLAIMER,
};
