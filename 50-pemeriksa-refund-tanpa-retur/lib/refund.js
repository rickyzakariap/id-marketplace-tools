'use strict';

const MAX_NOTE = 400;
const MAX_TEXT = 160;
const MAX_CHRONOLOGY = 1200;
const HIGH_VALUE = 1000000;

const PLATFORMS = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tokopedia', label: 'Tokopedia' },
  { id: 'tiktok', label: 'TikTok Shop' },
  { id: 'lazada', label: 'Lazada' },
  { id: 'blibli', label: 'Blibli' },
  { id: 'lain', label: 'Marketplace lain' },
];

const GOODS_STATUSES = [
  { id: 'tidak_kembali', label: 'Barang tidak kembali', weight: 20, note: 'Barang tidak pernah diterima kembali oleh penjual.' },
  { id: 'kosong', label: 'Paket kosong atau isi tidak sesuai', weight: 18, note: 'Paket kembali tanpa barang atau isinya berbeda.' },
  { id: 'salah', label: 'Barang yang kembali berbeda', weight: 14, note: 'Barang kembali bukan produk yang dikirim.' },
  { id: 'dipakai', label: 'Barang kembali sudah dipakai', weight: 12, note: 'Barang tidak lagi layak dijual sebagai baru.' },
  { id: 'rusak', label: 'Barang kembali rusak', weight: 10, note: 'Kerusakan terjadi saat atau setelah pengembalian.' },
  { id: 'kembali_utuh', label: 'Barang kembali utuh', weight: 0, note: 'Barang diterima kembali dan masih bisa dijual.' },
];

const RETURN_TRACKING = [
  { id: 'tidak_ada', label: 'Tidak ada resi retur', weight: 15, note: 'Tidak ada bukti pengiriman balik dari pembeli.' },
  { id: 'invalid', label: 'Resi retur tidak valid', weight: 12, note: 'Resi tidak ditemukan, tidak bergerak, atau berbeda.' },
  { id: 'tidak_tahu', label: 'Belum dicek', weight: 4, note: 'Status resi belum diverifikasi.' },
  { id: 'ada', label: 'Resi retur valid', weight: 0, note: 'Pengembalian tercatat dan bergerak.' },
];

const RETURN_PACKAGING = [
  { id: 'tidak_ada_barang', label: 'Tidak ada barang untuk diperiksa', weight: 8 },
  { id: 'tidak_layak', label: 'Kemasan retur tidak layak', weight: 8 },
  { id: 'layak', label: 'Kemasan retur layak', weight: 0 },
  { id: 'tidak_tahu', label: 'Belum tahu', weight: 2 },
];

const YES_NO_UNKNOWN = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const APPEAL_STATUSES = [
  { id: 'belum', label: 'Belum diajukan', weight: 0 },
  { id: 'diajukan', label: 'Sudah diajukan, menunggu', weight: 4 },
  { id: 'ditolak', label: 'Sudah ditolak', weight: 10 },
  { id: 'diterima', label: 'Sudah diterima', weight: 0 },
];

const BUYER_ACCOUNTS = [
  { id: 'baru', label: 'Akun baru atau minim riwayat', weight: 8 },
  { id: 'lama', label: 'Akun lama', weight: 0 },
  { id: 'tidak_tahu', label: 'Belum tahu', weight: 2 },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'bukti', label: 'Menyiapkan bukti', open: true },
  { id: 'surat', label: 'Surat dikirim', open: true },
  { id: 'ditanggapi', label: 'Ditanggapi platform', open: true },
  { id: 'eskalasi', label: 'Eskalasi', open: true },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'ditolak', label: 'Ditolak', open: false },
];

const LETTER_TYPES = [
  { id: 'rincian', label: 'Permintaan rincian refund dan retur' },
  { id: 'kembalikan', label: 'Permintaan barang kembali atau pembatalan refund' },
  { id: 'eskalasi', label: 'Eskalasi ke lembaga perlindungan konsumen' },
];

const EVIDENCE = [
  { id: 'order_detail', label: 'Detail pesanan dan nominal refund', group: 'Transaksi', critical: true },
  { id: 'refund_proof', label: 'Bukti refund atau mutasi dana', group: 'Transaksi', critical: true },
  { id: 'return_tracking', label: 'Riwayat resi retur dari pembeli', group: 'Pengembalian', critical: true },
  { id: 'packing_video', label: 'Video packing sebelum dikirim', group: 'Pengiriman', critical: true },
  { id: 'unboxing_return', label: 'Video unboxing paket retur', group: 'Pengembalian', critical: true },
  { id: 'product_photos', label: 'Foto produk sebelum dikirim', group: 'Pengiriman', critical: false },
  { id: 'return_photos', label: 'Foto atau video kondisi barang retur', group: 'Pengembalian', critical: false },
  { id: 'weight_proof', label: 'Bukti berat paket awal dan retur', group: 'Pengiriman', critical: false },
  { id: 'chat_buyer', label: 'Chat dengan pembeli', group: 'Komunikasi', critical: false },
  { id: 'complaint_screenshot', label: 'Tangkapan layar pengajuan refund', group: 'Transaksi', critical: false },
  { id: 'appeal_ticket', label: 'Nomor tiket dan jawaban banding', group: 'Banding', critical: false },
  { id: 'cost_invoice', label: 'Invoice HPP dan biaya kirim', group: 'Biaya', critical: false },
  { id: 'chronology', label: 'Kronologi tertulis yang konsisten', group: 'Banding', critical: false },
];

