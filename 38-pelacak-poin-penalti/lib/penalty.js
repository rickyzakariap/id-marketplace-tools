// Core logic for "Pelacak Poin Penalti".
// Zero dependencies so it can be unit-tested without Express.
//
// Grounding:
// - Shopee tiers, reset schedule, appeal window and restriction length come from
//   Shopee Seller Education articles, updated 8-10 Oct 2026 (see SOURCES).
// - Only Shopee has a built-in tier model. Other marketplaces use a manual
//   threshold because their rules are not published in the same format.

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    name: 'Shopee',
    preset: true,
    note: 'Aturan poin, reset kuartal, dan banding mengikuti Pusat Edukasi Penjual Shopee (update September sampai Oktober 2026).',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    preset: false,
    note: 'Ambang poin dan masa reset berbeda. Isi ambang dari halaman Kesehatan Toko atau Seller Center.',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    preset: false,
    note: 'Ambang dan jenis sanksi bisa berbeda. Isi ambang manual dan cek riwayat pelanggaran di Seller Center.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    preset: false,
    note: 'Gunakan angka dari halaman kebijakan seller Lazada. Tool ini tidak mengarang ambang resmi.',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    preset: false,
    note: 'Cek ambang pembatasan di Seller Center dan simpan nomor tiket setiap komunikasi.',
  },
  {
    id: 'bukalapak',
    name: 'Bukalapak',
    preset: false,
    note: 'Cek ambang pembatasan di pusat bantuan penjual dan catat tanggal setiap sanksi.',
  },
];

const SHOPEE_THRESHOLD = 15;
const SHOPEE_RESTRICTION_DAYS = 28;
const SHOPEE_APPEAL_WINDOW_DAYS = 14;
const SHOPEE_APPEAL_PROCESS_DAYS = 7;

const TIERS = [
  { min: 0, max: 2, level: 'Tingkat 0', label: 'Tanpa pembatasan', promo: false, ranking: false, upload: false, restriction: false },
  { min: 3, max: 5, level: 'Tingkat I', label: 'Promosi dan peringkat dibatasi', promo: true, ranking: true, upload: false, restriction: false },
  { min: 6, max: 8, level: 'Tingkat II', label: 'Promosi dan peringkat dibatasi', promo: true, ranking: true, upload: false, restriction: false },
  { min: 9, max: 11, level: 'Tingkat III', label: 'Promosi dan peringkat dibatasi', promo: true, ranking: true, upload: false, restriction: false },
  { min: 12, max: 14, level: 'Tingkat IV', label: 'Tidak bisa unggah atau ubah produk', promo: true, ranking: true, upload: true, restriction: false },
  { min: 15, max: Infinity, level: 'Tingkat V', label: 'Akun berisiko dibatasi', promo: true, ranking: true, upload: true, restriction: true },
];

const CONSEQUENCES = [
  { key: 'promo', label: 'Tidak bisa ikut promosi Shopee', from: 3 },
  { key: 'ranking', label: 'Posisi produk turun di pencarian dan halaman utama', from: 3 },
  { key: 'upload', label: 'Tidak bisa unggah produk baru atau mengubah produk', from: 12 },
  { key: 'restriction', label: 'Pembatasan akun 28 hari, bisa diperpanjang jika poin bertambah', from: 15 },
];

const VIOLATIONS = [
  { id: 'unfinished', label: 'Pesanan tidak terselesaikan', points: 1, note: '1 sampai 4 poin per minggu, tergantung persentase dan jumlah pesanan (Shopee).' },
  { id: 'late', label: 'Keterlambatan pengiriman', points: 1, note: '1 sampai 2 poin per minggu bila tingkat keterlambatan 10 persen atau lebih (Shopee).' },
  { id: 'forbidden', label: 'Produk dilarang', points: 1, note: '1 atau 2 poin plus produk dihapus. Pelanggaran berat 3 atau 6 poin (Shopee).' },
  { id: 'fake_package', label: 'Paket kosong atau tidak lengkap', points: 6, note: 'Pelanggaran pertama 6 poin, kedua 9 poin, ketiga pembatasan akun (Shopee).' },
  { id: 'return_address', label: 'Alamat pengembalian palsu', points: 2, note: '2 poin (Shopee).' },
  { id: 'store_name', label: 'Pelanggaran nama toko', points: 2, note: '2 poin (Shopee).' },
  { id: 'voucher_abuse', label: 'Penyalahgunaan voucher atau gratis ongkir', points: 1, note: '1 poin per pelanggaran (Shopee).' },
  { id: 'outside', label: 'Mengarahkan transaksi di luar marketplace', points: 2, note: '2 poin atau pembatasan akun (Shopee).' },
  { id: 'live', label: 'Konten Shopee Live tidak pantas', points: 3, note: '3 poin, berulang bisa berujung pembatasan akun (Shopee).' },
  { id: 'fake_order', label: 'Pemalsuan pesanan atau penilaian', points: 3, note: '3, 6, atau 9 poin tergantung jenis pelanggaran (Shopee).' },
  { id: 'other', label: 'Pelanggaran lain', points: 2, note: 'Cocokkan dengan rincian di halaman Penalti Saya. Jangan menebak jumlah poin.' },
];

