"""Validate authored world JSON and atomically compile synchronous ES modules."""
import argparse
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import tempfile
try:
    from .world_tilesets import normalize_tileset, normalize_tile_layers
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from tools.world_tilesets import normalize_tileset, normalize_tile_layers

ROOT = Path(__file__).resolve().parents[1]
MAP_DIR = ROOT / 'content/maps'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def catalog(root=ROOT):
    raw = (Path(root) / 'content/locales/vi.js').read_text(encoding='utf-8')
    return json.loads(raw.split('export default ', 1)[1].rstrip().removesuffix(';'))


def tile_definitions(root=ROOT, override=None):
    root = Path(root)
    registry = override if override is not None else read(root / 'content/world/tileset.json')
    atlas = read(root / 'assets/pixel/atlas.json')
    normalized = normalize_tileset(registry, atlas, catalog(root))
    if registry.get('schemaVersion') == 2:
        return normalized
    if (registry.get('schemaVersion') != 1 or registry.get('assetId') != 'pixel.tiles'
            or type(registry.get('tilePixels')) is not int or registry['tilePixels'] != 16
            or type(registry.get('columns')) is not int or registry['columns'] != atlas['tiles']['columns']
            or type(registry.get('count')) is not int or registry['count'] != 16
            or registry['count'] != atlas['tiles']['count'] or registry['tilePixels'] != atlas['tileSize']):
        raise ValueError('world.tileset.atlas')
    tiles = registry.get('tiles')
    if not isinstance(tiles, list) or len(tiles) != registry['count']:
        raise ValueError('world.tileset.tiles')
    texts = catalog(root)
    for index, tile in enumerate(tiles):
        if (not isinstance(tile, dict) or set(tile) != {'id', 'atlasIndex', 'labelKey', 'blocked'}
                or type(tile['id']) is not int or tile['id'] != index
                or type(tile['atlasIndex']) is not int or tile['atlasIndex'] != index
                or type(tile['blocked']) is not bool
                or tile['labelKey'] not in texts or not tile['labelKey'].startswith('authoring.tiles.')):
            raise ValueError('world.tileset.tile')
    return registry


def blocked_cells(scene, prefabs, tileset):
    normalized=normalize_tileset(tileset)
    blocked={tile['id'] for tile in normalized['tiles'] if tile['collision']=='solid'}
    cells={(x,y) for layer in normalize_tile_layers(scene) for y,row in enumerate(layer['tiles']) for x,tile in enumerate(row) if tile in blocked}
    for instance in scene['objects'] + scene['npcs']:
        entity = dict(prefabs[instance['prefab']], **instance['overrides'])
        if entity['solid']:
            cells.update((instance['x'] + dx, instance['y'] + dy) for dx, dy in entity.get('footprint', [[0, 0]]))
    return sorted([list(cell) for cell in cells], key=lambda p: (p[1], p[0]))


