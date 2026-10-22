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
                self.assertEqual(request(payload,{**headers,'Host':'unrelated.invalid'})[0],403)
                invalid=json.loads(raw);invalid['entryNodeId']='absent';payload['content']=invalid
                status,body=request(payload,headers);self.assertFalse(body['ok']);self.assertTrue(any(e['code']=='story.entry.missing' for e in body['errors']),body);self.assertEqual(path.read_bytes(),raw)
                payload['content']=data;data['nodes'][0]['commands'][0]['textKey']='foundation.end'
                status,body=request(payload,headers);self.assertEqual(status,200);self.assertTrue(body['ok'],body)
                saved=path.read_bytes();self.assertNotEqual(saved,raw)
                status,body=request(payload,headers);self.assertFalse(body['ok']);self.assertEqual(body['errors'][0]['code'],'authoring.write.conflict');self.assertEqual(path.read_bytes(),saved)
            finally:server.shutdown();server.server_close();thread.join()
