import copy,hashlib,http.client,json,shutil,tempfile,threading,unittest
from pathlib import Path
from project_environment import ROOT

class G1R1AuthoringTests(unittest.TestCase):
    def test_real_group_writer_roundtrips_props_plants_and_presentation_without_partial_conflict_writes(self):
        from authoring_server import create_authoring_server
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)
            for name in ['content','src/contracts/schemas','assets/sources','assets/exports']:shutil.copytree(ROOT/name,root/name)
            names=['content/dev/first-three-days/scenes.json','content/animations/first3-art.json','content/presentation/room3.json']
            documents=[{'documentId':'/'+name,'expectedHash':hashlib.sha256((root/name).read_bytes()).hexdigest(),'content':json.loads((root/name).read_text(encoding='utf-8'))} for name in names]
            room=next(s for s in documents[0]['content'] if s['id']=='scene.first3.room3');room['props'][0]['sortY']+=1;room['props'][0]['shadows'][0]['opacity']=.35
            clip=next(c for c in documents[1]['content'] if c['id']=='clip.first3.khue.walk');clip['locomotion']['cycleDistance']=104;clip['locomotion']['plant']['kneeY']=142
            documents[2]['content']['camera']['followResponse60']=.08;documents[2]['content']['atmosphere']['dust']['count']=17
            server=create_authoring_server(root,0);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            def post(values):
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=60);client.request('POST','/_authoring/write-batch',json.dumps({'documents':values}),{'Content-Type':'application/json','Origin':f'http://127.0.0.1:{server.server_port}','X-HoiAm-Token':server.authoring_token});response=client.getresponse();result=response.status,json.loads(response.read());client.close();return result
            try:
                status,result=post(documents);self.assertEqual(status,200,result);self.assertTrue(result['ok'])
                good={name:(root/name).read_bytes() for name in names}
                for name,document in zip(names,documents):self.assertEqual(json.loads(good[name]),document['content'])
                self.assertEqual(post(documents)[0],422)
                invalid=copy.deepcopy(documents)
                for name,document in zip(names,invalid):document['expectedHash']=hashlib.sha256(good[name]).hexdigest()
                next(s for s in invalid[0]['content'] if s['id']=='scene.first3.room3')['props'][0]['assetId']='missing'
                status,result=post(invalid);self.assertEqual(status,422,result)
                for name,raw in good.items():self.assertEqual((root/name).read_bytes(),raw)
            finally:server.shutdown();server.server_close();thread.join()
