#!/usr/bin/env python3
"""Keyword Research Tool for Indonesian Marketplace Sellers"""

import json
import http.server
import socketserver
from urllib.parse import parse_qs, urlparse

# Keyword database based on Indonesian marketplace patterns
KEYWORD_PATTERNS = {
    'fashion': {
        'base': ['baju', 'kaos', 'kemeja', 'dress', 'rok', 'celana', 'jaket', 'hoodie'],
        'modifiers': ['wanita', 'pria', 'murah', 'branded', 'import', 'korea', 'jumbo', 'xl', 'kekinian'],
        'materials': ['katun', 'polyester', 'silk', 'denim', 'rajut', 'chiffon'],
        'occasions': ['kerja', 'kondangan', 'hangout', 'formal', 'casual', 'olahraga']
    },
    'electronics': {
        'base': ['hp', 'laptop', 'tablet', 'earphone', 'charger', 'powerbank', 'speaker', 'headset'],
        'modifiers': ['murah', 'original', 'garansi', 'second', 'baru', 'import', 'canggih'],
        'brands': ['samsung', 'xiaomi', 'iphone', 'oppo', 'vivo', 'realme'],
        'specs': ['ram 8gb', '128gb', '5g', 'fast charging', ' AMOLED']
    },
    'beauty': {
        'base': ['skincare', 'makeup', 'lipstick', 'foundation', 'serum', 'sunscreen', 'masker'],
        'modifiers': ['bpom', 'halal', 'original', 'murah', 'premium', 'natural', 'organic'],
        'concerns': ['jerawat', 'putih', 'anti aging', 'brightening', 'moisturizing', 'minyak'],
        'types': ['cream', 'serum', 'toner', 'cleanser', 'masker', 'essence']
    },
    'home': {
        'base': ['dekorasi', 'perabot', 'rak', 'lampu', 'bantal', 'gorden', 'karpet', 'vas'],
        'modifiers': ['minimalis', 'aesthetic', 'murah', 'unik', 'kekinian', 'scandinavian'],
        'rooms': ['kamar', 'ruang tamu', 'dapur', 'bathroom', 'outdoor'],
        'materials': ['kayu', 'plastik', 'kaca', 'logam', 'rotan']
    },
    'food': {
        'base': ['snack', 'kopi', 'teh', 'sambal', 'keripik', 'coklat', 'madu', 'rempah'],
        'modifiers': ['halal', 'bpom', 'premium', 'murah', 'homemade', 'import', 'organik'],
        'origins': ['bandung', 'jogja', 'malang', 'bali', 'medan', 'makassar'],
        'types': ['kering', 'basah', 'beku', 'instan', 'fresh']
    }
}

# Common search patterns
SEARCH_PATTERNS = [
    '{base} {modifier}',
    '{base} {material}',
    '{base} untuk {occasion}',
    '{base} {brand}',
    '{base} {spec}',
    '{base} {concern}',
    '{base} {room}',
    '{base} {origin}',
    '{base} {type}',
    '{modifier} {base}',
]

