"""Capture/verify a byte-preserving legacy snapshot. This script never moves files."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
SNAPSHOT = ROOT / 'archive' / 'legacy-2026-10-22'
PAYLOAD = SNAPSHOT / 'payload'
INVENTORY = SNAPSHOT / 'inventory.json'
NEW_ROOTS = {'.git', 'skills', 'PROJECT-STATE.md'}
PROTECTED = ('docs/design/narrative/', 'docs/design/gameplay/')


def io_path(path: Path) -> Path:
    """Windows ordinary paths can report existing archived files as missing >260 chars."""
    if os.name == 'nt' and not str(path).startswith('\\\\?\\'):
        return Path('\\\\?\\' + str(path.absolute()))
    return path


def digest(path: Path) -> str:
    with io_path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def check_path(path: Path) -> None:
    absolute = path.resolve()
    if not absolute.is_relative_to(ROOT) or absolute == ROOT:
        raise ValueError(f'Path outside intended workspace: {path}')
    native = io_path(path)
    if native.is_symlink() or native.is_junction():
        raise ValueError(f'Reparse point needs explicit handling: {path}')


def source_files():
    for directory, folders, files in os.walk(ROOT, followlinks=False):
        current = Path(directory)
        relative = current.relative_to(ROOT)
        if current == ROOT:
            folders[:] = sorted(folder for folder in folders if folder not in NEW_ROOTS)
        if relative == Path('archive'):
            folders[:] = sorted(folder for folder in folders if folder != SNAPSHOT.name)
        for folder in folders:
            check_path(current / folder)
        for name in sorted(files):
            if current == ROOT and name in NEW_ROOTS:
                continue
            path = current / name
            check_path(path)
            yield path


def capture() -> None:
    if INVENTORY.exists() or PAYLOAD.exists():
        raise RuntimeError('Refusing to recapture an existing snapshot or payload')
    SNAPSHOT.mkdir(parents=True, exist_ok=True)
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0'))
    roots = sorted(path.name for path in ROOT.iterdir() if path.name not in NEW_ROOTS and path.name != 'archive')
    archive_entries = sorted(path.name for path in (ROOT / 'archive').iterdir() if path != SNAPSHOT)
    entries = []
    started = time.monotonic()
    for index, path in enumerate(source_files(), 1):
        relative = path.relative_to(ROOT).as_posix()
        before = path.stat()
        sha256 = digest(path)
        after = path.stat()
        if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise RuntimeError(f'File changed during capture: {relative}')
        entries.append({'path': relative, 'bytes': before.st_size, 'sha256': sha256,
                        'tracked': relative in tracked, 'retained': relative.startswith(PROTECTED)})
        if index % 2000 == 0:
            print(f'Captured {index} files ({time.monotonic() - started:.1f}s)', flush=True)
    document = {'schemaVersion': 1, 'createdDate': '2026-10-22', 'timezone': 'Asia/Bangkok',
                'originalRoot': str(ROOT), 'payload': 'payload', 'rootsToMove': roots,
                'archiveEntriesToMove': archive_entries, 'protectedRoots': [p.rstrip('/') for p in PROTECTED],
                'fileCount': len(entries), 'totalBytes': sum(e['bytes'] for e in entries), 'entries': entries}
    INVENTORY.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Inventory complete: {len(entries)} files, {document["totalBytes"]} bytes; '
          f'{sum(e["retained"] for e in entries)} protected documents.', flush=True)


def verify() -> None:
    inventory = json.loads(INVENTORY.read_text(encoding='utf-8'))
    errors = []
    started = time.monotonic()
    for index, entry in enumerate(inventory['entries'], 1):
        archived = PAYLOAD / entry['path']
        check_path(archived)
        archived_io = io_path(archived)
        if not archived_io.is_file():
            errors.append({'path': entry['path'], 'error': 'archived file missing'})
            continue
        if archived_io.stat().st_size != entry['bytes'] or digest(archived) != entry['sha256']:
            errors.append({'path': entry['path'], 'error': 'archive bytes mismatch'})
        if entry['retained']:
            retained = ROOT / entry['path']
            if not io_path(retained).is_file() or digest(retained) != entry['sha256']:
                errors.append({'path': entry['path'], 'error': 'protected original changed or missing'})
        if index % 2000 == 0:
            print(f'Verified {index} files ({time.monotonic() - started:.1f}s)', flush=True)
    actual = set()
    walk_root = io_path(PAYLOAD)
    for directory, folders, files in os.walk(walk_root, followlinks=False):
        relative = Path(directory).relative_to(walk_root)
        for folder in folders:
            check_path(PAYLOAD / relative / folder)
        actual.update((relative / name).as_posix() for name in files)
    expected = {entry['path'] for entry in inventory['entries']}
    for extra in sorted(actual - expected):
        errors.append({'path': extra, 'error': 'unexpected archived file'})
    report = {'schemaVersion': 1, 'verifiedDate': '2026-10-22', 'timezone': 'Asia/Bangkok',
              'status': 'passed' if not errors else 'failed', 'filesVerified': len(expected),
              'totalBytes': inventory['totalBytes'],
              'protectedDocumentsVerified': sum(e['retained'] for e in inventory['entries']),
              'inventorySha256': digest(INVENTORY), 'windowsExtendedLengthPaths': os.name == 'nt', 'errors': errors}
    (SNAPSHOT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True), flush=True)
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in {'capture', 'verify'}:
        raise SystemExit('Usage: python archive_inventory.py capture|verify')
    {'capture': capture, 'verify': verify}[sys.argv[1]]()
