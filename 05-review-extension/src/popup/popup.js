const $ = id => document.getElementById(id);
const BACKEND = 'http://localhost:3458';

let lastResults = null;

// Scraping functions - run directly via chrome.scripting.executeScript({ func })
function scrapeShopee() {
  const reviews = [];

  // Primary: .product-ratings__list contains individual reviews
  const list = document.querySelector('.product-ratings__list, [class*="ratings__list"]');
  if (list) {
    const items = list.children;
    for (const item of items) {
      const text = item.textContent?.trim() || '';
      // Count lit stars (filled = user's rating)
      const stars = item.querySelectorAll('.shopee-rating-stars__lit, [class*="star"][class*="lit"]').length;
      if (text.length > 10 && text.length < 1000) {
        reviews.push({ text: text.substring(0, 500), rating: stars || null });
      }
    }
  }

  // Fallback: broader selectors
  if (reviews.length === 0) {
    const container = document.querySelector('.product-ratings, [class*="product-rating"]');
    if (container) {
      const items = container.querySelectorAll('[class*="item"], [class*="card"], [class*="comment"], div[class]');
      items.forEach(item => {
        if (item.textContent.length < 20) return;
        if (item.classList.contains('product-rating-overview')) return;
        const text = item.textContent?.trim() || '';
        const stars = item.querySelectorAll('.shopee-rating-stars__lit, [class*="star"][class*="lit"]').length;
        if (text.length > 20 && text.length < 1000) reviews.push({ text: text.substring(0, 500), rating: stars || null });
      });
    }
  }

  if (reviews.length === 0) {
    const lists = document.querySelectorAll('ul, ol, [class*="list"]');
    for (const list of lists) {
      const children = list.children;
      if (children.length < 3) continue;
      const first = children[0];
      if (first.querySelector('[class*="star"], svg[fill*="FF"]') && first.textContent?.length > 20) {
        for (const child of children) {
          const text = child.textContent?.trim() || '';
          const starCount = child.querySelectorAll('[class*="star"][class*="on"], svg[fill="#EE4D2D"]').length;
          if (text.length > 10 && text.length < 2000) reviews.push({ text: text.substring(0, 500), rating: starCount || null });
        }
        break;
      }
    }
  }

  const name = document.querySelector('h1[class*="product"], [class*="product-title"], [class*="vWBHjg"], [class*="attKMx"]')?.textContent?.trim() || document.title.split('|')[0].trim();
  return { reviews, product: { name, url: window.location.href }, marketplace: 'shopee' };
}

function scrapeTokopedia() {
  const reviews = [];
  const items = document.querySelectorAll('[data-testid="review-card"], [class*="review-item"], [class*="css-1k1a7gr"]');
  items.forEach(item => {
    const text = item.querySelector('[data-testid="review-content"], [class*="content"], [class*="text"], [class*="comment"]')?.textContent?.trim() || item.textContent?.trim() || '';
    const stars = item.querySelectorAll('[data-testid="star-icon"].active, svg[fill="#FD973B"], [class*="star"][class*="active"]').length;
    if (text && text.length > 10 && text.length < 2000) reviews.push({ text: text.substring(0, 500), rating: stars || null });
  });
  const name = document.querySelector('[data-testid="lbl-product-name"], h1')?.textContent?.trim() || document.title.split('|')[0].trim();
  return { reviews, product: { name, url: window.location.href }, marketplace: 'tokopedia' };
}

function debugPage() {
  const reviewEls = document.querySelectorAll('[class*="review"], [class*="rating"], [class*="comment"]');
  const reviewInfo = Array.from(reviewEls).slice(0, 15).map(el => ({
    tag: el.tagName, cls: el.className.toString().substring(0, 80), childCount: el.children.length,
    textLen: el.textContent?.length || 0, hasStars: !!el.querySelector('svg, [class*="star"]'),
  }));

  // Deep dive into .product-ratings container
  const container = document.querySelector('.product-ratings, [class*="product-rating"]');
  let containerChildren = [];
  if (container) {
    containerChildren = Array.from(container.children).slice(0, 10).map(el => ({
      tag: el.tagName, cls: el.className.toString().substring(0, 80), textLen: el.textContent?.length || 0,
      hasStars: !!el.querySelector('.shopee-rating-stars__lit, [class*="star"][class*="lit"]'),
      sampleText: el.textContent?.substring(0, 100) || '',
    }));
  }

  // Find elements with substantial text that could be reviews
  const textBlocks = document.querySelectorAll('div, span, p');
  const candidates = [];
  for (const el of textBlocks) {
    const text = el.textContent?.trim() || '';
    if (text.length > 30 && text.length < 500 && el.children.length < 5) {
      const cls = el.className?.toString() || '';
      if (cls && !candidates.some(c => c.cls === cls)) {
        candidates.push({ tag: el.tagName, cls: cls.substring(0, 60), textLen: text.length, text: text.substring(0, 80) });
        if (candidates.length >= 10) break;
      }
    }
  }

  return { reviewElementCount: reviewEls.length, reviewElements: reviewInfo, textCandidates: candidates, containerChildren };
}

async function runInPage(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fn,
  });
  return results[0]?.result;
}

