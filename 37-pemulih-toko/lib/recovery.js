// Core logic for "Pemulih Toko Marketplace".
// Zero dependencies so it can be unit-tested without Express.

const PLATFORMS = [
  { id: 'shopee', name: 'Shopee', note: 'Contoh kasus terbaru banyak berasal dari Shopee, tetapi alur banding bisa berbeda per platform.' },
  { id: 'tiktok', name: 'TikTok Shop', note: 'Cek juga status akun TikTok utama karena akses toko bisa ikut terpengaruh.' },
  { id: 'tokopedia', name: 'Tokopedia', note: 'Siapkan bukti verifikasi dan nomor tiket dari Pusat Bantuan Tokopedia.' },
  { id: 'lazada', name: 'Lazada', note: 'Gunakan kanal banding resmi di Seller Center, bukan akun media sosial tidak resmi.' },
  { id: 'blibli', name: 'Blibli', note: 'Simpan semua tanggapan tertulis dari Seller Support sebagai bukti.' },
  { id: 'bukalapak', name: 'Bukalapak', note: 'Catat nomor laporan dan waktu respons setiap kali menghubungi bantuan.' },
];

const SOURCES = [
  {
    id: 'mk-suspend-2026-10-16',
    label: 'Toko Shopee hampir 10 tahun tiba-tiba kehilangan voucher dan Star Seller tanpa peringatan',
    publisher: 'Media Konsumen',
    date: '16 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/16/surat-pembaca/shopee-tiba-tiba-mematikan-toko-saya-tidak-bisa-nempel-voucher-apa-pun',
  },
  {
    id: 'mk-nik-2026-10-19',
    label: 'Dana penjualan tertahan karena NIK KTP masih terdaftar di akun lama yang sudah dihapus',
    publisher: 'Media Konsumen',
    date: '19 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/19/surat-pembaca/dana-penjualan-shopee-saya-tertahan-karena-nik-ktp-terdaftar-di-akun-yang-sudah-dihapus',
  },
  {
    id: 'mk-identitas-2026-10-14',
    label: 'Nama sesuai KTP dan foto mirip AI dipakai akun lain, dua toko kena ulasan bintang 1',
    publisher: 'Media Konsumen',
    date: '14 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/14/surat-pembaca/akun-shopee-pakai-nama-ktp-saya-dan-foto-ai-dua-toko-saya-kena-ulasan-bintang-1',
  },
  {
    id: 'mk-nik-affiliate-2026-08-22',
    label: 'NIK, NPWP, dan rekening dikunci di akun penipu sehingga pemilik sah tidak bisa mendaftar affiliate',
    publisher: 'Media Konsumen',
    date: '22 Agustus 2026',
    url: 'https://mediakonsumen.com/2026/08/22/surat-pembaca/nik-ktp-saya-digunakan-orang-lain-saya-tak-bisa-daftar-shopee-affiliate-karena-data-dikunci-di-akun-penipu',
  },
  {
    id: 'mk-recovery-scam-2026-09-24',
    label: 'Modus pemulihan akun palsu meminta OTP, memicu transaksi SPayLater Rp 10,951 juta',
    publisher: 'Media Konsumen',
    date: '24 September 2026',
    url: 'https://mediakonsumen.com/2026/09/24/surat-pembaca/tertipu-modus-pemulihan-akun-shopee-pelaku-transaksi-spaylater-rp10951-juta-ke-merchant-kitar',
  },
  {
    id: 'uu-pdp-27-2022',
    label: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, termasuk hak pembetulan dan penghapusan data',
    publisher: 'JDIH BPK RI',
    date: '17 Oktober 2022',
    url: 'https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022',
  },
];

