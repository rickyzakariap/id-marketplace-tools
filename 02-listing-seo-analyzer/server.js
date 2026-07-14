const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3456;

// ============================================================
// SEO ANALYSIS ENGINE
// ============================================================

// Common high-value marketplace keywords (Indonesian)
const POWER_WORDS = [
  'original', 'ori', 'premium', 'terbaru', 'best seller', 'hot', 'laris',
  'murah', 'gratis ongkir', 'diskon', 'promo', 'limited', 'eksklusif',
  'branded', 'import', 'lokal', 'berkualitas', 'tahan lama', 'garansi',
  'resmi', 'authentic', 'new arrival', 'trendy', 'aesthetic', 'viral',
  'anti air', 'waterproof', 'multifungsi', 'praktis', 'simple', 'elegan',
];

const FILLER_WORDS = [
  'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan',
  'adalah', 'akan', 'pada', 'juga', 'sudah', 'telah', 'bisa', 'dapat',
];

// Platform-specific title length limits
const PLATFORM_LIMITS = {
  tokopedia: { titleMax: 100, titleOptimal: [40, 70], descMax: 3000 },
  shopee: { titleMax: 120, titleOptimal: [50, 80], descMax: 5000 },
  tiktokshop: { titleMax: 200, titleOptimal: [50, 100], descMax: 5000 },
  lazada: { titleMax: 200, titleOptimal: [50, 80], descMax: 5000 },
  bukalapak: { titleMax: 70, titleOptimal: [30, 60], descMax: 3000 },
  blibli: { titleMax: 100, titleOptimal: [40, 70], descMax: 3000 },
};

function analyzeTitle(title, platform) {
  const scores = [];
  const tips = [];
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.tokopedia;

  // Length check
  const len = title.length;
  if (len < 20) {
    scores.push({ name: 'Panjang Judul', score: 20, max: 100, detail: `Terlalu pendek (${len} karakter). Minimal 20 karakter.` });
    tips.push('Tambahkan kata kunci deskriptif ke judul. Judul pendek = sedikit keyword = sulit ditemukan.');
  } else if (len > limits.titleMax) {
    scores.push({ name: 'Panjang Judul', score: 30, max: 100, detail: `Terlalu panjang (${len}/${limits.titleMax}). Akan terpotong di pencarian.` });
    tips.push(`Kurangi judul ke ${limits.titleOptimal[1]} karakter untuk ${platform}.`);
  } else if (len >= limits.titleOptimal[0] && len <= limits.titleOptimal[1]) {
    scores.push({ name: 'Panjang Judul', score: 95, max: 100, detail: `Optimal (${len} karakter, range ${limits.titleOptimal[0]}-${limits.titleOptimal[1]}).` });
  } else {
    scores.push({ name: 'Panjang Judul', score: 70, max: 100, detail: `${len} karakter - bisa lebih optimal (${limits.titleOptimal[0]}-${limits.titleOptimal[1]}).` });
  }

  // Keyword density in title
  const words = title.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < 3) {
    scores.push({ name: 'Variasi Kata', score: 25, max: 100, detail: 'Terlalu sedikit kata unik.' });
    tips.push('Tambahkan lebih banyak kata kunci yang relevan.');
  } else {
    scores.push({ name: 'Variasi Kata', score: Math.min(95, uniqueWords.size * 10), max: 100, detail: `${uniqueWords.size} kata unik.` });
  }

  // Power words check
  const titleLower = title.toLowerCase();
  const foundPowerWords = POWER_WORDS.filter(pw => titleLower.includes(pw));
  if (foundPowerWords.length > 0) {
    scores.push({ name: 'Power Words', score: Math.min(95, 60 + foundPowerWords.length * 10), max: 100, detail: `Mengandung: ${foundPowerWords.join(', ')}` });
  } else {
    scores.push({ name: 'Power Words', score: 40, max: 100, detail: 'Tidak ada power words.' });
    tips.push('Tambahkan power words: original, premium, best seller, gratis ongkir, dll.');
  }

  // Capitalization check
  const hasProperCase = /^[A-Z0-9]/.test(title);
  const hasAllCaps = title === title.toUpperCase() && title.length > 10;
  if (hasAllCaps) {
    scores.push({ name: 'Kapitalisasi', score: 30, max: 100, detail: 'Semua huruf kapital - terlihat spam.' });
    tips.push('JANGAN PAKAI SEMUA KAPITAL. Gunakan Title Case atau biasa.');
  } else if (hasProperCase) {
    scores.push({ name: 'Kapitalisasi', score: 90, max: 100, detail: 'Dimulai dengan huruf kapital.' });
  } else {
    scores.push({ name: 'Kapitalisasi', score: 70, max: 100, detail: 'Pertimbangkan kapitalisasi untuk awal judul.' });
  }

  // Duplicate words
  const wordCount = {};
  words.forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; });
  const duplicates = Object.entries(wordCount).filter(([w, c]) => c > 1 && w.length > 2);
  if (duplicates.length > 0) {
    scores.push({ name: 'Duplikasi Kata', score: 50, max: 100, detail: `Kata berulang: ${duplicates.map(([w, c]) => `${w}(${c}x)`).join(', ')}` });
    tips.push('Hindari pengulangan kata. Gunakan sinonim.');
  } else {
    scores.push({ name: 'Duplikasi Kata', score: 95, max: 100, detail: 'Tidak ada duplikasi.' });
  }

  return { scores, tips, foundPowerWords };
}

