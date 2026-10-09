"""Validate Stage 0 sources and deterministically build reference layout artifacts.

Only stdlib; never writes the reference PNGs or runtime content. Run --build after
editing layouts/fixtures, then --check in review/CI to detect stale outputs.
"""
import argparse
import hashlib
from html import escape
import json
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / 'docs/ui-specs/coastal-replica'
REFERENCE = ROOT / 'docs/ui-concepts/coastal-editorial-v1'
COLORS = {'reconstruct': '#ffcf54', 'vector-mask': '#00e4cf',
          'new-pose': '#ff75c1', 'text': '#87bcff'}
TASKS = {
    'dialogue': {'reconstruct': 'R09/R11', 'vector-mask': 'R06/R12/R13', 'new-pose': 'R10'},
    'menu': {'reconstruct': 'R24', 'vector-mask': 'R25/R26', 'new-pose': 'R24'},
    'hud': {'reconstruct': 'R32', 'vector-mask': 'R34', 'new-pose': 'R32/R33'},
    'dossier': {'reconstruct': 'R28/R29', 'vector-mask': 'R28/R29', 'new-pose': 'R28'},
}


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def point_inside(point, width, height):
    return len(point) == 2 and all(isinstance(n, (int, float)) for n in point) and 0 <= point[0] <= width and 0 <= point[1] <= height


def validate(layout, fixture, manifest, lock):
    stage = layout['stage']
    width, height = stage['width'], stage['height']
    require((width, height) == (1672, 941), 'Native design size changed')
    require(fixture['stage'] == stage, 'Fixture stage differs')
    require(fixture['capture']['deviceScaleFactor'] == 1, 'Capture must use DPR 1')
    require(stage['scalePolicy'] == 'uniform-fit-letterbox', 'Stage must scale uniformly')
    originals = {item['path']: item for item in manifest['files']}
    require(len(originals) == 4, 'Four reference screens required')
    for name, item in originals.items():
        path = REFERENCE / name
        data = path.read_bytes()
        require(data[:8] == b'\x89PNG\r\n\x1a\n', f'Invalid PNG: {name}')
        require(struct.unpack('>II', data[16:24]) == (width, height), f'Invalid size: {name}')
        require(sha(path) == item['sha256'], f'Reference hash changed: {name}')
    for name, digest in lock['files'].items():
        path = REFERENCE / name
        actual = (hashlib.sha256(path.read_text(encoding='utf-8').encode('utf-8')).hexdigest().upper()
                  if name.endswith('.json') else sha(path))
        require(actual == digest, f'Locked reference input changed: {name}')
    require(set(s['id'] for s in layout['screens']) == set(fixture['screens']), 'Screen sets differ')
    require(len(layout['screens']) == 4, 'Four layout screens required')
    used_keys = []
    for screen in layout['screens']:
        sid = screen['id']
        require(screen['reference'] in originals, f'Unknown reference: {sid}')
        ids = [layer['id'] for layer in screen['layers']]
        require(len(ids) == len(set(ids)), f'Duplicate layer: {sid}')
        groups = fixture['screens'][sid]['groups']
        used_groups = []
        for layer in screen['layers']:
            label = f"{sid}.{layer['id']}"
            x, y, w, h = layer['bounds']
            require(all(isinstance(n, int) for n in layer['bounds']), f'Invalid native pixel bounds: {label}')
            require(x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= width and y + h <= height, f'Out of stage: {label}')
            require(isinstance(layer['z'], int) and layer['method'] in COLORS, f'Invalid z/method: {label}')
            require(isinstance(layer['note'], str), f'Invalid note: {label}')
            if layer['method'] == 'text':
                group_id = layer['textGroup']
                require(group_id in groups and groups[group_id]['region'] == layer['id'], f'Text region mismatch: {label}')
                used_groups.append(group_id)
                group = groups[group_id]
                require(group['plannedTextKeys'] == [entry['key'] for entry in group['entries']], f'Text entries mismatch: {label}')
                for entry in group['entries']:
                    require(entry['key'] in fixture['catalog'], f'Missing planned key: {entry["key"]}')
                    require(entry['fontSizeEstimatePx'] > 0, f'Invalid type estimate: {label}')
                    used_keys.append(entry['key'])
            else:
                require('assetId' in layer, f'Missing asset ID: {label}')
            if 'identityReference' in layer:
                require((ROOT / layer['identityReference']).is_file(), f'Missing identity reference: {label}')
            if 'pivot' in layer:
                require(point_inside(layer['pivot'], width, height), f'Invalid pivot: {label}')
        require(set(used_groups) == set(groups), f'Unmapped text groups: {sid}')
        for contour in screen['contours']:
            require(contour['layer'] in ids, f'Unknown contour layer: {sid}')
            require(len(contour['points']) >= 2 and all(point_inside(p, width, height) for p in contour['points']), f'Invalid contour: {sid}')
        for anchor in screen['anchors']:
            points = anchor.get('points', [anchor.get('point')])
            require(all(p is not None and point_inside(p, width, height) for p in points), f'Invalid anchor: {sid}')
        require(all(region in ids for region in screen['lighting'].get('protected', [])), f'Unknown light protection: {sid}')
        world = fixture['screens'][sid]['world']
        if world:
            by_id = {layer['id']: layer for layer in screen['layers']}
            for actor in world['actors']:
                require(actor['id'] in by_id and actor['visibleBounds'] == by_id[actor['id']]['bounds'], f'Actor envelope mismatch: {actor["id"]}')
                anchor = actor['feet'] if actor['feet'] is not None else actor['visibleAnchor']
                require(anchor == by_id[actor['id']]['pivot'], f'Actor anchor mismatch: {actor["id"]}')
    require(len(used_keys) == len(set(used_keys)), 'Duplicate planned text key')
    require(set(used_keys) == set(fixture['catalog']), 'Unused planned text key')


