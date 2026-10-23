import json,sys,tempfile,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))
class DevelopmentBoundaryTests(unittest.TestCase):
    def test_player_entry_has_no_reachable_mutation_debug_capability(self):
        from check_development import check
        self.assertEqual(check(ROOT),[])
    def test_static_and_dynamic_development_imports_are_rejected_before_export(self):
        from check_development import check
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'content/pipeline').mkdir(parents=True);(root/'src').mkdir();(root/'src/Debug.js').write_text('export const mutate=()=>true;')
            (root/'content/pipeline/development.json').write_text(json.dumps({'schemaVersion':1,'playerEntry':'src/main.js','forbidden':['src/Debug.js']}))
            for declaration in ["import './Debug.js';","const later=()=>import('./Debug.js');"]:
                (root/'src/main.js').write_text(declaration);self.assertIn('architecture.development-in-player',[error['code'] for error in check(root)])
            (root/'src/main.js').write_text("const service={import(value){return value;}};service.import('file');");self.assertEqual(check(root),[])
