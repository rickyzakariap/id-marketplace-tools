// Halal deadline tracker logic. Dates follow PP 42/2024 as amended by PP 40/2026.
const DAY_MS = 86400000;

const CATEGORIES = [
  {
    id: 'makanan_minuman',
    label: 'Makanan dan minuman kemasan',
    group: 'Makanan, minuman, dan jasa',
    selfDeclare: true,
    animalRelevant: false,
    note: 'Termasuk bahan baku, bahan tambahan pangan, dan bahan penolong untuk makanan dan minuman.',
  },
  {
    id: 'hasil_sembelihan',
    label: 'Hasil sembelihan (daging, unggas)',
    group: 'Makanan, minuman, dan jasa',
    selfDeclare: 'conditional',
    animalRelevant: false,
    note: 'Self declare hanya jika bahan berasal dari produsen atau RPH/RPU yang bersertifikat halal.',
  },
  {
    id: 'jasa_penyembelihan',
    label: 'Jasa penyembelihan',
    group: 'Makanan, minuman, dan jasa',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Jasa penyembelihan mengikuti penahapan yang sama dengan produk makanan dan minuman.',
  },
  {
    id: 'jasa_makanan_minuman',
    label: 'Jasa makanan dan minuman (restoran, katering)',
    group: 'Makanan, minuman, dan jasa',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Jasa selain jasa penyembelihan memiliki tanggal mulai kewajiban tersendiri, 18 Oktober 2028.',
  },
  {
    id: 'obat_bahan_alam',
    label: 'Obat bahan alam',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Obat bahan alam masuk kelompok obat, bukan makanan, sehingga memakai jalur reguler.',
  },
  {
    id: 'obat_kuasi',
    label: 'Obat kuasi',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Contoh obat kuasi adalah antiseptik dan obat tenggorokan.',
  },
  {
    id: 'suplemen_kesehatan',
    label: 'Suplemen kesehatan',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Suplemen kesehatan memakai jalur reguler, bukan self declare.',
  },
  {
    id: 'kosmetik',
    label: 'Kosmetik',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Kosmetik memakai jalur reguler melalui Lembaga Pemeriksa Halal.',
  },
  {
    id: 'produk_kimiawi',
    label: 'Produk kimiawi',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Hanya produk kimiawi yang terkait makanan, minuman, obat, atau kosmetik yang wajib sertifikat halal.',
  },
  {
    id: 'produk_rekayasa_genetik',
    label: 'Produk rekayasa genetik',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Hanya produk rekayasa genetik yang terkait makanan, minuman, obat, atau kosmetik yang wajib sertifikat halal.',
  },
  {
    id: 'barang_sandang',
    label: 'Barang gunaan: sandang, penutup kepala, aksesori',
    group: 'Barang gunaan dan alat kesehatan',
    selfDeclare: false,
    animalRelevant: true,
    note: 'Wajib hanya jika barang berasal dari atau mengandung unsur hewan.',
  },
  {
    id: 'barang_rumah_tangga',
    label: 'Barang gunaan: rumah tangga, peribadatan, alat tulis, kantor',
    group: 'Barang gunaan dan alat kesehatan',
    selfDeclare: false,
    animalRelevant: true,
    note: 'Mencakup perbekalan kesehatan rumah tangga, peralatan rumah tangga, perlengkapan peribadatan, alat tulis, dan perlengkapan kantor. Wajib hanya jika mengandung unsur hewan.',
  },
  {
    id: 'alat_kesehatan_a',
    label: 'Alat kesehatan kelas risiko A',
    group: 'Barang gunaan dan alat kesehatan',
    selfDeclare: false,
    animalRelevant: true,
    note: 'Sertifikasi halal hanya untuk alat kesehatan yang berasal dari atau mengandung unsur hewan.',
  },
  {
    id: 'alat_kesehatan_b',
    label: 'Alat kesehatan kelas risiko B',
    group: 'Barang gunaan dan alat kesehatan',
    selfDeclare: false,
    animalRelevant: true,
    note: 'Sertifikasi halal hanya untuk alat kesehatan yang berasal dari atau mengandung unsur hewan.',
  },
  {
    id: 'alat_kesehatan_c',
    label: 'Alat kesehatan kelas risiko C',
    group: 'Barang gunaan dan alat kesehatan',
    selfDeclare: false,
    animalRelevant: true,
    note: 'Sertifikasi halal hanya untuk alat kesehatan yang berasal dari atau mengandung unsur hewan.',
  },
  {
    id: 'obat_bebas',
    label: 'Obat bebas',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Masa penahapan obat bebas tetap sampai 17 Oktober 2029.',
  },
  {
    id: 'obat_bebas_terbatas',
    label: 'Obat bebas terbatas',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Masa penahapan obat bebas terbatas tetap sampai 17 Oktober 2029.',
  },
  {
    id: 'obat_keras',
    label: 'Obat keras selain psikotropika',
    group: 'Obat, suplemen, dan kosmetik',
    selfDeclare: false,
    animalRelevant: false,
    note: 'Masa penahapan obat keras selain psikotropika tetap sampai 17 Oktober 2034.',
  },
];

