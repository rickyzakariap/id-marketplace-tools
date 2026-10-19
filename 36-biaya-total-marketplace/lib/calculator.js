// Core calculation for "Biaya Total Marketplace" (all-in seller cost stack).
// Zero dependencies so it can be unit-tested without Express.

const MARKETPLACES = [
  {
    id: 'shopee',
    name: 'Shopee',
    adminPct: 10,
    note: 'Biaya admin kategori FMCG tertinggi sekitar 10% dari harga jual (Bisnis, Januari 2026). Tarif beda per kategori.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    adminPct: 8,
    note: 'Komisi dinamis kategori pakaian sekitar 8%, batas maksimum Rp 650.000/item (Bisnis, 18 Mei 2026).',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    adminPct: 6.5,
    note: 'Estimasi komisi/biaya admin Tokopedia 2026. Cek seller center untuk tarif kategori kamu.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    adminPct: 5,
    note: 'Estimasi. Cek seller center untuk tarif kategori kamu.',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    adminPct: 5,
    note: 'Estimasi. Cek seller center untuk tarif kategori kamu.',
  },
  {
    id: 'bukalapak',
    name: 'Bukalapak',
    adminPct: 4,
    note: 'Estimasi. Cek seller center untuk tarif kategori kamu.',
  },
];

// Default komponen biaya berlapis, semua berasal dari laporan 2026 (lihat SOURCES).
const DEFAULTS = {
  biaya_proses_rp: 1250, // biaya proses pesanan per transaksi (Rp 1.250)
  retur_fee_rp: 10000,   // kontribusi ongkir retur seller, maks 2 x Rp 5.000
};

