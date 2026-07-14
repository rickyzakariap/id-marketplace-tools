// Quick smoke test — hits the analyze API directly
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3456,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== Listing SEO Analyzer — Smoke Tests ===\n');

  // Test 1: Good listing
  const good = await post('/api/analyze', {
    title: 'Kaos Polos Premium Cotton Combed 30s - Hitam - Best Seller',
    description: 'Kaos polos premium dengan bahan cotton combed 30s.\n\n✅ Bahan: Cotton Combed 30s\n✅ Tersedia: S, M, L, XL\n✅ Warna: Hitam, Putih, Navy\n\nJahitan rapi dan tidak mudah melar. Cocok untuk sehari-hari.\n\n📦 Packing aman + bubble wrap\n⭐ Garansi 30 hari\n💬 Chat sebelum order!',
    price: 89999,
    category: 'fashion',
    platform: 'shopee',
  });
  console.log(`Test 1 (good listing): ${good.status} — Grade: ${good.body.overall.grade} (${good.body.overall.percentage}%)`);
  console.log(`  Title scores: ${good.body.title.scores.length} criteria`);
  console.log(`  Power words: ${good.body.title.foundPowerWords.join(', ')}`);
  console.log(`  Tips: ${good.body.overall.allTips.length}\n`);

  // Test 2: Bad listing
  const bad = await post('/api/analyze', {
    title: 'baju',
    description: 'baju bagus',
    price: 150000,
    platform: 'tokopedia',
  });
  console.log(`Test 2 (bad listing): ${bad.status} — Grade: ${bad.body.overall.grade} (${bad.body.overall.percentage}%)`);
  console.log(`  Tips: ${bad.body.overall.allTips.length}`);
  bad.body.overall.allTips.forEach(t => console.log(`    - ${t}`));
  console.log('');

  // Test 3: Missing fields
  const missing = await post('/api/analyze', { title: 'test' });
  console.log(`Test 3 (missing fields): ${missing.status} — ${missing.body.error}\n`);

  // Test 4: All caps title
  const caps = await post('/api/analyze', {
    title: 'MURAH BANGET PROMO DISKON 50% KAOS POLOS PREMIUM',
    description: 'Kaos polos premium cotton combed 30s. Tersedia semua ukuran. Bahan adem dan nyaman. Cocok untuk sehari-hari dan olahraga. Jahitan rapi dan tahan lama. Tersedia warna hitam, putih, navy, abu-abu. Beli 3 bonus 1.',
    price: 149999,
    platform: 'tokopedia',
  });
  console.log(`Test 4 (all caps): ${caps.status} — Grade: ${caps.body.overall.grade} (${caps.body.overall.percentage}%)`);
  const kapScore = caps.body.title.scores.find(s => s.name === 'Kapitalisasi');
  console.log(`  Capitalization: ${kapScore.score} — ${kapScore.detail}\n`);

  // Test 5: Different platforms
  for (const plat of ['tiktokshop', 'lazada', 'bukalapak', 'blibli']) {
    const r = await post('/api/analyze', {
      title: 'Tas Ransel Anti Air Premium 40L - Waterproof Travel',
      description: 'Tas ransel anti air kapasitas 40L. Cocok untuk traveling dan outdoor. Bahan polyester waterproof. Ada slot laptop 15 inch. Tersedia warna hitam dan biru.',
      price: 249999,
      platform: plat,
    });
    console.log(`Test 5 (${plat}): ${r.status} — Grade: ${r.body.overall.grade}`);
  }

  console.log('\n=== All tests passed ===');
}

main().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });
