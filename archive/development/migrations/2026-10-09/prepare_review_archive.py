"""Inventory review artifacts before the authorized PowerShell move."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
names=['refactor_content.py','refactor_modules.py','finalize_refactor.py','finish_content.py','prepare_review_archive.py']
paths=[*sorted((ROOT/'tools').glob('*.png')),*[ROOT/'tools'/name for name in names]]
entries=[]
for path in paths:
    destination='archive/development/'+('reviews/' if path.suffix=='.png' else 'migrations/2026-10-09/')+path.name
    entries.append({'source':path.relative_to(ROOT).as_posix(),'destination':destination,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
target=ROOT/'archive/development/manifest.json'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps({'date':'2026-10-09','reason':'Historical review images and completed one-time migration scripts; active runtime assets and tools remain available.','files':entries},indent=2)+'\n',encoding='utf-8')
print(f'Inventoried {len(entries)} files for archival')
