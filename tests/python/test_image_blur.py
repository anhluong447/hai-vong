import copy,hashlib,math,tempfile,unittest
from pathlib import Path
from project_environment import ROOT
from PIL import Image
import build_assets

class ImageBlurTests(unittest.TestCase):
    def fixture(self,root):
        path=root/'assets/sources/shape.png';path.parent.mkdir(parents=True)
        image=Image.new('RGBA',(64,64));image.paste((240,80,40,255),(20,20,44,44));image.save(path)
        return {'maxImageDimension':4096,'exportRoot':'assets/exports','licenses':{'test':{}},'entries':[{'id':'image.shape','kind':'image','source':'assets/sources/shape.png','required':True,'license':'test','blur':{'radius':2}}],'atlases':[]}
    def test_blur_keeps_dimensions_master_and_premultiplied_color_at_soft_alpha_edge(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root);source=root/spec['entries'][0]['source'];original=source.read_bytes()
            result=build_assets.build(root,spec);self.assertTrue(result['ok'],result)
            with Image.open(root/result['value']['manifest'][0]['path'].lstrip('/')) as image:
                self.assertEqual(image.size,(64,64));pixel=image.getpixel((19,32));self.assertGreater(pixel[3],0);self.assertLess(pixel[3],255);self.assertGreater(pixel[0],230);self.assertEqual(image.getpixel((0,0))[3],0)
            self.assertEqual(source.read_bytes(),original)
    def test_radius_changes_rendition_hash_and_repeat_build_is_cached(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root);first=build_assets.build(root,spec);spec['entries'][0]['blur']['radius']=4;second=build_assets.build(root,spec)
            self.assertTrue(first['ok'] and second['ok']);self.assertNotEqual(first['value']['manifest'][0]['hash'],second['value']['manifest'][0]['hash']);self.assertEqual(build_assets.build(root,spec)['value']['rebuilt'],[])
    def test_invalid_blur_is_rejected_with_source_not_ignored_or_clamped(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);spec=self.fixture(root)
            for bad in [{'radius':-1},{'radius':17},{'radius':float('nan')},{'radius':float('inf')},{'radius':True},{'radius':'2'},{'radius':2,'extra':1},None]:
                with self.subTest(recipe=bad):
                    changed=copy.deepcopy(spec);changed['entries'][0]['blur']=bad;result=build_assets.build(root,changed)
                    self.assertFalse(result['ok'],bad);self.assertEqual(result['errors'][0]['sourceId'],'assets/sources/shape.png')
