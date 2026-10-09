"""Build/version the Stage 1 art pack, retaining editable masters and provenance.

SVG exports are deterministic code-native graphics. Generated bitmap masters are
copied byte-for-byte, with original alpha; no resizing/editing of raster art.
Font validation reads TrueType cmap using stdlib; no font/tool dependency install.
"""
import argparse
import hashlib
import json
from pathlib import Path
import random
import struct
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'assets/ui/coastal-replica/v1'
DOC = ROOT / 'docs/ui-specs/coastal-replica'


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def sha(data):
    return hashlib.sha256(data).hexdigest().upper()


def glyphs(path):
    """Unicode codepoints with a nonzero glyph, cmap formats 4 and 12."""
    data = path.read_bytes()
    count = struct.unpack_from('>H',data,4)[0]
    tables = {data[12+i*16:16+i*16].decode('ascii'):struct.unpack_from('>II',data,20+i*16) for i in range(count)}
    cmap, _ = tables['cmap']
    maps = struct.unpack_from('>H',data,cmap+2)[0]
    result = set()
    for index in range(maps):
        platform, encoding, offset = struct.unpack_from('>HHI',data,cmap+4+index*8)
        if platform not in (0,3) or (platform == 3 and encoding not in (1,10)):
            continue
        start = cmap + offset
        fmt = struct.unpack_from('>H',data,start)[0]
        if fmt == 12:
            groups = struct.unpack_from('>I',data,start+12)[0]
            for n in range(groups):
                first, last, glyph = struct.unpack_from('>III',data,start+16+n*12)
                result.update(code for code in range(first,last+1) if glyph+code-first != 0)
        elif fmt == 4:
            segments = struct.unpack_from('>H',data,start+6)[0] // 2
            end_pos = start+14
            begin_pos = end_pos+segments*2+2
            delta_pos = begin_pos+segments*2
            range_pos = delta_pos+segments*2
            for n in range(segments):
                first = struct.unpack_from('>H',data,begin_pos+n*2)[0]
                last = struct.unpack_from('>H',data,end_pos+n*2)[0]
                delta = struct.unpack_from('>h',data,delta_pos+n*2)[0]
                distance = struct.unpack_from('>H',data,range_pos+n*2)[0]
                for code in range(first,last+1):
                    if code == 65535:
                        continue
                    gid = struct.unpack_from('>H',data,range_pos+n*2+distance+(code-first)*2)[0] if distance else code
                    if distance and not gid:
                        continue
                    if (gid+delta) % 65536:
                        result.add(code)
    return result


def svg(size, body, defs=''):
    w,h = size
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{body}</svg>\n'


def textured(size, path, colors, opacity, seed, extra=''):
    w,h = size
    defs = f'<linearGradient id="wash" x2="0.8" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient><clipPath id="cut"><path d="{path}"/></clipPath><filter id="grain" x="0" y="0" width="{w}" height="{h}" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".48 .64" numOctaves="3" seed="{seed}"/><feColorMatrix type="saturate" values="0"/></filter>'
    body = f'<g clip-path="url(#cut)"><path d="{path}" fill="url(#wash)"/><rect width="{w}" height="{h}" filter="url(#grain)" opacity="{opacity}" style="mix-blend-mode:multiply"/>{extra}</g>'
    return svg(size,body,defs)


