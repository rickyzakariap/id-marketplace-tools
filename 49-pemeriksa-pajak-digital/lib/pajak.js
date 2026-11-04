'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const SPP_STARTED = '2026-09-25';
const ANNOUNCED_DATE = '2026-11-09';
const PPN_RATE_DEFAULT = 11;
const PPN_RATE_MIN = 1;
const PPN_RATE_MAX = 30;
const MAX_ITEMS = 20;

const CATEGORIES = [
  {
    id: 'langganan',
    label: 'Langganan perangkat lunak atau aplikasi',
    note: 'Contoh: aplikasi desain, akuntansi, toko online, atau produktivitas.',
  },
  {
    id: 'iklan',
    label: 'Iklan digital',
    note: 'Contoh: iklan di mesin pencari, media sosial, atau jaringan iklan.',
  },
  {
    id: 'cloud',
    label: 'Penyimpanan atau komputasi awan',
    note: 'Contoh: penyimpanan file, server, basis data, atau layanan komputasi.',
  },
  {
    id: 'digital',
    label: 'Produk digital atau konten',
    note: 'Contoh: foto stok, musik, kursus, template, atau buku digital.',
  },
  {
    id: 'jasa_luar',
    label: 'Jasa dari penyedia luar negeri',
    note: 'Contoh: desain, konsultasi, penulisan, atau pengembangan dari luar negeri.',
  },
  {
    id: 'transfer',
    label: 'Transfer atau remitansi ke luar negeri',
    note: 'Bukan objek PPN SPP-TDLN bila hanya transfer dana, bukan pembayaran barang atau jasa digital.',
  },
  {
    id: 'lain',
    label: 'Transaksi lain',
    note: 'Pilih kategori yang paling dekat. Bukti dan jenis transaksi tetap perlu dicek.',
  },
];

const INCLUDES_PPN = [
  { id: 'tidak', label: 'Belum, nominal belum termasuk PPN' },
  { id: 'ya', label: 'Sudah, nominal sudah termasuk PPN' },
];

