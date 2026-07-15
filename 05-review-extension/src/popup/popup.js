const $ = id => document.getElementById(id);
const BACKEND = 'http://localhost:3458';

let lastResults = null;
let searchProducts = [];
let sortState = { col: null, asc: true };

// ============================================================
// Scrape Shopee product reviews (from product detail page)
// ============================================================
function scrapeShopeeReviews() {
  const reviews = [];
  const list = document.querySelector('.product-ratings__list, [class*="ratings__list"]');
  if (list) {
    for (const item of list.children) {
      const text = item.textContent?.trim() || '';
      const stars = item.querySelectorAll('.shopee-rating-stars__lit, [class*="star"][class*="lit"]').length;
      if (text.length > 10 && text.length < 1000) reviews.push({ text: text.substring(0, 500), rating: stars || null });
    }
  }
  if (reviews.length === 0) {
    const container = document.querySelector('.product-ratings, [class*="product-rating"]');
    if (container) {
      container.querySelectorAll('[class*="item"], [class*="card"], div[class]').forEach(item => {
        if (item.textContent.length < 20 || item.classList.contains('product-rating-overview')) return;
        const text = item.textContent?.trim() || '';
        const stars = item.querySelectorAll('.shopee-rating-stars__lit, [class*="star"][class*="lit"]').length;
        if (text.length > 20 && text.length < 1000) reviews.push({ text: text.substring(0, 500), rating: stars || null });
      });
    }
  }
  const name = document.querySelector('h1[class*="product"], [class*="product-title"], [class*="vWBHjg"]')?.textContent?.trim() || document.title.split('|')[0].trim();
  return { reviews, product: { name, url: window.location.href }, marketplace: 'shopee' };
}

// ============================================================
// Scrape Shopee product details (from product detail page)
// ============================================================
function scrapeShopeeProduct() {
  const bodyText = document.body.innerText;
  
  // Product name: h1 or title
  const name = document.querySelector('h1[class*="product"], [class*="product-title"], [class*="vWBHjg"]')?.textContent?.trim() 
    || document.title.split('|')[0].trim() || '';

  // Price: find "Rp" pattern in body text
  const priceMatch = bodyText.match(/Rp\s?(\d{1,3}(?:\.\d{3})*)/);
  const price = priceMatch ? `Rp${priceMatch[1]}` : '';

  // Rating: find score like "4.9" near rating section
  const ratingMatch = bodyText.match(/(\d\.\d)\s*dari\s*5/);
  const rating = ratingMatch ? ratingMatch[1] : '';

  // Sales: find "terjual" pattern
  const salesMatch = bodyText.match(/([\d.,]+(?:RB|rb|Rb|K|k|M|m)?\+?\s*terjual)/i);
  const sales = salesMatch ? salesMatch[1] : '';

  // Shop name: look for shop profile link or seller info
  const shopEl = document.querySelector('a[href*="/shop/"] span, [class*="shop-profile"] [class*="name"], [class*="seller-info"] [class*="name"]');
  let shop = shopEl?.textContent?.trim() || '';
  if (!shop) {
    // Fallback: look for "Toko" or "Seller" section
    const shopMatch = bodyText.match(/(?:Toko|Seller)[:\s]*([^\n]+)/i);
    shop = shopMatch ? shopMatch[1].trim() : '';
  }

  // Location: find "Dikirim dari" or city names
  const locMatch = bodyText.match(/(?:Dikirim\s*dari|Dikirim Dari)\s*([^\n]+)/i);
  let location = locMatch ? locMatch[1].trim() : '';

  // Availability
  const stockMatch = bodyText.match(/(Stok\s*Tersedia|Stok\s*Habis|Sisa\s*\d+)/i);
  const availability = stockMatch ? stockMatch[1] : 'Tersedia';

  return {
    product: { name, price, rating, sales, shop, location, availability, url: window.location.href },
    marketplace: 'shopee',
  };
}

