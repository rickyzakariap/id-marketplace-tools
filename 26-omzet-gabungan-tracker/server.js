const express = require('express');
const path = require('path');

const app = express();
const PORT = 8026;

app.use(express.json());
app.use(express.static('public'));

// DJP accumulates seller omzet across ALL marketplaces + offline sales
// for the Rp 500jt/year free-tax threshold (PMK 37/2025, confirmed Jun 25 2026).
const THRESHOLD = 500000000; // Rp 500 juta per tahun
const RATE_PPH22 = 0.005;    // 0,5% final

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', color: '#ee4d2d' },
  { id: 'tokopedia', name: 'Tokopedia', color: '#00aa5b' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#111111' },
  { id: 'lazada', name: 'Lazada', color: '#0f146d' },
  { id: 'blibli', name: 'Blibli', color: '#0073c8' },
  { id: 'bukalapak', name: 'Bukalapak', color: '#e31837' },
  { id: 'lainnya', name: 'Offline / Lainnya', color: '#666666' }
];

// Policy timeline (date-aware):
// 1 Aug 2026  : pemungutan dimulai
// 6 Aug 2026  : ditunda (protes massal)
// 14 Aug-30 Sep : refund dana 1-5 Agustus
// 1 Nov 2026  : dijadwalkan berlaku kembali, tapi 19 Agu 2026 Menkeu
//               buka opsi mundur ke 2027 kalau ekonomi belum tumbuh 6%.
const POLICY = {
  key_dates: {
    active: '2026-08-01',
    stopped: '2026-08-06',
    refund_start: '2026-08-14',
    refund_end: '2026-09-30',
    restart: '2026-11-01'
  },
  description: 'DJP menghitung omzet dari SEMUA marketplace sekaligus, plus penjualan offline (Ortax, 29 Jul 2026). Kalau total omzet setahun lewat Rp 500 juta, seller kena PPh 22 final 0,5%.',
  restart_note: 'Pemungutan dijadwalkan berlaku kembali 1 November 2026, tapi Menkeu menyatakan 19 Agustus 2026 bisa ditunda lagi ke 2027 kalau ekonomi belum tumbuh 6%.'
};

