package main

const PAGE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PPh 22 Refund Tracker</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;--card:#fff;--card-alt:#f8f8f8;--border:#e5e5e5;
  --text:#1a1a1a;--text-dim:#666;--text-muted:#999;
  --input-bg:#fff;--input-border:#ddd;
  --accent:#4a9;--accent-hover:#3a8;--accent-light:#f0f7f5;
  --green:#16a34a;--red:#dc2626;--yellow:#d97706;--orange:#ea580c;
}
[data-theme="dark"]{
  --bg:#1a1a1a;--card:#242424;--card-alt:#2a2a2a;--border:#333;
  --text:#e0e0e0;--text-dim:#aaa;--text-muted:#777;
  --input-bg:#2a2a2a;--input-border:#444;
  --accent:#4a9;--accent-hover:#5ba8;--accent-light:#1a2a25;
  --green:#4ade80;--red:#f87171;--yellow:#fbbf24;--orange:#fb923c;
}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;min-height:100vh;padding:20px}
.container{max-width:720px;margin:0 auto}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px}
h1{font-size:22px;font-weight:600}
h2{font-size:16px;font-weight:600;margin-bottom:12px}
p{color:var(--text-dim);font-size:14px}
#themeBtn{background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;font-family:inherit}
#themeBtn:hover{border-color:var(--accent)}
.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px}
.banner{border-left:4px solid var(--accent);background:var(--accent-light)}
.banner .label{font-size:12px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.banner h2{font-size:15px;margin-bottom:6px}
.banner p{font-size:13px}
.banner .meta{margin-top:8px;font-size:12px;color:var(--text-muted)}
.bar{background:var(--card-alt);border:1px solid var(--border);border-radius:999px;height:10px;margin-top:12px;overflow:hidden}
.bar > div{height:100%;border-radius:999px;background:var(--accent);transition:width .3s}
label{display:block;font-size:13px;font-weight:500;margin-bottom:6px}
input[type="number"],input[type="text"]{width:100%;padding:10px 12px;border:1px solid var(--input-border);border-radius:8px;font-size:15px;background:var(--input-bg);color:var(--text);font-family:'JetBrains Mono',monospace;outline:none}
input[type="number"]:focus,input[type="text"]:focus{border-color:var(--accent)}
.field{margin-bottom:14px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.chip{background:var(--card-alt);border:1px solid var(--border);color:var(--text);border-radius:999px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.chip.active{background:var(--accent);border-color:var(--accent);color:#fff}
#calcBtn{width:100%;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:6px}
#calcBtn:hover{background:var(--accent-hover)}
#calcBtn:disabled{opacity:.6;cursor:default}
#calcError{display:none;color:var(--red);font-size:13px;margin-top:8px}
#result{display:none;border-top:1px solid var(--border);margin-top:18px;padding-top:18px}
.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.metric{background:var(--card-alt);border:1px solid var(--border);border-radius:8px;padding:12px}
.metric .k{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em}
.metric .v{font-size:18px;font-weight:600;font-family:'JetBrains Mono',monospace;margin-top:4px}
.metric .v.small{font-size:14px}
#statusBadge{display:inline-block;padding:4px 12px;border-radius:999px;color:#fff;font-size:13px;font-weight:600;margin-top:10px}
#statusBadge.green{background:var(--green)}#statusBadge.yellow{background:var(--yellow)}#statusBadge.orange{background:var(--orange)}#statusBadge.red{background:var(--red)}
.note{margin-top:10px;font-size:12px;color:var(--text-muted)}
.step{padding:8px 0;border-bottom:1px solid var(--border)}
.step:last-child{border-bottom:none}
.step .t{font-weight:600;font-size:14px}
.step .d{color:var(--text-dim);font-size:13px;margin-top:2px}
.step .when{font-size:12px;font-family:'JetBrains Mono',monospace;color:var(--accent);font-weight:500}
.platform-card{border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;background:var(--card-alt)}
.platform-card .head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.platform-card .name{font-weight:600;font-size:15px}
.platform-card .tag{font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--accent-light);color:var(--accent)}
.platform-card .tag.wait{background:#fdf6ec;color:var(--orange)}
.platform-card .row{font-size:13px;color:var(--text-dim);margin-top:8px}
.platform-card .row b{color:var(--text);font-weight:500}
.faq-item{padding:10px 0;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none}
.faq-item .q{font-weight:600;font-size:14px}
.faq-item .a{font-size:13px;color:var(--text-dim);margin-top:4px}
.src{font-size:12px;color:var(--text-muted);line-height:1.7}
@media(max-width:768px){
  body{padding:12px}
  .card{padding:14px}
  .container{max-width:100%}
  .result-grid{grid-template-columns:1fr;gap:8px}
  h1{font-size:18px}
}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>PPh 22 Refund Tracker</h1>
    <button id="themeBtn" type="button">Dark</button>
  </header>

  <div class="card banner">
    <div class="label" id="policyLabel">Menunggu status kebijakan</div>
    <h2 id="policyTitle"></h2>
    <p id="policyDesc"></p>
    <div id="refundProgress" style="display:none">
      <div class="bar"><div id="refundBar" style="width:0%"></div></div>
      <p class="note" id="refundMeta"></p>
    </div>
    <p class="meta" id="policyMeta"></p>
  </div>

  <div class="card">
    <h2>Estimasi dana refund kamu</h2>
    <p>Isi omzet penjualan kamu selama periode 1-5 Agustus 2026, saat marketplace sempat memotong PPh 22 sebesar 0,5%.</p>
    <div class="field">
      <label>Marketplace</label>
      <div class="chips" id="platformChips"></div>
    </div>
    <div class="field">
      <label>Omzet penjualan 1-5 Agustus 2026 (Rp)</label>
      <input type="number" id="salesAmount" placeholder="contoh: 2500000" min="0" step="1000">
    </div>
    <div class="field">
      <label>Omzet setahun (Rp)</label>
      <input type="number" id="annualOmzet" placeholder="contoh: 350000000" min="0" step="1000000">
      <p class="note">Dipakai untuk cek status: di atas atau di bawah Rp 500 juta.</p>
    </div>
    <div class="chips">
      <button type="button" class="chip" id="fillExample">Isi contoh</button>
      <button type="button" class="chip" id="clearForm">Kosongkan</button>
    </div>
    <button id="calcBtn" type="button">Hitung estimasi</button>
    <div id="calcError"></div>
    <div id="result">
      <div class="result-grid">
        <div class="metric"><div class="k">Potongan PPh 22 (0,5%)</div><div class="v" id="rWithheld">-</div></div>
        <div class="metric"><div class="k">Estimasi dana kembali</div><div class="v" id="rRefund">-</div></div>
      </div>
      <span id="statusBadge"></span>
      <p class="note" id="rEligDetail" style="margin-top:10px"></p>
      <div class="metric" style="margin-top:12px">
        <div class="k">Batas refund di platform ini</div>
        <div class="v small" id="rRefundBy" style="font-size:14px">-</div>
        <p class="note" id="rCheckWhere" style="margin-top:6px"></p>
      </div>
      <p class="note" id="rNextStep"></p>
    </div>
  </div>

  <div class="card">
    <h2>Kronologi penundaan</h2>
    <div class="step">
      <div class="when">1 Agustus 2026</div>
      <div class="t">Pemungutan mulai</div>
      <div class="d">Shopee, Tokopedia, Lazada, Blibli memotong PPh 22 0,5% dari peredaran bruto penjual.</div>
    </div>
    <div class="step">
      <div class="when">2-3 Agustus 2026</div>
      <div class="t">Protes penjual ramai</div>
      <div class="d">Penjual mengeluh potongan tembus 30% (fee + pajak). DJP berjanji evaluasi.</div>
    </div>
    <div class="step">
      <div class="when">6 Agustus 2026</div>
      <div class="t">Pemungutan dihentikan</div>
      <div class="d">Kemenkeu menunda pemungutan hingga 31 Oktober 2026. Marketplace berhenti memotong.</div>
    </div>
    <div class="step">
      <div class="when">14 Agustus - 30 September 2026</div>
      <div class="t">Refund dana penjual</div>
      <div class="d">Dana yang terlanjur dipotong dikembalikan otomatis, tanpa perlu mengajukan apa pun.</div>
    </div>
    <div class="step">
      <div class="when">1 November 2026</div>
      <div class="t">Pemungutan berlaku kembali</div>
      <div class="d">Jadwal bisa berubah: Menkeu membuka opsi perpanjangan, idEA mengusulkan mundur ke Januari 2027.</div>
    </div>
  </div>

  <div class="card">
    <h2>Status refund per marketplace</h2>
    <div id="platformList"></div>
  </div>

  <div class="card">
    <h2>Pertanyaan umum</h2>
    <div class="faq-item">
      <div class="q">Apakah saya perlu mengajukan refund?</div>
      <div class="a">Tidak. Pengembalian dilakukan otomatis oleh sistem marketplace. Shopee dan Tokopedia menyatakan penjual tidak perlu melakukan tindakan apa pun.</div>
    </div>
    <div class="faq-item">
      <div class="q">Kapan dana saya kembali?</div>
      <div class="a">Shopee: bertahap mulai 14 Agustus sampai 30 September 2026. Tokopedia: paling lambat 30 September 2026. Blibli: menunggu ketentuan resmi DJP, adjustment kendala sistem maksimal akhir Agustus. Lazada: belum ada pengumuman resmi.</div>
    </div>
    <div class="faq-item">
      <div class="q">Di mana saya cek dana refund?</div>
      <div class="a">Shopee: Seller Centre > Saldo Saya, filter tipe transaksi "Penyesuaian" (di app: Saya > Saldo Penjual > Transaksi). Tokopedia: cek akun penjual atau riwayat transaksi.</div>
    </div>
    <div class="faq-item">
      <div class="q">Omzet saya di bawah Rp 500 juta, kok sempat dipotong?</div>
      <div class="a">Pemungutan dilakukan marketplace berdasarkan data yang tersedia. Kalau terlanjur dipotong, dana tetap dikembalikan otomatis. Untuk pemungutan berikutnya, siapkan surat pernyataan omzet di bawah Rp 500 juta.</div>
    </div>
    <div class="faq-item">
      <div class="q">Kenapa pemungutan ditunda?</div>
      <div class="a">Penjual ramai protes karena potongan terasa berat (fee marketplace + pajak bisa tembus 30%). DJP menjanjikan evaluasi, lalu Kemenkeu menunda pemungutan hingga 31 Oktober 2026.</div>
    </div>
    <div class="faq-item">
      <div class="q">Apa yang terjadi 1 November 2026?</div>
      <div class="a">Pemungutan PPh 22 0,5% berlaku kembali. Catatan: Menkeu membuka opsi perpanjangan penundaan dan idEA mengusulkan implementasi mundur ke Januari 2027. Pantau kabar resmi.</div>
    </div>
  </div>

  <div class="card">
    <h2>Sumber</h2>
    <p class="src">
      detikFinance, "Tokopedia &amp; Shopee Refund Dana Pedagang Bertahap Usai Pajak Ditunda" (10 Agu 2026)<br>
      detikFinance, "Refund Dana Pedagang Usai Pajak Ditunda, Maksimal 30 September" (10 Agu 2026)<br>
      kontan.co.id, "Pedagang Online Protes Pajak Marketplace, Potongan Kini Tembus 30%" (2 Agu 2026) dan "Ditjen Pajak Janji Evaluasi" (3 Agu 2026)<br>
      DDTCNews, "Ditunda 3 Bulan, Pajak yang Telanjur Dipungut Marketplace Dikembalikan" (6 Agu 2026)<br>
      Ortax, "Pajak Marketplace Ditunda, idEA Usulkan Implementasi Mulai Januari 2027" (Agustus 2026)<br>
      Bloomberg Technoz, "Alasan Menkeu Purbaya Tunda Pajak Marketplace" (15 Agu 2026)
    </p>
  </div>
</div>
<script>
const fmt = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

// theme
const themeBtn = document.getElementById('themeBtn');
if (localStorage.getItem('theme') === 'dark') { document.documentElement.dataset.theme = 'dark'; themeBtn.textContent = 'Light'; }
themeBtn.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  themeBtn.textContent = dark ? 'Light' : 'Dark';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

const $ = id => document.getElementById(id);

// status banner
async function loadStatus() {
  try {
    const s = await (await fetch('/api/status')).json();
    $('policyLabel').textContent = s.label;
    $('policyTitle').textContent = s.label;
    $('policyDesc').textContent = s.description;
    if (s.phase === 'refund') {
      $('refundProgress').style.display = 'block';
      $('refundBar').style.width = s.refund_pct.toFixed(1) + '%';
      $('refundMeta').textContent = 'Jendela refund: 14 Agu - 30 Sep 2026. ' + s.refund_left + ' hari tersisa (' + s.refund_pct.toFixed(0) + '%). Cek saldo secara berkala, dana masuk otomatis.';
    }
    if (s.next_key_date) {
      $('policyMeta').textContent = 'Berikutnya: ' + s.next_key_desc + ' (' + s.next_key_date + ') - ' + s.days_to_next + ' hari lagi.';
    } else {
      $('policyMeta').textContent = 'Pemungutan aktif. Jadwal bisa berubah, pantau kabar resmi.';
    }
  } catch (e) {
    $('policyTitle').textContent = 'Gagal memuat status. Muat ulang halaman.';
  }
}

// platform chips + cards
let selectedPlatform = 'Shopee';
async function loadPlatforms() {
  try {
    const list = await (await fetch('/api/platforms')).json();
    const chips = $('platformChips');
    list.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (p.name === selectedPlatform ? ' active' : '');
      b.textContent = p.name;
      b.addEventListener('click', () => {
        selectedPlatform = p.name;
        document.querySelectorAll('#platformChips .chip').forEach(c => c.classList.remove('active'));
        b.classList.add('active');
      });
      chips.appendChild(b);
    });
    const listEl = $('platformList');
    list.forEach(p => {
      const div = document.createElement('div');
      div.className = 'platform-card';
      div.innerHTML =
        '<div class="head"><span class="name">' + p.name + '</span><span class="tag' + (p.status === 'menunggu-djp' || p.status === 'belum-ada' ? ' wait' : '') + '">' + p.status_label + '</span></div>' +
        '<div class="row"><b>Berhenti memungut:</b> ' + p.stop_date + '</div>' +
        '<div class="row"><b>Pengembalian:</b> ' + p.refund_info + '</div>' +
        '<div class="row"><b>Cek di:</b> ' + p.check_where + '</div>';
      listEl.appendChild(div);
    });
  } catch (e) {
    $('platformList').textContent = 'Gagal memuat data platform.';
  }
}

// estimator
$('fillExample').addEventListener('click', () => {
  $('salesAmount').value = '2500000';
  $('annualOmzet').value = '350000000';
});
$('clearForm').addEventListener('click', () => {
  $('salesAmount').value = '';
  $('annualOmzet').value = '';
  $('result').style.display = 'none';
  $('calcError').style.display = 'none';
});
$('calcBtn').addEventListener('click', runEstimate);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') runEstimate();
  if (e.key === 'Escape') { $('salesAmount').value = ''; $('annualOmzet').value = ''; $('result').style.display = 'none'; }
});

