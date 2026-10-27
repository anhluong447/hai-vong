"""Large visual receipts must arrive or fail explicitly, never become timeouts."""
import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools/pipeline'))
from browser_runner import run_browser
from local_environment import ROOT,configure

class BrowserResultTransportTests(unittest.TestCase):
 def run_payload(self,size):
  configure()
  with tempfile.TemporaryDirectory(prefix='transport-',dir=ROOT/'tests') as folder:
   path=Path(folder)/'large-report.js'
   path.write_text("import {test} from '/tests/harness.js';test('large visual receipt',()=>({payload:'x'.repeat("+str(size)+")}));",encoding='utf8')
   return run_browser(ROOT,['/'+path.relative_to(ROOT).as_posix()],timeout=15)
 def test_visual_receipt_above_old_four_mb_cap_is_collected(self):
  report=self.run_payload(4_100_000)
  self.assertTrue(report['ok'],str(report.get('errors')))
  self.assertEqual(len(report['results'][0]['detail']['payload']),4_100_000)
 def test_oversize_receipt_fails_explicitly_without_timeout(self):
  report=self.run_payload(8_100_000)
  self.assertFalse(report['ok'])
  self.assertEqual(report['errors'][0]['code'],'test.browser.result.too-large')