const ISSUES = [
  {
    id: 'suspend',
    name: 'Toko dibekukan',
    short: 'Fitur jualan, voucher, atau status toko dibatasi mendadak.',
    sourceIds: ['mk-suspend-2026-10-16'],
    signs: [
      'Voucher kategori tidak bisa dipasang padahal sebelumnya normal.',
      'Status Star Seller atau fitur promosi hilang tiba-tiba.',
      'Pesanan berhenti masuk tanpa pemberitahuan yang jelas.',
      'Muncul notifikasi pelanggaran, pembatasan fitur, atau peninjauan akun.',
    ],
    checks: [
      'Lonjakan pesanan atau resi yang sangat cepat dalam beberapa hari.',
      'Kata di judul atau deskripsi yang terbaca sistem sebagai produk terlarang.',
      'Kategori produk tidak sesuai dengan isi listing.',
      'Pembatalan pesanan, keterlambatan kirim, atau komplain pembeli.',
      'Pola transaksi yang dianggap tidak wajar oleh sistem.',
    ],
    evidence: [
      'Screenshot status toko, halaman voucher, dan halaman kesehatan akun.',
      'Daftar pesanan 14 hari terakhir beserta status dan nomor resi.',
      'Bukti pengiriman, packing, stok, dan faktur pembelian dari supplier.',
      'Seluruh chat, email, dan nomor tiket dari Seller Support.',
      'KTP, NIB, dan dokumen verifikasi usaha yang relevan.',
    ],
    actions: [
      { title: 'Dokumentasikan kondisi hari ini', detail: 'Screenshot halaman toko, voucher yang gagal dipasang, status Star Seller, dan menu pelanggaran sebelum ada perubahan.' },
      { title: 'Minta rincian tertulis', detail: 'Tanyakan aturan yang dilanggar, ID pesanan atau transaksi yang dimaksud, dan bukti yang mendasari keputusan. Jangan puas dengan jawaban template.' },
      { title: 'Susun kronologi 14 hari', detail: 'Catat tanggal, jumlah pesanan, perubahan stok, iklan, dan semua respons CS. Kronologi yang rapi memudahkan peninjauan.' },
      { title: 'Kumpulkan bukti operasional', detail: 'Siapkan resi, bukti serah terima kurir, video packing, dan faktur supplier untuk membuktikan transaksi berjalan wajar.' },
      { title: 'Kirim banding resmi', detail: 'Gunakan satu thread dan satu nomor tiket. Lampirkan bukti, tulis permintaan spesifik, lalu minta keputusan tertulis.' },
      { title: 'Eskalasi bila jawaban tetap template', detail: 'Gunakan kanal banding resmi, lalu kanal pengaduan Kementerian UMKM atau Kemendag. Simpan semua nomor tiket.' },
    ],
    escalation: [
      'Seller Support dan kanal banding resmi di Seller Center.',
      'Kanal pengaduan Kementerian UMKM atau Kementerian Perdagangan.',
      'Surat pembaca media konsumen sebagai upaya terakhir, tanpa membocorkan data pribadi sensitif.',
    ],
    donts: [
      'Jangan membuat akun baru dengan identitas yang sama untuk menghindari pembatasan.',
      'Jangan menghapus chat, email, atau screenshot yang bisa menjadi bukti.',
      'Jangan percaya jasa pemulihan akun yang meminta OTP, password, atau biaya di muka.',
      'Jangan menyerang balik dengan ulasan palsu atau pesanan fiktif.',
    ],
    letter: {
      subject: 'Permohonan peninjauan ulang dan pemulihan toko',
      context: 'Pembatasan terjadi mendadak dan saya belum menerima rincian yang cukup tentang aturan atau transaksi yang dianggap melanggar.',
      request: 'Mohon tinjau ulang pembatasan ini dan pulihkan fitur toko yang terdampak bila tidak ditemukan pelanggaran yang terbukti.',
      basis: 'Saya meminta keputusan yang berbasis bukti, bukan jawaban template, dan saya siap memberikan klarifikasi tambahan.',
    },
  },
  {
    id: 'nik',
    name: 'NIK terkunci',
    short: 'NIK, NPWP, atau rekening tidak bisa dipakai karena tertaut akun lain.',
    sourceIds: ['mk-nik-2026-10-19', 'mk-nik-affiliate-2026-08-22', 'uu-pdp-27-2022'],
    signs: [
      'Pencairan dana gagal karena NIK harus sama dengan rekening bank.',
      'Pendaftaran affiliate atau verifikasi ditolak karena NIK sudah dipakai.',
      'Sistem menyebut NIK terdaftar di akun lama yang dibatasi atau dihapus.',
      'Data KTP, NPWP, atau rekening muncul di akun yang tidak Anda kenali.',
    ],
    checks: [
      'NIK atau NPWP pernah dipakai akun lama yang dibatasi atau dihapus.',
      'Nama rekening bank tidak sama dengan nama pada NIK.',
      'Verifikasi instan gagal, tetapi verifikasi standar belum dicoba.',
      'Data pribadi dipakai orang lain tanpa izin.',
    ],
    evidence: [
      'Foto KTP dan selfie dengan KTP yang masih terbaca jelas.',
      'NPWP dan buku rekening atau rekening koran yang namanya sesuai KTP.',
      'Screenshot pesan error dan syarat verifikasi yang diminta platform.',
      'Nomor tiket, tanggal, dan isi seluruh komunikasi dengan CS.',
      'Bukti akun lama sudah dihapus atau dibatasi, bila ada.',
      'Laporan kepolisian bila ada indikasi pencurian identitas.',
    ],
    actions: [
      { title: 'Cek jalur verifikasi', detail: 'Bila verifikasi instan gagal, coba jalur verifikasi standar. Pembaca Media Konsumen melaporkan jalur ini membantu kasus NIK yang tertahan.' },
      { title: 'Siapkan bukti identitas lengkap', detail: 'Pastikan nama di KTP, NPWP, dan rekening bank konsisten. Foto harus terang dan tidak terpotong.' },
      { title: 'Minta pemutusan tautan secara tertulis', detail: 'Sebutkan NIK, NPWP, dan rekening yang ingin dilepas dari akun lama. Minta alasan tertulis bila permintaan ditolak.' },
      { title: 'Gunakan hak atas data pribadi', detail: 'Rujuk hak pembetulan dan penghapusan data dalam UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.' },
      { title: 'Eskalasi ke kanal privasi', detail: 'Hubungi kanal pelindungan data pribadi platform, bukan hanya CS umum. Bila identitas dicuri, buat laporan kepolisian.' },
      { title: 'Jangan memakai data orang lain', detail: 'Memakai identitas orang lain untuk mencairkan dana menimbulkan risiko hukum dan masalah verifikasi baru.' },
    ],
    escalation: [
      'Seller Support dan formulir verifikasi resmi platform.',
      'Kanal pelindungan data pribadi atau privacy officer platform.',
      'Kepolisian bila ada pencurian identitas atau kerugian finansial.',
      'Otoritas pelindungan data pribadi bila platform tidak menanggapi.',
    ],
    donts: [
      'Jangan memakai NIK, NPWP, atau rekening orang lain agar dana bisa dicairkan.',
      'Jangan mengirim foto KTP ke jasa pemulihan atau akun media sosial tidak resmi.',
      'Jangan hanya mengandalkan live chat tanpa menyimpan nomor tiket.',
      'Jangan menghapus akun lama sebelum ada bukti tertulis bahwa data sudah dilepas.',
    ],
    letter: {
      subject: 'Permohonan pembetulan data dan pemutusan tautan NIK',
      context: 'Data NIK, NPWP, atau rekening saya tidak dapat digunakan karena masih tertaut ke akun lama yang sudah dibatasi atau dihapus.',
      request: 'Mohon putuskan tautan (unlink) NIK, NPWP, dan data rekening saya dari akun lama, lalu pulihkan akses verifikasi dan pencairan dana di akun resmi saya.',
      basis: 'Permohonan ini merujuk pada hak pembetulan dan pemutusan tautan data pribadi dalam Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Saya siap mengikuti verifikasi wajah atau panggilan video.',
    },
  },
  {
    id: 'hijack',
    name: 'Akun dibajak',
    short: 'Akun diambil alih, OTP diminta, atau muncul transaksi tidak dikenal.',
    sourceIds: ['mk-recovery-scam-2026-09-24'],
    signs: [
      'Tidak bisa login karena password atau nomor telepon diubah.',
      'Ada notifikasi login dari perangkat atau lokasi yang tidak dikenal.',
      'Muncul transaksi, pinjaman, atau pembayaran yang tidak Anda lakukan.',
      'Seseorang mengaku petugas platform meminta OTP atau mengklik tautan.',
    ],
    checks: [
      'Ada notifikasi login atau perubahan nomor dan email.',
      'Muncul transaksi, pinjaman, atau pembayaran yang tidak dilakukan.',
      'Diminta OTP atau klik tautan oleh pihak yang mengaku platform.',
      'Perangkat lama atau nomor lama masih aktif dan bisa mengakses akun.',
    ],
    evidence: [
      'Screenshot notifikasi login, email, SMS, dan riwayat transaksi.',
      'Tangkapan layar chat atau panggilan dari pihak yang mengaku platform.',
      'Nomor pesanan, nominal, waktu, dan merchant transaksi tidak dikenal.',
      'Bukti kepemilikan akun: KTP, email, nomor telepon, dan riwayat toko.',
      'Laporan kepolisian bila ada kerugian finansial.',
      'Nomor tiket OJK 157 bila menyangkut pinjaman atau paylater.',
    ],
    actions: [
      { title: 'Amankan akses sekarang', detail: 'Ganti password, keluarkan semua sesi perangkat, dan amankan email serta nomor telepon pemulihan.' },
      { title: 'Bekukan transaksi', detail: 'Minta platform membekukan akun sementara dan menahan transaksi tidak sah. Hubungi bank atau penyedia paylater bila ada tagihan.' },
      { title: 'Jangan bagikan OTP baru', detail: 'Platform tidak pernah meminta OTP lewat chat atau telepon. OTP adalah kunci akun, bukan bukti verifikasi petugas.' },
      { title: 'Kumpulkan bukti', detail: 'Simpan semua notifikasi, nomor pesanan, nominal, waktu, dan identitas penerima dana yang terlihat.' },
      { title: 'Lapor polisi bila ada kerugian', detail: 'Laporan kepolisian membantu proses sengketa dan penelusuran dana. Simpan nomor laporan.' },
      { title: 'Pantau tagihan dan laporan kredit', detail: 'Untuk paylater atau pinjaman, minta penangguhan penagihan selama pemeriksaan dan pantau tagihan berikutnya.' },
    ],
    escalation: [
      'Tim keamanan atau fraud platform.',
      'Bank penerbit kartu atau penyedia paylater.',
      'Kepolisian untuk dugaan akses tidak sah dan penipuan.',
      'OJK 157 bila menyangkut pinjaman, paylater, atau sengketa keuangan.',
    ],
    donts: [
      'Jangan membagikan OTP, password, atau kode verifikasi kepada siapa pun.',
      'Jangan mengikuti tautan pemulihan akun dari chat atau media sosial.',
      'Jangan membayar jasa pemulihan akun di muka.',
      'Jangan menunggu tagihan berikutnya sebelum melapor ke bank atau platform.',
    ],
    letter: {
      subject: 'Permohonan pengamanan akun dan penyelidikan transaksi tidak sah',
      context: 'Saya tidak lagi memiliki kendali penuh atas akun dan terdapat aktivitas atau transaksi yang tidak saya lakukan.',
      request: 'Mohon bekukan akun sementara, selidiki transaksi tidak sah, batalkan kewajiban yang timbul, dan pulihkan akses ke akun resmi saya.',
      basis: 'Saya bersedia menyerahkan bukti kepemilikan akun, laporan kepolisian, dan keterangan tambahan yang diperlukan.',
    },
  },
  {
    id: 'fake_reviews',
    name: 'Identitas dipakai',
    short: 'Nama atau foto dipakai akun lain, lalu toko diserang ulasan bintang 1.',
    sourceIds: ['mk-identitas-2026-10-14', 'mk-nik-affiliate-2026-08-22', 'uu-pdp-27-2022'],
    signs: [
      'Akun lain memakai nama sesuai KTP atau foto yang mirip wajah Anda.',
      'Muncul pesanan kecil dari akun baru lalu langsung diberi ulasan bintang 1.',
      'Ulasan negatif datang serentak dari akun yang tidak dikenal.',
      'Identitas Anda dipakai untuk doxxing atau menyerang reputasi toko.',
    ],
    checks: [
      'Akun lain memakai nama KTP atau foto Anda.',
      'Ada pesanan kecil lalu ulasan bintang 1.',
      'Ulasan muncul serentak dari akun baru.',
      'Identitas dipakai untuk doxxing atau menyerang reputasi.',
    ],
    evidence: [
      'Screenshot profil akun palsu dan kemiripan nama atau foto dengan KTP.',
      'Nomor pesanan, tanggal, isi ulasan, dan tangkapan layar bintang 1.',
      'Nomor tiket laporan yang sudah dikirim ke platform.',
      'Bukti bahwa foto diambil dari listing atau akun resmi Anda.',
      'Laporan kepolisian bila terjadi doxxing atau pencurian identitas.',
    ],
    actions: [
      { title: 'Arsipkan bukti sebelum hilang', detail: 'Screenshot profil, pesanan, ulasan, dan komunikasi. Catat tautan dan waktu pengambilan bukti.' },
      { title: 'Laporkan akun, pesanan, dan ulasan sekaligus', detail: 'Sebutkan nomor pesanan dan alasan spesifik: identitas dipakai tanpa izin dan transaksi diduga fiktif.' },
      { title: 'Minta penghapusan ulasan', detail: 'Jelaskan bahwa persetujuan pembeli tidak mungkin diminta karena akun tersebut justru dilaporkan memakai identitas Anda.' },
      { title: 'Gunakan jalur pelindungan data', detail: 'Minta platform menindak akun yang memakai data pribadi Anda dan mencegah pendaftaran ulang dengan identitas yang sama.' },
      { title: 'Lapor polisi bila perlu', detail: 'Doxxing dan pencurian identitas bisa dilaporkan. Simpan nomor laporan untuk diajukan ke platform.' },
      { title: 'Pantau reputasi toko', detail: 'Catat dampak pada rating dan penjualan agar bisa ditunjukkan sebagai kerugian saat meminta peninjauan.' },
    ],
    escalation: [
      'Tim trust and safety atau kanal laporan akun platform.',
      'Kanal pelindungan data pribadi platform.',
      'Kepolisian bila terjadi doxxing atau pencurian identitas.',
      'Otoritas pelindungan data pribadi bila platform tidak menindak.',
    ],
    donts: [
      'Jangan membalas dengan ulasan palsu atau serangan balik.',
      'Jangan menyebarkan data pribadi pelaku ke publik.',
      'Jangan hanya melaporkan ulasan tanpa melaporkan akun dan pesanannya.',
      'Jangan menerima tawaran hapus ulasan dari pihak tidak resmi yang meminta bayaran.',
    ],
    letter: {
      subject: 'Permohonan penyelidikan akun palsu dan penghapusan ulasan',
      context: 'Nama dan foto saya digunakan oleh akun lain, lalu muncul ulasan negatif dari transaksi yang saya duga fiktif.',
      request: 'Mohon selidiki akun yang memakai identitas saya, hapus ulasan dari transaksi fiktif, dan tindak akun tersebut agar tidak mengulangi perbuatan yang sama.',
      basis: 'Permohonan ini merujuk pada hak atas pembetulan dan penghapusan data pribadi dalam Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Saya memiliki bukti profil, pesanan, ulasan, dan komunikasi dengan CS.',
    },
  },
];

