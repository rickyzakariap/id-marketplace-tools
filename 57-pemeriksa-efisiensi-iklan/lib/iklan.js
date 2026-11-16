'use strict';

const MAX_TEXT = 120;
const MAX_CAMPAIGNS = 50;
const MAX_MONEY = 1000000000000;

const DEFAULT_SETTINGS = {
  fee_pct: 8,
  packaging_per_order: 1500,
  min_ctr_pct: 1,
  min_cvr_pct: 2,
  thin_margin_pct: 10,
};

const SETTING_FIELDS = [
  {
    key: 'fee_pct',
    label: 'Biaya marketplace',
    min: 0,
    max: 50,
    step: 0.5,
    unit: '%',
    default_value: 8,
  },
  {
    key: 'packaging_per_order',
    label: 'Biaya kemas per pesanan',
    min: 0,
    max: 200000,
    step: 100,
    unit: 'Rp',
    default_value: 1500,
  },
  {
    key: 'min_ctr_pct',
    label: 'Patokan CTR minimum',
    min: 0,
    max: 100,
    step: 0.1,
    unit: '%',
    default_value: 1,
  },
  {
    key: 'min_cvr_pct',
    label: 'Patokan konversi minimum',
    min: 0,
    max: 100,
    step: 0.1,
    unit: '%',
    default_value: 2,
  },
  {
    key: 'thin_margin_pct',
    label: 'Batas laba iklan tipis',
    min: 0,
    max: 100,
    step: 0.5,
    unit: '%',
    default_value: 10,
  },
];

const CAMPAIGN_STATUSES = [
  {
    id: 'sehat',
    label: 'Sehat',
    level: 'ok',
    action:
      'Naikkan budget bertahap 20 sampai 30 persen, lalu pantau ROAS tetap ' +
      'di atas ROAS impas.',
  },
  {
    id: 'tipis',
    label: 'Laba tipis',
    level: 'signal',
    action:
      'Pertahankan budget sambil menekan CPA dan menaikkan nilai pesanan. ' +
      'Jangan tambah budget sebelum laba per pesanan membaik.',
  },
  {
    id: 'rugi',
    label: 'Merugi',
    level: 'ember',
    action:
      'Kurangi belanja atau matikan kampanye ini. Setiap rupiah di atas ' +
      'margin sebelum iklan menambah kerugian.',
  },
  {
    id: 'struktur_rugi',
    label: 'Margin negatif',
    level: 'ember',
    action:
      'Perbaiki harga, modal barang, biaya marketplace, atau biaya kemas ' +
      'sebelum menambah budget iklan.',
  },
];

const FUNNEL_STATES = [
  {
    id: 'sehat',
    label: 'Funnel sehat',
    note: 'CTR dan konversi di atas patokan. Masalah utama bukan di funnel.',
  },
  {
    id: 'materi',
    label: 'CTR lemah',
    note:
      'Tayangan cukup tetapi klik sedikit. Ganti foto, video, judul, atau ' +
      'penawaran utama.',
  },
  {
    id: 'halaman',
    label: 'Konversi lemah',
    note:
      'Klik masuk tetapi jarang menjadi pesanan. Periksa harga, ongkir, ' +
      'deskripsi, stok, dan ulasan.',
  },
  {
    id: 'audiens',
    label: 'CTR dan konversi lemah',
    note:
      'Tayangan, klik, dan pesanan sama-sama lemah. Persempit audiens atau ' +
      'ganti produk yang diiklankan.',
  },
  {
    id: 'tanpa_order',
    label: 'Belum ada pesanan',
    note:
      'Klik sudah ada tetapi belum ada pesanan. Pastikan link produk benar, ' +
      'stok tersedia, dan harga bersaing.',
  },
];

const FUNNEL_ACTIONS = {
  sehat: '',
  materi: 'Uji tiga materi iklan baru dengan penawaran yang berbeda.',
  halaman: 'Perbaiki halaman produk sebelum menambah budget iklan.',
  audiens: 'Ganti target audiens atau uji produk lain dengan margin lebih tebal.',
  tanpa_order: 'Hentikan sementara, cek halaman produk dan proses checkout.',
};