const SOURCES = [
  {
    title: 'Shopee Menolak Banding Penjual atas Kerusakan Produk Saat Pengembalian, Bukti yang Diajukan Tidak Dipertimbangkan?',
    publisher: 'Media Konsumen',
    date: '2026-11-05',
    url: 'https://mediakonsumen.com/2026/11/05/surat-pembaca/shopee-menolak-banding-penjual-atas-kerusakan-produk-saat-pengembalian-bukti-yang-diajukan-tidak-dipertimbangkan',
    facts: 'Pesanan 260909JJAK2VUV, pengiriman SPX Express, harga produk Rp3.497.000, klaim kerugian Rp3.000.000, barang rusak saat pengembalian, banding penjual ditolak.',
  },
  {
    title: 'Toko Star Seller Shopee Saya Diblokir, Pembeli Bisa Klaim Dana Tanpa Kembalikan Barang',
    publisher: 'Media Konsumen',
    date: '2026-07-23',
    url: 'https://mediakonsumen.com/2026/07/23/surat-pembaca/toko-star-seller-shopee-saya-diblokir-pembeli-bisa-klaim-dana-tanpa-kembalikan-barang',
    facts: 'Penjual Star Seller melaporkan lebih dari 100 transaksi aktif terdampak. Setelah toko dibatasi, dana pembeli diteruskan tanpa pengembalian barang dan sebagian nomor resi retur invalid.',
  },
  {
    title: 'Shopee Menolak Banding Penjual atas Barang Retur Kosong Tanpa Ada Pertanggungjawaban Secara Adil',
    publisher: 'Media Konsumen',
    date: '2026-07-07',
    url: 'https://mediakonsumen.com/2026/07/07/surat-pembaca/shopee-menolak-banding-penjual-atas-barang-retur-kosong-tanpa-ada-pertanggungjawaban-secara-adil',
    facts: 'Retur langsung disetujui tanpa bukti video atau foto, barang kembali berupa kotak kosong, banding penjual tetap ditolak.',
  },
  {
    title: 'Kurir Tidak Menjemput Paket Retur Salah Kirim, Shopee Batalkan Retur secara Sepihak Tanpa Pengembalian Dana',
    publisher: 'Media Konsumen',
    date: '2026-07-30',
    url: 'https://mediakonsumen.com/2026/07/30/surat-pembaca/kurir-tidak-menjemput-paket-retur-salah-kirim-shopee-batalkan-retur-secara-sepihak-tanpa-pengembalian-dana',
    facts: 'Kurir tidak menjemput paket retur selama berhari-hari, sistem membatalkan pengembalian secara sepihak, dan pembeli tidak mendapat dana kembali.',
  },
  {
    title: 'Bug Tokopedia Rugikan Seller: Refund Otomatis Tanpa Retur Barang, Kerugian Capai Rp1 Juta',
    publisher: 'Media Konsumen',
    date: '2025-12-06',
    url: 'https://mediakonsumen.com/2025/12/06/surat-pembaca/bug-tokopedia-rugikan-seller-refund-otomatis-tanpa-retur-barang-kerugian-capai-rp1-juta',
    facts: 'Penjual menyetujui pengembalian barang, tetapi sistem mengembalikan dana tanpa meminta barang kembali. Nilai barang Rp1.000.000, kompensasi asuransi hanya Rp23.000.',
  },
  {
    title: 'Dana Refund Dicairkan Tanpa Retur Barang, Penjual Tokopedia Dirugikan',
    publisher: 'Media Konsumen',
    date: '2025-11-28',
    url: 'https://mediakonsumen.com/2025/11/28/surat-pembaca/dana-refund-dicairkan-tanpa-retur-barang-penjual-tokopedia-dirugikan',
    facts: 'Penjual mengikuti arahan agen untuk menyetujui pengembalian, tetapi dana langsung dicairkan ke pembeli tanpa barang kembali.',
  },
  {
    title: 'TikTok Shop by Tokopedia Merugikan Seller, Pembeli Bisa Klaim Refund Tanpa Bukti Jelas dan Otomatis Menang',
    publisher: 'Media Konsumen',
    date: '2025-11-04',
    url: 'https://mediakonsumen.com/2025/11/04/surat-pembaca/tiktok-shop-by-tokopedia-merugikan-seller-pembeli-bisa-klaim-refund-tanpa-bukti-jelas-dan-otomatis-menang',
    facts: 'Penjual melaporkan pembeli menang dispute meski bukti tidak jelas. Banding penjual kemudian diterima, tetapi kompensasi belum cair.',
  },
];

const POLICIES = {
  status_note: 'Status refund dan retur berbeda di setiap marketplace. Tool ini memakai input Anda dan tidak menganggap satu kebijakan berlaku untuk semua platform.',
  no_fee_note: 'Tidak ada tarif resmi yang dipakai. Semua nominal dihitung dari data yang Anda masukkan.',
  source_note: 'Sumber adalah keluhan publik dan pemberitaan, bukan putusan resmi. Gunakan sebagai konteks, bukan bukti hukum.',
  evidence_note: 'Bukti bertanda kritis paling sering diminta saat banding. Kelengkapan bukti tidak menjamin refund dibatalkan.',
  high_value_note: 'Ambang nilai tinggi Rp1.000.000 adalah penanda perhatian internal, bukan aturan platform.',
};