const SCALES = [
  { id: 'mikro', label: 'Mikro', umk: true },
  { id: 'kecil', label: 'Kecil', umk: true },
  { id: 'menengah', label: 'Menengah', umk: false },
  { id: 'besar', label: 'Besar', umk: false },
];

const ORIGINS = [
  { id: 'dalam-negeri', label: 'Dalam negeri' },
  { id: 'impor', label: 'Impor' },
];

const CERTIFICATION_STATUS = [
  { id: 'belum', label: 'Belum bersertifikat' },
  { id: 'sudah', label: 'Sudah bersertifikat' },
];

const DEADLINES = {
  makanan_minuman: { umk: '2028-10-17', nonUmk: '2024-10-17', impor: '2028-10-18', imporKind: 'mulai' },
  hasil_sembelihan: { umk: '2028-10-17', nonUmk: '2024-10-17', impor: '2028-10-18', imporKind: 'mulai' },
  jasa_penyembelihan: { umk: '2028-10-17', nonUmk: '2024-10-17', impor: '2028-10-18', imporKind: 'mulai' },
  jasa_makanan_minuman: { umk: '2028-10-18', nonUmk: '2028-10-18', impor: '2028-10-18', kind: 'mulai' },
  obat_bahan_alam: { all: '2028-10-17' },
  obat_kuasi: { all: '2028-10-17' },
  suplemen_kesehatan: { all: '2028-10-17' },
  kosmetik: { all: '2028-10-17' },
  produk_kimiawi: { all: '2028-10-17' },
  produk_rekayasa_genetik: { all: '2028-10-17' },
  barang_sandang: { all: '2028-10-17' },
  barang_rumah_tangga: { all: '2028-10-17' },
  alat_kesehatan_a: { all: '2028-10-17' },
  alat_kesehatan_b: { all: '2029-10-17' },
  alat_kesehatan_c: { all: '2034-10-17' },
  obat_bebas: { all: '2029-10-17' },
  obat_bebas_terbatas: { all: '2029-10-17' },
  obat_keras: { all: '2034-10-17' },
};

const RULES = [
  {
    group: 'Makanan, minuman, hasil sembelihan, dan jasa penyembelihan',
    scale: 'Mikro dan kecil',
    deadline: '17 Oktober 2028',
    kind: 'Batas akhir penahapan',
    basis: 'PP 40/2026 Pasal 160 ayat (2)',
  },
  {
    group: 'Makanan, minuman, hasil sembelihan, dan jasa penyembelihan',
    scale: 'Menengah dan besar',
    deadline: '17 Oktober 2024',
    kind: 'Batas akhir penahapan, sudah berakhir',
    basis: 'PP 42/2024 Pasal 160 ayat (1), tidak diubah PP 40/2026',
  },
  {
    group: 'Jasa makanan dan minuman selain jasa penyembelihan',
    scale: 'Semua skala',
    deadline: '18 Oktober 2028',
    kind: 'Mulai wajib',
    basis: 'PP 40/2026 Pasal 160 ayat (1a)',
  },
  {
    group: 'Makanan, minuman, hasil sembelihan, dan jasa penyembelihan dari luar negeri',
    scale: 'Impor',
    deadline: '18 Oktober 2028',
    kind: 'Mulai wajib',
    basis: 'PP 40/2026 Pasal 160 ayat (3)',
  },
  {
    group: 'Obat bahan alam, obat kuasi, suplemen kesehatan, kosmetik, produk kimiawi, produk rekayasa genetik',
    scale: 'Semua skala',
    deadline: '17 Oktober 2028',
    kind: 'Batas akhir penahapan',
    basis: 'PP 42/2024 Pasal 161 huruf a dan d, diubah PP 40/2026',
  },
  {
    group: 'Barang gunaan: sandang, penutup kepala, aksesori, rumah tangga, peribadatan, alat tulis, kantor',
    scale: 'Semua skala',
    deadline: '17 Oktober 2028',
    kind: 'Batas akhir penahapan',
    basis: 'PP 42/2024 Pasal 161 huruf e dan f, diubah PP 40/2026',
  },
  {
    group: 'Alat kesehatan kelas risiko A',
    scale: 'Semua skala',
    deadline: '17 Oktober 2028',
    kind: 'Batas akhir penahapan',
    basis: 'PP 42/2024 Pasal 161 huruf g, diubah PP 40/2026',
  },
  {
    group: 'Obat bebas, obat bebas terbatas, dan alat kesehatan kelas risiko B',
    scale: 'Semua skala',
    deadline: '17 Oktober 2029',
    kind: 'Batas akhir penahapan',
    basis: 'PP 42/2024 Pasal 161 huruf b dan h',
  },
  {
    group: 'Obat keras selain psikotropika dan alat kesehatan kelas risiko C',
    scale: 'Semua skala',
    deadline: '17 Oktober 2034',
    kind: 'Batas akhir penahapan',
    basis: 'PP 42/2024 Pasal 161 huruf c dan i',
  },
];

