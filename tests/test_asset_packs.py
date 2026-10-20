import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AssetPacksTest(unittest.TestCase):
    def test_active_inventory_retains_native_pivots_and_pick_bounds(self):
        spec = importlib.util.spec_from_file_location('asset_packs', ROOT / 'tools/check_asset_packs.py')
        checker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(checker)
        inventory = checker.inventory()
        records = {record['id']: record for record in inventory['assets']}
        self.assertEqual(records['pixel.character.khue']['pivotPx'], {'x': 16, 'y': 46})
        self.assertEqual(records['pixel.character.van']['framePx'], {'width': 32, 'height': 48})
        self.assertEqual(records['pixel.prop.desk']['pickHeightTiles'], 1)
        self.assertEqual(records['pixel.prop.bookcase']['footprint'], [[0, 0], [0, -1]])
        self.assertTrue(all(record['sha256'] for record in records.values()))


if __name__ == '__main__': unittest.main()