function listOptions(list) {
  return list.map((item) => ({ id: item.id, label: item.label }));
}

function findOption(list, id) {
  return list.find((item) => item.id === id) || null;
}

function meta() {
  return {
    project: '50-pemeriksa-refund-tanpa-retur',
    title: 'Pemeriksa Refund Tanpa Retur',
    platforms: listOptions(PLATFORMS),
    goods_statuses: GOODS_STATUSES.map((item) => ({ id: item.id, label: item.label, weight: item.weight, note: item.note })),
    return_tracking: listOptions(RETURN_TRACKING),
    return_packaging: listOptions(RETURN_PACKAGING),
    yes_no_unknown: listOptions(YES_NO_UNKNOWN),
    appeal_statuses: listOptions(APPEAL_STATUSES),
    buyer_accounts: listOptions(BUYER_ACCOUNTS),
    case_statuses: CASE_STATUSES.map((item) => ({ id: item.id, label: item.label, open: item.open })),
    letter_types: listOptions(LETTER_TYPES),
    evidence: EVIDENCE.map((item) => ({ ...item })),
    defaults: {
      platform: 'shopee',
      goods_status: 'tidak_kembali',
      return_tracking: 'tidak_ada',
      return_packaging: 'tidak_ada_barang',
      refund_before_return: 'tidak_tahu',
      store_blocked: 'tidak',
      complaint_visible: 'tidak_tahu',
      appeal_status: 'belum',
      buyer_account: 'tidak_tahu',
      repeat_refund: 'tidak',
      buyer_refuses_chat: 'tidak',
      status: 'baru',
    },
    thresholds: {
      high_value: HIGH_VALUE,
      risk: { strong: 60, medium: 35, weak: 15 },
      readiness: { ready: 85, almost: 60, needs: 35 },
      severity_ratio: { light: 0.5, medium: 1, heavy: 2 },
    },
    policy: POLICIES,
    sources: SOURCES.map((item) => ({ ...item })),
  };
}

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toNumber(value, label, options = {}) {
  const min = options.min === undefined ? 0 : options.min;
  if (value === '' || value === null || value === undefined) {
    if (options.required) throw new Error(label + ' wajib diisi.');
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(label + ' harus berupa angka.');
  if (parsed < min) throw new Error(label + ' tidak boleh kurang dari ' + min + '.');
  return round(parsed);
}

function cleanText(value, label, max = MAX_TEXT) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length > max) throw new Error(label + ' maksimal ' + max + ' karakter.');
  return text;
}

function cleanBlock(value, label, max = MAX_CHRONOLOGY) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (text.length > max) throw new Error(label + ' maksimal ' + max + ' karakter.');
  return text;
}

