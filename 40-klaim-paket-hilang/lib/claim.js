// Shipping loss and damage claim logic for Indonesian marketplace sellers.
// All money figures come from seller input. No compensation rate is invented.

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PLATFORMS = [
  {
    id: 'shopee',
    name: 'Shopee',
    claim_channel: 'Pusat Resolusi Shopee',
    note: 'Simpan nomor laporan dan nomor pesanan. Beberapa kasus menyebut kompensasi tanpa asuransi dibatasi.',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    claim_channel: 'Pusat Bantuan Tokopedia',
    note: 'Untuk pesanan lewat TikTok Shop by Tokopedia, nomor tiket bisa berbeda antara marketplace dan ekspedisi.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    claim_channel: 'TikTok Seller Center',
    note: 'Untuk pesanan yang diproses lewat Tokopedia, cek nomor tiket di kedua kanal.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    claim_channel: 'Pusat Bantuan Lazada',
    note: 'Catat nomor tiket dan minta keputusan tertulis, bukan hanya jawaban chat.',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    claim_channel: 'BlibliCare',
    note: 'Simpan semua komunikasi tertulis dengan Blibli dan ekspedisi.',
  },
  {
    id: 'lainnya',
    name: 'Marketplace lain',
    claim_channel: 'Seller Center',
    note: 'Sesuaikan jalur klaim dengan panduan marketplace yang dipakai.',
  },
];

const COURIERS = [
  { id: 'spx', name: 'SPX Express' },
  { id: 'jnt', name: 'J&T Express' },
  { id: 'jntcargo', name: 'J&T Cargo' },
  { id: 'jne', name: 'JNE' },
  { id: 'sicepat', name: 'SiCepat' },
  { id: 'anteraja', name: 'AnterAja' },
  { id: 'grabexpress', name: 'GrabExpress' },
  { id: 'gosend', name: 'GoSend' },
  { id: 'blitz', name: 'Blitz' },
  { id: 'idexpress', name: 'ID Express' },
  { id: 'lainnya', name: 'Ekspedisi lain' },
];

const INCIDENT_TYPES = [
  {
    id: 'hilang',
    label: 'Paket hilang di perjalanan',
    note: 'Resi berhenti bergerak atau ekspedisi menyatakan paket hilang.',
  },
  {
    id: 'rusak',
    label: 'Paket rusak saat diterima pembeli',
    note: 'Kemasan atau barang rusak ketika diterima pembeli.',
  },
  {
    id: 'isi_kosong',
    label: 'Isi paket kosong atau tertukar',
    note: 'Paket tiba tanpa barang atau berisi barang yang bukan pesanan.',
  },
  {
    id: 'nyangkut',
    label: 'Resi tidak bergerak (diduga nyangkut)',
    note: 'Paket belum dinyatakan hilang, tetapi tidak ada pembaruan resi.',
  },
  {
    id: 'retur_rusak',
    label: 'Barang rusak pada retur',
    note: 'Paket retur diterima dalam kondisi rusak atau tidak lengkap.',
  },
];

const STATUSES = [
  { id: 'baru', label: 'Baru dicatat', next: 'Laporkan ke marketplace dan catat nomor tiket.' },
  { id: 'lapor', label: 'Sudah dilaporkan', next: 'Minta nomor tiket dan perkiraan waktu investigasi.' },
  { id: 'ditanggapi', label: 'Ditanggapi', next: 'Lengkapi bukti yang diminta dan simpan jawaban tertulis.' },
  { id: 'investigasi', label: 'Investigasi', next: 'Catat tanggal follow-up dan minta batas waktu penyelesaian.' },
  { id: 'disetujui', label: 'Disetujui', next: 'Pastikan nominal dan tanggal pembayaran kompensasi.' },
  { id: 'ditolak', label: 'Ditolak', next: 'Minta alasan tertulis lalu ajukan eskalasi dengan surat.' },
  { id: 'selesai', label: 'Selesai', next: 'Simpan bukti pembayaran kompensasi dan tutup kasus.' },
];

