'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'tiktok',
    label: 'TikTok Shop',
    note: 'Kasus 29 Oktober 2026 terjadi di TikTok Shop. Tool ini memakai dokumentasi Seller Center TikTok Shop by Tokopedia untuk menjelaskan cara pendaftaran kampanye.',
  },
  {
    id: 'tokopedia',
    label: 'Tokopedia',
    note: 'Tokopedia dan TikTok Shop berbagi Seller Center setelah integrasi. Aturan kampanye bisa berbeda per jenis campaign. Selalu cek halaman detail kampanye.',
  },
  {
    id: 'shopee',
    label: 'Shopee',
    note: 'Belum ada kasus kampanye otomatis yang dikutip tool ini. Prinsip audit yang sama berlaku: minta catatan pendaftaran dan bukti persetujuan.',
  },
  {
    id: 'lazada',
    label: 'Lazada',
    note: 'Belum ada kasus kampanye otomatis yang dikutip tool ini. Prinsip audit yang sama berlaku: minta catatan pendaftaran dan bukti persetujuan.',
  },
  {
    id: 'blibli',
    label: 'Blibli',
    note: 'Belum ada kasus kampanye otomatis yang dikutip tool ini. Prinsip audit yang sama berlaku: minta catatan pendaftaran dan bukti persetujuan.',
  },
  {
    id: 'lainnya',
    label: 'Marketplace lain',
    note: 'Nama menu dan aturan kampanye berbeda per platform. Sesuaikan istilah di surat dengan Seller Center yang Anda pakai.',
  },
];

const ENROLLMENT_METHODS = [
  {
    id: 'tidak_tahu',
    label: 'Tidak tahu atau tidak ada catatan',
    risk: 'tinggi',
    note: 'Tanpa catatan pendaftaran, minta audit log ke platform. Jangan menyimpulkan sendiri siapa yang mendaftarkan.',
  },
  {
    id: 'manual',
    label: 'Daftar manual di Seller Center',
    risk: 'rendah',
    note: 'Pendaftaran manual biasanya meninggalkan catatan harga yang Anda isi sendiri. Cocokkan dengan tangkapan layar Anda.',
  },
  {
    id: 'one_click',
    label: 'Pendaftaran sekali klik',
    risk: 'sedang',
    note: 'Pendaftaran sekali klik dapat mendaftarkan semua produk yang memenuhi syarat, termasuk sub-campaign yang wajib.',
  },
  {
    id: 'auto_registration',
    label: 'Auto-registration atau CFV auto-registration',
    risk: 'tinggi',
    note: 'Produk yang dipilih bisa didaftarkan otomatis ke kampanye berikutnya memakai harga kampanye sebelumnya.',
  },
  {
    id: 'ops_registration',
    label: 'Didaftarkan tim operasional platform',
    risk: 'tinggi',
    note: 'Tim operasional dapat mendaftarkan produk atas nama penjual. Sebagian pendaftaran baru berlaku setelah penjual menyetujui.',
  },
  {
    id: 'whatsapp',
    label: 'Konfirmasi lewat WhatsApp resmi',
    risk: 'sedang',
    note: 'Persetujuan lewat balasan YES membuat harga otomatis disesuaikan dengan aturan kampanye. Simpan percakapannya.',
  },
  {
    id: 'popup',
    label: 'Pop-up di Seller Center',
    risk: 'sedang',
    note: 'Platform dapat menganggap pop-up sebagai konfirmasi. Simpan tangkapan layar dan waktu kemunculannya.',
  },
];

const INDICATORS = [
  { id: 'no_registration_record', label: 'Tidak ada catatan pendaftaran produk di Seller Center', weight: 14, group: 'Pendaftaran' },
  { id: 'price_differs', label: 'Harga kampanye berbeda dari harga yang saya tetapkan', weight: 14, group: 'Harga' },
  { id: 'no_notification', label: 'Tidak ada email, inbox, atau WhatsApp sebelum kampanye dimulai', weight: 10, group: 'Pemberitahuan' },
  { id: 'popup_claim', label: 'Platform menyebut persetujuan lewat pop-up yang tidak saya ingat', weight: 8, group: 'Persetujuan' },
  { id: 'ops_registration', label: 'Produk didaftarkan tim operasional atas nama toko', weight: 12, group: 'Pendaftaran' },
  { id: 'auto_registration', label: 'Toko pernah memakai auto-registration atau CFV auto-registration', weight: 14, group: 'Pendaftaran' },
  { id: 'cannot_withdraw', label: 'Tidak bisa keluar dari kampanye saat kampanye berjalan', weight: 8, group: 'Kontrol' },
  { id: 'price_locked', label: 'Harga produk terkunci selama kampanye', weight: 6, group: 'Kontrol' },
  { id: 'no_consent_log', label: 'Platform belum menunjukkan bukti persetujuan sampai sekarang', weight: 10, group: 'Persetujuan' },
  { id: 'sales_spike', label: 'Pesanan melonjak tanpa perubahan iklan atau live', weight: 4, group: 'Pola' },
];

