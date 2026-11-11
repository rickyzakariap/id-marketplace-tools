'use strict';

const MAX_NOTE = 400;
const MAX_TEXT = 160;
const MAX_SCANS = 20;

const MARKETPLACES = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tokopedia', label: 'Tokopedia' },
  { id: 'tiktok', label: 'TikTok Shop' },
  { id: 'lazada', label: 'Lazada' },
  { id: 'blibli', label: 'Blibli' },
  { id: 'lain', label: 'Marketplace lain' },
];

const COURIERS = [
  { id: 'sicepat', label: 'SiCepat' },
  { id: 'jne', label: 'JNE' },
  { id: 'jnt', label: 'J&T' },
  { id: 'spx', label: 'SPX Express' },
  { id: 'anteraja', label: 'AnterAja' },
  { id: 'ninja', label: 'Ninja Xpress' },
  { id: 'grab', label: 'GrabExpress' },
  { id: 'gojek', label: 'GoSend' },
  { id: 'lain', label: 'Ekspedisi lain' },
];

const SCAN_STATUSES = [
  { id: 'pickup', label: 'Dijemput kurir' },
  { id: 'transit', label: 'Dalam perjalanan' },
  { id: 'hub', label: 'Tiba di hub' },
  { id: 'ofd', label: 'Dibawa kurir (out for delivery)' },
  { id: 'ats', label: 'Alamat tidak sesuai (ATS)' },
  { id: 'returned', label: 'Retur pusat atau dikembalikan' },
  { id: 'delivered', label: 'Terkirim' },
  { id: 'failed', label: 'Gagal kirim' },
  { id: 'other', label: 'Status lain' },
];

const YES_NO = [
  { id: 'ya', label: 'Ya' },
  { id: 'tidak', label: 'Tidak' },
  { id: 'tidak_tahu', label: 'Belum tahu' },
];

const CASE_STATUSES = [
  { id: 'baru', label: 'Baru dicatat', open: true },
  { id: 'cek_tracking', label: 'Cek tracking', open: true },
  { id: 'minta_bukti', label: 'Menunggu bukti ekspedisi', open: true },
  { id: 'klaim_ekspedisi', label: 'Klaim ke ekspedisi', open: true },
  { id: 'klaim_marketplace', label: 'Klaim ke marketplace', open: true },
  { id: 'eskalasi', label: 'Eskalasi', open: true },
  { id: 'selesai', label: 'Selesai', open: false },
  { id: 'ditolak', label: 'Ditolak', open: false },
  { id: 'dibatalkan', label: 'Dibatalkan', open: false },
];

const LETTER_TYPES = [
  { id: 'ekspedisi', label: 'Surat klaim ke ekspedisi' },
  { id: 'marketplace', label: 'Surat peninjauan ke marketplace' },
  { id: 'bukti', label: 'Surat permintaan bukti pengantaran' },
];

const EVIDENCE = [
  {
    id: 'tracking_screenshot',
    label: 'Tangkapan layar riwayat resi lengkap dengan jam',
    critical: true,
  },
  {
    id: 'order_detail',
    label: 'Detail pesanan, alamat, dan nomor HP pembeli',
    critical: true,
  },
  {
    id: 'address_proof',
    label: 'Bukti alamat lengkap dan patokan rumah',
    critical: true,
  },
  {
    id: 'phone_active',
    label: 'Bukti nomor HP aktif dan riwayat panggilan',
    critical: true,
  },
  {
    id: 'courier_ticket',
    label: 'Tiket atau chat resmi dengan CS ekspedisi',
    critical: true,
  },
  {
    id: 'packing_video',
    label: 'Video pengemasan sebelum paket diserahkan',
    critical: false,
  },
  {
    id: 'handover_proof',
    label: 'Bukti serah terima paket ke kurir',
    critical: false,
  },
  {
    id: 'weight_photo',
    label: 'Foto timbangan dan berat paket',
    critical: false,
  },
  {
    id: 'buyer_statement',
    label: 'Pernyataan pembeli tidak menerima paket',
    critical: false,
  },
  {
    id: 'marketplace_ticket',
    label: 'Tiket klaim di marketplace',
    critical: false,
  },
  {
    id: 'cctv',
    label: 'Rekaman CCTV area serah terima atau rumah',
    critical: false,
  },
  {
    id: 'return_receipt',
    label: 'Bukti paket retur diterima kembali',
    critical: false,
  },
];