const EVIDENCE = [
  {
    id: 'packing_video',
    label: 'Video packing tanpa jeda: barang masuk kardus, segel, dan label resi',
    critical: true,
    note: 'Rekam satu take. Pada kasus TikTok Shop 6 Oktober 2026, penjual menyebut video pengemasan diminta dalam 24 jam. Cocokkan dengan Seller Center.',
  },
  {
    id: 'handover',
    label: 'Bukti serah terima ke kurir: scan, struk, atau foto pickup',
    critical: true,
    note: 'Foto paket di atas motor bukan bukti serah terima kepada penerima.',
  },
  {
    id: 'tracking',
    label: 'Screenshot tracking lengkap dari pickup sampai status terakhir',
    critical: true,
    note: 'Sertakan tanggal dan jam setiap perubahan status.',
  },
  {
    id: 'first_ticket',
    label: 'Nomor tiket atau nomor laporan pertama ke marketplace',
    critical: true,
    note: 'Satu nomor tiket untuk satu kasus. Catat nomor baru bila laporan dibuka ulang.',
  },
  {
    id: 'invoice',
    label: 'Invoice atau nota pembelian barang (HPP)',
    critical: true,
    note: 'Dipakai untuk membuktikan nilai barang, bukan hanya harga jual.',
  },
  {
    id: 'packing_photo',
    label: 'Foto barang dan kemasan sebelum dikirim',
    critical: false,
    note: 'Ambil dari beberapa sisi, termasuk segel dan label.',
  },
  {
    id: 'weight_photo',
    label: 'Foto paket di timbangan beserta label resi',
    critical: false,
    note: 'Penting untuk kasus isi kosong atau tertukar.',
  },
  {
    id: 'order_detail',
    label: 'Screenshot detail pesanan dan nilai transaksi',
    critical: false,
    note: 'Pastikan nomor pesanan, nama pembeli, dan nominal terlihat.',
  },
  {
    id: 'buyer_chat',
    label: 'Screenshot chat dengan pembeli',
    critical: false,
    note: 'Simpan percakapan sebelum dan sesudah masalah muncul.',
  },
  {
    id: 'cctv',
    label: 'Rekaman CCTV packing dan serah terima',
    critical: false,
    note: 'Diminta pada kasus laptop Rp14,6 juta. Utamakan untuk barang bernilai tinggi.',
  },
  {
    id: 'chronology',
    label: 'Kronologi tertulis dengan tanggal dan jam',
    critical: false,
    note: 'Tulis fakta saja, tanpa tuduhan.',
  },
  {
    id: 'courier_reply',
    label: 'Bukti komunikasi dengan ekspedisi',
    critical: false,
    note: 'Simpan email, chat, atau nomor tiket dari kurir.',
  },
  {
    id: 'return_unboxing',
    label: 'Video unboxing paket retur',
    critical: false,
    note: 'Wajib untuk kasus retur rusak. Rekam paket sebelum dibuka.',
  },
];

