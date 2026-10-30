'use strict';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    label: 'Shopee',
    status: 'announced',
    note: 'Shopee mengumumkan faktur pajak untuk biaya layanan, komisi affiliate, dan pembelian saldo iklan secara bertahap mulai November 2026.',
  },
  {
    id: 'tokopedia',
    label: 'Tokopedia',
    status: 'unknown',
    note: 'Belum ada pengumuman faktur pajak yang dikutip tool ini. Tokopedia termasuk empat marketplace pemungut PPh 22, tetapi jadwal faktur pajaknya cek di Seller Center.',
  },
  {
    id: 'lazada',
    label: 'Lazada',
    status: 'unknown',
    note: 'Belum ada pengumuman faktur pajak yang dikutip tool ini. Lazada termasuk empat marketplace pemungut PPh 22, tetapi jadwal faktur pajaknya cek di Seller Center.',
  },
  {
    id: 'blibli',
    label: 'Blibli',
    status: 'unknown',
    note: 'Belum ada pengumuman faktur pajak yang dikutip tool ini. Blibli termasuk empat marketplace pemungut PPh 22, tetapi jadwal faktur pajaknya cek di Seller Center.',
  },
  {
    id: 'tiktok',
    label: 'TikTok Shop',
    status: 'unknown',
    note: 'Belum ada pengumuman faktur pajak yang dikutip tool ini. Cek menu pajak dan dokumen di Seller Center.',
  },
  {
    id: 'lainnya',
    label: 'Marketplace lain',
    status: 'unknown',
    note: 'Jadwal dan cakupan faktur pajak berbeda per platform. Selalu cocokkan dengan dokumen resmi di Seller Center.',
  },
];

const FEE_TYPES = [
  { id: 'layanan', label: 'Biaya layanan dan administrasi', announced: true },
  { id: 'affiliate', label: 'Komisi affiliate', announced: true },
  { id: 'iklan', label: 'Pembelian saldo iklan', announced: true },
  { id: 'promo', label: 'Biaya promo dan kampanye', announced: false },
  { id: 'logistik', label: 'Biaya gratis ongkir dan logistik', announced: false },
];

const DOC_TYPES = [
  {
    id: 'faktur_pajak',
    label: 'Faktur Pajak',
    issuer: 'Marketplace',
    content: 'PPN atas biaya layanan, komisi affiliate, dan pembelian saldo iklan yang dibebankan ke penjual.',
    use: 'Dasar kredit Pajak Masukan bagi penjual yang berstatus PKP.',
    not_same: 'Bukan bukti pemungutan PPh 22 atas penjualan. Dua dokumen ini berbeda.',
  },
  {
    id: 'faktur_tagihan',
    label: 'Faktur Tagihan (invoice)',
    issuer: 'Marketplace',
    content: 'Rincian biaya yang dibebankan ke penjual pada satu periode.',
    use: 'Mencocokkan nominal biaya, periode, dan identitas penagihan.',
    not_same: 'Bukan dokumen PPN dan bukan bukti pemungutan PPh 22.',
  },
  {
    id: 'bukti_pph22',
    label: 'Bukti Pemungutan PPh 22',
    issuer: 'Marketplace pemungut',
    content: 'PPh Pasal 22 sebesar 0,5% dari peredaran bruto, tidak termasuk PPN dan PPnBM.',
    use: 'Kredit pajak dalam tahun berjalan atau bagian pelunasan PPh Final.',
    not_same: 'Bukan faktur pajak PPN. Jangan menjumlahkan PPN biaya layanan dengan PPh 22 penjualan seolah satu pungutan.',
  },
];

