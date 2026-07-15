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

    // Price: extract from dedicated element first, then fallback to regex
    const priceEl = item.querySelector('[class*="price"]:not([class*="old"]), span[class*="ooOxS"]');
    let price = '';
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const pm = priceText.match(/Rp\s?(\d{1,3}(?:\.\d{3})*)/);
      price = pm ? `Rp${pm[1]}` : '';
    }
    if (!price) {
      const priceMatch = text.match(/Rp\s?(\d{1,3}(?:\.\d{3})*)/);
      price = priceMatch ? `Rp${priceMatch[1]}` : '';
    }

    // Rating + Sales: extract from individual elements first
    let ratingText = '';
    let sales = '';

    // Try dedicated rating element (Shopee uses aria-hidden spans with score)
    const ratingEl = item.querySelector('[class*="rating"]:not([class*="count"]), [class*="star-rating"]');
    if (ratingEl) {
      const rText = ratingEl.textContent.trim();
      const rm = rText.match(/^(\d\.\d)/);
      if (rm) ratingText = rm[1];
    }

    // Try dedicated sales/terjual element
    const salesEl = item.querySelector('[class*="sold"], [class*="terjual"]');
    if (salesEl) {
      const sText = salesEl.textContent.trim();
      const sm = sText.match(/([\d.,]+(?:RB|rb|Rb|K|k|M|m)\+?\s*terjual)/i)
        || sText.match(/([\d.,]+\s*terjual)/i);
      if (sm) sales = sm[1];
    }

    // Fallback: parse from concatenated text
    if (!sales) {
      // Rating+Sales with suffix (e.g. "4.81RB+ terjual" — rating is always 1-5)
      const ratedSalesMatch = text.match(/([1-5]\.\d{1,2}(?:RB|rb|Rb|K|k|M|m)\+?\s*terjual)/i);
      if (ratedSalesMatch) {
        sales = ratedSalesMatch[1];
      } else {
        // Split "X.XNNN terjual" into rating + sales (e.g. "4.8111 terjual")
        const splitMatch = text.match(/([1-5]\.\d)(\d+\s*terjual)/);
        if (splitMatch) {
          ratingText = ratingText || splitMatch[1];
          sales = splitMatch[2];
        } else {
          // Plain sales count (e.g. "464 terjual")
          const salesOnly = text.match(/([\d.,]+\s*terjual)/i);
          sales = salesOnly ? salesOnly[1] : '';
        }
      }
    }

    // Remove price text before looking for location to avoid false matches
    const textClean = price ? text.replace(price, '') : text;

    // Stars: 0 (not available in search)
    const stars = 0;

    // Shop name
    const shopEl = item.querySelector('[class*="shop"], [class*="seller"], [class*="item__shop"]');
    let shop = shopEl?.textContent?.trim() || '';

    // Location: match city names
    const cities = 'Jakarta|Surabaya|Bandung|Tangerang|Bekasi|Semarang|Yogyakarta|Solo|Malang|Medan|Makassar|Denpasar|Bali|Depok|Bogor|Palembang|Batam|Pekanbaru|Balikpapan|Samarinda|Manado|Pontianak|Banjarmasin|Cimahi|Cirebon|Tasikmalaya|Serang|Karawang|Purwokerto|Madiun|Kediri|Blitar|Probolinggo|Pasuruan|Jember|Banyuwangi|Kudus|Pati|Rembang|Tuban|Lamongan|Gresik|Sidoarjo|Bangkalan|Pamekasan|Sumenep|Mataram|Lombok|Kupang|Ambon|Ternate|Jayapura|Sorong|Manokwari|Timika|Nabire|Fakfak|Bau-Bau|Kendari|Palu|Gorontalo|Mamuju|Palopo|Parepare|Bontang|Tarakan|Tanjung Selor|Singkawang';
    const locMatch = textClean.match(new RegExp(`(${cities})(?:\\s|Produk|$)`, 'i'));
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
// Scrape Tokopedia product details (from product detail page)
// ============================================================
function scrapeTokopediaProduct() {
  const bodyText = document.body.innerText;

  // Product name
  const name = document.querySelector('[data-testid="lbl-product-name"], h1')?.textContent?.trim()
    || document.title.split('|')[0].trim() || '';

  // Price
  const priceEl = document.querySelector('[data-testid="lbl-price-product"], [class*="price"]');
  let price = priceEl?.textContent?.trim() || '';
  const priceMatch = price.match(/Rp\s?([\d.,]+)/);
  if (priceMatch) price = `Rp${priceMatch[1]}`;

  // Rating
  const ratingMatch = bodyText.match(/(\d\.\d)\s*dari\s*5/);
  const rating = ratingMatch ? ratingMatch[1] : '';

  // Sales: "terjual" or "terjual 61"
  const salesMatch = bodyText.match(/([\d.,]+(?:RB|rb|Rb|K|k|M|m)?\+?\s*terjual)/i);
  const sales = salesMatch ? salesMatch[1] : '';

  // Shop name: Tokopedia uses data-testid or shop link
  const shopEl = document.querySelector('[data-testid="llbPDPFooterShopName"], [data-testid="linkProductShop"], a[href*="/shop/"] span, [class*="shop-name"]');
  let shop = shopEl?.textContent?.trim() || '';
  if (!shop) {
    // Fallback: find "Toko" section
    const shopMatch = bodyText.match(/Toko[:\s]*([^\n]+)/i);
    shop = shopMatch ? shopMatch[1].trim() : '';
  }

  // Location: "Dikirim dari" or city
  const locMatch = bodyText.match(/(?:Dikirim\s*dari|Dikirim Dari)\s*([^\n]+)/i);
  let location = locMatch ? locMatch[1].trim() : '';
  if (!location) {
    const cities = 'Jakarta|Surabaya|Bandung|Tangerang|Bekasi|Semarang|Yogyakarta|Solo|Malang|Medan|Makassar|Denpasar|Bali|Depok|Bogor|Palembang|Batam|Pekanbaru|Balikpapan|Samarinda';
    const cityMatch = bodyText.match(new RegExp(`KOTA\\s+(${cities})`, 'i'));
    if (cityMatch) location = cityMatch[1];
  }

  // Availability
  const stockMatch = bodyText.match(/(Stok\s*Tersedia|Stok\s*Habis|Sisa\s*\d+)/i);
  const availability = stockMatch ? stockMatch[1] : 'Tersedia';

  return {
    product: { name, price, rating, sales, shop, location, availability, url: window.location.href },
    marketplace: 'tokopedia',
  };
}

