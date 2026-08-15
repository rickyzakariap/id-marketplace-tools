# Scheme - ID Marketplace Tools

## Data Models

### Product

```typescript
interface Product {
  id: string;              // UUID
  name: string;            // "Kemeja Flanel Pria"
  price: number;           // 185000 (in IDR)
  category: string;        // "Fashion"
  description?: string;    // Optional
  images?: string[];       // URLs
  stock?: number;          // Available quantity
  createdAt: Date;
  updatedAt: Date;
}
```

### Marketplace

```typescript
interface Marketplace {
  id: string;              // "shopee", "tokopedia", etc.
  name: string;            // "Shopee"
  commissionRate: number;  // 5.0 (percentage)
  adminFee: number;        // 1000 (flat fee in IDR)
  paymentFee: number;      // 2.0 (percentage)
  serviceFee: number;      // 0 (percentage)
  color: string;           // "#ee4d2d" (brand color)
  logo?: string;           // URL
}
```

### FeeBreakdown

```typescript
interface FeeBreakdown {
  productName: string;     // "Kemeja Flanel Pria"
  price: number;           // 185000
  marketplace: string;     // "Shopee"
  commission: number;      // 9250 (5% of 185000)
  adminFee: number;        // 1000
  paymentFee: number;      // 3700 (2% of 185000)
  serviceFee: number;      // 0
  totalFees: number;       // 13950
  netProfit: number;       // 171050
  profitMargin: number;    // 92.46 (percentage)
}
```

### PriceRecommendation

```typescript
interface PriceRecommendation {
  productId: string;
  marketplace: string;
  currentPrice: number;    // 185000
  recommendedPrice: number; // 179000
  minPrice: number;        // 165000 (break-even)
  maxPrice: number;        // 199000 (market ceiling)
  competitorAvg: number;   // 180000
  demandScore: number;     // 0.85 (0-1)
  confidence: number;      // 0.92 (0-1)
  reasoning: string;       // "Competitor avg is 180k, demand is high"
}
```

### Listing

```typescript
interface Listing {
  productId: string;
  marketplace: string;
  title: string;           // "Kemeja Flanel Pria Premium Slim Fit"
  description: string;     // HTML-formatted
  keywords: string[];      // ["kemeja", "flanel", "pria", "slim fit"]
  category: string;        // "Fashion > Kemeja"
  attributes: Record<string, string>; // {"size": "M", "color": "Blue"}
  seoScore: number;        // 0.87 (0-1)
}
```

### StockUpdate

```typescript
interface StockUpdate {
  productId: string;
  marketplace: string;
  oldStock: number;        // 50
  newStock: number;        // 45
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;          // If failed
}
```

### Review

```typescript
interface Review {
  id: string;
  productId: string;
  marketplace: string;
  rating: number;          // 1-5
  text: string;            // "Produk bagus, pengiriman cepat"
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];      // ["bagus", "cepat"]
  createdAt: Date;
}
```

## Database Schema (PostgreSQL)

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) NOT NULL CHECK (price >= 0),
  category VARCHAR(100),
  description TEXT,
  images JSONB DEFAULT '[]',
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplaces table
CREATE TABLE marketplaces (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  admin_fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
  payment_fee DECIMAL(5, 2) NOT NULL DEFAULT 0,
  service_fee DECIMAL(5, 2) NOT NULL DEFAULT 0,
  color VARCHAR(7),
  logo VARCHAR(255)
);

-- Fee calculations (cache)
CREATE TABLE fee_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id VARCHAR(50) REFERENCES marketplaces(id),
  commission DECIMAL(15, 2) NOT NULL,
  admin_fee DECIMAL(15, 2) NOT NULL,
  payment_fee DECIMAL(15, 2) NOT NULL,
  service_fee DECIMAL(15, 2) NOT NULL,
  total_fees DECIMAL(15, 2) NOT NULL,
  net_profit DECIMAL(15, 2) NOT NULL,
  profit_margin DECIMAL(5, 2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, marketplace_id)
);

-- Price recommendations
CREATE TABLE price_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id VARCHAR(50) REFERENCES marketplaces(id),
  current_price DECIMAL(15, 2) NOT NULL,
  recommended_price DECIMAL(15, 2) NOT NULL,
  min_price DECIMAL(15, 2) NOT NULL,
  max_price DECIMAL(15, 2) NOT NULL,
  competitor_avg DECIMAL(15, 2),
  demand_score DECIMAL(3, 2),
  confidence DECIMAL(3, 2),
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id VARCHAR(50) REFERENCES marketplaces(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  keywords JSONB DEFAULT '[]',
  category VARCHAR(100),
  attributes JSONB DEFAULT '{}',
  seo_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, marketplace_id)
);

