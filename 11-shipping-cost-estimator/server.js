const express = require('express');
const path = require('path');
const app = express();
const PORT = 3480;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Indonesian city zones (simplified shipping zones)
const ZONES = {
  'jakarta': 'java-main',
  'surabaya': 'java-main',
  'bandung': 'java-main',
  'semarang': 'java-main',
  'yogyakarta': 'java-main',
  'malang': 'java-main',
  'medan': 'sumatra',
  'palembang': 'sumatra',
  'pekanbaru': 'sumatra',
  'lampung': 'sumatra',
  'makassar': 'sulawesi',
  'manado': 'sulawesi',
  'pontianak': 'kalimantan',
  'banjarmasin': 'kalimantan',
  'denpasar': 'bali-nusa',
  'jayapura': 'papua',
  'ambon': 'maluku',
  'mataram': 'bali-nusa'
};

// Zone pairs for rate calculation
const ZONE_PAIRS = {
  'java-main:java-main': 1.0,
  'java-main:sumatra': 1.4,
  'java-main:bali-nusa': 1.3,
  'java-main:kalimantan': 1.5,
  'java-main:sulawesi': 1.8,
  'java-main:maluku': 2.2,
  'java-main:papua': 2.5,
  'sumatra:java-main': 1.4,
  'sumatra:sumatra': 1.2,
  'sumatra:bali-nusa': 1.5,
  'sumatra:kalimantan': 1.6,
  'sumatra:sulawesi': 2.0,
  'bali-nusa:java-main': 1.3,
  'bali-nusa:bali-nusa': 1.0,
  'bali-nusa:sulawesi': 1.6,
  'kalimantan:java-main': 1.5,
  'kalimantan:sulawesi': 1.7,
  'sulawesi:java-main': 1.8,
  'sulawesi:sulawesi': 1.2,
  'papua:java-main': 2.5
};

// Courier rate structures (Rp per kg, with base rate)
const COURIERS = {
  jne: {
    name: 'JNE',
    baseRate: 8000,
    perKg: 4000,
    zoneMultipliers: { 'java-main': 1.0, 'sumatra': 1.3, 'bali-nusa': 1.2, 'kalimantan': 1.5, 'sulawesi': 1.7, 'maluku': 2.0, 'papua': 2.3 },
    codFee: 0.025,
    minCodFee: 5000,
    deliveryDays: { same: '1-2', nearby: '2-3', far: '3-5', veryFar: '5-7' },
    codAvailable: true,
    services: ['REG', 'OKE', 'YES']
  },
  jnt: {
    name: 'J&T',
    baseRate: 7000,
    perKg: 3500,
    zoneMultipliers: { 'java-main': 1.0, 'sumatra': 1.25, 'bali-nusa': 1.15, 'kalimantan': 1.45, 'sulawesi': 1.65, 'maluku': 1.9, 'papua': 2.2 },
    codFee: 0.02,
    minCodFee: 4000,
    deliveryDays: { same: '1-2', nearby: '2-3', far: '3-5', veryFar: '5-8' },
    codAvailable: true,
    services: ['EZ', 'REG']
  },
  sicepat: {
    name: 'SiCepat',
    baseRate: 7500,
    perKg: 3800,
    zoneMultipliers: { 'java-main': 1.0, 'sumatra': 1.35, 'bali-nusa': 1.25, 'kalimantan': 1.55, 'sulawesi': 1.75, 'maluku': 2.1, 'papua': 2.4 },
    codFee: 0.02,
    minCodFee: 4500,
    deliveryDays: { same: '1', nearby: '1-2', far: '2-4', veryFar: '4-6' },
    codAvailable: true,
    services: ['REG', 'HALU', 'BEST']
  },
  anteraja: {
    name: 'AnterAja',
    baseRate: 6500,
    perKg: 3200,
    zoneMultipliers: { 'java-main': 1.0, 'sumatra': 1.3, 'bali-nusa': 1.2, 'kalimantan': 1.5, 'sulawesi': 1.7, 'maluku': 2.0, 'papua': 2.3 },
    codFee: 0.02,
    minCodFee: 4000,
    deliveryDays: { same: '1-2', nearby: '2-3', far: '3-5', veryFar: '5-7' },
    codAvailable: true,
    services: ['SDS', 'REG']
  },
  gosend: {
    name: 'GoSend',
    baseRate: 10000,
    perKg: 2000,
    zoneMultipliers: { 'java-main': 1.0, 'bali-nusa': 1.2 },
    codFee: 0.03,
    minCodFee: 5000,
    deliveryDays: { same: 'same-day', nearby: '1', far: '-', veryFar: '-' },
    codAvailable: true,
    services: ['Instant', 'Same-Day'],
    sameCityOnly: true
  }
};