const EVIDENCE = [
  { id: 'nama', label: 'Nama pemilik toko atau badan usaha sesuai dokumen resmi', critical: true, group: 'Identitas' },
  { id: 'nik_npwp', label: 'NIK dan NPWP sesuai dokumen, bukan singkatan atau angka contoh', critical: true, group: 'Identitas' },
  { id: 'alamat', label: 'Alamat penagihan lengkap dan sesuai dokumen', critical: true, group: 'Identitas' },
  { id: 'email', label: 'Email penagihan aktif dan bisa menerima lampiran', critical: true, group: 'Identitas' },
  { id: 'cocok', label: 'Data diri dan informasi penagihan sudah dicocokkan, tidak berbeda', critical: true, group: 'Identitas' },
  { id: 'penagihan', label: 'Informasi Penagihan diisi terpisah dari Data Diri', critical: false, group: 'Pengaturan' },
  { id: 'pkp', label: 'Status PKP sudah dideklarasikan bila Anda PKP', critical: false, group: 'Pengaturan' },
  { id: 'nib', label: 'NIB dan informasi perusahaan lengkap untuk badan usaha atau Shopee Mall', critical: false, group: 'Pengaturan' },
  { id: 'screenshot', label: 'Screenshot halaman Data Diri dan Informasi Penagihan', critical: false, group: 'Arsip' },
  { id: 'arsip', label: 'Arsip faktur pajak, faktur tagihan, dan bukti PPh 22 per bulan', critical: false, group: 'Arsip' },
  { id: 'pengingat', label: 'Pengingat tanggal 30 atau 31, tanggal 12, dan tanggal 15', critical: false, group: 'Arsip' },
  { id: 'cs', label: 'Kanal CS dan nomor tiket terakhir', critical: false, group: 'Arsip' },
];

const CASE_STATUSES = [
  { id: 'menunggu', label: 'Menunggu faktur', open: true },
  { id: 'tersedia', label: 'Faktur sudah diterima', open: false },
  { id: 'tidak_ada', label: 'Faktur belum tersedia', open: true },
  { id: 'dilaporkan', label: 'Sudah dilaporkan ke CS', open: true },
  { id: 'selesai', label: 'Selesai', open: false },
];

const PROBLEMS = [
  { id: 'belum_terbit', label: 'Faktur belum tersedia sampai tanggal 12' },
  { id: 'data_salah', label: 'Nama, NPWP, atau alamat pada faktur salah' },
  { id: 'nominal_tidak_sesuai', label: 'Nominal biaya atau PPN tidak sesuai' },
];

const SOURCES = [
  {
    title: 'Shopee Mulai Terbitkan Faktur Pajak pada November 2026, Pedagang Wajib Cek Data',
    publisher: 'Ikatan Konsultan Pajak Indonesia (IKPI)',
    date: '2026-10-27',
    url: 'https://ikpi.or.id/articles/shopee-mulai-terbitkan-faktur-pajak-pada-november-2026-pedagang-wajib-cek-data',
    note: 'Faktur pajak untuk biaya layanan, komisi affiliate, dan pembelian saldo iklan terbit bertahap mulai November 2026. Data diri dan informasi penagihan wajib benar. Permohonan manual paling lambat tanggal 30 atau 31. Jika faktur belum ada sampai tanggal 12 bulan berikutnya, hubungi CS paling lambat tanggal 15.',
  },
  {
    title: 'Shopee Bertahap Terbitkan Faktur Pajak Mulai November 2026',
    publisher: 'DDTCNews',
    date: '2026-10-28',
    url: 'https://news.ddtc.co.id/berita/nasional/1823635/shopee-bertahap-terbitkan-faktur-pajak-mulai-november-2026',
    note: 'Konfirmasi cakupan biaya layanan, komisi affiliate, dan saldo iklan. Penjual Shopee Mall terdaftar sebagai penerima faktur pajak. Faktur yang sudah terbit tidak diperbarui otomatis untuk periode berjalan bila data diubah setelah periode berakhir.',
  },
  {
    title: 'Shopee Seller Wajib Tahu: Faktur Pajak dan PPh 22 adalah Dua Dokumen Berbeda',
    publisher: 'Bisa Pajak',
    date: '2026-10-29',
    url: 'https://bisapajak.id/faktur-pajak-shopee-november-2026/',
    note: 'Faktur pajak biaya layanan tidak boleh disamakan dengan bukti pemungutan PPh Pasal 22 atas penjualan. Ketepatan data penting bagi PKP untuk menentukan Pajak Masukan.',
  },
  {
    title: 'Pemungutan PPh Pasal 22 Melalui Marketplace Mulai Dilaksanakan 1 Oktober 2026',
    publisher: 'Direktorat Jenderal Pajak',
    date: '2026-10-01',
    url: 'https://www.pajak.go.id/id/siaran-pers/pemungutan-pph-pasal-22-melalui-marketplace-mulai-dilaksanakan-1-oktober-2026',
    note: 'Empat marketplace ditunjuk: Shopee, Tokopedia, Blibli, dan Lazada. Tarif PPh 22 0,5% dari peredaran bruto, tidak termasuk PPN dan PPnBM. Dapat dikreditkan dalam tahun berjalan atau menjadi pelunasan PPh Final.',
  },
  {
    title: 'PMK 131/2024: Tarif PPN Sebelas-Dua Belas',
    publisher: 'Direktorat Jenderal Pajak',
    date: '2025-01-06',
    url: 'https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas',
    note: 'Tarif PPN 12% dikalikan DPP nilai lain 11/12 menghasilkan tarif efektif 11% untuk barang dan jasa non-mewah. Angka 11% di tool ini adalah default estimasi yang bisa diubah sesuai faktur.',
  },
  {
    title: 'Pajak Lokapasar Butuh Evaluasi',
    publisher: 'Bisnis.com',
    date: '2026-10-11',
    url: 'https://epaper.bisnis.com/articles/read/20261012/433/2011629/pajak-lokapasar-butuh-evaluasi',
    note: 'Pelaporan perdana pemungutan PPh 22 di lokapasar disiapkan pada 1 November 2026 dan akan dievaluasi. Jadwal faktur pajak per platform masih bisa berubah.',
  },
];

