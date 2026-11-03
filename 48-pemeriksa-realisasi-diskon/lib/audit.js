'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const EFFECTIVE_DATE = '2026-10-25';
const KEPMEN_DATE = '2026-09-25';
const DISCOUNT_MIN = 50;
const PULL_WORKING_DAYS = 5;
const VERIFY_WORKING_DAYS = 10;
const TOTAL_WORKING_DAYS = PULL_WORKING_DAYS + VERIFY_WORKING_DAYS;
const IDENTIFIED_SELLERS = 42000;
const SERVICE_FEE_MIN = 10;
const SERVICE_FEE_MAX = 18;

const PLATFORMS = [
  {
    id: 'shopee',
    label: 'Shopee',
    note: 'Cocokkan baris potongan biaya layanan di Seller Center dan invoice. Nama komponen bisa berbeda per platform.',
  },
  {
    id: 'tokopedia',
    label: 'Tokopedia',
    note: 'Cocokkan baris potongan biaya layanan di Seller Center dan invoice. Nama komponen bisa berbeda per platform.',
  },
  {
    id: 'tiktok',
    label: 'TikTok Shop by Tokopedia',
    note: 'Cocokkan baris potongan biaya layanan di Seller Center dan invoice. Biaya iklan dan promosi bukan bagian biaya layanan dasar yang dipotong 50 persen.',
  },
  {
    id: 'lazada',
    label: 'Lazada',
    note: 'Cocokkan baris potongan biaya layanan di Seller Center dan invoice. Nama komponen bisa berbeda per platform.',
  },
  {
    id: 'blibli',
    label: 'Blibli',
    note: 'Cocokkan baris potongan biaya layanan di Seller Center dan invoice. Nama komponen bisa berbeda per platform.',
  },
  {
    id: 'lain',
    label: 'Marketplace lain',
    note: 'Isi semua angka dari invoice dan Seller Center platform Anda. Tool ini tidak memakai tarif bawaan platform mana pun.',
  },
];

