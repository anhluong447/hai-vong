"""Shared tile catalog/layer behavior, including sparse identities and empty cells."""
import copy
import json
from pathlib import Path
import unittest
from tools.world_tilesets import normalize_tileset, normalize_tile_layers, tile_source_rect

ROOT = Path(__file__).resolve().parents[1]


class TileFoundationTest(unittest.TestCase):
    def setUp(self):
        self.fixture = json.loads((ROOT/'tests/fixtures/tile-foundation-cases.json').read_text())

    def test_sparse_membership_crop_and_no_mutation(self):
        source = self.fixture['catalog']; before = copy.deepcopy(source)
        catalog = normalize_tileset(source)
        self.assertEqual(tile_source_rect(27, catalog), {'atlasId':'a'*64,'x':16,'y':0,'width':16,'height':16})
        self.assertEqual(source, before)
        for value in (16, -1, True, '0', None):
            with self.assertRaises(ValueError): tile_source_rect(value, catalog)

    def test_invalid_catalog(self):
        for mutate in (
            lambda c: c['tiles'][1].update(id=0),
            lambda c: c['tiles'][0].update(atlasIndex=2),
            lambda c: c['tiles'][0].update(blockedEdges=['left','left']),
            lambda c: c.update(nextTileId=27),
            lambda c: c['atlases'][0].update(imagePath='../escape.png'),
        ):
            source=copy.deepcopy(self.fixture['catalog']); mutate(source)
            with self.assertRaises(ValueError): normalize_tileset(source)

    def test_layers_preserve_zero_and_reject_ambiguous_or_empty_base(self):
        scene=self.fixture['scene']; before=copy.deepcopy(scene)
        layers=normalize_tile_layers(scene)
        self.assertEqual(len(layers),4); self.assertEqual(layers[0]['tiles'][0][0],0)
        self.assertIsNone(layers[1]['tiles'][0][0]); layers[0]['tiles'][0][0]=27
        self.assertEqual(scene,before)
        v2=dict(scene,schemaVersion=2,layers=normalize_tile_layers(scene)); del v2['tiles']
        self.assertEqual(normalize_tile_layers(v2),v2['layers'])
        for bad in (dict(v2,tiles=scene['tiles']),dict(scene,tiles=[[0]])):
            with self.assertRaises(ValueError): normalize_tile_layers(bad)
        v2['layers'][0]['tiles'][0][0]=None
        with self.assertRaises(ValueError): normalize_tile_layers(v2)


if __name__ == '__main__': unittest.main()
