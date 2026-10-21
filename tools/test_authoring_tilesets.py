"""Tileset writer integration on disposable roots, including failed publication."""
import base64
import concurrent.futures
import copy
import hashlib
import io
import http.client
import json
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from unittest.mock import patch
from PIL import Image
from tools.authoring_write import AuthoringError
from tools.authoring_tilesets import TilesetWriter

ROOT=Path(__file__).resolve().parents[1]


class TilesetWriterTest(unittest.TestCase):
    def setUp(self):
        parent=ROOT/'tmp/tileset-tests';parent.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=parent);self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        paths=['content/world/tileset.json','content/maps/scene-contract.json','content/maps/prefabs.json','content/locales/vi.js','assets/pixel/atlas.json','assets/pixel/tiles.png','content/maps/scenes-data.js']+[f'content/maps/scenes/{s}.json' for s in ('home','yard','street','newsroom','interaction')]
        for name in paths:
            p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,p)
        self.writer=TilesetWriter(self.root,threading.RLock())

    def png(self,size=(32,16)):
        stream=io.BytesIO();Image.new('RGBA',size,(25,140,55,255)).save(stream,format='PNG');return stream.getvalue()

    def request(self,size=(32,16),tile=16):
        return {'baseHash':self.writer.read()['hash'],'pngBase64':base64.b64encode(self.png(size)).decode(),'sourceName':'tiles.png','tilePixels':tile,'margin':0,'spacing':0}

    def test_import_retains_bytes_and_duplicate_ids(self):
        request=self.request();result=self.writer.import_png(request);image=self.png()
        self.assertTrue(result['applied']);self.assertEqual(result['payload']['tiles'][-1]['id'],17)
        digest=hashlib.sha256(image).hexdigest();self.assertEqual((self.root/f'assets/tilesets/{digest}.png').read_bytes(),image)
        again=self.writer.import_png(dict(request,baseHash=result['hash']));self.assertEqual(again['hash'],result['hash']);self.assertEqual(len(again['payload']['tiles']),18)
        bad=dict(request,baseHash=result['hash'],tilePixels=32)
        with self.assertRaises(AuthoringError):self.writer.import_png(bad)

    def test_supported_sizes_and_invalid_images(self):
        for size in (16,24,32,48):
            result=self.writer.import_png(self.request((size*2,size),size));self.assertTrue(result['applied'])
        for change in ({'pngBase64':'invalid'},{'tilePixels':17},{'spacing':-1},{'pngBase64':base64.b64encode(self.png((33,16))).decode()},{'pngBase64':base64.b64encode(self.png((4097,16))).decode()}):
            request=self.request();request.update(change)
            with self.assertRaises(AuthoringError):self.writer.import_png(request)

    def test_conflict_and_concurrent_import_do_not_overwrite(self):
        request=self.request()
        def run():
            try:return self.writer.import_png(request)['applied']
            except AuthoringError as error:return error.code
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:run(),range(2)))
        self.assertCountEqual(results,[True,'CONFLICT'])

    def test_global_collision_validation_and_no_deletion(self):
        current=self.writer.read();payload=copy.deepcopy(current['payload'])
        for tile in payload['tiles']:tile['collision']='solid'
        with self.assertRaises(AuthoringError):self.writer.save_catalog({'baseHash':current['hash'],'payload':payload})
        payload=copy.deepcopy(current['payload']);payload['tiles'].pop()
        with self.assertRaises(AuthoringError):self.writer.save_catalog({'baseHash':current['hash'],'payload':payload})

    def test_publication_failure_restores_source_and_generated(self):
        before={name:(self.root/name).read_bytes() for name in ('content/world/tileset.json','content/maps/scenes-data.js')}
        original=self.writer._replace
        def replace(path,data):
            if path.name=='scenes-data.js':raise OSError('injected failure')
            return original(path,data)
        with patch.object(self.writer,'_replace',side_effect=replace):
            with self.assertRaises(AuthoringError):self.writer.import_png(self.request())
        for name,value in before.items():self.assertEqual((self.root/name).read_bytes(),value)
        self.writer.recover()

    def test_dependency_edit_during_staging_wins(self):
        source=self.root/'content/maps/scenes/home.json';before=source.read_bytes();original=self.writer._before_publish
        def edit():source.write_bytes(before+b'\n');return original()
        with patch.object(self.writer,'_before_publish',side_effect=edit):
            with self.assertRaises(AuthoringError) as caught:self.writer.import_png(self.request())
        self.assertEqual(caught.exception.code,'CONFLICT');self.assertEqual(source.read_bytes(),before+b'\n')

    def test_restart_recovers_interrupted_publication(self):
        before=(self.root/'content/world/tileset.json').read_bytes();original=self.writer._replace
        def interrupt(path,data):
            if path.name=='scenes-data.js':raise SystemExit('simulated process exit')
            original(path,data)
        with patch.object(self.writer,'_replace',side_effect=interrupt):
            with self.assertRaises(SystemExit):self.writer.import_png(self.request())
        self.assertNotEqual((self.root/'content/world/tileset.json').read_bytes(),before)
        TilesetWriter(self.root,threading.RLock()).recover()
        self.assertEqual((self.root/'content/world/tileset.json').read_bytes(),before)

    def test_animated_png_and_catalog_tile_limit(self):
        stream=io.BytesIO();Image.new('RGBA',(16,16),'red').save(stream,format='PNG',save_all=True,append_images=[Image.new('RGBA',(16,16),'blue')],duration=100,loop=0)
        with self.assertRaises(AuthoringError):self.writer.import_png(dict(self.request(),pngBase64=base64.b64encode(stream.getvalue()).decode()))
        with self.assertRaises(AuthoringError):self.writer.import_png(self.request((4096,4096),16))

    def test_filename_never_selects_output_path_and_junction_rejected(self):
        result=self.writer.import_png(dict(self.request(),sourceName='../../outside.png'))
        self.assertFalse((self.root/'outside.png').exists());self.assertEqual(result['payload']['atlases'][-1]['sourceName'],'outside.png')
        if __import__('os').name=='nt':
            import _winapi
            images=self.root/'assets/tilesets';images.rename(self.root/'outside-tilesets');_winapi.CreateJunction(str(self.root/'outside-tilesets'),str(images))
            try:
                with self.assertRaises(AuthoringError):self.writer.import_png(self.request((48,16)))
            finally:images.rmdir()

    def test_http_import_uses_same_origin_token_policy(self):
        from tools.authoring_server import create_server
        with create_server(self.root,enabled=True,port=0) as server:
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                def post(path,request,**headers):
                    conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=4)
                    defaults={'Origin':f'http://127.0.0.1:{server.server_port}','Content-Type':'application/json','X-Authoring-Token':server.token};defaults.update(headers)
                    conn.request('POST',path,json.dumps(request),defaults);response=conn.getresponse();data=json.loads(response.read());conn.close();return response.status,data
                status,result=post('/__authoring/tilesets/import',self.request());self.assertEqual(status,200);self.assertTrue(result['applied'])
                for headers in ({'Origin':'http://evil.example'},{'X-Authoring-Token':'wrong'}):
                    self.assertEqual(post('/__authoring/tilesets/import',self.request(),**headers)[0],403)
            finally:server.shutdown();thread.join(timeout=2)

    def test_layered_scene_save_checks_catalog_hash_and_supports_large_maps(self):
        from tools.authoring_write import AuthoringWriter
        from tools.world_tilesets import normalize_tile_layers
        writer=AuthoringWriter(self.root);source=writer.read('scene/home');scene=source['payload'];scene['layers']=normalize_tile_layers(scene);scene['schemaVersion']=2;del scene['tiles'];scene['layers'][1]['tiles'][4][4]=0
        request={'resourceId':'scene/home','schemaVersion':1,'baseHash':source['hash'],'catalogHash':self.writer.read()['hash'],'payload':scene}
        with self.assertRaises(AuthoringError):writer.save_scene(dict(request,catalogHash='0'*64))
        result=writer.save_scene(request);self.assertTrue(result['applied']);self.assertEqual(writer.read('scene/home')['payload']['schemaVersion'],2)
        scene['width']=scene['height']=256
        for layer in scene['layers']:layer['tiles']=[[0 if layer['id']=='layer-1' else None]*256 for _ in range(256)]
        large=dict(request,baseHash=result['hash'],payload=scene);self.assertGreater(len(json.dumps(large)),1024*1024)
        self.assertTrue(writer.save_scene(large)['applied'])

    def test_review_server_tilesets_use_writer_root_not_static_repository(self):
        from tools.authoring_server import create_server
        from tools.authoring_write import AuthoringWriter
        with create_server(ROOT,enabled=True,port=0,writer=AuthoringWriter(self.root)) as server:
            self.assertEqual(server.tilesets.root,self.root.resolve())

    def test_changed_catalog_during_scene_save_does_not_publish_scene(self):
        from tools.authoring_write import AuthoringWriter
        writer=AuthoringWriter(self.root);source=writer.read('scene/home')
        request={'resourceId':'scene/home','schemaVersion':1,'baseHash':source['hash'],'catalogHash':self.writer.read()['hash'],'payload':source['payload']}
        catalog=self.root/'content/world/tileset.json';before=(self.root/'content/maps/scenes/home.json').read_bytes()
        with patch.object(writer,'_before_scene_publish',side_effect=lambda:catalog.write_bytes(catalog.read_bytes()+b'\n')):
            with self.assertRaises(AuthoringError) as caught:writer.save_scene(request)
        self.assertEqual(caught.exception.code,'CONFLICT');self.assertEqual((self.root/'content/maps/scenes/home.json').read_bytes(),before)

    def test_large_catalog_properties_fit_specialized_limit(self):
        result=self.writer.import_png(self.request((4096,496)))
        payload=result['payload'];payload['tiles'][-1]['editorName']='Large atlas tile'
        request={'baseHash':result['hash'],'payload':payload}
        self.assertGreater(len(json.dumps(request)),1024*1024)
        self.assertTrue(self.writer.save_catalog(request)['applied'])

    def test_scene_route_rejects_nonstring_resource_and_oversized_payload(self):
        from tools.authoring_write import AuthoringWriter
        writer=AuthoringWriter(self.root);source=writer.read('scene/home')
        request={'resourceId':'scene/home','schemaVersion':1,'baseHash':source['hash'],'catalogHash':self.writer.read()['hash'],'payload':source['payload']}
        with self.assertRaises(AuthoringError):writer.save_scene(dict(request,resourceId=[]))
        large=copy.deepcopy(request);large['payload']['padding']='x'*(8*1024*1024)
        with self.assertRaises(AuthoringError) as caught:writer.save_scene(large)
        self.assertEqual(caught.exception.status,413)


if __name__=='__main__':unittest.main()
