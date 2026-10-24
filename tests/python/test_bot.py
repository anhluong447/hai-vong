import json,shutil,sys,tempfile,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))
class BotPipelineTests(unittest.TestCase):
    def test_real_project_bot_writes_current_coverage_artifact(self):
        from bot import run_bot
        result=run_bot(ROOT,pack='foundation-demo');self.assertTrue(result['ok'],result);self.assertEqual(result['coverage']['choices'],{'seen':6,'total':6});self.assertEqual(result['coverage']['fixtures'],{'seen':14,'total':14});self.assertTrue((ROOT/result['artifact']).is_file())
    def test_pack_missing_a_required_binary_returns_non_success_and_a_local_report(self):
        from bot import run_bot
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for name in ['content','src','tools/workspace','assets/exports']:shutil.copytree(ROOT/name,root/name)
            path=root/'content/assets/manifest.json';manifest=json.loads(path.read_bytes());next(asset for asset in manifest if asset['id']=='image.fixture.scene')['path']='/assets/exports/absent-required.png';path.write_text(json.dumps(manifest),encoding='utf-8');result=run_bot(root);self.assertFalse(result['ok']);self.assertTrue(any(error['code']=='bot.asset.required' for error in result['errors']));self.assertTrue((root/result['artifact']).is_file())
    def test_unknown_pack_is_an_error_instead_of_silently_traversing_another_pack(self):
        from bot import run_bot
        result=run_bot(ROOT,pack='absent');self.assertFalse(result['ok']);self.assertEqual(result['errors'][0]['code'],'bot.pack.unknown')
