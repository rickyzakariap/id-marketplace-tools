'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    label: 'Shopee',
    note: 'Batas pembayaran, aturan pembatalan, dan klaim perlindungan COD di tool ini diground dari Pusat Edukasi Penjual Shopee. Tetap cocokkan dengan halaman bantuan yang berlaku saat Anda membaca.',
  },
  {
    id: 'lainnya',
    label: 'Marketplace lain',
    note: 'Batas pembayaran, pembatalan, dan klaim di tool ini berasal dari Shopee. Untuk platform lain, ganti angka dan istilah sesuai kebijakan platform. Jangan memakai batas Shopee sebagai patokan.',
  },
];

const COD_METHODS = [
  {
    id: 'reguler',
    label: 'Reguler atau Hemat Kargo',
    max_payment: 5000000,
    claim_basis: '10 kali ongkos kirim atau harga barang, maksimal Rp 1.000.000, mengikuti nominal terendah',
    note: 'Batas total pembayaran Rp 5.000.000 per pesanan untuk layanan Reguler dan Hemat Kargo, kecuali Pos Reguler.',
  },
  {
    id: 'instant',
    label: 'Instant atau Instant Prioritas',
    max_payment: 500000,
    claim_basis: 'harga barang maksimal Rp 10.000.000',
    note: 'Batas total pembayaran Rp 500.000 per pesanan untuk layanan Instant.',
  },
  {
    id: 'pos_reguler',
    label: 'Pos Reguler',
    max_payment: 1000000,
    claim_basis: '10 kali ongkos kirim atau harga barang, maksimal Rp 1.000.000, mengikuti nominal terendah',
    note: 'Batas total pembayaran Rp 1.000.000 per pesanan untuk jasa kirim Pos Reguler.',
  },
];

const ORDER_STATUSES = [
  { id: 'belum_dikirim', label: 'Belum diatur pengirimannya', open: true },
  { id: 'sudah_dikirim', label: 'Sudah diatur, belum diserahkan ke kurir', open: true },
  { id: 'dalam_pengiriman', label: 'Sudah diserahkan atau dalam pengiriman', open: true },
  { id: 'retur', label: 'Sedang retur ke penjual', open: true },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
  { id: 'selesai', label: 'Selesai', open: false },
];

const BUYER_STATUSES = [
  { id: 'belum_dihubungi', label: 'Belum dihubungi', weight: 0 },
  { id: 'responsif', label: 'Responsif', weight: 0 },
  { id: 'lambat', label: 'Lambat membalas', weight: 6 },
  { id: 'tidak_merespons', label: 'Tidak merespons chat', weight: 15 },
  { id: 'menolak', label: 'Menolak atau tidak mau membayar', weight: 15 },
];

const SIGNALS = [
  { id: 'cancel_withdrawn', label: 'Pembeli mengajukan pembatalan lalu menariknya kembali', weight: 16, group: 'Pembatalan' },
  { id: 'buyer_no_response', label: 'Pembeli tidak merespons chat konfirmasi alamat', weight: 15, group: 'Komunikasi' },
  { id: 'address_change', label: 'Pembeli meminta perubahan alamat setelah checkout', weight: 10, group: 'Alamat' },
  { id: 'incomplete_address', label: 'Alamat tidak lengkap atau sulit diverifikasi', weight: 10, group: 'Alamat' },
  { id: 'new_account', label: 'Akun pembeli terlihat baru atau tanpa riwayat', weight: 8, group: 'Akun' },
  { id: 'no_order_history', label: 'Tidak ada riwayat pesanan atau ulasan yang bisa dilihat', weight: 8, group: 'Akun' },
  { id: 'previous_cancel', label: 'Pembeli pernah membatalkan pesanan COD di toko Anda', weight: 8, group: 'Pembatalan' },
  { id: 'duplicate_order', label: 'Ada beberapa pesanan serupa dari akun atau alamat yang sama', weight: 6, group: 'Pola' },
  { id: 'high_value', label: 'Nilai pesanan tinggi dibanding rata-rata toko', weight: 6, group: 'Nilai' },
  { id: 'fragile_product', label: 'Produk mudah rusak, besar, atau sulit dikemas ulang', weight: 6, group: 'Produk' },
  { id: 'outside_area', label: 'Alamat di luar area pengiriman biasa toko', weight: 4, group: 'Alamat' },
  { id: 'promo_price', label: 'Pesanan memakai harga promo atau voucher besar', weight: 3, group: 'Nilai' },
];

const EVIDENCE = [
  { id: 'order_screenshot', label: 'Tangkapan layar detail pesanan dan status pembayaran COD', critical: true, group: 'Pesanan' },
  { id: 'chat_history', label: 'Riwayat chat dengan pembeli, termasuk pesan yang tidak dibalas', critical: true, group: 'Komunikasi' },
  { id: 'cancel_request', label: 'Bukti pengajuan pembatalan dari pembeli', critical: true, group: 'Pembatalan' },
  { id: 'cs_ticket', label: 'Nomor tiket dan tanggapan Customer Service', critical: true, group: 'Komunikasi' },
  { id: 'packaging_video', label: 'Video pengemasan paket sebelum diserahkan ke kurir', critical: true, group: 'Pengiriman' },
  { id: 'cancel_withdrawal', label: 'Bukti pembeli menarik kembali pengajuan pembatalan', critical: false, group: 'Pembatalan' },
  { id: 'address_change', label: 'Bukti permintaan perubahan alamat', critical: false, group: 'Alamat' },
  { id: 'buyer_profile', label: 'Tangkapan layar profil pembeli dan riwayat pesanan', critical: false, group: 'Akun' },
  { id: 'shipping_deadline', label: 'Tangkapan layar batas waktu pengiriman di Seller Centre', critical: false, group: 'Pengiriman' },
  { id: 'courier_handover', label: 'Bukti serah terima paket ke kurir atau resi', critical: false, group: 'Pengiriman' },
  { id: 'return_unboxing', label: 'Video unboxing paket retur dari semua sisi sebelum dibuka', critical: false, group: 'Retur' },
  { id: 'claim_form', label: 'Formulir atau nomor pengajuan klaim perlindungan COD', critical: false, group: 'Klaim' },
  { id: 'timeline', label: 'Kronologi tanggal pesanan, chat, pembatalan, dan follow-up', critical: false, group: 'Komunikasi' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru ditemukan', open: true },
  { id: 'menunggu_cs', label: 'Menunggu jawaban CS', open: true },
  { id: 'diajukan_pembatalan', label: 'Pembatalan diajukan', open: true },
  { id: 'dikirim', label: 'Sudah dikirim', open: true },
  { id: 'retur', label: 'Dalam retur', open: true },
  { id: 'klaim', label: 'Klaim diajukan', open: true },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'ditolak', label: 'Ditolak platform', open: true },
];

