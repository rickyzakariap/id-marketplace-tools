#!/usr/bin/env node

/**
 * Marketplace Fee Calculator CLI
 * Hitung net profit setelah fee dari semua marketplace Indonesia
 * 
 * Supported: Tokopedia, Shopee, TikTok Shop, Lazada, Bukalapak, Blibli
 * 
 * Usage:
 *   node index.js --price 150000 --marketplace shopee
 *   node index.js --price 150000 --cost 80000 --marketplace tokopedia
 *   node index.js --price 150000 --cost 80000 --compare
 */

const readline = require('readline');

// ============================================================
// FEE STRUCTURES - based on real 2024-2026 marketplace data
// ============================================================

const MARKETPLACES = {
  tokopedia: {
    name: 'Tokopedia',
    emoji: '🟢',
    // Commission rates by category
    commission: {
      default: 0.045, // 4.5%
      electronics: 0.035,
      fashion: 0.055,
      food: 0.04,
      beauty: 0.05,
      home: 0.045,
      automotive: 0.035,
      books: 0.03,
    },
    platformFee: 0.005, // 0.5% platform fee
    paymentFee: 0.015,  // 1.5% payment processing
    adminFee: 1000,     // Rp 1,000 per transaction (Power Merchant)
    minCommission: 0,   // No minimum
    maxCommission: null,
    notes: 'Fee varies by seller tier (Basic < Power Merchant < Power Merchant PRO)',
  },
  shopee: {
    name: 'Shopee',
    emoji: '🟠',
    commission: {
      default: 0.05,  // 5%
      electronics: 0.04,
      fashion: 0.06,
      food: 0.04,
      beauty: 0.055,
      home: 0.05,
      automotive: 0.04,
      books: 0.035,
    },
    platformFee: 0.005,
    paymentFee: 0.02,  // 2% payment processing
    adminFee: 0,
    minCommission: 0,
    maxCommission: null,
    notes: 'Fee varies by seller tier (Star Seller gets lower commission)',
  },
  tiktokshop: {
    name: 'TikTok Shop',
    emoji: '🎵',
    commission: {
      default: 0.06,  // 6%
      electronics: 0.04,
      fashion: 0.07,
      food: 0.05,
      beauty: 0.06,
      home: 0.06,
      automotive: 0.04,
      books: 0.04,
    },
    platformFee: 0.005,
    paymentFee: 0.02,
    adminFee: 0,
    minCommission: 0,
    maxCommission: null,
    notes: 'Commission rates may change based on promotion periods',
  },
  lazada: {
    name: 'Lazada',
    emoji: '🔵',
    commission: {
      default: 0.04,  // 4%
      electronics: 0.03,
      fashion: 0.05,
      food: 0.035,
      beauty: 0.045,
      home: 0.04,
      automotive: 0.03,
      books: 0.025,
    },
    platformFee: 0.005,
    paymentFee: 0.015,
    adminFee: 0,
    minCommission: 0,
    maxCommission: null,
    notes: 'Lower fees but smaller market share in Indonesia',
  },
  bukalapak: {
    name: 'Bukalapak',
    emoji: '🔴',
    commission: {
      default: 0.04,  // 4%
      electronics: 0.03,
      fashion: 0.05,
      food: 0.035,
      beauty: 0.04,
      home: 0.04,
      automotive: 0.03,
      books: 0.025,
    },
    platformFee: 0.005,
    paymentFee: 0.015,
    adminFee: 0,
    minCommission: 0,
    maxCommission: null,
    notes: 'Loyal user base, smaller scale',
  },
  blibli: {
    name: 'Blibli',
    emoji: '💎',
    commission: {
      default: 0.035, // 3.5%
      electronics: 0.025,
      fashion: 0.045,
      food: 0.03,
      beauty: 0.04,
      home: 0.035,
      automotive: 0.025,
      books: 0.02,
    },
    platformFee: 0.005,
    paymentFee: 0.015,
    adminFee: 0,
    minCommission: 0,
    maxCommission: null,
    notes: 'Quality-focused, lower commission rates',
  },
};

// ============================================================
// FORMATTING HELPERS
// ============================================================

