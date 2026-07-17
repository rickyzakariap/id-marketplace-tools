package main

const htmlPage = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Listing Description Generator</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#adc6ff',
        'on-primary': '#002e6a',
        'primary-container': '#4d8eff',
        'on-primary-container': '#00285d',
        background: '#0b1326',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c2c6d6',
        outline: '#8c909f',
        'outline-variant': '#424754',
        error: '#ffb4ab',
        green: '#22c55e',
        red: '#ef4444',
        yellow: '#eab308',
      },
    },
  },
}
</script>
<style>
body { font-family: 'Inter', system-ui, sans-serif; }
h1 { font-family: 'Plus Jakarta Sans', sans-serif; }
.mono { font-family: 'JetBrains Mono', monospace; }
.tab-active { border-bottom: 2px solid #adc6ff; color: #adc6ff; }
.tab-inactive { border-bottom: 2px solid transparent; color: #c2c6d6; }
.tab-inactive:hover { color: #dae2fd; }
</style>
</head>
<body class="bg-background text-on-surface min-h-screen p-5">
<div class="max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-1">Listing Description Generator</h1>
  <p class="text-on-surface-variant text-sm mb-6">Generate deskripsi produk untuk 6 marketplace Indonesia</p>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-1 bg-surface-container-low border border-outline-variant rounded-xl p-5">
      <div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium mb-4">Info Produk</div>

      <label class="block text-sm text-on-surface-variant mb-1">Nama Produk</label>
      <input type="text" id="productName" placeholder="Kaos Polos Premium"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50">

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Kategori</label>
      <select id="category" class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
        <option value="fashion">Fashion</option>
        <option value="electronics">Elektronik</option>
        <option value="food">Makanan & Minuman</option>
        <option value="beauty">Kecantikan</option>
        <option value="home">Rumah & Dekorasi</option>
        <option value="sports">Olahraga</option>
        <option value="books">Buku</option>
        <option value="automotive">Otomotif</option>
        <option value="baby">Bayi & Anak</option>
        <option value="pet">Hewan Peliharaan</option>
      </select>

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Harga (Rp)</label>
      <input type="text" id="price" placeholder="79000"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50">

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Brand (opsional)</label>
      <input type="text" id="brand" placeholder="Nama brand"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50">

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Kondisi</label>
      <select id="condition" class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
        <option value="new">Baru</option>
        <option value="used">Bekas</option>
        <option value="refurbished">Refurbished</option>
      </select>

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Fitur (satu per baris)</label>
      <textarea id="features" rows="4" placeholder="100% cotton&#10;Tersedia S-XXL&#10;Warna tidak luntur"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50 resize-none"></textarea>

      <label class="block text-sm text-on-surface-variant mb-1 mt-4">Keywords (satu per baris)</label>
      <textarea id="keywords" rows="2" placeholder="kaos polos&#10;baju cotton"
        class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50 resize-none"></textarea>

      <div class="mt-3 flex items-center gap-2 flex-wrap">
        <span class="text-xs text-on-surface-variant">Contoh:</span>
        <button onclick="fillExample('fashion')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Fashion</button>
        <button onclick="fillExample('electronics')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Elektronik</button>
        <button onclick="fillExample('food')" class="px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Makanan</button>
      </div>

      <div id="validationMsg" class="hidden mt-3 text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2"></div>

      <button onclick="generate()" class="w-full mt-5 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90 active:scale-[0.98]">Generate Deskripsi</button>
    </div>

    <div class="lg:col-span-2">
      <div id="results" class="bg-surface-container-low border border-outline-variant rounded-xl p-5 min-h-[400px]">
        <div class="text-center py-16 text-on-surface-variant/40">
          <div class="text-sm">Isi info produk lalu generate</div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const EXAMPLES = {
  fashion: {name:'Kaos Polos Premium',category:'fashion',price:'79000',brand:'Uniqlo',features:'100% cotton\nTersedia S-XXL\nWarna tidak luntur\nNyaman dipakai',keywords:'kaos polos\nbaju cotton'},
  electronics: {name:'TWS Bluetooth Earphone',category:'electronics',price:'159000',brand:'Baseus',features:'Bluetooth 5.3\nBattery 30 jam\nNoise cancelling\nIPX5 waterproof',keywords:'earphone bluetooth\ntws murah'},
  food: {name:'Kopi Arabika Gayo',category:'food',price:'85000',brand:'Gayo Premium',features:'100% arabika\nRoasting medium\nKemasan 250gr\nHalal MUI',keywords:'kopi arabika\nkopi gayo'},
};

function fillExample(cat){
  const e=EXAMPLES[cat];
  document.getElementById('productName').value=e.name;
  document.getElementById('category').value=e.category;
  document.getElementById('price').value=e.price;
  document.getElementById('brand').value=e.brand;
  document.getElementById('features').value=e.features;
  document.getElementById('keywords').value=e.keywords;
  generate();
}

function showValidation(msg){
  const el=document.getElementById('validationMsg');
  el.textContent=msg;
  el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'),3000);
}

let currentData=null;
let currentPlatform='tokopedia';

function fmt(n){return'Rp '+Number(n).toLocaleString('id-ID')}

async function generate(){
  const name=document.getElementById('productName').value.trim();
  const category=document.getElementById('category').value;
  const price=document.getElementById('price').value.trim();
  const brand=document.getElementById('brand').value.trim();
  const condition=document.getElementById('condition').value;
  const features=document.getElementById('features').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const keywords=document.getElementById('keywords').value.split('\n').map(s=>s.trim()).filter(Boolean);

  if(!name){showValidation('Isi nama produk');return;}
  if(!category){showValidation('Pilih kategori');return;}
  if(!price){showValidation('Isi harga');return;}

  const resp=await fetch('/api/generate',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,category,price,brand,condition,features,keywords})
  });
  currentData=await resp.json();
  renderResults();
}

