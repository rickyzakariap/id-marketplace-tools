'use strict';

const MAX_NOTE = 400;
const MAX_TEXT = 160;
const TOLERANCE_PP = 1;
const WATCH_PP = 2;
const DEFAULT_PERIODS = 12;
const BENCHMARK_PERIOD = 'Kuartal II 2026';
const BENCHMARK_SEGMENT = 'Non-Mall';

const PLATFORMS = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tiktok', label: 'TikTok Shop' },
  { id: 'lazada', label: 'Lazada' },
];

const CATEGORIES = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'fmcg', label: 'FMCG' },
  { id: 'elektronik', label: 'Elektronik' },
];

const BENCHMARKS = {
  fashion: { shopee: 17.43, tiktok: 14.43, lazada: 9.13 },
  fmcg: { shopee: 18.55, tiktok: 14.68, lazada: 8.25 },
  elektronik: { shopee: 17.93, tiktok: 13.3, lazada: 7.63 },
};

const STORE_TYPES = [
  { id: 'non_mall', label: 'Non-Mall' },
  { id: 'mall', label: 'Mall' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'analisis', label: 'Sudah dianalisis', open: true },
  { id: 'minta_rincian', label: 'Minta rincian', open: true },
  { id: 'menunggu', label: 'Menunggu jawaban', open: true },
  { id: 'eskalasi', label: 'Eskalasi', open: true },
  { id: 'sesuai', label: 'Sesuai benchmark', open: false },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
];

const LETTER_TYPES = [
  { id: 'rincian', label: 'Surat permintaan rincian biaya' },
  { id: 'keberatan', label: 'Surat keberatan selisih take rate' },
  { id: 'eskalasi', label: 'Surat eskalasi' },
];

const SCOPE_ITEMS = [
  { id: 'komisi', label: 'Komisi platform', included: true },
  { id: 'transaksi', label: 'Biaya transaksi atau pembayaran', included: true },
  { id: 'program', label: 'Biaya program gratis ongkir atau cashback', included: false },
  { id: 'iklan', label: 'Biaya iklan', included: false },
  { id: 'logistik', label: 'Biaya logistik', included: false },
  { id: 'pajak', label: 'Pajak', included: false },
  { id: 'tetap', label: 'Biaya tetap', included: false },
];

const EVIDENCE = [
  {
    id: 'settlement_report',
    label: 'Laporan settlement atau pencairan periode',
    group: 'Keuangan',
    critical: true,
  },
  {
    id: 'fee_detail',
    label: 'Rincian komisi platform',
    group: 'Keuangan',
    critical: true,
  },
  {
    id: 'transaction_detail',
    label: 'Rincian biaya transaksi atau pembayaran',
    group: 'Keuangan',
    critical: true,
  },
  {
    id: 'gross_sales_report',
    label: 'Laporan omzet kotor periode',
    group: 'Keuangan',
    critical: true,
  },
  {
    id: 'category_proof',
    label: 'Bukti kategori produk di listing',
    group: 'Toko',
    critical: false,
  },
  {
    id: 'store_type_proof',
    label: 'Bukti status toko Mall atau non-Mall',
    group: 'Toko',
    critical: false,
  },
  {
    id: 'fee_announcement',
    label: 'Pengumuman tarif biaya dari platform',
    group: 'Aturan',
    critical: false,
  },
  {
    id: 'program_fee_detail',
    label: 'Rincian biaya program gratis ongkir atau cashback',
    group: 'Biaya lain',
    critical: false,
  },
  {
    id: 'ads_invoice',
    label: 'Rincian biaya iklan',
    group: 'Biaya lain',
    critical: false,
  },
  {
    id: 'tax_invoice',
    label: 'Dokumen pajak atau invoice marketplace',
    group: 'Pajak',
    critical: false,
  },
  {
    id: 'fee_page_screenshot',
    label: 'Tangkapan layar halaman biaya di Seller Center',
    group: 'Aturan',
    critical: false,
  },
];