const SOURCES = [
  {
    id: 'mk-shopee-135k',
    label: 'Media Konsumen: paket hilang atau rusak, Shopee hanya ganti Rp135 ribu',
    publisher: 'Media Konsumen',
    date: '23 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/23/surat-pembaca/kecewa-paket-hilang-rusak-shopee-kekeuh-hanya-ganti-rp135-ribu-dan-lepas-tangan',
    facts: [
      'Barang senilai Rp1.190.000 dinyatakan hilang atau rusak oleh SPX Express.',
      'Shopee menawarkan Rp135.000 karena paket tidak didaftarkan asuransi pengiriman.',
      'Penjual menyebut kompensasi standar 10 kali ongkir dan meminta peninjauan manual.',
    ],
  },
  {
    id: 'mk-ipad-blitz',
    label: 'Media Konsumen: iPad Rp7 juta hilang, kompensasi belum cair setelah tiga bulan',
    publisher: 'Media Konsumen',
    date: '22 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/22/surat-pembaca/ipad-rp7-juta-hilang-saat-pengiriman-blitz-tiga-bulan-follow-up-ke-tokopedia-tiktok-shop-dan-blitz-kompensasi-tak-kunjung-cair',
    facts: [
      'Transaksi Rp7.013.470 melalui Blitz dinyatakan hilang oleh ekspedisi.',
      'Penjual melakukan follow-up pada 9 September dan 13 Oktober 2026.',
      'Kompensasi menunggu tagihan dari marketplace dan belum ada kejelasan.',
    ],
  },
  {
    id: 'mk-grab-2juta',
    label: 'Media Konsumen: uang Rp2.395.080 tertahan dua bulan akibat paket hilang',
    publisher: 'Media Konsumen',
    date: '24 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/24/surat-pembaca/2-bulan-uang-rp2-395-080-tertahan-di-shopee-akibat-paket-hilang-dalam-pengiriman-grabexpress',
    facts: [
      'Pembeli tidak menerima paket Samsung A07 melalui GrabExpress.',
      'Shopee sempat menolak klaim karena driver dianggap sudah mengirim.',
      'Bukti yang ada hanya foto paket di atas motor, bukan serah terima.',
    ],
  },
  {
    id: 'mk-laptop-jnt',
    label: 'Media Konsumen: laptop Rp14,6 juta hilang, laporan ditutup tanpa solusi jelas',
    publisher: 'Media Konsumen',
    date: '1 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/01/surat-pembaca/laptop-rp146-juta-hilang-di-jt-cargo-shopee-tutup-laporan-tanpa-solusi-jelas',
    facts: [
      'Paket retur laptop melalui J&T Cargo diterima kosong.',
      'Shopee meminta CCTV packing dan penyerahan barang kepada kurir.',
      'Laporan ditutup dengan alasan sudah ada solusi tanpa rincian.',
    ],
  },
  {
    id: 'mk-spx-mandek',
    label: 'Media Konsumen: paket Rp1,3 juta mandek tanpa update resi',
    publisher: 'Media Konsumen',
    date: '4 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/04/surat-pembaca/paket-spx-hemat-senilai-rp13-juta-mandek-di-perjalanan-tanpa-update-resi-di-shopee',
    facts: [
      'Resi SPX Hemat tidak bergerak lebih dari 10 hari.',
      'Penjual sudah menghubungi CS dan membuat laporan keterlambatan.',
      'Belum ada progres atau kepastian status paket.',
    ],
  },
  {
    id: 'mk-retur-pecah',
    label: 'Media Konsumen: barang pecah saat retur, penjual disalahkan',
    publisher: 'Media Konsumen',
    date: '8 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/08/surat-pembaca/barang-pecah-ketika-pembeli-retur-shopee-menyalahkan-penjual',
    facts: [
      'Paket retur jam diterima penjual dalam kondisi kaca pecah.',
      'Pembeli mengajukan retur tanpa video unboxing.',
      'Empat laporan lanjutan penjual tidak menghasilkan penyelesaian.',
    ],
  },
  {
    id: 'mk-tst-retur',
    label: 'Media Konsumen: retur rusak dan permintaan video pengemasan 24 jam',
    publisher: 'Media Konsumen',
    date: '6 Oktober 2026',
    url: 'https://mediakonsumen.com/2026/10/06/surat-pembaca/tiktok-shop-tokopedia-membebankan-biaya-kepada-penjual-padahal-pembeli-yang-mau-retur-barang-retur-yang-rusak-tidak-diganti-ii',
    facts: [
      'Dua kasus retur merugikan penjual dalam dua bulan.',
      'Banding ditolak dengan alasan video pengemasan tidak dikirim dalam 24 jam.',
      'Penjual tetap dibebankan biaya retur sekitar Rp200 ribu.',
    ],
  },
];

const DEFAULTS = {
  platform: 'shopee',
  courier: 'spx',
  incident_type: 'hilang',
  selling_price: 1190000,
  refund_to_buyer: 1190000,
  product_cost: 900000,
  shipping_cost: 20000,
  packaging_cost: 3000,
  insurance: 'tidak',
  insurance_cost: 0,
  compensation_received: 135000,
  recovered_goods_value: 0,
  normal_margin_pct: 15,
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;
  const cleaned = String(value).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.max(0, Math.round(toNumber(value)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toISODate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return '';
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return '';
  return d.toISOString().slice(0, 10);
}

function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  return map.year + '-' + map.month + '-' + map.day;
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const from = new Date(fromIso + 'T00:00:00Z').getTime();
  const to = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((to - from) / 86400000);
}

function formatDateOnly(iso) {
  const parts = String(iso).split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
  return parts[2] + ' ' + ID_MONTHS[parts[1] - 1] + ' ' + parts[0];
}

function formatTodayID(now = new Date()) {
  return formatDateOnly(todayISO(now));
}

function formatRupiah(value) {
  return 'Rp ' + Math.round(toNumber(value)).toLocaleString('id-ID');
}

function cleanLine(value, max) {
  const text = String(value === null || value === undefined ? '' : value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, max || 160);
}

function cleanBlock(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, 4000);
}

function getPlatform(id) {
  return PLATFORMS.find((item) => item.id === id) || PLATFORMS[0];
}

function getCourier(id) {
  return COURIERS.find((item) => item.id === id) || COURIERS[COURIERS.length - 1];
}

function getIncidentType(id) {
  return INCIDENT_TYPES.find((item) => item.id === id) || INCIDENT_TYPES[0];
}

function getStatus(id) {
  return STATUSES.find((item) => item.id === id) || STATUSES[0];
}