async function runEstimate() {
  const sales = parseFloat($('salesAmount').value);
  const annual = parseFloat($('annualOmzet').value);
  $('calcError').style.display = 'none';
  if (isNaN(sales) || sales <= 0) {
    $('calcError').textContent = 'Isi omzet penjualan 1-5 Agustus dulu (contoh: 2500000).';
    $('calcError').style.display = 'block';
    return;
  }
  if (isNaN(annual) || annual <= 0) {
    $('calcError').textContent = 'Isi omzet setahun untuk cek status (contoh: 350000000).';
    $('calcError').style.display = 'block';
    return;
  }
  const btn = $('calcBtn');
  btn.disabled = true;
  btn.textContent = 'Menghitung...';
  try {
    const r = await (await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: selectedPlatform, sales_amount: sales, annual_omzet: annual })
    })).json();
    $('rWithheld').textContent = fmt(r.withheld);
    $('rRefund').textContent = fmt(r.expected_refund);
    $('rRefundBy').textContent = r.refund_by;
    $('rCheckWhere').textContent = r.check_where;
    $('rEligDetail').textContent = r.eligibility_detail;
    $('rNextStep').textContent = 'Langkah selanjutnya: ' + r.next_step;
    const badge = $('statusBadge');
    badge.textContent = r.eligibility_label;
    badge.className = r.eligibility === 'exempt' ? 'green' : 'yellow';
    $('result').style.display = 'block';
  } catch (e) {
    $('calcError').textContent = 'Gagal menghitung, coba lagi.';
    $('calcError').style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = 'Hitung estimasi';
}

loadStatus();
loadPlatforms();
</script>
</body>
</html>`