function parseDate(value, label, options = {}) {
  if (!value) {
    if (options.required) throw new Error(label + ' wajib diisi.');
    return '';
  }
  const text = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(label + ' harus berformat YYYY-MM-DD.');
  const date = new Date(text + 'T00:00:00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new Error(label + ' tidak valid.');
  if (options.max) {
    const max = new Date(options.max + 'T00:00:00Z');
    if (date.getTime() > max.getTime()) throw new Error(label + ' tidak boleh melewati hari ini.');
  }
  return text;
}

function dayDiff(from, to) {
  if (!from || !to) return null;
  const start = new Date(from + 'T00:00:00Z').getTime();
  const end = new Date(to + 'T00:00:00Z').getTime();
  return Math.floor((end - start) / 86400000);
}

function platformLabel(id) {
  const item = findOption(PLATFORMS, id);
  return item ? item.label : 'Marketplace lain';
}

function normalizeInput(raw, today) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Data tidak valid.');
  const platform = findOption(PLATFORMS, raw.platform) ? raw.platform : 'lain';
  const goods = findOption(GOODS_STATUSES, raw.goods_status) || findOption(GOODS_STATUSES, 'tidak_kembali');
  const tracking = findOption(RETURN_TRACKING, raw.return_tracking) || findOption(RETURN_TRACKING, 'tidak_ada');
  const packaging = findOption(RETURN_PACKAGING, raw.return_packaging) || findOption(RETURN_PACKAGING, 'tidak_ada_barang');
  const appeal = findOption(APPEAL_STATUSES, raw.appeal_status) || findOption(APPEAL_STATUSES, 'belum');
  const buyer = findOption(BUYER_ACCOUNTS, raw.buyer_account) || findOption(BUYER_ACCOUNTS, 'tidak_tahu');
  const status = findOption(CASE_STATUSES, raw.status) || findOption(CASE_STATUSES, 'baru');

  const orderValue = toNumber(raw.order_value, 'Nilai pesanan', { required: true, min: 1 });
  const productCost = toNumber(raw.product_cost, 'HPP produk', { min: 0 });
  const shippingCost = toNumber(raw.shipping_cost, 'Ongkos kirim keluar', { min: 0 });
  const packagingCost = toNumber(raw.packaging_cost, 'Biaya kemasan', { min: 0 });
  const returnShippingCost = toNumber(raw.return_shipping_cost, 'Ongkos kirim retur', { min: 0 });
  const refundAmount = toNumber(raw.refund_amount, 'Nominal refund', { min: 0 });
  const recoveredValue = toNumber(raw.recovered_value, 'Nilai barang yang bisa diselamatkan', { min: 0 });

  if (refundAmount > orderValue) throw new Error('Nominal refund tidak boleh melebihi nilai pesanan.');
  if (recoveredValue > productCost) throw new Error('Nilai barang yang diselamatkan tidak boleh melebihi HPP.');

  const caseDate = parseDate(raw.case_date, 'Tanggal kasus', { required: true, max: today });
  const orderDate = parseDate(raw.order_date, 'Tanggal pesanan', { max: today });
  if (orderDate && orderDate > caseDate) throw new Error('Tanggal pesanan tidak boleh setelah tanggal kasus.');

  const followupDate = parseDate(raw.followup_date, 'Tanggal follow-up', { max: today });
  if (followupDate && caseDate && followupDate < caseDate) throw new Error('Tanggal follow-up tidak boleh sebelum tanggal kasus.');

  const evidence = Array.isArray(raw.evidence)
    ? Array.from(new Set(raw.evidence.filter((id) => EVIDENCE.some((item) => item.id === id))))
    : [];

  return {
    store_name: cleanText(raw.store_name, 'Nama toko', 120),
    seller_name: cleanText(raw.seller_name, 'Nama penjual', 120),
    contact: cleanText(raw.contact, 'Kontak', 120),
    platform,
    order_ref: cleanText(raw.order_ref, 'Nomor pesanan', 120),
    product_name: cleanText(raw.product_name, 'Nama produk', 160),
    order_date: orderDate,
    case_date: caseDate,
    order_value: orderValue,
    product_cost: productCost,
    shipping_cost: shippingCost,
    packaging_cost: packagingCost,
    return_shipping_cost: returnShippingCost,
    refund_amount: refundAmount,
    recovered_value: recoveredValue,
    goods_status: goods.id,
    return_tracking: tracking.id,
    return_packaging: packaging.id,
    refund_before_return: findOption(YES_NO_UNKNOWN, raw.refund_before_return) ? raw.refund_before_return : 'tidak_tahu',
    store_blocked: findOption(YES_NO_UNKNOWN, raw.store_blocked) ? raw.store_blocked : 'tidak',
    complaint_visible: findOption(YES_NO_UNKNOWN, raw.complaint_visible) ? raw.complaint_visible : 'tidak_tahu',
    appeal_status: appeal.id,
    buyer_account: buyer.id,
    repeat_refund: findOption(YES_NO_UNKNOWN, raw.repeat_refund) ? raw.repeat_refund : 'tidak',
    buyer_refuses_chat: findOption(YES_NO_UNKNOWN, raw.buyer_refuses_chat) ? raw.buyer_refuses_chat : 'tidak',
    ticket: cleanText(raw.ticket, 'Nomor tiket', 120),
    followup_date: followupDate,
    note: cleanText(raw.note, 'Catatan', MAX_NOTE),
    chronology: cleanBlock(raw.chronology, 'Kronologi', MAX_CHRONOLOGY),
    status: status.id,
    evidence,
  };
}

function labelFor(list, id) {
  const item = findOption(list, id);
  return item ? item.label : '';
}

function compute(data) {
  const orderValue = data.order_value;
  const normalProfit = round(orderValue - data.product_cost - data.shipping_cost - data.packaging_cost);
  const cashAfter = round(
    orderValue - data.refund_amount - data.product_cost - data.shipping_cost - data.packaging_cost - data.return_shipping_cost + data.recovered_value
  );
  const profitLoss = round(normalProfit - cashAfter);
  const cashLoss = round(data.product_cost + data.shipping_cost + data.packaging_cost + data.return_shipping_cost - data.recovered_value);
  const lostRevenue = round(data.refund_amount);
  const unrecoveredGoods = round(Math.max(0, data.product_cost - data.recovered_value));
  const lossPct = orderValue > 0 ? round((profitLoss / orderValue) * 100) : 0;
  const cashLossPct = orderValue > 0 ? round((cashLoss / orderValue) * 100) : 0;
  const normalSalesNeeded = normalProfit > 0 && cashLoss > 0 ? Math.ceil(cashLoss / normalProfit) : null;
  const recoveryPct = data.product_cost > 0 ? round((data.recovered_value / data.product_cost) * 100) : 0;
  const refundPct = orderValue > 0 ? round((data.refund_amount / orderValue) * 100) : 0;
  const ratio = normalProfit > 0 ? round(cashLoss / normalProfit) : null;

  let severity = 'aman';
  let severityLabel = 'Tidak ada kerugian kas';
  if (cashLoss > 0) {
    if (normalProfit <= 0) {
      severity = 'kritis';
      severityLabel = 'Produk sudah tidak untung, kerugian kas tetap terjadi';
    } else if (ratio <= 0.5) {
      severity = 'ringan';
      severityLabel = 'Kerugian kas di bawah setengah penjualan normal';
    } else if (ratio <= 1) {
      severity = 'sedang';
      severityLabel = 'Kerugian kas setara sekitar satu penjualan normal';
    } else if (ratio <= 2) {
      severity = 'berat';
      severityLabel = 'Kerugian kas setara satu sampai dua penjualan normal';
    } else {
      severity = 'kritis';
      severityLabel = 'Kerugian kas lebih dari dua penjualan normal';
    }
  }

  return {
    normal_profit: normalProfit,
    cash_after: cashAfter,
    profit_loss: profitLoss,
    cash_loss: cashLoss,
    lost_revenue: lostRevenue,
    unrecovered_goods: unrecoveredGoods,
    loss_pct: lossPct,
    cash_loss_pct: cashLossPct,
    normal_sales_needed: normalSalesNeeded,
    recovery_pct: recoveryPct,
    refund_pct: refundPct,
    cash_loss_ratio: ratio,
    severity,
    severity_label: severityLabel,
  };
}

