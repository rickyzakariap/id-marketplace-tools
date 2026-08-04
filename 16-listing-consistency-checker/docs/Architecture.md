# Architecture

## Tech Stack
- Backend: Node.js + Express
- Frontend: Single HTML file with inline CSS/JS
- Storage: JSON file (data/listings.json)
- No external dependencies beyond Express

## Folder Structure
```
16-listing-consistency-checker/
├── server.js
├── package.json
├── public/
│   └── index.html
└── data/
    └── listings.json
```

## API Design
- GET /api/listings - get all listings
- POST /api/listings - add a listing
- PUT /api/listings/:id - update a listing
- DELETE /api/listings/:id - delete a listing
- POST /api/check - analyze consistency for a product group
- GET /api/products - get unique product names
- POST /api/seed - seed example data

## Deployment
- localhost:3616
- Single port, Express serves static files