const DEFAULTS = {
  platform: 'shopee',
  period: '',
  invoice_received: 'belum',
  ppn_rate: 11,
  includes_ppn: 'tidak',
  fees: {
    layanan: 0,
    affiliate: 0,
    iklan: 0,
    promo: 0,
    logistik: 0,
  },
  problem: 'belum_terbit',
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

function parsePeriod(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return null;
  const year = Number(text.slice(0, 4));
  if (year < 2020 || year > 2100) return null;
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
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return Number(parts[2]) + ' ' + MONTHS_ID[Number(parts[1]) - 1] + ' ' + parts[0];
}

function formatPeriodID(period) {
  const clean = parsePeriod(period);
  if (!clean) return '-';
  return MONTHS_ID[Number(clean.slice(5, 7)) - 1] + ' ' + clean.slice(0, 4);
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

function getStatus(id) {
  return CASE_STATUSES.find((item) => item.id === id) || CASE_STATUSES[0];
}

function getProblem(id) {
  return PROBLEMS.find((item) => item.id === id) || PROBLEMS[0];
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id) || null;
}

function currentPeriod(now = new Date()) {
  return now.getFullYear() + '-' + pad(now.getMonth() + 1);
}

function periodBounds(period) {
  const clean = parsePeriod(period);
  if (!clean) return null;
  const year = Number(clean.slice(0, 4));
  const month = Number(clean.slice(5, 7));
  const lastDay = new Date(year, month, 0).getDate();
  const start = clean + '-01';
  const end = clean + '-' + pad(lastDay);
  const next = new Date(year, month, 1);
  const nextPeriod = isoFromDate(next).slice(0, 7);
  return {
    period: clean,
    start: start,
    end: end,
    next_period: nextPeriod,
    availability: nextPeriod + '-12',
    complaint: nextPeriod + '-15',
    last_day: lastDay,
  };
}

function normalizeFees(input) {
  const raw = input && typeof input.fees === 'object' ? input.fees : (input || {});
  const fees = {};
  let total = 0;
  FEE_TYPES.forEach((type) => {
    const value = Math.max(0, num(raw[type.id]));
    fees[type.id] = value;
    total += value;
  });
  return { fees, total };
}

function computePpn(input) {
  const { fees, total } = normalizeFees(input);
  const rate = input.ppn_rate === '' || input.ppn_rate === undefined || input.ppn_rate === null
    ? DEFAULTS.ppn_rate
    : num(input.ppn_rate);
  const includes = String(input.includes_ppn || DEFAULTS.includes_ppn) === 'ya';
  let dpp = total;
  let ppn = 0;
  if (includes) {
    dpp = total / (1 + rate / 100);
    ppn = total - dpp;
  } else {
    ppn = total * (rate / 100);
  }
  return {
    fees: fees,
    total: Math.round(total),
    rate: round2(rate),
    includes_ppn: includes,
    dpp: Math.round(dpp),
    ppn: Math.round(ppn),
    total_with_ppn: Math.round(includes ? total : total + ppn),
    note: 'Estimasi PPN memakai tarif default 11% (tarif efektif PPN non-mewah, PMK 131/2024) dan bisa Anda ubah. Selalu cocokkan dengan nominal di faktur pajak.',
  };
}

function computeTimeline(input, now = new Date()) {
  const bounds = periodBounds(input.period);
  if (!bounds) return { error: 'Periode faktur wajib diisi dengan format YYYY-MM' };
  const today = todayISO(now);
  const receivedRaw = String(input.invoice_received || DEFAULTS.invoice_received);
  const received = ['belum', 'ya', 'tidak'].indexOf(receivedRaw) !== -1 ? receivedRaw : 'belum';

  let phase = 'siapkan';
  if (today > bounds.end) phase = 'menunggu';
  if (today >= bounds.availability && today <= bounds.complaint) phase = 'cek';
  if (today > bounds.complaint) phase = 'lewat';

  if (received === 'ya') phase = 'tersedia';

  const phases = {
    siapkan: {
      label: 'Siapkan data sebelum akhir bulan',
      tone: 'signal',
      action: 'Lengkapi Data Diri dan Informasi Penagihan sebelum tanggal ' + bounds.last_day + ' ' + formatPeriodID(bounds.period) + '.',
    },
    menunggu: {
      label: 'Menunggu penerbitan faktur',
      tone: 'signal',
      action: 'Faktur periode ini seharusnya tersedia paling lambat ' + formatDateID(bounds.availability) + '.',
    },
    cek: {
      label: 'Cek Seller Center dan lapor bila belum ada',
      tone: 'ember',
      action: 'Jika faktur belum tersedia, hubungi CS paling lambat ' + formatDateID(bounds.complaint) + ' agar pengaduan masih diproses.',
    },
    lewat: {
      label: 'Tenggat lapor sudah lewat',
      tone: 'ember',
      action: 'Menurut ketentuan yang dikutip, faktur dianggap diterima bila tidak ada laporan sampai ' + formatDateID(bounds.complaint) + '. Simpan kronologi untuk eskalasi.',
    },
    tersedia: {
      label: 'Faktur sudah diterima',
      tone: 'ok',
      action: 'Cocokkan nama, NPWP, alamat, periode, dan nominal. Simpan arsip untuk kredit pajak.',
    },
  };

  return {
    period: bounds.period,
    period_label: formatPeriodID(bounds.period),
    start: bounds.start,
    end: bounds.end,
    availability: bounds.availability,
    complaint: bounds.complaint,
    received: received,
    phase: phase,
    phase_label: phases[phase].label,
    tone: phases[phase].tone,
    action: phases[phase].action,
    days_to_end: daysBetween(today, bounds.end),
    days_to_availability: daysBetween(today, bounds.availability),
    days_to_complaint: daysBetween(today, bounds.complaint),
    note: 'Tanggal 12 dan 15 mengikuti ketentuan Shopee yang dikutip. Platform lain dapat memakai jadwal berbeda, jadi cek Seller Center.',
  };
}

function readiness(input) {
  const selected = Array.isArray(input && (input.items || input.evidence))
    ? Array.from(new Set((input.items || input.evidence).map((id) => String(id)).filter((id) => getEvidence(id))))
    : [];
  const available = EVIDENCE.filter((item) => selected.indexOf(item.id) !== -1);
  const missingCritical = EVIDENCE.filter((item) => item.critical && selected.indexOf(item.id) === -1);
  const score = Math.round((available.length / EVIDENCE.length) * 100);
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
    verdict_label: verdict === 'siap' ? 'Data siap' : verdict === 'hampir' ? 'Hampir siap' : 'Data belum cukup',
    items: EVIDENCE.map((item) => Object.assign({}, item, { checked: selected.indexOf(item.id) !== -1 })),
  };
}