const DEFAULTS = {
  issue: 'suspend',
  platform: 'shopee',
};

const EXAMPLE = {
  platform: 'shopee',
  issue: 'suspend',
  orders_per_day: 100,
  aov: 150000,
  margin_pct: 20,
  days_down: 3,
  fixed_cost_per_day: 250000,
  seller_name: 'Sari',
  store_name: 'Toko Sari Snack',
  store_id: 'contoh-toko',
  contact: '0812xxxxxxx',
  case_id: '2109830730719211531',
  chronology: '13 Oktober 2026: voucher kategori Makanan dan Minuman tiba-tiba tidak bisa dipasang. 15 Oktober 2026: CS menyebut ada kejanggalan transaksi, tetapi tidak menyebut ID pesanan yang dimaksud.',
};

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundRp(n) {
  return Math.round(n);
}

function percent(n) {
  return Math.round(n * 10) / 10;
}

function getIssue(id) {
  return ISSUES.find((issue) => issue.id === id) || ISSUES[0];
}

function getPlatform(id) {
  return PLATFORMS.find((platform) => platform.id === id) || PLATFORMS[0];
}

function getSources(ids) {
  const wanted = new Set(ids);
  return SOURCES.filter((source) => wanted.has(source.id));
}

function cleanLine(value, max = 200) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanBlock(value, max = 1200) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function formatDateID(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(now);
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  const day = Number(map.day);
  const month = Number(map.month);
  const year = map.year;
  return day + ' ' + ID_MONTHS[month - 1] + ' ' + year;
}