const PROBLEMS = [
  { id: 'pembeli_fiktif', label: 'Pesanan diduga dari pembeli fiktif atau tidak bertanggung jawab' },
  { id: 'pembatalan_ditolak', label: 'Pembatalan tidak diproses atau ditolak' },
  { id: 'penalti_terlambat', label: 'Terancam penalti karena menahan pengiriman' },
  { id: 'retur_rusak', label: 'Barang retur diterima rusak atau tidak lengkap' },
  { id: 'klaim_tidak_dibayar', label: 'Klaim perlindungan COD belum dibayar' },
];

const LETTER_TYPES = [
  { id: 'pembatalan', label: 'Permintaan pembatalan tanpa penalti' },
  { id: 'peninjauan_pembeli', label: 'Permintaan peninjauan pembeli COD' },
  { id: 'klaim_retur', label: 'Permintaan klaim retur rusak' },
];

const SOURCES = [
  {
    title: 'CS Shopee Seperti "Menyandera" Penjual: Dipaksa Kirim ke Pembeli COD Fiktif atau Kena Double Penalty',
    publisher: 'Media Konsumen',
    date: '2026-10-31',
    url: 'https://mediakonsumen.com/2026/10/31/surat-pembaca/cs-shopee-seperti-menyandera-penjual-dipaksa-kirim-ke-pembeli-cod-fiktif-atau-kena-double-penalty',
    note: 'Kasus toko Golto Accessories. Pesanan COD 26 Oktober 2026 dari akun yang tidak merespons chat. Pembeli sempat mengajukan pembatalan lalu menariknya. Penjual khawatir terkena penalti ganda bila menunggu respons CS. Ini pengaduan penjual, bukan putusan platform.',
  },
  {
    title: 'FAQ COD (Bayar di Tempat)',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026-09-03',
    url: 'https://seller.shopee.co.id/edu/article/15310',
    note: 'Batas pembayaran COD: Rp 500.000 untuk Instant, Rp 5.000.000 untuk Reguler dan Hemat Kargo, dan Rp 1.000.000 untuk Pos Reguler. Pembeli yang tidak dapat dihubungi, menolak, atau tidak membayar dan membatalkan 2 kali dalam 60 hari kalender dapat dinonaktifkan dari COD selama 60 hari. Penjual diberi 7 hari kalender untuk mengonfirmasi keadaan barang retur.',
  },
  {
    title: 'Perlindungan Penjual terhadap Pembeli COD (Bayar di Tempat)',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026-07-24',
    url: 'https://seller.shopee.co.id/edu/article/15308',
    note: 'Halaman perlindungan penjual untuk pembeli COD. Menjelaskan mekanisme klaim dan penanganan pembeli yang bermasalah. Cocokkan syarat terbaru di halaman ini sebelum mengajukan klaim.',
  },
  {
    title: 'Mengelola Pengiriman yang Gagal',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026-10-29',
    url: 'https://seller.shopee.co.id/edu/article/14716/Mengelola-Pengiriman-yang-Gagal',
    note: 'Pengiriman gagal terjadi bila pembeli menolak paket COD, alamat salah, atau ada kendala pengiriman. Paket dikembalikan ke penjual.',
  },
  {
    title: 'Tentang Pembatalan Pesanan',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: '2026-07-27',
    url: 'https://seller.shopee.co.id/edu/article/12622/Tentang-Pembatalan-Pesanan',
    note: 'Pembeli dapat mengajukan pembatalan setelah pembayaran terverifikasi dengan alasan ingin mengubah alamat, penjual tidak membalas chat, ingin mengubah rincian, atau berubah pikiran. Pembatalan non-instan memerlukan respons penjual dalam 1x24 jam. Jika tidak direspons, pesanan dibatalkan otomatis.',
  },
  {
    title: 'Tentang COD Cek Dulu',
    publisher: 'Pusat Edukasi Penjual Shopee',
    date: 'diakses 2026-11-02',
    url: 'https://seller.shopee.co.id/edu/article/16175',
    note: 'Pembeli yang tidak dapat dihubungi, tidak membayar, atau menolak paket sampai 3 kali dalam 30 hari kalender dapat diblokir dari COD Cek Dulu dan COD selama 60 hari. Klaim barang hilang atau rusak memakai 10 kali ongkos kirim atau harga barang, maksimal Rp 1.000.000, mengikuti nominal terendah.',
  },
];

