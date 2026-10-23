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
from watcher import RevisionWatcher,tracked_inputs

CODE_ROOT=Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES=4_000_000

from project_sources import load_sources

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
    watcher=RevisionWatcher(root,lambda:tracked_inputs(root));initial_revision=watcher.scan()
    if not initial_revision['ok']:raise ValueError(json.dumps(initial_revision))
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
    def revision():
        with WRITE_LOCK:
            previous=dict(watcher.previous);fingerprint=watcher.fingerprint;result=watcher.scan()
            if not result['ok']:return result
            try:
                changed=set(result['value']['changed']);recipes=[doc for doc in load_sources(root)['documents'] if doc['kind']=='config' and isinstance(doc['data'],dict) and doc['data'].get('kind')=='asset-imports'];rebuilt=False
                for recipe in recipes:
                    name=recipe['sourceId'].lstrip('/');spec=recipe['data'];inputs={name,*[entry['source'] for entry in spec['entries']],*spec.get('generationInputs',[])}
                    if not changed.intersection(inputs):continue
                    current=writer.read(name)
                    if not current['ok']:return current
                    built=rebuild_assets(name,current['value']['hash'])
                    if not built['ok']:
                        watcher.previous=previous;watcher.fingerprint=fingerprint;return built
                    rebuilt=True
                if rebuilt:
                    result=watcher.scan()
                    if not result['ok']:return result
                    result['value']['changed']=sorted(changed|set(result['value']['changed']))
                result['value']['assetBuild']=rebuilt;return result
            except (ValueError,KeyError,TypeError,OSError):return failed('watch.inputs.invalid')
    class Handler(StaticHandler):
        def reply(self,status,data):
            encoded=json.dumps(data,ensure_ascii=False).encode('utf-8');self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(encoded)));self.end_headers();self.wfile.write(encoded)
        def deny_post(self):
            # Closing a socket with unread POST bytes can reset the connection on
            # Windows before the caller receives its rejection. Drain only a
            # bounded body with a bounded socket wait; never accept its contents.
            try:
                size=int(self.headers.get('Content-Length','0'))
                if 0<size<=MAX_REQUEST_BYTES:self.connection.settimeout(2);self.rfile.read(size)
            except (ValueError,OSError):pass
            self.reply(403,failed('authoring.request.denied'))
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
            if path.path=='/_authoring/revision':
                if not self.authorized() or not secrets.compare_digest(self.headers.get('X-HoiAm-Token',''),token):self.reply(403,failed('authoring.request.denied'));return
                result=revision();self.reply(200 if result['ok'] else 422,result);return
            super().do_GET()
        def do_POST(self):
            route=urlsplit(self.path).path
            if route not in ('/_authoring/write','/_authoring/write-batch','/_authoring/build-assets') or not self.authorized(True) or not secrets.compare_digest(self.headers.get('X-HoiAm-Token',''),token):self.deny_post();return
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
