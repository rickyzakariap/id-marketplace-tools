const express = require('express');
const path = require('path');

const app = express();
const PORT = 8023;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const EFFECTIVE_DATE = '2026-10-25';
const POLICY_SOURCE =
  'ANTARA 16-17 Oktober 2026, Bisnis.com 17 Oktober 2026, Kompas.com 7 Oktober 2026, Kepmen UMKM 398/2026, Permen UMKM 3/2026';

// Marketplace list with default service fee rates (biaya layanan, % of omzet).
// The regulation defines biaya layanan as admin fee + commission + app fee,
// reported at roughly 10-18%. These per-marketplace numbers are 2026 estimates
// and are editable in the UI. Sellers should check their own seller center.
const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', defaultRate: 12.0 },
  { id: 'tiktok', name: 'TikTok Shop', defaultRate: 10.0 },
  { id: 'tokopedia', name: 'Tokopedia', defaultRate: 8.0 },
  { id: 'lazada', name: 'Lazada', defaultRate: 8.0 },
  { id: 'blibli', name: 'Blibli', defaultRate: 6.0 },
  { id: 'bukalapak', name: 'Bukalapak', defaultRate: 5.0 }
];

const REQUIREMENTS = [
  { id: 'scale', label: 'Skala usaha mikro atau kecil', detail: 'Diskon hanya untuk usaha mikro dan kecil, bukan menengah atau besar' },
  { id: 'nib', label: 'Punya NIB (Nomor Induk Berusaha)', detail: 'NIB wajib sebagai identitas usaha resmi' },
  { id: 'sapa', label: 'Terdaftar di SAPA UMKM', detail: 'Pengajuan insentif dilakukan lewat SAPA UMKM' },
  { id: 'local', label: 'Hanya menjual produk dalam negeri', detail: 'Diskon khusus produk lokal, bukan produk impor' },
  { id: 'bukan_high_risk', label: 'Tidak memanipulasi transaksi dan rekam jejak usaha baik', detail: 'Seller tidak menyalahgunakan fasilitas platform dan tidak termasuk pengguna berisiko tinggi' }
];

