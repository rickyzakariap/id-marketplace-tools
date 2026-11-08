'use strict';

const MAX_NOTE = 400;
const MAX_TEXT = 160;
const MAX_CHRONOLOGY = 1600;

const APPEAL_DAYS = 7;
const RECOMMENDED_SUBMIT_DAY = 3;
const RECOMMENDED_OFFSET_DAYS = RECOMMENDED_SUBMIT_DAY - 1;
const INFO_HOURS = 24;
const MALL_RETURN_DAYS = 15;
const NON_MALL_RETURN_DAYS = 6;
const MALL_EFFECTIVE = '2026-11-02';
const CS_RETURN_EFFECTIVE = '2026-11-05';
const APPEAL_EFFECTIVE = '2026-10-27';

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok Shop by Tokopedia' },
  { id: 'tokopedia', label: 'Tokopedia' },
  { id: 'lain', label: 'Marketplace lain' },
];

const ORDER_TYPES = [
  { id: 'mall', label: 'Mall', return_days: MALL_RETURN_DAYS, note: 'Pembeli punya 15 hari kalender sejak pesanan diterima.' },
  { id: 'non_mall', label: 'Non-Mall', return_days: NON_MALL_RETURN_DAYS, note: 'Pembeli punya 6 hari kalender sejak pesanan diterima.' },
];

const CASE_TYPES = [
  {
    id: 'refund_only',
    label: 'Refund Only otomatis disetujui',
    start_label: 'Tanggal refund diproses',
    note: 'Jendela banding 7 hari kalender sejak refund diproses.',
  },
  {
    id: 'speedy_refund',
    label: 'Speedy Refund, barang retur sudah diterima',
    start_label: 'Tanggal status retur menjadi Delivered',
    note: 'Jendela banding 7 hari kalender sejak status retur Delivered.',
  },
  {
    id: 'dispute',
    label: 'Sengketa retur setelah penolakan penjual',
    start_label: 'Tanggal refund diproses',
    note: 'Jendela banding 7 hari kalender sejak refund diproses.',
  },
  {
    id: 'self_arranged',
    label: 'Retur diatur pembeli, barang sudah diterima',
    start_label: 'Tanggal status retur menjadi Delivered',
    note: 'Jendela banding 7 hari kalender sejak status retur Delivered.',
  },
  {
    id: 'not_received_speedy',
    label: 'Barang retur belum diterima, Speedy Refund',
    start_label: 'Tanggal jendela banding dibuka',
    note: 'Banding bisa dibuka mulai hari ke-6 setelah pembeli mengunggah resi. Masukkan tanggal buka jendela dari Seller Center, bukan tanggal unggah resi.',
  },
  {
    id: 'not_received_self',
    label: 'Barang retur belum diterima, retur diatur pembeli',
    start_label: 'Tanggal jendela banding dibuka',
    note: 'Banding bisa dibuka mulai hari ke-15 setelah pembeli mengunggah resi. Masukkan tanggal buka jendela dari Seller Center, bukan tanggal unggah resi.',
  },
];

const APPEAL_REASONS = [
  {
    id: 'wrong_product',
    label: 'Barang yang kembali bukan barang yang dikirim',
    unboxing: 'wajib',
    packing: 'opsional',
    note: 'Video unboxing wajib. Video pengemasan wajib bila alasan banding sama dengan alasan retur pembeli.',
  },
  {
    id: 'missing_parts',
    label: 'Barang atau komponen hilang',
    unboxing: 'wajib',
    packing: 'opsional',
    note: 'Video unboxing wajib menunjukkan isi paket retur secara utuh.',
  },
  {
    id: 'used',
    label: 'Barang sudah dipakai dan tidak layak dijual',
    unboxing: 'wajib',
    packing: 'opsional',
    note: 'Video unboxing wajib menunjukkan tanda pemakaian.',
  },
  {
    id: 'damaged',
    label: 'Barang kembali rusak',
    unboxing: 'wajib',
    packing: 'opsional',
    note: 'Video unboxing wajib. Bila masalahnya fungsi, tambahkan video uji fungsi.',
  },
  {
    id: 'buyer_wrong_reason',
    label: 'Alasan retur pembeli tidak tepat',
    unboxing: 'kondisional',
    packing: 'opsional',
    note: 'Video unboxing wajib bila Anda membantah kondisi barang retur. Video pengemasan wajib bila alasan banding sama dengan alasan retur pembeli.',
  },
  {
    id: 'sent_correct',
    label: 'Barang yang dikirim sudah benar',
    unboxing: 'opsional',
    packing: 'wajib',
    note: 'Video pengemasan wajib bila Anda membantah alasan retur pembeli, misalnya pembeli bilang salah kirim.',
  },
  {
    id: 'sent_authentic',
    label: 'Barang yang dikirim asli',
    unboxing: 'opsional',
    packing: 'tidak_perlu',
    note: 'Video tidak diwajibkan untuk alasan keaslian. Sertakan bukti pembelian dan foto produk.',
  },
  {
    id: 'not_received',
    label: 'Barang retur tidak pernah diterima',
    unboxing: 'tidak_perlu',
    packing: 'tidak_perlu',
    note: 'Video unboxing tidak relevan. Fokus pada resi, riwayat pelacakan, dan tiket CS.',
  },
];

