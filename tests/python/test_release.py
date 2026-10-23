import hashlib,json,shutil,sys,tempfile,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class ReleaseTests(unittest.TestCase):
    def fixture(self,root):
        for name in ['src','content','styles','assets','tools/pipeline']:shutil.copytree(ROOT/name,root/name)
        shutil.copy2(ROOT/'index.html',root/'index.html')
        shutil.copy2(ROOT/'requirements-tools.txt',root/'requirements-tools.txt')
    def receipts(self,root):
        from release import input_fingerprint
        fingerprint=input_fingerprint(root);version=json.loads((root/'content/project.json').read_bytes())['contentVersion']
        # Synthetic receipts are packaging-unit inputs. The public build CLI runs
        # every real gate; these tests make no claim that those gates ran here.
        return [{'suite':name,'ok':True,'fingerprint':fingerprint,'contentVersion':version,'command':['synthetic-packaging-fixture']} for name in ['architecture','content','unit','browser','authoring','bot']]
    def test_export_is_reproducible_and_omits_authoring_test_debug_masters_and_archive(self):
        from release import assemble
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);source=(root/'content/packs/foundation-demo.json').read_bytes();first=assemble(root,profile='foundation-demo',output=root/'dist/a',receipts=self.receipts(root));self.assertTrue(first['ok'],first);second=assemble(root,profile='foundation-demo',output=root/'dist/b',receipts=self.receipts(root));self.assertTrue(second['ok'],second)
            self.assertEqual(first['value']['fingerprint'],second['value']['fingerprint']);self.assertEqual(Path(first['value']['archive']).read_bytes(),Path(second['value']['archive']).read_bytes());target=Path(first['value']['directory']);files=[path.relative_to(target).as_posix() for path in target.rglob('*') if path.is_file()]
            self.assertIn('index.html',files);self.assertIn('THIRD-PARTY-NOTICES.txt',files);self.assertFalse(any(name.startswith(('tools/','tests/','archive/','assets/sources/','.cache/')) or name.endswith(('DebugSession.js','ReloadService.js','TraversalBot.js','ui/debug.json')) for name in files),files)
            pack=json.loads((target/'content/packs/foundation-demo.json').read_bytes());self.assertFalse(any(entry.get('authoringOnly') for entry in pack['documents']));self.assertEqual((root/'content/packs/foundation-demo.json').read_bytes(),source)
    def test_failed_gate_or_corrupt_input_leaves_previous_release_and_latest_pointer_intact(self):
        from release import assemble
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);output=root/'dist';good=assemble(root,profile='foundation-demo',output=output,receipts=self.receipts(root));self.assertTrue(good['ok'],good);latest=output/'foundation-demo/latest.json';before=latest.read_bytes();archive=Path(good['value']['archive']).read_bytes()
            incomplete=[receipt for receipt in self.receipts(root) if receipt['suite']!='browser'];failed=assemble(root,profile='foundation-demo',output=output,receipts=incomplete);self.assertFalse(failed['ok']);self.assertTrue(any(error['code']=='release.gate.missing' for error in failed['errors']));self.assertEqual(latest.read_bytes(),before)
            (root/'assets/sources/scene.png').unlink();failed=assemble(root,profile='foundation-demo',output=output,receipts=self.receipts(root));self.assertFalse(failed['ok']);self.assertEqual(latest.read_bytes(),before);self.assertEqual(Path(good['value']['archive']).read_bytes(),archive)
    def test_asset_hash_missing_rendition_unknown_license_and_incompatible_version_block_export(self):
        from release import assemble
        mutations=[
            lambda root:(root/'assets/exports'/next(path.name for path in (root/'assets/exports').glob('*.png'))).unlink(),
            lambda root:(root/'assets/sources/scene.png').write_bytes(b'corrupt source'),
            lambda root:self.mutate(root/'content/assets/manifest.json',lambda data:data[0].update(hash='0'*64)),
            lambda root:self.mutate(root/'content/assets/manifest.json',lambda data:data[0].update(license='Unknown-License')),
            lambda root:(root/'src/contracts/RunSnapshot.js').write_text('export const RUN_SCHEMA_VERSION=999;',encoding='utf-8'),
            lambda root:(root/'src/bootstrap/main.js').write_text((root/'src/bootstrap/main.js').read_text(encoding='utf-8')+"\nimport '../application/DebugSession.js';\n",encoding='utf-8')
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation),tempfile.TemporaryDirectory() as temp:
                root=Path(temp);self.fixture(root);mutation(root);result=assemble(root,profile='foundation-demo',output=root/'dist',receipts=self.receipts(root));self.assertFalse(result['ok'],result);self.assertFalse((root/'dist/foundation-demo/latest.json').exists())
    def test_stale_evidence_and_undeclared_profile_fail_before_publishing(self):
        from release import assemble
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);receipts=self.receipts(root);receipts[0]['fingerprint']='0'*64;result=assemble(root,profile='foundation-demo',output=root/'dist',receipts=receipts);self.assertFalse(result['ok']);self.assertTrue(any(error['code']=='release.gate.stale' for error in result['errors']));self.assertFalse(assemble(root,profile='undeclared',output=root/'dist',receipts=self.receipts(root))['ok'])
    def mutate(self,path,change):
        data=json.loads(path.read_bytes());change(data);path.write_text(json.dumps(data),encoding='utf-8')

    def test_unexpected_files_in_existing_artifact_are_rejected(self):
        from release import assemble
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);output=root/'dist';first=assemble(root,profile='foundation-demo',output=output,receipts=self.receipts(root));self.assertTrue(first['ok'],first)
            target=Path(first['value']['directory']);(target/'unexpected-debug.js').write_text('debug',encoding='utf-8')
            before=(output/'foundation-demo/latest.json').read_bytes()
            again=assemble(root,profile='foundation-demo',output=output,receipts=self.receipts(root))
            self.assertFalse(again['ok'],again);self.assertEqual((output/'foundation-demo/latest.json').read_bytes(),before)