const INDICATORS = [
  {
    id: 'above_slight',
    label: 'Take rate sedikit di atas benchmark',
    weight: 10,
  },
  {
    id: 'above_watch',
    label: 'Take rate di atas benchmark lebih dari 2 poin',
    weight: 15,
  },
  {
    id: 'above_high',
    label: 'Take rate di atas benchmark lebih dari 5 poin',
    weight: 20,
  },
  {
    id: 'below_slight',
    label: 'Take rate sedikit di bawah benchmark',
    weight: 6,
  },
  {
    id: 'below_watch',
    label: 'Take rate di bawah benchmark lebih dari 2 poin',
    weight: 10,
  },
  {
    id: 'zero_commission',
    label: 'Komisi platform diisi nol',
    weight: 12,
  },
  {
    id: 'zero_transaction',
    label: 'Biaya transaksi diisi nol',
    weight: 12,
  },
  {
    id: 'scope_unconfirmed',
    label: 'Cakupan biaya belum dikonfirmasi',
    weight: 12,
  },
  {
    id: 'mall_store',
    label: 'Toko berstatus Mall, benchmark sumber adalah non-Mall',
    weight: 8,
  },
  {
    id: 'category_unsure',
    label: 'Kategori produk belum dipastikan',
    weight: 8,
  },
  {
    id: 'program_high',
    label: 'Biaya program gratis ongkir atau cashback di atas 3 persen omzet',
    weight: 6,
  },
  {
    id: 'ads_high',
    label: 'Biaya iklan di atas 5 persen omzet',
    weight: 6,
  },
  {
    id: 'all_in_high',
    label: 'Total potongan all-in di atas 30 persen omzet',
    weight: 6,
  },
  {
    id: 'benchmark_override',
    label: 'Benchmark diubah dari nilai sumber',
    weight: 4,
  },
];

const SOURCES = [
  {
    title: 'Perbandingan Biaya Penjual Fashion di Shopee, TikTok Shop, dan Lazada Kuartal II 2026',
    publisher: 'Databoks Katadata',
    date: '2026-11-06',
    url: 'https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed6dccea4cf/perbandingan-biaya-penjual-fashion-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026',
    facts: 'Data Cube, Shopee Take-Rate Tracker edisi Agustus 2026. Penjual fashion non-Mall Indonesia kuartal II 2026: Shopee 17,43 persen, TikTok Shop 14,43 persen, Lazada 9,13 persen. Take rate mencakup komisi dan biaya transaksi.',
  },
  {
    title: 'Perbandingan Biaya Penjual FMCG di Shopee, TikTok Shop, dan Lazada Kuartal II 2026',
    publisher: 'Databoks Katadata',
    date: '2026-11-06',
    url: 'https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed674a94db7/perbandingan-biaya-penjual-fmcg-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026',
    facts: 'Penjual FMCG non-Mall Indonesia kuartal II 2026: Shopee 18,55 persen, TikTok Shop 14,68 persen, Lazada 8,25 persen.',
  },
  {
    title: 'Perbandingan Biaya Penjual Elektronik di Shopee, TikTok Shop, dan Lazada Kuartal II 2026',
    publisher: 'Databoks Katadata',
    date: '2026-11-06',
    url: 'https://databoks.katadata.co.id/teknologi-telekomunikasi/statistik/6aed717b759d9/perbandingan-biaya-penjual-elektronik-di-shopee-tiktok-shop-dan-lazada-kuartal-ii-2026',
    facts: 'Penjual elektronik non-Mall Indonesia kuartal II 2026: Shopee 17,93 persen, TikTok Shop 13,3 persen, Lazada 7,63 persen.',
  },
  {
    title: 'Beban Marketplace Tinggi, Mungkinkah Transaksi Beralih ke Luar Platform?',
    publisher: 'Kompas.id',
    date: '2026-04-18',
    url: 'https://www.kompas.id/artikel/komisi-dan-biaya-marketplace-makin-tinggi-mungkinkah-transaksi-beralih-ke-luar-platform',
    facts: 'Konteks lebih tua. Laporan Momentum Works 2026 menyebut take rate marketplace di Asia Tenggara terus meningkat dan beberapa penjual melaporkan beban di atas 30 persen setelah semua komponen dihitung.',
  },
];

const SCOPE_NOTE =
  'Benchmark mencakup komisi platform dan biaya transaksi. Benchmark tidak termasuk biaya program gratis ongkir atau cashback, iklan, logistik, pajak, dan biaya tetap.';