const ASSUMPTIONS = [
  'Biaya marketplace diisi sebagai persen dari pendapatan. Nilai awal 8 persen ' +
    'adalah asumsi, bukan tarif resmi platform.',
  'Biaya kemas Rp1.500 per pesanan adalah asumsi. Ganti dengan biaya aktual toko.',
  'Pendapatan iklan dianggap sudah bersih dari diskon, pembatalan, dan retur. ' +
    'Bila belum, masukkan angka bersih agar laba tidak terlihat lebih besar.',
  'Patokan CTR 1 persen dan konversi 2 persen adalah titik awal diagnosis funnel, ' +
    'bukan benchmark resmi marketplace.',
  'Laba setelah iklan belum memasukkan biaya tetap, gaji, pajak, dan biaya ' +
    'operasional lain di luar pesanan.',
  'Atribusi menganggap semua pesanan berasal dari iklan. Pesanan organik yang ' +
    'tercampur membuat ROAS terlihat lebih tinggi.',
  'Rencana penskalaan menganggap ROAS dan margin tetap saat budget naik. Itu ' +
    'skenario pembanding, bukan ramalan hasil.',
];

const FORMULAS = [
  'CTR = klik / tayangan x 100. CPC = belanja / klik.',
  'Konversi = pesanan / klik x 100. CPA = belanja / pesanan.',
  'ROAS = pendapatan / belanja. ACOS = belanja / pendapatan x 100.',
  'Margin sebelum iklan = pendapatan - modal barang - biaya marketplace - ' +
    'biaya kemas.',
  'ROAS impas = pendapatan / margin sebelum iklan.',
  'Laba setelah iklan = margin sebelum iklan - belanja iklan.',
  'Budget terbuang = selisih belanja di atas margin sebelum iklan.',
];

const SCOPE_NOTE =
  'Tool mengaudit efisiensi belanja iklan dari angka yang Anda masukkan. ' +
  'Tool tidak membaca akun iklan dan tidak memakai tarif resmi platform.';

const DISCLAIMER =
  'Hasil adalah estimasi dari input Anda. Cocokkan dengan laporan iklan, ' +
  'laporan pesanan, dan laporan pencairan sebelum mengambil keputusan budget.';

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
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

function safeRatio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function findCampaignStatus(id) {
  return CAMPAIGN_STATUSES.find((item) => item.id === id) || CAMPAIGN_STATUSES[0];
}

function findFunnelState(id) {
  return FUNNEL_STATES.find((item) => item.id === id) || FUNNEL_STATES[0];
}

function normalizeSettings(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    fee_pct: numOr(input.fee_pct, DEFAULT_SETTINGS.fee_pct),
    packaging_per_order: numOr(
      input.packaging_per_order,
      DEFAULT_SETTINGS.packaging_per_order
    ),
    min_ctr_pct: numOr(input.min_ctr_pct, DEFAULT_SETTINGS.min_ctr_pct),
    min_cvr_pct: numOr(input.min_cvr_pct, DEFAULT_SETTINGS.min_cvr_pct),
    thin_margin_pct: numOr(
      input.thin_margin_pct,
      DEFAULT_SETTINGS.thin_margin_pct
    ),
  };
}

function normalizeCampaign(raw, index) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    name: cleanText(input.name, MAX_TEXT),
    spend: numOr(input.spend, 0),
    impressions: numOr(input.impressions, 0),
    clicks: numOr(input.clicks, 0),
    orders: numOr(input.orders, 0),
    revenue: numOr(input.revenue, 0),
    unit_cost: numOr(input.unit_cost, 0),
    days: numOr(input.days, 30),
    row: index + 1,
  };
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const rawCampaigns = Array.isArray(input.campaigns)
    ? input.campaigns
    : Array.isArray(input.ads)
      ? input.ads
      : [];

  return {
    settings: normalizeSettings(input.settings),
    campaigns: rawCampaigns.map((item, index) => normalizeCampaign(item, index)),
  };
}

function validateSettings(settings) {
  SETTING_FIELDS.forEach((field) => {
    const value = settings[field.key];
    if (!Number.isFinite(value)) {
      throw new Error(field.label + ' harus berupa angka.');
    }
    if (value < field.min || value > field.max) {
      throw new Error(
        field.label + ' harus antara ' + field.min + ' dan ' + field.max + '.'
      );
    }
  });
}