function getEvidence(id) {
  return EVIDENCE.find((item) => item.id === id) || null;
}

function normalizeInsurance(value) {
  return value === 'ya' ? 'ya' : 'tidak';
}

function lossInput(input) {
  const data = input || {};
  const sellingPrice = money(data.selling_price);
  const refund = clamp(money(data.refund_to_buyer), 0, sellingPrice);
  const productCost = money(data.product_cost);
  const shippingCost = money(data.shipping_cost);
  const packagingCost = money(data.packaging_cost);
  const insuranceCost = money(data.insurance_cost);
  const compensation = money(data.compensation_received);
  const recovered = money(data.recovered_goods_value);
  const marginPct = clamp(Math.round(toNumber(data.normal_margin_pct)), 0, 100);
  return {
    sellingPrice: sellingPrice,
    refund: refund,
    productCost: productCost,
    shippingCost: shippingCost,
    packagingCost: packagingCost,
    insuranceCost: insuranceCost,
    compensation: compensation,
    recovered: recovered,
    marginPct: marginPct,
    insurance: normalizeInsurance(data.insurance),
  };
}

function computeLoss(input) {
  const v = lossInput(input);
  const totalCost = v.productCost + v.shippingCost + v.packagingCost + v.insuranceCost;
  const revenueKept = Math.max(0, v.sellingPrice - v.refund);
  const net = revenueKept + v.compensation + v.recovered - totalCost;
  const netLoss = Math.max(0, -net);
  const normalProfit = Math.round(v.sellingPrice * v.marginPct / 100);
  const salesToCover = normalProfit > 0 ? Math.ceil(netLoss / normalProfit) : null;
  const compensationGap = Math.max(0, totalCost - v.compensation - v.recovered);
  const tenTimesShipping = v.shippingCost * 10;

  let severity = 'tertutup';
  if (net < 0 && normalProfit > 0) {
    if (netLoss <= normalProfit) severity = 'ringan';
    else if (netLoss <= normalProfit * 5) severity = 'signifikan';
    else severity = 'kritis';
  } else if (net < 0) {
    severity = 'kritis';
  }

  return {
    selling_price: v.sellingPrice,
    refund_to_buyer: v.refund,
    product_cost: v.productCost,
    shipping_cost: v.shippingCost,
    packaging_cost: v.packagingCost,
    insurance: v.insurance,
    insurance_cost: v.insuranceCost,
    compensation_received: v.compensation,
    recovered_goods_value: v.recovered,
    normal_margin_pct: v.marginPct,
    revenue_kept: revenueKept,
    total_cost: totalCost,
    net_result: net,
    net_loss: netLoss,
    normal_profit: normalProfit,
    sales_to_cover: salesToCover,
    compensation_gap: compensationGap,
    ten_times_shipping: tenTimesShipping,
    severity: severity,
  };
}

function severityLabel(severity) {
  const map = {
    tertutup: 'Tertutup',
    ringan: 'Ringan',
    signifikan: 'Signifikan',
    kritis: 'Kritis',
  };
  return map[severity] || 'Belum dihitung';
}

