# 11 - Shipping Cost Estimator

Web tool to estimate and compare shipping costs across major Indonesian couriers.

## Features

- Compare costs from JNE, J&T, SiCepat, AnterAja, GoSend
- COD fee calculation
- Delivery time estimates
- Cheapest and fastest courier recommendations
- 18 major Indonesian cities
- Light/dark theme, responsive design

## Usage

```bash
npm install
node server.js
```

Open http://localhost:3480

## API

POST /api/calculate
```json
{
  "weight": 2,
  "origin": "Jakarta",
  "destination": "Surabaya",
  "cod": true
}
```

GET /api/cities - List available cities

## Tech

- Node.js + Express
- Vanilla HTML/CSS/JS frontend
- No external dependencies (beyond Express)