const EVIDENCE = [
  {
    id: 'order_detail',
    label: 'Detail pesanan dan status retur/refund',
    group: 'Transaksi',
    critical: true,
    always: true,
  },
  {
    id: 'buyer_request',
    label: 'Detail alasan retur dari pembeli',
    group: 'Transaksi',
    critical: true,
    always: true,
  },
  {
    id: 'refund_proof',
    label: 'Bukti refund diproses dan nominalnya',
    group: 'Transaksi',
    critical: true,
    always: true,
  },
  {
    id: 'return_tracking',
    label: 'Riwayat resi retur dan status pengiriman',
    group: 'Pengembalian',
    critical: true,
  },
  {
    id: 'delivered_proof',
    label: 'Bukti status retur sudah Delivered',
    group: 'Pengembalian',
    critical: false,
  },
  {
    id: 'chat_buyer',
    label: 'Chat dengan pembeli tentang kondisi barang',
    group: 'Komunikasi',
    critical: false,
  },
  {
    id: 'cs_instruction',
    label: 'Arahan agen CS dan tangkapan layar',
    group: 'Komunikasi',
    critical: false,
  },
  {
    id: 'packing_video',
    label: 'Video pengemasan sebelum diserahkan ke kurir',
    group: 'Video',
    critical: true,
  },
  {
    id: 'packing_order_info',
    label: 'Video pengemasan menampilkan nomor pesanan atau resi',
    group: 'Video',
    critical: true,
  },
  {
    id: 'unboxing_6_sides',
    label: 'Video unboxing menunjukkan 6 sisi paket retur',
    group: 'Video',
    critical: true,
  },
  {
    id: 'unboxing_video',
    label: 'Video unboxing utuh tanpa jeda atau suntingan',
    group: 'Video',
    critical: true,
  },
  {
    id: 'unboxing_issue',
    label: 'Video menunjukkan masalah barang (rusak, kurang, beda)',
    group: 'Video',
    critical: true,
  },
  {
    id: 'functional_test',
    label: 'Video uji fungsi bila barang bermasalah fungsi',
    group: 'Video',
    critical: false,
  },
  {
    id: 'product_photos',
    label: 'Foto produk sebelum dikirim',
    group: 'Pengiriman',
    critical: false,
  },
  {
    id: 'weight_proof',
    label: 'Bukti berat paket awal dan retur',
    group: 'Pengiriman',
    critical: false,
  },
  {
    id: 'chronology',
    label: 'Kronologi tertulis yang konsisten',
    group: 'Banding',
    critical: false,
    always: true,
  },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'bukti', label: 'Menyiapkan bukti', open: true },
  { id: 'banding', label: 'Banding diajukan', open: true },
  { id: 'menunggu_info', label: 'Menunggu info tambahan', open: true },
  { id: 'diterima', label: 'Banding diterima', open: false },
  { id: 'ditolak', label: 'Banding ditolak', open: false },
  { id: 'kedaluwarsa', label: 'Jendela lewat', open: false },
];