const SCALES = [
  { id: 'mikro', label: 'Mikro', eligible: true, note: 'Modal sampai Rp 1 miliar atau penjualan tahunan sampai Rp 2 miliar, tidak termasuk tanah dan bangunan.' },
  { id: 'kecil', label: 'Kecil', eligible: true, note: 'Modal di atas Rp 1 miliar sampai Rp 5 miliar atau penjualan tahunan di atas Rp 2 miliar sampai Rp 15 miliar.' },
  { id: 'menengah', label: 'Menengah', eligible: false, note: 'Di luar cakupan insentif UMK. Insentif hanya untuk usaha mikro dan kecil.' },
  { id: 'besar', label: 'Besar', eligible: false, note: 'Di luar cakupan insentif UMK. Insentif hanya untuk usaha mikro dan kecil.' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
];

const REQUIREMENTS = [
  { id: 'skala', label: 'Skala usaha mikro atau kecil', hard: true },
  { id: 'produk_lokal', label: 'Hanya menjual produk dalam negeri', hard: true },
  { id: 'sapa', label: 'Terdaftar dan mengajukan lewat SAPA UMKM', hard: true },
  { id: 'high_risk', label: 'Bukan pengguna platform berisiko tinggi', hard: true },
  { id: 'rekam_jejak', label: 'Rekam jejak usaha baik dan tidak menyalahgunakan fasilitas', hard: true },
  { id: 'verifikasi', label: 'Lolos verifikasi platform', hard: false },
];

const MANUAL_SIGNALS = [
  { id: 'cs_template', label: 'CS hanya membalas dengan jawaban template', weight: 6 },
  { id: 'tanpa_pemberitahuan', label: 'Tidak ada pemberitahuan tertulis saat pengajuan diterima atau ditolak', weight: 8 },
  { id: 'alasan_tidak_rinci', label: 'Alasan penolakan tidak menyebut syarat yang belum dipenuhi', weight: 8 },
  { id: 'sebagian_sku', label: 'Diskon hanya muncul di sebagian SKU yang diajukan', weight: 10 },
  { id: 'settlement_tidak_rinci', label: 'Settlement tidak memisahkan komponen biaya layanan dan diskon', weight: 8 },
  { id: 'tiket_ditutup', label: 'Tiket sebelumnya ditutup tanpa koreksi atau penjelasan', weight: 8 },
];

const AUTO_SIGNALS = [
  { id: 'diskon_tidak_ada', label: 'Biaya layanan yang ditagih sama dengan dasar sebelum diskon', weight: 22 },
  { id: 'diskon_sebagian', label: 'Diskon terlihat, tetapi realisasinya di bawah potongan yang seharusnya', weight: 14 },
  { id: 'gap_besar', label: 'Selisih mencapai 5 persen atau lebih dari biaya layanan dasar', weight: 15 },
  { id: 'fee_lebih_basis', label: 'Biaya layanan yang ditagih lebih tinggi dari dasar sebelum diskon', weight: 20 },
  { id: 'lewat_15_hari', label: 'Sudah lewat 15 hari kerja sejak data seharusnya ditarik platform', weight: 18 },
  { id: 'belum_verifikasi', label: 'Pengajuan belum dinyatakan lolos verifikasi', weight: 10 },
  { id: 'tarik_belum', label: 'Belum melewati 5 hari kerja penarikan data dari SAPA UMKM', weight: 6 },
  { id: 'produk_impor', label: 'Toko tidak hanya menjual produk dalam negeri', weight: 25 },
  { id: 'skala_besar', label: 'Skala usaha menengah atau besar, di luar cakupan insentif', weight: 25 },
  { id: 'high_risk', label: 'Akun termasuk pengguna platform berisiko tinggi', weight: 25 },
  { id: 'sapa_belum', label: 'Belum terdaftar atau belum mengajukan lewat SAPA UMKM', weight: 25 },
  { id: 'rekam_jejak', label: 'Rekam jejak usaha belum memenuhi syarat', weight: 20 },
  { id: 'bukti_kurang', label: 'Bukti kritis belum lengkap', weight: 10 },
  { id: 'tarif_luar_kisaran', label: 'Tarif biaya layanan di luar kisaran 10 sampai 18 persen yang disebut Kementerian UMKM', weight: 6 },
];

const EVIDENCE = [
  { id: 'sapa_account', label: 'Tangkapan layar akun SAPA UMKM dan status pengajuan', critical: true, group: 'Pengajuan' },
  { id: 'verification_notice', label: 'Bukti verifikasi atau persetujuan dari platform', critical: true, group: 'Verifikasi' },
  { id: 'settlement_after', label: 'Rincian settlement setelah tanggal aktif, lengkap dengan baris diskon', critical: true, group: 'Settlement' },
  { id: 'fee_basis_proof', label: 'Bukti biaya layanan dasar sebelum diskon dari invoice atau kartu tarif', critical: true, group: 'Settlement' },
  { id: 'sku_list', label: 'Daftar SKU yang diajukan dan SKU yang disetujui', critical: true, group: 'Produk' },
  { id: 'fee_breakdown', label: 'Rincian komponen biaya layanan: admin, komisi, atau jasa aplikasi', critical: false, group: 'Settlement' },
  { id: 'settlement_before', label: 'Settlement sebelum tanggal aktif untuk pembanding', critical: false, group: 'Settlement' },
  { id: 'rate_card', label: 'Kartu tarif kategori produk yang berlaku', critical: false, group: 'Settlement' },
  { id: 'domestic_proof', label: 'Bukti produk dalam negeri: NIB, sertifikat, atau foto produksi', critical: false, group: 'Produk' },
  { id: 'ticket_number', label: 'Nomor tiket atau nomor pengaduan sebelumnya', critical: false, group: 'Komunikasi' },
  { id: 'chat_history', label: 'Riwayat chat dengan CS dan jawabannya', critical: false, group: 'Komunikasi' },
  { id: 'sapa_timeline', label: 'Riwayat status pengajuan di SAPA UMKM', critical: false, group: 'Pengajuan' },
  { id: 'bank_statement', label: 'Mutasi pencairan atau laporan keuangan toko', critical: false, group: 'Settlement' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru ditemukan', open: true },
  { id: 'menunggu_verifikasi', label: 'Menunggu verifikasi platform', open: true },
  { id: 'aktif_cek', label: 'Aktif, cek settlement berikutnya', open: true },
  { id: 'keberatan_dikirim', label: 'Keberatan dikirim', open: true },
  { id: 'eskalasi', label: 'Eskalasi ke SAPA UMKM', open: true },
  { id: 'selesai', label: 'Selesai dan diskon diterapkan', open: false },
  { id: 'ditolak', label: 'Ditolak platform', open: true },
];

const LETTER_TYPES = [
  { id: 'status', label: 'Permintaan status verifikasi insentif' },
  { id: 'keberatan', label: 'Keberatan diskon belum diterapkan penuh' },
  { id: 'eskalasi', label: 'Permohonan fasilitasi ke Kementerian UMKM' },
];

const SOURCES = [
  {
    title: 'Diskon 50 Persen Biaya Admin Lokapasar: UMKM Minta Otomatis, Platform Butuh Transisi',
    publisher: 'Kompas.id',
    date: '2026-10-27',
    url: 'https://www.kompas.id/artikel/50-percent-discount-on-admin-fees-for-marketplaces-msmes-request-automatic-platform-transition',
    note: 'Kebijakan berlaku 25 Oktober 2026. SAPA UMKM baru mulai berjalan pada tanggal itu, sehingga sosialisasi dan transisi masih berlangsung. Mekanisme teknis mengacu Kepmen UMKM 398/2026. Usaha kecil didefinisikan dengan modal di atas Rp 1 miliar sampai Rp 5 miliar atau penjualan tahunan di atas Rp 2 miliar sampai Rp 15 miliar.',
  },
  {
    title: 'idEA Sambut Diskon Biaya Admin E-Commerce 50%, Minta Masa Transisi',
    publisher: 'Bisnis.com',
    date: '2026-10-26',
    url: 'https://ekonomi.bisnis.com/read/20261026/12/2015811/idea-sambut-diskon-biaya-admin-e-commerce-50-minta-masa-transisi',
    note: 'Kementerian UMKM memberlakukan insentif potongan biaya layanan paling sedikit 50 persen untuk UMK penjual produk dalam negeri mulai 25 Oktober 2026. idEA meminta masa transisi dan menyebut verifikasi dilakukan platform sesuai ketentuan.',
  },
  {
    title: 'Diskon 50% Biaya Layanan Marketplace Berlaku 25 Oktober 2026: Alur dan Jadwal Verifikasinya',
    publisher: 'UKMINDONESIA.ID',
    date: '2026-10-25',
    url: 'https://ukmindonesia.id/baca-deskripsi-posts/diskon-50-biaya-layanan-marketplace-berlaku-25-oktober-2026-alur-dan-jadwal-verifikasinya',
    note: 'Potongan tidak langsung aktif. Pengajuan lewat SAPA UMKM harus lolos dua tahap verifikasi. Dalam skenario terlama, jarak dari pengajuan sampai potongan aktif sekitar tiga minggu, belum termasuk lama verifikasi di SAPA UMKM. Komponen yang dipotong adalah biaya administrasi, komisi, atau biaya aplikasi dasar toko. Jika toko banyak memakai iklan, penghematan terasa lebih kecil.',
  },
  {
    title: 'Angin Segar! Pemerintah Pangkas Biaya Marketplace 50 Persen, UMKM Berharap Keuntungan Pedagang Kecil Meningkat',
    publisher: 'Industry.co.id',
    date: '2026-11-02',
    url: 'https://www.industry.co.id/tag/biaya-marketplace-50-persen',
    note: 'Pemberitaan 2 November 2026 menegaskan kebijakan masih menjadi harapan bagi pedagang kecil. Ini menunjukkan kesenjangan antara aturan yang sudah berlaku dan realisasi yang dirasakan seller.',
  },
  {
    title: 'UMKM dapat potongan biaya marketplace 50 persen mulai 25 Oktober',
    publisher: 'ANTARA News',
    date: '2026-10-16',
    url: 'https://www.antaranews.com/berita/5792173/umkm-dapat-potongan-biaya-marketplace-50-persen-mulai-25-oktober',
    note: 'Insentif mencakup potongan biaya administrasi, komisi, atau biaya aplikasi dasar toko. Syarat: skala mikro atau kecil, hanya produk dalam negeri, tidak memanipulasi transaksi, rekam jejak baik. Platform memverifikasi data paling lama 10 hari kalender sejak menerima data melalui SAPA UMKM.',
  },
  {
    title: 'UMK Lokal Dapat Diskon 50% Biaya Administrasi Toko Online Selamanya',
    publisher: 'detikFinance',
    date: '2026-10-22',
    url: 'https://finance.detik.com/berita-ekonomi-bisnis/d-8719617/umk-lokal-dapat-diskon-50-biaya-administrasi-toko-online-selamanya',
    note: 'Kebijakan berlaku permanen selama pelaku masih usaha mikro atau kecil dan menjual produk dalam negeri. Kepmen UMKM ditandatangani 25 September 2026. Mekanisme: platform mengambil data dari SAPA UMKM dalam 5 hari kerja, lalu diberi waktu maksimal 10 hari untuk verifikasi.',
  },
  {
    title: 'Diskon Biaya Layanan E-commerce 50 Persen untuk UMKM Ditargetkan Berlaku Akhir Oktober',
    publisher: 'Kompas.com',
    date: '2026-10-07',
    url: 'https://money.kompas.com/read/2026/10/07/194144626/diskon-biaya-layanan-e-commerce-50-persen-untuk-umkm-ditargetkan-berlaku-akhir',
    note: 'Kementerian UMKM mencatat sekitar 42.000 seller e-commerce teridentifikasi menjual produk lokal. Insentif hanya untuk usaha mikro dan kecil dengan omzet maksimal Rp 15 miliar per tahun.',
  },
  {
    title: 'Pedagang Online UMK Bakal Dapat Diskon Biaya Admin E-Commerce 50%',
    publisher: 'CNN Indonesia',
    date: '2026-09-01',
    url: 'https://www.cnnindonesia.com/ekonomi/20260901200031-532-1398896/pedagang-online-umk-bakal-dapat-diskon-biaya-admin-e-commerce-50',
    note: 'Contoh yang disebut Menteri UMKM: dari biaya layanan sekitar Rp 20.000 pada transaksi Rp 100.000, porsi biaya administrasi umumnya 40 sampai 50 persen atau sekitar Rp 8.000 sampai Rp 10.000. Karena cakupan komponen bisa berbeda, tool ini meminta angka dasar diskon dari invoice, bukan menebak dari persentase total.',
  },
  {
    title: 'Permen UMKM 3/2026 Isyaratkan Marketplace Pangkas Biaya Layanan 50% untuk Usaha Mikro dan Kecil',
    publisher: 'DailySocial.ID',
    date: '2026-06-23',
    url: 'https://news.dailysocial.id/post/permen-umkm-3-2026-isyaratkan-marketplace-pangkas-biaya-layanan-50-untuk-usaha-mikro-dan-kecil',
    note: 'Pasal 15 ayat (1) mewajibkan PPMSE yang bukan UMKM memberi insentif potongan biaya layanan kepada UMK terverifikasi untuk setiap transaksi penjualan produk dalam negeri. Insentif dapat ditolak atau dihentikan bila UMK menjual produk selain produk dalam negeri, dengan ruang klarifikasi atau keberatan.',
  },
  {
    title: 'Kepmen Diskon 50 Persen Biaya Layanan Marketplace untuk UMKM Terbit Pekan Ini',
    publisher: 'Radar Surabaya Bisnis',
    date: '2026-08-13',
    url: 'https://radarsurabayabisnis.jawapos.com/industri-perdagangan/2608130008/kepmen-diskon-50-persen-biaya-layanan-marketplace-untuk-umkm-terbit-pekan-ini',
    note: 'Deputi Bidang Usaha Kecil Kementerian UMKM menyebut biaya layanan yang dibebankan marketplace kepada penjual bervariasi antara 10 sampai 18 persen dari nilai transaksi, belum termasuk biaya promosi dan iklan. Angka ini dipakai hanya sebagai kisaran pembanding, bukan tarif bawaan.',
  },
];

const DEFAULTS = {
  platform: 'shopee',
  scale: 'mikro',
  domestic: 'ya',
  sapa: 'ya',
  verified: 'ya',
  high_risk: 'tidak',
  record: 'ya',
  discount_pct: DISCOUNT_MIN,
  periods_per_year: 12,
  letter_type: 'status',
  status: 'baru',
};

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function addBusinessDays(iso, days) {
  const start = dateFromISO(iso);
  if (!start) return '';
  const date = new Date(start.getTime());
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date)) added += 1;
  }
  return isoFromDate(date);
}

