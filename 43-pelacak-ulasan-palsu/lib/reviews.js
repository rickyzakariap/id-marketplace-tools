'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  { id: 'shopee', label: 'Shopee', letter_to: 'Tim Layanan Penjual Shopee' },
  { id: 'tokopedia', label: 'Tokopedia', letter_to: 'Tim Bantuan Penjual Tokopedia' },
  { id: 'tiktok', label: 'TikTok Shop', letter_to: 'Tim Dukungan Penjual TikTok Shop' },
  { id: 'lazada', label: 'Lazada', letter_to: 'Tim Dukungan Penjual Lazada' },
  { id: 'blibli', label: 'Blibli', letter_to: 'Tim Dukungan Penjual Blibli' },
  { id: 'lainnya', label: 'Marketplace lain', letter_to: 'Tim Dukungan Penjual' },
];

const REVIEW_TYPES = [
  {
    id: 'product_quality',
    label: 'Kualitas produk',
    counted: true,
    note: 'Peringkat kualitas produk dihitung ke peringkat produk.',
  },
  {
    id: 'seller_service',
    label: 'Layanan penjual',
    counted: false,
    note: 'Menurut Pusat Bantuan Shopee, peringkat rendah Layanan Penjual tidak dihitung ke peringkat produk.',
  },
  {
    id: 'shipping_service',
    label: 'Layanan pengiriman',
    counted: false,
    note: 'Menurut Pusat Bantuan Shopee, peringkat rendah Layanan Pengiriman tidak dihitung ke peringkat produk.',
  },
  {
    id: 'campuran',
    label: 'Campuran atau tidak tahu',
    counted: true,
    note: 'Dihitung sebagai kualitas produk agar perkiraan tidak mengecilkan dampak. Periksa rincian penilaian di aplikasi.',
  },
];

const STATUSES = [
  { id: 'baru', label: 'Baru ditemukan', next: 'Simpan screenshot ulasan dan pesanan sebelum mengubah apa pun.' },
  { id: 'lapor_platform', label: 'Sudah lapor lewat fitur ulasan', next: 'Catat tanggal lapor dan minta nomor tiket atau bukti laporan.' },
  { id: 'tiket_cs', label: 'Sudah buka tiket CS', next: 'Minta pemeriksaan log dan jawaban tertulis, bukan jawaban template.' },
  { id: 'eskalasi', label: 'Eskalasi ke tim lanjutan', next: 'Kirim kronologi ringkas dan bukti kritis ke tim anti-fraud.' },
  { id: 'ditinjau', label: 'Sedang ditinjau', next: 'Follow-up setiap tiga hari dan simpan semua tanggapan.' },
  { id: 'dihapus', label: 'Ulasan dihapus', next: 'Catat tanggal pulih dan pantau rating beberapa hari.' },
  { id: 'ditolak', label: 'Laporan ditolak', next: 'Minta alasan tertulis, lalu buka tiket baru dengan bukti tambahan.' },
];

const FACT_OPTIONS = {
  buyer_denies: {
    label: 'Pembeli menyatakan tidak pernah memberi ulasan',
    options: [
      { id: 'ya', label: 'Ya, ada pernyataan pembeli' },
      { id: 'tidak', label: 'Tidak, pembeli mengaku memberi ulasan' },
      { id: 'tidak_tahu', label: 'Belum dikonfirmasi' },
    ],
  },
  review_text_match: {
    label: 'Kesesuaian bintang dengan isi ulasan',
    options: [
      { id: 'selaras', label: 'Selaras atau teks mendukung bintang rendah' },
      { id: 'tidak_selaras', label: 'Tidak selaras, misalnya teks positif tetapi bintang 1' },
      { id: 'tanpa_teks', label: 'Tanpa teks ulasan' },
    ],
  },
  order_status: {
    label: 'Status pesanan yang dinilai',
    options: [
      { id: 'selesai', label: 'Selesai' },
      { id: 'dibatalkan', label: 'Dibatalkan' },
      { id: 'belum_selesai', label: 'Belum selesai atau masih diproses' },
      { id: 'tidak_ada', label: 'Tidak ada pesanan yang cocok' },
      { id: 'tidak_tahu', label: 'Belum diperiksa' },
    ],
  },
  address_valid: {
    label: 'Alamat penerima',
    options: [
      { id: 'valid', label: 'Valid dan sesuai pembeli' },
      { id: 'tidak_valid', label: 'Tidak valid, fiktif, atau tempat umum' },
      { id: 'tidak_tahu', label: 'Belum diperiksa' },
    ],
  },
  burst: {
    label: 'Beberapa ulasan negatif dalam waktu berdekatan',
    options: [
      { id: 'ya', label: 'Ya, dalam 24 sampai 48 jam' },
      { id: 'tidak', label: 'Tidak' },
    ],
  },
  same_account: {
    label: 'Akun yang sama menyerang beberapa toko atau produk',
    options: [
      { id: 'ya', label: 'Ya' },
      { id: 'tidak', label: 'Tidak' },
      { id: 'tidak_tahu', label: 'Belum diperiksa' },
    ],
  },
  identity_abuse: {
    label: 'Identitas penjual dipakai akun lain',
    options: [
      { id: 'ya', label: 'Ya, nama, KTP, atau foto dipakai akun lain' },
      { id: 'tidak', label: 'Tidak' },
      { id: 'tidak_tahu', label: 'Belum diperiksa' },
    ],
  },
  chat_reply: {
    label: 'Respons pembeli di chat platform',
    options: [
      { id: 'dibalas', label: 'Pembeli membalas' },
      { id: 'tidak_dibalas', label: 'Tidak dibalas atau akun tidak aktif' },
    ],
  },
};

