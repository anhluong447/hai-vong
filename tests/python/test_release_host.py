import json,sys,tempfile,threading,unittest
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class ReleaseHostTests(unittest.TestCase):
    def test_static_release_revalidates_code_and_only_caches_manifested_asset_bytes(self):
        from release_host import create_release_server
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);(root/'assets/exports').mkdir(parents=True);(root/'index.html').write_text('fixture');(root/'assets/exports/image.hash.png').write_bytes(b'png');(root/'assets/exports/unlisted.png').write_bytes(b'bad')
            (root/'CACHE-POLICY.json').write_text(json.dumps({'immutableAssetRoot':'assets/exports','maxAgeSeconds':31536000}));(root/'release-manifest.json').write_text(json.dumps({'files':{'index.html':{},'assets/exports/image.hash.png':{}}}))
            server=create_release_server(root);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base+'/index.html') as response:self.assertEqual(response.headers['Cache-Control'],'no-cache')
                with urlopen(base+'/assets/exports/image.hash.png') as response:self.assertIn('immutable',response.headers['Cache-Control'])
                for name in ['/assets/exports/unlisted.png','/_authoring/project','/.venv/pyvenv.cfg']:
                    with self.assertRaises(HTTPError):urlopen(base+name)
            finally:server.shutdown();server.server_close();thread.join()
