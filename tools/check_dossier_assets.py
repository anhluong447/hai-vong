"""Validate locally retained dossier artwork and its generation provenance."""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / 'assets/ui/dossier-polish'
EXPECTED = {
    'school-window.png': (1672, 941),
    'desk-cluster.png': (1536, 1024),
    'canteen-photo.png': (1086, 1448),
    'field-photo.png': (1086, 1448),
    'side-wave.png': (1024, 1536),
    'harbor-wave.png': (1672, 941),
}
TRANSPARENT = {'desk-cluster.png', 'side-wave.png', 'harbor-wave.png'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-inventory', action='store_true')
    args = parser.parse_args()
    entries = []
    for name in [*EXPECTED, 'editorial-icons.svg', 'logo-stamp-placeholder.svg']:
        path = FOLDER / name
        entry = dict(file=name, bytes=path.stat().st_size,
                     sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        if name in EXPECTED:
            with Image.open(path) as picture:
                assert picture.size == EXPECTED[name], (name, picture.size)
                entry.update(size=list(picture.size), mode=picture.mode)
                if name in TRANSPARENT:
                    assert picture.mode == 'RGBA', name
                    alpha = picture.getchannel('A').getextrema()
                    assert alpha[0] == 0 and alpha[1] >= 250, (name, alpha)
                    entry['alpha'] = list(alpha)
        else:
            root = ET.fromstring(path.read_bytes())
            assert root.tag.endswith('svg')
            assert not list(root.iter('{http://www.w3.org/2000/svg}text')), name
        entries.append(entry)
    inventory = FOLDER / 'inventory.json'
    if args.write_inventory:
        inventory.write_text(json.dumps(dict(version=1, files=entries), indent=2)+'\n', encoding='utf-8')
    assert json.loads(inventory.read_text(encoding='utf-8'))['files'] == entries, 'Artwork changed; inspect before recording a replacement'
    prompts = json.loads((FOLDER / 'prompts.json').read_text(encoding='utf-8'))
    assert {p['file'] for p in prompts['outputs']} == set(EXPECTED)
    assert all(p['prompt'] and isinstance(p['transparent_background'], bool) for p in prompts['outputs'])
    print('Dossier assets: 6 generated PNGs + 2 native SVGs; hashes, sizes, alpha and prompts verified')


if __name__ == '__main__':
    main()
