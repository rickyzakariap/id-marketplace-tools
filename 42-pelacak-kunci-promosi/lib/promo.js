// Promotion lock logic for Indonesian marketplace sellers.
// The two cases behind this tool are voucher and promo access failures without penalty points.
// All money figures come from seller input. No marketplace deadline or rate is invented.

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    name: 'Shopee',
    channel: 'Pusat Bantuan Shopee dan Seller Centre',
    note: 'Simpan nomor tiket dan screenshot voucher yang tampil lalu hilang. Dua kasus Oktober 2026 menunjukkan kunci promosi bisa bertahan lebih dari 30 hari tanpa poin penalti.',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    channel: 'Pusat Bantuan Tokopedia',
    note: 'Untuk pesanan lewat TikTok Shop by Tokopedia, cek nomor tiket di kedua kanal.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    channel: 'TikTok Seller Center',
    note: 'Catat pesan error saat voucher gagal dipakai, bukan hanya jawaban chat.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    channel: 'Pusat Bantuan Lazada',
    note: 'Minta penjelasan tertulis dan nomor tiket untuk setiap laporan.',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    channel: 'BlibliCare',
    note: 'Simpan semua komunikasi tertulis dengan Blibli.',
  },
  {
    id: 'lainnya',
    name: 'Marketplace lain',
    channel: 'Seller Center',
    note: 'Sesuaikan jalur eskalasi dengan panduan marketplace yang dipakai.',
  },
];

const TRIGGERS = [
  {
    id: 'harga_coret',
    label: 'Harga coret atau diskon dianggap tidak wajar',
    note: 'Kasus 27 Oktober 2026: penjual membuat harga coret, muncul peringatan penalti promosi, lalu voucher tidak bisa menempel selama lebih dari 3 bulan.',
  },
  {
    id: 'lonjakan_pesanan',
    label: 'Lonjakan pesanan setelah kampanye',
    note: 'Kasus 16 Oktober 2026: pesanan naik dari sekitar 100 menjadi 1.000 resi per hari setelah event, lalu akses voucher kategori dan status Star Seller hilang tanpa peringatan.',
  },
  {
    id: 'kata_kunci',
    label: 'Kata kunci produk ditandai otomatis',
    note: 'Sistem bisa salah membaca kata sehari-hari sebagai barang terlarang. Minta kategori dan kata kunci yang memicu flag.',
  },
  {
    id: 'aktivitas_mencurigakan',
    label: 'Pesan umum aktivitas mencurigakan',
    note: 'Jawaban ini tidak menyebut transaksi atau aturan yang dilanggar. Minta rincian tertulis sebelum menyanggah.',
  },
  {
    id: 'pelanggaran_produk',
    label: 'Pelanggaran produk atau kategori',
    note: 'Perbaiki listing lebih dulu, lalu minta pemulihan fitur promosi setelah perbaikan.',
  },
  {
    id: 'tidak_tahu',
    label: 'Tidak tahu pemicunya',
    note: 'Mulai dari kronologi dan screenshot sebelum-sesudah. Tanpa pemicu yang jelas, minta audit manual.',
  },
];

const SYMPTOMS = [
  { id: 'voucher_instant', label: 'Voucher instant gratis tidak menempel', note: 'Voucher dari platform untuk toko terpilih tidak muncul atau hilang saat halaman dimuat ulang.' },
  { id: 'voucher_toko', label: 'Voucher toko sendiri tidak muncul', note: 'Voucher yang dibuat penjual tidak tampil di halaman produk.' },
  { id: 'voucher_kategori', label: 'Voucher kategori tidak bisa dipakai', note: 'Misalnya voucher Makanan dan Minuman yang biasanya tersedia setiap pagi.' },
  { id: 'promo_berbayar', label: 'Promo berbayar terdaftar tetapi voucher gagal', note: 'Promo Extra atau Live Extra menerima pendaftaran, tetapi voucher tidak menempel saat checkout.' },
  { id: 'checkout_gagal', label: 'Voucher tampak menempel tetapi ditolak saat checkout', note: 'Gejala paling kuat: tampilan setuju, transaksi menolak.' },
  { id: 'star_seller_hilang', label: 'Status Star Seller hilang atau turun', note: 'Catat tanggal dan status sebelum kunci terjadi.' },
  { id: 'live_terkunci', label: 'Fitur live atau kampanye tidak bisa diikuti', note: 'Simpan pesan error dan jadwal live yang gagal.' },
  { id: 'promosi_lain', label: 'Fitur promosi lain ikut terkunci', note: 'Daftar semua fitur yang gagal agar polanya terlihat.' },
];