const EVIDENCE = [
  { id: 'review_screenshot', label: 'Screenshot ulasan bintang 1 beserta nama akun dan tanggal', critical: true, group: 'Bukti utama' },
  { id: 'order_screenshot', label: 'Screenshot detail pesanan, nomor pesanan, dan status selesai', critical: true, group: 'Bukti utama' },
  { id: 'buyer_statement', label: 'Pernyataan pembeli bahwa ulasan bukan dari dia', critical: true, group: 'Bukti utama' },
  { id: 'chat_history', label: 'Riwayat chat dengan pembeli di dalam platform', critical: true, group: 'Bukti utama' },
  { id: 'tickets', label: 'Nomor tiket dan riwayat laporan ke CS', critical: true, group: 'Bukti utama' },
  { id: 'reviewer_profile', label: 'Screenshot profil pemberi ulasan, tanggal bergabung, dan jumlah ulasan', critical: false, group: 'Pola serangan' },
  { id: 'address_proof', label: 'Bukti alamat atau penerima tidak valid', critical: false, group: 'Pola serangan' },
  { id: 'burst_list', label: 'Daftar semua ulasan negatif beserta tanggal dan akun', critical: false, group: 'Pola serangan' },
  { id: 'identity_proof', label: 'Bukti identitas penjual dipakai akun lain', critical: false, group: 'Pola serangan' },
  { id: 'packing_proof', label: 'Video packing dan resi yang menunjukkan produk dikirim benar', critical: false, group: 'Kualitas transaksi' },
  { id: 'rating_history', label: 'Screenshot rating toko sebelum dan sesudah serangan', critical: false, group: 'Dampak' },
  { id: 'sales_data', label: 'Data penjualan harian sebelum dan sesudah ulasan', critical: false, group: 'Dampak' },
  { id: 'chronology', label: 'Kronologi tanggal dan jam kejadian', critical: false, group: 'Dampak' },
];

const SOURCES = [
  {
    title: 'Mohon Investigasi Shopee: Pembeli Bilang Tidak Pernah Kasih Bintang 1, tapi Toko Saya Dapat Bintang 1',
    publisher: 'Media Konsumen',
    date: '2026-10-28',
    url: 'https://mediakonsumen.com/2026/10/28/surat-pembaca/mohon-investigasi-shopee-pembeli-bilang-tidak-pernah-kasih-bintang-1-tapi-toko-saya-dapat-bintang-1',
    note: 'Kasus toko sablon yang mendapat bintang 1 padahal pembeli menyatakan tidak pernah membuka aplikasi atau memberi ulasan.',
  },
  {
    title: 'Akun Shopee Pakai Nama KTP Saya dan Foto AI, Dua Toko Saya Kena Ulasan Bintang 1',
    publisher: 'Media Konsumen',
    date: '2026-10-14',
    url: 'https://mediakonsumen.com/2026/10/14/surat-pembaca/akun-shopee-pakai-nama-ktp-saya-dan-foto-ai-dua-toko-saya-kena-ulasan-bintang-1',
    note: 'Kasus akun yang memakai identitas penjual, memasang alamat fiktif, lalu memberi ulasan bintang 1 di dua toko.',
  },
  {
    title: 'Penilaian Produk: Bagaimana cara memberikan penilaian dan ulasan produk?',
    publisher: 'Pusat Bantuan Shopee',
    date: 'diakses 2026-10-29',
    url: 'https://help.shopee.co.id/portal/4/article/73047',
    note: 'Pesanan batal atau retur tidak memenuhi syarat dinilai. Peringkat layanan pengiriman dan layanan penjual tidak dihitung ke peringkat produk. Penilaian yang tidak selaras dengan ulasan dapat dihapus.',
  },
  {
    title: 'Penilaian Produk: Apakah saya dapat mengubah penilaian atau ulasan produk?',
    publisher: 'Pusat Bantuan Shopee',
    date: 'diakses 2026-10-29',
    url: 'https://help.shopee.co.id/portal/4/article/73045',
    note: 'Pembeli dapat mengubah penilaian atau ulasan satu kali dalam 120 hari setelah pesanan selesai. Tidak ada Koin Shopee tambahan untuk ulasan yang diubah.',
  },
  {
    title: 'Meningkatkan Kepuasan Pembeli',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026-10-15',
    url: 'https://seller.shopee.co.id/edu/article/6859',
    note: 'Penjual dapat merespons penilaian satu kali dan tidak dapat mengubahnya. Penjual juga dapat melaporkan ulasan yang tidak pantas.',
  },
];

