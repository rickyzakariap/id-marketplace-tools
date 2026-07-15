const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Sentiment keywords
const POSITIVE = new Set(['bagus','baik','puas','suka','recommended','rekomen','cepat','ramah','sesuai','original','asli','mantap','keren','top','oke','ok','sempurna','rapi','aman','nyaman','berkualitas','worth','mantul','joss','terbaik','memuaskan','tepat','responsif','sigap','bersih','wangi','enak','pas','cocok','sreg','terima kasih','makasih','thx','thanks','good','excellent','great','amazing','perfect','love','best','fast','quality','reliable','awesome','nice','happy','satisfied','recommend','smooth','easy']);
const NEGATIVE = new Set(['jelek','rusak','cacat','lambat','lama','kecewa','tipu','penipu','scam','palsu','kw','tiruan','bau','kotor','sobek','pecah','retak','tidak sesuai','ga sesuai','gak sesuai','beda','parah','buruk','zonk','rugi','mengecewakan','komplain','refund','return','hilang','salah','lamban','lemot','error','bad','terrible','broken','damaged','slow','fake','disappointed','waste','trash','poor','useless']);
const NEGATORS = new Set(['tidak','tdk','ga','gak','gk','nggak','bukan','belum','not','no','never']);
const THEMES = {
  'Shipping': ['pengiriman','kirim','kurir','ekspedisi','jne','jnt','sicepat','anteraja','shipping','delivery','courier','package','tracking','resi','sampai','tiba','cepat','lambat','lama','express'],
  'Product Quality': ['kualitas','bagus','jelek','rusak','cacat','berkualitas','material','bahan','awet','tahan','kuat','quality','durable','asli','original','palsu','kw','fake','sempurna','defect'],
  'Packaging': ['kemasan','packing','pack','bubble','wrap','dus','box','packaging','aman','safe','rapi','sobek'],
  'Price': ['harga','mahal','murah','diskon','promo','cashback','price','expensive','cheap','worth','value','budget'],
  'Customer Service': ['seller','toko','admin','cs','chat','balas','ramah','sopan','lambat','service','support','response','helpful','komplain','solusi'],
  'Size/Fit': ['ukuran','size','kecil','besar','pas','sesuai','muat','longgar','sempit','ketat','fit','kegedean','kekecilan'],
};

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function analyzeOne(text, rating) {
  const norm = normalize(text);
  const words = new Set(norm.split(' '));
  const pos = [], neg = [];

  for (const w of POSITIVE) if (norm.includes(w)) pos.push(w);
  for (const w of NEGATIVE) if (norm.includes(w)) neg.push(w);

  let hasNegation = false;
  for (const n of NEGATORS) if (words.has(n)) { hasNegation = true; break; }

  let score;
  if (pos.length + neg.length === 0) score = 0;
  else score = (pos.length - neg.length) / (pos.length + neg.length);

  if (rating != null) {
    score = score * 0.6 + ((rating - 3) / 2) * 0.4;
  }
  if (hasNegation && score > 0) score = -score * 0.7;

  const sentiment = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';

  const themes = [];
  for (const [name, kws] of Object.entries(THEMES)) {
    for (const kw of kws) {
      if (norm.includes(kw)) { themes.push(name); break; }
    }
  }

  return { sentiment, score: Math.round(score * 1000) / 1000, positiveWords: pos, negativeWords: neg, themes, hasNegation };
}

function generateInsights(ts, pos, neg) {
  const ins = [];
  const ship = ts['Shipping'] || { pos: 0, neg: 0, total: 0 };
  if (ship.total > 0 && ship.neg / ship.total > 0.4) ins.push('Pengiriman jadi masalah. Coba ganti ekspedisi.');
  const qual = ts['Product Quality'] || { pos: 0, neg: 0, total: 0 };
  if (qual.total > 0 && qual.neg / qual.total > 0.4) ins.push('Komplain kualitas tinggi. Cek foto dan deskripsi produk.');
  const pack = ts['Packaging'] || { pos: 0, neg: 0, total: 0 };
  if (pack.total > 0 && pack.neg / pack.total > 0.4) ins.push('Kemasan perlu diperbaiki.');
  const price = ts['Price'] || { pos: 0, neg: 0, total: 0 };
  if (price.total > 0 && price.pos / price.total > 0.6) ins.push('Persepsi harga positif. Bisa naikkan harga sedikit.');
  const cs = ts['Customer Service'] || { pos: 0, neg: 0, total: 0 };
  if (cs.total > 0 && cs.neg / cs.total > 0.4) ins.push('CS perlu perbaikan. Percepat waktu respon.');
  if (neg > pos) ins.push('Sentimen keseluruhan negatif. Segera review produk.');
  if (ins.length === 0) ins.push('Tidak ada masalah kritis. Tetap pantau review.');
  return ins;
}

