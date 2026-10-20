"""World source contract, transactional builder and original-map preservation."""
import copy
import importlib.util
import json
import tempfile
import shutil
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class WorldScenesTest(unittest.TestCase):
    def test_tileset_registry_preserves_atlas_and_collision(self):
        registry = self.builder.tile_definitions(ROOT)
        self.assertEqual(registry['tilePixels'], 16)
        self.assertEqual(registry['columns'], 8)
        self.assertEqual([t['id'] for t in registry['tiles']], list(range(16)))
        self.assertEqual([t['atlasIndex'] for t in registry['tiles']], list(range(16)))
        self.assertEqual([t['id'] for t in registry['tiles'] if t['blocked']], [5,6,7,8,12,13,15])

    def test_tileset_invalid_records_rejected_from_fixture_root(self):
        registry = self.builder.tile_definitions(ROOT)
        (ROOT/'tmp').mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=ROOT/'tmp') as temporary:
            fixture = Path(temporary)
            for relative in ['assets/pixel/atlas.json', 'content/locales/vi.js']:
                (fixture/relative).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT/relative, fixture/relative)
            target = fixture/'content/world/tileset.json'
            target.parent.mkdir(parents=True)
            for change in [
                lambda r:r['tiles'].pop(),
                lambda r:r['tiles'][1].update(id=0),
                lambda r:r['tiles'][0].update(id=True),
                lambda r:r['tiles'][0].update(atlasIndex=16),
                lambda r:r['tiles'][0].update(blocked=1),
                lambda r:r['tiles'][0].update(labelKey='missing.key'),
                lambda r:r.update(columns=4),
            ]:
                candidate = copy.deepcopy(registry)
                change(candidate)
                target.write_text(json.dumps(candidate), encoding='utf-8')
                with self.assertRaises(ValueError): self.builder.tile_definitions(fixture)

    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('build_world_scenes', ROOT / 'tools/build_world_scenes.py')
        cls.builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.builder)

    def scene(self, scene_id='home'):
        return json.loads((ROOT / f'content/maps/scenes/{scene_id}.json').read_text(encoding='utf-8'))

    def test_default_sources_and_all_hidden_npcs_are_preserved(self):
        for scene_id in ('yard', 'newsroom', 'street', 'home', 'interaction'):
            scene = self.builder.validate_scene(self.scene(scene_id), f'scene/{scene_id}')
            self.assertEqual(scene['id'], scene_id)
        self.assertEqual(len(self.scene('newsroom')['npcs']), 5)
        self.assertEqual(len(self.scene('street')['npcs']), 6)

    def test_invalid_candidate_does_not_mutate_source(self):
        scene = self.scene()
        before = copy.deepcopy(scene)
        for update in ({'schemaVersion': 9}, {'width': -1}, {'spawn': {'x': 999, 'y': 0}}, {'surprise': 1}):
            bad = dict(scene, **update)
            with self.assertRaises(ValueError):
                self.builder.validate_scene(bad)
        self.assertEqual(scene, before)

    def test_duplicate_unknown_ref_and_bad_footprint_rejected(self):
        for mutation in ('duplicate', 'asset', 'portal', 'footprint', 'override', 'text', 'schedule', 'portrait'):
            bad = self.scene('street')
            if mutation == 'duplicate': bad['objects'].append(copy.deepcopy(bad['objects'][0]))
            if mutation == 'asset': bad['objects'][0]['overrides']['asset'] = 'missing'
            if mutation == 'portal': bad['portals'][0]['to'] = 'missing'
            if mutation == 'footprint': bad['objects'][0]['overrides']['footprint'] = [[0, 0.5]]
            if mutation == 'override': bad['objects'][0]['overrides']['script'] = 'bad'
            if mutation == 'text': bad['titleKey'] = 'missing.key'
            if mutation == 'schedule': bad['npcs'][1]['overrides']['schedule'] = 'missing'
            if mutation == 'portrait': bad['npcs'][0]['overrides']['portraitId'] = 'missing'
            with self.assertRaises(ValueError, msg=mutation): self.builder.validate_scene(bad)

    def test_resource_identity_and_generated_drift(self):
        with self.assertRaises(ValueError): self.builder.validate_scene(self.scene(), 'scene/street')
        self.assertEqual(self.builder.build(check=True), 0)

    def test_blocked_spawn_and_portal_destination_rejected(self):
        scene = self.scene()
        scene['objects'][0]['x'] = scene['spawn']['x']
        scene['objects'][0]['y'] = scene['spawn']['y']
        with self.assertRaisesRegex(ValueError, 'spawn.blocked'): self.builder.validate_scene(scene)
        scene = self.scene()
        scene['portals'][0]['spawn'] = {'x': 0, 'y': 0}
        with self.assertRaisesRegex(ValueError, 'portal.spawn.blocked'): self.builder.validate_scene(scene)
        scene = self.scene()
        scene['objects'][0]['x'] = scene['portals'][0]['x']
        scene['objects'][0]['y'] = scene['portals'][0]['y']
        with self.assertRaisesRegex(ValueError, 'portal.blocked'): self.builder.validate_scene(scene)

    def test_shared_validation_fixtures(self):
        fixtures = json.loads((ROOT / 'tests/fixtures/world-scene-validation.json').read_text(encoding='utf-8'))
        for fixture in fixtures:
            scene = self.scene()
            for patch in fixture['patches']:
                owner = scene
                for key in patch['path'][:-1]: owner = owner[key]
                owner[patch['path'][-1]] = patch['value']
            if fixture['valid']: self.builder.validate_scene(scene)
            else:
                with self.assertRaises(ValueError, msg=fixture['id']): self.builder.validate_scene(scene)

    def test_candidate_cannot_block_other_map_arrivals(self):
        scene = self.scene('yard')
        scene['objects'][0]['x'] = 10
        scene['objects'][0]['y'] = 12
        with self.assertRaisesRegex(ValueError, 'portalArrival.blocked'): self.builder.validate_scene(scene)


if __name__ == '__main__': unittest.main()