// ============================================================
// Scrape Shopee search results (from search page)
// ============================================================
function scrapeShopeeSearch() {
  const products = [];

  const items = document.querySelectorAll('.shopee-search-item-result__item, li[class*="col-"][class*="item"]');

  for (const item of items) {
    const text = item.textContent || '';
    if (text.length < 20) continue;

    // Product name: .whitespace-normal.line-clamp-2
    const nameEl = item.querySelector('.whitespace-normal.line-clamp-2, [class*="line-clamp-2"]');
    let name = nameEl?.textContent?.trim() || '';
    if (!name) {
      const match = text.match(/^(.+?)(?=Rp)/);
      name = match ? match[1].trim().substring(0, 100) : '';
    }

    // Rating: NOT available in search results (extract first to remove from text)
    const ratingMatch = text.match(/\b(\d\.\d)\b/);
    const ratingText = ratingMatch ? ratingMatch[0] : '';
    const textWithoutRating = ratingMatch ? text.replace(ratingText, '') : text;

    // Price: Indonesian format "Rp29.000" or "Rp1.500.000"
    const priceMatch = textWithoutRating.match(/Rp\s?(\d{1,3}(?:\.\d{3})*)/);
    const price = priceMatch ? `Rp${priceMatch[1]}` : '';

    // Remove price from text before extracting sales
    const textClean = priceMatch ? textWithoutRating.replace(priceMatch[0], '') : textWithoutRating;

    // Sales: "4.91RB+ terjual", "464 terjual"
    const salesMatch = textClean.match(/([\d.,]+(?:RB|rb|Rb|K|k|M|m)?\+?\s*terjual)/i);
    const sales = salesMatch ? salesMatch[1] : '';

    // Stars: 0 (not available in search)
    const stars = 0;

    // Shop name: usually before the product name or in a specific element
    const shopEl = item.querySelector('[class*="shop"], [class*="seller"], [class*="item__shop"]');
    let shop = shopEl?.textContent?.trim() || '';

    // Location: just capture the city name
    const cities = 'Jakarta|Surabaya|Bandung|Tangerang|Bekasi|Semarang|Yogyakarta|Solo|Malang|Medan|Makassar|Denpasar|Bali|Depok|Bogor|Palembang|Batam|Pekanbaru|Balikpapan|Samarinda|Manado|Pontianak|Banjarmasin|Cimahi|Cirebon|Tasikmalaya|Serang|Karawang|Purwokerto|Madiun|Kediri|Blitar|Probolinggo|Pasuruan|Jember|Banyuwangi|Kudus|Pati|Rembang|Tuban|Lamongan|Gresik|Sidoarjo|Bangkalan|Pamekasan|Sumenep|Mataram|Lombok|Kupang|Ambon|Ternate|Jayapura|Sorong|Manokwari|Timika|Nabire|Fakfak|Bau-Bau|Kendari|Palu|Gorontalo|Mamuju|Palopo|Parepare|Bontang|Tarakan|Tanjung Selor|Singkawang';
    const locMatch = text.match(new RegExp(`(${cities})(?:\\s|Produk|$)`, 'i'));
    const location = locMatch ? locMatch[1] : '';

    // Product URL
    const linkEl = item.querySelector('a[href*="-i."]') || item.querySelector('a');
    const url = linkEl?.href || '';

    if (name && name.length > 3) {
      products.push({ name, price, stars, sales, shop, location, url });
    }
  }

  return { products, marketplace: 'shopee', query: document.querySelector('input[name="keyword"], input[type="search"], input.shopee-searchbar-input__input')?.value || '' };
}

