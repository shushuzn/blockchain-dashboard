#!/usr/bin/env python3
"""
Solana Meme Coin Proxy Server
Serves onchainos meme data via HTTP for the blockchain-dashboard.

Usage:
    python meme_proxy.py

Then open http://localhost:8765/multi_chain_monitor.html
"""
import json, subprocess, sys, os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ONCHAINOS_PATH = r"C:\Users\adm\.local\bin\onchainos.exe"
PORT = 8765

def get_meme_tokens():
    try:
        result = subprocess.run(
            [ONCHAINOS_PATH, "memepump", "tokens", "--chain", "solana"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
    except Exception as e:
        print(f"[meme_proxy] onchainos error: {e}", file=sys.stderr)
    return []

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        p = urlparse(self.path)
        if p.path == "/api/meme":
            tokens = get_meme_tokens()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(tokens).encode())
            return
        if p.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            return
        if p.path == "/" or p.path == "/multi_chain_monitor.html":
            static_path = os.path.join(os.path.dirname(__file__), "multi_chain_monitor.html")
            if os.path.exists(static_path):
                with open(static_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(content)
                return
        super().do_GET()

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    os.chdir(os.path.dirname(__file__) or ".")
    server = HTTPServer(("localhost", PORT), ProxyHandler)
    print(f"Meme proxy running at http://localhost:{PORT}")
    print(f"  GET /api/meme   -> Solana meme coins")
    print(f"  GET /multi_chain_monitor.html -> dashboard")
    print(f"\nCtrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()

if __name__ == "__main__":
    main()
