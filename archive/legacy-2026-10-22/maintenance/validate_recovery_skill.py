"""Dependency-free structural validation for this skill's simple YAML subset."""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[3]
skill = root / 'skills' / 'hoi-am-engine-free-development'
installed = Path('C:/Users/anhlh52/.codex/skills/hoi-am-engine-free-development')
document = (skill / 'SKILL.md').read_text(encoding='utf-8')
frontmatter = re.match(r'\A---\n(.*?)\n---\n', document, re.S)
assert frontmatter, 'Missing frontmatter'
fields = dict(line.split(': ', 1) for line in frontmatter[1].splitlines())
assert set(fields) == {'name', 'description'}
assert fields['name'] == skill.name
assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', fields['name'])
assert len(fields['name']) <= 64 and len(fields['description']) <= 1024
assert fields['description'].startswith('Use when ')
assert not re.search(r'\bTODO\b|\bTBD\b|\[INSERT', document)
checked_files = []
for path in sorted(skill.rglob('*')):
    if not path.is_file():
        continue
    relative = path.relative_to(skill)
    if path.suffix == '.md':
        for target in re.findall(r'\]\(([^)]+)\)', path.read_text(encoding='utf-8')):
            if '://' not in target and not target.startswith('#'):
                assert (path.parent / target.split('#')[0]).is_file(), (relative, target)
    counterpart = installed / relative
    assert counterpart.is_file(), f'Installed file missing: {relative}'
    sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
    assert hashlib.sha256(counterpart.read_bytes()).hexdigest() == sha256, f'Installed copy differs: {relative}'
    checked_files.append({'path': relative.as_posix(), 'sha256': sha256})
metadata = (skill / 'agents' / 'openai.yaml').read_text(encoding='utf-8')
assert 'allow_implicit_invocation: true' in metadata
assert '$hoi-am-engine-free-development' in metadata
assert 25 <= len(re.search(r'short_description: "([^"]+)"', metadata)[1]) <= 64
report = {'status': 'passed', 'checks': ['frontmatter and naming', 'local reference links', 'UI metadata', 'installed/source SHA-256 equality'],
          'bundledValidator': 'Unavailable: PyYAML is not installed; no dependencies installed for this reference-only task.',
          'files': checked_files}
output = root / 'archive' / 'legacy-2026-10-22' / 'skill-verification.json'
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'Skill structural checks passed; {len(checked_files)} installed/source files match.')
