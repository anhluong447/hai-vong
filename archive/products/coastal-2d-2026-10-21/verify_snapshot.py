"""Verify the frozen 2D product payload without changing it or the live tree."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def verify(compare_live=False):
    manifest = json.loads((HERE / 'INVENTORY.json').read_text(encoding='utf-8'))
    payload = (HERE / 'files').resolve()
    failures, seen, total = [], set(), 0
    for entry in manifest['files']:
        name = entry['path']
        target = (payload / name).resolve()
        if name in seen or not target.is_relative_to(payload) or not target.is_file():
            failures.append(name + ': invalid, duplicate or missing payload path')
            continue
        seen.add(name)
        total += entry['bytes']
        if target.stat().st_size != entry['bytes'] or digest(target) != entry['sha256']:
            failures.append(name + ': payload differs')
        if compare_live:
            live = (ROOT / name).resolve()
            if not live.is_relative_to(ROOT) or not live.is_file() or digest(live) != entry['sha256']:
                failures.append(name + ': live source differs')
    if len(seen) != manifest['fileCount'] or total != manifest['totalBytes']:
        failures.append('Inventory totals differ')
    actual = {p.relative_to(payload).as_posix() for p in payload.rglob('*') if p.is_file()}
    if actual != seen:
        failures.append('Payload contains unexpected files or the inventory is incomplete')
    for failure in failures:
        print(failure)
    print(f"Snapshot: {len(seen)} files; {total:,} bytes; {len(failures)} issue(s)")
    return int(bool(failures))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--compare-live', action='store_true', help='Also compare against current sources; later development may differ')
    args = parser.parse_args()
    sys.exit(verify(args.compare_live))