function validateInput(input) {
  validateSettings(input.settings);

  if (!Array.isArray(input.campaigns) || input.campaigns.length === 0) {
    throw new Error('Isi minimal satu kampanye iklan untuk diaudit.');
  }
  if (input.campaigns.length > MAX_CAMPAIGNS) {
    throw new Error('Maksimal ' + MAX_CAMPAIGNS + ' kampanye dalam satu audit.');
  }

  input.campaigns.forEach((item, index) => {
    const position = 'Kampanye baris ' + (index + 1);
    if (!item.name) {
      throw new Error('Nama kampanye wajib diisi pada baris ' + (index + 1) + '.');
    }
    if (!Number.isFinite(item.spend) || item.spend <= 0) {
      throw new Error('Belanja iklan ' + position + ' harus lebih dari 0.');
    }
    if (item.spend > MAX_MONEY) {
      throw new Error('Belanja iklan ' + position + ' terlalu besar.');
    }
    if (!Number.isFinite(item.impressions) || item.impressions <= 0) {
      throw new Error('Tayangan ' + position + ' harus lebih dari 0.');
    }
    if (item.impressions > 1000000000) {
      throw new Error('Tayangan ' + position + ' terlalu besar.');
    }
    if (!Number.isFinite(item.clicks) || item.clicks <= 0) {
      throw new Error('Klik ' + position + ' harus lebih dari 0.');
    }
    if (item.clicks > 1000000000) {
      throw new Error('Klik ' + position + ' terlalu besar.');
    }
    if (item.clicks > item.impressions) {
      throw new Error('Klik tidak boleh lebih besar dari tayangan ' + position + '.');
    }
    if (!Number.isFinite(item.orders) || item.orders < 0) {
      throw new Error('Pesanan ' + position + ' harus angka 0 atau lebih.');
    }
    if (item.orders > 100000000) {
      throw new Error('Pesanan ' + position + ' terlalu besar.');
    }
    if (!Number.isInteger(item.orders)) {
      throw new Error('Pesanan ' + position + ' harus bilangan bulat.');
    }
    if (item.orders > item.clicks) {
      throw new Error('Pesanan tidak boleh lebih besar dari klik ' + position + '.');
    }
    if (!Number.isFinite(item.revenue) || item.revenue < 0) {
      throw new Error('Pendapatan ' + position + ' harus angka 0 atau lebih.');
    }
    if (item.revenue > MAX_MONEY) {
      throw new Error('Pendapatan ' + position + ' terlalu besar.');
    }
    if (item.orders > 0 && item.revenue <= 0) {
      throw new Error('Pendapatan ' + position + ' harus lebih dari 0 bila ada pesanan.');
    }
    if (item.orders === 0 && item.revenue !== 0) {
      throw new Error('Pendapatan harus 0 pada ' + position + ' bila belum ada pesanan.');
    }
    if (!Number.isFinite(item.unit_cost) || item.unit_cost < 0) {
      throw new Error('Modal per unit ' + position + ' harus angka 0 atau lebih.');
    }
    if (item.unit_cost > MAX_MONEY) {
      throw new Error('Modal per unit ' + position + ' terlalu besar.');
    }
    if (!Number.isFinite(item.days) || item.days < 1 || item.days > 90) {
      throw new Error('Durasi ' + position + ' harus antara 1 dan 90 hari.');
    }
    if (!Number.isInteger(item.days)) {
      throw new Error('Durasi ' + position + ' harus bilangan bulat.');
    }
  });
}

function classifyFunnel(metrics, settings) {
  if (metrics.orders <= 0) {
    return findFunnelState('tanpa_order');
  }

  const ctrOk = metrics.ctr_pct >= settings.min_ctr_pct;
  const cvrOk = metrics.cvr_pct >= settings.min_cvr_pct;

  if (ctrOk && cvrOk) return findFunnelState('sehat');
  if (!ctrOk && cvrOk) return findFunnelState('materi');
  if (ctrOk && !cvrOk) return findFunnelState('halaman');
  return findFunnelState('audiens');
}

