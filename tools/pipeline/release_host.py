"""Read-only static artifact host with the exported cache policy. No editor routes."""
import argparse,json,sys
from pathlib import Path
from urllib.parse import unquote,urlsplit
from http.server import SimpleHTTPRequestHandler
from server import StaticHandler,create_server
from local_environment import require_project_path

def create_release_server(root,port=0):
    root=require_project_path(root);policy=json.loads((root/'CACHE-POLICY.json').read_bytes());manifest=json.loads((root/'release-manifest.json').read_bytes())
    names=set(manifest['files'])|{'release-manifest.json'};asset_prefix=policy['immutableAssetRoot'].strip('/')+'/'
    class ReleaseHandler(StaticHandler):
        def name(self):return unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        def allowed(self):return super().allowed() and self.name() in names
        def end_headers(self):
            self.send_header('Cache-Control',f"public, max-age={policy['maxAgeSeconds']}, immutable" if self.name() in names and self.name().startswith(asset_prefix) else 'no-cache')
            self.send_header('X-Content-Type-Options','nosniff');SimpleHTTPRequestHandler.end_headers(self)
    return create_server(root,port,ReleaseHandler)

if __name__=='__main__':
    from local_environment import configure
    configure();parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);parser.add_argument('--port',type=int,default=8081);args=parser.parse_args()
    server=create_release_server(args.directory,args.port);print(f'Read-only release: http://127.0.0.1:{server.server_port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