const EDIT_WINDOW_DAYS = 120;

const DEFAULTS = {
  platform: 'shopee',
  current_rating: 4.9,
  total_ratings: 250,
  bad_reviews: 1,
  target_rating: 4.9,
  review_type: 'product_quality',
  status: 'baru',
  facts: {
    buyer_denies: 'tidak_tahu',
    review_text_match: 'tanpa_teks',
    order_status: 'selesai',
    address_valid: 'tidak_tahu',
    burst: 'tidak',
    same_account: 'tidak_tahu',
    identity_abuse: 'tidak_tahu',
    chat_reply: 'dibalas',
  },
};

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function whole(value) {
  return Math.max(0, Math.floor(num(value)));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function todayISO(now = new Date()) {
  return now.getUTCFullYear() + '-' + pad(now.getUTCMonth() + 1) + '-' + pad(now.getUTCDate());
}

function parseISO(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(text + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) return null;
  if (todayISO(date) !== text) return null;
  return text;
}

function addDays(iso, days) {
  const date = new Date(iso + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return todayISO(date);
}

function daysBetween(from, to) {
  const a = new Date(from + 'T00:00:00Z');
  const b = new Date(to + 'T00:00:00Z');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatDateID(iso) {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return Number(parts[2]) + ' ' + MONTHS_ID[Number(parts[1]) - 1] + ' ' + parts[0];
}

function groupDigits(value) {
  const rounded = Math.round(num(value));
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatRupiah(value) {
  return 'Rp ' + groupDigits(value);
}

function formatNumber(value) {
  return groupDigits(value);
}

function getPlatform(id) {
  return PLATFORMS.find((item) => item.id === id) || PLATFORMS[0];
}

function getReviewType(id) {
  return REVIEW_TYPES.find((item) => item.id === id) || REVIEW_TYPES[0];
}

function getStatus(id) {
  return STATUSES.find((item) => item.id === id) || STATUSES[0];
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id) || null;
}

function normalizeFacts(input) {
  const raw = input && typeof input.facts === 'object' ? input.facts : (input || {});
  const facts = {};
  Object.keys(FACT_OPTIONS).forEach((key) => {
    const allowed = FACT_OPTIONS[key].options.map((item) => item.id);
    const value = String(raw[key] || '');
    facts[key] = allowed.indexOf(value) !== -1 ? value : DEFAULTS.facts[key];
  });
  return facts;
}

function normalizeEvidence(items) {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.map((item) => String(item)).filter((id) => getEvidence(id))));
}

function factLabel(key, value) {
  const group = FACT_OPTIONS[key];
  if (!group) return value;
  const found = group.options.find((item) => item.id === value);
  return found ? found.label : value;
}

function computeRating(input) {
  const current = num(input.current_rating);
  const total = whole(input.total_ratings);
  const bad = whole(input.bad_reviews);
  const target = input.target_rating === '' || input.target_rating === undefined || input.target_rating === null
    ? current
    : num(input.target_rating);
  const type = getReviewType(input.review_type);
  const countedBad = type.counted ? bad : 0;
  const newTotal = total + countedBad;
  const newAverage = newTotal > 0 ? (current * total + countedBad * 1) / newTotal : current;
  const drop = Math.max(0, current - newAverage);

  let toTarget = 0;
  let reachable = true;
  if (newAverage < target) {
    if (target >= 5) {
      reachable = false;
    } else {
      toTarget = Math.ceil((newTotal * (target - newAverage)) / (5 - target));
    }
  }

  let oneBadCost = 0;
  if (total > 0 && current < 5) {
    oneBadCost = Math.max(0, current - (current * total + 1) / (total + 1));
  }

  return {
    current: round2(current),
    total: total,
    bad: bad,
    counted_bad: countedBad,
    review_type: type.id,
    review_type_label: type.label,
    review_type_counted: type.counted,
    review_type_note: type.note,
    target: round2(target),
    new_total: newTotal,
    new_average: round2(newAverage),
    drop: round2(drop),
    one_bad_cost: round2(oneBadCost),
    five_star_needed: reachable ? toTarget : null,
    reachable: reachable,
    note: type.counted
      ? 'Perkiraan memakai asumsi rata-rata sederhana dari semua penilaian produk. Angka resmi di Seller Center dapat berbeda.'
      : 'Ulasan ini tidak dihitung ke peringkat produk menurut aturan yang dikutip, jadi dampak ke peringkat produk dibuat 0. Rating toko tetap perlu dipantau.',
  };
}

function computeImpact(input, now) {
  const price = num(input.price);
  const cost = num(input.cost);
  const before = whole(input.units_before);
  const during = whole(input.units_during);
  const start = parseISO(input.review_date);
  const resolved = parseISO(input.resolved_date);
  const end = resolved || todayISO(now);
  const rawDays = start ? Math.max(0, daysBetween(start, end)) : 0;
  const days = start ? Math.max(1, rawDays) : 0;
  const unitMargin = Math.max(0, price - cost);
  const lostUnitsPerDay = Math.max(0, before - during);
  const lostUnits = lostUnitsPerDay * days;
  const lostRevenue = lostUnits * price;
  const lostProfit = lostUnits * unitMargin;
  const monthlyProfit = before * unitMargin * 30;

  let severity = 'ringan';
  if (resolved) {
    severity = 'pulih';
  } else if (lostProfit > 0 && monthlyProfit > 0 && lostProfit >= monthlyProfit * 0.5) {
    severity = 'kritis';
  } else if (lostProfit > 0 && monthlyProfit > 0 && lostProfit >= monthlyProfit * 0.2) {
    severity = 'signifikan';
  } else if (days >= 14 && lostUnitsPerDay > 0) {
    severity = 'signifikan';
  }

  return {
    price: price,
    cost: cost,
    unit_margin: unitMargin,
    units_before: before,
    units_during: during,
    lost_units_per_day: lostUnitsPerDay,
    days: days,
    lost_units: lostUnits,
    lost_revenue: Math.round(lostRevenue),
    lost_profit: Math.round(lostProfit),
    monthly_profit: Math.round(monthlyProfit),
    resolved_date: resolved || '',
    severity: severity,
    severity_label: severityLabel(severity),
    note: 'Semua angka uang berasal dari input Anda. Penurunan penjualan dihitung sebagai selisih unit harian, bukan elastisitas otomatis.',
  };
}

function severityLabel(severity) {
  if (severity === 'pulih') return 'Sudah pulih';
  if (severity === 'kritis') return 'Dampak kritis';
  if (severity === 'signifikan') return 'Dampak signifikan';
  return 'Dampak ringan';
}

function diagnose(input, rating, impact) {
  const facts = normalizeFacts(input);
  const bad = whole(input.bad_reviews);
  const orderDate = parseISO(input.order_date);
  const reviewDate = parseISO(input.review_date);
  const reviewBeforeComplete = Boolean(orderDate && reviewDate && reviewDate < orderDate);
  const invalidOrder = ['dibatalkan', 'belum_selesai', 'tidak_ada'].indexOf(facts.order_status) !== -1;

  const indicators = [
    { id: 'buyer_denies', label: 'Pembeli menyatakan tidak pernah memberi ulasan', points: 20, active: facts.buyer_denies === 'ya' },
    { id: 'text_mismatch', label: 'Bintang tidak selaras dengan isi ulasan', points: 15, active: facts.review_text_match === 'tidak_selaras' },
    { id: 'invalid_order', label: 'Pesanan batal, belum selesai, atau tidak ditemukan', points: 15, active: invalidOrder },
    { id: 'review_before_complete', label: 'Ulasan muncul sebelum tanggal pesanan selesai', points: 10, active: reviewBeforeComplete },
    { id: 'address_invalid', label: 'Alamat penerima tidak valid atau fiktif', points: 10, active: facts.address_valid === 'tidak_valid' },
    { id: 'burst', label: 'Beberapa ulasan negatif dalam waktu berdekatan', points: 10, active: facts.burst === 'ya' },
    { id: 'same_account', label: 'Akun yang sama menyerang beberapa toko atau produk', points: 10, active: facts.same_account === 'ya' },
    { id: 'identity_abuse', label: 'Identitas penjual dipakai akun lain', points: 10, active: facts.identity_abuse === 'ya' },
    { id: 'chat_dead_end', label: 'Pembeli tidak membalas chat platform', points: 5, active: facts.chat_reply === 'tidak_dibalas' },
    { id: 'multiple_bad', label: 'Tiga atau lebih ulasan bintang 1 dipermasalahkan', points: 5, active: bad >= 3 },
  ];

  let score = 0;
  const reasons = [];
  indicators.forEach((item) => {
    if (item.active) {
      score += item.points;
      reasons.push(item.label + '.');
    }
  });
  score = Math.min(100, score);

  let verdict = 'lemah';
  if (score >= 70) verdict = 'kuat';
  else if (score >= 40) verdict = 'cukup';

  let pattern = 'belum_jelas';
  if (facts.identity_abuse === 'ya') pattern = 'identitas';
  else if (facts.buyer_denies === 'ya') pattern = 'bukan_pembeli';
  else if (invalidOrder || reviewBeforeComplete) pattern = 'pesanan';
  else if (facts.review_text_match === 'tidak_selaras') pattern = 'teks';
  else if (facts.burst === 'ya' || facts.same_account === 'ya') pattern = 'terkoordinasi';

  const patternLabels = {
    identitas: 'Penyalahgunaan identitas dan akun untuk menjatuhkan reputasi',
    bukan_pembeli: 'Ulasan diduga tidak dibuat oleh pembeli atau berasal dari error sistem',
    pesanan: 'Ulasan melekat pada pesanan yang tidak memenuhi syarat dinilai',
    teks: 'Penilaian tidak selaras dengan isi ulasan',
    terkoordinasi: 'Pola serangan ulasan yang terkoordinasi',
    belum_jelas: 'Penyebab belum jelas, perlu pemeriksaan log platform',
  };

  return {
    score: score,
    verdict: verdict,
    verdict_label: verdict === 'kuat' ? 'Indikasi kuat' : verdict === 'cukup' ? 'Indikasi cukup' : 'Indikasi lemah',
    pattern: pattern,
    pattern_label: patternLabels[pattern],
    indicators: indicators,
    reasons: reasons,
    facts: facts,
    review_before_complete: reviewBeforeComplete,
    invalid_order: invalidOrder,
    note: 'Skor ini heuristik dari fakta yang Anda pilih, bukan penilaian resmi platform dan bukan jaminan ulasan akan dihapus.',
  };
}

function buildRecommendations(input, rating, impact, diagnosis) {
  const facts = diagnosis.facts;
  const recs = [];

  if (rating.review_type_counted && rating.drop > 0) {
    recs.push('Dampak ke peringkat produk sekitar ' + rating.drop.toFixed(2) + ' poin. Untuk kembali ke ' + rating.target.toFixed(2) + ' dibutuhkan sekitar ' + (rating.five_star_needed === null ? 'tidak mungkin dengan bintang 5 saja' : formatNumber(rating.five_star_needed) + ' ulasan bintang 5 baru') + '.');
  } else {
    recs.push('Ulasan ini tidak dihitung ke peringkat produk. Fokus pada rating toko dan mutu layanan, bukan pada rata-rata peringkat produk.');
  }

  if (facts.buyer_denies === 'ya') {
    recs.push('Kirim pesan sopan ke pembeli dan minta dia mengubah penilaian satu kali dalam 120 hari setelah pesanan selesai. Simpan tanggapannya sebagai bukti.');
  }
  if (facts.chat_reply === 'tidak_dibalas') {
    recs.push('Jika pembeli tidak aktif, jangan menunggu persetujuan lewat chat. Minta platform menghubungi pembeli dan memeriksa log penilaian.');
  }
  if (diagnosis.invalid_order) {
    recs.push('Lampirkan screenshot status pesanan. Pesanan batal atau retur tidak memenuhi syarat untuk penilaian menurut Pusat Bantuan Shopee.');
  }
  if (facts.review_text_match === 'tidak_selaras') {
    recs.push('Tandai ketidakselarasan bintang dengan teks. Pedoman Shopee menyebut penilaian yang tidak selaras dengan ulasan dapat dihapus.');
  }
  if (facts.identity_abuse === 'ya' || facts.same_account === 'ya') {
    recs.push('Laporkan akun, bukan hanya ulasannya. Sertakan bukti identitas, daftar toko yang diserang, dan tanggal kejadian agar diperiksa sebagai satu pola.');
  }
  if (facts.burst === 'ya') {
    recs.push('Susun daftar ulasan negatif beserta tanggal dan akun. Pola waktu yang berdekatan lebih mudah diperiksa daripada satu ulasan tunggal.');
  }
  recs.push('Balas ulasan satu kali secara profesional tanpa data pribadi. Penjual tidak dapat mengubah balasan setelah dikirim.');
  recs.push('Jangan membeli ulasan positif atau menyerang balik. Fokus pada bukti transaksi, packing, dan komunikasi.');
  if (impact.lost_profit > 0) {
    recs.push('Catat kerugian ' + formatRupiah(impact.lost_profit) + ' dari input Anda sebagai konteks dampak, bukan sebagai tagihan otomatis ke platform.');
  }
  recs.push('Minta jawaban tertulis dan nomor tiket setiap kali follow-up. Tanpa jawaban tertulis, eskalasi sulit dilacak.');
  return recs;
}

function editWindow(input, now) {
  const orderDate = parseISO(input.order_date);
  if (!orderDate) {
    return {
      order_date: '',
      deadline: '',
      days_left: null,
      closed: false,
      note: 'Isi tanggal pesanan selesai untuk menghitung batas 120 hari pembeli mengubah ulasan.',
    };
  }
  const deadline = addDays(orderDate, EDIT_WINDOW_DAYS);
  const daysLeft = daysBetween(todayISO(now), deadline);
  return {
    order_date: orderDate,
    deadline: deadline,
    days_left: daysLeft,
    closed: daysLeft < 0,
    note: daysLeft < 0
      ? 'Batas 120 hari sudah lewat. Pembeli tidak dapat mengubah ulasan lagi, jadi fokus pada laporan ke platform.'
      : 'Pembeli masih dapat mengubah ulasan satu kali sampai ' + formatDateID(deadline) + ' (sisa ' + Math.max(0, daysLeft) + ' hari).',
  };
}

function readiness(input) {
  const selected = normalizeEvidence(input && (input.items || input.evidence));
  const available = EVIDENCE.filter((item) => selected.indexOf(item.id) !== -1);
  const missingCritical = EVIDENCE.filter((item) => item.critical && selected.indexOf(item.id) === -1);
  const score = Math.round((available.length / EVIDENCE.length) * 100);
  return {
    score: score,
    available_count: available.length,
    total: EVIDENCE.length,
    missing_critical: missingCritical.map((item) => item.label),
    ready: missingCritical.length === 0,
    verdict: missingCritical.length === 0 && score >= 70 ? 'siap' : missingCritical.length <= 1 ? 'hampir' : 'kurang',
    verdict_label: missingCritical.length === 0 && score >= 70 ? 'Bukti siap dikirim' : missingCritical.length <= 1 ? 'Hampir siap' : 'Bukti belum cukup',
    items: EVIDENCE.map((item) => Object.assign({}, item, { checked: selected.indexOf(item.id) !== -1 })),
  };
}

function validateBase(input, now) {
  const data = input || {};
  const current = num(data.current_rating);
  if (current <= 0 || current > 5) return { error: 'Rating saat ini harus di antara 0,1 dan 5,0' };

  const total = whole(data.total_ratings);
  if (total < 1) return { error: 'Jumlah penilaian saat ini minimal 1' };

  const bad = whole(data.bad_reviews);
  if (bad < 1) return { error: 'Jumlah ulasan bintang 1 yang dipermasalahkan minimal 1' };

  const targetRaw = data.target_rating === '' || data.target_rating === undefined || data.target_rating === null
    ? current
    : num(data.target_rating);
  if (targetRaw <= 0 || targetRaw > 5) return { error: 'Target rating harus di antara 0,1 dan 5,0' };

  const reviewDate = parseISO(data.review_date);
  if (!reviewDate) return { error: 'Tanggal ulasan wajib diisi dengan format yang valid' };
  const today = todayISO(now);
  if (reviewDate > today) return { error: 'Tanggal ulasan tidak boleh melewati hari ini' };

  const orderDate = parseISO(data.order_date);
  if (String(data.order_date || '').trim() && !orderDate) return { error: 'Tanggal pesanan selesai tidak valid' };
  if (orderDate && orderDate > today) return { error: 'Tanggal pesanan selesai tidak boleh melewati hari ini' };

  const resolvedDate = parseISO(data.resolved_date);
  if (String(data.resolved_date || '').trim() && !resolvedDate) return { error: 'Tanggal ulasan dihapus tidak valid' };
  if (resolvedDate && resolvedDate < reviewDate) return { error: 'Tanggal ulasan dihapus tidak boleh sebelum tanggal ulasan' };
  if (resolvedDate && resolvedDate > today) return { error: 'Tanggal ulasan dihapus tidak boleh melewati hari ini' };

  const price = num(data.price);
  if (price <= 0) return { error: 'Harga jual rata-rata harus lebih dari 0' };
  const cost = num(data.cost);
  if (cost < 0) return { error: 'HPP tidak boleh negatif' };
  if (cost > price) return { error: 'HPP tidak boleh lebih besar dari harga jual' };

  const reviewType = getReviewType(data.review_type);
  const platform = getPlatform(data.platform);
  const status = getStatus(data.status);

  return {
    data: {
      platform: platform.id,
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      order_id: cleanLine(data.order_id, 120),
      status: status.id,
      order_date: orderDate || '',
      review_date: reviewDate,
      resolved_date: resolvedDate || '',
      last_follow_up: parseISO(data.last_follow_up) || '',
      current_rating: round2(current),
      total_ratings: total,
      bad_reviews: bad,
      target_rating: round2(targetRaw),
      review_type: reviewType.id,
      price: price,
      cost: cost,
      units_before: whole(data.units_before),
      units_during: whole(data.units_during),
      facts: normalizeFacts(data),
      evidence: normalizeEvidence(data.evidence),
      note: cleanBlock(data.note),
    },
  };
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;

  const platform = getPlatform(data.platform);
  const status = getStatus(data.status);
  const rating = computeRating(data);
  const impact = computeImpact(data, now);
  const diagnosis = diagnose(data, rating, impact);
  const edit = editWindow(data, now);
  const proof = readiness({ items: data.evidence });
  const recs = buildRecommendations(data, rating, impact, diagnosis);

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    store_name: data.store_name,
    store_id: data.store_id,
    contact: data.contact,
    ticket: data.ticket,
    order_id: data.order_id,
    status: status.id,
    status_label: status.label,
    status_next: status.next,
    order_date: data.order_date,
    review_date: data.review_date,
    resolved_date: data.resolved_date,
    last_follow_up: data.last_follow_up,
    rating: rating,
    impact: impact,
    diagnosis: diagnosis,
    edit_window: edit,
    readiness: proof,
    recommendations: recs,
    evidence: EVIDENCE.map((item) => Object.assign({}, item)),
    sources: SOURCES.slice(),
    disclaimer: 'Skor indikasi, dampak, dan kebutuhan bintang 5 adalah heuristik tool. Bukan penilaian resmi marketplace dan bukan jaminan ulasan dihapus.',
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };

  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const platform = getPlatform(analyzed.platform);
  const evidenceItems = normalizeEvidence(data.evidence);
  const evidenceLabels = evidenceItems.length > 0
    ? evidenceItems.map((id) => '- ' + getEvidence(id).label)
    : ['- Screenshot ulasan dan detail pesanan', '- Riwayat chat dengan pembeli', '- Nomor tiket laporan'];
  const reasons = analyzed.diagnosis.reasons.length > 0
    ? analyzed.diagnosis.reasons
    : ['Pola pelanggaran belum dapat dipastikan, tetapi saya meminta pemeriksaan log penilaian.'];
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const chronology = cleanBlock(data.chronology) || 'Tidak ada kronologi tambahan yang dicatat.';

  const shopeeRules = analyzed.platform === 'shopee'
    ? [
      'Berdasarkan Pusat Bantuan Shopee:',
      '- Pesanan yang dikembalikan atau dibatalkan tidak memenuhi syarat untuk penilaian dan ulasan produk.',
      '- Peringkat rendah Layanan Pengiriman dan Layanan Penjual tidak dihitung ke peringkat produk.',
      '- Penilaian yang tidak selaras dengan ulasan dapat dihapus.',
      '- Pembeli dapat mengubah penilaian satu kali dalam 120 hari setelah pesanan selesai.',
      '',
    ]
    : [
      'Saya meminta pemeriksaan berdasarkan ketentuan penilaian dan ulasan yang berlaku di platform.',
      '',
    ];

  const subject = 'Permohonan pemeriksaan ulasan bintang 1 yang diduga tidak sah di toko ' + storeName;
  const lines = [
    'Kepada ' + platform.letter_to + ',',
    '',
    'Saya, ' + sellerName + ', pemilik toko ' + storeName + (analyzed.store_id ? ' (' + analyzed.store_id + ')' : '') + ', melaporkan ulasan bintang 1 yang saya duga tidak sah.',
    '',
    'Data kasus:',
    '- Platform: ' + analyzed.platform_name,
    '- Nama toko: ' + storeName,
    '- Nomor pesanan: ' + (cleanLine(data.order_id, 120) || '-'),
    '- Tanggal pesanan selesai: ' + formatDateID(analyzed.order_date),
    '- Tanggal ulasan: ' + formatDateID(analyzed.review_date),
    '- Jenis penilaian: ' + analyzed.rating.review_type_label,
    '- Jumlah ulasan bintang 1 yang dipermasalahkan: ' + analyzed.rating.bad,
    '- Nomor tiket sebelumnya: ' + (analyzed.ticket || '-'),
    '',
    'Kronologi:',
    chronology,
    '',
    'Alasan laporan:',
  ];
  reasons.forEach((reason, index) => {
    lines.push((index + 1) + '. ' + reason);
  });
  lines.push('');
  lines.push('Dampak yang saya catat:');
  lines.push('- Perkiraan penurunan peringkat produk: ' + analyzed.rating.drop.toFixed(2) + ' poin.');
  lines.push('- Perkiraan kehilangan laba: ' + formatRupiah(analyzed.impact.lost_profit) + ' selama ' + analyzed.impact.days + ' hari.');
  lines.push('- Angka ini berasal dari data penjualan saya dan bersifat perkiraan.');
  lines.push('');
  lines.push.apply(lines, shopeeRules);
  lines.push('Bukti yang saya lampirkan:');
  lines.push.apply(lines, evidenceLabels);
  lines.push('');
  lines.push('Permintaan saya:');
  lines.push('1. Periksa log pembuatan penilaian, termasuk waktu kirim, perangkat, dan akun yang digunakan.');
  lines.push('2. Hubungi pembeli melalui kanal resmi untuk mengonfirmasi apakah dia benar-benar memberi penilaian tersebut.');
  lines.push('3. Hapus ulasan jika terbukti tidak memenuhi syarat atau melanggar pedoman ulasan.');
  lines.push('4. Berikan jawaban tertulis beserta nomor tiket dan alasan keputusan.');
  lines.push('');
  lines.push('Saya memahami keputusan penghapusan berada pada ' + analyzed.platform_name + '. Saya tidak meminta penghapusan tanpa dasar dan bersedia memberikan bukti tambahan bila diperlukan.');
  lines.push('');
  lines.push('Hormat saya,');
  lines.push(sellerName);
  lines.push(analyzed.contact || '-');
  lines.push(formatDateID(todayISO(now)));

  return {
    subject: subject,
    body: lines.join('\n'),
    diagnosis: analyzed.diagnosis,
    readiness: analyzed.readiness,
    edit_window: analyzed.edit_window,
  };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  return {
    platform: 'shopee',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-2026-10',
    status: 'tiket_cs',
    order_id: '261014XXXXXXXX',
    order_date: addDays(today, -40),
    review_date: addDays(today, -30),
    resolved_date: '',
    last_follow_up: addDays(today, -2),
    current_rating: 4.8,
    total_ratings: 150,
    bad_reviews: 2,
    target_rating: 4.8,
    review_type: 'product_quality',
    price: 35000,
    cost: 25000,
    units_before: 25,
    units_during: 17,
    facts: {
      buyer_denies: 'tidak_tahu',
      review_text_match: 'tidak_selaras',
      order_status: 'selesai',
      address_valid: 'tidak_valid',
      burst: 'ya',
      same_account: 'ya',
      identity_abuse: 'ya',
      chat_reply: 'tidak_dibalas',
    },
    chronology: 'Akun memakai nama dan foto pemilik toko. Dua pesanan dikirim ke alamat fiktif, lalu dua ulasan bintang 1 muncul dalam waktu berdekatan.',
    note: 'Contoh ilustrasi berdasarkan kasus Media Konsumen 14 Oktober 2026. Nama toko dan angka ekonomi adalah ilustrasi.',
    evidence: [
      'review_screenshot',
      'order_screenshot',
      'chat_history',
      'tickets',
      'reviewer_profile',
      'address_proof',
      'burst_list',
      'identity_proof',
      'rating_history',
      'chronology',
    ],
  };
}