const EVIDENCE = [
  { id: 'price_screenshot', label: 'Tangkapan layar harga normal sebelum kampanye', critical: true, group: 'Harga' },
  { id: 'campaign_page', label: 'Halaman detail kampanye: tanggal, harga, dan syarat', critical: true, group: 'Kampanye' },
  { id: 'registration_record', label: 'Riwayat pendaftaran atau daftar produk kampanye', critical: true, group: 'Pendaftaran' },
  { id: 'consent_proof', label: 'Bukti persetujuan: pop-up, email, inbox, atau WhatsApp', critical: true, group: 'Persetujuan' },
  { id: 'transaction_export', label: 'Ekspor transaksi selama periode kampanye', critical: true, group: 'Transaksi' },
  { id: 'campaign_notification', label: 'Email atau notifikasi undangan kampanye', critical: false, group: 'Pemberitahuan' },
  { id: 'chat_rm', label: 'Chat dengan Relationship Manager atau CS', critical: false, group: 'Komunikasi' },
  { id: 'price_history', label: 'Riwayat perubahan harga produk', critical: false, group: 'Harga' },
  { id: 'ads_live_data', label: 'Data iklan dan live untuk membandingkan lonjakan pesanan', critical: false, group: 'Pola' },
  { id: 'stock_mutation', label: 'Mutasi stok selama kampanye', critical: false, group: 'Transaksi' },
  { id: 'withdrawal_attempt', label: 'Bukti percobaan keluar dari kampanye', critical: false, group: 'Kontrol' },
  { id: 'settlement', label: 'Rincian settlement dan potongan per pesanan', critical: false, group: 'Transaksi' },
  { id: 'timeline', label: 'Kronologi tanggal temuan, laporan, dan jawaban platform', critical: false, group: 'Komunikasi' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru ditemukan', open: true },
  { id: 'dilaporkan', label: 'Sudah dilaporkan', open: true },
  { id: 'menunggu_jawaban', label: 'Menunggu jawaban', open: true },
  { id: 'disetujui', label: 'Disetujui sebagian atau penuh', open: false },
  { id: 'ditolak', label: 'Ditolak platform', open: true },
  { id: 'selesai', label: 'Selesai', open: false },
];

const PROBLEMS = [
  { id: 'harga_turun', label: 'Harga kampanye lebih rendah tanpa persetujuan saya' },
  { id: 'tidak_bisa_keluar', label: 'Tidak bisa keluar dari kampanye' },
  { id: 'data_tidak_transparan', label: 'Tidak ada bukti pendaftaran atau persetujuan' },
  { id: 'kompensasi', label: 'Dampak finansial belum diselesaikan' },
];

const SOURCES = [
  {
    title: 'Pendaftaran Voucher Boost Campaign TikTok Shop Tanpa Konfirmasi Seller, Estimasi Kerugian Rp92 Juta',
    publisher: 'Media Konsumen',
    date: '2026-10-29',
    url: 'https://mediakonsumen.com/2026/10/29/surat-pembaca/pendaftaran-voucher-boost-campaign-tiktok-shop-tanpa-konfirmasi-seller-estimasi-kerugian-rp92-juta',
    note: 'Kasus toko COZYON. Produk tercatat ikut Voucher Boost Campaign dengan harga lebih rendah tanpa diketahui penjual. Platform menyebut pendaftaran lewat pop-up dan dianggap dikonfirmasi. Estimasi dampak Rp92.676.021 berasal dari klaim penjual, bukan angka resmi platform.',
  },
  {
    title: 'Campaign Produk',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: '2025-12-30',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=7753809473062657&lang=id-ID',
    note: 'Menjelaskan harga campaign yang diisi otomatis sebagai rekomendasi, stok campaign yang dikunci setelah disetujui, dan tim operasional yang dapat mendaftarkan produk atas nama penjual.',
  },
  {
    title: 'Co-Funded Voucher Campaign Auto Registration',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: 'diakses 2026-10-31',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=3677374135617281&lang=en',
    note: 'Auto-registration CFV mendaftarkan produk terpilih ke kampanye berikutnya. Harga registrasi diisi otomatis dari harga kampanye sebelumnya dan belum bisa diubah pada versi saat artikel ini diakses.',
  },
  {
    title: 'Guide to Campaign Confirmation via Official WhatsApp',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: 'diakses 2026-10-31',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=2663739192674064&lang=en',
    note: 'Penjual dapat mendaftarkan produk dengan membalas YES ke pesan WhatsApp resmi. Harga produk otomatis disesuaikan menurut aturan kampanye.',
  },
  {
    title: 'Pendaftaran Sekali Klik Campaign',
    publisher: 'TikTok Shop by Tokopedia Seller Center',
    date: '2025-10-20',
    url: 'https://seller-id.tokopedia.com/university/essay?knowledge_id=6170577439000336&lang=id-ID',
    note: 'Pendaftaran sekali klik dapat mendaftarkan semua produk yang memenuhi syarat, dan sebagian sub-campaign bersifat wajib serta otomatis disertakan.',
  },
  {
    title: 'Peraturan Menteri Perdagangan Nomor 19 Tahun 2026 tentang Penyelenggaraan Usaha Perdagangan Melalui Sistem Elektronik',
    publisher: 'JDIH Kementerian Perdagangan',
    date: '2026-06-08',
    url: 'https://jdih.kemendag.go.id/peraturan/download/5d4ff6c5-ae21-4591-81ed-4949d6e6ac1d/file_abstract',
    note: 'PPMSE wajib menginformasikan setiap biaya kepada pedagang secara transparan, membuat biaya yang disepakati dalam perjanjian tertulis atau kontrak elektronik, dan menyediakan layanan pengaduan dengan waktu tanggap atau SLA.',
  },
];

const DEFAULTS = {
  platform: 'tiktok',
  enrollment_method: 'tidak_tahu',
  problem: 'harga_turun',
  status: 'baru',
  fee_rate: 0,
  units_sold: 0,
  normal_price: 0,
  campaign_price: 0,
  seller_price: 0,
  hpp: 0,
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
  return ENROLLMENT_METHODS.find((item) => item.id === id) || ENROLLMENT_METHODS[0];
}

function getIndicator(id) {
  return INDICATORS.find((item) => item.id === id);
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id);
}