-- Stock updates log
CREATE TABLE stock_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id VARCHAR(50) REFERENCES marketplaces(id),
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id VARCHAR(50) REFERENCES marketplaces(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  keywords JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_fee_calculations_product ON fee_calculations(product_id);
CREATE INDEX idx_listings_product ON listings(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment);
```

## API Endpoints

### Fee Calculator

```
POST /api/v1/fees/calculate
Request:
{
  "products": [
    { "name": "Kemeja Flanel", "price": 185000 }
  ],
  "marketplaces": ["shopee", "tokopedia"] // optional, default all
}

Response:
{
  "results": [
    {
      "productName": "Kemeja Flanel",
      "price": 185000,
      "marketplace": "Shopee",
      "commission": 9250,
      "adminFee": 1000,
      "paymentFee": 3700,
      "serviceFee": 0,
      "totalFees": 13950,
      "netProfit": 171050,
      "profitMargin": 92.46
    }
  ]
}
```

### Price Optimizer

```
POST /api/v1/prices/optimize
Request:
{
  "productId": "uuid",
  "marketplace": "shopee",
  "targetMargin": 20 // percentage
}

Response:
{
  "recommendation": {
    "currentPrice": 185000,
    "recommendedPrice": 179000,
    "minPrice": 165000,
    "maxPrice": 199000,
    "competitorAvg": 180000,
    "demandScore": 0.85,
    "confidence": 0.92,
    "reasoning": "Competitor avg is 180k, demand is high"
  }
}
```

### Listing Generator

```
POST /api/v1/listings/generate
Request:
{
  "productName": "Kemeja Flanel Pria",
  "category": "Fashion",
  "features": ["Premium quality", "Slim fit", "100% cotton"],
  "marketplace": "shopee"
}

Response:
{
  "listing": {
    "title": "Kemeja Flanel Pria Premium Slim Fit 100% Cotton",
    "description": "<p>Kemeja flanel pria premium...</p>",
    "keywords": ["kemeja", "flanel", "pria", "slim fit", "cotton"],
    "seoScore": 0.87
  }
}
```

### Stock Sync

```
POST /api/v1/stock/sync
Request:
{
  "productId": "uuid",
  "marketplaces": ["shopee", "tokopedia"],
  "newStock": 45
}

Response:
{
  "updates": [
    {
      "marketplace": "Shopee",
      "oldStock": 50,
      "newStock": 45,
      "status": "success"
    },
    {
      "marketplace": "Tokopedia",
      "oldStock": 50,
      "newStock": 45,
      "status": "success"
    }
  ]
}
```

## State Management (React)

```typescript
// Zustand store
interface AppState {
  // Products
  products: Product[];
  selectedProducts: string[];
  
  // Fee calculations
  feeResults: FeeBreakdown[];
  isCalculating: boolean;
  
  // Price recommendations
  recommendations: PriceRecommendation[];
  
  // Listings
  listings: Listing[];
  
  // Actions
  addProduct: (product: Product) => void;
  calculateFees: (products: Product[]) => Promise<void>;
  getRecommendations: (productId: string) => Promise<void>;
  generateListing: (productId: string, marketplace: string) => Promise<void>;
}
```

## Error Codes

```typescript
enum ErrorCode {
  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_PRICE = 'INVALID_PRICE',
  
  // Marketplace
  MARKETPLACE_NOT_FOUND = 'MARKETPLACE_NOT_FOUND',
  MARKETPLACE_API_ERROR = 'MARKETPLACE_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Product
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  DUPLICATE_PRODUCT = 'DUPLICATE_PRODUCT',
  
  // Stock
  STOCK_SYNC_FAILED = 'STOCK_SYNC_FAILED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  
  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

## Configuration

```typescript
interface Config {
  // API
  apiBaseUrl: string;          // "http://localhost:3000/api/v1"
  apiTimeout: number;          // 30000 (ms)
  
  // Marketplace credentials (env vars)
  shopeeApiKey?: string;
  tokopediaApiKey?: string;
  
  // Features
  enablePriceOptimizer: boolean;  // true
  enableStockSync: boolean;       // false (beta)
  
  // Limits
  maxProductsPerBatch: number;    // 1000
  maxApiCallsPerMinute: number;   // 60
}
```

## File Formats

### CSV Input (Fee Calculator)

```csv
name,price
Kemeja Flanel Pria,185000
Celana Chino Slim Fit,159000
```

### CSV Output (Fee Calculator)

```csv
Product,Price,Marketplace,Commission,Admin Fee,Payment Fee,Service Fee,Total Fees,Net Profit,Margin %
Kemeja Flanel Pria,185000,Shopee,9250,1000,3700,0,13950,171050,92.46
Kemeja Flanel Pria,185000,Tokopedia,8325,1000,2775,0,12100,172900,93.46
```

### JSON Input (Web API)

```json
{
  "products": [
    {
      "name": "Kemeja Flanel Pria",
      "price": 185000,
      "category": "Fashion"
    }
  ]
}
```

### JSON Output (Web API)

```json
{
  "success": true,
  "data": {
    "results": [...]
  },
  "meta": {
    "timestamp": "2026-08-03T11:30:00Z",
    "version": "1.0.0"
  }
}
```