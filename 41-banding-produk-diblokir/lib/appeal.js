// Product takedown appeal logic for Indonesian marketplace sellers.
// All money figures come from seller input. No marketplace rate or deadline is invented.

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    name: 'Shopee',
    channel: 'Pusat Resolusi Shopee',
    note: 'Simpan nomor tiket dan screenshot notifikasi. Kasus 24 Oktober 2026 menunjukkan produk bisa dihapus otomatis lalu toko dibekukan.',
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
    note: 'Catat alasan penolakan dan kategori yang dipakai sistem, bukan hanya jawaban chat.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    channel: 'Pusat Bantuan Lazada',
    note: 'Minta keputusan tertulis dan nomor tiket untuk setiap banding.',
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
    note: 'Sesuaikan jalur banding dengan panduan marketplace yang dipakai.',
  },
];

const REASONS = [
  {
    id: 'nikotin',
    label: 'Nikotin, tembakau, rokok elektronik, atau shisha',
    note: 'Sering muncul karena salah klasifikasi kata kunci. Cek apakah produk benar-benar terkait.',
  },
  {
    id: 'obat',
    label: 'Obat, suplemen, atau alat kesehatan',
    note: 'Siapkan izin edar bila produk memang termasuk kategori ini.',
  },
  {
    id: 'kosmetik',
    label: 'Kosmetik atau pangan tanpa izin edar',
    note: 'Siapkan nomor BPOM atau izin edar yang berlaku.',
  },
  {
    id: 'senjata',
    label: 'Senjata, benda tajam, atau barang berbahaya',
    note: 'Cek deskripsi dan foto produk, termasuk aksesori yang mungkin terlihat berbahaya.',
  },
  {
    id: 'palsu',
    label: 'Produk palsu atau pelanggaran merek',
    note: 'Siapkan invoice supplier, surat izin distributor, atau bukti keaslian.',
  },
  {
    id: 'kategori_salah',
    label: 'Salah kategori atau atribut produk',
    note: 'Perbaiki kategori dan atribut, lalu ajukan pemulihan.',
  },
  {
    id: 'mencurigakan',
    label: 'Aktivitas mencurigakan tanpa rincian',
    note: 'Minta penjelasan tertulis karena alasan ini tidak menunjukkan produk atau aturan yang dilanggar.',
  },
  {
    id: 'lainnya',
    label: 'Alasan lain',
    note: 'Tulis alasan persis seperti yang muncul di Seller Center.',
  },
];

const STATUSES = [
  { id: 'dihapus', label: 'Produk dihapus', next: 'Minta alasan tertulis dan catat nomor tiket.' },
  { id: 'banding', label: 'Banding diajukan', next: 'Simpan bukti pengiriman banding dan nomor tiket.' },
  { id: 'ditinjau', label: 'Sedang ditinjau', next: 'Catat tanggal follow-up dan minta batas waktu.' },
  { id: 'ditinjau_ulang', label: 'Ditinjau ulang setelah penolakan', next: 'Lengkapi bukti baru dan minta peninjauan manual.' },
  { id: 'dipulihkan', label: 'Produk dipulihkan', next: 'Cek kembali judul, foto, kategori, dan status toko.' },
  { id: 'ditolak', label: 'Banding ditolak', next: 'Minta alasan penolakan tertulis lalu eskalasi.' },
  { id: 'ditutup', label: 'Toko ditutup permanen', next: 'Simpan semua bukti dan ajukan eskalasi tertulis.' },
];