function classifyCampaign(metrics, settings) {
  if (metrics.revenue > 0 && metrics.contribution <= 0) {
    return {
      id: 'struktur_rugi',
      label: 'Margin negatif',
      level: 'ember',
      note: 'Margin sebelum iklan sudah negatif, jadi iklan tidak mungkin menutup biaya.',
    };
  }
  if (metrics.profit_after_ads < 0) {
    return {
      id: 'rugi',
      label: 'Merugi',
      level: 'ember',
      note:
        'Belanja iklan melebihi margin sebelum iklan sebesar ' +
        formatRupiah(Math.abs(metrics.profit_after_ads)) +
        '.',
    };
  }
  if (
    metrics.margin_after_ads_pct < settings.thin_margin_pct ||
    (metrics.break_even_roas !== null &&
      metrics.roas < metrics.break_even_roas * 1.1)
  ) {
    return {
      id: 'tipis',
      label: 'Laba tipis',
      level: 'signal',
      note:
        'Laba setelah iklan hanya ' +
        formatRupiah(metrics.profit_after_ads) +
        ' atau ' +
        round2(metrics.margin_after_ads_pct) +
        ' persen dari pendapatan.',
    };
  }
  return {
    id: 'sehat',
    label: 'Sehat',
    level: 'ok',
    note:
      'Laba setelah iklan ' +
      formatRupiah(metrics.profit_after_ads) +
      ' dengan ROAS ' +
      round2(metrics.roas) +
      ' kali ROAS impas.',
  };
}

function buildCampaignAction(status, funnel, metrics, settings) {
  let action = status.action;

  if (status.id === 'sehat' && metrics.break_even_roas !== null) {
    action =
      'Naikkan budget bertahap 20 sampai 30 persen, lalu pantau ROAS tetap ' +
      'di atas ' +
      round2(metrics.break_even_roas) +
      ' kali.';
  }
  if (status.id === 'tipis' && metrics.break_even_cpa !== null) {
    action =
      'Pertahankan budget, tekan CPA di bawah ' +
      formatRupiah(metrics.break_even_cpa) +
      ' per pesanan, dan naikkan nilai pesanan.';
  }
  if (status.id === 'rugi' && metrics.break_even_cpa !== null) {
    action =
      'Kurangi belanja atau matikan kampanye ini. Batas CPA impas ' +
      formatRupiah(metrics.break_even_cpa) +
      ' per pesanan.';
  }

  const funnelAction = FUNNEL_ACTIONS[funnel.id];
  return [action, funnelAction].filter(Boolean).join(' ');
}

function calculateCampaign(item, settings) {
  const ctrPct = (item.clicks / item.impressions) * 100;
  const cpc = item.spend / item.clicks;
  const cvrPct = (item.orders / item.clicks) * 100;
  const cpa = safeRatio(item.spend, item.orders);
  const aov = safeRatio(item.revenue, item.orders);
  const cogs = item.orders * item.unit_cost;
  const fee = (item.revenue * settings.fee_pct) / 100;
  const packaging = item.orders * settings.packaging_per_order;
  const contribution = item.revenue - cogs - fee - packaging;
  const marginBeforeAdsPct = safeRatio(contribution * 100, item.revenue);
  const breakEvenRoas = contribution > 0 ? item.revenue / contribution : null;
  const roas = item.revenue / item.spend;
  const acosPct = safeRatio(item.spend * 100, item.revenue);
  const profit = contribution - item.spend;
  const marginAfterAdsPct = safeRatio(profit * 100, item.revenue);
  const wastedSpend = Math.max(0, item.spend - Math.max(0, contribution));
  const breakEvenCpa = contribution > 0 ? contribution / item.orders : null;
  const profitPerOrder = safeRatio(profit, item.orders);
  const dailySpend = item.spend / item.days;
  const dailyRevenue = item.revenue / item.days;
  const dailyOrders = item.orders / item.days;

  const metrics = {
    revenue: item.revenue,
    contribution: contribution,
    profit_after_ads: profit,
    margin_after_ads_pct: marginAfterAdsPct === null ? 0 : marginAfterAdsPct,
    roas: roas,
    break_even_roas: breakEvenRoas,
    ctr_pct: ctrPct,
    cvr_pct: cvrPct,
    orders: item.orders,
    break_even_cpa: breakEvenCpa,
    spend: item.spend,
  };

  const funnel = classifyFunnel(metrics, settings);
  const status = classifyCampaign(metrics, settings);

  return {
    row: item.row,
    name: item.name,
    days: item.days,
    spend: round2(item.spend),
    impressions: item.impressions,
    clicks: item.clicks,
    orders: item.orders,
    revenue: round2(item.revenue),
    unit_cost: round2(item.unit_cost),
    ctr_pct: round2(ctrPct),
    cpc: round2(cpc),
    cvr_pct: round2(cvrPct),
    cpa: cpa === null ? null : round2(cpa),
    aov: aov === null ? null : round2(aov),
    cogs: round2(cogs),
    fee: round2(fee),
    packaging: round2(packaging),
    contribution: round2(contribution),
    margin_before_ads_pct:
      marginBeforeAdsPct === null ? 0 : round2(marginBeforeAdsPct),
    break_even_roas: breakEvenRoas === null ? null : round2(breakEvenRoas),
    roas: round2(roas),
    acos_pct: acosPct === null ? null : round2(acosPct),
    profit_after_ads: round2(profit),
    margin_after_ads_pct:
      marginAfterAdsPct === null ? 0 : round2(marginAfterAdsPct),
    profit_per_order: profitPerOrder === null ? null : round2(profitPerOrder),
    wasted_spend: round2(wastedSpend),
    break_even_cpa: breakEvenCpa === null ? null : round2(breakEvenCpa),
    max_profitable_spend: round2(Math.max(0, contribution)),
    cut_needed: round2(Math.max(0, item.spend - Math.max(0, contribution))),
    scale_room: round2(Math.max(0, contribution - item.spend)),
    daily_spend: round2(dailySpend),
    daily_revenue: round2(dailyRevenue),
    daily_orders: round2(dailyOrders),
    status: status.id,
    status_label: status.label,
    status_level: status.level,
    status_note: status.note,
    funnel: funnel.id,
    funnel_label: funnel.label,
    funnel_note: funnel.note,
    action: buildCampaignAction(status, funnel, metrics, settings),
  };
}

