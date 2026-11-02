'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PROCESSING_FEE = 1250;
const DYNAMIC_CAP = 650000;
const BUYER_RETURN_CONTRIBUTION = 5000;

const PLATFORMS = [
  {
    id: 'tiktok',
    label: 'TikTok Shop by Tokopedia',
    note: 'Kartu tarif dan aturan biaya di tool ini diground dari halaman resmi Shop Operation serta pengumuman biaya pemrosesan order. Tarif per kategori bisa berbeda. Cocokkan dengan Seller Center dan kartu tarif terbaru sebelum memakai angka ini sebagai dasar keberatan.',
  },
  {
    id: 'lain',
    label: 'Marketplace lain',
    note: 'Tool ini hanya memakai kartu tarif TikTok Shop by Tokopedia sebagai contoh. Untuk platform lain, isi tarif dan biaya manual dari Seller Center. Jangan memakai angka TikTok sebagai patokan platform lain.',
  },
];

const ORDER_STATES = [
  { id: 'batal_sebelum_kirim', label: 'Dibatalkan sebelum paket dikirim', shipped: false },
  { id: 'batal_setelah_kirim', label: 'Dibatalkan setelah paket dikirim', shipped: true },
  { id: 'retur_setelah_kirim', label: 'Retur setelah paket diterima', shipped: true },
  { id: 'refund_sebagian', label: 'Refund sebagian setelah paket diterima', shipped: true },
  { id: 'selesai', label: 'Selesai tanpa sengketa', shipped: true },
];

const RETURN_CAUSES = [
  { id: 'tidak_ada', label: 'Tidak ada retur', note: 'Tidak ada pengembalian barang atau dana.' },
  { id: 'pembeli', label: 'Kesalahan pembeli (berubah pikiran, salah pilih)', note: 'Penjual hanya menanggung kontribusi ongkir retur sesuai kebijakan yang berlaku.' },
  { id: 'penjual', label: 'Kesalahan penjual (salah kirim, tidak sesuai)', note: 'Penjual menanggung ongkir retur. Potongan ongkir tidak layak dijadikan dasar keberatan.' },
  { id: 'logistik', label: 'Kesalahan logistik (rusak atau hilang di jalan)', note: 'Ongkir retur ditanggung logistik. Komisi terkait produk retur dapat dikembalikan bila berlaku.' },
];

const SHIPPING_POLICIES = [
  { id: 'grace', label: 'Masa tenggang: kontribusi ongkir Rp 0', note: 'Kebijakan TikTok Shop by Tokopedia menyebut masa tenggang sampai pemberitahuan lebih lanjut. Selama masa ini penjual tidak dikenakan biaya pengiriman gagal atau retur karena kesalahan pembeli.' },
  { id: 'kontribusi_5rb', label: 'Kontribusi maksimal Rp 5.000 per arah', note: 'Mulai 1 Juni 2026 penjual dikenakan kontribusi hingga Rp 5.000 untuk setiap arah pengiriman pada retur karena kesalahan pembeli. Biaya di atas Rp 5.000 ditanggung platform.' },
  { id: 'penuh', label: 'Penjual menanggung ongkir retur penuh', note: 'Dipakai bila platform atau perjanjian toko memang membebankan ongkir retur penuh. Jangan pakai opsi ini untuk mengklaim potongan yang sebenarnya sesuai kebijakan.' },
];

const AUTO_SIGNALS = [
  { id: 'batal_tanpa_kirim_komisi', label: 'Pesanan dibatalkan sebelum dikirim, tetapi komisi tetap dipotong', weight: 22 },
  { id: 'batal_tanpa_kirim_proses', label: 'Pesanan dibatalkan sebelum dikirim, tetapi biaya pemrosesan tetap dipotong', weight: 18 },
  { id: 'komisi_lebih_tarif', label: 'Komisi terpotong lebih tinggi dari perhitungan tarif yang dimasukkan', weight: 16 },
  { id: 'ongkir_melebihi_perkiraan', label: 'Ongkir yang dibebankan melebihi perkiraan kebijakan yang dipilih', weight: 14 },
  { id: 'ongkir_lebih_dua_arah', label: 'Ongkir yang dibebankan melebihi dua arah pengiriman', weight: 16 },
  { id: 'ongkir_pembeli_ditagih_lagi', label: 'Pembeli sudah membayar ongkir, tetapi penjual masih dibebankan ongkir yang sama', weight: 14 },
  { id: 'retur_beban_penuh', label: 'Retur karena kesalahan pembeli dibebankan melebihi kontribusi yang diizinkan', weight: 14 },
  { id: 'refund_melebihi_nilai', label: 'Refund ke pembeli melebihi nilai produk setelah diskon', weight: 25 },
  { id: 'biaya_lain', label: 'Ada biaya lain di settlement yang belum dijelaskan', weight: 10 },
  { id: 'tarif_luar_kartu', label: 'Tarif yang dimasukkan berada di luar rentang kartu tarif TikTok yang dipublikasikan', weight: 8 },
  { id: 'komisi_dinamis_lewat_cap', label: 'Komisi dinamis melewati batas Rp 650.000 per item sebelum pembatasan', weight: 10 },
  { id: 'selisih_besar', label: 'Selisih potongan mencapai 5 persen atau lebih dari perkiraan', weight: 15 },
  { id: 'settlement_negatif', label: 'Perkiraan dana bersih negatif, penjual berpotensi membayar dari kantong', weight: 12 },
];

const MANUAL_SIGNALS = [
  { id: 'rincian_tidak_diminta', label: 'Rincian potongan per komponen belum pernah diminta ke platform', weight: 8 },
  { id: 'cs_hanya_template', label: 'CS hanya membalas dengan jawaban template', weight: 6 },
  { id: 'kebijakan_tidak_tertulis', label: 'Dasar kebijakan potongan tidak diberikan secara tertulis', weight: 8 },
  { id: 'tiket_sebelumnya_ditutup', label: 'Tiket sebelumnya ditutup tanpa penjelasan', weight: 8 },
  { id: 'potongan_berulang', label: 'Potongan serupa terjadi berulang di banyak pesanan', weight: 10 },
  { id: 'settlement_tidak_diunduh', label: 'Bukti settlement belum diunduh sebelum periode berakhir', weight: 4 },
];

