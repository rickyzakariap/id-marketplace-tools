const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Sentiment keywords (Indonesian + English)
const POSITIVE_WORDS = new Set([
  'bagus','baik','puas','suka','recommended','rekomen','cepat','ramah','sesuai',
  'original','asli','mantap','keren','top','oke','ok','sempurna','rapi','aman',
  'nyaman','berkualitas','worth','mantul','joss','terbaik','memuaskan','tepat',
  'responsif','sigap','bersih','wangi','enak','pas','cocok','sreg','terima kasih',
  'makasih','thx','thanks','good','excellent','great','amazing','perfect','love',
  'best','fast','quality','reliable','trustworthy','awesome','fantastic','wonderful',
  'superb','outstanding','nice','happy','satisfied','recommend','smooth','easy',
]);

const NEGATIVE_WORDS = new Set([
  'jelek','rusak','cacat','lambat','lama','kecewa','tipu','penipu','scam','palsu',
  'kw','tiruan','bau','kotor','sobek','pecah','retak','berkarat','tidak sesuai',
  'ga sesuai','gak sesuai','beda','parah','buruk','zonk','rugi','mengecewakan',
  'komplain','refund','return','kembali','tukar','pending','hilang','salah','keliru',
  'lamban','lemot','error','bug','defect','bad','terrible','awful','worst','hate',
  'broken','damaged','defective','slow','fake','counterfeit','disappointed','waste',
  'trash','garbage','poor','horrible','disgusting','fraud','useless',
]);

const THEMES = {
  'Shipping': { keywords: ['pengiriman','kirim','kurir','ekspedisi','jne','jnt','sicepat','anteraja','gosend','grab','instant','shipping','delivery','courier','package','tracking','resi','sampai','tiba','dikirim','diterima','cepat','lambat','lama','kilat','express'], icon: '>' },
  'Product Quality': { keywords: ['kualitas','bagus','jelek','rusak','cacat','berkualitas','material','bahan','awet','tahan','kuat','lemah','quality','durable','sturdy','flimsy','asli','original','palsu','kw','tiruan','fake','sempurna','defect','rapi'], icon: '*' },
  'Packaging': { keywords: ['kemasan','packing','pack','bubble','wrap','dus','box','packaging','bubble wrap','aman','safe','rapi','neat','berantakan','sobek','kusut'], icon: '#' },
  'Price': { keywords: ['harga','mahal','murah','diskon','promo','cashback','price','expensive','cheap','affordable','worth','value','sebanding','overprice','budget'], icon: '$' },
  'Customer Service': { keywords: ['seller','toko','admin','cs','chat','balas','responsif','ramah','sopan','lambat','slow','service','support','response','helpful','rude','komplain','complain','solusi','solution'], icon: '@' },
  'Size/Fit': { keywords: ['ukuran','size','kecil','besar','pas','sesuai','muat','longgar','sempit','ketat','fit','kegedean','kekecilan','standar'], icon: '~' },
};

const NEGATORS = new Set(['tidak','tdk','ga','gak','gk','nggak','engga','bukan','belum','not','no','never','dont','tak']);

function normalize(text) {
  let out = text.toLowerCase().trim();
  out = out.replace(/[^\w\s]/g, ' | ');
  out = out.replace(/(\s*\|\s*)+/g, ' | ');
  out = out.replace(/\s+/g, ' ').trim();
  return out.replace(/^\|\s*|\s*\|$/g, '');
}

function tokenize(text) {
  const norm = normalize(text);
  return norm ? norm.split(' ') : [];
}