function getStatus(id) {
  return CASE_STATUSES.find((item) => item.id === id) || CASE_STATUSES[0];
}

function getProblem(id) {
  return PROBLEMS.find((item) => item.id === id) || PROBLEMS[0];
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function normalizeIndicators(input) {
  const source = Array.isArray(input) ? input : [];
  return Array.from(new Set(source.map((id) => String(id)).filter((id) => getIndicator(id))));
}

function normalizeEvidence(input) {
  const source = Array.isArray(input) ? input : [];
  return Array.from(new Set(source.map((id) => String(id)).filter((id) => getEvidence(id))));
}

function validateBase(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const method = getMethod(data.enrollment_method);

  const start = parseISO(data.campaign_start);
  const end = parseISO(data.campaign_end);
  if (!start) return { error: 'Tanggal mulai kampanye wajib diisi dengan format YYYY-MM-DD' };
  if (!end) return { error: 'Tanggal selesai kampanye wajib diisi dengan format YYYY-MM-DD' };
  if (daysBetween(start, end) < 0) return { error: 'Tanggal selesai kampanye tidak boleh sebelum tanggal mulai' };

  const normalPrice = num(data.normal_price);
  const campaignPrice = num(data.campaign_price);
  const sellerPriceRaw = num(data.seller_price);
  const hpp = num(data.hpp);
  const feeRate = num(data.fee_rate);
  const units = whole(data.units_sold);

  if (normalPrice <= 0) return { error: 'Harga normal harus lebih dari 0' };
  if (campaignPrice <= 0) return { error: 'Harga kampanye harus lebih dari 0' };
  if (hpp < 0) return { error: 'HPP tidak boleh negatif' };
  if (feeRate < 0 || feeRate >= 100) return { error: 'Biaya layanan harus 0 sampai kurang dari 100 persen' };
  if (units < 0) return { error: 'Jumlah unit terjual tidak boleh negatif' };

  const sellerPrice = sellerPriceRaw > 0 ? sellerPriceRaw : campaignPrice;
  if (sellerPrice > normalPrice) return { error: 'Harga yang diterima penjual tidak boleh melebihi harga normal' };

  const discovered = parseISO(data.discovered_date);
  if (String(data.discovered_date || '').trim() && !discovered) return { error: 'Tanggal temuan tidak valid' };
  if (discovered && discovered > todayISO(now)) return { error: 'Tanggal temuan tidak boleh melewati hari ini' };

  const followup = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followup) return { error: 'Tanggal follow-up tidak valid' };
  if (followup && followup > todayISO(now)) return { error: 'Tanggal follow-up tidak boleh melewati hari ini' };

  return {
    data: {
      platform: platform.id,
      enrollment_method: method.id,
      campaign_name: cleanLine(data.campaign_name, 140),
      campaign_start: start,
      campaign_end: end,
      normal_price: round2(normalPrice),
      campaign_price: round2(campaignPrice),
      seller_price: round2(sellerPrice),
      hpp: round2(hpp),
      fee_rate: round2(feeRate),
      units_sold: units,
      product_name: cleanLine(data.product_name, 160),
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      seller_name: cleanLine(data.seller_name, 120),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      discovered_date: discovered || '',
      followup_date: followup || '',
      chronology: cleanBlock(data.chronology),
      note: cleanBlock(data.note),
      problem: getProblem(data.problem).id,
      indicators: normalizeIndicators(data.indicators || data.facts),
      evidence: normalizeEvidence(data.evidence || data.items),
    },
  };
}

