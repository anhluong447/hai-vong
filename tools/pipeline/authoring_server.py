"""Explicit opt-in loopback authoring host; player hosting has no write capability."""
import json
from pathlib import Path
import secrets
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from urllib.parse import urlsplit,parse_qs
from browser_runner import run_browser
from server import StaticHandler,create_server
from source_writer import SourceWriter,failed

CODE_ROOT=Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES=4_000_000

def load_sources(root,candidate_name=None,candidate=None):
    root=Path(root).resolve()
    def read(path):
        path=path.resolve();path.relative_to(root)
        return candidate if candidate_name==path.relative_to(root).as_posix() else json.loads(path.read_text(encoding='utf-8-sig'))
    path=root/'content/project.json';project=read(path)
    schemas={key:read(path.parent/ref) for key,ref in project['schemas'].items()}
    docs=[]
    for ref in project['packs']:
        pack_path=(path.parent/ref).resolve();pack=read(pack_path)
        for entry in pack['documents']:
            doc_path=(pack_path.parent/entry['path']).resolve();doc_path.relative_to(root)
            docs.append({**entry,'sourceId':'/'+doc_path.relative_to(root).as_posix(),'data':read(doc_path)})
    return {'project':project,'schemas':schemas,'documents':docs}

def create_authoring_server(root,port=8080):
    root=Path(root).resolve();token=secrets.token_urlsafe(32)
    allowed=[d['sourceId'].lstrip('/') for d in load_sources(root)['documents']]
    def validate(name,data):
        try:sources=load_sources(root,name,data)
        except (ValueError,OSError):return failed('authoring.project.invalid',name)
        return run_browser(CODE_ROOT,modules=[],page='/tools/workspace/validate.html',payload=sources)
    writer=SourceWriter(root,allowed,validate)
    class Handler(StaticHandler):
        def reply(self,status,data):
            encoded=json.dumps(data,ensure_ascii=False).encode('utf-8');self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(encoded)
        def authorized(self,write=False):
            expected=f'http://127.0.0.1:{self.server.server_port}'
            if self.headers.get('Host')!=f'127.0.0.1:{self.server.server_port}':return False
            origin=self.headers.get('Origin')
            if origin not in (None,expected) or self.headers.get('Sec-Fetch-Site')=='cross-site':return False
            if write and origin!=expected:return False
            return True
        def do_GET(self):
            path=urlsplit(self.path)
            if path.path=='/_authoring/session':
                self.reply(200,{'ok':True,'value':{'token':token}}) if self.authorized() else self.reply(403,failed('authoring.request.denied'));return
            if path.path=='/_authoring/document':
                if not self.authorized() or not secrets.compare_digest(self.headers.get('X-HoiAm-Token',''),token):self.reply(403,failed('authoring.request.denied'));return
                name=parse_qs(path.query).get('path',[''])[0];result=writer.read(name);self.reply(200 if result['ok'] else 422,result);return
            super().do_GET()
        def do_POST(self):
            if urlsplit(self.path).path!='/_authoring/write' or not self.authorized(True) or not secrets.compare_digest(self.headers.get('X-HoiAm-Token',''),token):self.reply(403,failed('authoring.request.denied'));return
            try:
                if self.headers.get('Content-Type')!='application/json':raise ValueError('content type')
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=MAX_REQUEST_BYTES:raise ValueError('size')
                data=json.loads(self.rfile.read(size))
                if not isinstance(data,dict) or not isinstance(data.get('documentId'),str) or not isinstance(data.get('expectedHash'),str) or 'content' not in data:raise ValueError('shape')
                name=data['documentId'].lstrip('/')
                result=writer.save(name,data['content'],data['expectedHash']);self.reply(200 if result['ok'] else 422,result)
            except (KeyError,ValueError,TypeError):self.reply(400,failed('authoring.request.invalid'))
    server=create_server(root,port,Handler);server.authoring_token=token
    return server