const SOURCES = [
  {
    title: 'Kurir SiCepat "Tembak Resi" ATS 1 Menit dan Langsung Main Retur Pusat',
    publisher: 'Media Konsumen',
    date: '2026-11-10',
    url: 'https://mediakonsumen.com/2026/11/10/surat-pembaca/kurir-sicepat-tembak-resi-ats-1-menit-dan-langsung-main-retur-pusat',
    facts: 'Surat pembaca 10 November 2026 mencatat resi SiCepat 006920823346 untuk pesanan TikTok Shop 30 Oktober 2026. Paket tiba di Hub Jakabaring 1 November 2026, dibawa kurir 5 November 2026 pukul 09:51, lalu berstatus ATS pukul 16:14 tanpa kurir datang atau menelepon. Pada 6 November 2026 paket dibawa kurir pukul 13:05 dan berstatus ATS pukul 13:06, hanya satu menit kemudian, lalu retur pusat pukul 13:40 atau 34 menit setelah ATS.',
  },
];

const THRESHOLDS = {
  ats_minutes: 5,
  return_minutes: 60,
  hub_hours: 72,
  note: 'Ambang 5 menit, 60 menit, dan 72 jam adalah penanda audit internal untuk menyorot pola tidak wajar. Angka ini bukan aturan resmi marketplace atau ekspedisi.',
};

const SCOPE_NOTE =
  'Tool memeriksa pola waktu pada riwayat resi dan menyiapkan bukti klaim. Tool tidak menentukan siapa bersalah dan tidak menjamin klaim diterima.';

const DISCLAIMER =
  'Hasil ini bukan putusan hukum. Keputusan klaim ada pada ekspedisi, marketplace, dan pihak berwenang. Selalu cocokkan dengan syarat layanan dan kanal resmi.';