const EXCLUSIONS = [
  { id: 'pangan_siap_saji', label: 'Produk pangan olahan siap saji', detail: 'Insentif tidak berlaku untuk produk pangan olahan siap saji' },
  { id: 'elektronik_industri_besar', label: 'Produk elektronik dari industri besar dalam negeri', detail: 'Insentif tidak berlaku untuk produk elektronik yang diproduksi industri besar dalam negeri' }
];

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIDDate(d) {
  return d.getDate() + ' ' + ID_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function daysUntilEffective(now) {
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const effectiveUtc = Date.UTC(2026, 9, 25);
  return Math.round((effectiveUtc - todayUtc) / 86400000);
}

// Policy status is date-aware. The Ministry confirmed on 16-17 October 2026
// that the incentive takes effect on 25 October 2026 under Kepmen UMKM 398/2026.
function buildPolicy(now = new Date()) {
  const daysLeft = daysUntilEffective(now);
  const active = daysLeft <= 0;
  const common = {
    status: active ? 'aktif' : 'terjadwal',
    label: active
      ? 'Diskon 50% biaya layanan sudah berlaku sejak 25 Oktober 2026'
      : 'Diskon 50% biaya layanan resmi berlaku 25 Oktober 2026',
    effective_date: EFFECTIVE_DATE,
    days_left: Math.max(0, daysLeft),
    regulation: 'Permen UMKM 3/2026 dan Kepmen UMKM 398/2026',
    verification_days: 10,
    grant_days: 5,
    source: POLICY_SOURCE,
    key_date: EFFECTIVE_DATE,
    key_desc: 'Diskon mulai berlaku'
  };

  const body =
    ' Marketplace wajib memberi potongan minimal 50% atas biaya administrasi, komisi, atau biaya aplikasi dasar. ' +
    'Ajukan lewat SAPA UMKM dengan nama platform, identitas merchant, dan daftar SKU. ' +
    'Platform memverifikasi maksimal 10 hari kalender, lalu insentif diberikan paling lambat 5 hari setelah dua tahap verifikasi lolos. ' +
    'Insentif tidak berlaku untuk komponen biaya lain.';

  if (active) {
    return Object.assign(common, {
      description:
        'Insentif potongan biaya layanan minimal 50% untuk UMK yang hanya menjual produk dalam negeri sudah berlaku sejak 25 Oktober 2026 (Kepmen UMKM 398/2026).' +
        body +
        ' Cek seller center untuk memastikan potongan benar-benar diterapkan pada transaksi produk dalam negeri.'
    });
  }

  return Object.assign(common, {
    description:
      'Kementerian UMKM memastikan insentif potongan biaya layanan minimal 50% untuk UMK yang hanya menjual produk dalam negeri berlaku efektif 25 Oktober 2026 (Kepmen UMKM 398/2026). ' +
      'Per ' + formatIDDate(now) + ', tinggal ' + Math.max(0, daysLeft) + ' hari menuju tanggal berlaku.' +
      body +
      ' Siapkan pengajuan sekarang agar insentif masuk sejak hari pertama.'
  });
}

function checkEligibility(body) {
  const answers = (body && body.answers) || {};
  const exclusions = (body && body.exclusions) || {};
  const entries = (body && body.entries) || [];

  if (!answers || typeof answers !== 'object') {
    return { status: 400, body: { error: 'answers wajib diisi' } };
  }
  const scale = answers.scale;
  if (!['mikro', 'kecil', 'menengah', 'besar'].includes(scale)) {
    return { status: 400, body: { error: 'skala usaha tidak valid' } };
  }

  const activeExclusions = EXCLUSIONS.filter((ex) => exclusions[ex.id]);

  const checks = {
    scale: {
      ok: scale === 'mikro' || scale === 'kecil',
      label: REQUIREMENTS[0].label,
      detail: REQUIREMENTS[0].detail
    },
    nib: { ok: !!answers.nib, label: REQUIREMENTS[1].label, detail: REQUIREMENTS[1].detail },
    sapa: { ok: !!answers.sapa, label: REQUIREMENTS[2].label, detail: REQUIREMENTS[2].detail },
    local: { ok: !!answers.local, label: REQUIREMENTS[3].label, detail: REQUIREMENTS[3].detail },
    bukan_high_risk: {
      ok: !!answers.bukan_high_risk,
      label: REQUIREMENTS[4].label,
      detail: REQUIREMENTS[4].detail
    }
  };
  const eligible = activeExclusions.length === 0 && Object.values(checks).every((c) => c.ok);

  const breakdown = [];
  let totalFeeMonthly = 0;
  let totalSavingMonthly = 0;

  entries.forEach((entry) => {
    const mp = MARKETPLACES.find((m) => m.id === entry.marketplace);
    if (!mp) return;
    const omzet = Math.max(0, Number(entry.omzet) || 0);
    const rate = Math.max(0, Math.min(50, Number(entry.rate) || 0));
    if (omzet <= 0) return;

    const feeMonthly = omzet * (rate / 100);
    const savingMonthly = eligible ? feeMonthly * 0.5 : 0;
    totalFeeMonthly += feeMonthly;
    totalSavingMonthly += savingMonthly;

    breakdown.push({
      marketplace: mp.name,
      omzetMonthly: omzet,
      rate,
      feeMonthly,
      savingMonthly,
      feeAfterDiscount: eligible ? feeMonthly * 0.5 : feeMonthly
    });
  });

  return {
    status: 200,
    body: {
      eligible,
      checks,
      exclusions: activeExclusions,
      summary: {
        feeMonthlyTotal: totalFeeMonthly,
        savingMonthly: totalSavingMonthly,
        savingAnnual: totalSavingMonthly * 12,
        feeAfterDiscountMonthly: eligible ? totalFeeMonthly * 0.5 : totalFeeMonthly,
        effectiveRateAfterDiscount: eligible ? 0.5 : 1.0
      },
      breakdown
    }
  };
}

app.get('/api/status', (req, res) => {
  res.json(buildPolicy());
});

app.get('/api/marketplaces', (req, res) => {
  res.json(MARKETPLACES);
});

app.post('/api/check', (req, res) => {
  const result = checkEligibility(req.body || {});
  res.status(result.status).json(result.body);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('UMKM Service Fee Checker running at http://localhost:' + PORT);
  });
}

module.exports = {
  app,
  buildPolicy,
  checkEligibility,
  formatIDDate,
  MARKETPLACES,
  REQUIREMENTS,
  EXCLUSIONS,
  EFFECTIVE_DATE,
  POLICY_SOURCE
};