const SOURCES = [
  { label: 'Biaya bisa tembus 30% dari harga jual', source: 'Katadata, 13 & 20 Mei 2026' },
  { label: 'Biaya proses pesanan Rp 1.250/transaksi', source: 'Katadata & kuitansi seller, Mei 2026' },
  { label: 'TikTok komisi dinamis cap Rp 650.000/item', source: 'Bisnis, 18 Mei 2026' },
  { label: 'TikTok layanan logistik Rp 690-Rp 5.060', source: 'Bisnis & CNN Indonesia, Mei 2026' },
  { label: 'Retur seller maks 2 x Rp 5.000', source: 'Bisnis, 1 Juni 2026' },
  { label: 'Komisi afiliasi 5-20%', source: 'MarketplaceTactics, 2026' },
  { label: 'Pembelian iklan kena PPN 11%', source: 'Validnews, 26 Mei 2026' },
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

function getMarketplace(id) {
  return MARKETPLACES.find((m) => m.id === id) || MARKETPLACES[0];
}

function calculate(input) {
  const market = getMarketplace(input.marketplace);

  const hpp = toNumber(input.hpp);
  const harga = toNumber(input.harga_jual);
  const qty = Math.max(1, Math.floor(toNumber(input.qty, 1)));

  if (hpp <= 0 || harga <= 0) {
    return { error: 'HPP dan harga jual harus lebih dari 0' };
  }

  const komisiPct = input.komisi_admin_pct === '' || input.komisi_admin_pct === undefined
    ? market.adminPct
    : Math.max(0, toNumber(input.komisi_admin_pct));
  const ongkirPct = Math.max(0, toNumber(input.gratis_ongkir_pct));
  const iklanPct = Math.max(0, toNumber(input.iklan_pct));
  const affiliatePct = Math.max(0, toNumber(input.affiliate_pct));
  const returPct = Math.min(100, Math.max(0, toNumber(input.retur_pct)));
  const targetMarginPct = Math.max(0, toNumber(input.target_margin_pct, 20));

  const prosesRp = input.biaya_proses_rp === '' || input.biaya_proses_rp === undefined
    ? DEFAULTS.biaya_proses_rp
    : Math.max(0, toNumber(input.biaya_proses_rp));
  const logistikRp = Math.max(0, toNumber(input.layanan_logistik_rp));
  const kemasanRp = Math.max(0, toNumber(input.kemasan_rp));
  const returFeeRp = input.retur_fee_rp === '' || input.retur_fee_rp === undefined
    ? DEFAULTS.retur_fee_rp
    : Math.max(0, toNumber(input.retur_fee_rp));

  const revenue = harga * qty;

  const komisi = revenue * (komisiPct / 100);
  const ongkir = revenue * (ongkirPct / 100);
  const iklan = revenue * (iklanPct / 100);
  const affiliate = revenue * (affiliatePct / 100);
  const proses = prosesRp;
  const logistik = logistikRp * qty;
  const kemasan = kemasanRp * qty;
  const retur = (returPct / 100) * returFeeRp * qty;

  const totalCost = komisi + ongkir + iklan + affiliate + proses + logistik + kemasan + retur;
  const hppTotal = hpp * qty;
  const profit = revenue - totalCost - hppTotal;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const totalCostPct = revenue > 0 ? (totalCost / revenue) * 100 : 0;

  let verdict = 'sehat';
  let verdictLabel = 'Margin sehat';
  let verdictDetail = 'Margin bersih masih di atas target setelah semua biaya berlapis.';
  if (profit < 0) {
    verdict = 'rugi';
    verdictLabel = 'Rugi per transaksi';
    verdictDetail = 'Total biaya berlapis + HPP melebihi harga jual. Setiap penjualan menggerus modal.';
  } else if (marginPct < targetMarginPct) {
    verdict = 'tipis';
    verdictLabel = 'Margin di bawah target';
    verdictDetail = 'Masih untung, tapi margin bersih di bawah target. Naikkan harga jual atau kurangi komponen biaya.';
  }

  // Harga jual minimum agar margin target tercapai.
  // profit >= target * P*qty
  // P*qty*(1 - variablePct - target) >= proses + qty*(hpp + logistik + kemasan + returPerItem)
  const variablePct = (komisiPct + ongkirPct + iklanPct + affiliatePct) / 100;
  const returPerItem = (returPct / 100) * returFeeRp;
  const fixedPerItem = hpp + logistikRp + kemasanRp + returPerItem;
  const denom = 1 - variablePct - targetMarginPct / 100;
  let targetPrice = null;
  let targetPriceNote = '';
  if (denom > 0) {
    targetPrice = (prosesRp / qty + fixedPerItem) / denom;
    if (targetPrice > harga) {
      targetPriceNote = 'Naikkan harga jual minimal ke angka ini agar margin target tercapai.';
    } else {
      targetPriceNote = 'Harga jual sekarang sudah cukup untuk mencapai margin target.';
    }
  } else {
    targetPriceNote = 'Total biaya persen + target margin sudah 100% atau lebih. Tidak ada harga jual yang bisa memenuhi target.';
  }

  const breakdown = [
    { id: 'komisi', label: 'Komisi / admin', amount: roundRp(komisi), pct: percent((komisi / revenue) * 100) },
    { id: 'ongkir', label: 'Program gratis ongkir', amount: roundRp(ongkir), pct: percent((ongkir / revenue) * 100) },
    { id: 'iklan', label: 'Iklan / ads', amount: roundRp(iklan), pct: percent((iklan / revenue) * 100) },
    { id: 'affiliate', label: 'Komisi afiliasi', amount: roundRp(affiliate), pct: percent((affiliate / revenue) * 100) },
    { id: 'proses', label: 'Biaya proses pesanan', amount: roundRp(proses), pct: percent((proses / revenue) * 100) },
    { id: 'logistik', label: 'Biaya layanan logistik', amount: roundRp(logistik), pct: percent((logistik / revenue) * 100) },
    { id: 'kemasan', label: 'Kemasan', amount: roundRp(kemasan), pct: percent((kemasan / revenue) * 100) },
    { id: 'retur', label: 'Estimasi biaya retur', amount: roundRp(retur), pct: percent((retur / revenue) * 100) },
  ].filter((b) => b.amount > 0);

  return {
    marketplace: market.name,
    marketplace_note: market.note,
    revenue: roundRp(revenue),
    hpp_total: roundRp(hppTotal),
    total_cost: roundRp(totalCost),
    total_cost_pct: percent(totalCostPct),
    profit: roundRp(profit),
    margin_pct: percent(marginPct),
    verdict,
    verdict_label: verdictLabel,
    verdict_detail: verdictDetail,
    warning_30: totalCostPct >= 30,
    breakdown,
    target_price: targetPrice !== null ? roundRp(targetPrice) : null,
    target_price_note: targetPriceNote,
    inputs: {
      hpp: roundRp(hpp),
      harga_jual: roundRp(harga),
      qty,
      komisi_admin_pct: percent(komisiPct),
      gratis_ongkir_pct: percent(ongkirPct),
      iklan_pct: percent(iklanPct),
      affiliate_pct: percent(affiliatePct),
      retur_pct: percent(returPct),
      target_margin_pct: percent(targetMarginPct),
      biaya_proses_rp: roundRp(prosesRp),
      layanan_logistik_rp: roundRp(logistikRp),
      kemasan_rp: roundRp(kemasanRp),
      retur_fee_rp: roundRp(returFeeRp),
    },
  };
}

module.exports = { calculate, MARKETPLACES, DEFAULTS, SOURCES, getMarketplace };
