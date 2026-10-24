import hashlib,io,json,sys,tempfile,unittest,zipfile
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))
class PortableToolsTests(unittest.TestCase):
    def archive(self,root,members):
        path=root/'bundle.zip'
        with zipfile.ZipFile(path,'w') as archive:
            for name,data in members.items():archive.writestr(name,data)
        return path,hashlib.sha256(path.read_bytes()).hexdigest()
    def test_verified_archive_extracts_inside_the_project_and_reuses_only_unchanged_bytes(self):
        from portable_tools import extract_verified
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);archive,hash=self.archive(root,{'tool/tool.exe':b'executable','tool/data.dat':b'data'});destination=root/'.tools/worker';result=extract_verified(root,archive,destination,hash,'tool/tool.exe');self.assertTrue(result['ok'],result);self.assertEqual(Path(result['value']['executable']).read_bytes(),b'executable');self.assertTrue(extract_verified(root,archive,destination,hash,'tool/tool.exe')['ok']);(destination/'tool/data.dat').write_bytes(b'changed');self.assertFalse(extract_verified(root,archive,destination,hash,'tool/tool.exe')['ok'])
    def test_wrong_hash_or_escaping_member_never_replaces_an_existing_tool(self):
        from portable_tools import extract_verified
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);archive,hash=self.archive(root,{'tool.exe':b'old'});destination=root/'.tools/worker';self.assertTrue(extract_verified(root,archive,destination,hash,'tool.exe')['ok']);old=(destination/'tool.exe').read_bytes();self.assertFalse(extract_verified(root,archive,destination,'0'*64,'tool.exe')['ok']);self.assertEqual((destination/'tool.exe').read_bytes(),old)
            for name in ['../escape.txt','C:/outside.txt','tool/NUL']:
                archive,hash=self.archive(root,{name:b'escape'});result=extract_verified(root,archive,root/'.tools/rejected',hash,'tool.exe');self.assertFalse(result['ok']);self.assertFalse((root/'escape.txt').exists());self.assertFalse((root/'.tools/rejected').exists())

    def test_case_colliding_members_are_not_extracted_on_windows(self):
        from portable_tools import extract_verified
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);archive,hash=self.archive(root,{'tool.exe':b'exe','DATA.txt':b'one','data.txt':b'two'})
            self.assertFalse(extract_verified(root,archive,root/'.tools/collision',hash,'tool.exe')['ok'])

    def test_browser_policy_is_verified_before_a_configured_tool_is_reused(self):
        from portable_tools import configure_firefox,extract_verified
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);archive,hash=self.archive(root,{'firefox/firefox.exe':b'exe'});destination=root/'.tools/firefox';extract_verified(root,archive,destination,hash,'firefox/firefox.exe')
            policy={'policies':{'DisableAppUpdate':True}};self.assertTrue(configure_firefox(root,destination,'firefox/firefox.exe',policy)['ok'])
            self.assertTrue(extract_verified(root,archive,destination,hash,'firefox/firefox.exe')['ok'])
            (destination/'firefox/distribution/policies.json').write_bytes(b'changed')
            self.assertFalse(configure_firefox(root,destination,'firefox/firefox.exe',policy)['ok'])
