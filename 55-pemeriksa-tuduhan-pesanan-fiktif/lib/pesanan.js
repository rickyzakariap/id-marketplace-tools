'use strict';

const MAX_NOTE = 400;
const MAX_TEXT = 160;

const MARKETPLACES = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tokopedia', label: 'Tokopedia' },
  { id: 'tiktok', label: 'TikTok Shop' },
  { id: 'lazada', label: 'Lazada' },
  { id: 'blibli', label: 'Blibli' },
  { id: 'lain', label: 'Marketplace lain' },
];

const TRIGGERS = [
  { id: 'subsidi_voucher', label: 'Penyalahgunaan subsidi atau voucher' },
  { id: 'lonjakan_pesanan', label: 'Lonjakan pesanan dianggap tidak wajar' },
  { id: 'pembeli_fraud', label: 'Pembeli terindikasi fraud voucher' },
  { id: 'resi_tidak_jelas', label: 'Bukti pengiriman dianggap tidak jelas' },
  { id: 'pesanan_fiktif', label: 'Tuduhan pesanan fiktif' },
  { id: 'lain', label: 'Alasan lain' },
];

const SANCTION_STATUSES = [
  { id: 'aktif', label: 'Sanksi aktif, toko nonaktif', open: true },
  { id: 'banding', label: 'Banding diajukan', open: true },
  { id: 'menunggu_hasil', label: 'Menunggu hasil banding', open: true },
  { id: 'banding_diterima', label: 'Banding diterima, saldo belum pulih', open: true },
  { id: 'pelanggaran_dibatalkan', label: 'Pelanggaran dibatalkan, saldo belum pulih', open: true },
  { id: 'ditolak', label: 'Banding ditolak', open: true },
  { id: 'saldo_dipulihkan', label: 'Saldo sudah dipulihkan', open: false },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'kumpul_bukti', label: 'Mengumpulkan bukti', open: true },
  { id: 'banding', label: 'Banding diajukan', open: true },
  { id: 'menunggu_hasil', label: 'Menunggu hasil', open: true },
  { id: 'banding_diterima', label: 'Banding diterima', open: true },
  { id: 'minta_saldo', label: 'Menagih pemulihan saldo', open: true },
  { id: 'eskalasi', label: 'Eskalasi ke Kementerian UMKM', open: true },
  { id: 'saldo_dipulihkan', label: 'Saldo dipulihkan', open: false },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'ditolak', label: 'Ditolak', open: false },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
];