// ============================================================
// Scrape Tokopedia search results
// ============================================================
function scrapeTokopediaSearch() {
  const products = [];
  const items = document.querySelectorAll('[data-testid="div-product-card"], [class*="css-1gk63xk"], [class*="product-card"]');

  for (const item of items) {
    const name = item.querySelector('[data-testid="linkProductName"], [class*="product-name"], a[title]')?.getAttribute('title') || item.querySelector('a')?.textContent?.trim() || '';
    const price = item.querySelector('[data-testid="linkProductPrice"], [class*="price"]')?.textContent?.trim() || '';
    const stars = item.querySelectorAll('svg[fill="#FD973B"], [class*="star"][class*="active"]').length;
    const sales = item.querySelector('[class*="sold"], [class*="terjual"]')?.textContent?.trim() || '';
    const shop = item.querySelector('[data-testid="linkProductShop"], [class*="shop-name"]')?.textContent?.trim() || '';
    const location = item.querySelector('[class*="location"]')?.textContent?.trim() || '';
    const url = item.querySelector('a')?.href || '';

    if (name) products.push({ name, price, stars, sales, shop, location, url });
  }

  return { products, marketplace: 'tokopedia', query: document.querySelector('input[name="q"], input[type="search"]')?.value || '' };
}

// ============================================================
// Debug page structure
// ============================================================
function debugPage() {
  const reviewEls = document.querySelectorAll('[class*="review"], [class*="rating"], [class*="comment"]');
  const reviewInfo = Array.from(reviewEls).slice(0, 15).map(el => ({
    tag: el.tagName, cls: el.className.toString().substring(0, 80), childCount: el.children.length,
    textLen: el.textContent?.length || 0, hasStars: !!el.querySelector('svg, [class*="star"]'),
  }));

  const container = document.querySelector('.product-ratings, [class*="product-rating"]');
  let containerChildren = [];
  if (container) {
    containerChildren = Array.from(container.children).slice(0, 10).map(el => ({
      tag: el.tagName, cls: el.className.toString().substring(0, 80), textLen: el.textContent?.length || 0,
      hasStars: !!el.querySelector('.shopee-rating-stars__lit, [class*="star"][class*="lit"]'),
      sampleText: el.textContent?.substring(0, 100) || '',
    }));
  }

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

  // Search results detection
  const searchItems = document.querySelectorAll('.shopee-search-item-result__item, li[class*="col-"][class*="item"]');
  const searchInfo = Array.from(searchItems).slice(0, 3).map(el => {
    // Get all child elements with their classes and text
    const children = Array.from(el.querySelectorAll('[class]')).slice(0, 20).map(c => ({
      tag: c.tagName, cls: c.className.toString().substring(0, 60), text: c.textContent?.substring(0, 80) || '',
    }));
    return {
      tag: el.tagName, cls: el.className.toString().substring(0, 80), textLen: el.textContent?.length || 0,
      sampleText: el.textContent?.substring(0, 200) || '',
      children,
    };
  });

  return {
    reviewElementCount: reviewEls.length,
    reviewElements: reviewInfo,
    textCandidates: candidates,
    containerChildren,
    searchItemCount: searchItems.length,
    searchItems: searchInfo,
  };
}

// ============================================================
// Sort and render search results
// ============================================================
function sortProducts(col) {
  if (sortState.col === col) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.col = col;
    sortState.asc = true;
  }

  const sorted = [...searchProducts].sort((a, b) => {
    let va, vb;
    if (col === 'price') {
      va = parseFloat(a.price.replace(/[^\d]/g, '')) || 0;
      vb = parseFloat(b.price.replace(/[^\d]/g, '')) || 0;
    } else if (col === 'sales') {
      va = parseSales(a.sales);
      vb = parseSales(b.sales);
    } else if (col === 'name') {
      va = a.name.toLowerCase();
      vb = b.name.toLowerCase();
      return sortState.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    } else if (col === 'location') {
      va = a.location.toLowerCase();
      vb = b.location.toLowerCase();
      return sortState.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    } else {
      return 0;
    }
    return sortState.asc ? va - vb : vb - va;
  });

  renderSearchTable(sorted);
  updateSortHeaders(col);
}

