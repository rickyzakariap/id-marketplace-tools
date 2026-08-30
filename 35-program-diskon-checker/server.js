const express = require('express');
const path = require('path');

const app = express();
const PORT = 8035;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', feeRate: 12.0 },
  { id: 'tiktok', name: 'TikTok Shop', feeRate: 10.0 },
  { id: 'tokopedia', name: 'Tokopedia', feeRate: 8.0 },
  { id: 'lazada', name: 'Lazada', feeRate: 8.0 },
  { id: 'blibli', name: 'Blibli', feeRate: 6.0 },
  { id: 'bukalapak', name: 'Bukalapak', feeRate: 5.0 }
];

const CHECKLIST = [
  { id: 'promo-tab', label: 'Buka tab Promosi / Kampanye di seller center, minimal 2 minggu sekali', detail: 'Program diskon marketplace sering tersimpan di folder ini, bukan di dashboard utama.' },
  { id: 'email-folder', label: 'Cek email folder Promosi dan Spam secara berkala', detail: 'Undangan kampanye dan perubahan kebijakan biasanya dikirim ke folder ini, bukan kotak masuk utama.' },
  { id: 'no-click', label: 'Jangan klik tautan undangan program dari email sebelum baca syarat lengkap', detail: 'Klik tautan bisa langsung mendaftarkan produk dengan harga sudah terpotong.' },
  { id: 'voucher-aktif', label: 'Cek voucher toko yang aktif otomatis dari level akun', detail: 'Beberapa platform mengaktifkan voucher default saat toko buka atau naik level. Nonaktifkan yang tidak diinginkan.' },
  { id: 'keluar-kampanye', label: 'Keluar dari kampanye yang belum dimulai', detail: 'Sebagian besar platform memungkinkan keluar dari kampanye yang belum mulai, tidak dari yang sudah berjalan.' },
  { id: 'ongkir-fee', label: 'Cek biaya layanan program gratis ongkir yang ditanggung seller', detail: 'Sebagian biaya subsidi ongkir ditanggung seller lewat komponen biaya layanan program.' },
  { id: 'dokumentasi', label: 'Dokumentasikan komunikasi CS kalau program aktif tanpa persetujuan', detail: 'Simpan screenshot dan chat, penting untuk laporan atau evaluasi lebih lanjut.' }
];

function roundRp(n) {
  return Math.round(n);
}

function formatRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function analyze(input) {
  const hpp = Number(input.hpp) || 0;
  const harga = Number(input.harga_jual) || 0;
  const fee = (Number(input.fee_rate) || 0) / 100;
  const target = (Number(input.target_margin) || 0) / 100;
  const flash = (Number(input.flash_sale) || 0) / 100;
  const voucher = (Number(input.voucher_toko) || 0) / 100;
  const ongkirFee = (Number(input.gratis_ongkir) || 0) / 100;

  if (hpp <= 0 || harga <= 0) {
    return { error: 'HPP dan harga jual harus lebih dari 0' };
  }
  if (target <= 0) {
    return { error: 'Target margin harus lebih dari 0' };
  }

  // Normal sale, no program active
  const normalNet = harga * (1 - fee) - hpp;
  const normalMarginPct = harga > 0 ? normalNet / harga : 0;

  // Program active: discounts stack multiplicatively, ongkir adds to fee rate
  const totalDiscount = 1 - (1 - flash) * (1 - voucher);
  const priceAfter = harga * (1 - totalDiscount);
  const totalFee = fee + ongkirFee;
  const programNet = priceAfter * (1 - totalFee) - hpp;
  const programMarginPct = priceAfter > 0 ? programNet / priceAfter : 0;

  let verdict = 'aman';
  let verdictLabel = 'Masih untung';
  let verdictDetail = 'Margin setelah program diskon masih di atas target.';
  if (programNet < 0) {
    verdict = 'rugi';
    verdictLabel = 'Rugi per unit';
    verdictDetail = 'Harga setelah diskon tidak menutup HPP dan biaya layanan. Setiap penjualan program menggerus modal.';
  } else if (programMarginPct < target) {
    verdict = 'tipis';
    verdictLabel = 'Margin di bawah target';
    verdictDetail = 'Masih untung, tapi margin di bawah target. Naikkan harga jual atau kurangi program diskon.';
  }

  // Buffer price: price to list so that with the SAME program discounts active,
  // margin stays >= target. Formula:
  //   priceAfter * (1 - totalFee) - hpp >= target * priceAfter
  //   priceAfter >= hpp / (1 - totalFee - target)
  //   buffer = priceAfter / (1 - totalDiscount)
  let buffer = null;
  let bufferNote = '';
  const denom = 1 - totalFee - target;
  if (denom > 0) {
    const priceAfterTarget = hpp / denom;
    buffer = priceAfterTarget / (1 - totalDiscount);
    if (buffer > harga) {
      bufferNote = 'Naikkan harga jual ke angka ini agar margin target tercapai meski program diskon berjalan.';
    } else {
      bufferNote = 'Harga jual sekarang sudah cukup, tidak perlu naik.';
    }
  } else {
    bufferNote = 'Biaya layanan + target margin sudah di atas 100%, tidak ada harga jual yang bisa memenuhi target.';
  }

  // How many normal sales to cover 1 program sale loss
  let coverSales = null;
  if (programNet < 0 && normalNet > 0) {
    coverSales = Math.ceil(Math.abs(programNet) / normalNet);
  }

  const marginLost = normalNet - programNet;

  return {
    normal: {
      net: roundRp(normalNet),
      marginPct: Math.round(normalMarginPct * 1000) / 10
    },
    program: {
      priceAfter: roundRp(priceAfter),
      totalDiscount: Math.round(totalDiscount * 1000) / 10,
      net: roundRp(programNet),
      marginPct: Math.round(programMarginPct * 1000) / 10,
      marginLost: roundRp(marginLost)
    },
    verdict,
    verdictLabel,
    verdictDetail,
    buffer: buffer !== null ? {
      exact: roundRp(buffer),
      rounded500: Math.max(roundRp(buffer), Math.ceil(buffer / 500) * 500),
      rounded999: Math.max(roundRp(buffer), Math.ceil(buffer / 1000) * 1000 - 1),
      note: bufferNote
    } : null,
    coverSales,
    inputs: {
      hpp: roundRp(hpp),
      harga: roundRp(harga),
      feePct: Math.round(fee * 1000) / 10,
      targetPct: Math.round(target * 1000) / 10,
      flashPct: Math.round(flash * 1000) / 10,
      voucherPct: Math.round(voucher * 1000) / 10,
      ongkirFeePct: Math.round(ongkirFee * 1000) / 10
    }
  };
}

app.get('/api/marketplaces', (req, res) => {
  res.json(MARKETPLACES);
});

app.get('/api/checklist', (req, res) => {
  res.json(CHECKLIST);
});

app.post('/api/analyze', (req, res) => {
  const result = analyze(req.body || {});
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not found' });
  }
  next();
});

app.listen(PORT, () => {
  console.log('Program Diskon Checker running at http://localhost:' + PORT);
});