function matchSentimentKeywords(tokens) {
  const candidates = [];
  for (const keyword of POSITIVE_WORDS) candidates.push({ keyword, polarity: 'positive' });
  for (const keyword of NEGATIVE_WORDS) candidates.push({ keyword, polarity: 'negative' });
  candidates.sort((a, b) => {
    const sizeDiff = b.keyword.split(' ').length - a.keyword.split(' ').length;
    return sizeDiff !== 0 ? sizeDiff : b.keyword.length - a.keyword.length;
  });

  const used = new Array(tokens.length).fill(false);
  const matches = [];

  for (const candidate of candidates) {
    const parts = candidate.keyword.split(' ');
    const size = parts.length;
    for (let start = 0; start + size <= tokens.length; start++) {
      let blocked = false;
      for (let i = start; i < start + size; i++) {
        if (used[i]) { blocked = true; break; }
      }
      if (blocked) continue;

      let isMatch = true;
      for (let i = 0; i < size; i++) {
        if (tokens[start + i] !== parts[i]) { isMatch = false; break; }
      }
      if (!isMatch) continue;

      matches.push({ keyword: candidate.keyword, start, size, polarity: candidate.polarity });
      for (let i = start; i < start + size; i++) used[i] = true;
    }
  }

  return matches;
}

function hasNegatorBefore(tokens, start) {
  for (let i = Math.max(0, start - 2); i < start; i++) {
    if (NEGATORS.has(tokens[i])) return true;
  }
  return false;
}

function phraseContainsNegator(keyword) {
  return keyword.split(' ').some(part => NEGATORS.has(part));
}

function containsKeyword(tokens, keyword) {
  const parts = keyword.split(' ');
  const size = parts.length;
  for (let start = 0; start + size <= tokens.length; start++) {
    let isMatch = true;
    for (let i = 0; i < size; i++) {
      if (tokens[start + i] !== parts[i]) { isMatch = false; break; }
    }
    if (isMatch) return true;
  }
  return false;
}

function analyzeReview(text, rating) {
  const tokens = tokenize(text);

  const foundPos = [];
  const foundNeg = [];
  const negatedWords = [];
  let hasNegation = false;
  let posCount = 0;
  let negCount = 0;

  for (const match of matchSentimentKeywords(tokens)) {
    let negated = false;

    if (match.size > 1) {
      if (phraseContainsNegator(match.keyword)) hasNegation = true;
    } else if (hasNegatorBefore(tokens, match.start)) {
      negated = true;
      hasNegation = true;
    }

    const effective = negated
      ? (match.polarity === 'positive' ? 'negative' : 'positive')
      : match.polarity;

    if (effective === 'positive') {
      posCount++;
      if (negated) negatedWords.push(match.keyword);
      else foundPos.push(match.keyword);
    } else {
      negCount++;
      if (negated) negatedWords.push(match.keyword);
      else foundNeg.push(match.keyword);
    }
  }

  let score;
  if (posCount + negCount === 0) {
    score = 0;
  } else {
    score = (posCount - negCount) / (posCount + negCount);
  }

  if (rating != null) {
    const ratingScore = (rating - 3) / 2;
    score = score * 0.6 + ratingScore * 0.4;
  }

  let sentiment;
  if (score > 0.15) sentiment = 'positive';
  else if (score < -0.15) sentiment = 'negative';
  else sentiment = 'neutral';

  const themes = [];
  for (const [name, data] of Object.entries(THEMES)) {
    for (const kw of data.keywords) {
      if (containsKeyword(tokens, kw)) { themes.push(name); break; }
    }
  }

  return {
    sentiment,
    score: Math.round(score * 1000) / 1000,
    positiveWords: foundPos,
    negativeWords: foundNeg,
    negatedWords,
    themes,
    hasNegation,
  };
}