function formatRupiah(amount) {
  if (amount === null || amount === undefined) return '-';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('id-ID');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

function padRight(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

function padLeft(str, len) {
  return ' '.repeat(Math.max(0, len - str.length)) + str;
}

function divider(char = '─', len = 60) {
  return char.repeat(len);
}

// ============================================================
// CALCULATION ENGINE
// ============================================================

function calculateFees(price, marketplace, category = 'default') {
  const mp = MARKETPLACES[marketplace];
  if (!mp) throw new Error(`Unknown marketplace: ${marketplace}`);

  const commissionRate = mp.commission[category] || mp.commission.default;
  const commission = Math.round(price * commissionRate);
  const platformFee = Math.round(price * mp.platformFee);
  const paymentFee = Math.round(price * mp.paymentFee);
  const adminFee = mp.adminFee;

  const totalFees = commission + platformFee + paymentFee + adminFee;
  const netAmount = price - totalFees;
  const effectiveRate = totalFees / price;

  return {
    marketplace: mp.name,
    emoji: mp.emoji,
    category,
    price,
    commissionRate,
    commission,
    platformFee,
    paymentFee,
    adminFee,
    totalFees,
    netAmount,
    effectiveRate,
    notes: mp.notes,
  };
}

function calculateProfit(price, cost, marketplace, category = 'default') {
  const fees = calculateFees(price, marketplace, category);
  const grossProfit = fees.netAmount - cost;
  const profitMargin = cost > 0 ? grossProfit / cost : null;
  const roi = cost > 0 ? grossProfit / cost : null;

  return {
    ...fees,
    cost,
    grossProfit,
    profitMargin,
    roi,
  };
}

// ============================================================
// DISPLAY FUNCTIONS
// ============================================================

function displaySingle(result) {
  const w = 60;
  console.log('');
  console.log(divider('═', w));
  console.log(`  ${result.emoji} ${result.marketplace} - Fee Breakdown`);
  console.log(divider('─', w));
  console.log(`  Category        : ${result.category}`);
  console.log(`  Harga Jual      : ${formatRupiah(result.price)}`);
  console.log(divider('─', w));
  console.log(`  Komisi (${formatPercent(result.commissionRate)})  : ${padLeft(formatRupiah(result.commission), 15)}`);
  console.log(`  Platform Fee     : ${padLeft(formatRupiah(result.platformFee), 15)}`);
  console.log(`  Payment Fee      : ${padLeft(formatRupiah(result.paymentFee), 15)}`);
  console.log(`  Admin Fee        : ${padLeft(formatRupiah(result.adminFee), 15)}`);
  console.log(divider('─', w));
  console.log(`  Total Fee        : ${padLeft(formatRupiah(result.totalFees), 15)}`);
  console.log(`  Effective Rate   : ${padLeft(formatPercent(result.effectiveRate), 15)}`);
  console.log(`  Net Amount       : ${padLeft(formatRupiah(result.netAmount), 15)}`);

  if (result.cost !== undefined) {
    console.log(divider('─', w));
    console.log(`  Harga Modal      : ${padLeft(formatRupiah(result.cost), 15)}`);
    console.log(`  Net Profit       : ${padLeft(formatRupiah(result.grossProfit), 15)}`);
    if (result.roi !== null) {
      console.log(`  ROI              : ${padLeft(formatPercent(result.roi), 15)}`);
    }
    if (result.grossProfit < 0) {
      console.log(`  ⚠️  WARNING: RUGI! Harga jual terlalu rendah.`);
    }
  }
  console.log(divider('═', w));
  console.log(`  ℹ️  ${result.notes}`);
  console.log('');
}

function displayComparison(results) {
  const w = 78;
  console.log('');
  console.log(divider('═', w));
  console.log(`  📊 Marketplace Fee Comparison - ${formatRupiah(results[0].price)}`);
  if (results[0].cost !== undefined) {
    console.log(`  💰 Modal: ${formatRupiah(results[0].cost)}`);
  }
  console.log(divider('═', w));

  // Header
  const col = 12;
  console.log(
    `  ${padRight('Marketplace', 16)}` +
    `${padLeft('Komisi', col)}` +
    `${padLeft('Platform', col)}` +
    `${padLeft('Payment', col)}` +
    `${padLeft('Total Fee', col)}` +
    `${padLeft('Net', col)}`
  );
  console.log(divider('─', w));

  // Rows
  for (const r of results) {
    console.log(
      `  ${padRight(`${r.emoji} ${r.marketplace}`, 16)}` +
      `${padLeft(formatRupiah(r.commission), col)}` +
      `${padLeft(formatRupiah(r.platformFee), col)}` +
      `${padLeft(formatRupiah(r.paymentFee), col)}` +
      `${padLeft(formatRupiah(r.totalFees), col)}` +
      `${padLeft(formatRupiah(r.netAmount), col)}`
    );
  }

  if (results[0].cost !== undefined) {
    console.log(divider('─', w));
    console.log(`  💵 Profit Comparison:`);
    const sorted = [...results].sort((a, b) => b.grossProfit - a.grossProfit);
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      const profitStr = formatRupiah(r.grossProfit);
      const roiStr = r.roi !== null ? `(${formatPercent(r.roi)} ROI)` : '';
      const warning = r.grossProfit < 0 ? ' ⚠️ RUGI' : '';
      console.log(`  ${medal} ${padRight(r.marketplace, 14)} ${padLeft(profitStr, 15)} ${roiStr}${warning}`);
    }
  }

  console.log(divider('═', w));
  console.log(`  ℹ️  Fees based on default category rates. Actual fees vary by seller tier.`);
  console.log('');
}

function displayHelp() {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│  🧮 Marketplace Fee Calculator CLI                          │
│  Hitung net profit setelah fee dari marketplace Indonesia    │
└─────────────────────────────────────────────────────────────┘

USAGE:
  node index.js --price <harga> [options]

OPTIONS:
  --price <amount>       Harga jual (wajib)
  --cost <amount>        Harga modal (opsional, untuk hitung profit)
  --marketplace <name>   Marketplace: tokopedia, shopee, tiktokshop,
                         lazada, bukalapak, blibli
  --category <name>      Kategori produk:
                         default, electronics, fashion, food,
                         beauty, home, automotive, books
  --compare              Bandingkan semua marketplace
  --help                 Tampilkan bantuan ini

EXAMPLES:
  # Hitung fee Shopee untuk produk Rp 150.000
  node index.js --price 150000 --marketplace shopee

  # Hitung profit Tokopedia, modal Rp 80.000
  node index.js --price 150000 --cost 80000 --marketplace tokopedia

  # Bandingkan semua marketplace
  node index.js --price 150000 --cost 80000 --compare

  # Produk fashion di TikTok Shop
  node index.js --price 200000 --cost 100000 --marketplace tiktokshop --category fashion

SUPPORTED MARKETPLACES:
  🟢 tokopedia    🟠 shopee     🎵 tiktokshop
  🔵 lazada       🔴 bukalapak  💎 blibli
`);
}

// ============================================================
// ARGUMENT PARSER
// ============================================================

function parseArgs(args) {
  const parsed = {
    price: null,
    cost: null,
    marketplace: null,
    category: 'default',
    compare: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--price':
        parsed.price = parseInt(args[++i], 10);
        break;
      case '--cost':
        parsed.cost = parseInt(args[++i], 10);
        break;
      case '--marketplace':
      case '--mp':
        parsed.marketplace = args[++i]?.toLowerCase();
        break;
      case '--category':
      case '--cat':
        parsed.category = args[++i]?.toLowerCase() || 'default';
        break;
      case '--compare':
      case '-c':
        parsed.compare = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }

  return parsed;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help || args.length === 0) {
    displayHelp();
    process.exit(0);
  }

  // Validation
  if (!opts.price || opts.price <= 0) {
    console.error('❌ Error: --price wajib diisi dan harus > 0');
    console.error('   Contoh: node index.js --price 150000 --marketplace shopee');
    process.exit(1);
  }

  if (opts.cost !== null && opts.cost < 0) {
    console.error('❌ Error: --cost tidak boleh negatif');
    process.exit(1);
  }

  if (!opts.compare && !opts.marketplace) {
    console.error('❌ Error: pilih --marketplace atau --compare');
    console.error('   Contoh: node index.js --price 150000 --marketplace shopee');
    console.error('   Contoh: node index.js --price 150000 --compare');
    process.exit(1);
  }

  if (opts.marketplace && !MARKETPLACES[opts.marketplace]) {
    console.error(`❌ Error: marketplace "${opts.marketplace}" tidak dikenal`);
    console.error(`   Pilihan: ${Object.keys(MARKETPLACES).join(', ')}`);
    process.exit(1);
  }

  // Execute
  if (opts.compare) {
    const results = Object.keys(MARKETPLACES).map(mp =>
      calculateProfit(opts.price, opts.cost || 0, mp, opts.category)
    );
    displayComparison(results);
  } else {
    const result = calculateProfit(
      opts.price,
      opts.cost || 0,
      opts.marketplace,
      opts.category
    );
    displaySingle(result);
  }
}

main();