const SOURCES = [
  {
    id: 'mk-penalty-reappear-2026-10-21',
    label: 'Toko Shopee ditutup, banding disetujui, tetapi poin penalti muncul lagi dan mengancam penutupan kedua',
    publisher: 'Media Konsumen',
    date: '21 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/21/surat-pembaca/toko-shopee-pernah-ditutup-banding-disetujui-dan-dibuka-kembali-tetapi-penalti-terus-muncul-hingga-terancam-ditutup-lagi',
  },
  {
    id: 'shopee-faq-points-2026-10-08',
    label: 'FAQ Sistem Poin Penalti: tingkatan poin dan reset hari Senin terakhir setiap kuartal',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '8 Oktober 2026',
    url: 'https://seller.shopee.co.id/edu/article/15722',
  },
  {
    id: 'shopee-points-rules-2026-09-17',
    label: 'Sistem dan Ketentuan Poin Penalti: rincian poin per pelanggaran serta ketentuan banding',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '17 September 2026',
    url: 'https://seller.shopee.co.id/edu/article/7070',
  },
  {
    id: 'shopee-appeal-2026-10-09',
    label: 'Pengajuan Banding Penalti: batas 14 hari sejak poin diterbitkan dan proses sekitar 7 hari',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '9 Oktober 2026',
    url: 'https://seller.shopee.co.id/edu/article/16074',
  },
  {
    id: 'shopee-health-2026',
    label: 'Kesehatan Toko: akumulasi 15 poin berujung pembatasan akun 28 hari yang bisa diperpanjang',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026',
    url: 'https://seller.shopee.co.id/edu/article/14022',
  },
  {
    id: 'mk-tokopedia-points-2022-05-01',
    label: 'Penalti sepihak Tokopedia sampai minus 210 poin (pola keluhan lintas platform)',
    publisher: 'Media Konsumen',
    date: '1 Mei 2022',
    url: 'https://mediakonsumen.com/2022/05/01/surat-pembaca/penalti-sepihak-oleh-tokopedia-sampai-210-poin',
  },
  {
    id: 'mk-tiktok-points-2025-01-19',
    label: 'Produk diblokir sepihak dan 12 poin pelanggaran di toko TikTok Shop',
    publisher: 'Media Konsumen',
    date: '19 Januari 2025',
    url: 'https://mediakonsumen.com/2025/01/19/surat-pembaca/produk-diblokir-sepihak-dan-pemberian-12-poin-pelanggaran-di-toko-tiktokshop-saya',
  },
];

const DEFAULTS = {
  platform: 'shopee',
  violation: 'fake_package',
  points: 9,
  threshold: 15,
  appeal_window_days: 14,
  orders_per_day: 100,
  aov: 150000,
  margin_pct: 20,
  restriction_days: 28,
};

const EVIDENCE = [
  'Tangkapan layar halaman Penalti Saya beserta jumlah poin dan tanggal penerbitan.',
  'Nomor pesanan atau ID transaksi yang disebut dalam notifikasi pelanggaran.',
  'Bukti jadwal dan serah terima kurir, termasuk screenshot gagal pick up bila ada.',
  'Screenshot kendala sistem, error resi, atau bukti bahwa pesanan tidak bisa diproses.',
  'Kronologi tertulis berisi tanggal, kejadian, nomor tiket, dan tanggapan CS.',
  'Bukti operasional toko: stok, video packing, faktur supplier, dan riwayat pengiriman.',
  'Salinan keputusan banding sebelumnya bila poin yang sama muncul kembali.',
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundRp(n) {
  return Math.round(n);
}

function percent(n) {
  return Math.round(n * 10) / 10;
}

function cleanLine(value, max = 200) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanBlock(value, max = 1600) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function toISODate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  return map.year + '-' + map.month + '-' + map.day;
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const from = new Date(fromIso + 'T00:00:00Z').getTime();
  const to = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((to - from) / 86400000);
}