const FIELD_LABELS = {
  order_value: 'Nilai pesanan',
  product_cost: 'Harga modal barang',
  shipping_cost: 'Ongkir yang ditanggung penjual',
  packaging_cost: 'Biaya kemasan',
  return_shipping_cost: 'Ongkir retur',
  other_cost: 'Biaya lain',
  recovered_goods_value: 'Nilai barang yang kembali',
  timeline: 'Riwayat resi',
};

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function oneOf(value, list, fallback) {
  return list.some((item) => item.id === value) ? value : fallback;
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

function parseWhen(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function formatWhen(value) {
  const time = parseWhen(value);
  if (time === null) return 'waktu tidak tercatat';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

function minutesBetween(from, to) {
  return Math.round(((to - from) / 60000) * 10) / 10;
}

function hoursBetween(from, to) {
  return Math.round(((to - from) / 3600000) * 10) / 10;
}

function normalizeTimeline(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const statusIds = SCAN_STATUSES.map((item) => item.id);
  return list
    .map((item) => {
      const scan = item && typeof item === 'object' ? item : {};
      return {
        status: oneOf(scan.status, SCAN_STATUSES, 'other'),
        at: cleanText(scan.at, MAX_TEXT),
        note: cleanText(scan.note, MAX_NOTE),
        known: statusIds.includes(scan.status),
      };
    })
    .filter((item) => item.at !== '' || item.note !== '')
    .map((item) => ({
      status: item.status,
      at: item.at,
      note: item.note,
      known: item.known,
    }));
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
    courier: oneOf(input.courier, COURIERS, 'sicepat'),
    resi: cleanText(input.resi, MAX_TEXT),
    order_value: numOr(input.order_value, 0),
    product_cost: numOr(input.product_cost, 0),
    shipping_cost: numOr(input.shipping_cost, 0),
    packaging_cost: numOr(input.packaging_cost, 0),
    return_shipping_cost: numOr(input.return_shipping_cost, 0),
    other_cost: numOr(input.other_cost, 0),
    recovered_goods_value: numOr(input.recovered_goods_value, 0),
    address_complete: oneOf(input.address_complete, YES_NO, 'tidak_tahu'),
    phone_active: oneOf(input.phone_active, YES_NO, 'tidak_tahu'),
    contact_attempt: oneOf(input.contact_attempt, YES_NO, 'tidak_tahu'),
    buyer_requested_return: oneOf(input.buyer_requested_return, YES_NO, 'tidak_tahu'),
    incident_date: cleanText(input.incident_date, 20),
    report_date: cleanText(input.report_date, 20),
    note: cleanText(input.note, MAX_NOTE),
    status: oneOf(input.status, CASE_STATUSES, 'baru'),
    evidence: uniqueEvidence,
    timeline: normalizeTimeline(input.timeline),
  };
}

function validateAnalysis(input) {
  [
    'order_value',
    'product_cost',
    'shipping_cost',
    'packaging_cost',
    'return_shipping_cost',
    'other_cost',
    'recovered_goods_value',
  ].forEach((key) => {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(FIELD_LABELS[key] + ' harus berupa angka 0 atau lebih.');
    }
  });

  if (!Array.isArray(input.timeline)) {
    throw new Error(FIELD_LABELS.timeline + ' harus berupa daftar scan.');
  }
  if (input.timeline.length > MAX_SCANS) {
    throw new Error(FIELD_LABELS.timeline + ' maksimal ' + MAX_SCANS + ' baris.');
  }
  input.timeline.forEach((scan, index) => {
    if (scan.at && parseWhen(scan.at) === null) {
      throw new Error('Waktu scan baris ' + (index + 1) + ' tidak valid.');
    }
  });
  ['incident_date', 'report_date'].forEach((key) => {
    if (input[key] && parseWhen(input[key]) === null) {
      throw new Error('Tanggal ' + key.replace('_', ' ') + ' tidak valid.');
    }
  });
}

function sortedScans(input) {
  return input.timeline
    .map((scan, index) => ({
      status: scan.status,
      at: scan.at,
      note: scan.note,
      index,
      time: parseWhen(scan.at),
    }))
    .filter((scan) => scan.time !== null)
    .sort((a, b) => a.time - b.time || a.index - b.index);
}

function previousOf(scans, time, statuses) {
  const list = scans.filter(
    (scan) => scan.time < time && statuses.includes(scan.status)
  );
  return list.length ? list[list.length - 1] : null;
}

function firstOf(scans, statuses) {
  return scans.find((scan) => statuses.includes(scan.status)) || null;
}

function buildSignals(input, scans) {
  const ats = scans.filter((scan) => scan.status === 'ats');
  const ofd = scans.filter((scan) => scan.status === 'ofd');
  const returned = scans.filter((scan) => scan.status === 'returned');
  const hubs = scans.filter((scan) => scan.status === 'hub');
  const signals = [];

  function add(id, label, severity, triggered, note) {
    signals.push({ id, label, severity, triggered, note });
  }

  let fastestAts = null;
  ats.forEach((scan) => {
    const previous = previousOf(scans, scan.time, ['ofd']);
    if (previous) {
      const minutes = minutesBetween(previous.time, scan.time);
      if (fastestAts === null || minutes < fastestAts.minutes) {
        fastestAts = { minutes, from: previous, to: scan };
      }
    }
  });
  add(
    'ats_fast',
    'ATS muncul tidak lama setelah paket dibawa kurir',
    'high',
    fastestAts !== null && fastestAts.minutes <= THRESHOLDS.ats_minutes,
    fastestAts
      ? 'Jarak dari status dibawa kurir ke ATS: ' + fastestAts.minutes + ' menit. Ambang audit ' + THRESHOLDS.ats_minutes + ' menit.'
      : 'Tidak ada pasangan status dibawa kurir dan ATS yang bisa dihitung.'
  );

  let fastestReturn = null;
  returned.forEach((scan) => {
    const previous = previousOf(scans, scan.time, ['ats']);
    if (previous) {
      const minutes = minutesBetween(previous.time, scan.time);
      if (fastestReturn === null || minutes < fastestReturn.minutes) {
        fastestReturn = { minutes, from: previous, to: scan };
      }
    }
  });
  add(
    'return_fast',
    'Retur pusat muncul tidak lama setelah ATS',
    'high',
    fastestReturn !== null && fastestReturn.minutes <= THRESHOLDS.return_minutes,
    fastestReturn
      ? 'Jarak dari ATS ke retur pusat: ' + fastestReturn.minutes + ' menit. Ambang audit ' + THRESHOLDS.return_minutes + ' menit.'
      : 'Tidak ada pasangan ATS dan retur pusat yang bisa dihitung.'
  );

  let longestHub = null;
  ofd.forEach((scan) => {
    const previous = previousOf(scans, scan.time, ['hub']);
    if (previous) {
      const hours = hoursBetween(previous.time, scan.time);
      if (longestHub === null || hours > longestHub.hours) {
        longestHub = { hours, from: previous, to: scan };
      }
    }
  });
  add(
    'hub_long',
    'Paket menginap lama di hub sebelum dibawa kurir',
    'medium',
    longestHub !== null && longestHub.hours >= THRESHOLDS.hub_hours,
    longestHub
      ? 'Jarak dari tiba di hub ke dibawa kurir: ' + longestHub.hours + ' jam. Ambang audit ' + THRESHOLDS.hub_hours + ' jam.'
      : 'Tidak ada pasangan tiba di hub dan dibawa kurir yang bisa dihitung.'
  );

  add(
    'repeat_ats',
    'ATS muncul lebih dari satu kali untuk resi yang sama',
    'high',
    ats.length >= 2,
    'Jumlah status ATS: ' + ats.length + '.'
  );

  const firstAts = firstOf(scans, ['ats']);
  const firstOfd = firstOf(scans, ['ofd']);
  add(
    'ats_without_ofd',
    'ATS muncul tanpa status dibawa kurir sebelumnya',
    'high',
    firstAts !== null && (firstOfd === null || firstOfd.time > firstAts.time),
    firstAts
      ? 'ATS pertama tercatat ' + formatWhen(firstAts.at) + '.'
      : 'Tidak ada status ATS.'
  );

  add(
    'address_complete_ats',
    'Alamat dinyatakan lengkap tetapi tetap berstatus ATS',
    'high',
    firstAts !== null && input.address_complete === 'ya',
    firstAts
      ? 'Alamat lengkap: ' + findById(YES_NO, input.address_complete).label + '.'
      : 'Tidak ada status ATS.'
  );

  add(
    'phone_active_ats',
    'Nomor HP aktif tetapi tetap berstatus ATS',
    'high',
    firstAts !== null && input.phone_active === 'ya',
    firstAts
      ? 'Nomor HP aktif: ' + findById(YES_NO, input.phone_active).label + '.'
      : 'Tidak ada status ATS.'
  );

  add(
    'no_contact_attempt',
    'Tidak ada bukti kurir mencoba menghubungi pembeli',
    'high',
    firstAts !== null && input.contact_attempt === 'tidak',
    firstAts
      ? 'Kurir menghubungi pembeli: ' + findById(YES_NO, input.contact_attempt).label + '.'
      : 'Tidak ada status ATS.'
  );

  add(
    'return_without_request',
    'Retur sepihak tanpa permintaan pembeli',
    'high',
    returned.length > 0 && input.buyer_requested_return === 'tidak',
    returned.length
      ? 'Pembeli meminta retur: ' + findById(YES_NO, input.buyer_requested_return).label + '.'
      : 'Tidak ada status retur.'
  );

  const firstReturn = firstOf(scans, ['returned']);
  add(
    'return_without_ats',
    'Retur muncul tanpa didahului status ATS',
    'high',
    firstReturn !== null && (firstAts === null || firstAts.time > firstReturn.time),
    firstReturn
      ? 'Retur pertama tercatat ' + formatWhen(firstReturn.at) + '.'
      : 'Tidak ada status retur.'
  );

  const triggered = signals.filter((item) => item.triggered);
  const points = triggered.reduce((sum, item) => {
    if (item.severity === 'high') return sum + 20;
    if (item.severity === 'medium') return sum + 10;
    return sum + 5;
  }, 0);
  const score = Math.min(100, points);

  let label = 'Tidak ada indikasi';
  if (score >= 50) label = 'Indikasi kuat';
  else if (score >= 20) label = 'Indikasi sedang';
  else if (score > 0) label = 'Indikasi rendah';

  return {
    signals,
    triggered,
    triggered_count: triggered.length,
    score,
    label,
    points,
    thresholds: THRESHOLDS,
  };
}

function assessEvidence(input) {
  const items = EVIDENCE.map((item) => ({
    id: item.id,
    label: item.label,
    critical: item.critical,
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

function calculateLoss(input) {
  const baseCost =
    input.product_cost +
    input.shipping_cost +
    input.packaging_cost +
    input.return_shipping_cost +
    input.other_cost;
  const cashLoss = Math.max(0, baseCost - input.recovered_goods_value);
  const normalProfit = Math.max(
    0,
    input.order_value -
      input.product_cost -
      input.shipping_cost -
      input.packaging_cost -
      input.other_cost
  );
  const totalImpact = round2(cashLoss + normalProfit);
  const normalSalesToCover =
    normalProfit > 0 ? Math.ceil(totalImpact / normalProfit) : null;

  return {
    order_value: round2(input.order_value),
    product_cost: round2(input.product_cost),
    shipping_cost: round2(input.shipping_cost),
    packaging_cost: round2(input.packaging_cost),
    return_shipping_cost: round2(input.return_shipping_cost),
    other_cost: round2(input.other_cost),
    recovered_goods_value: round2(input.recovered_goods_value),
    base_cost: round2(baseCost),
    cash_loss: round2(cashLoss),
    normal_profit: round2(normalProfit),
    total_impact: totalImpact,
    normal_sales_to_cover: normalSalesToCover,
    note: 'Kerugian kas dan kerugian profit ditampilkan terpisah. Dampak total menjumlahkan keduanya agar nilai pesanan tidak dihitung dua kali.',
  };
}

function buildVerdict(input, indication, evidence, loss) {
  if (indication.triggered_count === 0) {
    return {
      level: 'ok',
      label: 'Tidak ada pola ATS fiktif',
      note: 'Riwayat resi belum menunjukkan jeda waktu yang tidak wajar. Tambahkan scan lain bila ada, lalu cocokkan dengan bukti pengantaran dari ekspedisi.',
    };
  }

  if (indication.score >= 50) {
    if (evidence.missing_critical.length > 0) {
      return {
        level: 'ember',
        label: 'Indikasi kuat, bukti kritis belum lengkap',
        note: 'Pola waktu menunjukkan ATS dan retur yang sangat cepat. Lengkapi bukti kritis sebelum mengajukan klaim: ' +
          evidence.missing_critical.map((item) => item.label).join(', ') + '.',
      };
    }
    return {
      level: 'signal',
      label: 'Indikasi kuat, ajukan klaim',
      note: 'Pola waktu menunjukkan ATS dan retur yang sangat cepat. Bukti kritis sudah lengkap. Ajukan klaim tertulis dan minta bukti pengantaran dari ekspedisi.',
    };
  }

  if (indication.score >= 20) {
    return {
      level: 'signal',
      label: 'Indikasi sedang, perlu pendalaman',
      note: 'Ada beberapa jeda waktu yang perlu diperiksa. Minta log pengantaran dan bukti kontak kurir sebelum menyimpulkan status fiktif.',
    };
  }

  return {
    level: 'signal',
    label: 'Indikasi rendah, cek manual',
    note: 'Ada satu penanda kecil, tetapi belum cukup untuk menyimpulkan ATS fiktif. Cocokkan dengan bukti pengantaran dan pernyataan pembeli.',
  };
}

function buildRecommendations(input, indication, evidence, loss) {
  const list = [];
  const triggered = indication.signals.filter((item) => item.triggered);

  if (triggered.some((item) => item.id === 'ats_fast')) {
    list.push('Simpan tangkapan layar status dibawa kurir dan ATS beserta jamnya. Jeda di bawah ' + THRESHOLDS.ats_minutes + ' menit adalah penanda audit, bukan aturan resmi.');
  }
  if (triggered.some((item) => item.id === 'return_fast')) {
    list.push('Catat waktu ATS dan retur pusat. Minta ekspedisi menjelaskan dasar retur sebelum paket dikembalikan.');
  }
  if (triggered.some((item) => item.id === 'hub_long')) {
    list.push('Minta log posisi paket di hub dan alasan paket tidak segera dibawa kurir.');
  }
  if (triggered.some((item) => item.id === 'repeat_ats')) {
    list.push('Sorot ATS yang berulang pada resi yang sama. Minta nama kurir, jam keluar hub, dan bukti kunjungan.');
  }
  if (input.contact_attempt === 'tidak') {
    list.push('Minta log panggilan atau chat kurir. Bila tidak ada percobaan kontak, tulis itu sebagai temuan, bukan tuduhan.');
  }
  if (input.buyer_requested_return === 'tidak') {
    list.push('Minta konfirmasi tertulis bahwa pembeli tidak meminta retur. Simpan pernyataan pembeli bila memungkinkan.');
  }
  if (evidence.missing_critical.length > 0) {
    list.push('Lengkapi bukti kritis: ' + evidence.missing_critical.map((item) => item.label).join(', ') + '.');
  }

  list.push('Ajukan klaim melalui kanal resmi ekspedisi dan marketplace. Catat nomor tiket, tanggal, dan nama petugas.');
  list.push('Gunakan kerugian kas ' + formatRupiah(loss.cash_loss) + ' dan dampak total ' + formatRupiah(loss.total_impact) + ' sebagai dasar klaim, bukan hanya nilai pesanan.');
  list.push('Jangan menyebut nama kurir atau hub sebagai pelaku tanpa bukti. Fokus pada status, waktu, dan permintaan verifikasi.');
  list.push(DISCLAIMER);

  return list.filter((item, index) => list.indexOf(item) === index);
}

function timelineText(scans) {
  if (!scans.length) return '- Belum ada scan yang bisa dibaca.';
  return scans
    .map((scan) => {
      const label = findById(SCAN_STATUSES, scan.status).label;
      return '- ' + formatWhen(scan.at) + ': ' + label + (scan.note ? ' (' + scan.note + ')' : '');
    })
    .join('\n');
}

function signalText(indication) {
  const triggered = indication.signals.filter((item) => item.triggered);
  if (!triggered.length) return '- Tidak ada penanda waktu yang terpicu.';
  return triggered.map((item) => '- ' + item.label + ': ' + item.note).join('\n');
}

function letter(raw) {
  const result = analyze(raw);
  const input = result.input;
  const type = oneOf(raw.letter_type, LETTER_TYPES, 'ekspedisi');
  const store = input.store_name || 'Toko saya';
  const seller = input.seller_name || 'Penjual';
  const contact = input.contact || '-';
  const resi = input.resi || '(nomor resi belum diisi)';
  const courier = findById(COURIERS, input.courier).label;
  const marketplace = findById(MARKETPLACES, input.marketplace).label;
  const ticket = input.ticket ? 'Nomor tiket: ' + input.ticket + '.\n' : '';
  const scans = sortedScans(input);
  const timeline = timelineText(scans);
  const signals = signalText(result.indication);
  const missing = result.evidence.missing_critical.length
    ? result.evidence.missing_critical.map((item) => '- ' + item.label).join('\n')
    : '- Tidak ada bukti kritis yang hilang.';

  let subject = 'Klaim status ATS dan retur sepihak untuk resi ' + resi;
  let heading = 'Kepada Tim Klaim ' + courier + ',';
  let body = '';

  if (type === 'marketplace') {
    subject = 'Permintaan peninjauan status ATS dan retur sepihak resi ' + resi;
    heading = 'Kepada Tim Seller Support ' + marketplace + ',';
    body =
      'Saya ' + seller + ' dari ' + store + ', penjual di ' + marketplace + '.\n\n' +
      'Saya meminta peninjauan atas pesanan dengan nomor resi ' + resi + ' yang dikirim melalui ' + courier + '. Paket berstatus ATS dan diretur tanpa bukti pengantaran yang jelas.\n\n' +
      ticket +
      'Ringkasan kerugian menurut input saya:\n' +
      '- Nilai pesanan: ' + formatRupiah(result.loss.order_value) + '.\n' +
      '- Kerugian kas: ' + formatRupiah(result.loss.cash_loss) + '.\n' +
      '- Dampak total: ' + formatRupiah(result.loss.total_impact) + '.\n\n' +
      'Riwayat resi:\n' + timeline + '\n\n' +
      'Penanda waktu:\n' + signals + '\n\n' +
      'Saya meminta marketplace:\n' +
      '1. Meninjau status ATS dan retur sebelum menutup pesanan.\n' +
      '2. Meminta bukti pengantaran dari ekspedisi, termasuk foto, tanda tangan, GPS, dan log kontak kurir.\n' +
      '3. Menahan pembebanan ongkir retur sampai status pengantaran diverifikasi.\n' +
      '4. Memberikan keputusan tertulis dan nomor tiket.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else if (type === 'bukti') {
    subject = 'Permintaan bukti pengantaran dan log kontak kurir resi ' + resi;
    heading = 'Kepada Tim Operasional ' + courier + ',';
    body =
      'Saya ' + seller + ' dari ' + store + '.\n\n' +
      'Saya meminta bukti pengantaran untuk resi ' + resi + ' yang berstatus ATS dan diretur. Mohon kirimkan data berikut:\n' +
      '1. Nama kurir dan jam keluar dari hub untuk setiap percobaan pengantaran.\n' +
      '2. Foto lokasi, tanda tangan penerima, atau bukti GPS saat status ATS dibuat.\n' +
      '3. Log panggilan atau chat ke nomor pembeli, termasuk jam dan hasilnya.\n' +
      '4. Alasan tertulis mengapa alamat dinyatakan tidak sesuai.\n' +
      '5. Dasar dan waktu keputusan retur pusat.\n\n' +
      'Riwayat resi yang saya pegang:\n' + timeline + '\n\n' +
      'Penanda waktu:\n' + signals + '\n\n' +
      'Saya tidak menuduh individu tertentu. Saya meminta data agar status ATS dan retur bisa diverifikasi. ' +
      ticket +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  } else {
    body =
      'Saya ' + seller + ' dari ' + store + '.\n\n' +
      'Saya mengajukan klaim atas resi ' + resi + ' yang dikirim melalui ' + courier + '. Paket berstatus ATS dan diretur tanpa bukti pengantaran yang jelas.\n\n' +
      ticket +
      'Riwayat resi:\n' + timeline + '\n\n' +
      'Penanda waktu:\n' + signals + '\n\n' +
      'Kerugian yang saya hitung:\n' +
      '- Nilai pesanan: ' + formatRupiah(result.loss.order_value) + '.\n' +
      '- Harga modal barang: ' + formatRupiah(result.loss.product_cost) + '.\n' +
      '- Ongkir dan kemasan: ' + formatRupiah(result.loss.shipping_cost + result.loss.packaging_cost) + '.\n' +
      '- Ongkir retur: ' + formatRupiah(result.loss.return_shipping_cost) + '.\n' +
      '- Nilai barang yang kembali: ' + formatRupiah(result.loss.recovered_goods_value) + '.\n' +
      '- Kerugian kas: ' + formatRupiah(result.loss.cash_loss) + '.\n' +
      '- Dampak total: ' + formatRupiah(result.loss.total_impact) + '.\n\n' +
      'Saya meminta:\n' +
      '1. Bukti pengantaran dan log kontak kurir untuk setiap status ATS.\n' +
      '2. Penjelasan tertulis dasar retur pusat.\n' +
      '3. Pengembalian ongkir retur bila status ATS tidak terbukti.\n' +
      '4. Kompensasi atas kerugian kas yang timbul.\n' +
      '5. Keputusan tertulis beserta nomor tiket.\n\n' +
      'Bukti kritis yang belum saya lengkapi:\n' + missing + '\n\n' +
      'Saya dapat dihubungi melalui ' + contact + '. Terima kasih.\n\n' +
      'Hormat saya,\n' + seller + '\n' + store;
  }

  return { type, subject, heading, body };
}

function analyze(raw) {
  const input = normalizeInput(raw);
  validateAnalysis(input);

  const scans = sortedScans(input);
  const indication = buildSignals(input, scans);
  const evidence = assessEvidence(input);
  const loss = calculateLoss(input);
  const verdict = buildVerdict(input, indication, evidence, loss);
  const recommendations = buildRecommendations(input, indication, evidence, loss);

  return {
    input,
    marketplace_label: findById(MARKETPLACES, input.marketplace).label,
    courier_label: findById(COURIERS, input.courier).label,
    timeline: scans.map((scan) => ({
      status: scan.status,
      status_label: findById(SCAN_STATUSES, scan.status).label,
      at: scan.at,
      at_label: formatWhen(scan.at),
      note: scan.note,
    })),
    indication,
    evidence,
    loss,
    verdict,
    recommendations,
    sources: SOURCES,
    rules: {
      thresholds: THRESHOLDS,
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
  };
}

function readiness(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(source.evidence) ? source.evidence : source.items;
  const input = normalizeInput({ evidence: items });
  return assessEvidence(input);
}

function example() {
  return {
    store_name: 'Toko Rumah Contoh',
    seller_name: 'Kevin',
    contact: 'kevin@example.com',
    ticket: 'TKT-2026-1110',
    marketplace: 'tiktok',
    courier: 'sicepat',
    resi: '006920823346',
    order_value: 1250000,
    product_cost: 900000,
    shipping_cost: 25000,
    packaging_cost: 5000,
    return_shipping_cost: 25000,
    other_cost: 0,
    recovered_goods_value: 750000,
    address_complete: 'ya',
    phone_active: 'ya',
    contact_attempt: 'tidak',
    buyer_requested_return: 'tidak',
    incident_date: '2026-11-05',
    report_date: '2026-11-10',
    note: 'Contoh data dari surat pembaca Media Konsumen 10 November 2026, bukan kasus nyata pengguna.',
    status: 'klaim_ekspedisi',
    evidence: [
      'tracking_screenshot',
      'order_detail',
      'address_proof',
      'phone_active',
      'packing_video',
      'handover_proof',
      'buyer_statement',
      'marketplace_ticket',
    ],
    timeline: [
      { status: 'hub', at: '2026-11-01T08:00', note: 'Tiba di Hub Jakabaring' },
      { status: 'ofd', at: '2026-11-05T09:51', note: 'Dibawa kurir' },
      { status: 'ats', at: '2026-11-05T16:14', note: 'ATS tanpa kunjungan' },
      { status: 'hub', at: '2026-11-06T07:44', note: 'Kembali ke hub' },
      { status: 'ofd', at: '2026-11-06T13:05', note: 'Dibawa kurir kedua' },
      { status: 'ats', at: '2026-11-06T13:06', note: 'ATS satu menit kemudian' },
      { status: 'returned', at: '2026-11-06T13:40', note: 'Retur pusat' },
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
      resi: item.resi,
      marketplace_label: analysis.marketplace_label,
      courier_label: analysis.courier_label,
      order_value: analysis.loss.order_value,
      cash_loss: analysis.loss.cash_loss,
      total_impact: analysis.loss.total_impact,
      indication_score: analysis.indication.score,
      indication_label: analysis.indication.label,
      evidence_score: analysis.evidence.score,
      evidence_label: analysis.evidence.label,
      missing_critical_count: analysis.evidence.missing_critical.length,
      verdict: analysis.verdict,
      status: item.status,
      status_label: status.label,
      note: item.note,
      ticket: item.ticket,
      incident_date: item.incident_date,
      report_date: item.report_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      analysis,
    };
  });

  const open = cases.filter((item) => findById(CASE_STATUSES, item.status).open);
  const highIndication = open.filter((item) => item.indication_score >= 50);
  const missingEvidence = open.filter((item) => item.missing_critical_count > 0);
  const totalCashLoss = round2(open.reduce((sum, item) => sum + Math.max(0, item.cash_loss), 0));
  const totalImpact = round2(open.reduce((sum, item) => sum + Math.max(0, item.total_impact), 0));

  return {
    total: cases.length,
    open_cases: open.length,
    high_indication: highIndication.length,
    missing_evidence: missingEvidence.length,
    total_cash_loss: totalCashLoss,
    total_impact: totalImpact,
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
    'resi',
    'marketplace',
    'ekspedisi',
    'nilai_pesanan',
    'hpp',
    'ongkir',
    'kemasan',
    'ongkir_retur',
    'biaya_lain',
    'barang_kembali',
    'kerugian_kas',
    'dampak_total',
    'skor_indikasi',
    'verdict',
    'skor_bukti',
    'status',
    'tanggal_kejadian',
  ];
  const lines = [header.join(',')];
  summary.cases.forEach((item) => {
    const loss = item.analysis.loss;
    lines.push(
      [
        item.id,
        item.store_name,
        item.resi,
        item.marketplace_label,
        item.courier_label,
        loss.order_value,
        loss.product_cost,
        loss.shipping_cost,
        loss.packaging_cost,
        loss.return_shipping_cost,
        loss.other_cost,
        loss.recovered_goods_value,
        loss.cash_loss,
        loss.total_impact,
        item.indication_score,
        item.verdict.label,
        item.evidence_score,
        item.status_label,
        item.incident_date,
      ]
        .map((value) => csvEscape(value))
        .join(',')
    );
  });
  return lines.join('\n');
}

function meta() {
  return {
    marketplaces: MARKETPLACES,
    couriers: COURIERS,
    scan_statuses: SCAN_STATUSES,
    yes_no: YES_NO,
    case_statuses: CASE_STATUSES,
    letter_types: LETTER_TYPES,
    evidence: EVIDENCE,
    thresholds: THRESHOLDS,
    rules: {
      scope_note: SCOPE_NOTE,
      disclaimer: DISCLAIMER,
    },
    sources: SOURCES,
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
  MARKETPLACES,
  COURIERS,
  SCAN_STATUSES,
  YES_NO,
  CASE_STATUSES,
  LETTER_TYPES,
  EVIDENCE,
  SOURCES,
  THRESHOLDS,
};