function todayOnly(now) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(from, to) {
  return Math.round((to - from) / 86400000);
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Policy status derived from current date
function getStatus(now) {
  const today = todayOnly(now);
  const active = parseDate(POLICY.key_dates.active);
  const stopped = parseDate(POLICY.key_dates.stopped);
  const refundStart = parseDate(POLICY.key_dates.refund_start);
  const refundEnd = parseDate(POLICY.key_dates.refund_end);
  const restart = parseDate(POLICY.key_dates.restart);

  if (today < active) {
    return { phase: 'belum', label: 'Belum berlaku', description: 'Pemungutan PPh 22 marketplace dimulai 1 Agustus 2026. Gunakan tool ini untuk cek posisi omzet gabungan sebelum aturan jalan.', days_to_restart: daysBetween(today, restart) };
  }
  if (today < stopped) {
    return { phase: 'pungut', label: 'Pemungutan berjalan', description: 'Marketplace memungut PPh 22 0,5% dari peredaran bruto. Cek omzet gabungan kamu untuk tahu apakah kena pungutan.', days_to_restart: daysBetween(today, restart) };
  }
  if (today < refundStart) {
    return { phase: 'stop-gap', label: 'Pemungutan dihentikan sementara', description: 'Kemenkeu menunda pemungutan. Refund dana yang terlanjur dipotong mulai 14 Agustus 2026.', days_to_restart: daysBetween(today, restart) };
  }
  if (today <= refundEnd) {
    const total = daysBetween(refundStart, refundEnd);
    const elapsed = Math.max(0, daysBetween(refundStart, today));
    return {
      phase: 'refund', label: 'Masa refund berjalan', days_to_restart: daysBetween(today, restart),
      description: 'Dana PPh 22 yang dipotong 1-5 Agustus dikembalikan otomatis. Sambil menunggu, cek apakah omzet gabungan kamu sudah mendekati Rp 500 juta.',
      refund_pct: Math.round(elapsed / total * 100)
    };
  }
  if (today < restart) {
    return { phase: 'refund-done', label: 'Refund selesai, tunggu restart', description: 'Pemungutan dijadwalkan berlaku kembali 1 November 2026. Cek posisi omzet kamu sekarang, jangan kaget saat aturan jalan.', days_to_restart: daysBetween(today, restart) };
  }
  return { phase: 'restart', label: 'Pemungutan berlaku kembali', description: 'PPh 22 0,5% aktif lagi. Kalau omzet gabungan kamu lewat Rp 500 juta, marketplace memotong dari peredaran bruto.', days_to_restart: 0 };
}

// Analyze omzet grid.
// body: { values: { shopee: [12 numbers], ... }, now: 'YYYY-MM-DD' }
// values[key] = omzet per bulan Jan..Des (0 = kosong)
function analyze(body) {
  const values = body.values || {};
  const now = body.now ? parseDate(body.now) : todayOnly(new Date());
  const currentMonth = now.getMonth(); // 0-based, Aug = 7

  const perMarketplace = [];
  const monthTotals = new Array(12).fill(0);
  let ytd = 0;

  MARKETPLACES.forEach(mp => {
    const arr = Array.isArray(values[mp.id]) ? values[mp.id].map(Number) : [];
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const v = Math.max(0, arr[m] || 0);
      monthTotals[m] += v;
      total += v;
      if (m <= currentMonth) ytd += v;
    }
    perMarketplace.push({ id: mp.id, name: mp.name, color: mp.color, total, months: arr });
  });

  const fullYear = monthTotals.reduce((a, b) => a + b, 0);
  const monthsElapsed = currentMonth + 1;
  const avgMonthly = ytd / monthsElapsed;
  const projectedAnnual = Math.round(avgMonthly * 12);

  // Status based on projected annual vs threshold
  let status, statusLabel, statusDesc;
  const pctProjected = projectedAnnual / THRESHOLD * 100;
  if (pctProjected < 50) {
    status = 'aman';
    statusLabel = 'Aman';
    statusDesc = 'Proyeksi omzet setahun masih jauh di bawah Rp 500 juta. Kemungkinan besar tidak kena pungutan PPh 22.';
  } else if (pctProjected < 80) {
    status = 'waspada';
    statusLabel = 'Waspada';
    statusDesc = 'Proyeksi omzet sudah 50-80% dari batas. Kalau penjualan naik, bisa mendekati ambang PPh 22.';
  } else if (pctProjected < 100) {
    status = 'mendekati';
    statusLabel = 'Mendekati batas';
    statusDesc = 'Proyeksi omzet 80-100% dari Rp 500 juta. Siapkan surat pernyataan omzet di bawah batas atau siap-siap dipungut.';
  } else {
    status = 'terlewat';
    statusLabel = 'Di atas batas';
    statusDesc = 'Proyeksi omzet lewat Rp 500 juta. Kamu masuk kriteria pemungutan PPh 22 0,5% dari peredaran bruto.';
  }

  // Crossing month: bulan di mana kumulatif omzet menyentuh threshold
  let crossingMonth = -1;
  if (avgMonthly > 0) {
    let cum = 0;
    for (let m = 0; m < 12; m++) {
      cum += monthTotals[m] > 0 ? monthTotals[m] : avgMonthly;
      if (cum >= THRESHOLD) { crossingMonth = m; break; }
    }
  }

  const projectedPph22 = projectedAnnual >= THRESHOLD ? Math.round(projectedAnnual * RATE_PPH22) : 0;
  const ytdPph22 = ytd >= THRESHOLD ? Math.round(ytd * RATE_PPH22) : 0;

  return {
    threshold: THRESHOLD,
    months: MONTHS,
    ytd,
    ytd_pct: Math.round(ytd / THRESHOLD * 100),
    full_year: fullYear,
    projected_annual: projectedAnnual,
    projected_pct: Math.round(pctProjected),
    avg_monthly: Math.round(avgMonthly),
    status,
    status_label: statusLabel,
    status_desc: statusDesc,
    crossing_month: crossingMonth >= 0 ? MONTHS[crossingMonth] : null,
    pph22_estimated_year: projectedPph22,
    pph22_estimated_ytd: ytdPph22,
    pph22_rate_pct: RATE_PPH22 * 100,
    per_marketplace: perMarketplace,
    month_totals: monthTotals
  };
}

app.get('/api/status', (req, res) => {
  res.json({ policy: POLICY, status: getStatus(new Date()) });
});

app.get('/api/marketplaces', (req, res) => {
  res.json(MARKETPLACES);
});

// POST /api/analyze
// body: { values: { shopee: [12], tokopedia: [12], ... } }
app.post('/api/analyze', (req, res) => {
  const body = req.body || {};
  if (!body.values || typeof body.values !== 'object') {
    return res.status(400).json({ error: 'values wajib diisi: { marketplace: [12 angka omzet] }' });
  }
  try {
    res.json(analyze(body));
  } catch (e) {
    res.status(400).json({ error: 'format omzet tidak valid' });
  }
});

// GET /api/example - example omzet data (3 marketplaces, realistic UMKM scale)
app.get('/api/example', (req, res) => {
  res.json({
    values: {
      shopee: [32000000, 35000000, 38000000, 41000000, 45000000, 48000000, 52000000, 55000000, 0, 0, 0, 0],
      tokopedia: [18000000, 19000000, 21000000, 22000000, 24000000, 26000000, 28000000, 30000000, 0, 0, 0, 0],
      tiktok: [8000000, 9000000, 11000000, 13000000, 15000000, 17000000, 19000000, 21000000, 0, 0, 0, 0],
      lazada: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      blibli: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bukalapak: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      lainnya: [5000000, 5000000, 5000000, 6000000, 6000000, 6000000, 7000000, 7000000, 0, 0, 0, 0]
    }
  });
});

app.listen(PORT, () => {
  console.log(`Omzet Gabungan Tracker running at http://localhost:${PORT}`);
});
