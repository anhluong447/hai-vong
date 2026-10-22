"""Run ES-module tests in a real isolated Chromium, collecting a tokened JSON result."""
import json
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import threading
from urllib.parse import urlencode,urlsplit
sys.path.insert(0,str(Path(__file__).resolve().parent))
from preflight import detect_browser
from server import StaticHandler,create_server

def run_browser(root,modules,params=None,timeout=40,base_url=None,page='/tests/index.html',payload=None):
    detected=detect_browser()
    if not detected['ok']: return detected
    received={}; event=threading.Event(); token=secrets.token_urlsafe(24)
    class Handler(StaticHandler):
        def do_GET(self):
            if urlsplit(self.path).path=='/_input/'+token and payload is not None:
                data=json.dumps(payload,ensure_ascii=False).encode('utf-8');self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(data);return
            super().do_GET()
        def do_POST(self):
            if urlsplit(self.path).path!='/_test/'+token:
                self.send_error(403); return
            try:
                length=int(self.headers.get('Content-Length','0'))
                if length>4_000_000: raise ValueError('result too large')
                received.update(json.loads(self.rfile.read(length)))
                self.send_response(200); self.end_headers(); self.wfile.write(b'{}'); event.set()
            except (ValueError,TypeError): self.send_error(400)
    server=create_server(root,handler=Handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
    origin=f'http://127.0.0.1:{server.server_port}'
    query=[('module',m) for m in modules]+list((params or {}).items())+[('result',origin+'/_test/'+token)]
    # Harness is always on its own isolated server; application under test may be on base_url.
    if base_url: query.append(('base',base_url))
    if payload is not None:query.append(('input',origin+'/_input/'+token))
    url=origin+page+'?'+urlencode(query)
    try:
        with tempfile.TemporaryDirectory(prefix='hoi-am-browser-') as profile:
            with tempfile.TemporaryFile() as stderr:
                proc=subprocess.Popen([detected['value'],'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--user-data-dir='+profile,url],stdout=subprocess.DEVNULL,stderr=stderr)
                try:
                    if not event.wait(timeout):
                        return {'ok':False,'passed':0,'failed':1,'errors':[{'code':'test.browser.timeout','sourceId':url,'pointer':'','relatedIds':modules}]}
                    return received
                finally:
                    if proc.poll() is None: proc.terminate()
                    try: proc.wait(timeout=8)
                    except subprocess.TimeoutExpired: proc.kill(); proc.wait()
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=3)