function validateBase(input, now = new Date()) {
  const data = input || {};
  const period = parsePeriod(data.period);
  if (!period) return { error: 'Periode faktur wajib diisi dengan format YYYY-MM' };

  const platform = getPlatform(data.platform);
  const { fees } = normalizeFees(data);
  const rate = data.ppn_rate === '' || data.ppn_rate === undefined || data.ppn_rate === null
    ? DEFAULTS.ppn_rate
    : num(data.ppn_rate);
  if (rate <= 0 || rate > 100) return { error: 'Tarif PPN harus lebih dari 0 dan maksimal 100' };

  const received = ['belum', 'ya', 'tidak'].indexOf(String(data.invoice_received || '')) !== -1
    ? String(data.invoice_received)
    : DEFAULTS.invoice_received;
  const includes = ['ya', 'tidak'].indexOf(String(data.includes_ppn || '')) !== -1
    ? String(data.includes_ppn)
    : DEFAULTS.includes_ppn;

  return {
    data: {
      platform: platform.id,
      period: period,
      invoice_received: received,
      includes_ppn: includes,
      ppn_rate: round2(rate),
      fees: fees,
      problem: getProblem(data.problem).id,
      store_name: cleanLine(data.store_name, 120),
      store_id: cleanLine(data.store_id, 100),
      seller_name: cleanLine(data.seller_name, 120),
      npwp: cleanLine(data.npwp, 32),
      contact: cleanLine(data.contact, 120),
      ticket: cleanLine(data.ticket, 120),
      chronology: cleanBlock(data.chronology),
      note: cleanBlock(data.note),
      evidence: Array.isArray(data.evidence) ? data.evidence.map((item) => String(item)) : [],
    },
  };
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, 2000);
}