function analyze(input, now = new Date()) {
  const data = input || {};
  const loss = computeLoss(data);
  if (loss.selling_price <= 0) {
    return { error: 'Isi nilai transaksi lebih dari 0' };
  }
  const platform = getPlatform(data.platform);
  const courier = getCourier(data.courier);
  const type = getIncidentType(data.incident_type);
  const today = todayISO(now);
  const incidentDate = toISODate(data.incident_date);
  const reportDate = toISODate(data.report_date);
  const lastFollowUp = toISODate(data.last_follow_up);

  if (String(data.incident_date || '').trim() && !incidentDate) {
    return { error: 'Tanggal kejadian tidak valid' };
  }
  if (String(data.report_date || '').trim() && !reportDate) {
    return { error: 'Tanggal laporan tidak valid' };
  }
  if (String(data.last_follow_up || '').trim() && !lastFollowUp) {
    return { error: 'Tanggal follow-up tidak valid' };
  }
  if (incidentDate && incidentDate > today) {
    return { error: 'Tanggal kejadian tidak boleh melewati hari ini' };
  }
  if (incidentDate && reportDate && reportDate < incidentDate) {
    return { error: 'Tanggal laporan tidak boleh sebelum tanggal kejadian' };
  }

  const incidentAge = incidentDate ? daysBetween(incidentDate, today) : null;
  const reportAge = reportDate ? daysBetween(reportDate, today) : null;
  const followUpAge = lastFollowUp ? daysBetween(lastFollowUp, today) : null;

  const recommendations = [];
  if (!reportDate) {
    recommendations.push('Laporkan ke ' + platform.claim_channel + ' dan catat nomor tiket pada hari yang sama.');
  }
  if (loss.net_loss > 0) {
    recommendations.push('Kerugian bersih ' + formatRupiah(loss.net_loss) + ' setara ' + (loss.sales_to_cover === null ? 'tidak dapat dihitung' : loss.sales_to_cover + ' penjualan normal') + '. Siapkan bukti nilai barang, bukan hanya ongkir.');
  }
  if (loss.compensation_gap > 0) {
    recommendations.push('Biaya yang belum tertutup kompensasi: ' + formatRupiah(loss.compensation_gap) + '. Minta peninjauan manual berdasarkan nilai barang dan bukti pengiriman.');
  }
  if (loss.insurance === 'tidak') {
    recommendations.push('Paket tidak diasuransikan. Pada kasus 23 Oktober 2026, kompensasi tanpa asuransi hanya Rp135.000. Cocokkan syarat layanan sebelum menerima tawaran.');
  }
  if (loss.ten_times_shipping > 0 && loss.ten_times_shipping < loss.total_cost) {
    recommendations.push('Patokan 10 kali ongkir hanya ' + formatRupiah(loss.ten_times_shipping) + ', lebih kecil dari biaya barang dan pengiriman ' + formatRupiah(loss.total_cost) + '.');
  }
  if (type.id === 'nyangkut') {
    recommendations.push('Minta ekspedisi menyatakan status paket secara tertulis: masih dalam perjalanan, hilang, atau dikembalikan. Jangan menunggu tanpa batas.');
  }
  if (type.id === 'retur_rusak') {
    recommendations.push('Rekam video unboxing paket retur sebelum dibuka dan bandingkan kondisi barang dengan bukti packing awal.');
  }
  if (type.id === 'isi_kosong' || type.id === 'rusak') {
    recommendations.push('Sertakan foto berat paket dan video unboxing dari pembeli bila tersedia. Untuk isi kosong, minta pemeriksaan ulang berat di gudang ekspedisi.');
  }
  if (loss.product_cost >= 5000000) {
    recommendations.push('Nilai barang di atas Rp5 juta. Lampirkan CCTV packing dan serah terima, bukan hanya foto.');
  }
  if (reportAge !== null && reportAge > 30) {
    recommendations.push('Laporan sudah ' + reportAge + ' hari. Naikkan eskalasi dengan surat tertulis dan minta batas waktu penyelesaian.');
  }
  if (followUpAge !== null && followUpAge >= 7) {
    recommendations.push('Follow-up terakhir ' + followUpAge + ' hari lalu. Kirim follow-up tertulis dan simpan bukti pengirimannya.');
  }

  const activeStatus = data.status ? getStatus(data.status) : STATUSES[0];
  return {
    platform: platform.id,
    platform_name: platform.name,
    claim_channel: platform.claim_channel,
    courier: courier.id,
    courier_name: courier.name,
    incident_type: type.id,
    incident_type_label: type.label,
    incident_note: type.note,
    incident_date: incidentDate,
    incident_age_days: incidentAge,
    report_date: reportDate,
    report_age_days: reportAge,
    last_follow_up: lastFollowUp,
    follow_up_age_days: followUpAge,
    status: activeStatus.id,
    status_label: activeStatus.label,
    loss: loss,
    severity_label: severityLabel(loss.severity),
    compensation_reference: {
      ten_times_shipping: loss.ten_times_shipping,
      note: 'Patokan 10 kali ongkir berasal dari penjual pada kasus 23 Oktober 2026, bukan tarif resmi marketplace atau ekspedisi.',
      source_id: 'mk-shopee-135k',
    },
    recommendations: recommendations,
    evidence: EVIDENCE.map((item) => Object.assign({}, item)),
    sources: SOURCES.slice(),
  };
}

