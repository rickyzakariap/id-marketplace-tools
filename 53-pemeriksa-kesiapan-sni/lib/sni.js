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

const ROLES = [
  { id: 'pedagang', label: 'Pedagang atau reseller' },
  { id: 'produsen', label: 'Produsen' },
  { id: 'importir', label: 'Importir' },
  { id: 'maklun', label: 'Pemilik merek dengan produksi maklun' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'cek_dokumen', label: 'Cek dokumen', open: true },
  { id: 'minta_pemasok', label: 'Menunggu pemasok', open: true },
  { id: 'minta_lspro', label: 'Menunggu LSPro', open: true },
  { id: 'listing_dijeda', label: 'Listing dijeda', open: true },
  { id: 'siap', label: 'Siap diperiksa', open: false },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
];

const LETTER_TYPES = [
  { id: 'pemasok', label: 'Surat ke pemasok' },
  { id: 'klarifikasi', label: 'Surat klarifikasi ke LSPro' },
  { id: 'marketplace', label: 'Surat klarifikasi ke marketplace' },
];

const PRODUCTS = [
  {
    id: 'selang-termoplastik',
    label: 'Selang termoplastik elastomer untuk kompor gas LPG',
    short: 'Selang termoplastik LPG',
    sni: 'SNI 8022:2022',
    regulation: 'Permenperin 27/2024',
    group: 'Dapur dan LPG',
    mandatory: true,
    note: 'Selang kompor gas LPG dari bahan termoplastik elastomer.',
  },
  {
    id: 'tangki-air',
    label: 'Tangki air silinder vertikal',
    short: 'Tangki air silinder',
    sni: 'SNI 7276:2020',
    regulation: 'Permenperin 50/2024',
    group: 'Air dan sanitasi',
    mandatory: true,
    note: 'Tangki silinder dari polietilena yang dipasang tegak, termasuk hasil cetak putar atau cetak tiup.',
  },
  {
    id: 'selang-karet',
    label: 'Selang karet untuk kompor gas LPG',
    short: 'Selang karet LPG',
    sni: 'SNI 7213:2014',
    regulation: 'Permenperin 57/2024',
    group: 'Dapur dan LPG',
    mandatory: true,
    note: 'Selang kompor gas LPG dari bahan karet.',
  },
  {
    id: 'karet-perapat',
    label: 'Karet perapat katup tabung LPG',
    short: 'Karet perapat LPG',
    sni: 'SNI 7655:2023',
    regulation: 'Permenperin 58/2024',
    group: 'Dapur dan LPG',
    mandatory: true,
    note: 'Rubber seal pada katup tabung LPG.',
  },
  {
    id: 'helm',
    label: 'Helm pengendara kendaraan bermotor roda dua',
    short: 'Helm roda dua',
    sni: 'SNI 1811:2007 dan SNI 1811-2007/Amd1:2010',
    regulation: 'Permenperin 59/2024',
    group: 'Otomotif',
    mandatory: true,
    note: 'Helm untuk pengendara sepeda motor.',
  },
  {
    id: 'melamin',
    label: 'Perlengkapan makan dan minum melamin',
    short: 'Perlengkapan melamin',
    sni: 'SNI 7322:2008',
    regulation: 'Permenperin 60/2024',
    group: 'Dapur dan LPG',
    mandatory: true,
    note: 'Piring, gelas, dan perlengkapan makan atau minum dari melamin.',
  },
  {
    id: 'minyak-lumas',
    label: 'Minyak lumas kendaraan bermotor',
    short: 'Minyak lumas',
    sni: 'SNI 7069-1:2020 sampai SNI 7069-7:2021',
    regulation: 'Permenperin 8/2025',
    group: 'Otomotif',
    mandatory: true,
    note: 'Pelumas kendaraan bermotor yang diatur dalam tujuh bagian SNI.',
  },
  {
    id: 'ban',
    label: 'Ban kendaraan bermotor',
    short: 'Ban',
    sni: 'SNI 98:2019, SNI 100:2019, SNI 99:2019, SNI 101:2019, dan SNI 6700:2012',
    regulation: 'Permenperin 9/2025, diubah Permenperin 24/2026 yang berlaku 17 September 2026',
    group: 'Otomotif',
    mandatory: true,
    note: 'Mencakup ban mobil penumpang, truk ringan, truk dan bus, sepeda motor, serta ban dalam.',
  },
  {
    id: 'lain',
    label: 'Produk lain atau belum yakin',
    short: 'Produk lain',
    sni: '',
    regulation: '',
    group: 'Lainnya',
    mandatory: false,
    note: 'Tool ini hanya memuat 8 produk wajib SNI. Produk di luar daftar belum tentu bebas SNI, jadi cocokkan dulu dengan daftar resmi Kemenperin atau BSN.',
  },
];

