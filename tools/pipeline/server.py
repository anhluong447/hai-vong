"""Read-only loopback server. Internal state and archived/private sources are never served."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote,urlsplit

class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
    def allowed(self):
        root=Path(self.directory).resolve()
        parts=Path(unquote(urlsplit(self.path).path).lstrip('/')).parts
        if any(p.startswith('.') or p=='archive' for p in parts): return False
        try: (root/Path(*parts)).resolve().relative_to(root)
        except ValueError: return False
        return True
    def do_GET(self):
        if not self.allowed(): self.send_error(403); return
        super().do_GET()
    def do_HEAD(self):
        if not self.allowed(): self.send_error(403); return
        super().do_HEAD()
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def list_directory(self,path):
        self.send_error(403)
        return None

def create_server(root,port=0,handler=StaticHandler):
    return ThreadingHTTPServer(('127.0.0.1',port),partial(handler,directory=str(Path(root).resolve())))
