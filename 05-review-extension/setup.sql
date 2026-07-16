CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  marketplace TEXT,
  product_name TEXT,
  product_url TEXT,
  review_text TEXT,
  rating INTEGER,
  sentiment TEXT,
  score REAL,
  themes TEXT[],
  positive_words TEXT[],
  negative_words TEXT[],
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON reviews FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL DEFAULT 'unknown',
  product_name TEXT,
  price TEXT,
  sales TEXT,
  rating REAL,
  shop TEXT,
  location TEXT,
  product_url TEXT,
  search_query TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_url)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