function validateCase(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  if (!data.store_name) return { error: 'Nama toko wajib diisi' };

  const lastFollowUp = data.last_follow_up;
  const today = todayISO(now);
  if (lastFollowUp && lastFollowUp > today) return { error: 'Tanggal follow-up tidak boleh melewati hari ini' };

  return { item: data };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const analyzed = analyze(data, now);
  if (analyzed.error) {
    return Object.assign({}, data, {
      error: analyzed.error,
      flags: [analyzed.error],
      aging_days: 0,
      flags_count: 1,
    });
  }

  const start = data.review_date;
  const end = data.resolved_date || todayISO(now);
  const aging = start ? Math.max(0, daysBetween(start, end)) : 0;
  const flags = [];
  const edit = analyzed.edit_window;
  const resolved = data.status === 'dihapus' || data.status === 'dibiarkan';

  if (data.status === 'ditolak') {
    flags.push('Laporan ditolak. Minta alasan tertulis lalu buka tiket baru dengan bukti tambahan.');
  }
  if (!resolved && edit.closed) {
    flags.push('Batas 120 hari pembeli mengubah ulasan sudah lewat. Fokus ke laporan platform dan bukti.');
  }
  if (!resolved && edit.days_left !== null && edit.days_left >= 0 && edit.days_left <= 14) {
    flags.push('Sisa ' + edit.days_left + ' hari bagi pembeli untuk mengubah ulasan. Hubungi pembeli sekarang dengan sopan.');
  }
  if (analyzed.diagnosis.score >= 70 && analyzed.readiness.score < 60) {
    flags.push('Indikasi kuat tetapi bukti belum lengkap. Lengkapi bukti kritis sebelum eskalasi.');
  }
  if (!analyzed.rating.review_type_counted) {
    flags.push('Ulasan tercatat pada layanan penjual atau pengiriman. Peringkat produk tidak terpengaruh, tetapi rating toko tetap perlu dipantau.');
  }
  if (analyzed.diagnosis.facts.buyer_denies === 'ya' && analyzed.diagnosis.facts.chat_reply === 'tidak_dibalas') {
    flags.push('Pembeli tidak merespons chat. Minta platform menghubungi pembeli, jangan hanya menunggu persetujuan lewat chat.');
  }
  if (analyzed.diagnosis.facts.burst === 'ya' && analyzed.rating.bad >= 2) {
    flags.push('Ada beberapa ulasan negatif dalam waktu berdekatan. Susun daftar tanggal dan akun.');
  }
  if (analyzed.diagnosis.invalid_order) {
    flags.push('Pesanan batal, belum selesai, atau tidak cocok seharusnya tidak memenuhi syarat dinilai. Lampirkan screenshot status pesanan.');
  }

  return Object.assign({}, analyzed, {
    id: data.id || '',
    created_at: data.created_at || '',
    note: data.note || '',
    aging_days: aging,
    flags: flags,
    flags_count: flags.length,
    resolved: resolved,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const open = views.filter((item) => item.status !== 'dihapus' && item.status !== 'dibiarkan');
  const removed = views.filter((item) => item.status === 'dihapus');
  const rejected = views.filter((item) => item.status === 'ditolak');

  let lostProfit = 0;
  let lostRevenue = 0;
  let badReviews = 0;
  views.forEach((item) => {
    if (item.impact) {
      lostProfit += item.impact.lost_profit;
      lostRevenue += item.impact.lost_revenue;
    }
    if (item.rating) badReviews += item.rating.bad;
  });

  let oldestOpen = 0;
  open.forEach((item) => {
    if (item.aging_days > oldestOpen) oldestOpen = item.aging_days;
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    removed_cases: removed.length,
    rejected_cases: rejected.length,
    total_lost_profit: lostProfit,
    total_lost_revenue: lostRevenue,
    total_bad_reviews: badReviews,
    oldest_open_days: oldestOpen,
  };
}

function meta() {
  return {
    platforms: PLATFORMS,
    review_types: REVIEW_TYPES,
    statuses: STATUSES,
    fact_options: FACT_OPTIONS,
    evidence: EVIDENCE,
    sources: SOURCES,
    defaults: DEFAULTS,
    edit_window_days: EDIT_WINDOW_DAYS,
  };
}

module.exports = {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computeImpact,
  computeRating,
  diagnose,
  editWindow,
  readiness,
  summary,
  todayISO,
  addDays,
  daysBetween,
  formatDateID,
  formatNumber,
  formatRupiah,
  getStatus,
  validateCase,
  meta,
  DEFAULTS,
  EVIDENCE,
  FACT_OPTIONS,
  PLATFORMS,
  REVIEW_TYPES,
  SOURCES,
  STATUSES,
  EDIT_WINDOW_DAYS,
};