function buildSummary(campaigns, settings) {
  const total = (key) => campaigns.reduce((sum, item) => sum + item[key], 0);
  const totalSpend = total('spend');
  const totalRevenue = total('revenue');
  const totalOrders = total('orders');
  const totalClicks = total('clicks');
  const totalImpressions = total('impressions');
  const totalContribution = total('contribution');
  const totalProfit = total('profit_after_ads');
  const totalWasted = total('wasted_spend');
  const totalDays = campaigns.reduce((sum, item) => sum + item.days, 0);
  const lossCount = campaigns.filter(
    (item) => item.status === 'rugi' || item.status === 'struktur_rugi'
  ).length;
  const thinCount = campaigns.filter((item) => item.status === 'tipis').length;
  const healthyCount = campaigns.filter((item) => item.status === 'sehat').length;

  const summary = {
    total_campaigns: campaigns.length,
    total_spend: round2(totalSpend),
    total_revenue: round2(totalRevenue),
    total_orders: totalOrders,
    total_clicks: totalClicks,
    total_impressions: totalImpressions,
    total_cogs: round2(total('cogs')),
    total_fee: round2(total('fee')),
    total_packaging: round2(total('packaging')),
    total_contribution: round2(totalContribution),
    total_profit: round2(totalProfit),
    total_wasted_spend: round2(totalWasted),
    roas: totalSpend > 0 ? round2(totalRevenue / totalSpend) : null,
    acos_pct: totalRevenue > 0 ? round2((totalSpend / totalRevenue) * 100) : null,
    ctr_pct:
      totalImpressions > 0
        ? round2((totalClicks / totalImpressions) * 100)
        : null,
    cvr_pct: totalClicks > 0 ? round2((totalOrders / totalClicks) * 100) : null,
    cpa: totalOrders > 0 ? round2(totalSpend / totalOrders) : null,
    break_even_roas:
      totalContribution > 0
        ? round2(totalRevenue / totalContribution)
        : null,
    margin_before_ads_pct:
      totalRevenue > 0 ? round2((totalContribution / totalRevenue) * 100) : null,
    margin_after_ads_pct:
      totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : null,
    profit_per_order:
      totalOrders > 0 ? round2(totalProfit / totalOrders) : null,
    average_daily_spend:
      campaigns.length > 0
        ? round2(
            campaigns.reduce((sum, item) => sum + item.daily_spend, 0) /
              campaigns.length
          )
        : 0,
    total_days: totalDays,
    loss_count: lossCount,
    thin_count: thinCount,
    healthy_count: healthyCount,
    status_counts: CAMPAIGN_STATUSES.map((status) => ({
      id: status.id,
      label: status.label,
      count: campaigns.filter((item) => item.status === status.id).length,
    })),
  };

  summary.verdict = buildVerdict(summary);
  return summary;
}