def validate_scene(payload, resource_id=None, *, root=ROOT, tileset_override=None, scenes_override=None):
    map_dir = Path(root) / 'content/maps'
    contract = read(map_dir / 'scene-contract.json')
    prefabs = read(map_dir / 'prefabs.json')['prefabs']
    texts = catalog(root)
    tileset = tile_definitions(root, tileset_override)
    def require(value, path):
        if not value: raise ValueError(f'world.scene.{path}')
    def integer(value): return type(value) is int
    def point(value, path, width=None, height=None):
        require(isinstance(value, dict) and set(value) == {'x', 'y'}, path)
        require(all(integer(value[k]) for k in ('x', 'y')), path)
        if width is not None: require(0 <= value['x'] < width and 0 <= value['y'] < height, path)
    require(isinstance(payload, dict), 'object')
    scene = copy.deepcopy(payload)
    require(not set(scene).difference(contract['sceneFields']), 'fields')
    require(type(scene.get('schemaVersion')) is int and scene['schemaVersion'] in (1,2), 'schemaVersion')
    require(scene.get('id') in contract['sceneIds'], 'id')
    require(resource_id is None or resource_id == f"scene/{scene['id']}", 'resourceId')
    require(isinstance(scene.get('titleKey'), str) and scene['titleKey'] in texts, 'titleKey')
    w, h = scene.get('width'), scene.get('height')
    require(integer(w) and integer(h) and 3 <= w <= 256 and 3 <= h <= 256, 'size')
    layers=normalize_tile_layers(scene)
    tile_ids={tile['id'] for tile in tileset['tiles']}
    require(all(t is None or (type(t) is int and t in tile_ids) for layer in layers for row in layer['tiles'] for t in row),'tiles')
    point(scene.get('spawn'), 'spawn', w, h)
    ids = set()
    for category in ('objects', 'npcs'):
        require(isinstance(scene.get(category), list), category)
        for i, instance in enumerate(scene[category]):
            p = f'{category}.{i}'
            require(isinstance(instance, dict) and set(instance) == set(contract['instanceFields']), p)
            require(isinstance(instance.get('id'), str) and instance['id'] and instance['id'] not in ids, p + '.id')
            ids.add(instance['id'])
            require(instance.get('prefab') == ('prop' if category == 'objects' else 'npc'), p + '.prefab')
            point({'x': instance['x'], 'y': instance['y']}, p + '.position', w, h)
            overrides = instance.get('overrides')
            require(isinstance(overrides, dict) and not set(overrides).difference(contract['overrideFields']), p + '.overrides')
            o = dict(prefabs[instance['prefab']], **overrides)
            require(isinstance(o.get('solid'), bool), p + '.solid')
            for key, refs in (('asset', 'assets'), ('sprite', 'sprites'), ('schedule', 'schedules'), ('person', 'people'), ('step', 'steps'), ('caseKey', 'caseKeys'), ('scene', 'dialogueScenes')):
                if key in o: require(o[key] in contract[refs], p + '.' + key)
            require(o.get('kind') is None or o['kind'] in contract['kinds'], p + '.kind')
            require(('asset' in o) if category == 'objects' else ('sprite' in o), p + '.visual')
            if category == 'npcs': require(o.get('portraitId') in contract['dialogueScenes'], p + '.portraitId')
            require('labelKey' in o or 'label' in o, p + '.label')
            for key in ('labelKey', 'lineKey'):
                if key in o: require(isinstance(o[key], str) and o[key] in texts, p + '.' + key)
            if 'label' in o: require(o.get('person') == o['label'], p + '.label')
            if 'footprint' in o:
                require(isinstance(o['footprint'], list) and bool(o['footprint']), p + '.footprint')
                require(all(isinstance(v, list) and len(v) == 2 and all(integer(n) for n in v) and 0 <= instance['x']+v[0] < w and 0 <= instance['y']+v[1] < h for v in o['footprint']), p + '.footprint')
            for key in ('offsetPx', 'pivotPx'):
                if key in o:
                    require(isinstance(o[key], dict) and set(o[key]) == {'x', 'y'} and all(type(n) in (int, float) and math.isfinite(n) and abs(n) <= 256 for n in o[key].values()), p + '.' + key)
            if 'pickHeightTiles' in o: require(integer(o['pickHeightTiles']) and 1 <= o['pickHeightTiles'] <= 16, p + '.pickHeightTiles')
    require(isinstance(scene.get('portals'), list), 'portals')
    for p in scene['portals']:
        require(isinstance(p, dict) and set(p) == {'x', 'y', 'to', 'spawn', 'labelKey'}, 'portal.fields')
        point({'x': p['x'], 'y': p['y']}, 'portal.position', w, h)
        require(p['to'] in contract['sceneIds'] and isinstance(p['labelKey'], str) and p['labelKey'] in texts, 'portal.reference')
        target_path = map_dir / 'scenes' / (p['to'] + '.json')
        target = (scenes_override or {}).get(p['to']) or (read(target_path) if target_path.exists() else {'width':256,'height':256})
        point(p['spawn'], 'portal.spawn', target['width'], target['height'])
    if 'signs' in scene:
        require(isinstance(scene['signs'], list), 'signs')
        for sign in scene['signs']:
            require(isinstance(sign, list) and len(sign) == 3 and isinstance(sign[2], str) and sign[2] in texts, 'sign')
            point({'x': sign[0], 'y': sign[1]}, 'sign.position', w, h)
    require([scene['spawn']['x'], scene['spawn']['y']] not in blocked_cells(scene, prefabs, tileset), 'spawn.blocked')
    for portal in scene['portals']:
        require([portal['x'], portal['y']] not in blocked_cells(scene, prefabs, tileset), 'portal.blocked')
        target = scene if portal['to'] == scene['id'] else ((scenes_override or {}).get(portal['to']) or read(map_dir / 'scenes' / (portal['to'] + '.json')))
        require([portal['spawn']['x'], portal['spawn']['y']] not in blocked_cells(target, prefabs, tileset), 'portal.spawn.blocked')
    blocks = blocked_cells(scene, prefabs, tileset)
    for other_id in contract['sceneIds']:
        other = scene if other_id == scene['id'] else ((scenes_override or {}).get(other_id) or read(map_dir / 'scenes' / (other_id + '.json')))
        for portal in other['portals']:
            if portal['to'] == scene['id']: require([portal['spawn']['x'], portal['spawn']['y']] not in blocks, 'portalArrival.blocked')
    return scene


