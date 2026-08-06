import http.server
import json
import os

PORT = 3818
DIR = os.path.dirname(os.path.abspath(__file__))

MARKETPLACE_SPECS = [
    {"id": "tokopedia", "name": "Tokopedia", "min_width": 700, "min_height": 700, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 5120, "format": "JPG/PNG", "bg": "white", "recommended": 1000},
    {"id": "shopee", "name": "Shopee", "min_width": 500, "min_height": 500, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 2048, "format": "JPG/PNG", "bg": "white", "recommended": 800},
    {"id": "lazada", "name": "Lazada", "min_width": 330, "min_height": 330, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 5120, "format": "JPG/PNG", "bg": "white", "recommended": 800},
    {"id": "bukalapak", "name": "Bukalapak", "min_width": 500, "min_height": 500, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 5120, "format": "JPG/PNG", "bg": "white", "recommended": 800},
    {"id": "blibli", "name": "Blibli", "min_width": 500, "min_height": 500, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 2048, "format": "JPG", "bg": "white", "recommended": 800},
    {"id": "tiktok", "name": "TikTok Shop", "min_width": 600, "min_height": 600, "ratio": "1:1", "ratio_value": 1, "max_file_kb": 5120, "format": "JPG/PNG", "bg": "white", "recommended": 800}
]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(DIR, "public"), **kwargs)

    def do_GET(self):
        if self.path == "/api/marketplace-specs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(MARKETPLACE_SPECS).encode())
            return
        super().do_GET()

    def log_message(self, format, *args):
        pass

print(f"Image optimizer running on http://localhost:{PORT}")
http.server.HTTPServer(("", PORT), Handler).serve_forever()