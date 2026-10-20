"""Shared menu-layout contract cases and atomic builder behavior."""
import copy
from contextlib import contextmanager
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from uuid import uuid4

ROOT = Path(__file__).resolve().parent.parent


@contextmanager
def output_paths():
    # Keep fixtures in an existing workspace directory: Windows sandbox ACLs on
    # freshly-created directories can prevent access even within the workspace.
    prefix = ROOT / 'tmp' / ('menu-layout-' + uuid4().hex)
    paths = [prefix.with_suffix('.data.js'), prefix.with_suffix('.regions.js')]
    try:
        yield paths
    finally:
        for path in paths:
            path.unlink(missing_ok=True)


class MenuLayoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('build_menu_layout', ROOT / 'tools/build_menu_layout.py')
        cls.builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.builder)
        cls.defaults = json.loads((ROOT / 'content/ui/menu-layout.json').read_text(encoding='utf-8'))

    def test_shared_validation_cases(self):
        fixtures = json.loads((ROOT / 'tests/fixtures/menu-layout-validation.json').read_text(encoding='utf-8'))
        for case in fixtures['cases']:
            with self.subTest(case=case['name']):
                candidate = copy.deepcopy(self.defaults)
                for path, value in {**case.get('set', {}), **{key: float(value) for key, value in case.get('nonFinite', {}).items()}}.items():
                    parts = path.split('.')
                    target = candidate
                    for part in parts[:-1]:
                        target = target[part]
                    target[parts[-1]] = value
                for path in case.get('remove', []):
                    parts = path.split('.')
                    target = candidate
                    for part in parts[:-1]:
                        target = target[part]
                    del target[parts[-1]]
                if case['valid']:
                    result = self.builder.validate_layout(candidate)
                    self.assertEqual(result, candidate)
                    self.assertIsNot(result['regions'], candidate['regions'])
                    result['regions']['resources']['x'] = 100
                    self.assertNotEqual(result, candidate)
                else:
                    with self.assertRaises(ValueError) as error:
                        self.builder.validate_layout(candidate)
                    self.assertIn(case['errorPath'], str(error.exception))

    def test_rejects_non_object_roots(self):
        for candidate in [None, [], True, 1, 'layout']:
            with self.subTest(candidate=candidate), self.assertRaises(ValueError):
                self.builder.validate_layout(candidate)

    def test_enormous_json_integer_is_a_validation_error(self):
        candidate = copy.deepcopy(self.defaults)
        candidate['regions']['resources']['width'] = 10 ** 500
        with self.assertRaisesRegex(ValueError, 'regions.resources.width'):
            self.builder.validate_layout(candidate)

    def test_compilation_is_deterministic_and_stale_check_detects_drift(self):
        with output_paths() as targets:
            outputs = self.builder.generated_outputs(self.defaults)
            paths = dict(zip(targets, outputs.values()))
            self.builder.write_outputs(paths)
            self.assertEqual(self.builder.stale_outputs(paths), [])
            self.assertEqual(self.builder.generated_outputs(self.defaults), outputs)
            next(iter(paths)).write_text('stale', encoding='utf-8')
            self.assertEqual(len(self.builder.stale_outputs(paths)), 1)

    def test_failed_staging_preserves_both_existing_outputs(self):
        with output_paths() as (first, second):
            first.write_bytes(b'old data')
            second.write_bytes(b'old regions')
            with patch.object(self.builder, '_stage_output', side_effect=[first.with_suffix('.unused'), OSError('disk full')]):
                with self.assertRaises(OSError):
                    self.builder.write_outputs({first: b'new data', second: b'new regions'})
            self.assertEqual(first.read_bytes(), b'old data')
            self.assertEqual(second.read_bytes(), b'old regions')


if __name__ == '__main__':
    unittest.main()
