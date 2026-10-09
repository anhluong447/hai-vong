"""Update historical review links after the verified archive move."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[4]
names={path.name for path in (root/'archive/development/reviews').glob('*.png')}
for path in [root/'README.md',*(root/'docs').rglob('*.md'),*(root/'assets').rglob('*.md')]:
    source=path.read_text(encoding='utf-8-sig')
    def replace(match):
        prefix,name=match.groups()
        return prefix+'archive/development/reviews/'+name if name in names else match.group(0)
    updated=re.sub(r'((?:\.\./)*)tools/([\w.-]+\.png)',replace,source)
    if updated!=source:path.write_text(updated,encoding='utf-8')
for filename in ['build_dialogue_review.ps1','build_dialogue_v2_review.ps1']:
    path=root/'tools'/filename
    source=path.read_text(encoding='utf-8-sig')
    for name in names:source=source.replace("$PSScriptRoot '"+name+"'","$PSScriptRoot '../archive/development/reviews/"+name+"'")
    path.write_text(source,encoding='utf-8')
path=root/'tools/run_browser_tests.py'
source=path.read_text(encoding='utf-8').replace('root / "sandbox-preview.png"','root.parent / "archive/development/reviews/sandbox-preview.png"').replace("root / 'sandbox-preview.png'","root.parent / 'archive/development/reviews/sandbox-preview.png'")
path.write_text(source,encoding='utf-8')
print('Updated documentation links and review output destinations')
