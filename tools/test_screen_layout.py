"""Validation and deterministic screen-pack compilation contracts."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent


class ScreenLayoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('build_screen_layout', ROOT / 'tools/build_screen_layout.py')
        cls.builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.builder)
        cls.defaults = json.loads((ROOT / 'content/ui/screen-layout.json').read_text(encoding='utf-8'))

    def test_validated_clone_keeps_native_geometry_separate(self):
        draft = copy.deepcopy(self.defaults)
        draft['regions']['hud-resources']['x'] = 24.5
        draft['regions']['dialogue-portrait']['scaleX'] = 1.2
        validated = self.builder.validate_screen_layout(draft)
        self.assertEqual(validated, draft)
        validated['regions']['hud-resources']['x'] = 42
        self.assertEqual(draft['regions']['hud-resources']['x'], 24.5)

    def test_rejects_unknown_data_and_unsafe_geometry(self):
        mutations = [('schemaVersion', 2), ('stage', {'width':1600,'height':941}),
                     ('regions.hud-date.x', '1; color:red'), ('regions.hud-date.scaleX', 0),
                     ('regions.hud-date.scaleY', float('inf')), ('regions.hud-date.width', 50),
                     ('regions.hud-date.y', True), ('regions.dialogue-choices', None)]
        for path, value in mutations:
            with self.subTest(path=path, value=value):
                draft = copy.deepcopy(self.defaults)
                parts = path.split('.')
                parent = draft
                for key in parts[:-1]:
                    parent = parent[key]
                parent[parts[-1]] = value
                with self.assertRaises(ValueError):
                    self.builder.validate_screen_layout(draft)

    def test_render_is_deterministic_and_only_targets_generated_modules(self):
        first = self.builder.render_outputs(self.defaults)
        self.assertEqual(first, self.builder.render_outputs(self.defaults))
        self.assertEqual(set(first), {'content/ui/screen-layout-data.js', 'content/ui/screen-layout-regions.js'})
        self.assertTrue(all(isinstance(text, str) for text in first.values()))


if __name__ == '__main__':
    unittest.main()
