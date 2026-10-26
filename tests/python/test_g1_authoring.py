import hashlib,http.client,json,shutil,sys,tempfile,threading,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class G1AuthoringTests(unittest.TestCase):
    def test_real_group_writer_preserves_art_fields_and_rejects_conflicts(self):
        from authoring_server import create_authoring_server
        from project_sources import load_sources
        from browser_runner import run_browser
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)
            for name in ['content','src/contracts/schemas','assets/sources','assets/exports']:shutil.copytree(ROOT/name,root/name)
            sources=load_sources(root)
            for doc in sources['documents']:doc['sourceHash']=hashlib.sha256((root/doc['sourceId'].lstrip('/')).read_bytes()).hexdigest()
            report=run_browser(ROOT,['/tests/authoring/g1-art-roundtrip.test.js'],payload={'sources':sources},timeout=120)
            self.assertTrue(report['ok'],report)
            documents=next(r['detail']['documents'] for r in report['results'] if 'documents' in r.get('detail',{}))
            self.assertEqual(len(documents),4)
            server=create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            def post(values):
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=60);client.request('POST','/_authoring/write-batch',json.dumps({'documents':values}),{'Content-Type':'application/json','Origin':f'http://127.0.0.1:{server.server_port}','X-HoiAm-Token':server.authoring_token});response=client.getresponse();result=response.status,json.loads(response.read());client.close();return result
            try:
                status,result=post(documents);self.assertEqual(status,200,result);self.assertTrue(result['ok'])
                good={doc['documentId']:(root/doc['documentId'].lstrip('/')).read_bytes() for doc in documents}
                for doc in documents:self.assertEqual(json.loads(good[doc['documentId']]),doc['content'])
                status,result=post(documents);self.assertEqual(status,422);self.assertFalse(result['ok'])
                invalid=json.loads(json.dumps(documents))
                for doc in invalid:doc['expectedHash']=hashlib.sha256(good[doc['documentId']]).hexdigest()
                story=next(d for d in invalid if d['documentId'].endswith('/recruit.json'));story['content']['nodes'][0]['commands'][0]['expressionId']='missing'
                status,result=post(invalid);self.assertEqual(status,422);self.assertFalse(result['ok'])
                for name,raw in good.items():self.assertEqual((root/name.lstrip('/')).read_bytes(),raw)
            finally:server.shutdown();server.server_close();thread.join()