def inventory(layout):
    assets = {}
    for screen in layout['screens']:
        sid = screen['id']
        for layer in screen['layers']:
            if layer['method'] == 'text':
                continue
            item = assets.setdefault(layer['assetId'], {
                'id': layer['assetId'], 'status': 'planned-not-produced',
                'owner': 'art-production', 'sourceKind': 'flattened-original-concept',
                'rights': 'project concept; external masters/fonts require provenance in R05/R07',
                'productionMethod': layer['method'], 'instances': [],
                'master': None, 'export': None, 'alpha': 'required except opaque scene plates; define in R05',
                'textPolicy': 'no baked lettering; rebuild text planes from planned keys',
            })
            x, y, w, h = layer['bounds']
            item['instances'].append({
                'screen': sid, 'region': layer['id'],
                'source': f"docs/ui-concepts/coastal-editorial-v1/{screen['reference']}",
                'sourceCropEnvelope': [x, y, w, h], 'nativeVisibleSize': [w, h],
                'z': layer['z'], 'pivotStage': layer.get('pivot'),
                'pivotRole': layer.get('pivotRole', 'placement seed; define production/motion pivot after master exists'),
                'identityReference': layer.get('identityReference'),
                'restorationRisk': layer.get('restoration', 'inspect occlusion/edges in R05; bounds are not alpha'),
                'productionTask': TASKS[sid][layer['method']],
                'note': layer['note'],
            })
    for item in assets.values():
        item['variants'] = 'per-instance silhouette/material review; shared ID does not imply identical crop'
        item['motionBleed'] = 'unmeasured; expand hidden edges after motion sheet R18/R27/R30/R35'
    return {'version': 1, 'stage': layout['stage'], 'assetCount': len(assets),
            'nonTextRegionCount': sum(len(a['instances']) for a in assets.values()),
            'measurement': layout['measurement'], 'assets': list(assets.values())}


def svg(screen):
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" width="836" height="470.5">',
             f'<title>{escape(screen["title"])} — Stage 0 measured envelopes</title>',
             '<desc>Numbered regions are approximate envelopes, not production alpha masks. See accompanying layer table.</desc>',
             f'<image href="../../../ui-concepts/coastal-editorial-v1/{screen["reference"]}" width="1672" height="941"/>']
    for index, layer in enumerate(screen['layers'], 1):
        x, y, w, h = layer['bounds']
        color = COLORS[layer['method']]
        title = escape(f"{index}: {layer['id']} · z={layer['z']} · {layer['label']}")
        parts.append(f'<g><title>{title}</title><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{color}" stroke-width="2"/>'
                     f'<rect x="{x}" y="{y}" width="33" height="24" fill="#142f38"/>'
                     f'<text x="{x + 3}" y="{y + 18}" fill="{color}" font-family="monospace" font-size="17">{index}</text></g>')
    for contour in screen['contours']:
        points = ' '.join(f'{x},{y}' for x, y in contour['points'])
        parts.append(f'<polyline points="{points}" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="8 5"><title>{escape(contour["id"])}</title></polyline>')
    for anchor in screen['anchors']:
        for x, y in anchor.get('points', [anchor.get('point')]):
            parts.append(f'<path d="M{x - 8},{y}h16 M{x},{y - 8}v16" stroke="#ff4444" stroke-width="3"><title>{escape(anchor["id"])}</title></path>')
    parts.append('</svg>')
    return '\n'.join(parts) + '\n'