const READINESS_ITEMS = [
  { id: 'nib', label: 'NIB aktif dengan skala usaha mikro atau kecil', group: 'Administrasi', detail: 'Self declare SEHATI hanya untuk UMK dengan NIB.' },
  { id: 'sihalal', label: 'Akun SIHALAL aktif', group: 'Administrasi', detail: 'Dibuat melalui ptsp.halal.go.id atau HalalMax.' },
  { id: 'product_list', label: 'Daftar produk, bahan, dan pemasok', group: 'Bahan', detail: 'Cantumkan bahan baku, bahan tambahan, dan bahan penolong.' },
  { id: 'ingredient_halal', label: 'Bukti kehalalan bahan', group: 'Bahan', detail: 'Sertifikat halal bahan atau bahan yang masuk daftar pengecualian.' },
  { id: 'simple_process', label: 'Proses produksi sederhana dan bebas kontaminasi', group: 'Proses', detail: 'Bukan proses pabrik, alat sederhana atau semi otomatis.' },
  { id: 'separate_area', label: 'Lokasi dan alat terpisah dari proses non-halal', group: 'Proses', detail: 'Dapur, alat, dan penyimpanan tidak bercampur dengan bahan haram.' },
  { id: 'supervisor', label: 'Penyelia halal sudah ditetapkan', group: 'Proses', detail: 'Ada SK penetapan dan data penyelia halal.' },
  { id: 'sjph', label: 'Manual SJPH tersusun', group: 'Dokumen', detail: 'Sistem Jaminan Produk Halal, bukan hanya pernyataan lisan.' },
  { id: 'product_photo', label: 'Foto produk dan kemasan', group: 'Dokumen', detail: 'Foto jelas untuk setiap varian yang diajukan.' },
  { id: 'declaration', label: 'Surat permohonan, pernyataan, dan akad atau ikrar', group: 'Dokumen', detail: 'Ditandatangani pemilik usaha sesuai template SIHALAL.' },
  { id: 'license', label: 'Izin edar atau SLHS jika ada', group: 'Dokumen', detail: 'PIRT, MD, UMOT, UKOT, atau SLHS. Tidak semua usaha memilikinya.' },
  { id: 'assistant', label: 'Pendamping PPH sudah dipilih', group: 'Verifikasi', detail: 'Pendamping melakukan verifikasi dan validasi sebelum diajukan.' },
];

const SOURCES = [
  {
    label: 'ANTARA News, 17 Oktober 2026: pemerintah memperpanjang penahapan sertifikasi halal hingga 2028',
    publisher: 'ANTARA News',
    date: '17 Oktober 2026',
    url: 'https://www.antaranews.com/berita/5793025/pemerintah-memperpanjang-penahapan-sertifikasi-halal-hingga-2028',
  },
  {
    label: 'BSPJI Pontianak, 20 Oktober 2026: rincian PP 40/2026 per kategori dan skala usaha',
    publisher: 'BSPJI Pontianak',
    date: '20 Oktober 2026',
    url: 'https://bspjipontianak.kemenperin.go.id/penyesuaian-penahapan-wajib-halal-2028',
  },
  {
    label: 'ANTARA News, 22 Oktober 2026: pemerintah mencari formula agar wajib halal tidak membebani UMKM',
    publisher: 'ANTARA News',
    date: '22 Oktober 2026',
    url: 'https://www.antaranews.com/berita/5805991/pemerintah-cari-solusi-agar-kebijakan-wajib-halal-tak-bebani-umkm',
  },
  {
    label: 'BPJPH, 5 Januari 2026: kriteria UMK peserta Sertifikasi Halal Gratis (SEHATI) 2026',
    publisher: 'BPJPH',
    date: '5 Januari 2026',
    url: 'https://bpjph.halal.go.id/read/ini-kriteria-pelaku-umk-yang-dapat-mengajukan-sertifikat-halal-gratis-program-sehati-2026',
  },
  {
    label: 'BPJPH, 2 Januari 2026: juknis SEHATI 2026, nilai fasilitasi Rp 230.000 dan kode SEHATI26',
    publisher: 'BPJPH',
    date: '2 Januari 2026',
    url: 'https://cmsbl.halal.go.id/uploads/1_Tahun_2026_Kepkaban_Juknis_Sehati_2026_601d2c803f.pdf',
  },
  {
    label: 'PP 42/2024 tentang Penyelenggaraan Bidang Jaminan Produk Halal, Pasal 2, 158, 160, dan 161',
    publisher: 'JDIH BPK',
    date: '17 Oktober 2024',
    url: 'https://peraturan.bpk.go.id/Details/304896/pp-no-42-tahun-2024',
  },
  {
    label: 'detikcom, 20 Oktober 2026: cara daftar sertifikasi halal gratis melalui SIHALAL',
    publisher: 'detikcom',
    date: '20 Oktober 2026',
    url: 'https://www.detik.com/jatim/bisnis/d-8715134/wajib-halal-mundur-ke-2028-ini-cara-daftar-sertifikasi-gratis',
  },
  {
    label: 'The Jakarta Post, 19 Oktober 2026: ringkasan tenggat sertifikasi halal per kategori',
    publisher: 'The Jakarta Post',
    date: '19 Oktober 2026',
    url: 'https://www.thejakartapost.com/business/2026/10/19/government-extends-some-halal-certification-deadlines-to-2028',
  },
];

