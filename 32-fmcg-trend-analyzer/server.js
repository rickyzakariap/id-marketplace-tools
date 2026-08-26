const express = require('express');
const path = require('path');

const app = express();
const PORT = 8032;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data: Compas.co.id FMCG E-commerce Market Insight Semester 1 2026
// Rilis 25 Agu 2026, diliput youngster.id 26 Agu 2026, gizmologi.id 25 Agu 2026,
// katadata.co.id, indotelko.com 18 Agu 2026.
// Periode data: Januari - Juni 2026, dibandingkan H1 2025.
const REPORT = {
  title: 'FMCG E-commerce Market Insight Semester 1 2026',
  source: 'Compas.co.id',
  published: '2026-08-25',
  period: 'Januari - Juni 2026 (YoY vs H1 2025)',
  total_gmv: 88400000000000,
  total_growth_pct: 29.4,
  platform_note:
    'Shopee dan TikTok ShopTokopedia bersama-sama menguasai 99% penjualan FMCG di setiap kategori yang dipantau. Kedua platform punya pola pertumbuhan berbeda: Official Store TikTok agresif di Beauty, Food & Beverages, Healthcare, dan Mom & Baby, sedangkan Shopee mendominasi Homecare.',
  strategy_note:
    'Brand tidak bisa menggunakan strategi yang sama di kedua platform. Pasar sudah terkonsolidasi ke dua platform, tapi keduanya harus diperlakukan berbeda.',
  seasonality_note:
    'Ramadan dan Lebaran (Q1 2026) menjadi momentum permintaan tertinggi, pola yang sama terlihat tahun-tahun sebelumnya. Periode ini kunci untuk menyesuaikan produk dan promosi.',
  caveat:
    'Laporan memantau 5 kategori FMCG. Nilai rupiah per kategori tidak dipublikasikan, hanya pertumbuhan nilai dan volume. Angka proyeksi di kalkulator adalah estimasi matematis, bukan prediksi.',
  categories: [
    {
      id: 'homecare',
      name: 'Homecare',
      value_growth: 78.3,
      volume_growth: 42.0,
      leader: 'Shopee',
      leader_share: 69,
      leader_share_delta: 8,
      platform_note:
        'Shopee mendominasi dengan pangsa 69%, naik 8 poin persentase hanya dalam satu semester. Homecare satu-satunya kategori yang tidak dikuasai Official Store TikTok.',
      movers: [
        { product: 'Insektisida', growth: 162 }
      ]
    },
    {
      id: 'food',
      name: 'Food & Beverages',
      value_growth: 52.1,
      volume_growth: 33.0,
      leader: 'TikTok ShopTokopedia',
      leader_share: null,
      leader_share_delta: 0,
      platform_note:
        'Official Store TikTok ShopTokopedia tumbuh agresif di kategori ini. Nilai penjualan naik 52,1% dengan volume 33%.',
      movers: [
        { product: 'Mineral Water', growth: 219 },
        { product: 'Cooking Oil', growth: 123 },
        { product: 'Candy', growth: 121 }
      ]
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      value_growth: 24.4,
      volume_growth: 20.0,
      leader: 'TikTok ShopTokopedia',
      leader_share: null,
      leader_share_delta: 0,
      platform_note:
        'Official Store TikTok ShopTokopedia tumbuh agresif. Pertumbuhan nilai 24,4% sejalan dengan volume 20%.',
      movers: [
        { product: 'Eye Care', growth: 91 }
      ]
    },
    {
      id: 'beauty',
      name: 'Beauty & Care',
      value_growth: 20.8,
      volume_growth: 12.8,
      leader: 'TikTok ShopTokopedia',
      leader_share: null,
      leader_share_delta: 0,
      platform_note:
        'Official Store TikTok ShopTokopedia tumbuh agresif. Nilai naik 20,8%, volume naik 12,8%.',
      movers: [
        { product: 'Nail Polish', growth: 119 }
      ]
    },
    {
      id: 'mom',
      name: 'Mom & Baby',
      value_growth: 18.7,
      volume_growth: 3.6,
      leader: 'TikTok ShopTokopedia',
      leader_share: null,
      leader_share_delta: 0,
      platform_note:
        'Pertumbuhan paling moderat di antara 5 kategori: nilai naik 18,7%, volume hanya 3,6%. Volume nyaris datar artinya kenaikan nilai lebih banyak dari harga, bukan jumlah barang.',
      movers: []
    }
  ],
  movers: [
    { category: 'Food & Beverages', product: 'Mineral Water', growth: 219 },
    { category: 'Homecare', product: 'Insektisida', growth: 162 },
    { category: 'Food & Beverages', product: 'Cooking Oil', growth: 123 },
    { category: 'Food & Beverages', product: 'Candy', growth: 121 },
    { category: 'Beauty & Care', product: 'Nail Polish', growth: 119 },
    { category: 'Healthcare', product: 'Eye Care', growth: 91 }
  ],
  sources: [
    'Compas.co.id: FMCG E-commerce Market Insight Semester 1 2026 (rilis 25 Agu 2026)',
    'youngster.id: Belanja Kebutuhan Sehari-hari Makin Online, Transaksi FMCG Tembus Rp88,4 Triliun (26 Agu 2026)',
    'Gizmologi.id: Pasar FMCG E-commerce Indonesia Tumbuh Rp88,4 Triliun, Dikuasai Dua Pemain Utama (25 Agu 2026)',
    'Katadata.co.id: Belanja Kebutuhan Harian Makin Pindah ke E-commerce, Transaksi Rp 88 Triliun',
    'indotelko.com: FMCG eCommerce tembus Rp88,4 triliun hingga semester I 2026 (18 Agu 2026)'
  ]
};