const DEFAULTS = {
  platform: 'shopee',
  cod_method: 'reguler',
  order_status: 'belum_dikirim',
  buyer_status: 'belum_dihubungi',
  problem: 'pembeli_fiktif',
  status: 'baru',
  letter_type: 'pembatalan',
  fee_rate: 0,
  order_value: 0,
  hpp: 0,
  packaging_cost: 0,
  handling_cost: 0,
  extra_cost: 0,
  shipping_cost: 0,
};

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function whole(value) {
  return Math.max(0, Math.floor(num(value)));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
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

function getMethod(id) {
  return COD_METHODS.find((item) => item.id === id) || COD_METHODS[0];
}

function getOrderStatus(id) {
  return ORDER_STATUSES.find((item) => item.id === id) || ORDER_STATUSES[0];
}

function getBuyerStatus(id) {
  return BUYER_STATUSES.find((item) => item.id === id) || BUYER_STATUSES[0];
}

function getCaseStatus(id) {
  return CASE_STATUSES.find((item) => item.id === id) || CASE_STATUSES[0];
}

function getProblem(id) {
  return PROBLEMS.find((item) => item.id === id) || PROBLEMS[0];
}

function getLetterType(id) {
  return LETTER_TYPES.find((item) => item.id === id) || LETTER_TYPES[0];
}

function getSignal(id) {
  return SIGNALS.find((item) => item.id === id);
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id);
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function normalizeSignals(input) {
  const source = Array.isArray(input) ? input : [];
  return Array.from(new Set(source.map((id) => String(id)).filter((id) => getSignal(id))));
}

function normalizeEvidence(input) {
  const source = Array.isArray(input) ? input : [];
  return Array.from(new Set(source.map((id) => String(id)).filter((id) => getEvidence(id))));
}

function validateBase(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const method = getMethod(data.cod_method);
  const orderStatus = getOrderStatus(data.order_status);
  const buyerStatus = getBuyerStatus(data.buyer_status);

  const orderDate = parseISO(data.order_date);
  if (!orderDate) return { error: 'Tanggal pesanan wajib diisi dengan format YYYY-MM-DD' };
  if (orderDate > todayISO(now)) return { error: 'Tanggal pesanan tidak boleh melewati hari ini' };

  const shipDeadline = parseISO(data.ship_deadline);
  if (!shipDeadline) return { error: 'Batas waktu pengiriman wajib diisi dengan format YYYY-MM-DD' };
  if (daysBetween(orderDate, shipDeadline) < 0) return { error: 'Batas waktu pengiriman tidak boleh sebelum tanggal pesanan' };

  const orderValue = num(data.order_value);
  const hpp = num(data.hpp);
  const packaging = num(data.packaging_cost);
  const handling = num(data.handling_cost);
  const extra = num(data.extra_cost);
  const shipping = num(data.shipping_cost);
  const feeRate = num(data.fee_rate);

  if (orderValue <= 0) return { error: 'Nilai pesanan COD harus lebih dari 0' };
  if (hpp < 0) return { error: 'HPP tidak boleh negatif' };
  if (packaging < 0 || handling < 0 || extra < 0) return { error: 'Biaya kemasan, penanganan, dan biaya lain tidak boleh negatif' };
  if (shipping < 0) return { error: 'Ongkos kirim tidak boleh negatif' };
  if (feeRate < 0 || feeRate >= 100) return { error: 'Biaya layanan harus 0 sampai kurang dari 100 persen' };

  const cancelRequested = parseISO(data.cancel_requested_date);
  if (String(data.cancel_requested_date || '').trim() && !cancelRequested) return { error: 'Tanggal pengajuan pembatalan tidak valid' };
  if (cancelRequested && cancelRequested > todayISO(now)) return { error: 'Tanggal pengajuan pembatalan tidak boleh melewati hari ini' };
  if (cancelRequested && daysBetween(orderDate, cancelRequested) < 0) return { error: 'Tanggal pembatalan tidak boleh sebelum tanggal pesanan' };

  const returnReceived = parseISO(data.return_received_date);
  if (String(data.return_received_date || '').trim() && !returnReceived) return { error: 'Tanggal retur diterima tidak valid' };
  if (returnReceived && returnReceived > todayISO(now)) return { error: 'Tanggal retur diterima tidak boleh melewati hari ini' };
  if (returnReceived && daysBetween(orderDate, returnReceived) < 0) return { error: 'Tanggal retur diterima tidak boleh sebelum tanggal pesanan' };

  const followup = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followup) return { error: 'Tanggal follow-up tidak valid' };
  if (followup && followup > todayISO(now)) return { error: 'Tanggal follow-up tidak boleh melewati hari ini' };

  return {
    data: {
      platform: platform.id,
      cod_method: method.id,
      order_status: orderStatus.id,
      buyer_status: buyerStatus.id,
      order_id: cleanLine(data.order_id, 100),
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      product_name: cleanLine(data.product_name, 160),
      seller_name: cleanLine(data.seller_name, 120),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      order_date: orderDate,
      ship_deadline: shipDeadline,
      cancel_requested_date: cancelRequested || '',
      return_received_date: returnReceived || '',
      followup_date: followup || '',
      order_value: round2(orderValue),
      hpp: round2(hpp),
      packaging_cost: round2(packaging),
      handling_cost: round2(handling),
      extra_cost: round2(extra),
      shipping_cost: round2(shipping),
      fee_rate: round2(feeRate),
      chronology: cleanBlock(data.chronology),
      note: cleanBlock(data.note),
      problem: getProblem(data.problem).id,
      letter_type: getLetterType(data.letter_type).id,
      signals: normalizeSignals(data.signals || data.facts),
      evidence: normalizeEvidence(data.evidence || data.items),
    },
  };
}