def cell(value):
    return str(value).replace('|', '\\|').replace('\n', '<br>')


def sheet(screen, fixture):
    sid = screen['id']
    lines = [f'# {screen["title"]} — layout sheet', '',
             '> Generated by tools/coastal_reference_specs.py; edit layouts.json / fixtures.json.', '',
             f'![Numbered measured regions]({sid}.svg)', '',
             '1672 × 941; x/y from top-left; bounding envelopes ±4 px for rectangular regions, ±12 px for organic silhouettes. These are placement seeds; final masks and type matching remain production work.', '',
             'Yellow: reconstruct · cyan: vector/mask · pink: new pose · blue: text · red cross: anchor · white dashed: sampled contour.', '',
             '| # | ID / role | x, y, w, h | z | Method | Asset / planned text group | Occlusion / production note |',
             '| --- | --- | --- | --- | --- | --- | --- |']
    for index, layer in enumerate(screen['layers'], 1):
        values = [index, f"{layer['id']} / {layer['label']}", ', '.join(map(str, layer['bounds'])),
                  layer['z'], layer['method'], layer.get('assetId', layer.get('textGroup')), layer['note']]
        lines.append('| ' + ' | '.join(cell(v) for v in values) + ' |')
    lines += ['', '## Anchors and contours', '', '```json', dump({'anchors': screen['anchors'], 'contours': screen['contours']}).rstrip(), '```', '', '## Lighting / protected reading zones', '', '```json', dump(screen['lighting']).rstrip(), '```', '', '## Typography and fixture text', '', 'Font sizes are estimates. Typeface, weight, exact baseline, kerning and rotation require R07 native-scale review. Planned keys belong to this authoring fixture until adopted by the live catalog.', '', '| Group | Planned key | Text | Role / estimated px | Transcription status |', '| --- | --- | --- | --- | --- |']
    for group_id, group in fixture['screens'][sid]['groups'].items():
        for entry in group['entries']:
            values = [group_id, entry['key'], fixture['catalog'][entry['key']],
                      f"{entry['role']} / {entry['fontSizeEstimatePx']}", group['status']]
            lines.append('| ' + ' | '.join(cell(v) for v in values) + ' |')
    lines += ['', *screen['notes'], '']
    return '\n'.join(lines)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--build', action='store_true')
    group.add_argument('--check', action='store_true')
    args = parser.parse_args()
    layout, fixture = read(SPEC / 'layouts.json'), read(SPEC / 'fixtures.json')
    validate(layout, fixture, read(REFERENCE / 'references.json'), read(SPEC / 'reference-lock.json'))
    assets = inventory(layout)
    outputs = {SPEC / 'asset-inventory.json': dump(assets)}
    for screen in layout['screens']:
        outputs[SPEC / 'layouts' / f"{screen['id']}.svg"] = svg(screen)
        outputs[SPEC / 'layouts' / f"{screen['id']}.md"] = sheet(screen, fixture)
    for path, content in outputs.items():
        if args.build:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding='utf-8', newline='\n')
        else:
            require(path.is_file() and path.read_text(encoding='utf-8') == content, f'Stale artifact: {path.relative_to(ROOT)}; run --build')
    print(f"Stage 0 {'built' if args.build else 'checked'}: 4 locked PNGs, {sum(len(s['layers']) for s in layout['screens'])} regions, {assets['assetCount']} planned assets, {len(fixture['catalog'])} planned text keys. No production masks/art certified.")


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError) as error:
        print(f'Stage 0 validation failed: {error}', file=sys.stderr)
        raise SystemExit(1)
