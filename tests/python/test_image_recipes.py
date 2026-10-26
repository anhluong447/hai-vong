"""Technical rendition recipes preserve master bytes and alpha through atlases."""
import copy
from pathlib import Path
import tempfile
import unittest
from project_environment import ROOT
from PIL import Image
import build_assets


class ImageRecipeTests(unittest.TestCase):
    def fixture(self, root):
        folder = root / 'assets/sources'
        folder.mkdir(parents=True)
        image = Image.new('RGBA', (512, 512))
        image.paste((210, 40, 30, 128), (128, 64, 256, 320))
        image.save(folder / 'sheet.png')
        return {'schemaVersion': 1, 'maxImageDimension': 4096,
                'exportRoot': 'assets/exports', 'licenses': {'test': {}},
                'entries': [{'id': 'image.frame', 'kind': 'image', 'required': True,
                             'source': 'assets/sources/sheet.png', 'license': 'test',
                             'crop': {'x': 128, 'y': 64, 'width': 128, 'height': 256},
                             'resize': {'width': 48, 'height': 96, 'sampling': 'pixel'},
                             'canvas': {'width': 80, 'height': 112, 'x': 16, 'y': 8}}],
                'atlases': [{'id': 'atlas.frames', 'members': ['image.frame'],
                             'padding': 2, 'maxSize': 1024}]}

    def test_native_frame_and_atlas_keep_alpha_padding_and_master_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); spec = self.fixture(root)
            master = (root / spec['entries'][0]['source']).read_bytes()
            result = build_assets.build(root, spec)
            self.assertTrue(result['ok'], result)
            entries = {entry['id']: entry for entry in result['value']['manifest']}
            frame = entries['image.frame']
            self.assertEqual((frame['width'], frame['height']), (80, 112))
            with Image.open(root / frame['path'].lstrip('/')) as image:
                self.assertEqual(image.getpixel((0, 0))[3], 0)
                self.assertEqual(image.getpixel((16, 8)), (210, 40, 30, 128))
                self.assertEqual(image.getpixel((63, 103)), (210, 40, 30, 128))
                self.assertEqual(image.getpixel((64, 104))[3], 0)
            atlas = entries['atlas.frames']
            self.assertEqual(atlas['frames'][0]['width'], 80)
            self.assertEqual(atlas['frames'][0]['height'], 112)
            with Image.open(root / atlas['path'].lstrip('/')) as image:
                self.assertEqual(image.getpixel((18, 10)), (210, 40, 30, 128))
                self.assertEqual(image.getpixel((0, 0))[3], 0)
            self.assertEqual((root / spec['entries'][0]['source']).read_bytes(), master)

    def test_invalid_crop_resize_and_canvas_fail_without_silent_clamping(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); base = self.fixture(root)
            changes = [
                ('crop', {'x': -1, 'y': 0, 'width': 12, 'height': 12}),
                ('crop', {'x': 500, 'y': 0, 'width': 20, 'height': 12}),
                ('crop', {'x': 0.5, 'y': 0, 'width': 12, 'height': 12}),
                ('resize', {'width': 0, 'height': 12, 'sampling': 'pixel'}),
                ('resize', {'width': 8192, 'height': 12, 'sampling': 'pixel'}),
                ('resize', {'width': 48, 'height': 96, 'sampling': 'unknown'}),
                ('canvas', {'width': 80, 'height': 112, 'x': 79, 'y': 8}),
                ('canvas', {'width': 80, 'height': 112, 'x': 16, 'y': -1}),
            ]
            for field, value in changes:
                spec = copy.deepcopy(base); spec['entries'][0][field] = value
                with self.subTest(field=field, value=value):
                    result = build_assets.build(root, spec)
                    self.assertFalse(result['ok'])
                    self.assertEqual(result['errors'][0]['sourceId'], 'assets/sources/sheet.png')

    def test_recipe_change_rebuilds_frame_and_its_atlas_deterministically(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); spec = self.fixture(root)
            first = build_assets.build(root, spec)
            self.assertTrue(first['ok'], first)
            self.assertEqual(build_assets.build(root, spec)['value']['rebuilt'], [])
            spec['entries'][0]['canvas']['x'] = 12
            second = build_assets.build(root, spec)
            self.assertTrue(second['ok'], second)
            self.assertEqual(set(second['value']['rebuilt']), {'image.frame', 'atlas.frames'})
            old = {entry['id']: entry['hash'] for entry in first['value']['manifest']}
            new = {entry['id']: entry['hash'] for entry in second['value']['manifest']}
            self.assertNotEqual(old, new)
            (root / '.cache/assets/build-state.json').unlink()
            again = build_assets.build(root, spec)
            self.assertEqual(second['value']['manifest'], again['value']['manifest'])