const EVIDENCE = [
  {
    id: 'sni_certificate',
    label: 'Sertifikat SNI produk dari LSPro',
    group: 'Sertifikasi',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: ['pedagang', 'produsen', 'importir', 'maklun'],
  },
  {
    id: 'sppt_sni',
    label: 'SPPT SNI dari Kemenperin',
    group: 'Sertifikasi',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: ['pedagang', 'produsen', 'importir', 'maklun'],
  },
  {
    id: 'sni_mark',
    label: 'Tanda SNI pada produk, kemasan, atau label',
    group: 'Produk',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: ['pedagang', 'produsen', 'importir', 'maklun'],
  },
  {
    id: 'number_match',
    label: 'Kecocokan nomor SNI dan merek dengan aturan produk',
    group: 'Produk',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: ['pedagang', 'produsen', 'importir', 'maklun'],
  },
  {
    id: 'supplier_proof',
    label: 'Salinan dokumen SNI dari pemasok',
    group: 'Pemasok',
    roles: ['pedagang'],
    critical: ['pedagang'],
  },
  {
    id: 'purchase_proof',
    label: 'Bukti pembelian atau kulakan',
    group: 'Pemasok',
    roles: ['pedagang'],
    critical: [],
  },
  {
    id: 'siinas_account',
    label: 'Akun SIINas aktif',
    group: 'Administrasi',
    roles: ['produsen', 'importir', 'maklun'],
    critical: ['produsen', 'importir', 'maklun'],
  },
  {
    id: 'trademark_proof',
    label: 'Bukti pendaftaran atau sertifikat merek',
    group: 'Administrasi',
    roles: ['produsen', 'importir', 'maklun'],
    critical: ['produsen', 'maklun'],
  },
  {
    id: 'trademark_license',
    label: 'Perjanjian lisensi merek tercatat di DJKI',
    group: 'Administrasi',
    roles: ['maklun'],
    critical: ['maklun'],
  },
  {
    id: 'official_rep',
    label: 'Bukti perwakilan resmi produsen luar negeri',
    group: 'Administrasi',
    roles: ['importir'],
    critical: ['importir'],
  },
  {
    id: 'test_report',
    label: 'Hasil uji laboratorium',
    group: 'Sertifikasi',
    roles: ['produsen', 'importir', 'maklun'],
    critical: [],
  },
  {
    id: 'listing_screenshot',
    label: 'Tangkapan layar listing dan atribut nomor sertifikat',
    group: 'Marketplace',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: [],
  },
  {
    id: 'supplier_correspondence',
    label: 'Korespondensi dengan pemasok atau LSPro',
    group: 'Pemasok',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: [],
  },
  {
    id: 'stock_list',
    label: 'Daftar stok dan nilai persediaan',
    group: 'Keuangan',
    roles: ['pedagang', 'produsen', 'importir', 'maklun'],
    critical: [],
  },
];

