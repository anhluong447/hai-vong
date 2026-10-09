"""One-time content extraction for the October 2026 architecture migration.

Run only against the pre-migration tree. Preserved in the archive after use.
"""
import ast
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
catalog = {}
keys = {}

def write(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(value, encoding='utf-8')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def string_end(source, start):
    quote = source[start]
    i = start + 1
    while i < len(source):
        if source[i] == '\\':
            i += 2
        elif source[i] == quote:
            return i + 1
        else:
            i += 1
    raise ValueError('Unterminated string')

def expression_end(source, start):
    depth, i = 1, start
    while depth:
        if source[i:i+2] == '//':
            i = source.index('\n', i)
        elif source[i:i+2] == '/*':
            i = source.index('*/', i) + 2
        elif source[i] in "'\"":
            i = string_end(source, i)
        elif source[i] == '`':
            i = template(source, i)[0]
        elif source[i] == '{':
            depth += 1
            i += 1
        elif source[i] == '}':
            depth -= 1
            i += 1
        else:
            i += 1
    return i - 1

def template(source, start):
    i, segment = start + 1, start + 1
    parts, expressions = [], []
    while i < len(source):
        if source[i] == '\\':
            i += 2
        elif source[i:i+2] == '${':
            parts.append(source[segment:i])
            end = expression_end(source, i + 2)
            expressions.append(source[i+2:end])
            i = segment = end + 1
        elif source[i] == '`':
            parts.append(source[segment:i])
            return i + 1, parts, expressions
        else:
            i += 1
    raise ValueError('Unterminated template')

EXTRA = {'MAP DEBUG', 'Debug', 'Metrics JSON', 'Energy', 'JSON', 'Q', 'N',
         '2D PIXEL / MAP TEST', 'Sandbox click', 'Dialogue art', 'Sprite lab',
         'HANGOUT / ROMANCE', 'CLB', 'K/T', 'KHUÊ K', '40K / 60T'}

def visible(value):
    return any(ord(c) > 127 for c in value) or value in EXTRA

def register(value, namespace):
    if value in keys:
        return keys[value]
    slug = unicodedata.normalize('NFKD', value.replace('đ','d').replace('Đ','D'))
    slug = re.sub(r'[^a-z0-9]+', '_', slug.encode('ascii','ignore').decode().lower()).strip('_')[:64]
    key = namespace + '.' + (slug or 'text')
    base, count = key, 2
    while key in catalog:
        key = base + '_' + str(count)
        count += 1
    catalog[key] = value
    keys[value] = key
    return key

def transform(source, namespace):
    output, i = [], 0
    while i < len(source):
        if source[i:i+2] == '//':
            end = source.find('\n', i)
            end = len(source) if end < 0 else end
            output.append(source[i:end]); i = end
        elif source[i:i+2] == '/*':
            end = source.index('*/', i) + 2
            output.append(source[i:end]); i = end
        elif source[i] in "'\"":
            end = string_end(source, i)
            raw = source[i:end]
            value = ast.literal_eval(raw)
            output.append('t(' + json.dumps(register(value, namespace)) + ')' if visible(value) else raw)
            i = end
        elif source[i] == '`':
            end, parts, expressions = template(source, i)
            expressions = [transform(expr, namespace) for expr in expressions]
            if visible(''.join(parts)):
                value = ''.join(part + ('{value' + str(n) + '}' if n < len(expressions) else '') for n, part in enumerate(parts))
                params = ', '.join('value' + str(n) + ': (' + expr + ')' for n, expr in enumerate(expressions))
                output.append('t(' + json.dumps(register(value, namespace)) + (', {' + params + '}' if params else '') + ')')
            else:
                output.append('`' + ''.join(part + ('${' + expressions[n] + '}' if n < len(expressions) else '') for n,part in enumerate(parts)) + '`')
            i = end
        else:
            output.append(source[i]); i += 1
    return ''.join(output)

def main():
    # Locale-dependent names must never act as skill identifiers.
    engine = read('src/gameplay/engine.js').replace("'hiệp đồng'", "'synergy'")
    # Move immutable definitions out of behavior before extracting their labels.
    start = engine.index('export const STAT_NAMES')
    end = engine.index('const clone =')
    definitions = engine[start:end].replace('const roster', 'export const roster').replace('const templates', 'export const templates')
    write('content/gameplay/definitions.js', definitions)
    engine = engine[:start] + "import {STAT_NAMES, DEFAULTS, roster, templates, QUEST_STEPS} from '../../content/gameplay/definitions.js';\nexport {STAT_NAMES, DEFAULTS, QUEST_STEPS};\n" + engine[end:]
    write('src/gameplay/engine.js', engine)

    ui = read('src/gameplay/main.js')
    start, end = ui.index('const phases='), ui.index('let state=')
    definitions = ui[start:end].replace('const phases', 'export const phases').replace('const places','export const places')
    write('content/gameplay/presentation.js', definitions)
    ui = ui[:start] + "import {phases, places} from '../../content/gameplay/presentation.js';\n" + ui[end:]
    write('src/gameplay/main.js', ui)

    maps = read('src/pixel/maps.js')
    start, end = maps.index('const yard='), maps.index('export function visibleNPCs')
    helpers_end = maps.index('const yard=')
    header = maps[:helpers_end]
    # Terrain collision is a runtime concern; map authoring helpers belong to content.
    write('content/maps/definitions.js', header + maps[start:end])
    terrain = re.search(r'const terrainBlocked\s*=.*?;', header).group(0)
    write('src/pixel/maps.js', "import {MAPS} from '../../content/maps/definitions.js';\nexport {MAPS};\n" + terrain + '\n' + maps[end:])

    scenes = read('src/pixel/interaction-scenes.js')
    write('content/dialogue/interaction-scenes.js', scenes)
    write('src/pixel/interaction-scenes.js', "// Compatibility entry point for existing tools and tests.\nexport {INTERACTION_SCENES} from '../../content/dialogue/interaction-scenes.js';\n")

    write('content/sandbox/fixtures.js', read('src/core/fixtures.js'))
    write('src/core/fixtures.js', "export {STAFF, NEED_NAMES, createSubjects} from '../../content/sandbox/fixtures.js';\n")

    for path in sorted([*ROOT.joinpath('src').rglob('*.js'), *ROOT.joinpath('content').rglob('*.js')]):
        relative = path.relative_to(ROOT)
        namespace = '.'.join(relative.with_suffix('').parts)
        result = transform(path.read_text(encoding='utf-8'), namespace)
        if result != path.read_text(encoding='utf-8'):
            import_path = Path(__import__('os').path.relpath(ROOT / 'src/shared/text.js', path.parent)).as_posix()
            if not import_path.startswith('.'):
                import_path = './' + import_path
            result = "import {t} from '" + import_path + "';\n" + result
            path.write_text(result, encoding='utf-8')
    write('content/locales/vi.js', '// Player-facing text. Keys are stable; edit values without changing logic.\nexport default ' + json.dumps(catalog, ensure_ascii=False, indent=2) + ';\n')
    print(f'Extracted {len(catalog)} text entries')

if __name__ == '__main__':
    main()