const FACT_OPTIONS = {
  points: [
    { id: 'nol', label: '0 poin, tidak ada poin penalti' },
    { id: 'ada', label: 'Ada poin penalti' },
    { id: 'tidak_tahu', label: 'Belum dicek' },
  ],
  warning: [
    { id: 'ya', label: 'Ya, pernah muncul peringatan penalti promosi' },
    { id: 'tidak', label: 'Tidak ada peringatan' },
    { id: 'tidak_tahu', label: 'Tidak ingat atau tidak yakin' },
  ],
  quarter_reset: [
    { id: 'ya', label: 'Sudah lewat reset poin kuartal, tetap terkunci' },
    { id: 'belum', label: 'Belum lewat reset poin kuartal' },
    { id: 'tidak_tahu', label: 'Tidak tahu jadwal reset' },
  ],
  written_reason: [
    { id: 'tidak', label: 'Belum, baru jawaban chat atau template' },
    { id: 'ya', label: 'Sudah ada alasan tertulis' },
  ],
  star_seller_now: [
    { id: 'tidak', label: 'Tidak, status sedang hilang' },
    { id: 'ya', label: 'Ya, status masih ada' },
  ],
};

const EVIDENCE = [
  {
    id: 'voucher_screenshot',
    label: 'Screenshot voucher yang tampil lalu hilang atau tidak menempel',
    critical: true,
    note: 'Ambil satu screenshot saat voucher terlihat dan satu lagi setelah halaman dimuat ulang.',
  },
  {
    id: 'checkout_recording',
    label: 'Rekaman layar dari halaman produk sampai checkout gagal',
    critical: true,
    note: 'Rekaman lebih kuat daripada screenshot karena menunjukkan urutan kejadian.',
  },
  {
    id: 'points_zero',
    label: 'Screenshot halaman poin penalti yang menunjukkan 0 poin',
    critical: true,
    note: 'Membuktikan masalah bukan poin penalti biasa.',
  },
  {
    id: 'chat_tickets',
    label: 'Riwayat chat CS dan semua nomor tiket',
    critical: true,
    note: 'Catat tanggal, nomor tiket, dan nama agen bila terlihat.',
  },
  {
    id: 'trigger_evidence',
    label: 'Bukti pemicu: peringatan penalti promosi, riwayat harga, atau lonjakan pesanan',
    critical: true,
    note: 'Lampirkan hanya yang relevan dengan pemicu yang Anda pilih.',
  },
  {
    id: 'star_history',
    label: 'Screenshot status Star Seller sebelum dan sesudah kunci',
    critical: false,
    note: 'Bila status hilang, simpan riwayat dan tanggalnya.',
  },
  {
    id: 'account_health',
    label: 'Screenshot kesehatan akun dan halaman pelanggaran produk',
    critical: false,
    note: 'Tunjukkan tidak ada pelanggaran produk yang aktif.',
  },
  {
    id: 'program_list',
    label: 'Daftar program promo yang sudah dicoba',
    critical: false,
    note: 'Voucher instant, voucher toko, Promo Extra, Live Extra, dan kampanye lain.',
  },
  {
    id: 'program_registered',
    label: 'Bukti pendaftaran program berhasil tetapi voucher gagal',
    critical: false,
    note: 'Screenshot status terdaftar dan pesan error saat voucher dipakai.',
  },
  {
    id: 'sales_before_after',
    label: 'Data penjualan harian sebelum dan sesudah kunci',
    critical: false,
    note: 'Ekspor dari Seller Centre bila tersedia. Bandingkan periode yang sama.',
  },
  {
    id: 'chronology',
    label: 'Kronologi tanggal dan jam kejadian',
    critical: false,
    note: 'Tulis fakta saja tanpa tuduhan.',
  },
  {
    id: 'quarter_reset_proof',
    label: 'Bukti reset poin kuartal sudah lewat',
    critical: false,
    note: 'Screenshot riwayat poin setelah tanggal reset.',
  },
  {
    id: 'written_reply',
    label: 'Surat atau tanggapan tertulis resmi dari platform',
    critical: false,
    note: 'Simpan versi lengkap, termasuk jawaban template.',
  },
];

const SOURCES = [
  {
    id: 'mk-voucher-3-bulan',
    label: 'Media Konsumen: voucher tidak bisa dipakai 3 bulan meski Star Seller dan tanpa poin penalti',
    publisher: 'Media Konsumen',
    date: '27 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/27/surat-pembaca/toko-shopee-saya-tidak-bisa-pakai-voucher-apa-pun-selama-3-bulan-padahal-star-seller-dan-tanpa-poin-penalti',
    facts: [
      'Penjual Shopee Ngalamngolshop berjualan sejak 9 tahun lalu dan berstatus Star Seller tanpa poin penalti.',
      'Pada 25 Juli 2026 penjual membuat harga coret, muncul peringatan penalti promosi, lalu voucher tidak bisa menempel.',
      'Lebih dari 30 hari kemudian voucher masih tidak menempel. Reset poin kuartal akhir September 2026 juga tidak membuka kunci.',
      'Promo berbayar Promo Extra dan Live Extra menerima pendaftaran, tetapi voucher tetap gagal dipakai saat checkout.',
      'Penjual sudah 8 kali chat CS dan jawabannya tetap menyebut aktivitas mencurigakan tanpa rincian.',
    ],
  },
  {
    id: 'mk-voucher-mati',
    label: 'Media Konsumen: toko tiba-tiba tidak bisa memakai voucher apa pun',
    publisher: 'Media Konsumen',
    date: '16 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/16/surat-pembaca/shopee-tiba-tiba-mematikan-toko-saya-tidak-bisa-nempel-voucher-apa-pun',
    facts: [
      'Toko toserbashakiel di Pasuruan berjualan hampir 10 tahun di kategori Makanan dan Minuman.',
      'Pada 12 Oktober 2026 voucher kategori masih bisa dipakai. Pada 13 Oktober 2026 akses voucher hilang dan status Star Seller dicabut tanpa peringatan.',
      'CS menyebut ada kejanggalan transaksi tanpa menunjukkan transaksi mana yang dimaksud.',
      'Penjual menduga lonjakan pesanan dari sekitar 100 menjadi 1.000 resi per hari setelah event 1 sampai 6 Oktober 2026 ikut memicu flag otomatis.',
      'Nomor laporan yang dicatat penjual: 2109830730719211531.',
    ],
  },
];