function signal(id, label, points, note) {
  return { id, label, points, note };
}

function buildSignals(data, calc) {
  const goods = findOption(GOODS_STATUSES, data.goods_status);
  const tracking = findOption(RETURN_TRACKING, data.return_tracking);
  const packaging = findOption(RETURN_PACKAGING, data.return_packaging);
  const appeal = findOption(APPEAL_STATUSES, data.appeal_status);
  const buyer = findOption(BUYER_ACCOUNTS, data.buyer_account);
  const signals = [];

  if (goods && goods.weight > 0) signals.push(signal('goods', 'Kondisi barang: ' + goods.label.toLowerCase(), goods.weight, goods.note));
  if (tracking && tracking.weight > 0) signals.push(signal('tracking', 'Status retur: ' + tracking.label.toLowerCase(), tracking.weight, tracking.note));
  if (packaging && packaging.weight > 0) signals.push(signal('packaging', 'Kemasan retur: ' + packaging.label.toLowerCase(), packaging.weight, 'Kemasan yang tidak layak membuat barang lebih mudah rusak dalam perjalanan.'));
  if (data.refund_before_return === 'ya') signals.push(signal('refund_first', 'Refund diproses sebelum barang kembali', 10, 'Dana keluar lebih dulu, sementara barang belum diterima penjual.'));
  if (data.store_blocked === 'ya') signals.push(signal('blocked', 'Toko sedang dibatasi atau diblokir', 12, 'Akses banding dan penarikan dana bisa ikut terhambat.'));
  if (data.complaint_visible === 'tidak') signals.push(signal('hidden', 'Pengajuan refund tidak terlihat jelas di riwayat', 10, 'Penjual sulit membuktikan kronologi dan menautkan bukti.'));
  if (appeal && appeal.weight > 0) signals.push(signal('appeal', 'Banding: ' + appeal.label.toLowerCase(), appeal.weight, 'Banding yang ditolak tanpa penjelasan perlu diminta ulang secara tertulis.'));
  if (buyer && buyer.weight > 0) signals.push(signal('buyer', 'Riwayat pembeli: ' + buyer.label.toLowerCase(), buyer.weight, 'Riwayat akun bukan bukti pelanggaran, tetapi relevan untuk pola klaim.'));
  if (data.repeat_refund === 'ya') signals.push(signal('repeat', 'Pembeli pernah mengajukan refund sebelumnya', 10, 'Cek pola transaksi dan keterkaitan dengan pesanan lain.'));
  if (data.buyer_refuses_chat === 'ya') signals.push(signal('no_chat', 'Pembeli menolak komunikasi', 8, 'Komunikasi tertulis tetap diperlukan untuk mencatat kronologi.'));
  if (calc.refund_pct >= 95) signals.push(signal('full_refund', 'Refund hampir penuh', 5, 'Nilai refund mencapai sedikitnya 95 persen dari nilai pesanan.'));
  if (data.order_value >= HIGH_VALUE) signals.push(signal('high_value', 'Nilai pesanan tinggi', 5, 'Nilai pesanan mencapai sedikitnya Rp1.000.000.'));

  const raw = signals.reduce((sum, item) => sum + item.points, 0);
  const score = Math.min(100, raw);
  let label = 'Minimal';
  let tone = 'signal';
  let detail = 'Indikasi proses masih minim. Fokus pada kelengkapan bukti dan permintaan rincian tertulis.';
  if (score >= 60) {
    label = 'Kuat';
    tone = 'ember';
    detail = 'Ada beberapa indikasi proses yang perlu ditinjau ulang. Minta rincian refund dan tautan bukti secara tertulis.';
  } else if (score >= 35) {
    label = 'Sedang';
    tone = 'signal';
    detail = 'Sebagian indikasi proses muncul. Lengkapi bukti kritis sebelum mengajukan banding ulang.';
  } else if (score >= 15) {
    label = 'Lemah';
    tone = 'signal';
    detail = 'Indikasi masih lemah. Pastikan kronologi, resi retur, dan bukti packing saling cocok.';
  }

  return {
    signals: signals.sort((a, b) => b.points - a.points),
    raw_score: raw,
    score,
    label,
    tone,
    detail,
  };
}