def render_outputs(root=ROOT, overrides=None, tileset_override=None):
    root = Path(root)
    map_dir = root / 'content/maps'
    overrides = overrides or {}
    contract = read(map_dir / 'scene-contract.json')
    candidates={sid:overrides[sid] if sid in overrides else read(map_dir/'scenes'/f'{sid}.json') for sid in contract['sceneIds']}
    scenes={sid:validate_scene(candidate,root=root,tileset_override=tileset_override,scenes_override=candidates) for sid,candidate in candidates.items()}
    prefabs = read(map_dir / 'prefabs.json')['prefabs']
    tileset = tile_definitions(root, tileset_override)
    blocks = {sid: blocked_cells(s, prefabs, tileset) for sid, s in scenes.items()}
    for scene in scenes.values():
        for portal in scene['portals']:
            if [portal['spawn']['x'], portal['spawn']['y']] in blocks[portal['to']]: raise ValueError('world.scene.portal.spawn.blocked')
    arrivals = {sid: [p['spawn'] for other in scenes.values() for p in other['portals'] if p['to'] == sid] for sid in scenes}
    refs = dict(contract, textKeys=list(catalog(root)), mapSizes={sid: {'width': s['width'], 'height': s['height']} for sid, s in scenes.items()}, mapBlockedCells=blocks, mapIncomingSpawns=arrivals)
    dumps = lambda value: json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    hashes = {sid: hashlib.sha256((json.dumps(overrides[sid], ensure_ascii=False, indent=2) + '\n').encode('utf-8') if sid in overrides else (map_dir / 'scenes' / f'{sid}.json').read_bytes()).hexdigest() for sid in scenes}
    normalized = normalize_tileset(tileset, read(root/'assets/pixel/atlas.json'), catalog(root))
    catalog_hash = hashlib.sha256((json.dumps(tileset_override,ensure_ascii=False,indent=2)+'\n').encode('utf-8') if tileset_override is not None else (root/'content/world/tileset.json').read_bytes()).hexdigest()
    output = '// Generated by tools/build_world_scenes.py; edit scene JSON sources.\n' + ''.join(f'export const {name}={dumps(value)};\n' for name, value in [('TILESET', normalized), ('TILESET_SOURCE_HASH', catalog_hash), ('SCENES', scenes), ('PREFABS', prefabs), ('KNOWN_REFS', refs), ('SCENE_SOURCE_HASHES', hashes)])
    return {'content/maps/scenes-data.js': output}


def build(check=False):
    outputs = render_outputs()
    output = outputs['content/maps/scenes-data.js']
    target = MAP_DIR / 'scenes-data.js'
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output: raise ValueError('world.scenes.generatedDrift')
    else:
        fd, temporary = tempfile.mkstemp(prefix='.world-', suffix='.tmp', dir=MAP_DIR)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as handle: handle.write(output)
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary): os.unlink(temporary)
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--build', action='store_true')
    args = parser.parse_args()
    try:
        build(check=args.check)
        print('World scenes: valid; generated output synchronized')
    except (ValueError, KeyError, TypeError) as error:
        parser.exit(1, str(error) + '\n')