const SOURCES = [
  {
    title: '8 Produk Wajib SNI dari Kemenperin: Daftar dan Dampaknya bagi UMKM',
    publisher: 'UKMINDONESIA.ID',
    date: '2026-11-09',
    url: 'https://ukmindonesia.id/baca-deskripsi-posts/8-produk-wajib-sni-dari-kemenperin-daftar-dan-dampaknya-bagi-umkm',
    facts: 'Memuat daftar delapan produk wajib SNI beserta nomor SNI dan Permenperin, kewajiban produsen, importir, pemilik merek maklun, pedagang, serta risiko stok tertahan. Menyebut Permenperin 24/2026 ditetapkan 3 September 2026 dan berlaku 17 September 2026.',
  },
  {
    title: 'Apakah SNI Wajib untuk Semua Produk?',
    publisher: 'Hukumonline',
    date: '2026-07-07',
    url: 'https://www.hukumonline.com/klinik/a/Apakah-sni-wajib-cl3855',
    facts: 'Menjelaskan PP 34/2018: SNI pada dasarnya sukarela dan menjadi wajib saat kementerian teknis menerbitkan aturan. Pedagang wajib hanya memperdagangkan barang bertanda SNI, sedangkan produsen atau importir wajib menarik barang yang tidak memenuhi SNI dari peredaran.',
  },
  {
    title: 'Ketentuan Bukti Pemenuhan Standar Barang',
    publisher: 'Pusat Edukasi Penjual Shopee Indonesia',
    date: '2026-11-10',
    url: 'https://seller.shopee.co.id/edu/article/19552',
    facts: 'Halaman resmi Seller Center yang diakses 10 November 2026. Menyebut atribut nomor sertifikat SNI untuk kategori wajib, kewajiban pengisian bagi penjual Mall sejak 1 Juli 2024 untuk mainan anak dan pakaian bayi serta sejak 7 April 2025 untuk helm, ban, dan elektronik tertentu. Menegaskan nomor sertifikat SNI berbeda dari nomor SNI.',
  },
  {
    title: 'Sertifikasi Produk Wajib dan Sukarela',
    publisher: 'BBSPJI Tekstil Kementerian Perindustrian',
    date: '2026-06-02',
    url: 'https://bbt.kemenperin.go.id/layanan/sertifikasi-produk',
    facts: 'Halaman layanan yang diperbarui 2 Juni 2026. Menjelaskan sertifikasi SNI wajib dan sukarela, pendaftaran NPB melalui OSS, serta registrasi tanda SNI. Contoh produk wajib SNI yang dilayani mencakup pakaian bayi, mainan anak, sepatu pengaman, dan kertas kemasan.',
  },
];

const SCOPE_NOTE =
  'Tool memuat 8 produk yang wajib SNI menurut Permenperin. Produk di luar daftar belum tentu bebas SNI, jadi tetap cocokkan dengan daftar resmi Kemenperin atau BSN.';

const DISCLAIMER =
  'Skor ini menilai kesiapan bukti, bukan putusan hukum. Keputusan akhir ada pada LSPro, Kemenperin, dan marketplace. Tool tidak mengarang biaya atau waktu sertifikasi.';

const FIELD_LABELS = {
  stock_units: 'Jumlah stok',
  unit_cost: 'Harga modal per unit',
  monthly_revenue: 'Omzet produk per bulan',
};

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function oneOf(value, list, fallback) {
  return list.some((item) => item.id === value) ? value : fallback;
}

function findProduct(id) {
  return PRODUCTS.find((item) => item.id === id) || PRODUCTS[PRODUCTS.length - 1];
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

function applicableEvidence(role) {
  return EVIDENCE.filter((item) => item.roles.includes(role));
}

function normalizeInput(raw) {
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
    ticket: cleanText(input.ticket, MAX_TEXT),
    marketplace: oneOf(input.marketplace, MARKETPLACES, 'shopee'),
    product: oneOf(input.product, PRODUCTS, 'lain'),
    role: oneOf(input.role, ROLES, 'pedagang'),
    selling_now: oneOf(input.selling_now, YES_NO, 'tidak_tahu'),
    stock_units: numOr(input.stock_units, 0),
    unit_cost: numOr(input.unit_cost, 0),
    monthly_revenue: numOr(input.monthly_revenue, 0),
    note: cleanText(input.note, MAX_NOTE),
    status: oneOf(input.status, CASE_STATUSES, 'baru'),
    evidence: uniqueEvidence,
  };
}

function validateAnalysis(input) {
  if (!Number.isFinite(input.stock_units) || input.stock_units < 0) {
    throw new Error(FIELD_LABELS.stock_units + ' harus berupa angka 0 atau lebih.');
  }
  if (!Number.isInteger(input.stock_units)) {
    throw new Error(FIELD_LABELS.stock_units + ' harus berupa bilangan bulat.');
  }
  if (!Number.isFinite(input.unit_cost) || input.unit_cost < 0) {
    throw new Error(FIELD_LABELS.unit_cost + ' harus berupa angka 0 atau lebih.');
  }
  if (!Number.isFinite(input.monthly_revenue) || input.monthly_revenue < 0) {
    throw new Error(FIELD_LABELS.monthly_revenue + ' harus berupa angka 0 atau lebih.');
  }
}