function generateInsights(themeSentiment, pos, neg, neu) {
  const insights = [];

  const ship = themeSentiment['Shipping'] || { pos: 0, neg: 0, total: 0 };
  if (ship.total > 0 && ship.neg / ship.total > 0.4) {
    insights.push('Pengiriman jadi masalah. Coba ganti ekspedisi atau tambah update tracking.');
  }

  const qual = themeSentiment['Product Quality'] || { pos: 0, neg: 0, total: 0 };
  if (qual.total > 0 && qual.neg / qual.total > 0.4) {
    insights.push('Komplain kualitas tinggi. Cek foto dan deskripsi produk, pastikan sesuai barang asli.');
  }

  const pack = themeSentiment['Packaging'] || { pos: 0, neg: 0, total: 0 };
  if (pack.total > 0 && pack.neg / pack.total > 0.4) {
    insights.push('Kemasan perlu diperbaiki. Pakai bubble wrap lebih tebal atau double box.');
  }

  const price = themeSentiment['Price'] || { pos: 0, neg: 0, total: 0 };
  if (price.total > 0 && price.pos / price.total > 0.6) {
    insights.push('Persepsi harga positif. Bisa coba naikkan harga sedikit untuk margin lebih baik.');
  }

  const cs = themeSentiment['Customer Service'] || { pos: 0, neg: 0, total: 0 };
  if (cs.total > 0 && cs.neg / cs.total > 0.4) {
    insights.push('CS perlu perbaikan. Percepat waktu respon dan tingkatkan penyelesaian masalah.');
  }

  if (neg > pos && neg > neu) {
    insights.push('Sentimen keseluruhan negatif. Segera review produk dan layanan.');
  } else if (pos > neg * 2) {
    insights.push('Sentimen positif kuat. Manfaatkan review bagus untuk marketing.');
  }

  if (insights.length === 0) {
    insights.push('Tidak ada masalah kritis terdeteksi. Tetap pantau review secara rutin.');
  }

  return insights;
}

// API endpoint
app.post('/api/analyze', (req, res) => {
  const { reviews } = req.body;
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ error: 'reviews array required' });
  }

  const results = reviews.map(r => {
    const text = typeof r === 'string' ? r : r.text;
    const rating = typeof r === 'string' ? null : (r.rating || null);
    const source = typeof r === 'string' ? '' : (r.source || '');
    const result = analyzeReview(text, rating);
    return { text, rating, source, ...result };
  });

  const total = results.length;
  const pos = results.filter(r => r.sentiment === 'positive').length;
  const neg = results.filter(r => r.sentiment === 'negative').length;
  const neu = total - pos - neg;
  const avgScore = results.reduce((s, r) => s + r.score, 0) / total;

  const ratings = results.filter(r => r.rating != null).map(r => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // Theme analysis
  const themeSentiment = {};
  const themeCounts = {};
  for (const r of results) {
    for (const theme of r.themes) {
      if (!themeSentiment[theme]) themeSentiment[theme] = { pos: 0, neg: 0, total: 0 };
      themeSentiment[theme].total++;
      if (r.sentiment === 'positive') themeSentiment[theme].pos++;
      if (r.sentiment === 'negative') themeSentiment[theme].neg++;
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
  }

  // Top keywords
  const posWords = {};
  const negWords = {};
  for (const r of results) {
    for (const w of r.positiveWords) posWords[w] = (posWords[w] || 0) + 1;
    for (const w of r.negativeWords) negWords[w] = (negWords[w] || 0) + 1;
  }

  const topPos = Object.entries(posWords).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topNeg = Object.entries(negWords).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Sort reviews by score for best/worst
  const sorted = [...results].sort((a, b) => a.score - b.score);
  const worst3 = sorted.slice(0, 3);
  const best3 = sorted.slice(-3).reverse();

  const insights = generateInsights(themeSentiment, pos, neg, neu);

  // Themes sorted by count
  const themesSorted = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const ts = themeSentiment[name];
      const ratio = ts.total > 0 ? ts.pos / ts.total : 0;
      let status = 'neutral';
      if (ratio > 0.6) status = 'positive';
      else if (ratio < 0.4) status = 'negative';
      return { name, count, status, icon: THEMES[name]?.icon || '?' };
    });

  res.json({
    total, pos, neg, neu, avgScore,
    avgRating, ratedCount: ratings.length,
    themes: themesSorted,
    topPos, topNeg,
    best3, worst3,
    insights,
    results,
  });
});

const PORT = 8003;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sentiment Analyzer running at http://localhost:${PORT}`);
  });
}

module.exports = {
  analyzeReview,
  containsKeyword,
  matchSentimentKeywords,
  normalize,
  tokenize,
};
