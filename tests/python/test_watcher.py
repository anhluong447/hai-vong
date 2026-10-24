import hashlib
from pathlib import Path
import sys,tempfile,unittest
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class WatcherTests(unittest.TestCase):
    def test_revision_changes_only_for_watched_bytes_and_reports_deleted_inputs(self):
        from watcher import RevisionWatcher
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'source.json').write_text('{}');(root/'art.png').write_bytes(b'PNG one')
            watcher=RevisionWatcher(root,lambda:['source.json','art.png']);first=watcher.scan();self.assertTrue(first['ok']);revision=first['value']['fingerprint'];self.assertEqual(len(revision),64)
            self.assertEqual(watcher.scan()['value']['changed'],[]);(root/'unwatched.txt').write_text('ignored');self.assertEqual(watcher.scan()['value']['fingerprint'],revision)
            (root/'art.png').write_bytes(b'PNG two');next=watcher.scan();self.assertNotEqual(next['value']['fingerprint'],revision);self.assertEqual(next['value']['changed'],['art.png'])
            (root/'source.json').unlink();deleted=watcher.scan();self.assertEqual(deleted['value']['missing'],['source.json']);self.assertIn('source.json',deleted['value']['changed'])

    def test_watcher_rejects_external_paths_before_opening_them(self):
        from watcher import RevisionWatcher
        with tempfile.TemporaryDirectory() as temp:
            watcher=RevisionWatcher(Path(temp),lambda:['../outside.json']);result=watcher.scan();self.assertFalse(result['ok']);self.assertEqual(result['errors'][0]['code'],'watch.path.denied')

    def test_real_manifest_inputs_include_recipes_masters_and_generated_browser_assets(self):
        from watcher import tracked_inputs
        inputs=tracked_inputs(ROOT);self.assertIn('content/project.json',inputs);self.assertIn('content/assets/imports.json',inputs);self.assertIn('content/dev/foundation/chapter.json',inputs)
        self.assertTrue(any(name.startswith('assets/sources/') and name.endswith('.png') for name in inputs));self.assertTrue(any(name.startswith('assets/exports/') for name in inputs));self.assertTrue(any(name.startswith('src/contracts/schemas/') for name in inputs))