def materials(config):
    paper, wave = config['paper'],config['wave']
    seed = config['seed']
    outputs = {}
    outputs['dialogue-paper'] = textured(paper['size'],paper['path'],['#fbf7ed','#efe4d1'],paper['grainOpacity'],seed,
        f'<path d="{paper["edge"]}" fill="none" stroke="#fffaf0" stroke-width="2.2" opacity=".9"/>')
    foam = ''.join(f'<path d="{d}" fill="none" stroke="#edf5e7" stroke-width="{2 if i else 1.4}" opacity=".9"/>' for i,d in enumerate(wave['foam']))
    rng = random.Random(seed)
    speckles = ''.join(f'<ellipse cx="{rng.randrange(1672)}" cy="{rng.randrange(342)}" rx="{rng.uniform(.4,2.5):.2f}" ry="{rng.uniform(.3,1.4):.2f}" fill="#eef4e9" opacity="{rng.uniform(.2,.75):.2f}"/>' for _ in range(2100))
    outputs['dialogue-wave'] = textured(wave['size'],wave['path'],['#237f8d','#94cbd1'],wave['grainOpacity'],seed+1,foam+speckles)
    foam_filter = '<filter id="foam-grain" x="0" y="0" width="1672" height="342" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".39 .62" numOctaves="2" seed="24"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  4 0 0 0 -1.7"/></filter>'
    outputs['dialogue-wave'] = outputs['dialogue-wave'].replace('</defs>',foam_filter+'</defs>').replace('</g>', '<rect width="1672" height="342" filter="url(#foam-grain)" opacity=".68"/></g>')
    for variant, colors in [('gold',['#ffe892','#f6cf68']),('plain',['#fcf9ef','#eee7d9'])]:
        shape = config['choices'][variant]
        outputs[f'choice-{variant}'] = textured(shape['size'],shape['path'],colors,.12,seed+2,
            f'<path d="{shape["path"]}" fill="none" stroke="{colors[0]}" stroke-width="1.5"/>')
    outputs['date-paper'] = textured(config['date']['size'],config['date']['path'],['#fcf7e9','#e8dfcc'],.15,seed+3)
    outputs['insignia'] = svg([96,64], '<g fill="#087185"><path d="M25 27 C16 25 15 15 23 11 C32 6 39 11 38 18 C37 28 31 34 21 38 L20 33 C26 31 29 28 30 25 C29 27 27 28 25 27 Z"/><path d="M49 24 C39 22 41 10 48 7 C58 3 64 9 62 17 C61 26 54 33 44 36 L43 31 C48 29 53 24 53 21 C53 23 50 25 49 24 Z"/><path d="M5 50 C23 33 37 39 53 43 C70 48 79 43 91 34 C82 51 69 55 49 49 C32 43 20 44 5 50 Z"/><path d="M0 58 C18 48 32 50 51 56 C66 62 80 57 90 49 C79 63 62 67 44 60 C26 54 16 52 0 58 Z" opacity=".8"/></g>')
    icons = {
        'quill':'<path d="M6 25 Q13 8 27 3 Q29 10 23 17 L17 20 L14 24 L6 25Z" fill="#087185" stroke="none"/><path d="M3 29 L24 7 M6 24 L13 25 M7 28 L22 28"/>',
        'chat':'<path d="M6 5 Q1 6 1 13 V18 Q2 25 10 25 L7 30 L17 25 H22 Q30 24 30 16 V12 Q30 5 22 5Z"/><circle cx="10" cy="15" r=".8" fill="#087185"/><circle cx="16" cy="15" r=".8" fill="#087185"/><circle cx="22" cy="15" r=".8" fill="#087185"/>',
        'proof':'<path d="M8 3 H27 V29 H8Z M5 5 H2 V31 H24 M12 7 H23 V14 H12Z M12 18 H23 M12 22 H23 M12 26 H20"/>',
        'chevron':'<path d="M12 7 L21 16 L12 25"/>',
        'return':'<path d="M27 6 V19 H6 M12 12 L5 19 L12 26"/>',
        'back':'<path d="M28 16 H4 M12 8 L4 16 L12 24"/>',
    }
    symbols = ''.join(f'<symbol id="{name}" viewBox="0 0 32 32" fill="none" stroke="#087185" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{paths}</symbol>' for name,paths in icons.items())
    uses = ''.join(f'<use href="#{name}" x="{index*64+16}" y="16" width="32" height="32"/>' for index,name in enumerate(icons))
    outputs['icons'] = svg([384,64],uses,symbols)
    outputs['sun-seal'] = svg([87,127], '<g stroke="#cda03d" fill="none" stroke-width="1.4"><circle cx="30" cy="28" r="12" fill="#f7d47a"/>' + ''.join(f'<path d="M30 6V0" transform="rotate({i*30} 30 28)"/>' for i in range(12)) + '</g><g fill="none" stroke="#087185" stroke-width="1.4" opacity=".8"><path d="M0 72 Q26 55 56 72 Q71 79 83 72 M0 78 Q26 61 56 78 Q71 85 83 78 M0 93 Q26 76 56 93 Q71 100 83 93 M0 109 Q26 92 56 109 Q71 116 83 109"/><path d="M48 67 L57 46 L64 46 L69 68 M53 56 H65 M54 49 H64 M58 40 H64 V46 H58 Z"/></g>')
    outputs['foreground-note'] = svg([392,222], '<g filter="url(#soft)"><path d="M99 0 L344 47 L317 222 L66 222 Z" fill="#e6dbc4" stroke="#bdb09a" stroke-width="2"/><path d="M110 15 L328 54 L303 219 L85 222 Z" fill="#f6edda"/><g fill="#66876d"><path d="M344 40 Q380 55 382 107 Q348 107 344 40 M349 126 Q285 118 269 149 Q311 177 349 126 M320 196 Q352 154 387 171 Q381 221 320 196"/><path d="M58 151 Q17 112 0 133 Q-1 182 58 151"/></g><path d="M108 58 L272 86 M104 77 L268 105 M97 98 L214 120" stroke="#71877f" stroke-width="1" opacity=".28"/></g>', '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>')
    buildings = []
    for n in range(42):
        x = 50+n*16+rng.randrange(-5,6)
        y = 92+rng.randrange(-18,33)
        w = rng.randrange(11,24)
        h = rng.randrange(12,36)
        buildings.append(f'<path d="M{x} {y+h}V{y}H{x+w}V{y+h}M{x-2} {y}L{x+w/2} {y-7}L{x+w+2} {y}"/><path d="M{x+3} {y+5}h3v5h-3z M{x+w-6} {y+5}h3v5h-3z"/>')
    etching = '<g stroke="#5a9da5" fill="none" stroke-width="1" opacity=".7">' + ''.join(buildings) + '<path d="M23 168V62H36V168 M19 62H40L32 48H26Z M23 70H36 M26 83V90 M26 105V112 M28 45V35 M14 173H63 M166 171V79H178V171 M161 79H183L175 68H170Z M169 61H177V68 M510 181V90L552 75 M510 96H558 M551 76V129 M300 168V120L343 106 M310 118H346 M342 106V144"/><path d="M0 173 Q128 159 231 175 T465 177 T770 181 M0 187 Q128 171 231 188 T465 190 T770 193"/><path d="M67 73q5-6 10 0q5-6 10 0 M198 54q5-6 10 0q5-6 10 0 M126 97q4-4 8 0q4-4 8 0"/></g>'
    outputs['harbor-print'] = svg([770,195], '<path d="M0 157 L98 71 L147 113 L259 85 L359 137 L459 98 L544 154 L665 120 L770 172 V195 H0Z" fill="#9ec6c7" opacity=".34"/>'+etching)
    return outputs


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--build',action='store_true')
    group.add_argument('--check',action='store_true')
    args = parser.parse_args()
    config = load(PACK / 'masters/materials.json')
    pilot_path = ROOT / 'content/ui/coastal-replica-pilot.json'
    pilot = load(pilot_path)
    scene = pilot['dialoguePilot']
    prompts = load(PACK / 'prompts.json')
    font_manifest = load(ROOT / 'assets/fonts/coastal-replica/manifest.json')
    # Full Vietnamese precomposed set, base letters, combining marks, ASCII text.
    required = set(range(0x1ea0,0x1efa)) | {0x102,0x103,0x110,0x111,0x128,0x129,0x168,0x169,0x1a0,0x1a1,0x1af,0x1b0,0x300,0x301,0x303,0x309,0x323}
    font_checks = []
    for font in font_manifest['fonts']:
        for item in font['files']:
            if sha((ROOT / item['path']).read_bytes()) != item['sha256']:
                raise ValueError('Font/source hash changed: '+item['path'])
        path = ROOT / font['files'][0]['path']
        missing = required - glyphs(path)
        if missing:
            raise ValueError(f'{font["family"]} lacks Vietnamese glyphs: {sorted(missing)}')
        font_checks.append({'family':font['family'],'vietnameseCodepointsChecked':len(required),'missing':[]})
    outputs = {ROOT / 'content/ui/coastal-replica-data.js':
               ('// Generated by tools/build_replica_assets.py; edit coastal-replica-pilot.json.\nexport default '+dump(pilot).rstrip()+';\n').encode('utf-8')}
    vector = materials(config)
    entries = []
    uses = {}
    def use(asset,layer,bounds,region,text_keys=None,registration=False,clip=None):
        uses.setdefault(asset,[]).append({'screen':'dialogue-pilot','region':region,'layer':layer,
            'z':{'scene':10,'portraits':20,'wave':30,'paper':40,'print':50,'text':60,'foreground':70}[layer],
            'targetBounds':bounds,'placementPivot':bounds[:2],'pivotRole':'top-left placement; motion pivot remains separate',
            'registration':'visible-alpha envelope, uniform scale/crop' if registration else 'native authored material rectangle',
            'textKeys':text_keys or [],'clip':clip})
    use('pilot.newsroom','scene',[0,0,1672,941],'room')
    use('pilot.newsroom','portraits',[0,0,1672,941],'desk-occluder',clip='pilot-desk-clip; y600+; paper/wave above')
    for portrait in scene['portraits']:
        use(portrait['asset'],'portraits',portrait['bounds'],portrait['id'],registration=True)
    use('material.dialogue-wave','wave',scene['paperBounds'],'dialogue-wave')
    paper_keys = [item['key'] for item in scene['text'] if item['id'] in ('speaker','line','continue')]
    use('material.dialogue-paper','paper',scene['paperBounds'],'dialogue-paper',paper_keys)
    use('pilot.harbor-print','print',[0,746,770,195],'paper-harbor',registration=True)
    use('material.insignia','print',[91,689,73,53],'speaker-mark',['ui.replica.dialogue.speaker.1'])
    use('material.insignia','print',[1481,79,150,33],'brand-mark',['ui.replica.dialogue.brand.1'])
    use('material.date-paper','print',[36,30,247,115],'date-paper',['ui.replica.dialogue.date.1','ui.replica.dialogue.date.2'])
    use('material.sun-seal','print',[44,40,87,127],'date-ornament')
    for choice in scene['choices']:
        for asset in ('material.choice-gold','material.choice-plain'):
            use(asset,'print',choice['bounds'],'choice-'+choice['id'],[choice['textKey']])
        x,y,w,h = choice['bounds']
        use('material.icons','print',[x+29,y+16,28,28],'choice-icon-'+choice['icon'],[choice['textKey']])
    for foreground in scene['foreground']:
        use(foreground['asset'],'foreground',foreground['bounds'],'foreground',registration=foreground['visibleRegistration'])
    def entry(asset_id, name, size, kind, bounds, status, source):
        master = PACK / 'masters' / name
        export = PACK / 'exports' / name
        data = outputs.get(master,master.read_bytes() if master.is_file() else b'')
        outputs[export] = data
        entries.append({'id':asset_id,'version':1,'master':master.relative_to(ROOT).as_posix(),
            'source':source,'file':export.relative_to(ROOT).as_posix(),'size':size,'alpha':kind!='opaque',
            'visibleBounds':bounds,'crop':'retain native master; no raster resampling','pivot':[0,0],
            'pivotStatus':'master origin; instance placement pivots recorded; final motion pivot pending R18',
            'instances':uses.get(asset_id,[]),
            'textKeys':sorted({key for instance in uses.get(asset_id,[]) for key in instance['textKeys']}),
            'textPolicy':'no baked player-facing lettering',
            'rights':'project-generated/vector source, prompt/provenance recorded; font licenses tracked separately',
            'status':status,'sha256':sha(data)})
    for name, content in vector.items():
        path = PACK / 'masters' / (name+'.svg')
        data = content.encode('utf-8')
        outputs[path] = data
        parsed = ET.fromstring(content)
        if any(node.tag.endswith('text') for node in parsed.iter()):
            raise ValueError('Text baked into vector art')
        size = [int(parsed.attrib['width']),int(parsed.attrib['height'])]
        entry('material.'+name,name+'.svg',size,'transparent',[0,0,*size],'sample-reviewed; screen parity pending R12-R14',
              'assets/ui/coastal-replica/v1/masters/materials.json')
    # PNGs stay unmodified; decode/alpha inspection only, never edit pixels.
    from PIL import Image
    for item in prompts['outputs']:
        master = PACK / item['file']
        with Image.open(master) as image:
            size = list(image.size)
            alpha = image.getchannel('A') if image.mode == 'RGBA' else None
            bounds = list(alpha.getbbox()) if alpha else [0,0,*size]
            if alpha:
                x1,y1,x2,y2 = bounds
                bounds = [x1,y1,x2-x1,y2-y1]
            entry(item['id'],master.name,size,'transparent' if alpha else 'opaque',bounds,
                  'registration pilot; final pose/background/edges pending R09-R11',
                  'assets/ui/coastal-replica/v1/prompts.json')
    manifest = {'version':1,'pack':'coastal-replica-stage1','stage':config['stage'],
        'sourceReference':config['reference'],'sourceReferenceSHA256':sha((ROOT / config['reference']).read_bytes()),
        'assets':entries,'fonts':font_checks,'fontManifest':'assets/fonts/coastal-replica/manifest.json',
        'compositionSource':pilot_path.relative_to(ROOT).as_posix(),
        'compositionSourceSHA256':sha(pilot_path.read_text(encoding='utf-8').encode('utf-8')),
        'gate':'paper/material/icon sample review only; pilot portraits/background are not G2 assets',
        'extension':'new versioned masters/instances; no speculative runtime engine'}
    known = {asset['id'] for asset in entries}
    if not set(uses) <= known:
        raise ValueError('Scene uses an unknown asset')
    for asset in entries:
        for instance in asset['instances']:
            x,y,w,h = instance['targetBounds']
            if min(x,y) < 0 or min(w,h) <= 0 or x+w > 1672 or y+h > 941:
                raise ValueError('Asset instance leaves stage: '+asset['id'])
    outputs[PACK / 'manifest.json'] = dump(manifest).encode('utf-8')
    for path,data in outputs.items():
        if args.build:
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(data)
        else:
            actual = path.read_bytes() if path.is_file() else None
            if actual is not None and path.suffix != '.png':
                actual = actual.replace(b'\r\n',b'\n')
            if actual != data:
                raise ValueError('Stale export/manifest: '+path.relative_to(ROOT).as_posix())
    print(f'Stage 1 art {"built" if args.build else "checked"}: {len(entries)} assets, 3 local OFL fonts, full Vietnamese glyph coverage; PNG alpha/bytes preserved.')


if __name__ == '__main__':
    main()