function parseSales(s) {
  if (!s) return 0;
  const match = s.match(/([\d.,]+)/);
  if (!match) return 0;
  let num = parseFloat(match[1].replace(/,/g, ''));
  if (s.includes('RB') || s.includes('rb') || s.includes('Rb')) num *= 1000;
  if (s.includes('K') || s.includes('k')) num *= 1000;
  if (s.includes('M') || s.includes('m')) num *= 1000000;
  return num;
}

function updateSortHeaders(activeCol) {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === activeCol) {
      th.classList.add(sortState.asc ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

function renderSearchTable(products) {
  const tbody = $('searchTable');
  tbody.innerHTML = products.map((p, i) => {
    return `<tr>
      <td class="no">${i + 1}</td>
      <td><a href="${p.url}" target="_blank">${truncate(p.name, 45)}</a></td>
      <td class="price">${p.price || '-'}</td>
      <td class="sales">${p.sales || '-'}</td>
      <td class="loc">${p.location || '-'}</td>
    </tr>`;
  }).join('');
}

// ============================================================
// Execute function in page context
// ============================================================
async function runInPage(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fn,
  });
  return results[0]?.result;
}

// ============================================================
// Detect page type and scrape accordingly
// ============================================================
async function scrape() {
  const btn = $('scrapeBtn');
  const status = $('status');
  const error = $('error');

  btn.disabled = true;
  btn.textContent = 'Scraping...';
  error.classList.add('hidden');
  status.classList.remove('hidden');
  status.textContent = 'Mendeteksi halaman...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';
    const isShopee = url.includes('shopee.co.id');
    const isTokopedia = url.includes('tokopedia.com');
    const isSearch = url.includes('/search') || url.includes('keyword=');
    const isProduct = url.includes('-i.') || url.includes('/product/');

    if (!isShopee && !isTokopedia) {
      throw new Error('Buka halaman Shopee atau Tokopedia dulu.');
    }

    let result;

    if (isSearch) {
      // Search results page
      status.textContent = 'Mengambil data produk dari hasil pencarian...';
      if (isShopee) result = await runInPage(scrapeShopeeSearch);
      else result = await runInPage(scrapeTokopediaSearch);

      if (!result || result.products.length === 0) {
        throw new Error('Tidak ditemukan produk. Pastikan halaman hasil pencarian terbuka.');
      }

      status.textContent = `${result.products.length} produk ditemukan. Menampilkan...`;
      renderSearchResults(result);

    } else if (isProduct) {
      // Product detail page - scrape both product info and reviews
      status.textContent = 'Mengambil data produk...';
      const productInfo = await runInPage(scrapeShopeeProduct);

      status.textContent = 'Mengambil review...';
      const reviewData = await runInPage(scrapeShopeeReviews);

      // Combine
      result = {
        product: productInfo.product,
        reviews: reviewData.reviews,
        marketplace: 'shopee',
      };

      if (result.reviews.length > 0) {
        // Send reviews for analysis
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
        renderProductResults(data, result.product);
      } else {
        renderProductResults(null, result.product);
      }

    } else {
      throw new Error('Buka halaman produk atau hasil pencarian Shopee/Tokopedia.');
    }

  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
    status.classList.add('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Scrape';
  }
}

// ============================================================
// Render search results
// ============================================================
function renderSearchResults(data) {
  $('idle').classList.add('hidden');
  $('searchResults').classList.remove('hidden');
  $('productResults').classList.add('hidden');

  $('searchQuery').textContent = data.query ? `"${data.query}"` : 'Hasil pencarian';
  $('searchCount').textContent = `${data.products.length} produk`;

  searchProducts = data.products;
  sortState = { col: null, asc: true };
  renderSearchTable(data.products);

  // Add sort click handlers
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.onclick = () => sortProducts(th.dataset.sort);
  });
}