function formatDateOnly(iso) {
  const parts = String(iso).split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
  return parts[2] + ' ' + ID_MONTHS[parts[1] - 1] + ' ' + parts[0];
}

function formatTodayID(now = new Date()) {
  return formatDateOnly(todayISO(now));
}

function quarterMonths(quarter) {
  return [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
}

function lastMondayOfMonth(year, month) {
  const last = new Date(Date.UTC(year, month, 0));
  const day = last.getUTCDay();
  const offset = (day + 6) % 7;
  last.setUTCDate(last.getUTCDate() - offset);
  return last.toISOString().slice(0, 10);
}

function lastMondayOfQuarter(year, quarter) {
  const months = quarterMonths(quarter);
  return lastMondayOfMonth(year, months[2]);
}

function quarterLabel(iso) {
  const month = Number(String(iso).slice(5, 7));
  const quarter = Math.ceil(month / 3);
  return 'Kuartal ' + quarter + ' ' + String(iso).slice(0, 4);
}

function currentQuarter(iso) {
  const month = Number(String(iso).slice(5, 7));
  return Math.ceil(month / 3);
}

function nextResetDate(today = todayISO()) {
  const day = toISODate(today);
  if (!day) return '';
  const year = Number(day.slice(0, 4));
  let quarter = currentQuarter(day);
  let candidate = lastMondayOfQuarter(year, quarter);
  if (candidate > day) return candidate;
  quarter += 1;
  let nextYear = year;
  if (quarter > 4) {
    quarter = 1;
    nextYear += 1;
  }
  return lastMondayOfQuarter(nextYear, quarter);
}

function tierFor(points) {
  return TIERS.find((tier) => points >= tier.min && points <= tier.max) || TIERS[TIERS.length - 1];
}

function getPlatform(id) {
  return PLATFORMS.find((platform) => platform.id === id) || PLATFORMS[0];
}

function getViolation(id) {
  return VIOLATIONS.find((violation) => violation.id === id) || VIOLATIONS[VIOLATIONS.length - 1];
}

function getSource(id) {
  return SOURCES.find((source) => source.id === id);
}

function activeSources(platformId) {
  const ids = ['mk-penalty-reappear-2026-10-21', 'shopee-faq-points-2026-10-08', 'shopee-points-rules-2026-09-17', 'shopee-appeal-2026-10-09', 'shopee-health-2026'];
  if (platformId === 'tokopedia') ids.push('mk-tokopedia-points-2022-05-01');
  if (platformId === 'tiktok') ids.push('mk-tiktok-points-2025-01-19');
  return ids.map(getSource).filter(Boolean);
}

function riskFor(points, threshold, platformId) {
  if (points >= threshold) {
    return {
      id: 'dibatasi',
      label: 'Risiko pembatasan akun',
      detail: 'Poin sudah mencapai atau melewati ambang pembatasan. Amankan bukti dan ajukan banding hari ini.',
    };
  }
  if (threshold - points <= 2) {
    return {
      id: 'kritis',
      label: 'Hampir kena pembatasan',
      detail: 'Sisa ' + (threshold - points) + ' poin lagi sebelum ambang pembatasan. Hindari pelanggaran baru dan siapkan banding.',
    };
  }
  if (points >= 3) {
    return {
      id: 'waspada',
      label: 'Fitur promosi sudah dibatasi',
      detail: platformId === 'shopee'
        ? 'Promosi dan peringkat produk sudah terdampak. Kejar perbaikan performa sebelum poin bertambah.'
        : 'Cek fitur yang dibatasi di Seller Center dan kejar perbaikan performa.',
    };
  }
  return {
    id: 'aman',
    label: 'Poin masih rendah',
    detail: 'Belum ada pembatasan yang dilaporkan pada tingkat ini. Jaga target performa dan pantau tanggal reset.',
  };
}

function appealFor(lastDate, appealWindowDays, platformId, today) {
  if (!lastDate) {
    return {
      available: false,
      reason: 'Tanggal penerbitan poin belum diisi',
      window_days: appealWindowDays,
      deadline: '',
      days_left: null,
      state: 'tanpa-tanggal',
      detail: 'Isi tanggal poin diterbitkan agar batas banding bisa dihitung.',
    };
  }
  const windowDays = Math.max(0, Math.round(appealWindowDays));
  if (windowDays <= 0) {
    return {
      available: false,
      reason: 'Batas banding platform ini tidak dipetakan',
      window_days: 0,
      deadline: '',
      days_left: null,
      state: 'manual',
      detail: 'Isi batas hari banding sesuai Seller Center bila ingin menghitung tenggat.',
    };
  }
  const deadline = addDays(lastDate, windowDays);
  const daysLeft = daysBetween(today, deadline);
  let state = 'terbuka';
  let detail = 'Batas pengajuan banding masih terbuka. Kirim banding lewat kanal resmi Seller Center.';
  if (daysLeft < 0) {
    state = 'lewat';
    detail = 'Batas ' + windowDays + ' hari sudah lewat ' + Math.abs(daysLeft) + ' hari. Untuk Shopee, banding lewat Seller Center hanya untuk poin pada kuartal yang sama dan dalam batas 14 hari.';
  } else if (daysLeft <= 2) {
    state = 'kritis';
    detail = 'Sisa ' + daysLeft + ' hari lagi. Kirim banding sekarang dan simpan nomor tiket.';
  }
  detail += ' Perhitungan: tanggal poin ditambah ' + windowDays + ' hari.';
  return {
    available: true,
    reason: '',
    window_days: windowDays,
    deadline,
    deadline_label: formatDateOnly(deadline),
    days_left: daysLeft,
    state,
    detail,
    process_days: platformId === 'shopee' ? SHOPEE_APPEAL_PROCESS_DAYS : null,
    process_note: platformId === 'shopee'
      ? 'Proses banding sekitar 7 hari kalender menurut halaman bantuan Shopee, kasus kompleks bisa lebih lama.'
      : 'Lama proses berbeda per platform. Catat tanggal pengajuan dan minta estimasi tertulis.',
  };
}

function analyze(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const violation = getViolation(data.violation);
  const today = todayISO(now);

  const points = Math.max(0, Math.round(toNumber(data.points)));
  const isShopee = platform.id === 'shopee';
  const threshold = isShopee
    ? SHOPEE_THRESHOLD
    : Math.max(1, Math.round(toNumber(data.threshold, 15)));
  const appealWindow = Math.max(0, Math.round(toNumber(data.appeal_window_days, isShopee ? SHOPEE_APPEAL_WINDOW_DAYS : 0)));
  const lastDate = toISODate(data.last_point_date);
  const restrictionDays = Math.max(1, Math.round(toNumber(data.restriction_days, isShopee ? SHOPEE_RESTRICTION_DAYS : 14)));

  const orders = Math.max(0, toNumber(data.orders_per_day));
  const aov = Math.max(0, toNumber(data.aov));
  const marginPct = clamp(toNumber(data.margin_pct), 0, 100);

  if (points < 0 || !Number.isFinite(points)) {
    return { error: 'Poin penalti harus berupa angka 0 atau lebih' };
  }
  if (orders <= 0 || aov <= 0) {
    return { error: 'Rata-rata pesanan per hari dan nilai pesanan harus lebih dari 0' };
  }

  const tier = isShopee ? tierFor(points) : {
    min: 0,
    max: threshold,
    level: 'Ambang manual',
    label: 'Aturan tingkat tidak tersedia untuk platform ini',
    promo: false,
    ranking: false,
    upload: false,
    restriction: false,
  };

  const consequences = isShopee
    ? CONSEQUENCES.filter((item) => points >= item.from).map((item) => item.label)
    : ['Tool tidak memetakan sanksi platform ini. Cek halaman Kesehatan Toko atau Penalti Saya untuk daftar sanksi yang aktif.'];

  const nextTier = isShopee && points < threshold
    ? TIERS.find((item) => item.min > points)
    : null;
  const pointsToNextTier = nextTier ? nextTier.min - points : 0;
  const pointsToRestriction = Math.max(0, threshold - points);
  const resetDate = nextResetDate(today);
  const daysToReset = resetDate ? daysBetween(today, resetDate) : null;
  const risk = riskFor(points, threshold, platform.id);
  const appeal = appealFor(lastDate, appealWindow, platform.id, today);

  const dailyProfit = orders * aov * (marginPct / 100);
  const restrictionLoss = dailyProfit * restrictionDays;

  const recommendations = [];
  if (points >= threshold) {
    recommendations.push('Ajukan banding untuk setiap poin yang masih dalam batas waktu, lalu minta penangguhan sanksi selama peninjauan.');
    recommendations.push('Siapkan bukti operasional dan kronologi sebelum menghubungi CS agar tidak terjebak jawaban template.');
  }
  if (isShopee && points >= 12 && points < threshold) {
    recommendations.push('Pada tingkat ini produk baru tidak bisa diunggah. Fokus perbaiki performa dan hindari pelanggaran tambahan.');
  }
  if (isShopee && points >= 3) {
    recommendations.push('Promosi dan peringkat produk sudah dibatasi. Jangan menambah poin baru sampai reset kuartal.');
  }
  if (appeal.state === 'lewat') {
    recommendations.push('Batas banding lewat. Minta penjelasan tertulis dan fokus pada perbaikan performa sampai reset berikutnya.');
  } else if (appeal.available) {
    recommendations.push('Kirim banding sebelum ' + appeal.deadline_label + ' dan simpan nomor tiket serta bukti yang dilampirkan.');
  }
  if (daysToReset !== null && daysToReset <= 14) {
    recommendations.push('Reset poin tinggal ' + daysToReset + ' hari lagi. Prioritaskan bertahan tanpa pelanggaran baru.');
  }
  recommendations.push('Cocokkan jumlah poin di tool dengan halaman Penalti Saya. Kalau berbeda, pakai angka dari Seller Center.');

  return {
    platform: platform.id,
    platform_name: platform.name,
    platform_note: platform.note,
    preset: platform.preset,
    violation: violation.id,
    violation_label: violation.label,
    violation_note: violation.note,
    points: points,
    threshold: threshold,
    threshold_label: isShopee ? 'Ambang pembatasan Shopee (15 poin)' : 'Ambang manual dari Seller Center',
    tier: tier.level,
    tier_label: tier.label,
    next_tier: nextTier ? nextTier.level : '',
    points_to_next_tier: pointsToNextTier,
    points_to_restriction: pointsToRestriction,
    consequences: consequences,
    reset_date: resetDate,
    reset_date_label: formatDateOnly(resetDate),
    reset_quarter: quarterLabel(today),
    days_to_reset: daysToReset,
    appeal: appeal,
    risk: risk.id,
    risk_label: risk.label,
    risk_detail: risk.detail,
    economics: {
      orders_per_day: roundRp(orders),
      aov: roundRp(aov),
      margin_pct: percent(marginPct),
      daily_profit: roundRp(dailyProfit),
      restriction_days: restrictionDays,
      restriction_loss: roundRp(restrictionLoss),
    },
    recommendations: recommendations,
    evidence: EVIDENCE,
    sources: activeSources(platform.id),
  };
}

function isResetConfirmed(item) {
  return item.appeal_status === 'diterima' && item.points_reset === 'ya';
}

function normalizeCase(raw) {
  const data = raw || {};
  const platform = getPlatform(data.platform);
  const violation = getViolation(data.violation);
  const appealStatus = ['belum', 'diajukan', 'diterima', 'ditolak'].includes(data.appeal_status)
    ? data.appeal_status
    : 'belum';
  const pointsReset = ['ya', 'tidak', 'tidak-tahu'].includes(data.points_reset)
    ? data.points_reset
    : 'tidak-tahu';
  return {
    platform: platform.id,
    ref: cleanLine(data.ref, 80),
    violation: violation.id,
    violation_label: cleanLine(data.violation_label, 120) || violation.label,
    points: Math.max(0, Math.round(toNumber(data.points))),
    issued_date: toISODate(data.issued_date),
    appeal_status: appealStatus,
    appeal_date: toISODate(data.appeal_date),
    appeal_result_date: toISODate(data.appeal_result_date),
    points_reset: pointsReset,
    note: cleanLine(data.note, 400),
  };
}

function validateCase(raw) {
  const item = normalizeCase(raw);
  if (!item.ref) return { error: 'Isi nomor pesanan atau referensi kasus' };
  if (!item.issued_date) return { error: 'Tanggal penerbitan poin wajib diisi (YYYY-MM-DD)' };
  if (item.points <= 0) return { error: 'Poin harus lebih dari 0' };
  if (item.appeal_status === 'diterima' && !item.appeal_result_date) {
    return { error: 'Isi tanggal hasil banding untuk kasus yang diterima' };
  }
  return { item: item };
}

function detectReappearance(cases) {
  const list = Array.isArray(cases) ? cases.slice() : [];
  const sorted = list
    .filter((item) => item.ref && item.issued_date)
    .sort((a, b) => String(a.issued_date).localeCompare(String(b.issued_date)));
  const flags = [];
  sorted.forEach((item) => {
    if (!isResetConfirmed(item) || !item.appeal_result_date) return;
    const later = sorted.filter((other) => {
      if (other.id === item.id) return false;
      if (other.ref !== item.ref) return false;
      if (!other.issued_date) return false;
      return other.issued_date > item.appeal_result_date && toNumber(other.points) > 0;
    });
    if (later.length === 0) return;
    flags.push({
      ref: item.ref,
      original_id: item.id || '',
      original_date: item.issued_date,
      appeal_result_date: item.appeal_result_date,
      later_ids: later.map((x) => x.id || ''),
      later_dates: later.map((x) => x.issued_date),
      message: 'Poin untuk referensi ' + item.ref + ' muncul lagi setelah banding disetujui pada ' + formatDateOnly(item.appeal_result_date) + '.',
    });
  });
  return flags;
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const type = data.letter_type === 'poin-kembali' ? 'poin-kembali' : 'banding';
  const sellerName = cleanLine(data.seller_name, 120) || '[Nama penjual]';
  const storeName = cleanLine(data.store_name, 120) || '[Nama toko]';
  const storeId = cleanLine(data.store_id, 80);
  const contact = cleanLine(data.contact, 120);
  const ref = cleanLine(data.ref, 100);
  const violation = cleanLine(data.violation_label, 140) || 'poin penalti';
  const points = Math.max(0, Math.round(toNumber(data.points)));
  const issuedDate = toISODate(data.last_point_date || data.issued_date);
  const appealDate = toISODate(data.appeal_date);
  const appealResultDate = toISODate(data.appeal_result_date);
  const chronology = cleanBlock(data.chronology);
  const today = formatTodayID(now);

  const idLine = storeId ? ' (ID toko: ' + storeId + ')' : '';
  const refLine = ref ? 'Referensi pesanan atau kasus: ' + ref : '';
  const issuedLine = issuedDate ? 'Tanggal poin diterbitkan: ' + formatDateOnly(issuedDate) : '';
  const pointsLine = points > 0 ? 'Jumlah poin yang tercatat: ' + points + ' poin' : '';
  const appealLine = appealDate ? 'Tanggal banding diajukan: ' + formatDateOnly(appealDate) : '';
  const resultLine = appealResultDate ? 'Tanggal hasil banding: ' + formatDateOnly(appealResultDate) : '';

  const subject = type === 'poin-kembali'
    ? 'Permintaan penjelasan tertulis atas poin penalti yang muncul kembali setelah banding disetujui'
    : 'Pengajuan banding poin penalti dan permintaan rincian pelanggaran';

  const lines = [];
  lines.push('Kepada Tim Seller Support ' + platform.name + ',', '');
  lines.push('Perihal: ' + subject, '');
  lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + idLine + ' di ' + platform.name + ', menyampaikan permintaan resmi terkait poin penalti pada toko saya.', '');

  if (chronology) lines.push('Kronologi:', chronology, '');
  [issuedLine, pointsLine, refLine, appealLine, resultLine].filter(Boolean).forEach((line) => lines.push(line));
  if ([issuedLine, pointsLine, refLine, appealLine, resultLine].some(Boolean)) lines.push('');

  if (type === 'poin-kembali') {
    lines.push(
      'Banding saya sebelumnya telah disetujui dan poin penalti untuk kasus tersebut dikembalikan menjadi nol. Namun, poin penalti dengan referensi yang sama muncul kembali setelah keputusan banding tersebut.',
      '',
      'Permintaan saya:',
      '1. Mohon jelaskan secara tertulis dasar dan tanggal penerbitan poin yang muncul kembali, termasuk aturan yang dilanggar dan ID pesanan atau transaksi yang dimaksud.',
      '2. Mohon konfirmasi apakah keputusan banding yang sebelumnya disetujui masih berlaku.',
      '3. Mohon tinjau ulang dan hapus poin yang muncul kembali apabila berasal dari kasus yang sudah dinyatakan selesai.',
      '4. Mohon tahan sanksi atau pembatasan yang timbul dari poin tersebut selama proses peninjauan berlangsung.',
      '5. Mohon kirimkan keputusan tertulis beserta nomor tiket agar saya dapat memantau prosesnya.',
      '',
      'Saya tidak meminta pengecualian dari aturan. Saya meminta kepastian bahwa hasil banding yang sudah disetujui dihormati dan bahwa setiap poin baru memiliki dasar yang dapat diperiksa.',
      ''
    );
  } else {
    lines.push(
      'Saya meyakini poin ini tidak sepenuhnya disebabkan oleh kesalahan toko saya. Saya memohon peninjauan ulang disertai bukti yang saya lampirkan.',
      '',
      'Permintaan saya:',
      '1. Mohon kirimkan rincian tertulis mengenai aturan yang dilanggar, ID pesanan atau transaksi, dan bukti yang mendasari pemberian poin.',
      '2. Mohon tinjau ulang poin penalti ini dan hapuskan apabila terbukti bukan karena kesalahan penjual.',
      '3. Mohon pulihkan fitur promosi atau keuntungan eksklusif yang terdampak bila banding disetujui.',
      '4. Mohon berikan keputusan tertulis beserta nomor tiket dan perkiraan waktu penyelesaian.',
      '',
      'Saya siap memberikan klarifikasi tambahan, termasuk bukti serah terima kurir, kendala sistem, atau dokumen operasional lain yang diperlukan.',
      ''
    );
  }

  lines.push('Bukti yang saya lampirkan:', '');
  EVIDENCE.forEach((item, index) => lines.push((index + 1) + '. ' + item));
  lines.push('', 'Hormat saya,', sellerName);
  if (contact) lines.push(contact);
  lines.push('', 'Dibuat pada ' + today);

  return { type: type, subject: subject, body: lines.join('\n') };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  const issued = addDays(today, -5);
  const appealDate = addDays(today, -3);
  return {
    platform: 'shopee',
    violation: 'fake_package',
    points: 9,
    threshold: 15,
    last_point_date: issued,
    appeal_window_days: 14,
    orders_per_day: 100,
    aov: 150000,
    margin_pct: 20,
    restriction_days: 28,
    seller_name: 'Ricky',
    store_name: 'Sinar Maju Palembang',
    store_id: 'sinarmajupalembang',
    contact: '0812xxxxxxx',
    ref: '261001GGJ854U8',
    appeal_date: appealDate,
    appeal_result_date: '',
    letter_type: 'banding',
    chronology: formatDateOnly(issued) + ': muncul notifikasi paket kosong atau tidak lengkap untuk pesanan 261001GGJ854U8. ' + formatDateOnly(appealDate) + ': banding diajukan dengan bukti video packing dan serah terima kurir. ' + formatDateOnly(today) + ': poin untuk referensi yang sama muncul kembali.',
  };
}

module.exports = {
  analyze,
  buildLetter,
  buildExample,
  detectReappearance,
  validateCase,
  normalizeCase,
  nextResetDate,
  lastMondayOfQuarter,
  tierFor,
  riskFor,
  appealFor,
  formatDateOnly,
  formatTodayID,
  todayISO,
  addDays,
  daysBetween,
  getPlatform,
  getViolation,
  getSource,
  PLATFORMS,
  VIOLATIONS,
  TIERS,
  CONSEQUENCES,
  SOURCES,
  DEFAULTS,
  EVIDENCE,
  SHOPEE_THRESHOLD,
  SHOPEE_RESTRICTION_DAYS,
  SHOPEE_APPEAL_WINDOW_DAYS,
  SHOPEE_APPEAL_PROCESS_DAYS,
};