// Available cities for autocomplete
const CITIES = Object.keys(ZONES).map(c => c.charAt(0).toUpperCase() + c.slice(1)).sort();

function getZoneFactor(originZone, destZone) {
  const key = `${originZone}:${destZone}`;
  return ZONE_PAIRS[key] || 2.0; // default to far
}

function getDistanceCategory(factor) {
  if (factor <= 1.0) return 'same';
  if (factor <= 1.3) return 'nearby';
  if (factor <= 1.8) return 'far';
  return 'veryFar';
}

function calculateShipping(weight, originCity, destCity, useCod = false) {
  const originKey = originCity.toLowerCase();
  const destKey = destCity.toLowerCase();
  
  if (!ZONES[originKey] || !ZONES[destKey]) {
    return { error: 'Kota tidak ditemukan. Gunakan kota yang tersedia.' };
  }
  
  const originZone = ZONES[originKey];
  const destZone = ZONES[destKey];
  const zoneFactor = getZoneFactor(originZone, destZone);
  const distCategory = getDistanceCategory(zoneFactor);
  
  const sameCity = originKey === destKey;
  
  const results = [];
  
  for (const [code, courier] of Object.entries(COURIERS)) {
    // Skip GoSend if different city
    if (courier.sameCityOnly && !sameCity) continue;
    
    const zoneMultiplier = courier.zoneMultipliers[destZone] || 2.0;
    let cost = courier.baseRate + (weight * courier.perKg * zoneMultiplier);
    
    // Apply zone factor
    if (!sameCity) {
      cost = cost * zoneFactor;
    }
    
    // Round to nearest 500
    cost = Math.ceil(cost / 500) * 500;
    
    let codFee = 0;
    if (useCod && courier.codAvailable) {
      codFee = Math.max(courier.minCodFee, cost * courier.codFee);
      codFee = Math.ceil(codFee / 500) * 500;
    }
    
    const deliveryDays = sameCity ? courier.deliveryDays.same : 
                        distCategory === 'nearby' ? courier.deliveryDays.nearby :
                        distCategory === 'far' ? courier.deliveryDays.far :
                        courier.deliveryDays.veryFar;
    
    results.push({
      code,
      name: courier.name,
      cost,
      codFee: useCod ? codFee : 0,
      totalCost: cost + (useCod ? codFee : 0),
      deliveryDays,
      codAvailable: courier.codAvailable,
      services: courier.services,
      available: deliveryDays !== '-'
    });
  }
  
  // Sort by cost
  results.sort((a, b) => a.totalCost - b.totalCost);
  
  // Find cheapest and fastest
  const available = results.filter(r => r.available);
  const cheapest = available.length > 0 ? available[0] : null;
  const fastest = available.reduce((fast, r) => {
    const days = parseInt(r.deliveryDays) || 99;
    const fastDays = parseInt(fast.deliveryDays) || 99;
    return days < fastDays ? r : fast;
  }, available[0] || { deliveryDays: '99' });
  
  return {
    origin: originCity,
    destination: destCity,
    weight,
    useCod,
    couriers: results,
    cheapest,
    fastest,
    sameCity
  };
}

// API endpoints
app.get('/api/cities', (req, res) => {
  res.json(CITIES);
});

app.post('/api/calculate', (req, res) => {
  const { weight, origin, destination, cod } = req.body;
  
  if (!weight || !origin || !destination) {
    return res.status(400).json({ error: 'Berat, kota asal, dan kota tujuan wajib diisi.' });
  }
  
  const result = calculateShipping(
    parseFloat(weight),
    origin,
    destination,
    cod === true
  );
  
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Shipping Cost Estimator running on http://localhost:${PORT}`);
});