function analyzeDescription(desc, platform) {
  const scores = [];
  const tips = [];
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.tokopedia;

  // Length check
  const len = desc.length;
  if (len < 100) {
    scores.push({ name: 'Panjang Deskripsi', score: 25, max: 100, detail: `Terlalu pendek (${len} karakter). Marketplace suka deskripsi detail.` });
    tips.push('Tambahkan detail produk: spesifikasi, bahan, ukuran, cara pakai.');
  } else if (len > limits.descMax) {
    scores.push({ name: 'Panjang Deskripsi', score: 60, max: 100, detail: `Sangat panjang (${len} karakter). Pertimbangkan pemendekan.` });
  } else {
    const pct = Math.round((len / limits.descMax) * 100);
    scores.push({ name: 'Panjang Deskripsi', score: Math.min(95, 50 + pct), max: 100, detail: `${len} karakter (${pct}% dari max ${limits.descMax}).` });
  }

  // Bullet points check
  const hasBullets = /^[•\-\*]\s|^\d+[\.\)]\s/m.test(desc);
  if (hasBullets) {
    scores.push({ name: 'Format Bullet', score: 95, max: 100, detail: 'Menggunakan bullet points - bagus!' });
  } else {
    scores.push({ name: 'Format Bullet', score: 40, max: 100, detail: 'Tidak ada bullet points.' });
    tips.push('Gunakan bullet points untuk spesifikasi. Pembeli scan, bukan baca.');
  }

  // Paragraphs check
  const paragraphs = desc.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    scores.push({ name: 'Struktur', score: 90, max: 100, detail: `${paragraphs.length} paragraf - terstruktur.` });
  } else {
    scores.push({ name: 'Struktur', score: 45, max: 100, detail: `${paragraphs.length} paragraf - perlu lebih terstruktur.` });
    tips.push('Pisahkan jadi: Hook → Spesifikasi → Keunggulan → Cara Pakai.');
  }

  // Keyword density
  const descWords = desc.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descWordCount = {};
  descWords.forEach(w => { descWordCount[w] = (descWordCount[w] || 0) + 1; });
  const topKeywords = Object.entries(descWordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .filter(([w]) => !FILLER_WORDS.includes(w));

  if (topKeywords.length > 0) {
    scores.push({ name: 'Keyword Density', score: 80, max: 100, detail: `Top keywords: ${topKeywords.map(([w, c]) => `${w}(${c}x)`).join(', ')}` });
  } else {
    scores.push({ name: 'Keyword Density', score: 30, max: 100, detail: 'Tidak ditemukan keyword dominan.' });
    tips.push('Ulangi keyword utama 2-3x di deskripsi secara natural.');
  }

  // Has emoji or symbols
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(desc) || /[✅❌⭐🔥💡📦🎨]/u.test(desc);
  if (hasEmoji) {
    scores.push({ name: 'Visual Appeal', score: 85, max: 100, detail: 'Menggunakan emoji - eye-catching.' });
  } else {
    scores.push({ name: 'Visual Appeal', score: 50, max: 100, detail: 'Tidak ada emoji/simbol.' });
    tips.push('Tambahkan emoji (✅📦⭐) untuk break up text dan menarik perhatian.');
  }

  // CTA check
  const ctaWords = ['beli', 'order', 'pesan', 'chat', 'keranjang', 'checkout', 'sekarang', 'hari ini', 'stok terbatas', 'jangan sampai kehabisan'];
  const hasCTA = ctaWords.some(w => desc.toLowerCase().includes(w));
  if (hasCTA) {
    scores.push({ name: 'Call to Action', score: 90, max: 100, detail: 'Ada CTA - bagus!' });
  } else {
    scores.push({ name: 'Call to Action', score: 35, max: 100, detail: 'Tidak ada Call to Action.' });
    tips.push('Tambahkan CTA: "Chat sekarang!", "Stok terbatas, beli sekarang!"');
  }

  return { scores, tips, topKeywords };
}