function computeTimeline(data, now = new Date()) {
  const today = todayISO(now);
  const daysToShip = daysBetween(today, data.ship_deadline);
  const status = getOrderStatus(data.order_status);
  const followupAge = data.followup_date ? daysBetween(data.followup_date, today) : null;

  let shipPhase = 'sebelum';
  let shipLabel = 'Masih ada waktu';
  let action = 'Siapkan keputusan sebelum batas waktu pengiriman. Simpan chat dan tangkapan layar pesanan.';
  let tone = 'signal';
  if (status.id === 'belum_dikirim') {
    if (daysToShip > 1) {
      shipPhase = 'sebelum';
      shipLabel = 'Masih ada waktu';
      action = 'Hubungi pembeli hari ini, simpan bukti chat, lalu putuskan sebelum batas waktu pengiriman.';
      tone = 'signal';
    } else if (daysToShip === 1 || daysToShip === 0) {
      shipPhase = 'mendesak';
      shipLabel = daysToShip === 0 ? 'Batas waktu hari ini' : 'Batas waktu besok';
      action = 'Waktu hampir habis. Hubungi CS sekarang dan minta keputusan tertulis sebelum mengirim atau membatalkan.';
      tone = 'ember';
    } else {
      shipPhase = 'lewat';
      shipLabel = 'Batas waktu sudah lewat';
      action = 'Batas waktu pengiriman sudah lewat. Hubungi CS hari ini, minta pembatalan tanpa penalti, dan simpan semua bukti.';
      tone = 'ember';
    }
  } else if (status.id === 'sudah_dikirim') {
    shipPhase = 'diatur';
    shipLabel = 'Sudah diatur, belum diserahkan';
    action = 'Paket sudah diatur pengirimannya. Jangan menerima pembatalan setelah paket diserahkan ke kurir. Arahkan pembeli ke mekanisme retur.';
    tone = 'signal';
  } else if (status.id === 'dalam_pengiriman') {
    shipPhase = 'dikirim';
    shipLabel = 'Dalam pengiriman';
    action = 'Paket sudah dalam perjalanan. Siapkan bukti pengemasan dan pantau status pengiriman sampai selesai atau retur.';
    tone = 'signal';
  } else if (status.id === 'retur') {
    shipPhase = 'retur';
    shipLabel = 'Retur dalam proses';
    action = 'Rekam video unboxing dari semua sisi sebelum membuka paket retur. Ajukan klaim bila barang rusak atau tidak lengkap.';
    tone = 'ember';
  } else if (status.id === 'dibatalkan') {
    shipPhase = 'batal';
    shipLabel = 'Pesanan dibatalkan';
    action = 'Catat alasan pembatalan, cek saldo dan poin penalti, lalu simpan bukti bila pembatalan terjadi di luar kendali Anda.';
    tone = 'ok';
  } else {
    shipPhase = 'selesai';
    shipLabel = 'Pesanan selesai';
    action = 'Pesanan selesai. Simpan bukti untuk keperluan klaim atau sengketa berikutnya.';
    tone = 'ok';
  }

  let cancel = null;
  if (data.cancel_requested_date) {
    const deadline = addDays(data.cancel_requested_date, 1);
    const daysLeft = daysBetween(today, deadline);
    let phase = 'menunggu';
    let label = 'Masih dalam batas respons';
    let cancelAction = 'Respons pengajuan pembatalan paling lambat ' + formatDateID(deadline) + ' (1x24 jam). Jangan biarkan tanpa jawaban.';
    let cancelTone = 'signal';
    if (daysLeft < 0) {
      phase = 'lewat';
      label = 'Batas respons pembatalan lewat';
      cancelAction = 'Batas respons 1x24 jam sudah lewat. Hubungi CS sekarang, minta pembatalan tanpa penalti, dan simpan bukti chat.';
      cancelTone = 'ember';
    } else if (daysLeft <= 0) {
      phase = 'mendesak';
      label = 'Batas respons hari ini';
      cancelAction = 'Batas respons pembatalan hari ini. Jawab atau eskalasi ke CS sekarang.';
      cancelTone = 'ember';
    }
    cancel = {
      requested: data.cancel_requested_date,
      requested_label: formatDateID(data.cancel_requested_date),
      deadline: deadline,
      deadline_label: formatDateID(deadline),
      days_left: daysLeft,
      phase: phase,
      label: label,
      action: cancelAction,
      tone: cancelTone,
    };
  }

  let claim = null;
  if (data.return_received_date) {
    const deadline = addDays(data.return_received_date, 7);
    const daysLeft = daysBetween(today, deadline);
    let phase = 'menunggu';
    let label = 'Masih dalam 7 hari konfirmasi';
    let claimAction = 'Konfirmasi keadaan barang dan ajukan klaim paling lambat ' + formatDateID(deadline) + '.';
    let claimTone = 'signal';
    if (daysLeft < 0) {
      phase = 'lewat';
      label = 'Batas konfirmasi retur lewat';
      claimAction = 'Batas 7 hari konfirmasi retur sudah lewat. Tetap ajukan klaim dengan bukti video dan nomor pesanan.';
      claimTone = 'ember';
    } else if (daysLeft <= 1) {
      phase = 'mendesak';
      label = 'Batas konfirmasi retur hampir habis';
      claimAction = 'Batas konfirmasi retur tinggal ' + Math.max(0, daysLeft) + ' hari. Rekam video dan ajukan klaim sekarang.';
      claimTone = 'ember';
    }
    claim = {
      received: data.return_received_date,
      received_label: formatDateID(data.return_received_date),
      deadline: deadline,
      deadline_label: formatDateID(deadline),
      days_left: daysLeft,
      phase: phase,
      label: label,
      action: claimAction,
      tone: claimTone,
    };
  }

  return {
    today: today,
    order_date: data.order_date,
    order_date_label: formatDateID(data.order_date),
    ship_deadline: data.ship_deadline,
    ship_deadline_label: formatDateID(data.ship_deadline),
    days_to_ship: daysToShip,
    ship_phase: shipPhase,
    ship_label: shipLabel,
    action: action,
    tone: tone,
    followup_age: followupAge,
    cancel: cancel,
    claim: claim,
  };
}

function computeExposure(data) {
  const method = getMethod(data.cod_method);
  const feeRate = num(data.fee_rate);
  const fee = feeRate / 100;
  const orderValue = num(data.order_value);
  const hpp = num(data.hpp);
  const packaging = num(data.packaging_cost);
  const handling = num(data.handling_cost);
  const extra = num(data.extra_cost);
  const shipping = num(data.shipping_cost);

  const feeAmount = orderValue * fee;
  const successNet = orderValue - feeAmount - hpp - packaging - handling - extra;
  const marginPct = orderValue > 0 ? round1((successNet / orderValue) * 100) : 0;

  const cancelLoss = 0;
  const returnGoodLoss = packaging + handling + extra;
  const returnDamagedGross = hpp + packaging + handling + extra;
  let maxClaim = 0;
  if (method.id === 'instant') {
    maxClaim = Math.min(orderValue, 10000000);
  } else {
    maxClaim = Math.min(orderValue, shipping * 10, 1000000);
  }
  const returnDamagedNet = Math.max(0, returnDamagedGross - maxClaim);
  const worstCase = Math.max(returnGoodLoss, returnDamagedNet);
  const overLimit = orderValue > method.max_payment;

  return {
    order_value: Math.round(orderValue),
    hpp: Math.round(hpp),
    packaging_cost: Math.round(packaging),
    handling_cost: Math.round(handling),
    extra_cost: Math.round(extra),
    shipping_cost: Math.round(shipping),
    fee_rate: round2(feeRate),
    fee_amount: Math.round(feeAmount),
    success_net: Math.round(successNet),
    margin_pct: marginPct,
    cancel_loss: Math.round(cancelLoss),
    return_good_loss: Math.round(returnGoodLoss),
    return_damaged_gross: Math.round(returnDamagedGross),
    max_claim: Math.round(maxClaim),
    return_damaged_net: Math.round(returnDamagedNet),
    worst_case: Math.round(worstCase),
    max_payment: method.max_payment,
    over_limit: overLimit,
    claim_basis: method.claim_basis,
    note: 'Semua nominal berasal dari input Anda. Ongkos kirim dipakai sebagai dasar batas klaim, bukan otomatis dihitung sebagai kerugian. Biaya layanan default 0 karena potongan berbeda per toko dan per program.',
  };
}