function buildVerdict(summary) {
  if (summary.total_contribution <= 0) {
    return {
      level: 'ember',
      label: 'Margin tidak menutup biaya non-iklan',
      note:
        'Setelah modal barang, biaya marketplace, dan biaya kemas, margin sudah ' +
        'habis ' +
        formatRupiah(Math.abs(summary.total_contribution)) +
        '. Iklan tidak bisa memperbaiki margin yang negatif.',
    };
  }

  if (summary.total_profit < 0) {
    return {
      level: 'ember',
      label: 'Iklan merugi',
      note:
        'Total belanja ' +
        formatRupiah(summary.total_spend) +
        ' melebihi margin sebelum iklan. Kerugian bersih ' +
        formatRupiah(Math.abs(summary.total_profit)) +
        '.',
    };
  }

  if (summary.loss_count > 0) {
    return {
      level: 'signal',
      label: 'Ada kampanye yang membakar budget',
      note:
        summary.loss_count +
        ' kampanye merugi dengan total budget terbuang ' +
        formatRupiah(summary.total_wasted_spend) +
        '. Laba kampanye lain masih menutup kerugian ini, tetapi budget perlu ' +
        'dipindahkan.',
    };
  }

  if (summary.thin_count > 0) {
    return {
      level: 'signal',
      label: 'Laba iklan tipis',
      note:
        summary.thin_count +
        ' kampanye hanya menghasilkan laba tipis. Perbaiki konversi atau ' +
        'turunkan CPA sebelum menambah budget.',
    };
  }

  if (summary.total_profit === 0) {
    return {
      level: 'signal',
      label: 'Iklan hanya balik modal',
      note: 'Laba setelah iklan nol. Setiap kenaikan CPA akan langsung menjadi kerugian.',
    };
  }

  return {
    level: 'ok',
    label: 'Iklan menghasilkan laba',
    note:
      'Laba setelah iklan ' +
      formatRupiah(summary.total_profit) +
      ' dengan ROAS ' +
      summary.roas +
      ' kali dan margin bersih ' +
      summary.margin_after_ads_pct +
      ' persen.',
  };
}