function businessDaysBetween(from, to) {
  const start = dateFromISO(from);
  const end = dateFromISO(to);
  if (!start || !end) return 0;
  if (end < start) return 0;
  const date = new Date(start.getTime());
  let count = 0;
  while (date < end) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date)) count += 1;
  }
  return count;
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

function getScale(id) {
  return SCALES.find((item) => item.id === id) || SCALES[0];
}

function getRequirement(id) {
  return REQUIREMENTS.find((item) => item.id === id);
}

function getManualSignal(id) {
  return MANUAL_SIGNALS.find((item) => item.id === id);
}

function getAutoSignal(id) {
  return AUTO_SIGNALS.find((item) => item.id === id);
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id);
}

function getCaseStatus(id) {
  return CASE_STATUSES.find((item) => item.id === id) || CASE_STATUSES[0];
}

function getLetterType(id) {
  return LETTER_TYPES.find((item) => item.id === id) || LETTER_TYPES[0];
}

function yesNo(value) {
  return value === 'ya' || value === true ? 'ya' : 'tidak';
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
  const scale = getScale(data.scale);
  const today = todayISO(now);

  const periodStart = parseISO(data.period_start);
  if (!periodStart) return { error: 'Tanggal awal periode wajib diisi dengan format YYYY-MM-DD' };
  if (periodStart > today) return { error: 'Tanggal awal periode tidak boleh melewati hari ini' };

  const periodEnd = parseISO(data.period_end);
  if (!periodEnd) return { error: 'Tanggal akhir periode wajib diisi dengan format YYYY-MM-DD' };
  if (periodEnd > today) return { error: 'Tanggal akhir periode tidak boleh melewati hari ini' };
  if (daysBetween(periodStart, periodEnd) < 0) return { error: 'Tanggal akhir periode tidak boleh sebelum tanggal awal' };

  const applicationDate = parseISO(data.application_date);
  if (String(data.application_date || '').trim() && !applicationDate) return { error: 'Tanggal pengajuan SAPA UMKM tidak valid' };
  if (applicationDate && applicationDate > today) return { error: 'Tanggal pengajuan tidak boleh melewati hari ini' };
  if (applicationDate && applicationDate < EFFECTIVE_DATE) {
    // Pengajuan sebelum tanggal efektif tetap dicatat, fase dihitung dari tanggal efektif.
  }

  const verifiedDate = parseISO(data.verified_date);
  if (String(data.verified_date || '').trim() && !verifiedDate) return { error: 'Tanggal verifikasi tidak valid' };
  if (verifiedDate && verifiedDate > today) return { error: 'Tanggal verifikasi tidak boleh melewati hari ini' };
  if (verifiedDate && applicationDate && daysBetween(applicationDate, verifiedDate) < 0) {
    return { error: 'Tanggal verifikasi tidak boleh sebelum tanggal pengajuan' };
  }

  const followupDate = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followupDate) return { error: 'Tanggal follow-up terakhir tidak valid' };
  if (followupDate && followupDate > today) return { error: 'Tanggal follow-up terakhir tidak boleh melewati hari ini' };

  const grossSales = num(data.gross_sales);
  const feeRate = num(data.fee_rate);
  const feeBasis = num(data.fee_basis);
  const discountPct = num(data.discount_pct);
  const actualFee = num(data.actual_fee);
  const periodsPerYear = num(data.periods_per_year);

  if (grossSales < 0) return { error: 'Omzet periode tidak boleh negatif' };
  if (feeRate < 0 || feeRate >= 100) return { error: 'Tarif biaya layanan harus 0 sampai kurang dari 100 persen' };
  if (feeBasis < 0) return { error: 'Biaya layanan dasar tidak boleh negatif' };
  if (feeBasis <= 0 && (grossSales <= 0 || feeRate <= 0)) {
    return { error: 'Isi biaya layanan dasar, atau isi omzet dan tarif agar dasar bisa dihitung' };
  }
  if (discountPct <= 0 || discountPct > 100) return { error: 'Persentase diskon harus lebih dari 0 sampai 100 persen' };
  if (actualFee < 0) return { error: 'Biaya layanan yang ditagih tidak boleh negatif' };
  if (!Number.isInteger(periodsPerYear) || periodsPerYear < 1 || periodsPerYear > 366) {
    return { error: 'Jumlah periode per tahun harus bilangan bulat 1 sampai 366' };
  }

  const verifiedFlag = yesNo(data.verified);
  const verified = verifiedFlag === 'ya' || (!!verifiedDate && (data.verified === undefined || data.verified === null || data.verified === ''));

  return {
    data: {
      platform: platform.id,
      scale: scale.id,
      domestic: yesNo(data.domestic),
      sapa: yesNo(data.sapa),
      verified: verified ? 'ya' : 'tidak',
      high_risk: yesNo(data.high_risk),
      record: yesNo(data.record),
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      seller_name: cleanLine(data.seller_name, 120),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      period_start: periodStart,
      period_end: periodEnd,
      application_date: applicationDate || '',
      verified_date: verifiedDate || '',
      followup_date: followupDate || '',
      gross_sales: round2(grossSales),
      fee_rate: round2(feeRate),
      fee_basis: round2(feeBasis),
      discount_pct: round2(discountPct),
      actual_fee: round2(actualFee),
      periods_per_year: periodsPerYear,
      chronology: cleanBlock(data.chronology),
      note: cleanBlock(data.note),
      status: getCaseStatus(data.status).id,
      letter_type: getLetterType(data.letter_type).id,
      manual_signals: normalizeList(data.manual_signals || data.signals, getManualSignal),
      evidence: normalizeList(data.evidence || data.items, getEvidence),
    },
  };
}