function assessRisk(selected, buyerStatus) {
  const ids = normalizeSignals(selected);
  const available = SIGNALS.filter((item) => ids.indexOf(item.id) !== -1);
  let score = 0;
  available.forEach((item) => { score += item.weight; });
  const buyer = getBuyerStatus(buyerStatus);
  if (buyer.weight > 0 && ids.indexOf('buyer_no_response') === -1) {
    score += buyer.weight;
  }
  score = Math.min(100, score);

  let level = 'rendah';
  let label = 'Risiko rendah';
  let tone = 'ok';
  if (score >= 65) {
    level = 'sangat_tinggi';
    label = 'Risiko sangat tinggi';
    tone = 'ember';
  } else if (score >= 40) {
    level = 'tinggi';
    label = 'Risiko tinggi';
    tone = 'ember';
  } else if (score >= 20) {
    level = 'sedang';
    label = 'Risiko sedang';
    tone = 'signal';
  }

  return {
    score: score,
    level: level,
    label: label,
    tone: tone,
    count: available.length,
    total: SIGNALS.length,
    selected: available.map((item) => item.label),
    buyer_status: buyer.id,
    buyer_status_label: buyer.label,
    note: 'Skor ini heuristik dari fakta yang Anda centang dan status pembeli. Bukan bukti bahwa pembeli fiktif, dan bukan putusan platform.',
  };
}