function assessEvidence(input) {
  const items = applicableEvidence(input.role).map((item) => ({
    id: item.id,
    label: item.label,
    group: item.group,
    critical: item.critical.includes(input.role),
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

function obligationsFor(role, product) {
  const list = [];
  const productLabel = product && product.mandatory ? product.label : 'produk yang dijual';

  if (role === 'pedagang') {
    list.push('Hanya perdagangkan ' + productLabel + ' yang sudah dibubuhi tanda SNI pada barang, kemasan, atau label.');
    list.push('Minta salinan sertifikat SNI atau SPPT SNI dari pemasok, lalu cocokkan nomor SNI dan mereknya.');
    list.push('Hentikan penjualan produk yang belum bisa dibuktikan bertanda SNI. PP 34/2018 mewajibkan pedagang menghentikan penjualan barang tanpa tanda SNI.');
    list.push('Simpan bukti kulakan dan dokumen pemasok selama produk masih dijual.');
  } else if (role === 'produsen') {
    list.push('Ajukan sertifikat SNI ke LSPro terakreditasi KAN yang ditunjuk Menteri.');
    list.push('Ajukan SPPT SNI ke Kemenperin melalui SIINas sebelum membubuhkan tanda SNI.');
    list.push('Bubuhkan tanda SNI di fasilitas produksi dan pastikan produk memenuhi nomor SNI yang berlaku.');
    list.push('Siapkan sistem mutu, merek, dan dokumen teknis sesuai lampiran Permenperin produk.');
  } else if (role === 'importir') {
    list.push('Pastikan produsen luar negeri punya perwakilan resmi di Indonesia.');
    list.push('Untuk melamin, barang impor harus masuk lebih dulu ke gudang yang dikuasai perwakilan resmi sebelum diedarkan.');
    list.push('Penuhi sertifikat SNI dan SPPT SNI, lalu bubuhkan tanda SNI pada produk atau kemasan.');
    list.push('Siapkan dokumen kepabeanan dan bukti perwakilan resmi.');
  } else if (role === 'maklun') {
    list.push('Pastikan pabrik penerima maklun sudah punya sertifikat SNI untuk produk tersebut.');
    list.push('Ajukan SPPT SNI sebagai pemilik merek dengan perjanjian lisensi merek yang dicatat di DJKI.');
    list.push('Cocokkan merek pada sertifikat pabrik dengan merek yang dijual.');
    list.push('Simpan perjanjian maklun dan bukti pencatatan lisensi merek.');
  }

  list.push('Nomor SNI berbeda dari nomor sertifikat SNI. Jangan mengisi nomor SNI di atribut nomor sertifikat.');
  list.push('Periksa aturan terbaru di JDIH Kemenperin atau peraturan.go.id sebelum menumpuk stok.');

  return list;
}

function buildVerdict(input, product, evidence) {
  if (!product.mandatory) {
    return {
      level: 'signal',
      label: 'Perlu cek daftar resmi',
      note: 'Tool ini hanya memuat 8 produk wajib SNI. Produk di luar daftar belum tentu bebas SNI, jadi cocokkan dulu kode produk dengan daftar resmi Kemenperin atau BSN.',
    };
  }

  if (evidence.missing_critical.length > 0) {
    if (input.selling_now === 'ya') {
      return {
        level: 'ember',
        label: 'Risiko tinggi, hentikan penjualan sementara',
        note: 'Bukti kritis belum lengkap: ' + evidence.missing_critical.map((item) => item.label).join(', ') + '. PP 34/2018 mewajibkan pedagang hanya menjual barang bertanda SNI, jadi tahan penjualan sampai dokumen dan tanda SNI terverifikasi.',
      };
    }
    if (input.selling_now === 'tidak_tahu') {
      return {
        level: 'signal',
        label: 'Status penjualan belum jelas',
        note: 'Bukti kritis belum lengkap. Pastikan apakah produk masih dijual. Bila masih dijual, hentikan sementara sampai tanda SNI dan dokumennya terverifikasi.',
      };
    }
    return {
      level: 'signal',
      label: 'Bukti kritis belum lengkap',
      note: 'Produk tidak sedang dijual, tetapi bukti kritis masih kurang. Lengkapi sebelum stok diedarkan kembali.',
    };
  }

  if (evidence.score >= 80) {
    return {
      level: 'ok',
      label: 'Siap diperiksa',
      note: 'Bukti kritis sudah lengkap dan skor kesiapan mencapai 80 persen atau lebih. Cocokkan ulang nomor SNI, merek, dan masa berlaku dokumen sebelum menambah stok.',
    };
  }

  return {
    level: 'signal',
    label: 'Hampir siap, lengkapi bukti',
    note: 'Bukti kritis sudah ada, tetapi bukti pendukung lain masih kurang. Lengkapi agar pemeriksaan ke pemasok, LSPro, atau marketplace lebih kuat.',
  };
}

function buildRecommendations(input, product, evidence) {
  const list = [];

  if (!product.mandatory) {
    list.push('Cocokkan nama produk dan kode HS dengan daftar SNI wajib Kemenperin atau BSN. Tool ini tidak bisa menyimpulkan produk di luar daftar bebas SNI.');
  }

  if (evidence.missing_critical.length > 0) {
    list.push('Lengkapi bukti kritis: ' + evidence.missing_critical.map((item) => item.label).join(', ') + '.');
  }

  if (input.selling_now === 'ya' && evidence.missing_critical.length > 0) {
    list.push('Hentikan penjualan sementara sampai tanda SNI dan dokumen pendukung bisa ditunjukkan. Jangan menambah stok baru.');
  }

  if (input.role === 'pedagang') {
    list.push('Minta salinan sertifikat SNI dan SPPT SNI ke setiap pemasok, lalu cocokkan nomor SNI, merek, dan tanda SNI pada produk.');
  }

  if (input.role === 'produsen' || input.role === 'importir' || input.role === 'maklun') {
    list.push('Gunakan SIINas untuk pengajuan SPPT SNI. Rincian skema, biaya, dan waktu sertifikasi tanyakan langsung ke LSPro yang ditunjuk.');
  }

  if (input.role === 'importir') {
    list.push('Pastikan produsen luar negeri punya perwakilan resmi di Indonesia dan barang masuk ke gudang yang dikuasai perwakilan sebelum diedarkan.');
  }

  if (input.role === 'maklun') {
    list.push('Pastikan pabrik maklun sudah bersertifikat SNI dan perjanjian lisensi merek sudah dicatat di DJKI.');
  }

  if (product.id === 'ban') {
    list.push('Untuk ban, cek Permenperin 24/2026 yang ditetapkan 3 September 2026 dan berlaku 17 September 2026. Dokumen lama yang masih memakai aturan sebelumnya perlu dicocokkan ulang.');
  }

  list.push('Nomor SNI bukan nomor sertifikat SNI. Isi atribut marketplace dengan nomor sertifikat yang benar, bukan nomor standar.');
  list.push('Simpan tangkapan layar listing dan atribut nomor sertifikat sebagai bukti bila listing dipertanyakan.');
  list.push(DISCLAIMER);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function productTable(selectedId) {
  return PRODUCTS.filter((item) => item.mandatory).map((item) => ({
    id: item.id,
    label: item.label,
    short: item.short,
    sni: item.sni,
    regulation: item.regulation,
    group: item.group,
    selected: item.id === selectedId,
  }));
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateAnalysis(input);

  const product = findProduct(input.product);
  const roleLabel = findById(ROLES, input.role).label;
  const marketplaceLabel = findById(MARKETPLACES, input.marketplace).label;
  const evidence = assessEvidence(input);
  const verdict = buildVerdict(input, product, evidence);
  const obligations = obligationsFor(input.role, product);
  const recommendations = buildRecommendations(input, product, evidence);

  const stockUnits = Math.round(input.stock_units);
  const stuckCapital = round2(stockUnits * input.unit_cost);
  const monthlyRevenue = round2(input.monthly_revenue);
  const annualRevenue = round2(monthlyRevenue * 12);

  return {
    input,
    product: {
      id: product.id,
      label: product.label,
      short: product.short,
      sni: product.sni,
      regulation: product.regulation,
      group: product.group,
      mandatory: product.mandatory,
      note: product.note,
    },
    role_label: roleLabel,
    marketplace_label: marketplaceLabel,
    selling_now_label: findById(YES_NO, input.selling_now).label,
    exposure: {
      stock_units: stockUnits,
      unit_cost: round2(input.unit_cost),
      stuck_capital: stuckCapital,
      monthly_revenue: monthlyRevenue,
      annual_revenue: annualRevenue,
      note: 'Nilai stok dan omzet berasal dari input penjual, bukan angka resmi platform atau Kemenperin.',
    },
    verdict,
    obligations,
    evidence,
    recommendations,
    product_table: productTable(input.product),
    sources: SOURCES,
    rules: {
      covered_products: PRODUCTS.filter((item) => item.mandatory).length,
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

function readiness(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(source.evidence) ? source.evidence : source.items;
  const input = normalizeInput({ role: source.role, evidence: items });
  return assessEvidence(input);
}

function letter(raw) {
  const result = analyze(raw);
  const input = result.input;
  const type = oneOf(raw.letter_type, LETTER_TYPES, 'pemasok');
  const store = input.store_name || 'Toko saya';
  const seller = input.seller_name || 'Penjual';
  const contact = input.contact || '-';
  const product = result.product;
  const productName = product.mandatory ? product.label : 'produk yang saya jual';
  const sniLine = product.mandatory
    ? 'Nomor SNI: ' + product.sni + '.\nDasar aturan: ' + product.regulation + '.\n'
    : 'Produk belum ada di daftar 8 produk wajib SNI pada tool ini, jadi statusnya perlu dicocokkan dengan daftar resmi.\n';
  const ticket = input.ticket ? 'Nomor tiket: ' + input.ticket + '.\n' : '';
  const missing = result.evidence.missing_critical.length
    ? result.evidence.missing_critical.map((item) => '- ' + item.label).join('\n')
    : '- Tidak ada bukti kritis yang hilang.';
  const stuck = result.exposure.stuck_capital > 0
    ? 'Nilai stok yang belum bisa dipastikan: ' + formatRupiah(result.exposure.stuck_capital) + '.\n'
    : '';

  let subject = 'Permintaan salinan sertifikat SNI dan SPPT SNI untuk ' + productName;
  let heading = 'Kepada Pemasok,';
  let body = '';

  if (type === 'klarifikasi') {
    subject = 'Permintaan klarifikasi kesiapan sertifikasi SNI untuk ' + productName;
    heading = 'Kepada Lembaga Sertifikasi Produk,';
    body =
      'Saya ' + seller + ' dari ' + store + '. Saya sedang memeriksa kesiapan dokumen SNI untuk ' + productName + '.\n\n' +
      sniLine +
      'Peran saya: ' + result.role_label + '.\n' +
      ticket +
      stuck +
      '\nMohon penjelasan dari Lembaga Sertifikasi Produk (LSPro) mengenai skema sertifikasi yang berlaku, dokumen yang perlu disiapkan, penggunaan SIINas untuk SPPT SNI, serta perkiraan biaya dan waktu proses. Saya tidak meminta angka pasti bila biaya dan waktu bergantung pada hasil audit atau pengujian.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else if (type === 'marketplace') {
    subject = 'Klarifikasi kelengkapan dokumen SNI untuk listing ' + productName;
    heading = 'Kepada Tim Seller Support,';
    body =
      'Tim Seller Support ' + result.marketplace_label + ',\n\nSaya ' + seller + ', penjual di ' + store + ' pada ' + result.marketplace_label + ', meminta klarifikasi kelengkapan dokumen SNI untuk ' + productName + '.\n\n' +
      sniLine +
      'Status penjualan saat ini: ' + result.selling_now_label + '.\n' +
      ticket +
      '\nBukti yang sudah saya miliki: ' + result.evidence.checked_count + ' dari ' + result.evidence.total_count + ' bukti yang berlaku untuk peran ' + result.role_label + '.\n' +
      'Bukti kritis yang belum lengkap:\n' + missing + '\n\n' +
      'Saya tidak meminta pengecualian dari kewajiban SNI. Saya meminta penjelasan mengenai atribut nomor sertifikat yang harus diisi, dokumen yang perlu diunggah, dan tenggat yang diberikan bila listing perlu diperbaiki. Saya akan menahan penjualan sampai dokumen dan tanda SNI terverifikasi.\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else {
    body =
      'Saya ' + seller + ' dari ' + store + '. Saya menjual ' + productName + ' dan perlu memastikan produk yang saya terima sudah memenuhi kewajiban SNI.\n\n' +
      sniLine +
      'Peran saya: ' + result.role_label + '.\n' +
      ticket +
      stuck +
      '\nMohon kirimkan:\n' +
      '1. Salinan sertifikat SNI produk.\n' +
      '2. Salinan SPPT SNI.\n' +
      '3. Nomor SNI dan nomor sertifikat SNI yang berbeda satu sama lain.\n' +
      '4. Nama merek yang tercantum pada sertifikat.\n' +
      '5. Konfirmasi bahwa produk atau kemasan sudah dibubuhi tanda SNI.\n\n' +
      'Bukti kritis yang belum saya pegang:\n' + missing + '\n\n' +
      'Saya menahan pembelian dan penjualan sampai dokumen tersebut diterima dan cocok dengan produk. Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  }

  return { type, subject, heading, body };
}

function example() {
  return {
    store_name: 'Toko Dapur Contoh',
    seller_name: 'Sari',
    contact: 'sari@example.com',
    ticket: 'TKT-2026-1110',
    marketplace: 'shopee',
    product: 'melamin',
    role: 'pedagang',
    selling_now: 'ya',
    stock_units: 240,
    unit_cost: 35000,
    monthly_revenue: 12000000,
    note: 'Contoh data, bukan kasus nyata.',
    status: 'cek_dokumen',
    evidence: [
      'sni_certificate',
      'sppt_sni',
      'sni_mark',
      'purchase_proof',
      'listing_screenshot',
      'stock_list',
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
      product_label: analysis.product.short,
      product_full: analysis.product.label,
      role_label: analysis.role_label,
      marketplace_label: analysis.marketplace_label,
      selling_now_label: analysis.selling_now_label,
      stock_units: analysis.exposure.stock_units,
      unit_cost: analysis.exposure.unit_cost,
      stuck_capital: analysis.exposure.stuck_capital,
      monthly_revenue: analysis.exposure.monthly_revenue,
      annual_revenue: analysis.exposure.annual_revenue,
      readiness_score: analysis.evidence.score,
      readiness_label: analysis.evidence.label,
      missing_critical_count: analysis.evidence.missing_critical.length,
      verdict: analysis.verdict,
      status: item.status,
      status_label: status.label,
      note: item.note,
      ticket: item.ticket,
      created_at: item.created_at,
      updated_at: item.updated_at,
      analysis,
    };
  });

  const open = cases.filter((item) => findById(CASE_STATUSES, item.status).open);
  const highRisk = open.filter((item) => item.verdict.level === 'ember');
  const missingEvidence = open.filter((item) => item.missing_critical_count > 0);
  const totalStuck = round2(open.reduce((sum, item) => sum + Math.max(0, item.stuck_capital), 0));
  const totalMonthly = round2(open.reduce((sum, item) => sum + Math.max(0, item.monthly_revenue), 0));

  return {
    total: cases.length,
    open_cases: open.length,
    high_risk: highRisk.length,
    missing_evidence: missingEvidence.length,
    total_stuck_capital: totalStuck,
    total_monthly_revenue: totalMonthly,
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
    'produk',
    'peran',
    'marketplace',
    'masih_menjual',
    'stok_unit',
    'harga_modal_unit',
    'modal_tertahan',
    'omzet_bulanan',
    'omzet_tahunan',
    'skor_bukti',
    'status_bukti',
    'bukti_kritis_kurang',
    'verdict',
    'status_kasus',
    'catatan',
  ];
  const rows = summary.cases.map((item) => [
    item.id,
    item.store_name,
    item.product_full,
    item.role_label,
    item.marketplace_label,
    item.selling_now_label,
    item.stock_units,
    item.unit_cost,
    item.stuck_capital,
    item.monthly_revenue,
    item.annual_revenue,
    item.readiness_score,
    item.readiness_label,
    item.missing_critical_count,
    item.verdict.label,
    item.status_label,
    item.note,
  ]);
  return [header].concat(rows).map((row) => row.map(csvEscape).join(',')).join('\n');
}

function meta() {
  return {
    products: PRODUCTS,
    roles: ROLES,
    marketplaces: MARKETPLACES,
    yes_no: YES_NO,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    evidence: EVIDENCE,
    sources: SOURCES,
    rules: {
      covered_products: PRODUCTS.filter((item) => item.mandatory).length,
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
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
  assessEvidence,
  productTable,
  formatRupiah,
  round2,
  PRODUCTS,
  EVIDENCE,
  SOURCES,
};