app.get('/api/meta', (req, res) => {
  res.json({
    title: REPORT.title,
    source: REPORT.source,
    published: REPORT.published,
    period: REPORT.period,
    total_gmv: REPORT.total_gmv,
    total_growth_pct: REPORT.total_growth_pct,
    platform_note: REPORT.platform_note,
    strategy_note: REPORT.strategy_note,
    seasonality_note: REPORT.seasonality_note,
    caveat: REPORT.caveat,
    sources: REPORT.sources
  });
});

app.get('/api/categories', (req, res) => {
  res.json(REPORT.categories.map((c) => ({
    id: c.id,
    name: c.name,
    value_growth: c.value_growth,
    volume_growth: c.volume_growth,
    leader: c.leader,
    leader_share: c.leader_share,
    leader_share_delta: c.leader_share_delta
  })));
});

app.get('/api/categories/:id', (req, res) => {
  const cat = REPORT.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
  res.json(cat);
});

app.get('/api/movers', (req, res) => {
  res.json(REPORT.movers);
});

// Kalkulator keep-pace: berapa penjualan minimal agar pangsa pasar tidak menyusut.
// Jika pasar kategori tumbuh X% per tahun dan seller hanya tumbuh Y%,
// pangsa seller turun. Target keep-pace = penjualan bulanan * (1 + X/100).
app.post('/api/keep-pace', (req, res) => {
  const body = req.body || {};
  const categoryId = String(body.category || '');
  const monthlySales = Number(body.monthly_sales || 0);
  const plannedGrowth = Number(body.planned_growth || 0);

  const cat = REPORT.categories.find((c) => c.id === categoryId);
  if (!cat) return res.status(400).json({ error: 'Pilih kategori terlebih dahulu' });
  if (!Number.isFinite(monthlySales) || monthlySales <= 0) {
    return res.status(400).json({ error: 'Penjualan bulanan harus lebih dari 0' });
  }
  if (!Number.isFinite(plannedGrowth) || plannedGrowth < -100) {
    return res.status(400).json({ error: 'Pertumbuhan rencana tidak valid' });
  }

  const marketGrowth = cat.value_growth; // % per tahun (YoY)
  const keepPaceTarget = monthlySales * (1 + marketGrowth / 100);
  const yourProjection = monthlySales * (1 + plannedGrowth / 100);

  let verdict;
  if (plannedGrowth >= marketGrowth + 10) {
    verdict = 'atas';
  } else if (plannedGrowth >= marketGrowth - 10) {
    verdict = 'sejalan';
  } else {
    verdict = 'bawah';
  }

  res.json({
    category: cat.name,
    market_growth_pct: marketGrowth,
    monthly_sales: monthlySales,
    planned_growth_pct: plannedGrowth,
    keep_pace_target: Math.round(keepPaceTarget),
    your_projection: Math.round(yourProjection),
    gap: Math.round(keepPaceTarget - yourProjection),
    verdict,
    note:
      verdict === 'atas'
        ? `Pertumbuhan kamu (${plannedGrowth}%) di atas pasar (${marketGrowth}%), pangsa pasar naik.`
        : verdict === 'sejalan'
          ? `Pertumbuhan kamu (${plannedGrowth}%) sejalan dengan pasar (${marketGrowth}%), pangsa relatif stabil.`
          : `Pasar tumbuh ${marketGrowth}% tapi kamu hanya ${plannedGrowth}%. Pangsa pasar menyusut. Target keep-pace ${formatRp(keepPaceTarget)}/bulan dalam 12 bulan ke depan.`
  });
});

function formatRp(value) {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('FMCG Trend Analyzer running on http://localhost:' + PORT);
});