// Analyze endpoint
app.post('/api/analyze', (req, res) => {
  const { reviews, marketplace, product, url } = req.body;
  if (!reviews?.length) return res.status(400).json({ error: 'reviews required' });

  const results = reviews.map(r => {
    const text = typeof r === 'string' ? r : r.text;
    const rating = typeof r === 'string' ? null : (r.rating || null);
    const result = analyzeOne(text, rating);
    return { text, rating, ...result };
  });

  const total = results.length;
  const pos = results.filter(r => r.sentiment === 'positive').length;
  const neg = results.filter(r => r.sentiment === 'negative').length;
  const neu = total - pos - neg;
  const avgScore = results.reduce((s, r) => s + r.score, 0) / total;

  const ts = {};
  const tc = {};
  for (const r of results) {
    for (const t of r.themes) {
      if (!ts[t]) ts[t] = { pos: 0, neg: 0, total: 0 };
      ts[t].total++;
      if (r.sentiment === 'positive') ts[t].pos++;
      if (r.sentiment === 'negative') ts[t].neg++;
      tc[t] = (tc[t] || 0) + 1;
    }
  }

  const themes = Object.entries(tc)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const ratio = ts[name].total > 0 ? ts[name].pos / ts[name].total : 0;
      return { name, count, status: ratio > 0.6 ? 'positive' : ratio < 0.4 ? 'negative' : 'neutral' };
    });

  const insights = generateInsights(ts, pos, neg);

  res.json({ total, pos, neg, neu, avgScore, themes, insights, results });
});

// Save to Supabase (with dedup)
app.post('/api/save', async (req, res) => {
  const { marketplace, product, url, reviews, stats } = req.body;

  try {
    // Check for existing reviews from this product
    const { data: existing } = await supabase
      .from('reviews')
      .select('review_text')
      .eq('product_url', url || '');

    const existingTexts = new Set((existing || []).map(r => r.review_text));

    // Filter out duplicates
    const newReviews = reviews.filter(r => !existingTexts.has(r.text));

    if (newReviews.length === 0) {
      return res.json({ success: true, count: 0, skipped: reviews.length, message: 'Semua review sudah ada di database' });
    }

    const rows = newReviews.map(r => ({
      marketplace,
      product_name: product?.name || '',
      product_url: url || '',
      review_text: r.text,
      rating: r.rating,
      sentiment: r.sentiment,
      score: r.score,
      themes: r.themes || [],
      positive_words: r.positiveWords || [],
      negative_words: r.negativeWords || [],
      scraped_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('reviews')
      .insert(rows)
      .select();

    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, skipped: reviews.length - newReviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save products (search results) to Supabase
app.post('/api/save-products', async (req, res) => {
  const { products, query } = req.body;
  if (!products?.length) return res.status(400).json({ error: 'products required' });

  try {
    const rows = products.map(p => ({
      product_name: p.name || '',
      price: p.price || '',
      sales: p.sales || '',
      shop: p.shop || '',
      location: p.location || '',
      product_url: p.url || '',
      search_query: query || '',
      scraped_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from('products').insert(rows).select();
    if (error) throw error;
    res.json({ success: true, count: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export to Google Sheets (via Sheets API)
app.post('/api/sheets', async (req, res) => {
  const { headers, rows, title } = req.body;
  if (!headers?.length || !rows?.length) return res.status(400).json({ error: 'headers and rows required' });

  const sheetsKey = process.env.GOOGLE_SHEETS_KEY;
  const sheetsId = process.env.GOOGLE_SHEETS_ID;

  if (!sheetsKey || !sheetsId) {
    return res.status(501).json({ error: 'Google Sheets not configured. Set GOOGLE_SHEETS_KEY and GOOGLE_SHEETS_ID in .env' });
  }

  try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(sheetsKey),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Create new tab
    const tabName = title || `Export ${new Date().toISOString().slice(0,16)}`;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetsId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    }).catch(() => {}); // ignore if tab exists

    // Write data
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetsId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers, ...rows] },
    });

    const url = `https://docs.google.com/spreadsheets/d/${sheetsId}/edit#gid=0`;
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3458;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