const EVIDENCE = [
  { id: 'settlement_detail', label: 'Tangkapan layar rincian settlement per pesanan', critical: true, group: 'Settlement' },
  { id: 'order_detail', label: 'Tangkapan layar detail pesanan dan status pembayaran', critical: true, group: 'Pesanan' },
  { id: 'cancel_proof', label: 'Bukti pembatalan dari pembeli atau sistem, lengkap dengan waktu', critical: true, group: 'Pembatalan' },
  { id: 'refund_proof', label: 'Bukti refund atau retur yang disetujui platform', critical: true, group: 'Retur' },
  { id: 'rate_card', label: 'Kartu tarif atau halaman kebijakan yang berlaku untuk kategori produk', critical: true, group: 'Kebijakan' },
  { id: 'fee_breakdown', label: 'Rincian komisi, biaya pemrosesan, ongkir, dan biaya lain dari Seller Center', critical: false, group: 'Settlement' },
  { id: 'chat_history', label: 'Riwayat chat dengan pembeli dan CS', critical: false, group: 'Komunikasi' },
  { id: 'ticket_number', label: 'Nomor tiket pengaduan sebelumnya dan jawabannya', critical: false, group: 'Komunikasi' },
  { id: 'shipping_receipt', label: 'Resi dan bukti serah terima paket ke kurir', critical: false, group: 'Pengiriman' },
  { id: 'buyer_shipping_paid', label: 'Bukti ongkir yang sudah dibayar pembeli', critical: false, group: 'Pengiriman' },
  { id: 'return_shipping', label: 'Bukti ongkir retur dan siapa yang menanggung', critical: false, group: 'Retur' },
  { id: 'payout_statement', label: 'Mutasi pencairan atau laporan keuangan toko', critical: false, group: 'Settlement' },
  { id: 'timeline', label: 'Kronologi tanggal pesanan, batal, retur, dan pencairan', critical: false, group: 'Komunikasi' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru ditemukan', open: true },
  { id: 'menunggu_rincian', label: 'Menunggu rincian platform', open: true },
  { id: 'keberatan_dikirim', label: 'Keberatan dikirim', open: true },
  { id: 'ditanggapi', label: 'Ditanggapi sebagian', open: true },
  { id: 'selesai', label: 'Selesai dan dana kembali', open: false },
  { id: 'ditolak', label: 'Ditolak platform', open: true },
];

const LETTER_TYPES = [
  { id: 'rincian', label: 'Permintaan rincian potongan per komponen' },
  { id: 'keberatan', label: 'Keberatan atas potongan yang tidak sesuai' },
  { id: 'eskalasi', label: 'Permintaan eskalasi setelah tiket ditutup' },
];

const SOURCES = [
  {
    title: 'Pesanan di TikTok Shop Dibatalkan Pembeli tapi Penjual Tetap Ditagih Komisi dan Ongkir 2 Kali',
    publisher: 'Media Konsumen',
    date: '2026-10-12',
    url: 'https://mediakonsumen.com/2026/10/12/surat-pembaca/pesanan-di-tiktok-shop-dibatalkan-pembeli-tapi-penjual-tetap-ditagih-komisi-dan-ongkir-2-kali',
    note: 'Pengalaman penjual TikTok Shop di Semarang. Pesanan dibatalkan pembeli, tetapi penjual tetap ditagih komisi dan biaya pemrosesan. Ongkir yang sudah dibayar pembeli juga disebut ditagih lagi ke penjual. Ini pengaduan penjual, bukan putusan platform.',
  },
  {
    title: 'TikTok Shop Tokopedia Membebankan Biaya kepada Penjual Padahal Pembeli yang Mau Retur, Barang Retur yang Rusak Tidak Diganti (II)',
    publisher: 'Media Konsumen',
    date: '2026-10-06',
    url: 'https://mediakonsumen.com/2026/10/06/surat-pembaca/tiktok-shop-tokopedia-membebankan-biaya-kepada-penjual-padahal-pembeli-yang-mau-retur-barang-retur-yang-rusak-tidak-diganti-ii',
    note: 'Penjual mengeluhkan biaya yang tetap dibebankan saat pembeli mengajukan retur, sementara barang retur rusak tidak diganti. Kasus ini menunjukkan pentingnya memisahkan potongan yang sesuai kebijakan dari potongan yang perlu dipertanyakan.',
  },
  {
    title: 'Jual Barang Rp6 Juta di Tokopedia, Malah Rugi Rp463 Ribu karena Potongan Mencapai Rp963 Ribu',
    publisher: 'Media Konsumen',
    date: '2026-06-05',
    url: 'https://mediakonsumen.com/2026/06/05/surat-pembaca/jual-barang-rp6-juta-di-tokopedia-malah-rugi-rp463-ribu-karena-potongan-mencapai-rp963-ribu',
    note: 'Contoh lama yang menunjukkan potongan bisa melebihi perkiraan penjual. Nominalnya berasal dari pengaduan penjual, bukan tarif resmi.',
  },
  {
    title: 'Shop Operation: Platform Commission Fee, Dynamic Commission, Order Processing Fee',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: 'diakses 2026-11-02',
    url: 'https://seller-id.tokopedia.com/university/course?content_id=7392850066884369&lang=en&learning_id=4759438594787088',
    note: 'Komisi platform 2,50 sampai 12,20 persen sesuai kategori. Komisi dinamis 3 sampai 8 persen dengan batas Rp 650.000 per item atau SKU mulai 18 Mei 2026. Biaya pemrosesan order Rp 1.250 per pesanan yang berhasil dikirim.',
  },
  {
    title: 'Kebijakan Pembatalan Pesanan, Pengembalian Barang, dan Pengembalian Dana Pelanggan TikTok Shop',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: 'diakses 2026-11-02',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=6837727601690370&lang=id-ID',
    note: 'Untuk retur karena kesalahan logistik, komisi platform terkait produk retur dikembalikan kepada penjual bila berlaku. Mulai 1 Juni 2026, retur karena kesalahan pembeli dikenakan kontribusi hingga Rp 5.000 per arah, dengan masa tenggang sampai pemberitahuan lebih lanjut.',
  },
  {
    title: 'Tokopedia-TikTok Mulai Berlakukan Biaya Seller Rp1.250 per Transaksi Hari Ini',
    publisher: 'Bisnis.com',
    date: '2025-08-11',
    url: 'https://teknologi.bisnis.com/read/20250811/266/1901232/tokopedia-tiktok-mulai-berlakukan-biaya-seller-rp1250-per-transaksi-hari-ini',
    note: 'Biaya pemrosesan order Rp 1.250 per pesanan yang berhasil dikirim. Biaya dikembalikan penuh bila seluruh pesanan dibatalkan sebelum dikirim. Bila pesanan sudah terkirim lalu retur atau refund, biaya tidak dikembalikan.',
  },
  {
    title: 'Menteri UMKM Larang Biaya Seller Naik, TikTok Shop vs Shopee Siapa Paling Sering?',
    publisher: 'teknologi.bisnis.com',
    date: '2026-05-16',
    url: 'https://teknologi.bisnis.com/read/20260516/84/1974124/menteri-umkm-larang-biaya-seller-naik-tiktok-shop-vs-shopee-siapa-paling-sering',
    note: 'Komisi dinamis berlaku untuk pesanan yang berhasil dikirim. Bila pesanan sudah dikirim lalu diretur atau direfund, komisi dinamis tidak dikembalikan. Batas lama Rp 40.000 per item naik menjadi Rp 650.000 mulai 18 Mei 2026.',
  },
];

const DEFAULTS = {
  platform: 'tiktok',
  order_state: 'batal_setelah_kirim',
  return_cause: 'pembeli',
  shipping_policy: 'grace',
  qty: 1,
  platform_rate: 8,
  dynamic_rate: 0,
  unit_price: 0,
  discount_per_unit: 0,
  shipping_per_direction: 0,
  shipping_directions: 1,
  buyer_shipping_paid: 0,
  refund_to_buyer: 0,
  actual_commission: 0,
  actual_processing: 0,
  actual_shipping: 0,
  actual_other: 0,
  orders_per_month: 0,
  status: 'baru',
  letter_type: 'rincian',
};

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function todayISO(now = new Date()) {
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

function parseISO(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parts = text.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
  return text;
}

function dateFromISO(iso) {
  return parseISO(iso) ? new Date(iso + 'T00:00:00') : null;
}

function isoFromDate(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function addDays(iso, days) {
  const date = dateFromISO(iso);
  if (!date) return '';
  date.setDate(date.getDate() + days);
  return isoFromDate(date);
}

function daysBetween(from, to) {
  const a = parseISO(from);
  const b = parseISO(to);
  if (!a || !b) return null;
  const ap = a.split('-').map(Number);
  const bp = b.split('-').map(Number);
  const au = Date.UTC(ap[0], ap[1] - 1, ap[2]);
  const bu = Date.UTC(bp[0], bp[1] - 1, bp[2]);
  return Math.round((bu - au) / 86400000);
}

function formatDateID(iso) {
  if (!iso) return '-';
  const parts = String(iso).split('-');
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

function getPlatform(id) {
  return PLATFORMS.find((item) => item.id === id) || PLATFORMS[0];
}

function getOrderState(id) {
  return ORDER_STATES.find((item) => item.id === id) || ORDER_STATES[0];
}

function getReturnCause(id) {
  return RETURN_CAUSES.find((item) => item.id === id) || RETURN_CAUSES[0];
}

function getShippingPolicy(id) {
  return SHIPPING_POLICIES.find((item) => item.id === id) || SHIPPING_POLICIES[0];
}

function getCaseStatus(id) {
  return CASE_STATUSES.find((item) => item.id === id) || CASE_STATUSES[0];
}

function getLetterType(id) {
  return LETTER_TYPES.find((item) => item.id === id) || LETTER_TYPES[0];
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id);
}

function getManualSignal(id) {
  return MANUAL_SIGNALS.find((item) => item.id === id);
}

function getAutoSignal(id) {
  return AUTO_SIGNALS.find((item) => item.id === id);
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function normalizeList(input, getter) {
  const source = Array.isArray(input) ? input : [];
  return Array.from(new Set(source.map((id) => String(id)).filter((id) => getter(id))));
}

function validateBase(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const orderState = getOrderState(data.order_state);
  const returnCause = getReturnCause(data.return_cause);
  const shippingPolicy = getShippingPolicy(data.shipping_policy);

  const orderDate = parseISO(data.order_date);
  if (!orderDate) return { error: 'Tanggal pesanan wajib diisi dengan format YYYY-MM-DD' };
  if (orderDate > todayISO(now)) return { error: 'Tanggal pesanan tidak boleh melewati hari ini' };

  const settlementDate = parseISO(data.settlement_date);
  if (String(data.settlement_date || '').trim() && !settlementDate) return { error: 'Tanggal settlement tidak valid' };
  if (settlementDate && settlementDate > todayISO(now)) return { error: 'Tanggal settlement tidak boleh melewati hari ini' };
  if (settlementDate && daysBetween(orderDate, settlementDate) < 0) return { error: 'Tanggal settlement tidak boleh sebelum tanggal pesanan' };

  const followup = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followup) return { error: 'Tanggal follow-up tidak valid' };
  if (followup && followup > todayISO(now)) return { error: 'Tanggal follow-up tidak boleh melewati hari ini' };
  if (followup && daysBetween(orderDate, followup) < 0) return { error: 'Tanggal follow-up tidak boleh sebelum tanggal pesanan' };

  const unitPrice = num(data.unit_price);
  const discount = num(data.discount_per_unit);
  const qty = num(data.qty);
  const platformRate = num(data.platform_rate);
  const dynamicRate = num(data.dynamic_rate);
  const shippingPerDirection = num(data.shipping_per_direction);
  const shippingDirections = num(data.shipping_directions);
  const buyerShippingPaid = num(data.buyer_shipping_paid);
  const refund = num(data.refund_to_buyer);
  const actualCommission = num(data.actual_commission);
  const actualProcessing = num(data.actual_processing);
  const actualShipping = num(data.actual_shipping);
  const actualOther = num(data.actual_other);
  const ordersPerMonth = num(data.orders_per_month);

  if (unitPrice <= 0) return { error: 'Harga satuan produk harus lebih dari 0' };
  if (discount < 0) return { error: 'Diskon tidak boleh negatif' };
  if (unitPrice - discount <= 0) return { error: 'Harga setelah diskon harus lebih dari 0' };
  if (!Number.isInteger(qty) || qty < 1) return { error: 'Jumlah unit harus bilangan bulat minimal 1' };
  if (platformRate < 0 || platformRate >= 100) return { error: 'Tarif komisi platform harus 0 sampai kurang dari 100 persen' };
  if (dynamicRate < 0 || dynamicRate >= 100) return { error: 'Tarif komisi dinamis harus 0 sampai kurang dari 100 persen' };
  if (shippingPerDirection < 0) return { error: 'Ongkir per arah tidak boleh negatif' };
  if (shippingDirections !== 1 && shippingDirections !== 2) return { error: 'Jumlah arah pengiriman harus 1 atau 2' };
  if (buyerShippingPaid < 0) return { error: 'Ongkir yang dibayar pembeli tidak boleh negatif' };
  if (refund < 0) return { error: 'Refund ke pembeli tidak boleh negatif' };
  if (actualCommission < 0 || actualProcessing < 0 || actualShipping < 0 || actualOther < 0) return { error: 'Nominal potongan tidak boleh negatif' };
  if (!Number.isInteger(ordersPerMonth) || ordersPerMonth < 0) return { error: 'Jumlah pesanan serupa per bulan harus bilangan bulat minimal 0' };

  return {
    data: {
      platform: platform.id,
      order_state: orderState.id,
      return_cause: returnCause.id,
      shipping_policy: shippingPolicy.id,
      order_id: cleanLine(data.order_id, 100),
      product_name: cleanLine(data.product_name, 160),
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      seller_name: cleanLine(data.seller_name, 120),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      order_date: orderDate,
      settlement_date: settlementDate || '',
      followup_date: followup || '',
      unit_price: round2(unitPrice),
      discount_per_unit: round2(discount),
      qty: qty,
      platform_rate: round2(platformRate),
      dynamic_rate: round2(dynamicRate),
      shipping_per_direction: round2(shippingPerDirection),
      shipping_directions: shippingDirections,
      buyer_shipping_paid: round2(buyerShippingPaid),
      refund_to_buyer: round2(refund),
      actual_commission: round2(actualCommission),
      actual_processing: round2(actualProcessing),
      actual_shipping: round2(actualShipping),
      actual_other: round2(actualOther),
      orders_per_month: ordersPerMonth,
      chronology: cleanBlock(data.chronology),
      note: cleanBlock(data.note),
      status: getCaseStatus(data.status).id,
      letter_type: getLetterType(data.letter_type).id,
      manual_signals: normalizeList(data.manual_signals || data.signals, getManualSignal),
      evidence: normalizeList(data.evidence || data.items, getEvidence),
    },
  };
}

function computeShippingExpected(data, shipped) {
  if (!shipped) return 0;
  if (data.order_state === 'selesai') return 0;
  const cause = getReturnCause(data.return_cause);
  if (cause.id === 'logistik' || cause.id === 'tidak_ada') return 0;
  const policy = getShippingPolicy(data.shipping_policy);
  if (cause.id === 'penjual') {
    return data.shipping_per_direction * data.shipping_directions;
  }
  if (policy.id === 'grace') return 0;
  if (policy.id === 'kontribusi_5rb') {
    return Math.min(data.shipping_per_direction, BUYER_RETURN_CONTRIBUTION) * data.shipping_directions;
  }
  return data.shipping_per_direction * data.shipping_directions;
}

function computeTotals(data) {
  const state = getOrderState(data.order_state);
  const shipped = state.shipped;
  const base = Math.max(0, data.unit_price - data.discount_per_unit) * data.qty;
  const platformCommission = shipped ? base * (data.platform_rate / 100) : 0;
  const dynamicUncapped = shipped ? base * (data.dynamic_rate / 100) : 0;
  const dynamicCapped = Math.min(dynamicUncapped, DYNAMIC_CAP * data.qty);
  const expectedCommission = Math.round(platformCommission + dynamicCapped);
  const expectedProcessing = shipped ? PROCESSING_FEE : 0;
  const expectedShipping = Math.round(computeShippingExpected(data, shipped));
  const expectedTotal = expectedCommission + expectedProcessing + expectedShipping;

  const actualCommission = Math.round(data.actual_commission);
  const actualProcessing = Math.round(data.actual_processing);
  const actualShipping = Math.round(data.actual_shipping);
  const actualOther = Math.round(data.actual_other);
  const actualTotal = actualCommission + actualProcessing + actualShipping + actualOther;

  const overcharge = actualTotal - expectedTotal;
  const overchargePct = expectedTotal > 0 ? round1((overcharge / expectedTotal) * 100) : (actualTotal > 0 ? 100 : 0);
  const estimatedSettlement = Math.round(base - data.refund_to_buyer - actualTotal);
  const monthlyLeak = Math.max(0, overcharge) * data.orders_per_month;

  return {
    shipped: shipped,
    base: Math.round(base),
    platform_commission: Math.round(platformCommission),
    dynamic_uncapped: Math.round(dynamicUncapped),
    dynamic_capped: Math.round(dynamicCapped),
    dynamic_cap: DYNAMIC_CAP,
    expected_commission: expectedCommission,
    expected_processing: expectedProcessing,
    expected_shipping: expectedShipping,
    expected_total: expectedTotal,
    actual_commission: actualCommission,
    actual_processing: actualProcessing,
    actual_shipping: actualShipping,
    actual_other: actualOther,
    actual_total: actualTotal,
    overcharge: overcharge,
    overcharge_pct: overchargePct,
    unit_price: Math.round(data.unit_price),
    discount_per_unit: Math.round(data.discount_per_unit),
    qty: data.qty,
    buyer_shipping_paid: Math.round(data.buyer_shipping_paid),
    refund_to_buyer: Math.round(data.refund_to_buyer),
    estimated_settlement: estimatedSettlement,
    monthly_leak: Math.round(monthlyLeak),
    orders_per_month: data.orders_per_month,
    processing_fee: PROCESSING_FEE,
    buyer_return_contribution: BUYER_RETURN_CONTRIBUTION,
  };
}

function detectSignals(data, calc) {
  const ids = [];
  const add = (id) => { if (getAutoSignal(id) && ids.indexOf(id) === -1) ids.push(id); };

  if (!calc.shipped && data.actual_commission > 1) add('batal_tanpa_kirim_komisi');
  if (!calc.shipped && data.actual_processing > 1) add('batal_tanpa_kirim_proses');
  if (data.actual_commission > calc.expected_commission + Math.max(100, calc.expected_commission * 0.02)) add('komisi_lebih_tarif');
  if (data.actual_shipping > calc.expected_shipping + 1) add('ongkir_melebihi_perkiraan');
  if (data.actual_shipping > Math.max(data.shipping_per_direction * 2, 1) + 1) add('ongkir_lebih_dua_arah');
  if (data.buyer_shipping_paid > 0 && data.actual_shipping > calc.expected_shipping + 1) add('ongkir_pembeli_ditagih_lagi');
  if (getReturnCause(data.return_cause).id === 'pembeli' && data.actual_shipping > calc.expected_shipping + 1) add('retur_beban_penuh');
  if (data.refund_to_buyer > calc.base + 1) add('refund_melebihi_nilai');
  if (data.actual_other > 0) add('biaya_lain');
  if (data.platform === 'tiktok' && (data.platform_rate < 2.5 || data.platform_rate > 12.2)) add('tarif_luar_kartu');
  if (data.platform === 'tiktok' && calc.dynamic_uncapped > DYNAMIC_CAP * data.qty + 1) add('komisi_dinamis_lewat_cap');
  if (calc.overcharge > 0 && calc.overcharge_pct >= 5) add('selisih_besar');
  if (calc.estimated_settlement < 0) add('settlement_negatif');

  return ids;
}

function assess(data, calc) {
  const autoIds = detectSignals(data, calc);
  const auto = AUTO_SIGNALS.filter((item) => autoIds.indexOf(item.id) !== -1).map((item) => ({
    id: item.id,
    label: item.label,
    weight: item.weight,
    kind: 'otomatis',
  }));
  const manual = MANUAL_SIGNALS.filter((item) => data.manual_signals.indexOf(item.id) !== -1).map((item) => ({
    id: item.id,
    label: item.label,
    weight: item.weight,
    kind: 'manual',
  }));
  const all = auto.concat(manual);
  let score = 0;
  all.forEach((item) => { score += item.weight; });
  score = Math.min(100, score);

  let level = 'tidak_ada';
  let label = 'Tidak ada indikasi selisih';
  let tone = 'ok';
  if (score >= 60) {
    level = 'tinggi';
    label = 'Indikasi kuat, ajukan keberatan';
    tone = 'ember';
  } else if (score >= 35) {
    level = 'sedang';
    label = 'Perlu dicek, minta rincian';
    tone = 'signal';
  } else if (score > 0) {
    level = 'rendah';
    label = 'Indikasi rendah, lengkapi bukti';
    tone = 'signal';
  }

  return {
    score: score,
    level: level,
    label: label,
    tone: tone,
    auto: auto,
    manual: manual,
    selected: all.map((item) => item.label),
    note: 'Skor ini heuristik dari selisih angka yang Anda masukkan dan fakta yang Anda centang. Bukan putusan bahwa platform melakukan pelanggaran. Potongan yang sesuai kebijakan tetap sah meskipun terasa merugikan.',
  };
}

function readiness(input) {
  const selected = normalizeList(input && (input.items || input.evidence), getEvidence);
  const available = EVIDENCE.filter((item) => selected.indexOf(item.id) !== -1);
  const missingCritical = EVIDENCE.filter((item) => item.critical && selected.indexOf(item.id) === -1);
  const criticalTotal = EVIDENCE.filter((item) => item.critical).length * 2;
  const normalTotal = EVIDENCE.filter((item) => !item.critical).length;
  let earned = 0;
  available.forEach((item) => { earned += item.critical ? 2 : 1; });
  const totalWeight = criticalTotal + normalTotal;
  const score = Math.round((earned / totalWeight) * 100);

  let verdict = 'kurang';
  if (missingCritical.length === 0 && score >= 75) verdict = 'siap';
  else if (missingCritical.length <= 1) verdict = 'hampir';

  return {
    score: score,
    available_count: available.length,
    total: EVIDENCE.length,
    missing_critical: missingCritical.map((item) => item.label),
    ready: missingCritical.length === 0,
    verdict: verdict,
    verdict_label: verdict === 'siap' ? 'Bukti siap' : verdict === 'hampir' ? 'Hampir siap' : 'Bukti belum cukup',
    items: EVIDENCE.map((item) => Object.assign({}, item, { checked: selected.indexOf(item.id) !== -1 })),
  };
}

function decide(calc, risk, data) {
  if (calc.overcharge <= -1) {
    return {
      code: 'lebih_rendah',
      label: 'Potongan lebih rendah dari perkiraan',
      tone: 'signal',
      detail: 'Potongan aktual ' + formatRupiah(calc.actual_total) + ' lebih rendah dari perkiraan ' + formatRupiah(calc.expected_total) + '. Periksa apakah ada subsidi, pembebasan biaya, atau tarif yang berbeda dari yang Anda masukkan.',
    };
  }
  if (calc.overcharge <= 0) {
    return {
      code: 'sesuai',
      label: 'Tidak ada selisih yang perlu dipertanyakan',
      tone: 'ok',
      detail: 'Potongan aktual sama atau lebih rendah dari perkiraan. Simpan bukti settlement dan pastikan dana cair sesuai laporan keuangan.',
    };
  }
  if (risk.score >= 60 || calc.overcharge_pct >= 10) {
    return {
      code: 'keberatan',
      label: 'Ajukan keberatan dengan rincian angka',
      tone: 'ember',
      detail: 'Selisih ' + formatRupiah(calc.overcharge) + ' atau ' + calc.overcharge_pct + ' persen dari perkiraan. Minta rincian per komponen dan koreksi tertulis sebelum menutup kasus.',
    };
  }
  return {
    code: 'minta_rincian',
    label: 'Minta rincian sebelum menyimpulkan',
    tone: 'signal',
    detail: 'Selisih ' + formatRupiah(calc.overcharge) + ' atau ' + calc.overcharge_pct + ' persen. Bisa jadi perbedaan tarif kategori, pajak, atau biaya program. Minta rincian tertulis terlebih dahulu.',
  };
}

function buildRecommendations(data, calc, risk, proof, verdict) {
  const recs = [];
  const state = getOrderState(data.order_state);
  const cause = getReturnCause(data.return_cause);

  if (!calc.shipped && data.actual_commission > 1) {
    recs.push('Pesanan dibatalkan sebelum dikirim, tetapi komisi ' + formatRupiah(data.actual_commission) + ' masih terpotong. Menurut aturan biaya pemrosesan, pesanan yang belum terkirim tidak seharusnya dikenakan biaya kirim. Minta koreksi komisi dan biaya pemrosesan.');
  }
  if (!calc.shipped && data.actual_processing > 1) {
    recs.push('Biaya pemrosesan ' + formatRupiah(data.actual_processing) + ' muncul padahal paket belum dikirim. Minta pengembalian penuh biaya pemrosesan.');
  }
  if (calc.shipped && data.actual_commission > calc.expected_commission + 1) {
    recs.push('Komisi aktual ' + formatRupiah(data.actual_commission) + ' lebih tinggi dari perkiraan ' + formatRupiah(calc.expected_commission) + '. Cocokkan kategori produk, tarif komisi platform, dan komisi dinamis sebelum mengajukan keberatan.');
  }
  if (data.actual_shipping > calc.expected_shipping + 1) {
    recs.push('Ongkir yang dibebankan ' + formatRupiah(data.actual_shipping) + ' melebihi perkiraan ' + formatRupiah(calc.expected_shipping) + '. Minta rincian arah pengiriman dan siapa yang menanggung tiap arah.');
  }
  if (data.buyer_shipping_paid > 0 && data.actual_shipping > 1) {
    recs.push('Pembeli sudah membayar ongkir ' + formatRupiah(data.buyer_shipping_paid) + '. Pastikan ongkir yang sama tidak dibebankan dua kali ke penjual.');
  }
  if (cause.id === 'pembeli' && calc.shipped) {
    recs.push('Retur karena kesalahan pembeli hanya boleh dibebankan sesuai kontribusi yang berlaku. Masa tenggang membuat kontribusi Rp 0. Bila sudah berakhir, batasnya hingga Rp 5.000 per arah.');
  } else if (cause.id === 'logistik') {
    recs.push('Retur karena kesalahan logistik seharusnya tidak membebani penjual. Komisi terkait produk retur dapat dikembalikan bila berlaku. Simpan bukti kerusakan dan resi.');
  } else if (cause.id === 'penjual') {
    recs.push('Retur karena kesalahan penjual memang menanggung ongkir retur. Fokuskan keberatan pada komisi atau biaya lain yang tidak sesuai, bukan pada ongkir yang sah.');
  }
  if (data.refund_to_buyer > calc.base + 1) {
    recs.push('Refund ke pembeli ' + formatRupiah(data.refund_to_buyer) + ' melebihi nilai produk setelah diskon ' + formatRupiah(calc.base) + '. Periksa apakah refund ikut menanggung ongkir atau biaya lain, lalu minta rinciannya.');
  }
  if (data.actual_other > 0) {
    recs.push('Ada biaya lain ' + formatRupiah(data.actual_other) + ' yang belum dijelaskan. Minta nama, dasar kebijakan, dan nominal per komponen.');
  }
  if (calc.estimated_settlement < 0) {
    recs.push('Perkiraan dana bersih negatif ' + formatRupiah(calc.estimated_settlement) + '. Jangan menganggap pesanan ini menghasilkan pendapatan. Simpan laporan sebelum menutup kasus.');
  }
  if (calc.monthly_leak > 0) {
    recs.push('Bila pola ini terjadi pada ' + data.orders_per_month + ' pesanan per bulan, potensi kebocoran mencapai ' + formatRupiah(calc.monthly_leak) + ' per bulan. Pakai angka ini hanya sebagai perkiraan dari input Anda.');
  }
  if (proof.missing_critical.length > 0) {
    recs.push('Lengkapi ' + proof.missing_critical.length + ' bukti kritis yang belum ada: ' + proof.missing_critical.join(', ') + '.');
  }
  if (risk.score >= 35) {
    recs.push('Minta rincian potongan per komponen, dasar kebijakan tertulis, kartu tarif kategori, dan waktu tanggap penyelesaian.');
  }
  if (state.id === 'selesai') {
    recs.push('Pesanan selesai tanpa sengketa. Tetap simpan rincian settlement untuk perbandingan bulan berikutnya.');
  }
  recs.push('Jangan mengubah harga, menghapus produk, atau menutup toko sebelum semua bukti diunduh. Perubahan status bisa menutup akses ke riwayat.');
  recs.push('Keputusan koreksi, pengembalian biaya, dan sanksi tetap berada di platform. Tool ini hanya membantu menyusun angka dan fakta.');
  return recs;
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const platform = getPlatform(data.platform);
  const state = getOrderState(data.order_state);
  const cause = getReturnCause(data.return_cause);
  const policy = getShippingPolicy(data.shipping_policy);
  const calc = computeTotals(data);
  const risk = assess(data, calc);
  const proof = readiness({ items: data.evidence });
  const verdict = decide(calc, risk, data);
  const recommendations = buildRecommendations(data, calc, risk, proof, verdict);
  const followupAge = data.followup_date ? daysBetween(data.followup_date, todayISO(now)) : null;
  const settlementAge = data.settlement_date ? daysBetween(data.settlement_date, todayISO(now)) : null;

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    platform_note: platform.note,
    order_state: state.id,
    order_state_label: state.label,
    return_cause: cause.id,
    return_cause_label: cause.label,
    return_cause_note: cause.note,
    shipping_policy: policy.id,
    shipping_policy_label: policy.label,
    shipping_policy_note: policy.note,
    order_id: data.order_id,
    product_name: data.product_name,
    store_name: data.store_name,
    store_id: data.store_id,
    order_date: data.order_date,
    order_date_label: formatDateID(data.order_date),
    settlement_date: data.settlement_date,
    settlement_date_label: data.settlement_date ? formatDateID(data.settlement_date) : '-',
    settlement_age: settlementAge,
    followup_age: followupAge,
    calculation: calc,
    risk: risk,
    verdict: verdict,
    readiness: proof,
    evidence: proof.items,
    recommendations: recommendations,
    sources: SOURCES.slice(),
    disclaimer: 'Tool ini alat bantu audit operasional, bukan nasihat hukum. Selisih dihitung dari input Anda dan tarif contoh, bukan dari data resmi platform. Potongan yang sesuai kebijakan tetap sah. Keputusan koreksi dan pengembalian biaya tetap berada pada platform.',
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };
  const orderId = cleanLine(data.order_id, 100);
  if (!orderId) return { error: 'Nomor pesanan wajib diisi' };
  const productName = cleanLine(data.product_name, 160);
  if (!productName) return { error: 'Nama produk wajib diisi' };

  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const letterType = getLetterType(data.letter_type);
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const contact = cleanLine(data.contact, 120) || '-';
  const ticket = cleanLine(data.ticket, 120) || '-';
  const chronology = cleanBlock(data.chronology) || 'Saya mencatat selisih potongan ini pada ' + formatDateID(todayISO(now)) + '.';
  const c = analyzed.calculation;
  const risk = analyzed.risk;

  let subject = '';
  if (letterType.id === 'rincian') {
    subject = 'Permintaan rincian potongan settlement - ' + storeName + ' - ' + orderId;
  } else if (letterType.id === 'keberatan') {
    subject = 'Keberatan atas potongan pesanan batal atau retur - ' + storeName + ' - ' + orderId;
  } else {
    subject = 'Permintaan eskalasi atas tiket yang ditutup - ' + storeName + ' - ' + orderId;
  }

  const lines = [];
  lines.push('Kepada Tim Layanan Penjual ' + analyzed.platform_name + ',');
  lines.push('');
  lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + (analyzed.store_id ? ' (' + analyzed.store_id + ')' : '') + ', meminta penjelasan dan pemeriksaan atas potongan pesanan ' + orderId + '.');
  lines.push('');
  lines.push('Data penjual:');
  lines.push('- Platform: ' + analyzed.platform_name);
  lines.push('- Nama toko: ' + storeName);
  lines.push('- Kontak: ' + contact);
  lines.push('- Nomor tiket sebelumnya: ' + ticket);
  lines.push('');
  lines.push('Data pesanan:');
  lines.push('- Produk: ' + productName);
  lines.push('- Tanggal pesanan: ' + analyzed.order_date_label);
  lines.push('- Tanggal settlement: ' + analyzed.settlement_date_label);
  lines.push('- Status pesanan: ' + analyzed.order_state_label);
  lines.push('- Penyebab retur: ' + analyzed.return_cause_label);
  lines.push('- Harga satuan: ' + formatRupiah(c.unit_price));
  lines.push('- Diskon per unit: ' + formatRupiah(c.discount_per_unit));
  lines.push('- Jumlah unit: ' + c.qty);
  lines.push('- Nilai produk setelah diskon: ' + formatRupiah(c.base));
  lines.push('- Refund ke pembeli: ' + formatRupiah(c.refund_to_buyer));
  lines.push('- Ongkir yang dibayar pembeli: ' + formatRupiah(c.buyer_shipping_paid));
  lines.push('');
  lines.push('Rincian yang saya catat:');
  lines.push('- Komisi platform dan komisi dinamis aktual: ' + formatRupiah(c.actual_commission));
  lines.push('- Biaya pemrosesan aktual: ' + formatRupiah(c.actual_processing));
  lines.push('- Ongkir yang dibebankan ke penjual: ' + formatRupiah(c.actual_shipping));
  lines.push('- Biaya lain: ' + formatRupiah(c.actual_other));
  lines.push('- Total potongan aktual: ' + formatRupiah(c.actual_total));
  lines.push('');
  lines.push('Perkiraan saya berdasarkan tarif dan kebijakan yang saya masukkan:');
  lines.push('- Komisi platform dan dinamis: ' + formatRupiah(c.expected_commission));
  lines.push('- Biaya pemrosesan: ' + formatRupiah(c.expected_processing));
  lines.push('- Ongkir: ' + formatRupiah(c.expected_shipping));
  lines.push('- Total perkiraan: ' + formatRupiah(c.expected_total));
  lines.push('- Selisih: ' + formatRupiah(c.overcharge) + ' (' + c.overcharge_pct + ' persen dari perkiraan)');
  lines.push('- Perkiraan dana bersih setelah refund dan potongan: ' + formatRupiah(c.estimated_settlement));
  lines.push('Angka ini adalah perkiraan dari input saya, bukan nilai resmi dari platform.');
  lines.push('');
  lines.push('Kronologi:');
  lines.push(chronology);
  lines.push('');
  lines.push('Indikasi yang saya catat:');
  if (risk.selected.length > 0) {
    risk.selected.forEach((item) => lines.push('- ' + item));
  } else {
    lines.push('- Belum ada indikasi yang saya centang. Saya tetap meminta rincian potongan.');
  }
  lines.push('');
  lines.push('Bukti yang sudah saya simpan:');
  const available = analyzed.evidence.filter((item) => item.checked);
  if (available.length > 0) {
    available.forEach((item) => lines.push('- ' + item.label));
  } else {
    lines.push('- Belum ada bukti yang saya masukkan. Saya bersedia melengkapi sesuai permintaan.');
  }
  lines.push('');
  lines.push('Yang saya minta:');

  if (letterType.id === 'rincian') {
    lines.push('1. Rincian potongan per komponen untuk pesanan ' + orderId + ': komisi platform, komisi dinamis, biaya pemrosesan, ongkir, dan biaya lain.');
    lines.push('2. Dasar kebijakan tertulis dan kartu tarif kategori yang dipakai untuk setiap komponen.');
    lines.push('3. Penjelasan mengapa ongkir dibebankan sebesar ' + formatRupiah(c.actual_shipping) + ' dan siapa yang menanggung tiap arah pengiriman.');
    lines.push('4. Konfirmasi apakah refund ke pembeli memengaruhi komisi dan biaya pemrosesan.');
    lines.push('5. Nomor tiket dan waktu tanggap atau SLA penyelesaian.');
  } else if (letterType.id === 'keberatan') {
    lines.push('1. Koreksi potongan sebesar selisih ' + formatRupiah(c.overcharge) + ' bila terbukti tidak sesuai kebijakan.');
    lines.push('2. Pengembalian biaya pemrosesan dan komisi yang masih dipotong untuk pesanan yang dibatalkan sebelum dikirim.');
    lines.push('3. Penjelasan tertulis bila potongan dianggap sah, lengkap dengan pasal atau kartu tarif yang berlaku.');
    lines.push('4. Koreksi ongkir bila pembeli sudah membayar ongkir yang sama atau bila terjadi pembebanan dua kali.');
    lines.push('5. Nomor tiket dan waktu tanggap atau SLA penyelesaian.');
  } else {
    lines.push('1. Buka kembali tiket yang ditutup dan tinjau ulang potongan pesanan ' + orderId + '.');
    lines.push('2. Eskalasi ke tim yang berwenang memberi koreksi biaya dan pengembalian dana.');
    lines.push('3. Berikan ringkasan tertulis hasil peninjauan, termasuk komponen yang dikoreksi dan yang ditolak.');
    lines.push('4. Konfirmasi waktu pengembalian dana ke saldo penjual.');
    lines.push('5. Berikan nomor tiket baru dan waktu tanggap atau SLA penyelesaian.');
  }

  lines.push('');
  lines.push('Catatan kebijakan yang saya pahami:');
  lines.push('- Biaya pemrosesan order Rp 1.250 hanya berlaku untuk pesanan yang berhasil dikirim. Bila seluruh pesanan dibatalkan sebelum dikirim, biaya dikembalikan penuh.');
  lines.push('- Komisi dinamis tidak dikembalikan bila pesanan sudah dikirim lalu diretur atau direfund.');
  lines.push('- Retur karena kesalahan logistik tidak membebani penjual. Komisi terkait produk retur dapat dikembalikan bila berlaku.');
  lines.push('- Retur karena kesalahan pembeli mengikuti kontribusi ongkir yang berlaku, dengan masa tenggang sampai pemberitahuan lebih lanjut.');
  lines.push('');
  lines.push('Saya bersedia mengirim data tambahan yang diperlukan. Mohon jawaban tertulis agar dapat saya simpan sebagai bukti.');
  lines.push('');
  lines.push('Hormat saya,');
  lines.push(sellerName);
  lines.push(contact);
  lines.push(formatDateID(todayISO(now)));

  return {
    subject: subject,
    body: lines.join('\n'),
    letter_type: letterType.id,
    calculation: c,
    risk: risk,
    readiness: analyzed.readiness,
  };
}

function validateCase(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  if (!data.order_id) return { error: 'Nomor pesanan wajib diisi untuk menyimpan kasus' };

  const calc = computeTotals(data);
  return {
    item: {
      platform: data.platform,
      order_state: data.order_state,
      return_cause: data.return_cause,
      shipping_policy: data.shipping_policy,
      order_id: data.order_id,
      product_name: data.product_name,
      store_name: data.store_name,
      store_id: data.store_id,
      seller_name: data.seller_name,
      contact: data.contact,
      ticket: data.ticket,
      order_date: data.order_date,
      settlement_date: data.settlement_date,
      followup_date: data.followup_date,
      unit_price: data.unit_price,
      discount_per_unit: data.discount_per_unit,
      qty: data.qty,
      platform_rate: data.platform_rate,
      dynamic_rate: data.dynamic_rate,
      shipping_per_direction: data.shipping_per_direction,
      shipping_directions: data.shipping_directions,
      buyer_shipping_paid: data.buyer_shipping_paid,
      refund_to_buyer: data.refund_to_buyer,
      actual_commission: data.actual_commission,
      actual_processing: data.actual_processing,
      actual_shipping: data.actual_shipping,
      actual_other: data.actual_other,
      orders_per_month: data.orders_per_month,
      chronology: data.chronology,
      note: data.note,
      status: data.status,
      letter_type: data.letter_type,
      manual_signals: data.manual_signals,
      evidence: data.evidence,
      expected_total: calc.expected_total,
      actual_total: calc.actual_total,
      overcharge: calc.overcharge,
      overcharge_pct: calc.overcharge_pct,
      estimated_settlement: calc.estimated_settlement,
      monthly_leak: calc.monthly_leak,
    },
  };
}

function summary(cases, now = new Date()) {
  const list = Array.isArray(cases) ? cases : [];
  const today = todayISO(now);
  let totalOvercharge = 0;
  let openOvercharge = 0;
  let openCases = 0;
  let oldestOpenDays = 0;
  const byStatus = {};

  list.forEach((item) => {
    const overcharge = Math.max(0, num(item.overcharge));
    totalOvercharge += overcharge;
    const status = getCaseStatus(item.status);
    byStatus[status.id] = (byStatus[status.id] || 0) + 1;
    if (status.open) {
      openCases += 1;
      openOvercharge += overcharge;
      const age = daysBetween(item.order_date, today);
      if (age !== null && age > oldestOpenDays) oldestOpenDays = age;
    }
  });

  const warnings = [];
  list.forEach((item) => {
    const status = getCaseStatus(item.status);
    if (!status.open) return;
    if (num(item.overcharge) > 0 && (status.id === 'baru' || status.id === 'menunggu_rincian')) {
      warnings.push('Pesanan ' + (item.order_id || '-') + ' memiliki selisih ' + formatRupiah(item.overcharge) + ' dan belum diajukan.');
    }
    if (item.followup_date) {
      const age = daysBetween(item.followup_date, today);
      if (age !== null && age > 7) {
        warnings.push('Pesanan ' + (item.order_id || '-') + ' belum di-follow-up selama ' + age + ' hari.');
      }
    }
  });

  return {
    total_cases: list.length,
    open_cases: openCases,
    total_overcharge: Math.round(totalOvercharge),
    open_overcharge: Math.round(openOvercharge),
    oldest_open_days: oldestOpenDays,
    by_status: CASE_STATUSES.map((item) => ({ id: item.id, label: item.label, count: byStatus[item.id] || 0 })),
    warnings: warnings,
    cases: list.map((item) => Object.assign({}, item, {
      status_label: getCaseStatus(item.status).label,
      order_state_label: getOrderState(item.order_state).label,
      overcharge_label: formatRupiah(item.overcharge),
      age_days: daysBetween(item.order_date, today),
    })),
  };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  return {
    platform: 'tiktok',
    order_state: 'batal_setelah_kirim',
    return_cause: 'pembeli',
    shipping_policy: 'grace',
    order_id: '586224247341024870',
    product_name: 'Masker Kain Premium',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-2026',
    order_date: addDays(today, -14),
    settlement_date: addDays(today, -3),
    followup_date: addDays(today, -1),
    unit_price: 150000,
    discount_per_unit: 0,
    qty: 2,
    platform_rate: 8,
    dynamic_rate: 4,
    shipping_per_direction: 12000,
    shipping_directions: 1,
    buyer_shipping_paid: 12000,
    refund_to_buyer: 300000,
    actual_commission: 36000,
    actual_processing: 1250,
    actual_shipping: 24000,
    actual_other: 0,
    orders_per_month: 12,
    chronology: 'Pembeli membatalkan pesanan setelah paket dikirim. Dana sudah direfund penuh. Di laporan settlement, komisi dan biaya pemrosesan masih dipotong, lalu ongkir 12.000 dibebankan lagi ke penjual padahal pembeli sudah membayarnya.',
    note: 'Contoh ilustrasi. Nomor pesanan, produk, dan nominal adalah contoh, bukan data nyata.',
    status: 'menunggu_rincian',
    letter_type: 'keberatan',
    manual_signals: ['rincian_tidak_diminta', 'cs_hanya_template'],
    evidence: ['settlement_detail', 'order_detail', 'refund_proof', 'rate_card', 'chat_history', 'ticket_number', 'buyer_shipping_paid', 'timeline'],
  };
}

function meta() {
  return {
    platforms: PLATFORMS.map((item) => Object.assign({}, item)),
    order_states: ORDER_STATES.map((item) => Object.assign({}, item)),
    return_causes: RETURN_CAUSES.map((item) => Object.assign({}, item)),
    shipping_policies: SHIPPING_POLICIES.map((item) => Object.assign({}, item)),
    auto_signals: AUTO_SIGNALS.map((item) => Object.assign({}, item)),
    manual_signals: MANUAL_SIGNALS.map((item) => Object.assign({}, item)),
    evidence: EVIDENCE.map((item) => Object.assign({}, item)),
    case_statuses: CASE_STATUSES.map((item) => Object.assign({}, item)),
    letter_types: LETTER_TYPES.map((item) => Object.assign({}, item)),
    defaults: Object.assign({}, DEFAULTS),
    policy: {
      processing_fee: PROCESSING_FEE,
      dynamic_cap: DYNAMIC_CAP,
      buyer_return_contribution: BUYER_RETURN_CONTRIBUTION,
      platform_rate_range: [2.5, 12.2],
      dynamic_rate_range: [3, 8],
      note: 'Tarif dan batas di atas berasal dari kartu tarif TikTok Shop by Tokopedia dan pengumuman biaya yang dikutip di sumber. Angka per kategori bisa berubah. Semua nilai bisa diedit dan ditandai estimasi.',
    },
    sources: SOURCES.map((item) => Object.assign({}, item)),
  };
}

module.exports = {
  PLATFORMS,
  ORDER_STATES,
  RETURN_CAUSES,
  SHIPPING_POLICIES,
  AUTO_SIGNALS,
  MANUAL_SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  DEFAULTS,
  PROCESSING_FEE,
  DYNAMIC_CAP,
  BUYER_RETURN_CONTRIBUTION,
  analyze,
  computeTotals,
  detectSignals,
  assess,
  readiness,
  validateBase,
  validateCase,
  summary,
  buildLetter,
  buildExample,
  meta,
  formatRupiah,
  formatDateID,
  todayISO,
  parseISO,
  addDays,
  daysBetween,
  round1,
  round2,
};