function computeTotals(data) {
  const estimatedBasis = data.fee_basis > 0 ? false : true;
  const basis = estimatedBasis
    ? Math.round(data.gross_sales * (data.fee_rate / 100))
    : Math.round(data.fee_basis);
  const expectedFee = Math.round(basis * (1 - data.discount_pct / 100));
  const expectedDiscount = basis - expectedFee;
  const actualFee = Math.round(data.actual_fee);
  const actualDiscount = basis - actualFee;
  const actualDiscountPct = basis > 0 ? round1((actualDiscount / basis) * 100) : 0;
  const gap = actualFee - expectedFee;
  const gapPct = basis > 0 ? round1((gap / basis) * 100) : 0;
  const realizationPct = expectedDiscount > 0 ? round1((actualDiscount / expectedDiscount) * 100) : 0;
  const tolerance = Math.max(100, Math.round(expectedFee * 0.01));

  let code = 'sesuai';
  let label = 'Diskon sesuai perkiraan';
  if (gap > tolerance) {
    code = 'kurang';
    label = actualDiscount <= tolerance ? 'Diskon belum terlihat' : 'Diskon diterapkan sebagian';
  } else if (gap < -tolerance) {
    code = 'lebih';
    label = 'Diskon lebih besar dari perkiraan';
  }

  const leakPerPeriod = Math.max(0, gap);
  const annualLeak = leakPerPeriod * data.periods_per_year;
  const expectedAnnualSaving = expectedDiscount * data.periods_per_year;
  const actualAnnualSaving = Math.max(0, actualDiscount) * data.periods_per_year;

  return {
    basis: basis,
    basis_source: estimatedBasis ? 'estimated' : 'input',
    basis_source_label: estimatedBasis ? 'Perkiraan dari omzet dan tarif' : 'Diisi dari invoice',
    gross_sales: Math.round(data.gross_sales),
    fee_rate: data.fee_rate,
    discount_pct: data.discount_pct,
    expected_fee: expectedFee,
    expected_discount: expectedDiscount,
    actual_fee: actualFee,
    actual_discount: actualDiscount,
    actual_discount_pct: actualDiscountPct,
    realization_pct: realizationPct,
    gap: gap,
    gap_pct: gapPct,
    tolerance: tolerance,
    code: code,
    label: label,
    leak_per_period: leakPerPeriod,
    annual_leak: annualLeak,
    expected_annual_saving: expectedAnnualSaving,
    actual_annual_saving: actualAnnualSaving,
    periods_per_year: data.periods_per_year,
    effective_date: EFFECTIVE_DATE,
    discount_min: DISCOUNT_MIN,
  };
}

function computePhase(data, now = new Date()) {
  const today = todayISO(now);
  const baseline = data.application_date && data.application_date > EFFECTIVE_DATE
    ? data.application_date
    : EFFECTIVE_DATE;
  const applicationLabel = data.application_date ? formatDateID(data.application_date) : '-';
  const base = {
    application_date: data.application_date,
    application_date_label: applicationLabel,
    baseline_date: baseline,
    baseline_date_label: formatDateID(baseline),
    pull_deadline: data.application_date ? addBusinessDays(baseline, PULL_WORKING_DAYS) : '',
    active_deadline: data.application_date ? addBusinessDays(baseline, TOTAL_WORKING_DAYS) : '',
    verified_date: data.verified_date,
    verified_date_label: data.verified_date ? formatDateID(data.verified_date) : '-',
    business_days: 0,
    days_remaining: TOTAL_WORKING_DAYS,
    pull_working_days: PULL_WORKING_DAYS,
    verify_working_days: VERIFY_WORKING_DAYS,
    total_working_days: TOTAL_WORKING_DAYS,
    effective_date: EFFECTIVE_DATE,
    effective_date_label: formatDateID(EFFECTIVE_DATE),
    note: 'Hari kerja dihitung Senin sampai Jumat tanpa memperhitungkan hari libur nasional.',
  };

  if (today < EFFECTIVE_DATE) {
    return Object.assign(base, {
      code: 'before_effective',
      label: 'Kebijakan belum berlaku',
      tone: 'signal',
      detail: 'Tanggal efektif kebijakan adalah ' + formatDateID(EFFECTIVE_DATE) + '. Hitung lagi setelah tanggal tersebut.',
    });
  }

  if (data.verified === 'ya') {
    return Object.assign(base, {
      code: 'verified',
      label: 'Verifikasi tercatat lolos',
      tone: 'ok',
      detail: data.verified_date
        ? 'Verifikasi tercatat pada ' + formatDateID(data.verified_date) + '. Periksa settlement setelah tanggal tersebut untuk memastikan diskon benar-benar diterapkan.'
        : 'Verifikasi sudah dinyatakan lolos. Periksa settlement setelah tanggal verifikasi untuk memastikan diskon benar-benar diterapkan.',
    });
  }

  if (!data.application_date) {
    return Object.assign(base, {
      code: 'no_application',
      label: 'Belum ada pengajuan',
      tone: 'signal',
      detail: 'Diskon tidak otomatis. Ajukan lewat SAPA UMKM, lalu simpan bukti pengajuan sebelum menghitung selisih.',
    });
  }

  const businessDays = businessDaysBetween(baseline, today);
  const remaining = Math.max(0, TOTAL_WORKING_DAYS - businessDays);
  const withBase = Object.assign(base, {
    business_days: businessDays,
    days_remaining: remaining,
  });

  if (businessDays < PULL_WORKING_DAYS) {
    return Object.assign(withBase, {
      code: 'waiting_pull',
      label: 'Menunggu penarikan data',
      tone: 'signal',
      detail: 'Platform mengambil data dari SAPA UMKM dalam 5 hari kerja. Sisa ' + (PULL_WORKING_DAYS - businessDays) + ' hari kerja sebelum tahap verifikasi.',
    });
  }

  if (businessDays < TOTAL_WORKING_DAYS) {
    return Object.assign(withBase, {
      code: 'verifying',
      label: 'Verifikasi platform berjalan',
      tone: 'signal',
      detail: 'Verifikasi paling lama 10 hari kerja setelah data diterima. Sisa ' + remaining + ' hari kerja sebelum batas 15 hari kerja.',
    });
  }

  return Object.assign(withBase, {
    code: 'overdue',
    label: 'Melewati 15 hari kerja',
    tone: 'ember',
    detail: 'Batas 15 hari kerja sudah lewat tanpa catatan verifikasi. Minta status tertulis dan alasan keterlambatan sebelum mengajukan eskalasi. Angka ini belum memperhitungkan hari libur nasional.',
  });
}