async function scrape() {
  const btn = $('scrapeBtn');
  const status = $('status');
  const error = $('error');

  btn.disabled = true;
  btn.textContent = 'Scraping...';
  error.classList.add('hidden');
  status.classList.remove('hidden');
  status.textContent = 'Mengambil review...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';

    let result;
    if (url.includes('shopee.co.id')) {
      result = await runInPage(scrapeShopee);
    } else if (url.includes('tokopedia.com')) {
      result = await runInPage(scrapeTokopedia);
    } else {
      throw new Error('Buka halaman produk Shopee atau Tokopedia dulu.');
    }

    if (!result || result.reviews.length === 0) {
      throw new Error('Tidak ditemukan review. Scroll ke bagian review, lalu coba lagi.');
    }

    status.textContent = `${result.reviews.length} review ditemukan. Analisa...`;

    const resp = await fetch(`${BACKEND}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviews: result.reviews,
        marketplace: result.marketplace,
        product: result.product,
        url: result.product.url,
      }),
    });

    if (!resp.ok) throw new Error('Backend error: ' + resp.status);

    const data = await resp.json();
    lastResults = { ...data, marketplace: result.marketplace, product: result.product, url: result.product.url };
    renderResults(data, result.product);

  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
    status.classList.add('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Scrape Review';
  }
}

function renderResults(data, product) {
  $('idle').classList.add('hidden');
  $('results').classList.remove('hidden');

  $('productName').textContent = product?.name || '-';
  $('statTotal').textContent = data.total;

  const sentEl = $('statSentiment');
  if (data.avgScore > 0.15) { sentEl.textContent = '+'; sentEl.className = 'stat-value green'; }
  else if (data.avgScore < -0.15) { sentEl.textContent = '-'; sentEl.className = 'stat-value red'; }
  else { sentEl.textContent = '~'; sentEl.className = 'stat-value yellow'; }

  const scoreEl = $('statScore');
  scoreEl.textContent = (data.avgScore >= 0 ? '+' : '') + data.avgScore.toFixed(2);
  scoreEl.className = 'stat-value ' + (data.avgScore > 0.15 ? 'green' : data.avgScore < -0.15 ? 'red' : 'yellow');

  $('distBars').innerHTML = [
    { label: 'Positif', count: data.pos, color: '#22c55e' },
    { label: 'Netral', count: data.neu, color: '#eab308' },
    { label: 'Negatif', count: data.neg, color: '#ef4444' },
  ].map(d => {
    const pct = data.total > 0 ? (d.count / data.total * 100) : 0;
    return `<div class="dist-row"><span class="dist-label">${d.label}</span><div class="dist-track"><div class="dist-fill" style="width:${pct}%;background:${d.color}"></div></div><span class="dist-count">${d.count} (${Math.round(pct)}%)</span></div>`;
  }).join('');

  if (data.themes?.length) {
    const max = Math.max(...data.themes.map(t => t.count));
    $('themes').innerHTML = data.themes.map(t => {
      const pct = max > 0 ? (t.count / max * 100) : 0;
      const color = t.status === 'positive' ? '#22c55e' : t.status === 'negative' ? '#ef4444' : '#eab308';
      return `<div class="theme-row"><span class="theme-name">${t.name}</span><div class="theme-track"><div class="theme-fill" style="width:${pct}%;background:${color}"></div></div><span class="theme-count">${t.count}</span></div>`;
    }).join('');
  } else {
    $('themes').innerHTML = '<div style="font-size:12px;color:#8c909f">Tidak ada tema</div>';
  }

  $('insights').innerHTML = (data.insights || []).map(i => `<li class="insight-item">${i}</li>`).join('');
}

async function saveToSupabase() {
  const btn = $('saveBtn');
  const status = $('saveStatus');
  if (!lastResults) return;

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  status.classList.remove('hidden');
  status.textContent = 'Mengirim ke Supabase...';

  try {
    const resp = await fetch(`${BACKEND}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketplace: lastResults.marketplace,
        product: lastResults.product,
        url: lastResults.url,
        reviews: lastResults.results,
        stats: { total: lastResults.total, pos: lastResults.pos, neg: lastResults.neg, neu: lastResults.neu, avgScore: lastResults.avgScore, themes: lastResults.themes },
      }),
    });
    if (!resp.ok) throw new Error('Save failed: ' + resp.status);
    const data = await resp.json();
    status.textContent = `Tersimpan (${data.count} review)`;
    btn.textContent = 'Tersimpan';
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}

async function debugPageHandler() {
  const status = $('status');
  const error = $('error');
  status.classList.remove('hidden');
  error.classList.add('hidden');
  status.textContent = 'Mengambil debug info...';

  try {
    const info = await runInPage(debugPage);
    status.innerHTML = `<b>Review elements:</b> ${info.reviewElementCount}<br>` +
      `<b>Container children:</b><br>${info.containerChildren.map(c => `${c.tag}.${c.cls} (${c.textLen}chars, stars:${c.hasStars}) "${c.sampleText}"`).join('<br>')}<br>` +
      `<b>Review classes:</b><br>${info.reviewElements.map(e => `${e.tag}.${e.cls} (${e.textLen}chars, stars:${e.hasStars})`).join('<br>')}<br>` +
      `<b>Text candidates:</b><br>${info.textCandidates.map(c => `${c.tag}.${c.cls}: "${c.text}"`).join('<br>')}`;
  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
    status.classList.add('hidden');
  }
}

function resetUI() {
  $('idle').classList.remove('hidden');
  $('results').classList.add('hidden');
  $('saveStatus').classList.add('hidden');
  $('saveBtn').textContent = 'Simpan ke Database';
  $('status').classList.add('hidden');
  $('error').classList.add('hidden');
  lastResults = null;
}

document.addEventListener('DOMContentLoaded', () => {
  $('scrapeBtn').addEventListener('click', scrape);
  $('debugBtn').addEventListener('click', debugPageHandler);
});