const FACT_OPTIONS = {
  reason_matches: [
    { id: 'tidak', label: 'Tidak, produk tidak mengandung atau melakukan hal yang dituduhkan' },
    { id: 'tidak_yakin', label: 'Belum yakin, perlu dicek ulang' },
    { id: 'ya', label: 'Ya, produk memang terkait hal yang dituduhkan' },
  ],
  listing_unchanged: [
    { id: 'ya', label: 'Ya, tidak ada perubahan judul, deskripsi, foto, atau kategori' },
    { id: 'tidak', label: 'Tidak, ada perubahan sebelum produk dihapus' },
    { id: 'tidak_tahu', label: 'Tidak tahu' },
  ],
  permit: [
    { id: 'tidak_berlaku', label: 'Tidak berlaku untuk produk ini' },
    { id: 'ada', label: 'Ada dan masih berlaku' },
    { id: 'tidak_ada', label: 'Tidak ada' },
  ],
  written_reason: [
    { id: 'ya', label: 'Ya, alasan tertulis sudah diterima' },
    { id: 'tidak', label: 'Belum, baru jawaban chat atau sistem' },
  ],
  similar_active: [
    { id: 'ya', label: 'Ya, ada produk sejenis yang masih aktif' },
    { id: 'tidak', label: 'Tidak ada atau tidak dicek' },
  ],
  forced_statement: [
    { id: 'tidak', label: 'Tidak ada surat pernyataan' },
    { id: 'ya', label: 'Ya, saya diminta menandatangani surat pernyataan' },
  ],
};

const EVIDENCE = [
  {
    id: 'reason_screenshot',
    label: 'Screenshot notifikasi atau alasan penghapusan',
    critical: true,
    note: 'Pastikan nama produk, tanggal, dan alasan terlihat.',
  },
  {
    id: 'listing_before',
    label: 'Screenshot listing sebelum dihapus: judul, deskripsi, foto, kategori',
    critical: true,
    note: 'Ambil dari riwayat atau arsip. Ini bukti produk tidak berubah.',
  },
  {
    id: 'product_photo',
    label: 'Foto produk asli dan label kemasan',
    critical: true,
    note: 'Tunjukkan bentuk, bahan, dan keterangan yang relevan.',
  },
  {
    id: 'invoice',
    label: 'Invoice atau nota pembelian dari supplier',
    critical: true,
    note: 'Membuktikan asal barang dan nilai modal.',
  },
  {
    id: 'permit',
    label: 'Izin edar, BPOM, halal, atau dokumen pendukung lain bila berlaku',
    critical: true,
    note: 'Lampirkan hanya jika produk memang memerlukan izin.',
  },
  {
    id: 'edit_history',
    label: 'Bukti riwayat edit atau tidak ada perubahan listing',
    critical: false,
    note: 'Screenshot halaman riwayat produk bila tersedia.',
  },
  {
    id: 'buyer_reviews',
    label: 'Ulasan atau foto pembeli yang menunjukkan produk sesuai deskripsi',
    critical: false,
    note: 'Sensor nama dan data pribadi pembeli.',
  },
  {
    id: 'ticket',
    label: 'Nomor tiket dan screenshot percakapan dengan CS',
    critical: false,
    note: 'Satu nomor tiket untuk satu masalah. Catat nomor baru bila laporan dibuka ulang.',
  },
  {
    id: 'appeal_history',
    label: 'Semua banding dan jawaban yang pernah dikirim',
    critical: false,
    note: 'Termasuk tanggal kirim, nomor tiket, dan alasan penolakan.',
  },
  {
    id: 'statement_copy',
    label: 'Salinan surat pernyataan yang diminta platform',
    critical: false,
    note: 'Simpan versi lengkap dan catat siapa yang menyusun isinya.',
  },
  {
    id: 'similar_listing',
    label: 'Screenshot produk sejenis yang masih aktif',
    critical: false,
    note: 'Sensor nama toko lain. Fokus pada kategori dan deskripsi.',
  },
  {
    id: 'business_legality',
    label: 'NIB, izin usaha, atau dokumen legalitas toko',
    critical: false,
    note: 'Menunjukkan toko beroperasi secara resmi.',
  },
  {
    id: 'chronology',
    label: 'Kronologi tertulis dengan tanggal dan jam',
    critical: false,
    note: 'Tulis fakta saja, tanpa tuduhan.',
  },
];

const SOURCES = [
  {
    id: 'mk-kapas-nikotin',
    label: 'Media Konsumen: toko 7 tahun ditutup karena kapas bayi dianggap produk nikotin',
    publisher: 'Media Konsumen',
    date: '24 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/24/surat-pembaca/toko-shopee-7-tahun-ditutup-permanen-karena-kapas-bayi-dianggap-produk-nikotin-banding-ditolak',
    facts: [
      'Produk kapas bayi dihapus karena dianggap mengandung tembakau, nikotin, rokok elektronik, dan shisha.',
      'Toko dipulihkan 17 Oktober 2026 setelah penjual menandatangani surat pernyataan, lalu ditutup permanen 19 Oktober 2026.',
      'Penjual tidak mengubah atau mengunggah produk baru pada periode tersebut.',
    ],
  },
  {
    id: 'mk-semua-produk-hilang',
    label: 'Media Konsumen: semua produk dihapus tanpa alasan jelas setelah 9 tahun berjualan',
    publisher: 'Media Konsumen',
    date: '22 Juli 2026',
    url: 'https://mediakonsumen.com/2026/07/22/surat-pembaca/semua-produk-dihapus-tanpa-alasan-jelas-padahal-sudah-9-tahun-berjualan-di-shopee',
    facts: [
      'Seluruh produk tidak muncul di pencarian.',
      'CS menyebut indikasi aktivitas mencurigakan tanpa menjelaskan indikasi tersebut.',
      'Penjual meminta pemulihan produk dan kejelasan alasan.',
    ],
  },
];

const DEFAULT_FACTS = {
  reason_matches: 'tidak_yakin',
  listing_unchanged: 'ya',
  permit: 'tidak_berlaku',
  written_reason: 'tidak',
  similar_active: 'tidak',
  forced_statement: 'tidak',
};