function evaluateEligibility(data, phase) {
  const scale = getScale(data.scale);
  const items = [
    { id: 'skala', pass: scale.eligible === true, note: scale.eligible ? scale.note : 'Skala ' + scale.label + ' tidak termasuk cakupan UMK.' },
    { id: 'produk_lokal', pass: data.domestic === 'ya', note: data.domestic === 'ya' ? 'Produk yang diajukan hanya produk dalam negeri.' : 'Insentif hanya untuk produk dalam negeri.' },
    { id: 'sapa', pass: data.sapa === 'ya', note: data.sapa === 'ya' ? 'Pengajuan melalui SAPA UMKM tercatat.' : 'Pengajuan harus dibuat melalui SAPA UMKM.' },
    { id: 'high_risk', pass: data.high_risk !== 'ya', note: data.high_risk !== 'ya' ? 'Akun tidak termasuk pengguna berisiko tinggi.' : 'Pengguna berisiko tinggi tidak bisa mengajukan ulang sampai status berubah.' },
    { id: 'rekam_jejak', pass: data.record === 'ya', note: data.record === 'ya' ? 'Tidak ada catatan manipulasi transaksi atau penyalahgunaan fasilitas.' : 'Rekam jejak usaha harus baik dan bebas penyalahgunaan fasilitas.' },
    { id: 'verifikasi', pass: data.verified === 'ya', note: data.verified === 'ya' ? 'Verifikasi platform tercatat lolos.' : (phase && phase.code === 'overdue' ? 'Verifikasi belum tercatat meskipun batas 15 hari kerja sudah lewat.' : 'Verifikasi platform belum tercatat lolos.') },
  ];

  const described = items.map((item) => {
    const meta = getRequirement(item.id);
    return Object.assign({}, item, {
      label: meta.label,
      hard: meta.hard,
    });
  });

  const hardFailed = described.filter((item) => item.hard && !item.pass);
  const pending = described.filter((item) => !item.hard && !item.pass);
  let verdict = 'layak';
  let label = 'Memenuhi syarat insentif';
  if (hardFailed.length > 0) {
    verdict = 'tidak_layak';
    label = 'Belum memenuhi syarat';
  } else if (pending.length > 0) {
    verdict = 'menunggu_verifikasi';
    label = 'Syarat dasar terpenuhi, menunggu verifikasi';
  }

  return {
    verdict: verdict,
    label: label,
    items: described,
    hard_failed: hardFailed.map((item) => item.label),
    pending: pending.map((item) => item.label),
    note: 'Penilaian ini memakai jawaban yang Anda masukkan. Keputusan verifikasi dan pemberian insentif tetap berada pada platform dan Kementerian UMKM.',
  };
}

function detectSignals(data, calc, eligibility, phase) {
  const ids = [];
  const add = (id) => { if (getAutoSignal(id) && ids.indexOf(id) === -1) ids.push(id); };

  if (calc.actual_discount <= calc.tolerance) add('diskon_tidak_ada');
  if (calc.actual_discount > calc.tolerance && calc.gap > calc.tolerance) add('diskon_sebagian');
  if (calc.gap > 0 && calc.gap_pct >= 5) add('gap_besar');
  if (calc.actual_fee > calc.basis + 1) add('fee_lebih_basis');
  if (phase.code === 'overdue') add('lewat_15_hari');
  if (data.verified !== 'ya' && eligibility.verdict !== 'tidak_layak') add('belum_verifikasi');
  if (phase.code === 'waiting_pull') add('tarik_belum');
  if (data.domestic !== 'ya') add('produk_impor');
  if (!getScale(data.scale).eligible) add('skala_besar');
  if (data.high_risk === 'ya') add('high_risk');
  if (data.sapa !== 'ya') add('sapa_belum');
  if (data.record !== 'ya') add('rekam_jejak');
  if (readiness({ items: data.evidence }).missing_critical.length > 0) add('bukti_kurang');
  if (calc.basis_source === 'estimated' && data.fee_rate > 0 && (data.fee_rate < SERVICE_FEE_MIN || data.fee_rate > SERVICE_FEE_MAX)) add('tarif_luar_kisaran');

  return ids;
}