const LETTER_TYPES = [
  { id: 'banding', label: 'Surat banding tuduhan pesanan fiktif' },
  { id: 'pemulihan', label: 'Surat permintaan pemulihan saldo' },
  { id: 'eskalasi', label: 'Surat eskalasi ke Kementerian UMKM' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const FACTS = [
  { id: 'written_reason', label: 'Alasan tertulis dari platform diterima', good: true },
  { id: 'order_ids', label: 'Daftar ID pesanan yang dituduh diberikan', good: true },
  { id: 'human_review', label: 'Ada peninjauan manusia atas bukti', good: true },
  { id: 'deduction_breakdown', label: 'Rincian potongan saldo diberikan', good: true },
  { id: 'official_subsidy', label: 'Ikut program subsidi resmi platform', good: true },
  { id: 'shipping_proof', label: 'Punya resi dan bukti serah terima ke kurir', good: true },
  { id: 'stock_invoice', label: 'Punya invoice pembelian stok', good: true },
  { id: 'buyer_received', label: 'Pembeli mengonfirmasi barang diterima', good: true },
  { id: 'appeal_result_written', label: 'Hasil banding disampaikan tertulis', good: true },
  { id: 'automated_decision', label: 'Keputusan dibuat otomatis oleh sistem', good: false },
  { id: 'reason_changed', label: 'Alasan tuduhan berubah antar keputusan', good: false },
  { id: 'appeal_limited', label: 'Kesempatan banding dibatasi', good: false },
  { id: 'case_closed', label: 'Kasus ditutup saat belum selesai', good: false },
  { id: 'platform_evidence', label: 'Platform menunjukkan bukti pelanggaran', good: false },
];

const EVIDENCE = [
  {
    id: 'sanction_notice',
    label: 'Tangkapan layar notifikasi sanksi dan alasan tertulis',
    critical: true,
  },
  {
    id: 'order_ids_proof',
    label: 'Daftar ID pesanan yang dituduh beserta statusnya',
    critical: true,
  },
  {
    id: 'shipping_receipt',
    label: 'Resi dan bukti serah terima paket ke kurir',
    critical: true,
  },
  {
    id: 'bank_mutation',
    label: 'Mutasi rekening atau riwayat pencairan saldo',
    critical: true,
  },
  {
    id: 'subsidy_proof',
    label: 'Bukti partisipasi program subsidi resmi',
    critical: true,
  },
  {
    id: 'stock_invoice',
    label: 'Invoice pembelian stok dan bukti kepemilikan barang',
    critical: false,
  },
  {
    id: 'packing_video',
    label: 'Video pengemasan sebelum paket diserahkan',
    critical: false,
  },
  {
    id: 'stock_photo',
    label: 'Foto stok, gudang, dan alur pengemasan',
    critical: false,
  },
  {
    id: 'cs_chat',
    label: 'Chat atau email CS dengan nomor tiket',
    critical: false,
  },
  {
    id: 'appeal_email',
    label: 'Email banding yang dikirim beserta lampirannya',
    critical: false,
  },
  {
    id: 'appeal_result',
    label: 'Hasil banding tertulis dari platform',
    critical: false,
  },
  {
    id: 'buyer_confirmation',
    label: 'Konfirmasi pembeli bahwa barang diterima',
    critical: false,
  },
  {
    id: 'escalation_report',
    label: 'Laporan SP4N-Lapor atau Kementerian UMKM',
    critical: false,
  },
];

const SOURCES = [
  {
    title: 'Rp38,5 Juta Saldo Penjualan Diambil Sepihak oleh TikTok Shop Tokopedia, Meski Sanksi Sudah Dibatalkan',
    publisher: 'Media Konsumen',
    date: '2026-11-12',
    url: 'https://mediakonsumen.com/2026/11/12/surat-pembaca/rp38-juta-saldo-penjualan-diambil-sepihak-oleh-tiktok-shop-tokopedia-meski-sanksi-sudah-dibatalkan',
    facts: 'Surat pembaca 12 November 2026 mencatat toko dinonaktifkan 10 Mei 2026 karena diduga menyalahgunakan subsidi. Saldo Rp38.513.620 ditahan 90 hari sampai 8 Agustus 2026, lalu diambil seluruhnya pada 7 Agustus 2026 atau satu hari sebelum masa tahan berakhir. Setelah mediasi Kementerian UMKM dan banding, pelanggaran dibatalkan dan toko bisa diakses lagi, tetapi saldo tetap Rp0.',
  },
  {
    title: 'Sistem AI TikTok Shop Merampas Modal Usaha Rp12,8 Juta Secara Sepihak dengan Tuduhan Fake Order',
    publisher: 'Media Konsumen',
    date: '2026-09-12',
    url: 'https://mediakonsumen.com/2026/09/12/surat-pembaca/sistem-ai-tiktok-shop-merampas-modal-usaha-rp128-juta-secara-sepihak-dengan-tuduhan-fake-order-yang-tidak-berdasar',
    facts: 'Surat pembaca 12 September 2026 mencatat tuduhan fake order pada 11 Juni 2026 setelah toko ikut program subsidi resmi. Saldo Rp12.805.727 dipotong, toko dinonaktifkan, dan sisa Rp13.421.313 ditahan 90 hari. Banding lewat Seller Center ditolak otomatis tanpa peninjauan manusia terhadap bukti resi.',
  },
  {
    title: 'Tokopedia dan TikTok Shop jelaskan soal polemik saldo penjual ke DPR',
    publisher: 'ANTARA News',
    date: '2026-09-08',
    url: 'https://www.antaranews.com/berita/5731873/tokopedia-dan-tiktok-shop-jelaskan-soal-polemik-saldo-penjual-ke-dpr',
    facts: 'Dalam dengar pendapat dengan Komisi VII DPR RI pada 8 September 2026, platform menyebut 217 penjual terdampak dengan dana Rp24 miliar dan Rp16,7 miliar di antaranya terkait fraud. Platform menyatakan jangka waktu investigasi adalah 90 hari plus 90 hari dan penjual tetap dapat mengajukan banding.',
  },
  {
    title: 'Miris Nasib Seller TikTok: Saldo Ditahan Kemudian Lenyap',
    publisher: 'detikFinance',
    date: '2026-10-01',
    url: 'https://finance.detik.com/berita-ekonomi-bisnis/d-8686816/miris-nasib-seller-tiktok-saldo-ditahan-kemudian-lenyap',
    facts: 'Pemberitaan 1 Oktober 2026 mencatat dua penjual yang saldonya berubah menjadi Rp0. Salah satunya kehilangan Rp549 juta dan terpaksa memutus hubungan kerja 20 karyawan. Penjual lain kehilangan sekitar Rp566 juta setelah saldo ditahan tiga bulan tanpa kejelasan.',
  },
];

const THRESHOLDS = {
  reply_promise_days: 14,
  investigation_days: 90,
  extension_days: 90,
  note: 'Janji jawaban 14 hari kalender tercatat pada kasus contoh 12 November 2026, bukan aturan umum. Jangka 90 hari plus 90 hari berasal dari pernyataan platform dalam dengar pendapat DPR 8 September 2026, bukan aturan tertulis. Keduanya penanda audit internal.',
};

const SCOPE_NOTE =
  'Tool membantu menghitung dana berisiko, menilai kelengkapan pembelaan, memetakan bukti, dan menyiapkan surat. Tool tidak menentukan siapa bersalah dan tidak menjamin banding atau pemulihan saldo.';

const DISCLAIMER =
  'Hasil ini bukan putusan hukum atau jaminan hasil banding. Keputusan ada pada marketplace dan pihak berwenang. Selalu gunakan kanal resmi Seller Center dan simpan semua dokumen asli.';

const FIELD_LABELS = {
  balance_held: 'Saldo yang masih ditahan',
  balance_deducted: 'Saldo yang sudah dipotong',
  balance_restored: 'Saldo yang sudah dikembalikan',
  balance_before: 'Saldo sebelum sanksi',
  orders_per_day: 'Pesanan per hari',
  aov: 'Nilai pesanan rata-rata',
  margin_pct: 'Margin laba',
};

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
  return Math.round(value * 100) / 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function formatRupiah(value) {
  return 'Rp ' + formatNumber(value);
}

function parseWhen(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function formatWhen(value) {
  const time = parseWhen(value);
  if (time === null) return 'tanggal tidak tercatat';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(time));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  if (from === null || to === null) return null;
  return Math.round((to - from) / 86400000);
}

function dateField(raw) {
  return cleanText(raw, 20);
}

function normalizeInput(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const evidenceIds = EVIDENCE.map((item) => item.id);
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((id) => evidenceIds.includes(id))
    : [];
  const uniqueEvidence = evidence.filter((id, index) => evidence.indexOf(id) === index);
  const facts = input.facts && typeof input.facts === 'object' ? input.facts : {};

  const normalizeFact = (id) => {
    const value = facts[id];
    return oneOf(value, YES_NO, 'tidak_tahu');
  };

  return {
    store_name: cleanText(input.store_name, MAX_TEXT),
    seller_name: cleanText(input.seller_name, MAX_TEXT),
    contact: cleanText(input.contact, MAX_TEXT),
    ticket: cleanText(input.ticket, MAX_TEXT),
    marketplace: oneOf(input.marketplace, MARKETPLACES, 'tiktok'),
    trigger: oneOf(input.trigger, TRIGGERS, 'subsidi_voucher'),
    sanction_status: oneOf(input.sanction_status, SANCTION_STATUSES, 'aktif'),
    status: oneOf(input.status, CASE_STATUSES, 'baru'),
    accusation_date: dateField(input.accusation_date),
    deactivation_date: dateField(input.deactivation_date),
    reactivated_date: dateField(input.reactivated_date),
    appeal_date: dateField(input.appeal_date),
    appeal_result_date: dateField(input.appeal_result_date),
    deduction_date: dateField(input.deduction_date),
    hold_end_date: dateField(input.hold_end_date),
    as_of: dateField(input.as_of) || todayIso(),
    balance_held: numOr(input.balance_held, 0),
    balance_deducted: numOr(input.balance_deducted, 0),
    balance_restored: numOr(input.balance_restored, 0),
    balance_before: numOr(input.balance_before, 0),
    orders_per_day: numOr(input.orders_per_day, 0),
    aov: numOr(input.aov, 0),
    margin_pct: numOr(input.margin_pct, 0),
    note: cleanText(input.note, MAX_NOTE),
    facts: FACTS.reduce((acc, item) => {
      acc[item.id] = normalizeFact(item.id);
      return acc;
    }, {}),
    evidence: uniqueEvidence,
  };
}

function validateAnalysis(input) {
  [
    'balance_held',
    'balance_deducted',
    'balance_restored',
    'balance_before',
    'orders_per_day',
    'aov',
    'margin_pct',
  ].forEach((key) => {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
  });

  if (input.margin_pct > 100) {
    throw new Error(FIELD_LABELS.margin_pct + ' maksimal 100 persen.');
  }

  [
    'accusation_date',
    'deactivation_date',
    'reactivated_date',
    'appeal_date',
    'appeal_result_date',
    'deduction_date',
    'hold_end_date',
    'as_of',
  ].forEach((key) => {
    if (input[key] && parseWhen(input[key]) === null) {
      throw new Error('Tanggal ' + key.replace(/_/g, ' ') + ' tidak valid.');
    }
  });
}

function calculateLoss(input) {
  const atRisk = input.balance_held + input.balance_deducted;
  const outstanding = Math.max(0, atRisk - input.balance_restored);
  const denominator = input.balance_before > 0 ? input.balance_before : atRisk;
  const lossRatio = denominator > 0 ? round2((outstanding / denominator) * 100) : 0;
  const balanceGap = input.balance_before > 0
    ? Math.max(0, round2(input.balance_before - input.balance_held - input.balance_deducted - input.balance_restored))
    : 0;

  const start = parseWhen(input.deactivation_date);
  const endRaw = input.reactivated_date || input.as_of;
  const end = parseWhen(endRaw);
  const daysDown = start !== null && end !== null ? Math.max(0, daysBetween(start, end)) : 0;

  const profitPerDay = (input.orders_per_day * input.aov * input.margin_pct) / 100;
  const profitPerOrder = (input.aov * input.margin_pct) / 100;
  const lostProfit = profitPerDay * daysDown;
  const totalImpact = outstanding + lostProfit;
  const ordersToCover = profitPerOrder > 0 ? Math.ceil(totalImpact / profitPerOrder) : null;

  return {
    balance_held: round2(input.balance_held),
    balance_deducted: round2(input.balance_deducted),
    balance_restored: round2(input.balance_restored),
    balance_before: round2(input.balance_before),
    at_risk: round2(atRisk),
    outstanding: round2(outstanding),
    loss_ratio: lossRatio,
    balance_gap: balanceGap,
    days_down: daysDown,
    profit_per_day: round2(profitPerDay),
    profit_per_order: round2(profitPerOrder),
    lost_profit: round2(lostProfit),
    total_impact: round2(totalImpact),
    orders_to_cover: ordersToCover,
    note: 'Dana berisiko adalah saldo yang ditahan ditambah saldo yang sudah dipotong. Laba hilang dihitung dari lama toko nonaktif dan ditampilkan terpisah agar tidak dihitung dua kali.',
  };
}

function assessEvidence(input) {
  const items = EVIDENCE.map((item) => ({
    id: item.id,
    label: item.label,
    critical: item.critical,
    checked: input.evidence.includes(item.id),
  }));

  const totalWeight = items.reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const checkedWeight = items
    .filter((item) => item.checked)
    .reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const missingCritical = items.filter((item) => item.critical && !item.checked);
  const score = totalWeight > 0 ? Math.round((checkedWeight / totalWeight) * 100) : 0;

  let label = 'Belum siap';
  if (score >= 80 && missingCritical.length === 0) label = 'Siap';
  else if (score >= 50 && missingCritical.length === 0) label = 'Hampir siap';
  else if (score >= 50) label = 'Sebagian siap';

  return {
    items,
    score,
    label,
    checked_count: items.filter((item) => item.checked).length,
    total_count: items.length,
    critical_count: items.filter((item) => item.critical).length,
    missing_critical: missingCritical,
  };
}

function assessDefense(input, evidence) {
  const goodPoints = {
    official_subsidy: 12,
    shipping_proof: 12,
    stock_invoice: 8,
    buyer_received: 8,
    human_review: 8,
    written_reason: 6,
    order_ids: 6,
    deduction_breakdown: 4,
    appeal_result_written: 4,
  };
  const badPoints = {
    automated_decision: 8,
    reason_changed: 6,
    case_closed: 6,
    appeal_limited: 6,
    platform_evidence: 8,
  };

  let factScore = 32;
  const factors = [];

  Object.keys(goodPoints).forEach((id) => {
    const value = input.facts[id];
    if (value === 'ya') factScore += goodPoints[id];
    factors.push({
      id,
      label: findById(FACTS, id).label,
      effect: value === 'ya' ? goodPoints[id] : 0,
      state: value,
    });
  });

  Object.keys(badPoints).forEach((id) => {
    const value = input.facts[id];
    if (value === 'ya') factScore -= badPoints[id];
    factors.push({
      id,
      label: findById(FACTS, id).label,
      effect: value === 'ya' ? -badPoints[id] : 0,
      state: value,
    });
  });

  factScore = Math.max(0, Math.min(100, factScore));
  const score = Math.round(factScore * 0.65 + evidence.score * 0.35);

  let label = 'Sangat lemah';
  if (score >= 75) label = 'Kuat';
  else if (score >= 50) label = 'Sedang';
  else if (score >= 25) label = 'Lemah';

  return {
    score,
    fact_score: factScore,
    label,
    factors,
    note: 'Skor ini mengukur kelengkapan pembelaan dari fakta dan bukti yang Anda isi. Skor bukan peluang menang dan bukan penilaian resmi platform.',
  };
}

function buildSignals(input, loss) {
  const signals = [];

  function add(id, label, severity, triggered, note) {
    signals.push({ id, label, severity, triggered, note });
  }

  const appealDate = parseWhen(input.appeal_date);
  const appealResultDate = parseWhen(input.appeal_result_date);
  const asOf = parseWhen(input.as_of);
  const holdEnd = parseWhen(input.hold_end_date);
  const deductionDate = parseWhen(input.deduction_date);
  const replyDeadline = appealDate !== null
    ? appealDate + THRESHOLDS.reply_promise_days * 86400000
    : null;

  add(
    'automated_decision',
    'Keputusan dibuat otomatis',
    'ember',
    input.facts.automated_decision === 'ya',
    'Keputusan otomatis tanpa peninjauan manusia membuat bukti resi dan stok perlu diminta ulang secara tertulis.'
  );
  add(
    'no_written_reason',
    'Tidak ada alasan tertulis',
    'ember',
    input.facts.written_reason === 'tidak',
    'Tanpa alasan tertulis, penjual sulit membantah tuduhan secara spesifik. Minta dasar keputusan dan pasal yang dipakai.'
  );
  add(
    'no_order_ids',
    'ID pesanan yang dituduh tidak diberikan',
    'ember',
    input.facts.order_ids === 'tidak',
    'Daftar ID pesanan diperlukan agar penjual bisa mencocokkan resi, pembeli, dan mutasi pembayaran.'
  );
  add(
    'no_human_review',
    'Tidak ada peninjauan manusia',
    'signal',
    input.facts.human_review === 'tidak',
    'Minta peninjauan manual atas bukti pengiriman dan stok, bukan jawaban template.'
  );
  add(
    'no_platform_evidence',
    'Platform tidak menunjukkan bukti pelanggaran',
    'ember',
    input.facts.platform_evidence === 'tidak',
    'Sanksi sebaiknya menyebut bukti yang dipakai. Bila tidak ada, catat sebagai temuan proses.'
  );
  add(
    'reason_changed',
    'Alasan tuduhan berubah',
    'ember',
    input.facts.reason_changed === 'ya',
    'Alasan yang berubah antar keputusan menyulitkan pembelaan. Simpan semua versi notifikasi dan tanggalnya.'
  );
  add(
    'appeal_limited',
    'Kesempatan banding dibatasi',
    'signal',
    input.facts.appeal_limited === 'ya',
    'Catat berapa kali banding dibuka dan alasan penutupannya. Minta jalur eskalasi tertulis.'
  );
  add(
    'case_closed',
    'Kasus ditutup saat belum selesai',
    'ember',
    input.facts.case_closed === 'ya',
    'Bila kasus ditutup padahal saldo belum pulih, buka tiket baru dan sebut nomor tiket lama.'
  );
  add(
    'cancelled_not_restored',
    'Sanksi dibatalkan tetapi saldo belum pulih',
    'ember',
    ['pelanggaran_dibatalkan', 'banding_diterima'].includes(input.sanction_status) && loss.outstanding > 0,
    'Ini pola yang paling kuat untuk ditagih. Bila pelanggaran sudah dibatalkan, tidak ada dasar menahan atau memotong saldo.'
  );
  add(
    'deducted_before_hold_end',
    'Saldo dipotong sebelum masa tahan berakhir',
    'ember',
    loss.balance_deducted > 0 && holdEnd !== null && deductionDate !== null && deductionDate < holdEnd,
    'Catat tanggal potong dan tanggal akhir masa tahan. Selisihnya menjadi pertanyaan tertulis ke platform.'
  );
  add(
    'no_deduction_breakdown',
    'Potongan saldo tanpa rincian',
    'signal',
    loss.balance_deducted > 0 && input.facts.deduction_breakdown === 'tidak',
    'Minta rincian komponen potongan: denda, kerugian platform, biaya lain, dan dasar perhitungannya.'
  );
  add(
    'appeal_overdue',
    'Jawaban banding melewati janji tertulis',
    'signal',
    appealDate !== null && appealResultDate === null && asOf !== null && replyDeadline !== null && asOf > replyDeadline,
    'Batas ' + THRESHOLDS.reply_promise_days + ' hari adalah janji pada kasus contoh, bukan aturan umum. Tetap sebut janji itu bila platform menuliskannya.'
  );
  add(
    'balance_gap',
    'Angka saldo tidak cocok',
    'signal',
    loss.balance_gap > 0,
    'Saldo sebelum sanksi lebih besar dari jumlah yang ditahan, dipotong, dan dikembalikan. Minta rekonsiliasi saldo tertulis.'
  );

  const triggered = signals.filter((item) => item.triggered);
  const score = Math.min(100, triggered.length * 8);

  let label = 'Rendah';
  if (score >= 60) label = 'Kuat';
  else if (score >= 30) label = 'Sedang';

  return {
    signals,
    triggered_count: triggered.length,
    score,
    label,
    thresholds: THRESHOLDS,
  };
}

function buildVerdict(input, defense, signals, evidence, loss) {
  if (input.sanction_status === 'saldo_dipulihkan') {
    return {
      level: 'ok',
      label: 'Saldo sudah dipulihkan',
      note: 'Simpan bukti pemulihan saldo dan keputusan tertulis. Pastikan tidak ada potongan susulan.',
    };
  }

  if (loss.outstanding <= 0 && loss.lost_profit <= 0) {
    return {
      level: 'ok',
      label: 'Tidak ada dana berisiko',
      note: 'Tidak ada saldo tertahan atau dipotong yang Anda isi. Bila toko masih nonaktif, isi tanggal dan angka saldo agar dampak bisa dihitung.',
    };
  }

  const cancelled = signals.signals.find((item) => item.id === 'cancelled_not_restored');
  if (cancelled && cancelled.triggered) {
    return {
      level: 'ember',
      label: 'Sanksi batal, saldo belum pulih',
      note: 'Pelanggaran sudah dinyatakan dibatalkan tetapi saldo masih ' + formatRupiah(loss.outstanding) + '. Fokuskan surat pada pemulihan saldo, bukan banding ulang tuduhan.',
    };
  }

  if (defense.label === 'Kuat' && signals.triggered_count <= 3) {
    return {
      level: 'signal',
      label: 'Pembelaan kuat, ajukan tertulis',
      note: 'Fakta dan bukti pembelaan sudah kuat. Ajukan banding tertulis dengan daftar pesanan, resi, invoice stok, dan mutasi saldo.',
    };
  }

  if (defense.label === 'Sangat lemah' || defense.label === 'Lemah') {
    return {
      level: 'ember',
      label: 'Bukti pembelaan masih lemah',
      note: 'Lengkapi bukti kritis sebelum mengajukan banding. Fokus pada bukti bahwa pesanan nyata dikirim dan barang benar-benar diterima.',
    };
  }

  return {
    level: 'signal',
    label: 'Perlu bukti tambahan',
    note: 'Pembelaan sudah sebagian terbentuk, tetapi masih ada bukti kritis yang kurang. Lengkapi dulu agar banding tidak ditolak karena dokumen.',
  };
}

function buildRecommendations(input, defense, signals, evidence, loss) {
  const list = [];
  const triggered = signals.signals.filter((item) => item.triggered);

  if (triggered.some((item) => item.id === 'cancelled_not_restored')) {
    list.push('Minta pemulihan saldo secara tertulis. Sebut tanggal pelanggaran dibatalkan dan saldo yang belum kembali.');
  }
  if (triggered.some((item) => item.id === 'deducted_before_hold_end')) {
    list.push('Sertakan tanggal potong dan tanggal akhir masa tahan. Selisih satu hari sebelum masa tahan berakhir perlu dijelaskan platform.');
  }
  if (input.facts.official_subsidy === 'ya') {
    list.push('Lampirkan bukti keikutsertaan program subsidi resmi, termasuk syarat, periode, dan riwayat pesanan yang memakai subsidi.');
  }
  if (input.facts.shipping_proof === 'ya') {
    list.push('Susun daftar pesanan yang dituduh beserta nomor resi, tanggal serah terima, dan status pengiriman.');
  }
  if (input.facts.stock_invoice === 'ya') {
    list.push('Cocokkan invoice stok dengan jumlah pesanan. Tunjukkan bahwa stok fisik benar-benar ada dan dibeli dari pemasok.');
  }
  if (input.facts.buyer_received === 'ya') {
    list.push('Simpan konfirmasi pembeli, ulasan, atau chat yang menunjukkan barang diterima.');
  }
  if (evidence.missing_critical.length > 0) {
    list.push('Lengkapi bukti kritis: ' + evidence.missing_critical.map((item) => item.label).join(', ') + '.');
  }

  list.push('Catat semua nomor tiket, tanggal, nama petugas, dan jawaban template. Jangan hanya mengandalkan chat yang bisa hilang.');
  list.push('Pisahkan dana yang ditahan ' + formatRupiah(loss.balance_held) + ', dana yang dipotong ' + formatRupiah(loss.balance_deducted) + ', dan dana yang sudah kembali ' + formatRupiah(loss.balance_restored) + '.');
  list.push('Gunakan dana berisiko ' + formatRupiah(loss.outstanding) + ' dan dampak total ' + formatRupiah(loss.total_impact) + ' sebagai dasar surat.');
  list.push('Bila jawaban platform tidak jelas, eskalasi ke Kementerian UMKM melalui SP4N-Lapor dengan melampirkan kronologi dan bukti.');
  list.push(DISCLAIMER);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function factText(facts) {
  return FACTS.map((item) => {
    const value = findById(YES_NO, facts[item.id]).label;
    return '- ' + item.label + ': ' + value;
  }).join('\n');
}

function signalText(signals) {
  const triggered = signals.signals.filter((item) => item.triggered);
  if (!triggered.length) return '- Tidak ada penanda proses yang terpicu.';
  return triggered.map((item) => '- ' + item.label + ': ' + item.note).join('\n');
}

function letter(raw) {
  const result = analyze(raw);
  const input = result.input;
  const type = oneOf(raw.letter_type, LETTER_TYPES, 'banding');
  const store = input.store_name || 'Toko saya';
  const seller = input.seller_name || 'Penjual';
  const contact = input.contact || '-';
  const marketplace = findById(MARKETPLACES, input.marketplace).label;
  const trigger = findById(TRIGGERS, input.trigger).label;
  const ticket = input.ticket ? 'Nomor tiket: ' + input.ticket + '.\n' : '';
  const missing = result.evidence.missing_critical.length
    ? result.evidence.missing_critical.map((item) => '- ' + item.label).join('\n')
    : '- Tidak ada bukti kritis yang hilang.';

  const chronology =
    '- Tanggal tuduhan: ' + (input.accusation_date ? formatWhen(input.accusation_date) : 'belum diisi') + '.\n' +
    '- Toko nonaktif: ' + (input.deactivation_date ? formatWhen(input.deactivation_date) : 'belum diisi') + '.\n' +
    '- Toko aktif kembali: ' + (input.reactivated_date ? formatWhen(input.reactivated_date) : 'belum diisi') + '.\n' +
    '- Banding diajukan: ' + (input.appeal_date ? formatWhen(input.appeal_date) : 'belum diisi') + '.\n' +
    '- Hasil banding: ' + (input.appeal_result_date ? formatWhen(input.appeal_result_date) : 'belum diisi') + '.';

  const money =
    '- Saldo sebelum sanksi: ' + formatRupiah(result.loss.balance_before) + '.\n' +
    '- Saldo ditahan: ' + formatRupiah(result.loss.balance_held) + '.\n' +
    '- Saldo dipotong: ' + formatRupiah(result.loss.balance_deducted) + '.\n' +
    '- Saldo sudah dikembalikan: ' + formatRupiah(result.loss.balance_restored) + '.\n' +
    '- Dana berisiko: ' + formatRupiah(result.loss.outstanding) + '.\n' +
    '- Laba hilang selama toko nonaktif: ' + formatRupiah(result.loss.lost_profit) + '.\n' +
    '- Dampak total: ' + formatRupiah(result.loss.total_impact) + '.';

  let subject = 'Banding tuduhan ' + trigger.toLowerCase() + ' untuk ' + store;
  let heading = 'Kepada Tim Seller Support ' + marketplace + ',';
  let body = '';

  if (type === 'pemulihan') {
    subject = 'Permintaan pemulihan saldo setelah pelanggaran dibatalkan untuk ' + store;
    body =
      'Saya ' + seller + ' dari ' + store + ', penjual di ' + marketplace + '.\n\n' +
      'Pelanggaran yang dituduhkan telah dinyatakan dibatalkan. Namun saldo hasil penjualan saya sebesar ' +
      formatRupiah(result.loss.outstanding) + ' belum dipulihkan.\n\n' +
      ticket +
      'Kronologi:\n' + chronology + '\n\n' +
      'Rincian saldo menurut catatan saya:\n' + money + '\n\n' +
      'Saya meminta:\n' +
      '1. Pemulihan saldo yang belum dikembalikan secara penuh.\n' +
      '2. Rincian tertulis setiap potongan, termasuk dasar dan tanggalnya.\n' +
      '3. Penjelasan mengapa saldo masih ditahan atau dipotong setelah pelanggaran dibatalkan.\n' +
      '4. Rekonsiliasi saldo sebelum sanksi dan saldo saat ini.\n' +
      '5. Keputusan tertulis beserta nomor tiket.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else if (type === 'eskalasi') {
    subject = 'Eskalasi sengketa saldo penjual ' + store + ' di ' + marketplace;
    heading = 'Kepada Kementerian UMKM dan pengelola SP4N-Lapor,';
    body =
      'Saya ' + seller + ' dari ' + store + ', penjual di ' + marketplace + '.\n\n' +
      'Saya meminta bantuan mediasi atas sengketa saldo penjualan yang belum diselesaikan oleh platform. Laporan ini saya ajukan melalui SP4N-Lapor dan saya lampirkan kronologi serta bukti yang saya miliki.\n\n' +
      ticket +
      'Kronologi:\n' + chronology + '\n\n' +
      'Nilai yang disengketakan:\n' + money + '\n\n' +
      'Penanda proses yang saya temukan:\n' + signalText(result.signals) + '\n\n' +
      'Ringkasan pembelaan saya:\n' + factText(input.facts) + '\n\n' +
      'Saya meminta bantuan untuk:\n' +
      '1. Meminta penjelasan tertulis dari platform.\n' +
      '2. Meminta rekonsiliasi saldo dan rincian potongan.\n' +
      '3. Memfasilitasi mediasi agar saldo yang menjadi hak penjual dapat dipulihkan.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else {
    body =
      'Saya ' + seller + ' dari ' + store + ', penjual di ' + marketplace + '.\n\n' +
      'Saya mengajukan banding atas tuduhan ' + trigger.toLowerCase() + ' yang mengakibatkan toko dinonaktifkan dan saldo ditahan atau dipotong.\n\n' +
      ticket +
      'Kronologi:\n' + chronology + '\n\n' +
      'Fakta yang saya pegang:\n' + factText(input.facts) + '\n\n' +
      'Rincian saldo menurut catatan saya:\n' + money + '\n\n' +
      'Penanda proses:\n' + signalText(result.signals) + '\n\n' +
      'Saya meminta:\n' +
      '1. Dasar tertulis tuduhan dan pasal yang dipakai.\n' +
      '2. Daftar ID pesanan yang dianggap fiktif.\n' +
      '3. Peninjauan manusia atas resi, bukti serah terima, invoice stok, dan konfirmasi pembeli.\n' +
      '4. Penjelasan tertulis atas setiap potongan saldo.\n' +
      '5. Pemulihan saldo bila tuduhan tidak terbukti.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  }

  return { type, subject, heading, body };
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateAnalysis(input);

  const loss = calculateLoss(input);
  const evidence = assessEvidence(input);
  const defense = assessDefense(input, evidence);
  const signals = buildSignals(input, loss);
  const verdict = buildVerdict(input, defense, signals, evidence, loss);
  const recommendations = buildRecommendations(input, defense, signals, evidence, loss);
  const asOf = parseWhen(input.as_of);

  return {
    input,
    marketplace_label: findById(MARKETPLACES, input.marketplace).label,
    trigger_label: findById(TRIGGERS, input.trigger).label,
    sanction_label: findById(SANCTION_STATUSES, input.sanction_status).label,
    loss,
    evidence,
    defense,
    signals,
    verdict,
    recommendations,
    dates: {
      as_of: input.as_of,
      as_of_label: formatWhen(input.as_of),
      days_since_accusation: daysBetween(parseWhen(input.accusation_date), asOf),
      days_since_deactivation: daysBetween(parseWhen(input.deactivation_date), asOf),
      appeal_result_days: daysBetween(parseWhen(input.appeal_date), parseWhen(input.appeal_result_date)),
      hold_remaining_days: daysBetween(asOf, parseWhen(input.hold_end_date)),
    },
    sources: SOURCES,
    rules: {
      thresholds: THRESHOLDS,
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

function readiness(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(source.evidence) ? source.evidence : source.items;
  const input = normalizeInput({ evidence: items });
  return assessEvidence(input);
}

function example() {
  return {
    store_name: 'Toko Contoh Sejahtera',
    seller_name: 'Maulana',
    contact: 'maulana@example.com',
    ticket: '2026110509152200033',
    marketplace: 'tiktok',
    trigger: 'subsidi_voucher',
    sanction_status: 'pelanggaran_dibatalkan',
    status: 'minta_saldo',
    accusation_date: '2026-05-10',
    deactivation_date: '2026-05-10',
    reactivated_date: '2026-11-05',
    appeal_date: '2026-10-20',
    appeal_result_date: '2026-11-05',
    deduction_date: '2026-08-07',
    hold_end_date: '2026-08-08',
    as_of: '2026-11-13',
    balance_held: 0,
    balance_deducted: 38513620,
    balance_restored: 0,
    balance_before: 38513620,
    orders_per_day: 15,
    aov: 65000,
    margin_pct: 20,
    note: 'Contoh dari surat pembaca Media Konsumen 12 November 2026. Angka pesanan dan margin adalah ilustrasi, bukan data resmi.',
    facts: {
      written_reason: 'ya',
      order_ids: 'tidak',
      human_review: 'ya',
      deduction_breakdown: 'tidak',
      official_subsidy: 'tidak_tahu',
      shipping_proof: 'ya',
      stock_invoice: 'ya',
      buyer_received: 'ya',
      appeal_result_written: 'ya',
      automated_decision: 'ya',
      reason_changed: 'tidak',
      appeal_limited: 'ya',
      case_closed: 'ya',
      platform_evidence: 'tidak',
    },
    evidence: [
      'sanction_notice',
      'shipping_receipt',
      'stock_invoice',
      'stock_photo',
      'cs_chat',
      'appeal_email',
      'appeal_result',
      'buyer_confirmation',
      'escalation_report',
    ],
  };
}

function summarizeCases(rawCases) {
  const cases = (Array.isArray(rawCases) ? rawCases : []).map((item) => {
    const analysis = analyze(item);
    const status = findById(CASE_STATUSES, item.status);
    return {
      id: item.id,
      store_name: item.store_name,
      ticket: item.ticket,
      marketplace_label: analysis.marketplace_label,
      trigger_label: analysis.trigger_label,
      sanction_label: analysis.sanction_label,
      outstanding: analysis.loss.outstanding,
      lost_profit: analysis.loss.lost_profit,
      total_impact: analysis.loss.total_impact,
      defense_score: analysis.defense.score,
      defense_label: analysis.defense.label,
      signal_score: analysis.signals.score,
      signal_label: analysis.signals.label,
      evidence_score: analysis.evidence.score,
      evidence_label: analysis.evidence.label,
      missing_critical_count: analysis.evidence.missing_critical.length,
      verdict: analysis.verdict,
      status: item.status,
      status_label: status.label,
      note: item.note,
      accusation_date: item.accusation_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      analysis,
    };
  });

  const open = cases.filter((item) => findById(CASE_STATUSES, item.status).open);
  const cancelledNotRestored = open.filter((item) =>
    ['pelanggaran_dibatalkan', 'banding_diterima'].includes(item.analysis.input.sanction_status) &&
    item.outstanding > 0
  );

  return {
    total: cases.length,
    open_cases: open.length,
    cancelled_not_restored: cancelledNotRestored.length,
    missing_evidence: open.filter((item) => item.missing_critical_count > 0).length,
    total_outstanding: round2(open.reduce((sum, item) => sum + Math.max(0, item.outstanding), 0)),
    total_impact: round2(open.reduce((sum, item) => sum + Math.max(0, item.total_impact), 0)),
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
    'tiket',
    'marketplace',
    'tuduhan',
    'status_sanksi',
    'saldo_ditahan',
    'saldo_dipotong',
    'saldo_dikembalikan',
    'dana_berisiko',
    'laba_hilang',
    'dampak_total',
    'skor_pembelaan',
    'label_pembelaan',
    'skor_penanda',
    'skor_bukti',
    'verdict',
    'status_kasus',
    'tanggal_tuduhan',
  ];
  const lines = [header.join(',')];
  summary.cases.forEach((item) => {
    const loss = item.analysis.loss;
    lines.push(
      [
        item.id,
        item.store_name,
        item.ticket,
        item.marketplace_label,
        item.trigger_label,
        item.sanction_label,
        loss.balance_held,
        loss.balance_deducted,
        loss.balance_restored,
        loss.outstanding,
        loss.lost_profit,
        loss.total_impact,
        item.defense_score,
        item.defense_label,
        item.signal_score,
        item.evidence_score,
        item.verdict.label,
        item.status_label,
        item.accusation_date,
      ]
        .map((value) => csvEscape(value))
        .join(',')
    );
  });
  return lines.join('\n');
}

function meta() {
  return {
    marketplaces: MARKETPLACES,
    triggers: TRIGGERS,
    sanction_statuses: SANCTION_STATUSES,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    yes_no: YES_NO,
    facts: FACTS,
    evidence: EVIDENCE,
    thresholds: THRESHOLDS,
    rules: {
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
    sources: SOURCES,
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
  calculateLoss,
  assessDefense,
  MARKETPLACES,
  TRIGGERS,
  SANCTION_STATUSES,
  CASE_STATUSES,
  LETTER_TYPES,
  YES_NO,
  FACTS,
  EVIDENCE,
  SOURCES,
  THRESHOLDS,
};