const DEFAULTS = {
  platform: 'shopee',
  reason: 'nikotin',
  status: 'dihapus',
  facts: DEFAULT_FACTS,
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

function getReason(id) {
  return REASONS.find((item) => item.id === id) || REASONS[REASONS.length - 1];
}

function getStatus(id) {
  return STATUSES.find((item) => item.id === id) || STATUSES[0];
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id) || null;
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

function impactInput(input) {
  const data = input || {};
  return {
    price: money(data.price),
    cost: money(data.cost),
    stockUnits: wholeNumber(data.stock_units),
    unitsPerDay: wholeNumber(data.units_per_day),
    adSpendPerDay: money(data.ad_spend_per_day),
    removedDate: toISODate(data.removed_date),
    restoredDate: toISODate(data.restored_date),
  };
}

function computeImpact(input, now = new Date()) {
  const v = impactInput(input);
  const today = todayISO(now);
  const endDate = v.restoredDate || today;
  const offlineDays = v.removedDate ? Math.max(0, daysBetween(v.removedDate, endDate)) : 0;
  const unitMargin = Math.max(0, v.price - v.cost);
  const lostUnits = v.unitsPerDay * offlineDays;
  const lostRevenue = v.price * lostUnits;
  const lostProfit = unitMargin * lostUnits;
  const stockValue = v.cost * v.stockUnits;
  const adWaste = v.adSpendPerDay * offlineDays;
  const operatingLoss = lostProfit + adWaste;
  const totalExposure = operatingLoss + stockValue;
  const dailyCost = unitMargin * v.unitsPerDay + v.adSpendPerDay;

  let severity = 'ringan';
  if (v.restoredDate) {
    severity = 'terpulih';
  } else if (offlineDays >= 30 || (dailyCost > 0 && operatingLoss >= dailyCost * 30)) {
    severity = 'kritis';
  } else if (offlineDays >= 7 || (dailyCost > 0 && operatingLoss >= dailyCost * 7)) {
    severity = 'signifikan';
  }

  return {
    price: v.price,
    cost: v.cost,
    unit_margin: unitMargin,
    stock_units: v.stockUnits,
    units_per_day: v.unitsPerDay,
    ad_spend_per_day: v.adSpendPerDay,
    removed_date: v.removedDate,
    restored_date: v.restoredDate,
    offline_days: offlineDays,
    lost_units: lostUnits,
    lost_revenue: lostRevenue,
    lost_profit: lostProfit,
    stock_value: stockValue,
    ad_waste: adWaste,
    operating_loss: operatingLoss,
    daily_cost: dailyCost,
    total_exposure: totalExposure,
    severity: severity,
  };
}

function severityLabel(severity) {
  const map = {
    terpulih: 'Sudah pulih',
    ringan: 'Dampak ringan',
    signifikan: 'Dampak signifikan',
    kritis: 'Dampak kritis',
  };
  return map[severity] || 'Belum dihitung';
}

function computeArgument(input) {
  const data = input || {};
  const facts = normalizeFacts(data);
  let score = 0;
  const points = [];

  if (facts.reason_matches === 'tidak') {
    score += 30;
    points.push('Produk dinyatakan tidak terkait hal yang dituduhkan (+30).');
  } else if (facts.reason_matches === 'tidak_yakin') {
    score += 10;
    points.push('Status produk belum dipastikan, perlu penjelasan tertulis (+10).');
  }

  if (facts.listing_unchanged === 'ya') {
    score += 15;
    points.push('Listing tidak berubah sebelum dihapus (+15).');
  }
  if (facts.permit === 'ada') {
    score += 15;
    points.push('Izin atau dokumen pendukung tersedia (+15).');
  } else if (facts.permit === 'tidak_berlaku') {
    score += 10;
    points.push('Produk tidak memerlukan izin khusus (+10).');
  }
  if (facts.written_reason === 'ya') {
    score += 15;
    points.push('Alasan tertulis dari platform tersedia (+15).');
  }
  if (facts.similar_active === 'ya') {
    score += 10;
    points.push('Ada produk sejenis yang masih aktif (+10).');
  }
  if (facts.forced_statement === 'tidak') {
    score += 15;
    points.push('Tidak ada surat pernyataan yang memberatkan (+15).');
  }

  score = clamp(score, 0, 100);
  let verdict = 'lemah';
  let verdictLabel = 'Argumen lemah';
  if (score >= 80) {
    verdict = 'kuat';
    verdictLabel = 'Argumen kuat';
  } else if (score >= 50) {
    verdict = 'cukup';
    verdictLabel = 'Argumen cukup';
  }

  return {
    score: score,
    verdict: verdict,
    verdict_label: verdictLabel,
    points: points,
    facts: facts,
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

function recommendations(input, impact, argument) {
  const data = input || {};
  const facts = normalizeFacts(data);
  const status = getStatus(data.status);
  const list = [];

  if (facts.reason_matches === 'ya') {
    list.push('Produk memang terkait kategori yang dibatasi. Fokus pada perbaikan listing dan ajukan pemulihan setelah produk sesuai aturan, bukan menyangkal.');
  } else if (facts.reason_matches === 'tidak') {
    list.push('Minta peninjauan manual dan koreksi kategori. Jangan menandatangani surat pernyataan yang mengakui pelanggaran yang tidak dilakukan.');
  }

  if (facts.written_reason !== 'ya') {
    list.push('Minta alasan tertulis dan dasar kategori atau ketentuan yang dipakai. Jawaban chat saja tidak cukup untuk menyusun banding.');
  }
  if (facts.listing_unchanged === 'ya') {
    list.push('Screenshot riwayat edit untuk menunjukkan tidak ada perubahan judul, deskripsi, foto, atau kategori.');
  }
  if (facts.similar_active === 'ya') {
    list.push('Screenshot produk sejenis yang masih aktif sebagai pembanding. Sensor nama toko lain.');
  }
  if (facts.permit === 'ada') {
    list.push('Lampirkan izin edar, BPOM, halal, atau dokumen pendukung lain yang masih berlaku.');
  }
  if (facts.forced_statement === 'ya') {
    list.push('Simpan salinan surat pernyataan yang diminta. Catat bahwa isi surat dibuat oleh platform dan tandatangani karena akses toko sedang diblokir.');
  }
  if (status.id === 'ditolak') {
    list.push('Minta alasan penolakan tertulis, buka tiket baru dengan nomor berbeda, lalu eskalasi ke pengawas marketplace.');
  }
  if (status.id === 'ditutup') {
    list.push('Siapkan berkas eskalasi lengkap karena akses toko sudah ditutup permanen. Sertakan kronologi, bukti produk, dan seluruh nomor tiket.');
  }
  if (impact.offline_days >= 7 && !impact.restored_date) {
    list.push('Listing sudah hilang ' + impact.offline_days + ' hari. Sertakan estimasi laba hilang ' + formatRupiah(impact.lost_profit) + ' dan modal tertahan ' + formatRupiah(impact.stock_value) + ' dalam eskalasi.');
  }
  if (argument.score < 50) {
    list.push('Argumen masih lemah. Lengkapi bukti kritis sebelum mengirim banding baru.');
  }
  if (list.length === 0) {
    list.push('Catat nomor tiket, simpan bukti produk, dan kirim banding secara tertulis.');
  }
  return list;
}

function analyze(input, now = new Date()) {
  const data = input || {};
  const impact = computeImpact(data, now);
  if (impact.price <= 0) {
    return { error: 'Isi harga jual lebih dari 0' };
  }
  const today = todayISO(now);
  const removedDate = toISODate(data.removed_date);
  const restoredDate = toISODate(data.restored_date);

  if (String(data.removed_date || '').trim() && !removedDate) {
    return { error: 'Tanggal produk dihapus tidak valid' };
  }
  if (!removedDate) {
    return { error: 'Tanggal produk dihapus wajib diisi' };
  }
  if (removedDate > today) {
    return { error: 'Tanggal produk dihapus tidak boleh melewati hari ini' };
  }
  if (String(data.restored_date || '').trim() && !restoredDate) {
    return { error: 'Tanggal dipulihkan tidak valid' };
  }
  if (restoredDate && restoredDate < removedDate) {
    return { error: 'Tanggal dipulihkan tidak boleh sebelum tanggal dihapus' };
  }

  const platform = getPlatform(data.platform);
  const reason = getReason(data.reason);
  const status = getStatus(data.status);
  const argument = computeArgument(data);
  const recs = recommendations(data, impact, argument);

  return {
    platform: platform.id,
    platform_name: platform.name,
    channel: platform.channel,
    platform_note: platform.note,
    reason: reason.id,
    reason_label: reason.label,
    reason_note: reason.note,
    status: status.id,
    status_label: status.label,
    status_next: status.next,
    impact: impact,
    severity_label: severityLabel(impact.severity),
    argument: argument,
    recommendations: recs,
    evidence: EVIDENCE.map((item) => Object.assign({}, item)),
    sources: SOURCES.slice(),
    disclaimer: 'Skor argumen dan tingkat dampak adalah heuristik tool, bukan penilaian resmi marketplace. Semua angka uang berasal dari input Anda.',
  };
}

function validateCase(raw, now = new Date()) {
  const data = raw || {};
  const productName = cleanLine(data.product_name, 120);
  if (!productName) return { error: 'Nama produk wajib diisi' };

  const price = money(data.price);
  if (price <= 0) return { error: 'Harga jual harus lebih dari 0' };

  const removedDate = toISODate(data.removed_date);
  if (!removedDate) return { error: 'Tanggal produk dihapus wajib diisi' };
  const today = todayISO(now);
  if (removedDate > today) return { error: 'Tanggal produk dihapus tidak boleh melewati hari ini' };

  const appealDate = toISODate(data.appeal_date);
  if (String(data.appeal_date || '').trim() && !appealDate) return { error: 'Tanggal banding tidak valid' };
  if (appealDate && appealDate < removedDate) return { error: 'Tanggal banding tidak boleh sebelum tanggal dihapus' };

  const restoredDate = toISODate(data.restored_date);
  if (String(data.restored_date || '').trim() && !restoredDate) return { error: 'Tanggal dipulihkan tidak valid' };
  if (restoredDate && restoredDate < removedDate) return { error: 'Tanggal dipulihkan tidak boleh sebelum tanggal dihapus' };
  if (restoredDate && restoredDate > today) return { error: 'Tanggal dipulihkan tidak boleh melewati hari ini' };

  const lastFollowUp = toISODate(data.last_follow_up);
  if (String(data.last_follow_up || '').trim() && !lastFollowUp) return { error: 'Tanggal follow-up tidak valid' };

  const platform = getPlatform(data.platform);
  const reason = getReason(data.reason);
  const status = getStatus(data.status);
  const evidenceInput = Array.isArray(data.evidence) ? data.evidence : [];
  const validEvidence = evidenceInput.map((item) => String(item)).filter((id) => getEvidence(id));

  const item = {
    product_name: productName,
    sku: cleanLine(data.sku, 80),
    category: cleanLine(data.category, 80),
    platform: platform.id,
    reason: reason.id,
    reason_text: cleanLine(data.reason_text, 240),
    status: status.id,
    price: price,
    cost: money(data.cost),
    stock_units: wholeNumber(data.stock_units),
    units_per_day: wholeNumber(data.units_per_day),
    ad_spend_per_day: money(data.ad_spend_per_day),
    removed_date: removedDate,
    appeal_date: appealDate,
    restored_date: restoredDate,
    last_follow_up: lastFollowUp,
    ticket: cleanLine(data.ticket, 100),
    note: cleanBlock(data.note),
    facts: normalizeFacts(data),
    evidence: Array.from(new Set(validEvidence)),
  };

  return { item: item };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const platform = getPlatform(data.platform);
  const reason = getReason(data.reason);
  const status = getStatus(data.status);
  const impact = computeImpact(data, now);
  const argument = computeArgument(data);
  const evidence = readiness({ items: data.evidence || [] });
  const today = todayISO(now);
  const endDate = data.restored_date || today;
  const agingDays = data.removed_date ? Math.max(0, daysBetween(data.removed_date, endDate)) : 0;
  const flags = [];

  if (status.id === 'ditolak') {
    flags.push('Banding ditolak. Minta alasan tertulis dan buka tiket baru dengan nomor berbeda.');
  }
  if (status.id === 'ditutup') {
    flags.push('Toko ditutup permanen. Siapkan berkas eskalasi lengkap dan simpan semua nomor tiket.');
  }
  if (!data.restored_date && agingDays >= 30) {
    flags.push('Produk sudah hilang ' + agingDays + ' hari tanpa pemulihan. Naikkan eskalasi tertulis.');
  }
  if (argument.facts.forced_statement === 'ya') {
    flags.push('Ada surat pernyataan yang diminta platform. Simpan salinannya dan catat konteks penandatanganan.');
  }
  if (argument.score >= 80 && evidence.score < 55) {
    flags.push('Argumen kuat tetapi bukti belum lengkap. Lengkapi bukti kritis sebelum mengirim banding.');
  }
  if (argument.facts.reason_matches === 'ya') {
    flags.push('Produk memang terkait kategori yang dibatasi. Fokus pada perbaikan listing, bukan menyangkal.');
  }

  return Object.assign({}, data, {
    platform_name: platform.name,
    channel: platform.channel,
    reason_label: reason.label,
    status_label: status.label,
    status_next: status.next,
    impact: impact,
    severity_label: severityLabel(impact.severity),
    argument: argument,
    readiness: evidence,
    aging_days: agingDays,
    aging_label: agingDays + ' hari' + (data.restored_date ? ' (pulih)' : ''),
    flags: flags,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const openStatuses = new Set(['dihapus', 'banding', 'ditinjau', 'ditinjau_ulang', 'ditolak']);
  const open = views.filter((item) => openStatuses.has(item.status));
  const restored = views.filter((item) => item.status === 'dipulihkan');
  const permanent = views.filter((item) => item.status === 'ditutup');

  let lostProfit = 0;
  let stockValue = 0;
  let adWaste = 0;
  let exposure = 0;
  views.forEach((item) => {
    lostProfit += item.impact.lost_profit;
    stockValue += item.impact.stock_value;
    adWaste += item.impact.ad_waste;
    exposure += item.impact.total_exposure;
  });

  let oldestOpen = 0;
  open.forEach((item) => {
    if (item.aging_days > oldestOpen) oldestOpen = item.aging_days;
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    restored_cases: restored.length,
    permanent_cases: permanent.length,
    total_lost_profit: lostProfit,
    total_stock_value: stockValue,
    total_ad_waste: adWaste,
    total_exposure: exposure,
    oldest_open_days: oldestOpen,
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const productName = cleanLine(data.product_name, 120);
  if (!productName) return { error: 'Nama produk wajib diisi' };

  const platform = getPlatform(data.platform);
  const reason = getReason(data.reason);
  const removedDate = toISODate(data.removed_date);
  const facts = normalizeFacts(data);
  const impact = computeImpact(data, now);
  const evidenceItems = Array.isArray(data.evidence) ? data.evidence.filter((id) => getEvidence(id)) : [];
  const evidenceLabels = evidenceItems.length > 0
    ? evidenceItems.map((id) => '- ' + getEvidence(id).label)
    : ['- Screenshot notifikasi atau alasan penghapusan', '- Screenshot listing sebelum dihapus', '- Foto produk dan label', '- Invoice atau nota pembelian'];

  let stance = 'Kami meminta penjelasan tertulis agar dapat memastikan kesesuaian produk dengan ketentuan yang berlaku.';
  if (facts.reason_matches === 'tidak') {
    stance = 'Produk ini tidak mengandung atau melakukan hal yang dituduhkan. Judul, deskripsi, foto, dan kategori tidak diubah sebelum penghapusan.';
  } else if (facts.reason_matches === 'ya') {
    stance = 'Kami memahami produk ini terkait kategori yang dibatasi. Kami memohon arahan perbaikan dan peninjauan setelah perbaikan dilakukan.';
  }

  const permitLine = facts.permit === 'ada'
    ? 'Dokumen izin atau pendukung yang berlaku tersedia dan dilampirkan.'
    : facts.permit === 'tidak_berlaku'
      ? 'Produk ini tidak memerlukan izin edar khusus.'
      : 'Dokumen izin belum tersedia dan akan dilengkapi bila diminta.';

  const statementLine = facts.forced_statement === 'ya'
    ? 'Kami juga meminta salinan surat pernyataan yang diminta platform dicatat sebagai dokumen terpisah, karena isi surat dibuat oleh platform saat akses toko sedang dibatasi.'
    : '';

  const subject = 'Permohonan peninjauan manual dan pemulihan produk ' + productName;
  const lines = [
    'Kepada ' + platform.channel,
    '',
    'Perihal: ' + subject,
    '',
    'Dengan hormat,',
    '',
    'Saya ' + (cleanLine(data.seller_name, 80) || '[nama penjual]') + ', pemilik toko ' + (cleanLine(data.store_name, 80) || '[nama toko]') + ' dengan ID ' + (cleanLine(data.store_id, 80) || '[ID toko]') + ', mengajukan permohonan peninjauan manual atas produk berikut:',
    '',
    '- Nama produk: ' + productName,
    '- SKU: ' + (cleanLine(data.sku, 80) || '-'),
    '- Kategori terdaftar: ' + (cleanLine(data.category, 80) || '-'),
    '- Tanggal produk dihapus: ' + (removedDate ? formatDateOnly(removedDate) : '-'),
    '- Alasan yang diberikan: ' + (cleanLine(data.reason_text, 240) || reason.label),
    '- Nomor tiket: ' + (cleanLine(data.ticket, 100) || '-'),
    '',
    'Kronologi:',
    cleanBlock(data.chronology) || '-',
    '',
    'Dasar permohonan:',
    '1. ' + stance,
    '2. ' + permitLine,
    '3. Produk ini memiliki ' + formatRupiah(impact.price) + ' harga jual dan ' + impact.stock_units + ' unit stok. Selama listing hilang, estimasi laba yang tertahan adalah ' + formatRupiah(impact.lost_profit) + '.',
  ];

  if (statementLine) lines.push('4. ' + statementLine);

  lines.push(
    '',
    'Kami meminta:',
    '1. Alasan tertulis dan dasar kategori atau ketentuan yang digunakan.',
    '2. Peninjauan manual oleh petugas, bukan hanya keputusan sistem otomatis.',
    '3. Pemulihan produk bila produk terbukti tidak melanggar ketentuan.',
    '4. Keputusan tertulis dengan nomor tiket yang dapat kami tindak lanjuti.',
    '',
    'Bukti yang dilampirkan:',
  );
  evidenceLabels.forEach((line) => lines.push(line));
  lines.push(
    '',
    'Demikian permohonan ini kami sampaikan. Kami berkomitmen mengikuti ketentuan yang berlaku dan meminta kepastian tertulis atas hasil peninjauan.',
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
    reason: 'nikotin',
    reason_text: 'Produk dianggap mengandung tembakau, nikotin, rokok elektronik, dan shisha',
    product_name: 'Kapas bayi Medisoft',
    sku: 'MEDISOFT-100',
    category: 'Perlengkapan bayi',
    price: 45000,
    cost: 32000,
    stock_units: 120,
    units_per_day: 8,
    ad_spend_per_day: 15000,
    removed_date: addDays(today, -10),
    appeal_date: addDays(today, -9),
    restored_date: '',
    last_follow_up: addDays(today, -2),
    status: 'ditutup',
    ticket: 'TIKET-CONTOH-001',
    note: 'Contoh dari Media Konsumen 24 Oktober 2026. Angka ekonomi adalah ilustrasi, bukan data dari artikel.',
    facts: {
      reason_matches: 'tidak',
      listing_unchanged: 'ya',
      permit: 'tidak_berlaku',
      written_reason: 'tidak',
      similar_active: 'ya',
      forced_statement: 'ya',
    },
    evidence: ['reason_screenshot', 'listing_before', 'product_photo', 'invoice', 'ticket', 'appeal_history', 'statement_copy', 'chronology'],
    seller_name: 'Penjual Contoh',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    contact: 'email@contoh.com',
    chronology: 'Produk dihapus otomatis dengan alasan mengandung nikotin. Saya menekan tombol konfirmasi, lalu mengajukan banding dan diminta membuat surat pernyataan. Toko sempat pulih, tetapi beberapa hari kemudian ditutup permanen dengan alasan yang sama tanpa ada perubahan listing.',
  };
}

module.exports = {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computeArgument,
  computeImpact,
  daysBetween,
  addDays,
  formatDateOnly,
  formatRupiah,
  formatTodayID,
  normalizeFacts,
  readiness,
  summary,
  todayISO,
  validateCase,
  DEFAULTS,
  EVIDENCE,
  FACT_OPTIONS,
  PLATFORMS,
  REASONS,
  SOURCES,
  STATUSES,
};
