# Scheme

## Data Model
```json
{
  "id": "uuid",
  "product_name": "Kaos Polos Premium",
  "marketplace": "tokopedia",
  "title": "Kaos Polos Premium Katun Combed 30s",
  "price": 89000,
  "stock": 50,
  "description": "Kaos polos bahan katun combed 30s...",
  "created_at": "2026-08-04T10:00:00Z"
}
```

## API Endpoints

### GET /api/listings
Response: array of listing objects

### POST /api/listings
Body: { product_name, marketplace, title, price, stock, description }
Response: created listing with id

### PUT /api/listings/:id
Body: partial update
Response: updated listing

### DELETE /api/listings/:id
Response: { success: true }

### POST /api/check
Body: { product_name: "Kaos Polos Premium" }
Response:
```json
{
  "product_name": "Kaos Polos Premium",
  "listings": [...],
  "consistency": {
    "score": 75,
    "fields": {
      "price": { "consistent": false, "values": [...], "outlier": "shopee" },
      "title": { "consistent": true, "values": [...] },
      "stock": { "consistent": false, "values": [...] }
    }
  }
}
```

### GET /api/products
Response: array of unique product names

### POST /api/seed
Response: { count: 12 } (seeded example data)