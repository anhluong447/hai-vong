import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from project_environment import ROOT
from PIL import Image
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class AssetPipelineTests(unittest.TestCase):
    def module(self):
        self.assertTrue((ROOT/'tools/pipeline/build_assets.py').exists(),'asset pipeline not implemented')
        import build_assets
        return build_assets
    def fixture(self,root):
        p=root/'assets/sources';p.mkdir(parents=True)
        Image.new('RGBA',(16,16),(255,0,0,255)).save(p/'a.png');Image.new('RGBA',(8,12),(0,255,0,255)).save(p/'b.png')
        return {'licenses':{'LicenseRef-ProjectFixture':{'usage':'internal-development'}},'schemaVersion':1,'exportRoot':'assets/exports','entries':[{'id':'image.a','kind':'image','source':'assets/sources/a.png','required':True,'license':'LicenseRef-ProjectFixture'},{'id':'image.b','kind':'image','source':'assets/sources/b.png','required':True,'license':'LicenseRef-ProjectFixture'}],'atlases':[{'id':'atlas.test','members':['image.a','image.b'],'padding':1,'maxSize':128}]}
    def test_deterministic_build_atlas_and_incremental_rebuild(self):
        mod=self.module()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root);first=mod.build(root,spec);self.assertTrue(first['ok'],first)
            second=mod.build(root,spec);self.assertTrue(second['ok']);self.assertEqual(first['value']['manifest'],second['value']['manifest']);self.assertEqual(second['value']['rebuilt'],[])
            image_b=next(a for a in first['value']['manifest'] if a['id']=='image.b');old_b=(root/image_b['path'].lstrip('/')).read_bytes()
            Image.new('RGBA',(16,16),(0,0,255,255)).save(root/'assets/sources/a.png')
            third=mod.build(root,spec);self.assertTrue(third['ok']);self.assertEqual(set(third['value']['rebuilt']),{'image.a','atlas.test'})
            self.assertEqual((root/image_b['path'].lstrip('/')).read_bytes(),old_b)
            atlas=next(a for a in third['value']['manifest'] if a['id']=='atlas.test');self.assertEqual(len(atlas['frames']),2)
            for f in atlas['frames']:self.assertLessEqual(f['x']+f['width'],atlas['width']);self.assertLessEqual(f['y']+f['height'],atlas['height'])
    def test_missing_source_duplicate_id_and_unknown_license_are_diagnostics(self):
        mod=self.module()
        for change in ['missing','duplicate','license']:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);spec=self.fixture(root)
                if change=='missing':(root/'assets/sources/a.png').unlink()
                if change=='duplicate':spec['entries'][1]['id']='image.a'
                if change=='license':spec['entries'][0]['license']='unknown-license'
                result=mod.build(root,spec);self.assertFalse(result['ok'],change);self.assertTrue(result['errors'])
    def test_source_bundle_restores_verified_bytes_and_rejects_tampering(self):
        mod=self.module()
        import restore_assets
        with tempfile.TemporaryDirectory() as temp,tempfile.TemporaryDirectory() as target:
            root=Path(temp);spec=self.fixture(root)
            bundled=mod.bundle_sources(root,spec,root/'bundle.zip');self.assertTrue(bundled['ok'])
            inventory=bundled['value'];self.assertTrue(restore_assets.restore(Path(target),root/'bundle.zip',inventory)['ok'])
            for e in inventory['files']:self.assertEqual(hashlib.sha256((Path(target)/e['path']).read_bytes()).hexdigest(),e['sha256'])
            inventory['files'][0]['sha256']='0'*64
            self.assertFalse(restore_assets.restore(Path(target),root/'bundle.zip',inventory)['ok'])

    def test_restore_does_not_overwrite_edited_source_masters(self):
        mod=self.module()
        import restore_assets
        with tempfile.TemporaryDirectory() as temp,tempfile.TemporaryDirectory() as target:
            root=Path(temp);spec=self.fixture(root);inventory=mod.bundle_sources(root,spec,root/'bundle.zip')['value']
            destination=Path(target);path=destination/'assets/sources/a.png';path.parent.mkdir(parents=True);path.write_bytes(b'valuable edited master')
            result=restore_assets.restore(destination,root/'bundle.zip',inventory)
            self.assertFalse(result['ok']);self.assertEqual(path.read_bytes(),b'valuable edited master');self.assertFalse((destination/'assets/sources/b.png').exists())

    def test_audio_conversion_is_reproducible_with_the_pinned_binary(self):
        mod=self.module()
        import math,struct,wave
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root);path=root/'assets/sources/tone.wav'
            with wave.open(str(path),'wb') as stream:
                stream.setnchannels(1);stream.setsampwidth(2);stream.setframerate(44100)
                stream.writeframes(b''.join(struct.pack('<h',int(5000*math.sin(2*math.pi*440*i/44100))) for i in range(22050)))
            spec['entries'].append({'id':'audio.tone','kind':'audio','source':'assets/sources/tone.wav','license':'LicenseRef-ProjectFixture','required':True,'sampleRate':44100,'channels':1,'quality':4})
            first=mod.build(root,spec);self.assertTrue(first['ok'],first)
            resource=next(r for r in first['value']['manifest'] if r['id']=='audio.tone');self.assertEqual(resource['duration'],0.5)
            old=(root/resource['path'].lstrip('/')).read_bytes();self.assertLess(len(old),path.stat().st_size)
            (root/'.cache/assets/build-state.json').unlink()
            second=mod.build(root,spec);self.assertTrue(second['ok'],second);again=next(r for r in second['value']['manifest'] if r['id']=='audio.tone')
            self.assertEqual(resource['hash'],again['hash'])

    def test_import_inspects_a_master_and_audit_rejects_tampered_export(self):
        self.module()
        self.assertTrue((ROOT/'tools/pipeline/import_assets.py').exists(),'asset importer not implemented')
        self.assertTrue((ROOT/'tools/pipeline/audit_assets.py').exists(),'asset audit not implemented')
        import import_assets,audit_assets
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root)
            inspected=import_assets.inspect(root,'assets/sources/a.png','image.a','LicenseRef-ProjectFixture');self.assertTrue(inspected['ok']);self.assertEqual(inspected['value']['width'],16)
            self.assertFalse(import_assets.inspect(root,'../outside.png','image.a','LicenseRef-ProjectFixture')['ok'])
            result=self.module().build(root,spec);manifest=result['value']['manifest'];self.assertTrue(audit_assets.audit(root,manifest)['ok'])
            (root/manifest[0]['path'].lstrip('/')).write_bytes(b'broken rendition')
            self.assertFalse(audit_assets.audit(root,manifest)['ok'])
