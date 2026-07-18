#!/usr/bin/env python3
"""Komplain Response Generator - Generate professional complaint responses for marketplace sellers."""

import json
import http.server
import socketserver
import urllib.parse
import os

PORT = 3461

# Complaint types with templates
COMPLAINT_TYPES = {
    "terlambat": {
        "label": "Pengiriman Terlambat",
        "keywords": ["terlambat", "lambat", "lama", "belum sampai", "ga dateng", "kapan sampai"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih sudah menghubungi kami. Mohon maaf atas keterlambatan pengiriman pesanan Kakak. Kami sudah cek resi {resi} dan saat ini barang masih dalam proses pengiriman dari pihak kurir. Kami akan bantu follow up ke pihak {kurir} untuk mempercepat prosesnya. Mohon ditunggu ya Kak, estimasi sampai dalam {estimasi}. Jika ada kendala lain, silakan hubungi kami kembali.",
                "Selamat {waktu} Kak, kami mohon maaf atas keterlambatan pengiriman yang Kakak alami. Kami sudah koordinasi dengan pihak {kurir} dan barang Kakak sedang dalam perjalanan. Estimasi sampai {estimasi}. Kami akan terus pantau dan informasikan perkembangannya. Terima kasih atas kesabarannya ya Kak.",
            ],
            "tegas": [
                "Halo Kak, terima kasih atas informasinya. Kami sudah cek dan konfirmasi ke pihak {kurir} bahwa barang dengan resi {resi} sedang dalam proses pengiriman. Estimasi sampai {estimasi}. Jika melebihi estimasi tersebut, kami akan bantu proses komplain ke pihak {kurir} dan berikan solusi terbaik untuk Kakak.",
                "Baik Kak, kami tangani keluhan ini. Kami sudah hubungi pihak {kurir} terkait keterlambatan pengiriman resi {resi}. Kami minta Kakak bersabar menunggu hingga {estimasi}. Jika sampai batas waktu tersebut barang belum sampai, kami akan proses penggantian atau refund sesuai kebijakan.",
            ],
            "permintaan_maaf": [
                "Kak, kami sangat mohon maaf atas ketidaknyamanan yang Kakak alami. Keterlambatan pengiriman ini di luar kendali kami dan sepenuhnya menjadi tanggung jawab pihak {kurir}. Kami sudah follow up dan meminta mereka memprioritaskan pengiriman pesanan Kakak. Sebagai bentuk permohonan maaf, kami akan berikan {kompensasi} untuk pesanan selanjutnya. Mohon ditunggu ya Kak.",
                "Mohon maaf sekali ya Kak atas keterlambatan ini. Kami tahu ini sangat mengganggu dan kami benar-benar minta maaf. Kami sudah hubungi pihak {kurir} dan mereka berjanji akan segera mengirimkan barang Kakak. Kami juga akan berikan {kompensasi} sebagai bentuk permohonan maaf kami. Terima kasih atas pengertiannya Kak.",
            ],
        },
    },
    "barang_rusak": {
        "label": "Barang Rusak/Cacat",
        "keywords": ["rusak", "cacat", "pecah", "lecet", "tidak berfungsi", "mati", "jelek"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih sudah menginformasikan. Kami sangat menyesal mendengar barang yang Kakak terima dalam kondisi rusak. Kami mohon Kakak bisa kirimkan foto/video kerusakan barangnya agar kami bisa segera proses. Kami akan berikan solusi berupa penggantian barang baru atau refund sesuai keinginan Kakak.",
                "Selamat {waktu} Kak, kami mohon maaf atas kondisi barang yang Kakak terima. Kami sangat menyesal hal ini terjadi. Mohon kirimkan bukti foto/video kerusakan untuk mempercepat proses penanganan. Kami akan segera proses penggantian atau refund untuk Kakak.",
            ],
            "tegas": [
                "Halo Kak, kami sudah terima laporan Kakak. Untuk memproses komplain ini, kami butuh bukti foto/video kerusakan barang. Mohon kirimkan dalam waktu 1x24 jam agar kami bisa segera tindak lanjuti. Kami akan proses penggantian barang atau refund setelah verifikasi selesai.",
                "Baik Kak, kami tangani kasus ini. Kami butuh bukti foto/video kerusakan untuk proses verifikasi. Setelah terverifikasi, kami akan proses penggantian atau refund sesuai kebijakan. Mohon kirimkan buktinya segera.",
            ],
            "permintaan_maaf": [
                "Kak, kami sangat mohon maaf atas kondisi barang yang Kakak terima. Ini benar-benar di luar harapan kami dan kami sangat menyesal. Kami akan segera proses penggantian barang baru tanpa biaya tambahan. Mohon kirimkan foto/video kerusakan dan kami akan kirimkan barang pengganti secepatnya. Kami juga berikan {kompensasi} sebagai permohonan maaf.",
                "Mohon maaf sekali ya Kak, kami sangat kecewa mendengar barang sampai dalam kondisi rusak. Ini tanggung jawab kami sepenuhnya. Kami akan kirimkan barang baru sekaligus {kompensasi} untuk Kakak. Tidak perlu repot mengembalikan barang yang rusak. Sekali lagi kami mohon maaf atas ketidaknyamanan ini.",
            ],
        },
    },
    "barang_salah": {
        "label": "Barang Salah/Tidak Sesuai",
        "keywords": ["salah", "tidak sesuai", "beda", "bukan yang dipesan", "keliru"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih sudah menginformasikan. Kami mohon maaf atas kesalahan pengiriman barang. Kami akan segera proses pengiriman ulang barang yang benar. Mohon Kakak bisa kirimkan foto barang yang diterima sebagai bukti. Barang yang salah tidak perlu dikembalikan.",
                "Selamat {waktu} Kak, kami mohon maaf atas kesalahan ini. Kami sudah cek kembali pesanan Kakak dan ternyata ada kesalahan dalam pengemasan. Kami akan segera kirimkan barang yang benar. Mohon kirimkan foto barang yang diterima ya Kak.",
            ],
            "tegas": [
                "Halo Kak, kami terima laporan kesalahan pengiriman. Kami butuh foto barang yang diterima untuk verifikasi. Setelah terverifikasi, kami akan kirimkan barang yang benar dalam 1-2 hari kerja. Barang yang salah tidak perlu dikembalikan.",
                "Baik Kak, kami tangani kasus ini. Kesalahan pengiriman adalah tanggung jawab kami. Kami akan kirimkan barang yang benar setelah verifikasi foto. Mohon kirimkan foto barang yang diterima segera.",
            ],
            "permintaan_maaf": [
                "Kak, kami sangat mohon maaf atas kesalahan pengiriman ini. Ini kelalaian kami dan kami bertanggung jawab penuh. Kami akan segera kirimkan barang yang benar beserta {kompensasi} sebagai permohonan maaf. Barang yang salah tidak perlu dikembalikan, silakan Kakak manfaatkan. Sekali lagi mohon maaf ya Kak.",
                "Mohon maaf sekali Kak atas kesalahan ini. Kami sangat menyesal. Kami akan kirimkan barang yang benar hari ini juga dan berikan {kompensasi} untuk Kakak. Barang yang salah boleh Kakak simpan. Terima kasih atas pengertiannya.",
            ],
        },
    },
    "refund": {
        "label": "Permintaan Refund",
        "keywords": ["refund", "uang kembali", "kembalikan", "batal", "cancel"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih sudah menghubungi kami. Kami menerima permintaan refund Kakak. Kami akan proses refund ke metode pembayaran asal dalam waktu 1-3 hari kerja. Mohon Kakak konfirmasi alasan refund untuk pencatatan kami. Apakah Kakak ingin refund penuh atau ada opsi lain yang bisa kami tawarkan?",
                "Selamat {waktu} Kak, kami sudah terima permintaan refund Kakak. Kami akan segera proses. Refund akan dikembalikan ke metode pembayaran asal dalam 1-3 hari kerja. Kami mohon maaf atas ketidaknyamanan yang Kakak alami.",
            ],
            "tegas": [
                "Halo Kak, permintaan refund Kakak kami terima. Kami akan proses sesuai kebijakan marketplace. Refund akan diproses dalam 1-3 hari kerja ke metode pembayaran asal. Kami mohon Kakak menunggu konfirmasi dari pihak marketplace.",
                "Baik Kak, kami proses refund Kakak. Sesuai kebijakan, refund akan dikembalikan dalam 1-3 hari kerja. Kami akan informasikan setelah proses selesai.",
            ],
            "permintaan_maaf": [
                "Kak, kami menerima permintaan refund Kakak dan kami sangat mohon maaf atas ketidaknyamanan yang terjadi. Kami akan proses refund secepatnya, maksimal 1-3 hari kerja. Kami juga berikan {kompensasi} untuk pesanan selanjutnya sebagai bentuk permohonan maaf kami. Terima kasih atas pengertiannya Kak.",
                "Mohon maaf sekali ya Kak atas pengalaman yang kurang menyenangkan. Kami segera proses refund Kakak dan berikan {kompensasi} untuk pesanan berikutnya. Semoga Kakak berkenan memberikan kesempatan lagi untuk kami melayani. Terima kasih Kak.",
            ],
        },
    },
    "komplain_ongkir": {
        "label": "Komplain Ongkir",
        "keywords": ["ongkir", "ongkos kirim", "mahal", "biaya kirim", "pengiriman"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih atas masukannya. Kami paham ongkir menjadi pertimbangan penting. Untuk pesanan Kakak, ongkir yang tertera sudah sesuai dengan tarif {kurir} berdasarkan berat dan tujuan. Kami sarankan Kakak menggunakan opsi {kurir_alt} yang mungkin lebih terjangkau. Apakah Kakak ingin kami bantu carikan opsi pengiriman yang lebih ekonomis?",
                "Selamat {waktu} Kak, terima kasih sudah menginformasikan. Ongkir yang terhitung sudah sesuai tarif resmi {kurir}. Kami bisa bantu cek opsi kurir lain yang mungkin lebih terjangkau untuk area Kakak. Silakan informasikan kode pos tujuan agar kami bisa cek opsi terbaiknya.",
            ],
            "tegas": [
                "Halo Kak, ongkir yang tertera sudah sesuai dengan tarif resmi {kurir} berdasarkan berat dan jarak pengiriman. Kami tidak bisa mengubah tarif ongkir karena sudah ditetapkan oleh pihak kurir. Kami sarankan Kakak cek opsi kurir lain yang tersedia di keranjang.",
                "Baik Kak, ongkir dihitung otomatis oleh sistem marketplace berdasarkan berat barang dan lokasi Kakak. Kami tidak memiliki kendali atas tarif tersebut. Kakak bisa pilih kurir lain yang lebih terjangkau saat checkout.",
            ],
            "permintaan_maaf": [
                "Kak, kami mohon maaf atas ketidaknyamanan terkait ongkir. Kami paham ongkir yang cukup besar bisa memberatkan. Sebagai solusi, kami berikan {kompensasi} untuk meringankan biaya pengiriman Kakak. Semoga ini bisa membantu ya Kak.",
                "Mohon maaf ya Kak atas ongkir yang cukup besar. Kami berikan {kompensasi} sebagai subsidi ongkir untuk Kakak. Silakan gunakan pada pesanan berikutnya. Terima kasih atas pengertiannya Kak.",
            ],
        },
    },
    "respon_lambat": {
        "label": "Respon Lambat",
        "keywords": ["lambat respon", "tidak dibalas", "ga dibales", "lama balas", "slow respon"],
        "templates": {
            "sopan": [
                "Halo Kak, terima kasih sudah menunggu. Kami mohon maaf atas keterlambatan merespon pesan Kakak. Saat ini volume pesan cukup tinggi sehingga ada delay dalam membalas. Kami sudah merespon pertanyaan/pesanan Kakak. Apakah ada yang bisa kami bantu lagi?",
                "Selamat {waktu} Kak, kami mohon maaf atas keterlambatan respon. Kami sudah cek pesan Kakak dan akan segera merespon. Ke depannya kami akan berusaha merespon lebih cepat. Terima kasih atas kesabarannya Kak.",
            ],
            "tegas": [
                "Halo Kak, mohon maaf atas keterlambatan respon. Kami sudah merespon pesan Kakak. Kami berusaha merespon dalam 1 jam pada jam kerja (08.00-22.00). Di luar jam tersebut, mohon ditunggu hingga jam kerja berikutnya.",
                "Baik Kak, mohon maaf atas delay. Kami sudah merespon. Untuk informasi, jam operasional kami 08.00-22.00. Pesan di luar jam tersebut akan dibalas keesokan harinya.",
            ],
            "permintaan_maaf": [
                "Kak, kami sangat mohon maaf atas keterlambatan respon. Ini tidak seharusnya terjadi dan kami menyesal. Kami sudah merespon pesan Kakak dan berikan {kompensasi} sebagai permohonan maaf. Ke depannya kami pastikan merespon lebih cepat. Terima kasih sudah mengingatkan kami Kak.",
                "Mohon maaf sekali ya Kak atas lambatnya respon kami. Kami sudah merespon dan berikan {kompensasi} untuk Kakak. Kami akan perbaiki waktu respon kami ke depannya. Terima kasih atas pengertiannya Kak.",
            ],
        },
    },
}

