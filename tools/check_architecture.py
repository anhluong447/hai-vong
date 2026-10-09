"""Check active import boundaries, text ownership and archived review links."""
import json
from pathlib import Path
import re
import sys
from js_source import literals

ROOT=Path(__file__).resolve().parent.parent

def main():
    errors=[]
    raw=(ROOT/'content/locales/vi.js').read_text(encoding='utf-8')
    catalog=json.loads(raw[raw.index('export default ')+15:].rstrip().removesuffix(';'))
    for path in [*ROOT.joinpath('src').rglob('*.js'),*ROOT.joinpath('content').rglob('*.js')]:
        relative=path.relative_to(ROOT).as_posix()
        source=path.read_text(encoding='utf-8')
        imports=re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',source)
        for specifier in imports:
            if not specifier.startswith('.'):continue
            target=(path.parent/specifier.split('?')[0]).resolve()
            if not target.is_file():errors.append(f'{relative}: missing import {specifier}');continue
            destination=target.relative_to(ROOT).as_posix()
            if destination.startswith('archive/'):errors.append(f'{relative}: active code imports archive')
            if relative.startswith(('src/domain/','src/core/')) and not destination.startswith(('src/domain/','src/core/','src/shared/','content/')):errors.append(f'{relative}: domain imports {destination}')
            if relative.startswith('src/application/') and not destination.startswith(('src/application/','src/domain/','src/shared/','content/')):errors.append(f'{relative}: application imports {destination}')
            if relative.startswith('content/') and not destination.startswith(('content/','src/shared/text.js')):errors.append(f'{relative}: content imports {destination}')
        if relative.startswith(('src/domain/','src/core/')) and re.search(r'\b(?:document|window|localStorage|requestAnimationFrame|fetch)\b',source):errors.append(f'{relative}: browser dependency in domain')
        if relative.startswith('src/'):
            for value,start in literals(source):
                if any(ord(char)>127 for char in value):errors.append(f'{relative}:{source.count(chr(10),0,start)+1}: text literal belongs in content')
                # Direct UI prose must use a catalog even when entirely ASCII.
                context=source[max(0,start-90):start]
                if value and re.search(r'(?:button\(\s*|text\([^,]+,\s*)$',context) and re.search(r'[a-zA-Z]',value):errors.append(f'{relative}: direct UI text {value!r}')
        if relative!='content/locales/vi.js':
            for key in re.findall(r'\bt\([\'\"]([^\'\"]+)[\'\"]',source):
                if key not in catalog:errors.append(f'{relative}: missing text key {key}')
            for key in re.findall(r'\bnote\(s,[\'\"]([^\'\"]+)[\'\"]',source):
                if key not in catalog:errors.append(f'{relative}: missing event text key {key}')
    for path in ROOT.glob('*.html'):
        source=path.read_text(encoding='utf-8')
        if re.search(r'<title>[^<]+</title>|<noscript>[^<]+</noscript>',source):errors.append(f'{path.name}: inline shell text')
    for path in [*ROOT.joinpath('docs').rglob('*.md'),*ROOT.joinpath('assets').rglob('*.md'),ROOT/'README.md']:
        source=path.read_text(encoding='utf-8')
        for link in re.findall(r'\]\(([^)]+archive/development/reviews/[^)]+)\)',source):
            if not (path.parent/link).resolve().is_file():errors.append(f'{path.relative_to(ROOT)}: missing archived review {link}')
    for error in errors:print(error)
    print(f'Architecture check: {len(errors)} issue(s); {len(catalog)} text entries')
    return int(bool(errors))

if __name__=='__main__':sys.exit(main())
