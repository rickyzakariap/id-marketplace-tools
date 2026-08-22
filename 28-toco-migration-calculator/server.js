// Toco Migration Calculator - bandingkan profit jualan di Toco (komisi 0%)
// vs marketplace lain. Node.js + Express, zero deps selain express.
//
// Sumber data biaya 2026:
// - Toco: katadata.co.id (20 Jun 2025), antaranews.com (4 Mar 2026),
//   dataloka.id (19 Jun 2026) - komisi seller 0%, pembeli bayar Rp2.000/transaksi
//   (masih digratiskan masa awal)
// - Shopee: metrotvnews.com "Biaya Admin Shopee 2026" (grup A-X),
//   biaya proses pesanan Rp1.250/transaksi (estimasi, duoke.com Jan 2026)
// - TikTok Shop: associe.co.id (8 Mei 2026) - tarif baru 18 Mei 2026, cap Rp650.000
// - Tokopedia/Lazada/Bukalapak/Blibli: struktur dari project #06 (2026)

const express = require('express');
const app = express();
const path = require('path');

const PORT = 8028;

// Tarif komisi per kategori (persen). Kategori: fashion, electronics, food,
// beauty, home, default. Struktur mengikuti project #06.
const MARKETPLACES = [
  {
    id: 'toco',
    name: 'Toco',
    commission: { fashion: 0, electronics: 0, food: 0, beauty: 0, home: 0, default: 0 },
    service: 0,
    payment: 0,
    fixed: 0,
    cap: null,
    note: 'Komisi seller 0% (klaim selamanya). Pembeli bayar biaya layanan Rp2.000/transaksi, masih digratiskan masa awal. Ongkir ditanggung pembeli/seller sesuai pengaturan.',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    groupMap: { fashion: 'A', electronics: 'B', food: 'A', beauty: 'B', home: 'A', default: 'B' },
    groups: {
      A: { label: 'A (Fashion, FMCG, Lifestyle)', rate: 10.0 },
      B: { label: 'B (Elektronik, Perawatan Kulit)', rate: 9.25 },
      C: { label: 'C (Susu Formula, Suplemen)', rate: 6.625 },
      D: { label: 'D (Elektronik High-End)', rate: 5.25 },
      E: { label: 'E (Logam Mulia, Perhiasan)', rate: 4.25 },
      X: { label: 'X (E-Money, Tiket)', rate: 2.5 },
    },
    service: 0,
    payment: 0,
    fixed: 1250,
    cap: null,
    note: 'Biaya admin per grup kategori (2026). Plus biaya proses pesanan Rp1.250/transaksi (estimasi).',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    commission: { fashion: 8.0, electronics: 3.0, food: 6.5, beauty: 7.0, home: 6.0, default: 6.0 },
    service: 0,
    payment: 0,
    fixed: 0,
    cap: 650000,
    note: 'Tarif komisi dinamis baru (18 Mei 2026), cap Rp650.000/item. Ada biaya retur hingga Rp10.000/kejadian sejak 1 Jun 2026.',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    commission: { fashion: 4.5, electronics: 3.5, food: 4.0, beauty: 4.5, home: 4.0, default: 4.0 },
    service: 0.5,
    payment: 1.5,
    fixed: 1000,
    cap: null,
    note: 'Komisi kategori + biaya layanan 0.5% + biaya pembayaran 1.5% + biaya admin tetap Rp1.000/transaksi.',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    commission: { fashion: 5.5, electronics: 3.5, food: 4.0, beauty: 5.5, home: 4.5, default: 4.5 },
    service: 0.5,
    payment: 1.8,
    fixed: 800,
    cap: null,
    note: 'Komisi kategori + biaya layanan 0.5% + biaya pembayaran 1.8% + biaya admin tetap Rp800/transaksi.',
  },
  {
    id: 'bukalapak',
    name: 'Bukalapak',
    commission: { fashion: 4.0, electronics: 3.0, food: 3.5, beauty: 4.0, home: 3.5, default: 3.5 },
    service: 0.5,
    payment: 1.5,
    fixed: 500,
    cap: null,
    note: 'Komisi kategori + biaya layanan 0.5% + biaya pembayaran 1.5% + biaya admin tetap Rp500/transaksi.',
  },
  {
    id: 'blibli',
    name: 'Blibli',
    commission: { fashion: 5.0, electronics: 3.0, food: 4.0, beauty: 5.0, home: 4.0, default: 4.0 },
    service: 0.5,
    payment: 1.5,
    fixed: 1000,
    cap: null,
    note: 'Komisi kategori + biaya layanan 0.5% + biaya pembayaran 1.5% + biaya admin tetap Rp1.000/transaksi.',
  },
];