// ============================================================
// Scrape Tokopedia product reviews (from product detail page)
// ============================================================
function scrapeTokopediaReviews() {
  const reviews = [];
  const items = document.querySelectorAll(
    '[data-testid="review-card"], [data-testid="comment-review-card"], [class*="review-item"], [class*="css-1k1a7gr"]'
  );

  items.forEach(item => {
    const textEl = item.querySelector(
      '[data-testid="review-content"], [data-testid="comment-review"], [class*="content"], [class*="text"], [class*="comment"]'
    );
    const text = textEl?.textContent?.trim() || item.textContent?.trim() || '';
    const stars = item.querySelectorAll(
      '[data-testid="star-icon"].active, svg[fill="#FD973B"], [class*="star"][class*="active"]'
    );
    const rating = stars.length || null;

    if (text && text.length > 10 && text.length < 2000) {
      reviews.push({ text: text.substring(0, 500), rating });
    }
  });

  const name = document.querySelector('[data-testid="lbl-product-name"], h1')?.textContent?.trim() || document.title.split('|')[0].trim();
  return { reviews, product: { name, url: window.location.href }, marketplace: 'tokopedia' };
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
      const productFn = isTokopedia ? scrapeTokopediaProduct : scrapeShopeeProduct;
      const productInfo = await runInPage(productFn);

      status.textContent = 'Mengambil review...';
      const reviewFn = isTokopedia ? scrapeTokopediaReviews : scrapeShopeeReviews;
      const reviewData = await runInPage(reviewFn);

      // Combine
      result = {
        product: productInfo.product,
        reviews: reviewData.reviews,
        marketplace: isTokopedia ? 'tokopedia' : 'shopee',
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
// Export helpers
// ============================================================
function showExportMsg(msg, isError) {
  ['exportStatus', 'exportStatus2'].forEach(id => {
    const el = $(id);
    if (el) {
      el.classList.remove('hidden');
      el.textContent = msg;
      el.style.color = isError ? '#f85149' : 'rgba(255,255,255,0.4)';
      if (!isError) setTimeout(() => el.classList.add('hidden'), 3000);
    }
  });
}

// ============================================================
// Export: CSV download
// ============================================================
function exportCSV() {
  try {
    const data = searchProducts.length > 0 ? searchProducts : (lastResults?.results || []);
    if (!data.length) { showExportMsg('Tidak ada data'); return; }

    const isSearch = searchProducts.length > 0;
    const headers = isSearch ? ['No','Produk','Harga','Terjual','Lokasi'] : ['Review','Rating','Sentimen','Score','Tema'];
    const rows = data.map((d, i) => isSearch
      ? [i+1, `"${(d.name||'').replace(/"/g,'""')}"`, d.price||'', d.sales||'', d.location||'']
      : [`"${(d.text||'').replace(/"/g,'""')}"`, d.rating||'', d.sentiment||'', d.score||'', (d.themes||[]).join('; ')]
    );

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showExportMsg('CSV downloaded');
  } catch (err) {
    showExportMsg('CSV error: ' + err.message, true);
  }
}

// ============================================================
// Export: Google Sheets (via backend proxy)
// ============================================================
async function exportSheets() {
  try {
    const data = searchProducts.length > 0 ? searchProducts : (lastResults?.results || []);
    if (!data.length) { showExportMsg('Tidak ada data'); return; }

    const isSearch = searchProducts.length > 0;
    const headers = isSearch ? ['No','Produk','Harga','Terjual','Lokasi','URL'] : ['Review','Rating','Sentimen','Score','Tema'];
    const rows = data.map((d, i) => isSearch
      ? [String(i+1), d.name||'', d.price||'', d.sales||'', d.location||'', d.url||'']
      : [d.text||'', String(d.rating||''), d.sentiment||'', String(d.score||''), (d.themes||[]).join(', ')]
    );

    showExportMsg('Mengirim ke Sheets...');
    const resp = await fetch(`${BACKEND}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, rows, title: isSearch ? `Search: ${$('searchQuery')?.textContent || ''}` : `Product: ${lastResults?.product?.name || ''}` }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || resp.status); }
    const result = await resp.json();
    showExportMsg('Sheets: berhasil');
    if (result.url) window.open(result.url, '_blank');
  } catch (err) {
    showExportMsg('Sheets: ' + err.message, true);
  }
}

// ============================================================
// Save to Supabase
// ============================================================
async function saveToSupabase() {
  try {
    // Search results mode
    if (searchProducts.length > 0) {
      showExportMsg('Mengirim produk ke Supabase...');
      const resp = await fetch(`${BACKEND}/api/save-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: searchProducts, query: document.getElementById('searchQuery')?.textContent || '' }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || resp.status); }
      const data = await resp.json();
      showExportMsg(`Supabase: ${data.count} produk tersimpan`);
      return;
    }

    // Product review mode
    if (!lastResults) { showExportMsg('Tidak ada data', true); return; }
    showExportMsg('Mengirim review ke Supabase...');
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
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || resp.status); }
    const data = await resp.json();
    showExportMsg(`Supabase: ${data.count} review tersimpan`);
  } catch (err) {
    showExportMsg('Supabase: ' + err.message, true);
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
  ['exportStatus', 'exportStatus2'].forEach(id => { const el = $(id); if (el) el.classList.add('hidden'); });
  $('status').classList.add('hidden');
  $('error').classList.add('hidden');
  searchProducts = [];
  lastResults = null;
}

document.addEventListener('DOMContentLoaded', () => {
  $('scrapeBtn').addEventListener('click', scrape);
  $('debugBtn').addEventListener('click', debugPageHandler);
});
