"""Explicit opt-in loopback authoring host; player hosting has no write capability."""
import json
from pathlib import Path
import secrets
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from urllib.parse import urlsplit,parse_qs
from browser_runner import run_browser
from server import StaticHandler,create_server
from source_writer import SourceWriter,failed,recover_batches,WRITE_LOCK,safe_path,digest

CODE_ROOT=Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES=4_000_000

def load_sources(root,candidate_name=None,candidate=None,candidates=None):
    root=Path(root).resolve()
    def read(path):
        path=path.resolve();path.relative_to(root)
        name=path.relative_to(root).as_posix()
        if candidates is not None and name in candidates:return candidates[name]
        return candidate if candidate_name==name else json.loads(path.read_text(encoding='utf-8-sig'))
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
    allowed=[d['sourceId'].lstrip('/') for d in load_sources(root)['documents'] if not d.get('generated')]
    recovered=recover_batches(root,allowed)
    if not recovered['ok']:raise ValueError(json.dumps(recovered))
    def validate(name,data):
        try:sources=load_sources(root,name,data)
        except (ValueError,OSError):return failed('authoring.project.invalid',name)
        return run_browser(CODE_ROOT,modules=[],page='/tools/workspace/validate.html',payload=sources)
    def validate_many(values):
        try:sources=load_sources(root,candidates=values)
        except (ValueError,OSError):return failed('authoring.project.invalid')
        return run_browser(CODE_ROOT,modules=[],page='/tools/workspace/validate.html',payload=sources)
    writer=SourceWriter(root,allowed,validate,validator_many=validate_many)
    def rebuild_assets(name,expected_hash):
        with WRITE_LOCK:
            try:
                current=writer.read(name)
                if not current['ok']:return current
                if current['value']['hash']!=expected_hash:return failed('authoring.write.conflict',name)
                sources=load_sources(root);recipes=[doc for doc in sources['documents'] if doc['sourceId'].lstrip('/')==name and doc['data'].get('kind')=='asset-imports']
                manifests=[doc for doc in sources['documents'] if doc['kind']=='assets' and doc.get('generated')]
                if len(recipes)!=1 or len(manifests)!=1:return failed('authoring.recipe.ambiguous',name)
                target=manifests[0]['sourceId'].lstrip('/');path=safe_path(root,target);before=path.read_bytes()
                from build_assets import build,write_changed,encoded
                built=build(root,current['value']['data'])
                if not built['ok']:return built
                manifest=built['value']['manifest'];checked=validate(target,manifest)
                if not checked['ok']:return checked
                if writer.read(name)['value']['hash']!=expected_hash or path.read_bytes()!=before:return failed('authoring.write.conflict',name)
                write_changed(path,encoded(manifest))
                return {'ok':True,'value':{'manifestDocumentId':manifests[0]['sourceId'],'manifest':manifest,'sourceHash':digest(path.read_bytes()),'recipeHash':expected_hash}}
            except (ValueError,KeyError,TypeError,OSError):return failed('authoring.build.failed',name)
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
            route=urlsplit(self.path).path
            if route not in ('/_authoring/write','/_authoring/write-batch','/_authoring/build-assets') or not self.authorized(True) or not secrets.compare_digest(self.headers.get('X-HoiAm-Token',''),token):self.reply(403,failed('authoring.request.denied'));return
            try:
                if self.headers.get('Content-Type')!='application/json':raise ValueError('content type')
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=MAX_REQUEST_BYTES:raise ValueError('size')
                data=json.loads(self.rfile.read(size))
                if route=='/_authoring/build-assets':
                    if not isinstance(data,dict) or not isinstance(data.get('documentId'),str) or not isinstance(data.get('expectedHash'),str):raise ValueError('shape')
                    result=rebuild_assets(data['documentId'].lstrip('/'),data['expectedHash']);self.reply(200 if result['ok'] else 422,result);return
                if route=='/_authoring/write-batch':
                    if not isinstance(data,dict) or not isinstance(data.get('documents'),list) or not data['documents']:raise ValueError('shape')
                    requests=[]
                    for entry in data['documents']:
                        if not isinstance(entry,dict) or not isinstance(entry.get('documentId'),str) or not isinstance(entry.get('expectedHash'),str) or 'content' not in entry:raise ValueError('shape')
                        requests.append({**entry,'documentId':entry['documentId'].lstrip('/')})
                    result=writer.save_many(requests);self.reply(200 if result['ok'] else 422,result);return
                if not isinstance(data,dict) or not isinstance(data.get('documentId'),str) or not isinstance(data.get('expectedHash'),str) or 'content' not in data:raise ValueError('shape')
                name=data['documentId'].lstrip('/')
                result=writer.save(name,data['content'],data['expectedHash']);self.reply(200 if result['ok'] else 422,result)
            except (KeyError,ValueError,TypeError):self.reply(400,failed('authoring.request.invalid'))
    server=create_server(root,port,Handler);server.authoring_token=token
    return server