function computeEconomics(data) {
  const fee = num(data.fee_rate) / 100;
  const normalPrice = num(data.normal_price);
  const campaignPrice = num(data.campaign_price);
  const sellerPrice = num(data.seller_price) > 0 ? num(data.seller_price) : campaignPrice;
  const hpp = num(data.hpp);
  const units = whole(data.units_sold);

  const discountPerUnit = normalPrice - campaignPrice;
  const discountPct = normalPrice > 0 ? round1((discountPerUnit / normalPrice) * 100) : 0;
  const normalNet = normalPrice * (1 - fee) - hpp;
  const campaignNet = sellerPrice * (1 - fee) - hpp;
  const normalMarginPct = normalPrice > 0 ? round1((normalNet / normalPrice) * 100) : 0;
  const campaignMarginPct = sellerPrice > 0 ? round1((campaignNet / sellerPrice) * 100) : 0;
  const lossPerUnit = normalNet - campaignNet;
  const totalLoss = Math.max(0, lossPerUnit) * units;
  const revenueShortfall = Math.max(0, discountPerUnit) * units;
  const breakEvenPrice = fee < 1 ? hpp / (1 - fee) : null;

  let verdict = 'aman';
  let verdict_label = 'Tidak ada selisih';
  let tone = 'ok';
  let detail = 'Harga yang diterima penjual tidak lebih rendah dari harga normal.';
  if (campaignNet < 0) {
    verdict = 'rugi';
    verdict_label = 'Rugi per unit';
    tone = 'ember';
    detail = 'Harga kampanye tidak menutup HPP dan biaya layanan. Setiap unit yang terjual menggerus modal.';
  } else if (lossPerUnit > 0) {
    verdict = 'turun';
    verdict_label = 'Margin turun';
    tone = 'signal';
    detail = 'Masih untung per unit, tetapi laba per unit lebih rendah dari penjualan normal.';
  }

  let coverUnits = null;
  if (totalLoss > 0 && normalNet > 0) coverUnits = Math.ceil(totalLoss / normalNet);

  return {
    normal_price: Math.round(normalPrice),
    campaign_price: Math.round(campaignPrice),
    seller_price: Math.round(sellerPrice),
    hpp: Math.round(hpp),
    fee_rate: round2(num(data.fee_rate)),
    units_sold: units,
    discount_per_unit: Math.round(discountPerUnit),
    discount_pct: discountPct,
    normal_net: Math.round(normalNet),
    campaign_net: Math.round(campaignNet),
    normal_margin_pct: normalMarginPct,
    campaign_margin_pct: campaignMarginPct,
    loss_per_unit: Math.round(lossPerUnit),
    total_loss: Math.round(totalLoss),
    revenue_shortfall: Math.round(revenueShortfall),
    break_even_price: breakEvenPrice === null ? null : Math.round(breakEvenPrice),
    cover_units: coverUnits,
    verdict: verdict,
    verdict_label: verdict_label,
    tone: tone,
    detail: detail,
    note: 'Semua angka berasal dari input Anda. Biaya layanan tidak memakai default karena potongan berbeda per toko dan per program. Cocokkan dengan rincian settlement.',
  };
}

