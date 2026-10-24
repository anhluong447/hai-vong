"""Conservative literal ES-module reachability gate for the exported player."""
import json,re
from pathlib import Path
from urllib.parse import urlsplit
STATIC=re.compile(r"\b(?:import|export)\s+(?:[^;]*?\s+from\s+)?['\"]([^'\"]+)['\"]")
DYNAMIC=re.compile(r"(?<![\w.$])\bimport\s*\(\s*(['\"])([^'\"]+)\1\s*\)")

def check(root):
    root=Path(root).resolve();errors=[];seen=set()
    def add(code,name):errors.append({'code':code,'sourceId':name,'pointer':'/imports','relatedIds':[]})
    try:
        policy=json.loads((root/'content/pipeline/development.json').read_text(encoding='utf-8'))
        if policy.get('schemaVersion')!=1 or not isinstance(policy.get('playerEntry'),str) or not isinstance(policy.get('forbidden'),list) or any(not isinstance(name,str) or not name for name in policy['forbidden']):raise ValueError('policy')
        def visit(path):
            path=path.resolve()
            if not path.is_relative_to(root):add('architecture.import',str(path));return
            name=path.relative_to(root).as_posix()
            if name in seen:return
            seen.add(name)
            if any(name==item or item.endswith('/') and name.startswith(item) for item in policy['forbidden']):add('architecture.development-in-player',name)
            if not path.is_file():add('architecture.missing-import',name);return
            text=re.sub(r'/\*[\s\S]*?\*/|^\s*//.*$','',path.read_text(encoding='utf-8'),flags=re.M)
            # A class/object method named import is not an ES import expression.
            text=re.sub(r'(?<![\w.$])\bimport\s*\([^)]*\)\s*\{','{',text)
            refs=STATIC.findall(text)+[match[1] for match in DYNAMIC.findall(text)]
            if re.search(r'(?<![\w.$])\bimport\s*\(',DYNAMIC.sub('',text)):add('architecture.dynamic-import-unresolved',name)
            for ref in refs:
                target=urlsplit(ref)
                if target.scheme or target.netloc or not ref.startswith(('.','/')):add('architecture.import',name);continue
                visit(root/target.path.lstrip('/') if ref.startswith('/') else path.parent/target.path)
        visit(root/policy['playerEntry'])
    except (ValueError,OSError,KeyError,TypeError):add('architecture.development-policy.invalid','content/pipeline/development.json')
    return errors
