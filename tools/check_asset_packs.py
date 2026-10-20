"""Check the selected active manifests without relocating or preloading assets."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'content/assets/active-packs.json'
PICK = {'bed': 3, 'bookcase': 3, 'board': 2, 'desk': 1, 'printer': 2, 'clock': 3, 'shop': 2, 'bench': 1, 'camera': 2}


def inventory():
    index = json.loads(INDEX.read_text(encoding='utf-8'))
    records = []
    def add(asset_id, path, pack, **extra):
        source = ROOT / path
        if not source.is_file(): raise ValueError(f'asset.missingPath:{path}')
        record = {'id': asset_id, 'path': path, 'pack': pack['id'], 'provenance': pack['provenance'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), **extra}
        if 'framePx' in extra:
            with Image.open(source) as image: record['imagePx'] = {'width': image.width, 'height': image.height}
            if 'regionPx' in record and (record['regionPx']['x']+record['framePx']['width'] > record['imagePx']['width'] or record['regionPx']['y']+record['framePx']['height'] > record['imagePx']['height']): raise ValueError('asset.frameOutsideAtlas:' + asset_id)
            if record['pivotUnit'] != 'pixel': raise ValueError('asset.pivotUnit:' + asset_id)
        records.append(record)
    for pack in index['packs']:
        manifest_path = ROOT / pack['manifest']
        if not (ROOT / pack['provenance']).is_file(): raise ValueError('asset.provenance:' + pack['id'])
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        base = manifest_path.parent.relative_to(ROOT).as_posix()
        if pack['id'] == 'pixel':
            if manifest['tileSize'] != 16: raise ValueError('asset.tilePixels')
            add('pixel.tiles', base + '/' + manifest['tiles']['file'], pack)
            chars = manifest['characters']
            for i, sid in enumerate(chars['ids']):
                sprite = chars.get('overrides', {}).get(sid, chars)
                fw, fh = sprite['frameWidth'], sprite['frameHeight']
                region = {'x': 0, 'y': 0 if sid in chars.get('overrides', {}) else i*fh}
                add('pixel.character.' + sid, base + '/' + sprite['file'], pack, framePx={'width': fw, 'height': fh}, pivotPx=sprite.get('pivot', {'x': fw/2, 'y': fh-2}), pivotUnit='pixel', regionPx=region)
                with Image.open(ROOT / (base + '/' + sprite['file'])) as image:
                    columns, rows = (sprite['columns'], sprite['rows']) if sid in chars.get('overrides', {}) else (chars['frames']*len(chars['directions']), len(chars['ids']))
                    if fw*columns > image.width or fh*rows > image.height: raise ValueError('asset.frameOutsideAtlas:' + sid)
            objects = manifest['objects']
            for i, sid in enumerate(objects['ids']):
                add('pixel.prop.' + sid, base + '/' + objects['file'], pack, framePx={'width': 32, 'height': 48}, regionPx={'x': i%4*32, 'y': i//4*48}, pivotPx={'x': 16, 'y': 46}, pivotUnit='pixel', footprint=[[0, 0], [0, -1]] if sid in ('bed', 'bookcase') else [[0, 0]], pickHeightTiles=PICK.get(sid, 1))
        elif pack['id'] in ('menu', 'dossier'):
            for item in manifest['files']: add(pack['id'] + '.' + Path(item['file']).stem, base + '/' + item['file'], pack)
            add(pack['id'] + '.icons', base + ('/equipment.svg' if pack['id'] == 'menu' else '/editorial-icons.svg'), pack)
        elif pack['id'] in ('menu-materials', 'menu-motion'):
            for item in manifest['assets']:
                path = base + '/' + item['path']
                if hashlib.sha256((ROOT/path).read_bytes()).hexdigest().lower() != item['sha256'].lower(): raise ValueError('asset.materialHash:' + path)
                add(pack['id'] + '.' + Path(item['path']).stem, path, pack)
        elif pack['id'] == 'dialogue':
            for sid, character in manifest['characters'].items():
                for expression, path in character['expressions'].items(): add(f'dialogue.{sid}.{expression}', base + '/' + path, pack)
        elif pack['id'] == 'fonts':
            for i, font in enumerate(manifest['fonts']):
                for j, item in enumerate(font['files']):
                    if hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest().lower() != item['sha256'].lower(): raise ValueError('asset.fontHash:' + item['path'])
                    add(f'fonts.{i}.{j}', item['path'], pack, license=font['license'], restoreUrl=item['url'])
        elif pack['id'] == 'fonts-menu':
            for i, item in enumerate(manifest['files']):
                path = base + '/' + item['path']
                if hashlib.sha256((ROOT/path).read_bytes()).hexdigest().lower() != item['sha256'].lower(): raise ValueError('asset.fontHash:' + path)
                add(f'fonts-menu.{i}', path, pack, license='SIL Open Font License 1.1', restoreUrl=item['url'])
    if len({r['id'] for r in records}) != len(records): raise ValueError('asset.duplicateId')
    return {'schemaVersion': 1, 'packs': index['packs'], 'assets': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = inventory()
    index_text = '// Generated by tools/check_asset_packs.py --build; manifests remain authoritative.\nexport const activePacks=' + json.dumps(result['packs'], separators=(',', ':')) + ';\n'
    inventory_text = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    outputs = {'content/assets/active-packs.js': index_text, 'content/assets/active-inventory.json': inventory_text}
    for relative, text in outputs.items():
        path = ROOT / relative
        if args.build: path.write_text(text, encoding='utf-8', newline='\n')
        elif not path.exists() or path.read_text(encoding='utf-8') != text: parser.exit(1, 'asset.generatedDrift:' + relative + '\n')
    print(f"Asset packs: {len(result['packs'])} active packs; {len(result['assets'])} verified records; native frames/pivots retained")


if __name__ == '__main__': main()
