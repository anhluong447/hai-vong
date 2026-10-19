"""Verify frozen menu payload; optionally compare with the current working tree."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--compare-live', action='store_true')
args = parser.parse_args()
snapshot = Path(__file__).resolve().parent
root = snapshot.parents[2]
manifest = json.loads((snapshot / 'INVENTORY.json').read_text(encoding='utf-8'))
errors = []
for entry in manifest['files']:
    candidates = [(snapshot, entry['snapshot'])]
    if args.compare_live:
        candidates.append((root, entry['source']))
    for base, relative in candidates:
        path = (base / relative).resolve()
        if not path.is_relative_to(base) or not path.is_file():
            errors.append(f'Missing or unsafe path: {relative}')
            continue
        data = path.read_bytes()
        if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
            errors.append(f'Content mismatch: {path}')
if len(manifest['files']) != manifest['fileCount']:
    errors.append('Inventory file count mismatch')
if sum(entry['bytes'] for entry in manifest['files']) != manifest['totalBytes']:
    errors.append('Inventory byte count mismatch')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {manifest["fileCount"]} files, {manifest["totalBytes"]} bytes, SHA-256 verified')