function readiness(input) {
  const selected = normalizeEvidence(input && (input.items || input.evidence));
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

function decide(data, timeline, exposure, risk) {
  const status = getOrderStatus(data.order_status);
  if (status.id === 'belum_dikirim') {
    if (timeline.cancel && timeline.cancel.phase === 'lewat') {
      return {
        code: 'batas_lewat',
        label: 'Batas respons pembatalan sudah lewat',
        tone: 'ember',
        detail: 'Pengajuan pembatalan sudah melewati 1x24 jam. Hubungi CS sekarang dan minta pembatalan tanpa penalti sebelum mengirim paket.',
      };
    }
    if (exposure.over_limit) {
      return {
        code: 'batas_cod',
        label: 'Nilai pesanan melebihi batas COD',
        tone: 'ember',
        detail: 'Nilai pesanan ' + formatRupiah(exposure.order_value) + ' melebihi batas ' + formatRupiah(exposure.max_payment) + ' untuk metode ini. Cek status pembayaran dan kebijakan platform sebelum mengirim.',
      };
    }
    if (risk.score >= 40) {
      return {
        code: 'tahan',
        label: 'Tahan dulu, minta keputusan tertulis',
        tone: 'ember',
        detail: 'Risiko ' + risk.score + '/100. Kerugian retur rusak setelah klaim diperkirakan ' + formatRupiah(exposure.return_damaged_net) + '. Minta CS memutuskan pembatalan atau pengiriman secara tertulis hari ini.',
      };
    }
    return {
      code: 'kirim',
      label: 'Kirim dengan bukti lengkap',
      tone: 'ok',
      detail: 'Risiko ' + risk.score + '/100. Rekam video pengemasan, simpan chat, dan serahkan paket sebelum ' + timeline.ship_deadline_label + '.',
    };
  }
  if (status.id === 'sudah_dikirim') {
    return {
      code: 'jangan_batal',
      label: 'Jangan terima pembatalan setelah diserahkan',
      tone: 'signal',
      detail: 'Paket sudah diatur pengirimannya. Setelah diserahkan ke kurir, arahkan pembeli ke mekanisme retur dan simpan bukti serah terima.',
    };
  }
  if (status.id === 'dalam_pengiriman') {
    return {
      code: 'tunggu',
      label: 'Tunggu hasil pengiriman, siapkan klaim',
      tone: 'signal',
      detail: 'Pantau status. Bila paket ditolak atau tidak dibayar, siapkan video pengemasan dan ajukan klaim perlindungan COD.',
    };
  }
  if (status.id === 'retur') {
    return {
      code: 'klaim',
      label: 'Siapkan klaim retur',
      tone: 'ember',
      detail: 'Rekam video unboxing sebelum membuka paket. Estimasi klaim maksimal ' + formatRupiah(exposure.max_claim) + ', sisa kerugian ' + formatRupiah(exposure.return_damaged_net) + '.',
    };
  }
  if (status.id === 'dibatalkan') {
    return {
      code: 'batal',
      label: 'Pesanan dibatalkan',
      tone: 'ok',
      detail: 'Catat alasan, waktu, dan siapa yang membatalkan. Cek poin penalti dan saldo sebelum menutup kasus.',
    };
  }
  return {
    code: 'selesai',
    label: 'Pesanan selesai',
    tone: 'ok',
    detail: 'Simpan bukti pesanan, chat, dan pengemasan untuk kebutuhan sengketa berikutnya.',
  };
}

function buildRecommendations(data, timeline, exposure, risk, proof, verdict) {
  const recs = [];
  const status = getOrderStatus(data.order_status);
  const method = getMethod(data.cod_method);

  if (status.id === 'belum_dikirim') {
    recs.push('Hubungi pembeli lewat chat resmi hari ini. Minta konfirmasi alamat dan kesediaan membayar COD, lalu simpan tangkapan layar percakapan.');
    if (timeline.ship_phase === 'mendesak' || timeline.ship_phase === 'lewat') {
      recs.push('Tenggat kirim ' + timeline.ship_deadline_label + '. Hubungi CS sekarang, jelaskan pembeli tidak responsif, dan minta keputusan tertulis sebelum mengirim.');
    }
    recs.push('Jangan membatalkan pesanan sepihak tanpa arahan tertulis CS. Simpan nomor tiket agar alasan pembatalan bisa dipertanggungjawabkan.');
  } else if (status.id === 'sudah_dikirim') {
    recs.push('Setelah paket diserahkan ke kurir, jangan menerima pembatalan. Arahkan pembeli ke pengembalian barang atau dana.');
  } else if (status.id === 'dalam_pengiriman') {
    recs.push('Pantau status pengiriman dan simpan resi. Bila paket ditolak, segera siapkan klaim perlindungan COD.');
  } else if (status.id === 'retur') {
    recs.push('Rekam video unboxing paket retur dari semua sisi sebelum membuka. Klaim barang rusak memerlukan bukti video.');
  }

  if (timeline.cancel) {
    recs.push('Pengajuan pembatalan ' + timeline.cancel.requested_label + '. Respons paling lambat ' + timeline.cancel.deadline_label + ' (1x24 jam).');
  }

  if (data.buyer_status === 'tidak_merespons' || data.buyer_status === 'menolak') {
    recs.push('Status pembeli: ' + getBuyerStatus(data.buyer_status).label + '. Catat setiap percobaan kontak beserta waktu dan kanal.');
    recs.push('Minta CS meninjau riwayat pembeli. Menurut FAQ COD Shopee, pembeli yang membatalkan 2 kali dalam 60 hari dapat dinonaktifkan dari COD selama 60 hari.');
  }

  if (exposure.over_limit) {
    recs.push('Nilai pesanan melebihi batas COD ' + formatRupiah(exposure.max_payment) + ' untuk ' + method.label + '. Periksa apakah pesanan seharusnya memakai metode pembayaran lain.');
  }

  if (exposure.success_net <= 0) {
    recs.push('Laba bersih bila pesanan berhasil hanya ' + formatRupiah(exposure.success_net) + '. Jangan menambah biaya atau diskon sebelum pesanan selesai.');
  } else {
    recs.push('Laba bersih bila pesanan berhasil ' + formatRupiah(exposure.success_net) + '. Kerugian terburuk bila retur rusak ' + formatRupiah(exposure.worst_case) + '.');
  }

  if (status.id === 'retur') {
    recs.push('Batas konfirmasi keadaan barang 7 hari kalender sejak retur diterima. Estimasi klaim maksimal ' + formatRupiah(exposure.max_claim) + ' dengan dasar ' + method.claim_basis + '.');
    if (timeline.claim) {
      recs.push('Retur diterima ' + timeline.claim.received_label + '. Ajukan klaim paling lambat ' + timeline.claim.deadline_label + '.');
    }
  }

  if (proof.missing_critical.length > 0) {
    recs.push('Lengkapi ' + proof.missing_critical.length + ' bukti kritis yang belum ada: ' + proof.missing_critical.join(', ') + '.');
  }

  if (risk.score >= 40 && status.id === 'belum_dikirim') {
    recs.push('Risiko tergolong ' + risk.label.toLowerCase() + '. Minta keputusan tertulis, jangan hanya mengandalkan janji lisan CS.');
  }

  if (timeline.followup_age !== null && timeline.followup_age > 3 && getCaseStatus(data.status).open) {
    recs.push('Follow-up terakhir ' + timeline.followup_age + ' hari lalu. Kasus COD bergerak cepat, kirim eskalasi tertulis hari ini.');
  }

  recs.push('Simpan semua bukti sebelum mengubah status pesanan, membatalkan, atau mengirim ulang. Perubahan bisa menutup akses ke riwayat.');
  recs.push('Keputusan pembatalan, penalti, dan klaim tetap berada di platform. Tool ini hanya membantu menyusun fakta dan angka.');
  return recs;
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const platform = getPlatform(data.platform);
  const method = getMethod(data.cod_method);
  const orderStatus = getOrderStatus(data.order_status);
  const buyerStatus = getBuyerStatus(data.buyer_status);
  const timeline = computeTimeline(data, now);
  const exposure = computeExposure(data);
  const risk = assessRisk(data.signals, data.buyer_status);
  const proof = readiness({ items: data.evidence });
  const verdict = decide(data, timeline, exposure, risk);
  const recommendations = buildRecommendations(data, timeline, exposure, risk, proof, verdict);

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    platform_note: platform.note,
    method: method,
    order_status: orderStatus.id,
    order_status_label: orderStatus.label,
    buyer_status: buyerStatus.id,
    buyer_status_label: buyerStatus.label,
    order_id: data.order_id,
    store_name: data.store_name,
    store_id: data.store_id,
    product_name: data.product_name,
    timeline: timeline,
    exposure: exposure,
    risk: risk,
    verdict: verdict,
    readiness: proof,
    signals: SIGNALS.map((item) => Object.assign({}, item, { checked: data.signals.indexOf(item.id) !== -1 })),
    evidence: proof.items,
    recommendations: recommendations,
    sources: SOURCES.slice(),
    disclaimer: 'Tool ini alat bantu keputusan operasional, bukan nasihat hukum. Skor risiko bersifat heuristik dan tidak membuktikan pembeli fiktif. Keputusan pembatalan, penalti, dan klaim tetap berada pada platform.',
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
  const chronology = cleanBlock(data.chronology) || 'Saya mencatat pesanan ini sebagai berisiko pada ' + formatDateID(todayISO(now)) + '.';
  const e = analyzed.exposure;
  const t = analyzed.timeline;
  const risk = analyzed.risk;

  let subject = '';
  const lines = [];

  if (letterType.id === 'pembatalan') {
    subject = 'Permintaan pembatalan pesanan COD berisiko tanpa penalti - ' + storeName + ' - ' + orderId;
  } else if (letterType.id === 'peninjauan_pembeli') {
    subject = 'Permintaan peninjauan pembeli COD - ' + storeName + ' - ' + orderId;
  } else {
    subject = 'Permintaan klaim perlindungan COD atas retur rusak - ' + storeName + ' - ' + orderId;
  }

  lines.push('Kepada Tim Layanan Penjual ' + analyzed.platform_name + ',');
  lines.push('');
  lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + (analyzed.store_id ? ' (' + analyzed.store_id + ')' : '') + ', mengajukan permintaan berikut untuk pesanan COD ' + orderId + '.');
  lines.push('');
  lines.push('Data penjual:');
  lines.push('- Platform: ' + analyzed.platform_name);
  lines.push('- Nama toko: ' + storeName);
  lines.push('- Kontak: ' + contact);
  lines.push('- Nomor tiket sebelumnya: ' + ticket);
  lines.push('');
  lines.push('Data pesanan:');
  lines.push('- Produk: ' + productName);
  lines.push('- Tanggal pesanan: ' + t.order_date_label);
  lines.push('- Batas waktu pengiriman: ' + t.ship_deadline_label);
  lines.push('- Metode COD: ' + analyzed.method.label);
  lines.push('- Nilai pesanan: ' + formatRupiah(e.order_value));
  lines.push('- Status pesanan saat ini: ' + analyzed.order_status_label);
  lines.push('- Status pembeli: ' + analyzed.buyer_status_label);
  if (t.cancel) {
    lines.push('- Pembatalan diajukan: ' + t.cancel.requested_label);
    lines.push('- Batas respons pembatalan: ' + t.cancel.deadline_label + ' (1x24 jam)');
  }
  lines.push('- Skor risiko heuristik: ' + risk.score + '/100 (' + risk.label + ')');
  lines.push('');
  lines.push('Kronologi:');
  lines.push(chronology);
  lines.push('');
  lines.push('Indikasi yang saya catat:');
  if (risk.selected.length > 0) {
    risk.selected.forEach((item) => lines.push('- ' + item));
  } else {
    lines.push('- Belum ada indikasi yang saya centang. Saya tetap meminta peninjauan berdasarkan data pesanan.');
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

  if (letterType.id === 'pembatalan') {
    lines.push('1. Batalkan pesanan ' + orderId + ' tanpa membebankan poin penalti atau hukuman lain kepada toko saya.');
    lines.push('2. Konfirmasi tertulis bahwa keterlambatan atau penolakan pengiriman terjadi karena pembeli tidak dapat dihubungi atau tidak mau membayar, bukan karena kelalaian penjual.');
    lines.push('3. Tinjau status COD pembeli bila tercatat membatalkan pesanan berulang, sesuai ketentuan yang berlaku.');
    lines.push('4. Berikan nomor tiket dan waktu tanggap atau SLA penyelesaian.');
    lines.push('5. Bila paket sudah diserahkan ke kurir, jelaskan mekanisme retur dan klaim perlindungan COD yang tersedia.');
    lines.push('');
    lines.push('Saya memahami pembatalan non-instan memerlukan respons penjual dalam 1x24 jam dan pembeli dapat mengajukan pembatalan dengan alasan ingin mengubah alamat atau penjual tidak membalas chat. Saya sudah berusaha menghubungi pembeli melalui chat resmi dan menyimpan buktinya.');
  } else if (letterType.id === 'peninjauan_pembeli') {
    lines.push('1. Tinjau riwayat pembeli pada pesanan ' + orderId + ' dan pesanan lain dari akun yang sama.');
    lines.push('2. Jelaskan apakah pembeli memenuhi kriteria pembatasan COD karena pembatalan berulang atau tidak dapat dihubungi.');
    lines.push('3. Berikan nomor tiket dan waktu tanggap atau SLA penyelesaian.');
    lines.push('4. Bila ditemukan pola penyalahgunaan, jelaskan langkah perlindungan yang tersedia untuk toko saya.');
    lines.push('');
    lines.push('Saya memahami pembeli yang tidak dapat dihubungi, menolak, atau tidak membayar dan membatalkan 2 kali dalam 60 hari kalender dapat dinonaktifkan dari COD selama 60 hari. Saya meminta peninjauan berdasarkan data, bukan tuduhan.');
  } else {
    lines.push('1. Proses klaim perlindungan COD untuk pesanan ' + orderId + ' sebesar maksimal ' + formatRupiah(e.max_claim) + '.');
    lines.push('2. Jelaskan kekurangan dokumen, bila ada, agar saya dapat melengkapinya sebelum batas 7 hari konfirmasi retur berakhir.');
    lines.push('3. Konfirmasi tertulis atas nilai klaim yang disetujui dan waktu pembayaran ke saldo penjual.');
    lines.push('4. Berikan nomor tiket dan waktu tanggap atau SLA penyelesaian.');
    lines.push('');
    lines.push('Saya memahami untuk layanan Reguler atau Hemat Kargo, klaim perlindungan COD dihitung sebesar 10 kali ongkos kirim atau harga barang dengan batas Rp 1.000.000, mengikuti nominal terendah. Untuk layanan Instant, klaim mengikuti harga barang dengan batas Rp 10.000.000. Saya juga memahami penjual diberi 7 hari kalender untuk mengonfirmasi keadaan barang retur.');
  }

  lines.push('');
  lines.push('Estimasi kerugian dari input saya:');
  lines.push('- Laba bersih bila pesanan berhasil: ' + formatRupiah(e.success_net));
  lines.push('- Kerugian bila retur utuh: ' + formatRupiah(e.return_good_loss));
  lines.push('- Kerugian bila retur rusak sebelum klaim: ' + formatRupiah(e.return_damaged_gross));
  lines.push('- Estimasi klaim maksimal: ' + formatRupiah(e.max_claim));
  lines.push('- Sisa kerugian retur rusak setelah klaim: ' + formatRupiah(e.return_damaged_net));
  lines.push('Angka ini adalah perkiraan dari input saya, bukan nilai resmi dari platform.');
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
    timeline: t,
    exposure: e,
    risk: risk,
    readiness: analyzed.readiness,
  };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  return {
    platform: 'shopee',
    cod_method: 'reguler',
    order_status: 'belum_dikirim',
    buyer_status: 'tidak_merespons',
    order_id: '261026KUHA9AN3',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    product_name: 'Aksesori Rajut Premium',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-2026',
    order_date: addDays(today, -2),
    ship_deadline: addDays(today, 1),
    cancel_requested_date: addDays(today, -1),
    return_received_date: '',
    followup_date: addDays(today, -1),
    order_value: 185000,
    hpp: 110000,
    packaging_cost: 3000,
    handling_cost: 5000,
    extra_cost: 0,
    shipping_cost: 10000,
    fee_rate: 0,
    problem: 'pembeli_fiktif',
    letter_type: 'pembatalan',
    chronology: 'Pesanan COD masuk dari akun yang tidak dikenal. Pembeli sempat mengajukan pembatalan dengan alasan ingin mengganti alamat, lalu menarik pengajuan. Chat konfirmasi alamat tidak dibalas. Saya menghubungi CS dan diminta menunggu, sementara batas waktu pengiriman semakin dekat.',
    note: 'Contoh ilustrasi. Nomor pesanan dan nominal adalah contoh, bukan data nyata.',
    signals: ['cancel_withdrawn', 'buyer_no_response', 'address_change', 'high_value'],
    evidence: ['order_screenshot', 'chat_history', 'cancel_request', 'cs_ticket', 'cancel_withdrawal', 'shipping_deadline', 'timeline'],
  };
}

