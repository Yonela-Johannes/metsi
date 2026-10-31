#!/usr/bin/env python3
"""
Simple HTTP server for the Flood Monitoring Dashboard
Run this script and open http://localhost:8000 in your browser
"""

import http.server
import socketserver
import os
from pathlib import Path

# Change to the script directory
os.chdir(Path(__file__).parent)

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

print(f"🚀 Starting Flood Data Dashboard server...")
print(f"📊 Open your browser at: http://localhost:{PORT}")
print(f"📁 Serving files from: {os.getcwd()}")
print(f"⏹️  Press Ctrl+C to stop the server\n")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✅ Server stopped")
