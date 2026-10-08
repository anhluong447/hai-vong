"""Local development server: serve this project with caching disabled."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class DevelopmentHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript; charset=utf-8',
                      '.mjs': 'text/javascript; charset=utf-8',
                      '.html': 'text/html; charset=utf-8',
                      '.css': 'text/css; charset=utf-8',
                      '.json': 'application/json; charset=utf-8',
                      '.md': 'text/plain; charset=utf-8'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Never turn a dev reload into a 304 that reuses pre-migration assets.
        for name in ('If-Modified-Since', 'If-None-Match'):
            if name in self.headers:
                del self.headers[name]
        super().do_GET()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    handler = partial(DevelopmentHandler, directory=str(root))
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Serving {root} at http://localhost:{args.port} (cache disabled)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