function assess(data, calc, eligibility, phase) {
  const autoIds = detectSignals(data, calc, eligibility, phase);
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
  } else if (score >= 25) {
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
    note: 'Skor ini heuristik dari angka yang Anda masukkan dan fakta yang Anda centang. Bukan putusan bahwa platform melanggar aturan. Cakupan komponen diskon bisa berbeda per platform, jadi cocokkan dengan invoice.',
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

function decide(calc, eligibility, phase, risk) {
  if (eligibility.verdict === 'tidak_layak') {
    return {
      code: 'belum_berhak',
      label: 'Belum berhak atas insentif',
      tone: 'signal',
      detail: 'Ada syarat yang belum terpenuhi: ' + eligibility.hard_failed.join(', ') + '. Lengkapi syarat terlebih dahulu. Keberatan diskon belum bisa diajukan hanya dari selisih angka.',
    };
  }
  if (phase.code === 'before_effective') {
    return {
      code: 'belum_berlaku',
      label: 'Kebijakan belum berlaku',
      tone: 'signal',
      detail: 'Tanggal efektif kebijakan adalah ' + formatDateID(EFFECTIVE_DATE) + '. Angka di bawah tetap bisa dipakai sebagai pembanding, tetapi belum bisa dijadikan dasar keberatan.',
    };
  }
  if (phase.code === 'no_application') {
    return {
      code: 'belum_mengajukan',
      label: 'Ajukan lewat SAPA UMKM terlebih dahulu',
      tone: 'signal',
      detail: 'Diskon tidak otomatis. Tanpa pengajuan dan verifikasi, selisih biaya layanan belum bisa disebut belum diterapkan.',
    };
  }
  if (phase.code === 'waiting_pull' || phase.code === 'verifying') {
    if (calc.code === 'sesuai') {
      return {
        code: 'sesuai',
        label: 'Diskon sudah terlihat sesuai perkiraan',
        tone: 'ok',
        detail: 'Tahap verifikasi masih berjalan, tetapi biaya yang ditagih sudah mendekati perkiraan setelah diskon. Simpan settlement sebagai bukti.',
      };
    }
    return {
      code: 'menunggu',
      label: 'Masih dalam tahap verifikasi',
      tone: 'signal',
      detail: 'Sisa ' + phase.days_remaining + ' hari kerja sebelum batas 15 hari kerja. Jangan menyimpulkan diskon gagal sebelum batas ini lewat, kecuali platform sudah menyatakan penolakan tertulis.',
    };
  }
  if (phase.code === 'overdue' && calc.code === 'kurang') {
    return {
      code: 'eskalasi',
      label: 'Lewat batas, minta status dan koreksi',
      tone: 'ember',
      detail: 'Batas 15 hari kerja sudah lewat dan biaya masih ' + formatRupiah(calc.gap) + ' di atas perkiraan. Minta status tertulis, lalu ajukan koreksi atau eskalasi ke SAPA UMKM.',
    };
  }
  if (calc.code === 'kurang') {
    return {
      code: 'kurang',
      label: 'Diskon belum diterapkan penuh',
      tone: 'ember',
      detail: 'Biaya yang ditagih ' + formatRupiah(calc.gap) + ' lebih tinggi dari perkiraan, atau ' + calc.realization_pct + ' persen dari potongan yang seharusnya. Ajukan keberatan dengan rincian per komponen.',
    };
  }
  if (calc.code === 'lebih') {
    return {
      code: 'lebih',
      label: 'Diskon lebih besar dari perkiraan',
      tone: 'ok',
      detail: 'Potongan yang terlihat ' + formatRupiah(Math.abs(calc.gap)) + ' lebih besar dari perkiraan. Pastikan dasarnya memang insentif UMK, bukan program lain yang punya syarat berbeda.',
    };
  }
  return {
    code: 'sesuai',
    label: 'Diskon terlihat sesuai perkiraan',
    tone: 'ok',
    detail: 'Biaya yang ditagih sama atau sangat dekat dengan perkiraan setelah diskon ' + calc.discount_pct + ' persen. Simpan invoice dan settlement sebagai bukti.',
  };
}

function buildRecommendations(data, calc, eligibility, phase, risk, proof) {
  const recs = [];
  const scale = getScale(data.scale);

  if (eligibility.verdict === 'tidak_layak') {
    recs.push('Syarat yang belum terpenuhi: ' + eligibility.hard_failed.join(', ') + '. Perbaiki syarat ini sebelum memakai selisih biaya sebagai dasar keberatan.');
  }
  if (data.domestic !== 'ya') {
    recs.push('Insentif hanya untuk produk dalam negeri. Bila toko juga menjual produk impor, pisahkan SKU lokal dan pastikan hanya SKU lokal yang diajukan.');
  }
  if (data.high_risk === 'ya') {
    recs.push('Pengguna berisiko tinggi tidak bisa mengajukan ulang sampai status berubah. Minta alasan tertulis dan langkah perbaikan dari platform.');
  }
  if (!scale.eligible) {
    recs.push('Skala ' + scale.label + ' di luar cakupan UMK. Insentif hanya untuk usaha mikro dan kecil.');
  }
  if (!data.application_date) {
    recs.push('Buat pengajuan lewat SAPA UMKM, simpan nomor pengajuan, platform yang dipilih, dan daftar SKU. Tanpa pengajuan, diskon tidak akan aktif.');
  } else {
    recs.push('Pengajuan tercatat ' + formatDateID(data.application_date) + '. Fase dihitung dari ' + formatDateID(phase.baseline_date) + ' karena kebijakan baru efektif pada tanggal tersebut.');
  }
  if (phase.code === 'waiting_pull') {
    recs.push('Platform mengambil data dari SAPA UMKM dalam 5 hari kerja. Simpan bukti pengajuan dan cek kembali setelah ' + formatDateID(phase.pull_deadline) + '.');
  } else if (phase.code === 'verifying') {
    recs.push('Verifikasi platform paling lama 10 hari kerja setelah data diterima. Batas 15 hari kerja diperkirakan ' + formatDateID(phase.active_deadline) + ', belum termasuk hari libur nasional.');
  } else if (phase.code === 'overdue') {
    recs.push('Batas 15 hari kerja sudah lewat. Minta status verifikasi tertulis dan alasan keterlambatan sebelum mengajukan eskalasi.');
  }
  if (calc.basis_source === 'estimated') {
    recs.push('Biaya layanan dasar dihitung dari omzet dan tarif, jadi angkanya perkiraan. Cocokkan dengan baris biaya layanan di invoice sebelum mengajukan keberatan.');
  } else {
    recs.push('Biaya layanan dasar diambil dari invoice. Pastikan baris yang dipakai adalah komponen yang memang menjadi dasar diskon, bukan biaya iklan atau promosi.');
  }
  if (calc.code === 'kurang') {
    recs.push('Biaya yang ditagih ' + formatRupiah(calc.actual_fee) + ', perkiraan setelah diskon ' + formatRupiah(calc.expected_fee) + ', selisih ' + formatRupiah(calc.gap) + '. Minta rincian komponen dan koreksi tertulis.');
  } else if (calc.code === 'sesuai') {
    recs.push('Biaya yang ditagih sudah mendekati perkiraan. Simpan invoice, settlement, dan bukti verifikasi untuk audit bulan berikutnya.');
  } else if (calc.code === 'lebih') {
    recs.push('Potongan lebih besar dari perkiraan. Periksa apakah ada program lain, subsidi, atau perubahan tarif yang membuat selisih ini, sebelum menganggapnya kelebihan bayar.');
  }
  if (calc.annual_leak > 0) {
    recs.push('Bila selisih ini berulang ' + data.periods_per_year + ' kali setahun, potensi kebocoran ' + formatRupiah(calc.annual_leak) + ' per tahun. Ini perkiraan dari input Anda, bukan angka resmi.');
  }
  if (proof.missing_critical.length > 0) {
    recs.push('Lengkapi ' + proof.missing_critical.length + ' bukti kritis yang belum ada: ' + proof.missing_critical.join(', ') + '.');
  }
  if (data.ticket) {
    recs.push('Nomor tiket ' + data.ticket + ' disimpan. Minta jawaban tertulis yang menyebut komponen biaya dan alasan keputusan, bukan hanya tautan bantuan.');
  }
  recs.push('Gunakan periode setelah tanggal aktif, atau pisahkan transaksi sebelum dan sesudah tanggal aktif. Diskon tidak berlaku surut untuk transaksi sebelum tanggal aktif.');
  recs.push('Keputusan verifikasi, koreksi, dan penghentian insentif tetap berada pada platform dan Kementerian UMKM. Tool ini hanya membantu menyusun angka dan fakta.');
  return recs;
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const platform = getPlatform(data.platform);
  const scale = getScale(data.scale);
  const calc = computeTotals(data);
  const phase = computePhase(data, now);
  const eligibility = evaluateEligibility(data, phase);
  const proof = readiness({ items: data.evidence });
  const risk = assess(data, calc, eligibility, phase);
  const verdict = decide(calc, eligibility, phase, risk);
  const recommendations = buildRecommendations(data, calc, eligibility, phase, risk, proof);
  const followupAge = data.followup_date ? daysBetween(data.followup_date, todayISO(now)) : null;

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    platform_note: platform.note,
    scale: scale.id,
    scale_label: scale.label,
    scale_note: scale.note,
    store_name: data.store_name,
    store_id: data.store_id,
    period_start: data.period_start,
    period_end: data.period_end,
    period_label: formatDateID(data.period_start) + ' sampai ' + formatDateID(data.period_end),
    application_date: data.application_date,
    application_date_label: data.application_date ? formatDateID(data.application_date) : '-',
    verified_date: data.verified_date,
    verified_date_label: data.verified_date ? formatDateID(data.verified_date) : '-',
    discount_pct: data.discount_pct,
    calculation: calc,
    phase: phase,
    eligibility: eligibility,
    risk: risk,
    verdict: verdict,
    readiness: proof,
    evidence: proof.items,
    recommendations: recommendations,
    followup_age: followupAge,
    sources: SOURCES.slice(),
    policy: {
      effective_date: EFFECTIVE_DATE,
      effective_date_label: formatDateID(EFFECTIVE_DATE),
      kepmen_date: KEPMEN_DATE,
      kepmen_date_label: formatDateID(KEPMEN_DATE),
      discount_min: DISCOUNT_MIN,
      pull_working_days: PULL_WORKING_DAYS,
      verify_working_days: VERIFY_WORKING_DAYS,
      total_working_days: TOTAL_WORKING_DAYS,
      identified_sellers: IDENTIFIED_SELLERS,
      service_fee_min: SERVICE_FEE_MIN,
      service_fee_max: SERVICE_FEE_MAX,
    },
    disclaimer: 'Tool ini alat bantu audit, bukan nasihat hukum. Selisih dihitung dari input Anda, bukan dari data resmi platform. Cakupan komponen diskon bisa berbeda per platform, jadi cocokkan dengan invoice dan kartu tarif. Keputusan verifikasi, pemberian insentif, dan koreksi tetap berada pada platform dan Kementerian UMKM.',
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };
  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const letterType = getLetterType(data.letter_type);
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const contact = cleanLine(data.contact, 120) || '-';
  const ticket = cleanLine(data.ticket, 120) || '-';
  const storeId = analyzed.store_id || '-';
  const c = analyzed.calculation;
  const e = analyzed.eligibility;
  const p = analyzed.phase;
  const chronology = cleanBlock(data.chronology) || 'Saya mencatat selisih biaya layanan ini pada ' + formatDateID(todayISO(now)) + '.';
  const dateLine = formatDateID(todayISO(now));

  if (letterType.id === 'status' && !analyzed.application_date) {
    return { error: 'Tanggal pengajuan SAPA UMKM wajib diisi untuk surat permintaan status' };
  }

  let subject = '';
  let recipient = '';
  let lines = [];

  if (letterType.id === 'status') {
    recipient = 'Kepada Tim Layanan Penjual ' + analyzed.platform_name + ',';
    subject = 'Permintaan status verifikasi insentif potongan biaya layanan - ' + storeName + ' - ' + storeId;
    lines.push(recipient);
    lines.push('');
    lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + ' (' + storeId + '), mengajukan permohonan insentif potongan biaya layanan minimal 50 persen untuk usaha mikro atau kecil melalui SAPA UMKM pada ' + analyzed.application_date_label + '.');
    lines.push('');
    lines.push('Data pengajuan:');
    lines.push('- Platform: ' + analyzed.platform_name);
    lines.push('- Periode yang diaudit: ' + analyzed.period_label);
    lines.push('- Skala usaha: ' + analyzed.scale_label);
    lines.push('- Status verifikasi yang saya catat: ' + (analyzed.verified_date ? 'lolos pada ' + analyzed.verified_date_label : 'belum ada pemberitahuan tertulis'));
    lines.push('- Nomor tiket sebelumnya: ' + ticket);
    lines.push('');
    lines.push('Saya meminta jawaban tertulis mengenai:');
    lines.push('1. Status verifikasi pengajuan insentif dan tahap yang sedang berjalan.');
    lines.push('2. Tanggal mulai berlakunya potongan biaya layanan untuk toko saya.');
    lines.push('3. Daftar SKU yang disetujui dan SKU yang tidak disetujui, beserta alasannya.');
    lines.push('4. Komponen biaya layanan yang menjadi dasar potongan: biaya administrasi, komisi, atau biaya aplikasi dasar toko.');
    lines.push('5. Perkiraan tanggal potongan muncul di settlement berikutnya.');
    lines.push('');
    lines.push('Saya memahami bahwa verifikasi platform paling lama 10 hari kerja setelah data diterima dari SAPA UMKM, dengan penarikan data dalam 5 hari kerja. Batas 15 hari kerja saya hitung dari ' + p.baseline_date_label + '.');
    lines.push('');
    lines.push('Dasar aturan: Peraturan Menteri UMKM Nomor 3 Tahun 2026 Pasal 15 dan Keputusan Menteri UMKM Nomor 398 Tahun 2026.');
    lines.push('');
    lines.push('Kronologi: ' + chronology);
    lines.push('');
    lines.push('Terima kasih.');
    lines.push('');
    lines.push(sellerName);
    lines.push(storeName);
    lines.push('Kontak: ' + contact);
  } else if (letterType.id === 'keberatan') {
    recipient = 'Kepada Tim Layanan Penjual ' + analyzed.platform_name + ',';
    subject = 'Keberatan realisasi potongan biaya layanan 50 persen - ' + storeName + ' - ' + analyzed.period_label;
    lines.push(recipient);
    lines.push('');
    lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + ' (' + storeId + '), mengajukan keberatan atas realisasi potongan biaya layanan untuk periode ' + analyzed.period_label + '.');
    lines.push('');
    lines.push('Rincian angka:');
    lines.push('- Biaya layanan dasar sebelum diskon: ' + formatRupiah(c.basis) + ' (' + (c.basis_source === 'estimated' ? 'perkiraan dari omzet dan tarif' : 'diambil dari invoice') + ').');
    lines.push('- Perkiraan biaya setelah diskon ' + c.discount_pct + ' persen: ' + formatRupiah(c.expected_fee) + '.');
    lines.push('- Biaya layanan yang benar-benar ditagih: ' + formatRupiah(c.actual_fee) + '.');
    lines.push('- Selisih yang saya pertanyakan: ' + formatRupiah(Math.max(0, c.gap)) + ' atau ' + c.realization_pct + ' persen dari potongan yang seharusnya.');
    lines.push('- Dampak bila berulang ' + c.periods_per_year + ' kali setahun: ' + formatRupiah(c.annual_leak) + ' (perkiraan dari input saya).');
    lines.push('');
    lines.push('Status pengajuan saya: ' + (analyzed.application_date ? 'diajukan pada ' + analyzed.application_date_label : 'belum ada pengajuan') + '. Status verifikasi: ' + (analyzed.verified_date ? 'lolos pada ' + analyzed.verified_date_label : 'belum ada pemberitahuan tertulis') + '.');
    lines.push('');
    lines.push('Saya meminta:');
    lines.push('1. Rincian komponen biaya layanan dan baris diskon untuk periode tersebut.');
    lines.push('2. Dasar perhitungan bila potongan 50 persen tidak diterapkan penuh.');
    lines.push('3. Koreksi biaya dan pengembalian selisih bila pengajuan saya sudah lolos verifikasi.');
    lines.push('4. Jawaban tertulis, bukan hanya tautan pusat bantuan atau balasan template.');
    lines.push('');
    lines.push('Dasar aturan: Peraturan Menteri UMKM Nomor 3 Tahun 2026 Pasal 15 dan Keputusan Menteri UMKM Nomor 398 Tahun 2026.');
    lines.push('');
    lines.push('Catatan pemeriksaan: ' + e.label + '. ' + p.label + '.');
    lines.push('');
    lines.push('Kronologi: ' + chronology);
    lines.push('');
    lines.push('Terima kasih.');
    lines.push('');
    lines.push(sellerName);
    lines.push(storeName);
    lines.push('Kontak: ' + contact);
  } else {
    recipient = 'Kepada Kementerian Usaha Mikro, Kecil, dan Menengah melalui SAPA UMKM,';
    subject = 'Permohonan fasilitasi realisasi potongan biaya layanan 50 persen - ' + storeName;
    lines.push(recipient);
    lines.push('');
    lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + ' (' + storeId + '), memohon fasilitasi atas realisasi insentif potongan biaya layanan minimal 50 persen di ' + analyzed.platform_name + '.');
    lines.push('');
    lines.push('Ringkasan:');
    lines.push('- Periode: ' + analyzed.period_label + '.');
    lines.push('- Biaya layanan dasar: ' + formatRupiah(c.basis) + '.');
    lines.push('- Perkiraan setelah diskon: ' + formatRupiah(c.expected_fee) + '.');
    lines.push('- Biaya yang ditagih: ' + formatRupiah(c.actual_fee) + '.');
    lines.push('- Selisih: ' + formatRupiah(Math.max(0, c.gap)) + '.');
    lines.push('- Tanggal pengajuan: ' + (analyzed.application_date ? analyzed.application_date_label : 'belum ada'));
    lines.push('- Fase verifikasi: ' + p.label + '.');
    lines.push('');
    lines.push('Saya sudah menghubungi platform dan menyimpan nomor tiket ' + ticket + '. Saya memohon fasilitasi negosiasi atau klarifikasi sesuai Peraturan Menteri UMKM Nomor 3 Tahun 2026 dan Keputusan Menteri UMKM Nomor 398 Tahun 2026.');
    lines.push('');
    lines.push('Bukti yang saya lampirkan: ' + (analyzed.evidence.filter((item) => item.checked).map((item) => item.label).join(', ') || 'belum ada') + '.');
    lines.push('');
    lines.push('Kronologi: ' + chronology);
    lines.push('');
    lines.push('Terima kasih.');
    lines.push('');
    lines.push(sellerName);
    lines.push(storeName);
    lines.push('Kontak: ' + contact);
  }

  const body = [dateLine, '', subject, '', lines.join('\n')].join('\n');
  return {
    letter_type: letterType.id,
    letter_type_label: letterType.label,
    subject: subject,
    body: body,
    generated_at: todayISO(now),
    verdict: analyzed.verdict,
    calculation: c,
  };
}