const PROVIDER_PPN = [
  { id: 'belum', label: 'Belum memungut PPN' },
  { id: 'sudah', label: 'Sudah memungut PPN PMSE' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const PAYMENT_ISSUER = [
  { id: 'ya', label: 'Ya, kanal ditunjuk SPP-TDLN' },
  { id: 'tidak', label: 'Bukan kanal SPP-TDLN' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const PKP_OPTIONS = [
  { id: 'tidak', label: 'Belum PKP' },
  { id: 'ya', label: 'Sudah PKP' },
];

const SELLER_TYPES = [
  { id: 'perorangan', label: 'Perorangan' },
  { id: 'badan', label: 'Badan usaha' },
];

const EVIDENCE = [
  { id: 'invoice_ppn', label: 'Invoice atau kuitansi dengan baris DPP dan PPN', critical: true, group: 'Transaksi' },
  { id: 'payment_proof', label: 'Mutasi bank atau kanal pembayaran untuk transaksi yang sama', critical: true, group: 'Pembayaran' },
  { id: 'provider_tax', label: 'Bukti pemungutan PPN PMSE dari penyedia, bila ada', critical: true, group: 'Penyedia' },
  { id: 'issuer_check', label: 'Tangkapan layar daftar kanal SPP-TDLN atau konfirmasi kanal', critical: true, group: 'Pembayaran' },
  { id: 'transaction_list', label: 'Daftar transaksi digital luar negeri per periode', critical: false, group: 'Transaksi' },
  { id: 'provider_country', label: 'Bukti alamat atau negara penyedia dari invoice atau syarat layanan', critical: false, group: 'Penyedia' },
  { id: 'purchase_log', label: 'Catatan pembelian internal atau riwayat langganan', critical: false, group: 'Transaksi' },
  { id: 'pkp_proof', label: 'Bukti status PKP dan dokumen pajak yang sah, bila ingin mengkreditkan', critical: false, group: 'Pajak' },
  { id: 'bank_reply', label: 'Jawaban tertulis bank atau kanal pembayaran', critical: false, group: 'Pembayaran' },
  { id: 'transfer_purpose', label: 'Bukti tujuan transfer, bukan pembayaran barang atau jasa digital', critical: false, group: 'Pembayaran' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'cek_invoice', label: 'Cek invoice dan mutasi', open: true },
  { id: 'konfirmasi_kanal', label: 'Menunggu konfirmasi kanal', open: true },
  { id: 'koreksi_dikirim', label: 'Permintaan koreksi dikirim', open: true },
  { id: 'dikreditkan', label: 'Sudah masuk kredit pajak', open: false },
  { id: 'selesai', label: 'Selesai tanpa koreksi', open: false },
  { id: 'tidak_berlaku', label: 'Tidak berlaku atau bukan objek', open: false },
];

const LETTER_TYPES = [
  { id: 'rincian', label: 'Permintaan rincian PPN ke kanal pembayaran' },
  { id: 'konfirmasi', label: 'Konfirmasi transfer atau remitansi bukan objek PPN' },
  { id: 'koreksi', label: 'Permintaan koreksi pungutan PPN ganda' },
];

const SOURCES = [
  {
    title: 'Ramai isu PPN atas semua transaksi digital, begini penjelasan DJP',
    publisher: 'Ortax',
    date: '2026-11-03',
    url: 'https://ortax.org/ramai-isu-ppn-atas-semua-transaksi-digital-begini-penjelasan-djp',
    note: 'DJP menyatakan SPP-TDLN bukan pajak baru. Mekanisme pemungutan PPN atas pemanfaatan produk digital luar negeri sudah berjalan sejak 25 September 2026. PPN tidak berlaku untuk semua transaksi digital dan tidak otomatis mengenakan transfer atau remitansi pribadi.',
  },
  {
    title: 'Pajak digital 9 November 2026: apa artinya bagi UMKM dan penjual online',
    publisher: 'UKMINDONESIA.ID',
    date: '2026-11-03',
    url: 'https://ukmindonesia.id/baca-deskripsi-posts/pajak-digital-9-november-2026-apa-artinya-bagi-umkm-dan-penjual-online',
    note: 'Pemberitaan menyebut contoh PPN 11/111. Non-PKP tidak dapat mengkreditkan PPN, sehingga pungutan menjadi biaya. Marketplace dalam negeri dan PPh 22 final 0,5% adalah jalur yang berbeda. Tanggal 9 November disebut dalam pemberitaan, bukan konfirmasi tanggal mulai resmi baru dari DJP.',
  },
  {
    title: '9 November pajak digital akan berlaku?',
    publisher: 'Suluh Sumatera',
    date: '2026-11-02',
    url: 'https://www.suluhsumatera.co.id/2026/11/9-november-pajak-digital-akan-berlaku.html',
    note: 'Pemberitaan awal yang memicu kebingungan tentang tanggal 9 November. Klaim ini perlu dibaca bersama penjelasan DJP bahwa mekanisme sudah berjalan sejak 25 September 2026.',
  },
  {
    title: 'PMK 131/2024: tarif PPN sebelas-dua belas',
    publisher: 'Direktorat Jenderal Pajak',
    date: '2025-01-06',
    url: 'https://pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas',
    note: 'Tarif PPN tetap 12 persen, tetapi tarif efektif untuk barang dan jasa non-mewah adalah 11 persen melalui DPP nilai lain 11/12. Tarif awal 11 persen di tool ini adalah perkiraan yang dapat diubah sesuai invoice.',
  },
];

const POLICY = {
  spp_started: SPP_STARTED,
  spp_started_label: '25 September 2026',
  announced_date: ANNOUNCED_DATE,
  announced_date_label: '9 November 2026',
  announced_note: 'Tanggal 9 November bukan konfirmasi tanggal mulai baru dari DJP, tetapi tanggal yang disebut dalam pemberitaan. DJP menyatakan mekanisme SPP-TDLN sudah berjalan sejak 25 September 2026 dan perluasan masih disiapkan. Jangan menganggap 9 November sebagai tanggal mulai resmi tanpa konfirmasi tertulis.',
  ppn_rate_default: PPN_RATE_DEFAULT,
  ppn_rate_min: PPN_RATE_MIN,
  ppn_rate_max: PPN_RATE_MAX,
  ppn_rate_note: 'Tarif efektif PPN non-mewah adalah 11 persen menurut PMK 131/2024. Tarif ini dapat diubah dan hasilnya tetap perkiraan, bukan ketetapan pajak.',
  scope_note: 'SPP-TDLN memungut PPN atas pemanfaatan barang atau jasa digital dari luar daerah pabean. Penjualan di marketplace dalam negeri bukan objek SPP-TDLN. Transfer atau remitansi pribadi tidak otomatis menjadi objek PPN.',
  marketplace_note: 'PPh 22 final 0,5 persen untuk penjualan marketplace adalah mekanisme terpisah. Tool ini tidak menghitung PPh 22 dan tidak menggantikan pemeriksaan status pajak Anda.',
};

const DEFAULTS = {
  rate: PPN_RATE_DEFAULT,
  months_per_year: 12,
  pkp: 'tidak',
  seller_type: 'perorangan',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(num(value));
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
  const month = MONTHS_ID[Number(parts[1]) - 1];
  return month ? Number(parts[2]) + ' ' + month + ' ' + parts[0] : iso;
}

function groupDigits(value) {
  return String(round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatRupiah(value) {
  return 'Rp ' + groupDigits(value);
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function getCategory(id) {
  return CATEGORIES.find((item) => item.id === id) || CATEGORIES[CATEGORIES.length - 1];
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

function getOption(list, id, fallback) {
  return list.find((item) => item.id === id) || list.find((item) => item.id === fallback) || list[0];
}

function normalizeText(value, max) {
  const text = cleanBlock(value);
  return text.slice(0, max || 2000);
}

function itemPpn(amount, includesPpn, rate) {
  const gross = round(amount);
  if (includesPpn === 'ya') {
    const base = gross * 100 / (100 + rate);
    return round(gross - base);
  }
  return round(gross * rate / 100);
}

function classifyItem(item, rate) {
  const amount = round(item.amount);
  const category = getCategory(item.category);
  const includes = item.includes_ppn === 'ya' ? 'ya' : 'tidak';
  const provider = getOption(PROVIDER_PPN, item.provider_ppn, 'tidak_tahu').id;
  const issuer = getOption(PAYMENT_ISSUER, item.payment_issuer, 'tidak_tahu').id;
  const ppn = itemPpn(amount, includes, rate);
  const dpp = includes === 'ya' ? amount - ppn : amount;

  if (category.id === 'transfer') {
    return {
      label: item.label,
      category: category.id,
      category_label: category.label,
      amount: amount,
      includes_ppn: includes,
      provider_ppn: provider,
      payment_issuer: issuer,
      status: 'transfer',
      status_label: 'Bukan objek PPN',
      ppn: 0,
      dpp: amount,
      charged_ppn: 0,
      potential_ppn: 0,
      tone: 'ok',
      note: 'Transfer atau remitansi dana bukan otomatis objek PPN SPP-TDLN. PPN baru relevan bila pembayaran itu membeli barang atau jasa digital dari penyedia luar negeri.',
    };
  }

  if (provider === 'sudah') {
    return {
      label: item.label,
      category: category.id,
      category_label: category.label,
      amount: amount,
      includes_ppn: includes,
      provider_ppn: provider,
      payment_issuer: issuer,
      status: 'pmse',
      status_label: 'Sudah dipungut PMSE',
      ppn: ppn,
      dpp: dpp,
      charged_ppn: ppn,
      potential_ppn: 0,
      tone: 'ok',
      note: 'Penyedia sudah memungut PPN PMSE. Jangan membayar PPN lagi ke kanal pembayaran. Simpan invoice untuk kredit pajak bila Anda PKP.',
    };
  }

  if (issuer === 'ya' && provider === 'belum') {
    return {
      label: item.label,
      category: category.id,
      category_label: category.label,
      amount: amount,
      includes_ppn: includes,
      provider_ppn: provider,
      payment_issuer: issuer,
      status: 'spp_tdln',
      status_label: 'Berpotensi dipungut SPP-TDLN',
      ppn: ppn,
      dpp: dpp,
      charged_ppn: ppn,
      potential_ppn: 0,
      tone: 'ember',
      note: 'Penyedia belum memungut PPN dan kanal pembayaran disebut ditunjuk SPP-TDLN. Perkiraan PPN perlu dianggarkan, lalu cocokkan dengan bukti pungutan resmi.',
    };
  }

  return {
    label: item.label,
    category: category.id,
    category_label: category.label,
    amount: amount,
    includes_ppn: includes,
    provider_ppn: provider,
    payment_issuer: issuer,
    status: 'perlu_cek',
    status_label: 'Perlu dicek',
    ppn: ppn,
    dpp: dpp,
    charged_ppn: 0,
    potential_ppn: ppn,
    tone: 'signal',
    note: provider === 'tidak_tahu' && issuer === 'ya'
      ? 'Kanal pembayaran disebut ditunjuk, tetapi status PPN penyedia belum jelas. Cek invoice agar PPN tidak dipungut dua kali.'
      : 'Mekanisme pemungutan belum jelas dari input. Konfirmasi ke penyedia atau kanal pembayaran sebelum menyetor atau mengkreditkan PPN.',
  };
}

function validateBase(input, now = new Date()) {
  const data = input || {};
  const today = todayISO(now);

  let periodStart = parseISO(data.period_start);
  let periodEnd = parseISO(data.period_end);
  if (!String(data.period_start || '').trim()) {
    periodStart = today.slice(0, 8) + '01';
  }
  if (!String(data.period_end || '').trim()) {
    periodEnd = today;
  }
  if (!periodStart) return { error: 'Tanggal awal periode wajib diisi dengan format YYYY-MM-DD' };
  if (!periodEnd) return { error: 'Tanggal akhir periode wajib diisi dengan format YYYY-MM-DD' };
  if (periodStart > today) return { error: 'Tanggal awal periode tidak boleh melewati hari ini' };
  if (periodEnd > today) return { error: 'Tanggal akhir periode tidak boleh melewati hari ini' };
  if (daysBetween(periodStart, periodEnd) < 0) return { error: 'Tanggal akhir periode tidak boleh sebelum tanggal awal' };

  const rate = data.rate === undefined || data.rate === null || String(data.rate).trim() === ''
    ? PPN_RATE_DEFAULT
    : num(data.rate);
  if (rate < PPN_RATE_MIN || rate > PPN_RATE_MAX) {
    return { error: 'Tarif PPN harus antara ' + PPN_RATE_MIN + ' sampai ' + PPN_RATE_MAX + ' persen' };
  }

  const monthsPerYear = data.months_per_year === undefined || data.months_per_year === null || String(data.months_per_year).trim() === ''
    ? 12
    : num(data.months_per_year);
  if (!Number.isInteger(monthsPerYear) || monthsPerYear < 1 || monthsPerYear > 366) {
    return { error: 'Jumlah bulan setahun harus bilangan bulat 1 sampai 366' };
  }

  const pkp = getOption(PKP_OPTIONS, data.pkp, 'tidak').id;
  const sellerType = getOption(SELLER_TYPES, data.seller_type, 'perorangan').id;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  if (rawItems.length > MAX_ITEMS) return { error: 'Maksimal ' + MAX_ITEMS + ' transaksi per hitungan' };

  const items = [];
  for (let index = 0; index < rawItems.length; index += 1) {
    const raw = rawItems[index] || {};
    const amount = round(raw.amount);
    const label = cleanLine(raw.label, 80);
    if (!label && amount === 0) continue;
    if (!label) return { error: 'Nama transaksi baris ' + (index + 1) + ' wajib diisi' };
    if (amount < 0) return { error: 'Nominal transaksi baris ' + (index + 1) + ' tidak boleh negatif' };
    if (amount > 1000000000000) return { error: 'Nominal transaksi baris ' + (index + 1) + ' terlalu besar' };

    items.push({
      label: label,
      category: getCategory(raw.category).id,
      amount: amount,
      includes_ppn: raw.includes_ppn === 'ya' ? 'ya' : 'tidak',
      provider_ppn: getOption(PROVIDER_PPN, raw.provider_ppn, 'tidak_tahu').id,
      payment_issuer: getOption(PAYMENT_ISSUER, raw.payment_issuer, 'tidak_tahu').id,
      note: normalizeText(raw.note, 240),
    });
  }

  return {
    data: {
      store_name: cleanLine(data.store_name, 120),
      seller_name: cleanLine(data.seller_name, 120),
      contact: cleanLine(data.contact, 120),
      period_start: periodStart,
      period_end: periodEnd,
      rate: Math.round(rate * 100) / 100,
      months_per_year: monthsPerYear,
      pkp: pkp,
      seller_type: sellerType,
      items: items,
      note: cleanBlock(data.note),
    },
  };
}

function sumBy(items, field) {
  return items.reduce((sum, item) => sum + num(item[field]), 0);
}

function computeTotals(items, data) {
  const spend = items.reduce((sum, item) => sum + num(item.amount), 0);
  const charged = sumBy(items, 'charged_ppn');
  const potential = sumBy(items, 'potential_ppn');
  const pmse = items.filter((item) => item.status === 'pmse').reduce((sum, item) => sum + item.ppn, 0);
  const spp = items.filter((item) => item.status === 'spp_tdln').reduce((sum, item) => sum + item.ppn, 0);
  const unresolved = items.filter((item) => item.status === 'perlu_cek').length;
  const transfers = items.filter((item) => item.status === 'transfer').length;
  const creditable = data.pkp === 'ya' ? charged : 0;
  const cost = charged - creditable;
  const months = data.months_per_year;

  return {
    rate: data.rate,
    months_per_year: months,
    pkp: data.pkp,
    spend: round(spend),
    ppn_charged: round(charged),
    ppn_potential: round(potential),
    ppn_total_visible: round(charged + potential),
    pmse_ppn: round(pmse),
    spp_ppn: round(spp),
    creditable: round(creditable),
    cost: round(cost),
    ppn_annual: round(charged * months),
    potential_annual: round(potential * months),
    creditable_annual: round(creditable * months),
    cost_annual: round(cost * months),
    transaction_count: items.length,
    flagged_count: items.filter((item) => item.status === 'spp_tdln' || item.status === 'perlu_cek').length,
    unresolved_count: unresolved,
    transfer_count: transfers,
  };
}

function decide(items, calc) {
  if (items.length === 0 || calc.spend === 0) {
    return {
      code: 'tanpa_data',
      label: 'Belum ada transaksi',
      tone: 'signal',
      detail: 'Isi minimal satu transaksi digital luar negeri. Tool ini tidak menebak nominal tanpa input.',
    };
  }
  if (calc.spp_ppn > 0) {
    return {
      code: 'ada_spp',
      label: 'Ada PPN yang perlu dianggarkan',
      tone: 'ember',
      detail: 'Perkiraan PPN dari transaksi yang berpotensi dipungut SPP-TDLN: ' + formatRupiah(calc.spp_ppn) + '. Pastikan penyedia belum memungut PPN yang sama.',
    };
  }
  if (calc.unresolved_count > 0) {
    return {
      code: 'perlu_cek',
      label: 'Ada transaksi yang belum jelas',
      tone: 'signal',
      detail: 'Ada ' + calc.unresolved_count + ' transaksi dengan status pemungutan yang belum pasti. Potensi PPN ' + formatRupiah(calc.ppn_potential) + ' belum dianggap sebagai pungutan.',
    };
  }
  if (calc.pmse_ppn > 0) {
    return {
      code: 'sudah_pmse',
      label: 'PPN sudah dipungut penyedia',
      tone: 'ok',
      detail: 'Penyedia sudah memungut PPN PMSE sebesar ' + formatRupiah(calc.pmse_ppn) + '. Jangan bayar PPN lagi lewat kanal pembayaran.',
    };
  }
  return {
    code: 'bukan_objek',
    label: 'Tidak ada PPN SPP-TDLN dari input ini',
    tone: 'ok',
    detail: 'Semua transaksi yang diisi adalah transfer atau tidak menunjukkan pemungutan PPN. Transfer pribadi tidak otomatis menjadi objek PPN.',
  };
}

function buildRecommendations(items, calc, verdict) {
  const list = [];
  if (items.length === 0) {
    list.push('Masukkan transaksi dari invoice atau mutasi. Jangan masukkan total belanja marketplace dalam negeri sebagai transaksi luar negeri.');
  }
  if (verdict.code === 'ada_spp') {
    list.push('Sisihkan perkiraan PPN dan cocokkan dengan bukti pungutan resmi. Jangan menyetor sendiri tanpa dasar dokumen.');
    list.push('Minta rincian DPP, tarif, dan PPN dari kanal pembayaran. Simpan jawabannya untuk rekonsiliasi.');
  }
  if (items.some((item) => item.status === 'pmse')) {
    list.push('Bila penyedia sudah memungut PPN PMSE, jangan membayar PPN yang sama ke kanal. Cek invoice dan mutasi untuk menghindari pungutan ganda.');
  }
  if (items.some((item) => item.status === 'perlu_cek')) {
    list.push('Untuk transaksi yang belum jelas, konfirmasi status PMSE penyedia dan status kanal sebelum mengakui PPN.');
  }
  if (items.some((item) => item.status === 'transfer')) {
    list.push('Transfer atau remitansi yang murni pemindahan dana bukan objek PPN. PPN hanya relevan bila ada pembelian barang atau jasa digital dari luar negeri.');
  }
  if (calc.pkp === 'ya' || calc.creditable > 0) {
    list.push('Kredit pajak hanya bisa diklaim bila Anda PKP dan dokumennya sah. Cocokkan dengan faktur atau dokumen tertentu yang dipersamakan.');
  } else {
    list.push('Karena statusnya belum PKP, PPN yang dipungut menjadi biaya. Masukkan ke perhitungan harga jual, bukan sebagai kredit pajak.');
  }
  list.push('PPh 22 final 0,5 persen dari penjualan marketplace adalah jalur terpisah. Tool ini tidak menghitung PPh 22.');
  return list;
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const items = data.items.map((item) => classifyItem(item, data.rate));
  const calc = computeTotals(items, data);
  const verdict = decide(items, calc);
  const recommendations = buildRecommendations(items, calc, verdict);

  return {
    generated_at: todayISO(now),
    store_name: data.store_name,
    seller_name: data.seller_name,
    contact: data.contact,
    period_start: data.period_start,
    period_end: data.period_end,
    period_label: formatDateID(data.period_start) + ' sampai ' + formatDateID(data.period_end),
    rate: data.rate,
    months_per_year: data.months_per_year,
    pkp: data.pkp,
    pkp_label: getOption(PKP_OPTIONS, data.pkp, 'tidak').label,
    seller_type: data.seller_type,
    seller_type_label: getOption(SELLER_TYPES, data.seller_type, 'perorangan').label,
    note: data.note,
    items: items,
    calculation: calc,
    verdict: verdict,
    recommendations: recommendations,
    policy: POLICY,
    sources: SOURCES.slice(),
    disclaimer: 'Tool ini alat bantu pemeriksaan, bukan nasihat hukum atau ketetapan pajak. Semua PPN dihitung dari input Anda dengan tarif yang Anda pilih. Status pemungutan dan kredit pajak tetap bergantung pada dokumen, status PKP, dan konfirmasi penyedia atau kanal pembayaran.',
  };
}

function readiness(input) {
  const source = Array.isArray(input && input.evidence) ? input.evidence : [];
  const valid = new Set(source.map((id) => String(id)).filter((id) => getEvidence(id)));
  const items = EVIDENCE.map((item) => ({
    id: item.id,
    label: item.label,
    group: item.group,
    critical: item.critical,
    checked: valid.has(item.id),
  }));
  const weight = items.reduce((sum, item) => sum + (item.critical ? 2 : 1), 0);
  const earned = items.reduce((sum, item) => sum + (item.checked ? (item.critical ? 2 : 1) : 0), 0);
  const score = Math.round(earned / weight * 100);
  const criticalOpen = items.filter((item) => item.critical && !item.checked);
  const missing = items.filter((item) => !item.checked);

  let verdict = 'kurang';
  let label = 'Bukti belum cukup';
  let tone = 'signal';
  if (score >= 80 && criticalOpen.length === 0) {
    verdict = 'siap';
    label = 'Siap dipakai untuk konfirmasi';
    tone = 'ok';
  } else if (score >= 50 && criticalOpen.length <= 1) {
    verdict = 'hampir';
    label = 'Hampir lengkap';
  }

  return {
    items: items,
    checked_count: items.filter((item) => item.checked).length,
    total: items.length,
    score: score,
    verdict: verdict,
    label: label,
    tone: tone,
    critical_open: criticalOpen.map((item) => item.label),
    missing: missing.map((item) => item.label),
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi untuk membuat surat' };

  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const letterType = getLetterType(data.letter_type);
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const contact = cleanLine(data.contact, 120) || '-';
  const ticket = cleanLine(data.ticket, 120) || '-';
  const chronology = cleanBlock(data.chronology) || 'Saya mencatat transaksi ini dari invoice dan mutasi pembayaran.';
  const dateLine = formatDateID(todayISO(now));

  if (analyzed.items.length === 0) return { error: 'Isi minimal satu transaksi sebelum membuat surat' };
  if (letterType.id === 'koreksi' && !analyzed.items.some((item) => item.status === 'pmse')) {
    return { error: 'Surat koreksi ganda memerlukan minimal satu transaksi yang sudah dipungut PPN PMSE' };
  }
  if (letterType.id === 'konfirmasi' && !analyzed.items.some((item) => item.status === 'transfer')) {
    return { error: 'Surat konfirmasi memerlukan minimal satu transaksi transfer atau remitansi' };
  }

  const rows = analyzed.items.map((item, index) => {
    return (index + 1) + '. ' + item.label + ' - ' + item.category_label + ' - ' + formatRupiah(item.amount) + ' - ' + item.status_label + ' - perkiraan PPN ' + formatRupiah(item.ppn);
  }).join('\n');

  let recipient = 'Kepada Tim Layanan Pelanggan,';
  let subject = '';
  let asks = [];
  let opening = '';

  if (letterType.id === 'rincian') {
    recipient = 'Kepada Tim Layanan Pelanggan dan Kepatuhan Pajak,';
    subject = 'Permintaan rincian PPN atas transaksi digital luar negeri - ' + storeName;
    opening = 'Saya, ' + sellerName + ', pemilik toko ' + storeName + ', meminta rincian pemungutan PPN atas transaksi digital luar negeri yang tercatat pada periode ' + analyzed.period_label + '.';
    asks = [
      'Apakah kanal pembayaran yang digunakan ditunjuk sebagai pemungut SPP-TDLN?',
      'Apakah PPN sudah dipungut atas transaksi berikut? Sebutkan tanggal, DPP, tarif, dan nominal PPN.',
      'Siapa pihak yang memungut PPN: penyedia PMSE, kanal pembayaran, atau pihak lain?',
      'Mohon kirimkan bukti pungutan atau konfirmasi tertulis bahwa tidak ada PPN yang dipungut.',
      'Bila terjadi pemungutan ganda, jelaskan mekanisme koreksi atau pengembaliannya.',
    ];
  } else if (letterType.id === 'konfirmasi') {
    recipient = 'Kepada Tim Layanan Pelanggan dan Kepatuhan Pajak,';
    subject = 'Konfirmasi perlakuan PPN atas transfer atau remitansi - ' + storeName;
    opening = 'Saya, ' + sellerName + ', pemilik toko ' + storeName + ', meminta konfirmasi tertulis mengenai perlakuan PPN atas transfer atau remitansi yang tercatat pada periode ' + analyzed.period_label + '.';
    asks = [
      'Apakah transaksi tersebut merupakan pembayaran atas barang atau jasa digital dari luar negeri, atau hanya pemindahan dana?',
      'Apakah ada PPN yang dipungut atas transaksi tersebut? Bila ada, sebutkan dasar, tarif, dan nominalnya.',
      'Bila transaksi hanya pemindahan dana dan bukan objek PPN, mohon konfirmasi tertulis agar tidak terjadi kekeliruan pencatatan.',
      'Mohon jelaskan dasar perlakuan yang diterapkan pada transaksi tersebut.',
    ];
  } else {
    recipient = 'Kepada Tim Layanan Pelanggan dan Kepatuhan Pajak,';
    subject = 'Permintaan koreksi dugaan pungutan PPN ganda - ' + storeName;
    opening = 'Saya, ' + sellerName + ', pemilik toko ' + storeName + ', menemukan indikasi PPN yang sudah dipungut penyedia dan berpotensi dipungut lagi oleh kanal pembayaran untuk periode ' + analyzed.period_label + '.';
    asks = [
      'Mohon cocokkan PPN yang sudah dipungut penyedia PMSE dengan PPN yang ditagih oleh kanal pembayaran.',
      'Bila terjadi pungutan ganda, mohon koreksi tagihan dan kembalikan kelebihan pungutan.',
      'Mohon kirimkan rincian DPP, tarif, nominal PPN, dan pihak pemungut untuk setiap transaksi.',
      'Mohon konfirmasi tertulis atas hasil koreksi dan tanggal penyelesaiannya.',
    ];
  }

  const lines = [];
  lines.push(recipient);
  lines.push('');
  lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + ', menghubungi Anda mengenai transaksi digital luar negeri pada periode ' + analyzed.period_label + '.');
  lines.push('');
  lines.push(opening);
  lines.push('');
  lines.push('Rincian transaksi:');
  lines.push(rows);
  lines.push('');
  lines.push('Ringkasan perkiraan:');
  lines.push('- Total belanja: ' + formatRupiah(analyzed.calculation.spend));
  lines.push('- PPN sudah atau berpotensi dipungut: ' + formatRupiah(analyzed.calculation.ppn_charged));
  lines.push('- PPN yang masih belum jelas: ' + formatRupiah(analyzed.calculation.ppn_potential));
  lines.push('- Status PKP: ' + analyzed.pkp_label);
  lines.push('- Nomor tiket sebelumnya: ' + ticket);
  lines.push('');
  lines.push('Saya meminta:');
  asks.forEach((ask, index) => {
    lines.push((index + 1) + '. ' + ask);
  });
  lines.push('');
  lines.push('Catatan pemeriksaan: ' + analyzed.verdict.label + '. ' + analyzed.verdict.detail);
  lines.push('');
  lines.push('Dasar yang saya gunakan: PMK 131/2024 tentang tarif efektif PPN non-mewah dan ketentuan pemungutan PPN oleh SPP-TDLN yang berlaku. Saya memahami bahwa surat ini bukan ketetapan pajak dan angka di dalamnya adalah perkiraan dari input saya.');
  lines.push('');
  lines.push('Kronologi: ' + chronology);
  lines.push('');
  lines.push('Terima kasih.');
  lines.push('');
  lines.push(sellerName);
  lines.push(storeName);
  lines.push('Kontak: ' + contact);

  const body = [dateLine, '', subject, '', lines.join('\n')].join('\n');
  return {
    letter_type: letterType.id,
    letter_type_label: letterType.label,
    subject: subject,
    body: body,
    generated_at: todayISO(now),
    verdict: analyzed.verdict,
    calculation: analyzed.calculation,
  };
}

function validateCase(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi untuk catatan kasus' };

  const checked = validateBase(data, now);
  if (checked.error) return checked;
  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const followup = parseISO(data.followup_date);
  if (String(data.followup_date || '').trim() && !followup) return { error: 'Tanggal follow-up terakhir tidak valid' };
  if (followup && followup > todayISO(now)) return { error: 'Tanggal follow-up terakhir tidak boleh melewati hari ini' };
  if (followup && daysBetween(checked.data.period_end, followup) < 0) {
    return { error: 'Tanggal follow-up terakhir tidak boleh sebelum akhir periode' };
  }

  const evidence = Array.from(new Set(
    (Array.isArray(data.evidence) ? data.evidence : [])
      .map((id) => String(id))
      .filter((id) => getEvidence(id))
  ));

  const item = Object.assign({}, checked.data, {
    store_name: storeName,
    seller_name: cleanLine(data.seller_name, 120),
    contact: cleanLine(data.contact, 120),
    followup_date: followup || '',
    note: cleanBlock(data.note),
    chronology: cleanBlock(data.chronology),
    evidence: evidence,
    status: getCaseStatus(data.status).id,
    letter_type: getLetterType(data.letter_type).id,
    ticket: cleanLine(data.ticket, 120),
    verdict_code: analyzed.verdict.code,
    verdict_label: analyzed.verdict.label,
    verdict_tone: analyzed.verdict.tone,
    monthly_spend: analyzed.calculation.spend,
    monthly_ppn: analyzed.calculation.ppn_charged,
    potential_ppn: analyzed.calculation.ppn_potential,
    annual_ppn: analyzed.calculation.ppn_annual,
    creditable_ppn: analyzed.calculation.creditable,
    cost_ppn: analyzed.calculation.cost,
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
  const totalMonthly = sumBy(list, 'monthly_ppn');
  const openMonthly = sumBy(open, 'monthly_ppn');
  const totalPotential = sumBy(list, 'potential_ppn');
  const totalAnnual = sumBy(list, 'annual_ppn');

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
    if (item.open && item.verdict_code === 'perlu_cek') {
      warnings.push('Kasus ' + item.store_name + ' (' + item.id + ') masih menunggu kejelasan status pemungutan PPN.');
    }
  });

  return {
    cases: list,
    total: list.length,
    open_count: open.length,
    closed_count: list.length - open.length,
    total_monthly_ppn: round(totalMonthly),
    open_monthly_ppn: round(openMonthly),
    total_potential_ppn: round(totalPotential),
    total_annual_ppn: round(totalAnnual),
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
  const periodStart = addDays(today, -29);
  return {
    store_name: 'Toko Contoh Digital',
    seller_name: 'Pemilik Toko Contoh',
    contact: '0812xxxxxxx',
    period_start: periodStart,
    period_end: periodEnd,
    rate: 11,
    months_per_year: 12,
    pkp: 'tidak',
    seller_type: 'perorangan',
    items: [
      {
        label: 'Langganan aplikasi desain',
        category: 'langganan',
        amount: 250000,
        includes_ppn: 'ya',
        provider_ppn: 'sudah',
        payment_issuer: 'tidak',
      },
      {
        label: 'Iklan digital di mesin pencari',
        category: 'iklan',
        amount: 500000,
        includes_ppn: 'tidak',
        provider_ppn: 'belum',
        payment_issuer: 'ya',
      },
      {
        label: 'Penyimpanan awan tim',
        category: 'cloud',
        amount: 150000,
        includes_ppn: 'tidak',
        provider_ppn: 'tidak_tahu',
        payment_issuer: 'ya',
      },
      {
        label: 'Transfer ke pemasok luar negeri',
        category: 'transfer',
        amount: 3000000,
        includes_ppn: 'tidak',
        provider_ppn: 'tidak_tahu',
        payment_issuer: 'tidak_tahu',
      },
    ],
    letter_type: 'rincian',
    status: 'cek_invoice',
    ticket: 'TIKET-CONTOH-049',
    followup_date: today,
    chronology: 'Saya menemukan baris PPN pada invoice aplikasi dan belum yakin apakah kanal pembayaran juga memungut PPN. Saya ingin mencocokkan sebelum mengakui biaya atau kredit pajak.',
    note: 'Contoh ilustrasi. Nominal bukan data nyata.',
    evidence: ['invoice_ppn', 'payment_proof', 'provider_tax', 'issuer_check', 'transaction_list', 'provider_country', 'purchase_log'],
  };
}

function meta(now = new Date()) {
  return {
    generated_at: todayISO(now),
    categories: CATEGORIES,
    includes_ppn: INCLUDES_PPN,
    provider_ppn: PROVIDER_PPN,
    payment_issuer: PAYMENT_ISSUER,
    pkp_options: PKP_OPTIONS,
    seller_types: SELLER_TYPES,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    sources: SOURCES,
    defaults: DEFAULTS,
    policy: POLICY,
    disclaimer: 'Hasil adalah perkiraan dari input, bukan ketetapan pajak. Transfer atau remitansi tidak otomatis menjadi objek PPN. Penjualan di marketplace dalam negeri bukan objek SPP-TDLN.',
  };
}

module.exports = {
  SPP_STARTED,
  ANNOUNCED_DATE,
  PPN_RATE_DEFAULT,
  PPN_RATE_MIN,
  PPN_RATE_MAX,
  MAX_ITEMS,
  CATEGORIES,
  INCLUDES_PPN,
  PROVIDER_PPN,
  PAYMENT_ISSUER,
  PKP_OPTIONS,
  SELLER_TYPES,
  EVIDENCE,
  CASE_STATUSES,
  LETTER_TYPES,
  SOURCES,
  POLICY,
  DEFAULTS,
  todayISO,
  parseISO,
  addDays,
  daysBetween,
  formatDateID,
  formatRupiah,
  validateBase,
  classifyItem,
  computeTotals,
  analyze,
  readiness,
  buildLetter,
  validateCase,
  summary,
  buildExample,
  meta,
};