// ============================================================
// Render product detail results
// ============================================================
function renderProductResults(data, product) {
  $('idle').classList.add('hidden');
  $('productResults').classList.remove('hidden');
  $('searchResults').classList.add('hidden');

  // Product info
  $('prodName').textContent = product.name || '-';
  $('prodPrice').textContent = product.price ? `Rp ${product.price}` : '-';
  $('prodRating').textContent = product.rating || '-';
  $('prodSales').textContent = product.sales || '-';
  $('prodShop').textContent = product.shop || '-';
  $('prodLocation').textContent = product.location || '-';
  $('prodAvailability').textContent = product.availability || '-';

  if (data) {
    $('prodReviewCount').textContent = data.total;
    const sentEl = $('prodSentiment');
    if (data.avgScore > 0.15) { sentEl.textContent = 'Positif'; sentEl.className = 'green'; }
    else if (data.avgScore < -0.15) { sentEl.textContent = 'Negatif'; sentEl.className = 'red'; }
    else { sentEl.textContent = 'Campur'; sentEl.className = 'yellow'; }

    // Themes
    if (data.themes?.length) {
      const max = Math.max(...data.themes.map(t => t.count));
      $('prodThemes').innerHTML = data.themes.map(t => {
        const pct = max > 0 ? (t.count / max * 100) : 0;
        const color = t.status === 'positive' ? '#22c55e' : t.status === 'negative' ? '#ef4444' : '#eab308';
        return `<div class="theme-row"><span class="theme-name">${t.name}</span><div class="theme-track"><div class="theme-fill" style="width:${pct}%;background:${color}"></div></div><span class="theme-count">${t.count}</span></div>`;
      }).join('');
    }

    $('prodInsights').innerHTML = (data.insights || []).map(i => `<li class="insight-item">${i}</li>`).join('');
  } else {
    $('prodReviewCount').textContent = '0';
    $('prodSentiment').textContent = '-';
    $('prodThemes').innerHTML = '';
    $('prodInsights').innerHTML = '';
  }
}

function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// ============================================================
// Save to Supabase
// ============================================================
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

// ============================================================
// Debug handler
// ============================================================
async function debugPageHandler() {
  const status = $('status');
  const error = $('error');
  status.classList.remove('hidden');
  error.classList.add('hidden');
  status.textContent = 'Mengambil debug info...';

  try {
    const info = await runInPage(debugPage);
    let html = `<b>Review elements:</b> ${info.reviewElementCount}<br>`;
    html += `<b>Search items:</b> ${info.searchItemCount}<br>`;
    if (info.searchItemCount > 0) {
      html += `<b>Search samples:</b><br>${info.searchItems.map(s =>
        `<div style="margin-bottom:8px"><b>${s.tag}.${s.cls}</b> (${s.textLen}chars)<br>` +
        `<div style="font-size:10px;color:#666;margin-left:8px">${s.sampleText}</div>` +
        `<div style="margin-left:8px">Children:<br>${s.children.map(c => `${c.tag}.${c.cls}: "${c.text}"`).join('<br>')}</div></div>`
      ).join('')}<br>`;
    }
    html += `<b>Container children:</b><br>${info.containerChildren.map(c => `${c.tag}.${c.cls} (${c.textLen}chars, stars:${c.hasStars}) "${c.sampleText}"`).join('<br>')}<br>`;
    html += `<b>Review classes:</b><br>${info.reviewElements.map(e => `${e.tag}.${e.cls} (${e.textLen}chars, stars:${e.hasStars})`).join('<br>')}<br>`;
    html += `<b>Text candidates:</b><br>${info.textCandidates.map(c => `${c.tag}.${c.cls}: "${c.text}"`).join('<br>')}`;
    status.innerHTML = html;
  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
    status.classList.add('hidden');
  }
}

// ============================================================
// Reset UI
// ============================================================
function resetUI() {
  $('idle').classList.remove('hidden');
  $('searchResults').classList.add('hidden');
  $('productResults').classList.add('hidden');
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
