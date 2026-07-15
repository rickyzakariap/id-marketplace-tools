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