function readiness(input) {
  const data = input || {};
  const raw = Array.isArray(data.items) ? data.items : [];
  const checked = new Set(raw.map((item) => String(item)));
  const rows = EVIDENCE.map((item) => Object.assign({}, item, { checked: checked.has(item.id) }));

  let earned = 0;
  let total = 0;
  rows.forEach((item) => {
    const weight = item.critical ? 2 : 1;
    total += weight;
    if (item.checked) earned += weight;
  });

  const score = total > 0 ? Math.round(earned / total * 100) : 0;
  const missingCritical = rows.filter((item) => item.critical && !item.checked).map((item) => item.label);
  let verdict = 'belum';
  let verdictLabel = 'Belum siap';
  if (score >= 85 && missingCritical.length === 0) {
    verdict = 'siap';
    verdictLabel = 'Siap diajukan';
  } else if (score >= 55) {
    verdict = 'hampir';
    verdictLabel = 'Hampir siap';
  }

  return {
    score: score,
    verdict: verdict,
    verdict_label: verdictLabel,
    checked_count: rows.filter((item) => item.checked).length,
    total_count: rows.length,
    missing_critical: missingCritical,
    rows: rows,
  };
}

function normalizeCase(raw) {
  const data = raw || {};
  const platform = getPlatform(data.platform);
  const courier = getCourier(data.courier);
  const type = getIncidentType(data.incident_type);
  const status = getStatus(data.status);
  const loss = computeLoss(Object.assign({}, data, {
    compensation_received: data.received_amount,
  }));

  return {
    platform: platform.id,
    courier: courier.id,
    incident_type: type.id,
    incident_type_label: type.label,
    ref: cleanLine(data.ref, 100),
    tracking_ref: cleanLine(data.tracking_ref, 100),
    incident_date: toISODate(data.incident_date),
    report_date: toISODate(data.report_date),
    status: status.id,
    status_label: status.label,
    claimed_amount: money(data.claimed_amount),
    received_amount: money(data.received_amount),
    last_follow_up: toISODate(data.last_follow_up),
    note: cleanLine(data.note, 400),
    selling_price: loss.selling_price,
    refund_to_buyer: loss.refund_to_buyer,
    product_cost: loss.product_cost,
    shipping_cost: loss.shipping_cost,
    packaging_cost: loss.packaging_cost,
    insurance: loss.insurance,
    insurance_cost: loss.insurance_cost,
    recovered_goods_value: loss.recovered_goods_value,
    normal_margin_pct: loss.normal_margin_pct,
  };
}

function validateCase(raw) {
  const item = normalizeCase(raw);
  const data = raw || {};
  if (!item.ref) return { error: 'Isi nomor pesanan atau nomor kasus' };
  if (!item.incident_date) {
    return { error: String(data.incident_date || '').trim() ? 'Tanggal kejadian tidak valid' : 'Tanggal kejadian wajib diisi' };
  }
  if (String(data.report_date || '').trim() && !item.report_date) {
    return { error: 'Tanggal laporan tidak valid' };
  }
  if (String(data.last_follow_up || '').trim() && !item.last_follow_up) {
    return { error: 'Tanggal follow-up tidak valid' };
  }
  if (item.selling_price <= 0) return { error: 'Nilai transaksi harus lebih dari 0' };
  if (item.report_date && item.report_date < item.incident_date) {
    return { error: 'Tanggal laporan tidak boleh sebelum tanggal kejadian' };
  }
  if (item.status === 'selesai' && item.received_amount <= 0) {
    return { error: 'Kasus selesai harus mencantumkan kompensasi yang diterima' };
  }
  return { item: item };
}

function agingFor(reportAge) {
  if (reportAge === null) return { id: 'belum-lapor', label: 'Belum dilaporkan' };
  if (reportAge <= 7) return { id: 'baru', label: 'Baru' };
  if (reportAge <= 30) return { id: 'tindak-lanjut', label: 'Perlu ditindaklanjuti' };
  if (reportAge <= 60) return { id: 'mendesak', label: 'Mendesak' };
  return { id: 'kritis', label: 'Kritis' };
}