function analyzePrice(price, category) {
  const scores = [];
  const tips = [];

  // Psychological pricing (X999)
  const lastThree = price % 1000;
  const isX999 = (lastThree === 999 || lastThree === 990 || lastThree === 900);
  if (isX999) {
    scores.push({ name: 'Harga Psikologis', score: 90, max: 100, detail: `Rp ${price.toLocaleString('id-ID')} - menggunakan pricing X999.` });
  } else if (price % 1000 === 0) {
    scores.push({ name: 'Harga Psikologis', score: 75, max: 100, detail: `Rp ${price.toLocaleString('id-ID')} - bulat. Pertimbangkan X999.` });
    tips.push('Harga X999 (misal 149.999 vs 150.000) lebih menarik secara psikologis.');
  } else {
    scores.push({ name: 'Harga Psikologis', score: 60, max: 100, detail: `Rp ${price.toLocaleString('id-ID')} - tidak bulat atau X999.` });
  }

  // Goceng pricing (Rp 5.000 increments) - skip tip if already X999
  if (price % 5000 === 0) {
    scores.push({ name: 'Goceng Pricing', score: 90, max: 100, detail: 'Kelipatan Rp 5.000 - sesuai kebiasaan Indonesia.' });
  } else {
    scores.push({ name: 'Goceng Pricing', score: isX999 ? 80 : 60, max: 100, detail: isX999 ? 'Bukan kelipatan Rp 5.000, tapi X999 sudah oke.' : 'Bukan kelipatan Rp 5.000.' });
    if (!isX999) {
      tips.push('Harga Indonesia: bulatkan ke Rp 5.000 (145.000, 150.000).');
    }
  }

  // Price range check
  if (price < 10000) {
    scores.push({ name: 'Range Harga', score: 50, max: 100, detail: 'Harga sangat rendah - pembeli mungkin ragu kualitasnya.' });
    tips.push('Harga < Rp 10.000 sering dianggap murahan. Pertimbangkan bundle.');
  } else if (price > 5000000) {
    scores.push({ name: 'Range Harga', score: 60, max: 100, detail: 'Harga tinggi - pastikan deskripsi meyakinkan.' });
    tips.push('Produk mahal butuh: foto profesional, garansi, review, dan deskripsi detail.');
  } else {
    scores.push({ name: 'Range Harga', score: 85, max: 100, detail: 'Range harga wajar.' });
  }

  return { scores, tips };
}