const DEFAULT_FACTS = {
  points: 'nol',
  warning: 'tidak',
  quarter_reset: 'belum',
  written_reason: 'tidak',
  star_seller_now: 'tidak',
};

const DEFAULTS = {
  platform: 'shopee',
  trigger: 'harga_coret',
  status: 'terkunci',
  facts: DEFAULT_FACTS,
  symptoms: ['voucher_instant', 'promo_berbayar', 'checkout_gagal'],
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;
  const cleaned = String(value).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.max(0, Math.round(toNumber(value)));
}

function wholeNumber(value) {
  return Math.max(0, Math.round(toNumber(value)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toISODate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return '';
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return '';
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

function formatRupiah(value) {
  return 'Rp ' + Math.round(toNumber(value)).toLocaleString('id-ID');
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, 4000);
}

function getPlatform(id) {
  return PLATFORMS.find((item) => item.id === id) || PLATFORMS[0];
}

function getTrigger(id) {
  return TRIGGERS.find((item) => item.id === id) || TRIGGERS[TRIGGERS.length - 1];
}

function getSymptom(id) {
  return SYMPTOMS.find((item) => item.id === id) || null;
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id) || null;
}

function normalizeSymptoms(input) {
  const raw = Array.isArray(input)
    ? input
    : (input && Array.isArray(input.symptoms) ? input.symptoms : []);
  return Array.from(new Set(raw.map((item) => String(item)).filter((id) => getSymptom(id))));
}

function normalizeFacts(input) {
  const raw = input && input.facts && typeof input.facts === 'object' ? input.facts : (input || {});
  const facts = {};
  Object.keys(FACT_OPTIONS).forEach((key) => {
    const allowed = FACT_OPTIONS[key].map((item) => item.id);
    const value = raw[key];
    facts[key] = allowed.indexOf(value) === -1 ? DEFAULT_FACTS[key] : value;
  });
  return facts;
}

function lockInput(input) {
  const data = input || {};
  return {
    price: money(data.price),
    cost: money(data.cost),
    unitsBefore: wholeNumber(data.units_before),
    unitsDuring: wholeNumber(data.units_during),
    adSpendPerDay: money(data.ad_spend_per_day),
    lockedDate: toISODate(data.locked_date),
    restoredDate: toISODate(data.restored_date),
    chatCount: wholeNumber(data.chat_count),
  };
}

function computeImpact(input, now = new Date()) {
  const v = lockInput(input);
  const today = todayISO(now);
  const endDate = v.restoredDate || today;
  const lockedDays = v.lockedDate ? Math.max(0, daysBetween(v.lockedDate, endDate)) : 0;
  const unitMargin = Math.max(0, v.price - v.cost);
  const lostUnitsPerDay = Math.max(0, v.unitsBefore - v.unitsDuring);
  const lostUnits = lostUnitsPerDay * lockedDays;
  const lostRevenue = lostUnits * v.price;
  const lostProfit = lostUnits * unitMargin;
  const adWaste = v.adSpendPerDay * lockedDays;
  const revenueDuring = v.unitsDuring * v.price * lockedDays;
  const normalRevenue = v.unitsBefore * v.price * lockedDays;
  const normalProfit = v.unitsBefore * unitMargin * lockedDays;
  const monthlyProfitBefore = v.unitsBefore * unitMargin * 30;
  const dailyProfitLost = lostUnitsPerDay * unitMargin;

  let severity = 'ringan';
  if (v.restoredDate) {
    severity = 'dibuka';
  } else if (lockedDays >= 30 || (monthlyProfitBefore > 0 && lostProfit >= monthlyProfitBefore)) {
    severity = 'kritis';
  } else if (lockedDays >= 7) {
    severity = 'signifikan';
  }

  return {
    price: v.price,
    cost: v.cost,
    unit_margin: unitMargin,
    units_before: v.unitsBefore,
    units_during: v.unitsDuring,
    ad_spend_per_day: v.adSpendPerDay,
    chat_count: v.chatCount,
    locked_date: v.lockedDate,
    restored_date: v.restoredDate,
    locked_days: lockedDays,
    lost_units_per_day: lostUnitsPerDay,
    lost_units: lostUnits,
    lost_revenue: lostRevenue,
    lost_profit: lostProfit,
    ad_waste: adWaste,
    revenue_during: revenueDuring,
    normal_revenue: normalRevenue,
    normal_profit: normalProfit,
    monthly_profit_before: monthlyProfitBefore,
    daily_profit_lost: dailyProfitLost,
    severity: severity,
  };
}

function severityLabel(severity) {
  const map = {
    dibuka: 'Kunci sudah dibuka',
    ringan: 'Dampak ringan',
    signifikan: 'Dampak signifikan',
    kritis: 'Dampak kritis',
  };
  return map[severity] || 'Belum dihitung';
}

function computeDiagnosis(input, impact) {
  const data = input || {};
  const facts = normalizeFacts(data);
  const symptoms = normalizeSymptoms(data.symptoms);
  const chatCount = wholeNumber(data.chat_count);
  const days = impact ? impact.locked_days : 0;
  let score = 0;
  const points = [];

  if (symptoms.length >= 1) {
    score += 10;
    points.push('Ada fitur promosi yang gagal dipakai (+10).');
  }
  if (symptoms.length >= 3) {
    score += 10;
    points.push('Gangguan terjadi di beberapa fitur promosi sekaligus (+10).');
  }
  if (symptoms.length >= 5) {
    score += 10;
    points.push('Pola gangguan luas, bukan satu voucher saja (+10).');
  }
  if (facts.points === 'nol') {
    score += 20;
    points.push('Poin penalti nol, sehingga kunci bukan akibat poin biasa (+20).');
  }
  if (facts.warning === 'ya') {
    score += 10;
    points.push('Ada peringatan penalti promosi sebelum kunci (+10).');
  }
  if (facts.quarter_reset === 'ya') {
    score += 15;
    points.push('Reset poin kuartal sudah lewat tetapi kunci bertahan (+15).');
  }
  if (facts.written_reason === 'tidak') {
    score += 10;
    points.push('Belum ada alasan tertulis yang bisa diuji (+10).');
  }
  if (chatCount >= 3) {
    score += 10;
    points.push('Sudah tiga kali atau lebih menghubungi CS (+10).');
  }
  if (chatCount >= 8) {
    score += 5;
    points.push('Sudah delapan kali atau lebih chat tanpa penyelesaian (+5).');
  }
  if (days >= 30) {
    score += 15;
    points.push('Kunci bertahan 30 hari atau lebih (+15).');
  }

  score = clamp(score, 0, 100);
  let verdict = 'lemah';
  let verdictLabel = 'Indikasi lemah';
  if (score >= 70) {
    verdict = 'kuat';
    verdictLabel = 'Indikasi kuat kunci promosi sistemik';
  } else if (score >= 40) {
    verdict = 'cukup';
    verdictLabel = 'Indikasi cukup, perlu bukti tambahan';
  }

  const trigger = getTrigger(data.trigger);
  let cause = 'Pemicu belum jelas';
  if (trigger.id === 'harga_coret' && facts.warning === 'ya') {
    cause = 'Penalti promosi karena harga coret';
  } else if (trigger.id === 'lonjakan_pesanan') {
    cause = 'Flag otomatis karena lonjakan transaksi';
  } else if (trigger.id === 'kata_kunci') {
    cause = 'Salah klasifikasi kata kunci otomatis';
  } else if (trigger.id === 'aktivitas_mencurigakan') {
    cause = 'Flag anti-fraud tanpa rincian transaksi';
  } else if (trigger.id === 'pelanggaran_produk') {
    cause = 'Pelanggaran produk yang perlu diperbaiki lebih dulu';
  } else if (trigger.id === 'harga_coret') {
    cause = 'Kemungkinan terkait harga coret, tetapi peringatan tidak tercatat';
  }

  return {
    score: score,
    verdict: verdict,
    verdict_label: verdictLabel,
    cause: cause,
    points: points,
    facts: facts,
    symptoms: symptoms,
    chat_count: chatCount,
    trigger: trigger.id,
    trigger_label: trigger.label,
    trigger_note: trigger.note,
  };
}

function readiness(input) {
  const data = input || {};
  const raw = Array.isArray(data.items) ? data.items : [];
  const checked = new Set(raw.map((item) => String(item)));
  const rows = EVIDENCE.map((item) => Object.assign({}, item, { checked: checked.has(item.id) }));

  let earned = 0;
  let total = 0;
  rows.forEach((item) => {
    const weight = item.critical ? 2 : 1;
    total += weight;
    if (item.checked) earned += weight;
  });

  const score = total > 0 ? Math.round(earned / total * 100) : 0;
  const missingCritical = rows.filter((item) => item.critical && !item.checked).map((item) => item.label);
  let verdict = 'belum';
  let verdictLabel = 'Belum siap';
  if (score >= 85 && missingCritical.length === 0) {
    verdict = 'siap';
    verdictLabel = 'Siap diajukan';
  } else if (score >= 55) {
    verdict = 'hampir';
    verdictLabel = 'Hampir siap';
  }

  return {
    score: score,
    verdict: verdict,
    verdict_label: verdictLabel,
    checked_count: rows.filter((item) => item.checked).length,
    total_count: rows.length,
    missing_critical: missingCritical,
    rows: rows,
  };
}

function buildRecommendations(input, impact, diagnosis) {
  const data = input || {};
  const facts = normalizeFacts(data);
  const symptoms = normalizeSymptoms(data.symptoms);
  const trigger = getTrigger(data.trigger);
  const list = [];

  list.push('Kirim satu tiket resmi berisi kronologi, gejala, nomor tiket lama, dan permintaan alasan tertulis. Minta nama tim yang menangani.');
  list.push('Minta tiga hal spesifik: penyebab kunci, perkiraan durasi, dan langkah yang harus dilakukan untuk membuka fitur promosi.');

  if (facts.points === 'nol' && facts.warning !== 'ya') {
    list.push('Poin penalti nol bukan berarti tidak ada kunci. Tanyakan mengapa fitur promosi tidak berfungsi meski tidak ada poin.');
  }
  if (facts.warning === 'ya') {
    list.push('Simpan screenshot peringatan penalti promosi. Tanyakan durasi hukuman dan apakah ada batas maksimal yang berlaku.');
  }
  if (facts.quarter_reset === 'ya') {
    list.push('Reset poin kuartal sudah lewat tetapi kunci bertahan. Minta pemeriksaan manual oleh tim anti-fraud, bukan jawaban template.');
  }
  if (trigger.id === 'harga_coret') {
    list.push('Siapkan riwayat harga dan bukti koreksi. Jika harga coret memang keliru, akui koreksinya dan minta durasi yang pasti.');
  }
  if (trigger.id === 'lonjakan_pesanan') {
    list.push('Lonjakan pesanan bukan pelanggaran. Minta daftar transaksi yang dianggap janggal beserta alasannya.');
  }
  if (trigger.id === 'kata_kunci') {
    list.push('Minta kategori dan kata kunci yang memicu flag. Perbaiki judul atau deskripsi bila memang ambigu.');
  }
  if (trigger.id === 'aktivitas_mencurigakan') {
    list.push('Minta rincian transaksi yang dianggap mencurigakan. Tanpa rincian, jawaban ini tidak bisa diuji.');
  }
  if (symptoms.indexOf('promo_berbayar') !== -1) {
    list.push('Simpan bukti pendaftaran Promo Extra atau Live Extra. Tanyakan status biaya program yang tidak berjalan sesuai keterangan.');
  }
  if (symptoms.indexOf('star_seller_hilang') !== -1) {
    list.push('Catat tanggal Star Seller hilang. Minta penjelasan apakah status dicabut karena kunci promosi atau karena performa.');
  }
  if (symptoms.indexOf('checkout_gagal') !== -1) {
    list.push('Rekam layar checkout yang menolak voucher. Ini bukti terkuat karena menunjukkan voucher tampil tetapi tidak bisa dipakai.');
  }
  if (impact.locked_days >= 7 && !impact.restored_date) {
    list.push('Kunci sudah berjalan ' + impact.locked_days + ' hari. Sertakan estimasi laba hilang ' + formatRupiah(impact.lost_profit) + ' dan omzet hilang ' + formatRupiah(impact.lost_revenue) + ' dalam eskalasi.');
  }
  if (impact.locked_days >= 30 && !impact.restored_date) {
    list.push('Lewat 30 hari tanpa alasan tertulis. Naikkan eskalasi ke pengawas platform dan pertimbangkan kanal pengaduan konsumen resmi.');
  }
  if (diagnosis.score < 40) {
    list.push('Indikasi masih lemah. Lengkapi bukti kritis sebelum mengirim eskalasi baru.');
  }

  return list;
}

function analyze(input, now = new Date()) {
  const data = input || {};
  const impact = computeImpact(data, now);

  if (impact.price <= 0) {
    return { error: 'Isi harga jual rata-rata lebih dari 0' };
  }
  if (String(data.locked_date || '').trim() && !impact.locked_date) {
    return { error: 'Tanggal kunci promosi tidak valid' };
  }
  if (!impact.locked_date) {
    return { error: 'Tanggal kunci promosi wajib diisi' };
  }
  const today = todayISO(now);
  if (impact.locked_date > today) {
    return { error: 'Tanggal kunci promosi tidak boleh melewati hari ini' };
  }
  if (String(data.restored_date || '').trim() && !impact.restored_date) {
    return { error: 'Tanggal kunci dibuka tidak valid' };
  }
  if (impact.restored_date && impact.restored_date < impact.locked_date) {
    return { error: 'Tanggal kunci dibuka tidak boleh sebelum tanggal kunci' };
  }
  if (impact.restored_date && impact.restored_date > today) {
    return { error: 'Tanggal kunci dibuka tidak boleh melewati hari ini' };
  }
  const symptoms = normalizeSymptoms(data.symptoms);
  if (symptoms.length === 0) {
    return { error: 'Pilih minimal satu gejala yang dialami' };
  }

  const platform = getPlatform(data.platform);
  const trigger = getTrigger(data.trigger);
  const status = getStatus(data.status);
  const diagnosis = computeDiagnosis(data, impact);
  const recs = buildRecommendations(data, impact, diagnosis);

  return {
    platform: platform.id,
    platform_name: platform.name,
    channel: platform.channel,
    platform_note: platform.note,
    trigger: trigger.id,
    trigger_label: trigger.label,
    trigger_note: trigger.note,
    status: status.id,
    status_label: status.label,
    status_next: status.next,
    impact: impact,
    severity_label: severityLabel(impact.severity),
    diagnosis: diagnosis,
    symptoms: symptoms.map((id) => getSymptom(id)),
    recommendations: recs,
    evidence: EVIDENCE.map((item) => Object.assign({}, item)),
    sources: SOURCES.slice(),
    disclaimer: 'Skor indikasi dan tingkat dampak adalah heuristik tool, bukan penilaian resmi marketplace. Semua angka uang berasal dari input Anda.',
  };
}

const STATUSES = [
  { id: 'terkunci', label: 'Fitur promosi terkunci', next: 'Kumpulkan bukti lalu kirim tiket resmi pertama.' },
  { id: 'lapor_cs', label: 'Sudah lapor CS', next: 'Catat nomor tiket dan minta alasan tertulis beserta durasi.' },
  { id: 'eskalasi', label: 'Eskalasi ke tim lanjutan', next: 'Minta pemeriksaan manual tim anti-fraud, bukan jawaban template.' },
  { id: 'ditinjau', label: 'Sedang ditinjau', next: 'Follow-up setiap tiga hari dan simpan semua tanggapan.' },
  { id: 'dibuka', label: 'Kunci dibuka', next: 'Uji voucher dan promo, lalu catat tanggal pulih.' },
  { id: 'ditolak', label: 'Permintaan ditolak', next: 'Minta alasan penolakan tertulis dan buka tiket baru dengan nomor berbeda.' },
];

function getStatus(id) {
  return STATUSES.find((item) => item.id === id) || STATUSES[0];
}

function validateCase(raw, now = new Date()) {
  const data = raw || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };

  const price = money(data.price);
  if (price <= 0) return { error: 'Harga jual rata-rata harus lebih dari 0' };

  const lockedDate = toISODate(data.locked_date);
  if (!lockedDate) return { error: 'Tanggal kunci promosi wajib diisi' };
  const today = todayISO(now);
  if (lockedDate > today) return { error: 'Tanggal kunci promosi tidak boleh melewati hari ini' };

  const restoredDate = toISODate(data.restored_date);
  if (String(data.restored_date || '').trim() && !restoredDate) return { error: 'Tanggal kunci dibuka tidak valid' };
  if (restoredDate && restoredDate < lockedDate) return { error: 'Tanggal kunci dibuka tidak boleh sebelum tanggal kunci' };
  if (restoredDate && restoredDate > today) return { error: 'Tanggal kunci dibuka tidak boleh melewati hari ini' };

  const lastFollowUp = toISODate(data.last_follow_up);
  if (String(data.last_follow_up || '').trim() && !lastFollowUp) return { error: 'Tanggal follow-up tidak valid' };
  if (lastFollowUp && lastFollowUp > today) return { error: 'Tanggal follow-up tidak boleh melewati hari ini' };

  const symptoms = normalizeSymptoms(data.symptoms);
  if (symptoms.length === 0) return { error: 'Pilih minimal satu gejala yang dialami' };

  const platform = getPlatform(data.platform);
  const trigger = getTrigger(data.trigger);
  const status = getStatus(data.status);
  const evidenceInput = Array.isArray(data.evidence) ? data.evidence : [];
  const validEvidence = evidenceInput.map((item) => String(item)).filter((id) => getEvidence(id));
  const facts = normalizeFacts(data);

  const item = {
    store_name: storeName,
    store_id: cleanLine(data.store_id, 100),
    platform: platform.id,
    trigger: trigger.id,
    trigger_text: cleanLine(data.trigger_text, 240),
    status: status.id,
    ticket: cleanLine(data.ticket, 120),
    locked_date: lockedDate,
    restored_date: restoredDate,
    last_follow_up: lastFollowUp,
    price: price,
    cost: money(data.cost),
    units_before: wholeNumber(data.units_before),
    units_during: wholeNumber(data.units_during),
    ad_spend_per_day: money(data.ad_spend_per_day),
    chat_count: wholeNumber(data.chat_count),
    symptoms: symptoms,
    facts: facts,
    note: cleanBlock(data.note),
    evidence: Array.from(new Set(validEvidence)),
  };

  return { item: item };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const platform = getPlatform(data.platform);
  const trigger = getTrigger(data.trigger);
  const status = getStatus(data.status);
  const impact = computeImpact(data, now);
  const diagnosis = computeDiagnosis(data, impact);
  const evidence = readiness({ items: data.evidence || [] });
  const today = todayISO(now);
  const endDate = data.restored_date || today;
  const agingDays = data.locked_date ? Math.max(0, daysBetween(data.locked_date, endDate)) : 0;
  const flags = [];

  if (status.id === 'ditolak') {
    flags.push('Permintaan ditolak. Minta alasan tertulis dan buka tiket baru dengan nomor berbeda.');
  }
  if (!data.restored_date && agingDays >= 30) {
    flags.push('Kunci sudah ' + agingDays + ' hari. Naikkan eskalasi tertulis dan sertakan estimasi kerugian.');
  }
  if (!data.restored_date && diagnosis.facts.quarter_reset === 'ya') {
    flags.push('Reset poin kuartal sudah lewat tetapi kunci bertahan. Minta audit manual tim anti-fraud.');
  }
  if (!data.restored_date && diagnosis.facts.points === 'nol' && agingDays >= 14) {
    flags.push('Poin nol tetapi kunci lebih dari 14 hari. Tekankan bahwa ini bukan poin penalti biasa.');
  }
  if (diagnosis.chat_count >= 5) {
    flags.push('Sudah ' + diagnosis.chat_count + ' chat CS. Minta eskalasi ke pengawas, bukan jawaban template berulang.');
  }
  if (diagnosis.score >= 70 && evidence.score < 55) {
    flags.push('Indikasi kuat tetapi bukti belum lengkap. Lengkapi bukti kritis sebelum mengirim eskalasi.');
  }
  if (impact.units_during >= impact.units_before && !data.restored_date && impact.units_before > 0) {
    flags.push('Penjualan harian tidak turun. Fokus pada kerugian akses promosi dan bukti voucher gagal, bukan angka omzet.');
  }

  return Object.assign({}, data, {
    platform_name: platform.name,
    channel: platform.channel,
    trigger_label: trigger.label,
    trigger_note: trigger.note,
    status_label: status.label,
    status_next: status.next,
    impact: impact,
    severity_label: severityLabel(impact.severity),
    diagnosis: diagnosis,
    readiness: evidence,
    aging_days: agingDays,
    aging_label: agingDays + ' hari' + (data.restored_date ? ' (dibuka)' : ''),
    flags: flags,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const openStatuses = new Set(['terkunci', 'lapor_cs', 'eskalasi', 'ditinjau', 'ditolak']);
  const open = views.filter((item) => openStatuses.has(item.status));
  const opened = views.filter((item) => item.status === 'dibuka');
  const rejected = views.filter((item) => item.status === 'ditolak');

  let lostProfit = 0;
  let lostRevenue = 0;
  let adWaste = 0;
  views.forEach((item) => {
    lostProfit += item.impact.lost_profit;
    lostRevenue += item.impact.lost_revenue;
    adWaste += item.impact.ad_waste;
  });

  let oldestOpen = 0;
  open.forEach((item) => {
    if (item.aging_days > oldestOpen) oldestOpen = item.aging_days;
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    opened_cases: opened.length,
    rejected_cases: rejected.length,
    total_lost_profit: lostProfit,
    total_lost_revenue: lostRevenue,
    total_ad_waste: adWaste,
    oldest_open_days: oldestOpen,
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };

  const platform = getPlatform(data.platform);
  const trigger = getTrigger(data.trigger);
  const impact = computeImpact(data, now);
  const diagnosis = computeDiagnosis(data, impact);
  const symptoms = normalizeSymptoms(data.symptoms);
  const symptomLabels = symptoms.length > 0
    ? symptoms.map((id) => '- ' + getSymptom(id).label)
    : ['- Voucher dan fitur promosi gagal dipakai'];
  const evidenceItems = Array.isArray(data.evidence) ? data.evidence.filter((id) => getEvidence(id)) : [];
  const evidenceLabels = evidenceItems.length > 0
    ? evidenceItems.map((id) => '- ' + getEvidence(id).label)
    : ['- Screenshot voucher yang tidak menempel', '- Rekaman layar checkout gagal', '- Screenshot poin penalti', '- Riwayat chat CS dan nomor tiket'];

  const facts = diagnosis.facts;
  const pointsLine = facts.points === 'nol'
    ? 'Halaman poin penalti menunjukkan 0 poin.'
    : facts.points === 'ada'
      ? 'Ada poin penalti yang tercatat dan perlu dijelaskan kaitannya dengan kunci promosi.'
      : 'Status poin penalti belum dapat dipastikan.';
  const warningLine = facts.warning === 'ya'
    ? 'Sebelum kunci terjadi, muncul peringatan penalti promosi.'
    : facts.warning === 'tidak'
      ? 'Tidak ada peringatan penalti promosi sebelum kunci terjadi.'
      : 'Penjual tidak mengingat adanya peringatan penalti promosi.';
  const resetLine = facts.quarter_reset === 'ya'
    ? 'Reset poin kuartal sudah lewat, tetapi fitur promosi tetap terkunci.'
    : facts.quarter_reset === 'belum'
      ? 'Reset poin kuartal belum lewat.'
      : 'Jadwal reset poin kuartal belum dipastikan.';

  const subject = 'Permohonan penjelasan tertulis dan pembukaan kunci fitur promosi toko ' + storeName;
  const lines = [
    'Kepada ' + platform.channel,
    '',
    'Perihal: ' + subject,
    '',
    'Dengan hormat,',
    '',
    'Saya ' + (cleanLine(data.seller_name, 80) || '[nama penjual]') + ', pemilik toko ' + storeName + ' dengan ID ' + (cleanLine(data.store_id, 100) || '[ID toko]') + ', mengajukan permohonan penjelasan tertulis dan pembukaan kunci fitur promosi.',
    '',
    '- Platform: ' + platform.name,
    '- Tanggal kunci mulai: ' + (impact.locked_date ? formatDateOnly(impact.locked_date) : '-'),
    '- Pemicu yang diketahui: ' + (cleanLine(data.trigger_text, 240) || trigger.label),
    '- Nomor tiket terakhir: ' + (cleanLine(data.ticket, 120) || '-'),
    '- Jumlah chat CS: ' + impact.chat_count,
    '',
    'Gejala yang dialami:',
  ];
  symptomLabels.forEach((line) => lines.push(line));

  lines.push(
    '',
    'Kronologi:',
    cleanBlock(data.chronology) || '-',
    '',
    'Fakta pendukung:',
    '1. ' + pointsLine,
    '2. ' + warningLine,
    '3. ' + resetLine,
    '4. Fitur promosi sudah terkunci ' + impact.locked_days + ' hari. Rata-rata penjualan turun dari ' + impact.units_before + ' menjadi ' + impact.units_during + ' unit per hari.',
    '5. Estimasi omzet yang hilang ' + formatRupiah(impact.lost_revenue) + ' dan laba yang hilang ' + formatRupiah(impact.lost_profit) + '.',
    '',
    'Kami meminta:',
    '1. Penjelasan tertulis mengenai penyebab fitur promosi terkunci.',
    '2. Perkiraan durasi kunci dan syarat yang harus dipenuhi untuk membukanya.',
    '3. Pemeriksaan manual oleh tim anti-fraud atau tim terkait, bukan jawaban template.',
    '4. Bukti atau rincian transaksi yang dianggap mencurigakan bila alasan yang diberikan adalah aktivitas mencurigakan.',
    '5. Keputusan tertulis dengan nomor tiket yang dapat kami tindak lanjuti.',
    '',
    'Bukti yang dilampirkan:',
  );
  evidenceLabels.forEach((line) => lines.push(line));
  lines.push(
    '',
    'Kami berkomitmen mengikuti ketentuan yang berlaku dan meminta kepastian tertulis atas hasil pemeriksaan.',
    '',
    'Hormat kami,',
    (cleanLine(data.seller_name, 80) || '[nama penjual]'),
    (cleanLine(data.contact, 100) || '[email atau telepon]'),
    formatTodayID(now),
  );

  return {
    subject: subject,
    body: lines.join('\n'),
    platform_name: platform.name,
    channel: platform.channel,
    disclaimer: 'Surat ini bukan nasihat hukum. Sesuaikan dengan fakta dan syarat layanan marketplace.',
  };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  return {
    platform: 'shopee',
    trigger: 'harga_coret',
    trigger_text: 'Membuat harga coret pada 25 Juli 2026, muncul peringatan penalti promosi',
    status: 'eskalasi',
    store_name: 'Ngalamngolshop',
    store_id: 'ngalamngolshop',
    ticket: 'TIKET-CONTOH-001',
    locked_date: addDays(today, -95),
    restored_date: '',
    last_follow_up: addDays(today, -2),
    price: 65000,
    cost: 52000,
    units_before: 40,
    units_during: 24,
    ad_spend_per_day: 20000,
    chat_count: 8,
    symptoms: ['voucher_instant', 'promo_berbayar', 'checkout_gagal', 'star_seller_hilang'],
    facts: {
      points: 'nol',
      warning: 'ya',
      quarter_reset: 'ya',
      written_reason: 'tidak',
      star_seller_now: 'tidak',
    },
    note: 'Contoh dari Media Konsumen 27 Oktober 2026. Angka ekonomi adalah ilustrasi, bukan data dari artikel.',
    evidence: ['voucher_screenshot', 'checkout_recording', 'points_zero', 'chat_tickets', 'trigger_evidence', 'star_history', 'program_list', 'sales_before_after'],
    seller_name: 'Penjual Contoh',
    contact: 'email@contoh.com',
    chronology: 'Pada 25 Juli 2026 saya membuat harga coret dan muncul peringatan penalti promosi. Setelah itu voucher instant dan voucher program berbayar tidak bisa menempel. Reset poin kuartal akhir September 2026 sudah lewat, tetapi kunci bertahan. CS menyebut aktivitas mencurigakan tanpa rincian.',
  };
}

module.exports = {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computeDiagnosis,
  computeImpact,
  daysBetween,
  addDays,
  formatDateOnly,
  formatRupiah,
  formatTodayID,
  normalizeFacts,
  normalizeSymptoms,
  readiness,
  summary,
  todayISO,
  validateCase,
  DEFAULTS,
  EVIDENCE,
  FACT_OPTIONS,
  PLATFORMS,
  SOURCES,
  STATUSES,
  SYMPTOMS,
  TRIGGERS,
};
