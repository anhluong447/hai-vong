import importlib.util
from pathlib import Path
import hashlib
import tempfile
import os
import subprocess
import unittest
from project_environment import ROOT

class WriterTests(unittest.TestCase):
    def module(self):
        path=ROOT/'tools/pipeline/source_writer.py'
        self.assertTrue(path.exists(),'safe source writer not implemented')
        spec=importlib.util.spec_from_file_location('source_writer',path);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
    def test_validated_atomic_write_and_stale_writer_preserve_last_good_bytes(self):
        mod=self.module()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);p=root/'content/story.json';p.parent.mkdir();p.write_text('{"id":"old"}')
            before=hashlib.sha256(p.read_bytes()).hexdigest()
            writer=mod.SourceWriter(root,['content/story.json'],lambda name,data:{'ok':True})
            result=writer.save('content/story.json',{'id':'new'},before);self.assertTrue(result['ok'],result)
            good=p.read_bytes()
            stale=writer.save('content/story.json',{'id':'stale'},before)
            self.assertFalse(stale['ok']);self.assertEqual(stale['errors'][0]['code'],'authoring.write.conflict');self.assertEqual(p.read_bytes(),good)
    def test_invalid_document_and_outside_root_never_replace_sources(self):
        mod=self.module()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);p=root/'content/story.json';p.parent.mkdir();p.write_text('{"id":"good"}');good=p.read_bytes();revision=hashlib.sha256(good).hexdigest()
            writer=mod.SourceWriter(root,['content/story.json'],lambda name,data:{'ok':False,'errors':[{'code':'story.invalid'}]})
            self.assertFalse(writer.save('content/story.json',{},revision)['ok']);self.assertEqual(p.read_bytes(),good)
            for path in ['../secret.json','/secret.json','content/../secret.json','archive/file.json']:
                result=writer.save(path,{},revision);self.assertFalse(result['ok'],path)
    def test_symlink_escape_is_rejected(self):
        mod=self.module()
        with tempfile.TemporaryDirectory() as temp,tempfile.TemporaryDirectory() as outside:
            root=Path(temp);(root/'content').mkdir();target=Path(outside)/'secret.json';target.write_text('{}')
            name='content/link.json'
            try:(root/name).symlink_to(target)
            except OSError:
                if os.name!='nt':raise
                junction=root/'content/external'
                result=subprocess.run(['cmd','/c','mklink','/J',str(junction),outside],capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW)
                self.assertEqual(result.returncode,0,'cannot exercise Windows junction escape')
                name='content/external/secret.json'
            writer=mod.SourceWriter(root,[name],lambda name,data:{'ok':True})
            result=writer.save(name,{'oops':True},hashlib.sha256(b'{}').hexdigest())
            self.assertFalse(result['ok']);self.assertEqual(target.read_text(),'{}')

    def test_validator_exception_is_a_failed_result_and_preserves_bytes(self):
        mod=self.module()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);p=root/'content/story.json';p.parent.mkdir();p.write_text('{}');raw=p.read_bytes()
            def interrupted(name,data):raise RuntimeError('validator unavailable')
            writer=mod.SourceWriter(root,['content/story.json'],interrupted)
            self.assertFalse(writer.save('content/story.json',{},hashlib.sha256(raw).hexdigest())['ok'])
            self.assertEqual(p.read_bytes(),raw)