function validateCase(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  if (!data.order_id) return { error: 'Nomor pesanan wajib diisi' };
  if (!data.store_name) return { error: 'Nama toko wajib diisi' };
  if (!data.product_name) return { error: 'Nama produk wajib diisi' };

  const status = getCaseStatus(input.case_status || input.status || 'baru');
  return {
    item: {
      platform: data.platform,
      cod_method: data.cod_method,
      order_status: data.order_status,
      buyer_status: data.buyer_status,
      order_id: data.order_id,
      store_name: data.store_name,
      store_id: data.store_id,
      product_name: data.product_name,
      seller_name: data.seller_name,
      contact: data.contact,
      order_date: data.order_date,
      ship_deadline: data.ship_deadline,
      cancel_requested_date: data.cancel_requested_date,
      return_received_date: data.return_received_date,
      order_value: data.order_value,
      hpp: data.hpp,
      packaging_cost: data.packaging_cost,
      handling_cost: data.handling_cost,
      extra_cost: data.extra_cost,
      shipping_cost: data.shipping_cost,
      fee_rate: data.fee_rate,
      status: status.id,
      ticket: data.ticket,
      followup_date: data.followup_date,
      problem: data.problem,
      letter_type: data.letter_type,
      signals: data.signals,
      evidence: data.evidence,
      note: data.note,
      chronology: data.chronology,
    },
  };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const analyzed = analyze(data, now);
  const status = getCaseStatus(data.status || 'baru');
  const flags = [];

  if (analyzed.error) {
    return Object.assign({}, data, {
      error: analyzed.error,
      flags: [analyzed.error],
      flags_count: 1,
    });
  }

  const t = analyzed.timeline;
  const e = analyzed.exposure;

  if (data.order_status === 'belum_dikirim' && t.ship_phase === 'mendesak') {
    flags.push('Tenggat kirim ' + t.ship_deadline_label + '. Minta keputusan CS hari ini.');
  }
  if (data.order_status === 'belum_dikirim' && t.ship_phase === 'lewat' && status.open) {
    flags.push('Tenggat kirim sudah lewat. Risiko pembatalan otomatis dan penalti perlu dieskalasi.');
  }
  if (t.cancel && t.cancel.phase === 'lewat' && status.open) {
    flags.push('Batas respons pembatalan 1x24 jam sudah lewat. Hubungi CS sekarang.');
  }
  if (t.cancel && !data.ticket) {
    flags.push('Pengajuan pembatalan tercatat tetapi nomor tiket CS belum disimpan.');
  }
  if (analyzed.risk.score >= 40 && data.order_status === 'belum_dikirim') {
    flags.push('Risiko tinggi. Jangan kirim tanpa keputusan tertulis dan bukti lengkap.');
  }
  if (data.order_status === 'retur' && (data.evidence || []).indexOf('return_unboxing') === -1) {
    flags.push('Retur dalam proses. Rekam video unboxing sebelum membuka paket.');
  }
  if (t.claim && t.claim.phase === 'mendesak') {
    flags.push('Batas konfirmasi retur tinggal ' + Math.max(0, t.claim.days_left) + ' hari.');
  }
  if (t.claim && t.claim.phase === 'lewat') {
    flags.push('Batas 7 hari konfirmasi retur sudah lewat. Tetap ajukan klaim dengan bukti.');
  }
  if (e.over_limit) {
    flags.push('Nilai pesanan melebihi batas COD ' + formatRupiah(e.max_payment) + ' untuk metode ini.');
  }
  if (t.followup_age !== null && t.followup_age > 3 && status.open) {
    flags.push('Follow-up terakhir ' + t.followup_age + ' hari lalu. Kasus COD perlu respons cepat.');
  }
  if (e.success_net <= 0) {
    flags.push('Laba bersih pesanan ini nol atau negatif. Jangan tambah biaya sebelum selesai.');
  }
  if (status.id === 'dikirim' && data.cancel_requested_date) {
    flags.push('Paket sudah dikirim tetapi pembatalan masih tercatat. Arahkan ke mekanisme retur.');
  }

  return Object.assign({}, analyzed, {
    id: data.id || '',
    created_at: data.created_at || '',
    case_status: status.id,
    case_status_label: status.label,
    open: status.open,
    ticket: data.ticket || '',
    followup_date: data.followup_date || '',
    note: data.note || '',
    flags: flags,
    flags_count: flags.length,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const open = views.filter((item) => item.open);
  const risky = views.filter((item) => item.risk && item.risk.score >= 40);
  const returns = views.filter((item) => item.order_status === 'retur');

  let totalValue = 0;
  let totalWorst = 0;
  let openWorst = 0;
  let highestScore = 0;
  views.forEach((item) => {
    if (item.exposure) {
      totalValue += item.exposure.order_value;
      totalWorst += item.exposure.worst_case;
      if (item.open) openWorst += item.exposure.worst_case;
    }
    if (item.risk && item.risk.score > highestScore) highestScore = item.risk.score;
  });

  let nearestShip = null;
  let nearestCancel = null;
  open.forEach((item) => {
    if (!item.timeline) return;
    if (item.order_status === 'belum_dikirim') {
      const left = item.timeline.days_to_ship;
      if (left !== null && (nearestShip === null || left < nearestShip)) nearestShip = left;
    }
    if (item.timeline.cancel) {
      const left = item.timeline.cancel.days_left;
      if (left !== null && (nearestCancel === null || left < nearestCancel)) nearestCancel = left;
    }
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    risky_cases: risky.length,
    return_cases: returns.length,
    total_order_value: Math.round(totalValue),
    total_worst_loss: Math.round(totalWorst),
    open_worst_loss: Math.round(openWorst),
    highest_score: highestScore,
    nearest_ship_days: nearestShip,
    nearest_cancel_days: nearestCancel,
  };
}

function meta() {
  return {
    platforms: PLATFORMS,
    cod_methods: COD_METHODS,
    order_statuses: ORDER_STATUSES,
    buyer_statuses: BUYER_STATUSES,
    signals: SIGNALS,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    problems: PROBLEMS,
    letter_types: LETTER_TYPES,
    sources: SOURCES,
    defaults: DEFAULTS,
  };
}

module.exports = {
  analyze,
  assessRisk,
  buildExample,
  buildLetter,
  caseView,
  computeExposure,
  computeTimeline,
  daysBetween,
  addDays,
  formatDateID,
  formatRupiah,
  getBuyerStatus,
  getCaseStatus,
  getMethod,
  getOrderStatus,
  getLetterType,
  readiness,
  summary,
  todayISO,
  validateCase,
  meta,
  DEFAULTS,
  COD_METHODS,
  ORDER_STATUSES,
  BUYER_STATUSES,
  SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  PROBLEMS,
  LETTER_TYPES,
  PLATFORMS,
  SOURCES,
};