const DEFAULTS = {
  category: 'makanan_minuman',
  scale: 'mikro',
  import_status: 'dalam-negeri',
  certified: 'belum',
  contains_haram: 'tidak',
  contains_animal: 'ya',
};

const FACILITATION = {
  value: 230000,
  value_label: 'Rp 230.000',
  quota: '1.350.000 sertifikat',
  code: 'SEHATI26',
  year: 2026,
  note: 'Nilai fasilitasi adalah bantuan pemerintah per sertifikat, bukan biaya yang dibayar seller.',
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function parseISO(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  const ms = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const date = new Date(ms);
  if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) return null;
  return date;
}

function todayISO(now) {
  const date = now instanceof Date ? now : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const date = parseISO(iso);
  if (!date) return '';
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(fromISO, toISO) {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function formatDateLong(iso) {
  const date = parseISO(iso);
  if (!date) return '';
  return date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
}

function formatDateShort(iso) {
  const date = parseISO(iso);
  if (!date) return '';
  return date.getUTCDate() + ' ' + MONTHS_SHORT[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
}

function getCategory(id) {
  return CATEGORIES.find((item) => item.id === id) || null;
}

function getScale(id) {
  return SCALES.find((item) => item.id === id) || null;
}

function isYes(value) {
  return value === true || value === 'ya' || value === 'true' || value === 1;
}

function isNo(value) {
  return value === false || value === 'tidak' || value === 'false' || value === 0;
}

function normalizeOrigin(value) {
  return value === 'impor' ? 'impor' : 'dalam-negeri';
}

function normalizeCertified(value) {
  return value === true || value === 'sudah' ? 'sudah' : 'belum';
}

function deadlineFor(categoryId, scaleId, origin) {
  const row = DEADLINES[categoryId];
  if (!row) return null;
  if (origin === 'impor') {
    return { date: row.impor || row.all, kind: row.imporKind || row.kind || 'akhir' };
  }
  if (getScale(scaleId).umk) {
    return { date: row.umk || row.all, kind: row.kind || 'akhir' };
  }
  return { date: row.nonUmk || row.all, kind: row.kind || 'akhir' };
}

function basisFor(categoryId, scaleId, origin) {
  if (categoryId === 'jasa_makanan_minuman') return 'PP 40/2026 Pasal 160 ayat (1a)';
  if (categoryId === 'makanan_minuman' || categoryId === 'hasil_sembelihan' || categoryId === 'jasa_penyembelihan') {
    if (origin === 'impor') return 'PP 40/2026 Pasal 160 ayat (3)';
    if (getScale(scaleId).umk) return 'PP 40/2026 Pasal 160 ayat (2)';
    return 'PP 42/2024 Pasal 160 ayat (1), tidak diubah oleh PP 40/2026';
  }
  return 'PP 42/2024 Pasal 161 sebagaimana diubah oleh PP 40/2026';
}

function validate(input) {
  if (!input || typeof input !== 'object') return 'Data isian tidak terbaca.';
  if (!getCategory(input.category)) return 'Kategori produk tidak dikenal.';
  if (!getScale(input.scale)) return 'Skala usaha tidak dikenal.';
  if (input.import_status !== 'dalam-negeri' && input.import_status !== 'impor') return 'Asal produk harus dalam-negeri atau impor.';
  if (input.certified !== 'belum' && input.certified !== 'sudah' && input.certified !== true && input.certified !== false) {
    return 'Status sertifikasi harus belum atau sudah.';
  }
  const category = getCategory(input.category);
  if (category.animalRelevant && !isYes(input.contains_animal) && !isNo(input.contains_animal)) {
    return 'Jawab apakah barang mengandung unsur hewan.';
  }
  if (!isYes(input.contains_haram) && !isNo(input.contains_haram)) {
    return 'Jawab apakah produk mengandung bahan haram.';
  }
  return '';
}

function buildSelfDeclare(input, category, scale, origin, required, certified) {
  if (certified) {
    return {
      potential: false,
      label: 'Sudah bersertifikat',
      reason: 'Tidak perlu mengajukan sertifikasi baru. Simpan sertifikat dan cantumkan nomornya di listing.',
      value: null,
      value_label: '',
      quota: '',
      code: '',
      caveat: '',
      steps: [],
    };
  }
  if (!required) {
    return {
      potential: false,
      label: 'Tidak perlu jalur sertifikasi',
      reason: 'Produk tidak masuk kewajiban sertifikat halal berdasarkan data yang diisi.',
      value: null,
      value_label: '',
      quota: '',
      code: '',
      caveat: '',
      steps: [],
    };
  }
  if (origin === 'impor') {
    return {
      potential: false,
      label: 'Registrasi sertifikat halal luar negeri',
      reason: 'Produk impor tidak memakai self declare UMK. Sertifikat dari lembaga halal luar negeri perlu didaftarkan sesuai ketentuan.',
      value: null,
      value_label: '',
      quota: '',
      code: '',
      caveat: 'Cek ketentuan registrasi dan kepabeanan terbaru sebelum mengirim barang.',
      steps: [
        'Siapkan sertifikat halal dari lembaga halal luar negeri.',
        'Periksa skema saling pengakuan sertifikat halal yang berlaku.',
        'Daftarkan produk melalui jalur yang ditetapkan BPJPH.',
        'Cocokkan dokumen impor dengan ketentuan kepabeanan.',
      ],
    };
  }
  if (!scale.umk) {
    return {
      potential: false,
      label: 'Jalur reguler melalui LPH',
      reason: 'Self declare SEHATI hanya untuk usaha mikro dan kecil. Usaha menengah dan besar memakai jalur reguler.',
      value: null,
      value_label: '',
      quota: '',
      code: '',
      caveat: 'Biaya dan waktu pemeriksaan ditentukan oleh Lembaga Pemeriksa Halal yang dipilih.',
      steps: [
        'Pilih Lembaga Pemeriksa Halal yang terdaftar.',
        'Siapkan daftar bahan, proses produksi, dan manual SJPH.',
        'Ajukan permohonan sertifikasi halal.',
        'Ikuti audit dan sidang fatwa halal.',
      ],
    };
  }
  if (category.selfDeclare === false) {
    return {
      potential: false,
      label: 'Jalur reguler melalui LPH',
      reason: 'Kategori ini umumnya tidak masuk skema self declare UMK. Gunakan jalur reguler dan konfirmasi ke LPH.',
      value: null,
      value_label: '',
      quota: '',
      code: '',
      caveat: 'Daftar jenis produk self declare diatur dalam Kepkaban 146/2025. Verifikasi sebelum mendaftar.',
      steps: [
        'Pilih Lembaga Pemeriksa Halal yang terdaftar.',
        'Siapkan daftar bahan, proses produksi, dan manual SJPH.',
        'Ajukan permohonan sertifikasi halal.',
        'Ikuti audit dan sidang fatwa halal.',
      ],
    };
  }
  const conditional = category.selfDeclare === 'conditional';
  return {
    potential: true,
    label: conditional ? 'Berpotensi SEHATI dengan syarat' : 'Berpotensi ikut SEHATI',
    reason: conditional
      ? 'Self declare hanya bisa dipakai jika bahan hewan berasal dari produsen atau RPH/RPU bersertifikat halal.'
      : 'UMK dengan produk makanan atau minuman dalam negeri bisa memakai jalur self declare jika seluruh kriteria terpenuhi.',
    value: FACILITATION.value,
    value_label: FACILITATION.value_label,
    quota: FACILITATION.quota,
    code: FACILITATION.code,
    caveat: 'Kuota, kode fasilitasi, dan kriteria dapat berubah. Cek SIHALAL dan konfirmasi ke Pendamping PPH.',
    steps: [
      'Buat akun SIHALAL di ptsp.halal.go.id.',
      'Lengkapi NIB, daftar bahan, proses produksi, dan dokumen UMK.',
      'Pilih Pendamping PPH sesuai domisili.',
      'Ikuti verifikasi lapangan dan lengkapi dokumen.',
      'Tunggu STTD, sidang fatwa, lalu unduh sertifikat.',
    ],
  };
}

function buildDocuments(category, containsAnimal) {
  const docs = [
    { label: 'NIB dan KTP pelaku usaha', note: 'NIB harus sesuai skala usaha yang dipakai.' },
    { label: 'Surat permohonan sertifikat halal', note: 'Ditujukan kepada Kepala BPJPH.' },
    { label: 'Daftar produk dan bahan', note: 'Termasuk bahan baku, bahan tambahan, dan bahan penolong.' },
    { label: 'Bukti kehalalan bahan', note: 'Sertifikat halal bahan atau bukti bahan masuk daftar pengecualian.' },
    { label: 'Uraian proses produksi', note: 'Dari penerimaan bahan sampai pengemasan.' },
    { label: 'Manual SJPH', note: 'Sistem Jaminan Produk Halal yang diterapkan.' },
    { label: 'SK dan data penyelia halal', note: 'Sertifikat pelatihan atau kompetensi jika ada.' },
    { label: 'Foto produk dan kemasan', note: 'Satu foto untuk setiap varian.' },
    { label: 'Surat pernyataan dan akad atau ikrar', note: 'Dipakai pada jalur self declare.' },
    { label: 'Izin edar atau SLHS jika ada', note: 'PIRT, MD, UMOT, UKOT, atau SLHS.' },
    { label: 'Bukti lokasi dan alat produksi', note: 'Menunjukkan pemisahan dari proses non-halal.' },
  ];
  if (category.animalRelevant && containsAnimal) {
    docs.push({ label: 'Bukti asal unsur hewan', note: 'Sertifikat halal pemasok, RPH, atau RPU.' });
  }
  if (category.id === 'hasil_sembelihan') {
    docs.push({ label: 'Sertifikat RPH atau RPU', note: 'Diperlukan jika memakai jalur self declare.' });
  }
  return docs;
}

function buildTimeline(deadline, today, selfDeclare, category) {
  const milestones = [
    {
      days: 540,
      label: '18 bulan sebelum tenggat',
      tasks: [
        'Petakan semua bahan dan pemasok, tandai bahan yang belum punya sertifikat halal.',
        'Tentukan kategori produk dan skala usaha yang benar.',
        'Sisihkan anggaran dan waktu untuk audit atau pendampingan.',
      ],
    },
    {
      days: 360,
      label: '12 bulan sebelum tenggat',
      tasks: [
        'Susun manual SJPH dan tunjuk penyelia halal.',
        'Pisahkan lokasi, alat, dan penyimpanan dari proses non-halal.',
        'Lengkapi izin edar atau SLHS jika diperlukan.',
      ],
    },
    {
      days: 180,
      label: '6 bulan sebelum tenggat',
      tasks: selfDeclare
        ? [
          'Buat akun SIHALAL dan pilih Pendamping PPH.',
          'Lengkapi daftar bahan, proses produksi, dan foto produk.',
          'Ajukan permohonan self declare.',
        ]
        : [
          'Pilih Lembaga Pemeriksa Halal.',
          'Ajukan permohonan dan jadwalkan audit.',
          'Lengkapi dokumen bahan dan proses produksi.',
        ],
    },
    {
      days: 90,
      label: '3 bulan sebelum tenggat',
      tasks: [
        'Ikuti verifikasi lapangan atau audit.',
        'Perbaiki temuan audit dan lengkapi dokumen.',
        'Pastikan semua varian produk sudah tercantum.',
      ],
    },
    {
      days: 30,
      label: '1 bulan sebelum tenggat',
      tasks: [
        'Pastikan STTD sudah terbit.',
        'Pantau jadwal sidang fatwa halal.',
        'Siapkan unggahan nomor sertifikat ke listing marketplace.',
      ],
    },
  ];
  return milestones
    .map((item) => {
      const date = addDays(deadline, -item.days);
      return {
        date,
        date_label: formatDateShort(date),
        days_left: daysBetween(today, date),
        label: item.label,
        tasks: item.tasks,
      };
    })
    .filter((item) => item.days_left >= 0);
}

function statusFor(required, certified, kind, daysLeft) {
  if (!required) return { status: 'tidak-wajib', tone: 'netral' };
  if (certified) return { status: 'bersertifikat', tone: 'aman' };
  if (kind === 'mulai' && daysLeft <= 0) return { status: 'wajib', tone: 'kritis' };
  if (kind !== 'mulai' && daysLeft < 0) return { status: 'lewat', tone: 'kritis' };
  if (daysLeft <= 180) return { status: 'mendesak', tone: 'kritis' };
  if (daysLeft <= 365) return { status: 'segera', tone: 'waspada' };
  return { status: 'ada-waktu', tone: 'netral' };
}

const STATUS_LABELS = {
  'tidak-wajib': 'Tidak wajib sertifikasi halal',
  bersertifikat: 'Sudah bersertifikat halal',
  wajib: 'Kewajiban sudah berlaku',
  lewat: 'Batas penahapan sudah lewat',
  mendesak: 'Tenggat mendesak',
  segera: 'Siapkan dari sekarang',
  'ada-waktu': 'Masih ada waktu',
};

function statusDetail(status, daysLeft, deadlineLabel, kindLabel, requirementReason) {
  if (status === 'tidak-wajib') return requirementReason;
  if (status === 'bersertifikat') {
    return 'Sertifikat halal sudah ada. Simpan nomor sertifikat dan cantumkan di listing marketplace.';
  }
  if (status === 'wajib') {
    return 'Kewajiban mulai berlaku sejak ' + deadlineLabel + ', ' + Math.abs(daysLeft) + ' hari lalu. Kalau belum bersertifikat, prioritaskan jalur reguler sekarang.';
  }
  if (status === 'lewat') {
    return 'Batas akhir penahapan ' + deadlineLabel + ' sudah lewat ' + Math.abs(daysLeft) + ' hari. Kalau belum bersertifikat, segera hubungi LPH atau BPJPH.';
  }
  if (status === 'mendesak') {
    return 'Sisa ' + daysLeft + ' hari menuju ' + deadlineLabel + '. ' + kindLabel + ' sudah dekat.';
  }
  if (status === 'segera') {
    return 'Sisa ' + daysLeft + ' hari menuju ' + deadlineLabel + '. Mulai lengkapi dokumen dan bahan sekarang.';
  }
  return 'Sisa ' + daysLeft + ' hari menuju ' + deadlineLabel + '. Masih ada waktu untuk menyiapkan bahan dan dokumen.';
}

function buildActions(status, selfDeclare, category, origin, certified, containsAnimal) {
  const actions = [];
  if (certified) {
    actions.push('Simpan sertifikat halal dan catat nomor sertifikatnya.');
    actions.push('Cantumkan nomor sertifikat atau label halal pada listing marketplace.');
    actions.push('Pastikan setiap varian baru masuk ke lingkup sertifikat.');
  } else if (status === 'tidak-wajib') {
    actions.push('Simpan bukti komposisi dan asal bahan untuk menjelaskan status produk.');
    actions.push('Kalau produk memakai bahan haram, beri keterangan tidak halal sesuai ketentuan.');
    actions.push('Pantau perubahan aturan dan kebijakan marketplace.');
  } else {
    if (status === 'lewat' || status === 'wajib') {
      actions.push('Prioritaskan sertifikasi sekarang, jangan menunggu tenggat berikutnya.');
      actions.push('Hubungi LPH atau BPJPH untuk memilih jalur yang paling cepat.');
      actions.push('Hentikan penambahan varian baru sampai status sertifikasi jelas.');
    } else {
      actions.push('Petakan bahan dan pemasok yang belum punya sertifikat halal.');
      actions.push('Susun manual SJPH dan tunjuk penyelia halal.');
      actions.push('Pisahkan lokasi, alat, dan penyimpanan dari proses non-halal.');
    }
    if (selfDeclare.potential) {
      actions.push('Cek kuota SEHATI dan buat akun SIHALAL di ptsp.halal.go.id.');
      actions.push('Pilih Pendamping PPH dan ajukan self declare.');
    } else if (origin === 'impor') {
      actions.push('Siapkan registrasi sertifikat halal luar negeri.');
    } else {
      actions.push('Pilih Lembaga Pemeriksa Halal dan ajukan jalur reguler.');
    }
    if (category.animalRelevant && containsAnimal) {
      actions.push('Kumpulkan bukti asal unsur hewan dari pemasok, RPH, atau RPU.');
    }
    actions.push('Cantumkan nomor sertifikat ke listing setelah sertifikat terbit.');
  }
  return actions;
}

function buildWarnings(selfDeclare, origin) {
  const warnings = [
    'PP 40/2026 baru berlaku 14 Oktober 2026. Pemerintah masih membahas formula baru, jadi cek SIHALAL sebelum mengambil keputusan final.',
    'Jadwal ini mengatur penahapan kewajiban, bukan jaminan bahwa marketplace akan menunggu sampai tenggat.',
  ];
  if (selfDeclare.potential) {
    warnings.push('Nilai fasilitasi Rp 230.000 adalah bantuan pemerintah, bukan biaya yang dibayar seller. Kuota dan kode SEHATI26 berlaku untuk tahun anggaran 2026.');
  }
  if (origin === 'impor') {
    warnings.push('Produk impor tetap mengikuti ketentuan registrasi sertifikat halal luar negeri dan kepabeanan.');
  }
  return warnings;
}

function analyze(input, now) {
  const error = validate(input);
  if (error) return { error };

  const today = todayISO(now);
  const category = getCategory(input.category);
  const scale = getScale(input.scale);
  const origin = normalizeOrigin(input.import_status);
  const certified = normalizeCertified(input.certified) === 'sudah';
  const containsHaram = isYes(input.contains_haram);
  const containsAnimal = !isNo(input.contains_animal);
  const deadline = deadlineFor(category.id, scale.id, origin);
  const daysLeft = daysBetween(today, deadline.date);
  const kindLabel = deadline.kind === 'mulai' ? 'Tanggal mulai wajib' : 'Batas akhir masa penahapan';
  const legalBasis = basisFor(category.id, scale.id, origin);

  let required = true;
  let requirementReason = '';
  if (containsHaram) {
    required = false;
    requirementReason = 'Produk yang berasal dari bahan haram tidak wajib bersertifikat halal, tetapi wajib diberi keterangan tidak halal.';
  } else if (category.animalRelevant && !containsAnimal) {
    required = false;
    requirementReason = 'Barang gunaan hanya wajib bersertifikat halal jika berasal dari atau mengandung unsur hewan.';
  }

  const statusInfo = statusFor(required, certified, deadline.kind, daysLeft);
  const statusDetailText = statusDetail(statusInfo.status, daysLeft, formatDateLong(deadline.date), kindLabel, requirementReason);
  const selfDeclare = buildSelfDeclare(input, category, scale, origin, required, certified);
  const timeline = required && !certified ? buildTimeline(deadline.date, today, selfDeclare.potential, category) : [];
  const documents = required && !certified ? buildDocuments(category, containsAnimal) : [];
  const actions = buildActions(statusInfo.status, selfDeclare, category, origin, certified, containsAnimal);
  const warnings = buildWarnings(selfDeclare, origin);

  if (certified && containsHaram) {
    warnings.push('Data bertentangan: produk dengan bahan haram tidak dapat disertifikasi halal. Periksa kembali daftar bahan.');
  }

  return {
    input: {
      category: category.id,
      scale: scale.id,
      import_status: origin,
      certified: certified ? 'sudah' : 'belum',
      contains_haram: containsHaram ? 'ya' : 'tidak',
      contains_animal: containsAnimal ? 'ya' : 'tidak',
    },
    category: {
      id: category.id,
      label: category.label,
      group: category.group,
      note: category.note,
    },
    scale: { id: scale.id, label: scale.label, umk: scale.umk },
    origin,
    certified,
    required,
    requirement_reason: requirementReason,
    status: statusInfo.status,
    status_label: STATUS_LABELS[statusInfo.status],
    status_detail: statusDetailText,
    tone: statusInfo.tone,
    deadline: deadline.date,
    deadline_label: formatDateLong(deadline.date),
    deadline_short: formatDateShort(deadline.date),
    deadline_kind: deadline.kind,
    deadline_kind_label: kindLabel,
    days_left: daysLeft,
    days_left_label: daysLeft >= 0 ? daysLeft + ' hari lagi' : Math.abs(daysLeft) + ' hari lewat',
    legal_basis: legalBasis,
    self_declare: selfDeclare,
    timeline,
    documents,
    actions,
    warnings,
    sources: SOURCES,
  };
}

function readiness(input) {
  if (!input || typeof input !== 'object' || !input.items || typeof input.items !== 'object' || Array.isArray(input.items)) {
    return { error: 'Kirim objek items berisi kriteria kesiapan.' };
  }
  const gaps = READINESS_ITEMS.filter((item) => !isYes(input.items[item.id]));
  const done = READINESS_ITEMS.length - gaps.length;
  const score = Math.round((done / READINESS_ITEMS.length) * 100);
  let status = 'belum';
  let label = 'Belum siap';
  if (score === 100) {
    status = 'siap';
    label = 'Siap mengajukan';
  } else if (score >= 75) {
    status = 'hampir';
    label = 'Hampir siap';
  } else if (score >= 40) {
    status = 'perlu';
    label = 'Perlu dilengkapi';
  }
  const nextSteps = gaps.slice(0, 3).map((item) => 'Lengkapi: ' + item.label);
  if (nextSteps.length === 0) {
    nextSteps.push('Ajukan melalui SIHALAL dan pilih Pendamping PPH.');
    nextSteps.push('Siapkan diri untuk verifikasi lapangan.');
  }
  return {
    score,
    done,
    total: READINESS_ITEMS.length,
    status,
    status_label: label,
    gaps,
    next_steps: nextSteps,
    note: 'Skor ini hanya untuk kesiapan dokumen dan proses, bukan penilaian resmi BPJPH.',
  };
}

function buildExample() {
  return Object.assign({}, DEFAULTS);
}

module.exports = {
  analyze,
  readiness,
  buildExample,
  validate,
  deadlineFor,
  basisFor,
  statusFor,
  formatDateLong,
  formatDateShort,
  addDays,
  daysBetween,
  todayISO,
  CATEGORIES,
  SCALES,
  ORIGINS,
  CERTIFICATION_STATUS,
  RULES,
  READINESS_ITEMS,
  SOURCES,
  DEFAULTS,
  FACILITATION,
  STATUS_LABELS,
};