function analyze(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  const platform = getPlatform(data.platform);
  const timeline = computeTimeline(data, now);
  const ppn = computePpn(data);
  const proof = readiness({ items: data.evidence });
  const recommendations = buildRecommendations(data, timeline, ppn, proof);

  return {
    generated_at: todayISO(now),
    platform: platform.id,
    platform_name: platform.label,
    platform_note: platform.note,
    store_name: data.store_name,
    store_id: data.store_id,
    timeline: timeline,
    ppn: ppn,
    readiness: proof,
    documents: DOC_TYPES.slice(),
    fee_types: FEE_TYPES.slice(),
    recommendations: recommendations,
    sources: SOURCES.slice(),
    disclaimer: 'Jadwal dan cakupan faktur mengikuti sumber yang dikutip pada 27 sampai 29 Oktober 2026. Platform lain dapat berbeda. Tool ini bukan nasihat pajak.',
  };
}

function buildRecommendations(data, timeline, ppn, proof) {
  const recs = [];
  if (timeline.phase === 'siapkan') {
    recs.push('Perbarui Data Diri dan Informasi Penagihan sekarang. Faktur pajak memakai data yang tercatat pada akhir periode, bukan data yang diubah setelahnya.');
  } else if (timeline.phase === 'menunggu') {
    recs.push('Pantau menu pajak di Seller Center. Faktur periode ' + timeline.period_label + ' seharusnya tersedia paling lambat ' + formatDateID(timeline.availability) + '.');
  } else if (timeline.phase === 'cek') {
    recs.push('Cek Seller Center hari ini. Jika faktur belum ada, buka tiket CS sebelum ' + formatDateID(timeline.complaint) + ' dan minta nomor tiket.');
  } else if (timeline.phase === 'lewat') {
    recs.push('Tenggat lapor ke CS sudah lewat. Kumpulkan screenshot Seller Center, tanggal cek, dan nomor tiket lama untuk eskalasi tertulis.');
  } else {
    recs.push('Faktur sudah diterima. Cocokkan identitas dan nominal, lalu arsipkan faktur pajak, faktur tagihan, dan bukti PPh 22 secara terpisah.');
  }
  if (ppn.total > 0) {
    recs.push('Estimasi PPN biaya periode ini ' + formatRupiah(ppn.ppn) + ' dari biaya ' + formatRupiah(ppn.total) + '. Angka ini perkiraan, bukan pengganti nominal di faktur.');
  }
  if (data.invoice_received === 'belum' && timeline.days_to_availability !== null && timeline.days_to_availability >= 0) {
    recs.push('Tandai tanggal ' + formatDateID(timeline.availability) + ' untuk cek ketersediaan dan tanggal ' + formatDateID(timeline.complaint) + ' sebagai batas lapor.');
  }
  if (proof.missing_critical.length > 0) {
    recs.push('Lengkapi ' + proof.missing_critical.length + ' data kritis yang belum siap sebelum periode berakhir. Data yang salah membuat faktur sulit diperbaiki untuk periode berjalan.');
  }
  recs.push('Jangan mencampur faktur pajak PPN biaya layanan dengan bukti pemungutan PPh 22 penjualan. Keduanya dipakai untuk kredit pajak yang berbeda.');
  if (data.platform === 'shopee') {
    recs.push('Perubahan data setelah periode berakhir hanya berlaku untuk faktur periode berikutnya. Faktur yang sudah terbit tidak diperbarui otomatis.');
  }
  if (ppn.total === 0) {
    recs.push('Isi nominal biaya bila ingin estimasi PPN. Bila biaya nol, tidak ada PPN yang bisa dikreditkan.');
  }
  return recs;
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const storeName = cleanLine(data.store_name, 120);
  if (!storeName) return { error: 'Nama toko wajib diisi' };

  const analyzed = analyze(data, now);
  if (analyzed.error) return analyzed;

  const platform = getPlatform(analyzed.platform);
  const problem = getProblem(data.problem);
  const timeline = analyzed.timeline;
  const ppn = analyzed.ppn;
  const sellerName = cleanLine(data.seller_name, 120) || 'Pemilik toko';
  const npwp = cleanLine(data.npwp, 32) || 'sesuai data yang terdaftar';
  const chronology = cleanBlock(data.chronology) || 'Saya sudah memeriksa Seller Center pada tanggal ' + formatDateID(todayISO(now)) + ' dan faktur belum saya temukan.';

  const feeLines = FEE_TYPES
    .filter((type) => ppn.fees[type.id] > 0)
    .map((type) => '- ' + type.label + ': ' + formatRupiah(ppn.fees[type.id]));

  const subject = 'Permintaan pemeriksaan faktur pajak periode ' + timeline.period_label + ' - ' + storeName;
  const lines = [
    'Kepada Tim Layanan Penjual ' + platform.label + ',',
    '',
    'Saya, ' + sellerName + ', pemilik toko ' + storeName + (analyzed.store_id ? ' (' + analyzed.store_id + ')' : '') + ', meminta pemeriksaan dokumen perpajakan untuk periode ' + timeline.period_label + '.',
    '',
    'Data penjual:',
    '- Platform: ' + analyzed.platform_name,
    '- Nama toko: ' + storeName,
    '- NPWP: ' + npwp,
    '- Kontak: ' + (analyzed.contact || '-'),
    '- Nomor tiket sebelumnya: ' + (analyzed.ticket || '-'),
    '',
    'Periode faktur: ' + timeline.period_label + ' (' + timeline.start + ' sampai ' + timeline.end + ')',
    'Jadwal yang saya gunakan:',
    '- Batas pembaruan data: ' + formatDateID(timeline.end),
    '- Perkiraan ketersediaan faktur: ' + formatDateID(timeline.availability),
    '- Batas lapor ke CS: ' + formatDateID(timeline.complaint),
    '',
    'Masalah yang saya ajukan: ' + problem.label + '.',
    '',
    'Rincian biaya yang saya catat:',
  ];
  if (feeLines.length > 0) {
    lines.push.apply(lines, feeLines);
    lines.push('- Total biaya: ' + formatRupiah(ppn.total));
    lines.push('- Estimasi PPN ' + ppn.rate + '%: ' + formatRupiah(ppn.ppn) + ' (perkiraan, mohon cocokkan dengan faktur)');
  } else {
    lines.push('- Belum ada rincian biaya yang saya masukkan. Mohon faktur tagihan dilampirkan agar saya dapat mencocokkan.');
  }
  lines.push('');
  lines.push('Kronologi:');
  lines.push(chronology);
  lines.push('');
  lines.push('Yang saya minta:');
  lines.push('1. Kirimkan faktur pajak, faktur tagihan, dan bukti pemungutan PPh 22 periode ' + timeline.period_label + ' bila tersedia.');
  lines.push('2. Jelaskan tertulis bila faktur pajak belum diterbitkan, termasuk alasan dan perkiraan tanggal terbit.');
  lines.push('3. Perbaiki nama, NPWP, alamat, atau nominal bila ada ketidaksesuaian, dan beri tahu apakah koreksi berlaku untuk periode berjalan.');
  lines.push('4. Berikan nomor tiket dan jawaban tertulis agar saya dapat menindaklanjuti.');
  lines.push('');
  lines.push('Saya memahami bahwa faktur pajak atas biaya layanan berbeda dari bukti pemungutan PPh Pasal 22 atas penjualan. Saya tidak meminta penggabungan dua dokumen tersebut.');
  lines.push('Saya juga memahami keputusan penerbitan dan koreksi berada pada ' + analyzed.platform_name + '. Saya bersedia mengirim data tambahan yang diperlukan.');
  lines.push('');
  lines.push('Hormat saya,');
  lines.push(sellerName);
  lines.push(analyzed.contact || '-');
  lines.push(formatDateID(todayISO(now)));

  return {
    subject: subject,
    body: lines.join('\n'),
    timeline: timeline,
    ppn: ppn,
    readiness: analyzed.readiness,
    documents: analyzed.documents,
  };
}