# Compensation options
COMPENSATIONS = [
    "voucher potongan Rp 10.000",
    "gratis ongkir untuk pesanan selanjutnya",
    "diskon 10% untuk pembelian berikutnya",
    "bonus merchandise",
    "cashback Rp 15.000",
]

# Courier options
COURIERS = ["JNE", "J&T", "SiCepat", "AnterAja", "GoSend", "GrabExpress"]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Komplain Response Generator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;--yellow:#ca8a04;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent-light:#1a2e28;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
.container{max-width:900px;margin:0 auto;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.header h1{font-size:1.5rem;font-weight:600}
.theme-toggle{background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem}
.theme-toggle:hover{border-color:var(--accent);color:var(--accent)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px}
.card h3{font-size:0.9rem;font-weight:600;margin-bottom:12px;color:var(--text)}
label{display:block;font-size:0.8rem;font-weight:500;color:var(--text-dim);margin-bottom:6px}
input,select,textarea{width:100%;padding:10px 12px;border:1px solid var(--input-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:0.9rem;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent)}
textarea{min-height:80px;resize:vertical}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.chip{padding:6px 12px;border:1px solid var(--border);border-radius:20px;font-size:0.8rem;cursor:pointer;background:var(--card);color:var(--text-dim);transition:border-color 0.15s,color 0.15s}
.chip:hover,.chip.active{border-color:var(--accent);color:var(--accent);background:var(--accent-light)}
.btn{background:var(--accent);color:#fff;border:none;padding:12px 24px;border-radius:6px;font-size:0.9rem;font-weight:500;cursor:pointer;width:100%;font-family:inherit}
.btn:hover{background:var(--accent-hover)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.result{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px;margin-top:20px;display:none}
.result.show{display:block}
.result h3{font-size:1rem;font-weight:600;margin-bottom:16px;color:var(--text);display:flex;justify-content:space-between;align-items:center}
.response-item{background:var(--card-alt);border:1px solid var(--border);border-radius:6px;padding:14px;margin-bottom:12px;position:relative}
.response-item:last-child{margin-bottom:0}
.response-text{font-size:0.9rem;line-height:1.7;color:var(--text);white-space:pre-wrap}
.copy-btn{position:absolute;top:10px;right:10px;background:var(--card);border:1px solid var(--border);color:var(--text-dim);padding:4px 10px;border-radius:4px;font-size:0.75rem;cursor:pointer}
.copy-btn:hover{border-color:var(--accent);color:var(--accent)}
.copy-btn.copied{background:var(--green);color:#fff;border-color:var(--green)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:500;margin-left:8px}
.badge-sopan{background:#dbeafe;color:#1e40af}
.badge-tegas{background:#fef3c7;color:#92400e}
.badge-maaf{background:#fce7f3;color:#9d174d}
.fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.field-group{margin-bottom:12px}
.field-group label{margin-bottom:4px}
.empty-state{text-align:center;padding:40px 20px;color:var(--text-muted)}
.empty-state p{font-size:0.9rem;margin-top:8px}
.detected-type{background:var(--accent-light);border:1px solid var(--accent);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:0.85rem;color:var(--accent);display:none}
.detected-type.show{display:block}
@media(max-width:768px){
  .grid{grid-template-columns:1fr}
  .fields-grid{grid-template-columns:1fr}
  .container{padding:12px}
  .header h1{font-size:1.2rem}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Komplain Response Generator</h1>
    <button class="theme-toggle" onclick="toggleTheme()">Dark</button>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Input Komplain</h3>
      <div class="field-group">
        <label>Tipe Komplain</label>
        <div class="chips" id="typeChips">
          <div class="chip active" data-type="terlambat">Terlambat</div>
          <div class="chip" data-type="barang_rusak">Rusak</div>
          <div class="chip" data-type="barang_salah">Salah</div>
          <div class="chip" data-type="refund">Refund</div>
          <div class="chip" data-type="komplain_ongkir">Ongkir</div>
          <div class="chip" data-type="respon_lambat">Respon Lambat</div>
        </div>
      </div>
      <div class="detected-type" id="detectedType"></div>
      <div class="field-group">
        <label>Pesan Pembeli (opsional - auto-detect tipe)</label>
        <textarea id="buyerMessage" placeholder="Paste pesan pembeli di sini untuk auto-detect tipe komplain..."></textarea>
      </div>
    </div>

    <div class="card">
      <h3>Detail Tambahan</h3>
      <div class="field-group">
        <label>Tone Respon</label>
        <div class="chips" id="toneChips">
          <div class="chip active" data-tone="sopan">Sopan</div>
          <div class="chip" data-tone="tegas">Tegas</div>
          <div class="chip" data-tone="permintaan_maaf">Minta Maaf</div>
        </div>
      </div>
      <div class="fields-grid">
        <div class="field-group">
          <label>No. Resi (opsional)</label>
          <input type="text" id="resi" placeholder="JT1234567890">
        </div>
        <div class="field-group">
          <label>Kurir</label>
          <select id="kurir">
            <option value="J&T">J&T</option>
            <option value="JNE">JNE</option>
            <option value="SiCepat">SiCepat</option>
            <option value="AnterAja">AnterAja</option>
            <option value="GoSend">GoSend</option>
            <option value="GrabExpress">GrabExpress</option>
          </select>
        </div>
        <div class="field-group">
          <label>Estimasi Sampai</label>
          <input type="text" id="estimasi" placeholder="2-3 hari lagi">
        </div>
        <div class="field-group">
          <label>Kompensasi</label>
          <select id="kompensasi">
            <option value="voucher potongan Rp 10.000">Voucher Rp 10.000</option>
            <option value="gratis ongkir untuk pesanan selanjutnya">Gratis Ongkir</option>
            <option value="diskon 10% untuk pembelian berikutnya">Diskon 10%</option>
            <option value="bonus merchandise">Bonus Merchandise</option>
            <option value="cashback Rp 15.000">Cashback Rp 15.000</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <button class="btn" id="generateBtn" onclick="generate()">Generate Respon</button>

  <div class="result" id="result">
    <h3>
      <span>Hasil Respon</span>
      <button class="copy-btn" onclick="copyAll()">Copy Semua</button>
    </h3>
    <div id="responses"></div>
  </div>
</div>

<script>
const COMPLAINT_TYPES = %COMPLAINT_TYPES%;
let selectedType = 'terlambat';
let selectedTone = 'sopan';

// Theme toggle
function toggleTheme() {
  const body = document.body;
  const isDark = body.hasAttribute('data-theme');
  if (isDark) {
    body.removeAttribute('data-theme');
    document.querySelector('.theme-toggle').textContent = 'Dark';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').textContent = 'Light';
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.querySelector('.theme-toggle').textContent = 'Light';
}

// Chip selection
document.getElementById('typeChips').addEventListener('click', function(e) {
  if (e.target.classList.contains('chip')) {
    this.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    selectedType = e.target.dataset.type;
  }
});

document.getElementById('toneChips').addEventListener('click', function(e) {
  if (e.target.classList.contains('chip')) {
    this.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    selectedTone = e.target.dataset.tone;
  }
});

// Auto-detect complaint type from buyer message
document.getElementById('buyerMessage').addEventListener('input', function() {
  const msg = this.value.toLowerCase();
  const detected = document.getElementById('detectedType');
  
  if (msg.length < 3) {
    detected.classList.remove('show');
    return;
  }
  
  for (const [type, data] of Object.entries(COMPLAINT_TYPES)) {
    const found = data.keywords.find(k => msg.includes(k));
    if (found) {
      detected.textContent = 'Terdeteksi: ' + data.label + ' (kata kunci: "' + found + '")';
      detected.classList.add('show');
      
      // Auto-select type chip
      document.querySelectorAll('#typeChips .chip').forEach(c => {
        c.classList.remove('active');
        if (c.dataset.type === type) c.classList.add('active');
      });
      selectedType = type;
      return;
    }
  }
  detected.classList.remove('show');
});

function generate() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = 'Generating...';
  
  const resi = document.getElementById('resi').value || 'JT1234567890';
  const kurir = document.getElementById('kurir').value;
  const estimasi = document.getElementById('estimasi').value || '2-3 hari lagi';
  const kompensasi = document.getElementById('kompensasi').value;
  const waktu = new Date().getHours() < 12 ? 'pagi' : new Date().getHours() < 17 ? 'siang' : 'sore';
  const kurirAlt = kurir === 'J&T' ? 'SiCepat' : 'J&T';
  
  const typeData = COMPLAINT_TYPES[selectedType];
  const templates = typeData.templates[selectedTone];
  
  const responses = templates.map(t => {
    return t.replace(/{resi}/g, resi)
            .replace(/{kurir}/g, kurir)
            .replace(/{kurir_alt}/g, kurirAlt)
            .replace(/{estimasi}/g, estimasi)
            .replace(/{kompensasi}/g, kompensasi)
            .replace(/{waktu}/g, waktu);
  });
  
  const container = document.getElementById('responses');
  container.innerHTML = responses.map((r, i) => `
    <div class="response-item">
      <button class="copy-btn" onclick="copySingle(this, ${i})">Copy</button>
      <div class="response-text">${escapeHtml(r)}</div>
    </div>
  `).join('');
  
  document.getElementById('result').classList.add('show');
  btn.disabled = false;
  btn.textContent = 'Generate Respon';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copySingle(btn, index) {
  const text = document.querySelectorAll('.response-text')[index].textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

function copyAll() {
  const texts = Array.from(document.querySelectorAll('.response-text')).map(el => el.textContent);
  navigator.clipboard.writeText(texts.join('\\n\\n---\\n\\n')).then(() => {
    const btn = document.querySelector('.result h3 .copy-btn');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy Semua';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// Keyboard shortcut
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    generate();
  }
});
</script>
</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            html = HTML_TEMPLATE.replace('%COMPLAINT_TYPES%', json.dumps(COMPLAINT_TYPES))
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode())
        elif self.path == '/api/types':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            result = {k: {'label': v['label'], 'keywords': v['keywords']} for k, v in COMPLAINT_TYPES.items()}
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Komplain Response Generator running at http://localhost:{PORT}')
        httpd.serve_forever()