def generate_keywords(category, base_product):
    """Generate keyword suggestions based on category and product"""
    if category not in KEYWORD_PATTERNS:
        category = 'fashion'  # default
    
    patterns = KEYWORD_PATTERNS[category]
    keywords = []
    
    # Base keyword
    base = base_product.lower().strip()
    if not base:
        base = patterns['base'][0]
    
    # Generate variations
    for modifier in patterns.get('modifiers', [])[:8]:
        kw = f"{base} {modifier}"
        keywords.append({
            'keyword': kw,
            'type': 'modifier',
            'competition': 'medium',
            'relevance': 85
        })
    
    for material in patterns.get('materials', [])[:5]:
        kw = f"{base} {material}"
        keywords.append({
            'keyword': kw,
            'type': 'material',
            'competition': 'low',
            'relevance': 75
        })
    
    for occasion in patterns.get('occasions', patterns.get('rooms', []))[:5]:
        kw = f"{base} untuk {occasion}"
        keywords.append({
            'keyword': kw,
            'type': 'occasion',
            'competition': 'low',
            'relevance': 70
        })
    
    for brand in patterns.get('brands', patterns.get('origins', []))[:5]:
        kw = f"{base} {brand}"
        keywords.append({
            'keyword': kw,
            'type': 'brand',
            'competition': 'high',
            'relevance': 90
        })
    
    for spec in patterns.get('specs', patterns.get('concerns', []))[:5]:
        kw = f"{base} {spec}"
        keywords.append({
            'keyword': kw,
            'type': 'spec',
            'competition': 'medium',
            'relevance': 80
        })
    
    # Long-tail keywords (3+ words)
    long_tails = [
        f"{base} {patterns['modifiers'][0]} {patterns.get('materials', [''])[0]}",
        f"{base} {patterns.get('occasions', [''])[0]} {patterns['modifiers'][1] if len(patterns['modifiers']) > 1 else ''}",
        f"jual {base} {patterns['modifiers'][0]}",
        f"{base} {patterns['modifiers'][2] if len(patterns['modifiers']) > 2 else 'murah'} gratis ongkir",
    ]
    
    for lt in long_tails:
        if lt.strip():
            keywords.append({
                'keyword': lt.strip(),
                'type': 'long-tail',
                'competition': 'low',
                'relevance': 65
            })
    
    # Sort by relevance
    keywords.sort(key=lambda x: x['relevance'], reverse=True)
    
    return keywords[:20]  # Return top 20

def analyze_keyword(keyword):
    """Analyze a single keyword for optimization suggestions"""
    analysis = {
        'keyword': keyword,
        'length': len(keyword),
        'word_count': len(keyword.split()),
        'has_price_modifier': any(w in keyword.lower() for w in ['murah', 'diskon', 'promo', 'gratis ongkir']),
        'has_quality_modifier': any(w in keyword.lower() for w in ['original', 'branded', 'premium', 'import']),
        'has_location': any(w in keyword.lower() for w in ['jakarta', 'bandung', 'surabaya', 'indonesia']),
        'suggestions': []
    }
    
    # Length check
    if analysis['length'] < 20:
        analysis['suggestions'].append('Keyword terlalu pendek, tambahkan modifier')
    elif analysis['length'] > 60:
        analysis['suggestions'].append('Keyword terlalu panjang, pertimbangkan pecah jadi beberapa keyword')
    
    # Word count check
    if analysis['word_count'] < 2:
        analysis['suggestions'].append('Tambahkan 1-2 kata untuk specificity')
    elif analysis['word_count'] > 5:
        analysis['suggestions'].append('Long-tail keyword bagus, tapi pastikan relevan')
    
    # Modifier check
    if not analysis['has_price_modifier'] and not analysis['has_quality_modifier']:
        analysis['suggestions'].append('Tambahkan modifier harga atau kualitas (murah, original, premium)')
    
    # Competition estimate
    if analysis['word_count'] >= 3:
        analysis['estimated_competition'] = 'low'
    elif analysis['has_quality_modifier']:
        analysis['estimated_competition'] = 'high'
    else:
        analysis['estimated_competition'] = 'medium'
    
    return analysis

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.serve_file('index.html', 'text/html')
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/api/generate':
            self.handle_generate()
        elif self.path == '/api/analyze':
            self.handle_analyze()
        else:
            self.send_error(404)
    
    def handle_generate(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            category = data.get('category', 'fashion')
            product = data.get('product', '')
            
            keywords = generate_keywords(category, product)
            
            self.send_json({
                'success': True,
                'keywords': keywords,
                'count': len(keywords)
            })
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)})
    
    def handle_analyze(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            keyword = data.get('keyword', '')
            
            if not keyword:
                self.send_json({'success': False, 'error': 'Keyword required'})
                return
            
            analysis = analyze_keyword(keyword)
            self.send_json({'success': True, 'analysis': analysis})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)})
    
    def serve_file(self, filename, content_type):
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
    
    def send_json(self, data):
        content = json.dumps(data, indent=2).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(content))
        self.end_headers()
        self.wfile.write(content)
    
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == '__main__':
    PORT = 3515
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Keyword Research Tool running on http://localhost:{PORT}")
        httpd.serve_forever()