function generateOverallScore(titleResult, descResult, priceResult) {
  const allScores = [...titleResult.scores, ...descResult.scores, ...priceResult.scores];
  const totalScore = allScores.reduce((sum, s) => sum + s.score, 0);
  const maxScore = allScores.reduce((sum, s) => sum + s.max, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const allTips = [...titleResult.tips, ...descResult.tips, ...priceResult.tips];

  let grade, gradeColor;
  if (percentage >= 90) { grade = 'A+'; gradeColor = '#10b981'; }
  else if (percentage >= 80) { grade = 'A'; gradeColor = '#34d399'; }
  else if (percentage >= 70) { grade = 'B'; gradeColor = '#fbbf24'; }
  else if (percentage >= 60) { grade = 'C'; gradeColor = '#f59e0b'; }
  else if (percentage >= 50) { grade = 'D'; gradeColor = '#ef4444'; }
  else { grade = 'F'; gradeColor = '#dc2626'; }

  return {
    totalScore,
    maxScore,
    percentage,
    grade,
    gradeColor,
    allScores,
    allTips,
    priorityTips: allTips.slice(0, 5),
  };
}

// Description generator
const DESC_TEMPLATES = {
  fashion: {
    hook: (title) => `${title}. Bahan premium, nyaman dipakai seharian.`,
    specs: ['Bahan:', 'Ukuran:', 'Warna:', 'Berat:'],
    usps: ['Jahitan rapi dan kuat', 'Tidak mudah melar', 'Nyaman dipakai seharian', 'Cocok untuk daily use'],
    cta: 'Chat sebelum order untuk konsultasi ukuran!',
    after: 'Packing aman + bubble wrap.\nGaransi 7 hari tukar ukuran.',
  },
  electronics: {
    hook: (title) => `${title}. Berfungsi normal 100%, siap pakai.`,
    specs: ['Spesifikasi:', 'Kondisi:', 'Kelengkapan:', 'Garansi:'],
    usps: ['Berfungsi normal 100%', 'Sudah di-test', 'Siap pakai', 'Packing aman + bubble wrap'],
    cta: 'Chat untuk info detail dan foto!',
    after: 'Garansi 7 hari uang kembali.\nPengiriman same day untuk order sebelum 14:00.',
  },
  beauty: {
    hook: (title) => `${title}. Formulasi ringan, aman untuk kulit sensitif.`,
    specs: ['Ingredients:', 'Volume:', 'BPOM:', 'Cara pakai:'],
    usps: ['Aman untuk kulit sensitif', 'Tidak lengket', 'Cepat meresap', 'BPOM terdaftar'],
    cta: 'Stok terbatas, order sekarang!',
    after: 'Free pouch untuk pembelian 2 botol.\nPacking bubble wrap + kardus.',
  },
  food: {
    hook: (title) => `${title}. Rasa autentik, fresh from kitchen.`,
    specs: ['Isi:', 'Berat:', 'Expired:', 'Simpan:'],
    usps: ['Fresh from kitchen', 'Tanpa pengawet', 'Rasa autentik', 'Packing food-grade'],
    cta: 'Order sebelum jam 14:00, kirim hari yang sama!',
    after: 'Packing food-grade + bubble wrap.\nGaransi uang kembali jika tidak sesuai.',
  },
  home: {
    hook: (title) => `${title}. Desain minimalis, cocok untuk rumah modern.`,
    specs: ['Material:', 'Ukuran:', 'Warna:', 'Berat:'],
    usps: ['Desain minimalis', 'Mudah dibersihkan', 'Tahan lama', 'Cocok untuk dekorasi'],
    cta: 'Chat untuk lihat katalog lengkap!',
    after: 'Packing aman + kardus tebal.\nGaransi 7 hari jika rusak di perjalanan.',
  },
  automotive: {
    hook: (title) => `${title}. Kualitas OEM, pas di kendaraan.`,
    specs: ['Kompatibel:', 'Material:', 'Berat:', 'Garansi:'],
    usps: ['Kualitas OEM', 'Plug and play', 'Tahan lama', 'Sudah di-test'],
    cta: 'Chat untuk cek kompatibilitas kendaraan!',
    after: 'Packing aman + kardus.\nGaransi 30 hari.',
  },
  books: {
    hook: (title) => `${title}. Kondisi baik, isi lengkap.`,
    specs: ['Penulis:', 'Penerbit:', 'Halaman:', 'Kondisi:'],
    usps: ['Kondisi baik', 'Isi lengkap', 'Halaman tidak sobek', 'Sudah dibaca sekali'],
    cta: 'Chat untuk lihat isi buku!',
    after: 'Packing kardus + plastik wrap.',
  },
  general: {
    hook: (title) => `${title}. Kualitas terjamin, harga bersaing.`,
    specs: ['Spesifikasi:', 'Material:', 'Ukuran:', 'Berat:'],
    usps: ['Kualitas terjamin', 'Harga bersaing', 'Packing aman', 'Pengiriman cepat'],
    cta: 'Chat sebelum order!',
    after: 'Packing aman + bubble wrap.\nGaransi 7 hari.',
  },
};

app.post('/api/suggest-description', (req, res) => {
  const { title, category, platform } = req.body;
  if (!title) return res.status(400).json({ error: 'title wajib diisi' });

  const cat = (category || 'general').toLowerCase();
  const tpl = DESC_TEMPLATES[cat] || DESC_TEMPLATES.general;

  // Extract keywords from title for USP suggestions
  const titleWords = title.toLowerCase().split(/\s+/);
  const matchedPowerWords = POWER_WORDS.filter(pw => titleWords.some(tw => tw.includes(pw) || pw.includes(tw)));

  const lines = [
    tpl.hook(title),
    '',
    'Spesifikasi:',
    ...tpl.specs.map(s => `- ${s} `),
    '',
    'Keunggulan:',
    ...tpl.usps.map(u => `\u2705 ${u}`),
    ...(matchedPowerWords.length > 0 ? [`\u2705 ${matchedPowerWords[0]} terjamin`] : []),
    '',
    tpl.cta,
    '',
    tpl.after,
  ];

  res.json({ description: lines.join('\n') });
});

// API endpoint
app.post('/api/analyze', (req, res) => {
  const { title, description, price, category, platform } = req.body;

  if (!title || !description || !price) {
    return res.status(400).json({ error: 'title, description, price wajib diisi' });
  }

  const plat = (platform || 'tokopedia').toLowerCase();
  const cat = (category || 'general').toLowerCase();
  const priceNum = parseInt(price, 10);

  if (isNaN(priceNum) || priceNum <= 0) {
    return res.status(400).json({ error: 'price harus angka > 0' });
  }

  const titleResult = analyzeTitle(title, plat);
  const descResult = analyzeDescription(description, plat);
  const priceResult = analyzePrice(priceNum, cat);
  const overall = generateOverallScore(titleResult, descResult, priceResult);

  res.json({
    platform: plat,
    category: cat,
    title: titleResult,
    description: descResult,
    price: priceResult,
    overall,
    platformLimits: PLATFORM_LIMITS[plat],
  });
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Listing SEO Analyzer running on http://localhost:${PORT}`);
});
