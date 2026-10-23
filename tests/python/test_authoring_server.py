import importlib.util
import hashlib
import http.client
import json
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import unittest
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class AuthoringServerTests(unittest.TestCase):
    def test_asset_rebuild_uses_the_saved_recipe_and_preserves_manifest_when_the_pipeline_fails(self):
        module=self.load()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);shutil.copytree(ROOT/'content',root/'content');shutil.copytree(ROOT/'src/contracts/schemas',root/'src/contracts/schemas');shutil.copytree(ROOT/'assets/sources',root/'assets/sources')
            server=module.create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();origin=f'http://127.0.0.1:{server.server_port}';recipe=root/'content/assets/imports.json';manifest=root/'content/assets/manifest.json'
            def rebuild(expected_hash):
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=60);client.request('POST','/_authoring/build-assets',json.dumps({'documentId':'/content/assets/imports.json','expectedHash':expected_hash}),{'Content-Type':'application/json','Origin':origin,'X-HoiAm-Token':server.authoring_token});response=client.getresponse();value=(response.status,json.loads(response.read()));client.close();return value
            try:
                spec=json.loads(recipe.read_bytes());spec['atlases'][0]['padding']=2;recipe.write_text(json.dumps(spec),encoding='utf-8');revision=hashlib.sha256(recipe.read_bytes()).hexdigest();status,result=rebuild(revision);self.assertEqual(status,200,result);self.assertTrue(result['ok'],result)
                atlas=next(entry for entry in json.loads(manifest.read_bytes()) if entry['id']=='atlas.fixture.actor');self.assertEqual((atlas['width'],atlas['height']),(70,68));self.assertEqual(atlas['frames'][0]['x'],2);good=manifest.read_bytes()
                status,result=rebuild('stale');self.assertEqual(status,422);self.assertFalse(result['ok']);self.assertEqual(manifest.read_bytes(),good)
                spec['atlases'][0]['maxSize']=1;recipe.write_text(json.dumps(spec),encoding='utf-8');status,result=rebuild(hashlib.sha256(recipe.read_bytes()).hexdigest());self.assertEqual(status,422);self.assertFalse(result['ok']);self.assertEqual(manifest.read_bytes(),good)
            finally:server.shutdown();server.server_close();thread.join()

    def test_batch_endpoint_validates_a_locale_and_reference_rename_as_one_revision(self):
        module=self.load()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);shutil.copytree(ROOT/'content',root/'content');shutil.copytree(ROOT/'src/contracts/schemas',root/'src/contracts/schemas')
            server=module.create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();origin=f'http://127.0.0.1:{server.server_port}'
            names=['content/locales/vi.json','content/locales/test-expanded.json','content/dev/foundation/chapter.json'];before={name:(root/name).read_bytes() for name in names};changes=[]
            for i,name in enumerate(names):
                data=json.loads(before[name])
                if i<2:data['author.fixture.begin']=data.pop('foundation.begin')
                else:data['nodes'][0]['commands'][0]['textKey']='author.fixture.begin'
                changes.append({'documentId':'/'+name,'content':data,'expectedHash':hashlib.sha256(before[name]).hexdigest()})
            def request(documents):
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=50);client.request('POST','/_authoring/write-batch',json.dumps({'documents':documents}),{'Content-Type':'application/json','Origin':origin,'X-HoiAm-Token':server.authoring_token});response=client.getresponse();value=(response.status,json.loads(response.read()));client.close();return value
            try:
                status,result=request(changes[:1]);self.assertEqual(status,422);self.assertFalse(result['ok']);self.assertEqual({name:(root/name).read_bytes() for name in names},before)
                status,result=request(changes);self.assertEqual(status,200);self.assertTrue(result['ok'],result)
                self.assertEqual(json.loads((root/names[2]).read_bytes())['nodes'][0]['commands'][0]['textKey'],'author.fixture.begin')
                good={name:(root/name).read_bytes() for name in names};status,result=request(changes);self.assertEqual(status,422);self.assertFalse(result['ok']);self.assertEqual({name:(root/name).read_bytes() for name in names},good)
            finally:server.shutdown();server.server_close();thread.join()

    def load(self):
        self.assertTrue((ROOT/'tools/pipeline/authoring_server.py').exists(),'authoring server not implemented')
        import authoring_server
        return authoring_server
    def test_origin_token_validation_and_real_shared_validator_protect_sources(self):
        module=self.load()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);shutil.copytree(ROOT/'content',root/'content');shutil.copytree(ROOT/'src/contracts/schemas',root/'src/contracts/schemas')
            server=module.create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            origin=f'http://127.0.0.1:{server.server_port}'
            def request(data,headers):
                c=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=50)
                c.request('POST','/_authoring/write',json.dumps(data),{'Content-Type':'application/json',**headers})
                r=c.getresponse();status=r.status;body=json.loads(r.read());c.close();return status,body
            try:
                name='content/dev/foundation/chapter.json';path=root/name;raw=path.read_bytes();data=json.loads(raw)
                payload={'documentId':name,'content':data,'expectedHash':hashlib.sha256(raw).hexdigest()}
                self.assertEqual(request(payload,{'Origin':'https://unrelated.invalid','X-HoiAm-Token':server.authoring_token})[0],403)
                self.assertEqual(request(payload,{'Origin':origin,'X-HoiAm-Token':'wrong'})[0],403)
                headers={'Origin':origin,'X-HoiAm-Token':server.authoring_token}
                for attempt in range(12):
                    self.assertEqual(request(payload,{**headers,'Host':'unrelated.invalid'})[0],403,attempt)
                invalid=json.loads(raw);invalid['entryNodeId']='absent';payload['content']=invalid
                status,body=request(payload,headers);self.assertFalse(body['ok']);self.assertTrue(any(e['code']=='story.entry.missing' for e in body['errors']),body);self.assertEqual(path.read_bytes(),raw)
                payload['content']=data;data['nodes'][0]['commands'][0]['textKey']='foundation.end'
                status,body=request(payload,headers);self.assertEqual(status,200,body);self.assertTrue(body['ok'],body)
                saved=path.read_bytes();self.assertNotEqual(saved,raw)
                status,body=request(payload,headers);self.assertFalse(body['ok']);self.assertEqual(body['errors'][0]['code'],'authoring.write.conflict');self.assertEqual(path.read_bytes(),saved)
            finally:server.shutdown();server.server_close();thread.join()