function analyze(raw, options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const data = normalizeInput(raw, today);
  const calc = compute(data);
  const risk = buildSignals(data, calc);
  const warnings = [];

  if (!data.order_ref) warnings.push('Nomor pesanan belum diisi. Nomor ini diperlukan saat mengajukan banding.');
  if (data.goods_status === 'tidak_kembali' && data.return_tracking === 'tidak_ada') {
    warnings.push('Barang tidak kembali dan tidak ada resi retur. Simpan tangkapan layar status pesanan sebagai bukti awal.');
  }
  if (data.goods_status === 'kembali_utuh' && data.recovered_value === 0) {
    warnings.push('Barang kembali utuh tetapi nilai yang diselamatkan masih nol. Isi nilai jual kembali bila barang masih layak.');
  }
  if (calc.refund_pct >= 100 && data.goods_status !== 'kembali_utuh') {
    warnings.push('Refund penuh tanpa barang kembali utuh. Minta rincian dasar persetujuan refund.');
  }
  if (calc.cash_loss > 0 && calc.normal_profit <= 0) {
    warnings.push('Margin normal sudah negatif. Kerugian kas tidak bisa dihitung sebagai kelipatan penjualan normal.');
  }
  if (data.case_date) {
    const age = dayDiff(data.case_date, today);
    if (age !== null && age > 30 && findOption(CASE_STATUSES, data.status)?.open) {
      warnings.push('Kasus sudah terbuka ' + age + ' hari. Tetapkan tanggal follow-up dan simpan semua balasan platform.');
    }
  }

  return {
    input: data,
    platform_label: platformLabel(data.platform),
    goods_label: labelFor(GOODS_STATUSES, data.goods_status),
    tracking_label: labelFor(RETURN_TRACKING, data.return_tracking),
    packaging_label: labelFor(RETURN_PACKAGING, data.return_packaging),
    appeal_label: labelFor(APPEAL_STATUSES, data.appeal_status),
    buyer_label: labelFor(BUYER_ACCOUNTS, data.buyer_account),
    status_label: labelFor(CASE_STATUSES, data.status),
    calculation: calc,
    risk,
    warnings,
    recommendations: buildRecommendations(data, calc, risk),
    disclaimer: 'Hasil dihitung dari input Anda. Tool ini bukan nasihat hukum dan tidak menjamin hasil banding. Kebijakan refund, retur, dan bukti berbeda di setiap marketplace.',
  };
}

function buildRecommendations(data, calc, risk) {
  const items = [];
  if (data.goods_status === 'tidak_kembali' || data.goods_status === 'kosong') {
    items.push('Minta rincian dasar persetujuan refund dan status pengembalian barang secara tertulis.');
  }
  if (data.return_tracking === 'tidak_ada' || data.return_tracking === 'invalid') {
    items.push('Minta nomor resi retur yang valid dan riwayat pergerakannya. Bandingkan dengan bukti berat paket.');
  }
  if (data.goods_status === 'rusak' || data.return_packaging === 'tidak_layak') {
    items.push('Simpan video unboxing paket retur, foto kemasan, dan bandingkan kondisi barang dengan video packing.');
  }
  if (data.appeal_status === 'ditolak') {
    items.push('Ajukan peninjauan ulang dengan kronologi bernomor dan tautan bukti, bukan hanya lampiran terpisah.');
  }
  if (data.store_blocked === 'ya') {
    items.push('Pisahkan permintaan pembukaan pembatasan toko dari sengketa refund agar kedua masalah tidak saling menutupi.');
  }
  if (calc.cash_loss > 0) {
    items.push('Catat kerugian kas Rp' + Math.round(calc.cash_loss).toLocaleString('id-ID') + ' sebagai dasar nilai tuntutan, bukan hanya nilai refund.');
  }
  if (calc.normal_sales_needed) {
    items.push('Kerugian setara ' + calc.normal_sales_needed + ' penjualan normal. Prioritaskan kasus ini bila nilainya tinggi.');
  }
  if (risk.score >= 35) {
    items.push('Lengkapi bukti kritis lebih dulu, lalu kirim satu surat yang meminta rincian dan peninjauan ulang.');
  } else {
    items.push('Mulai dari permintaan rincian refund. Hindari tuduhan tanpa bukti yang bisa melemahkan posisi Anda.');
  }
  items.push('Periksa nama, nomor pesanan, tanggal, dan nominal sebelum mengirim surat.');
  return items.slice(0, 6);
}

function readiness(raw, options = {}) {
  const evidence = Array.isArray(raw && raw.evidence)
    ? Array.from(new Set(raw.evidence.filter((id) => EVIDENCE.some((item) => item.id === id))))
    : [];
  const owned = EVIDENCE.filter((item) => evidence.includes(item.id));
  const totalWeight = EVIDENCE.reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const ownedWeight = owned.reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const score = Math.round((ownedWeight / totalWeight) * 100);
  const criticalOpen = EVIDENCE.filter((item) => item.critical && !evidence.includes(item.id)).map((item) => item.label);
  const missing = EVIDENCE.filter((item) => !evidence.includes(item.id)).map((item) => item.label);
  let label = 'Belum siap';
  let tone = 'ember';
  if (score >= 85) {
    label = 'Siap';
    tone = 'ok';
  } else if (score >= 60) {
    label = 'Hampir siap';
    tone = 'signal';
  } else if (score >= 35) {
    label = 'Perlu dilengkapi';
    tone = 'signal';
  }
  return {
    score,
    label,
    tone,
    checked_count: owned.length,
    total: EVIDENCE.length,
    critical_open: criticalOpen,
    missing,
    note: POLICIES.evidence_note,
  };
}