function buildRecommendations(campaigns, summary) {
  const list = [];
  const losers = campaigns
    .filter((item) => item.status === 'rugi' || item.status === 'struktur_rugi')
    .sort((a, b) => b.wasted_spend - a.wasted_spend);
  const thin = campaigns
    .filter((item) => item.status === 'tipis')
    .sort((a, b) => a.profit_after_ads - b.profit_after_ads);
  const winners = campaigns
    .filter((item) => item.status === 'sehat')
    .sort((a, b) => b.profit_after_ads - a.profit_after_ads);

  losers.slice(0, 3).forEach((item) => {
    list.push(
      item.name +
        ': belanja ' +
        formatRupiah(item.spend) +
        ', laba ' +
        formatRupiah(item.profit_after_ads) +
        ', budget terbuang ' +
        formatRupiah(item.wasted_spend) +
        '. ' +
        item.action
    );
  });

  thin.slice(0, 2).forEach((item) => {
    list.push(item.name + ': ' + item.status_note + ' ' + item.action);
  });

  winners.slice(0, 2).forEach((item) => {
    list.push(item.name + ': ' + item.action);
  });

  if (summary.total_wasted_spend > 0) {
    list.push(
      'Pindahkan budget dari kampanye merugi ke kampanye sehat. Total budget ' +
        'terbuang saat ini ' +
        formatRupiah(summary.total_wasted_spend) +
        '.'
    );
  }

  if (summary.break_even_roas !== null) {
    list.push(
      'ROAS impas gabungan ' +
        summary.break_even_roas +
        ' kali. ROAS di bawah angka itu berarti belanja iklan tidak tertutup ' +
        'margin, meskipun pesanan tetap masuk.'
    );
  }

  list.push(
    'Audit ulang setiap 7 hari. Data 30 hari lebih stabil daripada data 1 sampai ' +
      '3 hari.'
  );
  list.push(SCOPE_NOTE);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateInput(input);

  const campaigns = input.campaigns.map((item) =>
    calculateCampaign(item, input.settings)
  );
  const summary = buildSummary(campaigns, input.settings);

  return {
    input,
    settings: input.settings,
    campaigns,
    summary,
    verdict: summary.verdict,
    recommendations: buildRecommendations(campaigns, summary),
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
}

function normalizePlan(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const targetProfit = numOr(input.target_profit, 0);
  const scalePct = numOr(input.scale_pct, 20);

  if (!Number.isFinite(targetProfit) || targetProfit < 0) {
    throw new Error('Target laba harus angka 0 atau lebih.');
  }
  if (targetProfit > MAX_MONEY) {
    throw new Error('Target laba terlalu besar.');
  }
  if (!Number.isFinite(scalePct) || scalePct < 0 || scalePct > 100) {
    throw new Error('Penskalaan budget harus antara 0 dan 100 persen.');
  }

  return { target_profit: targetProfit, scale_pct: scalePct };
}

function plan(raw) {
  const result = analyze(raw);
  const options = normalizePlan(raw);
  const summary = result.summary;
  const totalContribution = summary.total_contribution;
  const maxSafeSpend = totalContribution - options.target_profit;
  const spendHeadroom = maxSafeSpend - summary.total_spend;
  const cutNeeded = Math.max(0, -spendHeadroom);
  const roomToGrow = Math.max(0, spendHeadroom);
  const requiredRoas =
    maxSafeSpend > 0 ? summary.total_revenue / maxSafeSpend : null;
  const requiredCpa =
    maxSafeSpend > 0 && summary.total_orders > 0
      ? maxSafeSpend / summary.total_orders
      : null;

  const scaleFactor = 1 + options.scale_pct / 100;
  const projectedSpend = summary.total_spend * scaleFactor;
  const projectedRevenue = summary.total_revenue * scaleFactor;
  const projectedContribution = totalContribution * scaleFactor;
  const projectedProfit = projectedContribution - projectedSpend;
  const incrementalProfit = projectedProfit - summary.total_profit;

  const items = result.campaigns.map((item) => ({
    name: item.name,
    status: item.status,
    status_label: item.status_label,
    current_spend: item.spend,
    break_even_spend: item.max_profitable_spend,
    cut_needed: item.cut_needed,
    scale_room: item.scale_room,
    break_even_cpa: item.break_even_cpa,
    profit_after_ads: item.profit_after_ads,
    action: item.action,
  }));

  let verdict;
  if (totalContribution <= 0) {
    verdict = {
      level: 'ember',
      label: 'Margin tidak cukup untuk iklan',
      note:
        'Margin sebelum iklan nol atau negatif. Menurunkan budget saja tidak ' +
        'cukup. Perbaiki harga atau biaya produk terlebih dahulu.',
    };
  } else if (options.target_profit > totalContribution) {
    verdict = {
      level: 'ember',
      label: 'Target laba melebihi margin',
      note:
        'Margin sebelum iklan hanya ' +
        formatRupiah(totalContribution) +
        ', lebih kecil dari target laba ' +
        formatRupiah(options.target_profit) +
        '. Target tidak bisa dicapai bahkan bila belanja iklan nol.',
    };
  } else if (summary.total_profit >= options.target_profit) {
    verdict = {
      level: 'ok',
      label: 'Target laba sudah tercapai',
      note:
        'Laba setelah iklan ' +
        formatRupiah(summary.total_profit) +
        ' sudah memenuhi target ' +
        formatRupiah(options.target_profit) +
        '. Budget masih bisa dijaga di ' +
        formatRupiah(maxSafeSpend) +
        ' untuk mempertahankan target.',
    };
  } else if (spendHeadroom >= 0) {
    verdict = {
      level: 'signal',
      label: 'Target bisa dikejar dengan ruang budget',
      note:
        'Masih ada ruang budget ' +
        formatRupiah(roomToGrow) +
        ' untuk mencapai target laba tanpa menurunkan belanja saat ini.',
    };
  } else {
    verdict = {
      level: 'ember',
      label: 'Budget iklan harus dipotong',
      note:
        'Untuk mencapai target laba ' +
        formatRupiah(options.target_profit) +
        ', belanja iklan perlu dipotong ' +
        formatRupiah(cutNeeded) +
        ' atau margin per pesanan dinaikkan.',
    };
  }

  return {
    target_profit: round2(options.target_profit),
    scale_pct: round2(options.scale_pct),
    current_profit: summary.total_profit,
    profit_gap: round2(options.target_profit - summary.total_profit),
    max_safe_spend: round2(maxSafeSpend),
    spend_headroom: round2(spendHeadroom),
    cut_needed: round2(cutNeeded),
    room_to_grow: round2(roomToGrow),
    required_roas: requiredRoas === null ? null : round2(requiredRoas),
    required_cpa: requiredCpa === null ? null : round2(requiredCpa),
    projected: {
      spend: round2(projectedSpend),
      revenue: round2(projectedRevenue),
      contribution: round2(projectedContribution),
      profit: round2(projectedProfit),
      incremental_profit: round2(incrementalProfit),
    },
    items,
    verdict,
    note:
      'Proyeksi penskalaan menganggap ROAS dan margin tetap. Gunakan sebagai ' +
      'pembanding, bukan jaminan hasil.',
  };
}

function csvEscape(value) {
  let text = value == null ? '' : String(value);
  const isPlainNumber = /^[+-]?\d+(\.\d+)?$/.test(text);
  if (!isPlainNumber && /^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(raw) {
  const result = analyze(raw);
  const header = [
    'baris',
    'nama_kampanye',
    'durasi_hari',
    'belanja_iklan',
    'tayangan',
    'klik',
    'pesanan',
    'pendapatan',
    'ctr_persen',
    'cpc',
    'konversi_persen',
    'cpa',
    'roas',
    'acos_persen',
    'margin_sebelum_iklan_persen',
    'roas_impas',
    'laba_setelah_iklan',
    'budget_terbuang',
    'status',
    'diagnosis_funnel',
    'rekomendasi',
  ];
  const lines = [header.join(',')];
  result.campaigns.forEach((item) => {
    lines.push(
      [
        item.row,
        item.name,
        item.days,
        item.spend,
        item.impressions,
        item.clicks,
        item.orders,
        item.revenue,
        item.ctr_pct,
        item.cpc,
        item.cvr_pct,
        item.cpa,
        item.roas,
        item.acos_pct,
        item.margin_before_ads_pct,
        item.break_even_roas,
        item.profit_after_ads,
        item.wasted_spend,
        item.status_label,
        item.funnel_label,
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
    campaigns: [
      {
        name: 'Kaos Polos Combed 30s',
        spend: 1200000,
        impressions: 150000,
        clicks: 3000,
        orders: 120,
        revenue: 18000000,
        unit_cost: 70000,
        days: 30,
      },
      {
        name: 'Tumbler Stainless 500 ml',
        spend: 2400000,
        impressions: 200000,
        clicks: 2000,
        orders: 40,
        revenue: 6000000,
        unit_cost: 90000,
        days: 30,
      },
      {
        name: 'Case HP Bening Universal',
        spend: 900000,
        impressions: 100000,
        clicks: 1500,
        orders: 30,
        revenue: 2400000,
        unit_cost: 40000,
        days: 30,
      },
    ],
  };
}

function meta() {
  return {
    default_settings: DEFAULT_SETTINGS,
    setting_fields: SETTING_FIELDS,
    statuses: CAMPAIGN_STATUSES,
    funnels: FUNNEL_STATES,
    assumptions: ASSUMPTIONS,
    formulas: FORMULAS,
    limits: { max_campaigns: MAX_CAMPAIGNS },
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
  plan,
  csvRows,
  normalizeInput,
  validateInput,
  normalizePlan,
  calculateCampaign,
  classifyCampaign,
  classifyFunnel,
  buildSummary,
  DEFAULT_SETTINGS,
  SETTING_FIELDS,
  CAMPAIGN_STATUSES,
  FUNNEL_STATES,
  ASSUMPTIONS,
  FORMULAS,
  SCOPE_NOTE,
  DISCLAIMER,
};