const FIELD_LABELS = {
  commission_fee: 'Komisi platform',
  transaction_fee: 'Biaya transaksi',
  program_fee: 'Biaya program gratis ongkir atau cashback',
  ads_fee: 'Biaya iklan',
  logistics_fee: 'Biaya logistik',
  tax_fee: 'Pajak',
  fixed_fee: 'Biaya tetap',
};

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function oneOf(value, list, fallback) {
  return list.some((item) => item.id === value) ? value : fallback;
}

function parsePeriod(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  if (parts[0] < 2000 || parts[0] > 2100 || parts[1] < 1 || parts[1] > 12) return null;
  return value;
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

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function formatPercent(value) {
  return String(round2(value)).replace('.', ',') + '%';
}

function formatPoints(value) {
  return String(round2(value)).replace('.', ',') + ' poin';
}

function findById(list, id) {
  return list.find((item) => item.id === id) || list[0];
}

function benchmarkFor(platform, category) {
  const row = BENCHMARKS[category];
  if (!row) return null;
  const rate = row[platform];
  return Number.isFinite(rate) ? rate : null;
}

function benchmarkTable(selectedCategory) {
  return CATEGORIES.map((category) => ({
    category: category.id,
    label: category.label,
    selected: category.id === selectedCategory,
    shopee: BENCHMARKS[category.id].shopee,
    tiktok: BENCHMARKS[category.id].tiktok,
    lazada: BENCHMARKS[category.id].lazada,
  }));
}

function previousMonth() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return String(year) + '-' + String(month).padStart(2, '0');
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const evidenceIds = EVIDENCE.map((item) => item.id);
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((id) => evidenceIds.includes(id))
    : [];
  const uniqueEvidence = evidence.filter((id, index) => evidence.indexOf(id) === index);

  return {
    store_name: cleanText(input.store_name, MAX_TEXT),
    seller_name: cleanText(input.seller_name, MAX_TEXT),
    contact: cleanText(input.contact, MAX_TEXT),
    ticket: cleanText(input.ticket, MAX_TEXT),
    platform: oneOf(input.platform, PLATFORMS, 'shopee'),
    category: oneOf(input.category, CATEGORIES, 'fashion'),
    store_type: oneOf(input.store_type, STORE_TYPES, 'non_mall'),
    category_confidence: oneOf(input.category_confidence, YES_NO, 'ya'),
    period: parsePeriod(input.period) ? input.period : '',
    gross_sales: parseNumber(input.gross_sales),
    commission_fee: numOr(input.commission_fee, 0),
    transaction_fee: numOr(input.transaction_fee, 0),
    scope_confirmed: oneOf(input.scope_confirmed, YES_NO, 'tidak_tahu'),
    program_fee: numOr(input.program_fee, 0),
    ads_fee: numOr(input.ads_fee, 0),
    logistics_fee: numOr(input.logistics_fee, 0),
    tax_fee: numOr(input.tax_fee, 0),
    fixed_fee: numOr(input.fixed_fee, 0),
    benchmark_rate: parseNumber(input.benchmark_rate),
    periods_per_year: parseNumber(input.periods_per_year),
    note: cleanText(input.note, MAX_NOTE),
    status: oneOf(input.status, CASE_STATUSES, 'baru'),
    evidence: uniqueEvidence,
  };
}