function computeTimeline(data, now = new Date()) {
  const today = todayISO(now);
  const start = data.campaign_start;
  const end = data.campaign_end;
  const campaignDays = (daysBetween(start, end) || 0) + 1;
  const daysToEnd = daysBetween(today, end);
  const daysToStart = daysBetween(today, start);
  const daysSinceDiscovered = data.discovered_date ? daysBetween(data.discovered_date, today) : null;
  const followupAge = data.followup_date ? daysBetween(data.followup_date, today) : null;

  let phase = 'selesai';
  let phase_label = 'Kampanye sudah selesai';
  let action = 'Fokus pada audit catatan pendaftaran dan pembahasan dampak finansial, bukan penghentian produk.';
  let tone = 'ok';
  if (daysToStart > 0) {
    phase = 'belum_mulai';
    phase_label = 'Kampanye belum mulai';
    action = 'Periksa daftar produk dan harga sekarang. Bila tidak ingin ikut, coba keluar sebelum kampanye dimulai.';
    tone = 'signal';
  } else if (daysToEnd >= 0) {
    phase = 'berjalan';
    phase_label = 'Kampanye sedang berjalan';
    action = 'Minta penghentian produk secara tertulis hari ini, lalu simpan bukti sebelum mengubah harga atau stok.';
    tone = 'ember';
  }

  return {
    today: today,
    campaign_start: start,
    campaign_end: end,
    campaign_start_label: formatDateID(start),
    campaign_end_label: formatDateID(end),
    campaign_days: campaignDays,
    days_to_start: daysToStart,
    days_to_end: daysToEnd,
    days_since_discovered: daysSinceDiscovered,
    followup_age: followupAge,
    phase: phase,
    phase_label: phase_label,
    action: action,
    tone: tone,
  };
}