function renderResults(){
  if(!currentData)return;
  const platforms=['tokopedia','shopee','lazada','bukalapak','tiktok','blibli'];
  const names={tokopedia:'Tokopedia',shopee:'Shopee',lazada:'Lazada',bukalapak:'Bukalapak',tiktok:'TikTok Shop',blibli:'Blibli'};

  let tabs='<div class="flex gap-1 mb-4 border-b border-outline-variant overflow-x-auto">';
  platforms.forEach(p=>{
    const cls=p===currentPlatform?'tab-active':'tab-inactive';
    tabs+='<button onclick="switchPlatform(\\''+p+'\\')" class="px-3 py-2 text-sm font-medium whitespace-nowrap '+cls+'">'+names[p]+'</button>';
  });
  tabs+='</div>';

  const d=currentData[currentPlatform];
  const titleLen=d.title.length;
  const descLen=d.description.length;
  const titleColor=titleLen>d.title_max?'text-red':'text-on-surface-variant';
  const descColor=descLen>d.desc_max?'text-red':'text-on-surface-variant';

  let html=tabs;
  html+='<div class="mb-4">';
  html+='<div class="flex justify-between items-center mb-2">';
  html+='<div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Title</div>';
  html+='<div class="text-xs '+titleColor+' mono">'+titleLen+'/'+d.title_max+'</div>';
  html+='</div>';
  html+='<div class="bg-surface-container border border-outline-variant rounded-lg p-3 text-sm">'+escapeHtml(d.title)+'</div>';
  html+='<button onclick="copyToClipboard(\\''+escapeForAttr(d.title)+'\\')" class="mt-1 px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Copy Title</button>';
  html+='</div>';

  html+='<div class="mb-4">';
  html+='<div class="flex justify-between items-center mb-2">';
  html+='<div class="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Description</div>';
  html+='<div class="text-xs '+descColor+' mono">'+descLen+'/'+d.desc_max+'</div>';
  html+='</div>';
  html+='<pre class="bg-surface-container border border-outline-variant rounded-lg p-3 text-sm whitespace-pre-wrap font-sans">'+escapeHtml(d.description)+'</pre>';
  html+='<button onclick="copyToClipboard(\\''+escapeForAttr(d.description)+'\\')" class="mt-1 px-3 py-1 text-xs rounded border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high transition-colors">Copy Description</button>';
  html+='</div>';

  document.getElementById('results').innerHTML=html;
}

function switchPlatform(p){
  currentPlatform=p;
  renderResults();
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeForAttr(s){
  return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\\n/g,'\\n');
}

function copyToClipboard(text){
  text=text.replace(/\\\\n/g,'\\n').replace(/\\\\'/g,"'");
  navigator.clipboard.writeText(text).then(()=>{
    showValidation('Copied!');
  }).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showValidation('Copied!');
  });
}

document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key==='Enter'){
    e.preventDefault();
    generate();
  }
});
</script>
</body>
</html>`
