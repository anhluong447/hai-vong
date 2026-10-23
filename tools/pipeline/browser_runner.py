"""Run ES-module tests in a real isolated Chromium, collecting a tokened JSON result."""
import json
import base64
import hashlib
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import threading
import time
from contextlib import contextmanager
from urllib.parse import urlencode,urlsplit
from urllib.request import urlopen
sys.path.insert(0,str(Path(__file__).resolve().parent))
from local_environment import configure, local_path
from preflight import detect_browser
from server import StaticHandler,create_server

def cleanup_profile(profile):
    # Chrome children can release Windows handles shortly after the main exit.
    # Resolve containment before recursive cleanup; persistent failures still fail.
    local_path(profile.name)
    for attempt in range(21):
        try:
            profile.cleanup()
            return
        except PermissionError:
            if attempt == 20: raise
            time.sleep(.1)

@contextmanager
def browser_profile():
    profile=tempfile.TemporaryDirectory(prefix='hoi-am-browser-',dir=local_path('.cache/tmp'))
    try: yield profile.name
    finally: cleanup_profile(profile)

def run_browser(root,modules,params=None,timeout=40,base_url=None,page='/tests/index.html',payload=None):
    environment=configure()
    detected=detect_browser()
    if not detected['ok']: return detected
    received={}; event=threading.Event(); token=secrets.token_urlsafe(24); requests=[]
    class Handler(StaticHandler):
        def do_GET(self):
            requests.append(urlsplit(self.path).path)
            if urlsplit(self.path).path=='/_driver/'+token:
                try:
                    port=int((Path(profile)/'DevToolsActivePort').read_text().splitlines()[0])
                    with urlopen(f'http://127.0.0.1:{port}/json/list',timeout=2) as response:targets=json.load(response)
                    target=next(t for t in targets if t.get('type')=='page' and token in t.get('url',''))
                    data=json.dumps({'url':target['webSocketDebuggerUrl']}).encode('utf-8');self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(data)
                except (OSError,ValueError,StopIteration,KeyError):self.send_error(503)
                return
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
    query.append(('driver',origin+'/_driver/'+token))
    if base_url: query.append(('base',base_url))
    if payload is not None:query.append(('input',origin+'/_input/'+token))
    url=origin+page+'?'+urlencode(query)
    try:
        with browser_profile() as profile:
            with tempfile.TemporaryFile(dir=local_path('.cache/tmp')) as stderr:
                proc=subprocess.Popen([detected['value'],'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins='+origin,'--user-data-dir='+profile,url],stdout=subprocess.DEVNULL,stderr=stderr,env=environment)
                try:
                    if not event.wait(timeout):
                        stderr.flush();stderr.seek(0)
                        return {'ok':False,'passed':0,'failed':1,'errors':[{'code':'test.browser.timeout','sourceId':url,'pointer':'','relatedIds':modules}],'diagnostics':{'requests':requests[-120:],'processExit':proc.poll(),'stderr':stderr.read().decode('utf-8',errors='replace')[-8000:]}}
                    for result in received.get('results',[]):
                        detail=result.get('detail')
                        if not isinstance(detail,dict) or 'screenshot' not in detail:continue
                        try:
                            raw=base64.b64decode(detail.pop('screenshot'),validate=True)
                            if not raw.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('png')
                            destination=local_path('.cache/test/screenshots')
                            destination.mkdir(parents=True,exist_ok=True)
                            path=destination/(hashlib.sha256(result['name'].encode()).hexdigest()[:16]+'.png')
                            path.write_bytes(raw);result['artifact']=path.relative_to(local_path('.')).as_posix()
                        except (ValueError,TypeError,OSError):
                            result.update(ok=False,error='test.screenshot.invalid');received['ok']=False
                            received['passed']-=1;received['failed']+=1
                    return received
                finally:
                    if proc.poll() is None: proc.terminate()
                    try: proc.wait(timeout=8)
                    except subprocess.TimeoutExpired: proc.kill(); proc.wait()
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=3)