function caseView(raw, now = new Date()) {
  const item = normalizeCase(raw);
  const today = todayISO(now);
  const loss = computeLoss(Object.assign({}, item, {
    compensation_received: item.received_amount,
  }));
  const incidentAge = item.incident_date ? daysBetween(item.incident_date, today) : null;
  const reportAge = item.report_date ? daysBetween(item.report_date, today) : null;
  const followUpAge = item.last_follow_up ? daysBetween(item.last_follow_up, today) : null;
  const aging = agingFor(reportAge);
  const status = getStatus(item.status);
  const isOpen = item.status !== 'selesai';
  const flags = [];

  if (!item.report_date) {
    flags.push('Belum ada tanggal laporan. Catat nomor tiket dan tanggal lapor.');
  }
  if (isOpen && reportAge !== null && reportAge > 30) {
    flags.push('Laporan sudah ' + reportAge + ' hari dan belum selesai.');
  }
  if (item.status === 'ditolak') {
    flags.push('Klaim ditolak. Minta alasan tertulis lalu ajukan eskalasi.');
  }
  if (item.status === 'disetujui' && item.received_amount < item.claimed_amount) {
    flags.push('Disetujui, tetapi kompensasi diterima belum sesuai klaim.');
  }
  if (item.insurance === 'tidak' && loss.net_loss > 0) {
    flags.push('Tanpa asuransi pengiriman, kompensasi biasanya tidak menutup nilai barang.');
  }
  if (isOpen && followUpAge !== null && followUpAge >= 7) {
    flags.push('Belum ada follow-up sejak ' + followUpAge + ' hari lalu.');
  }

  return {
    id: raw.id || '',
    platform: item.platform,
    courier: item.courier,
    incident_type: item.incident_type,
    incident_type_label: item.incident_type_label,
    ref: item.ref,
    tracking_ref: item.tracking_ref,
    incident_date: item.incident_date,
    report_date: item.report_date,
    status: item.status,
    status_label: item.status_label,
    claimed_amount: item.claimed_amount,
    received_amount: item.received_amount,
    last_follow_up: item.last_follow_up,
    note: item.note,
    insurance: item.insurance,
    incident_age_days: incidentAge,
    report_age_days: reportAge,
    follow_up_age_days: followUpAge,
    aging: aging.id,
    aging_label: aging.label,
    next_action: status.next,
    flags: flags,
    loss: loss,
  };
}

function summary(cases, now = new Date()) {
  const list = Array.isArray(cases) ? cases : [];
  const views = list.map((item) => caseView(item, now));
  const open = views.filter((item) => item.status !== 'selesai');
  const totalNetLoss = views.reduce((sum, item) => sum + item.loss.net_loss, 0);
  const totalClaimed = views.reduce((sum, item) => sum + item.claimed_amount, 0);
  const totalReceived = views.reduce((sum, item) => sum + item.received_amount, 0);
  const totalUncovered = views.reduce((sum, item) => sum + item.loss.compensation_gap, 0);
  const oldestOpen = open.reduce((max, item) => {
    const age = item.report_age_days === null ? item.incident_age_days : item.report_age_days;
    if (age === null) return max;
    return Math.max(max, age);
  }, 0);

  return {
    total_cases: views.length,
    open_cases: open.length,
    total_net_loss: totalNetLoss,
    total_claimed: totalClaimed,
    total_received: totalReceived,
    total_uncovered: totalUncovered,
    oldest_open_days: oldestOpen,
    cases: views,
  };
}