const LETTER_TYPES = [
  { id: 'banding', label: 'Surat pengajuan banding retur' },
  { id: 'klarifikasi', label: 'Surat jawaban permintaan info tambahan' },
  { id: 'eskalasi', label: 'Surat eskalasi banding' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const CS_RETURN_OPTIONS = [
  { id: 'belum_diminta', label: 'CS belum meminta' },
  { id: 'ya_sudah', label: 'Diminta dan sudah dikirim' },
  { id: 'ya_belum', label: 'Diminta tetapi belum dikirim' },
];

const SOURCES = [
  {
    title: 'Pembaruan Kebijakan Terkini - TikTok Shop by Tokopedia Seller Center',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: '2026-10-29',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=4293090979071761&lang=id-ID',
    facts: 'Jendela banding 7 hari kalender sejak refund diproses atau status retur Delivered. Mulai 2 November 2026 pesanan Tokopedia Mall punya 15 hari kalender untuk mengajukan retur. Mulai 4 November 2026 sebagian kategori pindah ke Refund Only. Mulai 5 November 2026 barang retur wajib dikirim kembali ke pembeli bila diminta agen CS agar banding tetap sah.',
  },
  {
    title: 'Returns And Refunds - TikTok Shop by Tokopedia Seller Center',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: '2026-10-29',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=1683292773779217&lang=en',
    facts: 'Permintaan retur harus ditinjau dalam 2 hari kalender. Produk retur harus ditinjau dalam 2 hari kerja. Bila barang retur belum diterima, banding dapat diajukan mulai hari ke-6 untuk Speedy Refund atau hari ke-15 untuk retur yang diatur pembeli, dengan jendela 7 hari kalender.',
  },
  {
    title: 'Banding Retur TikTok Shop Berubah: 7 Hari dan Video Wajib',
    publisher: 'Superseller.id',
    date: '2026-11-04',
    url: 'https://supersellerid.com/banding-retur-tiktok-shop/',
    facts: 'Merangkum empat perubahan purnajual 27 Oktober sampai 5 November 2026: tenggat banding 7 hari kalender, video unboxing dan pengemasan wajib pada kondisi tertentu, satu kali banding per kasus, batas 24 jam untuk info tambahan, jendela retur Mall 15 hari, dan syarat mengirim barang retur ke pembeli bila diminta CS. Rekomendasi mengajukan banding paling lambat hari ke-3 adalah saran, bukan aturan platform.',
  },
  {
    title: 'TikTok Shop Tetapkan Jendela Banding 7 Hari Mulai 27 Oktober 2026',
    publisher: 'Tuke Marketing',
    date: '2026-10-21',
    url: 'https://www.tktk.com/id/news/4061.html',
    facts: 'Menyebut jendela banding 7 hari kalender untuk permintaan refund tahap pertama yang disetujui platform, serta standar video pengemasan dan unboxing yang harus utuh, jelas, dan tanpa penyuntingan.',
  },
  {
    title: 'Tokopedia Ubah Aturan Purnajual: Mall 15 Hari dan Sebagian Kategori Refund Only',
    publisher: 'Ksher',
    date: '2026-11-05',
    url: 'https://www.ksher.cn/news/post/kjzx26110504/',
    facts: 'Mengonfirmasi jendela retur Tokopedia Mall menjadi 15 hari kalender sejak 2 November 2026 dan sebagian kategori beralih ke Refund Only sejak 4 November 2026.',
  },
];

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function oneOf(value, list, fallback) {
  return list.some((item) => item.id === value) ? value : fallback;
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (
    date.getUTCFullYear() !== parts[0] ||
    date.getUTCMonth() !== parts[1] - 1 ||
    date.getUTCDate() !== parts[2]
  ) {
    return null;
  }
  return date;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function diffDays(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return day + ' ' + month + ' ' + year + ' pukul ' + hours + '.' + minutes;
}

function normalizeInfoRequest(value) {
  const text = cleanText(value, 40);
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  return text;
}

function normalizeInput(raw, today) {
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
    platform: oneOf(input.platform, PLATFORMS, 'tiktok'),
    order_type: oneOf(input.order_type, ORDER_TYPES, 'non_mall'),
    order_ref: cleanText(input.order_ref, MAX_TEXT),
    product_name: cleanText(input.product_name, MAX_TEXT),
    delivered_date: parseDateOnly(input.delivered_date) ? input.delivered_date : '',
    case_type: oneOf(input.case_type, CASE_TYPES, 'refund_only'),
    trigger_date: parseDateOnly(input.trigger_date) ? input.trigger_date : '',
    appeal_reason: oneOf(input.appeal_reason, APPEAL_REASONS, 'wrong_product'),
    buyer_reason_matches: oneOf(input.buyer_reason_matches, YES_NO, 'tidak_tahu'),
    dispute_condition: oneOf(input.dispute_condition, YES_NO, 'tidak'),
    functional_issue: oneOf(input.functional_issue, YES_NO, 'tidak'),
    already_appealed: oneOf(input.already_appealed, YES_NO, 'tidak'),
    cs_return_request: oneOf(input.cs_return_request, CS_RETURN_OPTIONS, 'belum_diminta'),
    info_requested_at: normalizeInfoRequest(input.info_requested_at),
    evidence: uniqueEvidence,
    chronology: cleanText(input.chronology, MAX_CHRONOLOGY),
    ticket: cleanText(input.ticket, MAX_TEXT),
    note: cleanText(input.note, MAX_NOTE),
    status: oneOf(input.status, CASE_STATUSES, 'baru'),
    today: today || '',
  };
}

function findById(list, id) {
  return list.find((item) => item.id === id) || list[0];
}

function requirementsFor(input) {
  const reason = findById(APPEAL_REASONS, input.appeal_reason);
  let unboxing = reason.unboxing;
  let packing = reason.packing;

  if (reason.id === 'buyer_wrong_reason') {
    unboxing = input.dispute_condition === 'ya' ? 'wajib' : 'opsional';
  }
  if (
    input.buyer_reason_matches === 'ya' &&
    reason.id !== 'not_received' &&
    reason.id !== 'sent_authentic'
  ) {
    packing = 'wajib';
  }
  if (reason.id === 'not_received') {
    unboxing = 'tidak_perlu';
    packing = 'tidak_perlu';
  }

  return {
    unboxing,
    packing,
    functional:
      input.functional_issue === 'ya'
        ? 'wajib'
        : reason.id === 'damaged' || reason.id === 'used'
          ? 'disarankan'
          : 'tidak_perlu',
    note: reason.note,
  };
}

function evidenceRequirement(item, input, requirements) {
  if (item.always) return 'required';

  if (item.id === 'return_tracking') {
    return input.case_type === 'refund_only' || input.case_type === 'dispute'
      ? 'recommended'
      : 'required';
  }
  if (item.id === 'delivered_proof') {
    return input.case_type === 'speedy_refund' || input.case_type === 'self_arranged'
      ? 'required'
      : 'not_needed';
  }
  if (item.id === 'cs_instruction') {
    if (input.cs_return_request !== 'belum_diminta' || input.info_requested_at) {
      return 'required';
    }
    return 'recommended';
  }
  if (item.id === 'packing_video' || item.id === 'packing_order_info') {
    if (requirements.packing === 'wajib') return 'required';
    if (requirements.packing === 'opsional') return 'recommended';
    return 'not_needed';
  }
  if (
    item.id === 'unboxing_6_sides' ||
    item.id === 'unboxing_video' ||
    item.id === 'unboxing_issue'
  ) {
    if (requirements.unboxing === 'wajib') return 'required';
    if (requirements.unboxing === 'opsional') return 'recommended';
    return 'not_needed';
  }
  if (item.id === 'functional_test') {
    if (requirements.functional === 'wajib') return 'required';
    if (requirements.functional === 'disarankan') return 'recommended';
    return 'not_needed';
  }
  return 'recommended';
}

function assessEvidence(input, requirements) {
  const items = EVIDENCE.map((item) => {
    const requirement = evidenceRequirement(item, input, requirements);
    return {
      id: item.id,
      label: item.label,
      group: item.group,
      critical: Boolean(item.critical),
      requirement,
      checked: input.evidence.includes(item.id),
    };
  });

  const required = items.filter((item) => item.requirement === 'required');
  const recommended = items.filter((item) => item.requirement === 'recommended');
  const missingRequired = required.filter((item) => !item.checked);
  const missingCritical = missingRequired.filter((item) => item.critical);
  const checkedRequired = required.length - missingRequired.length;
  const checkedRecommended = recommended.filter((item) => item.checked).length;

  const requiredScore = required.length ? checkedRequired / required.length : 1;
  const recommendedScore = recommended.length ? checkedRecommended / recommended.length : 1;
  const score = Math.round((requiredScore * 0.8 + recommendedScore * 0.2) * 100);

  let label = 'Belum siap';
  if (missingRequired.length === 0 && score >= 90) label = 'Siap';
  else if (score >= 60) label = 'Hampir siap';

  return {
    items,
    required_total: required.length,
    required_checked: checkedRequired,
    recommended_total: recommended.length,
    recommended_checked: checkedRecommended,
    missing_required: missingRequired,
    missing_critical: missingCritical,
    score,
    label,
  };
}

function buyerWindow(input, todayDate) {
  if (!input.delivered_date) return null;
  const delivered = parseDateOnly(input.delivered_date);
  if (!delivered) return null;

  let days = input.order_type === 'mall' ? MALL_RETURN_DAYS : NON_MALL_RETURN_DAYS;
  let note = '';
  if (input.order_type === 'mall' && input.delivered_date < MALL_EFFECTIVE) {
    days = NON_MALL_RETURN_DAYS;
    note = 'Pesanan Mall sebelum 2 November 2026 memakai jendela 6 hari.';
  }

  const last = addDays(delivered, days);
  const remaining = diffDays(todayDate, last);
  return {
    days,
    last_date: dateOnly(last),
    last_label: formatDate(last),
    days_left: remaining,
    status: remaining < 0 ? 'tutup' : 'terbuka',
    label:
      remaining < 0
        ? 'Jendela retur pembeli sudah tutup'
        : 'Permintaan retur masih bisa datang sampai ' + formatDate(last),
    note,
  };
}

function infoWindow(input, now) {
  if (!input.info_requested_at) return null;
  const requested = new Date(input.info_requested_at);
  if (Number.isNaN(requested.getTime())) return null;
  const deadline = new Date(requested.getTime() + INFO_HOURS * 3600000);
  const hoursLeft = (deadline.getTime() - now.getTime()) / 3600000;
  return {
    requested_at: input.info_requested_at,
    requested_label: formatDateTime(requested),
    deadline_at: deadline.toISOString(),
    deadline_label: formatDateTime(deadline),
    hours_left: Math.round(hoursLeft * 10) / 10,
    expired: hoursLeft < 0,
    label:
      hoursLeft < 0
        ? 'Batas info tambahan sudah lewat'
        : 'Sisa ' + Math.max(0, Math.round(hoursLeft * 10) / 10) + ' jam untuk mengirim info tambahan',
  };
}

function deadlineFor(input, todayDate) {
  const start = parseDateOnly(input.trigger_date);
  if (!start) {
    throw new Error('Tanggal mulai jendela banding wajib diisi.');
  }
  const deadline = addDays(start, APPEAL_DAYS);
  const safe = addDays(start, APPEAL_DAYS - 1);
  const recommended = addDays(start, RECOMMENDED_OFFSET_DAYS);
  const daysLeft = diffDays(todayDate, deadline);

  let status = 'terbuka';
  let label = 'Jendela banding terbuka';
  if (daysLeft < 0) {
    status = 'lewat';
    label = 'Jendela banding sudah lewat';
  } else if (daysLeft === 0) {
    status = 'hari_ini';
    label = 'Batas banding hari ini';
  } else if (daysLeft <= 3) {
    status = 'segera';
    label = 'Segera ajukan banding';
  }

  return {
    start_date: input.trigger_date,
    start_label: formatDate(start),
    deadline_date: dateOnly(deadline),
    deadline_label: formatDate(deadline),
    safe_date: dateOnly(safe),
    safe_label: formatDate(safe),
    recommended_date: dateOnly(recommended),
    recommended_label: formatDate(recommended),
    days_left: daysLeft,
    status,
    label,
  };
}

function buildSignals(input, deadline, evidence, info, requirements) {
  const signals = [];

  if (deadline.status === 'lewat') {
    signals.push({
      level: 'ember',
      label: 'Jendela banding sudah lewat',
      note: 'Batas ' + deadline.deadline_label + '. Banding baru biasanya tidak bisa diajukan.',
    });
  } else if (deadline.status === 'hari_ini') {
    signals.push({
      level: 'ember',
      label: 'Batas banding hari ini',
      note: 'Ajukan sebelum tenggat di Seller Center. Jangan menunggu sampai malam.',
    });
  } else if (deadline.status === 'segera') {
    signals.push({
      level: 'ember',
      label: 'Sisa waktu ' + deadline.days_left + ' hari',
      note: 'Ajukan sekarang. Sediakan ruang bila platform meminta info tambahan 24 jam.',
    });
  }

  if (input.cs_return_request === 'ya_belum') {
    signals.push({
      level: 'ember',
      label: 'Barang retur belum dikirim ke pembeli',
      note: 'Sejak 5 November 2026, instruksi agen CS untuk mengirim barang ke pembeli wajib dipatuhi agar banding tetap sah.',
    });
  }

  if (input.already_appealed === 'ya') {
    signals.push({
      level: 'signal',
      label: 'Banding sudah pernah diajukan',
      note: 'Kebijakan 3 November 2026 menyebut satu kali banding per kasus. Jangan ajukan banding kedua tanpa arahan CS.',
    });
  }

  if (info && info.expired) {
    signals.push({
      level: 'ember',
      label: 'Batas info tambahan sudah lewat',
      note: 'Permintaan info tambahan berakhir ' + info.deadline_label + '.',
    });
  }

  if (requirements.unboxing === 'wajib') {
    signals.push({
      level: 'signal',
      label: 'Video unboxing wajib',
      note: 'Rekam 6 sisi paket, resi, dan proses membuka paket tanpa jeda atau suntingan.',
    });
  }

  if (requirements.packing === 'wajib') {
    signals.push({
      level: 'signal',
      label: 'Video pengemasan wajib',
      note: 'Video harus menunjukkan produk, jumlah, nomor pesanan, dan label pada paket yang sudah tertutup.',
    });
  }

  if (evidence.missing_critical.length > 0) {
    signals.push({
      level: 'ember',
      label: 'Bukti kritis belum lengkap',
      note: evidence.missing_critical.map((item) => item.label).join(', '),
    });
  }

  if (input.case_type.startsWith('not_received')) {
    signals.push({
      level: 'signal',
      label: 'Barang retur belum diterima',
      note: 'Lampirkan resi, riwayat pelacakan, dan tiket CS. Video unboxing tidak relevan.',
    });
  }

  return signals;
}

function buildVerdict(input, deadline, evidence, info, requirements) {
  if (input.platform === 'lain') {
    return {
      level: 'signal',
      label: 'Aturan khusus belum tersedia',
      detail: 'Tool ini memuat aturan TikTok Shop by Tokopedia dan Tokopedia. Untuk platform lain, cocokkan tenggat dan bukti di pusat bantuan masing-masing.',
    };
  }

  if (input.cs_return_request === 'ya_belum') {
    return {
      level: 'ember',
      label: 'Banding belum memenuhi syarat',
      detail: 'Sejak 5 November 2026, barang retur harus dikirim ke pembeli bila diminta agen CS. Kirim hari ini dan simpan resi.',
    };
  }

  if (deadline.status === 'lewat') {
    return {
      level: 'ember',
      label: 'Jendela banding sudah lewat',
      detail: 'Batas ' + deadline.deadline_label + '. Fokus pada eskalasi ke CS dan pelajaran untuk paket berikutnya.',
    };
  }

  if (info && info.expired) {
    return {
      level: 'ember',
      label: 'Batas info tambahan sudah lewat',
      detail: 'Info tambahan diminta paling lambat ' + info.requested_label + ' dan batasnya ' + info.deadline_label + '.',
    };
  }

  if (input.already_appealed === 'ya') {
    return {
      level: 'signal',
      label: 'Banding sudah diajukan',
      detail: 'Pantau jawaban dan siapkan info tambahan dalam 24 jam bila diminta. Kesempatan banding hanya satu per kasus.',
    };
  }

  if (evidence.missing_critical.length > 0 || evidence.score < 60) {
    return {
      level: 'ember',
      label: 'Jendela terbuka, bukti belum lengkap',
      detail: 'Lengkapi ' + evidence.missing_critical.length + ' bukti kritis. Skor kesiapan ' + evidence.score + ' persen.',
    };
  }

  if (deadline.status === 'hari_ini' || deadline.status === 'segera') {
    return {
      level: 'ember',
      label: 'Segera ajukan banding',
      detail: 'Batas ' + deadline.deadline_label + '. Sisa ' + Math.max(0, deadline.days_left) + ' hari kalender.',
    };
  }

  if (evidence.label === 'Siap') {
    return {
      level: 'ok',
      label: 'Siap ajukan banding',
      detail: 'Bukti wajib lengkap. Ajukan paling lambat ' + deadline.recommended_label + ' agar masih ada ruang untuk info tambahan.',
    };
  }

  return {
    level: 'signal',
    label: 'Jendela terbuka, lengkapi bukti',
    detail: 'Skor kesiapan ' + evidence.score + ' persen. Lengkapi bukti yang disarankan sebelum mengajukan.',
  };
}

function buildRecommendations(input, deadline, evidence, info, requirements, buyer) {
  const list = [];

  if (deadline.status !== 'lewat') {
    list.push(
      'Ajukan banding paling lambat ' +
        deadline.recommended_label +
        ' (rekomendasi hari ke-3), supaya masih ada waktu bila platform meminta info tambahan 24 jam.'
    );
  }

  if (input.cs_return_request === 'ya_belum') {
    list.push('Kirim barang retur ke pembeli hari ini sesuai arahan agen CS, lalu simpan nomor resi dan tangkapan layar chat.');
  }

  if (input.cs_return_request === 'ya_sudah') {
    list.push('Simpan resi pengiriman balik ke pembeli dan tangkapan layar instruksi CS sebagai bukti syarat banding.');
  }

  if (requirements.unboxing === 'wajib') {
    list.push('Rekam video unboxing paket retur dari 6 sisi, tampilkan resi, lalu buka paket tanpa jeda sampai masalah terlihat.');
  }

  if (requirements.packing === 'wajib') {
    list.push('Siapkan video pengemasan yang menunjukkan produk, jumlah, nomor pesanan atau resi, dan label pada paket tertutup.');
  }

  if (requirements.functional === 'wajib') {
    list.push('Tambahkan video uji fungsi yang menunjukkan barang bermasalah saat dinyalakan atau dipakai.');
  }

  if (input.case_type.startsWith('not_received')) {
    list.push('Lampirkan riwayat pelacakan resi, bukti barang tidak pernah diterima, dan tiket CS. Jangan membuat video unboxing.');
  }

  if (input.already_appealed === 'ya') {
    list.push('Jangan ajukan banding kedua tanpa arahan CS. Kesempatan banding satu kali per kasus.');
  }

  if (info && !info.expired) {
    list.push('Kirim info tambahan sebelum ' + info.deadline_label + '. Setelah lewat, banding bisa gugur.');
  }

  if (evidence.missing_required.length > 0) {
    list.push('Lengkapi bukti wajib: ' + evidence.missing_required.map((item) => item.label).join(', ') + '.');
  }

  if (buyer && buyer.status === 'terbuka') {
    list.push('Ingat, permintaan retur baru masih bisa datang sampai ' + buyer.last_label + ' untuk pesanan ' + (input.order_type === 'mall' ? 'Mall' : 'Non-Mall') + '.');
  }

  list.push('Cocokkan tanggal tenggat di Seller Center sebelum mengirim. Batas waktu mengikuti zona waktu platform, bukan hitungan lokal tool ini.');

  return list;
}

function analyze(raw, options) {
  const opts = options || {};
  const today = opts.today || raw.today || '';
  const todayDate = parseDateOnly(today);
  if (!todayDate) throw new Error('Tanggal hari ini tidak valid.');
  const input = normalizeInput(raw, today);
  if (!input.trigger_date) throw new Error('Tanggal mulai jendela banding wajib diisi.');

  const requirements = requirementsFor(input);
  const evidence = assessEvidence(input, requirements);
  const deadline = deadlineFor(input, todayDate);
  const buyer = buyerWindow(input, todayDate);
  const now = opts.now instanceof Date ? opts.now : new Date();
  const info = infoWindow(input, now);
  const signals = buildSignals(input, deadline, evidence, info, requirements);
  const verdict = buildVerdict(input, deadline, evidence, info, requirements);
  const recommendations = buildRecommendations(input, deadline, evidence, info, requirements, buyer);

  return {
    input,
    platform_label: findById(PLATFORMS, input.platform).label,
    order_type_label: findById(ORDER_TYPES, input.order_type).label,
    case_type: findById(CASE_TYPES, input.case_type),
    appeal_reason: findById(APPEAL_REASONS, input.appeal_reason),
    deadline,
    buyer_window: buyer,
    info_window: info,
    requirements,
    evidence,
    signals,
    verdict,
    recommendations,
    rules: {
      appeal_days: APPEAL_DAYS,
      recommended_submit_day: RECOMMENDED_SUBMIT_DAY,
      info_hours: INFO_HOURS,
      mall_return_days: MALL_RETURN_DAYS,
      non_mall_return_days: NON_MALL_RETURN_DAYS,
      appeal_effective: APPEAL_EFFECTIVE,
      mall_effective: MALL_EFFECTIVE,
      cs_return_effective: CS_RETURN_EFFECTIVE,
    },
    sources: SOURCES,
  };
}

function letter(raw, options) {
  const result = analyze(raw, options);
  const input = result.input;
  const type = oneOf(raw.letter_type, LETTER_TYPES, 'banding');
  const store = input.store_name || 'Toko saya';
  const seller = input.seller_name || 'Penjual';
  const contact = input.contact || '-';
  const order = input.order_ref || '(nomor pesanan belum diisi)';
  const product = input.product_name || '(nama produk belum diisi)';
  const evidenceLabels = result.evidence.items
    .filter((item) => item.requirement !== 'not_needed')
    .map((item) => '- ' + item.label + (item.checked ? ' (sudah ada)' : ' (belum ada)'))
    .join('\n');
  const reason = result.appeal_reason.label;
  const chronology = input.chronology || 'Belum ada kronologi tertulis.';
  const ticket = input.ticket ? 'Nomor tiket: ' + input.ticket + '.' : '';

  let subject = 'Pengajuan banding retur pesanan ' + order;
  let heading = 'Kepada Tim Seller Support,';
  let body = '';

  if (type === 'klarifikasi') {
    subject = 'Jawaban permintaan informasi tambahan banding retur pesanan ' + order;
    heading = 'Kepada Tim Seller Support,';
    body =
      'Saya ' + seller + ', penjual di ' + store + ', menanggapi permintaan informasi tambahan untuk pesanan ' + order + ' (' + product + ').\n\n' +
      'Alasan banding: ' + reason + '.\n' +
      'Tanggal mulai jendela banding: ' + result.deadline.start_label + '.\n' +
      'Batas banding: ' + result.deadline.deadline_label + '.\n' +
      (result.info_window ? 'Permintaan info tambahan: ' + result.info_window.requested_label + '.\nBatas jawaban: ' + result.info_window.deadline_label + '.\n' : '') +
      '\nKronologi:\n' + chronology + '\n\n' +
      'Berkas yang saya lampirkan:\n' + evidenceLabels + '\n\n' +
      'Mohon informasi tambahan ini dipertimbangkan dalam peninjauan banding. Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else if (type === 'eskalasi') {
    subject = 'Permintaan eskalasi banding retur pesanan ' + order;
    heading = 'Kepada Tim Seller Support dan Account Manager,';
    body =
      'Saya ' + seller + ', penjual di ' + store + ', meminta eskalasi atas banding retur pesanan ' + order + ' (' + product + ').\n\n' +
      'Alasan banding: ' + reason + '.\n' +
      'Tanggal mulai jendela banding: ' + result.deadline.start_label + '.\n' +
      'Batas banding: ' + result.deadline.deadline_label + '.\n' +
      (ticket ? ticket + '\n' : '') +
      '\nKronologi:\n' + chronology + '\n\n' +
      'Status bukti saat ini: ' + result.evidence.score + ' persen. ' + (result.evidence.missing_required.length ? 'Bukti yang masih dilengkapi: ' + result.evidence.missing_required.map((item) => item.label).join(', ') + '.' : 'Seluruh bukti wajib sudah tersedia.') + '\n\n' +
      'Mohon banding ditinjau ulang dan diberikan kepastian status. Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else {
    body =
      'Saya ' + seller + ', penjual di ' + store + ', mengajukan banding atas keputusan retur dan refund pesanan ' + order + ' (' + product + ').\n\n' +
      'Alasan banding: ' + reason + '.\n' +
      'Tanggal mulai jendela banding: ' + result.deadline.start_label + '.\n' +
      'Batas banding: ' + result.deadline.deadline_label + '.\n' +
      (ticket ? ticket + '\n' : '') +
      '\nKronologi:\n' + chronology + '\n\n' +
      'Berkas yang saya lampirkan:\n' + evidenceLabels + '\n\n' +
      'Saya meminta keputusan ditinjau ulang berdasarkan bukti yang lengkap. Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  }

  return {
    type,
    subject,
    body,
  };
}

function example() {
  return {
    store_name: 'Toko Contoh',
    seller_name: 'Rina',
    contact: 'rina@example.com',
    platform: 'tiktok',
    order_type: 'mall',
    order_ref: 'ORD-2026-1104',
    product_name: 'Sepatu lari ukuran 42',
    delivered_date: '2026-11-02',
    case_type: 'refund_only',
    trigger_date: '2026-11-04',
    appeal_reason: 'wrong_product',
    buyer_reason_matches: 'ya',
    dispute_condition: 'ya',
    functional_issue: 'tidak',
    already_appealed: 'tidak',
    cs_return_request: 'belum_diminta',
    info_requested_at: '',
    evidence: [
      'order_detail',
      'buyer_request',
      'refund_proof',
      'return_tracking',
      'unboxing_6_sides',
      'unboxing_video',
      'unboxing_issue',
      'chat_buyer',
      'chronology',
    ],
    chronology:
      'Pesanan dikirim 28 Oktober 2026 dengan video pengemasan dan diterima pembeli 2 November 2026. Pembeli mengajukan retur 3 November 2026. Refund diproses 4 November 2026. Barang retur diterima 6 November 2026 dan isinya berbeda dari produk yang dikirim.',
    ticket: 'TKT-2026-8811',
    note: 'Menunggu banding diajukan.',
    status: 'bukti',
  };
}

function summarizeCases(rawCases, today) {
  const todayDate = parseDateOnly(today);
  if (!todayDate) throw new Error('Tanggal hari ini tidak valid.');
  const cases = (Array.isArray(rawCases) ? rawCases : []).map((item) => {
    const analysis = analyze(item, { today });
    return {
      id: item.id,
      store_name: item.store_name,
      order_ref: item.order_ref,
      product_name: item.product_name,
      platform_label: analysis.platform_label,
      order_type_label: analysis.order_type_label,
      case_type_label: analysis.case_type.label,
      appeal_reason_label: analysis.appeal_reason.label,
      trigger_date: analysis.deadline.start_date,
      deadline_date: analysis.deadline.deadline_date,
      deadline_label: analysis.deadline.deadline_label,
      days_left: analysis.deadline.days_left,
      deadline_status: analysis.deadline.status,
      readiness_score: analysis.evidence.score,
      readiness_label: analysis.evidence.label,
      missing_required: analysis.evidence.missing_required.map((entry) => entry.label),
      verdict: analysis.verdict,
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
  const dueSoon = open.filter(
    (item) => item.days_left >= 0 && item.days_left <= 3 && item.deadline_status !== 'lewat'
  );
  const expired = open.filter((item) => item.days_left < 0);
  const missingEvidence = open.filter((item) => item.missing_required.length > 0);

  return {
    total: cases.length,
    open_cases: open.length,
    due_soon: dueSoon.length,
    expired: expired.length,
    missing_evidence: missingEvidence.length,
    cases,
  };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(rawCases, today) {
  const summary = summarizeCases(rawCases, today);
  const header = [
    'id',
    'toko',
    'nomor_pesanan',
    'platform',
    'tipe_pesanan',
    'jenis_kasus',
    'alasan_banding',
    'tanggal_mulai',
    'batas_banding',
    'sisa_hari',
    'skor_bukti',
    'status',
    'catatan',
  ];
  const rows = summary.cases.map((item) => [
    item.id,
    item.store_name,
    item.order_ref,
    item.platform_label,
    item.order_type_label,
    item.case_type_label,
    item.appeal_reason_label,
    item.trigger_date,
    item.deadline_date,
    item.days_left,
    item.readiness_score,
    item.status_label,
    item.note,
  ]);
  return [header].concat(rows).map((row) => row.map(csvEscape).join(',')).join('\n');
}

function meta() {
  return {
    platforms: PLATFORMS,
    order_types: ORDER_TYPES,
    case_types: CASE_TYPES,
    appeal_reasons: APPEAL_REASONS,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    yes_no: YES_NO,
    cs_return_options: CS_RETURN_OPTIONS,
    rules: {
      appeal_days: APPEAL_DAYS,
      recommended_submit_day: RECOMMENDED_SUBMIT_DAY,
      info_hours: INFO_HOURS,
      mall_return_days: MALL_RETURN_DAYS,
      non_mall_return_days: NON_MALL_RETURN_DAYS,
      appeal_effective: APPEAL_EFFECTIVE,
      mall_effective: MALL_EFFECTIVE,
      cs_return_effective: CS_RETURN_EFFECTIVE,
    },
    sources: SOURCES,
  };
}

module.exports = {
  meta,
  example,
  analyze,
  letter,
  summarizeCases,
  csvRows,
  normalizeInput,
  formatDate,
  parseDateOnly,
  APPEAL_REASONS,
  EVIDENCE,
};