function severityFor(days) {
  if (days >= 14) {
    return {
      id: 'kritis',
      label: 'Eskalasi sekarang',
      detail: 'Toko sudah lama terhenti. Kerugian menumpuk dan jawaban template tidak lagi cukup.',
    };
  }
  if (days >= 7) {
    return {
      id: 'tinggi',
      label: 'Kerugian menumpuk',
      detail: 'Sudah sepekan lebih. Naikkan banding ke jalur eskalasi resmi dan minta keputusan tertulis.',
    };
  }
  if (days >= 3) {
    return {
      id: 'waspada',
      label: 'Perlu respons cepat',
      detail: 'Masih bisa diselamatkan dengan bukti yang rapi. Kirim banding spesifik hari ini.',
    };
  }
  return {
    id: 'baru',
    label: 'Baru terjadi',
    detail: 'Amankan bukti sekarang sebelum halaman atau notifikasi berubah.',
  };
}

function calculateImpact(input) {
  const data = input || {};
  const issue = getIssue(data.issue);
  const platform = getPlatform(data.platform);

  const orders = Math.max(0, toNumber(data.orders_per_day));
  const aov = Math.max(0, toNumber(data.aov));
  const marginPct = Math.min(100, Math.max(0, toNumber(data.margin_pct)));
  const days = Math.max(1, Math.floor(toNumber(data.days_down, 1)));
  const fixedCost = Math.max(0, toNumber(data.fixed_cost_per_day));

  if (orders <= 0 || aov <= 0) {
    return { error: 'Rata-rata pesanan per hari dan nilai pesanan harus lebih dari 0' };
  }

  const dailyRevenue = orders * aov;
  const dailyProfit = dailyRevenue * (marginPct / 100);
  const dailyImpact = dailyProfit + fixedCost;
  const totalRevenue = dailyRevenue * days;
  const totalProfit = dailyProfit * days;
  const totalFixed = fixedCost * days;
  const totalImpact = totalProfit + totalFixed;
  const perHour = dailyImpact / 24;
  const severity = severityFor(days);

  return {
    issue: issue.id,
    issue_label: issue.name,
    issue_short: issue.short,
    platform: platform.name,
    platform_note: platform.note,
    days_down: days,
    orders_per_day: roundRp(orders),
    aov: roundRp(aov),
    margin_pct: percent(marginPct),
    fixed_cost_per_day: roundRp(fixedCost),
    metrics: {
      daily_revenue: roundRp(dailyRevenue),
      daily_profit: roundRp(dailyProfit),
      daily_impact: roundRp(dailyImpact),
      total_revenue: roundRp(totalRevenue),
      total_profit: roundRp(totalProfit),
      total_fixed: roundRp(totalFixed),
      total_impact: roundRp(totalImpact),
      per_hour: roundRp(perHour),
    },
    severity: severity.id,
    severity_label: severity.label,
    severity_detail: severity.detail,
    signs: issue.signs,
    checks: issue.checks,
    evidence: issue.evidence,
    actions: issue.actions,
    escalation: issue.escalation,
    donts: issue.donts,
    sources: getSources(issue.sourceIds),
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const issue = getIssue(data.issue);
  const platform = getPlatform(data.platform);

  const sellerName = cleanLine(data.seller_name, 120) || '[Nama penjual]';
  const storeName = cleanLine(data.store_name, 120) || '[Nama toko]';
  const storeId = cleanLine(data.store_id, 80);
  const contact = cleanLine(data.contact, 120);
  const caseId = cleanLine(data.case_id, 120);
  const chronology = cleanBlock(data.chronology);
  const date = formatDateID(now);

  const idLine = storeId ? ' (ID toko: ' + storeId + ')' : '';
  const caseLine = caseId ? 'Nomor tiket atau laporan terakhir: ' + caseId : '';
  const evidenceLines = issue.evidence.map((item, index) => (index + 1) + '. ' + item).join('\n');
  const requestLines = [
    '1. Mohon kirimkan rincian tertulis mengenai ketentuan yang dilanggar, ID pesanan atau transaksi yang dimaksud, dan bukti yang mendasari tindakan ini.',
    '2. ' + issue.letter.request,
    '3. Mohon tinjau ulang tindakan ini dan pulihkan akses akun atau toko saya bila tidak ditemukan pelanggaran yang terbukti.',
    '4. Mohon berikan keputusan tertulis beserta nomor tiket agar saya dapat memantau prosesnya.',
  ].join('\n');

  const lines = [
    'Kepada Tim Seller Support ' + platform.name + ',',
    '',
    'Perihal: ' + issue.letter.subject,
    '',
    'Saya, ' + sellerName + ', pemilik toko ' + storeName + idLine + ' di ' + platform.name + ', mengajukan permohonan peninjauan ulang atas tindakan yang menimpa akun atau toko saya.',
    '',
  ];

  if (chronology) {
    lines.push('Kronologi:', chronology, '');
  }
  if (caseLine) {
    lines.push(caseLine, '');
  }

  lines.push(
    issue.letter.context,
    '',
    'Bukti yang saya lampirkan:',
    evidenceLines,
    '',
    'Permintaan saya:',
    requestLines,
    '',
    issue.letter.basis,
    '',
    'Saya siap memberikan klarifikasi tambahan dan mengikuti proses verifikasi resmi yang diperlukan.',
    '',
    'Hormat saya,',
    sellerName
  );

  if (contact) {
    lines.push(contact);
  }

  lines.push('', 'Dibuat pada ' + date);

  return {
    subject: issue.letter.subject,
    body: lines.join('\n'),
  };
}

module.exports = {
  calculateImpact,
  buildLetter,
  getIssue,
  getPlatform,
  getSources,
  formatDateID,
  ISSUES,
  PLATFORMS,
  SOURCES,
  DEFAULTS,
  EXAMPLE,
};
