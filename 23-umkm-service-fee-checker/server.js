const express = require('express');
const path = require('path');

const app = express();
const PORT = 8023;

app.use(express.json());
app.use(express.static('public'));

// Marketplace list with default service fee rates (biaya layanan, % of omzet).
// Rates are editable in the UI - these are 2026 estimates, sellers should
// check their own seller center for exact rates.
const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', defaultRate: 2.0 },
  { id: 'tokopedia', name: 'Tokopedia', defaultRate: 1.5 },
  { id: 'lazada', name: 'Lazada', defaultRate: 1.0 },
  { id: 'bukalapak', name: 'Bukalapak', defaultRate: 1.0 },
  { id: 'blibli', name: 'Blibli', defaultRate: 1.0 },
  { id: 'tiktok', name: 'TikTok Shop', defaultRate: 2.0 }
];

// Policy status derived from the latest timeline (updated 2026-08-29).
// Kabar 28-29 Agustus 2026 (ANTARA): Kepmen diskon 50% biaya layanan untuk
// UMKM BELUM diteken. Alur pengajuan resmi diumumkan (via SAPA UMKM, verifikasi
// 2 tahap), target memasuki tahapan final pekan depan. Tanggal target resmi,
// bisa bergeser - status dihitung dari tanggal hari ini.
const POLICY = (() => {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const signedTarget = '2026-09-04';
  const effectiveTarget = '2026-09-30';
  if (today < signedTarget) {
    return {
      status: 'menunggu',
      label: 'Kepmen belum diteken, target tahapan final pekan depan',
      description: 'Kepmen diskon biaya layanan 50% untuk UMKM belum diteken. Alur pengajuan resmi sudah diumumkan (28-29 Agustus 2026): ajukan via SAPA UMKM, verifikasi 2 tahap (KemenUMKM lalu platform), standar produk (halal, BPOM) punya masa tenggang 6 bulan. Menteri UMKM menargetkan tahapan final pekan depan (pernyataan 28-29 Agustus 2026). Jadwal target, bisa berubah.',
      regulation: 'Permen Perlindungan dan Peningkatan Daya Saing UMKM (aturan turunan PP 7/2021)',
      key_date: signedTarget,
      key_desc: 'Target Kepmen diteken'
    };
  }
  if (today <= effectiveTarget) {
    return {
      status: 'diteken',
      label: 'Kepmen diteken, diskon mulai berlaku',
      description: 'Kepmen diskon biaya layanan 50% untuk UMKM diteken dan mulai berlaku akhir September 2026. Cek seller center masing-masing untuk tarif biaya layanan terbaru.',
      regulation: 'Permen Perlindungan dan Peningkatan Daya Saing UMKM (aturan turunan PP 7/2021)',
      key_date: effectiveTarget,
      key_desc: 'Diskon mulai berlaku'
    };
  }
  return {
    status: 'active',
    label: 'Diskon biaya layanan berlaku',
    description: 'Diskon 50% biaya layanan untuk pelaku usaha mikro dan kecil yang menjual produk lokal sudah berlaku. Marketplace wajib menerapkan diskon ini. Cek seller center untuk tarif terbaru.',
    regulation: 'Permen Perlindungan dan Peningkatan Daya Saing UMKM (aturan turunan PP 7/2021)',
    key_date: effectiveTarget,
    key_desc: 'Diskon mulai berlaku'
  };
})();

// Eligibility requirements from the regulation (final text, Permen UMKM 3/2026)
const REQUIREMENTS = [
  { id: 'scale', label: 'Skala usaha mikro atau kecil', detail: 'Diskon hanya untuk usaha mikro dan kecil, bukan menengah' },
  { id: 'nib', label: 'Punya NIB (Nomor Induk Berusaha)', detail: 'NIB wajib sebagai identitas usaha resmi' },
  { id: 'sapa', label: 'Terdaftar di SAPA UMKM', detail: 'Profil usaha terverifikasi dan terintegrasi ke sistem SAPA UMKM, pengajuan insentif lewat layanan ini' },
  { id: 'local', label: 'Menjual produk lokal', detail: 'Diskon khusus produk lokal, bukan produk impor' }
];

// Kategori yang TIDAK dapat insentif (pengecualian eksplisit di Permen UMKM 3/2026)
const EXCLUSIONS = [
  { id: 'pangan_siap_saji', label: 'Produk pangan olahan siap saji', detail: 'Insentif tidak berlaku untuk produk pangan olahan siap saji' },
  { id: 'elektronik_industri_besar', label: 'Produk elektronik dari industri besar dalam negeri', detail: 'Insentif tidak berlaku untuk produk elektronik yang diproduksi industri besar dalam negeri' }
];

app.get('/api/status', (req, res) => {
  res.json(POLICY);
});

app.get('/api/marketplaces', (req, res) => {
  res.json(MARKETPLACES);
});

// POST /api/check
// body: {
//   answers: { scale: 'mikro'|'kecil'|'menengah', nib: bool, sapa: bool, local: bool },
//   exclusions: { pangan_siap_saji: bool, elektronik_industri_besar: bool },
//   entries: [ { marketplace: 'shopee', omzet: number, rate: number } ]
// }
app.post('/api/check', (req, res) => {
  const { answers, exclusions, entries } = req.body || {};

  // Validate answers
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers wajib diisi' });
  }
  const scale = answers.scale;
  if (!['mikro', 'kecil', 'menengah'].includes(scale)) {
    return res.status(400).json({ error: 'skala usaha tidak valid' });
  }

  // Pengecualian kategori menang atas segalanya (eksplisit di Permen UMKM 3/2026)
  const activeExclusions = (EXCLUSIONS || []).filter(ex => exclusions && exclusions[ex.id]);

  // Determine eligibility
  const checks = {
    scale: { ok: scale === 'mikro' || scale === 'kecil', label: REQUIREMENTS[0].label, detail: REQUIREMENTS[0].detail },
    nib: { ok: !!answers.nib, label: REQUIREMENTS[1].label, detail: REQUIREMENTS[1].detail },
    sapa: { ok: !!answers.sapa, label: REQUIREMENTS[2].label, detail: REQUIREMENTS[2].detail },
    local: { ok: !!answers.local, label: REQUIREMENTS[3].label, detail: REQUIREMENTS[3].detail }
  };
  const eligible = activeExclusions.length === 0 && Object.values(checks).every(c => c.ok);

  // Calculate savings
  const breakdown = [];
  let totalFeeMonthly = 0;
  let totalSavingMonthly = 0;

  (entries || []).forEach(entry => {
    const mp = MARKETPLACES.find(m => m.id === entry.marketplace);
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

  const result = {
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
  };

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`UMKM Service Fee Checker running at http://localhost:${PORT}`);
});