function validateCase(input, now = new Date()) {
  const data = input || {};
  if (!cleanLine(data.store_name, 120)) return { error: 'Nama toko wajib diisi untuk catatan kasus' };
  const checked = validateBase(data, now);
  if (checked.error) return checked;
  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const followup = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followup) return { error: 'Tanggal follow-up terakhir tidak valid' };
  if (followup && followup > todayISO(now)) return { error: 'Tanggal follow-up terakhir tidak boleh melewati hari ini' };
  if (followup && daysBetween(checked.data.period_end, followup) < 0) return { error: 'Tanggal follow-up terakhir tidak boleh sebelum akhir periode' };

  const item = Object.assign({}, checked.data, {
    store_name: cleanLine(data.store_name, 120),
    followup_date: followup || '',
    note: cleanBlock(data.note),
    status: getCaseStatus(data.status).id,
    letter_type: getLetterType(data.letter_type).id,
    gap: analyzed.calculation.gap,
    annual_leak: analyzed.calculation.annual_leak,
    expected_fee: analyzed.calculation.expected_fee,
    actual_fee: analyzed.calculation.actual_fee,
    basis: analyzed.calculation.basis,
    phase_code: analyzed.phase.code,
    phase_label: analyzed.phase.label,
    eligibility_verdict: analyzed.eligibility.verdict,
    verdict_code: analyzed.verdict.code,
    verdict_label: analyzed.verdict.label,
  });

  return { item: item, analysis: analyzed };
}

