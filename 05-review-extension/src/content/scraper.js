// Content script - scrape reviews from marketplace pages
// Uses broad selectors that adapt to layout changes

function detectMarketplace() {
  const host = window.location.hostname;
  if (host.includes('shopee')) return 'shopee';
  if (host.includes('tokopedia')) return 'tokopedia';
  return null;
}

function scrapeShopeeReviews() {
  const reviews = [];

  // Strategy 1: Look for rating stars + text blocks near them
  // Shopee reviews typically have star icons followed by text
  const allElements = document.querySelectorAll('[class*="rating"], [class*="review"], [class*="comment"]');
  
  // Strategy 2: Find text blocks that look like reviews
  // Reviews are usually in list items or divs with specific patterns
  const candidates = document.querySelectorAll(
    '.shopee-product-rating__list-item, ' +
    '[class*="product-rating"] [class*="item"], ' +
    '[class*="rating__list"] > div, ' +
    '[class*="review-item"], ' +
    '[class*="comment-item"], ' +
    '.e2R4YJ, ' +
    '.Zmy311, ' +
    '[class*="karmaj5"], ' +
    '[class*="DqQJiB"]'
  );

  candidates.forEach(item => {
    // Try to find text content
    const textEl = item.querySelector(
      '[class*="content"], [class*="text"], [class*="comment"], ' +
      '.shopee-product-rating__content, .Zmy311, [class*="karmaj5"]'
    );
    const text = textEl?.textContent?.trim() || item.textContent?.trim() || '';
    
    // Try to find rating (count filled stars)
    const stars = item.querySelectorAll(
      '[class*="star"][class*="active"], [class*="star"][class*="on"], ' +
      '.icon-rating-solid--on, svg[fill="#EE4D2D"], svg[fill*="FF"]'
    );
    const rating = stars.length || null;

    // Filter: must have reasonable text length (not UI labels)
    if (text && text.length > 10 && text.length < 2000) {
      reviews.push({ text: text.substring(0, 500), rating });
    }
  });

  // Strategy 3: If still no reviews, try to find by DOM structure
  if (reviews.length === 0) {
    // Look for any container that has multiple similar children (likely a review list)
    const lists = document.querySelectorAll('ul, ol, [class*="list"]');
    for (const list of lists) {
      const children = list.children;
      if (children.length < 3) continue;
      
      // Check if children have similar structure (review pattern)
      const firstChild = children[0];
      const hasStars = firstChild.querySelector('[class*="star"], svg[fill*="FF"]');
      const hasText = firstChild.textContent?.length > 20;
      
      if (hasStars && hasText) {
        for (const child of children) {
          const text = child.textContent?.trim() || '';
          const starCount = child.querySelectorAll('[class*="star"][class*="on"], svg[fill="#EE4D2D"]').length;
          if (text.length > 10 && text.length < 2000) {
            reviews.push({ text: text.substring(0, 500), rating: starCount || null });
          }
        }
        break;
      }
    }
  }

  return reviews;
}

function scrapeTokopediaReviews() {
  const reviews = [];
  const items = document.querySelectorAll(
    '[data-testid="review-card"], ' +
    '[class*="review-item"], ' +
    '[class*="css-1k1a7gr"]'
  );

  items.forEach(item => {
    const textEl = item.querySelector(
      '[data-testid="review-content"], ' +
      '[class*="content"], [class*="text"], [class*="comment"]'
    );
    const text = textEl?.textContent?.trim() || item.textContent?.trim() || '';
    const stars = item.querySelectorAll(
      '[data-testid="star-icon"].active, ' +
      'svg[fill="#FD973B"], [class*="star"][class*="active"]'
    );
    const rating = stars.length || null;

    if (text && text.length > 10 && text.length < 2000) {
      reviews.push({ text: text.substring(0, 500), rating });
    }
  });

  return reviews;
}

function getProductInfo(marketplace) {
  if (marketplace === 'shopee') {
    const name = document.querySelector(
      '.attKMx, [class*="product-briefing"] [class*="product-title"], ' +
      'h1[class*="product"], [class*="vWBHjg"]'
    )?.textContent?.trim() || document.title.split('|')[0].trim();
    return { name, url: window.location.href };
  }
  if (marketplace === 'tokopedia') {
    const name = document.querySelector(
      '[data-testid="lbl-product-name"], h1'
    )?.textContent?.trim() || document.title.split('|')[0].trim();
    return { name, url: window.location.href };
  }
  return { name: document.title, url: window.location.href };
}

// Debug: return page info for troubleshooting
function getDebugInfo() {
  // Find review-like elements
  const reviewEls = document.querySelectorAll('[class*="review"], [class*="rating"], [class*="comment"]');
  const reviewInfo = Array.from(reviewEls).slice(0, 15).map(el => ({
    tag: el.tagName,
    cls: el.className.substring(0, 80),
    childCount: el.children.length,
    textLen: el.textContent?.length || 0,
    hasStars: !!el.querySelector('svg, [class*="star"]'),
  }));

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

  return {
    url: window.location.href,
    title: document.title,
    hasReviewElements: reviewEls.length > 0,
    reviewElementCount: reviewEls.length,
    reviewElements: reviewInfo,
    textCandidates: candidates,
    bodyLength: document.body.innerHTML.length,
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'ping') {
    sendResponse({ ok: true });
    return;
  }

  if (msg.action === 'scrape') {
    const marketplace = detectMarketplace();
    if (!marketplace) {
      sendResponse({ error: 'Marketplace tidak terdeteksi. Buka halaman produk Shopee atau Tokopedia.' });
      return;
    }

    let reviews;
    if (marketplace === 'shopee') {
      reviews = scrapeShopeeReviews();
    } else if (marketplace === 'tokopedia') {
      reviews = scrapeTokopediaReviews();
    }

    const product = getProductInfo(marketplace);

    sendResponse({
      marketplace,
      product,
      reviews,
      count: reviews.length,
      url: window.location.href,
    });
  }

  if (msg.action === 'debug') {
    sendResponse(getDebugInfo());
  }
});
