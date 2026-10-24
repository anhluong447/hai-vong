import hashlib,http.client,json,shutil,sys,tempfile,threading,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class First3AuthoringPipelineTests(unittest.TestCase):
    def test_workspace_output_round_trips_through_real_batch_writer_and_conflict_recovery(self):
        from authoring_server import create_authoring_server
        from project_sources import load_sources
        from browser_runner import run_browser
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)
            for name in ['content','src/contracts/schemas','assets/sources','assets/exports']:shutil.copytree(ROOT/name,root/name)
            sources=load_sources(root)
            for doc in sources['documents']:doc['sourceHash']=hashlib.sha256((root/doc['sourceId'].lstrip('/')).read_bytes()).hexdigest()
            producer=run_browser(ROOT,['/tests/authoring/first3-pipeline.test.js'],payload={'sources':sources},timeout=120)
            report=ROOT/'.cache/test/t14-authoring-pipeline.json';report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(producer,ensure_ascii=False,indent=2),encoding='utf-8');self.assertTrue(producer['ok'],producer)
            detail=producer['results'][0]['detail'];documents=detail['documents'];self.assertGreaterEqual(len(documents),8);self.assertTrue(detail['playerUnchanged']);self.assertTrue(detail['restartRequired'])
            server=create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();origin=f'http://127.0.0.1:{server.server_port}'
            def post(values):
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=60);client.request('POST','/_authoring/write-batch',json.dumps({'documents':values}),{'Content-Type':'application/json','Origin':origin,'X-HoiAm-Token':server.authoring_token});response=client.getresponse();result=response.status,json.loads(response.read());client.close();return result
            try:
                status,result=post(documents);self.assertEqual(status,200,result);self.assertTrue(result['ok'],result)
                for doc in documents:self.assertEqual(json.loads((root/doc['documentId'].lstrip('/')).read_bytes()),doc['content'])
                good={doc['documentId']:(root/doc['documentId'].lstrip('/')).read_bytes() for doc in documents}
                status,conflict=post(documents);self.assertEqual(status,422);self.assertFalse(conflict['ok']);self.assertTrue(any(error['code']=='authoring.write.conflict' for error in conflict['errors']))
                self.assertEqual({name:(root/name.lstrip('/')).read_bytes() for name in good},good)
                invalid=json.loads(json.dumps(documents));target=next(doc for doc in invalid if doc['documentId'].endswith('/chapters/plan.json'))
                for doc in invalid:doc['expectedHash']=hashlib.sha256(good[doc['documentId']]).hexdigest()
                node=next(node for node in target['content']['nodes'] if node['id']=='authoring-node');next(command for command in node['commands'] if command['op']=='setFlag')['flagId']='flag.absent'
                status,rejected=post(invalid);self.assertEqual(status,422);self.assertFalse(rejected['ok']);self.assertTrue(any(error['code']=='flag.undeclared' for error in rejected['errors']),rejected)
                self.assertEqual({name:(root/name.lstrip('/')).read_bytes() for name in good},good)
            finally:server.shutdown();server.server_close();thread.join()