function buildExample(now = new Date()) {
  const current = currentPeriod(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = isoFromDate(previousDate).slice(0, 7);
  return {
    platform: 'shopee',
    period: previous,
    invoice_received: 'tidak',
    includes_ppn: 'tidak',
    ppn_rate: 11,
    fees: {
      layanan: 1250000,
      affiliate: 350000,
      iklan: 600000,
      promo: 0,
      logistik: 0,
    },
    store_name: 'Toko Contoh',
    store_id: 'toko-contoh',
    seller_name: 'Pemilik Toko Contoh',
    npwp: '00.000.000.0-000.000',
    contact: '0812xxxxxxx',
    ticket: 'TIKET-CONTOH-2026',
    problem: 'belum_terbit',
    chronology: 'Saya memeriksa menu dokumen pajak di Seller Center pada tanggal 11 dan 13 bulan berikutnya. Faktur pajak periode ini belum muncul, sedangkan faktur tagihan sudah ada.',
    note: 'Contoh ilustrasi. NPWP dan nominal adalah contoh, bukan data nyata.',
    evidence: ['nama', 'nik_npwp', 'alamat', 'email', 'cocok', 'penagihan', 'pkp', 'screenshot', 'pengingat', 'cs'],
  };
}

function validateCase(input, now = new Date()) {
  const checked = validateBase(input, now);
  if (checked.error) return checked;
  const data = checked.data;
  if (!data.store_name) return { error: 'Nama toko wajib diisi' };

  const status = getStatus(input.case_status || input.status || 'menunggu');
  const receivedDate = parseISO(input.received_date);
  if (String(input.received_date || '').trim() && !receivedDate) return { error: 'Tanggal faktur diterima tidak valid' };
  if (receivedDate && receivedDate > todayISO(now)) return { error: 'Tanggal faktur diterima tidak boleh melewati hari ini' };

  const ppn = computePpn(data);
  return {
    item: {
      platform: data.platform,
      period: data.period,
      store_name: data.store_name,
      store_id: data.store_id,
      status: status.id,
      ticket: data.ticket,
      fee_total: ppn.total,
      ppn_amount: ppn.ppn,
      fees: data.fees,
      ppn_rate: data.ppn_rate,
      includes_ppn: data.includes_ppn,
      received_date: receivedDate || '',
      note: data.note,
    },
  };
}

function caseView(raw, now = new Date()) {
  const data = raw || {};
  const analyzed = analyze(data, now);
  const status = getStatus(data.status || 'menunggu');
  const flags = [];

  if (analyzed.error) {
    return Object.assign({}, data, {
      error: analyzed.error,
      flags: [analyzed.error],
      flags_count: 1,
    });
  }

  const timeline = analyzed.timeline;
  const open = status.open;
  if (open && timeline.phase === 'lewat') {
    flags.push('Tenggat lapor ke CS sudah lewat. Simpan kronologi dan minta eskalasi tertulis.');
  }
  if (open && timeline.phase === 'cek') {
    flags.push('Faktur seharusnya tersedia. Lapor ke CS paling lambat ' + formatDateID(timeline.complaint) + '.');
  }
  if (status.id === 'tidak_ada' && timeline.phase === 'siapkan') {
    flags.push('Periode masih berjalan. Faktur belum bisa dinilai sebelum periode berakhir.');
  }
  if (status.id === 'tersedia' && !data.received_date) {
    flags.push('Status sudah diterima tetapi tanggal terima belum dicatat.');
  }
  if (analyzed.ppn.ppn > analyzed.ppn.total) {
    flags.push('Nilai PPN lebih besar dari total biaya. Periksa kembali input nominal.');
  }
  if (data.platform === 'shopee' && timeline.phase === 'tersedia') {
    flags.push('Cocokkan identitas dan nominal. Faktur yang sudah terbit tidak diperbarui otomatis untuk periode berjalan.');
  }

  return Object.assign({}, analyzed, {
    id: data.id || '',
    created_at: data.created_at || '',
    case_status: status.id,
    case_status_label: status.label,
    open: open,
    received_date: data.received_date || '',
    note: data.note || '',
    flags: flags,
    flags_count: flags.length,
  });
}

function summary(cases, now = new Date()) {
  const views = (Array.isArray(cases) ? cases : []).map((item) => caseView(item, now));
  const open = views.filter((item) => item.open);
  const missing = views.filter((item) => item.case_status === 'tidak_ada');
  const reported = views.filter((item) => item.case_status === 'dilaporkan');
  const available = views.filter((item) => item.case_status === 'tersedia' || item.case_status === 'selesai');

  let totalFee = 0;
  let totalPpn = 0;
  views.forEach((item) => {
    if (item.ppn) {
      totalFee += item.ppn.total;
      totalPpn += item.ppn.ppn;
    }
  });

  let nearestComplaint = null;
  open.forEach((item) => {
    if (!item.timeline) return;
    const left = item.timeline.days_to_complaint;
    if (left === null || left < 0) return;
    if (nearestComplaint === null || left < nearestComplaint) nearestComplaint = left;
  });

  return {
    cases: views,
    total_cases: views.length,
    open_cases: open.length,
    missing_cases: missing.length,
    reported_cases: reported.length,
    available_cases: available.length,
    total_fee: Math.round(totalFee),
    total_ppn: Math.round(totalPpn),
    nearest_complaint_days: nearestComplaint,
  };
}

function meta() {
  return {
    platforms: PLATFORMS,
    fee_types: FEE_TYPES,
    doc_types: DOC_TYPES,
    evidence: EVIDENCE,
    case_statuses: CASE_STATUSES,
    problems: PROBLEMS,
    sources: SOURCES,
    defaults: DEFAULTS,
    schedule: {
      data_update: 'tanggal 30 atau 31 pada bulan periode',
      availability: 'tanggal 12 bulan berikutnya',
      complaint: 'tanggal 15 bulan berikutnya',
    },
    ppn_default_rate: DEFAULTS.ppn_rate,
  };
}

module.exports = {
  analyze,
  buildExample,
  buildLetter,
  caseView,
  computePpn,
  computeTimeline,
  currentPeriod,
  periodBounds,
  readiness,
  summary,
  todayISO,
  addDays,
  daysBetween,
  formatDateID,
  formatPeriodID,
  formatRupiah,
  getStatus,
  validateCase,
  meta,
  DEFAULTS,
  DOC_TYPES,
  EVIDENCE,
  FEE_TYPES,
  PROBLEMS,
  PLATFORMS,
  SOURCES,
  CASE_STATUSES,
};