function assessIndicators(selected) {
  const ids = normalizeIndicators(selected);
  const available = INDICATORS.filter((item) => ids.indexOf(item.id) !== -1);
  let score = 0;
  available.forEach((item) => { score += item.weight; });

  let level = 'rendah';
  let label = 'Indikasi rendah';
  let tone = 'ok';
  if (score >= 75) {
    level = 'sangat_tinggi';
    label = 'Indikasi sangat tinggi';
    tone = 'ember';
  } else if (score >= 50) {
    level = 'tinggi';
    label = 'Indikasi tinggi';
    tone = 'ember';
  } else if (score >= 25) {
    level = 'sedang';
    label = 'Indikasi sedang';
    tone = 'signal';
  }

  return {
    score: score,
    level: level,
    label: label,
    tone: tone,
    count: available.length,
    total: INDICATORS.length,
    selected: available.map((item) => item.label),
    note: 'Skor ini heuristik dari fakta yang Anda centang, bukan bukti hukum. Keputusan tetap ada di platform.',
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

function buildRecommendations(data, timeline, economics, proof, assessment) {
  const recs = [];
  const method = getMethod(data.enrollment_method);

  if (timeline.phase === 'berjalan') {
    recs.push('Kampanye masih berjalan sampai ' + timeline.campaign_end_label + '. Kirim permintaan penghentian produk hari ini dan minta konfirmasi tertulis.');
  } else if (timeline.phase === 'belum_mulai') {
    recs.push('Kampanye belum mulai. Periksa daftar produk sekarang dan coba keluar sebelum harga terkunci.');
  } else {
    recs.push('Kampanye sudah selesai. Fokus pada audit catatan pendaftaran, bukti persetujuan, dan pembahasan kompensasi.');
  }

  recs.push('Minta log pendaftaran: waktu, kanal, akun yang menyetujui, dan harga yang diajukan. Tanpa log, klaim persetujuan tidak bisa diverifikasi.');

  if (method.id === 'auto_registration') {
    recs.push('Auto-registration dapat memakai harga kampanye sebelumnya untuk kampanye berikutnya. Periksa pengaturan CFV auto-registration dan hentikan bila tidak diinginkan.');
  }
  if (method.id === 'ops_registration') {
    recs.push('Minta bukti persetujuan untuk pendaftaran oleh tim operasional. Sebagian pendaftaran baru berlaku setelah penjual menyetujui harga.');
  }
  if (method.id === 'one_click') {
    recs.push('Pendaftaran sekali klik dapat menyertakan sub-campaign wajib. Cocokkan daftar produk yang terdaftar dengan yang Anda pilih.');
  }
  if (method.id === 'whatsapp') {
    recs.push('Simpan percakapan WhatsApp resmi lengkap dengan waktu dan nomor pengirim. Balasan YES adalah bentuk persetujuan yang perlu diperiksa isinya.');
  }

  if (economics.total_loss > 0) {
    recs.push('Estimasi dampak ' + formatRupiah(economics.total_loss) + ' dari ' + economics.units_sold + ' unit. Cocokkan dengan ekspor transaksi dan settlement sebelum mengajukan kompensasi.');
  } else if (economics.units_sold === 0) {
    recs.push('Jumlah unit terjual masih nol. Isi angka dari ekspor transaksi agar dampak finansial bisa dihitung.');
  } else {
    recs.push('Tidak ada selisih laba per unit dari input ini. Periksa kembali harga normal, harga kampanye, dan biaya layanan sebelum melapor.');
  }

  if (timeline.followup_age !== null && timeline.followup_age > 14) {
    recs.push('Follow-up terakhir ' + timeline.followup_age + ' hari lalu. Kirim eskalasi tertulis dan minta SLA penyelesaian yang jelas.');
  }

  if (proof.missing_critical.length > 0) {
    recs.push('Lengkapi ' + proof.missing_critical.length + ' bukti kritis yang belum ada. Bukti persetujuan dan ekspor transaksi paling menentukan.');
  }

  if (assessment.score >= 50) {
    recs.push('Indikasi pendaftaran tanpa persetujuan tergolong ' + assessment.label.toLowerCase() + '. Tetap minta bukti dari platform, jangan menyimpulkan sendiri.');
  }

  recs.push('Simpan semua bukti sebelum mengubah harga, stok, atau keluar dari kampanye. Perubahan bisa menghapus jejak yang dibutuhkan.');
  recs.push('Sebutkan dasar transparansi biaya dan perjanjian tertulis dalam Permendag 19/2026 saat meminta penjelasan tertulis.');
  return recs;
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const platform = getPlatform(data.platform);
  const method = getMethod(data.enrollment_method);
  const timeline = computeTimeline(data, now);
  const economics = computeEconomics(data);
  const assessment = assessIndicators(data.indicators);
  const proof = readiness({ items: data.evidence });
  const recommendations = buildRecommendations(data, timeline, economics, proof, assessment);

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    platform_note: platform.note,
    store_name: data.store_name,
    store_id: data.store_id,
    product_name: data.product_name,
    campaign_name: data.campaign_name,
    method: method,
    timeline: timeline,
    economics: economics,
    assessment: assessment,
    readiness: proof,
    indicators: INDICATORS.map((item) => Object.assign({}, item, { checked: data.indicators.indexOf(item.id) !== -1 })),
    evidence: proof.items,
    recommendations: recommendations,
    sources: SOURCES.slice(),
    disclaimer: 'Tool ini alat bantu audit, bukan nasihat hukum. Skor indikasi bersifat heuristik. Keputusan pendaftaran, harga, dan kompensasi tetap berada pada platform.',
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };
  const productName = cleanLine(data.product_name, 160);
  if (!productName) return { error: 'Nama produk wajib diisi' };
  const campaignName = cleanLine(data.campaign_name, 140);
  if (!campaignName) return { error: 'Nama kampanye wajib diisi' };

  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const problem = getProblem(data.problem);
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const contact = cleanLine(data.contact, 120) || '-';
  const ticket = cleanLine(data.ticket, 120) || '-';
  const chronology = cleanBlock(data.chronology) || 'Saya menemukan produk terdaftar di kampanye pada tanggal ' + formatDateID(todayISO(now)) + ' tanpa catatan pendaftaran yang saya ketahui.';
  const e = analyzed.economics;
  const t = analyzed.timeline;
  const method = analyzed.method;

  const subject = 'Permintaan audit pendaftaran kampanye dan bukti persetujuan - ' + storeName + ' - ' + productName;
  const lines = [
    'Kepada Tim Layanan Penjual ' + analyzed.platform_name + ',',
    '',
    'Saya, ' + sellerName + ', pemilik toko ' + storeName + (analyzed.store_id ? ' (' + analyzed.store_id + ')' : '') + ', meminta audit pendaftaran produk berikut ke kampanye.',
    '',
    'Data penjual:',
    '- Platform: ' + analyzed.platform_name,
    '- Nama toko: ' + storeName,
    '- Kontak: ' + contact,
    '- Nomor tiket sebelumnya: ' + ticket,
    '',
    'Data produk dan kampanye:',
    '- Produk: ' + productName,
    '- Kampanye: ' + campaignName,
    '- Periode kampanye: ' + t.campaign_start_label + ' sampai ' + t.campaign_end_label,
    '- Harga normal yang saya tetapkan: ' + formatRupiah(e.normal_price),
    '- Harga kampanye yang tercatat: ' + formatRupiah(e.campaign_price),
    '- Harga yang saya terima per unit: ' + formatRupiah(e.seller_price),
    '- Selisih harga per unit: ' + formatRupiah(e.discount_per_unit) + ' (' + e.discount_pct + '%)',
    '- Jumlah unit terjual selama kampanye: ' + e.units_sold,
    '- Estimasi dampak finansial: ' + formatRupiah(e.total_loss) + ' (perkiraan dari input saya)',
    '',
    'Cara pendaftaran yang saya ketahui: ' + method.label + '.',
    'Masalah yang saya ajukan: ' + problem.label + '.',
    '',
    'Kronologi:',
    chronology,
    '',
    'Indikasi yang saya temukan:',
  ];

  if (analyzed.assessment.selected.length > 0) {
    analyzed.assessment.selected.forEach((item) => lines.push('- ' + item));
  } else {
    lines.push('- Belum ada indikasi yang saya centang. Saya tetap meminta bukti pendaftaran untuk verifikasi.');
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
  lines.push('1. Tunjukkan catatan pendaftaran produk ini: waktu pendaftaran, kanal yang dipakai, akun yang menyetujui, dan harga yang diajukan.');
  lines.push('2. Tunjukkan bukti persetujuan saya, baik berupa pop-up, email, inbox, WhatsApp, maupun klik persetujuan, beserta waktu kejadiannya.');
  lines.push('3. Jelaskan dasar penetapan harga kampanye dan siapa yang menanggung selisih diskon.');
  lines.push('4. Hentikan keikutsertaan produk ini dan konfirmasi tertulis bila saya tidak pernah menyetujui pendaftaran.');
  lines.push('5. Verifikasi dampak finansial bersama saya memakai ekspor transaksi dan rincian settlement.');
  lines.push('6. Berikan nomor tiket dan waktu tanggap atau SLA penyelesaian.');
  lines.push('');
  lines.push('Saya memahami Permendag 19/2026 mewajibkan informasi biaya yang transparan, perjanjian tertulis atau kontrak elektronik untuk biaya yang disepakati, dan layanan pengaduan dengan waktu tanggap. Saya meminta penjelasan tertulis berdasarkan ketentuan tersebut.');
  lines.push('Saya juga memahami keputusan audit berada pada ' + analyzed.platform_name + '. Saya bersedia mengirim data tambahan yang diperlukan.');
  lines.push('');
  lines.push('Hormat saya,');
  lines.push(sellerName);
  lines.push(contact);
  lines.push(formatDateID(todayISO(now)));

  return {
    subject: subject,
    body: lines.join('\n'),
    timeline: t,
    economics: e,
    assessment: analyzed.assessment,
    readiness: analyzed.readiness,
  };
}

function buildExample(now = new Date()) {
  const end = todayISO(now);
  const start = addDays(end, -19);
  const discovered = addDays(end, -6);
  const followup = addDays(end, -2);
  return {
    platform: 'tiktok',
    enrollment_method: 'popup',
    campaign_name: 'Voucher Boost Campaign Payday September 2026',
    campaign_start: start,
    campaign_end: addDays(end, 4),
    normal_price: 35900,
    campaign_price: 22410,
    seller_price: 22410,
    hpp: 18000,
    fee_rate: 10,
    units_sold: 6870,
    product_name: 'Sandal Slipper Premium Wanita Pria Unisex',
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-2026',
    discovered_date: discovered,
    followup_date: followup,
    problem: 'harga_turun',
    chronology: 'Saya melihat pesanan naik pada momen payday dan mengira itu efek iklan. Pada tanggal temuan saya memeriksa halaman kampanye dan menemukan produk terdaftar dengan harga yang lebih rendah tanpa catatan pendaftaran yang saya ingat.',
    note: 'Contoh ilustrasi. Nominal dan nama toko adalah contoh, bukan data nyata.',
    indicators: ['no_registration_record', 'price_differs', 'no_notification', 'popup_claim', 'no_consent_log', 'sales_spike'],
    evidence: ['price_screenshot', 'campaign_page', 'transaction_export', 'campaign_notification', 'chat_rm', 'price_history', 'ads_live_data', 'settlement', 'timeline'],
  };
}

function validateCase(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  if (!data.store_name) return { error: 'Nama toko wajib diisi' };
  if (!data.product_name) return { error: 'Nama produk wajib diisi' };
  if (!data.campaign_name) return { error: 'Nama kampanye wajib diisi' };

  const status = getStatus(input.case_status || input.status || 'baru');
  return {
    item: {
      platform: data.platform,
      enrollment_method: data.enrollment_method,
      campaign_name: data.campaign_name,
      campaign_start: data.campaign_start,
      campaign_end: data.campaign_end,
      normal_price: data.normal_price,
      campaign_price: data.campaign_price,
      seller_price: data.seller_price,
      hpp: data.hpp,
      fee_rate: data.fee_rate,
      units_sold: data.units_sold,
      product_name: data.product_name,
      store_name: data.store_name,
      store_id: data.store_id,
      status: status.id,
      ticket: data.ticket,
      discovered_date: data.discovered_date,
      followup_date: data.followup_date,
      problem: data.problem,
      indicators: data.indicators,
      evidence: data.evidence,
      note: data.note,
    },
  };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const analyzed = analyze(data, now);
  const status = getStatus(data.status || 'baru');
  const flags = [];

  if (analyzed.error) {
    return Object.assign({}, data, {
      error: analyzed.error,
      flags: [analyzed.error],
      flags_count: 1,
    });
  }

  const timeline = analyzed.timeline;
  const hasConsentProof = (data.evidence || []).indexOf('consent_proof') !== -1;
  if (timeline.phase === 'berjalan' && !hasConsentProof) {
    flags.push('Kampanye masih berjalan dan bukti persetujuan belum dicatat. Minta penghentian produk hari ini.');
  }
  if (timeline.followup_age !== null && timeline.followup_age > 14 && status.open) {
    flags.push('Follow-up terakhir ' + timeline.followup_age + ' hari lalu. Kirim eskalasi tertulis.');
  }
  if (status.open && timeline.phase === 'selesai') {
    flags.push('Kampanye sudah selesai tetapi kasus masih terbuka. Fokus pada audit log dan kompensasi.');
  }
  if (status.id === 'dilaporkan' && !data.ticket) {
    flags.push('Status sudah dilaporkan tetapi nomor tiket belum dicatat.');
  }
  if (analyzed.economics.units_sold === 0) {
    flags.push('Jumlah unit terjual belum diisi, dampak finansial belum bisa dinilai.');
  }
  if (analyzed.assessment.score >= 75) {
    flags.push('Indikasi pendaftaran tanpa persetujuan sangat tinggi. Minta bukti persetujuan tertulis.');
  }
  if (timeline.days_since_discovered !== null && timeline.days_since_discovered > 30) {
    flags.push('Temuan sudah ' + timeline.days_since_discovered + ' hari lalu. Simpan bukti sebelum berubah.');
  }

  return Object.assign({}, analyzed, {
    id: data.id || '',
    created_at: data.created_at || '',
    case_status: status.id,
    case_status_label: status.label,
    open: status.open,
    ticket: data.ticket || '',
    discovered_date: data.discovered_date || '',
    followup_date: data.followup_date || '',
    note: data.note || '',
    flags: flags,
    flags_count: flags.length,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const open = views.filter((item) => item.open);
  const active = views.filter((item) => item.timeline && item.timeline.phase === 'berjalan');
  const reported = views.filter((item) => item.case_status === 'dilaporkan' || item.case_status === 'menunggu_jawaban');

  let totalLoss = 0;
  let openLoss = 0;
  let totalUnits = 0;
  let highestScore = 0;
  views.forEach((item) => {
    if (item.economics) {
      totalLoss += item.economics.total_loss;
      totalUnits += item.economics.units_sold;
      if (item.open) openLoss += item.economics.total_loss;
    }
    if (item.assessment && item.assessment.score > highestScore) highestScore = item.assessment.score;
  });

  let nearestEnd = null;
  open.forEach((item) => {
    if (!item.timeline) return;
    const left = item.timeline.days_to_end;
    if (left === null || left < 0) return;
    if (nearestEnd === null || left < nearestEnd) nearestEnd = left;
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    active_cases: active.length,
    reported_cases: reported.length,
    total_units: totalUnits,
    total_loss: Math.round(totalLoss),
    open_loss: Math.round(openLoss),
    highest_score: highestScore,
    nearest_end_days: nearestEnd,
  };
}

function meta() {
  return {
    platforms: PLATFORMS,
    enrollment_methods: ENROLLMENT_METHODS,
    indicators: INDICATORS,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    problems: PROBLEMS,
    sources: SOURCES,
    defaults: DEFAULTS,
  };
}

module.exports = {
  analyze,
  assessIndicators,
  buildExample,
  buildLetter,
  caseView,
  computeEconomics,
  computeTimeline,
  daysBetween,
  addDays,
  formatDateID,
  formatRupiah,
  getMethod,
  getStatus,
  readiness,
  summary,
  todayISO,
  validateCase,
  meta,
  DEFAULTS,
  ENROLLMENT_METHODS,
  EVIDENCE,
  INDICATORS,
  PLATFORMS,
  PROBLEMS,
  SOURCES,
  CASE_STATUSES,
};