function buildLetter(input, now = new Date()) {
  const data = input || {};
  const platform = getPlatform(data.platform);
  const courier = getCourier(data.courier);
  const type = getIncidentType(data.incident_type);
  const sellerName = cleanLine(data.seller_name, 120) || '[Nama penjual]';
  const storeName = cleanLine(data.store_name, 120) || '[Nama toko]';
  const storeId = cleanLine(data.store_id, 80);
  const contact = cleanLine(data.contact, 120);
  const ref = cleanLine(data.ref, 100);
  const trackingRef = cleanLine(data.tracking_ref, 100);
  const itemName = cleanLine(data.item_name, 140) || 'barang pesanan';
  const incidentDate = toISODate(data.incident_date);
  const reportDate = toISODate(data.report_date);
  const chronology = cleanBlock(data.chronology);
  const loss = computeLoss(data);
  const requested = money(data.claimed_amount) || loss.compensation_gap || loss.net_loss;
  const today = formatTodayID(now);

  const subject = 'Klaim ganti rugi atas ' + type.label.toLowerCase() + (ref ? ' pesanan ' + ref : '');
  const idLine = storeId ? ' (ID toko: ' + storeId + ')' : '';
  const lines = [];

  lines.push('Kepada Tim Seller Support ' + platform.name + ',', '');
  lines.push('Perihal: ' + subject, '');
  lines.push('Saya, ' + sellerName + ', pemilik toko ' + storeName + idLine + ' di ' + platform.name + ', mengajukan klaim atas paket yang bermasalah dalam pengiriman.', '');

  lines.push('Data pesanan:', '');
  if (ref) lines.push('Nomor pesanan: ' + ref);
  if (trackingRef) lines.push('Nomor resi atau AWB: ' + trackingRef);
  lines.push('Ekspedisi: ' + courier.name);
  lines.push('Barang: ' + itemName);
  if (incidentDate) lines.push('Tanggal kejadian: ' + formatDateOnly(incidentDate));
  if (reportDate) lines.push('Tanggal laporan: ' + formatDateOnly(reportDate));
  lines.push('');

  if (chronology) {
    lines.push('Kronologi:', chronology, '');
  }

  lines.push('Rincian kerugian:', '');
  lines.push('Nilai transaksi: ' + formatRupiah(loss.selling_price));
  lines.push('Modal barang: ' + formatRupiah(loss.product_cost));
  lines.push('Ongkir ditanggung penjual: ' + formatRupiah(loss.shipping_cost));
  lines.push('Kemasan: ' + formatRupiah(loss.packaging_cost));
  if (loss.insurance_cost > 0) lines.push('Premi asuransi: ' + formatRupiah(loss.insurance_cost));
  lines.push('Refund ke pembeli: ' + formatRupiah(loss.refund_to_buyer));
  lines.push('Kompensasi diterima: ' + formatRupiah(loss.compensation_received));
  if (loss.recovered_goods_value > 0) lines.push('Nilai barang yang kembali: ' + formatRupiah(loss.recovered_goods_value));
  lines.push('Kerugian bersih: ' + formatRupiah(loss.net_loss));
  lines.push('Biaya yang belum tertutup kompensasi: ' + formatRupiah(loss.compensation_gap));
  if (requested > 0) lines.push('Ganti rugi yang diminta: ' + formatRupiah(requested));
  lines.push('');

  lines.push('Permintaan saya:', '');
  lines.push('1. Mohon jelaskan status investigasi dan pihak yang bertanggung jawab atas ' + type.label.toLowerCase() + ' ini.');
  lines.push('2. Mohon tinjau ulang kompensasi berdasarkan nilai barang dan bukti pengiriman, bukan hanya tarif ongkir.');
  lines.push('3. Mohon jangan menutup laporan sebelum ada keputusan tertulis dan bukti pembayaran kompensasi.');
  lines.push('4. Mohon kirimkan keputusan tertulis beserta nomor tiket dan perkiraan waktu penyelesaian dalam 14 hari kerja.');
  lines.push('');

  lines.push('Bukti yang saya lampirkan:', '');
  EVIDENCE.filter((item) => item.id !== 'return_unboxing' || type.id === 'retur_rusak').forEach((item, index) => {
    lines.push((index + 1) + '. ' + item.label);
  });
  lines.push('', 'Hormat saya,', sellerName);
  if (contact) lines.push(contact);
  lines.push('', 'Dibuat pada ' + today);

  return { subject: subject, body: lines.join('\n') };
}

function buildExample(now = new Date()) {
  const today = todayISO(now);
  return {
    platform: 'shopee',
    courier: 'spx',
    incident_type: 'hilang',
    selling_price: 1190000,
    refund_to_buyer: 1190000,
    product_cost: 900000,
    shipping_cost: 20000,
    packaging_cost: 3000,
    insurance: 'tidak',
    insurance_cost: 0,
    compensation_received: 135000,
    recovered_goods_value: 0,
    normal_margin_pct: 15,
    incident_date: addDays(today, -18),
    report_date: addDays(today, -16),
    last_follow_up: addDays(today, -2),
    status: 'ditanggapi',
    ref: '2610097HP352JR',
    tracking_ref: 'SPXID06396809073A',
    item_name: 'Crossover audio',
    claimed_amount: 1190000,
    received_amount: 135000,
    seller_name: 'Ricky',
    store_name: 'Sinar Audio Kediri',
    store_id: 'sainaraudio',
    contact: '0812xxxxxxx',
    chronology: formatDateOnly(addDays(today, -18)) + ': paket diserahkan ke SPX Express. ' + formatDateOnly(addDays(today, -16)) + ': ekspedisi menyatakan paket hilang atau rusak. ' + formatDateOnly(addDays(today, -2)) + ': Shopee menawarkan kompensasi Rp135.000 karena paket tidak diasuransikan.',
  };
}

module.exports = {
  analyze,
  readiness,
  computeLoss,
  caseView,
  summary,
  validateCase,
  normalizeCase,
  buildLetter,
  buildExample,
  agingFor,
  severityLabel,
  todayISO,
  addDays,
  daysBetween,
  formatDateOnly,
  formatTodayID,
  formatRupiah,
  getPlatform,
  getCourier,
  getIncidentType,
  getStatus,
  getEvidence,
  PLATFORMS,
  COURIERS,
  INCIDENT_TYPES,
  STATUSES,
  EVIDENCE,
  SOURCES,
  DEFAULTS,
};
