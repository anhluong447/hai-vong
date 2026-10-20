import copy
import json
from pathlib import Path
import unittest

from build_dialogue_ui import validate_dialogue_layout

ROOT = Path(__file__).resolve().parents[1]


class DialogueLayoutTests(unittest.TestCase):
    def test_legacy_groups_expand_and_partial_objects_are_rejected(self):
        source = json.loads((ROOT/'content/ui/coastal-dialogue-ui.json').read_text(encoding='utf-8'))['layout']
        legacy = {key: copy.deepcopy(source[key]) for key in ['dialogue-panel', 'dialogue-date', 'dialogue-choices']}
        legacy['dialogue-panel']['x'] = 27
        result = validate_dialogue_layout(legacy)
        self.assertEqual(result['dialogue-panel']['x'], 27)
        self.assertEqual(result['dialogue-flowers']['scaleX'], 1)
        self.assertEqual(len(result), 28)
        with self.assertRaises(ValueError): validate_dialogue_layout({**legacy, 'dialogue-date': None})
        del result['dialogue-line']
        with self.assertRaises(ValueError): validate_dialogue_layout(result)

    def test_shared_validation_cases(self):
        source = json.loads((ROOT/'content/ui/coastal-dialogue-ui.json').read_text(encoding='utf-8'))['layout']
        cases = json.loads((ROOT/'tests/fixtures/dialogue-layout-validation.json').read_text())
        for fixture in cases:
            with self.subTest(fixture['name']):
                candidate = copy.deepcopy(source)
                path = fixture['path']
                if not path: candidate = fixture['value']
                elif len(path) == 1: candidate[path[0]] = fixture['value']
                else: candidate[path[0]][path[1]] = fixture['value']
                if fixture['valid']: self.assertEqual(validate_dialogue_layout(candidate), candidate)
                else:
                    with self.assertRaises(ValueError): validate_dialogue_layout(candidate)
        for value in [float('inf'), float('-inf'), float('nan')]:
            candidate = copy.deepcopy(source)
            candidate['dialogue-panel']['x'] = value
            with self.assertRaises(ValueError): validate_dialogue_layout(candidate)
        validated = validate_dialogue_layout(source)
        validated['dialogue-panel']['x'] = 42
        self.assertEqual(source['dialogue-panel']['x'], 0)


if __name__ == '__main__': unittest.main()