const CATEGORIES = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'electronics', label: 'Elektronik' },
  { id: 'food', label: 'Makanan & Minuman' },
  { id: 'beauty', label: 'Kecantikan' },
  { id: 'home', label: 'Rumah Tangga' },
  { id: 'default', label: 'Lainnya' },
];

function calcMarketplace(mp, category, price, modal, volume) {
  let rate;
  let group = null;
  if (mp.groups) {
    const gid = mp.groupMap[category] || 'B';
    group = { id: gid, label: mp.groups[gid].label, rate: mp.groups[gid].rate };
    rate = group.rate;
  } else {
    rate = mp.commission[category] !== undefined ? mp.commission[category] : mp.commission.default;
  }

  let commission = (price * rate) / 100;
  if (mp.cap) commission = Math.min(commission, mp.cap);
  const service = (price * mp.service) / 100;
  const payment = (price * mp.payment) / 100;
  const fees = commission + service + payment + mp.fixed;

  const profitItem = price - modal - fees;
  const profitMonth = profitItem * volume;
  const margin = price > 0 ? (profitItem / price) * 100 : 0;

  return {
    id: mp.id,
    name: mp.name,
    rate,
    group,
    commission: Math.round(commission),
    service: Math.round(service),
    payment: Math.round(payment),
    fixed: mp.fixed,
    fees: Math.round(fees),
    profitItem: Math.round(profitItem),
    profitMonth: Math.round(profitMonth),
    margin: Math.round(margin * 10) / 10,
    note: mp.note,
  };
}

function calc(body) {
  const category = String(body.category || 'default');
  const price = Number(body.price);
  const modal = Number(body.modal) || 0;
  const volume = Math.max(1, Math.floor(Number(body.volume) || 1));
  const currentId = String(body.current_marketplace || 'shopee');

  if (!price || price <= 0) return { error: 'Harga harus lebih dari 0' };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: 'Kategori tidak valid' };

  const rows = MARKETPLACES.map((mp) => calcMarketplace(mp, category, price, modal, volume));
  rows.sort((a, b) => b.profitMonth - a.profitMonth);

  const toco = rows.find((r) => r.id === 'toco');
  const current = rows.find((r) => r.id === currentId);

  // Break-even: berapa unit di Toco agar profit bulanan sama dengan marketplace sekarang
  let breakeven = null;
  if (toco && current && toco.profitItem > 0) {
    const units = current.profitMonth / toco.profitItem;
    breakeven = {
      units: Math.ceil(units),
      pctOfCurrent: current.profitMonth > 0 ? Math.round((units / volume) * 100) : 0,
    };
  }

  return { category, price, modal, volume, currentId, rows, toco, current, breakeven };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/calc', (req, res) => {
  const result = calc(req.body || {});
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.get('/api/meta', (req, res) => {
  res.json({
    marketplaces: MARKETPLACES.map((m) => ({ id: m.id, name: m.name })),
    categories: CATEGORIES,
  });
});

app.listen(PORT, () => {
  console.log('Toco Migration Calculator running on http://localhost:' + PORT);
});
