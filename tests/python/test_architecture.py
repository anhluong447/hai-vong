import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]

class ArchitectureTests(unittest.TestCase):
    def check(self, files):
        path=ROOT/'tools/pipeline/check_architecture.py'
        self.assertTrue(path.exists(), 'architecture checker not implemented')
        spec=importlib.util.spec_from_file_location('architecture',path)
        mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for name,text in files.items():
                p=root/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf-8')
            return mod.check(root)

    def test_inner_layers_reject_browser_apis_and_outer_imports(self):
        errors=self.check({'src/domain/rule.js': "import {x} from '../infrastructure/x.js'; export const f=()=>window.fetch('/api');", 'src/infrastructure/x.js': 'export const x=1;'})
        self.assertIn('architecture.import', [e['code'] for e in errors])
        self.assertIn('architecture.browser-api', [e['code'] for e in errors])

    def test_cycles_and_production_fixture_import_are_rejected(self):
        errors=self.check({'src/domain/a.js': "import './b.js';", 'src/domain/b.js': "import './a.js';", 'src/bootstrap/main.js': "import '../../tests/fixture.js';", 'tests/fixture.js':''})
        self.assertIn('architecture.cycle',[e['code'] for e in errors])
        self.assertIn('architecture.import',[e['code'] for e in errors])

    def test_copy_paths_and_gameplay_mutation_in_views_are_rejected(self):
        errors=self.check({'src/presentation/view.js': "node.textContent='Xin chao'; image.src='/assets/bg.png'; state.energy=10;"})
        self.assertIn('architecture.authored-data',[e['code'] for e in errors])
        self.assertIn('architecture.mutation',[e['code'] for e in errors])

    def test_pure_domain_and_injected_port_are_allowed(self):
        self.assertEqual(self.check({'src/domain/rule.js':'export const apply=(state,value)=>({...state,energy:value});', 'src/application/use.js': 'export const load=(port)=>port.load();'}),[])