function validateAnalysis(input) {
  if (!input.period) throw new Error('Periode wajib diisi dengan format YYYY-MM.');
  if (input.gross_sales === null) throw new Error('Omzet kotor wajib diisi.');
  if (!Number.isFinite(input.gross_sales) || input.gross_sales <= 0) {
    throw new Error('Omzet kotor harus berupa angka lebih dari 0.');
  }

  Object.keys(FIELD_LABELS).forEach((key) => {
    if (!Number.isFinite(input[key]) || input[key] < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
  });

  if (
    input.benchmark_rate !== null &&
    (!Number.isFinite(input.benchmark_rate) || input.benchmark_rate < 0 || input.benchmark_rate > 100)
  ) {
    throw new Error('Benchmark harus berupa angka antara 0 dan 100 persen.');
  }

  if (
    input.periods_per_year !== null &&
    (!Number.isFinite(input.periods_per_year) ||
      input.periods_per_year < 1 ||
      input.periods_per_year > 12)
  ) {
    throw new Error('Periode per tahun harus antara 1 dan 12.');
  }
}

function assessEvidence(input) {
  const items = EVIDENCE.map((item) => ({
    id: item.id,
    label: item.label,
    group: item.group,
    critical: Boolean(item.critical),
    checked: input.evidence.includes(item.id),
  }));

  const totalWeight = items.reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const checkedWeight = items
    .filter((item) => item.checked)
    .reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const missingCritical = items.filter((item) => item.critical && !item.checked);
  const score = Math.round((checkedWeight / totalWeight) * 100);

  let label = 'Belum siap';
  if (score >= 80 && missingCritical.length === 0) label = 'Siap';
  else if (score >= 50) label = 'Hampir siap';

  return {
    items,
    score,
    label,
    checked_count: items.filter((item) => item.checked).length,
    total_count: items.length,
    missing_critical: missingCritical,
  };
}

function buildIndicators(input, takeRate, benchmarkRate, gapPp, outside, allInRate) {
  const triggers = {
    above_slight: gapPp > TOLERANCE_PP,
    above_watch: gapPp > WATCH_PP,
    above_high: gapPp > 5,
    below_slight: gapPp < -TOLERANCE_PP,
    below_watch: gapPp < -WATCH_PP,
    zero_commission: input.commission_fee === 0,
    zero_transaction: input.transaction_fee === 0,
    scope_unconfirmed: input.scope_confirmed !== 'ya',
    mall_store: input.store_type === 'mall',
    category_unsure: input.category_confidence !== 'ya',
    program_high: outside.program_rate > 3,
    ads_high: outside.ads_rate > 5,
    all_in_high: allInRate > 30,
    benchmark_override: input.benchmark_rate !== null,
  };

  return INDICATORS.map((indicator) => ({
    id: indicator.id,
    label: indicator.label,
    weight: indicator.weight,
    triggered: Boolean(triggers[indicator.id]),
    note: indicator.id === 'above_watch'
      ? 'Selisih ' + formatPoints(gapPp) + ' dari benchmark ' + formatPercent(benchmarkRate) + '.'
      : '',
  }));
}

function indicatorScore(indicators) {
  const total = indicators
    .filter((indicator) => indicator.triggered)
    .reduce((sum, indicator) => sum + indicator.weight, 0);
  return Math.min(100, total);
}

function scoreLabel(score) {
  if (score >= 75) return 'Sangat tinggi';
  if (score >= 50) return 'Tinggi';
  if (score >= 25) return 'Sedang';
  return 'Rendah';
}

function buildVerdict(input, takeFee, gapPp, benchmarkRate) {
  if (takeFee <= 0) {
    return {
      level: 'muted',
      label: 'Data belum lengkap',
      note: 'Isi komisi platform dan biaya transaksi dari laporan settlement agar take rate bisa dihitung.',
    };
  }
  if (input.scope_confirmed !== 'ya') {
    return {
      level: 'signal',
      label: 'Cek cakupan biaya dulu',
      note: 'Pastikan angka komisi dan biaya transaksi tidak termasuk program gratis ongkir, iklan, logistik, pajak, dan biaya tetap. Benchmark hanya mencakup komisi dan biaya transaksi.',
    };
  }
  if (input.store_type === 'mall') {
    return {
      level: 'signal',
      label: 'Benchmark non-Mall',
      note: 'Benchmark sumber adalah penjual non-Mall. Selisih ' + formatPoints(gapPp) + ' belum bisa dipakai untuk menyimpulkan kelebihan biaya pada toko Mall.',
    };
  }
  if (gapPp > WATCH_PP) {
    return {
      level: 'ember',
      label: 'Di atas benchmark',
      note: 'Take rate aktual ' + formatPoints(gapPp) + ' di atas benchmark ' + formatPercent(benchmarkRate) + '. Periksa rincian komisi, kategori, dan program sebelum menyimpulkan ada kelebihan biaya.',
    };
  }
  if (gapPp > TOLERANCE_PP) {
    return {
      level: 'signal',
      label: 'Sedikit di atas benchmark',
      note: 'Take rate aktual ' + formatPoints(gapPp) + ' di atas benchmark. Selisih kecil bisa berasal dari kategori, program, atau pembulatan.',
    };
  }
  if (gapPp < -WATCH_PP) {
    return {
      level: 'muted',
      label: 'Di bawah benchmark',
      note: 'Take rate aktual ' + formatPoints(gapPp) + ' di bawah benchmark. Bisa berarti tarif lebih rendah atau ada komponen biaya yang belum diisi.',
    };
  }
  if (gapPp < -TOLERANCE_PP) {
    return {
      level: 'signal',
      label: 'Sedikit di bawah benchmark',
      note: 'Take rate aktual ' + formatPoints(gapPp) + ' di bawah benchmark. Periksa apakah semua komponen biaya sudah masuk.',
    };
  }
  return {
    level: 'ok',
    label: 'Sesuai benchmark',
    note: 'Take rate aktual berada dalam ' + formatPoints(TOLERANCE_PP) + ' dari benchmark ' + formatPercent(benchmarkRate) + '.',
  };
}

function buildRecommendations(input, takeFee, gapPp, outside, allInRate) {
  const list = [];

  if (takeFee <= 0) {
    list.push('Isi komisi platform dan biaya transaksi dari laporan settlement. Jangan memakai total potongan semua biaya karena benchmark hanya mencakup dua komponen itu.');
  }
  if (input.scope_confirmed !== 'ya') {
    list.push('Pisahkan biaya program gratis ongkir atau cashback, iklan, logistik, pajak, dan biaya tetap dari komisi serta biaya transaksi sebelum membandingkan.');
  }
  if (input.commission_fee === 0) {
    list.push('Komisi platform diisi nol. Cek apakah platform menggabungkan komisi dengan biaya lain di satu kolom settlement.');
  }
  if (input.transaction_fee === 0) {
    list.push('Biaya transaksi diisi nol. Cek kolom biaya pembayaran atau biaya transaksi di settlement.');
  }
  if (input.store_type === 'mall') {
    list.push('Benchmark ini untuk penjual non-Mall. Minta benchmark Mall dari platform atau bandingkan hanya dengan sesama toko Mall.');
  }
  if (input.category_confidence !== 'ya') {
    list.push('Pastikan kategori produk di listing. Kategori yang salah membuat benchmark tidak sebanding.');
  }
  if (gapPp > WATCH_PP) {
    list.push('Minta rincian komisi dan biaya transaksi per kategori, lalu cocokkan dengan invoice dan pengumuman tarif platform.');
  }
  if (gapPp > 5) {
    list.push('Selisih di atas 5 poin. Periksa apakah ada biaya program atau biaya iklan yang ikut terhitung, dan apakah toko berstatus Mall.');
  }
  if (gapPp < -WATCH_PP) {
    list.push('Take rate di bawah benchmark bisa berarti data belum lengkap. Cocokkan dengan laporan settlement dan invoice sebelum menyimpulkan tarif lebih rendah.');
  }
  if (outside.program_rate > 3) {
    list.push('Biaya program gratis ongkir atau cashback di atas 3 persen omzet. Biaya ini di luar benchmark take rate dan perlu dihitung terpisah.');
  }
  if (outside.ads_rate > 5) {
    list.push('Biaya iklan di atas 5 persen omzet. Biaya ini di luar benchmark take rate dan perlu dihitung terpisah.');
  }
  if (allInRate > 30) {
    list.push('Total potongan all-in di atas 30 persen omzet. Tinjau biaya program, iklan, dan harga jual. Angka ini bukan bukti pelanggaran.');
  }

  list.push('Benchmark adalah rata-rata pasar, bukan batas resmi. Selisih tidak otomatis berarti platform melanggar aturan.');

  return list.filter((item, index) => list.indexOf(item) === index);
}

function readiness(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(source.evidence) ? source.evidence : source.items;
  const input = normalizeInput({ evidence: items });
  return assessEvidence(input);
}

function analyze(raw, options) {
  const input = normalizeInput(raw);
  validateAnalysis(input);

  const benchmarkRate = input.benchmark_rate !== null
    ? input.benchmark_rate
    : benchmarkFor(input.platform, input.category);
  const periods = input.periods_per_year !== null ? input.periods_per_year : DEFAULT_PERIODS;
  const takeFee = input.commission_fee + input.transaction_fee;
  const takeRate = round2((takeFee / input.gross_sales) * 100);
  const gapPp = round2(takeRate - benchmarkRate);
  const gapMonth = round2((gapPp / 100) * input.gross_sales);
  const gapYear = round2(gapMonth * periods);

  const outsideTotal =
    input.program_fee + input.ads_fee + input.logistics_fee + input.tax_fee + input.fixed_fee;
  const outside = {
    program_fee: input.program_fee,
    ads_fee: input.ads_fee,
    logistics_fee: input.logistics_fee,
    tax_fee: input.tax_fee,
    fixed_fee: input.fixed_fee,
    total: round2(outsideTotal),
    rate: round2((outsideTotal / input.gross_sales) * 100),
    program_rate: round2((input.program_fee / input.gross_sales) * 100),
    ads_rate: round2((input.ads_fee / input.gross_sales) * 100),
  };

  const allInTotal = round2(takeFee + outsideTotal);
  const allInRate = round2((allInTotal / input.gross_sales) * 100);

  const indicators = buildIndicators(input, takeRate, benchmarkRate, gapPp, outside, allInRate);
  const score = indicatorScore(indicators);
  const verdict = buildVerdict(input, takeFee, gapPp, benchmarkRate);
  const evidence = assessEvidence(input);
  const recommendations = buildRecommendations(input, takeFee, gapPp, outside, allInRate);

  return {
    input,
    platform_label: findById(PLATFORMS, input.platform).label,
    category_label: findById(CATEGORIES, input.category).label,
    store_type_label: findById(STORE_TYPES, input.store_type).label,
    benchmark: {
      rate: benchmarkRate,
      period: BENCHMARK_PERIOD,
      segment: BENCHMARK_SEGMENT,
      is_override: input.benchmark_rate !== null,
      scope_note: SCOPE_NOTE,
    },
    actual: {
      gross_sales: input.gross_sales,
      commission_fee: input.commission_fee,
      transaction_fee: input.transaction_fee,
      take_fee: round2(takeFee),
      take_rate: takeRate,
    },
    gap: {
      pp: gapPp,
      rp_month: gapMonth,
      rp_year: gapYear,
      periods_per_year: periods,
      direction: gapPp > TOLERANCE_PP ? 'above' : gapPp < -TOLERANCE_PP ? 'below' : 'match',
    },
    outside,
    all_in: {
      total: allInTotal,
      rate: allInRate,
    },
    benchmark_table: benchmarkTable(input.category),
    indicators,
    score: {
      value: score,
      label: scoreLabel(score),
    },
    verdict,
    evidence,
    recommendations,
    scope: {
      included: SCOPE_ITEMS.filter((item) => item.included),
      excluded: SCOPE_ITEMS.filter((item) => !item.included),
      note: SCOPE_NOTE,
    },
    sources: SOURCES,
  };
}

function letter(raw, options) {
  const result = analyze(raw, options);
  const input = result.input;
  const type = oneOf(raw.letter_type, LETTER_TYPES, 'rincian');
  const store = input.store_name || 'Toko saya';
  const seller = input.seller_name || 'Penjual';
  const contact = input.contact || '-';
  const period = input.period || '(periode belum diisi)';
  const ticket = input.ticket ? 'Nomor tiket: ' + input.ticket + '.' : '';
  const takeRate = formatPercent(result.actual.take_rate);
  const benchmark = formatPercent(result.benchmark.rate);
  const gap = formatPoints(result.gap.pp);
  const evidenceLabels = result.evidence.items
    .map((item) => '- ' + item.label + (item.checked ? ' (sudah ada)' : ' (belum ada)'))
    .join('\n');

  let subject = 'Permintaan rincian take rate periode ' + period;
  let heading = 'Kepada Tim Seller Support,';
  let body = '';

  if (type === 'keberatan') {
    subject = 'Keberatan atas selisih take rate periode ' + period;
    heading = 'Kepada Tim Seller Support,';
    body =
      'Saya ' + seller + ', penjual di ' + store + ', mengajukan keberatan atas selisih take rate untuk periode ' + period + '.\n\n' +
      'Omzet kotor periode: ' + formatRupiah(result.actual.gross_sales) + '.\n' +
      'Komisi platform: ' + formatRupiah(result.actual.commission_fee) + '.\n' +
      'Biaya transaksi: ' + formatRupiah(result.actual.transaction_fee) + '.\n' +
      'Take rate aktual: ' + takeRate + '.\n' +
      'Benchmark rata-rata ' + result.platform_label + ' kategori ' + result.category_label + ': ' + benchmark + ' (' + result.benchmark.period + ', non-Mall).\n' +
      'Selisih: ' + gap + ', setara ' + formatRupiah(result.gap.rp_month) + ' per bulan.\n' +
      (ticket ? ticket + '\n' : '') +
      '\nSaya meminta rincian komponen biaya dan penjelasan bila take rate aktual berbeda dari benchmark. Benchmark yang saya pakai adalah rata-rata pasar, bukan batas resmi, sehingga saya tidak menyimpulkan adanya pelanggaran.\n\n' +
      'Berkas yang saya lampirkan:\n' + evidenceLabels + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else if (type === 'eskalasi') {
    subject = 'Eskalasi permintaan rincian take rate periode ' + period;
    heading = 'Kepada Tim Seller Support dan Account Manager,';
    body =
      'Saya ' + seller + ', penjual di ' + store + ', meminta eskalasi atas permintaan rincian take rate periode ' + period + '.\n\n' +
      'Take rate aktual: ' + takeRate + ' dari omzet kotor ' + formatRupiah(result.actual.gross_sales) + '.\n' +
      'Benchmark rata-rata: ' + benchmark + ' (' + result.benchmark.period + ', non-Mall).\n' +
      'Selisih: ' + gap + ', setara ' + formatRupiah(result.gap.rp_year) + ' per tahun bila pola ini berulang.\n' +
      (ticket ? ticket + '\n' : '') +
      '\nStatus bukti saat ini: ' + result.evidence.score + ' persen. ' +
      (result.evidence.missing_critical.length
        ? 'Bukti kritis yang masih dilengkapi: ' + result.evidence.missing_critical.map((item) => item.label).join(', ') + '.'
        : 'Seluruh bukti kritis sudah tersedia.') +
      '\n\nMohon permintaan ini ditindaklanjuti dengan rincian komisi dan biaya transaksi per kategori. Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else {
    body =
      'Saya ' + seller + ', penjual di ' + store + ', meminta rincian take rate untuk periode ' + period + '.\n\n' +
      'Omzet kotor periode: ' + formatRupiah(result.actual.gross_sales) + '.\n' +
      'Komisi platform: ' + formatRupiah(result.actual.commission_fee) + '.\n' +
      'Biaya transaksi: ' + formatRupiah(result.actual.transaction_fee) + '.\n' +
      'Take rate aktual: ' + takeRate + '.\n' +
      'Benchmark rata-rata ' + result.platform_label + ' kategori ' + result.category_label + ': ' + benchmark + ' (' + result.benchmark.period + ', non-Mall).\n' +
      'Selisih: ' + gap + '.\n' +
      (ticket ? ticket + '\n' : '') +
      '\nSaya meminta rincian komponen biaya, dasar tarif per kategori, dan penjelasan bila ada biaya program yang masuk ke potongan. Saya tidak menyimpulkan adanya pelanggaran dari perbandingan benchmark ini.\n\n' +
      'Berkas yang saya lampirkan:\n' + evidenceLabels + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  }

  return {
    type,
    subject,
    heading,
    body,
  };
}

function example() {
  return {
    store_name: 'Toko Contoh Fashion',
    seller_name: 'Rina',
    contact: 'rina@example.com',
    ticket: 'TKT-2026-1109',
    platform: 'shopee',
    category: 'fashion',
    store_type: 'non_mall',
    category_confidence: 'ya',
    period: previousMonth(),
    gross_sales: 150000000,
    commission_fee: 22500000,
    transaction_fee: 6000000,
    scope_confirmed: 'ya',
    program_fee: 6000000,
    ads_fee: 9000000,
    logistics_fee: 3000000,
    tax_fee: 750000,
    fixed_fee: 0,
    benchmark_rate: null,
    periods_per_year: 12,
    note: 'Contoh data, bukan kasus nyata.',
    status: 'analisis',
    evidence: [
      'settlement_report',
      'fee_detail',
      'transaction_detail',
      'gross_sales_report',
      'category_proof',
      'store_type_proof',
    ],
  };
}

function summarizeCases(rawCases) {
  const cases = (Array.isArray(rawCases) ? rawCases : []).map((item) => {
    const analysis = analyze(item);
    return {
      id: item.id,
      store_name: item.store_name,
      platform_label: analysis.platform_label,
      category_label: analysis.category_label,
      period: item.period,
      gross_sales: analysis.actual.gross_sales,
      take_rate: analysis.actual.take_rate,
      benchmark_rate: analysis.benchmark.rate,
      gap_pp: analysis.gap.pp,
      gap_month: analysis.gap.rp_month,
      gap_year: analysis.gap.rp_year,
      all_in_rate: analysis.all_in.rate,
      verdict: analysis.verdict,
      score: analysis.score,
      status: item.status,
      status_label: findById(CASE_STATUSES, item.status).label,
      note: item.note,
      ticket: item.ticket,
      created_at: item.created_at,
      updated_at: item.updated_at,
      analysis,
    };
  });

  const open = cases.filter((item) => findById(CASE_STATUSES, item.status).open);
  const above = open.filter((item) => item.gap_pp > TOLERANCE_PP);
  const missingEvidence = open.filter(
    (item) => item.analysis.evidence.missing_critical.length > 0
  );
  const totalGapMonth = round2(
    open.reduce((sum, item) => sum + Math.max(0, item.gap_month), 0)
  );
  const totalGapYear = round2(
    open.reduce((sum, item) => sum + Math.max(0, item.gap_year), 0)
  );

  return {
    total: cases.length,
    open_cases: open.length,
    above_benchmark: above.length,
    missing_evidence: missingEvidence.length,
    total_gap_month: totalGapMonth,
    total_gap_year: totalGapYear,
    cases,
  };
}

function csvEscape(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(rawCases) {
  const summary = summarizeCases(rawCases);
  const header = [
    'id',
    'toko',
    'platform',
    'kategori',
    'periode',
    'omzet_kotor',
    'komisi_platform',
    'biaya_transaksi',
    'take_rate',
    'benchmark',
    'selisih_poin',
    'selisih_rp_bulan',
    'selisih_rp_tahun',
    'all_in_rate',
    'verdict',
    'status',
    'catatan',
  ];
  const rows = summary.cases.map((item) => [
    item.id,
    item.store_name,
    item.platform_label,
    item.category_label,
    item.period,
    item.gross_sales,
    item.analysis.actual.commission_fee,
    item.analysis.actual.transaction_fee,
    item.take_rate,
    item.benchmark_rate,
    item.gap_pp,
    item.gap_month,
    item.gap_year,
    item.all_in_rate,
    item.verdict.label,
    item.status_label,
    item.note,
  ]);
  return [header].concat(rows).map((row) => row.map(csvEscape).join(',')).join('\n');
}

function meta() {
  return {
    platforms: PLATFORMS,
    categories: CATEGORIES,
    benchmarks: BENCHMARKS,
    store_types: STORE_TYPES,
    yes_no: YES_NO,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    evidence: EVIDENCE,
    indicators: INDICATORS,
    scope_items: SCOPE_ITEMS,
    sources: SOURCES,
    rules: {
      tolerance_pp: TOLERANCE_PP,
      watch_pp: WATCH_PP,
      default_periods: DEFAULT_PERIODS,
      benchmark_period: BENCHMARK_PERIOD,
      benchmark_segment: BENCHMARK_SEGMENT,
      scope_note: SCOPE_NOTE,
    },
  };
}

module.exports = {
  meta,
  example,
  analyze,
  readiness,
  letter,
  summarizeCases,
  csvRows,
  normalizeInput,
  validateAnalysis,
  benchmarkTable,
  formatRupiah,
  formatPercent,
  formatPoints,
  round2,
  BENCHMARKS,
  EVIDENCE,
  SOURCES,
};