function formatDateLong(iso) {
  if (!iso) return '-';
  const date = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function rupiah(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Rp0';
  return 'Rp' + Math.round(number).toLocaleString('id-ID');
}

function analysisForLetter(raw, today) {
  const result = analyze(raw, { today });
  return result;
}

function letter(raw, options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const result = analysisForLetter(raw, today);
  const input = result.input;
  const calc = result.calculation;
  const type = findOption(LETTER_TYPES, raw && raw.letter_type) || LETTER_TYPES[0];
  if (!input.store_name) throw new Error('Nama toko wajib diisi untuk membuat surat.');
  if (!input.seller_name) throw new Error('Nama penjual wajib diisi untuk membuat surat.');
  if (!input.order_ref) throw new Error('Nomor pesanan wajib diisi untuk membuat surat.');
  const ticket = cleanText(raw && raw.ticket, 'Nomor tiket', 120);
  const chronology = cleanBlock(raw && raw.chronology, 'Kronologi', MAX_CHRONOLOGY);

  const subjectByType = {
    rincian: 'Permintaan rincian refund dan status pengembalian barang',
    kembalikan: 'Permintaan pengembalian barang atau pembatalan refund',
    eskalasi: 'Permohonan eskalasi sengketa refund tanpa pengembalian barang',
  };

  const recipientByType = {
    rincian: 'Customer Service ' + result.platform_label,
    kembalikan: 'Customer Service ' + result.platform_label,
    eskalasi: 'Kementerian Koperasi dan UKM serta Kementerian Perdagangan',
  };

  const greeting = type.id === 'eskalasi'
    ? 'Dengan hormat,'
    : 'Kepada Customer Service ' + result.platform_label + ',';

  const introByType = {
    rincian: 'Saya ingin meminta rincian tertulis atas refund yang telah diproses pada pesanan berikut.',
    kembalikan: 'Saya ingin meminta pengembalian barang atau pembatalan refund karena barang tidak diterima kembali dalam kondisi yang layak.',
    eskalasi: 'Saya ingin meminta bantuan eskalasi atas sengketa refund yang belum diselesaikan oleh platform.',
  };

  const requestByType = {
    rincian: [
      'Mohon kirimkan rincian dasar persetujuan refund, termasuk status pengembalian barang dan nomor resi retur.',
      'Mohon jelaskan bukti yang dipakai platform untuk menyetujui refund dan alasan bukti dari penjual belum dipertimbangkan.',
    ],
    kembalikan: [
      'Mohon batalkan refund atau proses pengembalian barang kepada penjual bila barang belum diterima kembali.',
      'Bila barang sudah kembali, mohon konfirmasi kondisi barang dan dasar penilaian kerusakannya.',
    ],
    eskalasi: [
      'Mohon tinjau ulang keputusan platform berdasarkan bukti yang saya lampirkan.',
      'Mohon arahkan penanganan ke kanal pengaduan yang berwenang bila platform tidak dapat menyelesaikan sengketa ini.',
    ],
  };

  const chronologyLine = chronology
    ? ['Kronologi:', chronology, '']
    : [];

  const evidenceLines = input.evidence.length
    ? ['Bukti yang saya miliki:', ...input.evidence.map((id) => '- ' + labelFor(EVIDENCE, id)), '']
    : ['Bukti yang saya miliki: belum lengkap. Saya akan melengkapinya sesuai permintaan.', ''];

  const lines = [
    greeting,
    '',
    'Perihal: ' + subjectByType[type.id],
    '',
    'Saya, ' + input.seller_name + ', pemilik toko ' + input.store_name + ', menyampaikan hal berikut.',
    '',
    introByType[type.id],
    '',
    'Data pesanan:',
    '- Platform: ' + result.platform_label,
    '- Nomor pesanan: ' + input.order_ref,
    '- Produk: ' + (input.product_name || '-'),
    '- Tanggal pesanan: ' + formatDateLong(input.order_date),
    '- Tanggal kasus: ' + formatDateLong(input.case_date),
    '- Nilai pesanan: ' + rupiah(input.order_value),
    '- Nominal refund: ' + rupiah(input.refund_amount),
    '- Status barang: ' + result.goods_label,
    '- Status resi retur: ' + result.tracking_label,
    '- Kondisi kemasan retur: ' + result.packaging_label,
    '- Kerugian kas: ' + rupiah(calc.cash_loss),
    '',
    ...chronologyLine,
    ...evidenceLines,
    'Permintaan saya:',
    ...requestByType[type.id].map((line, index) => (index + 1) + '. ' + line),
    '',
  ];

  if (ticket) {
    lines.push('Nomor tiket sebelumnya: ' + ticket);
    lines.push('');
  }

  lines.push('Saya mohon jawaban tertulis dalam waktu yang wajar. Bila diperlukan, saya siap mengirim bukti tambahan yang relevan.');
  lines.push('');
  lines.push('Hormat saya,');
  lines.push(input.seller_name);
  if (input.contact) lines.push(input.contact);
  if (input.store_name) lines.push('Toko ' + input.store_name);
  lines.push('');
  lines.push('Catatan: surat ini disusun dari data yang saya masukkan. Saya bertanggung jawab atas kebenaran data tersebut.');

  const body = lines.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    subject: subjectByType[type.id],
    recipient: recipientByType[type.id],
    type: type.id,
    type_label: type.label,
    body,
  };
}