function summary(cases, now = new Date()) {
  const list = (Array.isArray(cases) ? cases : []).map((item) => {
    const status = getCaseStatus(item.status);
    const age = item.period_end ? daysBetween(item.period_end, todayISO(now)) : null;
    const followupAge = item.followup_date ? daysBetween(item.followup_date, todayISO(now)) : null;
    return Object.assign({}, item, {
      status_label: status.label,
      open: status.open,
      age_days: age,
      followup_age: followupAge,
    });
  });

  const open = list.filter((item) => item.open);
  const totalGap = list.reduce((sum, item) => sum + Math.max(0, num(item.gap)), 0);
  const openGap = open.reduce((sum, item) => sum + Math.max(0, num(item.gap)), 0);
  const annualLeak = list.reduce((sum, item) => sum + Math.max(0, num(item.annual_leak)), 0);

  let oldest = null;
  open.forEach((item) => {
    if (item.age_days === null) return;
    if (!oldest || item.age_days > oldest.age_days) oldest = item;
  });

  const warnings = [];
  list.forEach((item) => {
    if (item.open && item.age_days !== null && item.age_days >= 30) {
      warnings.push('Kasus ' + item.store_name + ' (' + item.id + ') sudah ' + item.age_days + ' hari sejak akhir periode dan belum selesai.');
    }
    if (item.open && item.followup_age !== null && item.followup_age >= 14) {
      warnings.push('Kasus ' + item.store_name + ' (' + item.id + ') belum di-follow-up selama ' + item.followup_age + ' hari.');
    }
    if (item.open && item.phase_code === 'overdue' && num(item.gap) > 0) {
      warnings.push('Kasus ' + item.store_name + ' (' + item.id + ') melewati 15 hari kerja dengan selisih ' + formatRupiah(item.gap) + '.');
    }
  });

  return {
    cases: list,
    total: list.length,
    open_count: open.length,
    closed_count: list.length - open.length,
    total_gap: totalGap,
    open_gap: openGap,
    annual_leak: annualLeak,
    oldest_open_days: oldest ? oldest.age_days : 0,
    oldest_open_store: oldest ? oldest.store_name : '',
    warnings: warnings,
    warning_count: warnings.length,
    generated_at: todayISO(now),
  };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  const periodEnd = today;
  const periodStart = addDays(today, -6);
  const applicationDate = addDays(today, -9);
  const verifiedDate = addDays(today, -2);
  return {
    platform: 'shopee',
    scale: 'mikro',
    domestic: 'ya',
    sapa: 'ya',
    verified: 'ya',
    high_risk: 'tidak',
    record: 'ya',
    store_name: 'Toko Contoh Lokal',
    store_id: 'toko-contoh-lokal',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-048',
    period_start: periodStart,
    period_end: periodEnd,
    application_date: applicationDate,
    verified_date: verifiedDate,
    gross_sales: 15000000,
    fee_rate: 10,
    fee_basis: 1500000,
    discount_pct: 50,
    actual_fee: 1200000,
    periods_per_year: 12,
    chronology: 'Pengajuan insentif dibuat lewat SAPA UMKM dan dinyatakan lolos verifikasi. Pada settlement terbaru, baris diskon hanya menutup sebagian biaya layanan.',
    note: 'Contoh ilustrasi. Nominal adalah contoh, bukan data nyata.',
    status: 'keberatan_dikirim',
    letter_type: 'keberatan',
    manual_signals: ['sebagian_sku', 'settlement_tidak_rinci'],
    evidence: ['sapa_account', 'verification_notice', 'settlement_after', 'fee_basis_proof', 'sku_list', 'fee_breakdown', 'ticket_number', 'sapa_timeline'],
  };
}

function meta(now = new Date()) {
  return {
    generated_at: todayISO(now),
    platforms: PLATFORMS,
    scales: SCALES,
    yes_no: YES_NO,
    requirements: REQUIREMENTS,
    auto_signals: AUTO_SIGNALS,
    manual_signals: MANUAL_SIGNALS,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    sources: SOURCES,
    defaults: DEFAULTS,
    policy: {
      effective_date: EFFECTIVE_DATE,
      effective_date_label: formatDateID(EFFECTIVE_DATE),
      kepmen_date: KEPMEN_DATE,
      kepmen_date_label: formatDateID(KEPMEN_DATE),
      discount_min: DISCOUNT_MIN,
      pull_working_days: PULL_WORKING_DAYS,
      verify_working_days: VERIFY_WORKING_DAYS,
      total_working_days: TOTAL_WORKING_DAYS,
      identified_sellers: IDENTIFIED_SELLERS,
      service_fee_min: SERVICE_FEE_MIN,
      service_fee_max: SERVICE_FEE_MAX,
      scope_note: 'Komponen yang dipotong adalah biaya administrasi, komisi, atau biaya aplikasi dasar toko. Cakupan tiap platform bisa berbeda, jadi angka dasar diskon harus diambil dari invoice.',
    },
  };
}

module.exports = {
  EFFECTIVE_DATE,
  KEPMEN_DATE,
  DISCOUNT_MIN,
  PULL_WORKING_DAYS,
  VERIFY_WORKING_DAYS,
  TOTAL_WORKING_DAYS,
  IDENTIFIED_SELLERS,
  SERVICE_FEE_MIN,
  SERVICE_FEE_MAX,
  PLATFORMS,
  SCALES,
  YES_NO,
  REQUIREMENTS,
  AUTO_SIGNALS,
  MANUAL_SIGNALS,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  DEFAULTS,
  todayISO,
  parseISO,
  addDays,
  addBusinessDays,
  businessDaysBetween,
  daysBetween,
  formatDateID,
  formatRupiah,
  validateBase,
  computeTotals,
  computePhase,
  evaluateEligibility,
  detectSignals,
  assess,
  readiness,
  decide,
  analyze,
  buildLetter,
  validateCase,
  summary,
  buildExample,
  meta,
};