function summarizeCases(cases, today) {
  const list = Array.isArray(cases) ? cases : [];
  const decorated = list.map((item) => decorateCase(item, today));
  const open = decorated.filter((item) => {
    const status = findOption(CASE_STATUSES, item.status);
    return status ? status.open : true;
  });
  const totalCashLoss = decorated.reduce((sum, item) => sum + (Number(item.calculation && item.calculation.cash_loss) || 0), 0);
  const totalRefund = decorated.reduce((sum, item) => sum + (Number(item.refund_amount) || 0), 0);
  const totalRecovered = decorated.reduce((sum, item) => sum + (Number(item.recovered_value) || 0), 0);
  const ages = open.map((item) => dayDiff(item.case_date, today)).filter((value) => value !== null);
  const oldest = ages.length ? Math.max(...ages) : null;
  const warnings = [];
  if (oldest !== null && oldest > 30) warnings.push('Ada kasus terbuka lebih dari 30 hari. Periksa follow-up dan simpan semua balasan platform.');
  if (open.some((item) => item.store_blocked === 'ya')) warnings.push('Ada toko yang sedang dibatasi. Pisahkan permintaan pembukaan toko dari sengketa refund.');
  const criticalGap = open.find((item) => {
    const result = readiness({ evidence: item.evidence });
    return result.critical_open.length > 0;
  });
  if (criticalGap) warnings.push('Ada kasus terbuka dengan bukti kritis yang belum lengkap. Lengkapi sebelum mengirim banding ulang.');
  return {
    total: decorated.length,
    open_count: open.length,
    closed_count: decorated.length - open.length,
    total_cash_loss: round(totalCashLoss),
    total_refund: round(totalRefund),
    total_recovered: round(totalRecovered),
    oldest_open_days: oldest,
    warnings,
    cases: decorated,
  };
}

function decorateCase(item, today) {
  const result = analyze(item, { today });
  const evidence = readiness({ evidence: item.evidence || [] });
  const age = dayDiff(item.case_date, today);
  return {
    ...item,
    calculation: result.calculation,
    risk: result.risk,
    goods_label: result.goods_label,
    tracking_label: result.tracking_label,
    platform_label: result.platform_label,
    appeal_label: result.appeal_label,
    status_label: result.status_label,
    age_days: age,
    critical_open: evidence.critical_open,
    verdict_label: result.risk.label + ' (' + result.risk.score + ')',
    verdict_tone: result.risk.tone,
    cash_loss_tone: result.calculation.cash_loss > 0 ? 'ember' : 'ok',
  };
}

function example() {
  return {
    store_name: 'Toko Contoh',
    seller_name: 'Penjual Contoh',
    contact: '0812-0000-0000',
    platform: 'shopee',
    order_ref: 'ORD-CONTOH-001',
    product_name: 'Contoh: stand background aluminium',
    order_date: '2026-10-20',
    case_date: '2026-11-01',
    order_value: 3497000,
    product_cost: 2600000,
    shipping_cost: 65000,
    packaging_cost: 8000,
    return_shipping_cost: 120000,
    refund_amount: 3497000,
    recovered_value: 500000,
    goods_status: 'rusak',
    return_tracking: 'ada',
    return_packaging: 'tidak_layak',
    refund_before_return: 'tidak',
    store_blocked: 'tidak',
    complaint_visible: 'ya',
    appeal_status: 'ditolak',
    buyer_account: 'lama',
    repeat_refund: 'tidak',
    buyer_refuses_chat: 'tidak',
    ticket: 'TKT-CONTOH-001',
    followup_date: '2026-11-04',
    note: 'Contoh: banding ditolak, minta peninjauan ulang bukti.',
    chronology: 'Barang dikirim dengan video packing. Pembeli mengajukan refund, barang kembali dalam kemasan tidak layak dan rusak. Banding penjual ditolak.',
    status: 'surat',
    evidence: ['order_detail', 'refund_proof', 'return_tracking', 'packing_video', 'unboxing_return', 'return_photos', 'complaint_screenshot', 'appeal_ticket', 'cost_invoice', 'chronology'],
  };
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n\r]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvRows(cases, today) {
  const header = [
    'id', 'created_at', 'platform', 'order_ref', 'product_name', 'store_name', 'seller_name', 'case_date', 'status',
    'order_value', 'refund_amount', 'product_cost', 'return_shipping_cost', 'recovered_value', 'cash_loss', 'profit_loss',
    'risk_score', 'risk_label', 'goods_status', 'return_tracking', 'appeal_status', 'ticket', 'followup_date', 'note',
  ];
  const rows = [header.join(',')];
  (cases || []).forEach((item) => {
    const decorated = decorateCase(item, today);
    const calc = decorated.calculation;
    rows.push([
      decorated.id, decorated.created_at, decorated.platform, decorated.order_ref, decorated.product_name, decorated.store_name, decorated.seller_name,
      decorated.case_date, decorated.status_label, decorated.order_value, decorated.refund_amount, decorated.product_cost, decorated.return_shipping_cost,
      decorated.recovered_value, calc.cash_loss, calc.profit_loss, decorated.risk.score, decorated.risk.label, decorated.goods_label,
      decorated.tracking_label, decorated.appeal_label, decorated.ticket, decorated.followup_date, decorated.note,
    ].map(csvCell).join(','));
  });
  return rows.join('\r\n');
}

module.exports = {
  PLATFORMS,
  GOODS_STATUSES,
  RETURN_TRACKING,
  RETURN_PACKAGING,
  YES_NO_UNKNOWN,
  APPEAL_STATUSES,
  BUYER_ACCOUNTS,
  CASE_STATUSES,
  LETTER_TYPES,
  EVIDENCE,
  SOURCES,
  POLICIES,
  HIGH_VALUE,
  meta,
  normalizeInput,
  compute,
  analyze,
  readiness,
  letter,
  summarizeCases,
  decorateCase,
  example,
  csvRows,
  formatDateLong,
  rupiah,
  round,
  dayDiff,
};
